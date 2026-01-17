# PLAN DE INTERVENCION - Cierre de Brechas StrateKaz v3.4.0

**Fecha:** 17 de Enero de 2026
**Version:** 3.0 (Actualizado con Consolidacion de Firmas y Reorganizacion N1)
**Estado:** Aprobado para Ejecucion

---

## RESUMEN EJECUTIVO

Este plan establece la estrategia de intervencion para cerrar las brechas identificadas en la auditoria funcional del sistema StrateKaz. El enfoque prioriza las funcionalidades criticas que bloquean certificaciones y operaciones clave.

### Metricas Objetivo (Actualizado 2026-01-17)

| Metrica | Documentado | Real Verificado | Estado |
|---------|-------------|-----------------|--------|
| Backend Global | 98% | **98%** | ✅ Confirmado |
| Frontend Global | 78% | **87%** | ✅ Mejor de lo esperado |
| **N1 Direccion Estrategica** | 85% | **87%** | ⚠️ Requiere reorganizacion |
| PESV Compliance | 45% | **0%** | ⏸️ DIFERIDO (placeholder) |
| Talent Hub Frontend | 40% | **55%** | ⏸️ DIFERIDO (hooks listos) |
| Admin/Finance | 65% | **87%** | ✅ COMPLETADO |
| Accounting | 60% | **88%** | ✅ COMPLETADO |
| HSEQ | 73% | **75%** | ⚠️ Higiene Industrial pendiente |

---

## FASE 0: REORGANIZACION ARQUITECTONICA N1 (PRIORIDAD MAXIMA)

> **Auditoria de 4 Agentes Especializados - 2026-01-15**
> Veredicto unanime: ✅ APROBAR CON CAMBIOS
>
> **Actualizacion 2026-01-17:**
> Consolidacion de sistemas de firma y reorganizacion de modulos

---

### 0.1 Mover Gestor Documental a N1 [CRITICO]

**Estado Actual:**
- Backend: 95% (hseq_management/sistema_documental/)
- Frontend: 60% (hooks listos, UI incompleta)

**Ubicacion Actual:** N3 (hseq_management/sistema_documental)
**Ubicacion Nueva:** N1 (gestion_estrategica/gestion_documental/)

**Justificacion:**
- Cualquier empresa necesita documentos desde el dia 1
- Las Politicas (Identidad) se conectan directamente al Gestor Documental
- Alineado con ISO 9001 clausula 7.5 (Informacion documentada)
- Sistema universal de firma digital (FirmaDigital) para todos los documentos

**Modelos a mover (6):**
1. TipoDocumento
2. PlantillaDocumento
3. Documento
4. VersionDocumento
5. CampoFormulario (Form Builder)
6. ControlDocumental

**CAMBIOS IMPORTANTES:**
- ❌ **NO mover** FirmaDocumento (será eliminado)
- ✅ **Usar** FirmaDigital de workflow_engine (GenericForeignKey universal)
- ✅ **Integrar** con sistema de firmas consolidado

**Brechas Frontend MVP (54 horas):**

| Componente | Estado | Esfuerzo | Prioridad |
|------------|--------|----------|-----------|
| DocumentoList + CRUD | 30% | 8h | P0 |
| PlantillaCRUD | 0% | 6h | P0 |
| Form Builder Dinamico | 0% | 16h | P0 |
| Flujo Aprobacion | 0% | 6h | P0 |
| Firma Digital Integrada | 0% | 12h | P0 |
| Visor de Documento | 0% | 10h | P1 |
| Historial Versiones | 0% | 10h | P1 |
| Control Documental | 0% | 10h | P1 |

**Esfuerzo Total Migracion:** 3 dias backend + 54h frontend = **2.5 semanas**

**Dependencias:**
- ⚠️ Debe completarse DESPUES de Fase 0.3 (Consolidacion de Firmas)

---

### 0.2 Mover Gestor de Tareas a N1 [CRITICO]

**Estado Actual:**
- Backend: 100% (audit_system/tareas_recordatorios/)
- Frontend: 70% (4 tabs funcionales con mock data)

**Ubicacion Actual:** N6 (audit_system/tareas_recordatorios)
**Ubicacion Nueva:** N1 (gestion_estrategica/gestion_tareas/)

**Justificacion:**
- Hub centralizado para TODAS las tareas del sistema
- Cualquier empresa necesita gestionar tareas desde el dia 1
- Sincronizacion bidireccional con: Proyectos, Plan HSEQ, Acciones Correctivas, KPIs
- Punto unico de entrada para gestion de trabajo

**Modelos a mover (4):**
1. Tarea (con campo origen_tipo para vincular a cualquier modulo)
2. Recordatorio
3. EventoCalendario
4. ComentarioTarea

**Brechas para MVP (7 dias):**

| Componente | Estado | Esfuerzo | Prioridad |
|------------|--------|----------|-----------|
| Conectar TareasPage a API real | 0% | 3 dias | P0 |
| Formularios crear/editar tarea | 0% | 2 dias | P0 |
| Permisos y control de acceso | 80% | 1 dia | P0 |
| Agregar empresa_id (multi-tenant) | 0% | 0.5 dias | P0 |
| Migracion de datos existentes | 0% | 0.5 dias | P0 |

