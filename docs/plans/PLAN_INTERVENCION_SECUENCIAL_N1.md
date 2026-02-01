# PLAN DE INTERVENCIÓN SECUENCIAL - NIVEL 1

**Fecha:** 18 de Enero 2026
**Versión:** 1.0
**Enfoque:** Aplicación por Aplicación (100% antes de avanzar)

---

## FILOSOFÍA DEL PLAN

Este plan sigue un enfoque **SECUENCIAL** donde cada aplicación se completa al 100% antes de pasar a la siguiente. Esto permite:

- Probar funcionalidades inmediatamente después de implementarlas
- Detectar problemas temprano sin acumular deuda técnica
- Mantener el sistema estable en todo momento
- Evitar volver atrás para corregir

---

## ORDEN DE INTERVENCIÓN

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SECUENCIA DE INTERVENCIÓN                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   FASE 1: CONFIGURACIÓN ────────────────────────────────────► 100%         │
│       │                                                                     │
│       ▼                                                                     │
│   FASE 2: ORGANIZACIÓN ─────────────────────────────────────► 100%         │
│       │                                                                     │
│       ▼                                                                     │
│   FASE 3: IDENTIDAD CORPORATIVA ────────────────────────────► 100%         │
│       │                                                                     │
│       ▼                                                                     │
│   FASE 4: PLANEACIÓN ESTRATÉGICA ───────────────────────────► 100%         │
│       │                                                                     │
│       ▼                                                                     │
│   FASE 5: GESTIÓN DOCUMENTAL (Crear UI) ────────────────────► 100%         │
│       │                                                                     │
│       ▼                                                                     │
│   FASE 6: PLANIFICACIÓN DEL SISTEMA (Crear UI) ─────────────► 100%         │
│       │                                                                     │
│       ▼                                                                     │
│   FASE 7: GESTIÓN DE PROYECTOS (Crear UI + Fix API) ────────► 100%         │
│       │                                                                     │
│       ▼                                                                     │
│   FASE 8: REVISIÓN POR LA DIRECCIÓN (Crear UI) ─────────────► 100%         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## FASE 1: CONFIGURACIÓN

**Estado Actual:** 9.0/10 - CASI LISTO
**Objetivo:** Llevar a 10/10

### Componentes a Revisar

| Archivo | Ubicación | Función |
|---------|-----------|---------|
| ConfiguracionPage.tsx | features/gestion-estrategica/pages/ | Página principal |
| BrandingFormModal.tsx | features/gestion-estrategica/components/configuracion/ | Modal de branding |
| SedeFormModal.tsx | features/gestion-estrategica/components/configuracion/ | Modal de sedes |
| IntegracionFormModal.tsx | features/gestion-estrategica/components/configuracion/ | Modal de integraciones |

### Modales a Analizar

#### 1. BrandingFormModal
- **Campos:** Logo, colores primario/secundario, favicon
- **Validación:** Tamaño máximo imagen, formato válido
- **UX:** Preview en tiempo real
- **Mejora necesaria:** Ninguna crítica

#### 2. SedeFormModal
- **Campos:** Nombre, dirección, teléfono, email, ciudad, activa
- **Validación:** Email válido, teléfono formato
- **UX:** Mapa de ubicación (opcional)
- **Mejora necesaria:** Ninguna crítica

#### 3. IntegracionFormModal
- **Campos:** Nombre, tipo, URL, API key, headers, activa
- **Validación:** URL válida
- **UX:** Test de conexión
- **Mejora necesaria:** P2 - test_connection() es placeholder

### Tareas FASE 1

- [ ] **1.1** Revisar BrandingFormModal - validaciones y UX
- [ ] **1.2** Revisar SedeFormModal - validaciones y UX
- [ ] **1.3** Revisar IntegracionFormModal - validaciones y UX
- [ ] **1.4** OPCIONAL: Implementar test_connection() real
- [ ] **1.5** Verificar flujo completo: crear → editar → eliminar
- [ ] **1.6** Test responsive (mobile/tablet/desktop)
- [ ] **1.7** Marcar FASE 1 como COMPLETADA

### Criterios de Aceptación

- [x] Todos los modales abren y cierran correctamente
- [x] Validaciones funcionan en tiempo real
- [x] Toast de éxito/error aparece
- [x] Datos persisten en BD
- [x] Permisos RBAC funcionan
- [ ] Test de conexión funcional (opcional)

### Flujo de Datos

