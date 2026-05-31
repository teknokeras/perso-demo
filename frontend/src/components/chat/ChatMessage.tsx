import TracePanel from './TracePanel';
import type { PersoTrace } from '../../types/api';

export interface MessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  trace?: PersoTrace;
  isError?: boolean;
}

interface Props {
  message: MessageData;
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div style={{ ...styles.row, ...(isUser ? styles.rowUser : styles.rowAssistant) }}>
      <div style={{ ...styles.avatar, ...(isUser ? styles.avatarUser : styles.avatarAssistant) }}>
        {isUser ? 'U' : 'P'}
      </div>
      <div style={styles.body}>
        <span style={{ ...styles.name, ...(isUser ? styles.nameUser : {}) }}>
          {isUser ? 'you' : 'perso-demo'}
        </span>
        <div style={{
          ...styles.bubble,
          ...(isUser ? styles.bubbleUser : styles.bubbleAssistant),
          ...(message.isError ? styles.bubbleError : {}),
        }}>
          <MessageContent content={message.content} />
        </div>
        {message.trace && <TracePanel trace={message.trace} />}
      </div>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  // Render inline code blocks with mono styling
  const parts = content.split(/(`[^`]+`)/g);
  return (
    <p style={styles.text}>
      {parts.map((part, i) =>
        part.startsWith('`') && part.endsWith('`') ? (
          <code key={i} style={styles.inlineCode}>{part.slice(1, -1)}</code>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    padding: '4px 0',
  },
  rowUser: {
    flexDirection: 'row-reverse',
  },
  rowAssistant: {
    flexDirection: 'row',
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
  },
  avatarUser: {
    background: 'var(--bg-subtle)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
  },
  avatarAssistant: {
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    border: '1px solid var(--accent-dim)',
  },
  body: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    maxWidth: 'calc(100% - 44px)',
    flex: 1,
  },
  name: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--text-muted)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
  },
  nameUser: {
    textAlign: 'right' as const,
  },
  bubble: {
    padding: '10px 14px',
    borderRadius: 'var(--r-md)',
    border: '1px solid var(--border)',
    lineHeight: 1.6,
  },
  bubbleUser: {
    background: 'var(--bg-subtle)',
    borderColor: 'var(--border-strong)',
    alignSelf: 'flex-end',
  },
  bubbleAssistant: {
    background: 'var(--bg-elevated)',
    borderColor: 'var(--border)',
    alignSelf: 'flex-start',
  },
  bubbleError: {
    borderColor: 'var(--deny-border)',
    background: 'var(--deny-bg)',
  },
  text: {
    fontSize: '14px',
    color: 'var(--text-primary)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  inlineCode: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    background: 'var(--bg-subtle)',
    border: '1px solid var(--border)',
    borderRadius: '3px',
    padding: '1px 5px',
    color: 'var(--accent)',
  },
};
