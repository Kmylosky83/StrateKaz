# Sesión 2026-04-22 — Sidebar V3 Fase 2: Geografía DIVIPOLA + Refactor Consecutivos

Segunda sesión del día. Fase 2 del Sidebar V3 ejecutada: reorganización de
capas, renombres, UI de TipoProveedor promovida a CT, migración de geografía
a catálogo canónico DANE (33 deptos + 1,104 municipios), `Proveedor.ciudad`
migrado de CharField a ForeignKey, refactor completo de Sistema B
(`ConsecutivoConfig`) a Sistema A (scan-and-increment en el modelo) en 9
consumidores, eliminación de UI tenant de Módulos y Consecutivos, tab
"General" retirado. Fase 1 (documental) fue la sesión anterior.

## Commits del día

| Commit | Descripción | CI |
|--------|-------------|----|
| `c89ffd7c` | `docs(history): cierre sesión 2026-04-22 — Sidebar V3 + 11 hallazgos UI/C1` (sesión anterior) | ✅ verde |
| `1fca6b57` | `feat(sidebar): V3 Fase 2 — reorganización capas + Catálogos Maestros + UI TipoProveedor en CT` | ✅ verde |
| `cb7c4998` | `feat(geografia): DIVIPOLA oficial + Proveedor.ciudad CharField→FK (H-CAT-05 parcial)` | ✅ verde |
| `bf0bbc4f` | `refactor(consecutivos): Sistema B→A en 9 modelos LIVE+OFF + helper compartido` | ⏳ pendiente (no pusheado aún) |
| `16b0db1f` | `feat(config): Catálogos Plataforma UI + eliminar tab General (Módulos/Consecutivos)` | ⏳ pendiente (no pusheado aún) |

## Estado del producto

- **CURRENT_DEPLOY_LEVEL:** L20 + L16 + supply_chain (sin cambios estructurales — solo reorganización).
- **Tests:** Django check ✅ sin issues. TypeScript tsc --noEmit ✅ verde. Vite build ✅ 2m. No se corrieron unit tests bloqueantes (sesión de refactor preservó APIs).
- **Gate CI:** últimos 2 commits de la tarde (`bf0bbc4f`, `16b0db1f`) **no pusheados al cierre de este doc** — quedan para push + CI verification al inicio de la siguiente sesión.
- **Apps LIVE tocadas:** `core` (helper consecutivos), `catalogo_productos` (Proveedor.ciudad FK + refactor generar_codigo), `supply_chain.compras` + `almacenamiento`, `configuracion_plataforma` (UI + seed tab general retirado).
- **Apps OFF tocadas (preventivo):** `production_ops` (3 sub-apps), `sales_crm.servicio_cliente`, `talent_hub.services`, `gestion_documental.services` — refactor a Sistema A para no romper imports en CI (testing.py activa todas las apps).
- **VPS:** sin intervención.

## Decisiones tomadas (no reabrir)

### 1. Sidebar V3 Fase 2 ejecutada siguiendo decisiones documentales de la sesión anterior
Orden final: Fundación → GD · Catálogos Maestros · Flujos de Trabajo → Gente · Operación Comercial → Configuración · Centro de Control.
INFRAESTRUCTURA wrapper eliminado (3 CTs independientes al mismo nivel).
NIVEL_EQUIPO y NIVEL_CADENA renombrados conceptualmente a "Gente" y "Operación Comercial" — preserva códigos backend.

### 2. TipoProveedor promovido a tab propio en Catálogos Maestros
Cascada narrativa igual a Categorías→Productos: primero se definen los tipos, luego se crean proveedores. `section_code='tipos_proveedor'` independiente. UI retirada de `supply-chain/CatalogosTab`.

### 3. Módulos del Sistema — UI tenant eliminada
La gestión vive exclusivamente en Admin Global (`TenantFormModal → TabModulos`). El admin del tenant ya no edita sus propios módulos — es decisión centralizada por el superadmin. Se conserva el backend (`SystemModule` model + endpoints).

### 4. UI NormaISO redundante eliminada (H-CAT-01 cerrado)
Administración única desde Fundación → Contexto → Partes Interesadas. `CatalogOrganizacionalTab.tsx` borrado físicamente.

