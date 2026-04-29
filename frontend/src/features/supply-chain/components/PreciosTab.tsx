/**
 * Tab Precios — Tabla de proveedores con resumen de precios.
 *
 * Post refactor 2026-04-21 (Opción A separación estricta + escalabilidad):
 *   Vista principal: TABLA de proveedores (escalable a 1000+).
 *   Click en un proveedor → abre PreciosProveedorModal con tabla
 *   editable masiva de sus MPs.
 *
 * Query param `?proveedor=N` abre el modal automáticamente al cargar.
 */
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DollarSign, Search, AlertTriangle, Edit3 } from 'lucide-react';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Input } from '@/components/forms';

import { useSectionPermissions } from '@/components/common/ProtectedAction';
import { Modules, Sections } from '@/constants/permissions';

import { useProveedores } from '@/features/infraestructura/catalogo-productos/hooks/useProveedores';
import { usePreciosMP } from '../hooks/usePrecios';
import PreciosProveedorModal from './PreciosProveedorModal';

// Resumen por proveedor derivado de la lista de precios + proveedores
interface ResumenProveedor {
  id: number;
  codigo_interno: string;
  nombre_comercial: string;
  razon_social: string;
  modalidad_logistica_nombre: string | null;
  total_mps: number;
  con_precio: number;
  pendientes: number;
  is_active: boolean;
}

export function PreciosTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialProvId = Number(searchParams.get('proveedor') || 0) || null;

  const [selectedId, setSelectedId] = useState<number | null>(initialProvId);
  const [modalOpen, setModalOpen] = useState<boolean>(!!initialProvId);
  const [search, setSearch] = useState('');

  // RBAC
  const { canEdit } = useSectionPermissions(Modules.SUPPLY_CHAIN, Sections.PRECIOS_MATERIA_PRIMA);

  // Queries base
  const { data: proveedoresData = [], isLoading: loadingProv } = useProveedores();
  const { data: preciosData = [], isLoading: loadingPrec } = usePreciosMP();

  const proveedoresActivos = useMemo(
    () => (Array.isArray(proveedoresData) ? proveedoresData.filter((p) => p.is_active) : []),
    [proveedoresData]
  );

  // Derivar resumen: cada proveedor + conteo de precios + conteo de MPs suministradas
  // Necesitamos detail de cada proveedor para saber productos_suministrados.
  // Aquí usamos preciosData para contar con_precio directamente; para total_mps
  // sin hacer N+1, dejamos un placeholder (el modal hace el fetch detallado).
  const resumen: ResumenProveedor[] = useMemo(() => {
    const preciosPorProv = new Map<number, number>();
    for (const p of preciosData) {
      preciosPorProv.set(p.proveedor, (preciosPorProv.get(p.proveedor) ?? 0) + 1);
    }
    return proveedoresActivos.map((p) => ({
      id: p.id,
      codigo_interno: p.codigo_interno,
      nombre_comercial: p.nombre_comercial,
      razon_social: p.razon_social,
      modalidad_logistica_nombre: p.modalidad_logistica_nombre ?? null,
      total_mps: 0, // se detalla al abrir modal
      con_precio: preciosPorProv.get(p.id) ?? 0,
      pendientes: 0, // se detalla al abrir modal
      is_active: p.is_active,
    }));
  }, [proveedoresActivos, preciosData]);

  // Filtrado local por nombre comercial / razón social / código
  const filtered = useMemo(() => {
    if (!search.trim()) return resumen;
    const q = search.trim().toLowerCase();
    return resumen.filter(
      (r) =>
        r.nombre_comercial.toLowerCase().includes(q) ||
        r.razon_social.toLowerCase().includes(q) ||
        r.codigo_interno.toLowerCase().includes(q)
    );
  }, [resumen, search]);

  const handleRowClick = (id: number) => {
    setSelectedId(id);
    setModalOpen(true);
    setSearchParams({ proveedor: String(id) });
  };

  const handleClose = () => {
    setModalOpen(false);
    setSelectedId(null);
    setSearchParams({});
  };

  const selectedProveedor = proveedoresActivos.find((p) => p.id === selectedId);

  // Auto-abrir modal si viene query param inicial válido
  useEffect(() => {
    if (initialProvId && proveedoresActivos.some((p) => p.id === initialProvId)) {
      setSelectedId(initialProvId);
      setModalOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proveedoresActivos.length]);

  const isLoading = loadingProv || loadingPrec;

  return (
    <div className="space-y-4">
      {/* Search + stats */}
      <Card variant="bordered" padding="md">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Buscar proveedor por nombre, código, razón social..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-gray-400" />}
            />
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <strong>{resumen.length}</strong> proveedores · <strong>{preciosData.length}</strong>{' '}
            precios asignados
          </div>
        </div>
      </Card>

      {/* Tabla de proveedores */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={
              <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            }
            title={search ? 'Sin resultados' : 'Sin proveedores activos'}
            description={
              search
                ? 'No hay proveedores que coincidan con la búsqueda.'
                : 'Cree proveedores en Catálogo de Productos → Proveedores.'
            }
          />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Código
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Proveedor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Modalidad
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Precios asignados
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => handleRowClick(p.id)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                      {p.codigo_interno}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {p.nombre_comercial}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {p.razon_social}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {p.modalidad_logistica_nombre ? (
                        <Badge variant="info">{p.modalidad_logistica_nombre}</Badge>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      {p.con_precio > 0 ? (
                        <Badge variant="success">{p.con_precio}</Badge>
                      ) : (
                        <Badge variant="warning">
                          <AlertTriangle className="w-3 h-3 mr-1 inline" /> Sin precios
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(p.id);
                        }}
                        title="Gestionar precios"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal amplio con tabla editable */}
      <PreciosProveedorModal
        isOpen={modalOpen}
        onClose={handleClose}
        proveedorId={selectedId}
        proveedorNombre={selectedProveedor?.nombre_comercial}
        canEdit={canEdit}
      />
    </div>
  );
}
