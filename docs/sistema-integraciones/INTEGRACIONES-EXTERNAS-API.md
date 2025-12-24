# Integraciones Externas - TypeScript API

Diseño completo del módulo de Integraciones Externas con tipos TypeScript, API client y React Query hooks.

## Ubicación de Archivos

- **Tipos**: `frontend/src/features/gestion-estrategica/types/strategic.types.ts`
- **API Client**: `frontend/src/features/gestion-estrategica/api/strategicApi.ts`
- **Hooks**: `frontend/src/features/gestion-estrategica/hooks/useStrategic.ts`

## 1. Tipos TypeScript

### Enums y Union Types

```typescript
// Tipos de servicio disponibles
type TipoServicio =
  | 'EMAIL'
  | 'FACTURACION'
  | 'SMS'
  | 'WHATSAPP'
  | 'MAPAS'
  | 'ALMACENAMIENTO'
  | 'BI'
  | 'PAGOS'
  | 'ERP'
  | 'FIRMA_DIGITAL';

// Proveedores soportados (agrupados por categoría)
type Proveedor =
  | 'GMAIL' | 'OUTLOOK' | 'SMTP_CUSTOM'  // Email
  | 'TWILIO' | 'MESSAGEBIRD'             // SMS
  | 'WHATSAPP_BUSINESS'                  // WhatsApp
  | 'DIAN'                               // Facturación
  | 'GOOGLE_DRIVE' | 'AWS_S3' | 'AZURE_BLOB' | 'GCS'  // Almacenamiento
  | 'GOOGLE_LOOKER' | 'GOOGLE_SHEETS'    // BI
  | 'PSE' | 'WOMPI' | 'PAYU' | 'MERCADOPAGO'  // Pagos
  | 'SIIGO' | 'ALEGRA' | 'WORLD_OFFICE' | 'SAP'  // ERP
  | 'CERTICAMARA' | 'GSE' | 'ANDES_SCD'  // Firma Digital
  | 'GOOGLE_MAPS' | 'OSM'                // Mapas
  | 'RUNT' | 'MINTRANSPORTE';            // Transporte

// Métodos de autenticación
type MetodoAutenticacion =
  | 'API_KEY'
  | 'OAUTH2'
  | 'BASIC_AUTH'
  | 'SERVICE_ACCOUNT'
  | 'CERTIFICATE';

// Ambiente de ejecución
type Ambiente = 'PRODUCCION' | 'SANDBOX';

// Indicador de estado visual
type StatusIndicator = 'success' | 'warning' | 'danger';
```

### Interfaces Principales

```typescript
// Detalle completo de una integración
interface IntegracionExterna {
  id: number;
  nombre: string;
  descripcion?: string | null;
  tipo_servicio: TipoServicio;
  proveedor: Proveedor;
  ambiente: Ambiente;
  metodo_autenticacion: MetodoAutenticacion;
  url_base: string;
  credenciales_masked?: Record<string, string>;  // Siempre enmascaradas
  configuracion_adicional?: Record<string, unknown> | null;
  timeout_segundos: number;
  reintentos_max: number;
  is_active: boolean;
  is_healthy: boolean;
  status_indicator: StatusIndicator;
  ultima_verificacion?: string | null;
  ultimo_error?: string | null;
  created_at: string;
  updated_at: string;
  // Estadísticas
  total_llamadas?: number;
  llamadas_exitosas?: number;
  llamadas_fallidas?: number;
  tasa_exito?: number;
}

// Versión simplificada para listados
interface IntegracionExternaList {
  id: number;
  nombre: string;
  tipo_servicio: TipoServicio;
  proveedor: Proveedor;
  ambiente: Ambiente;
  is_active: boolean;
  is_healthy: boolean;
  status_indicator: StatusIndicator;
  ultima_verificacion?: string | null;
  tasa_exito?: number;
}
```

### DTOs (Data Transfer Objects)

```typescript
// Crear nueva integración
interface CreateIntegracionDTO {
  nombre: string;
  descripcion?: string;
  tipo_servicio: TipoServicio;
  proveedor: Proveedor;
  ambiente: Ambiente;
  metodo_autenticacion: MetodoAutenticacion;
  url_base: string;
  credenciales: Record<string, string>;  // Sin enmascarar al crear
  configuracion_adicional?: Record<string, unknown>;
  timeout_segundos?: number;
  reintentos_max?: number;
  is_active?: boolean;
}

// Actualizar integración existente
interface UpdateIntegracionDTO {
  nombre?: string;
  descripcion?: string;
  ambiente?: Ambiente;
  url_base?: string;
  configuracion_adicional?: Record<string, unknown>;
  timeout_segundos?: number;
  reintentos_max?: number;
  is_active?: boolean;
}

// Actualizar solo credenciales
interface UpdateCredencialesDTO {
  credenciales: Record<string, string>;
}

// Filtros para búsqueda
interface IntegracionFilters {
  tipo_servicio?: TipoServicio;
  proveedor?: Proveedor;
  ambiente?: Ambiente;
  is_active?: boolean;
  is_healthy?: boolean;
  search?: string;
}
```