```
Usuario → ConfiguracionPage
              ↓
        [Tabs: General | Sedes | Integraciones]
              ↓
        Click "Agregar" → Modal con formulario
              ↓
        Submit → API POST/PUT → Backend
              ↓
        Refresh → Tabla actualizada
```

---

## FASE 2: ORGANIZACIÓN

**Estado Actual:** 8.5/10 - LISTO
**Objetivo:** Llevar a 9.5/10

### Componentes a Revisar

| Archivo | Ubicación | Función |
|---------|-----------|---------|
| OrganizacionTab.tsx | features/gestion-estrategica/pages/ | Router de secciones |
| AreasTab.tsx | features/gestion-estrategica/components/organizacion/ | CRUD de áreas |
| CargosTab.tsx | features/gestion-estrategica/components/organizacion/ | CRUD de cargos |
| OrganigramaView.tsx | features/gestion-estrategica/components/organizacion/ | Visualización |
| ColaboradoresSection.tsx | features/gestion-estrategica/components/organizacion/ | Lista de personal |

### Modales a Analizar

#### 1. AreaFormModal
- **Campos:** Nombre, código, descripción, área padre, responsable, activa
- **Validación:** Código único, padre no es hijo de sí mismo
- **UX:** Selector jerárquico de padre
- **Mejora necesaria:** Validar ciclos jerárquicos

#### 2. CargoFormModal
- **Campos:** Nombre, código, nivel, área, descripción, activo
- **Validación:** Código único
- **UX:** Selector de área con jerarquía
- **Mejora necesaria:** Ninguna crítica

#### 3. ColaboradorFormModal
- **Campos:** Usuario, cargo, área, fecha inicio, activo
- **Validación:** Usuario no duplicado en área
- **UX:** Búsqueda de usuario
- **Mejora necesaria:** Ninguna crítica

### Tareas FASE 2

- [ ] **2.1** Revisar AreaFormModal - validación de ciclos
- [ ] **2.2** Revisar CargoFormModal - validaciones
- [ ] **2.3** Revisar ColaboradorFormModal - validaciones
- [ ] **2.4** Verificar organigrama con 50+ áreas (performance)
- [ ] **2.5** Verificar drag-and-drop de reordenamiento
- [ ] **2.6** Test flujo: crear área → asignar cargo → asignar colaborador
- [ ] **2.7** Test responsive
- [ ] **2.8** Marcar FASE 2 como COMPLETADA

### Criterios de Aceptación

- [ ] Jerarquía de áreas sin ciclos
- [ ] Organigrama renderiza correctamente
- [ ] Performance aceptable con datos reales
- [ ] Cargos se asignan a áreas correctamente
- [ ] Colaboradores vinculados correctamente

### Flujo de Datos

```
Usuario → OrganizacionTab
              ↓
        [Tabs: Áreas | Cargos | Organigrama | Colaboradores]
              ↓
        Áreas → Estructura jerárquica (tree)
              ↓
        Cargos → Vinculados a áreas
              ↓
        Colaboradores → Vinculados a cargos/áreas
              ↓
        Organigrama → Visualización de todo
```

---

## FASE 3: IDENTIDAD CORPORATIVA

**Estado Actual:** 8.75/10 - LISTO
**Objetivo:** Llevar a 9.5/10

### Componentes a Revisar

| Archivo | Ubicación | Función |
|---------|-----------|---------|
| IdentidadCorporativaTab.tsx | features/gestion-estrategica/pages/ | Contenedor principal |
| MisionVisionSection.tsx | features/gestion-estrategica/components/identidad/ | Misión/Visión |
| ValoresSection.tsx | features/gestion-estrategica/components/identidad/ | Valores corporativos |
| PoliciesList.tsx | features/gestion-estrategica/components/identidad/ | Lista de políticas |
| UnifiedPolicyModal.tsx | features/gestion-estrategica/components/identidad/ | Modal unificado |

### Modales a Analizar

#### 1. MisionVisionModal
- **Campos:** Texto misión, texto visión, fecha vigencia
- **Validación:** Textos no vacíos
- **UX:** Editor rico (opcional)
- **Mejora necesaria:** Ninguna crítica

#### 2. ValorFormModal
- **Campos:** Nombre, descripción, icono, orden
- **Validación:** Nombre único
- **UX:** Selector de iconos
- **Mejora necesaria:** Ninguna crítica

