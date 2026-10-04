"use client";

/**
 * 3D Book — adapted from uselayouts (MIT), https://uselayouts.com
 *
 * A hardback that opens toward the pointer: the closer the cursor is to the
 * spine, the further the cover swings back and the pages fan out behind it.
 * Press-and-drag does the same on touch.
 *
 * Changes from the original: cover colour, title, subtitle and the inside page
 * come from props; the cover text is legible rather than embossed; focus
 * opens the book part-way so keyboard users see the inside page too; the
 * pages are tinted for a dark site.
 */

import { useRef, useState, type CSSProperties, type ReactNode } from "react";

const TOTAL_PAGES = 12;

export function Book3D({
  title,
  subtitle,
  coverColor = "rgb(158, 27, 50)",
  inside,
  label
}: {
  title: string;
  subtitle: string;
  coverColor?: string;
  /** Shown on the first inside page once the cover swings open. */
  inside: ReactNode;
  /** Accessible description of the whole book. */
  label: string;
}) {
  const bookRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);

  const track = (clientX: number) => {
    const rect = bookRef.current?.getBoundingClientRect();
    if (!rect) return;
    const fromCenter = (clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    // Left of the book's centre opens it fully; right of it closes it.
    setProgress(Math.max(0, Math.min(1, 1 - (fromCenter + 1) / 2)));
  };

  const pages = Array.from({ length: TOTAL_PAGES }, (_, i) => {
    const angle = (i + 2) * 11;
    return (
      <div
        key={i}
        className="absolute h-48 w-32 rounded-r-xl border border-black/10 bg-[#e9ecef] md:h-72 md:w-52"
        style={{
          transformStyle: "preserve-3d",
          transformOrigin: "left",
          transform: `rotateY(calc(var(--book-progress) * ${-angle}deg))`,
          zIndex: 50 + i
        }}
      />
    );
  });

  return (
    <div className="flex w-full items-center justify-center py-6">
      <div
        ref={bookRef}
        role="img"
        aria-label={label}
        tabIndex={0}
        className="relative h-48 w-32 touch-none rounded-r-xl outline-none will-change-transform focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-8 focus-visible:ring-offset-background translate-x-8 md:h-72 md:w-52 md:translate-x-10"
        onPointerMove={(e) => track(e.clientX)}
        onPointerDown={(e) => { setDragging(true); track(e.clientX); }}
        onPointerUp={() => { setDragging(false); setProgress(0); }}
        onPointerLeave={() => { if (!dragging) setProgress(0); }}
        onFocus={() => setProgress(0.82)}
        onBlur={() => setProgress(0)}
        style={{ perspective: "1500px", transformStyle: "preserve-3d", "--book-progress": progress } as CSSProperties}
      >
        {/* Back cover */}
        <div
          className="absolute h-48 w-32 rounded-r-xl border-2 border-white/10 md:h-72 md:w-52"
          style={{ background: "radial-gradient(#2b3238 0 1px, #161a1d 1px 100%) 0 0 / 4px 4px", boxShadow: "0 18px 40px -12px rgba(0,0,0,0.6)", zIndex: 1 }}
        />

        {/* First inside page — what the cover reveals. */}
        <div className="absolute flex h-48 w-32 flex-col justify-center gap-2 rounded-r-xl bg-[#f3f4f5] p-4 pl-6 text-[#20262c] md:h-72 md:w-52 md:p-6 md:pl-8" style={{ zIndex: 49 }}>
          {inside}
        </div>

        {pages}

        {/* Front cover */}
        <div
          className="absolute h-48 w-32 overflow-hidden md:h-72 md:w-52"
          style={{
            transformStyle: "preserve-3d",
            transformOrigin: "left center",
            transform: "rotateY(calc(var(--book-progress) * -165deg))",
            borderRadius: "0 10px 10px 0",
            background: "#1f2428",
            boxShadow: "0 4px 8px rgba(0,0,0,0.25)",
            zIndex: 200,
            transition: "transform 120ms linear"
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 z-30"
            style={{
              borderRadius: "0 10px 10px 0",
              boxShadow: "0 0 0 0.85px rgba(0,0,0,0.25) inset, 2px 0 1px 0 rgba(0,0,0,0.2) inset, -1.5px 0 1px 0 rgba(0,0,0,0.2) inset, 0 2px 2px 0 rgba(255,255,255,0.08) inset"
            }}
          />
          <div className="absolute inset-x-0 top-0 z-10 h-[42%]" style={{ backgroundColor: coverColor }} />
          <div className="absolute bottom-0 left-0 top-0 z-30 flex w-2.5 flex-row justify-end md:w-3.5">
            <div className="h-full w-0.5 bg-white/20" />
            <div className="h-full w-0.5 bg-black/30" />
          </div>
          <div className="absolute bottom-4 left-5 right-3 z-20 select-none md:bottom-6 md:left-7" style={{ backfaceVisibility: "hidden" }}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">{subtitle}</p>
            <p className="mt-1.5 text-lg font-medium leading-tight tracking-tight text-white/90 md:text-2xl">{title}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
