import { useState } from 'react';
import type { Role } from '../../types/api';

interface Props {
    role: Role;
    onPrompt: (text: string) => void;
}

const PROMPTS: Record<Role, { text: string; willDeny?: boolean }[]> = {
    agent: [
        { text: 'Look up customer C-1042' },
        { text: 'Update the email for customer C-1042 to alice@example.com' },
        { text: 'Process a $200 refund for order ORD-8821' },
        { text: 'Try to process a $800 refund for order ORD-8821', willDeny: true },
        { text: "Try to delete customer C-1042's record", willDeny: true },
        { text: "Try to view customer C-1042's full SSN and card number", willDeny: true },
    ],
    manager: [
        { text: 'Look up customer C-1042' },
        { text: 'Process a $1,500 refund for order ORD-9910' },
        { text: "Delete customer C-2038's record" },
        { text: "Try to delete customer C-9001's record (owned by another manager)", willDeny: true },
        { text: "View full PII for customer C-1042 (I have MFA verified)" },
        { text: 'Export the Q2 customer report', willDeny: true },
    ],
    admin: [
        { text: 'Look up customer C-1042' },
        { text: "Delete any customer record — C-9001" },
        { text: "View full PII for customer C-1042" },
        { text: 'Export the Q2 customer report' },
        { text: 'Run a bulk update to mark all inactive accounts' },
        { text: 'Try to bulk update without MFA verified', willDeny: true },
    ],
};

const ROLE_DESCRIPTIONS: Record<Role, string> = {
    agent: 'view + update + refund ≤ $500',
    manager: 'full access to own records + PII + export',
    admin: 'unrestricted',
};

export default function EmptyState({ role, onPrompt }: Props) {
    const prompts = PROMPTS[role] ?? [];
    const roleDesc = ROLE_DESCRIPTIONS[role] ?? role;

    return (
        <div style={styles.wrap}>
            <div style={styles.icon}>🔐</div>
            <h2 style={styles.heading}>perso-demo</h2>
            <p style={styles.sub}>
                Policy enforcement for MCP tool calls.{' '}
                <span style={styles.roleChip}>{role}</span>
                <span style={styles.roleDesc}> · {roleDesc}</span>
            </p>
            <div style={styles.grid}>
                {prompts.map((p) => (
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
        maxWidth: '400px',
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
        maxWidth: '560px',
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
