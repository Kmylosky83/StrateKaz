/**
 * Tipos para Evaluación de Proveedores
 * Backend: backend/apps/supply_chain/gestion_proveedores/models.py
 */

import type { BaseTimestamped } from './catalogos.types';

// ==================== CRITERIOS DE EVALUACIÓN ====================

/**
 * Criterio de evaluación configurable
 */
export interface CriterioEvaluacion extends BaseTimestamped {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  peso: number;
  aplica_a_tipo: number[];
  aplica_a_tipos?: Array<{ id: number; nombre: string }>;
  orden: number;
  is_active: boolean;
}

export interface CreateCriterioEvaluacionDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  peso: number;
  aplica_a_tipo?: number[];
  orden?: number;
  is_active?: boolean;
}

export type UpdateCriterioEvaluacionDTO = Partial<CreateCriterioEvaluacionDTO>;

// ==================== EVALUACIÓN DE PROVEEDOR ====================

/**
 * Evaluación periódica de proveedor
 */
export interface EvaluacionProveedor extends BaseTimestamped {
  id: number;
  proveedor: number;
  proveedor_nombre?: string;
  periodo: string;
  fecha_evaluacion: string;
  evaluado_por?: number;
  evaluado_por_nombre?: string;

  // Resultados
  calificacion_total?: number;
  estado_display?: string;

  // Observaciones
  observaciones?: string;

  // Estado
  estado: 'BORRADOR' | 'EN_PROCESO' | 'COMPLETADA' | 'APROBADA';
  fecha_aprobacion?: string;
  aprobado_por?: number;
  aprobado_por_nombre?: string;

  // Detalles de evaluacion
  detalles?: DetalleEvaluacion[];
}

/**
 * Detalle de evaluación por criterio
 */
export interface DetalleEvaluacion extends BaseTimestamped {
  id: number;
  evaluacion: number;
  criterio: number;
  criterio_nombre?: string;
  criterio_peso?: number;
  calificacion: number;
  observaciones?: string;
}

export interface CreateEvaluacionProveedorDTO {
  proveedor: number;
  periodo: string;
  fecha_evaluacion: string;
  observaciones?: string;
  estado?: 'BORRADOR' | 'EN_PROCESO' | 'COMPLETADA' | 'APROBADA';
}

export type UpdateEvaluacionProveedorDTO = Partial<CreateEvaluacionProveedorDTO>;

export interface AprobarEvaluacionDTO {
  fecha_aprobacion?: string;
  comentarios?: string;
}

// ==================== ESTADÍSTICAS DE EVALUACIÓN ====================

export interface EstadisticasEvaluacion {
  total_evaluaciones: number;
  evaluaciones_por_periodo: Array<{
    periodo: string;
    count: number;
    promedio: number;
  }>;
  evaluaciones_por_calificacion: Array<{
    calificacion: string;
    count: number;
  }>;
  proveedores_evaluados: number;
  promedio_general: number;
  criterios_mas_bajos: Array<{
    criterio: string;
    promedio: number;
  }>;
}
