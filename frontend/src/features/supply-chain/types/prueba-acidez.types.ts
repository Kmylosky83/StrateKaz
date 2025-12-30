/**
 * Tipos para Pruebas de Acidez de Sebo
 * Backend: backend/apps/supply_chain/gestion_proveedores/models.py
 */

import type { BaseTimestamped } from './catalogos.types';

// ==================== PRUEBA DE ACIDEZ ====================

/**
 * Prueba de acidez realizada a sebo procesado
 */
export interface PruebaAcidez extends BaseTimestamped {
  id: number;
  codigo: string;

  // Proveedor y material
  proveedor: number;
  proveedor_nombre?: string;
  tipo_materia_prima_original: number;
  tipo_materia_prima_original_nombre?: string;

  // Resultados de la prueba
  fecha_prueba: string;
  hora_prueba?: string;
  lote_recepcion?: string;
  valor_acidez: number;

  // Clasificación automática según rango de acidez
  tipo_materia_prima_resultante?: number;
  tipo_materia_prima_resultante_nombre?: string;
  clasificacion_automatica: boolean;

  // Control de calidad
  cumple_especificacion: boolean;
  observaciones?: string;
  responsable_prueba?: number;
  responsable_prueba_nombre?: string;

  // Método de prueba
  metodo_prueba?: string;
  equipo_utilizado?: string;
  temperatura_muestra?: number;

  // Acciones tomadas
  accion_tomada?: 'ACEPTADO' | 'RECHAZADO' | 'REPROCESO' | 'DEVOLUCION' | 'PENDIENTE';
  motivo_rechazo?: string;

  is_active: boolean;
}

export interface CreatePruebaAcidezDTO {
  codigo: string;
  proveedor: number;
  tipo_materia_prima_original: number;
  fecha_prueba: string;
  hora_prueba?: string;
  lote_recepcion?: string;
  valor_acidez: number;
  tipo_materia_prima_resultante?: number;
  clasificacion_automatica?: boolean;
  cumple_especificacion?: boolean;
  observaciones?: string;
  responsable_prueba?: number;
  metodo_prueba?: string;
  equipo_utilizado?: string;
  temperatura_muestra?: number;
  accion_tomada?: 'ACEPTADO' | 'RECHAZADO' | 'REPROCESO' | 'DEVOLUCION' | 'PENDIENTE';
  motivo_rechazo?: string;
  is_active?: boolean;
}

export type UpdatePruebaAcidezDTO = Partial<CreatePruebaAcidezDTO>;

// ==================== SIMULAR PRUEBA (Acción Custom) ====================

/**
 * DTO para simular clasificación por acidez
 */
export interface SimularPruebaAcidezDTO {
  tipo_materia_prima_original: number;
  valor_acidez: number;
}

export interface SimularPruebaAcidezResponse {
  tipo_materia_prima_resultante?: {
    id: number;
    codigo: string;
    nombre: string;
    acidez_min: number;
    acidez_max: number;
  };
  cumple_especificacion: boolean;
  mensaje: string;
  sugerencia_accion?: 'ACEPTADO' | 'RECHAZADO' | 'REPROCESO' | 'DEVOLUCION';
}

// ==================== ESTADÍSTICAS DE PRUEBAS ====================

export interface EstadisticasPruebasAcidez {
  total_pruebas: number;
  pruebas_aprobadas: number;
  pruebas_rechazadas: number;
  pruebas_pendientes: number;
  porcentaje_aprobacion: number;

  // Por proveedor
  por_proveedor: Array<{
    proveedor_id: number;
    proveedor_nombre: string;
    total_pruebas: number;
    promedio_acidez: number;
    porcentaje_aprobacion: number;
  }>;

  // Por tipo de materia prima resultante
  por_clasificacion: Array<{
    tipo_materia_prima: string;
    count: number;
    promedio_acidez: number;
  }>;

  // Por mes
  por_mes: Array<{
    mes: string;
    total_pruebas: number;
    promedio_acidez: number;
    porcentaje_aprobacion: number;
  }>;

  // Tendencias
  promedio_acidez_general: number;
  desviacion_estandar: number;
  rango_acidez: {
    min: number;
    max: number;
  };
}
