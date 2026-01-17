# DIAGRAMAS - Reorganización N1

**Fecha:** 2026-01-15
**Referencia:** ANALISIS_ARQUITECTONICO_N1_REORGANIZACION.md

---

## 📊 ARQUITECTURA ANTES vs DESPUÉS

### ANTES - Arquitectura Actual

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   NIVEL 1 - DIRECCIÓN ESTRATÉGICA (6 apps)              │
├─────────────┬──────────────┬──────────────┬──────────────┬──────────────┤
│ 1. Config   │ 2. Organiz   │ 3. Identidad │ 4. Planeación│ 5. Proyectos │
│ - Empresa   │ - Áreas      │ - Misión     │ - Contexto   │ - Portafolio │
│ - Sedes     │ - Cargos     │ - Visión     │ - Objetivos  │ - Programas  │
│ - Normas    │ - Colabora   │ - Valores    │ - BSC        │ - Proyectos  │
│             │ - RBAC       │ - Políticas  │ - PESTEL     │              │
└─────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
                                    │
                                    │ DEPENDENCIA
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│              NIVEL 3 - TORRE DE CONTROL HSEQ (11 apps)                  │
├─────────────────────────────────────────────────────────────────────────┤
│ 1. 📄 SISTEMA DOCUMENTAL ← Actualmente aquí                             │
│    - TipoDocumento, PlantillaDocumento                                  │
│    - Documento (con versionamiento)                                     │
│    - FirmaDocumento                                                     │
│    - ControlDocumental                                                  │
├─────────────────────────────────────────────────────────────────────────┤
│ 2. Planificación Sistema                                                │
│ 3. Calidad (NC, AC)                                                     │
│ 4. Medicina Laboral                                                     │
│ 5. Seguridad Industrial                                                 │
│ 6-11. Otros módulos HSEQ...                                             │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│              NIVEL 6 - INTELIGENCIA (Audit System) (4 apps)             │
├─────────────────────────────────────────────────────────────────────────┤
│ 1. Logs Sistema                                                         │
│ 2. Centro Notificaciones                                                │
│ 3. Config Alertas                                                       │
│ 4. 📋 TAREAS Y RECORDATORIOS ← Actualmente aquí                         │
│    - Tarea, Recordatorio                                                │
│    - EventoCalendario                                                   │
│    - ComentarioTarea                                                    │
└─────────────────────────────────────────────────────────────────────────┘

PROBLEMA:
❌ Identidad (N1) necesita crear documentos → debe ir a N3
❌ Revisión Dirección (N1) necesita crear tareas → debe ir a N6
❌ Dependencias cruzadas entre niveles (N1 → N3 → N6)
```

---

### DESPUÉS - Arquitectura Propuesta

```
┌─────────────────────────────────────────────────────────────────────────┐
│             NIVEL 1 - DIRECCIÓN ESTRATÉGICA (8 apps) ✅                 │
├────────────┬────────────┬────────────┬────────────┬────────────────────┤
│1. Config   │2. Organiz  │3. Identidad│4. Planeac  │5. 📄 DOCUMENTAL🆕  │
│- Empresa   │- Áreas     │- Misión    │- Contexto  │- TipoDocumento     │
│- Sedes     │- Cargos    │- Visión    │- Objetivos │- Plantillas        │
│- Normas    │- Colabora  │- Valores   │- BSC       │- Documentos        │
│            │- RBAC      │- Políticas │- PESTEL    │- Versionamiento    │
│            │            │      ↓     │            │- Control Documental│
│            │            │      └─────┼────────────→ Integración ✅     │
├────────────┴────────────┴────────────┴────────────┴────────────────────┤
│6. 📋 GESTOR TAREAS 🆕  │7. Proyectos│8. Revisión Dirección             │
│- Tarea (hub central)   │- Portafolio│- Actas     ────┐                 │
│- Recordatorio          │- Programas │- Compromisos   │                 │
│- EventoCalendario      │- Proyectos │- Seguimiento ──┼→ Integración ✅  │
│- ComentarioTarea       │            │                │                 │
│  ↑ GenericForeignKey   │            │                │                 │
│  (puede vincular a     │            │                │                 │
│   cualquier modelo)    │            │                │                 │
└────────────────────────┴────────────┴────────────────┴─────────────────┘
                   │
                   │ NO HAY DEPENDENCIAS CRUZADAS ✅
                   │ Todo en mismo nivel (N1 → N1)
                   ↓

