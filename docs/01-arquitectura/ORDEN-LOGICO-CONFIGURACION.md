# Orden Logico de Configuracion - StrateKaz ERP

> **Version:** 4.2.0 | **Fecha:** 2026-02-07

Este documento define el **orden en que una empresa configura el sistema**, alineado con las dependencias tecnicas del software y la logica empresarial real colombiana.

---

## Resumen Visual

```
NIVEL 0  Automatico (seed al crear tenant)
  │
NIVEL 1  Fundacion Empresarial ──────────────── Admin configura la empresa
  │
NIVEL 2  Estructura Organizacional ──────────── Areas, Cargos, Sedes
  │
NIVEL 3  Direccion Estrategica ──────────────── Identidad, DOFA, Objetivos
  │
NIVEL 4  Talento Humano ────────────────────── Usuarios, Colaboradores, Nomina
  │
NIVEL 5  Riesgos y Cumplimiento ────────────── Matriz legal, IPEVR, Workflows
  │
NIVEL 6  Gestion Integral HSEQ ────────────── Medicina, Seguridad, Calidad
  │
NIVEL 7  Operaciones y Soporte ────────────── Supply Chain, Ventas, Contabilidad
```

---

## NIVEL 0: Automatico (No requiere accion del usuario)

**Cuando el SuperAdmin crea un tenant**, el sistema ejecuta automaticamente via Celery:

| Paso | Que se crea | Archivo fuente |
|------|-------------|----------------|
| 1. Schema PostgreSQL | Base de datos aislada del tenant | `backend/apps/tenant/tasks.py:148` |
| 2. Migraciones | ~612 tablas por tenant | `backend/apps/tenant/tasks.py:166` |
| 3. Estructura de modulos | 14 modulos, 83 tabs, ~250 secciones | `backend/apps/core/management/commands/seed_estructura_final.py` |
| 4. Permisos RBAC | Sistema completo de permisos | `seed_permisos_rbac` |
| 5. Cargos de sistema | **ADMIN** (CRUD total) + **USUARIO** (solo lectura) | `backend/apps/core/management/commands/seed_admin_cargo.py` |
| 6. Catalogos base | Peligros GTC-45, tipos de examen, riesgos ocupacionales | Seeds por modulo |

**Tiempo estimado:** ~25 minutos (creacion asincrona con progreso visible)

**Al primer login** del admin en el tenant, `HybridJWTAuthentication` auto-crea un User local con cargo ADMIN asignado.

---

## NIVEL 1: Fundacion Empresarial

> **Quien:** Admin Tenant | **Donde:** Direccion Estrategica > Configuracion

**Por que primero:** `EmpresaConfig` es requerido por los 211 modelos que heredan de `BaseCompanyModel`. Sin empresa configurada, no se puede crear ningun registro de negocio.

### Que se configura

| Seccion | Contenido | Ruta UI |
|---------|-----------|---------|
| **Empresa** | NIT, razon social, nombre comercial, sector economico, regimen tributario | Configuracion > Empresa |
| **Branding** | Logos (claro/oscuro/favicon), colores (primario, secundario, accent, sidebar), PWA | Configuracion > Empresa (pestaña Branding) |
| **Modulos** | Activar/desactivar modulos segun necesidades de la empresa | Configuracion > Modulos |

### Dependencias tecnicas

```
EmpresaConfig (configuracion.EmpresaConfig)
├── Referenciado por: BaseCompanyModel.empresa FK (211 modelos)
├── Archivo: backend/apps/gestion_estrategica/configuracion/models.py:169
└── Campos clave: nit (unique), razon_social, sector_economico
```

### Branding dinamico

Al guardar cambios de branding en el Tenant, el frontend actualiza en tiempo real:
- CSS variables de colores (primary, secondary, accent) → `useDynamicTheme`
- Favicon del navegador → `<link id="dynamic-favicon">`
- Iconos PWA (192x192, 512x512)
- Titulo de la pagina
- Logo en sidebar y header

Cuando un usuario global cambia entre empresas via `TenantSwitcher`, se ejecuta `invalidateAllQueries()` que refresca todo el branding automaticamente.

---

## NIVEL 2: Estructura Organizacional

> **Quien:** Admin Tenant | **Donde:** Direccion Estrategica > Organizacion

