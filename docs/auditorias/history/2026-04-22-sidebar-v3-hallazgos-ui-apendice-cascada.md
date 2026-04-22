# Sesión 2026-04-22 — Sidebar V3 + Hallazgos UI + Apéndice Cascada

Sesión de análisis arquitectónico puro. 100% documental — **no se tocó código LIVE**.
Análisis conjunto de capas (C0, C1, CT, C2, C3, Portales), composición interna de C1,
estructura actual del sidebar y redefinición de la estructura visual hacia **Sidebar V3**
con narrativa del empresario.

## Commits del día

| Commit | Descripción | CI |
|--------|-------------|----|
| `c0cc3224` | `docs(arquitectura): hallazgos UI sidebar V3 + apéndice cascada` | ⏳ no verificado al cierre |

## Estado del producto

- **CURRENT_DEPLOY_LEVEL:** L20 + L16 + supply_chain (sin cambios — solo docs)
- **Tests:** no corridos (sesión 100% documental)
- **CI:** ⏳ del commit de esta sesión (`c0cc3224`) pendiente verificar
- **Apps LIVE tocadas:** ninguna
- **VPS:** sin intervención

## Decisiones tomadas (no reabrir)

### 1. Capas arquitectónicas son invisibles al usuario final
El sidebar cuenta narrativa de negocio, no estructura técnica. Las 6 capas
(C0/C1/CT/C2/C3/Portales) siguen siendo ley en código pero no se exponen en UI.

### 2. Orden final del Sidebar V3
```
Dashboard / Mi Portal / Mi Muro (futuro)
─── sep ───
Fundación (C1)
─── sep ───
Gestión Documental · Catálogos Maestros · Flujos de Trabajo · Firma Digital (CT)
─── sep ───
[C2 con sub-separadores patrón GitHub/Atlassian/Notion]
  ═══ Gente ═══            Mi Equipo, Talent Hub
  ═══ Planeación ═══       Planificación Operativa, Planeación Estratégica
  ═══ Riesgo ═══           Protección y Cumplimiento, Gestión Integral HSEQ
  ═══ Operación Comercial ═══ Cadena de Suministro, Producción, Logística, Sales CRM
  ═══ Finanzas ═══         Administración, Tesorería, Contabilidad
─── sep ───
Configuración (1 tab: Integraciones) · Centro de Control (intacto esta pasada)
```

### 3. Narrativa del empresario como fuente de verdad del orden C2
Cita literal de Camilo: *"Ya tengo el personal, ahora qué van a hacer (planeación),
cuáles son mis riesgos, luego ejecuto mi operación, y después me pagan."*
Cualquier módulo C2 nuevo se ubica en uno de los 5 bloques según esta lógica.

### 4. CT antes de C2 (no la cascada PHVA)
La cascada V2 es sugerencia narrativa; el sidebar V3 es implementación UI. El
usuario prioriza flujo descendente sin retrocesos: primero creo maestro en CT,
luego lo uso operativamente en C2.

### 5. Eliminar wrapper "INFRAESTRUCTURA" del sidebar
Los 4 CT se muestran al mismo nivel entre 2 separadores. Posición cuenta la
historia mejor que label uppercase.

### 6. audit_system se mantiene intacto esta pasada
Decisión explícita: no disolver, no redistribuir su UI todavía. Se conserva
como módulo "Centro de Control" al final del sidebar junto a Configuración.
H-UI-02 queda diferido para próxima sesión dedicada.

### 7. ConsecutivoConfig es candidato a eliminar
Confirmado que Sistema A (autogeneración hardcoded en modelo `save()`) cubre
todos los casos LIVE. Sistema B (`ConsecutivoConfig`) solo lo usa
`talent_hub.contrato_documento_service` — dormido. No se mantiene infra
"por si acaso".

### 8. Patrón de sub-separadores viene de GitHub/Atlassian/Notion, NO Odoo
Referentes correctos: GitHub ("Top Repositories"), Atlassian, Slack, Notion,
Linear, Asana, Microsoft Fluent UI. Odoo tiene UX datada y no es buen ejemplo.

### 9. Integraciones vive en Configuración del tenant (no en Admin Global)
Admin Global es para la PLATAFORMA (cross-tenant). Integraciones son del
tenant específico → quedan en "Configuración" al final del sidebar.
Si crece con más items (auditoría, preferencias, branding extra), evaluar
migración a menú del avatar (patrón Stripe/Slack).

### 10. Mi Portal es la landing universal de todos los usuarios
El sidebar se activa según RBAC granular por cargo. Mi Muro (nuevo) es la
tercera landing: cartelera corporativa de políticas, reglamentos, misión,
noticias. Dashboard = métricas, Mi Portal = mis cosas, Mi Muro = comunicación
corporativa.

## Hallazgos creados (11 nuevos)

### Análisis composición C1 (antes del sidebar)

- **H-C1-01** — Admin de plataforma mezclado con Fundación (MEDIA-ALTA)
  `IntegracionExterna`, `ConsecutivoConfig`, `CertificadoDigital`, `IconRegistry`
  deben salir de C1 a C0/CT. Ya parcialmente declarado en cascada-V2 §13.

