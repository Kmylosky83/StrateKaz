/**
 * Sección 2: Cambios en Contexto Externo/Interno (§9.3.2b)
 *
 * Cambios DOFA, nuevos factores, partes interesadas.
 */
import { Globe, Users, BarChart3, FileSearch } from 'lucide-react';
import { KpiCard, KpiCardGrid } from '@/components/common';
import { SeccionISOCard } from '../SeccionISOCard';
import type {
  ModuloConsolidado,
  ResumenContexto,
} from '../../../../../types/revision-direccion.types';

interface Props {
  modulo: ModuloConsolidado<ResumenContexto>;
}

export function ContextoSection({ modulo }: Props) {
  const d = modulo.data;

  return (
    <SeccionISOCard
      seccionNumero="2"
      titulo="Cambios en el Contexto"
      isoRef="§9.3.2b"
      icon={<Globe className="w-5 h-5" />}
      iconColor="text-purple-600 dark:text-purple-400"
      disponible={modulo.disponible}
      detalle={
        d.factores_dofa && d.factores_dofa.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Factores DOFA identificados
            </p>
            <div className="grid grid-cols-2 gap-2">
              {d.factores_dofa.map((f, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <span className="text-xs text-gray-700 dark:text-gray-300 capitalize">
                    {String(f.tipo_factor ?? '').replace('_', ' ')}
                  </span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    {f.cantidad}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : undefined
      }
    >
      <KpiCardGrid columns={2}>
        <KpiCard
          label="Analisis DOFA"
          value={d.analisis_dofa ?? 0}
          icon={<BarChart3 className="w-5 h-5" />}
          color="purple"
        />
        <KpiCard
          label="Analisis PESTEL"
          value={d.analisis_pestel ?? 0}
          icon={<FileSearch className="w-5 h-5" />}
          color="blue"
        />
        <KpiCard
          label="Partes Interesadas"
          value={d.partes_interesadas_total ?? 0}
          icon={<Users className="w-5 h-5" />}
          color="green"
          description={`${d.partes_interesadas_nuevas ?? 0} nuevas en periodo`}
        />
      </KpiCardGrid>
    </SeccionISOCard>
  );
}
