# Módulo HSEQ Management

Sistema Integrado de Gestión HSEQ (Health, Safety, Environment, Quality)

## Descripción

Este módulo implementa un sistema integral de gestión HSEQ basado en las normas internacionales:

- **ISO 9001**: Sistema de Gestión de Calidad
- **ISO 14001**: Sistema de Gestión Ambiental
- **ISO 45001**: Sistema de Gestión de Seguridad y Salud Ocupacional
- **Decreto 1072/2015**: Sistema de Gestión de Seguridad y Salud en el Trabajo (Colombia)

## Estructura de Carpetas

```
frontend/src/features/hseq/
├── pages/
│   ├── HSEQPage.tsx                    # Página principal con tarjetas de selección
│   ├── SistemaDocumentalPage.tsx       # Control de documentos y registros
│   ├── PlanificacionSistemaPage.tsx    # Política, objetivos e indicadores
│   ├── CalidadPage.tsx                 # ISO 9001 - Gestión de Calidad
│   ├── MedicinaLaboralPage.tsx         # Salud ocupacional
│   ├── SeguridadIndustrialPage.tsx     # Seguridad en el trabajo
│   ├── HigieneIndustrialPage.tsx       # Higiene ocupacional
│   ├── GestionComitesPage.tsx          # COPASST, Convivencia, Brigadas
│   ├── AccidentalidadPage.tsx          # Incidentes y accidentes
│   ├── EmergenciasPage.tsx             # Plan de emergencias
│   ├── GestionAmbientalPage.tsx        # ISO 14001 - Gestión Ambiental
│   └── MejoraContinuaPage.tsx          # Ciclo PHVA
└── index.ts                            # Exportaciones del módulo
```

## Módulos Implementados

### 1. Sistema Documental
**Ruta**: `/hseq/sistema-documental`

Gestión del sistema documental HSEQ:
- Control de documentos
- Gestión de registros
- Control de versiones
- Aprobaciones y distribución

### 2. Planificación del Sistema
**Ruta**: `/hseq/planificacion`

Planificación estratégica del sistema:
- Política integrada HSEQ
- Objetivos estratégicos
- Indicadores de gestión
- Plan de trabajo anual

### 3. Gestión de Calidad (ISO 9001)
**Ruta**: `/hseq/calidad`

Sistema de Gestión de Calidad:
- No conformidades
- Auditorías internas
- Acciones correctivas
- Mejora continua

### 4. Medicina Laboral
**Ruta**: `/hseq/medicina-laboral`

Gestión de salud ocupacional:
- Exámenes médicos ocupacionales
- Historia clínica laboral
- Vigilancia epidemiológica
- Restricciones médicas

### 5. Seguridad Industrial
**Ruta**: `/hseq/seguridad-industrial`

Gestión de seguridad en el trabajo:
- Inspecciones de seguridad
- EPP (Elementos de Protección Personal)
- Permisos de trabajo
- Señalización

### 6. Higiene Industrial
**Ruta**: `/hseq/higiene-industrial`

Gestión de higiene ocupacional:
- Mediciones de agentes físicos
- Evaluación de agentes químicos
- Monitoreo biológico
- Controles ambientales

### 7. Gestión de Comités
**Ruta**: `/hseq/comites`

Administración de comités HSEQ:
- COPASST
- Comité de Convivencia
- Brigada de Emergencias
- Actas y asistencias

### 8. Accidentalidad
**Ruta**: `/hseq/accidentalidad`

Gestión de incidentes y accidentes:
- Reporte de incidentes
- Investigación de accidentes
- Indicadores de accidentalidad
- Análisis de tendencias

### 9. Emergencias
**Ruta**: `/hseq/emergencias`

Plan de prevención y respuesta ante emergencias:
- Plan de emergencias
- Brigada de emergencias
- Simulacros
- Recursos para emergencias

