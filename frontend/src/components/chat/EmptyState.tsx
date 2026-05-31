import { useState } from 'react';
import type { Role } from '../../types/api';

interface Props {
  role: Role;
  onPrompt: (text: string) => void;
}

const PROMPTS: Record<Role, { text: string; willDeny?: boolean }[]> = {
  viewer: [
    { text: 'Read /etc/config.json' },
    { text: 'Show me /var/log/app.log' },
    { text: 'Read /home/user/notes.txt' },
    { text: 'Try to delete /etc/config.json', willDeny: true },
  ],
  supervisor: [
    { text: 'Read /etc/config.json' },
    { text: 'Update /home/user/notes.txt with a meeting summary' },
    { text: 'Try to delete /app/secrets.env', willDeny: true },
    { text: 'Try to create /tmp/test.txt', willDeny: true },
  ],
  admin: [
    { text: 'Read /app/secrets.env' },
    { text: 'Create /tmp/report.txt with some content' },
    { text: 'Delete /home/user/notes.txt' },
    { text: 'Update /etc/config.json to enable debug mode' },
  ],
};

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  viewer:     'read only',
  supervisor: 'read + update',
  admin:      'full access',
};

export default function EmptyState({ role, onPrompt }: Props) {
  return (
    <div style={styles.wrap}>
      <div style={styles.icon}>🔐</div>
      <h2 style={styles.heading}>perso-demo</h2>
      <p style={styles.sub}>
        Policy enforcement for MCP tool calls.{' '}
        <span style={styles.roleChip}>{role}</span>
        <span style={styles.roleDesc}> · {ROLE_DESCRIPTIONS[role]}</span>
      </p>
      <div style={styles.grid}>
        {PROMPTS[role].map((p) => (
          <PromptCard key={p.text} prompt={p} onPrompt={onPrompt} />
        ))}
      </div>
      <p style={styles.hint}>Cards marked <span style={{ color: 'var(--deny)', fontFamily: 'var(--font-mono)' }}>✗</span> will be denied by perso</p>
    </div>
  );
}

function PromptCard({ prompt, onPrompt }: { prompt: { text: string; willDeny?: boolean }; onPrompt: (t: string) => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={() => onPrompt(prompt.text)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...styles.prompt,
        background: hovered
          ? (prompt.willDeny ? 'var(--deny-bg)' : 'var(--bg-subtle)')
          : 'var(--bg-elevated)',
        borderColor: hovered
          ? (prompt.willDeny ? 'var(--deny-border)' : 'var(--border-strong)')
          : 'var(--border)',
        color: hovered ? 'var(--text-primary)' : 'var(--text-secondary)',
      }}
    >
      <span style={{
        ...styles.promptArrow,
        color: prompt.willDeny ? 'var(--deny)' : 'var(--text-muted)',
      }}>
        {prompt.willDeny ? '✗' : '→'}
      </span>
      {prompt.text}
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: '2rem',
    gap: '14px',
    textAlign: 'center' as const,
  },
  icon: { fontSize: '2rem', opacity: 0.5 },
  heading: {
    fontFamily: 'var(--font-mono)',
    fontSize: '18px',
    fontWeight: 500,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  sub: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    maxWidth: '360px',
    lineHeight: 1.6,
  },
  roleChip: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    padding: '2px 7px',
    borderRadius: '3px',
    background: 'var(--bg-subtle)',
    border: '1px solid var(--border-strong)',
    color: 'var(--text-primary)',
  },
  roleDesc: {
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    marginTop: '4px',
    width: '100%',
    maxWidth: '500px',
  },
  prompt: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: 'var(--r-md)',
    border: '1px solid',
    fontSize: '13px',
    textAlign: 'left' as const,
    cursor: 'pointer',
    transition: 'background 0.12s, border-color 0.12s, color 0.12s',
    fontFamily: 'var(--font-sans)',
    lineHeight: 1.4,
  },
  promptArrow: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    flexShrink: 0,
    marginTop: '1px',
  },
  hint: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
};