**Por que segundo:** Los cargos necesitan areas. Los usuarios necesitan cargos. Todo lo demas necesita cargos y areas.

### Orden dentro del nivel

```
1. Areas (organigrama)           ← No tiene dependencias propias
2. Cargos (puestos de trabajo)   ← Requiere Area FK
3. Sedes (ubicaciones)           ← Solo requiere EmpresaConfig
```

### Areas

```
Area (organizacion.Area)
├── parent: self FK (jerarquia: Gerencia → Departamento → Area)
├── Archivo: backend/apps/gestion_estrategica/organizacion/models.py:28
├── Usado por: Cargo.area, Colaborador.area, AnalisisDOFA, 13+ modelos
└── Ejemplo: Gerencia General → Operaciones → Produccion
```

### Cargos (5 tabs de configuracion)

| Tab | Contenido | Por que importa |
|-----|-----------|-----------------|
| 1. Identificacion | Codigo, nombre, area, nivel jerarquico, cantidad posiciones | Define el puesto en el organigrama |
| 2. Manual de Funciones | Objetivo, funciones, responsabilidades, autoridad | Cumple Art. 23 CST (contrato laboral) |
| 3. Requisitos | Educacion, experiencia, competencias tecnicas y blandas | Base para seleccion y contratacion |
| 4. SST | Riesgos expuestos, EPP, examenes medicos, capacitaciones | Cumple Decreto 1072/2015 y Res. 0312/2019 |
| 5. Permisos RBAC | Acceso a secciones con granularidad CRUD por seccion | Define que ve y hace cada cargo en el sistema |

```
Cargo (core.Cargo)
├── area: FK Area (PROTECT) ← REQUIERE AREA
├── parent_cargo: self FK (subordinacion)
├── expuesto_riesgos: M2M RiesgoOcupacional
├── Archivo: backend/apps/core/models/models_user.py:14
├── Usado por: User.cargo, Colaborador.cargo, DOFA.responsable, 14+ modelos
└── Seeds automaticos: ADMIN (nivel ESTRATEGICO) + USUARIO (nivel OPERATIVO)
```

**Logica empresarial:** En Colombia, el cargo define las funciones, los riesgos y los requisitos ANTES de contratar a alguien. El manual de funciones es requisito legal (Art. 23 CST).

---

## NIVEL 3: Direccion Estrategica

> **Quien:** Admin/Gerencia | **Donde:** Direccion Estrategica (varios tabs)

**Por que tercero:** La planeacion estrategica requiere la estructura organizacional ya definida (cargos como responsables, areas como unidades de gestion).

### Componentes

| Modulo | Tab | Requiere | Contenido |
|--------|-----|----------|-----------|
| Identidad | Identidad Corporativa | EmpresaConfig | Mision, vision, valores, politicas por norma ISO |
| Contexto | Contexto Organizacional | **Cargo** (responsable FK) | DOFA, PESTEL, Porter, Partes Interesadas, TOWS |
| Planeacion | Planeacion Estrategica | **Cargo/Area** (responsables) | Objetivos estrategicos, KPIs, metas, planes de accion |
| Planificacion | Planificacion del Sistema | EmpresaConfig | Alcance SG, exclusiones, recursos, cronogramas |
| Revision | Revision por la Direccion | EmpresaConfig | Actas de revision gerencial (ISO 9001 clausula 9.3) |

```
AnalisisDOFA (contexto.AnalisisDOFA)
├── responsable: FK Cargo (SET_NULL) ← REQUIERE CARGO
├── tipo_analisis: FK TipoAnalisisDOFA
├── Archivo: backend/apps/gestion_estrategica/contexto/models.py:83
└── Genera: FactorDOFA, EstrategiaTOWS
```

**Logica empresarial:** ISO 9001, 14001 y 45001 exigen definir contexto organizacional, partes interesadas y planeacion ANTES de implementar los sistemas de gestion.

---

## NIVEL 4: Talento Humano (Centro de Talento)

> **Quien:** Admin/RRHH | **Donde:** Centro de Talento (11 sub-apps)

**Por que cuarto:** Los colaboradores necesitan cargos y areas ya creados. El signal `auto_create_colaborador` requiere que el User tenga cargo con area.

### Flujo de vinculacion

