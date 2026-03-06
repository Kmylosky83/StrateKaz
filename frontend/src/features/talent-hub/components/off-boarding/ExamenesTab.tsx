/**
 * Examenes Tab - Off-Boarding
 * Talent Hub - Sistema de Gestión StrateKaz
 */

import { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/forms/Select';
import { Input } from '@/components/forms/Input';
import { cn } from '@/utils/cn';
import {
  useProcesosRetiro,
  useExamenesEgreso,
  useUpdateExamenEgreso,
} from '../../hooks/useOffBoarding';
import type { ResultadoExamen } from '../../types';
import { resultadoExamenOptions } from '../../types';
import { ExamenFormModal } from './ExamenFormModal';

const getResultadoColor = (resultado: ResultadoExamen) => {
  switch (resultado) {
    case 'apto':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    case 'apto_con_restricciones':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'no_apto':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    case 'pendiente':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

export function ExamenesTab() {
  const [selectedProcesoId, setSelectedProcesoId] = useState<number | null>(null);
  const [showExamenModal, setShowExamenModal] = useState(false);
  const [registrandoResultado, setRegistrandoResultado] = useState<number | null>(null);
  const [formData, setFormData] = useState<{
    fecha_realizado: string;
    resultado: ResultadoExamen;
    concepto_medico: string;
  }>({
    fecha_realizado: '',
    resultado: 'pendiente',
    concepto_medico: '',
  });

  const { data: procesos = [] } = useProcesosRetiro();
  const { data: examenes = [] } = useExamenesEgreso(
    selectedProcesoId ? { proceso_retiro: selectedProcesoId } : undefined
  );
  const registrarResultadoMutation = useUpdateExamenEgreso();

  const procesoOptions = procesos.map((proceso) => ({
    value: proceso.id.toString(),
    label: `${proceso.colaborador_nombre} - ${proceso.tipo_retiro_nombre}`,
  }));

  const handleRegistrarResultado = (examenId: number) => {
    if (!formData.fecha_realizado || !formData.resultado) {
      alert('Por favor complete la fecha y el resultado');
      return;
    }

    registrarResultadoMutation.mutate(
      {
        id: examenId,
        data: formData,
      },
      {
        onSuccess: () => {
          setRegistrandoResultado(null);
          setFormData({
            fecha_realizado: '',
            resultado: 'pendiente',
            concepto_medico: '',
          });
        },
      }
    );
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
            title="Exámenes de Egreso"
            description="Programación y seguimiento de exámenes médicos de egreso"
          >
            <Button onClick={() => setShowExamenModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Programar Examen
            </Button>
          </SectionHeader>

          {examenes.length === 0 ? (
            <EmptyState
              title="No hay exámenes programados"
              description="Programe exámenes médicos de egreso para este colaborador."
              action={{
                label: 'Programar Examen',
                onClick: () => setShowExamenModal(true),
              }}
            />
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Fecha Programada
                      </th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Fecha Realizado
                      </th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Entidad de Salud
                      </th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Resultado
                      </th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Concepto Médico
                      </th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {examenes.map((examen) => (
                      <tr
                        key={examen.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(examen.fecha_examen).toLocaleDateString('es-CO')}
                        </td>
                        <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                          {examen.fecha_realizado ? (
                            new Date(examen.fecha_realizado).toLocaleDateString('es-CO')
                          ) : registrandoResultado === examen.id ? (
                            <Input
                              type="date"
                              value={formData.fecha_realizado}
                              onChange={(e) =>
                                setFormData({ ...formData, fecha_realizado: e.target.value })
                              }
                              className="w-36"
                            />
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                          {examen.entidad_prestadora}
                        </td>
                        <td className="p-3">
                          {registrandoResultado === examen.id ? (
                            <Select
                              value={formData.resultado}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  resultado: e.target.value as ResultadoExamen,
                                })
                              }
                              options={resultadoExamenOptions}
                              className="w-44"
                            />
                          ) : (
                            <span
                              className={cn(
                                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                getResultadoColor(examen.resultado)
                              )}
                            >
                              {
                                resultadoExamenOptions.find((opt) => opt.value === examen.resultado)
                                  ?.label
                              }
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                          {registrandoResultado === examen.id ? (
                            <Input
                              type="text"
                              value={formData.concepto_medico}
                              onChange={(e) =>
                                setFormData({ ...formData, concepto_medico: e.target.value })
                              }
                              placeholder="Concepto médico..."
                              className="w-48"
                            />
                          ) : (
                            examen.concepto_medico || '-'
                          )}
                        </td>
                        <td className="p-3">
                          {examen.resultado === 'pendiente' &&
                            (registrandoResultado === examen.id ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleRegistrarResultado(examen.id)}
                                  disabled={registrarResultadoMutation.isPending}
                                >
                                  Guardar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setRegistrandoResultado(null);
                                    setFormData({
                                      fecha_realizado: '',
                                      resultado: 'pendiente',
                                      concepto_medico: '',
                                    });
                                  }}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRegistrandoResultado(examen.id)}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Registrar Resultado
                              </Button>
                            ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <EmptyState
          title="Seleccione un proceso de retiro"
          description="Seleccione un proceso para ver sus exámenes de egreso."
        />
      )}

      {/* Modal */}
      {showExamenModal && selectedProcesoId && (
        <ExamenFormModal
          isOpen={showExamenModal}
          onClose={() => setShowExamenModal(false)}
          procesoId={selectedProcesoId}
        />
      )}
    </div>
  );
}
