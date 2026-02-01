# API de Notificaciones - Guía de Integración

> **Versión:** 3.5.5
> **Módulo:** `audit_system.centro_notificaciones`
> **Service:** `NotificationService`

## 📋 Índice

1. [Introducción](#introducción)
2. [Instalación y Setup](#instalación-y-setup)
3. [Uso Básico](#uso-básico)
4. [API Reference](#api-reference)
5. [Ejemplos por Módulo](#ejemplos-por-módulo)
6. [Mejores Prácticas](#mejores-prácticas)

---

## Introducción

El **Centro de Notificaciones** es la infraestructura centralizada para enviar notificaciones a usuarios del sistema. Soporta:

- ✅ Notificaciones en la aplicación (bandeja)
- ✅ Envío por email
- 🚧 Notificaciones push (pendiente FCM)
- 🚧 SMS (pendiente)

**Características:**
- Respeto de preferencias de usuario (horarios, canales)
- Plantillas con variables dinámicas
- Envío individual o masivo
- Filtrado por cargo, área, o usuarios específicos
- Prioridades (baja, normal, alta, urgente)

---

## Instalación y Setup

### Paso 1: Importar el Service

```python
from apps.audit_system.centro_notificaciones.services import NotificationService
from apps.audit_system.centro_notificaciones.models import TipoNotificacion
```

### Paso 2: Crear Tipos de Notificación

Antes de enviar notificaciones, debes crear los **tipos** desde el admin o la UI:

```python
# Ejemplo en Django shell o seed
from apps.audit_system.centro_notificaciones.models import TipoNotificacion

TipoNotificacion.objects.create(
    codigo='NUEVA_TAREA',
    nombre='Nueva Tarea Asignada',
    descripcion='Se notifica al usuario cuando se le asigna una nueva tarea',
    categoria='tarea',
    color='#3B82F6',
    icono='bell',
    plantilla_titulo='Nueva tarea: {titulo_tarea}',
    plantilla_mensaje='Se te ha asignado: {descripcion}. Responsable: {responsable}',
    url_template='/planeacion/tareas/{tarea_id}',
    es_email=True,
    es_push=True,
    company_id=1  # ID de la empresa
)
```

---

## Uso Básico

### Notificación Simple

```python
from apps.audit_system.centro_notificaciones.services import NotificationService
from apps.audit_system.centro_notificaciones.models import TipoNotificacion

# Obtener el tipo
tipo = TipoNotificacion.objects.get(codigo='NUEVA_TAREA')

# Enviar notificación
NotificationService.send_notification(
    tipo=tipo,
    usuario=request.user,  # o cualquier User instance
    titulo="Nueva tarea asignada",
    mensaje="Revisa la tarea urgente: Actualizar documentación ISO",
    url="/planeacion/tareas/456",
    prioridad='alta'
)
```

### Notificación con Plantilla

```python
# El tipo tiene plantillas configuradas:
# plantilla_titulo = "Nueva tarea: {titulo_tarea}"
# plantilla_mensaje = "Se te ha asignado: {descripcion}. Responsable: {responsable}"

tipo = TipoNotificacion.objects.get(codigo='NUEVA_TAREA')

# Renderizar plantilla
titulo = NotificationService.render_template(
    tipo.plantilla_titulo,
    {'titulo_tarea': 'Auditoría interna Q1'}
)

mensaje = NotificationService.render_template(
    tipo.plantilla_mensaje,
    {
        'descripcion': 'Preparar documentos para auditoría ISO 9001',
        'responsable': tarea.responsable.get_full_name()
    }
)

# Enviar con plantilla renderizada
NotificationService.send_notification(
    tipo=tipo,
    usuario=tarea.responsable,
    titulo=titulo,
    mensaje=mensaje,
    url=f"/planeacion/tareas/{tarea.id}",
    datos_extra={'tarea_id': tarea.id, 'modulo': 'planeacion'}
)
```

### Notificación Masiva

```python
# A todos los usuarios activos
usuarios = User.objects.filter(is_active=True)
tipo = TipoNotificacion.objects.get(codigo='MANTENIMIENTO_PROGRAMADO')

stats = NotificationService.send_bulk_notification(
    tipo=tipo,
    usuarios=usuarios,
    titulo="Mantenimiento del sistema",
    mensaje="El sistema estará en mantenimiento el 25/01 de 2am a 4am",
    prioridad='alta'
)

print(f"Enviadas: {stats['enviadas']}, Bloqueadas: {stats['bloqueadas']}")
```

### Por Cargo (Rol)

```python
tipo = TipoNotificacion.objects.get(codigo='CAPACITACION_SST')

stats = NotificationService.send_notification_by_role(
    tipo=tipo,
    cargo_id=5,  # ID del cargo "Operario"
    titulo="Capacitación SST obligatoria",
    mensaje="Todos los operarios deben asistir el viernes a las 2pm",
    url="/hseq/capacitaciones/123",
    prioridad='alta'
)
```

### Por Área

```python
tipo = TipoNotificacion.objects.get(codigo='REUNION_AREA')

stats = NotificationService.send_notification_by_area(
    tipo=tipo,
    area_id=3,  # ID del área "Producción"
    titulo="Reunión de área - Viernes 10am",
    mensaje="Asistencia obligatoria para revisar KPIs del mes"
)
```

---

## API Reference

### `NotificationService.send_notification()`

Envía una notificación individual.

**Parámetros:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `tipo` | `TipoNotificacion` | ✅ | Tipo de notificación |
| `usuario` | `User` | ✅ | Usuario destinatario |
| `titulo` | `str` | ✅ | Título de la notificación |
| `mensaje` | `str` | ✅ | Cuerpo del mensaje |
| `url` | `str` | ❌ | URL para navegación (relativa al frontend) |
| `datos_extra` | `dict` | ❌ | JSON con datos adicionales |
| `prioridad` | `str` | ❌ | 'baja', 'normal', 'alta', 'urgente' (default: 'normal') |
| `force` | `bool` | ❌ | Si True, ignora preferencias de usuario (default: False) |

**Returns:** `Notificacion` instance o `None` si se bloqueó

**Ejemplo:**

```python
notif = NotificationService.send_notification(
    tipo=tipo_tarea,
    usuario=user,
    titulo="Tarea vencida",
    mensaje="La tarea 'Actualizar manual' venció ayer",
    url="/planeacion/tareas/789",
    prioridad='urgente',
    datos_extra={'tarea_id': 789, 'dias_vencida': 1}
)
```

---

### `NotificationService.send_bulk_notification()`

Envía notificaciones a múltiples usuarios.

**Parámetros:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `tipo` | `TipoNotificacion` | ✅ | Tipo de notificación |
| `usuarios` | `QuerySet` or `List[User]` | ✅ | Usuarios destinatarios |
| `titulo` | `str` | ✅ | Título de la notificación |
| `mensaje` | `str` | ✅ | Cuerpo del mensaje |
| `url` | `str` | ❌ | URL para navegación |
| `datos_extra` | `dict` | ❌ | JSON con datos adicionales |
| `prioridad` | `str` | ❌ | Prioridad (default: 'normal') |

**Returns:** `Dict` con estadísticas: `{'enviadas': int, 'bloqueadas': int, 'errores': int}`

**Ejemplo:**

```python
usuarios = User.objects.filter(cargo__name='Coordinador SST')
stats = NotificationService.send_bulk_notification(
    tipo=tipo_incidente,
    usuarios=usuarios,
    titulo="Nuevo incidente reportado",
    mensaje="Incidente en Producción: Derrame de químicos",
    url="/hseq/incidentes/456",
    prioridad='urgente'
)
# stats = {'enviadas': 3, 'bloqueadas': 1, 'errores': 0}
```

---

### `NotificationService.send_notification_by_role()`

Envía notificaciones a todos los usuarios con un cargo específico.

**Parámetros:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `tipo` | `TipoNotificacion` | ✅ | Tipo de notificación |
| `cargo_id` | `int` | ✅ | ID del cargo (Cargo model) |
| `titulo` | `str` | ✅ | Título |
| `mensaje` | `str` | ✅ | Mensaje |
| `url` | `str` | ❌ | URL de navegación |
| `**kwargs` | - | ❌ | Otros parámetros de `send_bulk_notification` |

**Returns:** `Dict` con estadísticas

---

### `NotificationService.send_notification_by_area()`

Envía notificaciones a todos los usuarios de un área.

**Parámetros:** Similares a `send_notification_by_role()` pero con `area_id`

---

### `NotificationService.render_template()`

Renderiza una plantilla con variables.

**Parámetros:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `template_string` | `str` | ✅ | Plantilla con `{variables}` |
| `context` | `dict` | ✅ | Diccionario con valores |

**Returns:** `str` renderizado

**Ejemplo:**

```python
template = "Hola {nombre}, tienes {count} tareas pendientes"
resultado = NotificationService.render_template(
    template,
    {'nombre': 'Juan', 'count': 5}
)
# resultado = "Hola Juan, tienes 5 tareas pendientes"
```

---

### Utilidades

```python
# Marcar como leída
NotificationService.mark_as_read(notificacion_id=123)

# Marcar todas como leídas
count = NotificationService.mark_all_as_read(usuario_id=5)

# Obtener contador de no leídas
unread = NotificationService.get_unread_count(usuario_id=5)
```

---

## Ejemplos por Módulo

### 1. Planeación Estratégica

**Cuando se asigna una tarea:**

```python
# backend/apps/gestion_estrategica/planeacion/views.py
from apps.audit_system.centro_notificaciones.services import NotificationService
from apps.audit_system.centro_notificaciones.models import TipoNotificacion

class TareaViewSet(viewsets.ModelViewSet):
    def perform_create(self, serializer):
        tarea = serializer.save()
        self._notificar_nueva_tarea(tarea)

    def _notificar_nueva_tarea(self, tarea):
        try:
            tipo = TipoNotificacion.objects.get(codigo='NUEVA_TAREA')

            NotificationService.send_notification(
                tipo=tipo,
                usuario=tarea.responsable,
                titulo=f"Nueva tarea: {tarea.titulo}",
                mensaje=f"Se te ha asignado: {tarea.descripcion}",
                url=f"/planeacion/tareas/{tarea.id}",
                datos_extra={
                    'tarea_id': tarea.id,
                    'objetivo_id': tarea.objetivo_id
                }
            )
        except TipoNotificacion.DoesNotExist:
            logger.warning('Tipo NUEVA_TAREA no configurado')
```

**Cuando una tarea vence:**

```python
# backend/apps/gestion_estrategica/planeacion/tasks.py (Celery task)
from celery import shared_task
from datetime import date

@shared_task
def check_overdue_tasks():
    """Verifica tareas vencidas y notifica"""
    from .models import Tarea

    tareas_vencidas = Tarea.objects.filter(
        fecha_fin__lt=date.today(),
        estado__in=['pendiente', 'en_progreso']
    )

    tipo = TipoNotificacion.objects.get(codigo='TAREA_VENCIDA')

    for tarea in tareas_vencidas:
        NotificationService.send_notification(
            tipo=tipo,
            usuario=tarea.responsable,
            titulo=f"Tarea vencida: {tarea.titulo}",
            mensaje=f"La tarea venció el {tarea.fecha_fin}. Por favor actualiza su estado.",
            url=f"/planeacion/tareas/{tarea.id}",
            prioridad='urgente'
        )
```

---

### 2. HSEQ Management

**Cuando se reporta un incidente:**

```python
# backend/apps/hseq_management/seguridad_salud/views.py

class IncidenteSST ViewSet(viewsets.ModelViewSet):
    def perform_create(self, serializer):
        incidente = serializer.save()
        self._notificar_coordinadores_sst(incidente)

    def _notificar_coordinadores_sst(self, incidente):
        tipo = TipoNotificacion.objects.get(codigo='INCIDENTE_SST')

        # Notificar a todos los coordinadores SST
        stats = NotificationService.send_notification_by_role(
            tipo=tipo,
            cargo_id=settings.CARGO_COORDINADOR_SST_ID,
            titulo=f"Nuevo incidente SST - {incidente.tipo}",
            mensaje=f"Reportado en {incidente.area.name}: {incidente.descripcion_breve}",
            url=f"/hseq/incidentes/{incidente.id}",
            prioridad='alta' if incidente.gravedad == 'grave' else 'normal',
            datos_extra={
                'incidente_id': incidente.id,
                'gravedad': incidente.gravedad
            }
        )

        logger.info(f"Notificación incidente enviada: {stats}")
```

---

### 3. Workflow Engine (Aprobaciones)

**Cuando llega una solicitud de aprobación:**

```python
# backend/apps/workflow_engine/aprobaciones/views.py

class SolicitudAprobacionViewSet(viewsets.ModelViewSet):
    def perform_create(self, serializer):
        solicitud = serializer.save()
        self._notificar_aprobador(solicitud)

    def _notificar_aprobador(self, solicitud):
        tipo = TipoNotificacion.objects.get(codigo='SOLICITUD_APROBACION')

        NotificationService.send_notification(
            tipo=tipo,
            usuario=solicitud.aprobador,
            titulo=f"Nueva solicitud de {solicitud.solicitante.get_full_name()}",
            mensaje=f"Requiere aprobación: {solicitud.descripcion}",
            url=f"/workflow/aprobaciones/{solicitud.id}",
            prioridad='alta',
            datos_extra={
                'solicitud_id': solicitud.id,
                'tipo_solicitud': solicitud.tipo,
                'monto': str(solicitud.monto) if hasattr(solicitud, 'monto') else None
            }
        )
```

**Cuando se aprueba/rechaza:**

```python
def aprobar_solicitud(self, request, pk=None):
    solicitud = self.get_object()
    solicitud.estado = 'aprobada'
    solicitud.save()

    # Notificar al solicitante
    tipo = TipoNotificacion.objects.get(codigo='APROBACION_CONCEDIDA')
    NotificationService.send_notification(
        tipo=tipo,
        usuario=solicitud.solicitante,
        titulo="Tu solicitud fue aprobada",
        mensaje=f"El aprobador {request.user.get_full_name()} aprobó: {solicitud.descripcion}",
        url=f"/workflow/mis-solicitudes/{solicitud.id}"
    )

    return Response({'status': 'aprobada'})
```

---

### 4. Talent Hub (RRHH)

**Onboarding de nuevo empleado:**

```python
# backend/apps/talent_hub/onboarding/views.py

class ColaboradorViewSet(viewsets.ModelViewSet):
    def perform_create(self, serializer):
        colaborador = serializer.save()

        # Crear usuario
        user = User.objects.create_user(
            username=colaborador.email,
            email=colaborador.email,
            first_name=colaborador.nombre,
            last_name=colaborador.apellido
        )

        # Mensaje de bienvenida
        tipo = TipoNotificacion.objects.get(codigo='BIENVENIDA')
        NotificationService.send_notification(
            tipo=tipo,
            usuario=user,
            titulo=f"¡Bienvenido a {colaborador.empresa.nombre}!",
            mensaje="Completa tu proceso de onboarding en el módulo Talent Hub",
            url="/onboarding/inicio",
            force=True  # Forzar porque es nuevo usuario sin preferencias
        )
```

---

## Mejores Prácticas

### 1. Crear Tipos en Seeds

Crea los tipos de notificación en un seed o migración:

```python
# backend/apps/audit_system/centro_notificaciones/management/commands/seed_notification_types.py

TIPOS_NOTIFICACION = [
    {
        'codigo': 'NUEVA_TAREA',
        'nombre': 'Nueva Tarea Asignada',
        'categoria': 'tarea',
        'plantilla_titulo': 'Nueva tarea: {titulo}',
        'plantilla_mensaje': 'Se te ha asignado: {descripcion}',
        'es_email': True,
        'es_push': True
    },
    # ... más tipos
]
```

### 2. Manejo de Errores

Siempre captura `TipoNotificacion.DoesNotExist`:

```python
try:
    tipo = TipoNotificacion.objects.get(codigo='MI_TIPO')
    NotificationService.send_notification(...)
except TipoNotificacion.DoesNotExist:
    logger.warning('Tipo MI_TIPO no configurado')
    # NO fallar la operación principal
```

### 3. Logging

Usa logging para debugging:

```python
import logging
logger = logging.getLogger(__name__)

stats = NotificationService.send_bulk_notification(...)
logger.info(f"Notificaciones enviadas: {stats}")
```

### 4. Celery para Envíos Masivos

Para envíos a muchos usuarios, usa Celery:

```python
@shared_task
def send_massive_notification(tipo_codigo, user_ids, titulo, mensaje):
    tipo = TipoNotificacion.objects.get(codigo=tipo_codigo)
    usuarios = User.objects.filter(id__in=user_ids)

    return NotificationService.send_bulk_notification(
        tipo=tipo,
        usuarios=usuarios,
        titulo=titulo,
        mensaje=mensaje
    )
```

### 5. Datos Extra Estructurados

Usa `datos_extra` para metadata útil:

```python
NotificationService.send_notification(
    tipo=tipo,
    usuario=user,
    titulo="Nueva tarea",
    mensaje="...",
    datos_extra={
        'entity_type': 'tarea',
        'entity_id': tarea.id,
        'module': 'planeacion',
        'priority_score': tarea.prioridad_numerica,
        'assigned_date': str(tarea.created_at)
    }
)
```

---

## Configuración de Email

En `settings.py`:

```python
# Email backend
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@example.com'
EMAIL_HOST_PASSWORD = 'your-app-password'
DEFAULT_FROM_EMAIL = 'StrateKaz <noreply@stratekaz.com>'

# Frontend URL para links en emails
FRONTEND_URL = 'https://app.stratekaz.com'  # o http://localhost:3010 en dev
```

---

## Testing

```python
# tests/test_notifications.py
from django.test import TestCase
from apps.audit_system.centro_notificaciones.services import NotificationService

class NotificationServiceTest(TestCase):
    def test_send_notification(self):
        tipo = TipoNotificacion.objects.create(
            codigo='TEST',
            nombre='Test',
            categoria='sistema'
        )
        user = User.objects.create_user('test@example.com')

        notif = NotificationService.send_notification(
            tipo=tipo,
            usuario=user,
            titulo="Test",
            mensaje="Test message"
        )

        self.assertIsNotNone(notif)
        self.assertEqual(notif.titulo, "Test")
```

---

## Soporte

- **Documentación:** `docs/desarrollo/API_NOTIFICACIONES.md`
- **Código fuente:** `backend/apps/audit_system/centro_notificaciones/services.py`
- **Modelos:** `backend/apps/audit_system/centro_notificaciones/models.py`

---

**Última actualización:** 20 Enero 2026
**Versión:** 3.5.5
