# Resumen Ejecutivo: Dependencias Circulares

**Fecha**: 2026-01-09
**Estado**: ⚠️ VIOLACIONES CRÍTICAS DETECTADAS

---

## Hallazgos Principales

### 🔴 Backend: Violaciones Críticas en `core`

**Archivos afectados: 4 activos**

```
backend/apps/core/serializers_strategic.py
backend/apps/core/viewsets_strategic.py
backend/apps/core/viewsets_rbac.py
backend/apps/core/tests/ (3 archivos)
```

**Impacto:**
- ❌ Core depende de `gestion_estrategica` (inversión arquitectónica)
- ❌ Imposible testear `core` sin instalar apps de dominio
- ❌ Dificulta migraciones independientes

**Líneas de código afectadas:**

```python
# serializers_strategic.py - Líneas 21-22
from apps.gestion_estrategica.identidad.models import CorporateIdentity, CorporateValue
from apps.gestion_estrategica.planeacion.models import StrategicPlan, StrategicObjective

# viewsets_strategic.py - Líneas 29-30
from apps.gestion_estrategica.identidad.models import CorporateIdentity, CorporateValue
from apps.gestion_estrategica.planeacion.models import StrategicPlan, StrategicObjective

# viewsets_rbac.py - Líneas dinámicas
from apps.gestion_estrategica.organizacion.models import Area as AreaModel

# tests/ - 3 archivos test usan Area
from apps.gestion_estrategica.organizacion.models import Area
```

---

### 🟠 Frontend: Dependencias entre Features

**Casos detectados: 3**

1. **gestion-estrategica → configuracion** (2 imports)
   ```typescript
   // useMatrizPermisos.ts:13
   import { useCargos } from '@/features/configuracion/hooks/useCargos';
   ```

2. **gestion-estrategica → users** (1 import problemático)
   ```typescript
   // ColaboradoresSection.tsx:8
   import UsersPage from '@/features/users/pages/UsersPage';
   ```

3. **users → configuracion** (2 imports - aceptable)
   ```typescript
   // UsersPage.tsx:25
   import { useRoles } from '@/features/configuracion/hooks/useRoles';
   ```

**Impacto:**
- ⚠️ Acoplamiento moderado
- ⚠️ Import de página completa aumenta bundle size

---

## Métricas

| Categoría | Cantidad | Severidad |
|-----------|----------|-----------|
| Violaciones core → apps | **4 archivos** | 🔴 CRÍTICO |
| Imports entre features | **3 casos** | 🟠 MEDIO |
| Imports de páginas completas | **1 caso** | 🟠 MEDIO |
| Apps con flujo correcto | **14/15 (93%)** | ✅ BUENO |

---

## Solución Rápida (2-3 días)

### Paso 1: Mover ViewSets Estratégicos

```bash
# Mover archivos
mv backend/apps/core/viewsets_strategic.py \
   backend/apps/gestion_estrategica/viewsets.py

mv backend/apps/core/serializers_strategic.py \
   backend/apps/gestion_estrategica/serializers.py
```

### Paso 2: Actualizar URLs

```python
# backend/config/urls.py
urlpatterns = [
    path('api/core/', include('apps.core.urls')),  # Remover strategic endpoints
    path('api/gestion-estrategica/', include('apps.gestion_estrategica.urls')),  # Agregar aquí
]

# Crear backend/apps/gestion_estrategica/urls.py
from .viewsets import CorporateIdentityViewSet, StrategicPlanViewSet
# ... registrar ViewSets
```

### Paso 3: Fix viewsets_rbac.py

```python
# Opción A: Lazy import (rápido)
def get_areas(self):
    from apps.gestion_estrategica.organizacion.models import Area
    return Area.objects.all()

# Opción B: Abstraer con signal/interface (mejor)
# (Ver doc completa para detalles)
```

### Paso 4: Refactor ColaboradoresSection

```typescript
// Antes
import UsersPage from '@/features/users/pages/UsersPage';

// Después
import { UsersListView } from '@/features/users/components/UsersListView';
// O usar hook directamente
const { users, isLoading } = useUsers(filters);
```

---

## Verificación Post-Fix

```bash
# Backend
grep -r "from apps\.gestion_estrategica" backend/apps/core/ --include="*.py"
# Debe retornar: vacío (0 resultados)

# Frontend
grep -r "from.*pages/.*Page" frontend/src/features --include="*.tsx"
# Debe retornar: vacío (0 resultados)

# Ejecutar tests
python backend/manage.py test apps.core
npm run test -- features/gestion-estrategica
```

---

## Impacto del Fix

### Antes
```
┌─────────────┐
│    core     │ ← ❌ importa
└──────┬──────┘    de apps
       ↓
┌─────────────┐
│ gestion_    │
│ estrategica │
└─────────────┘
```

### Después
```
┌─────────────┐
│    core     │ ← ✅ solo base
└─────────────┘    models/mixins
       ↑
       │ usa
┌─────────────┐
│ gestion_    │
│ estrategica │
└─────────────┘
```

---

## Próximos Pasos

1. ✅ **Leer**: `docs/ANALISIS-DEPENDENCIAS-CIRCULARES.md` (análisis completo)
2. 🔧 **Ejecutar**: Plan de Acción Sprint 1 (2-3 días)
3. ✅ **Verificar**: Ejecutar scripts de verificación
4. 📝 **Documentar**: Actualizar guía de arquitectura

---

## Recursos

- **Análisis completo**: `docs/ANALISIS-DEPENDENCIAS-CIRCULARES.md`
- **Script verificación**: `scripts/check-circular-deps.sh` o `.ps1`
- **Contacto**: Equipo de Arquitectura

---

**Prioridad**: 🔴 ALTA
**Esfuerzo estimado**: 2-3 días
**ROI**: Alto (mejora arquitectura y mantenibilidad)

