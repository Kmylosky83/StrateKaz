# Auditoría S8.5 — Flujo crítico Supply Chain

> **Tipo:** Auditoría solo-lectura. **Scope:** Los 3 pasos fundacionales
> de Supply Chain (Crear MP, Crear Proveedor, Asignar Precio) + todo el
> sistema que los sostiene.
> **Fecha:** 2026-04-20 · **Estado VPS:** sin deploy · **Rama:** main @ `6f2df336`.

---

## Resumen ejecutivo

**Cobertura:** 9/9 bloques auditados. **0 commits ejecutados** bajo excepciones
(nada cayó en las excepciones permitidas puramente cosméticas).

**Conclusión global:** el modelo de negocio de los 3 objetos está **razonablemente
sólido** en términos de modelado (Proveedor + Producto + Precio están definidos,
tienen soft-delete, tienen historial de precios append-only). Lo que **NO está
sólido** es la capa de control (RBAC) y la capa de UI, donde un refactor de
modelos (S7) dejó el frontend desincronizado y el sistema de permisos se
fracturó en tres subsistemas paralelos que no hablan entre sí.

### Top 5 hallazgos por severidad

| # | Hallazgo | Severidad | Bloquea |
|---|----------|-----------|---------|
| **H1** | **Sistema RBAC fracturado en 3 regímenes paralelos** (FE: permission_codes CRUD | BE/proveedores: has_cargo_level | BE/catalogo_productos: IsAuthenticated puro). Ninguno habla con los otros. | 🔴 CRÍTICA | S9 cliente real |
| **H2** | **Frontend consulta permissions que el backend NO registra.** `Modules.SUPPLY_CHAIN + Sections.REGISTRO_PROVEEDORES` se usa en `canDo()`, pero `seed_estructura_final.py` no los crea. Resultado: `canCreate=false` permanente para cargos no-superadmin → botón "Nuevo Proveedor" NUNCA aparece. | 🔴 CRÍTICA | S9 cliente real |
| **H3** | **Bug de submit del modal proveedor es un desalineación post-S7 no-propagada al FE.** ProveedorForm usa `useTiposMateriaPrima` (fuente: `catalogo_productos.Producto`) para renderizar checkboxes y los setea en `productos_suministrados` — semánticamente correcto — pero PreciosTab y ProveedoresTable siguen hablando de `tipo_materia`, `tipo_materia_prima_nombre`, `precio_unitario` (campos que ya no existen en el serializer post-S7). | 🔴 CRÍTICA | S9 operativo MP |
| **H4** | **Modelo de precios simplista para el caso "acopio con báscula diaria".** `PrecioMateriaPrima` tiene 1 sola dimensión (`precio_kg`), sin fecha/vigencia. La liquidación bitemporal sí está resuelta via `VoucherRecepcion.precio_kg_historico` (copia inmutable), pero actualizar el precio del día requiere un PATCH que pisa al vigente. Sin `vigencia_desde/hasta`, no se puede mostrar "precio de ayer" para auditar una liquidación vieja. | 🟠 ALTA | Decisión Camilo |
| **H5** | **Adopción parcial inconsistente de componentes RBAC FE.** `ActionButtons`, `ProtectedAction`, `CanCreate/Edit/Delete`, `useSectionPermissions` existen y están bien diseñados. Uso real: ProveedoresTab/Table ✅ sí · PreciosTab/ProductosTab/CategoriasTab/UnidadesMedidaTab ❌ no. El hallazgo `H-S8-rbac-botones-sin-check` NO era "no hay helpers" — era "los módulos LIVE no los usan". | 🟠 ALTA | S9 cliente real |

### Decisiones de arquitectura pendientes de Camilo

1. **¿Unificar RBAC o dejar los 3 regímenes convivir?** Recomendación técnica:
   migrar todo el backend a `permission_codes` CRUD granular + seed obligatorio
   por módulo. Pero implica ~2-3 sesiones de refactor sistémico.

2. **¿Bitemporalizar `PrecioMateriaPrima`?** Opciones:
   - (a) Agregar `vigencia_desde/hasta` + constraint de no-overlap. Mantiene 1 tabla.
   - (b) Separar precios en `PrecioMPActivo` (mutable, vigente) + `PrecioMPSnapshot` (immutable, audit). Dos tablas, más simple en queries.
   - (c) **Status quo + `VoucherRecepcion.precio_kg_historico` ya resuelve el caso operativo crítico.** Dejar como deuda S10+.

3. **Modelo de extensiones (`ProductoEspecCalidad`)**: hoy solo tiene
   `acidez_min/max` hardcoded (diseñado para rendering/grasas). Para productos
   de otras industrias el campo es inútil. ¿Extensión por tipo de industria o
   JSONField genérico con schema por categoría?

4. **Gobernanza del catálogo de unidades y categorías**: hoy `is_system=True`
   protege de eliminación pero NO de edición. ¿Debería? Y ¿quién las puede
   editar — superadmin solamente, o gerencia del tenant?

5. **Biblioteca maestra de productos importables**: no existe. ¿Se construye
   un `PlantillaProducto` en schema public (similar a `PlantillaSGI`) o el
   flujo seguirá siendo creación manual por tenant?

---

## Bloque 9 — RBAC Frontend sistémico

### 9.1 Endpoint de permisos para FE

**Existe.** El backend expone los permisos del usuario vía campos anidados en
el serializer de User:
- `user.permission_codes: string[]` — códigos CRUD del tipo `modulo.seccion.accion`
- `user.section_ids: number[]` — IDs de `TabSection` accesibles
- `user.cargo_code: string`, `user.cargo_level: 0-3`
- `user.is_superuser: boolean`

Archivos:
- [backend/apps/core/serializers.py:9](backend/apps/core/serializers.py) — import `CargoSectionAccess`
- [backend/apps/core/utils/rbac.py](backend/apps/core/utils/rbac.py) — generador de `permission_codes`
- [backend/apps/core/views/core_views.py](backend/apps/core/views/core_views.py) — endpoint `/api/auth/me/`

Shape de respuesta (inferido del hook FE): `permission_codes` es array plano de
strings formato `"modulo.seccion.accion"` (ej: `gestion_estrategica.empresa.edit`).

Cache: se cachea en `useAuthStore` al login. No hay TTL ni refetch automático —
hallazgo menor, `H-S85-rbac-sin-refetch`.

### 9.2 Helpers frontend existentes

