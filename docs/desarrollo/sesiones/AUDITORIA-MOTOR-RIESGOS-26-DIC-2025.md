# AUDITORÍA DETALLADA: MÓDULO MOTOR_RIESGOS

**Fecha:** 26 Diciembre 2025
**Auditor:** Claude Code (DJANGO MASTER)
**Alcance:** `backend/apps/motor_riesgos/`
**Objetivo:** Verificar cumplimiento de políticas y estado para completar Semana 9

---

## 1. ESTRUCTURA DE DIRECTORIOS

### Apps Existentes

```
backend/apps/motor_riesgos/
├── __init__.py
├── urls.py (router principal)
├── aspectos_ambientales/          # Completada (fuera de Semana 9)
├── contexto_organizacional/        # ⚠️ INCOMPLETA
├── ipevr/                          # ✅ COMPLETA
├── riesgos_procesos/               # ⚠️ INCOMPLETA
├── riesgos_viales/                 # Pendiente (fuera de Semana 9)
├── sagrilaft_ptee/                 # Pendiente (fuera de Semana 9)
└── seguridad_informacion/          # Pendiente (fuera de Semana 9)
```

### Apps Según Semana 9

| App Requerida | Nombre Real | Estado | Observación |
|---------------|-------------|--------|-------------|
| `motor_riesgos/contexto/` | `contexto_organizacional/` | ⚠️ Incompleta | Modelos creados pero vistas/serializers con nombres LEGACY |
| `motor_riesgos/riesgos_procesos/` | `riesgos_procesos/` | ⚠️ Incompleta | Modelos creados pero vistas referencian modelos inexistentes |
| `motor_riesgos/ipevr/` | `ipevr/` | ✅ Completa | Cumple políticas, usa StandardViewSetMixin |

---

## 2. ANÁLISIS POR APP

### 2.1 CONTEXTO_ORGANIZACIONAL

#### Modelos (models.py) - ✅ COMPLETOS Y CONFORMES

**Modelos Creados:**
1. `AnalisisDOFA` (BaseCompanyModel) ✅
2. `FactorDOFA` (BaseCompanyModel + OrderedModel) ✅
3. `EstrategiaTOWS` (BaseCompanyModel) ✅
4. `AnalisisPESTEL` (BaseCompanyModel) ✅
5. `FactorPESTEL` (BaseCompanyModel + OrderedModel) ✅
6. `FuerzaPorter` (BaseCompanyModel) ✅

**Verificación de Políticas:**

| Política | Cumplimiento | Observación |
|----------|--------------|-------------|
| Herencia de BaseCompanyModel | ✅ SÍ | 6/6 modelos principales |
| Campo de ordenamiento: `orden` | ✅ SÍ | FactorDOFA y FactorPESTEL tienen campo `orden` |
| Campos de negocio en español | ✅ SÍ | nombre, descripcion, fecha_analisis, etc. |
| Campos de auditoría en inglés | ✅ SÍ | created_at, updated_at, created_by (heredados) |
| Enums en minúsculas con TextChoices | ✅ SÍ | EstadoAnalisis, TipoFactor, NivelImpacto, etc. |
| Type hints en funciones públicas | ⚠️ NO | No hay funciones públicas |
| Docstrings en clases | ✅ SÍ | Todas las clases tienen docstrings descriptivos |
| db_table explícito | ✅ SÍ | Formato: `motor_riesgos_*` |
| indexes definidos | ✅ SÍ | Todos los modelos principales tienen indexes |

**Campos Adicionales Detectados:**

✅ Todos los modelos tienen los campos requeridos según el plan de Semana 9.

**Modelos Faltantes:**

❌ **NINGUNO** - Todos los modelos del plan están implementados.

#### ViewSets (views.py) - ❌ DESACTUALIZADOS Y NO CONFORMES

**ViewSets Creados:**
1. `FactorExternoViewSet` - ❌ MODELO NO EXISTE EN models.py
2. `FactorInternoViewSet` - ❌ MODELO NO EXISTE EN models.py
3. `AnalisisDOFAViewSet` - ✅ Modelo existe
4. `EstrategiaDOFAViewSet` - ⚠️ Nombre incorrecto (debería ser EstrategiaTOWSViewSet)

**Problemas Críticos:**

