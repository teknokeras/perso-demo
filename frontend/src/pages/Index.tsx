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

let idCounter = 0;
const uid = () => String(++idCounter);

export default function IndexPage() {
  const [role, setRole]         = useState<Role>('viewer');
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);

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

  return (
    <div style={styles.shell}>

      {/* ── Top bar ── */}
      <header style={styles.topbar}>
        <div style={styles.brand}>
          <span style={styles.brandIcon}>🔐</span>
          <span style={styles.brandName}>perso-demo</span>
          <span style={styles.brandSep}>·</span>
          <span style={styles.brandSub}>policy enforcement</span>
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
        {messages.length === 0 && !loading ? (
          <EmptyState role={role} onPrompt={(p) => send(p)} />
        ) : (
          <div style={styles.messages}>
            {messages.map((m) => (
              <ChatMessage key={m.id} message={m} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
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
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg-base)',
    overflow: 'hidden',
  },
  topbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    height: '52px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    flexShrink: 0,
    gap: '12px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  brandIcon: { fontSize: '16px' },
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
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '720px',
    width: '100%',
    margin: '0 auto',
  },
};
