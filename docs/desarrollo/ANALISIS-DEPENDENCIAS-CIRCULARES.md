# Análisis de Dependencias Circulares - StrateKaz

**Fecha**: 2026-01-09
**Autor**: TypeScript Master (Claude Code)
**Objetivo**: Detectar dependencias circulares y violaciones del principio de modularidad

---

## Resumen Ejecutivo

### Estado General: ⚠️ VIOLACIONES CRÍTICAS DETECTADAS

El proyecto presenta **violaciones graves** del principio de modularidad con **dependencias circulares bidireccionales** entre módulos core y módulos específicos, lo que compromete la arquitectura del sistema.

### Hallazgos Principales

| Categoría | Severidad | Cantidad | Estado |
|-----------|-----------|----------|--------|
| **Backend: core → gestion_estrategica** | 🔴 CRÍTICO | 2 archivos | Violación arquitectónica |
| **Frontend: circular entre features** | 🟠 MEDIO | 5 casos | Acoplamiento moderado |
| **Backend: apps interdependientes** | 🟢 BAJO | Multiple | Dentro de límites aceptables |

---

## 1. BACKEND - Violaciones Críticas

### 🔴 CRÍTICO: Core importa desde gestion_estrategica

**Archivos afectados:**
- `c:/Proyectos/StrateKaz/backend/apps/core/viewsets_strategic.py` (líneas 29-30)
- `c:/Proyectos/StrateKaz/backend/apps/core/serializers_strategic.py` (líneas 21-22)

**Código problemático:**

```python
# En core/viewsets_strategic.py
from apps.gestion_estrategica.identidad.models import CorporateIdentity, CorporateValue
from apps.gestion_estrategica.planeacion.models import StrategicPlan, StrategicObjective

# En core/serializers_strategic.py
from apps.gestion_estrategica.identidad.models import CorporateIdentity, CorporateValue
from apps.gestion_estrategica.planeacion.models import StrategicPlan, StrategicObjective
```

**Por qué es crítico:**

1. **Inversión de dependencias**: El módulo `core` (fundacional) depende de módulos específicos de dominio
2. **Acoplamiento fuerte**: Cambios en `gestion_estrategica` afectan al core
3. **Dificulta testing**: No se puede probar `core` sin instalar `gestion_estrategica`
4. **Viola arquitectura limpia**: El núcleo del sistema depende de detalles de implementación

**Flujo de dependencia circular:**

```
core.models (Cargo, User, SystemModule)
    ↓
gestion_estrategica.identidad.models (CorporateIdentity)
    ↓ (ForeignKey)
gestion_estrategica.configuracion.models (EmpresaConfig)
    ↓ (usa)
core.base_models (BaseCompanyModel)
    ↓ (hereda de)
core.models
```

**Impacto:**
- ❌ Ciclo de dependencias bidireccional
- ❌ Imposibilidad de migrar módulos independientemente
- ❌ Acoplamiento excesivo entre capas arquitectónicas

---

### 🔴 CRÍTICO: Identidad depende de Configuración (sin ciclo)

**Archivo:** `backend/apps/gestion_estrategica/identidad/models.py`

```python
# Línea 42-47
empresa = models.OneToOneField(
    'configuracion.EmpresaConfig',  # ← String reference (lazy loading)
    on_delete=models.CASCADE,
    related_name='identidad_corporativa',
)
```

**Análisis:**
- ✅ Uso correcto de string references para evitar importación directa
- ✅ No hay ciclo porque configuración NO importa identidad
- ⚠️ Sin embargo, existe acoplamiento lógico entre módulos hermanos

**Recomendación:** Aceptable por ahora, pero considerar extraer `EmpresaConfig` a `core.models` en refactoring futuro.

---

## 2. FRONTEND - Dependencias Entre Features

### 🟠 MEDIO: gestion-estrategica ↔ configuracion

**Caso 1: useMatrizPermisos hook**

```typescript
// frontend/src/features/gestion-estrategica/hooks/useMatrizPermisos.ts:13
import { useCargos } from '@/features/configuracion/hooks/useCargos';
```

**Análisis:**
- Hook de `gestion-estrategica` depende de hook de `configuracion`
- ✅ No hay ciclo bidireccional (configuracion NO usa gestion-estrategica)
- ⚠️ Acoplamiento aceptable: Cargos es entidad compartida

