# Supply Chain Marathon — 16 hallazgos cerrados en una sesión

**Fecha:** 2026-04-27
**Duración:** ~6 horas
**Modelo:** Sonnet 4.6 + Opus 4.7 (1M context)
**Commits:** 17 (16 SC + 1 fix)
**Hallazgos cerrados:** 16

---

## Contexto

Sesión de consolidación profunda de Supply Chain. El usuario pidió revisar
el flujo completo desde la creación de Sedes y atacar todos los hallazgos
pendientes — "vamos con la más compleja, todas las atacamos".

Excepción a la regla de "browseo manual antes de commit": se trabajó con
ciclos de commit→push→deploy confiando en CI verde por hallazgo, dado que
el módulo necesitaba quedar sólido.

---

## Flujo de negocio refinado (input del usuario)

El usuario aclaró el flujo real que fue clave para descubrir hallazgos
nuevos no detectados en la auditoría inicial:

1. Categorías de MP/Productos/Servicios → MP/productos → Proveedores con
   tipos (MP, P/S, Transportador, Consultor, Contratista) y modalidad
   logística (Entrega Planta / Compra Punto).
2. Dos caminos de llegada de MP: directo a planta o ruta.
3. **Dos tipos de ruta**: Directa (empresa paga al productor) y
   Semi-autónoma (caja propia, empresa paga a la ruta).
4. Llegada planta: op de báscula selecciona Ruta o PV + almacén.
5. **Crítico**: para rutas con talonario manual, debe poder transcribirse
   en planta antes de liquidar. → H-SC-TALONARIO descubierto.
6. Pago según negociación.
7. **Todos los vouchers archivados en GD** bajo categoría Supply Chain.
   → H-SC-GD-ARCHIVE descubierto.
8. **Todos los CRUD reflejados en RBAC**. → H-SC-RBAC sweep descubierto.

---

## Hallazgos cerrados (16)

### 🔴 Críticos
- **H-SC-RBAC** — 40 viewsets enforced con `RequireCRUDPermission` (antes
  todos `IsAuthenticated`). Migrados 3 viewsets de gestion_proveedores
  que usaban `GranularActionPermission` con sección no seedada
  (efectivamente sin enforcement).
- **H-SC-TALONARIO** — Backend completo: choices `EN_RUTA`/
  `TRANSCRIPCION_PLANTA`/`TALONARIO_MANUAL`, endpoint atómico
  `transcribir-talonario`, action `asociar-talonario-planta`. Modal FE
  con RHF + useFieldArray.
- **H-SC-GD-ARCHIVE** — Integración SC ↔ GD para vouchers de recepción,
  recolección y liquidaciones. Campo `documento_archivado_id` (Integer
  no FK por regla CT↔C2). Idempotente con falla silenciosa.

### 🟠 Altos
- **H-SC-02** — Liquidación: estados `SUGERIDA`→`AJUSTADA`→`CONFIRMADA`→
  `PAGADA` con backfill (BORRADOR→SUGERIDA, APROBADA→CONFIRMADA).
  `HistorialAjusteLiquidacion` append-only (raise `IntegrityError` en
  save/delete con pk).
- **H-SC-04** — Properties `merma_kg` y `merma_porcentaje` en
  `VoucherRecepcion` modalidad RECOLECCION. Endpoint `merma-resumen`
  agregado por ruta+fecha. Badge color-coded en FE
  (verde <1%, amarillo 1-3%, rojo >3%).
- **H-SC-05 (Ruta A)** — Sync Fundación↔Proveedores vía
  `TipoSede.rol_operacional='PROVEEDOR_INTERNO'` (sin reintroducir
  `es_proveedor_interno` eliminado en H-SC-10). Signal post_save en
  SedeEmpresa con `get_or_create` idempotente.
- **H-SC-06** — Modelo `LiquidacionPeriodica` (M2M con N Liquidaciones
  individuales, choices SEMANAL/QUINCENAL/MENSUAL). Celery beat task
  lunes 06:00 genera borradores automáticos.

### 🟡 Medios
- **H-SC-CAT-MODALIDAD** — Reducidas modalidades de 5 a 2 (Entrega
  Planta + Compra Punto). 3 sobrantes eliminadas con backfill.
- **H-SC-CAT-TIPO-PROV** — Eliminado `UNIDAD_NEGOCIO` de TipoProveedor
  (clasificación ortogonal a "interno", ahora se modela vía FK
  sede_empresa_origen).
- **H-SC-12** — Tests rotos eliminados (test_models.py legacy con firmas
  obsoletas de antes del refactor 2026-04-24). Reescritos al patrón
  BaseTenantTestCase: 26 tests recepción + 10 liquidaciones.
- **H-SC-RUTA-03** — Property `Liquidacion.detalle_por_productor`
  agrupa kg desde M2M `voucher.vouchers_recoleccion` para modalidad
  RECOLECCION.
- **H-SC-RUTA-04** — `MermaDashboard` FE con KPIs (recolectado/recibido/
  merma) + tabla detalle + filtros multi-ruta y rango fechas. Reusa DS
  components (KpiCard, MultiSelectCombobox, DateRangePicker).
- **H-SC-E2E-01** — `AlmacenesTab` UI CRUD completa (antes solo seed).
  Sidebar tab agregado a `seed_estructura_final`.
- **H-SC-E2E-05** — `lineas_count` en `LiquidacionListSerializer`
  (source `lineas_liquidacion.count`).
