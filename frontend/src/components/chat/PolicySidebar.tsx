import { useState } from 'react';
import type { Role, ToolName } from '../../types/api';

interface Rule {
  tool: ToolName;
  allowed: boolean;
}

const ALL_TOOLS: ToolName[] = ['read_file', 'create_file', 'update_file', 'delete_file'];

const ROLE_PERMISSIONS: Record<Role, ToolName[]> = {
  viewer:     ['read_file'],
  supervisor: ['read_file', 'update_file'],
  admin:      ['read_file', 'create_file', 'update_file', 'delete_file'],
};

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  viewer:     'Read-only access. Can inspect files but cannot modify the filesystem.',
  supervisor: 'Read and update access. Can modify existing files but cannot create or delete.',
  admin:      'Full access. All file operations are permitted.',
};

function getRules(role: Role): Rule[] {
  const allowed = new Set(ROLE_PERMISSIONS[role]);
  return ALL_TOOLS.map((tool) => ({ tool, allowed: allowed.has(tool) }));
}

interface Props {
  role: Role;
}

export default function PolicySidebar({ role }: Props) {
  const [open, setOpen] = useState(false);
  const rules = getRules(role);
  const allowCount = rules.filter((r) => r.allowed).length;

  return (
    <>
      {/* ── Toggle button ── */}
      <button onClick={() => setOpen((o) => !o)} style={styles.trigger} title="View active policy">
        <span style={styles.triggerIcon}>⚖</span>
        <span style={styles.triggerLabel}>policy</span>
        <span style={{
          ...styles.badge,
          background: open ? 'var(--bg-subtle)' : 'var(--accent-dim)',
          color: open ? 'var(--text-secondary)' : 'var(--accent)',
        }}>
          {allowCount}/{ALL_TOOLS.length}
        </span>
      </button>

      {/* ── Overlay ── */}
      {open && (
        <div style={styles.overlay} onClick={() => setOpen(false)} />
      )}

      {/* ── Drawer ── */}
      <aside style={{
        ...styles.drawer,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
      }}>
        <div style={styles.drawerHeader}>
          <div>
            <p style={styles.drawerTitle}>active policy</p>
            <p style={styles.drawerSub}>perso-1.0.0 · default: Deny</p>
          </div>
          <button onClick={() => setOpen(false)} style={styles.closeBtn} aria-label="Close">×</button>
        </div>

        {/* Role summary */}
        <div style={styles.roleSection}>
          <div style={styles.rolePill}>
            <span style={styles.roleDot} />
            <span style={styles.roleLabel}>{role}</span>
          </div>
          <p style={styles.roleDesc}>{ROLE_DESCRIPTIONS[role]}</p>
        </div>

        {/* Rules table */}
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
                <span style={styles.ruleTool}>{r.tool}</span>
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

        {/* Raw policy excerpt */}
        <div style={styles.section}>
          <p style={styles.sectionLabel}>policy.json (filtered)</p>
          <pre style={styles.code}>{buildPolicyExcerpt(role)}</pre>
        </div>
      </aside>
    </>
  );
}

function buildPolicyExcerpt(role: Role): string {
  const allowed = ROLE_PERMISSIONS[role];
  const rules = allowed.map((tool) => {
    const roles = Object.entries(ROLE_PERMISSIONS)
      .filter(([, tools]) => tools.includes(tool))
      .map(([r]) => `"${r}"`);
    return `  { "tool_name": "${tool}",\n    "roles": [${roles.join(', ')}] }`;
  });
  return `{\n  "default_action": "Deny",\n  "rules": [\n${rules.join(',\n')}\n  ]\n}`;
}

const styles: Record<string, React.CSSProperties> = {
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
  triggerLabel: {},
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
    width: '320px',
    background: 'var(--bg-surface)',
    borderLeft: '1px solid var(--border)',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column' as const,
    transition: 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
    overflowY: 'auto' as const,
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '18px 16px 14px',
    borderBottom: '1px solid var(--border)',
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
  },
  sectionLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
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
  ruleTool: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: 'var(--text-primary)',
    flex: 1,
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
};
