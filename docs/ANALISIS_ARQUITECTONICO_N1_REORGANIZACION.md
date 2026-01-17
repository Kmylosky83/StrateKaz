# ANÁLISIS ARQUITECTÓNICO - Reorganización Módulo N1 (Dirección Estratégica)

**Fecha:** 2026-01-15
**Analista:** ISO_MANAGEMENT_SYSTEMS_SPECIALIST
**Versión:** 1.0
**Estado:** APROBADO CON CAMBIOS MAYORES ⚠️

---

## 📋 RESUMEN EJECUTIVO

La propuesta de reorganizar el módulo N1 para incluir **Gestión Documental** y **Gestor de Tareas** presenta **viabilidad técnica PARCIAL** con **riesgos arquitectónicos IMPORTANTES** que requieren una estrategia diferente de implementación.

**RECOMENDACIÓN FINAL:** ⚠️ **APROBAR CON CAMBIOS MAYORES**

---

## 🎯 PROPUESTA EVALUADA

```
N1 - DIRECCIÓN ESTRATÉGICA (8 tabs):
1. Configuración        → Empresa, Branding, Parámetros
2. Organización         → Áreas, Cargos, Colaboradores, Permisos
3. Identidad            → Misión, Visión, Valores, Políticas
4. Planeación           → Contexto, Objetivos BSC, Metas
5. Gestión Documental   → Documentos, Plantillas, Formularios, Firmas (MOVER desde N3)
6. Gestor de Tareas     → Hub centralizado de TODAS las tareas (MOVER desde N6)
7. Proyectos            → Portafolio, Programas, Proyectos (PMI)
8. Revisión Dirección   → Entradas, Análisis, Salidas, Actas
```

---

## 🔍 ANÁLISIS TÉCNICO DETALLADO

### 1. ESTADO ACTUAL DE LA ARQUITECTURA

#### 1.1 Sistema Documental (`apps.hseq_management.sistema_documental`)

**Ubicación Actual:** NIVEL 3 - Torre de Control HSEQ
**Modelos Identificados:** 7 modelos principales

```python
# backend/apps/hseq_management/sistema_documental/models.py
1. TipoDocumento          # Catálogo de tipos (Procedimiento, Manual, Política)
2. PlantillaDocumento     # Templates HTML/Markdown/Formularios
3. Documento              # Documentos con control de versiones completo
4. VersionDocumento       # Historial de versiones con snapshots
5. CampoFormulario        # Form Builder dinámico
6. FirmaDocumento         # Firmas digitales en documentos
7. ControlDocumental      # Distribución, obsolescencia, destrucción
```

**Características Clave:**
- ✅ **Multi-tenancy completo** con `empresa_id`
- ✅ **Independencia arquitectónica** (no tiene ForeignKeys a otros módulos)
- ✅ **Sistema de versionamiento robusto** (checksums SHA-256)
- ✅ **Control documental ISO-compliant** (distribución, retención, obsolescencia)
- ✅ **Form Builder integrado** (campos dinámicos configurables)

#### 1.2 Gestor de Tareas (`apps.audit_system.tareas_recordatorios`)

**Ubicación Actual:** NIVEL 6 - Inteligencia (Audit System)
**Modelos Identificados:** 4 modelos principales

```python
# backend/apps/audit_system/tareas_recordatorios/models.py
1. Tarea                  # Tareas con estados y prioridades
2. Recordatorio           # Recordatorios programados recurrentes
3. EventoCalendario       # Eventos con participantes
4. ComentarioTarea        # Comentarios y archivos adjuntos
```

**Características Clave:**
- ✅ **GenericForeignKey** (`content_type` + `object_id`) para vincular a cualquier modelo
- ✅ **Independencia arquitectónica** (diseño desacoplado)
- ✅ **Sistema de notificaciones** integrado con `centro_notificaciones`
- ⚠️ **NO tiene multi-tenancy explícito** (depende de user.empresa)

