import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
    const actPrest = prestamos.filter(p => p.estado === 'Prestado');
    const doc = new jsPDF();
    doc.setFillColor(30, 58, 138); doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text('SIGIAF — Préstamos Activos', 14, 14);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`Instituto Tecnológico de Tehuacán | ${new Date().toLocaleDateString('es-MX')}`, 14, 24);
    autoTable(doc, {
      startY: 40,
      head: [['Activo', 'Código QR', 'Responsable', 'Fecha préstamo', 'Devolución prog.', 'Condición', 'Estado']],
      body: prestamos.map(p => [
        p.activo_nombre, p.codigo_qr, p.responsable,
        new Date(p.fecha_prestamo).toLocaleDateString('es-MX'),
        new Date(p.fecha_devolucion_programada).toLocaleDateString('es-MX'),
        p.condicion_entrega || '—', p.estado,
      ]),
      headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255], fontSize: 8.5, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [255, 251, 235] },
      styles: { cellPadding: 3.5 },
      didParseCell: (data) => {
        if (data.column.index === 6 && data.section === 'body') {
          data.cell.styles.textColor = data.cell.raw === 'Devuelto' ? [21, 128, 61] : [180, 83, 9];
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
    doc.setFontSize(8); doc.setTextColor(150);
    doc.text(`Total préstamos: ${prestamos.length}  |  Activos en préstamo: ${actPrest.length}  |  ${new Date().toLocaleString('es-MX')}`, 14, doc.lastAutoTable.finalY + 10);
    doc.save(`prestamos-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF de préstamos generado');
  };

  const exportarExcel = () => {
    const datos = prestamos.map(p => ({
      'Activo': p.activo_nombre,
      'Código QR': p.codigo_qr || '',
      'Responsable': p.responsable,
      'Fecha préstamo': new Date(p.fecha_prestamo).toLocaleDateString('es-MX'),
      'Devolución programada': new Date(p.fecha_devolucion_programada).toLocaleDateString('es-MX'),
      'Fecha devolución real': p.fecha_devolucion_real ? new Date(p.fecha_devolucion_real).toLocaleDateString('es-MX') : '',
      'Condición entrega': p.condicion_entrega || '',
      'Condición retorno': p.condicion_retorno || '',
      'Estado': p.estado,
      'Observaciones': p.observaciones || '',
    }));
    const ws = XLSX.utils.json_to_sheet(datos);
    ws['!cols'] = [26, 22, 22, 18, 20, 20, 18, 18, 12, 30].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Préstamos');
    XLSX.writeFile(wb, `prestamos-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel de préstamos generado');
  };

  const filtrados = prestamos.filter(p => filtro === 'todos' ? true : p.estado === filtro);
  const vencidos  = new Set(prestamos.filter(p => p.estado === 'Prestado' && new Date(p.fecha_devolucion_programada) < new Date()).map(p => p.id));

  const estadoColor = {
    'Prestado': { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
    'Devuelto': { bg: '#dcfce7', text: '#166534', dot: '#22c55e' },
  };

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .prest-row:hover{background:#f8fafc!important;}
        .btn-icon:hover{opacity:.85;transform:translateY(-1px);}
        .btn-icon{transition:all .15s;}
        .card-stat{transition:transform .15s,box-shadow .15s;}
        .card-stat:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.1)!important;}
        .form-input:focus{border-color:#1e40af!important;box-shadow:0 0 0 3px rgba(30,64,175,0.1);}
      `}</style>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px', flexWrap:'wrap', gap:'14px' }}>
        <div>
          <h1 style={{ fontSize:'28px', fontWeight:'800', color:'#0f172a', margin:0, letterSpacing:'-0.5px' }}>Préstamos</h1>
          <p style={{ color:'#64748b', marginTop:'5px', fontSize:'14px', fontWeight:'500' }}>
            {prestamos.filter(p=>p.estado==='Prestado').length} activos en préstamo
            {vencidos.size > 0 && <span style={{ color:'#dc2626', fontWeight:'700' }}> · {vencidos.size} vencidos</span>}
          </p>
        </div>
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
          {['todos','Prestado','Devuelto'].map(f=>(
            <button key={f} onClick={()=>setFiltro(f)} style={{
              padding:'8px 16px', border:'none', borderRadius:'20px', cursor:'pointer', fontSize:'13px', fontWeight:'600',
              background: filtro===f ? '#1e3a8a' : '#f1f5f9', color: filtro===f ? '#fff' : '#374151',
            }}>{f==='todos'?'Todos':f}</button>
          ))}
          <button onClick={exportarPDF} className="btn-icon" style={btnOutline}>📄 PDF</button>
          <button onClick={exportarExcel} className="btn-icon" style={{ ...btnOutline, color:'#15803d', borderColor:'#bbf7d0' }}>📊 Excel</button>
          <button onClick={()=>{setForm(emptyForm);setModal(true);}} style={btnPrimary}>+ Nuevo préstamo</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))', gap:'14px', marginBottom:'24px' }}>
        {[
          { label:'Total registros', value:prestamos.length, color:'#1e3a8a', bg:'#eff6ff', icon:'🔄' },
          { label:'En préstamo', value:prestamos.filter(p=>p.estado==='Prestado').length, color:'#b45309', bg:'#fffbeb', icon:'📤' },
          { label:'Devueltos', value:prestamos.filter(p=>p.estado==='Devuelto').length, color:'#15803d', bg:'#f0fdf4', icon:'✅' },
          { label:'Vencidos', value:vencidos.size, color:'#b91c1c', bg:'#fef2f2', icon:'⚠️' },
        ].map(s=>(
          <div key={s.label} className="card-stat" style={{ background:s.bg, borderRadius:'14px', padding:'18px 20px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize:'22px', marginBottom:'6px' }}>{s.icon}</div>
            <div style={{ fontSize:'28px', fontWeight:'800', color:s.color, lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:'12px', color:s.color, fontWeight:'600', marginTop:'4px', opacity:.8 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {vencidos.size > 0 && (
        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'12px', padding:'14px 18px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{ fontSize:'20px' }}>⚠️</span>
          <span style={{ color:'#991b1b', fontWeight:'700', fontSize:'14px' }}>
            {vencidos.size} préstamo(s) han superado la fecha de devolución programada.
          </span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px', color:'#94a3b8' }}>
          <div style={{ fontSize:'32px', marginBottom:'12px' }}>⏳</div>
          <p style={{ fontWeight:'600' }}>Cargando préstamos...</p>
        </div>
      ) : (
        <div style={{ background:'#fff', borderRadius:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', overflow:'hidden', border:'1px solid #e2e8f0' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13.5px' }}>
            <thead>
              <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                {['Activo','Responsable','Fecha préstamo','Devolución prog.','Condición','Estado','Acciones'].map(h=>(
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(p=>{
                const clr     = estadoColor[p.estado]||{bg:'#f1f5f9',text:'#475569',dot:'#94a3b8'};
                const vencido = vencidos.has(p.id);
                return (
                  <tr key={p.id} className="prest-row" style={{ borderTop:'1px solid #f1f5f9', background:vencido?'#fff7f7':'transparent' }}>
                    <td style={{ ...tdStyle, fontWeight:'700', color:'#0f172a' }}>
                      {p.activo_nombre}
                      {vencido&&<span style={{ marginLeft:'6px', fontSize:'10px', background:'#fee2e2', color:'#dc2626', padding:'2px 6px', borderRadius:'4px', fontWeight:'800' }}>VENCIDO</span>}
                    </td>
                    <td style={tdStyle}>{p.responsable}</td>
                    <td style={{ ...tdStyle, color:'#64748b' }}>{new Date(p.fecha_prestamo).toLocaleDateString('es-MX')}</td>
                    <td style={{ ...tdStyle, color:vencido?'#dc2626':'#64748b', fontWeight:vencido?'700':'400' }}>
                      {new Date(p.fecha_devolucion_programada).toLocaleDateString('es-MX')}
                    </td>
                    <td style={{ ...tdStyle, color:'#64748b' }}>{p.condicion_entrega||'—'}</td>
                    <td style={tdStyle}>
                      <span style={{ background:clr.bg, color:clr.text, padding:'4px 12px', borderRadius:'99px', fontSize:'12px', fontWeight:'700', display:'inline-flex', alignItems:'center', gap:'5px' }}>
                        <span style={{ width:6, height:6, borderRadius:'50%', background:clr.dot, display:'inline-block' }}/>{p.estado}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {p.estado==='Prestado'&&(
                        <button className="btn-icon" onClick={()=>{setPrestamoSel(p);setCondRetorno('Buena');setModalDev(true);}} style={btnEdit}>Devolver</button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtrados.length===0&&(
                <tr><td colSpan="7" style={{ padding:'60px', textAlign:'center', color:'#94a3b8' }}>
                  <div style={{ fontSize:'36px', marginBottom:'12px' }}>📭</div>
                  <div style={{ fontWeight:'600', fontSize:'15px' }}>No hay préstamos</div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal nuevo préstamo */}
      {modal&&(
        <div style={overlay}>
          <div style={modalCard}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'26px' }}>
              <div>
                <h2 style={{ margin:0, fontSize:'20px', fontWeight:'800', color:'#0f172a' }}>Nuevo préstamo</h2>
                <p style={{ margin:'4px 0 0', color:'#94a3b8', fontSize:'13px' }}>Registra la salida de un activo</p>
              </div>
              <button onClick={()=>setModal(false)} style={btnClose}>✕</button>
            </div>
            <form onSubmit={guardar} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                <label style={labelStyle}>Activo disponible *</label>
                <select className="form-input" value={form.id_activo} onChange={e=>setForm({...form,id_activo:e.target.value})} required style={formInput}>
                  <option value="">Seleccionar activo...</option>
                  {activos.map(a=><option key={a.id_activo} value={a.id_activo}>{a.nombre}{a.sku?` · ${a.sku}`:''} — {a.codigo_qr}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                <label style={labelStyle}>Responsable *</label>
                <input className="form-input" value={form.responsable} onChange={e=>setForm({...form,responsable:e.target.value})} required style={formInput} placeholder="Nombre completo"/>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                <label style={labelStyle}>Fecha de devolución programada *</label>
                <input className="form-input" type="date" value={form.fecha_devolucion_programada} onChange={e=>setForm({...form,fecha_devolucion_programada:e.target.value})} required style={formInput} min={new Date().toISOString().split('T')[0]}/>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                <label style={labelStyle}>Condición de entrega</label>
                <select className="form-input" value={form.condicion_entrega} onChange={e=>setForm({...form,condicion_entrega:e.target.value})} style={formInput}>
                  {['Excelente','Buena','Regular','Dañada'].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                <label style={labelStyle}>Observaciones</label>
                <textarea className="form-input" value={form.observaciones} onChange={e=>setForm({...form,observaciones:e.target.value})} rows={3} style={{ ...formInput, resize:'vertical' }}/>
              </div>
              <div style={{ display:'flex', gap:'12px', justifyContent:'flex-end', paddingTop:'8px', borderTop:'1px solid #f1f5f9' }}>
                <button type="button" onClick={()=>setModal(false)} style={btnCancel}>Cancelar</button>
                <button type="submit" style={btnPrimary}>Registrar préstamo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal devolución */}
      {modalDev&&prestamoSel&&(
        <div style={overlay}>
          <div style={{ ...modalCard, maxWidth:'440px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <h2 style={{ margin:0, fontSize:'20px', fontWeight:'800', color:'#0f172a' }}>Registrar devolución</h2>
              <button onClick={()=>setModalDev(false)} style={btnClose}>✕</button>
            </div>
            <div style={{ background:'#f8fafc', borderRadius:'12px', padding:'14px 16px', marginBottom:'20px' }}>
              <div style={{ fontSize:'13px', color:'#64748b', fontWeight:'500' }}>Activo</div>
              <div style={{ fontWeight:'800', color:'#0f172a', fontSize:'15px' }}>{prestamoSel.activo_nombre}</div>
              <div style={{ fontSize:'13px', color:'#64748b', marginTop:'6px' }}>Responsable: <strong style={{ color:'#0f172a' }}>{prestamoSel.responsable}</strong></div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginBottom:'24px' }}>
              <label style={labelStyle}>Condición de retorno</label>
              <select className="form-input" value={condRetorno} onChange={e=>setCondRetorno(e.target.value)} style={formInput}>
                {['Excelente','Buena','Regular','Dañada'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', gap:'12px', justifyContent:'flex-end' }}>
              <button onClick={()=>setModalDev(false)} style={btnCancel}>Cancelar</button>
              <button onClick={devolver} style={{ ...btnPrimary, background:'linear-gradient(135deg,#15803d,#16a34a)' }}>✓ Confirmar devolución</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle    = { padding:'12px 16px', textAlign:'left', color:'#64748b', fontWeight:'700', fontSize:'11.5px', textTransform:'uppercase', letterSpacing:'0.6px' };
const tdStyle    = { padding:'13px 16px' };
const btnPrimary = { padding:'10px 20px', background:'linear-gradient(135deg,#1e3a8a,#1e40af)', color:'#fff', border:'none', borderRadius:'10px', cursor:'pointer', fontWeight:'700', fontSize:'13.5px', fontFamily:'inherit', boxShadow:'0 2px 8px rgba(30,58,138,0.3)' };
const btnOutline = { padding:'10px 16px', background:'#f8fafc', color:'#475569', border:'1.5px solid #e2e8f0', borderRadius:'10px', cursor:'pointer', fontWeight:'600', fontSize:'13px', fontFamily:'inherit' };
const btnEdit    = { padding:'6px 14px', background:'#eff6ff', color:'#1e40af', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'12.5px', fontWeight:'700' };
const btnCancel  = { padding:'10px 20px', background:'#f8fafc', color:'#475569', border:'1.5px solid #e2e8f0', borderRadius:'10px', cursor:'pointer', fontWeight:'600', fontSize:'13.5px', fontFamily:'inherit' };
const btnClose   = { background:'#f1f5f9', border:'none', borderRadius:'8px', width:'32px', height:'32px', cursor:'pointer', fontSize:'14px', color:'#64748b' };
const overlay    = { position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:'20px' };
const modalCard  = { background:'#fff', borderRadius:'20px', padding:'32px', width:'100%', maxWidth:'600px', maxHeight:'92vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.2)' };
const labelStyle = { fontSize:'12.5px', fontWeight:'700', color:'#374151' };
const formInput  = { padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'14px', outline:'none', fontFamily:'inherit', width:'100%', boxSizing:'border-box', color:'#0f172a' };
