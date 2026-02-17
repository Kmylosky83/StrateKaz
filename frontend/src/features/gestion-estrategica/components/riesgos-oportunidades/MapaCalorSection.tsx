/**
 * Sección Mapa de Calor - Riesgos y Oportunidades
 * Visualización matricial de probabilidad vs impacto
 */
import { Card, EmptyState } from '@/components/common';
import { Flame } from 'lucide-react';

interface MapaCalorSectionProps {
  triggerNewForm?: number;
}

export function MapaCalorSection({ triggerNewForm }: MapaCalorSectionProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <EmptyState
          icon={<Flame className="w-12 h-12" />}
          title="Mapa de Calor de Riesgos"
          description="Visualización matricial de probabilidad vs impacto. Los riesgos identificados se posicionarán automáticamente según su evaluación."
        />
      </Card>
    </div>
  );
}

export default MapaCalorSection;
