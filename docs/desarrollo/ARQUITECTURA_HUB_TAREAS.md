# Arquitectura del HUB Centralizado de Tareas

**Módulo**: `apps.gestion_estrategica.gestion_tareas`
**Nivel**: N1 (Gestión Estratégica)
**Fecha**: 2026-01-17

---

## 1. DIAGRAMA DE ARQUITECTURA GENERAL

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ESTRATEKAZ - HUB DE TAREAS                          │
│                    Gestor Centralizado Multi-Módulo                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           CAPA DE PRESENTACIÓN                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│   │              │    │              │    │              │               │
│   │    KANBAN    │    │  CALENDARIO  │    │     LISTA    │               │
│   │    BOARD     │    │  UNIFICADO   │    │   TAREAS     │               │
│   │              │    │              │    │              │               │
│   │  Drag & Drop │    │  Mes/Semana  │    │   Filtros    │               │
│   │  Filtros     │    │  Integrado   │    │   Búsqueda   │               │
│   │              │    │              │    │              │               │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘               │
│          │                   │                   │                        │
│          └───────────────────┼───────────────────┘                        │
│                              │                                            │
└──────────────────────────────┼────────────────────────────────────────────┘
                               │
                               │ REST API
                               │
┌──────────────────────────────▼────────────────────────────────────────────┐
│                        CAPA DE API (ViewSets)                             │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  /api/gestion-estrategica/tareas/                                         │
│                                                                           │
│  ├─ GET    /tareas/              Lista de tareas                          │
│  ├─ POST   /tareas/              Crear tarea                              │
│  ├─ GET    /tareas/:id/          Detalle de tarea                         │
│  ├─ PUT    /tareas/:id/          Actualizar tarea                         │
│  ├─ DELETE /tareas/:id/          Eliminar tarea                           │
│  │                                                                         │
│  ├─ GET    /tareas/mis_tareas/   Tareas del usuario                       │
│  ├─ GET    /tareas/vencidas/     Tareas vencidas                          │
│  ├─ GET    /tareas/por_origen/   Filtrar por módulo origen                │
│  ├─ POST   /tareas/:id/completar/ Marcar como completada                  │
│  ├─ POST   /tareas/:id/mover_kanban/ Mover en tablero Kanban              │
│  │                                                                         │
│  ├─ GET    /kanban/              Tablero Kanban completo                  │
│  ├─ GET    /kanban/estadisticas/ Métricas del tablero                     │
│  │                                                                         │
│  ├─ GET    /calendario/          Eventos y tareas del mes                 │
│  ├─ GET    /calendario/semana/   Vista semanal                            │
│  │                                                                         │
│  ├─ GET    /recordatorios/       Lista de recordatorios                   │
│  ├─ POST   /recordatorios/       Crear recordatorio                       │
│  │                                                                         │
│  └─ GET    /comentarios/         Comentarios de tareas                    │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                               │
                               │ Business Logic
                               │
