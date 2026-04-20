/**
 * Tab Catálogos - Gestión CRUD de catálogos dinámicos (Tipo B — tabla con selector)
 * SectionToolbar + Card+Table + BaseModal + ConfirmDialog
 */
import { useState } from 'react';
import { Plus, Edit, Trash2, Settings, Check, X } from 'lucide-react';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';

import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import { useModalidadesLogistica, useDepartamentos, useCiudades } from '../hooks/useCatalogos';
// TipoProveedor vive en CT post refactor 2026-04-21
import {
  useTiposProveedor,
  useCreateTipoProveedor,
} from '@/features/catalogo-productos/hooks/useProveedores';
import {
  useTiposAlmacen,
  useCreateTipoAlmacen,
  useUpdateTipoAlmacen,
  useDeleteTipoAlmacen,
} from '../hooks/useTiposAlmacen';

// ==================== TIPOS ====================

interface CatalogConfig {
  key: string;
  label: string;
  group: string;
  hasExtraFields?: boolean;
}

interface CatalogItem {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  is_active: boolean;
  requiere_materia_prima?: boolean;
  requiere_modalidad_logistica?: boolean;
  departamento_nombre?: string;
}

// ==================== CONFIGURACIÓN DE CATÁLOGOS ====================

// Formas de Pago y Tipos de Documento se administran en Configuración → Catálogos.
// Materias Primas (categorías + tipos) viven en Catálogo de Productos.
// Aquí solo viven catálogos específicos de supply chain.
const CATALOGS: CatalogConfig[] = [
  {
    key: 'tipos-proveedor',
    label: 'Tipos de Proveedor',
    group: 'Proveedores',
    hasExtraFields: true,
  },
  { key: 'modalidades', label: 'Modalidades Logísticas', group: 'Proveedores' },
  { key: 'tipos-almacen', label: 'Tipos de Almacén', group: 'Almacenamiento' },
  { key: 'departamentos', label: 'Departamentos', group: 'Ubicación' },
  { key: 'ciudades', label: 'Ciudades', group: 'Ubicación', hasExtraFields: true },
];

// ==================== COMPONENTE ====================

export function CatalogosTab() {
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.SUPPLY_CHAIN, Sections.CATALOGOS_SC, 'create');

  const [selectedCatalog, setSelectedCatalog] = useState('tipos-proveedor');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<CatalogItem | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);

  const catalogConfig = CATALOGS.find((c) => c.key === selectedCatalog)!;

  // Queries para todos los catálogos (solo se activa el seleccionado)
  const { data: tiposProvData, isLoading: l3 } = useTiposProveedor();
  const { data: modalidadesData, isLoading: l4 } = useModalidadesLogistica();
  const { data: departamentosData, isLoading: l8 } = useDepartamentos();
  const { data: ciudadesData, isLoading: l9 } = useCiudades();
  const { data: tiposAlmacenData, isLoading: l10 } = useTiposAlmacen();

  // Mutations para catálogos base
  const createTipoProv = useCreateTipoProveedor();
  const createTipoAlm = useCreateTipoAlmacen();
  const updateTipoAlm = useUpdateTipoAlmacen();
  const deleteTipoAlm = useDeleteTipoAlmacen();

  // Resolver datos según catálogo seleccionado
  const resolveData = (): { items: CatalogItem[]; isLoading: boolean } => {
    const normalize = (d: unknown): CatalogItem[] =>
      Array.isArray(d) ? d : ((d as Record<string, unknown>)?.results as CatalogItem[]) || [];
    switch (selectedCatalog) {
      case 'tipos-proveedor':
        return { items: normalize(tiposProvData), isLoading: l3 };
      case 'modalidades':
        return { items: normalize(modalidadesData), isLoading: l4 };
      case 'departamentos':
        return { items: normalize(departamentosData), isLoading: l8 };
      case 'ciudades':
        return { items: normalize(ciudadesData), isLoading: l9 };
      case 'tipos-almacen':
        return { items: normalize(tiposAlmacenData), isLoading: l10 };
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
        case 'tipos-proveedor':
          {
            const provData = {
              ...baseData,
              requiere_materia_prima: fd.get('requiere_materia_prima') === 'true',
              requiere_modalidad_logistica: fd.get('requiere_modalidad_logistica') === 'true',
            };
            await createTipoProv.mutateAsync(provData);
          }
          break;
        case 'tipos-almacen':
          if (editItem) {
            await updateTipoAlm.mutateAsync({ id: editItem.id, data: baseData });
          } else {
            await createTipoAlm.mutateAsync(baseData);
          }
          break;
        default:
          break;
      }
      setShowForm(false);
      setEditItem(null);
    } catch {
      // Error handled by mutation
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteItemId) return;
    try {
      switch (selectedCatalog) {
        case 'tipos-almacen':
          await deleteTipoAlm.mutateAsync(deleteItemId);
          break;
        default:
          break;
      }
    } catch {
      // Error handled by mutation
    }
    setDeleteItemId(null);
  };

  // ==================== RENDER ====================

  return (
    <div className="space-y-4">
      {/* Selector de catálogo */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Catálogo:</label>
        <Select
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
        </Select>
      </div>

      <SectionToolbar
        title={catalogConfig.label}
        count={items.length}
        primaryAction={
          canCreate
            ? {
                label: 'Nuevo',
                onClick: () => {
                  setEditItem(null);
                  setShowForm(true);
                },
              }
            : undefined
        }
      />

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
                {items.map((item) => (
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
                        <Button variant="ghost" size="sm" onClick={() => setDeleteItemId(item.id)}>
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
      <BaseModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditItem(null);
        }}
        title={`${editItem ? 'Editar' : 'Nuevo'} - ${catalogConfig.label}`}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                const form = document.getElementById('catalogo-form') as HTMLFormElement;
                form?.requestSubmit();
              }}
            >
              {editItem ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        }
      >
        <form id="catalogo-form" onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Código *"
              type="text"
              name="codigo"
              required
              defaultValue={editItem?.codigo || ''}
            />
            <Input
              label="Nombre *"
              type="text"
              name="nombre"
              required
              defaultValue={editItem?.nombre || ''}
            />
          </div>

          <Textarea
            label="Descripción"
            name="descripcion"
            rows={2}
            defaultValue={editItem?.descripcion || ''}
          />

          {/* Campos extra: Tipos de Proveedor */}
          {selectedCatalog === 'tipos-proveedor' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Requiere Materia Prima"
                name="requiere_materia_prima"
                defaultValue={editItem?.requiere_materia_prima ? 'true' : 'false'}
              >
                <option value="false">No</option>
                <option value="true">Sí</option>
              </Select>
              <Select
                label="Requiere Modalidad Logística"
                name="requiere_modalidad_logistica"
                defaultValue={editItem?.requiere_modalidad_logistica ? 'true' : 'false'}
              >
                <option value="false">No</option>
                <option value="true">Sí</option>
              </Select>
            </div>
          )}
        </form>
      </BaseModal>

      {/* Confirmar eliminación */}
      <ConfirmDialog
        isOpen={!!deleteItemId}
        title="Eliminar Registro"
        message={`¿Está seguro de eliminar este registro de ${catalogConfig.label}? Esta acción no se puede deshacer.`}
        variant="danger"
        confirmText="Eliminar"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteItemId(null)}
      />
    </div>
  );
}
