# Plan de Migración Secuencial - StrateKaz

## Estado Actual

| Item | Estado | Detalle |
|------|--------|---------|
| Migraciones anteriores | ELIMINADAS | 117 archivos eliminados |
| BD stratekaz_master | LIMPIA | 0 tablas |
| Conexión MySQL | OK | MySQL 8.0.41 |
| Apps registradas | OK | 82 apps en INSTALLED_APPS |

## Arquitectura Multi-Tenant

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   BD MASTER (stratekaz_master)          BD TENANT (stratekaz_xxx)   │
│   ┌─────────────────────────┐           ┌─────────────────────────┐ │
│   │ - Plan                  │           │ - User (core)           │ │
│   │ - Tenant                │  ──────►  │ - Cargo                 │ │
│   │ - TenantUser            │           │ - Area                  │ │
│   │ - TenantUserAccess      │           │ - EmpresaConfig         │ │
│   │ - TenantDomain          │           │ - ... (datos empresa)   │ │
│   │ - TenantModuleSettings  │           │                         │ │
│   └─────────────────────────┘           └─────────────────────────┘ │
│                                                                      │
│   Modelos: apps.tenant                  Modelos: apps.core + resto  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Plan de Migración por Fases

### FASE 1: INFRAESTRUCTURA (BD Master)

| # | App | Dependencias | Backend | Frontend | Producción |
|---|-----|--------------|---------|----------|------------|
| 1 | `apps.tenant` | Ninguna | [ ] | [ ] | [ ] |

**Modelos:**
- Plan (planes de suscripción)
- Tenant (registro de empresas)
- TenantUser (usuarios globales)
- TenantUserAccess (permisos por tenant)
- TenantDomain (dominios adicionales)
- TenantModuleSettings (módulos por tenant)

### FASE 2: CORE DEL SISTEMA (BD Tenant)

| # | App | Dependencias | Backend | Frontend | Producción |
|---|-----|--------------|---------|----------|------------|
| 2 | `apps.core` | Ninguna | [ ] | [ ] | [ ] |

**Modelos:**
- User (usuarios del tenant)
- Cargo (puestos de trabajo)
- Role, Permiso (RBAC)
- SystemModule, ModuleTab, TabSection
- BrandingConfig

### FASE 3: GESTIÓN ESTRATÉGICA - Estructura

| # | App | Dependencias | Backend | Frontend | Producción |
|---|-----|--------------|---------|----------|------------|
| 3 | `apps.gestion_estrategica.organizacion` | core | [ ] | [ ] | [ ] |
| 4 | `apps.gestion_estrategica.configuracion` | core, org | [ ] | [ ] | [ ] |
| 5 | `apps.gestion_estrategica.identidad` | core, config | [ ] | [ ] | [ ] |

### FASE 4: GESTIÓN ESTRATÉGICA - Análisis

| # | App | Dependencias | Backend | Frontend | Producción |
|---|-----|--------------|---------|----------|------------|
| 6 | `apps.gestion_estrategica.planeacion` | core, org | [ ] | [ ] | [ ] |
| 7 | `apps.gestion_estrategica.contexto` | core, org, config | [ ] | [ ] | [ ] |
| 8 | `apps.gestion_estrategica.encuestas` | core, contexto | [ ] | [ ] | [ ] |

### FASE 5: GESTIÓN ESTRATÉGICA - Ejecución

| # | App | Dependencias | Backend | Frontend | Producción |
|---|-----|--------------|---------|----------|------------|
| 9 | `apps.gestion_estrategica.planificacion_sistema` | core, planeacion | [ ] | [ ] | [ ] |
| 10 | `apps.gestion_estrategica.revision_direccion` | core, config | [ ] | [ ] | [ ] |
| 11 | `apps.gestion_estrategica.gestion_proyectos` | core, planeacion | [ ] | [ ] | [ ] |
| 12 | `apps.gestion_estrategica.gestion_documental` | core, identidad | [ ] | [ ] | [ ] |