#### 3. UnifiedPolicyModal (Workflow de Firmas)
- **Campos:** Título, tipo, contenido, alcance, versión, firmantes
- **Validación:** Tipo válido, firmantes seleccionados
- **UX:** Workflow de 5 estados (Borrador → En Firma → Firmada → Vigente → Obsoleta)
- **Mejora necesaria:** P1 - Agregar confirmación antes de eliminar

#### 4. FirmantesSelectionModal
- **Campos:** Lista de firmantes, orden de firma
- **Validación:** Al menos 1 firmante
- **UX:** Drag-and-drop para orden
- **Mejora necesaria:** Ninguna crítica

### Tareas FASE 3

- [ ] **3.1** Revisar MisionVisionModal - UX
- [ ] **3.2** Revisar ValorFormModal - selector de iconos
- [ ] **3.3** Agregar ConfirmDialog antes de eliminar políticas
- [ ] **3.4** Revisar workflow de firmas completo
- [ ] **3.5** Verificar estados de firma color-coded
- [ ] **3.6** OPCIONAL: Limpiar campos DEPRECATED en backend
- [ ] **3.7** Test flujo: crear política → iniciar firmas → firmar → vigente
- [ ] **3.8** Test responsive
- [ ] **3.9** Marcar FASE 3 como COMPLETADA

### Criterios de Aceptación

- [ ] Workflow de firmas funciona end-to-end
- [ ] Estados se muestran con colores correctos
- [ ] Confirmación antes de eliminar
- [ ] Timeline de historial visible
- [ ] Políticas firmadas se envían a Gestión Documental

### Flujo de Datos

```
Usuario → IdentidadCorporativaTab
              ↓
        [Secciones: Misión/Visión | Valores | Políticas]
              ↓
        Crear Política → UnifiedPolicyModal
              ↓
        Guardar (BORRADOR) → Seleccionar Firmantes
              ↓
        Iniciar Firma → workflow_engine procesa
              ↓
        Cada firmante firma → Estado actualiza
              ↓
        Todos firman → VIGENTE → Se copia a Gestión Documental
```

---

## FASE 4: PLANEACIÓN ESTRATÉGICA

**Estado Actual:** 8.0/10 - FUNCIONAL
**Objetivo:** Llevar a 9.0/10

### Componentes a Revisar

| Archivo | Ubicación | Función |
|---------|-----------|---------|
| PlaneacionTab.tsx | features/gestion-estrategica/pages/ | Contenedor principal |
| MapaEstrategicoSection.tsx | features/gestion-estrategica/components/planeacion/ | Mapa visual |
| ObjetivosBSCSection.tsx | features/gestion-estrategica/components/planeacion/ | Grid BSC |
| KPIsSection.tsx | features/gestion-estrategica/components/planeacion/ | Indicadores |

### Modales a Analizar

#### 1. PlanEstrategicoModal
- **Campos:** Nombre, descripción, fecha inicio, fecha fin, estado
- **Validación:** Fechas coherentes
- **UX:** Selector de fechas con rango
- **Mejora necesaria:** Ninguna crítica

#### 2. ObjetivoFormModal
- **Campos:** Nombre, perspectiva BSC, descripción, responsable, meta, peso
- **Validación:** Peso <= 100 por perspectiva
- **UX:** Selector de perspectiva con colores
- **Mejora necesaria:** P1 - Agregar GranularActionPermission

#### 3. KPIFormModal
- **Campos:** Nombre, objetivo relacionado, fórmula, meta, unidad, frecuencia
- **Validación:** Fórmula sintácticamente correcta
- **UX:** Preview de cálculo
- **Mejora necesaria:** Capping de progreso a 100%

### Tareas FASE 4

- [ ] **4.1** Agregar GranularActionPermission a ViewSets
- [ ] **4.2** Implementar capping de progreso (max 100%)
- [ ] **4.3** Revisar ObjetivoFormModal - validación de pesos
- [ ] **4.4** Revisar KPIFormModal - validación de fórmula
- [ ] **4.5** Verificar colores BSC (Financiera=green, Clientes=blue, Procesos=orange, Aprendizaje=purple)
- [ ] **4.6** Test flujo: crear plan → agregar objetivos → vincular KPIs → medir
- [ ] **4.7** OPCIONAL: Agregar notificaciones de cambio de estado
- [ ] **4.8** Test responsive
- [ ] **4.9** Marcar FASE 4 como COMPLETADA

### Criterios de Aceptación

- [ ] Permisos RBAC funcionando
- [ ] Progreso no excede 100%
- [ ] Grid BSC muestra 4 perspectivas
- [ ] KPIs vinculados a objetivos
- [ ] Mapa estratégico visual