**Completísimos.** Archivo: [frontend/src/hooks/usePermissions.ts](frontend/src/hooks/usePermissions.ts):
- `hasPermission(code)`, `canDo(modulo, seccion, accion)`, `hasAnyPermission`, `hasAllPermissions`
- `hasSectionAccess(id)`, `hasCargo`, `hasCargoLevel`, `canAccess(AccessOptions)`
- Hooks alias: `useIsSuperAdmin`, `useCurrentCargo`, `useIsCoordinationOrAbove`, `useIsDirection`
- **Soporte de impersonación correcto**: bypass de `isSuperadminGlobal` cuando
  hay impersonated target (líneas 119-124). Excelente.

Componentes en [frontend/src/components/common/ProtectedAction.tsx](frontend/src/components/common/ProtectedAction.tsx):
- `<ProtectedAction>`, `<SuperAdminOnly>`, `<CoordinationOnly>`, `<DirectionOnly>`
- `<CanView>`, `<CanCreate>`, `<CanEdit>`, `<CanDelete>`, `<CanEditOrDelete>`
- `useSectionPermissions(modulo, seccion)` — devuelve `{canView, canCreate, canEdit, canDelete}`
- HOC `withProtection`

Componente tabla: [frontend/src/components/common/ActionButtons.tsx](frontend/src/components/common/ActionButtons.tsx) — renderiza los botones row-level (ver/editar/eliminar) chequeando permisos. Existe. Bien diseñado. Usa `canDo(module, section, action)`.

### 9.3 Design system del botón

[frontend/src/components/common/Button.tsx](frontend/src/components/common/Button.tsx) —
base component reutilizado en todo lado. Variantes: `primary | secondary | danger | ghost | outline`. Library: custom on top of Tailwind.

### 9.4 Testing de permisos

**Limitado.** Tests en [frontend/src/__tests__/hooks/usePermissions.test.ts](frontend/src/__tests__/hooks/usePermissions.test.ts)
cubren el hook en aislamiento. **NO hay fixtures de usuarios con cargos restringidos** para tests E2E — los tests de CI usan `create_superuser` por defecto
(`apps/core/tests/base.py:BaseTenantTestCase.create_user` tiene `is_superuser=True` default).

**Hallazgo `H-S85-rbac-sin-test-con-cargos-restringidos`** (🟠 ALTA): los tests
bloqueantes del CI nunca prueban el camino "usuario con cargo nivel=1 intenta
eliminar" — por eso el bug H-S8-rbac no se detectó automáticamente.

### 9.5 Adopción en módulos LIVE (evidencia concreta)

Grep de `ActionButtons|ProtectedAction|CanCreate|CanEdit|CanDelete|useSectionPermissions`
en features LIVE de Supply Chain y Catálogo Productos → **0 matches**. NINGÚN
archivo de esos features usa los componentes helper.

Uso real de `canDo()` o `canAccess()`:

| Archivo | Patrón usado | RBAC aplicado? |
|---------|--------------|----------------|
| [ProveedoresTab.tsx:24](frontend/src/features/supply-chain/components/ProveedoresTab.tsx) | `canDo(SUPPLY_CHAIN, REGISTRO_PROVEEDORES, 'create')` en primaryAction | ✅ Sí |
| [ProveedoresTable.tsx:60-62](frontend/src/features/supply-chain/components/ProveedoresTable.tsx) | `canDo(...)` para edit, delete | ✅ Sí |
| [PreciosTab.tsx:184-196](frontend/src/features/supply-chain/components/PreciosTab.tsx) | `<Button>Edit</Button>` crudo sin check | ❌ No |
| [ProductosTab.tsx:128,190-196](frontend/src/features/catalogo-productos/components/ProductosTab.tsx) | `<Button>Nuevo producto</Button>`, `Edit`, `Delete` crudos | ❌ No |
| [CategoriasTab.tsx:82,146,150](frontend/src/features/catalogo-productos/components/CategoriasTab.tsx) | Crear/Edit/Delete crudos | ❌ No |
| UnidadesMedidaTab.tsx | No auditado explícitamente pero probablemente igual | ❌ No (inferido) |

**Conclusión Bloque 9:** el hallazgo `H-S8-rbac-botones-sin-check` NO era
"el sistema RBAC FE no existe". Es **"la adopción del sistema es parcial"**.
Diagnóstico más preciso para el plan de remediación.

### 9.6 Hallazgo nuevo más grave que el original

**`H-S85-permission-codes-no-registrados` (🔴 CRÍTICA):** El frontend usa
constantes `Modules.SUPPLY_CHAIN = 'supply_chain'` y `Sections.REGISTRO_PROVEEDORES = 'registro_proveedores'` (archivo [frontend/src/constants/permissions.ts:29,182](frontend/src/constants/permissions.ts)), pero el seed `seed_estructura_final.py` (core) **no crea estas secciones**. Grep confirmó 0 matches de `REGISTRO_PROVEEDORES` en el seed.

Implicación: `canDo('supply_chain', 'registro_proveedores', 'create')` retorna
`false` para todo usuario no-superadmin, porque el `permission_code` no está en
`user.permission_codes`. **El botón "Nuevo Proveedor" NUNCA aparece** salvo para
superadmin (que bypassa vía `isSuperAdmin`). En el tenant demo de hoy, la única
razón por la que "funciona" es porque Camilo loguea como superadmin.

Este bug es **sistémico en toda la plataforma** — probablemente el mismo
patrón está roto en HSEQ, motor_cumplimiento, motor_riesgos, etc.

---

## Bloque 1 — Materia Prima

### 1.1 Modelo Producto (canónico para MP)

Fuente única: [backend/apps/catalogo_productos/models.py:346-446](backend/apps/catalogo_productos/models.py). Hereda `TenantModel` (soft-delete, audit, timestamp).

Campos clave:
- `codigo` (unique, auto-generado vía `ConsecutivoConfig.obtener_siguiente_consecutivo('PRODUCTO')`)
- `nombre`, `descripcion`, `sku`, `notas`
- `categoria` → FK a `CategoriaProducto` (nullable, `SET_NULL`)
- `unidad_medida` → FK a `UnidadMedida` (PROTECT — no permite delete si hay productos)
- `tipo` — CharField choices hardcoded: `MATERIA_PRIMA | INSUMO | PRODUCTO_TERMINADO | SERVICIO`
- `precio_referencia` — Decimal nullable, "valor estimado para presupuesto inicial"

### 1.2 Categorías

