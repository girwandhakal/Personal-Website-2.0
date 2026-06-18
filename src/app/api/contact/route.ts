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

  return NextResponse.json({
    ok: true,
    message: "Message received. Girwan will follow up soon.",
    data: result.data
  });
}
