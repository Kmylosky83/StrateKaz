/**
 * Página Supply Chain — Unificada con 8 tabs (flujo de negocio)
 *
 * Orden:
 * 1. Proveedores — Crear/gestionar proveedores + KPIs
 * 2. Precios — Gestión de precios por tipo materia prima
 * 3. Compras — Requisiciones, cotizaciones, órdenes, recepciones
 * 4. Almacenamiento — Inventarios, movimientos, kardex, alertas
 * 5. Programación — Programación de abastecimiento
 * 6. Evaluaciones — Evaluación periódica de proveedores
 * 7. Unidades de Negocio — Proveedores internos (config)
 * 8. Catálogos — Catálogos dinámicos (config admin)
 */
import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import {
  Users,
  DollarSign,
  ShoppingCart,
  Package,
  Calendar,
  ClipboardCheck,
  Building2,
  FolderOpen,
} from 'lucide-react';
import {
  ProveedoresTab,
  PreciosTab,
  ComprasTab,
  AlmacenamientoTab,
  ProgramacionTab,
  EvaluacionesTab,
  UnidadesNegocioTab,
  CatalogosTab,
} from '../components';

// ==================== ROUTE → TAB MAPPING ====================

const ROUTE_TO_TAB: Record<string, string> = {
  proveedores: 'proveedores',
  precios: 'precios',
  compras: 'compras',
  almacenamiento: 'almacenamiento',
  programacion: 'programacion',
  evaluaciones: 'evaluaciones',
  'unidades-negocio': 'unidades-negocio',
  catalogos: 'catalogos',
};

const tabs = [
  {
    id: 'proveedores',
    label: 'Proveedores',
    icon: <Users className="w-4 h-4" />,
  },
  {
    id: 'precios',
    label: 'Precios',
    icon: <DollarSign className="w-4 h-4" />,
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
  {
    id: 'programacion',
    label: 'Programación',
    icon: <Calendar className="w-4 h-4" />,
  },
  {
    id: 'evaluaciones',
    label: 'Evaluaciones',
    icon: <ClipboardCheck className="w-4 h-4" />,
  },
  {
    id: 'unidades-negocio',
    label: 'Unidades de Negocio',
    icon: <Building2 className="w-4 h-4" />,
  },
  {
    id: 'catalogos',
    label: 'Catálogos',
    icon: <FolderOpen className="w-4 h-4" />,
  },
];

// ==================== MAIN PAGE COMPONENT ====================

export default function SupplyChainPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = useMemo(() => {
    const segments = location.pathname.split('/');
    const lastSegment = segments[segments.length - 1];
    return ROUTE_TO_TAB[lastSegment] || 'proveedores';
  }, [location.pathname]);

  const handleTabChange = (tabId: string) => {
    navigate(`/supply-chain/${tabId}`);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cadena de Suministro"
        description="Gestión integral de proveedores, compras, inventarios y abastecimiento"
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} variant="pills" />

      <div className="mt-6">
        {activeTab === 'proveedores' && <ProveedoresTab />}
        {activeTab === 'precios' && <PreciosTab />}
        {activeTab === 'compras' && <ComprasTab />}
        {activeTab === 'almacenamiento' && <AlmacenamientoTab />}
        {activeTab === 'programacion' && <ProgramacionTab />}
        {activeTab === 'evaluaciones' && <EvaluacionesTab />}
        {activeTab === 'unidades-negocio' && <UnidadesNegocioTab />}
        {activeTab === 'catalogos' && <CatalogosTab />}
      </div>
    </div>
  );
}
