"use client";

/**
 * Stacked Outline Text — adapted from uselayouts (MIT), https://uselayouts.com
 *
 * Heavy outlined type you can pick up and throw around its box. Drag speed
 * pulls a stacked trail of copies out behind it, which springs back into the
 * word the moment it slows down.
 *
 * Changes from the original: colours follow the page (fill matches the
 * background, stroke is the ink colour), the site font is used, the box is
 * sized for a section heading rather than a full-screen demo, and the
 * wrapper is a div so the page decides the heading semantics.
 */

import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue
} from "motion/react";
import { useRef, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

const MIN_STACK = 5;
const MAX_STACK = 10;
const MIN_SHADOW_SPEED = 120;
const MAX_SHADOW_SPEED = 2200;
const MIN_TRAIL = 18;
const MAX_TRAIL = 132;
const KEY_STEP = 32;
const PAD_X = 36;
const PAD_Y = 120;
const shadowSpring = { damping: 28, mass: 0.55, stiffness: 260 };

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

const estimateTextWidth = (text: string, fontSize: number) =>
  Array.from(text).reduce((w, ch) => {
    if (ch === " ") return w + fontSize * 0.3;
    if ("ilI.,'!|’".includes(ch)) return w + fontSize * 0.32;
    if ("mwMWOQ@#".includes(ch)) return w + fontSize * 0.92;
    return w + fontSize * 0.7;
  }, 0);

function ShadowLayer({ text, layer, count, opacity, sx, sy, fill, stroke }: {
  text: string; layer: number; count: number; opacity: MotionValue<number>; sx: MotionValue<number>; sy: MotionValue<number>; fill: string; stroke: string;
}) {
  const depth = layer / count;
  const x = useTransform(sx, (v) => v * depth);
  const y = useTransform(sy, (v) => v * depth);
  const o = useTransform(opacity, (v) => v * (0.34 + depth * 0.66));
  return <motion.text strokeWidth="5" style={{ opacity: o, x, y, fill, stroke }} x="0" y="0">{text}</motion.text>;
}

export function StackedOutlineText({
  text,
  fontSize = 200,
  stacks = MAX_STACK,
  fill = "var(--surface)",
  stroke = "var(--ink)",
  className
}: {
  text: string;
  fontSize?: number;
  stacks?: number;
  fill?: string;
  stroke?: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const vx = useVelocity(x);
  const vy = useVelocity(y);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rawO = useMotionValue(0);
  const sx = useSpring(rawX, shadowSpring);
  const sy = useSpring(rawY, shadowSpring);
  const so = useSpring(rawO, shadowSpring);
  const count = Math.round(clamp(stacks, MIN_STACK, MAX_STACK));
  const layers = Array.from({ length: count }, (_, i) => count - i);

  const width = Math.max(estimateTextWidth(text, fontSize) + PAD_X * 2, fontSize * 2.65);
  const height = fontSize + PAD_Y;
  const viewBox = `${-width / 2} ${-height / 2} ${width} ${height}`;

  const reset = () => { rawX.set(0); rawY.set(0); rawO.set(0); };
  const fromVelocity = (lx: number, ly: number) => {
    if (reduce || !dragging.current) return reset();
    const speed = Math.hypot(lx, ly);
    if (speed < MIN_SHADOW_SPEED) return reset();
    const eased = Math.pow(clamp((speed - MIN_SHADOW_SPEED) / (MAX_SHADOW_SPEED - MIN_SHADOW_SPEED), 0, 1), 0.62);
    const trail = MIN_TRAIL + eased * (MAX_TRAIL - MIN_TRAIL);
    rawX.set((-lx / speed) * trail);
    rawY.set((-ly / speed) * trail);
    rawO.set(0.12 + eased * 0.88);
  };

  useMotionValueEvent(vx, "change", (l) => fromVelocity(l, vy.get()));
  useMotionValueEvent(vy, "change", (l) => fromVelocity(vx.get(), l));

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const deltas: Record<string, [number, number]> = { ArrowDown: [0, KEY_STEP], ArrowLeft: [-KEY_STEP, 0], ArrowRight: [KEY_STEP, 0], ArrowUp: [0, -KEY_STEP] };
    const d = deltas[event.key];
    const box = containerRef.current?.getBoundingClientRect();
    const el = dragRef.current?.getBoundingClientRect();
    if (!d || !box || !el) return;
    event.preventDefault();
    x.set(x.get() + clamp(d[0], box.left - el.left, box.right - el.right));
    y.set(y.get() + clamp(d[1], box.top - el.top, box.bottom - el.bottom));
  };

  return (
    <div ref={containerRef} className={cn("relative flex w-full items-center justify-center overflow-hidden", className)}>
      <motion.div
        ref={dragRef}
        role="group"
        aria-label={`Drag the words “${text}” — or move them with the arrow keys`}
        tabIndex={0}
        className="touch-none select-none rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        drag
        dragConstraints={containerRef}
        dragElastic={0.04}
        dragMomentum={false}
        onDragStart={() => { dragging.current = true; }}
        onDragEnd={() => { dragging.current = false; reset(); }}
        onKeyDown={onKeyDown}
        style={{ x, y }}
        whileDrag={reduce ? undefined : { cursor: "grabbing", scale: 0.985 }}
      >
        <svg aria-hidden="true" className="h-auto w-[min(92vw,1040px)] cursor-grab overflow-visible active:cursor-grabbing" viewBox={viewBox} xmlns="http://www.w3.org/2000/svg">
          <g
            dominantBaseline="middle"
            style={{ fontFamily: "var(--font-primary), Arial Black, Impact, sans-serif" }}
            fontSize={fontSize}
            fontWeight="800"
            letterSpacing={fontSize * -0.04}
            paintOrder="stroke fill"
            strokeLinecap="square"
            strokeLinejoin="miter"
            strokeMiterlimit="2"
            textAnchor="middle"
          >
            {layers.map((layer) => (
              <ShadowLayer key={layer} text={text} layer={layer} count={count} opacity={so} sx={sx} sy={sy} fill={fill} stroke={stroke} />
            ))}
            <text strokeWidth="6" style={{ fill, stroke }} x="0" y="0">{text}</text>
          </g>
        </svg>
      </motion.div>
    </div>
  );
}
