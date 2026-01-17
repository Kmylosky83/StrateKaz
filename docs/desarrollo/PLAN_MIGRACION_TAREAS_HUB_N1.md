# Plan de Migración: Gestor de Tareas → Hub Centralizado N1

**Fecha**: 2026-01-17
**Módulo Origen**: `apps/audit_system/tareas_recordatorios/`
**Módulo Destino**: `apps/gestion_estrategica/gestion_tareas/`
**Objetivo**: Crear HUB centralizado de tareas para TODO el sistema

---

## 1. ESTADO ACTUAL

### 1.1 Ubicación Actual
```
apps/audit_system/tareas_recordatorios/
├── __init__.py
├── admin.py
├── apps.py
├── models.py          (Tarea, Recordatorio, EventoCalendario, ComentarioTarea)
├── serializers.py
├── views.py
├── urls.py
├── migrations/
│   └── 0001_initial.py
└── tests/
    ├── conftest.py
    ├── test_models.py
    └── test_views.py
```

### 1.2 Modelos Existentes

**Tarea** (modelo principal):
- `titulo`, `descripcion`
- `tipo`: manual, automatica, recurrente
- `prioridad`: baja, normal, alta, urgente
- `estado`: pendiente, en_progreso, completada, cancelada, vencida
- `asignado_a`, `creado_por`
- `fecha_limite`, `fecha_completada`
- `content_type`, `object_id` (GenericForeignKey existente pero limitado)
- `url_relacionada`
- `porcentaje_avance`

**Recordatorio**:
- Vinculado a Tarea (opcional)
- `fecha_recordatorio`, `repetir`
- `dias_repeticion`, `hora_repeticion`

**EventoCalendario**:
- Eventos independientes
- `tipo`: reunion, capacitacion, auditoria, mantenimiento
- `participantes` (ManyToMany)
- `fecha_inicio`, `fecha_fin`

**ComentarioTarea**:
- Comentarios en tareas
- `archivo_adjunto`

### 1.3 Dependencias Identificadas

**Importaciones externas**:
```python
# apps/workflow_engine/firma_digital/models.py (líneas 200-230)
tarea_asociada = models.ForeignKey(
    'tareas_recordatorios.Tarea',
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name='firmas_flujo',
    verbose_name='Tarea Asociada'
)
```

**Configuración**:
```python
# config/settings.py:213
INSTALLED_APPS = [
    'apps.audit_system.tareas_recordatorios',
]
```

---

## 2. DISEÑO DEL HUB CENTRALIZADO

### 2.1 Nueva Estructura
```
apps/gestion_estrategica/gestion_tareas/
├── __init__.py
├── admin.py
├── apps.py
├── models/
│   ├── __init__.py
│   ├── tarea.py               # Modelo Tarea mejorado
│   ├── recordatorio.py
│   ├── evento.py
│   ├── comentario.py
│   └── integraciones.py       # Vinculaciones con otros módulos
├── serializers/
│   ├── __init__.py
│   ├── tarea_serializers.py
│   ├── recordatorio_serializers.py
│   ├── evento_serializers.py
│   └── kanban_serializers.py
├── viewsets/
│   ├── __init__.py
│   ├── tarea_viewsets.py
│   ├── kanban_viewsets.py
│   └── calendario_viewsets.py
├── signals/
│   ├── __init__.py
│   └── sincronizacion.py      # Sincronización bidireccional
├── migrations/
├── tests/
└── urls.py
```

### 2.2 Modelo Tarea Mejorado

**Nuevo campo `origen_tipo`** para vincular tareas a múltiples módulos:

