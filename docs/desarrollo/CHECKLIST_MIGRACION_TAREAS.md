# Checklist de Migración: Gestor de Tareas → Hub N1

**Fecha inicio**: ___________
**Responsable**: ___________
**Fecha estimada fin**: ___________ (18-20 días)

---

## FASE 1: PREPARACIÓN (1 día)

### Día 1: Setup inicial

- [ ] **1.1** Crear backup completo de base de datos
  ```bash
  pg_dump -U postgres stratekaz > backup_pre_migracion_tareas_$(date +%Y%m%d).sql
  ```

- [ ] **1.2** Crear rama de feature
  ```bash
  git checkout -b feature/hub-tareas-n1
  ```

- [ ] **1.3** Crear estructura de directorios
  ```bash
  cd c:/Proyectos/StrateKaz/backend/apps/gestion_estrategica
  mkdir -p gestion_tareas/{models,serializers,viewsets,signals,tests,migrations}
  ```

- [ ] **1.4** Crear archivos __init__.py
  ```bash
  touch gestion_tareas/__init__.py
  touch gestion_tareas/models/__init__.py
  touch gestion_tareas/serializers/__init__.py
  touch gestion_tareas/viewsets/__init__.py
  touch gestion_tareas/signals/__init__.py
  touch gestion_tareas/tests/__init__.py
  ```

- [ ] **1.5** Verificar dependencias actuales
  ```bash
  grep -r "tareas_recordatorios" backend/ --include="*.py" > dependencias_tareas.txt
  ```

**Validación Fase 1**:
- [ ] Estructura de directorios creada
- [ ] Backup confirmado y verificado
- [ ] Rama git creada
- [ ] Archivo de dependencias generado

---

## FASE 2: MODELOS MEJORADOS (2 días)

### Día 2: Modelo Tarea principal

- [ ] **2.1** Crear apps.py
  ```python
  # apps/gestion_estrategica/gestion_tareas/apps.py
  ```

- [ ] **2.2** Crear modelo Tarea mejorado
  ```python
  # apps/gestion_estrategica/gestion_tareas/models/tarea.py
  - Campo origen_tipo con ORIGEN_TIPO_CHOICES
  - Campo estado_kanban con ESTADO_KANBAN_CHOICES
  - Campo orden_kanban
  - GenericForeignKey mejorado
  - Campo origen_metadata (JSONField)
  - Campos de sincronización
  - Método generar_codigo()
  - Método sincronizar_estados()
  ```

- [ ] **2.3** Crear modelos relacionados
  ```python
  # apps/gestion_estrategica/gestion_tareas/models/recordatorio.py
  # apps/gestion_estrategica/gestion_tareas/models/evento.py
  # apps/gestion_estrategica/gestion_tareas/models/comentario.py
  ```

- [ ] **2.4** Crear archivo de integraciones
  ```python
  # apps/gestion_estrategica/gestion_tareas/models/integraciones.py
  ORIGEN_MODELO_MAP = {...}
  ```

- [ ] **2.5** Actualizar __init__.py de models
  ```python
  # apps/gestion_estrategica/gestion_tareas/models/__init__.py
  from .tarea import Tarea, ORIGEN_TIPO_CHOICES, ESTADO_KANBAN_CHOICES
  from .recordatorio import Recordatorio
  from .evento import EventoCalendario
  from .comentario import ComentarioTarea
  ```

### Día 3: Admin y configuración

- [ ] **2.6** Crear admin.py
  ```python
  # apps/gestion_estrategica/gestion_tareas/admin.py
  ```

- [ ] **2.7** Registrar en INSTALLED_APPS
  ```python
  # config/settings.py
  'apps.gestion_estrategica.gestion_tareas',
  ```

- [ ] **2.8** Crear migración inicial
  ```bash
  python manage.py makemigrations gestion_tareas
  ```

- [ ] **2.9** Revisar migración generada
  ```bash
  python manage.py sqlmigrate gestion_tareas 0001
  ```

**Validación Fase 2**:
- [ ] Modelos creados sin errores de sintaxis
- [ ] Migración generada correctamente
- [ ] Todos los campos requeridos presentes
- [ ] GenericForeignKey configurado
- [ ] Tests de importación pasando:
  ```bash
  python manage.py shell -c "from apps.gestion_estrategica.gestion_tareas.models import Tarea; print('OK')"
  ```

---