### FASE 6: MOTOR DE CUMPLIMIENTO

| # | App | Dependencias | Backend | Frontend | Producción |
|---|-----|--------------|---------|----------|------------|
| 13 | `apps.motor_cumplimiento.matriz_legal` | core | [ ] | [ ] | [ ] |
| 14 | `apps.motor_cumplimiento.requisitos_legales` | core | [ ] | [ ] | [ ] |
| 15 | `apps.motor_cumplimiento.partes_interesadas` | core | [ ] | [ ] | [ ] |
| 16 | `apps.motor_cumplimiento.reglamentos_internos` | core | [ ] | [ ] | [ ] |

### FASE 7: MOTOR DE RIESGOS

| # | App | Dependencias | Backend | Frontend | Producción |
|---|-----|--------------|---------|----------|------------|
| 17 | `apps.motor_riesgos.riesgos_procesos` | core | [ ] | [ ] | [ ] |
| 18 | `apps.motor_riesgos.ipevr` | core | [ ] | [ ] | [ ] |
| 19 | `apps.motor_riesgos.aspectos_ambientales` | core | [ ] | [ ] | [ ] |
| 20 | `apps.motor_riesgos.riesgos_viales` | core | [ ] | [ ] | [ ] |
| 21 | `apps.motor_riesgos.sagrilaft_ptee` | core | [ ] | [ ] | [ ] |
| 22 | `apps.motor_riesgos.seguridad_informacion` | core | [ ] | [ ] | [ ] |

### FASE 8: WORKFLOW ENGINE

| # | App | Dependencias | Backend | Frontend | Producción |
|---|-----|--------------|---------|----------|------------|
| 23 | `apps.workflow_engine.disenador_flujos` | core | [ ] | [ ] | [ ] |
| 24 | `apps.workflow_engine.ejecucion` | core, disenador | [ ] | [ ] | [ ] |
| 25 | `apps.workflow_engine.monitoreo` | core, ejecucion | [ ] | [ ] | [ ] |
| 26 | `apps.workflow_engine.firma_digital` | core | [ ] | [ ] | [ ] |

### FASE 9: HSEQ MANAGEMENT

| # | App | Dependencias | Backend | Frontend | Producción |
|---|-----|--------------|---------|----------|------------|
| 27 | `apps.hseq_management.calidad` | core | [ ] | [ ] | [ ] |
| 28 | `apps.hseq_management.medicina_laboral` | core | [ ] | [ ] | [ ] |
| 29 | `apps.hseq_management.seguridad_industrial` | core | [ ] | [ ] | [ ] |
| 30 | `apps.hseq_management.higiene_industrial` | core | [ ] | [ ] | [ ] |
| 31 | `apps.hseq_management.gestion_comites` | core | [ ] | [ ] | [ ] |
| 32 | `apps.hseq_management.accidentalidad` | core | [ ] | [ ] | [ ] |
| 33 | `apps.hseq_management.emergencias` | core | [ ] | [ ] | [ ] |
| 34 | `apps.hseq_management.gestion_ambiental` | core | [ ] | [ ] | [ ] |
| 35 | `apps.hseq_management.mejora_continua` | core | [ ] | [ ] | [ ] |

### FASE 10: SUPPLY CHAIN

| # | App | Dependencias | Backend | Frontend | Producción |
|---|-----|--------------|---------|----------|------------|
| 36 | `apps.supply_chain.catalogos` | core | [ ] | [ ] | [ ] |
| 37 | `apps.supply_chain.gestion_proveedores` | core, catalogos | [ ] | [ ] | [ ] |
| 38 | `apps.supply_chain.programacion_abastecimiento` | core | [ ] | [ ] | [ ] |
| 39 | `apps.supply_chain.compras` | core, proveedores | [ ] | [ ] | [ ] |
| 40 | `apps.supply_chain.almacenamiento` | core, catalogos | [ ] | [ ] | [ ] |