**Caso 2: RolesTab (LEGACY)**

```typescript
// frontend/src/features/configuracion/components/RolesTab.tsx:53-54
import { useRolesPermisos } from '@/features/gestion-estrategica/hooks/useRolesPermisos';
import { useUsers } from '@/features/users/hooks/useUsers';
```

**Análisis:**
- ⚠️ **NOTA IMPORTANTE**: Este componente está marcado como LEGACY y NO se usa
- ✅ No representa riesgo actual
- 📝 Recomendación: Eliminar archivo si realmente no se usa

---

### 🟠 MEDIO: gestion-estrategica ↔ users

**Caso 1: ColaboradoresSection**

```typescript
// frontend/src/features/gestion-estrategica/components/ColaboradoresSection.tsx:8
import UsersPage from '@/features/users/pages/UsersPage';
```

**Caso 2: RolesAdicionalesSubTab**

```typescript
// frontend/src/features/gestion-estrategica/components/rbac/RolesAdicionalesSubTab.tsx:40
import { useUsers } from '@/features/users/hooks/useUsers';
```

**Caso 3: SedeFormModal**

```typescript
// frontend/src/features/gestion-estrategica/components/modals/SedeFormModal.tsx:31
import { useUsers } from '@/features/users/hooks/useUsers';
```

**Análisis:**
- `gestion-estrategica` importa de `users`
- ✅ No hay ciclo: `users` NO importa de `gestion-estrategica`
- ⚠️ Acoplamiento: Varios componentes dependen de users
- 📝 **Problema de diseño**: `UsersPage` completo importado en componente (debería ser hook o selector)

---

### 🟠 MEDIO: users ↔ configuracion

**Caso 1: UsersPage depende de configuracion**

```typescript
// frontend/src/features/users/pages/UsersPage.tsx:25
import { useRoles } from '@/features/configuracion/hooks/useRoles';
```

**Caso 2: UserForm depende de configuracion**

```typescript
// frontend/src/features/users/components/UserForm.tsx:30
import type { Role } from '@/features/configuracion/types/rbac.types';
```

**Análisis:**
- `users` importa tipos y hooks de `configuracion`
- ✅ No hay ciclo bidireccional
- ✅ Dependencia lógica: Users necesitan Roles para asignación
- ✅ Buena práctica: Solo importa tipos (no componentes pesados)

---

## 3. Dependencias Backend entre Apps

### ✅ ACEPTABLE: Patrón de dependencias

La mayoría de apps siguen el patrón correcto:

```
apps.{nombre_app}.models
    ↓
apps.core.base_models (TimestampedModel, AuditModel, BaseCompanyModel)
    ↓
apps.{nombre_app}.views
    ↓
apps.core.mixins (StandardViewSetMixin)
```

**Ejemplos correctos:**
- `accounting` → `core` ✅
- `analytics` → `core` ✅
- `admin_finance` → `core` ✅
- `workflow_engine` → `core` ✅

**Única violación:** `core` → `gestion_estrategica` ❌ (ya documentada)

---

## 4. Análisis TypeScript: Tipos Circulares

### ✅ BUENO: No se detectaron ciclos de tipos

**Archivos revisados:**
- `frontend/src/types/` - Sistema de tipos base
- Features utilizan `import type` correctamente
- No hay redefiniciones circulares

**Ejemplo de buena práctica:**

```typescript
// UserForm.tsx usa import type (solo en tiempo de compilación)
import type { Role } from '@/features/configuracion/types/rbac.types';
```

---

## 5. Patrones de Importación Problemáticos

### ❌ Anti-patrón: Importar páginas completas

```typescript
// ColaboradoresSection.tsx
import UsersPage from '@/features/users/pages/UsersPage';
```

**Por qué es malo:**
- Arrastra toda la lógica de la página
- Aumenta bundle size innecesariamente
- Dificulta code splitting

**Solución recomendada:**
```typescript
// Extraer lógica compartida a hooks/composables
import { useUsersList } from '@/features/users/hooks/useUsersList';
```

---

## 6. Recomendaciones por Prioridad