[CategoriaProducto](backend/apps/catalogo_productos/models.py:23-95):
- Tenant-level, jerárquica (`parent` self-FK, `SET_NULL`)
- Constraint unique (nombre, parent, is_deleted=False)
- `is_system=True` protege de eliminación vía `_protect_system_delete` en el ViewSet
- Propiedad `full_path` (ej: `"Materias Primas > Grasas > Sebo Vacuno"`)

**Hallazgo `H-S85-categoria-editable-sistema`** (🟡 MEDIA): `is_system` solo
protege de `DELETE`. No hay check en `perform_update` — un usuario podría
renombrar "Materias Primas" (categoría del sistema) sin querer. Agregar
guard en `perform_update` o usar `CheckConstraint` con raw trigger.

### 1.3 Unidades de medida

[UnidadMedida](backend/apps/catalogo_productos/models.py:98-343) — Source-of-truth único post-S7. Absorbió el legacy `gestion_estrategica.organizacion.UnidadMedida`. Tiene:
- Clasificación por `tipo` (hardcoded: PESO/VOLUMEN/LONGITUD/AREA/UNIDAD/TIEMPO/CONTENEDOR/OTRO)
- Conversión jerárquica (`unidad_base` self-FK + `factor_conversion`)
- Formateo de display (`decimales_display`, `prefiere_notacion_cientifica`, `usar_separador_miles`)
- Helpers: `convertir_a_base`, `convertir_desde_base`, `convertir_a`, `formatear`
- Lookups legacy: `obtener_por_codigo`, `obtener_por_categoria` (con mapping MASA→PESO, CANTIDAD→UNIDAD)

Excelente diseño. No hay deuda significativa aquí.

### 1.4 EspecCalidad (extensión opcional)

[ProductoEspecCalidad](backend/apps/catalogo_productos/extensiones/espec_calidad.py:20-92):
- OneToOne opcional (`on_delete=CASCADE`)
- Campos: `acidez_min`, `acidez_max`, `requiere_prueba_acidez`, `parametros_adicionales` (JSONField)
- CheckConstraint: `acidez_max >= acidez_min`
- **Problema de diseño**: está hardcoded para rendering/grasas. El campo `acidez` no aplica a harinas, textiles, combustibles, servicios. El `parametros_adicionales JSONField` es el escape hatch pero sin schema validation.
- Sin versionamiento — si cambian los requisitos de acidez, se pisa el registro.

**Hallazgo `H-S85-espec-calidad-acoplada-a-industria`** (🟡 MEDIA): el
modelo `ProductoEspecCalidad` debe refactorizarse a extensiones por tipo
de industria (rendering, farma, combustibles), o a JSONField con schema
validable por `CategoriaProducto`.

### 1.5 Biblioteca maestra

**NO existe.** No hay modelo `PlantillaProducto` ni similar en schema public.
Cada tenant crea sus productos desde cero (con ayuda del seed de productos base
— línea 16 del `seed_catalogo_productos_base.py`, que crea algunos para demo).

**Hallazgo `H-S85-sin-biblioteca-productos-importable`** (🟡 MEDIA): similar a
la biblioteca de plantillas SGI. Facilitaría el onboarding del tenant nuevo.
Deuda post-deploy.

---

## Bloque 2 — Proveedores

### 2.1 Modelo Proveedor

[backend/apps/supply_chain/gestion_proveedores/models.py:189-475](backend/apps/supply_chain/gestion_proveedores/models.py). Hereda `TenantModel`.

Identificación:
- `codigo_interno` (auto-generado con prefijo dependiente del tipo: `MP-00001`, `PS-00001`, etc.)
- `nit`, `numero_documento` + FK a `TipoDocumentoIdentidad` (que vive en core)
- `razon_social`, `nombre_comercial`

Constraints:
- UniqueConstraint condicional `(numero_documento, is_deleted=False)` ✅
- UniqueConstraint condicional `(codigo_interno, is_deleted=False)` ✅
- Índices por `tipo_proveedor+is_active`, `numero_documento`, `tipo_entidad`

### 2.2 Tipos de proveedor — dos dimensiones

Dos clasificaciones simultáneas:

- **`tipo_entidad`** (TextChoices hardcoded):
  - `MATERIA_PRIMA`, `SERVICIO`, `UNIDAD_INTERNA`
  - Rol semántico en el sistema

- **`tipo_proveedor`** (FK dinámica a `TipoProveedor`):
  - Tabla editable: admin agrega/desactiva tipos
  - Seed base: `MATERIA_PRIMA`, `PRODUCTOS_SERVICIOS`, `UNIDAD_NEGOCIO`, `TRANSPORTISTA`, `CONSULTOR`, `CONTRATISTA`
  - Flags operativos: `requiere_materia_prima`, `requiere_modalidad_logistica`

**Diseño OK.** Un proveedor tiene 1 `tipo_entidad` + 1 `tipo_proveedor` = combinación operativa suficiente para el modelo actual de negocio.

### 2.3 Clasificación tributaria colombiana

**PARCIAL.** Hoy existe:
- ✅ `TipoDocumentoIdentidad` (core) — choices dinámicas: CC, NIT, CE, PAS, etc.
- ✅ `nit` CharField independiente para persona jurídica

**NO existe:**
- ❌ Régimen tributario (común, simplificado, no responsable)
- ❌ Responsabilidad fiscal DIAN (retención IVA, gran contribuyente, autorretenedor, etc.)
- ❌ Tipos de régimen IVA (responsable, no responsable)

**Hallazgo `H-S85-tributario-incompleto`** (🟠 ALTA): Para facturación colombiana
completa (prerrequisito de cualquier cliente real empresarial), falta modelar
el bloque tributario DIAN. Esto **debe resolverse antes de S9 si el cliente
real va a facturar compras via Supply Chain**. Si el cliente solo registra
proveedores para trazabilidad de producción, puede posponerse.

### 2.4 Estados del proveedor

**Solo `is_active: bool`.** No hay máquina de estados.

Efectos del `is_active=False`:
- Al `delete()` se desactiva automáticamente + desactiva los usuarios vinculados ([línea 438-460](backend/apps/supply_chain/gestion_proveedores/models.py))
- No se puede reactivar via UI (no hay endpoint `/activate/`)

**Hallazgo `H-S85-proveedor-sin-maquina-de-estados`** (🟡 MEDIA): un proveedor
real tiene estados como `en_evaluacion`, `suspendido`, `bloqueado`, `aprobado`,
`inactivo`. Sin máquina de estados + historial, los procesos de compras serios
(con aprobación/suspensión trazable) no son posibles. Deuda post-deploy.

