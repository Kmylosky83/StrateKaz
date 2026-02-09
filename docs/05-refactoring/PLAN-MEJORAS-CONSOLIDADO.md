# Plan de Mejoras Consolidado - StrateKaz ERP

> Documento vivo - Se actualiza con cada sesion de revision
> Ultima actualizacion: 2026-02-08
> Estado: EN REVISION

---

## 1. Estado General por NIVEL

| NIVEL | Descripcion | Backend | Frontend | Produccion |
|-------|-------------|---------|----------|------------|
| 0 | Seed automatico (modulos, tabs, permisos) | 100% | N/A | LISTO |
| 1 | Fundacion Empresarial (tenant, empresa, branding) | 100% | 95% | LISTO |
| 2 | Estructura Organizacional (areas, cargos, sedes) | 100% | 95% | LISTO |
| 3 | Direccion Estrategica (identidad, contexto, planeacion) | 100% | 90% | LISTO |
| 4 | Talent Hub (seleccion, colaboradores, formacion, etc.) | 95% | 85% | FUNCIONAL |
| 5 | Riesgos y Cumplimiento (IPEVR, matriz legal, workflows) | 90% | 75% | PARCIAL |
| 6 | HSEQ (medicina, seguridad, calidad, ambiental, etc.) | 85% | 70% | PARCIAL |
| 7 | Operaciones (supply chain, produccion, ventas, contabilidad) | 80% | 60% | PARCIAL |

---

## 2. Preguntas y Respuestas de Revision

### P1: Motor BPM/Workflow - Funcionalidad y Estado

**Estado: Backend 85% modelado, 40% funcional. Frontend 5% (solo placeholders).**

#### Lo que EXISTE:
- 4 sub-apps con 20+ modelos BPMN 2.0 compliant
- ViewSets CRUD completos con acciones: pausar, reanudar, cancelar, completar, reasignar, rechazar, bandeja, estadisticas
- `TransicionFlujo.evaluar_condicion()` funcional con 8 operadores + logica AND/OR
- Firma Digital completa: hash SHA-256, flujos secuenciales/paralelos, delegacion, versionamiento
- `CampoFormulario` con 12 tipos de campo incluyendo SIGNATURE
- `RolFlujo.obtener_usuarios_asignados()` con reglas dinamicas

#### Lo que FALTA (Gaps Criticos):

| # | Gap | Prioridad | Esfuerzo | Archivos |
|---|-----|-----------|----------|----------|
| W-1 | **Motor de ejecucion**: Servicio que auto-avance entre nodos BPMN | CRITICA | Alto (~3 archivos) | `workflow_engine/services/engine.py` |
| W-2 | **Frontend Designer**: Implementar React Flow para editor visual drag & drop | CRITICA | Alto (~10 archivos) | `features/workflows/components/` |
| W-3 | **Frontend Ejecucion**: Conectar bandeja de tareas a API real (mock data) | ALTA | Medio (~5 archivos) | `features/workflows/pages/EjecucionPage.tsx` |
| W-4 | **Gateway logic**: Implementar split/join para GATEWAY_PARALELO y EXCLUSIVO | ALTA | Medio | Dentro de W-1 |
| W-5 | **Signals de disparo**: Auto-iniciar workflows al cambiar estado documento | MEDIA | Bajo (~2 archivos) | `workflow_engine/signals.py` |
| W-6 | **Instalar React Flow**: Agregar dependencia al frontend | MEDIA | Bajo | `package.json` |

---

### P2: Tecnologias de Automatizacion

**Stack actual: Django + DRF + Celery + Redis = base solida. Prioridad: implementar lo que ya existe.**

| # | Tecnologia | Uso en StrateKaz | Prioridad | Costo | Esfuerzo |
|---|------------|------------------|-----------|-------|----------|
| T-1 | **Celery Beat** (ya instalado) | Auto-calcular KPIs, alertas, recordatorios | ALTA | $0 | Medio |
| T-2 | **Django Signals** (ya instalado) | Auto-crear workflows, sincronizar modulos | ALTA | $0 | Bajo |
| T-3 | **React Flow** (open source) | Editor visual workflows BPMN drag & drop | MEDIA | $0 | Alto |
| T-4 | **Web Scraping** (Scrapy/Selenium) | Monitoreo normativo (SUIN-Juriscol, MinTrabajo) | MEDIA | Bajo | Medio |
| T-5 | **OCR** (Tesseract/AWS Textract) | Digitalizacion certificados, licencias, EPP | MEDIA | Bajo-Medio | Medio |
| T-6 | **IA/LLM** (Claude API) | Analisis causa raiz, informes, asistente normativo | BAJA | Medio | Alto |
| T-7 | **Computer Vision/YOLO** | Deteccion EPP en fotos de inspecciones | BAJA | Alto (GPU) | Muy Alto |

---

### P3: Formularios - Video Tutoriales y Firma Digital

**Firma Digital: EXISTE (enterprise-grade).** SignaturePad.tsx 452 lineas, canvas calibrado, touch optimizado, SHA-256, delegacion, versionamiento.

**Video Tutoriales: NO EXISTE.** Falta tipo VIDEO_TUTORIAL en CampoFormulario + componente VideoEmbed.tsx. Esfuerzo bajo-medio.

---

### P4: Gestion de Tareas y Proyectos (Trello/Monday)

**NO tenemos Trello ni Monday integrados. Tenemos 4 motores propios MAS POTENTES (pero desconectados).**

#### Los 4 Motores:

| # | Motor | Equivalente a | Backend | Frontend | Estado |
|---|-------|---------------|---------|----------|--------|
| 1 | **Gestion Proyectos PMI** (`gestion_proyectos/`) | Monday + MS Project | 100% (12 modelos, Gantt, EVM, WBS) | 85% (Kanban drag&drop) | MAS AVANZADO |
| 2 | **Workflow Engine BPMN** (`workflow_engine/`) | ProcessMaker + DocuSign | 85% modelos, 40% funcional | 5% placeholders | Motor sin ejecutor |
| 3 | **Tareas y Recordatorios** (`tareas_recordatorios/`) | Trello basico | 100% CRUD | Sin frontend dedicado | API lista |
| 4 | **Planificacion Estrategica** (`planeacion/` + `planificacion_sistema/`) | Balanced Scorecard | 100% | 90% | Funcional |

#### Motor PMI (el mas poderoso) - Features:
- **Kanban board** con 7 columnas y drag & drop (`ProyectosKanban.tsx`)
- **12 modelos**: Portafolio > Programa > Proyecto > Fases > Actividades (WBS) > Recursos > Riesgos > Seguimiento > Lecciones Aprendidas > Acta de Cierre
- **Dependencias** entre actividades (predecessor/successor)
- **EVM** (Earned Value Management): SPI, CPI, Curva S
- **Gantt** endpoint (`/actividades/gantt/`)
- **Matriz de riesgos** (probabilidad x impacto)
- **Matriz de interesados** (poder x interes - 4 cuadrantes)
- **Presupuesto** detallado (estimado, aprobado, ejecutado)
- **Dashboard** con stats por estado, prioridad, salud

