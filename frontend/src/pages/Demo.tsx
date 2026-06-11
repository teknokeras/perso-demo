import { useState, useRef, useEffect, useCallback } from 'react';
import { sendChat } from '../lib/api';
import type { Role, ChatMessage as ApiChatMessage } from '../types/api';
import RoleSelector from '../components/chat/RoleSelector';
import PolicySidebar from '../components/chat/PolicySidebar';
import StatusBanner from '../components/chat/StatusBanner';
import ChatMessage, { type MessageData } from '../components/chat/ChatMessage';
import TypingIndicator from '../components/chat/TypingIndicator';
import EmptyState from '../components/chat/EmptyState';
import ChatInput from '../components/chat/ChatInput';
import { Link } from '@tanstack/react-router';

let idCounter = 0;
const uid = () => String(++idCounter);

// ── Role-aware suggested prompts ──────────────────────────────────────────────

const ROLE_PROMPTS: Record<Role, { text: string; willDeny?: boolean }[]> = {
  viewer: [
    { text: 'Read /etc/config.json' },
    { text: 'Show me /var/log/app.log' },
    { text: 'Try to delete /etc/config.json', willDeny: true },
    { text: 'Try to create /tmp/test.txt', willDeny: true },
  ],
  supervisor: [
    { text: 'Read /etc/config.json' },
    { text: 'Update /home/user/notes.txt with a meeting summary' },
    { text: 'Try to delete /app/secrets.env', willDeny: true },
    { text: 'Try to create /tmp/report.txt', willDeny: true },
  ],
  admin: [
    { text: 'Read /app/secrets.env' },
    { text: 'Create /tmp/report.txt with some content' },
    { text: 'Update /etc/config.json to enable debug mode' },
    { text: 'Delete /home/user/notes.txt' },
  ],
};

// ── Quick action bar ──────────────────────────────────────────────────────────