**Brechas para Hub Centralizado (17 dias adicionales):**

| Componente | Estado | Esfuerzo | Prioridad |
|------------|--------|----------|-----------|
| Campo origen_tipo con choices | 0% | 0.5 dias | P1 |
| Signals sincronizacion bidireccional | 0% | 4 dias | P1 |
| API unificada crear_desde_origen | 0% | 1.5 dias | P1 |
| Vista Kanban con drag-drop | 0% | 4 dias | P1 |
| Calendario avanzado (month/week/day) | 30% | 3 dias | P1 |
| Dashboard "Mis Tareas" | 0% | 1 dia | P1 |
| Notificaciones integradas | 0% | 1 dia | P2 |
| Subtareas | 0% | 1 dia | P2 |
| Historial de cambios | 0% | 1 dia | P2 |

**Esfuerzo Total:** MVP 7 dias + Hub 17 dias = **24 dias**

---

### 0.3 Consolidar Sistemas de Firma [BLOQUEANTE - EJECUTAR PRIMERO]

**Problema Identificado:**
Existen **TRES** sistemas de firma duplicados en el sistema:

1. `workflow_engine/firma_digital/FirmaDigital` ✅ **MANTENER (Universal)**
2. `identidad/models/FirmaPolitica` ❌ **ELIMINAR (Duplicado)**
3. `hseq_management/sistema_documental/FirmaDocumento` ❌ **ELIMINAR (Duplicado)**
4. `onboarding/models/FirmaDocumento` ✅ **MANTENER (Proposito diferente - onboarding)**

**Solucion Aprobada:**

#### A. Sistema Universal de Firmas (MANTENER)
**Ubicacion:** `workflow_engine/firma_digital/FirmaDigital`

**Ventajas:**
- GenericForeignKey: puede firmar CUALQUIER modelo
- Integrado con workflow_engine para aprobaciones
- Soporte multi-firma (multiples aprobadores)
- Tracking completo de estado (pendiente, firmado, rechazado)
- Metadata flexible (IP, ubicacion, dispositivo)
- Canvas de firma digital (base64)

**Campos clave:**
```python
class FirmaDigital(models.Model):
    # GenericForeignKey para firmar cualquier objeto
    content_type = models.ForeignKey(ContentType)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')

    # Firmante
    firmante = models.ForeignKey(User)
    empresa = models.ForeignKey(Empresa)

    # Firma
    firma_canvas = models.TextField()  # base64 de firma
    fecha_firma = models.DateTimeField()
    estado = models.CharField(choices=ESTADO_CHOICES)

    # Metadata
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    ubicacion = models.JSONField()
```

#### B. Sistema de Onboarding (MANTENER - NO DUPLICADO)
**Ubicacion:** `onboarding/models/FirmaDocumento`

**Proposito especifico:**
- Firmas de documentos ANTES de que el empleado exista en el sistema
- Firma de contratos, acuerdos de confidencialidad, politicas en proceso de contratacion
- Enlace publico con token unico (sin autenticacion)
- Flujo de onboarding autocontenido

**No es duplicado porque:**
- Opera fuera del sistema principal (pre-contratacion)
- No requiere usuario autenticado
- Flujo de firma simplificado
- Se convierte a FirmaDigital al completar onboarding

#### C. Sistemas a ELIMINAR

##### C.1 FirmaPolitica (identidad/models.py)
**Razon para eliminar:**
- Caso especifico de FirmaDigital
- Solo firma Politicas
- FirmaDigital puede hacer lo mismo con GenericForeignKey

**Plan de migracion:**
```python
# Migrar datos existentes
for firma_politica in FirmaPolitica.objects.all():
    FirmaDigital.objects.create(
        content_object=firma_politica.politica,
        firmante=firma_politica.firmante,
        empresa=firma_politica.empresa,
        firma_canvas=firma_politica.firma_canvas,
        fecha_firma=firma_politica.fecha_firma,
        estado='FIRMADO',
        metadata={
            'migrated_from': 'FirmaPolitica',
            'original_id': firma_politica.id
        }
    )
```

##### C.2 FirmaDocumento (sistema_documental/models.py)
**Razon para eliminar:**
- Caso especifico de FirmaDigital
- Solo firma Documentos
- FirmaDigital puede hacer lo mismo con GenericForeignKey
- Al mover Gestor Documental a N1, debe usar sistema universal

**Plan de migracion:**
```python
# Migrar datos existentes
for firma_doc in FirmaDocumento.objects.all():
    FirmaDigital.objects.create(
        content_object=firma_doc.documento,
        firmante=firma_doc.firmante,
        empresa=firma_doc.empresa,
        firma_canvas=firma_doc.firma_canvas,
        fecha_firma=firma_doc.fecha_firma,
        estado='FIRMADO',
        metadata={
            'migrated_from': 'FirmaDocumento',
            'original_id': firma_doc.id,
            'version_documento': firma_doc.version
        }
    )
```

#### D. Modelos Faltantes en workflow_engine

**Estado:** Workflow engine tiene FirmaDigital pero falta infraestructura de formularios

**Modelos a crear:**