#### Comparacion con competidores:

| Feature | Motor PMI | Trello | Monday | Asana |
|---------|----------|--------|--------|-------|
| Kanban drag & drop | SI | SI | SI | SI |
| Presupuesto y costos (EVM) | SI | NO | Parcial | NO |
| Gantt con dependencias | SI (API) | NO | SI | SI |
| Matriz de riesgos | SI | NO | NO | NO |
| Stakeholders (poder/interes) | SI | NO | NO | NO |
| WBS jerarquico | SI | NO | SI | SI |
| Firma digital integrada | SI | NO | NO | NO |
| Multi-tenant | SI | NO | NO | NO |

#### Planificacion Estrategica (Motor 4):
- StrategicPlan con periodos (anual a quinquenal) + aprobacion
- StrategicObjective con 4 perspectivas BSC (Financiera, Clientes, Procesos, Aprendizaje)
- MapaEstrategico con canvas visual + relaciones CausaEfecto
- KPIObjetivo con semaforo automatico + mediciones historicas
- GestionCambio con ciclo completo (Identificado > Analisis > Planificado > Ejecucion > Completado)
- PlanTrabajoAnual con objetivos del sistema, programas y cronograma

#### Gaps del sistema de proyectos:

| # | Gap | Descripcion | Esfuerzo |
|---|-----|-------------|----------|
| PR-1 | Subtareas en Kanban cards | Mostrar actividades/WBS en card proyecto | Bajo |
| PR-2 | Comentarios en tiempo real | Modelo Comentario + websockets | Medio |
| PR-3 | Vista Gantt frontend | Componente visual (gantt-task-react) | Alto |
| PR-4 | Hub unificado de tareas | Vista que agrupe tareas de los 4 motores | Medio |
| PR-5 | Notificaciones push | Web push (modelo ya existe) | Medio |

---

### P5: Revision por la Direccion vs Dashboard KPI

**NO es redundancia. Son complementarios, pero deben estar CONECTADOS.**

| Aspecto | Revision por Direccion | Dashboard KPI |
|---------|----------------------|---------------|
| Frecuencia | Periodica (trimestral/semestral/anual) | Tiempo real / continuo |
| Audiencia | Alta direccion en reunion formal | Todos los usuarios |
| Proposito | Evaluar, decidir, asignar compromisos | Monitorear operacion diaria |
| Datos | **MANUALES** (alguien los escribe) | Deberian ser **AUTOMATICOS** |
| ISO | Clausula 9.3 (obligatoria) | No es requisito ISO directo |

#### Estado actual de Revision por la Direccion:
- 7 modelos completos: ProgramaRevision, ParticipanteRevision, TemaRevision (14 categorias ISO), ActaRevision, AnalisisTemaActa, CompromisoRevision, SeguimientoCompromiso
- Workflow: PROGRAMADA > CONVOCADA > REALIZADA > CANCELADA
- Acta con elaboracion/revision/aprobacion
- Compromisos con seguimiento y auto-transicion de estados
- Export PDF del acta
- Multi-estandar: ISO 9001 + ISO 45001 + ISO 14001 + PESV + ISO 27001

#### Vision correcta (automatizar):
La Revision deberia ser un **"Dashboard KPI ejecutivo + acta de decisiones"** donde:
1. Los KPIs se auto-populan del modulo Analytics
2. La direccion solo entra a **analizar y decidir** (no a copiar datos)
3. Los compromisos se vinculan a KPIs especificos
4. El progreso se mide automaticamente

#### Gaps:

| # | Gap | Descripcion | Esfuerzo |
|---|-----|-------------|----------|
| RD-1 | Auto-popular TemaRevision con datos de ValorKPI | Cuando categoria = "info_desempeno" | Medio |
| RD-2 | Vincular CompromisoRevision con KPIObjetivo (FK) | Link compromisos a KPIs especificos | Bajo |
| RD-3 | Auto-calcular progreso desde datos operativos | Celery task que actualice avance | Alto |
| RD-4 | Snapshot KPI dentro del acta | Screenshot automatico del dashboard al momento de la revision | Medio |

---

### P6: Matrices de Riesgos - GTC-45, Evidencias, Evaluacion

**Las 6 matrices SI siguen metodologias correctas. Todas evaluan probabilidad x consecuencia. Problema: solo 1 de 6 puede subir evidencias.**

| Matriz | Metodologia | Formula | Residual | Evidencia FileField |
|--------|------------|---------|----------|---------------------|
| **IPEVR** | GTC-45 | ND x NE = NP, NP x NC = NR | Implicito | **SI** (unica) |
| **Aspectos Ambientales** | ISO 14001 | F x S x P + pesos | Implicito | NO (TextField) |
| **Riesgos Procesos** | ISO 31000 | P x I (5x5) | Explicito | NO |
| **Riesgos Viales** | PESV Res.40595 | F x P x S (5x5x5) | Explicito | NO (TextField) |
| **Seguridad Info** | ISO 27001 | P x I (5x5) | Explicito | NO (TextField) |
| **SAGRILAFT** | Circular SdS | Ponderado 4 factores | Explicito | NO (JSON refs) |

#### Gaps de evidencias:

| # | Gap | Descripcion | Esfuerzo |
|---|-----|-------------|----------|
| EV-1 | FileField en 5 matrices | Agregar campo evidencia real a Ambientales, Procesos, Viales, SegInfo, SAGRILAFT | Bajo (5 migraciones) |
| EV-2 | Integracion con Gestor Documental | Vincular evidencias via GenericFK al gestor documental (centralizado, con versionamiento) | Medio |
| EV-3 | Dashboard evidencias por cumplimiento | Vista que muestre % de controles con evidencia | Medio |

**Recomendacion**: Opcion EV-2 (integrar con Gestor Documental) es mas limpia - centraliza evidencias con versionamiento, retencion y distribucion gratis.

---

### P7: Gestor Documental - Potencia y Scraping

**Es profesional y enterprise-grade. NO tiene scraping/OCR.**

#### Lo que SI tiene:
- 6 modelos: TipoDocumento, PlantillaDocumento, Documento (45+ campos), VersionDocumento, CampoFormulario (16 tipos), ControlDocumental
- Versionamiento con snapshots + diff automatico + checksum SHA-256
- Workflow: BORRADOR > EN_REVISION > APROBADO > PUBLICADO > OBSOLETO > ARCHIVADO
- Clasificacion: PUBLICO, INTERNO, CONFIDENCIAL, RESTRINGIDO
- Control de distribucion (digital/impreso/mixto) con confirmacion recepcion
- Retencion documental configurable por tipo (años)
- Integracion firma digital (via workflow_engine.firma_digital)
- Templates HTML/Markdown con variables `{{variable}}`
- PDF export via WeasyPrint
- Listado Maestro (requisito ISO)

#### Lo que NO tiene:

| # | Gap | Descripcion | Tecnologia |
|---|-----|-------------|------------|
| GD-1 | **OCR/Scraping** de documentos | Extraer texto de PDFs/imagenes | Tesseract o AWS Textract |
| GD-2 | **Full-text search** | Buscar dentro del contenido | PostgreSQL FTS o Elasticsearch |
| GD-3 | **Extraccion metadata** | Auto-leer titulo, autor, fecha | PyPDF2, python-docx |
| GD-4 | **Auto-clasificacion** | Sugerir tipo/categoria por contenido | IA/LLM |

