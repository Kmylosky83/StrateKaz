/**
 * RolesAdicionalesSubTab - Gestión de roles adicionales (RBAC Híbrido)
 *
 * Permite crear, editar y asignar roles adicionales como:
 * - Legales: COPASST, Brigadista, COCOLA
 * - Sistema de Gestión: Auditor ISO, Responsable Ambiental
 * - Operativos: Aprobadores, Supervisores temporales
 */
import { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  UserPlus,
  Shield,
  Award,
  Loader2,
  ChevronDown,
  ChevronRight,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { BaseModal } from '@/components/modals/BaseModal';
import { StatsGrid, StatsGridSkeleton } from '@/components/layout';
import type { StatItem } from '@/components/layout';
import { Textarea } from '@/components/forms/Textarea';
import {
  TipoRol,
  TIPO_ROL_OPTIONS,
  PLANTILLAS_ROLES,
  PlantillaRol,
} from '../organizacion/roles/types';
import {
  useRolesAdicionales,
  useCreateRolAdicional,
  useUpdateRolAdicional,
  useDeleteRolAdicional,
  useCreateRolFromPlantilla,
  usePlantillasRoles,
  useAsignarRolUsuario,
  useToggleRolActivo,
} from '../../hooks/useRolesPermisos';
import { useUsers } from '@/features/users/hooks/useUsers';

// Tipo para rol desde API (adaptar a la respuesta real del backend)
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

// ==================== HELPERS ====================

// Mapeo de tipos de rol de API a frontend
const TIPO_ROL_MAP: Record<string, { label: string; color: string }> = {
  LEGAL_OBLIGATORIO: { label: 'Legal Obligatorio', color: 'red' },
  SISTEMA_GESTION: { label: 'Sistema de Gestión', color: 'green' },
  OPERATIVO: { label: 'Operativo', color: 'blue' },
  CUSTOM: { label: 'Personalizado', color: 'purple' },
  // Tipos del frontend original
  LEGAL: { label: 'Legal / Normativo', color: 'red' },
  ADMINISTRATIVO: { label: 'Administrativo', color: 'purple' },
  TECNICO: { label: 'Técnico', color: 'orange' },
  ESTRATEGICO: { label: 'Estratégico', color: 'indigo' },
};

const getTipoRolConfig = (tipo: string) => {
  const config = TIPO_ROL_MAP[tipo] || { label: tipo, color: 'gray' };
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return {
    label: config.label,
    color: colors[config.color],
  };
};

// ==================== COMPONENTES ====================

interface PlantillaRolCardProps {
  plantilla: PlantillaRol;
  onUse: (plantilla: PlantillaRol) => void;
}

const PlantillaRolCard = ({ plantilla, onUse }: PlantillaRolCardProps) => {
  const tipoConfig = getTipoRolConfig(plantilla.tipo_rol);

  return (
    <div className="p-4 border rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`h-8 w-8 rounded-lg flex items-center justify-center ${tipoConfig.color}`}
          >
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{plantilla.name}</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full ${tipoConfig.color}`}>
              {tipoConfig.label}
            </span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onUse(plantilla)}>
          Usar
        </Button>
      </div>
      <p className="text-sm text-gray-500 mb-2">{plantilla.description}</p>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>{plantilla.permission_codes.length} permisos</span>
        {plantilla.requiere_certificacion && (
          <span className="flex items-center gap-1 text-amber-600">
            <Award className="h-3 w-3" />
            Requiere certificación
          </span>
        )}
      </div>
    </div>
  );
};

// Tipos de rol disponibles en el backend
const TIPOS_ROL_API = [
  { value: 'LEGAL_OBLIGATORIO', label: 'Legal Obligatorio' },
  { value: 'SISTEMA_GESTION', label: 'Sistema de Gestión' },
  { value: 'OPERATIVO', label: 'Operativo' },
  { value: 'CUSTOM', label: 'Personalizado' },
];

interface RolAdicionalModalProps {
  rol?: RolAdicionalAPI | null;
  plantilla?: PlantillaRol | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  isLoading?: boolean;
}

const RolAdicionalModal = ({
  rol,
  plantilla,
  open,
  onClose,
  onSave,
  isLoading = false,
}: RolAdicionalModalProps) => {
  const isEdit = !!rol;
  const [formData, setFormData] = useState({
    code: rol?.code || plantilla?.code || '',
    nombre: rol?.nombre || plantilla?.name || '',
    descripcion: rol?.descripcion || plantilla?.description || '',
    tipo: rol?.tipo || 'OPERATIVO',
    requiere_certificacion: rol?.requiere_certificacion || plantilla?.requiere_certificacion || false,
    certificacion_requerida: rol?.certificacion_requerida || plantilla?.certificacion_requerida || '',
    is_active: rol?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <BaseModal
      isOpen={open}
      onClose={onClose}
      title={isEdit ? 'Editar Rol Adicional' : 'Crear Rol Adicional'}
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
          options={TIPOS_ROL_API}
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
            <span className="text-sm text-gray-700">
              Requiere certificación para ocupar el rol
            </span>
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
    </BaseModal>
  );
};

interface AsignarUsuarioModalProps {
  rol: RolAdicionalAPI;
  open: boolean;
  onClose: () => void;
  onAssign: (data: any) => void;
  isLoading?: boolean;
}

const AsignarUsuarioModal = ({
  rol,
  open,
  onClose,
  onAssign,
  isLoading = false,
}: AsignarUsuarioModalProps) => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [justificacion, setJustificacion] = useState('');
  const [fechaExpiracion, setFechaExpiracion] = useState('');
  const [fechaCertificacion, setFechaCertificacion] = useState('');
  const [certificacionExpira, setCertificacionExpira] = useState('');

  // Cargar usuarios desde API
  const { data: usersData, isLoading: loadingUsers } = useUsers();
  const users = usersData?.results || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    await onAssign({
      user_id: selectedUserId,
      rol_adicional_id: rol.id,
      justificacion: justificacion || undefined,
      expires_at: fechaExpiracion || null,
      fecha_certificacion: fechaCertificacion || null,
      certificacion_expira: certificacionExpira || null,
    });
  };

  return (
    <BaseModal
      isOpen={open}
      onClose={onClose}
      title={`Asignar: ${rol.nombre}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info del rol */}
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

        {/* Selección de usuario */}
        <Select
          label="Usuario a asignar"
          value={selectedUserId?.toString() || ''}
          onChange={(e) => setSelectedUserId(parseInt(e.target.value))}
          options={[
            { value: '', label: loadingUsers ? 'Cargando usuarios...' : 'Seleccionar usuario...' },
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

        {/* Certificación */}
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
    </BaseModal>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================

export const RolesAdicionalesSubTab = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [showPlantillas, setShowPlantillas] = useState(true);

  // Modals
  const [isRolModalOpen, setIsRolModalOpen] = useState(false);
  const [isAsignarModalOpen, setIsAsignarModalOpen] = useState(false);
  const [selectedRol, setSelectedRol] = useState<RolAdicionalAPI | null>(null);
  const [selectedPlantilla, setSelectedPlantilla] = useState<PlantillaRol | null>(null);

  // API Queries
  const {
    data: rolesData,
    isLoading: loadingRoles,
    error: rolesError,
    refetch: refetchRoles
  } = useRolesAdicionales({
    search: searchQuery || undefined,
    tipo_rol: tipoFilter as any || undefined,
  });

  const { data: plantillasAPI } = usePlantillasRoles();

  // Mutations
  const createRol = useCreateRolAdicional();
  const updateRol = useUpdateRolAdicional();
  const deleteRol = useDeleteRolAdicional();
  const createFromPlantilla = useCreateRolFromPlantilla();
  const asignarRol = useAsignarRolUsuario();
  const toggleActivo = useToggleRolActivo();

  // Obtener roles de la API o usar array vacío
  const roles: RolAdicionalAPI[] = useMemo(() => {
    if (!rolesData) return [];
    // La API puede devolver { results: [...], count: N } o directamente [...]
    return Array.isArray(rolesData) ? rolesData : (rolesData.results || []);
  }, [rolesData]);

  // Usar plantillas de API o las locales como fallback
  const plantillas = plantillasAPI || PLANTILLAS_ROLES;

  // Filtrar roles localmente (búsqueda adicional si la API no la soporta)
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

  // Calcular estadísticas para StatsGrid
  const roleStats: StatItem[] = useMemo(() => {
    const activos = roles.filter((r) => r.is_active).length;
    const conCertificacion = roles.filter((r) => r.requiere_certificacion).length;
    const totalUsuarios = roles.reduce((sum, r) => sum + (r.usuarios_count || 0), 0);
    const totalPermisos = roles.reduce((sum, r) => sum + (r.permisos_count || 0), 0);

    return [
      { label: 'Total Roles', value: roles.length, icon: Shield, iconColor: 'primary' as const },
      { label: 'Roles Activos', value: activos, icon: Users, iconColor: 'success' as const },
      { label: 'Con Certificación', value: conCertificacion, icon: Award, iconColor: 'warning' as const, description: 'Requieren certificado' },
      { label: 'Usuarios Asignados', value: totalUsuarios, icon: Users, iconColor: 'info' as const },
    ];
  }, [roles]);

  const handleCreateFromPlantilla = (plantilla: PlantillaRol) => {
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

  const handleDelete = async (rol: RolAdicionalAPI) => {
    if (rol.usuarios_count > 0) {
      return; // No permitir eliminar roles con usuarios asignados
    }
    if (confirm(`¿Está seguro de eliminar el rol "${rol.nombre}"?`)) {
      await deleteRol.mutateAsync(rol.id);
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

  const isMutating = createRol.isPending || updateRol.isPending || asignarRol.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Roles Adicionales
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Roles transversales que se asignan además del cargo principal (COPASST,
            Brigadista, Auditor, etc.)
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedRol(null);
            setSelectedPlantilla(null);
            setIsRolModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Crear Rol
        </Button>
      </div>

      {/* Estadísticas */}
      {loadingRoles ? (
        <StatsGridSkeleton columns={4} />
      ) : (
        <StatsGrid stats={roleStats} columns={4} macroprocessColor="purple" />
      )}

      {/* Plantillas sugeridas */}
      <Card className="overflow-hidden">
        <div
          className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 cursor-pointer"
          onClick={() => setShowPlantillas(!showPlantillas)}
        >
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-500" />
            <h4 className="font-medium text-gray-900">Plantillas Sugeridas</h4>
            <Badge variant="secondary">{PLANTILLAS_ROLES.length}</Badge>
          </div>
          {showPlantillas ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
        </div>

        {showPlantillas && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PLANTILLAS_ROLES.slice(0, 6).map((plantilla) => (
              <PlantillaRolCard
                key={plantilla.code}
                plantilla={plantilla}
                onUse={handleCreateFromPlantilla}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nombre o código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-gray-400" />}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              options={[
                { value: '', label: 'Todos los tipos' },
                ...TIPOS_ROL_API,
              ]}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => refetchRoles()}
            disabled={loadingRoles}
          >
            <RefreshCw className={`h-4 w-4 ${loadingRoles ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </Card>

      {/* Error state */}
      {rolesError && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700">Error al cargar los roles. Por favor, intente de nuevo.</p>
        </Card>
      )}

      {/* Tabla de roles */}
      <Card>
        {loadingRoles ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-500">Cargando roles...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Certificación
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permisos
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuarios
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRoles.map((rol) => {
                    const tipoConfig = getTipoRolConfig(rol.tipo);
                    return (
                      <tr key={rol.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {rol.nombre}
                              </span>
                              {rol.is_system && (
                                <Badge variant="outline" className="text-xs">
                                  Sistema
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{rol.code}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${tipoConfig.color}`}
                          >
                            {rol.tipo_display || tipoConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {rol.requiere_certificacion ? (
                            <div className="flex flex-col items-center">
                              <Award className="h-4 w-4 text-amber-500" />
                              <span className="text-xs text-gray-500 mt-1">
                                Requerida
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <Badge variant="secondary">
                            {rol.permisos_count}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                            <Users className="h-4 w-4" />
                            {rol.usuarios_count}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => handleToggleActivo(rol)}
                            disabled={toggleActivo.isPending}
                          >
                            {rol.is_active ? (
                              <Badge variant="success">Activo</Badge>
                            ) : (
                              <Badge variant="secondary">Inactivo</Badge>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-1">
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
                              title="Editar rol"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            {!rol.is_system && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                                title="Eliminar rol"
                                disabled={rol.usuarios_count > 0 || deleteRol.isPending}
                                onClick={() => handleDelete(rol)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredRoles.length === 0 && !loadingRoles && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron roles
                </h3>
                <p className="text-gray-500 mb-4">
                  Crea un nuevo rol o usa una plantilla sugerida.
                </p>
                <Button
                  onClick={() => {
                    setSelectedRol(null);
                    setSelectedPlantilla(null);
                    setIsRolModalOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Rol
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Modal crear/editar rol */}
      <RolAdicionalModal
        rol={selectedRol}
        plantilla={selectedPlantilla}
        open={isRolModalOpen}
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
          open={isAsignarModalOpen}
          onClose={() => {
            setIsAsignarModalOpen(false);
            setSelectedRol(null);
          }}
          onAssign={handleAssignUser}
          isLoading={asignarRol.isPending}
        />
      )}
    </div>
  );
};
