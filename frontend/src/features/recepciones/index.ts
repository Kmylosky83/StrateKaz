/**
 * Modulo de Recepciones - Barrel export
 * Sistema de Gestion Grasas y Huesos del Norte
 *
 * Este modulo gestiona el proceso de recepcion de materia prima en planta.
 * Soporta DOS tipos de origen:
 * 1. UNIDAD_INTERNA (Econorte): Recepciones de recolectores con recolecciones
 * 2. PROVEEDOR_EXTERNO: Recepciones directas de proveedores de materia prima
 *
 * Flujo comun:
 * 1. Iniciar recepcion: Seleccionar origen y datos
 * 2. Prueba de acidez (solo ACU y SEBO_PROCESADO)
 * 3. Registrar pesaje: Registra peso real en bascula
 * 4. Confirmar: Aplica prorrateo de merma (UNIDAD_INTERNA)
 * 5. STANDBY: Producto listo para siguiente proceso
 */

// API y Hooks
export * from './api';

// Tipos
export * from './types';

// Pages - Pagina principal con tabs
export { default as RecepcionPlantaPage } from './pages/RecepcionPlantaPage';

// Pages - Sub-paginas individuales
export { RecepcionesPage } from './pages/RecepcionesPage';
