# Gestion HSEQ — Modulo C2

**Capa:** C2 (Operaciones) | **Grupo visual:** NIVEL_OPS | **Color:** `#10B981`

> Modulo mas grande del sistema. Anteriormente incluia "Calidad" — ahora migrado a Sistema de Gestion.

## Sub-apps (9)

| Sub-app | App label | Proposito |
|---------|-----------|-----------|
| accidentalidad | `hseq_management_accidentalidad` | Reporte AT/EL, investigacion, FURAT, indicadores |
| seguridad_industrial | `hseq_management_seguridad_industrial` | Inspecciones, EPP, permisos de trabajo, ATS |
| higiene_industrial | `hseq_management_higiene_industrial` | Mediciones ambientales, agentes de riesgo |
| medicina_laboral | `hseq_management_medicina_laboral` | Examenes medicos, vigilancia epidemiologica, PVE |
| emergencias | `hseq_management_emergencias` | Plan de emergencias, brigadas, simulacros |
| gestion_ambiental | `hseq_management_gestion_ambiental` | Aspectos ambientales, residuos, vertimientos |
| gestion_comites | `hseq_management_gestion_comites` | COPASST, Convivencia, Brigadas — actas, reuniones |
| mejora_continua | `hseq_management_mejora_continua` | Acciones correctivas/preventivas, no conformidades |
| calidad | (migrado) | **Migrado a sistema_gestion.** API: `/api/hseq/calidad/` |

## Modelos: 72

## Backend
- **Path:** `backend/apps/hseq_management/`
- **API prefix:** `/api/hseq/`

## Frontend
- **Feature:** `frontend/src/features/hseq/`
- **Ruta:** `/hseq`

## Regulaciones colombianas
- SG-SST: Decreto 1072 de 2015 (Libro 2, Parte 2, Titulo 4, Capitulo 6)
- Resolucion 0312 de 2019 (estandares minimos)
- Resolucion 1401 de 2007 (investigacion de AT)
- Resolucion 2400 de 1979 (higiene y seguridad industrial)

## Dependencias cross-module
- Lee de: talent_hub (colaboradores, cargos), motor_riesgos (IPEVR, aspectos ambientales)
- Alimenta: analytics (indicadores SST), workflow_engine (flujos de aprobacion)

## Estado
Backend funcional. Frontend con accidentalidad, inspecciones, EPP, comites implementados.

---
> Documentacion skeleton. Expandir al desarrollar el modulo.
