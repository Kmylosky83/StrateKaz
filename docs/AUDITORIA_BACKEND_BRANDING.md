# Auditoría Completa del Backend - Sección Branding

**Sistema:** StrateKaz - Sistema Integrado de Gestión
**Módulo:** Core - Configuración de Branding
**Fecha:** 2026-01-18
**Versión Backend:** Django 5.0.7 + DRF 3.15.2

---

## 1. MODELO DE BRANDING

### 1.1. Ubicación
- **Archivo:** `c:\Proyectos\StrateKaz\backend\apps\core\models\models_system_modules.py`
- **Líneas:** 428-523
- **Nombre del Modelo:** `BrandingConfig`
- **Tabla en BD:** `core_branding_config`

### 1.2. Campos del Modelo

#### **Campos de Texto**
```python
company_name = models.CharField(max_length=200, default='StrateKaz')
company_short_name = models.CharField(max_length=50, default='GRASHNORTE')
company_slogan = models.CharField(max_length=200, blank=True, null=True)
app_version = models.CharField(max_length=20, default='2.0.0')
```

#### **Campos de Archivos de Imagen (ImageField)**
```python
logo = models.ImageField(
    upload_to='branding/logos/',
    blank=True,
    null=True,
    verbose_name='Logo Principal'
)

logo_white = models.ImageField(
    upload_to='branding/logos/',
    blank=True,
    null=True,
    verbose_name='Logo Blanco (para fondos oscuros)'
)

favicon = models.ImageField(
    upload_to='branding/favicons/',
    blank=True,
    null=True,
    verbose_name='Favicon'
)

login_background = models.ImageField(
    upload_to='branding/backgrounds/',
    blank=True,
    null=True,
    verbose_name='Imagen de Fondo Login',
    help_text='Imagen de fondo para la pagina de login (recomendado: 1920x1080)'
)
```

#### **Campos de Colores (CharField con validación HEX)**
```python
primary_color = models.CharField(
    max_length=7,
    default='#16A34A',  # Verde (tema por defecto)
    verbose_name='Color Primario',
    help_text='Color en formato HEX (ej: #16A34A)'
)

secondary_color = models.CharField(
    max_length=7,
    default='#059669',
    verbose_name='Color Secundario'
)

accent_color = models.CharField(
    max_length=7,
    default='#10B981',
    verbose_name='Color de Acento'
)
```

#### **Campos de Control**
```python
is_active = models.BooleanField(default=True, verbose_name='Activo')
created_at = models.DateTimeField(auto_now_add=True)
updated_at = models.DateTimeField(auto_now=True)
```

### 1.3. Validaciones en el Modelo

#### **Validación de Singleton Activo**
```python
def save(self, *args, **kwargs):
    """
    Garantiza que solo hay una configuración de branding activa.
    Al activar una configuración, desactiva todas las demás.
    """
    if self.is_active:
        BrandingConfig.objects.exclude(pk=self.pk).update(is_active=False)
    super().save(*args, **kwargs)
```

**⚠️ OBSERVACIÓN CRÍTICA:**
- ✅ **BIEN:** Patrón singleton implementado correctamente
- ❌ **FALTA:** No hay validación de formato HEX a nivel de modelo
- ❌ **FALTA:** No hay validación de tamaño/formato de imágenes
- ❌ **FALTA:** No hay validación de tipos MIME permitidos

---

## 2. SERIALIZERS

### 2.1. Ubicación
- **Archivo:** `c:\Proyectos\StrateKaz\backend\apps\core\serializers_config.py`
- **Líneas:** 159-290

### 2.2. BrandingConfigSerializer (Read-Only)

#### **Propósito:** Serialización para lectura (GET)

#### **Campos Computados con URLs Absolutas**
```python
class BrandingConfigSerializer(serializers.ModelSerializer):
    logo = serializers.SerializerMethodField()
    logo_white = serializers.SerializerMethodField()
    favicon = serializers.SerializerMethodField()
    login_background = serializers.SerializerMethodField()

    class Meta:
        model = BrandingConfig
        fields = [
            'id', 'company_name', 'company_short_name', 'company_slogan',
            'logo', 'logo_white', 'favicon', 'login_background',
            'primary_color', 'secondary_color', 'accent_color',
            'app_version', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
```

