# Guía de Actualización de Documentación

> **Para Agentes/IA:** Esta guía define qué documentos actualizar según el tipo de cambio realizado.

## Principio Fundamental

**El README.md es solo una tarjeta de presentación.** La documentación detallada vive en `/docs`.

Cuando se solicite "actualizar el README" o "actualizar la documentación", seguir esta guía para identificar qué documentos específicos deben actualizarse.

---

## Mapa de Documentos por Área

### Cambios de Arquitectura/Módulos

| Cambio | Documentos a Actualizar |
|--------|-------------------------|
| Nuevo módulo/app | `docs/arquitectura/CATALOGO-MODULOS.md`, `docs/planificacion/CRONOGRAMA-26-SEMANAS.md` |
| Cambio de estado de módulo | `docs/arquitectura/CATALOGO-MODULOS.md`, `README.md` (solo diagrama) |
| Nueva app Django | `docs/arquitectura/DATABASE-ARCHITECTURE.md` |
| Cambio en arquitectura 6 niveles | `docs/arquitectura/CATALOGO-MODULOS.md`, `README.md` (diagrama) |

### Cambios de Backend

| Cambio | Documentos a Actualizar |
|--------|-------------------------|
| Nuevo abstract model | `docs/desarrollo/CODIGO-REUTILIZABLE.md` |
| Nuevo mixin/viewset | `docs/desarrollo/CODIGO-REUTILIZABLE.md` |
| Cambio en sistema dinámico | `docs/desarrollo/ARQUITECTURA-DINAMICA.md` |
| Cambio en navegación | `docs/desarrollo/NAVEGACION-DINAMICA.md` |
| Cambio en autenticación | `docs/desarrollo/AUTENTICACION.md` |
| Cambio en logging | `docs/desarrollo/LOGGING.md` |
| Nuevo endpoint RBAC | `docs/desarrollo/RBAC-SYSTEM.md` |
| Cambio en branding | `docs/desarrollo/BRANDING-DINAMICO.md` |

### Cambios de Frontend

| Cambio | Documentos a Actualizar |
|--------|-------------------------|
| Nuevo componente UI | `docs/DESIGN-SYSTEM.md` |
| Nuevo hook reutilizable | `docs/desarrollo/CODIGO-REUTILIZABLE.md` |
| Cambio en navegación | `docs/desarrollo/NAVEGACION-DINAMICA.md` |
| Cambio en branding UI | `docs/desarrollo/BRANDING-DINAMICO.md` |

### Cambios de DevOps

| Cambio | Documentos a Actualizar |
|--------|-------------------------|
| Nuevo workflow CI/CD | `docs/devops/CI-CD.md` |
| Cambio en backups | `docs/devops/BACKUPS.md` |
| Cambio en deployment | `docs/devops/DESPLIEGUE.md` |
| Cambio en Docker | `docs/devops/CI-CD.md` o crear `docs/devops/DOCKER.md` |

### Cambios de Testing

| Cambio | Documentos a Actualizar |
|--------|-------------------------|
| Nueva suite de tests | `docs/desarrollo/TESTING.md` |
| Cambio en coverage | `docs/desarrollo/TESTING.md` |
| Nuevo story Storybook | `docs/desarrollo/TESTING.md` |

### Cambios de Planificación

| Cambio | Documentos a Actualizar |
|--------|-------------------------|
| Semana completada | `docs/planificacion/CRONOGRAMA-26-SEMANAS.md`, `README.md` (versión/fecha) |
| Cambio de prioridades | `docs/planificacion/CRONOGRAMA-26-SEMANAS.md` |
| Nuevo milestone | `docs/planificacion/CRONOGRAMA-26-SEMANAS.md` |

---

## Cuándo Actualizar el README.md

El README **solo** debe actualizarse cuando cambian:

1. **Versión del proyecto** (header)
2. **Fecha de última actualización** (header)
3. **Estado de niveles/módulos** (diagrama de arquitectura)
4. **Stack tecnológico** (nuevas tecnologías principales)
5. **Estructura de directorios** (cambios significativos)
6. **Links a documentación** (nuevos docs importantes)

### NO Actualizar README Para:

- Detalles de implementación → usar docs específico
- Ejemplos de código extensos → usar docs específico
- Guías paso a paso → usar docs específico
- Configuraciones detalladas → usar docs específico

---

## Flujo de Actualización

### Al Completar una Funcionalidad

```
1. Identificar el tipo de cambio
2. Consultar tabla de mapeo arriba
3. Actualizar documento(s) específico(s)
4. Si cambió estado de módulo → actualizar CATALOGO-MODULOS.md
5. Si completó semana → actualizar CRONOGRAMA-26-SEMANAS.md
6. Si cambió algo visible en README → actualizar README.md
```

