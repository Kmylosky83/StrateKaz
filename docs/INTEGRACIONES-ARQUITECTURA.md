# Arquitectura del Módulo de Integraciones Externas

## Diagrama de Capas

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                      │
│  (Componentes React - A implementar)                         │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Integraciones│  │ Formulario   │  │ Logs & Test  │      │
│  │   Table      │  │  Modal       │  │   Modals     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                CAPA DE LÓGICA (React Query Hooks)            │
│  frontend/src/features/gestion-estrategica/hooks/            │
│                                                               │
│  ✓ useIntegraciones(filters)                                 │
│  ✓ useIntegracion(id)                                        │
│  ✓ useIntegracionChoices()                                   │
│  ✓ useCreateIntegracion()                                    │
│  ✓ useUpdateIntegracion()                                    │
│  ✓ useDeleteIntegracion()                                    │
│  ✓ useTestConnection()                                       │
│  ✓ useToggleIntegracionStatus()                              │
│  ✓ useUpdateCredentials()                                    │
│  ✓ useIntegracionLogs(id, filters)                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  CAPA DE API CLIENT                          │
│  frontend/src/features/gestion-estrategica/api/              │
│                                                               │
│  integracionesApi {                                          │
│    ✓ getAll(filters)                                         │
│    ✓ getById(id)                                             │
│    ✓ create(data)                                            │
│    ✓ update(id, data)                                        │
│    ✓ delete(id)                                              │
│    ✓ testConnection(id)                                      │
│    ✓ toggleStatus(id)                                        │
│    ✓ getLogs(id, filters)                                    │
│    ✓ updateCredentials(id, data)                             │
│    ✓ getChoices()                                            │
│  }                                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE TIPOS                             │
│  frontend/src/features/gestion-estrategica/types/            │
│                                                               │
│  ✓ TipoServicio (10 tipos)                                   │
│  ✓ Proveedor (24 proveedores)                                │
│  ✓ MetodoAutenticacion (5 métodos)                           │
│  ✓ Ambiente (2 ambientes)                                    │
│  ✓ StatusIndicator (3 estados)                               │
│  ✓ IntegracionExterna (interfaz completa)                    │
│  ✓ IntegracionExternaList (interfaz lista)                   │
│  ✓ CreateIntegracionDTO                                      │
│  ✓ UpdateIntegracionDTO                                      │
│  ✓ UpdateCredencialesDTO                                     │
│  ✓ IntegracionFilters                                        │
│  ✓ TestConnectionResult                                      │
│  ✓ IntegracionLog                                            │
│  ✓ IntegracionLogsFilters                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND API                             │
│  (Django REST Framework - A implementar)                     │
│                                                               │
│  Endpoints:                                                   │
│  GET    /core/integraciones/                                 │
│  POST   /core/integraciones/                                 │
│  GET    /core/integraciones/{id}/                            │
│  PATCH  /core/integraciones/{id}/                            │
│  DELETE /core/integraciones/{id}/                            │
│  POST   /core/integraciones/{id}/test-connection/            │
│  POST   /core/integraciones/{id}/toggle-status/              │
│  GET    /core/integraciones/{id}/logs/                       │
│  PATCH  /core/integraciones/{id}/update-credentials/         │
│  GET    /core/integraciones/choices/                         │
└─────────────────────────────────────────────────────────────┘
```

## Flujo de Datos

### 1. Flujo de Lectura (Query)

```
Componente
    ↓
useIntegraciones(filters) → React Query
    ↓
integracionesApi.getAll(filters) → Axios
    ↓
GET /core/integraciones/?tipo_servicio=EMAIL&is_active=true
    ↓
Backend Response: PaginatedResponse<IntegracionExternaList>
    ↓
React Query Cache
    ↓
Componente (re-render con data)
```

### 2. Flujo de Creación (Mutation)

```
Componente (submit form)
    ↓
useCreateIntegracion().mutate(data)
    ↓
integracionesApi.create(data) → Axios
    ↓
POST /core/integraciones/
Body: CreateIntegracionDTO
    ↓
Backend Response: IntegracionExterna
    ↓
onSuccess: invalidateQueries(['integraciones'])
    ↓
