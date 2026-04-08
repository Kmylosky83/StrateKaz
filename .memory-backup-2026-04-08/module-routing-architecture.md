---
name: module-routing-architecture
description: Arquitectura de routing de módulos — patrón correcto, diferencias con Fundación, plan de migración y relación con RBAC
type: project
---

# Arquitectura de Routing de Módulos

## El patrón correcto (estándar del sistema)

```
Sidebar      → 1 link por módulo
Página       → DynamicSections + usePageSections (tabs desde BD)
Sub-tab      → PageTabs (hardcoded cuando aplica, sin BD)
```

### Jerarquía de 3 niveles
```
Nivel 1 — Sidebar
  └── 1 ítem por módulo (ej: "Gestión Documental")

Nivel 2 — DynamicSections (seeded en BD, controlado por RBAC)
  └── secciones: dashboard | repositorio | en_proceso | archivo | configuracion

Nivel 3 — PageTabs (hardcoded, sub-navegación interna)
  └── ArchivoSection: vigentes | versiones | distribucion | archivados
```

## Módulos que siguen el patrón correcto

- `gestion_documental` → `/gestion-documental` → 1 página, 5 secciones via DynamicSections
- `organizacion` (dentro de Fundación) → ya usa `withModuleGuard` + DynamicSections
- Todos los módulos L20+

## Módulo que NO sigue el patrón: Fundación

**Estado actual (incorrecto):**
```
/fundacion/mi-empresa          → MiEmpresaPage      (withFullGuard 'empresa')
/fundacion/contexto-identidad  → ContextoIdentidadPage (withFullGuard 'analisis_contexto')
/fundacion/organizacion        → OrganizacionPage   (withModuleGuard)
```
Sidebar muestra 3 links separados en lugar de 1.

**Estado objetivo (correcto):**
```
/fundacion → FundacionPage (withModuleGuard)
    DynamicSections: [Mi Empresa] [Contexto e Identidad] [Organización]
```
Sidebar muestra 1 link "Fundación".

## Seed: estructura Tab vs Sección

El seed define dos niveles:
```python
{
  'code': 'modulo',
  'tabs': [                          # Tab = página separada (Nivel 2 sidebar)
    {
      'code': 'tab_code',
      'route': 'ruta-url',           # Añade /modulo/ruta-url si > 1 tab
      'sections': [                  # Sections = tabs horizontales dentro de la página
        {'code': 'seccion1', ...},
        {'code': 'seccion2', ...},
      ]
    }
  ]
}
```

**Regla**: Si el módulo tiene **1 tab** → 1 ruta, sections = DynamicSections.
Si tiene **N tabs** → N rutas, N páginas, N links en sidebar.

Fundación tiene 3 tabs → debería ser 1 tab con 3 sections.

## Relación con RBAC

**Patrón correcto favorece RBAC porque:**

1. `withModuleGuard` solo verifica acceso al módulo completo (boolean)
2. `DynamicSections` + `usePageSections` filtra secciones visibles desde BD según cargo/rol
3. Agregar/quitar una sección = cambio en BD, sin código ni deploy
4. El usuario solo ve las secciones que su RBAC permite

**Patrón Fundación rompe RBAC porque:**
1. `withFullGuard(page, 'fundacion', 'empresa')` bloquea toda la página si el cargo no tiene esa sección exacta
2. Cambiar nombres de secciones requiere actualizar rutas + guards + seed + DB
3. No es DB-driven: los permisos están hardcodeados en el router

## Plan de migración de Fundación

### Prerequisitos
- [ ] Verificar que MiEmpresaPage, ContextoIdentidadPage, OrganizacionPage usan `usePageSections` internamente
- [ ] Crear `FundacionPage` como página contenedora (igual a GestionDocumentalPage)
- [ ] Seed: cambiar 3 tabs → 1 tab `fundacion` con 3 sections (`mi_empresa`, `contexto_identidad`, `organizacion`)

### Pasos
1. Crear `frontend/src/features/gestion-estrategica/pages/FundacionPage.tsx`
   - Igual a GestionDocumentalPage: PageHeader + DynamicSections + router de sección
2. Actualizar `fundacion.routes.tsx`:
   - Cambiar 3 rutas → 1 ruta `/fundacion` con `withModuleGuard`
   - Añadir redirects compat: `/fundacion/mi-empresa` → `/fundacion?section=empresa`
3. Actualizar seed `seed_estructura_final.py`:
   - Fundación: 3 tabs → 1 tab (`fundacion`) con 3 sections
4. Actualizar sidebar navigation en backend (si hay lógica que genera sub-links)
5. Run seed en todos los tenants: `python manage.py deploy_seeds_all_tenants`

### Riesgo bajo porque:
- MiEmpresaPage, ContextoIdentidadPage, OrganizacionPage ya tienen su propio `usePageSections`
- Solo cambia el contenedor externo y el routing

## Por qué esto favorece el escalamiento

Con 14+ módulos activos (L30, L40...):
- Patrón correcto: 14 rutas en el router
- Patrón Fundación aplicado a todos: 14 × 4 promedio = 56+ rutas

Con RBAC DB-driven:
- Agregar sección "Retención" a Archivo = INSERT en BD, sin commit
- Sin DB-driven = commit + deploy por cada cambio de permisos

**Why:** Decisión tomada 2026-04-03 tras análisis de escalabilidad con 14+ módulos.
**How to apply:** Cualquier nuevo módulo usa withModuleGuard + DynamicSections. Fundación migra en L25 o L30 según prioridad.
