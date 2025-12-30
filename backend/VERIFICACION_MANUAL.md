# Verificación Manual - Implementación de Seguridad

## Checklist de Verificación

### 1. Archivos Creados

Verificar que existan los siguientes archivos:

#### Middleware
- [ ] `backend/apps/core/middleware/security.py`
- [ ] `backend/apps/core/middleware/__init__.py`

#### Decoradores
- [ ] `backend/apps/core/decorators/ratelimit.py`
- [ ] `backend/apps/core/decorators/__init__.py`

#### Utilidades
- [ ] `backend/apps/core/utils/sanitization.py`
- [ ] `backend/apps/core/utils/__init__.py`

#### Vistas
- [ ] `backend/apps/core/views/security.py`
- [ ] `backend/apps/core/views/__init__.py`
- [ ] `backend/apps/core/views/ratelimit_examples.py`

#### Ejemplos
- [ ] `backend/apps/core/serializers/security_example.py`

#### Documentación
- [ ] `backend/SECURITY_IMPLEMENTATION.md`
- [ ] `backend/SECURITY_SUMMARY.md`
- [ ] `backend/.env.security.example`
- [ ] `backend/check_security.py`

### 2. Dependencias en requirements.txt

Verificar que existan estas líneas en `backend/requirements.txt`:

```
django-ratelimit==4.1.0
django-csp==3.8
bleach==6.1.0
```

### 3. Configuración en settings.py

#### INSTALLED_APPS (línea ~21)
Verificar que contenga:
```python
'csp',
```

#### MIDDLEWARE (líneas ~123-139)
Verificar que contenga:
```python
'csp.middleware.CSPMiddleware',
'apps.core.middleware.IPBlockMiddleware',
'apps.core.middleware.SecurityMiddleware',
```

#### Security Headers (líneas ~289-318)
Verificar que existan estas configuraciones:
```python
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
CSP_DEFAULT_SRC = ("'self'",)
# ... etc
```

#### Rate Limiting (líneas ~320-325)
Verificar que existan:
```python
RATELIMIT_ENABLE = True
RATELIMIT_USE_CACHE = 'default'
RATELIMIT_VIEW = 'apps.core.views.ratelimit_error_view'
```

#### CSRF Protection (líneas ~327-333)
Verificar que existan:
```python
CSRF_FAILURE_VIEW = 'apps.core.views.csrf_failure_view'
CSRF_TRUSTED_ORIGINS = ...
```

### 4. Pruebas de Funcionamiento

#### Paso 1: Instalar dependencias
```bash
cd backend
pip install -r requirements.txt
```

**Verificar:** Que se instalen sin errores:
- django-ratelimit
- django-csp
- bleach

#### Paso 2: Ejecutar servidor
```bash
python manage.py runserver
```

**Verificar:** Que inicie sin errores de importación.

#### Paso 3: Probar Rate Limiting (Opcional)

**Opción A: Con curl**
```bash
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/auth/login/ \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}'
done
```

**Resultado esperado:** Error 429 después de 5 intentos.

**Opción B: Con Postman/Thunder Client**
1. Hacer 10 requests POST a un endpoint de login
2. A partir del 6º request debería devolver error 429

#### Paso 4: Verificar Logs

**Crear directorio de logs si no existe:**
```bash
mkdir backend/logs
```

**Verificar que se crean los archivos:**
- `backend/logs/app.log`
- `backend/logs/error.log`
- `backend/logs/security.log`

### 5. Comandos de Verificación Rápida

#### Windows PowerShell
```powershell
# Verificar archivos middleware
Test-Path "backend\apps\core\middleware\security.py"

# Verificar decoradores
Test-Path "backend\apps\core\decorators\ratelimit.py"

# Verificar utils
Test-Path "backend\apps\core\utils\sanitization.py"

# Verificar documentación
Test-Path "backend\SECURITY_IMPLEMENTATION.md"
```

#### Windows CMD
```cmd
dir backend\apps\core\middleware\security.py
dir backend\apps\core\decorators\ratelimit.py
dir backend\apps\core\utils\sanitization.py
dir backend\SECURITY_IMPLEMENTATION.md
```

#### Git Bash / Linux / Mac
```bash
ls -la backend/apps/core/middleware/security.py
ls -la backend/apps/core/decorators/ratelimit.py
ls -la backend/apps/core/utils/sanitization.py
ls -la backend/SECURITY_IMPLEMENTATION.md
```

### 6. Verificación de Imports

**Prueba en Django shell:**
```bash
python manage.py shell
```

```python
# Verificar middleware
from apps.core.middleware import SecurityMiddleware, IPBlockMiddleware
print("✅ Middleware importado correctamente")

# Verificar decoradores
from apps.core.decorators import login_rate_limit, api_rate_limit
print("✅ Decoradores importados correctamente")

# Verificar utils
from apps.core.utils import sanitize_html, validate_sql_input
print("✅ Utils importados correctamente")

# Verificar vistas
from apps.core.views import ratelimit_error_view
print("✅ Vistas importadas correctamente")
```

Si todos los imports funcionan sin errores, la implementación está correcta.

### 7. Errores Comunes y Soluciones

#### Error: "No module named 'csp'"
**Solución:**
```bash
pip install django-csp==3.8
```

#### Error: "No module named 'ratelimit'"
**Solución:**
```bash
pip install django-ratelimit==4.1.0
```

#### Error: "No module named 'bleach'"
**Solución:**
```bash
pip install bleach==6.1.0
```

#### Error: "No module named 'apps.core.middleware'"
**Solución:** Verificar que existe el archivo `__init__.py` en:
- `backend/apps/core/middleware/__init__.py`

#### Error: Redis connection failed
**Solución temporal (desarrollo):**
En `settings.py`, cambiar cache backend a dummy:
```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}
```

**Solución permanente:**
Instalar y ejecutar Redis:
- Windows: https://github.com/microsoftarchive/redis/releases
- Linux/Mac: `sudo apt-get install redis-server` o `brew install redis`

### 8. Resultado Esperado

Si todo está correcto:

✅ Servidor Django inicia sin errores
✅ No hay errores de importación
✅ Middleware está activo
✅ Rate limiting funciona
✅ Logs se crean en backend/logs/

### 9. Para Producción

Antes de desplegar a producción, verificar:

- [ ] DEBUG=False en .env
- [ ] SECRET_KEY único generado
- [ ] ALLOWED_HOSTS configurado con dominio real
- [ ] CORS_ALLOWED_ORIGINS solo incluye dominio de producción
- [ ] SSL/HTTPS habilitado
- [ ] Redis configurado y protegido con contraseña
- [ ] Logs rotan automáticamente
- [ ] Monitoreo de logs configurado

### 10. Contacto y Soporte

Para problemas o preguntas:
1. Revisar `SECURITY_IMPLEMENTATION.md` para documentación completa
2. Revisar logs en `backend/logs/security.log`
3. Verificar ejemplos en `backend/apps/core/views/ratelimit_examples.py`

---

**Última actualización:** 2025-12-30
**Versión:** 1.0