### Flujo de Datos

```
Usuario → PlaneacionTab
              ↓
        [Secciones: Plan | Mapa | Objetivos BSC | KPIs]
              ↓
        Crear Plan Estratégico → PlanEstrategicoModal
              ↓
        Agregar Objetivos por perspectiva → ObjetivoFormModal
              ↓
        Vincular KPIs a objetivos → KPIFormModal
              ↓
        Registrar mediciones → Calcular progreso
              ↓
        Dashboard muestra avance global
```

---

## FASE 5: GESTIÓN DOCUMENTAL

**Estado Actual:** 5.75/10 - BACKEND LISTO, SIN UI
**Objetivo:** Llevar a 9.0/10

### Backend Existente

| Modelo | Campos Principales | Estado |
|--------|-------------------|--------|
| TipoDocumento | nombre, codigo, descripcion | OK |
| PlantillaDocumento | nombre, tipo, campos_json, activa | OK |
| Documento | titulo, tipo, contenido, version_actual, estado | OK |
| VersionDocumento | documento, numero_version, archivo, cambios | OK |
| CampoFormulario | plantilla, nombre, tipo, requerido, orden | OK |
| ControlDocumental | documento, area, fecha_distribucion | OK |

### Componentes a CREAR

| Archivo | Función |
|---------|---------|
| GestionDocumentalPage.tsx | Página principal con tabs |
| TiposDocumentoSection.tsx | CRUD de tipos |
| PlantillasSection.tsx | CRUD de plantillas con form builder |
| DocumentosSection.tsx | CRUD de documentos |
| VersionesSection.tsx | Control de versiones |
| DistribucionSection.tsx | Control de distribución |

### Modales a CREAR

#### 1. TipoDocumentoModal
- **Campos:** Nombre, código, descripción, activo
- **Validación:** Código único
- **UX:** Simple form

#### 2. PlantillaFormModal
- **Campos:** Nombre, tipo, descripción, campos dinámicos
- **Validación:** Al menos 1 campo
- **UX:** Form builder con drag-and-drop

#### 3. DocumentoFormModal
- **Campos:** Título, tipo, contenido (según plantilla), archivo, estado
- **Validación:** Campos requeridos de plantilla
- **UX:** Formulario dinámico según plantilla

#### 4. VersionModal
- **Campos:** Archivo nuevo, descripción de cambios
- **Validación:** Archivo obligatorio
- **UX:** Historial de versiones visible

#### 5. DistribucionModal
- **Campos:** Documento, áreas destino, fecha
- **Validación:** Al menos 1 área
- **UX:** Selector múltiple de áreas

### Tareas FASE 5

- [ ] **5.1** Crear GestionDocumentalPage.tsx con estructura de tabs
- [ ] **5.2** Crear TiposDocumentoSection.tsx
- [ ] **5.3** Crear TipoDocumentoModal.tsx
- [ ] **5.4** Crear PlantillasSection.tsx
- [ ] **5.5** Crear PlantillaFormModal.tsx con form builder
- [ ] **5.6** Crear DocumentosSection.tsx
- [ ] **5.7** Crear DocumentoFormModal.tsx dinámico
- [ ] **5.8** Crear VersionesSection.tsx (inline o modal)
- [ ] **5.9** Crear DistribucionSection.tsx
- [ ] **5.10** Crear DistribucionModal.tsx
- [ ] **5.11** Crear hooks: useDocumentos, usePlantillas, useTiposDocumento
- [ ] **5.12** Implementar permisos de descarga de archivos
- [ ] **5.13** Validar JSONField de plantillas (esquema)
- [ ] **5.14** Test flujo completo
- [ ] **5.15** Test responsive
- [ ] **5.16** Marcar FASE 5 como COMPLETADA

### Criterios de Aceptación

- [ ] UI completa y funcional
- [ ] Plantillas con campos dinámicos
- [ ] Control de versiones
- [ ] Distribución por áreas
- [ ] Permisos de descarga
- [ ] Integración con políticas de Identidad

### Flujo de Datos

```
Usuario → GestionDocumentalPage
              ↓
        [Tabs: Tipos | Plantillas | Documentos | Distribución]
              ↓
        Definir Tipos → TipoDocumentoModal
              ↓
        Crear Plantilla → PlantillaFormModal (form builder)
              ↓
        Crear Documento → DocumentoFormModal (usa plantilla)
              ↓
        Subir nueva versión → VersionModal
              ↓
        Distribuir → DistribucionModal → Áreas notificadas

        [Integración]
        Política VIGENTE en Identidad → Se copia aquí automáticamente
```

