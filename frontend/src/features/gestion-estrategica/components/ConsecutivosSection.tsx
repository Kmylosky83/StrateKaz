/**
 * MC-002: Section de Configuración de Consecutivos
 * Sistema de Gestión StrateKaz
 *
 * Vista 2B: Lista CRUD con Filtros en Línea
 * - DataSection con filtros en línea (sin hardcoding)
 * - DataTableCard para la tabla
 * - Colores dinámicos usando getModuleColorClasses()
 *
 * Características:
 * - Lista de consecutivos con filtros
 * - CRUD con permisos RBAC
 * - Vista previa de formato
 * - Indicador sistema/custom
 */
import { useState } from 'react';
import {
  Hash,
  Plus,
  FileText,
  ShoppingCart,
  Receipt,
  Package,
  Calculator,
  Factory,
  CheckCircle,
  Users,
  Shield,
  Leaf,
  Settings,
  Lock,
  RefreshCw,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Alert, Badge, Button, BrandedSkeleton, ConfirmDialog } from '@/components/common';
import { Select } from '@/components/forms';
import { DataTableCard } from '@/components/layout';
import { DataSection } from '@/components/data-display';
import { usePermissions, useModuleColor } from '@/hooks';
import { Modules, Sections } from '@/constants/permissions';
import { getModuleColorClasses } from '@/utils/moduleColors';
import type { ModuleColor } from '@/utils/moduleColors';
import {
  useConsecutivos,
  useDeleteConsecutivo,
  useCargarConsecutivosSistema,
} from '../hooks/useStrategic';
import { ConsecutivoFormModal } from './modals/ConsecutivoFormModal';
import type { ConsecutivoConfigList, CategoriaConsecutivo } from '../api/strategicApi';

// Mapeo de iconos por categoría
const CATEGORIA_ICONS: Record<CategoriaConsecutivo, typeof Hash> = {
  DOCUMENTOS: FileText,
  COMPRAS: ShoppingCart,
  VENTAS: Receipt,
  INVENTARIO: Package,
  CONTABILIDAD: Calculator,
  PRODUCCION: Factory,
  CALIDAD: CheckCircle,
  RRHH: Users,
  SST: Shield,
  AMBIENTAL: Leaf,
  GENERAL: Settings,
};

// Labels de categorías
const CATEGORIA_LABELS: Record<CategoriaConsecutivo, string> = {
  DOCUMENTOS: 'Documentos',
  COMPRAS: 'Compras',
  VENTAS: 'Ventas',
  INVENTARIO: 'Inventario',
  CONTABILIDAD: 'Contabilidad',
  PRODUCCION: 'Producción',
  CALIDAD: 'Calidad',
  RRHH: 'Recursos Humanos',
  SST: 'Seguridad y Salud',
  AMBIENTAL: 'Gestión Ambiental',
  GENERAL: 'General',
};

