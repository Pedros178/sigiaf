import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ESTADOS = ['Todos', 'Pendiente', 'Verificado', 'Faltante'];

export default function Auditoria() {
  const [activos, setActivos]         = useState([]);
  const [categorias, setCategorias]   = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [filtroEstado, setFiltroEstado]       = useState('Todos');
  const [auditados, setAuditados]     = useState({});   // id -> 'Verificado' | 'Faltante'
  const [busquedaQR, setBusquedaQR]  = useState('');
  const [auditIniciada, setAuditIniciada] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [notas, setNotas]             = useState({});

  useEffect(() => {
    const cargar = async () => {
      try {
        const [a, c] = await Promise.all([api.get('/activos'), api.get('/categorias')]);
        setActivos(a.data);
        setCategorias(c.data);
      } catch { toast.error('Error al cargar activos'); }
      finally { setLoading(false); }
    };
    cargar();
  }, []);

  const ubicaciones = [...new Set(activos.map(a => a.ubicacion).filter(Boolean))].sort();

  const activosFiltrados = activos.filter(a => {
    if (filtroCategoria && a.id_categoria !== parseInt(filtroCategoria)) return false;
    if (filtroUbicacion && a.ubicacion !== filtroUbicacion) return false;
    return true;
  });

  const conEstado = activosFiltrados.map(a => ({
    ...a,
    estadoAudit: auditados[a.id_activo] || 'Pendiente',
  }));

  const visibles = conEstado.filter(a =>
    filtroEstado === 'Todos' ? true : a.estadoAudit === filtroEstado
  );

  const stats = {
    total:      activosFiltrados.length,
    verificado: Object.values(auditados).filter(v => v === 'Verificado').length,
    faltante:   Object.values(auditados).filter(v => v === 'Faltante').length,
    pendiente:  activosFiltrados.length - Object.keys(auditados).filter(id => activosFiltrados.find(a => a.id_activo === parseInt(id))).length,
  };
  const progreso = stats.total > 0 ? Math.round(((stats.verificado + stats.faltante) / stats.total) * 100) : 0;

  const marcar = (id, estado) => {
    setAuditados(prev => ({ ...prev, [id]: estado }));
  };

  const marcarTodos = (estado) => {
    const nuevos = {};
    activosFiltrados.forEach(a => { nuevos[a.id_activo] = estado; });
    setAuditados(prev => ({ ...prev, ...nuevos }));
    toast.success(`${activosFiltrados.length} activos marcados como ${estado}`);
  };

  const iniciarAuditoria = () => {
    if (activosFiltrados.length === 0) {
      toast.error('No hay activos con los filtros seleccionados');
      return;
    }
    setAuditados({});
    setAuditIniciada(true);
    setFechaInicio(new Date());
    toast.success(`Auditoría iniciada — ${activosFiltrados.length} activos a verificar`);
  };

  const buscarQR = (e) => {
    e.preventDefault();
    if (!busquedaQR.trim()) return;
    const activo = activosFiltrados.find(a => a.codigo_qr.toLowerCase() === busquedaQR.trim().toLowerCase());
    if (!activo) {
      toast.error('Código QR no encontrado en esta auditoría');
      return;
    }
    marcar(activo.id_activo, 'Verificado');
    toast.success(`✅ ${activo.nombre} — verificado`);
    setBusquedaQR('');
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    const catNombre = categorias.find(c => c.id_categoria === parseInt(filtroCategoria))?.nombre || 'Todas';

    doc.setFillColor(26, 58, 107);
    doc.rect(0, 0, 210, 36, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text('SIGIAF — Reporte de Auditoría', 14, 14);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`Instituto Tecnológico de Tehuacán`, 14, 23);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}  |  Inicio: ${fechaInicio?.toLocaleTimeString('es-MX')}`, 14, 30);

    // Resumen
    doc.setTextColor(26, 58, 107); doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text('Resumen de auditoría', 14, 46);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(80, 80, 80);
    doc.text(`Categoría: ${catNombre}`, 14, 54);
    doc.text(`Ubicación: ${filtroUbicacion || 'Todas'}`, 14, 61);
    doc.text(`Total auditado: ${stats.total}  |  Verificados: ${stats.verificado}  |  Faltantes: ${stats.faltante}  |  Pendientes: ${stats.pendiente}`, 14, 68);
    doc.text(`Avance: ${progreso}%`, 14, 75);

    autoTable(doc, {
      startY: 82,
      head: [['Código QR', 'Nombre', 'Categoría', 'Ubicación', 'Estado sistema', 'Estado auditoría', 'Notas']],
      body: conEstado.map(a => [
        a.codigo_qr, a.nombre, a.categoria || '', a.ubicacion || '—',
        a.estado, a.estadoAudit, notas[a.id_activo] || '',
      ]),
      headStyles: { fillColor: [26, 58, 107], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [240, 244, 250] },
      styles: { cellPadding: 3 },
      didParseCell: (data) => {
        if (data.column.index === 5) {
          if (data.cell.raw === 'Verificado') data.cell.styles.textColor = [22, 101, 52];
          else if (data.cell.raw === 'Faltante') data.cell.styles.textColor = [153, 27, 27];
          else data.cell.styles.textColor = [146, 64, 14];
        }
      },
    });

    doc.setFontSize(8); doc.setTextColor(150);
    doc.text(`Generado por SIGIAF — ${new Date().toLocaleString('es-MX')}`, 14, doc.lastAutoTable.finalY + 10);
    doc.save(`auditoria-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Reporte de auditoría exportado');
  };

  const estadoAuditColor = {
    'Verificado': { bg: '#dcfce7', text: '#166534' },
    'Faltante':   { bg: '#fee2e2', text: '#991b1b' },
    'Pendiente':  { bg: '#fef3c7', text: '#92400e' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1a3a6b', margin: 0 }}>Auditoría de Inventario</h1>
        <p style={{ color: '#6b7280', marginTop: '4px', fontSize: '14px' }}>Verifica físicamente los activos y genera el reporte de discrepancias</p>
      </div>

      {/* Configuración */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: '#1a3a6b' }}>
          {auditIniciada ? '⚙️ Configuración de auditoría activa' : '⚙️ Configurar auditoría'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>Categoría</label>
            <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} disabled={auditIniciada} style={formInput}>
              <option value="">Todas las categorías</option>
              {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>Ubicación</label>
            <select value={filtroUbicacion} onChange={e => setFiltroUbicacion(e.target.value)} disabled={auditIniciada} style={formInput}>
              <option value="">Todas las ubicaciones</option>
              {ubicaciones.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            {!auditIniciada ? (
              <button onClick={iniciarAuditoria} style={{ ...btnPrimary, width: '100%', padding: '12px' }}>
                ▶ Iniciar auditoría ({activosFiltrados.length} activos)
              </button>
            ) : (
              <button onClick={() => { setAuditIniciada(false); setAuditados({}); setNotas({}); }} style={{ ...btnCancel, width: '100%', padding: '12px' }}>
                ✕ Cancelar auditoría
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Panel de progreso y escaneo QR */}
      {auditIniciada && (
        <>
          {/* Progreso */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1a3a6b' }}>Progreso de auditoría</h3>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#1a3a6b' }}>{progreso}%</span>
            </div>
            <div style={{ background: '#f3f4f6', borderRadius: '8px', height: '12px', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ height: '100%', width: `${progreso}%`, background: 'linear-gradient(90deg, #1a3a6b, #2563eb)', borderRadius: '8px', transition: 'width 0.4s ease' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[
                { label: 'Total', value: stats.total, color: '#1a3a6b' },
                { label: 'Verificados', value: stats.verificado, color: '#16a34a' },
                { label: 'Faltantes', value: stats.faltante, color: '#dc2626' },
                { label: 'Pendientes', value: stats.pendiente, color: '#f0a500' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', background: '#f9fafb', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Escaneo QR + acciones masivas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'start' }}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: '700', color: '#1a3a6b' }}>📷 Verificar por código QR</h3>
              <form onSubmit={buscarQR} style={{ display: 'flex', gap: '10px' }}>
                <input
                  value={busquedaQR} onChange={e => setBusquedaQR(e.target.value)}
                  placeholder="Escanea o escribe el código QR..."
                  autoFocus
                  style={{ ...formInput, flex: 1, fontFamily: 'monospace' }}
                />
                <button type="submit" style={btnPrimary}>✔ Verificar</button>
              </form>
              <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                Conecta un lector de códigos de barras USB y escanea directamente aquí
              </p>
            </div>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '200px' }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '700', color: '#1a3a6b' }}>Acciones masivas</h3>
              <button onClick={() => marcarTodos('Verificado')} style={{ ...btnPrimary, background: '#16a34a', fontSize: '13px' }}>✅ Marcar todos verificados</button>
              <button onClick={() => marcarTodos('Faltante')} style={{ ...btnPrimary, background: '#dc2626', fontSize: '13px' }}>🔴 Marcar todos faltantes</button>
              <button onClick={() => { setAuditados({}); toast.success('Auditoría reiniciada'); }} style={{ ...btnCancel, fontSize: '13px' }}>↺ Reiniciar</button>
              <button onClick={exportarPDF} style={{ ...btnPrimary, background: '#7c3aed', fontSize: '13px' }}>📄 Exportar reporte PDF</button>
            </div>
          </div>
        </>
      )}

      {/* Tabla de activos */}
      {auditIniciada && (
        <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontWeight: '700', color: '#1a3a6b', fontSize: '15px' }}>Lista de activos</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              {ESTADOS.map(e => (
                <button key={e} onClick={() => setFiltroEstado(e)} style={{
                  padding: '6px 14px', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                  background: filtroEstado === e ? '#1a3a6b' : '#f3f4f6',
                  color: filtroEstado === e ? '#fff' : '#374151',
                }}>{e}</button>
              ))}
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Código QR', 'Nombre', 'Ubicación', 'Estado sistema', 'Auditoría', 'Notas', 'Acción'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibles.map(a => {
                const c = estadoAuditColor[a.estadoAudit];
                return (
                  <tr key={a.id_activo} style={{ borderTop: '1px solid #f3f4f6', background: a.estadoAudit === 'Faltante' ? '#fff7f7' : a.estadoAudit === 'Verificado' ? '#f0fdf4' : 'transparent' }}>
                    <td style={tdStyle}><span style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '2px 8px', borderRadius: '6px', fontSize: '12px' }}>{a.codigo_qr}</span></td>
                    <td style={{ ...tdStyle, fontWeight: '600', color: '#1a3a6b' }}>{a.nombre}</td>
                    <td style={{ ...tdStyle, color: '#6b7280' }}>{a.ubicacion || '—'}</td>
                    <td style={tdStyle}>
                      <span style={{
                        background: a.estado === 'Disponible' ? '#dcfce7' : a.estado === 'No disponible' ? '#fee2e2' : '#fef3c7',
                        color: a.estado === 'Disponible' ? '#166534' : a.estado === 'No disponible' ? '#991b1b' : '#92400e',
                        padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600'
                      }}>{a.estado}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ background: c.bg, color: c.text, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{a.estadoAudit}</span>
                    </td>
                    <td style={tdStyle}>
                      <input
                        value={notas[a.id_activo] || ''}
                        onChange={e => setNotas(prev => ({ ...prev, [a.id_activo]: e.target.value }))}
                        placeholder="Nota opcional..."
                        style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', width: '140px', outline: 'none' }}
                      />
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => marcar(a.id_activo, 'Verificado')} style={{
                          padding: '5px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                          background: a.estadoAudit === 'Verificado' ? '#16a34a' : '#dcfce7',
                          color: a.estadoAudit === 'Verificado' ? '#fff' : '#166534',
                        }}>✔</button>
                        <button onClick={() => marcar(a.id_activo, 'Faltante')} style={{
                          padding: '5px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                          background: a.estadoAudit === 'Faltante' ? '#dc2626' : '#fee2e2',
                          color: a.estadoAudit === 'Faltante' ? '#fff' : '#991b1b',
                        }}>✗</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visibles.length === 0 && (
                <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No hay activos con este filtro</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!auditIniciada && !loading && (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '60px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>🔍</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a3a6b', marginBottom: '8px' }}>Configura y comienza la auditoría</div>
          <div style={{ color: '#6b7280', fontSize: '14px', maxWidth: '420px', margin: '0 auto' }}>
            Selecciona una categoría o ubicación para filtrar los activos a auditar, luego presiona "Iniciar auditoría" para comenzar la verificación física.
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: '12px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase' };
const tdStyle = { padding: '12px 16px' };
const btnPrimary = { padding: '10px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', fontFamily: 'inherit' };
const btnCancel = { padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', fontFamily: 'inherit' };
const labelStyle = { fontSize: '13px', fontWeight: '600', color: '#374151' };
const formInput = { padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' };