#### **Método de Construcción de URLs**
```python
def _build_absolute_url(self, file_field):
    """Construye URL absoluta para archivos de media"""
    if not file_field:
        return None
    request = self.context.get('request')
    if request:
        return request.build_absolute_uri(file_field.url)
    return file_field.url
```

**✅ FORTALEZAS:**
- URLs absolutas para archivos (soporta CORS y deployments multi-dominio)
- Manejo de campos nulos correctamente
- SerializerMethodField para transformación de datos

### 2.3. BrandingConfigCreateSerializer

#### **Propósito:** Creación de nuevas configuraciones

```python
class BrandingConfigCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BrandingConfig
        fields = [
            'company_name', 'company_short_name', 'company_slogan',
            'logo', 'logo_white', 'favicon', 'login_background',
            'primary_color', 'secondary_color', 'accent_color',
            'app_version', 'is_active'
        ]
```

#### **Validaciones de Colores HEX**
```python
def validate_primary_color(self, value):
    if value and not value.startswith('#'):
        raise serializers.ValidationError('El color debe estar en formato HEX (#RRGGBB)')
    return value

def validate_secondary_color(self, value):
    if value and not value.startswith('#'):
        raise serializers.ValidationError('El color debe estar en formato HEX (#RRGGBB)')
    return value

def validate_accent_color(self, value):
    if value and not value.startswith('#'):
        raise serializers.ValidationError('El color debe estar en formato HEX (#RRGGBB)')
    return value
```

**⚠️ OBSERVACIONES:**
- ✅ **BIEN:** Validación de formato HEX
- ❌ **LIMITADO:** Solo valida que empiece con `#`, no valida formato completo `#RRGGBB`
- ❌ **FALTA:** Validación de longitud (debe ser 7 caracteres: `#` + 6 hex)
- ❌ **FALTA:** Validación de caracteres válidos (0-9, A-F)

### 2.4. BrandingConfigUpdateSerializer

#### **Propósito:** Actualización de configuraciones existentes

#### **Campos Especiales para Limpieza de Archivos**
```python
class BrandingConfigUpdateSerializer(serializers.ModelSerializer):
    logo_clear = serializers.BooleanField(write_only=True, required=False, default=False)
    logo_white_clear = serializers.BooleanField(write_only=True, required=False, default=False)
    favicon_clear = serializers.BooleanField(write_only=True, required=False, default=False)
    login_background_clear = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = BrandingConfig
        fields = [
            'company_name', 'company_short_name', 'company_slogan',
            'logo', 'logo_white', 'favicon', 'login_background',
            'logo_clear', 'logo_white_clear', 'favicon_clear', 'login_background_clear',
            'primary_color', 'secondary_color', 'accent_color',
            'app_version', 'is_active'
        ]
        extra_kwargs = {
            'logo': {'required': False},
            'logo_white': {'required': False},
            'favicon': {'required': False},
            'login_background': {'required': False},
        }
```

#### **Método de Actualización con Limpieza de Archivos**
```python
def update(self, instance, validated_data):
    logo_clear = validated_data.pop('logo_clear', False)
    logo_white_clear = validated_data.pop('logo_white_clear', False)
    favicon_clear = validated_data.pop('favicon_clear', False)
    login_background_clear = validated_data.pop('login_background_clear', False)

    if logo_clear and instance.logo:
        instance.logo.delete(save=False)
        instance.logo = None

    if logo_white_clear and instance.logo_white:
        instance.logo_white.delete(save=False)
        instance.logo_white = None

    if favicon_clear and instance.favicon:
        instance.favicon.delete(save=False)
        instance.favicon = None

    if login_background_clear and instance.login_background:
        instance.login_background.delete(save=False)
        instance.login_background = None

    return super().update(instance, validated_data)
```

**✅ FORTALEZAS:**
- Patrón `*_clear` para eliminar archivos sin subir nuevos
- Limpieza correcta de archivos del filesystem (`delete(save=False)`)
- `extra_kwargs` para campos opcionales en PATCH

**⚠️ OBSERVACIONES:**
- ❌ **FALTA:** Validación de tamaño máximo de archivos
- ❌ **FALTA:** Validación de tipos MIME (solo imágenes)
- ❌ **FALTA:** Procesamiento de imágenes (resize, optimize)

---

## 3. VIEWSET/API

