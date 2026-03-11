/**
 * TiposPlantillasSection - Tipos de Documento y Plantillas
 * Extracted from GestionDocumentalTab for maintainability.
 */
import { useState } from 'react';
import {
  Files,
  Layout,
  PenTool,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Tag,
  MoreVertical,
} from 'lucide-react';
import { Card, Button, EmptyState, Badge, Spinner, ConfirmDialog } from '@/components/common';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';

import {
  useTiposDocumento,
  usePlantillasDocumento,
  useDeleteTipoDocumento,
  useDeletePlantillaDocumento,
  useActivarPlantilla,
} from '@/features/gestion-estrategica/hooks/useGestionDocumental';
import type {
  TipoDocumento,
  PlantillaDocumento,
} from '@/features/gestion-estrategica/types/gestion-documental.types';

interface TiposPlantillasSectionProps {
  onCreateTipo: () => void;
  onEditTipo: (tipo: TipoDocumento) => void;
  onCreatePlantilla: () => void;
  onEditPlantilla: (plantilla: PlantillaDocumento) => void;
}

export function TiposPlantillasSection({
  onCreateTipo,
  onEditTipo,
  onCreatePlantilla,
  onEditPlantilla,
}: TiposPlantillasSectionProps) {
  const { canDo } = usePermissions();
  const canCreateTipo = canDo(Modules.SISTEMA_GESTION, Sections.TIPOS_DOCUMENTO, 'create');
  const canEditTipo = canDo(Modules.SISTEMA_GESTION, Sections.TIPOS_DOCUMENTO, 'edit');
  const canDeleteTipo = canDo(Modules.SISTEMA_GESTION, Sections.TIPOS_DOCUMENTO, 'delete');
  const canCreatePlantilla = canDo(Modules.SISTEMA_GESTION, Sections.DOCUMENTOS, 'create');
  const canEditPlantilla = canDo(Modules.SISTEMA_GESTION, Sections.DOCUMENTOS, 'edit');
  const canDeletePlantilla = canDo(Modules.SISTEMA_GESTION, Sections.DOCUMENTOS, 'delete');

  const { data: tipos, isLoading: isLoadingTipos } = useTiposDocumento();
  const { data: plantillas, isLoading: isLoadingPlantillas } = usePlantillasDocumento();
  const deleteTipoMutation = useDeleteTipoDocumento();
  const deletePlantillaMutation = useDeletePlantillaDocumento();
  const activarPlantillaMutation = useActivarPlantilla();

  const [selectedTipo, setSelectedTipo] = useState<number | null>(null);
  const [confirmDeleteTipo, setConfirmDeleteTipo] = useState<TipoDocumento | null>(null);
  const [confirmDeletePlantilla, setConfirmDeletePlantilla] = useState<PlantillaDocumento | null>(
    null
  );
  const [tipoMenuOpen, setTipoMenuOpen] = useState<number | null>(null);
  const [plantillaMenuOpen, setPlantillaMenuOpen] = useState<number | null>(null);

  if (isLoadingTipos || isLoadingPlantillas) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tipos de Documento */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tipos de Documento
            </h3>
            {canCreateTipo && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={onCreateTipo}
              >
                Nuevo Tipo
              </Button>
            )}
          </div>

          {!tipos || tipos.length === 0 ? (
            <EmptyState
              icon={<Files className="w-12 h-12" />}
              title="No hay tipos de documento"
              description="Crea tipos de documento para organizar tu sistema documental."
              action={
                canCreateTipo
                  ? {
                      label: 'Crear Tipo',
                      onClick: onCreateTipo,
                      icon: <Plus className="w-4 h-4" />,
                    }
                  : undefined
              }
            />
          ) : (
            <div className="space-y-2">
              {tipos.map((tipo) => (
                <Card
                  key={tipo.id}
                  className={`p-4 cursor-pointer transition-all ${selectedTipo === tipo.id ? 'ring-2 ring-indigo-500' : ''}`}
                  onClick={() => setSelectedTipo(tipo.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tipo.color_identificacion }}
                        />
                        <h4 className="font-medium text-gray-900 dark:text-white">{tipo.nombre}</h4>
                        <Badge variant="secondary">{tipo.codigo}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {tipo.descripcion}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {tipo.nivel_documento}
                        </span>
                        {tipo.requiere_aprobacion && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Requiere aprobación
                          </span>
                        )}
                        {tipo.requiere_firma && (
                          <span className="flex items-center gap-1">
                            <PenTool className="w-3 h-3" />
                            Requiere firma
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={tipo.is_active ? 'success' : 'secondary'}>
                        {tipo.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTipoMenuOpen(tipoMenuOpen === tipo.id ? null : tipo.id);
                          }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                        {tipoMenuOpen === tipo.id && (
                          <div
                            className="absolute right-0 top-8 z-50 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {canEditTipo && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full !justify-start !min-h-0 px-4 py-2 text-sm"
                                onClick={() => {
                                  onEditTipo(tipo);
                                  setTipoMenuOpen(null);
                                }}
                              >
                                <Edit className="w-3 h-3" /> Editar
                              </Button>
                            )}
                            {canDeleteTipo && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full !justify-start !min-h-0 px-4 py-2 text-sm text-red-600"
                                onClick={() => {
                                  setConfirmDeleteTipo(tipo);
                                  setTipoMenuOpen(null);
                                }}
                              >
                                <Trash2 className="w-3 h-3" /> Eliminar
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Plantillas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Plantillas</h3>
            {canCreatePlantilla && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={onCreatePlantilla}
              >
                Nueva Plantilla
              </Button>
            )}
          </div>

          {!plantillas || plantillas.length === 0 ? (
            <EmptyState
              icon={<Layout className="w-12 h-12" />}
              title="No hay plantillas"
              description="Crea plantillas reutilizables para generar documentos de forma rápida."
              action={
                canCreatePlantilla
                  ? {
                      label: 'Crear Plantilla',
                      onClick: onCreatePlantilla,
                      icon: <Plus className="w-4 h-4" />,
                    }
                  : undefined
              }
            />
          ) : (
            <div className="space-y-2">
              {plantillas.map((plantilla) => (
                <Card key={plantilla.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Layout className="w-4 h-4 text-gray-400" />
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {plantilla.nombre}
                        </h4>
                        {plantilla.es_por_defecto && <Badge variant="primary">Por defecto</Badge>}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {plantilla.descripcion}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>{plantilla.tipo_plantilla}</span>
                        <span>v{plantilla.version}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          plantilla.estado === 'ACTIVA'
                            ? 'success'
                            : plantilla.estado === 'BORRADOR'
                              ? 'warning'
                              : 'secondary'
                        }
                      >
                        {plantilla.estado}
                      </Badge>
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setPlantillaMenuOpen(
                              plantillaMenuOpen === plantilla.id ? null : plantilla.id
                            )
                          }
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                        {plantillaMenuOpen === plantilla.id && (
                          <div className="absolute right-0 top-8 z-50 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1">
                            {canEditPlantilla && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full !justify-start !min-h-0 px-4 py-2 text-sm"
                                onClick={() => {
                                  onEditPlantilla(plantilla);
                                  setPlantillaMenuOpen(null);
                                }}
                              >
                                <Edit className="w-3 h-3" /> Editar
                              </Button>
                            )}
                            {canEditPlantilla && plantilla.estado !== 'ACTIVA' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full !justify-start !min-h-0 px-4 py-2 text-sm text-green-600"
                                onClick={() => {
                                  activarPlantillaMutation.mutate(plantilla.id);
                                  setPlantillaMenuOpen(null);
                                }}
                              >
                                <CheckCircle className="w-3 h-3" /> Activar
                              </Button>
                            )}
                            {canDeletePlantilla && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full !justify-start !min-h-0 px-4 py-2 text-sm text-red-600"
                                onClick={() => {
                                  setConfirmDeletePlantilla(plantilla);
                                  setPlantillaMenuOpen(null);
                                }}
                              >
                                <Trash2 className="w-3 h-3" /> Eliminar
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmDeleteTipo}
        onClose={() => setConfirmDeleteTipo(null)}
        onConfirm={() => {
          if (confirmDeleteTipo)
            deleteTipoMutation.mutate(confirmDeleteTipo.id, {
              onSuccess: () => setConfirmDeleteTipo(null),
            });
        }}
        title="Eliminar Tipo de Documento"
        message={`¿Eliminar el tipo "${confirmDeleteTipo?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteTipoMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!confirmDeletePlantilla}
        onClose={() => setConfirmDeletePlantilla(null)}
        onConfirm={() => {
          if (confirmDeletePlantilla)
            deletePlantillaMutation.mutate(confirmDeletePlantilla.id, {
              onSuccess: () => setConfirmDeletePlantilla(null),
            });
        }}
        title="Eliminar Plantilla"
        message={`¿Eliminar la plantilla "${confirmDeletePlantilla?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={deletePlantillaMutation.isPending}
      />
    </>
  );
}
