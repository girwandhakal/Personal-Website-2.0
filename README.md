<div align="center">
  <h1>🌟 Girwan Dhakal - Interactive Portfolio & AI Chatbot</h1>
  <p>
    <em>A next-generation personal website featuring a highly sophisticated RAG AI Chatbot.</em>
  </p>

  <!-- Badges -->
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python FastAPI" />
</div>

<br />

## 🚀 Overview

Welcome to the source code of my interactive personal website. This is not just a standard static portfolio; it is powered by an embedded **Retrieval-Augmented Generation (RAG) AI Chatbot** living inside a highly polished modal phone UI. 

The chatbot acts as a fully interactive resume. It strictly answers user queries using grounded, factual data about my skills, projects, and work experience, ensuring an engaging and hallucination-free experience.

> 📚 **Deep Dive:** For a comprehensive breakdown of the system architecture, features, and technical stack, please read the [**Project Overview**](docs/project-overview.md).

---

## ✨ Key Features

- **📱 Interactive Phone UI:** A sleek, animated modal interface built with Framer Motion and Tailwind CSS.
- **🧠 Two-Stage RAG Pipeline:** Intelligent query classification combined with strict factual retrieval via a PostgreSQL knowledge base.
- **⚡ Ultra-Fast Inference:** Powered by Groq API (`llama-3.1-8b-instant`) for blazing fast chat responses.
- **🛡️ Enterprise-Grade Safety:** A dedicated Python FastAPI microservice utilizing Microsoft Presidio for PII and API key scanning, alongside robust prompt injection defenses.
- **📊 Telemetry & Logging:** Real-time analytics tracking latency, token usage, and RAG retrieval accuracy.

---

## 🛠️ Quick Start

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- Supabase Account
- Groq API Key

### 1. Clone & Install
```bash
git clone https://github.com/girwandhakal/Personal-Website-2.0.git
cd "Personal Website 2.0"
npm install
```

### 2. Configure Environment
Create a `.env.local` file at the root:
```env
# Example .env.local
DIRECT_URL="postgres://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
DATABASE_URL="postgres://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
GROQ_API_KEY="your-groq-api-key"
```

### 3. Run Safety Microservice
```bash
cd services/safety-service
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4. Setup Database & Start App
In a new terminal window:
```bash
npx dotenv-cli -e .env.local -- prisma db push
npx prisma generate
npx dotenv-cli -e .env.local -- npm run index:knowledge
npm run dev
```

Visit `http://localhost:3000` to interact with the portfolio!

---

## 📖 Documentation

For detailed architectural information, data flow diagrams, and directory structure, please refer to the detailed **[Project Overview](docs/project-overview.md)**.

---
<div align="center">
  <p>Built with ❤️ by Girwan Dhakal</p>
</div>
