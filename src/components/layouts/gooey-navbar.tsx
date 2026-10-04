"use client";

/**
 * Gooey Navbar — adapted from uselayouts (MIT), https://uselayouts.com
 *
 * A row of pills that melt into their neighbour when hovered or active: the
 * pills and the liquid "bridges" between them are one SVG path, recomputed
 * every frame of a small spring solver.
 *
 * Changes from the original:
 * - Label widths are measured after mount (with the page's real font) instead
 *   of during render, so server and client markup match.
 * - Controlled `activeIndex` may be -1 (nothing active — e.g. over the hero).
 * - Keyboard focus drives the same hover state as the pointer.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

function fmt(n: number): string {
  if (isNaN(n) || !isFinite(n)) return "0";
  return (Math.round(n * 100) / 100).toString();
}

type Rect = { x: number; y: number; width: number; height: number };

function getPillPath(rect: Rect, radius: number) {
  const r = Math.min(radius, rect.width / 2, rect.height / 2);
  const { x, y, width: w, height: h } = rect;
  return [
    `M${fmt(x)} ${fmt(y + r)}`,
    `A${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(x + r)} ${fmt(y)}`,
    `L${fmt(x + w - r)} ${fmt(y)}`,
    `A${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(x + w)} ${fmt(y + r)}`,
    `L${fmt(x + w)} ${fmt(y + h - r)}`,
    `A${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(x + w - r)} ${fmt(y + h)}`,
    `L${fmt(x + r)} ${fmt(y + h)}`,
    `A${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(x)} ${fmt(y + h - r)}`,
    "Z"
  ].join(" ");
}

/** Tangent-arc bridge between two neighbouring pills; null when they're apart. */
function getGooeyBridgePath(e: Rect, t: Rect, cornerRadius: number, neckHeight: number, pushFactor: number) {
  if (pushFactor <= 0.02) return null;
  const a = e.height;
  const o = e.y + a / 2;
  const s = Math.min(cornerRadius, a / 2, e.width / 2, t.width / 2);
  if (s <= 0) return null;
  const c = e.x + e.width;
  const l = t.x;
  const u = l - c;
  if (u < 0) return null;
  const d = Math.min((neckHeight / 2) * pushFactor, a / 2 - 0.5);
  const f = u / 2 + s;
  const p = d - a / 2 + s;
  const m = 2 * (p - s);
  if (Math.abs(m) < 1e-4) return null;
  const h = (s * s - f * f - p * p) / m;
  if (!(h > 0) || s + h < f) return null;
  const g = Math.sqrt(Math.max(0, (s + h) * (s + h) - f * f));
  const mid = (c + l) / 2;
  const v = c - s;
  const y = e.y + s;
  const ee = mid - v;
  const b = e.y + s - g - y;
  const hyp = Math.hypot(ee, b) || 1;
  const te = v + (s * ee) / hyp;
  const S = y + (s * b) / hyp;
  const C = 2 * mid - te;
  return [
    `M${fmt(te)} ${fmt(S)}`,
    `A${fmt(h)} ${fmt(h)} 0 0 0 ${fmt(C)} ${fmt(S)}`,
    `L${fmt(C)} ${fmt(2 * o - S)}`,
    `A${fmt(h)} ${fmt(h)} 0 0 0 ${fmt(te)} ${fmt(2 * o - S)}`,
    "Z"
  ].join(" ");
}

export interface GooeyNavItem {
  label: string;
  link: string;
}

export interface GooeyNavbarProps {
  items: GooeyNavItem[];
  /** Controlled active pill; -1 for none. */
  activeIndex: number;
  onSelect?: (index: number, item: GooeyNavItem) => void;
  ariaLabel?: string;
  pillColor?: string;
  textColor?: string;
  hoverTextColor?: string;
  fontSize?: number;
  paddingX?: number;
  paddingY?: number;
  cornerRadius?: number;
  neighborPush?: number;
  neckRatio?: number;
  stiffness?: number;
  damping?: number;
  mass?: number;
  className?: string;
}

