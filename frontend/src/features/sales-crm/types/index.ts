/**
 * Types Index - Sales CRM Module
 * Sistema de Gestión StrateKaz
 *
 * Exporta todos los tipos del módulo CRM
 */

// ==================== COMMON TYPES ====================
import { PaginatedResponse } from '@/types';
export type { PaginatedResponse };

// ==================== CLIENTE ====================

export type TipoCliente =
  | 'CARNICERIA'
  | 'RESTAURANTE'
  | 'PROCESADORA'
  | 'INDUSTRIA'
  | 'EXPORTADOR'
  | 'OTRO';
export type EstadoCliente = 'PROSPECTO' | 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';
export type TipoPersona = 'NATURAL' | 'JURIDICA';

export interface Cliente {
  id: number;
  codigo_cliente: string;
  tipo_persona: TipoPersona;
  tipo_cliente: TipoCliente;
  nombre_comercial: string;
  razon_social?: string;
  nit?: string;
  cedula?: string;
  digito_verificacion?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  pais: string;
  estado: EstadoCliente;
  scoring_cliente: number;
  credito_aprobado: number;
  dias_credito: number;
  descuento_maximo: number;
  segmento?: number;
  segmento_nombre?: string;
  canal_venta?: number;
  canal_venta_nombre?: string;
  vendedor_asignado?: number;
  vendedor_asignado_nombre?: string;
  parte_interesada_id?: number | null;
  parte_interesada_nombre?: string;
  observaciones?: string;
  fecha_alta: string;
  ultima_compra?: string;
  total_compras: number;
  num_pedidos: number;
  num_facturas_pendientes: number;
  saldo_pendiente: number;
  created_at: string;
  updated_at: string;
}

export interface ClienteList {
  id: number;
  codigo_cliente: string;
  nombre_comercial: string;
  razon_social?: string;
  tipo_cliente: TipoCliente;
  nit?: string;
  cedula?: string;
  telefono?: string;
  email?: string;
  ciudad?: string;
  estado: EstadoCliente;
  scoring_cliente: number;
  segmento_nombre?: string;
  vendedor_asignado_nombre?: string;
  parte_interesada_id?: number | null;
  parte_interesada_nombre?: string;
  saldo_pendiente: number;
  total_compras: number;
  created_at: string;
}

