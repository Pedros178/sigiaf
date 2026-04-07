import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const emptyForm = { id_activo: '', responsable: '', fecha_devolucion_programada: '', condicion_entrega: 'Buena', observaciones: '' };

export default function Prestamos() {
  const [prestamos, setPrestamos]     = useState([]);
  const [activos, setActivos]         = useState([]);
  const [modal, setModal]             = useState(false);
  const [modalDev, setModalDev]       = useState(false);
  const [form, setForm]               = useState(emptyForm);
  const [prestamoSel, setPrestamoSel] = useState(null);
  const [condRetorno, setCondRetorno] = useState('Buena');
  const [filtro, setFiltro]           = useState('todos');
  const [loading, setLoading]         = useState(true);

  const cargar = async () => {
    try {
      const [p, a] = await Promise.all([api.get('/prestamos'), api.get('/activos')]);
      setPrestamos(p.data);
      setActivos(a.data.filter(x => x.estado === 'Disponible'));
    } catch { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async (e) => {
    e.preventDefault();
    try {
      await api.post('/prestamos', form);
      toast.success('Préstamo registrado');
      setModal(false); cargar();
    } catch (err) { toast.error(err.response?.data?.mensaje || 'Error al registrar'); }
  };

  const devolver = async () => {
    try {
      await api.put(`/prestamos/${prestamoSel.id}/devolver`, { condicion_retorno: condRetorno });
      toast.success('Devolución registrada');
      setModalDev(false); cargar();
    } catch (err) { toast.error(err.response?.data?.mensaje || 'Error al devolver'); }
  };

  const exportarPDF = () => {
    const activos = prestamos.filter(p => p.estado === 'Prestado');
    const doc = new jsPDF();

    doc.setFillColor(26, 58, 107);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SIGIAF — Préstamos Activos', 14, 14);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Instituto Tecnológico de Tehuacán | ${new Date().toLocaleDateString('es-MX')}`, 14, 23);

    autoTable(doc, {
      startY: 38,
      head: [['Activo', 'Código QR', 'Responsable', 'Fecha préstamo', 'Devolución programada', 'Condición']],
      body: activos.map(p => [
        p.activo_nombre,
        p.codigo_qr,
        p.responsable,
        new Date(p.fecha_prestamo).toLocaleDateString('es-MX'),
        new Date(p.fecha_devolucion_programada).toLocaleDateString('es-MX'),
        p.condicion_entrega || '—',
      ]),
      headStyles: { fillColor: [240, 165, 0], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [255, 251, 235] },
      styles: { cellPadding: 4 },
    });

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Total préstamos activos: ${activos.length}`, 14, doc.lastAutoTable.finalY + 10);
    doc.save(`prestamos-activos-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF generado correctamente');
  };

  const filtrados = prestamos.filter(p => filtro === 'todos' ? true : p.estado === filtro);
  const vencidos = new Set(prestamos.filter(p => p.estado === 'Prestado' && new Date(p.fecha_devolucion_programada) < new Date()).map(p => p.id));

  const estadoColor = {
    'Prestado': { bg: '#fef3c7', text: '#92400e' },
    'Devuelto': { bg: '#dcfce7', text: '#166534' },
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1a3a6b', margin: 0 }}>Préstamos</h1>
          <p style={{ color: '#6b7280', marginTop: '4px', fontSize: '14px' }}>
            {prestamos.filter(p => p.estado === 'Prestado').length} activos — 
            <span style={{ color: '#dc2626', fontWeight: '600' }}> {vencidos.size} vencidos</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['todos', 'Prestado', 'Devuelto'].map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={{
              padding: '8px 16px', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
              background: filtro === f ? '#1a3a6b' : '#f3f4f6',
              color: filtro === f ? '#fff' : '#374151',
            }}>{f === 'todos' ? 'Todos' : f}</button>
          ))}
          <button onClick={exportarPDF} style={btnSecondary}>📄 Exportar PDF</button>
          <button onClick={() => { setForm(emptyForm); setModal(true); }} style={btnPrimary}>+ Nuevo préstamo</button>
        </div>
      </div>

      {vencidos.size > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <span style={{ color: '#991b1b', fontWeight: '600', fontSize: '14px' }}>
            {vencidos.size} préstamo(s) han superado la fecha de devolución programada.
          </span>
        </div>
      )}

      {loading ? <p style={{ color: '#9ca3af' }}>Cargando...</p> : (
        <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Activo', 'Responsable', 'Fecha préstamo', 'Devolución programada', 'Condición', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(p => {
                const color = estadoColor[p.estado] || { bg: '#f3f4f6', text: '#374151' };
                const esVencido = vencidos.has(p.id);
                return (
                  <tr key={p.id} style={{ borderTop: '1px solid #f3f4f6', background: esVencido ? '#fff7f7' : 'transparent' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#1a3a6b' }}>
                      {p.activo_nombre}
                      {esVencido && <span style={{ marginLeft: '6px', fontSize: '11px', background: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>VENCIDO</span>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>{p.responsable}</td>
                    <td style={{ padding: '14px 16px', color: '#6b7280' }}>{new Date(p.fecha_prestamo).toLocaleDateString('es-MX')}</td>
                    <td style={{ padding: '14px 16px', color: esVencido ? '#dc2626' : '#6b7280', fontWeight: esVencido ? '600' : '400' }}>
                      {new Date(p.fecha_devolucion_programada).toLocaleDateString('es-MX')}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#6b7280' }}>{p.condicion_entrega || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: color.bg, color: color.text, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{p.estado}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {p.estado === 'Prestado' && (
                        <button onClick={() => { setPrestamoSel(p); setCondRetorno('Buena'); setModalDev(true); }} style={btnEdit}>Devolver</button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtrados.length === 0 && (
                <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No hay préstamos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div style={overlay}>
          <div style={modalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1a3a6b' }}>Nuevo préstamo</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Activo disponible *</label>
                <select value={form.id_activo} onChange={e => setForm({ ...form, id_activo: e.target.value })} required style={formInput}>
                  <option value="">Seleccionar activo...</option>
                  {activos.map(a => <option key={a.id_activo} value={a.id_activo}>{a.nombre} — {a.codigo_qr}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Responsable *</label>
                <input value={form.responsable} onChange={e => setForm({ ...form, responsable: e.target.value })} required style={formInput} placeholder="Nombre completo" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Fecha de devolución programada *</label>
                <input type="date" value={form.fecha_devolucion_programada} onChange={e => setForm({ ...form, fecha_devolucion_programada: e.target.value })} required style={formInput} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Condición de entrega</label>
                <select value={form.condicion_entrega} onChange={e => setForm({ ...form, condicion_entrega: e.target.value })} style={formInput}>
                  {['Excelente', 'Buena', 'Regular', 'Dañada'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Observaciones</label>
                <textarea value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} rows={3} style={{ ...formInput, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setModal(false)} style={btnCancel}>Cancelar</button>
                <button type="submit" style={btnPrimary}>Registrar préstamo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalDev && prestamoSel && (
        <div style={overlay}>
          <div style={{ ...modalCard, maxWidth: '440px' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: '700', color: '#1a3a6b' }}>Registrar devolución</h2>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>
              Activo: <strong style={{ color: '#1a3a6b' }}>{prestamoSel.activo_nombre}</strong><br />
              Responsable: <strong>{prestamoSel.responsable}</strong>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
              <label style={labelStyle}>Condición de retorno</label>
              <select value={condRetorno} onChange={e => setCondRetorno(e.target.value)} style={formInput}>
                {['Excelente', 'Buena', 'Regular', 'Dañada'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setModalDev(false)} style={btnCancel}>Cancelar</button>
              <button onClick={devolver} style={{ ...btnPrimary, background: '#16a34a' }}>Confirmar devolución</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: '12px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase' };
const btnPrimary = { padding: '10px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', fontFamily: 'inherit' };
const btnSecondary = { padding: '10px 16px', background: '#f0f4fa', color: '#1a3a6b', border: '2px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', fontFamily: 'inherit' };
const btnEdit = { padding: '6px 14px', background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' };
const btnCancel = { padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', fontFamily: 'inherit' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '20px' };
const modalCard = { background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' };
const labelStyle = { fontSize: '13px', fontWeight: '600', color: '#374151' };
const formInput = { padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' };