┌──────────────────────────────▼────────────────────────────────────────────┐
│                         CAPA DE NEGOCIO (Models)                          │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐     │
│  │                         TAREA (HUB)                              │     │
│  │                                                                  │     │
│  │  Campos Core:                                                    │     │
│  │  - codigo (TSK-2026-0001)                                        │     │
│  │  - titulo, descripcion                                           │     │
│  │  - prioridad, tipo                                               │     │
│  │  - asignado_a, creado_por                                        │     │
│  │  - fecha_limite, fecha_inicio, fecha_completada                  │     │
│  │  - porcentaje_avance, notas                                      │     │
│  │                                                                  │     │
│  │  Estado Dual:                                                    │     │
│  │  - estado (legado): pendiente, en_progreso, completada, ...      │     │
│  │  - estado_kanban: BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, ...    │     │
│  │  - orden_kanban (para drag & drop)                              │     │
│  │                                                                  │     │
│  │  Vinculación Polimórfica (GenericForeignKey):                   │     │
│  │  - origen_tipo: PROYECTO, ACCION_CORRECTIVA, PLAN_HSEQ, ...     │     │
│  │  - content_type (FK → ContentType)                              │     │
│  │  - object_id (PK del objeto origen)                             │     │
│  │  - origen_objeto (GenericForeignKey)                            │     │
│  │  - origen_metadata (JSON con info adicional)                    │     │
│  │  - url_relacionada (para navegación)                            │     │
│  │                                                                  │     │
│  │  Metadata:                                                       │     │
│  │  - etiquetas (JSON array)                                        │     │
│  │  - tiempo_estimado, tiempo_real                                 │     │
│  │  - sincronizado, ultima_sincronizacion                          │     │
│  │                                                                  │     │
│  │  Métodos:                                                        │     │
│  │  - generar_codigo()                                              │     │
│  │  - sincronizar_estados()                                         │     │
│  │  - completar()                                                   │     │
│  │                                                                  │     │
│  └──────────────────────────────┬───────────────────────────────────┘     │
│                                 │                                         │
│                                 │ Related                                 │
│                                 │                                         │
│  ┌──────────────────┬───────────┴────────┬──────────────────┐            │
│  │                  │                    │                  │            │
│  │  RECORDATORIO    │  EVENTO_CALENDARIO │  COMENTARIO_TAREA│            │
│  │                  │                    │                  │            │
│  │  - tarea (FK)    │  - tipo            │  - tarea (FK)    │            │
│  │  - usuario       │  - fecha_inicio    │  - usuario       │            │
│  │  - fecha_recor   │  - fecha_fin       │  - mensaje       │            │
│  │  - repetir       │  - participantes   │  - archivo_adj   │            │
│  │  - esta_activo   │  - ubicacion       │                  │            │
│  │                  │  - url_reunion     │                  │            │
│  │                  │                    │                  │            │
│  └──────────────────┴────────────────────┴──────────────────┘            │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                               │
                               │ Signals & Sync
                               │
┌──────────────────────────────▼────────────────────────────────────────────┐
│                    CAPA DE SINCRONIZACIÓN (Signals)                       │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐     │
│  │             SINCRONIZACIÓN BIDIRECCIONAL                         │     │
│  │                                                                  │     │
│  │  Signal: post_save(Tarea)                                        │     │
│  │  ├─ Detectar cambio de estado                                   │     │
│  │  ├─ Identificar módulo origen (origen_tipo)                     │     │
│  │  ├─ Obtener objeto origen (GenericForeignKey)                   │     │
│  │  └─ Ejecutar handler específico:                                │     │
│  │                                                                  │     │
│  │     sync_to_accion_correctiva(tarea):                           │     │
│  │       - DONE → AC.estado = 'CERRADA'                            │     │
│  │       - IN_PROGRESS → AC.estado = 'EN_EJECUCION'                │     │
│  │       - Actualizar AC.fecha_cierre_real                         │     │
│  │                                                                  │     │
│  │     sync_to_plan_hseq(tarea):                                   │     │
│  │       - Sincronizar porcentaje_avance                           │     │
│  │       - DONE → Plan.estado = 'EJECUTADA'                        │     │
│  │                                                                  │     │
│  │     sync_to_proyecto(tarea):                                    │     │
│  │       - Recalcular progreso del proyecto                        │     │
│  │       - Actualizar % basado en tareas completadas               │     │
│  │                                                                  │     │
│  │     sync_to_mantenimiento_vehiculo(tarea):                      │     │
│  │       - DONE → Mantenimiento.estado = 'COMPLETADO'              │     │
│  │       - Actualizar fecha_realizacion                            │     │
│  │                                                                  │     │
│  │     sync_to_hallazgo_auditoria(tarea):                          │     │
│  │       - DONE → Hallazgo.estado = 'CERRADO'                      │     │
│  │       - Actualizar fecha_cierre                                 │     │
│  │                                                                  │     │
│  │  Protección contra loops:                                        │     │
│  │  - Flag skip_sync=True en save()                                │     │
│  │  - Logging de sincronizaciones                                  │     │
│  │  - Actualizar ultima_sincronizacion                             │     │
│  │                                                                  │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐     │
│  │          CREACIÓN AUTOMÁTICA DESDE MÓDULOS ORIGEN                │     │
│  │                                                                  │     │
│  │  crear_tarea_desde_accion_correctiva(ac):                       │     │
│  │    - Trigger: post_save(AccionCorrectiva)                       │     │
│  │    - Crear Tarea con origen_tipo='ACCION_CORRECTIVA'            │     │
│  │    - Vincular con GenericForeignKey                             │     │
│  │    - asignado_a = ac.responsable                                │     │
│  │    - fecha_limite = ac.fecha_cierre_planificada                 │     │
│  │                                                                  │     │
│  │  crear_tarea_desde_plan_hseq(actividad):                        │     │
│  │    - Trigger: post_save(ActividadPlanHSEQ)                      │     │
│  │    - Crear Tarea con origen_tipo='PLAN_HSEQ'                    │     │
│  │    - asignado_a = actividad.responsable                         │     │
│  │                                                                  │     │
│  │  crear_tarea_desde_mantenimiento_pesv(mantenimiento):           │     │
│  │    - Trigger: post_save(MantenimientoVehiculo)                  │     │
│  │    - Crear Tarea con origen_tipo='MANTENIMIENTO_VEHICULO'       │     │
│  │    - Prioridad urgente si es_urgente=True                       │     │
│  │                                                                  │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                               │
                               │ Integration
                               │
