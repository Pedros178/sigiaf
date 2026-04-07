const pool = require('../config/db');
const { registrarAccion } = require('./bitacora.controller');

const obtenerActivos = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, c.nombre AS categoria
       FROM activos a
       JOIN categorias c ON a.id_categoria = c.id_categoria
       ORDER BY a.fecha_registro DESC`
    );
    res.json(result.rows);
  } catch (error) { console.error(error); res.status(500).json({ mensaje: 'Error al obtener activos' }); }
};

const obtenerActivoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT a.*, c.nombre AS categoria FROM activos a JOIN categorias c ON a.id_categoria = c.id_categoria WHERE a.id_activo = $1`, [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ mensaje: 'Activo no encontrado' });
    res.json(result.rows[0]);
  } catch (error) { console.error(error); res.status(500).json({ mensaje: 'Error al obtener activo' }); }
};

const obtenerActivoPorQR = async (req, res) => {
  try {
    const { codigo } = req.params;
    const result = await pool.query(
      `SELECT a.*, c.nombre AS categoria FROM activos a JOIN categorias c ON a.id_categoria = c.id_categoria WHERE a.codigo_qr = $1`, [codigo]
    );
    if (result.rows.length === 0) return res.status(404).json({ mensaje: 'Activo no encontrado' });
    res.json(result.rows[0]);
  } catch (error) { console.error(error); res.status(500).json({ mensaje: 'Error al buscar por QR' }); }
};

const crearActivo = async (req, res) => {
  try {
    const { codigo_qr, nombre, descripcion, marca, modelo, numero_serie, estado, ubicacion, id_categoria } = req.body;
    if (!codigo_qr || !nombre || !estado || !id_categoria) {
      return res.status(400).json({ mensaje: 'codigo_qr, nombre, estado e id_categoria son requeridos' });
    }
    const existe = await pool.query('SELECT id_activo FROM activos WHERE codigo_qr = $1', [codigo_qr]);
    if (existe.rows.length > 0) return res.status(400).json({ mensaje: 'El código QR ya existe' });

    const result = await pool.query(
      `INSERT INTO activos (codigo_qr, nombre, descripcion, marca, modelo, numero_serie, estado, ubicacion, id_categoria)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [codigo_qr, nombre, descripcion, marca, modelo, numero_serie, estado, ubicacion, id_categoria]
    );
    await registrarAccion({ id_usuario: req.usuario.id, nombre_usuario: req.usuario.nombre, accion: 'CREAR', modulo: 'Activos', descripcion: `Activo creado: ${nombre} (${codigo_qr})`, ip: req.ip });
    res.status(201).json(result.rows[0]);
  } catch (error) { console.error(error); res.status(500).json({ mensaje: 'Error al crear activo' }); }
};

const actualizarActivo = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, marca, modelo, numero_serie, estado, ubicacion, id_categoria,
            valor_original, valor_residual, fecha_adquisicion, vida_util_custom } = req.body;

    const result = await pool.query(
      `UPDATE activos
       SET nombre            = COALESCE($1,  nombre),
           descripcion       = COALESCE($2,  descripcion),
           marca             = COALESCE($3,  marca),
           modelo            = COALESCE($4,  modelo),
           numero_serie      = COALESCE($5,  numero_serie),
           estado            = COALESCE($6,  estado),
           ubicacion         = COALESCE($7,  ubicacion),
           id_categoria      = COALESCE($8,  id_categoria),
           valor_original    = COALESCE($9,  valor_original),
           valor_residual    = COALESCE($10, valor_residual),
           fecha_adquisicion = COALESCE($11, fecha_adquisicion),
           vida_util_custom  = COALESCE($12, vida_util_custom)
       WHERE id_activo = $13 RETURNING *`,
      [nombre, descripcion, marca, modelo, numero_serie, estado, ubicacion, id_categoria,
       valor_original, valor_residual, fecha_adquisicion, vida_util_custom, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ mensaje: 'Activo no encontrado' });
    await registrarAccion({ id_usuario: req.usuario.id, nombre_usuario: req.usuario.nombre, accion: 'ACTUALIZAR', modulo: 'Activos', descripcion: `Activo actualizado: ID ${id}`, ip: req.ip });
    res.json(result.rows[0]);
  } catch (error) { console.error(error); res.status(500).json({ mensaje: 'Error al actualizar activo' }); }
};

const eliminarActivo = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM activos WHERE id_activo = $1', [id]);
    await registrarAccion({ id_usuario: req.usuario.id, nombre_usuario: req.usuario.nombre, accion: 'ELIMINAR', modulo: 'Activos', descripcion: `Activo eliminado: ID ${id}`, ip: req.ip });
    res.json({ mensaje: 'Activo eliminado correctamente' });
  } catch (error) { console.error(error); res.status(500).json({ mensaje: 'Error al eliminar activo' }); }
};

module.exports = { obtenerActivos, obtenerActivoPorId, obtenerActivoPorQR, crearActivo, actualizarActivo, eliminarActivo };