```python
# apps/gestion_estrategica/gestion_tareas/models/tarea.py

from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from apps.core.base_models import BaseCompanyModel

ORIGEN_TIPO_CHOICES = [
    # Nivel 1 - Gestión Estratégica
    ('PROYECTO', 'Proyecto'),
    ('OBJETIVO_ESTRATEGICO', 'Objetivo Estratégico'),
    ('INDICADOR', 'Indicador (KPI)'),
    ('REVISION_DIRECCION', 'Revisión por la Dirección'),

    # Nivel 2 - Gestión de Calidad (HSEQ)
    ('PLAN_HSEQ', 'Plan HSEQ'),
    ('ACCION_CORRECTIVA', 'Acción Correctiva'),
    ('ACCION_PREVENTIVA', 'Acción Preventiva'),
    ('ACCION_MEJORA', 'Acción de Mejora'),
    ('HALLAZGO_AUDITORIA', 'Hallazgo de Auditoría'),
    ('RIESGO', 'Gestión de Riesgo'),
    ('OPORTUNIDAD', 'Oportunidad de Mejora'),

    # Nivel 3 - SST
    ('CAPACITACION_SST', 'Capacitación SST'),
    ('INSPECCION_SST', 'Inspección SST'),
    ('INCIDENTE', 'Incidente/Accidente'),

    # Nivel 4 - PESV
    ('MANTENIMIENTO_VEHICULO', 'Mantenimiento Vehículo'),
    ('INSPECCION_PREOPERACIONAL', 'Inspección Preoperacional'),
    ('CAPACITACION_PESV', 'Capacitación PESV'),

    # Nivel 5 - Cumplimiento Legal
    ('REQUISITO_LEGAL', 'Requisito Legal'),
    ('EVALUACION_CUMPLIMIENTO', 'Evaluación de Cumplimiento'),

    # Nivel 6 - Sistema de Auditoría
    ('AUDITORIA_INTERNA', 'Auditoría Interna'),
    ('AUDITORIA_EXTERNA', 'Auditoría Externa'),
    ('PLAN_AUDITORIA', 'Plan de Auditoría'),

    # General
    ('MANUAL', 'Tarea Manual'),
    ('OTRO', 'Otro'),
]

ESTADO_KANBAN_CHOICES = [
    ('BACKLOG', 'Backlog'),
    ('TODO', 'Por Hacer'),
    ('IN_PROGRESS', 'En Progreso'),
    ('IN_REVIEW', 'En Revisión'),
    ('DONE', 'Completado'),
    ('CANCELLED', 'Cancelado'),
]

class Tarea(BaseCompanyModel):
    """
    HUB CENTRALIZADO DE TAREAS
    Todas las tareas del sistema convergen aquí
    """

    # Información básica
    titulo = models.CharField(max_length=500, verbose_name='Título')
    descripcion = models.TextField(verbose_name='Descripción')
    codigo = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
        verbose_name='Código de Tarea',
        help_text='Generado automáticamente: TSK-2026-001'
    )

    # Clasificación
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_TAREA_CHOICES,
        default='manual',
        db_index=True
    )
    prioridad = models.CharField(
        max_length=10,
        choices=PRIORIDAD_TAREA_CHOICES,
        default='normal',
        db_index=True
    )

    # Estado Kanban
    estado_kanban = models.CharField(
        max_length=20,
        choices=ESTADO_KANBAN_CHOICES,
        default='TODO',
        db_index=True,
        verbose_name='Estado Kanban'
    )
    orden_kanban = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden en Columna Kanban'
    )

    # Estado legado (mantener compatibilidad)
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_TAREA_CHOICES,
        default='pendiente',
        db_index=True
    )

    # Asignación
    asignado_a = models.ForeignKey(
        'core.User',
        on_delete=models.CASCADE,
        related_name='tareas_asignadas',
        verbose_name='Asignado a'
    )
    creado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='tareas_creadas',
        verbose_name='Creado por'
    )

    # Fechas
    fecha_limite = models.DateTimeField(verbose_name='Fecha Límite', db_index=True)
    fecha_inicio = models.DateTimeField(null=True, blank=True, verbose_name='Fecha Inicio')
    fecha_completada = models.DateTimeField(null=True, blank=True, verbose_name='Fecha Completada')

    # VINCULACIÓN POLIMÓRFICA (GenericForeignKey)
    origen_tipo = models.CharField(
        max_length=50,
        choices=ORIGEN_TIPO_CHOICES,
        db_index=True,
        verbose_name='Tipo de Origen',
        help_text='Módulo/entidad que generó la tarea'
    )

    # GenericForeignKey para vincular a cualquier modelo
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name='Tipo de Contenido'
    )
    object_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name='ID del Objeto'
    )
    origen_objeto = GenericForeignKey('content_type', 'object_id')

    # Metadatos del origen
    origen_metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Metadata del Origen',
        help_text='Información adicional del módulo origen'
    )

    # URL para redirección
    url_relacionada = models.CharField(
        max_length=500,
        null=True,
        blank=True,
        verbose_name='URL Relacionada'
    )

    # Progreso
    porcentaje_avance = models.PositiveIntegerField(
        default=0,
        verbose_name='Porcentaje de Avance'
    )
    notas = models.TextField(null=True, blank=True, verbose_name='Notas')

    # Etiquetas y categorización
    etiquetas = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Etiquetas',
        help_text='Lista de etiquetas para filtrado'
    )

    # Estimación de esfuerzo
    tiempo_estimado = models.DurationField(
        null=True,
        blank=True,
        verbose_name='Tiempo Estimado',
        help_text='Duración estimada de la tarea'
    )
    tiempo_real = models.DurationField(
        null=True,
        blank=True,
        verbose_name='Tiempo Real',
        help_text='Duración real de la tarea'
    )

    # Control de sincronización
    sincronizado = models.BooleanField(
        default=True,
        verbose_name='Sincronizado con Origen',
        help_text='Indica si está sincronizado con el módulo origen'
    )
    ultima_sincronizacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Última Sincronización'
    )

    class Meta:
        db_table = 'gestion_tareas_tarea'
        verbose_name = 'Tarea'
        verbose_name_plural = 'Tareas'
        ordering = ['orden_kanban', '-fecha_limite']
        indexes = [
            models.Index(fields=['empresa', 'estado_kanban', 'orden_kanban']),
            models.Index(fields=['asignado_a', 'estado', '-fecha_limite']),
            models.Index(fields=['origen_tipo', 'object_id']),
            models.Index(fields=['empresa', 'origen_tipo', 'estado_kanban']),
        ]

    def __str__(self):
        return f'{self.codigo} - {self.titulo}'

    def save(self, *args, **kwargs):
        if not self.codigo:
            self.codigo = self.generar_codigo()

        # Sincronizar estado legado con Kanban
        self.sincronizar_estados()

        super().save(*args, **kwargs)

    def generar_codigo(self):
        """Generar código único TSK-YYYY-NNN"""
        from django.utils import timezone
        year = timezone.now().year
        count = Tarea.objects.filter(
            empresa=self.empresa,
            created_at__year=year
        ).count() + 1
        return f"TSK-{year}-{count:04d}"

    def sincronizar_estados(self):
        """Sincronizar estado Kanban con estado legado"""
        estado_map = {
            'BACKLOG': 'pendiente',
            'TODO': 'pendiente',
            'IN_PROGRESS': 'en_progreso',
            'IN_REVIEW': 'en_progreso',
            'DONE': 'completada',
            'CANCELLED': 'cancelada',
        }
        if self.estado_kanban in estado_map:
            self.estado = estado_map[self.estado_kanban]

    def completar(self):
        """Marca la tarea como completada"""
        from django.utils import timezone
        self.estado = 'completada'
        self.estado_kanban = 'DONE'
        self.fecha_completada = timezone.now()
        self.porcentaje_avance = 100
        self.save(update_fields=[
            'estado', 'estado_kanban', 'fecha_completada', 'porcentaje_avance'
        ])
```

### 2.3 Sistema de Sincronización Bidireccional

