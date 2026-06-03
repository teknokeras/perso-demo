# perso-demo

Interactive demo of [perso](https://github.com/your-org/perso) — a WebAssembly policy enforcement engine for MCP tool calls.

The LLM (Groq) calls tools. perso intercepts every tool call intent before execution and returns Allow or Deny based on the caller's role. The UI shows the decision inline — green for allow, red for deny — alongside the reason from the policy engine.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TanStack Router — TypeScript |
| Backend | Node.js + Express — TypeScript (`tsx` dev) |
| LLM | Groq (free tier) — `llama-3.1-8b-instant` via `groq-sdk` |
| Policy engine | `perso.wasm` — Node.js built-in `WebAssembly`, no extra packages |
| Package manager | pnpm 11 workspaces |

---

## Setup

### Prerequisites

- Node.js 18+
- pnpm 11+: `npm i -g pnpm`
- `perso.wasm` binary → place at `backend/src/wasm/perso.wasm`
- Groq API key → [get one free](https://console.groq.com/keys)

### Install

```bash
pnpm install
```

### Configure

```bash
cp backend/.env.example backend/.env
# open backend/.env and set:
#   GROQ_API_KEY — your Groq API key
#   GROQ_MODEL   — e.g. llama-3.1-8b-instant
```

### Run

```bash
pnpm dev          # frontend :5173 + backend :3001
```

The status banner at the top of the UI will turn green once both the policy engine and Groq are ready.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | no | Backend port (default: `3001`) |
| `FRONTEND_URL` | no | CORS origin (default: `http://localhost:5173`) |
| `GROQ_API_KEY` | yes | Groq API key from [console.groq.com/keys](https://console.groq.com/keys) |
| `GROQ_MODEL` | yes | Groq model ID, e.g. `llama-3.1-8b-instant` |

---

## Policy

The demo uses four mock tools and three roles. No real filesystem — all tools return fake responses.

| Tool | viewer | supervisor | admin |
|---|---|---|---|
| `read_file` | ✅ | ✅ | ✅ |
| `update_file` | ❌ | ✅ | ✅ |
| `create_file` | ❌ | ❌ | ✅ |
| `delete_file` | ❌ | ❌ | ✅ |

Default action: **Deny**. Anything not explicitly allowed is rejected.

Click **policy** in the top-right to see the active rules for the current role.

---

## Demo script

Walk through these prompts in order to show the full allow/deny contrast.

### Scene 1 — viewer role (read only)

Set role to **viewer**.

```
Read /etc/config.json
```
→ perso **allows** `read_file`. Groq returns the file contents.

```
Try to delete /etc/config.json
```
→ Groq calls `delete_file`. perso **denies** — no rule matches `delete_file` for `viewer`. Default action kicks in.

### Scene 2 — supervisor role (read + update)

Switch role to **supervisor** (conversation resets).

```
Update /home/user/notes.txt with today's standup summary
```
→ perso **allows** `update_file`. Groq writes the content and confirms.

```
Create a new file at /tmp/report.txt
```
→ Groq calls `create_file`. perso **denies** — supervisors cannot create files.

### Scene 3 — admin role (full access)

Switch role to **admin**.

```
Delete /home/user/notes.txt
```
→ perso **allows** `delete_file`. No restrictions for admin.

```
Create /tmp/audit.log and write a line saying "demo complete"
```
→ perso **allows** `create_file`. Full pipeline: LLM intent → perso allow → mock tool executes → Groq replies.

### What to point at during the demo

- The **inline trace** below each assistant message — click to expand the full perso decision (tool name, role, decision, reason, result).
- The **policy sidebar** (top-right "policy" button) — shows which tools are allowed/denied for the active role, and a filtered excerpt of `policy.json`.
- The **status banner** — shows live readiness of the WASM engine and Groq. Useful to explain the architecture.
- **Switching roles** — resets the conversation, updates the suggested prompts, and immediately changes what perso will allow.

---

## Project structure

```
perso-demo/
├── backend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── perso.ts        ← WASM bridge (alloc/dealloc/init/evaluate)
│   │   │   ├── groq.ts       ← Groq client + two-step function calling flow
│   │   │   ├── groqTools.ts  ← Groq tool definitions for 4 mock tools
│   │   │   ├── mockTools.ts    ← fake filesystem implementations
│   │   │   └── types.ts        ← shared domain types
│   │   ├── routes/
│   │   │   ├── health.ts       ← GET /health (wasm + llm feature flags)
│   │   │   ├── evaluate.ts     ← POST /evaluate (raw perso evaluation)
│   │   │   └── chat.ts         ← POST /chat (Groq + perso interception)
│   │   ├── wasm/
│   │   │   ├── policy.json     ← perso policy definition
│   │   │   └── perso.wasm      ← engine binary (not in repo)
│   │   └── index.ts
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/chat/
│   │   │   ├── ChatInput.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── PolicySidebar.tsx
│   │   │   ├── RoleSelector.tsx
│   │   │   ├── StatusBanner.tsx
│   │   │   └── TypingIndicator.tsx
│   │   ├── lib/api.ts
│   │   ├── pages/Index.tsx
│   │   └── types/api.ts
│   └── vite.config.ts
├── pnpm-workspace.yaml
└── package.json
```

---

## pnpm scripts

```bash
pnpm dev              # both services
pnpm dev:backend
pnpm dev:frontend
pnpm build            # production build (frontend)
pnpm typecheck        # tsc --noEmit both packages
```
