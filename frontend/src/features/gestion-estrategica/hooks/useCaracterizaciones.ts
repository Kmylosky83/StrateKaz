/**
 * React Query hooks para Caracterización de Procesos (SIPOC)
 * Generados via crud-hooks-factory
 */
import { createCrudHooks } from '@/lib/crud-hooks-factory';
import { queryKeys } from '@/lib/query-keys';
import { caracterizacionApi } from '../api/caracterizacionApi';

const hooks = createCrudHooks(caracterizacionApi, queryKeys.caracterizaciones, 'Caracterización', {
  isFeminine: true,
});

export const useCaracterizaciones = hooks.useList;
export const useCaracterizacion = hooks.useDetail;
export const useCreateCaracterizacion = hooks.useCreate;
export const useUpdateCaracterizacion = hooks.useUpdate;
export const useDeleteCaracterizacion = hooks.useDelete;
