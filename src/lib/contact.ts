export type ContactPayload = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
};

type ContactErrors = {
  name?: string;
  email?: string;
  message?: string;
};

export type ContactResult =
  | {
      ok: true;
      data: {
        name: string;
        email: string;
        message: string;
      };
    }
  | {
      ok: false;
      errors: ContactErrors;
    };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateContactPayload(payload: ContactPayload): ContactResult {
  const data = {
    name: clean(payload.name),
    email: clean(payload.email),
    message: clean(payload.message)
  };

  const errors: ContactErrors = {};

  if (!data.name) {
    errors.name = "Name is required.";
  }

  if (!emailPattern.test(data.email)) {
    errors.email = "Use a valid email address.";
  }

  if (data.message.length < 10) {
    errors.message = "Message must be at least 10 characters.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, data };
}
