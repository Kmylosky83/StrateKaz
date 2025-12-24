# Modelo IntegracionExterna - Documentación Completa

## Tabla de Contenidos
1. [Descripción General](#descripción-general)
2. [Características de Seguridad](#características-de-seguridad)
3. [Estructura del Modelo](#estructura-del-modelo)
4. [Instalación y Configuración](#instalación-y-configuración)
5. [Ejemplos de Uso](#ejemplos-de-uso)
6. [API Reference](#api-reference)
7. [Casos de Uso por Tipo de Servicio](#casos-de-uso-por-tipo-de-servicio)

---

## Descripción General

El modelo `IntegracionExterna` gestiona las conexiones con servicios externos del sistema, incluyendo:

- **Comunicación**: Email (Gmail, SendGrid), SMS, WhatsApp (Twilio)
- **Facturación Electrónica**: DIAN, Carvajal, Siigo, Alegra
- **Almacenamiento**: AWS S3, Google Drive, Azure Blob
- **Business Intelligence**: Power BI, Tableau, Metabase
- **Pagos**: PayU, MercadoPago, Stripe, Wompi
- **Mapas**: Google Maps, Mapbox
- **Firma Digital**: Certicámara, GSE, Andes SCD
- **Otros**: ERP externos, CRM, APIs de terceros

### Características Principales

- **Encriptación de credenciales** con `cryptography.fernet`
- **Soft delete** para auditoría completa
- **Monitoreo de salud** (última conexión, errores recientes)
- **Rate limiting** con contador de llamadas
- **Multi-ambiente** (Producción, Sandbox, Desarrollo)
- **Campos de auditoría** (created_by, updated_by, timestamps)

---

## Características de Seguridad

### Encriptación de Credenciales

Las credenciales se almacenan **ENCRIPTADAS** usando Fernet (criptografía simétrica):

- **Algoritmo**: AES-128 en modo CBC con HMAC
- **Clave de encriptación**: Se obtiene desde variable de entorno `ENCRYPTION_KEY`
- **Campo encriptado**: `_credenciales_encrypted` (acceso mediante property `credenciales`)

### Buenas Prácticas de Seguridad

1. **NUNCA** versionar la clave de encriptación en Git
2. **SIEMPRE** usar una clave única por ambiente (Dev, QA, Prod)
3. **ROTAR** la clave periódicamente (cada 90-180 días)
4. **BACKUP** de la clave en un vault seguro (Azure Key Vault, AWS Secrets Manager)
5. **LOGS**: Nunca loguear credenciales desencriptadas

---

## Estructura del Modelo

### Campos de Identificación

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `nombre` | CharField(150) | Nombre descriptivo |
| `tipo_servicio` | CharField | EMAIL, FACTURACION, SMS, WHATSAPP, etc. |
| `proveedor` | CharField | GMAIL, DIAN, TWILIO, AWS_S3, etc. |
| `descripcion` | TextField | Propósito detallado |

### Configuración Técnica

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `endpoint_url` | URLField | URL base de la API |
| `metodo_autenticacion` | CharField | API_KEY, OAUTH2, BASIC_AUTH, etc. |
| `_credenciales_encrypted` | TextField | **ENCRIPTADO** - Acceso vía property |
| `configuracion_adicional` | JSONField | Parámetros específicos |

### Control y Monitoreo

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `ambiente` | CharField | PRODUCCION, SANDBOX, DESARROLLO |
| `is_active` | Boolean | Si está activa |
| `ultima_conexion_exitosa` | DateTime | Última conexión OK |
| `ultima_falla` | DateTime | Última falla |
| `contador_llamadas` | Integer | Total de llamadas (rate limiting) |
| `errores_recientes` | JSONField | Últimos 10 errores |
| `limite_llamadas_dia` | Integer | Límite diario (null = sin límite) |
| `alerta_porcentaje_limite` | Integer | % para alerta (default: 80%) |

### Auditoría

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `created_by` | ForeignKey(User) | Usuario creador |
| `created_at` | DateTime | Fecha creación |
| `updated_by` | ForeignKey(User) | Último editor |
| `updated_at` | DateTime | Última actualización |
| `deleted_at` | DateTime | Soft delete |

---

## Instalación y Configuración

### 1. Instalar Dependencias

```bash
cd backend
pip install cryptography==41.0.7
```

### 2. Generar Clave de Encriptación

```bash
# Opción 1: Usando el modelo
python manage.py shell
>>> from apps.gestion_estrategica.configuracion.models import IntegracionExterna
>>> print(IntegracionExterna.generar_clave_encriptacion())
# Copiar la clave generada

# Opción 2: Directamente con cryptography
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### 3. Configurar Variable de Entorno

Agregar al archivo `.env`:

```env
# CRITICAL: Clave de encriptación para IntegracionExterna
# Generar con: from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())
ENCRYPTION_KEY=su_clave_generada_aqui_44_caracteres
```

**IMPORTANTE**:
- La clave debe tener exactamente 44 caracteres (32 bytes en base64)
- Nunca versionar en Git
- Usar claves diferentes por ambiente

### 4. Ejecutar Migraciones

```bash
python manage.py migrate
```

---

## Ejemplos de Uso

### Ejemplo 1: Configurar Gmail para Email Corporativo

```python
from apps.gestion_estrategica.configuracion.models import IntegracionExterna
from apps.core.models import User

# Obtener usuario administrador
admin = User.objects.get(username='admin')

# Crear integración
integracion_gmail = IntegracionExterna(
    nombre='Email Corporativo - Gmail',
    tipo_servicio='EMAIL',
    proveedor='GMAIL',
    descripcion='Servicio de email corporativo para notificaciones y envío de certificados',
    endpoint_url='smtp.gmail.com',
    metodo_autenticacion='OAUTH2',
    ambiente='PRODUCCION',
    created_by=admin
)

# Configurar credenciales (SE ENCRIPTAN AUTOMÁTICAMENTE)
integracion_gmail.credenciales = {
    'client_id': 'tu_client_id.apps.googleusercontent.com',
    'client_secret': 'tu_client_secret',
    'refresh_token': 'tu_refresh_token',
}

# Configuración adicional
integracion_gmail.configuracion_adicional = {
    'port': 587,
    'use_tls': True,
    'timeout': 30,
    'from_email': 'noreply@grasasyhuesos.com',
}

# Límites
integracion_gmail.limite_llamadas_dia = 2000  # Límite de Gmail
integracion_gmail.alerta_porcentaje_limite = 80

integracion_gmail.save()
```

### Ejemplo 2: Configurar DIAN para Facturación Electrónica

```python
integracion_dian = IntegracionExterna(
    nombre='DIAN - Facturación Electrónica',
    tipo_servicio='FACTURACION',
    proveedor='DIAN',
    descripcion='Integración directa con DIAN para emisión de facturas electrónicas',
    endpoint_url='https://vpfe.dian.gov.co/WcfDianCustomerServices.svc',
    metodo_autenticacion='CERTIFICATE',
    ambiente='PRODUCCION',
    created_by=admin
)

# Credenciales con certificado digital
integracion_dian.credenciales = {
    'certificate_path': '/path/to/certificado.p12',
    'certificate_password': 'password_del_certificado',
    'nit': '900123456',
    'software_id': 'abc123xyz',
    'software_pin': '1234',
}

integracion_dian.configuracion_adicional = {
    'test_set_id': '1234567890',  # Para ambiente de habilitación
    'ambiente_dian': 'produccion',  # produccion o habilitacion
    'timeout': 60,
}

integracion_dian.save()
```

### Ejemplo 3: Configurar Twilio para SMS

```python
integracion_twilio = IntegracionExterna(
    nombre='Twilio - SMS y WhatsApp',
    tipo_servicio='SMS',
    proveedor='TWILIO',
    descripcion='Servicio de mensajería SMS y WhatsApp para notificaciones a ecoaliados',
    endpoint_url='https://api.twilio.com/2010-04-01',
    metodo_autenticacion='BASIC_AUTH',
    ambiente='PRODUCCION',
    created_by=admin
)

integracion_twilio.credenciales = {
    'account_sid': 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'auth_token': 'tu_auth_token_secreto',
    'from_number': '+573001234567',  # Número Twilio
}

integracion_twilio.configuracion_adicional = {
    'messaging_service_sid': 'MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'status_callback_url': 'https://tuapp.com/api/twilio/webhook',
}

integracion_twilio.limite_llamadas_dia = 10000
integracion_twilio.save()
```

### Ejemplo 4: Configurar AWS S3 para Almacenamiento

```python
integracion_s3 = IntegracionExterna(
    nombre='AWS S3 - Almacenamiento de Certificados',
    tipo_servicio='ALMACENAMIENTO',
    proveedor='AWS_S3',
    descripcion='Almacenamiento en la nube de certificados PDF, vouchers y documentos',
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
    'bucket_name': 'grasasyhuesos-docs',
    'default_acl': 'private',
    'signature_version': 's3v4',
}

integracion_s3.save()
```

---

## API Reference

### Properties

#### `credenciales` (read/write)
```python
# Leer credenciales (desencriptadas automáticamente)
creds = integracion.credenciales
api_key = creds.get('api_key')

# Escribir credenciales (se encriptan automáticamente)
integracion.credenciales = {
    'api_key': 'sk_live_xxxxxxxxxxxxxxxx',
    'secret': 'my_secret_key'
}
```

#### `is_healthy`
```python
# Verifica si la integración está saludable
# True si: última conexión < 24h y sin errores recientes
if integracion.is_healthy:
    print("Integración operativa")
else:
    print("Integración con problemas")
```

#### `porcentaje_uso_limite`
```python
# Retorna % de uso del límite diario (0-100) o None
porcentaje = integracion.porcentaje_uso_limite
if porcentaje and porcentaje > 80:
    print(f"ALERTA: Uso al {porcentaje}%")
```

#### `requiere_alerta_limite`
```python
# True si el uso está por encima del % configurado
if integracion.requiere_alerta_limite:
    enviar_alerta_administrador()
```

### Métodos de Gestión

#### `registrar_exito()`
```python
# Registrar conexión exitosa
# Actualiza ultima_conexion_exitosa e incrementa contador
integracion.registrar_exito()
```

#### `registrar_error(error_message, error_code=None)`
```python
# Registrar error
# Actualiza ultima_falla y agrega a errores_recientes (últimos 10)
try:
    enviar_email()
except Exception as e:
    integracion.registrar_error(str(e), 'SMTP_ERROR')
```

#### `limpiar_errores()`
```python
# Limpiar historial de errores
integracion.limpiar_errores()
```

#### `resetear_contador_llamadas()`
```python
# Resetear contador (útil para cronjobs diarios)
integracion.resetear_contador_llamadas()
```

#### `get_credencial(key, default=None)`
```python
# Obtener credencial específica
api_key = integracion.get_credencial('api_key', 'default_key')
```

#### `validar_credenciales()`
```python
# Valida que las credenciales requeridas estén presentes
is_valid, error_msg = integracion.validar_credenciales()
if not is_valid:
    print(f"Error: {error_msg}")
```

### Métodos de Clase

#### `obtener_por_tipo(tipo_servicio, activas_only=True)`
```python
# Obtener integraciones por tipo
integraciones_email = IntegracionExterna.obtener_por_tipo('EMAIL')
```

#### `obtener_por_proveedor(proveedor, activas_only=True)`
```python
# Obtener integraciones por proveedor
integraciones_twilio = IntegracionExterna.obtener_por_proveedor('TWILIO')
```

#### `generar_clave_encriptacion()`
```python
# Generar nueva clave de encriptación
nueva_clave = IntegracionExterna.generar_clave_encriptacion()
print(f"Nueva clave: {nueva_clave}")
```

---

## Casos de Uso por Tipo de Servicio

### EMAIL - Envío de Notificaciones

```python
def enviar_email_certificado(destinatario, pdf_path):
    """Envía certificado por email usando integración configurada"""
    # Obtener integración activa de email
    integracion = IntegracionExterna.obtener_por_tipo('EMAIL').first()

    if not integracion or not integracion.is_active:
        raise Exception("No hay integración de email activa")

    # Obtener credenciales
    creds = integracion.credenciales
    config = integracion.configuracion_adicional

    try:
        # Enviar email (ejemplo con Gmail)
        import smtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.application import MIMEApplication

        # Configurar SMTP
        # ... código de envío ...

        # Registrar éxito
        integracion.registrar_exito()

        return True

    except Exception as e:
        # Registrar error
        integracion.registrar_error(str(e), 'EMAIL_SEND_ERROR')
        raise
```

### FACTURACION - Emisión de Facturas Electrónicas

```python
def emitir_factura_electronica(factura_data):
    """Emite factura electrónica a través de DIAN"""
    integracion = IntegracionExterna.obtener_por_tipo('FACTURACION').first()

    if not integracion:
        raise Exception("No hay integración de facturación configurada")

    creds = integracion.credenciales

    # Construir XML de factura
    xml_factura = construir_xml_factura(factura_data)

    # Firmar con certificado digital
    xml_firmado = firmar_xml(
        xml_factura,
        creds['certificate_path'],
        creds['certificate_password']
    )

    # Enviar a DIAN
    try:
        response = enviar_a_dian(
            endpoint=integracion.endpoint_url,
            xml=xml_firmado,
            software_id=creds['software_id'],
            software_pin=creds['software_pin']
        )

        integracion.registrar_exito()
        return response

    except Exception as e:
        integracion.registrar_error(str(e), 'DIAN_ERROR')
        raise
```

### SMS/WHATSAPP - Notificaciones a Ecoaliados

```python
def enviar_notificacion_programacion(telefono, mensaje):
    """Envía SMS/WhatsApp usando Twilio"""
    integracion = IntegracionExterna.obtener_por_tipo('SMS').first()

    if not integracion or not integracion.is_active:
        raise Exception("No hay integración SMS activa")

    # Verificar límite de llamadas
    if integracion.requiere_alerta_limite:
        logger.warning(f"Límite de SMS cercano: {integracion.porcentaje_uso_limite}%")

    creds = integracion.credenciales

    try:
        from twilio.rest import Client

        client = Client(creds['account_sid'], creds['auth_token'])

        message = client.messages.create(
            body=mensaje,
            from_=creds['from_number'],
            to=telefono
        )

        integracion.registrar_exito()
        return message.sid

    except Exception as e:
        integracion.registrar_error(str(e), 'TWILIO_ERROR')
        raise
```

### ALMACENAMIENTO - Backup de Documentos

```python
def subir_documento_s3(archivo_local, ruta_s3):
    """Sube documento a AWS S3"""
    integracion = IntegracionExterna.obtener_por_tipo('ALMACENAMIENTO').first()

    if not integracion:
        raise Exception("No hay integración de almacenamiento")

    creds = integracion.credenciales
    config = integracion.configuracion_adicional

    try:
        import boto3

        s3_client = boto3.client(
            's3',
            aws_access_key_id=creds['access_key_id'],
            aws_secret_access_key=creds['secret_access_key'],
            region_name=creds['region']
        )

        s3_client.upload_file(
            archivo_local,
            config['bucket_name'],
            ruta_s3
        )

        integracion.registrar_exito()

        # Generar URL presignada
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': config['bucket_name'], 'Key': ruta_s3},
            ExpiresIn=3600
        )

        return url

    except Exception as e:
        integracion.registrar_error(str(e), 'S3_UPLOAD_ERROR')
        raise
```

---

## Cronjobs y Tareas Programadas

### Reseteo Diario de Contadores

```python
# management/commands/reset_integraciones_counters.py
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
                self.style.SUCCESS(f'✓ Reseteado: {integracion.nombre}')
            )
```

Configurar en crontab:
```bash
0 0 * * * cd /path/to/project && python manage.py reset_integraciones_counters
```

### Monitoreo de Salud

```python
# management/commands/check_integraciones_health.py
from django.core.management.base import BaseCommand
from apps.gestion_estrategica.configuracion.models import IntegracionExterna
from django.core.mail import send_mail

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
                problemas.append(f"⚠️ {integracion.nombre} - Sin conexión reciente")

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
                'sistema@grasasyhuesos.com',
                ['admin@grasasyhuesos.com'],
            )
            self.stdout.write(self.style.WARNING(mensaje))
        else:
            self.stdout.write(self.style.SUCCESS('✓ Todas las integraciones OK'))
```

---

## Seguridad y Compliance

### Rotación de Claves de Encriptación

```python
# scripts/rotar_encryption_key.py
"""
ADVERTENCIA: Este proceso requiere downtime o coordinación cuidadosa
1. Desencriptar todas las credenciales con clave vieja
2. Actualizar ENCRYPTION_KEY en .env
3. Re-encriptar con nueva clave
"""

from apps.gestion_estrategica.configuracion.models import IntegracionExterna, get_encryption_key
from cryptography.fernet import Fernet
import json

def rotar_clave_encriptacion(nueva_clave):
    """Rota la clave de encriptación de todas las integraciones"""

    # 1. Obtener clave antigua
    clave_vieja = get_encryption_key()
    fernet_viejo = Fernet(clave_vieja)

    # 2. Validar nueva clave
    try:
        fernet_nuevo = Fernet(nueva_clave.encode())
    except Exception as e:
        print(f"ERROR: Clave nueva inválida: {e}")
        return False

    # 3. Re-encriptar todas las integraciones
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

    print("\n✓ Rotación completa. ACTUALIZAR .env con nueva clave:")
    print(f"ENCRYPTION_KEY={nueva_clave}")

    return True


if __name__ == '__main__':
    nueva = input("Ingrese nueva clave de encriptación (44 caracteres): ")
    if len(nueva) != 44:
        print("ERROR: La clave debe tener 44 caracteres")
    else:
        rotar_clave_encriptacion(nueva)
```

---

## Troubleshooting

### Error: "ENCRYPTION_KEY no configurada"

**Causa**: No existe la variable `ENCRYPTION_KEY` en `.env`

**Solución**:
```bash
# Generar clave
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Agregar a .env
echo "ENCRYPTION_KEY=tu_clave_generada_aqui" >> .env

# Reiniciar servidor
```

### Error: "Error al desencriptar credenciales"

**Causa**: La clave de encriptación cambió o las credenciales se corrom pieron

**Solución**:
1. Verificar que `ENCRYPTION_KEY` en `.env` sea la correcta
2. Si cambió la clave, usar script de rotación
3. Si se corrompió, eliminar y volver a crear la integración

### Integración no marcada como "healthy"

**Causa**: No se ha registrado conexión exitosa recientemente

**Solución**:
```python
# Forzar registro de éxito después de probar manualmente
integracion = IntegracionExterna.objects.get(id=X)
integracion.registrar_exito()
```

---

## Próximos Pasos

1. **Crear serializers y viewsets** para la API REST
2. **Implementar UI** en el frontend (React)
3. **Desarrollar servicios** de integración específicos (EmailService, DianService, etc.)
4. **Configurar webhooks** para callbacks de servicios externos
5. **Implementar tests** unitarios y de integración
6. **Documentar** cada integración específica

---

**Documentación generada**: 2025-12-13
**Versión del modelo**: 1.0
**Autor**: Claude Opus 4.5