┌─────────────────────────────────────────────────────────────────────────┐
│         NIVEL 3 - TORRE DE CONTROL OPERACIONES HSEQ (10 apps) ✅        │
├─────────────────────────────────────────────────────────────────────────┤
│ ❌ Sistema Documental (MOVIDO a N1)                                     │
│ ✅ Planificación Sistema                                                │
│ ✅ Calidad (NC, AC)                                                     │
│ ✅ Medicina Laboral                                                     │
│ ✅ Seguridad Industrial                                                 │
│ ✅ Higiene Industrial                                                   │
│ ✅ Gestión Comités                                                      │
│ ✅ Accidentalidad                                                       │
│ ✅ Emergencias                                                          │
│ ✅ Gestión Ambiental                                                    │
│ ✅ Mejora Continua                                                      │
│                                                                         │
│ 📝 Módulo más enfocado en OPERACIONES HSEQ                             │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│        NIVEL 6 - INTELIGENCIA ANALYTICS & REPORTING (3 apps) ✅         │
├─────────────────────────────────────────────────────────────────────────┤
│ ✅ Logs Sistema                                                         │
│ ✅ Centro Notificaciones                                                │
│ ✅ Config Alertas                                                       │
│ ❌ Tareas y Recordatorios (MOVIDO a N1)                                 │
│                                                                         │
│ 📊 Módulo más enfocado en ANALYTICS Y REPORTING                        │
└─────────────────────────────────────────────────────────────────────────┘

SOLUCIÓN:
✅ Identidad (N1) crea documentos en Gestión Documental (N1) → Mismo nivel
✅ Revisión Dirección (N1) crea tareas en Gestor Tareas (N1) → Mismo nivel
✅ NO hay dependencias cruzadas entre niveles
✅ Alineación perfecta con ISO 9001/45001
```

---

## 🔄 FLUJO DE DEPENDENCIAS

### ANTES - Dependencias Cruzadas ❌

```
┌────────────────────────────────────────────────────────────────┐
│                  FLUJO DE CREACIÓN DE POLÍTICA                 │
└────────────────────────────────────────────────────────────────┘

N1: Identidad                N3: Sistema Documental
┌──────────────┐             ┌──────────────────────┐
│ Política     │─────────────→│ Documento            │
│ Integral     │  DEPENDENCIA │ (PDF generado)       │
└──────────────┘      ❌      └──────────────────────┘
     │                              │
     │                              │
     ↓                              ↓
┌──────────────┐             ┌──────────────────────┐
│ Firmas       │             │ FirmaDocumento       │
│ Workflow     │             │ (duplicación)        │
└──────────────┘             └──────────────────────┘

PROBLEMA:
1. Módulo N1 depende de módulo N3 (nivel inferior)
2. Navegación confusa para usuarios
3. Duplicación de funcionalidad de firmas
```

### DESPUÉS - Dependencias en Mismo Nivel ✅

```
┌────────────────────────────────────────────────────────────────┐
│                  FLUJO DE CREACIÓN DE POLÍTICA                 │
└────────────────────────────────────────────────────────────────┘

N1: Identidad          N1: Gestión Documental       N2: Workflow
┌──────────────┐       ┌──────────────────────┐     ┌─────────────┐
│ Política     │───────→│ Documento            │────→│ Firma       │
│ Integral     │ ✅ N1→N1│ (PDF generado)       │ N1→N2│ Digital     │
└──────────────┘       └──────────────────────┘     └─────────────┘
                              │                            │
                              │                            │
                              ↓                            ↓
                       ┌──────────────────────┐     ┌─────────────┐
                       │ VersionDocumento     │     │ Historial   │
                       │ ControlDocumental    │     │ Validación  │
                       └──────────────────────┘     └─────────────┘

