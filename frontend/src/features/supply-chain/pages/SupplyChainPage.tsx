/**
 * Pagina Supply Chain - Sub-modulos (route-aware)
 *
 * Esta pagina maneja las rutas:
 * - /supply-chain/programacion
 * - /supply-chain/compras
 * - /supply-chain/almacenamiento
 * - /supply-chain/catalogos
 * - /supply-chain/pruebas-acidez
 *
 * La ruta /supply-chain/proveedores tiene su propia pagina (GestionProveedoresPage)
 */
import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import {
  FolderOpen,
  Calendar,
  ShoppingCart,
  Package,
  FlaskConical,
  ExternalLink,
} from 'lucide-react';
import { ProgramacionTab, ComprasTab, AlmacenamientoTab, CatalogosTab } from '../components';
import { Button } from '@/components/common';

// ==================== ROUTE → TAB MAPPING ====================

const ROUTE_TO_TAB: Record<string, string> = {
  programacion: 'programacion',
  compras: 'compras',
  almacenamiento: 'almacenamiento',
  catalogos: 'catalogos',
  'pruebas-acidez': 'pruebas-acidez',
};

// ==================== PRUEBAS ACIDEZ REDIRECT ====================
// Pruebas de Acidez vive en Production Ops → Recepción

const PruebasAcidezTab = () => {
  const nav = useNavigate();
  return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
      <FlaskConical className="w-12 h-12 mx-auto mb-3 text-amber-500" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Pruebas de Acidez
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        El registro y control de calidad de sebo se gestiona desde
        <strong> Operaciones de Producción → Recepción</strong>.
      </p>
      <Button onClick={() => nav('/production-ops/recepcion')} variant="primary">
        <ExternalLink className="w-4 h-4 mr-2" />
        Ir a Producción - Recepción
      </Button>
    </div>
  );
};

// ==================== MAIN PAGE COMPONENT ====================

export default function SupplyChainPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Derive active tab from URL path
  const activeTab = useMemo(() => {
    const segments = location.pathname.split('/');
    const lastSegment = segments[segments.length - 1];
    return ROUTE_TO_TAB[lastSegment] || 'programacion';
  }, [location.pathname]);

  const handleTabChange = (tabId: string) => {
    navigate(`/supply-chain/${tabId}`);
  };

  const tabs = [
    {
      id: 'programacion',
      label: 'Programacion',
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
    {
      id: 'catalogos',
      label: 'Catalogos',
      icon: <FolderOpen className="w-4 h-4" />,
    },
    {
      id: 'pruebas-acidez',
      label: 'Pruebas Acidez',
      icon: <FlaskConical className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cadena de Suministro"
        description="Programacion de abastecimiento, compras, almacenamiento e inventarios"
      />

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} variant="pills" />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'programacion' && <ProgramacionTab />}
        {activeTab === 'compras' && <ComprasTab />}
        {activeTab === 'almacenamiento' && <AlmacenamientoTab />}
        {activeTab === 'catalogos' && <CatalogosTab />}
        {activeTab === 'pruebas-acidez' && <PruebasAcidezTab />}
      </div>
    </div>
  );
}
