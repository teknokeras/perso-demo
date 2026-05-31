import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { loadPerso } from './lib/perso.js';
import { initGemini } from './lib/gemini.js';
import healthRouter   from './routes/health.js';
import evaluateRouter from './routes/evaluate.js';
import chatRouter     from './routes/chat.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/health',   healthRouter);
app.use('/evaluate', evaluateRouter);
app.use('/chat',     chatRouter);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[error]', err);
  res.status(500).json({ error: err.message ?? 'Internal server error' });
});

// ── Startup ───────────────────────────────────────────────────────────────────
async function start() {
  // perso WASM — non-fatal if binary not present yet
  try {
    await loadPerso();
  } catch (err) {
    console.warn('[perso] WASM not loaded:', (err as Error).message);
    console.warn('[perso] Drop perso.wasm into backend/src/wasm/ and restart');
  }

  // Gemini — non-fatal if API key not set yet
  try {
    initGemini();
  } catch (err) {
    console.warn('[gemini]', (err as Error).message);
    console.warn('[gemini] Set GOOGLE_API_KEY in backend/.env and restart');
  }

  app.listen(PORT, () => {
    console.log(`[perso-demo backend] http://localhost:${PORT}`);
  });
}

start();