### Tipos Auxiliares

```typescript
// Resultado de test de conexión
interface TestConnectionResult {
  success: boolean;
  message: string;
  response_time_ms?: number;
  details?: Record<string, unknown>;
  error?: string | null;
}

// Log de integración
interface IntegracionLog {
  id: number;
  integracion: number;
  integracion_nombre?: string;
  metodo: string;
  endpoint: string;
  payload_size_bytes?: number;
  response_status?: number;
  response_time_ms?: number;
  success: boolean;
  error_message?: string | null;
  created_at: string;
}
```

## 2. API Client

### API de Integraciones (`integracionesApi`)

```typescript
const integracionesApi = {
  // Obtener todas las integraciones (con filtros opcionales)
  getAll: async (filters?: IntegracionFilters): Promise<PaginatedResponse<IntegracionExternaList>>

  // Obtener una integración por ID
  getById: async (id: number): Promise<IntegracionExterna>

  // Crear nueva integración
  create: async (data: CreateIntegracionDTO): Promise<IntegracionExterna>

  // Actualizar integración
  update: async (id: number, data: UpdateIntegracionDTO): Promise<IntegracionExterna>

  // Eliminar integración
  delete: async (id: number): Promise<void>

  // Probar conexión
  testConnection: async (id: number): Promise<TestConnectionResult>

  // Activar/desactivar integración
  toggleStatus: async (id: number): Promise<IntegracionExterna>

  // Obtener logs de la integración
  getLogs: async (id: number, filters?: IntegracionLogsFilters): Promise<PaginatedResponse<IntegracionLog>>

  // Actualizar solo credenciales
  updateCredentials: async (id: number, data: UpdateCredencialesDTO): Promise<IntegracionExterna>

  // Obtener opciones para selects
  getChoices: async (): Promise<{
    tipos_servicio: SelectOption[];
    proveedores: SelectOption[];
    ambientes: SelectOption[];
    metodos_autenticacion: SelectOption[];
  }>
}
```

## 3. React Query Hooks

### Hooks de Consulta (Query)

```typescript
// Listar integraciones con filtros
const { data, isLoading } = useIntegraciones(filters?: IntegracionFilters)

// Obtener una integración
const { data, isLoading } = useIntegracion(id: number)

// Obtener opciones para formularios
const { data: choices } = useIntegracionChoices()

// Obtener logs de una integración
const { data: logs } = useIntegracionLogs(id: number, filters?: IntegracionLogsFilters)
```

### Hooks de Mutación (Mutation)

```typescript
// Crear integración
const createMutation = useCreateIntegracion()
createMutation.mutate(data: CreateIntegracionDTO)

// Actualizar integración
const updateMutation = useUpdateIntegracion()
updateMutation.mutate({ id, data: UpdateIntegracionDTO })

// Eliminar integración
const deleteMutation = useDeleteIntegracion()
deleteMutation.mutate(id: number)

// Probar conexión
const testMutation = useTestConnection()
testMutation.mutate(id: number)

// Activar/desactivar
const toggleMutation = useToggleIntegracionStatus()
toggleMutation.mutate(id: number)

// Actualizar credenciales
const credentialsMutation = useUpdateCredentials()
credentialsMutation.mutate({ id, data: UpdateCredencialesDTO })
```

## 4. Ejemplos de Uso

### Ejemplo 1: Listar Integraciones

```typescript
import { useIntegraciones } from '@/features/gestion-estrategica/hooks/useStrategic';

function IntegracionesPage() {
  const [filters, setFilters] = useState<IntegracionFilters>({
    is_active: true,
  });

  const { data, isLoading } = useIntegraciones(filters);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h1>Integraciones Externas</h1>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Proveedor</th>
            <th>Estado</th>
            <th>Salud</th>
          </tr>
        </thead>
        <tbody>
          {data?.results.map((integracion) => (
            <tr key={integracion.id}>
              <td>{integracion.nombre}</td>
              <td>{integracion.tipo_servicio_display}</td>
              <td>{integracion.proveedor_display}</td>
              <td>
                <Badge variant={integracion.is_active ? 'success' : 'danger'}>
                  {integracion.is_active ? 'Activa' : 'Inactiva'}
                </Badge>
              </td>
              <td>
                <StatusBadge indicator={integracion.status_indicator}>
                  {integracion.is_healthy ? 'Saludable' : 'Con problemas'}
                </StatusBadge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Ejemplo 2: Crear Integración de Email

```typescript
import { useCreateIntegracion, useIntegracionChoices } from '@/features/gestion-estrategica/hooks/useStrategic';

