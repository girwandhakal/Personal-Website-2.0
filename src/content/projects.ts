export type Project = {
  title: string;
  eyebrow: string;
  summary: string;
  impact: string;
  tech: string[];
  links: {
    label: string;
    href: string;
  }[];
  accent: "orange" | "crimson" | "white";
};

export const projects: Project[] = [
  {
    title: "Personal AI Persona & RAG Chatbot",
    eyebrow: "Agentic Engineering",
    summary:
      "A context-aware AI chatbot built into this portfolio. It answers questions about my experience, projects, and research as my digital persona, grounded in a retrieval layer over my own work. You can try it here to see it in action.",
    impact:
      "Engineered a Next.js API with semantic ranking over Supabase/pgvector, deterministic LLM guardrails against prompt injection, per-session AES-256-GCM encrypted logging, and a Python microservice for PII redaction with Presidio.",
    tech: ["Next.js", "TypeScript", "Python", "Supabase", "pgvector", "Groq", "Framer Motion", "Tailwind CSS"],
    links: [{ label: "View Github", href: "https://github.com/girwandhakal/Personal-Website-2.0" }],
    accent: "white"
  },
  {
    title: "ClearPath: AI Medical Financial Assistant",
    eyebrow: "AI Financial Assistant",
    summary:
      "A full-stack medical financial assistant that reconciles bills against EOBs and combines insurance, claims, and Plaid financial data to generate personalized payment and coverage recommendations.",
    impact:
      "Built 20+ REST-style API routes powering cash-flow analysis, cost estimation, and scenario planning — so a patient can see the cheapest route through a medical bill before paying it.",
    tech: ["Next.js", "React", "TypeScript", "Prisma", "SQLite", "OpenAI API", "Plaid SDK"],
    links: [{ label: "View Github", href: "https://github.com/girwandhakal/ClearPath" }],
    accent: "orange"
  },
  {
    title: "Southern Company Fleet Analytics Platform",
    eyebrow: "Enterprise Analytics",
    summary:
      "A Python and Streamlit analytics platform for network infrastructure lifecycle management, pairing predictive risk models with a GPT-4o assistant. Won 2nd Place at the UA Innovate Hackathon.",
    impact:
      "Engineered a context-aware GPT-4o assistant over fleet telemetry, integrated predictive failure-risk models, and visualized 1,000+ devices on a 3D geographic risk map.",
    tech: ["Streamlit", "Python", "Scikit-learn", "OpenAI API", "Plotly", "Pandas"],
    links: [{ label: "View Github", href: "https://github.com/girwandhakal/southern-company-analytics" }],
    accent: "crimson"
  },
  {
    title: "Speech Act Analysis",
    eyebrow: "Machine Learning Research",
    summary:
      "The computational pipeline behind my first-authored research on childhood language development, modeling 60K+ child utterances drawn from multiple longitudinal speech corpora.",
    impact:
      "Cleaned and modeled complex linguistic datasets, then diagnosed data leakage by auditing train/test splits and classification reports — rebuilding the evaluation sets to produce trustworthy held-out results.",
    tech: ["Python", "PyTorch", "Scikit-learn", "Jupyter Notebook", "SLURM"],
    links: [{ label: "View Github", href: "https://github.com/girwandhakal/Speech-Act-Analysis" }],
    accent: "white"
  }
];
