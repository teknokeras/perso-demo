import { useRef, useEffect } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export default function ChatInput({ value, onChange, onSend, disabled }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-resize
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) onSend();
    }
  }

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div style={styles.wrap}>
      <div style={styles.inner}>
        <textarea
          ref={ref}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about a file…"
          disabled={disabled}
          style={styles.textarea}
        />
        <button
          onClick={onSend}
          disabled={!canSend}
          style={{
            ...styles.send,
            ...(canSend ? styles.sendActive : styles.sendDisabled),
          }}
          aria-label="Send"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 12V2M2 7L7 2L12 7" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <p style={styles.hint}>Enter to send · Shift+Enter for newline</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    padding: '12px 16px 10px',
    borderTop: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    flexShrink: 0,
  },
  inner: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-strong)',
    borderRadius: 'var(--r-lg)',
    padding: '8px 8px 8px 14px',
  },
  textarea: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    resize: 'none' as const,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
    fontSize: '14px',
    lineHeight: 1.6,
    minHeight: '24px',
    maxHeight: '160px',
    overflowY: 'auto' as const,
  },
  send: {
    width: '30px',
    height: '30px',
    borderRadius: 'var(--r-sm)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    cursor: 'pointer',
    transition: 'all 0.1s',
  },
  sendActive: {
    background: 'var(--accent)',
    color: '#fff',
  },
  sendDisabled: {
    background: 'var(--bg-subtle)',
    color: 'var(--text-muted)',
    cursor: 'not-allowed',
  },
  hint: {
    marginTop: '6px',
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    textAlign: 'center' as const,
  },
};