```python
# apps/gestion_estrategica/gestion_tareas/signals/sincronizacion.py

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from apps.gestion_estrategica.gestion_tareas.models import Tarea

@receiver(post_save, sender=Tarea)
def sincronizar_tarea_a_origen(sender, instance, created, **kwargs):
    """
    Sincroniza cambios de estado de tarea hacia el módulo origen
    """
    if not instance.origen_objeto:
        return

    # Evitar loop infinito
    if kwargs.get('skip_sync'):
        return

    origen_modelo = instance.origen_objeto.__class__.__name__

    # Mapa de sincronizaciones por módulo
    sync_handlers = {
        'AccionCorrectiva': sync_to_accion_correctiva,
        'PlanHSEQ': sync_to_plan_hseq,
        'Proyecto': sync_to_proyecto,
        'HallazgoAuditoria': sync_to_hallazgo_auditoria,
        'MantenimientoVehiculo': sync_to_mantenimiento_vehiculo,
        # ... agregar más según necesidad
    }

    handler = sync_handlers.get(origen_modelo)
    if handler:
        handler(instance)

    # Actualizar marca de sincronización
    from django.utils import timezone
    Tarea.objects.filter(pk=instance.pk).update(
        sincronizado=True,
        ultima_sincronizacion=timezone.now()
    )


def sync_to_accion_correctiva(tarea):
    """Sincronizar con Acciones Correctivas"""
    accion = tarea.origen_objeto

    # Sincronizar estado
    if tarea.estado_kanban == 'DONE':
        accion.estado = 'CERRADA'
    elif tarea.estado_kanban == 'IN_PROGRESS':
        accion.estado = 'EN_EJECUCION'

    # Sincronizar fechas
    accion.fecha_cierre_real = tarea.fecha_completada

    accion.save(skip_sync=True)


def sync_to_plan_hseq(tarea):
    """Sincronizar con Plan HSEQ"""
    plan = tarea.origen_objeto

    # Actualizar porcentaje de avance
    plan.porcentaje_avance = tarea.porcentaje_avance

    if tarea.estado_kanban == 'DONE':
        plan.estado = 'EJECUTADA'

    plan.save(skip_sync=True)


def sync_to_proyecto(tarea):
    """Sincronizar con Proyectos"""
    proyecto = tarea.origen_objeto

    # Recalcular progreso del proyecto basado en todas sus tareas
    tareas_proyecto = Tarea.objects.filter(
        content_type=ContentType.objects.get_for_model(proyecto),
        object_id=str(proyecto.id)
    )

    total = tareas_proyecto.count()
    completadas = tareas_proyecto.filter(estado_kanban='DONE').count()

    if total > 0:
        proyecto.porcentaje_completado = (completadas / total) * 100
        proyecto.save(skip_sync=True)


def sync_to_hallazgo_auditoria(tarea):
    """Sincronizar con Hallazgos de Auditoría"""
    hallazgo = tarea.origen_objeto

    if tarea.estado_kanban == 'DONE':
        hallazgo.estado = 'CERRADO'
        hallazgo.fecha_cierre = tarea.fecha_completada

    hallazgo.save(skip_sync=True)


def sync_to_mantenimiento_vehiculo(tarea):
    """Sincronizar con Mantenimiento de Vehículos (PESV)"""
    mantenimiento = tarea.origen_objeto

    if tarea.estado_kanban == 'DONE':
        mantenimiento.estado = 'COMPLETADO'
        mantenimiento.fecha_realizacion = tarea.fecha_completada

    mantenimiento.save(skip_sync=True)


# ==============================================================================
# SINCRONIZACIÓN DESDE MÓDULOS ORIGEN → TAREAS HUB
# ==============================================================================

def crear_tarea_desde_accion_correctiva(accion_correctiva):
    """
    Crea tarea automática cuando se crea una Acción Correctiva
    """
    from apps.gestion_estrategica.gestion_tareas.models import Tarea
    from django.contrib.contenttypes.models import ContentType

    tarea = Tarea.objects.create(
        empresa=accion_correctiva.empresa,
        titulo=f"AC: {accion_correctiva.descripcion[:100]}",
        descripcion=accion_correctiva.descripcion_completa,
        origen_tipo='ACCION_CORRECTIVA',
        content_type=ContentType.objects.get_for_model(accion_correctiva),
        object_id=str(accion_correctiva.id),
        asignado_a=accion_correctiva.responsable,
        creado_por=accion_correctiva.creado_por,
        fecha_limite=accion_correctiva.fecha_cierre_planificada,
        prioridad='alta' if accion_correctiva.es_critica else 'normal',
        estado_kanban='TODO',
        origen_metadata={
            'modulo': 'HSEQ',
            'tipo_accion': 'correctiva',
            'hallazgo_id': str(accion_correctiva.hallazgo_id) if accion_correctiva.hallazgo_id else None,
        },
        url_relacionada=f'/hseq/acciones-correctivas/{accion_correctiva.id}',
    )

    return tarea


def crear_tarea_desde_plan_hseq(actividad_plan):
    """
    Crea tarea automática desde actividad del Plan HSEQ
    """
    from apps.gestion_estrategica.gestion_tareas.models import Tarea
    from django.contrib.contenttypes.models import ContentType

    tarea = Tarea.objects.create(
        empresa=actividad_plan.empresa,
        titulo=f"Plan HSEQ: {actividad_plan.nombre}",
        descripcion=actividad_plan.descripcion,
        origen_tipo='PLAN_HSEQ',
        content_type=ContentType.objects.get_for_model(actividad_plan),
        object_id=str(actividad_plan.id),
        asignado_a=actividad_plan.responsable,
        creado_por=actividad_plan.creado_por,
        fecha_limite=actividad_plan.fecha_fin,
        fecha_inicio=actividad_plan.fecha_inicio,
        prioridad='normal',
        estado_kanban='TODO',
        origen_metadata={
            'modulo': 'HSEQ',
            'plan_id': str(actividad_plan.plan_id),
            'categoria': actividad_plan.categoria,
        },
        url_relacionada=f'/hseq/plan-trabajo/{actividad_plan.plan_id}',
    )

    return tarea


def crear_tarea_desde_mantenimiento_pesv(mantenimiento):
    """
    Crea tarea automática desde Mantenimiento Preventivo PESV
    """
    from apps.gestion_estrategica.gestion_tareas.models import Tarea
    from django.contrib.contenttypes.models import ContentType

    tarea = Tarea.objects.create(
        empresa=mantenimiento.empresa,
        titulo=f"Mantenimiento {mantenimiento.vehiculo.placa}: {mantenimiento.tipo}",
        descripcion=mantenimiento.descripcion,
        origen_tipo='MANTENIMIENTO_VEHICULO',
        content_type=ContentType.objects.get_for_model(mantenimiento),
        object_id=str(mantenimiento.id),
        asignado_a=mantenimiento.mecanico_asignado,
        creado_por=mantenimiento.solicitado_por,
        fecha_limite=mantenimiento.fecha_programada,
        prioridad='urgente' if mantenimiento.es_urgente else 'normal',
        estado_kanban='TODO',
        origen_metadata={
            'modulo': 'PESV',
            'vehiculo_id': str(mantenimiento.vehiculo_id),
            'placa': mantenimiento.vehiculo.placa,
            'kilometraje': mantenimiento.kilometraje_actual,
        },
        url_relacionada=f'/pesv/mantenimientos/{mantenimiento.id}',
    )

    return tarea
```

---

## 3. PLAN DE MIGRACIÓN PASO A PASO

### FASE 1: Preparación (1 día)

#### Paso 1.1: Crear estructura de directorios
```bash
# Crear estructura del nuevo módulo
mkdir -p c:/Proyectos/StrateKaz/backend/apps/gestion_estrategica/gestion_tareas/models
mkdir -p c:/Proyectos/StrateKaz/backend/apps/gestion_estrategica/gestion_tareas/serializers
mkdir -p c:/Proyectos/StrateKaz/backend/apps/gestion_estrategica/gestion_tareas/viewsets
mkdir -p c:/Proyectos/StrateKaz/backend/apps/gestion_estrategica/gestion_tareas/signals
mkdir -p c:/Proyectos/StrateKaz/backend/apps/gestion_estrategica/gestion_tareas/tests
mkdir -p c:/Proyectos/StrateKaz/backend/apps/gestion_estrategica/gestion_tareas/migrations
```

#### Paso 1.2: Crear archivos __init__.py
```bash
touch c:/Proyectos/StrateKaz/backend/apps/gestion_estrategica/gestion_tareas/__init__.py
touch c:/Proyectos/StrateKaz/backend/apps/gestion_estrategica/gestion_tareas/models/__init__.py
touch c:/Proyectos/StrateKaz/backend/apps/gestion_estrategica/gestion_tareas/serializers/__init__.py
touch c:/Proyectos/StrateKaz/backend/apps/gestion_estrategica/gestion_tareas/viewsets/__init__.py
touch c:/Proyectos/StrateKaz/backend/apps/gestion_estrategica/gestion_tareas/signals/__init__.py
touch c:/Proyectos/StrateKaz/backend/apps/gestion_estrategica/gestion_tareas/tests/__init__.py
```

### FASE 2: Creación de Modelos Mejorados (2 días)

#### Paso 2.1: Crear modelo Tarea mejorado
**Archivo**: `apps/gestion_estrategica/gestion_tareas/models/tarea.py`
- Copiar modelo Tarea existente
- Agregar campo `origen_tipo` con ORIGEN_TIPO_CHOICES
- Agregar campo `estado_kanban` con ESTADO_KANBAN_CHOICES
- Agregar campo `orden_kanban`
- Agregar campos `origen_metadata`, `etiquetas`
- Agregar campos `tiempo_estimado`, `tiempo_real`
- Agregar campos de sincronización
- Implementar método `generar_codigo()`
- Implementar método `sincronizar_estados()`

