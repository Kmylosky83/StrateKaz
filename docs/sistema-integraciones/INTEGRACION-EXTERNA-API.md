# API de Integraciones Externas

## Documentación Completa del Sistema de Integraciones Externas

**Ubicación:** `backend/apps/gestion_estrategica/configuracion/`

---

## Descripción General

Sistema completo para gestionar integraciones con servicios externos como:
- Facturación Electrónica (DIAN)
- Servicios de Email (Gmail, SendGrid, SES)
- Mensajería (SMS, WhatsApp)
- Almacenamiento en la nube (S3, Google Drive)
- Pasarelas de pago (PayU, MercadoPago, Stripe)
- Business Intelligence (Power BI, Tableau)
- Y más...

### Características de Seguridad

- **Credenciales Encriptadas:** Todas las credenciales se almacenan encriptadas usando `cryptography.fernet`
- **Enmascaramiento:** Las credenciales se enmascaran en respuestas normales (solo últimos 4 caracteres)
- **Acceso Restringido:** Solo SuperAdmin puede ver/editar credenciales completas
- **Logging Seguro:** Nunca se loggean credenciales en texto plano
- **Validación:** Validación automática según método de autenticación

---

## Modelos

### IntegracionExterna

**Tabla:** `configuracion_integracion_externa`

#### Campos Principales

```python
# Identificación
nombre: str                     # Nombre descriptivo
tipo_servicio: str              # EMAIL, SMS, FACTURACION, etc.
proveedor: str                  # GMAIL, DIAN, TWILIO, etc.
descripcion: str (opcional)

# Configuración Técnica
endpoint_url: URL               # URL base de la API
metodo_autenticacion: str       # API_KEY, OAUTH2, BASIC_AUTH, etc.
credenciales: JSONField         # Encriptadas automáticamente
configuracion_adicional: JSON   # Parámetros específicos

# Control y Monitoreo
ambiente: str                   # PRODUCCION, SANDBOX, DESARROLLO
is_active: bool
ultima_conexion_exitosa: datetime
ultima_falla: datetime
contador_llamadas: int
errores_recientes: list[dict]

# Límites
limite_llamadas_dia: int (opcional)
alerta_porcentaje_limite: int (default=80)
```

#### Propiedades Computadas

```python
is_healthy: bool                # True si última conexión < 24h y sin errores
is_deleted: bool                # True si deleted_at no es None
status_indicator: str           # 'success', 'warning', 'danger'
porcentaje_uso_limite: float    # % de uso del límite diario
requiere_alerta_limite: bool    # True si uso >= alerta_porcentaje_limite
```

#### Métodos Principales

```python
# Gestión de Estado
registrar_exito()                           # Marca conexión exitosa
registrar_error(mensaje, codigo=None)       # Registra error
limpiar_errores()                           # Limpia lista de errores
resetear_contador_llamadas()               # Reset contador diario

# Gestión de Credenciales
get_credencial(key, default=None)          # Obtiene credencial específica
validar_credenciales() -> (bool, str)      # Valida según método auth

# Ciclo de Vida
soft_delete()                              # Eliminación lógica
restore()                                  # Restaura eliminada
```

---

## Serializers

### 1. IntegracionExternaSerializer (Detalle Completo)

**Uso:** Operaciones de detalle (retrieve, create, update)

**Características:**
- Todos los campos del modelo
- Credenciales enmascaradas (`credenciales_masked`)
- Campos computados (`is_healthy`, `status_indicator`, etc.)
- Display names para choices
- Información de auditoría

**Campos Especiales:**

```python
credenciales_masked: dict       # Solo últimos 4 caracteres
is_healthy: bool
status_indicator: str           # 'success', 'warning', 'danger'
tipo_servicio_display: str
proveedor_display: str
metodo_autenticacion_display: str
ambiente_display: str
created_by_name: str
updated_by_name: str
```

### 2. IntegracionExternaListSerializer (Listados)

**Uso:** Listados y tablas

**Incluye:**
- Campos esenciales para tablas
- Indicadores de estado
- Display names

### 3. IntegracionExternaChoicesSerializer

**Uso:** Poblar dropdowns/selects

**Retorna:**

```json
{
  "tipos_servicio": [
    {"value": "EMAIL", "label": "Servicio de Email"},
    {"value": "SMS", "label": "Mensajería SMS"},
    ...
  ],
  "proveedores": [...],
  "metodos_autenticacion": [...],
  "ambientes": [...]
}
```

### 4. IntegracionExternaCredencialesSerializer (SuperAdmin)

**Uso:** Ver/editar credenciales completas

