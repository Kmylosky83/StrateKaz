/**
 * MiPerfilCard — Tab "Mis datos" de Mi Portal.
 *
 * Muestra información laboral secundaria (cédula, fecha ingreso, estado) +
 * datos de contacto editables + contacto de emergencia.
 *
 * NO repite nombre/cargo/área: esos viven en el Hero de MiPortalPage.
 * Usa colores de branding del tenant.
 */
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  Heart,
  Pencil,
  IdCard,
  CheckCircle2,
  Info,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, Badge, Skeleton, Button } from '@/components/common';
import type { ColaboradorESS } from '../types';

interface MiPerfilCardProps {
  perfil: ColaboradorESS | null | undefined;
  isLoading: boolean;
  onEdit: () => void;
  /** @deprecated onAvatarClick ya vive en el Hero — mantener para compat del type */
  onAvatarClick?: () => void;
  primaryColor: string;
}

export function MiPerfilCard({ perfil, isLoading, onEdit, primaryColor }: MiPerfilCardProps) {
  if (isLoading) {
    return (
      <Card padding="lg">
        <div className="space-y-6">
          <Skeleton className="h-4 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
          <Skeleton className="h-4 w-40" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        </div>
      </Card>
    );
  }

  if (!perfil) {
    return (
      <Card padding="lg">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-amber-500 dark:text-amber-400" />
          </div>
          <h3 className="font-heading text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Perfil no vinculado
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
            Tu cuenta aún no tiene un perfil de colaborador asociado. Contacta al administrador para
            vincular tu usuario con un registro de colaborador.
          </p>
        </div>
      </Card>
    );
  }

  const estadoActivo = perfil.estado === 'activo';

  return (
    <Card padding="lg">
      {/* Action bar — edit button + estado */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Badge variant={estadoActivo ? 'success' : 'warning'} size="sm">
            {estadoActivo && <CheckCircle2 className="w-3 h-3 mr-1" />}
            {perfil.estado}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: primaryColor }}
        >
          <Pencil className="w-3.5 h-3.5" />
          Editar datos personales
        </Button>
      </div>

      {/* ──────────────────────────────────────────────────────────────
          INFORMACIÓN LABORAL (secundaria, no duplica el hero)
          ────────────────────────────────────────────────────────────── */}
      <SectionHeader label="Información laboral" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <InfoItem
          icon={IdCard}
          label={perfil.tipo_identificacion || 'Documento'}
          value={perfil.numero_identificacion || 'Sin documento'}
        />
        <InfoItem
          icon={Calendar}
          label="Fecha de ingreso"
          value={perfil.fecha_ingreso || 'Sin fecha'}
        />
        <InfoItem icon={Info} label="Estado" value={perfil.estado || 'Sin estado'} />
      </div>

      {/* ──────────────────────────────────────────────────────────────
          CONTACTO — datos editables por el empleado
          ────────────────────────────────────────────────────────────── */}
      <SectionHeader
        label="Contacto personal"
        editable
        onEdit={onEdit}
        primaryColor={primaryColor}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <InfoItem
          icon={Mail}
          label="Email personal"
          value={perfil.email_personal || 'Sin email personal'}
          muted={!perfil.email_personal}
        />
        <InfoItem
          icon={Phone}
          label="Celular / Teléfono"
          value={[perfil.celular, perfil.telefono].filter(Boolean).join(' · ') || 'Sin teléfono'}
          muted={!perfil.celular && !perfil.telefono}
        />
        <InfoItem
          icon={MapPin}
          label="Ciudad"
          value={perfil.ciudad || 'Sin ciudad'}
          muted={!perfil.ciudad}
        />
        <InfoItem
          icon={MapPin}
          label="Dirección"
          value={perfil.direccion || 'Sin dirección'}
          muted={!perfil.direccion}
        />
      </div>

      {/* ──────────────────────────────────────────────────────────────
          CONTACTO DE EMERGENCIA — card neutra con acento rojizo sutil
          ────────────────────────────────────────────────────────────── */}
      <SectionHeader
        label="Contacto de emergencia"
        editable
        onEdit={onEdit}
        primaryColor={primaryColor}
      />
      {perfil.contacto_emergencia_nombre ? (
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
          onClick={onEdit}
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
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function SectionHeader({
  label,
  editable,
  onEdit,
  primaryColor,
}: {
  label: string;
  editable?: boolean;
  onEdit?: () => void;
  primaryColor?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
        {label}
      </h4>
      {editable && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-medium transition-colors hover:opacity-80 inline-flex items-center gap-1"
          style={{ color: primaryColor }}
          title="Editar"
          aria-label={`Editar ${label.toLowerCase()}`}
        >
          <Pencil className="w-3 h-3" />
          Editar
        </button>
      )}
    </div>
  );
}

function InfoItem({
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
