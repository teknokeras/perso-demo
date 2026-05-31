import { useEffect, useState } from 'react';
import { fetchHealth } from '../../lib/api';
import type { HealthResponse } from '../../types/api';

type BannerState = 'checking' | 'ok' | 'warn' | 'error';

interface Status {
  state: BannerState;
  message: string;
}

function deriveStatus(health: HealthResponse): Status {
  if (!health.features.wasm && !health.features.llm) {
    return { state: 'warn', message: 'Policy engine and LLM not ready — add perso.wasm and GOOGLE_API_KEY, then restart' };
  }
  if (!health.features.wasm) {
    return { state: 'warn', message: 'Policy engine not ready — drop perso.wasm into backend/src/wasm/ and restart' };
  }
  if (!health.features.llm) {
    return { state: 'warn', message: 'Gemini not ready — set GOOGLE_API_KEY in backend/.env and restart' };
  }
  return { state: 'ok', message: 'Policy engine and Gemini ready' };
}

export default function StatusBanner() {
  const [status, setStatus] = useState<Status>({ state: 'checking', message: 'Connecting to backend…' });
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const health = await fetchHealth();
        if (!cancelled) {
          const s = deriveStatus(health);
          setStatus(s);
          // Auto-hide after 3s if everything is ok
          if (s.state === 'ok') {
            setTimeout(() => { if (!cancelled) setVisible(false); }, 3000);
          } else {
            setVisible(true);
          }
        }
      } catch {
        if (!cancelled) {
          setStatus({ state: 'error', message: 'Backend unreachable — is the server running on :3001?' });
          setVisible(true);
        }
      }
    }

    poll();
    const interval = setInterval(poll, 10_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (!visible) return null;

  const colors: Record<BannerState, { bg: string; border: string; text: string; dot: string }> = {
    checking: { bg: 'var(--bg-elevated)',  border: 'var(--border)',        text: 'var(--text-secondary)', dot: 'var(--text-muted)' },
    ok:       { bg: 'var(--allow-bg)',     border: 'var(--allow-border)',  text: 'var(--allow)',          dot: 'var(--allow)' },
    warn:     { bg: '#1a1500',             border: '#3d3000',              text: '#e6b800',               dot: '#e6b800' },
    error:    { bg: 'var(--deny-bg)',      border: 'var(--deny-border)',   text: 'var(--deny)',           dot: 'var(--deny)' },
  };

  const c = colors[status.state];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '10px',
      padding: '7px 16px',
      background: c.bg,
      borderBottom: `1px solid ${c.border}`,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          width: '6px', height: '6px',
          borderRadius: '50%',
          background: c.dot,
          flexShrink: 0,
          boxShadow: status.state === 'ok' ? `0 0 6px ${c.dot}` : 'none',
        }} />
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: c.text,
        }}>
          {status.message}
        </span>
      </div>
      {status.state !== 'checking' && (
        <button
          onClick={() => setVisible(false)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: c.text, opacity: 0.6, fontSize: '14px', lineHeight: 1,
            padding: '0 2px', flexShrink: 0,
          }}
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
}
