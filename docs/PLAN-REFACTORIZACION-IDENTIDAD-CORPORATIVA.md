# Plan de Refactorización - Módulo Identidad Corporativa

**Sistema:** StrateKaz - Sistema de Gestión Integral
**Módulo:** `backend/apps/gestion_estrategica/identidad/`
**Versión del Plan:** 1.1
**Fecha:** 2026-01-11
**Estado:** EN EJECUCIÓN - FASE 4 COMPLETADA

---

## ✅ ACTUALIZACIÓN: Integración con Gestor Documental ACTIVA

**Fecha:** 2026-01-11

El módulo **Sistema Documental** (`apps.hseq_management.sistema_documental`) ya está **completamente implementado y activo** en el sistema. Se ha creado el servicio de integración automática.

### Componentes Implementados:

| Componente | Estado | Ubicación |
|------------|--------|-----------|
| GestorDocumentalService | ✅ CREADO | `identidad/services.py` |
| Endpoint enviar-a-documental | ✅ ACTUALIZADO | `identidad/views.py` |
| Endpoint recibir-politica | ✅ EXISTENTE | `sistema_documental/views.py` |
| Callback actualización estado | ✅ FUNCIONAL | Integración directa |

### Flujo Automático Implementado:

```
┌─────────────────────────────────────────────────────────────────────┐
│ IDENTIDAD CORPORATIVA                                               │
│                                                                     │
│  1. Crear Política (BORRADOR)                                       │
│  2. Iniciar Firma → Estado: EN_REVISION                            │
│  3. Firmantes completan → Proceso: COMPLETADO                       │
│  4. POST /enviar-a-documental/ ─────────────────────────────────┐  │
│                                                                  │  │
└──────────────────────────────────────────────────────────────────│──┘
                                                                   │
                                                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│ GESTOR DOCUMENTAL (automático via GestorDocumentalService)         │
│                                                                     │
│  5. Crear TipoDocumento "POL" (si no existe)                       │
│  6. Generar código: POL-{NORMA}-{SEC} (ej: POL-SST-001)            │
│  7. Crear Documento con estado APROBADO                             │
│  8. Registrar firmas importadas                                     │
│  9. Crear VersionDocumento inicial                                  │
│  10. Publicar documento → Estado: PUBLICADO                         │
│  11. Crear ControlDocumental de distribución                        │
│                                                                     │
└──────────────────────────────────────────────────────────────────│──┘
                                                                   │
                                                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│ CALLBACK A IDENTIDAD (automático)                                   │
│                                                                     │
│  12. Actualizar PoliticaEspecifica:                                │
│      - status: VIGENTE                                              │
│      - code: POL-SST-001 (código oficial)                          │
│      - documento_id: ID del documento creado                        │
│      - effective_date: fecha actual                                 │
│  13. Si es actualización: marcar versión anterior como OBSOLETO    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Archivos Creados/Modificados:

1. **NUEVO**: `backend/apps/gestion_estrategica/identidad/services.py`
   - `GestorDocumentalService.is_documental_available()`
   - `GestorDocumentalService.enviar_politica_a_documental()`

2. **MODIFICADO**: `backend/apps/gestion_estrategica/identidad/views.py`
   - Endpoint `enviar-a-documental` ahora usa el servicio para integración automática
   - Manejo de errores con rollback de estado

---

## Resumen Ejecutivo

Este plan aborda la refactorización completa del módulo de Identidad Corporativa para:

1. **Eliminar hardcoding** y cumplir el principio "100% dinámico desde BD"
2. **Consolidar Valores Vividos** como sistema de BI robusto
3. ~~**Profesionalizar integración** con Gestor Documental~~ ✅ **COMPLETADO**
4. **Eliminar código muerto** y redundancias
5. **Mantener modularidad** preparando para la siguiente aplicación

---

## Índice de Fases

| Fase | Nombre | Prioridad | Estado |
|------|--------|-----------|--------|
| 1 | Limpieza de Código Muerto | CRÍTICA | ✅ PARCIAL |
| 2 | Dinamización de Estados y Tipos | CRÍTICA | ✅ COMPLETADO |
| 3 | Valores Vividos - Arquitectura BI | ALTA | ✅ COMPLETADO |
| 4 | Integración Gestor Documental | ALTA | ✅ COMPLETADO |
| 5 | Consolidación Frontend | MEDIA | PENDIENTE |
| 6 | Consolidación Hooks y API | MEDIA | PENDIENTE |
| 7 | Documentación y Preparación | BAJA | PENDIENTE |

---

## ✅ PROGRESO SESIÓN 2026-01-11

### Fase 1: Limpieza (PARCIAL)
- ✅ Consolidado STATUS_CONFIG en PolicyStatusBadge
- ✅ Añadido estado FIRMADO faltante
- ⚠️ `models_workflow_firmas.py` NO es código muerto - está en uso activo

### Fase 2: Dinamización (COMPLETADO)
- ✅ Creado `models_config.py` con modelos dinámicos:
  - `EstadoPolitica` - Estados de workflow configurables
  - `TipoPolitica` - Tipos de políticas dinámicos
  - `RolFirmante` - Roles de firmantes configurables
  - `EstadoFirma` - Estados de firma dinámicos
- ✅ Creado `seed_config_identidad.py` para poblar datos iniciales
- ✅ Creado `serializers_config.py` para API
- ✅ Creado `views_config.py` con ViewSets
- ✅ Añadidas rutas en `/config/` para endpoints

### Fase 3: Valores Vividos BI (COMPLETADO)
- ✅ Creado `widgets_valores_vividos.py` en Analytics:
  - `ValoresVividosWidgetService` - Servicio de datos para widgets
  - `get_indice_vivencia()` - KPI principal (0-100)
  - `get_top_valores()` - Top valores más vividos
  - `get_tendencia_mensual()` - Datos para gráficos
  - `get_alertas_valores()` - Valores subrepresentados
- ✅ Integrado en `VistaDashboardViewSet`:
  - `/valores-vividos/` - Resumen completo
  - `/valores-vividos/widget/` - Datos por tipo de widget

### Fase 4: Gestor Documental (COMPLETADO - Sesión anterior)
- ✅ `GestorDocumentalService` creado
- ✅ Flujo automático: FIRMADO → Gestor Documental → VIGENTE

### Rutas Frontend Activadas
- ✅ `/cumplimiento` - Motor de Cumplimiento
- ✅ `/cumplimiento/matriz-legal`
- ✅ `/cumplimiento/requisitos-legales`
- ✅ `/cumplimiento/partes-interesadas`
- ✅ `/cumplimiento/reglamentos-internos`
- ✅ `/produccion` - Operaciones de Producción
- ✅ `/logistica` - Logística y Flota

---

## FASE 1: Limpieza de Código Muerto

### Objetivo
Eliminar código que no se usa, tablas huérfanas y redundancias evidentes.

### 1.1 Eliminar models_workflow_firmas.py (Duplicado)

**Problema:** Existe un sistema de workflow duplicado:
- `models_workflow.py` (USADO) - FirmaDigital, ConfiguracionWorkflowFirma, etc.
- `models_workflow_firmas.py` (NO USADO) - ConfiguracionFlujoFirma, ProcesoFirmaPolitica, FirmaPolitica

**Acción:**
```bash
# Backend
rm backend/apps/gestion_estrategica/identidad/models_workflow_firmas.py

