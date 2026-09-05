"use client";

import { ArrowUpRight, Check, Loader2 } from "lucide-react";
import { useState, type FormEvent, useEffect, useRef } from "react";

type FormState = "idle" | "submitting" | "success" | "error";

async function getDeviceFingerprint(): Promise<string> {
  if (typeof window === "undefined") return "server-fallback";
  try {
    const components = [
      navigator.userAgent,
      navigator.language,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
    ];
    const msgBuffer = new TextEncoder().encode(components.join("|"));
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    return "fallback-fingerprint-error";
  }
}

export function ContactForm() {
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  // Clear timers and reset states to prevent permanent UI lock
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (formState === "success") {
      // Temporary success overlay fades away and resets form after 4 seconds
      timeout = setTimeout(() => {
        setFormState("idle");
        if (formRef.current) formRef.current.reset();
      }, 4000);
    }
    
    return () => clearTimeout(timeout);
  }, [formState]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (formState === "submitting" || formState === "success") return;
    
    setFormState("submitting");
    setErrorMessage("");

    // Snapshot the fields synchronously. React nulls `event.currentTarget` once the
    // handler returns, so reading it after the `await` below can throw and get
    // reported as a network error even though no request was ever made.
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const fp = await getDeviceFingerprint();
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "x-device-fingerprint": fp
        },
        body: formData,
        // A cold serverless start can take far longer than a user will wait.
        // Bound it so we can tell "slow" apart from "unreachable".
        signal: AbortSignal.timeout(30_000)
      });

      const body = await response.json().catch(() => null);

      if (response.ok) {
        setFormState("success");
      } else {
        setFormState("error");
        setErrorMessage(body?.message ?? "Check the fields and try again.");
      }
    } catch (error) {
      setFormState("error");
      setErrorMessage(
        error instanceof Error && error.name === "TimeoutError"
          ? "The server took too long to respond. Please try again."
          : "Network error. Please try again later."
      );
    }
  }

  return <form ref={formRef} className="contact-form" onSubmit={handleSubmit}>
    <div hidden aria-hidden="true"><label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <label>Name<input name="name" autoComplete="name" required disabled={formState === "submitting"} /></label>
    <label>Email<input name="email" type="email" autoComplete="email" required disabled={formState === "submitting"} /></label>
    <label>Message<textarea name="message" rows={3} required disabled={formState === "submitting"} /></label>
    <button className="button button-primary" type="submit" disabled={formState === "submitting" || formState === "success"}>
      {formState === "submitting" ? <>Sending<Loader2 size={18} className="animate-spin" aria-hidden="true" /></> : formState === "success" ? <>Sent<Check size={18} aria-hidden="true" /></> : <>Send message<ArrowUpRight size={18} aria-hidden="true" /></>}
    </button>
    <p className="contact-form-status" role="status" aria-label="Contact form status" data-error={formState === "error"}>{formState === "error" ? errorMessage : formState === "success" ? "Thanks. Your message is on its way." : ""}</p>
  </form>;
}
