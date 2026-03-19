/**
 * Seccion de Empresas (Tenants) - Admin Global
 *
 * Lista, crea, edita y gestiona tenants de la plataforma.
 * Hard delete (eliminacion permanente) solo disponible para superadmin.
 * Muestra progreso de creacion asincrona de tenants.
 */
import { useState, useMemo, useEffect, forwardRef } from 'react';
import { DEFAULT_TENANT_COLORS } from '@/constants/defaults';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Users,
  Calendar,
  HardDrive,
  CheckCircle,
  XCircle,
  AlertTriangle,
  LogIn,
  AlertCircle,
  Loader2,
  Eye,
  LayoutGrid,
  List,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button, BrandedSkeleton, Dropdown } from '@/components/common';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import type { BadgeVariant } from '@/components/common/Badge';
import {
  useTenantsList,
  useToggleTenantActive,
  useHardDeleteTenant,
} from '../hooks/useAdminGlobal';
import { useAuthStore } from '@/store/authStore';
import { TenantFormModal } from './TenantFormModal';
import { TenantCreationProgress } from './TenantCreationProgress';
import type { Tenant } from '../types';

// Colores para los tiers - mapeados a BadgeVariant validos
const TIER_COLORS: Record<string, BadgeVariant> = {
  starter: 'gray',
  small: 'info',
  medium: 'success',
  large: 'warning',
  enterprise: 'accent',
};

const TIER_LABELS: Record<string, string> = {
  starter: 'Starter',
  small: 'Pequena',
  medium: 'Mediana',
  large: 'Grande',
  enterprise: 'Enterprise',
};

interface TenantCardProps {
  tenant: Tenant;
  onEdit: (tenant: Tenant) => void;
  onToggle: (id: number) => void;
  onHardDelete: (tenant: Tenant) => void;
  onEnter: (tenant: Tenant) => void;
  onViewAsUser: (tenant: Tenant) => void;
  onViewProgress: (tenant: Tenant) => void;
  isSuperadmin: boolean;
}

