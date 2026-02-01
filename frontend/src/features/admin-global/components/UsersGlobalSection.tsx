/**
 * Sección de Usuarios Globales - Admin Global
 *
 * Gestión de usuarios con acceso multi-tenant.
 */
import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  Building2,
  Mail,
  Clock,
  MoreVertical,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button, ConfirmDialog, BrandedSkeleton, Avatar } from '@/components/common';
import { getModuleColorClasses } from '@/utils/moduleColors';
import { useTenantUsersList, useDeleteTenantUser } from '../hooks/useAdminGlobal';
import { UserFormModal } from './UserFormModal';
import { ManageUserTenantsModal } from './ManageUserTenantsModal';
import type { TenantUser } from '../types';

// Color del módulo Admin Global
const colors = getModuleColorClasses('indigo');

interface UserRowProps {
  user: TenantUser;
  onEdit: (user: TenantUser) => void;
  onDelete: (id: number) => void;
  onManageTenants: (user: TenantUser) => void;
}

const UserRow = ({ user, onEdit, onDelete, onManageTenants }: UserRowProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calcular posición del menú cuando se abre
  useEffect(() => {
    if (showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuHeight = 140; // Altura aproximada del menú
      const spaceBelow = window.innerHeight - rect.bottom;

      // Si no hay espacio abajo, mostrar arriba
      if (spaceBelow < menuHeight) {
        setMenuPosition({
          top: rect.top - menuHeight - 4,
          right: window.innerWidth - rect.right,
        });
      } else {
        setMenuPosition({
          top: rect.bottom + 4,
          right: window.innerWidth - rect.right,
        });
      }
    }
  }, [showMenu]);

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Nunca';
    return new Date(dateStr).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
    >
      {/* Usuario */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar
            name={`${user.first_name} ${user.last_name}`}
            size="sm"
            className={colors.badge}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {user.first_name} {user.last_name}
              </span>
              {user.is_superadmin && (
                <Badge variant="primary" size="sm" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Super
                </Badge>
              )}
            </div>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {user.email}
            </span>
          </div>
        </div>
      </td>

      {/* Estado */}
      <td className="px-4 py-3">
        <Badge variant={user.is_active ? 'success' : 'gray'}>
          {user.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      </td>

      {/* Tenants */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {user.is_superadmin ? (
              <span className={`${colors.text} font-medium`}>Todos</span>
            ) : (
              `${user.tenant_count} empresa${user.tenant_count !== 1 ? 's' : ''}`
            )}
          </span>
        </div>
        {/* Lista de tenants */}
        {!user.is_superadmin && user.accesses.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {user.accesses.slice(0, 3).map((access) => (
              <Badge key={access.tenant.id} variant="gray" size="sm">
                {access.tenant.name.length > 15
                  ? `${access.tenant.name.substring(0, 15)}...`
                  : access.tenant.name}
              </Badge>
            ))}
            {user.accesses.length > 3 && (
              <Badge variant="gray" size="sm">
                +{user.accesses.length - 3}
              </Badge>
            )}
          </div>
        )}
      </td>

      {/* Último acceso */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Clock className="h-3.5 w-3.5" />
          {formatDate(user.last_login)}
        </div>
      </td>

      {/* Acciones */}
      <td className="px-4 py-3">
        <Button
          ref={buttonRef}
          variant="ghost"
          size="sm"
          onClick={() => setShowMenu(!showMenu)}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>

        <AnimatePresence>
          {showMenu && (
            <>
              {/* Overlay para cerrar al hacer click fuera */}
              <div
                className="fixed inset-0 z-[100]"
                onClick={() => setShowMenu(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed z-[101] w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1"
                style={{
                  top: menuPosition.top,
                  right: menuPosition.right,
                }}
              >
                <button
                  onClick={() => {
                    onEdit(user);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </button>
                <button
                  onClick={() => {
                    onManageTenants(user);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                >
                  <Building2 className="h-4 w-4" />
                  Gestionar Empresas
                </button>
                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                <button
                  onClick={() => {
                    onDelete(user.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </td>
    </motion.tr>
  );
};

export const UsersGlobalSection = () => {
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [filterSuperadmin, setFilterSuperadmin] = useState<boolean | undefined>(undefined);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [userToEdit, setUserToEdit] = useState<TenantUser | null>(null);
  const [userToManage, setUserToManage] = useState<TenantUser | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);

  const { data: users, isLoading } = useTenantUsersList({
    search: search || undefined,
    is_active: filterActive,
    is_superadmin: filterSuperadmin,
  });

  const deleteUser = useDeleteTenantUser();

  // Filtrar localmente
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!search) return users;

    const searchLower = search.toLowerCase();
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(searchLower) ||
        u.first_name.toLowerCase().includes(searchLower) ||
        u.last_name.toLowerCase().includes(searchLower)
    );
  }, [users, search]);

  const handleDelete = () => {
    if (userToDelete) {
      deleteUser.mutate(userToDelete);
      setUserToDelete(null);
    }
  };

  const handleOpenNewUser = () => {
    setUserToEdit(null);
    setShowFormModal(true);
  };

  const handleEditUser = (user: TenantUser) => {
    setUserToEdit(user);
    setShowFormModal(true);
  };

  const handleCloseModal = () => {
    setShowFormModal(false);
    setUserToEdit(null);
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
            placeholder="Buscar usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex gap-2">
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

          <select
            value={filterSuperadmin === undefined ? 'all' : filterSuperadmin ? 'super' : 'normal'}
            onChange={(e) => {
              const val = e.target.value;
              setFilterSuperadmin(val === 'all' ? undefined : val === 'super');
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="all">Todos los roles</option>
            <option value="super">Superadmins</option>
            <option value="normal">Usuarios</option>
          </select>

          <Button variant="primary" className="flex items-center gap-2" onClick={handleOpenNewUser}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo Usuario</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
        <span>{filteredUsers.length} usuarios</span>
        <span className="flex items-center gap-1">
          <Shield className={`h-4 w-4 ${colors.icon}`} />
          {users?.filter((u) => u.is_superadmin).length || 0} superadmins
        </span>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresas
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Acceso
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filteredUsers.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onEdit={handleEditUser}
                    onDelete={setUserToDelete}
                    onManageTenants={setUserToManage}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Empty state */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {search ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
          </p>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar Usuario"
        message="¿Estás seguro de que deseas eliminar este usuario? Perderá acceso a todas las empresas."
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteUser.isPending}
      />

      {/* User Form Modal */}
      <UserFormModal
        isOpen={showFormModal}
        onClose={handleCloseModal}
        user={userToEdit}
      />

      {/* Manage User Tenants Modal */}
      <ManageUserTenantsModal
        isOpen={!!userToManage}
        onClose={() => setUserToManage(null)}
        user={userToManage}
      />
    </div>
  );
};

export default UsersGlobalSection;
