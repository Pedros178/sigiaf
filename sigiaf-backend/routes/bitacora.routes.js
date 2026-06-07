const router = require('express').Router();
const { verificarToken, soloAdmin } = require('../middlewares/auth.middleware');
const { obtenerBitacora } = require('../controllers/bitacora.controller');
router.get('/', verificarToken, soloAdmin, obtenerBitacora);
module.exports = router;