SOLUCIÓN:
1. Todo flujo estratégico en N1 (mismo nivel)
2. Integración con Workflow (N2) donde corresponde
3. Un solo sistema de firmas (consolidado)
4. Navegación intuitiva para usuarios
```

---

## 🏗️ INTEGRACIÓN CON WORKFLOW ENGINE

### Sistema de Firmas Consolidado

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WORKFLOW ENGINE (N2)                                 │
│                    workflow_engine.firma_digital                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  class FirmaDigital(TimestampedModel):                                 │
│      """Firma digital universal con GenericForeignKey"""               │
│                                                                         │
│      # Puede firmar CUALQUIER modelo                                   │
│      content_type = ForeignKey(ContentType)                            │
│      object_id = UUIDField()                                           │
│      documento = GenericForeignKey('content_type', 'object_id')        │
│                                                                         │
│      configuracion_flujo = ForeignKey(ConfiguracionFlujoFirma)         │
│      nodo_flujo = ForeignKey(FlowNode)                                 │
│      firmante = ForeignKey(User)                                       │
│      rol_firma = CharField()  # ELABORO, REVISO, APROBO               │
│      estado = CharField()     # PENDIENTE, FIRMADO, RECHAZADO         │
│      firma_digital = TextField()  # Imagen de firma                   │
│      checksum_documento = CharField()  # Hash SHA-256                 │
│      fecha_firma = DateTimeField()                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                              ↑
                              │ PUEDE FIRMAR
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ↓                     ↓                     ↓
┌───────────────┐  ┌───────────────────┐  ┌─────────────────┐
│ N1: Políticas │  │ N1: Documentos    │  │ N3: NC/AC       │
│ Integrales    │  │ Gestión Documental│  │ (si aplica)     │
└───────────────┘  └───────────────────┘  └─────────────────┘

VENTAJAS:
✅ Un solo sistema de firmas
✅ Firmar cualquier tipo de documento
✅ Flujos configurables por tipo
✅ Trazabilidad completa
✅ Integración con centro de notificaciones
```

---

## 📊 MAPA DE MULTI-TENANCY

### ANTES - Multi-tenancy Inconsistente ⚠️

```
┌─────────────────────────────────────────────────────────────────┐
│                   SISTEMA DOCUMENTAL (N3)                       │
└─────────────────────────────────────────────────────────────────┘

class Documento(models.Model):
    empresa_id = PositiveBigIntegerField()  ✅ EXPLÍCITO
    titulo = CharField()
    contenido = TextField()
    # ... más campos ...

Query Seguro:
Documento.objects.filter(empresa_id=request.user.empresa_id)


┌─────────────────────────────────────────────────────────────────┐
│              GESTOR DE TAREAS (N6) - ACTUAL                     │
└─────────────────────────────────────────────────────────────────┘

class Tarea(TimestampedModel):
    # ❌ NO HAY empresa_id explícito
    asignado_a = ForeignKey(User)
    titulo = CharField()
    # ... más campos ...

Query Implícito (riesgoso):
Tarea.objects.filter(asignado_a__empresa_id=request.user.empresa_id)
                             ↑ Implícito, requiere JOIN
```

### DESPUÉS - Multi-tenancy Consistente ✅

