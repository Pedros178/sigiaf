const router = require('express').Router();
const { verificarToken, soloAdmin } = require('../middlewares/auth.middleware');
const {
  obtenerUsuarios, obtenerUsuarioPorId, crearUsuario,
  actualizarUsuario, eliminarUsuario, cambiarPassword,
} = require('../controllers/usuarios.controller');

router.get('/',    verificarToken, soloAdmin, obtenerUsuarios);
router.get('/:id', verificarToken, obtenerUsuarioPorId);
router.post('/',   verificarToken, soloAdmin, crearUsuario);
router.put('/:id', verificarToken, actualizarUsuario);
router.put('/:id/password', verificarToken, cambiarPassword);
router.delete('/:id', verificarToken, soloAdmin, eliminarUsuario);

module.exports = router;
