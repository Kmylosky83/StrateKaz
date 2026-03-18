/**
 * Tab de Gestión Documental - Sistema de Gestión
 *
 * Secciones desde BD (TabSection.code):
 * - tipos_documento: Tipos de Documento y Plantillas
 * - documentos: Constructor y Listado Maestro
 * - control_cambios: Control de Versiones y Firmas
 * - distribucion: Distribución y Control Documental
 *
 * Reutiliza hooks de gestion-estrategica/gestion-documental
 */
import { GenericSectionFallback } from '@/components/common';
import type { TipoDocumento, PlantillaDocumento } from '../types/gestion-documental.types';

import { TiposPlantillasSection } from './TiposPlantillasSection';
import { DocumentosSection } from './DocumentosSection';
import { ControlCambiosSection } from './ControlCambiosSection';
import { DistribucionSection } from './DistribucionSection';
import { BibliotecaSection } from './BibliotecaSection';

const SECTION_KEYS = {
  TIPOS_DOCUMENTO: 'tipos_documento',
  DOCUMENTOS: 'documentos',
  CONTROL_CAMBIOS: 'control_cambios',
  DISTRIBUCION: 'distribucion',
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
}: GestionDocumentalTabProps) => {
  switch (activeSection) {
    case SECTION_KEYS.TIPOS_DOCUMENTO:
      return (
        <TiposPlantillasSection
          onCreateTipo={onCreateTipo}
          onEditTipo={onEditTipo}
          onCreatePlantilla={onCreatePlantilla}
          onEditPlantilla={onEditPlantilla}
        />
      );
    case SECTION_KEYS.DOCUMENTOS:
      return (
        <DocumentosSection
          onCreateDocumento={onCreateDocumento}
          onEditDocumento={onEditDocumento}
          onViewDocumento={onViewDocumento}
        />
      );
    case SECTION_KEYS.CONTROL_CAMBIOS:
      return (
        <ControlCambiosSection
          onViewDocumento={onViewDocumento}
          onFirmar={onFirmar}
          onRechazar={onRechazar}
        />
      );
    case SECTION_KEYS.DISTRIBUCION:
      return <DistribucionSection onViewDocumento={onViewDocumento} />;
    case SECTION_KEYS.BIBLIOTECA:
      return <BibliotecaSection />;
    default:
      return <GenericSectionFallback sectionCode={activeSection} moduleName="Gestion Documental" />;
  }
};
