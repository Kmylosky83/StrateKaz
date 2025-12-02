/**
 * Página Principal del Módulo EcoNorte
 *
 * Agrupa todos los submódulos de EcoNorte en una sola página con tabs:
 * - Ecoaliados: Gestión de proveedores de material reciclable
 * - Programaciones: Programación de rutas de recolección
 * - Recolecciones: Registro de recolecciones realizadas
 * - Certificados: (Próximamente)
 * - Liquidaciones: (Próximamente)
 *
 * Los botones de acción y controles de vista se muestran en el header
 * según el tab activo.
 */
import { useState, ReactNode } from 'react';
import { Users, Calendar, Truck, FileText, DollarSign, Plus, List } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader, PageTabs } from '@/components/layout';
import type { TabItem } from '@/components/layout/PageTabs';
import { useAuthStore } from '@/store/authStore';

// Importar páginas directamente (ya son lazy en el nivel de ruta)
import { EcoaliadosPage } from '@/features/ecoaliados/pages/EcoaliadosPage';
import { ProgramacionesPage } from '@/features/programaciones/pages/ProgramacionesPage';
import { RecoleccionesPage } from '@/features/recolecciones/pages/RecoleccionesPage';

// Hooks para verificar datos disponibles
import { useProgramacionesEnRuta } from '@/features/recolecciones/api/useRecolecciones';

type TabType = 'ecoaliados' | 'programaciones' | 'recolecciones' | 'certificados' | 'liquidaciones';

interface Tab extends TabItem {
  id: TabType;
  allowedRoles: string[];
}

// Placeholder para módulos próximamente
const ComingSoonPlaceholder = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
      <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
      {title}
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400">
      Este módulo estará disponible próximamente
    </p>
  </div>
);

export default function EcoNortePage() {
  const user = useAuthStore((state) => state.user);
  const userCargoCode = user?.cargo_code || '';

  // Query para verificar programaciones en ruta
  const { data: programacionesEnRuta } = useProgramacionesEnRuta();

  // Definir tabs con permisos
  const allTabs: Tab[] = [
    {
      id: 'ecoaliados',
      label: 'Ecoaliados',
      icon: Users,
      allowedRoles: ['superadmin', 'gerente', 'lider_com_econorte', 'comercial_econorte', 'lider_log_econorte']
    },
    {
      id: 'programaciones',
      label: 'Programaciones',
      icon: Calendar,
      allowedRoles: ['superadmin', 'gerente', 'lider_com_econorte', 'comercial_econorte', 'lider_log_econorte', 'recolector_econorte']
    },
    {
      id: 'recolecciones',
      label: 'Recolecciones',
      icon: Truck,
      allowedRoles: ['superadmin', 'gerente', 'lider_com_econorte', 'lider_log_econorte', 'recolector_econorte']
    },
    {
      id: 'certificados',
      label: 'Certificados',
      icon: FileText,
      allowedRoles: ['superadmin', 'gerente', 'lider_com_econorte', 'comercial_econorte']
    },
    {
      id: 'liquidaciones',
      label: 'Liquidaciones',
      icon: DollarSign,
      allowedRoles: ['superadmin', 'gerente', 'lider_log_econorte']
    },
  ];

  // Filtrar tabs según permisos del usuario
  const visibleTabs = allTabs.filter(tab =>
    tab.allowedRoles.includes(userCargoCode) || userCargoCode === 'superadmin'
  );

  // Establecer tab activo inicial (el primero visible)
  const [activeTab, setActiveTab] = useState<TabType>(
    visibleTabs.length > 0 ? visibleTabs[0].id : 'ecoaliados'
  );

  // Estado de vista para Programaciones
  const [vistaProgramaciones, setVistaProgramaciones] = useState<'tabla' | 'calendario'>('tabla');

  // Refs para disparar acciones en los componentes hijos
  const [triggerNuevoEcoaliado, setTriggerNuevoEcoaliado] = useState(0);
  const [triggerNuevaProgramacion, setTriggerNuevaProgramacion] = useState(0);
  const [triggerRegistrarRecoleccion, setTriggerRegistrarRecoleccion] = useState(0);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as TabType);
  };

  // Permisos por tab
  const isLiderLogistico = userCargoCode === 'lider_log_econorte';
  const canManageEcoaliados = !isLiderLogistico;
  const canCreateProgramacion = ['comercial_econorte', 'lider_com_econorte', 'gerente', 'superadmin', 'coordinador_recoleccion'].includes(userCargoCode);
  const canRegistrarRecoleccion = ['recolector_econorte', 'lider_log_econorte', 'gerente', 'superadmin', 'coordinador_recoleccion'].includes(userCargoCode);
  const hasProgramacionesEnRuta = programacionesEnRuta?.results && programacionesEnRuta.results.length > 0;

  // Controles de vista (solo para Programaciones)
  const ViewToggle = activeTab === 'programaciones' ? (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
      <Button
        variant={vistaProgramaciones === 'tabla' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => setVistaProgramaciones('tabla')}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={vistaProgramaciones === 'calendario' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => setVistaProgramaciones('calendario')}
      >
        <Calendar className="h-4 w-4" />
      </Button>
    </div>
  ) : undefined;

  // Acciones según tab activo
  const getActions = (): ReactNode => {
    switch (activeTab) {
      case 'ecoaliados':
        return canManageEcoaliados ? (
          <Button variant="primary" onClick={() => setTriggerNuevoEcoaliado(prev => prev + 1)}>
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Ecoaliado
          </Button>
        ) : undefined;
      case 'programaciones':
        return canCreateProgramacion ? (
          <Button variant="primary" onClick={() => setTriggerNuevaProgramacion(prev => prev + 1)}>
            <Plus className="h-5 w-5 mr-2" />
            Nueva Programación
          </Button>
        ) : undefined;
      case 'recolecciones':
        return canRegistrarRecoleccion && hasProgramacionesEnRuta ? (
          <Button variant="primary" onClick={() => setTriggerRegistrarRecoleccion(prev => prev + 1)}>
            <Plus className="h-5 w-5 mr-2" />
            Registrar Recolección
          </Button>
        ) : undefined;
      default:
        return undefined;
    }
  };

  // Renderizar contenido según tab activo
  const renderTabContent = () => {
    switch (activeTab) {
      case 'ecoaliados':
        return (
          <EcoaliadosPage
            embedded
            triggerNewForm={triggerNuevoEcoaliado}
          />
        );
      case 'programaciones':
        return (
          <ProgramacionesPage
            embedded
            triggerNewForm={triggerNuevaProgramacion}
            externalViewMode={vistaProgramaciones}
            onViewModeChange={setVistaProgramaciones}
          />
        );
      case 'recolecciones':
        return (
          <RecoleccionesPage
            embedded
            triggerNewForm={triggerRegistrarRecoleccion}
          />
        );
      case 'certificados':
        return <ComingSoonPlaceholder title="Certificados" />;
      case 'liquidaciones':
        return <ComingSoonPlaceholder title="Liquidaciones" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con tabs, controles y acciones */}
      <PageHeader
        title="EcoNorte"
        description="Unidad interna de recolección de material reciclable"
        controls={ViewToggle}
        actions={getActions()}
        tabs={
          <PageTabs
            tabs={visibleTabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        }
      />

      {/* Contenido del tab activo */}
      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
}
