// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <style>{`
          * { box-sizing: border-box; }
          body { margin: 0; font-family: 'Inter', 'Segoe UI', sans-serif; }
          @keyframes spin { to { transform: rotate(360deg); } }
          input:focus, select:focus { outline: none; border-color: #1a3c6e !important; }
          button:hover { opacity: 0.88; }
        `}</style>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}