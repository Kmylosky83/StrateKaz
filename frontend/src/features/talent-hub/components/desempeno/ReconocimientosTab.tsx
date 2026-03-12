/**
 * ReconocimientosTab - Nominaciones y gestion de reconocimientos
 */
import { useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { SectionHeader } from '@/components/common/SectionHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import { Award, Plus, CheckCircle, XCircle, Gift, Star } from 'lucide-react';
import {
  useReconocimientos,
  useAprobarReconocimiento,
  useRechazarReconocimiento,
  useEntregarReconocimiento,
  usePublicarEnMuro,
} from '../../hooks/useDesempeno';
import { ReconocimientoFormModal } from './ReconocimientoFormModal';

const ESTADO_BADGE: Record<string, 'gray' | 'info' | 'warning' | 'success' | 'danger'> = {
  pendiente: 'warning',
  aprobado: 'info',
  entregado: 'success',
  rechazado: 'danger',
};

const ESTADO_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'rechazado', label: 'Rechazado' },
];

export const ReconocimientosTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  const { data: reconocimientos, isLoading } = useReconocimientos();
  const aprobarMutation = useAprobarReconocimiento();
  const rechazarMutation = useRechazarReconocimiento();
  const entregarMutation = useEntregarReconocimiento();
  const publicarMutation = usePublicarEnMuro();

  const filtered = useMemo(() => {
    if (!reconocimientos) return [];
    return (Array.isArray(reconocimientos) ? reconocimientos : []).filter((r) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (
          !r.colaborador_nombre?.toLowerCase().includes(term) &&
          !r.motivo?.toLowerCase().includes(term) &&
          !r.tipo_nombre?.toLowerCase().includes(term)
        )
          return false;
      }
      if (estadoFilter && r.estado !== estadoFilter) return false;
      return true;
    });
  }, [reconocimientos, searchTerm, estadoFilter]);

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <Award className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Reconocimientos"
        description="Nominaciones, aprobaciones y entregas de reconocimientos"
        variant="compact"
        actions={
          <div className="flex items-center gap-3 flex-nowrap">
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48"
            />
            <Select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              options={ESTADO_OPTIONS}
              className="w-40"
            />
            <Button variant="primary" size="sm" onClick={() => setIsFormOpen(true)}>
              <Plus size={16} className="mr-1" />
              Nominar
            </Button>
          </div>
        }
      />

      <Card variant="bordered" padding="none">
        {isLoading ? (
          <div className="py-16 text-center">
            <Spinner size="lg" className="mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Cargando reconocimientos...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<Award className="h-12 w-12 text-gray-300" />}
              title="Sin reconocimientos"
              description={
                searchTerm || estadoFilter
                  ? 'No se encontraron reconocimientos con los filtros aplicados.'
                  : 'Nomina al primer colaborador.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Colaborador
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Motivo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Puntos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {filtered.map((rec) => (
                  <tr
                    key={rec.id}
                    className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {rec.colaborador_nombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        Nominado por: {rec.nominado_por_nombre}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="gray" size="sm">
                        {rec.tipo_nombre || rec.tipo_categoria}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                        {rec.motivo}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(rec.fecha_reconocimiento).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm">
                        <Star size={14} className="text-amber-500" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {rec.puntos_otorgados}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ESTADO_BADGE[rec.estado] || 'gray'} size="sm">
                        {rec.estado_display || rec.estado}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {rec.estado === 'pendiente' && (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => aprobarMutation.mutate(String(rec.id))}
                              title="Aprobar"
                              className="text-green-500 hover:text-green-700"
                            >
                              <CheckCircle size={16} />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                rechazarMutation.mutate({ id: String(rec.id), motivo: 'Rechazado' })
                              }
                              title="Rechazar"
                              className="text-red-500 hover:text-red-700"
                            >
                              <XCircle size={16} />
                            </Button>
                          </>
                        )}
                        {rec.estado === 'aprobado' && (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => entregarMutation.mutate(String(rec.id))}
                              title="Entregar"
                              className="text-green-500 hover:text-green-700"
                            >
                              <Gift size={16} />
                            </Button>
                            {rec.es_publico && !rec.publicado_en_muro && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => publicarMutation.mutate({ id: String(rec.id) })}
                                title="Publicar en Muro"
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <Award size={16} />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-500">
            Mostrando {filtered.length} reconocimientos
          </div>
        )}
      </Card>

      <ReconocimientoFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
};
