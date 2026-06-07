const pool = require('../config/db');
const { registrarAccion } = require('./bitacora.controller');

const obtenerPrestamos = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, a.nombre AS activo_nombre, a.codigo_qr FROM prestamos p JOIN activos a ON a.id_activo = p.id_activo ORDER BY p.fecha_prestamo DESC`
    );
    res.json(result.rows);
  } catch (error) { res.status(500).json({ mensaje: 'Error al obtener préstamos' }); }
};

const obtenerPrestamosActivos = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, a.nombre AS activo_nombre, a.codigo_qr FROM prestamos p JOIN activos a ON a.id_activo = p.id_activo WHERE p.estado = 'Prestado' ORDER BY p.fecha_devolucion_programada ASC`
    );
    res.json(result.rows);
  } catch (error) { res.status(500).json({ mensaje: 'Error al obtener préstamos activos' }); }
};

const obtenerPrestamoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT p.*, a.nombre AS activo_nombre, a.codigo_qr FROM prestamos p JOIN activos a ON a.id_activo = p.id_activo WHERE p.id = $1`, [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ mensaje: 'Error al obtener préstamo' }); }
};

const crearPrestamo = async (req, res) => {
  try {
    const { id_activo, responsable, fecha_devolucion_programada, condicion_entrega, observaciones } = req.body;
    if (!id_activo || !responsable || !fecha_devolucion_programada) {
      return res.status(400).json({ mensaje: 'id_activo, responsable y fecha_devolucion_programada son requeridos' });
    }
    const activo = await pool.query('SELECT estado, nombre FROM activos WHERE id_activo = $1', [id_activo]);
    if (activo.rows.length === 0) return res.status(404).json({ mensaje: 'Activo no encontrado' });
    if (activo.rows[0].estado !== 'Disponible') return res.status(400).json({ mensaje: 'El activo no está disponible para préstamo' });

    const result = await pool.query(
      `INSERT INTO prestamos (id_activo, responsable, fecha_devolucion_programada, condicion_entrega, observaciones)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [id_activo, responsable, fecha_devolucion_programada, condicion_entrega, observaciones]
    );
    await registrarAccion({ id_usuario: req.usuario.id, nombre_usuario: req.usuario.nombre, accion: 'PRÉSTAMO', modulo: 'Préstamos', descripcion: `Préstamo registrado: ${activo.rows[0].nombre} → ${responsable}`, ip: req.ip });
    res.status(201).json(result.rows[0]);
  } catch (error) { console.error(error); res.status(500).json({ mensaje: 'Error al registrar préstamo' }); }
};

const devolverActivo = async (req, res) => {
  try {
    const { id } = req.params;
    const { condicion_retorno } = req.body;
    const result = await pool.query(
      `UPDATE prestamos SET estado = 'Devuelto', fecha_devolucion_real = CURRENT_TIMESTAMP, condicion_retorno = $1
       WHERE id = $2 AND estado = 'Prestado' RETURNING *`,
      [condicion_retorno, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ mensaje: 'Préstamo no encontrado o ya devuelto' });
    await registrarAccion({ id_usuario: req.usuario.id, nombre_usuario: req.usuario.nombre, accion: 'DEVOLUCIÓN', modulo: 'Préstamos', descripcion: `Devolución registrada: préstamo ID ${id}`, ip: req.ip });
    res.json(result.rows[0]);
  } catch (error) { console.error(error); res.status(500).json({ mensaje: 'Error al registrar devolución' }); }
};

module.exports = { obtenerPrestamos, obtenerPrestamosActivos, obtenerPrestamoPorId, crearPrestamo, devolverActivo };
