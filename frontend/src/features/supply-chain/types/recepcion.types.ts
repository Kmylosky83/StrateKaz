/**
 * Types TS para Recepcion (S3) — VoucherRecepcion + RecepcionCalidad
 *
 * Modelo actualizado a header + líneas: un voucher puede tener N materias
 * primas de un mismo proveedor. El precio NO va en el voucher (solo en
 * Liquidacion).
 */

export type ModalidadEntrega = 'DIRECTO' | 'TRANSPORTE_INTERNO' | 'RECOLECCION';
export type EstadoVoucher = 'PENDIENTE_QC' | 'APROBADO' | 'RECHAZADO' | 'LIQUIDADO';
export type ResultadoQC = 'APROBADO' | 'CONDICIONAL' | 'RECHAZADO';

/** Una línea de materia prima dentro de un VoucherRecepcion */
export interface VoucherLineaMP {
  id: number;
  producto: number;
  producto_nombre: string;
  producto_codigo: string;
  requiere_qc: boolean;
  peso_bruto_kg: string;
  peso_tara_kg: string;
  peso_neto_kg: string;
}

/** DTO para crear una línea de MP al crear un voucher */
export interface CreateVoucherLineaMPDTO {
  producto: number;
  peso_bruto_kg: number;
  peso_tara_kg: number;
}

export interface VoucherRecepcionList {
  id: number;
  proveedor: number;
  proveedor_nombre?: string;
  modalidad_entrega: ModalidadEntrega;
  modalidad_entrega_display?: string;
  fecha_viaje: string;
  /** Suma del peso neto de todas las líneas */
  peso_neto_total: string;
  lineas: VoucherLineaMP[];
  lineas_count: number;
  almacen_destino: number;
  almacen_nombre?: string;
  /** H-SC-10: ruta de recolección (cuando modalidad=RECOLECCION) */
  ruta_recoleccion?: number | null;
  ruta_recoleccion_nombre?: string | null;
  operador_bascula?: number;
  operador_nombre?: string | null;
  operador_cargo?: string | null;
  observaciones?: string;
  estado: EstadoVoucher;
  estado_display?: string;
  /** H-SC-03/H-SC-11: alguna línea exige QC antes de aprobar. */
  requiere_qc?: boolean;
  /** H-SC-03/H-SC-11: QC completo (legacy RecepcionCalidad o mediciones por línea). */
  tiene_qc?: boolean;
  /** H-SC-RUTA-02 D-1: voucher de recolección origen (si viene de ruta). */
  voucher_recoleccion_origen?: number | null;
  voucher_recoleccion_codigo?: string | null;
  voucher_recoleccion_estado?: string | null;
  created_at: string;
}

export interface VoucherRecepcion extends VoucherRecepcionList {
  orden_compra?: number | null;
  updated_at: string;
}

export interface CreateVoucherRecepcionDTO {
  proveedor: number;
  modalidad_entrega: ModalidadEntrega;
  /** H-SC-10: FK a RutaRecoleccion (requerido cuando modalidad=RECOLECCION) */
  ruta_recoleccion?: number | null;
  fecha_viaje: string;
  orden_compra?: number | null;
  almacen_destino: number;
  operador_bascula: number;
  observaciones?: string;
  /** Mínimo 1 línea de MP */
  lineas: CreateVoucherLineaMPDTO[];
}

export type UpdateVoucherRecepcionDTO = Partial<Omit<CreateVoucherRecepcionDTO, 'lineas'>> & {
  estado?: EstadoVoucher;
};

export interface RecepcionCalidad {
  id: number;
  voucher: number;
  voucher_codigo?: number;
  parametros_medidos: Record<string, unknown>;
  resultado: ResultadoQC;
  resultado_display?: string;
  analista: number;
  analista_nombre?: string;
  fecha_analisis: string;
  observaciones?: string;
  /**
   * H-SC-03: diff entre parametros_medidos y specs del producto.
   * Key = nombre_parametro. Populado por serializer (get_cumplimiento_specs).
   */
  cumplimiento_specs?: Record<
    string,
    {
      medido: string | null;
      rango: [string, string];
      cumple: boolean;
      es_critico: boolean;
      unidad: string;
      faltante?: boolean;
    }
  >;
  created_at: string;
}

/**
 * H-SC-03: payload para POST /vouchers/{id}/registrar-qc/
 */
export interface RegistrarQCDTO {
  parametros_medidos: Record<string, number | string>;
  resultado: ResultadoQC;
  analista?: number;
  fecha_analisis?: string;
  observaciones?: string;
}

export interface CreateRecepcionCalidadDTO {
  voucher: number;
  parametros_medidos: Record<string, unknown>;
  resultado: ResultadoQC;
  analista: number;
  fecha_analisis: string;
  observaciones?: string;
}
