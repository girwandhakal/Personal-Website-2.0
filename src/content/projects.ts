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
      "A portfolio is a one-way pitch: recruiters skim a list of bullet points and leave without ever asking the follow-up question they actually have. I wanted this site to answer back — to let a visitor ask \"has he shipped anything with LangGraph?\" and get a real, grounded answer instead of another paragraph they have to Ctrl+F through.",
    approach:
      "The first draft did what you'd expect: dump my whole profile and project files into the system prompt. That worked until the prompt got expensive and started drifting off-topic. I planned a full RAG rebuild on Supabase/pgvector, but for a knowledge base this small — about a hundred chunks — a vector database was solving a scale problem I didn't have. I replaced it with a two-stage pipeline instead: a fast Groq call classifies the question into a category plus extracted tools/projects, then a scored SQL search over a Prisma/SQLite `KnowledgeChunk` table ranks chunks by tag, alias, and keyword overlap. The harder half was the wrapper around it: a five-layer defense-in-depth pipeline (fingerprint/IP ban check, a Python microservice doing PII and secret detection with Presidio, a rate limiter, an injection-pattern filter, and a strict server-only system prompt) sits in front of the model, and every message that does get logged is AES-256-GCM encrypted with a key generated client-side and held only in the visitor's session — so even I can't read raw transcripts off the database.",
    outcome:
      "It's live on this site right now — try it from any project card. Visitors get an iMessage-style thread that answers from grounded context instead of hallucinating, abusive or injected input gets caught before it ever reaches the model, and the whole thing runs on SQLite with no vector database or standing server cost.",
    learnings:
      "The lesson that stuck: reach for the complex tool once you've measured that the simple one actually falls over, not before. Classification-plus-keyword-scoring matched the relevance I was getting from the pgvector plan, at a fraction of the moving parts and cost — the embeddings would have been solving a problem I only had on paper."
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
      "A medical bill and its Explanation of Benefits rarely agree, and almost nobody reads either one closely enough to notice. Patients end up either overpaying a provider directly or missing coverage they were already entitled to — and by the time they'd want to fix it, the bill's already been paid.",
    approach:
      "ClearPath reconciles the bill against the EOB line-by-line, then layers in a patient's real financial picture through the Plaid SDK so a recommendation isn't just \"here's what's owed\" but \"here's what you can actually afford to pay and when.\" That meant building out 20+ REST-style API routes in Next.js on top of Prisma/SQLite — one set for parsing and reconciling claims and insurance data, another for cash-flow analysis and cost estimation, and an OpenAI-backed layer that turns the reconciled numbers into a plain-language scenario a patient can actually act on.",
    outcome:
      "The result is a tool where a patient can see, before paying anything, which payment path costs them the least — split the balance, ask about a hardship plan, or pay in full — instead of guessing from a confusing paper statement.",
    learnings:
      "Reconciliation is where all the real complexity lives, not the AI layer on top of it. Billing and EOB data formats are inconsistent enough between providers that the unglamorous work — normalizing and matching line items correctly — mattered more to the end result than the model generating the final recommendation."
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
      "Southern Company's network infrastructure fleet — thousands of devices spread across a service territory — ages unevenly, and lifecycle planning was happening without a clear, visual read on which devices were actually at risk of failing soonest.",
    approach:
      "In hackathon time, that meant picking the smallest system that still felt real: a Streamlit app in front of a scikit-learn predictive risk model trained on fleet data, a 3D geographic map (Plotly) plotting 1,000+ devices by location and risk score, and a GPT-4o assistant wired directly into the live telemetry rather than a static document — so asking it about a specific device returns an answer grounded in that device's actual numbers.",
    outcome:
      "The platform placed 2nd at the UA Innovate Hackathon, turning what had been a spreadsheet-shaped lifecycle question into something a planner could point at a map and immediately see.",
    learnings:
      "Under a hard deadline, grounding the assistant in the same live data driving the map was worth more than any extra feature — it's the difference between a chatbot that answers questions about the fleet and one that just answers questions in general."
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
      "The research question was about childhood language development, but the honest first obstacle was the data itself: 60,000+ child utterances pulled from multiple longitudinal speech corpora, each with its own transcription conventions and noise, that had to be cleaned and modeled before any linguistic question could be asked of it.",
    approach:
      "I built the computational pipeline that cleans and models that dataset, and separately fine-tuned Google's FLAN-T5 on 90K utterances to improve transcription quality. Partway through, results looked too good — classification reports that clean are usually a sign something's leaking, not a sign the model is great. I audited the train/test splits and found exactly that: overlap between corpora sources meant the model had effectively seen its own test set. I rebuilt the evaluation sets to enforce a clean held-out split before trusting any number again.",
    outcome:
      "The corrected pipeline produced results that actually hold up under a real held-out split, the FLAN-T5 fine-tune cut word error rate from 17.2 to 14.4, and the resulting paper — my first as lead author — is now submitted for peer review.",
    learnings:
      "A model that looks unusually good is a bug report, not a result. The leakage audit was the single highest-leverage thing I did on this project — it's cheap to run and it's the difference between a number you can publish and one you can't."
  }
];
