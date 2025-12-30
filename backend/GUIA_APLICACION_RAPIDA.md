# Guía de Aplicación Rápida - Rate Limiting y Seguridad

## Objetivo
Aplicar rate limiting a los endpoints existentes del proyecto en 5 pasos.

---

## PASO 1: Instalar Dependencias

```bash
cd backend
pip install -r requirements.txt
```

Esto instalará:
- django-ratelimit==4.1.0
- django-csp==3.8
- bleach==6.1.0

---

## PASO 2: Verificar que el Servidor Funciona

```bash
python manage.py runserver
```

Si hay errores de Redis, ver solución temporal al final de este documento.

---

## PASO 3: Aplicar Rate Limiting a Endpoints de Autenticación

### Opción A: Si usas Function-Based Views

**Archivo:** Tu archivo de vistas de autenticación (ej: `apps/auth/views.py`)

```python
from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.core.decorators import login_rate_limit, password_reset_rate_limit

# ANTES
@api_view(['POST'])
def login(request):
    # tu código
    return Response({...})

# DESPUÉS
@api_view(['POST'])
@login_rate_limit  # <-- Agregar esta línea
def login(request):
    # tu código
    return Response({...})


# ANTES
@api_view(['POST'])
def password_reset(request):
    # tu código
    return Response({...})

# DESPUÉS
@api_view(['POST'])
@password_reset_rate_limit  # <-- Agregar esta línea
def password_reset(request):
    # tu código
    return Response({...})
```

### Opción B: Si usas ViewSets de DRF

**Archivo:** Tu ViewSet de autenticación

```python
from rest_framework import viewsets
from rest_framework.decorators import action
from apps.core.decorators import RateLimitMixin, login_rate_limit

# ANTES
class AuthViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['post'])
    def login(self, request):
        # tu código
        pass

# DESPUÉS - Opción 1: Mixin para todo el ViewSet
class AuthViewSet(RateLimitMixin, viewsets.ViewSet):
    rate_limit_key = 'auth'
    rate_limit_limit = 50  # 50 requests
    rate_limit_period = 60  # por minuto

    @action(detail=False, methods=['post'])
    def login(self, request):
        # tu código
        pass

# DESPUÉS - Opción 2: Decorador solo para login
class AuthViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['post'])
    @login_rate_limit  # <-- Agregar esta línea
    def login(self, request):
        # tu código
        pass
```

---

## PASO 4: Aplicar Sanitización a Serializers

### Ejemplo: Serializer de Usuario

**Archivo:** Tu serializer (ej: `apps/users/serializers.py`)

```python
from rest_framework import serializers
from apps.core.utils import sanitize_text, validate_email

# ANTES
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'name', 'description']

# DESPUÉS
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'name', 'description']

    def validate_email(self, value):
        # Validación adicional
        if not validate_email(value):
            raise serializers.ValidationError("Email inválido")
        return value

    def validate_name(self, value):
        # Sanitizar texto
        return sanitize_text(value)

    def validate_description(self, value):
        # Sanitizar texto
        return sanitize_text(value)
```

### Ejemplo: Serializer con HTML permitido

```python
from apps.core.utils import sanitize_html

class ArticleSerializer(serializers.ModelSerializer):
    def validate_content(self, value):
        # Permite HTML pero sanitiza tags peligrosos
        return sanitize_html(value)
```

---

## PASO 5: Aplicar a Endpoints Sensibles

### Endpoints de Creación/Actualización/Eliminación

```python
from apps.core.decorators import sensitive_rate_limit

class MyViewSet(viewsets.ModelViewSet):
    # Aplicar a acciones específicas
    @sensitive_rate_limit
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @sensitive_rate_limit
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @sensitive_rate_limit
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
```

### Endpoints de Exportación

```python
from apps.core.decorators import data_export_rate_limit

class ReportViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['get'])
    @data_export_rate_limit  # 5 por hora
    def export_excel(self, request):
        # tu código de exportación
        pass
```

---

## Decoradores Disponibles

| Decorador | Límite | Período | Uso |
|-----------|--------|---------|-----|
| `@login_rate_limit` | 5 | 1 minuto | Login, autenticación |
| `@password_reset_rate_limit` | 3 | 1 hora | Reset de contraseña |
| `@api_rate_limit` | 100 | 1 minuto | API general |
| `@sensitive_rate_limit` | 10 | 1 minuto | CRUD operaciones |
| `@data_export_rate_limit` | 5 | 1 hora | Exportaciones |
| `@registration_rate_limit` | 3 | 1 hora | Registro de usuarios |

