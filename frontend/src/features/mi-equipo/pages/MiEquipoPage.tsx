/**
 * MiEquipoPage - Portal del Jefe (MSS)
 * Pagina principal con tabs para gestionar el equipo.
 */

import { useState } from 'react';
import { Users, ClipboardCheck, BarChart3 } from 'lucide-react';
import { Tabs, AnimatedPage, SectionHeader } from '@/components/common';
import {
  EquipoResumen,
  AprobacionesPendientes,
  EquipoEvaluaciones,
} from '../components';
import type { MiEquipoTab } from '../types';

const EQUIPO_TABS = [
  { id: 'equipo' as const, label: 'Mi equipo', icon: <Users className="w-4 h-4" /> },
  { id: 'aprobaciones' as const, label: 'Aprobaciones', icon: <ClipboardCheck className="w-4 h-4" /> },
  { id: 'evaluaciones' as const, label: 'Evaluaciones', icon: <BarChart3 className="w-4 h-4" /> },
];

export default function MiEquipoPage() {
  const [activeTab, setActiveTab] = useState<MiEquipoTab>('equipo');

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <SectionHeader
          title="Mi Equipo"
          description="Gestione su equipo directo: apruebe solicitudes, revise asistencia y evaluaciones."
        />

        <Tabs
          tabs={EQUIPO_TABS}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as MiEquipoTab)}
          variant="pills"
        />

        <div className="mt-6">
          {activeTab === 'equipo' && <EquipoResumen />}
          {activeTab === 'aprobaciones' && <AprobacionesPendientes />}
          {activeTab === 'evaluaciones' && <EquipoEvaluaciones />}
        </div>
      </div>
    </AnimatedPage>
  );
}
