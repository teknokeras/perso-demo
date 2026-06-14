import { useState, useRef, useEffect } from 'react';
import { Link } from '@tanstack/react-router';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'viewer' | 'supervisor' | 'admin';
type Verdict = 'allow' | 'deny';

interface UserMessage {
    type: 'user';
    text: string;
}

interface AssistantMessage {
    type: 'assistant';
    verdict: Verdict;
    tool: string;
    reason: string;
    reply: string;
}

type ConvoMessage = UserMessage | AssistantMessage;

interface RoleConfig {
    allowed: string[];
    denied: string[];
    convo: ConvoMessage[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ALL_TOOLS = ['read_file', 'update_file', 'create_file', 'delete_file'];

const ROLES: Record<Role, RoleConfig> = {
    viewer: {
        allowed: ['read_file'],
        denied: ['update_file', 'create_file', 'delete_file'],
        convo: [
            { type: 'user', text: 'delete /etc/config.json' },
            {
                type: 'assistant',
                verdict: 'deny',
                tool: 'delete_file',
                reason: "no rule matched tool 'delete_file' for role 'viewer' — applying default_action: Deny",
                reply: "I'm not able to delete files with your current permissions. Your role only has read access.",
            },
            { type: 'user', text: 'read /home/user/notes.txt' },
            {
                type: 'assistant',
                verdict: 'allow',
                tool: 'read_file',
                reason: "rule matched: role 'viewer' has read_file access — decision: Allow",
                reply: "Here's the content of /home/user/notes.txt: ...",
            },
        ],
    },
    supervisor: {
        allowed: ['read_file', 'update_file'],
        denied: ['create_file', 'delete_file'],
        convo: [
            { type: 'user', text: 'delete /etc/config.json' },
            {
                type: 'assistant',
                verdict: 'deny',
                tool: 'delete_file',
                reason: "no rule matched tool 'delete_file' for role 'supervisor' — applying default_action: Deny",
                reply: "I'm not able to delete files with your current permissions. Deletion requires admin access.",
            },
            { type: 'user', text: "update /home/user/notes.txt with today's summary" },
            {
                type: 'assistant',
                verdict: 'allow',
                tool: 'update_file',
                reason: "rule matched: role 'supervisor' has update_file access — decision: Allow",
                reply: "Done — notes.txt updated with today's summary.",
            },
        ],
    },
    admin: {
        allowed: ['read_file', 'update_file', 'create_file', 'delete_file'],
        denied: [],
        convo: [
            { type: 'user', text: 'delete /tmp/old-logs' },
            {
                type: 'assistant',
                verdict: 'allow',
                tool: 'delete_file',
                reason: "rule matched: role 'admin' has delete_file access — decision: Allow",
                reply: 'Done — /tmp/old-logs has been deleted.',
            },
            { type: 'user', text: 'create /etc/config-backup.json' },
            {
                type: 'assistant',
                verdict: 'allow',
                tool: 'create_file',
                reason: "rule matched: role 'admin' has create_file access — decision: Allow",
                reply: 'Done — config-backup.json created at /etc/.',
            },
        ],
    },
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconShieldCheck() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
        </svg>
    );
}

function IconGitHub() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
    );
}

function IconNpm() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M0 0v24h24V0H0zm13.27 17.86c-.22.66-.77 1.2-1.44 1.41l-1.65.5a3.53 3.53 0 0 1-4.35-2.41l-.5-1.64a3.53 3.53 0 0 1 2.41-4.36l1.65-.5a3.53 3.53 0 0 1 4.35 2.42l.5 1.64c.21.66.14 1.28-.97 2.94zm2.95-2.95-.5-1.64a6.52 6.52 0 0 0-8.05-4.47l-1.65.5a6.52 6.52 0 0 0-4.46 8.06l.5 1.64a6.52 6.52 0 0 0 8.05 4.47l1.65-.5a6.52 6.52 0 0 0 4.46-8.06z" />
        </svg>
    );
}

function IconFile() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    );
}