1. **FormularioDiligenciado**
```python
class FormularioDiligenciado(models.Model):
    """Instancia de formulario completado por usuario"""
    plantilla = models.ForeignKey('PlantillaDocumento')
    empresa = models.ForeignKey(Empresa)
    usuario = models.ForeignKey(User)
    fecha_diligenciamiento = models.DateTimeField()
    estado = models.CharField()  # BORRADOR, PENDIENTE_FIRMA, FIRMADO

    # Relacion con documento generado
    documento = models.ForeignKey('Documento', null=True)

    # Metadata
    metadata = models.JSONField()
```

2. **RespuestaCampo**
```python
class RespuestaCampo(models.Model):
    """Respuesta individual a campo de formulario"""
    formulario = models.ForeignKey(FormularioDiligenciado)
    campo = models.ForeignKey('CampoFormulario')
    valor = models.TextField()  # Valor serializado (JSON para complejos)

    class Meta:
        unique_together = [['formulario', 'campo']]
```

3. **AsignacionFormulario**
```python
class AsignacionFormulario(models.Model):
    """Asignacion de formulario a usuario para diligenciar"""
    plantilla = models.ForeignKey('PlantillaDocumento')
    asignado_a = models.ForeignKey(User)
    asignado_por = models.ForeignKey(User, related_name='asignaciones_creadas')
    empresa = models.ForeignKey(Empresa)

    fecha_asignacion = models.DateTimeField()
    fecha_vencimiento = models.DateTimeField()
    fecha_completado = models.DateTimeField(null=True)

    estado = models.CharField()  # PENDIENTE, COMPLETADO, VENCIDO

    # Relacion con formulario completado
    formulario_diligenciado = models.ForeignKey(
        FormularioDiligenciado,
        null=True,
        related_name='asignacion'
    )

    # Notificaciones
    notificaciones_enviadas = models.IntegerField(default=0)
    ultima_notificacion = models.DateTimeField(null=True)
```

#### E. Esfuerzos Detallados

| Tarea | Descripcion | Esfuerzo | Prioridad |
|-------|-------------|----------|-----------|
| **Backend** |
| Crear migracion de datos FirmaPolitica | Script migracion + validacion | 4h | P0 |
| Crear migracion de datos FirmaDocumento | Script migracion + validacion | 4h | P0 |
| Actualizar modelos Politica | Eliminar FirmaPolitica, usar FirmaDigital | 2h | P0 |
| Actualizar modelos Documento | Eliminar FirmaDocumento, usar FirmaDigital | 2h | P0 |
| Crear FormularioDiligenciado | Modelo + admin + serializer | 3h | P0 |
| Crear RespuestaCampo | Modelo + admin + serializer | 2h | P0 |
| Crear AsignacionFormulario | Modelo + admin + serializer | 3h | P0 |
| Actualizar serializers Politica | Incluir firmas desde FirmaDigital | 2h | P0 |
| Actualizar serializers Documento | Incluir firmas desde FirmaDigital | 2h | P0 |
| Tests de migracion | Validar integridad de datos | 4h | P0 |
| Tests de integracion | FirmaDigital con Politicas/Documentos | 4h | P0 |
| **Frontend** |
| Actualizar componente FirmaPolitica | Usar API de FirmaDigital | 3h | P0 |
| Actualizar componente FirmaDocumento | Usar API de FirmaDigital | 3h | P0 |
| Componente FormularioDiligenciar | UI para completar formularios | 8h | P0 |
| Componente AsignacionFormularios | UI para asignar formularios | 6h | P0 |
| Tests E2E firmas | Flujo completo firma Politica/Documento | 4h | P0 |

**Esfuerzo Total Backend:** 32 horas (4 dias)
**Esfuerzo Total Frontend:** 24 horas (3 dias)
**Esfuerzo Total:** **7 dias**

#### F. Plan de Ejecucion

**Fase 0.3.1 - Preparacion (1 dia):**
1. Backup completo de base de datos
2. Crear branch `consolidacion-firmas`
3. Documentar estado actual (inventario de firmas)

**Fase 0.3.2 - Backend (4 dias):**
1. Crear nuevos modelos (FormularioDiligenciado, RespuestaCampo, AsignacionFormulario)
2. Crear scripts de migracion de datos
3. Ejecutar migracion en ambiente de desarrollo
4. Actualizar serializers y viewsets
5. Tests de integracion

**Fase 0.3.3 - Frontend (3 dias):**
1. Actualizar componentes de firma
2. Crear componentes de formularios
3. Tests E2E

**Fase 0.3.4 - Validacion (1 dia):**
1. QA completo en staging
2. Validacion con usuarios
3. Rollback plan documentado

**Dependencias:**
- ⚠️ DEBE ejecutarse ANTES de Fase 0.1 (Mover Gestor Documental)
- ⚠️ DEBE ejecutarse ANTES de cualquier desarrollo nuevo que use firmas

---

### 0.4 Brechas Existentes en N1 (Sin mover)

**Planeacion - Contexto Organizacional:**
- Backend: 100% (DOFA, PESTEL, Porter, TOWS)
- Frontend: 0% (Sin UI)
- Esfuerzo: 16h

**~~Planeacion - KPIs y Mediciones:~~** ❌ ELIMINADO
> Los KPIs estan correctamente en Analytics (N6 - Inteligencia de Negocios).
> Planeacion define objetivos estrategicos, Analytics mide KPIs.
> NO hay redundancia - cada modulo cumple su funcion.

