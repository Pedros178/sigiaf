const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { registrarAccion } = require('./bitacora.controller');
require('dotenv').config();

const login = async (req, res) => {
  try {
    const { correo, password } = req.body;
    if (!correo || !password) {
      return res.status(400).json({ mensaje: 'Correo y contraseña son requeridos' });
    }

    const result = await pool.query(
      `SELECT u.*, r.nombre AS rol 
       FROM usuarios u 
       JOIN roles r ON u.id_rol = r.id_rol 
       WHERE u.correo = $1 AND u.activo = true`,
      [correo]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

    const usuario = result.rows[0];
    const valido = bcrypt.compareSync(password, usuario.password);
    if (!valido) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { id: usuario.id_usuario, nombre: usuario.nombre, rol: usuario.rol },
      process.env.JWT_SECRET || 'sigiaf_secreto_2024',
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    await registrarAccion({
      id_usuario: usuario.id_usuario,
      nombre_usuario: usuario.nombre,
      accion: 'LOGIN',
      modulo: 'Autenticación',
      descripcion: `Inicio de sesión exitoso — rol: ${usuario.rol}`,
      ip: req.ip,
    });

    res.json({
      token,
      usuario: { id: usuario.id_usuario, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = { login };
