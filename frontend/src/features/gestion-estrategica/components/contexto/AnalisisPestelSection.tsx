/**
 * Sección de Análisis PESTEL - Visor de Matriz
 *
 * Solo visualización de la Matriz PESTEL 3x2 (Político, Económico, Social, Tecnológico, Ecológico, Legal).
 * Los análisis PESTEL se crean y alimentan desde el tab de Encuestas (PCI-POAM).
 *
 * Flujo:
 * 1. Encuestas → Crear encuesta PCI-POAM → Quick Create PESTEL → Consolidar respuestas
 * 2. PESTEL (este tab) → Solo visualizar la Matriz con los factores consolidados
 *
 * Las preguntas 53-75 del PCI-POAM clasifican factores externos
 * en las 6 categorías PESTEL automáticamente durante la consolidación.
 */
import { useState, useMemo, useEffect } from 'react';
import { LayoutGrid, Globe2 } from 'lucide-react';
import { Alert } from '@/components/common/Alert';
import { EmptyState } from '@/components/common/EmptyState';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Select } from '@/components/forms/Select';
import { Spinner } from '@/components/common/Spinner';
import { useAnalisisPestel } from '../../hooks/useContexto';
import type { AnalisisPESTEL } from '../../types/contexto.types';
import { PESTELMatrix } from './PESTELMatrix';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import type { ModuleColor } from '@/utils/moduleColors';

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

interface AnalisisPestelSectionProps {
  triggerNewForm?: number;
}

export const AnalisisPestelSection = ({
  triggerNewForm: _triggerNewForm,
}: AnalisisPestelSectionProps) => {
  const [selectedAnalisis, setSelectedAnalisis] = useState<AnalisisPESTEL | null>(null);

  // Color del módulo (sin hardcoding)
  const { color: moduleColor } = useModuleColor('GESTION_ESTRATEGICA');
  const colorClasses = getModuleColorClasses(moduleColor as ModuleColor);

  // Query: todos los análisis PESTEL
  const { data, isLoading, error } = useAnalisisPestel({}, 1, 50);

  // Auto-seleccionar el primer análisis vigente (o el primero disponible)
  useEffect(() => {
    if (data?.results?.length && !selectedAnalisis) {
      const vigente = data.results.find((a) => a.estado === 'vigente');
      setSelectedAnalisis(vigente || data.results[0]);
    }
  }, [data?.results, selectedAnalisis]);

  // Opciones para el selector
  const analisisOptions = useMemo(() => {
    if (!data?.results) return [];
    return data.results.map((a) => ({
      value: a.id.toString(),
      label: `${a.nombre} (${a.periodo})`,
    }));
  }, [data?.results]);

  const handleAnalisisChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const analisisId = parseInt(e.target.value, 10);
    const analisis = data?.results?.find((a) => a.id === analisisId);
    if (analisis) {
      setSelectedAnalisis(analisis);
    }
  };

  if (error) {
    return (
      <Alert
        variant="error"
        title="Error"
        message="Error al cargar los análisis PESTEL. Intente de nuevo."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando análisis PESTEL...</span>
      </div>
    );
  }

  const isEmpty = !data?.results || data.results.length === 0;

  // Estado vacío: no hay análisis PESTEL creados
  if (isEmpty) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={<Globe2 className="h-12 w-12" />}
          title="Sin análisis PESTEL"
          description="Los análisis PESTEL se crean desde el tab de Encuestas. Cree una encuesta PCI-POAM y consolide las respuestas para generar el análisis PESTEL automáticamente."
        />
        <Alert
          variant="info"
          title="Cómo crear un análisis PESTEL"
          message="Vaya al tab 'Encuestas' → Cree una encuesta PCI-POAM → Active y recopile respuestas → Cierre la encuesta → Consolide los resultados. El análisis PESTEL se creará automáticamente con los factores externos clasificados por categoría."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con selector de análisis */}
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <LayoutGrid className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Matriz PESTEL"
        description={selectedAnalisis?.nombre || 'Seleccione un análisis'}
        variant="compact"
        actions={
          <div className="flex items-center gap-3 flex-nowrap">
            <Select
              value={selectedAnalisis?.id?.toString() || ''}
              onChange={handleAnalisisChange}
              options={[{ value: '', label: 'Seleccionar análisis...' }, ...analisisOptions]}
              className="w-72"
            />
          </div>
        }
      />

      {/* Nota informativa */}
      <Alert
        variant="info"
        closable
        message="Los factores PESTEL se alimentan desde las Encuestas PCI-POAM (preguntas 53-75). Para agregar o modificar factores, vaya al tab de Encuestas."
      />

      {/* Matriz PESTEL */}
      {selectedAnalisis ? (
        <PESTELMatrix analisisId={selectedAnalisis.id} readOnly={true} />
      ) : (
        <EmptyState
          icon={<LayoutGrid className="h-12 w-12" />}
          title="Seleccione un análisis"
          description="Elija un análisis PESTEL del selector para ver su matriz de factores."
        />
      )}
    </div>
  );
};

export default AnalisisPestelSection;
