# AUDITORÍA COMPLETA DEL BACKEND - MÓDULO INTEGRACIONES
**Sistema de Gestión StrateKaz**

**Fecha**: 2026-01-18
**Autor**: Arquitecto de Datos Senior
**Alcance**: Backend completo del módulo de Integraciones

---

## RESUMEN EJECUTIVO

StrateKaz cuenta con **TRES (3) módulos de integración** distribuidos en diferentes aplicaciones del backend:

1. **`accounting.integracion`** - Integración Contable
2. **`analytics.exportacion_integracion`** - Exportación de Datos Analytics
3. **`gestion_estrategica.configuracion.IntegracionExterna`** - Integraciones con Servicios Externos (Principal)

### Estado General
- **Estado**: ✅ **IMPLEMENTADO Y FUNCIONAL**
- **Arquitectura**: Multi-tenant con aislamiento por empresa
- **Seguridad**: ✅ Encriptación de credenciales implementada (Fernet)
- **Auditoría**: ✅ Logs completos de integración
- **API**: ✅ RESTful con ViewSets completos

---

## 1. MÓDULO PRINCIPAL: INTEGRACIÓN CON SERVICIOS EXTERNOS

**Ubicación**: `backend/apps/gestion_estrategica/configuracion/`

### 1.1. MODELOS

#### **TipoServicioIntegracion** - Catálogo Dinámico de Tipos

**Archivo**: `models.py` (líneas 1244-1339)

```python
class TipoServicioIntegracion(TimestampedModel, SoftDeleteModel):
    """Define categorías de servicios externos"""
```

**Campos**:
| Campo | Tipo | Índice | Descripción |
|-------|------|--------|-------------|
| `code` | CharField(30) | ✅ UNIQUE | Código único (EMAIL, FACTURACION, etc.) |
| `name` | CharField(100) | - | Nombre descriptivo |
| `category` | CharField(50) | - | Categoría (Comunicación, Tributario, etc.) |
| `description` | TextField | - | Descripción del servicio |
| `icon` | CharField(50) | - | Icono Lucide |
| `orden` | PositiveInteger | - | Orden de visualización |
| `es_sistema` | Boolean | - | Tipo predefinido del sistema |

**Tipos de Servicio Predefinidos** (26 tipos):
- **Comunicación**: EMAIL, SMS, WHATSAPP, NOTIFICACIONES
- **Tributario**: FACTURACION, NOMINA, RADIAN
- **Archivos**: ALMACENAMIENTO, CDN, BACKUP
- **Analítica**: BI, ANALYTICS
- **Financiero**: PAGOS, PSE, BANCARIO
- **Geolocalización**: MAPAS, RASTREO
- **Legal**: FIRMA_DIGITAL
- **Sistemas**: ERP, CRM
- **Otros**: API_TERCEROS, WEBHOOK, OTRO

**Validaciones**:
- ✅ Unicidad de `code`
- ✅ Soft delete implementado

**Métodos**:
- `cargar_tipos_sistema()`: Carga los 26 tipos predefinidos

---

#### **ProveedorIntegracion** - Catálogo Dinámico de Proveedores

**Archivo**: `models.py` (líneas 1346-1461)

```python
class ProveedorIntegracion(TimestampedModel, SoftDeleteModel):
    """Define proveedores de servicios externos"""
```

**Campos**:
| Campo | Tipo | Índice | Relación | Descripción |
|-------|------|--------|----------|-------------|
| `code` | CharField(50) | ✅ UNIQUE | - | Código único (GMAIL, DIAN, AWS_S3) |
| `name` | CharField(100) | - | - | Nombre del proveedor |
| `tipo_servicio` | ForeignKey | - | TipoServicioIntegracion | Tipo de servicio principal |
| `website` | URLField | - | - | Sitio web del proveedor |
| `documentation_url` | URLField | - | - | URL de documentación API |
| `description` | TextField | - | - | Descripción |
| `logo` | CharField(100) | - | - | Logo del proveedor |
| `pais_origen` | CharField(50) | - | - | País de origen |
| `orden` | PositiveInteger | - | - | Orden de visualización |
| `es_sistema` | Boolean | - | - | Proveedor predefinido |

**Proveedores Predefinidos** (31 proveedores):

**Email**: GMAIL, OUTLOOK, SENDGRID, SES
**SMS/WhatsApp**: TWILIO, INFOBIP
**Facturación Colombia**: DIAN, CARVAJAL, SIIGO, ALEGRA
**Almacenamiento**: AWS_S3, GOOGLE_DRIVE, AZURE_BLOB
**BI**: POWER_BI, METABASE
**Pagos Colombia**: PAYU, WOMPI, MERCADOPAGO, EVERTEC
**Mapas**: GOOGLE_MAPS, MAPBOX
**Firma Digital Colombia**: CERTICAMARA, ANDES_SCD
**Otros**: PERSONALIZADO, OTRO

**Validaciones**:
- ✅ Unicidad de `code`
- ✅ Soft delete implementado

**Métodos**:
- `cargar_proveedores_sistema()`: Carga los 31 proveedores predefinidos

---

#### **IntegracionExterna** - Configuración de Integraciones (PRINCIPAL)

**Archivo**: `models.py` (líneas 1509-1842+)

```python
class IntegracionExterna(AuditModel, SoftDeleteModel):
    """
    Gestiona las conexiones con servicios externos.
    SEGURIDAD: Las credenciales se almacenan ENCRIPTADAS con cryptography.fernet
    """
```

**Campos de Identificación**:
| Campo | Tipo | Índice | Relación | Descripción |
|-------|------|--------|----------|-------------|
| `nombre` | CharField(150) | - | - | Nombre descriptivo |
| `tipo_servicio` | ForeignKey | ✅ | TipoServicioIntegracion | Tipo de servicio |
| `proveedor` | ForeignKey | ✅ | ProveedorIntegracion | Proveedor |
| `descripcion` | TextField | - | - | Descripción detallada |

**Configuración Técnica**:
| Campo | Tipo | Índice | Descripción |
|-------|------|--------|-------------|
| `endpoint_url` | URLField(500) | - | URL base de la API |
| `metodo_autenticacion` | CharField(30) | - | Tipo de autenticación |
| `_credenciales_encrypted` | TextField | - | **ENCRIPTADAS** con Fernet |
| `configuracion_adicional` | JSONField | - | Parámetros adicionales |

**Métodos de Autenticación Soportados** (10 tipos):
- `API_KEY`: API Key simple
- `BEARER_TOKEN`: Bearer Token
- `OAUTH2`: OAuth 2.0
- `OAUTH1`: OAuth 1.0
- `BASIC_AUTH`: Usuario/Contraseña
- `JWT`: JSON Web Token
- `SERVICE_ACCOUNT`: Cuenta de servicio (Google, AWS)
- `CERTIFICATE`: Certificado digital TLS/SSL
- `HMAC`: HMAC Signature
- `CUSTOM`: Autenticación personalizada

