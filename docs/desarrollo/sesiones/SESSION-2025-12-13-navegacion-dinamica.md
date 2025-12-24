# Sesión 2025-12-13: Sistema de Navegación Dinámica

## Resumen

Implementación y corrección del sistema de navegación dinámica que carga módulos, tabs y secciones desde la base de datos sin hardcoding.

## Problemas Identificados y Solucionados

### 1. Sidebar con estructura duplicada

**Problema:** El sidebar mostraba una estructura redundante:
```
Dirección Estratégica (categoría)
  └── Dirección Estratégica (módulo)  ← DUPLICADO
        └── Tabs...
```

**Causa:** El endpoint `/api/core/system-modules/sidebar/` agrupaba módulos por categoría, creando un nivel innecesario.

**Solución:** Reescribir el endpoint para devolver módulos directamente sin agrupación por categoría.

**Archivo:** `backend/apps/core/viewsets_strategic.py` (líneas 573-629)

```python
# Antes: Agrupaba por categoría
categories[cat]['modules'].append(module)

# Después: Módulos directos
result.append({
    'code': module.code,
    'name': module.name,
    'icon': module.icon,
    'children': tabs
})
```

### 2. Iconos mostrando Circle (fallback)

**Problema:** Todos los iconos del sidebar mostraban un círculo en lugar del icono correcto.

**Causa:** La función `getIconComponent()` verificaba `typeof icon === 'function'`, pero los iconos de Lucide React son objetos (`ForwardRefExoticComponent`), no funciones.

**Solución:** Cambiar la verificación de tipo.

**Archivos:**
- `frontend/src/layouts/Sidebar.tsx` (líneas 92-100)
- `frontend/src/components/common/DynamicSections.tsx` (líneas 39-47)

```typescript
// Antes (incorrecto)
return icon && typeof icon === 'function' ? icon : Circle;

// Después (correcto)
if (icon && typeof icon === 'object' && '$$typeof' in icon) {
  return icon as React.ElementType;
}
return Circle;
```

### 3. Códigos de módulo/tab en mayúsculas

**Problema:** Las páginas no encontraban sus secciones porque usaban códigos en MAYÚSCULAS pero la BD tiene minúsculas.

**Causa:** Mismatch entre frontend (`'GESTION_ESTRATEGICA'`) y BD (`'gestion_estrategica'`).

**Solución:** Cambiar códigos a minúsculas en todas las páginas.

**Archivos:**
- `frontend/src/features/gestion-estrategica/pages/ConfiguracionPage.tsx`
- `frontend/src/features/gestion-estrategica/pages/OrganizacionPage.tsx`
- `frontend/src/features/gestion-estrategica/pages/IdentidadPage.tsx`
- `frontend/src/features/gestion-estrategica/pages/PlaneacionPage.tsx`

```typescript
// Antes
const MODULE_CODE = 'GESTION_ESTRATEGICA';
const TAB_CODE = 'CONFIGURACION';

// Después
const MODULE_CODE = 'gestion_estrategica';
const TAB_CODE = 'configuracion';
```

### 4. Errores 500 en endpoints de toggle

**Problema:** Los endpoints `/toggle/` retornaban error 500 en lugar de 400 cuando no se podía desactivar un módulo/tab/sección core.

**Causa:** El método `can_disable()` retorna una tupla `(bool, reason)` pero se usaba directamente como booleano. Una tupla no vacía siempre es `True` en Python.

**Solución:** Desempaquetar la tupla correctamente y evitar llamar al método `disable()` que lanza excepción.

**Archivo:** `backend/apps/core/viewsets_strategic.py`

```python
# Antes (incorrecto)
if not is_enabled and not tab.can_disable():  # Siempre False!
    return Response(...)
tab.disable()  # Lanza ValidationError

# Después (correcto)
if not is_enabled:
    can_disable, reason = tab.can_disable()
    if not can_disable:
        return Response({'error': reason}, status=400)
# Usar save directo en lugar de disable()
tab.is_enabled = False
tab.save(update_fields=['is_enabled'])
```

### 5. Secciones sin iconos

**Problema:** Las secciones de Configuración e Identidad no tenían iconos definidos.

**Solución:** Actualizar directamente en la BD.

```python
# Ejecutado en Django shell
TabSection.objects.filter(code='branding').update(icon='Palette')
TabSection.objects.filter(code='modulos').update(icon='Package')
TabSection.objects.filter(code='consecutivos').update(icon='Hash')
TabSection.objects.filter(code='mision_vision').update(icon='Compass')
TabSection.objects.filter(code='valores').update(icon='Heart')
TabSection.objects.filter(code='politica').update(icon='FileCheck')
```

## Componentes Creados/Modificados

### DynamicSections.tsx (Nuevo)

Componente para sub-navegación dinámica desde API.

```tsx
<DynamicSections
  sections={sections}
  activeSection={activeSection}
  onChange={setActiveSection}
  macroprocessColor="purple"
  variant="pills"
/>
```

**Características:**
- Carga secciones desde API
- Iconos dinámicos de Lucide
- Variantes: `pills` | `underline`
- Colores por macroproceso
- No muestra nada si hay 0-1 secciones

### useTabSections Hook (Nuevo)

Hook para obtener secciones habilitadas de un tab.

```tsx
const { sections, isLoading, tab } = useTabSections('gestion_estrategica', 'configuracion');
```

## Estructura Final del Sistema

```
Sidebar
├── Dirección Estratégica (icon: Target, color: purple)
│   ├── Configuración (icon: Settings)
│   │   └── [Secciones: Branding, Módulos, Consecutivos]
│   ├── Organización (icon: Building2)
│   ├── Identidad Corporativa (icon: Compass)
│   │   └── [Secciones: Misión/Visión, Valores, Política]
│   └── Planeación Estratégica (icon: Target)
├── Usuarios (icon: UserCog, color: purple)
├── Proveedores (icon: Users, color: blue)
│   ├── Materia Prima
│   ├── Productos y Servicios
│   └── Pruebas de Acidez
└── ... otros módulos
```

## Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `backend/apps/core/viewsets_strategic.py` | Sidebar endpoint simplificado, toggle endpoints corregidos |
| `frontend/src/layouts/Sidebar.tsx` | Corrección de detección de iconos |
| `frontend/src/components/common/DynamicSections.tsx` | Nuevo componente + corrección iconos |
| `frontend/src/components/common/index.ts` | Export de DynamicSections |
| `frontend/src/features/gestion-estrategica/pages/*.tsx` | Códigos lowercase |
| `frontend/src/features/gestion-estrategica/hooks/useModules.ts` | Hook useTabSections |
| `README.md` | Documentación de navegación dinámica |

## Testing

- [x] Sidebar muestra módulos sin duplicación
- [x] Iconos correctos en módulos y tabs
- [x] Sub-navegación aparece en ConfiguracionPage
- [x] Toggle de módulos/tabs no genera error 500
- [x] Módulos core muestran mensaje apropiado al intentar desactivar

## Próximos Pasos

1. Implementar rutas para todos los módulos definidos en la migración
2. Crear páginas placeholder para módulos pendientes
3. Implementar persistencia de preferencias de usuario (sidebar colapsado, etc.)