### FASE 11: PRODUCTION OPS

| # | App | Dependencias | Backend | Frontend | Producción |
|---|-----|--------------|---------|----------|------------|
| 41 | `apps.production_ops.recepcion` | core | [ ] | [ ] | [ ] |
| 42 | `apps.production_ops.procesamiento` | core | [ ] | [ ] | [ ] |
| 43 | `apps.production_ops.mantenimiento` | core | [ ] | [ ] | [ ] |
| 44 | `apps.production_ops.producto_terminado` | core | [ ] | [ ] | [ ] |

### FASE 12: LOGISTICS FLEET

| # | App | Dependencias | Backend | Frontend | Producción |
|---|-----|--------------|---------|----------|------------|
| 45 | `apps.logistics_fleet.gestion_flota` | core | [ ] | [ ] | [ ] |
| 46 | `apps.logistics_fleet.gestion_transporte` | core, flota | [ ] | [ ] | [ ] |
| 47 | `apps.logistics_fleet.despachos` | core | [ ] | [ ] | [ ] |
| 48 | `apps.logistics_fleet.pesv_operativo` | core | [ ] | [ ] | [ ] |

### FASE 13: SALES CRM

| # | App | Dependencias | Backend | Frontend | Producción |
|---|-----|--------------|---------|----------|------------|
| 49 | `apps.sales_crm.gestion_clientes` | core | [ ] | [ ] | [ ] |
| 50 | `apps.sales_crm.pipeline_ventas` | core, clientes | [ ] | [ ] | [ ] |
| 51 | `apps.sales_crm.pedidos_facturacion` | core | [ ] | [ ] | [ ] |
| 52 | `apps.sales_crm.servicio_cliente` | core, clientes | [ ] | [ ] | [ ] |

### FASE 14: TALENT HUB

| # | App | Dependencias | Backend | Frontend | Producción |
|---|-----|--------------|---------|----------|------------|
| 53 | `apps.talent_hub.estructura_cargos` | core | [ ] | [ ] | [ ] |
| 54 | `apps.talent_hub.seleccion_contratacion` | core | [ ] | [ ] | [ ] |
| 55 | `apps.talent_hub.colaboradores` | core, cargos | [ ] | [ ] | [ ] |
| 56 | `apps.talent_hub.onboarding_induccion` | core | [ ] | [ ] | [ ] |
| 57 | `apps.talent_hub.formacion_reinduccion` | core | [ ] | [ ] | [ ] |
| 58 | `apps.talent_hub.desempeno` | core | [ ] | [ ] | [ ] |
| 59 | `apps.talent_hub.control_tiempo` | core | [ ] | [ ] | [ ] |
| 60 | `apps.talent_hub.novedades` | core | [ ] | [ ] | [ ] |
| 61 | `apps.talent_hub.proceso_disciplinario` | core | [ ] | [ ] | [ ] |
| 62 | `apps.talent_hub.nomina` | core | [ ] | [ ] | [ ] |
| 63 | `apps.talent_hub.off_boarding` | core | [ ] | [ ] | [ ] |

### FASE 15: ADMIN FINANCE

| # | App | Dependencias | Backend | Frontend | Producción |
|---|-----|--------------|---------|----------|------------|
| 64 | `apps.admin_finance.tesoreria` | core | [ ] | [ ] | [ ] |
| 65 | `apps.admin_finance.presupuesto` | core | [ ] | [ ] | [ ] |
| 66 | `apps.admin_finance.activos_fijos` | core | [ ] | [ ] | [ ] |
| 67 | `apps.admin_finance.servicios_generales` | core | [ ] | [ ] | [ ] |

### FASE 16: ACCOUNTING