**Proyectos - Formularios:**
- Backend: 85%
- Frontend: 50% (Kanban basico, sin formularios)
- Esfuerzo: 14h

**Revision Direccion - Formularios:**
- Backend: 85%
- Frontend: 60%
- Esfuerzo: 8h

---

### ESTRUCTURA FINAL N1 APROBADA

```
N1 - DIRECCION ESTRATEGICA (8 tabs):
========================================

1. Configuracion        → 95% ✅ Listo para produccion
2. Organizacion         → 85% ✅ Listo para produccion
3. Identidad            → 90% ✅ Listo para produccion (sin FirmaPolitica)
4. Planeacion           → 85% ⚠️ Falta Contexto UI (16h)
5. Gestion Documental   → 60% ⚠️ MOVER + Frontend (2.5 semanas)
6. Gestor de Tareas     → 70% ⚠️ MOVER + Hub (24 dias)
7. Proyectos            → 75% ⚠️ Falta Formularios + Kanban (14h)
8. Revision Direccion   → 80% ⚠️ Falta Formularios (8h)
```

**Sistema de Firmas Unificado:**
- FirmaDigital (workflow_engine): Sistema universal para Politicas, Documentos, Aprobaciones
- FirmaDocumento (onboarding): Sistema especifico para onboarding pre-contratacion

---

## FASE 1: CRITICOS (Semanas 1-4) [ACTUALIZADO]

### 1.1 logistics_fleet.despachos [DIFERIDO]

**Estado Actual:** Backend 0%, Frontend 0% (solo placeholders)
**Estado:** ⏸️ DIFERIDO - Modulo futuro, no bloqueante para MVP
**Verificado:** 2026-01-15

> **Nota:** Este modulo contiene solo archivos placeholder con TODOs.
> Se implementara cuando haya demanda de clientes para operacion logistica completa.
> El sistema puede operar sin este modulo usando gestion_transporte y gestion_flota.

**Esfuerzo cuando se implemente:** 12 dias

---

### 1.2 logistics_fleet.pesv_operativo [DIFERIDO]

**Estado Actual:** Backend 0%, Frontend 0% (solo placeholders)
**Estado:** ⏸️ DIFERIDO - Solo para empresas con flotas vehiculares
**Verificado:** 2026-01-15

> **Nota:** Este modulo contiene solo archivos placeholder con TODOs.
> PESV (Plan Estrategico de Seguridad Vial - Resolucion 40595/2022) es requerido
> solo para empresas que operan flotas de vehiculos. Se implementara bajo demanda.
> Los riesgos viales basicos se gestionan en motor_riesgos.riesgos_viales.

**Esfuerzo cuando se implemente:** 22 dias

---

### 1.3 talent_hub Frontend [DIFERIDO]

**Estado Actual:** Backend 100%, Frontend 55%
**Estado:** ⏸️ DIFERIDO - Funcional para consulta, pendiente CRUD completo
**Verificado:** 2026-01-15

> **Nota:** El frontend tiene:
> - ✅ TalentHubPage con 6 tabs y estadisticas conectadas al backend
> - ✅ 11 hooks completos con operaciones CRUD
> - ⚠️ Falta: Tablas de datos, formularios y modales de edicion
>
> El modulo es funcional para visualizacion. Se completara el CRUD UI bajo demanda.

**Esfuerzo cuando se complete UI:** 20 dias (reducido de 29 por hooks existentes)

---

## FASE 2: ALTA PRIORIDAD (Semanas 5-8)

### 2.1 Integraciones Externas [PARCIALMENTE COMPLETADO]

**Verificado:** 2026-01-15

| Integracion | Estado | Verificacion |
|-------------|--------|--------------|
| SMS Gateway | ⚠️ 30% | Estructura en centro_notificaciones, falta SDK Twilio |
| Push Notifications | ⚠️ 30% | Canal definido, falta Firebase SDK |
| DIAN Facturacion | ✅ 70% | Modelos completos en pedidos_facturacion, falta API DIAN |
| ARL Reporte | ❌ 0% | No implementado |

**Pendiente real:** Solo conexion con APIs externas (2-3 dias c/u cuando se requiera)

---

### 2.2 Frontend Cadena de Valor [MEJOR DE LO DOCUMENTADO]

**Verificado:** 2026-01-15

| Modulo | Tab | Anterior | Real | Estado |
|--------|-----|----------|------|--------|
| production_ops | Procesamiento | 70% | **80%** | ✅ 4 tabs completos |
| production_ops | Producto Terminado | 70% | **80%** | ✅ Componente existe |
| sales_crm | Servicio Cliente | 65% | **85%** | ✅ 11 paginas! |
| supply_chain | Programacion | 70% | **80%** | ✅ 10 componentes |

**Estado:** Modulos funcionales, mejoras menores pendientes

---

### 2.3 Motor Riesgos [MEJOR DE LO DOCUMENTADO]

**Verificado:** 2026-01-15

| Tab | Anterior | Real | Estado |
|-----|----------|------|--------|
| Seguridad Informacion | 75% | **85%** | ✅ Pagina completa |
| SAGRILAFT/PTEE | 70% | **85%** | ✅ Pagina completa |
| Riesgos Viales | 75% | **85%** | ✅ Pagina completa |
| Contexto Org | - | **90%** | ✅ DOFA, PESTEL, Porter |
| IPEVR | - | **90%** | ✅ Matriz GTC-45 |