### 3.1. Ubicación
- **Archivo:** `c:\Proyectos\StrateKaz\backend\apps\core\viewsets_config.py`
- **Líneas:** 553-605
- **Clase:** `BrandingConfigViewSet`

### 3.2. Configuración del ViewSet

```python
class BrandingConfigViewSet(viewsets.ModelViewSet):
    """ViewSet para Configuración de Branding"""

    queryset = BrandingConfig.objects.all()
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'branding'

    granular_action_map = {
        'active': 'can_view',  # Aunque AllowAny sobreescribe esto
    }

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_active']
    ordering = ['-created_at']
```

**✅ CONFIGURACIÓN:**
- ✅ ModelViewSet completo (CRUD)
- ✅ Autenticación requerida
- ✅ RBAC con `GranularActionPermission`
- ✅ Filtrado por `is_active`
- ✅ Ordenamiento por fecha de creación

### 3.3. Selección Dinámica de Serializers

```python
def get_serializer_class(self):
    if self.action == 'create':
        return BrandingConfigCreateSerializer
    elif self.action in ['update', 'partial_update']:
        return BrandingConfigUpdateSerializer
    return BrandingConfigSerializer
```

**✅ FORTALEZAS:**
- Serializers especializados por acción
- Read serializer con URLs absolutas
- Write serializers con validaciones

### 3.4. Override de partial_update (Debugging)

```python
def partial_update(self, request, *args, **kwargs):
    """Override para debugging de errores 400"""
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"[BRANDING DEBUG] Request data: {request.data}")
    logger.info(f"[BRANDING DEBUG] Content-Type: {request.content_type}")

    serializer = self.get_serializer(
        self.get_object(),
        data=request.data,
        partial=True
    )
    if not serializer.is_valid():
        logger.error(f"[BRANDING DEBUG] Validation errors: {serializer.errors}")

    return super().partial_update(request, *args, **kwargs)
```

**⚠️ OBSERVACIONES:**
- ✅ **TEMPORAL:** Útil para debugging de uploads
- ❌ **PRODUCCIÓN:** Debería eliminarse o usar DEBUG flag

### 3.5. Acción Personalizada: `active` (Endpoint Público)

```python
@action(detail=False, methods=['get'], permission_classes=[AllowAny])
def active(self, request):
    """
    GET /api/core/branding/active/
    Retorna la configuración de branding activa (público para login page).
    """
    branding = BrandingConfig.objects.filter(is_active=True).first()
    if not branding:
        return Response(
            {'detail': 'No hay configuración de branding activa'},
            status=status.HTTP_404_NOT_FOUND
        )
    serializer = BrandingConfigSerializer(branding, context={'request': request})
    return Response(serializer.data)
```

**✅ FORTALEZAS:**
- ✅ **AllowAny:** Permite acceso público para la página de login
- ✅ **Singleton:** Retorna la configuración activa
- ✅ **Manejo de errores:** 404 si no existe configuración

**🔒 SEGURIDAD:**
- ✅ **CORRECTO:** Necesario para personalizar login antes de autenticación
- ✅ **DATOS PÚBLICOS:** Solo expone branding (no datos sensibles)

---

## 4. RBAC BACKEND (MUY IMPORTANTE)

### 4.1. Configuración de Permisos

#### **section_code Configurado**
```python
class BrandingConfigViewSet(viewsets.ModelViewSet):
    section_code = 'branding'
    permission_classes = [IsAuthenticated, GranularActionPermission]
```

#### **Clase de Permisos: GranularActionPermission**
- **Archivo:** `c:\Proyectos\StrateKaz\backend\apps\core\permissions.py`
- **Líneas:** 599-678
- **Sistema:** RBAC v4.0 basado en `CargoSectionAccess`

### 4.2. Mapeo de Acciones a Permisos

#### **Mapeo HTTP → Permisos**
```python
# En GranularActionPermission
method_action_map = {
    'GET': 'can_view',
    'OPTIONS': 'can_view',
    'HEAD': 'can_view',
    'POST': 'can_create',
    'PUT': 'can_edit',
    'PATCH': 'can_edit',
    'DELETE': 'can_delete'
}
```

#### **Mapeo Específico para Branding**
```python
granular_action_map = {
    'active': 'can_view',  # GET /branding/active/
}
```

