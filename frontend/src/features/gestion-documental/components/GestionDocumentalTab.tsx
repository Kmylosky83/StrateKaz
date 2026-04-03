/**
 * GestionDocumentalTab — Router principal por sección activa.
 *
 * Nueva arquitectura de 5 tabs con narrativa de ciclo de vida:
 *
 *  dashboard     → Centro de control personal (métricas, urgentes, cobertura)
 *  repositorio   → Todos los documentos — buscar, crear, ingestar
 *  en_proceso    → Flujo activo: borradores, firmas pendientes, en revisión
 *  archivo       → Vigentes, historial de versiones, distribución, archivados
 *  configuracion → Tipos de documento, plantillas, biblioteca maestra
 *
 * Nota: "Mis Lecturas" viven exclusivamente en Mi Portal (/mi-portal?tab=lecturas).
 * Las notificaciones de firmas ya apuntan a section=en_proceso.
 */
import { GenericSectionFallback } from '@/components/common';
import type { TipoDocumento, PlantillaDocumento } from '../types/gestion-documental.types';

import { DashboardDocumentalSection } from './DashboardDocumentalSection';
import { RepositorioSection } from './DocumentosSection';
import { EnProcesoSection } from './EnProcesoSection';
import { ArchivoSection } from './ArchivoSection';
import { TiposPlantillasSection } from './TiposPlantillasSection';

const SECTION_KEYS = {
  DASHBOARD: 'dashboard',
  REPOSITORIO: 'repositorio',
  EN_PROCESO: 'en_proceso',
  ARCHIVO: 'archivo',
  CONFIGURACION: 'configuracion',
  // Compatibilidad con secciones antiguas (redirigen a la nueva correcta)
  DOCUMENTOS: 'documentos',
  CONTROL_CAMBIOS: 'control_cambios',
  DISTRIBUCION: 'distribucion',
  TIPOS_DOCUMENTO: 'tipos_documento',
  BIBLIOTECA: 'biblioteca',
} as const;

interface GestionDocumentalTabProps {
  activeSection: string;
  onCreateTipo: () => void;
  onEditTipo: (tipo: TipoDocumento) => void;
  onCreatePlantilla: () => void;
  onEditPlantilla: (plantilla: PlantillaDocumento) => void;
  onCreateDocumento: () => void;
  onEditDocumento: (id: number) => void;
  onViewDocumento: (id: number) => void;
  onFirmar?: (firmaId: number, rolDisplay?: string) => void;
  onRechazar?: (firmaId: number) => void;
  onNavigateToSection?: (section: string) => void;
}

export const GestionDocumentalTab = ({
  activeSection,
  onCreateTipo,
  onEditTipo,
  onCreatePlantilla,
  onEditPlantilla,
  onCreateDocumento,
  onEditDocumento,
  onViewDocumento,
  onFirmar,
  onRechazar,
  onNavigateToSection,
}: GestionDocumentalTabProps) => {
  // Normalizar secciones antiguas a las nuevas para retrocompatibilidad
  // con notificaciones o bookmarks que todavía usen los códigos viejos
  const normalizedSection = normalizeSection(activeSection);

  switch (normalizedSection) {
    case SECTION_KEYS.DASHBOARD:
      return (
        <DashboardDocumentalSection
          onViewDocumento={onViewDocumento}
          onFirmar={onFirmar}
          onNavigateToSection={onNavigateToSection}
        />
      );

    case SECTION_KEYS.REPOSITORIO:
      return (
        <RepositorioSection
          onCreateDocumento={onCreateDocumento}
          onEditDocumento={onEditDocumento}
          onViewDocumento={onViewDocumento}
        />
      );

    case SECTION_KEYS.EN_PROCESO:
      return (
        <EnProcesoSection
          onViewDocumento={onViewDocumento}
          onEditDocumento={onEditDocumento}
          onFirmar={onFirmar}
          onRechazar={onRechazar}
        />
      );

    case SECTION_KEYS.ARCHIVO:
      return <ArchivoSection onViewDocumento={onViewDocumento} />;

    case SECTION_KEYS.CONFIGURACION:
      return (
        <TiposPlantillasSection
          onCreateTipo={onCreateTipo}
          onEditTipo={onEditTipo}
          onCreatePlantilla={onCreatePlantilla}
          onEditPlantilla={onEditPlantilla}
        />
      );

    default:
      return <GenericSectionFallback sectionCode={activeSection} parentName="Gestión Documental" />;
  }
};

/**
 * Mapea secciones antiguas a las nuevas para no romper notificaciones
 * ni links externos que todavía usen los códigos anteriores.
 */
function normalizeSection(section: string): string {
  const LEGACY_MAP: Record<string, string> = {
    documentos: 'repositorio',
    control_cambios: 'en_proceso',
    distribucion: 'archivo',
    tipos_documento: 'configuracion',
    biblioteca: 'configuracion',
  };
  return LEGACY_MAP[section] ?? section;
}
