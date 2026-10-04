"use client";

import { AppWindow, BarChart3, Braces, Brain, Cloud, Code2, Container, Database, GitBranch, Server, Sparkles, Terminal, Workflow, type LucideIcon } from "lucide-react";

import { Book3D } from "@/components/layouts/book-3d";
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

const shortDegree = (degree: string) => (degree.startsWith("Master") ? "M.S. Computer Science" : "B.S. Computer Science");

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

      <div className="education-shelf">
        {profile.education.map((edu, i) => (
          <div className="education-book" key={edu.degree}>
            <Book3D
              title={shortDegree(edu.degree)}
              subtitle={i === 0 ? "Accelerated Master's" : "Undergraduate"}
              coverColor={i === 0 ? "rgb(158, 27, 50)" : "rgb(110, 122, 135)"}
              label={`${edu.degree}, ${edu.institution}, ${edu.period}`}
              inside={<>
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6a737c]">{edu.institution}</span>
                <span className="text-sm font-semibold leading-snug md:text-base">{shortDegree(edu.degree)}</span>
                <span className="text-[11px] text-[#59626b] md:text-xs">{edu.period}</span>
              </>}
            />
            <div className="education-caption">
              <h3>{shortDegree(edu.degree)}</h3>
              <p>{edu.institution}</p>
              <span>{edu.period}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>;
}