**Estado:** Modulo mas completo de lo documentado

---

## FASE 3: MEDIA PRIORIDAD (Semanas 9-12) [MEJOR DE LO DOCUMENTADO]

### 3.1 Admin/Finance Frontend [COMPLETADO]

**Verificado:** 2026-01-15

| Tab | Documentado | Real | Estado |
|-----|-------------|------|--------|
| Presupuesto | 65% | **85%** | ✅ 278 lineas, 4 tabs, tablas, KPIs |
| Servicios Generales | 60% | **85%** | ✅ 359 lineas, 3 tabs completos |
| Tesoreria | 65% | **90%** | ✅ 513 lineas, 4 tabs, cuentas, movimientos |

**Estado:** ✅ COMPLETADO - Modulos funcionales con UI completa

---

### 3.2 Accounting Frontend [COMPLETADO]

**Verificado:** 2026-01-15

| Tab | Documentado | Real | Estado |
|-----|-------------|------|--------|
| Movimientos | 65% | **90%** | ✅ 612 lineas, CRUD, plantillas, borradores |
| Informes Contables | 60% | **90%** | ✅ 629 lineas, Balance, P&L, Libros Mayor |
| Integracion | 55% | **85%** | ✅ 582 lineas, parametros, cola, logs |

**Estado:** ✅ COMPLETADO - Sistema contable completo y funcional

---

### 3.3 HSEQ Mejoras UX [MIXTO]

**Verificado:** 2026-01-15

| Tab | Documentado | Real | Estado |
|-----|-------------|------|--------|
| Higiene Industrial | 70% | **40%** | ⚠️ Solo placeholder "En Desarrollo" |
| Emergencias | 75% | **95%** | ✅ 1413 lineas! 6 subsecciones completas |
| Gestion Ambiental | 75% | **90%** | ✅ 739 lineas, 6 subsecciones con hooks |

**Estado:** ⚠️ Higiene Industrial pendiente (2 dias), resto completado

**Esfuerzo restante real:** 2 dias (solo Higiene Industrial)

---

## FASE 4: OPTIMIZACION (Semanas 13-16)

### 4.1 Documentacion Funcional

| Modulo | Documento Requerido | Esfuerzo |
|--------|---------------------|----------|
| workflow_engine | Manual Sistema de Firmas Digital | 2 dias |
| gestion_documental | Manual Gestor Documental | 3 dias |
| gestion_tareas | Manual Hub de Tareas | 2 dias |
| logistics_fleet | Manual PESV completo | 3 dias |
| talent_hub | Guia funcional 11 submods | 5 dias |
| accounting | Manual integracion DIAN | 2 dias |
| motor_riesgos | Guia metodologia GTC-45 | 2 dias |

**Total Estimado:** 19 dias

---

### 4.2 Testing Integral

| Tipo Test | Cobertura Actual | Objetivo | Esfuerzo |
|-----------|------------------|----------|----------|
| Unit Tests | 75% | 90% | 5 dias |
| Integration Tests | 60% | 80% | 5 dias |
| E2E Tests | 40% | 70% | 5 dias |
| Migration Tests | 80% | 95% | 2 dias |

**Total Estimado:** 17 dias

---

### 4.3 Performance y Seguridad

| Tarea | Descripcion | Esfuerzo |
|-------|-------------|----------|
| Query Optimization | Indices, N+1, caching | 3 dias |
| Security Audit | OWASP Top 10, pentest | 5 dias |
| Load Testing | Stress tests 100 usuarios | 2 dias |

**Total Estimado:** 10 dias

---

## ELIMINACION DE CODIGO LEGACY

### Archivos a Eliminar

**Backend:**
```
backend/apps/identidad/models.py
  - class FirmaPolitica (ELIMINAR)

backend/apps/hseq_management/sistema_documental/models.py
  - class FirmaDocumento (ELIMINAR)

backend/apps/hseq_management/sistema_documental/serializers.py
  - class FirmaDocumentoSerializer (ELIMINAR)

backend/apps/hseq_management/sistema_documental/views.py
  - FirmaDocumentoViewSet (ELIMINAR)

backend/apps/identidad/serializers.py
  - class FirmaPoliticaSerializer (ELIMINAR)

backend/apps/identidad/views.py
  - FirmaPoliticaViewSet (ELIMINAR)
```

**Frontend:**
```
frontend/src/components/identidad/FirmaPolitica.tsx (ELIMINAR si existe)
frontend/src/components/sistema_documental/FirmaDocumento.tsx (ELIMINAR si existe)
frontend/src/hooks/identidad/useFirmaPolitica.ts (ACTUALIZAR para usar FirmaDigital)
frontend/src/hooks/sistema_documental/useFirmaDocumento.ts (ACTUALIZAR para usar FirmaDigital)
```

### Archivos a Actualizar

**Backend:**
```
backend/apps/identidad/models.py
  - class Politica: actualizar relacion con FirmaDigital

backend/apps/gestion_estrategica/gestion_documental/models.py (nuevo)
  - class Documento: actualizar relacion con FirmaDigital

backend/apps/workflow_engine/firma_digital/models.py
  + class FormularioDiligenciado (CREAR)
  + class RespuestaCampo (CREAR)
  + class AsignacionFormulario (CREAR)
```

