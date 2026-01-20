/**
 * MC-002: Section de Configuración de Consecutivos
 * Sistema de Gestión StrateKaz
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
} from 'lucide-react';
import { Alert, Badge, Button, Card } from '@/components/common';
import { Select } from '@/components/forms';
import { Pencil, Trash2 } from 'lucide-react';
import { usePermissions } from '@/hooks';
import { Modules, Sections } from '@/constants/permissions';
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
  const [selectedConsecutivo, setSelectedConsecutivo] = useState<ConsecutivoConfigList | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaConsecutivo | ''>('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'sistema' | 'custom'>('todos');

  // RBAC
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.GESTION_ESTRATEGICA, Sections.CONSECUTIVOS, 'create');
  const canEdit = canDo(Modules.GESTION_ESTRATEGICA, Sections.CONSECUTIVOS, 'update');
  const canDelete = canDo(Modules.GESTION_ESTRATEGICA, Sections.CONSECUTIVOS, 'delete');
  const isAdmin = canDo(Modules.GESTION_ESTRATEGICA, Sections.CONSECUTIVOS, 'delete');

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

  const consecutivos = consecutivosData?.results || [];

  // Handlers
  const handleCreate = () => {
    setSelectedConsecutivo(null);
    setIsModalOpen(true);
  };

  const handleEdit = (consecutivo: ConsecutivoConfigList) => {
    setSelectedConsecutivo(consecutivo);
    setIsModalOpen(true);
  };

  const handleDelete = async (consecutivo: ConsecutivoConfigList) => {
    if (consecutivo.es_sistema) {
      return;
    }
    if (window.confirm(`¿Está seguro de eliminar el consecutivo "${consecutivo.nombre}"?`)) {
      await deleteMutation.mutateAsync(consecutivo.id);
    }
  };

  const handleCargarSistema = async () => {
    if (window.confirm('¿Desea cargar los consecutivos predefinidos del sistema?')) {
      await cargarSistemaMutation.mutateAsync();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedConsecutivo(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <div className="p-6 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </Card>
    );
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
    <>
      <Card>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Hash className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Configuración de Consecutivos
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Administra la numeración automática de documentos y registros
                </p>
              </div>
            </div>
            <div className="flex gap-2">
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
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-4">
            <div className="w-48">
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
              />
            </div>
            <div className="w-40">
              <Select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as 'todos' | 'sistema' | 'custom')}
                options={[
                  { value: 'todos', label: 'Todos' },
                  { value: 'sistema', label: 'Del Sistema' },
                  { value: 'custom', label: 'Personalizados' },
                ]}
              />
            </div>
          </div>

          {/* Tabla */}
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
                        className="border-b border-secondary-100 dark:border-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded bg-secondary-100 dark:bg-secondary-800">
                              <CategoriaIcon className="h-4 w-4 text-secondary-600 dark:text-gray-400" />
                            </div>
                            <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                              {consecutivo.codigo}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-secondary-700 dark:text-secondary-300">
                          {consecutivo.nombre}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" size="sm">
                            {consecutivo.categoria_display ||
                              CATEGORIA_LABELS[consecutivo.categoria]}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <code className="px-2 py-1 bg-secondary-100 dark:bg-secondary-800 rounded text-sm font-mono text-primary-600 dark:text-primary-400">
                            {consecutivo.ejemplo_formato}
                          </code>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-secondary-600 dark:text-gray-400">
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
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary-100 dark:bg-secondary-800 mb-4">
                <Hash className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No hay consecutivos configurados
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {filtroCategoria || filtroTipo !== 'todos'
                  ? 'No se encontraron consecutivos con los filtros seleccionados.'
                  : 'Comienza cargando los consecutivos del sistema o crea uno nuevo.'}
              </p>
              <div className="flex justify-center gap-3">
                {isAdmin && (
                  <Button
                    variant="secondary"
                    onClick={handleCargarSistema}
                    disabled={cargarSistemaMutation.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Cargar Sistema
                  </Button>
                )}
                {canCreate && (
                  <Button variant="primary" onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Consecutivo
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Modal */}
      <ConsecutivoFormModal
        consecutivo={selectedConsecutivo}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
};
