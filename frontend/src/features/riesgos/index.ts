/**
 * Motor de Riesgos - Feature Module
 * Sistema de Gestión Grasas y Huesos del Norte
 *
 * Exportación centralizada de:
 * - Pages
 * - Tipos TypeScript
 * - API clients
 * - Hooks React Query
 * - Componentes UI
 */

// ==================== PAGES ====================
export { default as RiesgosPage } from './pages/RiesgosPage';
export { default as ContextoOrganizacionalPage } from './pages/ContextoOrganizacionalPage';
export { default as RiesgosProcesosPage } from './pages/RiesgosProcesosPage';
export { default as IPEVRPage } from './pages/IPEVRPage';
export { default as AspectosAmbientalesPage } from './pages/AspectosAmbientalesPage';
export { default as RiesgosVialesPage } from './pages/RiesgosVialesPage';
export { default as SagrilaftPteePage } from './pages/SagrilaftPteePage';
export { default as SeguridadInformacionPage } from './pages/SeguridadInformacionPage';

// ==================== TIPOS ====================
export * from './types';

// ==================== API CLIENTS ====================
export * from './api';

// ==================== HOOKS ====================
export * from './hooks';

// ==================== COMPONENTES CONTEXTO ====================
export { MatrizDOFAVisual } from './components/contexto/MatrizDOFAVisual';
export { EstrategiasTOWSGrid } from './components/contexto/EstrategiasTOWSGrid';
export { PESTELChart } from './components/contexto/PESTELChart';
export { PorterDiagram } from './components/contexto/PorterDiagram';

// ==================== COMPONENTES RIESGOS ====================
export { MapaCalorRiesgos } from './components/riesgos/MapaCalorRiesgos';
export { RiesgoCard } from './components/riesgos/RiesgoCard';

// ==================== COMPONENTES IPEVR ====================
export { MatrizGTC45Table } from './components/ipevr/MatrizGTC45Table';
export { NivelRiesgoIndicator } from './components/ipevr/NivelRiesgoIndicator';
export { ResumenIPEVRCards } from './components/ipevr/ResumenIPEVRCards';