**Control y Monitoreo**:
| Campo | Tipo | Índice | Descripción |
|-------|------|--------|-------------|
| `ambiente` | CharField(20) | ✅ | PRODUCCION / SANDBOX / DESARROLLO |
| `is_active` | Boolean | - | Estado activo/inactivo |
| `ultima_conexion_exitosa` | DateTime | - | Última conexión exitosa |
| `ultima_falla` | DateTime | - | Última falla registrada |
| `contador_llamadas` | Integer | - | Total de llamadas API |
| `errores_recientes` | JSONField | - | Últimos 10 errores |

**Límites y Alertas**:
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `limite_llamadas_dia` | Integer | Límite diario de llamadas |
| `alerta_porcentaje_limite` | Integer | % para alerta (default: 80) |

**Campos Heredados**:
- De `AuditModel`: `created_at`, `updated_at`, `created_by`, `updated_by`
- De `SoftDeleteModel`: `deleted_at`, `soft_delete()`, `restore()`, `is_deleted`

**Índices**:
```python
indexes = [
    Index(fields=['tipo_servicio', 'is_active']),
    Index(fields=['proveedor', 'is_active']),
    Index(fields=['ambiente']),
    Index(fields=['deleted_at']),
]
```

**Tabla en DB**: `configuracion_integracion_externa`

---

### 1.2. SEGURIDAD: ENCRIPTACIÓN DE CREDENCIALES

**Implementación**: Cryptography Fernet (cifrado simétrico)

**Función de Encriptación**:
```python
def get_encryption_key():
    """
    Obtiene clave de encriptación desde .env o usa clave de desarrollo.
    Variable: ENCRYPTION_KEY
    Generación: Fernet.generate_key()
    """
```

**⚠️ ADVERTENCIA DE SEGURIDAD**:
- En **desarrollo**: Usa clave fija `DEV_ENCRYPTION_KEY`
- En **producción**: DEBE configurarse `ENCRYPTION_KEY` en `.env`
- Comando de generación: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`

**Property `credenciales` (Getter)**:
```python
@property
def credenciales(self):
    """
    Desencripta y retorna credenciales como dict.
    Returns: dict con credenciales desencriptadas
    """
    if not self._credenciales_encrypted:
        return {}

    fernet = Fernet(get_encryption_key())
    decrypted_bytes = fernet.decrypt(self._credenciales_encrypted.encode())
    return json.loads(decrypted_bytes.decode())
```

**Property `credenciales` (Setter)**:
```python
@credenciales.setter
def credenciales(self, value):
    """
    Encripta y almacena credenciales.
    Args: dict con credenciales

    Ejemplos:
    - API_KEY: {'api_key': 'sk_test_xxxxx'}
    - OAUTH2: {'client_id': 'xxx', 'client_secret': 'yyy', 'refresh_token': 'zzz'}
    - BASIC_AUTH: {'username': 'user', 'password': 'pass'}
    """
    fernet = Fernet(get_encryption_key())
    json_bytes = json.dumps(value).encode()
    encrypted_bytes = fernet.encrypt(json_bytes)
    self._credenciales_encrypted = encrypted_bytes.decode()
```

**Propiedades Computadas**:
```python
@property
def is_healthy(self):
    """
    Determina si la integración está saludable.
    Criterios:
    - Última conexión exitosa en las últimas 24 horas
    - Sin errores recientes críticos
    """

@property
def porcentaje_uso_limite(self):
    """Calcula % de uso del límite diario"""
    return (self.contador_llamadas / self.limite_llamadas_dia) * 100

@property
def requiere_alerta_limite(self):
    """Retorna True si uso >= alerta_porcentaje_limite"""
```

---

### 1.3. SERIALIZERS

**Archivo**: `serializers.py` (líneas 507-806)

#### **IntegracionExternaSerializer** (Completo)

**Campos**:
- ✅ Todos los campos del modelo
- ✅ `credenciales_masked`: Credenciales enmascaradas (muestra solo últimos 4 caracteres)
- ✅ Campos computados: `is_healthy`, `status_indicator`, `porcentaje_uso_limite`
- ✅ Display names: `tipo_servicio_display`, `proveedor_display`, `metodo_autenticacion_display`
- ✅ Auditoría: `created_by_name`, `updated_by_name`

**Seguridad**:
```python
def get_credenciales_masked(self, obj):
    """
    Retorna credenciales enmascaradas.
    Ejemplo: {'api_key': '****3x7z'}
    """
    credenciales = obj.credenciales
    masked = {}
    for key, value in credenciales.items():
        if isinstance(value, str) and len(value) > 4:
            masked[key] = f"****{value[-4:]}"
        else:
            masked[key] = "****"
    return masked
```

**Read-only fields**:
- `id`, `ultima_conexion_exitosa`, `ultima_falla`, `contador_llamadas`
- `errores_recientes`, `created_at`, `updated_at`, `deleted_at`
- Todos los campos computados

---

#### **IntegracionExternaListSerializer** (Simplificado)

**Uso**: Listados y tablas

**Campos**:
- `id`, `nombre`, `tipo_servicio`, `proveedor`, `ambiente`
- `is_active`, `is_healthy`, `status_indicator`
- `ultima_conexion_exitosa`, `ultima_falla`

---

#### **IntegracionExternaChoicesSerializer**

**Uso**: Poblar dropdowns en frontend

**Métodos**:
```python
def get_tipos_servicio(self, obj):
    """Retorna tipos desde TipoServicioIntegracion"""
    return [
        {
            'value': t.id,
            'label': t.name,
            'code': t.code,
            'category': t.category,
            'icon': t.icon,
        }
        for t in TipoServicioIntegracion.objects.filter(is_active=True)
    ]

def get_proveedores(self, obj):
    """Retorna proveedores desde ProveedorIntegracion"""

def get_metodos_autenticacion(self, obj):
    """Retorna métodos de autenticación"""

def get_ambientes(self, obj):
    """Retorna ambientes (PRODUCCION, SANDBOX, DESARROLLO)"""
```

---

#### **IntegracionExternaCredencialesSerializer** 🔒

**Uso**: Ver/editar credenciales completas

**⚠️ SEGURIDAD**: Solo accesible por SuperAdmin

**Campos**:
- `id`, `nombre`, `metodo_autenticacion`
- `credenciales`: **Expone credenciales desencriptadas completas**
- `credenciales_validas`: Boolean de validación
- `mensaje_validacion`: Mensaje de error si hay problemas

---

### 1.4. VIEWSET Y API

**Archivo**: `views.py` (líneas 341-540+)

#### **IntegracionExternaViewSet**

**Base**: `viewsets.ModelViewSet`

**Permisos**:
```python
permission_classes = [IsAuthenticated, GranularActionPermission]
section_code = 'integraciones'
```

**Endpoints CRUD**:
| Método | Endpoint | Permiso | Descripción |
|--------|----------|---------|-------------|
| GET | `/integraciones-externas/` | can_view | Lista integraciones |
| POST | `/integraciones-externas/` | can_create | Crea integración |
| GET | `/integraciones-externas/{id}/` | can_view | Detalle |
| PUT/PATCH | `/integraciones-externas/{id}/` | can_edit | Actualiza |
| DELETE | `/integraciones-externas/{id}/` | can_delete | Soft delete |

**Acciones Personalizadas**:

**1. GET `/integraciones-externas/choices/`**
```python
@action(detail=False, methods=['get'])
def choices(self, request):
    """Retorna opciones para dropdowns (tipos, proveedores, métodos, ambientes)"""
