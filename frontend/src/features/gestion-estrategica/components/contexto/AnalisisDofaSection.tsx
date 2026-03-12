/**
 * Sección de Análisis DOFA - Visor de Matriz
 *
 * Solo visualización de la Matriz DOFA 2x2 (Fortalezas, Debilidades, Oportunidades, Amenazas).
 * Los análisis DOFA se crean y alimentan desde el tab de Encuestas (PCI-POAM o libre).
 *
 * Flujo:
 * 1. Encuestas → Crear encuesta → Quick Create DOFA → Consolidar respuestas
 * 2. DOFA (este tab) → Solo visualizar la Matriz con los factores consolidados
 */
import { useState, useMemo, useEffect } from 'react';
import { LayoutGrid, FileSearch } from 'lucide-react';
import { Alert } from '@/components/common/Alert';
import { EmptyState } from '@/components/common/EmptyState';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Select } from '@/components/forms/Select';
import { Spinner } from '@/components/common/Spinner';
import { useAnalisisDofa } from '../../hooks/useContexto';
import type { AnalisisDOFA } from '../../types/contexto.types';
import { DOFAMatrix } from './DOFAMatrix';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import type { ModuleColor } from '@/utils/moduleColors';

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

interface AnalisisDofaSectionProps {
  triggerNewForm?: number;
}

export const AnalisisDofaSection = ({
  triggerNewForm: _triggerNewForm,
}: AnalisisDofaSectionProps) => {
  const [selectedAnalisis, setSelectedAnalisis] = useState<AnalisisDOFA | null>(null);

  // Color del módulo (sin hardcoding)
  const { color: moduleColor } = useModuleColor('GESTION_ESTRATEGICA');
  const colorClasses = getModuleColorClasses(moduleColor as ModuleColor);

  // Query: todos los análisis DOFA
  const { data, isLoading, error } = useAnalisisDofa({}, 1, 50);

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

  const handleAnalisisChange = (id: string) => {
    const analisis = data?.results?.find((a) => a.id === parseInt(id));
    if (analisis) {
      setSelectedAnalisis(analisis);
    }
  };

  if (error) {
    return (
      <Alert
        variant="error"
        title="Error"
        message="Error al cargar los análisis DOFA. Intente de nuevo."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando análisis DOFA...</span>
      </div>
    );
  }

  const isEmpty = !data?.results || data.results.length === 0;

  // Estado vacío: no hay análisis DOFA creados
  if (isEmpty) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={<FileSearch className="h-12 w-12" />}
          title="Sin análisis DOFA"
          description="Los análisis DOFA se crean desde el tab de Encuestas. Cree una encuesta PCI-POAM y consolide las respuestas para generar el análisis DOFA automáticamente."
        />
        <Alert
          variant="info"
          title="Cómo crear un análisis DOFA"
          message="Vaya al tab 'Encuestas' → Cree una encuesta PCI-POAM → Active y recopile respuestas → Cierre la encuesta → Consolide los resultados. El análisis DOFA se creará automáticamente con los factores identificados."
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
        title="Matriz DOFA"
        description={selectedAnalisis?.nombre || 'Seleccione un análisis'}
        variant="compact"
        actions={
          <div className="flex items-center gap-3 flex-nowrap">
            <Select
              value={selectedAnalisis?.id.toString() || ''}
              onChange={(e) => handleAnalisisChange(e.target.value)}
              options={analisisOptions}
              className="w-72"
            />
          </div>
        }
      />

      {/* Nota informativa */}
      <Alert
        variant="info"
        closable
        message="Los factores DOFA se alimentan desde las Encuestas PCI-POAM. Para agregar o modificar factores, vaya al tab de Encuestas."
      />

      {/* Matriz DOFA */}
      {selectedAnalisis ? (
        <DOFAMatrix analisisId={selectedAnalisis.id} readOnly={true} />
      ) : (
        <EmptyState
          icon={<LayoutGrid className="h-12 w-12" />}
          title="Seleccione un análisis"
          description="Elija un análisis DOFA del selector para ver su matriz de factores."
        />
      )}
    </div>
  );
};

export default AnalisisDofaSection;
