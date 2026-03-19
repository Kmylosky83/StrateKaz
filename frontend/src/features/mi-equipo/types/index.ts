/**
 * Tipos para Mi Equipo
 *
 * Tipos propios del módulo MSS + re-exports centralizados de tipos compartidos.
 * Todos los componentes de mi-equipo importan desde aquí — NUNCA directamente
 * de @/features/talent-hub/.
 */

// MSS (Manager Self-Service) — tipos propios
export * from './miEquipo.types';

// Colaboradores — compartidos con talent-hub
export * from './colaboradores.types';

// Selección y Contratación — compartidos con talent-hub
export * from './seleccion.types';

// Onboarding e Inducción — compartidos con talent-hub
export * from './onboarding.types';
