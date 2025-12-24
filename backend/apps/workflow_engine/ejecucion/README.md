# Módulo de Ejecución - Workflow Engine

## Descripción

Sistema de ejecución de workflows (BPM) que gestiona instancias de flujos de trabajo, tareas activas, historial de cambios, archivos adjuntos y notificaciones.

## Modelos Implementados

### 1. InstanciaFlujo
**Tabla:** `workflow_exec_instancia_flujo`

Representa una ejecución específica de una PlantillaFlujo.

**Estados:**
- `INICIADO` - Flujo creado, esperando primera acción
- `EN_PROCESO` - Flujo activo con tareas en curso
- `PAUSADO` - Flujo temporalmente detenido
- `COMPLETADO` - Flujo terminado exitosamente
- `CANCELADO` - Flujo cancelado por usuario o error

**Campos Principales:**
- `codigo_instancia` (unique) - Código único (ej: WF-SC-2025-0042)
- `titulo` - Título descriptivo
- `plantilla` (FK) - PlantillaFlujo base
- `nodo_actual` (FK) - Estado actual en el flujo
- `estado` - Estado del ciclo de vida
- `prioridad` - BAJA, NORMAL, ALTA, URGENTE
- `entidad_tipo` / `entidad_id` - Relación polimórfica con objeto de negocio
- `data_contexto` (JSON) - Datos variables del flujo
- `variables_flujo` (JSON) - Variables personalizadas
- `fecha_inicio`, `fecha_fin`, `fecha_limite` - Gestión de tiempos
- `tiempo_total_horas` - Calculado automáticamente
- `iniciado_por`, `responsable_actual`, `finalizado_por` - Participantes

**Propiedades Calculadas:**
- `esta_vencida` - Verifica si la instancia superó fecha_limite
- `progreso_porcentaje` - Calcula % de tareas completadas

**Índices:**
- empresa_id + estado
- empresa_id + plantilla
- entidad_tipo + entidad_id
- responsable_actual + estado
- fecha_limite

---

### 2. TareaActiva
**Tabla:** `workflow_exec_tarea_activa`

Representa una acción pendiente en un nodo del flujo.

**Estados:**
- `PENDIENTE` - Tarea creada, esperando inicio
- `EN_PROGRESO` - Usuario trabajando en la tarea
- `COMPLETADA` - Tarea finalizada exitosamente
- `RECHAZADA` - Tarea rechazada (flujo retrocede)
- `ESCALADA` - Tarea escalada por vencimiento

**Tipos de Tarea:**
- `APROBACION` - Requiere aprobación
- `REVISION` - Requiere revisión
- `FORMULARIO` - Captura de datos
- `NOTIFICACION` - Solo informativa
- `FIRMA` - Requiere firma digital
- `SISTEMA` - Tarea automática

**Campos Principales:**
- `codigo_tarea` (unique) - Código único (ej: TK-2025-0042-001)
- `nombre_tarea` - Nombre descriptivo
- `instancia` (FK) - InstanciaFlujo padre
- `nodo` (FK) - Nodo que generó la tarea
- `tipo_tarea` - Tipo de acción requerida
- `estado` - Estado actual
- `asignado_a` (FK User) - Usuario responsable
- `rol_asignado` - Alternativa a usuario específico
- `fecha_vencimiento` - SLA de la tarea
- `formulario_schema` (JSON) - Definición del formulario
- `formulario_data` (JSON) - Datos capturados
- `decision` - Decisión tomada (APROBAR, RECHAZAR, etc.)
- `escalada_a` (FK User) - Usuario al que se escaló
- `motivo_rechazo` - Razón del rechazo

**Propiedades Calculadas:**
- `esta_vencida` - Verifica si superó fecha_vencimiento
- `horas_restantes` - Horas hasta vencimiento

**Índices:**
- empresa_id + estado
- asignado_a + estado
- instancia + estado
- fecha_vencimiento
- rol_asignado + estado

---

### 3. HistorialTarea
**Tabla:** `workflow_exec_historial_tarea`

Registra cada cambio de estado, asignación o modificación de una tarea.

**Acciones Registradas:**
- `CREACION` - Creación de tarea
- `ASIGNACION` - Asignación inicial
- `REASIGNACION` - Cambio de asignado
- `INICIO` - Usuario comenzó la tarea
- `COMPLETACION` - Tarea completada
- `RECHAZO` - Tarea rechazada
- `ESCALAMIENTO` - Tarea escalada
- `COMENTARIO` - Comentario agregado
- `MODIFICACION` - Cambio de campos
- `CANCELACION` - Tarea cancelada

