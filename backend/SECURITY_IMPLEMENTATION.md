# Implementación de Seguridad - SGI Grasas y Huesos del Norte

## Resumen de Implementación

Se han implementado las siguientes medidas de seguridad:

### 1. Rate Limiting
- ✅ Decoradores para diferentes niveles de restricción
- ✅ Middleware para throttling por IP
- ✅ Bloqueo automático de IPs sospechosas

### 2. Security Headers (OWASP)
- ✅ HSTS (HTTP Strict Transport Security)
- ✅ XSS Protection
- ✅ Content Type Nosniff
- ✅ X-Frame-Options (Clickjacking)
- ✅ Content Security Policy (CSP)

### 3. CORS Configuración Segura
- ✅ Origins permitidos configurables
- ✅ Credentials habilitados
- ✅ CSRF Trusted Origins

### 4. Input Sanitization
- ✅ Validación SQL Injection
- ✅ Sanitización HTML con bleach
- ✅ Validación de emails y teléfonos
- ✅ Limpieza de queries de búsqueda

### 5. Middleware de Seguridad
- ✅ Detección de patrones de ataque
- ✅ Log de eventos de seguridad
- ✅ Bloqueo temporal de IPs

## Archivos Creados

### Middleware
- `backend/apps/core/middleware/security.py` - Middleware de seguridad
- `backend/apps/core/middleware/__init__.py`

### Decoradores
- `backend/apps/core/decorators/ratelimit.py` - Decoradores de rate limiting
- `backend/apps/core/decorators/__init__.py`

### Utilidades
- `backend/apps/core/utils/sanitization.py` - Funciones de sanitización
- `backend/apps/core/utils/__init__.py`

### Vistas
- `backend/apps/core/views/security.py` - Vistas de error de seguridad
- `backend/apps/core/views/__init__.py`

### Ejemplos
- `backend/apps/core/serializers/security_example.py` - Serializers seguros
- `backend/apps/core/views/ratelimit_examples.py` - Ejemplos de rate limiting

### Configuración
- `backend/.env.security.example` - Variables de entorno de seguridad

## Instalación

### 1. Instalar Dependencias

```bash
cd backend
pip install -r requirements.txt
```

Dependencias agregadas:
- `django-ratelimit==4.1.0`
- `django-csp==3.8`
- `bleach==6.1.0`

### 2. Verificar Configuración

El archivo `backend/config/settings.py` ya está configurado con:
- Security headers
- Rate limiting
- CSRF protection
- Session security

### 3. Configurar Variables de Entorno

Para producción, copiar `.env.security.example` y configurar:

```bash
cp .env.security.example .env
```

Editar `.env` con valores de producción:
- `DEBUG=False`
- `SECRET_KEY=` (generar uno nuevo)
- `ALLOWED_HOSTS=` (tu dominio)
- `CORS_ALLOWED_ORIGINS=` (frontend URL)
- `CSRF_TRUSTED_ORIGINS=` (mismo que CORS)

## Uso

### 1. Rate Limiting en Vistas

#### Login (5 intentos/minuto)
```python
from apps.core.decorators import login_rate_limit

@api_view(['POST'])
@login_rate_limit
def login_view(request):
    # Lógica de autenticación
    pass
```

#### Reset de Contraseña (3 intentos/hora)
```python
from apps.core.decorators import password_reset_rate_limit

@api_view(['POST'])
@password_reset_rate_limit
def password_reset_view(request):
    # Lógica de reset
    pass
```

#### Endpoints Sensibles (10 intentos/minuto)
```python
from apps.core.decorators import sensitive_rate_limit

@api_view(['POST'])
@sensitive_rate_limit
def sensitive_endpoint(request):
    # Lógica sensible
    pass
```

### 2. Rate Limiting en ViewSets

```python
from rest_framework import viewsets
from apps.core.decorators import RateLimitMixin

class MyViewSet(RateLimitMixin, viewsets.ModelViewSet):
    rate_limit_key = 'my_viewset'
    rate_limit_limit = 50
    rate_limit_period = 60

    # queryset, serializer_class, etc.
```

### 3. Sanitización en Serializers

```python
from apps.core.utils import sanitize_text, validate_sql_input
from rest_framework import serializers

class MySerializer(serializers.ModelSerializer):
    def validate_description(self, value):
        # Validar SQL injection
        if not validate_sql_input(value):
            raise serializers.ValidationError("Texto inválido")

        # Sanitizar
        return sanitize_text(value)
```

### 4. Sanitización HTML

```python
from apps.core.utils import sanitize_html

class ArticleSerializer(serializers.ModelSerializer):
    def validate_content(self, value):
        # Permite HTML pero sanitiza tags peligrosos
        return sanitize_html(value)
```

