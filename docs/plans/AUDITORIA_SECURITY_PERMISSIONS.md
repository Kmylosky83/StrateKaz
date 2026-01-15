# AUDITORÍA SECURITY & PERMISSIONS - StrateKaz

**Fecha:** 15 de enero de 2026
**Agente:** Security & Permissions Specialist (Agente 5)
**Versión:** 1.0

---

## RESUMEN EJECUTIVO

| Área | Estado | Riesgo |
|------|--------|--------|
| **Autenticación JWT** | Implementado con mejoras pendientes | MEDIO |
| **Sistema RBAC** | Robusto pero inconsistente | MEDIO-ALTO |
| **Validación de Entrada** | Adecuada con gaps | BAJO-MEDIO |
| **Protección de Ataques** | Excelente | BAJO |
| **Configuración de Seguridad** | Production-ready | BAJO |

**Vulnerabilidades Detectadas:**
- Críticas: 3
- Altas: 7
- Medias: 5
- Bajas: 3

---

## A. AUTENTICACIÓN

### A.1 Sistema JWT

| Aspecto | Valor | Estado |
|---------|-------|--------|
| **Librería** | djangorestframework-simplejwt v5.3.0 | OK |
| **Algoritmo** | HS256 (HMAC SHA-256) | OK |
| **ACCESS_TOKEN_LIFETIME** | 60 minutos (configurable) | OK |
| **REFRESH_TOKEN_LIFETIME** | 24 horas (configurable) | OK |
| **ROTATE_REFRESH_TOKENS** | True | BIEN |
| **BLACKLIST_AFTER_ROTATION** | True | BIEN |
| **Token Blacklist App** | Instalada | BIEN |

### A.2 Endpoints de Autenticación

```
POST /api/auth/login/     → RateLimitedTokenObtainPairView (5 req/min)
POST /api/auth/refresh/   → RateLimitedTokenRefreshView (100 req/min)
POST /api/core/users/{id}/change_password/ → Cambio de contraseña
GET  /api/core/users/me/  → Información del usuario actual
```

### A.3 SECRET_KEY

**Ubicación:** `backend/config/settings.py:10`

```python
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-me-in-production')
```

| Aspecto | Estado |
|---------|--------|
| Variable de entorno | SI |
| Default inseguro en código | SI - VULNERABILIDAD |
| Validación requerida en prod | NO - VULNERABILIDAD |

### A.4 Tokens en Headers

```python
AUTH_HEADER_TYPES = ('Bearer',)
# Uso: Authorization: Bearer <token>
```

**Estado:** CORRECTO - No usa query params

---

## B. PERMISOS

### B.1 Modelo de Permisos (RBAC v4.0)

**Arquitectura RBAC Híbrida:**

```
Usuario
├── Cargo (posición organizacional)
│   ├── CargoPermiso → Permiso
│   └── CargoSectionAccess → Acceso CRUD por sección
├── Roles Directos (UserRole → Role)
├── Roles Adicionales (COPASST, Brigadista, Auditor)
└── Grupos (Group → Role)
```

**Jerarquía de Verificación:**
1. Superusuario → Todos los permisos
2. Cargo → Permisos del cargo + CargoSectionAccess
3. Roles Adicionales → Permisos transversales
4. Roles Directos → Permisos asignados
5. Grupos → Permisos de grupo

### B.2 Modelos Principales

| Modelo | Ubicación | Función |
|--------|-----------|---------|
| `User` | core/models.py:522 | Usuario extendido con cargo, sede |
| `Cargo` | core/models.py | Posición con nivel jerárquico (0-3) |
| `Role` | core/models.py | Rol funcional |
| `RolAdicional` | core/models_rbac_adicional.py | Roles legales/sistema |
| `Permiso` | core/models.py | Permisos del sistema |
| `CargoSectionAccess` | core/models.py:3134 | Acceso CRUD por sección |
| `GranularActionPermission` | core/permissions.py | Control CRUD dinámico |

### B.3 Niveles Jerárquicos de Cargo

```
Nivel 0 = Operativo
Nivel 1 = Supervisión
Nivel 2 = Coordinación
Nivel 3 = Dirección
```

### B.4 Clases de Permisos Implementadas

