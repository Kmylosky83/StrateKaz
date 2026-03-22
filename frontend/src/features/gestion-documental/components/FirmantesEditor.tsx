/**
 * FirmantesEditor - Editor de firmantes por defecto para plantillas.
 *
 * Permite configurar qué cargos firman automáticamente los documentos
 * creados desde una plantilla. Usa cargo_code (no usuario_id) para
 * resolución dinámica al momento de crear el documento.
 *
 * Preview: si hay plantillaId, consulta resolver-firmantes para mostrar
 * a qué usuario resolvería cada cargo actualmente.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronRight,
  PenTool,
  UserCheck,
  AlertTriangle,
  FileSignature,
} from 'lucide-react';

import { Button, Badge, Tooltip } from '@/components/common';
import { Select } from '@/components/forms';
import { Switch } from '@/components/forms/Switch';
import { useSelectCargos } from '@/hooks/useSelectLists';
import { useResolverFirmantes } from '../hooks/useGestionDocumental';
import type { FirmantePorDefecto, RolFirma } from '../types/gestion-documental.types';
import { ROL_FIRMA_OPTIONS } from '../types/gestion-documental.types';

// ==================== TYPES ====================

interface FirmantesEditorProps {
  /** Lista actual de firmantes por defecto */
  firmantes: FirmantePorDefecto[];
  /** Callback cuando cambia la lista */
  onChange: (firmantes: FirmantePorDefecto[]) => void;
  /** ID de plantilla (para preview de resolución) */
  plantillaId?: number | null;
}

// ==================== COMPONENT ====================

