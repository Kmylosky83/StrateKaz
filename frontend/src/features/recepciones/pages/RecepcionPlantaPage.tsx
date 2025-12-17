/**
 * Pagina Principal de Recepcion en Planta
 *
 * Gestiona recepciones de materia prima en planta con DOS origenes:
 * - Tab "Econorte": Recepciones de recolectores Econorte (agrupan recolecciones)
 * - Tab "Proveedor Externo": Recepciones directas de proveedores de materia prima
 *
 * Cada tab maneja su propio flujo:
 * - Econorte: Seleccionar recolector -> Seleccionar recolecciones -> Pesar -> Confirmar -> STANDBY
 * - Proveedor Externo: Seleccionar proveedor -> Tipo MP -> Acidez (si aplica) -> Pesar -> Confirmar -> STANDBY
 */
import { useState } from 'react';
import { Truck, Building2, Plus } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader, PageTabs } from '@/components/layout';
import type { TabItem } from '@/components/layout/PageTabs';
import { useAuthStore } from '@/store/authStore';
import { CargoCodes } from '@/constants/permissions';

// Sub-paginas de recepcion
import { RecepcionesPage as RecepcionEconortePage } from './RecepcionesPage';
// import { RecepcionProveedorExternoPage } from './RecepcionProveedorExternoPage';

type TabType = 'econorte' | 'proveedor_externo';

interface Tab extends TabItem {
  id: TabType;
  allowedRoles: string[];
}

// Placeholder para recepcion de proveedor externo (a implementar)
const RecepcionProveedorExternoPlaceholder = () => (
  <div className="flex flex-col items-center justify-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
      <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
      Recepcion de Proveedor Externo
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
      Este modulo permite registrar recepciones de materia prima de proveedores externos.
      Soporta 18 tipos de materia prima e integra pruebas de acidez para ACU y Sebo Procesado.
    </p>
    <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
      Disponible proximamente
    </p>
  </div>
);

export default function RecepcionPlantaPage() {
  const user = useAuthStore((state) => state.user);
  const userCargoCode = user?.cargo_code || '';

  // Estado para trigger de nuevo formulario
  const [triggerNewEconorte, setTriggerNewEconorte] = useState(0);
  const [triggerNewProveedor, setTriggerNewProveedor] = useState(0);

  // Definir tabs con permisos (Proveedor Externo primero, luego Econorte)
  const allTabs: Tab[] = [
    {
      id: 'proveedor_externo',
      label: 'Recepcion PV',
      icon: Building2,
      allowedRoles: ['superadmin', 'gerente', CargoCodes.LIDER_LOGISTICA_ECONORTE]
    },
    {
      id: 'econorte',
      label: 'Recepcion Econorte',
      icon: Truck,
      allowedRoles: ['superadmin', 'gerente', CargoCodes.LIDER_LOGISTICA_ECONORTE, CargoCodes.RECOLECTOR_ECONORTE]
    },
  ];

  // Filtrar tabs segun permisos del usuario
  const visibleTabs = allTabs.filter(tab =>
    tab.allowedRoles.includes(userCargoCode) || userCargoCode === 'superadmin'
  );

  // Establecer tab activo inicial (proveedor_externo es el primero)
  const [activeTab, setActiveTab] = useState<TabType>(
    visibleTabs.length > 0 ? visibleTabs[0].id : 'proveedor_externo'
  );

  // Permisos para botones de accion
  const canInitiateEconorte = [CargoCodes.LIDER_LOGISTICA_ECONORTE, 'gerente', 'superadmin'].includes(userCargoCode);
  const canInitiateProveedor = [CargoCodes.LIDER_LOGISTICA_ECONORTE, 'gerente', 'superadmin'].includes(userCargoCode);

  // Handler para nueva recepcion segun tab activo
  const handleNuevaRecepcion = () => {
    if (activeTab === 'econorte') {
      setTriggerNewEconorte(prev => prev + 1);
    } else {
      setTriggerNewProveedor(prev => prev + 1);
    }
  };

  // Determinar si se puede crear recepcion en el tab actual
  const canCreateInCurrentTab = activeTab === 'econorte' ? canInitiateEconorte : canInitiateProveedor;

  // Obtener descripcion segun tab activo
  const getTabDescription = () => {
    if (activeTab === 'proveedor_externo') {
      return 'Recepciones de proveedores externos de materia prima';
    }
    return 'Recepciones de recolectores Econorte';
  };

  // Renderizar contenido segun tab activo
  const renderTabContent = () => {
    switch (activeTab) {
      case 'econorte':
        return (
          <RecepcionEconortePage
            embedded={true}
            triggerNewForm={triggerNewEconorte}
          />
        );
      case 'proveedor_externo':
        return <RecepcionProveedorExternoPlaceholder />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <PageHeader
        title="Recepcion en Planta"
        description={getTabDescription()}
        actions={
          canCreateInCurrentTab && (
            <Button variant="primary" onClick={handleNuevaRecepcion}>
              <Plus className="h-5 w-5 mr-2" />
              Nueva Recepcion
            </Button>
          )
        }
      />

      {/* TABS */}
      {visibleTabs.length > 1 && (
        <PageTabs
          tabs={visibleTabs.map(tab => ({
            id: tab.id,
            label: tab.label,
            icon: tab.icon,
          }))}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as TabType)}
        />
      )}

      {/* CONTENIDO DEL TAB */}
      {renderTabContent()}
    </div>
  );
}

// Named export para uso directo
export { default as RecepcionPlantaPage } from './RecepcionPlantaPage';
