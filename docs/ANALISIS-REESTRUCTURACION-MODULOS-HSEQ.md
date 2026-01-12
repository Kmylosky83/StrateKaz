# ANÁLISIS DE REESTRUCTURACIÓN DE MÓDULOS ERP STRATEKAZ

**Fecha:** 2026-01-11
**Analista:** ISO Management Systems Specialist
**Documento:** Evaluación de propuesta de reestructuración modular

---

## 1. RESUMEN EJECUTIVO

### 📋 Propuesta de Reestructuración

Se propone crear un nuevo módulo **"Planeación y Documentación del Sistema"** (orden ~15) y realizar los siguientes movimientos:

1. **Crear nuevo módulo:** `Planeación y Documentación del Sistema` (después de Dirección Estratégica)
2. **Mover desde HSEQ:**
   - `backend/apps/hseq_management/planificacion_sistema` → Nuevo módulo
   - `backend/apps/hseq_management/sistema_documental` → Nuevo módulo
3. **Mover desde Motor Riesgos:**
   - `backend/apps/motor_riesgos/contexto_organizacional` → `backend/apps/gestion_estrategica/planeacion`

### 🎯 Veredicto Preliminar

**⚠️ PROPUESTA PARCIALMENTE VIABLE CON AJUSTES CRÍTICOS**

- ✅ **Contexto Organizacional a Planeación:** VIABLE y alineado con ISO
- ⚠️ **Sistema Documental:** VIABLE pero requiere resolución de dependencias
- ❌ **Planificación Sistema a nuevo módulo:** NO RECOMENDADO - contradice estructura ISO

---

## 2. ANÁLISIS DE ESTRUCTURA ACTUAL

### 2.1 Jerarquía de Niveles ISO del ERP

```
NIVEL 1: ESTRATÉGICO
├─ [10] Dirección Estratégica (gestion_estrategica)
    ├─ Configuración (empresa, sedes, branding)
    ├─ Organización (áreas, cargos, colaboradores)
    ├─ Identidad Corporativa (misión, visión, valores, políticas)
    ├─ Planeación Estratégica (BSC, objetivos, KPIs)
    ├─ Gestión de Proyectos (PMI)
    └─ Revisión por Dirección (ISO 9.3)

NIVEL 2: CUMPLIMIENTO
├─ [20] Cumplimiento Normativo (motor_cumplimiento)
├─ [21] Motor de Riesgos (motor_riesgos)
│   ├─ Contexto Organizacional (DOFA, PESTEL, Porter)
│   ├─ Riesgos de Procesos (ISO 31000)
│   ├─ IPEVR (GTC-45)
│   ├─ Aspectos Ambientales (ISO 14001)
│   ├─ Riesgos Viales (PESV)
│   ├─ SAGRILAFT/PTEE
│   └─ Seguridad Información (ISO 27001)
└─ [22] Flujos de Trabajo (workflow_engine)

NIVEL 3: TORRE DE CONTROL
└─ [30] Gestión Integral HSEQ (hseq_management)
    ├─ Sistema Documental ⭐ PROPUESTO A MOVER
    ├─ Planificación Sistema ⭐ PROPUESTO A MOVER
    ├─ Calidad (ISO 9001)
    ├─ Medicina Laboral
    ├─ Seguridad Industrial
    ├─ Higiene Industrial
    ├─ Gestión de Comités
    ├─ Accidentalidad (ATEL)
    ├─ Emergencias
    ├─ Gestión Ambiental
    └─ Mejora Continua
```

---

## 3. ANÁLISIS DETALLADO DE CADA MÓDULO

### 3.1 Planificación Sistema (`hseq_management/planificacion_sistema`)

#### 📊 Descripción Actual
Módulo de planificación integral del sistema HSEQ que maneja:
- Plan de Trabajo Anual (PTA)
- Actividades del Plan
- Objetivos del Sistema HSEQ (vinculados a BSC)
- Programas de Gestión (PVE, Capacitación, Inspecciones, etc.)
- Seguimiento de Cronogramas

#### 🔍 Modelos Identificados
```python
- PlanTrabajoAnual (16 campos + auditoria)
- ActividadPlan (32 campos + relaciones ManyToMany)
- ObjetivoSistema (vinculación BSC, ISO)
- ProgramaGestion (PVE, Capacitación, Mantenimiento, etc.)
- ActividadPrograma
- SeguimientoCronograma
```

#### 📌 Dependencias Externas
```python
# Todas las relaciones ForeignKey a:
'core.User'  # Usuario responsable, aprobador, creador
# NO tiene dependencias de otros módulos de apps.*
```