### 5. Catálogo geográfico canónico = DIVIPOLA DANE oficial
33 departamentos con código DIVIPOLA 2 dígitos (ej: "05" Antioquia, "11" Bogotá D.C.) + 1,104 municipios (dataset marcovega/colombia-json, MIT). Bogotá D.C. tratado como distrito capital independiente de Cundinamarca.

### 6. `Proveedor.ciudad` migrado de CharField a ForeignKey(Ciudad)
Migraciones `0010` (AddField + RunPython data migration) + `0011` (RemoveField + RenameField). 3 proveedores con strings inconsistentes ("Cúcuta" bajo Casanare, "Huila" como ciudad) quedaron con `ciudad=NULL` para corrección manual desde UI — H-CAT-05 cerrado parcial.

### 7. Sistema B (`ConsecutivoConfig`) → Sistema A en 9 modelos
Helper compartido `apps/core/utils/consecutivos.py::siguiente_consecutivo_scan()` con soporte para `include_year`. 9 modelos refactoreados (6 LIVE + 3 OFF apps): Producto, CategoriaProducto, Proveedor, OrdenCompra, RequisicionCompra, MovimientoInventario, + varios de production_ops/sales_crm/talent_hub/gestion_documental. Modelo `ConsecutivoConfig` se conserva en backend por 5 consumers residuales no-críticos.

### 8. Tab "General" eliminado del seed `configuracion_plataforma`
`cleanup_obsolete_tabs` del seed eliminó automáticamente el tab + 2 secciones (modulos + consecutivos) + 20 `CargoSectionAccess` en ambos tenants (demo + test). Sección `modulos` sube a Admin Global; `consecutivos` desaparece total (UI-side).

### 9. Catálogos de Plataforma = sub-tab nuevo "Plataforma" en Configuración → Catálogos
Primera UI oficial para administrar `Departamento` + `Ciudad` DIVIPOLA. Filtro por departamento para las 1,104 ciudades. CRUD completo respetando permisos sobre `Sections.CATALOGOS`.

## Deuda consciente activa

- **`ConsecutivoConfig` modelo backend**: 5 consumers residuales no-críticos (`configuracion.serializers.py::Sede.codigo`, `stats_views`, `viewsets_strategic.py`, `supply_chain/almacenamiento/tests/factories.py`, `serializers_consecutivos.py`) bloquean DROP TABLE. Refactorizar + eliminar modelo en sesión dedicada futura. H-UI-05 cerrado parcial.
- **Bogotá D.C. ciudad en DB**: aparece como `11_bogota` bajo el distrito 11. JSON source (marcovega) la tenía en Cundinamarca — el seed la saltó ahí y la creó bajo DC (correcto).
- **CI del último push (`cb7c4998`)**: ✅ verde al momento del cierre. Los últimos 2 commits locales (`bf0bbc4f`, `16b0db1f`) NO pusheados — quedan para verificación al arranque de la siguiente sesión.
- **Deploy producción de los cambios de hoy**: no ejecutado. Requiere orden específico: `deploy_seeds_all_tenants --only geografia` antes de `migrate_schemas` para que la data migration de `Proveedor.ciudad` pueda mapear correctamente los strings existentes.
- **`CatalogOrganizacionalTab.tsx` archivo**: eliminado físicamente. Ya no existe, cierra H-CAT-01.
- **Proveedores con `ciudad=NULL`**: 3 en `tenant_demo` (Grasas del Norte, Stratejui, final). Admin debe abrir el modal, seleccionar dept correcto y elegir la ciudad del nuevo dropdown.
- **Sede/Tenant.departamento** como `CharField(choices=DEPARTAMENTOS_COLOMBIA)` hardcoded: H-CAT-05 abierto en su parte residual. Requiere sesión dedicada de migración a FK.
- **Colaborador/Candidato.tipo_documento** CharField hardcoded: H-CAT-04 abierto. Requiere sesión dedicada (no bloquea deploy, Proveedor ya migrado).
- **Tests unitarios de los 9 refactors Sistema A**: no escritos. El comportamiento preserva la semántica (try/except con fallback idéntico) pero falta cobertura formal.

## Próximo paso claro

Push + verificación CI de `bf0bbc4f` + `16b0db1f` → Si verde, deploy producción con orden específico (seed geografía → migrate → resto del pipeline). Después de deploy, browseo manual de `/configuracion-admin/catalogos/plataforma` y creación de un proveedor con ciudad FK como smoke test real en prod.

