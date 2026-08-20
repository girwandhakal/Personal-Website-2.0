import { NextResponse } from "next/server";
import crypto from "crypto";

import { validateContactPayload } from "@/lib/contact";
import { prisma } from "@/lib/db";

function getClientIpHash(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : (realIp || "127.0.0.1");
  return crypto.createHash("sha256").update(ip).digest("hex");
}

type RateLimitVerdict = { exceeded: false } | { exceeded: true; message: string };

async function checkRateLimits(fingerprint: string): Promise<RateLimitVerdict> {
  try {
    // Global rate limit: max 1 per minute across everyone
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const globalCount = await prisma.emailSubmission.count({
      where: { createdAt: { gte: oneMinuteAgo } }
    });
    if (globalCount >= 1) {
      return {
        exceeded: true,
        message: "Server is currently busy processing other messages. Please wait a minute and try again."
      };
    }

    // Device rate limit: max 3 per day per device
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const deviceCount = await prisma.emailSubmission.count({
      where: { fingerprint, createdAt: { gte: oneDayAgo } }
    });
    if (deviceCount >= 3) {
      return {
        exceeded: true,
        message: "You have reached your daily limit of 3 messages. Please try again tomorrow."
      };
    }

    return { exceeded: false };
  } catch (error) {
    console.error("Contact rate-limit lookup failed; allowing the send:", error);
    return { exceeded: false };
  }
}

export async function POST(request: Request) {
  const ipHash = getClientIpHash(request);
  const fingerprint = request.headers.get("x-device-fingerprint") || "unknown";

  // Rate limiting is a nice-to-have; sending the message is the actual job. A
  // database outage used to throw here, before EmailJS was ever contacted, and
  // surfaced in the browser as a bare "Network error". Fail open instead: the
  // honeypot and server-side validation still stand when the counters are down.
  const limit = await checkRateLimits(fingerprint);
  if (limit.exceeded) {
    return NextResponse.json({ ok: false, message: limit.message }, { status: 429 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  const body = contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")
    ? Object.fromEntries(await request.formData())
    : await request.json().catch(() => ({}));

  // Honeypot check: if the hidden field is filled, silently ignore and return success
  if (body.website) {
    return NextResponse.json({
      ok: true,
      message: "Message received. Girwan will follow up soon."
    });
  }

  const result = validateContactPayload(body);

  if (!result.ok) {
    return NextResponse.json(
      {
        ...result,
        message: "Check the fields and try again."
      },
      { status: 400 }
    );
  }

  // Missing credentials would otherwise be sent to EmailJS as `undefined` and come
  // back as a confusing provider-side 400.
  const serviceId = process.env.EMAILJS_SECRET; // EMAILJS_SECRET holds the service_id
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  if (!serviceId || !templateId || !publicKey) {
    console.error(
      "EmailJS is not configured. Missing:",
      [
        !serviceId && "EMAILJS_SECRET",
        !templateId && "EMAILJS_TEMPLATE_ID",
        !publicKey && "EMAILJS_PUBLIC_KEY"
      ].filter(Boolean).join(", ")
    );
    return NextResponse.json(
      { ok: false, message: "Messaging is temporarily unavailable. Please email me directly instead." },
      { status: 503 }
    );
  }

  try {
    const emailRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        accessToken: process.env.EMAILJS_PRIVATE_KEY,
        template_params: {
          name: result.data.name,
          from_name: result.data.name,
          email: result.data.email,
          reply_to: result.data.email,
          message: result.data.message,
        },
      }),
      // Without a deadline a hung provider holds the request open until the
      // platform kills it, which the browser reports as a network error.
      signal: AbortSignal.timeout(10_000),
    });

    if (!emailRes.ok) {
      console.error(`EmailJS Error (status ${emailRes.status}):`, await emailRes.text().catch(() => ""));
      return NextResponse.json(
        { ok: false, message: "Failed to send email. Please try again later." },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("EmailJS Fetch Error:", error);
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json(
      {
        ok: false,
        message: timedOut
          ? "The email service is taking too long to respond. Please try again in a moment."
          : "Failed to send email. Please try again later."
      },
      { status: timedOut ? 504 : 502 }
    );
  }

  // Record submission on success
  try {
    await prisma.emailSubmission.create({
      data: { ipHash, fingerprint }
    });
  } catch (error) {
    console.error("Failed to record email submission telemetry:", error);
  }

  return NextResponse.json({
    ok: true,
    message: "Message received. Girwan will follow up soon.",
    data: result.data
  });
}

