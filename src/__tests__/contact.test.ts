import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/contact/route";
import { validateContactPayload } from "@/lib/contact";

describe("contact validation", () => {
  it("accepts a complete contact submission", () => {
    expect(
      validateContactPayload({
        name: "Ada Lovelace",
        email: "ada@example.com",
        message: "I would like to talk about a software role."
      })
    ).toEqual({
      ok: true,
      data: {
        name: "Ada Lovelace",
        email: "ada@example.com",
        message: "I would like to talk about a software role."
      }
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

  it("accepts browser form submissions from the contact form", async () => {
    const form = new FormData();
    form.set("name", "Grace Hopper");
    form.set("email", "grace@example.com");
    form.set("message", "I want to discuss a frontend engineering role.");

    const response = await POST(
      new Request("http://localhost/api/contact", {
        method: "POST",
        body: form
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.email).toBe("grace@example.com");
  });
});
