import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Años de vida útil por categoría (estándar NIC 16)
const VIDA_UTIL = {
  'Computo':    3,
  'Mobiliario': 10,
  'Redes':      5,
  'default':    5,
};

function calcularDepreciacion(activo, vidaUtil) {
  const valorOriginal = parseFloat(activo.valor_original || 0);
  const valorResidual = parseFloat(activo.valor_residual || 0);
  const fechaAdq = activo.fecha_adquisicion || activo.fecha_registro;
  if (!valorOriginal || !fechaAdq) return null;

  const añosTranscurridos = (new Date() - new Date(fechaAdq)) / (1000 * 60 * 60 * 24 * 365.25);
  const depAnual = (valorOriginal - valorResidual) / vidaUtil;
  const depAcumulada = Math.min(depAnual * añosTranscurridos, valorOriginal - valorResidual);
  const valorActual = Math.max(valorOriginal - depAcumulada, valorResidual);
  const pctDepreciado = valorOriginal > 0 ? (depAcumulada / valorOriginal) * 100 : 0;
  const añosRestantes = Math.max(vidaUtil - añosTranscurridos, 0);

  return { valorOriginal, valorResidual, depAnual, depAcumulada, valorActual, pctDepreciado, añosTranscurridos, añosRestantes, vidaUtil };
}

function BarraDepreciacion({ pct }) {
  const color = pct < 40 ? '#16a34a' : pct < 75 ? '#f0a500' : '#dc2626';
  return (
    <div style={{ background: '#f3f4f6', borderRadius: '6px', height: '8px', overflow: 'hidden', width: '100%' }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: '6px', transition: 'width 0.4s ease' }} />
    </div>
  );
}

