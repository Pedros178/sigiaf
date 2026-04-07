import { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const estadoColor = {
  'Disponible':    { bg: '#dcfce7', text: '#166534' },
  'No disponible': { bg: '#fee2e2', text: '#991b1b' },
  'Mantenimiento': { bg: '#fef3c7', text: '#92400e' },
};

const emptyForm = { codigo_qr: '', nombre: '', descripcion: '', marca: '', modelo: '', numero_serie: '', estado: 'Disponible', ubicacion: '', id_categoria: '' };

function generarCodigoQR() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ACT-${timestamp}-${rand}`;
}

export default function Activos() {
  const [activos, setActivos]       = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [modal, setModal]           = useState(false);
  const [modalQR, setModalQR]       = useState(false);
  const [activoQR, setActivoQR]     = useState(null);
  const [qrDataUrl, setQrDataUrl]   = useState('');
  const [form, setForm]             = useState(emptyForm);
  const [editId, setEditId]         = useState(null);
  const [busqueda, setBusqueda]     = useState('');
  const [loading, setLoading]       = useState(true);
  const printRef = useRef();

  const cargar = async () => {
    try {
      const [a, c] = await Promise.all([api.get('/activos'), api.get('/categorias')]);
      setActivos(a.data);
      setCategorias(c.data);
    } catch { toast.error('Error al cargar datos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const abrirModal = (activo = null) => {
    if (activo) {
      setForm({ codigo_qr: activo.codigo_qr, nombre: activo.nombre, descripcion: activo.descripcion || '', marca: activo.marca || '', modelo: activo.modelo || '', numero_serie: activo.numero_serie || '', estado: activo.estado, ubicacion: activo.ubicacion || '', id_categoria: activo.id_categoria });
      setEditId(activo.id_activo);
    } else {
      setForm({ ...emptyForm, codigo_qr: generarCodigoQR() });
      setEditId(null);
    }
    setModal(true);
  };

  const verQR = async (activo) => {
    setActivoQR(activo);
    const url = await QRCode.toDataURL(activo.codigo_qr, { width: 300, margin: 2, color: { dark: '#1a3a6b', light: '#ffffff' } });
    setQrDataUrl(url);
    setModalQR(true);
  };

  const imprimirQR = () => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>QR - ${activoQR.nombre}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f0f4fa; }
        .card { background: white; border-radius: 16px; padding: 32px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 320px; }
        .titulo { font-size: 20px; font-weight: 800; color: #1a3a6b; margin: 16px 0 4px; }
        .codigo { font-family: monospace; background: #f3f4f6; padding: 6px 14px; border-radius: 8px; font-size: 13px; color: #374151; margin-bottom: 8px; display: inline-block; }
        .detalle { font-size: 12px; color: #6b7280; margin: 4px 0; }
        .inst { font-size: 11px; color: #9ca3af; margin-top: 16px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
      </style></head>
      <body><div class="card">
        <img src="${qrDataUrl}" width="200" />
        <div class="titulo">${activoQR.nombre}</div>
        <div class="codigo">${activoQR.codigo_qr}</div>
        <div class="detalle">${activoQR.categoria || ''}</div>
        <div class="detalle">${activoQR.ubicacion || ''}</div>
        <div class="inst">Instituto Tecnológico de Tehuacán<br/>SIGIAF — Control de Activos</div>
      </div></body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(26, 58, 107);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SIGIAF — Inventario de Activos', 14, 14);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Instituto Tecnológico de Tehuacán | ${new Date().toLocaleDateString('es-MX')}`, 14, 23);

    autoTable(doc, {
      startY: 38,
      head: [['Código QR', 'Nombre', 'Categoría', 'Estado', 'Ubicación', 'Marca/Modelo']],
      body: activos.map(a => [
        a.codigo_qr,
        a.nombre,
        a.categoria || '',
        a.estado,
        a.ubicacion || '—',
        [a.marca, a.modelo].filter(Boolean).join(' / ') || '—',
      ]),
      headStyles: { fillColor: [26, 58, 107], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [240, 244, 250] },
      styles: { cellPadding: 4 },
    });

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Total de activos: ${activos.length}`, 14, doc.lastAutoTable.finalY + 10);
    doc.save(`inventario-activos-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF generado correctamente');
  };


  const exportarExcel = () => {
    const datos = activos.map(a => ({
      'Código QR': a.codigo_qr,
      'Nombre': a.nombre,
      'Categoría': a.categoria || '',
      'Estado': a.estado,
      'Ubicación': a.ubicacion || '',
      'Marca': a.marca || '',
      'Modelo': a.modelo || '',
      'N° Serie': a.numero_serie || '',
      'Descripción': a.descripcion || '',
      'Fecha registro': new Date(a.fecha_registro).toLocaleDateString('es-MX'),
    }));
    const ws = XLSX.utils.json_to_sheet(datos);
    ws['!cols'] = [12,25,15,15,15,12,12,15,30,14].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    XLSX.writeFile(wb, `inventario-activos-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel generado correctamente');
  };

  const guardar = async (e) => {
    e.preventDefault();
    try {
      if (editId) { await api.put(`/activos/${editId}`, form); toast.success('Activo actualizado'); }
      else { await api.post('/activos', form); toast.success('Activo registrado'); }
      setModal(false); cargar();
    } catch (err) { toast.error(err.response?.data?.mensaje || 'Error al guardar'); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este activo?')) return;
    try { await api.delete(`/activos/${id}`); toast.success('Activo eliminado'); cargar(); }
    catch { toast.error('Error al eliminar'); }
  };

  const filtrados = activos.filter(a =>
    a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.codigo_qr.toLowerCase().includes(busqueda.toLowerCase()) ||
    (a.ubicacion || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1a3a6b', margin: 0 }}>Activos</h1>
          <p style={{ color: '#6b7280', marginTop: '4px', fontSize: '14px' }}>{activos.length} activos registrados</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar..." style={inputStyle} />
          <button onClick={exportarPDF} style={btnSecondary}>📄 PDF</button>
          <button onClick={exportarExcel} style={{...btnSecondary, color: '#16a34a', borderColor: '#bbf7d0'}}>📊 Excel</button>
          <button onClick={() => abrirModal()} style={btnPrimary}>+ Nuevo activo</button>
        </div>
      </div>

      {loading ? <p style={{ color: '#9ca3af' }}>Cargando...</p> : (
        <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Código QR', 'Nombre', 'Categoría', 'Estado', 'Ubicación', 'Acciones'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(a => {
                const color = estadoColor[a.estado] || { bg: '#f3f4f6', text: '#374151' };
                return (
                  <tr key={a.id_activo} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={tdStyle}><span style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '2px 8px', borderRadius: '6px', fontSize: '12px' }}>{a.codigo_qr}</span></td>
                    <td style={{ ...tdStyle, fontWeight: '600', color: '#1a3a6b' }}>{a.nombre}</td>
                    <td style={{ ...tdStyle, color: '#6b7280' }}>{a.categoria}</td>
                    <td style={tdStyle}><span style={{ background: color.bg, color: color.text, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{a.estado}</span></td>
                    <td style={{ ...tdStyle, color: '#6b7280' }}>{a.ubicacion || '—'}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => verQR(a)} style={btnQR}>QR</button>
                        <button onClick={() => abrirModal(a)} style={btnEdit}>Editar</button>
                        <button onClick={() => eliminar(a.id_activo)} style={btnDelete}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtrados.length === 0 && (
                <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No se encontraron activos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal QR */}
      {modalQR && activoQR && (
        <div style={overlay}>
          <div style={{ ...modalCard, maxWidth: '360px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>Código QR</h2>
              <button onClick={() => setModalQR(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <img src={qrDataUrl} alt="QR" style={{ width: '220px', height: '220px', borderRadius: '12px', border: '2px solid #e5e7eb' }} />
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontWeight: '700', fontSize: '16px', color: '#1a3a6b' }}>{activoQR.nombre}</div>
              <div style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '4px 12px', borderRadius: '8px', fontSize: '13px', display: 'inline-block', marginTop: '6px' }}>{activoQR.codigo_qr}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>{activoQR.ubicacion || ''}</div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '24px' }}>
              <button onClick={() => setModalQR(false)} style={btnCancel}>Cerrar</button>
              <button onClick={imprimirQR} style={btnPrimary}>🖨️ Imprimir</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nuevo/editar activo */}
      {modal && (
        <div style={overlay}>
          <div style={modalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1a3a6b' }}>{editId ? 'Editar activo' : 'Nuevo activo'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>✕</button>
            </div>
            <form onSubmit={guardar} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Código QR *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input value={form.codigo_qr} onChange={e => setForm({ ...form, codigo_qr: e.target.value })} readOnly={!!editId} required style={{ ...formInput, flex: 1, background: editId ? '#f9fafb' : '#fff' }} />
                  {!editId && <button type="button" onClick={() => setForm({ ...form, codigo_qr: generarCodigoQR() })} style={{ ...btnSecondary, padding: '10px 12px', fontSize: '12px' }}>↺</button>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Nombre *</label>
                <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required style={formInput} />
              </div>
              {[['marca','Marca'],['modelo','Modelo'],['numero_serie','Número de serie'],['ubicacion','Ubicación']].map(([k, l]) => (
                <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={labelStyle}>{l}</label>
                  <input value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} style={formInput} />
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Estado *</label>
                <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} style={formInput}>
                  <option>Disponible</option><option>No disponible</option><option>Mantenimiento</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Categoría *</label>
                <select value={form.id_categoria} onChange={e => setForm({ ...form, id_categoria: e.target.value })} required style={formInput}>
                  <option value="">Seleccionar...</option>
                  {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={3} style={{ ...formInput, resize: 'vertical' }} />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px' }}>
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

const thStyle = { padding: '12px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle = { padding: '14px 16px' };
const inputStyle = { padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', width: '220px' };
const btnPrimary = { padding: '10px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', fontFamily: 'inherit' };
const btnSecondary = { padding: '10px 16px', background: '#f0f4fa', color: '#1a3a6b', border: '2px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', fontFamily: 'inherit' };
const btnQR = { padding: '6px 12px', background: '#f0f4fa', color: '#1a3a6b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' };
const btnEdit = { padding: '6px 14px', background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' };
const btnDelete = { padding: '6px 14px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' };
const btnCancel = { padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', fontFamily: 'inherit' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '20px' };
const modalCard = { background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' };
const labelStyle = { fontSize: '13px', fontWeight: '600', color: '#374151' };
const formInput = { padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' };
