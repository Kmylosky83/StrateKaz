/**
 * API Client Index - Sales CRM Module
 * Sistema de Gestión StrateKaz
 *
 * Exporta todos los API clients del módulo CRM
 */

import { apiClient } from '@/lib/api-client';
import type {
  Cliente,
  ClienteList,
  ContactoCliente,
  SegmentoCliente,
  ScoringCliente,
  Oportunidad,
  OportunidadList,
  ActividadOportunidad,
  Cotizacion,
  CotizacionList,
  Pedido,
  PedidoList,
  Factura,
  FacturaList,
  PagoFactura,
  PQRS,
  PQRSList,
  SeguimientoPQRS,
  EncuestaSatisfaccion,
  EncuestaList,
  NPSDashboard,
  ProgramaFidelizacion,
  PuntosFidelizacion,
  MovimientoPuntos,
  CanalVenta,
  CreateClienteDTO,
  UpdateClienteDTO,
  CreateOportunidadDTO,
  UpdateOportunidadDTO,
  CambiarEtapaOportunidadDTO,
  CerrarGanadaDTO,
  CerrarPerdidaDTO,
  CreateCotizacionDTO,
  UpdateCotizacionDTO,
  AprobarCotizacionDTO,
  RechazarCotizacionDTO,
  CreatePedidoDTO,
  UpdatePedidoDTO,
  AprobarPedidoDTO,
  CancelarPedidoDTO,
  CreateFacturaDTO,
  UpdateFacturaDTO,
  RegistrarPagoDTO,
  AnularFacturaDTO,
  CreatePQRSDTO,
  UpdatePQRSDTO,
  AsignarPQRSDTO,
  EscalarPQRSDTO,
  ResolverPQRSDTO,
  CerrarPQRSDTO,
  CreateEncuestaDTO,
  UpdateEncuestaDTO,
  ResponderEncuestaDTO,
  AcumularPuntosDTO,
  CanjearPuntosDTO,
  PaginatedResponse,
  ClienteDashboard,
  PipelineDashboard,
  PQRSDashboard,
} from '../types';

const BASE_URL = '/api/sales-crm';

// ==================== CLIENTES ====================

export const clientesApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    tipo_cliente?: string;
    estado?: string;
    segmento?: number;
    canal_venta?: number;
    vendedor_asignado?: number;
    scoring_min?: number;
    scoring_max?: number;
  }): Promise<PaginatedResponse<ClienteList>> => {
    const response = await apiClient.get(`${BASE_URL}/clientes/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<Cliente> => {
    const response = await apiClient.get(`${BASE_URL}/clientes/${id}/`);
    return response.data;
  },

  create: async (data: CreateClienteDTO): Promise<Cliente> => {
    const response = await apiClient.post(`${BASE_URL}/clientes/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateClienteDTO): Promise<Cliente> => {
    const response = await apiClient.patch(`${BASE_URL}/clientes/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/clientes/${id}/`);
  },

  actualizarScoring: async (id: number): Promise<ScoringCliente> => {
    const response = await apiClient.post(`${BASE_URL}/clientes/${id}/actualizar_scoring/`);
    return response.data;
  },

  getDashboard: async (params?: { empresa_id?: number }): Promise<ClienteDashboard> => {
    const response = await apiClient.get(`${BASE_URL}/clientes/dashboard/`, { params });
    return response.data;
  },
};

// ==================== CONTACTOS DE CLIENTE ====================

