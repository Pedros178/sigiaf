import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(correo, password);
      toast.success('Bienvenido al sistema');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="#1a3a6b"/>
              <rect x="10" y="14" width="28" height="4" rx="2" fill="#fff" opacity="0.9"/>
              <rect x="10" y="22" width="20" height="4" rx="2" fill="#fff" opacity="0.7"/>
              <rect x="10" y="30" width="24" height="4" rx="2" fill="#fff" opacity="0.5"/>
              <circle cx="36" cy="32" r="8" fill="#f0a500"/>
              <path d="M33 32l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={styles.title}>SIGIAF</h1>
          <p style={styles.subtitle}>Sistema de Gestión de Inventario<br/>y Control de Activos Fijos</p>
          <div style={styles.inst}>ITT — Tecnológico Nacional de México</div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Correo electrónico</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="correo@ittehuacan.edu.mx"
              required
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={styles.input}
            />
          </div>
          <button type="submit" disabled={loading} style={{
            ...styles.btn,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Ingresando...' : 'Ingresar al sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f1f3d 0%, #1a3a6b 50%, #0d2b5e 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Segoe UI', sans-serif",
    padding: '20px',
  },
  card: {
    background: '#fff',
    borderRadius: '20px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
  },
  header: { textAlign: 'center', marginBottom: '36px' },
  logo: { marginBottom: '16px' },
  title: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#1a3a6b',
    margin: '0 0 6px',
    letterSpacing: '3px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#5a6a85',
    margin: '0 0 12px',
    lineHeight: '1.6',
  },
  inst: {
    display: 'inline-block',
    background: '#f0a500',
    color: '#fff',
    fontSize: '11px',
    fontWeight: '600',
    padding: '4px 12px',
    borderRadius: '20px',
    letterSpacing: '0.5px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input: {
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
  },
  btn: {
    padding: '14px',
    background: 'linear-gradient(135deg, #1a3a6b, #2563eb)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    marginTop: '8px',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
};
