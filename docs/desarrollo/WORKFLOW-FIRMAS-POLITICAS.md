# Sistema de Workflow de Firmas Digitales y Revisión Periódica para Políticas

## 📋 Índice

1. [Visión General](#visión-general)
2. [Cumplimiento Normativo](#cumplimiento-normativo)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Workflow de Firma Digital Múltiple](#workflow-de-firma-digital-múltiple)
5. [Ciclo de Revisión Periódica](#ciclo-de-revisión-periódica)
6. [Diagramas de Estados](#diagramas-de-estados)
7. [Modelos de Datos](#modelos-de-datos)
8. [Endpoints API](#endpoints-api)
9. [Casos de Uso](#casos-de-uso)
10. [Guía de Implementación](#guía-de-implementación)

---

## 🎯 Visión General

Sistema profesional de gestión de políticas con workflow completo de firmas digitales manuscritas y ciclo de revisión periódica automatizado, diseñado específicamente para cumplir con normativas colombianas (Decreto 1072/2015) y estándares internacionales ISO (9001, 45001, 14001, 27001).

### Características Principales

#### 1. Firma Digital Múltiple
- ✅ Firma manuscrita en canvas (formato base64)
- ✅ Verificación de integridad SHA-256
- ✅ Orden secuencial o paralelo configurable
- ✅ Roles: Elaboró, Revisó, Aprobó, Validó, Autorizó
- ✅ Delegación de firma con trazabilidad
- ✅ Rechazo con comentarios obligatorios
- ✅ Historial completo de intentos y cambios
- ✅ Metadatos: IP, navegador, geolocalización

#### 2. Ciclo de Revisión Periódica
- ✅ Frecuencias predefinidas: anual, semestral, trimestral, bianual
- ✅ Frecuencia personalizada (días específicos)
- ✅ Alertas automáticas configurables (30, 15, 7 días antes)
- ✅ Renovación vs nueva versión
- ✅ Versionamiento semántico automático (1.0 → 1.1 → 2.0)
- ✅ Auto-renovación para políticas sin cambios
- ✅ Escalamiento automático de políticas críticas

#### 3. Versionamiento y Trazabilidad
- ✅ Snapshot completo de cada versión
- ✅ Comparación visual entre versiones (diff)
- ✅ Restauración de versiones anteriores
- ✅ Historial de cambios con usuario y timestamp
- ✅ Hash de verificación de integridad por versión

---

## 📜 Cumplimiento Normativo

### ISO 9001:2015 - Sistema de Gestión de Calidad
- **Cláusula 5.2**: Política de Calidad
  - ✅ Documentación de política con firma de alta dirección
  - ✅ Disponible y comunicada a toda la organización
  - ✅ Revisión periódica para adecuación continua

- **Cláusula 7.5**: Información Documentada
  - ✅ Control de documentos (versiones, aprobación, distribución)
  - ✅ Identificación única y trazabilidad
  - ✅ Protección contra cambios no autorizados

### ISO 45001:2018 - Seguridad y Salud en el Trabajo
- **Cláusula 5.2**: Política de SST
  - ✅ Compromiso de alta dirección documentado
  - ✅ Apropiada al propósito y contexto de la organización
  - ✅ Marco para objetivos de SST
  - ✅ Revisión mínima anual

- **Cláusula 5.4**: Consulta y Participación
  - ✅ Participación de trabajadores en elaboración y revisión
  - ✅ Registro de consultas y retroalimentación

### Decreto 1072 de 2015 - Colombia (SST)
- **Art. 2.2.4.6.5**: Política de Seguridad y Salud en el Trabajo
  - ✅ Firmada por el empleador o representante legal
  - ✅ Comunicada al COPASST o Vigía SST
  - ✅ Fechada y firmada
  - ✅ Revisión mínima anual

- **Resolución 0312 de 2019**: Estándares Mínimos SG-SST
  - ✅ Política firmada por el representante legal
  - ✅ Fechada y revisada como mínimo una vez al año
  - ✅ Comunicada a toda la organización

### ISO 14001:2015 - Sistema de Gestión Ambiental
- **Cláusula 5.2**: Política Ambiental
  - ✅ Apropiada al propósito y contexto
  - ✅ Marco para objetivos ambientales
  - ✅ Disponible a partes interesadas

### ISO 27001:2022 - Seguridad de la Información
- **Cláusula 5.2**: Política de Seguridad de la Información
  - ✅ Aprobada por la dirección
  - ✅ Comunicada a empleados y partes interesadas
  - ✅ Revisión periódica

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     CAPA DE PRESENTACIÓN (Frontend)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │ Canvas Firma │  │ Visor Diffs  │  │ Dashboard    │                 │
│  │ Manuscrita   │  │ Versiones    │  │ Revisiones   │                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │ REST API (JSON)
┌───────────────────────────▼─────────────────────────────────────────────┐
│                      CAPA DE LÓGICA DE NEGOCIO                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    ViewSets (Django REST)                        │  │
│  │  - FirmaDigitalViewSet                                           │  │
│  │  - ConfiguracionRevisionViewSet                                  │  │
│  │  - HistorialVersionViewSet                                       │  │
│  │  - ConfiguracionWorkflowFirmaViewSet                             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Modelos de Negocio                            │  │
│  │  - FirmaDigital (GenericForeignKey)                              │  │
│  │  - ConfiguracionRevision                                         │  │
│  │  - HistorialVersion                                              │  │
│  │  - ConfiguracionWorkflowFirma                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Tareas Asíncronas (Celery)                    │  │
│  │  - verificar_firmas_vencidas (diario 8:00 AM)                    │  │
│  │  - verificar_revisiones_pendientes (diario 9:00 AM)              │  │
│  │  - enviar_alertas_revision (diario 10:00 AM)                     │  │
│  │  - actualizar_estados_revision (diario 00:30 AM)                 │  │
│  │  - auto_renovar_politicas (semanal lunes 8:00 AM)                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────────────┐
│                     CAPA DE PERSISTENCIA                                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      PostgreSQL Database                         │  │
│  │  - identidad_firma_digital                                       │  │
│  │  - identidad_configuracion_revision                              │  │
│  │  - identidad_historial_version                                   │  │
│  │  - identidad_config_workflow_firma                               │  │
│  │  - identidad_politica_integral                                   │  │
│  │  - identidad_politica_especifica                                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────────────┐
│                   CAPA DE INTEGRACIONES                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐      │
│  │   Email    │  │    SMS     │  │   Push     │  │   In-App   │      │
│  │  (SMTP)    │  │  (Twilio)  │  │   (FCM)    │  │   Notif.   │      │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ✍️ Workflow de Firma Digital Múltiple

### Flujo Secuencial (Orden Obligatorio)

```
INICIO: Política creada
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PASO 1: CONFIGURAR WORKFLOW                                         │
│                                                                      │
│  Admin crea ConfiguracionWorkflowFirma:                             │
│  - Nombre: "Workflow Política SST"                                  │
│  - Tipo: SECUENCIAL                                                 │
│  - Roles:                                                            │
│    1. ELABORO (orden: 1) → Cargo: Coordinador SST                   │
│    2. REVISO (orden: 2) → Cargo: Gerente HSEQ                       │
│    3. APROBO (orden: 3) → Usuario: Gerente General                  │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PASO 2: APLICAR WORKFLOW A POLÍTICA                                 │
│                                                                      │
│  POST /workflow-firmas/1/aplicar/                                   │
│  {                                                                   │
│    "content_type": "identidad.politicaespecifica",                  │
│    "object_id": 45                                                  │
│  }                                                                   │
│                                                                      │
│  Sistema crea 3 firmas:                                             │
│  - Firma 1: ELABORO (PENDIENTE, orden: 1)                           │
│  - Firma 2: REVISO (PENDIENTE, orden: 2)                            │
│  - Firma 3: APROBO (PENDIENTE, orden: 3)                            │
│                                                                      │
│  Notifica al primer firmante (Coordinador SST)                      │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PASO 3: FIRMA 1 - ELABORÓ (Coordinador SST)                         │
│                                                                      │
│  Usuario recibe notificación EMAIL + IN_APP + PUSH                  │
│  Ingresa al documento, captura firma manuscrita en canvas           │
│                                                                      │
│  POST /firmas-digitales/1/firmar/                                   │
│  {                                                                   │
│    "firma_base64": "data:image/png;base64,iVBORw0KGgo...",          │
│    "observaciones": "Elaborado según Decreto 1072"                  │
│  }                                                                   │
│                                                                      │
│  Sistema:                                                            │
│  - Valida que es su turno (orden: 1)                                │
│  - Genera hash SHA-256 de la firma                                  │
│  - Guarda metadatos (IP, navegador, timestamp)                      │
│  - Cambia estado a FIRMADO                                          │
│  - Notifica al siguiente firmante (Gerente HSEQ)                    │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PASO 4: FIRMA 2 - REVISÓ (Gerente HSEQ)                             │
│                                                                      │
│  Usuario recibe notificación                                        │
│  Revisa el documento y puede:                                       │
│                                                                      │
│  OPCIÓN A: FIRMAR                                                   │
│  POST /firmas-digitales/2/firmar/                                   │
│  {                                                                   │
│    "firma_base64": "data:image/png;base64,iVBORw0KGgo...",          │
│    "observaciones": "Revisado y aprobado"                           │
│  }                                                                   │
│  → Notifica al siguiente firmante (Gerente General)                 │
│                                                                      │
│  OPCIÓN B: RECHAZAR                                                 │
│  POST /firmas-digitales/2/rechazar/                                 │
│  {                                                                   │
│    "motivo": "No cumple con requisito ISO 45001 cláusula 5.2"      │
│  }                                                                   │
│  → Notifica al creador del documento                                │
│  → Workflow se detiene                                              │
│                                                                      │
│  OPCIÓN C: DELEGAR                                                  │
│  POST /firmas-digitales/2/delegar/                                  │
│  {                                                                   │
│    "nuevo_firmante_id": 25,                                         │
│    "motivo": "Vacaciones del 15 al 30 de enero"                    │
│  }                                                                   │
│  → Notifica al nuevo firmante                                       │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PASO 5: FIRMA 3 - APROBÓ (Gerente General)                          │
│                                                                      │
│  Usuario recibe notificación                                        │
│  Firma el documento                                                 │
│                                                                      │
│  POST /firmas-digitales/3/firmar/                                   │
│  {                                                                   │
│    "firma_base64": "data:image/png;base64,iVBORw0KGgo...",          │
│    "observaciones": "Aprobado para publicación"                     │
│  }                                                                   │
│                                                                      │
│  Sistema:                                                            │
│  - Marca firma como FIRMADO                                         │
│  - Verifica que TODAS las firmas estén completadas                  │
│  - Cambia estado de política a VIGENTE                              │
│  - Crea HistorialVersion con snapshot completo                      │
│  - Notifica a todos los involucrados                                │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
FIN: Política VIGENTE con firmas completas
```

### Flujo Paralelo (Sin Orden Específico)

```
INICIO: Política creada
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ CONFIGURACIÓN PARALELA                                              │
│                                                                      │
│  ConfiguracionWorkflowFirma:                                        │
│  - Tipo: PARALELO                                                   │
│  - Roles:                                                            │
│    • REVISO (orden: 0) → Cargo: Coordinador Calidad                 │
│    • REVISO (orden: 0) → Cargo: Coordinador SST                     │
│    • REVISO (orden: 0) → Cargo: Coordinador Ambiental               │
│    • APROBO (orden: 1) → Usuario: Gerente General (después)         │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ NOTIFICACIÓN SIMULTÁNEA                                             │
│                                                                      │
│  Sistema notifica A TODOS los firmantes con orden: 0                │
│  - Coordinador Calidad                                              │
│  - Coordinador SST                                                  │
│  - Coordinador Ambiental                                            │
│                                                                      │
│  Pueden firmar en CUALQUIER orden                                   │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ FIRMAS EN PARALELO                                                  │
│                                                                      │
│  08:30 AM - Coordinador SST firma ✓                                 │
│  10:15 AM - Coordinador Calidad firma ✓                             │
│  14:00 PM - Coordinador Ambiental firma ✓                           │
│                                                                      │
│  Cuando TODAS las firmas paralelas estén completadas:               │
│  → Notifica al Gerente General (orden: 1)                           │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ FIRMA FINAL                                                         │
│                                                                      │
│  Gerente General firma → Política VIGENTE                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Ciclo de Revisión Periódica

### Configuración Inicial

```
┌─────────────────────────────────────────────────────────────────────┐
│ CREAR CONFIGURACIÓN DE REVISIÓN                                     │
│                                                                      │
│  POST /configuracion-revision/                                      │
│  {                                                                   │
│    "content_type": 45,                                              │
│    "object_id": 123,                                                │
│    "frecuencia": "ANUAL",                                           │
│    "tipo_revision": "NUEVA_VERSION",                                │
│    "auto_renovar": false,                                           │
│    "responsable_revision": 5,                                       │
│    "alertas_dias_previos": [30, 15, 7],                             │
│    "alertar_creador": true,                                         │
│    "alertar_responsable": true,                                     │
│    "proxima_revision": "2025-01-15"                                 │
│  }                                                                   │
│                                                                      │
│  Sistema:                                                            │
│  - Crea configuración                                               │
│  - Estado inicial: VIGENTE                                          │
│  - Programa alertas automáticas                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Timeline de Revisión Anual

```
DÍA 0 (15 Enero 2024): Política VIGENTE
    │
    │ ... 335 días ...
    │
    ▼
DÍA 335 (15 Diciembre 2024): 30 DÍAS ANTES
┌─────────────────────────────────────────────────────────────────────┐
│ ALERTA 1: 30 días antes del vencimiento                             │
│                                                                      │
│ Tarea Celery (10:00 AM):                                            │
│ - verificar: debe_enviar_alerta() → True                            │
│ - enviar_alerta_revision()                                          │
│   → Email + In-App a:                                               │
│     • Responsable de revisión                                       │
│     • Creador del documento                                         │
│     • Destinatarios adicionales                                     │
│                                                                      │
│ Estado: VIGENTE → PROXIMO_VENCIMIENTO                               │
│ Prioridad: MEDIA                                                    │
└─────────────────────────────────────────────────────────────────────┘
    │
    │ ... 15 días ...
    │
    ▼
DÍA 350 (30 Diciembre 2024): 15 DÍAS ANTES
┌─────────────────────────────────────────────────────────────────────┐
│ ALERTA 2: 15 días antes del vencimiento                             │
│                                                                      │
│ Notificaciones con prioridad: ALTA                                  │
│ Email + In-App + Push                                               │
└─────────────────────────────────────────────────────────────────────┘
    │
    │ ... 8 días ...
    │
    ▼
DÍA 358 (7 Enero 2025): 7 DÍAS ANTES
┌─────────────────────────────────────────────────────────────────────┐
│ ALERTA 3: 7 días antes del vencimiento                              │
│                                                                      │
│ Notificaciones con prioridad: CRITICA                               │
│ Email + SMS + In-App + Push                                         │
└─────────────────────────────────────────────────────────────────────┘
    │
    │ ... 7 días ...
    │
    ▼
DÍA 365 (15 Enero 2025): VENCIMIENTO
┌─────────────────────────────────────────────────────────────────────┐
│ REVISIÓN VENCIDA                                                    │
│                                                                      │
│ Tarea Celery verificar_revisiones_pendientes (9:00 AM):            │
│ - Estado: PROXIMO_VENCIMIENTO → VENCIDA                             │
│ - notificar_revision_vencida()                                      │
│ - SI es política crítica (SST, Integral):                           │
│   → escalar_revision_vencida() a directivos                         │
│                                                                      │
│ Notificaciones CRITICAS enviadas                                   │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
OPCIONES DE ACCIÓN:
    │
    ├─── OPCIÓN A: INICIAR REVISIÓN
    │    │
    │    ▼
    │    POST /configuracion-revision/1/iniciar-revision/
    │    {
    │      "observaciones": "Iniciando revisión anual programada"
    │    }
    │    │
    │    ▼
    │    Estado: VENCIDA → EN_REVISION
    │    Usuario revisa y actualiza política
    │    Aplica workflow de firmas
    │    │
    │    ▼
    │    POST /configuracion-revision/1/completar-revision/
    │    {
    │      "observaciones": "Revisión completada, nueva versión 2.0"
    │    }
    │    │
    │    ▼
    │    Sistema:
    │    - ultima_revision = HOY
    │    - proxima_revision = HOY + 365 días
    │    - Estado: EN_REVISION → VIGENTE
    │    - Crea HistorialVersion
    │
    │
    └─── OPCIÓN B: AUTO-RENOVACIÓN (si configurado)
         │
         ▼
         Tarea Celery auto_renovar_politicas (lunes 8:00 AM):
         - Verifica: auto_renovar = True
         - Verifica: no hay cambios pendientes
         - Renueva automáticamente:
           • Mantiene versión actual
           • Actualiza effective_date = HOY
           • Calcula proxima_revision = HOY + 365 días
         - Crea HistorialVersion (RENOVACION_AUTOMATICA)
         - Estado: VENCIDA → VIGENTE
```

---

## 📊 Diagramas de Estados

### Estado de Firma Digital

```
┌──────────────────────────────────────────────────────────────────────┐
│                    ESTADOS DE FIRMA DIGITAL                          │
└──────────────────────────────────────────────────────────────────────┘

    [INICIO]
       │
       ▼
  ┌─────────────┐
  │  PENDIENTE  │ ◄──────────┐
  └─────────────┘            │
       │                     │
       │                     │ Reasignar
       ├─────── firmar() ────┼─────────┐
       │                     │         │
       │                     │         ▼
       │                ┌─────────────────┐
       │                │    DELEGADO     │
       │                └─────────────────┘
       │                     │
       │                     │ nuevo firmante
       │                     │ firma()
       ▼                     │
  ┌─────────────┐            │
  │   FIRMADO   │ ◄──────────┘
  └─────────────┘
       │
       │ (todas firmas completas)
       │
       ▼
  [DOCUMENTO VIGENTE]


    [ALTERNATIVA]
       │
       ├─────── rechazar() ────┐
       │                       │
       │                       ▼
       │                  ┌─────────────┐
       │                  │  RECHAZADO  │
       │                  └─────────────┘
       │                       │
       │                       │
       │                       ▼
       │              [WORKFLOW DETENIDO]
       │
       │
       ├─── fecha_vencimiento < HOY ─────┐
       │                                 │
       │                                 ▼
       │                            ┌─────────────┐
       │                            │   VENCIDO   │
       │                            └─────────────┘
       │                                 │
       │                                 │
       │                                 ▼
       │                        [REQUIERE ACCIÓN ADMIN]
       │
       ▼
```

### Estado de Revisión Periódica

```
┌──────────────────────────────────────────────────────────────────────┐
│             ESTADOS DE CONFIGURACIÓN DE REVISIÓN                     │
└──────────────────────────────────────────────────────────────────────┘

    [INICIO]
       │
       ▼
  ┌─────────────────────┐
  │      VIGENTE         │
  │  (días > 30)         │
  └─────────────────────┘
       │
       │ actualizar_estado()
       │ (días <= 30)
       │
       ▼
  ┌─────────────────────┐
  │ PROXIMO_VENCIMIENTO  │
  │  (días 1-30)         │
  └─────────────────────┘
       │
       │ Alertas automáticas
       │ (30, 15, 7 días)
       │
       ▼
  ┌─────────────────────┐
  │      VENCIDA         │
  │  (días < 0)          │
  └─────────────────────┘
       │
       │
       ├──────── iniciar_revision() ──────┐
       │                                   │
       │                                   ▼
       │                          ┌─────────────────┐
       │                          │   EN_REVISION   │
       │                          └─────────────────┘
       │                                   │
       │                                   │
       │                                   │ completar_revision()
       │                                   │
       │                                   ▼
       └────────────── (volver) ──────────┐
                                          │
                                          ▼
                                 ┌─────────────────────┐
                                 │      VIGENTE         │
                                 │  (próxima_revision   │
                                 │   actualizada)       │
                                 └─────────────────────┘


    [FLUJO ALTERNATIVO: AUTO-RENOVACIÓN]
       │
       │ auto_renovar = True
       │ auto_renovar_politicas()
       │
       ▼
  ┌─────────────────────┐
  │      VIGENTE         │
  │  (renovada           │
  │   automáticamente)   │
  └─────────────────────┘
```

### Estado de Política

```
┌──────────────────────────────────────────────────────────────────────┐
│                  ESTADOS DE POLÍTICA (General)                       │
└──────────────────────────────────────────────────────────────────────┘

    [CREAR POLÍTICA]
           │
           ▼
      ┌──────────┐
      │ BORRADOR │
      └──────────┘
           │
           │ enviar_a_revision()
           │
           ▼
      ┌─────────────┐
      │ EN_REVISION │ ◄──── Workflow de firmas activo
      └─────────────┘
           │
           │
           ├────── Firmas completas ─────┐
           │                             │
           │                             ▼
           │                        ┌──────────┐
           │                        │ VIGENTE  │
           │                        └──────────┘
           │                             │
           │                             │
           │                             │ Revisión vencida
           │                             │ + nueva versión
           │                             │
           │                             ▼
           │                        ┌──────────┐
           │                        │ OBSOLETO │
           │                        └──────────┘
           │                             │
           │                             │ (histórico)
           │                             │
           │                             ▼
           │                        [ARCHIVO]
           │
           │
           └─── Firma rechazada ────┐
                                    │
                                    ▼
                               ┌──────────┐
                               │ BORRADOR │ (volver a editar)
                               └──────────┘
```

---

## 💾 Modelos de Datos

### Diagrama Entidad-Relación

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ESQUEMA DE BASE DE DATOS                        │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┐
│ ConfiguracionWorkflowFirma   │
├──────────────────────────────┤
│ id (PK)                      │
│ nombre                       │
│ tipo_orden (SEC/PAR)         │
│ roles_config (JSON)          │
│ dias_para_firmar             │
│ permitir_delegacion          │
└──────────────┬───────────────┘
               │ crea
               │ firmas para
               ▼
┌──────────────────────────────┐           ┌──────────────────────┐
│ FirmaDigital                 │ ◄──N:1──► │ User                 │
├──────────────────────────────┤           ├──────────────────────┤
│ id (PK)                      │           │ id (PK)              │
│ content_type_id (FK) ────────┼──┐        │ username             │
│ object_id                    │  │        │ email                │
│ firmante_id (FK) ────────────┼──┘        │ first_name           │
│ cargo_id (FK)                │           │ last_name            │
│ rol_firma                    │           └──────────────────────┘
│ orden_firma                  │
│ firma_manuscrita (TEXT)      │           ┌──────────────────────┐
│ firma_hash (SHA256)          │           │ Cargo                │
│ status                       │ ◄──N:1──► ├──────────────────────┤
│ fecha_firma                  │           │ id (PK)              │
│ fecha_vencimiento            │           │ code                 │
│ observaciones                │           │ name                 │
│ motivo_rechazo               │           └──────────────────────┘
│ delegado_por_id (FK)         │
│ ip_address                   │
│ user_agent                   │
│ geolocation (JSON)           │
└──────────────┬───────────────┘
               │
               │ firma
               ▼
┌──────────────────────────────┐
│ PoliticaIntegral             │
├──────────────────────────────┤   ┌──────────────────────────────┐
│ id (PK)                      │   │ PoliticaEspecifica           │
│ version                      │   ├──────────────────────────────┤
│ title                        │   │ id (PK)                      │
│ content (TEXT)               │   │ code                         │
│ status                       │   │ version                      │
│ effective_date               │   │ title                        │
│ expiry_date                  │   │ content (TEXT)               │
└──────────────┬───────────────┘   │ status                       │
               │                   │ effective_date               │
               │                   │ review_date                  │
               │                   └──────────────┬───────────────┘
               │                                  │
               │                                  │
               └─────┐                  ┌─────────┘
                     │                  │
                     ▼                  ▼
        ┌────────────────────────────────────────┐
        │ ConfiguracionRevision                  │
        ├────────────────────────────────────────┤
        │ id (PK)                                │
        │ content_type_id (FK) ──────┐           │
        │ object_id                  │           │
        │ frecuencia                 │           │
        │ dias_personalizados        │           │
        │ tipo_revision              │           │
        │ auto_renovar               │           │
        │ responsable_revision_id    │           │
        │ alertas_dias_previos (JSON)│           │
        │ ultima_revision            │           │
        │ proxima_revision           │           │
        │ estado                     │           │
        └────────────────────────────┘           │
                                                 │
                                                 │
                     ┌───────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────┐
        │ HistorialVersion                       │
        ├────────────────────────────────────────┤
        │ id (PK)                                │
        │ content_type_id (FK)                   │
        │ object_id                              │
        │ version_numero                         │
        │ version_anterior                       │
        │ snapshot_data (JSON)                   │
        │ tipo_cambio                            │
        │ descripcion_cambio                     │
        │ cambios_diff (JSON)                    │
        │ usuario_id (FK)                        │
        │ version_hash (SHA256)                  │
        └────────────────────────────────────────┘
```

### Índices de Performance

```sql
-- FirmaDigital
CREATE INDEX idx_firma_content ON identidad_firma_digital(content_type_id, object_id);
CREATE INDEX idx_firma_firmante_status ON identidad_firma_digital(firmante_id, status);
CREATE INDEX idx_firma_vencimiento ON identidad_firma_digital(status, fecha_vencimiento);

-- ConfiguracionRevision
CREATE INDEX idx_config_rev_content ON identidad_configuracion_revision(content_type_id, object_id);
CREATE INDEX idx_config_rev_estado_fecha ON identidad_configuracion_revision(estado, proxima_revision);
CREATE INDEX idx_config_rev_habilitado ON identidad_configuracion_revision(habilitado, proxima_revision);

-- HistorialVersion
CREATE INDEX idx_hist_ver_content ON identidad_historial_version(content_type_id, object_id, version_numero);
CREATE INDEX idx_hist_ver_tipo_fecha ON identidad_historial_version(tipo_cambio, created_at);
```

---

## 🚀 Endpoints API

Ver archivo completo: `/backend/apps/gestion_estrategica/identidad/urls_workflow.py`

### Endpoints Principales

#### Firmas Digitales
```
POST   /firmas-digitales/{id}/firmar/
POST   /firmas-digitales/{id}/rechazar/
POST   /firmas-digitales/{id}/delegar/
GET    /firmas-digitales/{id}/verificar-integridad/
GET    /firmas-digitales/mis-firmas-pendientes/
GET    /firmas-digitales/documento/{content_type_id}/{object_id}/
GET    /firmas-digitales/estadisticas/
```

#### Configuración de Revisión
```
POST   /configuracion-revision/
POST   /configuracion-revision/{id}/iniciar-revision/
POST   /configuracion-revision/{id}/completar-revision/
POST   /configuracion-revision/{id}/enviar-alerta/
GET    /configuracion-revision/proximos-vencimientos/
GET    /configuracion-revision/vencidas/
GET    /configuracion-revision/estadisticas/
```

#### Historial de Versiones
```
GET    /historial-versiones/
POST   /historial-versiones/comparar/
POST   /historial-versiones/{id}/restaurar/
GET    /historial-versiones/documento/{content_type_id}/{object_id}/
```

#### Workflow de Firmas
```
POST   /workflow-firmas/
POST   /workflow-firmas/{id}/aplicar/
GET    /workflow-firmas/{id}/validar/
POST   /workflow-firmas/{id}/duplicar/
```

---

## 📝 Casos de Uso

### Caso de Uso 1: Crear y Firmar Política SST

**Actor**: Coordinador SST, Gerente HSEQ, Gerente General

**Flujo**:
1. Coordinador SST crea Política Específica SST
2. Aplica workflow "Workflow Política SST" (3 firmas secuenciales)
3. Coordinador SST firma como "Elaboró"
4. Gerente HSEQ recibe notificación y firma como "Revisó"
5. Gerente General recibe notificación y firma como "Aprobó"
6. Sistema cambia estado a VIGENTE
7. Configura revisión anual automática

### Caso de Uso 2: Delegar Firma por Ausencia

**Actor**: Gerente HSEQ

**Flujo**:
1. Gerente HSEQ recibe notificación de firma pendiente
2. Tiene vacaciones programadas
3. Delega firma a Coordinador HSEQ Suplente
4. Ingresa motivo: "Vacaciones del 15 al 30 de enero"
5. Sistema notifica al suplente
6. Suplente firma en representación

### Caso de Uso 3: Rechazar Política por Incumplimiento

**Actor**: Gerente HSEQ

**Flujo**:
1. Gerente HSEQ recibe notificación de firma pendiente
2. Revisa política y detecta incumplimiento de ISO 45001
3. Rechaza firma con motivo detallado
4. Sistema notifica al Coordinador SST (creador)
5. Coordinador corrige política
6. Reinicia workflow de firmas

### Caso de Uso 4: Revisión Anual Automática

**Actor**: Sistema (Celery)

**Flujo**:
1. Tarea diaria verifica configuraciones de revisión
2. Detecta política con vencimiento en 30 días
3. Envía alerta EMAIL + IN_APP a responsable
4. Envía alertas en día 15 y día 7
5. Día del vencimiento: cambia estado a VENCIDA
6. Responsable inicia revisión
7. Actualiza política si hay cambios
8. Completa revisión
9. Sistema calcula próxima revisión (+365 días)

### Caso de Uso 5: Comparar Versiones de Política

**Actor**: Auditor Interno

**Flujo**:
1. Auditor accede a historial de política
2. Selecciona versión 1.5 y versión 2.0
3. Sistema muestra diff detallado:
   - Campos agregados (verde)
   - Campos eliminados (rojo)
   - Campos modificados (amarillo con antes/después)
4. Auditor verifica que cambios son apropiados
5. Descarga reporte de cambios en PDF

---

## 🛠️ Guía de Implementación

### 1. Backend (Django)

#### Paso 1: Instalar dependencias
```bash
pip install -r requirements.txt
```

#### Paso 2: Aplicar migraciones
```bash
python manage.py makemigrations
python manage.py migrate
```

#### Paso 3: Configurar Celery (celery_app.py)
```python
from celery.schedules import crontab

app.conf.beat_schedule = {
    'verificar-firmas-vencidas': {
        'task': 'apps.gestion_estrategica.identidad.tasks_workflow.verificar_firmas_vencidas',
        'schedule': crontab(hour=8, minute=0),
    },
    'verificar-revisiones-pendientes': {
        'task': 'apps.gestion_estrategica.identidad.tasks_workflow.verificar_revisiones_pendientes',
        'schedule': crontab(hour=9, minute=0),
    },
    'enviar-alertas-revision': {
        'task': 'apps.gestion_estrategica.identidad.tasks_workflow.enviar_alertas_revision',
        'schedule': crontab(hour=10, minute=0),
    },
    'actualizar-estados-revision': {
        'task': 'apps.gestion_estrategica.identidad.tasks_workflow.actualizar_estados_revision',
        'schedule': crontab(hour=0, minute=30),
    },
    'auto-renovar-politicas': {
        'task': 'apps.gestion_estrategica.identidad.tasks_workflow.auto_renovar_politicas',
        'schedule': crontab(day_of_week='monday', hour=8, minute=0),
    },
}
```

#### Paso 4: Configurar URLs (urls.py)
```python
from django.urls import path, include

urlpatterns = [
    # ... otras URLs
    path('api/gestion-estrategica/identidad/workflow/', include('apps.gestion_estrategica.identidad.urls_workflow')),
]
```

#### Paso 5: Configurar Email (settings.py)
```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = 'Sistema StrateKaz <noreply@stratekaz.com>'
FRONTEND_URL = 'https://app.stratekaz.com'
```

### 2. Frontend (React/Vue)

#### Componente: Canvas Firma Manuscrita

```tsx
// components/CanvasFirma.tsx
import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface CanvasFirmaProps {
  onSave: (firmaBase64: string) => void;
}

export const CanvasFirma: React.FC<CanvasFirmaProps> = ({ onSave }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
  };

  const handleSave = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert('Por favor, firme antes de guardar');
      return;
    }

    const firmaBase64 = sigCanvas.current.toDataURL('image/png');
    onSave(firmaBase64);
  };

  return (
    <div className="firma-canvas-container">
      <div className="canvas-wrapper">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            width: 500,
            height: 200,
            className: 'signature-canvas'
          }}
          onBegin={() => setIsEmpty(false)}
        />
      </div>
      <div className="canvas-actions">
        <button onClick={handleClear} className="btn-secondary">
          Limpiar
        </button>
        <button onClick={handleSave} className="btn-primary" disabled={isEmpty}>
          Guardar Firma
        </button>
      </div>
    </div>
  );
};
```

#### Hook: useFirmaDigital

```tsx
// hooks/useFirmaDigital.ts
import { useState } from 'react';
import axios from 'axios';

export const useFirmaDigital = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firmarDocumento = async (
    firmaId: number,
    firmaBase64: string,
    observaciones?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `/api/gestion-estrategica/identidad/workflow/firmas-digitales/${firmaId}/firmar/`,
        {
          firma_base64: firmaBase64,
          observaciones
        }
      );

      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al firmar documento');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const obtenerFirmasPendientes = async () => {
    try {
      const response = await axios.get(
        '/api/gestion-estrategica/identidad/workflow/firmas-digitales/mis-firmas-pendientes/'
      );

      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al obtener firmas pendientes');
      throw err;
    }
  };

  return {
    loading,
    error,
    firmarDocumento,
    obtenerFirmasPendientes
  };
};
```

### 3. Iniciar Celery Workers

```bash
# Worker principal
celery -A config worker -l info

# Beat scheduler (para tareas periódicas)
celery -A config beat -l info

# Flower (monitor web)
celery -A config flower
```

---

## 📋 Checklist de Implementación

- [ ] Backend Models creados
- [ ] Migraciones aplicadas
- [ ] Serializers configurados
- [ ] ViewSets implementados
- [ ] URLs registradas
- [ ] Tareas Celery configuradas
- [ ] Sistema de notificaciones integrado
- [ ] Email configurado (SMTP)
- [ ] Frontend: Canvas firma manuscrita
- [ ] Frontend: Visor de diffs
- [ ] Frontend: Dashboard de revisiones
- [ ] Tests unitarios escritos
- [ ] Tests de integración escritos
- [ ] Documentación API completa
- [ ] Capacitación usuarios finales
- [ ] Pruebas de aceptación

---

## 🔒 Consideraciones de Seguridad

1. **Firma Manuscrita**:
   - Hash SHA-256 de verificación de integridad
   - Metadatos inmutables (IP, timestamp, usuario)
   - Almacenamiento seguro en base de datos

2. **Control de Acceso**:
   - Solo el firmante asignado puede firmar
   - Delegación con trazabilidad completa
   - Permisos granulares por rol

3. **Auditoría**:
   - Logs completos de todas las acciones
   - Historial inmutable de versiones
   - Snapshots con hash de verificación

4. **Datos Sensibles**:
   - Encriptación en tránsito (HTTPS)
   - Backups regulares de firmas y documentos
   - Retención de datos según normativa

---

## 📞 Soporte

Para soporte técnico o consultas:
- Email: soporte@stratekaz.com
- Documentación: https://docs.stratekaz.com/workflow-firmas
- Issues: https://github.com/stratekaz/issues

---

**Versión**: 1.0
**Fecha**: 15 Enero 2026
**Autor**: Sistema StrateKaz - BPM Specialist
**Cumplimiento**: ISO 9001, ISO 45001, Decreto 1072/2015 Colombia
