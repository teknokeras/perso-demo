import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Perso } from '@teknokeras/perso-sdk';
import { setPerso } from './lib/persoInstance.js';
import { initGroq } from './lib/groq.js';
import healthRouter from './routes/health.js';
import evaluateRouter from './routes/evaluate.js';
import chatRouter from './routes/chat.js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import waitlistRouter from './routes/waitlist.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
app.use('/health', healthRouter);
app.use('/evaluate', evaluateRouter);
app.use('/chat', chatRouter);
app.use('/waitlist', waitlistRouter);

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
  const wasmPath = resolve(__dirname, '../wasm/perso.wasm');
  const policyPath = resolve(__dirname, '../wasm/policy.json');
  // perso WASM — non-fatal if binary not present yet
  try {
    // await loadPerso();
    const perso = await Perso.load(wasmPath, {
      policy: policyPath,
      audit: {
        // TODO: swap for persoTransport({ apiKey }) when managed service is ready
        enabled: false,
      },
    })
    setPerso(perso)
    console.log('[perso] WASM loaded and policy initialised')
  } catch (err) {
    console.warn('[perso] WASM not loaded:', (err as Error).message);
    console.warn('[perso] Drop perso.wasm into backend/src/wasm/ and restart');
  }

  // Groq — non-fatal if API key not set yet
  try {
    initGroq();
  } catch (err) {
    console.warn('[groq]', (err as Error).message);
    console.warn('[groq] Set GROQ_API_KEY in backend/.env and restart');
  }

  app.listen(PORT, () => {
    console.log(`[perso-demo backend] http://localhost:${PORT}`);
  });
}

start();
