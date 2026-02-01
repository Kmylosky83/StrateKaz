/**
 * Query Keys para React Query - Sales CRM Module
 */

export const salesCRMKeys = {
  all: ['sales-crm'] as const,

  // Clientes
  clientes: () => [...salesCRMKeys.all, 'clientes'] as const,
  clienteById: (id: number) => [...salesCRMKeys.clientes(), id] as const,
  clientesFiltered: (filters: Record<string, any>) => [...salesCRMKeys.clientes(), 'filtered', filters] as const,
  clienteDashboard: () => [...salesCRMKeys.clientes(), 'dashboard'] as const,

  // Contactos
  contactos: () => [...salesCRMKeys.all, 'contactos'] as const,
  contactoById: (id: number) => [...salesCRMKeys.contactos(), id] as const,
  contactosFiltered: (filters: Record<string, any>) => [...salesCRMKeys.contactos(), 'filtered', filters] as const,

  // Segmentos
  segmentos: () => [...salesCRMKeys.all, 'segmentos'] as const,
  segmentoById: (id: number) => [...salesCRMKeys.segmentos(), id] as const,

  // Canales de Venta
  canalesVenta: () => [...salesCRMKeys.all, 'canales-venta'] as const,
  canalVentaById: (id: number) => [...salesCRMKeys.canalesVenta(), id] as const,

  // Oportunidades
  oportunidades: () => [...salesCRMKeys.all, 'oportunidades'] as const,
  oportunidadById: (id: number) => [...salesCRMKeys.oportunidades(), id] as const,
  oportunidadesFiltered: (filters: Record<string, any>) => [...salesCRMKeys.oportunidades(), 'filtered', filters] as const,
  pipelineKanban: (vendedor?: number) => [...salesCRMKeys.oportunidades(), 'kanban', vendedor] as const,
  pipelineDashboard: (vendedor?: number) => [...salesCRMKeys.oportunidades(), 'dashboard', vendedor] as const,

  // Actividades
  actividades: () => [...salesCRMKeys.all, 'actividades'] as const,
  actividadById: (id: number) => [...salesCRMKeys.actividades(), id] as const,
  actividadesFiltered: (filters: Record<string, any>) => [...salesCRMKeys.actividades(), 'filtered', filters] as const,

  // Cotizaciones
  cotizaciones: () => [...salesCRMKeys.all, 'cotizaciones'] as const,
  cotizacionById: (id: number) => [...salesCRMKeys.cotizaciones(), id] as const,
  cotizacionesFiltered: (filters: Record<string, any>) => [...salesCRMKeys.cotizaciones(), 'filtered', filters] as const,

  // Pedidos
  pedidos: () => [...salesCRMKeys.all, 'pedidos'] as const,
  pedidoById: (id: number) => [...salesCRMKeys.pedidos(), id] as const,
  pedidosFiltered: (filters: Record<string, any>) => [...salesCRMKeys.pedidos(), 'filtered', filters] as const,

  // Facturas
  facturas: () => [...salesCRMKeys.all, 'facturas'] as const,
  facturaById: (id: number) => [...salesCRMKeys.facturas(), id] as const,
  facturasFiltered: (filters: Record<string, any>) => [...salesCRMKeys.facturas(), 'filtered', filters] as const,

  // Pagos
  pagos: () => [...salesCRMKeys.all, 'pagos'] as const,
  pagoById: (id: number) => [...salesCRMKeys.pagos(), id] as const,
  pagosFiltered: (filters: Record<string, any>) => [...salesCRMKeys.pagos(), 'filtered', filters] as const,

  // PQRS
  pqrs: () => [...salesCRMKeys.all, 'pqrs'] as const,
  pqrsById: (id: number) => [...salesCRMKeys.pqrs(), id] as const,
  pqrsFiltered: (filters: Record<string, any>) => [...salesCRMKeys.pqrs(), 'filtered', filters] as const,
  pqrsDashboard: () => [...salesCRMKeys.pqrs(), 'dashboard'] as const,

  // Seguimiento PQRS
  seguimientoPQRS: () => [...salesCRMKeys.all, 'seguimiento-pqrs'] as const,
  seguimientoPQRSFiltered: (filters: Record<string, any>) => [...salesCRMKeys.seguimientoPQRS(), 'filtered', filters] as const,

  // Encuestas
  encuestas: () => [...salesCRMKeys.all, 'encuestas'] as const,
  encuestaById: (id: number) => [...salesCRMKeys.encuestas(), id] as const,
  encuestasFiltered: (filters: Record<string, any>) => [...salesCRMKeys.encuestas(), 'filtered', filters] as const,
  npsDashboard: () => [...salesCRMKeys.encuestas(), 'nps-dashboard'] as const,

  // Programas de Fidelización
  programasFidelizacion: () => [...salesCRMKeys.all, 'programas-fidelizacion'] as const,
  programaFidelizacionById: (id: number) => [...salesCRMKeys.programasFidelizacion(), id] as const,

  // Puntos de Fidelización
  puntosFidelizacion: () => [...salesCRMKeys.all, 'puntos-fidelizacion'] as const,
  puntosFidelizacionById: (id: number) => [...salesCRMKeys.puntosFidelizacion(), id] as const,
  puntosFidelizacionFiltered: (filters: Record<string, any>) => [...salesCRMKeys.puntosFidelizacion(), 'filtered', filters] as const,

  // Movimientos de Puntos
  movimientosPuntos: () => [...salesCRMKeys.all, 'movimientos-puntos'] as const,
  movimientosPuntosFiltered: (filters: Record<string, any>) => [...salesCRMKeys.movimientosPuntos(), 'filtered', filters] as const,
};
