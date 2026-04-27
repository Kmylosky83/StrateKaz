/**
 * Página Principal: Supply Chain - Cadena de Suministro
 *
 * Arquitectura route-based. El sidebar controla la navegación.
 *
 * Secciones LIVE (post refactor 2026-04-21 — Proveedor → CT):
 * 1. Precios          — Precios proveedor × MP + historial
 * 2. Recepción        — Vouchers de báscula, calidad opcional
 * 3. Liquidaciones    — Cálculo y aprobación de pagos
 * 4. Almacenamiento   — Inventarios, movimientos, kardex, alertas
 * 5. Catálogos        — Modalidad logística (el resto se gestiona en CT)
 * 6. Compras          — (deuda futura) Requisiciones/OC/Contratos
 *
 * MIGRADO A CT: Proveedores → /catalogo-productos/proveedores
 * ELIMINADO: Evaluaciones (scope Admin/Compras futuro)
 */
import { useLocation } from 'react-router-dom';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { KpiCard, KpiCardGrid } from '@/components/common/KpiCard';
import {
  AlertTriangle,
  DollarSign,
  FileCheck,
  FlaskConical,
  FolderOpen,
  Package,
  Route,
  Scale,
  ShoppingCart,
  TrendingDown,
  Truck,
  Warehouse,
} from 'lucide-react';
import {
  PreciosTab,
  ComprasTab,
  AlmacenamientoTab,
  CatalogosTab,
  RecepcionTab,
  LiquidacionesTab,
  RutasRecoleccionTab,
  ParametrosCalidadTab,
  InventarioTab,
  VoucherRecoleccionTab,
  MermaDashboard,
} from '../components';
import { useResumenGeneralSC } from '../hooks/useInventario';

interface SectionMeta {
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType | null;
}

const SECTION_MAP: Record<string, SectionMeta> = {
  precios: {
    title: 'Precios',
    description: 'Precios vigentes proveedor × materia prima + historial',
    icon: <DollarSign className="w-5 h-5" />,
    component: PreciosTab,
  },
  recoleccion: {
    title: 'Recolección en Ruta',
    description:
      'Registro de kilos por parada en cada salida de la ruta (sin precios, captura flexible en ruta o post-entrega)',
    icon: <Truck className="w-5 h-5" />,
    component: VoucherRecoleccionTab,
  },
  recepcion: {
    title: 'Recepción de MP',
    description: 'Vouchers de báscula: pesaje, calidad opcional e ingreso a inventario',
    icon: <Scale className="w-5 h-5" />,
    component: RecepcionTab,
  },
  liquidaciones: {
    title: 'Liquidaciones',
    description: 'Cálculo y aprobación de pagos al proveedor por recepciones',
    icon: <FileCheck className="w-5 h-5" />,
    component: LiquidacionesTab,
  },
  almacenamiento: {
    title: 'Almacenamiento',
    description: 'Control de inventario, movimientos, kardex y alertas de stock',
    icon: <Package className="w-5 h-5" />,
    component: AlmacenamientoTab,
  },
  compras: {
    title: 'Compras',
    description: 'Requisiciones, cotizaciones, órdenes de compra y contratos',
    icon: <ShoppingCart className="w-5 h-5" />,
    component: ComprasTab,
  },
  catalogos: {
    title: 'Catálogos',
    description: 'Modalidad logística y otros catálogos de SC',
    icon: <FolderOpen className="w-5 h-5" />,
    component: CatalogosTab,
  },
  'rutas-recoleccion': {
    title: 'Rutas de Recolección',
    description: 'Circuitos de recolección de MP (H-SC-10)',
    icon: <Route className="w-5 h-5" />,
    component: RutasRecoleccionTab,
  },
  'parametros-calidad': {
    title: 'Parámetros de Calidad',
    description: 'Parámetros medibles al recepcionar MP con sus rangos de clasificación',
    icon: <FlaskConical className="w-5 h-5" />,
    component: ParametrosCalidadTab,
  },
  inventario: {
    title: 'Inventario',
    description: 'Dashboard de almacenes, ocupación, kardex y alertas',
    icon: <Warehouse className="w-5 h-5" />,
    component: InventarioTab,
  },
  'merma-dashboard': {
    title: 'Dashboard Merma',
    description: 'Comparativa recolectado vs recibido por voucher (H-SC-RUTA-04)',
    icon: <TrendingDown className="w-5 h-5" />,
    component: MermaDashboard,
  },
};

export default function SupplyChainPage() {
  const location = useLocation();

  const activeKey = location.pathname.split('/supply-chain/')[1]?.split('/')[0] || 'precios';
  const section = SECTION_MAP[activeKey] || SECTION_MAP.precios;
  const SectionComponent = section.component;

  // Resumen global — solo en landing ('precios' por default). Defensivo si backend no responde.
  const showResumen = activeKey === 'precios' || activeKey === '';
  const { data: resumen } = useResumenGeneralSC();

  return (
    <div className="space-y-6">
      <PageHeader title={section.title} description={section.description} />

      {showResumen && resumen && (
        <KpiCardGrid columns={4}>
          <KpiCard
            label="Almacenes"
            value={resumen.total_almacenes ?? 0}
            icon={<Warehouse className="w-5 h-5" />}
            color="primary"
          />
          <KpiCard
            label="Productos"
            value={resumen.total_productos_stock ?? 0}
            icon={<Package className="w-5 h-5" />}
            color="info"
          />
          <KpiCard
            label="Cantidad global"
            value={Number(resumen.total_cantidad_global ?? 0).toLocaleString('es-CO', {
              maximumFractionDigits: 2,
            })}
            icon={<Scale className="w-5 h-5" />}
            color="success"
          />
          <KpiCard
            label="Alertas activas"
            value={resumen.alertas_pendientes ?? 0}
            icon={<AlertTriangle className="w-5 h-5" />}
            color={(resumen.alertas_pendientes ?? 0) > 0 ? 'danger' : 'gray'}
          />
        </KpiCardGrid>
      )}

      {SectionComponent ? (
        <SectionComponent />
      ) : (
        <Card className="p-8">
          <EmptyState
            icon={
              <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-xl">{section.icon}</div>
            }
            title={section.title}
            description={`Módulo en desarrollo. ${section.description}`}
          />
        </Card>
      )}
    </div>
  );
}
