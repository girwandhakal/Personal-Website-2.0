"use client";

import { AppWindow, BarChart3, Braces, Brain, Cloud, Code2, Container, Database, GitBranch, Server, Sparkles, Terminal, Workflow, type LucideIcon } from "lucide-react";

import { SkillsMarquee, type MarqueeChip } from "@/components/layouts/skills-marquee";
import { profile } from "@/content/profile";

const ICONS: Record<string, LucideIcon> = {
  Python: Code2, SQL: Database, TypeScript: Braces, JavaScript: Braces, Java: Code2, C: Code2,
  PyTorch: Brain, "Scikit-learn": Brain, LangGraph: Sparkles, LangFuse: Sparkles, Promptfoo: Sparkles,
  React: AppWindow, FastAPI: Server, NumPy: BarChart3, Pandas: BarChart3, Plotly: BarChart3,
  Docker: Container, Git: GitBranch, "CI/CD": Workflow, Airflow: Workflow, Snowflake: Database,
  SLURM: Terminal, GCP: Cloud, "Power BI": BarChart3, ThoughtSpot: BarChart3, Linux: Terminal
};

const chips: MarqueeChip[] = profile.skills.map((label) => ({ id: label, label, icon: ICONS[label] ?? Code2 }));
const perRow = Math.ceil(chips.length / 3);
const rows = [0, 1, 2].map((r) => chips.slice(r * perRow, (r + 1) * perRow));

export function Skills() {
  return <section className="skills-section section-space" id="skills" aria-labelledby="skills-title">
    <div className="section-inner section-label-row section-label-row--flush">
      <h2 id="skills-title" className="section-label">Skills</h2>
    </div>
    <SkillsMarquee rows={rows} />
    {/* The drifting chips are decorative motion; this is the real list. */}
    <ul className="sr-only">{profile.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
  </section>;
}