#### Paso 2.2: Migrar modelos relacionados
**Archivos a crear**:
1. `apps/gestion_estrategica/gestion_tareas/models/recordatorio.py`
2. `apps/gestion_estrategica/gestion_tareas/models/evento.py`
3. `apps/gestion_estrategica/gestion_tareas/models/comentario.py`

**Cambios requeridos**:
- Actualizar ForeignKey a `gestion_tareas.Tarea`
- Heredar de `BaseCompanyModel`
- Actualizar `db_table` names

#### Paso 2.3: Crear archivo de integraciones
**Archivo**: `apps/gestion_estrategica/gestion_tareas/models/integraciones.py`

Definir mapeo de modelos origen:
```python
ORIGEN_MODELO_MAP = {
    'ACCION_CORRECTIVA': 'hseq.AccionCorrectiva',
    'ACCION_PREVENTIVA': 'hseq.AccionPreventiva',
    'PLAN_HSEQ': 'hseq.PlanHSEQ',
    'PROYECTO': 'gestion_proyectos.Proyecto',
    'HALLAZGO_AUDITORIA': 'audit_system.HallazgoAuditoria',
    'MANTENIMIENTO_VEHICULO': 'pesv.MantenimientoVehiculo',
    # ... más mapeos
}
```

#### Paso 2.4: Actualizar __init__.py de models
```python
# apps/gestion_estrategica/gestion_tareas/models/__init__.py
from .tarea import Tarea, ORIGEN_TIPO_CHOICES, ESTADO_KANBAN_CHOICES
from .recordatorio import Recordatorio
from .evento import EventoCalendario
from .comentario import ComentarioTarea
from .integraciones import ORIGEN_MODELO_MAP

__all__ = [
    'Tarea',
    'Recordatorio',
    'EventoCalendario',
    'ComentarioTarea',
    'ORIGEN_TIPO_CHOICES',
    'ESTADO_KANBAN_CHOICES',
    'ORIGEN_MODELO_MAP',
]
```

### FASE 3: Sistema de Signals (1 día)

#### Paso 3.1: Crear signals de sincronización
**Archivo**: `apps/gestion_estrategica/gestion_tareas/signals/sincronizacion.py`

Implementar:
- `sincronizar_tarea_a_origen` (signal post_save)
- `sync_to_accion_correctiva()`
- `sync_to_plan_hseq()`
- `sync_to_proyecto()`
- `sync_to_hallazgo_auditoria()`
- `sync_to_mantenimiento_vehiculo()`
- `crear_tarea_desde_accion_correctiva()`
- `crear_tarea_desde_plan_hseq()`
- `crear_tarea_desde_mantenimiento_pesv()`

#### Paso 3.2: Registrar signals
```python
# apps/gestion_estrategica/gestion_tareas/apps.py
from django.apps import AppConfig

class GestionTareasConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.gestion_estrategica.gestion_tareas'
    verbose_name = 'Gestión de Tareas (Hub)'

    def ready(self):
        import apps.gestion_estrategica.gestion_tareas.signals.sincronizacion
```

### FASE 4: Serializers (1 día)

#### Paso 4.1: Serializers de Tarea
**Archivo**: `apps/gestion_estrategica/gestion_tareas/serializers/tarea_serializers.py`

```python
class TareaSerializer(serializers.ModelSerializer):
    asignado_a_nombre = serializers.CharField(
        source='asignado_a.get_full_name',
        read_only=True
    )
    origen_tipo_display = serializers.CharField(
        source='get_origen_tipo_display',
        read_only=True
    )
    origen_info = serializers.SerializerMethodField()

    class Meta:
        model = Tarea
        fields = '__all__'

    def get_origen_info(self, obj):
        """Información del objeto origen"""
        if obj.origen_objeto:
            return {
                'tipo': obj.origen_tipo,
                'id': obj.object_id,
                'url': obj.url_relacionada,
                'metadata': obj.origen_metadata,
            }
        return None
```

#### Paso 4.2: Serializers para Kanban
**Archivo**: `apps/gestion_estrategica/gestion_tareas/serializers/kanban_serializers.py`

```python
class TareaKanbanSerializer(serializers.ModelSerializer):
    """Serializer optimizado para vista Kanban"""

    asignado_nombre = serializers.CharField(source='asignado_a.get_full_name')
    avatar_url = serializers.CharField(source='asignado_a.avatar_url', required=False)

    class Meta:
        model = Tarea
        fields = [
            'id', 'codigo', 'titulo', 'prioridad',
            'estado_kanban', 'orden_kanban',
            'asignado_nombre', 'avatar_url',
            'fecha_limite', 'porcentaje_avance',
            'etiquetas', 'origen_tipo'
        ]


class KanbanColumnaSerializer(serializers.Serializer):
    """Serializer para columnas Kanban"""
    estado = serializers.CharField()
    estado_display = serializers.CharField()
    tareas = TareaKanbanSerializer(many=True)
    count = serializers.IntegerField()
```

### FASE 5: ViewSets (2 días)

#### Paso 5.1: ViewSet de Tareas
**Archivo**: `apps/gestion_estrategica/gestion_tareas/viewsets/tarea_viewsets.py`

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from apps.core.viewsets import BaseCompanyViewSet