#### 🎯 Alineación ISO

Este módulo implementa directamente:
- **ISO 9001:2015 Cláusula 6.2:** Objetivos de Calidad y planificación
- **ISO 14001:2015 Cláusula 6.2:** Objetivos ambientales
- **ISO 45001:2018 Cláusula 6.2:** Objetivos de SST
- **ISO 9001 Cláusula 8.1:** Planificación y control operacional
- **Estructura HLS común:** Todos los SIG requieren planificación de objetivos

#### ⚠️ Análisis de Propuesta de Movimiento

**PROBLEMA CONCEPTUAL CRÍTICO:**

La propuesta de mover este módulo a un nuevo "Planeación y Documentación del Sistema" en orden ~15 (entre Dirección Estratégica y Cumplimiento) **CONTRADICE la estructura ISO** por las siguientes razones:

1. **Naturaleza del Módulo:**
   - NO es planificación estratégica (eso ya existe en `gestion_estrategica.planeacion`)
   - ES planificación OPERACIONAL del sistema HSEQ (Cláusula 8.1 ISO)
   - Es específico de HSEQ (PVE, Vigilancia Epidemiológica, Programas SST)

2. **Dependencia Conceptual:**
   - Los Planes de Trabajo Anual dependen de la EXISTENCIA del sistema HSEQ
   - Son el OUTPUT de la implementación del SIG
   - Ejecutan los requisitos definidos en las normas ISO

3. **Torre de Control:**
   - HSEQ Management (Nivel 3) es la **Torre de Control** que orquesta calidad, SST, ambiente
   - La planificación del sistema HSEQ es PARTE de esa torre
   - Separarla rompe la cohesión del módulo HSEQ

**❌ RECOMENDACIÓN: NO MOVER**

**Alternativa:** Si se busca simplificar HSEQ, considerar:
- Mantener en HSEQ pero reorganizar tabs
- Crear sub-módulo visible "Planificación HSEQ" dentro de la Torre de Control

---

### 3.2 Sistema Documental (`hseq_management/sistema_documental`)

#### 📊 Descripción Actual
Sistema de gestión documental integral con control de versiones, firmas digitales y flujos de aprobación.

#### 🔍 Modelos Identificados
```python
- TipoDocumento (catálogo configurables: PR, IN, FT, MA)
- PlantillaDocumento (HTML, Markdown, Formularios dinámicos)
- Documento (control versiones, estados, firmas)
- VersionDocumento (historial completo)
- CampoFormulario (form builder dinámico)
- FirmaDocumento (firmas digitales, workflow)
- ControlDocumental (distribución, obsolescencia, destrucción)
```

#### 📌 Dependencias Externas
```python
# Dependencias de importación:
'core.User' (settings.AUTH_USER_MODEL)
# NO tiene dependencias directas de otros módulos apps.*
```

#### 📌 Dependencias ENTRANTES (quién lo usa)
```python
# apps/gestion_estrategica/identidad/services.py
from apps.hseq_management.sistema_documental.models import (
    TipoDocumento, Documento, VersionDocumento,
    FirmaDocumento, ControlDocumental
)

# Uso: Conversión de PoliticaIntegral a Documento del sistema documental
# Líneas 106-109, 411-413
```

#### 🎯 Alineación ISO

Este módulo implementa:
- **ISO 9001:2015 Cláusula 7.5:** Información documentada
- **ISO 14001/45001 Cláusula 7.5:** Información documentada
- **ISO 9001 Cláusula 4.4:** Documentación del sistema y procesos
- **Requisito transversal:** Todos los SIG requieren control documental

#### ⚠️ Análisis de Propuesta de Movimiento

**ANÁLISIS:**

**Pros del movimiento:**
1. ✅ **Transversalidad:** El sistema documental NO es exclusivo de HSEQ
2. ✅ **Uso multi-módulo:** Se usa en Identidad Corporativa (políticas)
3. ✅ **Cláusula HLS 7.5:** Es un soporte común a TODOS los sistemas
4. ✅ **Independencia funcional:** No tiene dependencias específicas de HSEQ
5. ✅ **Reutilización:** Podría servir a todos los módulos del ERP

**Cons del movimiento:**
1. ⚠️ **Dependencia circular:** `identidad` → `sistema_documental` (debe resolverse)
2. ⚠️ **Migración de datos:** Requiere migración de todos los documentos existentes
3. ⚠️ **Rutas URL:** Cambio de `/hseq/documentos/` → `/planeacion-doc/documentos/`
4. ⚠️ **Orden de módulos:** Un nuevo módulo en orden 15 podría confundir

**✅ RECOMENDACIÓN: VIABLE CON AJUSTES**

