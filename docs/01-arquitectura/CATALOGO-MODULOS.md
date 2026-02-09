# Catálogo de Módulos - StrateKaz

> **Versión:** 4.2.0
> **Última actualización:** 2026-02-08
> **Total:** 17 módulos (2 core + 15 domain), ~81 sub-apps de negocio

---

## Resumen por Nivel

| Nivel | Nombre | Módulos | Sub-apps | Estado |
|-------|--------|---------|----------|--------|
| 0 | Core Base | 2 | ~10 | ✅ Completo |
| 1 | Estratégico | 1 | 10 | ✅ Completo |
| 2 | Cumplimiento | 3 | 14 | ✅ Completo |
| 3 | Torre de Control | 1 | 9 | ✅ Completo |
| 4 | Cadena de Valor | 4 | 16 | ✅ Completo |
| 5 | Habilitadores | 3 | 19 | ✅ Completo |
| 6 | Inteligencia | 2 | 11 | ✅ Completo |

---

## NIVEL 0: Core Base

### `core`
**Propósito:** Autenticación, usuarios, RBAC, configuración global

| Sub-app | Descripción | Modelos Principales |
|---------|-------------|---------------------|
| users | Gestión de usuarios | User, UserProfile |
| roles | Sistema RBAC | Role, Permission, RolePermission |
| menu | Navegación dinámica | MenuItem, MenuGroup |
| config | Configuración global | SystemConfig, Feature |

**Características:**
- Autenticación JWT (SimpleJWT)
- 2FA con TOTP
- RBAC con 3 tipos de roles (Cargo, Funcional, Certificado)
- Menú dinámico desde base de datos

### `tenant`
**Propósito:** Sistema multi-tenant con PostgreSQL schemas

| Sub-app | Descripción | Modelos Principales |
|---------|-------------|---------------------|
| tenants | Gestión de tenants | Tenant, TenantUser |
| plans | Planes de suscripción | Plan, PlanFeature |
| domains | Dominios por tenant | Domain |

**Características:**
- Aislamiento por PostgreSQL schemas
- django-tenants para multi-tenancy
- Planes de suscripción configurables

---

## NIVEL 1: Estratégico (STRATEGIC)

### `gestion_estrategica`
**Propósito:** Dirección estratégica corporativa

| Sub-app | Descripción | Modelos Principales |
|---------|-------------|---------------------|
| configuracion | Configuración empresa | EmpresaConfig, Parametro |
| organizacion | Estructura organizacional | Area, Cargo, Sede |
| identidad | Identidad corporativa | Mision, Vision, Valores, Politica |
| planeacion | Planeación estratégica | ObjetivoEstrategico, Meta |
| contexto | Análisis de contexto | DOFA, ParteInteresada |
| encuestas | Sistema de encuestas | Encuesta, Pregunta, Respuesta |
| gestion_proyectos | Proyectos estratégicos | Proyecto, Tarea, Hito |
| revision_direccion | Revisión por dirección | RevisionDireccion, Hallazgo |
| gestion_documental | Gestión documental | Documento, Version, Aprobacion |
| planificacion_sistema | Planificación SG | PlanAnual, Actividad |

---

## NIVEL 2: Cumplimiento (COMPLIANCE)

### `motor_cumplimiento`
**Propósito:** Gestión de cumplimiento normativo

| Sub-app | Descripción | Modelos Principales |
|---------|-------------|---------------------|
| matriz_legal | Matriz de requisitos legales | RequisitoLegal, Evaluacion |
| requisitos_legales | Catálogo de requisitos | NormaLegal, Articulo |
| partes_interesadas | Stakeholders | ParteInteresada, Expectativa |
| reglamentos_internos | Reglamentos internos | Reglamento, Capitulo |

### `motor_riesgos`
**Propósito:** Gestión integral de riesgos

