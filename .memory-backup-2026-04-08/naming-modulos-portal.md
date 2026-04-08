# Naming: Módulos vs Portales

## Regla de oro
- **"Gestión de Personas"** = módulo RRHH en el sidebar (administrar personas)
- **"Mi Equipo"** = sección en Mi Portal para jefes (ver mis reportes directos)
- NUNCA usar "Mi Equipo" para el módulo RRHH del sidebar

## Sidebar (módulos)
| Nombre | Code | Qué hace | Quién lo ve |
|--------|------|----------|-------------|
| Gestión de Personas | `mi_equipo` | CRUD: cargos, selección, colaboradores, onboarding | Admin / RRHH |
| Mi Portal | — | Self-service: perfil, documentos, firma, HSEQ | Todos |

## Mi Portal (secciones)
| Sección | Componente | Condición | Qué muestra |
|---------|-----------|-----------|-------------|
| JefePortalSection | `JefePortalSection.tsx` | `cargo.is_jefatura=true` | Reportes directos, stats equipo |
| Tabs normales | Perfil, Firma, Lecturas, etc. | Siempre (con filtros) | Datos propios |

## Jerarquía organizacional
- **Source**: `Cargo.parent_cargo` (FK a self) en Fundación
- **Endpoint**: `GET /api/core/mi-equipo-jefe/` (lee de Core, no de RRHH)
- **NO** usar `/api/mi-equipo/` (ese es RRHH, requiere permisos admin)

## Referencia industria
| Plataforma | Módulo RRHH | Vista jefe |
|------------|------------|------------|
| Workday | Human Resources | My Team |
| BambooHR | People | My Direct Reports |
| SAP SuccessFactors | Employee Central | My Team |
| **StrateKaz** | **Gestión de Personas** | **Mi Equipo** (en Mi Portal) |
