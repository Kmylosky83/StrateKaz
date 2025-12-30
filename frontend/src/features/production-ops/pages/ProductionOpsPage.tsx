/**
 * Página Principal - Production Ops
 * Sistema de Gestión Grasas y Huesos del Norte
 */
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Package,
  Factory,
  Wrench,
  CheckCircle,
} from 'lucide-react';

// Importar tabs (crear estos archivos según necesidades)
import RecepcionTab from '../components/RecepcionTab';
import ProcesamientoTab from '../components/ProcesamientoTab';
import MantenimientoTab from '../components/MantenimientoTab';
import ProductoTerminadoTab from '../components/ProductoTerminadoTab';

const ProductionOpsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('recepcion');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production Ops</h1>
          <p className="text-muted-foreground">
            Gestión integral de operaciones productivas
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recepcion" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>Recepción</span>
          </TabsTrigger>
          <TabsTrigger value="procesamiento" className="flex items-center gap-2">
            <Factory className="h-4 w-4" />
            <span>Procesamiento</span>
          </TabsTrigger>
          <TabsTrigger value="mantenimiento" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            <span>Mantenimiento</span>
          </TabsTrigger>
          <TabsTrigger value="producto-terminado" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>Producto Terminado</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recepcion" className="space-y-4">
          <RecepcionTab />
        </TabsContent>

        <TabsContent value="procesamiento" className="space-y-4">
          <ProcesamientoTab />
        </TabsContent>

        <TabsContent value="mantenimiento" className="space-y-4">
          <MantenimientoTab />
        </TabsContent>

        <TabsContent value="producto-terminado" className="space-y-4">
          <ProductoTerminadoTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductionOpsPage;