---

### P8: Constructor de Documentos / Formularios Dinamicos (Canva-like)

**Existe constructor de formularios dinamicos (backend). NO existe constructor visual tipo Canva.**

#### Lo que SI existe:

| Sistema | Componente | Capacidad |
|---------|-----------|-----------|
| Workflow Engine | CampoFormulario (12 tipos) | Formularios dinamicos con validacion y condiciones |
| Gestor Documental | CampoFormulario (16 tipos incl. TABLA) | Formularios documentales + tablas dinamicas |
| Gestor Documental | PlantillaDocumento | Templates HTML/Markdown con variables |
| Identidad | PDF Generator (WeasyPrint) | PDFs profesionales con branding |
| Seguridad Industrial | PlantillaInspeccion | Templates de inspeccion con items/scoring |

#### Lo que NO existe:

| # | Gap | Descripcion | Equivalente |
|---|-----|-------------|-------------|
| CD-1 | **Constructor visual drag & drop** | Diseñar layouts de tickets/recibos/reportes | Canva, JotForm |
| CD-2 | **WYSIWYG editor** | Editar documentos visualmente | TinyMCE avanzado |
| CD-3 | **Generador de recibos/tickets** | Layout personalizable de comprobantes | Invoice Ninja |
| CD-4 | **DynamicFormRenderer** frontend | Componente React que renderice CampoFormulario | Pendiente de crear |

**Nota critica**: El backend tiene toda la logica (campos, validacion, condiciones, grid 12 columnas), pero el frontend NO tiene el componente que los renderice visualmente. Crear `DynamicFormRenderer.tsx` desbloquea inspecciones, formularios de workflow, y documentos configurables.

---

### P9: Enlaces Publicos para Compartir y Diligenciar Formularios

**Encuestas DOFA: Backend 100% listo, Frontend 0%. Otros formularios: NO existe.**

#### Lo que EXISTE (encuestas):
- `EncuestaDofa.token_publico` (UUID) + `es_publica` (bool)
- `EncuestaPublicaView` con `AllowAny` permission (GET + POST sin auth)
- Token anonimo por IP+UserAgent (anti-duplicados)
- URL: `GET/POST /api/encuestas-dofa/publica/{uuid}/`
- Serializers publicos que ocultan datos sensibles

#### Lo que FALTA:

| # | Gap | Descripcion | Esfuerzo |
|---|-----|-------------|----------|
| EP-1 | **Pagina React publica** | `/surveys/respond/:token` sin ProtectedRoute | Medio (~500 lineas) |
| EP-2 | **UI compartir enlace** | Boton copiar URL + QR code en gestion encuestas | Bajo |
| EP-3 | **Framework generico publico** | Extender a inspecciones, workflows, documentos (PublicFormBase) | Alto |
| EP-4 | **Rate limiting** | CAPTCHA + limite por IP en endpoints publicos | Bajo |

---

### P10: Formularios que Generan Datos → BI y Reportes

**Generador de informes existe (backend), pero sin frontend ni pipeline datos operativos→KPIs.**

#### Generador de Informes (backend completo):
- `PlantillaInforme`: 6 tipos (KPI resumen, cumplimiento, tendencias, desempeno, ejecutivo, regulatorio)
- `InformeDinamico`: Genera PDF/Excel/Word/HTML/JSON con estado machine
- `ProgramacionInforme`: Scheduling automatico (diario a anual) + envio por email
- `HistorialInforme`: Auditoria completa de ejecuciones
- Formatos: PDF, Excel, Word, HTML, JSON

#### Gaps:

| # | Gap | Descripcion | Esfuerzo |
|---|-----|-------------|----------|
| RP-1 | **Frontend generador informes** | UI para crear, ver, descargar reportes | Alto |
| RP-2 | **Pipeline formulario→KPI** | Datos de CampoFormulario alimenten ValorKPI automaticamente | Alto |
| RP-3 | **Dashboard de reportes** | Vista con reportes programados + historial | Medio |

---

### P11: Export PDF y CSV - Estado Actual

**Solo 1 de ~20 modulos tiene export real. Librerias instaladas pero sin usar.**

#### Librerias instaladas:
- WeasyPrint v60.1+ (HTML→PDF)
- python-docx v1.1+ (Word)
- openpyxl v3.1+ (Excel)
- Pillow v10.2+ (Imagenes)

#### Estado por modulo:

| Modulo | PDF | DOCX | CSV | Excel | Estado |
|--------|-----|------|-----|-------|--------|
| **Identidad Corporativa** | SI | SI | - | - | FUNCIONAL (IdentidadPDFGenerator 851 lineas) |
| **Analytics Exportacion** | Config | Config | Config | Config | SOLO configuracion, sin generacion |
| **HSEQ (8 paginas)** | - | - | - | - | Boton UI existe, sin handler backend |
| **Otros ~15 modulos** | - | - | - | - | NO |

#### ExportMixin:
- Existe en `core/mixins.py` (lineas 232-262) con soporte CSV/Excel
- Retorna `501 Not Implemented` - NINGUN modulo lo usa
- Listo para ser implementado por herencia

#### Gaps:

| # | Gap | Descripcion | Esfuerzo |
|---|-----|-------------|----------|
| EX-1 | **Implementar ExportMixin en ~15 modulos** | Activar export CSV/Excel via mixin | Medio (repetitivo) |
| EX-2 | **PDF generator generico** | Reutilizar patron de Identidad para otros modulos | Medio |
| EX-3 | **Conectar botones frontend** | Los `onExport` de SectionToolbar/DataGrid ya existen | Bajo |

---

### P12: Copias de Seguridad en Google Drive por Tenant

**NO existe. Hay un stub vacio y testing de conexion cloud, pero cero backup real.**

#### Lo que existe:
- `backup_database` Celery task: **stub vacio** (solo genera nombre archivo, sin logica)
- `IntegracionExterna` modelo: soporta tipo "Almacenamiento" (S3, Drive, Azure)
- Connection testers: S3, Azure, GCS (solo prueban conexion)
- Docker volumes: `postgres_data`, `media_volume` (compartido, sin aislamiento tenant)

#### Lo que NO existe:

| # | Gap | Descripcion | Esfuerzo |
|---|-----|-------------|----------|
| BK-1 | **Aislamiento archivos por tenant** | `media/{tenant_id}/` en vez de `/media/` compartido | Medio |
| BK-2 | **django-storages** | Libreria para S3/Azure/Drive como storage backend | Bajo (instalacion) |
| BK-3 | **django-dbbackup** | Libreria para backup DB automatizado | Bajo (instalacion) |
| BK-4 | **Google Drive API** | `google-api-python-client` para backup a Drive del cliente | Medio |
| BK-5 | **Celery Beat backup schedule** | Tarea programada backup diario/semanal por tenant | Medio |
| BK-6 | **UI configuracion backup** | Panel admin para configurar backup por tenant | Medio |

