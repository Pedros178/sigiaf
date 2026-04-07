import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const emptyForm = { id_activo: '', tipo: 'Preventivo', descripcion: '', fecha: '', responsable: '', costo: '' };

export default function Mantenimientos() {
  const [mantenimientos, setMantenimientos] = useState([]);
  const [activos, setActivos]               = useState([]);
  const [modal, setModal]                   = useState(false);
  const [form, setForm]                     = useState(emptyForm);
  const [editId, setEditId]                 = useState(null);
  const [loading, setLoading]               = useState(true);

  const cargar = async () => {
    try {
      const [m, a] = await Promise.all([api.get('/mantenimientos'), api.get('/activos')]);
      setMantenimientos(m.data);
      setActivos(a.data);
    } catch { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const abrirModal = (m = null) => {
    if (m) {
      setForm({ id_activo: m.id_activo, tipo: m.tipo, descripcion: m.descripcion || '', fecha: m.fecha?.split('T')[0] || '', responsable: m.responsable || '', costo: m.costo || '' });
      setEditId(m.id_mantenimiento);
    } else {
      setForm(emptyForm);
      setEditId(null);
    }
    setModal(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    try {
      if (editId) { await api.put(`/mantenimientos/${editId}`, form); toast.success('Mantenimiento actualizado'); }
      else { await api.post('/mantenimientos', form); toast.success('Mantenimiento registrado'); }
      setModal(false);
      cargar();
    } catch (err) { toast.error(err.response?.data?.mensaje || 'Error al guardar'); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este registro?')) return;
    try { await api.delete(`/mantenimientos/${id}`); toast.success('Eliminado'); cargar(); }
    catch { toast.error('Error al eliminar'); }
  };

  const tipoColor = { 'Preventivo': { bg: '#dbeafe', text: '#1e40af' }, 'Correctivo': { bg: '#fee2e2', text: '#991b1b' } };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1a3a6b', margin: 0 }}>Mantenimientos</h1>
          <p style={{ color: '#6b7280', marginTop: '4px', fontSize: '14px' }}>{mantenimientos.length} registros</p>
        </div>
        <button onClick={() => abrirModal()} style={btnPrimary}>+ Nuevo mantenimiento</button>
      </div>

      {loading ? <p style={{ color: '#9ca3af' }}>Cargando...</p> : (
        <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Activo', 'Tipo', 'Descripción', 'Fecha', 'Responsable', 'Costo', 'Acciones'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mantenimientos.map(m => {
                const c = tipoColor[m.tipo] || { bg: '#f3f4f6', text: '#374151' };
                return (
                  <tr key={m.id_mantenimiento} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#1a3a6b' }}>{m.activo_nombre}</td>
                    <td style={{ padding: '14px 16px' }}><span style={{ background: c.bg, color: c.text, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{m.tipo}</span></td>
                    <td style={{ padding: '14px 16px', color: '#6b7280', maxWidth: '200px' }}>{m.descripcion || '—'}</td>
                    <td style={{ padding: '14px 16px', color: '#6b7280' }}>{new Date(m.fecha).toLocaleDateString('es-MX')}</td>
                    <td style={{ padding: '14px 16px', color: '#374151' }}>{m.responsable || '—'}</td>
                    <td style={{ padding: '14px 16px', color: '#374151' }}>{m.costo ? `$${parseFloat(m.costo).toFixed(2)}` : '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => abrirModal(m)} style={btnEdit}>Editar</button>
                        <button onClick={() => eliminar(m.id_mantenimiento)} style={btnDelete}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {mantenimientos.length === 0 && (
                <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No hay mantenimientos registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div style={overlay}>
          <div style={modalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1a3a6b' }}>{editId ? 'Editar' : 'Nuevo'} mantenimiento</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={guardar} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Activo *</label>
                <select value={form.id_activo} onChange={e => setForm({ ...form, id_activo: e.target.value })} required style={formInput}>
                  <option value="">Seleccionar activo...</option>
                  {activos.map(a => <option key={a.id_activo} value={a.id_activo}>{a.nombre}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Tipo *</label>
                <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} style={formInput}>
                  <option>Preventivo</option><option>Correctivo</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Fecha *</label>
                <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} required style={formInput} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Responsable</label>
                <input value={form.responsable} onChange={e => setForm({ ...form, responsable: e.target.value })} style={formInput} placeholder="Nombre del técnico" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Costo ($)</label>
                <input type="number" step="0.01" value={form.costo} onChange={e => setForm({ ...form, costo: e.target.value })} style={formInput} placeholder="0.00" />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={3} style={{ ...formInput, resize: 'vertical' }} />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setModal(false)} style={btnCancel}>Cancelar</button>
                <button type="submit" style={btnPrimary}>{editId ? 'Actualizar' : 'Registrar'}</button>
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
const btnDelete = { padding: '6px 14px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' };
const btnCancel = { padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', fontFamily: 'inherit' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '20px' };
const modalCard = { background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' };
const labelStyle = { fontSize: '13px', fontWeight: '600', color: '#374151' };
const formInput = { padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' };