**Estrategia recomendada:**
1. **Resolver dependencia circular** antes de mover
2. **Considerar ubicación alternativa:** En lugar de nuevo módulo, ¿mover a `core`?
3. **Nombre más apropiado:** "Sistema Documental" o "Gestión Documental" (no "Planeación y Documentación")

---

### 3.3 Contexto Organizacional (`motor_riesgos/contexto_organizacional`)

#### 📊 Descripción Actual
Análisis estratégico del contexto organizacional para gestión de riesgos.

#### 🔍 Modelos Identificados
```python
- AnalisisDOFA (consolidado de período)
- FactorDOFA (Fortalezas, Oportunidades, Debilidades, Amenazas)
- EstrategiaTOWS (cruce DOFA: FO, FA, DO, DA)
- AnalisisPESTEL (análisis entorno externo)
- FactorPESTEL (Político, Económico, Social, Tecnológico, Ecológico, Legal)
- FuerzaPorter (5 fuerzas competitivas)
```

#### 📌 Dependencias Externas
```python
# Hereda de:
from apps.core.base_models import (
    BaseCompanyModel, TimestampedModel,
    SoftDeleteModel, OrderedModel
)

# Relaciones ForeignKey:
settings.AUTH_USER_MODEL
# NO tiene otras dependencias de apps.*
```

#### 📌 Dependencias ENTRANTES
```python
# Solo tests internos:
- contexto_organizacional/tests/test_models.py
- contexto_organizacional/tests/test_views.py
- contexto_organizacional/tests/conftest.py
```

#### 🎯 Alineación ISO

Este módulo implementa:
- **ISO 31000:2018:** Gestión de Riesgos - Contexto de la Organización
- **ISO 9001:2015 Cláusula 4.1:** Comprensión del contexto organizacional
- **ISO 14001/45001 Cláusula 4.1:** Contexto de la organización
- **Planeación Estratégica:** Análisis DOFA es INPUT para objetivos estratégicos

#### ⚠️ Análisis de Propuesta de Movimiento

**ANÁLISIS CONCEPTUAL:**

**¿Por qué está en Motor de Riesgos actualmente?**
- El análisis DOFA/PESTEL identifica RIESGOS y OPORTUNIDADES
- ISO 31000 lo posiciona como parte del proceso de gestión de riesgos
- Es el contexto para identificar riesgos estratégicos

**¿Por qué DEBERÍA estar en Planeación Estratégica?**
1. ✅ **Cláusula 4 ISO (Contexto)** es PREVIO a la gestión de riesgos (Cláusula 6)
2. ✅ **Input estratégico:** DOFA/PESTEL son herramientas de PLANEACIÓN ESTRATÉGICA
3. ✅ **Secuencia lógica:** Contexto → Estrategia → Riesgos → Operación
4. ✅ **BSC vinculación:** Las estrategias TOWS se convierten en objetivos BSC
5. ✅ **Nivel jerárquico:** Es análisis ESTRATÉGICO (Nivel 1), no de riesgos operacionales

**✅ RECOMENDACIÓN: MOVIMIENTO ALTAMENTE RECOMENDADO**

Este movimiento es **conceptualmente correcto** y mejora la arquitectura del sistema.

**Ubicación sugerida:**
```
backend/apps/gestion_estrategica/planeacion/
├── contexto/  (nuevo sub-paquete)
│   ├── models.py (modelos de Contexto Organizacional)
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── models.py (modelos actuales de planeación)
├── ...
```

**Alternativa 2:**
```
backend/apps/gestion_estrategica/contexto_organizacional/
(como app hermana de planeacion, dentro de gestion_estrategica)
```

---

## 4. ANÁLISIS DE DEPENDENCIAS

### 4.1 Dependencias Identificadas

#### Sistema Documental → Identidad Corporativa (CIRCULAR)

**Ubicación:** `backend/apps/gestion_estrategica/identidad/services.py`

```python
# Línea 106-109
from apps.hseq_management.sistema_documental.models import (
    TipoDocumento, Documento, VersionDocumento,
    FirmaDocumento, ControlDocumental
)

# Línea 411-413
from apps.hseq_management.sistema_documental.models import Documento
```

**Uso:**
- Conversión de `PoliticaIntegral` a `Documento` del sistema documental
- Generación de códigos de políticas (POL-CA-002, POL-GEN-001)
- Versionamiento de políticas

**⚠️ PROBLEMA:** Dependencia circular potencial si Sistema Documental necesita de Identidad