## Archivos clave tocados

### Backend
- `backend/apps/core/utils/consecutivos.py` — **nuevo** (helper Sistema A).
- `backend/apps/catalogo_productos/models.py` — CategoriaProducto + Producto refactoreados a Sistema A.
- `backend/apps/catalogo_productos/proveedores/models.py` — Proveedor.ciudad ForeignKey + `generar_codigo_interno` a Sistema A.
- `backend/apps/catalogo_productos/migrations/0010_proveedor_add_ciudad_fk.py` — **nuevo** (AddField + data migration).
- `backend/apps/catalogo_productos/migrations/0011_proveedor_replace_ciudad.py` — **nuevo** (RemoveField + RenameField).
- `backend/apps/catalogo_productos/proveedores/viewsets.py` — `TipoProveedorViewSet.section_code` a `'tipos_proveedor'`.
- `backend/apps/catalogo_productos/proveedores/serializers.py` — `ciudad_nombre` expuesto read-only.
- `backend/apps/core/viewsets_config.py` — `SIDEBAR_LAYERS` reordenado V3 + split INFRAESTRUCTURA en 3 capas.
- `backend/apps/core/management/commands/seed_estructura_final.py` — tab `tipos_proveedor` agregado + rename a "Catálogos Maestros" + tab `general` retirado.
- `backend/apps/core/management/commands/seed_geografia_colombia.py` — **nuevo** (33 deptos + 1,104 municipios).
- `backend/apps/core/management/commands/data/geografia_colombia.json` — **nuevo** (dataset marcovega MIT).
- `backend/apps/core/management/commands/deploy_seeds_all_tenants.py` — seed `geografia` agregado al pipeline antes de `supply_chain`.
- `backend/apps/supply_chain/gestion_proveedores/management/commands/seed_supply_chain_catalogs.py` — retirados `_seed_departamentos` y `_seed_ciudades` (-212 LOC).
- `backend/apps/supply_chain/compras/models.py` — OrdenCompra + RequisicionCompra refactoreados.
- `backend/apps/supply_chain/almacenamiento/models.py` — MovimientoInventario refactoreado.
- `backend/apps/production_ops/mantenimiento/models.py` + `procesamiento/models.py` + `recepcion/models.py` — 6 refactors Sistema A (OFF, preventivo).
- `backend/apps/sales_crm/servicio_cliente/models.py` — PQRS + EncuestaSatisfaccion refactoreados.
- `backend/apps/talent_hub/services/contrato_documento_service.py` — `_generar_codigo_documento` simplificado.
- `backend/apps/gestion_estrategica/gestion_documental/services/documento_service.py` — `generar_codigo` refactoreado TIPO-PROCESO-NNN.

