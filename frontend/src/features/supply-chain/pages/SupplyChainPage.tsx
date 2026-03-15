/**
 * Página Principal: Supply Chain - Cadena de Suministro
 * Sistema de Gestión StrateKaz
 *
 * Arquitectura route-based: El sidebar controla la navegación.
 * Cada ruta /supply-chain/{seccion} renderiza su componente correspondiente.
 * NO usa tabs internos — el sidebar ES la navegación.
 *
 * Secciones (flujo de negocio):
 * 1. Proveedores — Registro, KPIs, importación masiva
 * 2. Precios — Gestión de precios por tipo materia prima
 * 3. Compras — Requisiciones, cotizaciones, órdenes, recepciones
 * 4. Almacenamiento — Inventarios, movimientos, kardex, alertas
 * 5. Programación — Programación de abastecimiento
 * 6. Evaluaciones — Evaluación periódica de proveedores
 * 7. Catálogos — Catálogos dinámicos (configuración admin)
 */
import { useLocation } from 'react-router-dom';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Users,
  DollarSign,
  ShoppingCart,
  Package,
  Calendar,
  ClipboardCheck,
  FolderOpen,
} from 'lucide-react';
import {
  ProveedoresTab,
  PreciosTab,
  ComprasTab,
  AlmacenamientoTab,
  ProgramacionTab,
  EvaluacionesTab,
  CatalogosTab,
} from '../components';

// ============================================================================
// Mapa de secciones por ruta
// ============================================================================

interface SectionMeta {
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType | null;
}

const SECTION_MAP: Record<string, SectionMeta> = {
  proveedores: {
    title: 'Proveedores',
    description: 'Registro y gestión de proveedores, KPIs e importación masiva',
    icon: <Users className="w-5 h-5" />,
    component: ProveedoresTab,
  },
  precios: {
    title: 'Precios',
    description: 'Gestión de precios por tipo de materia prima y proveedor',
    icon: <DollarSign className="w-5 h-5" />,
    component: PreciosTab,
  },
  compras: {
    title: 'Compras',
    description: 'Requisiciones, cotizaciones, órdenes de compra y recepciones',
    icon: <ShoppingCart className="w-5 h-5" />,
    component: ComprasTab,
  },
  almacenamiento: {
    title: 'Almacenamiento',
    description: 'Control de inventario, movimientos, kardex y alertas de stock',
    icon: <Package className="w-5 h-5" />,
    component: AlmacenamientoTab,
  },
  programacion: {
    title: 'Programación',
    description: 'Programación de abastecimiento y operaciones logísticas',
    icon: <Calendar className="w-5 h-5" />,
    component: ProgramacionTab,
  },
  evaluaciones: {
    title: 'Evaluaciones',
    description: 'Evaluación periódica de proveedores con criterios ponderados',
    icon: <ClipboardCheck className="w-5 h-5" />,
    component: EvaluacionesTab,
  },
  catalogos: {
    title: 'Catálogos',
    description: 'Catálogos dinámicos de la cadena de suministro',
    icon: <FolderOpen className="w-5 h-5" />,
    component: CatalogosTab,
  },
};

// ============================================================================
// Componente Principal
// ============================================================================

export default function SupplyChainPage() {
  const location = useLocation();

  // Extraer la sección activa de la ruta: /supply-chain/proveedores -> "proveedores"
  const activeKey = location.pathname.split('/supply-chain/')[1]?.split('/')[0] || 'proveedores';
  const section = SECTION_MAP[activeKey] || SECTION_MAP.proveedores;

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