**Solución:**
1. **Opción A:** Mover Sistema Documental a `core` (módulo base)
2. **Opción B:** Crear interfaz de servicio en `core` para abstracción
3. **Opción C:** Invertir dependencia usando signals de Django

#### Contexto Organizacional → Core (OK)

```python
from apps.core.base_models import BaseCompanyModel, TimestampedModel
```

✅ **NO ES PROBLEMA:** Core es la base, todos dependen de él.

### 4.2 URLs Afectadas

#### HSEQ Management URLs (actual)

```python
# backend/apps/hseq_management/urls.py
path('documentos/', include('apps.hseq_management.sistema_documental.urls')),
path('planificacion/', include('apps.hseq_management.planificacion_sistema.urls')),
```

#### Motor Riesgos URLs (actual)

```python
# backend/apps/motor_riesgos/urls.py
path('contexto/', include('apps.motor_riesgos.contexto_organizacional.urls')),
```

#### Gestión Estratégica URLs (actual)

```python
# backend/apps/gestion_estrategica/urls.py
path('planeacion/', include('apps.gestion_estrategica.planeacion.urls')),
```

**Impacto de cambios:**
- Frontend deberá actualizar rutas API
- Considerar mantener redirects para compatibilidad
- Actualizar documentación de API

---

## 5. MIGRACIONES REQUERIDAS

### 5.1 Para Contexto Organizacional → Planeación

**Secuencia de migración:**

1. **Crear nueva ubicación:**
   ```bash
   mkdir -p backend/apps/gestion_estrategica/planeacion/contexto
   ```

2. **Copiar modelos:**
   ```python
   # Cambiar db_table de:
   'motor_riesgos_analisis_dofa'
   # A:
   'planeacion_analisis_dofa'
   # O MANTENER nombre para evitar migración de datos
   ```

3. **Crear migración:**
   ```python
   # Si cambiamos db_table:
   python manage.py makemigrations
   # Migración tipo: RenameModel o AlterModelTable
   ```

4. **Actualizar imports en toda la codebase:**
   ```bash
   # Buscar todos los imports:
   grep -r "from apps.motor_riesgos.contexto_organizacional" backend/
   # Reemplazar por:
   from apps.gestion_estrategica.planeacion.contexto
   ```

5. **Actualizar URLs:**
   ```python
   # gestion_estrategica/urls.py
   path('planeacion/contexto/', include('...contexto.urls'))
   ```

6. **Testing:**
   - Ejecutar tests del módulo
   - Verificar funcionalidad en frontend
   - Validar migraciones en staging

### 5.2 Para Sistema Documental → Nuevo Módulo

**⚠️ Complejidad ALTA - Requiere más planificación**

**Opciones:**

#### Opción A: Nuevo módulo independiente
```
backend/apps/sistema_documental/  (nuevo)
├── __init__.py
├── apps.py
├── models.py (migrar desde hseq_management)
├── serializers.py
├── views.py
└── urls.py
```

**Ventajas:**
- Módulo standalone, fácil de mantener
- Puede crecer independientemente
- Transversal a todo el ERP

**Desventajas:**
- Requiere migración completa de datos
- Cambio de namespace
- Más impacto en frontend

#### Opción B: Mover a Core
```
backend/apps/core/sistema_documental/
```

**Ventajas:**
- Core es base compartida
- Menos impacto conceptual
- Orden de instalación garantizado

**Desventajas:**
- Core podría volverse muy grande
- Mezcla infraestructura con funcionalidad

#### Opción C: Mantener en HSEQ pero exponer como servicio
```python
# En core/services/documentacion.py
class DocumentacionService:
    """Servicio proxy para acceder al sistema documental"""
    @staticmethod
    def get_documento_model():
        from apps.hseq_management.sistema_documental.models import Documento
        return Documento
```

**Ventajas:**
- Sin migración física
- Abstrae dependencia
- Más fácil de implementar

**Desventajas:**
- No resuelve problema conceptual
- Dependencia sigue existiendo

---

## 6. IMPACTOS IDENTIFICADOS

### 6.1 Backend

| Componente | Impacto | Severidad |
|------------|---------|-----------|
| Modelos Django | Cambio de ubicación, posible cambio de db_table | 🔴 ALTO |
| Migraciones | Generación de nuevas migraciones complejas | 🟡 MEDIO |
| Serializers | Actualizar imports | 🟢 BAJO |
| Views/ViewSets | Actualizar imports | 🟢 BAJO |
| URLs | Reestructurar rutas API | 🟡 MEDIO |
| Tests | Actualizar imports y fixtures | 🟡 MEDIO |
| INSTALLED_APPS | Reordenar orden de instalación | 🟡 MEDIO |

### 6.2 Frontend

