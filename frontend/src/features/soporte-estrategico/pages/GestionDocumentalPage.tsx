/**
 * Pagina de Gestion Documental - Tab de Soporte Estrategico
 *
 * Secciones (desde BD):
 * - tipos: Tipos de documento
 * - documentos: Documentos del sistema
 * - plantillas: Plantillas de documentos
 * - control: Control de documentos
 */
import { useState, useEffect } from 'react';
import { FileText, FolderOpen, FileType, ClipboardCheck } from 'lucide-react';
import { PageHeader, StatsGrid } from '@/components/layout';
import type { StatItem } from '@/components/layout';
import { DynamicSections, GenericSectionFallback } from '@/components/common';
import { useTabSections } from '@/features/gestion-estrategica/hooks/useModules';
import { useModuleColor } from '@/hooks/useModuleColor';

const MODULE_CODE = 'soporte_estrategico';
const TAB_CODE = 'gestion_documental';

export const GestionDocumentalPage = () => {
  const { color: moduleColor } = useModuleColor('SOPORTE_ESTRATEGICO');
  const { sections, isLoading: sectionsLoading } = useTabSections(MODULE_CODE, TAB_CODE);

  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    if (sections.length > 0 && !activeSection) {
      setActiveSection(sections[0].code);
    }
  }, [sections, activeSection]);

  const statsItems: StatItem[] = [
    {
      label: 'Tipos de Documento',
      value: '-',
      icon: FolderOpen,
      iconColor: 'info',
      description: 'Categorias definidas',
    },
    {
      label: 'Documentos',
      value: '-',
      icon: FileText,
      iconColor: 'success',
      description: 'Documentos activos',
    },
    {
      label: 'Plantillas',
      value: '-',
      icon: FileType,
      iconColor: 'warning',
      description: 'Plantillas disponibles',
    },
    {
      label: 'Pendientes',
      value: '-',
      icon: ClipboardCheck,
      iconColor: 'error',
      description: 'Por revisar/aprobar',
    },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'tipos':
      case 'documentos':
      case 'plantillas':
      case 'control':
        return (
          <GenericSectionFallback
            sectionCode={activeSection}
            parentName="Gestion Documental"
          />
        );
      default:
        return (
          <GenericSectionFallback
            sectionCode={activeSection || 'ninguna'}
            parentName="Gestion Documental"
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion Documental"
        description="Control y gestion de documentos del sistema de gestion (ISO 9001:2015 Clausula 7.5)"
      />

      <DynamicSections
        sections={sections}
        activeSection={activeSection}
        onChange={setActiveSection}
        isLoading={sectionsLoading}
        moduleColor={moduleColor}
        variant="pills"
      />

      <StatsGrid stats={statsItems} columns={4} moduleColor={moduleColor} />

      <div className="space-y-6">{renderSection()}</div>
    </div>
  );
};

export default GestionDocumentalPage;