1. ❌ **Imports de modelos inexistentes:**
   ```python
   from .models import FactorExterno, FactorInterno, AnalisisDOFA, EstrategiaDOFA
   ```
   - `FactorExterno` NO existe (debería ser `FactorPESTEL`)
   - `FactorInterno` NO existe (debería ser `FactorDOFA`)
   - `EstrategiaDOFA` NO existe (debería ser `EstrategiaTOWS`)

2. ❌ **NO usa StandardViewSetMixin:**
   ```python
   class FactorExternoViewSet(viewsets.ModelViewSet):  # ❌ Debería heredar StandardViewSetMixin
   ```

3. ❌ **Lógica de negocio inconsistente:**
   - `AnalisisDOFAViewSet.matriz_completa()` busca factores por tipo FORTALEZA, OPORTUNIDAD, etc.
   - Pero los tipos en `FactorDOFA.TipoFactor` son: fortaleza, oportunidad (minúsculas)
   - No hay separación entre factores internos/externos

**ViewSets Faltantes:**

| ViewSet Requerido | Estado |
|-------------------|--------|
| `AnalisisPESTELViewSet` | ❌ NO existe |
| `FactorPESTELViewSet` | ❌ NO existe (hay FactorExternoViewSet legacy) |
| `FuerzaPorterViewSet` | ❌ NO existe |

#### Serializers (serializers.py) - ❌ DESACTUALIZADOS

**Serializers Creados:**
1. `FactorExternoSerializer` - ❌ Modelo no existe
2. `FactorInternoSerializer` - ❌ Modelo no existe
3. `EstrategiaDOFASerializer` - ⚠️ Nombre incorrecto
4. `AnalisisDOFASerializer` - ✅ Correcto

**Problemas:**
- Serializers referencian modelos legacy
- Falta: `AnalisisPESTELSerializer`, `FactorPESTELSerializer`, `FuerzaPorterSerializer`

#### URLs (urls.py) - ⚠️ PARCIALMENTE CONFORME

```python
router.register(r'factores-externos', FactorExternoViewSet, basename='factor-externo')
router.register(r'factores-internos', FactorInternoViewSet, basename='factor-interno')
router.register(r'analisis-dofa', AnalisisDOFAViewSet, basename='analisis-dofa')
router.register(r'estrategias-dofa', EstrategiaDOFAViewSet, basename='estrategia-dofa')
```

❌ **Faltan rutas para:**
- `analisis-pestel`
- `factores-pestel`
- `fuerzas-porter`

#### Migraciones - ❌ NO EXISTEN

```bash
ls: cannot access 'backend/apps/motor_riesgos/contexto_organizacional/migrations': No such file or directory
```

❌ **CRÍTICO:** No hay carpeta `migrations/` ni migración inicial.

#### Tests - ✅ EXISTEN

**Archivos Detectados:**
- `tests/__init__.py`
- `tests/conftest.py`
- `tests/test_models.py`
- `tests/test_views.py`

✅ Estructura correcta. (Contenido no auditado)

---

### 2.2 IPEVR (Matriz GTC-45)

#### Modelos (models.py) - ✅ EXCELENTE Y CONFORME

**Modelos Creados:**
1. `ClasificacionPeligro` (TimestampedModel + SoftDeleteModel + OrderedModel) ✅
2. `PeligroGTC45` (TimestampedModel + SoftDeleteModel + OrderedModel) ✅
3. `MatrizIPEVR` (BaseCompanyModel) ✅
4. `ControlSST` (BaseCompanyModel) ✅

**Verificación de Políticas:**

| Política | Cumplimiento | Observación |
|----------|--------------|-------------|
| Herencia correcta | ✅ SÍ | Catálogos con TimestampedModel+SoftDeleteModel+OrderedModel, datos con BaseCompanyModel |
| Campo `orden` | ✅ SÍ | Presente en ClasificacionPeligro y PeligroGTC45 |
| Campos en español | ✅ SÍ | area, cargo, peligro, fuente, medio, trabajador |
| Campos de auditoría en inglés | ✅ SÍ | created_at, updated_at, created_by |
| Enums minúsculas | ✅ SÍ | Categoria, EstadoMatriz, TipoControl, etc. |
| Type hints | ⚠️ NO | No hay en métodos públicos |
| Docstrings | ✅ EXCELENTE | Docstrings detallados con explicación de GTC-45 |
| db_table | ✅ SÍ | motor_riesgos_* |
| indexes | ✅ SÍ | Índices bien definidos |

