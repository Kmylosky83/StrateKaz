# Integraciones Externas

**Sistema de gestión de integraciones con servicios externos de terceros**

**Fecha:** 2026-02-06
**Base de datos:** PostgreSQL con django-tenants
**Versión:** 2.0

---

## Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Modelo de Datos](#modelo-de-datos)
3. [Seguridad y Encriptación](#seguridad-y-encriptación)
4. [API Backend](#api-backend)
5. [Servicio TypeScript Frontend](#servicio-typescript-frontend)
6. [Componentes UI](#componentes-ui)
7. [Configuración e Instalación](#configuración-e-instalación)
8. [Casos de Uso](#casos-de-uso)
9. [Monitoreo y Mantenimiento](#monitoreo-y-mantenimiento)

---

## Descripción General

El sistema de Integraciones Externas permite gestionar conexiones con servicios de terceros de forma segura, centralizada y auditable. Soporta múltiples tipos de servicios y proveedores con credenciales encriptadas.

### Servicios Soportados

- **Comunicación**: Email (Gmail, Outlook, SendGrid, SES), SMS (Twilio, MessageBird), WhatsApp Business
- **Facturación Electrónica**: DIAN, Carvajal, EDICOM, Siigo, Alegra, World Office
- **Almacenamiento**: AWS S3, Google Drive, Azure Blob Storage, Dropbox
- **Business Intelligence**: Power BI, Tableau, Looker Studio, Metabase
- **Pagos**: PayU, MercadoPago, Stripe, Wompi, PSE, Evertec
- **Mapas y Geolocalización**: Google Maps, Mapbox, HERE, OpenStreetMap
- **Firma Digital**: Certicámara, GSE, Andes SCD
- **Otros**: ERP externos, CRM, APIs personalizadas, Webhooks

### Características Principales

- **Encriptación de credenciales** con cryptography.fernet (AES-128 CBC + HMAC-SHA256)
- **Soft delete** para auditoría completa
- **Monitoreo de salud** (última conexión, tasa de éxito, errores recientes)
- **Rate limiting** con contador de llamadas diarias
- **Multi-ambiente** (Producción, Sandbox, Desarrollo)
- **Campos de auditoría** (created_by, updated_by, timestamps)
- **Validación automática** de credenciales según método de autenticación
- **Historial de errores** (últimos 10 errores)

---

## Modelo de Datos

### Tabla: `configuracion_integracion_externa`

**Ubicación del modelo:** `backend/apps/gestion_estrategica/configuracion/models.py`

#### Campos de Identificación

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | BigAutoField | Primary key |
| `nombre` | CharField(150) | Nombre descriptivo de la integración |
| `tipo_servicio` | CharField(30) | EMAIL, FACTURACION, SMS, WHATSAPP, etc. |
| `proveedor` | CharField(50) | GMAIL, DIAN, TWILIO, AWS_S3, etc. |
| `descripcion` | TextField | Descripción detallada del propósito |

#### Configuración Técnica

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `endpoint_url` | URLField(500) | URL base de la API externa |
| `metodo_autenticacion` | CharField(30) | API_KEY, OAUTH2, BASIC_AUTH, CERTIFICATE, etc. |
| `_credenciales_encrypted` | TextField | **ENCRIPTADO** - Acceso vía property |
| `configuracion_adicional` | JSONField | Parámetros específicos del proveedor |

#### Control y Monitoreo

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `ambiente` | CharField(20) | PRODUCCION, SANDBOX, DESARROLLO |
| `is_active` | BooleanField | Si la integración está activa |
| `ultima_conexion_exitosa` | DateTimeField | Última conexión exitosa registrada |
| `ultima_falla` | DateTimeField | Última falla registrada |
| `contador_llamadas` | IntegerField | Llamadas realizadas (reset diario) |
| `errores_recientes` | JSONField | Lista de últimos 10 errores |
| `limite_llamadas_dia` | IntegerField | Límite diario de llamadas (null = sin límite) |
| `alerta_porcentaje_limite` | IntegerField | Porcentaje para alertas (default: 80) |

#### Auditoría

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `created_by` | ForeignKey(User) | Usuario que creó la integración |
| `created_at` | DateTimeField | Fecha de creación |
| `updated_by` | ForeignKey(User) | Último usuario que modificó |
| `updated_at` | DateTimeField | Última actualización |
| `deleted_at` | DateTimeField | Soft delete timestamp |

#### Índices de Base de Datos

```python
class Meta:
    indexes = [
        models.Index(fields=['tipo_servicio', 'is_active']),
        models.Index(fields=['proveedor', 'is_active']),
        models.Index(fields=['ambiente']),
        models.Index(fields=['deleted_at']),
    ]
```

### Propiedades Computadas

```python
@property
def is_healthy(self) -> bool:
    """True si última conexión exitosa fue hace menos de 24 horas y no hay errores críticos"""
    if not self.ultima_conexion_exitosa:
        return False

    desde_ultima_conexion = timezone.now() - self.ultima_conexion_exitosa
    return desde_ultima_conexion.total_seconds() < 86400  # 24 horas

@property
def porcentaje_uso_limite(self) -> Optional[float]:
    """Retorna porcentaje de uso del límite diario (0-100) o None si no hay límite"""
    if not self.limite_llamadas_dia:
        return None
    return (self.contador_llamadas / self.limite_llamadas_dia) * 100

@property
def requiere_alerta_limite(self) -> bool:
    """True si el uso del límite supera el umbral de alerta"""
    porcentaje = self.porcentaje_uso_limite
    if porcentaje is None:
        return False
    return porcentaje >= self.alerta_porcentaje_limite

@property
def status_indicator(self) -> str:
    """Retorna 'success', 'warning' o 'danger' según estado de salud"""
    if not self.is_active:
        return 'danger'
    if not self.is_healthy:
        return 'warning'
    if self.requiere_alerta_limite:
        return 'warning'
    return 'success'
```

### Métodos Principales

#### Gestión de Estado

```python
def registrar_exito(self):
    """Registra una conexión exitosa e incrementa el contador"""
    self.ultima_conexion_exitosa = timezone.now()
    self.contador_llamadas += 1
    self.save(update_fields=['ultima_conexion_exitosa', 'contador_llamadas'])

def registrar_error(self, mensaje: str, codigo: Optional[str] = None):
    """Registra un error en el historial (máximo 10)"""
    error = {
        'timestamp': timezone.now().isoformat(),
        'message': mensaje,
        'code': codigo,
    }

    if not isinstance(self.errores_recientes, list):
        self.errores_recientes = []

    self.errores_recientes.insert(0, error)
    self.errores_recientes = self.errores_recientes[:10]  # Mantener solo últimos 10
    self.ultima_falla = timezone.now()
    self.save(update_fields=['errores_recientes', 'ultima_falla'])

def limpiar_errores(self):
    """Limpia el historial de errores"""
    self.errores_recientes = []
    self.save(update_fields=['errores_recientes'])

def resetear_contador_llamadas(self):
    """Resetea el contador de llamadas (útil para cronjobs diarios)"""
    self.contador_llamadas = 0
    self.save(update_fields=['contador_llamadas'])
```

#### Gestión de Credenciales

```python
@property
def credenciales(self) -> dict:
    """Desencripta y retorna las credenciales"""
    if not self._credenciales_encrypted:
        return {}

    try:
        fernet = Fernet(get_encryption_key())
        decrypted = fernet.decrypt(self._credenciales_encrypted.encode())
        return json.loads(decrypted.decode())
    except Exception as e:
        logger.error(f"Error al desencriptar credenciales: {e}")
        return {}

@credenciales.setter
def credenciales(self, value: dict):
    """Encripta y guarda las credenciales"""
    if not value:
        self._credenciales_encrypted = ''
        return

    try:
        fernet = Fernet(get_encryption_key())
        json_bytes = json.dumps(value).encode()
        encrypted = fernet.encrypt(json_bytes)
        self._credenciales_encrypted = encrypted.decode()
    except Exception as e:
        logger.error(f"Error al encriptar credenciales: {e}")
        raise

def get_credencial(self, key: str, default=None):
    """Obtiene una credencial específica"""
    return self.credenciales.get(key, default)

def validar_credenciales(self) -> Tuple[bool, str]:
    """Valida que las credenciales requeridas estén presentes según el método de autenticación"""
    VALIDACIONES = {
        'API_KEY': ['api_key'],
        'BEARER_TOKEN': ['token'],
        'OAUTH2': ['client_id', 'client_secret'],
        'BASIC_AUTH': ['username', 'password'],
        'JWT': ['secret_key'],
        'SERVICE_ACCOUNT': ['service_account_email', 'private_key'],
        'CERTIFICATE': ['certificate_path', 'private_key_path'],
    }

    campos_requeridos = VALIDACIONES.get(self.metodo_autenticacion, [])
    credenciales = self.credenciales

    for campo in campos_requeridos:
        if campo not in credenciales or not credenciales[campo]:
            return False, f"Falta la credencial requerida: {campo}"

    return True, "Credenciales válidas"
```

#### Ciclo de Vida

```python
def soft_delete(self):
    """Eliminación lógica de la integración"""
    self.deleted_at = timezone.now()
    self.is_active = False
    self.save(update_fields=['deleted_at', 'is_active'])

def restore(self):
    """Restaura una integración eliminada"""
    self.deleted_at = None
    self.save(update_fields=['deleted_at'])
```

### Métodos de Clase

```python
@classmethod
def obtener_por_tipo(cls, tipo_servicio: str, activas_only: bool = True):
    """Obtiene integraciones por tipo de servicio"""
    queryset = cls.objects.filter(tipo_servicio=tipo_servicio, deleted_at__isnull=True)
    if activas_only:
        queryset = queryset.filter(is_active=True)
    return queryset

@classmethod
def obtener_por_proveedor(cls, proveedor: str, activas_only: bool = True):
    """Obtiene integraciones por proveedor"""
    queryset = cls.objects.filter(proveedor=proveedor, deleted_at__isnull=True)
    if activas_only:
        queryset = queryset.filter(is_active=True)
    return queryset

@classmethod
def generar_clave_encriptacion(cls) -> str:
    """Genera una nueva clave de encriptación Fernet"""
    return Fernet.generate_key().decode()
```

---

## Seguridad y Encriptación

### Encriptación de Credenciales

Las credenciales se almacenan **SIEMPRE ENCRIPTADAS** usando Fernet (criptografía simétrica):

- **Algoritmo**: AES-128 en modo CBC con HMAC-SHA256
- **Clave**: 32 bytes (256 bits) codificada en base64 = 44 caracteres
- **Storage**: Variable de entorno `ENCRYPTION_KEY`
- **Campo DB**: `_credenciales_encrypted` (TextField en PostgreSQL)
- **Acceso**: Property transparente `credenciales` (get/set)

### Generación de Clave de Encriptación

```bash
# Opción 1: Usar Python directamente
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Opción 2: Desde Django shell
python manage.py shell
>>> from apps.gestion_estrategica.configuracion.models import IntegracionExterna
>>> print(IntegracionExterna.generar_clave_encriptacion())
```

### Configuración de Variable de Entorno

Agregar al archivo `.env`:

```env
# Clave de encriptación para credenciales de integraciones externas
# CRITICAL: Nunca versionar en Git
ENCRYPTION_KEY=su_clave_generada_aqui_44_caracteres
```

### Buenas Prácticas de Seguridad

1. **NUNCA** versionar la clave de encriptación en Git
2. **SIEMPRE** usar una clave única por ambiente (Dev, Staging, Prod)
3. **ROTAR** la clave periódicamente (cada 90-180 días)
4. **BACKUP** de la clave en un vault seguro (Azure Key Vault, AWS Secrets Manager)
5. **LOGS**: Nunca loguear credenciales desencriptadas
6. **PERMISOS**: Solo SuperAdmin puede ver/editar credenciales completas
7. **HTTPS**: Siempre usar HTTPS para transmitir datos sensibles

### Enmascaramiento de Credenciales

Las credenciales se enmascaran en respuestas de API (solo se muestran últimos 4 caracteres):

```python
def enmascarar_credenciales(self) -> dict:
    """Retorna credenciales con valores enmascarados"""
    credenciales = self.credenciales
    if not credenciales:
        return {}

    masked = {}
    for key, value in credenciales.items():
        if isinstance(value, str) and len(value) > 4:
            masked[key] = f"****{value[-4:]}"
        else:
            masked[key] = "****"

    return masked
```

---

## API Backend

### Base URL

```
/api/gestion-estrategica/configuracion/integraciones-externas/
```

### Serializers

#### 1. IntegracionExternaSerializer (Detalle Completo)

**Uso:** Operaciones retrieve, create, update

```python
class IntegracionExternaSerializer(serializers.ModelSerializer):
    # Credenciales enmascaradas
    credenciales_masked = serializers.SerializerMethodField()

    # Campos computados
    is_healthy = serializers.BooleanField(read_only=True)
    status_indicator = serializers.CharField(read_only=True)
    porcentaje_uso_limite = serializers.FloatField(read_only=True)
    requiere_alerta_limite = serializers.BooleanField(read_only=True)

    # Display names
    tipo_servicio_display = serializers.CharField(source='get_tipo_servicio_display', read_only=True)
    proveedor_display = serializers.CharField(source='get_proveedor_display', read_only=True)
    metodo_autenticacion_display = serializers.CharField(source='get_metodo_autenticacion_display', read_only=True)
    ambiente_display = serializers.CharField(source='get_ambiente_display', read_only=True)

    # Auditoría
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)

    class Meta:
        model = IntegracionExterna
        fields = '__all__'

    def get_credenciales_masked(self, obj):
        return obj.enmascarar_credenciales()
```

#### 2. IntegracionExternaListSerializer (Listados)

**Uso:** Operación list

```python
class IntegracionExternaListSerializer(serializers.ModelSerializer):
    tipo_servicio_display = serializers.CharField(source='get_tipo_servicio_display', read_only=True)
    proveedor_display = serializers.CharField(source='get_proveedor_display', read_only=True)
    ambiente_display = serializers.CharField(source='get_ambiente_display', read_only=True)
    is_healthy = serializers.BooleanField(read_only=True)
    status_indicator = serializers.CharField(read_only=True)

    class Meta:
        model = IntegracionExterna
        fields = [
            'id', 'nombre', 'tipo_servicio', 'tipo_servicio_display',
            'proveedor', 'proveedor_display', 'ambiente', 'ambiente_display',
            'is_active', 'is_healthy', 'status_indicator',
            'ultima_conexion_exitosa', 'tasa_exito'
        ]
```

#### 3. IntegracionExternaChoicesSerializer

**Uso:** Poblar dropdowns/selects

```python
class IntegracionExternaChoicesSerializer(serializers.Serializer):
    tipos_servicio = serializers.SerializerMethodField()
    proveedores = serializers.SerializerMethodField()
    metodos_autenticacion = serializers.SerializerMethodField()
    ambientes = serializers.SerializerMethodField()

    def get_tipos_servicio(self, obj):
        return [{'value': k, 'label': v} for k, v in IntegracionExterna.TIPO_SERVICIO_CHOICES]
```

#### 4. IntegracionExternaCredencialesSerializer (SuperAdmin)

**Uso:** Ver/editar credenciales completas (SOLO SuperAdmin)

```python
class IntegracionExternaCredencialesSerializer(serializers.ModelSerializer):
    credenciales = serializers.JSONField()
    credenciales_validas = serializers.SerializerMethodField()
    mensaje_validacion = serializers.SerializerMethodField()

    class Meta:
        model = IntegracionExterna
        fields = ['id', 'nombre', 'metodo_autenticacion', 'credenciales',
                  'credenciales_validas', 'mensaje_validacion']

    def get_credenciales_validas(self, obj):
        validas, _ = obj.validar_credenciales()
        return validas

    def get_mensaje_validacion(self, obj):
        _, mensaje = obj.validar_credenciales()
        return mensaje
```

### Endpoints CRUD

#### 1. Listar Integraciones

```http
GET /api/gestion-estrategica/configuracion/integraciones-externas/
```

**Permisos:** IsAuthenticated + Nivel 2 (Coordinación) o superior

**Query Parameters:**
- `tipo_servicio`: Filtrar por tipo (EMAIL, SMS, etc.)
- `proveedor`: Filtrar por proveedor (GMAIL, TWILIO, etc.)
- `is_active`: Filtrar por estado (true/false)
- `ambiente`: Filtrar por ambiente (PRODUCCION, SANDBOX)
- `search`: Búsqueda en nombre/descripción
- `ordering`: Ordenar por campos (-created_at, nombre, etc.)
- `include_deleted`: Incluir eliminadas (true/false)

**Response:**

```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "nombre": "Email Corporativo Gmail",
      "tipo_servicio": "EMAIL",
      "tipo_servicio_display": "Servicio de Email",
      "proveedor": "GMAIL",
      "proveedor_display": "Gmail / Google Workspace",
      "ambiente": "PRODUCCION",
      "ambiente_display": "Producción",
      "is_active": true,
      "is_healthy": true,
      "status_indicator": "success",
      "ultima_conexion_exitosa": "2026-02-06T10:30:00Z",
      "tasa_exito": 98.5
    }
  ]
}
```

#### 2. Crear Integración

```http
POST /api/gestion-estrategica/configuracion/integraciones-externas/
```

**Permisos:** IsSuperAdmin

**Body:**

```json
{
  "nombre": "Email Corporativo Gmail",
  "tipo_servicio": "EMAIL",
  "proveedor": "GMAIL",
  "descripcion": "Servicio de email para notificaciones del sistema",
  "endpoint_url": "https://gmail.googleapis.com/",
  "metodo_autenticacion": "OAUTH2",
  "credenciales": {
    "client_id": "xxx.apps.googleusercontent.com",
    "client_secret": "GOCSPX-xxxxx",
    "refresh_token": "1//xxxxx"
  },
  "ambiente": "PRODUCCION",
  "configuracion_adicional": {
    "from_email": "noreply@empresa.com",
    "from_name": "Sistema de Gestión"
  },
  "limite_llamadas_dia": 500
}
```

**NOTA:** Las credenciales se encriptan automáticamente al guardar.

#### 3. Obtener Detalle

```http
GET /api/gestion-estrategica/configuracion/integraciones-externas/{id}/
```

**Permisos:** IsAuthenticated + Nivel 2

**Response:** Incluye todos los campos con credenciales enmascaradas.

#### 4. Actualizar Integración

```http
PUT /api/gestion-estrategica/configuracion/integraciones-externas/{id}/
PATCH /api/gestion-estrategica/configuracion/integraciones-externas/{id}/
```

**Permisos:** IsSuperAdmin

**IMPORTANTE:** NO incluir credenciales aquí. Usar endpoint `update_credentials/` para actualizar credenciales.

#### 5. Eliminar Integración (Soft Delete)

```http
DELETE /api/gestion-estrategica/configuracion/integraciones-externas/{id}/
```

**Permisos:** IsSuperAdmin

**Response:** 204 No Content

### Acciones Personalizadas

#### 6. Obtener Choices

```http
GET /api/gestion-estrategica/configuracion/integraciones-externas/choices/
```

**Permisos:** IsAuthenticated + Nivel 2

**Response:**

```json
{
  "tipos_servicio": [
    {"value": "EMAIL", "label": "Servicio de Email"},
    {"value": "SMS", "label": "Mensajería SMS"}
  ],
  "proveedores": [
    {"value": "GMAIL", "label": "Gmail / Google Workspace"},
    {"value": "TWILIO", "label": "Twilio"}
  ],
  "metodos_autenticacion": [
    {"value": "API_KEY", "label": "API Key"},
    {"value": "OAUTH2", "label": "OAuth 2.0"}
  ],
  "ambientes": [
    {"value": "PRODUCCION", "label": "Producción"},
    {"value": "SANDBOX", "label": "Sandbox / Pruebas"}
  ]
}
```

#### 7. Probar Conexión

```http
POST /api/gestion-estrategica/configuracion/integraciones-externas/{id}/test_connection/
```

**Permisos:** IsAuthenticated + Nivel 2

**Response (Éxito):**

```json
{
  "success": true,
  "message": "Conexión exitosa",
  "response_time_ms": 245,
  "timestamp": "2026-02-06T11:00:00Z"
}
```

**Response (Error):**

```json
{
  "success": false,
  "error": "Credenciales inválidas: Falta la credencial requerida: refresh_token"
}
```

#### 8. Activar/Desactivar Integración

```http
POST /api/gestion-estrategica/configuracion/integraciones-externas/{id}/toggle_status/
```

**Permisos:** IsAuthenticated + Nivel 2

**Response:**

```json
{
  "message": "Integración activada exitosamente.",
  "is_active": true,
  "data": { /* objeto completo */ }
}
```

#### 9. Ver Logs

```http
GET /api/gestion-estrategica/configuracion/integraciones-externas/{id}/logs/
```

**Permisos:** IsAuthenticated + Nivel 2

**Response:**

```json
{
  "integracion_id": 1,
  "integracion_nombre": "Email Corporativo Gmail",
  "errores_recientes": [
    {
      "timestamp": "2026-02-05T15:30:00Z",
      "message": "Rate limit exceeded",
      "code": "RATE_LIMIT"
    }
  ],
  "ultima_conexion_exitosa": "2026-02-06T10:30:00Z",
  "ultima_falla": "2026-02-05T15:30:00Z",
  "contador_llamadas": 45,
  "limite_llamadas_dia": 500,
  "porcentaje_uso_limite": 9.0
}
```

#### 10. Actualizar Credenciales

```http
PUT /api/gestion-estrategica/configuracion/integraciones-externas/{id}/update_credentials/
PATCH /api/gestion-estrategica/configuracion/integraciones-externas/{id}/update_credentials/
```

**Permisos:** IsSuperAdmin ÚNICAMENTE

**SEGURIDAD:** Este es el ÚNICO endpoint que permite ver/editar credenciales completas.

**Body:**

```json
{
  "credenciales": {
    "client_id": "nuevo-client-id.apps.googleusercontent.com",
    "client_secret": "GOCSPX-nuevo-secret",
    "refresh_token": "1//nuevo-refresh-token"
  }
}
```

**Response:**

```json
{
  "message": "Credenciales actualizadas exitosamente.",
  "data": {
    "id": 1,
    "nombre": "Email Corporativo Gmail",
    "metodo_autenticacion": "OAUTH2",
    "credenciales": {
      "client_id": "nuevo-client-id.apps.googleusercontent.com",
      "client_secret": "GOCSPX-nuevo-secret",
      "refresh_token": "1//nuevo-refresh-token"
    },
    "credenciales_validas": true,
    "mensaje_validacion": "Credenciales válidas"
  }
}
```

#### 11. Restaurar Integración Eliminada

```http
POST /api/gestion-estrategica/configuracion/integraciones-externas/{id}/restore/
```

**Permisos:** IsAuthenticated + Nivel 2

#### 12. Limpiar Errores

```http
POST /api/gestion-estrategica/configuracion/integraciones-externas/{id}/clear_errors/
```

**Permisos:** IsAuthenticated + Nivel 2

### Permisos por Endpoint

| Endpoint | Método | Permiso Requerido |
|----------|--------|-------------------|
| `/` (list) | GET | IsAuthenticated + Nivel 2 (Coordinación) |
| `/` (create) | POST | IsSuperAdmin |
| `/{id}/` (retrieve) | GET | IsAuthenticated + Nivel 2 |
| `/{id}/` (update) | PUT/PATCH | IsSuperAdmin |
| `/{id}/` (delete) | DELETE | IsSuperAdmin |
| `/choices/` | GET | IsAuthenticated + Nivel 2 |
| `/{id}/test_connection/` | POST | IsAuthenticated + Nivel 2 |
| `/{id}/toggle_status/` | POST | IsAuthenticated + Nivel 2 |
| `/{id}/logs/` | GET | IsAuthenticated + Nivel 2 |
| `/{id}/update_credentials/` | PUT/PATCH | IsSuperAdmin |
| `/{id}/restore/` | POST | IsAuthenticated + Nivel 2 |
| `/{id}/clear_errors/` | POST | IsAuthenticated + Nivel 2 |

---

## Servicio TypeScript Frontend

### Ubicación de Archivos

- **Tipos**: `frontend/src/features/gestion-estrategica/types/strategic.types.ts`
- **API Client**: `frontend/src/features/gestion-estrategica/api/strategicApi.ts`
- **Hooks**: `frontend/src/features/gestion-estrategica/hooks/useStrategic.ts`

### Tipos TypeScript

#### Enums y Union Types

```typescript
// Tipos de servicio
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

// Proveedores soportados
type Proveedor =
  | 'GMAIL' | 'OUTLOOK' | 'SENDGRID' | 'SES'  // Email
  | 'TWILIO' | 'MESSAGEBIRD'                  // SMS
  | 'WHATSAPP_BUSINESS'                       // WhatsApp
  | 'DIAN' | 'SIIGO' | 'ALEGRA'              // Facturación
  | 'GOOGLE_DRIVE' | 'AWS_S3' | 'AZURE_BLOB' // Storage
  | 'POWER_BI' | 'TABLEAU' | 'LOOKER'        // BI
  | 'PAYU' | 'MERCADOPAGO' | 'STRIPE'        // Pagos
  | 'CERTICAMARA' | 'GSE'                    // Firma Digital
  | 'GOOGLE_MAPS';                           // Mapas

// Métodos de autenticación
type MetodoAutenticacion =
  | 'API_KEY'
  | 'OAUTH2'
  | 'BASIC_AUTH'
  | 'SERVICE_ACCOUNT'
  | 'CERTIFICATE';

// Ambiente de ejecución
type Ambiente = 'PRODUCCION' | 'SANDBOX' | 'DESARROLLO';

// Indicador de estado visual
type StatusIndicator = 'success' | 'warning' | 'danger';
```

#### Interfaces Principales

```typescript
// Detalle completo de una integración
interface IntegracionExterna {
  id: number;
  nombre: string;
  descripcion?: string | null;
  tipo_servicio: TipoServicio;
  tipo_servicio_display: string;
  proveedor: Proveedor;
  proveedor_display: string;
  ambiente: Ambiente;
  ambiente_display: string;
  metodo_autenticacion: MetodoAutenticacion;
  metodo_autenticacion_display: string;
  endpoint_url: string;
  credenciales_masked?: Record<string, string>;
  configuracion_adicional?: Record<string, unknown> | null;
  is_active: boolean;
  is_healthy: boolean;
  status_indicator: StatusIndicator;
  ultima_conexion_exitosa?: string | null;
  ultima_falla?: string | null;
  contador_llamadas: number;
  errores_recientes: Array<{
    timestamp: string;
    message: string;
    code?: string;
  }>;
  limite_llamadas_dia?: number | null;
  alerta_porcentaje_limite: number;
  porcentaje_uso_limite?: number | null;
  requiere_alerta_limite: boolean;
  created_at: string;
  updated_at: string;
  created_by: number;
  created_by_name?: string;
  updated_by: number;
  updated_by_name?: string;
  deleted_at?: string | null;
}

// Versión simplificada para listados
interface IntegracionExternaList {
  id: number;
  nombre: string;
  tipo_servicio: TipoServicio;
  tipo_servicio_display: string;
  proveedor: Proveedor;
  proveedor_display: string;
  ambiente: Ambiente;
  ambiente_display: string;
  is_active: boolean;
  is_healthy: boolean;
  status_indicator: StatusIndicator;
  ultima_conexion_exitosa?: string | null;
  tasa_exito?: number;
}
```

#### DTOs (Data Transfer Objects)

```typescript
// Crear nueva integración
interface CreateIntegracionDTO {
  nombre: string;
  descripcion?: string;
  tipo_servicio: TipoServicio;
  proveedor: Proveedor;
  ambiente: Ambiente;
  metodo_autenticacion: MetodoAutenticacion;
  endpoint_url: string;
  credenciales: Record<string, string>;  // Sin enmascarar al crear
  configuracion_adicional?: Record<string, unknown>;
  limite_llamadas_dia?: number;
  alerta_porcentaje_limite?: number;
  is_active?: boolean;
}

// Actualizar integración existente
interface UpdateIntegracionDTO {
  nombre?: string;
  descripcion?: string;
  ambiente?: Ambiente;
  endpoint_url?: string;
  configuracion_adicional?: Record<string, unknown>;
  limite_llamadas_dia?: number;
  alerta_porcentaje_limite?: number;
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

// Resultado de test de conexión
interface TestConnectionResult {
  success: boolean;
  message: string;
  response_time_ms?: number;
  details?: Record<string, unknown>;
  error?: string | null;
  timestamp?: string;
}
```

### API Client

```typescript
const integracionesApi = {
  // Obtener todas las integraciones (con filtros opcionales)
  getAll: async (filters?: IntegracionFilters): Promise<PaginatedResponse<IntegracionExternaList>> => {
    const params = new URLSearchParams();
    if (filters?.tipo_servicio) params.append('tipo_servicio', filters.tipo_servicio);
    if (filters?.proveedor) params.append('proveedor', filters.proveedor);
    if (filters?.ambiente) params.append('ambiente', filters.ambiente);
    if (filters?.is_active !== undefined) params.append('is_active', String(filters.is_active));
    if (filters?.is_healthy !== undefined) params.append('is_healthy', String(filters.is_healthy));
    if (filters?.search) params.append('search', filters.search);

    const response = await apiClient.get(`/integraciones-externas/?${params}`);
    return response.data;
  },

  // Obtener una integración por ID
  getById: async (id: number): Promise<IntegracionExterna> => {
    const response = await apiClient.get(`/integraciones-externas/${id}/`);
    return response.data;
  },

  // Crear nueva integración
  create: async (data: CreateIntegracionDTO): Promise<IntegracionExterna> => {
    const response = await apiClient.post('/integraciones-externas/', data);
    return response.data;
  },

  // Actualizar integración
  update: async (id: number, data: UpdateIntegracionDTO): Promise<IntegracionExterna> => {
    const response = await apiClient.patch(`/integraciones-externas/${id}/`, data);
    return response.data;
  },

  // Eliminar integración
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/integraciones-externas/${id}/`);
  },

  // Probar conexión
  testConnection: async (id: number): Promise<TestConnectionResult> => {
    const response = await apiClient.post(`/integraciones-externas/${id}/test_connection/`);
    return response.data;
  },

  // Activar/desactivar integración
  toggleStatus: async (id: number): Promise<IntegracionExterna> => {
    const response = await apiClient.post(`/integraciones-externas/${id}/toggle_status/`);
    return response.data.data;
  },

  // Actualizar solo credenciales
  updateCredentials: async (id: number, data: UpdateCredencialesDTO): Promise<IntegracionExterna> => {
    const response = await apiClient.put(`/integraciones-externas/${id}/update_credentials/`, data);
    return response.data.data;
  },

  // Obtener opciones para selects
  getChoices: async (): Promise<{
    tipos_servicio: Array<{value: string; label: string}>;
    proveedores: Array<{value: string; label: string}>;
    ambientes: Array<{value: string; label: string}>;
    metodos_autenticacion: Array<{value: string; label: string}>;
  }> => {
    const response = await apiClient.get('/integraciones-externas/choices/');
    return response.data;
  },

  // Limpiar errores
  clearErrors: async (id: number): Promise<void> => {
    await apiClient.post(`/integraciones-externas/${id}/clear_errors/`);
  },

  // Restaurar integración eliminada
  restore: async (id: number): Promise<IntegracionExterna> => {
    const response = await apiClient.post(`/integraciones-externas/${id}/restore/`);
    return response.data.data;
  },
};
```

### React Query Hooks

#### Hooks de Consulta (Query)

```typescript
// Listar integraciones con filtros
export const useIntegraciones = (filters?: IntegracionFilters) => {
  return useQuery({
    queryKey: ['integraciones', filters],
    queryFn: () => integracionesApi.getAll(filters),
  });
};

// Obtener una integración
export const useIntegracion = (id: number) => {
  return useQuery({
    queryKey: ['integracion', id],
    queryFn: () => integracionesApi.getById(id),
    enabled: !!id,
  });
};

// Obtener opciones para formularios
export const useIntegracionChoices = () => {
  return useQuery({
    queryKey: ['integracion-choices'],
    queryFn: () => integracionesApi.getChoices(),
    staleTime: Infinity, // Choices no cambian frecuentemente
  });
};
```

#### Hooks de Mutación (Mutation)

```typescript
// Crear integración
export const useCreateIntegracion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateIntegracionDTO) => integracionesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integraciones'] });
      toast.success('Integración creada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al crear la integración');
      console.error(error);
    },
  });
};

