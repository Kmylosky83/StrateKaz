/**
 * Entrevistas Tab - Off-Boarding
 * Talent Hub - Sistema de Gestión StrateKaz
 */

import { useState } from 'react';
import { Plus, ThumbsUp, ThumbsDown, Star } from 'lucide-react';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/forms/Select';
import { cn } from '@/utils/cn';
import { useProcesosRetiro, useEntrevistasRetiro } from '../../hooks/useOffBoarding';
import type { SatisfaccionGeneral } from '../../types';
import { satisfaccionGeneralOptions } from '../../types';
import { EntrevistaFormModal } from './EntrevistaFormModal';

const getSatisfaccionColor = (satisfaccion: SatisfaccionGeneral) => {
  switch (satisfaccion) {
    case 'muy_satisfecho':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    case 'satisfecho':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'neutral':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'insatisfecho':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
    case 'muy_insatisfecho':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

export function EntrevistasTab() {
  const [selectedProcesoId, setSelectedProcesoId] = useState<number | null>(null);
  const [showEntrevistaModal, setShowEntrevistaModal] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: procesos = [] } = useProcesosRetiro();
  const { data: entrevistas = [] } = useEntrevistasRetiro(
    selectedProcesoId ? { proceso_retiro: selectedProcesoId } : undefined
  );

  const procesoOptions = procesos.map((proceso) => ({
    value: proceso.id.toString(),
    label: `${proceso.colaborador_nombre} - ${proceso.tipo_retiro_nombre}`,
  }));

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
            title="Entrevistas de Retiro"
            description="Registro de entrevistas de salida y feedback del colaborador"
          >
            <Button onClick={() => setShowEntrevistaModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Entrevista
            </Button>
          </SectionHeader>

          {entrevistas.length === 0 ? (
            <EmptyState
              title="No hay entrevistas registradas"
              description="Registre una entrevista de retiro para capturar el feedback del colaborador."
              action={{
                label: 'Nueva Entrevista',
                onClick: () => setShowEntrevistaModal(true),
              }}
            />
          ) : (
            <div className="grid gap-4">
              {entrevistas.map((entrevista) => (
                <Card key={entrevista.id} className="p-4">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Entrevista de Retiro
                          </h3>
                          <span className="text-sm text-gray-500">
                            {new Date(entrevista.fecha_entrevista).toLocaleDateString('es-CO')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Entrevistador: {entrevista.entrevistador_nombre}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setExpandedId(expandedId === entrevista.id ? null : entrevista.id)
                        }
                      >
                        {expandedId === entrevista.id ? 'Ocultar' : 'Ver Detalles'}
                      </Button>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Salario</p>
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            getSatisfaccionColor(entrevista.satisfaccion_salario)
                          )}
                        >
                          {
                            satisfaccionGeneralOptions.find(
                              (opt) => opt.value === entrevista.satisfaccion_salario
                            )?.label
                          }
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ambiente</p>
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            getSatisfaccionColor(entrevista.satisfaccion_ambiente)
                          )}
                        >
                          {
                            satisfaccionGeneralOptions.find(
                              (opt) => opt.value === entrevista.satisfaccion_ambiente
                            )?.label
                          }
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Liderazgo</p>
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            getSatisfaccionColor(entrevista.satisfaccion_liderazgo)
                          )}
                        >
                          {
                            satisfaccionGeneralOptions.find(
                              (opt) => opt.value === entrevista.satisfaccion_liderazgo
                            )?.label
                          }
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Desarrollo</p>
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            getSatisfaccionColor(entrevista.satisfaccion_desarrollo)
                          )}
                        >
                          {
                            satisfaccionGeneralOptions.find(
                              (opt) => opt.value === entrevista.satisfaccion_desarrollo
                            )?.label
                          }
                        </span>
                      </div>
                    </div>

                    {/* Indicators */}
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        {entrevista.recomendaria_empresa ? (
                          <ThumbsUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <ThumbsDown className="h-5 w-5 text-red-600" />
                        )}
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {entrevista.recomendaria_empresa
                            ? 'Recomendaría la empresa'
                            : 'No recomendaría'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {entrevista.volveria_trabajar ? (
                          <Star className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <Star className="h-5 w-5 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {entrevista.volveria_trabajar ? 'Volvería a trabajar' : 'No volvería'}
                        </span>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedId === entrevista.id && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Motivo Principal de Retiro
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {entrevista.motivo_principal_retiro}
                          </p>
                        </div>

                        {entrevista.motivos_secundarios && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Motivos Secundarios
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {entrevista.motivos_secundarios}
                            </p>
                          </div>
                        )}

                        {entrevista.aspectos_positivos && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Aspectos Positivos
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {entrevista.aspectos_positivos}
                            </p>
                          </div>
                        )}

                        {entrevista.aspectos_mejorar && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Aspectos a Mejorar
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {entrevista.aspectos_mejorar}
                            </p>
                          </div>
                        )}

                        {entrevista.sugerencias && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Sugerencias
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {entrevista.sugerencias}
                            </p>
                          </div>
                        )}

                        {entrevista.observaciones_generales && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Observaciones Generales
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {entrevista.observaciones_generales}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          title="Seleccione un proceso de retiro"
          description="Seleccione un proceso para ver sus entrevistas de retiro."
        />
      )}

      {/* Modal */}
      {showEntrevistaModal && selectedProcesoId && (
        <EntrevistaFormModal
          isOpen={showEntrevistaModal}
          onClose={() => setShowEntrevistaModal(false)}
          procesoId={selectedProcesoId}
        />
      )}
    </div>
  );
}
