# Sesión 2026-04-19 (S7) — Consolidación de Catálogos + UnidadMedida

> Sesión post-cierre de S6 (Supply Chain activación). Detecta redundancia
> de catálogos y un modelo duplicado crítico (`UnidadMedida` en 2 tablas
> con FK activa). Cero data en producción, ventana óptima para limpieza.

## Decisión de fondo

Camilo: *"Cuando liberamos un módulo nuevo, lo que lo acompañe debe ser
profesional. No depreciar, eliminar."*

- UnidadMedida legacy (`organizacion.UnidadMedida`) → **ELIMINADO**.
- `catalogo_productos.UnidadMedida` → **source-of-truth único**.
- Redundancia UX FormaPago/TipoDocumento → **consolidada en Configuración**.
- Seeds MP/TipoAlmacen → **agregados al seed canónico**.

## Commits de la sesión (en orden)

| # | Commit | Etapa | LOC |
|---|---|---|---|
| 1 | `a1f7d911` | Etapa A — retirar FormaPago + TipoDocumento de Supply Chain → Catálogos | +2 / -10 |
| 2 | `6b259ce0` | Etapa B — seed CategoriaMP + TipoMP + TipoAlmacen (data genérica) | +103 / -1 |
| 3 | `6f7e517a` | FASE 1 — fortalecer canónico con campos legacy (+7 fields, +5 métodos) | +261 / -18 |
| 4 | `fadb241b` | FASE 2 — migración RunPython: 15 registros legacy → canónico + FK SedeEmpresa | +150 / 0 |
| 5 | `79596df8` | FASE 3 — reescribir 9 consumidores al canónico + AlterField FK | +158 / -418 |
| 6 | `27217b21` | FASE 4 — eliminar legacy (modelo + viewset + serializers + filters + RemoveModel) | +30 / -1737 |
| 7 | (pending) | FASE 5 — bump 5.9.0 + docs + hallazgos | - |

**Delta neto:** ~−1750 LOC, 27 archivos tocados, 4 migraciones (2 schema + 1 data + 1 RemoveModel).

## Estado del producto

- **Frontend:** 5.8.0 → **5.9.0** (refactor arquitectónico CT-layer)
- **CURRENT_DEPLOY_LEVEL:** 20 (sin cambio)
- **Migraciones aplicadas en:** public + tenant_demo + test (3 schemas)
- **Django check:** ✅ 0 issues
- **TypeScript:** ✅ clean
- **Tests R7 (cascade delete):** ✅ PASSED post-fixes (22 min)
- **Backup pre-consolidación:** `/tmp/stratekaz-backups/pre_unidad_medida_consolidation_20260419_2009.sql` (4.1M)

## Doctrina consolidada

### Source-of-truth único por capa

| Capa | Modelo/UI canónico | Ubicación sidebar |
|---|---|---|
| **Unidades de Medida** | `catalogo_productos.UnidadMedida` (CT) | Infraestructura → Catálogo de Productos |
| **FormaPago** | `supply_chain.gestion_proveedores.FormaPago` (C2) | Configuración → Catálogos → Logística |
| **TipoDocumento** | `apps.core.TipoDocumentoIdentidad` (C0) | Configuración → Catálogos → General |
| **TipoContrato** | `configuracion.TipoContrato` (C1) | Configuración → Catálogos → General |
| **NormaISO** | `configuracion.NormaISO` (C1) | Configuración → Catálogos → Organizacional |
| **Categoría/Tipo MP** | `supply_chain.gestion_proveedores` (C2) | Supply Chain → Catálogos |
| **TipoAlmacen** | `supply_chain.catalogos` (C2) | Supply Chain → Catálogos |

### Alineación con CLAUDE.md

- ✅ *"CT sirve a C2"*: `catalogo_productos.UnidadMedida` consumido por
  Supply Chain (almacenamiento), Production Ops futuro, HSEQ futuro.
- ✅ *"Source-of-truth único"*: cada catálogo tiene 1 sola edición.
- ✅ *"NO deprecar, eliminar"*: legacy borrado completo, no flag, no comment.
- ✅ *"Multi-tenant safe"*: migraciones aplicadas por schema.
- ✅ *"Genérico, no cliente-específico"*: seeds MP con data industria (no grasas_y_huesos).

## Decisiones arquitectónicas (no reabrir)

### 1. Canónico absorbe features legacy, no al revés

`catalogo_productos.UnidadMedida` fue fortalecido con todos los campos del
legacy (unidad_base jerárquico, nombre_plural, simbolo, decimales_display,
notación científica, separador miles) antes de eliminar. Razón: el legacy
tenía features reales (conversión, display) que Production Ops futuro
necesitará.

### 2. Mapping categoría legacy → tipo canónico

`MASA → PESO`, `CANTIDAD → UNIDAD`, resto identidad. Método
`obtener_por_categoria()` preservado en canónico como alias compat.