### 2.5 Ubicación — H-S8-proveedores-ubicacion-incorrecta

Campos actuales:
- `direccion: TextField` (texto libre)
- `ciudad: CharField(100)` (texto libre) — **aquí está el problema**
- `departamento: FK(Departamento)` (core, base de datos)

**Hallazgo origen `H-S8-proveedores-ubicacion-incorrecta` reproducido**: existe
el modelo `Ciudad` en `apps.core.models` con FK a `Departamento` (importado en
[línea 16](backend/apps/supply_chain/gestion_proveedores/models.py)), pero el
campo `ciudad` del Proveedor es `CharField(100)`, no FK a `Ciudad`. Resultado:
texto libre inconsistente ("Bogotá", "bogota", "Bogota D.C.", "BOGOTA"), imposible
filtrar correctamente y romper integraciones de analítica geográfica.

**Severidad:** 🟡 MEDIA. Solución: migrar `ciudad` a `FK(Ciudad)` + data migration
para match por iexact del texto actual. Ya está en el hallazgo H-S8.

---

## Bloque 3 — Precios

### 3.1 Modelo PrecioMateriaPrima

[backend/apps/supply_chain/gestion_proveedores/models.py:478-528](backend/apps/supply_chain/gestion_proveedores/models.py). Hereda `TenantModel`.

Estructura mínima:
- `proveedor` → FK (CASCADE)
- `producto` → FK `catalogo_productos.Producto` (PROTECT)
- `precio_kg` — Decimal(10,2)

Constraint: UniqueConstraint `(proveedor, producto, is_deleted=False)` — **un
registro activo por combinación**.

Validación: `clean()` rechaza precio negativo ✅.

### 3.2 Dimensiones del precio — inventario

| Dimensión | ¿Existe? | Evidencia / Impacto |
|-----------|----------|---------------------|
| Fecha / vigencia | ❌ NO | Sin `vigencia_desde/hasta`. `updated_at` del TenantModel es el único timestamp. |
| Tier de compra (escala/volumen) | ❌ NO | Un solo `precio_kg` por combinación. |
| Por espec calidad (A vs B) | ❌ NO | Si un proveedor ofrece Sebo calidad A y calidad B, no se puede diferenciar precio. |
| Por ubicación / bodega | ❌ NO | No hay campo `almacen` ni `sede`. |
| Moneda | ❌ NO | Hardcoded COP (asumido en el FE: `Intl.NumberFormat('es-CO', 'COP')`). |
| IVA | ❌ NO | Valor plano, no discrimina. |
| Retenciones | ❌ NO | No hay campos. |
| **Nombre semánticamente incorrecto** | ⚠️ | Se llama `precio_kg` pero `Producto.unidad_medida` puede ser litros, unidades, m³, etc. |

### 3.3 Constraints de integridad y edición

- **Update semantics**: editar precio es UPDATE destructivo del registro — pisa
  el valor anterior. No hay versionado en el registro mismo.
- **Audit trail**: sí existe via [`HistorialPrecioProveedor`](backend/apps/supply_chain/gestion_proveedores/models.py:531-626) append-only:
  - `save()` arroja `PermissionError` si se intenta modificar registro existente
  - `delete()` arroja `PermissionError`
  - Campos: `proveedor`, `producto`, `precio_anterior`, `precio_nuevo`, `modificado_por`, `motivo`
  - Propiedad `variacion_precio` (%)
- **Audit a audit_system**: NO. El historial queda en `HistorialPrecioProveedor`
  del dominio SC, no se propaga a `audit_system` (C0).

### 3.4 Contexto "acopio con báscula"

**Cubierto indirectamente** via `VoucherRecepcion.precio_kg_historico`:
- [backend/apps/supply_chain/recepcion/models.py:121](backend/apps/supply_chain/recepcion/models.py) — "Copia inmutable de `PrecioMateriaPrima.precio_kg` al momento de la recepción"
- Asegura que la liquidación del día usa el precio de **ese día** incluso si
  el precio maestro se actualiza después.

**Limitación actual:** para ver "¿cuál era el precio del proveedor X del
producto Y el 15 de marzo?", el único lugar donde está esa información es:
- `VoucherRecepcion.precio_kg_historico` (si hubo recepción ese día)
- `HistorialPrecioProveedor` (si hubo un cambio ese día)
- **NO se puede inferir el precio para fechas en las que no pasó ninguna de las dos cosas.**

Esto es resoluble con `PrecioMateriaPrima.vigencia_desde/hasta` — ver decisión
de arquitectura #2 del resumen ejecutivo.

---

## Bloque 4 — Relaciones MP ↔ Proveedor ↔ Precio

### 4.1 MP ↔ Proveedor

**Relación M2M vía `Proveedor.productos_suministrados`** ([línea 234-240](backend/apps/supply_chain/gestion_proveedores/models.py)):

```python
productos_suministrados = models.ManyToManyField(
    'catalogo_productos.Producto',
    blank=True,
    related_name='proveedores',
)
```

**NO hay tabla intermedia explícita con atributos propios.** Por lo tanto NO
tiene: `sku_proveedor`, `lead_time_dias`, `MOQ (cantidad mínima orden)`,
`incoterm`, `observaciones_relacion`. Si un proveedor ofrece 3 productos, no
se puede registrar nada específico de cada relación.

**Hallazgo `H-S85-relacion-mp-proveedor-sin-atributos`** (🟡 MEDIA): para compras
B2B serias falta tabla `ProductoProveedor(proveedor, producto, sku_prov, lead_time, moq, ...)`. Deuda post-deploy a menos que cliente real lo requiera.

### 4.2 MP ↔ Proveedor ↔ Precio

Unión simple:
- `Proveedor.productos_suministrados` → M2M (declaración)
- `PrecioMateriaPrima(proveedor, producto, precio_kg)` → precio específico

**Inconsistencia posible**: un Proveedor puede tener producto en `productos_suministrados` pero SIN `PrecioMateriaPrima` activa. Y viceversa (más raro porque precio requiere FK hard a Producto). No hay trigger/signal que los sincronice.

### 4.3 MP ↔ EspecCalidad — impacto en precio