---

### 2. DEPENDENCIAS IDENTIFICADAS

#### 2.1 Dependencias DESDE Sistema Documental

```python
# ❌ NO HAY DEPENDENCIAS SALIENTES
# El módulo sistema_documental NO importa desde otros módulos de negocio
# Solo usa: django.contrib, apps.core.base_models, settings.AUTH_USER_MODEL
```

**Análisis:** Sistema **auto-contenido y desacoplado**. ✅ Excelente para mover.

#### 2.2 Dependencias HACIA Sistema Documental

```python
# ✅ ÚNICA DEPENDENCIA ENCONTRADA:
# apps/gestion_estrategica/identidad/services.py (líneas 107-112, 412-421)

from apps.hseq_management.sistema_documental.models import (
    TipoDocumento, Documento, VersionDocumento,
    FirmaDocumento, ControlDocumental
)

# Uso: Generación automática de documentos desde políticas
# Método: IdentityPublicationService.generar_documento_pdf_politica()
```

**Análisis:**
- ✅ Dependencia **unidireccional** y **lógica** (políticas → documentos)
- ✅ Fácil de mantener si documental se mueve a N1
- ✅ De hecho, **mejora la arquitectura** (N1→N1 en lugar de N1→N3)

#### 2.3 Dependencias DESDE Gestor de Tareas

```python
# ❌ NO HAY DEPENDENCIAS SALIENTES
# El módulo tareas_recordatorios NO importa desde otros módulos de negocio
# Solo usa: django.contrib, apps.core.base_models, ContentType
```

**Análisis:** Sistema **desacoplado mediante GenericForeignKey**. ✅ Excelente para mover.

#### 2.4 Dependencias HACIA Gestor de Tareas

```python
# ⚠️ DEPENDENCIAS ENCONTRADAS:

# 1. apps/workflow_engine/ejecucion/migrations (instanciación de tareas)
# 2. apps/workflow_engine/monitoreo/models.py (línea 36)
from apps.audit_system.tareas_recordatorios.models import Tarea

class AlertaFlujo(models.Model):
    tarea = models.ForeignKey(
        'ejecucion.TareaActiva',  # ⚠️ NO es del módulo tareas_recordatorios
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='alertas'
    )
```

**Análisis:**
- ⚠️ El código muestra que `workflow_engine.monitoreo` tiene su **propio modelo TareaActiva**
- ✅ **NO hay dependencia real hacia tareas_recordatorios**
- ✅ Confirma que sistema de tareas es **independiente**

---

### 3. ANÁLISIS DE WORKFLOW ENGINE Y FIRMA DIGITAL

#### 3.1 Módulo Firma Digital (`apps.workflow_engine.firma_digital`)

**Descubrimiento Crítico:**

```python
# backend/apps/workflow_engine/firma_digital/models.py

class FirmaDigital(TimestampedModel):
    """
    Firma digital manuscrita con hash SHA-256.
    Uso GenericForeignKey para poder firmar cualquier tipo de documento
    """

    # GenericForeignKey para firmar cualquier documento
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    documento = GenericForeignKey('content_type', 'object_id')
```

**Análisis:**
- ✅ Sistema de firmas **desacoplado** mediante GenericForeignKey
- ✅ Puede firmar: `PoliticaIntegral`, `PoliticaEspecifica`, `Documento` (sistema_documental), etc.
- ⚠️ **Duplicación de funcionalidad** con `sistema_documental.FirmaDocumento`
- ⚠️ Esto indica **falta de consolidación arquitectónica**

---

### 4. EVALUACIÓN DE VIABILIDAD

#### 4.1 Gestión Documental → N1 ✅ APROBADO

