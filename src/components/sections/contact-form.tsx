"use client";

import { Send } from "lucide-react";
import { useState, type FormEvent } from "react";

type FormState = {
  tone: "idle" | "success" | "error";
  message: string;
};

const initialState: FormState = {
  tone: "idle",
  message: "Contact form status"
};

export function ContactForm() {
  const [state, setState] = useState<FormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setState({ tone: "idle", message: "Sending message..." });

    const form = event.currentTarget;
    const response = await fetch("/api/contact", {
      method: "POST",
      body: new FormData(form)
    });
    const body = (await response.json().catch(() => null)) as { message?: string } | null;

    if (response.ok) {
      form.reset();
      setState({
        tone: "success",
        message: body?.message ?? "Message received. Girwan will follow up soon."
      });
    } else {
      setState({
        tone: "error",
        message: body?.message ?? "Check the fields and try again."
      });
    }

    setIsSubmitting(false);
  }

  return (
    <form className="contact-form" action="/api/contact" method="post" onSubmit={handleSubmit}>
      <label>
        Name
        <input name="name" autoComplete="name" required />
      </label>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Message
        <textarea name="message" rows={5} required />
      </label>
      <p className={`form-status form-status-${state.tone}`} role="status" aria-label="Contact form status">
        {state.message}
      </p>
      <button className="button button-primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending" : "Send Message"}
        <Send aria-hidden="true" size={19} />
      </button>
    </form>
  );
}
