# Índice: Análisis de Dependencias Circulares

**Fecha de análisis**: 2026-01-09
**Estado**: ⚠️ VIOLACIONES DETECTADAS

---

## 📚 Documentos Generados

Este análisis completo de dependencias circulares incluye los siguientes documentos:

### 1. Resumen Ejecutivo (LEER PRIMERO)
**Archivo**: `docs/RESUMEN-DEPENDENCIAS-CIRCULARES.md`

**Contenido**:
- Hallazgos principales
- Métricas cuantificadas
- Solución rápida (2-3 días)
- Impacto visual del fix

**Audiencia**: Product Owners, Tech Leads, Desarrolladores
**Tiempo de lectura**: 5 minutos

---

### 2. Análisis Completo (REFERENCIA TÉCNICA)
**Archivo**: `docs/ANALISIS-DEPENDENCIAS-CIRCULARES.md`

**Contenido**:
- Análisis detallado por categoría
- Código problemático con líneas específicas
- Explicación del por qué es problemático
- Diagramas de dependencias
- Soluciones propuestas con código
- Plan de acción por sprints
- Métricas de calidad
- Comandos de verificación

**Audiencia**: Desarrolladores, Arquitectos
**Tiempo de lectura**: 20-30 minutos

---

### 3. Checklist de Refactoring (GUÍA DE IMPLEMENTACIÓN)
**Archivo**: `docs/CHECKLIST-REFACTOR-DEPENDENCIAS.md`

**Contenido**:
- Checklist paso a paso
- División por fases y días
- Pre-requisitos
- Tests de verificación
- Plan de rollback
- Métricas de éxito
- Firma de completitud

**Audiencia**: Desarrollador asignado al refactor
**Tiempo de ejecución**: 2-3 días

---

### 4. Diagrama de Dependencias (VISUAL)
**Archivo**: `docs/diagrams/dependency-graph.mmd`

**Formato**: Mermaid diagram

**Contenido**:
- Diagrama visual de dependencias
- Backend y frontend
- Violaciones marcadas en rojo
- Flujos correctos en verde

**Uso**: Visualizar con Mermaid Live Editor o plugins de VS Code

---

## 🔧 Scripts de Verificación

### 1. Verificador de Dependencias Circulares
**Archivos**:
- `scripts/check-circular-deps.sh` (Linux/Mac)
- `scripts/check-circular-deps.ps1` (Windows)

**Uso**:
```bash
# Linux/Mac
./scripts/check-circular-deps.sh

# Windows
.\scripts\check-circular-deps.ps1
```

**Output**:
- ❌ Errores críticos (violaciones arquitectónicas)
- ⚠️ Advertencias (acoplamiento moderado)
- ✅ Verificaciones exitosas

---

### 2. Verificador de Arquitectura Completo
**Archivo**: `scripts/verify-architecture.sh`

**Uso**:
```bash
./scripts/verify-architecture.sh
```

**Verifica**:
- Estructura de directorios
- Imports prohibidos en core
- Uso de base_models
- Imports de páginas en frontend
- Definiciones de tipos TypeScript
- Cobertura de tests
- Métricas del proyecto

---

## 📊 Resumen de Hallazgos

### Backend

| Categoría | Archivos | Severidad | Estado |
|-----------|----------|-----------|--------|
| core → gestion_estrategica | 4 | 🔴 CRÍTICO | Pendiente |
| Apps → core (correcto) | 14 | ✅ OK | Correcto |

**Archivos problemáticos**:
1. `backend/apps/core/viewsets_strategic.py` (importa identidad, planeacion)
2. `backend/apps/core/serializers_strategic.py` (importa identidad, planeacion)
3. `backend/apps/core/viewsets_rbac.py` (importa organizacion)
4. `backend/apps/core/tests/*.py` (3 archivos importan organizacion)

---

### Frontend

