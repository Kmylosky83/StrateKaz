# CHANGELOG — StrateKaz

Todas las versiones notables están documentadas aquí.
Formato: [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) | Versionado: [SemVer](https://semver.org/)

> **Nota:** El historial de sesiones de desarrollo está en `docs/auditorias/history/`.
> Este changelog documenta versiones publicadas (releases), no sesiones internas.

---

## [Unreleased]
### En progreso
- Consolidación L0-L20 como StrateKaz Core 1.0
- Adopción RBAC v4.1 completa en todos los componentes FE LIVE
- Resolución bugs config-admin (React crash #31)

---

## [5.9.0] — 2026-04-19
### Added
- Supply Chain S6 activado: 6 sub-apps LIVE (catalogos, gestion_proveedores, recepcion, liquidaciones, almacenamiento, compras)
- Catálogo Productos S5: campo `is_system`, auto-código, nivel NIVEL_INFRAESTRUCTURA en sidebar
- UnidadMedida canónico: consolidación CT absorbe legacy supply_chain

### Changed
- Sidebar: TIER 0 Material pattern, deduplicación de ítems

---

## [5.3.0] — 2026-03-18
### Added
- Config Plataforma V2.1: NIVEL_WORKFLOWS + NIVEL_CONFIG transversales
- Mi Portal: AdminPortalView para superadmin

### Fixed
- Seed category bug en config-admin (INFRASTRUCTURE → PLATFORM_CONFIG)

---

## [5.1.0] — 2026-02-09
### Added
- Multi-tenant completo con django-tenants (schemas PostgreSQL)
- RBAC v4.1: 4 capas (Cargo, RolAdicional, Group, UserRole), lógica OR
- Gestión Documental: 8 fases, 8 modelos
- Workflow Engine: 4 sub-apps (diseñador, ejecución, monitoreo, firma_digital)

---

## Regla de mantenimiento
Actualizar en el mismo PR o deploy que incremente la versión.
Versión en: `frontend/package.json` (version) y `backend/config/settings/base.py` (SPECTACULAR_SETTINGS VERSION).
Última actualización: 2026-04-20
