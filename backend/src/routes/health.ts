import { Router, Request, Response } from 'express';
import { isGroqReady } from '../lib/groq.js';
import { isPersoReady } from '../lib/persoInstance.js';

const router = Router();

interface HealthResponse {
  status: 'ok';
  service: string;
  version: string;
  timestamp: string;
  features: {
    wasm: boolean;
    llm: boolean;
  };
}

router.get('/', (_req: Request, res: Response<HealthResponse>) => {
  res.json({
    status: 'ok',
    service: 'perso-demo-backend',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    features: {
      wasm: isPersoReady(),
      llm: isGroqReady(),
    },
  });
});

export default router;
