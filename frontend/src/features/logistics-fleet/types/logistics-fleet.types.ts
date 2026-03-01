/**
 * Tipos para Logistics Fleet Management
 * Sistema de Gestion de Flota y Transporte
 * StrateKaz
 */

// ==================== COMMON TYPES ====================
import { PaginatedResponse, SelectOption } from '@/types';
export type { PaginatedResponse, SelectOption };

// ==================== GESTION FLOTA - CATALOGOS ====================

export type CategoriaLicencia = 'A1' | 'A2' | 'B1' | 'B2' | 'B3' | 'C1' | 'C2' | 'C3';

export interface TipoVehiculo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  capacidad_kg?: number;
  capacidad_m3?: number;
  requiere_refrigeracion: boolean;
  requiere_licencia_especial: boolean;
  categoria_licencia?: CategoriaLicencia;
  categoria_licencia_display?: string;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EstadoVehiculo {
  id: number;
  codigo: string;
  nombre: string;
  color?: string;
  descripcion?: string;
  disponible_para_ruta: boolean;
  requiere_mantenimiento: boolean;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== GESTION FLOTA - VEHICULO ====================

export interface Vehiculo {
  id: number;
  empresa: number;
  empresa_nombre?: string;

  // Identificacion
  placa: string;
  tipo_vehiculo: number;
  tipo_vehiculo_data?: TipoVehiculo;
  estado: number;
  estado_data?: EstadoVehiculo;

  // Informacion basica
  marca: string;
  modelo: string;
  anio: number;
  color?: string;

  // Identificacion tecnica
  numero_motor?: string;
  numero_chasis?: string;
  vin?: string;

  // Capacidad operativa
  capacidad_kg: number;
  km_actual: number;

  // Documentos legales (fechas de vencimiento)
  fecha_matricula?: string;
  fecha_soat?: string;
  fecha_tecnomecanica?: string;

  // Propiedad
  propietario_nombre?: string;
  propietario_documento?: string;
  es_propio: boolean;
  es_contratado: boolean;

  // Tecnologia GPS
  gps_instalado: boolean;
  numero_gps?: string;

  // Observaciones
  observaciones?: string;

  // Campos calculados
  dias_hasta_vencimiento_soat?: number;
  dias_hasta_vencimiento_tecnomecanica?: number;
  documentos_al_dia?: boolean;
  disponible_para_operar?: boolean;

  // Auditoria
  is_active: boolean;
  deleted_at?: string;
  created_by?: number;
  created_by_name?: string;
  updated_by?: number;
  updated_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface VehiculoList {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  tipo_vehiculo: number;
  tipo_nombre?: string;
  estado: number;
  estado_nombre?: string;
  estado_color?: string;
  km_actual: number;
  capacidad_kg: number;
  fecha_soat?: string;
  fecha_tecnomecanica?: string;
  dias_hasta_vencimiento_soat?: number;
  dias_hasta_vencimiento_tecnomecanica?: number;
  disponible_para_operar?: boolean;
  is_active: boolean;
}

// ==================== GESTION FLOTA - DOCUMENTOS ====================

export type TipoDocumentoVehiculo =
  | 'SOAT'
  | 'TECNOMECANICA'
  | 'TARJETA_PROPIEDAD'
  | 'POLIZA'
  | 'OPERACION'
  | 'OTRO';

export interface DocumentoVehiculo {
  id: number;
  empresa: number;
  vehiculo: number;
  vehiculo_placa?: string;
  tipo_documento: TipoDocumentoVehiculo;
  tipo_documento_display?: string;
  numero_documento?: string;
  fecha_expedicion: string;
  fecha_vencimiento: string;
  entidad_emisora?: string;
  documento_url?: string;
  observaciones?: string;

  // Campos calculados
  dias_hasta_vencimiento?: number;
  esta_vencido?: boolean;
  proximo_a_vencer?: boolean;

  // Auditoria
  is_active: boolean;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

// ==================== GESTION FLOTA - HOJA DE VIDA ====================

export type TipoEventoVehiculo =
  | 'MANTENIMIENTO'
  | 'REPARACION'
  | 'ACCIDENTE'
  | 'INFRACCION'
  | 'MODIFICACION'
  | 'CAMBIO_PROPIETARIO'
  | 'ADQUISICION'
  | 'BAJA'
  | 'OTRO';

export interface HojaVidaVehiculo {
  id: number;
  empresa: number;
  vehiculo: number;
  vehiculo_placa?: string;
  fecha: string;
  tipo_evento: TipoEventoVehiculo;
  tipo_evento_display?: string;
  descripcion: string;
  km_evento?: number;
  costo?: number;
  proveedor?: string;
  documento_soporte_url?: string;
  registrado_por: number;
  registrado_por_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== GESTION FLOTA - MANTENIMIENTO ====================

export type TipoMantenimiento = 'PREVENTIVO' | 'CORRECTIVO' | 'PREDICTIVO';
export type EstadoMantenimiento = 'PROGRAMADO' | 'EN_EJECUCION' | 'COMPLETADO' | 'CANCELADO';

export interface MantenimientoVehiculo {
  id: number;
  empresa: number;
  vehiculo: number;
  vehiculo_placa?: string;
  tipo: TipoMantenimiento;
  tipo_display?: string;
  descripcion: string;

  // Fechas
  fecha_programada: string;
  fecha_ejecucion?: string;

  // Kilometraje
  km_mantenimiento: number;
  km_proximo_mantenimiento?: number;

  // Costos
  costo_mano_obra: number;
  costo_repuestos: number;
  costo_total: number;

  // Proveedor
  proveedor_nombre?: string;
  factura_numero?: string;

  // Responsable y estado
  responsable?: number;
  responsable_name?: string;
  estado: EstadoMantenimiento;
  estado_display?: string;

  // Campos calculados
  esta_vencido?: boolean;

  // Auditoria
  is_active: boolean;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

// ==================== GESTION FLOTA - COSTOS ====================

export type TipoCostoOperacion =
  | 'COMBUSTIBLE'
  | 'PEAJE'
  | 'PARQUEADERO'
  | 'LAVADO'
  | 'LUBRICANTES'
  | 'NEUMATICOS'
  | 'MULTA'
  | 'OTRO';

export interface CostoOperacion {
  id: number;
  empresa: number;
  vehiculo: number;
  vehiculo_placa?: string;
  fecha: string;
  tipo_costo: TipoCostoOperacion;
  tipo_costo_display?: string;
  valor: number;

  // Para combustible
  cantidad?: number;
  km_recorridos?: number;
  consumo_km_litro?: number;

  // Informacion adicional
  factura_numero?: string;
  observaciones?: string;

  // Campo calculado
  costo_por_km?: number;

  // Auditoria
  registrado_por: number;
  registrado_por_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== GESTION FLOTA - VERIFICACIONES PESV ====================

export type TipoVerificacion =
  | 'PREOPERACIONAL_DIARIA'
  | 'INSPECCION_MENSUAL'
  | 'AUDITORIA_EXTERNA'
  | 'INSPECCION_ESPECIAL';

export type ResultadoVerificacion = 'APROBADO' | 'APROBADO_CON_OBSERVACIONES' | 'RECHAZADO';

export interface ChecklistItem {
  item: string;
  cumple: boolean;
  observacion?: string;
}

export interface VerificacionTercero {
  id: number;
  empresa: number;
  vehiculo: number;
  vehiculo_placa?: string;
  fecha: string;
  tipo: TipoVerificacion;
  tipo_display?: string;

  // Inspector
  inspector?: number;
  inspector_name?: string;
  inspector_externo?: string;

  // Checklist dinamico
  checklist_items: ChecklistItem[];

  // Resultado
  resultado: ResultadoVerificacion;
  resultado_display?: string;

  // Informacion operativa
  kilometraje: number;
  nivel_combustible?: string;

  // Observaciones y acciones
  observaciones_generales?: string;
  firma_inspector_url?: string;
  acciones_correctivas?: string;

  // Campos calculados
  requiere_accion_inmediata?: boolean;
  porcentaje_cumplimiento?: number;

  // Auditoria
  is_active: boolean;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

// ==================== GESTION TRANSPORTE - CATALOGOS ====================

export interface TipoRuta {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  es_recoleccion: boolean;
  es_entrega: boolean;
  es_transferencia: boolean;
  requiere_cadena_frio: boolean;
  is_active: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface EstadoDespacho {
  id: number;
  codigo: string;
  nombre: string;
  color: string;
  descripcion?: string;
  en_transito: boolean;
  es_final: boolean;
  permite_edicion: boolean;
  is_active: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

// ==================== GESTION TRANSPORTE - RUTA ====================

export interface PuntoIntermedio {
  nombre: string;
  direccion: string;
  orden: number;
}

export interface Ruta {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo_ruta: number;
  tipo_ruta_nombre?: string;

  // Origen
  origen_nombre: string;
  origen_direccion: string;
  origen_ciudad: string;

  // Destino
  destino_nombre: string;
  destino_direccion: string;
  destino_ciudad: string;

  // Informacion de la ruta
  distancia_km: number;
  tiempo_estimado_minutos: number;

  // Costos
  costo_estimado: number;
  peajes_estimados: number;

  // Puntos intermedios
  puntos_intermedios: PuntoIntermedio[];

  // Auditoria
  is_active: boolean;
  deleted_at?: string;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

// ==================== GESTION TRANSPORTE - CONDUCTOR ====================

export type TipoDocumentoConductor = 'CC' | 'CE' | 'PA';

export type CategoriaLicenciaConductor = 'A1' | 'A2' | 'B1' | 'B2' | 'B3' | 'C1' | 'C2' | 'C3';

export interface Conductor {
  id: number;
  empresa: number;
  usuario?: number;

  // Identificacion
  nombre_completo: string;
  tipo_documento: TipoDocumentoConductor;
  documento_identidad: string;

  // Contacto
  telefono: string;
  email?: string;

  // Licencia de conduccion
  licencia_conduccion: string;
  categoria_licencia: CategoriaLicenciaConductor;
  fecha_vencimiento_licencia: string;

  // Fechas de vinculacion
  fecha_ingreso: string;
  fecha_retiro?: string;

  // Tipo de conductor
  es_empleado: boolean;
  empresa_transportadora?: string;

  // Archivos
  foto_url?: string;
  firma_url?: string;

  // Campos calculados
  licencia_vigente?: boolean;
  esta_activo?: boolean;

  // Auditoria
  is_active: boolean;
  deleted_at?: string;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

// ==================== GESTION TRANSPORTE - PROGRAMACION RUTA ====================

export type EstadoProgramacion = 'PROGRAMADA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA';

export interface ProgramacionRuta {
  id: number;
  empresa: number;
  codigo: string;

  // Relaciones
  ruta: number;
  ruta_nombre?: string;
  vehiculo: number;
  conductor: number;
  conductor_nombre?: string;

  // Programacion
  fecha_programada: string;
  hora_salida_programada: string;
  hora_llegada_estimada: string;

  // Estado
  estado: EstadoProgramacion;

  // Kilometraje
  km_inicial?: number;
  km_final?: number;
  km_recorridos?: number;

  // Ejecucion real
  hora_salida_real?: string;
  hora_llegada_real?: string;

  // Observaciones
  observaciones?: string;

  // Quien programo
  programado_por?: number;

  // Auditoria
  is_active: boolean;
  deleted_at?: string;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

// ==================== GESTION TRANSPORTE - DESPACHO ====================

export interface Despacho {
  id: number;
  empresa: number;
  codigo: string;

  // Relaciones
  programacion_ruta: number;
  estado_despacho: number;
  estado_nombre?: string;

  // Cliente
  cliente_nombre: string;
  cliente_direccion: string;
  cliente_telefono?: string;
  cliente_contacto?: string;

  // Informacion de carga
  peso_total_kg: number;
  volumen_total_m3?: number;
  valor_declarado: number;

  // Cadena de frio
  requiere_cadena_frio: boolean;
  temperatura_requerida?: string;

  // Observaciones
  observaciones_entrega?: string;

  // Fechas de entrega
  fecha_entrega_estimada: string;
  fecha_entrega_real?: string;

  // Recepcion
  recibido_por?: string;
  documento_recibido?: string;
  firma_recibido_url?: string;

  // Novedades
  novedad: boolean;
  descripcion_novedad?: string;

  // Detalles
  detalles?: DetalleDespacho[];

  // Auditoria
  is_active: boolean;
  deleted_at?: string;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

// ==================== GESTION TRANSPORTE - DETALLE DESPACHO ====================

export interface DetalleDespacho {
  id: number;
  empresa: number;
  despacho: number;

  // Producto
  stock_producto?: number;
  descripcion_producto: string;
  codigo_producto?: string;

  // Cantidades
  cantidad: number;
  unidad_medida: string;
  peso_kg: number;

  // Trazabilidad
  lote_origen?: string;

  // Observaciones
  observaciones?: string;

  // Auditoria
  is_active: boolean;
  deleted_at?: string;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

// ==================== GESTION TRANSPORTE - MANIFIESTO ====================

export interface Manifiesto {
  id: number;
  empresa: number;
  numero_manifiesto: string;

  // Relacion con programacion
  programacion_ruta: number;

  // Fecha
  fecha_expedicion: string;

  // Remitente
  remitente_nombre: string;
  remitente_nit: string;
  remitente_direccion: string;

  // Destinatario
  destinatario_nombre: string;
  destinatario_nit: string;
  destinatario_direccion: string;

  // Origen y destino
  origen_ciudad: string;
  destino_ciudad: string;

  // Descripcion de la carga
  descripcion_carga: string;
  peso_kg: number;
  unidades: number;

  // Valores
  valor_flete: number;
  valor_declarado: number;

  // Informacion del vehiculo
  vehiculo_placa: string;
  vehiculo_tipo: string;

  // Informacion del conductor
  conductor_nombre: string;
  conductor_documento: string;

  // Observaciones
  observaciones?: string;

  // PDF del manifiesto
  pdf_url?: string;

  // Generado por
  generado_por?: number;

  // Auditoria
  is_active: boolean;
  deleted_at?: string;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

// ==================== DTOs ====================

export interface CreateVehiculoDTO {
  placa: string;
  tipo_vehiculo: number;
  estado: number;
  marca: string;
  modelo: string;
  anio: number;
  color?: string;
  numero_motor?: string;
  numero_chasis?: string;
  vin?: string;
  capacidad_kg: number;
  km_actual: number;
  fecha_matricula?: string;
  fecha_soat?: string;
  fecha_tecnomecanica?: string;
  propietario_nombre?: string;
  propietario_documento?: string;
  es_propio?: boolean;
  es_contratado?: boolean;
  gps_instalado?: boolean;
  numero_gps?: string;
  observaciones?: string;
}

export interface UpdateVehiculoDTO {
  tipo_vehiculo?: number;
  estado?: number;
  marca?: string;
  modelo?: string;
  anio?: number;
  color?: string;
  numero_motor?: string;
  numero_chasis?: string;
  vin?: string;
  capacidad_kg?: number;
  km_actual?: number;
  fecha_matricula?: string;
  fecha_soat?: string;
  fecha_tecnomecanica?: string;
  propietario_nombre?: string;
  propietario_documento?: string;
  es_propio?: boolean;
  es_contratado?: boolean;
  gps_instalado?: boolean;
  numero_gps?: string;
  observaciones?: string;
}

export interface CreateMantenimientoDTO {
  vehiculo: number;
  tipo: TipoMantenimiento;
  descripcion: string;
  fecha_programada: string;
  km_mantenimiento: number;
  km_proximo_mantenimiento?: number;
  costo_mano_obra?: number;
  costo_repuestos?: number;
  proveedor_nombre?: string;
  responsable?: number;
}

export interface CreateConductorDTO {
  nombre_completo: string;
  tipo_documento: TipoDocumentoConductor;
  documento_identidad: string;
  telefono: string;
  email?: string;
  licencia_conduccion: string;
  categoria_licencia: CategoriaLicenciaConductor;
  fecha_vencimiento_licencia: string;
  fecha_ingreso: string;
  es_empleado?: boolean;
  empresa_transportadora?: string;
}

export interface CreateRutaDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo_ruta: number;
  origen_nombre: string;
  origen_direccion: string;
  origen_ciudad: string;
  destino_nombre: string;
  destino_direccion: string;
  destino_ciudad: string;
  distancia_km: number;
  tiempo_estimado_minutos: number;
  costo_estimado?: number;
  peajes_estimados?: number;
  puntos_intermedios?: PuntoIntermedio[];
}

export interface CreateDespachoDTO {
  programacion_ruta: number;
  estado_despacho: number;
  cliente_nombre: string;
  cliente_direccion: string;
  cliente_telefono?: string;
  cliente_contacto?: string;
  peso_total_kg: number;
  volumen_total_m3?: number;
  valor_declarado: number;
  requiere_cadena_frio?: boolean;
  temperatura_requerida?: string;
  observaciones_entrega?: string;
  fecha_entrega_estimada: string;
}

// ==================== FILTERS ====================

export interface VehiculoFilters {
  search?: string;
  tipo_vehiculo?: number;
  estado?: number;
  is_active?: boolean;
  documentos_vencidos?: boolean;
  page?: number;
  page_size?: number;
}

export interface MantenimientoFilters {
  search?: string;
  vehiculo?: number;
  tipo?: TipoMantenimiento;
  estado?: EstadoMantenimiento;
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
  page_size?: number;
}

export interface ConductorFilters {
  search?: string;
  is_active?: boolean;
  licencia_vencida?: boolean;
  page?: number;
  page_size?: number;
}

export interface RutaFilters {
  search?: string;
  tipo_ruta?: number;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

export interface DespachoFilters {
  search?: string;
  estado_despacho?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
  page_size?: number;
}

// ==================== PAGINATED RESPONSES ====================

export type PaginatedVehiculosResponse = PaginatedResponse<VehiculoList>;
export type PaginatedMantenimientosResponse = PaginatedResponse<MantenimientoVehiculo>;
export type PaginatedCostosResponse = PaginatedResponse<CostoOperacion>;
export type PaginatedVerificacionesResponse = PaginatedResponse<VerificacionTercero>;
export type PaginatedRutasResponse = PaginatedResponse<Ruta>;
export type PaginatedConductoresResponse = PaginatedResponse<Conductor>;
export type PaginatedProgramacionesResponse = PaginatedResponse<ProgramacionRuta>;
export type PaginatedDespachosResponse = PaginatedResponse<Despacho>;
export type PaginatedManifiestosResponse = PaginatedResponse<Manifiesto>;

// ==================== LABELS & COLORS ====================

export const TipoMantenimientoLabels: Record<TipoMantenimiento, string> = {
  PREVENTIVO: 'Preventivo',
  CORRECTIVO: 'Correctivo',
  PREDICTIVO: 'Predictivo',
};

export const EstadoMantenimientoLabels: Record<EstadoMantenimiento, string> = {
  PROGRAMADO: 'Programado',
  EN_EJECUCION: 'En Ejecucion',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado',
};

export const EstadoProgramacionLabels: Record<EstadoProgramacion, string> = {
  PROGRAMADA: 'Programada',
  EN_CURSO: 'En Curso',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
};

export const EstadoProgramacionColors: Record<EstadoProgramacion, string> = {
  PROGRAMADA: 'blue',
  EN_CURSO: 'yellow',
  COMPLETADA: 'green',
  CANCELADA: 'red',
};

export const TipoMantenimientoColors: Record<TipoMantenimiento, string> = {
  PREVENTIVO: 'blue',
  CORRECTIVO: 'red',
  PREDICTIVO: 'purple',
};

export const EstadoMantenimientoColors: Record<EstadoMantenimiento, string> = {
  PROGRAMADO: 'blue',
  EN_EJECUCION: 'yellow',
  COMPLETADO: 'green',
  CANCELADO: 'red',
};

export const TipoCostoLabels: Record<TipoCostoOperacion, string> = {
  COMBUSTIBLE: 'Combustible',
  PEAJE: 'Peaje',
  PARQUEADERO: 'Parqueadero',
  LAVADO: 'Lavado',
  LUBRICANTES: 'Lubricantes',
  NEUMATICOS: 'Neumáticos',
  MULTA: 'Multa',
  OTRO: 'Otro',
};

export const TipoDocumentoLabels: Record<TipoDocumentoVehiculo, string> = {
  SOAT: 'SOAT',
  TECNOMECANICA: 'Tecnomecánica',
  TARJETA_PROPIEDAD: 'Tarjeta de Propiedad',
  POLIZA: 'Póliza',
  OPERACION: 'Operación',
  OTRO: 'Otro',
};

export const TipoVerificacionLabels: Record<TipoVerificacion, string> = {
  PREOPERACIONAL_DIARIA: 'Preoperacional Diaria',
  INSPECCION_MENSUAL: 'Inspección Mensual',
  AUDITORIA_EXTERNA: 'Auditoría Externa',
  INSPECCION_ESPECIAL: 'Inspección Especial',
};

export const ResultadoVerificacionLabels: Record<ResultadoVerificacion, string> = {
  APROBADO: 'Aprobado',
  APROBADO_CON_OBSERVACIONES: 'Aprobado con Observaciones',
  RECHAZADO: 'Rechazado',
};

export const ResultadoVerificacionColors: Record<ResultadoVerificacion, string> = {
  APROBADO: 'green',
  APROBADO_CON_OBSERVACIONES: 'yellow',
  RECHAZADO: 'red',
};

export const TipoEventoLabels: Record<TipoEventoVehiculo, string> = {
  MANTENIMIENTO: 'Mantenimiento',
  REPARACION: 'Reparación',
  ACCIDENTE: 'Accidente',
  INFRACCION: 'Infracción',
  MODIFICACION: 'Modificación',
  CAMBIO_PROPIETARIO: 'Cambio Propietario',
  ADQUISICION: 'Adquisición',
  BAJA: 'Baja',
  OTRO: 'Otro',
};

// ==================== CREATE DTOs ADICIONALES ====================

export interface CreateCostoOperacionDTO {
  vehiculo: number;
  fecha: string;
  tipo_costo: TipoCostoOperacion;
  valor: number;
  cantidad?: number;
  km_recorridos?: number;
  factura_numero?: string;
  observaciones?: string;
}

export interface CreateVerificacionDTO {
  vehiculo: number;
  fecha: string;
  tipo: TipoVerificacion;
  inspector?: number;
  inspector_externo?: string;
  checklist_items: ChecklistItem[];
  resultado: ResultadoVerificacion;
  kilometraje: number;
  nivel_combustible?: string;
  observaciones_generales?: string;
  acciones_correctivas?: string;
}

export interface CreateManifiestoDTO {
  programacion_ruta: number;
  remitente_nombre: string;
  remitente_nit: string;
  remitente_direccion: string;
  destinatario_nombre: string;
  destinatario_nit: string;
  destinatario_direccion: string;
  origen_ciudad: string;
  destino_ciudad: string;
  descripcion_carga: string;
  peso_kg: number;
  unidades: number;
  valor_flete: number;
  valor_declarado: number;
  vehiculo_placa: string;
  vehiculo_tipo: string;
  conductor_nombre: string;
  conductor_documento: string;
  observaciones?: string;
}

export interface CreateProgramacionDTO {
  ruta: number;
  vehiculo: number;
  conductor: number;
  fecha_programada: string;
  hora_salida_programada: string;
  hora_llegada_estimada: string;
  observaciones?: string;
}

export interface CreateDocumentoVehiculoDTO {
  vehiculo: number;
  tipo_documento: TipoDocumentoVehiculo;
  numero_documento?: string;
  fecha_expedicion: string;
  fecha_vencimiento: string;
  entidad_emisora?: string;
  observaciones?: string;
}
