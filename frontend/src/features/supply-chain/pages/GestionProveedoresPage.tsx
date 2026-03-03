/**
 * Página Principal - Gestión de Proveedores (Supply Chain)
 * Sistema de Gestión StrateKaz
 *
 * Tabs operativos:
 * 1. Proveedores - Lista, crear, editar proveedores + Importación masiva + KPIs
 * 2. Precios - Gestión de precios por tipo materia prima
 * 3. Pruebas de Acidez - Registro de pruebas con cálculo automático de calidad
 * 4. Evaluaciones - Evaluación periódica de proveedores
 * 5. Configuración - Catálogos dinámicos + Unidades de Negocio (admin)
 */
import { useState } from 'react';
import { PageHeader } from '@/components/layout';
import { PageTabs } from '@/components/layout';
import { KpiCard, KpiCardGrid } from '@/components/common/KpiCard';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import {
  Users,
  DollarSign,
  FlaskConical,
  ClipboardCheck,
  Settings,
  Building2,
  BookOpen,
  Upload,
  UserCheck,
  UserX,
  TrendingUp,
} from 'lucide-react';
import { ProveedoresTable } from '../components/ProveedoresTable';
import { ProveedorForm } from '../components/ProveedorForm';
import ImportProveedoresModal from '../components/ImportProveedoresModal';
import { PreciosTab } from '../components/PreciosTab';
import { PruebaAcidezTable } from '../components/PruebaAcidezTable';
import { PruebaAcidezForm } from '../components/PruebaAcidezForm';
import { EvaluacionesTab } from '../components/EvaluacionesTab';
import { CatalogosTab } from '../components/CatalogosTab';
import { UnidadesNegocioTab } from '../components/UnidadesNegocioTab';
import { useProveedor, useEstadisticasProveedores } from '../hooks/useProveedores';
import type { ProveedorList, PruebaAcidez } from '../types';

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
    description: 'Precios de materia prima por proveedor',
  },
  {
    id: 'pruebas-acidez',
    label: 'Pruebas de Acidez',
    icon: FlaskConical,
    description: 'Control de calidad de materia prima',
  },
  {
    id: 'evaluaciones',
    label: 'Evaluaciones',
    icon: ClipboardCheck,
    description: 'Evaluación periódica de proveedores',
  },
  {
    id: 'configuracion',
    label: 'Configuración',
    icon: Settings,
    description: 'Catálogos dinámicos y unidades de negocio',
  },
];

// ==================== PRUEBAS ACIDEZ TAB ====================

function PruebasAcidezTab() {
  const [showForm, setShowForm] = useState(false);
  const [editPrueba, setEditPrueba] = useState<PruebaAcidez | null>(null);

  if (showForm) {
    return (
      <Card variant="bordered" padding="lg">
        <PruebaAcidezForm
          prueba={editPrueba}
          onSuccess={() => {
            setShowForm(false);
            setEditPrueba(null);
          }}
          onCancel={() => {
            setShowForm(false);
            setEditPrueba(null);
          }}
        />
      </Card>
    );
  }

  return (
    <PruebaAcidezTable
      onNew={() => {
        setEditPrueba(null);
        setShowForm(true);
      }}
      onEdit={(prueba) => {
        setEditPrueba(prueba);
        setShowForm(true);
      }}
    />
  );
}

// ==================== CONFIGURACIÓN TAB (Catálogos + Unidades) ====================

function ConfiguracionTab() {
  const [seccion, setSeccion] = useState<'catalogos' | 'unidades'>('catalogos');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant={seccion === 'catalogos' ? 'primary' : 'outline'}
          size="sm"
          leftIcon={<BookOpen className="w-4 h-4" />}
          onClick={() => setSeccion('catalogos')}
        >
          Catálogos
        </Button>
        <Button
          variant={seccion === 'unidades' ? 'primary' : 'outline'}
          size="sm"
          leftIcon={<Building2 className="w-4 h-4" />}
          onClick={() => setSeccion('unidades')}
        >
          Unidades de Negocio
        </Button>
      </div>

      {seccion === 'catalogos' && <CatalogosTab />}
      {seccion === 'unidades' && <UnidadesNegocioTab />}
    </div>
  );
}

// ==================== PROVEEDORES TAB (con KPIs) ====================

function ProveedoresTabContent({
  onNew,
  onEdit,
  onImport,
}: {
  onNew: () => void;
  onEdit: (proveedor: ProveedorList) => void;
  onImport: () => void;
}) {
  const { data: estadisticasData } = useEstadisticasProveedores();
  const estadisticas = estadisticasData as Record<string, unknown> | undefined;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <KpiCardGrid columns={4}>
        <KpiCard
          label="Total Proveedores"
          value={estadisticas?.total_proveedores ?? 0}
          icon={<Users className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Activos"
          value={estadisticas?.proveedores_activos ?? 0}
          icon={<UserCheck className="w-5 h-5" />}
          color="success"
        />
        <KpiCard
          label="Inactivos"
          value={estadisticas?.proveedores_inactivos ?? 0}
          icon={<UserX className="w-5 h-5" />}
          color="warning"
        />
        <KpiCard
          label="Calificación Promedio"
          value={
            estadisticas?.calificacion_promedio
              ? `${Number(estadisticas.calificacion_promedio).toFixed(1)}%`
              : 'N/A'
          }
          icon={<TrendingUp className="w-5 h-5" />}
          color="info"
        />
      </KpiCardGrid>

      {/* Botón Importar */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onImport}
          leftIcon={<Upload className="w-4 h-4" />}
        >
          Importar Proveedores
        </Button>
      </div>

      {/* Tabla de Proveedores */}
      <ProveedoresTable onNew={onNew} onEdit={onEdit} />
    </div>
  );
}

// ==================== MAIN PAGE COMPONENT ====================

export default function GestionProveedoresPage() {
  const [activeTab, setActiveTab] = useState('proveedores');

  // ==================== ESTADO FORMULARIO PROVEEDOR ====================
  const [showProveedorForm, setShowProveedorForm] = useState(false);
  const [editProveedorId, setEditProveedorId] = useState<number | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

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
        description="Proveedores, precios, calidad y evaluaciones"
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
        <ProveedoresTabContent
          onNew={handleNewProveedor}
          onEdit={handleEditProveedor}
          onImport={() => setShowImportModal(true)}
        />
      )}
      {activeTab === 'precios' && <PreciosTab />}
      {activeTab === 'pruebas-acidez' && <PruebasAcidezTab />}
      {activeTab === 'evaluaciones' && <EvaluacionesTab />}
      {activeTab === 'configuracion' && <ConfiguracionTab />}

      {/* Modal Crear/Editar Proveedor */}
      <ProveedorForm
        isOpen={showProveedorForm}
        proveedor={editProveedorId ? proveedorDetalle : undefined}
        onClose={handleCloseForm}
      />

      {/* Modal Importar Proveedores */}
      <ImportProveedoresModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} />
    </div>
  );
}