┌──────────────────────────────▼────────────────────────────────────────────┐
│                    MÓDULOS ORIGEN (Integraciones)                         │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐             │
│  │   PROYECTOS    │  │   PLAN HSEQ    │  │    ACCIONES    │             │
│  │      (N1)      │  │      (N2)      │  │  CORRECTIVAS   │             │
│  │                │  │                │  │      (N2)      │             │
│  │  Proyecto      │  │  ActividadPlan │  │  AccionCorrect │             │
│  │  ├─ tareas     │  │  ├─ tarea      │  │  ├─ tarea      │             │
│  │  ├─ hitos      │  │  ├─ responsable│  │  ├─ responsable│             │
│  │  └─ % progreso │  │  └─ fechas     │  │  └─ fecha_cierre│            │
│  │                │  │                │  │                │             │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘             │
│           │                   │                   │                      │
│           │                   │                   │                      │
│  ┌────────┴───────┐  ┌────────┴───────┐  ┌────────┴───────┐             │
│  │  HALLAZGOS     │  │ MANTENIMIENTO  │  │  REQUISITOS    │             │
│  │   AUDITORÍA    │  │    VEHÍCULOS   │  │    LEGALES     │             │
│  │      (N6)      │  │      (N4)      │  │      (N5)      │             │
│  │                │  │                │  │                │             │
│  │  HallazgoAud   │  │  MantenimientoV│  │  RequisitoLegal│             │
│  │  ├─ tarea_cierre│ │  ├─ tarea_mtto │  │  ├─ tarea_eval │             │
│  │  ├─ estado     │  │  ├─ mecanico   │  │  ├─ responsable│             │
│  │  └─ fecha_cierre│ │  └─ fecha_prog │  │  └─ periodicidad│            │
│  │                │  │                │  │                │             │
│  └────────────────┘  └────────────────┘  └────────────────┘             │
│                                                                           │
│  Todos apuntan al HUB centralizado mediante:                             │
│  - GenericForeignKey en Tarea                                            │
│  - Signals de sincronización bidireccional                               │
│  - API REST para consultas cross-module                                  │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 2. FLUJO DE DATOS: CREACIÓN DE TAREA