## FASE 3: SISTEMA DE SIGNALS (1 día)

### Día 4: Sincronización

- [ ] **3.1** Crear signals/sincronizacion.py
  ```python
  @receiver(post_save, sender=Tarea)
  def sincronizar_tarea_a_origen(sender, instance, created, **kwargs)
  ```

- [ ] **3.2** Implementar handlers de sincronización
  ```python
  def sync_to_accion_correctiva(tarea)
  def sync_to_plan_hseq(tarea)
  def sync_to_proyecto(tarea)
  def sync_to_hallazgo_auditoria(tarea)
  def sync_to_mantenimiento_vehiculo(tarea)
  ```

- [ ] **3.3** Implementar funciones de creación
  ```python
  def crear_tarea_desde_accion_correctiva(ac)
  def crear_tarea_desde_plan_hseq(plan)
  def crear_tarea_desde_mantenimiento_pesv(mtto)
  ```

- [ ] **3.4** Registrar signals en apps.py
  ```python
  def ready(self):
      import apps.gestion_estrategica.gestion_tareas.signals.sincronizacion
  ```

- [ ] **3.5** Crear tests de signals
  ```python
  # tests/test_signals.py
  test_crear_tarea_desde_accion_correctiva()
  test_sincronizacion_bidireccional()
  ```

**Validación Fase 3**:
- [ ] Signals registrados correctamente
- [ ] Tests de signals pasando
- [ ] No hay loops infinitos (verificado)
- [ ] Logging de sincronizaciones funciona

---

## FASE 4: SERIALIZERS (1 día)

### Día 5: API Serializers

- [ ] **4.1** Crear TareaSerializer
  ```python
  # serializers/tarea_serializers.py
  class TareaSerializer(serializers.ModelSerializer)
  class TareaCreateSerializer
  class TareaUpdateSerializer
  ```

- [ ] **4.2** Crear KanbanSerializer
  ```python
  # serializers/kanban_serializers.py
  class TareaKanbanSerializer
  class KanbanColumnaSerializer
  ```

- [ ] **4.3** Crear CalendarioSerializer
  ```python
  # serializers/calendario_serializers.py
  class EventoCalendarioSerializer
  ```

- [ ] **4.4** Crear serializers de modelos relacionados
  ```python
  class RecordatorioSerializer
  class ComentarioTareaSerializer
  ```

- [ ] **4.5** Actualizar __init__.py
  ```python
  # serializers/__init__.py
  ```

**Validación Fase 4**:
- [ ] Serializers sin errores de importación
- [ ] Tests de serialización pasando
- [ ] Campos calculados funcionando (origen_tipo_display, etc.)

---

## FASE 5: VIEWSETS (2 días)

### Día 6: ViewSets principales

- [ ] **5.1** Crear TareaViewSet
  ```python
  # viewsets/tarea_viewsets.py
  class TareaViewSet(BaseCompanyViewSet)
  - list, create, retrieve, update, delete
  - @action mis_tareas
  - @action vencidas
  - @action por_origen
  - @action mover_kanban
  - @action completar
  ```

- [ ] **5.2** Crear RecordatorioViewSet
  ```python
  class RecordatorioViewSet
  ```

- [ ] **5.3** Crear EventoCalendarioViewSet
  ```python
  class EventoCalendarioViewSet
  ```

- [ ] **5.4** Crear ComentarioTareaViewSet
  ```python
  class ComentarioTareaViewSet
  ```

### Día 7: ViewSets especializados

- [ ] **5.5** Crear KanbanViewSet
  ```python
  # viewsets/kanban_viewsets.py
  class KanbanViewSet(viewsets.ViewSet)
  - list (obtener columnas)
  - @action estadisticas
  ```

- [ ] **5.6** Crear CalendarioViewSet
  ```python
  # viewsets/calendario_viewsets.py
  class CalendarioViewSet(viewsets.ViewSet)
  - list (eventos + tareas del mes)
  - @action semana
  ```

- [ ] **5.7** Implementar filtros y permisos
  ```python
  - Filtros por origen_tipo
  - Filtros por estado_kanban
  - RBAC por rol de usuario
  ```

**Validación Fase 5**:
- [ ] Todos los endpoints respondiendo
- [ ] Filtros funcionando correctamente
- [ ] Permisos RBAC aplicados
- [ ] Tests de API pasando

---

## FASE 6: URLS Y REGISTRO (1 día)

