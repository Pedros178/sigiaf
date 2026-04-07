import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Activos from './pages/Activos';
import Prestamos from './pages/Prestamos';
import Mantenimientos from './pages/Mantenimientos';
import Categorias from './pages/Categorias';
import Usuarios from './pages/Usuarios';
import ConsultaQR from './pages/ConsultaQR';
import Auditoria from './pages/Auditoria';
import Depreciacion from './pages/Depreciacion';
import Perfil from './pages/Perfil';
import Bitacora from './pages/Bitacora';
import BusquedaGlobal from './pages/BusquedaGlobal';

function PrivateRoute({ children }) {
  const { usuario } = useAuth();
  return usuario ? children : <Navigate to="/login" />;
}
function AdminRoute({ children }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" />;
  if (usuario.rol !== 'admin') return <Navigate to="/dashboard" />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ style: { fontFamily: "'Segoe UI', sans-serif", fontSize: '14px' } }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard"      element={<Dashboard />} />
            <Route path="busqueda"       element={<BusquedaGlobal />} />
            <Route path="activos"        element={<Activos />} />
            <Route path="consulta-qr"   element={<ConsultaQR />} />
            <Route path="prestamos"      element={<Prestamos />} />
            <Route path="mantenimientos" element={<Mantenimientos />} />
            <Route path="auditoria"      element={<Auditoria />} />
            <Route path="depreciacion"   element={<Depreciacion />} />
            <Route path="bitacora"       element={<AdminRoute><Bitacora /></AdminRoute>} />
            <Route path="categorias"     element={<Categorias />} />
            <Route path="perfil"         element={<Perfil />} />
            <Route path="usuarios"       element={<AdminRoute><Usuarios /></AdminRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
