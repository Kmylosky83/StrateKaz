/**
 * Modal para importar Partes Interesadas desde Contexto Organizacional (ISO 9001 §4.2)
 * Cross-module: Consume datos de Contexto, crea InteresadoProyecto
 * DS: BaseModal + Checkbox + Button + Badge
 */
import { useState } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Checkbox } from '@/components/forms/Checkbox';
import { Alert } from '@/components/common/Alert';
import { Users, Download } from 'lucide-react';
import { usePartesInteresadas } from '../../../hooks/usePartesInteresadas';
import { useImportarStakeholders } from '../../../hooks/useProyectos';
import type { ParteInteresada } from '../../../api/partesInteresadasApi';

interface ImportarStakeholdersModalProps {
  proyectoId: number;
  isOpen: boolean;
  onClose: () => void;
}

export const ImportarStakeholdersModal = ({
  proyectoId,
  isOpen,
  onClose,
}: ImportarStakeholdersModalProps) => {
  const { data: partesData, isLoading } = usePartesInteresadas({ page_size: 100 });
  const importarMutation = useImportarStakeholders();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const partes: ParteInteresada[] =
    partesData?.results ?? (Array.isArray(partesData) ? partesData : []);

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === partes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(partes.map((p) => p.id));
    }
  };

  const handleImportar = async () => {
    if (selectedIds.length === 0) return;
    await importarMutation.mutateAsync({
      proyecto_id: proyectoId,
      partes_interesadas_ids: selectedIds,
    });
    setSelectedIds([]);
    onClose();
  };

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose}>
        Cancelar
      </Button>
      <Button
        variant="primary"
        onClick={handleImportar}
        disabled={selectedIds.length === 0 || importarMutation.isPending}
        isLoading={importarMutation.isPending}
      >
        <Download className="h-4 w-4 mr-1" />
        Importar ({selectedIds.length})
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Importar desde Contexto Organizacional"
      subtitle="Seleccione las partes interesadas a importar al proyecto (ISO 9001 §4.2)"
      size="2xl"
      footer={footer}
    >
      <div className="space-y-4">
        <Alert
          variant="info"
          message="Las partes interesadas importadas se copiarán como interesados del proyecto. Los datos se duplican para poder editarlos de forma independiente."
        />

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse-subtle"
              />
            ))}
          </div>
        ) : partes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No hay partes interesadas registradas en Contexto Organizacional</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <Checkbox
                label={`Seleccionar todas (${partes.length})`}
                checked={selectedIds.length === partes.length && partes.length > 0}
                onChange={toggleAll}
              />
              <span className="text-sm text-gray-500">{selectedIds.length} seleccionada(s)</span>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              {partes.map((pi) => (
                <label
                  key={pi.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedIds.includes(pi.id)}
                    onChange={() => toggleSelection(pi.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {pi.nombre}
                      </span>
                      <Badge variant={pi.tipo_categoria === 'interno' ? 'info' : 'gray'} size="sm">
                        {pi.tipo_categoria === 'interno' ? 'Interno' : 'Externo'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      {pi.grupo_nombre && <span>{pi.grupo_nombre}</span>}
                      {pi.tipo_nombre && (
                        <>
                          <span>-</span>
                          <span>{pi.tipo_nombre}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Badge variant="gray" size="sm">
                      Int: {pi.nivel_interes}
                    </Badge>
                    <Badge variant="gray" size="sm">
                      Inf: {pi.nivel_influencia_pi}
                    </Badge>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}
      </div>
    </BaseModal>
  );
};