```
┌─────────────────────────────────────────────────────────────────┐
│             GESTIÓN DOCUMENTAL (N1) - PROPUESTO                 │
└─────────────────────────────────────────────────────────────────┘

class Documento(models.Model):
    empresa_id = PositiveBigIntegerField(db_index=True)  ✅
    titulo = CharField()
    contenido = TextField()
    # ... más campos ...

    class Meta:
        app_label = 'gestion_documental'  # Nueva ubicación
        db_table = 'documental_documento'  # Mismo nombre tabla
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
        ]


┌─────────────────────────────────────────────────────────────────┐
│              GESTOR DE TAREAS (N1) - PROPUESTO                  │
└─────────────────────────────────────────────────────────────────┘

class Tarea(TimestampedModel):
    empresa_id = PositiveBigIntegerField(db_index=True)  ✅ AGREGADO
    asignado_a = ForeignKey(User)
    titulo = CharField()
    # ... más campos ...

    class Meta:
        app_label = 'gestor_tareas'  # Nueva ubicación
        db_table = 'tareas_tarea'  # Mismo nombre tabla
        indexes = [
            models.Index(fields=['empresa_id', 'estado', '-fecha_limite']),
        ]

Query Seguro y Eficiente:
Tarea.objects.filter(empresa_id=request.user.empresa_id)
                     ↑ Directo, usa índice, sin JOIN
```

---

## 🎯 FLUJO DE USUARIO

### Escenario: Crear Política Integral con Firma

#### ANTES - Navegación Compleja ❌

```
1. Gerente General entra al sistema
      ↓
2. Navega a N1 - Dirección Estratégica
      ↓
3. Tab "Identidad" → Sección "Políticas"
      ↓
4. Crea Política Integral
      ↓
5. Debe ir a N3 - HSEQ Management  ← CAMBIO DE MÓDULO
      ↓
6. Tab "Sistema Documental"
      ↓
7. Buscar documento generado de política
      ↓
8. Workflow de firmas... ¿dónde está?
      ↓
   ❌ Confusión: ¿Sistema Documental o Workflow Engine?
   ❌ Navegación fragmentada
   ❌ 3 módulos diferentes (N1, N3, N2)
```

#### DESPUÉS - Navegación Unificada ✅

```
1. Gerente General entra al sistema
      ↓
2. Navega a N1 - Dirección Estratégica
      ↓
3. Tab "Identidad" → Sección "Políticas"
      ↓
4. Crea Política Integral
      ↓
5. Sistema automáticamente genera documento en N1 - Gestión Documental
      ↓
6. Flujo de firmas se inicia automáticamente
      ↓
7. Notificaciones enviadas a firmantes
      ↓
8. Firmantes firman desde Centro de Notificaciones (cualquier módulo)
      ↓
9. Documento aprobado queda en N1 - Gestión Documental
      ↓
   ✅ Todo el flujo en N1 (Dirección Estratégica)
   ✅ Navegación intuitiva
   ✅ 1 solo módulo
   ✅ Visibilidad ejecutiva completa
```

---

## 📋 FLUJO DE TAREAS

### Hub Centralizado de Tareas

```
┌─────────────────────────────────────────────────────────────────────────┐
│              N1 - GESTOR DE TAREAS (HUB CENTRAL) 🆕                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  class Tarea(TimestampedModel):                                        │
│      """Hub centralizado de TODAS las tareas del sistema"""            │
│                                                                         │
│      # GenericForeignKey permite vincular a cualquier modelo           │
│      content_type = ForeignKey(ContentType)                            │
│      object_id = CharField()                                           │
│                                                                         │
│      asignado_a = ForeignKey(User)                                     │
│      fecha_limite = DateTimeField()                                    │
│      estado = CharField()  # pendiente, en_progreso, completada        │
│      prioridad = CharField()  # baja, normal, alta, urgente            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                              ↑
                              │ PUEDE VINCULAR A
                              │
        ┌─────────────────────┼──────────────────────────┐
        │                     │                          │
        ↓                     ↓                          ↓
┌───────────────┐  ┌───────────────────┐  ┌─────────────────────┐
│ Compromisos   │  │ Acciones          │  │ Auditorías          │
│ Revisión      │  │ Correctivas       │  │ (mejora continua)   │
│ Dirección     │  │ (NC/AC)           │  │                     │
│ (N1)          │  │ (N3)              │  │ (N3)                │
└───────────────┘  └───────────────────┘  └─────────────────────┘
        │                     │                          │
        ↓                     ↓                          ↓
┌───────────────┐  ┌───────────────────┐  ┌─────────────────────┐
│ Objetivos     │  │ Cambios           │  │ Proyectos           │
│ Estratégicos  │  │ Organizacionales  │  │ (PMI)               │
│ (BSC)         │  │ (Gestión Cambio)  │  │                     │
│ (N1)          │  │ (N1)              │  │ (N1)                │
└───────────────┘  └───────────────────┘  └─────────────────────┘

BENEFICIOS:
✅ Dashboard unificado de todas las tareas
✅ Priorización centralizada
✅ Seguimiento ejecutivo desde N1
✅ No pierde contexto (GenericForeignKey mantiene vínculo)
✅ Reportes consolidados
```