**Frontend:**
```
frontend/src/components/identidad/PoliticasList.tsx
  - Actualizar para mostrar firmas desde FirmaDigital

frontend/src/components/gestion_documental/DocumentosList.tsx (nuevo)
  - Usar FirmaDigital para firmas

frontend/src/components/common/SignaturePad.tsx
  - Componente universal para todas las firmas
```

### Script de Limpieza

```bash
#!/bin/bash
# clean_legacy_signatures.sh

echo "=== Limpieza de Codigo Legacy - Sistemas de Firma ==="

# Backup antes de eliminar
git checkout -b backup-before-signature-cleanup
git add .
git commit -m "backup: Estado antes de limpieza de firmas legacy"

# Eliminar modelos legacy
echo "Eliminando FirmaPolitica..."
# (Debe hacerse via migracion Django)

echo "Eliminando FirmaDocumento de sistema_documental..."
# (Debe hacerse via migracion Django)

# Eliminar archivos Python legacy
find backend/apps/identidad -name "*firma_politica*" -type f -delete
find backend/apps/hseq_management/sistema_documental -name "*firma_documento*" -type f -delete

# Eliminar archivos TypeScript legacy
find frontend/src/components -name "*FirmaPolitica*" -type f -delete
find frontend/src/components -name "*FirmaDocumento*" -type f -delete

# Buscar referencias en codigo
echo "Buscando referencias a FirmaPolitica..."
grep -r "FirmaPolitica" backend/ frontend/ || echo "No se encontraron referencias"

echo "Buscando referencias a FirmaDocumento (excluyendo onboarding)..."
grep -r "FirmaDocumento" backend/ frontend/ | grep -v onboarding || echo "No se encontraron referencias"

echo "=== Limpieza completada ==="
echo "IMPORTANTE: Ejecutar migraciones Django para eliminar tablas"
```

---

## CRONOGRAMA CONSOLIDADO (ACTUALIZADO)

```
FASE 0.3 - CONSOLIDACION DE FIRMAS (EJECUTAR PRIMERO):
SEMANA 1:     [========] Consolidar Firmas (7 dias)
              - Backup y preparacion (1 dia)
              - Backend: migraciones + nuevos modelos (4 dias)
              - Frontend: componentes actualizados (3 dias)
              - Validacion QA (incluido en dias anteriores)

FASE 0.1 - MOVER GESTOR DOCUMENTAL:
SEMANA 2:     [====] Backend migracion (3 dias)
SEMANA 2-4:   [============] Frontend MVP (54h = 2.5 semanas)
              - DocumentoList + CRUD (8h)
              - PlantillaCRUD (6h)
              - Form Builder (16h)
              - Flujo Aprobacion (6h)
              - Firma Digital Integrada (12h)
              - Visor + Versiones + Control (30h)

FASE 0.2 - MOVER GESTOR TAREAS:
SEMANA 3:     [====] Backend migracion (2 dias)
SEMANA 3-4:   [======] Frontend MVP (7 dias)
SEMANA 5-7:   [================] Hub Centralizado (17 dias)
              - Signals sincronizacion (4 dias)
              - Vista Kanban (4 dias)
              - Calendario avanzado (3 dias)
              - Dashboard + APIs (3.5 dias)
              - Notificaciones + extras (2.5 dias)

FASE 0.4 - BRECHAS N1 EXISTENTES:
SEMANA 8:     [====] Contexto Organizacional UI (16h)
SEMANA 8:     [====] Formularios Proyectos (14h)
SEMANA 8:     [==] Formularios Revision Direccion (8h)

FASE 1-4 DIFERIDOS/COMPLETADOS:
SEMANA 9:     [==] Higiene Industrial (2 dias)
              [⏸️] Talent Hub, Despachos, PESV - Bajo demanda
```

**Duracion Total Fase 0:** 8 semanas (2 meses)

**Hitos Criticos:**
- Semana 1: Firmas consolidadas ✅
- Semana 4: Gestor Documental en N1 ✅
- Semana 7: Gestor Tareas Hub completo ✅
- Semana 8: N1 100% funcional ✅

---

## ESFUERZOS CONSOLIDADOS

### Por Fase (Actualizado)

| Fase | Descripcion | Esfuerzo Backend | Esfuerzo Frontend | Total |
|------|-------------|------------------|-------------------|-------|
| 0.3 | Consolidacion Firmas | 32h (4 dias) | 24h (3 dias) | 7 dias |
| 0.1 | Gestor Documental | 24h (3 dias) | 54h (2.5 semanas) | 2.5 semanas |
| 0.2 | Gestor Tareas | 16h (2 dias) | 192h (24 dias) | 24 dias |
| 0.4 | Brechas N1 | - | 38h (5 dias) | 5 dias |
| 1-3 | Higiene Industrial | - | 16h (2 dias) | 2 dias |
| 4 | Optimizacion | - | - | 46 dias |

**Total Fase 0:** 8 semanas
**Total Fases 1-4:** 48 dias (cuando se ejecuten)

### Por Equipo

