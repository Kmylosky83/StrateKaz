# Catálogos Maestros — Inventario canónico y clasificación por capa

**Fecha:** 2026-04-22 (Sidebar V3, Fase 2)
**Propósito:** único documento de verdad sobre qué catálogos existen, dónde viven en código, quién los consume, y dónde se administran.
**Estado:** vivo — se actualiza con cada migración de catálogo entre capas.

---

## Para qué sirve este documento

Cuando alguien dice _"¿dónde creo este tipo?"_ o _"¿este catálogo va en CT o en el módulo?"_, la respuesta sale de aquí. Sin este doc, la misma pregunta se resuelve distinto cada vez y terminamos con:

- Modelos duplicados (ej: `UnidadMedida` legacy en `organizacion` + canónico en `catalogo_productos`, consolidado en S7).
- UI de administración en el módulo equivocado (ej: `Departamento`/`Ciudad` modelo en Core, UI en Supply).
- Catálogos fantasma (ej: `ConsecutivoConfig` Sistema B sin uso real, ensuciando Configuración).

---

## Principios de clasificación (las 4 capas de catálogo)

### 🟦 C0 — Plataforma (universal, casi no editable por el tenant operativo)

- **Definición:** datos universales fuera del dominio de negocio del tenant (geografía, monedas, tipos de documento identidad nacionales, infra interna de plataforma).
- **Naturaleza:** cargados por seed, raramente editados (un municipio faltante como mucho).
- **Consumo:** 3+ capas distintas (C1, CT, C2, Portales).
- **Modelo:** vive en `apps.core` (o `apps.audit_system` para catálogos de infra).
- **UI administración:** **Admin Global** (cross-tenant, superadmin). Opcionalmente un tab mínimo "Referencia" en Configuración del tenant si requieren edición ocasional.
- **Pregunta de test:** _¿Si cambio esto en el tenant A debería cambiar para todos los tenants?_ → Sí → es C0.

### 🟪 CT — Datos maestros de negocio (transversales 2+ módulos C2)

- **Definición:** datos maestros de negocio del tenant, consumidos por **2 o más módulos C2**.
- **Naturaleza:** editables por el tenant (con cargos autorizados), semi-estáticos.
- **Consumo:** 2+ módulos C2, flujos operativos los referencian.
- **Modelo:** vive en `apps.catalogo_productos`, `apps.gestion_estrategica.gestion_documental`, `apps.workflow_engine`, u otro app CT.
- **UI administración:** módulo **Catálogos Maestros** (sidebar, CT) o módulo CT específico (GD, Flujos).
- **Pregunta de test:** _¿Más de un módulo C2 LIVE lo consume (o lo consumirá cuando active)?_ → Sí → CT.

### 🟨 C1 — Fundación (identidad de la empresa)

- **Definición:** datos que describen **quién es la empresa**: normas que adopta, su contexto, su estructura, sus políticas, sus partes interesadas.
- **Naturaleza:** se define al constituir la empresa (o al adoptar un nuevo sistema de gestión), cambia poco.
- **Consumo:** módulos C2 (auditoría, cumplimiento, riesgos) leen de C1.
- **Modelo:** vive en `apps.gestion_estrategica.{configuracion,organizacion,identidad,contexto}`.
- **UI administración:** módulo **Fundación** en el sidebar (primer grupo después de Dashboard).
- **Pregunta de test:** _¿Esto describe la identidad o marco estratégico de la empresa?_ → Sí → C1.

### 🟩 CO — Operativo del módulo

- **Definición:** catálogos específicos del flujo de **un único módulo C2** (o tan estrechamente acoplados al flujo que no tiene sentido exponerlos globalmente).
- **Naturaleza:** editables por el módulo, operativos del día a día.
- **Consumo:** el módulo dueño (y opcionalmente un portal).
- **Modelo:** vive dentro del app del módulo.
- **UI administración:** dentro del propio módulo (ej: Supply → Catálogos).
- **Pregunta de test:** _¿Solo este módulo lo usa y tiene sentido semánticamente pertenecer aquí?_ → Sí → CO.

