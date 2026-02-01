/**
 * Constantes globales del sistema
 */

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Sistema de Gestión Empresarial';
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Nota: Los cargos/roles son completamente dinámicos y se gestionan desde
// Dirección Estratégica > Organización > Cargos y Roles
// No se deben hardcodear en el código

// Estados de recolección
export const ESTADO_RECOLECCION = {
  PROGRAMADA: 'programada',
  EN_RUTA: 'en_ruta',
  CUMPLIDA: 'cumplida',
  INCUMPLIDA: 'incumplida',
  CANCELADA: 'cancelada',
} as const;

// Estados de lote
export const ESTADO_LOTE = {
  PENDIENTE: 'pendiente',
  EN_PROCESO: 'en_proceso',
  CERRADO: 'cerrado',
} as const;

// Estados de liquidación
export const ESTADO_LIQUIDACION = {
  BORRADOR: 'borrador',
  PENDIENTE_APROBACION: 'pendiente_aprobacion',
  APROBADA: 'aprobada',
  RECHAZADA: 'rechazada',
  PAGADA: 'pagada',
} as const;

// Tipos de proveedor
export const TIPO_PROVEEDOR = {
  EXTERNO: 'externo',
  ECOALIADO: 'ecoaliado',
} as const;

// Formatos de fecha
export const DATE_FORMAT = 'dd/MM/yyyy';
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';
export const TIME_FORMAT = 'HH:mm';

// ==============================================================================
// JERARQUÍA DE MATERIA PRIMA v2.0 - 18 TIPOS CON PRECIOS INDEPENDIENTES
// ==============================================================================

// Categorías principales de materia prima (para agrupación en UI)
export const CATEGORIA_MATERIA_PRIMA_OPTIONS = [
  { value: 'HUESO', label: 'Hueso' },
  { value: 'SEBO_CRUDO', label: 'Sebo Crudo' },
  { value: 'SEBO_PROCESADO', label: 'Sebo Procesado' },
  { value: 'OTROS', label: 'Otros' },
] as const;

// Códigos completos de materia prima - cada uno con precio independiente (18 tipos)
export const CODIGO_MATERIA_PRIMA_OPTIONS = [
  // ===== HUESO =====
  { value: 'HUESO_CRUDO', label: 'Hueso Crudo', categoria: 'HUESO' },
  { value: 'HUESO_SECO', label: 'Hueso Seco', categoria: 'HUESO' },
  { value: 'HUESO_CALCINADO', label: 'Hueso Calcinado', categoria: 'HUESO' },
  { value: 'HUESO_CENIZA', label: 'Hueso Ceniza', categoria: 'HUESO' },

  // ===== SEBO CRUDO (sin procesar) =====
  { value: 'SEBO_CRUDO_CARNICERIA', label: 'Sebo Crudo Carnicería', categoria: 'SEBO_CRUDO' },
  { value: 'SEBO_CRUDO_MATADERO', label: 'Sebo Crudo Matadero', categoria: 'SEBO_CRUDO' },
  { value: 'SEBO_CUERO', label: 'Sebo de Cuero', categoria: 'SEBO_CRUDO' },
  { value: 'SEBO_CUERO_VIRIL', label: 'Sebo de Cuero de Viril', categoria: 'SEBO_CRUDO' },
  { value: 'SEBO_POLLO', label: 'Sebo Pollo', categoria: 'SEBO_CRUDO' },

  // ===== SEBO PROCESADO (por acidez) =====
  { value: 'SEBO_PROCESADO_A', label: 'Sebo Procesado Tipo A (1-5% Acidez)', categoria: 'SEBO_PROCESADO', acidez_min: 1, acidez_max: 5 },
  { value: 'SEBO_PROCESADO_B', label: 'Sebo Procesado Tipo B (5.1-8% Acidez)', categoria: 'SEBO_PROCESADO', acidez_min: 5.1, acidez_max: 8 },
  { value: 'SEBO_PROCESADO_B1', label: 'Sebo Procesado Tipo B1 (8.1-10% Acidez)', categoria: 'SEBO_PROCESADO', acidez_min: 8.1, acidez_max: 10 },
  { value: 'SEBO_PROCESADO_B2', label: 'Sebo Procesado Tipo B2 (10.1-15% Acidez)', categoria: 'SEBO_PROCESADO', acidez_min: 10.1, acidez_max: 15 },
  { value: 'SEBO_PROCESADO_B4', label: 'Sebo Procesado Tipo B4 (15.1-20% Acidez)', categoria: 'SEBO_PROCESADO', acidez_min: 15.1, acidez_max: 20 },
  { value: 'SEBO_PROCESADO_C', label: 'Sebo Procesado Tipo C (>20.1% Acidez)', categoria: 'SEBO_PROCESADO', acidez_min: 20.1, acidez_max: 100 },

  // ===== OTROS =====
  { value: 'CHICHARRON', label: 'Chicharrón', categoria: 'OTROS' },
  { value: 'CABEZAS', label: 'Cabezas', categoria: 'OTROS' },
  { value: 'ACU', label: 'ACU - Aceite de Cocina Usado', categoria: 'OTROS' },
] as const;

