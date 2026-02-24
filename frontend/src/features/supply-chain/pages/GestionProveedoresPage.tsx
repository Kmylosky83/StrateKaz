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
import { PreciosTab } from '../components/PreciosTab';
import { PruebaAcidezTable } from '../components/PruebaAcidezTable';
import { PruebaAcidezForm } from '../components/PruebaAcidezForm';
import { EvaluacionesTab } from '../components/EvaluacionesTab';
import { CatalogosTab } from '../components/CatalogosTab';
import { UnidadesNegocioTab } from '../components/UnidadesNegocioTab';
import { useProveedor } from '../hooks/useProveedores';
import type { ProveedorList, PruebaAcidez } from '../types';

import { Card } from '@/components/common/Card';

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

// ==================== PRUEBAS ACIDEZ TAB (wrapper de componentes existentes) ====================

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
