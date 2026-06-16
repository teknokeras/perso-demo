import { useState } from 'react';
import type { Role, ToolName } from '../../types/api';

// ── Raw policy.json ───────────────────────────────────────────────────────────

const POLICY_JSON = {
    "version": "perso-1.0.0",
    "default_action": "Deny",
    "tools": [
        "view_customer",
        "update_customer",
        "delete_customer",
        "export_data",
        "process_refund",
        "access_pii",
        "bulk_update"
    ],
    "roles": [
        "agent",
        "manager",
        "admin"
    ],
    "rules": [
        {
            "tool_name": "view_customer",
            "roles": [
                "agent",
                "manager",
                "admin"
            ],
            "condition": null
        },
        {
            "tool_name": "update_customer",
            "roles": [
                "agent",
                "manager",
                "admin"
            ],
            "condition": null
        },
        {
            "tool_name": "delete_customer",
            "roles": [
                "manager",
                "admin"
            ],
            "condition": {
                "Any": [
                    {
                        "FieldEquals": {
                            "source_a": "AgentAttributes",
                            "field_a": "user_id",
                            "source_b": "ResourceAttributes",
                            "field_b": "owner_id"
                        }
                    },
                    {
                        "StringCheck": {
                            "source": "AgentAttributes",
                            "field": "role",
                            "op": "In",
                            "value": [
                                "admin"
                            ]
                        }
                    }
                ]
            }
        },
        {
            "tool_name": "process_refund",
            "roles": [
                "agent"
            ],
            "condition": {
                "NumericCheck": {
                    "source": "Arguments",
                    "field": "amount",
                    "op": "Lte",
                    "value": 500.0
                }
            }
        },
        {
            "tool_name": "process_refund",
            "roles": [
                "manager",
                "admin"
            ],
            "condition": {
                "NumericCheck": {
                    "source": "Arguments",
                    "field": "amount",
                    "op": "Lte",
                    "value": 2000.0
                }
            }
        },
        {
            "tool_name": "access_pii",
            "roles": [
                "manager",
                "admin"
            ],
            "condition": {
                "FieldPresent": {
                    "source": "AgentAttributes",
                    "field": "mfa_verified"
                }
            }
        },
        {
            "tool_name": "export_data",
            "roles": [
                "manager",
                "admin"
            ],
            "condition": {
                "StringCheck": {
                    "source": "AgentAttributes",
                    "field": "env",
                    "op": "In",
                    "value": [
                        "production"
                    ]
                }
            }
        },
        {
            "tool_name": "bulk_update",
            "roles": [
                "admin"
            ],
            "condition": {
                "All": [
                    {
                        "StringCheck": {
                            "source": "AgentAttributes",
                            "field": "env",
                            "op": "In",
                            "value": [
                                "production"
                            ]
                        }
                    },
                    {
                        "FieldPresent": {
                            "source": "AgentAttributes",
                            "field": "mfa_verified"
                        }
                    }
                ]
            }
        }
    ]
};

// ── Syntax highlighter ────────────────────────────────────────────────────────
// Tokenises JSON string into spans with colour classes.

function highlight(json: string): React.ReactNode[] {
    const tokens: React.ReactNode[] = [];
    // Regex groups: string, number, boolean/null, punctuation
    const re = /("(?:[^"\\]|\\.)*")|(\b\d+(?:\.\d+)?\b)|(true|false|null)|([{}[\]:,])/g;
    let last = 0;
    let match: RegExpExecArray | null;
    let key = 0;

    while ((match = re.exec(json)) !== null) {
        if (match.index > last) {
            tokens.push(<span key={key++}>{json.slice(last, match.index)}</span>);
        }
        const [full, str, num, kw, punct] = match;
        if (str) {
            // Detect if it's a key (followed by ':') by checking what comes after
            const after = json.slice(match.index + full.length).trimStart();
            const isKey = after.startsWith(':');
            tokens.push(
                <span key={key++} style={{ color: isKey ? '#7dd3fc' : '#86efac' }}>{full}</span>
            );
        } else if (num) {
            tokens.push(<span key={key++} style={{ color: '#fbbf24' }}>{full}</span>);
        } else if (kw) {
            tokens.push(<span key={key++} style={{ color: kw === 'null' ? '#94a3b8' : '#f472b6' }}>{full}</span>);
        } else if (punct) {
            tokens.push(<span key={key++} style={{ color: '#94a3b8' }}>{full}</span>);
        }
        last = match.index + full.length;
    }
    if (last < json.length) tokens.push(<span key={key++}>{json.slice(last)}</span>);
    return tokens;
}

// ── Human-readable sidebar data ───────────────────────────────────────────────

interface Rule {
    tool: ToolName;
    allowed: boolean;
    condition?: string;
}

const ALL_TOOLS: ToolName[] = [
    'view_customer', 'update_customer', 'delete_customer',
    'process_refund', 'access_pii', 'export_data', 'bulk_update',
];