export const contactosApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    cliente?: number;
    es_principal?: boolean;
    activo?: boolean;
  }): Promise<PaginatedResponse<ContactoCliente>> => {
    const response = await apiClient.get(`${BASE_URL}/contactos/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<ContactoCliente> => {
    const response = await apiClient.get(`${BASE_URL}/contactos/${id}/`);
    return response.data;
  },

  create: async (data: Partial<ContactoCliente>): Promise<ContactoCliente> => {
    const response = await apiClient.post(`${BASE_URL}/contactos/`, data);
    return response.data;
  },

  update: async (id: number, data: Partial<ContactoCliente>): Promise<ContactoCliente> => {
    const response = await apiClient.patch(`${BASE_URL}/contactos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/contactos/${id}/`);
  },
};

// ==================== SEGMENTOS DE CLIENTE ====================

export const segmentosApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    activo?: boolean;
  }): Promise<PaginatedResponse<SegmentoCliente>> => {
    const response = await apiClient.get(`${BASE_URL}/segmentos/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<SegmentoCliente> => {
    const response = await apiClient.get(`${BASE_URL}/segmentos/${id}/`);
    return response.data;
  },

  create: async (data: Partial<SegmentoCliente>): Promise<SegmentoCliente> => {
    const response = await apiClient.post(`${BASE_URL}/segmentos/`, data);
    return response.data;
  },

  update: async (id: number, data: Partial<SegmentoCliente>): Promise<SegmentoCliente> => {
    const response = await apiClient.patch(`${BASE_URL}/segmentos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/segmentos/${id}/`);
  },
};

// ==================== CANALES DE VENTA ====================

export const canalesVentaApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    activo?: boolean;
  }): Promise<PaginatedResponse<CanalVenta>> => {
    const response = await apiClient.get(`${BASE_URL}/canales-venta/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<CanalVenta> => {
    const response = await apiClient.get(`${BASE_URL}/canales-venta/${id}/`);
    return response.data;
  },

  create: async (data: Partial<CanalVenta>): Promise<CanalVenta> => {
    const response = await apiClient.post(`${BASE_URL}/canales-venta/`, data);
    return response.data;
  },

  update: async (id: number, data: Partial<CanalVenta>): Promise<CanalVenta> => {
    const response = await apiClient.patch(`${BASE_URL}/canales-venta/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/canales-venta/${id}/`);
  },
};

// ==================== OPORTUNIDADES ====================

export const oportunidadesApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    cliente?: number;
    etapa?: string;
    prioridad?: string;
    vendedor?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<PaginatedResponse<OportunidadList>> => {
    const response = await apiClient.get(`${BASE_URL}/oportunidades/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<Oportunidad> => {
    const response = await apiClient.get(`${BASE_URL}/oportunidades/${id}/`);
    return response.data;
  },

  create: async (data: CreateOportunidadDTO): Promise<Oportunidad> => {
    const response = await apiClient.post(`${BASE_URL}/oportunidades/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateOportunidadDTO): Promise<Oportunidad> => {
    const response = await apiClient.patch(`${BASE_URL}/oportunidades/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/oportunidades/${id}/`);
  },

  cambiarEtapa: async (id: number, data: CambiarEtapaOportunidadDTO): Promise<Oportunidad> => {
    const response = await apiClient.post(`${BASE_URL}/oportunidades/${id}/cambiar_etapa/`, data);
    return response.data;
  },

  cerrarGanada: async (id: number, data: CerrarGanadaDTO): Promise<Oportunidad> => {
    const response = await apiClient.post(`${BASE_URL}/oportunidades/${id}/cerrar_ganada/`, data);
    return response.data;
  },

  cerrarPerdida: async (id: number, data: CerrarPerdidaDTO): Promise<Oportunidad> => {
    const response = await apiClient.post(`${BASE_URL}/oportunidades/${id}/cerrar_perdida/`, data);
    return response.data;
  },

  getKanban: async (params?: { vendedor?: number }): Promise<{
    etapas: Array<{
      etapa: string;
      nombre: string;
      oportunidades: OportunidadList[];
      valor_total: number;
    }>;
  }> => {
    const response = await apiClient.get(`${BASE_URL}/oportunidades/kanban/`, { params });
    return response.data;
  },

  getDashboard: async (params?: { vendedor?: number }): Promise<PipelineDashboard> => {
    const response = await apiClient.get(`${BASE_URL}/oportunidades/dashboard/`, { params });
    return response.data;
  },
};

// ==================== ACTIVIDADES DE OPORTUNIDAD ====================

export const actividadesApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    oportunidad?: number;
    tipo?: string;
    completada?: boolean;
  }): Promise<PaginatedResponse<ActividadOportunidad>> => {
    const response = await apiClient.get(`${BASE_URL}/actividades-oportunidad/`, { params });
    return response.data;
  },

  create: async (data: Partial<ActividadOportunidad>): Promise<ActividadOportunidad> => {
    const response = await apiClient.post(`${BASE_URL}/actividades-oportunidad/`, data);
    return response.data;
  },

  update: async (id: number, data: Partial<ActividadOportunidad>): Promise<ActividadOportunidad> => {
    const response = await apiClient.patch(`${BASE_URL}/actividades-oportunidad/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/actividades-oportunidad/${id}/`);
  },
};

// ==================== COTIZACIONES ====================

export const cotizacionesApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    cliente?: number;
    oportunidad?: number;
    estado?: string;
    vendedor?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<PaginatedResponse<CotizacionList>> => {
    const response = await apiClient.get(`${BASE_URL}/cotizaciones/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<Cotizacion> => {
    const response = await apiClient.get(`${BASE_URL}/cotizaciones/${id}/`);
    return response.data;
  },

  create: async (data: CreateCotizacionDTO): Promise<Cotizacion> => {
    const response = await apiClient.post(`${BASE_URL}/cotizaciones/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateCotizacionDTO): Promise<Cotizacion> => {
    const response = await apiClient.patch(`${BASE_URL}/cotizaciones/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/cotizaciones/${id}/`);
  },

  aprobar: async (id: number, data: AprobarCotizacionDTO): Promise<Cotizacion> => {
    const response = await apiClient.post(`${BASE_URL}/cotizaciones/${id}/aprobar/`, data);
    return response.data;
  },

  rechazar: async (id: number, data: RechazarCotizacionDTO): Promise<Cotizacion> => {
    const response = await apiClient.post(`${BASE_URL}/cotizaciones/${id}/rechazar/`, data);
    return response.data;
  },

  clonar: async (id: number): Promise<Cotizacion> => {
    const response = await apiClient.post(`${BASE_URL}/cotizaciones/${id}/clonar/`);
    return response.data;
  },

  convertirAPedido: async (id: number): Promise<Pedido> => {
    const response = await apiClient.post(`${BASE_URL}/cotizaciones/${id}/convertir_pedido/`);
    return response.data;
  },
};

// ==================== PEDIDOS ====================

export const pedidosApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    cliente?: number;
    cotizacion?: number;
    estado?: string;
    vendedor?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<PaginatedResponse<PedidoList>> => {
    const response = await apiClient.get(`${BASE_URL}/pedidos/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<Pedido> => {
    const response = await apiClient.get(`${BASE_URL}/pedidos/${id}/`);
    return response.data;
  },

  create: async (data: CreatePedidoDTO): Promise<Pedido> => {
    const response = await apiClient.post(`${BASE_URL}/pedidos/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdatePedidoDTO): Promise<Pedido> => {
    const response = await apiClient.patch(`${BASE_URL}/pedidos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/pedidos/${id}/`);
  },

  aprobar: async (id: number, data: AprobarPedidoDTO): Promise<Pedido> => {
    const response = await apiClient.post(`${BASE_URL}/pedidos/${id}/aprobar/`, data);
    return response.data;
  },

  cancelar: async (id: number, data: CancelarPedidoDTO): Promise<Pedido> => {
    const response = await apiClient.post(`${BASE_URL}/pedidos/${id}/cancelar/`, data);
    return response.data;
  },

  generarFactura: async (id: number): Promise<Factura> => {
    const response = await apiClient.post(`${BASE_URL}/pedidos/${id}/generar_factura/`);
    return response.data;
  },
};

// ==================== FACTURAS ====================

export const facturasApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    cliente?: number;
    pedido?: number;
    estado?: string;
    metodo_pago?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    vencidas?: boolean;
  }): Promise<PaginatedResponse<FacturaList>> => {
    const response = await apiClient.get(`${BASE_URL}/facturas/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<Factura> => {
    const response = await apiClient.get(`${BASE_URL}/facturas/${id}/`);
    return response.data;
  },

  create: async (data: CreateFacturaDTO): Promise<Factura> => {
    const response = await apiClient.post(`${BASE_URL}/facturas/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateFacturaDTO): Promise<Factura> => {
    const response = await apiClient.patch(`${BASE_URL}/facturas/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/facturas/${id}/`);
  },

  registrarPago: async (id: number, data: RegistrarPagoDTO): Promise<{ factura: Factura; pago: PagoFactura }> => {
    const response = await apiClient.post(`${BASE_URL}/facturas/${id}/registrar_pago/`, data);
    return response.data;
  },

  anular: async (id: number, data: AnularFacturaDTO): Promise<Factura> => {
    const response = await apiClient.post(`${BASE_URL}/facturas/${id}/anular/`, data);
    return response.data;
  },
};

// ==================== PAGOS ====================

export const pagosApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    factura?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
    metodo_pago?: string;
  }): Promise<PaginatedResponse<PagoFactura>> => {
    const response = await apiClient.get(`${BASE_URL}/pagos/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<PagoFactura> => {
    const response = await apiClient.get(`${BASE_URL}/pagos/${id}/`);
    return response.data;
  },
};

// ==================== PQRS ====================

export const pqrsApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    tipo?: string;
    cliente?: number;
    estado?: string;
    prioridad?: string;
    asignado_a?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<PaginatedResponse<PQRSList>> => {
    const response = await apiClient.get(`${BASE_URL}/pqrs/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<PQRS> => {
    const response = await apiClient.get(`${BASE_URL}/pqrs/${id}/`);
    return response.data;
  },

  create: async (data: CreatePQRSDTO): Promise<PQRS> => {
    const response = await apiClient.post(`${BASE_URL}/pqrs/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdatePQRSDTO): Promise<PQRS> => {
    const response = await apiClient.patch(`${BASE_URL}/pqrs/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/pqrs/${id}/`);
  },

  asignar: async (id: number, data: AsignarPQRSDTO): Promise<PQRS> => {
    const response = await apiClient.post(`${BASE_URL}/pqrs/${id}/asignar/`, data);
    return response.data;
  },

  escalar: async (id: number, data: EscalarPQRSDTO): Promise<PQRS> => {
    const response = await apiClient.post(`${BASE_URL}/pqrs/${id}/escalar/`, data);
    return response.data;
  },

  resolver: async (id: number, data: ResolverPQRSDTO): Promise<PQRS> => {
    const response = await apiClient.post(`${BASE_URL}/pqrs/${id}/resolver/`, data);
    return response.data;
  },

  cerrar: async (id: number, data: CerrarPQRSDTO): Promise<PQRS> => {
    const response = await apiClient.post(`${BASE_URL}/pqrs/${id}/cerrar/`, data);
    return response.data;
  },

  getDashboard: async (params?: { empresa_id?: number }): Promise<PQRSDashboard> => {
    const response = await apiClient.get(`${BASE_URL}/pqrs/dashboard/`, { params });
    return response.data;
  },
};

// ==================== SEGUIMIENTO PQRS ====================

export const seguimientoPQRSApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    pqrs?: number;
    tipo_seguimiento?: string;
  }): Promise<PaginatedResponse<SeguimientoPQRS>> => {
    const response = await apiClient.get(`${BASE_URL}/seguimiento-pqrs/`, { params });
    return response.data;
  },

  create: async (data: Partial<SeguimientoPQRS>): Promise<SeguimientoPQRS> => {
    const response = await apiClient.post(`${BASE_URL}/seguimiento-pqrs/`, data);
    return response.data;
  },
};

// ==================== ENCUESTAS ====================

export const encuestasApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    tipo?: string;
    cliente?: number;
    estado?: string;
    respondida?: boolean;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<PaginatedResponse<EncuestaList>> => {
    const response = await apiClient.get(`${BASE_URL}/encuestas/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<EncuestaSatisfaccion> => {
    const response = await apiClient.get(`${BASE_URL}/encuestas/${id}/`);
    return response.data;
  },

  create: async (data: CreateEncuestaDTO): Promise<EncuestaSatisfaccion> => {
    const response = await apiClient.post(`${BASE_URL}/encuestas/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateEncuestaDTO): Promise<EncuestaSatisfaccion> => {
    const response = await apiClient.patch(`${BASE_URL}/encuestas/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/encuestas/${id}/`);
  },

  enviar: async (id: number): Promise<EncuestaSatisfaccion> => {
    const response = await apiClient.post(`${BASE_URL}/encuestas/${id}/enviar/`);
    return response.data;
  },

  responder: async (id: number, data: ResponderEncuestaDTO): Promise<EncuestaSatisfaccion> => {
    const response = await apiClient.post(`${BASE_URL}/encuestas/${id}/responder/`, data);
    return response.data;
  },

  getNPSDashboard: async (params?: {
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<NPSDashboard> => {
    const response = await apiClient.get(`${BASE_URL}/encuestas/nps_dashboard/`, { params });
    return response.data;
  },
};

// ==================== PROGRAMAS DE FIDELIZACION ====================

export const programasFidelizacionApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    estado?: string;
    activo?: boolean;
  }): Promise<PaginatedResponse<ProgramaFidelizacion>> => {
    const response = await apiClient.get(`${BASE_URL}/programas-fidelizacion/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<ProgramaFidelizacion> => {
    const response = await apiClient.get(`${BASE_URL}/programas-fidelizacion/${id}/`);
    return response.data;
  },

  create: async (data: Partial<ProgramaFidelizacion>): Promise<ProgramaFidelizacion> => {
    const response = await apiClient.post(`${BASE_URL}/programas-fidelizacion/`, data);
    return response.data;
  },

  update: async (id: number, data: Partial<ProgramaFidelizacion>): Promise<ProgramaFidelizacion> => {
    const response = await apiClient.patch(`${BASE_URL}/programas-fidelizacion/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/programas-fidelizacion/${id}/`);
  },
};

// ==================== PUNTOS DE FIDELIZACION ====================

export const puntosFidelizacionApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    cliente?: number;
    programa?: number;
  }): Promise<PaginatedResponse<PuntosFidelizacion>> => {
    const response = await apiClient.get(`${BASE_URL}/puntos-fidelizacion/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<PuntosFidelizacion> => {
    const response = await apiClient.get(`${BASE_URL}/puntos-fidelizacion/${id}/`);
    return response.data;
  },

  acumular: async (data: AcumularPuntosDTO): Promise<MovimientoPuntos> => {
    const response = await apiClient.post(`${BASE_URL}/puntos-fidelizacion/acumular/`, data);
    return response.data;
  },

  canjear: async (data: CanjearPuntosDTO): Promise<MovimientoPuntos> => {
    const response = await apiClient.post(`${BASE_URL}/puntos-fidelizacion/canjear/`, data);
    return response.data;
  },
};

// ==================== MOVIMIENTOS DE PUNTOS ====================

export const movimientosPuntosApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    cliente?: number;
    programa?: number;
    tipo_movimiento?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<PaginatedResponse<MovimientoPuntos>> => {
    const response = await apiClient.get(`${BASE_URL}/movimientos-puntos/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<MovimientoPuntos> => {
    const response = await apiClient.get(`${BASE_URL}/movimientos-puntos/${id}/`);
    return response.data;
  },
};

// ==================== EXPORT DEFAULT ====================

export default {
  clientes: clientesApi,
  contactos: contactosApi,
  segmentos: segmentosApi,
  canalesVenta: canalesVentaApi,
  oportunidades: oportunidadesApi,
  actividades: actividadesApi,
  cotizaciones: cotizacionesApi,
  pedidos: pedidosApi,
  facturas: facturasApi,
  pagos: pagosApi,
  pqrs: pqrsApi,
  seguimientoPQRS: seguimientoPQRSApi,
  encuestas: encuestasApi,
  programasFidelizacion: programasFidelizacionApi,
  puntosFidelizacion: puntosFidelizacionApi,
  movimientosPuntos: movimientosPuntosApi,
};