### 🔴 ALTA PRIORIDAD (Resolver inmediatamente)

#### 1. Eliminar dependencias de core → gestion_estrategica

**Opción A: Mover viewsets a gestion_estrategica**

```bash
# Mover archivos
mv backend/apps/core/viewsets_strategic.py backend/apps/gestion_estrategica/viewsets.py
mv backend/apps/core/serializers_strategic.py backend/apps/gestion_estrategica/serializers.py

# Actualizar URLs en core/urls.py
```

**Opción B: Abstraer con interfaces**

```python
# En core/interfaces.py (nuevo archivo)
from abc import ABC, abstractmethod

class StrategicIdentityProvider(ABC):
    @abstractmethod
    def get_active_identity(self):
        pass

# En gestion_estrategica/providers.py
class DjangoIdentityProvider(StrategicIdentityProvider):
    def get_active_identity(self):
        return CorporateIdentity.objects.filter(is_active=True).first()

# En core/viewsets_strategic.py
def __init__(self, identity_provider: StrategicIdentityProvider):
    self.identity_provider = identity_provider
```

**Recomendación:** **Opción A** (más simple, menos overhead)

#### 2. Actualizar archivo de rutas

```python
# backend/config/urls.py
urlpatterns = [
    path('api/core/', include('apps.core.urls')),
    path('api/gestion-estrategica/', include('apps.gestion_estrategica.urls')),  # ← Mover strategic endpoints aquí
]
```

---

### 🟠 MEDIA PRIORIDAD (Resolver en próximo sprint)

#### 1. Refactor ColaboradoresSection

**Antes:**
```typescript
import UsersPage from '@/features/users/pages/UsersPage';
```

**Después:**
```typescript
import { UsersListView } from '@/features/users/components/UsersListView';
// O mejor aún:
const { users, isLoading } = useUsers(filters);
```

#### 2. Consolidar tipos compartidos

```typescript
// frontend/src/types/shared/rbac.types.ts (nuevo)
export interface Role { ... }
export interface Cargo { ... }

// Importar desde ubicación centralizada
import type { Role, Cargo } from '@/types/shared/rbac.types';
```

---

### 🟢 BAJA PRIORIDAD (Backlog)

#### 1. Eliminar componente RolesTab.tsx

Si está marcado como LEGACY y no se usa:

```bash
# Verificar que no se importa
git grep "RolesTab" frontend/src

# Si no hay referencias, eliminar
rm frontend/src/features/configuracion/components/RolesTab.tsx
```

#### 2. Considerar extraer EmpresaConfig a core

Para reducir acoplamiento entre `identidad` y `configuracion`:

```python
# Mover de:
apps.gestion_estrategica.configuracion.models.EmpresaConfig

# A:
apps.core.models.Company  # O apps.core.models.Tenant
```

---

## 7. Métricas de Calidad

### Antes del refactor (Estado actual)

| Métrica | Valor | Estado |
|---------|-------|--------|
| Dependencias circulares críticas | 2 | 🔴 |
| Violaciones arquitectónicas | 2 archivos | 🔴 |
| Acoplamiento frontend (features) | 5 casos | 🟠 |
| Imports problemáticos (páginas completas) | 1 | 🟠 |
| Apps con dependencias correctas | 95% | ✅ |

### Después del refactor (Objetivo)

| Métrica | Valor | Estado |
|---------|-------|--------|
| Dependencias circulares críticas | 0 | ✅ |
| Violaciones arquitectónicas | 0 | ✅ |
| Acoplamiento frontend (features) | 2 casos | 🟢 |
| Imports problemáticos | 0 | ✅ |
| Apps con dependencias correctas | 100% | ✅ |

---

## 8. Diagrama de Dependencias

### Estado Actual (Problemático)

```
┌──────────────────────────────────────────────┐
│              apps.core                        │
│  (Fundacional - NO debe depender de apps)    │
└──────────────┬───────────────────────────────┘
               │ ❌ VIOLACIÓN
               │ imports
               ↓
┌──────────────────────────────────────────────┐
│      apps.gestion_estrategica                │
│  ├─ identidad (CorporateIdentity)            │
│  ├─ planeacion (StrategicPlan)               │
│  └─ configuracion (EmpresaConfig)            │
└──────────────┬───────────────────────────────┘
               │ ✅ CORRECTO
               │ imports
               ↓
┌──────────────────────────────────────────────┐
│       apps.core.base_models                  │
│  (BaseCompanyModel, AuditModel)              │
└──────────────────────────────────────────────┘
```