---

## FASE 6: PLANIFICACIÓN DEL SISTEMA

**Estado Actual:** 5.25/10 - BACKEND LISTO, SIN UI
**Objetivo:** Llevar a 9.0/10

### Backend Existente

| Modelo | Campos Principales | Estado |
|--------|-------------------|--------|
| PlanTrabajoAnual | nombre, año, objetivos, estado | OK |
| ActividadPlan | plan, nombre, responsable, fecha_inicio, fecha_fin | OK |
| ObjetivoSistema | nombre, perspectiva, meta, indicador | OK |
| ProgramaGestion | nombre, tipo, descripcion, responsable | OK |
| ActividadPrograma | programa, nombre, frecuencia, responsable | OK |
| SeguimientoCronograma | actividad, fecha, porcentaje, observaciones | OK |

### Componentes a CREAR

| Archivo | Función |
|---------|---------|
| PlanificacionSistemaPage.tsx | Página principal con tabs |
| PlanesAnualesSection.tsx | CRUD de planes anuales |
| ActividadesPlanSection.tsx | Actividades con Gantt simple |
| ObjetivosSistemaSection.tsx | Objetivos del sistema (grid) |
| ProgramasSection.tsx | Programas de gestión |
| SeguimientoSection.tsx | Dashboard de seguimiento |

### Modales a CREAR

#### 1. PlanAnualModal
- **Campos:** Nombre, año, descripción, objetivos generales
- **Validación:** Año único
- **UX:** Selector de año

#### 2. ActividadPlanModal
- **Campos:** Nombre, plan, responsable, fecha_inicio, fecha_fin, estado
- **Validación:** Fechas coherentes
- **UX:** Selector de fechas, selector de responsable

#### 3. ObjetivoSistemaModal
- **Campos:** Nombre, perspectiva, descripción, meta_cuantitativa, indicador
- **Validación:** Meta > 0
- **UX:** Selector de perspectiva

#### 4. ProgramaModal
- **Campos:** Nombre, tipo (SST, Ambiental, etc.), descripción, responsable
- **Validación:** Tipo válido
- **UX:** Selector de tipo

#### 5. SeguimientoModal
- **Campos:** Actividad, fecha, porcentaje_avance, observaciones
- **Validación:** Porcentaje 0-100
- **UX:** Slider de porcentaje

### Tareas FASE 6

- [ ] **6.1** Crear PlanificacionSistemaPage.tsx con estructura de tabs
- [ ] **6.2** Crear PlanesAnualesSection.tsx
- [ ] **6.3** Crear PlanAnualModal.tsx
- [ ] **6.4** Crear ActividadesPlanSection.tsx con Gantt simple
- [ ] **6.5** Crear ActividadPlanModal.tsx
- [ ] **6.6** Crear ObjetivosSistemaSection.tsx
- [ ] **6.7** Crear ObjetivoSistemaModal.tsx
- [ ] **6.8** Crear ProgramasSection.tsx
- [ ] **6.9** Crear ProgramaModal.tsx
- [ ] **6.10** Crear SeguimientoSection.tsx con dashboard
- [ ] **6.11** Crear SeguimientoModal.tsx
- [ ] **6.12** Crear hooks: usePlanesAnuales, useActividades, useProgramas
- [ ] **6.13** Implementar transacciones atómicas en cambios de estado
- [ ] **6.14** Validar meta_cuantitativa != 0 (evitar división por cero)
- [ ] **6.15** Test flujo completo
- [ ] **6.16** Test responsive
- [ ] **6.17** Marcar FASE 6 como COMPLETADA

### Criterios de Aceptación

- [ ] UI completa y funcional
- [ ] Gantt simple para actividades
- [ ] Dashboard de seguimiento con métricas
- [ ] Programas por tipo (SST, Ambiental, ISO)
- [ ] Sin errores de división por cero

### Flujo de Datos

```
Usuario → PlanificacionSistemaPage
              ↓
        [Tabs: Planes Anuales | Actividades | Objetivos | Programas | Seguimiento]
              ↓
        Crear Plan Anual → PlanAnualModal
              ↓
        Agregar Actividades → ActividadPlanModal
              ↓
        Definir Objetivos → ObjetivoSistemaModal
              ↓
        Crear Programas → ProgramaModal
              ↓
        Registrar Seguimiento → SeguimientoModal
              ↓
        Dashboard muestra % avance global
```

