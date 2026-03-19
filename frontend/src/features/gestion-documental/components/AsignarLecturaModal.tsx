/**
 * AsignarLecturaModal — Asignar lectura verificada a colaboradores.
 *
 * Mejora 3: ISO 7.3 Toma de Conciencia.
 * Permite seleccionar múltiples colaboradores y asignarles la lectura
 * obligatoria de un documento publicado, con fecha límite opcional.
 */
import { useState, useMemo } from 'react';
import { BookOpen, Search, Calendar, Users, Check, X } from 'lucide-react';
import { toast } from 'sonner';

import { BaseModal } from '@/components/modals/BaseModal';
import { Button, Badge, Spinner } from '@/components/common';
import { Input } from '@/components/forms';
import { useSelectColaboradores } from '@/hooks/useSelectLists';
import { useAsignarLectura } from '../hooks/useAceptacionDocumental';

// ==================== TYPES ====================

interface AsignarLecturaModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentoId: number;
  documentoTitulo: string;
  documentoCodigo: string;
}

interface ColaboradorOption {
  id: number;
  label: string;
  extra?: {
    documento?: string;
    cargo?: string;
    cargo_id?: string;
    usuario_id?: string;
  };
}

// ==================== COMPONENT ====================

export default function AsignarLecturaModal({
  isOpen,
  onClose,
  documentoId,
  documentoTitulo,
  documentoCodigo,
}: AsignarLecturaModalProps) {
  const { data: colaboradores, isLoading: isLoadingColabs } = useSelectColaboradores();
  const asignarMutation = useAsignarLectura();

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');

  // Filtrar solo colaboradores con usuario vinculado
  const colaboradoresConUsuario = useMemo(() => {
    if (!colaboradores) return [];
    return colaboradores.filter((c) => c.extra?.usuario_id);
  }, [colaboradores]);

  // Aplicar búsqueda
  const filteredColabs = useMemo(() => {
    if (!searchTerm.trim()) return colaboradoresConUsuario;
    const term = searchTerm.toLowerCase();
    return colaboradoresConUsuario.filter(
      (c) =>
        c.label.toLowerCase().includes(term) ||
        c.extra?.cargo?.toLowerCase().includes(term) ||
        c.extra?.documento?.includes(term)
    );
  }, [colaboradoresConUsuario, searchTerm]);

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    const allIds = filteredColabs.map((c) => c.id);
    setSelectedIds(new Set(allIds));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      toast.error('Selecciona al menos un colaborador');
      return;
    }

    // Mapear colaborador_id → usuario_id
    const usuarioIds = Array.from(selectedIds)
      .map((colabId) => {
        const colab = colaboradoresConUsuario.find((c) => c.id === colabId);
        return colab?.extra?.usuario_id ? Number(colab.extra.usuario_id) : null;
      })
      .filter((id): id is number => id !== null && id > 0);

    if (usuarioIds.length === 0) {
      toast.error('Los colaboradores seleccionados no tienen usuario vinculado');
      return;
    }

    try {
      await asignarMutation.mutateAsync({
        documento_id: documentoId,
        usuario_ids: usuarioIds,
        fecha_limite: fechaLimite || null,
      });
      handleClose();
    } catch {
      // Error handled by hook onError
    }
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setSearchTerm('');
    setFechaLimite('');
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Asignar Lectura Verificada"
      size="2xl"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={asignarMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={selectedIds.size === 0 || asignarMutation.isPending}
            isLoading={asignarMutation.isPending}
            onClick={handleSubmit}
          >
            <BookOpen className="mr-1.5 h-4 w-4" />
            Asignar Lectura ({selectedIds.size})
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
          <BookOpen className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{documentoTitulo}</p>
            <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
              <Badge variant="secondary" size="sm">
                {documentoCodigo}
              </Badge>{' '}
              — Los colaboradores seleccionados deberán leer y aceptar este documento (ISO 7.3).
            </p>
          </div>
        </div>

        {/* Fecha límite */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Input
              type="date"
              label="Fecha límite (opcional)"
              value={fechaLimite}
              onChange={(e) => setFechaLimite(e.target.value)}
              leftIcon={<Calendar className="h-4 w-4" />}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Barra de búsqueda + acciones masivas */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nombre, cargo o documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={selectAll}>
            <Check className="h-3.5 w-3.5 mr-1" />
            Todos
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={deselectAll}>
            <X className="h-3.5 w-3.5 mr-1" />
            Ninguno
          </Button>
        </div>

        {/* Contador */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {filteredColabs.length} colaborador{filteredColabs.length !== 1 ? 'es' : ''} disponible
            {filteredColabs.length !== 1 ? 's' : ''}
          </span>
          {selectedIds.size > 0 && (
            <Badge variant="primary" size="sm">
              {selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Lista de colaboradores */}
        <div className="max-h-[40vh] overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          {isLoadingColabs ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : filteredColabs.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              {searchTerm
                ? 'No se encontraron colaboradores con ese criterio'
                : 'No hay colaboradores con usuario vinculado'}
            </div>
          ) : (
            filteredColabs.map((colab: ColaboradorOption) => {
              const isSelected = selectedIds.has(colab.id);
              return (
                <label
                  key={colab.id}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(colab.id)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {colab.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {colab.extra?.cargo || 'Sin cargo'}
                      {colab.extra?.documento ? ` · ${colab.extra.documento}` : ''}
                    </p>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-primary-600 flex-shrink-0" />}
                </label>
              );
            })
          )}
        </div>
      </div>
    </BaseModal>
  );
}