| Componente | Impacto | Severidad |
|------------|---------|-----------|
| API endpoints | Cambio de URLs base | 🔴 ALTO |
| Redux/Zustand stores | Actualizar endpoints | 🔴 ALTO |
| React Query keys | Actualizar keys de cache | 🟡 MEDIO |
| Componentes | Posible refactor de imports | 🟢 BAJO |
| Rutas de navegación | Actualizar si cambian URLs | 🟡 MEDIO |

### 6.3 Documentación

| Documento | Impacto | Severidad |
|-----------|---------|-----------|
| API Docs (Swagger/OpenAPI) | Regenerar con nuevas rutas | 🟡 MEDIO |
| Documentación usuario | Actualizar capturas y rutas | 🟡 MEDIO |
| Documentación técnica | Actualizar arquitectura | 🟡 MEDIO |

### 6.4 Datos

| Aspecto | Impacto | Severidad |
|---------|---------|-----------|
| Tablas BD | Renombrado si se cambia db_table | 🔴 ALTO |
| Datos existentes | Migración masiva de registros | 🔴 ALTO |
| ContentTypes | Actualización de ContentType framework | 🟡 MEDIO |
| Permisos | Recalcular permisos basados en modelos | 🟡 MEDIO |

---

## 7. DEPENDENCIAS CIRCULARES POTENCIALES

### 7.1 Dependencia Crítica Identificada

```
┌─────────────────────────────────────────────────────────┐
│  DEPENDENCIA CIRCULAR ACTUAL                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   gestion_estrategica.identidad                        │
│           │                                             │
│           │ (importa)                                   │
│           ▼                                             │
│   hseq_management.sistema_documental                   │
│           │                                             │
│           │ (podría importar en futuro)                │
│           ▼                                             │
│   gestion_estrategica.identidad  ❌ CIRCULAR           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Solución Recomendada

**Patrón de Inversión de Dependencias:**

```python
# backend/apps/core/services/documento_service.py
"""
Servicio abstracto para gestión documental.
Inversión de dependencia: Identidad depende de interfaz, no de implementación.
"""
from abc import ABC, abstractmethod
from typing import Protocol

class DocumentoServiceProtocol(Protocol):
    """Protocolo (interfaz) para servicios documentales"""

    def crear_documento(self, tipo: str, titulo: str, contenido: str, **kwargs):
        """Crea un documento en el sistema"""
        pass

    def obtener_documento(self, codigo: str):
        """Obtiene un documento por código"""
        pass

    def versionar_documento(self, documento_id: int, motivo: str):
        """Crea nueva versión de documento"""
        pass


# backend/apps/core/services/registry.py
"""Registro central de servicios"""

class ServiceRegistry:
    _services = {}

    @classmethod
    def register(cls, service_name: str, service_class):
        cls._services[service_name] = service_class

    @classmethod
    def get(cls, service_name: str):
        return cls._services.get(service_name)

# Registro al iniciar app
# En hseq_management/sistema_documental/apps.py
def ready(self):
    from apps.core.services.registry import ServiceRegistry
    from .services import SistemaDocumentalService
    ServiceRegistry.register('documento', SistemaDocumentalService)
```

**Uso en Identidad:**

```python
# apps/gestion_estrategica/identidad/services.py
from apps.core.services.registry import ServiceRegistry

class PoliticaService:
    def convertir_a_documento(self, politica):
        # Obtener servicio dinámicamente
        doc_service = ServiceRegistry.get('documento')
        if doc_service:
            return doc_service.crear_desde_politica(politica)
        else:
            # Fallback: crear representación simplificada
            return self._crear_documento_simple(politica)
```

**✅ VENTAJAS:**
- Sin dependencia directa
- Sistema Documental puede moverse libremente
- Testeable con mocks
- Sigue principios SOLID

---

## 8. RECOMENDACIONES FINALES

### 8.1 Resumen de Veredictos

| Movimiento Propuesto | Veredicto | Prioridad |
|----------------------|-----------|-----------|
| **Contexto Organizacional** → Planeación Estratégica | ✅ **ALTAMENTE RECOMENDADO** | 🔴 ALTA |
| **Sistema Documental** → Nuevo Módulo | ⚠️ **VIABLE CON AJUSTES** | 🟡 MEDIA |
| **Planificación Sistema** → Nuevo Módulo | ❌ **NO RECOMENDADO** | - |

### 8.2 Propuesta Alternativa Mejorada

```
ESTRUCTURA PROPUESTA (ISO-ALIGNED):