| Criterio | Evaluación | Justificación |
|----------|------------|---------------|
| **Viabilidad Técnica** | ✅ ALTA | No tiene dependencias bloqueantes |
| **Dependencias** | ✅ SALUDABLES | Solo 1 dependencia unidireccional desde identidad (mejora arquitectura) |
| **Multi-tenancy** | ✅ COMPLETO | `empresa_id` en todos los modelos |
| **Migraciones** | ✅ SIMPLE | Solo cambiar `app_label` en Meta |
| **Alineación ISO** | ✅ EXCELENTE | Cláusula 7.5 "Información Documentada" es ESTRATÉGICA |
| **Impacto en N3** | ⚠️ MEDIO | N3 pierde sistema documental pero gana modularidad |

**RECOMENDACIÓN:** ✅ **APROBAR movimiento a N1**

#### 4.2 Gestor de Tareas → N1 ⚠️ APROBADO CON CONDICIONES

| Criterio | Evaluación | Justificación |
|----------|------------|---------------|
| **Viabilidad Técnica** | ✅ ALTA | GenericForeignKey permite desacoplamiento total |
| **Dependencias** | ✅ NINGUNA | Completamente independiente |
| **Multi-tenancy** | ⚠️ IMPLÍCITO | Usa `user.empresa`, no campo directo |
| **Migraciones** | ⚠️ MEDIO | Cambio de ubicación + agregar `empresa_id` explícito |
| **Alineación ISO** | ✅ BUENA | Seguimiento de acciones (ISO 10.2) es estratégico |
| **Impacto en N6** | ⚠️ ALTO | N6 pierde funcionalidad core de auditoría |

**RECOMENDACIÓN:** ⚠️ **APROBAR CON CAMBIOS:**
1. Agregar campo `empresa_id` explícito a todos los modelos
2. Crear migración de datos
3. Consolidar con sistema de tareas de workflow (si existe)

---

## 🚨 RIESGOS IDENTIFICADOS

### RIESGO 1: Duplicación de Funcionalidades de Firma 🔴 CRÍTICO

**Descripción:**
- `sistema_documental.FirmaDocumento` (modelo específico para documentos)
- `workflow_engine.firma_digital.FirmaDigital` (GenericForeignKey universal)

**Impacto:** Confusión arquitectónica, mantenimiento duplicado

**Mitigación:**
```
OPCIÓN A (Recomendada): Consolidar en workflow_engine.firma_digital
- Eliminar sistema_documental.FirmaDocumento
- Migrar datos históricos a firma_digital
- Usar GenericForeignKey universal

OPCIÓN B: Consolidar en sistema_documental
- Agregar GenericForeignKey a FirmaDocumento
- Deprecar firma_digital
- Migrar flujos de workflow

OPCIÓN C: Especialización
- firma_digital → Firmas de políticas/workflow estratégico (N1)
- FirmaDocumento → Firmas de documentos operativos (N3)
```

### RIESGO 2: Multi-tenancy Inconsistente ⚠️ MEDIO

**Descripción:**
- `sistema_documental`: `empresa_id` explícito ✅
- `tareas_recordatorios`: Multi-tenancy implícito vía `user` ⚠️

**Impacto:** Queries complejos, potencial data leak entre empresas

**Mitigación:**
```python
# Agregar a TODOS los modelos de tareas_recordatorios:
empresa_id = models.PositiveBigIntegerField(
    db_index=True,
    verbose_name='Empresa ID'
)

# Migración de datos:
def forwards(apps, schema_editor):
    Tarea = apps.get_model('tareas_recordatorios', 'Tarea')
    for tarea in Tarea.objects.all():
        tarea.empresa_id = tarea.asignado_a.empresa_id
        tarea.save()
```

### RIESGO 3: Pérdida de Cohesión en N3 y N6 ⚠️ MEDIO

**Descripción:**
- N3 (HSEQ Management) pierde su sistema documental
- N6 (Audit System) pierde su gestor de tareas

**Impacto:** Módulos N3 y N6 quedan menos cohesivos

