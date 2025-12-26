# Grasas y Huesos del Norte - SGI

Sistema integral de gestión para la recolección y procesamiento de materias primas (huesos, sebo, grasa) y subproductos cárnicos en Colombia.

| Info | Valor |
|------|-------|
| **Versión** | 2.0.0-alpha.8 |
| **Última Actualización** | 25 Diciembre 2025 (Semana 7) |
| **Estado** | Nivel 2 en Progreso |
| **Repositorio** | [GitHub](https://github.com/Kmylosky83/Grasas-Huesos-SGI) |

---

## Principios Fundamentales

### 1. Sistema 100% Dinámico

> **Todo configurable desde base de datos. NO hardcoding.**

| Elemento | Desde BD | Ejemplo |
|----------|----------|---------|
| Navegación | Módulos, tabs, secciones | `GET /api/core/modulos/` |
| Cargos/Roles | RBAC completo | Admin crea cargos sin código |
| Permisos | Granulares por acción | `sst.view_matriz_peligros` |
| Branding | Logos, colores, nombre | `EmpresaConfig` |

Ver detalles: [docs/desarrollo/ARQUITECTURA-DINAMICA.md](docs/desarrollo/ARQUITECTURA-DINAMICA.md)

### 2. Código Reutilizable

> **Antes de crear, verificar si existe. Usar abstract models, mixins y hooks.**

```python
# Backend: Usar modelos base
from apps.core.base_models import BaseCompanyModel, AuditModel
```

```typescript
// Frontend: Usar hooks genéricos
const { data, create, update } = useGenericCRUD({ endpoint: '/api/areas/' });
```

Ver detalles: [docs/desarrollo/CODIGO-REUTILIZABLE.md](docs/desarrollo/CODIGO-REUTILIZABLE.md)

---

## Arquitectura (6 Niveles, 14 Módulos)

```
┌─────────────────────────────────────────────────────────────┐
│ NIVEL 1: ESTRATÉGICO          ✅ Completo                   │
│   └── gestion_estrategica/                                  │
├─────────────────────────────────────────────────────────────┤
│ NIVEL 2: CUMPLIMIENTO         ⚙️ En Progreso                │
│   ├── motor_cumplimiento/  ├── motor_riesgos/              │
│   └── workflow_engine/                                      │
├─────────────────────────────────────────────────────────────┤
│ NIVEL 3: TORRE DE CONTROL     ✅ Backend                    │
│   └── hseq_management/                                      │
├─────────────────────────────────────────────────────────────┤
│ NIVEL 4: CADENA DE VALOR      ⚠️ Legacy/Pendiente           │
│   ├── supply_chain/  ├── production_ops/                   │
│   ├── logistics_fleet/  └── sales_crm/                     │
├─────────────────────────────────────────────────────────────┤
│ NIVEL 5: HABILITADORES        🔜 Próximo                    │
│   ├── talent_hub/  ├── admin_finance/  └── accounting/     │
├─────────────────────────────────────────────────────────────┤
│ NIVEL 6: INTELIGENCIA         🔜 Próximo                    │
│   ├── analytics/  └── audit_system/                        │
└─────────────────────────────────────────────────────────────┘
```

Ver detalle de módulos: [docs/arquitectura/CATALOGO-MODULOS.md](docs/arquitectura/CATALOGO-MODULOS.md)

---

## Stack Tecnológico

| Capa | Tecnologías |
|------|-------------|
| **Backend** | Django 5.0, DRF, MySQL 8.0, Python 3.11+ |
| **Frontend** | React 18, TypeScript 5.3, Vite, Tailwind, TanStack Query, Zustand |
| **Async** | Celery 5.3+, Redis 7 |
| **DevOps** | Docker, Docker Compose, GitHub Actions |

---

## Inicio Rápido

```bash
# 1. Clonar
git clone <repository-url>
cd "Grasas y Huesos del Norte"

# 2. Iniciar
docker-compose up -d

# 3. Acceder
# Frontend: http://localhost:3010
# Backend:  http://localhost:8000
# Admin:    http://localhost:8000/admin
```

---

## Estructura del Proyecto

```
Grasas y Huesos del Norte/
├── backend/
│   ├── apps/
│   │   ├── core/                    # Usuarios, RBAC, base models
│   │   ├── gestion_estrategica/     # ✅ Nivel 1
│   │   ├── motor_cumplimiento/      # Nivel 2
│   │   ├── motor_riesgos/           # Nivel 2
│   │   ├── workflow_engine/         # Nivel 2
│   │   ├── hseq_management/         # Nivel 3
│   │   └── [otros módulos...]       # Niveles 4-6
│   └── config/                      # Settings Django
├── frontend/
│   └── src/
│       ├── components/              # Design System
│       ├── features/                # Módulos por funcionalidad
│       ├── hooks/                   # Custom hooks
│       └── store/                   # Zustand stores
├── docs/                            # Documentación completa
├── docker/                          # Configuración Docker
└── docker-compose.yml
```

---

## Documentación

> **Punto de entrada:** [docs/00-EMPEZAR-AQUI.md](docs/00-EMPEZAR-AQUI.md)

### Por Categoría

| Categoría | Documentos Clave |
|-----------|------------------|
| **Arquitectura** | [CATALOGO-MODULOS.md](docs/arquitectura/CATALOGO-MODULOS.md), [DATABASE-ARCHITECTURE.md](docs/arquitectura/DATABASE-ARCHITECTURE.md) |
| **Desarrollo** | [ARQUITECTURA-DINAMICA.md](docs/desarrollo/ARQUITECTURA-DINAMICA.md), [CODIGO-REUTILIZABLE.md](docs/desarrollo/CODIGO-REUTILIZABLE.md), [RBAC-SYSTEM.md](docs/desarrollo/RBAC-SYSTEM.md) |
| **Frontend** | [DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md), [NAVEGACION-DINAMICA.md](docs/desarrollo/NAVEGACION-DINAMICA.md) |
| **Backend** | [TESTING.md](docs/desarrollo/TESTING.md), [LOGGING.md](docs/desarrollo/LOGGING.md), [AUTENTICACION.md](docs/desarrollo/AUTENTICACION.md) |
| **DevOps** | [CI-CD.md](docs/devops/CI-CD.md), [DESPLIEGUE.md](docs/devops/DESPLIEGUE.md), [BACKUPS.md](docs/devops/BACKUPS.md) |
| **Planificación** | [CRONOGRAMA-26-SEMANAS.md](docs/planificacion/CRONOGRAMA-26-SEMANAS.md) |
| **Guías** | [CLAUDE.md](docs/guias/CLAUDE.md), [GUIA-ACTUALIZACION-DOCS.md](docs/GUIA-ACTUALIZACION-DOCS.md) |

### Para Agentes/IA

> **Importante:** Al actualizar funcionalidades, seguir [GUIA-ACTUALIZACION-DOCS.md](docs/GUIA-ACTUALIZACION-DOCS.md)

---

## Comandos Útiles

```bash
# Docker
docker-compose up -d              # Iniciar servicios
docker-compose logs -f            # Ver logs
docker-compose restart            # Reiniciar

# Backend
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend pytest

# Frontend
cd frontend && npm run dev        # Desarrollo
cd frontend && npm test           # Tests
cd frontend && npm run storybook  # Catálogo componentes
```

---

## Licencia

Propietario - Uso interno

## Soporte

Para soporte técnico, contactar al equipo de desarrollo.

---

## Progreso Reciente

### Semana 7 - Motor de Cumplimiento (25 Dic 2025)

**Backend:**
- ✅ 18 modelos migrados a `BaseCompanyModel`
- ✅ 17 ViewSets con `StandardViewSetMixin`
- ✅ Celery tasks: scraper legal, alertas de vencimientos
- ✅ 4 apps completadas: matriz_legal, requisitos, partes_interesadas, reglamentos

**Frontend:**
- ✅ Tipos TypeScript completos para 4 apps
- ✅ API clients y custom hooks con `useGenericCRUD`
- ✅ 4 componentes principales: MatrizLegalTab, RequisitosLegalesTab, PartesInteresadasTab, ReglamentosInternosTab
- ✅ Dashboard de vencimientos, matriz de influencia, control de versiones

**Testing:**
- ✅ 101 tests creados (objetivo: 25+)
- ✅ Cobertura >85%

---

**Última actualización:** 25 Diciembre 2025 | [Ver historial de cambios](docs/planificacion/CRONOGRAMA-26-SEMANAS.md)
