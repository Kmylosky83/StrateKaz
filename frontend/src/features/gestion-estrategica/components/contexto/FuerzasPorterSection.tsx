/**
 * FuerzasPorterSection - Sección para gestión de análisis de 5 Fuerzas de Porter
 *
 * Vista Híbrida: Radar Chart + Diagrama en Cruz
 * - ViewToggle para alternar entre Radar (principal) y Diagrama
 * - SectionHeader con selector de periodo
 * - StatsGrid con métricas clave
 * - PorterRadarChart para visualización de huella competitiva
 * - PorterDiagram para visualización clásica en cruz
 * - Modal para crear/editar fuerzas
 *
 * Gestiona las 5 fuerzas competitivas de Michael Porter:
 * - Rivalidad entre competidores
 * - Amenaza de nuevos entrantes
 * - Amenaza de productos sustitutos
 * - Poder de negociación de proveedores
 * - Poder de negociación de clientes
 */

import { useState, useMemo, useEffect } from 'react';
import { Target, Filter, Plus, Swords, Users, PieChart, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ViewToggle } from '@/components/common/ViewToggle';
import { Select } from '@/components/forms/Select';
import { StatsGrid, StatsGridSkeleton } from '@/components/layout';
import type { StatItem } from '@/components/layout';
import { useFuerzasPorter } from '../../hooks/useContexto';
import type { FuerzaPorter, TipoFuerzaPorter } from '../../types/contexto.types';
import { PorterRadarChart } from './PorterRadarChart';
import { PorterDiagram } from './PorterDiagram';
import { FuerzaPorterFormModal } from '../modals/FuerzaPorterFormModal';
import { usePermissions } from '@/hooks/usePermissions';
import { useModuleColor } from '@/hooks/useModuleColor';
import { Modules, Sections } from '@/constants/permissions';
import { getModuleColorClasses } from '@/utils/moduleColors';
import type { ModuleColor } from '@/utils/moduleColors';

// =============================================================================
// TIPOS
// =============================================================================

type ViewMode = 'radar' | 'diagrama';

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

interface FuerzasPorterSectionProps {
  triggerNewForm?: number;
}

