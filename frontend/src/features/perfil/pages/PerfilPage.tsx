/**
 * PerfilPage — Página centralizada del perfil del empleado.
 *
 * Arquitectura Workday/BambooHR: un solo lugar para todo lo personal,
 * organizado en 5 secciones con edit inline por sección.
 *
 * Secciones:
 *   1. Identidad — User.first_name/last_name/email/phone + foto
 *      → EditIdentidadModal (PATCH /api/core/users/update_profile/)
 *      → AvatarUploadModal (POST /api/core/users/upload_photo/)
 *   2. Contacto personal — Colaborador + InfoPersonal
 *      → EditContactoModal (PUT /api/mi-portal/mi-perfil/)
 *   3. Contacto de emergencia — InfoPersonal
 *      → EditEmergenciaModal (PUT /api/mi-portal/mi-perfil/)
 *   4. Información laboral — read-only (admin edita en Mi Equipo)
 *   5. Firma digital — link a /mi-portal?tab=firma (UX dedicada SignaturePad)
 *
 * Rutas hermanas que NO viven aquí:
 *   - /perfil/seguridad   — password + 2FA + sesiones (SeguridadPage)
 *   - /perfil/preferencias — idioma, tema, notificaciones (PreferenciasPage)
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  MapPin,
  Heart,
  PenTool,
  ArrowRight,
  Lock,
  AtSign,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, Button, Avatar, Badge } from '@/components/common';
import { PageHeader } from '@/components/layout';
import { useAuthStore } from '@/store/authStore';
import { useHeaderContext } from '@/contexts/HeaderContext';
import { useMiPerfil } from '@/features/mi-portal/api/miPortalApi';
import {
  EditIdentidadModal,
  EditContactoModal,
  EditEmergenciaModal,
  AvatarUploadModal,
} from '../components';

// ============================================================================
// MAIN
// ============================================================================

export const PerfilPage = () => {
  const { user } = useAuthStore();
  const { resetHeader } = useHeaderContext();
  const { data: perfil } = useMiPerfil(!user?.is_superuser);

  const [showIdentidadModal, setShowIdentidadModal] = useState(false);
  const [showContactoModal, setShowContactoModal] = useState(false);
  const [showEmergenciaModal, setShowEmergenciaModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  useEffect(() => {
    resetHeader();
  }, [resetHeader]);

  const isSuperAdmin = user?.is_superuser;
  const displayName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.first_name || user?.username || 'Usuario';

  const cargoName = isSuperAdmin
    ? 'Administrador del Sistema'
    : user?.cargo?.name || 'Sin cargo asignado';

  const areaName = user?.area_nombre || user?.cargo?.area_nombre || '—';
  const empresaName = user?.empresa_nombre || '—';

  const dateJoined = user?.date_joined
    ? new Date(user.date_joined).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  const fechaIngresoEmpleado = perfil?.fecha_ingreso
    ? new Date(perfil.fecha_ingreso).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : dateJoined;

  const documentoDisplay = user?.document_number?.startsWith('TEMP-')
    ? 'Sin configurar'
    : user?.document_number
      ? `${user.document_type || ''} ${user.document_number}`.trim()
      : '—';

  const documentoMuted = user?.document_number?.startsWith('TEMP-') || !user?.document_number;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-6">
      <PageHeader
        title="Mi Perfil"
        description="Tu información personal, de contacto y de emergencia en un solo lugar"
      />

      {/* ================================================================
          1. IDENTITY CARD (con avatar + datos del User + badge estado)
          ================================================================ */}
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar clickeable */}
          <div className="relative group flex-shrink-0">
            <Avatar src={user?.photo_url} name={displayName} size="2xl" className="shadow-lg" />
            <Button
              variant="ghost"
              onClick={() => setShowAvatarModal(true)}
              className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all p-0"
              aria-label="Cambiar foto de perfil"
            >
              <Camera className="h-6 w-6 text-white" />
            </Button>
          </div>

          {/* Identidad */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <SectionHeader
              icon={User}
              label="Identidad"
              onEdit={() => setShowIdentidadModal(true)}
            />
            <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-white truncate">
              {displayName}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{cargoName}</p>
            {user?.email && (
              <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-500 dark:text-gray-400 justify-center sm:justify-start">
                <AtSign className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <InfoRow
                icon={Phone}
                label="Teléfono corporativo"
                value={user?.phone || '—'}
                muted={!user?.phone}
              />
              <InfoRow
                icon={IdCard}
                label="Documento"
                value={documentoDisplay}
                muted={documentoMuted}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* ================================================================
          2. CONTACTO PERSONAL (Colaborador + InfoPersonal)
          ================================================================ */}
      {!isSuperAdmin && (
        <Card padding="lg">
          <SectionHeader
            icon={Phone}
            label="Contacto personal"
            onEdit={() => setShowContactoModal(true)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow
              icon={Mail}
              label="Email personal"
              value={perfil?.email_personal || 'Sin email personal'}
              muted={!perfil?.email_personal}
            />
            <InfoRow
              icon={Phone}
              label="Celular / Teléfono fijo"
              value={
                [perfil?.celular, perfil?.telefono].filter(Boolean).join(' · ') || 'Sin teléfono'
              }
              muted={!perfil?.celular && !perfil?.telefono}
            />
            <InfoRow
              icon={MapPin}
              label="Ciudad"
              value={perfil?.ciudad || 'Sin ciudad'}
              muted={!perfil?.ciudad}
            />
            <InfoRow
              icon={MapPin}
              label="Dirección"
              value={perfil?.direccion || 'Sin dirección'}
              muted={!perfil?.direccion}
            />
          </div>
        </Card>
      )}

      {/* ================================================================
          3. CONTACTO DE EMERGENCIA (InfoPersonal)
          ================================================================ */}
      {!isSuperAdmin && (
        <Card padding="lg">
          <SectionHeader
            icon={Heart}
            label="Contacto de emergencia"
            onEdit={() => setShowEmergenciaModal(true)}
          />
          {perfil?.contacto_emergencia_nombre ? (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex-shrink-0">
                <Heart className="w-5 h-5 text-red-500 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white">
                  {perfil.contacto_emergencia_nombre}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {perfil.contacto_emergencia_parentesco && (
                    <span>{perfil.contacto_emergencia_parentesco}</span>
                  )}
                  {perfil.contacto_emergencia_parentesco && perfil.contacto_emergencia_telefono && (
                    <span className="text-gray-300 dark:text-gray-600 mx-2">·</span>
                  )}
                  {perfil.contacto_emergencia_telefono && (
                    <span className="tabular-nums">{perfil.contacto_emergencia_telefono}</span>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowEmergenciaModal(true)}
              className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                <Heart className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-red-400 transition-colors" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Agregar contacto de emergencia
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Persona a contactar en caso de emergencia laboral
                </p>
              </div>
              <Pencil className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
            </button>
          )}
        </Card>
      )}

      {/* ================================================================
          4. INFORMACIÓN LABORAL (read-only — admin edita en Mi Equipo)
          ================================================================ */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {isSuperAdmin ? 'Rol en el sistema' : 'Información laboral'}
            </h3>
          </div>
          <Badge variant="gray" size="sm">
            <Lock className="w-3 h-3 mr-1" />
            Solo lectura
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={Building2} label="Empresa" value={empresaName} />
          {isSuperAdmin ? (
            <InfoRow icon={User} label="Rol" value="Administrador del Sistema" />
          ) : (
            <>
              <InfoRow icon={Briefcase} label="Área / Proceso" value={areaName} />
              <InfoRow icon={User} label="Cargo" value={cargoName} />
              <InfoRow icon={Calendar} label="Fecha de ingreso" value={fechaIngresoEmpleado} />
              {perfil?.estado && <InfoRow icon={User} label="Estado" value={perfil.estado} />}
            </>
          )}
        </div>
        {!isSuperAdmin && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            Estos datos los gestiona el área de talento humano desde Mi Equipo &gt; Colaboradores.
          </p>
        )}
      </Card>

      {/* ================================================================
          5. FIRMA DIGITAL (link a Mi Portal)
          ================================================================ */}
      {!isSuperAdmin && (
        <Card padding="lg">
          <Link
            to="/mi-portal?tab=firma"
            className="flex items-center gap-4 -m-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
          >
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-800 flex-shrink-0">
              <PenTool className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Firma digital</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Gestiona tu firma manuscrita e iniciales guardadas
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-all flex-shrink-0" />
          </Link>
        </Card>
      )}

      {/* ================================================================
          MODALES
          ================================================================ */}
      {user && (
        <>
          <EditIdentidadModal
            isOpen={showIdentidadModal}
            onClose={() => setShowIdentidadModal(false)}
            user={user}
          />
          <EditContactoModal
            isOpen={showContactoModal}
            onClose={() => setShowContactoModal(false)}
            perfil={perfil || undefined}
          />
          <EditEmergenciaModal
            isOpen={showEmergenciaModal}
            onClose={() => setShowEmergenciaModal(false)}
            perfil={perfil || undefined}
          />
          <AvatarUploadModal isOpen={showAvatarModal} onClose={() => setShowAvatarModal(false)} />
        </>
      )}
    </div>
  );
};

// ============================================================================
// HELPERS
// ============================================================================

function SectionHeader({
  icon: Icon,
  label,
  onEdit,
}: {
  icon: LucideIcon;
  label: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          {label}
        </h3>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onEdit}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:opacity-80 p-0 h-auto"
      >
        <Pencil className="w-3.5 h-3.5" />
        Editar
      </Button>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  muted,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{label}</p>
        <p
          className={`text-sm truncate ${
            muted ? 'text-gray-400 dark:text-gray-500 italic' : 'text-gray-900 dark:text-gray-100'
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
