/**
 * Sección: Catálogos Maestros
 *
 * Sub-tabs (underline) por dominio: General, HSEQ, Logística.
 * HSEQ y Logística se muestran solo si sus módulos están habilitados.
 *
 * 2026-04-22 (H-CAT-01): Eliminado sub-tab "Organizacional". Su único
 * contenido era el CRUD de NormaISO, que es redundante — la administración
 * natural de normas vive en Fundación (Contexto → Partes Interesadas usa
 * NormaISO como M2M). El archivo CatalogOrganizacionalTab.tsx queda huérfano
 * hasta eliminarlo físicamente cuando se valide que ninguna otra UI lo
 * importa.
 */
import { useState, useMemo } from 'react';
import { PageTabs, type TabItem } from '@/components/layout/PageTabs';
import { useModuleColor } from '@/hooks/useModuleColor';
import { useModuleEnabled } from '@/hooks/useModules';
import { CatalogGeneralTab, CatalogHSEQTab, CatalogLogisticaTab } from './catalogs';

export const CatalogosSection = () => {
  const { color: moduleColor } = useModuleColor('configuracion_plataforma');
  const { isEnabled: hseqEnabled } = useModuleEnabled('gestion_integral');
  const { isEnabled: supplyEnabled } = useModuleEnabled('supply_chain');

  const tabs = useMemo<TabItem[]>(() => {
    const list: TabItem[] = [{ id: 'general', label: 'General' }];
    if (hseqEnabled) list.push({ id: 'hseq', label: 'HSEQ' });
    if (supplyEnabled) list.push({ id: 'logistica', label: 'Logística' });
    return list;
  }, [hseqEnabled, supplyEnabled]);

  const [activeTab, setActiveTab] = useState('general');

  // If active tab got hidden (module disabled), fallback to general
  const safeTab = tabs.find((t) => t.id === activeTab) ? activeTab : 'general';

  return (
    <div className="space-y-4">
      <PageTabs
        tabs={tabs}
        activeTab={safeTab}
        onTabChange={setActiveTab}
        variant="underline"
        moduleColor={moduleColor}
        size="sm"
      />

      {safeTab === 'general' && <CatalogGeneralTab moduleColor={moduleColor} />}
      {safeTab === 'hseq' && <CatalogHSEQTab moduleColor={moduleColor} />}
      {safeTab === 'logistica' && <CatalogLogisticaTab moduleColor={moduleColor} />}
    </div>
  );
};