**Riesgo actual**: Archivos de TODOS los tenants en `/media/` sin aislamiento.

---

### P13: Avatar Conectado a Talent Hub + Motor de Notificaciones

#### Avatar:
**Parcialmente conectado. Foto viene de User.photo, NO de Colaborador.foto. Sin upload en UI.**

| Aspecto | Estado |
|---------|--------|
| `User.photo` (ImageField) | Existe, se muestra en Header via UserMenu |
| `Colaborador.foto` (ImageField) | Existe, NO se usa en frontend |
| Upload foto en UserForm | **NO implementado** (falta input file) |
| Display (UserMenu) | Funciona: foto real o iniciales como fallback |
| Sincronizacion User↔Colaborador | **NO existe** (dos fotos separadas) |

#### Motor de Notificaciones:
**Completo y funcional. Email SI, Push NO, WebSocket NO.**

| Aspecto | Estado |
|---------|--------|
| 4 modelos (Notificacion, Tipo, Preferencias, Masivas) | COMPLETO |
| `NotificationService` (send, bulk, by_role, by_area) | FUNCIONAL |
| Email (`send_mail` + EmailService custom SMTP) | FUNCIONAL |
| Push notifications (Firebase FCM) | TODO pendiente |
| WebSocket (tiempo real) | NO (polling cada 60s) |
| Preferencias usuario (canales + Do Not Disturb) | COMPLETO |
| Campana en Header (badge conteo) | FUNCIONA |
| Integracion Talent Hub (`NotificadorTH`) | SI - 10+ tipos evento |
| Integracion Workflow/Firmas | SI - firmas pendientes/completadas |
| Auto-trigger por signals | **NO** - todo manual via servicio |

#### Gaps:

| # | Gap | Descripcion | Esfuerzo |
|---|-----|-------------|----------|
| AV-1 | **Upload foto en UserForm** | Input file + preview + crop | Bajo |
| AV-2 | **Sincronizar User.photo ↔ Colaborador.foto** | Signal post_save o campo unico | Bajo |
| NT-1 | **Push notifications (Firebase)** | Implementar `_send_push_notification()` | Medio |
| NT-2 | **WebSocket tiempo real** | Django Channels para notificaciones instant | Alto |
| NT-3 | **Auto-trigger por signals** | Signals en modelos clave para auto-notificar | Medio |

---

### P14: Eliminar Silos, BI Predictivo, Dashboards Construibles

#### Silos de Informacion (~85% aislados):
- Cada modulo opera independiente, casi sin comunicacion cruzada
- Solo 1 integracion real: `ValoresVividosWidgetService` (Identidad→Analytics)
- `AccionPorKPI.accion_correctiva_id` es integer suelto, NO FK real
- NO hay event bus, NO hay data warehouse, NO hay API agregacion cross-module

#### BI Predictivo:

| Capacidad | Modelos Backend | Computo | Librerias |
|-----------|----------------|---------|-----------|
| Regresion lineal | `TendenciaKPI` (r, R2, pendiente, intercepto) | Campos vacios | NO sklearn/numpy/scipy |
| Proyecciones 3/6/12m | Campos existen en TendenciaKPI | Sin calculo | NO |
| Deteccion anomalias | `AnomaliaDetectada` (desviacion std) | Sin auto-deteccion | NO |
| Analisis comparativo | `AnalisisKPI` (4 tipos) | Sin auto-calculo | NO |

**Cero librerias de data science instaladas. Modelos preparados para almacenar, nadie calcula.**

#### Dashboards Construibles:

| Capa | Componente | Estado |
|------|-----------|--------|
| Backend | `VistaDashboard` (perspectivas BSC) | LISTO |
| Backend | `WidgetDashboard` (7 tipos, grid 12 col, JSON config) | LISTO |
| Backend | `FavoritoDashboard` (preferencias por usuario) | LISTO |
| API | CRUD endpoints completos | LISTO |
| **Frontend** | **Dashboard Builder drag & drop** | **0% - NO EXISTE** |
| **Frontend** | **Widget gallery + config panels** | **0% - NO EXISTE** |

#### Gaps:

| # | Gap | Descripcion | Esfuerzo |
|---|-----|-------------|----------|
| SI-1 | **Capa integracion cross-module** | APIs agregacion multi-modulo en analytics | Alto |
| SI-2 | **Celery tasks KPI auto-calculo** | Tasks periodicas que calculen KPIs desde datos operativos | Alto |
| SI-3 | **Event bus (signals)** | Signals en modelos clave para propagar cambios | Medio |
| BI-1 | **Instalar sklearn/numpy/scipy** | Librerias data science | Bajo |
| BI-2 | **ML service** | `analytics/ml_service.py` que calcule regresion y anomalias | Alto |
| BI-3 | **Celery task predicciones** | Auto-generar TendenciaKPI y AnomaliaDetectada | Medio |
| DB-1 | **Dashboard Builder frontend** | Pagina con drag & drop (react-grid-layout) | Alto |
| DB-2 | **Widget config panels** | Modales para configurar cada tipo widget | Medio |
| DB-3 | **Widget rendering** | Componentes React para 7 tipos de widget | Alto |

---

### P15: Formacion, Gamificacion y Modulo "Heroes de la Seguridad"

**YA EXISTE gamificacion basica. El modulo formacion es uno de los mas completos del ERP.**

#### Lo que EXISTE (formacion_reinduccion):
- PlanFormacion: planes anuales con presupuesto y aprobacion
- Capacitacion: 11 tipos (SST, calidad, ambiente, PESV, liderazgo, etc.) + 5 modalidades (incl. outdoor)
- ProgramacionCapacitacion: sesiones con enlaces virtuales y cupos
- EjecucionCapacitacion: asistencia, evaluacion 0-100%, intentos, puntos
- **Badge**: 5 tipos (logro, nivel, especial, competencia, racha) con icono y color
- **GamificacionColaborador**: puntos (total/mes/año), nivel, racha, ranking
- **BadgeColaborador**: historial de insignias ganadas
- EvaluacionEficacia: Kirkpatrick 4 niveles (Reaccion, Aprendizaje, Comportamiento, Resultados)
- Certificado: PDF, firma, verificacion publica, vencimiento
- API: leaderboard, mi_perfil, mis_badges, estadisticas

#### Lo que FALTA para "Heroes":

| # | Gap | Descripcion | Esfuerzo |
|---|-----|-------------|----------|
| GM-1 | **NivelGamificacion configurable** | Thresholds por nivel (Novato→Guardian→Heroe→Leyenda) | Bajo |
| GM-2 | **RecompensaCatalogo + CanjePuntos** | Economia de recompensas canjeables | Medio |
| GM-3 | **Banco de Preguntas** | PreguntaCapacitacion con tipos (opcion multiple, matching, etc.) | Medio |
| GM-4 | **Modulo Bienestar** | Clima laboral, engagement, satisfaccion - NO existe | Alto (nuevo) |
| GM-5 | **Signals cross-module** | Puntos por: completar inspeccion, reportar riesgo, cumplir meta | Medio |
| GM-6 | **Racha mechanics** | Logica diaria (campos existen, logica NO implementada) | Bajo |