### 10. Gestión Ambiental (ISO 14001)
**Ruta**: `/hseq/gestion-ambiental`

Sistema de Gestión Ambiental:
- Aspectos e impactos ambientales
- Programas ambientales
- Requisitos legales ambientales
- Monitoreo ambiental

### 11. Mejora Continua
**Ruta**: `/hseq/mejora-continua`

Ciclo de mejora continua (PHVA):
- Acciones correctivas
- Acciones preventivas
- Lecciones aprendidas
- Mejoras implementadas

## Rutas Configuradas

Todas las rutas están configuradas en `frontend/src/routes/index.tsx`:

```typescript
// Ruta principal - Redirige al dashboard
/hseq → /hseq/dashboard

// Rutas de módulos
/hseq/dashboard              → HSEQPage (página principal con tarjetas)
/hseq/sistema-documental     → SistemaDocumentalPage
/hseq/planificacion          → PlanificacionSistemaPage
/hseq/calidad                → CalidadPage
/hseq/medicina-laboral       → MedicinaLaboralPage
/hseq/seguridad-industrial   → SeguridadIndustrialPage
/hseq/higiene-industrial     → HigieneIndustrialPage
/hseq/comites                → GestionComitesPage
/hseq/accidentalidad         → AccidentalidadPage
/hseq/emergencias            → EmergenciasPage
/hseq/gestion-ambiental      → GestionAmbientalPage
/hseq/mejora-continua        → MejoraContinuaPage
```

## Diseño de Interfaz

Todas las páginas siguen un patrón consistente:

1. **Header**: Título y descripción del módulo
2. **Hero Section**: Banner con icono, mensaje "Módulo en desarrollo" y branding
3. **Funcionalidades Planeadas**: Grid de 3 cards explicando las funcionalidades futuras

### Página Principal (HSEQPage)

La página principal utiliza `SelectionCard` con efectos visuales avanzados:
- 11 tarjetas de selección con iconos
- Gradientes y efectos glass
- Hover con animaciones parallax
- Colores diferenciados por categoría

## Paleta de Colores por Módulo

- **Azul**: Sistema Documental, Higiene Industrial
- **Púrpura**: Planificación, Comités, Mejora Continua
- **Verde**: Calidad, Gestión Ambiental
- **Naranja**: Medicina Laboral, Seguridad Industrial, Accidentalidad, Emergencias

## Estado Actual

Todas las páginas están en estado **placeholder** (módulo en desarrollo).

Cada página muestra:
- Mensaje claro de "Módulo en Desarrollo"
- Descripción de funcionalidades planeadas
- Diseño visual consistente con el resto del sistema

## Próximos Pasos

Para implementar cada módulo:

1. Crear modelos de datos en el backend
2. Implementar APIs REST
3. Crear hooks personalizados (`hooks/`)
4. Desarrollar componentes específicos (`components/`)
5. Implementar formularios y tablas
6. Agregar lógica de negocio

## Componentes Reutilizables

El módulo utiliza componentes del sistema de diseño:

- `PageHeader`: Encabezado de página
- `SelectionCard`: Tarjetas de selección con efectos
- `SelectionCardGrid`: Grid responsivo para tarjetas
- Iconos de `lucide-react`

## Normatividad Aplicable

- ISO 9001:2015 - Sistemas de gestión de la calidad
- ISO 14001:2015 - Sistemas de gestión ambiental
- ISO 45001:2018 - Sistemas de gestión de la seguridad y salud en el trabajo
- Decreto 1072 de 2015 (Colombia) - Decreto Único Reglamentario del Sector Trabajo
- Resolución 0312 de 2019 (Colombia) - Estándares Mínimos del SG-SST

## Notas de Desarrollo

- Todas las páginas son TypeScript funcionales (React FC)
- Se usa Tailwind CSS para estilos
- Dark mode soportado en todos los componentes
- Accesibilidad considerada (aria-labels, roles)
- Responsive design (mobile-first)