# Eliminar migración asociada
rm backend/apps/gestion_estrategica/identidad/migrations/0007_add_workflow_firma_models.py

# Crear migración para eliminar tablas huérfanas
python manage.py makemigrations identidad --name remove_orphan_workflow_tables
```

**Tablas a eliminar:**
- `identidad_config_flujo_firma`
- `identidad_proceso_firma_politica`
- `identidad_firma_politica`
- `identidad_historial_firma_politica`

**Archivos afectados:**
- `views.py` - Remover imports de models_workflow_firmas
- `serializers.py` - Remover imports si existen
- `urls.py` - Verificar rutas no usadas

---

### 1.2 Eliminar Campos DEPRECATED de CorporateIdentity

**Problema:** Campos legacy que ocupan espacio y causan confusión:
```python
# En models.py líneas 95-122
integral_policy = models.TextField(...)  # DEPRECATED
policy_signed_by = models.ForeignKey(...)  # DEPRECATED
policy_signed_at = models.DateTimeField(...)  # DEPRECATED
policy_signature_hash = models.CharField(...)  # DEPRECATED
```

**Acción:**
1. Verificar que no hay datos en producción usando estos campos
2. Crear migración para eliminar campos:

```python
# migrations/0009_remove_deprecated_policy_fields.py
from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('identidad', '0008_alter_politicaespecifica_code'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='corporateidentity',
            name='integral_policy',
        ),
        migrations.RemoveField(
            model_name='corporateidentity',
            name='policy_signed_by',
        ),
        migrations.RemoveField(
            model_name='corporateidentity',
            name='policy_signed_at',
        ),
        migrations.RemoveField(
            model_name='corporateidentity',
            name='policy_signature_hash',
        ),
    ]
```

3. Eliminar método `sign_policy()` y property `is_signed` de CorporateIdentity
4. Actualizar serializers para no incluir campos eliminados

---

### 1.3 Eliminar Hooks No Usados (Frontend)

**Problema:** Archivos de hooks que no se importan en ningún componente.

**Verificar y eliminar si no se usan:**
```
frontend/src/features/gestion-estrategica/hooks/
├── useTenantConfig.ts      # Verificar uso
├── useMatrizPermisos.ts    # Verificar uso
├── useRolesPermisos.ts     # Verificar uso
├── useProyectos.ts         # Verificar uso
├── usePortafolios.ts       # Verificar uso
```

**Acción:**
```bash
# Buscar imports de cada archivo
grep -r "useTenantConfig" frontend/src/
grep -r "useMatrizPermisos" frontend/src/
# ... etc.

# Si no hay resultados (excepto el archivo mismo), eliminar
```

---

### 1.4 Consolidar STATUS_CONFIG Duplicado

**Problema:** Configuración de estados duplicada en 5 archivos:
- `policies.types.ts` (líneas 452-521)
- `PoliciesList.tsx` (líneas 56-92)
- `PolicyDetailModal.tsx` (líneas 44-86)
- `PolicyStatusBadge.tsx` (líneas 20-53)
- `usePoliticas.ts` (líneas 930-939)

**Acción:**
1. Crear archivo centralizado:

```typescript
// frontend/src/features/gestion-estrategica/constants/policyConfig.ts

import { FileEdit, Eye, PenTool, CheckCircle, Archive } from 'lucide-react';

export const POLICY_STATUS_CONFIG = {
  BORRADOR: {
    label: 'Borrador',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    icon: FileEdit,
    description: 'Política en edición',
  },
  EN_REVISION: {
    label: 'En Revisión',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    icon: Eye,
    description: 'Pendiente de firmas',
  },
  FIRMADO: {
    label: 'Firmado',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    icon: PenTool,
    description: 'Listo para Gestor Documental',
  },
  VIGENTE: {
    label: 'Vigente',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    icon: CheckCircle,
    description: 'Política activa',
  },
  OBSOLETO: {
    label: 'Obsoleto',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    icon: Archive,
    description: 'Versión histórica',
  },
} as const;