const ROLE_PERMISSIONS: Record<Role, ToolName[]> = {
    agent: ['view_customer', 'update_customer', 'process_refund'],
    manager: ['view_customer', 'update_customer', 'delete_customer', 'process_refund', 'access_pii', 'export_data'],
    admin: ['view_customer', 'update_customer', 'delete_customer', 'process_refund', 'access_pii', 'export_data', 'bulk_update'],
};

const ROLE_CONDITIONS: Partial<Record<Role, Partial<Record<ToolName, string>>>> = {
    agent: {
        process_refund: 'amount ≤ $500',
    },
    manager: {
        delete_customer: 'own records only (user_id = owner_id)',
        process_refund: 'amount ≤ $2,000',
        access_pii: 'mfa_verified required',
        export_data: 'env = production only',
    },
    admin: {
        delete_customer: 'own records or admin role',
        process_refund: 'amount ≤ $2,000',
        access_pii: 'mfa_verified required',
        export_data: 'env = production only',
        bulk_update: 'env = production + mfa_verified',
    },
};

const ROLE_DESCRIPTIONS: Record<Role, string> = {
    agent: 'Front-line support. Can view and update customers, and process refunds up to $500.',
    manager: 'Team lead. Broader access including delete (own records), PII, and data export.',
    admin: 'Full access. All operations permitted, including bulk updates.',
};

function getRules(role: Role): Rule[] {
    const allowed = new Set(ROLE_PERMISSIONS[role]);
    const conditions = ROLE_CONDITIONS[role] ?? {};
    return ALL_TOOLS.map((tool) => ({
        tool,
        allowed: allowed.has(tool),
        condition: conditions[tool],
    }));
}