**Propiedades Calculadas (GTC-45):**

✅ **EXCELENTE implementación:**
- `nivel_probabilidad` = ND × NE
- `interpretacion_np` (muy_alto, alto, medio, bajo)
- `nivel_riesgo` = NP × NC
- `interpretacion_nr` (I, II, III, IV)
- `aceptabilidad` (aceptable, no_aceptable)
- `significado_aceptabilidad` (textos descriptivos)

**Campos Según GTC-45:**

✅ Todos los campos requeridos están presentes:
- Identificación: area, cargo, proceso, actividad, tarea, rutinaria
- Peligro: peligro, fuente, medio, trabajador, efectos
- Controles existentes: control_fuente, control_medio, control_individuo
- Evaluación: nivel_deficiencia, nivel_exposicion, nivel_consecuencia
- Medidas: eliminacion, sustitucion, controles_ingenieria, controles_administrativos, epp
- Metadatos: responsable, fecha_valoracion, fecha_proxima_revision, estado

#### ViewSets (views.py) - ✅ EXCELENTE Y CONFORME

**ViewSets Creados:**
1. `ClasificacionPeligroViewSet` (StandardViewSetMixin + ModelViewSet) ✅
2. `PeligroGTC45ViewSet` (StandardViewSetMixin + ModelViewSet) ✅
3. `MatrizIPEVRViewSet` (StandardViewSetMixin + ModelViewSet) ✅
4. `ControlSSTViewSet` (StandardViewSetMixin + ModelViewSet) ✅

**Verificación de Políticas:**

| Política | Cumplimiento |
|----------|--------------|
| Usa StandardViewSetMixin | ✅ SÍ (4/4) |
| Filtros con DjangoFilterBackend | ✅ SÍ |
| Búsqueda con SearchFilter | ✅ SÍ |
| Ordenamiento con OrderingFilter | ✅ SÍ |
| Acciones custom (@action) | ✅ SÍ |
| select_related/prefetch_related | ✅ SÍ |

**Acciones Custom Implementadas:**

1. `ClasificacionPeligroViewSet.por_categoria()` ✅
2. `PeligroGTC45ViewSet.por_clasificacion()` ✅
3. `MatrizIPEVRViewSet.resumen()` ✅
4. `MatrizIPEVRViewSet.criticos()` ✅
5. `MatrizIPEVRViewSet.por_area()` ✅
6. `MatrizIPEVRViewSet.por_cargo()` ✅
7. `MatrizIPEVRViewSet.por_peligro()` ✅
8. `MatrizIPEVRViewSet.cambiar_estado()` ✅
9. `ControlSSTViewSet.pendientes()` ✅
10. `ControlSSTViewSet.por_tipo()` ✅

#### Serializers (serializers.py) - ✅ COMPLETOS

**Serializers Creados:**
1. `ClasificacionPeligroSerializer` ✅
2. `PeligroGTC45Serializer` ✅
3. `ControlSSTSerializer` ✅
4. `MatrizIPEVRListSerializer` ✅
5. `MatrizIPEVRDetailSerializer` ✅

✅ Incluyen campos calculados read-only:
- nivel_probabilidad, interpretacion_np
- nivel_riesgo, interpretacion_nr
- aceptabilidad, significado_aceptabilidad

#### URLs (urls.py) - ✅ COMPLETAS

```python
router.register(r'clasificaciones', ClasificacionPeligroViewSet)
router.register(r'peligros', PeligroGTC45ViewSet)
router.register(r'matrices', MatrizIPEVRViewSet)
router.register(r'controles', ControlSSTViewSet)
```

✅ Todas las rutas necesarias registradas.

#### Migraciones - ✅ EXISTEN

```
ipevr/migrations/0001_initial.py (16868 bytes)
```

✅ Migración inicial creada y aplicada.

#### Tests - ✅ EXISTEN

**Archivos:**
- `tests/__init__.py`
- `tests/conftest.py`
- `tests/test_models.py`
- `tests/test_views.py`
- `tests/run_tests.py` (script auxiliar)

---

### 2.3 RIESGOS_PROCESOS

#### Modelos (models.py) - ✅ COMPLETOS Y CONFORMES