| Sub-app | Descripción | Modelos Principales |
|---------|-------------|---------------------|
| riesgos_procesos | Riesgos de procesos | Riesgo, Valoracion, Control |
| ipevr | IPEVR (SST) | Peligro, RiesgoOcupacional |
| aspectos_ambientales | Aspectos ambientales | AspectoAmbiental, ImpactoAmbiental |
| riesgos_viales | Riesgos viales (PESV) | RiesgoVial, FactorRiesgo |
| seguridad_informacion | Seguridad de información | ActivoInformacion, Amenaza |
| sagrilaft_ptee | SAGRILAFT/PTEE | RiesgoLAFT, Contramedida |

### `workflow_engine`
**Propósito:** Motor de flujos de trabajo BPMN

| Sub-app | Descripción | Modelos Principales |
|---------|-------------|---------------------|
| disenador_flujos | Diseñador visual | Workflow, Nodo, Transicion |
| ejecucion | **Motor BPMN completo** (Sprint 1) | Instancia, Tarea, Asignacion |
| monitoreo | Monitoreo de flujos + SLA | Metrica, Alerta |
| firma_digital | Firma digital | SolicitudFirma, Firma |

**Sprint 1+3 completados:** WorkflowExecutionService con 6 node handlers (Strategy Pattern), auto-advance, parallel gateway split/join, SLA monitoring via Celery. Frontend: React Flow Designer con drag & drop, DynamicFormRenderer (12 field types).

---

## NIVEL 3: Torre de Control (INTEGRATED)

### `hseq_management`
**Propósito:** Seguridad, Salud, Ambiente, Calidad

| Sub-app | Descripción | Modelos Principales |
|---------|-------------|---------------------|
| accidentalidad | Gestión de accidentes | Accidente, Investigacion |
| seguridad_industrial | Seguridad industrial | Inspeccion, ElementoProteccion |
| higiene_industrial | Higiene industrial | MedicionHigienica, Agente |
| medicina_laboral | Medicina laboral | ExamenMedico, Restriccion |
| emergencias | Plan de emergencias | PlanEmergencia, Brigada, Simulacro |
| gestion_ambiental | Gestión ambiental | ProgramaAmbiental, Indicador |
| calidad | Gestión de calidad | NoConformidad, AccionCorrectiva |
| mejora_continua | Mejora continua | Mejora, PlanAccion |
| gestion_comites | Comités (COPASST, CCL) | Comite, Reunion, Acta |

---

## NIVEL 4: Cadena de Valor (OPERATIONAL)

### `supply_chain`
**Propósito:** Cadena de suministro

| Sub-app | Descripción | Modelos Principales |
|---------|-------------|---------------------|
| catalogos | Catálogos maestros | Producto, Categoria, UnidadMedida |
| gestion_proveedores | Gestión de proveedores | Proveedor, Evaluacion, Contrato |
| compras | Proceso de compras | Requisicion, OrdenCompra, Recepcion |
| almacenamiento | Gestión de almacén | Almacen, Ubicacion, Kardex |
| programacion_abastecimiento | Programación | ProgramaAbastecimiento, Necesidad |

### `production_ops`
**Propósito:** Operaciones de producción

| Sub-app | Descripción | Modelos Principales |
|---------|-------------|---------------------|
| recepcion | Recepción de materia prima | RecepcionMP, InspeccionMP |
| procesamiento | Procesamiento | OrdenProduccion, Lote |
| producto_terminado | Producto terminado | ProductoTerminado, Liberacion |
| mantenimiento | Mantenimiento | EquipoMantenimiento, OrdenTrabajo |

### `logistics_fleet`
**Propósito:** Logística y flota vehicular

| Sub-app | Descripción | Modelos Principales |
|---------|-------------|---------------------|
| gestion_flota | Gestión de flota PESV | Vehiculo, Conductor, DocumentoVehiculo |
| gestion_transporte | Gestión de transporte | Ruta, Manifiesto, Despacho |
| despachos | Despachos de producto | Despacho, GuiaRemision |
| pesv_operativo | PESV operativo | InspeccionPreoperacional, ControlVelocidad |

### `sales_crm`
**Propósito:** Ventas y CRM

