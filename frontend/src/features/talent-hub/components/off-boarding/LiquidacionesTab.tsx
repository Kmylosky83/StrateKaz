/**
 * Liquidaciones Tab - Off-Boarding
 * Talent Hub - Sistema de Gestión StrateKaz
 */

import { useState } from 'react';
import { Calculator, CheckCircle, CreditCard } from 'lucide-react';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/forms/Select';
import { cn } from '@/utils/cn';
import {
  useProcesosRetiro,
  useLiquidacionesFinales,
  useCalcularLiquidacionFinal,
  useAprobarLiquidacionFinal,
  useRegistrarPagoLiquidacion,
} from '../../hooks/useOffBoarding';
import type { EstadoLiquidacionFinal } from '../../types';
import { estadoLiquidacionFinalOptions } from '../../types';

const formatCurrency = (value: number | undefined) => {
  if (!value && value !== 0) return '-';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
};

const getEstadoColor = (estado: EstadoLiquidacionFinal) => {
  switch (estado) {
    case 'borrador':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400';
    case 'calculada':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'aprobada':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'pagada':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

export function LiquidacionesTab() {
  const [selectedProcesoId, setSelectedProcesoId] = useState<number | null>(null);

  const { data: procesos = [] } = useProcesosRetiro();
  const { data: liquidaciones = [] } = useLiquidacionesFinales(
    selectedProcesoId ? { proceso_retiro: selectedProcesoId } : undefined
  );

  const calcularMutation = useCalcularLiquidacionFinal();
  const aprobarMutation = useAprobarLiquidacionFinal();
  const pagarMutation = useRegistrarPagoLiquidacion();

  const procesoOptions = procesos.map((proceso) => ({
    value: proceso.id.toString(),
    label: `${proceso.colaborador_nombre} - ${proceso.tipo_retiro_nombre}`,
  }));

  const liquidacion = liquidaciones[0]; // One liquidation per proceso

  const handleCalcular = () => {
    if (!selectedProcesoId) return;
    calcularMutation.mutate({ proceso_retiro: selectedProcesoId });
  };

  const handleAprobar = () => {
    if (!liquidacion) return;
    aprobarMutation.mutate(liquidacion.id);
  };

  const handlePagar = () => {
    if (!liquidacion) return;
    pagarMutation.mutate({
      id: liquidacion.id,
      data: {
        fecha_pago: new Date().toISOString().split('T')[0],
        metodo_pago: 'transferencia',
        referencia_pago: '',
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Proceso Selector */}
      <Card className="p-4">
        <Select
          label="Seleccione un Proceso de Retiro"
          value={selectedProcesoId?.toString() || ''}
          onChange={(e) => setSelectedProcesoId(e.target.value ? Number(e.target.value) : null)}
          options={[{ value: '', label: 'Seleccionar proceso...' }, ...procesoOptions]}
        />
      </Card>

      {selectedProcesoId ? (
        <div className="space-y-4">
          <SectionHeader
            title="Liquidación Final"
            description="Cálculo y gestión de la liquidación final del colaborador"
          >
            {!liquidacion && (
              <Button onClick={handleCalcular} disabled={calcularMutation.isPending}>
                <Calculator className="h-4 w-4 mr-2" />
                {calcularMutation.isPending ? 'Calculando...' : 'Calcular Liquidación'}
              </Button>
            )}
          </SectionHeader>

          {liquidacion ? (
            <Card>
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {liquidacion.colaborador_nombre}
                    </h3>
                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        Ingreso: {new Date(liquidacion.fecha_ingreso).toLocaleDateString('es-CO')}
                      </span>
                      <span>•</span>
                      <span>
                        Retiro: {new Date(liquidacion.fecha_retiro).toLocaleDateString('es-CO')}
                      </span>
                      <span>•</span>
                      <span>
                        {liquidacion.dias_laborados_ultimo_mes} días laborados (último mes)
                      </span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                      getEstadoColor(liquidacion.estado)
                    )}
                  >
                    {
                      estadoLiquidacionFinalOptions.find((opt) => opt.value === liquidacion.estado)
                        ?.label
                    }
                  </span>
                </div>

                {/* Salary Info */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Salario Base</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(liquidacion.salario_base)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Promedio Salario
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(liquidacion.promedio_salario)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Días Vacaciones Pendientes
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {liquidacion.dias_vacaciones_pendientes}
                    </p>
                  </div>
                </div>

                {/* Devengados */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Devengados
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Salario Pendiente</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(liquidacion.valor_salario_pendiente)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Vacaciones</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(liquidacion.valor_vacaciones)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Cesantías</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(liquidacion.valor_cesantias)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Intereses sobre Cesantías
                      </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(liquidacion.valor_intereses_cesantias)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Prima de Servicios</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(liquidacion.valor_prima)}
                      </span>
                    </div>
                    {liquidacion.valor_indemnizacion > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Indemnización</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(liquidacion.valor_indemnizacion)}
                        </span>
                      </div>
                    )}
                    {liquidacion.valor_bonificaciones > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Bonificaciones</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(liquidacion.valor_bonificaciones)}
                        </span>
                      </div>
                    )}
                    {liquidacion.otros_devengados > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Otros Devengados</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(liquidacion.otros_devengados)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        Total Devengados
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(liquidacion.total_devengados)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deducciones */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Deducciones
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Salud</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(liquidacion.valor_salud)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Pensión</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(liquidacion.valor_pension)}
                      </span>
                    </div>
                    {liquidacion.valor_retencion_fuente > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Retención en la Fuente
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(liquidacion.valor_retencion_fuente)}
                        </span>
                      </div>
                    )}
                    {liquidacion.valor_embargos > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Embargos</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(liquidacion.valor_embargos)}
                        </span>
                      </div>
                    )}
                    {liquidacion.valor_prestamos > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Préstamos</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(liquidacion.valor_prestamos)}
                        </span>
                      </div>
                    )}
                    {liquidacion.otros_descuentos > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Otros Descuentos</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(liquidacion.otros_descuentos)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        Total Deducciones
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(liquidacion.total_deducciones)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Neto a Pagar */}
                <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg border-2 border-violet-200 dark:border-violet-800">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      Neto a Pagar
                    </span>
                    <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                      {formatCurrency(liquidacion.neto_pagar)}
                    </span>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Calculado por</p>
                    <p className="text-gray-900 dark:text-gray-100">
                      {liquidacion.calculado_por_nombre}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(liquidacion.fecha_calculo).toLocaleString('es-CO')}
                    </p>
                  </div>
                  {liquidacion.aprobado_por_nombre && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Aprobado por</p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {liquidacion.aprobado_por_nombre}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {liquidacion.fecha_aprobacion
                          ? new Date(liquidacion.fecha_aprobacion).toLocaleString('es-CO')
                          : '-'}
                      </p>
                    </div>
                  )}
                </div>

                {liquidacion.observaciones && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Observaciones
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {liquidacion.observaciones}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {liquidacion.estado === 'calculada' && (
                    <Button onClick={handleAprobar} disabled={aprobarMutation.isPending}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {aprobarMutation.isPending ? 'Aprobando...' : 'Aprobar Liquidación'}
                    </Button>
                  )}
                  {liquidacion.estado === 'aprobada' && (
                    <Button onClick={handlePagar} disabled={pagarMutation.isPending}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      {pagarMutation.isPending ? 'Procesando...' : 'Registrar Pago'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <EmptyState
              title="No hay liquidación calculada"
              description="Calcule la liquidación final para este proceso de retiro."
              action={{
                label: 'Calcular Liquidación',
                onClick: handleCalcular,
              }}
            />
          )}
        </div>
      ) : (
        <EmptyState
          title="Seleccione un proceso de retiro"
          description="Seleccione un proceso para calcular y gestionar su liquidación final."
        />
      )}
    </div>
  );
}
