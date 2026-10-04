"use client";

/**
 * Save Button — adapted from uselayouts (MIT), https://uselayouts.com
 *
 * A pill whose label re-spells itself letter by letter between states, with a
 * small status badge that pops out of its corner: a spinner while working, a
 * tick when done.
 *
 * Changes from the original: the state is controlled by the caller (here, a
 * real form submission) instead of timers, it's a submit button, labels come
 * from props, and an error state shakes the badge in a warning colour.
 */

import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type SaveStatus = "idle" | "loading" | "success" | "error";

export function SaveButton({
  status,
  labels = { idle: "Send", loading: "Sending", success: "Sent", error: "Retry" },
  type = "submit",
  onClick,
  className
}: {
  status: SaveStatus;
  labels?: Record<SaveStatus, string>;
  type?: "submit" | "button";
  onClick?: () => void;
  className?: string;
}) {
  const text = labels[status];
  const busy = status === "loading" || status === "success";

  return (
    <div className={cn("group relative inline-flex", className)}>
      <button
        type={type}
        onClick={onClick}
        disabled={busy}
        className={cn(
          "relative h-12 min-w-[150px] rounded-full px-8 text-base font-medium transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-100",
          busy ? "bg-muted text-muted-foreground shadow-sm" : "bg-foreground text-background hover:bg-[#cfd8e2] active:scale-[0.98]"
        )}
      >
        <span className="flex items-center justify-center">
          <AnimatePresence mode="popLayout" initial={false}>
            {text.split("").map((char, i) => (
              <motion.span
                key={`${char}-${i}`}
                layout
                initial={{ opacity: 0, scale: 0, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0, filter: "blur(4px)" }}
                transition={{ type: "spring", stiffness: 500, damping: 30, mass: 1 }}
                className="inline-block whitespace-pre"
              >
                {char}
              </motion.span>
            ))}
          </AnimatePresence>
        </span>
      </button>

      <div className="pointer-events-none absolute -right-1 -top-1 z-10" aria-hidden="true">
        <AnimatePresence mode="wait">
          {status !== "idle" && (
            <motion.div
              key={status === "error" ? "error" : "badge"}
              initial={{ opacity: 0, scale: 0, x: -8, filter: "blur(4px)" }}
              animate={status === "error" ? { opacity: 1, scale: 1, x: [0, -3, 3, -2, 2, 0], filter: "blur(0px)" } : { opacity: 1, scale: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0, x: -8, filter: "blur(4px)" }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={cn(
                "relative flex size-6 items-center justify-center overflow-visible rounded-full ring-[3px] ring-background",
                status === "success" ? "bg-primary text-primary-foreground" : status === "error" ? "bg-[#f4b4b1] text-[#3b1514]" : "bg-muted text-muted-foreground"
              )}
            >
              <AnimatePresence mode="popLayout">
                {status === "loading" && (
                  <motion.div key="loader" exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12 2A10 10 0 1 0 22 12A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8A8 8 0 0 1 12 20Z" opacity=".5" />
                      <path fill="currentColor" d="M20 12h2A10 10 0 0 0 12 2V4A8 8 0 0 1 20 12Z">
                        <animateTransform attributeName="transform" dur="1s" from="0 12 12" repeatCount="indefinite" to="360 12 12" type="rotate" />
                      </path>
                    </svg>
                  </motion.div>
                )}
                {status === "success" && (
                  <motion.div key="check" initial={{ scale: 0, opacity: 0, filter: "blur(4px)" }} animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }} exit={{ scale: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 25 }} className="absolute inset-0 flex items-center justify-center">
                    <Check className="size-4" strokeWidth={2.5} />
                  </motion.div>
                )}
                {status === "error" && (
                  <motion.div key="err" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute inset-0 flex items-center justify-center">
                    <AlertCircle className="size-4" strokeWidth={2.5} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
