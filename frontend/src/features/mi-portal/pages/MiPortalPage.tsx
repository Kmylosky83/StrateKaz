/**
 * MiPortalPage - Portal del Empleado (ESS)
 * Pagina principal con tabs para cada seccion del autoservicio.
 *
 * INTELIGENTE: Filtra tabs segun tipo de cargo.
 * - Internos: todas las secciones (perfil, vacaciones, permisos, recibos, capacitaciones, evaluacion)
 * - Externos (contratistas, consultores): perfil, documentos, HSEQ, capacitaciones, evaluacion
 *
 * Externos NO ven: vacaciones, permisos, recibos (no aplica para prestacion de servicios)
 * Externos SI ven: documentos (firmar/consultar), HSEQ (SST aplicable), capacitaciones, evaluacion
 */

import { useState, useMemo } from 'react';
import {
  User,
  Calendar,
  FileText,
  DollarSign,
  GraduationCap,
  BarChart3,
  FolderOpen,
  ShieldCheck,
} from 'lucide-react';
import { Tabs, AnimatedPage, Badge, SectionHeader } from '@/components/common';
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
  MisDocumentos,
  MiHSEQ,
} from '../components';
import type { MiPortalTab } from '../types';

/** Tabs que solo aplican a empleados internos (no contratistas) */
const INTERNAL_ONLY_TABS = new Set<MiPortalTab>(['vacaciones', 'permisos', 'recibos']);

/** Tabs que solo aplican a externos (contratistas, consultores) */
const EXTERNAL_ONLY_TABS = new Set<MiPortalTab>(['documentos', 'hseq']);

const ALL_PORTAL_TABS = [
  { id: 'perfil' as const, label: 'Mi perfil', icon: <User className="w-4 h-4" /> },
  { id: 'documentos' as const, label: 'Documentos', icon: <FolderOpen className="w-4 h-4" /> },
  { id: 'hseq' as const, label: 'HSEQ', icon: <ShieldCheck className="w-4 h-4" /> },
  { id: 'vacaciones' as const, label: 'Vacaciones', icon: <Calendar className="w-4 h-4" /> },
  { id: 'permisos' as const, label: 'Permisos', icon: <FileText className="w-4 h-4" /> },
  { id: 'recibos' as const, label: 'Recibos', icon: <DollarSign className="w-4 h-4" /> },
  {
    id: 'capacitaciones' as const,
    label: 'Capacitaciones',
    icon: <GraduationCap className="w-4 h-4" />,
  },
  { id: 'evaluacion' as const, label: 'Evaluación', icon: <BarChart3 className="w-4 h-4" /> },
];

export default function MiPortalPage() {
  const [activeTab, setActiveTab] = useState<MiPortalTab>('perfil');
  const [showEditPerfil, setShowEditPerfil] = useState(false);
  const { data: perfil, isLoading: perfilLoading } = useMiPerfil();
  const { isExterno } = useIsExterno();

  // Filtrar tabs segun tipo de cargo
  const visibleTabs = useMemo(() => {
    if (isExterno) {
      // Externos: ocultar tabs internos (vacaciones, permisos, recibos)
      return ALL_PORTAL_TABS.filter((tab) => !INTERNAL_ONLY_TABS.has(tab.id));
    }
    // Internos: ocultar tabs de externos (documentos, hseq)
    return ALL_PORTAL_TABS.filter((tab) => !EXTERNAL_ONLY_TABS.has(tab.id));
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
              ? 'Consulte su información, documentos, requisitos HSEQ y capacitaciones.'
              : 'Consulte su información, solicite vacaciones y permisos, y revise sus recibos de nómina.'
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

          {safeActiveTab === 'documentos' && isExterno && <MisDocumentos />}
          {safeActiveTab === 'hseq' && isExterno && <MiHSEQ />}
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