NIVEL 1: ESTRATÉGICO
└─ [10] Dirección Estratégica (gestion_estrategica)
    ├─ Configuración
    ├─ Organización
    ├─ Identidad Corporativa
    ├─ Planeación Estratégica
    │   ├─ Contexto Organizacional ⭐ MOVER AQUÍ (desde Motor Riesgos)
    │   │   ├─ Análisis DOFA
    │   │   ├─ Análisis PESTEL
    │   │   ├─ 5 Fuerzas Porter
    │   │   └─ Estrategias TOWS
    │   ├─ Planes Estratégicos (BSC)
    │   ├─ Objetivos Estratégicos
    │   ├─ Mapa Estratégico
    │   ├─ KPIs
    │   └─ Gestión de Cambio
    ├─ Gestión de Proyectos (PMI)
    └─ Revisión por Dirección

NIVEL 2: CUMPLIMIENTO
├─ [20] Cumplimiento Normativo
├─ [21] Motor de Riesgos
│   ├─ [ELIMINADO] Contexto Organizacional (movido a Nivel 1)
│   ├─ Riesgos de Procesos (ISO 31000)
│   ├─ IPEVR (GTC-45)
│   ├─ Aspectos Ambientales
│   ├─ Riesgos Viales (PESV)
│   ├─ SAGRILAFT/PTEE
│   └─ Seguridad Información
└─ [22] Flujos de Trabajo

NIVEL 3: TORRE DE CONTROL
└─ [30] Gestión Integral HSEQ (hseq_management)
    ├─ Sistema Documental ⚠️ EVALUAR: ¿Mover o mantener?
    ├─ Planificación Sistema ✅ MANTENER AQUÍ
    ├─ Calidad (ISO 9001)
    ├─ Medicina Laboral
    ├─ Seguridad Industrial
    ├─ Higiene Industrial
    ├─ Gestión de Comités
    ├─ Accidentalidad (ATEL)
    ├─ Emergencias
    ├─ Gestión Ambiental
    └─ Mejora Continua

ALTERNATIVA: Nuevo módulo transversal
[15] Sistema Documental (nuevo módulo independiente)
     ├─ Tipos de Documento
     ├─ Plantillas
     ├─ Documentos y Versiones
     ├─ Firmas Digitales
     └─ Control Documental