| Sub-app | Descripción | Modelos Principales |
|---------|-------------|---------------------|
| gestion_clientes | Gestión de clientes | Cliente, Contacto, Segmento |
| pipeline_ventas | Pipeline de ventas | Oportunidad, Cotizacion |
| pedidos_facturacion | Pedidos y facturación | Pedido, Factura, Pago |
| servicio_cliente | Servicio al cliente | PQRS, SLA, Fidelizacion |

---

## NIVEL 5: Habilitadores (SUPPORT)

### `talent_hub`
**Proposito:** Gestion integral del ciclo de vida del empleado — desde seleccion hasta retiro
**Modelos:** 82 | **Sub-apps:** 11 + api/ + services/ | **Ley 2466/2025:** Compliance completo
**Doc completa:** [TALENT-HUB-COMPLETO.md](../../docs/03-modulos/talent-hub/TALENT-HUB-COMPLETO.md)

| Sub-app | Descripcion | Modelos Principales |
|---------|-------------|---------------------|
| estructura_cargos | Estructura de cargos y profesiogramas | Profesiograma, MatrizCompetencia, RequisitoEspecial, Vacante |
| seleccion_contratacion | Seleccion, contratacion y **historial contratos** | VacanteActiva, Candidato, Entrevista, Prueba, AfiliacionSS, TipoContrato, **HistorialContrato** |
| colaboradores | Gestion de colaboradores | Colaborador, HojaVida, InfoPersonal, HistorialLaboral |
| onboarding_induccion | Onboarding e induccion | ModuloInduccion, ChecklistIngreso, EjecucionIntegral, EntregaEPP, FirmaDocumento |
| formacion_reinduccion | Formacion, LMS y gamificacion | PlanFormacion, Capacitacion, EjecucionCapacitacion, Badge, Certificado |
| desempeno | Evaluacion desempeno 360 y reconocimientos | CicloEvaluacion, EvaluacionDesempeno, PlanMejora, Reconocimiento |
| control_tiempo | Control de tiempo y **recargos graduales** | Turno, AsignacionTurno, RegistroAsistencia, HoraExtra, ConsolidadoAsistencia, **ConfiguracionRecargo** |
| novedades | Incapacidades, licencias, permisos, vacaciones | Incapacidad, Licencia, Permiso, PeriodoVacaciones, SolicitudVacaciones |
| nomina | Procesamiento de nomina | ConfiguracionNomina, ConceptoNomina, PeriodoNomina, LiquidacionNomina, Prestacion |
| proceso_disciplinario | Proceso disciplinario con **garantias Ley 2466** | TipoFalta, LlamadoAtencion, Descargo, Memorando, HistorialDisciplinario, **NotificacionDisciplinaria**, **PruebaDisciplinaria** |
| off_boarding | Retiro y liquidacion | ProcesoRetiro, ChecklistRetiro, PazSalvo, EntrevistaRetiro, LiquidacionFinal |

**Componentes adicionales:**

| Carpeta | Descripcion | Contenido |
|---------|-------------|-----------|
| api/ | APIs especializadas | ESS (Mi Portal, 7 endpoints), MSS (Mi Equipo, 5 endpoints), People Analytics (1 endpoint) |
| services/ | Servicios de negocio | NotificadorTH (18 metodos de notificacion) |
| management/ | Comandos Django | seed_th_enhancements (seed data inicial) |
| signals/ | 8 archivos de signals | Eventos automaticos por sub-app + auto-create Colaborador |
| tasks.py | 2 Celery tasks | check_contratos_por_vencer, check_periodos_prueba |

**Compliance Ley 2466/2025 (Reforma Laboral Colombia):**
- **ConfiguracionRecargo:** Incremento gradual de recargos dominicales/festivos (80% Jul-2025, 90% Jul-2026, 100% Jul-2027)
- **HistorialContrato:** Trazabilidad de renovaciones, tope 4 anos acumulados, justificacion obligatoria si no es indefinido
- **Descargo:** Minimo 5 dias habiles, acompanante (sindical/familiar/abogado), derecho a apelacion
- **NotificacionDisciplinaria:** Acuse de recibo formal, testigos, soporte digital
- **PruebaDisciplinaria:** Gestion estructurada de pruebas (documental, testimonial, tecnica)

