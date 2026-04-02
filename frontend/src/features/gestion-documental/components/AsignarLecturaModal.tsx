/**
 * AsignarLecturaModal — Asignar lectura verificada (ISO 7.3 Toma de Conciencia).
 *
 * Tres modos de distribución RBAC (combinables):
 *   1. Por Colaborador  — selección individual
 *   2. Por Cargo        — todos los usuarios con ese cargo
 *   3. Todos            — todos los usuarios activos del tenant
 *
 * El backend resuelve la unión y crea AceptacionDocumental por cada usuario único.
 */
import { useState, useMemo } from 'react';
import { BookOpen, Search, Calendar, Users, Check, X, Briefcase, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

import { BaseModal } from '@/components/modals/BaseModal';
import { Button, Badge, Spinner } from '@/components/common';
import { Input } from '@/components/forms';
import { useSelectColaboradores, useSelectCargos } from '@/hooks/useSelectLists';
import { useAsignarLectura } from '../hooks/useAceptacionDocumental';

// ==================== TYPES ====================

interface AsignarLecturaModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentoId: number;
  documentoTitulo: string;
  documentoCodigo: string;
}

type Tab = 'colaborador' | 'cargo' | 'todos';

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

interface CargoOption {
  id: number;
  label: string;
  extra?: { count?: number };
}

// ==================== SUBCOMPONENT: Tab Button ====================

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-white text-primary-700 shadow-sm dark:bg-gray-700 dark:text-primary-400'
          : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ==================== MAIN COMPONENT ====================

