import type { Role } from '../../types/api';

interface Props {
  value: Role;
  onChange: (role: Role) => void;
  disabled?: boolean;
}

const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: 'viewer',     label: 'viewer',     desc: 'read only' },
  { value: 'supervisor', label: 'supervisor', desc: 'read + update' },
  { value: 'admin',      label: 'admin',      desc: 'full access' },
];

export default function RoleSelector({ value, onChange, disabled }: Props) {
  return (
    <div style={styles.wrap}>
      <span style={styles.label}>role</span>
      <div style={styles.pills}>
        {ROLES.map((r) => (
          <button
            key={r.value}
            onClick={() => !disabled && onChange(r.value)}
            disabled={disabled}
            title={r.desc}
            style={{
              ...styles.pill,
              ...(value === r.value ? styles.pillActive : {}),
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  label: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  pills: {
    display: 'flex',
    gap: '4px',
  },
  pill: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    padding: '4px 10px',
    borderRadius: 'var(--r-sm)',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    transition: 'all 0.1s',
  },
  pillActive: {
    background: 'var(--bg-subtle)',
    border: '1px solid var(--border-strong)',
    color: 'var(--text-primary)',
  },
};
