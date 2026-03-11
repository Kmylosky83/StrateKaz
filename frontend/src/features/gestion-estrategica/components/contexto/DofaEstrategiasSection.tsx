/**
 * DofaEstrategiasSection - Wrapper que fusiona DOFA + TOWS
 * Sub-tabs: Matriz DOFA | Estrategias TOWS
 *
 * Parte de la reorganización REORG-C: 6 secciones → 3
 */
import { useState } from 'react';
import { Tabs } from '@/components/common';
import { AnalisisDofaSection } from './AnalisisDofaSection';
import { EstrategiasTowsSection } from './EstrategiasTowsSection';

interface DofaEstrategiasSectionProps {
  triggerNewForm?: number;
}

const SUB_TABS = [
  { id: 'dofa', label: 'Matriz DOFA' },
  { id: 'tows', label: 'Estrategias TOWS' },
];

export const DofaEstrategiasSection = ({ triggerNewForm }: DofaEstrategiasSectionProps) => {
  const [activeSubTab, setActiveSubTab] = useState('dofa');

  return (
    <div className="space-y-4">
      <Tabs tabs={SUB_TABS} activeTab={activeSubTab} onChange={setActiveSubTab} variant="pills" />

      {activeSubTab === 'dofa' && <AnalisisDofaSection triggerNewForm={triggerNewForm} />}
      {activeSubTab === 'tows' && <EstrategiasTowsSection triggerNewForm={triggerNewForm} />}
    </div>
  );
};
