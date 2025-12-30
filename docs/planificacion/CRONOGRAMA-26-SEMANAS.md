# CRONOGRAMA DE DESARROLLO - 26 SEMANAS
# ERP Multi-Empresa StrateKaz

**Fecha de Inicio:** 2025-12-22
**Fecha de Finalización:** 2026-06-28
**Versión:** 1.0.0
**Equipo:** Agestes Especializados [agents] (.claude\agents) (Backend, Frontend, QA, DevOps)

---

## RESUMEN EJECUTIVO

### Estructura del Proyecto

| Métrica | Cantidad |
|---------|----------|
| Niveles Jerárquicos | 6 |
| Módulos Principales | 14 |
| Apps Django | 81 apps |
| Tablas Base de Datos | 154 tablas |
| Endpoints API | ~300 endpoints |

### Arquitectura de Niveles

```
Nivel 1: Estratégico        → Dirección Estratégica (1 módulo)
Nivel 2: Cumplimiento       → Cumplimiento, Riesgos, Workflows (3 módulos)
Nivel 3: Torre de Control   → HSEQ Management (1 módulo)
Nivel 4: Cadena de Valor    → Supply Chain, Producción, Logística, CRM (4 módulos)
Nivel 5: Habilitadores      → Talento, Finanzas, Contabilidad (3 módulos)
Nivel 6: Inteligencia       → Analytics, Auditoría (2 módulos)
```

### Stack Tecnológico

| Componente | Tecnología |
|------------|-----------|
| Backend | Django 5.0.9 + DRF + MySQL 8.0 |
| Frontend | React 18 + TypeScript + Vite 5 |
| UI/UX | Tailwind CSS + Framer Motion |
| Async Tasks | Celery + Redis |
| DevOps | Docker + Docker Compose |

---

## ⚠️ PRINCIPIO CRÍTICO: CÓDIGO REUTILIZABLE

> **ANTES de escribir código nuevo, SIEMPRE verificar:**
> 1. ¿Existe un abstract model que pueda heredar?
> 2. ¿Existe un mixin que provea esta funcionalidad?
> 3. ¿Existe un hook genérico que pueda usar?
> 4. Si NO existe, ¿debería crear uno reutilizable?

#### Fase 1.5 - Migración Semanas 1-2: ✅ COMPLETADA (24/12/2025)

| App | Modelos Migrados | Abstract Models |
| --- | ---------------- | --------------- |
| configuracion | EmpresaConfig, SedeEmpresa, IntegracionExterna | TimestampedModel, AuditModel, SoftDeleteModel |
| organizacion | Area, CategoriaDocumento, TipoDocumento, ConsecutivoConfig | AuditModel, TimestampedModel, SoftDeleteModel, OrderedModel |
| identidad | CorporateIdentity, CorporateValue | AuditModel, TimestampedModel, SoftDeleteModel, OrderedModel |

> **Nota:** Se renombró `models/` a `base_models/` para evitar conflictos con `models.py` en core app.

**Fase 2 - Migración Gradual: INTEGRADA CON DESARROLLO**

> **Estrategia: "Crear App + Migrar Modelo"**
>
> Cada vez que se crea o modifica una app, los modelos se migran simultáneamente
> a los nuevos abstract models. Esto significa:
>
> 1. **Al crear una app nueva** → Usar directamente `BaseCompanyModel` o el abstract apropiado
> 2. **Al modificar una app existente** → Migrar modelos en ese momento
> 3. **Nunca crear modelos nuevos sin heredar** de los abstract models
>
> **Ventajas de este enfoque:**
> - No hay "sprint de migración" separado
> - Cambios más pequeños y manejables
> - Tests se validan inmediatamente
> - El código nuevo siempre es consistente

**Integración Migración ↔ Desarrollo por Semana:**

| Semana | App a Desarrollar | Migración Simultánea | Herencia |
|--------|------------------|---------------------|----------|
| 3 | `organizacion` (completar) | Area, Cargo, NivelJerarquico | `BaseCompanyModel` |
| 4 | `identidad`, `planeacion` | Modelos nuevos | `BaseCompanyModel` |
| 5 | `proyectos` (nuevo) | Creación directa | `BaseCompanyModel` |
| 6 | `revision_direccion` (nuevo) | Creación directa | `BaseCompanyModel` |
| 7 | `motor_cumplimiento` (nuevo) | Creación directa | `BaseCompanyModel` |
| 9 | `motor_riesgos` (nuevo) | Creación directa | `BaseCompanyModel` + `HierarchicalModel` |
| 11+ | Resto de módulos | Siempre con herencia | Según tipo de entidad |

