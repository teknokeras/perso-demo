export interface HealthResponse {
  status: 'ok';
  service: string;
  version: string;
  timestamp: string;
  features: {
    wasm: boolean;
    llm: boolean;
  };
}
