# Estructura de Documentación - StrateKaz ERP

Este documento describe la organización de la documentación del proyecto.

Fecha de reorganización: 23 Diciembre 2024

## Estructura de Carpetas

```
docs/
├── 00-EMPEZAR-AQUI.md              # Índice principal del proyecto
├── arquitectura/                    # Documentación técnica de arquitectura
│   ├── ANALISIS-SAAS-ARQUITECTURA.md
│   ├── DATABASE-ARCHITECTURE.md
│   ├── ESTRUCTURA-6-NIVELES-ERP.md
│   ├── INTEGRACIONES-ARQUITECTURA.md
│   └── PLAN-MIGRACION-INCREMENTAL.md
├── modulos/                         # Documentación por módulo funcional
│   ├── hseq/                        # Sistema HSEQ
│   │   ├── HSEQ_MODULES_SETUP.md
│   │   ├── INDEX_HSEQ_MODULES.md
│   │   ├── QUICK_START_HSEQ.md
│   │   └── RESUMEN_HSEQ_MODULES.md
│   ├── riesgos/                     # Motor de Riesgos
│   │   ├── MOTOR_RIESGOS_REGISTRO_COMPLETO.md
│   │   ├── RIESGO-SELECTOR-IMPLEMENTATION.md
│   │   ├── RIESGO-SELECTOR-UX-DESIGN.md
│   │   └── RIESGO-SELECTOR-VISUAL-GUIDE.md
│   ├── cumplimiento/                # Motor de Cumplimiento
│   │   └── REQUISITOS_LEGALES_FILES.md
│   ├── recepciones/                 # Módulo de Recepciones
│   │   ├── EJEMPLO-IMPLEMENTACION-RECEPCION.md
│   │   ├── RECEPCIONES-DIAGRAMS.md
│   │   ├── RECEPCIONES-MODELS.md
│   │   └── RECEPCIONES-SUMMARY.md
│   └── consecutivos/                # Sistema de Consecutivos
│       └── SISTEMA-CONSECUTIVOS-INFORME-TECNICO.md
├── desarrollo/                      # Documentación para desarrolladores
│   ├── COMPONENTES-DESIGN-SYSTEM.md
│   ├── DESIGN-SYSTEM.md
│   ├── DESIGN-SYSTEM-INDEX.md
│   ├── DOCKER.md
│   ├── DOCKER_IMPROVEMENTS_SUMMARY.md
│   ├── GUIA-INICIO-DESIGN-SYSTEM.md
│   ├── LAYOUT-COMPONENTS.md
│   ├── LUCIDE_ICONS_REFERENCE.md
│   ├── RBAC-HIBRIDO-PLAN.md
│   ├── RBAC-SYSTEM.md
│   ├── REFACTOR-CONFIGURACION-TAB.md
│   ├── RESUMEN-COMPONENTES.md
│   ├── SNIPPETS-RAPIDOS.md
│   ├── VISUAL-REFERENCE.md
│   ├── fixes/                       # Soluciones técnicas y correcciones
│   │   ├── CHANGELOG_RACE_CONDITION.md
│   │   ├── RACE_CONDITION_DIAGRAM.md
│   │   ├── RACE_CONDITION_FIX.md
│   │   └── SOLUCION_TIMEZONE.md
│   └── sesiones/                    # Registro de sesiones de desarrollo
│       └── SESSION-2025-12-13-navegacion-dinamica.md
├── planificacion/                   # Planificación y cronogramas
│   ├── CRONOGRAMA-26-SEMANAS.md
│   └── CRONOGRAMA-VISUAL.md
├── sistema-integraciones/           # Integraciones externas
│   ├── INTEGRACIONES-COMPONENTES-EJEMPLO.md
│   ├── INTEGRACIONES-EXTERNAS.md
│   ├── INTEGRACIONES-EXTERNAS-API.md
│   ├── INTEGRACION-EXTERNA-API.md
│   └── RESUMEN-INTEGRACION-EXTERNA.md
└── guias/                           # Guías de uso
    └── CLAUDE.md
```

