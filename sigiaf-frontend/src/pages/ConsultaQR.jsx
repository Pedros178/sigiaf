import { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const estadoColor = {
  'Disponible':    { bg: '#dcfce7', text: '#166534', icon: '✅' },
  'No disponible': { bg: '#fee2e2', text: '#991b1b', icon: '🔴' },
  'Mantenimiento': { bg: '#fef3c7', text: '#92400e', icon: '🔧' },
};

export default function ConsultaQR() {
  const [codigo, setCodigo]   = useState('');
  const [activo, setActivo]   = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);

  const buscar = async (e) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    setLoading(true);
    setActivo(null);
    setHistorial([]);
    setBuscado(true);
    try {
      const { data } = await api.get(`/activos/qr/${codigo.trim()}`);
      setActivo(data);
      // Cargar historial de préstamos y mantenimientos
      const [pres, mant] = await Promise.all([
        api.get('/prestamos'),
        api.get(`/mantenimientos/activo/${data.id_activo}`),
      ]);
      const presFiltrados = pres.data.filter(p => p.id_activo === data.id_activo);
      setHistorial({ prestamos: presFiltrados, mantenimientos: mant.data });
    } catch (err) {
      if (err.response?.status === 404) toast.error('No se encontró ningún activo con ese código QR');
      else toast.error('Error al buscar');
    } finally {
      setLoading(false);
    }
  };

  const limpiar = () => { setCodigo(''); setActivo(null); setHistorial([]); setBuscado(false); };

  const color = activo ? (estadoColor[activo.estado] || { bg: '#f3f4f6', text: '#374151', icon: '❓' }) : null;

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1a3a6b', margin: 0 }}>Consulta por QR</h1>
        <p style={{ color: '#6b7280', marginTop: '4px', fontSize: '14px' }}>Ingresa el código QR de un activo para ver su información completa</p>
      </div>

      {/* Buscador */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '24px', maxWidth: '600px' }}>
        <form onSubmit={buscar} style={{ display: 'flex', gap: '12px' }}>
          <input
            value={codigo}
            onChange={e => setCodigo(e.target.value)}
            placeholder="Ej: ACT-M9K2J1-AB3C o QR001"
            style={{
              flex: 1, padding: '14px 18px', border: '2px solid #e5e7eb',
              borderRadius: '12px', fontSize: '15px', outline: 'none',
              fontFamily: 'monospace', letterSpacing: '0.5px',
            }}
            autoFocus
          />
          <button type="submit" disabled={loading} style={{
            padding: '14px 24px', background: '#1a3a6b', color: '#fff',
            border: 'none', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '700', fontSize: '15px', opacity: loading ? 0.7 : 1,
          }}>
            {loading ? '...' : '🔍 Buscar'}
          </button>
          {buscado && <button type="button" onClick={limpiar} style={{ padding: '14px 18px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' }}>✕</button>}
        </form>
        <p style={{ margin: '12px 0 0', fontSize: '12px', color: '#9ca3af' }}>
          💡 Escribe el código que aparece en la etiqueta QR del activo o escanéalo con un lector de códigos
        </p>
      </div>

      {/* Resultado */}
      {buscado && !loading && !activo && (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '48px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>No encontrado</div>
          <div style={{ color: '#6b7280', marginTop: '6px' }}>No existe un activo con el código <strong style={{ fontFamily: 'monospace' }}>{codigo}</strong></div>
        </div>
      )}

      {activo && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Ficha principal */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a6b' }}>{activo.nombre}</div>
                <div style={{ fontFamily: 'monospace', background: '#f3f4f6', display: 'inline-block', padding: '4px 12px', borderRadius: '8px', fontSize: '13px', marginTop: '6px' }}>{activo.codigo_qr}</div>
              </div>
              <span style={{ background: color.bg, color: color.text, padding: '8px 18px', borderRadius: '20px', fontWeight: '700', fontSize: '15px' }}>
                {color.icon} {activo.estado}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginTop: '24px' }}>
              {[
                ['Categoría', activo.categoria],
                ['Marca', activo.marca || '—'],
                ['Modelo', activo.modelo || '—'],
                ['N° de serie', activo.numero_serie || '—'],
                ['Ubicación', activo.ubicacion || '—'],
                ['Fecha de registro', new Date(activo.fecha_registro).toLocaleDateString('es-MX')],
              ].map(([label, value]) => (
                <div key={label} style={{ background: '#f9fafb', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginTop: '4px' }}>{value}</div>
                </div>
              ))}
            </div>

            {activo.descripcion && (
              <div style={{ marginTop: '20px', padding: '14px', background: '#f9fafb', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px' }}>Descripción</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>{activo.descripcion}</div>
              </div>
            )}
          </div>

          {/* Historial préstamos */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: '#1a3a6b' }}>
              🔄 Historial de préstamos ({historial.prestamos?.length || 0})
            </h3>
            {historial.prestamos?.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '13px' }}>Sin préstamos registrados</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {historial.prestamos?.slice(0, 5).map(p => (
                  <div key={p.id} style={{ padding: '12px', background: '#f9fafb', borderRadius: '10px', borderLeft: `4px solid ${p.estado === 'Prestado' ? '#f0a500' : '#16a34a'}` }}>
                    <div style={{ fontWeight: '600', fontSize: '13px', color: '#1a3a6b' }}>{p.responsable}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                      {new Date(p.fecha_prestamo).toLocaleDateString('es-MX')} →{' '}
                      {p.fecha_devolucion_real ? new Date(p.fecha_devolucion_real).toLocaleDateString('es-MX') : new Date(p.fecha_devolucion_programada).toLocaleDateString('es-MX')}
                    </div>
                    <span style={{
                      fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px',
                      background: p.estado === 'Prestado' ? '#fef3c7' : '#dcfce7',
                      color: p.estado === 'Prestado' ? '#92400e' : '#166534',
                    }}>{p.estado}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historial mantenimientos */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: '#1a3a6b' }}>
              🔧 Historial de mantenimientos ({historial.mantenimientos?.length || 0})
            </h3>
            {historial.mantenimientos?.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '13px' }}>Sin mantenimientos registrados</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {historial.mantenimientos?.slice(0, 5).map(m => (
                  <div key={m.id_mantenimiento} style={{ padding: '12px', background: '#f9fafb', borderRadius: '10px', borderLeft: `4px solid ${m.tipo === 'Preventivo' ? '#3b82f6' : '#dc2626'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: '#1a3a6b' }}>{m.tipo}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{new Date(m.fecha).toLocaleDateString('es-MX')}</div>
                    </div>
                    {m.descripcion && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{m.descripcion}</div>}
                    {m.responsable && <div style={{ fontSize: '12px', color: '#374151', marginTop: '2px' }}>Técnico: {m.responsable}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