// Mapeo de código a categoría principal
export const CODIGO_A_CATEGORIA: Record<string, string> = {
  // Hueso
  HUESO_CRUDO: 'HUESO',
  HUESO_SECO: 'HUESO',
  HUESO_CALCINADO: 'HUESO',
  HUESO_CENIZA: 'HUESO',
  // Sebo Crudo
  SEBO_CRUDO_CARNICERIA: 'SEBO_CRUDO',
  SEBO_CRUDO_MATADERO: 'SEBO_CRUDO',
  SEBO_CUERO: 'SEBO_CRUDO',
  SEBO_CUERO_VIRIL: 'SEBO_CRUDO',
  SEBO_POLLO: 'SEBO_CRUDO',
  // Sebo Procesado
  SEBO_PROCESADO_A: 'SEBO_PROCESADO',
  SEBO_PROCESADO_B: 'SEBO_PROCESADO',
  SEBO_PROCESADO_B1: 'SEBO_PROCESADO',
  SEBO_PROCESADO_B2: 'SEBO_PROCESADO',
  SEBO_PROCESADO_B4: 'SEBO_PROCESADO',
  SEBO_PROCESADO_C: 'SEBO_PROCESADO',
  // Otros
  CHICHARRON: 'OTROS',
  CABEZAS: 'OTROS',
  ACU: 'OTROS',
};

// Estructura jerárquica completa para UI
export const JERARQUIA_MATERIA_PRIMA = {
  HUESO: {
    nombre: 'Hueso',
    descripcion: 'Hueso en diferentes estados de procesamiento',
    items: [
      { codigo: 'HUESO_CRUDO', nombre: 'Hueso Crudo' },
      { codigo: 'HUESO_SECO', nombre: 'Hueso Seco' },
      { codigo: 'HUESO_CALCINADO', nombre: 'Hueso Calcinado' },
      { codigo: 'HUESO_CENIZA', nombre: 'Hueso Ceniza' },
    ],
  },
  SEBO_CRUDO: {
    nombre: 'Sebo Crudo',
    descripcion: 'Sebo sin procesar de diferentes orígenes',
    items: [
      { codigo: 'SEBO_CRUDO_CARNICERIA', nombre: 'Sebo Crudo Carnicería' },
      { codigo: 'SEBO_CRUDO_MATADERO', nombre: 'Sebo Crudo Matadero' },
      { codigo: 'SEBO_CUERO', nombre: 'Sebo de Cuero' },
      { codigo: 'SEBO_CUERO_VIRIL', nombre: 'Sebo de Cuero de Viril' },
      { codigo: 'SEBO_POLLO', nombre: 'Sebo Pollo' },
    ],
  },
  SEBO_PROCESADO: {
    nombre: 'Sebo Procesado',
    descripcion: 'Sebo procesado clasificado por nivel de acidez',
    items: [
      { codigo: 'SEBO_PROCESADO_A', nombre: 'Tipo A (1-5% Acidez)', acidez_min: 1, acidez_max: 5 },
      { codigo: 'SEBO_PROCESADO_B', nombre: 'Tipo B (5.1-8% Acidez)', acidez_min: 5.1, acidez_max: 8 },
      { codigo: 'SEBO_PROCESADO_B1', nombre: 'Tipo B1 (8.1-10% Acidez)', acidez_min: 8.1, acidez_max: 10 },
      { codigo: 'SEBO_PROCESADO_B2', nombre: 'Tipo B2 (10.1-15% Acidez)', acidez_min: 10.1, acidez_max: 15 },
      { codigo: 'SEBO_PROCESADO_B4', nombre: 'Tipo B4 (15.1-20% Acidez)', acidez_min: 15.1, acidez_max: 20 },
      { codigo: 'SEBO_PROCESADO_C', nombre: 'Tipo C (>20.1% Acidez)', acidez_min: 20.1, acidez_max: 100 },
    ],
  },
  OTROS: {
    nombre: 'Otros',
    descripcion: 'Otras materias primas',
    items: [
      { codigo: 'CHICHARRON', nombre: 'Chicharrón' },
      { codigo: 'CABEZAS', nombre: 'Cabezas' },
      { codigo: 'ACU', nombre: 'ACU - Aceite de Cocina Usado' },
    ],
  },
} as const;

