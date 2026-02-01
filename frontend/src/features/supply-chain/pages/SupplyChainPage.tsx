/**
 * Página Principal: Supply Chain Management
 *
 * Gestión integral de Supply Chain:
 * - Proveedores
 * - Catálogos
 * - Programación de Abastecimiento
 * - Compras (Requisiciones, Cotizaciones, OC, Contratos, Recepciones)
 * - Almacenamiento (Inventarios, Movimientos, Kardex, Alertas)
 */
import { useState } from 'react';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import {
  Users,
  FolderOpen,
  Calendar,
  ShoppingCart,
  Package,
} from 'lucide-react';
import { ProgramacionTab, ComprasTab, AlmacenamientoTab } from '../components';

// Placeholder tabs (to be created separately or imported if they exist)
const ProveedoresTab = () => (
  <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
    <p className="text-gray-600 dark:text-gray-400">
      Sección de Proveedores. Ver <code>GestionProveedoresPage.tsx</code> para funcionalidad completa.
    </p>
  </div>
);

const CatalogosTab = () => (
  <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
    <p className="text-gray-600 dark:text-gray-400">
      Sección de Catálogos Dinámicos (Tipos de Materia Prima, Tipos de Proveedor, etc.)
    </p>
  </div>
);

// ==================== MAIN PAGE COMPONENT ====================

export default function SupplyChainPage() {
  const [activeTab, setActiveTab] = useState('proveedores');

  const tabs = [
    {
      id: 'proveedores',
      label: 'Proveedores',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'catalogos',
      label: 'Catálogos',
      icon: <FolderOpen className="w-4 h-4" />,
    },
    {
      id: 'programacion',
      label: 'Programación',
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: 'compras',
      label: 'Compras',
      icon: <ShoppingCart className="w-4 h-4" />,
    },
    {
      id: 'almacenamiento',
      label: 'Almacenamiento',
      icon: <Package className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Supply Chain Management"
        description="Gestión integral de la cadena de suministro: proveedores, compras, programación de abastecimiento, almacenamiento e inventarios"
      />

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'proveedores' && <ProveedoresTab />}
        {activeTab === 'catalogos' && <CatalogosTab />}
        {activeTab === 'programacion' && <ProgramacionTab />}
        {activeTab === 'compras' && <ComprasTab />}
        {activeTab === 'almacenamiento' && <AlmacenamientoTab />}
      </div>
    </div>
  );
}
