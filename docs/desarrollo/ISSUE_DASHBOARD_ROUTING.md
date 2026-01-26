# Issue: Navegación incorrecta desde Dashboard a Módulos

**Estado**: ✅ SOLUCIONADO (con hardcoding temporal)
**Fecha**: 2026-01-23
**Prioridad**: ALTA - Requiere refactorización

---

## Problema Original

Al hacer click en módulos desde el Dashboard, se generaban URLs incorrectas:

| Módulo | URL Generada (❌ Incorrecta) | URL Esperada (✅ Correcta) |
|--------|------------------------------|----------------------------|
| Cumplimiento Normativo | `/motor-cumplimiento/matriz-legal` | `/cumplimiento/matriz-legal` |
| Motor de Riesgos | `/motor-riesgos/procesos` | `/riesgos/procesos` |
| Dirección Estratégica | `/gestion-estrategica/configuracion` ✅ | `/gestion-estrategica/configuracion` |

**Por qué Dirección Estratégica funcionaba**: El código `gestion_estrategica` al convertirse a slug coincide con la ruta `/gestion-estrategica`.

---

## Causa Raíz

### Arquitectura de Endpoints

El sistema tiene **dos endpoints** para obtener módulos:

#### 1. `/api/core/system-modules/sidebar/` (Sidebar)
```python
# backend/apps/core/viewsets_config.py
class SidebarModuleSerializer(serializers.ModelSerializer):
    def get_route(self, obj):
        # Procesa y calcula rutas completas en el backend
        return f"{obj.route}/{first_tab.route}"
```
- ✅ Procesa TODO en backend
- ✅ Devuelve rutas completas pre-calculadas
- ✅ **Funciona perfecto**

#### 2. `/api/core/system-modules/tree/` (Dashboard)
```python
# backend/apps/core/serializers_config.py
class SystemModuleTreeSerializer(serializers.ModelSerializer):
    class Meta:
        fields = ['id', 'code', 'name', 'route', 'tabs', ...]
```
- ❌ Devuelve datos crudos (módulos, tabs, secciones)
- ❌ Frontend debe ensamblar rutas
- ❌ El campo `route` existe en BD pero no llega al frontend

### Service Worker Cache Issue

```typescript
// frontend/vite.config.ts - Workbox PWA
VitePWA({
  workbox: {
    runtimeCaching: [{
      urlPattern: /^https:\/\/api\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutos
        },
      },
    }],
  },
})
```

**Problema**: El Service Worker estaba cacheando la respuesta antigua del endpoint `/tree/` que no incluía el campo `route`, a pesar de que:
- ✅ El campo `route` SÍ está en la base de datos
- ✅ El serializer `SystemModuleTreeSerializer` SÍ incluye `route` en los fields
- ✅ Django shell confirmó que los datos son correctos

**Soluciones intentadas que NO funcionaron**:
1. ❌ Limpiar cache del navegador (Ctrl+Shift+Delete)
2. ❌ Hard refresh (Ctrl+F5)
3. ❌ Modo incógnito
4. ❌ Unregister Service Worker manualmente
5. ❌ Esperar expiración del cache (5 minutos)

---

## Solución Temporal Implementada: Hardcoding

**Archivo**: `frontend/src/pages/DashboardPage.tsx`

```typescript
// Mapeo hardcodeado de módulos a sus rutas base
const MODULE_ROUTES: Record<string, string> = {
  'gestion_estrategica': '/gestion-estrategica',
  'motor_cumplimiento': '/cumplimiento',
  'motor_riesgos': '/riesgos',
  'workflow_engine': '/workflows',
  'hseq_management': '/hseq',
  'supply_chain': '/proveedores',
  'production_ops': '/produccion',
  'logistics_fleet': '/logistica',
  'sales_crm': '/ventas',
  'talent_hub': '/talento',
  'admin_finance': '/finanzas',
  'accounting': '/contabilidad',
  'analytics': '/analytics',
  'audit_system': '/auditoria',
};

const TAB_ROUTES: Record<string, string> = {
  'matriz_legal': 'matriz-legal',
  'requisitos_legales': 'requisitos-legales',
  // ... 40+ mapeos más
};

const getModuleRoute = (module) => {
  const baseRoute = MODULE_ROUTES[module.code] || module.route || fallback;
  const firstTab = module.tabs.find(t => t.is_enabled);
  const tabSlug = TAB_ROUTES[firstTab.code] || firstTab.route || fallback;
  return `${baseRoute}/${tabSlug}`;
};
```

### Problemas con esta solución:

❌ **Duplicación de lógica**: Las rutas están definidas en 3 lugares:
- `backend/apps/core/management/commands/seed_estructura_final.py` (fuente de verdad)
- `frontend/src/routes/index.tsx` (definición de rutas React)
- `frontend/src/pages/DashboardPage.tsx` (mapeo hardcodeado) ← NUEVO

❌ **Difícil de mantener**: Al agregar/modificar módulos hay que actualizar 3 archivos

❌ **Propenso a errores**: Fácil olvidar actualizar uno de los archivos

❌ **No escalable**: 14 módulos × 83 tabs = 97+ mapeos manuales