export default function AsignarLecturaModal({
  isOpen,
  onClose,
  documentoId,
  documentoTitulo,
  documentoCodigo,
}: AsignarLecturaModalProps) {
  const { data: colaboradores, isLoading: isLoadingColabs } = useSelectColaboradores();
  const { data: cargos, isLoading: isLoadingCargos } = useSelectCargos();
  const asignarMutation = useAsignarLectura();

  const [activeTab, setActiveTab] = useState<Tab>('colaborador');
  const [selectedColabIds, setSelectedColabIds] = useState<Set<number>>(new Set());
  const [selectedCargoIds, setSelectedCargoIds] = useState<Set<number>>(new Set());
  const [aplicarATodos, setAplicarATodos] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');

  // ── Filtered colaboradores (con usuario vinculado) ──────────────────────
  const colaboradoresConUsuario = useMemo(() => {
    if (!colaboradores) return [];
    return colaboradores.filter((c) => c.extra?.usuario_id) as ColaboradorOption[];
  }, [colaboradores]);

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

  // ── Filtered cargos ─────────────────────────────────────────────────────
  const filteredCargos = useMemo(() => {
    if (!cargos) return [];
    if (!searchTerm.trim()) return cargos as CargoOption[];
    const term = searchTerm.toLowerCase();
    return (cargos as CargoOption[]).filter((c) => c.label.toLowerCase().includes(term));
  }, [cargos, searchTerm]);

  // ── Selection helpers ────────────────────────────────────────────────────
  const toggleColab = (id: number) =>
    setSelectedColabIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleCargo = (id: number) =>
    setSelectedCargoIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectAllColabs = () => setSelectedColabIds(new Set(filteredColabs.map((c) => c.id)));
  const deselectAllColabs = () => setSelectedColabIds(new Set());
  const selectAllCargos = () => setSelectedCargos(new Set(filteredCargos.map((c) => c.id)));
  const deselectAllCargos = () => setSelectedCargoIds(new Set());

  // eslint-disable-next-line @typescript-eslint/no-shadow
  function setSelectedCargos(ids: Set<number>) {
    setSelectedCargoIds(ids);
  }

  // ── Has selection ────────────────────────────────────────────────────────
  const hasSelection = selectedColabIds.size > 0 || selectedCargoIds.size > 0 || aplicarATodos;

  // ── Label para el botón ─────────────────────────────────────────────────
  const selectionLabel = useMemo(() => {
    const parts: string[] = [];
    if (selectedColabIds.size > 0)
      parts.push(`${selectedColabIds.size} colaborador${selectedColabIds.size !== 1 ? 'es' : ''}`);
    if (selectedCargoIds.size > 0)
      parts.push(`${selectedCargoIds.size} cargo${selectedCargoIds.size !== 1 ? 's' : ''}`);
    if (aplicarATodos) parts.push('todos');
    return parts.length > 0 ? `(${parts.join(' + ')})` : '';
  }, [selectedColabIds.size, selectedCargoIds.size, aplicarATodos]);

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!hasSelection) {
      toast.error('Selecciona al menos un destinatario');
      return;
    }

    // Mapear colaborador_id → usuario_id
    const usuarioIds = Array.from(selectedColabIds)
      .map((colabId) => {
        const colab = colaboradoresConUsuario.find((c) => c.id === colabId);
        return colab?.extra?.usuario_id ? Number(colab.extra.usuario_id) : null;
      })
      .filter((id): id is number => id !== null && id > 0);

    try {
      await asignarMutation.mutateAsync({
        documento_id: documentoId,
        usuario_ids: usuarioIds,
        cargo_ids: Array.from(selectedCargoIds),
        aplica_a_todos: aplicarATodos,
        fecha_limite: fechaLimite || null,
      });
      handleClose();
    } catch {
      // Error handled by hook onError
    }
  };

  const handleClose = () => {
    setSelectedColabIds(new Set());
    setSelectedCargoIds(new Set());
    setAplicarATodos(false);
    setSearchTerm('');
    setFechaLimite('');
    setActiveTab('colaborador');
    onClose();
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearchTerm('');
  };

  // ==================== RENDER ====================

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
            disabled={!hasSelection || asignarMutation.isPending}
            isLoading={asignarMutation.isPending}
            onClick={handleSubmit}
          >
            <BookOpen className="mr-1.5 h-4 w-4" />
            Asignar Lectura {selectionLabel}
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
              — Selecciona quiénes deben leer y aceptar este documento (ISO 7.3).
            </p>
          </div>
        </div>

        {/* Fecha límite */}
        <Input
          type="date"
          label="Fecha límite (opcional)"
          value={fechaLimite}
          onChange={(e) => setFechaLimite(e.target.value)}
          leftIcon={<Calendar className="h-4 w-4" />}
          min={new Date().toISOString().split('T')[0]}
        />

        {/* Tabs RBAC */}
        <div className="rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          <div className="flex gap-1">
            <TabButton
              active={activeTab === 'colaborador'}
              onClick={() => handleTabChange('colaborador')}
              icon={<Users className="h-4 w-4" />}
              label="Por Colaborador"
            />
            <TabButton
              active={activeTab === 'cargo'}
              onClick={() => handleTabChange('cargo')}
              icon={<Briefcase className="h-4 w-4" />}
              label="Por Cargo"
            />
            <TabButton
              active={activeTab === 'todos'}
              onClick={() => handleTabChange('todos')}
              icon={<UserCheck className="h-4 w-4" />}
              label="Todos"
            />
          </div>
        </div>

        {/* ── Tab: Por Colaborador ─────────────────────────────────────────── */}
        {activeTab === 'colaborador' && (
          <>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nombre, cargo o documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={selectAllColabs}>
                <Check className="mr-1 h-3.5 w-3.5" />
                Todos
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={deselectAllColabs}>
                <X className="mr-1 h-3.5 w-3.5" />
                Ninguno
              </Button>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {filteredColabs.length} colaborador{filteredColabs.length !== 1 ? 'es' : ''}{' '}
                disponible{filteredColabs.length !== 1 ? 's' : ''}
              </span>
              {selectedColabIds.size > 0 && (
                <Badge variant="primary" size="sm">
                  {selectedColabIds.size} seleccionado{selectedColabIds.size !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            <div className="max-h-[36vh] overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100 dark:border-gray-700 dark:divide-gray-700">
              {isLoadingColabs ? (
                <div className="flex justify-center py-8">
                  <Spinner size="md" />
                </div>
              ) : filteredColabs.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">
                  {searchTerm
                    ? 'No se encontraron colaboradores con ese criterio'
                    : 'No hay colaboradores con usuario vinculado'}
                </p>
              ) : (
                filteredColabs.map((colab: ColaboradorOption) => {
                  const isSelected = selectedColabIds.has(colab.id);
                  return (
                    <label
                      key={colab.id}
                      className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors ${
                        isSelected
                          ? 'bg-primary-50 dark:bg-primary-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleColab(colab.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {colab.label}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {colab.extra?.cargo || 'Sin cargo'}
                          {colab.extra?.documento ? ` · ${colab.extra.documento}` : ''}
                        </p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 flex-shrink-0 text-primary-600" />}
                    </label>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* ── Tab: Por Cargo ──────────────────────────────────────────────── */}
        {activeTab === 'cargo' && (
          <>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Buscar cargo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={selectAllCargos}>
                <Check className="mr-1 h-3.5 w-3.5" />
                Todos
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={deselectAllCargos}>
                <X className="mr-1 h-3.5 w-3.5" />
                Ninguno
              </Button>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {filteredCargos.length} cargo{filteredCargos.length !== 1 ? 's' : ''} disponible
                {filteredCargos.length !== 1 ? 's' : ''}
              </span>
              {selectedCargoIds.size > 0 && (
                <Badge variant="primary" size="sm">
                  {selectedCargoIds.size} seleccionado{selectedCargoIds.size !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Se asignará la lectura a todos los colaboradores activos que tengan los cargos
              seleccionados.
            </p>

            <div className="max-h-[36vh] overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100 dark:border-gray-700 dark:divide-gray-700">
              {isLoadingCargos ? (
                <div className="flex justify-center py-8">
                  <Spinner size="md" />
                </div>
              ) : filteredCargos.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">
                  {searchTerm ? 'No se encontraron cargos' : 'No hay cargos configurados'}
                </p>
              ) : (
                filteredCargos.map((cargo: CargoOption) => {
                  const isSelected = selectedCargoIds.has(cargo.id);
                  return (
                    <label
                      key={cargo.id}
                      className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors ${
                        isSelected
                          ? 'bg-primary-50 dark:bg-primary-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCargo(cargo.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {cargo.label}
                        </p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 flex-shrink-0 text-primary-600" />}
                    </label>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* ── Tab: Todos ──────────────────────────────────────────────────── */}
        {activeTab === 'todos' && (
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={aplicarATodos}
                onChange={(e) => setAplicarATodos(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Distribuir a todos los usuarios activos
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Se asignará la lectura a todos los colaboradores con usuario activo en el sistema,
                  independiente de su cargo o área. Útil para políticas globales (Habeas Data,
                  Código de Ética, etc.).
                </p>
              </div>
            </label>

            {aplicarATodos && (
              <div className="mt-3 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                <UserCheck className="h-4 w-4 flex-shrink-0" />
                <span>
                  Se crearán asignaciones de lectura para todos los usuarios activos del tenant. Las
                  asignaciones existentes no se duplican.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Resumen de selección combinada */}
        {(selectedColabIds.size > 0 || selectedCargoIds.size > 0) && !aplicarATodos && (
          <div className="flex flex-wrap gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium">Distribución:</span>
            {selectedColabIds.size > 0 && (
              <Badge variant="secondary" size="sm">
                {selectedColabIds.size} colaborador{selectedColabIds.size !== 1 ? 'es' : ''}
              </Badge>
            )}
            {selectedCargoIds.size > 0 && (
              <Badge variant="secondary" size="sm">
                {selectedCargoIds.size} cargo{selectedCargoIds.size !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        )}
      </div>
    </BaseModal>
  );
}
