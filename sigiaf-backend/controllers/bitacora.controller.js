const pool = require('../config/db');

const registrarAccion = async ({ id_usuario, nombre_usuario, accion, modulo, descripcion, ip }) => {
  try {
    await pool.query(
      `INSERT INTO bitacora (id_usuario, nombre_usuario, accion, modulo, descripcion, ip)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id_usuario, nombre_usuario, accion, modulo, descripcion, ip || null]
    );
  } catch (err) {
    console.error('Error al registrar bitácora:', err.message);
  }
};

const obtenerBitacora = async (req, res) => {
  try {
    const { modulo, limite = 100 } = req.query;
    let query = `SELECT * FROM bitacora`;
    const params = [];
    if (modulo) {
      query += ` WHERE modulo = $1`;
      params.push(modulo);
    }
    query += ` ORDER BY fecha DESC LIMIT $${params.length + 1}`;
    params.push(limite);
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener bitácora' });
  }
};

module.exports = { registrarAccion, obtenerBitacora };
