/**
 * Página Principal - Production Ops
 * Sistema de Gestión StrateKaz
 *
 * Usa componentes del Design System (@/components/common)
 */
import React, { useState } from 'react';
import { Card, Tabs } from '@/components/common';
import { Package, Factory, Wrench, CheckCircle, FlaskConical } from 'lucide-react';

// Importar tabs
import RecepcionTab from '../components/RecepcionTab';
import PruebasAcidezTab from '../components/PruebasAcidezTab';
import ProcesamientoTab from '../components/ProcesamientoTab';
import MantenimientoTab from '../components/MantenimientoTab';
import ProductoTerminadoTab from '../components/ProductoTerminadoTab';

const ProductionOpsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('recepcion');

  const tabs = [
    { id: 'recepcion', label: 'Recepción', icon: <Package className="h-4 w-4" /> },
    {
      id: 'pruebas-acidez',
      label: 'Pruebas de Acidez',
      icon: <FlaskConical className="h-4 w-4" />,
    },
    { id: 'procesamiento', label: 'Procesamiento', icon: <Factory className="h-4 w-4" /> },
    { id: 'mantenimiento', label: 'Mantenimiento', icon: <Wrench className="h-4 w-4" /> },
    {
      id: 'producto-terminado',
      label: 'Producto Terminado',
      icon: <CheckCircle className="h-4 w-4" />,
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Production Ops
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestión integral de operaciones productivas
          </p>
        </div>
      </div>

      <Card>
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

        <div className="mt-6">
          {activeTab === 'recepcion' && <RecepcionTab />}
          {activeTab === 'pruebas-acidez' && <PruebasAcidezTab />}
          {activeTab === 'procesamiento' && <ProcesamientoTab />}
          {activeTab === 'mantenimiento' && <MantenimientoTab />}
          {activeTab === 'producto-terminado' && <ProductoTerminadoTab />}
        </div>
      </Card>
    </div>
  );
};

export default ProductionOpsPage;