function CrearIntegracionEmailForm() {
  const createMutation = useCreateIntegracion();
  const { data: choices } = useIntegracionChoices();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: CreateIntegracionDTO = {
      nombre: 'Gmail Corporativo',
      descripcion: 'Servicio de correo corporativo',
      tipo_servicio: 'EMAIL',
      proveedor: 'GMAIL',
      ambiente: 'PRODUCCION',
      metodo_autenticacion: 'OAUTH2',
      url_base: 'https://gmail.googleapis.com',
      credenciales: {
        client_id: 'xxx',
        client_secret: 'yyy',
        refresh_token: 'zzz',
      },
      timeout_segundos: 30,
      reintentos_max: 3,
      is_active: true,
    };

    createMutation.mutate(data);
  };

  return <form onSubmit={handleSubmit}>{/* Campos del formulario */}</form>;
}
```

### Ejemplo 3: Probar Conexión

```typescript
import { useTestConnection } from '@/features/gestion-estrategica/hooks/useStrategic';

function TestConnectionButton({ integracionId }: { integracionId: number }) {
  const testMutation = useTestConnection();

  const handleTest = async () => {
    const result = await testMutation.mutateAsync(integracionId);

    if (result.success) {
      console.log(`Conexión OK - Tiempo: ${result.response_time_ms}ms`);
    } else {
      console.error(`Error: ${result.error}`);
    }
  };

  return (
    <button
      onClick={handleTest}
      disabled={testMutation.isPending}
    >
      {testMutation.isPending ? 'Probando...' : 'Probar Conexión'}
    </button>
  );
}
```

### Ejemplo 4: Ver Logs de Integración

```typescript
import { useIntegracionLogs } from '@/features/gestion-estrategica/hooks/useStrategic';