export interface ContactoCliente {
  id: number;
  cliente: number;
  cliente_nombre: string;
  nombre_completo: string;
  cargo?: string;
  telefono?: string;
  celular?: string;
  email?: string;
  es_principal: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface SegmentoCliente {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  num_clientes: number;
  created_at: string;
}

export interface ScoringCliente {
  id: number;
  cliente: number;
  cliente_nombre: string;
  fecha_calculo: string;
  puntuacion_final: number;
  antiguedad_puntos: number;
  volumen_compras_puntos: number;
  frecuencia_puntos: number;
  puntualidad_pago_puntos: number;
  calificacion: string;
  observaciones?: string;
}

// ==================== OPORTUNIDAD ====================

export type EtapaVenta =
  | 'PROSPECTO'
  | 'CONTACTADO'
  | 'CALIFICADO'
  | 'PROPUESTA'
  | 'NEGOCIACION'
  | 'GANADA'
  | 'PERDIDA';
export type PrioridadOportunidad = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export interface Oportunidad {
  id: number;
  numero_oportunidad: string;
  cliente: number;
  cliente_nombre: string;
  cliente_email?: string;
  cliente_telefono?: string;
  contacto?: number;
  contacto_nombre?: string;
  titulo: string;
  descripcion?: string;
  etapa: EtapaVenta;
  prioridad: PrioridadOportunidad;
  valor_estimado: number;
  probabilidad_cierre: number;
  fecha_estimada_cierre?: string;
  fuente_lead?: string;
  producto_interes?: string;
  vendedor: number;
  vendedor_nombre: string;
  fecha_ganada?: string;
  fecha_perdida?: string;
  motivo_perdida?: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface OportunidadList {
  id: number;
  numero_oportunidad: string;
  cliente_nombre: string;
  titulo: string;
  etapa: EtapaVenta;
  prioridad: PrioridadOportunidad;
  valor_estimado: number;
  probabilidad_cierre: number;
  fecha_estimada_cierre?: string;
  vendedor_nombre: string;
  dias_en_etapa: number;
  created_at: string;
}

export interface ActividadOportunidad {
  id: number;
  oportunidad: number;
  tipo: 'LLAMADA' | 'EMAIL' | 'REUNION' | 'TAREA' | 'OTRO';
  titulo: string;
  descripcion?: string;
  fecha_actividad: string;
  completada: boolean;
  usuario: number;
  usuario_nombre: string;
  created_at: string;
}

// ==================== COTIZACION ====================

export type EstadoCotizacion =
  | 'BORRADOR'
  | 'ENVIADA'
  | 'APROBADA'
  | 'RECHAZADA'
  | 'VENCIDA'
  | 'CONVERTIDA';

export interface Cotizacion {
  id: number;
  numero_cotizacion: string;
  oportunidad?: number;
  oportunidad_numero?: string;
  cliente: number;
  cliente_nombre: string;
  cliente_nit?: string;
  cliente_direccion?: string;
  contacto?: number;
  contacto_nombre?: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  estado: EstadoCotizacion;
  subtotal: number;
  descuento_porcentaje: number;
  descuento_monto: number;
  iva_porcentaje: number;
  iva_monto: number;
  total: number;
  observaciones?: string;
  condiciones_pago?: string;
  tiempo_entrega?: string;
  validez_dias: number;
  aprobada_por?: number;
  aprobada_por_nombre?: string;
  fecha_aprobacion?: string;
  fecha_rechazo?: string;
  motivo_rechazo?: string;
  pedido_generado?: number;
  pedido_numero?: string;
  vendedor: number;
  vendedor_nombre: string;
  detalles: DetalleCotizacion[];
  created_at: string;
  updated_at: string;
}

export interface CotizacionList {
  id: number;
  numero_cotizacion: string;
  cliente_nombre: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  estado: EstadoCotizacion;
  total: number;
  vendedor_nombre: string;
  dias_vigencia: number;
  created_at: string;
}

export interface DetalleCotizacion {
  id: number;
  cotizacion: number;
  producto_id?: number;
  producto_nombre: string;
  descripcion?: string;
  cantidad: number;
  unidad_medida: string;
  precio_unitario: number;
  descuento_porcentaje: number;
  descuento_monto: number;
  subtotal: number;
  iva_porcentaje: number;
  iva_monto: number;
  total: number;
  orden: number;
}

// ==================== PEDIDO ====================

export type EstadoPedido =
  | 'BORRADOR'
  | 'CONFIRMADO'
  | 'EN_PREPARACION'
  | 'LISTO'
  | 'ENVIADO'
  | 'ENTREGADO'
  | 'CANCELADO';
export type TipoEntrega = 'RETIRO_CLIENTE' | 'DESPACHO_PROPIO' | 'TRANSPORTADORA';

export interface Pedido {
  id: number;
  numero_pedido: string;
  cotizacion?: number;
  cotizacion_numero?: string;
  cliente: number;
  cliente_nombre: string;
  cliente_nit?: string;
  cliente_direccion?: string;
  contacto?: number;
  contacto_nombre?: string;
  fecha_pedido: string;
  fecha_entrega_estimada?: string;
  fecha_entrega_real?: string;
  estado: EstadoPedido;
  tipo_entrega: TipoEntrega;
  direccion_entrega?: string;
  ciudad_entrega?: string;
  observaciones_entrega?: string;
  subtotal: number;
  descuento_porcentaje: number;
  descuento_monto: number;
  iva_porcentaje: number;
  iva_monto: number;
  flete: number;
  total: number;
  observaciones?: string;
  aprobado_por?: number;
  aprobado_por_nombre?: string;
  fecha_aprobacion?: string;
  motivo_cancelacion?: string;
  fecha_cancelacion?: string;
  factura_generada?: number;
  factura_numero?: string;
  vendedor: number;
  vendedor_nombre: string;
  detalles: DetallePedido[];
  created_at: string;
  updated_at: string;
}

export interface PedidoList {
  id: number;
  numero_pedido: string;
  cliente_nombre: string;
  fecha_pedido: string;
  fecha_entrega_estimada?: string;
  estado: EstadoPedido;
  total: number;
  vendedor_nombre: string;
  factura_numero?: string;
  created_at: string;
}

export interface DetallePedido {
  id: number;
  pedido: number;
  producto_id?: number;
  producto_nombre: string;
  descripcion?: string;
  cantidad: number;
  cantidad_entregada: number;
  unidad_medida: string;
  precio_unitario: number;
  descuento_porcentaje: number;
  descuento_monto: number;
  subtotal: number;
  iva_porcentaje: number;
  iva_monto: number;
  total: number;
  orden: number;
}

// ==================== FACTURA ====================

export type EstadoFactura =
  | 'BORRADOR'
  | 'EMITIDA'
  | 'PAGADA_PARCIAL'
  | 'PAGADA'
  | 'VENCIDA'
  | 'ANULADA';
export type MetodoPago =
  | 'EFECTIVO'
  | 'TRANSFERENCIA'
  | 'CHEQUE'
  | 'TARJETA_CREDITO'
  | 'TARJETA_DEBITO'
  | 'CREDITO';

export interface Factura {
  id: number;
  numero_factura: string;
  pedido?: number;
  pedido_numero?: string;
  cliente: number;
  cliente_nombre: string;
  cliente_nit?: string;
  cliente_direccion?: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  estado: EstadoFactura;
  metodo_pago: MetodoPago;
  subtotal: number;
  descuento_monto: number;
  iva_monto: number;
  retencion_monto: number;
  total: number;
  saldo_pendiente: number;
  observaciones?: string;
  fecha_anulacion?: string;
  motivo_anulacion?: string;
  vendedor: number;
  vendedor_nombre: string;
  pagos: PagoFactura[];
  created_at: string;
  updated_at: string;
}

export interface FacturaList {
  id: number;
  numero_factura: string;
  cliente_nombre: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  estado: EstadoFactura;
  total: number;
  saldo_pendiente: number;
  dias_vencimiento: number;
  created_at: string;
}

export interface PagoFactura {
  id: number;
  factura: number;
  numero_recibo: string;
  fecha_pago: string;
  monto: number;
  metodo_pago: MetodoPago;
  referencia_pago?: string;
  banco?: string;
  observaciones?: string;
  registrado_por: number;
  registrado_por_nombre: string;
  created_at: string;
}

// ==================== PQRS ====================

export type TipoPQRS = 'PETICION' | 'QUEJA' | 'RECLAMO' | 'SUGERENCIA' | 'FELICITACION';
export type EstadoPQRS =
  | 'ABIERTA'
  | 'EN_PROCESO'
  | 'ESCALADA'
  | 'RESUELTA'
  | 'CERRADA'
  | 'CANCELADA';
export type PrioridadPQRS = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export interface PQRS {
  id: number;
  numero_ticket: string;
  tipo: TipoPQRS;
  cliente: number;
  cliente_nombre: string;
  contacto?: number;
  contacto_nombre?: string;
  asunto: string;
  descripcion: string;
  estado: EstadoPQRS;
  prioridad: PrioridadPQRS;
  canal_recepcion: 'TELEFONO' | 'EMAIL' | 'WEB' | 'PRESENCIAL' | 'WHATSAPP';
  fecha_recepcion: string;
  fecha_limite_respuesta?: string;
  fecha_resolucion?: string;
  fecha_cierre?: string;
  asignado_a?: number;
  asignado_a_nombre?: string;
  fecha_asignacion?: string;
  solucion_propuesta?: string;
  accion_correctiva?: string;
  satisfaccion_cliente?: number;
  observaciones?: string;
  pedido_relacionado?: number;
  pedido_numero?: string;
  factura_relacionada?: number;
  factura_numero?: string;
  created_at: string;
  updated_at: string;
}

export interface PQRSList {
  id: number;
  numero_ticket: string;
  tipo: TipoPQRS;
  cliente_nombre: string;
  asunto: string;
  estado: EstadoPQRS;
  prioridad: PrioridadPQRS;
  fecha_recepcion: string;
  fecha_limite_respuesta?: string;
  asignado_a_nombre?: string;
  dias_abierta: number;
  created_at: string;
}

export interface SeguimientoPQRS {
  id: number;
  pqrs: number;
  usuario: number;
  usuario_nombre: string;
  tipo_seguimiento: 'COMENTARIO' | 'ESTADO' | 'ASIGNACION' | 'ESCALAMIENTO';
  descripcion: string;
  estado_anterior?: EstadoPQRS;
  estado_nuevo?: EstadoPQRS;
  created_at: string;
}

// ==================== ENCUESTAS ====================

export type EstadoEncuesta = 'BORRADOR' | 'ACTIVA' | 'FINALIZADA';
export type TipoEncuesta = 'NPS' | 'SATISFACCION' | 'CALIDAD_PRODUCTO' | 'SERVICIO_CLIENTE';

export interface EncuestaSatisfaccion {
  id: number;
  titulo: string;
  descripcion?: string;
  tipo: TipoEncuesta;
  estado: EstadoEncuesta;
  fecha_inicio: string;
  fecha_fin?: string;
  cliente?: number;
  cliente_nombre?: string;
  pedido?: number;
  pedido_numero?: string;
  factura?: number;
  factura_numero?: string;
  pregunta_nps?: string;
  puntuacion_nps?: number;
  es_promotor?: boolean;
  es_neutral?: boolean;
  es_detractor?: boolean;
  comentarios?: string;
  fecha_respuesta?: string;
  enviada: boolean;
  fecha_envio?: string;
  respondida: boolean;
  created_at: string;
  updated_at: string;
}

export interface EncuestaList {
  id: number;
  titulo: string;
  tipo: TipoEncuesta;
  cliente_nombre?: string;
  estado: EstadoEncuesta;
  puntuacion_nps?: number;
  respondida: boolean;
  fecha_envio?: string;
  fecha_respuesta?: string;
  created_at: string;
}

export interface NPSDashboard {
  nps_score: number;
  total_respuestas: number;
  promotores: number;
  neutrales: number;
  detractores: number;
  porcentaje_promotores: number;
  porcentaje_neutrales: number;
  porcentaje_detractores: number;
  promedio_puntuacion: number;
  tasa_respuesta: number;
}

// ==================== FIDELIZACION ====================

export type EstadoPrograma = 'ACTIVO' | 'INACTIVO' | 'PAUSADO';
export type TipoRecompensa = 'DESCUENTO' | 'PRODUCTO_GRATIS' | 'ENVIO_GRATIS' | 'SERVICIO_ESPECIAL';

export interface ProgramaFidelizacion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  estado: EstadoPrograma;
  puntos_por_peso_compra: number;
  puntos_minimos_canje: number;
  vigencia_puntos_dias?: number;
  fecha_inicio: string;
  fecha_fin?: string;
  activo: boolean;
  num_clientes_activos: number;
  created_at: string;
  updated_at: string;
}

export interface PuntosFidelizacion {
  id: number;
  cliente: number;
  cliente_nombre: string;
  programa: number;
  programa_nombre: string;
  puntos_disponibles: number;
  puntos_acumulados_total: number;
  puntos_canjeados_total: number;
  puntos_expirados: number;
  fecha_ultimo_movimiento?: string;
  created_at: string;
  updated_at: string;
}

export interface MovimientoPuntos {
  id: number;
  cliente: number;
  cliente_nombre: string;
  programa: number;
  programa_nombre: string;
  tipo_movimiento: 'ACUMULACION' | 'CANJE' | 'EXPIRACION' | 'AJUSTE';
  puntos: number;
  puntos_antes: number;
  puntos_despues: number;
  descripcion?: string;
  pedido?: number;
  pedido_numero?: string;
  factura?: number;
  factura_numero?: string;
  fecha_movimiento: string;
  fecha_expiracion?: string;
  usuario: number;
  usuario_nombre: string;
  created_at: string;
}

// ==================== CATALOGOS ====================

export interface CanalVenta {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  num_clientes: number;
  created_at: string;
}

// ==================== DTOs ====================

export interface CreateClienteDTO {
  tipo_persona: TipoPersona;
  tipo_cliente: TipoCliente;
  nombre_comercial: string;
  razon_social?: string;
  nit?: string;
  cedula?: string;
  digito_verificacion?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  pais?: string;
  credito_aprobado?: number;
  dias_credito?: number;
  descuento_maximo?: number;
  segmento?: number;
  canal_venta?: number;
  vendedor_asignado?: number;
  observaciones?: string;
  parte_interesada_id?: number | null;
  parte_interesada_nombre?: string;
}

export interface UpdateClienteDTO extends Partial<CreateClienteDTO> {
  estado?: EstadoCliente;
}

export interface CreateOportunidadDTO {
  cliente: number;
  contacto?: number;
  titulo: string;
  descripcion?: string;
  etapa?: EtapaVenta;
  prioridad?: PrioridadOportunidad;
  valor_estimado?: number;
  probabilidad_cierre?: number;
  fecha_estimada_cierre?: string;
  fuente_lead?: string;
  producto_interes?: string;
  vendedor: number;
  observaciones?: string;
}

export type UpdateOportunidadDTO = Partial<CreateOportunidadDTO>;

export interface CambiarEtapaOportunidadDTO {
  etapa: EtapaVenta;
  observaciones?: string;
}

export interface CerrarGanadaDTO {
  fecha_ganada?: string;
  observaciones?: string;
}

export interface CerrarPerdidaDTO {
  motivo_perdida: string;
  fecha_perdida?: string;
  observaciones?: string;
}

export interface CreateCotizacionDTO {
  oportunidad?: number;
  cliente: number;
  contacto?: number;
  fecha_vencimiento?: string;
  validez_dias?: number;
  descuento_porcentaje?: number;
  iva_porcentaje?: number;
  observaciones?: string;
  condiciones_pago?: string;
  tiempo_entrega?: string;
  detalles: Array<{
    producto_id?: number;
    producto_nombre: string;
    descripcion?: string;
    cantidad: number;
    unidad_medida: string;
    precio_unitario: number;
    descuento_porcentaje?: number;
    iva_porcentaje?: number;
  }>;
}

export type UpdateCotizacionDTO = Partial<CreateCotizacionDTO>;

export interface AprobarCotizacionDTO {
  observaciones?: string;
}

export interface RechazarCotizacionDTO {
  motivo_rechazo: string;
}

export interface CreatePedidoDTO {
  cotizacion?: number;
  cliente: number;
  contacto?: number;
  fecha_entrega_estimada?: string;
  tipo_entrega: TipoEntrega;
  direccion_entrega?: string;
  ciudad_entrega?: string;
  observaciones_entrega?: string;
  descuento_porcentaje?: number;
  iva_porcentaje?: number;
  flete?: number;
  observaciones?: string;
  detalles: Array<{
    producto_id?: number;
    producto_nombre: string;
    descripcion?: string;
    cantidad: number;
    unidad_medida: string;
    precio_unitario: number;
    descuento_porcentaje?: number;
    iva_porcentaje?: number;
  }>;
}

export type UpdatePedidoDTO = Partial<CreatePedidoDTO>;

export interface AprobarPedidoDTO {
  observaciones?: string;
}

export interface CancelarPedidoDTO {
  motivo_cancelacion: string;
}

export interface CreateFacturaDTO {
  pedido?: number;
  cliente: number;
  fecha_vencimiento?: string;
  metodo_pago: MetodoPago;
  descuento_monto?: number;
  iva_monto?: number;
  retencion_monto?: number;
  observaciones?: string;
}

export type UpdateFacturaDTO = Partial<CreateFacturaDTO>;

export interface RegistrarPagoDTO {
  fecha_pago: string;
  monto: number;
  metodo_pago: MetodoPago;
  referencia_pago?: string;
  banco?: string;
  observaciones?: string;
}

export interface AnularFacturaDTO {
  motivo_anulacion: string;
}

export interface CreatePQRSDTO {
  tipo: TipoPQRS;
  cliente: number;
  contacto?: number;
  asunto: string;
  descripcion: string;
  prioridad?: PrioridadPQRS;
  canal_recepcion: 'TELEFONO' | 'EMAIL' | 'WEB' | 'PRESENCIAL' | 'WHATSAPP';
  pedido_relacionado?: number;
  factura_relacionada?: number;
  observaciones?: string;
}

export type UpdatePQRSDTO = Partial<CreatePQRSDTO>;

export interface AsignarPQRSDTO {
  asignado_a: number;
  observaciones?: string;
}

export interface EscalarPQRSDTO {
  asignado_a: number;
  motivo_escalamiento: string;
}

export interface ResolverPQRSDTO {
  solucion_propuesta: string;
  accion_correctiva?: string;
}

export interface CerrarPQRSDTO {
  satisfaccion_cliente?: number;
  observaciones?: string;
}

export interface CreateEncuestaDTO {
  titulo: string;
  descripcion?: string;
  tipo: TipoEncuesta;
  cliente?: number;
  pedido?: number;
  factura?: number;
  pregunta_nps?: string;
}

export type UpdateEncuestaDTO = Partial<CreateEncuestaDTO>;

export interface ResponderEncuestaDTO {
  puntuacion_nps?: number;
  comentarios?: string;
}

export interface AcumularPuntosDTO {
  cliente: number;
  programa: number;
  puntos: number;
  descripcion?: string;
  pedido?: number;
  factura?: number;
}

export interface CanjearPuntosDTO {
  cliente: number;
  programa: number;
  puntos: number;
  descripcion: string;
  pedido?: number;
}

// ==================== DASHBOARD ====================

export interface ClienteDashboard {
  total_clientes: number;
  clientes_activos: number;
  clientes_nuevos_mes: number;
  clientes_alto_scoring: number;
  total_saldo_pendiente: number;
  promedio_scoring: number;
  distribucion_segmentos: Array<{ segmento: string; cantidad: number }>;
  distribucion_tipos: Array<{ tipo: TipoCliente; cantidad: number }>;
}

export interface PipelineDashboard {
  total_oportunidades: number;
  valor_pipeline_total: number;
  valor_ponderado: number;
  tasa_conversion: number;
  tiempo_promedio_cierre_dias: number;
  oportunidades_por_etapa: Array<{ etapa: EtapaVenta; cantidad: number; valor: number }>;
  top_vendedores: Array<{ vendedor: string; cantidad: number; valor: number }>;
}

export interface PQRSDashboard {
  total_pqrs: number;
  abiertas: number;
  en_proceso: number;
  resueltas: number;
  tiempo_promedio_resolucion_horas: number;
  tasa_resolucion_sla: number;
  distribucion_tipos: Array<{ tipo: TipoPQRS; cantidad: number }>;
  distribucion_prioridades: Array<{ prioridad: PrioridadPQRS; cantidad: number }>;
}
