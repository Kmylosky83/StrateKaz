// Exportar componentes
export { ProveedorForm } from './components/ProveedorForm';
export { ProveedoresTable } from './components/ProveedoresTable';
export { CambiarPrecioModal } from './components/CambiarPrecioModal';
export { HistorialPrecioModal } from './components/HistorialPrecioModal';

// Exportar hooks
export {
  useProveedores,
  useProveedor,
  useCreateProveedor,
  useUpdateProveedor,
  useDeleteProveedor,
  useRestoreProveedor,
  useToggleProveedorStatus,
  useCambiarPrecio,
  useHistorialPrecio,
  useUnidadesNegocio,
  useUnidadNegocio,
  useCreateUnidadNegocio,
  useCondicionesComerciales,
} from './hooks/useProveedores';

// Exportar página
export { default as ProveedoresPage } from './pages/ProveedoresPage';
