/**
 * Sección Oportunidades - Identificación y aprovechamiento de oportunidades
 */
import { Card, EmptyState } from '@/components/common';
import { TrendingUp } from 'lucide-react';

interface OportunidadesSectionProps {
  triggerNewForm?: number;
}

export function OportunidadesSection({ triggerNewForm }: OportunidadesSectionProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <EmptyState
          icon={<TrendingUp className="w-12 h-12" />}
          title="Registro de Oportunidades"
          description="Identifique y gestione las oportunidades de mejora y crecimiento organizacional."
        />
      </Card>
    </div>
  );
}

export default OportunidadesSection;
