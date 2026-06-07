import { useEffect, useState, useRef } from 'react';
import api from '../services/api';

export default function Notificaciones() {
  const [alertas, setAlertas] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data } = await api.get('/prestamos');
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const en3dias = new Date(hoy);
        en3dias.setDate(en3dias.getDate() + 3);

        const lista = data
          .filter(p => p.estado === 'Prestado')
          .map(p => {
            const fecha = new Date(p.fecha_devolucion_programada);
            fecha.setHours(0, 0, 0, 0);
            const diff = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
            if (diff < 0) return { ...p, tipo: 'vencido', diff };
            if (diff <= 3) return { ...p, tipo: 'proximo', diff };
            return null;
          })
          .filter(Boolean)
          .sort((a, b) => a.diff - b.diff);

        setAlertas(lista);
      } catch {}
    };
    cargar();
    const interval = setInterval(cargar, 60000);
    return () => clearInterval(interval);
  }, []);

  // Cerrar al click fuera
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const vencidos  = alertas.filter(a => a.tipo === 'vencido').length;
  const proximos  = alertas.filter(a => a.tipo === 'proximo').length;
  const total     = alertas.length;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setAbierto(!abierto)}
        style={{
          position: 'relative', background: total > 0 ? 'rgba(220,38,38,0.15)' : 'rgba(255,255,255,0.08)',
          border: 'none', borderRadius: '10px', padding: '8px 12px',
          cursor: 'pointer', color: total > 0 ? '#ff8080' : 'rgba(255,255,255,0.5)',
          fontSize: '18px', lineHeight: 1,
        }}
        title="Notificaciones"
      >
        🔔
        {total > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: '#dc2626', color: '#fff', borderRadius: '50%',
            width: '18px', height: '18px', fontSize: '10px', fontWeight: '800',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{total}</span>
        )}
      </button>

      {abierto && (
        <div style={{
          position: 'fixed', left: '250px', bottom: '80px', width: '320px',
          background: '#fff', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
          zIndex: 9999, overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '700', fontSize: '15px', color: '#1a3a6b' }}>Notificaciones</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {vencidos > 0 && <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px' }}>{vencidos} vencido{vencidos > 1 ? 's' : ''}</span>}
              {proximos > 0 && <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px' }}>{proximos} próximo{proximos > 1 ? 's' : ''}</span>}
            </div>
          </div>

          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {alertas.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
                Sin alertas pendientes
              </div>
            ) : (
              alertas.map(a => (
                <div key={a.id} style={{
                  padding: '14px 20px', borderBottom: '1px solid #f9fafb',
                  background: a.tipo === 'vencido' ? '#fff7f7' : '#fffbeb',
                  display: 'flex', gap: '12px', alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: '20px', flexShrink: 0 }}>{a.tipo === 'vencido' ? '🔴' : '🟡'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', fontSize: '13px', color: '#1a3a6b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.activo_nombre}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Responsable: {a.responsable}</div>
                    <div style={{ fontSize: '12px', fontWeight: '600', marginTop: '4px', color: a.tipo === 'vencido' ? '#dc2626' : '#92400e' }}>
                      {a.tipo === 'vencido'
                        ? `Venció hace ${Math.abs(a.diff)} día${Math.abs(a.diff) !== 1 ? 's' : ''}`
                        : a.diff === 0 ? 'Vence hoy'
                        : `Vence en ${a.diff} día${a.diff !== 1 ? 's' : ''}`}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
