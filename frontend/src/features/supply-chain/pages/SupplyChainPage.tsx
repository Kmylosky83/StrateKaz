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
import { DollarSign, ShoppingCart, Package, FolderOpen, Scale, FileCheck } from 'lucide-react';
import {
  PreciosTab,
  ComprasTab,
  AlmacenamientoTab,
  CatalogosTab,
  RecepcionTab,
  LiquidacionesTab,
} from '../components';

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
};

export default function SupplyChainPage() {
  const location = useLocation();

  const activeKey = location.pathname.split('/supply-chain/')[1]?.split('/')[0] || 'precios';
  const section = SECTION_MAP[activeKey] || SECTION_MAP.precios;
  const SectionComponent = section.component;

  return (
    <div className="space-y-6">
      <PageHeader title={section.title} description={section.description} />

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