```

**2. POST `/integraciones-externas/{id}/test_connection/`**
```python
@action(detail=True, methods=['post'])
def test_connection(self, request, pk=None):
    """
    Prueba la conexión con el servicio externo.
    - Valida credenciales
    - Registra éxito/error
    - TODO: Implementación real por tipo de servicio
    """
```

**3. POST `/integraciones-externas/{id}/toggle_status/`**
```python
@action(detail=True, methods=['post'])
def toggle_status(self, request, pk=None):
    """Activa o desactiva una integración"""
```

**4. GET `/integraciones-externas/{id}/logs/`**
```python
@action(detail=True, methods=['get'])
def logs(self, request, pk=None):
    """Retorna errores_recientes de la integración"""
```

**5. PUT `/integraciones-externas/{id}/update_credentials/`**
```python
@action(detail=True, methods=['put'])
def update_credentials(self, request, pk=None):
    """
    Actualiza credenciales encriptadas.
    Usa IntegracionExternaCredencialesSerializer
    """
```

**6. POST `/integraciones-externas/{id}/restore/`**
```python
@action(detail=True, methods=['post'])
def restore(self, request, pk=None):
    """Restaura una integración eliminada lógicamente"""
```

**7. POST `/integraciones-externas/{id}/clear_errors/`**
```python
@action(detail=True, methods=['post'])
def clear_errors(self, request, pk=None):
    """Limpia el log de errores recientes"""
```

**Filtros**:
```python
filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
filterset_fields = ['tipo_servicio', 'proveedor', 'is_active', 'ambiente']
search_fields = ['nombre', 'descripcion']
ordering_fields = ['nombre', 'created_at', 'ultima_conexion_exitosa']
ordering = ['-is_active', 'nombre']
```

**Query Parameter Especial**:
- `?include_deleted=true`: Incluye integraciones eliminadas

**Soft Delete Override**:
```python
def destroy(self, request, *args, **kwargs):
    """
    Implementa soft delete en lugar de eliminación física.
    Llama a instance.soft_delete()
    """
```

---

### 1.5. URLS

**Base URL**: `/api/configuracion/integraciones-externas/`

**Rutas Completas**:
```
GET    /api/configuracion/integraciones-externas/
POST   /api/configuracion/integraciones-externas/
GET    /api/configuracion/integraciones-externas/choices/
GET    /api/configuracion/integraciones-externas/{id}/
PUT    /api/configuracion/integraciones-externas/{id}/
PATCH  /api/configuracion/integraciones-externas/{id}/
DELETE /api/configuracion/integraciones-externas/{id}/
POST   /api/configuracion/integraciones-externas/{id}/test_connection/
POST   /api/configuracion/integraciones-externas/{id}/toggle_status/
GET    /api/configuracion/integraciones-externas/{id}/logs/
PUT    /api/configuracion/integraciones-externas/{id}/update_credentials/
POST   /api/configuracion/integraciones-externas/{id}/restore/
POST   /api/configuracion/integraciones-externas/{id}/clear_errors/
```

---

## 2. MÓDULO: INTEGRACIÓN CONTABLE

**Ubicación**: `backend/apps/accounting/integracion/`

### 2.1. MODELOS

#### **ParametrosIntegracion** - Mapeo de Cuentas

**Archivo**: `models.py` (líneas 23-98)

```python
class ParametrosIntegracion(BaseCompanyModel):
    """
    Define el mapeo de cuentas contables para cada módulo integrado:
    - Tesorería, Nómina, Inventarios, Activos Fijos, Ventas, Compras
    """
```

**Campos**:
| Campo | Tipo | Índice | Relación | Descripción |
|-------|------|--------|----------|-------------|
| `empresa` | ForeignKey | ✅ | EmpresaConfig | Multi-tenant |
| `modulo` | CharField(50) | ✅ | - | Módulo de origen |
| `clave` | CharField(100) | ✅ | - | Identificador del parámetro |
| `descripcion` | CharField(200) | - | - | Descripción |
| `cuenta_contable` | ForeignKey | - | CuentaContable | Cuenta destino |
| `configuracion_json` | JSONField | - | - | Config adicional |
| `activo` | Boolean | ✅ | - | Estado |

**Módulos Soportados**:
- `tesoreria`: Bancos, Cuentas por pagar/cobrar
- `nomina`: Gastos de personal, retenciones, seguridad social
- `inventarios`: Inventarios, costo de ventas
- `activos_fijos`: Activos, depreciaciones
- `ventas`: Ingresos por ventas
- `compras`: Gastos por compras

**Constraints**:
```python
UniqueConstraint(
    fields=['empresa', 'modulo', 'clave'],
    name='unique_parametro_por_modulo'
)
```

**Índices**:
```python
Index(fields=['empresa', 'modulo', 'clave'])
Index(fields=['activo'])
```

**Tabla**: `accounting_parametros_integracion`

---

#### **LogIntegracion** - Registro de Movimientos Automáticos

**Archivo**: `models.py` (líneas 104-202)

```python
class LogIntegracion(models.Model):
    """
    Log de Integración Contable.
    Registra movimientos contables generados automáticamente
    desde otros módulos para auditoría y trazabilidad.
    """
```

**Campos**:
| Campo | Tipo | Índice | Relación | Descripción |
|-------|------|--------|----------|-------------|
| `empresa` | ForeignKey | ✅ | EmpresaConfig | Multi-tenant |
| `modulo_origen` | CharField(50) | ✅ | - | Módulo que genera |
| `documento_origen_tipo` | CharField(50) | - | - | Tipo de documento |
| `documento_origen_id` | Integer | ✅ | - | ID del documento |
| `comprobante` | ForeignKey | - | ComprobanteContable | Comprobante generado |
| `estado` | CharField(20) | ✅ | - | Estado del proceso |
| `descripcion` | TextField | - | - | Descripción |
| `datos_json` | JSONField | - | - | Datos del proceso |
| `mensaje_error` | TextField | - | - | Error si aplica |
| `created_at` | DateTime | ✅ | - | Fecha de creación |
| `procesado_at` | DateTime | - | - | Fecha de procesamiento |
| `created_by` | ForeignKey | - | User | Usuario |

**Estados**:
- `pendiente`: En espera
- `procesando`: En proceso
- `exitoso`: Completado exitosamente
- `error`: Error en el proceso
- `revertido`: Revertido

**Índices**:
```python
Index(fields=['empresa', 'estado', 'created_at'])
Index(fields=['modulo_origen', 'documento_origen_id'])
Index(fields=['estado'])
```

**Tabla**: `accounting_log_integracion`

---

#### **ColaContabilizacion** - Cola de Procesamiento Asíncrono

**Archivo**: `models.py` (líneas 209-328)

```python
class ColaContabilizacion(models.Model):
    """
    Cola de documentos pendientes de contabilizar.
    Permite procesar contabilizaciones de forma asíncrona.
    """
