import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Notificaciones from './Notificaciones';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard',       icon: '▦',  label: 'Dashboard' },
  { to: '/busqueda',        icon: '🔍', label: 'Búsqueda global' },
  { to: '/activos',         icon: '📦', label: 'Activos' },
  { to: '/consulta-qr',    icon: '📷', label: 'Consulta QR' },
  { to: '/prestamos',       icon: '🔄', label: 'Préstamos' },
  { to: '/mantenimientos',  icon: '🔧', label: 'Mantenimientos' },
  { to: '/auditoria',       icon: '📋', label: 'Auditoría' },
  { to: '/depreciacion',    icon: '📉', label: 'Depreciación' },
  { to: '/bitacora',        icon: '📜', label: 'Bitácora', adminOnly: true },
  { to: '/categorias',      icon: '🏷️', label: 'Categorías' },
  { to: '/usuarios',        icon: '👥', label: 'Usuarios', adminOnly: true },
];

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); toast.success('Sesión cerrada'); navigate('/login'); };
  const visibleItems = navItems.filter(item => !item.adminOnly || usuario?.rol === 'admin');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: '#f1f5f9' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        :root { --primary: #1e40af; --primary-dark: #1e3a8a; --accent: #f59e0b; --sidebar-w: 252px; --sidebar-c: 68px; }
        * { box-sizing: border-box; }
        .nav-link { display: flex; align-items: center; gap: 12px; padding: 9px 12px; border-radius: 10px; text-decoration: none; color: rgba(255,255,255,0.6); font-weight: 500; font-size: 13.5px; transition: all 0.18s ease; white-space: nowrap; overflow: hidden; letter-spacing: 0.01em; }
        .nav-link:hover { color: #fff; background: rgba(255,255,255,0.1); transform: translateX(2px); }
        .nav-link.active { color: #fff; background: rgba(255,255,255,0.18); font-weight: 700; box-shadow: inset 3px 0 0 #f59e0b; }
        .nav-icon { font-size: 15px; flex-shrink: 0; width: 20px; text-align: center; }
        .user-card:hover { background: rgba(255,255,255,0.12) !important; }
        .logout-btn:hover { background: rgba(239,68,68,0.25) !important; }
        .collapse-btn:hover { background: rgba(255,255,255,0.12) !important; }
        .main-content { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .topbar-pill { display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #e2e8f0; border-radius: 99px; padding: 6px 14px 6px 8px; font-size: 13px; color: #475569; font-weight: 500; }
      `}</style>

      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 'var(--sidebar-c)' : 'var(--sidebar-w)',
        background: 'linear-gradient(175deg, #1e3a8a 0%, #1e2e6e 55%, #111827 100%)',
        display: 'flex', flexDirection: 'column', transition: 'width 0.25s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden', flexShrink: 0,
        boxShadow: '4px 0 24px rgba(0,0,0,0.18)',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Decorative gradient blob */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ padding: '20px 16px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(245,158,11,0.35)' }}>
            <span style={{ color: '#fff', fontWeight: '900', fontSize: '14px', letterSpacing: '-0.5px' }}>SF</span>
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#fff', fontWeight: '800', fontSize: '16px', letterSpacing: '1.5px', lineHeight: 1 }}>SIGIAF</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.5px', marginTop: '3px' }}>ITT · Control de Activos</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '14px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto', overflowX: 'hidden' }}>
          {!collapsed && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', letterSpacing: '1.2px', padding: '6px 12px 8px', textTransform: 'uppercase' }}>Menú principal</div>}
          {visibleItems.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div style={{ padding: '10px 8px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ padding: '2px 4px 6px' }}><Notificaciones collapsed={collapsed} /></div>

          {/* User */}
          <div className="user-card" onClick={() => navigate('/perfil')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', background: 'rgba(255,255,255,0.06)', transition: 'background 0.15s', marginBottom: '2px' }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: '800', color: '#fff', fontSize: '14px', boxShadow: '0 2px 8px rgba(245,158,11,0.3)' }}>
              {usuario?.nombre?.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{usuario?.nombre}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{usuario?.rol}</div>
              </div>
            )}
          </div>

          <button className="logout-btn" onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: '10px', padding: '9px 12px', borderRadius: '10px', border: 'none', background: 'rgba(239,68,68,0.12)', color: '#f87171', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'background 0.15s', fontFamily: 'inherit' }}>
            <span style={{ fontSize: '15px' }}>⏻</span>{!collapsed && 'Cerrar sesión'}
          </button>
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)} style={{ width: '100%', marginTop: '2px', padding: '8px', borderRadius: '10px', border: 'none', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', transition: 'background 0.15s', letterSpacing: '0.5px' }}>
            {collapsed ? '→' : '← Colapsar'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header style={{ height: 58, background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div className="topbar-pill">
            <div style={{ width: 26, height: 26, background: 'linear-gradient(135deg, #1e3a8a, #1e40af)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: '800' }}>
              {usuario?.nombre?.charAt(0).toUpperCase()}
            </div>
            <span>{usuario?.nombre}</span>
            <span style={{ background: '#eff6ff', color: '#1e40af', padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{usuario?.rol}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="main-content" style={{ flex: 1, overflow: 'auto', padding: '28px 32px', background: '#f1f5f9' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