```
┌─────────────────────────────────────────────────────────────────────────────┐
│            FLUJO 1: Creación de Tarea desde Acción Correctiva               │
└─────────────────────────────────────────────────────────────────────────────┘

Usuario crea Acción Correctiva
         │
         │ POST /api/hseq/acciones-correctivas/
         ▼
┌────────────────────────┐
│  AccionCorrectiva      │
│  .save()               │
└────────┬───────────────┘
         │
         │ Signal: post_save
         ▼
┌────────────────────────┐
│  crear_tarea_desde_    │
│  accion_correctiva()   │
└────────┬───────────────┘
         │
         │ Crea Tarea con:
         │ - origen_tipo='ACCION_CORRECTIVA'
         │ - content_type → AccionCorrectiva
         │ - object_id → ac.id
         │ - asignado_a → ac.responsable
         │ - fecha_limite → ac.fecha_cierre_planificada
         ▼
┌────────────────────────┐
│  Tarea.objects.create()│
│  ├─ codigo: TSK-2026-001
│  ├─ estado_kanban: TODO
│  ├─ origen_metadata:
│  │  {
│  │    "modulo": "HSEQ",
│  │    "tipo_accion": "correctiva",
│  │    "hallazgo_id": "..."
│  │  }
│  └─ url_relacionada:
│     "/hseq/acciones-correctivas/123"
└────────┬───────────────┘
         │
         │ Tarea creada en HUB
         ▼
┌────────────────────────┐
│  Frontend recibe       │
│  notificación          │
│  - Mostrar en Kanban   │
│  - Agregar a calendario│
│  - Badge de tareas     │
└────────────────────────┘
```

---

## 3. FLUJO DE DATOS: SINCRONIZACIÓN BIDIRECCIONAL

```
┌─────────────────────────────────────────────────────────────────────────────┐
│         FLUJO 2: Usuario completa Tarea → Sincroniza origen                 │
└─────────────────────────────────────────────────────────────────────────────┘

Usuario arrastra tarea a columna "DONE" en Kanban
         │
         │ POST /api/gestion-estrategica/tareas/123/mover_kanban/
         │ { nuevo_estado: 'DONE', nuevo_orden: 5 }
         ▼
┌────────────────────────┐
│  TareaViewSet          │
│  .mover_kanban()       │
└────────┬───────────────┘
         │
         │ Actualiza:
         │ - estado_kanban = 'DONE'
         │ - orden_kanban = 5
         │ - estado = 'completada' (auto)
         │ - fecha_completada = now()
         ▼
┌────────────────────────┐
│  Tarea.save()          │
└────────┬───────────────┘
         │
         │ Signal: post_save
         ▼
┌────────────────────────┐
│  sincronizar_tarea_    │
│  a_origen()            │
└────────┬───────────────┘
         │
         │ 1. Obtener origen_objeto (GenericFK)
         │ 2. Identificar tipo: AccionCorrectiva
         │ 3. Ejecutar handler
         ▼
┌────────────────────────┐
│  sync_to_accion_       │
│  correctiva(tarea)     │
└────────┬───────────────┘
         │
         │ Actualiza AccionCorrectiva:
         │ - estado = 'CERRADA'
         │ - fecha_cierre_real = tarea.fecha_completada
         ▼
┌────────────────────────┐
│  AccionCorrectiva      │
│  .save(skip_sync=True) │
└────────┬───────────────┘
         │
         │ Skip_sync previene loop infinito
         ▼
┌────────────────────────┐
│  Tarea actualiza       │
│  sincronizado = True   │
│  ultima_sincronizacion │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Frontend actualiza    │
│  - Vista HSEQ muestra  │
│    AC como CERRADA     │
│  - Kanban actualizado  │
│  - Notificación enviada│
└────────────────────────┘
```

---

## 4. MODELO DE DATOS: VINCULACIÓN POLIMÓRFICA

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  GENERICFOREIGNKEY: Vinculación Universal                   │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │    Tarea     │
                              │              │
                              │ origen_tipo  │ ← CharField: 'ACCION_CORRECTIVA'
                              │ content_type │ ← FK(ContentType)
                              │ object_id    │ ← CharField: "uuid-123"
                              │              │
                              │ origen_objeto│ ← GenericForeignKey
                              └──────┬───────┘
                                     │
                                     │ Apunta dinámicamente a:
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────┐      ┌─────────────────┐       ┌─────────────────┐
│ AccionCorrectiva│      │   PlanHSEQ      │       │   Proyecto      │
│                 │      │                 │       │                 │
│ id: uuid-123    │      │ id: uuid-456    │       │ id: uuid-789    │
│ descripcion     │      │ actividad       │       │ nombre          │
│ responsable     │      │ responsable     │       │ owner           │
│ estado          │      │ estado          │       │ progreso        │
│ fecha_cierre    │      │ fecha_fin       │       │                 │
└─────────────────┘      └─────────────────┘       └─────────────────┘
    ContentType:             ContentType:              ContentType:
    hseq.AccionCorrectiva    hseq.PlanHSEQ            gestion_proyectos.Proyecto