| Rol | Fase 0.3 | Fase 0.1 | Fase 0.2 | Fase 0.4 | Total |
|-----|----------|----------|----------|----------|-------|
| Backend Senior | 4 dias | 3 dias | 2 dias | - | 9 dias |
| Frontend Senior | 3 dias | 12 dias | 24 dias | 5 dias | 44 dias |
| QA Engineer | 1 dia | 2 dias | 3 dias | 1 dia | 7 dias |
| DevOps | 0.5 dias | 1 dia | 1 dia | 0.5 dias | 3 dias |

---

## MATRIZ RACI (ACTUALIZADA)

| Fase | Responsable | Aprueba | Consulta | Informa |
|------|-------------|---------|----------|---------|
| Fase 0.3 (Firmas) | Backend Lead | Tech Lead + PO | Arquitecto | Stakeholders |
| Fase 0.1 (Docs) | Tech Lead | PO | ISO Specialist | Stakeholders |
| Fase 0.2 (Tareas) | Tech Lead | PO | Arquitecto | Stakeholders |
| Fase 0.4 (N1) | Frontend Lead | Tech Lead | UX | PO |
| Fase 1 | Tech Lead | PO | Arquitecto | Stakeholders |
| Fase 2 | Backend Lead | Tech Lead | DevOps | PO |
| Fase 3 | Frontend Lead | Tech Lead | UX | PO |
| Fase 4 | QA Lead | Tech Lead | Todos | Stakeholders |

---

## RIESGOS Y MITIGACION (ACTUALIZADO)

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|--------------|---------|------------|
| **Migracion de firmas pierde datos** | Media | Critico | Backup completo + validacion 100% + rollback preparado |
| **FirmaDigital no cubre casos de uso** | Baja | Alto | Analisis previo completado, GenericForeignKey es suficiente |
| **Migracion N1 rompe funcionalidad** | Media | Alto | Scripts de rollback preparados, testing exhaustivo |
| **Duplicacion de firmas causa conflictos** | ~~Alta~~ Baja | Alto | ✅ Resuelto con Fase 0.3 |
| Retraso PESV | Media | Alto | Priorizar backend, UI incremental |
| Integracion DIAN falla | Media | Alto | Sandbox testing, soporte proveedor |
| Recursos insuficientes | Baja | Alto | Contratar freelance puntual |
| Cambios regulatorios | Baja | Medio | Monitoreo normativo semanal |

---

## CRITERIOS DE EXITO (ACTUALIZADO)

### Por Fase

| Fase | Criterio | Metrica |
|------|----------|---------|
| **Fase 0.3** | Firmas consolidadas | 1 sistema universal, 0 duplicados, migracion 100% |
| **Fase 0.3** | Modelos workflow completos | FormularioDiligenciado, RespuestaCampo, AsignacionFormulario |
| **Fase 0.1** | Gestor Documental en N1 | 6 modelos movidos, firma digital integrada |
| **Fase 0.2** | Hub Tareas operativo | Tareas de Proyectos/HSEQ/Auditoria visibles centralizadas |
| **Fase 0.4** | N1 100% funcional | 8 tabs sin brechas |
| Fase 1 | Despachos operativo | 100% CRUD funcional |
| Fase 1 | PESV compliance | 5 pilares implementados |
| Fase 1 | Talent Hub usable | 11 tabs navegables |
| Fase 2 | Integraciones | 4 servicios conectados |
| Fase 3 | Frontend completo | >85% todos modulos |
| Fase 4 | Documentado | Manual por modulo |

### Globales (Post Fase 0)

- **N1 Direccion Estrategica: 100%** (de 87% actual)
- **Sistema de Firmas: 1 universal** (de 3 duplicados)
- Backend: 100% (de 98% actual)
- Frontend: 95% (de 87% actual)
- Tests: 90% cobertura (de 75% actual)
- Documentacion: 100% modulos criticos
- **Codigo Legacy: 0%** (eliminacion completa de FirmaPolitica y FirmaDocumento)

---

## RECURSOS REQUERIDOS

### Equipo

| Rol | Cantidad | Dedicacion | Fases Criticas |
|-----|----------|------------|----------------|
| Backend Senior | 2 | 100% | Fase 0.3, 0.1, 0.2 |
| Frontend Senior | 2 | 100% | Todas Fase 0 |
| QA Engineer | 1 | 50% | Validacion migraciones |
| DevOps | 1 | 25% | Despliegues Fase 0 |
| Tech Writer | 1 | Fase 4 | Documentacion |

### Infraestructura

- Ambiente staging dedicado
- Base de datos espejo para pruebas de migracion
- Sandbox DIAN habilitado
- Licencia Twilio/SMS
- Firebase proyecto configurado

### Herramientas

- Script de migracion de firmas (Python)
- Script de validacion de integridad (Python)
- Script de rollback (SQL + Python)
- Herramienta de comparacion de datos (Great Expectations o similar)

---

## SEGUIMIENTO

### Reuniones

- Daily standup: 15 min diario
- Sprint review: Viernes cada 2 semanas
- Retrospectiva: Fin de cada fase
- **Demo Fase 0.3:** Validacion sistema unificado de firmas
- **Demo Fase 0.1:** Validacion Gestor Documental en N1
- **Demo Fase 0.2:** Validacion Hub de Tareas