| Clase | Uso |
|-------|-----|
| `IsAuthenticated` | Autenticación básica |
| `IsActiveUser` | Usuario activo y no eliminado |
| `IsOwnerOrAdmin` | Propietario o administrador |
| `CanManageUsers` | Gestión de usuarios (nivel 2+) |
| `IsSuperAdmin` | Solo superadministrador |
| `RequirePermission` | Permiso específico |
| `RequireSectionAccess` | Acceso a sección |
| `RequireCRUDPermission` | Permisos CRUD dinámicos |
| `GranularActionPermission` | Acciones granulares |

### B.5 Endpoints CON Protección Adecuada

| Endpoint | Protección |
|----------|-----------|
| `POST /api/core/users/` | GranularActionPermission |
| `DELETE /api/core/users/{id}/` | GranularActionPermission |
| `POST /api/core/roles/` | IsSuperAdmin |
| `PUT /api/core/cargos/{id}/` | CanManageCargos |

### B.6 Endpoints SIN Protección Adecuada

**VULNERABILIDAD ALTA - Solo usan `IsAuthenticated`:**

| Módulo | Endpoints Afectados |
|--------|---------------------|
| **Analytics** | PlanAccionKPIViewSet, ActividadPlanKPIViewSet, SeguimientoPlanKPIViewSet, ValorKPIViewSet, AlertaKPIViewSet |
| **HSEQ** | AccidentalidadViewSet, InvestigacionesViewSet |
| **Supply Chain** | ProveedoresViewSet, RequisicionesViewSet |

**Impacto:** Todo usuario autenticado puede CRUD completo sin validación de cargo/sección.

### B.7 Permisos por Tenant

| Aspecto | Estado |
|---------|--------|
| Modelo Tenant/Empresa | NO EXISTE |
| Filtrado por empresa en queries | NO |
| Middleware de tenant | NO |
| Multi-tenancy | NO IMPLEMENTADO |

**Nota:** Sistema actual es single-tenant (una empresa por instancia).

---

## C. VALIDACIÓN

### C.1 Validación de Entrada

**Serializers con Validaciones Custom:**

| Serializer | Validaciones |
|------------|--------------|
| `UserCreateSerializer` | username, email, document_number, password |
| `ChangePasswordSerializer` | old_password, new_password, confirm |
| `DetalleRequisicionSerializer` | cantidad > 0, precio >= 0 |
| `DetalleOrdenCompraSerializer` | cantidad > 0, precio > 0 |

**Cobertura Estimada:** ~60% de serializers con validación explícita

### C.2 Campos Sin Validar

| Modelo | Campo | Problema |
|--------|-------|----------|
| CorporateIdentity | mission, vision | TextField sin max_length |
| Cargo | description, objetivo_cargo | TextField sin límites |
| Alcance* | Múltiples campos | Sin validación de tamaño |

### C.3 Protección contra Ataques

| Ataque | Estado | Detalle |
|--------|--------|---------|
| **SQL Injection** | PROTEGIDO | No hay raw(), extra(), RawSQL |
| **XSS** | PROTEGIDO | React escapa automáticamente |
| **CSRF** | HABILITADO | CsrfViewMiddleware activo |
| **Command Injection** | PROTEGIDO | No hay subprocess/os.system/eval |

### C.4 Middleware de Seguridad

**Archivo:** `backend/apps/core/middleware/security.py`

```python
class SecurityMiddleware:
    # Detección de SQL Injection patterns
    SQL_INJECTION_PATTERNS = [
        r"(\bunion\b.*\bselect\b)",
        r"(\bor\b.*=.*)",
        r"(--)",
        # ...
    ]

    # Detección de XSS patterns
    XSS_PATTERNS = [
        r"<script[^>]*>.*?</script>",
        r"javascript:",
        r"onerror\s*=",
    ]

    # Rate limiting: 200 req/min por IP
    # Bloqueo: 10 eventos de seguridad → 1 hora ban
```

### C.5 Upload de Archivos

| Aspecto | Estado | Problema |
|---------|--------|----------|
| Validación MIME | NO | Sin FileExtensionValidator |
| Límite de tamaño | NO | Sin DATA_UPLOAD_MAX_MEMORY_SIZE |
| Ubicación | OK | media/ fuera de webroot |
| Sanitización nombre | OK | Usa modelo |

---

## D. CONFIGURACIÓN DE SEGURIDAD

