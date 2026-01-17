# ÍNDICE MAESTRO - Reorganización Módulo N1

**Análisis Arquitectónico Completo**
**Fecha:** 2026-01-15
**Versión:** 1.0
**Estado:** ⚠️ APROBADO CON CAMBIOS

---

## 📚 ESTRUCTURA DE LA DOCUMENTACIÓN

Esta serie de documentos proporciona un análisis exhaustivo de la propuesta de reorganización del módulo N1 (Dirección Estratégica) de StrateKaz, incluyendo el movimiento de **Gestión Documental** (desde N3) y **Gestor de Tareas** (desde N6) hacia N1.

---

## 📄 DOCUMENTOS INCLUIDOS

### 1. RESUMEN EJECUTIVO
**Archivo:** `RESUMEN_EJECUTIVO_REORGANIZACION_N1.md`
**Audiencia:** Product Owner, CTO, Stakeholders
**Tiempo de Lectura:** 10 minutos
**Contenido:**
- Decisión recomendada (APROBAR CON CAMBIOS)
- Análisis en 60 segundos
- Beneficios esperados
- Timeline de 6 semanas
- Costos y ROI
- Criterios de éxito
- Próximos pasos

**Cuándo Leer:**
✅ Si necesitas decisión ejecutiva rápida
✅ Si vas a aprobar/rechazar la propuesta
✅ Si necesitas presentar a stakeholders

---

### 2. ANÁLISIS ARQUITECTÓNICO COMPLETO
**Archivo:** `ANALISIS_ARQUITECTONICO_N1_REORGANIZACION.md`
**Audiencia:** Tech Lead, Arquitectos de Software, Backend Developers
**Tiempo de Lectura:** 45 minutos
**Contenido:**
- Estado actual de la arquitectura
- Análisis de dependencias detallado
- Evaluación de viabilidad técnica
- Riesgos arquitectónicos (4 riesgos identificados)
- Arquitectura propuesta revisada
- Plan de implementación de 6 fases
- Alineación con ISO 9001/45001
- Checklist de validación completo

**Secciones Clave:**
1. Estado Actual de la Arquitectura (modelos, características, dependencias)
2. Dependencias Identificadas (desde/hacia cada módulo)
3. Análisis de Workflow Engine y Firma Digital
4. Evaluación de Viabilidad (matriz de criterios)
5. Riesgos Identificados (4 riesgos con mitigaciones)
6. Arquitectura Propuesta Revisada
7. Plan de Implementación (6 fases)
8. Alineación con ISO (justificación normativa)

**Cuándo Leer:**
✅ Si eres responsable de la implementación técnica
✅ Si necesitas entender dependencias y riesgos
✅ Si vas a hacer code review
✅ Si necesitas justificación ISO detallada

---

### 3. MATRIZ DE IMPACTO
**Archivo:** `MATRIZ_IMPACTO_REORGANIZACION_N1.md`
**Audiencia:** PM, QA Lead, DevOps, Responsables de Capacitación
**Tiempo de Lectura:** 35 minutos
**Contenido:**
- Matriz de impacto por módulo (N1, N3, N6, N2)
- Impacto en integraciones (backend, frontend, externas)
- Impacto en usuarios (Alta Dirección, HSEQ, Auditoría, Operativos)
- Impacto en base de datos (migraciones, volumetría)
- Impacto en performance (queries, caching)
- Impacto en seguridad y permisos (RBAC, multi-tenancy)
- Métricas de éxito (KPIs pre/post migración)
- Plan de capacitación (por grupo de usuarios)
- Cronograma detallado (6 semanas, día a día)
- Checklist Go/No-Go
- Plan de contingencia (4 escenarios)

**Secciones Clave:**
1. Matriz de Impacto por Módulo (N1, N3, N6, Workflow)
2. Impacto en Integraciones (todas las capas)
3. Impacto en Usuarios (4 grupos)
4. Impacto en Base de Datos (estrategia de migración)
5. Impacto en Performance (queries, caching)
6. Impacto en Seguridad (permisos, multi-tenancy)
7. Métricas de Éxito (KPIs cuantificables)
8. Plan de Capacitación (material y métodos)
9. Cronograma Detallado (semana por semana)
10. Plan de Contingencia (4 escenarios críticos)

**Cuándo Leer:**
✅ Si eres PM o coordinador del proyecto
✅ Si necesitas planificar capacitación
✅ Si vas a ejecutar el deploy
✅ Si necesitas definir KPIs de éxito

---