### Al Completar una Semana del Cronograma

```
1. Actualizar docs/planificacion/CRONOGRAMA-26-SEMANAS.md
   - Marcar tareas completadas
   - Actualizar porcentaje de avance
   - Agregar notas de la semana

2. Actualizar docs/arquitectura/CATALOGO-MODULOS.md
   - Cambiar estados de módulos (🔜 → ✅)
   - Agregar nuevos tabs/secciones

3. Actualizar README.md
   - Versión: incrementar (ej: 2.0.0-alpha.6 → 2.0.0-alpha.7)
   - Fecha: actualizar a fecha actual
   - Diagrama: solo si cambió estado de nivel
```

---

## Estructura de Documentación

```
docs/
├── 00-EMPEZAR-AQUI.md              # Onboarding nuevos desarrolladores
├── GUIA-ACTUALIZACION-DOCS.md      # Esta guía
├── DESIGN-SYSTEM.md                # Componentes UI
│
├── arquitectura/
│   ├── CATALOGO-MODULOS.md         # 6 niveles, 14 módulos
│   └── DATABASE-ARCHITECTURE.md    # 154 tablas
│
├── desarrollo/
│   ├── ARQUITECTURA-DINAMICA.md    # Sistema 100% dinámico
│   ├── CODIGO-REUTILIZABLE.md      # Abstract models, hooks
│   ├── NAVEGACION-DINAMICA.md      # Sistema de navegación
│   ├── RBAC-SYSTEM.md              # Roles y permisos
│   ├── AUTENTICACION.md            # JWT
│   ├── BRANDING-DINAMICO.md        # Logos, colores
│   ├── LOGGING.md                  # Sistema de logs
│   ├── TESTING.md                  # pytest, vitest
│   ├── POLITICAS-DESARROLLO.md     # Convenciones
│   └── sesiones/                   # Logs de sesiones de desarrollo
│
├── devops/
│   ├── CI-CD.md                    # GitHub Actions
│   ├── BACKUPS.md                  # Sistema de backups
│   └── DESPLIEGUE.md               # Staging, producción
│
├── usuarios/
│   └── CONFIGURACION-MARCA.md      # Guía no técnica
│
├── planificacion/
│   └── CRONOGRAMA-26-SEMANAS.md    # Plan de desarrollo
│
└── guias/
    └── CLAUDE.md                   # Guía para IA/desarrolladores
```

---

## Instrucciones para Agentes

### Cuando el Usuario Dice:

| Solicitud | Acción |
|-----------|--------|
| "Actualiza el README" | Consultar esta guía, actualizar docs específicos |
| "Actualiza la documentación" | Identificar qué cambió, actualizar docs correspondientes |
| "Documenta lo que hicimos" | Crear entrada en `docs/desarrollo/sesiones/` |
| "Actualiza el cronograma" | Actualizar `docs/planificacion/CRONOGRAMA-26-SEMANAS.md` |
| "Marca la semana como completada" | Seguir flujo "Al Completar una Semana" |

### Checklist Post-Implementación

```markdown
## Documentación Actualizada
- [ ] Documento específico del área (ver mapeo)
- [ ] CATALOGO-MODULOS.md (si cambió estado de módulo)
- [ ] CRONOGRAMA-26-SEMANAS.md (si completó tarea planificada)
- [ ] README.md (solo versión/fecha si aplica)
```

---

## Ejemplo de Actualización

### Escenario: Se completó el módulo de Revisión por Dirección

**Documentos a actualizar:**

1. **docs/arquitectura/CATALOGO-MODULOS.md**
   - Agregar "Revisión Dirección" a tabs de gestion_estrategica
   - Marcar como ✅ Completo

2. **docs/planificacion/CRONOGRAMA-26-SEMANAS.md**
   - Marcar tareas de Semana 6 como completadas
   - Actualizar porcentaje: "Nivel 1: 100%"

3. **README.md**
   - Versión: `2.0.0-alpha.6`
   - Fecha: `24 Diciembre 2025 (Semana 6)`
   - Estado: `Nivel 1 Completo`

**NO actualizar en README:**
- Detalles de implementación de Revisión Dirección
- Endpoints de la API
- Ejemplos de código

---

## Mantenimiento de Esta Guía

Esta guía debe actualizarse cuando:
- Se crea un nuevo documento en `/docs`
- Se reorganiza la estructura de documentación
- Se agregan nuevas áreas de funcionalidad

**Última actualización:** 24 Diciembre 2025