const TenantCard = forwardRef<HTMLDivElement, TenantCardProps>(
  (
    { tenant, onEdit, onToggle, onHardDelete, onEnter, onViewAsUser, onViewProgress, isSuperadmin },
    ref
  ) => {
    const isReady = !tenant.schema_status || tenant.schema_status === 'ready';
    const isCreating = tenant.schema_status === 'creating' || tenant.schema_status === 'pending';
    const isFailed = tenant.schema_status === 'failed';

    const statusColor: BadgeVariant = tenant.is_active
      ? tenant.is_subscription_valid
        ? 'success'
        : 'warning'
      : 'gray';

    const statusText = tenant.is_active
      ? tenant.is_subscription_valid
        ? 'Activo'
        : 'Suscripcion Vencida'
      : 'Inactivo';

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card
          className="p-4 hover:shadow-md transition-shadow relative group"
          style={{ borderColor: tenant.primary_color || DEFAULT_TENANT_COLORS.primary }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Logo o inicial */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: tenant.primary_color || DEFAULT_TENANT_COLORS.primary }}
              >
                {tenant.logo || tenant.logo_url ? (
                  <img
                    src={tenant.logo || tenant.logo_url}
                    alt={tenant.name}
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  tenant.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{tenant.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {tenant.primary_domain ||
                    `${tenant.subdomain}.${import.meta.env.VITE_BASE_DOMAIN || 'stratekaz.com'}`}
                </p>
              </div>
            </div>

            {/* Menu */}
            <Dropdown
              items={[
                // Opciones de acceso al tenant - Solo si esta activo y schema ready
                ...(tenant.is_active && isReady
                  ? [
                      {
                        label: 'Ver como usuario',
                        icon: <Eye className="h-4 w-4" />,
                        onClick: () => onViewAsUser(tenant),
                      },
                      {
                        label: 'Administrar empresa',
                        icon: <LogIn className="h-4 w-4" />,
                        onClick: () => onEnter(tenant),
                      },
                    ]
                  : []),
                // Ver progreso de creacion - Solo si no esta ready
                ...(!isReady
                  ? [
                      {
                        label: 'Ver progreso',
                        icon: <Eye className="h-4 w-4" />,
                        onClick: () => onViewProgress(tenant),
                      },
                    ]
                  : []),
                {
                  label: 'Editar',
                  icon: <Edit className="h-4 w-4" />,
                  onClick: () => onEdit(tenant),
                },
                ...(isReady
                  ? [
                      {
                        label: tenant.is_active ? 'Desactivar' : 'Activar',
                        icon: tenant.is_active ? (
                          <ToggleLeft className="h-4 w-4" />
                        ) : (
                          <ToggleRight className="h-4 w-4" />
                        ),
                        onClick: () => onToggle(tenant.id),
                      },
                    ]
                  : []),
                // Hard delete: solo superadmin
                ...(isSuperadmin
                  ? [
                      { label: '', onClick: () => {}, divider: true },
                      {
                        label: 'Eliminar permanentemente',
                        icon: <Trash2 className="h-4 w-4" />,
                        onClick: () => onHardDelete(tenant),
                        variant: 'danger' as const,
                      },
                    ]
                  : []),
              ]}
              align="right"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            {/* Schema status badges */}
            {isCreating && (
              <Badge variant="info" size="sm" className="animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Creando...
              </Badge>
            )}
            {isFailed && (
              <Badge variant="danger" size="sm">
                <AlertCircle className="h-3 w-3 mr-1" />
                Error en creacion
              </Badge>
            )}
            {isReady && (
              <Badge variant={statusColor} size="sm">
                {statusText}
              </Badge>
            )}
            <Badge variant={TIER_COLORS[tenant.tier] || 'gray'} size="sm">
              {TIER_LABELS[tenant.tier] || tenant.tier}
            </Badge>
            {tenant.is_trial && (
              <Badge variant="warning" size="sm">
                Trial
              </Badge>
            )}
            {tenant.plan_name && (
              <Badge variant="accent" size="sm">
                {tenant.plan_name}
              </Badge>
            )}
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Users className="h-3.5 w-3.5" />
              <span>
                {tenant.user_count || 0} / {tenant.max_users} usuarios
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <HardDrive className="h-3.5 w-3.5" />
              <span>{tenant.max_storage_gb} GB</span>
            </div>
            {tenant.subscription_ends_at && (
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 col-span-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>Vence: {new Date(tenant.subscription_ends_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* NIT si existe */}
          {tenant.nit && <p className="text-xs text-gray-400 mt-2">NIT: {tenant.nit}</p>}
        </Card>
      </motion.div>
    );
  }
);

TenantCard.displayName = 'TenantCard';

export const TenantsSection = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [tenantToEdit, setTenantToEdit] = useState<Tenant | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);

  // Hard delete state
  const [tenantToHardDelete, setTenantToHardDelete] = useState<Tenant | null>(null);
  const [hardDeleteConfirmName, setHardDeleteConfirmName] = useState('');

  // Progreso de creacion de tenant
  const [progressTenant, setProgressTenant] = useState<{ id: number; name: string } | null>(null);

  // Toggle cards/table con persistencia en localStorage
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(
    () => (localStorage.getItem('admin_tenants_view') || 'cards') as 'cards' | 'table'
  );

  useEffect(() => {
    localStorage.setItem('admin_tenants_view', viewMode);
  }, [viewMode]);

  // Obtener funciones del authStore
  const startImpersonation = useAuthStore((state) => state.startImpersonation);
  const setPendingUserSelection = useAuthStore((state) => state.setPendingUserSelection);
  const isSuperadmin = useAuthStore((state) => state.isSuperadmin);

  const { data: tenants, isLoading } = useTenantsList({
    search: search || undefined,
    is_active: filterActive,
  });

  const toggleActive = useToggleTenantActive();
  const hardDeleteTenant = useHardDeleteTenant();
  const refreshTenantProfile = useAuthStore((state) => state.refreshTenantProfile);

  // Filtrar localmente para busqueda instantanea
  const filteredTenants = useMemo(() => {
    if (!tenants) return [];
    if (!search) return tenants;

    const searchLower = search.toLowerCase();
    return tenants.filter(
      (t) =>
        t.name.toLowerCase().includes(searchLower) ||
        t.code.toLowerCase().includes(searchLower) ||
        t.subdomain.toLowerCase().includes(searchLower) ||
        (t.nit && t.nit.includes(search))
    );
  }, [tenants, search]);

  // Stats para contadores
  const creatingCount =
    tenants?.filter((t) => t.schema_status === 'creating' || t.schema_status === 'pending')
      .length ?? 0;
  const failedCount = tenants?.filter((t) => t.schema_status === 'failed').length ?? 0;

  const handleToggle = (id: number) => {
    toggleActive.mutate(id);
  };

  const handleHardDelete = () => {
    if (tenantToHardDelete && hardDeleteConfirmName === tenantToHardDelete.name) {
      hardDeleteTenant.mutate(
        { id: tenantToHardDelete.id, confirmName: hardDeleteConfirmName },
        {
          onSuccess: () => {
            setTenantToHardDelete(null);
            setHardDeleteConfirmName('');
            refreshTenantProfile();
          },
        }
      );
    }
  };

  const handleOpenNewTenant = () => {
    setTenantToEdit(null);
    setShowFormModal(true);
  };

  const handleEditTenant = (tenant: Tenant) => {
    setTenantToEdit(tenant);
    setShowFormModal(true);
  };

  /**
   * Entrar a una empresa como administrador (badge amarillo).
   * Usa selectTenant internamente (llama backend + invalida queries + recarga perfil).
   */
  const handleEnterTenant = async (tenant: Tenant) => {
    await startImpersonation(tenant.id);
    navigate('/dashboard');
  };

  /**
   * Ver como usuario: entra al tenant y navega al dashboard.
   * El flag pendingUserSelection hace que DashboardLayout abra el modal
   * de selección de usuario automáticamente.
   */
  const handleViewAsUser = async (tenant: Tenant) => {
    await startImpersonation(tenant.id);
    setPendingUserSelection(true);
    navigate('/dashboard');
  };

  const handleViewProgress = (tenant: Tenant) => {
    setProgressTenant({ id: tenant.id, name: tenant.name });
  };

  const handleProgressClose = () => {
    setProgressTenant(null);
    refreshTenantProfile();
  };

  const handleCreationStarted = (id: number, name: string) => {
    setProgressTenant({ id, name });
  };

  const handleCloseModal = () => {
    setShowFormModal(false);
    setTenantToEdit(null);
  };

  if (isLoading) {
    return <BrandedSkeleton height="h-96" logoSize="xl" showText />;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="w-full sm:w-80">
          <Input
            type="text"
            placeholder="Buscar empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex gap-2">
          {/* Filter by status */}
          <Select
            value={filterActive === undefined ? 'all' : filterActive ? 'active' : 'inactive'}
            onChange={(e) => {
              const val = e.target.value;
              setFilterActive(val === 'all' ? undefined : val === 'active');
            }}
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'active', label: 'Activos' },
              { value: 'inactive', label: 'Inactivos' },
            ]}
          />

          {/* Toggle Cards/Table */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
            title={viewMode === 'cards' ? 'Vista tabla' : 'Vista tarjetas'}
          >
            {viewMode === 'cards' ? (
              <List className="h-4 w-4" />
            ) : (
              <LayoutGrid className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="primary"
            className="flex items-center gap-2"
            onClick={handleOpenNewTenant}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva Empresa</span>
          </Button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <CheckCircle className="h-4 w-4 text-green-500" />
          {tenants?.filter((t) => t.is_active && t.is_subscription_valid).length || 0} activos
        </span>
        <span className="flex items-center gap-1">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          {tenants?.filter((t) => t.is_active && !t.is_subscription_valid).length || 0} por vencer
        </span>
        <span className="flex items-center gap-1">
          <XCircle className="h-4 w-4 text-gray-400" />
          {tenants?.filter((t) => !t.is_active).length || 0} inactivos
        </span>
        {creatingCount > 0 && (
          <span className="flex items-center gap-1">
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            {creatingCount} creandose
          </span>
        )}
        {failedCount > 0 && (
          <span className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4 text-red-500" />
            {failedCount} con error
          </span>
        )}
      </div>

      {/* Contenido: Cards o Tabla */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredTenants.map((tenant) => (
              <TenantCard
                key={tenant.id}
                tenant={tenant}
                onEdit={handleEditTenant}
                onToggle={handleToggle}
                onHardDelete={setTenantToHardDelete}
                onEnter={handleEnterTenant}
                onViewAsUser={handleViewAsUser}
                onViewProgress={handleViewProgress}
                isSuperadmin={isSuperadmin}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                    Empresa
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 hidden md:table-cell">
                    Subdominio
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                    Plan
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                    Tier
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                    Usuarios
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                    Estado
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTenants.map((tenant) => {
                  const isReady = !tenant.schema_status || tenant.schema_status === 'ready';
                  const isCreating =
                    tenant.schema_status === 'creating' || tenant.schema_status === 'pending';
                  const isFailed = tenant.schema_status === 'failed';

                  const statusColor: BadgeVariant = isCreating
                    ? 'info'
                    : isFailed
                      ? 'danger'
                      : tenant.is_active
                        ? tenant.is_subscription_valid
                          ? 'success'
                          : 'warning'
                        : 'gray';

                  const statusText = isCreating
                    ? 'Creando...'
                    : isFailed
                      ? 'Error'
                      : tenant.is_active
                        ? tenant.is_subscription_valid
                          ? 'Activo'
                          : 'Vencido'
                        : 'Inactivo';

                  return (
                    <tr
                      key={tenant.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
                      onClick={() => handleEditTenant(tenant)}
                    >
                      {/* Empresa */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{
                              backgroundColor:
                                tenant.primary_color || DEFAULT_TENANT_COLORS.primary,
                            }}
                          >
                            {tenant.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {tenant.name}
                            </p>
                            {tenant.nit && (
                              <p className="text-xs text-gray-400 truncate">NIT: {tenant.nit}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Subdominio */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-gray-600 dark:text-gray-400 text-xs">
                          {tenant.primary_domain || `${tenant.subdomain}.stratekaz.com`}
                        </span>
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {tenant.plan_name ? (
                          <Badge variant="accent" size="sm">
                            {tenant.plan_name}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">Sin plan</span>
                        )}
                      </td>

                      {/* Tier */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge variant={TIER_COLORS[tenant.tier] || 'gray'} size="sm">
                          {TIER_LABELS[tenant.tier] || tenant.tier}
                        </Badge>
                      </td>

                      {/* Usuarios */}
                      <td className="px-4 py-3 text-center">
                        <span className="text-gray-700 dark:text-gray-300">
                          {tenant.user_count || 0}
                          <span className="text-gray-400">/{tenant.max_users}</span>
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3 text-center">
                        <Badge variant={statusColor} size="sm">
                          {isCreating && <Loader2 className="h-3 w-3 animate-spin mr-1 inline" />}
                          {statusText}
                        </Badge>
                        {tenant.is_trial && (
                          <Badge variant="warning" size="sm" className="ml-1">
                            Trial
                          </Badge>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <Dropdown
                          items={[
                            ...(tenant.is_active && isReady
                              ? [
                                  {
                                    label: 'Ver como usuario',
                                    icon: <Eye className="h-4 w-4" />,
                                    onClick: () => handleViewAsUser(tenant),
                                  },
                                  {
                                    label: 'Administrar empresa',
                                    icon: <LogIn className="h-4 w-4" />,
                                    onClick: () => handleEnterTenant(tenant),
                                  },
                                ]
                              : []),
                            ...(!isReady
                              ? [
                                  {
                                    label: 'Ver progreso',
                                    icon: <Eye className="h-4 w-4" />,
                                    onClick: () => handleViewProgress(tenant),
                                  },
                                ]
                              : []),
                            {
                              label: 'Editar',
                              icon: <Edit className="h-4 w-4" />,
                              onClick: () => handleEditTenant(tenant),
                            },
                            ...(isReady
                              ? [
                                  {
                                    label: tenant.is_active ? 'Desactivar' : 'Activar',
                                    icon: tenant.is_active ? (
                                      <ToggleLeft className="h-4 w-4" />
                                    ) : (
                                      <ToggleRight className="h-4 w-4" />
                                    ),
                                    onClick: () => handleToggle(tenant.id),
                                  },
                                ]
                              : []),
                            ...(isSuperadmin
                              ? [
                                  { label: '', onClick: () => {}, divider: true },
                                  {
                                    label: 'Eliminar permanentemente',
                                    icon: <Trash2 className="h-4 w-4" />,
                                    onClick: () => setTenantToHardDelete(tenant),
                                    variant: 'danger' as const,
                                  },
                                ]
                              : []),
                          ]}
                          align="right"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {filteredTenants.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {search ? 'No se encontraron empresas con ese criterio' : 'No hay empresas registradas'}
          </p>
          {!search && (
            <Button variant="primary" className="mt-4" onClick={handleOpenNewTenant}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primera empresa
            </Button>
          )}
        </div>
      )}

      {/* Hard Delete Confirmation Dialog */}
      <BaseModal
        isOpen={!!tenantToHardDelete}
        onClose={() => {
          setTenantToHardDelete(null);
          setHardDeleteConfirmName('');
        }}
        title="Eliminar empresa permanentemente"
        size="sm"
        showCloseButton={false}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 rounded-full p-3 bg-danger-100 dark:bg-danger-900/30">
              <AlertCircle className="h-6 w-6 text-danger-600 dark:text-danger-400" />
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Esta accion es <strong className="text-danger-600">IRREVERSIBLE</strong>. Se
                eliminara:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc list-inside space-y-1">
                <li>Schema de base de datos y todos los datos</li>
                <li>Usuarios y permisos asociados</li>
                <li>Dominios configurados</li>
                <li>Registro de la empresa</li>
              </ul>
              <div className="pt-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Escriba <strong className="text-danger-600">"{tenantToHardDelete?.name}"</strong>{' '}
                  para confirmar:
                </p>
                <Input
                  value={hardDeleteConfirmName}
                  onChange={(e) => setHardDeleteConfirmName(e.target.value)}
                  placeholder={tenantToHardDelete?.name}
                  autoFocus
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setTenantToHardDelete(null);
                setHardDeleteConfirmName('');
              }}
              disabled={hardDeleteTenant.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleHardDelete}
              isLoading={hardDeleteTenant.isPending}
              disabled={hardDeleteConfirmName !== tenantToHardDelete?.name}
            >
              Eliminar permanentemente
            </Button>
          </div>
        </div>
      </BaseModal>

      {/* Tenant Form Modal */}
      <TenantFormModal
        isOpen={showFormModal}
        onClose={handleCloseModal}
        tenant={tenantToEdit}
        onCreationStarted={handleCreationStarted}
      />

      {/* Tenant Creation Progress Modal */}
      {progressTenant && (
        <TenantCreationProgress
          tenantId={progressTenant.id}
          tenantName={progressTenant.name}
          onComplete={handleProgressClose}
          onClose={handleProgressClose}
        />
      )}
    </div>
  );
};

export default TenantsSection;