### 4. SCRIPTS DE MIGRACIÓN
**Archivo:** `SCRIPTS_MIGRACION_N1.md`
**Audiencia:** Backend Developers, DevOps, DBA
**Tiempo de Lectura:** 40 minutos (lectura) + ejecución
**Contenido:**
- Script 1: Backup Completo (bash + Python)
- Script 2: Mover Sistema Documental (5 pasos)
- Script 3: Mover Gestor de Tareas (migración empresa_id)
- Script 4: Migrar Permisos (automático)
- Script 5: Verificación Post-Migración (4 verificaciones)
- Script 6: Rollback (recuperación completa)

**Scripts Incluidos:**
```bash
1. backup_pre_reorganizacion_n1.sh
2. crear_estructura_gestion_documental.sh
3. actualizar_models_gestion_documental.py
4. migrar_gestion_documental.sh
5. migrations/0002_add_empresa_id.py (gestor_tareas)
6. migrar_permisos_reorganizacion_n1.py
7. verificar_migracion_n1.py
8. rollback_reorganizacion_n1.sh
```

**Cuándo Usar:**
✅ Durante la implementación (Semanas 1-6)
✅ Para hacer backup antes de cambios
✅ Para migrar modelos y datos
✅ Para verificar éxito de migración
✅ Para rollback si algo falla

---

## 🗺️ GUÍA DE NAVEGACIÓN

### Si Eres... Lee Esto Primero

| Rol | Documento Principal | Documentos Secundarios |
|-----|---------------------|------------------------|
| **Product Owner / CTO** | Resumen Ejecutivo | Análisis Arquitectónico (sección Evaluación) |
| **Tech Lead / Arquitecto** | Análisis Arquitectónico | Matriz de Impacto + Scripts |
| **Backend Developer** | Scripts de Migración | Análisis Arquitectónico (sección Dependencias) |
| **Frontend Developer** | Matriz de Impacto (sección Integraciones) | Resumen Ejecutivo |
| **QA Lead** | Matriz de Impacto (sección Métricas) | Análisis Arquitectónico (sección Checklist) |
| **DevOps** | Scripts de Migración | Matriz de Impacto (sección Plan Contingencia) |
| **PM / Coordinador** | Matriz de Impacto | Resumen Ejecutivo + Scripts |
| **Responsable de Capacitación** | Matriz de Impacto (sección Capacitación) | Resumen Ejecutivo |

---

## 📊 DATOS CLAVE DEL ANÁLISIS

### Módulos Evaluados

| Módulo | Modelos | LOC | Dependencias Salientes | Dependencias Entrantes | Viabilidad |
|--------|---------|-----|------------------------|------------------------|------------|
| **Sistema Documental** | 7 | ~1,125 | 0 | 1 (identidad) | ✅ ALTA |
| **Gestor de Tareas** | 4 | ~161 | 0 | 0 | ✅ ALTA |

### Hallazgos Críticos

1. 🔴 **DUPLICACIÓN DE FIRMAS:** Existen 2 sistemas de firma digital (requiere consolidación)
2. ⚠️ **MULTI-TENANCY INCONSISTENTE:** Tareas no tienen `empresa_id` explícito
3. ⚠️ **PÉRDIDA DE COHESIÓN N3/N6:** Módulos donadores quedan menos cohesivos
4. 🟡 **FRONTEND NO EVALUADO:** Requiere auditoría completa

### Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación | Estado |
|--------|--------------|---------|------------|--------|
| Duplicación firmas no resuelta | 🔴 ALTA | 🔴 ALTO | Consolidar antes de deploy | ⚠️ BLOQUEANTE |
| Pérdida de datos en migración | 🟡 BAJA | 🔴 CRÍTICO | Backup + plan rollback | ✅ MITIGADO |
| Errores de permisos | 🟡 MEDIA | 🟡 MEDIO | Script automático | ✅ MITIGADO |
| Confusión usuarios HSEQ | 🟢 MEDIA | 🟡 BAJO | Capacitación + tutorial | ✅ MITIGADO |

---

## ⏱️ TIMELINE CONSOLIDADO

```
┌─────────────────────────────────────────────────────────────────┐
│                     TIMELINE DE 6 SEMANAS                        │
├─────────────┬───────────────────────────────────────────────────┤
│ Semana 1    │ ▓▓▓▓▓▓▓ Preparación                               │
│             │ - Backup, auditoría frontend, decisión firmas     │
├─────────────┼───────────────────────────────────────────────────┤
│ Semana 2    │ ▓▓▓▓▓▓▓ Mover Sistema Documental                  │
│             │ - Código, Meta, imports, migraciones              │
├─────────────┼───────────────────────────────────────────────────┤
│ Semana 3    │ ▓▓▓▓▓▓▓ Mover Gestor de Tareas                    │
│             │ - empresa_id, código, migraciones                 │
├─────────────┼───────────────────────────────────────────────────┤
│ Semana 4    │ ▓▓▓▓▓▓▓ Consolidar Firmas 🔴 CRÍTICO              │
│             │ - Migración datos, eliminar duplicación           │
├─────────────┼───────────────────────────────────────────────────┤
│ Semana 5    │ ▓▓▓▓▓▓▓ Testing & QA                              │
│             │ - Tests unitarios, integración, performance       │
├─────────────┼───────────────────────────────────────────────────┤
│ Semana 6    │ ▓▓▓▓▓▓▓ Frontend & Deploy                         │
│             │ - UI updates, staging, producción                 │
└─────────────┴───────────────────────────────────────────────────┘
```