**⚠️ IMPORTANTE:**
- El endpoint `active` tiene `AllowAny`, sobreescribe RBAC
- Esto es correcto para permitir branding en login page

### 4.3. Seed de Permisos RBAC

#### **Archivo:** `c:\Proyectos\StrateKaz\backend\apps\core\management\commands\seed_permisos_rbac.py`
#### **Línea:** 46

```python
{'code': 'branding', 'name': 'Branding', 'acciones': ['view', 'update']}
```

**✅ CONFIGURACIÓN:**
- ✅ Solo `view` y `update` (no `create` ni `delete`)
- ✅ **JUSTIFICACIÓN:** Solo hay 1 configuración activa (singleton)
- ✅ **ACCIONES:**
  - `view` → GET /api/core/branding/
  - `update` → PATCH /api/core/branding/{id}/

### 4.4. Flujo de Autorización RBAC

```
1. Usuario hace request → IsAuthenticated verifica login
2. GranularActionPermission verifica:
   a. Si es superuser → Permitir
   b. Obtener cargo del usuario
   c. Buscar CargoSectionAccess(cargo=cargo, section__code='branding')
   d. Verificar bandera según acción:
      - GET → can_view
      - PATCH → can_edit
3. Si no existe registro o bandera = False → 403 Forbidden
```

**✅ FORTALEZAS:**
- RBAC granular por sección
- Soporte de acciones personalizadas
- Fallback seguro (default deny)

**⚠️ OBSERVACIONES:**
- ❌ **NO HAY** `can_create` ni `can_delete` configurados (correcto para singleton)
- ✅ **ENDPOINT PÚBLICO** `active` correctamente excluido de RBAC

---

## 5. PWA/MANIFEST (Importante)

### 5.1. Estado Actual

#### **❌ NO IMPLEMENTADO**

**Búsqueda realizada:**
- ✅ Archivos `*.py` con `manifest.json`, `PWA`, `service worker`
- ✅ Configuración en `urls.py`
- ❌ **RESULTADO:** No hay endpoint para `manifest.json` dinámico

**Evidencia en `config/urls.py`:**
```python
# Línea 60: Solo configuración de MIME type
mimetypes.add_type('application/manifest+json', '.webmanifest')
```

### 5.2. Capacidades PWA Faltantes

#### **❌ NO EXISTE:**

1. **Endpoint dinámico para manifest.json**
   - No hay vista para generar manifest desde BrandingConfig
   - No hay endpoint `/api/manifest.json` o `/manifest.json`

2. **Generación de iconos PWA**
   - No hay procesamiento de `favicon` para generar iconos PWA
   - No hay generación de iconos en múltiples tamaños (192x192, 512x512)
   - No hay generación de splash screens

3. **Configuración de theme_color y background_color**
   - No hay campos en el modelo para `theme_color` PWA
   - No hay mapeo de `primary_color` → `theme_color` en manifest

4. **Service Worker**
   - No hay endpoint para servir service worker
   - No hay configuración de caching strategies

### 5.3. Implementación Actual de Manifest (Frontend)

**Ubicación probable:** `frontend/public/manifest.json` (estático)

**⚠️ PROBLEMA:**
- El manifest es estático, no se adapta a `BrandingConfig`
- Los colores del tema no se actualizan dinámicamente
- Los iconos no provienen del `favicon` de branding

### 5.4. Recomendaciones para PWA

#### **PRIORIDAD ALTA: Endpoint Dinámico de Manifest**

```python
# Propuesta de implementación
@action(detail=False, methods=['get'], permission_classes=[AllowAny])
def manifest(self, request):
    """
    GET /api/core/branding/manifest/
    Genera manifest.json dinámico desde BrandingConfig activo.
    """
    branding = BrandingConfig.objects.filter(is_active=True).first()
    if not branding:
        return Response({}, status=404)

    manifest = {
        "name": branding.company_name,
        "short_name": branding.company_short_name,
        "description": branding.company_slogan or "",
        "theme_color": branding.primary_color,
        "background_color": "#ffffff",
        "display": "standalone",
        "scope": "/",
        "start_url": "/",
        "icons": [
            {
                "src": request.build_absolute_uri(branding.favicon.url) if branding.favicon else "",
                "sizes": "192x192",
                "type": "image/png"
            },
            # Más tamaños...
        ]
    }
    return Response(manifest, content_type='application/manifest+json')
```

