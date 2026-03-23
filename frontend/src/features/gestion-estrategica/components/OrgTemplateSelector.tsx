/**
 * Selector de Plantillas de Estructura Organizacional
 *
 * Muestra cards con plantillas por industria para que el admin
 * pueda iniciar su estructura organizacional desde un template predefinido.
 *
 * Se muestra SOLO cuando no hay áreas ni cargos configurados (estado vacío).
 *
 * Design System: Card, Button, Badge, DynamicIcon, ConfirmDialog
 */
import { useState } from 'react';
import { Building2, Layers, Users, ArrowRight, PenLine } from 'lucide-react';
import {
  Card,
  Badge,
  Button,
  ConfirmDialog,
  DynamicIcon,
  BrandedSkeleton,
} from '@/components/common';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import type { ModuleColor } from '@/utils/moduleColors';
import { useOrgTemplates, useApplyOrgTemplate, type OrgTemplate } from '../hooks/useOrgTemplates';

// ==================== TYPES ====================

interface OrgTemplateSelectorProps {
  /** Callback cuando el usuario elige crear manualmente */
  onSkip: () => void;
}

// ==================== TEMPLATE CARD ====================

interface TemplateCardProps {
  template: OrgTemplate;
  moduleColor: string;
  onSelect: (template: OrgTemplate) => void;
}

const TemplateCard = ({ template, moduleColor, onSelect }: TemplateCardProps) => {
  const colorClasses = getModuleColorClasses(moduleColor as ModuleColor);

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <div
        className="p-5"
        onClick={() => onSelect(template)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(template);
          }
        }}
      >
        {/* Header con icono */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`p-3 rounded-xl ${colorClasses.badge} flex-shrink-0`}>
            <DynamicIcon name={template.icon} size={28} className={colorClasses.icon} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base leading-tight">
              {template.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{template.description}</p>
          </div>
        </div>

        {/* Conteos */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
            <Layers className="h-4 w-4 text-gray-400" />
            <span className="font-medium">{template.areas_count}</span>
            <span className="text-gray-400">áreas</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="font-medium">{template.cargos_count}</span>
            <span className="text-gray-400">cargos</span>
          </div>
        </div>

        {/* Preview de áreas */}
        <div className="flex flex-wrap gap-1.5">
          {template.areas.slice(0, 5).map((area) => (
            <Badge key={area.code} variant="gray" size="sm">
              {area.name}
            </Badge>
          ))}
          {template.areas.length > 5 && (
            <Badge variant="gray" size="sm">
              +{template.areas.length - 5} más
            </Badge>
          )}
        </div>

        {/* CTA */}
        <div className="mt-4 flex items-center justify-end">
          <span
            className={`text-sm font-medium ${colorClasses.icon} group-hover:underline flex items-center gap-1`}
          >
            Usar plantilla
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Card>
  );
};

// ==================== MAIN COMPONENT ====================

export const OrgTemplateSelector = ({ onSkip }: OrgTemplateSelectorProps) => {
  const { color: moduleColor } = useModuleColor('fundacion');
  const colorClasses = getModuleColorClasses(moduleColor as ModuleColor);

  const { data: templates, isLoading } = useOrgTemplates();
  const applyMutation = useApplyOrgTemplate();

  const [selectedTemplate, setSelectedTemplate] = useState<OrgTemplate | null>(null);

  const handleSelect = (template: OrgTemplate) => {
    setSelectedTemplate(template);
  };

  const handleConfirm = async () => {
    if (!selectedTemplate) return;
    await applyMutation.mutateAsync(selectedTemplate.code);
    setSelectedTemplate(null);
  };

  if (isLoading) {
    return <BrandedSkeleton height="h-64" logoSize="lg" showText />;
  }

  if (!templates || templates.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className={`inline-flex p-3 rounded-xl ${colorClasses.badge} mb-4`}>
          <Building2 className={`h-8 w-8 ${colorClasses.icon}`} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Estructura Organizacional
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Selecciona una plantilla de industria para crear automáticamente las áreas y cargos de tu
          empresa. Después podrás personalizarlos.
        </p>
      </div>

      {/* Grid de templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <TemplateCard
            key={template.code}
            template={template}
            moduleColor={moduleColor}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* Opción manual */}
      <div className="flex justify-center">
        <Button variant="ghost" size="sm" onClick={onSkip} className="text-gray-500">
          <PenLine className="h-4 w-4 mr-2" />
          Prefiero crear manualmente
        </Button>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        onConfirm={handleConfirm}
        title="Aplicar plantilla"
        message={
          selectedTemplate
            ? `¿Aplicar la plantilla "${selectedTemplate.name}"? Se crearán ${selectedTemplate.areas_count} áreas y ${selectedTemplate.cargos_count} cargos en tu organización.`
            : ''
        }
        confirmText={applyMutation.isPending ? 'Aplicando...' : 'Aplicar plantilla'}
        variant="info"
        isLoading={applyMutation.isPending}
      />
    </div>
  );
};
