/**
 * Página Principal: Catálogo de Productos (CT-layer L17)
 *
 * Arquitectura route-based: el sidebar controla la navegación.
 * Cada ruta /catalogo-productos/{sección} renderiza su componente.
 *
 * Secciones:
 * 1. Productos   — dato maestro universal (/catalogo-productos/productos)
 * 2. Categorías  — jerarquía de agrupación (/catalogo-productos/categorias)
 * 3. Unidades    — kg, L, und, etc.        (/catalogo-productos/unidades-medida)
 */
import { useLocation } from 'react-router-dom';
import { Package, FolderTree, Ruler, Users, Tags } from 'lucide-react';

import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';

import {
  ProductosTab,
  CategoriasTab,
  UnidadesMedidaTab,
  TiposProveedorTab,
  ProveedoresTab,
} from '../components';

interface SectionMeta {
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType | null;
}

const SECTION_MAP: Record<string, SectionMeta> = {
  productos: {
    title: 'Productos',
    description: 'Catálogo maestro de productos, materias primas, insumos y servicios',
    icon: <Package className="w-5 h-5" />,
    component: ProductosTab,
  },
  categorias: {
    title: 'Categorías',
    description: 'Categorías jerárquicas para clasificar los productos',
    icon: <FolderTree className="w-5 h-5" />,
    component: CategoriasTab,
  },
  'unidades-medida': {
    title: 'Unidades de medida',
    description: 'Unidades estándar: kg, litros, unidades, metros y más',
    icon: <Ruler className="w-5 h-5" />,
    component: UnidadesMedidaTab,
  },
  'tipos-proveedor': {
    title: 'Tipos de proveedor',
    description:
      'Catálogo clasificador: fabricante, distribuidor, transportista. Los flags condicionan el formulario de Proveedor.',
    icon: <Tags className="w-5 h-5" />,
    component: TiposProveedorTab,
  },
  proveedores: {
    title: 'Proveedores',
    description:
      'Dato maestro de proveedores (identificación + contacto + productos que suministra)',
    icon: <Users className="w-5 h-5" />,
    component: ProveedoresTab,
  },
};

export default function CatalogoProductosPage() {
  const location = useLocation();

  const activeKey =
    location.pathname.split('/catalogo-productos/')[1]?.split('/')[0] || 'productos';
  const section = SECTION_MAP[activeKey] ?? SECTION_MAP.productos;
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