**Mitigación:**
- Renombrar N3 a "Torre de Control - Operaciones HSEQ"
- Renombrar N6 a "Inteligencia - Analytics & Reporting"
- Documentar claramente la nueva arquitectura

### RIESGO 4: Dependencias de Frontend No Evaluadas 🟡 BAJO-MEDIO

**Descripción:**
No se encontraron módulos frontend para `sistema_documental` o `tareas_recordatorios` en la búsqueda inicial.

**Impacto Potencial:**
- Si existen, requerirán refactoring de rutas
- Cambio de estructura de menú
- Actualización de permisos

**Mitigación:**
- Auditoría completa de frontend
- Actualizar constantes de permisos
- Migrar rutas en router

---

## 🏗️ ARQUITECTURA PROPUESTA REVISADA

### Estructura N1 Consolidada

```
N1 - DIRECCIÓN ESTRATÉGICA
│
├─ 1. Configuración (apps.gestion_estrategica.configuracion)
│   └─ EmpresaConfig, SedeEmpresa, NormaISO, TipoCambio
│
├─ 2. Organización (apps.gestion_estrategica.organizacion)
│   └─ Area, Cargo, Colaborador, RBAC
│
├─ 3. Identidad (apps.gestion_estrategica.identidad)
│   └─ Misión, Visión, Valores, Políticas Integrales
│
├─ 4. Planeación (apps.gestion_estrategica.planeacion)
│   ├─ Contexto (PESTEL, DOFA, Porter) - ISO 4.1
│   ├─ Objetivos Estratégicos (BSC)
│   └─ Gestión del Cambio
│
├─ 5. Gestión Documental (apps.gestion_estrategica.gestion_documental) 🆕
│   ├─ Tipos de Documento
│   ├─ Plantillas y Form Builder
│   ├─ Documentos Maestros
│   ├─ Control de Versiones
│   └─ Control Documental (ISO 7.5)
│   └─ 🔗 Integración con workflow_engine.firma_digital
│
├─ 6. Gestor de Tareas (apps.gestion_estrategica.gestor_tareas) 🆕
│   ├─ Tareas Estratégicas
│   ├─ Recordatorios
│   ├─ Calendario de Eventos
│   └─ Seguimiento de Compromisos (ISO 10.2)
│
├─ 7. Proyectos (apps.gestion_estrategica.gestion_proyectos)
│   └─ Portafolio, Programas, Proyectos (PMI)
│
└─ 8. Revisión Dirección (apps.gestion_estrategica.revision_direccion)
    └─ Actas, Compromisos, Seguimiento (ISO 9.3)
```

### Módulos Impactados

```
N3 - TORRE DE CONTROL OPERACIONES HSEQ (10 apps, era 11)
├─ ❌ sistema_documental (MOVIDO a N1)
├─ ✅ planificacion_sistema
├─ ✅ calidad
├─ ✅ medicina_laboral
├─ ✅ seguridad_industrial
├─ ✅ higiene_industrial
├─ ✅ gestion_comites
├─ ✅ accidentalidad
├─ ✅ emergencias
├─ ✅ gestion_ambiental
└─ ✅ mejora_continua

N6 - INTELIGENCIA ANALYTICS & REPORTING (3 apps, era 4)
├─ ✅ logs_sistema
├─ ✅ centro_notificaciones
├─ ✅ config_alertas
└─ ❌ tareas_recordatorios (MOVIDO a N1)
```

---

## 📋 PLAN DE IMPLEMENTACIÓN RECOMENDADO

### FASE 1: Preparación (Semana 1)

**1.1 Auditoría Frontend Completa**
```bash
# Buscar referencias a módulos a mover
grep -r "hseq.*documental" frontend/src/
grep -r "audit.*tareas" frontend/src/
grep -r "sistema_documental" frontend/src/
```

**1.2 Crear Branch de Feature**
```bash
git checkout -b feature/reorganizacion-n1-gestion-documental-tareas
```