export const FIRMA_STATUS_CONFIG = {
  PENDIENTE: {
    label: 'Pendiente',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  FIRMADO: {
    label: 'Firmado',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  RECHAZADO: {
    label: 'Rechazado',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  DELEGADO: {
    label: 'Delegado',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  VENCIDO: {
    label: 'Vencido',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
} as const;
```

2. Actualizar imports en todos los archivos afectados
3. Eliminar definiciones duplicadas

---

### 1.5 Remover Imports No Usados

**Archivos con imports sin usar:**

| Archivo | Import | Línea |
|---------|--------|-------|
| `IdentityFormModal.tsx` | `Compass, Eye` | 16 |
| `views.py` | `timezone` (duplicado) | 19, 778 |
| `PoliciesList.tsx` | `FileText` | 11 |

---

### Checklist Fase 1

- [ ] Eliminar `models_workflow_firmas.py`
- [ ] Crear migración para eliminar tablas huérfanas
- [ ] Eliminar campos DEPRECATED de CorporateIdentity
- [ ] Auditar y eliminar hooks no usados
- [ ] Consolidar STATUS_CONFIG en archivo único
- [ ] Remover imports no usados
- [ ] Ejecutar tests para verificar que nada se rompe
- [ ] Commit: `refactor(identidad): remove dead code and consolidate configs`

---

## FASE 2: Dinamización de Estados y Tipos

### Objetivo
Eliminar CHOICES hardcodeados y crear tablas de configuración dinámica.

### 2.1 Crear Modelo EstadoPolitica

**Problema:** `POLICY_STATUS_CHOICES` hardcodeado en models.py

**Acción - Backend:**

```python
# backend/apps/gestion_estrategica/identidad/models_config.py (NUEVO)

from django.db import models
from apps.core.base_models import TimestampedModel, OrderedModel

class EstadoPolitica(TimestampedModel, OrderedModel):
    """
    Estados dinámicos para políticas.

    Reemplaza POLICY_STATUS_CHOICES hardcodeado.
    Configurable por empresa si se requiere multi-tenancy.
    """
    code = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del estado (BORRADOR, EN_REVISION, etc.)'
    )
    label = models.CharField(
        max_length=50,
        verbose_name='Etiqueta',
        help_text='Nombre visible en UI'
    )
    description = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )

    # UI Configuration
    color = models.CharField(
        max_length=20,
        default='gray',
        verbose_name='Color',
        help_text='Color Tailwind (gray, green, yellow, red, blue, purple)'
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Icono',
        help_text='Nombre del icono Lucide'
    )

    # Workflow
    es_editable = models.BooleanField(
        default=True,
        verbose_name='¿Es editable?',
        help_text='Si la política puede editarse en este estado'
    )
    es_final = models.BooleanField(
        default=False,
        verbose_name='¿Es estado final?',
        help_text='Si es un estado terminal (VIGENTE, OBSOLETO)'
    )
    permite_firma = models.BooleanField(
        default=False,
        verbose_name='¿Permite firma?'
    )

    # Transiciones permitidas
    transiciones_permitidas = models.JSONField(
        default=list,
        verbose_name='Transiciones Permitidas',
        help_text='Lista de códigos de estados a los que puede transicionar'
    )

    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'identidad_estado_politica'
        verbose_name = 'Estado de Política'
        verbose_name_plural = 'Estados de Política'
        ordering = ['orden']

    def __str__(self):
        return f"{self.code} - {self.label}"
```

**Seed de datos iniciales:**

```python
# management/commands/seed_estados_politica.py

ESTADOS_INICIALES = [
    {
        'code': 'BORRADOR',
        'label': 'Borrador',
        'description': 'Política en edición, no visible para usuarios',
        'color': 'gray',
        'icon': 'FileEdit',
        'es_editable': True,
        'es_final': False,
        'permite_firma': False,
        'transiciones_permitidas': ['EN_REVISION'],
        'orden': 1,
    },
    {
        'code': 'EN_REVISION',
        'label': 'En Revisión',
        'description': 'Pendiente de firmas digitales',
        'color': 'yellow',
        'icon': 'Eye',
        'es_editable': False,
        'es_final': False,
        'permite_firma': True,
        'transiciones_permitidas': ['FIRMADO', 'BORRADOR'],
        'orden': 2,
    },
    {
        'code': 'FIRMADO',
        'label': 'Firmado',
        'description': 'Listo para enviar a Gestor Documental',
        'color': 'blue',
        'icon': 'PenTool',
        'es_editable': False,
        'es_final': False,
        'permite_firma': False,
        'transiciones_permitidas': ['VIGENTE'],
        'orden': 3,
    },
    {
        'code': 'VIGENTE',
        'label': 'Vigente',
        'description': 'Política activa y publicada',
        'color': 'green',
        'icon': 'CheckCircle',
        'es_editable': False,
        'es_final': True,
        'permite_firma': False,
        'transiciones_permitidas': ['OBSOLETO'],
        'orden': 4,
    },
    {
        'code': 'OBSOLETO',
        'label': 'Obsoleto',
        'description': 'Versión histórica archivada',
        'color': 'red',
        'icon': 'Archive',
        'es_editable': False,
        'es_final': True,
        'permite_firma': False,
        'transiciones_permitidas': [],
        'orden': 5,
    },
]
```

---

### 2.2 Crear Modelo TipoPolitica

**Problema:** `DEFAULT_TIPOS_POLITICA` hardcodeado en frontend (8 tipos fijos)

**Acción - Backend:**

```python
# backend/apps/gestion_estrategica/identidad/models_config.py

class TipoPolitica(TimestampedModel, OrderedModel):
    """
    Tipos de política configurables dinámicamente.

    Reemplaza DEFAULT_TIPOS_POLITICA del frontend.
    """
    code = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único (INTEGRAL, SST, CALIDAD, etc.)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre completo del tipo'
    )
    description = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )

    # Configuración de código
    prefijo_codigo = models.CharField(
        max_length=20,
        verbose_name='Prefijo de Código',
        help_text='Prefijo para código de política (POL-SST, POL-CAL, etc.)'
    )

    # UI
    icon = models.CharField(
        max_length=50,
        verbose_name='Icono',
        help_text='Nombre del icono Lucide'
    )
    color = models.CharField(
        max_length=20,
        default='#6B7280',
        verbose_name='Color',
        help_text='Color hexadecimal para UI'
    )

    # Workflow
    requiere_firma = models.BooleanField(
        default=True,
        verbose_name='¿Requiere firma?'
    )
    requiere_responsable = models.BooleanField(
        default=True,
        verbose_name='¿Requiere responsable?'
    )
    requiere_area = models.BooleanField(
        default=True,
        verbose_name='¿Requiere área?'
    )

    # Relaciones
    norma_iso_default = models.ForeignKey(
        'configuracion.NormaISO',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Norma ISO por defecto'
    )
    flujo_firma_default = models.ForeignKey(
        'identidad.ConfiguracionWorkflowFirma',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Flujo de firma por defecto'
    )

    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'identidad_tipo_politica'
        verbose_name = 'Tipo de Política'
        verbose_name_plural = 'Tipos de Política'
        ordering = ['orden']

    def __str__(self):
        return f"{self.code} - {self.name}"
```

**Seed de datos iniciales:**

```python
TIPOS_INICIALES = [
    {
        'code': 'INTEGRAL',
        'name': 'Política Integral',
        'description': 'Política integral del sistema de gestión',
        'prefijo_codigo': 'POL-INT',
        'icon': 'Shield',
        'color': '#8B5CF6',
        'requiere_firma': True,
        'requiere_responsable': False,
        'requiere_area': False,
        'orden': 1,
    },
    {
        'code': 'SST',
        'name': 'Política de SST',
        'description': 'Política de Seguridad y Salud en el Trabajo',
        'prefijo_codigo': 'POL-SST',
        'icon': 'HardHat',
        'color': '#F59E0B',
        'requiere_firma': True,
        'requiere_responsable': True,
        'requiere_area': True,
        'orden': 2,
    },
    # ... resto de tipos
]
```

---

### 2.3 Crear Modelo RolFirmante

**Problema:** `FIRMA_ROL_CHOICES` y `ROL_FIRMANTE_CHOICES` hardcodeados

**Acción:**

```python
# backend/apps/gestion_estrategica/identidad/models_config.py

class RolFirmante(TimestampedModel, OrderedModel):
    """
    Roles de firma configurables dinámicamente.
    """
    code = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        verbose_name='Código'
    )
    name = models.CharField(
        max_length=50,
        verbose_name='Nombre',
        help_text='Ej: Elaboró, Revisó, Aprobó'
    )
    description = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )

    # UI
    icon = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Icono'
    )
    color = models.CharField(
        max_length=20,
        default='gray',
        verbose_name='Color'
    )

    # Configuración
    es_obligatorio_default = models.BooleanField(
        default=True,
        verbose_name='¿Obligatorio por defecto?'
    )

    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'identidad_rol_firmante'
        verbose_name = 'Rol de Firmante'
        verbose_name_plural = 'Roles de Firmante'
        ordering = ['orden']
