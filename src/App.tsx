import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login/Login';
import SelectEnvironment from './pages/SelectEnvironment/SelectEnvironment';
import Dashboard from './pages/Dashboard/Dashboard';
import Productos from './pages/Productos/Productos';
import Activos from './pages/Activos/Activos';
import Proveedores from './pages/Proveedores/Proveedores';
import CentrosCosto from './pages/CentrosCosto/CentrosCosto';
import Movimientos from './pages/Movimientos/Movimientos';
import Requisiciones from './pages/Requisiciones/Requisiciones';
import Bitacora from './pages/Bitacora/Bitacora';
import Catalogo from './pages/Catalogo/Catalogo';
import Usuarios from './pages/Usuarios/Usuarios';


const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading, user, currentEnvironment } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#7B4B27' }}>Cargando...</div>;
  if (!user) return <Navigate to="/login" />;
  if (!currentEnvironment) return <Navigate to="/select-environment" />;
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Cargando...</div>;
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

const EnvRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          {/* /forgot-password eliminado intencionalmente */}
          <Route path="/select-environment" element={<EnvRoute><SelectEnvironment /></EnvRoute>} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/productos" element={<ProtectedRoute><Productos /></ProtectedRoute>} />
          <Route path="/activos" element={<ProtectedRoute><Activos /></ProtectedRoute>} />
          <Route path="/proveedores" element={<ProtectedRoute><Proveedores /></ProtectedRoute>} />
          <Route path="/centros-costo" element={<ProtectedRoute><CentrosCosto /></ProtectedRoute>} />
          <Route path="/movimientos" element={<ProtectedRoute><Movimientos /></ProtectedRoute>} />
          <Route path="/requisiciones" element={<ProtectedRoute><Requisiciones /></ProtectedRoute>} />
          <Route path="/bitacora" element={<ProtectedRoute><Bitacora /></ProtectedRoute>} />
          <Route path="/catalogo" element={<ProtectedRoute><Catalogo /></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