```
Admin crea Cargo (NIVEL 2)
    ↓
Admin crea Usuario y le asigna Cargo
    ↓
Signal auto_create_colaborador (colaboradores/signals.py:17)
    ↓
Se crea Colaborador automaticamente con:
├── usuario = User (1-to-1)
├── cargo = User.cargo
├── area = User.cargo.area
├── fecha_ingreso = hoy
└── estado = 'activo'
    ↓
Empleado accede a Mi Portal (ESS)
Jefe accede a Mi Equipo (MSS)
```

### Sub-apps del Centro de Talento

| Sub-app | Requiere | Contenido |
|---------|----------|-----------|
| **Seleccion y Contratacion** | Cargo + Area | Vacantes, candidatos, contratos, historial |
| **Colaboradores** | Cargo + Area + User | Datos personales, hoja de vida, historial laboral |
| **Onboarding/Induccion** | Colaborador | Plan de induccion, checklist, documentos |
| **Formacion y Reinduccion** | Colaborador | Planes de capacitacion, ejecuciones |
| **Control de Tiempo** | Colaborador | Turnos (Ley 2101: jornada progresiva 47h→42h), marcaciones |
| **Novedades** | Colaborador | Incapacidades, licencias, permisos, vacaciones, **dotacion (Art. 230 CST)** |
| **Nomina** | Colaborador | Conceptos, liquidacion, recibos |
| **Desempeno** | Colaborador | Evaluaciones, competencias, planes de mejora |
| **Proceso Disciplinario** | Colaborador | Llamados, descargos, memorandos, **denuncias acoso (Ley 1010)** |
| **Off-Boarding** | Colaborador | Proceso retiro, liquidacion final, **certificados trabajo (Art. 57+62 CST)** |
| **Estructura de Cargos** | Cargo | Analisis de cargos, valuacion |

### Portales de autoservicio

| Portal | Ruta | Quien lo usa | Funcionalidades |
|--------|------|-------------|-----------------|
| **Mi Portal (ESS)** | `/mi-portal` | Todo empleado | Perfil, vacaciones, permisos, recibos, capacitaciones, evaluaciones |
| **Mi Equipo (MSS)** | `/mi-equipo` | Jefes de area | Equipo, aprobaciones pendientes, evaluaciones de equipo |

**Logica empresarial:** En Colombia, primero se define el cargo con su manual de funciones (requisito legal), luego se abre la vacante, se selecciona al candidato, se vincula y entonces puede empezar a usar el sistema. El cargo determina EPP, examenes medicos, riesgos y permisos en el software.

---

## NIVEL 5: Riesgos y Cumplimiento

> **Quien:** Responsable SG-SST / Compliance | **Donde:** Motor de Cumplimiento, Motor de Riesgos

**Por que quinto:** Los riesgos se identifican por cargo/area (IPEVR). La matriz legal aplica al sector de la empresa. Los workflows necesitan usuarios asignados.

### Motor de Cumplimiento

| Sub-app | Requiere | Contenido |
|---------|----------|-----------|
| Matriz Legal | EmpresaConfig | Requisitos legales por norma y articulo |
| Requisitos Legales | EmpresaConfig | Obligaciones especificas, fechas limite |
| Reglamentos Internos | EmpresaConfig | RIT, politicas internas |
| Partes Interesadas | EmpresaConfig | Stakeholders y sus requisitos |

### Motor de Riesgos

| Sub-app | Requiere | Contenido |
|---------|----------|-----------|
| **IPEVR** | EmpresaConfig (cargo/area como CharField) | Matriz de peligros GTC-45, valoracion, controles |
| Aspectos Ambientales | EmpresaConfig | Identificacion y valoracion ambiental |
| Riesgos Viales (PESV) | EmpresaConfig | Riesgos de transito para flota |
| Seguridad de Informacion | EmpresaConfig | Riesgos ISO 27001 |
| SAGRILAFT/PTEE | EmpresaConfig | Riesgos de lavado de activos |
| Riesgos de Procesos | EmpresaConfig | Riesgos operativos por proceso |

**Nota tecnica:** IPEVR usa `CharField` para cargo y area (no FK directo), lo que permite configurar riesgos sin dependencia dura. Sin embargo, es mejor tener los cargos ya creados para consistencia.

