import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'viewer' | 'supervisor' | 'admin';

interface RoleConfig {
    allowed: string[];
    denied: string[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ALL_TOOLS = ['read_file', 'update_file', 'create_file', 'delete_file'];

const ROLES: Record<Role, RoleConfig> = {
    viewer: {
        allowed: ['read_file'],
        denied: ['update_file', 'create_file', 'delete_file'],
    },
    supervisor: {
        allowed: ['read_file', 'update_file'],
        denied: ['create_file', 'delete_file'],
    },
    admin: {
        allowed: ['read_file', 'update_file', 'create_file', 'delete_file'],
        denied: [],
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

function IconPlay() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
    );
}

function IconExternalLink() {
    return (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
    );
}

// ─── Video Section ─────────────────────────────────────────────────────────────

// To embed a video:
// - Loom: replace the src with your Loom embed URL
//   e.g. https://www.loom.com/embed/YOUR_VIDEO_ID
// - YouTube: replace the src with your YouTube embed URL
//   e.g. https://www.youtube.com/embed/YOUR_VIDEO_ID
//
// Set VIDEO_EMBED_URL to your embed URL, or leave as null to show the placeholder.
const VIDEO_EMBED_URL: string | null = null;

function VideoSection() {
    return (
        <section style={{ padding: '0 24px 72px', maxWidth: 760, margin: '0 auto' }}>
            <div style={{
                fontSize: 11,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                color: '#9CA3AF',
                marginBottom: 10,
                fontWeight: 500,
            }}>
                see it in action
            </div>

            <div style={{
                border: '0.5px solid #E5E7EB',
                borderRadius: 10,
                overflow: 'hidden',
                background: '#F9FAFB',
                aspectRatio: '16/9',
                position: 'relative',
            }}>
                {VIDEO_EMBED_URL ? (
                    <iframe
                        src={VIDEO_EMBED_URL}
                        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="perso demo"
                    />
                ) : (
                    // Placeholder shown until VIDEO_EMBED_URL is set
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 14,
                        color: '#9CA3AF',
                    }}>
                        <div style={{
                            width: 52,
                            height: 52,
                            borderRadius: '50%',
                            border: '0.5px solid #E5E7EB',
                            background: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#D1D5DB',
                        }}>
                            <IconPlay />
                        </div>
                        <div style={{ fontSize: 13, color: '#9CA3AF' }}>
                            demo video coming soon
                        </div>
                    </div>
                )}
            </div>

            {/* Role/policy strip below video as static reference */}
            <div style={{
                marginTop: 12,
                border: '0.5px solid #E5E7EB',
                borderRadius: 8,
                background: '#fff',
                padding: '12px 16px',
            }}>
                <div style={{
                    fontSize: 11,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.07em',
                    color: '#9CA3AF',
                    fontWeight: 500,
                    marginBottom: 10,
                }}>
                    policy matrix — what each role can do
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(3, 1fr)', gap: '6px 0' }}>
                    {/* Header */}
                    <div />
                    {(['viewer', 'supervisor', 'admin'] as Role[]).map(r => (
                        <div key={r} style={{
                            fontFamily: 'var(--mono)',
                            fontSize: 11.5,
                            color: '#6B7280',
                            textAlign: 'center',
                            paddingBottom: 6,
                            borderBottom: '0.5px solid #E5E7EB',
                        }}>
                            {r}
                        </div>
                    ))}
                    {/* Rows */}
                    {ALL_TOOLS.map(tool => (
                        <>
                            <div key={`label-${tool}`} style={{
                                fontFamily: 'var(--mono)',
                                fontSize: 12,
                                color: '#374151',
                                padding: '5px 12px 5px 0',
                                borderBottom: '0.5px solid #F3F4F6',
                            }}>
                                {tool}
                            </div>
                            {(['viewer', 'supervisor', 'admin'] as Role[]).map(r => {
                                const allowed = ROLES[r].allowed.includes(tool);
                                return (
                                    <div key={`${tool}-${r}`} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderBottom: '0.5px solid #F3F4F6',
                                        fontSize: 13,
                                        color: allowed ? '#1D9E75' : '#E24B4A',
                                    }}>
                                        {allowed ? '✓' : '✗'}
                                    </div>
                                );
                            })}
                        </>
                    ))}
                </div>
                <div style={{ marginTop: 8, fontSize: 11.5, color: '#9CA3AF' }}>
                    Default action: <span style={{ fontFamily: 'var(--mono)' }}>Deny</span> — anything not explicitly allowed is rejected.
                </div>
            </div>
        </section>
    );
}

// ─── Repos Section ────────────────────────────────────────────────────────────

