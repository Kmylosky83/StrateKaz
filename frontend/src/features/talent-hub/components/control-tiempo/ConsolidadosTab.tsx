/**
 * ConsolidadosTab - Resumen mensual de asistencia
 */
import { useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Select } from '@/components/forms/Select';
import { Progress } from '@/components/common/Progress';
import { SectionHeader } from '@/components/common/SectionHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import { FileText, Lock, Unlock, RefreshCw } from 'lucide-react';
import {
  useConsolidadosAsistencia,
  useCerrarConsolidado,
  useReabrirConsolidado,
  useGenerarConsolidado,
} from '../../hooks/useControlTiempo';
import type { ConsolidadoAsistencia } from '../../types';
import { MESES_NOMBRES } from '../../types/controlTiempo.types';

export const ConsolidadosTab = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [yearFilter, setYearFilter] = useState(currentYear.toString());
  const [monthFilter, setMonthFilter] = useState(currentMonth.toString());
  const [cerrarId, setCerrarId] = useState<number | null>(null);
  const [reabrirId, setReabrirId] = useState<number | null>(null);

  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  const { data: consolidados, isLoading } = useConsolidadosAsistencia({
    anio: yearFilter ? parseInt(yearFilter) : undefined,
    mes: monthFilter ? parseInt(monthFilter) : undefined,
  });
  const cerrarMutation = useCerrarConsolidado();
  const reabrirMutation = useReabrirConsolidado();
  const generarMutation = useGenerarConsolidado();

  const filtered = useMemo(() => {
    if (!consolidados) return [];
    return consolidados.filter((c) => {
      if (yearFilter && c.anio !== parseInt(yearFilter)) return false;
      if (monthFilter && c.mes !== parseInt(monthFilter)) return false;
      return true;
    });
  }, [consolidados, yearFilter, monthFilter]);

  const handleCerrar = () => {
    if (!cerrarId) return;
    cerrarMutation.mutate(cerrarId, {
      onSuccess: () => setCerrarId(null),
    });
  };

  const handleReabrir = () => {
    if (!reabrirId) return;
    reabrirMutation.mutate(reabrirId, {
      onSuccess: () => setReabrirId(null),
    });
  };

  const handleGenerar = () => {
    generarMutation.mutate({
      anio: yearFilter ? parseInt(yearFilter) : currentYear,
      mes: monthFilter ? parseInt(monthFilter) : currentMonth,
    });
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - i;
    return { value: year.toString(), label: year.toString() };
  });

  const monthOptions = [
    { value: '', label: 'Todos los meses' },
    ...Object.entries(MESES_NOMBRES).map(([value, label]) => ({ value, label })),
  ];

  const getPeriodoLabel = (c: ConsolidadoAsistencia) => {
    return c.periodo_formateado || `${MESES_NOMBRES[c.mes] || c.mes} ${c.anio}`;
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <FileText className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Consolidados"
        description="Resumen mensual de asistencia y horas extras"
        variant="compact"
        actions={
          <div className="flex items-center gap-3 flex-nowrap">
            <Select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              options={yearOptions}
              className="w-32"
            />
            <Select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              options={monthOptions}
              className="w-40"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerar}
              isLoading={generarMutation.isPending}
              title="Generar/recalcular consolidados del periodo seleccionado"
            >
              <RefreshCw size={16} className="mr-1" />
              Generar
            </Button>
          </div>
        }
      />

      <Card variant="bordered" padding="none">
        {isLoading ? (
          <div className="py-16 text-center">
            <Spinner size="lg" className="mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Cargando consolidados...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<FileText className="h-12 w-12 text-gray-300" />}
              title="Sin consolidados"
              description="No hay consolidados para el periodo seleccionado. Use el botón 'Generar' para calcular."
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
                    Periodo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Días
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Horas Trabajadas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Horas Extras
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Asistencia
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
                {filtered.map((consolidado) => {
                  const porcentaje = Number(consolidado.porcentaje_asistencia) || 0;

                  return (
                    <tr
                      key={consolidado.id}
                      className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {consolidado.colaborador_nombre}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {getPeriodoLabel(consolidado)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {consolidado.dias_trabajados}
                          </span>
                          <span className="text-gray-500"> trabajados</span>
                        </div>
                        {consolidado.dias_ausente > 0 && (
                          <div className="text-xs text-red-600 dark:text-red-400">
                            {consolidado.dias_ausente} ausencias
                          </div>
                        )}
                        {consolidado.dias_tardanza > 0 && (
                          <div className="text-xs text-orange-600 dark:text-orange-400">
                            {consolidado.dias_tardanza} tardanzas
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {Number(consolidado.total_horas_trabajadas).toFixed(1)}h
                      </td>
                      <td className="px-4 py-3">
                        {Number(consolidado.total_horas_extras) > 0 ? (
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {Number(consolidado.total_horas_extras).toFixed(1)}h
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-full max-w-[120px]">
                          <Progress value={porcentaje} size="sm" />
                          <p className="text-xs text-gray-500 mt-1">{porcentaje.toFixed(0)}%</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {consolidado.cerrado ? (
                          <Badge variant="success" size="sm">
                            Cerrado
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="sm">
                            Abierto
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!consolidado.cerrado && (
                            <button
                              type="button"
                              onClick={() => setCerrarId(consolidado.id)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20"
                              title="Cerrar mes"
                            >
                              <Lock size={16} />
                            </button>
                          )}
                          {consolidado.cerrado && (
                            <button
                              type="button"
                              onClick={() => setReabrirId(consolidado.id)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:text-orange-400 dark:hover:bg-orange-900/20"
                              title="Reabrir mes"
                            >
                              <Unlock size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-500">
            Mostrando {filtered.length} de {consolidados?.length || 0} consolidados
          </div>
        )}
      </Card>

      {/* Diálogo de confirmación de cierre */}
      <ConfirmDialog
        isOpen={cerrarId !== null}
        title="Cerrar consolidado mensual"
        message="¿Cerrar este consolidado? Una vez cerrado no podrá registrarse más asistencia para este período."
        confirmText="Cerrar mes"
        onConfirm={handleCerrar}
        onClose={() => setCerrarId(null)}
        isLoading={cerrarMutation.isPending}
        variant="warning"
      />

      {/* Diálogo de confirmación de reapertura */}
      <ConfirmDialog
        isOpen={reabrirId !== null}
        title="Reabrir consolidado mensual"
        message="¿Reabrir este consolidado? Se podrán volver a registrar novedades para este período."
        confirmText="Reabrir"
        onConfirm={handleReabrir}
        onClose={() => setReabrirId(null)}
        isLoading={reabrirMutation.isPending}
        variant="info"
      />
    </div>
  );
};
