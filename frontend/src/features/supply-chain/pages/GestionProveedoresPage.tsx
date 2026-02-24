/**
 * Página Principal - Gestión de Proveedores (Supply Chain)
 * Sistema de Gestión StrateKaz
 *
 * Tabs:
 * 1. Proveedores - Lista, crear, editar proveedores
 * 2. Precios - Gestión de precios por tipo materia prima
 * 3. Pruebas Acidez - Registro de pruebas con cálculo automático de calidad
 * 4. Evaluaciones - Evaluación periódica de proveedores
 * 5. Catálogos - Gestión de catálogos dinámicos (admin)
 * 6. Unidades Negocio - Gestión de plantas/sucursales
 */
import { useState } from 'react';
import { PageHeader } from '@/components/layout';
import { PageTabs } from '@/components/layout';
import { Users, DollarSign, FlaskConical, ClipboardCheck, Settings, Building2 } from 'lucide-react';
import { ProveedoresTable } from '../components/ProveedoresTable';
import { ProveedorForm } from '../components/ProveedorForm';
import { useProveedor } from '../hooks/useProveedores';
import type { ProveedorList } from '../types';

// ==================== TABS CONFIGURATION ====================

const tabs = [
  {
    id: 'proveedores',
    label: 'Proveedores',
    icon: Users,
    description: 'Gestión de proveedores y contactos',
  },
  {
    id: 'precios',
    label: 'Precios',
    icon: DollarSign,
    description: 'Control de precios de materias primas',
  },
  {
    id: 'pruebas-acidez',
    label: 'Pruebas de Acidez',
    icon: FlaskConical,
    description: 'Registro y control de calidad de sebo',
  },
  {
    id: 'evaluaciones',
    label: 'Evaluaciones',
    icon: ClipboardCheck,
    description: 'Evaluación periódica de proveedores',
  },
  {
    id: 'catalogos',
    label: 'Catálogos',
    icon: Settings,
    description: 'Configuración de catálogos dinámicos',
  },
  {
    id: 'unidades-negocio',
    label: 'Unidades de Negocio',
    icon: Building2,
    description: 'Plantas y centros de distribución',
  },
];

// ==================== PLACEHOLDER TABS (Por implementar en sprints futuros) ====================

function PreciosTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
        <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Gestión de Precios
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Control de precios de materias primas por proveedor.
          <br />
          Historial de cambios con porcentaje de variación.
        </p>
        <div className="text-sm text-gray-500">
          <strong>Funcionalidades:</strong>
          <ul className="list-disc list-inside mt-2 text-left max-w-md mx-auto">
            <li>Tabla de precios actuales por proveedor</li>
            <li>Cambiar precio con motivo del cambio</li>
            <li>Historial completo de cambios de precio</li>
            <li>Gráficas de tendencia de precios</li>
            <li>Comparativa entre proveedores</li>
            <li>Alertas de variaciones significativas</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function PruebasAcidezTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
        <FlaskConical className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Pruebas de Acidez de Sebo
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Registro de pruebas con clasificación automática según % de acidez.
          <br />
          Simulador de clasificación y control de calidad.
        </p>
        <div className="text-sm text-gray-500">
          <strong>Funcionalidades:</strong>
          <ul className="list-disc list-inside mt-2 text-left max-w-md mx-auto">
            <li>Simulador de clasificación por acidez</li>
            <li>Registro de prueba con auto-clasificación</li>
            <li>Definir acciones (Aceptado/Rechazado/Reproceso)</li>
            <li>Estadísticas por proveedor</li>
            <li>Gráficas de tendencia de calidad</li>
            <li>Alertas de pruebas pendientes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function EvaluacionesTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
        <ClipboardCheck className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Evaluación de Proveedores
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Sistema de evaluación periódica basado en criterios configurables.
          <br />
          Calificación automática con ponderación por criterio.
        </p>
        <div className="text-sm text-gray-500">
          <strong>Funcionalidades:</strong>
          <ul className="list-disc list-inside mt-2 text-left max-w-md mx-auto">
            <li>Configurar criterios de evaluación (Calidad, Entrega, Servicio, Precio)</li>
            <li>Crear evaluación con puntajes por criterio</li>
            <li>Cálculo automático de calificación ponderada</li>
            <li>Criterios eliminatorios</li>
            <li>Plan de mejora</li>
            <li>Aprobación de evaluaciones</li>
            <li>Estadísticas y tendencias</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function CatalogosTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
        <Settings className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Catálogos Dinámicos
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Configuración de todos los catálogos del sistema.
          <br />
          100% dinámico desde base de datos.
        </p>
        <div className="text-sm text-gray-500">
          <strong>9 Catálogos Configurables:</strong>
          <div className="grid grid-cols-2 gap-4 mt-4 max-w-2xl mx-auto">
            <div className="text-left">
              <p className="font-semibold mb-1">Materias Primas:</p>
              <ul className="list-disc list-inside text-xs">
                <li>Categorías de Materia Prima</li>
                <li>Tipos de Materia Prima (con rangos acidez)</li>
              </ul>
            </div>
            <div className="text-left">
              <p className="font-semibold mb-1">Proveedores:</p>
              <ul className="list-disc list-inside text-xs">
                <li>Tipos de Proveedor</li>
                <li>Modalidades Logísticas</li>
              </ul>
            </div>
            <div className="text-left">
              <p className="font-semibold mb-1">Financiero:</p>
              <ul className="list-disc list-inside text-xs">
                <li>Formas de Pago</li>
                <li>Tipos de Cuenta Bancaria</li>
              </ul>
            </div>
            <div className="text-left">
              <p className="font-semibold mb-1">Ubicación:</p>
              <ul className="list-disc list-inside text-xs">
                <li>Tipos de Documento</li>
                <li>Departamentos</li>
                <li>Ciudades</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UnidadesNegocioTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
        <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Unidades de Negocio
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Gestión de plantas de producción y centros de distribución.
          <br />
          Ventas internas entre unidades del grupo.
        </p>
        <div className="text-sm text-gray-500">
          <strong>Funcionalidades:</strong>
          <ul className="list-disc list-inside mt-2 text-left max-w-md mx-auto">
            <li>Crear/editar unidades de negocio</li>
            <li>Clasificar como planta producción o centro distribución</li>
            <li>Información de contacto y responsable</li>
            <li>Vincular como proveedor interno</li>
            <li>Precios de transferencia entre unidades</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN PAGE COMPONENT ====================

export default function GestionProveedoresPage() {
  const [activeTab, setActiveTab] = useState('proveedores');

  // ==================== ESTADO FORMULARIO PROVEEDOR ====================
  const [showProveedorForm, setShowProveedorForm] = useState(false);
  const [editProveedorId, setEditProveedorId] = useState<number | null>(null);

  // Fetch detalle completo del proveedor cuando se edita
  const { data: proveedorDetalle } = useProveedor(editProveedorId ?? 0);

  // ==================== HANDLERS ====================

  const handleNewProveedor = () => {
    setEditProveedorId(null);
    setShowProveedorForm(true);
  };

  const handleEditProveedor = (proveedor: ProveedorList) => {
    setEditProveedorId(proveedor.id);
    setShowProveedorForm(true);
  };

  const handleCloseForm = () => {
    setShowProveedorForm(false);
    setEditProveedorId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Proveedores"
        description="Sistema de gestión de proveedores, precios, calidad y evaluación - Supply Chain"
        tabs={
          <PageTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="pills"
            moduleColor="teal"
            size="md"
          />
        }
      />

      {/* Renderizado condicional de tabs */}
      {activeTab === 'proveedores' && (
        <ProveedoresTable onNew={handleNewProveedor} onEdit={handleEditProveedor} />
      )}
      {activeTab === 'precios' && <PreciosTab />}
      {activeTab === 'pruebas-acidez' && <PruebasAcidezTab />}
      {activeTab === 'evaluaciones' && <EvaluacionesTab />}
      {activeTab === 'catalogos' && <CatalogosTab />}
      {activeTab === 'unidades-negocio' && <UnidadesNegocioTab />}

      {/* Modal Crear/Editar Proveedor */}
      <ProveedorForm
        isOpen={showProveedorForm}
        proveedor={editProveedorId ? proveedorDetalle : undefined}
        onClose={handleCloseForm}
      />
    </div>
  );
}
