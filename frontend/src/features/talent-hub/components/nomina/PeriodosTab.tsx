/**
 * PeriodosTab - CRUD de períodos de nómina y sus liquidaciones
 * Tab principal que muestra periodos y permite ver/gestionar liquidaciones de cada período
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
import { Plus, Calendar, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import {
  usePeriodosNomina,
  useLiquidacionesNomina,
  usePreliquidarPeriodo,
  useCerrarPeriodoNomina,
  useAprobarLiquidacion,
  usePagarLiquidacion,
} from '../../hooks/useNomina';
import type { PeriodoNomina, LiquidacionNomina } from '../../types';
import { estadoPeriodoOptions } from '../../types';
import { PeriodoFormModal } from './PeriodoFormModal';
import { LiquidacionFormModal } from './LiquidacionFormModal';
import { cn } from '@/utils/cn';

const ESTADO_OPTIONS = [{ value: '', label: 'Todos los estados' }, ...estadoPeriodoOptions];

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'abierto':
      return 'info';
    case 'preliquidado':
      return 'warning';
    case 'liquidado':
    case 'aprobado':
      return 'success';
    case 'pagado':
      return 'success';
    case 'cerrado':
      return 'gray';
    case 'anulado':
      return 'danger';
    case 'borrador':
      return 'gray';
    default:
      return 'gray';
  }
};

const formatCurrency = (value: number | undefined) => {
  if (!value && value !== 0) return '-';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
};

export const PeriodosTab = () => {
  const [anioFilter, setAnioFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [expandedPeriodo, setExpandedPeriodo] = useState<number | null>(null);
  const [isPeriodoFormOpen, setIsPeriodoFormOpen] = useState(false);
  const [isLiquidacionFormOpen, setIsLiquidacionFormOpen] = useState(false);
  const [selectedPeriodo, setSelectedPeriodo] = useState<number | null>(null);

  const { data: periodos, isLoading } = usePeriodosNomina();
  const { data: liquidaciones } = useLiquidacionesNomina(
    expandedPeriodo ? { periodo: expandedPeriodo } : undefined
  );
  const preliquidarMutation = usePreliquidarPeriodo();
  const cerrarMutation = useCerrarPeriodoNomina();
  const aprobarMutation = useAprobarLiquidacion();
  const pagarMutation = usePagarLiquidacion();

  const filtered = useMemo(() => {
    if (!periodos) return [];
    return periodos.filter((periodo) => {
      if (anioFilter && periodo.anio.toString() !== anioFilter) return false;
      if (estadoFilter && periodo.estado !== estadoFilter) return false;
      return true;
    });
  }, [periodos, anioFilter, estadoFilter]);

  const handleToggleExpand = (periodoId: number) => {
    setExpandedPeriodo(expandedPeriodo === periodoId ? null : periodoId);
  };

  const handleCreatePeriodo = () => {
    setIsPeriodoFormOpen(true);
  };

  const handleCreateLiquidacion = (periodoId: number) => {
    setSelectedPeriodo(periodoId);
    setIsLiquidacionFormOpen(true);
  };

  const handlePreliquidar = async (periodoId: number) => {
    await preliquidarMutation.mutateAsync(periodoId);
  };

  const handleCerrar = async (periodoId: number) => {
    await cerrarMutation.mutateAsync(periodoId);
  };

  const handleAprobar = async (liquidacionId: number) => {
    await aprobarMutation.mutateAsync(liquidacionId);
  };

  const handlePagar = async (liquidacionId: number) => {
    await pagarMutation.mutateAsync(liquidacionId);
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Spinner size="lg" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando períodos...</span>
        </div>
      </Card>
    );
  }

  if (!periodos || periodos.length === 0) {
    return (
      <Card className="p-8">
        <EmptyState
          icon={<Calendar className="h-12 w-12 text-gray-400" />}
          title="No hay períodos de nómina"
          description="Crea el primer período para empezar a gestionar liquidaciones de nómina."
          action={
            <Button onClick={handleCreatePeriodo} className="mt-4">
              <Plus size={16} className="mr-2" />
              Nuevo Período
            </Button>
          }
        />
        <PeriodoFormModal isOpen={isPeriodoFormOpen} onClose={() => setIsPeriodoFormOpen(false)} />
      </Card>
    );
  }

  const aniosDisponibles = Array.from(new Set(periodos.map((p) => p.anio.toString()))).sort(
    (a, b) => b.localeCompare(a)
  );

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Períodos de Nómina"
        description="Gestión de períodos y liquidaciones de nómina"
      >
        <Button onClick={handleCreatePeriodo}>
          <Plus size={16} className="mr-2" />
          Nuevo Período
        </Button>
      </SectionHeader>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            value={anioFilter}
            onChange={(e) => setAnioFilter(e.target.value)}
            options={[
              { value: '', label: 'Todos los años' },
              ...aniosDisponibles.map((a) => ({ value: a, label: a })),
            ]}
          />
          <Select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            options={ESTADO_OPTIONS}
          />
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Período
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fechas
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Neto
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Colaboradores
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map((periodo) => {
                const isExpanded = expandedPeriodo === periodo.id;
                const periodoLiquidaciones = isExpanded ? liquidaciones || [] : [];

                return (
                  <>
                    <tr key={periodo.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleToggleExpand(periodo.id)}
                          className="flex items-center gap-2 text-left font-medium text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          {periodo.nombre_periodo}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(periodo.fecha_inicio).toLocaleDateString('es-CO')} -{' '}
                        {new Date(periodo.fecha_fin).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant={getEstadoColor(periodo.estado)}>
                          {periodo.estado_display || periodo.estado}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(periodo.total_neto)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">
                        {periodo.numero_colaboradores}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          {periodo.estado === 'abierto' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreliquidar(periodo.id)}
                              disabled={preliquidarMutation.isPending}
                            >
                              Preliquidar
                            </Button>
                          )}
                          {periodo.estado === 'preliquidado' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCerrar(periodo.id)}
                              disabled={cerrarMutation.isPending}
                            >
                              Cerrar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 bg-gray-50 dark:bg-gray-800/50">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                Liquidaciones del Período
                              </h4>
                              <Button size="sm" onClick={() => handleCreateLiquidacion(periodo.id)}>
                                <Plus size={14} className="mr-1" />
                                Nueva Liquidación
                              </Button>
                            </div>

                            {periodoLiquidaciones.length === 0 ? (
                              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                No hay liquidaciones registradas para este período.
                              </p>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300">
                                        Colaborador
                                      </th>
                                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-300">
                                        Salario Base
                                      </th>
                                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-300">
                                        Devengados
                                      </th>
                                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-300">
                                        Deducciones
                                      </th>
                                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-300">
                                        Neto a Pagar
                                      </th>
                                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 dark:text-gray-300">
                                        Estado
                                      </th>
                                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-300">
                                        Acciones
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white dark:bg-gray-900">
                                    {periodoLiquidaciones.map((liq) => (
                                      <tr
                                        key={liq.id}
                                        className="border-t border-gray-200 dark:border-gray-700"
                                      >
                                        <td className="px-3 py-2">{liq.colaborador_nombre}</td>
                                        <td className="px-3 py-2 text-right">
                                          {formatCurrency(liq.salario_base)}
                                        </td>
                                        <td className="px-3 py-2 text-right text-green-600 dark:text-green-400">
                                          {formatCurrency(liq.total_devengados)}
                                        </td>
                                        <td className="px-3 py-2 text-right text-red-600 dark:text-red-400">
                                          {formatCurrency(liq.total_deducciones)}
                                        </td>
                                        <td className="px-3 py-2 text-right font-medium">
                                          {formatCurrency(liq.neto_pagar)}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                          <Badge variant={getEstadoColor(liq.estado)}>
                                            {liq.estado_display || liq.estado}
                                          </Badge>
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                          <div className="flex items-center justify-end gap-1">
                                            {(liq.estado === 'borrador' ||
                                              liq.estado === 'preliquidado') && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAprobar(liq.id)}
                                                disabled={aprobarMutation.isPending}
                                              >
                                                Aprobar
                                              </Button>
                                            )}
                                            {liq.estado === 'aprobado' && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePagar(liq.id)}
                                                disabled={pagarMutation.isPending}
                                              >
                                                <DollarSign size={14} className="mr-1" />
                                                Pagar
                                              </Button>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              No se encontraron períodos con los filtros aplicados.
            </div>
          )}
        </div>
      </Card>

      <PeriodoFormModal isOpen={isPeriodoFormOpen} onClose={() => setIsPeriodoFormOpen(false)} />
      <LiquidacionFormModal
        isOpen={isLiquidacionFormOpen}
        onClose={() => {
          setIsLiquidacionFormOpen(false);
          setSelectedPeriodo(null);
        }}
        periodoId={selectedPeriodo}
      />
    </div>
  );
};
