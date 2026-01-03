# Módulo Audit System - Sistema de Auditoría y Notificaciones

## Descripción

Sistema integral de auditoría, notificaciones, alertas y gestión de tareas para el ERP StrateKaz.

**Semana**: 25 (Fase 7)
**Módulo**: 14 - Audit System
**Fecha**: 2025-12-30

## Estructura del Módulo

```
audit_system/
├── __init__.py
├── apps.py
├── urls.py (router principal)
├── logs_sistema/              # Logs de acceso, cambios y consultas
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   └── admin.py
├── centro_notificaciones/     # Notificaciones multi-canal
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   └── admin.py
├── config_alertas/            # Configuración de alertas automáticas
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   └── admin.py
└── tareas_recordatorios/      # Tareas, recordatorios y calendario
    ├── models.py
    ├── serializers.py
    ├── views.py
    ├── urls.py
    └── admin.py
```

## Componentes

### 1. Logs del Sistema (`logs_sistema`)

**Modelos:**
- `ConfiguracionAuditoria`: Configuración de qué auditar por modelo
- `LogAcceso`: Logs de acceso (login, logout, etc.)
- `LogCambio`: Logs de cambios en datos (CRUD)
- `LogConsulta`: Logs de consultas y exportaciones

**Endpoints:**
- `/api/audit/logs/configuracion/`
- `/api/audit/logs/accesos/`
- `/api/audit/logs/cambios/`
- `/api/audit/logs/consultas/`

**Acciones especiales:**
- `GET /api/audit/logs/cambios/por_objeto/?content_type_id=X&object_id=Y`
- `GET /api/audit/logs/cambios/por_usuario/?usuario_id=X`
- `GET /api/audit/logs/accesos/por_usuario/?usuario_id=X`

### 2. Centro de Notificaciones (`centro_notificaciones`)

**Modelos:**
- `TipoNotificacion`: Tipos configurables con plantillas
- `Notificacion`: Notificaciones individuales
- `PreferenciaNotificacion`: Preferencias por usuario
- `NotificacionMasiva`: Notificaciones a grupos

**Endpoints:**
- `/api/audit/notificaciones/tipos/`
- `/api/audit/notificaciones/`
- `/api/audit/notificaciones/preferencias/`
- `/api/audit/notificaciones/masivas/`

**Acciones especiales:**
- `POST /api/audit/notificaciones/{id}/marcar_leida/`
- `POST /api/audit/notificaciones/marcar_todas_leidas/`
- `GET /api/audit/notificaciones/no_leidas/?usuario_id=X`

### 3. Configuración de Alertas (`config_alertas`)

**Modelos:**
- `TipoAlerta`: Tipos de alerta
- `ConfiguracionAlerta`: Configuración por tipo
- `AlertaGenerada`: Alertas generadas
- `EscalamientoAlerta`: Escalamientos

**Endpoints:**
- `/api/audit/alertas/tipos/`
- `/api/audit/alertas/configuraciones/`
- `/api/audit/alertas/`
- `/api/audit/alertas/escalamientos/`

**Acciones especiales:**
- `POST /api/audit/alertas/{id}/atender/`
- `GET /api/audit/alertas/pendientes/`
- `GET /api/audit/alertas/por_severidad/?severidad=critical`

### 4. Tareas y Recordatorios (`tareas_recordatorios`)

**Modelos:**
- `Tarea`: Tareas pendientes
- `Recordatorio`: Recordatorios programados
- `EventoCalendario`: Eventos
- `ComentarioTarea`: Comentarios en tareas

**Endpoints:**
- `/api/audit/tareas/`
- `/api/audit/tareas/recordatorios/`
- `/api/audit/tareas/eventos/`
- `/api/audit/tareas/comentarios/`

**Acciones especiales:**
- `POST /api/audit/tareas/{id}/completar/`
- `POST /api/audit/tareas/{id}/cancelar/`
- `POST /api/audit/tareas/{id}/reasignar/`
- `GET /api/audit/tareas/mis_tareas/`
- `GET /api/audit/tareas/vencidas/`
- `GET /api/audit/tareas/eventos/por_mes/?mes=12&anio=2025`
- `GET /api/audit/tareas/eventos/mis_eventos/`

