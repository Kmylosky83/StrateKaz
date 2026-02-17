/**
 * Sección Tratamientos - Planes de tratamiento y controles
 */
import { Card, EmptyState } from '@/components/common';
import { Shield } from 'lucide-react';

interface TratamientosSectionProps {
  triggerNewForm?: number;
}

export function TratamientosSection({ triggerNewForm }: TratamientosSectionProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <EmptyState
          icon={<Shield className="w-12 h-12" />}
          title="Planes de Tratamiento"
          description="Gestione los planes de tratamiento, controles y acciones para mitigar riesgos identificados."
        />
      </Card>
    </div>
  );
}

export default TratamientosSection;