#### **PRIORIDAD MEDIA: Procesamiento de Imágenes**

```python
# Dependencias necesarias
# requirements.txt:
# Pillow==11.1.0  ✅ YA INSTALADO

# Agregar método al modelo BrandingConfig
def generate_pwa_icons(self):
    """Genera iconos PWA en múltiples tamaños desde favicon"""
    if not self.favicon:
        return

    from PIL import Image
    import os

    sizes = [192, 512]
    for size in sizes:
        # Resize y guardar en media/branding/pwa/
        pass
```

---

## 6. ALMACENAMIENTO DE ARCHIVOS

### 6.1. Configuración de Media

#### **Archivo:** `c:\Proyectos\StrateKaz\backend\config\settings.py`
#### **Líneas:** 287-288

```python
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

**✅ CONFIGURACIÓN BÁSICA:**
- `MEDIA_ROOT`: `c:\Proyectos\StrateKaz\backend\media\`
- `MEDIA_URL`: `/media/`

### 6.2. Estructura de Directorios

```
backend/media/branding/
├── backgrounds/     # login_background
├── favicons/        # favicon
└── logos/           # logo, logo_white
```

**✅ VERIFICADO:**
```bash
$ ls -la backend/media/branding/
drwxr-xr-x backgrounds/
drwxr-xr-x favicons/
drwxr-xr-x logos/
```

### 6.3. Upload Paths en el Modelo

```python
logo = models.ImageField(upload_to='branding/logos/')
logo_white = models.ImageField(upload_to='branding/logos/')
favicon = models.ImageField(upload_to='branding/favicons/')
login_background = models.ImageField(upload_to='branding/backgrounds/')
```

**✅ FORTALEZAS:**
- Organización clara por tipo de archivo
- Separación de logos y backgrounds

### 6.4. Servido de Archivos Media

#### **En Desarrollo (DEBUG=True)**
```python
# config/urls.py línea 247
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

#### **En Producción (cPanel)**
```python
# config/urls.py línea 246
if os.environ.get('USE_CPANEL', 'False').lower() == 'true' or settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

**✅ CONFIGURACIÓN:**
- ✅ Desarrollo: Django sirve archivos media
- ✅ Producción cPanel: Django sirve archivos media (Passenger)

### 6.5. Procesamiento de Imágenes

#### **❌ NO IMPLEMENTADO**

**Dependencias:**
- ✅ `Pillow==11.1.0` INSTALADO en `requirements.txt`

**Faltantes:**
1. **Validación de tamaño de archivo**
   - No hay límite de tamaño (puede subir archivos enormes)
   - No hay validación de dimensiones

2. **Validación de tipo MIME**
   - Django solo valida por extensión
   - No hay validación de contenido real del archivo

3. **Optimización de imágenes**
   - No hay resize automático
   - No hay compresión
   - No hay conversión de formatos (WebP para mejor performance)

4. **Generación de thumbnails**
   - No hay versiones pequeñas de logos
   - No hay versiones optimizadas para PWA

### 6.6. Recomendaciones de Procesamiento

#### **PRIORIDAD ALTA: Validaciones de Seguridad**

```python
# En serializers
from django.core.validators import FileExtensionValidator
from PIL import Image

class BrandingConfigCreateSerializer(serializers.ModelSerializer):
    logo = serializers.ImageField(
        validators=[
            FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'svg'])
        ],
        required=False
    )

    def validate_logo(self, value):
        # Validar tamaño
        if value.size > 5 * 1024 * 1024:  # 5MB
            raise serializers.ValidationError('El archivo no debe superar 5MB')

        # Validar dimensiones
        img = Image.open(value)
        if img.width > 2000 or img.height > 2000:
            raise serializers.ValidationError('Dimensiones máximas: 2000x2000')

        return value
```

#### **PRIORIDAD MEDIA: Optimización Automática**

```python
# Signal post_save para optimizar imágenes
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=BrandingConfig)
def optimize_branding_images(sender, instance, **kwargs):
    """Optimiza imágenes al guardar"""
    if instance.logo:
        optimize_image(instance.logo.path, max_width=800)
    if instance.login_background:
        optimize_image(instance.login_background.path, max_width=1920)
