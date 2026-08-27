export type Project = {
  slug: string;
  title: string;
  summary: string;
  impact: string;
  tech: string[];
  links: {
    label: string;
    href: string;
  }[];
  accent: "orange" | "crimson" | "white";
  role: string;
  timeline: string;
  /** Short, skimmable proof points shown as stat chips on the detail view. */
  stats: { label: string; value: string }[];
  /** The problem as it actually showed up, before any code existed. */
  context: string;
  /** How it was actually built — the real decisions, not a feature list. */
  approach: string;
  /** What shipped, and what it changed. */
  outcome: string;
  /** The lesson that would change how the next version gets built. */
  learnings: string;
};

export const projects: Project[] = [
  {
    slug: "ai-persona-chatbot",
    title: "Personal AI Persona & RAG Chatbot",
    summary:
      "A context-aware AI chatbot built into this portfolio. It answers questions about my experience, projects, and research as my digital persona, grounded in a retrieval layer over my own work. You can try it here to see it in action.",
    impact:
      "Engineered a Next.js API with semantic ranking over Supabase/pgvector, deterministic LLM guardrails against prompt injection, per-session AES-256-GCM encrypted logging, and a Python microservice for PII redaction with Presidio.",
    tech: ["Next.js", "TypeScript", "Python", "Supabase", "pgvector", "Groq", "Framer Motion", "Tailwind CSS"],
    links: [{ label: "View Github", href: "https://github.com/girwandhakal/Personal-Website-2.0" }],
    accent: "white",
    role: "Solo build — architecture, backend, safety layer, UI",
    timeline: "2026 · shipped, still evolving",
    stats: [
      { label: "Safety layers", value: "5" },
      { label: "Log encryption", value: "AES-256-GCM" },
      { label: "Standing infra cost", value: "~$0" }
    ],
    context:
      "Nobody reads a portfolio top to bottom. They skim, half-form a question like \"has he shipped anything with LangGraph?\", and leave without asking it. I wanted the site to be able to take that question.",
    approach:
      "The first version stuffed my whole profile into the system prompt. It worked, then it got expensive and started wandering off topic. I planned a proper RAG rebuild on Supabase and pgvector before I counted the knowledge base: about a hundred chunks. Embeddings would have been overkill. What shipped instead is a fast Groq call that classifies the question and pulls out any tools or projects it names, then a scored SQL query over a Prisma/SQLite table that ranks chunks on tag, alias, and keyword overlap. Most of the work went into the wrapper. Five layers sit in front of the model: a ban check on fingerprint and IP, a Python service running Presidio for PII and secrets, a rate limiter, an injection filter, and a server-only system prompt. Anything logged is encrypted AES-256-GCM with a key that never leaves the visitor's session, so I can't read transcripts off my own database either.",
    outcome:
      "It's live on this page. Ask it something from any project card and you get an iMessage-style thread answering from my notes instead of inventing things. Injected or abusive input gets caught before the model sees it. No vector database, no standing server cost.",
    learnings:
      "I almost built the pgvector version because it sounded like the right answer. Keyword scoring over a hundred chunks matched it on relevance for a fraction of the moving parts. Now I make the simple version fail before I reach past it."
  },
  {
    slug: "clearpath",
    title: "ClearPath: AI Medical Financial Assistant",
    summary:
      "A full-stack medical financial assistant that reconciles bills against EOBs and combines insurance, claims, and Plaid financial data to generate personalized payment and coverage recommendations.",
    impact:
      "Built 20+ REST-style API routes powering cash-flow analysis, cost estimation, and scenario planning — so a patient can see the cheapest route through a medical bill before paying it.",
    tech: ["Next.js", "React", "TypeScript", "Prisma", "SQLite", "OpenAI API", "Plaid SDK"],
    links: [{ label: "View Github", href: "https://github.com/girwandhakal/ClearPath" }],
    accent: "orange",
    role: "Solo full-stack build",
    timeline: "2025",
    stats: [
      { label: "API routes shipped", value: "20+" },
      { label: "Data sources reconciled", value: "3" },
      { label: "Core question answered", value: "Cheapest route through a bill" }
    ],
    context:
      "A medical bill and its Explanation of Benefits almost never line up, and almost nobody checks. You overpay the provider, or you miss coverage you already had, and either way you find out after the money is gone.",
    approach:
      "ClearPath matches the bill to the EOB line by line, then pulls the patient's account data through Plaid so the advice isn't limited to what's owed. It can say what they can pay, and when. That came out to 20+ API routes on Next.js and Prisma: one group parsing and reconciling claims and insurance data, one running cash-flow analysis and cost estimates, and an OpenAI layer that turns the reconciled numbers into something a patient can read once and act on.",
    outcome:
      "Before paying anything, a patient can compare the routes open to them. Split the balance, ask about a hardship plan, or pay in full, with the cost of each spelled out instead of guessed at from a paper statement.",
    learnings:
      "I expected the AI layer to be the hard part. It wasn't close. Every provider formats bills differently, and getting line items to match correctly is where the project lived. The model was the last ten percent."
  },
  {
    slug: "southern-company-fleet-analytics",
    title: "Southern Company Fleet Analytics Platform",
    summary:
      "A Python and Streamlit analytics platform for network infrastructure lifecycle management, pairing predictive risk models with a GPT-4o assistant. Won 2nd Place at the UA Innovate Hackathon.",
    impact:
      "Engineered a context-aware GPT-4o assistant over fleet telemetry, integrated predictive failure-risk models, and visualized 1,000+ devices on a 3D geographic risk map.",
    tech: ["Streamlit", "Python", "Scikit-learn", "OpenAI API", "Plotly", "Pandas"],
    links: [{ label: "View Github", href: "https://github.com/girwandhakal/southern-company-analytics" }],
    accent: "crimson",
    role: "Team build — UA Innovate Hackathon",
    timeline: "2025 · 2nd Place, UA Innovate Hackathon",
    stats: [
      { label: "Placement", value: "2nd Place" },
      { label: "Devices mapped", value: "1,000+" },
      { label: "Assistant grounding", value: "Live telemetry" }
    ],
    context:
      "Southern Company runs thousands of network devices across its service territory, and they don't age at the same rate. Lifecycle planning was happening off spreadsheets, with no clear read on which devices were closest to failing.",
    approach:
      "Hackathon scope, so we built the smallest version that still worked end to end. A scikit-learn model scores failure risk from fleet data, a Plotly map plots 1,000+ devices in 3D by location and score, and a GPT-4o assistant reads from the same live telemetry feeding the map. Ask it about one device and it answers from that device's numbers.",
    outcome:
      "It took 2nd at UA Innovate. A lifecycle question that had lived in spreadsheets became a map a planner could point at.",
    learnings:
      "Wiring the assistant into the same live data as the map was worth more than the features we cut to do it. An assistant that can quote the device in front of you gets used. One reading off a static document gets ignored."
  },
  {
    slug: "speech-act-analysis",
    title: "Speech Act Analysis",
    summary:
      "The computational pipeline behind my first-authored research on childhood language development, modeling 60K+ child utterances drawn from multiple longitudinal speech corpora.",
    impact:
      "Cleaned and modeled complex linguistic datasets, then diagnosed data leakage by auditing train/test splits and classification reports — rebuilding the evaluation sets to produce trustworthy held-out results.",
    tech: ["Python", "PyTorch", "Scikit-learn", "Jupyter Notebook", "SLURM"],
    links: [{ label: "View Github", href: "https://github.com/girwandhakal/Speech-Act-Analysis" }],
    accent: "white",
    role: "First author — Alabama Life Research Institute",
    timeline: "2025 · submitted for peer review",
    stats: [
      { label: "Utterances modeled", value: "60K+" },
      { label: "FLAN-T5 word error rate", value: "17.2 → 14.4" },
      { label: "Status", value: "Submitted for peer review" }
    ],
    context:
      "The paper was about how children's language develops. The first obstacle was the data. 60,000+ child utterances pulled from several longitudinal corpora, each with its own transcription conventions and its own noise, none of it ready to model.",
    approach:
      "I built the pipeline that cleans and models that dataset, and fine-tuned Google's FLAN-T5 on 90K utterances to improve transcription quality. Partway through, the numbers got suspiciously good. Classification reports that tidy usually mean something is leaking. I went back through the train/test splits and found overlap between corpus sources: the model had already seen its own test set. I rebuilt the evaluation sets around a clean held-out split before trusting another number.",
    outcome:
      "The corrected pipeline produces results that survive a real held-out split, the FLAN-T5 fine-tune cut word error rate from 17.2 to 14.4, and the paper is under peer review with my name first on it.",
    learnings:
      "Good numbers deserve suspicion before celebration. The leakage audit cost an afternoon and decided whether any of the results were worth publishing."
  }
];