export const FuerzasPorterSection = ({ triggerNewForm }: FuerzasPorterSectionProps) => {
  const currentYear = new Date().getFullYear();
  const [viewMode, setViewMode] = useState<ViewMode>('radar');
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>(currentYear.toString());
  const [selectedFuerza, setSelectedFuerza] = useState<FuerzaPorter | null>(null);
  const [preselectedTipo, setPreselectedTipo] = useState<TipoFuerzaPorter | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  // RBAC: Verificar permisos del usuario
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.PLANEACION_ESTRATEGICA, Sections.ANALISIS_CONTEXTO, 'create');
  const canEdit = canDo(Modules.PLANEACION_ESTRATEGICA, Sections.ANALISIS_CONTEXTO, 'edit');

  // Color del modulo (sin hardcoding)
  const { color: moduleColor } = useModuleColor('GESTION_ESTRATEGICA');
  const colorClasses = getModuleColorClasses(moduleColor as ModuleColor);

  // Queries
  const { data, isLoading } = useFuerzasPorter({ periodo: selectedPeriodo }, 1, 10);

  // Generar opciones de periodo (últimos 5 años + próximo año)
  const periodoOptions = useMemo(() => {
    const years = [];
    for (let i = -3; i <= 2; i++) {
      const year = currentYear + i;
      years.push({ value: year.toString(), label: year.toString() });
    }
    return years;
  }, [currentYear]);

  // Calcular estadísticas para StatsGrid
  const porterStats: StatItem[] = useMemo(() => {
    const fuerzas = data?.results || [];
    const configuradas = fuerzas.length;
    const pendientes = 5 - configuradas;

    const distribNivel = {
      alto: fuerzas.filter((f) => f.nivel === 'alto').length,
      medio: fuerzas.filter((f) => f.nivel === 'medio').length,
      bajo: fuerzas.filter((f) => f.nivel === 'bajo').length,
    };

    // Intensidad competitiva promedio
    const intensidadPromedio =
      fuerzas.length > 0
        ? Math.round(
            fuerzas.reduce((sum, f) => {
              const val = f.nivel === 'alto' ? 80 : f.nivel === 'medio' ? 50 : 20;
              return sum + val;
            }, 0) / fuerzas.length
          )
        : 0;

    return [
      {
        label: 'Fuerzas Configuradas',
        value: `${configuradas}/5`,
        icon: Target,
        iconColor: configuradas === 5 ? 'success' : 'warning',
        description: pendientes > 0 ? `${pendientes} pendientes` : 'Completo',
      },
      {
        label: 'Nivel Alto',
        value: distribNivel.alto,
        icon: Swords,
        iconColor: 'danger',
        description: 'Fuerzas de alto impacto',
      },
      {
        label: 'Nivel Medio',
        value: distribNivel.medio,
        icon: Filter,
        iconColor: 'warning',
        description: 'Impacto moderado',
      },
      {
        label: 'Intensidad Competitiva',
        value: `${intensidadPromedio}%`,
        icon: Users,
        iconColor: intensidadPromedio >= 70 ? 'danger' : 'info',
        description: 'Promedio de todas las fuerzas',
      },
    ];
  }, [data]);

  // Handlers
  const handleEditFuerza = (fuerza: FuerzaPorter) => {
    if (!canEdit) {
      setAlertMessage({
        type: 'warning',
        message: 'No tiene permisos para editar fuerzas',
      });
      return;
    }
    setSelectedFuerza(fuerza);
    setPreselectedTipo(null);
    setIsModalOpen(true);
  };

  const handleConfigureFuerza = (tipo: TipoFuerzaPorter) => {
    if (!canCreate) {
      setAlertMessage({
        type: 'warning',
        message: 'No tiene permisos para crear fuerzas',
      });
      return;
    }
    setSelectedFuerza(null);
    setPreselectedTipo(tipo);
    setIsModalOpen(true);
  };

  const handleNewFuerza = () => {
    if (!canCreate) {
      setAlertMessage({
        type: 'warning',
        message: 'No tiene permisos para crear fuerzas',
      });
      return;
    }
    setSelectedFuerza(null);
    setPreselectedTipo(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFuerza(null);
    setPreselectedTipo(null);
  };

  // Trigger de modal externo (desde header)
  useEffect(() => {
    if (triggerNewForm && triggerNewForm > 0) {
      handleNewFuerza();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerNewForm]);

  return (
    <div className="space-y-6">
      {/* Alerta de feedback */}
      {alertMessage && (
        <Alert
          variant={alertMessage.type}
          message={alertMessage.message}
          closable
          onClose={() => setAlertMessage(null)}
        />
      )}

      {/* Estadísticas */}
      {isLoading ? (
        <StatsGridSkeleton count={4} />
      ) : (
        <StatsGrid stats={porterStats} columns={4} moduleColor={moduleColor} />
      )}

      {/* Section Header con ViewToggle */}
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <Target className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Porter"
        description="Evalúa las 5 fuerzas competitivas que determinan la intensidad de la competencia"
        variant="compact"
        actions={
          <div className="flex items-center gap-3 flex-nowrap">
            <Select
              value={selectedPeriodo}
              onChange={(e) => setSelectedPeriodo(e.target.value)}
              options={periodoOptions}
              className="w-32"
            />

            {/* ViewToggle */}
            <ViewToggle
              value={viewMode}
              onChange={setViewMode}
              options={[
                { value: 'radar', label: 'Radar', icon: PieChart },
                { value: 'diagrama', label: 'Diagrama', icon: LayoutGrid },
              ]}
              moduleColor={moduleColor as 'purple' | 'blue' | 'green' | 'orange' | 'gray'}
            />

            {canCreate && (
              <Button onClick={handleNewFuerza} variant="primary" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Fuerza
              </Button>
            )}
          </div>
        }
      />

      {/* Contenido según vista */}
      {viewMode === 'radar' ? (
        <PorterRadarChart
          periodo={selectedPeriodo}
          onEditFuerza={handleEditFuerza}
          onConfigureFuerza={handleConfigureFuerza}
          readOnly={!canEdit}
        />
      ) : (
        <PorterDiagram
          periodo={selectedPeriodo}
          onEditFuerza={handleEditFuerza}
          readOnly={!canEdit}
        />
      )}

      {/* Modal de formulario */}
      <FuerzaPorterFormModal
        fuerza={selectedFuerza}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        defaultPeriodo={selectedPeriodo}
        tipoPreselected={preselectedTipo}
      />
    </div>
  );
};

export default FuerzasPorterSection;
