/**
 * Matriz de Comunicación con Partes Interesadas
 *
 * ISO 9001:2015 Cláusula 7.4 — Qué, cuándo, cómo comunicar y quién es responsable
 * Tabla CRUD con modal para crear/editar registros de comunicación.
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  MessageSquare,
  Mail,
  Phone,
  Video,
  FileText,
  Globe,
  Megaphone,
  Users as UsersIcon,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Alert } from '@/components/common/Alert';
import { Tooltip } from '@/components/common/Tooltip';
import { Textarea } from '@/components/forms/Textarea';
import { Switch } from '@/components/forms/Switch';
import { BaseModal } from '@/components/modals/BaseModal';
import { DataTableCard, TableSkeleton } from '@/components/layout/DataTableCard';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import {
  useMatrizComunicacion,
  useMatrizComunicacionMutation,
  type MatrizComunicacion,
  type MatrizComunicacionFilters,
} from '../../hooks/useMatrizComunicacion';
import { usePartesInteresadas } from '../../hooks/usePartesInteresadas';
import { useSelectCargos } from '@/hooks/useSelectLists';

// =============================================================================
// CONSTANTES
// =============================================================================

export const FRECUENCIAS = [
  { value: 'diaria', label: 'Diaria' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'bimestral', label: 'Bimestral' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
  { value: 'segun_necesidad', label: 'Según necesidad' },
];

export const MEDIOS = [
  { value: 'email', label: 'Correo Electrónico', icon: Mail },
  { value: 'reunion', label: 'Reunión Presencial', icon: UsersIcon },
  { value: 'videoconferencia', label: 'Videoconferencia', icon: Video },
  { value: 'informe', label: 'Informe Escrito', icon: FileText },
  { value: 'cartelera', label: 'Cartelera/Mural', icon: Megaphone },
  { value: 'intranet', label: 'Intranet/Portal', icon: Globe },
  { value: 'telefono', label: 'Teléfono', icon: Phone },
  { value: 'whatsapp', label: 'WhatsApp/Mensajería', icon: MessageSquare },
  { value: 'redes', label: 'Redes Sociales', icon: Globe },
  { value: 'capacitacion', label: 'Capacitación/Charla', icon: UsersIcon },
  { value: 'otro', label: 'Otro', icon: MessageSquare },
];

const FRECUENCIA_BADGE: Record<
  string,
  { variant: 'danger' | 'warning' | 'info' | 'success' | 'gray'; label: string }
> = {
  diaria: { variant: 'danger', label: 'Diaria' },
  semanal: { variant: 'danger', label: 'Semanal' },
  quincenal: { variant: 'warning', label: 'Quincenal' },
  mensual: { variant: 'warning', label: 'Mensual' },
  bimestral: { variant: 'info', label: 'Bimestral' },
  trimestral: { variant: 'info', label: 'Trimestral' },
  semestral: { variant: 'gray', label: 'Semestral' },
  anual: { variant: 'gray', label: 'Anual' },
  segun_necesidad: { variant: 'success', label: 'S/Necesidad' },
};

// =============================================================================
// FORM MODAL
// =============================================================================

interface FormData {
  parte_interesada: string;
  que_comunicar: string;
  cuando_comunicar: string;
  como_comunicar: string;
  responsable: string;
  registro_evidencia: string;
  es_obligatoria: boolean;
  observaciones: string;
}

const defaultFormData: FormData = {
  parte_interesada: '',
  que_comunicar: '',
  cuando_comunicar: 'mensual',
  como_comunicar: 'email',
  responsable: '',
  registro_evidencia: '',
  es_obligatoria: false,
  observaciones: '',
};

interface MatrizFormModalProps {
  item: MatrizComunicacion | null;
  isOpen: boolean;
  onClose: () => void;
}

const MatrizFormModal = ({ item, isOpen, onClose }: MatrizFormModalProps) => {
  const isEditing = item !== null;
  const [formData, setFormData] = React.useState<FormData>(defaultFormData);
  const [error, setError] = React.useState<string | null>(null);

  const { create, update, isLoading } = useMatrizComunicacionMutation();
  const { data: partesInteresadas } = usePartesInteresadas({ page_size: 200 });
  const { data: cargosData } = useSelectCargos();

  // Load data on edit
  React.useEffect(() => {
    if (isEditing && item) {
      setFormData({
        parte_interesada: item.parte_interesada.toString(),
        que_comunicar: item.que_comunicar || '',
        cuando_comunicar: item.cuando_comunicar || 'mensual',
        como_comunicar: item.como_comunicar || 'email',
        responsable: item.responsable?.toString() || '',
        registro_evidencia: item.registro_evidencia || '',
        es_obligatoria: item.es_obligatoria || false,
        observaciones: item.observaciones || '',
      });
    } else if (!isEditing) {
      setFormData(defaultFormData);
    }
    setError(null);
  }, [item, isEditing, isOpen]);

  const handleFieldChange = useCallback((field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Memoized text handlers
  const createTextHandler = useCallback(
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      handleFieldChange(field, e.target.value);
    },
    [handleFieldChange]
  );

  const handleQueComunicar = useMemo(() => createTextHandler('que_comunicar'), [createTextHandler]);
  const handleRegistro = useMemo(
    () => createTextHandler('registro_evidencia'),
    [createTextHandler]
  );
  const handleObservaciones = useMemo(
    () => createTextHandler('observaciones'),
    [createTextHandler]
  );

  const piOptions = useMemo(
    () => [
      { value: '', label: 'Seleccione parte interesada' },
      ...partesInteresadas.map((pi) => ({ value: pi.id.toString(), label: pi.nombre })),
    ],
    [partesInteresadas]
  );

  const cargoOptions = useMemo(
    () => [
      { value: '', label: 'Sin asignar' },
      ...(cargosData || []).map((c) => ({
        value: c.id.toString(),
        label: c.label,
      })),
    ],
    [cargosData]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.parte_interesada) {
      setError('Debe seleccionar una parte interesada');
      return;
    }
    if (!formData.que_comunicar.trim()) {
      setError('Debe indicar qué se comunica');
      return;
    }

    try {
      const payload = {
        parte_interesada: parseInt(formData.parte_interesada),
        que_comunicar: formData.que_comunicar.trim(),
        cuando_comunicar: formData.cuando_comunicar as any,
        como_comunicar: formData.como_comunicar as any,
        responsable: formData.responsable ? parseInt(formData.responsable) : undefined,
        registro_evidencia: formData.registro_evidencia.trim() || undefined,
        es_obligatoria: formData.es_obligatoria,
        observaciones: formData.observaciones.trim() || undefined,
      };

      if (isEditing && item) {
        await update({ id: item.id, data: payload });
      } else {
        await create(payload);
      }
      onClose();
    } catch {
      setError('Error al guardar el registro');
    }
  };

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button
        type="submit"
        variant="primary"
        onClick={handleSubmit}
        disabled={isLoading || !formData.parte_interesada || !formData.que_comunicar}
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Crear Registro'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Comunicación' : 'Nueva Comunicación'}
      subtitle="ISO 9001:2015 Cláusula 7.4"
      size="xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert variant="error" message={error} closable onClose={() => setError(null)} />}

        <Select
          id="mc-parte-interesada"
          label="Parte Interesada *"
          value={formData.parte_interesada}
          onChange={(e) => handleFieldChange('parte_interesada', e.target.value)}
          options={piOptions}
          disabled={isEditing}
        />

        <Textarea
          id="mc-que-comunicar"
          label="¿Qué comunicar? *"
          value={formData.que_comunicar}
          onChange={handleQueComunicar}
          placeholder="Información, mensaje o tema a comunicar a esta parte interesada"
          rows={2}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            id="mc-cuando"
            label="¿Cuándo? (Frecuencia) *"
            value={formData.cuando_comunicar}
            onChange={(e) => handleFieldChange('cuando_comunicar', e.target.value)}
            options={FRECUENCIAS}
          />
          <Select
            id="mc-como"
            label="¿Cómo? (Medio) *"
            value={formData.como_comunicar}
            onChange={(e) => handleFieldChange('como_comunicar', e.target.value)}
            options={MEDIOS.map((m) => ({ value: m.value, label: m.label }))}
          />
        </div>

        <Select
          id="mc-responsable"
          label="¿Quién? (Cargo responsable)"
          value={formData.responsable}
          onChange={(e) => handleFieldChange('responsable', e.target.value)}
          options={cargoOptions}
          helperText="Cargo responsable de ejecutar la comunicación"
        />

        <Input
          id="mc-registro"
          label="Registro/Evidencia"
          value={formData.registro_evidencia}
          onChange={handleRegistro}
          placeholder="Ej: Acta de reunión, correo enviado, informe publicado"
        />

        <Switch
          label="Comunicación obligatoria"
          description="Marque si esta comunicación es requerida por norma o ley"
          checked={formData.es_obligatoria}
          onCheckedChange={(checked) => handleFieldChange('es_obligatoria', checked)}
        />

        <Textarea
          id="mc-observaciones"
          label="Observaciones"
          value={formData.observaciones}
          onChange={handleObservaciones}
          placeholder="Notas adicionales sobre esta comunicación"
          rows={2}
        />
      </form>
    </BaseModal>
  );
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

interface MatrizComunicacionSectionProps {
  searchFilter?: string;
  frecuenciaFilter?: string;
  medioFilter?: string;
  triggerNewForm?: number;
}

export const MatrizComunicacionSection = ({
  searchFilter,
  frecuenciaFilter,
  medioFilter,
  triggerNewForm,
}: MatrizComunicacionSectionProps) => {
  const [filters, setFilters] = useState<MatrizComunicacionFilters>({
    page: 1,
    page_size: 10,
  });
  const [selectedItem, setSelectedItem] = useState<MatrizComunicacion | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<MatrizComunicacion | null>(null);

  // Sincronizar filtros externos del padre
  React.useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      search: searchFilter || undefined,
      cuando_comunicar: frecuenciaFilter || undefined,
      como_comunicar: medioFilter || undefined,
      page: 1,
    }));
  }, [searchFilter, frecuenciaFilter, medioFilter]);

  // Trigger para abrir modal desde el padre
  React.useEffect(() => {
    if (triggerNewForm && triggerNewForm > 0) {
      setSelectedItem(null);
      setIsModalOpen(true);
    }
  }, [triggerNewForm]);

  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.GESTION_ESTRATEGICA, Sections.CONTEXTO, 'create');
  const canEdit = canDo(Modules.GESTION_ESTRATEGICA, Sections.CONTEXTO, 'edit');
  const canDelete = canDo(Modules.GESTION_ESTRATEGICA, Sections.CONTEXTO, 'delete');

  const {
    data: items,
    totalCount,
    isLoading,
    error,
    delete: deleteItem,
    isDeleting,
  } = useMatrizComunicacion(filters);

  const handleCreate = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: MatrizComunicacion) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      try {
        await deleteItem(deleteConfirm.id);
        setDeleteConfirm(null);
      } catch {
        /* handled by hook */
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const getMedioIcon = (medio: string) => {
    const found = MEDIOS.find((m) => m.value === medio);
    if (!found) return MessageSquare;
    return found.icon;
  };

  if (error) {
    return <Alert variant="error" message="Error al cargar la matriz de comunicación." />;
  }

  const isEmpty = !isLoading && items.length === 0;

  return (
    <div className="space-y-4">
      {/* Tabla */}
      {isLoading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : isEmpty ? (
        <EmptyState
          icon={<MessageSquare className="h-12 w-12" />}
          title="Sin registros de comunicación"
          description="Genere la matriz automáticamente desde la vista de Partes Interesadas o cree registros manualmente."
          action={
            canCreate
              ? {
                  label: 'Crear Primer Registro',
                  onClick: handleCreate,
                  icon: <Plus className="h-4 w-4" />,
                }
              : undefined
          }
        />
      ) : (
        <DataTableCard
          columns={[
            {
              key: 'parte_interesada',
              header: 'Parte Interesada',
              render: (item: MatrizComunicacion) => (
                <div className="font-medium text-gray-900 dark:text-gray-100 max-w-[180px] truncate">
                  {item.parte_interesada_nombre}
                </div>
              ),
            },
            {
              key: 'que_comunicar',
              header: 'Qué Comunicar',
              render: (item: MatrizComunicacion) => (
                <div className="text-sm text-gray-700 dark:text-gray-300 max-w-[220px] line-clamp-2">
                  {item.que_comunicar}
                </div>
              ),
            },
            {
              key: 'cuando',
              header: 'Cuándo',
              render: (item: MatrizComunicacion) => {
                const config = FRECUENCIA_BADGE[item.cuando_comunicar];
                return (
                  <Badge variant={config?.variant || 'gray'} size="sm">
                    {config?.label || item.cuando_display}
                  </Badge>
                );
              },
            },
            {
              key: 'como',
              header: 'Cómo',
              render: (item: MatrizComunicacion) => {
                const IconComp = getMedioIcon(item.como_comunicar);
                return (
                  <Tooltip content={item.como_display}>
                    <div className="flex items-center gap-1.5">
                      <IconComp className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{item.como_display}</span>
                    </div>
                  </Tooltip>
                );
              },
            },
            {
              key: 'responsable',
              header: 'Responsable',
              render: (item: MatrizComunicacion) => (
                <span className="text-sm">
                  {item.responsable_nombre || <span className="text-gray-400">Sin asignar</span>}
                </span>
              ),
            },
            {
              key: 'obligatoria',
              header: 'Oblig.',
              align: 'center' as const,
              render: (item: MatrizComunicacion) =>
                item.es_obligatoria ? (
                  <Tooltip content="Comunicación obligatoria">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                  </Tooltip>
                ) : (
                  <span className="text-gray-300">-</span>
                ),
            },
            {
              key: 'acciones',
              header: 'Acciones',
              align: 'right' as const,
              render: (item: MatrizComunicacion) => (
                <div className="flex items-center justify-end gap-1">
                  {canEdit && (
                    <Tooltip content="Editar">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Tooltip>
                  )}
                  {canDelete && (
                    <Tooltip content="Eliminar">
                      <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(item)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </Tooltip>
                  )}
                </div>
              ),
            },
          ]}
          data={items}
          pagination={{
            currentPage: filters.page || 1,
            totalItems: totalCount,
            pageSize: filters.page_size || 10,
            onPageChange: (page) => setFilters({ ...filters, page }),
          }}
        />
      )}

      {/* Confirm delete */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Eliminar Registro"
        message={`¿Eliminar la comunicación con "${deleteConfirm?.parte_interesada_nombre}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        isLoading={isDeleting}
      />

      {/* Form modal */}
      <MatrizFormModal item={selectedItem} isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
};