class TareaViewSet(BaseCompanyViewSet):
    queryset = Tarea.objects.select_related(
        'asignado_a', 'creado_por', 'content_type'
    )
    serializer_class = TareaSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = [
        'asignado_a', 'estado', 'estado_kanban',
        'prioridad', 'tipo', 'origen_tipo'
    ]

    @action(detail=False, methods=['get'])
    def mis_tareas(self, request):
        """Tareas asignadas al usuario actual"""
        usuario_id = request.user.id
        tareas = self.get_queryset().filter(
            asignado_a_id=usuario_id,
            estado_kanban__in=['TODO', 'IN_PROGRESS', 'IN_REVIEW']
        )
        serializer = self.get_serializer(tareas, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def por_origen(self, request):
        """Filtrar tareas por módulo origen"""
        origen_tipo = request.query_params.get('origen_tipo')
        object_id = request.query_params.get('object_id')

        if not origen_tipo:
            return Response(
                {'error': 'origen_tipo is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.get_queryset().filter(origen_tipo=origen_tipo)

        if object_id:
            queryset = queryset.filter(object_id=object_id)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mover_kanban(self, request, pk=None):
        """Mover tarea en Kanban (drag & drop)"""
        tarea = self.get_object()
        nuevo_estado = request.data.get('nuevo_estado')
        nuevo_orden = request.data.get('nuevo_orden', 0)

        if nuevo_estado not in dict(ESTADO_KANBAN_CHOICES):
            return Response(
                {'error': 'Invalid estado_kanban'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Actualizar orden de otras tareas en la columna
        Tarea.objects.filter(
            empresa=tarea.empresa,
            estado_kanban=nuevo_estado,
            orden_kanban__gte=nuevo_orden
        ).update(orden_kanban=F('orden_kanban') + 1)

        # Actualizar tarea
        tarea.estado_kanban = nuevo_estado
        tarea.orden_kanban = nuevo_orden
        tarea.save()

        return Response(self.get_serializer(tarea).data)
```

#### Paso 5.2: ViewSet Kanban
**Archivo**: `apps/gestion_estrategica/gestion_tareas/viewsets/kanban_viewsets.py`

```python
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

class KanbanViewSet(viewsets.ViewSet):
    """ViewSet para vista Kanban"""

    def list(self, request):
        """Obtener todas las columnas Kanban con sus tareas"""
        empresa_id = request.user.empresa_id
        usuario_id = request.query_params.get('asignado_a')
        origen_tipo = request.query_params.get('origen_tipo')

        columnas = []

        for estado, estado_display in ESTADO_KANBAN_CHOICES:
            queryset = Tarea.objects.filter(
                empresa_id=empresa_id,
                estado_kanban=estado
            ).select_related('asignado_a').order_by('orden_kanban')

            # Filtros opcionales
            if usuario_id:
                queryset = queryset.filter(asignado_a_id=usuario_id)
            if origen_tipo:
                queryset = queryset.filter(origen_tipo=origen_tipo)

            columnas.append({
                'estado': estado,
                'estado_display': estado_display,
                'tareas': TareaKanbanSerializer(queryset, many=True).data,
                'count': queryset.count()
            })

        return Response(columnas)

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadísticas del Kanban"""
        empresa_id = request.user.empresa_id

        stats = {
            'total': Tarea.objects.filter(empresa_id=empresa_id).count(),
            'por_estado': {},
            'por_prioridad': {},
            'vencidas': Tarea.objects.filter(
                empresa_id=empresa_id,
                fecha_limite__lt=timezone.now(),
                estado_kanban__in=['TODO', 'IN_PROGRESS']
            ).count(),
        }

        for estado, _ in ESTADO_KANBAN_CHOICES:
            stats['por_estado'][estado] = Tarea.objects.filter(
                empresa_id=empresa_id,
                estado_kanban=estado
            ).count()

        return Response(stats)
```

#### Paso 5.3: ViewSet Calendario
**Archivo**: `apps/gestion_estrategica/gestion_tareas/viewsets/calendario_viewsets.py`

```python
class CalendarioViewSet(viewsets.ViewSet):
    """ViewSet para vista de calendario unificada"""

    def list(self, request):
        """Obtener eventos de calendario"""
        mes = request.query_params.get('mes')
        anio = request.query_params.get('anio')

        # Combinar tareas y eventos
        tareas = Tarea.objects.filter(
            empresa_id=request.user.empresa_id,
            fecha_limite__month=mes,
            fecha_limite__year=anio
        )

        eventos = EventoCalendario.objects.filter(
            empresa_id=request.user.empresa_id,
            fecha_inicio__month=mes,
            fecha_inicio__year=anio
        )

        # Formato unificado para calendario
        items = []

        for tarea in tareas:
            items.append({
                'id': f'tarea-{tarea.id}',
                'tipo': 'tarea',
                'titulo': tarea.titulo,
                'fecha': tarea.fecha_limite,
                'color': self.get_color_prioridad(tarea.prioridad),
                'url': tarea.url_relacionada,
            })

        for evento in eventos:
            items.append({
                'id': f'evento-{evento.id}',
                'tipo': 'evento',
                'titulo': evento.titulo,
                'fecha_inicio': evento.fecha_inicio,
                'fecha_fin': evento.fecha_fin,
                'color': evento.color,
            })

        return Response(items)

    def get_color_prioridad(self, prioridad):
        """Mapear prioridad a color"""
        return {
            'baja': '#10b981',      # green
            'normal': '#3b82f6',    # blue
            'alta': '#f59e0b',      # amber
            'urgente': '#ef4444',   # red
        }.get(prioridad, '#6b7280')
```

### FASE 6: URLs y Registro (1 día)

#### Paso 6.1: Configurar URLs
**Archivo**: `apps/gestion_estrategica/gestion_tareas/urls.py`

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viewsets import (
    TareaViewSet,
    RecordatorioViewSet,
    EventoCalendarioViewSet,
    ComentarioTareaViewSet,
    KanbanViewSet,
    CalendarioViewSet,
)

app_name = 'gestion_tareas'

router = DefaultRouter()
router.register(r'tareas', TareaViewSet, basename='tareas')
router.register(r'recordatorios', RecordatorioViewSet, basename='recordatorios')
router.register(r'eventos', EventoCalendarioViewSet, basename='eventos')
router.register(r'comentarios', ComentarioTareaViewSet, basename='comentarios')
router.register(r'kanban', KanbanViewSet, basename='kanban')
router.register(r'calendario', CalendarioViewSet, basename='calendario')

urlpatterns = [
    path('', include(router.urls)),
]
```

#### Paso 6.2: Actualizar URLs principales
**Archivo**: `apps/gestion_estrategica/urls.py`

```python
from django.urls import path, include

urlpatterns = [
    # ... existentes
    path('tareas/', include('apps.gestion_estrategica.gestion_tareas.urls')),
]
```

#### Paso 6.3: Registrar en settings.py
```python
# config/settings.py

INSTALLED_APPS = [
    # ...

    # Gestión Estratégica (N1)
    'apps.gestion_estrategica.gestion_tareas',  # NUEVO HUB

    # Sistema de Auditoría (N6)
    # 'apps.audit_system.tareas_recordatorios',  # DEPRECAR
]
```

### FASE 7: Migración de Datos (2 días)

#### Paso 7.1: Crear migración inicial
```bash
cd c:/Proyectos/StrateKaz/backend
python manage.py makemigrations gestion_tareas
```

#### Paso 7.2: Crear script de migración de datos
**Archivo**: `apps/gestion_estrategica/gestion_tareas/migrations/0002_migrar_datos_legacy.py`

```python
from django.db import migrations
from django.contrib.contenttypes.models import ContentType

def migrar_tareas_legacy(apps, schema_editor):
    """
    Migrar tareas de audit_system.tareas_recordatorios a gestion_tareas
    """
    # Modelo antiguo
    TareaLegacy = apps.get_model('tareas_recordatorios', 'Tarea')
    RecordatorioLegacy = apps.get_model('tareas_recordatorios', 'Recordatorio')
    EventoLegacy = apps.get_model('tareas_recordatorios', 'EventoCalendario')
    ComentarioLegacy = apps.get_model('tareas_recordatorios', 'ComentarioTarea')

    # Modelo nuevo
    TareaNueva = apps.get_model('gestion_tareas', 'Tarea')
    RecordatorioNuevo = apps.get_model('gestion_tareas', 'Recordatorio')
    EventoNuevo = apps.get_model('gestion_tareas', 'EventoCalendario')
    ComentarioNuevo = apps.get_model('gestion_tareas', 'ComentarioTarea')

    print("Migrando tareas...")

    # Mapear estado legado a Kanban
    estado_kanban_map = {
        'pendiente': 'TODO',
        'en_progreso': 'IN_PROGRESS',
        'completada': 'DONE',
        'cancelada': 'CANCELLED',
        'vencida': 'TODO',  # Vencidas van a TODO
    }

    tareas_migradas = {}

    for tarea_legacy in TareaLegacy.objects.all():
        tarea_nueva = TareaNueva.objects.create(
            # Campos básicos
            titulo=tarea_legacy.titulo,
            descripcion=tarea_legacy.descripcion,
            tipo=tarea_legacy.tipo,
            prioridad=tarea_legacy.prioridad,
            estado=tarea_legacy.estado,
            estado_kanban=estado_kanban_map.get(tarea_legacy.estado, 'TODO'),

            # Asignación
            asignado_a_id=tarea_legacy.asignado_a_id,
            creado_por_id=tarea_legacy.creado_por_id,

            # Fechas
            fecha_limite=tarea_legacy.fecha_limite,
            fecha_completada=tarea_legacy.fecha_completada,

            # GenericForeignKey
            content_type_id=tarea_legacy.content_type_id,
            object_id=tarea_legacy.object_id,
            url_relacionada=tarea_legacy.url_relacionada,

            # Origen (todas legacy son manuales)
            origen_tipo='MANUAL',
            origen_metadata={
                'migrado_desde': 'audit_system.tareas_recordatorios',
                'tarea_legacy_id': tarea_legacy.id,
            },

            # Progreso
            porcentaje_avance=tarea_legacy.porcentaje_avance,
            notas=tarea_legacy.notas,

            # Timestamps
            created_at=tarea_legacy.created_at,
            updated_at=tarea_legacy.updated_at,
        )

        tareas_migradas[tarea_legacy.id] = tarea_nueva.id

        print(f"  Migrada tarea {tarea_legacy.id} → {tarea_nueva.id}")

    print(f"Total tareas migradas: {len(tareas_migradas)}")

    # Migrar recordatorios
    print("\nMigrando recordatorios...")
    for recordatorio_legacy in RecordatorioLegacy.objects.all():
        RecordatorioNuevo.objects.create(
            tarea_id=tareas_migradas.get(recordatorio_legacy.tarea_id) if recordatorio_legacy.tarea_id else None,
            titulo=recordatorio_legacy.titulo,
            mensaje=recordatorio_legacy.mensaje,
            usuario_id=recordatorio_legacy.usuario_id,
            fecha_recordatorio=recordatorio_legacy.fecha_recordatorio,
            repetir=recordatorio_legacy.repetir,
            dias_repeticion=recordatorio_legacy.dias_repeticion,
            hora_repeticion=recordatorio_legacy.hora_repeticion,
            esta_activo=recordatorio_legacy.esta_activo,
            ultima_ejecucion=recordatorio_legacy.ultima_ejecucion,
            proxima_ejecucion=recordatorio_legacy.proxima_ejecucion,
            created_at=recordatorio_legacy.created_at,
            updated_at=recordatorio_legacy.updated_at,
        )

    print(f"Total recordatorios migrados: {RecordatorioLegacy.objects.count()}")

    # Migrar eventos
    print("\nMigrando eventos...")
    eventos_migrados = {}
    for evento_legacy in EventoLegacy.objects.all():
        evento_nuevo = EventoNuevo.objects.create(
            titulo=evento_legacy.titulo,
            descripcion=evento_legacy.descripcion,
            tipo=evento_legacy.tipo,
            fecha_inicio=evento_legacy.fecha_inicio,
            fecha_fin=evento_legacy.fecha_fin,
            todo_el_dia=evento_legacy.todo_el_dia,
            ubicacion=evento_legacy.ubicacion,
            url_reunion=evento_legacy.url_reunion,
            creado_por_id=evento_legacy.creado_por_id,
            color=evento_legacy.color,
            recordar_antes=evento_legacy.recordar_antes,
            created_at=evento_legacy.created_at,
            updated_at=evento_legacy.updated_at,
        )
        eventos_migrados[evento_legacy.id] = evento_nuevo

        # Migrar participantes (ManyToMany)
        evento_nuevo.participantes.set(evento_legacy.participantes.all())

    print(f"Total eventos migrados: {len(eventos_migrados)}")

    # Migrar comentarios
    print("\nMigrando comentarios...")
    for comentario_legacy in ComentarioLegacy.objects.all():
        ComentarioNuevo.objects.create(
            tarea_id=tareas_migradas.get(comentario_legacy.tarea_id),
            usuario_id=comentario_legacy.usuario_id,
            mensaje=comentario_legacy.mensaje,
            archivo_adjunto=comentario_legacy.archivo_adjunto,
            created_at=comentario_legacy.created_at,
            updated_at=comentario_legacy.updated_at,
        )

    print(f"Total comentarios migrados: {ComentarioLegacy.objects.count()}")
    print("\nMigración completada exitosamente!")


class Migration(migrations.Migration):
    dependencies = [
        ('gestion_tareas', '0001_initial'),
        ('tareas_recordatorios', '__latest__'),
    ]

    operations = [
        migrations.RunPython(
            migrar_tareas_legacy,
            reverse_code=migrations.RunPython.noop
        ),
    ]
```

#### Paso 7.3: Ejecutar migración
```bash
python manage.py migrate gestion_tareas
```

#### Paso 7.4: Verificar migración
```bash
python manage.py shell
```

```python
from apps.gestion_estrategica.gestion_tareas.models import Tarea
from apps.audit_system.tareas_recordatorios.models import Tarea as TareaLegacy

count_legacy = TareaLegacy.objects.count()
count_nuevo = Tarea.objects.count()

print(f"Tareas legacy: {count_legacy}")
print(f"Tareas nuevas: {count_nuevo}")
assert count_legacy == count_nuevo, "Falta migrar tareas!"
```

### FASE 8: Actualizar Dependencias (2 días)

#### Paso 8.1: Actualizar firma_digital
**Archivo**: `apps/workflow_engine/firma_digital/models.py`

```python
# ANTES:
tarea_asociada = models.ForeignKey(
    'tareas_recordatorios.Tarea',
    ...
)

# DESPUÉS:
tarea_asociada = models.ForeignKey(
    'gestion_tareas.Tarea',
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name='firmas_flujo',
    verbose_name='Tarea Asociada'
)
```

#### Paso 8.2: Crear migración para actualizar FK
```bash
python manage.py makemigrations workflow_engine --name actualizar_fk_tarea
python manage.py migrate workflow_engine
```

#### Paso 8.3: Buscar y actualizar importaciones
```bash
# Buscar todas las importaciones
grep -r "from apps.audit_system.tareas_recordatorios" c:/Proyectos/StrateKaz/backend/apps --include="*.py"

# Actualizar a:
# from apps.gestion_estrategica.gestion_tareas.models import Tarea
```

### FASE 9: Frontend (3-5 días)

#### Paso 9.1: Crear estructura frontend
```bash
mkdir -p c:/Proyectos/StrateKaz/frontend/src/modules/gestion-tareas
mkdir -p c:/Proyectos/StrateKaz/frontend/src/modules/gestion-tareas/components
mkdir -p c:/Proyectos/StrateKaz/frontend/src/modules/gestion-tareas/views
mkdir -p c:/Proyectos/StrateKaz/frontend/src/modules/gestion-tareas/hooks
mkdir -p c:/Proyectos/StrateKaz/frontend/src/modules/gestion-tareas/types
```

#### Paso 9.2: Tipos TypeScript
**Archivo**: `frontend/src/modules/gestion-tareas/types/tarea.ts`

```typescript
export type OrigenTipo =
  | 'PROYECTO'
  | 'OBJETIVO_ESTRATEGICO'
  | 'INDICADOR'
  | 'PLAN_HSEQ'
  | 'ACCION_CORRECTIVA'
  | 'ACCION_PREVENTIVA'
  | 'HALLAZGO_AUDITORIA'
  | 'RIESGO'
  | 'CAPACITACION_SST'
  | 'MANTENIMIENTO_VEHICULO'
  | 'AUDITORIA_INTERNA'
  | 'MANUAL'
  | 'OTRO';

export type EstadoKanban =
  | 'BACKLOG'
  | 'TODO'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'DONE'
  | 'CANCELLED';

export type Prioridad = 'baja' | 'normal' | 'alta' | 'urgente';

export interface Tarea {
  id: string;
  codigo: string;
  titulo: string;
  descripcion: string;
  tipo: 'manual' | 'automatica' | 'recurrente';
  prioridad: Prioridad;
  estado_kanban: EstadoKanban;
  orden_kanban: number;
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';

  asignado_a: string;
  asignado_a_nombre: string;
  creado_por: string;
  creado_por_nombre: string;

  fecha_limite: string;
  fecha_inicio?: string;
  fecha_completada?: string;

  origen_tipo: OrigenTipo;
  origen_tipo_display: string;
  origen_metadata: Record<string, any>;
  url_relacionada?: string;

  porcentaje_avance: number;
  notas?: string;
  etiquetas: string[];

  tiempo_estimado?: string;
  tiempo_real?: string;

  created_at: string;
  updated_at: string;
}

export interface KanbanColumna {
  estado: EstadoKanban;
  estado_display: string;
  tareas: Tarea[];
  count: number;
}
```

#### Paso 9.3: Hook para Kanban
**Archivo**: `frontend/src/modules/gestion-tareas/hooks/useKanban.ts`

```typescript
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { KanbanColumna, Tarea, EstadoKanban } from '../types/tarea';

export function useKanban(filtros?: {
  asignado_a?: string;
  origen_tipo?: string;
}) {
  const queryClient = useQueryClient();

  const { data: columnas, isLoading } = useQuery({
    queryKey: ['kanban', filtros],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filtros?.asignado_a) params.set('asignado_a', filtros.asignado_a);
      if (filtros?.origen_tipo) params.set('origen_tipo', filtros.origen_tipo);

      const response = await api.get<KanbanColumna[]>(
        `/api/gestion-estrategica/tareas/kanban/?${params}`
      );
      return response.data;
    },
  });

  const moverTarea = useMutation({
    mutationFn: async ({
      tareaId,
      nuevoEstado,
      nuevoOrden,
    }: {
      tareaId: string;
      nuevoEstado: EstadoKanban;
      nuevoOrden: number;
    }) => {
      const response = await api.post<Tarea>(
        `/api/gestion-estrategica/tareas/tareas/${tareaId}/mover_kanban/`,
        {
          nuevo_estado: nuevoEstado,
          nuevo_orden: nuevoOrden,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
    },
  });

  return {
    columnas,
    isLoading,
    moverTarea: moverTarea.mutate,
    isMoving: moverTarea.isPending,
  };
}
```

#### Paso 9.4: Componente Kanban Board
**Archivo**: `frontend/src/modules/gestion-tareas/components/KanbanBoard.tsx`

```typescript
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { TareaCard } from './TareaCard';
import { useKanban } from '../hooks/useKanban';
import type { Tarea } from '../types/tarea';

export function KanbanBoard() {
  const { columnas, isLoading, moverTarea } = useKanban();
  const [activeTarea, setActiveTarea] = useState<Tarea | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveTarea(active.data.current?.tarea);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const tareaId = active.id as string;
    const nuevoEstado = over.data.current?.columna.estado;
    const nuevoOrden = over.data.current?.index || 0;

    moverTarea({
      tareaId,
      nuevoEstado,
      nuevoOrden,
    });

    setActiveTarea(null);
  };

  if (isLoading) {
    return <div>Cargando tablero Kanban...</div>;
  }

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columnas?.map((columna) => (
          <KanbanColumn
            key={columna.estado}
            columna={columna}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTarea ? <TareaCard tarea={activeTarea} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
```

#### Paso 9.5: Vista principal
**Archivo**: `frontend/src/modules/gestion-tareas/views/TareasView.tsx`

```typescript
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { KanbanBoard } from '../components/KanbanBoard';
import { CalendarioView } from '../components/CalendarioView';
import { TareasListView } from '../components/TareasListView';

export function TareasView() {
  const [vista, setVista] = useState<'kanban' | 'lista' | 'calendario'>('kanban');

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Gestión de Tareas</h1>

        <Tabs value={vista} onValueChange={setVista as any}>
          <TabsList>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="lista">Lista</TabsTrigger>
            <TabsTrigger value="calendario">Calendario</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {vista === 'kanban' && <KanbanBoard />}
      {vista === 'lista' && <TareasListView />}
      {vista === 'calendario' && <CalendarioView />}
    </div>
  );
}
```

#### Paso 9.6: Rutas
**Archivo**: `frontend/src/router/index.tsx`

```typescript
// Agregar ruta
{
  path: '/tareas',
  element: <TareasView />,
  meta: {
    requiresAuth: true,
    title: 'Gestión de Tareas',
  }
}
```

### FASE 10: Testing (2 días)

#### Paso 10.1: Tests de modelos
**Archivo**: `apps/gestion_estrategica/gestion_tareas/tests/test_models.py`

```python
import pytest
from django.utils import timezone
from apps.gestion_estrategica.gestion_tareas.models import Tarea

@pytest.mark.django_db
class TestTarea:
    def test_generar_codigo_automatico(self, empresa_factory, user_factory):
        """Verificar generación automática de código"""
        empresa = empresa_factory()
        user = user_factory()

        tarea = Tarea.objects.create(
            empresa=empresa,
            titulo="Test",
            descripcion="Test",
            asignado_a=user,
            fecha_limite=timezone.now() + timezone.timedelta(days=7)
        )

        assert tarea.codigo.startswith('TSK-')

    def test_sincronizar_estados_kanban(self, tarea_factory):
        """Verificar sincronización estado Kanban → estado legado"""
        tarea = tarea_factory(estado_kanban='IN_PROGRESS')
        assert tarea.estado == 'en_progreso'

        tarea.estado_kanban = 'DONE'
        tarea.save()
        assert tarea.estado == 'completada'

    def test_vinculacion_generica(self, tarea_factory, proyecto_factory):
        """Verificar GenericForeignKey funciona correctamente"""
        from django.contrib.contenttypes.models import ContentType

        proyecto = proyecto_factory()

        tarea = tarea_factory(
            origen_tipo='PROYECTO',
            content_type=ContentType.objects.get_for_model(proyecto),
            object_id=str(proyecto.id)
        )

        assert tarea.origen_objeto == proyecto
```

#### Paso 10.2: Tests de sincronización
**Archivo**: `apps/gestion_estrategica/gestion_tareas/tests/test_signals.py`

```python
import pytest
from apps.gestion_estrategica.gestion_tareas.models import Tarea
from apps.gestion_estrategica.gestion_tareas.signals.sincronizacion import (
    crear_tarea_desde_accion_correctiva
)

@pytest.mark.django_db
class TestSincronizacion:
    def test_crear_tarea_desde_accion_correctiva(
        self,
        accion_correctiva_factory
    ):
        """Verificar creación automática de tarea desde AC"""
        accion = accion_correctiva_factory()

        tarea = crear_tarea_desde_accion_correctiva(accion)

        assert tarea.origen_tipo == 'ACCION_CORRECTIVA'
        assert tarea.origen_objeto == accion
        assert tarea.asignado_a == accion.responsable

    def test_sincronizacion_bidireccional(
        self,
        tarea_factory,
        accion_correctiva_factory
    ):
        """Verificar sincronización bidireccional"""
        from django.contrib.contenttypes.models import ContentType

        accion = accion_correctiva_factory(estado='ABIERTA')

        tarea = tarea_factory(
            origen_tipo='ACCION_CORRECTIVA',
            content_type=ContentType.objects.get_for_model(accion),
            object_id=str(accion.id),
            estado_kanban='TODO'
        )

        # Completar tarea
        tarea.estado_kanban = 'DONE'
        tarea.save()

        # Verificar que AC se cerró
        accion.refresh_from_db()
        assert accion.estado == 'CERRADA'
```

### FASE 11: Deprecación del Módulo Legacy (1 día)

#### Paso 11.1: Marcar como deprecado
**Archivo**: `apps/audit_system/tareas_recordatorios/__init__.py`

```python
import warnings

warnings.warn(
    "El módulo 'audit_system.tareas_recordatorios' está DEPRECADO. "
    "Use 'gestion_estrategica.gestion_tareas' en su lugar.",
    DeprecationWarning,
    stacklevel=2
)
```

#### Paso 11.2: Comentar en settings.py
```python
# config/settings.py

INSTALLED_APPS = [
    # ...

    # DEPRECADO: Mover a gestion_estrategica.gestion_tareas
    # 'apps.audit_system.tareas_recordatorios',
]
```

#### Paso 11.3: Crear README de migración
**Archivo**: `apps/audit_system/tareas_recordatorios/DEPRECATED.md`

```markdown
# MÓDULO DEPRECADO

Este módulo ha sido migrado a `apps.gestion_estrategica.gestion_tareas/`

## Razón
Centralizar todas las tareas del sistema en un HUB único.

## Nueva ubicación
- Modelos: `apps.gestion_estrategica.gestion_tareas.models`
- API: `/api/gestion-estrategica/tareas/`

## Fecha de deprecación
2026-01-17

## Fecha de eliminación planificada
2026-03-01 (6 semanas)

## Guía de migración
Ver: `docs/desarrollo/PLAN_MIGRACION_TAREAS_HUB_N1.md`
```

---

## 4. CRONOGRAMA ESTIMADO

| Fase | Descripción | Duración | Acumulado |
|------|-------------|----------|-----------|
| 1 | Preparación | 1 día | 1 día |
| 2 | Modelos mejorados | 2 días | 3 días |
| 3 | Sistema de signals | 1 día | 4 días |
| 4 | Serializers | 1 día | 5 días |
| 5 | ViewSets | 2 días | 7 días |
| 6 | URLs y registro | 1 día | 8 días |
| 7 | Migración de datos | 2 días | 10 días |
| 8 | Actualizar dependencias | 2 días | 12 días |
| 9 | Frontend | 3-5 días | 15-17 días |
| 10 | Testing | 2 días | 17-19 días |
| 11 | Deprecación legacy | 1 día | 18-20 días |

**Total estimado**: 18-20 días laborales (~4 semanas)

---

## 5. RIESGOS Y MITIGACIÓN

### Riesgo 1: Pérdida de datos durante migración
**Probabilidad**: Baja
**Impacto**: Crítico
**Mitigación**:
- Backup completo de base de datos antes de migrar
- Migración en script controlado con verificación
- Mantener datos legacy hasta verificación completa

### Riesgo 2: Dependencias ocultas
**Probabilidad**: Media
**Impacto**: Alto
**Mitigación**:
- Búsqueda exhaustiva con grep de importaciones
- Tests de integración completos
- Periodo de deprecación de 6 semanas

### Riesgo 3: Sincronización bidireccional con bugs
**Probabilidad**: Media
**Impacto**: Medio
**Mitigación**:
- Tests unitarios exhaustivos de signals
- Flag `skip_sync` para evitar loops
- Logging detallado de sincronizaciones

### Riesgo 4: Performance del Kanban con muchas tareas
**Probabilidad**: Media
**Impacto**: Medio
**Mitigación**:
- Paginación en columnas Kanban
- Índices de base de datos optimizados
- Cache en frontend con React Query

---

## 6. CHECKLIST DE VALIDACIÓN

### Backend
- [ ] Modelos creados con todos los campos requeridos
- [ ] Migraciones ejecutadas sin errores
- [ ] Datos legacy migrados completamente
- [ ] Signals de sincronización funcionando
- [ ] Tests unitarios pasando (>90% coverage)
- [ ] API endpoints respondiendo correctamente
- [ ] Dependencias actualizadas

### Frontend
- [ ] Tipos TypeScript definidos
- [ ] Componentes Kanban funcionales
- [ ] Drag & drop funcionando
- [ ] Vista de calendario implementada
- [ ] Filtros por origen_tipo funcionando
- [ ] Integración con módulos origen

### Documentación
- [ ] README del nuevo módulo
- [ ] Guía de uso del HUB de tareas
- [ ] Documentación de API
- [ ] Guía de integración para otros módulos

---

## 7. COMANDOS ÚTILES

### Crear estructura
```bash
# Backend
python c:/Proyectos/StrateKaz/backend/manage.py startapp gestion_tareas apps/gestion_estrategica/

# Migraciones
python manage.py makemigrations gestion_tareas
python manage.py migrate gestion_tareas

# Tests
pytest apps/gestion_estrategica/gestion_tareas/tests/ -v
```

### Verificación
```bash
# Contar registros
python manage.py shell -c "
from apps.audit_system.tareas_recordatorios.models import Tarea as TL
from apps.gestion_estrategica.gestion_tareas.models import Tarea as TN
print(f'Legacy: {TL.objects.count()}')
print(f'Nuevo: {TN.objects.count()}')
"

# Verificar dependencias
grep -r "tareas_recordatorios" backend/ --include="*.py"
```

---

## 8. PRÓXIMOS PASOS DESPUÉS DE LA MIGRACIÓN

1. **Integrar módulos origen**:
   - HSEQ: Acciones Correctivas, Plan HSEQ
   - Proyectos: Tareas de proyectos
   - PESV: Mantenimientos
   - Auditorías: Hallazgos

2. **Características avanzadas**:
   - Notificaciones push
   - Asignación automática con IA
   - Plantillas de tareas recurrentes
   - Gantt chart de proyectos

3. **Optimizaciones**:
   - Cache de Redis para Kanban
   - WebSockets para actualización en tiempo real
   - Exportación a Excel/PDF

4. **Mobile**:
   - PWA para tareas móviles
   - Notificaciones nativas

---

**Autor**: BPM_SPECIALIST
**Fecha**: 2026-01-17
**Versión**: 1.0
