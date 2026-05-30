# perso-demo

Interactive demo of [perso](https://github.com/your-org/perso) — a WebAssembly policy enforcement engine for MCP tool calls.

Shows how perso intercepts LLM tool call intents and returns Allow/Deny decisions based on a JSON policy file. Roles (viewer, supervisor, admin) get different permissions shown inline in a Gemini-style chat UI.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TanStack Router — TypeScript |
| Backend | Node.js + Express — TypeScript (tsx dev, tsc build) |
| LLM | Google Gemini (free tier, function calling) |
| Policy engine | perso `.wasm` loaded in Node.js |
| Package manager | pnpm workspaces |

## Prerequisites

- Node.js 18+
- pnpm 11+ — `npm i -g pnpm`
- `perso.wasm` binary → `backend/src/wasm/perso.wasm` (Phase 2)
- Google Gemini API key (Phase 3)

## Setup

```bash
pnpm install

cp backend/.env.example backend/.env
# set GOOGLE_API_KEY in backend/.env (Phase 3)
```

## Dev

```bash
pnpm dev            # both frontend :5173 + backend :3001
pnpm dev:backend
pnpm dev:frontend
```

## Build & typecheck

```bash
pnpm build          # tsc + vite build (frontend)
pnpm typecheck      # tsc --noEmit both packages
```

## Endpoints

| Endpoint | Phase | Description |
|---|---|---|
| `GET /health` | ✅ 1 | Service health + feature flags |
| `POST /evaluate` | 🔜 2 | perso WASM policy decision |
| `POST /chat` | 🔜 3 | Gemini + tool call interception |

## Policy roles

| Role | `read_file` | `create_file` | `update_file` | `delete_file` |
|---|---|---|---|---|
| viewer | ✅ | ❌ | ❌ | ❌ |
| supervisor | ✅ | ❌ | ✅ | ❌ |
| admin | ✅ | ✅ | ✅ | ✅ |

## Structure

```
perso-demo/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   └── health.ts
│   │   ├── wasm/              ← perso.wasm goes here (Phase 2)
│   │   └── index.ts
│   ├── tsconfig.json
│   ├── .env / .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── lib/api.ts
│   │   ├── pages/Index.tsx
│   │   ├── types/api.ts
│   │   ├── routeTree.ts
│   │   └── main.tsx
│   ├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
│   ├── vite.config.ts
│   └── package.json
├── pnpm-workspace.yaml
├── .npmrc
└── package.json
```

## Build phases

| # | Status | Deliverable |
|---|---|---|
| 1 | ✅ Done | Monorepo, TypeScript, Vite, Express, health check, proxy |
| 2 | 🔜 | WASM loader, mock tools, `/evaluate` |
| 3 | 🔜 | Gemini function calling, `/chat` |
| 4 | 🔜 | Chat UI, role switcher, allow/deny badges |
| 5 | 🔜 | Trace panel, policy viewer, error handling |