```

**Campos**:
| Campo | Tipo | Índice | Relación | Descripción |
|-------|------|--------|----------|-------------|
| `empresa` | ForeignKey | ✅ | EmpresaConfig | Multi-tenant |
| `modulo_origen` | CharField(50) | ✅ | - | Módulo de origen |
| `documento_origen_tipo` | CharField(50) | - | - | Tipo de documento |
| `documento_origen_id` | Integer | ✅ | - | ID del documento |
| `prioridad` | Integer | ✅ | - | Prioridad (1-9) |
| `estado` | CharField(20) | ✅ | - | Estado |
| `datos_json` | JSONField | - | - | Datos a procesar |
| `comprobante_generado` | ForeignKey | - | ComprobanteContable | Comprobante |
| `mensaje_error` | TextField | - | - | Error |
| `intentos` | Integer | - | - | Intentos realizados |
| `max_intentos` | Integer | - | - | Máximo de intentos |
| `created_at` | DateTime | ✅ | - | Fecha de creación |
| `procesado_at` | DateTime | - | - | Fecha de procesamiento |
| `proximo_intento_at` | DateTime | ✅ | - | Próximo intento |

**Prioridades**:
- `1`: Muy Alta
- `3`: Alta
- `5`: Normal (default)
- `7`: Baja
- `9`: Muy Baja

**Estados**:
- `pendiente`: Pendiente de procesamiento
- `procesando`: En proceso
- `completado`: Completado exitosamente
- `error`: Error

**Métodos**:
```python
def puede_reintentar(self):
    """Verifica si puede reintentar el procesamiento"""
    return self.intentos < self.max_intentos
```

**Índices**:
```python
Index(fields=['empresa', 'estado', 'prioridad'])
Index(fields=['modulo_origen', 'documento_origen_id'])
Index(fields=['estado', 'proximo_intento_at'])
```

**Tabla**: `accounting_cola_contabilizacion`

---

### 2.2. SERIALIZERS

**Archivo**: `serializers.py`

#### Serializers Implementados:

1. **ParametrosIntegracionListSerializer** (Listado)
2. **ParametrosIntegracionSerializer** (Completo)
3. **LogIntegracionListSerializer** (Listado)
4. **LogIntegracionSerializer** (Completo)
5. **ColaContabilizacionListSerializer** (Listado)
6. **ColaContabilizacionSerializer** (Completo)
7. **ColaContabilizacionCreateSerializer** (Creación)

**Validaciones Especiales**:
```python
class ColaContabilizacionCreateSerializer:
    def validate(self, data):
        """Verifica que no exista ya en cola pendiente"""
        if ColaContabilizacion.objects.filter(
            empresa=data['empresa'],
            modulo_origen=data['modulo_origen'],
            documento_origen_tipo=data['documento_origen_tipo'],
            documento_origen_id=data['documento_origen_id'],
            estado__in=['pendiente', 'procesando']
        ).exists():
            raise ValidationError('Este documento ya está en la cola')
        return data
```

---

### 2.3. VIEWSETS Y API

**Archivo**: `views.py`

#### **ParametrosIntegracionViewSet**

**Base URL**: `/api/accounting/integracion/parametros/`

**Acciones Personalizadas**:

**1. GET `/parametros/por_modulo/?modulo=tesoreria`**
```python
@action(detail=False, methods=['get'])
def por_modulo(self, request):
    """Obtiene parámetros agrupados por módulo"""
```

**2. GET `/parametros/resumen/?empresa=1`**
```python
@action(detail=False, methods=['get'])
def resumen(self, request):
    """
    Obtiene resumen de parámetros por módulo.
    Returns: [
        {'modulo': 'tesoreria', 'total': 10, 'activos': 8},
        ...
    ]
    """
```

**3. POST `/parametros/{id}/toggle_activo/`**
```python
@action(detail=True, methods=['post'])
def toggle_activo(self, request, pk=None):
    """Activa o desactiva un parámetro"""
```

**Filtros**:
```python
filterset_fields = ['empresa', 'modulo', 'activo']
search_fields = ['clave', 'descripcion', 'cuenta_contable__codigo', 'cuenta_contable__nombre']
```

---

#### **LogIntegracionViewSet** (Solo Lectura)

**Base URL**: `/api/accounting/integracion/logs/`

**HTTP Methods**: `GET` únicamente (auditoría inmutable)

**Acciones Personalizadas**:

**1. GET `/logs/por_documento/?modulo=tesoreria&tipo=pago&documento_id=123`**
```python
@action(detail=False, methods=['get'])
def por_documento(self, request):
    """Busca logs por documento origen"""
```

**2. GET `/logs/errores_recientes/?empresa=1&limit=20`**
```python
@action(detail=False, methods=['get'])
def errores_recientes(self, request):
    """Obtiene los errores recientes de integración"""
```

**3. GET `/logs/estadisticas/?empresa=1`**
```python
@action(detail=False, methods=['get'])
def estadisticas(self, request):
    """
    Obtiene estadísticas de integración.
    Returns: {
        'exitoso': 120,
        'error': 5,
        'pendiente': 3,
        ...
    }
    """
```

---

#### **ColaContabilizacionViewSet**

**Base URL**: `/api/accounting/integracion/cola/`

**Acciones Personalizadas**:

**1. POST `/cola/{id}/reintentar/`**
```python
@action(detail=True, methods=['post'])
def reintentar(self, request, pk=None):
    """
    Reintenta el procesamiento de un elemento.
    Validaciones:
    - Verifica que puede_reintentar()
    - Solo aplica a estado 'error' o 'pendiente'
    """
```

**2. POST `/cola/{id}/cancelar/`**
```python
@action(detail=True, methods=['post'])
def cancelar(self, request, pk=None):
    """
    Cancela (elimina) un elemento de la cola.
    No permite cancelar 'completado' o 'procesando'
    """
```

**3. GET `/cola/pendientes/?empresa=1`**
```python
@action(detail=False, methods=['get'])
def pendientes(self, request):
    """Obtiene elementos pendientes de procesar"""
```

**4. GET `/cola/errores/?empresa=1`**
```python
@action(detail=False, methods=['get'])
def errores(self, request):
    """Obtiene elementos con error"""
