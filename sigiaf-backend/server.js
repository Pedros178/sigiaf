const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',           require('./routes/auth.routes'));
app.use('/api/usuarios',       require('./routes/usuarios.routes'));
app.use('/api/activos',        require('./routes/activos.routes'));
app.use('/api/prestamos',      require('./routes/prestamos.routes'));
app.use('/api/mantenimientos', require('./routes/mantenimientos.routes'));
app.use('/api/categorias',     require('./routes/categorias.routes'));
app.use('/api/bitacora',       require('./routes/bitacora.routes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', sistema: 'SIGIAF', version: '2.0.0' });
});

app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor SIGIAF corriendo en http://localhost:${PORT}`);
});
