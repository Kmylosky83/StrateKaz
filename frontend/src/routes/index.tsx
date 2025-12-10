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
import { RecepcionPlantaPage } from '@/features/recepciones';
import { SSTPage } from '@/features/sst';

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

          {/* Planta - Operaciones de procesamiento */}
          <Route path="/planta" element={<Navigate to="/planta/recepciones" replace />} />
          <Route path="/planta/recepciones" element={<RecepcionPlantaPage />} />
          <Route path="/planta/lotes" element={<div>Lotes de Planta - Próximamente</div>} />

          {/* SST - Seguridad y Salud en el Trabajo */}
          <Route path="/sst" element={<SSTPage />} />
          <Route path="/sst/recursos" element={<div className="p-8 text-center text-gray-500">Módulo Recursos SST - Próximamente</div>} />
          <Route path="/sst/gestion-integral" element={<div className="p-8 text-center text-gray-500">Módulo Gestión Integral SG-SST - Próximamente</div>} />
          <Route path="/sst/gestion-salud" element={<div className="p-8 text-center text-gray-500">Módulo Gestión de la Salud - Próximamente</div>} />
          <Route path="/sst/peligros-riesgos" element={<div className="p-8 text-center text-gray-500">Módulo Peligros y Riesgos - Próximamente</div>} />
          <Route path="/sst/amenazas" element={<div className="p-8 text-center text-gray-500">Módulo Amenazas - Próximamente</div>} />
          <Route path="/sst/verificacion" element={<div className="p-8 text-center text-gray-500">Módulo Verificación - Próximamente</div>} />
          <Route path="/sst/mejoramiento" element={<div className="p-8 text-center text-gray-500">Módulo Mejoramiento - Próximamente</div>} />

          {/* Calidad - Sistema de Gestión de Calidad */}
          <Route path="/calidad" element={<div className="p-8 text-center text-gray-500">Módulo Calidad - Próximamente</div>} />

          {/* Ambiental - Sistema de Gestión Ambiental */}
          <Route path="/ambiental" element={<div className="p-8 text-center text-gray-500">Módulo Ambiental - Próximamente</div>} />

          {/* Redirects para compatibilidad con rutas antiguas */}
          <Route path="/lotes" element={<Navigate to="/planta/lotes" replace />} />
          <Route path="/recepciones" element={<Navigate to="/planta/recepciones" replace />} />
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