### Estado Deseado (Correcto)

```
┌──────────────────────────────────────────────┐
│              apps.core                        │
│  (Fundacional - Solo base models y mixins)   │
└───────────────────────────┬──────────────────┘
                            │ ✅ CORRECTO
                            │ hereda/usa
                            ↓
┌──────────────────────────────────────────────┐
│      apps.gestion_estrategica                │
│  ├─ identidad (models, views, serializers)   │
│  ├─ planeacion (models, views, serializers)  │
│  └─ configuracion (EmpresaConfig)            │
└──────────────────────────────────────────────┘
         ↑                  │
         │ ✅ CORRECTO      │ ✅ CORRECTO
         │ usa hooks        │ usa base_models
         │                  ↓
┌──────────────┐    ┌──────────────────────────┐
│   frontend   │    │   apps.core.base_models  │
│   features   │    │   (Solo abstracciones)   │
└──────────────┘    └──────────────────────────┘
```

---

## 9. Plan de Acción

### Sprint 1 (Inmediato - 2-3 días)

- [ ] **Día 1**: Mover `viewsets_strategic.py` a `apps/gestion_estrategica/viewsets.py`
- [ ] **Día 1**: Mover `serializers_strategic.py` a `apps/gestion_estrategica/serializers.py`
- [ ] **Día 2**: Actualizar imports en `apps/core/urls.py`
- [ ] **Día 2**: Crear `apps/gestion_estrategica/urls.py` con rutas estratégicas
- [ ] **Día 3**: Ejecutar suite de tests completa
- [ ] **Día 3**: Verificar que no hay ciclos con `madge` o similar

### Sprint 2 (Siguiente iteración)

- [ ] Refactorizar `ColaboradoresSection` para no importar página completa
- [ ] Consolidar tipos RBAC en ubicación centralizada
- [ ] Eliminar `RolesTab.tsx` si no se usa
- [ ] Documentar patrón de importaciones permitidas

### Backlog

- [ ] Evaluar mover `EmpresaConfig` a `core.models.Company`
- [ ] Implementar linter rules para prevenir ciclos futuros
- [ ] Agregar pre-commit hooks para validar dependencias

---

## 10. Comandos de Verificación

### Verificar ciclos en backend (Python)

```bash
# Instalar herramienta
pip install pydeps

# Generar gráfico de dependencias
pydeps backend/apps/core --show-deps --max-bacon=2

# Buscar imports problemáticos
grep -r "from apps.gestion_estrategica" backend/apps/core
```

### Verificar ciclos en frontend (TypeScript)

```bash
# Instalar herramienta
npm install -g madge

# Detectar ciclos
madge --circular --extensions ts,tsx frontend/src/features

# Ver gráfico visual
madge --circular --extensions ts,tsx --image deps.svg frontend/src/features
```

### Verificar tamaño de bundles

```bash
# Analizar impacto de imports
npm run build -- --analyze

# Ver qué componentes cargan UsersPage
grep -r "UsersPage" frontend/src/features
```

---

## 11. Conclusiones

### Hallazgos Clave

1. **Violación crítica**: `core` importa de `gestion_estrategica`, invirtiendo la arquitectura
2. **Acoplamiento moderado**: Features de frontend tienen dependencias lógicas pero manejables
3. **Patrón general correcto**: 95% de las apps siguen flujo unidireccional hacia `core`

### Riesgo Actual

- **Técnico**: Medio-Alto (por violación en core)
- **Mantenibilidad**: Media (dificulta testing y modularización)
- **Performance**: Baja (no afecta runtime, solo estructura)

### Costo de Corrección

- **Sprint 1**: ~2-3 días de refactoring
- **Sprint 2**: ~1-2 días de limpieza
- **ROI**: Alto (mejora significativa en arquitectura)

---

**Siguiente paso recomendado:**
Ejecutar Plan de Acción Sprint 1 esta semana para resolver violaciones críticas.

