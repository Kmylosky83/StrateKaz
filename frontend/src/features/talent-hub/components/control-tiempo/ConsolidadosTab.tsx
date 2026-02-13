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
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import { FileText, Lock, CheckCircle } from 'lucide-react';
import {
  useConsolidadosAsistencia,
  useCerrarConsolidado,
  useAprobarConsolidado,
} from '../../hooks/useControlTiempo';
import type { ConsolidadoAsistencia, EstadoConsolidado } from '../../types';

const ESTADO_BADGE: Record<EstadoConsolidado, 'gray' | 'info' | 'success'> = {
  borrador: 'gray',
  cerrado: 'info',
  aprobado: 'success',
};

export const ConsolidadosTab = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [yearFilter, setYearFilter] = useState(currentYear.toString());
  const [monthFilter, setMonthFilter] = useState(currentMonth.toString());

  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  const { data: consolidados, isLoading } = useConsolidadosAsistencia();
  const cerrarMutation = useCerrarConsolidado();
  const aprobarMutation = useAprobarConsolidado();

  const filtered = useMemo(() => {
    if (!consolidados) return [];
    return consolidados.filter((c) => {
      const inicio = new Date(c.periodo_inicio);
      if (yearFilter && inicio.getFullYear() !== parseInt(yearFilter)) return false;
      if (monthFilter && inicio.getMonth() + 1 !== parseInt(monthFilter)) return false;
      return true;
    });
  }, [consolidados, yearFilter, monthFilter]);

  const handleCerrar = async (id: number) => {
    if (confirm('¿Cerrar este consolidado? No podra ser editado despues.')) {
      await cerrarMutation.mutateAsync(id);
    }
  };

  const handleAprobar = async (id: number) => {
    if (confirm('¿Aprobar este consolidado? Quedara como definitivo.')) {
      await aprobarMutation.mutateAsync(id);
    }
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - i;
    return { value: year.toString(), label: year.toString() };
  });

  const monthOptions = [
    { value: '', label: 'Todos los meses' },
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

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
              description="No hay consolidados para el periodo seleccionado."
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
                    Dias
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
                  const diasTrabajados = consolidado.dias_laborados;
                  const diasTotales = consolidado.dias_laborados + consolidado.dias_ausencia;
                  const porcentaje = diasTotales > 0 ? (diasTrabajados / diasTotales) * 100 : 0;

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
                        {new Date(consolidado.periodo_inicio).toLocaleDateString('es-CO', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {consolidado.dias_laborados}
                          </span>
                          <span className="text-gray-500"> trabajados</span>
                        </div>
                        {consolidado.dias_ausencia > 0 && (
                          <div className="text-xs text-red-600 dark:text-red-400">
                            {consolidado.dias_ausencia} ausencias
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {consolidado.total_horas_trabajadas.toFixed(1)}h
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="text-gray-900 dark:text-gray-100">
                            <span className="font-medium">
                              {(
                                consolidado.total_horas_extras_diurnas +
                                consolidado.total_horas_extras_nocturnas +
                                consolidado.total_horas_extras_dominicales +
                                consolidado.total_horas_extras_festivas
                              ).toFixed(1)}
                              h
                            </span>
                          </div>
                          {consolidado.total_horas_extras_diurnas > 0 && (
                            <div className="text-xs text-gray-500">
                              {consolidado.total_horas_extras_diurnas.toFixed(1)}h diurnas
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-full max-w-[120px]">
                          <Progress value={porcentaje} size="sm" />
                          <p className="text-xs text-gray-500 mt-1">{porcentaje.toFixed(0)}%</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={ESTADO_BADGE[consolidado.estado]} size="sm">
                          {consolidado.estado}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {consolidado.estado === 'borrador' && (
                            <button
                              type="button"
                              onClick={() => handleCerrar(consolidado.id)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20"
                              title="Cerrar"
                            >
                              <Lock size={16} />
                            </button>
                          )}
                          {consolidado.estado === 'cerrado' && (
                            <button
                              type="button"
                              onClick={() => handleAprobar(consolidado.id)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:text-green-400 dark:hover:bg-green-900/20"
                              title="Aprobar"
                            >
                              <CheckCircle size={16} />
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
    </div>
  );
};