- **H-C1-02** — Zonas grises C1/CT/C2 sin decisión explícita (MEDIA)
  `EstrategiaTOWS`, `MatrizComunicacion`, `encuestas` app, `AlcanceSistema`
  campos de certificación — ambigüedad que debe resolverse antes de microservicios.

- **H-C1-03** — `encuestas` candidata a promoción a CT (BAJA-MEDIA)
  Hoy acoplada a contexto. Cuando primer C2 no-contexto la consuma
  (talent_hub.desempeno, sales_crm.servicio_cliente), promover a CT.

- **H-C1-05** — `TipoContrato` duplica Gestor Documental (BAJA-MEDIA)
  Replicar patrón v4.0 de políticas (`PoliticaEspecifica` eliminada → GD).
  Plantillas de contrato deben vivir como `Documento` en GD con tipo
  `PLANTILLA_CONTRATO_*`. Fundación Tab 4 solo muestra read-only.

### Sidebar V3 (sesión actual)

- **H-UI-01** — Sidebar V3 reorganización completa (MEDIA-ALTA)
  Estructura narrativa completa acordada. Base de la Fase 2.

- **H-UI-02** — Redistribuir UI de `audit_system` (BAJA esta pasada, diferido)
  Motor se queda (compliance ISO). UI se redistribuye: logs → Admin Global,
  notificaciones → header, tareas → Mi Portal. Próxima pasada dedicada.

- **H-UI-03** — Naming "Catálogos" redundante + "Catálogo de Productos"
  engañoso (MEDIA)
  3 apariciones del word "Catálogos" en el sidebar. Renombrar módulo a
  "Catálogos Maestros" (contiene Proveedores + UM, no solo productos).
  Eliminar redundante en Configuración.

- **H-UI-04** — Fundación Tab 4 "Políticas y Reglamentos" faltante (MEDIA)
  Declarado en cascada V2, no implementado. Vista read-only que consume GD.
  Conecta con H-C1-05 (plantillas de contrato en GD).

- **H-UI-05** — `ConsecutivoConfig` (Sistema B) infrautilizado (MEDIA)
  Candidato a eliminar. Sistema A cubre todos los casos LIVE. Antes de
  borrar, verificar que `talent_hub.contrato_documento_service` no se active
  primero.

- **H-UI-06** — Mi Muro como tercera landing (BAJA-MEDIA, feature nueva)
  Dashboard / Mi Portal / Mi Muro. Cartelera corporativa read-only que
  consume GD + identidad. Motor de publicaciones con versionado y RBAC.

- **H-UI-07** — Clientes a CT preventivo antes de activar `sales_crm` (BAJA)
  Mismo patrón que Proveedor (refactor Opción A 2026-04-21). No repetir el
  anti-patrón de crear maestro transversal dentro de C2.

## Deuda consciente activa

- **H-UI-02** (audit_system redistribución) — decisión explícita de no tocar
  esta pasada. Próxima sesión dedicada.
- **46 vulnerabilidades Dependabot** (1 crítica, 15 altas, 26 moderadas, 4 bajas)
  — pre-existente, no bloquea. Nuevo PR agrupado de pip abierto por Dependabot
  el 2026-04-21 sin revisar.
- **H-S9-modal-mount-condicional** — diferido desde sesión 2026-04-21.
- **CI de commit `c0cc3224`** — no verificado al cierre (sesión larga,
  documentación pura, bajo riesgo de rompimiento de CI).
- **S8.7** (fixtures cargo restringido + tests permisos limitados) —
  diferido una sesión más. Planteado desde 2026-04-20.

## Próximo paso claro

**Fase 2 — Organizar lo LIVE según Sidebar V3.** Orden sugerido:

1. Reordenar `SIDEBAR_LAYERS` en `viewsets_config.py` + eliminar wrapper
   "INFRAESTRUCTURA" + introducir sub-separadores C2 (requiere cambios FE
   en `Sidebar.tsx` para renderizar sub-separadores).
2. Renombrar "Catálogo de Productos" → "Catálogos Maestros" (seed +
   frontend labels).
3. Eliminar "Catálogos" redundante y "General" placeholder de
   Configuración (seed).
4. Evaluar eliminación de `ConsecutivoConfig` (BE + migración, cuidar
   `talent_hub` dormido).

No se toca audit_system / Centro de Control esta próxima pasada. Mi Muro y
Cliente a CT son futuros que esperan trigger de activación.

**Verificación previa a Fase 2:** confirmar CI verde en `c0cc3224`.

## Archivos clave tocados

- [`docs/01-arquitectura/hallazgos-pendientes.md`](../../01-arquitectura/hallazgos-pendientes.md) — +611 líneas (11 hallazgos nuevos: H-C1-01, 02, 03, 05 + H-UI-01 a H-UI-07)
- [`docs/01-arquitectura/arquitectura-cascada.md`](../../01-arquitectura/arquitectura-cascada.md) — +145 líneas (Apéndice Sidebar V3, preserva Cascada V2 intacta)
- [`docs/01-arquitectura/capas.md`](../../01-arquitectura/capas.md) — +30 líneas (Nota decisiones 2026-04-22, referencia cruzada hallazgos, datos maestros transversales a CT)

Ningún archivo de código tocado. Ningún modelo, serializer, viewset, frontend
o seed modificado. Fase 1 (documentación) cerrada.