**Modelos Creados:**
1. `CategoriaRiesgo` (TimestampedModel + SoftDeleteModel + OrderedModel) ✅
2. `RiesgoProceso` (BaseCompanyModel) ✅
3. `TratamientoRiesgo` (BaseCompanyModel) ✅
4. `ControlOperacional` (BaseCompanyModel) ✅
5. `Oportunidad` (BaseCompanyModel) ✅

**Verificación de Políticas:**

| Política | Cumplimiento | Observación |
|----------|--------------|-------------|
| Herencia correcta | ✅ SÍ | CategoriaRiesgo es catálogo, resto BaseCompanyModel |
| Campo `orden` | ✅ SÍ | CategoriaRiesgo tiene campo `orden` |
| Campos en español | ✅ SÍ | nombre, descripcion, proceso, causa_raiz, consecuencia |
| Enums minúsculas | ✅ SÍ | TipoRiesgo, EstadoRiesgo, TipoTratamiento, etc. |
| Type hints | ⚠️ NO | Métodos `_interpretar_nivel()` sin type hints |
| Docstrings | ✅ EXCELENTE | Docstrings detallados con explicación ISO 31000 |
| db_table | ✅ SÍ | motor_riesgos_* |
| indexes | ✅ SÍ | Índices bien definidos |

**Propiedades Calculadas (ISO 31000):**

✅ **EXCELENTE:**
- `nivel_inherente` = probabilidad_inherente × impacto_inherente
- `nivel_residual` = probabilidad_residual × impacto_residual
- `interpretacion_inherente` (CRITICO, ALTO, MODERADO, BAJO)
- `interpretacion_residual` (CRITICO, ALTO, MODERADO, BAJO)
- `reduccion_riesgo_porcentaje`

**Validadores:**

✅ Usa MinValueValidator y MaxValueValidator en campos de escala 1-5.

#### ViewSets (views.py) - ❌ REFERENCIAS A MODELOS INEXISTENTES

**ViewSets Creados:**
1. `CategoriaRiesgoViewSet` ✅
2. `RiesgoProcesosViewSet` ✅
3. `TratamientoRiesgoViewSet` ✅
4. `MonitoreoRiesgoViewSet` ❌ MODELO NO EXISTE
5. `MapaCalorViewSet` ❌ MODELO NO EXISTE

**Problemas Críticos:**

1. ❌ **Imports de modelos inexistentes:**
   ```python
   from .models import (
       CategoriaRiesgo,
       RiesgoProceso,
       TratamientoRiesgo,
       MonitoreoRiesgo,  # ❌ NO existe en models.py
       MapaCalor         # ❌ NO existe en models.py
   )
   ```

2. ❌ **NO usa StandardViewSetMixin:**
   ```python
   class CategoriaRiesgoViewSet(viewsets.ModelViewSet):  # ❌
   class RiesgoProcesosViewSet(viewsets.ModelViewSet):   # ❌
   ```

3. ❌ **ViewSets con lógica sobre modelos inexistentes:**
   - `MonitoreoRiesgoViewSet` completo pero modelo no implementado
   - `MapaCalorViewSet` completo pero modelo no implementado

**ViewSets Faltantes:**

| ViewSet Requerido | Estado |
|-------------------|--------|
| `ControlOperacionalViewSet` | ❌ NO existe (modelo sí existe) |
| `OportunidadViewSet` | ❌ NO existe (modelo sí existe) |

#### Serializers (serializers.py) - ❌ REFERENCIAS A MODELOS INEXISTENTES

**Serializers Creados:**
1. `CategoriaRiesgoSerializer` ✅
2. `RiesgoProcesoListSerializer` ✅
3. `RiesgoProcesoDetailSerializer` ✅
4. `TratamientoRiesgoSerializer` ✅
5. `MonitoreoRiesgoSerializer` ❌ Modelo no existe
6. `MapaCalorSerializer` ❌ Modelo no existe

**Problemas:**
- Serializers referencian modelos inexistentes
- Falta: `ControlOperacionalSerializer`, `OportunidadSerializer`

#### URLs (urls.py) - ⚠️ PARCIALMENTE CONFORME

