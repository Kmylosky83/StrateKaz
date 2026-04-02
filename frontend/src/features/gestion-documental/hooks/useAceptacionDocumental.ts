/**
 * Hooks para Aceptación Documental (Mejora 3 — Lectura Verificada).
 * ISO 7.3 Toma de Conciencia.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { aceptacionApi } from '../api/gestionDocumentalApi';
import { createQueryKeys } from '@/lib/query-keys';
import type { AsignarLecturaDTO, RegistrarProgresoDTO } from '../types/gestion-documental.types';

const aceptacionKeys = createQueryKeys('aceptaciones');

export function useMisPendientes() {
  return useQuery({
    queryKey: [...aceptacionKeys.all, 'mis-pendientes'],
    queryFn: () => aceptacionApi.misPendientes(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useAceptacionesPorDocumento(documentoId: number | null) {
  return useQuery({
    queryKey: [...aceptacionKeys.all, 'por-documento', documentoId],
    queryFn: () => aceptacionApi.porDocumento(documentoId!),
    enabled: !!documentoId,
    staleTime: 30_000,
  });
}

export function useAceptacionResumen(documentoId?: number) {
  return useQuery({
    queryKey: [...aceptacionKeys.all, 'resumen', documentoId],
    queryFn: () => aceptacionApi.resumen(documentoId),
    staleTime: 30_000,
  });
}

export function useAsignarLectura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AsignarLecturaDTO) => aceptacionApi.asignar(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: aceptacionKeys.all });
      toast.success(`Lectura asignada a ${result.creados} usuario(s)`);
    },
    onError: () => toast.error('Error al asignar lectura'),
  });
}

export function useRegistrarProgreso() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RegistrarProgresoDTO }) =>
      aceptacionApi.registrarProgreso(id, data),
  });
}

export function useAceptarLectura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, texto }: { id: number; texto?: string }) => aceptacionApi.aceptar(id, texto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aceptacionKeys.all });
      toast.success('Documento aceptado exitosamente');
    },
    onError: () => toast.error('Error al aceptar documento'),
  });
}

export function useRechazarLectura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) =>
      aceptacionApi.rechazar(id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aceptacionKeys.all });
      toast.success('Documento rechazado');
    },
    onError: () => toast.error('Error al rechazar documento'),
  });
}

// ==================== HABEAS DATA & LECTURAS COUNT ====================

import { documentoApi } from '../api/gestionDocumentalApi';

const documentoKeys = createQueryKeys('gestion-documental');

/** Estado de la Política de Habeas Data del tenant (para banner dashboard) */
export function useHabeasDataStatus() {
  return useQuery({
    queryKey: [...documentoKeys.all, 'habeas-data-status'],
    queryFn: () => documentoApi.habeasDataStatus(),
    staleTime: 5 * 60_000,
  });
}

/** Cuenta lecturas obligatorias pendientes del usuario (para badge + modal) */
export function useLecturasPendientesCount() {
  return useQuery({
    queryKey: [...aceptacionKeys.all, 'mis-lecturas-count'],
    queryFn: () => documentoApi.misLecturasCount(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
