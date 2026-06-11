import { Router, Request, Response } from 'express';
import { chat, isGroqReady } from '../lib/groq.js';
import { isPersoReady } from '../lib/persoInstance.js';
import type { ChatRequestBody, ChatResponseBody, Role } from '../lib/types.js';
import { ROLES } from '../lib/types.js';

const router = Router();

router.post(
  '/',
  async (
    req: Request<object, ChatResponseBody | { error: string }, ChatRequestBody>,
    res: Response,
  ) => {
    // ── Guards ──────────────────────────────────────────────────────────────
    if (!isGroqReady()) {
      res.status(503).json({ error: 'Groq not initialised — set GROQ_API_KEY and restart' });
      return;
    }

    if (!isPersoReady()) {
      res.status(503).json({ error: 'Policy engine not loaded — drop perso.wasm into backend/src/wasm/ and restart' });
      return;
    }

    // ── Validate ────────────────────────────────────────────────────────────
    const { messages, role } = req.body ?? {};

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: '`messages` must be a non-empty array' });
      return;
    }

    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== 'user' || typeof lastMsg.content !== 'string') {
      res.status(400).json({ error: 'Last message in `messages` must be a user message with a string content' });
      return;
    }

    if (!role || !ROLES.includes(role as Role)) {
      res.status(400).json({ error: `\`role\` must be one of: ${ROLES.join(', ')}` });
      return;
    }

    // ── Call Gemini ─────────────────────────────────────────────────────────
    try {
      const result = await chat(messages, role as Role);
      res.json(result);
    } catch (err) {
      console.error('[chat] error:', err);
      res.status(500).json({ error: (err as Error).message ?? 'Unexpected error during chat' });
    }
  },
);

export default router;