const REPOS = [
    {
        name: 'teknokeras/perso',
        href: 'https://github.com/teknokeras/perso',
        desc: 'The policy engine. Write rules in JSON, compile to WASM, enforce in any host.',
        tags: ['rust', 'wasm', 'core'],
        npm: null,
    },
    {
        name: 'teknokeras/perso-sdk-node',
        href: 'https://github.com/teknokeras/perso-sdk-node',
        desc: 'Node.js SDK wrapping the WASM ABI. Pluggable audit transports, TypeScript-first.',
        tags: ['typescript', 'node', 'sdk'],
        npm: 'https://www.npmjs.com/package/@teknokeras/perso-sdk',
    },
    {
        name: 'teknokeras/perso-demo',
        href: 'https://github.com/teknokeras/perso-demo',
        desc: 'Full-stack demo — React + Express + Groq. Shows perso intercepting real LLM tool calls.',
        tags: ['react', 'express', 'groq'],
        npm: null,
    },
];

function ReposSection() {
    return (
        <section style={{
            padding: '64px 24px',
            borderTop: '0.5px solid #E5E7EB',
        }}>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
                <div style={{
                    fontSize: 13,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.08em',
                    color: '#9CA3AF',
                    fontWeight: 500,
                    marginBottom: 28,
                }}>
                    repositories
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {REPOS.map(repo => (
                        <a
                            key={repo.name}
                            href={repo.href}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                gap: 16,
                                padding: '18px 20px',
                                border: '0.5px solid #E5E7EB',
                                borderRadius: 9,
                                background: '#fff',
                                textDecoration: 'none',
                                transition: 'border-color 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = '#A8DFC9')}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
                        >
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 6,
                                }}>
                                    <IconGitHub />
                                    <span style={{
                                        fontFamily: 'var(--mono)',
                                        fontSize: 13.5,
                                        fontWeight: 500,
                                        color: '#111827',
                                    }}>
                                        {repo.name}
                                    </span>
                                    {repo.npm && (
                                        <a
                                            href={repo.npm}
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={e => e.stopPropagation()}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                fontFamily: 'var(--mono)',
                                                fontSize: 11,
                                                color: '#6B7280',
                                                padding: '2px 7px',
                                                border: '0.5px solid #E5E7EB',
                                                borderRadius: 4,
                                                background: '#F9FAFB',
                                                textDecoration: 'none',
                                            }}
                                        >
                                            <IconNpm />
                                            npm
                                        </a>
                                    )}
                                </div>
                                <p style={{ fontSize: 13.5, color: '#6B7280', lineHeight: 1.6, marginBottom: 10 }}>
                                    {repo.desc}
                                </p>
                                <div style={{ display: 'flex', gap: 5 }}>
                                    {repo.tags.map(tag => (
                                        <span key={tag} style={{
                                            fontFamily: 'var(--mono)',
                                            fontSize: 11,
                                            padding: '2px 7px',
                                            borderRadius: 4,
                                            background: 'rgba(0,0,0,0.04)',
                                            color: '#6B7280',
                                        }}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div style={{ color: '#D1D5DB', flexShrink: 0, paddingTop: 2 }}>
                                <IconExternalLink />
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Waitlist ─────────────────────────────────────────────────────────────────

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
                    access_key: import.meta.env.VITE_WEB3FORMS_KEY,
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
    return (
        <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif', color: '#111827', background: '#fff', fontSize: 15, lineHeight: 1.6, WebkitFontSmoothing: 'antialiased' }}>
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
                    <a href="#repos" style={{ color: '#6B7280', fontSize: 14 }}>repos</a>
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
                        <a href="https://github.com/teknokeras/perso-demo" target="_blank" rel="noreferrer">
                            <button style={primaryBtnStyle}>view demo repo</button>
                        </a>
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

            {/* ── Video ── */}
            <VideoSection />

            {/* ── How it works ── */}
            <section style={{
                padding: '64px 24px',
                background: '#F9FAFB',
                borderTop: '0.5px solid #E5E7EB',
                borderBottom: '0.5px solid #E5E7EB',
            }}>
                <div style={{ maxWidth: 760, margin: '0 auto' }}>
                    <div style={{ fontSize: 13, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#9CA3AF', fontWeight: 500, marginBottom: 28 }}>
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

            {/* ── Repos ── */}
            <div id="repos">
                <ReposSection />
            </div>

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
                        { label: 'perso', href: 'https://github.com/teknokeras/perso' },
                        { label: 'perso-sdk-node', href: 'https://github.com/teknokeras/perso-sdk-node' },
                        { label: 'perso-demo', href: 'https://github.com/teknokeras/perso-demo' },
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