```

---

### 2.4 Crear Modelo EstadoFirma

```python
class EstadoFirma(TimestampedModel, OrderedModel):
    """
    Estados de firma configurables.
    """
    code = models.CharField(max_length=30, unique=True, db_index=True)
    label = models.CharField(max_length=50)
    color = models.CharField(max_length=20, default='gray')
    icon = models.CharField(max_length=50, blank=True)
    es_final = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'identidad_estado_firma'
        ordering = ['orden']
```

---

### 2.5 Crear Endpoints de Configuración

```python
# backend/apps/gestion_estrategica/identidad/views_config.py

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models_config import EstadoPolitica, TipoPolitica, RolFirmante, EstadoFirma
from .serializers_config import (
    EstadoPoliticaSerializer,
    TipoPoliticaSerializer,
    RolFirmanteSerializer,
    EstadoFirmaSerializer,
)

class EstadoPoliticaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Endpoint de solo lectura para estados de política.
    GET /api/identidad/estados-politica/
    """
    queryset = EstadoPolitica.objects.filter(is_active=True)
    serializer_class = EstadoPoliticaSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Sin paginación para configs

class TipoPoliticaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/identidad/tipos-politica/
    """
    queryset = TipoPolitica.objects.filter(is_active=True)
    serializer_class = TipoPoliticaSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

class RolFirmanteViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/identidad/roles-firmante/
    """
    queryset = RolFirmante.objects.filter(is_active=True)
    serializer_class = RolFirmanteSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

class EstadoFirmaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/identidad/estados-firma/
    """
    queryset = EstadoFirma.objects.filter(is_active=True)
    serializer_class = EstadoFirmaSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None
```

---

### 2.6 Actualizar Frontend para Consumir Configs

**Eliminar DEFAULT_TIPOS_POLITICA y usar API:**

```typescript
// frontend/src/features/gestion-estrategica/hooks/useConfigIdentidad.ts

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

// Query Keys centralizados
export const configKeys = {
  estadosPolitica: ['identidad', 'config', 'estados-politica'] as const,
  tiposPolitica: ['identidad', 'config', 'tipos-politica'] as const,
  rolesFirmante: ['identidad', 'config', 'roles-firmante'] as const,
  estadosFirma: ['identidad', 'config', 'estados-firma'] as const,
};

// Hooks
export const useEstadosPolitica = () => {
  return useQuery({
    queryKey: configKeys.estadosPolitica,
    queryFn: async () => {
      const { data } = await apiClient.get('/identidad/estados-politica/');
      return data;
    },
    staleTime: Infinity, // Configs no cambian frecuentemente
  });
};

export const useTiposPolitica = () => {
  return useQuery({
    queryKey: configKeys.tiposPolitica,
    queryFn: async () => {
      const { data } = await apiClient.get('/identidad/tipos-politica/');
      return data;
    },
    staleTime: Infinity,
  });
};

export const useRolesFirmante = () => {
  return useQuery({
    queryKey: configKeys.rolesFirmante,
    queryFn: async () => {
      const { data } = await apiClient.get('/identidad/roles-firmante/');
      return data;
    },
    staleTime: Infinity,
  });
};

export const useEstadosFirma = () => {
  return useQuery({
    queryKey: configKeys.estadosFirma,
    queryFn: async () => {
      const { data } = await apiClient.get('/identidad/estados-firma/');
      return data;
    },
    staleTime: Infinity,
  });
};
```

---

### Checklist Fase 2

- [ ] Crear archivo `models_config.py` con modelos dinámicos
- [ ] Crear migraciones para nuevas tablas
- [ ] Crear seeds para datos iniciales
- [ ] Ejecutar seeds: `python manage.py seed_estados_politica`
- [ ] Crear serializers para configs
- [ ] Crear ViewSets de solo lectura
- [ ] Registrar rutas en `urls.py`
- [ ] Crear hook `useConfigIdentidad.ts` en frontend
- [ ] Eliminar `DEFAULT_TIPOS_POLITICA` de usePoliticas.ts
- [ ] Actualizar tipos TypeScript para usar `string` en lugar de unions
- [ ] Actualizar componentes para usar configs dinámicos
- [ ] Tests de endpoints de configuración
- [ ] Commit: `feat(identidad): add dynamic configuration models`

---

## FASE 3: Valores Vividos - Arquitectura BI

### Objetivo
Estructurar el sistema de Valores Vividos como una herramienta de Business Intelligence robusta.

### 3.1 Dinamizar CHOICES de Valores Vividos

**Problema:** Múltiples CHOICES hardcodeados en models_valores_vividos.py:
- `IMPACTO_CHOICES` (líneas 49-54)
- `TIPO_VINCULO_CHOICES` (líneas 56-61)
- `CATEGORIA_ACCION_CHOICES` (líneas 63-85)

**Acción - Crear modelos dinámicos:**

```python
# backend/apps/gestion_estrategica/identidad/models_valores_config.py

