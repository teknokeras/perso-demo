export default function TypingIndicator() {
  return (
    <div style={styles.row}>
      <div style={styles.avatar}>P</div>
      <div style={styles.body}>
        <span style={styles.name}>perso-demo</span>
        <div style={styles.bubble}>
          <span style={styles.dot} />
          <span style={{ ...styles.dot, animationDelay: '0.15s' }} />
          <span style={{ ...styles.dot, animationDelay: '0.30s' }} />
        </div>
      </div>
      <style>{KEYFRAMES}</style>
    </div>
  );
}

const KEYFRAMES = `
  @keyframes blink {
    0%, 80%, 100% { opacity: 0.2; transform: translateY(0); }
    40%           { opacity: 1;   transform: translateY(-3px); }
  }
`;

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    padding: '4px 0',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: 'var(--r-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    fontWeight: 600,
    flexShrink: 0,
    marginTop: '2px',
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    border: '1px solid var(--accent-dim)',
  },
  body: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  name: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--text-muted)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
  },
  bubble: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '12px 14px',
    borderRadius: 'var(--r-md)',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
  },
  dot: {
    display: 'inline-block',
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: 'var(--text-tertiary)',
    animation: 'blink 1.2s infinite ease-in-out',
  },
};