---

## Testing Rápido

### Test 1: Rate Limiting en Login

**Con curl (Git Bash / Linux / Mac):**
```bash
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/auth/login/ \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}'
  echo ""
done
```

**Con PowerShell:**
```powershell
1..10 | ForEach-Object {
  Invoke-WebRequest -Uri "http://localhost:8000/api/auth/login/" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body '{"username":"test","password":"test"}'
}
```

**Resultado esperado:**
- Primeros 5 requests: Response normal (200, 400, etc.)
- A partir del 6º: Error 429 (Too Many Requests)

### Test 2: Verificar Logs

Después del test anterior:

```bash
# Ver logs de seguridad
cat backend/logs/security.log

# Buscar eventos de rate limiting
grep "Rate limit" backend/logs/security.log
```

**Windows:**
```cmd
type backend\logs\security.log
findstr "Rate limit" backend\logs\security.log
```

---

## Solución Temporal: Redis no Disponible

Si Redis no está instalado y no puedes instalarlo ahora:

**Editar:** `backend/config/settings.py`

**Cambiar:**
```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        # ...
    }
}
```

**Por:**
```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}
```

**NOTA:** Esto es SOLO para desarrollo. En producción DEBES usar Redis.

---

## Checklist de Aplicación

### Endpoints Críticos
- [ ] Login con `@login_rate_limit`
- [ ] Password reset con `@password_reset_rate_limit`
- [ ] Registro con `@registration_rate_limit`

### Endpoints de Operaciones
- [ ] Create con `@sensitive_rate_limit`
- [ ] Update con `@sensitive_rate_limit`
- [ ] Delete con `@sensitive_rate_limit`

### Endpoints de Exportación
- [ ] Exportar a Excel con `@data_export_rate_limit`
- [ ] Exportar a PDF con `@data_export_rate_limit`
- [ ] Generar reportes con `@data_export_rate_limit`

### Serializers
- [ ] Validación de emails con `validate_email()`
- [ ] Sanitización de texto con `sanitize_text()`
- [ ] Sanitización HTML con `sanitize_html()` si aplica

### Verificación
- [ ] Servidor inicia sin errores
- [ ] Rate limiting funciona (test con múltiples requests)
- [ ] Logs se generan en `backend/logs/security.log`

---

## Ejemplo Completo: ViewSet de Usuarios

```python
# apps/users/views.py
from rest_framework import viewsets
from rest_framework.decorators import action
from apps.core.decorators import (
    RateLimitMixin,
    sensitive_rate_limit,
    data_export_rate_limit
)

class UserViewSet(RateLimitMixin, viewsets.ModelViewSet):
    """ViewSet con rate limiting global"""
    rate_limit_key = 'users'
    rate_limit_limit = 50
    rate_limit_period = 60

    queryset = User.objects.all()
    serializer_class = UserSerializer

    # create, update, destroy ya tienen rate limiting global del Mixin

    @action(detail=False, methods=['get'])
    @data_export_rate_limit  # Más restrictivo: 5 por hora
    def export_excel(self, request):
        # Exportar usuarios a Excel
        pass


# apps/users/serializers.py
from rest_framework import serializers
from apps.core.utils import sanitize_text, validate_email

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'bio']

    def validate_email(self, value):
        if not validate_email(value):
            raise serializers.ValidationError("Email inválido")
        return value

    def validate_first_name(self, value):
        return sanitize_text(value)

    def validate_last_name(self, value):
        return sanitize_text(value)

    def validate_bio(self, value):
        # Bio permite más caracteres pero sanitiza
        return sanitize_text(value)
```

---

## Próximos Pasos

1. Aplicar rate limiting a todos los endpoints de autenticación
2. Aplicar sanitización a todos los serializers
3. Probar con múltiples requests
4. Verificar logs de seguridad
5. Preparar configuración para producción (ver `.env.security.example`)

---

## Recursos

- **Documentación Completa:** `backend/SECURITY_IMPLEMENTATION.md`
- **Ejemplos de Código:** `backend/apps/core/views/ratelimit_examples.py`
- **Verificación:** `backend/VERIFICACION_MANUAL.md`
- **Resumen:** `backend/SECURITY_SUMMARY.md`

---

**Tiempo estimado de aplicación:** 30-60 minutos
**Última actualización:** 2025-12-30
