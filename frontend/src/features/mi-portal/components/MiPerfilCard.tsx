/**
 * MiPerfilCard - Tarjeta de perfil del empleado (read-only)
 * Muestra informacion laboral y de contacto organizada en subsecciones.
 * Usa colores de branding del tenant (NO hardcoded).
 */

import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  AlertCircle,
  Heart,
  Pencil,
  Camera,
} from 'lucide-react';
import { Card, Badge, Avatar, Skeleton } from '@/components/common';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import type { ColaboradorESS } from '../types';

interface MiPerfilCardProps {
  perfil: ColaboradorESS | null | undefined;
  isLoading: boolean;
  onEdit: () => void;
}

export function MiPerfilCard({ perfil, isLoading, onEdit }: MiPerfilCardProps) {
  const { primaryColor } = useBrandingConfig();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-6">
          <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (!perfil) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-amber-500 dark:text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Perfil no vinculado
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
            Tu cuenta aun no tiene un perfil de colaborador asociado. Contacta al administrador para
            vincular tu usuario con un registro de colaborador.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header: Avatar + Nombre + Badge */}
      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* Avatar clickeable para cambiar foto */}
        <button
          type="button"
          onClick={onEdit}
          className="relative group focus:outline-none flex-shrink-0"
          title="Cambiar foto de perfil"
        >
          <Avatar src={perfil.foto_url} alt={perfil.nombre_completo} size="xl" />
          <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
            <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {perfil.nombre_completo}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {perfil.numero_identificacion}
              </p>
            </div>
            <Badge variant={perfil.estado === 'activo' ? 'success' : 'warning'}>
              {perfil.estado}
            </Badge>
          </div>

          {/* ================================================================
              INFORMACION LABORAL
              ================================================================ */}
          <div className="mt-5">
            <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
              Informacion laboral
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <InfoItem icon={Briefcase} label="Cargo" value={perfil.cargo_nombre} />
              <InfoItem icon={User} label="Area" value={perfil.area_nombre} />
              <InfoItem icon={Calendar} label="Fecha de ingreso" value={perfil.fecha_ingreso} />
            </div>
          </div>

          {/* ================================================================
              INFORMACION DE CONTACTO
              ================================================================ */}
          <div className="mt-5">
            <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
              Informacion de contacto
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <InfoItem
                icon={Mail}
                label="Email"
                value={perfil.email_personal || 'Sin email personal'}
              />
              <InfoItem
                icon={Phone}
                label="Telefono"
                value={perfil.celular || perfil.telefono || 'Sin telefono'}
              />
              <InfoItem
                icon={MapPin}
                label="Direccion"
                value={perfil.direccion || 'Sin direccion'}
              />
            </div>
          </div>

          {/* ================================================================
              CONTACTO DE EMERGENCIA
              ================================================================ */}
          {perfil.contacto_emergencia_nombre && (
            <div className="mt-5">
              <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                Contacto de emergencia
              </h4>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                <Heart className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {perfil.contacto_emergencia_nombre}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    {perfil.contacto_emergencia_parentesco} &middot;{' '}
                    {perfil.contacto_emergencia_telefono}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Boton editar con branding color */}
      <div className="mt-5 flex justify-end">
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: primaryColor }}
        >
          <Pencil className="w-3.5 h-3.5" />
          Editar datos personales
        </button>
      </div>
    </Card>
  );
}

// ============================================================================
// HELPER COMPONENT
// ============================================================================

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Briefcase;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
        <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{value}</p>
      </div>
    </div>
  );
}