**SEGURIDAD:** Solo accesible por SuperAdmin

**Incluye:**
- Credenciales desencriptadas
- Validación de credenciales
- Mensaje de validación

---

## API Endpoints

### Base URL

```
/api/gestion-estrategica/configuracion/integraciones-externas/
```

### Endpoints CRUD

#### 1. Listar Integraciones

```http
GET /integraciones-externas/
```

**Permisos:** IsAuthenticated + Nivel Coordinación o superior

**Query Params:**
- `tipo_servicio`: Filtrar por tipo
- `proveedor`: Filtrar por proveedor
- `is_active`: Filtrar por estado activo
- `ambiente`: Filtrar por ambiente
- `search`: Buscar en nombre/descripción
- `ordering`: Ordenar por campos
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
      "ultima_conexion_exitosa": "2025-12-13T10:30:00Z",
      "ultima_falla": null
    }
  ]
}
```

#### 2. Crear Integración

```http
POST /integraciones-externas/
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
GET /integraciones-externas/{id}/
```

**Permisos:** IsAuthenticated + Nivel Coordinación o superior

**Response:**

```json
{
  "id": 1,
  "nombre": "Email Corporativo Gmail",
  "tipo_servicio": "EMAIL",
  "tipo_servicio_display": "Servicio de Email",
  "proveedor": "GMAIL",
  "proveedor_display": "Gmail / Google Workspace",
  "descripcion": "Servicio de email para notificaciones",
  "endpoint_url": "https://gmail.googleapis.com/",
  "metodo_autenticacion": "OAUTH2",
  "metodo_autenticacion_display": "OAuth 2.0",
  "credenciales_masked": {
    "client_id": "****com",
    "client_secret": "****xxxx",
    "refresh_token": "****xxxx"
  },
  "configuracion_adicional": {
    "from_email": "noreply@empresa.com",
    "from_name": "Sistema de Gestión"
  },
  "ambiente": "PRODUCCION",
  "ambiente_display": "Producción",
  "is_active": true,
  "ultima_conexion_exitosa": "2025-12-13T10:30:00Z",
  "ultima_falla": null,
  "contador_llamadas": 45,
  "errores_recientes": [],
  "limite_llamadas_dia": 500,
  "alerta_porcentaje_limite": 80,
  "is_healthy": true,
  "is_deleted": false,
  "status_indicator": "success",
  "porcentaje_uso_limite": 9.0,
  "requiere_alerta_limite": false,
  "created_by": 1,
  "created_by_name": "Juan Pérez",
  "created_at": "2025-12-01T08:00:00Z",
  "updated_by": 1,
  "updated_by_name": "Juan Pérez",
  "updated_at": "2025-12-13T10:30:00Z",
  "deleted_at": null
}
```

#### 4. Actualizar Integración

```http
PUT /integraciones-externas/{id}/
PATCH /integraciones-externas/{id}/
```

**Permisos:** IsSuperAdmin

**Body:** Igual que create (PATCH permite actualización parcial)

**IMPORTANTE:** NO incluir credenciales aquí. Usar endpoint `update_credentials/` para actualizar credenciales.

#### 5. Eliminar Integración (Soft Delete)

```http
DELETE /integraciones-externas/{id}/
```

**Permisos:** IsSuperAdmin

**Response:** 204 No Content

---

### Acciones Personalizadas

#### 6. Obtener Choices

```http
GET /integraciones-externas/choices/
```

**Permisos:** IsAuthenticated + Nivel Coordinación o superior

**Response:**

```json
{
  "tipos_servicio": [
    {"value": "EMAIL", "label": "Servicio de Email"},
    {"value": "SMS", "label": "Mensajería SMS"},
    ...
  ],
  "proveedores": [
    {"value": "GMAIL", "label": "Gmail / Google Workspace"},
    {"value": "TWILIO", "label": "Twilio"},
    ...
  ],
  "metodos_autenticacion": [
    {"value": "API_KEY", "label": "API Key"},
    {"value": "OAUTH2", "label": "OAuth 2.0"},
    ...
  ],
  "ambientes": [
    {"value": "PRODUCCION", "label": "Producción"},
    {"value": "SANDBOX", "label": "Sandbox / Pruebas"},
    {"value": "DESARROLLO", "label": "Desarrollo"}
  ]
}
```

#### 7. Probar Conexión

```http
POST /integraciones-externas/{id}/test_connection/
```

**Permisos:** IsAuthenticated + Nivel Coordinación o superior

**Descripción:** Prueba la conexión con el servicio externo.

**NOTA:** Actualmente es un placeholder. La implementación real debe hacerse según el tipo de servicio.

**Response (Éxito):**

```json
{
  "success": true,
  "message": "Conexión exitosa (simulada)",
  "timestamp": "2025-12-13T11:00:00Z"
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
POST /integraciones-externas/{id}/toggle_status/
```

**Permisos:** IsAuthenticated + Nivel Coordinación o superior

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
GET /integraciones-externas/{id}/logs/
```

**Permisos:** IsAuthenticated + Nivel Coordinación o superior

**Response:**

```json
{
  "integracion_id": 1,
  "integracion_nombre": "Email Corporativo Gmail",
  "errores_recientes": [
    {
      "timestamp": "2025-12-12T15:30:00Z",
      "message": "Rate limit exceeded",
      "code": "RATE_LIMIT"
    }
  ],
  "ultima_conexion_exitosa": "2025-12-13T10:30:00Z",
  "ultima_falla": "2025-12-12T15:30:00Z",
  "contador_llamadas": 45,
  "limite_llamadas_dia": 500,
  "porcentaje_uso_limite": 9.0
}
```

#### 10. Actualizar Credenciales

```http
PUT /integraciones-externas/{id}/update_credentials/
PATCH /integraciones-externas/{id}/update_credentials/
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

**IMPORTANTE:**
- Las credenciales se muestran completas en la respuesta
- Se encriptan automáticamente antes de guardarse
- Se valida que los campos requeridos estén presentes

#### 11. Restaurar Integración Eliminada

```http
POST /integraciones-externas/{id}/restore/
```

**Permisos:** IsAuthenticated + Nivel Coordinación o superior

**Response:**

```json
{
  "message": "Integración restaurada exitosamente.",
  "data": { /* objeto completo */ }
}
```

#### 12. Limpiar Errores

```http
POST /integraciones-externas/{id}/clear_errors/
```

**Permisos:** IsAuthenticated + Nivel Coordinación o superior

**Response:**

```json
{
  "message": "Errores limpiados exitosamente.",
  "errores_recientes": []
}
```

---

## Permisos por Endpoint

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

## Validaciones

### Validación de Credenciales

Según el método de autenticación, se valida que estén presentes los campos requeridos:

```python
VALIDACIONES = {
    'API_KEY': ['api_key'],
    'BEARER_TOKEN': ['token'],
    'OAUTH2': ['client_id', 'client_secret'],
    'BASIC_AUTH': ['username', 'password'],
    'JWT': ['secret_key'],
    'SERVICE_ACCOUNT': ['service_account_email', 'private_key'],
    'CERTIFICATE': ['certificate_path', 'private_key_path'],
}
```

---

## Ejemplos de Uso

### Crear Integración con Gmail

```http
POST /api/gestion-estrategica/configuracion/integraciones-externas/

{
  "nombre": "Email Corporativo Gmail",
  "tipo_servicio": "EMAIL",
  "proveedor": "GMAIL",
  "descripcion": "Gmail para envío de notificaciones del sistema",
  "endpoint_url": "https://gmail.googleapis.com/",
  "metodo_autenticacion": "OAUTH2",
  "credenciales": {
    "client_id": "123456789.apps.googleusercontent.com",
    "client_secret": "GOCSPX-abc123def456",
    "refresh_token": "1//abc123def456ghi789"
  },
  "ambiente": "PRODUCCION",
  "configuracion_adicional": {
    "from_email": "noreply@empresa.com",
    "from_name": "Sistema de Gestión StrateKaz"
  },
  "limite_llamadas_dia": 500
}
```

### Crear Integración con Twilio (SMS)

```http
POST /api/gestion-estrategica/configuracion/integraciones-externas/

{
  "nombre": "SMS Twilio",
  "tipo_servicio": "SMS",
  "proveedor": "TWILIO",
  "descripcion": "Envío de SMS para notificaciones urgentes",
  "endpoint_url": "https://api.twilio.com/2010-04-01/",
  "metodo_autenticacion": "BASIC_AUTH",
  "credenciales": {
    "username": "AC1234567890abcdef",
    "password": "auth_token_here"
  },
  "ambiente": "PRODUCCION",
  "configuracion_adicional": {
    "from_number": "+12345678900"
  },
  "limite_llamadas_dia": 100
}
```

### Crear Integración con DIAN (Facturación Electrónica)

```http
POST /api/gestion-estrategica/configuracion/integraciones-externas/

{
  "nombre": "Facturación Electrónica DIAN",
  "tipo_servicio": "FACTURACION",
  "proveedor": "DIAN",
  "descripcion": "Integración directa con DIAN para facturación electrónica",
  "endpoint_url": "https://vpfe.dian.gov.co/WcfDianCustomerServices.svc",
  "metodo_autenticacion": "CERTIFICATE",
  "credenciales": {
    "certificate_path": "/certs/dian_cert.p12",
    "private_key_path": "/certs/dian_key.pem",
    "certificate_password": "cert_password_here"
  },
  "ambiente": "PRODUCCION",
  "configuracion_adicional": {
    "nit": "900123456",
    "software_id": "abc123-def456-ghi789",
    "pin": "12345"
  }
}
```

---

## Logging y Monitoreo

### Eventos Loggeados

Todos los eventos se loggean con nivel apropiado:

```python
# INFO
logger.info(f"Prueba de conexión exitosa para {integracion.nombre} por {user.username}")
logger.info(f"Integración {integracion.nombre} activada por {user.username}")

# WARNING
logger.warning(f"Credenciales actualizadas para {integracion.nombre} por {user.username}")

# ERROR
logger.error(f"Error en prueba de conexión para {integracion.nombre}: {str(e)}")
```

### Errores Recientes

Las integraciones mantienen un historial de los últimos 10 errores:

```python
{
  "errores_recientes": [
    {
      "timestamp": "2025-12-13T10:30:00Z",
      "message": "Connection timeout",
      "code": "TIMEOUT"
    },
    // ... hasta 10 errores
  ]
}
```

---

## Configuración de Encriptación

### Variable de Entorno Requerida

```bash
# .env
ENCRYPTION_KEY=clave_generada_con_fernet
```

### Generar Clave de Encriptación

```python
from cryptography.fernet import Fernet

# Generar nueva clave
key = Fernet.generate_key()
print(key.decode())
```

O desde línea de comandos:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

**IMPORTANTE:**
- Guardar la clave en `.env`
- NO commitear la clave al repositorio
- Usar la misma clave en todos los ambientes (prod, staging)
- Si se pierde la clave, las credenciales existentes NO pueden desencriptarse

---

## Mejores Prácticas

### Seguridad

1. **Nunca exponer credenciales completas** excepto en endpoint `update_credentials/`
2. **Validar permisos** antes de mostrar información sensible
3. **Loggear cambios críticos** (creación, actualización de credenciales, eliminación)
4. **Rotar credenciales** periódicamente
5. **Monitorear intentos de acceso** no autorizado

### Uso

1. **Probar en SANDBOX** antes de activar en PRODUCCION
2. **Configurar límites** de llamadas apropiados
3. **Monitorear logs** regularmente
4. **Limpiar errores** después de resolver problemas
5. **Desactivar integraciones** no utilizadas

### Implementación de Servicios

Para implementar prueba de conexión real por servicio:

```python
# En views.py, método test_connection()

if integracion.tipo_servicio == 'EMAIL':
    if integracion.proveedor == 'GMAIL':
        test_gmail_connection(integracion)
    elif integracion.proveedor == 'SENDGRID':
        test_sendgrid_connection(integracion)

elif integracion.tipo_servicio == 'SMS':
    if integracion.proveedor == 'TWILIO':
        test_twilio_connection(integracion)

# etc...
```

---

## Archivo de Configuración

### Ubicación de Archivos

```
backend/apps/gestion_estrategica/configuracion/
├── models.py              # Modelo IntegracionExterna
├── serializers.py         # Todos los serializers
├── views.py               # IntegracionExternaViewSet
├── urls.py                # Registro de rutas
└── migrations/
    └── XXXX_add_integracion_externa.py
```

---

## Dependencias

```python
# requirements.txt
cryptography>=41.0.0    # Para encriptación de credenciales
```

---

## Próximos Pasos

1. **Implementar pruebas de conexión** reales por tipo de servicio
2. **Crear helpers** para cada proveedor (gmail_helper.py, twilio_helper.py, etc.)
3. **Agregar webhooks** para notificaciones de servicios externos
4. **Implementar rate limiting** automático
5. **Dashboard de monitoreo** con métricas en tiempo real
6. **Alertas automáticas** cuando integraciones fallen
7. **Rotación automática** de credenciales
8. **Pruebas automatizadas** para cada integración

---

## Soporte

Para dudas o problemas:
- Ver logs del sistema
- Revisar `errores_recientes` de la integración
- Verificar que `ENCRYPTION_KEY` esté configurada
- Validar permisos del usuario
- Comprobar estado de la integración (`is_active`, `is_healthy`)

---

**Última actualización:** 2025-12-13
**Versión:** 1.0.0
