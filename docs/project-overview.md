# 🌟 Project Overview: Girwan Dhakal Personal Website

## 📖 Introduction
This repository contains the source code for Girwan Dhakal's interactive personal website and portfolio. Beyond a standard static portfolio, the site features a highly sophisticated **Retrieval-Augmented Generation (RAG) AI Chatbot** embedded within a modal phone UI. The chatbot acts as an interactive resume, answering user queries strictly using grounded data about Girwan's skills, projects, and work experience.

---

## 🏗️ Architecture Stack

The project employs a modern, production-grade architecture split between a TypeScript full-stack frontend/backend and a Python microservice for safety checking.

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | ⚛️ Next.js (App Router), React, TS | Core UI and API routing |
| **Styling & Animations** | 🎨 Tailwind CSS, Framer Motion | Core aesthetics and advanced UI transitions |
| **Database** | 🐘 Supabase (PostgreSQL), Prisma | State management and data storage |
| **LLM Provider** | 🦙 Groq API (`llama-3.1-8b-instant`) | Ultra-fast inference engine |
| **Safety Microservice**| 🐍 Python FastAPI, Presidio | PII and API key scanning |

*Note: Database connections use Supabase's Session Connection Pooler on port `5432` for schema migrations and Transaction Pooler on `6543` for standard queries.*

---

## ⚙️ Core Features

### 1. Two-Stage RAG Pipeline
The chat interface (`src/app/api/chat/route.ts`) implements an advanced classification-based RAG pipeline:

```mermaid
flowchart TD
    A[User Query] --> B{Classification Layer}
    B -->|Extract Intent & Tools| C[Scoring & Retrieval]
    C --> D[(PostgreSQL<br>KnowledgeChunks)]
    D --> E[Context Injection]
    E --> F((Groq Llama 3.1))
    F --> G[Stream Response to User]
```

#### Data Flow Visualized
```mermaid
sequenceDiagram
    actor User
    participant NextJS as Next.js API Route
    participant Presidio as Python Safety Service
    participant Supabase as Supabase (PostgreSQL)
    participant Groq as Groq (LLaMA 3.1)

    User->>NextJS: Send Chat Message
    NextJS->>Supabase: Rate Limit & Ban Check
    NextJS->>Presidio: Scan for PII / Secrets
    Presidio-->>NextJS: Redacted Message
    NextJS->>Supabase: Save Encrypted User Message
    NextJS->>Groq: Stage 1: Classify Intent (JSON)
    Groq-->>NextJS: Return Category, Tools, Projects
    NextJS->>Supabase: Fetch KnowledgeChunks
    NextJS->>NextJS: Score & Rank Chunks
    NextJS->>Groq: Stage 2: Stream Response w/ Context
    Groq-->>NextJS: Stream Text Output
    NextJS-->>User: Display Response Stream
    NextJS->>Supabase: Save Encrypted Assistant Message & LlmLog
```

> [!WARNING]
> **Database Synchronization**: The `KnowledgeChunk` database table is **not** updated automatically. If `src/knowledge/data.json` or the master resume is modified, developers must manually run `npm run index:knowledge`. However, the `ChatMessage` table **is** updated automatically in real-time.

### 2. Comprehensive Safety & Security Guardrails

| Feature | Description | Implementation |
| :--- | :--- | :--- |
| **PII Scanning** | Pre-flight checks on user inputs | Python Presidio Microservice (Fallback: TS regex) |
| **Prompt Injection** | Detects jailbreak attempts | Automatic LLM override |
| **Uncertainty Rule** | Prohibits hallucinations | Hardcoded email redirection fallback |
| **Ban Shield** | Tracks violations & rate limits | Hashed device fingerprints & IP hashes |
| **Encrypted Storage**| AES-256-GCM encryption at rest | Client-provided session key |

### 3. Telemetry & Analytics Tracker

Every chat interaction is logged into the `LlmLog` database table.

```mermaid
pie title Expected Usage Payload
    "Inference Latency Tracking" : 20
    "Token Counts" : 30
    "Estimated Cost (USD)" : 15
    "RAG Category Classification" : 10
    "Knowledge Chunk IDs" : 25
```

---

## 📂 Directory Structure

```mermaid
mindmap
  root((Project))
    docs
      [Architecture Specs]
      [Master Resume]
    prisma
      [schema.prisma]
    public
      [Public Assets]
    scripts
      [Maintenance/Build]
    services
      safety-service
        [Python FastAPI]
    src
      app
        api
          chat
      components
      knowledge
```

---

## 🚀 Important Commands for Setup & Execution

### 1. Environment Setup
Create a `.env.local` file containing the Supabase database connection strings, EmailJS secrets, and the Groq API key.
> [!TIP]
> Use the Supabase Session Pooler URL (Port 5432) for `DIRECT_URL` and Transaction Pooler (Port 6543 with `?pgbouncer=true&connection_limit=1`) for `DATABASE_URL`.

### 2. Python Microservice
Navigate to `services/safety-service` and start the FastAPI server:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Database Migration & Prisma Generation
Ensure your Prisma client is synced with the Supabase PostgreSQL instance:
```bash
npx dotenv-cli -e .env.local -- prisma db push
npx prisma generate
```

### 4. Index Knowledge Base
Seed the `KnowledgeChunk` database table with the portfolio data:
```bash
npx dotenv-cli -e .env.local -- npm run index:knowledge
```

### 5. Start Development Server
Run the Next.js frontend and API:
```bash
npm run dev
```


## Alternative retro portfolio

The `retro-site` branch adds an independent static portfolio in `retro/`. Its five main pages and seven project case studies share `retro/site.css`; the portfolio uses plain HTML and CSS with no build step. This variant uses a burgundy and parchment palette, native disclosure controls, and responsive navigation.

`retro/arcade/index.html` hosts the optional Packet Run Easter egg, linked from the homepage footer. Only the arcade requires client JavaScript. Its simulation is separated into `engine.js`, with keyboard/touch input and canvas rendering in `arcade.js`. High scores remain in browser-local storage; no backend or database is required.

Run `node scripts/serve-retro.cjs` to preview the static portfolio at `http://localhost:3000`. Run `node scripts/test-retro-arcade.cjs` for simulation checks. A future static host should publish `retro/`; existing Next.js and production deployment configuration remain separate.


### Arcade leaderboard

The retro arcade adds `retro/api/leaderboard.mjs`, a server-only Vercel Function with a pinned Postgres.js dependency. The existing project deploys from `retro/` using its own `vercel.json`. The HTML portfolio still needs no client framework or build. The function reuses `DATABASE_URL` and `IP_SALT`, storing isolated run and rate-limit records in the private `arcade` schema. RLS is enabled with no Data API grants; existing tables are unchanged.

Runs use signed, expiring seeded tickets. The API replays tick-indexed lane changes with the shared game engine before calculating a rank or accepting a public nickname. Submissions are idempotent, names are validated, and writes are origin-checked and rate-limited. Scores are shared across browsers; practice runs and local best scores remain available when the backend is unavailable. See `retro/README.md` for setup and verification.