---

## 🔍 COMPARACIÓN DE TABLAS BD

### Estrategia: Mantener Nombres de Tablas

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    BASE DE DATOS - ANTES                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Sistema Documental (app: hseq_management.sistema_documental)          │
│  ┌─────────────────────────────────────────────────────────┐           │
│  │ documental_tipo_documento                               │           │
│  │ documental_plantilla_documento                          │           │
│  │ documental_documento                                    │           │
│  │ documental_version_documento                            │           │
│  │ documental_campo_formulario                             │           │
│  │ documental_firma_documento                              │           │
│  │ documental_control_documental                           │           │
│  └─────────────────────────────────────────────────────────┘           │
│                                                                         │
│  Gestor de Tareas (app: audit_system.tareas_recordatorios)             │
│  ┌─────────────────────────────────────────────────────────┐           │
│  │ tareas_tarea                                            │           │
│  │ tareas_recordatorio                                     │           │
│  │ tareas_evento_calendario                                │           │
│  │ tareas_comentario_tarea                                 │           │
│  └─────────────────────────────────────────────────────────┘           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

                              ↓
                      MIGRACIÓN (Solo Meta)
                              ↓

┌─────────────────────────────────────────────────────────────────────────┐
│                    BASE DE DATOS - DESPUÉS                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Gestión Documental (app: gestion_estrategica.gestion_documental)      │
│  ┌─────────────────────────────────────────────────────────┐           │
│  │ documental_tipo_documento            ← MISMO NOMBRE     │           │
│  │ documental_plantilla_documento       ← MISMO NOMBRE     │           │
│  │ documental_documento                 ← MISMO NOMBRE     │           │
│  │ documental_version_documento         ← MISMO NOMBRE     │           │
│  │ documental_campo_formulario          ← MISMO NOMBRE     │           │
│  │ documental_firma_documento           ← MISMO NOMBRE     │           │
│  │ documental_control_documental        ← MISMO NOMBRE     │           │
│  └─────────────────────────────────────────────────────────┘           │
│                                                                         │
│  Gestor de Tareas (app: gestion_estrategica.gestor_tareas)             │
│  ┌─────────────────────────────────────────────────────────┐           │
│  │ tareas_tarea                         ← MISMO NOMBRE     │           │
│  │   + empresa_id (PositiveBigIntegerField) ← AGREGADO     │           │
│  │ tareas_recordatorio                  ← MISMO NOMBRE     │           │
│  │   + empresa_id                       ← AGREGADO         │           │
│  │ tareas_evento_calendario             ← MISMO NOMBRE     │           │
│  │   + empresa_id                       ← AGREGADO         │           │
│  │ tareas_comentario_tarea              ← MISMO NOMBRE     │           │
│  │   + empresa_id                       ← AGREGADO         │           │
│  └─────────────────────────────────────────────────────────┘           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

VENTAJAS:
✅ No requiere migración de datos masiva (solo agregar columna empresa_id)
✅ Queries existentes siguen funcionando
✅ Vistas y reportes externos no se rompen
✅ Rollback más simple (solo Meta)
✅ Downtime mínimo (< 1 minuto)
```

---

## ⚡ IMPACTO EN PERFORMANCE

### Dashboard N1 - Queries

#### ANTES - Dashboard N1 (6 tabs)

```
GET /api/estrategia/dashboard/

