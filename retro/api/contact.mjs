import crypto from 'node:crypto';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ipRateLimits = new Map();

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function validateContact(payload) {
  const data = {
    name: clean(payload.name),
    email: clean(payload.email),
    message: clean(payload.message)
  };

  const errors = {};
  if (!data.name || data.name.length < 2) {
    errors.name = 'Please enter your name.';
  } else if (data.name.length > 100) {
    errors.name = 'Name must be under 100 characters.';
  }

  if (!emailPattern.test(data.email)) {
    errors.email = 'Use a valid email address.';
  } else if (data.email.length > 120) {
    errors.email = 'Email must be under 120 characters.';
  }

  if (data.message.length < 10) {
    errors.message = 'Message must be at least 10 characters.';
  } else if (data.message.length > 3000) {
    errors.message = 'Message must be under 3000 characters.';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, data };
}

function checkRateLimit(ip) {
  const now = Date.now();
  const last = ipRateLimits.get(ip) || 0;
  if (now - last < 30000) { // Max 1 message every 30 seconds per IP
    return false;
  }
  ipRateLimits.set(ip, now);
  // Clean old entries
  if (ipRateLimits.size > 1000) {
    for (const [key, timestamp] of ipRateLimits.entries()) {
      if (now - timestamp > 3600000) ipRateLimits.delete(key);
    }
  }
  return true;
}

export async function handleContact(request, fetchFn = fetch) {
  if (request.method !== 'POST') {
    return Response.json({ ok: false, message: 'Method not allowed.' }, { status: 405 });
  }

  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ ok: false, message: 'Request origin is not allowed.' }, { status: 403 });
  }

  const contentType = request.headers.get('content-type') || '';
  let body = {};

  try {
    if (contentType.includes('application/json')) {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } else if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    }
  } catch {
    return Response.json({ ok: false, message: 'Invalid form data.' }, { status: 400 });
  }

  // Honeypot check: silently succeed if bot filled the hidden website field
  if (body.website) {
    return Response.json({ ok: true, message: 'Message received. Girwan will follow up soon.' });
  }

  const validation = validateContact(body);
  if (!validation.ok) {
    return Response.json(
      { ok: false, errors: validation.errors, message: Object.values(validation.errors)[0] },
      { status: 400 }
    );
  }

  const ip = (request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || '127.0.0.1').split(',')[0].trim();
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

  if (!checkRateLimit(ipHash)) {
    return Response.json(
      { ok: false, message: 'Please wait a moment before sending another message.' },
      { status: 429, headers: { 'Retry-After': '30' } }
    );
  }

  const serviceId = process.env.EMAILJS_SECRET;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.error('EmailJS not configured.');
    return Response.json(
      { ok: false, message: 'Messaging is temporarily unavailable. Please email directly at girwandhakal@gmail.com.' },
      { status: 503 }
    );
  }

  try {
    const res = await fetchFn('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        ...(privateKey ? { accessToken: privateKey } : {}),
        template_params: {
          name: validation.data.name,
          from_name: validation.data.name,
          email: validation.data.email,
          reply_to: validation.data.email,
          message: validation.data.message
        }
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('EmailJS returned status', res.status, errText);
      return Response.json(
        { ok: false, message: 'Failed to send message through email service. Please try again later.' },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('EmailJS send error:', error);
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    return Response.json(
      {
        ok: false,
        message: timedOut
          ? 'The email service took too long to respond. Please try again.'
          : 'Could not connect to the email service. Please try again later.'
      },
      { status: timedOut ? 504 : 502 }
    );
  }

  return Response.json({
    ok: true,
    message: 'Message received. Girwan will follow up soon.'
  }, {
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

export default {
  async fetch(request) {
    return handleContact(request);
  }
};