**Frontend:**

| Feature | Componentes | Ruta |
|---------|-------------|------|
| Mi Portal (ESS) | 9 componentes (MiPerfilCard, VacacionesSaldo, RecibosNomina, etc.) | `/mi-portal/` (**HOME post-login**) |
| Mi Equipo (MSS) | 5 componentes (EquipoResumen, AprobacionesPendientes, etc.) | `/mi-equipo/` (solo jefes: `is_jefatura`) |
| People Analytics | 1 dashboard (PeopleAnalyticsDashboard) | `/people-analytics/` |
| Hooks | 11 custom hooks (useColaboradores, useControlTiempo, etc.) | — |
| Types | 12 archivos de tipos TypeScript | — |

### `admin_finance`
**Propósito:** Finanzas administrativas

| Sub-app | Descripción | Modelos Principales |
|---------|-------------|---------------------|
| presupuesto | Presupuesto | Presupuesto, CentrosCosto |
| tesoreria | Tesorería | Flujo, CuentaBancaria, Pago |
| activos_fijos | Activos fijos | ActivoFijo, Depreciacion |
| servicios_generales | Servicios generales | Servicio, Contrato |

### `accounting`
**Propósito:** Contabilidad (módulo activable)

| Sub-app | Descripción | Modelos Principales |
|---------|-------------|---------------------|
| config_contable | Configuración contable | PlanCuentas, Cuenta |
| movimientos | Movimientos contables | Asiento, MovimientoContable |
| informes_contables | Informes contables | BalanceGeneral, EstadoResultados |
| integracion | Integraciones | IntegracionERP, Mapping |

---

## NIVEL 6: Inteligencia (INTELLIGENCE)

### `analytics`
**Propósito:** Inteligencia de negocio

| Sub-app | Descripción | Modelos Principales |
|---------|-------------|---------------------|
| config_indicadores | Configuración KPIs | CatalogoKPI, FichaTecnica |
| indicadores_area | Indicadores por área | ValorKPI, MetaKPI |
| acciones_indicador | Acciones por indicador | PlanAccionKPI, Seguimiento |
| dashboard_gerencial | Dashboards BSC | Dashboard, Widget |
| generador_informes | Generador de informes | PlantillaInforme, Informe |
| analisis_tendencias | Análisis de tendencias | TendenciaKPI, Anomalia |
| exportacion_integracion | Exportación | ConfigExportacion, LogExportacion |

### `audit_system`
**Propósito:** Sistema de auditoría y notificaciones

| Sub-app | Descripción | Modelos Principales |
|---------|-------------|---------------------|
| logs_sistema | Logs de sistema | LogAcceso, LogCambio |
| config_alertas | Configuración de alertas | TipoAlerta, Alerta |
| centro_notificaciones | Notificaciones | Notificacion, Preferencia |
| tareas_recordatorios | Tareas y recordatorios | Tarea, Recordatorio, Evento |

---

## Reglas de Dependencias

```
NIVEL N solo puede importar de NIVEL < N

Nivel 0 → Solo Django/third-party
Nivel 1 → Nivel 0
Nivel 2 → Niveles 0, 1
Nivel 3 → Niveles 0, 1, 2
Nivel 4 → Niveles 0, 1, 2, 3
Nivel 5 → Niveles 0, 1, 2, 3, 4
Nivel 6 → Niveles 0, 1, 2, 3, 4, 5
```

**Prohibiciones:**
- ❌ Importaciones circulares entre módulos del mismo nivel
- ❌ Importaciones de nivel superior (N importa de N+1)
- ❌ Importaciones directas entre sub-apps de diferentes módulos

---

## Referencias

- [ARQUITECTURA-SISTEMA.md](ARQUITECTURA-SISTEMA.md) - Arquitectura general
- [DATABASE-ARCHITECTURE.md](DATABASE-ARCHITECTURE.md) - Arquitectura de BD
- [DIAGRAMA-ER.md](DIAGRAMA-ER.md) - Diagramas entidad-relacion