| # | App | Dependencias | Backend | Frontend | Producción |
|---|-----|--------------|---------|----------|------------|
| 68 | `apps.accounting.config_contable` | core | [ ] | [ ] | [ ] |
| 69 | `apps.accounting.movimientos` | core, config | [ ] | [ ] | [ ] |
| 70 | `apps.accounting.informes_contables` | core | [ ] | [ ] | [ ] |
| 71 | `apps.accounting.integracion` | core | [ ] | [ ] | [ ] |

### FASE 17: ANALYTICS

| # | App | Dependencias | Backend | Frontend | Producción |
|---|-----|--------------|---------|----------|------------|
| 72 | `apps.analytics.config_indicadores` | core | [ ] | [ ] | [ ] |
| 73 | `apps.analytics.dashboard_gerencial` | core | [ ] | [ ] | [ ] |
| 74 | `apps.analytics.indicadores_area` | core | [ ] | [ ] | [ ] |
| 75 | `apps.analytics.analisis_tendencias` | core | [ ] | [ ] | [ ] |
| 76 | `apps.analytics.generador_informes` | core | [ ] | [ ] | [ ] |
| 77 | `apps.analytics.acciones_indicador` | core | [ ] | [ ] | [ ] |
| 78 | `apps.analytics.exportacion_integracion` | core | [ ] | [ ] | [ ] |

### FASE 18: AUDIT SYSTEM

| # | App | Dependencias | Backend | Frontend | Producción |
|---|-----|--------------|---------|----------|------------|
| 79 | `apps.audit_system.logs_sistema` | core | [ ] | [ ] | [ ] |
| 80 | `apps.audit_system.centro_notificaciones` | core | [ ] | [ ] | [ ] |
| 81 | `apps.audit_system.config_alertas` | core | [ ] | [ ] | [ ] |
| 82 | `apps.audit_system.tareas_recordatorios` | core | [ ] | [ ] | [ ] |

---

## Proceso por Cada App

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PROCESO POR CADA APP                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. BACKEND                                                          │
│     ├─ python manage.py makemigrations <app>                        │
│     ├─ python manage.py migrate <app>                               │
│     ├─ Verificar models.py                                          │
│     ├─ Verificar serializers.py                                     │
│     ├─ Verificar viewsets.py                                        │
│     └─ Verificar admin.py                                           │
│                                                                      │
│  2. FRONTEND                                                         │
│     ├─ Verificar types/<app>.types.ts                               │
│     ├─ Verificar hooks/use<App>.ts                                  │
│     ├─ Verificar components/<App>*.tsx                              │
│     └─ npm run build (verificar errores TS)                         │
│                                                                      │
│  3. PRODUCCIÓN                                                       │
│     ├─ git add + commit + push                                      │
│     ├─ Deploy backend (migrate en prod)                             │
│     ├─ Deploy frontend                                              │
│     └─ Verificar funcionalidad                                      │
│                                                                      │
│  4. SIGUIENTE APP                                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Comandos Útiles

```bash
# Generar migración de una app
python manage.py makemigrations <app_label>

# Aplicar migración de una app
python manage.py migrate <app_label>

# Ver migraciones pendientes
python manage.py showmigrations

# Verificar modelos sin errores
python manage.py check

# Crear superusuario
python manage.py createsuperuser

# Crear tenant nuevo
python manage.py create_tenant
```

## Notas Importantes

1. **apps.tenant** se migra a BD Master (`stratekaz_master`)
2. **El resto de apps** se migran a BD Tenant (una por empresa)
3. **No hacer** `migrate --run-syncdb` ya que puede crear tablas sin migraciones
4. **Siempre verificar** que no hay dependencias circulares antes de migrar
5. **Probar en local** antes de deploy a producción

---

## Historial de Migración

| Fecha | App | Commit | Notas |
|-------|-----|--------|-------|
| 2026-01-31 | - | f78519b | Limpieza de migraciones, BD lista |
| - | - | - | - |

