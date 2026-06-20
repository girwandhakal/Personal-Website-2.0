import { NextResponse } from "next/server";

import { validateContactPayload } from "@/lib/contact";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const body = contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")
    ? Object.fromEntries(await request.formData())
    : await request.json().catch(() => ({}));
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

  return NextResponse.json({
    ok: true,
    message: "Message received. Girwan will follow up soon.",
    data: result.data
  });
}
