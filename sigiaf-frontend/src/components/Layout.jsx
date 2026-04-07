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
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", background: '#f0f4fa' }}>
      <aside style={{ width: collapsed ? '68px' : '240px', background: 'linear-gradient(180deg, #1a3a6b 0%, #0f2550 100%)', display: 'flex', flexDirection: 'column', transition: 'width 0.25s ease', overflow: 'hidden', flexShrink: 0, boxShadow: '4px 0 20px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', background: '#f0a500', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontWeight: '800', fontSize: '14px' }}>SF</span>
          </div>
          {!collapsed && <div>
            <div style={{ color: '#fff', fontWeight: '800', fontSize: '15px', letterSpacing: '1px' }}>SIGIAF</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>ITT Tehuacán</div>
          </div>}
        </div>
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
          {visibleItems.map(item => (
            <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', textDecoration: 'none',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.6)', background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
              fontWeight: isActive ? '600' : '400', fontSize: '13px', transition: 'all 0.15s', whiteSpace: 'nowrap', overflow: 'hidden',
            })}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ padding: '4px 4px 8px' }}><Notificaciones collapsed={collapsed} /></div>
          <div onClick={() => navigate('/perfil')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', marginBottom: '8px', background: 'rgba(255,255,255,0.05)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
            <div style={{ width: '32px', height: '32px', background: '#f0a500', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#fff', fontWeight: '800', fontSize: '14px' }}>{usuario?.nombre?.charAt(0).toUpperCase()}</span>
            </div>
            {!collapsed && <div style={{ minWidth: 0 }}>
              <div style={{ color: '#fff', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{usuario?.nombre}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase' }}>{usuario?.rol}</div>
            </div>}
          </div>
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', border: 'none', background: 'rgba(255,80,80,0.15)', color: '#ff8080', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
            <span>⏻</span>{!collapsed && 'Cerrar sesión'}
          </button>
          <button onClick={() => setCollapsed(!collapsed)} style={{ width: '100%', marginTop: '6px', padding: '8px', borderRadius: '10px', border: 'none', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '12px' }}>
            {collapsed ? '→' : '← Colapsar'}
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, overflow: 'auto', padding: '32px' }}><Outlet /></main>
    </div>
  );
}
