/**
 * PerfilPage - Página principal de perfil de usuario
 *
 * Muestra la información del usuario y datos organizacionales.
 * Usa PageHeader para consistencia con el resto de la aplicación.
 *
 * Vista 1: Cards de Información con edición via modal.
 */
import { useEffect, useState } from 'react';
import {
  User,
  Building2,
  Briefcase,
  Mail,
  Phone,
  IdCard,
  Calendar,
  Pencil,
  Camera,
} from 'lucide-react';
import { Card, Button } from '@/components/common';
import { PageHeader } from '@/components/layout';
import { useAuthStore } from '@/store/authStore';
import { useHeaderContext } from '@/contexts/HeaderContext';
import { USER_MENU_LABELS } from '@/constants';
import { EditProfileModal, AvatarUploadModal } from '../components';

export const PerfilPage = () => {
  const { user } = useAuthStore();
  const { resetHeader } = useHeaderContext();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Limpiar header al montar (no tiene tabs)
  useEffect(() => {
    resetHeader();
  }, [resetHeader]);

  const displayName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.first_name || user?.username || USER_MENU_LABELS.DEFAULT_USER;

  const cargoName = user?.cargo?.name || USER_MENU_LABELS.DEFAULT_CARGO;
  const areaName = user?.area_nombre || user?.cargo?.area_nombre || '-';
  const empresaName = user?.empresa_nombre || '-';

  const initials =
    user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U';

  // Formatear fecha de ingreso
  const dateJoined = user?.date_joined
    ? new Date(user.date_joined).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '-';

  return (
    <div className="space-y-4">
      {/* PageHeader para consistencia con la app */}
      <PageHeader
        title="Mi Perfil"
        description="Información personal y datos de tu cuenta"
        actions={
          <Button onClick={() => setShowEditModal(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar Perfil
          </Button>
        }
      />

      {/* Card principal del perfil */}
      <Card className="p-6 md:p-8">
        {/* Header del perfil con avatar */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
          {/* Avatar con botón para cambiar foto */}
          <div className="relative group flex-shrink-0">
            {user?.photo_url ? (
              <img
                src={user.photo_url}
                alt={displayName}
                className="h-24 w-24 rounded-full object-cover shadow-lg"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {initials}
              </div>
            )}
            {/* Botón flotante para cambiar foto */}
            <button
              onClick={() => setShowAvatarModal(true)}
              className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Cambiar foto de perfil"
            >
              <Camera className="h-8 w-8 text-white" />
            </button>
          </div>

          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{displayName}</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{cargoName}</p>
            {user?.email && (
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">{user.email}</p>
            )}
          </div>
        </div>

        {/* Grid de información */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Información Personal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <User className="h-5 w-5 text-primary-500" />
              Información Personal
            </h3>
            <div className="space-y-3 pl-7">
              <InfoItem icon={User} label="Nombre completo" value={displayName} />
              <InfoItem icon={Mail} label="Correo electrónico" value={user?.email || '-'} />
              <InfoItem icon={Phone} label="Teléfono" value={user?.phone || '-'} />
              <InfoItem
                icon={IdCard}
                label="Documento"
                value={
                  user?.document_number
                    ? `${user.document_type_display || user.document_type} ${user.document_number}`
                    : '-'
                }
              />
            </div>
          </div>

          {/* Información Laboral */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary-500" />
              Información Laboral
            </h3>
            <div className="space-y-3 pl-7">
              <InfoItem icon={Building2} label="Empresa" value={empresaName} />
              <InfoItem icon={Briefcase} label="Área" value={areaName} />
              <InfoItem icon={User} label="Cargo" value={cargoName} />
              <InfoItem icon={Calendar} label="Fecha de ingreso" value={dateJoined} />
            </div>
          </div>
        </div>
      </Card>

      {/* Modales */}
      {user && (
        <>
          <EditProfileModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            user={user}
          />
          <AvatarUploadModal isOpen={showAvatarModal} onClose={() => setShowAvatarModal(false)} />
        </>
      )}
    </div>
  );
};

interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

const InfoItem = ({ icon: Icon, label, value }: InfoItemProps) => (
  <div className="flex items-start gap-3">
    <Icon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
    <div>
      <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-gray-900 dark:text-white">{value}</dd>
    </div>
  </div>
);

export default PerfilPage;
