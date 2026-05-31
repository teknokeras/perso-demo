import { useState } from 'react';
import type { PersoTrace } from '../../types/api';

interface Props {
  trace: PersoTrace;
}

export default function TracePanel({ trace }: Props) {
  const [open, setOpen] = useState(false);
  const allowed = trace.decision === 'Allow';

  return (
    <div style={{ ...styles.wrap, ...(allowed ? styles.wrapAllow : styles.wrapDeny) }}>
      {/* ── Badge row ── */}
      <div style={styles.header} onClick={() => setOpen((o) => !o)}>
        <div style={styles.left}>
          <span style={{ ...styles.badge, ...(allowed ? styles.badgeAllow : styles.badgeDeny) }}>
            {allowed ? '✓ allow' : '✗ deny'}
          </span>
          <span style={styles.toolName}>
            {trace.toolName}
          </span>
          {Object.keys(trace.args).length > 0 && (
            <span style={styles.argPreview}>
              {formatArgPreview(trace.args)}
            </span>
          )}
        </div>
        <button style={styles.toggle} aria-label="Toggle trace detail">
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
          >
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* ── Expanded detail ── */}
      {open && (
        <div style={styles.detail}>
          <Row label="tool"     value={trace.toolName} />
          <Row label="role"     value={trace.role} />
          <Row label="decision" value={trace.decision} color={allowed ? 'var(--allow)' : 'var(--deny)'} />
          <Row label="reason"   value={trace.reason} wrap />
          {Object.keys(trace.args).length > 0 && (
            <Row label="args" value={JSON.stringify(trace.args, null, 2)} wrap mono />
          )}
          {trace.result && (
            <Row label="result" value={trace.result} wrap mono />
          )}
        </div>
      )}
    </div>
  );
}

function Row({
  label, value, color, wrap, mono,
}: {
  label: string;
  value: string;
  color?: string;
  wrap?: boolean;
  mono?: boolean;
}) {
  return (
    <div style={rowStyles.row}>
      <span style={rowStyles.key}>{label}</span>
      <span style={{
        ...rowStyles.val,
        ...(color ? { color } : {}),
        ...(wrap ? rowStyles.wrap : {}),
        ...(mono ? rowStyles.mono : {}),
      }}>
        {value}
      </span>
    </div>
  );
}

function formatArgPreview(args: Record<string, unknown>): string {
  const entries = Object.entries(args).slice(0, 2);
  return entries.map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(' ');
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    borderRadius: 'var(--r-md)',
    border: '1px solid',
    overflow: 'hidden',
    marginTop: '8px',
  },
  wrapAllow: {
    borderColor: 'var(--allow-border)',
    background: 'var(--allow-bg)',
  },
  wrapDeny: {
    borderColor: 'var(--deny-border)',
    background: 'var(--deny-bg)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '7px 10px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  badge: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    fontWeight: 500,
    padding: '2px 7px',
    borderRadius: '3px',
    letterSpacing: '0.04em',
  },
  badgeAllow: {
    background: 'var(--allow-border)',
    color: 'var(--allow)',
  },
  badgeDeny: {
    background: 'var(--deny-border)',
    color: 'var(--deny)',
  },
  toolName: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: 'var(--text-primary)',
  },
  argPreview: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--text-tertiary)',
  },
  toggle: {
    background: 'none',
    border: 'none',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
  },
  detail: {
    borderTop: '1px solid var(--border)',
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
};

const rowStyles: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    fontSize: '12px',
  },
  key: {
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-tertiary)',
    minWidth: '60px',
    flexShrink: 0,
    paddingTop: '1px',
  },
  val: {
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-secondary)',
    flex: 1,
  },
  wrap: {
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
  },
  mono: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
  },
};
