import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Perfil() {
  const { usuario, login } = useAuth();
  const [tabActiva, setTabActiva] = useState('info');
  const [formInfo, setFormInfo] = useState({ nombre: usuario?.nombre || '', correo: usuario?.correo || '' });
  const [formPass, setFormPass] = useState({ password_actual: '', password_nueva: '', password_confirmar: '' });
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);

  const guardarInfo = async (e) => {
    e.preventDefault();
    setLoadingInfo(true);
    try {
      await api.put(`/usuarios/${usuario.id}`, { nombre: formInfo.nombre, correo: formInfo.correo });
      toast.success('Información actualizada');
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al actualizar');
    } finally { setLoadingInfo(false); }
  };

  const cambiarPassword = async (e) => {
    e.preventDefault();
    if (formPass.password_nueva !== formPass.password_confirmar) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (formPass.password_nueva.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoadingPass(true);
    try {
      await api.put(`/usuarios/${usuario.id}/password`, {
        password_actual: formPass.password_actual,
        password_nueva:  formPass.password_nueva,
      });
      toast.success('Contraseña actualizada correctamente');
      setFormPass({ password_actual: '', password_nueva: '', password_confirmar: '' });
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al cambiar contraseña');
    } finally { setLoadingPass(false); }
  };

  const rolColor = {
    admin:   { bg: '#fef3c7', text: '#92400e' },
    usuario: { bg: '#dbeafe', text: '#1e40af' },
    tecnico: { bg: '#d1fae5', text: '#065f46' },
  };
  const c = rolColor[usuario?.rol] || { bg: '#f3f4f6', text: '#374151' };

  return (
    <div style={{ maxWidth: '680px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1a3a6b', margin: 0 }}>Mi perfil</h1>
        <p style={{ color: '#6b7280', marginTop: '4px', fontSize: '14px' }}>Gestiona tu información y seguridad de cuenta</p>
      </div>

      {/* Card usuario */}
      <div style={{ background: 'linear-gradient(135deg, #1a3a6b, #2563eb)', borderRadius: '20px', padding: '32px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '72px', height: '72px', background: '#f0a500', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: '#fff', fontWeight: '800', fontSize: '28px' }}>{usuario?.nombre?.charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <div style={{ color: '#fff', fontWeight: '800', fontSize: '20px' }}>{usuario?.nombre}</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginTop: '4px' }}>{usuario?.correo}</div>
          <span style={{ background: c.bg, color: c.text, padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'inline-block', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {usuario?.rol}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f3f4f6', borderRadius: '12px', padding: '4px' }}>
        {[['info', '👤 Información'], ['seguridad', '🔒 Seguridad']].map(([key, label]) => (
          <button key={key} onClick={() => setTabActiva(key)} style={{
            flex: 1, padding: '10px', border: 'none', borderRadius: '10px', cursor: 'pointer',
            fontWeight: '600', fontSize: '14px', fontFamily: 'inherit',
            background: tabActiva === key ? '#fff' : 'transparent',
            color: tabActiva === key ? '#1a3a6b' : '#6b7280',
            boxShadow: tabActiva === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {/* Tab info */}
      {tabActiva === 'info' && (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '700', color: '#1a3a6b' }}>Información personal</h3>
          <form onSubmit={guardarInfo} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Nombre completo</label>
              <input value={formInfo.nombre} onChange={e => setFormInfo({...formInfo, nombre: e.target.value})} required style={formInput} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Correo electrónico</label>
              <input type="email" value={formInfo.correo} onChange={e => setFormInfo({...formInfo, correo: e.target.value})} required style={formInput} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Rol en el sistema</label>
              <input value={usuario?.rol} readOnly style={{ ...formInput, background: '#f9fafb', color: '#6b7280', cursor: 'not-allowed' }} />
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>El rol solo puede ser modificado por un administrador</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={loadingInfo} style={{ ...btnPrimary, opacity: loadingInfo ? 0.7 : 1 }}>
                {loadingInfo ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab seguridad */}
      {tabActiva === 'seguridad' && (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '700', color: '#1a3a6b' }}>Cambiar contraseña</h3>
          <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#6b7280' }}>Usa una contraseña segura de al menos 6 caracteres</p>
          <form onSubmit={cambiarPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Contraseña actual</label>
              <input type="password" value={formPass.password_actual} onChange={e => setFormPass({...formPass, password_actual: e.target.value})} required style={formInput} placeholder="••••••••" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Nueva contraseña</label>
              <input type="password" value={formPass.password_nueva} onChange={e => setFormPass({...formPass, password_nueva: e.target.value})} required style={formInput} placeholder="••••••••" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Confirmar nueva contraseña</label>
              <input type="password" value={formPass.password_confirmar} onChange={e => setFormPass({...formPass, password_confirmar: e.target.value})} required style={formInput} placeholder="••••••••" />
              {formPass.password_nueva && formPass.password_confirmar && formPass.password_nueva !== formPass.password_confirmar && (
                <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600' }}>⚠ Las contraseñas no coinciden</span>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={loadingPass} style={{ ...btnPrimary, opacity: loadingPass ? 0.7 : 1 }}>
                {loadingPass ? 'Actualizando...' : '🔒 Cambiar contraseña'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const btnPrimary = { padding: '11px 24px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', fontFamily: 'inherit' };
const labelStyle = { fontSize: '13px', fontWeight: '600', color: '#374151' };
const formInput  = { padding: '11px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' };
