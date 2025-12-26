# Punto de Entrada - Documentación del Proyecto

## Bienvenida

Documentación del **SGI Grasas y Huesos del Norte** - Sistema de Gestión Integral para recolección y procesamiento de materias primas.

| Info | Valor |
|------|-------|
| **Versión** | 2.0.0-alpha.8 |
| **Estado** | Nivel 2 en Progreso - Motor Cumplimiento |
| **Última Actualización** | 25 Diciembre 2025 |

> **PRINCIPIO FUNDAMENTAL:** Este sistema es **100% dinámico desde la base de datos**. NO se permite hardcoding.

---

## Navegación Rápida

### Para Nuevos Desarrolladores

1. Leer este documento
2. Revisar [README.md](../README.md) para quick start
3. Consultar [ARQUITECTURA-DINAMICA.md](desarrollo/ARQUITECTURA-DINAMICA.md)
4. Ver [CRONOGRAMA-26-SEMANAS.md](planificacion/CRONOGRAMA-26-SEMANAS.md)

### Para Actualizar Documentación

Seguir la guía: [GUIA-ACTUALIZACION-DOCS.md](GUIA-ACTUALIZACION-DOCS.md)

---

## Arquitectura del Sistema

### 6 Niveles, 14 Módulos

| Nivel | Módulos | Estado |
|-------|---------|--------|
| **1. Estratégico** | gestion_estrategica | ✅ Completo |
| **2. Cumplimiento** | motor_cumplimiento, motor_riesgos, workflow_engine | ⚙️ En Progreso |
| **3. Torre Control** | hseq_management | ✅ Backend |
| **4. Cadena Valor** | supply_chain, production_ops, logistics_fleet, sales_crm | ⚠️ Legacy |
| **5. Habilitadores** | talent_hub, admin_finance, accounting | 🔜 Próximo |
| **6. Inteligencia** | analytics, audit_system | 🔜 Próximo |

Ver detalle: [arquitectura/CATALOGO-MODULOS.md](arquitectura/CATALOGO-MODULOS.md)

---

## Índice de Documentación

### Documentos Prioritarios

| Documento | Descripción | Cuándo Leer |
|-----------|-------------|-------------|
| [GUIA-ACTUALIZACION-DOCS.md](GUIA-ACTUALIZACION-DOCS.md) | Qué documentos actualizar según cambios | Al modificar funcionalidades |
| [CRONOGRAMA-26-SEMANAS.md](planificacion/CRONOGRAMA-26-SEMANAS.md) | Plan de desarrollo semanal | Para planificación |
| [REFACTORING-PLAN.md](desarrollo/REFACTORING-PLAN.md) | Código reutilizable y refactoring | Antes de escribir código |

### Por Categoría

#### Arquitectura (`arquitectura/`)

| Documento | Descripción |
|-----------|-------------|
| [CATALOGO-MODULOS.md](arquitectura/CATALOGO-MODULOS.md) | 6 niveles, 14 módulos detallados |
| [DATABASE-ARCHITECTURE.md](arquitectura/DATABASE-ARCHITECTURE.md) | 154 tablas documentadas |
| [DIAGRAMA-ER.md](arquitectura/DIAGRAMA-ER.md) | Diagrama Entidad-Relación |
| [ESTRUCTURA-6-NIVELES-ERP.md](arquitectura/ESTRUCTURA-6-NIVELES-ERP.md) | Descripción de niveles |

#### Desarrollo (`desarrollo/`)

| Documento | Descripción |
|-----------|-------------|
| [ARQUITECTURA-DINAMICA.md](desarrollo/ARQUITECTURA-DINAMICA.md) | Sistema 100% dinámico |
| [CODIGO-REUTILIZABLE.md](desarrollo/CODIGO-REUTILIZABLE.md) | Abstract models, mixins, hooks |
| [NAVEGACION-DINAMICA.md](desarrollo/NAVEGACION-DINAMICA.md) | Sistema de navegación |
| [RBAC-SYSTEM.md](desarrollo/RBAC-SYSTEM.md) | Roles y permisos |
| [AUTENTICACION.md](desarrollo/AUTENTICACION.md) | Sistema JWT |
| [BRANDING-DINAMICO.md](desarrollo/BRANDING-DINAMICO.md) | Logos, colores dinámicos |
| [LOGGING.md](desarrollo/LOGGING.md) | Sistema de logs |
| [TESTING.md](desarrollo/TESTING.md) | pytest, Vitest, Storybook |
| [POLITICAS-DESARROLLO.md](desarrollo/POLITICAS-DESARROLLO.md) | Convenciones de código |
| [REFACTORING-PLAN.md](desarrollo/REFACTORING-PLAN.md) | Plan de refactoring |

