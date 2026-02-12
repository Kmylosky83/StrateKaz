/**
 * EquipoResumen - Lista de miembros del equipo
 */

import { Users, Briefcase } from 'lucide-react';
import { Card, Badge, Skeleton, EmptyState, Avatar } from '@/components/common';
import { useMiEquipo } from '../api/miEquipoApi';

export function EquipoResumen() {
  const { data: equipo, isLoading } = useMiEquipo();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!equipo || equipo.length === 0) {
    return (
      <EmptyState
        icon={<Users className="w-12 h-12" />}
        title="Sin equipo asignado"
        description="No tiene colaboradores asignados a su equipo."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Users className="w-4 h-4" />
        <span>{equipo.length} miembros</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipo.map((col) => (
          <Card key={col.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <Avatar src={col.foto_url} alt={col.nombre_completo} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {col.nombre_completo}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Briefcase className="w-3 h-3" />
                  <span className="truncate">{col.cargo_nombre}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {col.is_externo && (
                  <Badge variant="info" size="sm">
                    Externo
                  </Badge>
                )}
                <Badge variant={col.estado === 'activo' ? 'success' : 'warning'} size="sm">
                  {col.estado}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