**Campos Principales:**
- `tarea` (FK) - Tarea auditada
- `instancia` (FK) - Instancia (denormalizado)
- `accion` - Tipo de acción realizada
- `descripcion` - Descripción detallada
- `estado_anterior` / `estado_nuevo` - Para transiciones de estado
- `asignado_anterior` / `asignado_nuevo` - Para reasignaciones
- `datos_cambio` (JSON) - Detalles adicionales del cambio
- `usuario` (FK) - Quien realizó la acción
- `fecha_accion` - Timestamp de la acción

**Índices:**
- empresa_id + tarea
- instancia + fecha_accion
- accion + fecha_accion
- usuario + fecha_accion

---

### 4. ArchivoAdjunto
**Tabla:** `workflow_exec_archivo_adjunto`

Archivos adjuntos a instancias o tareas.

**Tipos de Archivo:**
- `FORMULARIO` - Formulario completado
- `EVIDENCIA` - Evidencia de ejecución
- `DOCUMENTO` - Documento general
- `IMAGEN` - Imagen o foto
- `FIRMA` - Firma digital
- `OTRO` - Otro tipo

**Campos Principales:**
- `instancia` (FK, nullable) - Instancia asociada
- `tarea` (FK, nullable) - Tarea asociada
- `archivo` (FileField) - Archivo físico
- `nombre_original` - Nombre original del archivo
- `tipo_archivo` - Categoría del archivo
- `mime_type` - Tipo MIME (application/pdf, etc.)
- `tamano_bytes` - Tamaño del archivo
- `titulo`, `descripcion` - Metadatos descriptivos
- `metadatos` (JSON) - Metadatos adicionales
- `subido_por` (FK User) - Quien subió el archivo

**Validaciones:**
- Debe estar asociado a instancia O tarea (no ambos, no ninguno)

**Propiedades Calculadas:**
- `tamano_legible` - Convierte bytes a KB/MB/GB

**Índices:**
- empresa_id + instancia
- empresa_id + tarea
- tipo_archivo
- subido_por + fecha_subida

---

### 5. NotificacionFlujo
**Tabla:** `workflow_exec_notificacion_flujo`

Sistema de notificaciones para informar sobre eventos del workflow.

**Tipos de Notificación:**
- `TAREA_ASIGNADA` - Nueva tarea asignada
- `TAREA_VENCIDA` - Tarea vencida
- `TAREA_COMPLETADA` - Tarea completada
- `TAREA_RECHAZADA` - Tarea rechazada
- `TAREA_ESCALADA` - Tarea escalada
- `FLUJO_INICIADO` - Nuevo flujo iniciado
- `FLUJO_COMPLETADO` - Flujo completado
- `FLUJO_CANCELADO` - Flujo cancelado
- `APROBACION_REQUERIDA` - Aprobación requerida
- `COMENTARIO_NUEVO` - Nuevo comentario
- `ALERTA` - Alerta general

**Canales Soportados:**
- Notificación en aplicación (bandeja de entrada)
- Email
- SMS (futuro)
- Push (futuro)

**Campos Principales:**
- `destinatario` (FK User) - Usuario que recibe
- `instancia` (FK, nullable) - Instancia relacionada
- `tarea` (FK, nullable) - Tarea relacionada
- `tipo_notificacion` - Categoría de la notificación
- `titulo` - Título de la notificación
- `mensaje` - Contenido del mensaje
- `prioridad` - BAJA, NORMAL, ALTA, URGENTE
- `datos_contexto` (JSON) - Datos para renderizar
- `url_accion` - URL a la que redirigir
- `leida` - Estado de lectura
- `fecha_lectura` - Timestamp de lectura
- `enviada_app`, `enviada_email` - Canales utilizados
- `email_enviado_exitoso` - Estado de envío email

**Métodos:**
- `marcar_como_leida()` - Marca la notificación como leída

**Propiedades Calculadas:**
- `tiempo_desde_creacion` - Formato legible (hace X minutos/horas/días)

**Índices:**
- empresa_id + destinatario + leida
- destinatario + fecha_creacion
- tipo_notificacion
- instancia
- tarea

---

## Características Implementadas

### Multi-Tenancy
Todos los modelos incluyen `empresa_id = models.PositiveBigIntegerField(db_index=True)` para aislamiento de datos.

### Auditoría
- `created_at` / `updated_at` en modelos principales
- `created_by` en TareaActiva
- HistorialTarea completo para trazabilidad

### Validaciones
- Validación de que nodos pertenecen a plantillas correctas
- Validación de estados requeridos (motivo_cancelacion, motivo_rechazo)
- Auto-cálculo de tiempos (tiempo_total_horas, tiempo_ejecucion_horas)
- Validación de archivos (asociación exclusiva a instancia O tarea)

### Campos Polimórficos
- `entidad_tipo` / `entidad_id` en InstanciaFlujo para vincular con objetos de negocio
- `instancia` / `tarea` en ArchivoAdjunto y NotificacionFlujo para flexibilidad