```

**5. POST `/cola/reintentar_todos/`**
```python
@action(detail=False, methods=['post'])
def reintentar_todos(self, request):
    """
    Reintenta todos los elementos con error que pueden reintentar.
    Body: {'empresa': 1}
    Returns: {'total_reintentados': 15}
    """
```

**6. GET `/cola/estadisticas/?empresa=1`**
```python
@action(detail=False, methods=['get'])
def estadisticas(self, request):
    """
    Returns: {
        'por_estado': {'pendiente': 10, 'error': 5, ...},
        'por_modulo': {'tesoreria': 8, 'nomina': 7, ...}
    }
    """
```

---

### 2.4. URLS

**Base**: `/api/accounting/integracion/`

**Rutas Completas**:
```
GET    /api/accounting/integracion/parametros/
POST   /api/accounting/integracion/parametros/
GET    /api/accounting/integracion/parametros/por_modulo/
GET    /api/accounting/integracion/parametros/resumen/
POST   /api/accounting/integracion/parametros/{id}/toggle_activo/

GET    /api/accounting/integracion/logs/
GET    /api/accounting/integracion/logs/por_documento/
GET    /api/accounting/integracion/logs/errores_recientes/
GET    /api/accounting/integracion/logs/estadisticas/

GET    /api/accounting/integracion/cola/
POST   /api/accounting/integracion/cola/
POST   /api/accounting/integracion/cola/{id}/reintentar/
POST   /api/accounting/integracion/cola/{id}/cancelar/
GET    /api/accounting/integracion/cola/pendientes/
GET    /api/accounting/integracion/cola/errores/
POST   /api/accounting/integracion/cola/reintentar_todos/
GET    /api/accounting/integracion/cola/estadisticas/
```

---

## 3. MÓDULO: EXPORTACIÓN E INTEGRACIÓN DE ANALYTICS

**Ubicación**: `backend/apps/analytics/exportacion_integracion/`

### 3.1. MODELOS

#### **ConfiguracionExportacion** - Configuración de Exportaciones

**Archivo**: `models.py` (líneas 14-105)

```python
class ConfiguracionExportacion(BaseCompanyModel):
    """
    Permite configurar exportaciones automáticas y bajo demanda.
    """
```

**Campos**:
| Campo | Tipo | Índice | Descripción |
|-------|------|--------|-------------|
| `empresa` | ForeignKey | ✅ | Multi-tenant |
| `nombre` | CharField(255) | - | Nombre de la configuración |
| `tipo_exportacion` | CharField(30) | ✅ | Tipo de datos a exportar |
| `formato_config` | JSONField | - | Config de formato |
| `formato_archivo` | CharField(10) | - | Formato del archivo |
| `destino` | CharField(15) | - | Destino de exportación |
| `destino_config` | JSONField | - | Config del destino |
| `filtros_json` | JSONField | - | Filtros |
| `esta_activa` | Boolean | ✅ | Estado |
| `frecuencia_automatica` | CharField(20) | - | Frecuencia (diario, semanal, mensual) |

**Tipos de Exportación**:
- `kpi_valores`: Valores de KPIs
- `analisis_tendencias`: Análisis de Tendencias
- `anomalias`: Anomalías Detectadas
- `planes_accion`: Planes de Acción
- `informes`: Informes Generados
- `dashboard_completo`: Dashboard Completo

**Formatos de Archivo**:
- `csv`: CSV
- `excel`: Excel
- `json`: JSON
- `xml`: XML

**Destinos**:
- `descarga`: Descarga Manual
- `email`: Envío por Email
- `ftp`: Servidor FTP
- `api`: API Externa

**Índices**:
```python
Index(fields=['empresa', 'tipo_exportacion'])
Index(fields=['esta_activa'])
Index(fields=['empresa', 'is_active'])
```

**Tabla**: `analytics_configuracion_exportacion`

---

#### **LogExportacion** - Historial de Exportaciones

**Archivo**: `models.py` (líneas 107-197)

```python
class LogExportacion(BaseCompanyModel):
    """
    Auditoría completa de todas las exportaciones de datos.
    """
```

**Campos**:
| Campo | Tipo | Índice | Relación | Descripción |
|-------|------|--------|----------|-------------|
| `empresa` | ForeignKey | ✅ | EmpresaConfig | Multi-tenant |
| `configuracion` | ForeignKey | ✅ | ConfiguracionExportacion | Config usada |
| `tipo` | CharField(15) | - | - | Tipo de ejecución |
| `usuario` | ForeignKey | ✅ | User | Usuario que ejecutó |
| `fecha_ejecucion` | DateTime | ✅ | - | Fecha de ejecución |
| `estado` | CharField(10) | ✅ | - | Estado |
| `registros_exportados` | Integer | - | - | Total de registros |
| `archivo_generado` | FileField | - | - | Archivo generado |
| `tamaño_archivo_bytes` | Integer | - | - | Tamaño en bytes |
| `duracion_segundos` | Integer | - | - | Duración del proceso |
| `error_detalle` | TextField | - | - | Detalle del error |
| `parametros_usados` | JSONField | - | - | Parámetros aplicados |

**Tipos de Ejecución**:
- `manual`: Manual
- `programada`: Programada
- `automatica`: Automática

**Estados**:
- `exitoso`: Exitoso
- `error`: Error
- `parcial`: Parcial

**Índices**:
```python
Index(fields=['empresa', 'configuracion'])
Index(fields=['fecha_ejecucion'])
Index(fields=['estado'])
Index(fields=['usuario'])
Index(fields=['empresa', 'is_active'])
```

**Tabla**: `analytics_log_exportacion`

---

### 3.2. SERIALIZERS

**Archivo**: `serializers.py`

**Serializers Implementados**:

1. **ConfiguracionExportacionSerializer**
   - Campos: `__all__`
   - Read-only: `id`, `created_at`, `updated_at`

2. **LogExportacionSerializer**
   - Campos: `__all__`
   - Read-only: `id`, `fecha_ejecucion`, `created_at`, `updated_at`
   - Campos computados:
     - `configuracion_nombre`: Nombre de la configuración
     - `usuario_nombre`: Nombre completo del usuario

---

### 3.3. VIEWSETS Y API

**Archivo**: `views.py`

#### **ConfiguracionExportacionViewSet**

**Base**: `StandardViewSetMixin`, `ModelViewSet`

**Base URL**: `/api/analytics/exportacion/configuraciones/`

**Filtros**:
```python
filterset_fields = ['tipo_exportacion', 'formato_archivo', 'destino', 'esta_activa', 'is_active']
ordering = ['nombre']
```

---

#### **LogExportacionViewSet**

**Base**: `StandardViewSetMixin`, `ModelViewSet`

**Base URL**: `/api/analytics/exportacion/logs/`

**Filtros**:
```python
filterset_fields = ['configuracion', 'tipo', 'estado', 'usuario', 'is_active']
ordering = ['-fecha_ejecucion']
```

**Select Related**:
```python
queryset = LogExportacion.objects.select_related('configuracion', 'usuario')
```

---

### 3.4. URLS

**Base**: `/api/analytics/exportacion/`

**Rutas Completas**:
```
GET    /api/analytics/exportacion/configuraciones/
POST   /api/analytics/exportacion/configuraciones/
GET    /api/analytics/exportacion/configuraciones/{id}/
PUT    /api/analytics/exportacion/configuraciones/{id}/
PATCH  /api/analytics/exportacion/configuraciones/{id}/
DELETE /api/analytics/exportacion/configuraciones/{id}/

