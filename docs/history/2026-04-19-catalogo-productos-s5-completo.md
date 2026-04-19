# Sesión 2026-04-19 — Catálogo de Productos S5 completo (feature + bases + refactor)

## Commits del día

| Commit | Descripción | CI |
|--------|-------------|----|
| `c0f15d46` | feat(catalogo-productos): feature frontend completa — api, hooks, types, pages, components, routes | ✅ (encadenado) |
| `e69da3ee` | feat(seeds): reintegrar catalogo_productos al sidebar | ✅ (encadenado) |
| `03531799` | feat(catalogo-productos): S5.1 bases sólidas — is_system + autocódigo + seed base | ✅ CodeQL / CI cancelled (superseded) |
| `0f60496a` | fix(catalogo-productos): eliminar categorías raíz redundantes del seed | ✅ (encadenado) |
| `f24e0e53` | refactor(catalogo-productos): NIVEL_INFRAESTRUCTURA + RBAC allowlist + DS polish | ✅ CI verde + CodeQL |

## Estado del producto

- **CURRENT_DEPLOY_LEVEL:** 20 (sin cambio — `catalogo_productos` ya era LIVE backend desde L15/L17).
- **Versión:** 5.7.0.
- **Frontend build:** ✅ TypeScript limpio, Vite build OK en 2m 16s.
- **Tests backend:** sin cambios en cobertura (no se tocaron tests de otros módulos).
- **Migraciones aplicadas:** `catalogo_productos.0003` (is_system) + `0004` (labels precio y SKU).
- **Seeds corridos en Docker:** `consecutivos` (+ PRODUCTO), `catalogo_productos_base` (12 unidades, 4 categorías legacy eliminadas), `estructura_final` (63 accesos RBAC revocados).
- **Browse en local:** validado — sidebar INFRAESTRUCTURA con 2 módulos, modal con código autogenerado `PROD-00001`, sección opcional colapsable, candado 🔒 en is_system.

## Decisiones tomadas (no reabrir)

### 1. `catalogo_productos` es CT-layer (Infraestructura), no Cadena de Valor

- Movido de `NIVEL_CADENA` a `NIVEL_INFRAESTRUCTURA` — junto a `gestion_documental`.
- Tres archivos actualizados: `seed_estructura_final.py`, `viewsets_config.py`, `modules.ts`.
- Razón: `catalogo_productos` es dato maestro **consumido por** supply_chain, production_ops y sales_crm. No es un módulo de negocio, es infraestructura transversal.
- Visual: el sidebar ahora muestra "INFRAESTRUCTURA" como categoría con 2 módulos (Gestión Documental + Catálogo de Productos).

### 2. Patrón C para universal/tenant: TenantModel + `is_system=True`

- Todas las entidades (`Producto`, `CategoriaProducto`, `UnidadMedida`) siguen siendo `TenantModel` (copia por tenant).
- Las 12 unidades SI estándar (kg, g, L, mL, m, cm, m³, und, caja, paquete, docena, tonelada) tienen `is_system=True` → no se pueden eliminar ni por admin.
- Protección en `ViewSet.perform_destroy()` via `_protect_system_delete()` → HTTP 403 PermissionDenied.
- Alternativa descartada: mover unidades al schema `public` (Patrón B tipo `Departamento`/`Ciudad`). Motivo: cada tenant puede personalizar el nombre sin afectar otros, y `catalogo_productos` queda en backups/exports del tenant.

### 3. NO se seedean categorías raíz

- Se consideró seedear "Materias Primas / Insumos / PT / Servicios" como categorías system.
- Descartado por **redundancia 1:1 con el enum `Producto.tipo`**.
- El tipo ya clasifica funcionalmente el producto. La categoría queda 100% para taxonomía específica del tenant (ej: "Grasas Animales > Sebo Vacuno").
- Cleanup defensivo en el seed: elimina categorías legacy `is_system=True` si están vacías (sin subcategorías ni productos). Pre-launch sin datos reales, safe.

### 4. Código auto-generado con sistema de consecutivos existente

