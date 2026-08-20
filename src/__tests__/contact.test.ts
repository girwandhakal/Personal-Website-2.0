import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { validateContactPayload } from "@/lib/contact";

// The route talks to Postgres (via Prisma) for rate limiting and to EmailJS over
// the network to actually send mail. Both are mocked so these tests are
// deterministic and don't depend on live infrastructure or send real email.
const emailSubmissionCount = vi.fn();
const emailSubmissionCreate = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    emailSubmission: {
      count: (...args: unknown[]) => emailSubmissionCount(...args),
      create: (...args: unknown[]) => emailSubmissionCreate(...args)
    }
  }
}));

function jsonRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body)
  });
}

const validPayload = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "I would like to talk about a software role."
};

describe("contact validation", () => {
  it("accepts a complete contact submission", () => {
    expect(validateContactPayload(validPayload)).toEqual({
      ok: true,
      data: validPayload
    });
  });

  it("rejects missing fields and invalid email addresses", () => {
    const result = validateContactPayload({
      name: "",
      email: "not-an-email",
      message: "short"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual({
        name: "Name is required.",
        email: "Use a valid email address.",
        message: "Message must be at least 10 characters."
      });
    }
  });
});

describe("POST /api/contact", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    emailSubmissionCount.mockReset().mockResolvedValue(0);
    emailSubmissionCreate.mockReset().mockResolvedValue({});
    vi.stubEnv("EMAILJS_SECRET", "service_test");
    vi.stubEnv("EMAILJS_TEMPLATE_ID", "template_test");
    vi.stubEnv("EMAILJS_PUBLIC_KEY", "public_test");
    vi.stubEnv("EMAILJS_PRIVATE_KEY", "private_test");
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("sends the message and records the submission on the happy path", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("OK", { status: 200 }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { POST } = await import("@/app/api/contact/route");
    const response = await POST(jsonRequest(validPayload, { "x-device-fingerprint": "fp-1" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, data: validPayload });

    // Confirms the actual send happened, not just a well-formed response.
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.emailjs.com/api/v1.0/email/send",
      expect.objectContaining({ method: "POST" })
    );
    const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(sentBody).toMatchObject({
      service_id: "service_test",
      template_id: "template_test",
      user_id: "public_test",
      template_params: expect.objectContaining({ email: "ada@example.com" })
    });

    expect(emailSubmissionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ fingerprint: "fp-1" })
    });
  });

  it("rejects invalid input before attempting to send", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const { POST } = await import("@/app/api/contact/route");
    const response = await POST(
      jsonRequest({ name: "", email: "bad", message: "short" }, { "x-device-fingerprint": "fp-2" })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.errors).toBeDefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("silently accepts (without sending) when the honeypot field is filled", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const { POST } = await import("@/app/api/contact/route");
    const response = await POST(jsonRequest({ ...validPayload, website: "http://spam.example" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("enforces the global one-per-minute rate limit before sending", async () => {
    emailSubmissionCount.mockResolvedValueOnce(1); // global count check
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const { POST } = await import("@/app/api/contact/route");
    const response = await POST(jsonRequest(validPayload));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("enforces the per-device daily limit of 3 before sending", async () => {
    emailSubmissionCount
      .mockResolvedValueOnce(0) // global count check passes
      .mockResolvedValueOnce(3); // device count check trips the limit
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const { POST } = await import("@/app/api/contact/route");
    const response = await POST(jsonRequest(validPayload, { "x-device-fingerprint": "fp-3" }));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // Regression test for the reported bug: a database outage used to throw an
  // unhandled PrismaClientInitializationError from the rate-limit lookup before
  // EmailJS was ever contacted, which the browser reported as a bare network
  // error. The route should fail open and still send the message.
  it("still sends the message when the rate-limit lookup fails (database outage)", async () => {
    emailSubmissionCount.mockRejectedValue(new Error("Can't reach database server"));
    emailSubmissionCreate.mockRejectedValue(new Error("Can't reach database server"));
    const fetchMock = vi.fn().mockResolvedValue(new Response("OK", { status: 200 }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { POST } = await import("@/app/api/contact/route");
    const response = await POST(jsonRequest(validPayload));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalled();
  });

  it("returns a clear error and does not crash when EmailJS is unreachable", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { POST } = await import("@/app/api/contact/route");
    const response = await POST(jsonRequest(validPayload));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.ok).toBe(false);
    expect(body.message).toBeTruthy();
    expect(emailSubmissionCreate).not.toHaveBeenCalled();
  });

  it("returns a clear error when EmailJS responds with a failure status", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("Invalid template", { status: 400 }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { POST } = await import("@/app/api/contact/route");
    const response = await POST(jsonRequest(validPayload));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.ok).toBe(false);
    expect(emailSubmissionCreate).not.toHaveBeenCalled();
  });

  it("returns a distinct timeout error when EmailJS hangs past the deadline", async () => {
    const fetchMock = vi.fn().mockImplementation(() => {
      const err = new Error("The operation was aborted");
      err.name = "TimeoutError";
      return Promise.reject(err);
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { POST } = await import("@/app/api/contact/route");
    const response = await POST(jsonRequest(validPayload));
    const body = await response.json();

    expect(response.status).toBe(504);
    expect(body.ok).toBe(false);
    expect(body.message).toMatch(/taking too long/i);
  });

  it("fails safe with a 503 when EmailJS credentials are not configured", async () => {
    vi.stubEnv("EMAILJS_SECRET", "");
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const { POST } = await import("@/app/api/contact/route");
    const response = await POST(jsonRequest(validPayload));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts browser form submissions (multipart/form-data) from the contact form", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("OK", { status: 200 }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const form = new FormData();
    form.set("name", "Grace Hopper");
    form.set("email", "grace@example.com");
    form.set("message", "I want to discuss a frontend engineering role.");

    const { POST } = await import("@/app/api/contact/route");
    const response = await POST(
      new Request("http://localhost/api/contact", { method: "POST", body: form })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.email).toBe("grace@example.com");
  });
});
