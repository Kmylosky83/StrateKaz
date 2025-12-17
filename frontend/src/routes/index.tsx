import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SmartRedirect } from '@/components/common/SmartRedirect';
import UsersPage from '@/features/users/pages/UsersPage';
import MateriaPrimaPage from '@/features/proveedores/pages/MateriaPrimaPage';
import ProductosServiciosPage from '@/features/proveedores/pages/ProductosServiciosPage';
import PruebasAcidezPage from '@/features/proveedores/pages/PruebasAcidezPage';
import { EcoNortePage } from '@/features/econorte';
import { RecepcionPlantaPage } from '@/features/recepciones';
import { SSTPage } from '@/features/sst';
import {
  ConfiguracionPage,
  OrganizacionPage,
  IdentidadPage,
  PlaneacionPage,
} from '@/features/gestion-estrategica';
import { MotorOperacionesPage } from '@/features/motor-operaciones';
import { GestionIntegralPage } from '@/features/gestion-integral';
import { CadenaValorPage } from '@/features/cadena-valor';
import { ProcesosApoyoPage } from '@/features/procesos-apoyo';
import { InteligenciaNegociosPage } from '@/features/inteligencia-negocios';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* MODULO 1: GESTION ESTRATEGICA - Cada tab es una ruta separada */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Route path="/gestion-estrategica" element={<Navigate to="/gestion-estrategica/configuracion" replace />} />
          <Route path="/gestion-estrategica/configuracion" element={<ConfiguracionPage />} />
          <Route path="/gestion-estrategica/organizacion" element={<OrganizacionPage />} />
          <Route path="/gestion-estrategica/identidad" element={<IdentidadPage />} />
          <Route path="/gestion-estrategica/planeacion" element={<PlaneacionPage />} />

          {/* Usuarios - Módulo independiente dentro de Dirección Estratégica */}
          <Route path="/usuarios" element={<UsersPage />} />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* MODULO 2: MOTOR DE OPERACIONES */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Route path="/motor-operaciones" element={<Navigate to="/motor-operaciones/abastecimiento" replace />} />
          <Route path="/motor-operaciones/abastecimiento" element={<MotorOperacionesPage />} />
          <Route path="/motor-operaciones/planta-motor" element={<div className="p-8 text-center text-gray-500">Operaciones Planta - Próximamente</div>} />
          <Route path="/motor-operaciones/comercializacion" element={<div className="p-8 text-center text-gray-500">Comercialización - Próximamente</div>} />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* MODULO 3: GESTION INTEGRAL */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Route path="/gestion-integral" element={<Navigate to="/gestion-integral/sst" replace />} />
          <Route path="/gestion-integral/sst" element={<SSTPage />} />
          <Route path="/gestion-integral/pesv" element={<div className="p-8 text-center text-gray-500">PESV - Próximamente</div>} />
          <Route path="/gestion-integral/calidad" element={<div className="p-8 text-center text-gray-500">ISO 9001 - Próximamente</div>} />
          <Route path="/gestion-integral/ambiental" element={<div className="p-8 text-center text-gray-500">ISO 14001 - Próximamente</div>} />

          {/* SST Sub-rutas */}
          <Route path="/sst" element={<Navigate to="/gestion-integral/sst" replace />} />
          <Route path="/sst/recursos" element={<div className="p-8 text-center text-gray-500">Módulo Recursos SST - Próximamente</div>} />
          <Route path="/sst/gestion-integral" element={<div className="p-8 text-center text-gray-500">Módulo Gestión Integral SG-SST - Próximamente</div>} />
          <Route path="/sst/gestion-salud" element={<div className="p-8 text-center text-gray-500">Módulo Gestión de la Salud - Próximamente</div>} />
          <Route path="/sst/peligros-riesgos" element={<div className="p-8 text-center text-gray-500">Módulo Peligros y Riesgos - Próximamente</div>} />
          <Route path="/sst/amenazas" element={<div className="p-8 text-center text-gray-500">Módulo Amenazas - Próximamente</div>} />
          <Route path="/sst/verificacion" element={<div className="p-8 text-center text-gray-500">Módulo Verificación - Próximamente</div>} />
          <Route path="/sst/mejoramiento" element={<div className="p-8 text-center text-gray-500">Módulo Mejoramiento - Próximamente</div>} />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* MODULO 4: CADENA DE VALOR (Nivel Misional) */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          {/* Proveedores */}
          <Route path="/proveedores" element={<Navigate to="/proveedores/materia-prima" replace />} />
          <Route path="/proveedores/materia-prima" element={<MateriaPrimaPage />} />
          <Route path="/proveedores/productos-servicios" element={<ProductosServiciosPage />} />
          <Route path="/proveedores/pruebas-acidez" element={<PruebasAcidezPage />} />

          {/* EcoNorte */}
          <Route path="/econorte" element={<Navigate to="/econorte/ecoaliados" replace />} />
          <Route path="/econorte/ecoaliados" element={<EcoNortePage />} />
          <Route path="/econorte/programaciones" element={<EcoNortePage />} />
          <Route path="/econorte/recolecciones" element={<EcoNortePage />} />

          {/* Planta */}
          <Route path="/planta" element={<Navigate to="/planta/recepciones" replace />} />
          <Route path="/planta/recepciones" element={<RecepcionPlantaPage />} />
          <Route path="/planta/lotes" element={<div className="p-8 text-center text-gray-500">Lotes de Planta - Próximamente</div>} />

          {/* Reportes */}
          <Route path="/reportes" element={<div className="p-8 text-center text-gray-500">Reportes - Próximamente</div>} />

          {/* Cadena de Valor */}
          <Route path="/cadena-valor" element={<Navigate to="/cadena-valor/trazabilidad" replace />} />
          <Route path="/cadena-valor/trazabilidad" element={<CadenaValorPage />} />
          <Route path="/cadena-valor/calidad-cv" element={<div className="p-8 text-center text-gray-500">Control de Calidad - Próximamente</div>} />
          <Route path="/cadena-valor/certificaciones" element={<div className="p-8 text-center text-gray-500">Certificaciones - Próximamente</div>} />
          <Route path="/cadena-valor/logistica" element={<div className="p-8 text-center text-gray-500">Logística - Próximamente</div>} />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* MODULO 5: PROCESOS DE APOYO */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Route path="/procesos-apoyo" element={<Navigate to="/procesos-apoyo/talento-humano" replace />} />
          <Route path="/procesos-apoyo/talento-humano" element={<ProcesosApoyoPage />} />
          <Route path="/procesos-apoyo/financiero" element={<div className="p-8 text-center text-gray-500">Financiero - Próximamente</div>} />
          <Route path="/procesos-apoyo/tecnologia" element={<div className="p-8 text-center text-gray-500">Tecnología - Próximamente</div>} />
          <Route path="/procesos-apoyo/juridico" element={<div className="p-8 text-center text-gray-500">Jurídico - Próximamente</div>} />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* MODULO 6: INTELIGENCIA DE NEGOCIOS */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Route path="/inteligencia" element={<Navigate to="/inteligencia/dashboards" replace />} />
          <Route path="/inteligencia/dashboards" element={<InteligenciaNegociosPage />} />
          <Route path="/inteligencia/reportes-bi" element={<div className="p-8 text-center text-gray-500">Reportes BI - Próximamente</div>} />
          <Route path="/inteligencia/analytics" element={<div className="p-8 text-center text-gray-500">Analytics - Próximamente</div>} />
          <Route path="/inteligencia/data-warehouse" element={<div className="p-8 text-center text-gray-500">Data Warehouse - Próximamente</div>} />

        </Route>
      </Route>

      {/* Smart Redirect - Landing inteligente según rol y última ruta */}
      <Route path="/" element={<SmartRedirect />} />
      <Route path="/dashboard" element={<SmartRedirect />} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
