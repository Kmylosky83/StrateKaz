/**
 * PolicyStatusBadge - Badge reutilizable para estados de políticas
 *
 * Usa STATUS_CONFIG centralizado desde policies.types.ts
 */
import React from 'react';
import { Edit, Eye, CheckCircle, Archive, PenTool, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/common';
import type { PoliticaStatus } from '../../types/policies.types';
import { cn } from '@/lib/utils';

/**
 * Configuración extendida con variantes de Badge
 * Combina STATUS_CONFIG de policies.types.ts con componentes Lucide
 */
export const POLICY_STATUS_UI: Record<
  PoliticaStatus,
  {
    label: string;
    variant: 'gray' | 'warning' | 'info' | 'success' | 'danger';
    icon: LucideIcon;
    description: string;
  }
> = {
  BORRADOR: {
    label: 'Borrador',
    variant: 'gray',
    icon: Edit,
    description: 'Política en edición, no visible para usuarios',
  },
  EN_REVISION: {
    label: 'En Revisión',
    variant: 'warning',
    icon: Eye,
    description: 'En proceso de firma, pendiente de aprobación',
  },
  FIRMADO: {
    label: 'Firmado',
    variant: 'info',
    icon: PenTool,
    description: 'Firmas completadas, listo para enviar al Gestor Documental',
  },
  VIGENTE: {
    label: 'Vigente',
    variant: 'success',
    icon: CheckCircle,
    description: 'Política activa y publicada en el Gestor Documental',
  },
  OBSOLETO: {
    label: 'Obsoleto',
    variant: 'danger',
    icon: Archive,
    description: 'Política reemplazada por una versión más reciente',
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

interface PolicyStatusBadgeProps {
  status: PoliticaStatus;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
}

export const PolicyStatusBadge = React.memo<PolicyStatusBadgeProps>(
  ({ status, size = 'md', showDescription = false }) => {
    const config = POLICY_STATUS_UI[status];
    const Icon = config.icon;

    const badge = (
      <Badge variant={config.variant} size={size}>
        <Icon
          className={cn(
            'mr-1',
            size === 'sm' && 'w-3 h-3',
            size === 'md' && 'w-4 h-4',
            size === 'lg' && 'w-5 h-5'
          )}
        />
        {config.label}
      </Badge>
    );

    if (showDescription) {
      return (
        <div className="flex flex-col gap-1">
          {badge}
          <span className="text-xs text-gray-500">{config.description}</span>
        </div>
      );
    }

    return badge;
  }
);

PolicyStatusBadge.displayName = 'PolicyStatusBadge';
