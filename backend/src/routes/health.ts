import { Router, Request, Response } from 'express';

const router = Router();

interface HealthResponse {
  status: 'ok';
  service: string;
  version: string;
  timestamp: string;
  features: {
    wasm: boolean;  // enabled Phase 2
    llm: boolean;   // enabled Phase 3
  };
}

router.get('/', (_req: Request, res: Response<HealthResponse>) => {
  res.json({
    status: 'ok',
    service: 'perso-demo-backend',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    features: {
      wasm: false,
      llm: false,
    },
  });
});

export default router;