**Hitos Críticos:**
- ✅ Semana 2: Sistema documental en N1
- ✅ Semana 3: Gestor tareas en N1
- 🔴 Semana 4: Firmas consolidadas (BLOQUEANTE)
- ✅ Semana 5: Tests 100% passing
- 🚀 Semana 6: Deploy producción

---

## ✅ CHECKLIST MAESTRO DE IMPLEMENTACIÓN

### Fase 0: Pre-Aprobación
- [ ] Resumen Ejecutivo leído por stakeholders
- [ ] Análisis Arquitectónico revisado por Tech Lead
- [ ] Decisión sobre sistema de firmas tomada
- [ ] Timeline de 6 semanas aprobada
- [ ] Recursos (equipo) asignados

### Fase 1: Preparación (Semana 1)
- [ ] Branch `feature/reorganizacion-n1` creado
- [ ] Backup completo realizado y verificado
- [ ] Auditoría frontend completada
- [ ] Plan de rollback documentado
- [ ] Kick-off meeting realizado

### Fase 2: Sistema Documental (Semana 2)
- [ ] Estructura `gestion_documental` creada
- [ ] Modelos copiados y `app_label` actualizado
- [ ] settings.py actualizado
- [ ] Imports en `identidad/services.py` actualizados
- [ ] Migración fake ejecutada
- [ ] Verificación: datos accesibles desde N1

### Fase 3: Gestor Tareas (Semana 3)
- [ ] Campo `empresa_id` agregado a todos los modelos
- [ ] Migración de datos `empresa_id` ejecutada
- [ ] Estructura `gestor_tareas` creada
- [ ] settings.py actualizado
- [ ] Migración ejecutada
- [ ] Verificación: datos accesibles desde N1

### Fase 4: Consolidación Firmas (Semana 4) 🔴 CRÍTICO
- [ ] Sistema de firmas a mantener decidido
- [ ] Datos migrados del sistema eliminado
- [ ] Código duplicado eliminado
- [ ] Referencias actualizadas
- [ ] Tests de firmas passing

### Fase 5: Testing (Semana 5)
- [ ] Tests unitarios: 100% passing
- [ ] Tests integración: 100% passing
- [ ] Verificación multi-tenancy: OK
- [ ] Performance testing: ≤ baseline + 10%
- [ ] Security audit: Sin issues críticos

### Fase 6: Deploy (Semana 6)
- [ ] Frontend actualizado (rutas, permisos, API)
- [ ] Menú reorganizado
- [ ] Material capacitación distribuido
- [ ] Deploy a staging exitoso
- [ ] UAT con usuarios beta: ≥ 7/10 satisfacción
- [ ] Deploy a producción
- [ ] Monitoreo 48h post-deploy
- [ ] Postmortem meeting

---

## 📋 DECISIONES REQUERIDAS

### Decisión 1: Aprobar Propuesta General ⏳ URGENTE
**Responsable:** Product Owner / CTO
**Fecha Límite:** 2026-01-17
**Opciones:**
- ✅ Aprobar con cambios especificados
- ⏸️ Posponer (especificar razón)
- ❌ Rechazar (especificar alternativa)

### Decisión 2: Sistema de Firmas a Mantener 🔴 BLOQUEANTE
**Responsable:** Tech Lead + Arquitecto
**Fecha Límite:** 2026-01-18
**Opciones:**
- ✅ Mantener `workflow_engine.firma_digital` (RECOMENDADO)
- ⚠️ Mantener `sistema_documental.FirmaDocumento`
- ⚠️ Consolidar en nuevo módulo híbrido

### Decisión 3: Timeline y Recursos
**Responsable:** PM + Tech Lead
**Fecha Límite:** 2026-01-19
**Confirmar:**
- [ ] 6 semanas disponibles para el equipo
- [ ] Backend Lead asignado
- [ ] Frontend Lead asignado
- [ ] QA Lead asignado
- [ ] DevOps disponible para deploy

### Decisión 4: Ventana de Mantenimiento
**Responsable:** DevOps + PM
**Fecha Límite:** 2026-01-20
**Definir:**
- Fecha de deploy a producción
- Duración de ventana (recomendado: 2 horas)
- Plan de comunicación a usuarios

---

## 📞 CONTACTOS Y RESPONSABLES