**1.3 Backup de Base de Datos**
```bash
python manage.py dumpdata hseq_management.sistema_documental > backup_documental.json
python manage.py dumpdata audit_system.tareas_recordatorios > backup_tareas.json
```

### FASE 2: Mover Sistema Documental (Semana 2)

**2.1 Crear Estructura de Directorios**
```bash
mkdir -p backend/apps/gestion_estrategica/gestion_documental
```

**2.2 Copiar Archivos**
```bash
cp -r backend/apps/hseq_management/sistema_documental/* \
      backend/apps/gestion_estrategica/gestion_documental/
```

**2.3 Actualizar Meta de Modelos**
```python
# En cada modelo, cambiar:
class Meta:
    app_label = 'gestion_documental'  # Era 'sistema_documental'
    db_table = 'documental_documento'  # Mantener misma tabla
```

**2.4 Actualizar settings.py**
```python
INSTALLED_APPS = [
    # ...
    # 'apps.hseq_management.sistema_documental',  # ❌ Comentar
    'apps.gestion_estrategica.gestion_documental',  # ✅ Agregar
    # ...
]
```

**2.5 Actualizar Imports en identidad/services.py**
```python
# Cambiar:
# from apps.hseq_management.sistema_documental.models import ...
# Por:
from apps.gestion_estrategica.gestion_documental.models import ...
```

**2.6 Crear Migración Fake**
```bash
python manage.py makemigrations gestion_documental
python manage.py migrate gestion_documental --fake
```

**2.7 Verificar**
```bash
python manage.py shell
>>> from apps.gestion_estrategica.gestion_documental.models import Documento
>>> Documento.objects.count()  # Debe mostrar registros existentes
```

### FASE 3: Mover Gestor de Tareas (Semana 3)

**3.1 Agregar Campo empresa_id a Modelos**
```python
# backend/apps/gestion_estrategica/gestor_tareas/models.py

class Tarea(TimestampedModel):
    # ... campos existentes ...

    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID'
    )

    class Meta:
        app_label = 'gestor_tareas'
        db_table = 'tareas_tarea'  # Mantener mismo nombre
        indexes = [
            models.Index(fields=['empresa_id', 'estado', '-fecha_limite']),
        ]
```

**3.2 Crear Migración de Datos**
```python
# backend/apps/gestion_estrategica/gestor_tareas/migrations/0002_add_empresa_id.py

def forwards(apps, schema_editor):
    Tarea = apps.get_model('gestor_tareas', 'Tarea')
    Recordatorio = apps.get_model('gestor_tareas', 'Recordatorio')
    EventoCalendario = apps.get_model('gestor_tareas', 'EventoCalendario')

    # Migrar empresa_id desde usuario
    for tarea in Tarea.objects.all():
        if tarea.asignado_a:
            tarea.empresa_id = tarea.asignado_a.empresa_id
            tarea.save()

    # Repetir para Recordatorio y EventoCalendario
```

**3.3 Seguir Pasos Similares a FASE 2**

### FASE 4: Consolidar Firmas (Semana 4) 🔴 CRÍTICO

**DECISIÓN REQUERIDA: ¿Qué sistema de firmas mantener?**

**Opción Recomendada: workflow_engine.firma_digital**

**Razones:**
1. ✅ GenericForeignKey permite firmar cualquier modelo
2. ✅ Sistema más completo (flujos, delegación, SLA)
3. ✅ Menos migraciones de datos (políticas ya lo usan)
4. ✅ Arquitectura más escalable

**Pasos:**
```python
# 1. Migrar datos de sistema_documental.FirmaDocumento a firma_digital
# 2. Actualizar referencias en gestion_documental
# 3. Eliminar modelo FirmaDocumento
# 4. Documentar integración
```

### FASE 5: Testing & Validación (Semana 5)

