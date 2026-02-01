# Checklist: Refactor de Dependencias Circulares

**Sprint**: 1-2 (2-4 días)
**Prioridad**: 🔴 CRÍTICA
**Asignado a**: ___________________

---

## 📋 Pre-requisitos

- [ ] Leer `docs/ANALISIS-DEPENDENCIAS-CIRCULARES.md`
- [ ] Leer `docs/RESUMEN-DEPENDENCIAS-CIRCULARES.md`
- [ ] Crear backup del repositorio
- [ ] Crear rama: `git checkout -b refactor/fix-circular-dependencies`
- [ ] Asegurar que todos los tests pasan actualmente

```bash
# Backend
python backend/manage.py test apps.core
python backend/manage.py test apps.gestion_estrategica

# Frontend
npm run test -- --run
```

---

## 🔴 Fase 1: Backend - Mover ViewSets Estratégicos (Día 1)

### 1.1 Crear estructura en gestion_estrategica

- [ ] Crear `backend/apps/gestion_estrategica/urls.py`
- [ ] Crear `backend/apps/gestion_estrategica/viewsets.py` (vacío)
- [ ] Crear `backend/apps/gestion_estrategica/serializers.py` (vacío)

### 1.2 Mover código de viewsets_strategic.py

- [ ] Copiar contenido de `core/viewsets_strategic.py` a `gestion_estrategica/viewsets.py`
- [ ] Actualizar imports relativos (eliminar `apps.gestion_estrategica.` → usar `.`)

```python
# Antes (en core)
from apps.gestion_estrategica.identidad.models import CorporateIdentity

# Después (en gestion_estrategica)
from .identidad.models import CorporateIdentity
```

- [ ] Verificar que no hay otros imports de `apps.core` que necesiten ajustes
- [ ] Eliminar código movido de `core/viewsets_strategic.py`
- [ ] Agregar deprecation notice en `core/viewsets_strategic.py`

```python
# core/viewsets_strategic.py
"""
DEPRECATED: Este módulo ha sido movido a apps.gestion_estrategica.viewsets
Los imports seguirán funcionando temporalmente para compatibilidad.
"""
from apps.gestion_estrategica.viewsets import (
    CorporateIdentityViewSet,
    StrategicPlanViewSet,
    # ... otros exports
)
```

### 1.3 Mover código de serializers_strategic.py

- [ ] Copiar contenido de `core/serializers_strategic.py` a `gestion_estrategica/serializers.py`
- [ ] Actualizar imports relativos
- [ ] Eliminar código movido de `core/serializers_strategic.py`
- [ ] Agregar deprecation notice

### 1.4 Actualizar URLs

- [ ] Editar `backend/apps/gestion_estrategica/urls.py`

```python
from rest_framework.routers import DefaultRouter
from .viewsets import (
    CorporateIdentityViewSet,
    CorporateValueViewSet,
    StrategicPlanViewSet,
    StrategicObjectiveViewSet,
    StrategicStatsViewSet,
)

router = DefaultRouter()
router.register(r'corporate-identity', CorporateIdentityViewSet, basename='corporate-identity')
router.register(r'corporate-values', CorporateValueViewSet, basename='corporate-values')
router.register(r'strategic-plans', StrategicPlanViewSet, basename='strategic-plans')
router.register(r'strategic-objectives', StrategicObjectiveViewSet, basename='strategic-objectives')
router.register(r'strategic', StrategicStatsViewSet, basename='strategic')

urlpatterns = router.urls
```

- [ ] Editar `backend/config/urls.py`

```python
urlpatterns = [
    # ... otras rutas
    path('api/gestion-estrategica/', include('apps.gestion_estrategica.urls')),
]
```

- [ ] Actualizar `backend/apps/core/urls.py` (remover strategic endpoints)

### 1.5 Tests

- [ ] Ejecutar tests de core: `python manage.py test apps.core`
- [ ] Ejecutar tests de gestion_estrategica: `python manage.py test apps.gestion_estrategica`
- [ ] Verificar que endpoints responden en nueva ruta:

