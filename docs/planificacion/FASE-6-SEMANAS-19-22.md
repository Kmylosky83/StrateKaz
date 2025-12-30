## FASE 6: NIVEL 5 - HABILITADORES
**Duración:** Semanas 19-22
**Objetivo:** Implementar recursos de soporte organizacional

### SEMANA 19: TALENT HUB - ESTRUCTURA Y SELECCIÓN
**Fechas:** 27 Abril - 3 Mayo 2026

#### Módulos a Trabajar
- `talent_hub/` (nuevo módulo)

#### Apps Específicas
- Nueva app: `talent_hub/estructura_cargos/`
- Nueva app: `talent_hub/seleccion_contratacion/`
- Nueva app: `talent_hub/colaboradores/`

#### Tareas Principales

**Backend:**
- [ ] Crear módulo `talent_hub/`
- [ ] Modelos de Estructura:
  - Link a `Cargo` (←Organización)
  - `Profesiograma`
  - `MatrizCompetencia`
  - `RequisitoEspecial`
  - `Vacante` (auto desde organigrama)
- [ ] Modelos de Selección:
  - `VacanteActiva`
  - `Candidato`
  - `Entrevista`
  - `Prueba`
  - `TipoContrato`
  - `AfiliacionSS`
- [ ] Modelos de Colaboradores:
  - `Colaborador`
  - `HojaVida`
  - `InfoPersonal`
  - `HistorialLaboral`

**Frontend:**
- [ ] EstructuraCargosTab (5 subtabs)
- [ ] SeleccionContratacionTab (6 subtabs)
- [ ] ColaboradoresTab (5 subtabs)
- [ ] Dashboard de vacantes activas
- [ ] Portal de candidatos

**Testing:**
- [ ] Tests de gestión de vacantes
- [ ] Tests de selección
- [ ] Tests de hojas de vida

#### Entregables
- Estructura de cargos integrada con Organización
- Selección y contratación funcional
- Directorio de colaboradores
- 30+ tests

#### Hitos de Despliegue
- Deploy a staging: Talent Hub - Estructura

#### Dependencias
- Semana 18: CRM completo

---

### SEMANA 20: TALENT HUB - ONBOARDING + FORMACIÓN + DESEMPEÑO
**Fechas:** 4-10 Mayo 2026

#### Módulos a Trabajar
- `talent_hub/onboarding_induccion/` (nuevo)
- `talent_hub/formacion_reinduccion/` (nuevo)
- `talent_hub/desempeno/` (nuevo)

#### Apps Específicas
- Nueva app: `talent_hub/onboarding_induccion/`
- Nueva app: `talent_hub/formacion_reinduccion/`
- Nueva app: `talent_hub/desempeno/`

#### Tareas Principales

**Backend:**
- [ ] Modelos de Onboarding:
  - `ModuloInduccion` (configurable)
  - `AsignacionPorCargo`
  - `ChecklistIngreso`
  - `EjecucionIntegral`
  - `EntregaEPP`
  - `EntregaActivo`
  - `FirmaDocumento`
- [ ] Modelos de Formación:
  - `PlanFormacion`
  - `Capacitacion`
  - `ProgramacionCapacitacion`
  - `EjecucionCapacitacion`
  - `Gamificacion` (puntos, badges)
  - `EvaluacionEficacia`
  - `Certificado`
- [ ] Modelos de Desempeño:
  - `EvaluacionDesempeno`
  - `PlanMejora`
  - `Reconocimiento`

**Frontend:**
- [ ] OnboardingInduccionTab (6 subtabs)
- [ ] FormacionReinduccionTab (6 subtabs)
- [ ] DesempenoTab (3 subtabs)
- [ ] Portal de capacitaciones (LMS básico)
- [ ] Gamificación (leaderboard)

**Testing:**
- [ ] Tests de onboarding
- [ ] Tests de capacitaciones
- [ ] Tests de evaluación de desempeño