---

## FASE 7: GESTIÓN DE PROYECTOS (PMI)

**Estado Actual:** 5.25/10 - BACKEND EXCELENTE, RUTAS ROTAS
**Objetivo:** Llevar a 9.0/10

### Backend Existente (PMBOK Completo)

| Modelo | Campos Principales | Estado |
|--------|-------------------|--------|
| Portafolio | nombre, descripcion, responsable | OK |
| Programa | portafolio, nombre, descripcion | OK |
| Proyecto | programa, nombre, estado, presupuesto, fechas | OK |
| ProjectCharter | proyecto, justificacion, alcance, objetivos | OK |
| InteresadoProyecto | proyecto, nombre, rol, influencia, interes | OK |
| FaseProyecto | proyecto, nombre, orden, estado | OK |
| ActividadProyecto | fase, nombre, predecesoras, duracion, responsable | OK |
| RecursoProyecto | proyecto, tipo, nombre, costo | OK |
| RiesgoProyecto | proyecto, descripcion, probabilidad, impacto | OK |
| SeguimientoProyecto | proyecto, fecha, PV, EV, AC (EVM) | OK |
| LeccionAprendida | proyecto, descripcion, categoria | OK |
| ActaCierre | proyecto, fecha, entregables, firmas | OK |

### PROBLEMA CRÍTICO: Rutas Inconsistentes

```typescript
// ACTUAL (INCORRECTO):
const BASE_URL = '/proyectos';

// CORRECTO:
const BASE_URL = '/api/gestion-estrategica/gestion-proyectos';
```

### Componentes a CREAR

| Archivo | Función |
|---------|---------|
| GestionProyectosPage.tsx | Página principal con tabs |
| PortafoliosSection.tsx | CRUD de portafolios |
| ProgramasProyectosSection.tsx | CRUD de programas |
| ProyectosSection.tsx | Lista/Kanban de proyectos |
| CharterSection.tsx | Project Charter |
| InteresadosSection.tsx | Matriz poder/interés |
| WBSSection.tsx | Estructura de trabajo |
| RiesgosProyectoSection.tsx | Matriz de riesgos 5x5 |
| SeguimientoProyectoSection.tsx | Curva S con EVM |
| CierreSection.tsx | Actas y lecciones |

### Modales a CREAR

#### 1. PortafolioModal
- **Campos:** Nombre, descripción, responsable
- **UX:** Simple form

#### 2. ProgramaProyectoModal
- **Campos:** Portafolio, nombre, descripción
- **UX:** Selector de portafolio

#### 3. ProyectoModal
- **Campos:** Programa, nombre, descripción, presupuesto, fechas, estado
- **Validación:** Fechas coherentes, presupuesto > 0
- **UX:** Formulario completo PMI

#### 4. CharterModal
- **Campos:** Proyecto, justificación, alcance, objetivos, restricciones, supuestos
- **UX:** Editor de texto rico

#### 5. InteresadoModal
- **Campos:** Nombre, rol, email, poder (1-5), interés (1-5), estrategia
- **UX:** Slider para poder/interés

#### 6. ActividadProyectoModal
- **Campos:** Fase, nombre, descripción, predecesoras, duración, responsable
- **Validación:** No crear ciclos en predecesoras
- **UX:** Multi-select para predecesoras

#### 7. RiesgoProyectoModal
- **Campos:** Descripción, categoría, probabilidad, impacto, respuesta
- **UX:** Selectores 1-5 para P/I

#### 8. SeguimientoEVMModal
- **Campos:** Fecha, PV (valor planificado), EV (valor ganado), AC (costo actual)
- **UX:** Campos numéricos con cálculos automáticos (CPI, SPI)

### Tareas FASE 7

