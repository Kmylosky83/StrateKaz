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
  categoria: 'CALIDAD' | 'ENTREGA' | 'SERVICIO' | 'PRECIO' | 'DOCUMENTACION' | 'OTRO';
  peso_porcentaje: number;
  es_eliminatorio: boolean;
  puntaje_minimo_aceptable?: number;
  orden: number;
  is_active: boolean;
}

export interface CreateCriterioEvaluacionDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: 'CALIDAD' | 'ENTREGA' | 'SERVICIO' | 'PRECIO' | 'DOCUMENTACION' | 'OTRO';
  peso_porcentaje: number;
  es_eliminatorio?: boolean;
  puntaje_minimo_aceptable?: number;
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
  codigo: string;
  proveedor: number;
  proveedor_nombre?: string;
  periodo: string;
  fecha_evaluacion: string;
  evaluador?: number;
  evaluador_nombre?: string;

  // Resultados
  puntaje_total: number;
  calificacion: 'EXCELENTE' | 'BUENO' | 'ACEPTABLE' | 'DEFICIENTE' | 'RECHAZADO';
  cumple_criterios_eliminatorios: boolean;

  // Observaciones y acciones
  observaciones?: string;
  fortalezas?: string;
  debilidades?: string;
  plan_mejora?: string;

  // Estado
  estado: 'BORRADOR' | 'COMPLETADA' | 'APROBADA' | 'RECHAZADA';
  fecha_aprobacion?: string;
  aprobado_por?: number;
  aprobado_por_nombre?: string;

  // Detalles de evaluación
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
  criterio_es_eliminatorio?: boolean;
  puntaje_obtenido: number;
  puntaje_ponderado: number;
  observaciones?: string;
  evidencias?: string;
}

export interface CreateEvaluacionProveedorDTO {
  codigo: string;
  proveedor: number;
  periodo: string;
  fecha_evaluacion: string;
  evaluador?: number;
  observaciones?: string;
  fortalezas?: string;
  debilidades?: string;
  plan_mejora?: string;
  estado?: 'BORRADOR' | 'COMPLETADA' | 'APROBADA' | 'RECHAZADA';
  detalles: Array<{
    criterio: number;
    puntaje_obtenido: number;
    observaciones?: string;
    evidencias?: string;
  }>;
}

export interface UpdateEvaluacionProveedorDTO {
  periodo?: string;
  fecha_evaluacion?: string;
  evaluador?: number;
  observaciones?: string;
  fortalezas?: string;
  debilidades?: string;
  plan_mejora?: string;
  estado?: 'BORRADOR' | 'COMPLETADA' | 'APROBADA' | 'RECHAZADA';
}

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
