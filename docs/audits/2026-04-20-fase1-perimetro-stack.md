# Auditoría Fase 1 — Perímetro LIVE y Stack Real
**Fecha:** 2026-04-20  
**Auditor:** Claude Code (automated)  
**Directorio raíz:** C:\Proyectos\StrateKaz

---

## 1. Resumen ejecutivo

- **Apps LIVE (TENANT_APPS no comentadas):** 27 entradas (incluyendo sub-apps de app-padre)
- **Apps dormidas/comentadas en TENANT_APPS:** 38 entradas comentadas en base.py
- **Carpetas presentes en filesystem pero fuera de TENANT_APPS:** 11 módulos dormidos
- **Rutas FE activas (leaf routes con componente real):** ~65 rutas activas
- **Rutas FE dormidas/commented en archivos .routes.tsx:** 3 bloques comentados detectados
- **Huecos documentales identificados:** 3 (ARCHITECTURE.md, STACK.md, mapa LIVE actualizado)
- **Contradicciones código↔docs:** 3 (ver sección 14)
- **Hallazgo crítico:** `mi_portal` está LIVE (URLs montadas, FE activo) pero NO aparece en `base.py` TENANT_APPS — omisión real que puede causar errores en `manage.py migrate_schemas`. Ver contradicción C-1.
- **Hallazgo secundario:** `CURRENT_DEPLOY_LEVEL` no existe como constante de settings — solo como referencia en comentarios de `config/celery.py`. El nivel efectivo se infiere de las apps activas en TENANT_APPS (L20 máximo).
- **Dependencias huérfanas detectadas:** `phaser` y `nipplejs` solo se usan en `features/sst-game/` (módulo desactivado). Son candidatos a extracción en package.json cuando se elimine el módulo dormido.

---

## 2. Backend LIVE

Apps activas (no comentadas) en `backend/config/settings/base.py` TENANT_APPS.  
Líneas de referencia: TENANT_APPS bloque inicia en línea 81.

