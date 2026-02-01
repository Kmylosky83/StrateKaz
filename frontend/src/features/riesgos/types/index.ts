/**
 * Exportacion centralizada de tipos para Motor de Riesgos
 */

// Contexto Organizacional (DOFA, PESTEL, Porter)
export * from './contexto.types';

// Riesgos de Procesos (ISO 31000)
export * from './riesgos.types';

// IPEVR GTC-45
export * from './ipevr.types';

// Aspectos Ambientales (ISO 14001) - namespace para evitar conflictos
export * as AspectosAmbientalesTypes from './aspectos-ambientales.types';

// Riesgos Viales PESV (Resolucion 40595/2022) - namespace para evitar conflictos
export * as RiesgosVialesTypes from './riesgos-viales.types';
