/**
 * AsignarFirmantesModal
 *
 * Modal para asignar firmantes a un documento en estado BORRADOR.
 * Crea FirmaDigital con estado PENDIENTE para cada firmante seleccionado.
 */

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { PenTool, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';

import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/forms';
import { useSelectColaboradores } from '@/hooks/useSelectLists';
import {
  useWorkflowFirmas,
  type AsignarFirmantesDTO,
} from '@/features/gestion-estrategica/hooks/useWorkflowFirmas';

// ==================== TYPES ====================

interface AsignarFirmantesModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentTypeId: number;
  documentoId: string;
  documentoTitulo: string;
}

interface FirmanteRow {
  colaborador_id: string; // id del Colaborador para lookup
  usuario_id: number;
  cargo_id: string;
  rol_firma: 'ELABORO' | 'REVISO' | 'APROBO' | 'VALIDO' | 'AUTORIZO';
  orden: number;
}

interface FormValues {
  firmantes: FirmanteRow[];
}

const ROL_OPTIONS = [
  { value: 'ELABORO', label: 'Elaboró' },
  { value: 'REVISO', label: 'Revisó' },
  { value: 'APROBO', label: 'Aprobó' },
  { value: 'VALIDO', label: 'Validó' },
  { value: 'AUTORIZO', label: 'Autorizó' },
] as const;

// ==================== COMPONENT ====================

export function AsignarFirmantesModal({
  isOpen,
  onClose,
  contentTypeId,
  documentoId,
  documentoTitulo,
}: AsignarFirmantesModalProps) {
  const { data: colaboradores, isLoading: isLoadingColabs } = useColaboradores({
    estado: 'activo',
  });
  const { asignarFirmantes, isAsignandoFirmantes } = useWorkflowFirmas();

  const { control, handleSubmit, register, setValue, watch, reset } = useForm<FormValues>({
    defaultValues: {
      firmantes: [
        { colaborador_id: '', usuario_id: 0, cargo_id: '', rol_firma: 'ELABORO', orden: 1 },
      ],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'firmantes',
  });

  const firmantesWatch = watch('firmantes');

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset({
        firmantes: [
          { colaborador_id: '', usuario_id: 0, cargo_id: '', rol_firma: 'ELABORO', orden: 1 },
        ],
      });
    }
  }, [isOpen, reset]);

  // Handle colaborador selection - auto-fill usuario_id and cargo_id
  const handleColaboradorChange = (index: number, colaboradorId: string) => {
    const colab = colaboradores?.find((c) => c.id === colaboradorId);
    if (colab) {
      setValue(`firmantes.${index}.colaborador_id`, colaboradorId);
      setValue(`firmantes.${index}.usuario_id`, Number(colab.usuario?.id ?? 0));
      setValue(`firmantes.${index}.cargo_id`, colab.cargo?.id ?? '');
    } else {
      setValue(`firmantes.${index}.colaborador_id`, '');
      setValue(`firmantes.${index}.usuario_id`, 0);
      setValue(`firmantes.${index}.cargo_id`, '');
    }
  };

  const handleAddFirmante = () => {
    const nextOrden = fields.length + 1;
    // Suggest next role in typical flow
    const suggestedRoles: Array<FirmanteRow['rol_firma']> = [
      'ELABORO',
      'REVISO',
      'APROBO',
      'VALIDO',
      'AUTORIZO',
    ];
    const nextRol = suggestedRoles[Math.min(fields.length, suggestedRoles.length - 1)];
    append({
      colaborador_id: '',
      usuario_id: 0,
      cargo_id: '',
      rol_firma: nextRol,
      orden: nextOrden,
    });
  };

  const onSubmit = async (data: FormValues) => {
    // Validate all firmantes have user selected
    const hasEmpty = data.firmantes.some((f) => !f.usuario_id || f.usuario_id === 0);
    if (hasEmpty) {
      toast.error('Todos los firmantes deben tener un colaborador seleccionado');
      return;
    }

    // Check for duplicate users
    const userIds = data.firmantes.map((f) => f.usuario_id);
    if (new Set(userIds).size !== userIds.length) {
      toast.error('No puedes asignar el mismo colaborador más de una vez');
      return;
    }

    try {
      const payload: AsignarFirmantesDTO = {
        content_type: contentTypeId,
        object_id: documentoId,
        firmantes: data.firmantes.map((f, idx) => ({
          usuario_id: f.usuario_id,
          cargo_id: f.cargo_id,
          rol_firma: f.rol_firma,
          orden: idx + 1, // Recalculate based on visual order
        })),
      };

      await asignarFirmantes(payload);
      toast.success(`${data.firmantes.length} firmantes asignados exitosamente`);
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || 'Error al asignar firmantes');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asignar Firmantes" size="2xl">
      <div className="space-y-4">
        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-800 dark:bg-indigo-900/20">
          <PenTool className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{documentoTitulo}</p>
            <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
              Asigna los firmantes en orden secuencial. El documento pasará a estado "En Revisión".
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* Firmantes list */}
          {fields.map((field, index) => {
            const selectedColab = colaboradores?.find(
              (c) => c.id === firmantesWatch?.[index]?.colaborador_id
            );

            return (
              <div
                key={field.id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                      {index + 1}
                    </span>
                    Firmante
                  </span>
                  <div className="flex items-center gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => index > 0 && move(index, index - 1)}
                      disabled={index === 0}
                      className="!p-1 !min-h-0 rounded"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => index < fields.length - 1 && move(index, index + 1)}
                      disabled={index === fields.length - 1}
                      className="!p-1 !min-h-0 rounded"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="!p-1 !min-h-0 rounded text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {/* Colaborador select */}
                  <Select
                    label="Colaborador *"
                    value={firmantesWatch?.[index]?.colaborador_id ?? ''}
                    onChange={(e) => handleColaboradorChange(index, e.target.value)}
                  >
                    <option value="">Seleccionar...</option>
                    {isLoadingColabs ? (
                      <option disabled>Cargando...</option>
                    ) : (
                      colaboradores
                        ?.filter((c) => c.usuario)
                        ?.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre_completo || `${c.primer_nombre} ${c.primer_apellido}`}
                          </option>
                        ))
                    )}
                  </Select>

                  {/* Rol select */}
                  <Select
                    label="Rol de Firma *"
                    {...register(`firmantes.${index}.rol_firma` as const)}
                    options={ROL_OPTIONS}
                  />
                </div>

                {/* Cargo info */}
                {selectedColab && (
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    Cargo: {selectedColab.cargo?.nombre ?? 'Sin cargo'}
                  </p>
                )}

                {/* Hidden fields */}
                <input type="hidden" {...register(`firmantes.${index}.usuario_id` as const)} />
                <input type="hidden" {...register(`firmantes.${index}.cargo_id` as const)} />
                <input type="hidden" {...register(`firmantes.${index}.orden` as const)} />
              </div>
            );
          })}

          {/* Add firmante button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAddFirmante}
            className="w-full !min-h-0 rounded-lg border-2 border-dashed border-gray-300 py-2 text-gray-500 transition-colors hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-600 dark:hover:border-indigo-500"
          >
            <Plus className="h-4 w-4" />
            Agregar Firmante
          </Button>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-gray-200 pt-3 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isAsignandoFirmantes}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isAsignandoFirmantes}>
              {isAsignandoFirmantes ? (
                'Asignando...'
              ) : (
                <>
                  <PenTool className="mr-1.5 h-4 w-4" />
                  Asignar Firmantes ({fields.length})
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
