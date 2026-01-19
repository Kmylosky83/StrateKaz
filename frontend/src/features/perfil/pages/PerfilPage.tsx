/**
 * PerfilPage - Página principal de perfil de usuario
 *
 * Muestra la información del usuario y opciones de configuración personal.
 * Mejora MP-001: Añadido SectionHeader para consistencia visual.
 */
import { useEffect } from 'react';
import { User } from 'lucide-react';
import { Card, SectionHeader } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { useHeaderContext } from '@/contexts/HeaderContext';
import { USER_MENU_LABELS } from '@/constants';

export const PerfilPage = () => {
  const { user } = useAuthStore();
  const { resetHeader } = useHeaderContext();

  // Limpiar header al montar (no tiene tabs)
  useEffect(() => {
    resetHeader();
  }, [resetHeader]);

  const displayName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.first_name || user?.username || USER_MENU_LABELS.DEFAULT_USER;

  const cargoName = user?.cargo?.name || USER_MENU_LABELS.DEFAULT_CARGO;

  const initials =
    user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* MP-001: SectionHeader para consistencia */}
      <SectionHeader
        title="Mi Perfil"
        description="Información personal y datos de tu cuenta"
        icon={<User className="h-6 w-6" />}
        variant="large"
      />

      <Card className="p-8">
        {/* Header del perfil */}
        <div className="flex items-center gap-6 mb-8">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {initials}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{displayName}</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{cargoName}</p>
            {user?.email && (
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">{user.email}</p>
            )}
          </div>
        </div>

        {/* Información del perfil */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </h2>
            <div className="space-y-3 pl-7">
              <InfoItem label="Nombre" value={user?.first_name || '-'} />
              <InfoItem label="Apellido" value={user?.last_name || '-'} />
              <InfoItem label="Usuario" value={user?.username || '-'} />
              <InfoItem label="Email" value={user?.email || '-'} />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Información Laboral
            </h2>
            <div className="space-y-3">
              <InfoItem label="Cargo" value={cargoName} />
              <InfoItem
                label="Area"
                value={((user?.cargo as Record<string, unknown>)?.area?.name as string) || '-'}
              />
              <InfoItem
                label="Empresa"
                value={((user as Record<string, unknown>)?.empresa?.nombre as string) || '-'}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

interface InfoItemProps {
  label: string;
  value: string;
}

const InfoItem = ({ label, value }: InfoItemProps) => (
  <div>
    <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
    <dd className="text-gray-900 dark:text-white">{value}</dd>
  </div>
);

export default PerfilPage;
