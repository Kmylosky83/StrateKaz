/**
 * Sección de Empresas (Tenants) - Admin Global
 *
 * Lista, crea, edita y gestiona tenants de la plataforma.
 */
import { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Users,
  Calendar,
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  Badge,
  Button,
  ConfirmDialog,
  BrandedSkeleton,
} from '@/components/common';
import type { BadgeVariant } from '@/components/common/Badge';
import { useTenantsList, useToggleTenantActive, useDeleteTenant } from '../hooks/useAdminGlobal';
import { TenantFormModal } from './TenantFormModal';
import type { Tenant } from '../types';

// Colores para los tiers - mapeados a BadgeVariant válidos
const TIER_COLORS: Record<string, BadgeVariant> = {
  starter: 'gray',
  small: 'info',
  medium: 'success',
  large: 'warning',
  enterprise: 'accent',
};

const TIER_LABELS: Record<string, string> = {
  starter: 'Starter',
  small: 'Pequeña',
  medium: 'Mediana',
  large: 'Grande',
  enterprise: 'Enterprise',
};

interface TenantCardProps {
  tenant: Tenant;
  onEdit: (tenant: Tenant) => void;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

const TenantCard = ({ tenant, onEdit, onToggle, onDelete }: TenantCardProps) => {
  const [showMenu, setShowMenu] = useState(false);

  const statusColor: BadgeVariant = tenant.is_active
    ? tenant.is_subscription_valid
      ? 'success'
      : 'warning'
    : 'gray';

  const statusText = tenant.is_active
    ? tenant.is_subscription_valid
      ? 'Activo'
      : 'Suscripción Vencida'
    : 'Inactivo';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="p-4 hover:shadow-md transition-shadow relative group">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Logo o inicial - usa primary_color del tenant o bg-primary-500 del Design System */}
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                !tenant.primary_color ? 'bg-primary-500' : ''
              }`}
              style={tenant.primary_color ? { backgroundColor: tenant.primary_color } : undefined}
            >
              {tenant.logo_url ? (
                <img
                  src={tenant.logo_url}
                  alt={tenant.name}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                tenant.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {tenant.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {tenant.subdomain}.stratekaz.com
              </p>
            </div>
          </div>

          {/* Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-8 z-10 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1"
                  onMouseLeave={() => setShowMenu(false)}
                >
                  <button
                    onClick={() => {
                      onEdit(tenant);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      onToggle(tenant.id);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    {tenant.is_active ? (
                      <>
                        <ToggleLeft className="h-4 w-4" />
                        Desactivar
                      </>
                    ) : (
                      <>
                        <ToggleRight className="h-4 w-4" />
                        Activar
                      </>
                    )}
                  </button>
                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={() => {
                      onDelete(tenant.id);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant={statusColor} size="sm">
            {statusText}
          </Badge>
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
            <span>{tenant.user_count || 0} usuarios</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <Database className="h-3.5 w-3.5" />
            <span>{tenant.db_name}</span>
          </div>
          {tenant.subscription_ends_at && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 col-span-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>Vence: {new Date(tenant.subscription_ends_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* NIT si existe */}
        {tenant.nit && (
          <p className="text-xs text-gray-400 mt-2">NIT: {tenant.nit}</p>
        )}
      </Card>
    </motion.div>
  );
};

export const TenantsSection = () => {
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [tenantToDelete, setTenantToDelete] = useState<number | null>(null);
  const [tenantToEdit, setTenantToEdit] = useState<Tenant | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);

  const { data: tenants, isLoading } = useTenantsList({
    search: search || undefined,
    is_active: filterActive,
  });

  const toggleActive = useToggleTenantActive();
  const deleteTenant = useDeleteTenant();

  // Filtrar localmente para búsqueda instantánea
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

  const handleToggle = (id: number) => {
    toggleActive.mutate(id);
  };

  const handleDelete = () => {
    if (tenantToDelete) {
      deleteTenant.mutate(tenantToDelete);
      setTenantToDelete(null);
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
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex gap-2">
          {/* Filter by status */}
          <select
            value={filterActive === undefined ? 'all' : filterActive ? 'active' : 'inactive'}
            onChange={(e) => {
              const val = e.target.value;
              setFilterActive(val === 'all' ? undefined : val === 'active');
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>

          <Button variant="primary" className="flex items-center gap-2" onClick={handleOpenNewTenant}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva Empresa</span>
          </Button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
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
      </div>

      {/* Grid de tenants */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredTenants.map((tenant) => (
            <TenantCard
              key={tenant.id}
              tenant={tenant}
              onEdit={handleEditTenant}
              onToggle={handleToggle}
              onDelete={setTenantToDelete}
            />
          ))}
        </AnimatePresence>
      </div>

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

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!tenantToDelete}
        onClose={() => setTenantToDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar Empresa"
        message="¿Estás seguro de que deseas eliminar esta empresa? Esta acción no se puede deshacer y eliminará todos los datos asociados."
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteTenant.isPending}
      />

      {/* Tenant Form Modal */}
      <TenantFormModal
        isOpen={showFormModal}
        onClose={handleCloseModal}
        tenant={tenantToEdit}
      />
    </div>
  );
};

export default TenantsSection;
