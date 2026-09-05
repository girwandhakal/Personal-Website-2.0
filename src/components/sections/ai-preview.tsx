"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { motion, useReducedMotion, useSpring } from "motion/react";
import { ArrowRight, ArrowUpRight, Database, FileText, Filter, MessageSquare, Search, Sparkles } from "lucide-react";

const stages = [
  { label: "Query", icon: MessageSquare, text: "Ask about my work." },
  { label: "Retrieve", icon: Database, text: "Find relevant project notes." },
  { label: "Rank", icon: Filter, text: "Select the most relevant context." },
  { label: "Generate", icon: Sparkles, text: "Build a grounded response." },
  { label: "Answer", icon: MessageSquare, text: "Explore the answer. Ask a follow-up." }
] as const;

export function AIPreview() {
  const [active, setActive] = useState(0);
  const [touched, setTouched] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const rotateX = useSpring(0, { stiffness: 130, damping: 24 });
  const rotateY = useSpring(0, { stiffness: 130, damping: 24 });

  useEffect(() => {
    if (reduced || touched) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      clearInterval(timer);
      if (entry.isIntersecting) {
        timer = setInterval(() => setActive(value => {
          if (value >= stages.length - 1) { clearInterval(timer); return value; }
          return value + 1;
        }), 1100);
      }
    }, { threshold: .5 });
    if (ref.current) observer.observe(ref.current);
    return () => { observer.disconnect(); clearInterval(timer); };
  }, [reduced, touched]);

  function tilt(event: PointerEvent<HTMLDivElement>) {
    if (reduced || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    rotateY.set(((event.clientX - bounds.left) / bounds.width - .5) * 9);
    rotateX.set(-((event.clientY - bounds.top) / bounds.height - .5) * 7);
  }

  return <div ref={ref} className="ai-preview" onPointerMove={tilt} onPointerLeave={() => { rotateX.set(0); rotateY.set(0); }}>
    <motion.div className="ai-preview-stack" style={{ rotateX, rotateY }}>
      <div className="preview-layer preview-layer-back" aria-hidden="true" />
      <div className="preview-layer preview-layer-middle" aria-hidden="true" />
      <div className="preview-window">
        <div className="preview-titlebar"><span className="window-dots" aria-hidden="true"><i /><i /><i /></span><span>AI Persona</span><ArrowUpRight size={14} aria-hidden="true" /></div>
        <div className="preview-layout">
          <div className="preview-sidebar" aria-hidden="true"><MessageSquare /><Search /><FileText /><Database /><span /><Sparkles /></div>
          <div className="preview-main">
            <div className="pipeline" aria-label="Explore the AI response flow">
              {stages.map((stage, index) => <button key={stage.label} type="button" className="pipeline-stage" aria-pressed={active === index} onClick={() => { setTouched(true); setActive(index); }}>
                <span className="pipeline-icon"><stage.icon size={23} strokeWidth={1.3} aria-hidden="true" /></span><span>{stage.label}</span>
              </button>)}
            </div>
            <p className="pipeline-caption" aria-live={touched ? "polite" : "off"}>{stages[active].text}</p>
            <div className="preview-conversation">
              <div className="preview-question"><span className="preview-avatar">Q</span><p>What have you built?</p></div>
              <div className="preview-answer" data-ready={active === 4}><span className="preview-avatar"><Sparkles size={15} aria-hidden="true" /></span><div><p>Agentic AI at Shipt.<br />Machine learning research at Alabama.</p><span className="preview-skeleton" aria-hidden="true"><i /><i /><i /></span></div></div>
            </div>
            <button type="button" className="preview-compose" onClick={() => window.dispatchEvent(new Event("open-ai-chat"))}><span>Ask my AI</span><ArrowRight size={19} aria-hidden="true" /></button>
          </div>
        </div>
      </div>
    </motion.div>
  </div>;
}