### Día 8: Configuración de URLs

- [ ] **6.1** Crear urls.py del módulo
  ```python
  # gestion_tareas/urls.py
  router.register(r'tareas', TareaViewSet)
  router.register(r'recordatorios', RecordatorioViewSet)
  router.register(r'eventos', EventoCalendarioViewSet)
  router.register(r'comentarios', ComentarioTareaViewSet)
  router.register(r'kanban', KanbanViewSet)
  router.register(r'calendario', CalendarioViewSet)
  ```

- [ ] **6.2** Registrar en URLs de gestion_estrategica
  ```python
  # gestion_estrategica/urls.py
  path('tareas/', include('apps.gestion_estrategica.gestion_tareas.urls'))
  ```

- [ ] **6.3** Verificar URLs funcionando
  ```bash
  python manage.py show_urls | grep tareas
  ```

- [ ] **6.4** Probar endpoints con curl/Postman
  ```bash
  curl http://localhost:8000/api/gestion-estrategica/tareas/kanban/
  ```

**Validación Fase 6**:
- [ ] URLs registradas correctamente
- [ ] Endpoints accesibles
- [ ] Router funcionando
- [ ] Documentación API generada (si Swagger activo)

---

## FASE 7: MIGRACIÓN DE DATOS (2 días)

### Día 9: Script de migración

- [ ] **7.1** Aplicar migración inicial (sin datos)
  ```bash
  python manage.py migrate gestion_tareas
  ```

- [ ] **7.2** Crear migración de datos
  ```python
  # migrations/0002_migrar_datos_legacy.py
  def migrar_tareas_legacy(apps, schema_editor)
  ```

- [ ] **7.3** Implementar migración de:
  - [ ] Tareas (con mapeo de estados)
  - [ ] Recordatorios (con FK actualizado)
  - [ ] Eventos (con participantes ManyToMany)
  - [ ] Comentarios (con FK actualizado)

- [ ] **7.4** Agregar logging detallado
  ```python
  print(f"Migrando tarea {legacy_id} → {nuevo_id}")
  ```

### Día 10: Ejecución y verificación

- [ ] **7.5** Ejecutar migración en entorno de desarrollo
  ```bash
  python manage.py migrate gestion_tareas
  ```

- [ ] **7.6** Verificar conteo de registros
  ```python
  from apps.audit_system.tareas_recordatorios.models import Tarea as TL
  from apps.gestion_estrategica.gestion_tareas.models import Tarea as TN
  print(f'Legacy: {TL.objects.count()}')
  print(f'Nuevo: {TN.objects.count()}')
  ```

- [ ] **7.7** Verificar integridad de datos
  ```python
  # Verificar GenericForeignKeys
  # Verificar fechas migradas
  # Verificar relaciones
  ```

- [ ] **7.8** Rollback si hay problemas
  ```bash
  python manage.py migrate gestion_tareas 0001
  ```

**Validación Fase 7**:
- [ ] Migración ejecutada sin errores
- [ ] 100% de registros migrados
- [ ] Relaciones preservadas
- [ ] No hay pérdida de datos
- [ ] Checksums/conteos coinciden

---

## FASE 8: ACTUALIZAR DEPENDENCIAS (2 días)

### Día 11: Actualizar ForeignKeys

- [ ] **8.1** Identificar todos los ForeignKeys a tareas_recordatorios
  ```bash
  grep -r "tareas_recordatorios.Tarea" backend/ --include="*.py"
  ```

- [ ] **8.2** Actualizar firma_digital/models.py
  ```python
  # ANTES: 'tareas_recordatorios.Tarea'
  # DESPUÉS: 'gestion_tareas.Tarea'
  ```

- [ ] **8.3** Crear migración para FK en firma_digital
  ```bash
  python manage.py makemigrations workflow_engine --name actualizar_fk_tarea
  ```

- [ ] **8.4** Aplicar migración
  ```bash
  python manage.py migrate workflow_engine
  ```

### Día 12: Actualizar importaciones

- [ ] **8.5** Actualizar importaciones en código
  ```python
  # ANTES:
  from apps.audit_system.tareas_recordatorios.models import Tarea

  # DESPUÉS:
  from apps.gestion_estrategica.gestion_tareas.models import Tarea
  ```

- [ ] **8.6** Buscar y reemplazar en archivos
  ```bash
  # Lista de archivos a actualizar:
  # - workflow_engine/firma_digital/models.py
  # - [otros encontrados en 8.1]
  ```