## Archivos Principales

### 00-EMPEZAR-AQUI.md
Índice principal del proyecto. Siempre comienza aquí para entender la estructura del sistema, el estado actual y la documentación disponible.

### arquitectura/
Documentación técnica sobre la arquitectura del sistema de 6 niveles, 14 módulos y 154 tablas.

### modulos/
Documentación específica de cada módulo funcional. Organizada por subdirectorios para facilitar la navegación.

### desarrollo/
Todo lo relacionado con el desarrollo: Design System, Docker, RBAC, soluciones técnicas y sesiones de desarrollo.

### planificacion/
Cronogramas y planificación del proyecto.

### sistema-integraciones/
Documentación del sistema de integraciones con APIs externas.

### guias/
Guías de configuración y uso, incluyendo la guía de Claude Code.

## Archivos Eliminados

Los siguientes archivos fueron eliminados por ser duplicados o temporales:

- COMMIT_MESSAGE.txt
- RESUMEN.txt
- RESUMEN_FINAL_TIMEZONE.txt
- UI_VISUAL.txt
- CONFIGURACION_COMPLETADA.md
- SETUP_COMPLETO.md
- CHECKLIST_IMPLEMENTACION.md
- docs/README.md (duplicado del README principal)

## Archivos Movidos desde la Raíz

Los siguientes archivos fueron movidos desde la raíz del proyecto a /docs:

- HSEQ_MODULES_SETUP.md → docs/modulos/hseq/
- INDEX_HSEQ_MODULES.md → docs/modulos/hseq/
- QUICK_START_HSEQ.md → docs/modulos/hseq/
- RESUMEN_HSEQ_MODULES.md → docs/modulos/hseq/
- MOTOR_RIESGOS_REGISTRO_COMPLETO.md → docs/modulos/riesgos/
- REQUISITOS_LEGALES_FILES.md → docs/modulos/cumplimiento/
- LUCIDE_ICONS_REFERENCE.md → docs/desarrollo/
- DOCKER_IMPROVEMENTS_SUMMARY.md → docs/desarrollo/

## Convenciones

1. Los archivos en mayúsculas (UPPER_CASE) son documentación técnica oficial.
2. Los archivos que comienzan con números (00-, 01-) indican orden de lectura.
3. Las subcarpetas agrupan documentación por tema o módulo.
4. Los archivos temporales (.tmp, .bak, .old) no deben estar en /docs.

## Mantenimiento

Al agregar nueva documentación:

1. Ubicar el archivo en la carpeta apropiada según su propósito.
2. Actualizar el índice en 00-EMPEZAR-AQUI.md si es relevante.
3. Usar nombres descriptivos en UPPER_CASE para archivos principales.
4. Mantener la estructura de carpetas limpia y organizada.

## Navegación Rápida

- **Quiero entender el proyecto**: Leer `00-EMPEZAR-AQUI.md`
- **Arquitectura del sistema**: Ver `arquitectura/ESTRUCTURA-6-NIVELES-ERP.md`
- **Base de datos**: Ver `arquitectura/DATABASE-ARCHITECTURE.md`
- **Implementar nuevo módulo**: Ver sección "GUÍA DE IMPLEMENTACIÓN" en `00-EMPEZAR-AQUI.md`
- **Design System**: Ver `desarrollo/DESIGN-SYSTEM.md`
- **Configurar Docker**: Ver `desarrollo/DOCKER.md`
- **Sistema RBAC**: Ver `desarrollo/RBAC-SYSTEM.md`
- **Configurar Claude Code**: Ver `guias/CLAUDE.md`
- **Módulo HSEQ**: Ver `modulos/hseq/INDEX_HSEQ_MODULES.md`
- **Motor de Riesgos**: Ver `modulos/riesgos/MOTOR_RIESGOS_REGISTRO_COMPLETO.md`

---

Última actualización: 23 Diciembre 2024