GET    /api/analytics/exportacion/logs/
POST   /api/analytics/exportacion/logs/
GET    /api/analytics/exportacion/logs/{id}/
PUT    /api/analytics/exportacion/logs/{id}/
PATCH  /api/analytics/exportacion/logs/{id}/
DELETE /api/analytics/exportacion/logs/{id}/
```

---

## 4. TIPOS DE INTEGRACIONES SOPORTADAS

### 4.1. FACTURACIÓN ELECTRÓNICA 🇨🇴

**Tipo**: `FACTURACION` (TipoServicioIntegracion)

**Proveedores Soportados**:
- **DIAN** (Directo)
- **CARVAJAL** (Carvajal Tecnología y Servicios)
- **SIIGO** (ERP + Facturación)
- **ALEGRA** (ERP en la nube)

**Métodos de Autenticación**:
- `API_KEY`: Para servicios como SIIGO, Alegra
- `CERTIFICATE`: Para DIAN directo (certificado digital)
- `OAUTH2`: Para proveedores modernos

**Datos de Configuración**:
```json
{
  "endpoint_url": "https://api.proveedor.com/facturacion/v1",
  "metodo_autenticacion": "API_KEY",
  "credenciales": {
    "api_key": "sk_live_xxxxxxx",
    "company_id": "900123456"
  },
  "configuracion_adicional": {
    "ambiente": "produccion",
    "prefijo_factura": "FCEV",
    "resolucion_dian": "18764000000123",
    "rango_desde": 1,
    "rango_hasta": 5000
  }
}
```

---

### 4.2. NÓMINA ELECTRÓNICA 🇨🇴

**Tipo**: `NOMINA` (TipoServicioIntegracion)

**Proveedores Soportados**:
- **DIAN** (Directo)
- **CARVAJAL**
- **SIIGO**

**Integración Contable**:
- Mapeo en `ParametrosIntegracion`:
  - `nomina.gasto_salarios` → Cuenta contable
  - `nomina.retencion_fuente` → Cuenta contable
  - `nomina.seguridad_social` → Cuenta contable
  - `nomina.aportes_parafiscales` → Cuenta contable

**Cola de Contabilización**:
- Cada nómina aprobada genera entrada en `ColaContabilizacion`
- Prioridad: `3` (Alta)
- Estado: `pendiente`

---

### 4.3. CONTABILIDAD (Integración Interna)

**Módulo**: `accounting.integracion`

**Flujo de Integración**:

1. **Configuración de Parámetros**:
   - Admin configura `ParametrosIntegracion` por módulo
   - Define mapeo de cuentas contables

2. **Generación de Documentos** (Módulo Origen):
   - Tesorería: Pago → Cola
   - Ventas: Factura → Cola
   - Compras: Orden de compra → Cola
   - Nómina: Nómina aprobada → Cola

3. **Cola de Procesamiento**:
   - Entrada en `ColaContabilizacion`
   - Estado: `pendiente`
   - Procesamiento asíncrono (Celery)

4. **Generación de Comprobante**:
   - Crea `ComprobanteContable`
   - Genera asientos contables
   - Estado: `completado`

5. **Logging**:
   - Registro en `LogIntegracion`
   - Auditoría completa

---

### 4.4. APIs EXTERNAS

**Tipo**: `API_TERCEROS` (TipoServicioIntegracion)

**Métodos de Autenticación Soportados**:
- `API_KEY`: API Key simple
- `BEARER_TOKEN`: Bearer Token
- `OAUTH2`: OAuth 2.0 (refresh token, access token)
- `JWT`: JSON Web Token
- `BASIC_AUTH`: Usuario/Contraseña
- `HMAC`: HMAC Signature

**Ejemplo OAuth2**:
```json
{
  "metodo_autenticacion": "OAUTH2",
  "credenciales": {
    "client_id": "abc123",
    "client_secret": "secret_xyz",
    "refresh_token": "refresh_token_abc",
    "access_token": "access_token_xyz",
    "token_expiry": "2026-01-20T10:00:00Z"
  },
  "configuracion_adicional": {
    "auth_url": "https://oauth.provider.com/token",
    "scopes": ["read", "write"],
    "timeout": 30
  }
}
```

---

### 4.5. WEBHOOKS

**Tipo**: `WEBHOOK` (TipoServicioIntegracion)

**Configuración**:
```json
{
  "endpoint_url": "https://sistema-externo.com/webhooks/stratekaz",
  "metodo_autenticacion": "HMAC",
  "credenciales": {
    "secret_key": "webhook_secret_xyz"
  },
  "configuracion_adicional": {
    "eventos": ["factura.creada", "pago.recibido", "nomina.aprobada"],
    "formato": "json",
    "metodo_http": "POST",
    "headers": {
      "Content-Type": "application/json",
      "X-Webhook-Source": "StrateKaz"
    }
  }
}
```

---

## 5. SEGURIDAD

### 5.1. ENCRIPTACIÓN DE CREDENCIALES ✅

**Algoritmo**: Fernet (cifrado simétrico de Cryptography)

**Clave de Encriptación**:
- Variable de entorno: `ENCRYPTION_KEY`
- Generación: `Fernet.generate_key()`
- Almacenamiento: `.env` (NO en código fuente)

**⚠️ ADVERTENCIAS**:
1. En desarrollo usa clave fija: `DEV_ENCRYPTION_KEY`
2. En producción DEBE configurarse `ENCRYPTION_KEY` en `.env`
3. Si se pierde la clave, las credenciales NO son recuperables
4. No compartir la clave entre ambientes

**Comando de Generación**:
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

---

### 5.2. MANEJO DE CREDENCIALES/API KEYS

**Almacenamiento**:
- Campo: `_credenciales_encrypted` (TextField)
- Formato en DB: String base64 encriptado
- Acceso: Solo via property `credenciales` (desencripta en memoria)

**Exposición en API**:
- **Por defecto**: `credenciales_masked` (solo últimos 4 caracteres)
- **Serializer completo**: `IntegracionExternaCredencialesSerializer` (solo SuperAdmin)

**Ejemplo de credenciales_masked**:
```json
{
  "api_key": "****3x7z",
  "client_secret": "****ab12"
}
```

---

### 5.3. VALIDACIONES DE CONEXIÓN

**Método**: `test_connection()` en ViewSet

**Flujo**:
1. Validar que integración esté activa
2. Validar credenciales (método `validar_credenciales()`)
3. Intentar conexión real con servicio externo
4. Registrar éxito o error
5. Actualizar campos de monitoreo

**Validación de Credenciales** (Método en modelo):
```python
def validar_credenciales(self):
    """
    Valida que las credenciales existan según método de autenticación.

    Returns:
        (is_valid: bool, error_msg: str)

    Ejemplos:
    - API_KEY: Requiere {'api_key': 'xxx'}
    - OAUTH2: Requiere {'client_id', 'client_secret', 'refresh_token'}
    - BASIC_AUTH: Requiere {'username', 'password'}
    """