Queries ejecutados:
1. EmpresaConfig                 (1 query)
2. SedeEmpresa                   (1 query)
3. Areas                         (1 query)
4. Colaboradores count           (1 query)
5. CorporateIdentity             (1 query)
6. StrategicObjectives           (1 query)
───────────────────────────────────────────
TOTAL: 6 queries
Tiempo: ~120ms
```

#### DESPUÉS - Dashboard N1 (8 tabs)

```
GET /api/estrategia/dashboard/

Queries ejecutados:
1. EmpresaConfig                 (1 query)
2. SedeEmpresa                   (1 query)
3. Areas                         (1 query)
4. Colaboradores count           (1 query)
5. CorporateIdentity             (1 query)
6. StrategicObjectives           (1 query)
7. Documentos count (resumen)    (1 query)  ← NUEVO
8. Tareas pendientes count       (1 query)  ← NUEVO
───────────────────────────────────────────
TOTAL: 8 queries (+33%)
Tiempo esperado: ~160ms (+40ms)

OPTIMIZACIÓN (lazy loading):
- Cargar tabs Documental y Tareas solo al click
- Resultado: mantener 6 queries iniciales
- Tabs adicionales: carga bajo demanda
```

---

## 🎨 MENÚ DE USUARIO

### ANTES - Navegación Fragmentada

```
📁 StrateKaz
├─ 🎯 N1: Dirección Estratégica
│   ├─ ⚙️ Configuración
│   ├─ 🏢 Organización
│   ├─ 🎨 Identidad
│   ├─ 📊 Planeación
│   ├─ 📁 Proyectos
│   └─ 📋 Revisión Dirección
│
├─ ... (N2, N3 intermedios)
│
├─ 🛡️ N3: Torre de Control HSEQ
│   ├─ 📄 Sistema Documental        ← Usuario debe ir aquí
│   ├─ 📅 Planificación Sistema
│   ├─ ✅ Calidad
│   ├─ 💊 Medicina Laboral
│   └─ ... (más apps HSEQ)
│
├─ ... (N4, N5 intermedios)
│
└─ 📊 N6: Inteligencia
    ├─ 📋 Tareas y Recordatorios    ← Usuario debe ir aquí
    ├─ 🔔 Notificaciones
    └─ ⚙️ Config Alertas

PROBLEMA:
❌ Usuario salta entre N1 → N3 → N6
❌ Difícil encontrar funcionalidades relacionadas
❌ Contexto se pierde al cambiar de módulo
```

### DESPUÉS - Navegación Unificada

```
📁 StrateKaz
├─ 🎯 N1: Dirección Estratégica
│   ├─ ⚙️ Configuración
│   ├─ 🏢 Organización
│   ├─ 🎨 Identidad
│   ├─ 📊 Planeación
│   ├─ 📄 Gestión Documental    🆕 ← Ahora en N1
│   │   ├─ Tipos de Documento
│   │   ├─ Plantillas
│   │   ├─ Documentos Maestros
│   │   └─ Control Documental
│   ├─ 📋 Gestor de Tareas      🆕 ← Ahora en N1
│   │   ├─ Mis Tareas
│   │   ├─ Tareas del Equipo
│   │   ├─ Calendario
│   │   └─ Recordatorios
│   ├─ 📁 Proyectos
│   └─ 📋 Revisión Dirección
│
├─ ... (N2 - Motor Cumplimiento)
│
├─ 🛡️ N3: Torre de Control HSEQ Operaciones
│   ├─ 📅 Planificación Sistema
│   ├─ ✅ Calidad
│   ├─ 💊 Medicina Laboral
│   ├─ 🔧 Seguridad Industrial
│   └─ ... (más apps operativas HSEQ)
│
├─ ... (N4, N5 - Cadena Valor y Habilitadores)
│
└─ 📊 N6: Inteligencia Analytics
    ├─ 📈 Analytics y Reportes
    ├─ 🔔 Centro Notificaciones
    └─ ⚙️ Config Alertas