### 🚦 Regla de promoción

Un catálogo empieza en la capa donde nació. Si con el tiempo se detecta que:

- Un segundo módulo LIVE empieza a consumirlo → evaluar promoción **CO → CT**.
- Ya no es editable por el tenant (pura geografía/convención) → evaluar degradación **CT → C0**.

La promoción no es automática; requiere una sesión dedicada (refactor cross-app, migración de datos, cambio de FKs).

---

## Inventario LIVE (24 catálogos)

> Estado: LIVE = app dueño activo en `base.py TENANT_APPS`.
> UI actual = dónde administra el tenant **hoy**. UI propuesta = destino V3.
> Los "❌ desfase" son desajustes entre la ubicación actual del modelo o la UI y la capa correcta.

### 🟦 C0 — Plataforma (4 catálogos)

| Catálogo | Modelo | UI actual | UI propuesta | Notas |
|---|---|---|---|---|
| `TipoDocumentoIdentidad` | `apps.core` | Config → Catálogos General | **Admin Global → Catálogos Plataforma** | Universal Colombia (CC, CE, NIT, PAS). |
| `Departamento` | `apps.core` | Supply → Catálogos ❌ | **Admin Global → Catálogos Plataforma** | 33 deptos Colombia con DIVIPOLA oficial (2026-04-22). Modelo en C0 desde S7 (2026-04-19). Seed: `seed_geografia_colombia`. |
| `Ciudad` | `apps.core` | Supply → Catálogos ❌ | **Admin Global → Catálogos Plataforma** | **1,104 municipios DIVIPOLA DANE** (2026-04-22, expandido desde 81). Seed: `seed_geografia_colombia`. |
| `TipoAlerta` | `apps.audit_system.config_alertas` | interno Centro de Control | queda | Catálogo de infra de plataforma (no negocio). |

**Desfase:** `Departamento` y `Ciudad` hoy se administran desde Supply pero el modelo vive en Core (migrado en S7). Hay que mover la UI. Referencia: `H-S7-geo-catalog-location`.

---

### 🟪 CT — Datos maestros de negocio (7 catálogos LIVE + 2 transversales-futuros)

| Catálogo | Modelo | UI actual | UI propuesta | Notas |
|---|---|---|---|---|
| `CategoriaProducto` | `apps.catalogo_productos` | Catálogos Maestros → Categorías ✅ | queda | |
| `UnidadMedida` | `apps.catalogo_productos` | Catálogos Maestros → Unidades ✅ | queda | Consolidó legacy de `organizacion` en S7. |
| `TipoProveedor` | `apps.catalogo_productos.proveedores` | Catálogos Maestros → Tipos de Proveedor ✅ | queda | Migrado desde Supply 2026-04-22. |
| `TipoDocumento` | `apps.gestion_estrategica.gestion_documental` | interno GD ✅ | queda | Tipos de documentos del GD (plantilla, política, etc.). |
| `RolFirmante` | `apps.gestion_estrategica.identidad` | interno Firma Digital | **revisar: mover a `workflow_engine`** | Roles de firmantes en flujos. Semánticamente pertenece al motor de firma, no a identidad. |
| `EstadoFirma` | `apps.gestion_estrategica.identidad` | interno | **revisar: mover a `workflow_engine`** | Mismo argumento que `RolFirmante`. |
| `Producto` | `apps.catalogo_productos` | Catálogos Maestros → Productos ✅ | queda | Dato maestro universal, no un tipo/catálogo pero es la base. |

**Candidatos a promover a CT cuando un segundo consumidor active:**