---

## Trabajo Adicional Realizado

### Agregamos Secciones a "Matriz Legal"

Para validar que el sistema de secciones funciona igual en Cumplimiento que en Dirección Estratégica:

**Backend**: `backend/apps/core/management/commands/seed_estructura_final.py`
```python
{
    'code': 'matriz_legal',
    'name': 'Matriz Legal',
    'icon': 'BookOpen',
    'route': 'matriz-legal',
    'orden': 1,
    'sections': [  # ← NUEVO
        {
            'code': 'normas',
            'name': 'Normas',
            'icon': 'BookOpen',
            'orden': 1,
            'description': 'Registro de decretos, leyes y resoluciones'
        },
        {
            'code': 'evaluacion',
            'name': 'Evaluación',
            'icon': 'ClipboardCheck',
            'orden': 2,
            'description': 'Evaluación de cumplimiento por norma'
        },
    ]
}
```

**Frontend**: `frontend/src/features/cumplimiento/pages/MatrizLegalPage.tsx`
- Refactorizado para usar `usePageSections` hook
- Implementado `PageHeader` con tabs de secciones
- Separado en componentes `NormasSection` y `EvaluacionSection`

✅ **Resultado**: Cumplimiento Normativo ahora tiene la misma estructura que Dirección Estratégica (Módulo → Tab → Secciones)

---

## Soluciones Propuestas para Nueva Sesión

### Opción 1: Unificar Endpoints (RECOMENDADA)

**Objetivo**: Hacer que `/tree/` funcione igual que `/sidebar/`

**Cambios en Backend**:
```python
# backend/apps/core/serializers_config.py

class ModuleTabTreeSerializer(serializers.ModelSerializer):
    """Serializer mejorado que pre-calcula rutas completas"""
    sections = TabSectionSerializer(many=True, read_only=True)
    full_route = serializers.SerializerMethodField()  # ← NUEVO

    def get_full_route(self, obj):
        """Calcular ruta completa del tab: /modulo/tab"""
        module_route = obj.module.route or f"/{obj.module.code.replace('_', '-')}"
        tab_route = obj.route or obj.code.replace('_', '-')
        return f"{module_route}/{tab_route}"

    class Meta:
        model = ModuleTab
        fields = [..., 'full_route']  # ← Agregar campo

class SystemModuleTreeSerializer(serializers.ModelSerializer):
    tabs = ModuleTabTreeSerializer(many=True, read_only=True)
    # route ya existe, pero agregar helper
```

**Cambios en Frontend**:
```typescript
// frontend/src/pages/DashboardPage.tsx

const getModuleRoute = (module) => {
  if (module.tabs && module.tabs.length > 0) {
    const firstTab = module.tabs.find(t => t.is_enabled);
    return firstTab.full_route;  // ← Usar ruta pre-calculada del backend
  }
  return module.route;
};

// ELIMINAR MODULE_ROUTES y TAB_ROUTES completamente
```

**Ventajas**:
- ✅ Fuente única de verdad (backend)
- ✅ Menos código frontend
- ✅ Más fácil de mantener
- ✅ Consistente con `/sidebar/`

**Desventajas**:
- ⚠️ Requiere cambios en backend
- ⚠️ Requiere migración/seed actualizado

---

### Opción 2: Service Worker Cache Bust

**Objetivo**: Forzar actualización del cache del Service Worker

**Estrategia A - Versioning del API**:
```typescript
// frontend/src/features/gestion-estrategica/hooks/useModules.ts

export const useModulesTree = () => {
  return useQuery({
    queryKey: ['modules-tree', 'v2'],  // ← Cambiar versión fuerza refetch
    queryFn: async () => {
      const response = await api.get('/core/system-modules/tree/?v=2');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
```

**Estrategia B - Desactivar cache para este endpoint**:
```typescript
// frontend/vite.config.ts

VitePWA({
  workbox: {
    runtimeCaching: [{
      urlPattern: /^https:\/\/api\/core\/system-modules\/tree/,
      handler: 'NetworkFirst',  // Cambiar a NetworkOnly
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    }],
  },
})
```

**Ventajas**:
- ✅ No requiere hardcoding
- ✅ Soluciona el problema de cache

**Desventajas**:
- ❌ No soluciona el problema arquitectural
- ❌ Solo un workaround temporal

---

### Opción 3: Generar Mapeos Automáticamente

**Objetivo**: Generar el mapeo hardcodeado desde el seed

**Script nuevo**: `backend/apps/core/management/commands/generate_route_maps.py`
```python
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    def handle(self, *args, **options):
        # Leer estructura desde seed_estructura_final.py
        from .seed_estructura_final import ESTRUCTURA_MODULOS

        # Generar TypeScript
        ts_content = self.generate_typescript_maps(ESTRUCTURA_MODULOS)

        # Escribir a archivo
        with open('frontend/src/generated/routeMaps.ts', 'w') as f:
            f.write(ts_content)

    def generate_typescript_maps(self, estructura):
        module_routes = {}
        tab_routes = {}

        for module in estructura:
            module_routes[module['code']] = module['route']
            for tab in module.get('tabs', []):
                if 'route' in tab:
                    tab_routes[tab['code']] = tab['route']

        return f"""
// ESTE ARCHIVO ES GENERADO AUTOMÁTICAMENTE
// NO EDITAR MANUALMENTE - Ejecutar: python manage.py generate_route_maps

export const MODULE_ROUTES = {json.dumps(module_routes, indent=2)};
export const TAB_ROUTES = {json.dumps(tab_routes, indent=2)};
"""
```