function QuickActions({ role, onPrompt, disabled }: {
  role: Role;
  onPrompt: (text: string) => void;
  disabled: boolean;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const prompts = ROLE_PROMPTS[role];

  return (
    <div style={qa.wrap}>
      <span style={qa.label}>quick actions</span>
      <div style={qa.list}>
        {prompts.map((p) => {
          const isHovered = hovered === p.text;
          return (
            <button
              key={p.text}
              onClick={() => !disabled && onPrompt(p.text)}
              onMouseEnter={() => setHovered(p.text)}
              onMouseLeave={() => setHovered(null)}
              disabled={disabled}
              style={{
                ...qa.btn,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                background: isHovered
                  ? (p.willDeny ? '#FEF2F2' : '#F3F4F6')
                  : '#fff',
                borderColor: isHovered
                  ? (p.willDeny ? '#FCCFCF' : '#D1D5DB')
                  : '#E5E7EB',
                color: isHovered ? '#111827' : '#6B7280',
              }}
            >
              <span style={{
                ...qa.icon,
                color: p.willDeny ? '#E24B4A' : '#9CA3AF',
              }}>
                {p.willDeny ? '✗' : '→'}
              </span>
              {p.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const qa: Record<string, React.CSSProperties> = {
  wrap: {
    padding: '10px 16px 0',
    maxWidth: '720px',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flexShrink: 0,
  },
  label: {
    fontFamily: "'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace",
    fontSize: '10px',
    color: '#9CA3AF',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  list: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
  },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 10px',
    borderRadius: '5px',
    border: '0.5px solid',
    fontSize: '12px',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    transition: 'background 0.1s, border-color 0.1s, color 0.1s',
    whiteSpace: 'nowrap' as const,
    background: '#fff',
  },
  icon: {
    fontFamily: "'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace",
    fontSize: '11px',
    flexShrink: 0,
  },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [role, setRole] = useState<Role>('viewer');
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function buildHistory(displayMsgs: MessageData[]): ApiChatMessage[] {
    return displayMsgs.map((m) => ({ role: m.role, content: m.content }));
  }

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: MessageData = { id: uid(), role: 'user', content: text.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await sendChat({ messages: buildHistory(nextMessages), role });
      setMessages((prev) => [...prev, {
        id: uid(), role: 'assistant', content: res.reply, trace: res.trace,
      }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        id: uid(), role: 'assistant',
        content: (err as Error).message ?? 'Something went wrong.',
        isError: true,
      }]);
    } finally {
      setLoading(false);
    }
  }, [messages, role, loading]);

  function handleRoleChange(newRole: Role) {
    setRole(newRole);
    setMessages([]);
    setInput('');
  }

  const hasMessages = messages.length > 0 || loading;

  return (
    <>
      {/* ── Light theme overrides ── */}
      <style>{`
        .demo-shell {
          --bg-base:      #FFFFFF;
          --bg-surface:   #F9FAFB;
          --bg-elevated:  #FFFFFF;
          --bg-subtle:    #F3F4F6;
          --border:       #E5E7EB;
          --border-strong: #D1D5DB;
          --text-primary:   #111827;
          --text-secondary: #374151;
          --text-tertiary:  #6B7280;
          --text-muted:     #9CA3AF;
          --allow:        #1D9E75;
          --allow-bg:     #F0FAF6;
          --allow-border: #A8DFC9;
          --deny:         #E24B4A;
          --deny-bg:      #FEF2F2;
          --deny-border:  #FCCFCF;
          --font-sans:    -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          --font-mono:    'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace;
          --r-sm: 5px;
          --r-md: 7px;
          --r-lg: 10px;
        }
      `}</style>

      <div className="demo-shell" style={styles.shell}>

        {/* ── Top bar ── */}
        <header style={styles.topbar}>
          <div style={styles.topbarLeft}>
            <Link to="/" style={styles.backLink}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Link>
            <div style={styles.brand}>
              <span style={styles.logoDot} />
              <span style={styles.brandName}>perso</span>
              <span style={styles.brandSep}>·</span>
              <span style={styles.brandSub}>live demo</span>
            </div>
          </div>
          <div style={styles.topbarRight}>
            <RoleSelector value={role} onChange={handleRoleChange} disabled={loading} />
            <div style={styles.divider} />
            <PolicySidebar role={role} />
          </div>
        </header>

        {/* ── Status banner ── */}
        <StatusBanner />

        {/* ── Message thread ── */}
        <main style={styles.thread}>
          {!hasMessages ? (
            <EmptyState role={role} onPrompt={(p) => send(p)} />
          ) : (
            <div style={styles.scrollArea}>
              <QuickActions role={role} onPrompt={send} disabled={loading} />
              <div style={styles.threadDivider} />
              <div style={styles.messages}>
                {messages.map((m) => (
                  <ChatMessage key={m.id} message={m} />
                ))}
                {loading && <TypingIndicator />}
                <div ref={bottomRef} />
              </div>
            </div>
          )}
        </main>

        {/* ── Input ── */}
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={() => send(input)}
          disabled={loading}
        />
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg-base)',
    overflow: 'hidden',
    fontFamily: 'var(--font-sans)',
    WebkitFontSmoothing: 'antialiased',
  },
  topbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    height: '52px',
    borderBottom: '0.5px solid var(--border)',
    background: 'var(--bg-surface)',
    flexShrink: 0,
    gap: '12px',
  },
  topbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  backLink: {
    display: 'flex',
    alignItems: 'center',
    color: 'var(--text-muted)',
    padding: '4px',
    borderRadius: '5px',
    transition: 'color 0.15s',
    textDecoration: 'none',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  logoDot: {
    width: 8,
    height: 8,
    background: '#1D9E75',
    borderRadius: '50%',
    flexShrink: 0,
    display: 'inline-block',
  },
  brandName: {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  brandSep: { color: 'var(--text-muted)', fontSize: '14px' },
  brandSub: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--text-tertiary)',
  },
  topbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  divider: {
    width: '1px',
    height: '20px',
    background: 'var(--border)',
  },
  thread: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  threadDivider: {
    height: '0.5px',
    background: 'var(--border)',
    margin: '10px 16px 0',
    maxWidth: '720px',
    width: 'calc(100% - 32px)',
    alignSelf: 'center',
  },
  messages: {
    padding: '16px 16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '720px',
    width: '100%',
    margin: '0 auto',
  },
};
