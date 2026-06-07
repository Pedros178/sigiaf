const router = require('express').Router();
const { verificarToken } = require('../middlewares/auth.middleware');
const { obtenerMantenimientos, obtenerMantenimientosPorActivo, crearMantenimiento, actualizarMantenimiento, eliminarMantenimiento } = require('../controllers/mantenimientos.controller');
router.get('/', verificarToken, obtenerMantenimientos);
router.get('/activo/:id_activo', verificarToken, obtenerMantenimientosPorActivo);
router.post('/', verificarToken, crearMantenimiento);
router.put('/:id', verificarToken, actualizarMantenimiento);
router.delete('/:id', verificarToken, eliminarMantenimiento);
module.exports = router;