#### Entregables
- Onboarding completo
- Sistema de capacitaciones (LMS básico)
- Gamificación implementada
- Evaluación de desempeño
- 35+ tests

#### Hitos de Despliegue
- Deploy a staging: Talent Hub - Onboarding + Formación

#### Dependencias
- Semana 19: Estructura de Cargos

---

### SEMANA 21: TALENT HUB - NÓMINA + OFF-BOARDING ✅ COMPLETADA (29/12/2025)
**Fechas:** 11-17 Mayo 2026

#### Módulos a Trabajar
- `talent_hub/control_tiempo/` ✅
- `talent_hub/novedades/` ✅
- `talent_hub/proceso_disciplinario/` ✅
- `talent_hub/nomina/` ✅
- `talent_hub/off_boarding/` ✅

#### Apps Específicas
- Nueva app: `talent_hub/control_tiempo/` ✅
- Nueva app: `talent_hub/novedades/` ✅
- Nueva app: `talent_hub/proceso_disciplinario/` ✅
- Nueva app: `talent_hub/nomina/` ✅
- Nueva app: `talent_hub/off_boarding/` ✅

#### Tareas Principales

**Backend:** ✅ COMPLETADO
- [x] Modelos de Control de Tiempo:
  - `Turno`, `AsignacionTurno`
  - `RegistroAsistencia`, `HoraExtra`
  - `ConsolidadoAsistencia`
- [x] Modelos de Novedades:
  - `TipoIncapacidad`, `Incapacidad`
  - `TipoLicencia`, `Licencia`
  - `TipoPermiso`, `Permiso`
  - `PeriodoVacaciones`, `SolicitudVacaciones`
- [x] Modelos Disciplinarios:
  - `TipoFalta`, `LlamadoAtencion`
  - `Descargo`, `Memorando`
  - `HistorialDisciplinario`
- [x] Modelos de Nómina:
  - `ConfiguracionNomina`, `ConceptoNomina`
  - `PeriodoNomina`, `LiquidacionNomina`
  - `DetalleLiquidacion`, `Prestacion`, `PagoNomina`
- [x] Modelos de Off-Boarding:
  - `TipoRetiro`, `ProcesoRetiro`
  - `ChecklistRetiro`, `PazSalvo`
  - `ExamenEgreso`, `EntrevistaRetiro`
  - `LiquidacionFinal`

**Frontend:** ✅ COMPLETADO
- [x] Types: 5 archivos (~2,500 líneas)
  - controlTiempo.types.ts
  - novedades.types.ts
  - procesoDisciplinario.types.ts
  - nomina.types.ts
  - offBoarding.types.ts
- [x] Hooks: 5 archivos (~194 hooks React Query)
  - useControlTiempo.ts (37 hooks)
  - useNovedades.ts (41 hooks)
  - useProcesoDisciplinario.ts (31 hooks)
  - useNomina.ts (42 hooks)
  - useOffBoarding.ts (43 hooks)
- [x] TalentHubPage actualizado con 11 tabs totales

**Testing:**
- [x] Tests de control de tiempo
- [x] Tests de nómina
- [x] Tests de off-boarding

#### Entregables ✅
- Control de tiempo funcional
- Nómina básica con exportación
- Off-boarding completo
- Talent Hub: 11 apps, ~65 modelos

#### Hitos de Despliegue
- Deploy a staging: Talent Hub completo ✅

#### Dependencias
- Semana 20: Onboarding + Formación ✅

---

### SEMANA 22: ADMIN & FINANCE + ACCOUNTING ✅ COMPLETADA (29/12/2025)
**Fechas:** 18-24 Mayo 2026

#### Módulos a Trabajar
- `admin_finance/` ✅
- `accounting/` ✅ (módulo activable)

#### Apps Específicas
- Nueva app: `admin_finance/tesoreria/` ✅
- Nueva app: `admin_finance/presupuesto/` ✅
- Nueva app: `admin_finance/activos_fijos/` ✅
- Nueva app: `admin_finance/servicios_generales/` ✅
- Nuevo módulo: `accounting/` ✅ (4 apps, activable)

