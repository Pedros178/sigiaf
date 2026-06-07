const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const obtenerUsuarios = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id_usuario, u.nombre, u.correo, u.activo, u.fecha_creacion, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON u.id_rol = r.id_rol
       ORDER BY u.fecha_creacion DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener usuarios' });
  }
};

const obtenerUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT u.id_usuario, u.nombre, u.correo, u.activo, u.fecha_creacion, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON u.id_rol = r.id_rol
       WHERE u.id_usuario = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener usuario' });
  }
};

const crearUsuario = async (req, res) => {
  try {
    const { nombre, correo, password, id_rol } = req.body;

    if (!nombre || !correo || !password || !id_rol) {
      return res.status(400).json({ mensaje: 'Todos los campos son requeridos' });
    }

    const existe = await pool.query('SELECT id_usuario FROM usuarios WHERE correo = $1', [correo]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ mensaje: 'El correo ya está registrado' });
    }

    const hash = bcrypt.hashSync(password, 10);

    const result = await pool.query(
      `INSERT INTO usuarios (nombre, correo, password, id_rol)
       VALUES ($1, $2, $3, $4)
       RETURNING id_usuario, nombre, correo, activo, fecha_creacion`,
      [nombre, correo, hash, id_rol]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear usuario' });
  }
};

const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, correo, id_rol, activo } = req.body;

    const result = await pool.query(
      `UPDATE usuarios
       SET nombre = COALESCE($1, nombre),
           correo = COALESCE($2, correo),
           id_rol = COALESCE($3, id_rol),
           activo = COALESCE($4, activo)
       WHERE id_usuario = $5
       RETURNING id_usuario, nombre, correo, activo`,
      [nombre, correo, id_rol, activo, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al actualizar usuario' });
  }
};

const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE usuarios SET activo = false WHERE id_usuario = $1', [id]);
    res.json({ mensaje: 'Usuario desactivado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al eliminar usuario' });
  }
};

const cambiarPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password_actual, password_nueva } = req.body;

    if (!password_actual || !password_nueva) {
      return res.status(400).json({ mensaje: 'Ambas contraseñas son requeridas' });
    }
    if (password_nueva.length < 6) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const result = await pool.query('SELECT password FROM usuarios WHERE id_usuario = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const valido = bcrypt.compareSync(password_actual, result.rows[0].password);
    if (!valido) {
      return res.status(401).json({ mensaje: 'La contraseña actual es incorrecta' });
    }

    const hash = bcrypt.hashSync(password_nueva, 10);
    await pool.query('UPDATE usuarios SET password = $1 WHERE id_usuario = $2', [hash, id]);
    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al cambiar contraseña' });
  }
};

module.exports = {
  obtenerUsuarios, obtenerUsuarioPorId, crearUsuario,
  actualizarUsuario, eliminarUsuario, cambiarPassword,
};
