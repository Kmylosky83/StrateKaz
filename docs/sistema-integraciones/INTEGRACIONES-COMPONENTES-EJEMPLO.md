# Ejemplos de Componentes UI - Integraciones Externas

Ejemplos de implementación de componentes React para el módulo de Integraciones Externas.

## 1. Página Principal - IntegracionesPage.tsx

```typescript
import { useState } from 'react';
import { Plus, Filter, RefreshCw } from 'lucide-react';
import { useIntegraciones } from '@/features/gestion-estrategica/hooks/useStrategic';
import { IntegracionFilters, TipoServicio, Ambiente } from '@/features/gestion-estrategica/types/strategic.types';
import IntegracionesTable from '../components/IntegracionesTable';
import IntegracionFormModal from '../components/IntegracionFormModal';
import Button from '@/components/common/Button';
import PageHeader from '@/components/layout/PageHeader';

export default function IntegracionesPage() {
  const [filters, setFilters] = useState<IntegracionFilters>({});
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading, refetch } = useIntegraciones(filters);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integraciones Externas"
        subtitle="Gestión de integraciones con servicios de terceros"
      >
        <div className="flex gap-3">
          <Button
            variant="outline"
            icon={RefreshCw}
            onClick={() => refetch()}
          >
            Actualizar
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
          >
            Nueva Integración
          </Button>
        </div>
      </PageHeader>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Servicio
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={filters.tipo_servicio || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  tipo_servicio: e.target.value as TipoServicio || undefined,
                }))
              }
            >
              <option value="">Todos</option>
              <option value="EMAIL">Email</option>
              <option value="FACTURACION">Facturación</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="PAGOS">Pagos</option>
              <option value="ERP">ERP</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ambiente
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={filters.ambiente || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  ambiente: e.target.value as Ambiente || undefined,
                }))
              }
            >
              <option value="">Todos</option>
              <option value="PRODUCCION">Producción</option>
              <option value="SANDBOX">Sandbox</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={filters.is_active !== undefined ? String(filters.is_active) : ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  is_active: e.target.value === '' ? undefined : e.target.value === 'true',
                }))
              }
            >
              <option value="">Todos</option>
              <option value="true">Activas</option>
              <option value="false">Inactivas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Salud
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={filters.is_healthy !== undefined ? String(filters.is_healthy) : ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  is_healthy: e.target.value === '' ? undefined : e.target.value === 'true',
                }))
              }
            >
              <option value="">Todos</option>
              <option value="true">Saludables</option>
              <option value="false">Con problemas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <IntegracionesTable
        data={data?.results || []}
        isLoading={isLoading}
      />

      {/* Modal de creación */}
      {showCreateModal && (
        <IntegracionFormModal
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
```

## 2. Tabla de Integraciones - IntegracionesTable.tsx