// Actualizar integración
export const useUpdateIntegracion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateIntegracionDTO }) =>
      integracionesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['integraciones'] });
      queryClient.invalidateQueries({ queryKey: ['integracion', id] });
      toast.success('Integración actualizada exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar la integración');
    },
  });
};

// Eliminar integración
export const useDeleteIntegracion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => integracionesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integraciones'] });
      toast.success('Integración eliminada exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar la integración');
    },
  });
};

// Probar conexión
export const useTestConnection = () => {
  return useMutation({
    mutationFn: (id: number) => integracionesApi.testConnection(id),
  });
};

// Activar/desactivar
export const useToggleIntegracionStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => integracionesApi.toggleStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integraciones'] });
      toast.success('Estado actualizado exitosamente');
    },
  });
};

// Actualizar credenciales
export const useUpdateCredentials = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCredencialesDTO }) =>
      integracionesApi.updateCredentials(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['integracion', id] });
      toast.success('Credenciales actualizadas exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar las credenciales');
    },
  });
};
```

---

## Componentes UI

### Estructura de Componentes

```
frontend/src/features/gestion-estrategica/integraciones/
├── pages/
│   └── IntegracionesPage.tsx          # Página principal
├── components/
│   ├── IntegracionesTable.tsx         # Tabla de integraciones
│   ├── IntegracionFormModal.tsx       # Formulario crear/editar
│   ├── IntegracionDetailModal.tsx     # Modal de detalles
│   ├── TestConnectionModal.tsx        # Modal de test de conexión
│   └── IntegracionLogsModal.tsx       # Modal de logs
└── hooks/
    └── useStrategic.ts                # React Query hooks
