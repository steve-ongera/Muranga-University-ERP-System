// src/components/UI.jsx  — shared reusable components

export function Card({ title, children, style = {} }) {
  return (
    <div style={{ ...cardStyle, ...style }}>
      {title && <h3 style={cardTitle}>{title}</h3>}
      {children}
    </div>
  );
}

export function Badge({ grade }) {
  const color = {
    A: '#16a34a', B: '#2563eb', C: '#d97706', D: '#ea580c', E: '#dc2626',
  }[grade] || '#6b7280';
  return (
    <span style={{ background: color, color: '#fff', borderRadius: 4, padding: '2px 10px', fontSize: 13, fontWeight: 600 }}>
      {grade}
    </span>
  );
}

export function Loader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={spinnerStyle} />
    </div>
  );
}

export function Alert({ type = 'error', message }) {
  if (!message) return null;
  const bg = type === 'success' ? '#dcfce7' : '#fee2e2';
  const color = type === 'success' ? '#166534' : '#991b1b';
  return (
    <div style={{ background: bg, color, padding: '10px 16px', borderRadius: 8, marginBottom: 12, fontSize: 14 }}>
      {type === 'error' ? '⚠️' : '✅'} {message}
    </div>
  );
}

export function StatCard({ label, value, icon }) {
  return (
    <div style={statCardStyle}>
      <span style={{ fontSize: 32 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#1a3c6e' }}>{value}</div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>{label}</div>
      </div>
    </div>
  );
}

const cardStyle = {
  background: '#fff',
  borderRadius: 12,
  padding: '20px 24px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  marginBottom: 20,
};
const cardTitle = {
  margin: '0 0 16px',
  fontSize: 16,
  fontWeight: 600,
  color: '#1a3c6e',
  borderBottom: '2px solid #e5e7eb',
  paddingBottom: 10,
};
const statCardStyle = {
  background: '#fff',
  borderRadius: 12,
  padding: '20px 24px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  display: 'flex',
  alignItems: 'center',
  gap: 16,
};
const spinnerStyle = {
  width: 36,
  height: 36,
  border: '4px solid #e5e7eb',
  borderTop: '4px solid #1a3c6e',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};