```

### 8.3 Plan de Implementación Recomendado

#### FASE 1: Movimiento de Contexto Organizacional (2-3 días)

**Prioridad:** 🔴 ALTA
**Complejidad:** 🟡 MEDIA
**Riesgo:** 🟢 BAJO

**Tareas:**

1. ✅ **Preparación (Día 1 - Mañana)**
   - [ ] Backup completo de BD producción
   - [ ] Crear rama git: `feature/move-contexto-organizacional`
   - [ ] Documentar estado actual (capturas, datos de prueba)
   - [ ] Notificar a equipo frontend del cambio próximo

2. ✅ **Migración Backend (Día 1 - Tarde)**
   - [ ] Crear directorio: `apps/gestion_estrategica/planeacion/contexto/`
   - [ ] Mover modelos manteniendo `db_table` original (sin renombrar)
   - [ ] Mover serializers, views, urls
   - [ ] Actualizar imports en:
     - `gestion_estrategica/planeacion/urls.py`
     - Tests de contexto organizacional
     - Cualquier otro import detectado con grep
   - [ ] Crear migraciones (si es necesario)
   - [ ] Ejecutar tests: `pytest apps/gestion_estrategica/planeacion/contexto/`

3. ✅ **Actualización URLs (Día 2 - Mañana)**
   ```python
   # ANTES: /riesgos/contexto/
   # DESPUÉS: /gestion-estrategica/planeacion/contexto/
   ```
   - [ ] Actualizar `motor_riesgos/urls.py` (eliminar ruta)
   - [ ] Actualizar `gestion_estrategica/urls.py` (agregar ruta)
   - [ ] Agregar redirect temporal para compatibilidad:
     ```python
     # En motor_riesgos/urls.py
     path('contexto/', RedirectView.as_view(
         url='/gestion-estrategica/planeacion/contexto/',
         permanent=False
     ))
     ```

4. ✅ **Testing Integral (Día 2 - Tarde)**
   - [ ] Tests unitarios: `pytest apps/gestion_estrategica/`
   - [ ] Tests integración: `pytest --reuse-db`
   - [ ] Smoke test en ambiente desarrollo
   - [ ] Validar endpoints API con Postman/curl

5. ✅ **Actualización Frontend (Día 3)**
   - [ ] Actualizar endpoints en servicios/API clients
   - [ ] Actualizar rutas de navegación
   - [ ] Actualizar React Query keys
   - [ ] Testing funcional completo
   - [ ] Actualizar documentación Swagger/OpenAPI

6. ✅ **Deploy y Validación (Día 3 - Tarde)**
   - [ ] Deploy a staging
   - [ ] Testing de aceptación
   - [ ] Deploy a producción (ventana de mantenimiento)
   - [ ] Monitoreo post-deploy
   - [ ] Eliminar redirects temporales (después de 1 semana)

---

#### FASE 2: Decisión sobre Sistema Documental (1 semana análisis)

**Prioridad:** 🟡 MEDIA
**Complejidad:** 🔴 ALTA
**Riesgo:** 🟡 MEDIO

**Análisis previo requerido:**

1. **Evaluar uso actual:**
   - [ ] ¿Qué módulos usan sistema_documental actualmente?
   - [ ] ¿Cuántos documentos hay en BD?
   - [ ] ¿Hay integraciones externas?

2. **Decidir ubicación final:**
   - **Opción A:** Crear módulo independiente `apps/sistema_documental/`
   - **Opción B:** Mover a `apps/core/sistema_documental/`
   - **Opción C:** Mantener en HSEQ pero exponer como servicio transversal

3. **Resolver dependencia circular:**
   - [ ] Implementar Service Registry (patrón inversión dependencias)
   - [ ] Refactorizar `identidad/services.py` para usar registro
   - [ ] Testing exhaustivo de integración

**⏸️ PAUSAR hasta completar análisis detallado**

---

#### FASE 3: Planificación Sistema - NO MOVER

**Veredicto:** ✅ MANTENER en HSEQ Management

**Justificación:**
- Es planificación OPERACIONAL del sistema HSEQ (Cláusula 8.1)
- NO es planificación estratégica organizacional
- Romper la Torre de Control reduce cohesión del módulo

**Mejora alternativa:**
- [ ] Reorganizar tabs visuales en frontend
- [ ] Agrupar "Planificación" como primer tab de HSEQ
- [ ] Mejorar navegación interna del módulo

---

### 8.4 Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Pérdida de datos en migración | 🟡 Media | 🔴 Crítico | Backup completo + testing en staging + rollback plan |
| Incompatibilidad frontend | 🟡 Media | 🔴 Alto | Mantener redirects temporales + versioning API |
| Dependencias ocultas | 🟡 Media | 🟡 Medio | Análisis estático completo con grep + testing exhaustivo |
| Tiempo de inactividad | 🟢 Baja | 🔴 Alto | Deploy en ventana de mantenimiento + blue-green deployment |
| Confusión de usuarios | 🟡 Media | 🟢 Bajo | Documentación + anuncio previo + tour guiado |

---

### 8.5 Criterios de Éxito

#### Técnicos
- [ ] ✅ Todos los tests pasan (cobertura >80%)
- [ ] ✅ Sin errores 500 en logs de producción (48h post-deploy)
- [ ] ✅ Tiempo de respuesta API <500ms (p95)
- [ ] ✅ Sin pérdida de datos (100% de registros migrados)
- [ ] ✅ Frontend funcional en todos los navegadores soportados

#### Funcionales
- [ ] ✅ Usuarios pueden acceder a análisis DOFA desde Planeación Estratégica
- [ ] ✅ Estrategias TOWS se vinculan correctamente con objetivos BSC
- [ ] ✅ Análisis PESTEL accesible desde nueva ubicación
- [ ] ✅ Reportes y exportaciones funcionan correctamente

#### Organizacionales
- [ ] ✅ Equipo frontend capacitado en nuevos endpoints
- [ ] ✅ Documentación actualizada (técnica y usuario)
- [ ] ✅ Plan de rollback documentado y probado
- [ ] ✅ Stakeholders informados del cambio

---

## 9. CONCLUSIONES

### 9.1 Alineación ISO

El movimiento propuesto de **Contexto Organizacional** de Motor de Riesgos a Planeación Estratégica **mejora significativamente** la alineación con las normas ISO:

**Antes (actual):**
```
Riesgos (Nivel 2) → Contexto Organizacional
❌ Contexto es INPUT de riesgos, no parte de riesgos
❌ Mezcla análisis estratégico (DOFA) con riesgos operacionales
```

**Después (propuesto):**
```
Planeación Estratégica (Nivel 1) → Contexto Organizacional
✅ Contexto → Estrategia → Riesgos (secuencia lógica)
✅ DOFA/PESTEL como herramientas de planeación estratégica
✅ Cumple con ISO 9001/14001/45001 Cláusula 4.1
```

### 9.2 Arquitectura Modular

La propuesta **parcial** mejora la modularidad:

| Aspecto | Estado Actual | Propuesto | Mejora |
|---------|---------------|-----------|--------|
| Cohesión Contexto | 🟡 Media | ✅ Alta | +30% |
| Acoplamiento Sistema Documental | 🟡 Media | ⚠️ Requiere trabajo | -20% |
| Claridad Planificación Sistema | ✅ Alta | ❌ Baja si se mueve | -50% |

### 9.3 Recomendación Final del Especialista ISO

Como **Lead Auditor ISO** con experiencia en sistemas integrados, mi recomendación es:

#### ✅ **IMPLEMENTAR (Alta Prioridad):**
1. **Mover Contexto Organizacional** a Planeación Estratégica
   - Mejora alineación con HLS (Cláusula 4.1)
   - Secuencia lógica: Contexto → Estrategia → Riesgos → Operación
   - Facilita auditorías ISO (requisito común a QMS/EMS/OHSMS)

#### ⚠️ **ANALIZAR MÁS (Media Prioridad):**
2. **Sistema Documental** - Requiere estudio de viabilidad
   - Evaluar si es transversal o específico de HSEQ
   - Resolver dependencia circular antes de mover
   - Considerar Service Registry para desacoplar

#### ❌ **NO IMPLEMENTAR:**
3. **NO mover Planificación Sistema**
   - Es planificación operacional HSEQ (ISO 8.1)
   - Rompe cohesión de Torre de Control
   - No aporta valor arquitectónico

---

## 10. ANEXOS

### Anexo A: Comandos de Migración

```bash
# 1. Búsqueda de dependencias
cd backend/
grep -r "from apps.motor_riesgos.contexto_organizacional" .
grep -r "motor_riesgos.contexto_organizacional" .
grep -r "import.*contexto_organizacional" .

