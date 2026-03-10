# Analytics — Modulo C3

**Capa:** C3 (Inteligencia) | **Grupo visual:** NIVEL_C3 | **Color:** `#8B5CF6`

> C3 SOLO LEE de C2 — nunca modifica datos de otros modulos.

## Sub-apps (7)

| Sub-app | App label | Proposito |
|---------|-----------|-----------|
| config_indicadores | `analytics_config_indicadores` | Definicion de KPIs, metas, umbrales |
| indicadores_area | `analytics_indicadores_area` | KPIs por area/proceso, mediciones periodicas |
| acciones_indicador | `analytics_acciones_indicador` | Planes de accion ante desviaciones de KPI |
| dashboard_gerencial | `analytics_dashboard_gerencial` | Dashboards ejecutivos, widgets configurables |
| generador_informes | `analytics_generador_informes` | Informes automaticos, plantillas, programacion |
| analisis_tendencias | `analytics_analisis_tendencias` | Analisis historico, proyecciones, comparativos |
| exportacion_integracion | `analytics_exportacion_integracion` | Exportacion de datos, integracion BI externo |

## Modelos: 23

## Backend
- **Path:** `backend/apps/analytics/`
- **API prefix:** `/api/analytics/`

## Frontend
- **Feature:** `frontend/src/features/analytics/`
- **Ruta:** `/analytics`

## Dependencias cross-module
- Lee de: TODOS los modulos C2 (via API endpoints)
- Escribe en: Ninguno (solo lectura)

## Estado
Esqueleto backend creado. Frontend con KPIs y dashboard basico implementados.

---
> Documentacion skeleton. Expandir al desarrollar el modulo.