### D.1 Headers de Seguridad (Producción)

```python
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000  # 1 año
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
```

**Estado:** EXCELENTE - Cumple OWASP

### D.2 CORS

```python
# Desarrollo
CORS_ALLOW_ALL_ORIGINS = True  # RIESGO en dev

# Producción
CORS_ALLOWED_ORIGINS = ['lista explícita']
CORS_ALLOW_CREDENTIALS = True
```

### D.3 CSP (Content Security Policy)

```python
# Desarrollo: unsafe-inline, unsafe-eval permitidos
# Producción: unsafe-eval removido
```

### D.4 Rate Limiting

| Endpoint | Límite |
|----------|--------|
| Login | 5 req/min |
| Refresh | 100 req/min |
| API General | 200 req/min por IP |

---

## E. VULNERABILIDADES DETECTADAS

### CRÍTICAS

| # | Vulnerabilidad | Ubicación | Impacto |
|---|----------------|-----------|---------|
| 1 | **SECRET_KEY con default inseguro** | settings.py:10 | Si no se configura, tokens pueden ser forjados |
| 2 | **Información sensible en JWT payload** | serializers.py:486-499 | Datos personales legibles en base64 |
| 3 | **Sin endpoint logout** | urls.py | Usuario no puede revocar tokens |

### ALTAS

| # | Vulnerabilidad | Ubicación | Impacto |
|---|----------------|-----------|---------|
| 4 | Endpoints Analytics sin validación RBAC | analytics/views.py | CRUD completo para cualquier usuario |
| 5 | Endpoints HSEQ sin validación RBAC | hseq/views.py | Acceso a datos sensibles SST |
| 6 | Sin límite de sesiones concurrentes | auth_views.py | N tokens activos simultáneos |
| 7 | CORS permisivo en desarrollo | settings.py:382 | Cualquier origen en dev |
| 8 | CSRF_COOKIE_HTTPONLY = False | settings.py:469 | XSS puede leer CSRF token |
| 9 | Sin validación de archivos | firma_digital/models.py | Sin MIME ni tamaño |
| 10 | Credenciales en .env rastreados | .env files | 6 archivos con contraseñas |

### MEDIAS

| # | Vulnerabilidad | Ubicación | Impacto |
|---|----------------|-----------|---------|
| 11 | Algoritmo HS256 (simétrico) | settings.py:308 | Menos seguro para sistemas distribuidos |
| 12 | Sin MFA/2FA | Todo el sistema | Solo username + password |
| 13 | Políticas de contraseña básicas | settings.py:266 | No requiere mayúsculas/especiales |
| 14 | Rate limit solo por IP | decorators/ratelimit.py | Ataques distribuidos evaden |
| 15 | Campos TextField sin max_length | Múltiples modelos | DoS de almacenamiento |

### BAJAS

| # | Vulnerabilidad | Ubicación | Impacto |
|---|----------------|-----------|---------|
| 16 | Sin histórico de contraseñas | User model | Reutilización de contraseñas |
| 17 | Stack traces en errores | views_export.py | Información de estructura |
| 18 | UPDATE_LAST_LOGIN activo | settings.py:307 | Overhead en DB |

---

## F. MATRIZ DE RIESGO

| Riesgo | Severidad | Probabilidad | Impacto | Prioridad |
|--------|-----------|--------------|---------|-----------|
| Endpoints sin RBAC | ALTA | ALTA | Acceso no autorizado | P0 |
| SECRET_KEY default | CRÍTICA | BAJA | Forja de tokens | P0 |
| Sin logout | ALTA | ALTA | Tokens no revocables | P0 |
| Info en JWT | CRÍTICA | ALTA | Divulgación de datos | P1 |
| Sin MFA | MEDIA | MEDIA | Credential stuffing | P2 |
| Archivos sin validar | ALTA | MEDIA | Upload malicioso | P1 |

---

## G. RECOMENDACIONES

### P0 - ANTES DE PRODUCCIÓN

1. **Implementar Endpoint Logout**
```python
# urls.py
path('api/auth/logout/', LogoutView.as_view(), name='token_logout'),

# views.py
class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=205)
        except Exception:
            return Response(status=400)
```

2. **Reducir Payload JWT**
```python
# Solo incluir:
token['user_id'] = user.id
token['exp'] = expiration
# Datos adicionales via /api/core/users/me/
```

