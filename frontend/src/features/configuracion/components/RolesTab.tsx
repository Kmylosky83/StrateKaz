/**
 * Tab de gestión de Roles (RBAC Híbrido) - COMPONENTE LEGACY
 *
 * IMPORTANTE: Este componente NO se usa actualmente en la aplicación.
 * La funcionalidad de roles está implementada en:
 * - gestion-estrategica/components/rbac/RolesPermisosWrapper.tsx (wrapper con subtabs)
 * - gestion-estrategica/components/rbac/RolesAdicionalesSubTab.tsx (gestión completa)
 *
 * Este archivo se mantiene por compatibilidad y referencia histórica.
 * Se exporta en configuracion/index.ts pero no se importa en ningún componente activo.
 *
 * Contenido original:
 * - Plantillas sugeridas (roles predefinidos)
 * - Tabla de roles adicionales existentes
 * - CRUD de roles
 */
import { useState, useMemo } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Shield,
  ShieldCheck,
  Award,
  ChevronDown,
  ChevronRight,
  UserPlus,
  RefreshCw,
  Loader2,
  FileText,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Alert } from '@/components/common/Alert';
import { Card } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { FilterCard } from '@/components/layout/FilterCard';
import { DataTableCard, TableSkeleton } from '@/components/layout/DataTableCard';
import {
  useRolesAdicionales,
  useCreateRolAdicional,
  useUpdateRolAdicional,
  useDeleteRolAdicional,
  usePlantillasRoles,
  useToggleRolActivo,
  useAsignarRolUsuario,
} from '@/features/gestion-estrategica/hooks/useRolesPermisos';
import { useUsers } from '@/features/users/hooks/useUsers';

// ==================== TYPES ====================

interface RolAdicionalAPI {
  id: number;
  code: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  tipo_display: string;
  justificacion_legal: string | null;
  requiere_certificacion: boolean;
  certificacion_requerida: string | null;
  is_system: boolean;
  is_active: boolean;
  permisos_count: number;
  usuarios_count: number;
  created_by_nombre: string | null;
  created_at: string;
  updated_at: string;
}

interface PlantillaSugerida {
  code: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  tipo_display: string;
  justificacion_legal: string;
  requiere_certificacion: boolean;
  certificacion_requerida: string;
  permisos_sugeridos: string[];
  ya_existe: boolean;
}

// ==================== CONSTANTS ====================

const TIPOS_ROL = [
  { value: 'LEGAL_OBLIGATORIO', label: 'Legal Obligatorio' },
  { value: 'SISTEMA_GESTION', label: 'Sistema de Gestión' },
  { value: 'OPERATIVO', label: 'Operativo' },
  { value: 'CUSTOM', label: 'Personalizado' },
];

