# Resumen Ejecutivo - Movimiento de Módulos ERP StrateKaz

**Fecha:** 2026-01-11
**Para:** Equipo de Desarrollo
**De:** Arquitecto Senior - Claude Code

---

## 🎯 Objetivo

Evaluar el impacto de mover 3 submódulos entre niveles arquitectónicos para mejorar la cohesión conceptual y resolver dependencias circulares.

---

## 📊 Propuesta de Cambios

| # | Módulo | Desde | Hacia | Modelos | Riesgo |
|---|--------|-------|-------|---------|--------|
| 1 | `sistema_documental` | HSEQ (Nivel 3) | `gestion_documental` (Nivel 0.5 - NUEVO) | 10 | 🔴 ALTO |
| 2 | `contexto_organizacional` | Motor Riesgos (Nivel 2) | Gestión Estratégica (Nivel 1) | 6 | 🟢 BAJO |
| 3 | `planificacion_sistema` | HSEQ (Nivel 3) | Gestión Estratégica (Nivel 1) | 5 | 🟡 MEDIO |

---

## ⚠️ Hallazgo Crítico: Dependencia Circular

**Problema Detectado:**
```python
# A → B
gestion_estrategica/identidad/services.py → hseq_management/sistema_documental/models

# B → A
hseq_management/sistema_documental/views.py → gestion_estrategica/identidad/models
```

**Impacto:** 🔴 **BLOQUEANTE** - Debe resolverse antes de mover `sistema_documental`

**Solución Recomendada:** Crear módulo transversal `apps/gestion_documental/` (Nivel 0.5)

---

## ✅ Recomendación Final

### Opción Híbrida (Recomendada)

**1. Crear `apps/gestion_documental/` (Nivel 0.5 - Transversal)**
- ✅ Mover todo `sistema_documental` aquí
- ✅ Resuelve dependencia circular
- ✅ Lógica: Documentos son transversales a todo el ERP

**2. Mover `contexto_organizacional` → `gestion_estrategica/planeacion/contexto/`**
- ✅ Alineación conceptual perfecta (DOFA/PESTEL es planeación estratégica)
- ✅ Sin dependencias circulares
- ✅ Sin ForeignKeys cruzadas

**3. Fusionar `planificacion_sistema` → `gestion_estrategica/planeacion/operativo/`**
- ⚠️  Evaluar redundancia con `StrategicPlan`
- ⚠️  Alternativa: Mantener separado si complejidad HSEQ lo requiere

---

## 📁 Nueva Arquitectura

```
apps/
├── gestion_documental/        # Nivel 0.5 (NUEVO - Transversal)
│   ├── models.py              # 10 modelos (desde sistema_documental)
│   ├── views.py
│   ├── serializers.py
│   └── urls.py
│
├── gestion_estrategica/       # Nivel 1 (Estratégico)
│   └── planeacion/
│       ├── contexto/          # NUEVO: DOFA, PESTEL, Porter
│       │   └── models.py      # 6 modelos (desde motor_riesgos)
│       ├── estrategia/        # Existente: BSC
│       │   └── models.py      # StrategicPlan, StrategicObjective
│       └── operativo/         # NUEVO: Plan Trabajo HSEQ
│           └── models.py      # 5 modelos (desde hseq_management)
│
├── motor_riesgos/             # Nivel 2 (Cumplimiento)
│   ├── riesgos_procesos/
│   ├── ipevr/
│   ├── aspectos_ambientales/
│   ├── riesgos_viales/
│   ├── sagrilaft_ptee/
│   └── seguridad_informacion/
│
└── hseq_management/           # Nivel 3 (Torre Control)
    ├── calidad/
    ├── medicina_laboral/
    ├── seguridad_industrial/
    ├── higiene_industrial/
    ├── gestion_comites/
    ├── accidentalidad/
    ├── emergencias/
    ├── gestion_ambiental/
    └── mejora_continua/
```

---

## 📈 Beneficios

### Arquitectónicos
- ✅ **Cohesión:** DOFA/PESTEL en módulo estratégico (alineación ISO 31000)
- ✅ **Acoplamiento:** Sin dependencias circulares
- ✅ **Escalabilidad:** Sistema documental transversal reutilizable

### Negocio
- ✅ **UX:** Navegación más intuitiva (Contexto en Planeación)
- ✅ **Consistencia:** Un solo lugar para planificación estratégica
- ✅ **Cumplimiento:** Separación clara entre niveles

---

## ⏱️ Estimación

| Fase | Backend | Frontend | Testing | Total |
|------|---------|----------|---------|-------|
| 1. Crear gestion_documental | 16h | 8h | 8h | 32h |
| 2. Mover contexto_organizacional | 12h | 6h | 6h | 24h |
| 3. Mover/fusionar planificacion_sistema | 8-16h | 4-8h | 4-8h | 16-32h |
| 4. Frontend completo | 4h | 16h | 8h | 28h |
| 5. Testing y validación | 8h | 8h | 16h | 32h |
| **TOTAL** | **48-56h** | **42-46h** | **42-46h** | **132-148h** |

**Duración:** 17-19 días hábiles (3-4 semanas con 1 desarrollador)

---

## 🚨 Riesgos Principales

| Riesgo | Prob | Impacto | Mitigación |
|--------|------|---------|------------|
| Dependencia circular no detectada | Media | Alto | Análisis exhaustivo con grep + tests |
| Pérdida de datos en migración | Baja | Crítico | ✅ Backup obligatorio + dry-run |
| Errores en producción | Media | Alto | ✅ Deploy staging primero + rollback |

---

## 📋 Plan de Implementación (5 Fases)

### Fase 1: Crear `gestion_documental` (Semana 1)
1. Crear nueva app
2. Migrar modelos de `sistema_documental`
3. Actualizar imports en `identidad/services.py`
4. Ejecutar migraciones BD
5. Validar tests

### Fase 2: Mover `contexto_organizacional` (Semana 2)
1. Crear submódulo `planeacion/contexto/`
2. Migrar modelos (renombrar tablas)
3. Actualizar URLs
4. Actualizar frontend
5. Validar tests

### Fase 3: Decisión `planificacion_sistema` (Semana 3)
- **Opción A:** Fusionar con `planeacion/estrategia`
- **Opción B:** Mover completo a `planeacion/operativo`

### Fase 4: Frontend Completo (Semana 4)
1. Mover páginas
2. Actualizar rutas
3. Actualizar Sidebar/menú
4. Validar lazy loading

### Fase 5: Testing y Validación (Semana 5)
1. Tests unitarios
2. Tests de integración
3. Tests de migración BD
4. Validación en staging
5. Deploy a producción

---

## 🎯 Decisión Requerida

**¿Aprobamos proceder con la Opción Híbrida?**

- [ ] ✅ Sí, proceder con Fase 1 (crear gestion_documental)
- [ ] ⚠️  Sí, pero con modificaciones: ___________
- [ ] ❌ No, mantener estructura actual

**Comentarios:**
___________________________________________________________________

---

## 📚 Documentos Relacionados

- **Análisis Completo:** `docs/ANALISIS-IMPACTO-MOVIMIENTO-MODULOS.md` (este documento con detalles técnicos)
- **Arquitectura:** `docs/ARQUITECTURA-6-NIVELES.md`
- **Checklist:** `docs/CHECKLIST-REFACTOR-DEPENDENCIAS.md`

---

**Contacto:** Equipo de Arquitectura
**Próxima Revisión:** Post-aprobación de este documento