**Regla de Oro para cada semana:**
```markdown
ANTES de crear cualquier modelo nuevo:
□ ¿Pertenece a una empresa? → Heredar de BaseCompanyModel
□ ¿Es jerárquico? → Agregar HierarchicalModel
□ ¿Necesita orden manual? → Agregar OrderedModel
□ ViewSet usa StandardViewSetMixin
□ Frontend usa useGenericCRUD
```

**Checklist para nuevos desarrollos:**

```markdown
## Backend - Nuevo Modelo
- [ ] Hereda de BaseCompanyModel o TimestampedModel
- [ ] ViewSet usa StandardViewSetMixin
- [ ] Tests heredan de BaseModelTestCase

## Frontend - Nuevo Componente
- [ ] Usa useGenericCRUD para operaciones CRUD
- [ ] Usa useFormModal para modales
- [ ] Reutiliza componentes de common/
```

---

## RESUMEN DE DESPLIEGUES INCREMENTALES

### Fase 1-2: Nivel 1 - Estratégico
| Semana | Deploy | Contenido |
|--------|--------|-----------|
| 2 | Staging | Configuración base + Branding |
| 3 | Staging | Organización + RBAC |
| 4 | Staging | Identidad + Planeación |
| 5 | Staging | Gestión Proyectos (PMI) |
| 6 | **Producción** | **Nivel 1 completo** |

### Fase 3: Nivel 2 - Cumplimiento
| Semana | Deploy | Contenido |
|--------|--------|-----------|
| 7 | Staging | Matriz Legal + Requisitos |
| 8 | Staging | Partes Interesadas + Reglamentos |
| 9 | Staging | Contexto + Riesgos + IPEVR |
| 10 | **Producción** | **Nivel 2 completo** |

### Fase 4: Nivel 3 - Torre de Control
| Semana | Deploy | Contenido | Estado |
|--------|--------|-----------|--------|
| 11 | Staging | Sistema Documental + Planificación HSEQ | ✅ COMPLETADA |
| 12 | Staging | Calidad + Medicina Laboral | ✅ COMPLETADA |
| 13 | Staging | Seguridad + Accidentalidad | ✅ COMPLETADA (27/12/2025) |
| 14 | **Producción** | **Nivel 3 HSEQ completo** | ✅ COMPLETADA (27/12/2025) |

### Fase 5: Nivel 4 - Cadena de Valor
| Semana | Deploy | Contenido | Estado |
|--------|--------|-----------|--------|
| 15 | Staging | Supply Chain - Proveedores + Catálogos | ✅ COMPLETADA (27/12/2025) |
| 16 | Staging | Supply Chain - Programación + Compras + Almacenamiento | ✅ COMPLETADA (27/12/2025) |
| 17 | Staging | Production Ops + Logistics & Fleet | ✅ COMPLETADA (28/12/2025) |
| 18 | **Producción** | **Sales CRM + Deploy Nivel 4 completo** | ✅ COMPLETADA (28/12/2025) |

### Fase 6: Nivel 5 - Habilitadores
| Semana | Deploy | Contenido | Estado |
|--------|--------|-----------|--------|
| 19 | Staging | Talent Hub - Estructura de Cargos, Selección y Contratación, Colaboradores | ✅ COMPLETADA (28/12/2025) |
| 20 | Staging | Talent Hub - Onboarding, Formación (LMS + Gamificación), Desempeño (Evaluaciones 360°, Planes Mejora, Reconocimientos) | ✅ COMPLETADA (28/12/2025) |
| 21 | Staging | Talent Hub - Control de Tiempo, Novedades, Proceso Disciplinario, Nómina, Off-Boarding | ✅ COMPLETADA (29/12/2025) |
| 22 | **Producción** | **Admin Finance (4 apps) + Accounting (4 apps) - Nivel 5 completo** | ✅ COMPLETADA (29/12/2025) |

