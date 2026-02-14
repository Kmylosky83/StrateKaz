/**
 * Estructura de Cargos - Componentes
 *
 * CargosSection y CargoFormModal son el CRUD principal de cargos,
 * ahora ubicado en Talento Humano (antes en Configuracion/Organizacion).
 *
 * OrganigramaSection visualiza la jerarquía de cargos y áreas.
 * Movido desde Organizacion (GE) a TH porque los cargos se gestionan aquí.
 *
 * Los componentes originales siguen en features/configuracion/components/
 * y se re-exportan aqui hasta completar la migracion completa.
 */

// Re-exports desde configuracion (migracion gradual)
export { CargosTab as CargosSection } from '@/features/configuracion/components/CargosTab';
export { CargoFormModal } from '@/features/configuracion/components/CargoFormModal';
export { CargoLevelBadge } from './CargoLevelBadge';
export { OrganigramaSection } from './OrganigramaSection';
