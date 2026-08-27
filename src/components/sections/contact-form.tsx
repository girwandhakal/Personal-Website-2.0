"use client";

import { Send, Check, Loader2, XCircle } from "lucide-react";
import { useState, type FormEvent, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

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
    } else if (formState === "error") {
      // Temporary red button state resets after 5 seconds (long enough to
      // actually read a rate-limit explanation, not just see it flash by)
      timeout = setTimeout(() => {
        setFormState("idle");
        setErrorMessage("");
      }, 5000);
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

  return (
    <form ref={formRef} className="contact-form text-left w-full relative" onSubmit={handleSubmit}>
      {/* Honeypot field - visually hidden, screen readers ignore it */}
      <div className="absolute left-[-9999px] top-[-9999px]" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label>
        Name
        <input name="name" autoComplete="name" required disabled={formState === "submitting"} />
      </label>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required disabled={formState === "submitting"} />
      </label>
      <label>
        Message
        <textarea name="message" rows={5} required disabled={formState === "submitting"} />
      </label>

      <button 
        className="button button-primary w-full justify-center mt-2 transition-colors duration-300 relative overflow-hidden" 
        type="submit" 
        disabled={formState === "submitting" || formState === "success"}
        style={
          formState === "error"
            ? {
                // A solid #f03a47 fill would put the message at 3.9:1 against
                // white, under AA for this label size. A tinted panel with a
                // red rule keeps the error reading while staying legible.
                backgroundColor: "color-mix(in srgb, var(--accent) 14%, #ffffff)",
                color: "var(--ink)",
                borderColor: "var(--accent)"
              }
            : {}
        }
      >
        <AnimatePresence mode="wait">
          {formState === "submitting" ? (
            <motion.div key="submitting" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="flex items-center gap-2">
              <span>Sending</span>
              <Loader2 className="animate-spin" aria-hidden="true" size={19} />
            </motion.div>
          ) : formState === "error" ? (
            <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, type: "spring", stiffness: 300 }} className="flex items-center gap-2 px-2 text-sm md:text-base">
              <span className="truncate">{errorMessage || "Failed. Try Again."}</span>
              <XCircle className="flex-shrink-0 text-[var(--accent)]" aria-hidden="true" size={19} />
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }} className="flex items-center gap-2">
              <span>Send Message</span>
              <Send aria-hidden="true" size={19} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Full Form Success Overlay */}
      <AnimatePresence>
        {formState === "success" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute -inset-[1px] z-20 flex flex-col items-center justify-center p-8 text-center bg-[var(--blue)] shadow-2xl rounded-[26px]"
          >
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
              className="bg-white text-[var(--blue)] rounded-full p-4 mb-5 shadow-lg"
            >
              <Check size={56} strokeWidth={4} />
            </motion.div>
            <motion.h3 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-medium text-white tracking-tight mb-2"
            >
              Message Sent!
            </motion.h3>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white/90 font-medium text-lg leading-snug max-w-sm"
            >
              Thank you for reaching out. I'll get back to you shortly.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
