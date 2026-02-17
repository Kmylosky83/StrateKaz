/**
 * Sección Riesgos - Identificación y gestión de riesgos organizacionales
 */
import { Card, EmptyState } from '@/components/common';
import { AlertTriangle } from 'lucide-react';

interface RiesgosSectionProps {
  triggerNewForm?: number;
}

export function RiesgosSection({ triggerNewForm }: RiesgosSectionProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <EmptyState
          icon={<AlertTriangle className="w-12 h-12" />}
          title="Registro de Riesgos"
          description="Identifique y gestione los riesgos organizacionales según ISO 31000 / ISO 9001:2015 Cláusula 6.1."
        />
      </Card>
    </div>
  );
}

export default RiesgosSection;