Ventajas:
✓ Una tabla Tarea para TODO el sistema
✓ No crear tablas por cada módulo origen
✓ Consultas eficientes con content_type
✓ Fácil agregar nuevos orígenes
✓ Sincronización bidireccional simple

Ejemplo de consulta:
  # Todas las tareas de un proyecto específico
  from django.contrib.contenttypes.models import ContentType

  proyecto = Proyecto.objects.get(id='uuid-789')
  ct = ContentType.objects.get_for_model(proyecto)

  tareas = Tarea.objects.filter(
      content_type=ct,
      object_id=str(proyecto.id)
  )

  # Obtener objeto origen desde tarea
  tarea = Tarea.objects.get(codigo='TSK-2026-001')
  origen = tarea.origen_objeto  # Devuelve AccionCorrectiva, Proyecto, etc.
```

---

## 5. ESTADOS KANBAN vs ESTADOS LEGADO

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MAPEO DE ESTADOS (Dual State)                          │
└─────────────────────────────────────────────────────────────────────────────┘

ESTADO KANBAN (Nuevo)         ESTADO LEGADO (Compatibilidad)
─────────────────────         ──────────────────────────────

    BACKLOG                   →        pendiente
       │                               (no iniciada)
       │
       ▼
      TODO                    →        pendiente
       │                               (por hacer)
       │
       ▼
   IN_PROGRESS                →        en_progreso
       │                               (en ejecución)
       │
       ▼
    IN_REVIEW                 →        en_progreso
       │                               (en revisión)
       │
       ▼
      DONE                    →        completada
                                       (finalizada)

    CANCELLED                 →        cancelada
                                       (anulada)


Sincronización Automática:
────────────────────────────

  def sincronizar_estados(self):
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


Razón del Estado Dual:
────────────────────────
- estado_kanban: Para UI moderna (Kanban board)
- estado: Para compatibilidad con módulos legacy
- Sincronización automática en save()
- Evita romper integraciones existentes
```

---

## 6. ÍNDICES DE BASE DE DATOS

```sql
-- Índices optimizados para performance del HUB

-- Índice para Kanban board (filtrado por empresa y estado)
CREATE INDEX idx_tarea_kanban
ON gestion_tareas_tarea (empresa_id, estado_kanban, orden_kanban);

-- Índice para "Mis Tareas"
CREATE INDEX idx_tarea_asignado
ON gestion_tareas_tarea (asignado_a_id, estado, fecha_limite DESC);

-- Índice para consultas por origen
CREATE INDEX idx_tarea_origen
ON gestion_tareas_tarea (origen_tipo, object_id);

-- Índice compuesto para filtros comunes
CREATE INDEX idx_tarea_empresa_origen_estado
ON gestion_tareas_tarea (empresa_id, origen_tipo, estado_kanban);

-- Índice para búsqueda de código único
CREATE UNIQUE INDEX idx_tarea_codigo
ON gestion_tareas_tarea (codigo);

-- Índice para tareas vencidas
CREATE INDEX idx_tarea_vencidas
ON gestion_tareas_tarea (empresa_id, fecha_limite)
WHERE estado_kanban IN ('TODO', 'IN_PROGRESS', 'IN_REVIEW');
```

---

## 7. METADATA JSON: Estructura