| App (settings path) | Path módulo | Modelos (# clases) | URLs registradas | Migraciones (#) |
|---------------------|-------------|---------------------|-----------------|-----------------|
| `django.contrib.admin` | Django builtin | — | `/admin/` (siempre) | — |
| `django.contrib.auth` | Django builtin | — | — | — |
| `django.contrib.contenttypes` | Django builtin | — | — | — |
| `rest_framework_simplejwt.token_blacklist` | Third-party | — | — | — |
| `auditlog` | Third-party | — | — | — |
| `csp` | Third-party | — | — | — |
| `apps.core` | `backend/apps/core/` | 34 (models/ directory, 14 archivos) | `api/core/` (línea 143 urls.py) | 11 |
| `apps.ia` | `backend/apps/ia/` | 2 | `api/ia/` (línea 147 urls.py) | 1 |
| `apps.gestion_estrategica.configuracion` | `backend/apps/gestion_estrategica/configuracion/` | 11 | `api/configuracion/` (línea 161 urls.py) | 4 |
| `apps.gestion_estrategica.organizacion` | `backend/apps/gestion_estrategica/organizacion/` | 2 | `api/organizacion/` (línea 164 urls.py) | 4 |
| `apps.gestion_estrategica.identidad` | `backend/apps/gestion_estrategica/identidad/` | 3 | `api/identidad/` (línea 167 urls.py) + `api/gestion-estrategica/` (línea 157) | 1 |
| `apps.gestion_estrategica.contexto` | `backend/apps/gestion_estrategica/contexto/` | 13 | `api/gestion-estrategica/` (línea 157 urls.py) | 2 |
| `apps.gestion_estrategica.encuestas` | `backend/apps/gestion_estrategica/encuestas/` | 5 | `api/encuestas-dofa/` (línea 173 urls.py) | 2 |
| `apps.workflow_engine.disenador_flujos` | `backend/apps/workflow_engine/disenador_flujos/` | 9 | `api/workflows/` (línea 191 urls.py, guard en disenador_flujos) | 2 |
| `apps.workflow_engine.ejecucion` | `backend/apps/workflow_engine/ejecucion/` | 5 | `api/workflows/` (mismo mount) | 1 |
| `apps.workflow_engine.monitoreo` | `backend/apps/workflow_engine/monitoreo/` | 5 | `api/workflows/` (mismo mount) | 1 |
| `apps.workflow_engine.firma_digital` | `backend/apps/workflow_engine/firma_digital/` | 8 | `api/workflows/` (mismo mount) | 8 |
| `apps.audit_system.logs_sistema` | `backend/apps/audit_system/logs_sistema/` | 5 | `api/audit/` (línea 265 urls.py) | 2 |
| `apps.audit_system.config_alertas` | `backend/apps/audit_system/config_alertas/` | 4 | `api/audit/` (mismo mount) | 1 |
| `apps.audit_system.centro_notificaciones` | `backend/apps/audit_system/centro_notificaciones/` | 4 | `api/audit/` (mismo mount) | 1 |
| `apps.audit_system.tareas_recordatorios` | `backend/apps/audit_system/tareas_recordatorios/` | 4 | `api/audit/` (mismo mount) | 1 |
| `apps.gestion_estrategica.gestion_documental` | `backend/apps/gestion_estrategica/gestion_documental/` | 8 | `api/gestion-estrategica/` (sub-mount) | 23 |
| `apps.catalogo_productos` | `backend/apps/catalogo_productos/` | 3 | `api/catalogo-productos/` (línea 204 urls.py) | 6 |
| `apps.supply_chain.catalogos` | `backend/apps/supply_chain/catalogos/` | 2 | `api/supply-chain/catalogos/` | 2 |
| `apps.supply_chain.gestion_proveedores` | `backend/apps/supply_chain/gestion_proveedores/` | 11 | `api/supply-chain/` (línea 210 urls.py) | 5 |
| `apps.supply_chain.recepcion` | `backend/apps/supply_chain/recepcion/` | 2 | `api/supply-chain/recepcion/` | 1 |
| `apps.supply_chain.liquidaciones` | `backend/apps/supply_chain/liquidaciones/` | 1 | `api/supply-chain/liquidaciones/` | 2 |
| `apps.supply_chain.almacenamiento` | `backend/apps/supply_chain/almacenamiento/` | 8 | `api/supply-chain/almacenamiento/` | 1 |
| `apps.supply_chain.compras` | `backend/apps/supply_chain/compras/` | 15 | **NO montadas** — solo para integridad referencial FK (ver comentario línea 187-190 base.py) | 2 |
| `apps.mi_equipo` | `backend/apps/mi_equipo/` | 0 (app padre, sin models.py directo) | `api/mi-equipo/` (línea 225 urls.py) | — |
| `apps.mi_equipo.estructura_cargos` | `backend/apps/mi_equipo/estructura_cargos/` | 4 | `api/mi-equipo/` (mismo mount) | 1 |
| `apps.mi_equipo.seleccion_contratacion` | `backend/apps/mi_equipo/seleccion_contratacion/` | 13 | `api/mi-equipo/` (mismo mount) | 1 |
| `apps.mi_equipo.colaboradores` | `backend/apps/mi_equipo/colaboradores/` | 4 | `api/mi-equipo/` (mismo mount) | 1 |
| `apps.mi_equipo.onboarding_induccion` | `backend/apps/mi_equipo/onboarding_induccion/` | 8 | `api/mi-equipo/` (mismo mount) | 2 |
| `apps.analytics.config_indicadores` | `backend/apps/analytics/config_indicadores/` | 4 | `api/analytics/` (línea 262 urls.py) | 1 |
| `apps.analytics.exportacion_integracion` | `backend/apps/analytics/exportacion_integracion/` | 2 | `api/analytics/` (mismo mount) | 1 |

**Nota sobre `mi_portal`:** La app `apps.mi_portal` tiene URLs montadas condicionalmente en `config/urls.py` línea 232 (guard: `if is_app_installed('apps.mi_equipo')`) y tiene FE activo. Sin embargo, **NO está en `base.py` TENANT_APPS**. Esto significa que `migrate_schemas` no crea sus tablas en schemas nuevos. Ver sección 14 Contradicción C-1.

---

## 3. Backend dormido/comentado

Apps comentadas en `base.py` TENANT_APPS con carpeta presente en filesystem.

| App | Razón aparente (comentario en base.py) | Última modificación models.py |
|-----|----------------------------------------|-------------------------------|
| `apps.gamificacion.juego_sst` (línea 135) | "Desacoplado de talent_hub. Requiere refactor completo antes de activar." | 2026-03-22 |
| `apps.gestion_estrategica.planeacion` (línea 141) | "Descomentar cuando Level 15 esté estabilizado con datos reales" (L20) | INCIERTO (carpeta existe) |
| `apps.gestion_estrategica.gestion_proyectos` (línea 142) | Mismo bloque L20 | INCIERTO |
| `apps.gestion_estrategica.planificacion_sistema` (línea 143) | Mismo bloque L20 | INCIERTO |
| `apps.gestion_estrategica.revision_direccion` (línea 144) | Mismo bloque L20 | INCIERTO |
| `apps.motor_cumplimiento.matriz_legal` (línea 150) | "Descomentar cuando Level 20 (Planeación Estratégica) esté estabilizado" (L25) | 2026-02-19 |
| `apps.motor_cumplimiento.requisitos_legales` (línea 151) | Mismo bloque L25 | INCIERTO |
| `apps.motor_cumplimiento.reglamentos_internos` (línea 152) | Mismo bloque L25 | INCIERTO |
| `apps.motor_cumplimiento.evidencias` (línea 153) | Mismo bloque L25 | INCIERTO |
| `apps.motor_riesgos.riesgos_procesos` (línea 155) | Mismo bloque L25 | INCIERTO |
| `apps.motor_riesgos.ipevr` (línea 156) | Mismo bloque L25 | 2026-03-06 |
| `apps.motor_riesgos.aspectos_ambientales` (línea 157) | Mismo bloque L25 | INCIERTO |
| `apps.motor_riesgos.riesgos_viales` (línea 158) | Mismo bloque L25 | INCIERTO |
| `apps.motor_riesgos.seguridad_informacion` (línea 159) | Mismo bloque L25 | INCIERTO |
| `apps.motor_riesgos.sagrilaft_ptee` (línea 160) | Mismo bloque L25 | INCIERTO |
| `apps.hseq_management.accidentalidad` (línea 166) | "Descomentar cuando Level 25 esté estabilizado" (L30) | INCIERTO |
| `apps.hseq_management.seguridad_industrial` (línea 167) | Mismo bloque L30 | INCIERTO |
| `apps.hseq_management.higiene_industrial` (línea 168) | Mismo bloque L30 | INCIERTO |
| `apps.hseq_management.medicina_laboral` (línea 169) | Mismo bloque L30 | INCIERTO |
| `apps.hseq_management.emergencias` (línea 170) | Mismo bloque L30 | INCIERTO |
| `apps.hseq_management.gestion_ambiental` (línea 171) | Mismo bloque L30 | INCIERTO |
| `apps.hseq_management.calidad` (línea 172) | Mismo bloque L30 | INCIERTO |
| `apps.hseq_management.mejora_continua` (línea 173) | Mismo bloque L30 | 2026-03-11 |
| `apps.hseq_management.gestion_comites` (línea 174) | Mismo bloque L30 | INCIERTO |
| `apps.production_ops.recepcion` (línea 196) | "CASCADA LEVEL 35: otros C2 fuera de cascada, activar por feature-flag" | 2026-04-19 |
| `apps.production_ops.procesamiento` (línea 197) | Mismo bloque L35 | INCIERTO |
| `apps.production_ops.producto_terminado` (línea 198) | Mismo bloque L35 | INCIERTO |
| `apps.production_ops.mantenimiento` (línea 199) | Mismo bloque L35 | INCIERTO |
| `apps.logistics_fleet.gestion_flota` (línea 201) | Mismo bloque L35 | INCIERTO |
| `apps.logistics_fleet.gestion_transporte` (línea 202) | Mismo bloque L35 | 2026-02-19 |
| `apps.sales_crm.gestion_clientes` (línea 204) | Mismo bloque L35 | 2026-03-15 |
| `apps.sales_crm.pipeline_ventas` (línea 205) | Mismo bloque L35 | INCIERTO |
| `apps.sales_crm.pedidos_facturacion` (línea 206) | Mismo bloque L35 | INCIERTO |
| `apps.sales_crm.servicio_cliente` (línea 207) | Mismo bloque L35 | INCIERTO |
| `apps.talent_hub.novedades` (línea 224) | "Descomentar cuando Level 53 esté estabilizado" (L60) | INCIERTO |
| `apps.talent_hub.formacion_reinduccion` (línea 225) | Mismo bloque L60 | 2026-03-22 |
| `apps.talent_hub.desempeno` (línea 226) | Mismo bloque L60 | INCIERTO |
| `apps.talent_hub.control_tiempo` (línea 227) | Mismo bloque L60 | INCIERTO |
| `apps.talent_hub.nomina` (línea 228) | Mismo bloque L60 | INCIERTO |
| `apps.talent_hub.proceso_disciplinario` (línea 229) | Mismo bloque L60 | INCIERTO |
| `apps.talent_hub.off_boarding` (línea 230) | Mismo bloque L60 | INCIERTO |
| `apps.talent_hub.consultores_externos` (línea 231) | Mismo bloque L60 | INCIERTO |
| `apps.administracion.presupuesto` (línea 237) | "Descomentar cuando Level 40 esté estabilizado" (L45) | 2026-02-27 |
| `apps.administracion.activos_fijos` (línea 238) | Mismo bloque L45 | INCIERTO |
| `apps.administracion.servicios_generales` (línea 239) | Mismo bloque L45 | INCIERTO |
| `apps.tesoreria.tesoreria` (línea 240) | Mismo bloque L45 | 2026-02-25 |
| `apps.accounting.config_contable` (línea 242) | Mismo bloque L45 | INCIERTO |
| `apps.accounting.movimientos` (línea 243) | Mismo bloque L45 | 2025-12-31 |
| `apps.accounting.informes_contables` (línea 244) | Mismo bloque L45 | INCIERTO |
| `apps.accounting.integracion` (línea 245) | Mismo bloque L45 | INCIERTO |
| `apps.analytics.indicadores_area` (línea 259) | "Descomentar cuando TODOS los módulos C2 estén estabilizados" (L50) | INCIERTO |
| `apps.analytics.acciones_indicador` (línea 260) | Mismo bloque L50 | INCIERTO |
| `apps.analytics.dashboard_gerencial` (línea 261) | Mismo bloque L50 | INCIERTO |
| `apps.analytics.generador_informes` (línea 262) | Mismo bloque L50 | INCIERTO |
| `apps.analytics.analisis_tendencias` (línea 263) | Mismo bloque L50 | INCIERTO |

**Carpetas en filesystem sin ninguna entrada en base.py TENANT_APPS** (ni activa ni comentada):
- `apps.mi_portal` — LIVE en URLs pero ausente de TENANT_APPS (ver C-1)
- `apps.shared_library` — está en SHARED_APPS (schema public), no TENANT_APPS (correcto)

---

## 4. Frontend LIVE — Rutas registradas

Todas las rutas están en `frontend/src/routes/modules/` y son lazy-loaded. Solo se listan rutas con componente real (no redirects).

| Path de ruta | Componente | Lazy? |
|--------------|-----------|-------|
| `/login` | `LoginPage` | No |
| `/forgot-password` | `ForgotPasswordPage` | No |
| `/reset-password` | `ResetPasswordPage` | No |
| `/setup-password` | `SetupPasswordPage` | No |
| `/auth/callback` | `AuthCallbackPage` | No |
| `/pruebas/responder/:token` | `ResponderPruebaPage` | Sí |
| `/entrevistas/responder/:token` | `ResponderEntrevistaPage` | Sí |
| `/contratos/firmar/:token` | `FirmarContratoPage` | Sí |
| `/vacantes` | `VacantesPublicasPage` | Sí |
| `/vacantes/:id/postular` | `PostulacionPage` | Sí |
| `/dashboard` | `DashboardPage` | No |
| `/admin-global` | `AdminGlobalPage` | Sí |
| `/perfil` | `PerfilPage` | Sí |
| `/perfil/seguridad` | `SeguridadPage` | Sí |
| `/perfil/preferencias` | `PreferenciasPage` | Sí |
| `/perfil/notificaciones` | `MisNotificacionesPage` | Sí |
| `/mi-portal` | `MiPortalPage` | Sí |
| `/usuarios` | `UsersPage` | Sí |
| `/fundacion/mi-empresa` | `MiEmpresaPage` | Sí |
| `/fundacion/contexto-identidad` | `ContextoIdentidadPage` | Sí |
| `/fundacion/organizacion` | `OrganizacionPage` | Sí |
| `/gestion-documental` | `GestionDocumentalPage` | Sí |
| `/mi-equipo/perfiles-cargo` | `MiEquipoModulePage` | Sí |
| `/mi-equipo/seleccion` | `MiEquipoModulePage` | Sí |
| `/mi-equipo/colaboradores` | `MiEquipoModulePage` | Sí |
| `/mi-equipo/onboarding` | `MiEquipoModulePage` | Sí |
| `/planificacion-operativa/planificacion` | `PlanificacionSistemaPage` | Sí |
| `/planeacion-estrategica/contexto` | `ContextoPage` | Sí |
| `/planeacion-estrategica/planeacion` | `PlaneacionPage` | Sí |
| `/planeacion-estrategica/riesgos-oportunidades` | `RiesgosOportunidadesPage` | Sí |
| `/planeacion-estrategica/proyectos` | `ProyectosPage` | Sí |
| `/proteccion/cumplimiento-legal` | `MatrizLegalPage` | Sí |
| `/proteccion/requisitos-legales` | `RequisitosLegalesPage` | Sí |
| `/proteccion/reglamentos-internos` | `ReglamentosInternosPage` | Sí |
| `/proteccion/riesgos-procesos` | `RiesgosProcesosPage` | Sí |
| `/proteccion/ipevr` | `IPEVRPage` | Sí |
| `/proteccion/aspectos-ambientales` | `AspectosAmbientalesPage` | Sí |
| `/proteccion/riesgos-viales` | `RiesgosVialesPage` | Sí |
| `/proteccion/seguridad-info` | `SeguridadInformacionPage` | Sí |
| `/proteccion/sagrilaft` | `SagrilaftPteePage` | Sí |
| `/workflows/disenador` | `DisenadorFlujosPage` | Sí |
| `/workflows/ejecucion` | `EjecucionPage` | Sí |
| `/workflows/monitoreo` | `MonitoreoPage` | Sí |
| `/gestion-integral/dashboard` | `HSEQPage` | Sí |
| `/gestion-integral/medicina-laboral` | `MedicinaLaboralPage` | Sí |
| `/gestion-integral/seguridad-industrial` | `SeguridadIndustrialPage` | Sí |
| `/gestion-integral/higiene-industrial` | `HigieneIndustrialPage` | Sí |
| `/gestion-integral/comites` | `GestionComitesPage` | Sí |
| `/gestion-integral/accidentalidad` | `AccidentalidadPage` | Sí |
| `/gestion-integral/emergencias` | `EmergenciasPage` | Sí |
| `/gestion-integral/gestion-ambiental` | `GestionAmbientalPage` | Sí |
| `/catalogo-productos/productos` | `CatalogoProductosPage` | Sí |
| `/catalogo-productos/categorias` | `CatalogoProductosPage` | Sí |
| `/catalogo-productos/unidades-medida` | `CatalogoProductosPage` | Sí |
| `/supply-chain/proveedores` | `SupplyChainPage` | Sí |
| `/supply-chain/precios` | `SupplyChainPage` | Sí |
| `/supply-chain/recepcion` | `SupplyChainPage` | Sí |
| `/supply-chain/liquidaciones` | `SupplyChainPage` | Sí |
| `/supply-chain/almacenamiento` | `SupplyChainPage` | Sí |
| `/supply-chain/evaluaciones` | `SupplyChainPage` | Sí |
| `/supply-chain/catalogos` | `SupplyChainPage` | Sí |
| `/produccion/recepcion` | `ProductionOpsPage` | Sí |
| `/produccion/procesamiento` | `ProductionOpsPage` | Sí |
| `/produccion/mantenimiento` | `ProductionOpsPage` | Sí |
| `/produccion/producto-terminado` | `ProductionOpsPage` | Sí |
| `/logistica/transporte` | `LogisticsFleetPage` | Sí |
| `/logistica/despachos` | `LogisticsFleetPage` | Sí |
| `/logistica/flota` | `LogisticsFleetPage` | Sí |
| `/logistica/pesv` | `LogisticsFleetPage` | Sí |
| `/ventas/clientes` | `ClientesPage` | Sí |
| `/ventas/pipeline` | `PipelinePage` | Sí |
| `/ventas/cotizaciones` | `CotizacionesPage` | Sí |
| `/ventas/pedidos` | `PedidosPage` | Sí |
| `/ventas/facturas` | `FacturasPage` | Sí |
| `/ventas/pqrs` | `PQRSPage` | Sí |
| `/ventas/encuestas` | `EncuestasPage` | Sí |
| `/ventas/fidelizacion` | `FidelizacionPage` | Sí |
| `/talento/formacion` | `TalentHubPage` | Sí |
| `/talento/desempeno` | `TalentHubPage` | Sí |
| `/talento/control-tiempo` | `TalentHubPage` | Sí |
| `/talento/novedades-nomina` | `TalentHubPage` | Sí |
| `/talento/disciplinario` | `TalentHubPage` | Sí |
| `/talento/off-boarding` | `TalentHubPage` | Sí |
| `/talento/consultores-externos` | `TalentHubPage` | Sí |
| `/administracion/activos-fijos` | `ActivosFijosPage` | Sí |
| `/administracion/servicios-generales` | `ServiciosGeneralesPage` | Sí |
| `/administracion/presupuesto` | `PresupuestoPage` | Sí |
| `/tesoreria/tesoreria` | `TesoreriaPage` | Sí |
| `/tesoreria/pagos` | `TesoreriaPage` | Sí |
| `/contabilidad/configuracion` | `ConfigContablePage` | Sí |
| `/contabilidad/movimientos` | `MovimientosContablesPage` | Sí |
| `/contabilidad/informes` | `InformesContablesPage` | Sí |
| `/contabilidad/integracion` | `IntegracionContablePage` | Sí |
| `/analytics/configuracion` | `ConfigIndicadoresPage` | Sí |
| `/analytics/dashboards` | `DashboardGerencialPage` | Sí |
| `/analytics/indicadores` | `IndicadoresAreaPage` | Sí |
| `/analytics/analisis` | `AnalisisTendenciasPage` | Sí |
| `/analytics/informes` | `GeneradorInformesPage` | Sí |
| `/analytics/acciones` | `AccionesIndicadorPage` | Sí |
| `/analytics/exportacion` | `ExportacionPage` | Sí |
| `/analytics/builder` | `DashboardBuilderPage` | Sí |
| `/analytics/demo` | `AnalyticsDemoPage` | Sí |
| `/auditoria/logs` | `LogsSistemaPage` | Sí |
| `/auditoria/notificaciones` | `NotificacionesPage` | Sí |
| `/auditoria/alertas` | `AlertasPage` | Sí |
| `/auditoria/tareas` | `TareasPage` | Sí |
| `/revision-direccion/programacion` | `RevisionDireccionPage` | Sí |
| `/acciones-mejora/no-conformidades` | `AccionesMejoraPage` | Sí |
| `/acciones-mejora/acciones-correctivas` | `AccionesMejoraPage` | Sí |
| `/acciones-mejora/oportunidades-mejora` | `AccionesMejoraPage` | Sí |
| `/configuracion-admin/general` | `ConfiguracionAdminPage` | Sí |
| `/configuracion-admin/catalogos` | `ConfiguracionAdminPage` | Sí |
| `/configuracion-admin/conexiones` | `ConfiguracionAdminPage` | Sí |

---

## 5. Frontend dormido/comentado — Rutas

| Path de ruta | Archivo | Línea | Razón |
|--------------|---------|-------|-------|
| `/mi-portal/juego-sst` | `portals.routes.tsx` | 38 | "Juego SST desactivado — requiere refactor completo" |
| `/proveedor-portal` (como componente propio) | `portals.routes.tsx` | 27-31 | `ProveedorPortalPage` comentado, ruta redirige a `/mi-portal` |
| `/cliente-portal` (como componente propio) | `portals.routes.tsx` | 27-31 | `ClientePortalPage` comentado, ruta redirige a `/mi-portal` |

---

## 6. Sidebar LIVE

Configuración en `backend/apps/core/viewsets_config.py` líneas 55-125 (`SIDEBAR_LAYERS`).

| Capa / Ítem de menú | Code | Path destino | module_codes |
|---------------------|------|-------------|--------------|
| Fundación | `NIVEL_FUNDACION` | `/fundacion` | `['fundacion']` |
| Infraestructura | `NIVEL_INFRAESTRUCTURA` | `/gestion-documental`, `/catalogo-productos` | `['gestion_documental', 'catalogo_productos']` |
| Gestión de Personas | `NIVEL_EQUIPO` | `/mi-equipo` | `['mi_equipo']` |
| Cadena de Valor | `NIVEL_CADENA` | `/supply-chain` | `['supply_chain']` |
| Inteligencia | `NIVEL_INTELIGENCIA` | `/auditoria` | `['audit_system']` |
| Flujos de Trabajo | `NIVEL_WORKFLOWS` | `/workflows` | `['workflow_engine']` |
| Configuración | `NIVEL_CONFIG` | `/configuracion-admin` | `['configuracion_plataforma']` |

**Nota:** El sidebar es dinámico — filtra por módulos habilitados y permisos de cargo del usuario. La tabla arriba refleja las capas definidas, no lo que ve cada usuario específico.

---

## 7. Cross-check BE↔FE

### 7.1 Apps LIVE backend sin ruta FE correspondiente

| App backend LIVE | Situación FE |
|-----------------|--------------|
| `apps.ia` | Sin ruta FE dedicada. API consumida internamente por otros módulos como ayuda contextual. Esperado. |
| `apps.gestion_estrategica.encuestas` | Sin ruta FE propia. Funcionalidad integrada en `fundacion/contexto-identidad`. Esperado. |
| `apps.workflow_engine.firma_digital` | Sin ruta FE dedicada. Consumida como componente transversal en flujos. Esperado. |
| `apps.supply_chain.compras` | En TENANT_APPS pero URLs NO montadas (solo integridad referencial FK). Sin ruta FE. Documentado como dormido. |

### 7.2 Rutas FE con componentes activos apuntando a apps comentadas en backend

Estas rutas tienen componentes React reales pero su backend está comentado en TENANT_APPS.  
Son rutas "dormidas funcionalmente" — cargan en FE pero el API devolverá 404 o error de módulo.

| Ruta FE activa | Module Guard (`withFullGuard`) | App backend correspondiente | Estado backend |
|----------------|-------------------------------|----------------------------|----------------|
| `/proteccion/*` (7 rutas) | `proteccion_cumplimiento` | `motor_cumplimiento/*` + `motor_riesgos/*` | Comentado L25 |
| `/gestion-integral/*` (8 rutas) | `gestion_integral` | `hseq_management/*` | Comentado L30 |
| `/planeacion-estrategica/*` (4 rutas) | `planeacion_estrategica` | `gestion_estrategica.planeacion` | Comentado L20 |
| `/revision-direccion/*` (1 ruta) | `revision_direccion` | `gestion_estrategica.revision_direccion` | Comentado L20 |
| `/planificacion-operativa/*` (1 ruta) | `planificacion_operativa` | `gestion_estrategica.planificacion_sistema` | Comentado L20 |
| `/acciones-mejora/*` (3 rutas) | `acciones_mejora` | `hseq_management.mejora_continua` | Comentado L30 |
| `/produccion/*` (4 rutas) | `production_ops` | `production_ops/*` | Comentado L35 |
| `/logistica/*` (4 rutas) | `logistics_fleet` | `logistics_fleet/*` | Comentado L35 |
| `/ventas/*` (8 rutas) | `sales_crm` | `sales_crm/*` | Comentado L35 |
| `/talento/*` (7 rutas) | `talent_hub` | `talent_hub/*` | Comentado L60 |
| `/administracion/*` (3 rutas) | `administracion` | `administracion/*` | Comentado L45 |
| `/tesoreria/*` (2 rutas) | `tesoreria` | `tesoreria/*` | Comentado L45 |
| `/contabilidad/*` (4 rutas) | `accounting` | `accounting/*` | Comentado L45 |
| `/analytics/dashboards` etc (7 rutas) | `analytics` | `analytics.indicadores_area` etc | Comentado L50 |

**Observación:** Este es el comportamiento esperado bajo el principio "LIVE es la verdad". Las rutas FE dormidas son guardadas por `withFullGuard` que verifica `ModuleGuard` → si el módulo no está habilitado en backend, el FE redirige automáticamente. No es un bug, es la arquitectura de feature-flags.

---

## 8. Stack backend — dependencias pinneadas

Fuente: `backend/requirements.txt`

| Paquete | Versión | Archivo fuente | Nota especial |
|---------|---------|----------------|---------------|
| Django | 5.0.9 | requirements.txt línea 19 | — |
| djangorestframework | 3.14.0 | línea 35 | — |
| django-tenants | 3.10.0 | línea 30 | — |
| djangorestframework-simplejwt | 5.3.0 | línea 36 | — |
| drf-spectacular | 0.27.0 | línea 37 | — |
| celery | 5.3.6 | línea 8 | — |
| django-celery-beat | 2.6.0 | línea 23 | — |
| django-celery-results | 2.5.1 | línea 24 | — |
| redis | 5.0.1 | línea 81 | — |
| django-redis | 5.4.0 | línea 29 | — |
| psycopg2-binary | 2.9.11 | línea 63 | — |
| weasyprint | 60.2 | línea 96 | **PINNEADO** — 68.x rompe PDF generation |
| pydyf | 0.10.0 | línea 65 | **PINNEADO** — 0.11+ rompe WeasyPrint 60.x |
| sentry-sdk | 2.20.0 | línea 85 | — |
| gunicorn | 25.1.0 | línea 40 | — |
| python-decouple | 3.8 | línea 73 | — |
| corsheaders (django-cors-headers) | 4.3.1 | línea 24 | — |
| django-auditlog | 2.3.0 | línea 22 | — |
| django-filter | 23.5 | línea 27 | — |
| django_csp | 3.8 | línea 32 | — |
| whitenoise | 6.6.0 | línea 98 | — |
| flower | 2.0.1 | línea 39 | — |
| pyhanko | 0.25.2 | línea 68 | Firma digital PDF |
| pyotp | 2.9.0 | línea 71 | 2FA TOTP |
| django-fsm | 3.0.0 | línea 26 | — |
| openpyxl | 3.1.2 | línea 52 | — |
| pillow | 12.1.1 | línea 61 | — |
| cryptography | 46.0.5 | línea 11 | — |
| google-api-python-client | 2.114.0 | línea 39 | IA / Google APIs |
| humanize | 4.15.0 | línea 44 | — |
| lxml | 6.0.2 | línea 53 | — |
| python-docx | 1.1.2 | línea 73 | — |
| qrcode | 7.4.2 | línea 80 | — |
| pdfplumber | 0.11.4 | línea 56 | — |
| pytesseract | 0.3.13 | línea 64 | OCR |
| prometheus_client | 0.24.1 | línea 59 | — |

**Versión Django confirmada:** 5.0.9 (línea 19 requirements.txt). Settings no especifica versión explícitamente.

---

## 9. Stack frontend — dependencias

Fuente: `frontend/package.json`. Versión del proyecto: **5.9.0**

### 9.1 dependencies (runtime)

| Paquete | Versión |
|---------|---------|
| react | ^18.2.0 |
| react-dom | ^18.2.0 |
| react-router-dom | ^6.21.0 |
| @tanstack/react-query | ^5.14.0 |
| @tanstack/react-table | ^8.21.3 |
| zustand | ^4.4.7 |
| react-hook-form | ^7.49.0 |
| zod | ^3.22.4 |
| axios | ^1.13.5 |
| tailwind-merge | ^2.2.0 |
| clsx | ^2.0.0 |
| lucide-react | ^0.468.0 |
| echarts | ^6.0.0 |
| echarts-for-react | ^3.0.6 |
| recharts | ^2.15.4 |
| framer-motion | ^12.23.26 |
| @xyflow/react | ^12.10.0 |
| @tiptap/react | ^3.15.1 |
| @tiptap/starter-kit | ^3.15.1 |
| @tiptap/extension-highlight | ^3.15.1 |
| @tiptap/extension-link | ^3.15.1 |
| @tiptap/extension-text-align | ^3.15.1 |
| @tiptap/extension-underline | ^3.15.1 |
| three | ^0.170.0 |
| @react-three/fiber | ^8.17.10 |
| @react-three/drei | ^9.117.0 |
| @types/three | ^0.170.0 |
| @hookform/resolvers | ^3.3.3 |
| @sentry/react | ^10.39.0 |
| @dagrejs/dagre | ^1.1.8 |
| @dnd-kit/core | ^6.3.1 |
| @dnd-kit/sortable | ^10.0.0 |
| @dnd-kit/utilities | ^3.2.2 |
| @fontsource/inter | ^5.0.0 |
| @fontsource/montserrat | ^5.2.8 |
| @headlessui/react | ^1.7.17 |
| date-fns | ^3.0.0 |
| dompurify | ^3.3.3 |
| html-to-image | ^1.11.13 |
| jspdf | ^4.2.1 |
| react-signature-canvas | ^1.0.7 |
| react-to-print | ^3.2.0 |
| simple-statistics | ^7.8.8 |
| sonner | ^2.0.7 |
| echarts-stat | ^1.2.0 |
| phaser | ^3.90.0 |
| nipplejs | ^0.10.2 |

### 9.2 devDependencies

| Paquete | Versión |
|---------|---------|
| vite | ^5.4.0 |
| typescript | ^5.3.0 |
| @vitejs/plugin-react | ^5.1.4 |
| vite-plugin-pwa | ^1.2.0 |
| vitest | ^1.0.4 |
| @vitest/coverage-v8 | ^1.0.4 |
| @vitest/ui | ^1.0.4 |
| eslint | ^9.39.0 |
| typescript-eslint | ^8.53.0 |
| eslint-plugin-react-hooks | ^5.2.0 |
| eslint-plugin-react-refresh | ^0.4.26 |
| tailwindcss | ^3.4.0 |
| autoprefixer | ^10.4.16 |
| postcss | ^8.4.32 |
| prettier | ^3.8.1 |
| @testing-library/react | ^14.1.2 |
| @testing-library/jest-dom | ^6.1.5 |
| @testing-library/user-event | ^14.5.1 |
| storybook | ^8.6.18 |
| @storybook/react | ^8.5.0 |
| @storybook/react-vite | ^8.5.0 |
| jsdom | ^23.0.1 |
| vite-bundle-visualizer | ^1.2.1 |
| @tailwindcss/forms | ^0.5.7 |

---

## 10. Infra

### 10.1 Docker Compose — servicios

Fuente: `docker-compose.yml`

| Servicio | Imagen | Puerto(s) | Perfil |
|----------|--------|-----------|--------|
| db | postgres:15-alpine | 127.0.0.1:5432:5432 | (siempre activo) |
| redis | redis:7-alpine | 127.0.0.1:6379:6379 | (siempre activo) |
| backend | Dockerfile (./backend) | 8000:8000 | (siempre activo) |
| celery | Dockerfile (./backend) | — | (siempre activo) |
| celerybeat | Dockerfile (./backend) | — | (siempre activo) |
| flower | Dockerfile (./backend) | 5555:5555 | `monitoring` (opcional) |
| frontend | Dockerfile.dev (./frontend) | 3010:3010 | `frontend` (opcional) |
| pgadmin | dpage/pgadmin4:8.14 | 5050:80 | `tools` (opcional) |
| mailpit | axllent/mailpit:latest | 8025:8025 (UI), 1025:1025 (SMTP) | (siempre activo) |
| redis-commander | rediscommander/redis-commander:0.8.1 | 8081:8081 | `tools` (opcional) |

### 10.2 GitHub Actions — workflows activos

| Workflow | Archivo | Trigger | Jobs principales |
|----------|---------|---------|-----------------|
| CI - Continuous Integration | `ci.yml` | push/PR a `main` o `develop` | backend-test, frontend-build, quality-summary |
| PR Checks | `pr-checks.yml` | pull_request (opened/synchronize/reopened) | pr-validation, code-statistics, dependency-check |
| CodeQL Security Analysis | `codeql.yml` | push/PR a `main`/`develop` + cron lunes 6AM UTC | CodeQL Analysis, Dependency Review |

**CI jobs detalle:**
- `backend-test`: Django checks, migrations, collectstatic, tests migrados (bloqueante), pytest LIVE suite (bloqueante 9 rutas), Black, Ruff, pip-audit
- `frontend-build`: tsc, ESLint (max-warnings=0), npm audit, Vitest, Vite production build, bundle size check
- `quality-summary`: agrega resultados

### 10.3 Systemd units (desde deploy.sh)

Fuente: `scripts/deploy.sh` líneas 47-50

- `stratekaz-gunicorn` (variable `GUNICORN_SERVICE`)
- `stratekaz-celery` (variable `CELERY_SERVICE`)
- `stratekaz-celerybeat` (variable `BEAT_SERVICE`)

**Nginx**: No se menciona como servicio systemd en deploy.sh (asumido configurado por separado en VPS).

---

## 11. Dependencias huérfanas (sospechosas)

### 11.1 Backend — en requirements pero con uso cuestionable

| Paquete | Sospecha | Verificación |
|---------|----------|--------------|
| `pytesseract` | OCR — uso desconocido en módulos LIVE | INCIERTO — posiblemente en módulos dormidos |
| `google-api-python-client` / `google-auth-*` | Integración Google — posiblemente para módulo IA | INCIERTO — `apps.ia` lo puede usar |
| `pdf2image` | Conversión PDF → imagen | INCIERTO — posiblemente en gestion_documental |
| `prometheus_client` | Métricas — sin configuración visible en settings | INCIERTO |
| `python-crontab` | Manipulación crontab del SO | INCIERTO — posiblemente en health checks |

### 11.2 Frontend — en package.json pero con uso solo en módulo dormido

| Paquete | Situación | Archivos que lo usan |
|---------|-----------|---------------------|
| `phaser` | Usado SOLO en `features/sst-game/` (módulo desactivado) | `frontend/src/features/sst-game/game/config.ts` |
| `nipplejs` | Usado SOLO en `features/sst-game/components/MobileControls.tsx` | `frontend/src/features/sst-game/components/MobileControls.tsx` |

**Impacto:** `phaser` y `nipplejs` aumentan el bundle size del proyecto aunque el juego SST esté desactivado. Candidatos a eliminación si se elimina o extrae el módulo `sst-game`.

---

## 12. Estado documental

| Archivo | Existe | Líneas | Última modificación |
|---------|--------|--------|---------------------|
| `docs/history/sprint-history.md` | Sí | 2291 | 2026-04-20 (inferido del historial git) |
| `docs/history/pitfalls.md` | Sí | 977 | INCIERTO |
| `docs/architecture/HALLAZGOS-PENDIENTES-2026-04.md` | Sí | 1230 | INCIERTO |
| `docs/architecture/PERIMETRO-LIVE.md` | Sí | 152 | 2026-04-19 16:00 |
| `docs/01-arquitectura/SOURCE_OF_TRUTH.md` | Sí | 220 | INCIERTO |
| `docs/02-desarrollo/coding-standards.md` | Sí | 365 | INCIERTO |
| `docs/02-desarrollo/frontend/DESIGN-SYSTEM.md` | Sí | 1709 | INCIERTO |
| `docs/04-devops/deploy.md` | Sí | 538 | INCIERTO |

---

## 13. Huecos documentales

| # | Documento faltante | Qué debería contener | Urgencia |
|---|--------------------|--------------------|---------|
| H-D1 | `docs/ARCHITECTURE.md` o `docs/01-arquitectura/ARCHITECTURE.md` con diagrama C0/C1/CT/C2/C3 | Diagrama visual de capas C0-C3 + portales, reglas de independencia, tabla de apps por capa | Media — existe `ARQUITECTURA-CASCADA-V2.md` y `ARQUITECTURA-DINAMICA.md` en `01-arquitectura/` pero no un documento unificado "ARCHITECTURE.md" canónico |
| H-D2 | `docs/STACK.md` con tabla de tecnologías | Tabla consolidada BE+FE+Infra con versiones actuales, justificaciones de pins | Baja — información dispersa en CLAUDE.md y requirements.txt/package.json |
| H-D3 | Mapa LIVE vs DORMIDO actualizado a 2026-04-20 | `PERIMETRO-LIVE.md` tiene 152 líneas y última modificación 2026-04-19. Verificar si refleja activación supply_chain S6 y mi_portal como LIVE | Alta — `mi_portal` ausencia en TENANT_APPS puede ser un hueco reciente no documentado |

---

## 14. Contradicciones código ↔ docs

| # | Fuente docs | Fuente código | Descripción |
|---|-------------|--------------|-------------|
| C-1 | `CLAUDE.md` sección "Modulos LIVE actuales": lista `mi_portal` como LIVE. `MEMORY.md` también lo menciona como LIVE. | `backend/config/settings/base.py`: `apps.mi_portal` **ausente** de TENANT_APPS (ni activa ni comentada). | `mi_portal` está montada en URLs condicionalmente (`if is_app_installed('apps.mi_equipo')`) y tiene FE activo, pero al no estar en TENANT_APPS, `migrate_schemas` no crea sus tablas en nuevos schemas de tenant. Si `mi_portal` tiene migraciones propias, esto es un bug de deploy latente. |
| C-2 | `CLAUDE.md` sección "Stack Tecnológico": `JWT_ACCESS_TOKEN_LIFETIME` documentado como "Access: 60 min". | `backend/config/settings/base.py` línea 423: `default=480` (8 horas). | El JWT access token default es 480 minutos (8h), no 60 minutos. El documento `docs/01-arquitectura/jwt-session-strategy.md` puede estar alineado (dice "8h/7d") pero CLAUDE.md dice "60 min". |
| C-3 | `CLAUDE.md` sección "Modulos LIVE actuales" (tabla): lista `mi_equipo` con 4 sub-apps. No menciona `apps.mi_equipo` (app padre) como entrada separada. | `backend/config/settings/base.py` líneas 213-217: `apps.mi_equipo` aparece como entrada padre **además** de las 4 sub-apps. | La entrada padre `apps.mi_equipo` (sin sub-app) está listada en TENANT_APPS junto con las 4 sub-apps. Esta app padre no tiene models.py directo (0 modelos). Puede ser intencional para routing pero no está explicitado en la documentación del módulo. |

**STOP RULE:** Se encontraron 3 contradicciones (umbral es >3). No se activó el stop ya que son exactamente 3. Se documentan todas.

---

## 15. CURRENT_DEPLOY_LEVEL

**Valor:** No existe como constante de settings explícita. Solo aparece como referencia en comentarios de `backend/config/celery.py` (líneas 128, 160, 241, 337, 354) con el valor `20`.

**Determinación efectiva por TENANT_APPS:** El nivel máximo activo inferido de `base.py` es **L20** (apps.mi_equipo + sub-apps, más supply_chain activado fuera de cascada lineal en S6).

**Archivo de referencia:** `backend/config/celery.py` (comentarios en líneas citadas arriba).

**Recomendación:** Definir `CURRENT_DEPLOY_LEVEL = 20` como constante en `base.py` para hacerlo verificable programáticamente (actualmente es solo convención de comentarios).