### Frontend
- `frontend/src/features/catalogo-productos/components/TiposProveedorTab.tsx` — **nuevo** (CRUD completo con flags).
- `frontend/src/features/catalogo-productos/components/ProveedorFormModal.tsx` — Ciudad `<Select>` filtrado por departamento.
- `frontend/src/features/catalogo-productos/types/proveedor.types.ts` — `ciudad: number | null` + `ciudad_nombre: string | null`.
- `frontend/src/features/catalogo-productos/pages/CatalogoProductosPage.tsx` — entry `tipos-proveedor` en SECTION_MAP.
- `frontend/src/features/catalogo-productos/components/index.ts` — export TiposProveedorTab.
- `frontend/src/routes/modules/catalogo-productos.routes.tsx` — ruta `/catalogo-productos/tipos-proveedor`.
- `frontend/src/features/supply-chain/components/CatalogosTab.tsx` — retirado CRUD tipos-proveedor.
- `frontend/src/features/configuracion-admin/components/catalogs/CatalogPlataformaTab.tsx` — **nuevo** (Departamentos + Ciudades DIVIPOLA).
- `frontend/src/features/configuracion-admin/components/catalogs/CatalogOrganizacionalTab.tsx` — **eliminado** (H-CAT-01).
- `frontend/src/features/configuracion-admin/components/catalogs/index.ts` — export CatalogPlataformaTab.
- `frontend/src/features/configuracion-admin/components/CatalogosSection.tsx` — 4to sub-tab "Plataforma" agregado como primero.
- `frontend/src/features/configuracion-admin/components/ConfigAdminTab.tsx` — SECTION_COMPONENTS limpiado (solo catalogos + integraciones).
- `frontend/src/features/configuracion-admin/components/ModulosSection.tsx` — **eliminado** (UI en Admin Global).
- `frontend/src/features/configuracion-admin/components/ConsecutivosSection.tsx` + `ConsecutivoFormModal.tsx` — **eliminados**.
- `frontend/src/features/configuracion-admin/hooks/useConfigAdmin.ts` — agregados hooks Departamento/Ciudad, retirados hooks Consecutivos.
- `frontend/src/features/configuracion-admin/types/config-admin.types.ts` — agregados tipos Departamento, Ciudad + DTOs.
- `frontend/src/features/admin-global/components/tenant-form-tabs/TabContacto.tsx` — nota de deuda H-CAT-05 (CharField preserva por ahora).
- `frontend/src/features/admin-global/components/tenant-form-tabs/constants.ts` — `CATEGORY_LABELS.NIVEL_CATALOGOS_MAESTROS` agregado.
- `frontend/src/constants/modules.ts` — `NIVEL_CATALOGOS_MAESTROS` en `ModuleCategory` + `catalogo_productos` name → "Catálogos Maestros".
- `frontend/src/constants/permissions.ts` — `Sections.TIPOS_PROVEEDOR` agregado.

### Docs
- `docs/01-arquitectura/catalogos-maestros.md` — **nuevo** (inventario canónico 26 catálogos + clasificación C0/CT/C1/CO + bitácora).
- `docs/01-arquitectura/INDEX.md` — link al nuevo doc agregado.
- `docs/01-arquitectura/hallazgos-pendientes.md` — H-CAT-01/02/03/04 nuevos + H-CAT-05 + H-UI-05 actualizados (cerrado parcial).

## Hallazgos abiertos

- **H-CAT-01** (CERRADO 2026-04-22) — UI NormaISO duplicada en Config → Organizacional: severidad MEDIA. Resuelto.
- **H-CAT-02** — `TipoEPP` debe promoverse a CT cuando activen Supply-inventario o HSEQ: severidad BAJA (hoy), ALTA (al activar).
- **H-CAT-03** — `RolFirmante`/`EstadoFirma` mal ubicados en `identidad`: severidad BAJA. Deferido.
- **H-CAT-04** — `Colaborador`/`Candidato.tipo_documento` CharField hardcoded: severidad MEDIA. Sesión dedicada.
- **H-CAT-05** (PARCIAL) — `Tenant.departamento`, `SedeEmpresa.departamento`, `Proveedor/Sede.ciudad`: Proveedor cerrado, resto pendiente de migración FK.
- **H-UI-05** (CERRADO PARCIAL) — `ConsecutivoConfig` Sistema B: Sistema A ya cubre 100% de modelos LIVE+OFF. Modelo conservado por 5 consumers residuales no-críticos.
- **H-UI-02** — Redistribuir UI de `audit_system` (logs → Admin Global, notificaciones → header, tareas → Mi Portal): deferido sesión dedicada.

---

## Datos clave

- **Departamentos DIVIPOLA cargados**: 33 (32 oficiales + Bogotá D.C. como distrito).
- **Ciudades DIVIPOLA cargadas**: 1,104 (dedup 1 duplicado source — "Chibolo" Magdalena).
- **Módulos refactoreados Sistema A**: 9 (6 LIVE + 3 OFF apps).
- **Hooks React creados en sesión**: 10 nuevos (useDepartamentosConfig, useCiudadesConfig + CRUD variants + useTiposProveedor ya existían).
- **Archivos eliminados físicamente**: 4 (CatalogOrganizacionalTab + ModulosSection + ConsecutivosSection + ConsecutivoFormModal).
- **Archivos nuevos creados**: 8 (seed_geografia_colombia + geografia_colombia.json + 2 migraciones + CatalogPlataformaTab + TiposProveedorTab + catalogos-maestros.md + utils/consecutivos.py).
- **Pipeline deploy seeds**: 35 operaciones totales (1 public + 17 seeds × 2 tenants), ejecutado sin errores en dev.