const TIPO_ROL_COLORS: Record<string, string> = {
  LEGAL_OBLIGATORIO: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  SISTEMA_GESTION: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  OPERATIVO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CUSTOM: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

// ==================== PLANTILLA CARD ====================

interface PlantillaCardProps {
  plantilla: PlantillaSugerida;
  onUse: (plantilla: PlantillaSugerida) => void;
}

const PlantillaCard = ({ plantilla, onUse }: PlantillaCardProps) => {
  const tipoColor = TIPO_ROL_COLORS[plantilla.tipo] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';

  return (
    <Card
      variant="bordered"
      padding="sm"
      className={`transition-all ${
        plantilla.ya_existe
          ? 'opacity-60 cursor-not-allowed'
          : 'hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-sm cursor-pointer'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100">{plantilla.nombre}</h4>
          <span className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${tipoColor}`}>
            {plantilla.tipo_display}
          </span>
        </div>
        {!plantilla.ya_existe && (
          <Button variant="ghost" size="sm" onClick={() => onUse(plantilla)}>
            Usar
          </Button>
        )}
        {plantilla.ya_existe && (
          <Badge variant="gray" size="sm">
            Ya existe
          </Badge>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{plantilla.descripcion}</p>
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span>{plantilla.permisos_sugeridos?.length || 0} permisos</span>
        {plantilla.requiere_certificacion && (
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <Award className="h-3 w-3" />
            Requiere certificación
          </span>
        )}
      </div>
    </Card>
  );
};

// ==================== ROL MODAL ====================

interface RolModalProps {
  rol?: RolAdicionalAPI | null;
  plantilla?: PlantillaSugerida | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  isLoading?: boolean;
}

const RolModal = ({ rol, plantilla, isOpen, onClose, onSave, isLoading }: RolModalProps) => {
  const isEdit = !!rol;
  const [formData, setFormData] = useState({
    code: rol?.code || plantilla?.code || '',
    nombre: rol?.nombre || plantilla?.nombre || '',
    descripcion: rol?.descripcion || plantilla?.descripcion || '',
    tipo: rol?.tipo || plantilla?.tipo || 'OPERATIVO',
    requiere_certificacion:
      rol?.requiere_certificacion || plantilla?.requiere_certificacion || false,
    certificacion_requerida:
      rol?.certificacion_requerida || plantilla?.certificacion_requerida || '',
    is_active: rol?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Editar Rol' : plantilla ? `Crear: ${plantilla.nombre}` : 'Crear Rol'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Código"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="ej: aprobador_compras"
            required
            disabled={isEdit && rol?.is_system}
          />
          <Input
            label="Nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="ej: Aprobador de Compras"
            required
          />
        </div>

        <Textarea
          label="Descripción"
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          placeholder="Describe el propósito y alcance del rol..."
          rows={3}
        />

        <Select
          label="Tipo de Rol"
          value={formData.tipo}
          onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
          options={TIPOS_ROL}
        />

        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.requiere_certificacion}
              onChange={(e) =>
                setFormData({ ...formData, requiere_certificacion: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700">Requiere certificación para ocupar el rol</span>
          </label>

          {formData.requiere_certificacion && (
            <Input
              label="Certificación Requerida"
              value={formData.certificacion_requerida}
              onChange={(e) =>
                setFormData({ ...formData, certificacion_requerida: e.target.value })
              }
              placeholder="ej: Licencia SST 50 horas"
            />
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : isEdit ? (
              'Guardar Cambios'
            ) : (
              'Crear Rol'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ==================== ASIGNAR USUARIO MODAL ====================

interface AsignarUsuarioModalProps {
  rol: RolAdicionalAPI;
  isOpen: boolean;
  onClose: () => void;
  onAssign: (data: any) => void;
  isLoading?: boolean;
}

const AsignarUsuarioModal = ({
  rol,
  isOpen,
  onClose,
  onAssign,
  isLoading,
}: AsignarUsuarioModalProps) => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [justificacion, setJustificacion] = useState('');
  const [fechaExpiracion, setFechaExpiracion] = useState('');
  const [fechaCertificacion, setFechaCertificacion] = useState('');
  const [certificacionExpira, setCertificacionExpira] = useState('');

  const { data: usersData, isLoading: loadingUsers } = useUsers();
  const users = usersData?.results || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    onAssign({
      user_id: selectedUserId,
      rol_adicional_id: rol.id,
      justificacion: justificacion || undefined,
      expires_at: fechaExpiracion || null,
      fecha_certificacion: fechaCertificacion || null,
      certificacion_expira: certificacionExpira || null,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Asignar: ${rol.nombre}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-blue-500" />
            <span className="font-medium">{rol.nombre}</span>
          </div>
          <p className="text-sm text-gray-500">{rol.descripcion}</p>
          {rol.requiere_certificacion && (
            <div className="mt-2 flex items-center gap-2 text-sm text-amber-600">
              <Award className="h-4 w-4" />
              Requiere: {rol.certificacion_requerida}
            </div>
          )}
        </div>

        <Select
          label="Usuario a asignar"
          value={selectedUserId?.toString() || ''}
          onChange={(e) => setSelectedUserId(parseInt(e.target.value))}
          options={[
            {
              value: '',
              label: loadingUsers ? 'Cargando usuarios...' : 'Seleccionar usuario...',
            },
            ...users.map((u: any) => ({
              value: u.id.toString(),
              label: `${u.first_name} ${u.last_name} - ${u.cargo_nombre || 'Sin cargo'}`,
            })),
          ]}
          required
        />

        <Textarea
          label="Justificación"
          value={justificacion}
          onChange={(e) => setJustificacion(e.target.value)}
          placeholder="Razón de la asignación del rol..."
          rows={2}
        />

        <Input
          type="date"
          label="Fecha de expiración (opcional)"
          value={fechaExpiracion}
          onChange={(e) => setFechaExpiracion(e.target.value)}
          helperText="Dejar vacío si el rol no expira"
        />

        {rol.requiere_certificacion && (
          <div className="space-y-3 p-4 border border-amber-200 bg-amber-50 rounded-lg">
            <h4 className="font-medium text-amber-800 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Certificación Requerida
            </h4>
            <Input
              type="date"
              label="Fecha del certificado"
              value={fechaCertificacion}
              onChange={(e) => setFechaCertificacion(e.target.value)}
            />
            <Input
              type="date"
              label="Vencimiento del certificado"
              value={certificacionExpira}
              onChange={(e) => setCertificacionExpira(e.target.value)}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading || !selectedUserId}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Asignando...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Asignar Rol
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ==================== MAIN COMPONENT ====================

export const RolesTab = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [showPlantillas, setShowPlantillas] = useState(true);

  // Modals
  const [isRolModalOpen, setIsRolModalOpen] = useState(false);
  const [isAsignarModalOpen, setIsAsignarModalOpen] = useState(false);
  const [selectedRol, setSelectedRol] = useState<RolAdicionalAPI | null>(null);
  const [selectedPlantilla, setSelectedPlantilla] = useState<PlantillaSugerida | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<RolAdicionalAPI | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // API Queries
  const {
    data: rolesData,
    isLoading: loadingRoles,
    error: rolesError,
    refetch: refetchRoles,
  } = useRolesAdicionales({
    search: searchQuery || undefined,
    tipo_rol: (tipoFilter as any) || undefined,
  });

  const { data: plantillasData, isLoading: loadingPlantillas } = usePlantillasRoles();

  // Mutations
  const createRol = useCreateRolAdicional();
  const updateRol = useUpdateRolAdicional();
  const deleteRol = useDeleteRolAdicional();
  const toggleActivo = useToggleRolActivo();
  const asignarRol = useAsignarRolUsuario();

  // Obtener roles de la API
  const roles: RolAdicionalAPI[] = useMemo(() => {
    if (!rolesData) return [];
    return Array.isArray(rolesData) ? rolesData : rolesData.results || [];
  }, [rolesData]);

  // Plantillas sugeridas
  const plantillas: PlantillaSugerida[] = useMemo(() => {
    if (!plantillasData) return [];
    return Array.isArray(plantillasData) ? plantillasData : [];
  }, [plantillasData]);

  // Filtrar roles
  const filteredRoles = useMemo(() => {
    return roles.filter((rol) => {
      const matchesSearch =
        !searchQuery ||
        rol.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rol.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTipo = !tipoFilter || rol.tipo === tipoFilter;
      return matchesSearch && matchesTipo;
    });
  }, [roles, searchQuery, tipoFilter]);

  // Handlers
  const handleCreate = () => {
    setSelectedRol(null);
    setSelectedPlantilla(null);
    setIsRolModalOpen(true);
  };

  const handleCreateFromPlantilla = (plantilla: PlantillaSugerida) => {
    setSelectedPlantilla(plantilla);
    setSelectedRol(null);
    setIsRolModalOpen(true);
  };

  const handleEdit = (rol: RolAdicionalAPI) => {
    setSelectedRol(rol);
    setSelectedPlantilla(null);
    setIsRolModalOpen(true);
  };

  const handleAsignar = (rol: RolAdicionalAPI) => {
    setSelectedRol(rol);
    setIsAsignarModalOpen(true);
  };

  const handleDeleteRequest = (rol: RolAdicionalAPI) => {
    if (rol.is_system) {
      setAlertMessage('No se puede eliminar un rol del sistema');
      return;
    }
    if (rol.usuarios_count > 0) {
      setAlertMessage(
        `No se puede eliminar el rol porque tiene ${rol.usuarios_count} usuario(s) asignado(s)`
      );
      return;
    }
    setDeleteConfirm(rol);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      await deleteRol.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const handleToggleActivo = async (rol: RolAdicionalAPI) => {
    await toggleActivo.mutateAsync({ id: rol.id, is_active: !rol.is_active });
  };

  const handleSaveRol = async (data: any) => {
    if (selectedRol) {
      await updateRol.mutateAsync({ id: selectedRol.id, data });
    } else {
      await createRol.mutateAsync(data);
    }
    setIsRolModalOpen(false);
    setSelectedRol(null);
    setSelectedPlantilla(null);
  };

  const handleAssignUser = async (data: any) => {
    await asignarRol.mutateAsync(data);
    setIsAsignarModalOpen(false);
    setSelectedRol(null);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setTipoFilter('');
  };

  const activeFiltersCount = [!!tipoFilter].filter(Boolean).length;
  const isEmpty = !loadingRoles && filteredRoles.length === 0;

  if (rolesError) {
    return (
      <Alert
        variant="error"
        title="Error"
        message="Error al cargar los roles. Intente de nuevo."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerta de error */}
      {alertMessage && (
        <Alert
          variant="warning"
          message={alertMessage}
          closable
          onClose={() => setAlertMessage(null)}
        />
      )}

      {/* Plantillas Sugeridas */}
      <Card variant="bordered" padding="none" className="overflow-hidden">
        <div
          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 cursor-pointer"
          onClick={() => setShowPlantillas(!showPlantillas)}
        >
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary-500" />
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Roles Sugeridos</h4>
            {loadingPlantillas ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : (
              <Badge variant="secondary">{plantillas.length}</Badge>
            )}
          </div>
          {showPlantillas ? (
            <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          )}
        </div>

        {showPlantillas && (
          <div className="p-4">
            {loadingPlantillas ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                <span className="ml-2 text-gray-500 dark:text-gray-400">Cargando plantillas...</span>
              </div>
            ) : plantillas.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                No hay plantillas sugeridas disponibles
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plantillas.map((plantilla) => (
                  <PlantillaCard
                    key={plantilla.code}
                    plantilla={plantilla}
                    onUse={handleCreateFromPlantilla}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Filtros */}
      <FilterCard
        searchPlaceholder="Buscar por nombre o código..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        collapsible
        activeFiltersCount={activeFiltersCount}
        hasActiveFilters={activeFiltersCount > 0 || !!searchQuery}
        onClearFilters={handleClearFilters}
      >
        <div className="flex items-center gap-4">
          <Select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            options={[{ value: '', label: 'Todos los tipos' }, ...TIPOS_ROL]}
            className="w-48"
          />
          <Button variant="outline" onClick={() => refetchRoles()} disabled={loadingRoles}>
            <RefreshCw className={`h-4 w-4 ${loadingRoles ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </FilterCard>

      {/* Tabla */}
      <DataTableCard
        isLoading={loadingRoles}
        isEmpty={isEmpty}
        emptyMessage="No se encontraron roles"
        headerActions={
          <Button onClick={handleCreate} variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
            Nuevo Rol
          </Button>
        }
      >
        {loadingRoles ? (
          <TableSkeleton rows={5} columns={7} />
        ) : isEmpty ? (
          <EmptyState
            icon={<ShieldCheck className="h-12 w-12" />}
            title="Sin roles"
            description="No hay roles configurados. Crea uno nuevo o usa una plantilla sugerida."
            action={{
              label: 'Crear Rol',
              onClick: handleCreate,
              icon: <Plus className="h-4 w-4" />,
            }}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Certificación
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permisos
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuarios
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRoles.map((rol) => {
                    const tipoColor = TIPO_ROL_COLORS[rol.tipo] || 'bg-gray-100 text-gray-700';
                    return (
                      <tr key={rol.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {rol.nombre}
                            </span>
                            {rol.is_system && (
                              <Badge variant="gray" size="sm">
                                Sistema
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${tipoColor}`}>
                            {rol.tipo_display}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {rol.requiere_certificacion ? (
                            <div className="flex flex-col items-center">
                              <Award className="h-4 w-4 text-amber-500" />
                              <span className="text-xs text-gray-500 mt-1">Requerida</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                            <Shield className="h-4 w-4" />
                            {rol.permisos_count}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                            <Users className="h-4 w-4" />
                            {rol.usuarios_count}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleToggleActivo(rol)}
                            disabled={toggleActivo.isPending}
                          >
                            {rol.is_active ? (
                              <Badge variant="success">Activo</Badge>
                            ) : (
                              <Badge variant="gray">Inactivo</Badge>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAsignar(rol)}
                              title="Asignar a usuario"
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(rol)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRequest(rol)}
                              disabled={rol.is_system || rol.usuarios_count > 0}
                              title={
                                rol.is_system
                                  ? 'Rol del sistema'
                                  : rol.usuarios_count > 0
                                    ? 'Tiene usuarios asignados'
                                    : 'Eliminar'
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Info de total */}
            {filteredRoles.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 text-center">
                Mostrando {filteredRoles.length} rol(es)
              </div>
            )}
          </>
        )}
      </DataTableCard>

      {/* Modal crear/editar rol */}
      <RolModal
        rol={selectedRol}
        plantilla={selectedPlantilla}
        isOpen={isRolModalOpen}
        onClose={() => {
          setIsRolModalOpen(false);
          setSelectedRol(null);
          setSelectedPlantilla(null);
        }}
        onSave={handleSaveRol}
        isLoading={createRol.isPending || updateRol.isPending}
      />

      {/* Modal asignar usuario */}
      {selectedRol && (
        <AsignarUsuarioModal
          rol={selectedRol}
          isOpen={isAsignarModalOpen}
          onClose={() => {
            setIsAsignarModalOpen(false);
            setSelectedRol(null);
          }}
          onAssign={handleAssignUser}
          isLoading={asignarRol.isPending}
        />
      )}

      {/* Dialog de confirmación de eliminación */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Rol"
        message={`¿Está seguro que desea eliminar el rol "${deleteConfirm?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteRol.isPending}
      />
    </div>
  );
};