| Catálogo | Dueño actual | Consumidores LIVE | Consumidores futuros | Recomendación |
|---|---|---|---|---|
| `TipoEPP` | `apps.hseq_management.seguridad_industrial` (OFF) | Mi Equipo (cargos EPP requerido, onboarding entrega_dotacion, offboarding paz_salvo) via CharField hardcoded o `tipo_epp_id` libre | Supply (inventario EPP), Administración (compras EPP) | **Promover a CT cuando HSEQ o Supply-inventario activen.** Hoy no hay FK real porque dueño está OFF. |
| `TipoContrato` | `apps.mi_equipo.seleccion_contratacion` | Mi Equipo | GD (plantillas PDF por tipo), Admin (cálculo nómina) | **H-C1-05:** migrar a GD como `Documento` tipo `PLANTILLA_CONTRATO_*`. Patrón v4.0 de políticas. |

---

### 🟨 C1 — Fundación (7 catálogos)

| Catálogo | Modelo | UI actual | UI propuesta | Notas |
|---|---|---|---|---|
| `NormaISO` | `apps.gestion_estrategica.configuracion` | Fundación (Contexto M2M) ✅ + Config → Organizacional ❌ | **solo Fundación** | UI duplicada en Config es redundante. Modelo ya vive en Fundación (`configuracion` es sub-app de Fundación). |
| `TipoSede` | `apps.gestion_estrategica.configuracion` | interno (SedeEmpresa) | queda | |
| `TipoCambio` | `apps.gestion_estrategica.configuracion` | interno | queda | Monedas del tenant (COP/USD/EUR). |
| `TipoAnalisisDOFA` | `apps.gestion_estrategica.contexto` | interno Contexto ✅ | queda | |
| `TipoAnalisisPESTEL` | `apps.gestion_estrategica.contexto` | interno Contexto ✅ | queda | |
| `EstadoPolitica` | `apps.gestion_estrategica.identidad` | interno Políticas ✅ | queda (evaluar H-C1-05) | |
| `TipoPolitica` | `apps.gestion_estrategica.identidad` | interno Políticas ✅ | queda (evaluar H-C1-05) | Candidato futuro a migrar a GD como tipos de documento política. |

**Desfase:** `NormaISO` se administra desde Configuración → Catálogos → Organizacional, pero su administración natural es desde Fundación (donde se consume). La UI en Config es duplicada y debe eliminarse. Nuevo hallazgo: `H-CAT-01-norma-iso-ui-duplicada`.

---

### 🟩 CO — Operativo del módulo (6 catálogos)

| Catálogo | Modelo | UI actual | UI propuesta | Notas |
|---|---|---|---|---|
| `TipoAlmacen` | `apps.supply_chain.catalogos` | Supply → Catálogos ✅ | queda | Clasifica almacenes (silo/contenedor/pallet/piso). Solo Supply hoy. |
| `ModalidadLogistica` | `apps.supply_chain.gestion_proveedores` | Supply → Catálogos ✅ | queda | Flujo precio-entrega MP. Solo Supply. |
| `EstadoCompra` | `apps.supply_chain.compras` | interno | queda | |
| `TipoEntidad` | `apps.mi_equipo.seleccion_contratacion` | interno | queda | Clasifica entidades de seguridad social. |
| `EntidadSeguridadSocial` | `apps.mi_equipo.seleccion_contratacion` | Mi Equipo Onboarding ✅ | queda | EPS, ARL, AFP, caja compensación. |
| `TipoPrueba` | `apps.mi_equipo.seleccion_contratacion` | Mi Equipo Selección ✅ | queda | Tipos de prueba de evaluación a candidatos. |

---

## Inventario OFF (2 catálogos dormidos — no tocar)

> Regla "LIVE es la verdad": los catálogos en apps no-LIVE son borradores. Se revalidan el día que el app se promueva a LIVE.

| Catálogo | App dueño | Razón |
|---|---|---|
| `TipoCuenta` | `apps.accounting.config_contable` | Accounting OFF. |
| `TipoNovedad` | `apps.talent_hub.novedades` | Talent Hub Novedades OFF. |

