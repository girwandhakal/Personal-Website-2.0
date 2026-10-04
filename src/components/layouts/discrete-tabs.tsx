"use client";

/**
 * Discrete Tabs — adapted from uselayouts (MIT), https://uselayouts.com
 *
 * Icon pills that spring open to reveal their label when chosen; the icon and
 * the pill slide to make room on a shared layout spring, and the newly opened
 * pill catches a brief shine.
 *
 * Changes from the original: a real ARIA tablist (buttons with roles, roving
 * tabindex, arrow keys), controlled from outside, layout ids scoped per
 * instance so two tablists on a page can't animate into each other.
 */

import { LayoutGroup, motion } from "motion/react";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type DiscreteTab = { id: string; title: string; icon: LucideIcon };

const LAYOUT_SPRING = { type: "spring", damping: 20, stiffness: 230, mass: 1.2 } as const;

export function DiscreteTabs({
  tabs,
  active,
  onChange,
  idPrefix,
  ariaLabel,
  className
}: {
  tabs: DiscreteTab[];
  active: string;
  onChange: (id: string) => void;
  /** Tab/panel ids are `${idPrefix}-tab-${id}` / `${idPrefix}-panel-${id}`. */
  idPrefix: string;
  ariaLabel: string;
  className?: string;
}) {
  const group = useId();
  const [interacted, setInteracted] = useState(false);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const index = tabs.findIndex((t) => t.id === active);
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    setInteracted(true);
    onChange(tabs[next].id);
    refs.current[next]?.focus();
  };

  return (
    <LayoutGroup id={group}>
      <div role="tablist" aria-label={ariaLabel} onKeyDown={onKeyDown} className={cn("flex flex-wrap items-center gap-3", className)}>
        {tabs.map((tab, i) => {
          const isActive = tab.id === active;
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              ref={(el) => { refs.current[i] = el; }}
              id={`${idPrefix}-tab-${tab.id}`}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={`${idPrefix}-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              layout
              transition={{ layout: LAYOUT_SPRING }}
              onClick={() => { setInteracted(true); onChange(tab.id); }}
              className={cn(
                "relative flex h-11 items-center gap-1.5 overflow-hidden bg-secondary font-mono text-xs uppercase outline outline-2 outline-border shadow-md transition-colors duration-75 focus-visible:outline-foreground",
                isActive ? "px-4 text-primary" : "px-3 text-muted-foreground hover:text-foreground"
              )}
              style={{ borderRadius: 25 }}
            >
              <motion.span layout="position" className="shrink-0">
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
              </motion.span>
              {isActive ? (
                <motion.span
                  className="whitespace-nowrap font-medium"
                  initial={interacted ? { opacity: 0, filter: "blur(4px)" } : false}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  transition={{ duration: interacted ? 0.2 : 0, ease: [0.86, 0, 0.07, 1] }}
                >
                  {tab.title}
                </motion.span>
              ) : (
                <span className="sr-only">{tab.title}</span>
              )}
              {isActive && interacted && (
                <motion.span
                  key={`shine-${tab.id}`}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                  initial={{ x: "-120%" }}
                  animate={{ x: "320%" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