```

### Ejemplo: Página Principal

```typescript
import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useIntegraciones } from '@/features/gestion-estrategica/hooks/useStrategic';
import { IntegracionFilters } from '@/features/gestion-estrategica/types/strategic.types';
import IntegracionesTable from '../components/IntegracionesTable';
import IntegracionFormModal from '../components/IntegracionFormModal';
import Button from '@/components/common/Button';

export default function IntegracionesPage() {
  const [filters, setFilters] = useState<IntegracionFilters>({});
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading, refetch } = useIntegraciones(filters);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Integraciones Externas</h1>
          <p className="text-gray-600">Gestión de integraciones con servicios de terceros</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" icon={RefreshCw} onClick={() => refetch()}>
            Actualizar
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => setShowCreateModal(true)}>
            Nueva Integración
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            className="border rounded px-3 py-2"
            value={filters.tipo_servicio || ''}
            onChange={(e) => setFilters({ ...filters, tipo_servicio: e.target.value || undefined })}
          >
            <option value="">Todos los tipos</option>
            <option value="EMAIL">Email</option>
            <option value="SMS">SMS</option>
            <option value="FACTURACION">Facturación</option>
          </select>
          {/* Más filtros... */}
        </div>
      </div>

      <IntegracionesTable data={data?.results || []} isLoading={isLoading} />

      {showCreateModal && (
        <IntegracionFormModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
```

### Ejemplo: Probar Conexión

```typescript
import { useTestConnection } from '@/features/gestion-estrategica/hooks/useStrategic';

function TestConnectionButton({ integracionId }: { integracionId: number }) {
  const testMutation = useTestConnection();

  const handleTest = async () => {
    const result = await testMutation.mutateAsync(integracionId);

    if (result.success) {
      toast.success(`Conexión OK - Tiempo: ${result.response_time_ms}ms`);
    } else {
      toast.error(`Error: ${result.error}`);
    }
  };

  return (
    <button
      onClick={handleTest}
      disabled={testMutation.isPending}
      className="btn btn-primary"
    >
      {testMutation.isPending ? 'Probando...' : 'Probar Conexión'}
    </button>
  );
}
```

---

## Configuración e Instalación

### 1. Instalar Dependencias

```bash
cd backend
pip install cryptography==42.0.0
```

Agregar a `backend/requirements/base.txt`:

```txt
cryptography==42.0.0
```

### 2. Generar Clave de Encriptación

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### 3. Configurar Variable de Entorno

Agregar al archivo `.env`:

```env
# Clave de encriptación para IntegracionExterna
# CRITICAL: Nunca versionar en Git - Guardar en vault seguro
ENCRYPTION_KEY=su_clave_generada_aqui_44_caracteres
```

### 4. Ejecutar Migraciones

```bash
python manage.py migrate
```

### 5. Verificar Instalación

```python
# Django shell
python manage.py shell

>>> from apps.gestion_estrategica.configuracion.models import IntegracionExterna
>>> from apps.core.models import User

# Crear integración de prueba
>>> admin = User.objects.first()
>>> integracion = IntegracionExterna.objects.create(
...     nombre='Test Email',
...     tipo_servicio='EMAIL',
...     proveedor='GMAIL',
...     endpoint_url='https://gmail.googleapis.com/',
...     metodo_autenticacion='OAUTH2',
...     ambiente='SANDBOX',
...     created_by=admin
... )

# Configurar credenciales
>>> integracion.credenciales = {'client_id': 'test123', 'client_secret': 'secret456'}
>>> integracion.save()

# Verificar encriptación
>>> print(integracion._credenciales_encrypted[:50])  # Debe estar encriptado
>>> print(integracion.credenciales)  # Debe desencriptarse correctamente
{'client_id': 'test123', 'client_secret': 'secret456'}

>>> print("✓ Instalación exitosa")
```

---

## Casos de Uso

### 1. Email Corporativo (Gmail)

```python
from apps.gestion_estrategica.configuracion.models import IntegracionExterna
from apps.core.models import User

admin = User.objects.get(username='admin')

integracion_gmail = IntegracionExterna(
    nombre='Email Corporativo - Gmail',
    tipo_servicio='EMAIL',
    proveedor='GMAIL',
    descripcion='Servicio de email corporativo para notificaciones',
    endpoint_url='https://gmail.googleapis.com/',
    metodo_autenticacion='OAUTH2',
    ambiente='PRODUCCION',
    created_by=admin
)

integracion_gmail.credenciales = {
    'client_id': 'tu_client_id.apps.googleusercontent.com',
    'client_secret': 'tu_client_secret',
    'refresh_token': 'tu_refresh_token',
}

integracion_gmail.configuracion_adicional = {
    'from_email': 'noreply@empresa.com',
    'from_name': 'Sistema de Gestión',
    'port': 587,
    'use_tls': True,
}

integracion_gmail.limite_llamadas_dia = 2000
integracion_gmail.save()
```

### 2. Facturación Electrónica DIAN

```python
integracion_dian = IntegracionExterna(
    nombre='DIAN - Facturación Electrónica',
    tipo_servicio='FACTURACION',
    proveedor='DIAN',
    descripcion='Integración directa con DIAN para facturación electrónica',
    endpoint_url='https://vpfe.dian.gov.co/WcfDianCustomerServices.svc',
    metodo_autenticacion='CERTIFICATE',
    ambiente='PRODUCCION',
    created_by=admin
)

integracion_dian.credenciales = {
    'certificate_path': '/certs/dian_cert.p12',
    'certificate_password': 'cert_password',
    'nit': '900123456',
    'software_id': 'abc123-def456',
    'software_pin': '12345',
}

integracion_dian.configuracion_adicional = {
    'test_set_id': '1234567890',
    'ambiente_dian': 'produccion',
    'timeout': 60,
}

integracion_dian.save()
```

### 3. SMS/WhatsApp (Twilio)

```python
integracion_twilio = IntegracionExterna(
    nombre='Twilio - SMS y WhatsApp',
    tipo_servicio='SMS',
    proveedor='TWILIO',
    descripcion='Servicio de mensajería SMS y WhatsApp',
    endpoint_url='https://api.twilio.com/2010-04-01',
    metodo_autenticacion='BASIC_AUTH',
    ambiente='PRODUCCION',
    created_by=admin
)

integracion_twilio.credenciales = {
    'account_sid': 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'auth_token': 'tu_auth_token',
    'from_number': '+573001234567',
}

integracion_twilio.configuracion_adicional = {
    'messaging_service_sid': 'MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'status_callback_url': 'https://tuapp.com/api/twilio/webhook',
}

integracion_twilio.limite_llamadas_dia = 10000
integracion_twilio.save()
```

### 4. Almacenamiento AWS S3

```python
integracion_s3 = IntegracionExterna(
    nombre='AWS S3 - Almacenamiento',
    tipo_servicio='ALMACENAMIENTO',
    proveedor='AWS_S3',
    descripcion='Almacenamiento en la nube de documentos',
    endpoint_url='https://s3.us-east-1.amazonaws.com',
    metodo_autenticacion='SERVICE_ACCOUNT',
    ambiente='PRODUCCION',
    created_by=admin
)

integracion_s3.credenciales = {
    'access_key_id': 'AKIAIOSFODNN7EXAMPLE',
    'secret_access_key': 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    'region': 'us-east-1',
}

integracion_s3.configuracion_adicional = {
    'bucket_name': 'empresa-docs',
    'default_acl': 'private',
    'signature_version': 's3v4',
}

integracion_s3.save()
```

### Uso en Servicios

```python
# Ejemplo: Enviar email usando integración configurada
def enviar_email_notificacion(destinatario, asunto, mensaje):
    """Envía email usando la integración de Gmail configurada"""
    integracion = IntegracionExterna.obtener_por_tipo('EMAIL').first()

    if not integracion or not integracion.is_active:
        raise Exception("No hay integración de email activa")

    # Verificar salud
    if not integracion.is_healthy:
        logger.warning(f"Integración {integracion.nombre} no está saludable")

    # Obtener credenciales
    creds = integracion.credenciales
    config = integracion.configuracion_adicional

    try:
        # Lógica de envío de email...
        # (usar creds['client_id'], creds['refresh_token'], etc.)

        # Registrar éxito
        integracion.registrar_exito()

        return True

    except Exception as e:
        # Registrar error
        integracion.registrar_error(str(e), 'EMAIL_SEND_ERROR')
        raise
```

---

## Monitoreo y Mantenimiento

### Cronjob: Reseteo Diario de Contadores

```python
# backend/apps/gestion_estrategica/management/commands/reset_integraciones_counters.py
from django.core.management.base import BaseCommand
from apps.gestion_estrategica.configuracion.models import IntegracionExterna

class Command(BaseCommand):
    help = 'Resetea contadores diarios de integraciones'

    def handle(self, *args, **options):
        integraciones = IntegracionExterna.objects.filter(
            is_active=True,
            deleted_at__isnull=True
        )

        for integracion in integraciones:
            integracion.resetear_contador_llamadas()
            self.stdout.write(
                self.style.SUCCESS(f'Reseteado: {integracion.nombre}')
            )
```

Configurar en crontab:

```bash
0 0 * * * cd /path/to/project && python manage.py reset_integraciones_counters
```

### Cronjob: Monitoreo de Salud

```python
# backend/apps/gestion_estrategica/management/commands/check_integraciones_health.py
from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from apps.gestion_estrategica.configuracion.models import IntegracionExterna

class Command(BaseCommand):
    help = 'Verifica salud de integraciones y envía alertas'

    def handle(self, *args, **options):
        integraciones = IntegracionExterna.objects.filter(
            is_active=True,
            deleted_at__isnull=True
        )

        problemas = []

        for integracion in integraciones:
            if not integracion.is_healthy:
                problemas.append(
                    f"⚠️ {integracion.nombre} - Sin conexión reciente"
                )

            if integracion.requiere_alerta_limite:
                porcentaje = integracion.porcentaje_uso_limite
                problemas.append(
                    f"⚠️ {integracion.nombre} - Uso al {porcentaje:.1f}%"
                )

        if problemas:
            mensaje = "\n".join(problemas)
            send_mail(
                'ALERTA: Integraciones con Problemas',
                mensaje,
                'sistema@empresa.com',
                ['admin@empresa.com'],
            )
            self.stdout.write(self.style.WARNING(mensaje))
        else:
            self.stdout.write(self.style.SUCCESS('Todas las integraciones OK'))
```

### Script: Rotación de Clave de Encriptación

```python
# backend/scripts/rotar_encryption_key.py
"""
ADVERTENCIA: Este proceso requiere downtime
1. Desencriptar con clave vieja
2. Actualizar ENCRYPTION_KEY en .env
3. Re-encriptar con nueva clave
"""

from apps.gestion_estrategica.configuracion.models import IntegracionExterna, get_encryption_key
from cryptography.fernet import Fernet
import json

def rotar_clave_encriptacion(nueva_clave):
    """Rota la clave de encriptación"""

    clave_vieja = get_encryption_key()
    fernet_viejo = Fernet(clave_vieja)

    try:
        fernet_nuevo = Fernet(nueva_clave.encode())
    except Exception as e:
        print(f"ERROR: Clave nueva inválida: {e}")
        return False

    integraciones = IntegracionExterna.objects.all()

    for integracion in integraciones:
        if not integracion._credenciales_encrypted:
            continue

        try:
            # Desencriptar con clave vieja
            decrypted = fernet_viejo.decrypt(
                integracion._credenciales_encrypted.encode()
            )
            credenciales_dict = json.loads(decrypted.decode())

            # Re-encriptar con clave nueva
            json_bytes = json.dumps(credenciales_dict).encode()
            encrypted_new = fernet_nuevo.encrypt(json_bytes)

            # Guardar
            integracion._credenciales_encrypted = encrypted_new.decode()
            integracion.save(update_fields=['_credenciales_encrypted'])

            print(f"✓ Rotada: {integracion.nombre}")

        except Exception as e:
            print(f"✗ ERROR en {integracion.nombre}: {e}")
            return False

    print(f"\n✓ Rotación completa. ACTUALIZAR .env:")
    print(f"ENCRYPTION_KEY={nueva_clave}")

    return True
```

### Métricas y Dashboard

```python
# Vista para dashboard de integraciones
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import timedelta

def obtener_metricas_integraciones():
    """Retorna métricas agregadas de integraciones"""

    ahora = timezone.now()
    hace_24h = ahora - timedelta(hours=24)

    return {
        'total': IntegracionExterna.objects.filter(deleted_at__isnull=True).count(),
        'activas': IntegracionExterna.objects.filter(is_active=True, deleted_at__isnull=True).count(),
        'saludables': IntegracionExterna.objects.filter(
            is_active=True,
            deleted_at__isnull=True,
            ultima_conexion_exitosa__gte=hace_24h
        ).count(),
        'con_problemas': IntegracionExterna.objects.filter(
            Q(is_active=True) &
            Q(deleted_at__isnull=True) &
            (Q(ultima_conexion_exitosa__lt=hace_24h) | Q(ultima_conexion_exitosa__isnull=True))
        ).count(),
        'por_tipo': IntegracionExterna.objects.filter(
            deleted_at__isnull=True
        ).values('tipo_servicio').annotate(count=Count('id')),
        'alertas_limite': IntegracionExterna.objects.filter(
            is_active=True,
            deleted_at__isnull=True,
            limite_llamadas_dia__isnull=False
        ).filter(
            contador_llamadas__gte=F('limite_llamadas_dia') * F('alerta_porcentaje_limite') / 100
        ).count(),
    }
```

---

## Ubicación de Archivos

### Backend

```
backend/apps/gestion_estrategica/configuracion/
├── models.py                          # Modelo IntegracionExterna
├── serializers.py                     # Serializers
├── views.py                           # IntegracionExternaViewSet
├── urls.py                            # Rutas
└── migrations/
    └── XXXX_add_integracion_externa.py

backend/apps/gestion_estrategica/management/commands/
├── reset_integraciones_counters.py   # Cronjob reset diario
└── check_integraciones_health.py     # Cronjob monitoreo

backend/scripts/
└── rotar_encryption_key.py           # Script rotación de claves
```

### Frontend

```
frontend/src/features/gestion-estrategica/
├── types/strategic.types.ts          # Tipos TypeScript
├── api/strategicApi.ts               # API client
├── hooks/useStrategic.ts             # React Query hooks
└── integraciones/
    ├── pages/
    │   └── IntegracionesPage.tsx
    └── components/
        ├── IntegracionesTable.tsx
        ├── IntegracionFormModal.tsx
        ├── IntegracionDetailModal.tsx
        ├── TestConnectionModal.tsx
        └── IntegracionLogsModal.tsx
```

---

## Dependencias

```txt
# backend/requirements/base.txt
cryptography==42.0.0
```

---

## Próximos Pasos

1. **Implementar pruebas de conexión reales** por tipo de servicio
2. **Crear helpers específicos** (gmail_helper.py, twilio_helper.py, dian_helper.py)
3. **Agregar webhooks** para callbacks de servicios externos
4. **Implementar rate limiting automático** con throttling
5. **Dashboard de monitoreo** con métricas en tiempo real
6. **Alertas automáticas** cuando integraciones fallen
7. **Rotación automática** de credenciales periódica
8. **Tests automatizados** unitarios e integración
9. **Documentación específica** por cada proveedor
10. **Logs centralizados** con ELK o similar

---

## Soporte y Troubleshooting

### Error: "ENCRYPTION_KEY no configurada"

**Causa:** Variable de entorno faltante

**Solución:**

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
echo "ENCRYPTION_KEY=clave_generada" >> .env
```

### Error: "Error al desencriptar credenciales"

**Causa:** Clave de encriptación incorrecta o cambiada

**Solución:**

1. Verificar que `ENCRYPTION_KEY` en `.env` sea la correcta
2. Si cambió, usar script de rotación de claves
3. Si se corrompió, eliminar y recrear la integración

### Integración no marcada como "healthy"

**Causa:** No hay registro de conexión exitosa reciente

**Solución:**

```python
integracion = IntegracionExterna.objects.get(id=X)
integracion.registrar_exito()
```

---

**Última actualización:** 2026-02-06
**Versión:** 2.0
**Base de datos:** PostgreSQL con django-tenants
**Autor:** Claude Sonnet 4.5