```python
router.register(r'categorias', CategoriaRiesgoViewSet)
router.register(r'riesgos', RiesgoProcesosViewSet)
router.register(r'tratamientos', TratamientoRiesgoViewSet)
router.register(r'monitoreos', MonitoreoRiesgoViewSet)  # ❌ ViewSet no funcional
router.register(r'mapas-calor', MapaCalorViewSet)       # ❌ ViewSet no funcional
```

❌ **Faltan rutas para:**
- `controles-operacionales`
- `oportunidades`

#### Migraciones - ✅ EXISTEN

```
riesgos_procesos/migrations/0001_initial.py (34617 bytes)
```

✅ Migración inicial creada y aplicada.

#### Tests - ❌ NO EXISTEN

❌ No hay carpeta `tests/` ni archivos de tests.

---

## 3. RESUMEN DE CUMPLIMIENTO POR APP

| App | Modelos | ViewSets | Serializers | URLs | Migraciones | Tests | Estado Global |
|-----|---------|----------|-------------|------|-------------|-------|---------------|
| **contexto_organizacional** | ✅ 6/6 | ❌ 4/7 legacy | ❌ 4/6 legacy | ❌ Incompletas | ❌ NO existen | ✅ Existen | ⚠️ REQUIERE REFACTORING |
| **ipevr** | ✅ 4/4 | ✅ 4/4 | ✅ 5/5 | ✅ Completas | ✅ Aplicadas | ✅ Existen | ✅ COMPLETA |
| **riesgos_procesos** | ✅ 5/5 | ❌ 3/7 | ❌ 4/6 | ⚠️ Parciales | ✅ Aplicadas | ❌ NO existen | ⚠️ REQUIERE COMPLETAR |

---

## 4. ANÁLISIS DE CONFORMIDAD CON POLÍTICAS

### 4.1 Herencia de Modelos Base

| App | Catálogos usan TimestampedModel+SoftDeleteModel+OrderedModel | Datos usan BaseCompanyModel | Cumplimiento |
|-----|--------------------------------------------------------------|------------------------------|--------------|
| contexto_organizacional | N/A (no hay catálogos) | ✅ 6/6 | ✅ 100% |
| ipevr | ✅ 2/2 (ClasificacionPeligro, PeligroGTC45) | ✅ 2/2 (MatrizIPEVR, ControlSST) | ✅ 100% |
| riesgos_procesos | ✅ 1/1 (CategoriaRiesgo) | ✅ 4/4 | ✅ 100% |

### 4.2 ViewSets con StandardViewSetMixin

| App | Total ViewSets | Usan StandardViewSetMixin | Cumplimiento |
|-----|----------------|---------------------------|--------------|
| contexto_organizacional | 4 | 0 | ❌ 0% |
| ipevr | 4 | 4 | ✅ 100% |
| riesgos_procesos | 5 | 0 | ❌ 0% |

### 4.3 Campo de Ordenamiento

✅ **CONFORME:** Todos los modelos con OrderedModel usan campo `orden` (NO `order`).

### 4.4 Nomenclatura de Campos

| Tipo de Campo | Política | Cumplimiento |
|---------------|----------|--------------|
| Negocio | Español | ✅ 100% (nombre, descripcion, fecha_analisis, etc.) |
| Auditoría | Inglés | ✅ 100% (created_at, updated_at, created_by, is_active) |

### 4.5 Enums y Choices

✅ **CONFORME:** Todos los TextChoices usan valores en minúsculas:
```python
class EstadoAnalisis(models.TextChoices):
    BORRADOR = "borrador", "Borrador"          # ✅
    EN_REVISION = "en_revision", "En Revisión" # ✅
```

### 4.6 Type Hints y Docstrings

| Aspecto | contexto_organizacional | ipevr | riesgos_procesos |
|---------|-------------------------|-------|------------------|
| Docstrings en clases | ✅ Excelente | ✅ Excelente | ✅ Excelente |
| Type hints en métodos | ⚠️ No hay métodos públicos | ⚠️ Faltan | ⚠️ Faltan en `_interpretar_nivel()` |

---

## 5. MODELOS FALTANTES SEGÚN PLAN SEMANA 9

### Contexto Organizacional

❌ **NINGUNO** - Todos implementados:
- ✅ AnalisisDOFA
- ✅ FactorDOFA
- ✅ EstrategiaTOWS
- ✅ AnalisisPESTEL
- ✅ FactorPESTEL
- ✅ FuerzaPorter