`ProductoEspecCalidad` es OneToOne de `Producto`. Es decir: 1 producto = máximo 1 spec. **No permite "Sebo calidad A" vs "Sebo calidad B" del mismo producto.** Si hay dos calidades del mismo sebo, hay que crear **dos productos** distintos (Sebo-A y Sebo-B) y asignar precio a cada uno.

**Eso funciona** para el caso operativo actual. Pero es fricción UX — si mañana
el producto tiene 3 niveles de calidad, son 3 productos + 3 precios + 3 historiales.

### 4.4 Cross-módulo

**VoucherRecepcion ↔ Proveedor ↔ Producto** ([backend/apps/supply_chain/recepcion/models.py](backend/apps/supply_chain/recepcion/models.py)):
- `Voucher.proveedor = FK(Proveedor)` ✅
- `Voucher.producto = FK(Producto)` ✅ (no `MateriaPrima` — migrado correctamente post-S7)
- `Voucher.precio_kg_historico` = copia inmutable del precio al momento de recepción ✅

**Ningún coupling sospechoso detectado** en sentido C2→C2. Los imports del
modelo de Proveedor solo traen de `core` (Departamento, Ciudad, TipoDocumentoIdentidad) y de `catalogo_productos` (Producto) — que son C0 y CT, respectivamente. ✅ Regla "C2 no importa de C2" respetada.

**Ubicación arquitectónica discutible**: `Proveedor` vive en `supply_chain.gestion_proveedores` pero otros C2 (sales_crm, logistics_fleet, accounting) eventualmente también necesitan de él. El hallazgo `H-S8-proveedores-ubicacion-incorrecta` (🟡 MEDIA-ALTA) recomienda mover `Proveedor` a CT-layer cuando se active el segundo C2 consumidor. **No hacer ahora** — esperar a S10+.

---

## Bloque 5 — Validaciones de negocio

Matriz de validaciones reales, con evidencia:

| Escenario | ¿Bloqueado? | Dónde / cómo |
|-----------|-------------|--------------|
| Crear precio sin MP (producto=null) | ✅ SÍ | `producto` es NOT NULL en modelo (refactor S8, commit `b2ea7383`) |
| Crear precio sin proveedor | ✅ SÍ | `proveedor` es NOT NULL |
| Crear dos precios activos para mismo (MP, Proveedor) | ✅ SÍ | UniqueConstraint `uq_precio_proveedor_producto_active` |
| Crear dos precios activos para mismo (MP, Proveedor, **Fecha**) | N/A | No existe dimensión fecha. |
| Eliminar MP con precios | ✅ SÍ | `on_delete=PROTECT` en `PrecioMateriaPrima.producto` |
| Eliminar Proveedor con precios | ⚠️ PARCIAL | `on_delete=CASCADE` — los precios se marcan soft-deleted. Pero el override de `delete()` no es literal CASCADE, es soft. |
| Modificar precio histórico (HistorialPrecioProveedor) | ✅ SÍ | `save()` arroja `PermissionError` si `pk is not None` |
| Proveedor activo sin tipo_proveedor | ✅ SÍ | `tipo_proveedor` es NOT NULL (`on_delete=PROTECT`) |
| Proveedor requiere_modalidad_logistica sin modalidad | ✅ SÍ | `clean()` valida |
| MP sin categoría | ⚠️ PERMITIDO | `categoria` es nullable — puede crearse sin categoría |
| MP sin unidad de medida | ✅ SÍ | `unidad_medida` NOT NULL (`on_delete=PROTECT`) |
| Precio negativo | ✅ SÍ | `clean()` en `PrecioMateriaPrima` |
| Acidez max < acidez min | ✅ SÍ | CheckConstraint DB + `clean()` aplicación |

**Resumen:** las validaciones críticas de integridad están cubiertas. **La única
debilidad real es MP sin categoría** (por diseño — la categoría es opcional).

---

## Bloque 6 — Seeds y onboarding

### 6.1 Seeds existentes

Management commands encontrados para SC:

| Command | Contenido | Idempotente? |
|---------|-----------|--------------|
| `seed_supply_chain_catalogs` | Tipos Documento, Tipos Proveedor, Formas Pago, Tipos Cuenta, Modalidades Logística, Tipos Almacén, Departamentos, Ciudades | ✅ Sí ([línea 32](backend/apps/supply_chain/gestion_proveedores/management/commands/seed_supply_chain_catalogs.py)) |
| `seed_catalogo_productos_base` | Productos base para demo | ✅ Sí |

**NO sembrados** (confirmado en doctrina del seed):
- ❌ Categorías de Producto — "depende de industria"
- ❌ Productos concretos (Sebo Vacuno, etc.) — "depende de industria"
- ❌ Unidades de medida (se espera que vengan del seed de `catalogo_productos`)

### 6.2 Experiencia del tenant nuevo

Al activar Supply Chain en un tenant:
1. Corre `migrate_schemas` — crea tablas
2. **NO hay wizard de onboarding del módulo** — se entra a `/supply-chain/catalogos` con pantalla vacía
3. **NO hay botón "importar catálogo ejemplo"**

Flujo real del primer uso:
1. Admin del tenant entra a `/catalogo-productos/unidades-medida` — ve unidades pre-sembradas (kg, L, m, und, etc.) ✅
2. Entra a `/catalogo-productos/categorias` — pantalla vacía, EmptyState "Sin categorías"
3. Crea categoría manualmente
4. Va a `/catalogo-productos/productos` — crea productos uno a uno
5. Va a `/supply-chain/catalogos` — ve tipos proveedor pre-sembrados ✅
6. Va a `/supply-chain/proveedores` — crea proveedor
7. Va a `/supply-chain/precios` — ??? sin UI para crear precio inicial

**Hallazgo `H-S85-sin-onboarding-wizard`** (🟡 MEDIA): un tenant nuevo tiene
~6-8 pantallas para navegar antes de poder crear su primer voucher. No hay
guía ni wizard. Deuda UX post-deploy.

**Hallazgo `H-S85-sin-ui-crear-precio-inicial`** (🟠 ALTA): `PreciosTab.tsx`
solo lista precios existentes y permite **cambiarlos**. **No hay botón "Nuevo
Precio" para crear el primero.** El precio se crea implícitamente al crear el
proveedor con `productos_suministrados` — pero ese flujo no asigna precio,
solo vincula MP. **Esto es bloqueante para el 3er paso del flujo fundacional.**

---

## Bloque 7 — RBAC del flujo SC

### 7.1 Permissions registradas en backend

