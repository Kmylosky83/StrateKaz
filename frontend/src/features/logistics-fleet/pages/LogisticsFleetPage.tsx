/**
 * Pagina Principal de Logistics Fleet Management
 * Sistema de Gestion de Flota y Transporte
 */
import { useState } from 'react';
import { Card, Tabs } from '@/components/common';
import { Truck, MapPin } from 'lucide-react';
import { GestionFlotaTab } from '../components/GestionFlotaTab';
import { GestionTransporteTab } from '../components/GestionTransporteTab';

export default function LogisticsFleetPage() {
  const [activeTab, setActiveTab] = useState('flota');

  const tabs = [
    { id: 'flota', label: 'Gestión de Flota', icon: <Truck className="h-4 w-4" /> },
    { id: 'transporte', label: 'Gestión de Transporte', icon: <MapPin className="h-4 w-4" /> },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Logistics Fleet Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Sistema de Gestión de Flota y Transporte - Cumplimiento PESV (Resolución 40595/2022)
        </p>
      </div>

      {/* Main Tabs */}
      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Gestión de Flota y Transporte
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Administración completa de vehículos, conductores, rutas y despachos
          </p>
        </div>

        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="pills"
        />

        <div className="mt-6">
          {activeTab === 'flota' && <GestionFlotaTab />}
          {activeTab === 'transporte' && <GestionTransporteTab />}
        </div>
      </Card>

      {/* Footer Info PESV */}
      <Card className="!bg-blue-50 dark:!bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-100 dark:bg-blue-900/50 p-2">
            <Truck className="h-5 w-5 text-blue-700 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              Cumplimiento PESV - Resolución 40595 de 2022
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
              Este módulo implementa los controles requeridos por el Plan Estratégico de
              Seguridad Vial (PESV) del Ministerio de Transporte:
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1 ml-4 list-disc">
              <li>Control de vencimientos de documentos vehiculares (SOAT, Tecnomecánica)</li>
              <li>Verificación de licencias de conducción vigentes</li>
              <li>Inspecciones preoperacionales diarias</li>
              <li>Trazabilidad completa de mantenimientos y costos operativos</li>
              <li>Gestión de rutas y programación de viajes</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