- `Producto.save()` llama a `ConsecutivoConfig.obtener_siguiente_consecutivo('PRODUCTO')` si `codigo` vacío.
- Nuevo consecutivo `PRODUCTO` con prefix `PROD`, padding 5, sin año, sin reset → genera `PROD-00001`, `PROD-00002`, etc.
- Agregado a `CONSECUTIVOS_ADICIONALES` (se seedea via `seed_consecutivos_sistema`).
- Frontend: campo código disabled por default con toggle "Ingresar código manualmente" + ícono Lock 🔒.

### 5. Best practice enterprise para `precio_referencia`: mantener como opcional con label claro

- Investigación: SAP (`MBEW`), Odoo (`list_price`), NetSuite ("Base Price"), Dynamics ("Unit price") todos mantienen un precio en producto master como **default/reference**.
- El precio real vive en `PrecioMateriaPrima` (supply_chain) por proveedor.
- Decisión: se mantiene pero con `verbose_name='Precio estimado (referencia)'` + helper text explícito + movido a sección "Información opcional" colapsable.

### 6. RBAC restringido con allowlist de cargos administrativos

- `rbac_signals` propaga TabSection a TODOS los cargos por default. No se modificó el signal (riesgo sistémico).
- En su lugar: nuevo paso 4 del seed `_restrict_catalogo_productos_rbac()` que **revoca** post-propagación para cargos fuera del allowlist regex.
- Allowlist: `GER_GENERAL`, `DIR_CALIDAD`, `COORD_LOGISTICA`, `COORD_ADMIN`, `JEFE_PRODUCCION`, `ALMACENISTA`, `INSPECTOR_CALIDAD`, `SUPERVISOR_PLANTA`.
- Verificado: 63 accesos revocados en `tenant_demo` (de las 3 secciones × 25 cargos originales).

### 7. Design System obligatorio — migración a `FormModal`

- Los 3 modales inicialmente usaban `BaseModal` + form manual.
- CLAUDE.md declara factories obligatorias. Migrados a `FormModal` (del DS en `components/modals/FormModal.tsx`).
- Gratis del DS: advertencia de cambios sin guardar, reset automático, botones footer estándar, size tipado.
- Corregidos props de `ConfirmDialog` (`message`/`confirmText`, no `description`/`confirmLabel`).
- Agregado `helperText` en todos los campos con contexto relevante (SKU, precio, factor conversión, código interno, orden, abreviatura).

## Deuda consciente activa

### Deuda creada en S5 / S5.1 / S5.2

- **H-S5-tipo-sin-behavior**: `Producto.tipo` hoy es solo label clasificatorio — no controla comportamiento real. A futuro: `SERVICIO` → skip inventario, `PRODUCTO_TERMINADO` → habilita en Sales CRM. Comentado inline en el modelo.
- **H-S5-searchable-select**: los dropdowns de Categoría y Unidad usan `Select` estándar. A 50+ productos no escala. Reemplazar por `SearchableSelect`/`Combobox` cuando el volumen lo justifique.
- **H-S5-estadisticas-no-usadas**: `ProductoViewSet` tiene endpoint `@action estadisticas/` (total, por_tipo, por_categoria) pero el frontend no lo consume. Agregar dashboard/cards en el header de la página cuando se necesite.
- **H-S5-servicios-precio**: el campo `precio_referencia` se muestra para todos los tipos incluidos `SERVICIO` — donde la lógica correcta sería tarifa por hora (vive en otro módulo). A ocultar cuando se implemente el behavior del tipo.

### Deuda heredada (no atendida en esta sesión)

- Ver `docs/history/2026-04-18-sesion-cierre-supply-chain-s4.md` sección "Deuda consciente activa":
  - H-S4-views-refactor (almacenamiento/views.py 903 LOC)
  - H-S4-tipomateriaprima-vs-producto (9 call sites)
  - H-S4-reversal (sin política de reversal del signal voucher→inventario)
  - H-S4-seeds-legacy (3 seeds rotos — ATENDIDO hoy parcialmente: 2 fix, 1 hallazgo por app no instalada)

### Deuda operacional (Sentry)

