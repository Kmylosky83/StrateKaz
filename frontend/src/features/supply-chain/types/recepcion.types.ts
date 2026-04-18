/**
 * Types TS para Recepcion (S3) — VoucherRecepcion + RecepcionCalidad
 */

export type ModalidadEntrega = 'DIRECTO' | 'TRANSPORTE_INTERNO' | 'RECOLECCION';
export type EstadoVoucher = 'PENDIENTE_QC' | 'APROBADO' | 'RECHAZADO' | 'LIQUIDADO';
export type ResultadoQC = 'APROBADO' | 'CONDICIONAL' | 'RECHAZADO';

export interface VoucherRecepcionList {
  id: number;
  proveedor: number;
  proveedor_nombre?: string;
  producto: number;
  producto_nombre?: string;
  modalidad_entrega: ModalidadEntrega;
  modalidad_entrega_display?: string;
  fecha_viaje: string;
  peso_neto_kg: string;
  precio_kg_snapshot: string;
  valor_total_estimado?: string;
  almacen_destino: number;
  almacen_nombre?: string;
  estado: EstadoVoucher;
  estado_display?: string;
  created_at: string;
}

export interface VoucherRecepcion extends VoucherRecepcionList {
  uneg_transportista?: number | null;
  uneg_transportista_nombre?: string;
  orden_compra?: number | null;
  peso_bruto_kg: string;
  peso_tara_kg: string;
  operador_bascula: number;
  operador_nombre?: string;
  observaciones?: string;
  updated_at: string;
}

export interface CreateVoucherRecepcionDTO {
  proveedor: number;
  producto: number;
  modalidad_entrega: ModalidadEntrega;
  uneg_transportista?: number | null;
  fecha_viaje: string;
  orden_compra?: number | null;
  peso_bruto_kg: number | string;
  peso_tara_kg?: number | string;
  precio_kg_snapshot: number | string;
  almacen_destino: number;
  operador_bascula: number;
  observaciones?: string;
}

export type UpdateVoucherRecepcionDTO = Partial<CreateVoucherRecepcionDTO> & {
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
  created_at: string;
}

export interface CreateRecepcionCalidadDTO {
  voucher: number;
  parametros_medidos: Record<string, unknown>;
  resultado: ResultadoQC;
  analista: number;
  fecha_analisis: string;
  observaciones?: string;
}
