/**
 * Sección: Catálogos Maestros
 *
 * Sub-tabs (underline) por dominio: General, HSEQ, Logística, Organizacional.
 * HSEQ y Logística se muestran solo si sus módulos están habilitados.
 */
import { useState, useMemo } from 'react';
import { PageTabs, type TabItem } from '@/components/layout/PageTabs';
import { useModuleColor } from '@/hooks/useModuleColor';
import { useModuleEnabled } from '@/hooks/useModules';
import {
  CatalogGeneralTab,
  CatalogHSEQTab,
  CatalogLogisticaTab,
  CatalogOrganizacionalTab,
} from './catalogs';

export const CatalogosSection = () => {
  const { color: moduleColor } = useModuleColor('configuracion_plataforma');
  const { isEnabled: hseqEnabled } = useModuleEnabled('gestion_integral');
  const { isEnabled: supplyEnabled } = useModuleEnabled('supply_chain');

  const tabs = useMemo<TabItem[]>(() => {
    const list: TabItem[] = [{ id: 'general', label: 'General' }];
    if (hseqEnabled) list.push({ id: 'hseq', label: 'HSEQ' });
    if (supplyEnabled) list.push({ id: 'logistica', label: 'Logística' });
    list.push({ id: 'organizacional', label: 'Organizacional' });
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
      {safeTab === 'organizacional' && <CatalogOrganizacionalTab moduleColor={moduleColor} />}
    </div>
  );
};