export default function Depreciacion() {
  const [activos, setActivos]         = useState([]);
  const [categorias, setCategorias]   = useState([]);
  const [modalId, setModalId]         = useState(null);
  const [form, setForm]               = useState({ valor_original: '', valor_residual: '', fecha_adquisicion: '', vida_util_custom: '' });
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [loading, setLoading]         = useState(true);

  const cargar = async () => {
    try {
      const [a, c] = await Promise.all([api.get('/activos'), api.get('/categorias')]);
      setActivos(a.data);
      setCategorias(c.data);
    } catch { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const abrirModal = (a) => {
    setForm({
      valor_original:    a.valor_original    || '',
      valor_residual:    a.valor_residual    || '0',
      fecha_adquisicion: a.fecha_adquisicion ? a.fecha_adquisicion.split('T')[0] : (a.fecha_registro ? a.fecha_registro.split('T')[0] : ''),
      vida_util_custom:  a.vida_util_custom  || '',
    });
    setModalId(a.id_activo);
  };

  const guardar = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/activos/${modalId}`, {
        valor_original:    parseFloat(form.valor_original) || null,
        valor_residual:    parseFloat(form.valor_residual) || 0,
        fecha_adquisicion: form.fecha_adquisicion || null,
        vida_util_custom:  parseInt(form.vida_util_custom) || null,
      });
      toast.success('Valores actualizados');
      setModalId(null);
      cargar();
    } catch (err) { toast.error(err.response?.data?.mensaje || 'Error al guardar'); }
  };

  const activosFiltrados = activos.filter(a => filtroCategoria ? a.id_categoria === parseInt(filtroCategoria) : true);

  const activosConDep = activosFiltrados.map(a => {
    const catNombre = categorias.find(c => c.id_categoria === a.id_categoria)?.nombre || 'default';
    const vidaUtil = a.vida_util_custom || VIDA_UTIL[catNombre] || VIDA_UTIL.default;
    return { ...a, dep: calcularDepreciacion(a, vidaUtil), vidaUtil };
  });

  const conValor     = activosConDep.filter(a => a.dep);
  const sinValor     = activosConDep.filter(a => !a.dep);
  const totalOriginal = conValor.reduce((s, a) => s + a.dep.valorOriginal, 0);
  const totalActual   = conValor.reduce((s, a) => s + a.dep.valorActual,   0);
  const totalDep      = conValor.reduce((s, a) => s + a.dep.depAcumulada,  0);

  const exportarPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFillColor(26, 58, 107);
    doc.rect(0, 0, 297, 30, 'F');
    doc.setTextColor(255,255,255); doc.setFontSize(16); doc.setFont('helvetica','bold');
    doc.text('SIGIAF — Reporte de Depreciación de Activos', 14, 14);
    doc.setFontSize(9); doc.setFont('helvetica','normal');
    doc.text(`Instituto Tecnológico de Tehuacán | ${new Date().toLocaleDateString('es-MX')} | Método: Línea Recta (NIC 16)`, 14, 23);

    // Resumen
    doc.setTextColor(26,58,107); doc.setFontSize(11); doc.setFont('helvetica','bold');
    doc.text('Resumen patrimonial', 14, 42);
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(80,80,80);
    doc.text(`Activos con valor registrado: ${conValor.length} de ${activosConDep.length}`, 14, 50);
    doc.text(`Valor original total: $${totalOriginal.toLocaleString('es-MX', {minimumFractionDigits:2})}`, 14, 57);
    doc.text(`Depreciación acumulada: $${totalDep.toLocaleString('es-MX', {minimumFractionDigits:2})}`, 14, 64);
    doc.text(`Valor actual del patrimonio: $${totalActual.toLocaleString('es-MX', {minimumFractionDigits:2})}`, 14, 71);

    autoTable(doc, {
      startY: 78,
      head: [['Activo','Categoría','Fecha adq.','Vida útil','Valor original','Dep. anual','Dep. acumulada','Valor actual','% Dep.','Años rest.']],
      body: conValor.map(a => [
        a.nombre, a.categoria || '',
        a.fecha_adquisicion ? new Date(a.fecha_adquisicion).toLocaleDateString('es-MX') : '—',
        `${a.vidaUtil} años`,
        `$${a.dep.valorOriginal.toLocaleString('es-MX', {minimumFractionDigits:2})}`,
        `$${a.dep.depAnual.toLocaleString('es-MX', {minimumFractionDigits:2})}`,
        `$${a.dep.depAcumulada.toLocaleString('es-MX', {minimumFractionDigits:2})}`,
        `$${a.dep.valorActual.toLocaleString('es-MX', {minimumFractionDigits:2})}`,
        `${a.dep.pctDepreciado.toFixed(1)}%`,
        `${a.dep.añosRestantes.toFixed(1)}`,
      ]),
      headStyles: { fillColor: [26,58,107], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [240,244,250] },
      styles: { cellPadding: 3 },
    });

    doc.setFontSize(7); doc.setTextColor(150);
    doc.text(`Método: Línea Recta | Basado en NIC 16 | SIGIAF — ${new Date().toLocaleString('es-MX')}`, 14, doc.lastAutoTable.finalY + 8);
    doc.save(`depreciacion-activos-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Reporte de depreciación exportado');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1a3a6b', margin: 0 }}>Depreciación de Activos</h1>
          <p style={{ color: '#6b7280', marginTop: '4px', fontSize: '14px' }}>Control patrimonial — Método línea recta (NIC 16)</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} style={{ padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none' }}>
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
          </select>
          <button onClick={exportarPDF} disabled={conValor.length === 0} style={{ ...btnSecondary, opacity: conValor.length === 0 ? 0.5 : 1 }}>📄 Exportar PDF</button>
        </div>
      </div>

      {/* KPIs patrimonio */}
      {conValor.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Valor original total',     value: `$${totalOriginal.toLocaleString('es-MX', {minimumFractionDigits:2})}`, color: '#1a3a6b', icon: '💰' },
            { label: 'Depreciación acumulada',   value: `$${totalDep.toLocaleString('es-MX', {minimumFractionDigits:2})}`,     color: '#dc2626', icon: '📉' },
            { label: 'Valor actual del patrimonio', value: `$${totalActual.toLocaleString('es-MX', {minimumFractionDigits:2})}`, color: '#16a34a', icon: '📊' },
            { label: 'Activos con valor',        value: `${conValor.length} / ${activosConDep.length}`,                        color: '#f0a500', icon: '📦' },
          ].map(k => (
            <div key={k.label} style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderLeft: `4px solid ${k.color}` }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>{k.icon}</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: k.color }}>{k.value}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {sinValor.length > 0 && (
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '12px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <span style={{ color: '#92400e', fontSize: '14px', fontWeight: '600' }}>
            {sinValor.length} activo(s) sin valor registrado. Haz clic en "Editar valor" para configurarlos.
          </span>
        </div>
      )}

      {/* Tabla */}
      {loading ? <p style={{ color: '#9ca3af' }}>Cargando...</p> : (
        <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Activo', 'Categoría', 'Vida útil', 'Valor original', 'Dep. anual', 'Valor actual', 'Depreciación', 'Años rest.', 'Acción'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activosConDep.map(a => (
                <tr key={a.id_activo} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '14px 16px', fontWeight: '600', color: '#1a3a6b' }}>
                    <div>{a.nombre}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#9ca3af' }}>{a.codigo_qr}</div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#6b7280' }}>{a.categoria}</td>
                  <td style={{ padding: '14px 16px', color: '#374151' }}>{a.vidaUtil} años</td>
                  {a.dep ? (<>
                    <td style={{ padding: '14px 16px', fontWeight: '600' }}>${a.dep.valorOriginal.toLocaleString('es-MX', {minimumFractionDigits:2})}</td>
                    <td style={{ padding: '14px 16px', color: '#dc2626' }}>-${a.dep.depAnual.toLocaleString('es-MX', {minimumFractionDigits:2})}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#16a34a' }}>${a.dep.valorActual.toLocaleString('es-MX', {minimumFractionDigits:2})}</td>
                    <td style={{ padding: '14px 16px', minWidth: '140px' }}>
                      <BarraDepreciacion pct={a.dep.pctDepreciado} />
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>{a.dep.pctDepreciado.toFixed(1)}% depreciado</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: a.dep.añosRestantes < 1 ? '#dc2626' : '#374151', fontWeight: a.dep.añosRestantes < 1 ? '700' : '400' }}>
                      {a.dep.añosRestantes < 0.1 ? 'Completamente dep.' : `${a.dep.añosRestantes.toFixed(1)} años`}
                    </td>
                  </>) : (<>
                    <td colSpan="5" style={{ padding: '14px 16px', color: '#9ca3af', fontStyle: 'italic' }}>Sin valor registrado — configura para calcular depreciación</td>
                  </>)}
                  <td style={{ padding: '14px 16px' }}>
                    <button onClick={() => abrirModal(a)} style={btnEdit}>Editar valor</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal editar valor */}
      {modalId && (() => {
        const activo = activos.find(a => a.id_activo === modalId);
        return (
          <div style={overlay}>
            <div style={modalCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>Valor de activo</h2>
                <button onClick={() => setModalId(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' }}>
                <div style={{ fontWeight: '700', color: '#1a3a6b' }}>{activo?.nombre}</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{activo?.codigo_qr} — {activo?.categoria}</div>
              </div>
              <form onSubmit={guardar} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={labelStyle}>Valor original ($) *</label>
                  <input type="number" step="0.01" value={form.valor_original} onChange={e => setForm({...form, valor_original: e.target.value})} required placeholder="ej. 15000.00" style={formInput} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={labelStyle}>Valor residual ($)</label>
                  <input type="number" step="0.01" value={form.valor_residual} onChange={e => setForm({...form, valor_residual: e.target.value})} placeholder="ej. 500.00" style={formInput} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={labelStyle}>Fecha de adquisición</label>
                  <input type="date" value={form.fecha_adquisicion} onChange={e => setForm({...form, fecha_adquisicion: e.target.value})} style={formInput} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={labelStyle}>Vida útil personalizada (años)</label>
                  <input type="number" value={form.vida_util_custom} onChange={e => setForm({...form, vida_util_custom: e.target.value})} placeholder="Dejar vacío para usar default" style={formInput} />
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>Default por categoría: Cómputo 3, Redes 5, Mobiliario 10</span>
                </div>
                <div style={{ gridColumn: '1/-1', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setModalId(null)} style={btnCancel}>Cancelar</button>
                  <button type="submit" style={btnPrimary}>Guardar</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

const thStyle = { padding: '11px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' };
const btnPrimary   = { padding: '10px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', fontFamily: 'inherit' };
const btnSecondary = { padding: '10px 16px', background: '#f0f4fa', color: '#1a3a6b', border: '2px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', fontFamily: 'inherit' };
const btnEdit      = { padding: '6px 14px', background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' };
const btnCancel    = { padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', fontFamily: 'inherit' };
const overlay      = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '20px' };
const modalCard    = { background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '560px' };
const labelStyle   = { fontSize: '13px', fontWeight: '600', color: '#374151' };
const formInput    = { padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' };
