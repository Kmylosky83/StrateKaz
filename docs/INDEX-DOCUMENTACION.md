# Indice Maestro de Documentacion

**StrateKaz v3.3.0** | **Actualizado:** 15 Enero 2026

---

## Como usar este indice

1. **Nuevo en el proyecto?** Empieza por la seccion [Inicio Rapido](#inicio-rapido)
2. **Vas a desplegar?** Ve directo a [Despliegue](#despliegue)
3. **Vas a desarrollar?** Consulta [Desarrollo](#desarrollo)
4. **Buscas algo especifico?** Usa Ctrl+F

---

## Inicio Rapido

| Documento | Descripcion | Cuando leer |
|-----------|-------------|-------------|
| [README.md](../README.md) | Vision general del proyecto | Primero que todo |
| [00-EMPEZAR-AQUI.md](00-EMPEZAR-AQUI.md) | Punto de entrada documentacion | Despues del README |
| [ESTRUCTURA-6-NIVELES-ERP.md](arquitectura/ESTRUCTURA-6-NIVELES-ERP.md) | Arquitectura del sistema | Para entender la estructura |

---

## Despliegue

### Guias de Despliegue

| Documento | Descripcion | Nivel |
|-----------|-------------|-------|
| **[DESPLIEGUE-PASO-A-PASO.md](DESPLIEGUE-PASO-A-PASO.md)** | Guia simplificada para no-tecnicos | Principiante |
| [GUIA-DESPLIEGUE-CPANEL.md](devops/GUIA-DESPLIEGUE-CPANEL.md) | Guia tecnica completa cPanel | Intermedio |
| [CPANEL_EXECUTIVE_SUMMARY.md](devops/CPANEL_EXECUTIVE_SUMMARY.md) | Resumen arquitectura despliegue | Referencia |
| [GUIA-MULTI-INSTANCIA.md](devops/GUIA-MULTI-INSTANCIA.md) | Multiples empresas en un hosting | Avanzado |

### Flujo de Despliegue

```
1. DESPLIEGUE-PASO-A-PASO.md    (seguir paso a paso)
          |
          v
2. Verificar que todo funciona
          |
          v
3. PLAN_INTERVENCION_BRECHAS.md (ver que sigue despues)
```

---

## Planes y Roadmap

### Estado Actual del Proyecto

| Documento | Descripcion | Estado |
|-----------|-------------|--------|
| **[PLAN_INTERVENCION_BRECHAS.md](plans/PLAN_INTERVENCION_BRECHAS.md)** | Plan maestro de mejoras | ACTIVO |
| [AUDITORIA_FUNCIONAL_STRATEKAZ.md](plans/AUDITORIA_FUNCIONAL_STRATEKAZ.md) | Auditoria completa del sistema | Referencia |
| [PLAN_CIERRE_BRECHAS.md](plans/PLAN_CIERRE_BRECHAS.md) | Plan tecnico original | Historico |

### Proximos Pasos (Post-Despliegue)

Despues de desplegar exitosamente, seguir este orden:

| Fase | Documento | Que hacer |
|------|-----------|-----------|
| **FASE 0** | [PLAN_INTERVENCION_BRECHAS.md](plans/PLAN_INTERVENCION_BRECHAS.md) | Reorganizacion N1 |
| FASE 1 | Mismo documento | Modulos diferidos |
| FASE 2+ | Mismo documento | Integraciones y mejoras |

---

## Arquitectura

### Documentos Core

| Documento | Descripcion |
|-----------|-------------|
| [CATALOGO-MODULOS.md](arquitectura/CATALOGO-MODULOS.md) | 14 modulos, 81 apps detallados |
| [DATABASE-ARCHITECTURE.md](arquitectura/DATABASE-ARCHITECTURE.md) | 240+ tablas documentadas |
| [DIAGRAMA-ER.md](arquitectura/DIAGRAMA-ER.md) | Diagrama Entidad-Relacion |
| [ESTRUCTURA-6-NIVELES-ERP.md](arquitectura/ESTRUCTURA-6-NIVELES-ERP.md) | Los 6 niveles del ERP |

### Reorganizacion N1 (En Progreso)

| Documento | Descripcion |
|-----------|-------------|
| [INDEX_REORGANIZACION_N1.md](INDEX_REORGANIZACION_N1.md) | Indice de reorganizacion |
| [ANALISIS_ARQUITECTONICO_N1_REORGANIZACION.md](ANALISIS_ARQUITECTONICO_N1_REORGANIZACION.md) | Analisis detallado |
| [MATRIZ_IMPACTO_REORGANIZACION_N1.md](MATRIZ_IMPACTO_REORGANIZACION_N1.md) | Impacto de cambios |
| [SCRIPTS_MIGRACION_N1.md](SCRIPTS_MIGRACION_N1.md) | Scripts de migracion |

---

## Desarrollo

### Guias Esenciales

| Documento | Descripcion | Prioridad |
|-----------|-------------|-----------|
| [ARQUITECTURA-DINAMICA.md](desarrollo/ARQUITECTURA-DINAMICA.md) | Sistema 100% dinamico | Alta |
| [CODIGO-REUTILIZABLE.md](desarrollo/CODIGO-REUTILIZABLE.md) | Mixins, hooks, utilidades | Alta |
| [RBAC-SYSTEM.md](desarrollo/RBAC-SYSTEM.md) | Sistema de permisos | Alta |
| [POLITICAS-DESARROLLO.md](desarrollo/POLITICAS-DESARROLLO.md) | Convenciones de codigo | Alta |

### Frontend

| Documento | Descripcion |
|-----------|-------------|
| [DESIGN-SYSTEM.md](desarrollo/DESIGN-SYSTEM.md) | Sistema de diseno |
| [NAVEGACION-DINAMICA.md](desarrollo/NAVEGACION-DINAMICA.md) | Menu dinamico |
| [LAYOUT-COMPONENTS.md](desarrollo/LAYOUT-COMPONENTS.md) | Componentes de layout |
| [PATRONES-FRONTEND-HSEQ.md](desarrollo/PATRONES-FRONTEND-HSEQ.md) | Patrones de UI |
| [GUIA-CREACION-HOOKS.md](desarrollo/GUIA-CREACION-HOOKS.md) | Como crear hooks |
| [POLITICAS-REACT-QUERY.md](desarrollo/POLITICAS-REACT-QUERY.md) | Manejo de estado |

### Backend

| Documento | Descripcion |
|-----------|-------------|
| [AUTENTICACION.md](desarrollo/AUTENTICACION.md) | Sistema JWT |
| [LOGGING.md](desarrollo/LOGGING.md) | Sistema de logs |
| [TESTING.md](desarrollo/TESTING.md) | pytest, coverage |
| [CONVENCIONES-NOMENCLATURA.md](desarrollo/CONVENCIONES-NOMENCLATURA.md) | Nombres de archivos |

### Workflows y Firmas

| Documento | Descripcion |
|-----------|-------------|
| [GUIA-IMPLEMENTACION-FIRMA-DIGITAL.md](desarrollo/GUIA-IMPLEMENTACION-FIRMA-DIGITAL.md) | Firmas digitales |
| [WORKFLOW-FIRMAS-POLITICAS.md](desarrollo/WORKFLOW-FIRMAS-POLITICAS.md) | Flujo de firmas |
| [WORKFLOW-FIRMAS-FRONTEND-GUIDE.md](desarrollo/WORKFLOW-FIRMAS-FRONTEND-GUIDE.md) | UI de firmas |

### Herramientas

| Documento | Descripcion |
|-----------|-------------|
| [SNIPPETS-RAPIDOS.md](desarrollo/SNIPPETS-RAPIDOS.md) | Codigo util |
| [PLANTILLAS-CODIGO-HSEQ.md](desarrollo/PLANTILLAS-CODIGO-HSEQ.md) | Templates |
| [LUCIDE_ICONS_REFERENCE.md](desarrollo/LUCIDE_ICONS_REFERENCE.md) | Referencia iconos |

---

## APIs y Endpoints

| Documento | Descripcion |
|-----------|-------------|
| [API-COMPRAS-ENDPOINTS.md](desarrollo/API-COMPRAS-ENDPOINTS.md) | API de compras |
| [API-TESORERIA-ENDPOINTS.md](desarrollo/API-TESORERIA-ENDPOINTS.md) | API de tesoreria |
| [INTEGRACION-EXTERNA-API.md](sistema-integraciones/INTEGRACION-EXTERNA-API.md) | Integraciones |

---

## DevOps

| Documento | Descripcion |
|-----------|-------------|
| [DOCKER.md](desarrollo/DOCKER.md) | Contenedores |
| [GITHUB-ACTIONS.md](desarrollo/GITHUB-ACTIONS.md) | CI/CD |
| [CELERY_QUICKSTART.md](desarrollo/celery/CELERY_QUICKSTART.md) | Tareas async |
| [REDIS-CELERY-GUIDE.md](desarrollo/celery/REDIS-CELERY-GUIDE.md) | Redis + Celery |

---

## Modulos Especificos

### Motor de Riesgos

| Documento | Descripcion |
|-----------|-------------|
| [RIESGO-SELECTOR-IMPLEMENTATION.md](modulos/riesgos/RIESGO-SELECTOR-IMPLEMENTATION.md) | Implementacion |
| [RIESGO-SELECTOR-UX-DESIGN.md](modulos/riesgos/RIESGO-SELECTOR-UX-DESIGN.md) | Diseno UX |
| [RIESGO-SELECTOR-VISUAL-GUIDE.md](modulos/riesgos/RIESGO-SELECTOR-VISUAL-GUIDE.md) | Guia visual |

### Identidad Corporativa

| Documento | Descripcion |
|-----------|-------------|
| [IDENTIDAD-CORPORATIVA-DOCUMENTACION-COMPLETA.md](desarrollo/IDENTIDAD-CORPORATIVA-DOCUMENTACION-COMPLETA.md) | Documentacion completa |
| [BRANDING-DINAMICO.md](desarrollo/BRANDING-DINAMICO.md) | Logos y colores |
| [CONFIGURACION-MARCA.md](usuarios/CONFIGURACION-MARCA.md) | Guia para usuarios |

---

## Auditorias Tecnicas

| Documento | Area |
|-----------|------|
| [AUDITORIA_BACKEND_ARCHITECTURE.md](plans/AUDITORIA_BACKEND_ARCHITECTURE.md) | Backend |
| [AUDITORIA_FRONTEND_ARCHITECTURE.md](plans/AUDITORIA_FRONTEND_ARCHITECTURE.md) | Frontend |
| [AUDITORIA_DATA_ARCHITECTURE.md](plans/AUDITORIA_DATA_ARCHITECTURE.md) | Base de datos |
| [AUDITORIA_SECURITY_PERMISSIONS.md](plans/AUDITORIA_SECURITY_PERMISSIONS.md) | Seguridad |
| [AUDITORIA_DEVOPS_DEPLOYMENT.md](plans/AUDITORIA_DEVOPS_DEPLOYMENT.md) | DevOps |
| [AUDITORIA_CODE_QUALITY.md](plans/AUDITORIA_CODE_QUALITY.md) | Calidad codigo |
| [AUDITORIA_TESTING.md](plans/AUDITORIA_TESTING.md) | Testing |

---

## Estructura de Carpetas

```
docs/
├── INDEX-DOCUMENTACION.md          <- ESTE ARCHIVO
├── DESPLIEGUE-PASO-A-PASO.md      <- Guia simplificada
├── 00-EMPEZAR-AQUI.md             <- Punto de entrada
├── GUIA-ACTUALIZACION-DOCS.md     <- Como actualizar docs
│
├── arquitectura/                   <- Diagramas y catalogo
│   ├── CATALOGO-MODULOS.md
│   ├── DATABASE-ARCHITECTURE.md
│   └── ESTRUCTURA-6-NIVELES-ERP.md
│
├── desarrollo/                     <- Guias tecnicas
│   ├── ARQUITECTURA-DINAMICA.md
│   ├── RBAC-SYSTEM.md
│   ├── celery/                    <- Redis/Celery
│   └── ...
│
├── devops/                         <- Despliegue
│   ├── GUIA-DESPLIEGUE-CPANEL.md
│   ├── GUIA-MULTI-INSTANCIA.md
│   └── ...
│
├── plans/                          <- Planes y auditorias
│   ├── PLAN_INTERVENCION_BRECHAS.md  <- PLAN ACTIVO
│   ├── AUDITORIA_*.md
│   └── ...
│
├── modulos/                        <- Docs por modulo
│   └── riesgos/
│
├── sistema-integraciones/          <- APIs externas
│
└── usuarios/                       <- Docs para usuarios
    └── CONFIGURACION-MARCA.md
```

---

## Flujo de Trabajo Recomendado

### Para Despliegue Inicial

```
README.md
    |
    v
DESPLIEGUE-PASO-A-PASO.md
    |
    v
(Sistema funcionando en produccion)
    |
    v
PLAN_INTERVENCION_BRECHAS.md
    |
    v
(Continuar desarrollo segun plan)
```

### Para Desarrollo Continuo

```
PLAN_INTERVENCION_BRECHAS.md (ver que sigue)
    |
    v
Documentos relevantes de desarrollo/
    |
    v
Implementar cambios
    |
    v
Actualizar PLAN_INTERVENCION_BRECHAS.md
```

---

## Contacto y Soporte

- **Email:** soporte@stratekaz.com
- **Web:** https://stratekaz.com
- **Repositorio:** GitHub (privado)

---

**Ultima actualizacion:** 15 Enero 2026
**Mantenido por:** Equipo StrateKaz
