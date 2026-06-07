import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import ConfirmModal from '../components/ConfirmModal';

const emptyForm = { id_activo: '', tipo: 'Preventivo', descripcion: '', fecha: '', responsable: '', costo: '' };

export default function Mantenimientos() {
  const [mantenimientos, setMantenimientos] = useState([]);
  const [activos, setActivos]   = useState([]);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState(emptyForm);
  const [editId, setEditId]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [confirm, setConfirm]   = useState({ open: false, id: null, nombre: '' });

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

  const pedirConfirmacion = (m) => {
    const activoNombre = activos.find(a => a.id_activo === m.id_activo)?.nombre || m.activo_nombre || 'activo';
    setConfirm({ open: true, id: m.id_mantenimiento, nombre: activoNombre, tipo: m.tipo, fecha: m.fecha });
  };

  const confirmarEliminar = async () => {
    try {
      await api.delete(`/mantenimientos/${confirm.id}`);
      toast.success('Registro de mantenimiento eliminado');
      cargar();
    } catch { toast.error('Error al eliminar'); }
    finally { setConfirm({ open: false, id: null, nombre: '' }); }
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text('SIGIAF — Reporte de Mantenimientos', 14, 14);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`Instituto Tecnológico de Tehuacán | ${new Date().toLocaleDateString('es-MX')}`, 14, 24);

    const preventivos = mantenimientos.filter(m => m.tipo === 'Preventivo').length;
    const correctivos = mantenimientos.filter(m => m.tipo === 'Correctivo').length;
    const costoTotal  = mantenimientos.reduce((s, m) => s + (parseFloat(m.costo) || 0), 0);

    doc.setTextColor(30, 58, 138); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('Resumen', 14, 44);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(80, 80, 80);
    doc.text(`Total registros: ${mantenimientos.length}  |  Preventivos: ${preventivos}  |  Correctivos: ${correctivos}  |  Costo total: $${costoTotal.toFixed(2)}`, 14, 52);

    autoTable(doc, {
      startY: 60,
      head: [['Activo', 'Tipo', 'Fecha', 'Responsable', 'Costo', 'Descripción']],
      body: mantenimientos.map(m => [
        m.activo_nombre,
        m.tipo,
        new Date(m.fecha).toLocaleDateString('es-MX'),
        m.responsable || '—',
        m.costo ? `$${parseFloat(m.costo).toFixed(2)}` : '—',
        m.descripcion || '—',
      ]),
      headStyles: { fillColor: [30, 58, 138], fontSize: 8.5, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      styles: { cellPadding: 3.5 },
      didParseCell: (data) => {
        if (data.column.index === 1 && data.section === 'body') {
          data.cell.styles.textColor = data.cell.raw === 'Preventivo' ? [30, 64, 175] : [185, 28, 28];
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    doc.setFontSize(8); doc.setTextColor(150);
    doc.text(`SIGIAF — Generado el ${new Date().toLocaleString('es-MX')}`, 14, doc.lastAutoTable.finalY + 10);
    doc.save(`mantenimientos-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF de mantenimientos generado');
  };

  const exportarExcel = () => {
    const datos = mantenimientos.map(m => ({
      'Activo':        m.activo_nombre,
      'Tipo':          m.tipo,
      'Fecha':         new Date(m.fecha).toLocaleDateString('es-MX'),
      'Responsable':   m.responsable || '',
      'Costo ($)':     m.costo ? parseFloat(m.costo).toFixed(2) : '',
      'Descripción':   m.descripcion || '',
    }));
    const ws = XLSX.utils.json_to_sheet(datos);
    ws['!cols'] = [28, 14, 14, 22, 12, 40].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mantenimientos');
    XLSX.writeFile(wb, `mantenimientos-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel de mantenimientos generado');
  };

  const tipoColor = {
    'Preventivo': { bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6' },
    'Correctivo': { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444' },
  };

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .mant-row:hover { background: #f8fafc !important; }
        .btn-act:hover { opacity:0.85; transform:translateY(-1px); }
        .btn-act { transition: all 0.15s; }
      `}</style>

      <ConfirmModal
        open={confirm.open}
        titulo="Eliminar registro de mantenimiento"
        mensaje={`¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.`}
        detalle={`Activo: ${confirm.nombre} · Tipo: ${confirm.tipo || ''} · Fecha: ${confirm.fecha ? new Date(confirm.fecha).toLocaleDateString('es-MX') : ''}`}
        onConfirm={confirmarEliminar}
        onCancel={() => setConfirm({ open: false, id: null, nombre: '' })}
      />

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px', flexWrap:'wrap', gap:'14px' }}>
        <div>
          <h1 style={{ fontSize:'28px', fontWeight:'800', color:'#0f172a', margin:0, letterSpacing:'-0.5px' }}>Mantenimientos</h1>
          <p style={{ color:'#64748b', marginTop:'5px', fontSize:'14px', fontWeight:'500' }}>
            {mantenimientos.length} registros · {mantenimientos.filter(m=>m.tipo==='Preventivo').length} preventivos · {mantenimientos.filter(m=>m.tipo==='Correctivo').length} correctivos
          </p>
        </div>
        <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
          <button onClick={exportarPDF} className="btn-act" style={btnOutline}>📄 PDF</button>
          <button onClick={exportarExcel} className="btn-act" style={{ ...btnOutline, color:'#15803d', borderColor:'#bbf7d0' }}>📊 Excel</button>
          <button onClick={() => abrirModal()} style={btnPrimary}>+ Nuevo mantenimiento</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:'14px', marginBottom:'24px' }}>
        {[
          { label:'Total registros', value: mantenimientos.length,                                                          color:'#1e3a8a', bg:'#eff6ff', icon:'🔧' },
          { label:'Preventivos',     value: mantenimientos.filter(m=>m.tipo==='Preventivo').length,                          color:'#1e40af', bg:'#dbeafe', icon:'🛡️' },
          { label:'Correctivos',     value: mantenimientos.filter(m=>m.tipo==='Correctivo').length,                          color:'#b91c1c', bg:'#fee2e2', icon:'🚨' },
          { label:'Costo total',     value:`$${mantenimientos.reduce((s,m)=>s+(parseFloat(m.costo)||0),0).toFixed(2)}`,     color:'#15803d', bg:'#f0fdf4', icon:'💰' },
        ].map(s => (
          <div key={s.label} style={{ background:s.bg, borderRadius:'14px', padding:'18px 20px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize:'20px', marginBottom:'6px' }}>{s.icon}</div>
            <div style={{ fontSize:'22px', fontWeight:'800', color:s.color, lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:'12px', color:s.color, fontWeight:'600', marginTop:'4px', opacity:0.8 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'60px', color:'#94a3b8' }}>
          <div style={{ fontSize:'32px', marginBottom:'12px' }}>⏳</div>
          <p style={{ fontWeight:'600' }}>Cargando mantenimientos...</p>
        </div>
      ) : (
        <div style={{ background:'#fff', borderRadius:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', overflow:'hidden', border:'1px solid #e2e8f0' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13.5px' }}>
            <thead>
              <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                {['Activo','Tipo','Fecha','Responsable','Costo','Descripción','Acciones'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mantenimientos.map(m => {
                const c = tipoColor[m.tipo] || { bg:'#f1f5f9', text:'#475569', dot:'#94a3b8' };
                return (
                  <tr key={m.id_mantenimiento} className="mant-row" style={{ borderTop:'1px solid #f1f5f9' }}>
                    <td style={{ ...tdStyle, fontWeight:'700', color:'#0f172a' }}>{m.activo_nombre}</td>
                    <td style={tdStyle}>
                      <span style={{ background:c.bg, color:c.text, padding:'4px 12px', borderRadius:'99px', fontSize:'12px', fontWeight:'700', display:'inline-flex', alignItems:'center', gap:'5px' }}>
                        <span style={{ width:6, height:6, borderRadius:'50%', background:c.dot, display:'inline-block' }} />{m.tipo}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color:'#475569' }}>{new Date(m.fecha).toLocaleDateString('es-MX')}</td>
                    <td style={{ ...tdStyle, color:'#475569' }}>{m.responsable || '—'}</td>
                    <td style={{ ...tdStyle, color:'#15803d', fontWeight:'700' }}>{m.costo ? `$${parseFloat(m.costo).toFixed(2)}` : '—'}</td>
                    <td style={{ ...tdStyle, color:'#64748b', maxWidth:'200px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.descripcion || '—'}</td>
                    <td style={tdStyle}>
                      <div style={{ display:'flex', gap:'6px' }}>
                        <button className="btn-act" onClick={() => abrirModal(m)} style={btnEdit}>Editar</button>
                        <button className="btn-act" onClick={() => pedirConfirmacion(m)} style={btnDelete}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {mantenimientos.length === 0 && (
                <tr><td colSpan="7" style={{ padding:'60px', textAlign:'center', color:'#94a3b8' }}>
                  <div style={{ fontSize:'36px', marginBottom:'12px' }}>🔧</div>
                  <div style={{ fontWeight:'600', fontSize:'15px' }}>No hay mantenimientos registrados</div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={overlay}>
          <div style={modalCard}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'26px' }}>
              <div>
                <h2 style={{ margin:0, fontSize:'20px', fontWeight:'800', color:'#0f172a' }}>{editId ? 'Editar' : 'Nuevo'} mantenimiento</h2>
                <p style={{ margin:'4px 0 0', color:'#94a3b8', fontSize:'13px' }}>{editId ? 'Modifica el registro de mantenimiento' : 'Registra un nuevo mantenimiento'}</p>
              </div>
              <button onClick={() => setModal(false)} style={btnClose}>✕</button>
            </div>
            <form onSubmit={guardar} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
              <div style={{ gridColumn:'1 / -1', display:'flex', flexDirection:'column', gap:'6px' }}>
                <label style={labelStyle}>Activo *</label>
                <select value={form.id_activo} onChange={e => setForm({ ...form, id_activo: e.target.value })} required style={formInput}>
                  <option value="">Seleccionar activo...</option>
                  {activos.map(a => <option key={a.id_activo} value={a.id_activo}>{a.nombre} {a.sku ? `· ${a.sku}` : ''}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                <label style={labelStyle}>Tipo *</label>
                <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} style={formInput}>
                  <option>Preventivo</option><option>Correctivo</option>
                </select>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                <label style={labelStyle}>Fecha *</label>
                <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} required style={formInput} />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                <label style={labelStyle}>Responsable</label>
                <input value={form.responsable} onChange={e => setForm({ ...form, responsable: e.target.value })} style={formInput} placeholder="Nombre del técnico" />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                <label style={labelStyle}>Costo ($)</label>
                <input type="number" step="0.01" value={form.costo} onChange={e => setForm({ ...form, costo: e.target.value })} style={formInput} placeholder="0.00" />
              </div>
              <div style={{ gridColumn:'1 / -1', display:'flex', flexDirection:'column', gap:'6px' }}>
                <label style={labelStyle}>Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={3} style={{ ...formInput, resize:'vertical' }} placeholder="Describe el trabajo realizado..." />
              </div>
              <div style={{ gridColumn:'1 / -1', display:'flex', gap:'12px', justifyContent:'flex-end', paddingTop:'8px', borderTop:'1px solid #f1f5f9' }}>
                <button type="button" onClick={() => setModal(false)} style={btnCancel}>Cancelar</button>
                <button type="submit" style={btnPrimary}>{editId ? '✓ Actualizar' : '+ Registrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle  = { padding:'12px 16px', textAlign:'left', color:'#64748b', fontWeight:'700', fontSize:'11.5px', textTransform:'uppercase', letterSpacing:'0.6px' };
const tdStyle  = { padding:'13px 16px' };
const btnPrimary  = { padding:'10px 20px', background:'linear-gradient(135deg,#1e3a8a,#1e40af)', color:'#fff', border:'none', borderRadius:'10px', cursor:'pointer', fontWeight:'700', fontSize:'13.5px', fontFamily:'inherit', boxShadow:'0 2px 8px rgba(30,58,138,0.3)' };
const btnOutline  = { padding:'10px 16px', background:'#f8fafc', color:'#475569', border:'1.5px solid #e2e8f0', borderRadius:'10px', cursor:'pointer', fontWeight:'600', fontSize:'13px', fontFamily:'inherit' };
const btnEdit     = { padding:'6px 14px', background:'#f0fdf4', color:'#15803d', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'12.5px', fontWeight:'700' };
const btnDelete   = { padding:'6px 14px', background:'#fef2f2', color:'#dc2626', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'12.5px', fontWeight:'700' };
const btnCancel   = { padding:'10px 20px', background:'#f8fafc', color:'#475569', border:'1.5px solid #e2e8f0', borderRadius:'10px', cursor:'pointer', fontWeight:'600', fontSize:'13.5px', fontFamily:'inherit' };
const btnClose    = { background:'#f1f5f9', border:'none', borderRadius:'8px', width:'32px', height:'32px', cursor:'pointer', fontSize:'14px', color:'#64748b' };
const overlay     = { position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:'20px' };
const modalCard   = { background:'#fff', borderRadius:'20px', padding:'32px', width:'100%', maxWidth:'640px', maxHeight:'92vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.2)' };
const labelStyle  = { fontSize:'12.5px', fontWeight:'700', color:'#374151', letterSpacing:'0.02em' };
const formInput   = { padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'14px', outline:'none', fontFamily:'inherit', width:'100%', boxSizing:'border-box', color:'#0f172a' };
