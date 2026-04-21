# Índice — Desarrollo
**Última actualización:** 2026-04-20

Guías técnicas, convenciones, patrones y referencias para contribuir al proyecto.
Convención: nombres en `kebab-case.md`. Sin números — el orden de lectura está aquí.

---

## ¿Por dónde empezar? (nuevo contributor)
1. Lee [`onboarding-dev.md`](onboarding-dev.md) — setup local y principios del proyecto
2. Lee [`coding-standards.md`](coding-standards.md) — convenciones de código
3. Lee [`convenciones-nomenclatura.md`](convenciones-nomenclatura.md) — naming rules

---

## Convenciones y estándares
| Documento | Propósito |
|-----------|-----------|
| [`onboarding-dev.md`](onboarding-dev.md) | Primer día: setup, principios, dónde está todo |
| [`coding-standards.md`](coding-standards.md) | TypeScript types, React patterns, DRF patterns |
| [`convenciones-nomenclatura.md`](convenciones-nomenclatura.md) | snake_case vs kebab-case vs camelCase por contexto |
| [`responsive-standards.md`](responsive-standards.md) | Breakpoints, touch targets |
| [`naming-modulos-portal.md`](naming-modulos-portal.md) | "Gestión de Personas" vs "Mi Equipo" |
| [`guia-versionamiento.md`](guia-versionamiento.md) | Sistema de versionamiento semántico |
| [`ts-errors-policy.md`](ts-errors-policy.md) | Política TS: fix-on-activate + fix-on-touch |

## API y Backend
| Documento | Propósito |
|-----------|-----------|
| [`api-endpoints.md`](api-endpoints.md) | Referencia completa de endpoints REST |
| [`autenticacion.md`](autenticacion.md) | Sistema de autenticación JWT y permisos |
| [`audit-api-sync.md`](audit-api-sync.md) | FE↔BE sync: url_path, tipos TS, @actions |
| [`logging.md`](logging.md) | Sistema de logging estructurado |
| [`seeds-idempotentes.md`](seeds-idempotentes.md) | Seeds create-only, is_system flag |
| [`backend/branding-dinamico.md`](backend/branding-dinamico.md) | Branding dinámico por tenant |
| [`backend/integraciones-externas.md`](backend/integraciones-externas.md) | Sistema de integraciones externas |
| [`backend/roles-adicionales-api.md`](backend/roles-adicionales-api.md) | API de roles adicionales |
| [`backend/workflows-firmas.md`](backend/workflows-firmas.md) | Sistema de Workflows y Firmas Digitales |

## Frontend
| Documento | Propósito |
|-----------|-----------|
| [`frontend/design-system.md`](frontend/design-system.md) | Design System obligatorio — 3 tipos de vista |
| [`frontend/patrones-frontend.md`](frontend/patrones-frontend.md) | Patrones y mejores prácticas React/TS |
| [`frontend/guia-creacion-hooks.md`](frontend/guia-creacion-hooks.md) | Cómo crear custom hooks React |
| [`frontend/layout-components.md`](frontend/layout-components.md) | Layout y componentes principales |
| [`frontend/navegacion-dinamica.md`](frontend/navegacion-dinamica.md) | Sistema de navegación dinámica |
| [`frontend/politicas-react-query.md`](frontend/politicas-react-query.md) | TanStack Query: keys, caching, mutations |
| [`frontend/lucide-icons-reference.md`](frontend/lucide-icons-reference.md) | Referencia de iconos Lucide disponibles |
| [`frontend/sistema-iconos-dinamicos.md`](frontend/sistema-iconos-dinamicos.md) | Iconos dinámicos desde BD |
| [`frontend/design-system-pdf-sgi.md`](frontend/design-system-pdf-sgi.md) | Design System para PDFs (WeasyPrint) |

## Testing
| Documento | Propósito |
|-----------|-----------|
| [`testing.md`](testing.md) | Guía completa de testing (pytest + Vitest) |
| [`testing-debt.md`](testing-debt.md) | 143 tests legacy skipped — plan migración |
| [`refundacion-testing-backend.md`](refundacion-testing-backend.md) | Diagnóstico y refundación infraestructura test BE |

## How-to guides
| Documento | Propósito |
|-----------|-----------|
| [`guia-practica-modulos.md`](guia-practica-modulos.md) | Cómo funciona el sistema de módulos y features |
| [`guia-rapida-agregar-modulo.md`](guia-rapida-agregar-modulo.md) | Checklist para agregar un módulo C2 nuevo |
| [`plantillas-codigo-crud.md`](plantillas-codigo-crud.md) | Plantillas para operaciones CRUD |
| [`codigo-reutilizable.md`](codigo-reutilizable.md) | Patrones de código reutilizable |
| [`snippets-rapidos.md`](snippets-rapidos.md) | Snippets frecuentes de referencia rápida |

---

## Regla de mantenimiento
Este `INDEX.md` es el mapa de entrada al directorio de desarrollo.
Actualizar en el mismo PR cuando se agregue, elimine o renombre un doc.
Última actualización: 2026-04-20