---

### P16: Seleccion - Pruebas Psicotecnicas y Automatizacion

**Pipeline completo pero ~30% automatizado. Sin pruebas psicotecnicas online.**

#### Pipeline actual (FUNCIONAL):
`VacanteActiva (12 campos) → Candidato (12 estados) → Entrevista (5 tipos, panel) → Prueba (TipoPrueba dinamico) → AfiliacionSS → HistorialContrato (Ley 2466/2025)`

#### Automatizacion actual:
- Auto-numeracion secuencial
- Auto-calculo aprobado/reprobado vs puntaje minimo
- Auto-estado contrato (renovaciones, preaviso)
- Estadisticas basicas de proceso

#### Lo que FALTA:

| # | Gap | Descripcion | Esfuerzo |
|---|-----|-------------|----------|
| SEL-1 | **Portal candidato publico** | Auto-postulacion sin cuenta (como LinkedIn Apply) | Alto |
| SEL-2 | **Pruebas psicotecnicas online** | Wartegg, 16PF, DISC interactivos en el sistema | Alto |
| SEL-3 | **Email automatico a candidatos** | Notificaciones cambio estado | Medio |
| SEL-4 | **Parsing de CV** | Extraer skills/experiencia de PDF con OCR/NLP | Alto |
| SEL-5 | **Screening automatico** | Filtrar candidatos por requisitos minimos | Medio |
| SEL-6 | **Calendar sync entrevistas** | Google/Outlook integration | Medio |

**Nota**: El TipoPrueba es catalogo dinamico - PUEDE configurarse "Wartegg" o "16PF" pero la evaluacion es un solo numero (0-100), no tiene escalas de personalidad ni perfiles psicologicos.

---

### P17: Programas → Gestor Documental → Tareas (Conexion)

**11 modelos "Programa" encontrados. CERO conectados a tareas ni a gestor documental.**

| Programa | Modulo | Tareas | Gestor Doc | KPIs |
|----------|--------|--------|-----------|------|
| PlanFormacion | Talent Hub | NO | NO (FileField) | NO |
| ProgramaVigilancia | Medicina Laboral | NO | NO (FileField) | NO |
| ProgramaSeguridad | Seguridad Industrial | NO | NO (JSONField) | NO |
| ProgramaAuditoria | Mejora Continua | NO | NO | NO |
| ProgramaRevision | Revision Direccion | NO | NO | NO |
| Programa (PMI) | Gestion Proyectos | SI (unico) | NO | NO |

**Problema central: cada programa es una isla.** Tienen FileField propio en vez de usar Gestor Documental. No generan Tareas. No alimentan KPIs.

#### Gaps:

| # | Gap | Descripcion | Esfuerzo |
|---|-----|-------------|----------|
| PG-1 | **Programas → auto-generar Tareas** | ContentType generico en tareas_recordatorios | Medio |
| PG-2 | **Programas → Gestor Documental** | Reemplazar FileField con FK a Documento | Medio |
| PG-3 | **Programas → KPIs** | Completar programa auto-actualice indicador | Medio |
| PG-4 | **Calendario unificado** | Vista global de todos los programas | Alto |

---

### P18: Comites - Conformacion, Actas, Firmas via BPM

**Modulo MUY completo (10 modelos, votacion secreta, quorum). Pero NO usa BPM ni firma digital.**

#### Lo que EXISTE:
- TipoComite: COPASST, COCOLA, CSV, Brigadas + custom (quorum %, roles JSON)
- Comite: conformacion→activo→finalizado, periodo configurable
- MiembroComite: principal/suplente, roles, eleccion, votos
- Reunion: ordinaria/extraordinaria, presencial/virtual/hibrida, quorum automatico
- **ActaReunion**: borrador→revision→aprobada, firmas como JSON
- **Compromiso**: 7 tipos, prioridad, % avance, evidencias, vencimiento
- SeguimientoCompromiso: tracking progreso periodico
- **Votacion**: secreta/publica, quorum, mayoria configurable, hash voto
- VotoMiembro: unico por miembro, abstenciones justificadas

#### Integraciones que FALTAN:

| # | Gap | Descripcion | Esfuerzo |
|---|-----|-------------|----------|
| CM-1 | **Acta → Workflow BPM** | Flujo automatico: Secretario→Presidente→Firmas | Medio |
| CM-2 | **Acta → FirmaDigital** | GenericFK a firma_digital con SHA-256 | Medio |
| CM-3 | **Acta → Gestor Documental** | Versionamiento, templates, retencion | Medio |
| CM-4 | **Compromiso → auto-Tarea** | Auto-crear Tarea con deadline al crear compromiso | Bajo |
| CM-5 | **Compromiso → Notificaciones** | Alertas automaticas de vencimiento | Bajo |
| CM-6 | **Acta PDF auto-generado** | WeasyPrint desde template antes de firmar | Medio |

---

### P19: Tecnologia Faltante y Mejores Practicas

#### Sorpresas positivas (ya implementado):

| Tecnologia | Estado | Detalle |
|-----------|--------|---------|
| **PWA** | EXCELENTE | Manifest dinamico por tenant, cache inteligente, offline indicator |
| **Seguridad** | EXCELENTE | 2FA/TOTP, rate limiting configurable, HSTS, CSP, JWT blacklist |
| **API Documentation** | COMPLETO | drf-spectacular OpenAPI 3.1, Swagger UI |
| **Audit Trail** | COMPLETO | Field-level change tracking, IP, device fingerprint, 365 dias |
| **Code Splitting** | COMPLETO | React.lazy() en todas las rutas |

#### Lo que FALTA:

| # | Gap | Prioridad | Esfuerzo |
|---|-----|-----------|----------|
| TEC-1 | **E2E Testing** (Playwright) | Alta | Alto |
| TEC-2 | **i18n** multi-idioma (100% español hardcoded) | Media | Medio |
| TEC-3 | **Calendar Integration** (Google/Outlook, ICS) | Media | Medio |
| TEC-4 | **Chat interno / @mentions** | Media | Alto |
| TEC-5 | **Bulk Import** (CSV masivo empleados/productos) | Media | Medio |
| TEC-6 | **Habeas Data** compliance endpoints | Media | Bajo |

---

### P20: Contabilidad, Activos Fijos, Vehiculos

**Los tres estan MAS completos de lo esperado. ~90% backend.**

#### Contabilidad (14 modelos - 4 sub-apps):
- PUC colombiano + NIIF PYMES/Plenas
- Partida doble con validacion cuadre automatico
- Comprobantes: borrador→aprobado→contabilizado→anulado
- 7 informes financieros (Balance, P&G, Flujo Efectivo, etc.)
- Integracion: parametros para nomina, inventarios, compras, ventas
- Cola asincrona (ColaContabilizacion) para volumen alto
- Plantillas recurrentes

#### Activos Fijos (6 modelos):
- 3 metodos depreciacion (lineal, acelerada, unidades produccion)
- Calculo mensual automatico con valor en libros
- Hoja de vida (mantenimiento, reparacion, traslado, calibracion)
- Programa mantenimiento con auto-reprogramacion
- Baja con aprobacion y diferencia valor residual