```

---

## 7. RUTAS/ENDPOINTS DISPONIBLES

### 7.1. Router Registration

#### **Archivo:** `c:\Proyectos\StrateKaz\backend\apps\core\urls.py`
#### **Línea:** 64

```python
router.register(r'branding', BrandingConfigViewSet, basename='branding')
```

### 7.2. URLs Generadas (ModelViewSet)

#### **Base URL:** `/api/core/branding/`

| Método | Endpoint | Acción | Permiso RBAC | Descripción |
|--------|----------|--------|--------------|-------------|
| `GET` | `/api/core/branding/` | `list` | `can_view` | Lista todas las configuraciones |
| `POST` | `/api/core/branding/` | `create` | `can_create` | Crea nueva configuración |
| `GET` | `/api/core/branding/{id}/` | `retrieve` | `can_view` | Obtiene una configuración |
| `PUT` | `/api/core/branding/{id}/` | `update` | `can_edit` | Actualiza completamente |
| `PATCH` | `/api/core/branding/{id}/` | `partial_update` | `can_edit` | Actualiza parcialmente |
| `DELETE` | `/api/core/branding/{id}/` | `destroy` | `can_delete` | Elimina configuración |

### 7.3. Acciones Personalizadas

| Método | Endpoint | Acción | Permiso | Descripción |
|--------|----------|--------|---------|-------------|
| `GET` | `/api/core/branding/active/` | `active` | `AllowAny` | Obtiene configuración activa (público) |

### 7.4. Filtros Disponibles

```python
filterset_fields = ['is_active']
```

**Ejemplos:**
- `/api/core/branding/?is_active=true` - Solo configuraciones activas
- `/api/core/branding/?is_active=false` - Solo configuraciones inactivas

### 7.5. Ordenamiento

```python
ordering = ['-created_at']
```

**Default:** Más recientes primero

**Ejemplos:**
- `/api/core/branding/?ordering=company_name` - Ordenar por nombre
- `/api/core/branding/?ordering=-updated_at` - Más actualizados primero

---

## 8. RESUMEN DE HALLAZGOS

### ✅ FORTALEZAS

1. **Arquitectura Sólida**
   - ✅ Modelo bien diseñado con singleton activo
   - ✅ Serializers especializados por acción
   - ✅ ViewSet completo con CRUD

2. **RBAC Robusto**
   - ✅ `GranularActionPermission` correctamente implementado
   - ✅ `section_code = 'branding'` configurado
   - ✅ Endpoint público `active` para login page
   - ✅ Permisos granulares `view` y `update`

3. **Manejo de Archivos**
   - ✅ ImageField para todos los archivos visuales
   - ✅ URLs absolutas en serializers
   - ✅ Patrón `*_clear` para eliminar archivos
   - ✅ Organización clara de directorios media

4. **API Design**
   - ✅ RESTful endpoints
   - ✅ Filtrado por `is_active`
   - ✅ Paginación configurada
   - ✅ Documentación con DRF Spectacular

### ❌ BRECHAS CRÍTICAS

#### **P0 - Seguridad**

1. **Validación de Colores HEX Débil**
   - **Actual:** Solo verifica que empiece con `#`
   - **Riesgo:** Puede aceptar `#INVALID` o `#12` (formato inválido)
   - **Fix:** Implementar regex completo: `^#[0-9A-Fa-f]{6}$`

2. **Sin Validación de Archivos**
   - **Riesgo:** Upload de archivos maliciosos
   - **Faltantes:**
     - Validación de tamaño de archivo
     - Validación de tipo MIME real (no solo extensión)
     - Validación de dimensiones de imagen

#### **P1 - Funcionalidad Faltante**

3. **PWA/Manifest NO Implementado**
   - ❌ No hay endpoint `/manifest.json` dinámico
   - ❌ No se genera desde `BrandingConfig`
   - ❌ No hay generación de iconos PWA
   - ❌ No hay mapeo de colores a `theme_color`

4. **Sin Procesamiento de Imágenes**
   - ❌ No hay resize/optimización automática
   - ❌ No hay generación de thumbnails
   - ❌ No hay conversión a WebP
   - ❌ No hay generación de iconos en múltiples tamaños

#### **P2 - Mejoras Operacionales**

5. **Logging de Debug en Producción**
   - `partial_update` tiene logging hardcoded
   - **Fix:** Usar `if settings.DEBUG:` o eliminar

