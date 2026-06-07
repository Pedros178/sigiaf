const pool = require('../config/db');
const { registrarAccion } = require('./bitacora.controller');

// Genera un SKU único: PREFIJO-AÑO-SECUENCIAL
async function generarSKU(prefijo = 'ACT') {
  const year = new Date().getFullYear().toString().slice(2);
  const res = await pool.query('SELECT COUNT(*) FROM activos');
  const seq = String(parseInt(res.rows[0].count) + 1).padStart(4, '0');
  return `${prefijo}-${year}-${seq}`;
}

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
    const { codigo_qr, nombre, descripcion, marca, modelo, numero_serie, estado, ubicacion, id_categoria, sku, tecnologico, departamento, oficina } = req.body;
    if (!codigo_qr || !nombre || !estado || !id_categoria) {
      return res.status(400).json({ mensaje: 'codigo_qr, nombre, estado e id_categoria son requeridos' });
    }
    const existe = await pool.query('SELECT id_activo FROM activos WHERE codigo_qr = $1', [codigo_qr]);
    if (existe.rows.length > 0) return res.status(400).json({ mensaje: 'El código QR ya existe' });

    // Generar SKU automático si no se proporcionó
    const skuFinal = sku || await generarSKU();

    // Verificar columnas adicionales existen
    try {
      await pool.query('SELECT sku, tecnologico, departamento, oficina FROM activos LIMIT 1');
    } catch {
      await pool.query('ALTER TABLE activos ADD COLUMN IF NOT EXISTS sku VARCHAR(60) UNIQUE');
      await pool.query('ALTER TABLE activos ADD COLUMN IF NOT EXISTS tecnologico VARCHAR(120)');
      await pool.query('ALTER TABLE activos ADD COLUMN IF NOT EXISTS departamento VARCHAR(120)');
      await pool.query('ALTER TABLE activos ADD COLUMN IF NOT EXISTS oficina VARCHAR(120)');
    }

    const result = await pool.query(
      `INSERT INTO activos (codigo_qr, nombre, descripcion, marca, modelo, numero_serie, estado, ubicacion, id_categoria, sku, tecnologico, departamento, oficina)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [codigo_qr, nombre, descripcion, marca, modelo, numero_serie, estado, ubicacion, id_categoria, skuFinal, tecnologico, departamento, oficina]
    );
    await registrarAccion({ id_usuario: req.usuario.id, nombre_usuario: req.usuario.nombre, accion: 'CREAR', modulo: 'Activos', descripcion: `Activo creado: ${nombre} (${codigo_qr}) SKU: ${skuFinal}`, ip: req.ip });
    res.status(201).json(result.rows[0]);
  } catch (error) { console.error(error); res.status(500).json({ mensaje: 'Error al crear activo' }); }
};

const actualizarActivo = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, marca, modelo, numero_serie, estado, ubicacion, id_categoria,
            valor_original, valor_residual, fecha_adquisicion, vida_util_custom, sku,
            tecnologico, departamento, oficina } = req.body;

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
           vida_util_custom  = COALESCE($12, vida_util_custom),
           sku               = COALESCE($13, sku),
           tecnologico       = COALESCE($14, tecnologico),
           departamento      = COALESCE($15, departamento),
           oficina           = COALESCE($16, oficina)
       WHERE id_activo = $17 RETURNING *`,
      [nombre, descripcion, marca, modelo, numero_serie, estado, ubicacion, id_categoria,
       valor_original, valor_residual, fecha_adquisicion, vida_util_custom, sku,
       tecnologico, departamento, oficina, id]
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

// Importación masiva de activos desde Excel/XML
const importarActivos = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const activos = req.body.activos;
    if (!Array.isArray(activos) || activos.length === 0) {
      return res.status(400).json({ mensaje: 'No se enviaron activos para importar' });
    }

    // Asegurar columna SKU existe
    await client.query('ALTER TABLE activos ADD COLUMN IF NOT EXISTS sku VARCHAR(60) UNIQUE');

    const resultados = { insertados: 0, omitidos: 0, errores: [] };

    for (const a of activos) {
      try {
        if (!a.nombre || !a.id_categoria) {
          resultados.omitidos++;
          resultados.errores.push(`Fila sin nombre o categoría: ${JSON.stringify(a)}`);
          continue;
        }
        const timestamp = Date.now().toString(36).toUpperCase();
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        const codigoQR = a.codigo_qr || `ACT-${timestamp}-${rand}`;
        const skuAuto = a.sku || await generarSKU();

        // Verificar duplicado
        const dup = await client.query('SELECT id_activo FROM activos WHERE codigo_qr = $1', [codigoQR]);
        if (dup.rows.length > 0) { resultados.omitidos++; continue; }

        await client.query(
          `INSERT INTO activos (codigo_qr, nombre, descripcion, marca, modelo, numero_serie, estado, ubicacion, id_categoria, sku, tecnologico, departamento, oficina)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
          [codigoQR, a.nombre, a.descripcion || '', a.marca || '', a.modelo || '',
           a.numero_serie || '', a.estado || 'Disponible', a.ubicacion || '', a.id_categoria, skuAuto,
           a.tecnologico || '', a.departamento || '', a.oficina || '']
        );
        resultados.insertados++;
      } catch (err) {
        resultados.omitidos++;
        resultados.errores.push(err.message);
      }
    }

    await client.query('COMMIT');
    await registrarAccion({ id_usuario: req.usuario.id, nombre_usuario: req.usuario.nombre, accion: 'IMPORTAR', modulo: 'Activos', descripcion: `Importación masiva: ${resultados.insertados} insertados, ${resultados.omitidos} omitidos`, ip: req.ip });
    res.json(resultados);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ mensaje: 'Error en la importación' });
  } finally {
    client.release();
  }
};

module.exports = { obtenerActivos, obtenerActivoPorId, obtenerActivoPorQR, crearActivo, actualizarActivo, eliminarActivo, importarActivos };