- [ ] **7.1** CRÍTICO: Corregir BASE_URL en proyectosApi.ts
- [ ] **7.2** Crear GestionProyectosPage.tsx con estructura de tabs
- [ ] **7.3** Crear PortafoliosSection.tsx + Modal
- [ ] **7.4** Crear ProgramasProyectosSection.tsx + Modal
- [ ] **7.5** Crear ProyectosSection.tsx (Kanban + Lista) + Modal
- [ ] **7.6** Crear CharterSection.tsx + Modal
- [ ] **7.7** Crear InteresadosSection.tsx + Modal + Matriz poder/interés
- [ ] **7.8** Crear WBSSection.tsx (Gantt) + Modal
- [ ] **7.9** Crear RiesgosProyectoSection.tsx + Modal + Matriz 5x5
- [ ] **7.10** Crear SeguimientoProyectoSection.tsx + Modal + Curva S
- [ ] **7.11** Crear CierreSection.tsx (Actas + Lecciones)
- [ ] **7.12** Crear hooks: usePortafolios, useProgramas, useProyectos, etc.
- [ ] **7.13** Implementar validación de ciclos en predecesoras
- [ ] **7.14** Implementar validación de transiciones de estado
- [ ] **7.15** Test flujo completo: crear proyecto → ejecutar → cerrar
- [ ] **7.16** Test responsive
- [ ] **7.17** Marcar FASE 7 como COMPLETADA

### Criterios de Aceptación

- [ ] Rutas API corregidas
- [ ] UI completa PMI
- [ ] Kanban de proyectos
- [ ] Matriz de interesados
- [ ] Gantt de actividades
- [ ] Matriz de riesgos 5x5
- [ ] Curva S con EVM
- [ ] Gestión de cierre

### Flujo de Datos

```
Usuario → GestionProyectosPage
              ↓
        [Tabs: Portafolios | Programas | Proyectos | Charter | Interesados | WBS | Riesgos | Seguimiento | Cierre]
              ↓
        Crear Portafolio → PortafolioModal
              ↓
        Crear Programa → ProgramaProyectoModal
              ↓
        Crear Proyecto → ProyectoModal
              ↓
        Definir Charter → CharterModal
              ↓
        Identificar Interesados → InteresadoModal → Matriz poder/interés
              ↓
        Crear WBS → ActividadProyectoModal → Gantt
              ↓
        Identificar Riesgos → RiesgoProyectoModal → Matriz 5x5
              ↓
        Seguimiento EVM → SeguimientoEVMModal → Curva S
              ↓
        Cierre → ActaCierre + Lecciones Aprendidas
```

---

## FASE 8: REVISIÓN POR LA DIRECCIÓN

**Estado Actual:** 5.5/10 - BACKEND LISTO, SIN UI
**Objetivo:** Llevar a 9.0/10

### Backend Existente (ISO 9.3 Compliant)

| Modelo | Campos Principales | Estado |
|--------|-------------------|--------|
| ProgramaRevision | nombre, año, frecuencia | OK |
| ParticipanteRevision | programa, usuario, rol | OK |
| TemaRevision | nombre, categoria, norma_relacionada | OK |
| ActaRevision | programa, fecha, participantes | OK |
| AnalisisTemaActa | acta, tema, estado_actual, analisis, decisiones | OK |
| CompromisoRevision | acta, descripcion, responsable, fecha_limite | OK |
| SeguimientoCompromiso | compromiso, fecha, avance, observaciones | OK |

### Componentes a CREAR

| Archivo | Función |
|---------|---------|
| RevisionDireccionPage.tsx | Página principal con tabs |
| CalendarioRevisionesSection.tsx | FullCalendar con reuniones |
| ProgramacionSection.tsx | Programas de revisión |
| TemasSection.tsx | Temas ISO a revisar |
| ActasSection.tsx | Actas de reunión |
| CompromisosSection.tsx | Compromisos con vencimientos |
| DashboardRevisionSection.tsx | Métricas de cumplimiento |

### Modales a CREAR

#### 1. ProgramaRevisionModal
- **Campos:** Nombre, año, frecuencia, descripción
- **UX:** Selector de frecuencia (trimestral, semestral, anual)

#### 2. ParticipanteModal
- **Campos:** Usuario, rol (Presidente, Secretario, Miembro)
- **UX:** Búsqueda de usuarios

#### 3. TemaRevisionModal
- **Campos:** Nombre, categoría, norma_relacionada, descripción
- **Mejora:** Hacer temas configurables (actualmente hardcoded)

#### 4. ActaRevisionModal
- **Campos:** Fecha, hora, lugar, participantes, temas a tratar
- **UX:** Multi-select de participantes y temas

#### 5. AnalisisTemaModal
- **Campos:** Tema, estado_actual, análisis, decisiones, evidencias
- **UX:** Editor de texto para análisis detallado

#### 6. CompromisoModal
- **Campos:** Descripción, responsable, fecha_límite, prioridad
- **UX:** Selector de fecha con indicador de urgencia

#### 7. SeguimientoCompromisoModal
- **Campos:** Fecha, porcentaje_avance, observaciones
- **UX:** Slider de avance