### Metricas de Avance

- Burndown chart semanal
- Velocity por equipo
- Defect density por modulo
- **Cobertura de migracion:** % de firmas migradas exitosamente
- **Integridad de datos:** 0 perdidas de datos

### Reportes

- Avance semanal a stakeholders
- Demo bi-semanal de funcionalidades
- Reporte mensual ejecutivo
- **Reporte post-migracion:** Validacion 100% de firmas migradas

---

## VALIDACION POST-MIGRACION

### Checklist Fase 0.3

- [ ] 100% de FirmaPolitica migradas a FirmaDigital
- [ ] 100% de FirmaDocumento migradas a FirmaDigital
- [ ] Validacion de integridad: firmas visibles en UI
- [ ] Validacion de integridad: metadata preservada
- [ ] Tests E2E: flujo completo firma Politica
- [ ] Tests E2E: flujo completo firma Documento
- [ ] Modelos legacy eliminados de codigo
- [ ] Tablas legacy eliminadas de base de datos
- [ ] FormularioDiligenciado funcional
- [ ] RespuestaCampo funcional
- [ ] AsignacionFormulario funcional
- [ ] Documentacion actualizada
- [ ] Rollback plan documentado y probado

### Checklist Fase 0.1

- [ ] Gestor Documental movido a gestion_estrategica/gestion_documental
- [ ] 6 modelos funcionando en nueva ubicacion
- [ ] FirmaDigital integrada con Documentos
- [ ] Frontend conectado a nueva API
- [ ] Migracion de datos completada sin perdidas
- [ ] URLs actualizadas en frontend
- [ ] Permisos RBAC funcionando
- [ ] Tests de integracion pasando

### Checklist Fase 0.2

- [ ] Gestor Tareas movido a gestion_estrategica/gestion_tareas
- [ ] Hub centralizado funcional
- [ ] Sincronizacion bidireccional con Proyectos
- [ ] Sincronizacion bidireccional con HSEQ
- [ ] Sincronizacion bidireccional con Auditoria
- [ ] Vista Kanban operativa
- [ ] Calendario integrado
- [ ] Dashboard "Mis Tareas" funcional
- [ ] Notificaciones configuradas

---

## APROBACIONES

| Rol | Nombre | Fecha | Firma |
|-----|--------|-------|-------|
| Product Owner | _________ | __/__/2026 | ______ |
| Tech Lead | _________ | __/__/2026 | ______ |
| Arquitecto | _________ | __/__/2026 | ______ |
| Sponsor | _________ | __/__/2026 | ______ |

---

## ANEXOS

### A. Diagrama de Consolidacion de Firmas

```
ANTES (3 sistemas duplicados):
=====================================

identidad/FirmaPolitica ──> Politica
       ↓
   [Canvas firma]
   [Firmante]
   [Fecha]

sistema_documental/FirmaDocumento ──> Documento
       ↓
   [Canvas firma]
   [Firmante]
   [Fecha]

workflow_engine/FirmaDigital ──> (GenericForeignKey)
       ↓
   [Canvas firma]
   [Firmante]
   [Fecha]
   [Content Type]
   [Object ID]


DESPUES (1 sistema universal):
=====================================

workflow_engine/FirmaDigital ──> Politica
                             ──> Documento
                             ──> FormularioDiligenciado
                             ──> AccionCorrectiva
                             ──> Proyecto
                             ──> (Cualquier modelo)
       ↓
   [Canvas firma]
   [Firmante]
   [Fecha]
   [Content Type]  <-- Permite firmar CUALQUIER objeto
   [Object ID]
   [Metadata JSON]

onboarding/FirmaDocumento ──> (Proceso onboarding)
       ↓
   [Firma pre-contratacion]
   [Token publico]
   [Sin autenticacion]
```

### B. Diagrama Flujo de Migracion

```
1. BACKUP
   ├─ Snapshot base de datos
   ├─ Export tablas firmas legacy
   └─ Tag git pre-migracion

2. CREAR NUEVOS MODELOS
   ├─ FormularioDiligenciado
   ├─ RespuestaCampo
   └─ AsignacionFormulario

3. MIGRAR DATOS
   ├─ FirmaPolitica → FirmaDigital
   │  └─ Validar: content_type = Politica
   ├─ FirmaDocumento → FirmaDigital
   │  └─ Validar: content_type = Documento
   └─ Generar reporte migracion

4. ACTUALIZAR CODIGO
   ├─ Backend: serializers + viewsets
   ├─ Frontend: componentes + hooks
   └─ Tests: E2E + integracion

5. VALIDAR
   ├─ QA manual
   ├─ Tests automatizados
   └─ Validacion con usuarios

6. ELIMINAR LEGACY
   ├─ Drop tablas legacy
   ├─ Delete archivos legacy
   └─ Update documentacion

7. DEPLOY
   ├─ Staging
   ├─ Validacion final
   └─ Produccion
```

---

**Documento generado: 17 de Enero de 2026**
**Version 3.0: Consolidacion de Firmas + Reorganizacion N1**
**Auditado por: 4 Agentes Especializados (ISO, Data, BPM, Explore)**
**Actualizado por: BPM_SPECIALIST (Consolidacion de Firmas y Formularios)**
**Proxima revision: Fin de Fase 0.3**
