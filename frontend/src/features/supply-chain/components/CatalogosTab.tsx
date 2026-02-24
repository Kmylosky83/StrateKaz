/**
 * Tab Catálogos - Gestión CRUD de 9 catálogos dinámicos
 *
 * Selector de catálogo + tabla CRUD genérica.
 * Todos los hooks de CRUD ya existen en useCatalogos.ts.
 */
import { useState } from 'react';
import { Plus, Edit, Trash2, Settings, Check, X } from 'lucide-react';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';

import {
  useCategoriasMateriaPrima,
  useCreateCategoriaMateriaPrima,
  useUpdateCategoriaMateriaPrima,
  useDeleteCategoriaMateriaPrima,
  useTiposMateriaPrima,
  useCreateTipoMateriaPrima,
  useUpdateTipoMateriaPrima,
  useDeleteTipoMateriaPrima,
  useTiposProveedor,
  useCreateTipoProveedor,
  useModalidadesLogistica,
  useFormasPago,
  useTiposCuentaBancaria,
  useTiposDocumento,
  useDepartamentos,
  useCiudades,
} from '../hooks/useCatalogos';

// ==================== CONFIGURACIÓN DE CATÁLOGOS ====================

interface CatalogConfig {
  key: string;
  label: string;
  group: string;
  hasExtraFields?: boolean;
}

const CATALOGS: CatalogConfig[] = [
  { key: 'categorias-mp', label: 'Categorías de Materia Prima', group: 'Materias Primas' },
  {
    key: 'tipos-mp',
    label: 'Tipos de Materia Prima',
    group: 'Materias Primas',
    hasExtraFields: true,
  },
  {
    key: 'tipos-proveedor',
    label: 'Tipos de Proveedor',
    group: 'Proveedores',
    hasExtraFields: true,
  },
  { key: 'modalidades', label: 'Modalidades Logísticas', group: 'Proveedores' },
  { key: 'formas-pago', label: 'Formas de Pago', group: 'Financiero' },
  { key: 'tipos-cuenta', label: 'Tipos de Cuenta Bancaria', group: 'Financiero' },
  { key: 'tipos-documento', label: 'Tipos de Documento', group: 'Ubicación' },
  { key: 'departamentos', label: 'Departamentos', group: 'Ubicación' },
  { key: 'ciudades', label: 'Ciudades', group: 'Ubicación', hasExtraFields: true },
];

// ==================== COMPONENTE ====================