---

## Catálogos que NO van en Configuración (y por qué la UI actual lo es)

La UI de Configuración del tenant hoy contiene 5 tabs con catálogos que pertenecen a otras capas. Post-V3:

| Tab Config actual | Contenido | Destino propuesto |
|---|---|---|
| `general → modulos` | Activar/desactivar módulos del tenant | **Admin Global → Módulos** (es control de plataforma) |
| `general → consecutivos` | `ConsecutivoConfig` Sistema B | **Eliminar** — ningún módulo LIVE lo consume; cada módulo autogenera en `save()`. H-UI-05. |
| `catalogos → general` | Tipos de Contrato + Tipos Doc Identidad | Contrato → **GD** (H-C1-05). Doc Identidad → **Admin Global** (C0). |
| `catalogos → organizacional` | Normas ISO | **Eliminar** — duplicado de Fundación. |
| `catalogos → logistica` | Formas de Pago | Queda diferido hasta que Tesorería/Admin activen. H-S8-catalogos-financieros-a-configuracion. |
| `catalogos → hseq` | Tipos EPP / Examen / Inspección / Residuo | EPP → **CT cuando promueva**. Resto queda dormido con HSEQ. |
| `conexiones → integraciones` | Integraciones externas | **queda — único tab post-V3**. |

**Resultado final propuesto:**
- Módulo `configuracion_plataforma`: 1 solo tab (Integraciones).
- Admin Global gana un tab "Catálogos de Plataforma" (Departamentos, Ciudades, Tipos Doc Identidad, Módulos del sistema).
- GD gana plantillas de contrato (H-C1-05).
- Cada módulo C2 se queda con sus operativos.

---

## Desfases detectados (hallazgos vivos)

| ID | Desfase | Acción |
|---|---|---|
| `H-S7-geo-catalog-location` | `Departamento`/`Ciudad` UI en Supply, modelo en Core | Mover UI a Admin Global (o tab Config mínimo). |
| `H-CAT-01-norma-iso-ui-duplicada` (nuevo) | UI de `NormaISO` duplicada en Config → Organizacional | Eliminar UI en Config. Fundación es única. |
| `H-C1-05` | `TipoContrato` duplica Gestor Documental | Migrar a GD como `PLANTILLA_CONTRATO_*`. |
| `H-UI-05` | `ConsecutivoConfig` Sistema B sin uso LIVE | Eliminar backend + UI + modelo. |
| `H-S8-catalogos-financieros-a-configuracion` | `FormaPago`, `TipoCuentaBancaria` en C1, deberían ser Configuración/Admin | Mover cuando Tesorería/Admin activen. |
| `H-CAT-02-tipo-epp-transversalizar` (nuevo) | `TipoEPP` dueño en HSEQ (OFF) pero consumo real en Mi Equipo LIVE via CharField hardcoded | Promover a CT cuando HSEQ o Supply-inventario activen (o antes si Mi Equipo demanda FK real). |
| `H-CAT-03-rolfirmante-estadofirma-ubicacion` (nuevo) | `RolFirmante`/`EstadoFirma` en `identidad` pero consumo 100% Firma Digital | Evaluar mover a `workflow_engine`. Deferido. |

---

## Reglas operativas

1. **Nuevo catálogo:** preguntar en orden — ¿describe plataforma (C0)?, ¿describe identidad empresa (C1)?, ¿lo usan 2+ módulos C2 (CT)?, si no → CO del módulo dueño.
2. **Modelo vive donde importa el dominio**, no donde se administra la UI. Ejemplo: `NormaISO` vive en C1 (Fundación) aunque la UI hoy esté mal ubicada en Configuración.
3. **UI de administración vive donde el usuario espera encontrarla** según la narrativa del negocio. Ejemplo: `Normas` se edita en Fundación → Contexto, no en un tab secundario de Configuración.
4. **No se crea un catálogo dentro de otro módulo "por si acaso".** Si no hay un segundo consumidor LIVE, empieza como CO y se promueve cuando aparezca.
5. **Configuración del tenant** es para **integraciones + catálogos universales de plataforma** (si no se suben a Admin Global). No es el basurero de catálogos que no encuentran hogar.

