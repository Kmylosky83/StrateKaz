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
  ExternalLink,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Dropdown } from '@/components/common/Dropdown';
import type { DropdownItem } from '@/components/common/Dropdown';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Switch } from '@/components/forms/Switch';
import { CargoLevelBadge } from '@/components/users/CargoLevelBadge';
import type { User, NivelFirma, UserOrigen } from '@/types/users.types';
import { ORIGEN_LABELS, ORIGEN_COLORS, NIVEL_FIRMA_COLORS } from '@/types/users.types';
import type { BadgeVariant } from '@/components/common/Badge';

interface UsersTableProps {
  users: User[];
  isLoading?: boolean;
  onViewDetail: (user: User) => void;
  onToggleStatus: (user: User) => void;
  /** Callback para impersonar un usuario (solo superusers) */
  onImpersonate?: (user: User) => void;
  /** ID del usuario actual (para no permitir auto-impersonación) */
  currentUserId?: number;
}

type SortableField = 'full_name' | 'date_joined';

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

/** Mapeo de origen a ruta del módulo */
const ORIGEN_ROUTES: Partial<Record<UserOrigen, string>> = {
  colaborador: '/mi-equipo/colaboradores',
};

export const UsersTable = ({
  users,
  isLoading,
  onViewDetail,
  onToggleStatus,
  onImpersonate,
  currentUserId,
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
              <th className={thBase}>Firma</th>
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

              // Menú contextual
              const menuItems: DropdownItem[] = [];

              if (canImpersonate) {
                menuItems.push({
                  label: 'Impersonar',
                  icon: <Eye className="h-4 w-4" />,
                  onClick: () => onImpersonate(user),
                });
              }

              if (user.origen && ORIGEN_ROUTES[user.origen]) {
                menuItems.push({
                  label: 'Ir al módulo origen',
                  icon: <ExternalLink className="h-4 w-4" />,
                  onClick: () => {
                    window.location.href = ORIGEN_ROUTES[user.origen!]!;
                  },
                  divider: canImpersonate,
                });
              }

              // Superadmin no se puede desactivar
              if (!user.is_superuser) {
                menuItems.push({
                  label: user.is_active ? 'Desactivar cuenta' : 'Activar cuenta',
                  icon: user.is_active ? (
                    <UserX className="h-4 w-4" />
                  ) : (
                    <UserCheck className="h-4 w-4" />
                  ),
                  onClick: () => onToggleStatus(user),
                  variant: user.is_active ? 'danger' : 'default',
                  divider: !user.origen || !ORIGEN_ROUTES[user.origen],
                });
              }

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
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
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

                  {/* Estado — Switch inline (superadmin: solo badge, no toggle) */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.is_superuser ? (
                      <Badge variant="success" size="sm">
                        Activo
                      </Badge>
                    ) : (
                      <Switch
                        size="sm"
                        checked={user.is_active}
                        onCheckedChange={() => onToggleStatus(user)}
                      />
                    )}
                  </td>

                  {/* Nivel Firma — Superadmin no participa en workflows de firma */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.is_superuser ? (
                      <span className="text-xs text-gray-400">—</span>
                    ) : (
                      (() => {
                        const nivel = (user.nivel_firma || 1) as NivelFirma;
                        const variant = NIVEL_FIRMA_COLORS[nivel] as BadgeVariant;
                        return (
                          <Badge
                            variant={variant}
                            size="sm"
                            title={
                              nivel === 1
                                ? 'Sin 2FA al firmar'
                                : nivel === 2
                                  ? 'TOTP obligatorio al firmar'
                                  : 'TOTP + Email OTP al firmar'
                            }
                          >
                            {nivel === 1 ? 'N1' : nivel === 2 ? 'N2 TOTP' : 'N3 2FA'}
                          </Badge>
                        );
                      })()
                    )}
                  </td>

                  {/* Fecha Registro */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(user.date_joined), 'PP', { locale: es })}
                  </td>

                  {/* Acciones: Ver detalle + Menú contextual */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetail(user)}
                        title="Ver detalle"
                        className="p-2"
                      >
                        <Eye className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                      </Button>

                      <Dropdown items={menuItems} align="right" />
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
