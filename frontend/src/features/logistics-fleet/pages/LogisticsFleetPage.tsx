/**
 * Pagina Principal de Logistics Fleet Management
 * Sistema de Gestion de Flota y Transporte
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, MapPin } from 'lucide-react';
import { GestionFlotaTab } from '../components/GestionFlotaTab';
import { GestionTransporteTab } from '../components/GestionTransporteTab';

export default function LogisticsFleetPage() {
  const [activeTab, setActiveTab] = useState('flota');

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Logistics Fleet Management</h1>
        <p className="text-muted-foreground">
          Sistema de Gestion de Flota y Transporte - Cumplimiento PESV (Resolucion 40595/2022)
        </p>
      </div>

      {/* Main Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Gestion de Flota y Transporte</CardTitle>
          <CardDescription>
            Administracion completa de vehiculos, conductores, rutas y despachos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="flota">
                <Truck className="mr-2 h-4 w-4" />
                Gestion de Flota
              </TabsTrigger>
              <TabsTrigger value="transporte">
                <MapPin className="mr-2 h-4 w-4" />
                Gestion de Transporte
              </TabsTrigger>
            </TabsList>

            <TabsContent value="flota" className="mt-6">
              <GestionFlotaTab />
            </TabsContent>

            <TabsContent value="transporte" className="mt-6">
              <GestionTransporteTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Footer Info PESV */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Truck className="h-5 w-5 text-blue-700" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">
                Cumplimiento PESV - Resolucion 40595 de 2022
              </h3>
              <p className="text-sm text-blue-800 mt-1">
                Este modulo implementa los controles requeridos por el Plan Estrategico de
                Seguridad Vial (PESV) del Ministerio de Transporte:
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1 ml-4 list-disc">
                <li>Control de vencimientos de documentos vehiculares (SOAT, Tecnomecanica)</li>
                <li>Verificacion de licencias de conduccion vigentes</li>
                <li>Inspecciones preoperacionales diarias</li>
                <li>Trazabilidad completa de mantenimientos y costos operativos</li>
                <li>Gestion de rutas y programacion de viajes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