class NivelImpacto(TimestampedModel, OrderedModel):
    """Niveles de impacto configurables para valores vividos."""
    code = models.CharField(max_length=20, unique=True)
    label = models.CharField(max_length=50)
    puntaje_default = models.PositiveSmallIntegerField(default=5)
    color = models.CharField(max_length=20, default='gray')
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'identidad_nivel_impacto'
        ordering = ['orden']

class TipoVinculo(TimestampedModel, OrderedModel):
    """Tipos de vínculo valor-acción configurables."""
    code = models.CharField(max_length=20, unique=True)
    label = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    peso_multiplicador = models.DecimalField(
        max_digits=3, decimal_places=2, default=1.0,
        help_text='Multiplicador para cálculos de BI'
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'identidad_tipo_vinculo'
        ordering = ['orden']

class CategoriaAccion(TimestampedModel, OrderedModel):
    """
    Categorías de acciones vinculables a valores.

    Permite agregar nuevas categorías sin modificar código.
    """
    code = models.CharField(max_length=30, unique=True)
    label = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    # Módulo al que pertenece (para filtros en UI)
    modulo = models.CharField(
        max_length=50,
        blank=True,
        help_text='Módulo del sistema (gestion_estrategica, hseq, etc.)'
    )

    # Content Types permitidos (para validación)
    content_types_permitidos = models.JSONField(
        default=list,
        help_text='Lista de app_label.model_name que pueden usar esta categoría'
    )

    icon = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=20, default='gray')
    es_prioritaria = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'identidad_categoria_accion'
        ordering = ['modulo', 'orden']
```

---

### 3.2 Mejorar ValorVivido para BI

**Actualizar modelo para usar FKs dinámicos:**

```python
# Actualizar ValorVivido en models_valores_vividos.py

class ValorVivido(AuditModel, SoftDeleteModel):
    # ... campos existentes ...

    # REEMPLAZAR campo categoria_accion (CharField con CHOICES)
    # POR:
    categoria = models.ForeignKey(
        'identidad.CategoriaAccion',
        on_delete=models.PROTECT,
        related_name='valores_vividos',
        verbose_name='Categoría'
    )

    # REEMPLAZAR campo tipo_vinculo (CharField con CHOICES)
    # POR:
    tipo_vinculo = models.ForeignKey(
        'identidad.TipoVinculo',
        on_delete=models.PROTECT,
        related_name='valores_vividos',
        verbose_name='Tipo de Vínculo'
    )

    # REEMPLAZAR campo impacto (CharField con CHOICES)
    # POR:
    impacto = models.ForeignKey(
        'identidad.NivelImpacto',
        on_delete=models.PROTECT,
        related_name='valores_vividos',
        verbose_name='Nivel de Impacto'
    )
```

---

### 3.3 Crear Dashboard de BI para Valores

**Nuevo endpoint de estadísticas avanzadas:**

```python
# backend/apps/gestion_estrategica/identidad/views_valores_bi.py

from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Avg, Sum, F
from django.db.models.functions import TruncMonth, TruncQuarter

class ValoresVividosDashboardView(APIView):
    """
    Dashboard de Business Intelligence para Valores Vividos.

    GET /api/identidad/valores-vividos/dashboard/

    Retorna:
    - Resumen general (total acciones, valores más vividos)
    - Tendencia temporal (últimos 12 meses)
    - Distribución por categoría
    - Valores subrepresentados
    - Top áreas por valor
    """

    def get(self, request):
        empresa_id = request.user.empresa_id

        # Resumen general
        resumen = self._get_resumen(empresa_id)

        # Tendencia mensual
        tendencia = self._get_tendencia_mensual(empresa_id)

        # Por categoría
        categorias = self._get_por_categoria(empresa_id)

        # Valores subrepresentados
        subrepresentados = self._get_subrepresentados(empresa_id)

        # Top áreas
        top_areas = self._get_top_areas(empresa_id)

        return Response({
            'resumen': resumen,
            'tendencia_mensual': tendencia,
            'distribucion_categorias': categorias,
            'valores_subrepresentados': subrepresentados,
            'top_areas': top_areas,
        })

    def _get_resumen(self, empresa_id):
        qs = ValorVivido.objects.por_empresa(empresa_id)
        return {
            'total_vinculos': qs.count(),
            'valores_activos': qs.values('valor').distinct().count(),
            'puntaje_promedio': qs.aggregate(avg=Avg('puntaje'))['avg'] or 0,
            'vinculos_verificados': qs.filter(verificado=True).count(),
        }

    # ... resto de métodos
```

---

### 3.4 Widget de Vinculación Universal

**Componente React reutilizable:**

```typescript
// frontend/src/components/common/ValorVinculadorWidget.tsx

interface ValorVinculadorWidgetProps {
  contentType: string;  // 'gestion_estrategica.proyecto'
  objectId: number;
  categoria: string;    // Código de categoría
  readOnly?: boolean;
}

export const ValorVinculadorWidget: React.FC<ValorVinculadorWidgetProps> = ({
  contentType,
  objectId,
  categoria,
  readOnly = false,
}) => {
  const { data: valores } = useValoresCorporativos();
  const { data: vinculosExistentes } = useValoresVinculados(contentType, objectId);
  const vincularMutation = useVincularValor();
  const desvincularMutation = useDesvincularValor();

  // ... implementación del widget
};
```

---

### Checklist Fase 3

- [ ] Crear modelos dinámicos para configs de valores vividos
- [ ] Migrar datos existentes a nuevas tablas
- [ ] Actualizar ValorVivido para usar FKs
- [ ] Crear endpoints de dashboard BI
- [ ] Actualizar frontend para configs dinámicas
- [ ] Crear ValorVinculadorWidget reutilizable
- [ ] Integrar widget en módulos existentes (Proyectos, Acciones Correctivas, etc.)
- [ ] Tests de endpoints BI
- [ ] Commit: `feat(valores-vividos): implement dynamic BI dashboard`

---

## FASE 4: Integración Gestor Documental

### Objetivo
Profesionalizar el flujo IDENTIDAD → GESTOR DOCUMENTAL para políticas.

### 4.1 Definir Contrato de Integración

**Flujo de Estados:**
```
IDENTIDAD                          GESTOR DOCUMENTAL
=========                          =================
BORRADOR → EN_REVISION → FIRMADO → [Enviar] → Recibe documento
                                              ↓
                                   Asigna código oficial (POL-SST-001)
                                   Publica documento
                                              ↓
                              [Callback] ← Notifica publicación
                                              ↓
