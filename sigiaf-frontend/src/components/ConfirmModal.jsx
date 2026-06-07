// Modal de confirmación reutilizable con más detalle
export default function ConfirmModal({ open, onConfirm, onCancel, titulo, mensaje, detalle, tipo = 'danger' }) {
  if (!open) return null;
  const colores = {
    danger:  { icon: '🗑️', bg: '#fef2f2', border: '#fecaca', btnBg: 'linear-gradient(135deg,#dc2626,#b91c1c)', btnShadow: 'rgba(220,38,38,0.35)' },
    warning: { icon: '⚠️', bg: '#fffbeb', border: '#fde68a', btnBg: 'linear-gradient(135deg,#d97706,#b45309)', btnShadow: 'rgba(217,119,6,0.35)' },
  };
  const c = colores[tipo] || colores.danger;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px' }}>
      <div style={{ background:'#fff', borderRadius:'20px', padding:'36px', width:'100%', maxWidth:'420px', boxShadow:'0 24px 64px rgba(0,0,0,0.2)', fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
        <div style={{ width:56, height:56, background:c.bg, border:`2px solid ${c.border}`, borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'26px', marginBottom:'20px' }}>
          {c.icon}
        </div>
        <h2 style={{ margin:'0 0 8px', fontSize:'19px', fontWeight:'800', color:'#0f172a' }}>{titulo}</h2>
        <p style={{ margin:'0 0 6px', color:'#475569', fontSize:'14px', lineHeight:1.6 }}>{mensaje}</p>
        {detalle && <p style={{ margin:'0 0 28px', color:'#94a3b8', fontSize:'12.5px', background:'#f8fafc', padding:'10px 14px', borderRadius:'10px', fontWeight:'500' }}>{detalle}</p>}
        {!detalle && <div style={{ marginBottom:'28px' }} />}
        <div style={{ display:'flex', gap:'12px', justifyContent:'flex-end' }}>
          <button onClick={onCancel} style={{ padding:'10px 22px', background:'#f8fafc', color:'#475569', border:'1.5px solid #e2e8f0', borderRadius:'10px', cursor:'pointer', fontWeight:'600', fontSize:'14px', fontFamily:'inherit' }}>
            Cancelar
          </button>
          <button onClick={onConfirm} style={{ padding:'10px 22px', background:c.btnBg, color:'#fff', border:'none', borderRadius:'10px', cursor:'pointer', fontWeight:'700', fontSize:'14px', fontFamily:'inherit', boxShadow:`0 4px 12px ${c.btnShadow}` }}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
