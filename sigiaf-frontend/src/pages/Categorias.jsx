import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nombre: '', descripcion: '' });
  const [editId, setEditId] = useState(null);

  const cargar = async () => {
    const { data } = await api.get('/categorias');
    setCategorias(data);
  };
  useEffect(() => { cargar(); }, []);

  const abrirModal = (c = null) => {
    setForm(c ? { nombre: c.nombre, descripcion: c.descripcion || '' } : { nombre: '', descripcion: '' });
    setEditId(c ? c.id_categoria : null);
    setModal(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    try {
      if (editId) { await api.put(`/categorias/${editId}`, form); toast.success('Categoría actualizada'); }
      else { await api.post('/categorias', form); toast.success('Categoría creada'); }
      setModal(false); cargar();
    } catch (err) { toast.error(err.response?.data?.mensaje || 'Error'); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría?')) return;
    try { await api.delete(`/categorias/${id}`); toast.success('Eliminada'); cargar(); }
    catch { toast.error('Error al eliminar'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1a3a6b', margin: 0 }}>Categorías</h1>
          <p style={{ color: '#6b7280', marginTop: '4px', fontSize: '14px' }}>{categorias.length} categorías registradas</p>
        </div>
        <button onClick={() => abrirModal()} style={btnPrimary}>+ Nueva categoría</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {categorias.map(c => (
          <div key={c.id_categoria} style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderTop: '4px solid #1a3a6b' }}>
            <h3 style={{ margin: '0 0 8px', color: '#1a3a6b', fontSize: '16px' }}>{c.nombre}</h3>
            <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: '13px' }}>{c.descripcion || 'Sin descripción'}</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => abrirModal(c)} style={btnEdit}>Editar</button>
              <button onClick={() => eliminar(c.id_categoria)} style={btnDelete}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <div style={overlay}>
          <div style={modalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1a3a6b' }}>{editId ? 'Editar' : 'Nueva'} categoría</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Nombre *</label>
                <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required style={formInput} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={3} style={{ ...formInput, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setModal(false)} style={btnCancel}>Cancelar</button>
                <button type="submit" style={btnPrimary}>{editId ? 'Actualizar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
const btnPrimary = { padding: '10px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', fontFamily: 'inherit' };
const btnEdit = { padding: '6px 14px', background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' };
const btnDelete = { padding: '6px 14px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' };
const btnCancel = { padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', fontFamily: 'inherit' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '20px' };
const modalCard = { background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '500px' };
const labelStyle = { fontSize: '13px', fontWeight: '600', color: '#374151' };
const formInput = { padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' };