**5.1 Tests Unitarios**
```bash
pytest backend/apps/gestion_estrategica/gestion_documental/tests/
pytest backend/apps/gestion_estrategica/gestor_tareas/tests/
```

**5.2 Tests de Integración**
```python
# Verificar flujo completo:
# 1. Crear política en identidad
# 2. Generar documento en gestion_documental
# 3. Firmar con workflow_engine.firma_digital
# 4. Crear tarea de seguimiento en gestor_tareas
```

**5.3 Verificación de Multi-tenancy**
```python
# Asegurar que empresa_id filtra correctamente
# Verificar que no hay data leaks entre empresas
```

### FASE 6: Frontend & Deploy (Semana 6)

**6.1 Actualizar Frontend**
```typescript
// frontend/src/features/gestion-estrategica/
// - Agregar tabs: GestionDocumentalTab, GestorTareasTab
// - Actualizar permisos
// - Actualizar rutas API
```

**6.2 Actualizar Menú Principal**
```python
# backend/apps/core/menu_config.py
# Reorganizar estructura de menú N1
```

**6.3 Deploy Staging**
```bash
# Deploy a staging para pruebas
# Verificar con usuarios reales
```

---

## ✅ CHECKLIST DE VALIDACIÓN

### Pre-Implementación
- [ ] Auditoría completa de frontend realizada
- [ ] Backup de base de datos creado
- [ ] Branch de feature creado
- [ ] Decisión sobre consolidación de firmas tomada
- [ ] Plan de rollback documentado

### Durante Implementación
- [ ] Sistema documental movido a N1
- [ ] Gestor de tareas movido a N1
- [ ] Campo empresa_id agregado a tareas
- [ ] Migraciones de datos ejecutadas
- [ ] Imports actualizados
- [ ] Sistema de firmas consolidado

### Post-Implementación
- [ ] Tests unitarios passing
- [ ] Tests de integración passing
- [ ] Verificación de multi-tenancy OK
- [ ] Frontend actualizado
- [ ] Menú reorganizado
- [ ] Documentación actualizada
- [ ] Deploy a staging exitoso
- [ ] Validación con usuarios beta
- [ ] Deploy a producción

---

## 📊 ALINEACIÓN CON ISO 9001/45001

### Justificación Estratégica del Movimiento

#### Gestión Documental en N1 ✅ CORRECTO

**Cláusula ISO 7.5: Información Documentada**

> "La organización debe **controlar la información documentada** requerida
> por el sistema de gestión y por esta Norma Internacional."

**Análisis:**
- ✅ Control documental es **SOPORTE ESTRATÉGICO** (no operativo)
- ✅ Aplica a TODOS los niveles (no solo HSEQ)
- ✅ Alta Dirección debe garantizar recursos (Cláusula 7.1)
- ✅ Política, objetivos, alcance SON documentos estratégicos

**Conclusión ISO:** Control documental en N1 es **arquitectónicamente correcto**.

#### Gestor de Tareas en N1 ✅ CORRECTO

**Cláusula ISO 10.2: No Conformidad y Acción Correctiva**

> "Cuando ocurra una no conformidad... la organización debe:
> a) Reaccionar ante la no conformidad y... tomar acciones
> b) **Evaluar la necesidad de acciones para eliminar las causas**
> c) **Implementar cualquier acción necesaria**
> d) **Revisar la eficacia de cualquier acción correctiva tomada**"

**Cláusula ISO 9.3: Revisión por la Dirección**

> "Los resultados de las revisiones por la dirección deben incluir decisiones
> y acciones relacionadas con... **las necesidades de cambio en el sistema**"

**Análisis:**
- ✅ Seguimiento de acciones correctivas es **RESPONSABILIDAD ESTRATÉGICA**
- ✅ Compromisos de revisión dirección son **NIVEL N1**
- ✅ Gestión del cambio requiere **VISIBILIDAD EJECUTIVA**

