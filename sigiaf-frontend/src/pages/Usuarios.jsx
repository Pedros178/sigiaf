import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nombre: '', correo: '', password: '', id_rol: '2' });
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    try { const { data } = await api.get('/usuarios'); setUsuarios(data); }
    catch { toast.error('Error al cargar usuarios'); }
    finally { setLoading(false); }
  };
  useEffect(() => { cargar(); }, []);

  const guardar = async (e) => {
    e.preventDefault();
    try {
      await api.post('/usuarios', form);
      toast.success('Usuario creado');
      setModal(false); cargar();
    } catch (err) { toast.error(err.response?.data?.mensaje || 'Error'); }
  };

  const toggleActivo = async (u) => {
    try {
      await api.put(`/usuarios/${u.id_usuario}`, { activo: !u.activo });
      toast.success(u.activo ? 'Usuario desactivado' : 'Usuario activado');
      cargar();
    } catch { toast.error('Error'); }
  };

  const roles = { admin: { bg: '#fef3c7', text: '#92400e' }, usuario: { bg: '#dbeafe', text: '#1e40af' }, tecnico: { bg: '#d1fae5', text: '#065f46' } };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1a3a6b', margin: 0 }}>Usuarios</h1>
          <p style={{ color: '#6b7280', marginTop: '4px', fontSize: '14px' }}>{usuarios.length} usuarios registrados</p>
        </div>
        <button onClick={() => setModal(true)} style={btnPrimary}>+ Nuevo usuario</button>
      </div>
      {loading ? <p style={{ color: '#9ca3af' }}>Cargando...</p> : (
        <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead><tr style={{ background: '#f9fafb' }}>
              {['Nombre', 'Correo', 'Rol', 'Estado', 'Fecha creación', 'Acciones'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {usuarios.map(u => {
                const c = roles[u.rol] || { bg: '#f3f4f6', text: '#374151' };
                return (
                  <tr key={u.id_usuario} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#1a3a6b' }}>{u.nombre}</td>
                    <td style={{ padding: '14px 16px', color: '#6b7280' }}>{u.correo}</td>
                    <td style={{ padding: '14px 16px' }}><span style={{ background: c.bg, color: c.text, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{u.rol}</span></td>
                    <td style={{ padding: '14px 16px' }}><span style={{ background: u.activo ? '#dcfce7' : '#fee2e2', color: u.activo ? '#166534' : '#991b1b', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{u.activo ? 'Activo' : 'Inactivo'}</span></td>
                    <td style={{ padding: '14px 16px', color: '#6b7280' }}>{new Date(u.fecha_creacion).toLocaleDateString('es-MX')}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => toggleActivo(u)} style={{ ...btnEdit, background: u.activo ? '#fef2f2' : '#f0fdf4', color: u.activo ? '#dc2626' : '#16a34a' }}>
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {modal && (
        <div style={overlay}>
          <div style={modalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1a3a6b' }}>Nuevo usuario</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[['nombre','Nombre *','text'],['correo','Correo *','email'],['password','Contraseña *','password']].map(([k,l,t]) => (
                <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={labelStyle}>{l}</label>
                  <input type={t} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} required style={formInput} />
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Rol *</label>
                <select value={form.id_rol} onChange={e => setForm({ ...form, id_rol: e.target.value })} style={formInput}>
                  <option value="1">Admin</option>
                  <option value="2">Usuario</option>
                  <option value="3">Técnico</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setModal(false)} style={btnCancel}>Cancelar</button>
                <button type="submit" style={btnPrimary}>Crear usuario</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
const thStyle = { padding: '12px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase' };
const btnPrimary = { padding: '10px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', fontFamily: 'inherit' };
const btnEdit = { padding: '6px 14px', background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' };
const btnCancel = { padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', fontFamily: 'inherit' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '20px' };
const modalCard = { background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '480px' };
const labelStyle = { fontSize: '13px', fontWeight: '600', color: '#374151' };
const formInput = { padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' };
