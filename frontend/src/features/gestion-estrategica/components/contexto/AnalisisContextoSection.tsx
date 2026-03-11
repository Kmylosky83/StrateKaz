/**
 * AnalisisContextoSection - Wrapper que fusiona 3 herramientas de análisis
 * Sub-tabs: Encuestas PCI/POAM | Análisis PESTEL | Fuerzas de Porter
 *
 * Parte de la reorganización REORG-C: 6 secciones → 3
 */
import { useState } from 'react';
import { Tabs } from '@/components/common';
import { EncuestasDofaSection } from './EncuestasDofaSection';
import { AnalisisPestelSection } from './AnalisisPestelSection';
import { FuerzasPorterSection } from './FuerzasPorterSection';

interface AnalisisContextoSectionProps {
  triggerNewForm?: number;
}

const SUB_TABS = [
  { id: 'encuestas', label: 'Encuestas PCI / POAM' },
  { id: 'pestel', label: 'Análisis PESTEL' },
  { id: 'porter', label: 'Fuerzas de Porter' },
];

export const AnalisisContextoSection = ({ triggerNewForm }: AnalisisContextoSectionProps) => {
  const [activeSubTab, setActiveSubTab] = useState('encuestas');

  return (
    <div className="space-y-4">
      <Tabs tabs={SUB_TABS} activeTab={activeSubTab} onChange={setActiveSubTab} variant="pills" />

      {activeSubTab === 'encuestas' && <EncuestasDofaSection triggerNewForm={triggerNewForm} />}
      {activeSubTab === 'pestel' && <AnalisisPestelSection triggerNewForm={triggerNewForm} />}
      {activeSubTab === 'porter' && <FuerzasPorterSection triggerNewForm={triggerNewForm} />}
    </div>
  );
};