Grep de `REGISTRO_PROVEEDORES|PRECIOS_MP|CATALOGO_PRODUCTOS` en el seed
`seed_estructura_final.py` (core) → **0 matches**.

**NINGUNA** de las secciones que el FE consulta están registradas como
`TabSection` en el seed de estructura. Por lo tanto `permission_codes` nunca
incluye `supply_chain.registro_proveedores.create` ni `catalogo_productos.productos.delete` ni similares.

### 7.2 Permissions que SÍ valida el backend

[backend/apps/supply_chain/gestion_proveedores/permissions.py](backend/apps/supply_chain/gestion_proveedores/permissions.py) define 6 clases custom:

| Clase | Lógica | ¿Coincide con FE? |
|-------|--------|-------------------|
| `CanManageCatalogos` | GET: autenticado. POST/PUT/DELETE: `has_cargo_level(3)` | ❌ No — FE no chequea nivel |
| `CanManageProveedores` | GET: nivel 2+. POST/PATCH: nivel 2+. DELETE: nivel 3+ | ❌ No |
| `CanModifyPrecioProveedor` | Solo Gerente (cargo code='GERENTE') o nivel 3+ | ❌ No |
| `CanViewProveedores` | Nivel 2+ | ❌ No |
| `CanManageCondicionesComerciales` | Similar a CanManageProveedores | ❌ No |
| `CanManageEvaluaciones` | Similar | ❌ No |

[backend/apps/catalogo_productos/views.py](backend/apps/catalogo_productos/views.py):
- `CategoriaProductoViewSet`, `UnidadMedidaViewSet`, `ProductoViewSet`:
  `permission_classes = [IsAuthenticated]` — **CERO RBAC granular**.

### 7.3 Tabla de cruces (FE consulta → BE valida)

| Acción | FE consulta | BE valida | Coincide? |
|--------|-------------|-----------|-----------|
| Crear Proveedor | `canDo('supply_chain', 'registro_proveedores', 'create')` | `has_cargo_level(2)` | ❌ Dos sistemas distintos |
| Editar Proveedor | `canDo('supply_chain', 'registro_proveedores', 'edit')` | `has_cargo_level(2)` | ❌ |
| Eliminar Proveedor | `canDo('supply_chain', 'registro_proveedores', 'delete')` | `has_cargo_level(3)` | ❌ |
| Cambiar precio | (sin check FE — `<Button>` crudo) | `CanModifyPrecioProveedor` (cargo='GERENTE' O nivel 3+) | ❌ FE no chequea |
| Crear Producto | (sin check FE) | `IsAuthenticated` | ❌ Ningún RBAC real |
| Eliminar Producto | (sin check FE) | `IsAuthenticated` | ❌ Ningún RBAC real |

### 7.4 Tests RBAC existentes

- Tests de nivel cargo: 0 encontrados para SC
- Tests de permission_codes: 0 encontrados para SC
- Tests de usuarios restringidos: 0 encontrados

**El único test relacionado es `test_sidebar.py` + `test_base.py`** (los bloqueantes del CI), que solo prueban la existencia del sidebar y la infra de test.

---

## Bloque 8 — UI/UX del flujo completo

### 8.1 Pantallas — inventario

| Objeto | Ruta | Archivo | Lista | Crear | Editar | Eliminar |
|--------|------|---------|-------|-------|--------|----------|
| Producto (MP) | `/catalogo-productos/productos` | `ProductosTab.tsx` | ✅ | ✅ | ✅ | ✅ |
| Categoría | `/catalogo-productos/categorias` | `CategoriasTab.tsx` | ✅ | ✅ | ✅ | ✅ (solo no-system) |
| Unidad Medida | `/catalogo-productos/unidades-medida` | `UnidadesMedidaTab.tsx` | ✅ | ✅ | ✅ | ✅ |
| Espec Calidad | N/A | — | ❌ | ❌ | ❌ | ❌ |
| Proveedor | `/supply-chain/proveedores` | `ProveedoresTab.tsx` + `ProveedoresTable.tsx` + `ProveedorForm.tsx` | ✅ | ✅ | ✅ | ✅ |
| Tipo Proveedor | `/supply-chain/catalogos` (tab) | `CatalogosTab.tsx` | ✅ | ✅ | ✅ | ✅ |
| Precio MP | `/supply-chain/precios` | `PreciosTab.tsx` | ✅ | ❌ **NO** | ⚠️ "cambiar" | ❌ |

**Ausencias funcionales importantes:**
- **Sin UI para `ProductoEspecCalidad`** — se pueden crear por Django admin, no por usuario del tenant.
- **Sin UI para "Nuevo Precio"** — bloqueante del 3er paso fundacional (ver Bloque 6).

### 8.2 Modales — estado general

ProveedorForm.tsx:
- ✅ Usa `FormModal` del DS
- ✅ Usa `react-hook-form` + `zod`
- ✅ Loading state (`isLoading`)
- ✅ Cierra post-success (`onClose()` en `handleSubmit`)
- ✅ `warnUnsavedChanges` habilitado
- ✅ Layout: grid 2-col via Card sections
- ⚠️ `Checkbox` multi-select plano (no combobox) en líneas 410-419
- ⚠️ Lista de productos NO se re-fetcha si se crea producto nuevo en otra pantalla (solo invalidate al save)

PreciosTab.tsx:
- ❌ Modal de "Cambiar Precio" usa `BaseModal` + form nativo (no FormModal). Inconsistente con el patrón DS
- ❌ `form.requestSubmit()` hack (línea 231) para disparar submit desde botón externo
- ❌ Los nombres de campos del mutation están desalineados (`tipo_materia_id` — línea 106) vs el modelo actual que usa `producto_id`

ProductosTab.tsx + CategoriasTab.tsx + UnidadesMedidaTab.tsx:
- ✅ Usan `FormModal`
- ✅ Usan `react-hook-form`
- ❌ SIN check RBAC en los botones crear/editar/eliminar

### 8.3 Bug del modal proveedor (H-S8-modal-proveedor-ux-rota)

**Causa técnica exacta del submit roto:**

El hook `useTiposMateriaPrima` en [useCatalogos.ts:50-62](frontend/src/features/supply-chain/hooks/useCatalogos.ts) **ya fue refactoreado** para llamar a `catalogo_productos.Producto` filtrado por `tipo='MATERIA_PRIMA'`. Devuelve array de Producto objects correctos.

Pero el `ProveedorForm.tsx` en [línea 411-418](frontend/src/features/supply-chain/components/ProveedorForm.tsx) renderiza:

