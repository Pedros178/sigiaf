import { useEffect, useState } from 'react';
import api from '../services/api';

// Mini gráfica de barras SVG
function BarChart({ data, colorFn }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '120px', padding: '0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#1a3a6b' }}>{d.value}</span>
          <div style={{
            width: '100%', borderRadius: '6px 6px 0 0',
            height: `${Math.max((d.value / max) * 80, d.value > 0 ? 8 : 0)}px`,
            background: colorFn ? colorFn(i) : '#1a3a6b',
            transition: 'height 0.5s ease',
            minHeight: d.value > 0 ? '8px' : '0',
          }} />
          <span style={{ fontSize: '10px', color: '#6b7280', textAlign: 'center', lineHeight: 1.2 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// Gráfica de dona SVG
function DonutChart({ data, total }) {
  const colors = ['#1a3a6b', '#f0a500', '#dc2626', '#16a34a', '#7c3aed', '#0891b2'];
  let offset = 0;
  const r = 60, cx = 80, cy = 80, strokeW = 28;
  const circ = 2 * Math.PI * r;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={strokeW} />
        {data.map((d, i) => {
          const pct = total > 0 ? (d.value / total) : 0;
          const dash = pct * circ;
          const gap  = circ - dash;
          const seg = (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={colors[i % colors.length]} strokeWidth={strokeW}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset * circ}
              style={{ transition: 'stroke-dasharray 0.5s ease', transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
            />
          );
          offset += pct;
          return seg;
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontSize: '22px', fontWeight: '800', fill: '#1a3a6b' }}>{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize: '10px', fill: '#6b7280' }}>total</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: colors[i % colors.length], flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: '#374151' }}>{d.label}</span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#1a3a6b', marginLeft: 'auto' }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [a, p, m, c, u] = await Promise.all([
          api.get('/activos'),
          api.get('/prestamos'),
          api.get('/mantenimientos'),
          api.get('/categorias'),
          api.get('/usuarios'),
        ]);

        const activos       = a.data;
        const prestamos     = p.data;
        const mantenimientos = m.data;
        const hoy = new Date(); hoy.setHours(0,0,0,0);

        // Activos por estado
        const porEstado = ['Disponible','No disponible','Mantenimiento'].map(e => ({
          label: e, value: activos.filter(x => x.estado === e).length
        }));

        // Activos por categoría
        const porCategoria = c.data.map(cat => ({
          label: cat.nombre, value: activos.filter(x => x.id_categoria === cat.id_categoria).length
        })).filter(x => x.value > 0);

        // Préstamos por mes (últimos 6 meses)
        const meses = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(); d.setMonth(d.getMonth() - i);
          const mes = d.toLocaleString('es-MX', { month: 'short' });
          const año = d.getFullYear(); const m2 = d.getMonth();
          meses.push({
            label: mes,
            value: prestamos.filter(p2 => {
              const f = new Date(p2.fecha_prestamo);
              return f.getMonth() === m2 && f.getFullYear() === año;
            }).length
          });
        }

        // Mantenimientos por tipo
        const preventivos = mantenimientos.filter(x => x.tipo === 'Preventivo').length;
        const correctivos  = mantenimientos.filter(x => x.tipo === 'Correctivo').length;

        // KPIs
        const prestamosActivos = prestamos.filter(x => x.estado === 'Prestado').length;
        const vencidos = prestamos.filter(x => x.estado === 'Prestado' && new Date(x.fecha_devolucion_programada) < hoy).length;
        const tasaDisponibilidad = activos.length > 0 ? Math.round((activos.filter(x => x.estado === 'Disponible').length / activos.length) * 100) : 0;

        setDatos({
          totalActivos: activos.length,
          totalUsuarios: u.data.length,
          prestamosActivos, vencidos, tasaDisponibilidad,
          porEstado, porCategoria, prestamosPorMes: meses,
          preventivos, correctivos,
          totalMantenimientos: mantenimientos.length,
          costoTotal: mantenimientos.reduce((s, x) => s + parseFloat(x.costo || 0), 0),
          prestamosRecientes: prestamos.slice(0, 5),
        });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    cargar();
  }, []);

  if (loading) return <div style={{ color: '#9ca3af', padding: '40px' }}>Cargando dashboard...</div>;
  if (!datos) return null;

  const kpis = [
    { label: 'Total de activos',       value: datos.totalActivos,        color: '#1a3a6b', icon: '📦', sub: `${datos.porCategoria.length} categorías` },
    { label: 'Disponibilidad',          value: `${datos.tasaDisponibilidad}%`, color: '#16a34a', icon: '✅', sub: 'activos disponibles' },
    { label: 'Préstamos activos',       value: datos.prestamosActivos,    color: '#f0a500', icon: '🔄', sub: `${datos.vencidos} vencidos` },
    { label: 'Mantenimientos',          value: datos.totalMantenimientos, color: '#7c3aed', icon: '🔧', sub: `$${datos.costoTotal.toFixed(2)} en costos` },
    { label: 'Usuarios registrados',    value: datos.totalUsuarios,       color: '#0891b2', icon: '👥', sub: 'en el sistema' },
    { label: 'Alertas activas',         value: datos.vencidos,            color: datos.vencidos > 0 ? '#dc2626' : '#16a34a', icon: datos.vencidos > 0 ? '⚠️' : '🔔', sub: datos.vencidos > 0 ? 'requieren atención' : 'sin alertas' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1a3a6b', margin: 0 }}>Dashboard</h1>
        <p style={{ color: '#6b7280', marginTop: '4px', fontSize: '14px' }}>
          Resumen ejecutivo del patrimonio institucional — {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Alerta vencidos */}
      {datos.vencidos > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '22px' }}>⚠️</span>
          <span style={{ color: '#991b1b', fontWeight: '600', fontSize: '14px' }}>
            {datos.vencidos} préstamo(s) han superado su fecha de devolución. Revisa el módulo de Préstamos.
          </span>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderLeft: `4px solid ${k.color}` }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{k.icon}</div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: k.color, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: '13px', color: '#374151', fontWeight: '600', marginTop: '6px' }}>{k.label}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Gráficas fila 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Estado de activos - dona */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: '700', color: '#1a3a6b' }}>Estado de activos</h3>
          <DonutChart data={datos.porEstado} total={datos.totalActivos} />
        </div>

        {/* Activos por categoría - barras */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: '700', color: '#1a3a6b' }}>Activos por categoría</h3>
          <BarChart
            data={datos.porCategoria}
            colorFn={i => ['#1a3a6b','#f0a500','#16a34a','#7c3aed','#0891b2','#dc2626'][i % 6]}
          />
        </div>
      </div>

      {/* Gráficas fila 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Préstamos por mes */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: '700', color: '#1a3a6b' }}>Préstamos — últimos 6 meses</h3>
          <BarChart data={datos.prestamosPorMes} colorFn={() => '#f0a500'} />
        </div>

        {/* Mantenimientos por tipo */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: '700', color: '#1a3a6b' }}>Mantenimientos</h3>
          <DonutChart
            data={[
              { label: 'Preventivo', value: datos.preventivos },
              { label: 'Correctivo', value: datos.correctivos },
            ]}
            total={datos.totalMantenimientos}
          />
        </div>
      </div>

      {/* Préstamos recientes */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: '700', color: '#1a3a6b' }}>Actividad reciente — préstamos</h3>
        {datos.prestamosRecientes.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>No hay préstamos registrados.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Activo', 'Responsable', 'Fecha préstamo', 'Devolución', 'Estado'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {datos.prestamosRecientes.map(p => {
                const vencido = p.estado === 'Prestado' && new Date(p.fecha_devolucion_programada) < new Date();
                return (
                  <tr key={p.id} style={{ borderTop: '1px solid #f3f4f6', background: vencido ? '#fff7f7' : 'transparent' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '600', color: '#1a3a6b' }}>
                      {p.activo_nombre}
                      {vencido && <span style={{ marginLeft: '6px', fontSize: '10px', background: '#fee2e2', color: '#dc2626', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>VENCIDO</span>}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#374151' }}>{p.responsable}</td>
                    <td style={{ padding: '12px 14px', color: '#6b7280' }}>{new Date(p.fecha_prestamo).toLocaleDateString('es-MX')}</td>
                    <td style={{ padding: '12px 14px', color: vencido ? '#dc2626' : '#6b7280', fontWeight: vencido ? '600' : '400' }}>{new Date(p.fecha_devolucion_programada).toLocaleDateString('es-MX')}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        background: p.estado === 'Prestado' ? '#fef3c7' : '#dcfce7',
                        color: p.estado === 'Prestado' ? '#92400e' : '#166534',
                        padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'
                      }}>{p.estado}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