export const ConsecutivosSection = () => {
  // Color del módulo (sin hardcoding)
  const { color: moduleColor } = useModuleColor('GESTION_ESTRATEGICA');
  const colorClasses = getModuleColorClasses(moduleColor as ModuleColor);

  const [selectedConsecutivo, setSelectedConsecutivo] = useState<ConsecutivoConfigList | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaConsecutivo | ''>('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'sistema' | 'custom'>('todos');
  const [consecutivoToDelete, setConsecutivoToDelete] = useState<ConsecutivoConfigList | null>(
    null
  );
  const [showCargarConfirm, setShowCargarConfirm] = useState(false);

  // RBAC
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.FUNDACION, Sections.CONSECUTIVOS, 'create');
  const canEdit = canDo(Modules.FUNDACION, Sections.CONSECUTIVOS, 'edit');
  const canDelete = canDo(Modules.FUNDACION, Sections.CONSECUTIVOS, 'delete');
  const isAdmin = canDo(Modules.FUNDACION, Sections.CONSECUTIVOS, 'delete');

  // Filtros
  const filters = {
    ...(filtroCategoria && { categoria: filtroCategoria }),
    ...(filtroTipo === 'sistema' && { es_sistema: true }),
    ...(filtroTipo === 'custom' && { es_sistema: false }),
  };

  // Data
  const { data: consecutivosData, isLoading, error } = useConsecutivos(filters);
  const deleteMutation = useDeleteConsecutivo();
  const cargarSistemaMutation = useCargarConsecutivosSistema();

  const consecutivos = Array.isArray(consecutivosData) ? consecutivosData : [];

  // Handlers
  const handleCreate = () => {
    setSelectedConsecutivo(null);
    setIsModalOpen(true);
  };

  const handleEdit = (consecutivo: ConsecutivoConfigList) => {
    setSelectedConsecutivo(consecutivo);
    setIsModalOpen(true);
  };

  const handleDelete = (consecutivo: ConsecutivoConfigList) => {
    if (consecutivo.es_sistema) return;
    setConsecutivoToDelete(consecutivo);
  };

  const confirmDelete = async () => {
    if (!consecutivoToDelete) return;
    await deleteMutation.mutateAsync(consecutivoToDelete.id);
    setConsecutivoToDelete(null);
  };

  const handleCargarSistema = () => {
    setShowCargarConfirm(true);
  };

  const confirmCargarSistema = async () => {
    await cargarSistemaMutation.mutateAsync();
    setShowCargarConfirm(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedConsecutivo(null);
  };

  // Loading state - muestra logo del branding
  if (isLoading) {
    return <BrandedSkeleton height="h-80" logoSize="xl" showText />;
  }

  // Error state
  if (error) {
    return (
      <Alert
        variant="error"
        message="Error al cargar los consecutivos. Por favor, intente nuevamente."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* DataSection - Vista 2B: Filtros en línea */}
      <DataSection
        icon={Hash}
        iconBgClass={colorClasses.badge}
        iconClass={colorClasses.icon}
        title="Consecutivos"
        description="Numeración automática de documentos y registros"
        action={
          <div className="flex items-center gap-3 flex-nowrap">
            <Select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value as CategoriaConsecutivo | '')}
              options={[
                { value: '', label: 'Todas las categorías' },
                ...Object.entries(CATEGORIA_LABELS).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
              className="w-44"
            />
            <Select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as 'todos' | 'sistema' | 'custom')}
              options={[
                { value: 'todos', label: 'Todos los tipos' },
                { value: 'sistema', label: 'Del Sistema' },
                { value: 'custom', label: 'Personalizados' },
              ]}
              className="w-40"
            />
            {isAdmin && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCargarSistema}
                disabled={cargarSistemaMutation.isPending}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${cargarSistemaMutation.isPending ? 'animate-spin' : ''}`}
                />
                Cargar Sistema
              </Button>
            )}
            {canCreate && (
              <Button variant="primary" size="sm" onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Consecutivo
              </Button>
            )}
          </div>
        }
      />

      {/* Tabla */}
      <DataTableCard
        isEmpty={consecutivos.length === 0}
        isLoading={false}
        emptyMessage={
          filtroCategoria || filtroTipo !== 'todos'
            ? 'No se encontraron consecutivos con los filtros seleccionados.'
            : 'Comienza cargando los consecutivos del sistema o crea uno nuevo.'
        }
      >
        {consecutivos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Código
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Nombre
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Categoría
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Ejemplo
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Actual
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Tipo
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {consecutivos.map((consecutivo) => {
                  const CategoriaIcon = CATEGORIA_ICONS[consecutivo.categoria] || Hash;
                  return (
                    <tr
                      key={consecutivo.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-gray-100 dark:bg-gray-800">
                            <CategoriaIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                            {consecutivo.codigo}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {consecutivo.nombre}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary" size="sm">
                          {consecutivo.categoria_display || CATEGORIA_LABELS[consecutivo.categoria]}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-primary-600 dark:text-primary-400">
                          {consecutivo.ejemplo_formato}
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-gray-600 dark:text-gray-400">
                          #{consecutivo.current_number}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {consecutivo.es_sistema ? (
                          <Badge variant="info" size="sm">
                            <Lock className="h-3 w-3 mr-1" />
                            Sistema
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm">
                            Custom
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(consecutivo)}
                              className="p-2 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4 text-gray-500 hover:text-orange-600" />
                            </Button>
                          )}
                          {canDelete && !consecutivo.es_sistema && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(consecutivo)}
                              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </DataTableCard>

      {/* Modal */}
      <ConsecutivoFormModal
        consecutivo={selectedConsecutivo}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={!!consecutivoToDelete}
        onClose={() => setConsecutivoToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar Consecutivo"
        message={`¿Está seguro de eliminar el consecutivo "${consecutivoToDelete?.nombre}"?`}
        variant="danger"
        confirmText="Eliminar"
        isLoading={deleteMutation.isPending}
      />

      {/* Confirmación de cargar sistema */}
      <ConfirmDialog
        isOpen={showCargarConfirm}
        onClose={() => setShowCargarConfirm(false)}
        onConfirm={confirmCargarSistema}
        title="Cargar Consecutivos del Sistema"
        message="¿Desea cargar los consecutivos predefinidos del sistema? Esto agregará los consecutivos estándar sin afectar los existentes."
        variant="warning"
        confirmText="Cargar"
        isLoading={cargarSistemaMutation.isPending}
      />
    </div>
  );
};