3. **Validar SECRET_KEY Requerido**
```python
SECRET_KEY = config('SECRET_KEY')  # Sin default, excepción si no existe
```

4. **Agregar GranularActionPermission a Todos los ViewSets**
```python
class KPIViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'analytics_kpi'
```

### P1 - CORTO PLAZO (30 días)

5. **Validación de Archivos**
```python
from django.core.validators import FileExtensionValidator

archivo_pdf = models.FileField(
    validators=[FileExtensionValidator(allowed_extensions=['pdf'])],
)

# settings.py
DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
```

6. **Implementar MFA para Admins**
```python
# Usar django-two-factor-auth o pyotp
# Obligatorio para nivel 2+ (Coordinación/Dirección)
```

7. **Límite de Sesiones Concurrentes**
```python
# Máximo 3-5 sesiones por usuario
# Invalidar sesión más antigua en nuevo login
```

### P2 - MEDIANO PLAZO (60-90 días)

8. **Fortalecer Políticas de Contraseña**
```python
AUTH_PASSWORD_VALIDATORS = [
    # Agregar:
    {'NAME': 'custom.UppercaseValidator'},
    {'NAME': 'custom.SpecialCharValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
     'OPTIONS': {'min_length': 12}},
]
```

9. **Rate Limiting por Usuario + IP**
```python
@ratelimit(key='user_or_ip', rate='5/m')
def login_view(request):
    pass
```

10. **Auditoría de Autenticación**
```python
class AuthenticationLog(models.Model):
    user = models.ForeignKey(User, null=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    event_type = models.CharField()  # LOGIN, LOGOUT, FAILED, PASSWORD_CHANGE
    timestamp = models.DateTimeField(auto_now_add=True)
```

---

## H. CHECKLIST DE SEGURIDAD

### Autenticación
- [ ] Endpoint logout implementado
- [ ] SECRET_KEY validado como requerido
- [ ] Payload JWT reducido
- [ ] MFA para usuarios críticos
- [ ] Límite de sesiones concurrentes

### Permisos
- [ ] GranularActionPermission en todos los ViewSets
- [ ] Validación de sección en Analytics
- [ ] Validación de sección en HSEQ
- [ ] Validación de sección en Supply Chain
- [ ] IsOwnerOrAdmin en endpoints de usuario

### Validación
- [ ] FileExtensionValidator en FileFields
- [ ] Límite de tamaño de upload
- [ ] max_length en TextFields críticos
- [ ] Stack traces genéricos en producción

### Configuración
- [ ] CORS explícito incluso en desarrollo
- [ ] CSRF_COOKIE_HTTPONLY = True
- [ ] Rate limiting por usuario + IP
- [ ] Auditoría de eventos de autenticación

---

## I. ARCHIVOS CLAVE REVISADOS

| Archivo | Líneas | Contenido |
|---------|--------|-----------|
| backend/config/settings.py | 720+ | Configuración de seguridad |
| backend/apps/core/permissions.py | 850+ | Clases de permisos |
| backend/apps/core/models.py | 3245+ | Modelos User, Cargo, RBAC |
| backend/apps/core/serializers.py | 550+ | Validaciones de entrada |
| backend/apps/core/middleware/security.py | 200+ | Middleware de seguridad |
| backend/apps/core/views/auth_views.py | 150+ | Vistas de autenticación |

---

## J. CONCLUSIÓN

El sistema de seguridad de StrateKaz tiene una **base sólida** con:
- JWT bien configurado con rotación y blacklist
- RBAC granular con CargoSectionAccess
- Middleware de detección de SQL Injection y XSS
- Headers de seguridad production-ready

Sin embargo, presenta **vulnerabilidades críticas** que deben remediarse antes de producción:
1. Endpoints sin validación de permisos RBAC
2. Sin endpoint logout para revocación de tokens
3. Información sensible en payload JWT
4. Credenciales expuestas en archivos .env

**Riesgo General:** MEDIO-ALTO (remediable con las correcciones indicadas)

**Tiempo Estimado de Remediación:**
- P0 (Críticos): 1-2 semanas
- P1 (Altos): 2-4 semanas
- P2 (Medios): 4-8 semanas

---

*Reporte generado por Security & Permissions Specialist - Auditoría StrateKaz*
