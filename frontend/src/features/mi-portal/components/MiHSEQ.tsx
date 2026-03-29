/**
 * MiHSEQ - Tab de HSEQ para contratistas externos
 *
 * Muestra preview cards de las funcionalidades que estaran disponibles:
 * - Induccion SST
 * - Examenes medicos ocupacionales
 * - EPPs asignados
 * - Reporte de condiciones inseguras
 *
 * NOTA: Stub sin backend. Datos reales se conectaran en fases futuras.
 */

import { ShieldCheck, HeartPulse, HardHat, AlertTriangle, Clock } from 'lucide-react';
import { Card } from '@/components/common';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';

const HSEQ_FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Induccion SST',
    description: 'Complete su induccion en Seguridad y Salud en el Trabajo',
  },
  {
    icon: HeartPulse,
    title: 'Examenes medicos',
    description: 'Consulte sus examenes medicos ocupacionales',
  },
  {
    icon: HardHat,
    title: 'EPPs asignados',
    description: 'Verifique sus Elementos de Proteccion Personal',
  },
  {
    icon: AlertTriangle,
    title: 'Reportes',
    description: 'Reporte condiciones inseguras en su area de trabajo',
  },
];

export function MiHSEQ() {
  const { primaryColor } = useBrandingConfig();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {HSEQ_FEATURES.map((feature) => {
        const Icon = feature.icon;
        return (
          <Card key={feature.title} className="p-5 opacity-70">
            <div className="flex items-start gap-4">
              <div
                className="p-2.5 rounded-xl flex-shrink-0"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <Icon className="w-5 h-5" style={{ color: primaryColor }} />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {feature.description}
                </p>
                <div className="flex items-center gap-1.5 mt-2.5 text-xs text-gray-400 dark:text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Proximamente</span>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