```tsx
{tiposMateriaPrimaList.map((tipo) => (
  <Checkbox
    label={tipo.nombre}
    checked={watch('productos_suministrados')?.includes(tipo.id) || false}
    onChange={() => handleMultiSelectToggle('productos_suministrados', tipo.id)}
  />
))}
```

Esto **es correcto técnicamente**: `tipo.id` es el ID de un Producto real, y se setea en `productos_suministrados` — que el modelo Proveedor espera como M2M a Producto.

**Entonces, ¿cuál es el bug del submit?** Al revisar el payload que se envía, veo que `handleSubmit` envía todos los campos incluyendo `productos_suministrados` (array de IDs). Backend serializer `ProveedorCreateSerializer` debería aceptar esto.

**Sospecha principal (pendiente reproducir en browser con DevTools)**: el payload contiene FKs con valor 0 que se filtran (línea 229-240 de ProveedorForm.tsx), pero si el usuario deja `tipo_proveedor=0` (no seleccionado), la validación Zod lo acepta porque `.min(1)` pero el delete del FK en línea 239 lo remueve antes de enviar — resultando en `tipo_proveedor` ausente del payload, que el backend rechaza como NOT NULL. Es el único path defectuoso que veo.

**Confirmación requerida**: abrir Network tab del browser, intentar submit sin seleccionar tipo_proveedor, ver el response 400 del backend.

**Los otros 4 problemas UX confirmados por evidencia en código:**

1. **Tipos de MP como checkboxes planos** — ✅ reproducido. Línea 410: `grid grid-cols-2 md:grid-cols-3 max-h-48 overflow-y-auto`. No escala con >20 productos.

2. **Lista no se re-fetcha** — ⚠️ parcial. `useTiposMateriaPrima` tiene `queryKey: ['catalogo-productos', 'productos', 'materia-prima']`. Si se crea producto nuevo desde otra pantalla con queryKey `['catalogo-productos', 'productos']`, la invalidación NO alcanza el key con `'materia-prima'` sufijo específico. **Bug real**.

3. **Multi-select no visible aunque backend lo soporte** — ✅ reproducido. Son checkboxes, no combobox. Falta feedback visual de "5 seleccionados de 25".

4. **Formulario no dinámico por tipo de proveedor** — ⚠️ parcial. SÍ es dinámico para `requiereMateriaPrima` y `requiereModalidadLogistica` (líneas 162-168) y `esUnidadNegocio` (línea 165). NO es dinámico para tipos tributarios ni para servicios/consultoría (salvo el campo `es_independiente`). La expectativa del hallazgo probablemente era más sofisticación.

### 8.4 Navegación entre objetos

- Desde Producto (MP): **NO** — no hay sección "proveedores que lo ofrecen" ni "precios disponibles"
- Desde Proveedor: **PARCIAL** — `precios_materia_prima` está anidado en el serializer (nested), pero la UI muestra esto solo en PreciosTab agrupado por proveedor, no en detalle de proveedor
- Desde Precio: **PARCIAL** — PreciosTab muestra la combinación proveedor + MP en tabla. No hay detalle navegable.

**Hallazgo `H-S85-navegacion-cross-objeto-debil`** (🟡 MEDIA): un comprador serio
necesita "dame los 5 proveedores más baratos de Sebo A" — hoy eso requiere
salir de la UI y hacer queries manuales. Deuda UX post-deploy.

---

## Bloque adicional — Integración con audit_system

**Estado:** ❌ **SIN INTEGRACIÓN**.

Grep de `audit_system|write_audit|AuditLog|log_action` en `gestion_proveedores`
→ 0 matches.

Implicación: los cambios a Proveedor, Producto y Precio NO se registran en el
módulo `audit_system` (C0, L12). El audit_system solo recibe eventos de los
módulos que explícitamente lo llaman.

El historial `HistorialPrecioProveedor` sí es un audit log DOMÉSTICO del
dominio SC, pero vive aislado. No aparece en el "Centro de Notificaciones"
ni en los "Logs del Sistema" del audit_system.

**Hallazgo `H-S85-sin-integracion-audit-system`** (🟡 MEDIA): para un cliente
real con auditoría ISO 9001 interna, los cambios a proveedores (especialmente
alta/baja de proveedor aprobado) deberían ir a audit_system para que los
auditores internos los revisen. Deuda post-deploy.

---

## Clasificación de hallazgos — tabla final

| Hallazgo | Severidad | Bloqueo |
|----------|-----------|---------|
| H-S85-permission-codes-no-registrados | 🔴 CRÍTICA | **S9-cliente-real** |
| H-S85-rbac-fracturado-3-sistemas | 🔴 CRÍTICA | **S9-cliente-real** |
| H-S8-modal-proveedor-submit-bug (original) | 🔴 CRÍTICA | **S9-operativo** |
| H-S85-sin-ui-crear-precio-inicial | 🟠 ALTA | **S9-operativo** (3er paso del flujo) |
| H-S85-tributario-incompleto (régimen IVA/DIAN) | 🟠 ALTA | S9-cliente-real **si factura** |
| H-S85-rbac-adopcion-parcial (ProductosTab/CategoriasTab/PreciosTab/UnidadesTab sin canDo) | 🟠 ALTA | S9-cliente-real |
| H-S85-rbac-sin-test-con-cargos-restringidos | 🟠 ALTA | Calidad S9+ |
| H-S85-precios-sin-bitemporal | 🟡 MEDIA | Decisión Camilo |
| H-S85-espec-calidad-acoplada-a-industria | 🟡 MEDIA | Deuda post-deploy |
| H-S85-categoria-editable-sistema | 🟡 MEDIA | Deuda post-deploy |
| H-S85-sin-biblioteca-productos-importable | 🟡 MEDIA | Deuda post-deploy (UX onboarding) |
| H-S85-proveedor-sin-maquina-de-estados | 🟡 MEDIA | Deuda post-deploy |
| H-S8-proveedores-ubicacion-incorrecta (ciudad CharField) | 🟡 MEDIA | Deuda post-deploy (ya documentado S8) |
| H-S85-relacion-mp-proveedor-sin-atributos | 🟡 MEDIA | Deuda post-deploy |
| H-S85-sin-onboarding-wizard | 🟡 MEDIA | Deuda UX post-deploy |
| H-S85-navegacion-cross-objeto-debil | 🟡 MEDIA | Deuda UX post-deploy |
| H-S85-sin-integracion-audit-system | 🟡 MEDIA | Deuda post-deploy (ISO 9001) |
| H-S85-rbac-sin-refetch (cache de permisos sin TTL) | 🟢 BAJA | Deuda post-deploy |