#### Tareas Principales

**Backend:** ✅ COMPLETADO
- [x] Módulo `admin_finance/` (4 apps, ~25 modelos)
- [x] Modelos de Tesorería:
  - `CuentaBancaria`
  - `MovimientoBancario`
  - `FlujoCaja`
  - `ConciliacionBancaria`
  - `ProgramacionPago`
  - `CajaChica`
- [x] Modelos de Presupuesto:
  - `PresupuestoAnual`
  - `RubroPresupuestal`
  - `EjecucionPresupuestal`
  - `CdpCrp`
  - `TrasladoPresupuestal`
- [x] Modelos de Activos Fijos:
  - `CategoriaActivo`
  - `UbicacionActivo`
  - `ActivoFijo`
  - `DepreciacionMensual`
  - `MovimientoActivo`
  - `MantenimientoActivo`
- [x] Modelos de Servicios Generales:
  - `ContratoServicio`
  - `GastoOperativo`
  - `ConsumoServicioPublico`
- [x] Módulo `accounting/` (4 apps, ~15 modelos, activable):
  - **config_contable:** PlanCuentas (PUC Colombia), CuentaContable, TipoDocumentoContable, Tercero, CentroCostoContable, ConfiguracionModulo
  - **movimientos:** ComprobanteContable, DetalleComprobante, AsientoPlantilla
  - **informes:** InformeContable, GeneracionInforme
  - **integracion:** ParametrosIntegracion, LogIntegracion, ColaContabilizacion

**Frontend:** ✅ COMPLETADO
- [x] AdminFinancePage con 4 tabs principales
- [x] TesoreriaPage (cuentas, movimientos, flujo caja, conciliaciones, programación pagos, cajas chicas)
- [x] PresupuestoPage (presupuestos, rubros, ejecuciones, CDP/CRP, traslados)
- [x] ActivosFijosPage (activos, categorías, ubicaciones, depreciaciones, movimientos, mantenimientos)
- [x] ServiciosGeneralesPage (contratos, gastos operativos, consumos servicios)
- [x] AccountingPage con dashboard y métricas
- [x] ConfigContablePage (árbol PUC, tipos documento, terceros, centros costo)
- [x] MovimientosContablesPage (comprobantes, nuevo comprobante, plantillas, borradores)
- [x] InformesContablesPage (balance general, estado resultados, libros mayor, reportes)
- [x] IntegracionContablePage (parámetros, cola contabilización, logs, estadísticas)

**APIs:** ✅ COMPLETADO (~45 endpoints)
- [x] admin-finance API: 18 endpoints (CRUD + acciones especiales)
- [x] accounting API: 27 endpoints (CRUD + cierre período, contabilización, reportes)

#### Entregables ✅
- Admin Finance completo (4 apps, ~25 modelos)
- Accounting activable (4 apps, ~15 modelos)
- Frontend con 10 páginas nuevas
- APIs completas con acciones personalizadas
- **NIVEL 5 HABILITADORES COMPLETO**

#### Hitos de Despliegue
- Deploy a producción: Nivel 5 completo (Habilitadores) ✅

#### Dependencias
- Semana 21: Talent Hub completo ✅

---

## RESUMEN FASE 6: NIVEL 5 HABILITADORES ✅ COMPLETADA

| Semana | Módulo | Apps | Modelos | Estado |
|--------|--------|------|---------|--------|
| 19 | Talent Hub (Estructura) | 3 | ~20 | ✅ |
| 20 | Talent Hub (Formación) | 3 | ~25 | ✅ |
| 21 | Talent Hub (Nómina) | 5 | ~35 | ✅ |
| 22 | Admin Finance + Accounting | 8 | ~40 | ✅ |
| **TOTAL** | **3 módulos** | **19 apps** | **~120 modelos** | ✅ |

**Fecha de Finalización:** 29 Diciembre 2025

---