function IntegracionLogsModal({ integracionId }: { integracionId: number }) {
  const { data: logs, isLoading } = useIntegracionLogs(integracionId, {
    limit: 50,
    success: false, // Solo logs fallidos
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h3>Logs de Integración</h3>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Método</th>
            <th>Endpoint</th>
            <th>Status</th>
            <th>Tiempo</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          {logs?.results.map((log) => (
            <tr key={log.id}>
              <td>{formatDateTime(log.created_at)}</td>
              <td>{log.metodo}</td>
              <td>{log.endpoint}</td>
              <td>{log.response_status}</td>
              <td>{log.response_time_ms}ms</td>
              <td className="text-red-600">{log.error_message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Ejemplo 5: Actualizar Credenciales

```typescript
import { useUpdateCredentials } from '@/features/gestion-estrategica/hooks/useStrategic';

function ActualizarCredencialesModal({
  integracionId,
  onClose
}: {
  integracionId: number;
  onClose: () => void;
}) {
  const updateMutation = useUpdateCredentials();
  const [credenciales, setCredenciales] = useState({
    api_key: '',
    api_secret: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await updateMutation.mutateAsync({
      id: integracionId,
      data: { credenciales },
    });

    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <h3>Actualizar Credenciales</h3>
        <Input
          label="API Key"
          type="password"
          value={credenciales.api_key}
          onChange={(e) => setCredenciales(prev => ({
            ...prev,
            api_key: e.target.value
          }))}
        />
        <Input
          label="API Secret"
          type="password"
          value={credenciales.api_secret}
          onChange={(e) => setCredenciales(prev => ({
            ...prev,
            api_secret: e.target.value
          }))}
        />
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </form>
    </Modal>
  );
}
```

### Ejemplo 6: Toggle de Estado

```typescript
import { useToggleIntegracionStatus } from '@/features/gestion-estrategica/hooks/useStrategic';

function IntegracionStatusToggle({
  integracion
}: {
  integracion: IntegracionExterna;
}) {
  const toggleMutation = useToggleIntegracionStatus();

  const handleToggle = () => {
    toggleMutation.mutate(integracion.id);
  };

  return (
    <Switch
      checked={integracion.is_active}
      onChange={handleToggle}
      disabled={toggleMutation.isPending}
      label={integracion.is_active ? 'Activa' : 'Inactiva'}
    />
  );
}
```

## 5. Patrones Avanzados de TypeScript

### Type Guards para Validación

```typescript
// Validar si una integración está saludable
function isHealthyIntegracion(
  integracion: IntegracionExterna
): integracion is IntegracionExterna & { is_healthy: true } {
  return integracion.is_healthy && integracion.is_active;
}

// Uso
if (isHealthyIntegracion(integracion)) {
  // TypeScript sabe que is_healthy es true aquí
  console.log('Integración lista para usar');
}
```

### Tipos Condicionales

```typescript
// Tipo de credenciales según el método de autenticación
type CredencialesPorMetodo<T extends MetodoAutenticacion> =
  T extends 'API_KEY' ? { api_key: string } :
  T extends 'OAUTH2' ? { client_id: string; client_secret: string; refresh_token: string } :
  T extends 'BASIC_AUTH' ? { username: string; password: string } :
  T extends 'SERVICE_ACCOUNT' ? { service_account_json: string } :
  T extends 'CERTIFICATE' ? { certificate_pem: string; private_key_pem: string } :
  Record<string, string>;

// Uso con tipo específico
type CredencialesOAuth2 = CredencialesPorMetodo<'OAUTH2'>;
// { client_id: string; client_secret: string; refresh_token: string }
```

### Mapped Types para Configuración

```typescript
// Configuración específica por proveedor
type ConfiguracionPorProveedor = {
  [K in Proveedor]: {
    required_credentials: string[];
    default_timeout: number;
    max_retries: number;
  };
};

const proveedorConfig: Partial<ConfiguracionPorProveedor> = {
  GMAIL: {
    required_credentials: ['client_id', 'client_secret', 'refresh_token'],
    default_timeout: 30,
    max_retries: 3,
  },
  TWILIO: {
    required_credentials: ['account_sid', 'auth_token'],
    default_timeout: 10,
    max_retries: 2,
  },
};
```

### Utility Types Personalizados

```typescript
// Extraer integraciones por tipo de servicio
type IntegracionesPorTipo<T extends TipoServicio> = IntegracionExterna & {
  tipo_servicio: T;
};

// Uso
type IntegracionesEmail = IntegracionesPorTipo<'EMAIL'>;
type IntegracionesPagos = IntegracionesPorTipo<'PAGOS'>;

// Hacer campos requeridos opcionales
type PartialIntegracion = Partial<Pick<IntegracionExterna,
  'descripcion' | 'configuracion_adicional' | 'ultimo_error'
>>;

// Excluir credenciales de un tipo
type IntegracionSinCredenciales = Omit<IntegracionExterna, 'credenciales_masked'>;
```

## 6. Invalidación de Queries

Las mutaciones automáticamente invalidan las queries relacionadas:

```typescript
// Al crear/actualizar/eliminar integraciones
- ['integraciones', filters]
- ['integracion', id]

// Al actualizar credenciales
- ['integracion', id]

// Al obtener logs
- ['integracion', id, 'logs', filters]
```

## 7. Manejo de Errores

Todos los hooks incluyen manejo de errores con toast notifications:

```typescript
const createMutation = useCreateIntegracion();

// Éxito
createMutation.onSuccess -> toast.success('Integración creada exitosamente')

// Error
createMutation.onError -> toast.error('Error al crear la integración')

// Uso manual del error
if (createMutation.error) {
  console.error(createMutation.error);
}
```

## 8. Seguridad

- Las credenciales SIEMPRE se devuelven enmascaradas en las respuestas GET
- Solo se envían credenciales sin enmascarar en CREATE y UPDATE_CREDENTIALS
- Los campos sensibles usan `type="password"` en formularios
- Las credenciales se almacenan encriptadas en el backend

## 9. Performance

- `staleTime: Infinity` para choices (opciones estáticas)
- Queries habilitadas condicionalmente con `enabled: !!id`
- Paginación incluida en todas las listas
- Invalidación selectiva de queries específicas

## 10. Próximos Pasos

1. Implementar componentes UI:
   - `IntegracionesTable.tsx`
   - `IntegracionForm.tsx`
   - `IntegracionDetailModal.tsx`
   - `TestConnectionModal.tsx`
   - `IntegracionLogsModal.tsx`

2. Agregar validación con Zod:
   - Esquemas de validación para cada tipo de integración
   - Validación de credenciales según método de autenticación

3. Implementar dashboard de salud:
   - Monitoreo en tiempo real
   - Alertas de integraciones caídas
   - Métricas de performance

---

**Archivos Modificados:**
- `frontend/src/features/gestion-estrategica/types/strategic.types.ts` (184 líneas agregadas)
- `frontend/src/features/gestion-estrategica/api/strategicApi.ts` (62 líneas agregadas)
- `frontend/src/features/gestion-estrategica/hooks/useStrategic.ts` (124 líneas agregadas)

**Total:** 370 líneas de código TypeScript type-safe
