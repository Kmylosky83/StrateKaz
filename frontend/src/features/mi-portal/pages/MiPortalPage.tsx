/**
 * MiPortalPage - Portal del Empleado (ESS)
 * Pagina principal con tabs para cada seccion del autoservicio.
 *
 * INTELIGENTE: Filtra tabs segun tipo de cargo.
 * - Internos: ven todas las secciones (perfil, vacaciones, permisos, recibos, capacitaciones, evaluacion)
 * - Externos (contratistas, consultores): solo ven perfil, capacitaciones, evaluacion
 */

import { useState, useMemo } from 'react';
import { User, Calendar, FileText, DollarSign, GraduationCap, BarChart3 } from 'lucide-react';
import { Tabs, AnimatedPage, Badge } from '@/components/common';
import { SectionHeader } from '@/components/common';
import { useIsExterno } from '@/hooks/useIsExterno';
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

/** Tabs que solo aplican a empleados internos */
const INTERNAL_ONLY_TABS = new Set<MiPortalTab>(['vacaciones', 'permisos', 'recibos']);

const ALL_PORTAL_TABS = [
  { id: 'perfil' as const, label: 'Mi perfil', icon: <User className="w-4 h-4" /> },
  { id: 'vacaciones' as const, label: 'Vacaciones', icon: <Calendar className="w-4 h-4" /> },
  { id: 'permisos' as const, label: 'Permisos', icon: <FileText className="w-4 h-4" /> },
  { id: 'recibos' as const, label: 'Recibos', icon: <DollarSign className="w-4 h-4" /> },
  {
    id: 'capacitaciones' as const,
    label: 'Capacitaciones',
    icon: <GraduationCap className="w-4 h-4" />,
  },
  { id: 'evaluacion' as const, label: 'Evaluacion', icon: <BarChart3 className="w-4 h-4" /> },
];

export default function MiPortalPage() {
  const [activeTab, setActiveTab] = useState<MiPortalTab>('perfil');
  const [showEditPerfil, setShowEditPerfil] = useState(false);
  const { data: perfil, isLoading: perfilLoading } = useMiPerfil();
  const { isExterno } = useIsExterno();

  // Filtrar tabs segun tipo de cargo
  const visibleTabs = useMemo(() => {
    if (!isExterno) return ALL_PORTAL_TABS;
    return ALL_PORTAL_TABS.filter((tab) => !INTERNAL_ONLY_TABS.has(tab.id));
  }, [isExterno]);

  // Si el tab activo fue filtrado, volver a 'perfil'
  const safeActiveTab = visibleTabs.some((t) => t.id === activeTab) ? activeTab : 'perfil';

  return (
    <AnimatedPage>
      <div className="space-y-6">
        {/* Header */}
        <SectionHeader
          title="Mi Portal"
          description={
            isExterno
              ? 'Consulte su informacion, capacitaciones y evaluaciones.'
              : 'Consulte su informacion, solicite vacaciones y permisos, y revise sus recibos de nomina.'
          }
        />

        {/* Badge de tipo de vinculacion */}
        {isExterno && (
          <Badge variant="info" size="sm">
            Colaborador Externo
          </Badge>
        )}

        {/* Tabs */}
        <Tabs
          tabs={visibleTabs}
          activeTab={safeActiveTab}
          onChange={(tab) => setActiveTab(tab as MiPortalTab)}
          variant="pills"
        />

        {/* Contenido por tab */}
        <div className="mt-6">
          {safeActiveTab === 'perfil' && (
            <MiPerfilCard
              perfil={perfil}
              isLoading={perfilLoading}
              onEdit={() => setShowEditPerfil(true)}
            />
          )}

          {safeActiveTab === 'vacaciones' && !isExterno && <VacacionesSaldo />}
          {safeActiveTab === 'permisos' && !isExterno && <PermisoSolicitar />}
          {safeActiveTab === 'recibos' && !isExterno && <RecibosNomina />}
          {safeActiveTab === 'capacitaciones' && <CapacitacionesList />}
          {safeActiveTab === 'evaluacion' && <EvaluacionResumen />}
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