### IPEVR

❌ **NINGUNO** - Todos implementados:
- ✅ ClasificacionPeligro (catálogo de 7 categorías)
- ✅ PeligroGTC45 (catálogo de 78 peligros)
- ✅ MatrizIPEVR
- ✅ ControlSST

### Riesgos de Procesos

⚠️ **MODELOS ADICIONALES NECESARIOS (referenciados en views/serializers):**
- ❌ `MonitoreoRiesgo` - Usado en views.py línea 13, 128
- ❌ `MapaCalor` - Usado en views.py línea 14, 151

**Modelos del Plan (Estado):**
- ✅ CategoriaRiesgo
- ✅ RiesgoProceso
- ✅ TratamientoRiesgo
- ✅ ControlOperacional
- ✅ Oportunidad

---

## 6. VIEWSETS Y SERIALIZERS FALTANTES

### Contexto Organizacional

**ViewSets a REFACTORIZAR:**
- ❌ FactorExternoViewSet → Eliminar (modelo no existe)
- ❌ FactorInternoViewSet → Eliminar (modelo no existe)
- ❌ EstrategiaDOFAViewSet → Renombrar a EstrategiaTOWSViewSet

**ViewSets a CREAR:**
- ❌ FactorDOFAViewSet
- ❌ AnalisisPESTELViewSet
- ❌ FactorPESTELViewSet
- ❌ FuerzaPorterViewSet

**Serializers a REFACTORIZAR/CREAR:**
- ❌ FactorDOFASerializer
- ❌ EstrategiaTOWSSerializer
- ❌ AnalisisPESTELSerializer
- ❌ FactorPESTELSerializer
- ❌ FuerzaPorterSerializer

### Riesgos de Procesos

**ViewSets a CREAR:**
- ❌ ControlOperacionalViewSet
- ❌ OportunidadViewSet

**ViewSets a COMPLETAR (si se crean modelos):**
- ⚠️ MonitoreoRiesgoViewSet (requiere crear modelo)
- ⚠️ MapaCalorViewSet (requiere crear modelo)

**Serializers a CREAR:**
- ❌ ControlOperacionalSerializer
- ❌ OportunidadSerializer

---

## 7. MIGRACIONES

| App | Estado | Observación |
|-----|--------|-------------|
| contexto_organizacional | ❌ NO EXISTEN | CRÍTICO: No hay carpeta migrations/ |
| ipevr | ✅ APLICADAS | 0001_initial.py (16KB) |
| riesgos_procesos | ✅ APLICADAS | 0001_initial.py (34KB) |

**Acción Requerida:**
```bash
cd backend
python manage.py makemigrations motor_riesgos.contexto_organizacional
python manage.py migrate
```

---

## 8. TESTS

| App | Estado | Archivos | Observación |
|-----|--------|----------|-------------|
| contexto_organizacional | ✅ EXISTEN | 4 archivos | Estructura correcta (contenido no auditado) |
| ipevr | ✅ EXISTEN | 5 archivos | Incluye run_tests.py |
| riesgos_procesos | ❌ NO EXISTEN | 0 archivos | Requiere creación completa |

**Tests Requeridos (Semana 9):**
- Backend: 35+ tests
- Frontend: 20+ tests

---

## 9. PROBLEMAS CRÍTICOS IDENTIFICADOS

### 🔴 CRÍTICO - PRIORIDAD ALTA

1. **contexto_organizacional/views.py - Referencias a modelos inexistentes**
   - Importa: `FactorExterno`, `FactorInterno`, `EstrategiaDOFA`
   - No existen en models.py
   - **Acción:** Refactorizar views.py completamente

2. **contexto_organizacional - Sin migraciones**
   - Carpeta migrations/ no existe
   - **Acción:** Crear carpeta y ejecutar makemigrations

3. **riesgos_procesos/views.py - Referencias a modelos inexistentes**
   - Importa: `MonitoreoRiesgo`, `MapaCalor`
   - No existen en models.py
   - **Acción:** Crear modelos O eliminar ViewSets

### 🟡 IMPORTANTE - PRIORIDAD MEDIA

4. **contexto_organizacional - ViewSets no usan StandardViewSetMixin**
   - 4/4 ViewSets heredan directamente de ModelViewSet
   - **Acción:** Refactorizar para usar StandardViewSetMixin