### Índices Optimizados
Todos los modelos incluyen índices compuestos para:
- Consultas por empresa + estado
- Consultas por usuario asignado
- Búsquedas por fechas
- Relaciones polimórficas

### Campos JSON
- `data_contexto` - Datos dinámicos del flujo
- `variables_flujo` - Variables personalizadas
- `formulario_schema` - Definición de formularios
- `formulario_data` - Datos capturados
- `datos_cambio` - Detalles de auditoría
- `metadatos` - Información adicional

## Integración con Otros Módulos

### disenador_flujos
- `PlantillaFlujo` - Definición del flujo
- `NodoFlujo` - Estados/pasos del flujo
- `ConexionFlujo` - Transiciones entre nodos

### monitoreo
- `AlertaFlujo` - Alertas generadas por instancias
- `MetricaFlujo` - Métricas de desempeño
- `ReglaSLA` - Reglas de nivel de servicio

### core
- `User` - Usuarios del sistema
- Permisos y roles

## Próximos Pasos

1. Crear migraciones: `python manage.py makemigrations ejecucion`
2. Aplicar migraciones: `python manage.py migrate`
3. Implementar serializers en `serializers.py`
4. Implementar views/viewsets en `views.py`
5. Configurar URLs en `urls.py`
6. Crear admin.py para gestión Django Admin
7. Implementar tests en `tests.py`

## Ejemplos de Uso

### Crear una Instancia de Flujo
```python
from apps.workflow_engine.ejecucion.models import InstanciaFlujo

instancia = InstanciaFlujo.objects.create(
    codigo_instancia='WF-SC-2025-0042',
    titulo='Solicitud de Compra - Materiales Limpieza',
    plantilla_id=1,
    estado='INICIADO',
    prioridad='NORMAL',
    entidad_tipo='solicitud_compra',
    entidad_id=42,
    iniciado_por_id=1,
    empresa_id=1
)
```

### Crear una Tarea Activa
```python
from apps.workflow_engine.ejecucion.models import TareaActiva

tarea = TareaActiva.objects.create(
    codigo_tarea='TK-2025-0042-001',
    nombre_tarea='Aprobar Solicitud de Compra',
    instancia=instancia,
    nodo_id=5,
    tipo_tarea='APROBACION',
    asignado_a_id=2,
    estado='PENDIENTE',
    empresa_id=1
)
```

### Registrar en Historial
```python
from apps.workflow_engine.ejecucion.models import HistorialTarea

HistorialTarea.objects.create(
    tarea=tarea,
    instancia=instancia,
    accion='ASIGNACION',
    descripcion='Tarea asignada a Juan Pérez',
    asignado_nuevo_id=2,
    usuario_id=1,
    empresa_id=1
)
```

### Adjuntar Archivo
```python
from apps.workflow_engine.ejecucion.models import ArchivoAdjunto

archivo = ArchivoAdjunto.objects.create(
    tarea=tarea,
    archivo=request.FILES['archivo'],
    nombre_original='cotizacion.pdf',
    tipo_archivo='DOCUMENTO',
    mime_type='application/pdf',
    tamano_bytes=245678,
    subido_por_id=2,
    empresa_id=1
)
```

### Crear Notificación
```python
from apps.workflow_engine.ejecucion.models import NotificacionFlujo

NotificacionFlujo.objects.create(
    destinatario_id=2,
    instancia=instancia,
    tarea=tarea,
    tipo_notificacion='TAREA_ASIGNADA',
    titulo='Nueva tarea asignada',
    mensaje='Se le ha asignado la tarea: Aprobar Solicitud de Compra',
    prioridad='NORMAL',
    url_accion='/tareas/TK-2025-0042-001',
    enviada_app=True,
    enviada_email=True,
    empresa_id=1
)
```

## Consultas Útiles

### Tareas Pendientes por Usuario
```python
from django.contrib.auth import get_user_model
User = get_user_model()

usuario = User.objects.get(id=2)
tareas_pendientes = usuario.tareas_asignadas.filter(
    estado__in=['PENDIENTE', 'EN_PROGRESO'],
    empresa_id=1
).select_related('instancia', 'nodo').order_by('fecha_vencimiento')
```

### Instancias Vencidas
```python
from django.utils import timezone

instancias_vencidas = InstanciaFlujo.objects.filter(
    empresa_id=1,
    estado__in=['INICIADO', 'EN_PROCESO'],
    fecha_limite__lt=timezone.now()
)
```

### Historial de una Tarea
```python
historial = tarea.historial.select_related(
    'usuario',
    'asignado_anterior',
    'asignado_nuevo'
).order_by('-fecha_accion')
```

### Notificaciones No Leídas
```python
notificaciones = usuario.notificaciones_flujo.filter(
    leida=False,
    empresa_id=1
).order_by('-fecha_creacion')
```