```
MatrizIPEVR (ipevr.MatrizIPEVR)
├── area: CharField (no FK)
├── cargo: CharField (no FK)
├── proceso: CharField (no FK)
├── peligro: FK PeligroGTC45 (catalogo auto-seeded)
├── Archivo: backend/apps/motor_riesgos/ipevr/models.py:131
└── Independiente de Colaborador
```

### Flujos de Trabajo

| Sub-app | Requiere | Contenido |
|---------|----------|-----------|
| Disenador de Flujos | EmpresaConfig | Diagramas BPMN, nodos, transiciones |
| Ejecucion | Area/Cargo (asignatarios) | Instancias en ejecucion |
| Firma Digital | Cargo (firmantes) | Solicitudes y aprobaciones |
| Monitoreo | EmpresaConfig | Metricas, SLAs, alertas |

**Logica empresarial:** Decreto 1072/2015 exige identificar peligros y valorar riesgos (IPEVR) como parte del SG-SST. La matriz legal es base para el cumplimiento. Los workflows automatizan aprobaciones que antes eran manuales.

---

## NIVEL 6: Gestion Integral HSEQ

> **Quien:** Responsable HSEQ / Coordinador SST | **Donde:** Gestion Integral

**Por que sexto:** HSEQ opera sobre colaboradores ya vinculados. Los examenes medicos se asignan a personas reales. Los accidentes se investigan con datos del trabajador.

### Sub-apps

| Sub-app | Requiere | Contenido |
|---------|----------|-----------|
| **Medicina Laboral** | **Colaborador FK** | Examenes medicos, restricciones, vigilancia epidemiologica, profesiogramas |
| **Seguridad Industrial** | Colaborador/Area | Inspecciones, EPP, permisos trabajo, elementos |
| **Higiene Industrial** | Area | Mediciones ambientales (ruido, iluminacion, quimicos) |
| **Accidentalidad** | **Colaborador FK** | Investigacion AT/EL, FURAT, indicadores (IF, IS, IA) |
| **Emergencias** | Area | Planes emergencia, brigadas, simulacros |
| **Gestion Ambiental** | EmpresaConfig | Aspectos ambientales, residuos, programas |
| **Calidad** | EmpresaConfig | No conformidades, auditorias internas, control producto |
| **Mejora Continua** | EmpresaConfig | Acciones correctivas, preventivas, de mejora |
| Gestion de Comites | Colaborador | COPASST, Comite Convivencia, brigadas |

```
ExamenMedico (medicina_laboral.ExamenMedico)
├── colaborador: FK Colaborador ← REQUIERE COLABORADOR
├── tipo_examen: FK TipoExamen
├── Archivo: backend/apps/hseq_management/medicina_laboral/models.py:185
└── Tipos: ingreso, periodico, retiro, post-incapacidad
```

**Logica empresarial:** No se puede practicar un examen medico ocupacional a alguien que no esta vinculado. No se investiga un accidente sin saber quien es el trabajador, su cargo y su area.

---

## NIVEL 7: Operaciones y Soporte (Independientes)

> **Quien:** Responsables de area | **Donde:** Modulos operativos

**Por que al final:** Estos modulos son independientes entre si. Solo necesitan `EmpresaConfig`. Se activan segun el giro de la empresa.

| Modulo | Sub-apps | Ejemplo de empresa |
|--------|----------|-------------------|
| **Cadena de Suministro** | Proveedores, Compras, Almacen, Catalogos, Programacion | Manufactura, distribucion |
| **Base de Operaciones** | Recepcion, Procesamiento, Producto Terminado, Mantenimiento | Produccion industrial |
| **Logistica y Flota** | Gestion Flota, Transporte | Empresas con vehiculos |
| **Ventas y CRM** | Clientes, Pipeline, Pedidos, Servicio al Cliente | Empresas comerciales |
| **Admin y Finanzas** | Tesoreria, Presupuesto, Activos Fijos, Servicios Generales | Todas las empresas |
| **Contabilidad** | Config Contable, Movimientos, Informes, Integracion | Todas las empresas |
| **Inteligencia de Negocios** | Dashboards, Indicadores, Informes, Tendencias, Exportacion | Todas las empresas |

**Nota:** Inteligencia de Negocios consume datos de TODOS los niveles anteriores. Es el ultimo en configurar pero el primero en consultar una vez hay datos.

---

## Dependencias Bloqueantes