| Rol | Responsabilidad | Documentos Clave |
|-----|-----------------|------------------|
| **Product Owner** | Aprobar propuesta, prioridades | Resumen Ejecutivo |
| **CTO / Tech Lead** | Decisión técnica final, arquitectura | Análisis Arquitectónico |
| **Backend Lead** | Implementación backend, migraciones | Scripts de Migración |
| **Frontend Lead** | Actualización UI, rutas, permisos | Matriz de Impacto (Integraciones) |
| **QA Lead** | Testing, verificación, métricas | Matriz de Impacto (Métricas) |
| **DevOps** | Deploy, rollback, monitoreo | Scripts + Matriz (Contingencia) |
| **PM** | Coordinación, timeline, comunicación | Matriz de Impacto (Cronograma) |
| **Capacitación** | Material, tutoriales, soporte | Matriz de Impacto (Capacitación) |

---

## 🔄 CICLO DE VIDA DE LOS DOCUMENTOS

### Versión Actual: 1.0 (2026-01-15)
**Estado:** Análisis completo, pendiente de aprobación

### Próximas Versiones

**v1.1 (Después de Aprobación):**
- Actualizar con decisiones tomadas
- Agregar nombres de responsables reales
- Refinar timeline con fechas exactas

**v2.0 (Post-Implementación):**
- Documentar lecciones aprendidas
- Actualizar con datos reales de métricas
- Agregar sección "Lo que salió bien / mal"
- Recomendaciones para futuras reorganizaciones

---

## 📚 REFERENCIAS EXTERNAS

### Normas ISO Consultadas
- ISO 9001:2015 - Sistemas de Gestión de Calidad
  - Cláusula 7.5: Información Documentada
  - Cláusula 9.3: Revisión por la Dirección
  - Cláusula 10.2: No Conformidad y Acción Correctiva

- ISO 45001:2018 - Sistemas de Gestión de Seguridad y Salud en el Trabajo
  - Cláusula 7.5: Información Documentada
  - Cláusula 9.3: Revisión por la Dirección

- ISO 14001:2015 - Sistemas de Gestión Ambiental
  - Cláusula 7.5: Información Documentada

### Arquitectura de StrateKaz
- **Documento Base:** `docs/planificacion/CRONOGRAMA-26-SEMANAS.md`
- **Niveles Arquitectónicos:**
  - N0: Core Base
  - N1: Dirección Estratégica (6→8 apps)
  - N2: Motor de Cumplimiento
  - N3: Torre de Control HSEQ (11→10 apps)
  - N4: Cadena de Valor
  - N5: Habilitadores
  - N6: Inteligencia (4→3 apps)

---

## 🎯 PRÓXIMO PASO INMEDIATO

### Para Product Owner / CTO:
1. Leer **Resumen Ejecutivo** (10 minutos)
2. Revisar sección "Riesgos" en **Análisis Arquitectónico** (5 minutos)
3. **DECIDIR:** ¿Aprobamos con los cambios especificados?
4. Si SÍ → Pasar a "Decisión 2: Sistema de Firmas"
5. Si NO → Documentar razones y alternativa propuesta

### Para Tech Lead:
1. Leer **Análisis Arquitectónico** completo (45 minutos)
2. Revisar **Scripts de Migración** (40 minutos)
3. **DECIDIR:** ¿Qué sistema de firmas mantenemos? (BLOQUEANTE)
4. Asignar Backend Lead para implementación

### Para PM:
1. Leer **Matriz de Impacto** (35 minutos)
2. Revisar Cronograma Detallado
3. Verificar disponibilidad de recursos (6 semanas)
4. Coordinar con Capacitación para material de training

---

## ✅ RECOMENDACIÓN FINAL

> **APROBAR** la reorganización del módulo N1 **CON LOS CAMBIOS ESPECIFICADOS**.
>
> Esta reorganización es **técnicamente viable**, **arquitectónicamente correcta**,
> y **alineada con ISO 9001/45001**. Los riesgos son **manejables** con el plan
> propuesto.
>
> El costo de NO implementarla es **mantener una arquitectura sub-óptima**
> de forma permanente.

---

**Elaborado por:** ISO Management Systems Specialist
**Fecha:** 2026-01-15
**Versión:** 1.0
**Última Actualización:** 2026-01-15

---

**FIN DEL ÍNDICE MAESTRO**

## 📂 Ubicación de Archivos

```
c:/Proyectos/StrateKaz/docs/
├── INDEX_REORGANIZACION_N1.md (este archivo)
├── RESUMEN_EJECUTIVO_REORGANIZACION_N1.md
├── ANALISIS_ARQUITECTONICO_N1_REORGANIZACION.md
├── MATRIZ_IMPACTO_REORGANIZACION_N1.md
└── SCRIPTS_MIGRACION_N1.md
```

Total: **~180 páginas** de análisis exhaustivo