#### Vehiculos/Flota (16 modelos - 2 sub-apps):
- Registro vehicular completo (placa, VIN, SOAT, tecnomecanica)
- PESV: verificacion preoperacional diaria con checklist JSON
- 3 tipos mantenimiento (preventivo, correctivo, predictivo)
- Costos operacion con eficiencia combustible (km/litro)
- Conductores con licencia y vencimiento
- Rutas, despachos, manifiestos RNDC, cadena de frio
- GPS ready (campo existe)

#### Tesoreria (6 modelos):
- Bancos con saldo disponible/comprometido
- CxP/CxC con aging y auto-estado
- Pagos/Recaudos con actualizacion automatica saldos
- Flujo caja proyectado vs real

#### Gaps de integracion:

| # | Gap | Descripcion | Esfuerzo |
|---|-----|-------------|----------|
| FIN-1 | **Depreciacion → Asiento contable** | Auto-crear comprobante desde Depreciacion mensual | Medio |
| FIN-2 | **Mantenimiento → Gasto contable** | Auto-contabilizar costos de mantenimiento | Medio |
| FIN-3 | **Combustible → Gasto contable** | Auto-contabilizar CostoOperacion | Bajo |
| FIN-4 | **Barcode/QR para activos** | Codigo QR para inventario fisico | Bajo |
| FIN-5 | **GPS real-time** | Integrar con proveedor GPS | Alto |

---

## 3. Opinion Objetiva del Software

### Lo que StrateKaz ES:
Un ERP multi-tenant para sistemas de gestion colombianos con **~211 modelos backend, arquitectura modular en 7 niveles, y cobertura funcional comparable a software de $50K-$200K USD anuales** como ISOTools, Kawak, SAIA o Pensemos.

### Fortalezas (lo que pocos competidores tienen):

| Fortaleza | Detalle | Competidores que NO lo tienen |
|-----------|---------|------------------------------|
| **Multi-tenant real** | Schema isolation, branding por tenant, PWA dinamico | ISOTools (single-tenant), Kawak (multi-tenant basico) |
| **Motor PMI** con EVM | Portafolio→Programa→Proyecto→WBS con Earned Value | Ninguno en el segmento SG colombiano |
| **6 matrices de riesgos** | GTC-45, ISO 14001, ISO 31000, PESV, ISO 27001, SAGRILAFT | La mayoria solo tiene IPEVR |
| **Gamificacion** | Puntos, badges, leaderboard, rachas | Ninguno lo tiene |
| **Gestor documental enterprise** | Versionamiento SHA-256, workflows, distribucion, retencion | SAIA tiene similar, otros no |
| **Firma digital** con workflow | Secuencial, paralela, delegacion, hash verificacion | Solo los mas caros (SAIA) |
| **Contabilidad integrada** | PUC + NIIF + partida doble + 7 informes | Los SG no tienen contabilidad |
| **Flota PESV completa** | Preoperacional diario, manifiestos RNDC, cadena frio | Kawak no tiene flota |
| **Seguridad** | 2FA, rate limiting, CSP, audit trail field-level | Pocos implementan todo esto |

### Debilidades honestas (los gaps reales):

| Debilidad | Impacto | Dificultad |
|-----------|---------|------------|
| **Modulos desconectados (silos)** | 85% de datos aislados. Los programas no generan tareas, las evidencias no van al gestor documental, los KPIs no se auto-calculan. | ALTA - Es el problema #1 |
| **Frontend incompleto en NIVEL 5-7** | ~70% de KPI cards son mock data, workflow sin UI, dashboard sin builder | MEDIA - Es trabajo repetitivo |
| **Motor workflow sin ejecutor** | El BPMN esta modelado pero no ejecuta automaticamente | ALTA - Es el gap critico de automatizacion |
| **Export casi inexistente** | Solo Identidad exporta PDF/DOCX, ~15 modulos sin export alguno | BAJA - ExportMixin ya existe |
| **Sin BI predictivo real** | Modelos para regresion/anomalias existen pero cero librerias data science | MEDIA - Instalar y calcular |
| **Sin pruebas psicotecnicas online** | Seleccion usa scoring numerico basico, no perfiles de personalidad | ALTA - Requiere motor evaluacion nuevo |
| **Sin backup por tenant** | Archivos mezclados sin aislamiento, stub vacio de backup | MEDIA - Riesgo de seguridad |
| **Sin i18n** | 100% español hardcoded, limita mercado internacional | MEDIA - Trabajo extenso |
| **Sin E2E tests** | Cero Playwright/Cypress, testing coverage minimo | MEDIA - Deuda tecnica |

### Calificacion por area (1-10):

| Area | Backend | Frontend | Integracion | Total |
|------|---------|----------|-------------|-------|
| Arquitectura Multi-tenant | 9 | 9 | 9 | **9.0** |
| Seguridad / Auth / RBAC | 9 | 8 | 8 | **8.3** |
| Contabilidad / Finanzas | 9 | 7 | 7 | **7.7** |
| Talento Humano | 9 | 7 | 6 | **7.3** |
| HSEQ (SST+Calidad+Ambiental) | 8 | 6 | 4 | **6.0** |
| Gestion Estrategica | 9 | 8 | 5 | **7.3** |
| Riesgos y Cumplimiento | 8 | 6 | 4 | **6.0** |
| Workflow / BPM | 7 | 2 | 3 | **4.0** |
| BI / Analytics | 8 | 2 | 2 | **4.0** |
| Gestor Documental | 8 | 5 | 3 | **5.3** |
| Flota / Vehiculos | 9 | 6 | 5 | **6.7** |
| **PROMEDIO GENERAL** | **8.5** | **6.0** | **5.1** | **6.4** |

### Veredicto:

**Backend: 8.5/10** - Extraordinariamente bien modelado. 211 modelos con relaciones correctas, validaciones, workflows de estado, y cobertura normativa colombiana (Decreto 1072, GTC-45, Resoluciones, NIIF, Ley 2466). Pocos ERPs colombianos tienen esta profundidad.

**Frontend: 6.0/10** - Funcional para NIVEL 0-3, incompleto para NIVEL 4-7. Muchas paginas con mock data, sin workflow UI, sin dashboard builder, sin export. Pero la arquitectura (React + TypeScript + TanStack Query + Zustand) es moderna y escalable.

**Integracion: 5.1/10** - Este es el talon de Aquiles. Los modulos son excelentes individualmente pero casi no se hablan entre si. El motor workflow no ejecuta, los programas no generan tareas, las evidencias no van al gestor documental, los KPIs no se auto-calculan.

**Para lanzamiento MVP**: NIVEL 0-3 esta listo. NIVEL 4 necesita 2-3 semanas. NIVEL 5-7 necesita los sprints planificados.

**Ventaja competitiva real**: La cobertura funcional es superior a Kawak, ISOTools, y comparable a SAIA pero con multi-tenancy real y tecnologia moderna (React, Django 5, PWA). Si se resuelve la integracion entre modulos, es un producto de clase A para el mercado colombiano.

---