| Para usar... | Necesitas primero... | Razon tecnica |
|---|---|---|
| Cualquier modulo de negocio | EmpresaConfig | `BaseCompanyModel.empresa` FK en 211 modelos |
| Cargo personalizado | Area | `Cargo.area` FK con `on_delete=PROTECT` |
| Colaborador | Cargo + Area + User | FKs directos con PROTECT |
| DOFA / PESTEL | Cargo | `AnalisisDOFA.responsable` FK a Cargo |
| Objetivos estrategicos | Cargo / Area | `areas_responsables` M2M |
| Examenes medicos | Colaborador | `ExamenMedico.colaborador` FK |
| Novedades (licencias, vacaciones) | Colaborador | `Licencia.colaborador` FK |
| Proceso disciplinario | Colaborador | `LlamadoAtencion.colaborador` FK |
| IPEVR | Solo EmpresaConfig | Cargo/Area son CharField (sin FK duro) |
| Matriz Legal | Solo EmpresaConfig | Sin dependencia a estructura org |

---

## Checklist de Onboarding por Rol

### SuperAdmin (StrateKaz)
- [ ] Crear Tenant (nombre, dominio, plan)
- [ ] Esperar creacion asincrona del schema (~25 min)
- [ ] Verificar estado "ready" en Admin Global
- [ ] Asignar usuario admin inicial al tenant

### Admin Tenant (Primera vez)
- [ ] **NIVEL 1:** Configurar datos de empresa (NIT, razon social, sector)
- [ ] **NIVEL 1:** Personalizar branding (logos, colores, PWA)
- [ ] **NIVEL 1:** Activar modulos necesarios
- [ ] **NIVEL 2:** Crear estructura de areas (organigrama)
- [ ] **NIVEL 2:** Crear cargos con manual de funciones (5 tabs)
- [ ] **NIVEL 2:** Configurar permisos RBAC por cargo
- [ ] **NIVEL 3:** Definir identidad corporativa (mision, vision, valores)
- [ ] **NIVEL 3:** Realizar analisis DOFA/PESTEL
- [ ] **NIVEL 4:** Crear usuarios y asignarles cargos
- [ ] **NIVEL 4:** Verificar que se crearon Colaboradores automaticamente
- [ ] **NIVEL 5:** Configurar matriz legal y requisitos normativos
- [ ] **NIVEL 5:** Identificar peligros y valorar riesgos (IPEVR)

### Jefe de Area
- [ ] Revisar Mi Equipo para ver colaboradores asignados
- [ ] Aprobar solicitudes pendientes (vacaciones, permisos)
- [ ] Realizar evaluaciones de desempeno

### Empleado
- [ ] Acceder a Mi Portal
- [ ] Completar informacion personal
- [ ] Solicitar vacaciones / permisos segun necesidad

---

## Referencia Tecnica - Archivos Clave

| Componente | Archivo |
|------------|---------|
| Tenant creation task | `backend/apps/tenant/tasks.py:103` |
| Seed estructura modulos | `backend/apps/core/management/commands/seed_estructura_final.py` |
| Seed cargos ADMIN/USUARIO | `backend/apps/core/management/commands/seed_admin_cargo.py` |
| BaseCompanyModel (empresa FK) | `backend/apps/core/base_models/base.py:142` |
| EmpresaConfig | `backend/apps/gestion_estrategica/configuracion/models.py:169` |
| Area | `backend/apps/gestion_estrategica/organizacion/models.py:28` |
| Cargo (5 tabs) | `backend/apps/core/models/models_user.py:14` |
| CargoSectionAccess (RBAC) | `backend/apps/core/models/models_system_modules.py` |
| Colaborador | `backend/apps/talent_hub/colaboradores/models.py:115` |
| Signal auto_create_colaborador | `backend/apps/talent_hub/colaboradores/signals.py:17` |
| HybridJWTAuthentication | `backend/apps/tenant/authentication.py` |
| Mi Portal (ESS) | `frontend/src/features/mi-portal/` |
| Mi Equipo (MSS) | `frontend/src/features/mi-equipo/` |
| Branding + theme | `frontend/src/hooks/useBrandingConfig.ts` + `useDynamicTheme.ts` |
| Tenant Switcher | `frontend/src/components/common/TenantSwitcher.tsx` |