### Fase 7: Nivel 6 - Inteligencia
| Semana | Deploy | Contenido | Estado |
|--------|--------|-----------|--------|
| 23 | Staging | Analytics - Indicadores + Dashboards (10 modelos, 105 tests) | ✅ COMPLETADA (29/12/2025) |
| 24 | Staging | Analytics - Análisis + Informes (13 modelos) | ✅ COMPLETADA (29/12/2025) |
| 25 | Staging | Audit System (16 modelos, 195 tests) | ✅ COMPLETADA (30/12/2025) |
| 26 | **PRODUCCIÓN** | **Optimización + GO-LIVE SISTEMA COMPLETO** | 🔜 PRÓXIMO |

---

## MÉTRICAS DE PROGRESO

### Por Fase

| Fase | Semanas | Módulos | Apps | Tablas Est. | Tests |
|------|---------|---------|------|-------------|-------|
| Fase 1-2: Estratégico | 1-6 | 1 | 15 | 30 | 150 |
| Fase 3: Cumplimiento | 7-10 | 3 | 12 | 25 | 120 |
| Fase 4: Torre de Control | 11-14 | 1 | 11 | 35 | 140 |
| Fase 5: Cadena de Valor | 15-18 | 4 | 20 | 40 | 140 |
| Fase 6: Habilitadores | 19-22 | 3 | 15 | 30 | 140 |
| Fase 7: Inteligencia | 23-26 | 2 | 8 | 20 | 110 |
| **TOTAL** | **26** | **14** | **81** | **180** | **800** |

### Velocity Estimado

| Semana | Desarrollo (hrs) | Testing (hrs) | Documentación (hrs) | Total |
|--------|------------------|---------------|---------------------|-------|
| Promedio | 120 | 30 | 10 | 160 hrs/semana |

### Equipo Requerido

| Rol | Cantidad | Asignación |
|-----|----------|------------|
| Backend Developer (Django) | 2 | Tiempo completo |
| Frontend Developer (React) | 2 | Tiempo completo |
| QA Engineer | 1 | Tiempo completo |
| DevOps Engineer | 1 | 50% tiempo |
| Product Owner | 1 | 30% tiempo |
| **Total FTE** | **6.8** | |

---

## DEPENDENCIAS CRÍTICAS

### Dependencias Técnicas

1. **Base de datos MySQL 8.0** configurada y optimizada
2. **Redis** para Celery y caché
3. **Celery Workers** para tareas asíncronas
4. **AWS S3** o almacenamiento para archivos
5. **SMTP** para envío de emails
6. **SSL/TLS** para producción

### Dependencias Externas

1. **API DIAN** para facturación electrónica (Semana 18)
2. **Servicios de scraping** para matriz legal (Semana 7)
3. **Firma digital** (proveedor a definir) (Semana 11)
4. **GPS/Telemetría** (opcional, para flota) (Semana 17)

### Dependencias de Datos

1. **Catálogo de 78 peligros GTC-45** (Semana 9)
2. **Tipos de materia prima** (18 códigos) (Semana 15)
3. **Plantillas de documentos** normativos (Semana 11)
4. **Plantillas de informes** legales (Semana 24)

---

## RIESGOS Y MITIGACIÓN

### Riesgos Técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Performance de queries con 180 tablas | Alta | Alto | Índices, caché Redis, optimización continua |
| Complejidad de integraciones DIAN | Media | Alto | Spike técnico semana 17, contingencia manual |
| Escalabilidad del workflow engine | Media | Medio | Usar solución probada (django-viewflow) |
| Migración de datos legacy | Alta | Alto | Testing exhaustivo, rollback plan |

### Riesgos de Negocio

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Cambios en requisitos legales (Res.0312) | Media | Medio | Módulos configurables, fácil de adaptar |
| Retraso en capacitación de usuarios | Media | Alto | Videos tutoriales desde semana 11 |
| Resistencia al cambio | Alta | Alto | Despliegue incremental, early adopters |

### Riesgos de Proyecto

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Enfermedad o salida de miembro clave | Media | Alto | Documentación continua, pair programming |
| Subestimación de esfuerzo | Alta | Alto | Buffer de 20% en cada fase, revisión semanal |
| Scope creep | Media | Alto | Change control process, product owner activo |

---

## CRITERIOS DE ACEPTACIÓN

### Por Semana

