import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const moduloColor = {
  'Autenticación': { bg: '#dbeafe', text: '#1e40af' },
  'Activos':       { bg: '#d1fae5', text: '#065f46' },
  'Préstamos':     { bg: '#fef3c7', text: '#92400e' },
  'Mantenimientos':{ bg: '#ede9fe', text: '#5b21b6' },
};

const accionIcon = {
  'LOGIN':      '🔐',
  'CREAR':      '➕',
  'ACTUALIZAR': '✏️',
  'ELIMINAR':   '🗑️',
  'PRÉSTAMO':   '🔄',
  'DEVOLUCIÓN': '✅',
};

export default function Bitacora() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filtroModulo, setFiltroModulo] = useState('');
  const [busqueda, setBusqueda]   = useState('');

  const cargar = async () => {
    try {
      const params = filtroModulo ? `?modulo=${filtroModulo}&limite=200` : '?limite=200';
      const { data } = await api.get(`/bitacora${params}`);
      setRegistros(data);
    } catch { toast.error('Error al cargar bitácora'); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, [filtroModulo]);

  const modulos = [...new Set(registros.map(r => r.modulo))];

  const filtrados = registros.filter(r =>
    busqueda === '' ||
    r.nombre_usuario?.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.accion?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1a3a6b', margin: 0 }}>Bitácora de actividad</h1>
          <p style={{ color: '#6b7280', marginTop: '4px', fontSize: '14px' }}>{filtrados.length} registros — auditoría completa del sistema</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar usuario, acción..." style={inputStyle} />
          <select value={filtroModulo} onChange={e => setFiltroModulo(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
            <option value="">Todos los módulos</option>
            {modulos.map(m => <option key={m}>{m}</option>)}
          </select>
          <button onClick={cargar} style={btnSecondary}>↺ Actualizar</button>
        </div>
      </div>

      {loading ? <p style={{ color: '#9ca3af' }}>Cargando...</p> : (
        <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Fecha y hora', 'Usuario', 'Acción', 'Módulo', 'Descripción'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(r => {
                const mc = moduloColor[r.modulo] || { bg: '#f3f4f6', text: '#374151' };
                return (
                  <tr key={r.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px 16px', color: '#6b7280', whiteSpace: 'nowrap', fontSize: '12px' }}>
                      {new Date(r.fecha).toLocaleDateString('es-MX')}{' '}
                      <span style={{ color: '#9ca3af' }}>{new Date(r.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#1a3a6b' }}>{r.nombre_usuario || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                        {accionIcon[r.accion] || '📋'} {r.accion}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: mc.bg, color: mc.text, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>{r.modulo}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6b7280', maxWidth: '320px' }}>{r.descripcion}</td>
                  </tr>
                );
              })}
              {filtrados.length === 0 && (
                <tr><td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>Sin registros de actividad</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: '11px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputStyle = { padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', width: '200px' };
const btnSecondary = { padding: '10px 16px', background: '#f0f4fa', color: '#1a3a6b', border: '2px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', fontFamily: 'inherit' };
