/**
 * Estructura de Cargos - Componentes
 *
 * EstructuraSection es el componente principal con DynamicSections:
 * - Sub-tab Cargos: CRUD de cargos (CargosSection)
 * - Sub-tab Organigrama: Visualizacion jerarquica (OrganigramaSection)
 *
 * Los componentes originales siguen en features/configuracion/components/
 * y se re-exportan aqui hasta completar la migracion completa.
 */

// Componente principal con sub-navegacion
export { EstructuraSection } from './EstructuraSection';

// Sub-componentes (usados internamente por EstructuraSection)
export { CargosTab as CargosSection } from '@/features/configuracion/components/CargosTab';
export { CargoFormModal } from '@/features/configuracion/components/CargoFormModal';
export { CargoLevelBadge } from './CargoLevelBadge';
export { OrganigramaSection } from './OrganigramaSection';
