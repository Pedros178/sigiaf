const pool = require('../config/db');

const obtenerMantenimientos = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, a.nombre AS activo_nombre, a.codigo_qr
       FROM mantenimientos m
       JOIN activos a ON a.id_activo = m.id_activo
       ORDER BY m.fecha DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener mantenimientos' });
  }
};

const obtenerMantenimientosPorActivo = async (req, res) => {
  try {
    const { id_activo } = req.params;
    const result = await pool.query(
      `SELECT * FROM mantenimientos WHERE id_activo = $1 ORDER BY fecha DESC`,
      [id_activo]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener mantenimientos del activo' });
  }
};

const crearMantenimiento = async (req, res) => {
  try {
    const { id_activo, tipo, descripcion, fecha, responsable, costo } = req.body;

    if (!id_activo || !tipo || !fecha) {
      return res.status(400).json({ mensaje: 'id_activo, tipo y fecha son requeridos' });
    }

    const result = await pool.query(
      `INSERT INTO mantenimientos (id_activo, tipo, descripcion, fecha, responsable, costo)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [id_activo, tipo, descripcion, fecha, responsable, costo]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al registrar mantenimiento' });
  }
};

const actualizarMantenimiento = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, descripcion, fecha, responsable, costo } = req.body;

    const result = await pool.query(
      `UPDATE mantenimientos
       SET tipo        = COALESCE($1, tipo),
           descripcion = COALESCE($2, descripcion),
           fecha       = COALESCE($3, fecha),
           responsable = COALESCE($4, responsable),
           costo       = COALESCE($5, costo)
       WHERE id_mantenimiento = $6
       RETURNING *`,
      [tipo, descripcion, fecha, responsable, costo, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Mantenimiento no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al actualizar mantenimiento' });
  }
};

const eliminarMantenimiento = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM mantenimientos WHERE id_mantenimiento = $1', [id]);
    res.json({ mensaje: 'Mantenimiento eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al eliminar mantenimiento' });
  }
};

module.exports = {
  obtenerMantenimientos,
  obtenerMantenimientosPorActivo,
  crearMantenimiento,
  actualizarMantenimiento,
  eliminarMantenimiento,
};
