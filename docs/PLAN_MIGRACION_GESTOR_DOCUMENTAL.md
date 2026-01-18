# Plan de Migración: Gestor Documental N3 → N1

**Fecha:** 2026-01-17
**Última Actualización:** 2026-01-17
**Módulo:** Sistema Documental
**Origen:** `apps/hseq_management/sistema_documental/` (N3 - HSEQ Management)
**Destino:** `apps/gestion_estrategica/gestion_documental/` (N1 - Gestión Estratégica)
**Razón:** El gestor documental es transversal a toda la organización, no específico de HSEQ

---

## Estado de Prerrequisitos

### FASE 0.3 - Consolidar Sistemas de Firma ✅ COMPLETADA

| Commit | Descripción | Estado |
|--------|-------------|--------|
| `e3d4bd8` | feat(workflow): Complete firma_digital app setup (Fase 0.3.6) | ✅ |
| `1e9d050` | refactor(firma): Complete elimination of legacy signature models (Fase 0.3.5) | ✅ |
| `73a3929` | refactor(firma): Eliminate legacy signature system (Fase 0.3.4) | ✅ |

**Sistema Unificado de Firmas Digitales:**
- ✅ `FirmaDigital` centralizado en `apps/workflow_engine/firma_digital/`
- ✅ GenericForeignKey para firmar cualquier modelo
- ✅ API REST: `/api/workflows/firma-digital/`
- ✅ Modelos: `FirmaDigital`, `ConfiguracionFlujoFirma`, `DelegacionFirma`, `AlertaRevision`, `HistorialVersion`

**Migración Completada (2026-01-17):**