6. **Sin Versionamiento de Assets**
   - Los archivos media no tienen versionamiento
   - Cache puede servir versiones antiguas
   - **Fix:** Implementar hash en nombres de archivo

---

## 9. PLAN DE ACCIÓN RECOMENDADO

### Fase 1: Seguridad (P0) - 2 días

#### **1.1. Validación de Colores HEX**
```python
# En serializers_config.py
import re

def validate_hex_color(self, value):
    if value and not re.match(r'^#[0-9A-Fa-f]{6}$', value):
        raise serializers.ValidationError(
            'Color inválido. Formato esperado: #RRGGBB (ej: #16A34A)'
        )
    return value
```

#### **1.2. Validación de Archivos**
```python
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError
from PIL import Image

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_IMAGE_DIMENSION = 2000

def validate_image_file(file):
    # Tamaño
    if file.size > MAX_FILE_SIZE:
        raise ValidationError(f'Archivo muy grande. Máximo: 5MB')

    # Tipo MIME
    try:
        img = Image.open(file)
        img.verify()
    except Exception:
        raise ValidationError('Archivo no es una imagen válida')

    # Dimensiones
    if img.width > MAX_IMAGE_DIMENSION or img.height > MAX_IMAGE_DIMENSION:
        raise ValidationError(f'Dimensiones máximas: {MAX_IMAGE_DIMENSION}x{MAX_IMAGE_DIMENSION}')
```

### Fase 2: PWA/Manifest (P1) - 3 días

#### **2.1. Endpoint de Manifest Dinámico**
```python
@action(detail=False, methods=['get'], permission_classes=[AllowAny])
def manifest(self, request):
    """GET /api/core/branding/manifest/"""
    branding = BrandingConfig.objects.filter(is_active=True).first()
    if not branding:
        return Response({'error': 'No branding config'}, status=404)

    manifest = {
        "name": branding.company_name,
        "short_name": branding.company_short_name,
        "description": branding.company_slogan or "",
        "theme_color": branding.primary_color,
        "background_color": "#ffffff",
        "display": "standalone",
        "scope": "/",
        "start_url": "/",
        "icons": self._generate_pwa_icons(branding, request)
    }

    return Response(manifest, content_type='application/manifest+json')
```

#### **2.2. Generación de Iconos PWA**
```python
def _generate_pwa_icons(self, branding, request):
    """Genera iconos PWA en múltiples tamaños"""
    if not branding.favicon:
        return []

    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    icons = []

    for size in sizes:
        icon_path = self._resize_icon(branding.favicon, size)
        if icon_path:
            icons.append({
                "src": request.build_absolute_uri(icon_path),
                "sizes": f"{size}x{size}",
                "type": "image/png"
            })

    return icons
```

### Fase 3: Procesamiento de Imágenes (P1) - 2 días

#### **3.1. Signal para Optimización**
```python
from django.db.models.signals import post_save
from django.dispatch import receiver
from PIL import Image
import os

@receiver(post_save, sender=BrandingConfig)
def optimize_branding_images(sender, instance, created, **kwargs):
    """Optimiza imágenes automáticamente al guardar"""
    if instance.logo:
        optimize_image(instance.logo.path, max_width=800)

    if instance.login_background:
        optimize_image(instance.login_background.path, max_width=1920)

    if instance.favicon:
        generate_pwa_icons(instance.favicon.path)

def optimize_image(image_path, max_width=None):
    """Optimiza y redimensiona imagen"""
    img = Image.open(image_path)

    if max_width and img.width > max_width:
        ratio = max_width / img.width
        new_size = (max_width, int(img.height * ratio))
        img = img.resize(new_size, Image.LANCZOS)

    # Guardar optimizado
    img.save(image_path, optimize=True, quality=85)
```

### Fase 4: Mejoras Operacionales (P2) - 1 día

#### **4.1. Remover Logging de Debug**
```python
def partial_update(self, request, *args, **kwargs):
    if settings.DEBUG:
        import logging
        logger = logging.getLogger(__name__)
        logger.debug(f"[BRANDING] Request: {request.data}")

    return super().partial_update(request, *args, **kwargs)
```

