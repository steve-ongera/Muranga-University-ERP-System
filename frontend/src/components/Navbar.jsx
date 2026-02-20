// src/components/Navbar.jsx
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>
        <img src="/mu-logo.png" alt="MU" style={styles.logo} onError={e => e.target.style.display='none'} />
        <span style={styles.brandText}>Muranga University ERP</span>
      </div>
      {user && (
        <div style={styles.right}>
          <span style={styles.userInfo}>
            {user.role === 'admin' ? '🛡️ Admin' : '🎓'} &nbsp;
            {user.first_name || user.username}
          </span>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      )}
    </nav>
  );
}

const styles = {
  nav: {
    background: 'linear-gradient(135deg, #1a3c6e 0%, #2d6a4f 100%)',
    padding: '0 24px',
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  logo: { height: 36, borderRadius: 4 },
  brandText: { color: '#fff', fontWeight: 700, fontSize: 18, letterSpacing: 0.5 },
  right: { display: 'flex', alignItems: 'center', gap: 16 },
  userInfo: { color: '#cce8ff', fontSize: 14 },
  logoutBtn: {
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.3)',
    color: '#fff',
    padding: '6px 16px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
    transition: 'background 0.2s',
  },
};