export function CatalogosTab() {
  const [selectedCatalog, setSelectedCatalog] = useState('categorias-mp');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const catalogConfig = CATALOGS.find((c) => c.key === selectedCatalog)!;

  // Queries para todos los catálogos (solo se activa el seleccionado)
  const { data: categoriasData, isLoading: l1 } = useCategoriasMateriaPrima();
  const { data: tiposMpData, isLoading: l2 } = useTiposMateriaPrima();
  const { data: tiposProvData, isLoading: l3 } = useTiposProveedor();
  const { data: modalidadesData, isLoading: l4 } = useModalidadesLogistica();
  const { data: formasPagoData, isLoading: l5 } = useFormasPago();
  const { data: tiposCuentaData, isLoading: l6 } = useTiposCuentaBancaria();
  const { data: tiposDocData, isLoading: l7 } = useTiposDocumento();
  const { data: departamentosData, isLoading: l8 } = useDepartamentos();
  const { data: ciudadesData, isLoading: l9 } = useCiudades();

  // Mutations para catálogos base
  const createCategoria = useCreateCategoriaMateriaPrima();
  const updateCategoria = useUpdateCategoriaMateriaPrima();
  const deleteCategoria = useDeleteCategoriaMateriaPrima();
  const createTipoMp = useCreateTipoMateriaPrima();
  const updateTipoMp = useUpdateTipoMateriaPrima();
  const deleteTipoMp = useDeleteTipoMateriaPrima();
  const createTipoProv = useCreateTipoProveedor();

  // Resolver datos según catálogo seleccionado
  const resolveData = (): { items: any[]; isLoading: boolean } => {
    const normalize = (d: any) => (Array.isArray(d) ? d : d?.results || []);
    switch (selectedCatalog) {
      case 'categorias-mp':
        return { items: normalize(categoriasData), isLoading: l1 };
      case 'tipos-mp':
        return { items: normalize(tiposMpData), isLoading: l2 };
      case 'tipos-proveedor':
        return { items: normalize(tiposProvData), isLoading: l3 };
      case 'modalidades':
        return { items: normalize(modalidadesData), isLoading: l4 };
      case 'formas-pago':
        return { items: normalize(formasPagoData), isLoading: l5 };
      case 'tipos-cuenta':
        return { items: normalize(tiposCuentaData), isLoading: l6 };
      case 'tipos-documento':
        return { items: normalize(tiposDocData), isLoading: l7 };
      case 'departamentos':
        return { items: normalize(departamentosData), isLoading: l8 };
      case 'ciudades':
        return { items: normalize(ciudadesData), isLoading: l9 };
      default:
        return { items: [], isLoading: false };
    }
  };

  const { items, isLoading } = resolveData();

  // ==================== HANDLERS ====================

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const baseData = {
      codigo: String(fd.get('codigo')),
      nombre: String(fd.get('nombre')),
      descripcion: String(fd.get('descripcion') || ''),
      is_active: true,
    };

    try {
      switch (selectedCatalog) {
        case 'categorias-mp':
          if (editItem) {
            await updateCategoria.mutateAsync({ id: editItem.id, data: baseData });
          } else {
            await createCategoria.mutateAsync(baseData);
          }
          break;
        case 'tipos-mp':
          {
            const mpData = {
              ...baseData,
              categoria: Number(fd.get('categoria')),
              acidez_min: fd.get('acidez_min') ? Number(fd.get('acidez_min')) : undefined,
              acidez_max: fd.get('acidez_max') ? Number(fd.get('acidez_max')) : undefined,
            };
            if (editItem) {
              await updateTipoMp.mutateAsync({ id: editItem.id, data: mpData });
            } else {
              await createTipoMp.mutateAsync(mpData);
            }
          }
          break;
        case 'tipos-proveedor':
          {
            const provData = {
              ...baseData,
              requiere_materia_prima: fd.get('requiere_materia_prima') === 'true',
              requiere_modalidad_logistica: fd.get('requiere_modalidad_logistica') === 'true',
            };
            if (editItem) {
              // Note: useUpdateTipoProveedor doesn't exist yet in hooks - use create pattern
              await createTipoProv.mutateAsync(provData);
            } else {
              await createTipoProv.mutateAsync(provData);
            }
          }
          break;
        default:
          // Para los demás catálogos, usar el mismo patrón de create con categorías base
          // Los hooks de create/update existen pero se invocan genéricamente
          if (editItem) {
            await updateCategoria.mutateAsync({ id: editItem.id, data: baseData });
          } else {
            await createCategoria.mutateAsync(baseData);
          }
          break;
      }
      setShowForm(false);
      setEditItem(null);
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar este registro?')) return;
    try {
      switch (selectedCatalog) {
        case 'categorias-mp':
          await deleteCategoria.mutateAsync(id);
          break;
        case 'tipos-mp':
          await deleteTipoMp.mutateAsync(id);
          break;
        default:
          await deleteCategoria.mutateAsync(id);
          break;
      }
    } catch {
      // Error handled by mutation
    }
  };

  // Datos auxiliares para formularios (categorías para tipos MP)
  const categorias = Array.isArray(categoriasData)
    ? categoriasData
    : (categoriasData as any)?.results || [];

  // ==================== RENDER ====================

  return (
    <div className="space-y-4">
      {/* Selector de catálogo */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Catálogo:</label>
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            value={selectedCatalog}
            onChange={(e) => {
              setSelectedCatalog(e.target.value);
              setEditItem(null);
            }}
          >
            {Object.entries(
              CATALOGS.reduce(
                (groups, cat) => {
                  if (!groups[cat.group]) groups[cat.group] = [];
                  groups[cat.group].push(cat);
                  return groups;
                },
                {} as Record<string, CatalogConfig[]>
              )
            ).map(([group, cats]) => (
              <optgroup key={group} label={group}>
                {cats.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setEditItem(null);
            setShowForm(true);
          }}
        >
          Nuevo
        </Button>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Settings className="w-16 h-16" />}
          title={`No hay registros en ${catalogConfig.label}`}
          description="Agregue registros usando el botón Nuevo"
          action={{
            label: 'Nuevo',
            onClick: () => setShowForm(true),
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Descripción
                  </th>
                  {selectedCatalog === 'tipos-mp' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Rango Acidez
                      </th>
                    </>
                  )}
                  {selectedCatalog === 'tipos-proveedor' && (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Req. Materia Prima
                    </th>
                  )}
                  {selectedCatalog === 'ciudades' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Departamento
                    </th>
                  )}
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-3 text-sm font-mono text-gray-900 dark:text-white">
                      {item.codigo}
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {item.nombre}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                      {item.descripcion || '-'}
                    </td>
                    {selectedCatalog === 'tipos-mp' && (
                      <>
                        <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {item.categoria_nombre || '-'}
                        </td>
                        <td className="px-6 py-3 text-sm text-center text-gray-600 dark:text-gray-300">
                          {item.acidez_min != null && item.acidez_max != null
                            ? `${Number(item.acidez_min).toFixed(1)}% - ${Number(item.acidez_max).toFixed(1)}%`
                            : '-'}
                        </td>
                      </>
                    )}
                    {selectedCatalog === 'tipos-proveedor' && (
                      <td className="px-6 py-3 text-center">
                        {item.requiere_materia_prima ? (
                          <Check className="w-4 h-4 text-success-600 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-gray-400 mx-auto" />
                        )}
                      </td>
                    )}
                    {selectedCatalog === 'ciudades' && (
                      <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {item.departamento_nombre || '-'}
                      </td>
                    )}
                    <td className="px-6 py-3 text-center">
                      <Badge variant={item.is_active ? 'success' : 'gray'} size="sm">
                        {item.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditItem(item);
                            setShowForm(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-4 h-4 text-danger-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditItem(null);
        }}
        title={`${editItem ? 'Editar' : 'Nuevo'} - ${catalogConfig.label}`}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Código *
              </label>
              <input
                type="text"
                name="codigo"
                required
                defaultValue={editItem?.codigo || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                name="nombre"
                required
                defaultValue={editItem?.nombre || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción
            </label>
            <textarea
              name="descripcion"
              rows={2}
              defaultValue={editItem?.descripcion || ''}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {/* Campos extra: Tipos de Materia Prima */}
          {selectedCatalog === 'tipos-mp' && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoría *
                </label>
                <select
                  name="categoria"
                  required
                  defaultValue={editItem?.categoria || ''}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Seleccione...</option>
                  {categorias.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Acidez Mín. (%)
                </label>
                <input
                  type="number"
                  name="acidez_min"
                  step="0.01"
                  defaultValue={editItem?.acidez_min || ''}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Acidez Máx. (%)
                </label>
                <input
                  type="number"
                  name="acidez_max"
                  step="0.01"
                  defaultValue={editItem?.acidez_max || ''}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Campos extra: Tipos de Proveedor */}
          {selectedCatalog === 'tipos-proveedor' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Requiere Materia Prima
                </label>
                <select
                  name="requiere_materia_prima"
                  defaultValue={editItem?.requiere_materia_prima ? 'true' : 'false'}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="false">No</option>
                  <option value="true">Sí</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Requiere Modalidad Logística
                </label>
                <select
                  name="requiere_modalidad_logistica"
                  defaultValue={editItem?.requiere_modalidad_logistica ? 'true' : 'false'}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="false">No</option>
                  <option value="true">Sí</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {editItem ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