#### **4.2. Versionamiento de Assets**
```python
import hashlib
from django.utils.deconstruct import deconstructible

@deconstructible
class BrandingUploadTo:
    def __init__(self, path):
        self.path = path

    def __call__(self, instance, filename):
        ext = filename.split('.')[-1]
        hash_name = hashlib.md5(filename.encode()).hexdigest()
        return f'{self.path}{hash_name}.{ext}'

# En el modelo
logo = models.ImageField(upload_to=BrandingUploadTo('branding/logos/'))
```

---

## 10. CHECKLIST DE VERIFICACIÓN

### Modelo
- ✅ Campos de texto configurados correctamente
- ✅ ImageField para archivos visuales
- ✅ Validación de singleton activo en `save()`
- ❌ Sin validación de colores HEX en modelo
- ❌ Sin validación de tamaño/formato de imágenes

### Serializers
- ✅ Serializer de lectura con URLs absolutas
- ✅ Serializers especializados (Create/Update)
- ✅ Validación básica de colores HEX
- ✅ Patrón `*_clear` para eliminar archivos
- ❌ Validación HEX débil (solo verifica `#`)
- ❌ Sin validación de tamaño de archivos
- ❌ Sin validación de tipo MIME

### ViewSet/API
- ✅ ModelViewSet completo (CRUD)
- ✅ Acción personalizada `active` (público)
- ✅ Filtrado por `is_active`
- ✅ Ordenamiento configurado
- ❌ Logging de debug en producción

### RBAC
- ✅ `GranularActionPermission` implementado
- ✅ `section_code = 'branding'` configurado
- ✅ Endpoint público `active` con `AllowAny`
- ✅ Seed de permisos `view` y `update`
- ✅ No incluye `create`/`delete` (correcto para singleton)

### PWA/Manifest
- ❌ No hay endpoint de manifest dinámico
- ❌ No hay generación de iconos PWA
- ❌ No hay mapeo de colores a theme_color
- ❌ No hay procesamiento de favicon

### Almacenamiento
- ✅ MEDIA_ROOT y MEDIA_URL configurados
- ✅ Estructura de directorios organizada
- ✅ Servido en desarrollo y producción
- ✅ Pillow instalado
- ❌ Sin optimización de imágenes
- ❌ Sin generación de thumbnails
- ❌ Sin versionamiento de assets

---

## 11. CONCLUSIONES

### Estado General: **FUNCIONAL CON BRECHAS**

El backend de Branding está **funcionalmente completo** para operación básica:
- ✅ CRUD completo
- ✅ RBAC configurado correctamente
- ✅ Endpoint público para login page
- ✅ Manejo de archivos básico

Sin embargo, tiene **brechas importantes**:
- ❌ **Seguridad:** Validaciones de archivos y colores débiles
- ❌ **PWA:** No implementado (crítico para apps modernas)
- ❌ **Performance:** Sin optimización de imágenes
- ❌ **UX:** Sin generación automática de assets PWA

### Prioridades de Mejora

1. **URGENTE (P0):** Validaciones de seguridad (2 días)
2. **ALTA (P1):** PWA/Manifest (3 días)
3. **ALTA (P1):** Procesamiento de imágenes (2 días)
4. **MEDIA (P2):** Mejoras operacionales (1 día)

**Esfuerzo total estimado:** 8 días de desarrollo

---

## 12. ANEXOS

### A. Archivos Auditados

```
backend/apps/core/
├── models/models_system_modules.py (líneas 428-523)
├── serializers_config.py (líneas 159-290)
├── viewsets_config.py (líneas 553-605)
├── permissions.py (líneas 599-678)
├── urls.py (línea 64)
├── admin.py (líneas 525-532)
└── management/commands/
    └── seed_permisos_rbac.py (línea 46)

backend/config/
├── settings.py (líneas 287-288)
└── urls.py (líneas 59-60, 247)

backend/media/branding/
├── backgrounds/
├── favicons/
└── logos/
```

### B. Migraciones Relacionadas

```
backend/apps/core/migrations/
├── 0001_initial.py (creación de BrandingConfig)
└── 0012_alter_brandingconfig_options_*.py (ajustes)
```

### C. Dependencias

```
# requirements.txt
Pillow==11.1.0  ✅ Instalado
djangorestframework==3.15.2  ✅ Instalado
django-filter==24.3  ✅ Instalado
```

---

**Auditoría realizada por:** Claude Sonnet 4.5
**Fecha:** 2026-01-18
**Versión del documento:** 1.0
