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

export async function POST(request: Request) {
  const ipHash = getClientIpHash(request);
  const fingerprint = request.headers.get("x-device-fingerprint") || "unknown";

  // Global rate limit: max 1 per minute across everyone
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const globalCount = await prisma.emailSubmission.count({
    where: { createdAt: { gte: oneMinuteAgo } }
  });
  if (globalCount >= 1) {
    return NextResponse.json({ ok: false, message: "Server is currently busy processing other messages. Please wait a minute and try again." }, { status: 429 });
  }

  // Device rate limit: max 3 per day per device
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const deviceCount = await prisma.emailSubmission.count({
    where: { fingerprint, createdAt: { gte: oneDayAgo } }
  });
  if (deviceCount >= 3) {
    return NextResponse.json({ ok: false, message: "You have reached your daily limit of 3 messages. Please try again tomorrow." }, { status: 429 });
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

  try {
    const emailRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SECRET, // Using EMAILJS_SECRET as service_id based on env contents
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        accessToken: process.env.EMAILJS_PRIVATE_KEY,
        template_params: {
          name: result.data.name,
          from_name: result.data.name,
          email: result.data.email,
          reply_to: result.data.email,
          message: result.data.message,
        },
      }),
    });

    if (!emailRes.ok) {
      console.error("EmailJS Error:", await emailRes.text());
      return NextResponse.json(
        { ok: false, message: "Failed to send email. Please try again later." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("EmailJS Fetch Error:", error);
    return NextResponse.json(
      { ok: false, message: "Failed to send email. Please try again later." },
      { status: 500 }
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

