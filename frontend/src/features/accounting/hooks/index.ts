/**
 * Hooks para Accounting — React Query con invalidacion cruzada
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  planesCuentasApi,
  cuentasContablesApi,
  tiposDocumentoApi,
  tercerosApi,
  centrosCostoApi,
  configuracionApi,
  comprobantesApi,
  detallesComprobanteApi,
  secuenciasApi,
  plantillasApi,
  informesApi,
  lineasInformeApi,
  generacionesApi,
  parametrosIntegracionApi,
  logsIntegracionApi,
  colaContabilizacionApi,
} from '../api';

// ==================== CONFIG CONTABLE ====================

// --- Planes de Cuentas ---
export const usePlanesCuentas = () =>
  useQuery({ queryKey: ['accounting', 'planes-cuentas'], queryFn: planesCuentasApi.getAll });

export const usePlanCuentas = (id: number) =>
  useQuery({
    queryKey: ['accounting', 'plan-cuentas', id],
    queryFn: () => planesCuentasApi.getById(id),
    enabled: !!id,
  });

export const useCreatePlanCuentas = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: planesCuentasApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'planes-cuentas'] }),
  });
};

export const useUpdatePlanCuentas = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof planesCuentasApi.update>[1];
    }) => planesCuentasApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'planes-cuentas'] }),
  });
};

export const useDeletePlanCuentas = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: planesCuentasApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'planes-cuentas'] }),
  });
};

export const useActivarPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: planesCuentasApi.activar,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting', 'planes-cuentas'] });
      qc.invalidateQueries({ queryKey: ['accounting', 'configuracion'] });
    },
  });
};

export const usePlanCuentasCuentas = (id: number) =>
  useQuery({
    queryKey: ['accounting', 'plan-cuentas', id, 'cuentas'],
    queryFn: () => planesCuentasApi.getCuentas(id),
    enabled: !!id,
  });

// --- Cuentas Contables ---
export const useCuentasContables = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['accounting', 'cuentas-contables', params],
    queryFn: () => cuentasContablesApi.getAll(params),
  });

export const useCuentaContable = (id: number) =>
  useQuery({
    queryKey: ['accounting', 'cuenta-contable', id],
    queryFn: () => cuentasContablesApi.getById(id),
    enabled: !!id,
  });

export const useCuentasArbol = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['accounting', 'cuentas-arbol', params],
    queryFn: () => cuentasContablesApi.getArbol(params),
  });

export const useCuentaSaldos = (id: number) =>
  useQuery({
    queryKey: ['accounting', 'cuenta-saldos', id],
    queryFn: () => cuentasContablesApi.getSaldos(id),
    enabled: !!id,
  });

export const useCuentaSubcuentas = (id: number) =>
  useQuery({
    queryKey: ['accounting', 'cuenta-subcuentas', id],
    queryFn: () => cuentasContablesApi.getSubcuentas(id),
    enabled: !!id,
  });

export const useCreateCuentaContable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cuentasContablesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting', 'cuentas-contables'] });
      qc.invalidateQueries({ queryKey: ['accounting', 'cuentas-arbol'] });
      qc.invalidateQueries({ queryKey: ['accounting', 'planes-cuentas'] });
    },
  });
};

export const useUpdateCuentaContable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof cuentasContablesApi.update>[1];
    }) => cuentasContablesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting', 'cuentas-contables'] });
      qc.invalidateQueries({ queryKey: ['accounting', 'cuentas-arbol'] });
    },
  });
};

export const useDeleteCuentaContable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cuentasContablesApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting', 'cuentas-contables'] });
      qc.invalidateQueries({ queryKey: ['accounting', 'cuentas-arbol'] });
      qc.invalidateQueries({ queryKey: ['accounting', 'planes-cuentas'] });
    },
  });
};

// --- Tipos de Documento ---
export const useTiposDocumento = () =>
  useQuery({ queryKey: ['accounting', 'tipos-documento'], queryFn: tiposDocumentoApi.getAll });

export const useTipoDocumento = (id: number) =>
  useQuery({
    queryKey: ['accounting', 'tipo-documento', id],
    queryFn: () => tiposDocumentoApi.getById(id),
    enabled: !!id,
  });

export const useCreateTipoDocumento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tiposDocumentoApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'tipos-documento'] }),
  });
};

export const useUpdateTipoDocumento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof tiposDocumentoApi.update>[1];
    }) => tiposDocumentoApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'tipos-documento'] }),
  });
};

export const useReiniciarConsecutivo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tiposDocumentoApi.reiniciarConsecutivo,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'tipos-documento'] }),
  });
};

// --- Terceros ---
export const useTerceros = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['accounting', 'terceros', params],
    queryFn: () => tercerosApi.getAll(params),
  });

export const useTercero = (id: number) =>
  useQuery({
    queryKey: ['accounting', 'tercero', id],
    queryFn: () => tercerosApi.getById(id),
    enabled: !!id,
  });

export const useTercerosPorTipo = (tipo: string) =>
  useQuery({
    queryKey: ['accounting', 'terceros', 'por-tipo', tipo],
    queryFn: () => tercerosApi.porTipo(tipo),
    enabled: !!tipo,
  });

export const useBuscarTerceros = (q: string) =>
  useQuery({
    queryKey: ['accounting', 'terceros', 'buscar', q],
    queryFn: () => tercerosApi.buscar(q),
    enabled: q.length >= 2,
  });

export const useCreateTercero = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tercerosApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'terceros'] }),
  });
};

export const useUpdateTercero = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof tercerosApi.update>[1] }) =>
      tercerosApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'terceros'] }),
  });
};

export const useDeleteTercero = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tercerosApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'terceros'] }),
  });
};

// --- Centros de Costo ---
export const useCentrosCostoContable = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['accounting', 'centros-costo', params],
    queryFn: () => centrosCostoApi.getAll(params),
  });

export const useCentroCostoContable = (id: number) =>
  useQuery({
    queryKey: ['accounting', 'centro-costo', id],
    queryFn: () => centrosCostoApi.getById(id),
    enabled: !!id,
  });

export const useCentrosCostoArbol = () =>
  useQuery({ queryKey: ['accounting', 'centros-costo-arbol'], queryFn: centrosCostoApi.getArbol });

export const useCreateCentroCosto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: centrosCostoApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting', 'centros-costo'] });
      qc.invalidateQueries({ queryKey: ['accounting', 'centros-costo-arbol'] });
    },
  });
};

export const useUpdateCentroCosto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof centrosCostoApi.update>[1];
    }) => centrosCostoApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting', 'centros-costo'] });
      qc.invalidateQueries({ queryKey: ['accounting', 'centros-costo-arbol'] });
    },
  });
};

export const useDeleteCentroCosto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: centrosCostoApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting', 'centros-costo'] });
      qc.invalidateQueries({ queryKey: ['accounting', 'centros-costo-arbol'] });
    },
  });
};

// --- Configuracion ---
export const useConfiguracionContable = () =>
  useQuery({ queryKey: ['accounting', 'configuracion'], queryFn: configuracionApi.getAll });

export const useConfiguracionDetalle = (id: number) =>
  useQuery({
    queryKey: ['accounting', 'configuracion', id],
    queryFn: () => configuracionApi.getById(id),
    enabled: !!id,
  });

export const useEstadoContable = () =>
  useQuery({
    queryKey: ['accounting', 'configuracion', 'estado'],
    queryFn: configuracionApi.getEstado,
  });

export const useUpdateConfiguracion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof configuracionApi.update>[1];
    }) => configuracionApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'configuracion'] }),
  });
};

export const useCerrarPeriodo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: configuracionApi.cerrarPeriodo,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'configuracion'] }),
  });
};

export const useAbrirPeriodo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: configuracionApi.abrirPeriodo,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'configuracion'] }),
  });
};

// ==================== MOVIMIENTOS ====================

// --- Comprobantes ---
export const useComprobantes = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['accounting', 'comprobantes', params],
    queryFn: () => comprobantesApi.getAll(params),
  });

export const useComprobante = (id: number) =>
  useQuery({
    queryKey: ['accounting', 'comprobante', id],
    queryFn: () => comprobantesApi.getById(id),
    enabled: !!id,
  });

export const useComprobantesPorPeriodo = (periodo: number) =>
  useQuery({
    queryKey: ['accounting', 'comprobantes', 'periodo', periodo],
    queryFn: () => comprobantesApi.porPeriodo(periodo),
    enabled: !!periodo,
  });

export const useCreateComprobante = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: comprobantesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting', 'comprobantes'] });
      qc.invalidateQueries({ queryKey: ['accounting', 'cuentas-contables'] });
    },
  });
};

export const useUpdateComprobante = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof comprobantesApi.update>[1];
    }) => comprobantesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'comprobantes'] }),
  });
};

export const useDeleteComprobante = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: comprobantesApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'comprobantes'] }),
  });
};

export const useContabilizarComprobante = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: comprobantesApi.contabilizar,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting', 'comprobantes'] });
      qc.invalidateQueries({ queryKey: ['accounting', 'cuentas-contables'] });
      qc.invalidateQueries({ queryKey: ['accounting', 'cuentas-arbol'] });
    },
  });
};

export const useAnularComprobante = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo_anulacion }: { id: number; motivo_anulacion: string }) =>
      comprobantesApi.anular(id, { motivo_anulacion }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting', 'comprobantes'] });
      qc.invalidateQueries({ queryKey: ['accounting', 'cuentas-contables'] });
      qc.invalidateQueries({ queryKey: ['accounting', 'cuentas-arbol'] });
    },
  });
};

export const useAprobarComprobante = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: comprobantesApi.aprobar,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'comprobantes'] }),
  });
};

export const useRecalcularTotales = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: comprobantesApi.recalcularTotales,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'comprobantes'] }),
  });
};

// --- Detalles Comprobante ---
export const useDetallesComprobante = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['accounting', 'detalles-comprobante', params],
    queryFn: () => detallesComprobanteApi.getAll(params),
  });

export const useCreateDetalle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: detallesComprobanteApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting', 'detalles-comprobante'] });
      qc.invalidateQueries({ queryKey: ['accounting', 'comprobantes'] });
    },
  });
};

export const useUpdateDetalle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof detallesComprobanteApi.update>[1];
    }) => detallesComprobanteApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting', 'detalles-comprobante'] });
      qc.invalidateQueries({ queryKey: ['accounting', 'comprobantes'] });
    },
  });
};

export const useDeleteDetalle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: detallesComprobanteApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting', 'detalles-comprobante'] });
      qc.invalidateQueries({ queryKey: ['accounting', 'comprobantes'] });
    },
  });
};

// --- Secuencias ---
export const useSecuenciasDocumento = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['accounting', 'secuencias', params],
    queryFn: () => secuenciasApi.getAll(params),
  });

export const useCreateSecuencia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: secuenciasApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'secuencias'] }),
  });
};

// --- Plantillas ---
export const usePlantillas = () =>
  useQuery({ queryKey: ['accounting', 'plantillas'], queryFn: plantillasApi.getAll });

export const usePlantilla = (id: number) =>
  useQuery({
    queryKey: ['accounting', 'plantilla', id],
    queryFn: () => plantillasApi.getById(id),
    enabled: !!id,
  });

export const useCreatePlantilla = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: plantillasApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'plantillas'] }),
  });
};

export const useUpdatePlantilla = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof plantillasApi.update>[1] }) =>
      plantillasApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'plantillas'] }),
  });
};

export const useDeletePlantilla = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: plantillasApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'plantillas'] }),
  });
};

export const useGenerarComprobanteDesde = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      plantillasApi.generarComprobante(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting', 'comprobantes'] });
      qc.invalidateQueries({ queryKey: ['accounting', 'cuentas-contables'] });
    },
  });
};

// ==================== INFORMES CONTABLES ====================

// --- Informes ---
export const useInformes = () =>
  useQuery({ queryKey: ['accounting', 'informes'], queryFn: informesApi.getAll });

export const useInforme = (id: number) =>
  useQuery({
    queryKey: ['accounting', 'informe', id],
    queryFn: () => informesApi.getById(id),
    enabled: !!id,
  });

export const useInformeLineas = (id: number) =>
  useQuery({
    queryKey: ['accounting', 'informe', id, 'lineas'],
    queryFn: () => informesApi.getLineas(id),
    enabled: !!id,
  });

export const useCreateInforme = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: informesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'informes'] }),
  });
};

export const useUpdateInforme = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof informesApi.update>[1] }) =>
      informesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'informes'] }),
  });
};

export const useDeleteInforme = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: informesApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'informes'] }),
  });
};

export const useDuplicarInforme = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { codigo: string; nombre: string } }) =>
      informesApi.duplicar(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'informes'] }),
  });
};

// --- Lineas Informe ---
export const useLineasInforme = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['accounting', 'lineas-informe', params],
    queryFn: () => lineasInformeApi.getAll(params),
  });

export const useCreateLineaInforme = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: lineasInformeApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting', 'lineas-informe'] });
      qc.invalidateQueries({ queryKey: ['accounting', 'informes'] });
    },
  });
};

export const useUpdateLineaInforme = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof lineasInformeApi.update>[1];
    }) => lineasInformeApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting', 'lineas-informe'] });
      qc.invalidateQueries({ queryKey: ['accounting', 'informes'] });
    },
  });
};

export const useDeleteLineaInforme = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: lineasInformeApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting', 'lineas-informe'] });
      qc.invalidateQueries({ queryKey: ['accounting', 'informes'] });
    },
  });
};

// --- Generaciones ---
export const useGeneraciones = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['accounting', 'generaciones', params],
    queryFn: () => generacionesApi.getAll(params),
  });

export const useGeneracion = (id: number) =>
  useQuery({
    queryKey: ['accounting', 'generacion', id],
    queryFn: () => generacionesApi.getById(id),
    enabled: !!id,
  });

export const useHistorialGeneraciones = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['accounting', 'generaciones', 'historial', params],
    queryFn: () => generacionesApi.getHistorial(params),
  });

export const useGenerarInforme = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: generacionesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'generaciones'] }),
  });
};

export const useRegenerarInforme = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: generacionesApi.regenerar,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'generaciones'] }),
  });
};

// ==================== INTEGRACION ====================

// --- Parametros ---
export const useParametrosIntegracion = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['accounting', 'parametros-integracion', params],
    queryFn: () => parametrosIntegracionApi.getAll(params),
  });

export const useParametroIntegracion = (id: number) =>
  useQuery({
    queryKey: ['accounting', 'parametro-integracion', id],
    queryFn: () => parametrosIntegracionApi.getById(id),
    enabled: !!id,
  });

export const useParametrosPorModulo = (modulo: string) =>
  useQuery({
    queryKey: ['accounting', 'parametros-integracion', 'modulo', modulo],
    queryFn: () => parametrosIntegracionApi.porModulo(modulo),
    enabled: !!modulo,
  });

export const useResumenIntegracion = () =>
  useQuery({
    queryKey: ['accounting', 'parametros-integracion', 'resumen'],
    queryFn: parametrosIntegracionApi.getResumen,
  });

export const useCreateParametro = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: parametrosIntegracionApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'parametros-integracion'] }),
  });
};

export const useUpdateParametro = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof parametrosIntegracionApi.update>[1];
    }) => parametrosIntegracionApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'parametros-integracion'] }),
  });
};

export const useDeleteParametro = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: parametrosIntegracionApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'parametros-integracion'] }),
  });
};

export const useToggleParametroActivo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: parametrosIntegracionApi.toggleActivo,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'parametros-integracion'] }),
  });
};

// --- Logs ---
export const useLogsIntegracion = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['accounting', 'logs-integracion', params],
    queryFn: () => logsIntegracionApi.getAll(params),
  });

export const useLogIntegracion = (id: number) =>
  useQuery({
    queryKey: ['accounting', 'log-integracion', id],
    queryFn: () => logsIntegracionApi.getById(id),
    enabled: !!id,
  });

export const useErroresRecientes = (limit?: number) =>
  useQuery({
    queryKey: ['accounting', 'logs-integracion', 'errores', limit],
    queryFn: () => logsIntegracionApi.erroresRecientes(limit),
  });

export const useEstadisticasLogs = () =>
  useQuery({
    queryKey: ['accounting', 'logs-integracion', 'estadisticas'],
    queryFn: logsIntegracionApi.getEstadisticas,
  });

// --- Cola Contabilizacion ---
export const useColaContabilizacion = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['accounting', 'cola', params],
    queryFn: () => colaContabilizacionApi.getAll(params),
  });

export const useColaDetalle = (id: number) =>
  useQuery({
    queryKey: ['accounting', 'cola', id],
    queryFn: () => colaContabilizacionApi.getById(id),
    enabled: !!id,
  });

export const useColaPendientes = () =>
  useQuery({
    queryKey: ['accounting', 'cola', 'pendientes'],
    queryFn: colaContabilizacionApi.getPendientes,
  });

export const useColaErrores = () =>
  useQuery({
    queryKey: ['accounting', 'cola', 'errores'],
    queryFn: colaContabilizacionApi.getErrores,
  });

export const useEstadisticasCola = () =>
  useQuery({
    queryKey: ['accounting', 'cola', 'estadisticas'],
    queryFn: colaContabilizacionApi.getEstadisticas,
  });

export const useCreateColaProceso = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: colaContabilizacionApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'cola'] }),
  });
};

export const useReintentarCola = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: colaContabilizacionApi.reintentar,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting', 'cola'] });
      qc.invalidateQueries({ queryKey: ['accounting', 'logs-integracion'] });
    },
  });
};

export const useCancelarCola = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: colaContabilizacionApi.cancelar,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting', 'cola'] }),
  });
};

export const useReintentarTodosCola = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: colaContabilizacionApi.reintentarTodos,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting', 'cola'] });
      qc.invalidateQueries({ queryKey: ['accounting', 'logs-integracion'] });
    },
  });
};