```

---

### 5.4. PERMISOS Y RBAC

**Módulo Principal** (`IntegracionExterna`):
```python
permission_classes = [IsAuthenticated, GranularActionPermission]
section_code = 'integraciones'

granular_action_map = {
    'toggle_status': 'can_edit',
    'test_connection': 'can_edit',
    'update_credentials': 'can_edit',
    'clear_errors': 'can_edit',
    'restore': 'can_delete',
    'logs': 'can_view',
}
```

**Permisos Requeridos**:
- `can_view`: Ver integraciones
- `can_create`: Crear integraciones
- `can_edit`: Modificar, activar/desactivar, actualizar credenciales
- `can_delete`: Eliminar (soft delete) y restaurar

**Módulo Accounting**:
- `ParametrosIntegracion`: Requiere permisos de accounting
- `LogIntegracion`: Solo lectura (auditoría)
- `ColaContabilizacion`: Requiere permisos de accounting

**Módulo Analytics**:
- Configuraciones y Logs: Requiere permisos de analytics

---

## 6. ANÁLISIS ARQUITECTÓNICO

### 6.1. FORTALEZAS ✅

1. **Seguridad**:
   - Encriptación de credenciales con Fernet
   - Credenciales enmascaradas en API
   - Serializer especial para credenciales completas

2. **Auditoría**:
   - Logs completos de integración contable
   - Historial de exportaciones
   - Registro de errores recientes

3. **Multi-Tenant**:
   - Aislamiento por empresa
   - Herencia de `BaseCompanyModel`

4. **Monitoreo**:
   - Estado de salud de integraciones
   - Contador de llamadas y límites
   - Alertas de uso

5. **Soft Delete**:
   - Eliminación lógica de integraciones
   - Posibilidad de restaurar

6. **Cola Asíncrona**:
   - Procesamiento de contabilización asíncrono
   - Reintentos automáticos
   - Prioridades configurables

7. **Modelos Dinámicos**:
   - Tipos de servicio configurables
   - Proveedores configurables
   - Sin hardcoding

---

### 6.2. ÁREAS DE MEJORA 🔧

1. **Implementación de Conexiones Reales**:
   - `test_connection()` es placeholder
   - Necesita implementación por tipo de servicio

2. **Tareas Celery**:
   - No se encontraron tasks para procesar `ColaContabilizacion`
   - Necesita worker asíncrono

3. **Validaciones Avanzadas**:
   - Validación de estructura de credenciales por método
   - Validación de formato de configuración_adicional

4. **Webhooks**:
   - No se encontró implementación de recepción de webhooks
   - Necesita endpoints para recibir notificaciones

5. **Rotación de Claves**:
   - No hay mecanismo de rotación de `ENCRYPTION_KEY`
   - Re-encriptación masiva si cambia clave

6. **Rate Limiting**:
   - Contador de llamadas existe pero no hay enforcement
   - Necesita middleware o decorador

7. **Tests**:
   - No se encontraron tests para módulos de integración

8. **Documentación de API Externa**:
   - Falta documentación Swagger/OpenAPI específica
   - Ejemplos de uso por tipo de integración

---

### 6.3. DEPENDENCIAS TÉCNICAS

**Paquetes Python Requeridos**:
- `cryptography`: Encriptación Fernet
- `django-filter`: Filtros en ViewSets
- `djangorestframework`: API REST
- `celery`: (Recomendado) Procesamiento asíncrono

**Variables de Entorno**:
```env
ENCRYPTION_KEY=<clave_fernet_base64>
```

---

## 7. ENDPOINTS COMPLETOS - RESUMEN

### 7.1. Integraciones Externas

**Base**: `/api/configuracion/integraciones-externas/`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Lista integraciones |
| POST | `/` | Crea integración |
| GET | `/choices/` | Opciones para dropdowns |
| GET | `/{id}/` | Detalle |
| PUT | `/{id}/` | Actualiza completa |
| PATCH | `/{id}/` | Actualiza parcial |
| DELETE | `/{id}/` | Soft delete |
| POST | `/{id}/test_connection/` | Prueba conexión |
| POST | `/{id}/toggle_status/` | Activa/desactiva |
| GET | `/{id}/logs/` | Errores recientes |
| PUT | `/{id}/update_credentials/` | Actualiza credenciales |
| POST | `/{id}/restore/` | Restaura eliminada |
| POST | `/{id}/clear_errors/` | Limpia errores |

---

### 7.2. Integración Contable

**Base**: `/api/accounting/integracion/`

| Módulo | Endpoint | Método | Descripción |
|--------|----------|--------|-------------|
| Parámetros | `/parametros/` | GET | Lista parámetros |
| | `/parametros/` | POST | Crea parámetro |
| | `/parametros/por_modulo/` | GET | Por módulo |
| | `/parametros/resumen/` | GET | Resumen |
| | `/parametros/{id}/toggle_activo/` | POST | Toggle activo |
| Logs | `/logs/` | GET | Lista logs |
| | `/logs/por_documento/` | GET | Por documento |
| | `/logs/errores_recientes/` | GET | Errores recientes |
| | `/logs/estadisticas/` | GET | Estadísticas |
| Cola | `/cola/` | GET | Lista cola |
| | `/cola/` | POST | Crea entrada |
| | `/cola/{id}/reintentar/` | POST | Reintenta |
| | `/cola/{id}/cancelar/` | POST | Cancela |
| | `/cola/pendientes/` | GET | Pendientes |
| | `/cola/errores/` | GET | Con errores |
| | `/cola/reintentar_todos/` | POST | Reintenta todos |
| | `/cola/estadisticas/` | GET | Estadísticas |

---

### 7.3. Exportación Analytics

**Base**: `/api/analytics/exportacion/`

| Módulo | Endpoint | Método | Descripción |
|--------|----------|--------|-------------|
| Configuraciones | `/configuraciones/` | GET | Lista configs |
| | `/configuraciones/` | POST | Crea config |
| | `/configuraciones/{id}/` | GET/PUT/PATCH/DELETE | CRUD |
| Logs | `/logs/` | GET | Lista logs |
| | `/logs/` | POST | Crea log |
| | `/logs/{id}/` | GET/PUT/PATCH/DELETE | CRUD |

---

## 8. BASE DE DATOS

### 8.1. Tablas de Integraciones Externas

```sql
-- Configuración
configuracion_tipo_servicio_integracion
configuracion_proveedor_integracion
configuracion_integracion_externa

