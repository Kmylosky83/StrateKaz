/**
 * TabProfesionales — Gestión de profesionales vinculados a la firma consultora
 *
 * Visible solo para: CONSULTOR
 *
 * Permite a la firma consultora:
 * - Ver todos los profesionales colocados en la empresa cliente
 * - Ver su estado (activo/inactivo), último acceso, cargo
 * - Desactivar/reactivar credenciales para proteger acceso cuando un profesional se va
 */
import { useState } from 'react';
import {
  Users,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  UserCheck,
  UserX,
} from 'lucide-react';
import { Badge, Button, Card, Skeleton } from '@/components/common';
import { ConfirmModal } from '@/components/modals';
import { useMisProfesionales, useToggleEstadoProfesional } from '../hooks/useMiEmpresa';
import type { ProfesionalProveedor } from '../types';
import { toast } from 'sonner';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Nunca';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Nunca';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ProfesionalCard({
  profesional,
  onToggle,
  isToggling,
}: {
  profesional: ProfesionalProveedor;
  onToggle: (p: ProfesionalProveedor) => void;
  isToggling: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              profesional.is_active
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-red-100 dark:bg-red-900/30'
            }`}
          >
            {profesional.is_active ? (
              <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <UserX className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {profesional.full_name || profesional.username}
              </p>
              {profesional.es_yo && (
                <Badge variant="info" size="sm">
                  Tú
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{profesional.email}</p>
          </div>
        </div>

        {/* Status + Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={profesional.is_active ? 'success' : 'error'} size="sm">
            {profesional.is_active ? 'Activo' : 'Inactivo'}
          </Badge>
          {!profesional.es_yo && (
            <Button
              variant={profesional.is_active ? 'ghost' : 'outline'}
              size="sm"
              onClick={() => onToggle(profesional)}
              disabled={isToggling}
              title={profesional.is_active ? 'Desactivar acceso' : 'Reactivar acceso'}
            >
              {profesional.is_active ? (
                <XCircle className="w-4 h-4 text-red-500" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Detalles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        {profesional.cargo_name && (
          <div>
            <span className="text-gray-400 block">Cargo</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {profesional.cargo_name}
            </span>
          </div>
        )}
        <div>
          <span className="text-gray-400 block">Último acceso</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {formatDateTime(profesional.last_login)}
          </span>
        </div>
        <div>
          <span className="text-gray-400 block">Registrado</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {formatDate(profesional.date_joined)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function TabProfesionales() {
  const { data: profesionales, isLoading } = useMisProfesionales();
  const toggleMutation = useToggleEstadoProfesional();
  const [confirmTarget, setConfirmTarget] = useState<ProfesionalProveedor | null>(null);

  const handleToggle = (profesional: ProfesionalProveedor) => {
    setConfirmTarget(profesional);
  };

  const confirmToggle = () => {
    if (!confirmTarget) return;
    toggleMutation.mutate(confirmTarget.id, {
      onSuccess: (data) => {
        toast.success(data.detail);
        setConfirmTarget(null);
      },
      onError: () => {
        toast.error('Error al cambiar el estado del profesional.');
        setConfirmTarget(null);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const lista = profesionales ?? [];

  if (lista.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No hay profesionales vinculados a tu empresa.
        </p>
      </div>
    );
  }

  const activos = lista.filter((p) => p.is_active).length;
  const inactivos = lista.length - activos;

  return (
    <div className="space-y-4">
      {/* Alerta informativa */}
      <div className="flex items-start gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
        <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-purple-700 dark:text-purple-300">
          Gestiona los accesos de los profesionales que tu empresa ha colocado. Cuando un
          profesional se retire, desactiva su acceso para proteger la seguridad de la información.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{lista.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activos}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Activos</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{inactivos}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Inactivos</p>
        </Card>
      </div>

      {/* Alerta si hay inactivos */}
      {inactivos > 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Hay {inactivos} profesional{inactivos > 1 ? 'es' : ''} con acceso desactivado. Puedes
            reactivarlos si es necesario.
          </p>
        </div>
      )}

      {/* Lista de profesionales */}
      <div className="space-y-3">
        {lista.map((profesional) => (
          <ProfesionalCard
            key={profesional.id}
            profesional={profesional}
            onToggle={handleToggle}
            isToggling={toggleMutation.isPending}
          />
        ))}
      </div>

      {/* Nota de seguridad */}
      <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <Clock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Los cambios de estado se aplican de forma inmediata. Un profesional desactivado no podrá
          iniciar sesión hasta que se reactive su acceso.
        </p>
      </div>

      {/* Confirm Modal */}
      {confirmTarget && (
        <ConfirmModal
          isOpen={!!confirmTarget}
          onClose={() => setConfirmTarget(null)}
          onConfirm={confirmToggle}
          title={confirmTarget.is_active ? 'Desactivar Profesional' : 'Reactivar Profesional'}
          message={
            confirmTarget.is_active
              ? `¿Deseas desactivar el acceso de ${confirmTarget.full_name || confirmTarget.email}? No podrá iniciar sesión hasta que lo reactives.`
              : `¿Deseas reactivar el acceso de ${confirmTarget.full_name || confirmTarget.email}? Podrá iniciar sesión nuevamente.`
          }
          confirmLabel={confirmTarget.is_active ? 'Desactivar' : 'Reactivar'}
          variant={confirmTarget.is_active ? 'danger' : 'success'}
          isLoading={toggleMutation.isPending}
        />
      )}
    </div>
  );
}