```json
{
  "origen_metadata": {
    "modulo": "HSEQ",
    "submódulo": "acciones_correctivas",
    "tipo_accion": "correctiva",
    "criticidad": "alta",

    "hallazgo_id": "uuid-hallazgo-123",
    "hallazgo_descripcion": "Falta EPP en área de soldadura",
    "auditoria_id": "uuid-auditoria-456",

    "requisito_normativo": "Decreto 1072/2015 Art. 2.2.4.6.8",

    "proceso_afectado": "Producción - Soldadura",
    "area": "Planta 2 - Piso 3",

    "recursos_requeridos": [
      "Compra de EPP",
      "Capacitación en uso"
    ],

    "costo_estimado": 2500000,
    "moneda": "COP",

    "stakeholders": [
      {
        "usuario_id": "uuid-user-1",
        "rol": "Supervisor SST"
      },
      {
        "usuario_id": "uuid-user-2",
        "rol": "Jefe de Producción"
      }
    ],

    "evidencias_requeridas": [
      "Factura de compra EPP",
      "Registro de capacitación",
      "Foto de implementación"
    ],

    "kpis_impactados": [
      {
        "kpi_id": "uuid-kpi-1",
        "nombre": "Índice de accidentalidad",
        "impacto_esperado": "Reducción 20%"
      }
    ]
  }
}
```

---

## 8. NOTIFICACIONES Y ALERTAS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE NOTIFICACIONES DEL HUB                        │
└─────────────────────────────────────────────────────────────────────────────┘

Eventos que disparan notificaciones:
────────────────────────────────────

1. TAREA ASIGNADA
   Usuario: asignado_a
   Canal: Email + Push + In-App
   Contenido:
     "Se te ha asignado la tarea TSK-2026-001: [Título]
      Módulo: Acción Correctiva
      Prioridad: Alta
      Vence: 2026-02-15"

2. TAREA PRÓXIMA A VENCER (3 días antes)
   Usuario: asignado_a
   Canal: Email + SMS + Push
   Contenido:
     "⚠️ La tarea TSK-2026-001 vence en 3 días
      Progreso actual: 40%
      Acción requerida urgente"

3. TAREA VENCIDA
   Usuario: asignado_a, supervisor, creado_por
   Canal: Email + SMS + Push + Escalación
   Contenido:
     "🔴 VENCIDA: Tarea TSK-2026-001
      Fecha límite: 2026-02-15
      Módulo: Plan HSEQ
      Impacto: Cumplimiento legal"

4. TAREA COMPLETADA
   Usuario: creado_por, stakeholders del origen
   Canal: Email + In-App
   Contenido:
     "✓ Tarea completada: TSK-2026-001
      Responsable: Juan Pérez
      Módulo origen actualizado automáticamente"

5. TAREA REASIGNADA
   Usuario: nuevo asignado + anterior asignado
   Canal: Email + Push
   Contenido:
     "Tarea TSK-2026-001 reasignada
      De: María García
      A: Carlos López
      Razón: [...]"

6. COMENTARIO EN TAREA
   Usuario: asignado_a, creado_por, participantes
   Canal: Push + In-App
   Contenido:
     "💬 Nuevo comentario en TSK-2026-001
      Por: Ana Rodríguez
      Mensaje: [...]"

7. MÓDULO ORIGEN ACTUALIZADO
   Usuario: asignado_a
   Canal: In-App
   Contenido:
     "ℹ️ Acción Correctiva vinculada cambió de estado
      Nuevo estado: EN_REVISION
      Puede requerir tu atención"


Recordatorios programados (Celery):
────────────────────────────────────

@periodic_task(run_every=crontab(hour=8, minute=0))
def enviar_resumen_diario_tareas():
    """Enviar a cada usuario sus tareas del día"""
    usuarios = User.objects.filter(is_active=True)

    for usuario in usuarios:
        tareas_hoy = Tarea.objects.filter(
            asignado_a=usuario,
            fecha_limite__date=date.today(),
            estado_kanban__in=['TODO', 'IN_PROGRESS']
        )

        if tareas_hoy.exists():
            send_email(
                to=usuario.email,
                subject=f"Tienes {tareas_hoy.count()} tareas para hoy",
                template='tareas_diarias',
                context={'tareas': tareas_hoy}
            )


@periodic_task(run_every=crontab(hour=9, minute=0, day_of_week='monday'))
def enviar_resumen_semanal():
    """Resumen semanal de tareas para managers"""
    managers = User.objects.filter(
        rol__in=['MANAGER', 'DIRECTOR']
    )

    for manager in managers:
        # Estadísticas del equipo
        stats = calcular_estadisticas_equipo(manager)

        send_email(
            to=manager.email,
            subject="Resumen semanal de tareas - Tu equipo",
            template='resumen_semanal',
            context={'stats': stats}
        )
