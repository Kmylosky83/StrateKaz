/**
 * Ejemplo de uso de ContextoOrganizacionalTab
 * Sistema de Gestión Grasas y Huesos del Norte
 *
 * ARCHIVO DE EJEMPLO - NO USAR EN PRODUCCIÓN
 */
import { useState } from 'react';
import { ContextoOrganizacionalTab } from './ContextoOrganizacionalTab';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { FileText, Download, Settings } from 'lucide-react';

/**
 * Ejemplo 1: Uso básico
 */
export function BasicExample() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Contexto Organizacional</h1>
      <ContextoOrganizacionalTab />
    </div>
  );
}

/**
 * Ejemplo 2: Con PageHeader y acciones
 */
export function WithHeaderExample() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Contexto Organizacional"
        description="Gestión de análisis DOFA, TOWS, PESTEL y Porter"
        icon={<FileText className="h-6 w-6" />}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<Settings className="h-4 w-4" />}>
              Configuración
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Download className="h-4 w-4" />}>
              Exportar Todo
            </Button>
          </div>
        }
      />

      <ContextoOrganizacionalTab />
    </div>
  );
}

/**
 * Ejemplo 3: Con control de sección desde página padre
 */
export function WithSectionControlExample() {
  const [activeSection, setActiveSection] = useState<string>('dofa');

  return (
    <div className="space-y-6">
      <Card padding="sm">
        <div className="flex gap-2">
          <Button
            variant={activeSection === 'dofa' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveSection('dofa')}
          >
            DOFA
          </Button>
          <Button
            variant={activeSection === 'tows' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveSection('tows')}
          >
            TOWS
          </Button>
          <Button
            variant={activeSection === 'pestel' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveSection('pestel')}
          >
            PESTEL
          </Button>
          <Button
            variant={activeSection === 'porter' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveSection('porter')}
          >
            Porter
          </Button>
        </div>
      </Card>

      <ContextoOrganizacionalTab activeSection={activeSection} />
    </div>
  );
}

/**
 * Ejemplo 4: Integrado en layout de página completa
 */
export function FullPageExample() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header de la página */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <PageHeader
            title="Motor de Riesgos"
            description="Gestión integral de riesgos empresariales"
            icon={<FileText className="h-6 w-6" />}
          />
        </div>
      </div>

      {/* Breadcrumbs (opcional) */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-3">
          <nav className="text-sm text-gray-600 dark:text-gray-400">
            <span>Inicio</span>
            <span className="mx-2">/</span>
            <span>Motor de Riesgos</span>
            <span className="mx-2">/</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              Contexto Organizacional
            </span>
          </nav>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto px-4 py-6">
        <ContextoOrganizacionalTab />
      </div>
    </div>
  );
}

/**
 * Ejemplo 5: Con tabs de nivel superior (módulo completo)
 */
export function WithModuleTabsExample() {
  const [moduleTab, setModuleTab] = useState<'contexto' | 'ipevr' | 'controles'>('contexto');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Motor de Riesgos"
        description="Sistema integrado de gestión de riesgos"
      />

      {/* Tabs de nivel módulo */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setModuleTab('contexto')}
            className={`
              inline-flex items-center gap-2 px-1 py-3 border-b-2 font-medium text-sm
              ${
                moduleTab === 'contexto'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }
            `}
          >
            Contexto Organizacional
          </button>
          <button
            onClick={() => setModuleTab('ipevr')}
            className={`
              inline-flex items-center gap-2 px-1 py-3 border-b-2 font-medium text-sm
              ${
                moduleTab === 'ipevr'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }
            `}
          >
            IPEVR / GTC-45
          </button>
          <button
            onClick={() => setModuleTab('controles')}
            className={`
              inline-flex items-center gap-2 px-1 py-3 border-b-2 font-medium text-sm
              ${
                moduleTab === 'controles'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }
            `}
          >
            Controles
          </button>
        </nav>
      </div>

      {/* Contenido según tab activo */}
      {moduleTab === 'contexto' && <ContextoOrganizacionalTab />}
      {moduleTab === 'ipevr' && <div>IPEVR Tab (por implementar)</div>}
      {moduleTab === 'controles' && <div>Controles Tab (por implementar)</div>}
    </div>
  );
}

/**
 * Ejemplo 6: Con integración de DynamicSections
 * (Patrón usado en el proyecto para manejar secciones desde BD)
 */
export function WithDynamicSectionsExample() {
  // Simula datos que vendrían desde DynamicSections
  const sections = [
    { code: 'dofa', name: 'Análisis DOFA', order: 1 },
    { code: 'tows', name: 'Estrategias TOWS', order: 2 },
    { code: 'pestel', name: 'Análisis PESTEL', order: 3 },
    { code: 'porter', name: '5 Fuerzas Porter', order: 4 },
  ];

  const [activeSection, setActiveSection] = useState(sections[0].code);

  return (
    <div className="space-y-6">
      {/* Navegación de secciones */}
      <Card padding="none">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {sections.map((section) => (
            <button
              key={section.code}
              onClick={() => setActiveSection(section.code)}
              className={`
                flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${
                  activeSection === section.code
                    ? 'border-primary-600 text-primary-600 bg-primary-50 dark:bg-primary-900/10'
                    : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }
              `}
            >
              {section.name}
            </button>
          ))}
        </div>
      </Card>

      {/* Tab con sección controlada */}
      <ContextoOrganizacionalTab activeSection={activeSection} />
    </div>
  );
}

// Exportar todos los ejemplos para storybook o desarrollo
export default {
  BasicExample,
  WithHeaderExample,
  WithSectionControlExample,
  FullPageExample,
  WithModuleTabsExample,
  WithDynamicSectionsExample,
};