function IconCheck() {
    return (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

function IconX() {
    return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TraceBlock({ msg, role }: { msg: AssistantMessage; role: Role }) {
    const isAllow = msg.verdict === 'allow';
    return (
        <div style={{
            borderRadius: 7,
            padding: '10px 14px',
            background: isAllow ? '#F0FAF6' : '#FEF2F2',
            border: `0.5px solid ${isAllow ? '#A8DFC9' : '#FCCFCF'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
                <div style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: isAllow ? '#1D9E75' : '#E24B4A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    {isAllow ? <IconCheck /> : <IconX />}
                </div>
                <span style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 13,
                    fontWeight: 600,
                    color: isAllow ? '#1D9E75' : '#E24B4A',
                }}>
                    {isAllow ? 'Allow' : 'Deny'}
                </span>
                <span style={pillStyle}>{msg.tool}</span>
                <span style={pillStyle}>role: {role}</span>
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2, lineHeight: 1.5 }}>
                {msg.reason}
            </div>
        </div>
    );
}

const pillStyle: React.CSSProperties = {
    fontFamily: 'var(--mono)',
    fontSize: 11.5,
    padding: '2px 7px',
    borderRadius: 4,
    background: 'rgba(0,0,0,0.06)',
    color: '#111827',
};

function ChatArea({ role }: { role: Role }) {
    const convo = ROLES[role].convo;
    const [visible, setVisible] = useState(0);

    useEffect(() => {
        setVisible(0);
        convo.forEach((_, i) => {
            setTimeout(() => setVisible(i + 1), i * 80 + 40);
        });
    }, [role]);

    return (
        <div style={{
            padding: '20px 20px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            minHeight: 320,
            background: '#fff',
        }}>
            {convo.map((msg, i) => {
                const shown = i < visible;
                const style: React.CSSProperties = {
                    opacity: shown ? 1 : 0,
                    transform: shown ? 'none' : 'translateY(6px)',
                    transition: 'opacity 0.2s ease, transform 0.2s ease',
                };

                if (msg.type === 'user') {
                    return (
                        <div key={i} style={{
                            ...style,
                            alignSelf: 'flex-end',
                            background: '#F9FAFB',
                            border: '0.5px solid #E5E7EB',
                            borderRadius: '10px 10px 2px 10px',
                            padding: '8px 14px',
                            fontSize: 14,
                            maxWidth: '60%',
                            fontFamily: 'var(--mono)',
                        }}>
                            {msg.text}
                        </div>
                    );
                }

                return (
                    <div key={i} style={{
                        ...style,
                        alignSelf: 'flex-start',
                        maxWidth: '90%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                    }}>
                        <TraceBlock msg={msg} role={role} />
                        <div style={{ fontSize: 14, color: '#111827', lineHeight: 1.6, paddingLeft: 2 }}>
                            {msg.reply}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function PolicyStrip({ role }: { role: Role }) {
    const cfg = ROLES[role];
    return (
        <div style={{
            borderTop: '0.5px solid #E5E7EB',
            background: '#F9FAFB',
            padding: '12px 16px',
        }}>
            <div style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: '#9CA3AF',
                fontWeight: 500,
                marginBottom: 8,
            }}>
                active rules for {role}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ALL_TOOLS.map(tool => {
                    const allowed = cfg.allowed.includes(tool);
                    return (
                        <span key={tool} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontFamily: 'var(--mono)',
                            fontSize: 12,
                            padding: '3px 9px',
                            borderRadius: 4,
                            border: '0.5px solid #E5E7EB',
                            background: '#fff',
                        }}>
                            <span style={{ color: allowed ? '#1D9E75' : '#E24B4A', fontSize: 12 }}>
                                {allowed ? '✓' : '✗'}
                            </span>
                            {tool}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}

function DemoWidget() {
    const [role, setRole] = useState<Role>('supervisor');

    return (
        <section style={{ padding: '0 24px 72px', maxWidth: 760, margin: '0 auto' }}>
            <div style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#9CA3AF',
                marginBottom: 10,
                fontWeight: 500,
            }}>
                live demo — switch roles to see what gets blocked
            </div>

            <div style={{ border: '0.5px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>

                {/* Top bar */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    background: '#F9FAFB',
                    borderBottom: '0.5px solid #E5E7EB',
                }}>
                    <div style={{ display: 'flex', gap: 2 }}>
                        {(['viewer', 'supervisor', 'admin'] as Role[]).map(r => (
                            <button
                                key={r}
                                onClick={() => setRole(r)}
                                style={{
                                    padding: '4px 12px',
                                    borderRadius: 5,
                                    fontSize: 13,
                                    fontFamily: 'var(--mono)',
                                    cursor: 'pointer',
                                    border: role === r ? '0.5px solid #E5E7EB' : '0.5px solid transparent',
                                    background: role === r ? '#fff' : 'transparent',
                                    color: role === r ? '#111827' : '#6B7280',
                                    fontWeight: role === r ? 500 : 400,
                                    transition: 'all 0.15s',
                                    userSelect: 'none',
                                }}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                    <a href="#" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 12.5,
                        color: '#6B7280',
                        textDecoration: 'none',
                    }}>
                        <IconFile />
                        policy
                    </a>
                </div>

                <ChatArea role={role} />
                <PolicyStrip role={role} />
            </div>
        </section>
    );
}

function WaitlistSection() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    async function handleJoin() {
        if (!email || !email.includes('@')) return;
        setStatus('loading');

        try {
            const res = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    access_key: import.meta.env.VITE_WEB3FORMS_KEY,// ← paste your key
                    email,
                    subject: 'New perso waitlist signup',
                }),
            });

            const data = await res.json();
            if (data.success) {
                setStatus('success');
                setEmail('');
            } else {
                setStatus('error');
            }
        } catch {
            setStatus('error');
        }
    }

    return (
        <section style={{ padding: '72px 24px', display: 'flex', justifyContent: 'center' }}>
            <div style={{
                background: '#F9FAFB',
                border: '0.5px solid #E5E7EB',
                borderRadius: 10,
                padding: '40px 44px',
                maxWidth: 520,
                width: '100%',
                textAlign: 'center',
            }}>
                <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 12 }}>
                    managed audit is coming
                </h2>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 24 }}>
                    Every Allow and Deny decision, stored and searchable. Know exactly what your LLM tried to do — and what got blocked. Join the waitlist to get early access.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleJoin()}
                        placeholder="you@company.com"
                        disabled={status === 'loading' || status === 'success'}
                        style={{
                            flex: 1,
                            padding: '9px 14px',
                            border: '0.5px solid #E5E7EB',
                            borderRadius: 7,
                            fontSize: 14,
                            fontFamily: 'inherit',
                            outline: 'none',
                            background: '#fff',
                            color: '#111827',
                            opacity: status === 'success' ? 0.5 : 1,
                        }}
                    />
                    <button
                        onClick={handleJoin}
                        disabled={status === 'loading' || status === 'success'}
                        style={{
                            ...primaryBtnStyle,
                            opacity: status === 'loading' || status === 'success' ? 0.6 : 1,
                            cursor: status === 'loading' || status === 'success' ? 'default' : 'pointer',
                        }}
                    >
                        {status === 'loading' ? 'joining...' : 'join waitlist'}
                    </button>
                </div>
                {status === 'success' && (
                    <div style={{ marginTop: 10, fontSize: 13, color: '#1D9E75' }}>
                        You're on the list. We'll be in touch.
                    </div>
                )}
                {status === 'error' && (
                    <div style={{ marginTop: 10, fontSize: 13, color: '#E24B4A' }}>
                        Something went wrong. Try again or email us directly.
                    </div>
                )}
            </div>
        </section>
    );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const primaryBtnStyle: React.CSSProperties = {
    background: '#1D9E75',
    color: '#fff',
    border: '0.5px solid #1D9E75',
    padding: '9px 20px',
    borderRadius: 7,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function Landing() {
    const demoRef = useRef<HTMLDivElement>(null);

    return (
        <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif', color: '#111827', background: '#fff', fontSize: 15, lineHeight: 1.6, WebkitFontSmoothing: 'antialiased' }}>
            {/* Mono font CSS variable injected globally */}
            <style>{`
        :root {
          --mono: 'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace;
        }
        * { box-sizing: border-box; }
        a { color: inherit; text-decoration: none; }
        button { font-family: inherit; }
        h1, h2, h3 { margin: 0; }
        p { margin: 0; }
      `}</style>

            {/* ── Nav ── */}
            <nav style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 32px',
                height: 56,
                borderBottom: '0.5px solid #E5E7EB',
                position: 'sticky',
                top: 0,
                background: '#fff',
                zIndex: 100,
            }}>
                <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 400, letterSpacing: '-0.01em' }}>
                    <span style={{ width: 8, height: 8, background: '#1D9E75', borderRadius: '50%', flexShrink: 0, display: 'inline-block' }} />
                    perso
                </a>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <a href="#" style={{ color: '#6B7280', fontSize: 14 }}>docs</a>
                    <a
                        href="https://github.com/teknokeras/perso"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '5px 12px',
                            border: '0.5px solid #E5E7EB',
                            borderRadius: 6,
                            fontSize: 13,
                            fontFamily: 'var(--mono)',
                            color: '#111827',
                        }}
                    >
                        <IconGitHub />
                        <span>teknokeras/perso</span>
                    </a>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '80px 24px 72px' }}>
                <div style={{ maxWidth: 480, width: '100%' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#F0FAF6',
                        border: '0.5px solid #A8DFC9',
                        borderRadius: 999,
                        padding: '4px 12px',
                        fontSize: 12.5,
                        color: '#1D9E75',
                        marginBottom: 28,
                        fontWeight: 500,
                    }}>
                        <IconShieldCheck />
                        policy enforcement for MCP
                    </div>

                    <h1 style={{ fontSize: 36, fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: 20 }}>
                        Your LLM tried to delete a file.<br />
                        <span style={{ color: '#1D9E75' }}>perso blocked it in 0.3ms.</span>
                    </h1>

                    <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.7, marginBottom: 32, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
                        Define who can call which tools, under what conditions. Compiled to WASM. Runs in any host — Node.js, Python, Rust, Go — before any tool reaches MCP.
                    </p>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/demo">
                            <button style={primaryBtnStyle}>try the demo</button>
                        </Link>
                        <button style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 7,
                            background: '#fff',
                            color: '#111827',
                            border: '0.5px solid #E5E7EB',
                            padding: '9px 16px',
                            borderRadius: 7,
                            fontSize: 13,
                            fontFamily: 'var(--mono)',
                            cursor: 'pointer',
                        }}>
                            <IconNpm />
                            npm install @teknokeras/perso-sdk
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Demo widget ── */}
            <div ref={demoRef}>
                <DemoWidget />
            </div>

            {/* ── How it works ── */}
            <section style={{
                padding: '64px 24px',
                background: '#F9FAFB',
                borderTop: '0.5px solid #E5E7EB',
                borderBottom: '0.5px solid #E5E7EB',
            }}>
                <div style={{ maxWidth: 760, margin: '0 auto' }}>
                    <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', fontWeight: 500, marginBottom: 28 }}>
                        how it works
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                        {[
                            {
                                num: '01',
                                title: 'define your policy',
                                desc: 'Write access rules in a plain JSON file — who can call which tools, under what conditions.',
                            },
                            {
                                num: '02',
                                title: 'compile to WASM',
                                desc: 'One command produces a portable binary that runs in any host with no dependencies.',
                            },
                            {
                                num: '03',
                                title: 'intercept every call',
                                desc: null,
                            },
                        ].map(card => (
                            <div key={card.num} style={{ border: '0.5px solid #E5E7EB', borderRadius: 9, padding: '24px 22px', background: '#fff' }}>
                                <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: '#9CA3AF', marginBottom: 10 }}>{card.num}</div>
                                <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 8 }}>{card.title}</div>
                                {card.desc ? (
                                    <p style={{ fontSize: 13.5, color: '#6B7280', lineHeight: 1.65 }}>{card.desc}</p>
                                ) : (
                                    <p style={{ fontSize: 13.5, color: '#6B7280', lineHeight: 1.65 }}>
                                        The SDK calls{' '}
                                        <code style={{ fontFamily: 'var(--mono)', fontSize: 12.5, background: '#F9FAFB', padding: '1px 5px', borderRadius: 3, border: '0.5px solid #E5E7EB' }}>
                                            evaluate()
                                        </code>
                                        {' '}before any tool reaches MCP. Allow or Deny in microseconds.
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Waitlist ── */}
            <WaitlistSection />

            {/* ── Footer ── */}
            <footer style={{
                borderTop: '0.5px solid #E5E7EB',
                padding: '20px 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <span style={{ fontSize: 13, color: '#9CA3AF' }}>perso by teknokeras</span>
                <div style={{ display: 'flex', gap: 20 }}>
                    {[
                        { label: 'github', href: 'https://github.com/teknokeras/perso' },
                        { label: 'npm', href: 'https://www.npmjs.com/package/@teknokeras/perso-sdk' },
                        { label: 'docs', href: '#' },
                    ].map(link => (
                        <a key={link.label} href={link.href} target={link.href !== '#' ? '_blank' : undefined} rel="noreferrer" style={{ fontSize: 13, color: '#9CA3AF' }}>
                            {link.label}
                        </a>
                    ))}
                </div>
            </footer>
        </div>
    );
}