// Diccionario para búsqueda rápida de nombres
export const CODIGO_MATERIA_PRIMA_DICT: Record<string, string> = Object.fromEntries(
  CODIGO_MATERIA_PRIMA_OPTIONS.map((item) => [item.value, item.label])
);

// Función helper para obtener códigos válidos según categoría seleccionada
export function getCodigosMateriaPorTipo(categoria: string): Array<{ value: string; label: string }> {
  // Mapeo de categorías legacy a nuevas
  const categoriaMapping: Record<string, string[]> = {
    'HUESO': ['HUESO'],
    'SEBO': ['SEBO_CRUDO', 'SEBO_PROCESADO'],
    'CABEZAS': ['OTROS'],
    'ACU': ['OTROS'],
    'SEBO_CRUDO': ['SEBO_CRUDO'],
    'SEBO_PROCESADO': ['SEBO_PROCESADO'],
    'OTROS': ['OTROS'],
  };

  const categoriasABuscar = categoriaMapping[categoria] || [categoria];

  // Filtrar por categoría
  const resultado = CODIGO_MATERIA_PRIMA_OPTIONS.filter(
    (codigo) => categoriasABuscar.includes(codigo.categoria)
  );

  // Para CABEZAS y ACU legacy, filtrar solo ese código específico
  if (categoria === 'CABEZAS') {
    return [{ value: 'CABEZAS', label: 'Cabezas' }];
  }
  if (categoria === 'ACU') {
    return [{ value: 'ACU', label: 'ACU - Aceite de Cocina Usado' }];
  }

  return resultado.map((r) => ({ value: r.value, label: r.label }));
}

// Función para obtener la calidad del sebo procesado según acidez
export function obtenerCalidadPorAcidez(valorAcidez: number): { codigo: string; nombre: string } | null {
  const rangos = [
    { codigo: 'SEBO_PROCESADO_A', min: 1, max: 5, nombre: 'Tipo A' },
    { codigo: 'SEBO_PROCESADO_B', min: 5.1, max: 8, nombre: 'Tipo B' },
    { codigo: 'SEBO_PROCESADO_B1', min: 8.1, max: 10, nombre: 'Tipo B1' },
    { codigo: 'SEBO_PROCESADO_B2', min: 10.1, max: 15, nombre: 'Tipo B2' },
    { codigo: 'SEBO_PROCESADO_B4', min: 15.1, max: 20, nombre: 'Tipo B4' },
    { codigo: 'SEBO_PROCESADO_C', min: 20.1, max: 100, nombre: 'Tipo C' },
  ];

  for (const rango of rangos) {
    if (valorAcidez >= rango.min && valorAcidez <= rango.max) {
      return { codigo: rango.codigo, nombre: rango.nombre };
    }
  }
  return null;
}
