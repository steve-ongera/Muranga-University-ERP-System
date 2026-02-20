// src/pages/LoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(form.username, form.password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch {}
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoCircle}>MU</div>
          <h1 style={styles.title}>Muranga University</h1>
          <p style={styles.subtitle}>Student Information System</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>⚠️ {error}</div>}

          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Enter your username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.footer}>
          © {new Date().getFullYear()} Muranga University of Technology
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a3c6e 0%, #2d6a4f 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  header: { textAlign: 'center', marginBottom: 32 },
  logoCircle: {
    width: 64,
    height: 64,
    background: 'linear-gradient(135deg, #1a3c6e, #2d6a4f)',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 12,
  },
  title: { margin: 0, fontSize: 22, fontWeight: 700, color: '#1a3c6e' },
  subtitle: { margin: '4px 0 0', color: '#6b7280', fontSize: 14 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: {
    padding: '10px 14px',
    border: '1.5px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  btn: {
    marginTop: 8,
    padding: '12px',
    background: 'linear-gradient(135deg, #1a3c6e, #2d6a4f)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  error: {
    background: '#fee2e2',
    color: '#991b1b',
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 13,
  },
  footer: { textAlign: 'center', color: '#9ca3af', fontSize: 12, marginTop: 24, marginBottom: 0 },
};