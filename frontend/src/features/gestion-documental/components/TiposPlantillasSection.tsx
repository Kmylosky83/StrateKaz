/**
 * TiposPlantillasSection - Tipos de Documento
 *
 * Vista dual: tarjetas (visual) o lista (compacta).
 * Las plantillas se gestionan desde el detalle de cada tipo.
 */
import { useState } from 'react';
import {
  Files,
  LayoutGrid,
  List,
  PenTool,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Tag,
  MoreVertical,
  Clock,
  Shield,
} from 'lucide-react';
import {
  Card,
  Button,
  EmptyState,
  Badge,
  Spinner,
  ConfirmDialog,
  ProtectedAction,
  ViewToggle,
} from '@/components/common';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';

import { useTiposDocumento, useDeleteTipoDocumento } from '../hooks/useGestionDocumental';
import type { TipoDocumento, PlantillaDocumento } from '../types/gestion-documental.types';

// ─── Constantes ─────────────────────────────────────────────────
type ViewMode = 'cards' | 'list';

const NIVEL_LABELS: Record<string, { label: string; color: string }> = {
  ESTRATEGICO: {
    label: 'Estratégico',
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-300',
  },
  TACTICO: {
    label: 'Táctico',
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300',
  },
  OPERATIVO: {
    label: 'Operativo',
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  SOPORTE: {
    label: 'Soporte',
    color: 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300',
  },
};

const VIEW_OPTIONS = [
  { value: 'cards' as const, label: 'Tarjetas', icon: LayoutGrid },
  { value: 'list' as const, label: 'Lista', icon: List },
];

// ─── Props ──────────────────────────────────────────────────────
interface TiposPlantillasSectionProps {
  onCreateTipo: () => void;
  onEditTipo: (tipo: TipoDocumento) => void;
  onCreatePlantilla: () => void;
  onEditPlantilla: (plantilla: PlantillaDocumento) => void;
}

export function TiposPlantillasSection({ onCreateTipo, onEditTipo }: TiposPlantillasSectionProps) {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.GESTION_DOCUMENTAL, Sections.TIPOS_DOCUMENTO, 'create');

  const { data: tipos, isLoading } = useTiposDocumento();
  const deleteMutation = useDeleteTipoDocumento();

  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem('gd_tipos_view') as ViewMode) || 'list'
  );
  const [confirmDelete, setConfirmDelete] = useState<TipoDocumento | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('gd_tipos_view', mode);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const tiposList = tipos || [];

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tipos de Documento
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {tiposList.length} tipo{tiposList.length !== 1 ? 's' : ''} registrado
              {tiposList.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle
            value={viewMode}
            onChange={handleViewChange}
            options={VIEW_OPTIONS}
            moduleColor="blue"
          />
          <ProtectedAction permission="gestion_documental.tipos_documento.create">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={onCreateTipo}
            >
              Nuevo Tipo
            </Button>
          </ProtectedAction>
        </div>
      </div>

      {/* Content */}
      {tiposList.length === 0 ? (
        <EmptyState
          icon={<Files className="w-12 h-12" />}
          title="No hay tipos de documento"
          description="Crea tipos de documento para organizar tu sistema documental."
          action={
            canCreate
              ? {
                  label: 'Crear Tipo',
                  onClick: onCreateTipo,
                  icon: <Plus className="w-4 h-4" />,
                }
              : undefined
          }
        />
      ) : viewMode === 'cards' ? (
        <TiposCardView
          tipos={tiposList}
          menuOpen={menuOpen}
          onMenuToggle={setMenuOpen}
          onEdit={onEditTipo}
          onDelete={setConfirmDelete}
        />
      ) : (
        <TiposListView tipos={tiposList} onEdit={onEditTipo} onDelete={setConfirmDelete} />
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete)
            deleteMutation.mutate(confirmDelete.id, {
              onSuccess: () => setConfirmDelete(null),
            });
        }}
        title="Eliminar Tipo de Documento"
        message={`¿Eliminar el tipo "${confirmDelete?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}

// ─── Card View ──────────────────────────────────────────────────
function TiposCardView({
  tipos,
  menuOpen,
  onMenuToggle,
  onEdit,
  onDelete,
}: {
  tipos: TipoDocumento[];
  menuOpen: number | null;
  onMenuToggle: (id: number | null) => void;
  onEdit: (tipo: TipoDocumento) => void;
  onDelete: (tipo: TipoDocumento) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {tipos.map((tipo) => {
        const nivel = NIVEL_LABELS[tipo.nivel_documento] || NIVEL_LABELS.SOPORTE;
        return (
          <Card key={tipo.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: tipo.color_identificacion }}
                />
                <h4 className="font-medium text-gray-900 dark:text-white">{tipo.nombre}</h4>
              </div>
              <TipoMenu
                tipo={tipo}
                isOpen={menuOpen === tipo.id}
                onToggle={() => onMenuToggle(menuOpen === tipo.id ? null : tipo.id)}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary">{tipo.codigo}</Badge>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${nivel.color}`}>
                {nivel.label}
              </span>
            </div>

            {tipo.descripcion && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {tipo.descripcion}
              </p>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                {tipo.requiere_aprobacion && (
                  <span className="flex items-center gap-1" title="Requiere aprobación">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                    Aprobación
                  </span>
                )}
                {tipo.requiere_firma && (
                  <span className="flex items-center gap-1" title="Requiere firma digital">
                    <PenTool className="w-3.5 h-3.5 text-indigo-500" />
                    Firma
                  </span>
                )}
                {tipo.tiempo_retencion_anos && (
                  <span className="flex items-center gap-1" title="Tiempo de retención">
                    <Clock className="w-3.5 h-3.5" />
                    {tipo.tiempo_retencion_anos}a
                  </span>
                )}
              </div>
              <Badge variant={tipo.is_active ? 'success' : 'secondary'} size="sm">
                {tipo.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── List View ──────────────────────────────────────────────────
function TiposListView({
  tipos,
  onEdit,
  onDelete,
}: {
  tipos: TipoDocumento[];
  onEdit: (tipo: TipoDocumento) => void;
  onDelete: (tipo: TipoDocumento) => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="hidden md:grid md:grid-cols-[auto_1fr_120px_120px_100px_80px_60px] gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
        <div className="w-3" />
        <div>Nombre</div>
        <div>Código</div>
        <div>Nivel</div>
        <div>Requisitos</div>
        <div>Estado</div>
        <div />
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {tipos.map((tipo) => {
          const nivel = NIVEL_LABELS[tipo.nivel_documento] || NIVEL_LABELS.SOPORTE;
          return (
            <div
              key={tipo.id}
              className="grid grid-cols-1 md:grid-cols-[auto_1fr_120px_120px_100px_80px_60px] gap-4 px-4 py-3 items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              {/* Color dot */}
              <div
                className="w-3 h-3 rounded-full shrink-0 hidden md:block"
                style={{ backgroundColor: tipo.color_identificacion }}
              />

              {/* Name + description */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 md:hidden mb-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: tipo.color_identificacion }}
                  />
                  <Badge variant="secondary" size="sm">
                    {tipo.codigo}
                  </Badge>
                </div>
                <p className="font-medium text-gray-900 dark:text-white truncate">{tipo.nombre}</p>
                {tipo.descripcion && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {tipo.descripcion}
                  </p>
                )}
              </div>

              {/* Code */}
              <div className="hidden md:block">
                <Badge variant="secondary">{tipo.codigo}</Badge>
              </div>

              {/* Level */}
              <div className="hidden md:block">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${nivel.color}`}>
                  {nivel.label}
                </span>
              </div>

              {/* Requirements */}
              <div className="hidden md:flex items-center gap-1.5">
                {tipo.requiere_aprobacion && (
                  <CheckCircle className="w-4 h-4 text-blue-500" title="Requiere aprobación" />
                )}
                {tipo.requiere_firma && (
                  <PenTool className="w-4 h-4 text-indigo-500" title="Requiere firma" />
                )}
                {tipo.tiempo_retencion_anos && (
                  <span className="text-xs text-gray-400" title="Retención">
                    <Clock className="w-3.5 h-3.5 inline mr-0.5" />
                    {tipo.tiempo_retencion_anos}a
                  </span>
                )}
                {!tipo.requiere_aprobacion && !tipo.requiere_firma && (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </div>

              {/* Status */}
              <div className="hidden md:block">
                <Badge variant={tipo.is_active ? 'success' : 'secondary'} size="sm">
                  {tipo.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 justify-end">
                <ProtectedAction permission="gestion_documental.tipos_documento.edit">
                  <button
                    className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
                    onClick={() => onEdit(tipo)}
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </ProtectedAction>
                <ProtectedAction permission="gestion_documental.tipos_documento.delete">
                  <button
                    className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                    onClick={() => onDelete(tipo)}
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </ProtectedAction>
              </div>

              {/* Mobile: extra info */}
              <div className="flex items-center justify-between md:hidden col-span-full">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${nivel.color}`}>
                    {nivel.label}
                  </span>
                  {tipo.requiere_firma && (
                    <span className="flex items-center gap-1 text-xs text-indigo-500">
                      <PenTool className="w-3 h-3" /> Firma
                    </span>
                  )}
                </div>
                <Badge variant={tipo.is_active ? 'success' : 'secondary'} size="sm">
                  {tipo.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Shared: Context Menu ───────────────────────────────────────
function TipoMenu({
  tipo,
  isOpen,
  onToggle,
  onEdit,
  onDelete,
}: {
  tipo: TipoDocumento;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: (tipo: TipoDocumento) => void;
  onDelete: (tipo: TipoDocumento) => void;
}) {
  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        <MoreVertical className="w-4 h-4" />
      </Button>
      {isOpen && (
        <div
          className="absolute right-0 top-8 z-50 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1"
          onClick={(e) => e.stopPropagation()}
        >
          <ProtectedAction permission="gestion_documental.tipos_documento.edit">
            <Button
              variant="ghost"
              size="sm"
              className="w-full !justify-start !min-h-0 px-4 py-2 text-sm"
              onClick={() => {
                onEdit(tipo);
                onToggle();
              }}
            >
              <Edit className="w-3 h-3" /> Editar
            </Button>
          </ProtectedAction>
          <ProtectedAction permission="gestion_documental.tipos_documento.delete">
            <Button
              variant="ghost"
              size="sm"
              className="w-full !justify-start !min-h-0 px-4 py-2 text-sm text-red-600"
              onClick={() => {
                onDelete(tipo);
                onToggle();
              }}
            >
              <Trash2 className="w-3 h-3" /> Eliminar
            </Button>
          </ProtectedAction>
        </div>
      )}
    </div>
  );
}
