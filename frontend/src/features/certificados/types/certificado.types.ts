/**
 * Tipos para el modulo de Certificados de Recoleccion
 * Sistema de Gestion Grasas y Huesos del Norte
 */

export type PeriodoCertificado = 'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual' | 'personalizado';

/**
 * Certificado guardado en base de datos (listado)
 */
export interface Certificado {
  id: number;
  numero_certificado: string;
  ecoaliado: number;
  ecoaliado_codigo: string;
  ecoaliado_razon_social: string;
  ecoaliado_ciudad: string;
  periodo: PeriodoCertificado;
  periodo_display: string;
  descripcion_periodo: string;
  fecha_inicio: string;
  fecha_fin: string;
  total_recolecciones: number;
  total_kg: number;
  total_valor: number;
  emitido_por: number | null;
  emitido_por_nombre: string | null;
  fecha_emision: string;
}

/**
 * Certificado con datos completos para reimprimir
 */
export interface CertificadoDetalle extends Certificado {
  promedio_kg: number;
  precio_promedio_kg: number;
  datos_certificado: CertificadoRecoleccionData;
  deleted_at: string | null;
}

/**
 * Datos completos del certificado (para renderizar/imprimir)
 */
export interface CertificadoRecoleccionData {
  id?: number;
  empresa: {
    nombre: string;
    nit: string;
    direccion: string;
    telefono: string;
    representante_legal: string;
  };
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
  periodo: {
    tipo: PeriodoCertificado;
    fecha_inicio: string;
    fecha_fin: string;
    descripcion: string;
  };
  resumen: {
    total_recolecciones: number;
    total_kg: number;
    total_valor: number;
    promedio_kg_por_recoleccion: number;
    precio_promedio_kg: number;
  };
  recolecciones: RecoleccionResumen[];
  numero_certificado: string;
  fecha_emision: string;
  emitido_por: string;
}

export interface RecoleccionResumen {
  fecha: string;
  codigo_voucher: string;
  cantidad_kg: number;
  precio_kg: number;
  valor_total: number;
}

/**
 * Filtros para listado de certificados
 */
export interface CertificadoFilters {
  search?: string;
  ecoaliado?: number;
  periodo?: PeriodoCertificado;
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
  page_size?: number;
}

/**
 * Totales agregados de certificados
 */
export interface CertificadosTotales {
  total_kg: number;
  total_valor: number;
}

/**
 * Respuesta paginada de certificados
 */
export interface PaginatedCertificados {
  count: number;
  page: number;
  page_size: number;
  results: Certificado[];
  totales?: CertificadosTotales;
}