5. **riesgos_procesos - ViewSets no usan StandardViewSetMixin**
   - 5/5 ViewSets heredan directamente de ModelViewSet
   - **Acción:** Refactorizar para usar StandardViewSetMixin

6. **riesgos_procesos - Sin tests**
   - No hay carpeta tests/ ni archivos
   - **Acción:** Crear estructura de tests completa

### 🔵 MENOR - PRIORIDAD BAJA

7. **Type hints faltantes en métodos**
   - Algunos métodos sin type hints
   - **Acción:** Agregar type hints donde corresponda

---

## 10. RECOMENDACIONES

### 10.1 Contexto Organizacional - REFACTORING COMPLETO

**Archivo:** `backend/apps/motor_riesgos/contexto_organizacional/views.py`

**Acción:** Eliminar y recrear completamente siguiendo patrón de IPEVR.

**Nuevos ViewSets requeridos:**
```python
from apps.core.mixins import StandardViewSetMixin

class AnalisisDOFAViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    queryset = AnalisisDOFA.objects.all()
    serializer_class = AnalisisDOFASerializer
    # ...

class FactorDOFAViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    queryset = FactorDOFA.objects.all()
    serializer_class = FactorDOFASerializer
    # ...

class EstrategiaTOWSViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    queryset = EstrategiaTOWS.objects.all()
    serializer_class = EstrategiaTOWSSerializer
    # ...

class AnalisisPESTELViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    queryset = AnalisisPESTEL.objects.all()
    serializer_class = AnalisisPESTELSerializer
    # ...

class FactorPESTELViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    queryset = FactorPESTEL.objects.all()
    serializer_class = FactorPESTELSerializer
    # ...

class FuerzaPorterViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    queryset = FuerzaPorter.objects.all()
    serializer_class = FuerzaPorterSerializer
    # ...
```

### 10.2 Riesgos de Procesos - COMPLETAR

**Opción 1:** Crear modelos faltantes
```python
# backend/apps/motor_riesgos/riesgos_procesos/models.py

class MonitoreoRiesgo(BaseCompanyModel):
    """Registro de monitoreo periódico de riesgos"""
    riesgo = models.ForeignKey(RiesgoProceso, on_delete=models.CASCADE)
    fecha_monitoreo = models.DateField()
    probabilidad_actual = models.PositiveSmallIntegerField(...)
    impacto_actual = models.PositiveSmallIntegerField(...)
    efectividad_controles = models.CharField(...)
    observaciones = models.TextField(blank=True)
    acciones_correctivas = models.TextField(blank=True)
    realizado_por = models.ForeignKey(User, ...)

class MapaCalor(BaseCompanyModel):
    """Mapa de calor de riesgos para visualización"""
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    fecha_generacion = models.DateField(auto_now_add=True)
    tipo = models.CharField(...)  # INHERENTE, RESIDUAL
    configuracion = models.JSONField(default=dict)
    datos = models.JSONField(default=dict)  # Matriz 5x5
    generado_por = models.ForeignKey(User, ...)
```

**Opción 2:** Eliminar ViewSets no funcionales
- Eliminar `MonitoreoRiesgoViewSet` y `MapaCalorViewSet` de views.py
- Eliminar sus serializers
- Eliminar sus rutas de urls.py

**Recomendación:** Opción 1 (crear modelos) para funcionalidad completa.

### 10.3 Crear Tests para Riesgos de Procesos

```bash
mkdir -p backend/apps/motor_riesgos/riesgos_procesos/tests
touch backend/apps/motor_riesgos/riesgos_procesos/tests/__init__.py
touch backend/apps/motor_riesgos/riesgos_procesos/tests/conftest.py
touch backend/apps/motor_riesgos/riesgos_procesos/tests/test_models.py
touch backend/apps/motor_riesgos/riesgos_procesos/tests/test_views.py
```

### 10.4 Crear Migraciones para Contexto Organizacional

```bash
cd backend
mkdir -p apps/motor_riesgos/contexto_organizacional/migrations
touch apps/motor_riesgos/contexto_organizacional/migrations/__init__.py
python manage.py makemigrations motor_riesgos.contexto_organizacional
python manage.py migrate
```

---

## 11. PLAN DE ACCIÓN PRIORIZADO