function buildPolicyExcerpt(role: Role): string {
    const allowed = ROLE_PERMISSIONS[role];
    const conditions = ROLE_CONDITIONS[role] ?? {};
    const rules = allowed.map((tool) => {
        const roles = Object.entries(ROLE_PERMISSIONS)
            .filter(([, tools]) => tools.includes(tool))
            .map(([r]) => `"${r}"`);
        const cond = conditions[tool]
            ? `\n    "condition": "... ${conditions[tool]}"  `
            : '';
        return `  { "tool_name": "${tool}",\n    "roles": [${roles.join(', ')}]${cond} }`;
    });
    return `{\n  "default_action": "Deny",\n  "rules": [\n${rules.join(',\n')}\n  ]\n}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
    role: Role;
}

export default function PolicySidebar({ role }: Props) {
    const [policyOpen, setPolicyOpen] = useState(false);
    const [jsonOpen, setJsonOpen] = useState(false);

    const rules = getRules(role);
    const allowCount = rules.filter((r) => r.allowed).length;

    const jsonString = JSON.stringify(POLICY_JSON, null, 2);
    const highlighted = highlight(jsonString);

    function closeAll() {
        setPolicyOpen(false);
        setJsonOpen(false);
    }

    return (
        <>
            {/* ── Trigger buttons ── */}
            <div style={styles.triggers}>
                {/* Human-readable policy */}
                <button
                    onClick={() => { setPolicyOpen((o) => !o); setJsonOpen(false); }}
                    style={styles.trigger}
                    title="View active policy"
                >
                    <span style={styles.triggerIcon}>⚖</span>
                    <span>policy</span>
                    <span style={{
                        ...styles.badge,
                        background: policyOpen ? 'var(--bg-subtle)' : 'var(--accent-dim)',
                        color: policyOpen ? 'var(--text-secondary)' : 'var(--accent)',
                    }}>
                        {allowCount}/{ALL_TOOLS.length}
                    </span>
                </button>

                {/* Raw JSON */}
                <button
                    onClick={() => { setJsonOpen((o) => !o); setPolicyOpen(false); }}
                    style={{
                        ...styles.trigger,
                        background: jsonOpen ? 'var(--bg-subtle)' : 'transparent',
                        borderColor: jsonOpen ? 'var(--border-strong)' : 'var(--border)',
                    }}
                    title="View raw policy.json"
                >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{'{ }'}</span>
                </button>
            </div>

            {/* ── Shared overlay ── */}
            {(policyOpen || jsonOpen) && (
                <div style={styles.overlay} onClick={closeAll} />
            )}

            {/* ── Human-readable drawer ── */}
            <aside style={{
                ...styles.drawer,
                transform: policyOpen ? 'translateX(0)' : 'translateX(100%)',
            }}>
                <div style={styles.drawerHeader}>
                    <div>
                        <p style={styles.drawerTitle}>active policy</p>
                        <p style={styles.drawerSub}>perso-1.0.0 · default: Deny</p>
                    </div>
                    <button onClick={closeAll} style={styles.closeBtn} aria-label="Close">×</button>
                </div>

                <div style={styles.roleSection}>
                    <div style={styles.rolePill}>
                        <span style={styles.roleDot} />
                        <span style={styles.roleLabel}>{role}</span>
                    </div>
                    <p style={styles.roleDesc}>{ROLE_DESCRIPTIONS[role]}</p>
                </div>

                <div style={styles.section}>
                    <p style={styles.sectionLabel}>tool rules</p>
                    <div style={styles.rules}>
                        {rules.map((r) => (
                            <div key={r.tool} style={{
                                ...styles.rule,
                                background: r.allowed ? 'var(--allow-bg)' : 'var(--bg-elevated)',
                                borderColor: r.allowed ? 'var(--allow-border)' : 'var(--border)',
                            }}>
                                <span style={{
                                    ...styles.ruleDecision,
                                    color: r.allowed ? 'var(--allow)' : 'var(--text-muted)',
                                }}>
                                    {r.allowed ? '✓' : '✗'}
                                </span>
                                <div style={styles.ruleBody}>
                                    <span style={styles.ruleTool}>{r.tool}</span>
                                    {r.condition && (
                                        <span style={styles.ruleCondition}>{r.condition}</span>
                                    )}
                                </div>
                                <span style={{
                                    ...styles.ruleTag,
                                    color: r.allowed ? 'var(--allow)' : 'var(--text-muted)',
                                    borderColor: r.allowed ? 'var(--allow-border)' : 'var(--border)',
                                }}>
                                    {r.allowed ? 'allow' : 'deny'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={styles.section}>
                    <p style={styles.sectionLabel}>policy.json (filtered for role)</p>
                    <pre style={styles.code}>{buildPolicyExcerpt(role)}</pre>
                </div>
            </aside>

            {/* ── Raw JSON drawer ── */}
            <aside style={{
                ...styles.drawer,
                width: '480px',
                transform: jsonOpen ? 'translateX(0)' : 'translateX(100%)',
                background: '#0f172a',
                borderColor: '#1e293b',
            }}>
                <div style={{ ...styles.drawerHeader, borderColor: '#1e293b' }}>
                    <div>
                        <p style={{ ...styles.drawerTitle, color: '#e2e8f0' }}>policy.json</p>
                        <p style={{ ...styles.drawerSub, color: '#64748b' }}>perso-1.0.0 · raw source</p>
                    </div>
                    <button onClick={closeAll} style={{ ...styles.closeBtn, color: '#64748b' }} aria-label="Close">×</button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' as const, padding: '16px' }}>
                    <pre style={styles.jsonCode}>
                        <code>{highlighted}</code>
                    </pre>
                </div>
            </aside>
        </>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
    triggers: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    },
    trigger: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-sm)',
        background: 'transparent',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        transition: 'all 0.1s',
    },
    triggerIcon: { fontSize: '13px' },
    badge: {
        fontSize: '10px',
        padding: '1px 5px',
        borderRadius: '3px',
        fontWeight: 600,
        transition: 'all 0.1s',
    },
    overlay: {
        position: 'fixed' as const,
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 40,
    },
    drawer: {
        position: 'fixed' as const,
        top: 0,
        right: 0,
        bottom: 0,
        width: '340px',
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column' as const,
        transition: 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowY: 'hidden' as const,
    },
    drawerHeader: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '18px 16px 14px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
    },
    drawerTitle: {
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: '3px',
    },
    drawerSub: {
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'var(--text-tertiary)',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        color: 'var(--text-tertiary)',
        fontSize: '20px',
        lineHeight: 1,
        cursor: 'pointer',
        padding: '0 2px',
    },
    roleSection: {
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
        flexShrink: 0,
    },
    rolePill: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '7px',
        padding: '4px 10px',
        borderRadius: '20px',
        background: 'var(--bg-subtle)',
        border: '1px solid var(--border-strong)',
        width: 'fit-content',
    },
    roleDot: {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: 'var(--accent)',
        boxShadow: '0 0 6px var(--accent)',
    },
    roleLabel: {
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        color: 'var(--text-primary)',
    },
    roleDesc: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
    },
    section: {
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
        overflowY: 'auto' as const,
    },
    sectionLabel: {
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        color: 'var(--text-tertiary)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.08em',
        flexShrink: 0,
    },
    rules: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '5px',
    },
    rule: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 10px',
        borderRadius: 'var(--r-sm)',
        border: '1px solid',
    },
    ruleDecision: {
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        fontWeight: 700,
        width: '14px',
        flexShrink: 0,
        textAlign: 'center' as const,
    },
    ruleBody: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '2px',
        flex: 1,
        minWidth: 0,
    },
    ruleTool: {
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        color: 'var(--text-primary)',
    },
    ruleCondition: {
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        color: 'var(--text-tertiary)',
    },
    ruleTag: {
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        padding: '1px 6px',
        borderRadius: '3px',
        border: '1px solid',
        flexShrink: 0,
    },
    code: {
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'var(--text-secondary)',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        padding: '10px 12px',
        overflowX: 'auto' as const,
        whiteSpace: 'pre' as const,
        lineHeight: 1.7,
    },
    jsonCode: {
        fontFamily: "'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace",
        fontSize: '12px',
        lineHeight: 1.7,
        color: '#e2e8f0',
        margin: 0,
        whiteSpace: 'pre' as const,
        overflowX: 'auto' as const,
    },
};