- [ ] **8.7** Ejecutar tests de módulos dependientes
  ```bash
  pytest apps/workflow_engine/firma_digital/tests/ -v
  ```

**Validación Fase 8**:
- [ ] Todas las importaciones actualizadas
- [ ] ForeignKeys migrando correctamente
- [ ] Tests de módulos dependientes pasando
- [ ] No hay referencias a tareas_recordatorios (verificar con grep)

---

## FASE 9: FRONTEND (3-5 días)

### Día 13: Estructura y tipos

- [ ] **9.1** Crear estructura de directorios frontend
  ```bash
  cd c:/Proyectos/StrateKaz/frontend/src/modules
  mkdir -p gestion-tareas/{components,views,hooks,types}
  ```

- [ ] **9.2** Crear tipos TypeScript
  ```typescript
  // types/tarea.ts
  interface Tarea
  interface KanbanColumna
  type OrigenTipo
  type EstadoKanban
  ```

- [ ] **9.3** Crear servicios API
  ```typescript
  // services/tareasService.ts
  getTareas()
  createTarea()
  updateTarea()
  moverTareaKanban()
  ```

### Día 14-15: Componentes Kanban

- [ ] **9.4** Instalar dependencias
  ```bash
  npm install @dnd-kit/core @dnd-kit/sortable
  ```

- [ ] **9.5** Crear hook useKanban
  ```typescript
  // hooks/useKanban.ts
  export function useKanban()
  ```

- [ ] **9.6** Crear componente KanbanBoard
  ```typescript
  // components/KanbanBoard.tsx
  ```

- [ ] **9.7** Crear componente KanbanColumn
  ```typescript
  // components/KanbanColumn.tsx
  ```

- [ ] **9.8** Crear componente TareaCard
  ```typescript
  // components/TareaCard.tsx
  ```

### Día 16-17: Calendario y vistas

- [ ] **9.9** Crear componente CalendarioView
  ```typescript
  // components/CalendarioView.tsx
  ```

- [ ] **9.10** Crear componente TareasListView
  ```typescript
  // components/TareasListView.tsx
  ```

- [ ] **9.11** Crear vista principal
  ```typescript
  // views/TareasView.tsx
  - Tabs: Kanban | Lista | Calendario
  ```

- [ ] **9.12** Registrar rutas
  ```typescript
  // router/index.tsx
  { path: '/tareas', element: <TareasView /> }
  ```

- [ ] **9.13** Agregar al menú principal
  ```typescript
  // components/Sidebar.tsx
  ```

**Validación Fase 9**:
- [ ] Kanban drag & drop funcionando
- [ ] Calendario mostrando eventos y tareas
- [ ] Filtros funcionando
- [ ] Responsive design
- [ ] Carga de datos desde API
- [ ] Actualización en tiempo real (React Query)

---

## FASE 10: TESTING (2 días)

### Día 18: Tests backend

- [ ] **10.1** Tests de modelos
  ```python
  # tests/test_models.py
  test_generar_codigo_automatico()
  test_sincronizar_estados_kanban()
  test_vinculacion_generica()
  test_metodos_completar()
  ```

- [ ] **10.2** Tests de signals
  ```python
  # tests/test_signals.py
  test_crear_tarea_desde_accion_correctiva()
  test_sincronizacion_bidireccional()
  test_evitar_loop_infinito()
  ```

- [ ] **10.3** Tests de API
  ```python
  # tests/test_api.py
  test_listar_tareas()
  test_crear_tarea()
  test_mover_kanban()
  test_filtros_por_origen()
  test_permisos_rbac()
  ```

- [ ] **10.4** Tests de integración
  ```python
  # tests/test_integracion.py
  test_flujo_completo_accion_correctiva()
  test_flujo_completo_proyecto()
  ```

- [ ] **10.5** Ejecutar suite completa
  ```bash
  pytest apps/gestion_estrategica/gestion_tareas/tests/ -v --cov
  ```

### Día 19: Tests frontend

- [ ] **10.6** Tests de componentes
  ```typescript
  // __tests__/KanbanBoard.test.tsx
  // __tests__/TareaCard.test.tsx
  ```

- [ ] **10.7** Tests de hooks
  ```typescript
  // __tests__/useKanban.test.ts
  ```

