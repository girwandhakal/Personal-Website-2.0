"use client";

import { AppWindow, BarChart3, Braces, Brain, Cloud, Code2, Container, Database, GitBranch, Server, Sparkles, Terminal, Workflow, type LucideIcon } from "lucide-react";

import { MagnifiedBento, type BentoChip } from "@/components/layouts/magnified-bento";
import { profile } from "@/content/profile";

const ICONS: Record<string, LucideIcon> = {
  Python: Code2, SQL: Database, TypeScript: Braces, JavaScript: Braces, Java: Code2, C: Code2,
  PyTorch: Brain, "Scikit-learn": Brain, LangGraph: Sparkles, LangFuse: Sparkles, Promptfoo: Sparkles,
  React: AppWindow, FastAPI: Server, NumPy: BarChart3, Pandas: BarChart3, Plotly: BarChart3,
  Docker: Container, Git: GitBranch, "CI/CD": Workflow, Airflow: Workflow, Snowflake: Database,
  SLURM: Terminal, GCP: Cloud, "Power BI": BarChart3, ThoughtSpot: BarChart3, Linux: Terminal
};

const chips: BentoChip[] = profile.skills.map((label) => ({ id: label, label, icon: ICONS[label] ?? Code2 }));
const perRow = Math.ceil(chips.length / 3);
const rows = [0, 1, 2].map((r) => chips.slice(r * perRow, (r + 1) * perRow));

export function Skills() {
  return <section className="skills-section section-inner section-space" id="skills" aria-labelledby="skills-title">
    <div className="section-label-row section-label-row--flush">
      <h2 id="skills-title" className="section-label">Toolkit &amp; education</h2>
    </div>
    <div className="skills-grid">
      <MagnifiedBento
        rows={rows}
        title="What I build with"
        description="Languages, ML frameworks, data and cloud tooling I've used in production work and research. Drag the lens to look closer."
      />
      {/* The chips above are decorative motion; this is the real list. */}
      <ul className="sr-only">{profile.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul>

      <div className="education-list">
        <h3 className="education-heading">Education</h3>
        {profile.education.map((edu) => (
          <div className="education-item" key={edu.degree}>
            <p className="education-degree">{edu.degree}</p>
            <p className="education-meta">{edu.institution} · {edu.location}</p>
            <p className="education-meta">{edu.period}</p>
          </div>
        ))}
      </div>
    </div>
  </section>;
}
