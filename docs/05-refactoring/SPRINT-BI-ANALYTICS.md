# Sprint BI/Analytics - Gap Analysis y Plan de Implementacion

> Documento generado: 2026-02-08
> Estado: PENDIENTE - Para abordar despues de completar revision modular

---

## 1. Estado Actual del Modulo Analytics

### Backend: Modelos (85-90% completo)

El modulo `backend/apps/analytics/` tiene 7 sub-apps con modelos bien definidos:

| Sub-app | Modelos | Estado |
|---------|---------|--------|
| `config_indicadores` | CatalogoKPI, FichaTecnicaKPI, MetaKPI, ConfiguracionSemaforo | Completo |
| `indicadores_area` | ValorKPI, AccionPorKPI, AlertaKPI | Completo |
| `acciones_indicador` | PlanAccionKPI, ActividadPlanKPI, SeguimientoPlanKPI, IntegracionAccionCorrectiva | Completo |
| `analisis_tendencias` | AnalisisKPI, TendenciaKPI, AnomaliaDetectada | Completo |
| `dashboard_gerencial` | VistaDashboard, WidgetDashboard, FavoritoDashboard | Completo |
| `generador_informes` | PlantillaInforme, InformeGenerado, SeccionInforme | Completo |
| `exportacion_integracion` | ExportacionProgramada, IntegracionExterna, LogExportacion | Completo |

### Backend: API Endpoints (100% CRUD)

Todos los ViewSets estan registrados:
- `/api/analytics/configuracion/kpis/` - CRUD CatalogoKPI
- `/api/analytics/configuracion/fichas-tecnicas/` - CRUD FichaTecnicaKPI
- `/api/analytics/indicadores/valores/` - CRUD ValorKPI
- `/api/analytics/indicadores/acciones/` - CRUD AccionPorKPI
- `/api/analytics/indicadores/alertas/` - CRUD AlertaKPI
- `/api/analytics/tendencias/analisis/` - CRUD AnalisisKPI
- `/api/analytics/dashboards/vistas/` - CRUD VistaDashboard
- `/api/analytics/informes/plantillas/` - CRUD PlantillaInforme
- `/api/analytics/planes-accion/planes/` - CRUD PlanAccionKPI

### Lo que FALTA (Gap Critico)

**NO existe pipeline automatizado de datos.** Todo es manual:

1. **`FichaTecnicaKPI.fuente_datos`** = `TextField` (texto libre, no referencia a tabla)
2. **`ValorKPI.datos_origen`** = `JSONField` (llenado manualmente por usuario)
3. **`ValorKPI.registrado_por`** = FK a User (alguien debe entrar y registrar a mano)
4. **`AccionPorKPI.accion_correctiva_id`** = `PositiveBigIntegerField` (NO es FK, es un entero suelto)
5. **NO existen `tasks.py` en analytics/** - Cero Celery tasks
6. **NO existen signals** que escuchen eventos de modulos operativos

---

## 2. Endpoints de Estadisticas por Modulo Operativo

### Modulos CON endpoint de stats (datos reales del DB)

| Modulo | Endpoint | ViewSet | Datos |
|--------|----------|---------|-------|
| Medicina Laboral | `/api/hseq/medicina-laboral/estadisticas/` | EstadisticaMedicaViewSet | Count examenes, vencidos, por tipo |
| Seleccion/Contratacion | `/api/talent-hub/seleccion/estadisticas/` | ProcesoSeleccionEstadisticasViewSet | Vacantes abiertas, contratados |
| Onboarding | `/api/talent-hub/onboarding/estadisticas/` | OnboardingEstadisticasViewSet | Procesos activos, completados |
| Formacion | `/api/talent-hub/formacion/estadisticas/` | FormacionEstadisticasViewSet | Capacitaciones, asistencia |
| Desempeno | `/api/talent-hub/desempeno/estadisticas/` | DesempenoEstadisticasViewSet | Evaluaciones, promedios |
| Gestion Estrategica | `/api/gestion-estrategica/strategic-stats/` | StrategicStatsViewSet | Objetivos, iniciativas |
| Identidad | `/api/gestion-estrategica/identidad/stats/` | StrategicStatsViewSet | Politicas, valores |
| Revision Direccion | `/api/gestion-estrategica/revision-direccion/stats/` | RevisionDireccionStatsViewSet | Revisiones, compromisos |
| Config Estrategica | `/api/gestion-estrategica/configuracion/config-stats/` | config_stats_view | Normas, procesos |
| Planeacion | `/api/gestion-estrategica/planeacion/kpis/` | KPIObjetivoViewSet | KPIs estrategicos |
| Inventario | `/api/supply-chain/almacen/dashboard-inventario/` | DashboardInventarioViewSet | Stock, movimientos |
| RBAC | `/api/core/rbac/` | RBACStatsViewSet | Usuarios, roles, permisos |

### Modulos SIN endpoint de stats (gap)

| Modulo | Sub-apps afectadas | KPIs posibles |
|--------|-------------------|---------------|
| **Accidentalidad** | accidentalidad/ | Tasa AT, IF, IS, dias perdidos |
| **Seguridad Industrial** | seguridad_industrial/ | Inspecciones, hallazgos, EPP |
| **Calidad** | calidad/ | No conformidades, auditorias, satisfaccion |
| **Emergencias** | emergencias/ | Simulacros, brigadas, planes |
| **Gestion Ambiental** | gestion_ambiental/ | Residuos, vertimientos, huella carbono |
| **Higiene Industrial** | higiene_industrial/ | Mediciones, exposicion |
| **Comites** | gestion_comites/ | Reuniones, asistencia, compromisos |
| **Mejora Continua** | mejora_continua/ | Hallazgos, acciones correctivas |
| **Motor Riesgos** | ipevr/, aspectos_ambientales/, riesgos_procesos/ | Riesgos identificados, tratados, residuales |
| **Motor Cumplimiento** | matriz_legal/, requisitos_legales/ | Cumplimiento legal, vencimientos |
| **Produccion** | procesamiento/, recepcion/, producto_terminado/ | OEE, rechazo, rendimiento |
| **Ventas/CRM** | gestion_clientes/, pipeline_ventas/ | Leads, conversion, ticket promedio |
| **Admin/Finanzas** | tesoreria/, presupuesto/ | Flujo caja, ejecucion presupuestal |
| **Contabilidad** | movimientos/, informes_contables/ | Utilidad, liquidez, endeudamiento |
| **Logistica/Flota** | gestion_flota/, gestion_transporte/ | Km recorridos, consumo combustible |

---

## 3. Frontend: Mock Data vs Real Data

### Paginas HSEQ con datos MOCK (hardcoded en frontend)

| Pagina | KPIs Mock | Ejemplo |
|--------|-----------|---------|
| AccidentalidadPage | 16 cards | `value="25"`, `value="2.5"` (IF, IS) |
| CalidadPage | ~12 cards | NC abiertas, auditorias |
| SeguridadIndustrialPage | ~12 cards | Inspecciones, EPP entregados |
| EmergenciasPage | ~16 cards | Simulacros, brigadas |
| GestionAmbientalPage | 24 cards | `value="2,450 kg"`, `value="68%"` |
| PlanificacionSistemaPage | ~12 cards | Documentos, procedimientos |
| MedicinaLaboralPage | ~12 cards | Examenes (parcial real via API) |
| GestionComitesPage | ~12 cards | Reuniones, compromisos |

**Total: ~110+ KPI cards con datos mock** que necesitan API real.

### Paginas con datos REALES (API conectada)

| Pagina | Hook | Datos |
|--------|------|-------|
| Riesgos IPEVR | `useRiesgosIPEVR()` | Riesgos count, por nivel |
| TalentHubPage | `useColaboradores()` | Colaboradores activos, por area |
| Medicina Laboral (parcial) | `useExamenesMedicos()` | Examenes listados (stats mock) |

---

## 4. Sprint BI: Tareas Propuestas

### Fase 1: Backend - Crear Stats Endpoints (Prioridad Alta)

Crear `EstadisticasViewSet` en cada modulo HSEQ que no lo tenga:

```
1. hseq/accidentalidad/views_stats.py
   - total_at, total_el, tasa_frecuencia, tasa_severidad, dias_perdidos
   - Agrupados por: mes, area, gravedad

2. hseq/seguridad_industrial/views_stats.py
   - inspecciones_programadas vs realizadas, hallazgos abiertos/cerrados
   - EPP entregados, vencidos

3. hseq/calidad/views_stats.py
   - nc_abiertas, nc_cerradas, auditorias, satisfaccion_cliente

4. hseq/emergencias/views_stats.py
   - simulacros_realizados, brigadas_activas, planes_vigentes

5. hseq/gestion_ambiental/views_stats.py
   - residuos_totales, tasa_reciclaje, vertimientos, emisiones

6. hseq/gestion_comites/views_stats.py
   - reuniones_programadas vs realizadas, compromisos cumplidos

7. motor_riesgos/views_stats.py
   - riesgos_totales, por nivel, tratados vs residuales

8. motor_cumplimiento/views_stats.py
   - requisitos_vigentes, cumplimiento_porcentaje, vencimientos_proximos
```

### Fase 2: Backend - Crear Celery Tasks (Prioridad Alta)

Crear `analytics/tasks.py` con tasks periodicas que:

```python
# Ejemplo conceptual
@shared_task
def calcular_kpi_tasa_accidentalidad(empresa_id, periodo):
    """
    SST-001: Tasa de Accidentalidad
    Formula: (AT / Colaboradores) * 100
    Fuente: accidentalidad.AccidenteTrabajo + colaboradores.Colaborador
    """
    at_count = AccidenteTrabajo.objects.filter(
        empresa_id=empresa_id,
        fecha__year=periodo.year,
        fecha__month=periodo.month
    ).count()

    colaboradores = Colaborador.objects.filter(
        empresa_id=empresa_id, activo=True
    ).count()

    valor = (at_count / colaboradores * 100) if colaboradores > 0 else 0

    ValorKPI.objects.update_or_create(
        empresa_id=empresa_id,
        kpi=CatalogoKPI.objects.get(empresa_id=empresa_id, codigo='SST-001'),
        periodo=f"{periodo.year}-{periodo.month:02d}",
        defaults={
            'valor': valor,
            'fecha_medicion': timezone.now().date(),
            'datos_origen': {'at': at_count, 'colaboradores': colaboradores},
            'registrado_por_id': 1,  # Sistema
        }
    )
```

KPIs automatizables:
| Codigo | Nombre | Modulo Fuente | Formula |
|--------|--------|---------------|---------|
| SST-001 | Tasa Accidentalidad | accidentalidad | (AT/Colaboradores)*100 |
| SST-002 | Indice Frecuencia | accidentalidad | (AT*240000)/(HHT) |
| SST-003 | Indice Severidad | accidentalidad | (Dias perdidos*240000)/(HHT) |
| SST-004 | Cobertura Examenes | medicina_laboral | (Con examen vigente/Total)*100 |
| SST-005 | Cumplimiento Inspecciones | seguridad_industrial | (Realizadas/Programadas)*100 |
| AMB-001 | Tasa Reciclaje | gestion_ambiental | (Reciclables/Total residuos)*100 |
| AMB-002 | Huella Carbono | gestion_ambiental | Sum(emisiones tCO2e) |
| CAL-001 | NC Abiertas | calidad | Count(NC estado!=cerrado) |
| CAL-002 | Eficacia Correctivas | mejora_continua | (Eficaces/Total cerradas)*100 |
| RH-001 | Rotacion Personal | talent_hub | (Retiros/Promedio)*100 |
| RH-002 | Ausentismo | control_tiempo | (Ausencias/HHT)*100 |
| CUM-001 | Cumplimiento Legal | motor_cumplimiento | (Cumplidos/Total)*100 |
| RIE-001 | Riesgos Aceptables | motor_riesgos | (Aceptables/Total)*100 |

### Fase 3: Frontend - Conectar KPI Cards a API (Prioridad Media)

Reemplazar valores mock en cada pagina HSEQ:

```typescript
// ANTES (mock):
<KpiCard label="Total Accidentes" value={25} ... />

// DESPUES (API):
const { data: stats } = useAccidentalidadStats();
<KpiCard label="Total Accidentes" value={stats?.total_at ?? 0} ... />
```

Crear hooks:
- `useAccidentalidadStats()` -> GET /api/hseq/accidentalidad/estadisticas/
- `useSeguridadStats()` -> GET /api/hseq/seguridad-industrial/estadisticas/
- `useCalidadStats()` -> GET /api/hseq/calidad/estadisticas/
- `useEmergenciasStats()` -> GET /api/hseq/emergencias/estadisticas/
- `useAmbientalStats()` -> GET /api/hseq/gestion-ambiental/estadisticas/
- `useComitesStats()` -> GET /api/hseq/comites/estadisticas/
- `useRiesgosStats()` -> GET /api/motor-riesgos/estadisticas/
- `useCumplimientoStats()` -> GET /api/motor-cumplimiento/estadisticas/

### Fase 4: Dashboard Gerencial (Prioridad Baja)

El modulo dashboard_gerencial ya tiene modelos para:
- VistaDashboard (layouts configurables)
- WidgetDashboard (widgets individuales con tipo_widget: grafico, tabla, indicador, mapa)
- FavoritoDashboard (dashboards favoritos por usuario)

Falta:
- Frontend de configuracion de dashboards
- Engine de rendering de widgets
- Integracion con datos de ValorKPI

### Fase 5: Convertir `accion_correctiva_id` a FK Real

```python
# ACTUAL (int suelto):
accion_correctiva_id = models.PositiveBigIntegerField(...)

# PROPUESTO (FK real):
accion_correctiva = models.ForeignKey(
    'mejora_continua.Hallazgo',  # o NoConformidad si se crea
    on_delete=models.SET_NULL,
    null=True, blank=True,
    ...
)
```

---

## 5. Dependencias y Riesgos

### Dependencias
- Fase 1 y 2 pueden ejecutarse en paralelo
- Fase 3 depende de Fase 1 (necesita endpoints)
- Fase 4 depende de Fase 2 (necesita datos en ValorKPI)
- Fase 5 es independiente

### Riesgos
1. **HHT no existe**: Para calcular IF/IS se necesitan Horas Hombre Trabajadas, que depende del modulo `control_tiempo` (turnos/asistencia)
2. **Datos historicos**: Al activar Celery tasks solo se tendran datos hacia adelante, no retroactivos
3. **Performance**: Tasks que consultan multiples tablas deben ser eficientes (indexes, select_related)
4. **Multi-tenant**: Toda task DEBE filtrar por `empresa_id`

---

## 6. Estimacion de Esfuerzo

| Fase | Descripcion | Archivos | Complejidad |
|------|-------------|----------|-------------|
| 1 | Stats endpoints (8 modulos) | ~16 archivos | Media |
| 2 | Celery tasks (~13 KPIs) | ~3 archivos | Alta |
| 3 | Frontend hooks + connect | ~16 archivos | Baja |
| 4 | Dashboard gerencial UI | ~10 archivos | Alta |
| 5 | FK accion_correctiva | ~2 archivos + migracion | Baja |

**Total estimado: ~47 archivos nuevos/modificados**