## 4. Plan de Mejoras por Sprint

### Sprint 1: Motor de Ejecucion Workflow (Prioridad CRITICA)
**Objetivo**: Que un workflow pueda ejecutarse de principio a fin automaticamente.

| Tarea | Descripcion | Archivos |
|-------|-------------|----------|
| Crear `WorkflowEngine` service | `iniciar_flujo()`, `avanzar()`, `evaluar_gateway()`, `completar_flujo()` | `services/engine.py` |
| Resolver gateways | Split paralelo, join, exclusivo | Dentro de engine.py |
| Auto-crear tareas | Al avanzar nodo, crear TareaActiva | Dentro de engine.py |
| Signals de inicio/avance | Auto-disparar engine | `signals.py` |

### Sprint 2: BI/Analytics - Datos Reales + Romper Silos (Prioridad ALTA)
**Referencia**: `docs/05-refactoring/SPRINT-BI-ANALYTICS.md`

| Tarea | Descripcion | Archivos |
|-------|-------------|----------|
| Stats endpoints 8 modulos HSEQ | `views_stats.py` en cada sub-app | ~16 archivos |
| Celery tasks 13+ KPIs (SI-2) | Auto-calcular KPIs desde datos operativos | ~3 archivos |
| Capa integracion cross-module (SI-1) | APIs agregacion multi-modulo | ~5 archivos |
| Frontend hooks KPI | `useXxxStats()` hooks | ~16 archivos |
| Eliminar ~110 KPI cards mock | Reemplazar hardcoded | ~8 paginas |

### Sprint 3: Frontend Workflow + DynamicFormRenderer (Prioridad ALTA)

| Tarea | Descripcion | Archivos |
|-------|-------------|----------|
| Instalar React Flow | `npm install @xyflow/react` | `package.json` |
| Implementar Designer visual | Editor drag & drop BPMN | ~10 archivos |
| **DynamicFormRenderer.tsx** | Componente que renderiza CampoFormulario del backend | ~3 archivos |
| Conectar Ejecucion a API | Reemplazar mock data | ~5 archivos |
| Conectar Monitoreo a API | Dashboard instancias activas | ~3 archivos |

### Sprint 4: Revision Direccion Automatizada (Prioridad ALTA)

| Tarea | Descripcion | Archivos |
|-------|-------------|----------|
| Auto-popular TemaRevision con KPIs (RD-1) | Pull datos de ValorKPI | ~2 archivos backend |
| Vincular Compromisos a KPIs (RD-2) | FK CompromisoRevision > KPIObjetivo | 1 migracion |
| Snapshot KPI en acta (RD-4) | JSON snapshot del dashboard al crear acta | ~2 archivos |

### Sprint 5: Evidencias Centralizadas (Prioridad MEDIA)

| Tarea | Descripcion | Archivos |
|-------|-------------|----------|
| Integrar matrices con Gestor Documental (EV-2) | GenericFK para evidencias centralizadas | ~6 archivos + migraciones |
| Dashboard evidencias cumplimiento (EV-3) | Vista % controles con evidencia | ~3 archivos |

### Sprint 6: Gestor Documental Avanzado (Prioridad MEDIA)

| Tarea | Descripcion | Archivos |
|-------|-------------|----------|
| OCR/Scraping documentos (GD-1) | Tesseract o AWS Textract | ~3 archivos |
| Full-text search (GD-2) | PostgreSQL FTS | ~4 archivos |
| Constructor visual drag & drop (CD-1) | Editor de layouts/tickets/inspecciones | ~10 archivos |

### Sprint 7: Export Masivo + Formularios Publicos (Prioridad MEDIA)

| Tarea | Descripcion | Archivos |
|-------|-------------|----------|
| Implementar ExportMixin en ~15 modulos (EX-1) | Activar CSV/Excel via mixin existente | ~15 archivos |
| PDF generator generico (EX-2) | Reutilizar patron Identidad | ~3 archivos |
| Conectar botones frontend export (EX-3) | onExport handlers en SectionToolbar | ~8 archivos |
| Pagina publica encuestas (EP-1) | `/surveys/respond/:token` | ~3 archivos |
| UI compartir enlace + QR (EP-2) | Modal copiar URL en gestion encuestas | ~2 archivos |
| Frontend generador informes (RP-1) | UI crear/ver/descargar reportes | ~5 archivos |

### Sprint 8: Avatar, Video, Mejoras Kanban (Prioridad MEDIA)

| Tarea | Descripcion | Archivos |
|-------|-------------|----------|
| Upload foto en UserForm (AV-1) | Input file + preview | ~2 archivos |
| Sincronizar User.photo ↔ Colaborador.foto (AV-2) | Signal post_save | ~1 archivo |
| Campo VIDEO_TUTORIAL (V-1/V-2) | Nuevo tipo + campo backend | 2 + migracion |
| VideoEmbed.tsx (V-3) | Reproductor YouTube/Vimeo/MP4 | 1 archivo |
| Subtareas en Kanban (PR-1) | Mostrar WBS en cards | ~2 archivos |
| Vista Gantt frontend (PR-3) | Componente visual | ~5 archivos |

### Sprint 9: BI Predictivo + Dashboard Builder (Prioridad MEDIA)

| Tarea | Descripcion | Archivos |
|-------|-------------|----------|
| Instalar sklearn/numpy/scipy (BI-1) | Librerias data science | requirements |
| ML service regresion + anomalias (BI-2) | `analytics/ml_service.py` | ~3 archivos |
| Celery task predicciones (BI-3) | Auto-generar TendenciaKPI y AnomaliaDetectada | ~2 archivos |
| Dashboard Builder frontend (DB-1) | Pagina drag & drop (react-grid-layout) | ~5 archivos |
| Widget config panels (DB-2) | Modales configuracion por tipo widget | ~7 archivos |
| Widget rendering (DB-3) | Componentes React para 7 tipos widget | ~7 archivos |

### Sprint 10: Backup, Notificaciones Avanzadas, Automatizacion (Prioridad BAJA)

| Tarea | Descripcion | Archivos |
|-------|-------------|----------|
| Aislamiento archivos por tenant (BK-1) | `media/{tenant_id}/` | ~3 archivos |
| Backup a Google Drive (BK-4) | google-api + Celery task | ~5 archivos |
| Push notifications Firebase (NT-1) | Implementar FCM | ~3 archivos |
| WebSocket tiempo real (NT-2) | Django Channels | ~5 archivos |
| Scraper SUIN-Juriscol | Monitoreo normativo colombiano | Nueva app |
| Hub unificado de tareas (PR-4) | Vista global 4 motores | ~5 archivos |

---

## 5. Resumen Completo de Gaps (80+ identificados)

### Backend Criticos
- [ ] Motor de ejecucion workflow (W-1)
- [ ] Celery tasks KPIs automaticos (SI-2)
- [ ] Stats endpoints 15 modulos operativos
- [ ] Auto-popular Revision Direccion con KPIs (RD-1)
- [ ] Capa integracion cross-module para romper silos (SI-1)
- [ ] Programas → auto-generar Tareas (PG-1)

