/**
 * JefePortalSection - Sección "Mi Equipo" en Mi Portal (solo jefes)
 *
 * Se muestra como sección entre el Hero y los Tabs cuando el usuario
 * tiene cargo.is_jefatura=true.
 *
 * Usa endpoint de Core: GET /api/core/mi-equipo-jefe/
 * La relación viene de Fundación: Cargo.parent_cargo (jerarquía org).
 *
 * NO depende de Talent Hub ni del módulo Mi Equipo (RRHH).
 */

import { useQuery } from '@tanstack/react-query';
import { Users, Briefcase } from 'lucide-react';
import { Card, Badge, Skeleton, Avatar } from '@/components/common';
import { api } from '@/lib/api-client';

// ============================================================================
// TYPES
// ============================================================================

interface MiembroEquipo {
  id: number;
  nombre_completo: string;
  email: string;
  cargo_nombre: string | null;
  area_nombre: string | null;
  foto_url: string | null;
  is_active: boolean;
  is_externo: boolean;
  last_login: string | null;
}

// ============================================================================
// HOOK — Endpoint Core (jerarquía de Cargo)
// ============================================================================

function useMiEquipoJefe() {
  return useQuery({
    queryKey: ['mi-equipo-jefe'],
    queryFn: async () => {
      const response = await api.get<MiembroEquipo[]>('/core/mi-equipo-jefe/');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// COMPONENT
// ============================================================================

const MAX_FICHAS = 6;

interface JefePortalSectionProps {
  /** Color primario del branding del tenant. Lo provee el padre para evitar un observer React Query extra. */
  primaryColor: string;
}

export function JefePortalSection({ primaryColor }: JefePortalSectionProps) {
  const { data: equipo, isLoading } = useMiEquipoJefe();

  const totalEquipo = equipo?.length ?? 0;

  // Si no hay equipo y ya cargó, no mostrar la sección
  if (!isLoading && totalEquipo === 0) {
    return null;
  }

  const fichasVisibles = equipo?.slice(0, MAX_FICHAS) ?? [];
  const fichasRestantes = totalEquipo - MAX_FICHAS;

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="w-4 h-4" style={{ color: primaryColor }} />
          Mi Equipo
          {!isLoading && totalEquipo > 0 && (
            <Badge variant="secondary" size="sm">
              {totalEquipo}
            </Badge>
          )}
        </h3>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="w-9 h-9 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {fichasVisibles.map((miembro) => (
            <div
              key={miembro.id}
              className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <Avatar
                src={miembro.foto_url || undefined}
                name={miembro.nombre_completo}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {miembro.nombre_completo}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Briefcase className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{miembro.cargo_nombre}</span>
                </div>
              </div>
              {miembro.is_externo && (
                <Badge variant="info" size="sm">
                  Ext
                </Badge>
              )}
            </div>
          ))}
          {fichasRestantes > 0 && (
            <div className="flex items-center justify-center p-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400">
              +{fichasRestantes} m&aacute;s
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