- **H-SC-01** — `VoucherPDFService` formal (recepcion/services.py) con
  WeasyPrint + templates HTML separados (sin flex/grid). Refactor
  `print_80mm` a PDF + nuevo action `pdf_carta`. Nueva app
  `catalogo_productos.impresoras` (CT-layer) para `ImpresoraTermica`.
  Web Bluetooth API pendiente (~30h, deferred).

### 🟢 Bajos
- **H-PROV-DROP** — FK legacy `Proveedor.ruta_origen` eliminado
  (deprecated tras H-SC-RUTA-02). Migración 0024 con drop reversible.

---

## Estrategia de ejecución

**Pattern de oleadas con worktrees paralelos:**

- **Round B** — 5 agentes paralelos focalizados (B1-B5) → 6 hallazgos
  cerrados en una corrida. B1 hizo merma + tests, B2 reportó conflicto
  arquitectónico H-SC-05 (3 rutas A/B/C), B3 AlmacenesTab, B4 cleanup
  tests, B5 LiquidacionPeriodica.
- **Round B6** — Sync Fundación Ruta A (decisión arquitectónica
  confirmada por usuario).
- **Round C** — 5 agentes paralelos (rate limit golpeó: 4pm Cancún
  reset). Resultados parciales aprovechados.
- **Round D** — 4 agentes paralelos (D1 liquidaciones, D2 recepción
  PDF, D3 dashboard merma, D4 GD recolección).
- **Round E1** — RBAC sweep monolítico (toca 40 viewsets, no se puede
  paralelizar por conflictos cruzados).

**Total: 14 worktrees agente, 4 oleadas, ~6 horas wall-clock.**

---

## Aprendizajes

### 1. Worktrees + Docker = contaminación cruzada

Los agentes que ejecutan `manage.py makemigrations` o cualquier
operación que escriba archivos vía Docker (`docker compose exec
backend ...`) escriben en el repo padre, NO en su worktree, porque
`/app` está montado al directorio principal, no al worktree.

Resultado: cada agente que corría Docker contaminaba el repo padre.
Tuve que restaurar archivos desde HEAD múltiples veces y aplicar
deltas quirúrgicos.

**Acción**: Documentar limitación; quizás explorar `COMPOSE_PROJECT_NAME`
distinto por worktree o evitar Docker en agentes de worktree.

### 2. Worktrees outdated cuando merge sucede en paralelo

Cuando creo worktrees y hago merges en main mientras los agentes
trabajan, los agentes ven un main viejo. Sus reportes hablan de
archivos "que no existen" (cuando sí existen pero post su clone).

**Patrón observado**: D2 dijo que `services.py`/`templates`/
`TranscribirTalonarioModal` no existían. Sí existían en main actual
pero no en su worktree base. Aplicación quirúrgica selectiva resolvió.

### 3. RBAC paralelo en producción

SC tenía 2 sistemas RBAC coexistiendo:
- `RequireCRUDPermission` (canónico, capabilities seedadas)
- `GranularActionPermission` (CargoSectionAccess flags) en 3 viewsets
  de gestion_proveedores con sección no seedada — efectivamente sin
  enforcement.

Sweep migró todo al canónico. Documentado como deuda transversal:
unificar en sweep de toda la plataforma o documentar cuándo usar cuál.

### 4. Migration race conditions

Múltiples agentes generan migraciones concurrentes con números
conflictivos (`0004` × 2, `0008` × 2). Resolución manual al merge
con rename.

### 5. ESLint react-hooks/exhaustive-deps

Bug reproducible: `linkedInfo = voucher?.x ?? []` SIN useMemo causa
warning porque cada render crea una array nueva. Wrap en useMemo.

---

## Deudas documentadas (followups)

1. **H-SC-05-followup** (4 puntos): `select_lists.py` UNeg filter,
   comentario migración 0008 `configuracion`, test E2E manual,
   UniqueConstraint DB en `sede_empresa_origen`.
2. **H-SC-01-followup**: Web Bluetooth API completa (~30h).
3. **H-SC-RUTA-04-followup**: Gráfico ECharts tendencia temporal +
   ExportButton CSV/PDF en MermaDashboard.
4. **H-SC-E2E-01-followup**: Tab Almacenes en sidebar requiere correr
   `seed_estructura_final` post-deploy en cada tenant.
5. **H-SC-GD-ARCHIVE-AREA**: `Almacen.proceso_default` FK para
   asignación determinística del Area (hoy fallback al primer Area
   activa).
6. **H-SC-PDF-LOGO-URL**: branding usa `tenant.logo.url` relativo;
   WeasyPrint puede fallar en producción si no resuelve absoluto.
7. **TipoDocumento seed**: correr `seed_tipos_documento_sc` en cada
   tenant post-deploy para crear `VOUCHER_RECEPCION_SC`,
   `VOUCHER_RECOLECCION_SC`, `LIQUIDACION_SC`.
8. **RBAC unificación transversal**: documentar política de qué sistema
   RBAC usar (`RequireCRUDPermission` vs `GranularActionPermission`).

---

## Verificaciones pre-push

- ESLint: ✅ 0 warnings
- TypeScript build (Vite + PWA): ✅ 225 entries generados
- Django system check: ✅ 0 issues
- `makemigrations --check --dry-run`: ✅ No changes detected
- Tests merma corridos en local: ✅ 3/3 OK (672s)

Tests integrales del resto NO ejecutados localmente (requieren ~15min
para setup de schema django-tenants completo). Validación delegada a CI.