- ✅ Módulo migrado a `apps/gestion_estrategica/gestion_documental/`
- ✅ FirmaDocumento eliminado (usa FirmaDigital de workflow_engine)
- ✅ Migraciones creadas
- ✅ URLs actualizadas
- ✅ settings.py actualizado
- ✅ Módulo antiguo eliminado de HSEQ

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Inventario de Archivos](#inventario-de-archivos)
3. [Análisis de Dependencias](#análisis-de-dependencias)
4. [Migración de Base de Datos](#migración-de-base-de-datos)
5. [Actualización de Imports Backend](#actualización-de-imports-backend)
6. [Actualización de URLs API](#actualización-de-urls-api)
7. [Migración Frontend](#migración-frontend)
8. [Eliminación de FirmaDocumento](#eliminación-de-firmadocumento)
9. [Plan de Ejecución Paso a Paso](#plan-de-ejecución-paso-a-paso)
10. [Validación y Testing](#validación-y-testing)

---

## 1. Resumen Ejecutivo

### Alcance de la Migración

**Modelos a Mover:**
- ✅ `TipoDocumento` - Catálogo de tipos de documentos
- ✅ `PlantillaDocumento` - Plantillas base con estructura
- ✅ `Documento` - Documentos del sistema con versionamiento
- ✅ `VersionDocumento` - Historial de versiones
- ✅ `CampoFormulario` - Form builder dinámico
- ✅ `ControlDocumental` - Control de distribución y obsolescencia
- ❌ `FirmaDocumento` - **NO SE MUEVE** (se eliminará, usar `FirmaDigital` de workflow_engine)

**Impacto:**
- **Backend:** 8 archivos a mover + 1 integración a actualizar
- **Frontend:** 4 archivos a actualizar (tipos, hooks, API, páginas)
- **Base de Datos:** 6 tablas a renombrar con migración de datos
- **Integraciones:** 1 servicio en módulo Identidad a actualizar

---

## 2. Inventario de Archivos

### 2.1 Backend - Archivos a Mover

```
backend/apps/hseq_management/sistema_documental/
├── __init__.py                    → apps/gestion_estrategica/gestion_documental/__init__.py
├── admin.py                       → apps/gestion_estrategica/gestion_documental/admin.py
├── apps.py                        → apps/gestion_estrategica/gestion_documental/apps.py
├── models.py                      → apps/gestion_estrategica/gestion_documental/models.py
├── serializers.py                 → apps/gestion_estrategica/gestion_documental/serializers.py
├── urls.py                        → apps/gestion_estrategica/gestion_documental/urls.py
├── views.py                       → apps/gestion_estrategica/gestion_documental/views.py
└── tests/
    └── __init__.py                → apps/gestion_estrategica/gestion_documental/tests/__init__.py
```

**Total archivos backend:** 8 archivos

### 2.2 Migraciones de Base de Datos

```
backend/apps/hseq_management/sistema_documental/migrations/
└── 0001_initial.py                → REFERENCIA para nueva migración en gestion_documental
```

**Nueva migración en:** `apps/gestion_estrategica/gestion_documental/migrations/0001_migrate_from_hseq.py`

### 2.3 Frontend - Archivos a Actualizar

```
frontend/src/features/hseq/
├── api/sistemaDocumentalApi.ts              → features/gestion-estrategica/api/gestionDocumentalApi.ts
├── hooks/useSistemaDocumental.ts            → features/gestion-estrategica/hooks/useGestionDocumental.ts
├── types/sistema-documental.types.ts        → features/gestion-estrategica/types/gestion-documental.types.ts
└── pages/SistemaDocumentalPage.tsx          → features/gestion-estrategica/pages/GestionDocumentalPage.tsx
```

**Total archivos frontend:** 4 archivos

### 2.4 Integraciones a Actualizar

**Backend:**
```
backend/apps/gestion_estrategica/identidad/services.py
- Línea 39: apps.get_model('sistema_documental', 'Documento')
  → apps.get_model('gestion_documental', 'Documento')
- Línea 671: from apps.gestion_estrategica.identidad.models import PoliticaEspecifica
  → Actualizar imports si es necesario
```

**URLs Principales:**
```
backend/apps/hseq_management/urls.py
- path('sistema-documental/', include('apps.hseq_management.sistema_documental.urls'))
  → ELIMINAR

backend/apps/gestion_estrategica/urls.py
- path('gestion-documental/', include('apps.gestion_estrategica.gestion_documental.urls'))
  → AGREGAR
```

---

## 3. Análisis de Dependencias

### 3.1 Dependencias Entrantes (Quién usa el módulo)

#### Backend Imports

1. **Identidad Corporativa Service**
   - Archivo: `apps/gestion_estrategica/identidad/services.py`
   - Línea: 39, 671
   - Uso: Integración para envío de políticas firmadas
   - Acción: Actualizar imports

2. **URLs de HSEQ Management**
   - Archivo: `apps/hseq_management/urls.py`
   - Uso: Incluye rutas del sistema documental
   - Acción: Eliminar inclusión

#### Frontend Imports

1. **Rutas de navegación**
   - Posiblemente en menús de HSEQ
   - Acción: Mover a menú de Gestión Estratégica

2. **Links directos en otros módulos**
   - Buscar referencias a `/hseq/sistema-documental`
   - Acción: Actualizar a `/gestion-estrategica/gestion-documental`

### 3.2 Dependencias Salientes (Qué usa el módulo)

#### Modelos Django Core
- `settings.AUTH_USER_MODEL` - ✅ Sin cambios
- `django.db.models` - ✅ Sin cambios

#### Otros módulos
- **NINGUNA DEPENDENCIA** con otros módulos de HSEQ
- **Integración con Identidad** (solo callback, no FK)

### 3.3 Tabla de Dependencias con ForeignKeys

| Modelo            | FK a Modelo Externo          | Tipo FK    | Acción           |
|-------------------|------------------------------|------------|------------------|
| TipoDocumento     | AUTH_USER_MODEL (created_by) | SET_NULL   | Mantener         |
| PlantillaDocumento| TipoDocumento                | PROTECT    | Interno (OK)     |
| PlantillaDocumento| AUTH_USER_MODEL (created_by) | SET_NULL   | Mantener         |
| Documento         | TipoDocumento                | PROTECT    | Interno (OK)     |
| Documento         | PlantillaDocumento           | SET_NULL   | Interno (OK)     |
| Documento         | AUTH_USER_MODEL (3 campos)   | PROTECT/SET_NULL | Mantener   |
| Documento         | self (documento_padre)       | SET_NULL   | Interno (OK)     |
| VersionDocumento  | Documento                    | CASCADE    | Interno (OK)     |
| VersionDocumento  | AUTH_USER_MODEL (2 campos)   | PROTECT/SET_NULL | Mantener   |
| CampoFormulario   | PlantillaDocumento           | CASCADE    | Interno (OK)     |
| CampoFormulario   | TipoDocumento                | SET_NULL   | Interno (OK)     |
| CampoFormulario   | AUTH_USER_MODEL (created_by) | SET_NULL   | Mantener         |
| ~~FirmaDocumento~~| ~~Documento~~                | ~~CASCADE~~| **ELIMINAR**     |
| ControlDocumental | Documento                    | CASCADE    | Interno (OK)     |
| ControlDocumental | VersionDocumento             | CASCADE    | Interno (OK)     |
| ControlDocumental | AUTH_USER_MODEL (2 campos)   | SET_NULL   | Mantener         |

**Conclusión:** No hay dependencias circulares. Todos los FKs son internos al módulo o a AUTH_USER_MODEL.

---

## 4. Migración de Base de Datos

### 4.1 Tablas Actuales (db_table)

```python
# Tablas actuales en sistema_documental
documental_tipo_documento
documental_plantilla_documento
documental_documento
documental_version_documento
documental_campo_formulario
documental_firma_documento          # ← ELIMINAR
documental_control_documental

# Tablas Many-to-Many implícitas
documental_documento_usuarios_autorizados
documental_documento_documentos_referenciados
documental_controldocumental_usuarios_distribucion
```

### 4.2 Estrategia de Migración de Datos

**Opción elegida: Migración con operaciones SQL directas**

Usaremos `migrations.RunSQL()` para renombrar tablas y mantener datos intactos.

### 4.3 Script de Migración

```python
# apps/gestion_estrategica/gestion_documental/migrations/0001_migrate_from_hseq.py

from django.db import migrations

class Migration(migrations.Migration):
    """
    Migración de Sistema Documental desde HSEQ Management a Gestión Estratégica.

    Esta migración:
    1. NO renombra tablas (mantiene db_table='documental_*')
    2. Crea los modelos en la nueva app
    3. Mantiene compatibilidad de datos
    4. ELIMINA modelo FirmaDocumento (usar FirmaDigital de workflow_engine)
    """

    initial = True

    dependencies = [
        ('gestion_estrategica', '0008_alter_politicaespecifica_code'),  # Última migración
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # No hay operaciones de base de datos
        # Los modelos apuntan a las mismas tablas (db_table no cambia)
        # Solo creamos los modelos en la nueva app
    ]
```

**IMPORTANTE:** No renombramos tablas porque:
1. Mantener `db_table='documental_*'` evita migración de datos
2. Los nombres de tabla son independientes del app Django
3. Reduce riesgo de pérdida de datos
4. Permite rollback más seguro

### 4.4 Limpieza de Tabla FirmaDocumento

**Crear migración de limpieza:**

```python
# apps/gestion_estrategica/gestion_documental/migrations/0002_remove_firma_documento.py

from django.db import migrations

class Migration(migrations.Migration):
    """
    Elimina la tabla documental_firma_documento.

    Las firmas ahora se manejan con el modelo FirmaDigital del workflow_engine.
    """

    dependencies = [
        ('gestion_documental', '0001_migrate_from_hseq'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                -- Backup de firmas existentes (opcional)
                CREATE TABLE IF NOT EXISTS documental_firma_documento_backup AS
                SELECT * FROM documental_firma_documento;

                -- Eliminar tabla original
                DROP TABLE IF EXISTS documental_firma_documento;
            """,
            reverse_sql="""
                -- Restaurar desde backup en caso de rollback
                CREATE TABLE documental_firma_documento AS
                SELECT * FROM documental_firma_documento_backup;

                DROP TABLE documental_firma_documento_backup;
            """,
        ),
    ]
```

---

## 5. Actualización de Imports Backend

### 5.1 Archivos que Importan el Módulo

**Identidad Corporativa Service:**

```python
# apps/gestion_estrategica/identidad/services.py

# ANTES:
apps.get_model('sistema_documental', 'Documento')

# DESPUÉS:
apps.get_model('gestion_documental', 'Documento')
```

**Script de actualización automática:**

```bash
# Buscar todos los imports del módulo
grep -r "from apps.hseq_management.sistema_documental" backend/ --include="*.py"
grep -r "apps.get_model('sistema_documental'" backend/ --include="*.py"

# Reemplazar automáticamente
find backend/ -name "*.py" -type f -exec sed -i \
  's/from apps\.hseq_management\.sistema_documental/from apps.gestion_estrategica.gestion_documental/g' {} +

find backend/ -name "*.py" -type f -exec sed -i \
  "s/apps\.get_model('sistema_documental'/apps.get_model('gestion_documental'/g" {} +
```

### 5.2 Actualizar apps.py

```python
# apps/gestion_estrategica/gestion_documental/apps.py

from django.apps import AppConfig

class GestionDocumentalConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.gestion_estrategica.gestion_documental'
    verbose_name = 'Gestión Documental'

    def ready(self):
        """Importar signals si los hay"""
        pass
```

### 5.3 Actualizar INSTALLED_APPS

```python
# backend/config/settings.py

INSTALLED_APPS = [
    # ...

    # Gestión Estratégica (N1)
    'apps.gestion_estrategica.configuracion',
    'apps.gestion_estrategica.organizacion',
    'apps.gestion_estrategica.identidad',
    'apps.gestion_estrategica.planeacion',
    'apps.gestion_estrategica.gestion_proyectos',
    'apps.gestion_estrategica.revision_direccion',
    'apps.gestion_estrategica.gestion_documental',  # ← NUEVO

    # HSEQ Management (N3)
    'apps.hseq_management.accidentalidad',
    'apps.hseq_management.calidad',
    # ... otros submódulos HSEQ
    # 'apps.hseq_management.sistema_documental',  # ← COMENTAR/ELIMINAR
]
```

---

## 6. Actualización de URLs API

### 6.1 Eliminar de HSEQ URLs

```python
# apps/hseq_management/urls.py

from django.urls import path, include

app_name = 'hseq_management'

urlpatterns = [
    # Submódulos HSEQ
    path('accidentalidad/', include('apps.hseq_management.accidentalidad.urls')),
    path('calidad/', include('apps.hseq_management.calidad.urls')),
    # ... otros

    # ELIMINAR ESTA LÍNEA:
    # path('sistema-documental/', include('apps.hseq_management.sistema_documental.urls')),
]
```

### 6.2 Agregar a Gestión Estratégica URLs

```python
# apps/gestion_estrategica/urls.py

from django.urls import path, include

app_name = 'gestion_estrategica'

urlpatterns = [
    # Submódulos existentes
    path('configuracion/', include('apps.gestion_estrategica.configuracion.urls')),
    path('organizacion/', include('apps.gestion_estrategica.organizacion.urls')),
    path('identidad/', include('apps.gestion_estrategica.identidad.urls')),
    path('planeacion/', include('apps.gestion_estrategica.planeacion.urls')),

    # NUEVO:
    path('gestion-documental/', include('apps.gestion_estrategica.gestion_documental.urls')),
]
```

### 6.3 Actualizar app_name en urls.py del módulo

```python
# apps/gestion_estrategica/gestion_documental/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TipoDocumentoViewSet,
    PlantillaDocumentoViewSet,
    DocumentoViewSet,
    VersionDocumentoViewSet,
    CampoFormularioViewSet,
    # FirmaDocumentoViewSet,  # ← ELIMINAR
    ControlDocumentalViewSet
)

app_name = 'gestion_documental'  # CAMBIAR de 'sistema_documental'

router = DefaultRouter()

router.register(r'tipos-documento', TipoDocumentoViewSet, basename='tipo-documento')
router.register(r'plantillas', PlantillaDocumentoViewSet, basename='plantilla')
router.register(r'documentos', DocumentoViewSet, basename='documento')
router.register(r'versiones', VersionDocumentoViewSet, basename='version')
router.register(r'campos-formulario', CampoFormularioViewSet, basename='campo-formulario')
# router.register(r'firmas', FirmaDocumentoViewSet, basename='firma')  # ← ELIMINAR
router.register(r'controles', ControlDocumentalViewSet, basename='control')

urlpatterns = [
    path('', include(router.urls)),
]
```

### 6.4 Nuevas Rutas API

**Antes:**
```
/api/v1/hseq/sistema-documental/documentos/
/api/v1/hseq/sistema-documental/tipos-documento/
/api/v1/hseq/sistema-documental/firmas/  ← ELIMINAR
```

**Después:**
```
/api/v1/gestion-estrategica/gestion-documental/documentos/
/api/v1/gestion-estrategica/gestion-documental/tipos-documento/
```

---

## 7. Migración Frontend

### 7.1 Crear Nueva Estructura

```bash
# Crear directorios
mkdir -p frontend/src/features/gestion-estrategica/api
mkdir -p frontend/src/features/gestion-estrategica/hooks
mkdir -p frontend/src/features/gestion-estrategica/types
mkdir -p frontend/src/features/gestion-estrategica/pages
mkdir -p frontend/src/features/gestion-estrategica/components/gestion-documental
```

### 7.2 Mover y Renombrar Archivos

```bash
# API
cp frontend/src/features/hseq/api/sistemaDocumentalApi.ts \
   frontend/src/features/gestion-estrategica/api/gestionDocumentalApi.ts

# Hooks
cp frontend/src/features/hseq/hooks/useSistemaDocumental.ts \
   frontend/src/features/gestion-estrategica/hooks/useGestionDocumental.ts

# Types
cp frontend/src/features/hseq/types/sistema-documental.types.ts \
   frontend/src/features/gestion-estrategica/types/gestion-documental.types.ts

# Pages
cp frontend/src/features/hseq/pages/SistemaDocumentalPage.tsx \
   frontend/src/features/gestion-estrategica/pages/GestionDocumentalPage.tsx
```

### 7.3 Actualizar Imports en Frontend

**API:**
```typescript
// frontend/src/features/gestion-estrategica/api/gestionDocumentalApi.ts

import { apiClient } from '@/lib/api-client';
import type {
  TipoDocumento,
  PlantillaDocumento,
  Documento,
  // NO importar FirmaDocumento
} from '../types/gestion-documental.types';

const API_BASE = '/api/v1/gestion-estrategica/gestion-documental';  // ← CAMBIAR

export const gestionDocumentalApi = {
  // Tipos de documento
  getTiposDocumento: () =>
    apiClient.get<TipoDocumento[]>(`${API_BASE}/tipos-documento/`),

  // Documentos
  getDocumentos: (params?: any) =>
    apiClient.get<Documento[]>(`${API_BASE}/documentos/`, { params }),

  // ELIMINAR endpoints de firmas
  // getFirmasPendientes: () => ...
};
```

**Hooks:**
```typescript
// frontend/src/features/gestion-estrategica/hooks/useGestionDocumental.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gestionDocumentalApi } from '../api/gestionDocumentalApi';  // ← CAMBIAR
import type { Documento } from '../types/gestion-documental.types';

export const useGestionDocumental = () => {
  const queryClient = useQueryClient();

  // Documentos
  const { data: documentos, isLoading } = useQuery({
    queryKey: ['gestion-documental', 'documentos'],  // ← CAMBIAR key
    queryFn: () => gestionDocumentalApi.getDocumentos(),
  });

  return {
    documentos,
    isLoading,
  };
};
```

**Types (Eliminar FirmaDocumento):**
```typescript
// frontend/src/features/gestion-estrategica/types/gestion-documental.types.ts

export interface TipoDocumento {
  id: number;
  codigo: string;
  nombre: string;
  // ... campos
}

export interface Documento {
  id: number;
  codigo: string;
  titulo: string;
  // ... campos
  // NO incluir firmas: FirmaDocumento[]
}

// ELIMINAR INTERFACE:
// export interface FirmaDocumento { ... }
```

### 7.4 Actualizar Rutas en React Router

```typescript
// frontend/src/routes/index.tsx

import { GestionDocumentalPage } from '@/features/gestion-estrategica/pages/GestionDocumentalPage';

const routes = [
  {
    path: '/gestion-estrategica',
    children: [
      {
        path: 'gestion-documental',  // ← NUEVO
        element: <GestionDocumentalPage />,
      },
    ],
  },
  // ELIMINAR:
  // {
  //   path: '/hseq/sistema-documental',
  //   element: <SistemaDocumentalPage />,
  // },
];
```

### 7.5 Actualizar Menú de Navegación

```typescript
// frontend/src/components/layout/Sidebar.tsx o similar

const menuItems = [
  {
    section: 'Gestión Estratégica',
    items: [
      { name: 'Organización', path: '/gestion-estrategica/organizacion' },
      { name: 'Identidad Corporativa', path: '/gestion-estrategica/identidad' },
      { name: 'Gestión Documental', path: '/gestion-estrategica/gestion-documental' },  // ← MOVER AQUÍ
      { name: 'Planeación', path: '/gestion-estrategica/planeacion' },
    ],
  },
  {
    section: 'HSEQ',
    items: [
      { name: 'Accidentalidad', path: '/hseq/accidentalidad' },
      { name: 'Calidad', path: '/hseq/calidad' },
      // ELIMINAR: { name: 'Sistema Documental', path: '/hseq/sistema-documental' },
    ],
  },
];
```

---

## 8. Eliminación de FirmaDocumento

### 8.1 Razón de la Eliminación

**Duplicidad con workflow_engine:**
- El módulo `workflow_engine` ya tiene `FirmaDigital` genérico
- `FirmaDocumento` era específico para documentos
- Consolidar en un único sistema de firmas digitales

### 8.2 Estado Actual: FirmaDigital en Workflow Engine ✅ COMPLETADO

> **FASE 0.3 COMPLETADA:** El sistema de firmas digitales ya está consolidado en `apps/workflow_engine/firma_digital/`

**Ubicación:** `apps/workflow_engine/firma_digital/models.py`

**API Endpoints disponibles:**
- `GET/POST /api/workflows/firma-digital/flujos/` - Configuración de flujos
- `GET/POST /api/workflows/firma-digital/firmas/` - Firmas digitales
- `GET/POST /api/workflows/firma-digital/delegaciones/` - Delegaciones
- `GET/POST /api/workflows/firma-digital/alertas/` - Alertas de revisión
- `GET /api/workflows/firma-digital/versiones/` - Historial de versiones
- `POST /api/workflows/firma-digital/workflow/` - Acciones de workflow

```python
# apps/workflow_engine/firma_digital/models.py (YA IMPLEMENTADO)

class FirmaDigital(TimestampedModel):
    """Firmas digitales universales para cualquier entidad via GenericForeignKey"""

    # Referencia genérica al objeto firmado
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    documento = GenericForeignKey('content_type', 'object_id')

    # Configuración de flujo
    configuracion_flujo = models.ForeignKey(ConfiguracionFlujoFirma, ...)
    nodo_flujo = models.ForeignKey(FlowNode, ...)

    # Firmante
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, ...)
    cargo = models.ForeignKey('core.Cargo', ...)
    rol_firma = models.CharField(choices=ROL_FIRMA_CHOICES)  # ELABORO, REVISO, APROBO, VALIDO, AUTORIZO

    # Firma manuscrita (canvas signature)
    firma_imagen = models.TextField()  # Base64

    # Integridad y seguridad
    documento_hash = models.CharField(max_length=64)  # SHA-256
    firma_hash = models.CharField(max_length=64)

    # Metadatos
    fecha_firma = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    geolocalizacion = models.JSONField(null=True)

    # Estado y delegación
    estado = models.CharField(choices=ESTADO_FIRMA_CHOICES)
    es_delegada = models.BooleanField(default=False)
    delegante = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, ...)
```

### 8.3 Migrar Firmas Existentes

**Script de migración de datos:**

```python
# apps/gestion_estrategica/gestion_documental/migrations/0003_migrate_firmas_to_workflow.py

from django.db import migrations
from django.contrib.contenttypes.models import ContentType

def migrate_firmas_to_workflow(apps, schema_editor):
    """
    Migra FirmaDocumento a FirmaDigital del workflow_engine.
    """
    # NOTA: Si hay firmas existentes importantes, migrarlas aquí
    # Por ahora, asumimos que es un sistema nuevo sin firmas críticas
    pass

def reverse_migration(apps, schema_editor):
    """Rollback: restaurar desde backup"""
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('gestion_documental', '0002_remove_firma_documento'),
        ('identidad', '0007_add_workflow_firma_models'),  # Donde está FirmaDigital
    ]

    operations = [
        migrations.RunPython(
            migrate_firmas_to_workflow,
            reverse_migration,
        ),
    ]
```

### 8.4 Actualizar Views para Usar FirmaDigital

```python
# apps/gestion_estrategica/gestion_documental/views.py

from django.contrib.contenttypes.models import ContentType
from apps.gestion_estrategica.identidad.models import FirmaDigital

class DocumentoViewSet(viewsets.ModelViewSet):

    @action(detail=True, methods=['post'])
    def solicitar_firma(self, request, pk=None):
        """Solicita firma digital usando workflow_engine"""
        documento = self.get_object()

        # Crear firma usando FirmaDigital
        content_type = ContentType.objects.get_for_model(Documento)

        FirmaDigital.objects.create(
            content_type=content_type,
            object_id=documento.id,
            firmante_id=request.data['firmante_id'],
            tipo_firma=request.data['tipo_firma'],
            estado='PENDIENTE',
            empresa_id=documento.empresa_id,
        )

        return Response({'detail': 'Firma solicitada'})

    @action(detail=True, methods=['get'])
    def firmas(self, request, pk=None):
        """Obtiene firmas del documento"""
        documento = self.get_object()
        content_type = ContentType.objects.get_for_model(Documento)

        firmas = FirmaDigital.objects.filter(
            content_type=content_type,
            object_id=documento.id,
        )

        # Serializar firmas
        return Response(FirmaDigitalSerializer(firmas, many=True).data)
```

### 8.5 Eliminar Referencias en Models

```python
# apps/gestion_estrategica/gestion_documental/models.py

class Documento(models.Model):
    # ... campos existentes ...

    # ELIMINAR ESTE MÉTODO si existe:
    # def get_firmas(self):
    #     return self.firmas.all()

    # AGREGAR ESTE MÉTODO:
    def get_firmas_digitales(self):
        """Obtiene firmas digitales del workflow engine"""
        from django.contrib.contenttypes.models import ContentType
        from apps.gestion_estrategica.identidad.models import FirmaDigital

        content_type = ContentType.objects.get_for_model(Documento)
        return FirmaDigital.objects.filter(
            content_type=content_type,
            object_id=self.id,
        )
```

---

## 9. Plan de Ejecución Paso a Paso

### Fase 1: Preparación (30 min)

```bash
# 1. Crear backup de base de datos
python manage.py dumpdata hseq_management.sistema_documental > backup_sistema_documental.json

# 2. Crear estructura de directorios
mkdir -p backend/apps/gestion_estrategica/gestion_documental/migrations
mkdir -p backend/apps/gestion_estrategica/gestion_documental/tests
mkdir -p frontend/src/features/gestion-estrategica/{api,hooks,types,pages}

# 3. Crear rama de migración
git checkout -b feature/migrate-gestor-documental-to-n1
```

### Fase 2: Migración Backend (1 hora)

```bash
# 1. Copiar archivos Python
cp -r backend/apps/hseq_management/sistema_documental/*.py \
      backend/apps/gestion_estrategica/gestion_documental/

# 2. Copiar tests
cp -r backend/apps/hseq_management/sistema_documental/tests/* \
      backend/apps/gestion_estrategica/gestion_documental/tests/

# 3. Actualizar apps.py
# Editar manualmente: backend/apps/gestion_estrategica/gestion_documental/apps.py

# 4. Actualizar imports en todos los archivos
find backend/apps/gestion_estrategica/gestion_documental -name "*.py" -type f -exec sed -i \
  's/apps\.hseq_management\.sistema_documental/apps.gestion_estrategica.gestion_documental/g' {} +

# 5. Eliminar importaciones de FirmaDocumento en views.py y serializers.py
# Editar manualmente estos archivos

# 6. Crear migración inicial
python manage.py makemigrations gestion_documental --empty -n migrate_from_hseq

# 7. Actualizar INSTALLED_APPS
# Editar config/settings.py manualmente
```

### Fase 3: Migración Base de Datos (30 min)

```bash
# 1. Ejecutar migración
python manage.py migrate gestion_documental

# 2. Verificar tablas
python manage.py dbshell
\dt documental_*

# 3. Verificar datos
python manage.py shell
from apps.gestion_estrategica.gestion_documental.models import Documento
print(Documento.objects.count())

# 4. Crear migración de eliminación de FirmaDocumento
python manage.py makemigrations gestion_documental --empty -n remove_firma_documento

# 5. Ejecutar limpieza
python manage.py migrate gestion_documental
```

### Fase 4: Actualizar URLs (15 min)

```bash
# 1. Editar apps/hseq_management/urls.py
# Comentar línea de sistema-documental

# 2. Editar apps/gestion_estrategica/urls.py
# Agregar path de gestion-documental

# 3. Actualizar app_name en gestion_documental/urls.py

# 4. Probar endpoints
curl http://localhost:8000/api/v1/gestion-estrategica/gestion-documental/documentos/
```

### Fase 5: Actualizar Integraciones (15 min)

```bash
# 1. Actualizar identidad/services.py
sed -i "s/sistema_documental/gestion_documental/g" \
  backend/apps/gestion_estrategica/identidad/services.py

# 2. Buscar otras referencias
grep -r "sistema_documental" backend/ --include="*.py"

# 3. Actualizar referencias encontradas
```

### Fase 6: Migración Frontend (45 min)

```bash
# 1. Crear archivos frontend
cp frontend/src/features/hseq/api/sistemaDocumentalApi.ts \
   frontend/src/features/gestion-estrategica/api/gestionDocumentalApi.ts

cp frontend/src/features/hseq/hooks/useSistemaDocumental.ts \
   frontend/src/features/gestion-estrategica/hooks/useGestionDocumental.ts

cp frontend/src/features/hseq/types/sistema-documental.types.ts \
   frontend/src/features/gestion-estrategica/types/gestion-documental.types.ts

cp frontend/src/features/hseq/pages/SistemaDocumentalPage.tsx \
   frontend/src/features/gestion-estrategica/pages/GestionDocumentalPage.tsx

# 2. Actualizar imports en archivos copiados
# Buscar y reemplazar:
# - sistemaDocumentalApi → gestionDocumentalApi
# - sistema-documental → gestion-documental
# - /hseq/sistema-documental → /gestion-estrategica/gestion-documental
# - Eliminar FirmaDocumento interfaces

# 3. Actualizar rutas
# Editar frontend/src/routes/index.tsx

# 4. Actualizar menú
# Editar componente de navegación
```

### Fase 7: Limpieza (15 min)

```bash
# 1. Eliminar módulo antiguo (después de verificar)
rm -rf backend/apps/hseq_management/sistema_documental/

# 2. Eliminar archivos frontend antiguos
rm -rf frontend/src/features/hseq/api/sistemaDocumentalApi.ts
rm -rf frontend/src/features/hseq/hooks/useSistemaDocumental.ts
rm -rf frontend/src/features/hseq/types/sistema-documental.types.ts
rm -rf frontend/src/features/hseq/pages/SistemaDocumentalPage.tsx

# 3. Limpiar imports no usados
# Ejecutar linter/formatter
```

### Fase 8: Testing (30 min)

```bash
# 1. Tests backend
python manage.py test apps.gestion_estrategica.gestion_documental

# 2. Verificar integración con Identidad
python manage.py shell
# Probar envío de política a documental

# 3. Tests frontend
cd frontend
npm run test -- gestion-documental

# 4. Pruebas manuales en desarrollo
npm run dev
# Navegar a /gestion-estrategica/gestion-documental
```

### Fase 9: Commit y PR (15 min)

```bash
# 1. Agregar archivos
git add backend/apps/gestion_estrategica/gestion_documental/
git add frontend/src/features/gestion-estrategica/

# 2. Eliminar archivos antiguos
git rm -r backend/apps/hseq_management/sistema_documental/
git rm frontend/src/features/hseq/api/sistemaDocumentalApi.ts
git rm frontend/src/features/hseq/hooks/useSistemaDocumental.ts
git rm frontend/src/features/hseq/types/sistema-documental.types.ts
git rm frontend/src/features/hseq/pages/SistemaDocumentalPage.tsx

# 3. Commit
git commit -m "feat(gestion-estrategica): Migrate Gestor Documental from N3 to N1

BREAKING CHANGE: Sistema Documental moved from HSEQ to Gestión Estratégica

- Move TipoDocumento, PlantillaDocumento, Documento, VersionDocumento,
  CampoFormulario, ControlDocumental to gestion_documental
- Remove FirmaDocumento (use FirmaDigital from workflow_engine)
- Update API routes: /gestion-estrategica/gestion-documental/
- Update frontend imports and routing
- Update Identidad integration service

Closes #XXX"

# 4. Push y crear PR
git push origin feature/migrate-gestor-documental-to-n1
```

---

## 10. Validación y Testing

### 10.1 Checklist de Validación Backend

- [ ] Todos los modelos importan correctamente
- [ ] Migración ejecuta sin errores
- [ ] Datos existentes intactos (count de registros igual)
- [ ] API endpoints responden correctamente
- [ ] Integración con Identidad funciona
- [ ] Admin de Django muestra los modelos
- [ ] No hay imports rotos en ningún archivo
- [ ] FirmaDocumento eliminado completamente

### 10.2 Checklist de Validación Frontend

- [ ] Rutas actualizadas en React Router
- [ ] API client apunta a nueva URL
- [ ] Hooks funcionan correctamente
- [ ] Types no incluyen FirmaDocumento
- [ ] Páginas se renderizan sin errores
- [ ] Menú de navegación actualizado
- [ ] No hay referencias a rutas antiguas

### 10.3 Tests Automatizados

**Backend:**
```bash
# Tests de modelos
python manage.py test apps.gestion_estrategica.gestion_documental.tests.test_models

# Tests de API
python manage.py test apps.gestion_estrategica.gestion_documental.tests.test_views

# Tests de integración
python manage.py test apps.gestion_estrategica.identidad.tests.test_services
```

**Frontend:**
```bash
# Tests unitarios
npm run test -- gestion-documental

# Tests E2E (si existen)
npm run test:e2e -- gestion-documental
```

### 10.4 Pruebas Manuales

1. **Crear Tipo de Documento**
   - Navegar a `/gestion-estrategica/gestion-documental/tipos-documento/`
   - Crear nuevo tipo
   - Verificar guardado

2. **Crear Documento**
   - Crear documento con plantilla
   - Verificar versionamiento
   - Aprobar y publicar

3. **Integración con Identidad**
   - Crear política en Identidad
   - Enviar a Gestor Documental
   - Verificar documento creado con código correcto

4. **Firmas Digitales (nuevo sistema)**
   - Solicitar firma digital
   - Firmar documento
   - Verificar estado

### 10.5 Rollback Plan

Si algo falla:

```bash
# 1. Restaurar desde backup
python manage.py loaddata backup_sistema_documental.json

# 2. Revertir migración
python manage.py migrate gestion_documental zero

# 3. Revertir código
git revert HEAD

# 4. Restaurar INSTALLED_APPS
# Descomentar sistema_documental
# Comentar gestion_documental
```

---

## 11. Comandos Rápidos de Ejecución

### Script Completo de Migración

```bash
#!/bin/bash
# migrate_gestor_documental.sh

set -e  # Exit on error

echo "=== Iniciando Migración Gestor Documental N3 → N1 ==="

# 1. Backup
echo "1. Creando backup..."
python manage.py dumpdata hseq_management.sistema_documental > backup_sistema_documental.json

# 2. Crear estructura
echo "2. Creando estructura de directorios..."
mkdir -p backend/apps/gestion_estrategica/gestion_documental/{migrations,tests}
mkdir -p frontend/src/features/gestion-estrategica/{api,hooks,types,pages}

# 3. Copiar backend
echo "3. Copiando archivos backend..."
cp backend/apps/hseq_management/sistema_documental/*.py \
   backend/apps/gestion_estrategica/gestion_documental/

# 4. Actualizar imports
echo "4. Actualizando imports..."
find backend/apps/gestion_estrategica/gestion_documental -name "*.py" -exec sed -i \
  's/apps\.hseq_management\.sistema_documental/apps.gestion_estrategica.gestion_documental/g' {} +

# 5. Migración
echo "5. Ejecutando migración..."
python manage.py makemigrations gestion_documental
python manage.py migrate gestion_documental

# 6. Copiar frontend
echo "6. Copiando archivos frontend..."
cp frontend/src/features/hseq/api/sistemaDocumentalApi.ts \
   frontend/src/features/gestion-estrategica/api/gestionDocumentalApi.ts
cp frontend/src/features/hseq/hooks/useSistemaDocumental.ts \
   frontend/src/features/gestion-estrategica/hooks/useGestionDocumental.ts
cp frontend/src/features/hseq/types/sistema-documental.types.ts \
   frontend/src/features/gestion-estrategica/types/gestion-documental.types.ts
cp frontend/src/features/hseq/pages/SistemaDocumentalPage.tsx \
   frontend/src/features/gestion-estrategica/pages/GestionDocumentalPage.tsx

# 7. Actualizar identidad service
echo "7. Actualizando integración con Identidad..."
sed -i "s/sistema_documental/gestion_documental/g" \
  backend/apps/gestion_estrategica/identidad/services.py

echo "=== Migración completada ==="
echo "IMPORTANTE: Revisar y actualizar manualmente:"
echo "  - frontend/src/routes/index.tsx"
echo "  - config/settings.py (INSTALLED_APPS)"
echo "  - apps/hseq_management/urls.py"
echo "  - apps/gestion_estrategica/urls.py"
echo "  - Archivos frontend copiados (actualizar imports y rutas)"
```

---

## 12. Anexos

### Anexo A: Estructura Final del Módulo

```
backend/apps/gestion_estrategica/gestion_documental/
├── __init__.py
├── admin.py                    # Configuración Django Admin
├── apps.py                     # GestionDocumentalConfig
├── models.py                   # 6 modelos (sin FirmaDocumento)
├── serializers.py              # Serializers DRF
├── urls.py                     # Router de endpoints
├── views.py                    # ViewSets (sin FirmaDocumentoViewSet)
├── migrations/
│   ├── __init__.py
│   ├── 0001_migrate_from_hseq.py
│   ├── 0002_remove_firma_documento.py
│   └── 0003_migrate_firmas_to_workflow.py
└── tests/
    ├── __init__.py
    ├── test_models.py
    ├── test_views.py
    └── test_integration.py

frontend/src/features/gestion-estrategica/
├── api/
│   └── gestionDocumentalApi.ts
├── hooks/
│   └── useGestionDocumental.ts
├── types/
│   └── gestion-documental.types.ts
├── pages/
│   └── GestionDocumentalPage.tsx
└── components/
    └── gestion-documental/
        ├── DocumentoList.tsx
        ├── DocumentoForm.tsx
        └── PlantillaBuilder.tsx
```

### Anexo B: Modelos Finales

**6 Modelos en gestion_documental:**

1. ✅ `TipoDocumento` - Catálogo de tipos
2. ✅ `PlantillaDocumento` - Plantillas base
3. ✅ `Documento` - Documentos principales
4. ✅ `VersionDocumento` - Historial de versiones
5. ✅ `CampoFormulario` - Form builder dinámico
6. ✅ `ControlDocumental` - Control de distribución

**1 Modelo en workflow_engine (ya existe):**

7. ✅ `FirmaDigital` - Firmas digitales universales (GenericForeignKey)

### Anexo C: Endpoints API Finales

```
# Tipos de Documento
GET    /api/v1/gestion-estrategica/gestion-documental/tipos-documento/
POST   /api/v1/gestion-estrategica/gestion-documental/tipos-documento/
GET    /api/v1/gestion-estrategica/gestion-documental/tipos-documento/{id}/
PUT    /api/v1/gestion-estrategica/gestion-documental/tipos-documento/{id}/
DELETE /api/v1/gestion-estrategica/gestion-documental/tipos-documento/{id}/
GET    /api/v1/gestion-estrategica/gestion-documental/tipos-documento/activos/

# Plantillas
GET    /api/v1/gestion-estrategica/gestion-documental/plantillas/
POST   /api/v1/gestion-estrategica/gestion-documental/plantillas/
POST   /api/v1/gestion-estrategica/gestion-documental/plantillas/{id}/activar/
POST   /api/v1/gestion-estrategica/gestion-documental/plantillas/{id}/marcar-obsoleta/

# Documentos
GET    /api/v1/gestion-estrategica/gestion-documental/documentos/
POST   /api/v1/gestion-estrategica/gestion-documental/documentos/
POST   /api/v1/gestion-estrategica/gestion-documental/documentos/{id}/aprobar/
POST   /api/v1/gestion-estrategica/gestion-documental/documentos/{id}/publicar/
POST   /api/v1/gestion-estrategica/gestion-documental/documentos/{id}/enviar-revision/
POST   /api/v1/gestion-estrategica/gestion-documental/documentos/recibir-politica/
GET    /api/v1/gestion-estrategica/gestion-documental/documentos/listado-maestro/

# Versiones
GET    /api/v1/gestion-estrategica/gestion-documental/versiones/
GET    /api/v1/gestion-estrategica/gestion-documental/versiones/por-documento/?documento_id=X
GET    /api/v1/gestion-estrategica/gestion-documental/versiones/{id}/comparar/

# Campos de Formulario
GET    /api/v1/gestion-estrategica/gestion-documental/campos-formulario/
POST   /api/v1/gestion-estrategica/gestion-documental/campos-formulario/
POST   /api/v1/gestion-estrategica/gestion-documental/campos-formulario/reordenar/

# Control Documental
GET    /api/v1/gestion-estrategica/gestion-documental/controles/
POST   /api/v1/gestion-estrategica/gestion-documental/controles/
POST   /api/v1/gestion-estrategica/gestion-documental/controles/{id}/confirmar-recepcion/
GET    /api/v1/gestion-estrategica/gestion-documental/controles/distribuciones-activas/

# ELIMINADOS (usar FirmaDigital de workflow_engine):
# /api/v1/gestion-estrategica/gestion-documental/firmas/
# /api/v1/gestion-estrategica/gestion-documental/firmas/pendientes/
```

---

## Resumen de Cambios

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Módulo** | `apps/hseq_management/sistema_documental` | `apps/gestion_estrategica/gestion_documental` |
| **URL Base** | `/api/v1/hseq/sistema-documental/` | `/api/v1/gestion-estrategica/gestion-documental/` |
| **app_name** | `sistema_documental` | `gestion_documental` |
| **Tablas DB** | `documental_*` (mantener igual) | `documental_*` (sin cambios) |
| **Modelos** | 7 modelos | 6 modelos (eliminar FirmaDocumento) |
| **Firmas** | `FirmaDocumento` | `FirmaDigital` (workflow_engine) |
| **Frontend Path** | `features/hseq/` | `features/gestion-estrategica/` |
| **React Route** | `/hseq/sistema-documental` | `/gestion-estrategica/gestion-documental` |

---

**Tiempo estimado total:** 3 horas (reducido por FASE 0.3 completada)

**Riesgo:** Bajo (FirmaDigital ya consolidado, solo queda mover archivos)

**Rollback:** Posible mediante backup y revert de migraciones

**Beneficio:** Gestor Documental disponible para toda la organización, no solo HSEQ

---

## 13. Registro de Progreso

### Prerrequisitos Completados

| Fase | Descripción | Estado | Commits |
|------|-------------|--------|---------|
| 0.3.4 | Eliminar sistema de firma legacy de identidad | ✅ | `73a3929` |
| 0.3.5 | Completar eliminación de modelos legacy | ✅ | `1e9d050` |
| 0.3.6 | Configurar app firma_digital en workflow_engine | ✅ | `e3d4bd8` |

### Backend Completado ✅

| # | Tarea | Estado | Fecha |
|---|-------|--------|-------|
| 1 | Eliminar modelo `FirmaDocumento` de sistema_documental | ✅ | 2026-01-17 |
| 2 | Copiar módulo a gestion_estrategica/gestion_documental | ✅ | 2026-01-17 |
| 3 | Actualizar imports y app_name | ✅ | 2026-01-17 |
| 4 | Crear migraciones (0001_initial.py) | ✅ | 2026-01-17 |
| 5 | Actualizar URLs (eliminar de HSEQ, agregar a N1) | ✅ | 2026-01-17 |
| 6 | Eliminar módulo antiguo de HSEQ | ✅ | 2026-01-17 |
| 7 | Validar con manage.py check | ✅ | 2026-01-17 |

### Tareas Pendientes (Frontend)

| # | Tarea | Prioridad | Dependencia |
|---|-------|-----------|-------------|
| 1 | Actualizar frontend (tipos, hooks, API, páginas) | Media | Backend completado |
| 2 | Validar UI en ambiente local | Alta | Tarea 1 |

---

**Próximos pasos:**

1. ~~Consolidar FirmaDigital en workflow_engine~~ ✅ COMPLETADO
2. ~~Migrar módulo a N1~~ ✅ COMPLETADO
3. Actualizar frontend para usar nuevos endpoints
4. Validar UI antes de subir a producción