**Conclusión ISO:** Gestor de tareas estratégico en N1 es **requirement ISO**.

---

## 🎯 RECOMENDACIÓN FINAL

### ⚠️ APROBAR CON CAMBIOS MAYORES

**APROBACIONES:**
1. ✅ **Mover Sistema Documental a N1** - Excelente alineación ISO
2. ✅ **Mover Gestor de Tareas a N1** - Correcto conceptualmente

**CAMBIOS REQUERIDOS:**
1. 🔴 **CRÍTICO:** Consolidar sistemas de firma digital (eliminar duplicación)
2. ⚠️ **IMPORTANTE:** Agregar `empresa_id` explícito a gestor de tareas
3. ⚠️ **IMPORTANTE:** Renombrar/documentar N3 y N6 tras pérdida de módulos
4. 🟡 **RECOMENDADO:** Auditoría completa de frontend antes de implementar

**CONDICIONES DE APROBACIÓN:**
- Implementar en 6 semanas con testing exhaustivo
- Crear plan de rollback documentado
- Validar en staging antes de producción
- Mantener nombres de tablas de BD (evitar migraciones complejas)

---

## 📚 REFERENCIAS

### Documentación Técnica Revisada
- `backend/apps/hseq_management/sistema_documental/models.py` (1125 líneas)
- `backend/apps/audit_system/tareas_recordatorios/models.py` (161 líneas)
- `backend/apps/workflow_engine/firma_digital/models.py` (1200+ líneas)
- `backend/apps/gestion_estrategica/identidad/services.py` (dependencias)
- `backend/config/settings.py` (INSTALLED_APPS)

### Modelos Analizados
- **Sistema Documental:** 7 modelos, ~1100 líneas
- **Gestor Tareas:** 4 modelos, ~160 líneas
- **Firma Digital:** 8+ modelos, GenericForeignKey
- **Revision Dirección:** 5+ modelos (ya en N1)

### Normas ISO Aplicables
- ISO 9001:2015 - Cláusulas 7.5, 9.3, 10.2
- ISO 45001:2018 - Cláusulas 7.5, 9.3, 10.2
- ISO 14001:2015 - Cláusulas 7.5, 9.3
- ISO 31000:2018 - Gestión del cambio

---

**Elaborado por:** ISO_MANAGEMENT_SYSTEMS_SPECIALIST
**Fecha:** 2026-01-15
**Próxima Revisión:** Al finalizar implementación (6 semanas)

---

## 🔖 ANEXOS

### ANEXO A: Comandos de Verificación

```bash
# Verificar dependencias actuales
grep -r "from apps.hseq_management.sistema_documental" backend/apps/
grep -r "from apps.audit_system.tareas_recordatorios" backend/apps/

# Contar modelos
grep -c "class.*Meta:" backend/apps/hseq_management/sistema_documental/models.py
grep -c "class.*Meta:" backend/apps/audit_system/tareas_recordatorios/models.py

# Verificar multi-tenancy
grep -n "empresa_id" backend/apps/hseq_management/sistema_documental/models.py
grep -n "empresa_id" backend/apps/audit_system/tareas_recordatorios/models.py
```

### ANEXO B: Estructura de Tablas a Mantener

```sql
-- Sistema Documental (mantener nombres)
documental_tipo_documento
documental_plantilla_documento
documental_documento
documental_version_documento
documental_campo_formulario
documental_firma_documento
documental_control_documental

-- Gestor Tareas (mantener nombres)
tareas_tarea
tareas_recordatorio
tareas_evento_calendario
tareas_comentario_tarea
```

### ANEXO C: Permisos Frontend a Actualizar

```typescript
// Cambiar de:
'hseq.view_documento'
// A:
'gestion_estrategica.view_documento'

// Cambiar de:
'audit.view_tarea'
// A:
'gestion_estrategica.view_tarea'
```

---

**FIN DEL ANÁLISIS ARQUITECTÓNICO**