- [ ] **10.8** Tests E2E (Playwright/Cypress)
  ```typescript
  test('Flujo completo: crear tarea → mover Kanban → completar')
  ```

- [ ] **10.9** Ejecutar tests frontend
  ```bash
  npm run test
  npm run test:e2e
  ```

**Validación Fase 10**:
- [ ] Coverage backend >80%
- [ ] Coverage frontend >70%
- [ ] Todos los tests pasando
- [ ] No hay warnings críticos
- [ ] Performance tests OK

---

## FASE 11: DEPRECACIÓN Y LIMPIEZA (1 día)

### Día 20: Deprecar módulo legacy

- [ ] **11.1** Marcar como deprecado
  ```python
  # apps/audit_system/tareas_recordatorios/__init__.py
  warnings.warn("DEPRECADO: Use gestion_tareas", DeprecationWarning)
  ```

- [ ] **11.2** Comentar en INSTALLED_APPS
  ```python
  # config/settings.py
  # 'apps.audit_system.tareas_recordatorios',  # DEPRECADO
  ```

- [ ] **11.3** Crear DEPRECATED.md
  ```markdown
  # apps/audit_system/tareas_recordatorios/DEPRECATED.md
  ```

- [ ] **11.4** Actualizar documentación
  - [ ] README principal
  - [ ] Documentación de API
  - [ ] Guías de usuario

- [ ] **11.5** Commit y push
  ```bash
  git add .
  git commit -m "feat: Migrar gestor de tareas a hub centralizado N1"
  git push origin feature/hub-tareas-n1
  ```

- [ ] **11.6** Crear Pull Request
  - [ ] Descripción completa
  - [ ] Screenshots de Kanban
  - [ ] Tests pasando
  - [ ] Reviewers asignados

**Validación Fase 11**:
- [ ] Módulo legacy marcado como deprecado
- [ ] Documentación actualizada
- [ ] PR creado
- [ ] CI/CD pasando

---

## VALIDACIÓN FINAL

### Checklist de aceptación

- [ ] **Backend**
  - [ ] Todos los modelos migrados
  - [ ] Datos migrados al 100%
  - [ ] API endpoints funcionando
  - [ ] Signals de sincronización operativos
  - [ ] Tests pasando (>80% coverage)
  - [ ] No hay dependencias rotas

- [ ] **Frontend**
  - [ ] Kanban board funcional
  - [ ] Drag & drop operativo
  - [ ] Calendario mostrando datos
  - [ ] Filtros funcionando
  - [ ] Responsive
  - [ ] Tests pasando

- [ ] **Integración**
  - [ ] Sincronización con Acciones Correctivas: OK
  - [ ] Sincronización con Plan HSEQ: OK
  - [ ] Sincronización con Proyectos: OK
  - [ ] Sincronización con PESV: OK
  - [ ] Sincronización con Auditorías: OK

- [ ] **Performance**
  - [ ] Carga de Kanban <2s (100 tareas)
  - [ ] API response time <500ms
  - [ ] No memory leaks
  - [ ] Índices de BD optimizados

- [ ] **Seguridad**
  - [ ] RBAC funcionando
  - [ ] Filtros por empresa (multi-tenant)
  - [ ] No hay SQL injection
  - [ ] CSRF tokens activos

- [ ] **Documentación**
  - [ ] README actualizado
  - [ ] API documentada (Swagger)
  - [ ] Guía de usuario
  - [ ] Diagramas actualizados

---

## ROLLBACK PLAN (Si algo sale mal)

```bash
# 1. Revertir migración de datos
python manage.py migrate gestion_tareas 0001

# 2. Restaurar backup
psql -U postgres stratekaz < backup_pre_migracion_tareas_YYYYMMDD.sql

# 3. Reactivar módulo legacy
# Descomentar en settings.py:
'apps.audit_system.tareas_recordatorios',

# 4. Revertir código
git revert HEAD
git push origin feature/hub-tareas-n1

# 5. Notificar equipo
```

---

## NOTAS Y OBSERVACIONES

**Fecha**: ___________
**Observaciones**:
```
[Espacio para notas durante la migración]
```

**Problemas encontrados**:
```
[Documentar issues y soluciones]
```

**Optimizaciones realizadas**:
```
[Mejoras adicionales implementadas]
```

---

**Autor**: BPM_SPECIALIST
**Versión**: 1.0
**Última actualización**: 2026-01-17
