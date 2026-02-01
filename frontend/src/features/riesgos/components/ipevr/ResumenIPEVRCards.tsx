/**
 * ResumenIPEVRCards - Cards de estadisticas IPEVR
 */
import { cn } from '@/utils/cn';
import { FileText, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import type { ResumenIPEVR } from '../../types';

interface ResumenIPEVRCardsProps {
  resumen: ResumenIPEVR | undefined;
  isLoading?: boolean;
  className?: string;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  description?: string;
}

function StatCard({ title, value, icon, color, description }: StatCardProps) {
  return (
    <div className="bg-card rounded-lg border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className={cn('p-2 rounded-lg', color)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="bg-card rounded-lg border p-4 animate-pulse-subtle">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="h-8 w-16 bg-gray-200 rounded" />
        </div>
        <div className="h-10 w-10 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

export function ResumenIPEVRCards({
  resumen,
  isLoading,
  className,
}: ResumenIPEVRCardsProps) {
  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
        <LoadingSkeleton />
        <LoadingSkeleton />
        <LoadingSkeleton />
        <LoadingSkeleton />
      </div>
    );
  }

  if (!resumen) {
    return null;
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      <StatCard
        title="Total Matrices"
        value={resumen.total}
        icon={<FileText className="w-5 h-5 text-blue-600" />}
        color="bg-blue-100"
        description="Identificaciones registradas"
      />
      <StatCard
        title="Vigentes"
        value={resumen.vigentes}
        icon={<CheckCircle className="w-5 h-5 text-green-600" />}
        color="bg-green-100"
        description="Matrices activas"
      />
      <StatCard
        title="Borradores"
        value={resumen.borradores}
        icon={<AlertTriangle className="w-5 h-5 text-yellow-600" />}
        color="bg-yellow-100"
        description="Pendientes de aprobar"
      />
      <StatCard
        title="Total Expuestos"
        value={resumen.total_expuestos}
        icon={<Users className="w-5 h-5 text-purple-600" />}
        color="bg-purple-100"
        description="Trabajadores identificados"
      />
    </div>
  );
}

export default ResumenIPEVRCards;
