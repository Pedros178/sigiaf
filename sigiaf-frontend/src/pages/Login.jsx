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
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .login-input { padding: 13px 16px; border: 1.5px solid #e2e8f0; border-radius: 12px; font-size: 14px; outline: none; font-family: inherit; width: 100%; color: #0f172a; transition: border-color 0.2s, box-shadow 0.2s; background: #f8fafc; }
        .login-input:focus { border-color: #1e40af; box-shadow: 0 0 0 3px rgba(30,64,175,0.12); background: #fff; }
        .login-btn { padding: 14px; background: linear-gradient(135deg, #1e3a8a, #1e40af); color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; font-family: inherit; width: 100%; cursor: pointer; letter-spacing: 0.3px; transition: transform 0.15s, box-shadow 0.15s; box-shadow: 0 4px 16px rgba(30,58,138,0.35); }
        .login-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(30,58,138,0.45); }
        .login-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.3); animation: pulse 2s ease infinite; }
        .dot:nth-child(2) { animation-delay: 0.3s; }
        .dot:nth-child(3) { animation-delay: 0.6s; }
        @keyframes pulse { 0%,100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 1; transform: scale(1.4); } }
        .side-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: rgba(255,255,255,0.07); border-radius: 12px; margin-bottom: 10px; }
      `}</style>

      {/* Left panel */}
      <div style={{ flex: 1, background: 'linear-gradient(145deg, #0f1f3d 0%, #1e3a8a 60%, #1e2e6e 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 56px', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, background: 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -40, width: 240, height: 240, background: 'radial-gradient(circle, rgba(96,165,250,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '48px' }}>
            <div style={{ width: 46, height: 46, background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(245,158,11,0.4)' }}>
              <span style={{ color: '#fff', fontWeight: '900', fontSize: '15px', letterSpacing: '-0.5px' }}>SF</span>
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: '800', fontSize: '18px', letterSpacing: '2px' }}>SIGIAF</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.5px' }}>ITT · Tehuacán</div>
            </div>
          </div>

          <h2 style={{ color: '#fff', fontSize: '36px', fontWeight: '900', margin: '0 0 14px', lineHeight: 1.15, letterSpacing: '-0.5px' }}>
            Control de activos<br /><span style={{ color: '#f59e0b' }}>inteligente</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', lineHeight: 1.7, margin: '0 0 40px', maxWidth: '380px' }}>
            Sistema de Gestión de Inventario y Control de Activos Fijos del Tecnológico Nacional de México.
          </p>

          <div>
            {[
              { icon: '📦', title: 'Inventario en tiempo real', desc: 'SKU, QR y trazabilidad completa' },
              { icon: '🔄', title: 'Préstamos y mantenimientos', desc: 'Control total del ciclo de vida' },
              { icon: '📊', title: 'Exportación de datos', desc: 'Excel, PDF y XML con un clic' },
            ].map(f => (
              <div key={f.title} className="side-item">
                <div style={{ fontSize: '22px', width: 40, textAlign: 'center', flexShrink: 0 }}>{f.icon}</div>
                <div>
                  <div style={{ color: '#fff', fontWeight: '700', fontSize: '13.5px' }}>{f.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', marginTop: '2px' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Animated dots */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '48px', alignItems: 'center' }}>
            <div className="dot" /><div className="dot" /><div className="dot" />
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={{ width: '480px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Iniciar sesión</h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, fontWeight: '500' }}>Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', letterSpacing: '0.02em' }}>Correo electrónico</label>
              <input className="login-input" type="email" value={correo} onChange={e => setCorreo(e.target.value)} placeholder="correo@ittehuacan.edu.mx" required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', letterSpacing: '0.02em' }}>Contraseña</label>
              <input className="login-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" className="login-btn" disabled={loading} style={{ marginTop: '6px' }}>
              {loading ? '⏳ Ingresando...' : 'Ingresar al sistema →'}
            </button>
          </form>

          <div style={{ marginTop: '36px', paddingTop: '24px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '500' }}>
              Instituto Tecnológico de Tehuacán<br />
              <span style={{ color: '#94a3b8' }}>Tecnológico Nacional de México</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