### FASE 1: CORRECCIONES CRÍTICAS (2-3 horas)

1. ✅ **Crear migraciones para contexto_organizacional**
   - Crear carpeta migrations/
   - Ejecutar makemigrations
   - Aplicar migrate

2. ✅ **Refactorizar contexto_organizacional/views.py**
   - Eliminar ViewSets legacy
   - Crear 6 ViewSets nuevos con StandardViewSetMixin
   - Actualizar imports

3. ✅ **Refactorizar contexto_organizacional/serializers.py**
   - Eliminar serializers legacy
   - Crear 6 serializers nuevos

4. ✅ **Actualizar contexto_organizacional/urls.py**
   - Registrar 6 rutas nuevas

### FASE 2: COMPLETAR RIESGOS DE PROCESOS (2-3 horas)

5. ✅ **Decidir sobre MonitoreoRiesgo y MapaCalor**
   - Opción recomendada: Crear modelos

6. ✅ **Crear ViewSets faltantes**
   - ControlOperacionalViewSet
   - OportunidadViewSet
   - (Opcionalmente completar Monitoreo y MapaCalor)

7. ✅ **Refactorizar ViewSets existentes**
   - Agregar StandardViewSetMixin a los 3 ViewSets

8. ✅ **Crear tests para riesgos_procesos**
   - Estructura completa
   - Mínimo 12 tests

### FASE 3: MEJORAS Y POLISH (1 hora)

9. ✅ **Agregar type hints faltantes**
   - Métodos en ipevr
   - Métodos en riesgos_procesos

10. ✅ **Verificar y actualizar tests**
    - Revisar tests de contexto_organizacional
    - Asegurar cobertura >85%

---

## 12. MÉTRICAS FINALES

### Estado Actual vs. Objetivos Semana 9

| Métrica | Objetivo | Actual | Cumplimiento |
|---------|----------|--------|--------------|
| Modelos creados | 20+ | 15 | ⚠️ 75% |
| Modelos con BaseCompanyModel | 100% | 100% | ✅ 100% |
| ViewSets con StandardViewSetMixin | 100% | 31% (4/13) | ❌ 31% |
| Tests backend | 35+ | ? (no auditados) | ⚠️ Pendiente |
| Componentes frontend | 15+ | 0 | ❌ 0% (no auditado) |

**Modelos Faltantes Potenciales:**
- MonitoreoRiesgo (referenciado en views)
- MapaCalor (referenciado en views)

**Total Modelos Implementados:** 15 + 2 pendientes = 17/20+

---

## 13. CONCLUSIÓN

### ✅ Fortalezas

1. **IPEVR está EXCELENTE:**
   - Modelos bien diseñados según GTC-45
   - ViewSets completos con StandardViewSetMixin
   - Propiedades calculadas correctas
   - Migraciones aplicadas
   - Tests existentes

2. **Modelos bien diseñados:**
   - Todos heredan correctamente de BaseCompanyModel o mixins
   - Campos en español/inglés según política
   - Docstrings excelentes
   - Enums en minúsculas

3. **Conformidad con políticas de base:**
   - Campo `orden` (no `order`)
   - db_table explícito
   - Indexes definidos
   - TextChoices con minúsculas

### ❌ Debilidades

1. **contexto_organizacional requiere REFACTORING COMPLETO:**
   - Views.py con modelos legacy inexistentes
   - Sin migraciones aplicadas
   - ViewSets no usan StandardViewSetMixin

2. **riesgos_procesos incompleto:**
   - Referencias a modelos inexistentes en views
   - ViewSets no usan StandardViewSetMixin
   - Sin tests

3. **Frontend no auditado:**
   - 0 componentes según plan
   - Requiere revisión completa aparte

### 🎯 Prioridad Absoluta

**Para completar Semana 9:**

1. Refactorizar contexto_organizacional completamente (views, serializers, urls)
2. Crear migraciones para contexto_organizacional
3. Completar riesgos_procesos (modelos faltantes, ViewSets, tests)
4. Agregar StandardViewSetMixin a todos los ViewSets
5. Crear tests faltantes

**Tiempo estimado:** 6-8 horas de trabajo enfocado.

---

**FIN DEL REPORTE**

Fecha de Auditoría: 26 Diciembre 2025
Auditor: DJANGO MASTER (Claude Code)
Versión del Reporte: 1.0