```

---

## 9. MÉTRICAS Y ANALYTICS

```python
# Métricas del HUB disponibles en API

GET /api/gestion-estrategica/tareas/metricas/

Response:
{
  "global": {
    "total_tareas": 1250,
    "completadas": 890,
    "en_progreso": 280,
    "vencidas": 80,
    "tasa_completitud": 71.2,  // %
    "tiempo_promedio_cierre": "5.3 días"
  },

  "por_modulo": {
    "ACCION_CORRECTIVA": {
      "total": 320,
      "completadas": 280,
      "vencidas": 15,
      "tasa_completitud": 87.5
    },
    "PLAN_HSEQ": {
      "total": 450,
      "completadas": 380,
      "vencidas": 25,
      "tasa_completitud": 84.4
    },
    "PROYECTO": {
      "total": 280,
      "completadas": 150,
      "vencidas": 30,
      "tasa_completitud": 53.6
    }
  },

  "por_prioridad": {
    "urgente": {
      "total": 85,
      "completadas": 70,
      "vencidas": 5,
      "tiempo_promedio": "2.1 días"
    },
    "alta": {
      "total": 320,
      "completadas": 250,
      "vencidas": 30,
      "tiempo_promedio": "4.5 días"
    }
  },

  "usuarios_top": [
    {
      "usuario": "Juan Pérez",
      "completadas": 45,
      "en_tiempo": 42,
      "tasa_cumplimiento": 93.3
    },
    {
      "usuario": "María García",
      "completadas": 38,
      "en_tiempo": 35,
      "tasa_cumplimiento": 92.1
    }
  ],

  "tendencias": {
    "ultimos_30_dias": {
      "creadas": 180,
      "completadas": 165,
      "tendencia": "estable"
    },
    "mes_anterior": {
      "creadas": 175,
      "completadas": 160
    }
  },

  "bottlenecks": [
    {
      "modulo": "PROYECTO",
      "estado": "IN_REVIEW",
      "tareas_bloqueadas": 15,
      "tiempo_promedio_bloqueo": "8.5 días"
    }
  ]
}
```

---

## 10. SEGURIDAD Y PERMISOS

```python
# RBAC en el HUB de Tareas

Permisos por rol:
─────────────────

WORKER (Trabajador):
- Ver tareas propias
- Actualizar progreso de tareas asignadas
- Comentar en tareas propias
- Marcar como completada (con aprobación)

SUPERVISOR:
- Ver tareas del equipo
- Reasignar tareas del área
- Aprobar completitud de tareas
- Crear tareas manuales
- Ver métricas del equipo

COORDINATOR (SST, PESV, etc.):
- Ver todas las tareas del módulo
- Crear tareas del módulo
- Modificar cualquier tarea del módulo
- Ver dashboards específicos
- Configurar automatizaciones

MANAGER:
- Ver todas las tareas de la empresa
- Reasignar cualquier tarea
- Ver métricas globales
- Exportar reportes
- Configurar SLA por módulo

ADMIN:
- Acceso total
- Configurar integraciones
- Gestionar sincronizaciones
- Ver logs de auditoría


Filters de seguridad (queryset):
────────────────────────────────

class TareaViewSet(BaseCompanyViewSet):
    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()

        # Filtro por empresa (multi-tenant)
        qs = qs.filter(empresa=user.empresa)

        # Filtro por rol
        if user.rol == 'WORKER':
            # Solo sus tareas
            qs = qs.filter(asignado_a=user)

        elif user.rol == 'SUPERVISOR':
            # Tareas de su área
            qs = qs.filter(
                asignado_a__area=user.area
            )

        elif user.rol in ['COORDINATOR', 'MANAGER', 'ADMIN']:
            # Todas las tareas
            pass

        return qs
```

---

**Última actualización**: 2026-01-17
**Versión**: 1.0
**Autor**: BPM_SPECIALIST
