# perso-demo

Interactive demo of [perso](https://github.com/teknokeras/perso) — a WebAssembly policy enforcement engine for MCP tool calls.

The LLM (Groq) calls tools against a mock CRM. perso intercepts every tool call intent before execution and returns Allow or Deny based on the caller's role and runtime attributes. The UI shows the decision inline — green for allow, red for deny — alongside the reason from the policy engine.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TanStack Router — TypeScript |
| Backend | Node.js + Express — TypeScript (`tsx` dev) |
| LLM | Groq (free tier) — `llama-3.1-8b-instant` via `groq-sdk` |
| Policy engine | [`@teknokeras/perso-sdk`](https://github.com/teknokeras/perso-sdk-node) — Node.js SDK wrapping `perso.wasm` |
| Package manager | pnpm 11 workspaces |

---

## How @teknokeras/perso-sdk is used

The backend uses [`@teknokeras/perso-sdk`](https://github.com/teknokeras/perso-sdk-node) — the official Node.js SDK for the perso engine. The SDK wraps the raw WASM ABI (`alloc`/`dealloc`/`init`/`evaluate`) behind a clean async API and handles audit logging via pluggable transports.

```typescript
import { Perso } from '@teknokeras/perso-sdk'

const perso = await Perso.load('path/to/perso.wasm', {
  policy: 'path/to/policy.json',
})

const decision = await perso.evaluate({
  tool: 'process_refund',
  args: { order_id: 'ORD-8821', amount: 800 },
  role: 'agent',
  agentAttributes: { user_id: 'agt-099', env: 'production' },
})
// { decision: 'Deny', reason: '...' }
```

The SDK is loaded once at startup in `backend/src/index.ts` and the instance is shared across routes via `backend/src/lib/persoInstance.ts`. Every tool call intent from the LLM passes through `perso.evaluate()` before any tool is executed.

> **Note:** the SDK ships with no audit transport configured by default — events are silently dropped unless one is explicitly passed to `Perso.load()`. This demo does not wire up a transport, so it does not emit audit events; see [`@teknokeras/perso-sdk`](https://github.com/teknokeras/perso-sdk-node#transports) for `consoleTransport()`, `httpTransport()`, and `fileTransport()` if you want to see them.

---

## Running the demo

### Step 1 — Prerequisites

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **pnpm 11+** — `npm i -g pnpm`
- **Groq API key** — get one free at [console.groq.com/keys](https://console.groq.com/keys)

### Step 2 — Clone and install

```bash
git clone https://github.com/teknokeras/perso-demo.git
cd perso-demo
pnpm install
```

### Step 3 — Build perso.wasm

The repo already includes a compiled `perso.wasm` and `policy.json`. Skip this step for a quick run.

To build your own:

```bash
git clone https://github.com/teknokeras/perso.git
cd perso

rustup target add wasm32-unknown-unknown

cargo run -p policy-compiler -- build \
  --policy policies/example.json \
  --output dist/policy_runtime.wasm

cp dist/policy_runtime.wasm /path/to/perso-demo/backend/wasm/perso.wasm
cp policies/example.json /path/to/perso-demo/backend/wasm/policy.json
```

### Step 4 — Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in:

```env
PORT=3001
FRONTEND_URL=http://localhost:5173

GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
```

| Variable | Required | Description |
|---|---|---|
| `PORT` | no | Backend port (default: `3001`) |
| `FRONTEND_URL` | no | CORS origin (default: `http://localhost:5173`) |
| `GROQ_API_KEY` | **yes** | Your Groq API key |
| `GROQ_MODEL` | **yes** | Groq model ID — `llama-3.1-8b-instant` recommended |

### Step 5 — Run

```bash
pnpm dev
```

Starts both services concurrently:
- Frontend → http://localhost:5173
- Backend → http://localhost:3001

The status banner at the top turns green once the WASM engine and Groq are ready.

---

## Scenario — CRM access control

The demo simulates a B2B SaaS CRM with three roles and seven tools. No real database — all tools return mock responses.

### Roles

| Role | Description |
|---|---|
| `agent` | Front-line support. View and update customers, process refunds up to $500. |
| `manager` | Team lead. Delete own records, access PII (with MFA), export data, refunds up to $2,000. |
| `admin` | Full access. All operations including bulk updates (requires MFA + production env). |

### Tools and permissions

| Tool | agent | manager | admin | Condition |
|---|---|---|---|---|
| `view_customer` | ✅ | ✅ | ✅ | — |
| `update_customer` | ✅ | ✅ | ✅ | — |
| `delete_customer` | ❌ | ✅ | ✅ | manager: `user_id == owner_id` only |
| `process_refund` | ✅ | ✅ | ✅ | agent: `amount ≤ $500` · manager/admin: `amount ≤ $2,000` |
| `access_pii` | ❌ | ✅ | ✅ | `mfa_verified` must be present |
| `export_data` | ❌ | ✅ | ✅ | `env == production` only |
| `bulk_update` | ❌ | ❌ | ✅ | `env == production` + `mfa_verified` |

Default action: **Deny**. Anything not explicitly allowed is rejected.

### Mock data

**Customers**

| ID | Name | Plan | Owner |
|---|---|---|---|
| `C-1042` | Alice Hartwell | Pro | `mgr-001` (demo manager) |
| `C-2038` | Daniel Osei | Starter | `mgr-001` (demo manager) |
| `C-9001` | Priya Menon | Enterprise | `mgr-002` (different manager) |

**Orders**

| ID | Customer | Amount |
|---|---|---|
| `ORD-8821` | C-1042 | $249.99 |
| `ORD-9910` | C-2038 | $1,899.00 |
| `ORD-5533` | C-9001 | $89.50 |

### Condition types demonstrated

Each deny in this demo fires a different perso condition type:

| Scenario | Condition type |
|---|---|
| Agent tries to refund $800 | `NumericCheck` — `Arguments.amount > 500` |
| Manager tries to delete C-9001 | `FieldEquals` — `AgentAttributes.user_id ≠ ResourceAttributes.owner_id` |
| Manager tries to access PII without MFA | `FieldPresent` — `AgentAttributes.mfa_verified` missing |
| Manager tries to export from staging | `StringCheck` — `AgentAttributes.env ≠ production` |
| Admin tries to bulk update without MFA | `All` — both `env` and `mfa_verified` must pass |

---

## Demo script

Walk through these prompts in order to show the full allow/deny contrast.

### Scene 1 — agent role (view + update + limited refund)

Set role to **agent**.

```
Look up customer C-1042
```
→ perso **allows** `view_customer`. Returns Alice Hartwell's record.

```
Process a $200 refund for order ORD-8821
```
→ perso **allows** `process_refund`. Amount is within the $500 agent cap.

```
Try to process a $800 refund for order ORD-8821
```
→ perso **denies** — `NumericCheck` fails. $800 exceeds the $500 agent limit.

```
Try to delete customer C-1042's record
```
→ perso **denies** — `delete_customer` is not in the agent ruleset. Default action kicks in.

### Scene 2 — manager role (own records + PII + export)

Switch role to **manager** (conversation resets).

```
Delete customer C-2038's record
```
→ perso **allows** `delete_customer`. C-2038 is owned by `mgr-001` — `FieldEquals` passes.

```
Try to delete customer C-9001's record
```
→ perso **denies** — C-9001 is owned by `mgr-002`. `FieldEquals` fails: `user_id ≠ owner_id`.

```
View full PII for customer C-1042 (I have MFA verified)
```
→ perso **allows** `access_pii`. MFA claim detected in message — `mfa_verified` attribute set.

```
Export the Q2 customer report
```
→ perso **denies** — `StringCheck` on `env` fails. Demo is in staging env for this role.

### Scene 3 — admin role (full access)

Switch role to **admin**.

```
Delete any customer record — C-9001
```
→ perso **allows** `delete_customer`. Admin role satisfies the `StringCheck` fallback in the `Any` condition.

```
Run a bulk update to mark all inactive accounts
```
→ perso **allows** `bulk_update`. Both `env = production` and `mfa_verified` are set for admin.

```
Try to bulk update without MFA verified
```
→ perso **denies** — `All` condition fails. `mfa_verified` attribute is absent.

### What to point at during the demo

- The **inline trace** below each assistant message — click to expand the full perso decision (tool name, role, decision, reason, result).
- The **policy sidebar** (`⚖ policy` button, top-right) — shows which tools are allowed/denied for the active role and the conditions that apply.
- The **raw JSON panel** (`{ }` button, top-right) — shows the full `policy.json` with syntax highlighting. Useful for technical audiences.
- The **status banner** — shows live readiness of the WASM engine and Groq.
- **Switching roles** — resets the conversation, updates suggested prompts, and immediately changes what perso will allow.

---

## Project structure

```
perso-demo/
├── backend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── persoInstance.ts  ← perso-sdk singleton (shared across routes)
│   │   │   ├── groq.ts           ← Groq client + two-step function calling flow + agentAttributes builder
│   │   │   ├── groqTools.ts      ← Groq tool definitions for 7 CRM tools
│   │   │   ├── mockTools.ts      ← fake CRM implementations + resource attribute resolver
│   │   │   └── types.ts          ← shared domain types
│   │   ├── routes/
│   │   │   ├── health.ts         ← GET /health (wasm + llm feature flags)
│   │   │   ├── evaluate.ts       ← POST /evaluate (raw perso evaluation)
│   │   │   └── chat.ts           ← POST /chat (Groq + perso interception)
│   │   └── index.ts
│   ├── wasm/
│   │   ├── policy.json           ← perso policy definition
│   │   └── perso.wasm            ← compiled engine binary
│   ├── .env.example
│   └── .env                      ← gitignored — never commit this
├── frontend/
│   ├── src/
│   │   ├── components/chat/
│   │   │   ├── ChatInput.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── EmptyState.tsx       ← role-aware prompt cards
│   │   │   ├── PolicySidebar.tsx    ← human-readable policy + raw JSON drawer
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
pnpm dev              # start both frontend and backend from root
pnpm dev:backend      # backend only
pnpm dev:frontend     # frontend only
pnpm build            # production build (frontend)
pnpm typecheck        # tsc --noEmit both packages
```

---

## Related repos

| Repo | Description |
|---|---|
| [teknokeras/perso](https://github.com/teknokeras/perso) | Rust/WASM policy engine |
| [teknokeras/perso-sdk-node](https://github.com/teknokeras/perso-sdk-node) | Node.js SDK used by this demo |