-- Indices principales
CREATE INDEX idx_tipo_servicio_active ON configuracion_integracion_externa(tipo_servicio_id, is_active);
CREATE INDEX idx_proveedor_active ON configuracion_integracion_externa(proveedor_id, is_active);
CREATE INDEX idx_ambiente ON configuracion_integracion_externa(ambiente);
CREATE INDEX idx_deleted ON configuracion_integracion_externa(deleted_at);
```

---

### 8.2. Tablas de Integración Contable

```sql
-- Accounting
accounting_parametros_integracion
accounting_log_integracion
accounting_cola_contabilizacion

-- Indices principales
CREATE INDEX idx_param_empresa_modulo_clave ON accounting_parametros_integracion(empresa_id, modulo, clave);
CREATE INDEX idx_log_empresa_estado_fecha ON accounting_log_integracion(empresa_id, estado, created_at);
CREATE INDEX idx_cola_empresa_estado_prioridad ON accounting_cola_contabilizacion(empresa_id, estado, prioridad);

-- Constraint único
ALTER TABLE accounting_parametros_integracion
  ADD CONSTRAINT unique_parametro_por_modulo
  UNIQUE (empresa_id, modulo, clave);
```

---

### 8.3. Tablas de Exportación Analytics

```sql
-- Analytics
analytics_configuracion_exportacion
analytics_log_exportacion

-- Indices principales
CREATE INDEX idx_config_empresa_tipo ON analytics_configuracion_exportacion(empresa_id, tipo_exportacion);
CREATE INDEX idx_log_empresa_config ON analytics_log_exportacion(empresa_id, configuracion_id);
CREATE INDEX idx_log_fecha ON analytics_log_exportacion(fecha_ejecucion);
CREATE INDEX idx_log_estado ON analytics_log_exportacion(estado);
```

---

## 9. RECOMENDACIONES

### 9.1. PRIORIDAD ALTA 🔴

1. **Implementar test_connection() por tipo de servicio**:
   - Crear módulo `apps.gestion_estrategica.configuracion.services.integracion_connectors/`
   - Clases: `EmailConnector`, `FacturacionConnector`, `SMSConnector`, etc.
   - Interface común: `BaseConnector.test_connection()`

2. **Crear Celery Tasks para ColaContabilizacion**:
   - Task: `procesar_cola_contabilizacion()`
   - Periodicidad: Cada 5 minutos
   - Manejo de reintentos y errores

3. **Agregar tests unitarios e integración**:
   - Test de encriptación/desencriptación
   - Test de validación de credenciales
   - Test de soft delete
   - Test de cola de contabilización

4. **Configurar ENCRYPTION_KEY en producción**:
   - Generar clave segura
   - Almacenar en `.env`
   - Documentar proceso de backup

---

### 9.2. PRIORIDAD MEDIA 🟡

5. **Implementar recepción de Webhooks**:
   - Endpoint: `/api/webhooks/{tipo_servicio}/`
   - Validación HMAC signature
   - Cola de procesamiento

6. **Rate Limiting**:
   - Middleware de rate limiting por integración
   - Enforcement de `limite_llamadas_dia`
   - Alertas automáticas

7. **Dashboard de Monitoreo**:
   - Vista de salud de integraciones
   - Gráficas de uso
   - Alertas de errores

8. **Rotación de Claves**:
   - Management command: `rotate_encryption_key`
   - Re-encriptación de credenciales existentes

---

### 9.3. PRIORIDAD BAJA 🟢

9. **Documentación Swagger/OpenAPI**:
   - Schemas de credenciales por método
   - Ejemplos de uso
   - Guías de integración

10. **Logs más detallados**:
    - Request/Response en `errores_recientes`
    - Historial de cambios de credenciales
    - Auditoría de acceso a credenciales

11. **Métricas y Observabilidad**:
    - Integración con Sentry
    - Métricas de Prometheus
    - Dashboard de Grafana

12. **Validaciones JSON Schema**:
    - Schema para `configuracion_adicional`
    - Schema para `credenciales` por método
    - Validación en serializer

---

## 10. CONCLUSIONES

El backend de Integraciones en StrateKaz está **bien diseñado y funcional**, con una arquitectura sólida que incluye:

✅ **Fortalezas Principales**:
- Seguridad con encriptación de credenciales
- Multi-tenancy con aislamiento por empresa
- Auditoría completa de operaciones
- Soft delete y restauración
- Cola asíncrona para contabilización
- Modelos dinámicos y extensibles

⚠️ **Áreas Críticas a Implementar**:
- Conexiones reales con servicios externos
- Tareas Celery para procesamiento asíncrono
- Tests completos
- Configuración de producción de ENCRYPTION_KEY

🎯 **Recomendación Final**:
El módulo está listo para **uso en producción** con la condición de implementar las **Prioridades Altas** y configurar correctamente la encriptación en producción.

---

## ANEXOS

### A. Comandos Útiles

**Generar clave de encriptación**:
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

**Cargar tipos y proveedores del sistema**:
```python
from apps.gestion_estrategica.configuracion.models import TipoServicioIntegracion, ProveedorIntegracion

TipoServicioIntegracion.cargar_tipos_sistema()
ProveedorIntegracion.cargar_proveedores_sistema()
```

**Testear integración**:
```bash
curl -X POST http://localhost:8000/api/configuracion/integraciones-externas/1/test_connection/ \
  -H "Authorization: Bearer <token>"
```

---

### B. Estructura de Archivos

```
backend/apps/
├── accounting/integracion/
│   ├── models.py                 (ParametrosIntegracion, LogIntegracion, ColaContabilizacion)
│   ├── serializers.py            (7 serializers)
│   ├── views.py                  (3 ViewSets)
│   ├── urls.py                   (Router con 3 endpoints)
│   ├── admin.py                  (Admin con badges)
│   └── migrations/
│
├── analytics/exportacion_integracion/
│   ├── models.py                 (ConfiguracionExportacion, LogExportacion)
│   ├── serializers.py            (2 serializers)
│   ├── views.py                  (2 ViewSets)
│   ├── urls.py                   (Router con 2 endpoints)
│   ├── admin.py                  (Admin básico)
│   └── migrations/
│
└── gestion_estrategica/configuracion/
    ├── models.py                 (TipoServicioIntegracion, ProveedorIntegracion, IntegracionExterna)
    ├── serializers.py            (4 serializers para IntegracionExterna)
    ├── views.py                  (IntegracionExternaViewSet con 7 acciones)
    ├── urls.py                   (Router)
    └── migrations/
```

---

**FIN DE LA AUDITORÍA**

**Responsable**: Arquitecto de Datos Senior
**Fecha**: 2026-01-18
**Versión**: 1.0