let measureCanvas: HTMLCanvasElement | null = null;

function measureLabelWidth(label: string, fontSize: number, fontFamily: string) {
  const fallback = label.length * fontSize * 0.78;
  measureCanvas ??= document.createElement("canvas");
  const ctx = measureCanvas.getContext("2d");
  if (!ctx) return fallback;
  ctx.font = `600 ${fontSize}px ${fontFamily}`;
  return ctx.measureText(label.toUpperCase()).width;
}

/** Rough widths for the server render and the first client paint. */
function estimateWidths(items: GooeyNavItem[], fontSize: number, paddingX: number) {
  return items.map((item) => Math.ceil(item.label.length * fontSize * 0.74 + paddingX * 2));
}

export function GooeyNavbar({
  items,
  activeIndex,
  onSelect,
  ariaLabel = "Primary navigation",
  pillColor = "rgba(12, 15, 18, 0.78)",
  textColor = "rgba(240, 242, 239, 0.72)",
  hoverTextColor = "rgb(255, 255, 255)",
  fontSize = 13,
  paddingX = 20,
  paddingY = 15,
  cornerRadius = 14,
  neighborPush = 26,
  neckRatio = 0.35,
  stiffness = 260,
  damping = 30,
  mass = 1,
  className = ""
}: GooeyNavbarProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [widths, setWidths] = useState(() => estimateWidths(items, fontSize, paddingX));

  // Measure with the font the page actually renders in, then again once web
  // fonts have finished loading (the first pass may have measured a fallback).
  useLayoutEffect(() => {
    const measure = () => {
      const family = getComputedStyle(containerRef.current ?? document.body).fontFamily || "sans-serif";
      setWidths(items.map((item) => Math.ceil(measureLabelWidth(item.label, fontSize, family) + paddingX * 2)));
    };
    measure();
    let cancelled = false;
    document.fonts?.ready.then(() => { if (!cancelled) measure(); });
    return () => { cancelled = true; };
  }, [items, fontSize, paddingX]);

  const baseRects = useMemo(() => {
    let curX = 0;
    return items.map((_, i) => {
      const w = widths[i] ?? 80;
      const r = { x: curX, y: 0, width: w, height: fontSize + paddingY * 2 };
      curX += w;
      return r;
    });
  }, [items, widths, fontSize, paddingY]);

  const pillHeight = baseRects[0]?.height ?? 44;
  const radius = Math.min(Math.max(cornerRadius, 0), pillHeight / 2);

  const targetPushFactors = useMemo(() => {
    const isTarget = (idx: number) => idx === hoveredIndex || idx === activeIndex;
    return baseRects.slice(0, -1).map((_, idx) => (isTarget(idx) || isTarget(idx + 1) ? 1 : 0));
  }, [baseRects, hoveredIndex, activeIndex]);

  const [animatedPushFactors, setAnimatedPushFactors] = useState<number[]>(() => baseRects.slice(0, -1).map(() => 0));
  const currentPush = useRef<number[]>([]);
  const currentVel = useRef<number[]>([]);

  // Spring solver: each gap's push factor eases toward 0 or 1.
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 1 / 30);
      lastTime = now;
      const pos = currentPush.current;
      const vel = currentVel.current;
      let moving = false;

      for (let i = 0; i < targetPushFactors.length; i++) {
        const target = targetPushFactors[i];
        const p = pos[i] ?? 0;
        const v = vel[i] ?? 0;
        const force = -stiffness * (p - target) - damping * v;
        const nextVel = v + (force / mass) * dt;
        const nextPos = p + nextVel * dt;
        if (Math.abs(nextPos - target) > 0.001 || Math.abs(nextVel) > 0.01) {
          pos[i] = nextPos;
          vel[i] = nextVel;
          moving = true;
        } else {
          pos[i] = target;
          vel[i] = 0;
        }
      }

      pos.length = targetPushFactors.length;
      vel.length = targetPushFactors.length;
      setAnimatedPushFactors([...pos]);
      if (moving) animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [targetPushFactors, stiffness, damping, mass]);

  const getTabPositions = useCallback(
    (factors: number[]) => {
      const positions: number[] = [];
      if (baseRects.length === 0) return positions;
      positions[0] = baseRects[0].x;
      for (let i = 1; i < baseRects.length; i++) {
        positions[i] = positions[i - 1] + baseRects[i - 1].width + neighborPush * (factors[i - 1] ?? 0);
      }
      return positions;
    },
    [baseRects, neighborPush]
  );

  // Centre-anchored: the row grows outward from its middle as gaps open.
  const tabTranslations = useMemo(() => {
    const len = baseRects.length;
    if (len === 0) return [];
    const factors = baseRects.slice(0, -1).map((_, i) => animatedPushFactors[i] ?? 0);
    const pos = getTabPositions(factors);
    const last = len - 1;
    const expansion = pos[last] + baseRects[last].width - pos[0] - (baseRects[last].x + baseRects[last].width - baseRects[0].x);
    return pos.map((p, idx) => p - expansion / 2 - baseRects[idx].x);
  }, [baseRects, animatedPushFactors, getTabPositions]);

  const currentRects = useMemo(
    () => baseRects.map((rect, i) => ({ ...rect, x: rect.x + (tabTranslations[i] ?? 0) })),
    [baseRects, tabTranslations]
  );

  const fullSvgPath = useMemo(() => {
    const paths = currentRects.map((r) => getPillPath(r, radius));
    for (let i = 0; i < currentRects.length - 1; i++) {
      const bridge = getGooeyBridgePath(currentRects[i], currentRects[i + 1], radius, pillHeight * neckRatio, animatedPushFactors[i] ?? 0);
      if (bridge) paths.push(bridge);
    }
    return paths.join(" ");
  }, [currentRects, radius, pillHeight, neckRatio, animatedPushFactors]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const x = e.clientX - container.getBoundingClientRect().left;
    let closest: number | null = null;
    let min = Infinity;
    currentRects.forEach((r, i) => {
      const dist = x < r.x ? r.x - x : x > r.x + r.width ? x - (r.x + r.width) : 0;
      if (dist < min) { min = dist; closest = i; }
    });
    setHoveredIndex(closest);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredIndex(null)}
      className={`relative block w-max select-none ${className}`}
    >
      <svg width="100%" height="100%" aria-hidden="true" focusable="false" className="pointer-events-none absolute inset-0 z-0 overflow-visible">
        <path d={fullSvgPath} fill={pillColor} fillRule="nonzero" />
      </svg>

      <nav aria-label={ariaLabel} className="relative z-10 flex w-max min-w-max items-center justify-center">
        {items.map((item, idx) => {
          const isHovered = hoveredIndex === idx;
          const isActive = activeIndex === idx;
          return (
            <a
              key={item.link}
              href={item.link}
              onClick={(e) => {
                e.preventDefault();
                onSelect?.(idx, item);
              }}
              onMouseEnter={() => setHoveredIndex(idx)}
              onFocus={() => setHoveredIndex(idx)}
              onBlur={() => setHoveredIndex(null)}
              aria-current={isActive ? "location" : undefined}
              className="relative flex shrink-0 items-center justify-center whitespace-nowrap rounded-[inherit] font-semibold uppercase leading-none no-underline will-change-transform focus-visible:outline-offset-2"
              style={{
                fontSize: `${fontSize}px`,
                letterSpacing: "-0.1px",
                width: `${baseRects[idx]?.width ?? 0}px`,
                height: `${pillHeight}px`,
                padding: `0 ${paddingX}px`,
                color: isHovered || isActive ? hoverTextColor : textColor,
                transition: "color 150ms ease",
                transform: `translateX(${tabTranslations[idx] ?? 0}px)`
              }}
            >
              <span>{item.label}</span>
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-[6px] left-1/2 -ml-[2px] size-1 rounded-full bg-current"
                />
              )}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