- **H-S5-sentry-marketing**: `STRATEKAZ-MARKETING-3` sigue abierto (1 evento, requiere sourcemap resolvido).
- **H-S5-sentry-pwa**: `STRATEKAZ-P` — stale chunk PWA, config `vite-plugin-pwa` necesita `cleanupOutdatedCaches: true`.

## Próximo paso claro

Deploy al VPS (Opción C de `docs/04-devops/deploy.md`) con los 5 commits del día + seeds (migrate_schemas + deploy_seeds_all_tenants + collectstatic + npm build + systemctl restart). Verificar en producción que el sidebar muestra INFRAESTRUCTURA con los 2 módulos y que el modal de producto funciona con código autogenerado. Luego: S6 — decidir próximo módulo prioritario (candidatos: `gestion_proveedores` UI, activar `almacenamiento/recepcion/liquidaciones` en `base.py`, o refactor de deuda L17/L20).

## Archivos clave tocados

### Backend

- `backend/apps/catalogo_productos/models.py` — agregado `is_system` a Cat/UnidadMedida, auto-codigo en Producto.save(), comentario tipo sin behavior, labels y help_text actualizados
- `backend/apps/catalogo_productos/views.py` — `_protect_system_delete()` helper + uso en 2 ViewSets
- `backend/apps/catalogo_productos/serializers.py` — expone `is_system` (read-only) + `codigo` required=False para autogeneración
- `backend/apps/catalogo_productos/migrations/0003_categoriaproducto_is_system_unidadmedida_is_system.py` — nuevo
- `backend/apps/catalogo_productos/migrations/0004_alter_producto_precio_referencia_alter_producto_sku.py` — nuevo (label/help_text)
- `backend/apps/catalogo_productos/management/commands/seed_catalogo_productos_base.py` — nuevo (12 unidades + cleanup legacy)
- `backend/apps/core/management/commands/deploy_seeds_all_tenants.py` — registrado seed catalogo_productos
- `backend/apps/core/management/commands/seed_estructura_final.py` — movido a NIVEL_INFRAESTRUCTURA (orden 16) + `_restrict_catalogo_productos_rbac()`
- `backend/apps/core/viewsets_config.py` — catalogo_productos en NIVEL_INFRAESTRUCTURA.module_codes (removido de NIVEL_CADENA)
- `backend/apps/gestion_estrategica/organizacion/models_consecutivos.py` — agregado consecutivo `PRODUCTO`

### Frontend

- `frontend/src/features/catalogo-productos/` — feature directory completo (14 archivos nuevos): api, hooks, types, pages, components, routes
- `frontend/src/features/catalogo-productos/components/ProductosTab.tsx` — migrado a FormModal del DS + sección opcional colapsable + toggle código
- `frontend/src/features/catalogo-productos/components/CategoriasTab.tsx` — migrado a FormModal + helperTexts + Lock 🔒
- `frontend/src/features/catalogo-productos/components/UnidadesMedidaTab.tsx` — migrado a FormModal + helperTexts + Lock 🔒
- `frontend/src/routes/modules/catalogo-productos.routes.tsx` — nuevo (route-based con sub-rutas)
- `frontend/src/routes/index.tsx` — registrado `catalogoProductosRoutes`
- `frontend/src/constants/modules.ts` — `catalogo_productos` en NIVEL_INFRAESTRUCTURA (removido de NIVEL_CADENA)

## Hallazgos abiertos

- **H-S5-tipo-sin-behavior** — `Producto.tipo` es solo label. Severidad BAJA (documentado inline).
- **H-S5-searchable-select** — Select estándar no escala a 50+ ítems. Severidad MEDIA (aparece cuando crezca el volumen).
- **H-S5-estadisticas-no-usadas** — endpoint backend sin consumir. Severidad BAJA.
- **H-S5-servicios-precio** — campo precio aplica a SERVICIO cuando no debería. Severidad BAJA (cosmético hasta que tipo tenga behavior).
- **H-S5-sentry-marketing** / **H-S5-sentry-pwa** — deuda operacional pre-existente sin atender en esta sesión. Severidad BAJA.