export function FirmantesEditor({ firmantes, onChange, plantillaId }: FirmantesEditorProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: cargos, isLoading: isLoadingCargos } = useSelectCargos();
  const { data: resolucion } = useResolverFirmantes(
    plantillaId && firmantes.length > 0 ? plantillaId : null
  );

  // ==================== HANDLERS ====================

  const handleAdd = () => {
    const suggestedRoles: RolFirma[] = ['ELABORO', 'REVISO', 'APROBO', 'VALIDO', 'AUTORIZO'];

    // Buscar siguiente rol que no esté duplicado
    const usedRoles = new Set(firmantes.map((f) => f.rol_firma));
    const nextRol =
      suggestedRoles.find((r) => !usedRoles.has(r)) ??
      suggestedRoles[Math.min(firmantes.length, suggestedRoles.length - 1)];

    const newFirmante: FirmantePorDefecto = {
      rol_firma: nextRol,
      cargo_code: '',
      orden: firmantes.length + 1,
      es_requerido: true,
    };
    onChange([...firmantes, newFirmante]);
  };

  const handleRemove = (index: number) => {
    const updated = firmantes
      .filter((_, i) => i !== index)
      .map((f, i) => ({ ...f, orden: i + 1 }));
    onChange(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= firmantes.length) return;
    const updated = [...firmantes];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated.map((f, i) => ({ ...f, orden: i + 1 })));
  };

  const handleFieldChange = (
    index: number,
    field: keyof FirmantePorDefecto,
    value: string | boolean
  ) => {
    // Validar duplicado rol+cargo al cambiar
    if (field === 'rol_firma' || field === 'cargo_code') {
      const current = firmantes[index];
      const newRol = field === 'rol_firma' ? (value as string) : current.rol_firma;
      const newCargo = field === 'cargo_code' ? (value as string) : current.cargo_code;

      if (newRol && newCargo) {
        const isDuplicate = firmantes.some(
          (f, i) => i !== index && f.rol_firma === newRol && f.cargo_code === newCargo
        );
        if (isDuplicate) {
          toast.warning('Ya existe un firmante con este rol y cargo');
          return;
        }
      }
    }

    const updated = firmantes.map((f, i) => (i === index ? { ...f, [field]: value } : f));
    onChange(updated);
  };

  // Find resolved info for a specific firmante
  const getResolucion = (cargoCode: string, rolFirma: string) => {
    if (!resolucion?.firmantes) return null;
    return resolucion.firmantes.find(
      (r) => r.cargo_code === cargoCode && r.rol_firma === rolFirma
    );
  };

  // ==================== RENDER ====================

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex w-full items-center justify-between rounded-t-lg bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800"
      >
        <div className="flex items-center gap-2">
          <PenTool className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Firmantes por Defecto
          </span>
          {firmantes.length > 0 && (
            <Badge variant="info" size="sm">
              {firmantes.length}
            </Badge>
          )}
        </div>
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {!isCollapsed && (
        <div className="space-y-3 p-4">
          {/* Info */}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Define los cargos que firman automáticamente al crear un documento desde esta plantilla.
            La resolución a usuario se hace al momento de crear el documento.
          </p>

          {/* Empty state */}
          {firmantes.length === 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-4 dark:border-gray-600 dark:bg-gray-800/30">
              <FileSignature className="h-8 w-8 flex-shrink-0 text-gray-300 dark:text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Sin firmantes configurados
                </p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                  Opcional. Los documentos se crearán sin asignación automática de firmantes.
                </p>
              </div>
            </div>
          )}

          {/* Firmantes list — scrollable con max-height */}
          <div className="max-h-[50vh] space-y-3 overflow-y-auto">
            {firmantes.map((firmante, index) => {
              const resolved = getResolucion(firmante.cargo_code, firmante.rol_firma);
              const cargoLabel =
                cargos?.find((c) => c.extra?.code === firmante.cargo_code)?.label ?? '';

              return (
                <div
                  key={`firmante-${firmante.rol_firma}-${index}`}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  {/* Row header: number + reorder/delete */}
                  <div className="mb-2 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                        {index + 1}
                      </span>
                      Firmante
                    </span>
                    <div className="flex items-center gap-0.5">
                      <Tooltip content="Subir">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMove(index, 'up')}
                          disabled={index === 0}
                          aria-label={`Subir firmante ${index + 1}`}
                          className="!p-1 !min-h-0 rounded"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Bajar">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMove(index, 'down')}
                          disabled={index === firmantes.length - 1}
                          aria-label={`Bajar firmante ${index + 1}`}
                          className="!p-1 !min-h-0 rounded"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Eliminar firmante">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(index)}
                          aria-label={`Eliminar firmante ${index + 1}`}
                          className="!p-1 !min-h-0 rounded text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Fields: rol + cargo */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Select
                      label="Rol de Firma *"
                      value={firmante.rol_firma}
                      onChange={(e) => handleFieldChange(index, 'rol_firma', e.target.value)}
                      options={ROL_FIRMA_OPTIONS.map((o) => ({
                        value: o.value,
                        label: o.label,
                      }))}
                    />

                    <Select
                      label="Cargo *"
                      value={firmante.cargo_code}
                      onChange={(e) => handleFieldChange(index, 'cargo_code', e.target.value)}
                    >
                      <option value="">Seleccionar cargo...</option>
                      {isLoadingCargos ? (
                        <option disabled>Cargando...</option>
                      ) : (
                        cargos?.map((c) => (
                          <option key={c.id} value={(c.extra?.code as string) ?? ''}>
                            {c.label}
                          </option>
                        ))
                      )}
                    </Select>
                  </div>

                  {/* Required switch */}
                  <div className="mt-2">
                    <Switch
                      size="sm"
                      label="Requerido"
                      checked={firmante.es_requerido !== false}
                      onCheckedChange={(checked) =>
                        handleFieldChange(index, 'es_requerido', checked)
                      }
                    />
                  </div>

                  {/* Resolution preview */}
                  {resolved && firmante.cargo_code && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs">
                      {resolved.resuelto ? (
                        <>
                          <UserCheck className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                          <span className="text-green-700 dark:text-green-400">
                            Resuelve a: {resolved.usuario_nombre}
                            {resolved.cargo_nombre && ` (${resolved.cargo_nombre})`}
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-amber-600 dark:text-amber-400">
                            {resolved.warning || 'Sin usuario asignado a este cargo'}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Show cargo name inline when no resolution available */}
                  {!resolved && cargoLabel && firmante.cargo_code && (
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      Cargo: {cargoLabel}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add firmante button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAdd}
            className="w-full !min-h-0 rounded-lg border-2 border-dashed border-gray-300 py-2 text-gray-500 transition-colors hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-600 dark:hover:border-indigo-500"
          >
            <Plus className="mr-1 h-4 w-4" />
            Agregar Firmante
          </Button>
        </div>
      )}
    </div>
  );
}