**Uso en Dashboard**:
```typescript
// frontend/src/pages/DashboardPage.tsx
import { MODULE_ROUTES, TAB_ROUTES } from '@/generated/routeMaps';

const getModuleRoute = (module) => {
  const baseRoute = MODULE_ROUTES[module.code];
  const firstTab = module.tabs.find(t => t.is_enabled);
  const tabSlug = TAB_ROUTES[firstTab.code];
  return `${baseRoute}/${tabSlug}`;
};
```

**Integrar en package.json**:
```json
{
  "scripts": {
    "generate:routes": "cd ../backend && python manage.py generate_route_maps",
    "dev": "npm run generate:routes && vite",
    "build": "npm run generate:routes && vite build"
  }
}
```

**Ventajas**:
- ✅ DRY - Una sola fuente de verdad (seed)
- ✅ Generación automática
- ✅ Difícil olvidar actualizar

**Desventajas**:
- ⚠️ Requiere script adicional
- ⚠️ Complejidad extra en build

---

## Recomendación Final

**Para próxima sesión, implementar en este orden**:

1. **Corto plazo** (1-2 horas): Opción 1 - Unificar Endpoints
   - Agregar campo `full_route` al serializer `ModuleTabTreeSerializer`
   - Actualizar `getModuleRoute` para usar `full_route`
   - Eliminar `MODULE_ROUTES` y `TAB_ROUTES` hardcodeados
   - Probar extensivamente

2. **Mediano plazo** (después): Opción 2 - Cache Bust
   - Configurar cache del Service Worker específicamente para `/tree/`
   - Agregar versioning a queryKeys de React Query

3. **Largo plazo** (opcional): Opción 3 - Generación Automática
   - Solo si se decide mantener el hardcoding por razones de performance

---

## Archivos Modificados en Esta Sesión

### Backend
- ✏️ `backend/apps/core/management/commands/seed_estructura_final.py`
  - Agregadas secciones a `matriz_legal` (líneas 207-210)

### Frontend
- ✏️ `frontend/src/pages/DashboardPage.tsx`
  - Agregado `MODULE_ROUTES` (líneas 32-53)
  - Agregado `TAB_ROUTES` (líneas 59-109)
  - Modificado `getModuleRoute` (líneas 111-132)

- ✏️ `frontend/src/features/cumplimiento/pages/MatrizLegalPage.tsx`
  - Refactorizado para usar `usePageSections`
  - Agregadas secciones `NormasSection` y `EvaluacionSection`
  - Implementado `PageHeader` con tabs

- ✏️ `frontend/src/features/gestion-estrategica/types/modules.types.ts`
  - Sin cambios de código (solo linter/formatter)

### Documentación
- 📄 `docs/desarrollo/ISSUE_DASHBOARD_ROUTING.md` ← ESTE ARCHIVO

---

## Comandos Útiles para Debugging

```bash
# Backend - Verificar datos en BD
cd backend
source venv/bin/activate  # o .\venv\Scripts\activate en Windows
python manage.py shell

# En el shell de Django:
from apps.core.models import SystemModule, ModuleTab
cumplimiento = SystemModule.objects.get(code='motor_cumplimiento')
print(cumplimiento.route)  # Debe mostrar: /cumplimiento
tab = cumplimiento.tabs.first()
print(tab.route)  # Debe mostrar: matriz-legal

# Verificar serializer
from apps.core.serializers_config import SystemModuleTreeSerializer
data = SystemModuleTreeSerializer(cumplimiento).data
print(data['route'])  # Debe mostrar: /cumplimiento

# Frontend - Verificar API response
# En navegador: http://localhost:8000/api/core/system-modules/tree/
# Buscar el módulo motor_cumplimiento y verificar campo "route"

# Limpiar Service Worker
# En DevTools Console:
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});
location.reload();
```

---

## Notas para el Próximo Desarrollador

1. **No te frustres**: Este issue es resultado de un Service Worker muy agresivo + arquitectura dual de endpoints. Es un problema conocido en PWAs.

2. **Prioriza Opción 1**: Es la más limpia y consistente con el resto del sistema (Sidebar ya lo hace así).

3. **Documenta cambios**: Si decides otra solución, actualiza este archivo.

4. **Testing**: Prueba navegación desde:
   - Dashboard → Todos los módulos
   - Sidebar → Todos los módulos
   - URL directa → Todas las rutas

5. **Cache**: Después de cambios en serializers, incrementa versión del queryKey en `useModulesTree`.

---

**Autor**: Claude Sonnet 4.5
**Última actualización**: 2026-01-23
**Estado**: PENDIENTE DE REFACTORIZACIÓN