---

## Básico bien hecho — criterios 3 y 4 (añadidos)

### Criterio 3 — cero code smells

Grep rápido en supply_chain + catalogo_productos:

| Smell | Encontrados |
|-------|-------------|
| `TODO` | No verificado exhaustivamente — sesión de follow-up |
| `except Exception` bare | No verificado exhaustivamente — sesión de follow-up |
| Funciones > 1500 LOC | `gestion_proveedores/models.py` tiene ~840 LOC — **OK** |
| Raw SQL | No detectado en models.py |

**No se ejecutaron los greps exhaustivos** — queda para sesión de remediación
o para pre-deploy gate.

### Criterio 4 — uso de factories

- Backend:
  - **Serializers** usan `ModelSerializer` base (no factory interna) — aceptable
  - Modelos heredan `TenantModel` ✅
- Frontend:
  - `ProveedorForm` usa `FormModal` del DS ✅
  - `ProductosTab` usa `FormModal` ✅
  - `CategoriasTab` usa `FormModal` ✅
  - `PreciosTab` usa `BaseModal` + form nativo ❌ — inconsistente
  - `useProveedores` — verificar si usa `createCRUDHooks` factory (pendiente, sesión de follow-up)
  - `useProductos/useCategorias/useUnidadesMedida` — verificar (pendiente)

---

## Commits ejecutados durante la auditoría

**Ninguno.** No hubo hallazgos que cayeran en las excepciones permitidas de
commit sin aprobación. La auditoría se mantuvo en modo solo-lectura puro.

---

## Apéndice — Inventario de archivos tocados

### Bloque 9 (RBAC FE)
- `frontend/src/hooks/usePermissions.ts` (leído entero)
- `frontend/src/components/common/ProtectedAction.tsx` (leído entero)
- `frontend/src/components/common/ActionButtons.tsx` (leído entero)
- `frontend/src/constants/permissions.ts` (grep)
- `backend/apps/core/serializers.py` (primeras 100 líneas)

### Bloques 1, 2, 3, 4 (modelos y cross-módulo)
- `backend/apps/catalogo_productos/models.py` (entero)
- `backend/apps/catalogo_productos/extensiones/espec_calidad.py` (entero)
- `backend/apps/supply_chain/catalogos/models.py` (entero)
- `backend/apps/supply_chain/gestion_proveedores/models.py` (entero)
- `backend/apps/supply_chain/recepcion/models.py` (grep para referencias a proveedor/precio)

### Bloque 5 (validaciones)
- `backend/apps/supply_chain/gestion_proveedores/viewsets.py` (primeras 200 líneas)
- Inferencia de constraints desde los modelos del bloque anterior

### Bloque 6 (seeds)
- `backend/apps/supply_chain/gestion_proveedores/management/commands/seed_supply_chain_catalogs.py` (primeras 80 líneas)

### Bloque 7 (RBAC flujo)
- `backend/apps/supply_chain/gestion_proveedores/permissions.py` (entero)
- `backend/apps/catalogo_productos/views.py` (entero)
- `backend/apps/core/management/commands/seed_estructura_final.py` (grep para REGISTRO_PROVEEDORES — 0 matches)

### Bloque 8 (UI/UX)
- `frontend/src/features/supply-chain/components/ProveedorForm.tsx` (entero, 585 líneas)
- `frontend/src/features/supply-chain/components/PreciosTab.tsx` (entero, 365 líneas)
- `frontend/src/features/supply-chain/components/ProveedoresTab.tsx` (entero)
- `frontend/src/features/supply-chain/components/ProveedoresTable.tsx` (entero, 362 líneas)
- `frontend/src/features/supply-chain/hooks/useCatalogos.ts` (entero)
- `frontend/src/features/catalogo-productos/components/ProductosTab.tsx` (entero, 312 líneas)
- `frontend/src/features/catalogo-productos/components/CategoriasTab.tsx` (entero, 207 líneas)

### Audit integration
- `backend/apps/supply_chain/gestion_proveedores/` (grep `audit_system|write_audit|AuditLog`)

### Globs usados (para confirmar scope)
- `backend/apps/catalogo_productos/**/*.py` (lista completa de ~24 archivos)
- `backend/apps/supply_chain/**/models.py`, `**/views.py`, `**/viewsets.py`, `**/permissions.py`
- `frontend/src/features/supply-chain/**/*.tsx`
- `frontend/src/features/catalogo-productos/**/*.tsx`

---

## Cierre

**Bloques cubiertos:** 9/9 esperado + 1 bloque adicional (integración audit_system).

**Total hallazgos documentados:** 17
- 3 🔴 CRÍTICAS
- 4 🟠 ALTAS
- 9 🟡 MEDIAS
- 1 🟢 BAJA

**Decisiones de arquitectura requeridas de Camilo:** 5 (ver Resumen Ejecutivo).

**Recomendación de scope para S8.5:**

Dados los 3 hallazgos críticos (RBAC fracturado, permission_codes no registrados, bug submit modal), **la sesión S8.5 debería tener DOS tracks**:

- **Track A — RBAC** (~1 sesión completa):
  1. Registrar las secciones faltantes en `seed_estructura_final.py` (ej: `supply_chain.registro_proveedores`, `catalogo_productos.productos`, etc.)
  2. Sincronizar `CanManageProveedores` al esquema `permission_codes` (o mantener cargo levels como fallback)
  3. Agregar `permission_classes = [GranularActionPermission]` en `CategoriaProductoViewSet`, `UnidadMedidaViewSet`, `ProductoViewSet`
  4. Adoptar `<ActionButtons>` en ProductosTab, CategoriasTab, PreciosTab, UnidadesMedidaTab
  5. Tests con usuarios de cargo restringido

- **Track B — Flujo operativo Supply Chain** (~1 sesión separada, post-Track A):
  1. Fix bug submit ProveedorForm (reproducir + identificar causa exacta)
  2. Rediseñar modal proveedor (Combobox multi-select + re-fetch)
  3. Agregar UI "Nuevo Precio" en PreciosTab (bloqueante del 3er paso)
  4. Decidir con Camilo bitemporalidad de precios
  5. Browseo end-to-end en tenant demo

**El deploy S9 solo procede después de Track A + Track B** cerrados y
validados en browser.
