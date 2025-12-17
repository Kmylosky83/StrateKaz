/**
 * Tipos TypeScript para el modulo de Recolecciones
 * Sistema de Gestion Grasas y Huesos del Norte
 */

// ==================== RECOLECCION ====================

export interface Recoleccion {
  id: number;
  codigo_voucher: string;
  programacion: number;
  programacion_codigo?: string;
  ecoaliado: number;
  ecoaliado_codigo: string;
  ecoaliado_razon_social: string;
  ecoaliado_ciudad: string;
  recolector: number;
  recolector_nombre: string;
  fecha_recoleccion: string; // ISO 8601 datetime
  cantidad_kg: number;
  precio_kg: number;
  valor_total: number;
  porcentaje_acidez?: number | null;
  calidad?: string | null; // A, B, B1, B2, B4, C
  requiere_prueba_acidez?: boolean;
  is_deleted?: boolean;
  created_at: string;
}

export interface RecoleccionDetalle extends Recoleccion {
  observaciones?: string | null;
  ecoaliado_detalle?: {
    id: number;
    codigo: string;
    razon_social: string;
    nit: string;
    ciudad: string;
    direccion?: string;
    telefono?: string;
    precio_actual_kg?: number;
  };
  programacion_detalle?: {
    id: number;
    codigo: string;
    fecha_programada: string;
    cantidad_estimada_kg?: number;
    estado: string;
  };
  created_by?: number;
  created_by_nombre?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

// ==================== DTOs ====================

export interface RegistrarRecoleccionDTO {
  programacion_id: number;
  cantidad_kg: number;
  valor_real_pagado?: number;  // Valor real que pagó el conductor (puede diferir del sugerido)
  porcentaje_acidez?: number;  // Porcentaje de acidez para ACU y Sebo Procesado (0-100%)
  observaciones?: string;
}

export interface RegistrarRecoleccionResponse {
  message: string;
  recoleccion: RecoleccionDetalle;
  voucher: VoucherData;
}

// ==================== VOUCHER ====================

export interface VoucherData {
  id: number;
  codigo_voucher: string;
  fecha_recoleccion: string;
  empresa: {
    nombre: string;
    nit: string;
    direccion: string;
    telefono: string;
    logo?: string | null;
  };
  ecoaliado_info: {
    codigo: string;
    razon_social: string;
    nit: string;
    direccion?: string;
    ciudad: string;
  };
  recolector_nombre: string;
  detalle: {
    cantidad_kg: number;
    precio_kg: number;
    subtotal: number;
    iva: number;
    total: number;
    total_letras: string;
  };
}

// ==================== PROGRAMACION EN RUTA ====================

export interface ProgramacionEnRuta {
  id: number;
  codigo: string;
  ecoaliado_id: number;
  ecoaliado_codigo: string;
  ecoaliado_razon_social: string;
  ecoaliado_direccion?: string;
  ecoaliado_ciudad: string;
  precio_kg: number;
  fecha_programada: string;
  cantidad_estimada_kg?: number;
}

// ==================== ESTADISTICAS ====================

export interface RecoleccionEstadisticas {
  total_recolecciones: number;
  total_kg_recolectados: number;
  total_valor_pagado: number;
  promedio_kg_por_recoleccion: number;
  promedio_valor_por_recoleccion: number;
  recolecciones_hoy: number;
  recolecciones_semana: number;
  recolecciones_mes: number;
}

// ==================== FILTROS ====================

export interface RecoleccionFilters {
  search?: string;
  ecoaliado?: number;
  recolector?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
  page_size?: number;
}

// ==================== PAGINACION ====================

export interface PaginatedRecolecciones {
  count: number;
  page?: number;
  page_size?: number;
  next?: string | null;
  previous?: string | null;
  results: Recoleccion[];
}

export interface PaginatedProgramacionesEnRuta {
  count: number;
  results: ProgramacionEnRuta[];
}

// ==================== CERTIFICADO DE RECOLECCION ====================

export type PeriodoCertificado = 'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual' | 'personalizado';

export interface CertificadoRecoleccionParams {
  ecoaliado_id: number;
  periodo: PeriodoCertificado;
  fecha_inicio?: string; // Para periodo personalizado
  fecha_fin?: string;    // Para periodo personalizado
  año?: number;          // Para periodos predefinidos
  mes?: number;          // Para periodo mensual
}

export interface RecoleccionResumen {
  fecha: string;
  codigo_voucher: string;
  cantidad_kg: number;
  precio_kg: number;
  valor_total: number;
}

export interface CertificadoRecoleccionData {
  // Datos de la empresa
  empresa: {
    nombre: string;
    nit: string;
    direccion: string;
    telefono: string;
    representante_legal: string;
    logo?: string | null;
  };
  // Datos del ecoaliado
  ecoaliado: {
    codigo: string;
    razon_social: string;
    documento_tipo: string;
    documento_numero: string;
    direccion: string;
    ciudad: string;
    departamento: string;
    telefono?: string;
  };
  // Periodo del certificado
  periodo: {
    tipo: PeriodoCertificado;
    fecha_inicio: string;
    fecha_fin: string;
    descripcion: string; // Ej: "Enero 2025", "Primer Semestre 2025"
  };
  // Resumen de recolecciones
  resumen: {
    total_recolecciones: number;
    total_kg: number;
    total_valor: number;
    promedio_kg_por_recoleccion: number;
    precio_promedio_kg: number;
  };
  // Detalle de cada recoleccion
  recolecciones: RecoleccionResumen[];
  // Metadatos
  numero_certificado: string;
  fecha_emision: string;
  emitido_por: string;
}
