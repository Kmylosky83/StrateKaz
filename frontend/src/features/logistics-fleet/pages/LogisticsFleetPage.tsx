/**
 * Página Principal de Logística y Flota
 * 4 tabs del sidebar: Transporte, Despachos, Flota, PESV Operativo
 */
import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import { Route, Send, Car, Shield } from 'lucide-react';
import { GestionTransporteTab } from '../components/GestionTransporteTab';
import { DespachosTab } from '../components/DespachosTab';
import { GestionFlotaTab } from '../components/GestionFlotaTab';
import { PesvOperativoTab } from '../components/PesvOperativoTab';

const ROUTE_TO_TAB: Record<string, string> = {
  transporte: 'transporte',
  despachos: 'despachos',
  flota: 'flota',
  pesv: 'pesv',
};

export default function LogisticsFleetPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = useMemo(() => {
    const segments = location.pathname.split('/');
    const lastSegment = segments[segments.length - 1];
    return ROUTE_TO_TAB[lastSegment] || 'transporte';
  }, [location.pathname]);

  const handleTabChange = (tabId: string) => {
    navigate(`/logistica/${tabId}`);
  };

  const tabs = [
    { id: 'transporte', label: 'Gestión Transporte', icon: <Route className="w-4 h-4" /> },
    { id: 'despachos', label: 'Despachos', icon: <Send className="w-4 h-4" /> },
    { id: 'flota', label: 'Gestión de Flota', icon: <Car className="w-4 h-4" /> },
    { id: 'pesv', label: 'PESV Operativo', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Logística y Flota"
        description="Gestión de transporte, rutas, vehículos y cumplimiento PESV (Resolución 40595/2022)"
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} variant="pills" />

      <div className="mt-6">
        {activeTab === 'transporte' && <GestionTransporteTab />}
        {activeTab === 'despachos' && <DespachosTab />}
        {activeTab === 'flota' && <GestionFlotaTab />}
        {activeTab === 'pesv' && <PesvOperativoTab />}
      </div>
    </div>
  );
}