### 3. Match por nombre case-insensitive para consolidar data

15 registros legacy vs 12 canónicos. Match por `LOWER(nombre)`:
- 8 nombres coinciden → enriquecer canónico con campos vacíos (no pisar
  data existente)
- 7 nombres solo en legacy (Pieza, Ciento, Pallet, Contenedor, Libra,
  Hora, Día) → crear nuevos en canónico

Total post-merge: 19 registros.

### 4. `formatear`, `obtener_por_codigo` flexible en canónico

Canónico ahora soporta API legacy: `obtener_por_codigo('KG')` busca en
abreviatura / simbolo / nombre case-insensitive. `formatear(valor, incluir_simbolo, locale_config)` migrado completo.

### 5. `cargar_unidades_sistema` redundante → eliminado

Existe `seed_catalogo_productos_base` que hace lo mismo en el canónico. El
comando `cargar_unidades_sistema.py` y `migrar_capacidades_kg.py` fueron
eliminados. `seed_configuracion_sistema` ahora delega a
`call_command('seed_catalogo_productos_base')`.

## Hallazgos cerrados / nuevos

### ✅ Cerrados
- `H-S6-unidades-medida-dup` (PARCIAL): la duplicación GRANDE con
  `organizacion.UnidadMedida` eliminada. Queda wrapper menor en
  `supply_chain/almacenamiento/views.py`.
- `H-seed-supply-chain-data-vs-estructura`: resuelto usando data genérica.

### 🔲 Nuevos
- `H-S7-geo-catalog-location`: Departamentos/Ciudades evaluar movimiento
  a Configuración (UX menor).
- `H-S7-unidad-base-conflicto`: inconsistencia jerárquica VOLUMEN post-merge
  (Litro base conflicto con Metro cúbico).
- `H-S7-supply-chain-tabla-unidad-medida-huerfana`: tabla DB huérfana del
  legacy S5 sin DROP.

## Archivos clave tocados

### Backend (+fortificación, −legacy)
- `catalogo_productos/models.py`: UnidadMedida fortalecido (+7 campos, +5 métodos)
- `catalogo_productos/migrations/0005_*`: add fields
- `catalogo_productos/migrations/0006_migrar_unidades_desde_legacy.py`: data migration
- `catalogo_productos/serializers.py`, `admin.py`: adaptados
- `configuracion/utils_unidades.py`: 5 funciones reescritas
- `configuracion/serializers.py`, `models.py`, `stats_views.py`: imports + FK
- `configuracion/migrations/0004_alter_sedeempresa_unidad_capacidad.py`: AlterField FK
- `configuracion/management/commands/seed_configuracion_sistema.py`: delega al canónico

### Backend eliminados
- `organizacion/models_unidades.py`
- `organizacion/viewsets_unidades.py`
- `organizacion/serializers_unidades.py`
- `organizacion/filters_unidades.py`
- `configuracion/serializers_unidades.py`
- `configuracion/management/commands/cargar_unidades_sistema.py`
- `configuracion/management/commands/migrar_capacidades_kg.py`
- `organizacion/migrations/0004_delete_unidadmedida.py`: RemoveModel

### Frontend
- `configuracion-admin/hooks/useConfigAdmin.ts`: unidadesMedidaApi reapuntada
- `configuracion-admin/components/catalogs/CatalogGeneralTab.tsx`: pill "Unidades" retirada
- `supply-chain/components/CatalogosTab.tsx`: retira FormaPago + TipoDocumento

## Próximo paso

1. Smoke browseable en tenant_demo:
   - `/catalogo-productos/unidades-medida` → 19 registros, incluyendo los 7 del legacy
   - `/configuracion-admin/catalogos` → sub-tab General solo muestra Contratos + Documentos
   - `/configuracion-admin/catalogos` → Logística muestra FormaPago
   - `/supply-chain/catalogos` → selector ya no muestra FormaPago ni TipoDocumento
   - `/supply-chain/proveedores` → form tipo MP muestra Categorías/Tipos poblados del seed
2. Si smoke pasa → push origin main → CI verde
3. CI verde → `bash scripts/deploy.sh --no-backup` en VPS + `deploy_seeds_all_tenants --only supply_chain` en VPS
4. Post-deploy: verificar que `cargar_unidades_sistema` ya no aparece en `manage.py help`

## Nota de cierre

Sesión de **−1750 LOC netas** con cero downtime. CT-layer consolidado antes
de liberar Production Ops, HSEQ, Accounting, Sales CRM futuros. Cada C2
nuevo consume el canónico sin decisiones arquitectónicas adicionales.

La filosofía *"limpio de raíz antes de liberar"* se aplicó a la letra: el
legacy nunca llegó a producción con data real (supply_chain recién
activado en S6 matutino), eliminación sin riesgo.
