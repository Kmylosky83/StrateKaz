/**
 * EppActivosTab - Entregas de EPP y Activos
 *
 * EPP: datos de HSEQ Seguridad Industrial (fuente única)
 * Activos: datos de Onboarding (gestionado localmente)
 */
import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { SectionHeader } from '@/components/common/SectionHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import { HardHat, Package, Plus, RotateCcw, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  useEntregasEppList,
  useEppPorVencer,
  useEntregasActivos,
  useRegistrarDevolucion,
} from '@/features/talent-hub/hooks/useOnboardingInduccion';
import type { EntregaActivo } from '@/features/talent-hub/types';
import type { EntregaEPP as HseqEntregaEPP } from '@/features/hseq/types/seguridad-industrial.types';
import { EntregaEppFormModal } from './EntregaEppFormModal';
import { EntregaActivoFormModal } from './EntregaActivoFormModal';

type SubView = 'epp' | 'activos';

const ESTADO_EPP_COLORS: Record<string, 'success' | 'warning' | 'danger' | 'gray' | 'info'> = {
  EN_USO: 'success',
  DEVUELTO: 'gray',
  EXTRAVIADO: 'danger',
  DANADO: 'warning',
  VENCIDO: 'danger',
};

export const EppActivosTab = () => {
  const [subView, setSubView] = useState<SubView>('epp');
  const [isEppFormOpen, setIsEppFormOpen] = useState(false);
  const [isActivoFormOpen, setIsActivoFormOpen] = useState(false);
  const [devolucionTarget, setDevolucionTarget] = useState<EntregaActivo | null>(null);

  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  const { data: entregas_epp, isLoading: loadingEpp } = useEntregasEppList();
  const { data: eppPorVencerData } = useEppPorVencer();
  const { data: entregas_activos, isLoading: loadingActivos } = useEntregasActivos();
  const devolucionMutation = useRegistrarDevolucion();

  const eppPorVencer = eppPorVencerData?.entregas;

  const confirmDevolucion = async () => {
    if (!devolucionTarget) return;
    await devolucionMutation.mutateAsync({
      id: devolucionTarget.id,
      fecha_devolucion: new Date().toISOString().split('T')[0],
      estado_devolucion: 'buen_estado',
    });
    setDevolucionTarget(null);
  };

  const getColaboradorNombre = (epp: HseqEntregaEPP) => {
    if (typeof epp.colaborador === 'object' && epp.colaborador) {
      return (
        epp.colaborador.full_name || `${epp.colaborador.first_name} ${epp.colaborador.last_name}`
      );
    }
    return '-';
  };

  const getTipoEppNombre = (epp: HseqEntregaEPP) => {
    if (typeof epp.tipo_epp === 'object' && epp.tipo_epp) {
      return epp.tipo_epp.nombre;
    }
    return '-';
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <HardHat className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="EPP y Activos"
        description="Entregas de equipos de protección personal y activos empresariales"
        variant="compact"
        actions={
          <div className="flex items-center gap-3">
            {/* Sub-view toggle */}
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSubView('epp')}
                className={cn(
                  '!px-3 !py-1.5 text-sm font-medium rounded-none',
                  subView === 'epp'
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                <HardHat size={14} className="inline mr-1" />
                EPP
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSubView('activos')}
                className={cn(
                  '!px-3 !py-1.5 text-sm font-medium rounded-none border-l border-gray-200 dark:border-gray-700',
                  subView === 'activos'
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                <Package size={14} className="inline mr-1" />
                Activos
              </Button>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                subView === 'epp' ? setIsEppFormOpen(true) : setIsActivoFormOpen(true)
              }
            >
              <Plus size={16} className="mr-1" />
              Nueva Entrega
            </Button>
          </div>
        }
      />

      {/* EPP por vencer alert */}
      {subView === 'epp' && eppPorVencer && eppPorVencer.length > 0 && (
        <Card className="p-3 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10">
          <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
            <AlertTriangle size={16} />
            <span className="text-sm font-medium">
              {eppPorVencer.length} EPP próximos a reposición (30 días)
            </span>
          </div>
        </Card>
      )}

      {/* EPP Table — datos de HSEQ */}
      {subView === 'epp' && (
        <Card variant="bordered" padding="none">
          {loadingEpp ? (
            <div className="py-16 text-center">
              <Spinner size="lg" className="mx-auto" />
            </div>
          ) : !entregas_epp?.length ? (
            <div className="py-16">
              <EmptyState
                icon={<HardHat className="h-12 w-12 text-gray-300" />}
                title="Sin entregas de EPP"
                description="Registra la primera entrega de EPP."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Nº Entrega
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Colaborador
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Tipo EPP
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Marca / Modelo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Cant.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Fecha Entrega
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Reposición
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                  {entregas_epp.map((epp) => (
                    <tr key={epp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">
                        {epp.numero_entrega || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {getColaboradorNombre(epp)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="gray" size="sm">
                          {getTipoEppNombre(epp)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {[epp.marca, epp.modelo].filter(Boolean).join(' / ') || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{epp.cantidad}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(epp.fecha_entrega).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {epp.fecha_reposicion_programada ? (
                          <span
                            className={
                              epp.requiere_reposicion ? 'text-red-600 font-medium' : 'text-gray-600'
                            }
                          >
                            {new Date(epp.fecha_reposicion_programada).toLocaleDateString('es-CO')}
                            {epp.requiere_reposicion && (
                              <AlertTriangle size={14} className="inline ml-1" />
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={ESTADO_EPP_COLORS[epp.estado] || 'gray'} size="sm">
                          {epp.estado?.replace('_', ' ') || '-'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Activos Table — sin cambios funcionales */}
      {subView === 'activos' && (
        <Card variant="bordered" padding="none">
          {loadingActivos ? (
            <div className="py-16 text-center">
              <Spinner size="lg" className="mx-auto" />
            </div>
          ) : !entregas_activos?.length ? (
            <div className="py-16">
              <EmptyState
                icon={<Package className="h-12 w-12 text-gray-300" />}
                title="Sin entregas de activos"
                description="Registra la primera entrega de activos."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Colaborador
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Descripción
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Código
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Fecha Entrega
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                  {entregas_activos.map((activo) => (
                    <tr
                      key={activo.id}
                      className="group hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {activo.colaborador_nombre}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="gray" size="sm">
                          {activo.tipo_activo_display || activo.tipo_activo}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {activo.descripcion}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">
                        {activo.codigo_activo || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(activo.fecha_entrega).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={activo.devuelto ? 'success' : 'warning'} size="sm">
                          {activo.devuelto ? 'Devuelto' : 'En uso'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!activo.devuelto && (
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => setDevolucionTarget(activo)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <RotateCcw size={14} className="mr-1" />
                            Devolver
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Modals */}
      <EntregaEppFormModal isOpen={isEppFormOpen} onClose={() => setIsEppFormOpen(false)} />

      <EntregaActivoFormModal
        isOpen={isActivoFormOpen}
        onClose={() => setIsActivoFormOpen(false)}
      />

      <ConfirmDialog
        isOpen={!!devolucionTarget}
        title="Registrar Devolución"
        message={`¿Confirmar la devolución del activo "${devolucionTarget?.descripcion}" por ${devolucionTarget?.colaborador_nombre}?`}
        confirmText="Confirmar Devolución"
        variant="warning"
        isLoading={devolucionMutation.isPending}
        onConfirm={confirmDevolucion}
        onClose={() => setDevolucionTarget(null)}
      />
    </div>
  );
};
