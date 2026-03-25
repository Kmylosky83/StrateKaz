/**
 * UserDetailDrawer — Panel lateral de detalle de usuario (solo lectura)
 *
 * Centro de control: muestra identidad digital + datos de persona.
 * La edición se hace en el módulo origen (Mi Equipo > Colaboradores).
 */
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Mail,
  Phone,
  CreditCard,
  Building2,
  Calendar,
  Clock,
  Shield,
  ShieldCheck,
  ExternalLink,
  Eye,
  KeyRound,
  UserX,
  UserCheck,
  Fingerprint,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Drawer } from '@/components/common/Drawer';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { UserStatusBadge } from '@/components/users/UserStatusBadge';
import { CargoLevelBadge } from '@/components/users/CargoLevelBadge';
import { Spinner } from '@/components/common/Spinner';
import { useUser } from '../hooks/useUsers';
import type { User, NivelFirma, UserOrigen } from '@/types/users.types';
import { ORIGEN_LABELS, ORIGEN_COLORS, NIVEL_FIRMA_LABELS } from '@/types/users.types';
import type { BadgeVariant } from '@/components/common/Badge';

interface UserDetailDrawerProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleStatus?: (user: User) => void;
  onImpersonate?: (user: User) => void;
  canImpersonate?: boolean;
  currentUserId?: number;
}

/** Mapeo de origen a ruta del módulo */
const ORIGEN_ROUTES: Partial<Record<UserOrigen, { path: string; label: string }>> = {
  colaborador: { path: '/mi-equipo/colaboradores', label: 'Editar en Mi Equipo' },
};

/** Item de información en el drawer */
const InfoItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-start gap-3 py-2">
    <Icon className="h-4 w-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
    <div className="min-w-0 flex-1">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm text-gray-900 dark:text-gray-100 break-words">{value || '—'}</p>
    </div>
  </div>
);

/** Encabezado de sección */
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 mt-6 first:mt-0">
    {children}
  </h3>
);

export const UserDetailDrawer = ({
  user,
  isOpen,
  onClose,
  onToggleStatus,
  onImpersonate,
  canImpersonate = false,
  currentUserId,
}: UserDetailDrawerProps) => {
  const navigate = useNavigate();
  const { data: userDetail, isLoading } = useUser(user?.id || 0, {
    enabled: isOpen && !!user?.id,
  });

  // Datos del detalle o fallback al user de la lista
  const detail = userDetail || user;
  if (!detail) return null;

  const showImpersonate =
    canImpersonate && detail.id !== currentUserId && !detail.is_superuser && onImpersonate;

  const origenRoute = detail.origen ? ORIGEN_ROUTES[detail.origen] : null;
  const nivelFirma = (detail.nivel_firma || 1) as NivelFirma;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de Usuario"
      subtitle="Centro de control de identidad digital"
      size="md"
      footer={
        <div className="flex flex-col gap-2 w-full">
          {/* Acciones de control */}
          <div className="flex gap-2">
            {onToggleStatus && (
              <Button
                variant={detail.is_active ? 'outline' : 'primary'}
                size="sm"
                className="flex-1"
                onClick={() => onToggleStatus(detail as User)}
              >
                {detail.is_active ? (
                  <>
                    <UserX className="h-4 w-4 mr-2" />
                    Desactivar
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Activar
                  </>
                )}
              </Button>
            )}

            {showImpersonate && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onImpersonate(detail as User)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Impersonar
              </Button>
            )}
          </div>

          {/* Link al módulo origen */}
          {origenRoute && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-primary-600 dark:text-primary-400"
              onClick={() => {
                onClose();
                navigate(origenRoute.path);
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {origenRoute.label}
            </Button>
          )}
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div>
          {/* Header: Avatar + Nombre + Badges */}
          <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative flex-shrink-0">
              <Avatar
                src={
                  (detail as unknown as { photo_url?: string }).photo_url ||
                  detail.photo ||
                  undefined
                }
                name={detail.full_name || detail.username}
                size="xl"
              />
              {detail.is_superuser && (
                <div
                  className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center ring-2 ring-white dark:ring-gray-800"
                  title="Superusuario"
                >
                  <Shield className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                {detail.full_name || detail.username}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">@{detail.username}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <UserStatusBadge isActive={detail.is_active} />
                {detail.origen && (
                  <Badge
                    variant={(ORIGEN_COLORS[detail.origen] || 'gray') as BadgeVariant}
                    size="sm"
                  >
                    {ORIGEN_LABELS[detail.origen] || detail.origen}
                  </Badge>
                )}
                {detail.is_superuser && (
                  <Badge variant="warning" size="sm">
                    Superusuario
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Sección: Identidad Digital */}
          <SectionTitle>Identidad Digital</SectionTitle>

          <div className="space-y-1">
            <InfoItem icon={Mail} label="Correo electrónico" value={detail.email} />

            <InfoItem
              icon={Fingerprint}
              label="Nivel de firma"
              value={NIVEL_FIRMA_LABELS[nivelFirma]}
            />

            <InfoItem
              icon={ShieldCheck}
              label="Roles"
              value={
                (detail as unknown as { role_codes?: string[] }).role_codes?.length ? (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {(detail as unknown as { role_codes: string[] }).role_codes.map((code) => (
                      <Badge key={code} variant="gray" size="sm">
                        {code}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  'Sin roles asignados'
                )
              }
            />

            <InfoItem
              icon={Clock}
              label="Último acceso"
              value={
                detail.last_login
                  ? format(new Date(detail.last_login), "PPP 'a las' p", { locale: es })
                  : 'Nunca ha ingresado'
              }
            />

            <InfoItem
              icon={Calendar}
              label="Fecha de registro"
              value={format(new Date(detail.date_joined), 'PPP', { locale: es })}
            />
          </div>

          {/* Sección: Datos de Persona */}
          <SectionTitle>Datos de Persona</SectionTitle>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/50">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Estos datos se gestionan desde el módulo origen del usuario
            </p>

            <div className="space-y-1">
              <InfoItem
                icon={CreditCard}
                label="Documento"
                value={
                  detail.document_number
                    ? `${detail.document_type_display || detail.document_type} ${detail.document_number}`
                    : '—'
                }
              />

              <InfoItem icon={Phone} label="Teléfono" value={detail.phone} />

              <div className="flex items-start gap-3 py-2">
                <Building2 className="h-4 w-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Cargo</p>
                  <div className="mt-0.5">
                    <CargoLevelBadge cargo={detail.cargo} />
                  </div>
                  {(detail as unknown as { area_nombre?: string }).area_nombre && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Área: {(detail as unknown as { area_nombre: string }).area_nombre}
                    </p>
                  )}
                </div>
              </div>

              <InfoItem
                icon={KeyRound}
                label="Empresa"
                value={(detail as unknown as { empresa_nombre?: string }).empresa_nombre}
              />
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
};
