# multidoc-rag frontend (Next.js)

Pick one of the three reports and chat with it. Each document keeps its own conversation (saved in `localStorage`); histories are never mixed.

This is the UI only. Answers come from the FastAPI backend in the separate `multidoc-rag-backend` repo; set that up first (its README covers Supabase, the Gemini key and ingestion).

## Prerequisites

- Node.js 20.9+ and npm
- The backend running (default `http://localhost:8000`) with the documents ingested

## Setup

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev                  # http://localhost:3000
```

| Variable              | Notes |
|-----------------------|-------|
| `NEXT_PUBLIC_API_URL` | Backend base URL. Read at build time, so rebuild after changing it. |

Un-ingested documents show as "not ready". If requests fail with a CORS error, the backend's `FRONTEND_ORIGIN` must match the URL this app is served from.

## Running both

```bash
# terminal 1 — backend
cd ../backend && source .venv/bin/activate
uvicorn app.main:app --reload --port 8000

# terminal 2 — frontend
npm run dev
```

## Scripts

| Command         | What it does |
|-----------------|--------------|
| `npm run dev`   | dev server with hot reload |
| `npm run build` | production build |
| `npm start`     | serve the production build |
| `npm run lint`  | ESLint |

## Layout

```
app/
├── page.tsx                  # document selector + chat, per-document history
├── components/
│   ├── DocumentSelector.tsx  # segmented control
│   ├── ChatPanel.tsx         # messages, input, loading state
│   ├── Message.tsx           # markdown answer + source chips
│   ├── SourceList.tsx        # p. 42 · Inflation · table
│   ├── icons.tsx
│   └── ui/                   # Button, Input
└── lib/
    ├── api.ts                # /documents, /chat
    └── cn.ts                 # className helper
```