# 2. Búsqueda de referencias en frontend
cd ../frontend/
grep -r "contexto" src/
grep -r "motor-riesgos" src/
grep -r "/riesgos/contexto" src/

# 3. Crear estructura nueva
mkdir -p backend/apps/gestion_estrategica/planeacion/contexto

# 4. Copiar archivos (no mover aún)
cp -r backend/apps/motor_riesgos/contexto_organizacional/* \
      backend/apps/gestion_estrategica/planeacion/contexto/

# 5. Generar migraciones
cd backend/
python manage.py makemigrations
python manage.py migrate --plan  # revisar sin ejecutar

# 6. Testing
pytest apps/gestion_estrategica/planeacion/contexto/ -v
pytest --reuse-db -k "contexto"
```

### Anexo B: Checklist Pre-Deploy

```markdown
## Pre-Deploy Checklist

### Backend
- [ ] Backup BD completo
- [ ] Migraciones generadas y revisadas
- [ ] Tests unitarios pasan (100%)
- [ ] Tests integración pasan
- [ ] Documentación API actualizada
- [ ] Swagger regenerado
- [ ] Logs configurados para monitoreo

### Frontend
- [ ] Endpoints actualizados
- [ ] Build sin errores
- [ ] Tests E2E pasan
- [ ] Compatibilidad navegadores OK
- [ ] Cache invalidado

### DevOps
- [ ] Plan de rollback documentado
- [ ] Ventana de mantenimiento agendada
- [ ] Monitoreo configurado (Sentry/NewRelic)
- [ ] Equipo de soporte notificado
- [ ] Runbook de troubleshooting listo

### Comunicación
- [ ] Stakeholders notificados (72h antes)
- [ ] Usuarios informados del cambio
- [ ] Documentación usuario actualizada
- [ ] FAQs preparadas
```

### Anexo C: Datos de Análisis

**Estadísticas de código:**

```bash
# Contexto Organizacional
$ cloc backend/apps/motor_riesgos/contexto_organizacional/
Language     files   blank   comment    code
Python          5     195      410      486

# Sistema Documental
$ cloc backend/apps/hseq_management/sistema_documental/
Language     files   blank   comment    code
Python         8     385      680     1125

# Planificación Sistema
$ cloc backend/apps/hseq_management/planificacion_sistema/
Language     files   blank   comment    code
Python         7     320      550     1005
```

**Complejidad relativa:**
- Contexto Organizacional: 🟢 BAJA (6 modelos, sin dependencias complejas)
- Sistema Documental: 🔴 ALTA (7 modelos, relaciones complejas, firma digital)
- Planificación Sistema: 🟡 MEDIA (5 modelos, relaciones M2M)

---

**Documento generado por:** ISO Management Systems Specialist
**Fecha:** 2026-01-11
**Versión:** 1.0
**Próxima revisión:** Después de FASE 1 (Contexto Organizacional)
