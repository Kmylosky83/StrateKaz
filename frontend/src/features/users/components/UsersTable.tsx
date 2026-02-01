import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { UserCheck, UserX, Shield } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { ActionButtons } from '@/components/common/ActionButtons';
import { Modules, Sections } from '@/constants/permissions';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { UserStatusBadge } from '@/components/users/UserStatusBadge';
import { CargoLevelBadge } from '@/components/users/CargoLevelBadge';
import type { User } from '@/types/users.types';

interface UsersTableProps {
  users: User[];
  isLoading?: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onToggleStatus: (user: User) => void;
  /** Custom RBAC Module (optional, defaults to CORE) */
  module?: string;
  /** Custom RBAC Section (optional, defaults to USERS) */
  section?: string;
}

export const UsersTable = ({
  users,
  isLoading,
  onEdit,
  onDelete,
  onToggleStatus,
  module = Modules.CORE,
  section = Sections.USERS,
}: UsersTableProps) => {
  const [sortField, setSortField] = useState<keyof User>('full_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  if (isLoading) {
    return (
      <Card>
        <div className="p-8 text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
          <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando usuarios...</p>
        </div>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card>
        <div className="p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">No se encontraron usuarios</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('full_name')}
              >
                Usuario
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('email')}
              >
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Cargo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('date_joined')}
              >
                Fecha Registro
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedUsers.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 relative">
                      <Avatar
                        src={user.photo || undefined}
                        name={user.full_name || user.username}
                        size="md"
                      />
                      {user.is_superuser && (
                        <div
                          className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-amber-500 flex items-center justify-center ring-2 ring-white dark:ring-gray-900"
                          title="Super Administrador"
                        >
                          <Shield className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user.full_name || user.username}
                        </span>
                        {user.is_superuser && (
                          <Badge variant="warning" size="sm">Admin</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        @{user.username}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {user.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <CargoLevelBadge cargo={user.cargo} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <UserStatusBadge isActive={user.is_active} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(user.date_joined), 'PP', { locale: es })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <ActionButtons
                      module={module}
                      section={section}
                      onEdit={() => onEdit(user)}
                      onDelete={() => onDelete(user)}
                      size="sm"
                      customActions={[
                        {
                          key: 'toggle-status',
                          label: user.is_active ? 'Desactivar' : 'Activar',
                          icon: user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />,
                          onClick: () => onToggleStatus(user),
                        }
                      ]}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
