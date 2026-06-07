const pool = require('../config/db');

const obtenerCategorias = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categorias ORDER BY nombre ASC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener categorías' });
  }
};

const crearCategoria = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre) return res.status(400).json({ mensaje: 'El nombre es requerido' });

    const result = await pool.query(
      'INSERT INTO categorias (nombre, descripcion) VALUES ($1,$2) RETURNING *',
      [nombre, descripcion]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear categoría' });
  }
};

const actualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    const result = await pool.query(
      `UPDATE categorias SET nombre = COALESCE($1, nombre), descripcion = COALESCE($2, descripcion)
       WHERE id_categoria = $3 RETURNING *`,
      [nombre, descripcion, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ mensaje: 'Categoría no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al actualizar categoría' });
  }
};

const eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM categorias WHERE id_categoria = $1', [id]);
    res.json({ mensaje: 'Categoría eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al eliminar categoría' });
  }
};

module.exports = { obtenerCategorias, crearCategoria, actualizarCategoria, eliminarCategoria };
