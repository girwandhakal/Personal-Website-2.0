export const profile = {
  name: "Girwan Dhakal",
  role: "Machine Learning Engineer & Researcher building agentic AI systems that ship to production.",
  headline: "Girwan Dhakal",
  subheadline:
    "Accelerated Master’s student at The University of Alabama building agentic AI in production — retrieval agents, LLM data pipelines, and machine learning research that reaches peer review.",
  about:
    "I’m a rising senior at The University of Alabama, graduating in May 2027 and majoring in computer science. My experience spans machine learning research, data science, analytics, and product engineering, from language-model pipelines and retrieval agents to production data systems. I build with Python, TypeScript, React, FastAPI, PyTorch, SQL, cloud platforms, and the practical tools needed to take an idea from prototype to deployment. I’m strongest at turning ambiguous problems into clear systems, learning unfamiliar domains quickly, and communicating technical decisions with engineers and stakeholders. I like using AI to build products that solve real problems, improve how people work, and create measurable value.",
  email: "girwandhakal@gmail.com",
  location: "Alabama, USA",
  resumeHref: "https://drive.google.com/file/d/19ZlE3TBH60342uetNyYsDHVeINJYsBdf/view?usp=sharing",
  primaryCta: {
    label: "View Projects",
    href: "#projects"
  },
  secondaryCta: {
    label: "Download Resume",
    href: "https://drive.google.com/file/d/19ZlE3TBH60342uetNyYsDHVeINJYsBdf/view?usp=sharing"
  },
  socials: [
    {
      label: "GitHub",
      href: "https://github.com/girwandhakal",
      icon: "github"
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/gdhakal",
      icon: "linkedin"
    },
    {
      label: "Email",
      href: "mailto:girwandhakal@gmail.com",
      icon: "mail"
    }
  ],
  skills: [
    "Python",
    "SQL",
    "TypeScript",
    "JavaScript",
    "Java",
    "C",
    "PyTorch",
    "Scikit-learn",
    "LangGraph",
    "LangFuse",
    "Promptfoo",
    "React",
    "FastAPI",
    "NumPy",
    "Pandas",
    "Plotly",
    "Docker",
    "Git",
    "CI/CD",
    "Airflow",
    "Snowflake",
    "SLURM",
    "GCP",
    "Power BI",
    "ThoughtSpot",
    "Linux"
  ],
  proof: [
    "Built a LangGraph RAG agent at Shipt that lets AI/ML engineers search internal documentation and manage infrastructure configurations, cutting onboarding and internal support time by 50%.",
    "Shipped a Gemini-based OCR pipeline on GCP and Snowflake for previously unprocessed shopper receipts, surfacing $10K in projected annual vendor savings and expanding tax-recovery coverage to 99% of receipts.",
    "First-authored a machine learning paper on childhood language development across 60K+ child utterances, and fine-tuned FLAN-T5 on 90K utterances to cut word error rate from 17.2 to 14.4."
  ],
  education: [
    {
      institution: "The University of Alabama",
      degree: "Master of Science in Computer Science (Accelerated Master’s Program)",
      location: "Tuscaloosa, AL",
      period: "Aug 2024 - May 2027 (Expected)"
    },
    {
      institution: "The University of Alabama",
      degree: "Bachelor of Science in Computer Science",
      location: "Tuscaloosa, AL",
      period: "Aug 2022 - May 2027 (Expected)"
    }
  ],
  experience: [
    {
      role: "Data Science Intern — AI Platform",
      company: "Shipt",
      location: "Birmingham, AL",
      period: "Jun 2026 - Aug 2026",
      description:
        "Built a LangGraph RAG agent for AI/ML engineers to search internal documentation and manage infrastructure configurations, cutting onboarding and internal support time by 50%. Developed a Gemini-based OCR pipeline on GCP and Snowflake for previously unprocessed shopper receipts, identifying $10K in projected annual vendor savings while expanding tax-recovery coverage to 99%. Tuned Shipt’s product substitution-ranking model with Optuna, lifting Recall@K by 20%."
    },
    {
      role: "Machine Learning Researcher",
      company: "Alabama Life Research Institute",
      location: "Tuscaloosa, AL",
      period: "Jan 2025 - Present",
      description:
        "First-authored a research paper applying machine learning to childhood language development across 60K+ child utterances from multiple longitudinal speech corpora, now submitted for peer review. Fine-tuned Google FLAN-T5 on 90K utterances to reduce word error rate from 17.2 to 14.4, and benchmarked DeiT, Swin Transformer, and skeleton-based models on 7 hours of child interaction video for gesture classification."
    },
    {
      role: "Data Analyst Co-op",
      company: "Alabama Credit Union",
      location: "Tuscaloosa, AL",
      period: "Aug 2025 - May 2026",
      description:
        "Automated recurring workflows with Power Automate, eliminating 16 hours of manual reporting every month. Built and deployed 5 Power BI dashboards with business stakeholders and led weekly user training, increasing dashboard adoption by 50%. Optimized Microsoft SQL Server ETL pipelines to cut daily refresh time by 30%, delivering fresher data downstream."
    },
    {
      role: "Technical Lead",
      company: "RoomiCheck",
      location: "Tuscaloosa, AL",
      period: "Dec 2025 - Present",
      description:
        "Leading engineering on a roommate-matching platform for housing providers, and secured $2,500 in non-dilutive funding through RiverPitch 2025 and the 2026 Aldag Entrepreneurship Competition. Built and deployed a FastAPI adaptive questionnaire that uses LLMs to turn free-text answers into structured roommate profiles, piloted with 50+ users."
    }
  ]
} as const;