VIGENTE ← Actualiza estado
         Guarda documento_id
         Guarda code oficial
```

---

### 4.2 Crear Servicio de Integración

```python
# backend/apps/gestion_estrategica/identidad/services/gestor_documental.py

from typing import Optional, Dict, Any
from django.conf import settings
import requests
import logging

logger = logging.getLogger(__name__)

class GestorDocumentalService:
    """
    Servicio de integración con el módulo Gestor Documental.

    Maneja el envío de políticas firmadas para publicación oficial.
    """

    def __init__(self):
        self.base_url = settings.GESTOR_DOCUMENTAL_URL
        self.timeout = settings.GESTOR_DOCUMENTAL_TIMEOUT

    def enviar_politica(
        self,
        politica: 'PoliticaEspecifica',
        usuario: 'User',
        clasificacion: str = 'INTERNO',
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Envía una política firmada al Gestor Documental.

        Args:
            politica: Instancia de PoliticaEspecifica con status=FIRMADO
            usuario: Usuario que realiza el envío
            clasificacion: Nivel de clasificación del documento
            metadata: Metadatos adicionales

        Returns:
            Dict con información del documento creado:
            {
                'documento_id': 123,
                'code': 'POL-SST-001',
                'url': '/gestor-documental/documentos/123/',
                'version': '1.0',
            }

        Raises:
            GestorDocumentalError: Si hay error en la comunicación
        """
        if politica.status != 'FIRMADO':
            raise ValueError(f"Solo políticas FIRMADAS pueden enviarse. Estado actual: {politica.status}")

        payload = self._construir_payload(politica, clasificacion, metadata)

        try:
            response = self._post('/api/documentos/crear-desde-politica/', payload)

            # Actualizar política con datos del gestor
            politica.documento_id = response['documento_id']
            politica.code = response['code']
            politica.status = 'VIGENTE'
            politica.effective_date = timezone.now().date()
            politica.save(update_fields=[
                'documento_id', 'code', 'status', 'effective_date', 'updated_at'
            ])

            # Registrar en historial
            HistorialVersion.crear_version(
                documento=politica,
                tipo_cambio='PUBLICACION',
                usuario=usuario,
                descripcion=f'Publicado en Gestor Documental con código {response["code"]}'
            )

            return response

        except requests.RequestException as e:
            logger.error(f"Error enviando política {politica.id} a Gestor Documental: {e}")
            raise GestorDocumentalError(f"Error de comunicación: {str(e)}")

    def _construir_payload(self, politica, clasificacion, metadata):
        """Construye el payload para el Gestor Documental."""
        return {
            'origen': 'IDENTIDAD_CORPORATIVA',
            'tipo_origen': 'POLITICA_ESPECIFICA',
            'origen_id': politica.id,
            'titulo': politica.title,
            'contenido': politica.content,
            'version': politica.version,
            'tipo_documento': 'POLITICA',
            'clasificacion': clasificacion,
            'norma_iso_id': politica.norma_iso_id,
            'area_id': politica.area_id,
            'responsable_id': politica.responsible_id,
            'firmas': self._obtener_firmas(politica),
            'metadata': metadata or {},
        }

    def _obtener_firmas(self, politica):
        """Obtiene las firmas digitales de la política."""
        from django.contrib.contenttypes.models import ContentType
        from .models_workflow import FirmaDigital

        content_type = ContentType.objects.get_for_model(politica)
        firmas = FirmaDigital.objects.filter(
            content_type=content_type,
            object_id=politica.id,
            status='FIRMADO'
        ).select_related('firmante', 'cargo')

        return [
            {
                'rol': f.rol_firma,
                'firmante_id': f.firmante_id,
                'firmante_nombre': f.firmante.get_full_name(),
                'cargo': f.cargo.nombre if f.cargo else None,
                'fecha_firma': f.fecha_firma.isoformat(),
                'hash': f.firma_hash,
            }
            for f in firmas
        ]

    def _post(self, endpoint: str, data: dict) -> dict:
        """Realiza POST al Gestor Documental."""
        url = f"{self.base_url}{endpoint}"
        response = requests.post(
            url,
            json=data,
            timeout=self.timeout,
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json()

    def _get_headers(self):
        """Headers para autenticación interna."""
        return {
            'Content-Type': 'application/json',
            'X-Internal-Service': 'identidad-corporativa',
            'X-Service-Key': settings.INTERNAL_SERVICE_KEY,
        }


class GestorDocumentalError(Exception):
    """Error en la integración con Gestor Documental."""
    pass
```

---

### 4.3 Endpoint de Envío a Documental

```python
# En views.py - actualizar acción enviar_a_documental

@action(detail=True, methods=['post'], url_path='enviar-a-documental')
def enviar_a_documental(self, request, pk=None):
    """
    Envía una política FIRMADA al Gestor Documental.

    POST /api/identidad/politicas-especificas/{id}/enviar-a-documental/

    Body:
    {
        "clasificacion": "INTERNO",  // PUBLICO, INTERNO, CONFIDENCIAL, RESTRINGIDO
        "mensaje": "Política lista para publicación"
    }

    Response:
    {
        "detail": "Política enviada exitosamente al Gestor Documental",
        "documento_id": 123,
        "code": "POL-SST-001",
        "url": "/gestor-documental/documentos/123/"
    }
    """
    politica = self.get_object()

    if politica.status != 'FIRMADO':
        return Response(
            {'error': f'Solo políticas FIRMADAS pueden enviarse. Estado actual: {politica.get_status_display()}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = EnviarADocumentalSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    service = GestorDocumentalService()

    try:
        resultado = service.enviar_politica(
            politica=politica,
            usuario=request.user,
            clasificacion=serializer.validated_data.get('clasificacion', 'INTERNO'),
            metadata={'mensaje': serializer.validated_data.get('mensaje', '')}
        )

        return Response({
            'detail': 'Política enviada exitosamente al Gestor Documental',
            **resultado
        })

    except GestorDocumentalError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
```

---

### 4.4 Webhook de Callback

```python
# backend/apps/gestion_estrategica/identidad/views_webhooks.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@method_decorator(csrf_exempt, name='dispatch')
class GestorDocumentalCallbackView(APIView):
    """
    Webhook para recibir callbacks del Gestor Documental.

    POST /api/identidad/webhooks/gestor-documental/
    """
    permission_classes = [AllowAny]  # Validación por token interno

    def post(self, request):
        # Validar token interno
        if not self._validate_service_token(request):
            return Response({'error': 'Unauthorized'}, status=401)

        event = request.data.get('event')
        payload = request.data.get('payload', {})

        handlers = {
            'documento.publicado': self._handle_documento_publicado,
            'documento.actualizado': self._handle_documento_actualizado,
            'documento.obsoleto': self._handle_documento_obsoleto,
        }

        handler = handlers.get(event)
        if handler:
            return handler(payload)

        return Response({'status': 'ignored', 'event': event})

    def _handle_documento_publicado(self, payload):
        """Maneja evento de documento publicado."""
        origen_id = payload.get('origen_id')
        code = payload.get('code')
        documento_id = payload.get('documento_id')

        try:
            politica = PoliticaEspecifica.objects.get(id=origen_id)
            politica.code = code
            politica.documento_id = documento_id
            politica.status = 'VIGENTE'
            politica.save(update_fields=['code', 'documento_id', 'status', 'updated_at'])

            return Response({'status': 'processed'})
        except PoliticaEspecifica.DoesNotExist:
            return Response({'error': 'Política no encontrada'}, status=404)

    def _validate_service_token(self, request):
        """Valida el token de servicio interno."""
        token = request.headers.get('X-Service-Key')
        return token == settings.INTERNAL_SERVICE_KEY
```

---

### Checklist Fase 4

- [ ] Crear GestorDocumentalService
- [ ] Actualizar endpoint enviar_a_documental
- [ ] Crear webhook de callback
- [ ] Agregar configuración en settings.py
- [ ] Crear serializers para requests/responses
- [ ] Tests de integración (mock del servicio)
- [ ] Documentar contrato de API
- [ ] Commit: `feat(identidad): professional integration with document manager`

---

## FASE 5: Consolidación Frontend

### Objetivo
Reducir tamaño de archivos, extraer componentes y mejorar modularidad.

### 5.1 Dividir IdentidadTab.tsx

**Problema:** Archivo de 435 líneas con 3 componentes internos.

**Acción:**
```
frontend/src/features/gestion-estrategica/components/identidad/
├── MisionVisionSection.tsx      # Extraído de IdentidadTab
├── ValoresSection.tsx           # Extraído de IdentidadTab
├── PoliticasSection.tsx         # Extraído de IdentidadTab
├── IdentidadTab.tsx             # Orquestador (importa los anteriores)
└── index.ts                     # Exports
```

---

### 5.2 Dividir ValoresDragDrop.tsx

**Problema:** Archivo de 780 líneas con componentes internos grandes.

**Acción:**
```
frontend/src/features/gestion-estrategica/components/valores/
├── SortableValueItem.tsx        # Extraído
├── SortableValueCard.tsx        # Extraído
├── ValueFormInline.tsx          # Formulario de creación/edición
├── ValoresDragDrop.tsx          # Orquestador
└── index.ts
```

---

### 5.3 Normalizar Nomenclatura

**Problema:** EN_REVISION muestra "En Firma" en algunos lugares y "En Revisión" en otros.

**Acción:**
1. Definir label oficial en BD: "En Revisión"
2. Actualizar todos los componentes para usar config desde BD
3. Si necesita mostrar "Esperando firmas", usar campo `description`, no `label`

---

### Checklist Fase 5

- [ ] Extraer MisionVisionSection.tsx
- [ ] Extraer ValoresSection.tsx
- [ ] Extraer PoliticasSection.tsx
- [ ] Extraer SortableValueItem.tsx
- [ ] Extraer SortableValueCard.tsx
- [ ] Actualizar imports en archivos originales
- [ ] Verificar que tests siguen pasando
- [ ] Commit: `refactor(frontend): modularize identity components`

---

## FASE 6: Consolidación Hooks y API

### Objetivo
Eliminar redundancia en hooks, centralizar query keys y crear factories.

### 6.1 Centralizar Query Keys

```typescript
// frontend/src/features/gestion-estrategica/lib/queryKeys.ts

export const identidadKeys = {
  // Base
  all: ['identidad'] as const,

  // Identidad Corporativa
  identities: () => [...identidadKeys.all, 'identities'] as const,
  identity: (id: number) => [...identidadKeys.all, 'identity', id] as const,
  activeIdentity: () => [...identidadKeys.all, 'active'] as const,

  // Valores
  values: (identityId?: number) => [...identidadKeys.all, 'values', identityId] as const,
  value: (id: number) => [...identidadKeys.all, 'value', id] as const,

  // Políticas
  politicasIntegrales: (filters?: object) => [...identidadKeys.all, 'politicas-integrales', filters] as const,
  politicasEspecificas: (filters?: object) => [...identidadKeys.all, 'politicas-especificas', filters] as const,
  politica: (id: number) => [...identidadKeys.all, 'politica', id] as const,

  // Alcances
  alcances: (filters?: object) => [...identidadKeys.all, 'alcances', filters] as const,
  alcance: (id: number) => [...identidadKeys.all, 'alcance', id] as const,

  // Workflow
  firmasPendientes: (esMiTurno?: boolean) => [...identidadKeys.all, 'firmas-pendientes', esMiTurno] as const,
  firmasDocumento: (contentType: number, objectId: number) =>
    [...identidadKeys.all, 'firmas-documento', contentType, objectId] as const,

  // Valores Vividos
  valoresVividos: (filters?: object) => [...identidadKeys.all, 'valores-vividos', filters] as const,
  dashboardBI: () => [...identidadKeys.all, 'valores-vividos', 'dashboard'] as const,

  // Configuración
  config: {
    estados: () => [...identidadKeys.all, 'config', 'estados'] as const,
    tipos: () => [...identidadKeys.all, 'config', 'tipos'] as const,
    roles: () => [...identidadKeys.all, 'config', 'roles'] as const,
  },
} as const;
```

---

### 6.2 Crear Factory de Hooks CRUD

```typescript
// frontend/src/lib/hooks/createCrudHooks.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface CrudConfig<T, CreateDTO, UpdateDTO> {
  entityName: string;
  queryKey: readonly unknown[];
  api: {
    getAll: (filters?: object) => Promise<{ results: T[] }>;
    getById: (id: number) => Promise<T>;
    create: (data: CreateDTO) => Promise<T>;
    update: (id: number, data: UpdateDTO) => Promise<T>;
    delete: (id: number) => Promise<void>;
  };
  messages?: {
    createSuccess?: string;
    updateSuccess?: string;
    deleteSuccess?: string;
    error?: string;
  };
}

export function createCrudHooks<T, CreateDTO, UpdateDTO>(
  config: CrudConfig<T, CreateDTO, UpdateDTO>
) {
  const { entityName, queryKey, api, messages } = config;

  const useList = (filters?: object) => {
    return useQuery({
      queryKey: [...queryKey, filters],
      queryFn: () => api.getAll(filters),
    });
  };

  const useDetail = (id: number, enabled = true) => {
    return useQuery({
      queryKey: [...queryKey, id],
      queryFn: () => api.getById(id),
      enabled,
    });
  };

  const useCreate = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: api.create,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
        toast.success(messages?.createSuccess || `${entityName} creado exitosamente`);
      },
      onError: () => {
        toast.error(messages?.error || `Error al crear ${entityName}`);
      },
    });
  };

  const useUpdate = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: number; data: UpdateDTO }) =>
        api.update(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
        toast.success(messages?.updateSuccess || `${entityName} actualizado exitosamente`);
      },
      onError: () => {
        toast.error(messages?.error || `Error al actualizar ${entityName}`);
      },
    });
  };

  const useDelete = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: api.delete,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
        toast.success(messages?.deleteSuccess || `${entityName} eliminado exitosamente`);
      },
      onError: () => {
        toast.error(messages?.error || `Error al eliminar ${entityName}`);
      },
    });
  };

  return {
    useList,
    useDetail,
    useCreate,
    useUpdate,
    useDelete,
  };
}
```

**Uso:**

```typescript
// frontend/src/features/gestion-estrategica/hooks/usePoliticasEspecificas.ts

import { createCrudHooks } from '@/lib/hooks/createCrudHooks';
import { identidadKeys } from '../lib/queryKeys';
import { politicasEspecificasApi } from '../api/strategicApi';
import type { PoliticaEspecifica, CreatePoliticaDTO, UpdatePoliticaDTO } from '../types';

export const {
  useList: usePoliticasEspecificas,
  useDetail: usePoliticaEspecifica,
  useCreate: useCreatePoliticaEspecifica,
  useUpdate: useUpdatePoliticaEspecifica,
  useDelete: useDeletePoliticaEspecifica,
} = createCrudHooks<PoliticaEspecifica, CreatePoliticaDTO, UpdatePoliticaDTO>({
  entityName: 'Política',
  queryKey: identidadKeys.politicasEspecificas(),
  api: politicasEspecificasApi,
  messages: {
    createSuccess: 'Política creada exitosamente',
    updateSuccess: 'Política actualizada exitosamente',
    deleteSuccess: 'Política eliminada exitosamente',
  },
});
```

---

### 6.3 Consolidar useNormasISO

**Problema:** Duplicado en useStrategic.ts y usePoliticas.ts

**Acción:**
1. Mantener solo en useStrategic.ts
2. Eliminar de usePoliticas.ts
3. Actualizar imports en componentes

---

### Checklist Fase 6

- [ ] Crear archivo queryKeys.ts centralizado
- [ ] Crear factory createCrudHooks.ts
- [ ] Refactorizar hooks existentes para usar factory
- [ ] Eliminar hooks duplicados
- [ ] Consolidar useNormasISO
- [ ] Actualizar todos los imports
- [ ] Verificar que invalidaciones funcionan
- [ ] Commit: `refactor(hooks): consolidate with factory pattern`

---

## FASE 7: Documentación y Preparación

### Objetivo
Consolidar documentación y preparar para la siguiente aplicación.

### 7.1 Actualizar Documentación

- [ ] Actualizar `docs/IDENTIDAD-CORPORATIVA-DOCUMENTACION-COMPLETA.md`
- [ ] Actualizar `backend/apps/gestion_estrategica/identidad/README_WORKFLOW.md`
- [ ] Crear `docs/INTEGRACION-GESTOR-DOCUMENTAL.md`
- [ ] Actualizar `docs/00-EMPEZAR-AQUI.md` con nueva versión

### 7.2 Crear Tests

- [ ] Tests de modelos dinámicos
- [ ] Tests de endpoints de configuración
- [ ] Tests de integración con Gestor Documental (mock)
- [ ] Tests de hooks con factory

### 7.3 Checklist Final Pre-Deploy

- [ ] Todas las migraciones aplicadas
- [ ] Seeds ejecutados
- [ ] Tests pasando
- [ ] Build de frontend exitoso
- [ ] No hay warnings de TypeScript
- [ ] Documentación actualizada

---

## Dependencias Entre Fases

```
FASE 1 ──────────────────────────────────────┐
(Limpieza)                                    │
                                              ▼
FASE 2 ─────────────────────────────────────► FASE 3
(Dinamización)                                (Valores Vividos BI)
         │
         │
         ▼
FASE 4 ──────────────────────────────────────┐
(Gestor Documental)                           │
                                              ▼
FASE 5 ◄──────────────────────────────────── FASE 6
(Frontend)                                    (Hooks)
         │
         │
         ▼
      FASE 7
      (Docs)
```

---

## Estimación de Esfuerzo

| Fase | Complejidad | Archivos | Riesgo |
|------|-------------|----------|--------|
| 1 | Baja | ~15 | Bajo |
| 2 | Alta | ~25 | Medio (migraciones) |
| 3 | Media | ~10 | Bajo |
| 4 | Media | ~8 | Medio (integración) |
| 5 | Baja | ~10 | Bajo |
| 6 | Media | ~15 | Bajo |
| 7 | Baja | ~5 | Ninguno |

---

## Notas Finales

1. **Ejecutar en orden**: Las fases tienen dependencias
2. **Commits atómicos**: Un commit por sub-tarea completada
3. **Tests primero**: Escribir tests antes de modificar código crítico
4. **Backup de BD**: Antes de migraciones destructivas
5. **Feature flags**: Considerar para cambios grandes

---

**Documento creado:** 2026-01-11
**Autor:** Sistema de Auditoría StrateKaz
**Aprobado por:** [Pendiente]