## Instalación

### 1. Apps ya registradas en `settings.py`

```python
INSTALLED_APPS = [
    # ...
    'apps.audit_system.logs_sistema',
    'apps.audit_system.centro_notificaciones',
    'apps.audit_system.config_alertas',
    'apps.audit_system.tareas_recordatorios',
]
```

### 2. URLs ya configuradas en `config/urls.py`

```python
urlpatterns = [
    # ...
    path('api/audit/', include('apps.audit_system.urls')),
]
```

### 3. Crear migraciones

```bash
python manage.py makemigrations logs_sistema
python manage.py makemigrations centro_notificaciones
python manage.py makemigrations config_alertas
python manage.py makemigrations tareas_recordatorios
```

### 4. Aplicar migraciones

```bash
python manage.py migrate
```

## Uso

### Ejemplo: Crear una notificación

```python
from apps.audit_system.centro_notificaciones.models import TipoNotificacion, Notificacion

# Crear tipo de notificación
tipo = TipoNotificacion.objects.create(
    codigo='tarea_asignada',
    nombre='Tarea Asignada',
    categoria='tarea',
    plantilla_titulo='Nueva tarea: {titulo}',
    plantilla_mensaje='Se le ha asignado la tarea: {titulo}',
    empresa_id=1
)

# Crear notificación
Notificacion.objects.create(
    tipo=tipo,
    usuario_id=1,
    titulo='Nueva tarea: Revisar documentos',
    mensaje='Se le ha asignado la tarea: Revisar documentos',
    prioridad='alta',
    url='/tareas/123'
)
```

### Ejemplo: Registrar cambio en un modelo

```python
from apps.audit_system.logs_sistema.models import LogCambio
from django.contrib.contenttypes.models import ContentType

# Registrar cambio
LogCambio.objects.create(
    usuario=request.user,
    content_type=ContentType.objects.get_for_model(MiModelo),
    object_id=str(objeto.id),
    object_repr=str(objeto),
    accion='modificar',
    cambios={
        'nombre': {'old': 'Juan', 'new': 'Juan Pérez'},
        'email': {'old': 'j@test.com', 'new': 'juan@test.com'}
    },
    ip_address=request.META.get('REMOTE_ADDR')
)
```

### Ejemplo: Crear una tarea

```python
from apps.audit_system.tareas_recordatorios.models import Tarea
from datetime import datetime, timedelta

tarea = Tarea.objects.create(
    titulo='Revisar documentos de calidad',
    descripcion='Revisar y aprobar los documentos pendientes',
    tipo='manual',
    prioridad='alta',
    estado='pendiente',
    asignado_a_id=2,
    creado_por_id=1,
    fecha_limite=datetime.now() + timedelta(days=7)
)
```

## Características

### Seguridad
- Todos los modelos de logs son de **solo lectura** en el admin
- Los logs no se pueden eliminar desde la interfaz
- Configuración granular de qué auditar por modelo

### Notificaciones
- Multi-canal (app, email, push)
- Plantillas configurables
- Preferencias por usuario
- Notificaciones masivas por rol/área

### Alertas
- Alertas automáticas configurables
- Escalamiento de alertas no atendidas
- Diferentes niveles de severidad
- Integración con otros módulos

### Tareas
- Gestión completa de tareas
- Recordatorios programados
- Calendario de eventos
- Comentarios y seguimiento

## Próximos pasos

1. Crear migraciones
2. Aplicar migraciones
3. Crear datos de prueba en admin
4. Implementar signals para logging automático
5. Configurar envío de emails
6. Configurar tareas Celery para alertas

## Notas

- **NO** se han creado migraciones todavía (según instrucciones)
- Todos los modelos heredan de `BaseCompanyModel` o `TimestampedModel`
- Los admin están configurados con filtros y búsqueda
- Todos los ViewSets tienen acciones especiales según requerimientos