#### DevOps (`devops/`)

| Documento | Descripción |
|-----------|-------------|
| [CI-CD.md](devops/CI-CD.md) | GitHub Actions |
| [BACKUPS.md](devops/BACKUPS.md) | Sistema de backups |
| [DESPLIEGUE.md](devops/DESPLIEGUE.md) | Staging y producción |

#### Planificación (`planificacion/`)

| Documento | Descripción |
|-----------|-------------|
| [CRONOGRAMA-26-SEMANAS.md](planificacion/CRONOGRAMA-26-SEMANAS.md) | Plan de desarrollo |
| [CRONOGRAMA-VISUAL.md](planificacion/CRONOGRAMA-VISUAL.md) | Visualización |

#### Guías (`guias/`)

| Documento | Descripción |
|-----------|-------------|
| [CLAUDE.md](guias/CLAUDE.md) | Configuración para IA/desarrolladores |

#### Usuarios (`usuarios/`)

| Documento | Descripción |
|-----------|-------------|
| [CONFIGURACION-MARCA.md](usuarios/CONFIGURACION-MARCA.md) | Guía de branding para usuarios |

#### Módulos (`modulos/`)

| Carpeta | Contenido |
|---------|-----------|
| `hseq/` | Documentación HSEQ (4 docs) |
| `riesgos/` | Motor de riesgos (4 docs) |
| `cumplimiento/` | Requisitos legales |
| `consecutivos/` | Sistema de consecutivos |

#### Desarrollo - Sesiones (`desarrollo/sesiones/`)

Registros históricos de sesiones de desarrollo significativas.

#### Desarrollo - Celery (`desarrollo/celery/`)

| Documento | Descripción |
|-----------|-------------|
| [CELERY_QUICKSTART.md](desarrollo/celery/CELERY_QUICKSTART.md) | Inicio rápido |
| [REDIS-CELERY-GUIDE.md](desarrollo/celery/REDIS-CELERY-GUIDE.md) | Guía completa |

---

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Backend** | Django 5.0, DRF, MySQL 8.0, Python 3.11+ |
| **Frontend** | React 18, TypeScript 5.3, Vite, Tailwind, Zustand |
| **Async** | Celery 5.3+, Redis 7 |
| **DevOps** | Docker, GitHub Actions |

---

## Comandos Útiles

### Docker

```bash
docker-compose up -d              # Iniciar
docker-compose logs -f            # Logs
docker-compose restart            # Reiniciar
```

### Backend

```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend pytest
```

### Frontend

```bash
cd frontend && npm run dev        # Desarrollo
cd frontend && npm test           # Tests
cd frontend && npm run storybook  # Componentes
```

---

## Preservar - No Modificar Sin Análisis

- `apps/core/` - Sistema RBAC, Usuario, Cargo, Permiso
- `apps/gestion_estrategica/organizacion/` - Áreas, Consecutivos
- `apps/gestion_estrategica/configuracion/` - EmpresaConfig
- `frontend/src/hooks/usePermissions.ts` - Hook de permisos
- `frontend/src/store/authStore.ts` - Store de autenticación

---

## Progreso del Proyecto

| Semana | Estado | Entregables |
|--------|--------|-------------|
| 1 | ✅ Completada | Infraestructura, CI/CD, Testing |
| 2 | ✅ Completada | Configuración base, Branding |
| 3 | ✅ Completada | RBAC, Testing 310+ tests |
| 4 | ✅ Completada | Identidad Corporativa |
| 5 | ✅ Completada | Planeación Estratégica |
| 6 | ✅ Completada | Proyectos PMI, Revisión Dirección |
| 7 | ✅ Completada | Motor Cumplimiento - Matriz Legal (101 tests) |
| 8+ | 🔜 Próximo | Partes Interesadas, Reglamentos |

Ver detalle: [CRONOGRAMA-26-SEMANAS.md](planificacion/CRONOGRAMA-26-SEMANAS.md)

---

## Logros Recientes

### Semana 7 - Motor de Cumplimiento (25 Dic 2025)

- ✅ **Backend:** 18 modelos migrados a BaseCompanyModel
- ✅ **Backend:** 17 ViewSets con StandardViewSetMixin
- ✅ **Backend:** Celery tasks para scraper y alertas
- ✅ **Frontend:** 4 apps con TypeScript, API clients y hooks
- ✅ **Testing:** 101 tests creados (>85% cobertura)
- ✅ **Componentes:** MatrizLegalTab, RequisitosLegalesTab, PartesInteresadasTab, ReglamentosInternosTab

---

**Última actualización:** 25 Diciembre 2025
