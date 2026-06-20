export const profile = {
  name: "Girwan Dhakal",
  role: "Software Engineer & AI Researcher specializing in Agentic Systems and Data Science.",
  headline: "Girwan Dhakal",
  subheadline:
    "Master’s student at the University of Alabama (Graduating May 2027) architecting autonomous software, machine learning pipelines, and intelligent data systems.",
  email: "girwandhakal@gmail.com",
  location: "Alabama, USA",
  resumeHref: "/Girwan-Dhakal-Resume.docx",
  primaryCta: {
    label: "View Projects",
    href: "#projects"
  },
  secondaryCta: {
    label: "Download Resume",
    href: "/Girwan-Dhakal-Resume.docx"
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
    "C#",
    "Java",
    "C++",
    "JavaScript",
    "TypeScript",
    "SQL",
    "React",
    "Next.js",
    "ASP.NET Core",
    "Django",
    "PyTorch",
    "Scikit-learn",
    "Numpy",
    "Docker",
    "Kubernetes",
    "Git",
    "CI/CD workflows",
    "Microsoft Azure",
    "Power BI",
    "Power Automate",
    "Linux"
  ],
  proof: [
    "Developed a Snowflake Cortex NLP-to-SQL AI agent at Shipt, reducing ad-hoc data requests by 75%.",
    "Built a clinical joint-attention detection tool evaluating advanced transformer architectures (PoseC3D, STGCN, SPOTER) on ~7 hours of video to achieve 80% classification accuracy.",
    "Engineered end-to-end autonomous data workflows at Alabama Credit Union, eliminating 16+ hours of manual financial reporting."
  ],
  education: [
    {
      institution: "The University of Alabama",
      degree: "Master of Science in Computer Science",
      location: "Tuscaloosa, AL",
      period: "2024 - 2027 (Expected)"
    },
    {
      institution: "The University of Alabama",
      degree: "Bachelor of Science in Computer Science",
      location: "Tuscaloosa, AL",
      period: "2022 - 2027 (Expected)"
    }
  ],
  experience: [
    {
      role: "Data Science Intern",
      company: "Shipt",
      location: "Birmingham, AL",
      period: "Jun 2026 - Present",
      bullets: [
        "Cut Slack-based data requests by 75% by developing a Snowflake Cortex NLP-to-SQL agent and deploying a Next.js/D3.js self-service analytics dashboard on Snowflake Container Services.",
        "Reduced data science/AI project setup time by 50% by creating a reusable template with CI/CD integration, agentic automation, and prebuilt config and Docker scaffolding."
      ]
    },
    {
      role: "Data Analyst Co-op",
      company: "Alabama Credit Union",
      location: "Tuscaloosa, AL",
      period: "Aug 2025 - May 2026",
      bullets: [
        "Built end-to-end automation solution using Microsoft Power Automate that eliminated 16 monthly hours of manual financial reporting, enabling teams to redirect saved time to other business operations.",
        "Created Power BI dashboards, increased usage of dashboards for strategic decisions by 20% and ran weekly training sessions for internal stakeholders.",
        "Optimized SQL data warehouse ETL T-SQL code, cutting daily update time by 30% and ensuring up-to-date tables at the start of each business day."
      ]
    },
    {
      role: "Machine Learning Researcher",
      company: "Alabama Life Research Institute",
      location: "Tuscaloosa, AL",
      period: "Jan 2025 - Present",
      bullets: [
        "First-authored peer-reviewed research paper on childhood speech development; collaborated with a cross-functional scientific team; manuscript awaiting publication.",
        "Implemented Generative Speech Error Correction by fine-tuning Google FLAN-T5 LLM to correct 90k+ utterances produced by OpenAI Whisper, improving transcription accuracy by up to 15% on child speech.",
        "Wrote 10+ SLURM jobs for machine learning training and inference workflows, reducing manual execution time by 90% and enabling scalable computation on High-Performance Computers.",
        "Built scalable data-engineering pipelines to parse speech annotations into structured datasets; conducted exploratory data analysis with Pandas and data visualizations using Matplotlib to uncover patterns."
      ]
    }
  ]
} as const;
