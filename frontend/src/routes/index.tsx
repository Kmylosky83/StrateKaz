import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import UsersPage from '@/features/users/pages/UsersPage';
import MateriaPrimaPage from '@/features/proveedores/pages/MateriaPrimaPage';
import ProductosServiciosPage from '@/features/proveedores/pages/ProductosServiciosPage';
import PruebasAcidezPage from '@/features/proveedores/pages/PruebasAcidezPage';
import { EcoNortePage } from '@/features/econorte';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/usuarios" element={<UsersPage />} />

          {/* Proveedores - Submódulos */}
          <Route path="/proveedores" element={<Navigate to="/proveedores/materia-prima" replace />} />
          <Route path="/proveedores/materia-prima" element={<MateriaPrimaPage />} />
          <Route path="/proveedores/productos-servicios" element={<ProductosServiciosPage />} />
          <Route path="/proveedores/pruebas-acidez" element={<PruebasAcidezPage />} />

          {/* EcoNorte - Submódulo de Proveedores con tabs */}
          <Route path="/proveedores/econorte" element={<EcoNortePage />} />

          {/* Redirects para compatibilidad con rutas antiguas */}
          <Route path="/econorte" element={<Navigate to="/proveedores/econorte" replace />} />
          <Route path="/proveedores/ecoaliados" element={<Navigate to="/proveedores/econorte" replace />} />
          <Route path="/ecoaliados" element={<Navigate to="/proveedores/econorte" replace />} />
          <Route path="/programaciones" element={<Navigate to="/proveedores/econorte" replace />} />
          <Route path="/recolecciones" element={<Navigate to="/proveedores/econorte" replace />} />
        </Route>
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