| Categoría | Casos | Severidad | Estado |
|-----------|-------|-----------|--------|
| gestion-estrategica → configuracion | 2 | 🟠 MEDIO | Aceptable |
| gestion-estrategica → users | 3 | 🟠 MEDIO | 1 problemático |
| users → configuracion | 2 | 🟢 BAJO | Aceptable |

**Imports problemáticos**:
1. `ColaboradoresSection.tsx` importa `UsersPage` completo (aumenta bundle)

---

## 🎯 Plan de Acción

### Prioridad 1: Backend Core (Día 1-2)
- [ ] Mover `viewsets_strategic.py` a `gestion_estrategica/viewsets.py`
- [ ] Mover `serializers_strategic.py` a `gestion_estrategica/serializers.py`
- [ ] Actualizar URLs en `config/urls.py`
- [ ] Fix lazy imports en `viewsets_rbac.py`
- [ ] Actualizar tests

**Responsable**: ___________________
**Deadline**: ___________________

---

### Prioridad 2: Frontend (Día 3)
- [ ] Refactorizar `ColaboradoresSection.tsx`
- [ ] Extraer `UsersListView` o usar hook directamente

**Responsable**: ___________________
**Deadline**: ___________________

---

### Prioridad 3: Verificación (Día 3-4)
- [ ] Ejecutar suite de tests
- [ ] Ejecutar scripts de verificación
- [ ] Validar endpoints funcionan
- [ ] Actualizar documentación

**Responsable**: ___________________
**Deadline**: ___________________

---

## 📖 Cómo Usar Esta Documentación

### Si eres Product Owner / Manager
1. Lee: `RESUMEN-DEPENDENCIAS-CIRCULARES.md` (5 min)
2. Revisa métricas y prioridades
3. Asigna recursos y fecha límite

### Si eres Tech Lead / Arquitecto
1. Lee: `RESUMEN-DEPENDENCIAS-CIRCULARES.md` (5 min)
2. Lee: `ANALISIS-DEPENDENCIAS-CIRCULARES.md` (30 min)
3. Revisa diagrama: `diagrams/dependency-graph.mmd`
4. Valida plan de acción
5. Asigna desarrollador

### Si eres el Desarrollador Asignado
1. Lee: `RESUMEN-DEPENDENCIAS-CIRCULARES.md` (5 min)
2. Revisa secciones relevantes de: `ANALISIS-DEPENDENCIAS-CIRCULARES.md`
3. **Sigue paso a paso**: `CHECKLIST-REFACTOR-DEPENDENCIAS.md`
4. Ejecuta scripts de verificación antes y después
5. Documenta problemas encontrados en el checklist

---

## 🔍 Comandos Rápidos

### Verificar estado actual
```bash
# Backend: Buscar violaciones en core
grep -r "from apps\.gestion_estrategica" backend/apps/core/ --include="*.py" | grep -v test | grep -v __pycache__

# Frontend: Buscar imports de páginas
grep -r "from.*pages/.*Page" frontend/src/features --include="*.tsx"
```

### Ejecutar verificación completa
```bash
# Script automatizado
./scripts/check-circular-deps.sh

# O manualmente
python backend/manage.py test apps.core
npm run test -- --run
```

### Después del refactor
```bash
# Verificar que se solucionó
./scripts/verify-architecture.sh

# Debería retornar: "✅ Verificación completada exitosamente"
```

---

## 📞 Contacto y Soporte

**Preguntas sobre el análisis**: Equipo de Arquitectura
**Dudas técnicas durante refactor**: Tech Lead
**Reporte de problemas**: Crear issue en repo

---

## 📈 Métricas Post-Refactor

Una vez completado el refactor, actualizar:

| Métrica | Antes | Después | Objetivo |
|---------|-------|---------|----------|
| Violaciones críticas | 4 | ___ | 0 |
| Advertencias | 5 | ___ | ≤ 2 |
| Tests pasando | ___% | ___% | 100% |
| Bundle size | ___ KB | ___ KB | ≤ baseline |

---

**Última actualización**: 2026-01-09
**Próxima revisión**: Después del refactor