```typescript
import { useState } from 'react';
import { MoreVertical, Eye, Edit, Trash2, Activity, Power, AlertCircle } from 'lucide-react';
import { IntegracionExternaList } from '@/features/gestion-estrategica/types/strategic.types';
import { useToggleIntegracionStatus, useDeleteIntegracion } from '@/features/gestion-estrategica/hooks/useStrategic';
import Badge from '@/components/common/Badge';
import Dropdown from '@/components/common/Dropdown';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import IntegracionDetailModal from './IntegracionDetailModal';
import TestConnectionModal from './TestConnectionModal';

interface Props {
  data: IntegracionExternaList[];
  isLoading: boolean;
}

export default function IntegracionesTable({ data, isLoading }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const toggleMutation = useToggleIntegracionStatus();
  const deleteMutation = useDeleteIntegracion();

  const getStatusColor = (indicator: string) => {
    switch (indicator) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'danger':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-gray-600">Cargando integraciones...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
        <p className="mt-4 text-gray-600">No se encontraron integraciones</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Proveedor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ambiente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Salud
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tasa Éxito
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((integracion) => (
              <tr key={integracion.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {integracion.nombre}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {integracion.tipo_servicio_display}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {integracion.proveedor_display}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={integracion.ambiente === 'PRODUCCION' ? 'success' : 'warning'}>
                    {integracion.ambiente_display}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={integracion.is_active ? 'success' : 'danger'}>
                    {integracion.is_active ? 'Activa' : 'Inactiva'}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div
                      className={`h-2 w-2 rounded-full mr-2 ${
                        integracion.status_indicator === 'success'
                          ? 'bg-green-500'
                          : integracion.status_indicator === 'warning'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                    />
                    <span className="text-sm text-gray-900">
                      {integracion.is_healthy ? 'Saludable' : 'Con problemas'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {integracion.tasa_exito !== undefined
                      ? `${integracion.tasa_exito.toFixed(1)}%`
                      : 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Dropdown
                    trigger={
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    }
                    items={[
                      {
                        icon: Eye,
                        label: 'Ver Detalles',
                        onClick: () => {
                          setSelectedId(integracion.id);
                          setShowDetailModal(true);
                        },
                      },
                      {
                        icon: Activity,
                        label: 'Probar Conexión',
                        onClick: () => {
                          setSelectedId(integracion.id);
                          setShowTestModal(true);
                        },
                      },
                      {
                        icon: Power,
                        label: integracion.is_active ? 'Desactivar' : 'Activar',
                        onClick: () => toggleMutation.mutate(integracion.id),
                      },
                      { type: 'divider' },
                      {
                        icon: Edit,
                        label: 'Editar',
                        onClick: () => {
                          // TODO: Abrir modal de edición
                        },
                      },
                      {
                        icon: Trash2,
                        label: 'Eliminar',
                        onClick: () => setDeleteConfirm(integracion.id),
                        className: 'text-red-600',
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modales */}
      {showDetailModal && selectedId && (
        <IntegracionDetailModal
          integracionId={selectedId}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedId(null);
          }}
        />
      )}

      {showTestModal && selectedId && (
        <TestConnectionModal
          integracionId={selectedId}
          onClose={() => {
            setShowTestModal(false);
            setSelectedId(null);
          }}
        />
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Eliminar Integración"
          message="¿Está seguro que desea eliminar esta integración? Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          confirmVariant="danger"
          onConfirm={() => {
            deleteMutation.mutate(deleteConfirm);
            setDeleteConfirm(null);
          }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </>
  );
}
```

## 3. Formulario de Integración - IntegracionFormModal.tsx

```typescript
import { useState } from 'react';
import { X } from 'lucide-react';
import {
  useCreateIntegracion,
  useIntegracionChoices,
} from '@/features/gestion-estrategica/hooks/useStrategic';
import {
  CreateIntegracionDTO,
  TipoServicio,
  Proveedor,
  MetodoAutenticacion,
  Ambiente,
} from '@/features/gestion-estrategica/types/strategic.types';
import Button from '@/components/common/Button';
import Input from '@/components/forms/Input';
import Select from '@/components/forms/Select';
import Textarea from '@/components/forms/Textarea';

interface Props {
  onClose: () => void;
}

export default function IntegracionFormModal({ onClose }: Props) {
  const createMutation = useCreateIntegracion();
  const { data: choices } = useIntegracionChoices();

  const [formData, setFormData] = useState<Partial<CreateIntegracionDTO>>({
    nombre: '',
    descripcion: '',
    tipo_servicio: undefined,
    proveedor: undefined,
    ambiente: 'SANDBOX',
    metodo_autenticacion: 'API_KEY',
    url_base: '',
    credenciales: {},
    timeout_segundos: 30,
    reintentos_max: 3,
    is_active: true,
  });

  const [credencialesFields, setCredencialesFields] = useState<
    { key: string; value: string }[]
  >([{ key: '', value: '' }]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Construir credenciales desde fields
    const credenciales = credencialesFields.reduce((acc, field) => {
      if (field.key && field.value) {
        acc[field.key] = field.value;
      }
      return acc;
    }, {} as Record<string, string>);

    const data: CreateIntegracionDTO = {
      nombre: formData.nombre!,
      tipo_servicio: formData.tipo_servicio!,
      proveedor: formData.proveedor!,
      ambiente: formData.ambiente!,
      metodo_autenticacion: formData.metodo_autenticacion!,
      url_base: formData.url_base!,
      credenciales,
      descripcion: formData.descripcion,
      timeout_segundos: formData.timeout_segundos,
      reintentos_max: formData.reintentos_max,
      is_active: formData.is_active,
    };

    await createMutation.mutateAsync(data);
    onClose();
  };

  const addCredencialField = () => {
    setCredencialesFields([...credencialesFields, { key: '', value: '' }]);
  };

  const removeCredencialField = (index: number) => {
    setCredencialesFields(credencialesFields.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Nueva Integración Externa</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Información Básica
            </h3>

            <Input
              label="Nombre"
              required
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              placeholder="ej: Gmail Corporativo"
            />

            <Textarea
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              placeholder="Breve descripción de la integración"
              rows={3}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Tipo de Servicio"
                required
                value={formData.tipo_servicio}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tipo_servicio: e.target.value as TipoServicio,
                  })
                }
                options={
                  choices?.tipos_servicio.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  })) || []
                }
              />

              <Select
                label="Proveedor"
                required
                value={formData.proveedor}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    proveedor: e.target.value as Proveedor,
                  })
                }
                options={
                  choices?.proveedores.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  })) || []
                }
              />
            </div>
          </div>

          {/* Configuración */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Configuración</h3>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Ambiente"
                required
                value={formData.ambiente}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ambiente: e.target.value as Ambiente,
                  })
                }
                options={
                  choices?.ambientes.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  })) || []
                }
              />

              <Select
                label="Método de Autenticación"
                required
                value={formData.metodo_autenticacion}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metodo_autenticacion: e.target.value as MetodoAutenticacion,
                  })
                }
                options={
                  choices?.metodos_autenticacion.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  })) || []
                }
              />
            </div>

            <Input
              label="URL Base"
              required
              type="url"
              value={formData.url_base}
              onChange={(e) =>
                setFormData({ ...formData, url_base: e.target.value })
              }
              placeholder="https://api.example.com"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Timeout (segundos)"
                type="number"
                min={1}
                max={300}
                value={formData.timeout_segundos}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    timeout_segundos: parseInt(e.target.value),
                  })
                }
              />

              <Input
                label="Reintentos Máximos"
                type="number"
                min={0}
                max={10}
                value={formData.reintentos_max}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reintentos_max: parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>

          {/* Credenciales */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Credenciales</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCredencialField}
              >
                Agregar Campo
              </Button>
            </div>

            {credencialesFields.map((field, index) => (
              <div key={index} className="grid grid-cols-2 gap-4">
                <Input
                  label="Clave"
                  value={field.key}
                  onChange={(e) => {
                    const newFields = [...credencialesFields];
                    newFields[index].key = e.target.value;
                    setCredencialesFields(newFields);
                  }}
                  placeholder="ej: api_key"
                />
                <div className="relative">
                  <Input
                    label="Valor"
                    type="password"
                    value={field.value}
                    onChange={(e) => {
                      const newFields = [...credencialesFields];
                      newFields[index].value = e.target.value;
                      setCredencialesFields(newFields);
                    }}
                    placeholder="Valor de la credencial"
                  />
                  {credencialesFields.length > 1 && (
                    <button
                      type="button"
                      className="absolute right-2 top-8 text-red-500 hover:text-red-700"
                      onClick={() => removeCredencialField(index)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creando...' : 'Crear Integración'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

## 4. Modal de Test de Conexión - TestConnectionModal.tsx

```typescript
import { useState } from 'react';
import { X, CheckCircle, XCircle, Loader } from 'lucide-react';
import { useTestConnection } from '@/features/gestion-estrategica/hooks/useStrategic';
import { TestConnectionResult } from '@/features/gestion-estrategica/types/strategic.types';
import Button from '@/components/common/Button';

interface Props {
  integracionId: number;
  onClose: () => void;
}

export default function TestConnectionModal({ integracionId, onClose }: Props) {
  const testMutation = useTestConnection();
  const [result, setResult] = useState<TestConnectionResult | null>(null);

  const handleTest = async () => {
    const testResult = await testMutation.mutateAsync(integracionId);
    setResult(testResult);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Probar Conexión</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!result && !testMutation.isPending && (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                Haga clic en el botón para probar la conexión con el servicio externo.
              </p>
              <Button
                variant="primary"
                onClick={handleTest}
                disabled={testMutation.isPending}
              >
                Ejecutar Test
              </Button>
            </div>
          )}

          {testMutation.isPending && (
            <div className="text-center py-8">
              <Loader className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
              <p className="mt-4 text-gray-600">Probando conexión...</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div
                className={`flex items-center gap-3 p-4 rounded-lg ${
                  result.success
                    ? 'bg-green-50 text-green-900'
                    : 'bg-red-50 text-red-900'
                }`}
              >
                {result.success ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
                <div>
                  <p className="font-medium">
                    {result.success ? 'Conexión Exitosa' : 'Conexión Fallida'}
                  </p>
                  <p className="text-sm">{result.message}</p>
                </div>
              </div>

              {result.response_time_ms && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Tiempo de Respuesta</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {result.response_time_ms} ms
                  </p>
                </div>
              )}

              {result.error && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">Error</p>
                  <p className="text-sm text-red-900 mt-1">{result.error}</p>
                </div>
              )}

              {result.details && Object.keys(result.details).length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 font-medium mb-2">
                    Detalles Adicionales
                  </p>
                  <pre className="text-xs text-gray-800 overflow-x-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t px-6 py-4 flex justify-end gap-3">
          {result && (
            <Button
              variant="outline"
              onClick={() => {
                setResult(null);
                handleTest();
              }}
            >
              Probar Nuevamente
            </Button>
          )}
          <Button variant="primary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
```

## 5. Modal de Logs - IntegracionLogsModal.tsx

```typescript
import { useState } from 'react';
import { X, Download } from 'lucide-react';
import { useIntegracionLogs } from '@/features/gestion-estrategica/hooks/useStrategic';
import { formatDateTime } from '@/utils/formatters';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';

interface Props {
  integracionId: number;
  onClose: () => void;
}

export default function IntegracionLogsModal({ integracionId, onClose }: Props) {
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  const { data: logs, isLoading } = useIntegracionLogs(integracionId, {
    success: showOnlyErrors ? false : undefined,
    limit: 100,
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Logs de Integración</h2>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlyErrors}
                onChange={(e) => setShowOnlyErrors(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Solo errores</span>
            </label>
            <Button variant="outline" size="sm" icon={Download}>
              Exportar
            </Button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
              <p className="mt-4 text-gray-600">Cargando logs...</p>
            </div>
          ) : !logs || logs.results.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No se encontraron logs
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha/Hora
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Método
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Endpoint
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tiempo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Resultado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.results.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge
                        variant={
                          log.metodo === 'GET'
                            ? 'info'
                            : log.metodo === 'POST'
                            ? 'success'
                            : 'warning'
                        }
                      >
                        {log.metodo}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                      {log.endpoint}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <Badge
                        variant={
                          log.response_status && log.response_status < 300
                            ? 'success'
                            : 'danger'
                        }
                      >
                        {log.response_status || 'N/A'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {log.response_time_ms ? `${log.response_time_ms} ms` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={log.success ? 'success' : 'danger'}>
                        {log.success ? 'Éxito' : 'Error'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600 max-w-md truncate">
                      {log.error_message || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-t px-6 py-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Total: {logs?.count || 0} registros
            </p>
            <Button variant="primary" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Resumen de Componentes

1. **IntegracionesPage**: Página principal con filtros y tabla
2. **IntegracionesTable**: Tabla con acciones y estado visual
3. **IntegracionFormModal**: Formulario para crear/editar
4. **TestConnectionModal**: Probar conexión en tiempo real
5. **IntegracionLogsModal**: Ver historial de llamadas

Todos estos componentes están completamente tipados con TypeScript y usan los hooks de React Query para manejo de estado y cache.