```bash
# Verificar que APIs funcionan
curl http://localhost:8000/api/gestion-estrategica/corporate-identity/
curl http://localhost:8000/api/gestion-estrategica/strategic-plans/
```

- [ ] Ejecutar suite completa: `python manage.py test`

---

## 🟠 Fase 2: Backend - Fix viewsets_rbac.py (Día 1)

### 2.1 Refactor lazy imports en viewsets_rbac.py

- [ ] Localizar imports de `Area` en `core/viewsets_rbac.py`
- [ ] Convertir a lazy imports dentro de métodos

```python
# Antes (líneas 29-30)
from apps.gestion_estrategica.organizacion.models import Area as AreaModel

# Después (dentro del método que usa Area)
def get_areas(self, request):
    from apps.gestion_estrategica.organizacion.models import Area as AreaModel
    areas = AreaModel.objects.filter(is_active=True)
    # ... resto del código
```

- [ ] Verificar que no rompe funcionalidad
- [ ] Ejecutar tests de RBAC: `python manage.py test apps.core.tests.test_rbac`

### 2.2 Considerar abstracciones (Opcional - Si hay tiempo)

Si el lazy import afecta performance o claridad, considerar:

- [ ] Crear `apps.core.interfaces.OrganizationProvider`
- [ ] Implementar en `apps.gestion_estrategica.organizacion.providers.AreaProvider`
- [ ] Inyectar vía settings o factory

*Nota: Este paso es opcional y puede posponerse si el lazy import funciona bien*

---

## 🟠 Fase 3: Backend - Fix Tests (Día 2)

### 3.1 Actualizar imports en tests

- [ ] `backend/apps/core/tests/test_rbac.py`

```python
# Cambiar
from apps.gestion_estrategica.organizacion.models import Area

# Por (lazy import en fixture)
@pytest.fixture
def area_instance():
    from apps.gestion_estrategica.organizacion.models import Area
    return Area.objects.create(...)
```

- [ ] `backend/apps/core/tests/test_cargo.py`
- [ ] `backend/apps/core/tests/test_permissions_api.py`

### 3.2 Verificar tests pasan

- [ ] Ejecutar tests modificados
- [ ] Verificar cobertura no disminuyó

---

## 🟡 Fase 4: Frontend - Fix ColaboradoresSection (Día 2)

### 4.1 Opción A: Extraer componente (Recomendado)

- [ ] Crear `frontend/src/features/users/components/UsersListView.tsx`

```typescript
// Exportar vista sin lógica de página completa
export const UsersListView: React.FC<UsersListViewProps> = ({ filters, onUserSelect }) => {
  const { data, isLoading } = useUsers(filters);
  // ... renderizar solo tabla/lista
};
```

- [ ] Actualizar `ColaboradoresSection.tsx`

```typescript
import { UsersListView } from '@/features/users/components/UsersListView';
```

### 4.2 Opción B: Usar hook directamente (Más simple)

- [ ] Actualizar `ColaboradoresSection.tsx` para usar `useUsers` hook

```typescript
import { useUsers } from '@/features/users/hooks/useUsers';

const ColaboradoresSection = () => {
  const { data: usersData, isLoading } = useUsers(filters);
  // ... renderizar tabla local
};
```

### 4.3 Tests

- [ ] Ejecutar tests de componente
- [ ] Verificar bundle size no aumentó: `npm run build -- --analyze`

---

## 🟢 Fase 5: Verificación Final (Día 3)

### 5.1 Backend

- [ ] Verificar no hay imports problemáticos

```bash
grep -r "from apps\.gestion_estrategica" backend/apps/core/ --include="*.py" | grep -v "test" | grep -v "__pycache__"
# Resultado esperado: vacío (solo comentarios deprecated)
```

- [ ] Ejecutar suite completa de tests

```bash
python backend/manage.py test
```

- [ ] Verificar migraciones están OK

```bash
python backend/manage.py makemigrations --check --dry-run
```

### 5.2 Frontend

