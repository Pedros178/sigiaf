import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function BusquedaGlobal() {
  const [query, setQuery]       = useState('');
  const [resultados, setResultados] = useState(null);
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const buscar = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const [activos, prestamos, mant] = await Promise.all([
        api.get('/activos'),
        api.get('/prestamos'),
        api.get('/mantenimientos'),
      ]);
      const q = query.toLowerCase();
      setResultados({
        activos: activos.data.filter(a =>
          a.nombre?.toLowerCase().includes(q) ||
          a.codigo_qr?.toLowerCase().includes(q) ||
          a.ubicacion?.toLowerCase().includes(q) ||
          a.marca?.toLowerCase().includes(q) ||
          a.numero_serie?.toLowerCase().includes(q)
        ),
        prestamos: prestamos.data.filter(p =>
          p.activo_nombre?.toLowerCase().includes(q) ||
          p.responsable?.toLowerCase().includes(q)
        ),
        mantenimientos: mant.data.filter(m =>
          m.activo_nombre?.toLowerCase().includes(q) ||
          m.descripcion?.toLowerCase().includes(q) ||
          m.responsable?.toLowerCase().includes(q)
        ),
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const total = resultados ? resultados.activos.length + resultados.prestamos.length + resultados.mantenimientos.length : 0;
  const estadoColor = { 'Disponible': '#16a34a', 'No disponible': '#dc2626', 'Mantenimiento': '#f0a500' };

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1a3a6b', margin: 0 }}>Búsqueda global</h1>
        <p style={{ color: '#6b7280', marginTop: '4px', fontSize: '14px' }}>Busca en activos, préstamos y mantenimientos al mismo tiempo</p>
      </div>

      <form onSubmit={buscar} style={{ display: 'flex', gap: '12px', marginBottom: '28px', maxWidth: '700px' }}>
        <input
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nombre, código QR, responsable, ubicación, serie..."
          style={{ flex: 1, padding: '16px 20px', border: '2px solid #e5e7eb', borderRadius: '14px', fontSize: '16px', outline: 'none', fontFamily: 'inherit' }}
          autoFocus
        />
        <button type="submit" disabled={loading} style={{ padding: '16px 28px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '14px', cursor: 'pointer', fontWeight: '700', fontSize: '16px' }}>
          {loading ? '...' : '🔍'}
        </button>
      </form>

      {resultados !== null && (
        <>
          <div style={{ marginBottom: '20px', fontSize: '14px', color: '#6b7280' }}>
            {total === 0 ? `Sin resultados para "${query}"` : `${total} resultado${total !== 1 ? 's' : ''} para "${query}"`}
          </div>

          {/* Activos */}
          {resultados.activos.length > 0 && (
            <Section titulo={`📦 Activos (${resultados.activos.length})`}>
              {resultados.activos.map(a => (
                <ResultCard key={a.id_activo} onClick={() => navigate('/activos')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: '#1a3a6b', fontSize: '15px' }}>{a.nombre}</div>
                      <div style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace', marginTop: '2px' }}>{a.codigo_qr}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{a.categoria} {a.ubicacion ? `· ${a.ubicacion}` : ''} {a.marca ? `· ${a.marca}` : ''}</div>
                    </div>
                    <span style={{ background: estadoColor[a.estado] + '20', color: estadoColor[a.estado], padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' }}>{a.estado}</span>
                  </div>
                </ResultCard>
              ))}
            </Section>
          )}

          {/* Préstamos */}
          {resultados.prestamos.length > 0 && (
            <Section titulo={`🔄 Préstamos (${resultados.prestamos.length})`}>
              {resultados.prestamos.map(p => (
                <ResultCard key={p.id} onClick={() => navigate('/prestamos')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: '#1a3a6b', fontSize: '15px' }}>{p.activo_nombre}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Responsable: {p.responsable}</div>
                      <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                        {new Date(p.fecha_prestamo).toLocaleDateString('es-MX')} → {new Date(p.fecha_devolucion_programada).toLocaleDateString('es-MX')}
                      </div>
                    </div>
                    <span style={{ background: p.estado === 'Prestado' ? '#fef3c7' : '#dcfce7', color: p.estado === 'Prestado' ? '#92400e' : '#166534', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{p.estado}</span>
                  </div>
                </ResultCard>
              ))}
            </Section>
          )}

          {/* Mantenimientos */}
          {resultados.mantenimientos.length > 0 && (
            <Section titulo={`🔧 Mantenimientos (${resultados.mantenimientos.length})`}>
              {resultados.mantenimientos.map(m => (
                <ResultCard key={m.id_mantenimiento} onClick={() => navigate('/mantenimientos')}>
                  <div style={{ fontWeight: '700', color: '#1a3a6b', fontSize: '15px' }}>{m.activo_nombre}</div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                    <span style={{ background: m.tipo === 'Preventivo' ? '#dbeafe' : '#fee2e2', color: m.tipo === 'Preventivo' ? '#1e40af' : '#991b1b', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', marginRight: '8px' }}>{m.tipo}</span>
                    {m.descripcion}
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{new Date(m.fecha).toLocaleDateString('es-MX')} · {m.responsable || 'Sin responsable'}</div>
                </ResultCard>
              ))}
            </Section>
          )}

          {total === 0 && (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '60px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>Sin resultados</div>
              <div style={{ color: '#6b7280', marginTop: '6px' }}>Intenta con otro término de búsqueda</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Section({ titulo, children }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1a3a6b', margin: '0 0 12px' }}>{titulo}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{children}</div>
    </div>
  );
}

function ResultCard({ children, onClick }) {
  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', border: '2px solid transparent', transition: 'border-color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#1a3a6b'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
    >{children}</div>
  );
}