SOLUCIÓN:
✅ Todo el flujo estratégico en N1
✅ Navegación intuitiva
✅ Contexto preservado
✅ Mejor experiencia de usuario
```

---

## 📈 CRONOGRAMA VISUAL

### Timeline de 6 Semanas

```
MES 1                           MES 2
──────────────────────────────────────────────────────────────
S1 │ S2 │ S3 │ S4 │ S5 │ S6 │
───┼────┼────┼────┼────┼────┤
🔧 │ 📄 │ 📋 │ 🔐 │ ✅ │ 🚀 │
───┼────┼────┼────┼────┼────┤

Semana 1: 🔧 PREPARACIÓN
├─ Backup completo ✅
├─ Auditoría frontend
├─ Decisión firmas 🔴 CRÍTICA
└─ Plan rollback

Semana 2: 📄 SISTEMA DOCUMENTAL
├─ Mover código
├─ Actualizar Meta
├─ Actualizar imports identidad
└─ Migración fake

Semana 3: 📋 GESTOR TAREAS
├─ Agregar empresa_id
├─ Migrar datos
├─ Mover código
└─ Migración

Semana 4: 🔐 CONSOLIDAR FIRMAS
├─ Migrar datos firmas
├─ Eliminar duplicación
├─ Actualizar referencias
└─ Tests firmas

Semana 5: ✅ TESTING & QA
├─ Tests unitarios
├─ Tests integración
├─ Performance testing
└─ Bug fixing

Semana 6: 🚀 DEPLOY
├─ Frontend updates
├─ Deploy staging
├─ UAT
└─ Deploy producción


HITOS CRÍTICOS:
▼
S2  Sistema Documental en N1 ✅
│
S3  Gestor Tareas en N1 ✅
│
S4  Firmas consolidadas 🔴 BLOQUEANTE
│
S5  Tests 100% passing ✅
│
S6  Deploy producción 🚀
```

---

## ✅ RESUMEN VISUAL

### Antes vs Después - Comparación Rápida

```
┌──────────────────────────────────────────────────────────────────┐
│                        ANTES ❌                                   │
├──────────────────────────────────────────────────────────────────┤
│ N1: 6 apps                                                       │
│ N3: 11 apps (incluye Sistema Documental)                         │
│ N6: 4 apps (incluye Gestor Tareas)                               │
│                                                                  │
│ Dependencias: N1 → N3 (cross-level)                             │
│ Dependencias: N1 → N6 (cross-level)                             │
│ Navegación: Fragmentada (3 módulos)                             │
│ Multi-tenancy: Inconsistente (tareas implícito)                 │
│ Firmas: Duplicadas (2 sistemas)                                 │
│ Alineación ISO: Sub-óptima                                      │
│ Experiencia Usuario: Confusa                                    │
└──────────────────────────────────────────────────────────────────┘

                            ↓
                     REORGANIZACIÓN
                            ↓

┌──────────────────────────────────────────────────────────────────┐
│                        DESPUÉS ✅                                 │
├──────────────────────────────────────────────────────────────────┤
│ N1: 8 apps (+Documental, +Tareas) ✅                             │
│ N3: 10 apps (enfocado en operaciones HSEQ) ✅                    │
│ N6: 3 apps (enfocado en analytics) ✅                            │
│                                                                  │
│ Dependencias: N1 → N1 (same level) ✅                            │
│ Navegación: Unificada (1 módulo) ✅                              │
│ Multi-tenancy: Consistente (empresa_id explícito) ✅             │
│ Firmas: Consolidadas (1 sistema universal) ✅                    │
│ Alineación ISO: Perfecta (ISO 7.5, 9.3, 10.2) ✅                 │
│ Experiencia Usuario: Intuitiva ✅                                │
└──────────────────────────────────────────────────────────────────┘
```

---

**Elaborado por:** ISO Management Systems Specialist
**Fecha:** 2026-01-15
**Referencia:** ANALISIS_ARQUITECTONICO_N1_REORGANIZACION.md

---

**FIN DE DIAGRAMAS**