- [ ] Verificar no hay imports de páginas

```bash
grep -r "from.*pages/.*Page" frontend/src/features --include="*.tsx" | grep -v "index.ts"
# Resultado esperado: vacío
```

- [ ] Ejecutar suite de tests

```bash
npm run test -- --run
```

- [ ] Verificar build pasa

```bash
npm run build
```

### 5.3 Integración

- [ ] Levantar ambiente completo

```bash
# Backend
python backend/manage.py runserver

# Frontend
npm run dev
```

- [ ] Verificar funcionalidades clave:
  - [ ] Login/logout
  - [ ] CRUD de usuarios
  - [ ] Gestión estratégica (identidad, planeación)
  - [ ] Matriz de permisos
  - [ ] Dashboard

### 5.4 Documentación

- [ ] Actualizar `docs/ANALISIS-DEPENDENCIAS-CIRCULARES.md` con estado "RESUELTO"
- [ ] Documentar cambios en `CHANGELOG.md`

```markdown
### [Unreleased] - 2026-01-XX

#### Changed
- **[BREAKING]** Movidos viewsets estratégicos de `apps.core` a `apps.gestion_estrategica`
  - Endpoints ahora en: `/api/gestion-estrategica/` (antes `/api/core/`)
  - Imports deprecados en `core.viewsets_strategic` redirigen automáticamente
- Refactorizado `ColaboradoresSection` para no importar `UsersPage` completo

#### Fixed
- Eliminadas dependencias circulares entre `core` y `gestion_estrategica`
- Reducido bundle size del frontend al evitar imports de páginas completas
```

---

## 📊 Métricas de Éxito

### Antes del Refactor

- [ ] Registrar métricas baseline:
  - Dependencias circulares: **4 archivos**
  - Tests pasando: ____%
  - Bundle size: ____ KB
  - Tiempo de build: ____ seg

### Después del Refactor

- [ ] Verificar mejoras:
  - ✅ Dependencias circulares: **0 archivos**
  - ✅ Tests pasando: ____% (≥ baseline)
  - ✅ Bundle size: ____ KB (≤ baseline)
  - ✅ Tiempo de build: ____ seg

---

## 🚀 Deploy

### Pre-deploy

- [ ] Code review aprobado
- [ ] Todos los tests pasan (CI/CD verde)
- [ ] Documentación actualizada
- [ ] Changelog actualizado

### Deploy

- [ ] Merge a `develop`
- [ ] Deploy a staging
- [ ] Smoke tests en staging
- [ ] Deploy a producción (si aplica)

### Post-deploy

- [ ] Monitorear logs por 24h
- [ ] Verificar no hay errores de imports
- [ ] Verificar métricas de performance

---

## ❓ Rollback Plan (Si algo sale mal)

Si encuentras problemas durante el refactor:

### Rollback Rápido

```bash
# Opción 1: Revertir commits
git log --oneline  # Identificar commits del refactor
git revert <commit-hash>

# Opción 2: Volver a rama anterior
git checkout main
git branch -D refactor/fix-circular-dependencies
```

### Rollback de URLs (Si deploy ya está en producción)

Si cambiaste las URLs del API y hay clientes usando las antiguas:

- [ ] Agregar aliases en `core/urls.py` que redirijan a las nuevas rutas

```python
# Compatibilidad temporal
path('api/core/corporate-identity/',
     lambda r: HttpResponseRedirect('/api/gestion-estrategica/corporate-identity/'))
```

---

## 📝 Notas y Observaciones

*Usa esta sección para documentar problemas encontrados, decisiones tomadas, etc.*

---

**Fecha inicio**: ___________________
**Fecha fin**: ___________________
**Tiempo total**: ___________________
**Bloqueadores encontrados**: ___________________

---

## ✅ Firma de Completitud

- [ ] Todos los checks completados
- [ ] Tests pasando
- [ ] Documentación actualizada
- [ ] Deploy exitoso

**Responsable**: ___________________
**Revisor**: ___________________
**Fecha**: ___________________

