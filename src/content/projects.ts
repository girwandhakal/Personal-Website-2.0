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
    title: "ClearPath: AI Medical Financial Assistant",
    eyebrow: "AI Financial Assistant",
    summary:
      "An AI-powered application that helps users reduce medical debt and optimize payment decisions by generating personalized recommendations from insurance coverage, personal finance data, and claim documents.",
    impact:
      "Created 20+ REST-style API routes to power cash-flow analysis, cost estimation, and scenario planning.",
    tech: ["Next.js", "React", "TypeScript", "Prisma", "SQLite", "OpenAI API", "Plaid SDK"],
    links: [{ label: "View Github", href: "https://github.com/girwandhakal/ClearPath" }],
    accent: "orange"
  },
  {
    title: "Southern Company Fleet Analytics Platform",
    eyebrow: "Enterprise Analytics",
    summary:
      "A scalable enterprise platform designed to centralize network infrastructure lifecycle, winning 2nd Place at the UA Innovate Hackathon.",
    impact:
      "Engineered a context-aware AI chatbot using GPT-4o, integrated predictive risk models, and visualized 1000+ devices on a 3D geographic risk map.",
    tech: ["Streamlit", "Python", "Scikit-learn", "OpenAI API", "Plotly", "Pandas"],
    links: [{ label: "View Github", href: "https://github.com/girwandhakal" }],
    accent: "crimson"
  },
  {
    title: "Speech Act Analysis",
    eyebrow: "Machine Learning Research",
    summary:
      "A research-focused repository containing Python code and models used in the computational analysis of Late Talker speech acts.",
    impact:
      "Utilized data science environments to clean, process, and analyze complex linguistic datasets.",
    tech: ["Jupyter Notebook", "Python", "Data Science", "Machine Learning"],
    links: [{ label: "View Github", href: "https://github.com/girwandhakal/Speech-Act-Analysis" }],
    accent: "white"
  }
];