## Configuración de Producción

### 1. SSL/HTTPS

Asegurarse de que `DEBUG=False` en producción. Esto activa:
- `SECURE_SSL_REDIRECT = True`
- `SESSION_COOKIE_SECURE = True`
- `CSRF_COOKIE_SECURE = True`
- HSTS Headers

### 2. CSP Headers

Configurados en `settings.py`:
- `CSP_DEFAULT_SRC = ("'self'",)`
- `CSP_SCRIPT_SRC` - Permite scripts solo de mismo origen
- `CSP_STYLE_SRC` - Permite estilos solo de mismo origen
- `CSP_IMG_SRC` - Permite imágenes de mismo origen + data/blob

Para ajustar, modificar en `settings.py` según necesidades del frontend.

### 3. CORS

Solo permitir origins necesarios:
```
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

### 4. Rate Limiting

Los límites actuales son:
- Login: 5/minuto
- Password Reset: 3/hora
- API General: 100/minuto
- Endpoints Sensibles: 10/minuto
- Exportaciones: 5/hora
- Throttling por IP: 200/minuto

Para ajustar, modificar en:
- `apps/core/decorators/ratelimit.py` (decoradores)
- `apps/core/middleware/security.py` (throttling global)

## Logs de Seguridad

### Ubicación
- `backend/logs/security.log` - Eventos de seguridad
- `backend/logs/error.log` - Errores generales

### Eventos Registrados

1. **Rate Limiting**
   - IP excedió límite
   - Endpoint afectado
   - Límite y período

2. **SQL Injection**
   - Intento detectado
   - IP origen
   - Parámetros sospechosos

3. **Accesos No Autorizados**
   - 401/403 responses
   - IP y usuario
   - Endpoint solicitado

4. **IPs Bloqueadas**
   - IP bloqueada automáticamente
   - Razón del bloqueo
   - Duración (1 hora)

### Revisar Logs

```bash
# Eventos de seguridad
tail -f backend/logs/security.log

# Filtrar por IP
grep "192.168.1.100" backend/logs/security.log

# Eventos de rate limiting
grep "Rate limit" backend/logs/security.log
```

## Bloqueo Automático de IPs

El sistema bloquea automáticamente IPs que:
- Generan 10+ eventos de seguridad en 1 hora
- Patrón de ataque detectado (SQL injection, XSS)

Duración del bloqueo: 1 hora (configurable en middleware)

Para desbloquear manualmente:
```python
from django.core.cache import cache
cache.delete('blocked_ip_192.168.1.100')
```

## Testing

### Probar Rate Limiting

```bash
# Hacer múltiples requests rápidas
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/auth/login/ \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}'
done
```

Después de 5 requests, debería recibir error 429.

### Probar SQL Injection Detection

```bash
curl "http://localhost:8000/api/endpoint/?query=1' OR '1'='1"
```

Debería recibir error 400 y generar log en security.log.

## Mejores Prácticas

### 1. Serializers
- Siempre validar inputs
- Usar sanitización en campos de texto libre
- No confiar en datos del cliente

### 2. Endpoints
- Aplicar rate limiting a todos los endpoints públicos
- Rate limiting estricto en autenticación
- Rate limiting medio en operaciones sensibles

### 3. Logs
- Revisar logs de seguridad diariamente
- Configurar alertas para múltiples eventos de la misma IP
- Mantener logs por al menos 90 días

### 4. Configuración
- Nunca usar DEBUG=True en producción
- Cambiar SECRET_KEY regularmente
- Mantener dependencias actualizadas

### 5. Monitoreo
- Monitorear IPs bloqueadas
- Revisar patrones de ataque
- Ajustar límites según uso real

## Checklist de Despliegue a Producción

- [ ] DEBUG=False
- [ ] SECRET_KEY único y seguro
- [ ] ALLOWED_HOSTS configurado
- [ ] CORS_ALLOWED_ORIGINS solo dominios necesarios
- [ ] CSRF_TRUSTED_ORIGINS configurado
- [ ] SSL/HTTPS habilitado
- [ ] Redis configurado con contraseña
- [ ] Logs de seguridad configurados
- [ ] Rate limiting probado
- [ ] Monitoreo de logs configurado
- [ ] Backups de logs habilitados
- [ ] Dependencias actualizadas

## Soporte

Para problemas o preguntas:
1. Revisar logs en `backend/logs/security.log`
2. Verificar configuración en `settings.py`
3. Consultar ejemplos en `apps/core/views/ratelimit_examples.py`

## Referencias

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Django Security: https://docs.djangoproject.com/en/5.0/topics/security/
- DRF Security: https://www.django-rest-framework.org/topics/security/
