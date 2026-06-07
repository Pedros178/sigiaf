import { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import ConfirmModal from '../components/ConfirmModal';

const estadoColor = {
  'Disponible':    { bg: '#dcfce7', text: '#15803d', dot: '#22c55e' },
  'No disponible': { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444' },
  'Mantenimiento': { bg: '#fef3c7', text: '#b45309', dot: '#f59e0b' },
};

const emptyForm = {
  codigo_qr: '', nombre: '', descripcion: '', marca: '', modelo: '',
  numero_serie: '', estado: 'Disponible', ubicacion: '', id_categoria: '',
  sku: '', tecnologico: '', departamento: '', oficina: '',
};

function generarCodigoQR() {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ACT-${ts}-${rand}`;
}

/* SKU = CAT(3)-TEC(3)-DEP(3)-AÑO-RAND */
function buildSKU(form, categorias) {
  const cat = categorias.find(c => String(c.id_categoria) === String(form.id_categoria));
  const catCode = cat ? cat.nombre.substring(0, 3).toUpperCase().replace(/\s/g, '') : 'ACT';
  const tecCode = form.tecnologico ? form.tecnologico.substring(0, 3).toUpperCase().replace(/\s/g, '') : 'ITT';
  const depCode = form.departamento ? form.departamento.substring(0, 3).toUpperCase().replace(/\s/g, '') : '';
  const year    = new Date().getFullYear().toString().slice(2);
  const rand    = Math.random().toString(36).substring(2, 5).toUpperCase();
  const parts   = [catCode, tecCode, depCode, year, rand].filter(Boolean);
  return parts.join('-');
}

export default function Activos() {
  const [activos, setActivos]           = useState([]);
  const [categorias, setCategorias]     = useState([]);
  const [modal, setModal]               = useState(false);
  const [modalQR, setModalQR]           = useState(false);
  const [modalImport, setModalImport]   = useState(false);
  const [activoQR, setActivoQR]         = useState(null);
  const [qrDataUrl, setQrDataUrl]       = useState('');
  const [form, setForm]                 = useState(emptyForm);
  const [editId, setEditId]             = useState(null);
  const [busqueda, setBusqueda]         = useState('');
  const [loading, setLoading]           = useState(true);
  const [importData, setImportData]     = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importFile, setImportFile]     = useState(null);
  const [importErrors, setImportErrors] = useState([]);
  const [confirm, setConfirm]           = useState({ open: false, id: null, nombre: '' });
  const fileRef = useRef();

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
      setForm({
        codigo_qr: activo.codigo_qr, nombre: activo.nombre,
        descripcion: activo.descripcion || '', marca: activo.marca || '',
        modelo: activo.modelo || '', numero_serie: activo.numero_serie || '',
        estado: activo.estado, ubicacion: activo.ubicacion || '',
        id_categoria: activo.id_categoria, sku: activo.sku || '',
        tecnologico: activo.tecnologico || '', departamento: activo.departamento || '',
        oficina: activo.oficina || '',
      });
      setEditId(activo.id_activo);
    } else {
      setForm({ ...emptyForm, codigo_qr: generarCodigoQR() });
      setEditId(null);
    }
    setModal(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.sku) payload.sku = buildSKU(form, categorias);
      if (editId) {
        await api.put(`/activos/${editId}`, payload);
        toast.success('Activo actualizado correctamente');
      } else {
        await api.post('/activos', payload);
        toast.success('Activo registrado correctamente');
      }
      setModal(false); cargar();
    } catch (err) { toast.error(err.response?.data?.mensaje || 'Error al guardar'); }
  };

  const pedirConfirmacion = (activo) => {
    setConfirm({ open: true, id: activo.id_activo, nombre: activo.nombre, sku: activo.sku || '', categoria: activo.categoria || '' });
  };

  const confirmarEliminar = async () => {
    try {
      await api.delete(`/activos/${confirm.id}`);
      toast.success('Activo eliminado del inventario');
      cargar();
    } catch { toast.error('Error al eliminar el activo'); }
    finally { setConfirm({ open: false, id: null, nombre: '' }); }
  };

  const verQR = async (activo) => {
    setActivoQR(activo);
    const url = await QRCode.toDataURL(activo.codigo_qr, { width: 300, margin: 2, color: { dark: '#1e3a8a', light: '#ffffff' } });
    setQrDataUrl(url);
    setModalQR(true);
  };

  const imprimirQR = () => {
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>QR - ${activoQR.nombre}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;800&display=swap');
        body{font-family:'DM Sans',sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f1f5f9;}
        .card{background:#fff;border-radius:20px;padding:36px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.12);max-width:340px;border-top:5px solid #1e3a8a;}
        .badge{display:inline-block;background:#eff6ff;color:#1e40af;padding:2px 10px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:0.5px;margin-bottom:10px;}
        .titulo{font-size:18px;font-weight:800;color:#0f172a;margin:14px 0 4px;}
        .sku{font-size:11px;color:#1e40af;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;}
        .codigo{font-family:monospace;background:#f8fafc;border:1px solid #e2e8f0;padding:5px 14px;border-radius:8px;font-size:11px;color:#475569;display:inline-block;margin:4px 0;}
        .meta{font-size:11px;color:#64748b;margin:3px 0;}
        .inst{font-size:10px;color:#94a3b8;margin-top:16px;border-top:1px solid #f1f5f9;padding-top:12px;line-height:1.6;}
      </style></head>
      <body><div class="card">
        <div class="badge">SIGIAF · ITT Tehuacán</div>
        <img src="${qrDataUrl}" width="200" style="border-radius:12px;border:2px solid #e2e8f0;"/>
        <div class="titulo">${activoQR.nombre}</div>
        ${activoQR.sku ? `<div class="sku">SKU: ${activoQR.sku}</div>` : ''}
        <div class="codigo">${activoQR.codigo_qr}</div>
        ${activoQR.categoria ? `<div class="meta">📦 ${activoQR.categoria}</div>` : ''}
        ${activoQR.ubicacion ? `<div class="meta">📍 ${activoQR.ubicacion}</div>` : ''}
        ${activoQR.departamento ? `<div class="meta">🏢 ${activoQR.departamento}</div>` : ''}
        <div class="inst">Instituto Tecnológico de Tehuacán<br/>Sistema de Gestión de Activos Físicos · SIGIAF</div>
      </div></body></html>`);
    win.document.close(); win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(30, 58, 138); doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text('SIGIAF — Inventario de Activos', 14, 14);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`Instituto Tecnológico de Tehuacán | ${new Date().toLocaleDateString('es-MX')}`, 14, 24);
    autoTable(doc, {
      startY: 40,
      head: [['SKU', 'Nombre', 'Categoría', 'Tecnológico', 'Depto/Oficina', 'Estado', 'Ubicación']],
      body: activos.map(a => [
        a.sku || '—', a.nombre, a.categoria || '',
        a.tecnologico || '—',
        [a.departamento, a.oficina].filter(Boolean).join(' / ') || '—',
        a.estado, a.ubicacion || '—',
      ]),
      headStyles: { fillColor: [30, 58, 138], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5 },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      styles: { cellPadding: 3.5 },
    });
    doc.setFontSize(8); doc.setTextColor(150);
    doc.text(`Total: ${activos.length} activos | ${new Date().toLocaleString('es-MX')}`, 14, doc.lastAutoTable.finalY + 10);
    doc.save(`inventario-activos-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF generado');
  };

  const exportarExcel = () => {
    const datos = activos.map(a => ({
      'SKU': a.sku || '', 'Código QR': a.codigo_qr, 'Nombre': a.nombre,
      'Categoría': a.categoria || '', 'Estado': a.estado,
      'Tecnológico': a.tecnologico || '', 'Departamento': a.departamento || '',
      'Oficina': a.oficina || '', 'Ubicación': a.ubicacion || '',
      'Marca': a.marca || '', 'Modelo': a.modelo || '', 'N° Serie': a.numero_serie || '',
      'Descripción': a.descripcion || '', 'Fecha Registro': a.fecha_registro || '',
    }));
    const ws = XLSX.utils.json_to_sheet(datos);
    ws['!cols'] = [14, 22, 26, 16, 14, 18, 18, 16, 18, 14, 14, 18, 30, 14].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Activos');
    XLSX.writeFile(wb, `inventario-activos-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel generado');
  };

  const exportarXML = () => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<inventario fecha="${new Date().toISOString()}" institucion="ITT Tehuacan">\n`;
    activos.forEach(a => {
      xml += `  <activo id="${a.id_activo}">\n`;
      ['sku','codigo_qr','nombre','categoria','estado','tecnologico','departamento','oficina','ubicacion','marca','modelo','numero_serie','descripcion','fecha_registro']
        .forEach(k => { xml += `    <${k}>${a[k] || ''}</${k}>\n`; });
      xml += `  </activo>\n`;
    });
    xml += '</inventario>';
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `inventario-activos-${new Date().toISOString().split('T')[0]}.xml`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('XML exportado');
  };

  // ---- IMPORTACIÓN ----
  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportFile(file.name); setImportErrors([]);
    const ext = file.name.split('.').pop().toLowerCase();
    const reader = new FileReader();
    if (ext === 'xlsx' || ext === 'xls') {
      reader.onload = (ev) => {
        const wb   = XLSX.read(ev.target.result, { type: 'binary' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws);
        const errs = [];
        const parsed = rows.map((r, i) => {
          const nombre = r['Nombre'] || r['nombre'] || '';
          if (!nombre) errs.push(`Fila ${i + 2}: sin nombre`);
          return {
            nombre, descripcion: r['Descripción'] || r['descripcion'] || '',
            marca: r['Marca'] || r['marca'] || '', modelo: r['Modelo'] || r['modelo'] || '',
            numero_serie: r['N° Serie'] || r['numero_serie'] || '',
            estado: r['Estado'] || r['estado'] || 'Disponible',
            ubicacion: r['Ubicación'] || r['ubicacion'] || '',
            sku: r['SKU'] || r['sku'] || '',
            codigo_qr: r['Código QR'] || r['codigo_qr'] || '',
            tecnologico: r['Tecnológico'] || r['tecnologico'] || '',
            departamento: r['Departamento'] || r['departamento'] || '',
            oficina: r['Oficina'] || r['oficina'] || '',
            _catNombre: r['Categoría'] || r['categoria'] || '',
          };
        });
        setImportData(parsed); setImportErrors(errs);
      };
      reader.readAsBinaryString(file);
    } else if (ext === 'xml') {
      reader.onload = (ev) => {
        try {
          const parser = new DOMParser();
          const doc2 = parser.parseFromString(ev.target.result, 'text/xml');
          const nodes = doc2.querySelectorAll('activo');
          const parsed = Array.from(nodes).map(n => ({
            nombre: n.querySelector('nombre')?.textContent || '',
            descripcion: n.querySelector('descripcion')?.textContent || '',
            marca: n.querySelector('marca')?.textContent || '',
            modelo: n.querySelector('modelo')?.textContent || '',
            numero_serie: n.querySelector('numero_serie')?.textContent || '',
            estado: n.querySelector('estado')?.textContent || 'Disponible',
            ubicacion: n.querySelector('ubicacion')?.textContent || '',
            sku: n.querySelector('sku')?.textContent || '',
            codigo_qr: n.querySelector('codigo_qr')?.textContent || '',
            tecnologico: n.querySelector('tecnologico')?.textContent || '',
            departamento: n.querySelector('departamento')?.textContent || '',
            oficina: n.querySelector('oficina')?.textContent || '',
            _catNombre: n.querySelector('categoria')?.textContent || '',
          }));
          setImportData(parsed); setImportErrors([]);
        } catch { toast.error('Error al leer el XML'); }
      };
      reader.readAsText(file);
    } else { toast.error('Solo se aceptan .xlsx, .xls o .xml'); }
  };

  const ejecutarImportacion = async () => {
    if (importData.length === 0) return toast.error('No hay datos para importar');
    setImportLoading(true);
    try {
      const payload = importData.map(item => ({
        ...item,
        id_categoria: categorias.find(c => c.nombre.toLowerCase() === (item._catNombre || '').toLowerCase())?.id_categoria || categorias[0]?.id_categoria,
      }));
      const res = await api.post('/activos/importar', { activos: payload });
      toast.success(`Importación completada: ${res.data.insertados} registros agregados, ${res.data.omitidos} omitidos`);
      setModalImport(false); setImportData([]); setImportFile(null); cargar();
    } catch (err) { toast.error(err.response?.data?.mensaje || 'Error en importación'); }
    finally { setImportLoading(false); }
  };

  const descargarPlantilla = () => {
    const ws = XLSX.utils.json_to_sheet([{
      'Nombre': 'Laptop HP ProBook', 'Categoría': 'Cómputo', 'Estado': 'Disponible',
      'Tecnológico': 'ITT Tehuacán', 'Departamento': 'Sistemas', 'Oficina': 'Sala A-1',
      'Ubicación': 'Edificio A', 'Marca': 'HP', 'Modelo': 'ProBook 450 G9',
      'N° Serie': 'SN-12345', 'SKU': '', 'Código QR': '', 'Descripción': 'Uso administrativo',
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Activos');
    XLSX.writeFile(wb, 'plantilla-importacion-sigiaf.xlsx');
    toast.success('Plantilla descargada');
  };

  const filtrados = activos.filter(a =>
    !busqueda || [a.nombre, a.categoria, a.codigo_qr, a.ubicacion, a.sku, a.departamento, a.tecnologico]
      .some(v => v?.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .act-row:hover{background:#f8fafc!important;}
        .btn-icon:hover{opacity:.85;transform:translateY(-1px);}
        .btn-icon{transition:all .15s;}
        .card-stat{transition:transform .15s,box-shadow .15s;}
        .card-stat:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.1)!important;}
        .import-row:nth-child(even){background:#f8fafc;}
        .drop-zone{border:2px dashed #cbd5e1;border-radius:14px;padding:40px 20px;text-align:center;cursor:pointer;transition:all .2s;}
        .drop-zone:hover{border-color:#1e40af;background:#eff6ff;}
        .form-input:focus{border-color:#1e40af!important;box-shadow:0 0 0 3px rgba(30,64,175,0.1);}
        .section-label{font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin:4px 0 10px;padding-bottom:6px;border-bottom:1px solid #f1f5f9;}
      `}</style>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px', flexWrap:'wrap', gap:'14px' }}>
        <div>
          <h1 style={{ fontSize:'28px', fontWeight:'800', color:'#0f172a', margin:0, letterSpacing:'-0.5px' }}>Activos</h1>
          <p style={{ color:'#64748b', marginTop:'5px', fontSize:'14px', fontWeight:'500' }}>
            {activos.length} activos · {activos.filter(a=>a.estado==='Disponible').length} disponibles
          </p>
        </div>
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
          <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="🔍  Buscar nombre, SKU, QR, depto..." style={inputSearch}/>
          <button onClick={exportarPDF} className="btn-icon" style={btnOutline}>📄 PDF</button>
          <button onClick={exportarExcel} className="btn-icon" style={{...btnOutline,color:'#15803d',borderColor:'#bbf7d0'}}>📊 Excel</button>
          <button onClick={exportarXML} className="btn-icon" style={{...btnOutline,color:'#7c3aed',borderColor:'#ddd6fe'}}>🗂️ XML</button>
          <button onClick={()=>{setModalImport(true);setImportData([]);setImportFile(null);setImportErrors([]);}} className="btn-icon" style={btnSecondary}>⬆️ Importar</button>
          <button onClick={()=>abrirModal()} style={btnPrimary}>+ Nuevo activo</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))', gap:'14px', marginBottom:'24px' }}>
        {[
          { label:'Total activos', value:activos.length, color:'#1e3a8a', bg:'#eff6ff', icon:'📦' },
          { label:'Disponibles', value:activos.filter(a=>a.estado==='Disponible').length, color:'#15803d', bg:'#f0fdf4', icon:'✅' },
          { label:'No disponibles', value:activos.filter(a=>a.estado==='No disponible').length, color:'#b91c1c', bg:'#fef2f2', icon:'🔴' },
          { label:'Mantenimiento', value:activos.filter(a=>a.estado==='Mantenimiento').length, color:'#b45309', bg:'#fffbeb', icon:'🔧' },
        ].map(s=>(
          <div key={s.label} className="card-stat" style={{ background:s.bg, borderRadius:'14px', padding:'18px 20px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize:'22px', marginBottom:'6px' }}>{s.icon}</div>
            <div style={{ fontSize:'28px', fontWeight:'800', color:s.color, lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:'12px', color:s.color, fontWeight:'600', marginTop:'4px', opacity:.8 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'60px', color:'#94a3b8' }}>
          <div style={{ fontSize:'32px', marginBottom:'12px' }}>⏳</div>
          <p style={{ fontWeight:'600' }}>Cargando activos...</p>
        </div>
      ) : (
        <div style={{ background:'#fff', borderRadius:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', overflow:'hidden', border:'1px solid #e2e8f0' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13.5px' }}>
            <thead>
              <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                {['SKU','Código QR','Nombre','Categoría','Depto / Oficina','Estado','Ubicación','Acciones'].map(h=>(
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(a=>{
                const clr = estadoColor[a.estado]||{bg:'#f1f5f9',text:'#475569',dot:'#94a3b8'};
                return (
                  <tr key={a.id_activo} className="act-row" style={{ borderTop:'1px solid #f1f5f9' }}>
                    <td style={tdStyle}>
                      <span style={{ fontFamily:'monospace', background:'#eff6ff', color:'#1e40af', padding:'3px 8px', borderRadius:'6px', fontSize:'11.5px', fontWeight:'700', letterSpacing:'0.5px' }}>
                        {a.sku||<span style={{color:'#94a3b8',fontStyle:'italic',fontWeight:'400'}}>—</span>}
                      </span>
                    </td>
                    <td style={tdStyle}><span style={{ fontFamily:'monospace', background:'#f8fafc', border:'1px solid #e2e8f0', padding:'3px 8px', borderRadius:'6px', fontSize:'11px', color:'#475569' }}>{a.codigo_qr}</span></td>
                    <td style={{ ...tdStyle, fontWeight:'700', color:'#0f172a' }}>{a.nombre}</td>
                    <td style={{ ...tdStyle, color:'#64748b' }}>{a.categoria}</td>
                    <td style={{ ...tdStyle, color:'#64748b', fontSize:'12.5px' }}>
                      {a.departamento && <div style={{ fontWeight:'600', color:'#475569' }}>{a.departamento}</div>}
                      {a.oficina && <div style={{ color:'#94a3b8' }}>{a.oficina}</div>}
                      {!a.departamento && !a.oficina && '—'}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ background:clr.bg, color:clr.text, padding:'4px 12px', borderRadius:'99px', fontSize:'12px', fontWeight:'700', display:'inline-flex', alignItems:'center', gap:'5px' }}>
                        <span style={{ width:6, height:6, borderRadius:'50%', background:clr.dot, display:'inline-block' }}/>{a.estado}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color:'#64748b' }}>{a.ubicacion||'—'}</td>
                    <td style={tdStyle}>
                      <div style={{ display:'flex', gap:'6px' }}>
                        <button className="btn-icon" onClick={()=>verQR(a)} style={btnQR}>QR</button>
                        <button className="btn-icon" onClick={()=>abrirModal(a)} style={btnEdit}>Editar</button>
                        <button className="btn-icon" onClick={()=>pedirConfirmacion(a)} style={btnDelete}>✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtrados.length===0&&(
                <tr><td colSpan="8" style={{ padding:'60px', textAlign:'center', color:'#94a3b8' }}>
                  <div style={{ fontSize:'36px', marginBottom:'12px' }}>📭</div>
                  <div style={{ fontWeight:'600', fontSize:'15px' }}>No se encontraron activos</div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      <ConfirmModal
        open={confirm.open}
        tipo="danger"
        titulo="¿Eliminar activo?"
        mensaje={`Estás a punto de eliminar permanentemente el activo "${confirm.nombre}" del inventario. Esta acción no se puede deshacer.`}
        detalle={`${confirm.sku ? `SKU: ${confirm.sku}  ·  ` : ''}Categoría: ${confirm.categoria}`}
        onConfirm={confirmarEliminar}
        onCancel={()=>setConfirm({open:false,id:null,nombre:''})}
      />

      {/* Modal QR */}
      {modalQR&&activoQR&&(
        <div style={overlay}>
          <div style={{ ...modalCard, maxWidth:'380px', textAlign:'center' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'22px' }}>
              <h2 style={{ margin:0, fontSize:'19px', fontWeight:'800', color:'#0f172a' }}>Código QR</h2>
              <button onClick={()=>setModalQR(false)} style={btnClose}>✕</button>
            </div>
            <img src={qrDataUrl} alt="QR" style={{ width:'220px', height:'220px', borderRadius:'14px', border:'2px solid #e2e8f0' }}/>
            <div style={{ marginTop:'18px' }}>
              <div style={{ fontWeight:'800', fontSize:'17px', color:'#0f172a' }}>{activoQR.nombre}</div>
              {activoQR.sku&&<div style={{ fontSize:'11px', color:'#1e40af', fontWeight:'700', letterSpacing:'1px', marginTop:'6px', textTransform:'uppercase' }}>SKU: {activoQR.sku}</div>}
              <div style={{ fontFamily:'monospace', background:'#f8fafc', border:'1px solid #e2e8f0', padding:'5px 14px', borderRadius:'8px', fontSize:'12px', display:'inline-block', marginTop:'8px', color:'#475569' }}>{activoQR.codigo_qr}</div>
              {activoQR.departamento&&<div style={{ fontSize:'12px', color:'#64748b', marginTop:'5px' }}>🏢 {activoQR.departamento}</div>}
              <div style={{ fontSize:'12px', color:'#94a3b8', marginTop:'4px' }}>{activoQR.ubicacion||''}</div>
            </div>
            <div style={{ display:'flex', gap:'10px', justifyContent:'center', marginTop:'24px' }}>
              <button onClick={()=>setModalQR(false)} style={btnCancel}>Cerrar</button>
              <button onClick={imprimirQR} style={btnPrimary}>🖨️ Imprimir</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nuevo/editar activo */}
      {modal&&(
        <div style={overlay}>
          <div style={{ ...modalCard, maxWidth:'740px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'26px' }}>
              <div>
                <h2 style={{ margin:0, fontSize:'20px', fontWeight:'800', color:'#0f172a' }}>{editId?'Editar activo':'Nuevo activo'}</h2>
                <p style={{ margin:'4px 0 0', color:'#94a3b8', fontSize:'13px' }}>{editId?'Modifica los datos del activo':'Completa la información del nuevo activo'}</p>
              </div>
              <button onClick={()=>setModal(false)} style={btnClose}>✕</button>
            </div>
            <form onSubmit={guardar} style={{ display:'flex', flexDirection:'column', gap:'0' }}>

              {/* Sección identificación */}
              <div className="section-label">Identificación</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'18px' }}>
                <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                  <label style={labelStyle}>SKU / N° Inventario</label>
                  <div style={{ display:'flex', gap:'8px' }}>
                    <input className="form-input" value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})} placeholder="Auto-generado al guardar" style={{ ...formInput, flex:1, fontFamily:'monospace' }}/>
                    <button type="button" title="Generar SKU según categoría, tecnológico y departamento" onClick={()=>setForm({...form,sku:buildSKU(form,categorias)})} style={{ ...btnOutline, padding:'10px 12px' }}>↺</button>
                  </div>
                  <span style={{ fontSize:'11px', color:'#94a3b8' }}>Se genera con categoría + tecnológico + depto</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                  <label style={labelStyle}>Código QR *</label>
                  <div style={{ display:'flex', gap:'8px' }}>
                    <input className="form-input" value={form.codigo_qr} onChange={e=>setForm({...form,codigo_qr:e.target.value})} readOnly={!!editId} required style={{ ...formInput, flex:1, fontFamily:'monospace', background:editId?'#f8fafc':'#fff' }}/>
                    {!editId&&<button type="button" onClick={()=>setForm({...form,codigo_qr:generarCodigoQR()})} style={{ ...btnOutline, padding:'10px 12px' }}>↺</button>}
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                  <label style={labelStyle}>Nombre *</label>
                  <input className="form-input" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} required style={formInput} placeholder="Ej: Laptop HP 450 G9"/>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                  <label style={labelStyle}>Categoría *</label>
                  <select className="form-input" value={form.id_categoria} onChange={e=>setForm({...form,id_categoria:e.target.value})} required style={formInput}>
                    <option value="">Seleccionar...</option>
                    {categorias.map(c=><option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>

              {/* Sección ubicación institucional */}
              <div className="section-label">Ubicación institucional</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'14px', marginBottom:'18px' }}>
                <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                  <label style={labelStyle}>Tecnológico / Plantel</label>
                  <input className="form-input" value={form.tecnologico} onChange={e=>setForm({...form,tecnologico:e.target.value})} style={formInput} placeholder="Ej: ITT Tehuacán"/>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                  <label style={labelStyle}>Departamento</label>
                  <input className="form-input" value={form.departamento} onChange={e=>setForm({...form,departamento:e.target.value})} style={formInput} placeholder="Ej: Sistemas Computacionales"/>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                  <label style={labelStyle}>Oficina / Aula</label>
                  <input className="form-input" value={form.oficina} onChange={e=>setForm({...form,oficina:e.target.value})} style={formInput} placeholder="Ej: Sala Cómputo A-1"/>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                  <label style={labelStyle}>Ubicación física</label>
                  <input className="form-input" value={form.ubicacion} onChange={e=>setForm({...form,ubicacion:e.target.value})} style={formInput} placeholder="Ej: Edificio A, Piso 2"/>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                  <label style={labelStyle}>Estado *</label>
                  <select className="form-input" value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})} style={formInput}>
                    <option>Disponible</option><option>No disponible</option><option>Mantenimiento</option>
                  </select>
                </div>
              </div>

              {/* Sección características */}
              <div className="section-label">Características del equipo</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'14px', marginBottom:'18px' }}>
                {[['marca','Marca','Ej: HP, Dell'],['modelo','Modelo','Ej: ProBook 450'],['numero_serie','N° de serie','']].map(([k,l,ph])=>(
                  <div key={k} style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                    <label style={labelStyle}>{l}</label>
                    <input className="form-input" value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} style={formInput} placeholder={ph}/>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginBottom:'18px' }}>
                <label style={labelStyle}>Descripción</label>
                <textarea className="form-input" value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})} rows={2} style={{ ...formInput, resize:'vertical' }} placeholder="Descripción adicional..."/>
              </div>

              <div style={{ display:'flex', gap:'12px', justifyContent:'flex-end', paddingTop:'12px', borderTop:'1px solid #f1f5f9' }}>
                <button type="button" onClick={()=>setModal(false)} style={btnCancel}>Cancelar</button>
                <button type="submit" style={btnPrimary}>{editId?'✓ Actualizar':'+ Registrar activo'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Importar */}
      {modalImport&&(
        <div style={overlay}>
          <div style={{ ...modalCard, maxWidth:'720px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
              <div>
                <h2 style={{ margin:0, fontSize:'20px', fontWeight:'800', color:'#0f172a' }}>Importar activos</h2>
                <p style={{ margin:'4px 0 0', color:'#94a3b8', fontSize:'13px' }}>Desde Excel (.xlsx/.xls) o XML</p>
              </div>
              <button onClick={()=>setModalImport(false)} style={btnClose}>✕</button>
            </div>
            <div style={{ background:'#eff6ff', borderRadius:'12px', padding:'14px 18px', marginBottom:'18px', marginTop:'16px', fontSize:'13px', color:'#1e40af', lineHeight:1.6 }}>
              <strong>Columnas:</strong> Nombre*, Categoría, Estado, Tecnológico, Departamento, Oficina, Ubicación, Marca, Modelo, N° Serie, SKU, Código QR, Descripción
              <br/><span style={{ color:'#64748b' }}>* Requerido · SKU y QR se generan automáticamente si están vacíos</span>
            </div>
            <div className="drop-zone" onClick={()=>fileRef.current.click()} style={{ marginBottom:'14px' }}>
              <div style={{ fontSize:'36px', marginBottom:'10px' }}>📁</div>
              <div style={{ fontWeight:'700', color:'#1e3a8a', fontSize:'15px' }}>{importFile||'Seleccionar o arrastrar archivo'}</div>
              <div style={{ color:'#94a3b8', fontSize:'12px', marginTop:'4px' }}>Excel (.xlsx, .xls) · XML</div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.xml" style={{ display:'none' }} onChange={handleImportFile}/>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'14px' }}>
              <button onClick={descargarPlantilla} style={{ ...btnOutline, fontSize:'12px', padding:'7px 14px' }}>⬇️ Descargar plantilla Excel</button>
            </div>
            {importErrors.length>0&&(
              <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'10px', padding:'12px 16px', marginBottom:'14px' }}>
                <div style={{ fontWeight:'700', color:'#b91c1c', fontSize:'13px', marginBottom:'6px' }}>⚠️ Advertencias ({importErrors.length})</div>
                {importErrors.slice(0,5).map((e,i)=><div key={i} style={{ color:'#ef4444', fontSize:'12px' }}>{e}</div>)}
              </div>
            )}
            {importData.length>0&&(
              <div style={{ marginBottom:'18px' }}>
                <div style={{ fontWeight:'700', color:'#0f172a', fontSize:'14px', marginBottom:'10px' }}>Vista previa · {importData.length} registros</div>
                <div style={{ maxHeight:'200px', overflowY:'auto', border:'1px solid #e2e8f0', borderRadius:'10px', overflow:'hidden' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
                    <thead>
                      <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                        {['Nombre','Categoría','Tecnológico','Depto','Estado','SKU'].map(h=>(
                          <th key={h} style={{ padding:'8px 12px', textAlign:'left', color:'#64748b', fontWeight:'700', fontSize:'11px', textTransform:'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importData.slice(0,50).map((r,i)=>(
                        <tr key={i} className="import-row" style={{ borderTop:'1px solid #f1f5f9' }}>
                          <td style={{ padding:'7px 12px', fontWeight:'600', color:'#0f172a' }}>{r.nombre||<span style={{color:'#ef4444'}}>—sin nombre—</span>}</td>
                          <td style={{ padding:'7px 12px', color:'#64748b' }}>{r._catNombre||'—'}</td>
                          <td style={{ padding:'7px 12px', color:'#64748b' }}>{r.tecnologico||'—'}</td>
                          <td style={{ padding:'7px 12px', color:'#64748b' }}>{r.departamento||'—'}</td>
                          <td style={{ padding:'7px 12px' }}>
                            <span style={{ background:estadoColor[r.estado]?.bg||'#f1f5f9', color:estadoColor[r.estado]?.text||'#475569', padding:'2px 8px', borderRadius:'99px', fontSize:'11px', fontWeight:'700' }}>
                              {r.estado||'Disponible'}
                            </span>
                          </td>
                          <td style={{ padding:'7px 12px', fontFamily:'monospace', color:'#1e40af', fontSize:'11px' }}>{r.sku||<span style={{color:'#94a3b8',fontStyle:'italic'}}>auto</span>}</td>
                        </tr>
                      ))}
                      {importData.length>50&&<tr><td colSpan="6" style={{ padding:'10px', textAlign:'center', color:'#94a3b8', fontSize:'12px' }}>...y {importData.length-50} registros más</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div style={{ display:'flex', gap:'12px', justifyContent:'flex-end', borderTop:'1px solid #f1f5f9', paddingTop:'18px' }}>
              <button onClick={()=>setModalImport(false)} style={btnCancel}>Cancelar</button>
              <button onClick={ejecutarImportacion} disabled={importData.length===0||importLoading} style={{ ...btnPrimary, opacity:importData.length===0?.5:1 }}>
                {importLoading?'⏳ Importando...':`⬆️ Importar ${importData.length} registros`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle   = { padding:'12px 16px', textAlign:'left', color:'#64748b', fontWeight:'700', fontSize:'11.5px', textTransform:'uppercase', letterSpacing:'0.6px' };
const tdStyle   = { padding:'13px 16px' };
const inputSearch = { padding:'10px 16px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'13.5px', outline:'none', fontFamily:'inherit', width:'280px', background:'#fff', color:'#0f172a', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' };
const btnPrimary  = { padding:'10px 20px', background:'linear-gradient(135deg,#1e3a8a,#1e40af)', color:'#fff', border:'none', borderRadius:'10px', cursor:'pointer', fontWeight:'700', fontSize:'13.5px', fontFamily:'inherit', boxShadow:'0 2px 8px rgba(30,58,138,0.3)' };
const btnSecondary= { padding:'10px 16px', background:'#fff', color:'#1e3a8a', border:'1.5px solid #bfdbfe', borderRadius:'10px', cursor:'pointer', fontWeight:'600', fontSize:'13px', fontFamily:'inherit' };
const btnOutline  = { padding:'10px 16px', background:'#f8fafc', color:'#475569', border:'1.5px solid #e2e8f0', borderRadius:'10px', cursor:'pointer', fontWeight:'600', fontSize:'13px', fontFamily:'inherit' };
const btnQR       = { padding:'6px 12px', background:'#eff6ff', color:'#1e40af', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'12px', fontWeight:'800' };
const btnEdit     = { padding:'6px 14px', background:'#f0fdf4', color:'#15803d', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'12.5px', fontWeight:'700' };
const btnDelete   = { padding:'6px 12px', background:'#fef2f2', color:'#dc2626', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:'700' };
const btnCancel   = { padding:'10px 20px', background:'#f8fafc', color:'#475569', border:'1.5px solid #e2e8f0', borderRadius:'10px', cursor:'pointer', fontWeight:'600', fontSize:'13.5px', fontFamily:'inherit' };
const btnClose    = { background:'#f1f5f9', border:'none', borderRadius:'8px', width:'32px', height:'32px', cursor:'pointer', fontSize:'14px', color:'#64748b' };
const overlay     = { position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:'20px' };
const modalCard   = { background:'#fff', borderRadius:'20px', padding:'32px', width:'100%', maxWidth:'700px', maxHeight:'92vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.2)' };
const labelStyle  = { fontSize:'12.5px', fontWeight:'700', color:'#374151' };
const formInput   = { padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'14px', outline:'none', fontFamily:'inherit', width:'100%', boxSizing:'border-box', color:'#0f172a' };
