/**
 * Rutas: Catálogo de Productos (CT-layer L17)
 * Módulo transversal: dato maestro de productos, categorías y unidades de medida.
 */
import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { withFullGuard } from '../helpers';

const CatalogoProductosPage = lazy(() =>
  import('@/features/infraestructura/catalogo-productos').then((m) => ({
    default: m.CatalogoProductosPage,
  }))
);

export const catalogoProductosRoutes = (
  <>
    <Route
      path="/catalogo-productos"
      element={<Navigate to="/catalogo-productos/productos" replace />}
    />
    <Route
      path="/catalogo-productos/productos"
      element={withFullGuard(CatalogoProductosPage, 'catalogo_productos', 'productos')}
    />
    <Route
      path="/catalogo-productos/categorias"
      element={withFullGuard(CatalogoProductosPage, 'catalogo_productos', 'categorias')}
    />
    <Route
      path="/catalogo-productos/unidades-medida"
      element={withFullGuard(CatalogoProductosPage, 'catalogo_productos', 'unidades-medida')}
    />
    <Route
      path="/catalogo-productos/tipos-proveedor"
      element={withFullGuard(CatalogoProductosPage, 'catalogo_productos', 'tipos-proveedor')}
    />
    <Route
      path="/catalogo-productos/proveedores"
      element={withFullGuard(CatalogoProductosPage, 'catalogo_productos', 'proveedores')}
    />
  </>
);