toast.success('Integración creada exitosamente')
    ↓
React Query refetch automático
    ↓
Componente actualizado
```

### 3. Flujo de Test de Conexión

```
Componente (click button)
    ↓
useTestConnection().mutate(id)
    ↓
integracionesApi.testConnection(id)
    ↓
POST /core/integraciones/{id}/test-connection/
    ↓
Backend ejecuta test real contra API externa
    ↓
Response: TestConnectionResult {
  success: true,
  message: "Conexión exitosa",
  response_time_ms: 245,
  details: { ... }
}
    ↓
onSuccess: toast basado en result.success
    ↓
Componente muestra resultado
```

## Seguridad de Credenciales

```
┌─────────────────────────────────────────────────────────┐
│ FRONTEND                                                 │
│                                                          │
│ 1. Crear/Actualizar Credenciales:                       │
│    credenciales: {                                       │
│      api_key: "sk_live_xxx...",  ← Plain text           │
│      api_secret: "yyy..."                                │
│    }                                                     │
│                                                          │
│ 2. Ver Credenciales (GET):                              │
│    credenciales_masked: {                               │
│      api_key: "sk_live_***xxx",  ← Masked               │
│      api_secret: "***"                                   │
│    }                                                     │
└─────────────────────────────────────────────────────────┘
                      ↓ HTTPS ↓
┌─────────────────────────────────────────────────────────┐
│ BACKEND                                                  │
│                                                          │
│ 1. Almacenamiento:                                       │
│    DB → Encrypted with Fernet/AES-256                   │
│                                                          │
│ 2. Serialization:                                        │
│    - POST/PATCH: Acepta plain text                      │
│    - GET: Retorna masked                                 │
│    - write_only=True en campo credenciales              │
│                                                          │
│ 3. Uso interno:                                          │
│    - Decrypt solo cuando se necesita                     │
│    - No loggear credenciales                             │
│    - Limitar acceso a personal autorizado                │
└─────────────────────────────────────────────────────────┘
```

## Estado y Salud de Integraciones

```typescript
┌─────────────────────────────────────────────────────────┐
│ INDICADORES DE ESTADO                                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ is_active: boolean                                       │
│   ↳ Si la integración está habilitada (toggle manual)   │
│                                                          │
│ is_healthy: boolean                                      │
│   ↳ Si la última verificación fue exitosa               │
│                                                          │
│ status_indicator: 'success' | 'warning' | 'danger'       │
│   ↳ Indicador visual de salud                            │
│                                                          │
│ Lógica de status_indicator:                             │
│   - success:  is_active && is_healthy                    │
│   - warning:  is_active && !is_healthy                   │
│   - danger:   !is_active || critical_error               │
│                                                          │
│ ultima_verificacion: datetime                            │
│   ↳ Timestamp del último health check                    │
│                                                          │
│ ultimo_error: string | null                              │
│   ↳ Mensaje del último error (si existe)                 │
└─────────────────────────────────────────────────────────┘
```

## Métricas y Logs

```
┌─────────────────────────────────────────────────────────┐
│ ESTADÍSTICAS (en IntegracionExterna)                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ total_llamadas: 1,247                                    │
│ llamadas_exitosas: 1,193                                 │
│ llamadas_fallidas: 54                                    │
│ tasa_exito: 95.67%                                       │
│                                                          │
│ → Calculadas desde modelo IntegracionLog                 │
│ → Actualizadas en cada llamada                           │
│ → Cached en la entidad para performance                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ LOGS (IntegracionLog)                                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Cada llamada a API externa registra:                     │
│   - Timestamp                                            │
│   - Método HTTP                                          │
│   - Endpoint                                             │
│   - Tamaño del payload                                   │
│   - Status code de respuesta                             │
│   - Tiempo de respuesta (ms)                             │
│   - Success/Failure                                      │
│   - Mensaje de error (si aplica)                         │
│                                                          │
│ Uso:                                                     │
│   - Debugging                                            │
│   - Auditoría                                            │
│   - Métricas de performance                              │
│   - Detección de problemas                               │
└─────────────────────────────────────────────────────────┘
```

## Patrones de Diseño Implementados

### 1. Repository Pattern
```
integracionesApi → Abstrae acceso a datos
                → Centraliza llamadas HTTP
                → Facilita testing y mocking