### Tareas FASE 8

- [ ] **8.1** Crear RevisionDireccionPage.tsx con estructura de tabs
- [ ] **8.2** Crear CalendarioRevisionesSection.tsx con FullCalendar
- [ ] **8.3** Crear ProgramacionSection.tsx + Modal
- [ ] **8.4** Crear ParticipantesSection.tsx + Modal
- [ ] **8.5** Crear TemasSection.tsx + Modal (hacer configurables)
- [ ] **8.6** Crear ActasSection.tsx + Modal
- [ ] **8.7** Crear AnalisisTemaSection.tsx + Modal
- [ ] **8.8** Crear CompromisosSection.tsx + Modal + Lista de vencidos
- [ ] **8.9** Crear SeguimientoCompromisoModal.tsx
- [ ] **8.10** Crear DashboardRevisionSection.tsx con métricas
- [ ] **8.11** Crear hooks: useProgramasRevision, useActas, useCompromisos
- [ ] **8.12** Crear API client (revisionDireccionApi.ts)
- [ ] **8.13** OPCIONAL: Agregar notificaciones de vencimiento
- [ ] **8.14** Test flujo completo
- [ ] **8.15** Test responsive
- [ ] **8.16** Marcar FASE 8 como COMPLETADA

### Criterios de Aceptación

- [ ] UI completa ISO 9.3
- [ ] Calendario de revisiones
- [ ] Gestión de actas
- [ ] Tracking de compromisos
- [ ] Dashboard de cumplimiento
- [ ] Temas configurables (no hardcoded)

### Flujo de Datos

```
Usuario → RevisionDireccionPage
              ↓
        [Tabs: Calendario | Programación | Temas | Actas | Compromisos | Dashboard]
              ↓
        Crear Programa → ProgramaRevisionModal
              ↓
        Definir Participantes → ParticipanteModal
              ↓
        Configurar Temas → TemaRevisionModal
              ↓
        Crear Acta → ActaRevisionModal
              ↓
        Analizar Temas → AnalisisTemaModal
              ↓
        Generar Compromisos → CompromisoModal
              ↓
        Seguimiento → SeguimientoCompromisoModal
              ↓
        Dashboard muestra cumplimiento
```

---

## RESUMEN DE ESFUERZO POR FASE

| Fase | App | Estado Inicial | Estado Final | Esfuerzo |
|------|-----|----------------|--------------|----------|
| 1 | Configuración | 9.0/10 | 10/10 | 0.5 días |
| 2 | Organización | 8.5/10 | 9.5/10 | 1 día |
| 3 | Identidad Corporativa | 8.75/10 | 9.5/10 | 1 día |
| 4 | Planeación Estratégica | 8.0/10 | 9.0/10 | 1 día |
| 5 | Gestión Documental | 5.75/10 | 9.0/10 | 3 días |
| 6 | Planificación Sistema | 5.25/10 | 9.0/10 | 3 días |
| 7 | Gestión Proyectos | 5.25/10 | 9.0/10 | 4 días |
| 8 | Revisión Dirección | 5.5/10 | 9.0/10 | 3 días |
| **TOTAL** | | **7.0/10** | **9.4/10** | **16.5 días** |

---

## CHECKLIST DE VERIFICACIÓN POR FASE

### Al completar cada fase, verificar:

- [ ] **Backend**
  - [ ] ViewSets con GranularActionPermission
  - [ ] Validaciones en serializers
  - [ ] Sin errores en logs
  - [ ] Tests pasando

- [ ] **Frontend**
  - [ ] Página principal funcional
  - [ ] Todos los modales abren/cierran
  - [ ] Validaciones en formularios
  - [ ] Toast de feedback
  - [ ] Responsive (mobile/tablet/desktop)

- [ ] **Integración**
  - [ ] API calls funcionando
  - [ ] Datos persisten correctamente
  - [ ] Sin errores de consola
  - [ ] Performance aceptable (<2s)

- [ ] **UX/UI**
  - [ ] Design System consistente
  - [ ] Colores/iconos correctos
  - [ ] Estados de carga visibles
  - [ ] Error handling visible

---

## SIGUIENTE ACCIÓN

**Comenzar con FASE 1: CONFIGURACIÓN**

1. Revisar componentes existentes
2. Verificar modales funcionan correctamente
3. Documentar cualquier hallazgo
4. Marcar como 100% completada

---

**Documento creado:** 18 Enero 2026
**Próxima actualización:** Al completar FASE 1
