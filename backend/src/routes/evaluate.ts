import { Router, Request, Response } from 'express';
import { persoEvaluate, isPersoReady } from '../lib/perso.js';
import { executeMockTool } from '../lib/mockTools.js';
import type {
  EvaluateRequestBody,
  EvaluateResponseBody,
  Role,
  ToolName,
} from '../lib/types.js';
import { ROLES, TOOL_NAMES } from '../lib/types.js';

const router = Router();

router.post(
  '/',
  (req: Request<object, EvaluateResponseBody, EvaluateRequestBody>, res: Response) => {
    // ── Guard: WASM must be ready ───────────────────────────────────────────
    if (!isPersoReady()) {
      res.status(503).json({
        decision: 'Deny',
        reason: 'Policy engine not loaded — drop perso.wasm into backend/src/wasm/ and restart',
        toolName: req.body?.toolName ?? ('' as ToolName),
        role: req.body?.role ?? ('' as Role),
      });
      return;
    }

    // ── Validate request body ───────────────────────────────────────────────
    const { toolName, args = {}, role, agentAttributes = {}, resourceAttributes = {} } =
      req.body ?? {};

    if (!toolName || !TOOL_NAMES.includes(toolName)) {
      res.status(400).json({
        decision: 'Deny',
        reason: `Invalid toolName. Must be one of: ${TOOL_NAMES.join(', ')}`,
        toolName,
        role,
      });
      return;
    }

    if (!role || !ROLES.includes(role)) {
      res.status(400).json({
        decision: 'Deny',
        reason: `Invalid role. Must be one of: ${ROLES.join(', ')}`,
        toolName,
        role,
      });
      return;
    }

    // ── Ask perso ───────────────────────────────────────────────────────────
    const evaluation = persoEvaluate(
      toolName,
      args,
      role,
      agentAttributes,
      resourceAttributes,
    );

    // ── Execute mock tool only if allowed ───────────────────────────────────
    let result: string | undefined;
    if (evaluation.decision === 'Allow') {
      result = executeMockTool(toolName, args);
    }

    const response: EvaluateResponseBody = {
      decision: evaluation.decision,
      reason:   evaluation.reason,
      toolName,
      role,
      result,
    };

    res.json(response);
  },
);

export default router;
