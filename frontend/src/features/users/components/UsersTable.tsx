import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  UserCheck,
  UserX,
  Shield,
  Eye,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { ActionButtons } from '@/components/common/ActionButtons';
import { Modules, Sections } from '@/constants/permissions';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { UserStatusBadge } from '@/components/users/UserStatusBadge';
import { CargoLevelBadge } from '@/components/users/CargoLevelBadge';
import type { User } from '@/types/users.types';
import { ORIGEN_LABELS, ORIGEN_COLORS } from '@/types/users.types';
import type { BadgeVariant } from '@/components/common/Badge';

interface UsersTableProps {
  users: User[];
  isLoading?: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onToggleStatus: (user: User) => void;
  /** Callback para impersonar un usuario (solo superusers) */
  onImpersonate?: (user: User) => void;
  /** ID del usuario actual (para no permitir auto-impersonación) */
  currentUserId?: number;
  /** Custom RBAC Module (optional, defaults to CORE) */
  module?: string;
  /** Custom RBAC Section (optional, defaults to USERS) */
  section?: string;
}

type SortableField = 'full_name' | 'email' | 'date_joined';

/** Indicador visual de dirección de sort */
const SortIcon = ({
  field,
  activeField,
  direction,
}: {
  field: SortableField;
  activeField: SortableField;
  direction: 'asc' | 'desc';
}) => {
  if (field !== activeField) {
    return <ChevronsUpDown className="inline ml-1 h-3 w-3 opacity-40" />;
  }
  return direction === 'asc' ? (
    <ChevronUp className="inline ml-1 h-3 w-3" />
  ) : (
    <ChevronDown className="inline ml-1 h-3 w-3" />
  );
};

export const UsersTable = ({
  users,
  isLoading,
  onEdit,
  onDelete,
  onToggleStatus,
  onImpersonate,
  currentUserId,
  module = Modules.CORE,
  section = Sections.USERS,
}: UsersTableProps) => {
  const [sortField, setSortField] = useState<SortableField>('full_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: SortableField) => {
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

  const thBase =
    'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider';
  const thSortable = `${thBase} cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700`;

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className={thSortable} onClick={() => handleSort('full_name')}>
                Usuario{' '}
                <SortIcon field="full_name" activeField={sortField} direction={sortDirection} />
              </th>
              <th className={thBase}>Cargo</th>
              <th className={thBase}>Origen</th>
              <th className={thBase}>Estado</th>
              <th className={thSortable} onClick={() => handleSort('email')}>
                Correo <SortIcon field="email" activeField={sortField} direction={sortDirection} />
              </th>
              <th className={thSortable} onClick={() => handleSort('date_joined')}>
                Registro{' '}
                <SortIcon field="date_joined" activeField={sortField} direction={sortDirection} />
              </th>
              <th className={`${thBase} text-right`}>Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedUsers.map((user) => {
              const canImpersonate =
                onImpersonate && user.id !== currentUserId && !user.is_superuser;

              return (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {/* Usuario */}
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
                            title="Superusuario - Acceso completo a este tenant"
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
                            <Badge
                              variant="warning"
                              size="sm"
                              title="Tiene acceso completo a todas las secciones de este tenant"
                            >
                              Superusuario
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          @{user.username}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Cargo */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <CargoLevelBadge cargo={user.cargo} />
                  </td>

                  {/* Origen */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.origen && (
                      <Badge
                        variant={(ORIGEN_COLORS[user.origen] || 'gray') as BadgeVariant}
                        size="sm"
                      >
                        {ORIGEN_LABELS[user.origen] || user.origen}
                      </Badge>
                    )}
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <UserStatusBadge isActive={user.is_active} />
                  </td>

                  {/* Correo */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{user.email}</div>
                  </td>

                  {/* Fecha Registro */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(user.date_joined), 'PP', { locale: es })}
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <ActionButtons
                        module={module}
                        section={section}
                        onEdit={() => onEdit(user)}
                        onDelete={() => onDelete(user)}
                        size="sm"
                        customActions={[
                          ...(canImpersonate
                            ? [
                                {
                                  key: 'impersonate',
                                  label: 'Ver como este usuario',
                                  icon: <Eye className="w-4 h-4" />,
                                  onClick: () => onImpersonate(user),
                                  variant: 'ghost' as const,
                                },
                              ]
                            : []),
                          {
                            key: 'toggle-status',
                            label: user.is_active ? 'Desactivar' : 'Activar',
                            icon: user.is_active ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            ),
                            onClick: () => onToggleStatus(user),
                          },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
