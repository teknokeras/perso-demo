import { useEffect, useState } from 'react';
import { fetchHealth } from '../lib/api';
import type { HealthResponse } from '../types/api';

type Status = 'idle' | 'ok' | 'error';

export default function IndexPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [data, setData] = useState<HealthResponse | null>(null);

  useEffect(() => {
    fetchHealth()
      .then((d) => { setData(d); setStatus('ok'); })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <main className="root">
        <div className="card">
          <span className="icon">🔐</span>
          <h1>perso-demo</h1>
          <p className="sub">Policy enforcement for MCP tool calls</p>

          <div className={`badge badge--${status}`}>
            <span className="badge__dot" />
            {status === 'idle' && 'Connecting to backend…'}
            {status === 'ok' && `Backend ${data?.status ?? 'ok'} · v${data?.version}`}
            {status === 'error' && 'Backend unreachable'}
          </div>

          <div className="phases">
            {PHASES.map((p) => (
              <div key={p.n} className={`phase ${p.done ? 'phase--done' : ''}`}>
                <span className="phase__n">{p.done ? '✓' : p.n}</span>
                <span className="phase__label">{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

const PHASES = [
  { n: 1, label: 'Project setup', done: true },
  { n: 2, label: 'Backend core — WASM + mock tools', done: false },
  { n: 3, label: 'LLM integration — Gemini', done: false },
  { n: 4, label: 'Frontend chat UI', done: false },
  { n: 5, label: 'Polish — trace panel + policy viewer', done: false },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .root {
    min-height: 100dvh;
    display: grid;
    place-items: center;
    background: #0c0c0d;
    font-family: 'IBM Plex Sans', sans-serif;
    padding: 2rem;
  }

  .card {
    background: #131316;
    border: 1px solid #222228;
    border-radius: 12px;
    padding: 2.5rem 2rem;
    width: 100%;
    max-width: 420px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .icon { font-size: 2.5rem; }

  h1 {
    font-size: 1.4rem;
    font-weight: 600;
    color: #f0f0f2;
    letter-spacing: -0.02em;
  }

  .sub {
    font-size: 0.8rem;
    color: #555;
    font-family: 'IBM Plex Mono', monospace;
    text-align: center;
  }

  .badge {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-family: 'IBM Plex Mono', monospace;
    border: 1px solid transparent;
  }
  .badge__dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .badge--idle  { color: #666; border-color: #222; }
  .badge--idle  .badge__dot { background: #444; }
  .badge--ok    { color: #4ade80; border-color: #1a3d2b; background: #0d2218; }
  .badge--ok    .badge__dot { background: #4ade80; box-shadow: 0 0 6px #4ade8099; }
  .badge--error { color: #f87171; border-color: #3d1a1a; background: #220d0d; }
  .badge--error .badge__dot { background: #f87171; }

  .phases {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 0.5rem;
  }

  .phase {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 6px;
    color: #3a3a44;
    font-size: 0.8rem;
  }
  .phase--done {
    color: #888;
  }
  .phase__n {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.7rem;
    width: 18px;
    text-align: center;
    color: #2a2a30;
    flex-shrink: 0;
  }
  .phase--done .phase__n { color: #4ade80; }
  .phase__label { flex: 1; }
  .phase--done .phase__label { color: #999; }
`;
