/**
 * MiPortalPage - Portal del Empleado (ESS)
 * Pagina principal con tabs para cada seccion del autoservicio.
 */

import { useState } from 'react';
import {
  User,
  Calendar,
  FileText,
  DollarSign,
  GraduationCap,
  BarChart3,
} from 'lucide-react';
import { Tabs, AnimatedPage } from '@/components/common';
import { SectionHeader } from '@/components/common';
import { useMiPerfil } from '../api/miPortalApi';
import {
  MiPerfilCard,
  MiPerfilEditForm,
  VacacionesSaldo,
  PermisoSolicitar,
  RecibosNomina,
  CapacitacionesList,
  EvaluacionResumen,
} from '../components';
import type { MiPortalTab } from '../types';

const PORTAL_TABS = [
  { id: 'perfil' as const, label: 'Mi perfil', icon: <User className="w-4 h-4" /> },
  { id: 'vacaciones' as const, label: 'Vacaciones', icon: <Calendar className="w-4 h-4" /> },
  { id: 'permisos' as const, label: 'Permisos', icon: <FileText className="w-4 h-4" /> },
  { id: 'recibos' as const, label: 'Recibos', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'capacitaciones' as const, label: 'Capacitaciones', icon: <GraduationCap className="w-4 h-4" /> },
  { id: 'evaluacion' as const, label: 'Evaluacion', icon: <BarChart3 className="w-4 h-4" /> },
];

export default function MiPortalPage() {
  const [activeTab, setActiveTab] = useState<MiPortalTab>('perfil');
  const [showEditPerfil, setShowEditPerfil] = useState(false);
  const { data: perfil, isLoading: perfilLoading } = useMiPerfil();

  return (
    <AnimatedPage>
      <div className="space-y-6">
        {/* Header */}
        <SectionHeader
          title="Mi Portal"
          description="Consulte su informacion, solicite vacaciones y permisos, y revise sus recibos de nomina."
        />

        {/* Tabs */}
        <Tabs
          tabs={PORTAL_TABS}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as MiPortalTab)}
          variant="pills"
        />

        {/* Contenido por tab */}
        <div className="mt-6">
          {activeTab === 'perfil' && (
            <MiPerfilCard
              perfil={perfil}
              isLoading={perfilLoading}
              onEdit={() => setShowEditPerfil(true)}
            />
          )}

          {activeTab === 'vacaciones' && <VacacionesSaldo />}
          {activeTab === 'permisos' && <PermisoSolicitar />}
          {activeTab === 'recibos' && <RecibosNomina />}
          {activeTab === 'capacitaciones' && <CapacitacionesList />}
          {activeTab === 'evaluacion' && <EvaluacionResumen />}
        </div>

        {/* Modal editar perfil */}
        <MiPerfilEditForm
          isOpen={showEditPerfil}
          onClose={() => setShowEditPerfil(false)}
          perfil={perfil}
        />
      </div>
    </AnimatedPage>
  );
}
