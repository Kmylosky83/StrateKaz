/**
 * Sección placeholder para funcionalidades en desarrollo.
 *
 * Reutilizable para 6 secciones: plantillas_notificacion, automatizaciones,
 * importacion_exportacion, config_indicadores, personalizacion, auditoria_configuracion.
 */
import type { LucideIcon } from 'lucide-react';
import { Construction } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';

interface EmptyStateSectionProps {
  icon: LucideIcon;
  title: string;
  description: string;
  level?: string;
}

export const EmptyStateSection = ({
  icon: Icon,
  title,
  description,
  level,
}: EmptyStateSectionProps) => {
  return (
    <div className="py-8">
      <EmptyState icon={<Icon size={40} />} title={title} description={description} />
      {level && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-400">
          <Construction size={14} />
          <span>Disponible en {level}</span>
        </div>
      )}
    </div>
  );
};
