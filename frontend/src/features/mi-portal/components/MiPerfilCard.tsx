/**
 * MiPerfilCard - Tarjeta de perfil del empleado (read-only)
 */

import { User, Mail, Phone, MapPin, Briefcase, Calendar, AlertCircle } from 'lucide-react';
import { Card, Badge, Avatar, Skeleton } from '@/components/common';
import type { ColaboradorESS } from '../types';

interface MiPerfilCardProps {
  perfil: ColaboradorESS | undefined;
  isLoading: boolean;
  onEdit: () => void;
}

export function MiPerfilCard({ perfil, isLoading, onEdit }: MiPerfilCardProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-6">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </Card>
    );
  }

  if (!perfil) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-5 h-5" />
          <p>No tiene un perfil de colaborador asociado.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* Avatar */}
        <Avatar
          src={perfil.foto_url}
          alt={perfil.nombre_completo}
          size="lg"
          className="w-20 h-20"
        />

        {/* Info Principal */}
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Briefcase className="w-4 h-4 text-gray-400" />
              <span>{perfil.cargo_nombre}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <User className="w-4 h-4 text-gray-400" />
              <span>{perfil.area_nombre}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Ingreso: {perfil.fecha_ingreso}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Mail className="w-4 h-4 text-gray-400" />
              <span>{perfil.email_personal || 'Sin email personal'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{perfil.celular || perfil.telefono || 'Sin telefono'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{perfil.direccion || 'Sin direccion'}</span>
            </div>
          </div>

          {/* Contacto de emergencia */}
          {perfil.contacto_emergencia_nombre && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                Contacto de emergencia
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {perfil.contacto_emergencia_nombre} ({perfil.contacto_emergencia_parentesco}) -{' '}
                {perfil.contacto_emergencia_telefono}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Boton editar */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={onEdit}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Editar datos personales
        </button>
      </div>
    </Card>
  );
}
