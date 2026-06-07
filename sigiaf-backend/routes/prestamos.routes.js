const router = require('express').Router();
const { verificarToken } = require('../middlewares/auth.middleware');
const { obtenerPrestamos, obtenerPrestamosActivos, obtenerPrestamoPorId, crearPrestamo, devolverActivo } = require('../controllers/prestamos.controller');
router.get('/', verificarToken, obtenerPrestamos);
router.get('/activos', verificarToken, obtenerPrestamosActivos);
router.get('/:id', verificarToken, obtenerPrestamoPorId);
router.post('/', verificarToken, crearPrestamo);
router.put('/:id/devolver', verificarToken, devolverActivo);
module.exports = router;
