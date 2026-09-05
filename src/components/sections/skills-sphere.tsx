"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

interface Vec3 { x: number; y: number; z: number; }

/** Evenly distributes `count` points on a unit sphere via the Fibonacci lattice, scaled to `radius`. */
function fibonacciSphere(count: number, radius: number): Vec3[] {
  const points: Vec3[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = count > 1 ? 1 - (i / (count - 1)) * 2 : 0;
    const ringRadius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    points.push({ x: Math.cos(theta) * ringRadius * radius, y: y * radius, z: Math.sin(theta) * ringRadius * radius });
  }
  return points;
}

const AUTO_SPIN = 0.0021;
const DRAG_SENSITIVITY = 0.01;
const FRICTION = 0.945;
const REST_THRESHOLD = 0.00006;
const MIN_ZOOM = 0.62;
const MAX_ZOOM = 1.85;

export function SkillsSphere({ skills }: { skills: string[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const tagRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const pointsRef = useRef<Vec3[]>([]);
  const radiusRef = useRef(0);
  const zoomRef = useRef(1);
  const velocityRef = useRef({ yaw: 0, pitch: 0 });
  const dragRef = useRef({ active: false, x: 0, y: 0 });
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null);
  const visibleRef = useRef(true);
  const reduced = useReducedMotion();

  // Lay out points whenever the container is (re)sized, so radius always matches the rendered box.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      radiusRef.current = el.clientWidth * 0.4;
      pointsRef.current = fibonacciSphere(skills.length, radiusRef.current);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [skills.length]);

  // Pause the render loop while off-screen.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => { visibleRef.current = entry.isIntersecting; }, { threshold: .05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The render loop: rotate the point cloud in place (never from stored Euler angles, so there's
  // no gimbal lock or pole-flattening), project to screen space, and paint back-to-front.
  useEffect(() => {
    let frame: number;

    function applyRotation(points: Vec3[], yaw: number, pitch: number) {
      const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
      const cosX = Math.cos(pitch), sinX = Math.sin(pitch);
      for (const p of points) {
        const x1 = p.x * cosY + p.z * sinY;
        const z1 = p.z * cosY - p.x * sinY;
        const y1 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;
        p.x = x1; p.y = y1; p.z = z2;
      }
    }

    function tick() {
      const points = pointsRef.current;
      const radius = radiusRef.current;
      if (points.length && radius && visibleRef.current) {
        let yaw = 0, pitch = 0;
        if (dragRef.current.active) {
          yaw = velocityRef.current.yaw;
          pitch = velocityRef.current.pitch;
        } else {
          yaw = velocityRef.current.yaw + (reduced ? 0 : AUTO_SPIN);
          pitch = velocityRef.current.pitch;
          velocityRef.current.yaw *= FRICTION;
          velocityRef.current.pitch *= FRICTION;
          if (Math.abs(velocityRef.current.yaw) < REST_THRESHOLD) velocityRef.current.yaw = 0;
          if (Math.abs(velocityRef.current.pitch) < REST_THRESHOLD) velocityRef.current.pitch = 0;
        }
        if (yaw !== 0 || pitch !== 0) applyRotation(points, yaw, pitch);

        const order = points.map((_, index) => index).sort((a, b) => points[a].z - points[b].z);
        for (const index of order) {
          const p = points[index];
          const tag = tagRefs.current[index];
          if (!tag) continue;
          const depth = (p.z + radius) / (radius * 2);
          const scale = .48 + depth * .78;
          tag.style.transform = `translate3d(calc(-50% + ${p.x.toFixed(2)}px), calc(-50% + ${p.y.toFixed(2)}px), 0) scale(${scale.toFixed(3)})`;
          tag.style.opacity = (.24 + depth * .76).toFixed(3);
          tag.style.zIndex = String(Math.round(depth * 1000));
        }
      }
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduced]);

  // Pointer drag (rotate), two-finger touch pinch, and trackpad/ctrl-wheel pinch (zoom).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    function setZoom(value: number) {
      zoomRef.current = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
      if (innerRef.current) innerRef.current.style.transform = `scale(${zoomRef.current.toFixed(3)})`;
    }

    function pointerDown(event: PointerEvent) {
      pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      try { el!.setPointerCapture(event.pointerId); } catch { /* ignore: pointer already released */ }
      if (pointersRef.current.size === 1) {
        dragRef.current = { active: true, x: event.clientX, y: event.clientY };
      } else if (pointersRef.current.size === 2) {
        dragRef.current.active = false;
        const [a, b] = Array.from(pointersRef.current.values());
        pinchRef.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), zoom: zoomRef.current };
      }
    }

    function pointerMove(event: PointerEvent) {
      if (!pointersRef.current.has(event.pointerId)) return;
      pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointersRef.current.size === 2 && pinchRef.current) {
        const [a, b] = Array.from(pointersRef.current.values());
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        setZoom(pinchRef.current.zoom * (distance / pinchRef.current.distance));
        return;
      }

      if (dragRef.current.active && pointersRef.current.size === 1) {
        const dx = event.clientX - dragRef.current.x;
        const dy = event.clientY - dragRef.current.y;
        dragRef.current.x = event.clientX;
        dragRef.current.y = event.clientY;
        velocityRef.current = { yaw: dx * DRAG_SENSITIVITY, pitch: -dy * DRAG_SENSITIVITY };
      }
    }

    function pointerUp(event: PointerEvent) {
      pointersRef.current.delete(event.pointerId);
      if (pointersRef.current.size < 2) pinchRef.current = null;
      if (pointersRef.current.size === 0) {
        dragRef.current.active = false;
        if (reduced) velocityRef.current = { yaw: 0, pitch: 0 };
      } else if (pointersRef.current.size === 1) {
        const [remaining] = Array.from(pointersRef.current.values());
        dragRef.current = { active: true, x: remaining.x, y: remaining.y };
      }
    }

    function wheel(event: WheelEvent) {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      setZoom(zoomRef.current * Math.exp(-event.deltaY * .0025));
    }

    function doubleClick() { setZoom(1); }

    el.addEventListener("pointerdown", pointerDown);
    el.addEventListener("pointermove", pointerMove);
    el.addEventListener("pointerup", pointerUp);
    el.addEventListener("pointercancel", pointerUp);
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("dblclick", doubleClick);
    return () => {
      el.removeEventListener("pointerdown", pointerDown);
      el.removeEventListener("pointermove", pointerMove);
      el.removeEventListener("pointerup", pointerUp);
      el.removeEventListener("pointercancel", pointerUp);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("dblclick", doubleClick);
    };
  }, [reduced]);

  return <div ref={wrapRef} className="skills-sphere" role="list" aria-labelledby="skills-title">
    <div ref={innerRef} className="skills-sphere-inner">
      {skills.map((skill, index) => <span role="listitem" key={skill} ref={node => { tagRefs.current[index] = node; }}>{skill}</span>)}
    </div>
  </div>;
}