---

## Bitácora

| Fecha | Cambio | Commit/Doc |
|---|---|---|
| 2026-04-19 | `UnidadMedida` consolidada — legacy en `organizacion` eliminada, canónica en `catalogo_productos` | Sesión S7 (docs/auditorias/history/2026-04-19-s7-...) |
| 2026-04-21 | `Proveedor` + `TipoProveedor` migrados de `supply_chain` a `catalogo_productos` (CT, Opción A) | Sesión refactor CT 2026-04-21 |
| 2026-04-22 | `TipoProveedor` UI migrada de Supply → Catálogos Maestros (tab propio antes de Proveedores) | Sesión Sidebar V3 Fase 2 |
| 2026-04-22 | **Este documento creado** como fuente canónica única | Sesión Sidebar V3 Fase 2 |
| 2026-04-22 | `Departamento`+`Ciudad` expandidos a **DIVIPOLA oficial DANE** (33 deptos con código DIVIPOLA 2 dígitos + 1,104 municipios). Seed canónico `seed_geografia_colombia` en Core. Los 81 municipios legacy del seed Supply se preservaron y actualizaron (no duplicación). Retirado el bloque geo de `seed_supply_chain_catalogs`. | `seed_geografia_colombia.py` |
| 2026-04-22 | **H-CAT-05 parcial cerrado**: `Proveedor.ciudad` migrado de `CharField` a `ForeignKey(Ciudad)`. Migraciones `0010` + `0011` en `catalogo_productos` (idempotentes, schema + data migration). Proveedores con ciudad inconsistente (ej: "Cúcuta" guardada bajo dept Casanare) quedaron con `ciudad=NULL` para corrección manual. Modal `ProveedorFormModal` ahora usa `<Select>` filtrado por departamento. | Migraciones 0010, 0011; `seed_geografia_colombia.py` |
| 2026-04-22 | UI redundante `NormaISO` en Configuración → Catálogos → Organizacional **eliminada** (H-CAT-01 cerrado). Administración única desde Fundación → Contexto. | Sesión Sidebar V3 Fase 2 |

---

## Próximas decisiones requeridas

Antes de avanzar con Fase 2 completa del Sidebar V3, se requiere decisión explícita sobre:

1. **¿"Módulos del sistema" vive en Admin Global o en un tab Config?** Propuesta: Admin Global.
2. **¿Departamentos/Ciudades/Tipos Doc Identidad en Admin Global o en un tab Config mínimo?** Propuesta: Admin Global. El tenant operativo no los edita.
3. **¿Eliminar UI `NormaISO` en Config → Organizacional hoy?** Propuesta: sí, es redundante — hay que validar que la UI de Fundación → Contexto cubre todos los casos de uso.
4. **¿Eliminar `ConsecutivoConfig` (Sistema B) hoy o en sesión dedicada?** Propuesta: sesión dedicada (requiere eliminar backend + migraciones + UI + verificar talent_hub OFF).
5. **¿Promover `TipoEPP` a CT ahora?** Propuesta: no — HSEQ aún OFF, los consumidores LIVE (Mi Equipo) usan CharField sin FK al modelo. Dejarlo marcado para sesión cuando se active HSEQ o Supply-inventario.

---

**Mantenimiento:** este documento se actualiza cada vez que un catálogo cambia de capa o se agrega uno nuevo. El hallazgo correspondiente se cierra en `hallazgos-pendientes.md` y se anota la fecha aquí en la Bitácora.
