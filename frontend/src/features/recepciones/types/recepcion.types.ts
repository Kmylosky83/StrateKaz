/**
 * Tipos TypeScript para el modulo de Recepciones
 * Sistema de Gestion Grasas y Huesos del Norte
 *
 * Estos tipos corresponden a los modelos Django:
 * - RecepcionMateriaPrima
 * - RecepcionDetalle
 */

/**
 * Estados posibles de una recepcion
 */
export type EstadoRecepcion = 'INICIADA' | 'PESADA' | 'CONFIRMADA' | 'CANCELADA';

/**
 * Detalle de una recoleccion incluida en la recepcion
 * Corresponde al modelo RecepcionDetalle
 */
export interface RecepcionDetalle {
  id: number;
  recepcion: number;
  recoleccion: number;
  recoleccion_codigo: string;
  ecoaliado_nombre: string;
  ecoaliado_codigo: string;

  // Datos esperados (originales)
  peso_esperado_kg: number;
  precio_esperado_kg: number;
  valor_esperado: number;

  // Datos reales (despues de merma)
  peso_real_kg: number | null;
  merma_kg: number;
  porcentaje_merma: number;
  precio_real_kg: number | null;
  valor_real: number | null;

  // Proporcion en el lote
  proporcion_lote: number;

  // Propiedades calculadas
  tiene_merma_aplicada: boolean;
  diferencia_valor: number;

  // Observaciones
  observaciones: string | null;

  // Auditoria
  created_at: string;
  updated_at: string;
}

/**
 * Recepcion de Materia Prima - Listado
 * Version resumida para listas
 */
export interface Recepcion {
  id: number;
  codigo_recepcion: string;

  // Relaciones
  recolector: number;
  recolector_nombre: string;
  recibido_por: number;
  recibido_por_nombre: string;

  // Fechas
  fecha_recepcion: string;
  fecha_pesaje: string | null;
  fecha_confirmacion: string | null;

  // Pesos y calculos
  peso_esperado_kg: number;
  peso_real_kg: number | null;
  merma_kg: number;
  porcentaje_merma: number;
  cantidad_recolecciones: number;

  // Valores monetarios
  valor_esperado_total: number;
  valor_real_total: number | null;

  // Estado
  estado: EstadoRecepcion;
  estado_display: string;
  is_deleted: boolean;

  // Propiedades
  puede_pesar: boolean;
  puede_confirmar: boolean;
  puede_cancelar: boolean;
  es_editable: boolean;

  // Auditoria
  created_at: string;
}

/**
 * Recepcion de Materia Prima - Detalle completo
 * Incluye detalles anidados de recolecciones
 */
export interface RecepcionDetallada extends Recepcion {
  // Informacion adicional del recolector
  recolector_documento: string;

  // Informacion del recibidor
  recibido_por_nombre: string;

  // Informacion adicional
  observaciones_recepcion: string | null;
  observaciones_merma: string | null;
  numero_ticket_bascula: string | null;
  tanque_destino: string | null;

  // Cancelacion
  motivo_cancelacion: string | null;
  cancelado_por: number | null;
  cancelado_por_nombre: string | null;
  fecha_cancelacion: string | null;

  // Detalles de recolecciones
  detalles: RecepcionDetalle[];

  // Auditoria completa
  created_by: number | null;
  created_by_nombre: string | null;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Respuesta paginada de recepciones
 */
export interface PaginatedRecepciones {
  count: number;
  next: string | null;
  previous: string | null;
  results: Recepcion[];
}

/**
 * Filtros para listar recepciones
 */
export interface RecepcionFilters {
  search?: string;
  recolector?: number;
  estado?: EstadoRecepcion;
  fecha_desde?: string; // YYYY-MM-DD
  fecha_hasta?: string; // YYYY-MM-DD
  page?: number;
  page_size?: number;
}

/**
 * DTO para iniciar una recepcion
 */
export interface IniciarRecepcionDTO {
  recolector_id: number;
  recoleccion_ids: number[];
  observaciones_recepcion?: string;
}

/**
 * Respuesta al iniciar una recepcion
 */
export interface IniciarRecepcionResponse {
  message: string;
  recepcion: RecepcionDetallada;
}

/**
 * DTO para registrar pesaje en bascula
 */
export interface RegistrarPesajeDTO {
  peso_real_kg: number;
  numero_ticket_bascula?: string;
  observaciones_merma?: string;
}

/**
 * Respuesta al registrar pesaje
 */
export interface RegistrarPesajeResponse {
  message: string;
  recepcion: RecepcionDetallada;
  merma: {
    merma_kg: number;
    porcentaje_merma: number;
    peso_esperado_kg: number;
    peso_real_kg: number;
  };
}

/**
 * DTO para confirmar recepcion
 */
export interface ConfirmarRecepcionDTO {
  tanque_destino?: string;
}

/**
 * Respuesta al confirmar recepcion
 */
export interface ConfirmarRecepcionResponse {
  message: string;
  recepcion: RecepcionDetallada;
  resumen_prorrateo: {
    total_recolecciones: number;
    peso_esperado_total_kg: number;
    peso_real_total_kg: number;
    merma_total_kg: number;
    porcentaje_merma: number;
    valor_esperado_total: number;
    valor_real_total: number;
  };
}

/**
 * DTO para cancelar recepcion
 */
export interface CancelarRecepcionDTO {
  motivo_cancelacion: string;
}

/**
 * Respuesta al cancelar recepcion
 */
export interface CancelarRecepcionResponse {
  message: string;
  recepcion: RecepcionDetallada;
}

/**
 * Recoleccion pendiente de recepcion
 * Recolecciones completadas sin recepcion asociada
 */
export interface RecoleccionPendiente {
  id: number;
  codigo_voucher: string;
  ecoaliado: {
    id: number;
    codigo: string;
    razon_social: string;
  };
  recolector: {
    id: number;
    nombre_completo: string;
  };
  fecha_recoleccion: string;
  cantidad_kg: number;
  precio_kg: number;
  valor_total: number;
}

/**
 * Respuesta de recolecciones pendientes
 */
export interface RecoleccionesPendientesResponse {
  count: number;
  recolecciones: RecoleccionPendiente[];
}

/**
 * Estadisticas de recepciones
 */
export interface RecepcionEstadisticas {
  total_recepciones: number;
  recepciones_por_estado: {
    INICIADA: number;
    PESADA: number;
    CONFIRMADA: number;
    CANCELADA: number;
  };
  total_kg_esperados: number;
  total_kg_recibidos: number;
  merma_total_kg: number;
  porcentaje_merma_promedio: number;
  total_recolecciones_recibidas: number;
  total_valor_esperado: number;
  total_valor_real: number;
  recepciones_hoy: number;
  recepciones_semana: number;
  recepciones_mes: number;
}

/**
 * Respuesta por recolector
 */
export interface RecepccionesPorRecolectorResponse {
  count: number;
  page: number;
  page_size: number;
  results: Recepcion[];
}
