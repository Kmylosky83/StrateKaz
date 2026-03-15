/**
 * Estructura de Cargos - Componentes compartidos
 *
 * REORG-B: Cargos y Organigrama se movieron a Fundación → Mi Organización.
 * Solo quedan componentes auxiliares reutilizables.
 */

// Badge de nivel jerárquico (usado en tablas de cargos y colaboradores)
export { CargoLevelBadge } from './CargoLevelBadge';

// Re-exports de configuracion (para consumo en Talent Hub donde aún se necesiten)
export { CargoFormModal } from '@/features/configuracion/components/CargoFormModal';
