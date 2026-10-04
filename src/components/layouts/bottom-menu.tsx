"use client";

/**
 * Bottom Menu — adapted from uselayouts (MIT), https://uselayouts.com
 *
 * A floating dock. Plain items act immediately; an item with a `panel` springs
 * a sheet open above the dock, sized to its content, and swaps between panels
 * with a blur cross-fade.
 *
 * Changes from the original: items and panels come from props, icons are
 * lucide, measurement uses a local ResizeObserver hook (no react-use-measure),
 * and the panel closes on Escape and outside taps (touch as well as mouse).
 */

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type BottomMenuItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Runs on tap when the item has no panel. */
  onSelect?: () => void;
  /** Content of the sheet this item opens. Receives a close callback. */
  panel?: (close: () => void) => ReactNode;
  active?: boolean;
};

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const box = entry.target.getBoundingClientRect();
      setSize({ width: box.width, height: box.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

export function BottomMenu({ items, className, ariaLabel = "Quick navigation" }: { items: BottomMenuItem[]; className?: string; ariaLabel?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hiddenRef, hiddenBounds] = useElementSize<HTMLDivElement>();
  const [view, setView] = useState<string | null>(null);
  const close = () => setView(null);
  const openItem = items.find((item) => item.id === view && item.panel);
  const content = openItem?.panel?.(close) ?? null;

  useEffect(() => {
    if (!view) return;
    const onPointer = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setView(null);
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setView(null); };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [view]);

  return (
    <div ref={containerRef} className={cn("relative flex flex-col items-center", className)}>
      {/* Off-screen copy of the open panel, measured so the visible sheet can
          animate to the content's natural size. */}
      <div ref={hiddenRef} aria-hidden="true" className="pointer-events-none invisible absolute left-[-9999px] top-[-9999px]">
        <div className="rounded-[18px] border border-border py-1">{content}</div>
      </div>

      <AnimatePresence mode="wait">
        {view && content && (
          <motion.div
            key="submenu"
            initial={{ opacity: 0, scaleY: 0.9, scaleX: 0.95, height: 0, width: 0 }}
            animate={{ opacity: 1, scaleY: 1, scaleX: 1, height: hiddenBounds.height || "auto", width: hiddenBounds.width || "auto" }}
            exit={{ opacity: 0, scaleY: 0.9, scaleX: 0.95, height: 0, width: 0 }}
            transition={{ duration: 0.3, ease: [0.45, 0, 0.25, 1] }}
            style={{ transformOrigin: "bottom center" }}
            className="absolute bottom-[70px] overflow-hidden"
          >
            <div className="rounded-[18px] border border-border bg-background/95 backdrop-blur-xl">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.div
                  key={view}
                  initial={{ opacity: 0, scale: 0.96, filter: "blur(10px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.95, filter: "blur(12px)" }}
                  transition={{ duration: 0.25, ease: [0.42, 0, 0.58, 1] }}
                  className="py-1"
                >
                  {content}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav aria-label={ariaLabel} className="z-10 mt-3 flex items-center gap-1 rounded-[18px] border border-border bg-background/90 p-1 shadow-[0_12px_40px_-12px_#000c] backdrop-blur-xl">
        {items.map(({ id, label, icon: Icon, onSelect, panel, active }) => {
          const open = view === id;
          return (
            <button
              key={id}
              type="button"
              aria-label={label}
              title={label}
              aria-expanded={panel ? open : undefined}
              aria-current={active ? "location" : undefined}
              className={cn(
                "grid size-12 place-items-center rounded-[14px] transition-colors",
                open || active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-muted"
              )}
              onClick={() => {
                if (panel) setView(open ? null : id);
                else { setView(null); onSelect?.(); }
              }}
            >
              <Icon size={21} strokeWidth={1.7} aria-hidden="true" />
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/** The row style the original uses inside panels. */
export const bottomMenuRow =
  "group flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left text-[15px] text-muted-foreground transition-colors duration-75 hover:bg-muted/80 hover:text-foreground";
