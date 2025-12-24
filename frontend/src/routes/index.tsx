/**
 * Rutas del Sistema ERP - Estructura de 6 Niveles
 *
 * NIVEL 1 - Estratégico: Dirección Estratégica
 * NIVEL 2 - Cumplimiento: Cumplimiento, Riesgos, Workflows
 * NIVEL 3 - Torre de Control: Gestión HSEQ
 * NIVEL 4 - Cadena de Valor: Supply Chain, Producción, Logística, Ventas
 * NIVEL 5 - Habilitadores: Talento, Finanzas, Contabilidad
 * NIVEL 6 - Inteligencia: Analítica, Auditoría
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SmartRedirect } from '@/components/common/SmartRedirect';

// ==================== NIVEL 1: DIRECCIÓN ESTRATÉGICA ====================
import UsersPage from '@/features/users/pages/UsersPage';
import {
  ConfiguracionPage,
  OrganizacionPage,
  IdentidadPage,
  PlaneacionPage,
} from '@/features/gestion-estrategica';

// ==================== NIVEL 2: CUMPLIMIENTO ====================
// Motor de Cumplimiento - Próximamente (en features/cumplimiento)
// Motor de Riesgos
import {
  RiesgosPage,
  ContextoOrganizacionalPage,
  RiesgosProcesosPage,
  IPEVRPage,
  AspectosAmbientalesPage,
  RiesgosVialesPage,
  SagrilaftPteePage,
  SeguridadInformacionPage,
} from '@/features/riesgos';

// Workflows Engine
import {
  WorkflowsPage,
  DisenadorFlujosPage,
  EjecucionPage,
  MonitoreoPage,
} from '@/features/workflows';

// ==================== NIVEL 3: TORRE DE CONTROL (HSEQ) ====================
import {
  HSEQPage,
  SistemaDocumentalPage,
  PlanificacionSistemaPage,
  CalidadPage,
  MedicinaLaboralPage,
  SeguridadIndustrialPage,
  HigieneIndustrialPage,
  GestionComitesPage,
  AccidentalidadPage,
  EmergenciasPage,
  GestionAmbientalPage,
  MejoraContinuaPage,
} from '@/features/hseq';

// ==================== NIVEL 4: CADENA DE VALOR ====================
// Supply Chain (Proveedores legacy → será refactorizado a supply_chain)
import MateriaPrimaPage from '@/features/proveedores/pages/MateriaPrimaPage';
import ProductosServiciosPage from '@/features/proveedores/pages/ProductosServiciosPage';
import PruebasAcidezPage from '@/features/proveedores/pages/PruebasAcidezPage';

// Logistics & Fleet - Próximamente
// Sales & CRM - Próximamente

// ==================== NIVEL 5: HABILITADORES ====================
// Centro de Talento - Próximamente
// Administración y Finanzas - Próximamente
// Contabilidad - Próximamente

// ==================== NIVEL 6: INTELIGENCIA ====================
// Analítica - Próximamente
// Sistema de Auditoría - Próximamente

export const AppRoutes = () => {
  return (
    <Routes>
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* RUTAS PÚBLICAS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Route path="/login" element={<LoginPage />} />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* RUTAS PROTEGIDAS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* NIVEL 1: DIRECCIÓN ESTRATÉGICA */}
          {/* Código: Gestion_Estrategica */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Route
            path="/gestion-estrategica"
            element={<Navigate to="/gestion-estrategica/configuracion" replace />}
          />

          {/* Tab 1: Configuración */}
          <Route path="/gestion-estrategica/configuracion" element={<ConfiguracionPage />} />

          {/* Tab 2: Organización */}
          <Route path="/gestion-estrategica/organizacion" element={<OrganizacionPage />} />

          {/* Tab 3: Identidad Corporativa */}
          <Route path="/gestion-estrategica/identidad" element={<IdentidadPage />} />

          {/* Tab 4: Planeación Estratégica */}
          <Route path="/gestion-estrategica/planeacion" element={<PlaneacionPage />} />

          {/* Tab 5: Gestión de Proyectos (PMI) - Próximamente */}
          <Route
            path="/gestion-estrategica/proyectos"
            element={<div className="p-8 text-center text-gray-500">Gestión de Proyectos (PMI) - Próximamente</div>}
          />

          {/* Tab 6: Revisión por Dirección - Próximamente */}
          <Route
            path="/gestion-estrategica/revision-direccion"
            element={<div className="p-8 text-center text-gray-500">Revisión por Dirección - Próximamente</div>}
          />

          {/* Usuarios - Módulo transversal dentro de Dirección Estratégica */}
          <Route path="/usuarios" element={<UsersPage />} />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* NIVEL 2: CUMPLIMIENTO */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          {/* Módulo: Motor de Cumplimiento (motor_cumplimiento) - Próximamente */}
          <Route
            path="/cumplimiento"
            element={<div className="p-8 text-center text-gray-500">Motor de Cumplimiento - Próximamente</div>}
          />
          <Route
            path="/cumplimiento/matriz-legal"
            element={<div className="p-8 text-center text-gray-500">Matriz Legal - Próximamente</div>}
          />
          <Route
            path="/cumplimiento/requisitos-legales"
            element={<div className="p-8 text-center text-gray-500">Requisitos Legales - Próximamente</div>}
          />
          <Route
            path="/cumplimiento/partes-interesadas"
            element={<div className="p-8 text-center text-gray-500">Partes Interesadas - Próximamente</div>}
          />
          <Route
            path="/cumplimiento/reglamentos-internos"
            element={<div className="p-8 text-center text-gray-500">Reglamentos Internos - Próximamente</div>}
          />

          {/* Módulo: Motor de Riesgos (motor_riesgos) */}
          <Route
            path="/riesgos"
            element={<RiesgosPage />}
          />
          <Route path="/riesgos/contexto" element={<ContextoOrganizacionalPage />} />
          <Route path="/riesgos/procesos" element={<RiesgosProcesosPage />} />
          <Route path="/riesgos/ipevr" element={<IPEVRPage />} />
          <Route path="/riesgos/ambientales" element={<AspectosAmbientalesPage />} />
          <Route path="/riesgos/viales" element={<RiesgosVialesPage />} />
          <Route path="/riesgos/sagrilaft" element={<SagrilaftPteePage />} />
          <Route path="/riesgos/seguridad-info" element={<SeguridadInformacionPage />} />

          {/* Módulo: Flujos de Trabajo (workflow_engine) */}
          <Route path="/workflows" element={<WorkflowsPage />} />
          <Route path="/workflows/disenador" element={<DisenadorFlujosPage />} />
          <Route path="/workflows/ejecucion" element={<EjecucionPage />} />
          <Route path="/workflows/monitoreo" element={<MonitoreoPage />} />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* NIVEL 3: TORRE DE CONTROL (HSEQ MANAGEMENT) */}
          {/* Código: hseq_management */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Route
            path="/hseq"
            element={<Navigate to="/hseq/dashboard" replace />}
          />
          <Route path="/hseq/dashboard" element={<HSEQPage />} />

          {/* Tab 1: Sistema Documental */}
          <Route path="/hseq/sistema-documental" element={<SistemaDocumentalPage />} />

          {/* Tab 2: Planificación Sistema */}
          <Route path="/hseq/planificacion" element={<PlanificacionSistemaPage />} />

          {/* Tab 3: Calidad */}
          <Route path="/hseq/calidad" element={<CalidadPage />} />

          {/* Tab 4: Medicina Laboral */}
          <Route path="/hseq/medicina-laboral" element={<MedicinaLaboralPage />} />

          {/* Tab 5: Seguridad Industrial */}
          <Route path="/hseq/seguridad-industrial" element={<SeguridadIndustrialPage />} />

          {/* Tab 6: Higiene Industrial */}
          <Route path="/hseq/higiene-industrial" element={<HigieneIndustrialPage />} />

          {/* Tab 7: Gestión de Comités */}
          <Route path="/hseq/comites" element={<GestionComitesPage />} />

          {/* Tab 8: Accidentalidad (ATEL) */}
          <Route path="/hseq/accidentalidad" element={<AccidentalidadPage />} />

          {/* Tab 9: Emergencias */}
          <Route path="/hseq/emergencias" element={<EmergenciasPage />} />

          {/* Tab 10: Gestión Ambiental */}
          <Route path="/hseq/gestion-ambiental" element={<GestionAmbientalPage />} />

          {/* Tab 11: Mejora Continua */}
          <Route path="/hseq/mejora-continua" element={<MejoraContinuaPage />} />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* NIVEL 4: CADENA DE VALOR */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          {/* Módulo: Cadena de Suministro (supply_chain) */}
          {/* NOTA: proveedores/ y econorte/ son legacy, serán refactorizados */}

          {/* Proveedores (legacy - temporal hasta refactor) */}
          <Route
            path="/proveedores"
            element={<Navigate to="/proveedores/materia-prima" replace />}
          />
          <Route path="/proveedores/materia-prima" element={<MateriaPrimaPage />} />
          <Route path="/proveedores/productos-servicios" element={<ProductosServiciosPage />} />
          <Route path="/proveedores/pruebas-acidez" element={<PruebasAcidezPage />} />

          {/* Módulo: Operaciones de Producción (production_ops) - Próximamente */}
          <Route
            path="/produccion"
            element={<div className="p-8 text-center text-gray-500">Base de Operaciones - Próximamente</div>}
          />

          {/* Módulo: Logística y Flota (logistics_fleet) - Próximamente */}
          <Route
            path="/logistica"
            element={<div className="p-8 text-center text-gray-500">Logística y Flota - Próximamente</div>}
          />

          {/* Módulo: Ventas y CRM (sales_crm) - Próximamente */}
          <Route
            path="/ventas"
            element={<div className="p-8 text-center text-gray-500">Ventas y CRM - Próximamente</div>}
          />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* NIVEL 5: HABILITADORES */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          {/* Módulo: Centro de Talento (talent_hub) - Próximamente */}
          <Route
            path="/talento"
            element={<div className="p-8 text-center text-gray-500">Centro de Talento - Próximamente</div>}
          />

          {/* Módulo: Administración y Finanzas (admin_finance) - Próximamente */}
          <Route
            path="/finanzas"
            element={<div className="p-8 text-center text-gray-500">Administración y Finanzas - Próximamente</div>}
          />

          {/* Módulo: Contabilidad (accounting) - Próximamente */}
          <Route
            path="/contabilidad"
            element={<div className="p-8 text-center text-gray-500">Contabilidad - Próximamente</div>}
          />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* NIVEL 6: INTELIGENCIA */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          {/* Módulo: Analítica (analytics) - Próximamente */}
          <Route
            path="/analitica"
            element={<div className="p-8 text-center text-gray-500">Analítica - Próximamente</div>}
          />

          {/* Módulo: Sistema de Auditoría (audit_system) - Próximamente */}
          <Route
            path="/auditoria"
            element={<div className="p-8 text-center text-gray-500">Sistema de Auditoría - Próximamente</div>}
          />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* RUTAS LEGACY - DEPRECADAS (Mantener temporalmente para compatibilidad) */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          {/* Redirigir rutas antiguas a nuevas ubicaciones */}
          <Route path="/motor-operaciones/*" element={<Navigate to="/proveedores" replace />} />
          <Route path="/gestion-integral/*" element={<Navigate to="/hseq" replace />} />
          <Route path="/cadena-valor/*" element={<Navigate to="/proveedores" replace />} />
          <Route path="/procesos-apoyo/*" element={<Navigate to="/talento" replace />} />
          <Route path="/inteligencia/*" element={<Navigate to="/analitica" replace />} />
          <Route path="/sst/*" element={<Navigate to="/hseq" replace />} />
          <Route path="/reportes" element={<Navigate to="/analitica" replace />} />

        </Route>
      </Route>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SMART REDIRECT Y 404 */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      {/* Smart Redirect - Landing inteligente según rol y última ruta */}
      <Route path="/" element={<SmartRedirect />} />
      <Route path="/dashboard" element={<SmartRedirect />} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