Cada semana debe cumplir:

- [ ] Todos los modelos Django creados y migrados
- [ ] APIs REST completas y documentadas (Swagger)
- [ ] Frontend funcional con componentes del Design System
- [ ] Tests unitarios pasando (cobertura >80%)
- [ ] Tests de integración pasando
- [ ] Documentación técnica actualizada
- [ ] Deploy a staging exitoso
- [ ] Demo funcional al Product Owner

### Por Fase

Cada fase debe cumplir:

- [ ] Todos los módulos del nivel funcionales
- [ ] Tests E2E pasando para flujos completos
- [ ] Auditoría de seguridad
- [ ] Auditoría de performance
- [ ] Documentación de usuario
- [ ] Deploy a producción exitoso
- [ ] Capacitación a usuarios finales
- [ ] Soporte post-deploy (1 semana)

### Sistema Completo (Semana 26)

- [ ] 800+ tests pasando
- [ ] Cobertura de código >85%
- [ ] Performance: tiempo de carga <2s
- [ ] Performance: API response <200ms (p95)
- [ ] Seguridad: OWASP Top 10 compliant
- [ ] Accesibilidad: WCAG 2.1 AA
- [ ] Documentación completa (Swagger, PDFs, videos)
- [ ] Backups automáticos funcionando
- [ ] Monitoreo en tiempo real activo
- [ ] Uptime >99.9% en staging (últimas 4 semanas)
- [ ] 100 usuarios concurrentes sin degradación

---

## PLAN DE CAPACITACIÓN

### Semana 12: Capacitación HSEQ
- Usuarios: Coordinador HSEQ, Brigadistas
- Duración: 4 horas
- Contenido: Sistema Documental, Medicina Laboral, Seguridad Industrial

### Semana 16: Capacitación Supply Chain
- Usuarios: Coordinador Logística, Compradores
- Duración: 4 horas
- Contenido: Proveedores, Compras, Inventarios

### Semana 18: Capacitación Comercial
- Usuarios: Equipo Comercial, Facturación
- Duración: 4 horas
- Contenido: CRM, Pipeline, Facturación Electrónica

### Semana 21: Capacitación RRHH
- Usuarios: Jefe Talento Humano, Analistas
- Duración: 6 horas
- Contenido: Selección, Onboarding, Capacitaciones, Nómina

### Semana 24: Capacitación Gerencial
- Usuarios: Gerencia, Directores
- Duración: 3 horas
- Contenido: Dashboards, KPIs, Informes

### Semana 26: Capacitación General
- Usuarios: Todos
- Duración: 2 horas
- Contenido: Navegación, funciones comunes, soporte

---

## PLAN DE SOPORTE POST-LANZAMIENTO

### Semana 27-30: Soporte Intensivo
- Equipo de desarrollo disponible 100%
- Hotfixes en <2 horas
- Monitoreo 24/7
- Reuniones diarias con usuarios

### Mes 2-3: Soporte Activo
- Equipo de desarrollo 50%
- Hotfixes en <4 horas
- Monitoreo horario laboral
- Reuniones semanales

### Mes 4+: Soporte Estándar
- Equipo de desarrollo 20%
- SLA: P1 <8h, P2 <24h, P3 <72h
- Releases mensuales
- Reuniones quincenales

---

## HITOS CLAVE

| Hito | Fecha | Descripción |
|------|-------|-------------|
| **Kickoff** | 22 Dic 2025 | Inicio del proyecto |
| **Nivel 1 en Producción** | 1 Feb 2026 | Dirección Estratégica completa |
| **Nivel 2 en Producción** | 1 Mar 2026 | Cumplimiento + Riesgos + Workflows |
| **Nivel 3 en Producción** | 29 Mar 2026 | HSEQ Management completo |
| **Nivel 4 en Producción** | 26 Abr 2026 | Cadena de Valor completa |
| **Nivel 5 en Producción** | 24 May 2026 | Habilitadores completos |
| **Go-Live Completo** | 21 Jun 2026 | Sistema completo en producción |
| **Cierre del Proyecto** | 28 Jun 2026 | Documentación final, lecciones aprendidas |

---

## MÉTRICAS DE ÉXITO

### KPIs del Proyecto

