# Project Overview: Girwan Dhakal Personal Website

## Introduction
This repository contains the source code for Girwan Dhakal's interactive personal website and portfolio. Beyond a standard static portfolio, the site features a highly sophisticated **Retrieval-Augmented Generation (RAG) AI Chatbot** embedded within a modal phone UI. The chatbot acts as an interactive resume, answering user queries strictly using grounded data about Girwan's skills, projects, and work experience.

## Architecture

The project employs a modern, production-grade architecture split between a TypeScript full-stack frontend/backend and a Python microservice for safety checking.

*   **Frontend Framework**: Next.js (App Router), React, TypeScript.
*   **Styling & Animations**: Tailwind CSS, Vanilla CSS for core aesthetics, and Framer Motion for advanced UI transitions (e.g., the modal phone interface).
*   **Database**: Supabase (PostgreSQL), managed via Prisma ORM. Uses Supabase's Session Connection Pooler on port `5432` for schema migrations and Transaction Pooler on `6543` for standard queries.
*   **LLM Provider**: Groq API, leveraging the ultra-fast `llama-3.1-8b-instant` model.
*   **Safety Microservice**: A local Python FastAPI server running Microsoft Presidio and `detect-secrets` to scan user inputs for Personally Identifiable Information (PII) and API keys before they ever touch the LLM.

## Core Features

### 1. Two-Stage RAG Pipeline
The chat interface (`src/app/api/chat/route.ts`) implements an advanced classification-based RAG pipeline:
1.  **Classification Layer**: In-flight parsing of the user's query via a fast LLM call to extract specific categories, referenced tools, and project aliases.
2.  **Scoring & Retrieval**: The API executes an in-memory ranking heuristic over the `KnowledgeChunk` records fetched from Postgres (matching tags, tools, and project aliases natively stored as Postgres arrays).
3.  **Context Injection**: Top-ranked chunks are dynamically injected into the system prompt's `<context>` tag to ensure the Llama model relies purely on grounded data. Memory is truncated to a strict **4-turn sliding window** to optimize token cost.

*Note on Database Synchronization*: 
- The `KnowledgeChunk` database table is **not** updated automatically. If `src/knowledge/data.json` or the master resume is modified, developers must manually run `npm run index:knowledge` to sync changes to Supabase.
- The `ChatMessage` table **is** updated automatically in real-time. Every single chat interaction generates exactly two rows: one for the user query (`sender: "user"`) and one for the generated response (`sender: "assistant"`).

### 2. Comprehensive Safety & Security Guardrails
*   **Python Presidio Microservice**: Pre-flight checks on user inputs. If the Python server is offline, a TypeScript regex fallback is deployed.
*   **Prompt Injection Defense**: Detects jailbreak attempts (e.g., "ignore previous instructions") and automatically overrides the LLM call.
*   **Ban Shield**: Tracks violations and rate limits via hashed device fingerprints (`x-device-fingerprint`) and salted IP hashes. Malicious behavior automatically triggers a permanent device ban (stored in the `BannedFingerprint` table).
*   **Encrypted Storage**: All user and assistant chat messages are encrypted at rest in the database using AES-256-GCM and a client-provided session key.

### 3. Telemetry & Analytics
Every chat interaction is logged into the `LlmLog` database table, capturing:
*   Inference Latency (ms)
*   Token counts (Prompt & Completion)
*   Estimated Cost (USD)
*   RAG Classification Category
*   Retrieved Knowledge Chunk IDs

## Directory Structure

*   `docs/` - System architecture specs, implementation guidelines, and prompt references. Also contains the master resume (`Girwan Dhakal.docx`).
*   `prisma/` - `schema.prisma` definition outlining the PostgreSQL architecture.
*   `public/` - Public assets, including `Girwan-Dhakal-Resume.docx` (the downloadable copy synced from the `docs/` folder).
*   `scripts/` - Maintenance and build scripts (e.g., `index-knowledge.ts` to push JSON data to the database).
*   `services/safety-service/` - Python microservice for PII scanning.
*   `src/app/` - Next.js routing, page layouts, and the core API endpoints (`api/chat/route.ts`).
*   `src/components/` - Reusable UI components (e.g., the interactive `phone-messenger.tsx`).
*   `src/knowledge/` - Structured JSON defining the factual constraints and chunks for the RAG index.

## Important Commands for Setup & Execution

### 1. Environment Setup
Create a `.env.local` file containing the Supabase database connection strings, EmailJS secrets, and the Groq API key.
*Note: Use the Supabase Session Pooler URL (Port 5432) for `DIRECT_URL` and Transaction Pooler (Port 6543 with `?pgbouncer=true&connection_limit=1`) for `DATABASE_URL`.*

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
