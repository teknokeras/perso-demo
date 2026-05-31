import type {
  HealthResponse,
  EvaluateRequest,
  EvaluateResponse,
  ChatRequest,
  ChatResponse,
} from '../types/api';

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export function fetchHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/health');
}

export function evaluate(body: EvaluateRequest): Promise<EvaluateResponse> {
  return request<EvaluateResponse>('/evaluate', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
}

export function sendChat(body: ChatRequest): Promise<ChatResponse> {
  return request<ChatResponse>('/chat', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
}