### Backend Altos
- [ ] FileField en 5 matrices de riesgos (EV-1) o integracion Gestor Documental (EV-2)
- [ ] FK CompromisoRevision > KPIObjetivo (RD-2)
- [ ] Signals auto-iniciar workflows (W-5)
- [ ] FK real AccionPorKPI.accion_correctiva_id
- [ ] ExportMixin implementado en ~15 modulos (EX-1)
- [ ] PDF generator generico reutilizable (EX-2)
- [ ] Aislamiento archivos por tenant (BK-1) - RIESGO seguridad
- [ ] Acta comites → FirmaDigital + Workflow BPM (CM-1, CM-2)
- [ ] Compromiso comite → auto-Tarea (CM-4)
- [ ] Programas → Gestor Documental (PG-2)
- [ ] Depreciacion → Asiento contable automatico (FIN-1)
- [ ] NivelGamificacion configurable (GM-1)

### Backend Medios
- [ ] Campo VIDEO_TUTORIAL (V-1)
- [ ] OCR/Scraping gestor documental (GD-1)
- [ ] Full-text search (GD-2)
- [ ] ML service regresion/anomalias (BI-2)
- [ ] Instalar sklearn/numpy/scipy (BI-1)
- [ ] Backup Google Drive por tenant (BK-4)
- [ ] Push notifications Firebase (NT-1)
- [ ] Auto-trigger notificaciones por signals (NT-3)
- [ ] Pipeline formulario→KPI (RP-2)
- [ ] RecompensaCatalogo + CanjePuntos (GM-2)
- [ ] Banco de Preguntas evaluacion (GM-3)
- [ ] Portal candidato publico (SEL-1)
- [ ] E2E Testing Playwright (TEC-1)
- [ ] Mantenimiento → Gasto contable (FIN-2)

### Frontend Criticos
- [ ] Editor visual workflows React Flow (W-2)
- [ ] **DynamicFormRenderer.tsx** (CD-4) - desbloquea inspecciones, workflows, documentos
- [ ] Conectar EjecucionPage a API real (W-3)
- [ ] **Dashboard Builder** drag & drop (DB-1) - backend 100% listo, frontend 0%

### Frontend Altos
- [ ] Conectar ~110 KPI cards a APIs reales
- [ ] Constructor visual drag & drop documentos (CD-1)
- [ ] Vista Gantt proyectos (PR-3)
- [ ] Hub unificado tareas (PR-4)
- [ ] Widget rendering 7 tipos (DB-3)
- [ ] Pagina publica encuestas (EP-1)
- [ ] Frontend generador informes (RP-1)
- [ ] Calendario unificado cross-modulo (PG-4)

### Frontend Medios
- [ ] VideoEmbed.tsx (V-3)
- [ ] Subtareas en Kanban cards (PR-1)
- [ ] Dashboard evidencias cumplimiento (EV-3)
- [ ] Upload foto en UserForm (AV-1)
- [ ] UI compartir enlace + QR (EP-2)
- [ ] Conectar botones export frontend (EX-3)
- [ ] Acta PDF auto-generado comites (CM-6)

---

## 5. Orden de Ejecucion Recomendado

```
Sprint 1:  Motor Workflow Engine          ← Desbloquea flujos de aprobacion
Sprint 2:  BI/Analytics + Romper Silos    ← KPIs reales + integracion cross-module
Sprint 3:  Frontend Workflow + Forms      ← UX workflows + DynamicFormRenderer
Sprint 4:  Revision Direccion auto        ← Conectar revision con KPIs
Sprint 5:  Evidencias centralizadas       ← Gestor Documental como archivo central
Sprint 6:  Gestor Documental avanzado     ← OCR, search, constructor visual
Sprint 7:  Export Masivo + Forms Publicos  ← PDF/CSV todos modulos + encuestas publicas
Sprint 8:  Avatar, Video, Kanban          ← Features complementarios UX
Sprint 9:  BI Predictivo + Dashboard Builder ← ML + dashboards personalizables
Sprint 10: Backup, Push, Automatizacion   ← Infraestructura enterprise
```

---

## 6. Notas de Sesion

### 2026-02-08 (Sesion 1)
- Auditoria completa de modulos NIVEL 0-7
- Migracion de 8 paginas HSEQ a componentes reutilizables
- Creacion de 4 componentes comunes (KpiCard, SectionToolbar, StatusBadge, DataGrid)
- Investigacion profunda workflow engine: motor sin ejecutor
- BI/Analytics gap documentado en SPRINT-BI-ANALYTICS.md

### 2026-02-08 (Sesion 2)
- Auditoria de 4 motores de gestion tareas/proyectos (PMI, Workflow, Tareas, Planificacion)
- Motor PMI identificado como mas potente (supera Trello, comparable a Monday)
- Revision Direccion: 7 modelos ISO-compliant pero 100% manual, sin conexion a KPIs
- 6 matrices de riesgos auditadas: todas con probabilidad x consecuencia, solo IPEVR con FileField
- Gestor Documental: enterprise-grade pero sin OCR/scraping ni full-text search
- Constructor formularios: backend completo (16 tipos campo), falta DynamicFormRenderer frontend
- Constructor visual layouts (tipo Canva): NO existe
- Plan actualizado a 8 sprints con 40+ gaps identificados

### 2026-02-08 (Sesion 3)
- P9: Enlaces publicos encuestas: backend 100%, frontend 0% (solo ~500 lineas React)
- P10: Generador informes completo backend, sin frontend ni pipeline formulario→KPI
- P11: Solo Identidad tiene export real (PDF+DOCX), ExportMixin existe pero sin usar, ~15 modulos sin export
- P12: Backup NO existe (stub vacio), archivos sin aislamiento por tenant, sin Google Drive
- P13: Avatar de User.photo (no Colaborador.foto), sin upload UI, sin sincronizacion
- P13: Motor notificaciones funcional (email SI, push NO, websocket NO), integrado con TH y Workflow
- P14: ~85% datos en silos, cero librerias data science, Dashboard Builder backend 100%/frontend 0%
- Plan expandido a 10 sprints con 60+ gaps identificados

### 2026-02-08 (Sesion 4)
- P15: Formacion COMPLETA con gamificacion basica (Badge, puntos, leaderboard), falta economia recompensas y modulo Bienestar
- P16: Seleccion pipeline completo pero ~30% automatizado, sin pruebas psicotecnicas online ni portal candidato
- P17: 11 programas encontrados, CERO conectados a tareas ni gestor documental - principal problema de silos
- P18: Comites MUY completo (10 modelos, votacion secreta, quorum) pero sin BPM ni firma digital integrada
- P19: Sorpresas positivas: PWA excelente, seguridad 2FA enterprise, API documentada. Falta: E2E tests, i18n, calendar
- P20: Contabilidad (14 modelos, partida doble, NIIF), Activos (3 metodos depreciacion), Flota (16 modelos PESV) - ~90% backend
- P21: Opinion objetiva: Backend 8.5/10, Frontend 6.0/10, Integracion 5.1/10, General 6.4/10
- La integracion entre modulos es el problema #1 del software
- Plan actualizado a 80+ gaps, opinion completa con calificacion por area