```

### 2. Hook Pattern (React Query)
```
useIntegraciones → Encapsula lógica de fetching
                 → Maneja cache automáticamente
                 → Proporciona loading/error states
```

### 3. DTO Pattern
```
CreateIntegracionDTO → Separa datos de entrada
UpdateIntegracionDTO → del modelo completo
                     → Valida solo campos necesarios
```

### 4. Type Guard Pattern
```typescript
function isHealthyIntegracion(
  integracion: IntegracionExterna
): integracion is IntegracionExterna & { is_healthy: true } {
  return integracion.is_healthy && integracion.is_active;
}
```

### 5. Builder Pattern (en forms)
```typescript
// Construcción gradual de CreateIntegracionDTO
const builder = {
  setBasicInfo: (info) => ({ ...data, ...info }),
  setCredentials: (creds) => ({ ...data, credenciales: creds }),
  build: () => data as CreateIntegracionDTO
};
```

## Invalidación de Cache (React Query)

```
Query Keys:
['integraciones', filters?]          → Lista de integraciones
['integracion', id]                  → Detalle de integración
['integracion', id, 'logs', filters] → Logs de integración
['integracion-choices']              → Opciones para selects

Invalidación en mutaciones:

CREATE → Invalida ['integraciones']
UPDATE → Invalida ['integraciones'], ['integracion', id]
DELETE → Invalida ['integraciones']
TOGGLE → Invalida ['integraciones'], ['integracion', id]
UPDATE_CREDS → Invalida ['integracion', id]
```

## Type Safety Garantizado

```typescript
✓ Tipo de servicio restringido a valores válidos
✓ Proveedor debe ser compatible con tipo de servicio
✓ Método de autenticación influye en credenciales
✓ Ambiente solo PRODUCCION o SANDBOX
✓ Status indicator solo success/warning/danger
✓ Credenciales siempre Record<string, string>
✓ Filtros type-safe con autocomplete
✓ DTOs parciales para updates
✓ Responses paginadas tipadas
✓ Logs con campos específicos
```

## Siguiente Fase: Implementación Backend

```python
# Models (Django)
class IntegracionExterna(models.Model):
    # Campos según IntegracionExterna interface
    # Encriptación de credenciales con Fernet
    # Signals para actualizar estadísticas

class IntegracionLog(models.Model):
    # Campos según IntegracionLog interface
    # Índices en created_at, success
    # Retention policy (90 días)

# Serializers
class IntegracionExternaSerializer(serializers.ModelSerializer):
    credenciales = serializers.JSONField(write_only=True)
    credenciales_masked = serializers.SerializerMethodField()

# ViewSets
class IntegracionExternaViewSet(viewsets.ModelViewSet):
    @action(methods=['post'], detail=True)
    def test_connection(self, request, pk=None):
        # Lógica de test
        pass

    @action(methods=['post'], detail=True)
    def toggle_status(self, request, pk=None):
        # Toggle is_active
        pass

    @action(methods=['get'], detail=True)
    def logs(self, request, pk=None):
        # Retornar logs paginados
        pass
```

## Beneficios de esta Arquitectura

1. **Type Safety Completo**: TypeScript garantiza tipos en toda la capa frontend
2. **Reutilización**: Hooks compartidos en múltiples componentes
3. **Cache Inteligente**: React Query optimiza llamadas a API
4. **Invalidación Automática**: Datos siempre actualizados
5. **Error Handling**: Toast notifications consistentes
6. **Separación de Concerns**: Capas bien definidas
7. **Testeable**: Fácil mockear API y hooks
8. **Escalable**: Agregar nuevos proveedores es trivial
9. **Seguro**: Credenciales protegidas en todo momento
10. **Mantenible**: Código organizado y documentado

---

**Estado Actual:**
- ✓ Tipos TypeScript (184 líneas)
- ✓ API Client (62 líneas)
- ✓ React Query Hooks (124 líneas)
- ⏳ Componentes UI (pendiente)
- ⏳ Backend Django (pendiente)
- ⏳ Tests (pendiente)