| KPI | Meta | Medición |
|-----|------|----------|
| **On-time Delivery** | 90% de hitos a tiempo | Semanal |
| **Cobertura de Tests** | >85% | Continua |
| **Bugs en Producción** | <5 críticos/mes | Mensual |
| **Uptime** | >99.9% | Continua |
| **Satisfacción Usuarios** | >4/5 | Post-capacitación |
| **Tiempo de Respuesta API** | <200ms (p95) | Continua |
| **Performance Frontend** | <2s First Contentful Paint | Semanal |

### Métricas de Negocio

| Métrica | Meta | Timeframe |
|---------|------|-----------|
| **Adopción de Usuarios** | >80% usuarios activos | Mes 2 |
| **Reducción Tiempo Procesos** | -30% vs manual | Mes 3 |
| **Cumplimiento Normativo** | 100% Res.0312 | Mes 1 |
| **Satisfacción Stakeholders** | >4.5/5 | Mes 3 |

---

## PRÓXIMOS PASOS INMEDIATOS

### Semana 1 - Día 1-3 (22-24 Diciembre)
1. Reunión de kickoff con todo el equipo
2. Setup de entornos de desarrollo para todos
3. Revisión de arquitectura existente
4. Inicio de auditoría de base de datos

### Semana 1 - Día 4-5 (25-26 Diciembre)
1. Completar diagrama ER de base de datos
2. Setup de CI/CD pipeline
3. Configurar Storybook
4. Primer sprint planning para Semana 2

---

---

## DETALLE SEMANA 22: ADMIN FINANCE + ACCOUNTING (29 Dic 2025)

### Admin Finance (4 apps, ~25 modelos)

| App | Modelos | Descripción |
|-----|---------|-------------|
| **tesoreria** | 6 | CuentaBancaria, MovimientoBancario, FlujoCaja, ConciliacionBancaria, ProgramacionPago, CajaChica |
| **presupuesto** | 5 | PresupuestoAnual, RubroPresupuestal, EjecucionPresupuestal, CdpCrp, TrasladoPresupuestal |
| **activos_fijos** | 6 | ActivoFijo, CategoriaActivo, UbicacionActivo, DepreciacionMensual, MovimientoActivo, MantenimientoActivo |
| **servicios_generales** | 3 | ContratoServicio, GastoOperativo, ConsumoServicioPublico |

**Características:**
- Gestión completa de tesorería con conciliación bancaria
- Control presupuestal con CDP/CRP (certificados)
- Activos fijos con depreciación automática
- Servicios generales y gastos operativos

### Accounting (4 apps, ~15 modelos) - Módulo Activable

| App | Modelos | Descripción |
|-----|---------|-------------|
| **config_contable** | 6 | PlanCuentas (PUC Colombia), CuentaContable, TipoDocumentoContable, Tercero, CentroCostoContable, ConfiguracionModulo |
| **movimientos** | 3 | ComprobanteContable, DetalleComprobante, AsientoPlantilla |
| **informes** | 2 | InformeContable, GeneracionInforme |
| **integracion** | 3 | ParametrosIntegracion, LogIntegracion, ColaContabilizacion |

**Características:**
- Plan Único de Cuentas (PUC) Colombia
- Comprobantes con partida doble automática
- Informes financieros (Balance, Estado Resultados, Libros Mayor)
- Integración automática con otros módulos del ERP
- Cierre de períodos contables

### Frontend (8 páginas nuevas)

| Módulo | Páginas | Características |
|--------|---------|-----------------|
| admin-finance | AdminFinancePage, TesoreriaPage, PresupuestoPage, ActivosFijosPage, ServiciosGeneralesPage | Tabs, CRUD completo, acciones personalizadas |
| accounting | AccountingPage, ConfigContablePage, MovimientosContablesPage, InformesContablesPage, IntegracionContablePage | Árbol PUC, formularios complejos, reportes |

### APIs (~45 endpoints)

- Admin Finance: 18 endpoints (CRUD + acciones especiales)
- Accounting: 27 endpoints (CRUD + cierre período, contabilización, reportes)

---

**Documento creado:** 22 Diciembre 2025
**Última actualización:** 30 Diciembre 2025 (Semana 25 - Nivel 6 COMPLETADO)
**Autor:** Documentation Expert
**Versión:** 1.1
**Estado:** Aprobado para ejecución
