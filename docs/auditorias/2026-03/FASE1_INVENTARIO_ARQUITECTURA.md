# FASE 1 — Inventario y Arquitectura

**Auditoría:** Health Check Integral StrateKaz SGI
**Fase:** 1 de 7
**Agentes:** Backend Architect (x3) + React Architect
**Fecha:** 22 de marzo de 2026
**Duración:** ~10 minutos (4 agentes en paralelo)

---

## Resumen Ejecutivo

Se auditó la totalidad de la plataforma StrateKaz SGI comparando implementación real vs documentación arquitectónica. La arquitectura cascada está **correctamente implementada** en código, pero la documentación (CLAUDE.md) presenta **desincronización significativa** con el estado actual. Se encontraron **6 violaciones de independencia C2** concentradas en `mi_equipo` → `talent_hub`. C3 (Analytics) cumple correctamente la regla de solo lectura.

**Puntuación global Fase 1: 7.0/10**

---

## Métricas Clave

| Métrica | Valor |
|---------|-------|
| Apps Django activas (TENANT_APPS) | 31 |
| Apps Django comentadas (pendientes CASCADE) | ~55 |
| Apps totales en código | ~86 |
| Módulos C2 auditados | 13 |
| Módulos C2 limpios (sin violaciones) | 11 |
| Violaciones independencia C2 | 6 (4 CRÍTICAS, 2 ALTAS) |
| C3 cumple solo lectura | SI |
| Features frontend | 28 |
| Rutas con ModuleGuard | 24/29 |
| Rutas con SectionGuard | 1/100+ |
| Apps no documentadas en CLAUDE.md | 9 |
| Cross-module imports frontend | 8 |
| URLs hardcodeadas frontend | 0 |

---

## Hallazgos por Severidad

### CRITICO (P0)

#### H1 — SectionGuard subutilizado: 1 de 100+ rutas protegidas

**Impacto:** RBAC frontend prácticamente inexistente. Cualquier usuario autenticado con acceso al módulo puede ver todas las secciones.

**Evidencia:**
- `frontend/src/routes/SectionGuard.tsx` — Implementado correctamente
- Solo `admin-global.routes.tsx` lo usa (1 ruta con `requireSuperadmin`)
- Las 100+ rutas restantes dependen solo de `ModuleGuard` (valida módulo activo, NO permisos granulares)

**Recomendación:** Implementar SectionGuard en todas las rutas sensibles. Priorizar módulos LIVE (L0-L20).

---

#### H2 — mi_equipo importa directamente de talent_hub (4 violaciones)

**Impacto:** Acoplamiento fuerte entre dos módulos C2 que deberían ser independientes. Rompe la regla arquitectónica fundamental.

**Evidencia:**

| # | Archivo | Línea(s) | Import violador |
|---|---------|----------|-----------------|
| 1 | `apps/mi_equipo/seleccion_contratacion/views.py` | 503, 967, 996 | `from apps.talent_hub.services.contratacion_service import ContratacionService` |
| 2 | `apps/mi_equipo/seleccion_contratacion/views.py` | 2027 | `from apps.talent_hub.services.notificador_th import NotificadorTH` |
| 3 | `apps/mi_equipo/seleccion_contratacion/signals.py` | 22 | `from apps.talent_hub.services import NotificadorTH` |
| 4 | `apps/mi_equipo/onboarding_induccion/signals.py` | 15 | `from apps.talent_hub.services import NotificadorTH` |

**Recomendación:**
1. Mover `ContratacionService` a `utils/services/` o `shared_library` (servicio transversal)
2. Mover `NotificadorTH` a un servicio genérico de notificaciones (C0)
3. Evaluar si la lógica de contratación pertenece a mi_equipo o talent_hub

---

#### H3 — CLAUDE.md desactualizado en 9 áreas

**Impacto:** Documentación no refleja realidad del código. Agentes y desarrolladores trabajan con información incorrecta.

**Apps en código pero NO documentadas en CLAUDE.md:**

| # | App | Capa | Estado |
|---|-----|------|--------|
| 1 | `apps.ia` | C0 | ACTIVO (L0) |
| 2 | `apps.shared_library` | SHARED | ACTIVO |
| 3 | `apps.gamificacion.juego_sst` | C2 | ACTIVO (L20) |
| 4 | `apps.mi_equipo` (4 sub-apps) | C2 | ACTIVO (L20) — Documentado como talent_hub |
| 5 | `apps.gestion_estrategica.gestion_proyectos` | C2 | COMENTADO |
| 6 | `apps.gestion_estrategica.planificacion_sistema` | C2 | COMENTADO |
| 7 | `apps.hseq_management.calidad` | C2 | COMENTADO |
| 8 | `apps.hseq_management.mejora_continua` | C2 | COMENTADO |
| 9 | `apps.talent_hub.consultores_externos` | C2 | COMENTADO |

**Nomenclatura inconsistente:**
- Código: `apps.administracion` | Docs: `admin_finance`
- Código: `apps.mi_equipo` (L20) + `apps.talent_hub` (L60) | Docs: todo como `talent_hub`

---

### ALTO (P1)

#### H4 — Cross-module imports en frontend (8 violaciones)

**Impacto:** Módulos frontend no respetan independencia C2 en UI.

| Importador | Importa de | Componente | Severidad |
|-----------|-----------|-----------|-----------|
| acciones-mejora | hseq | FormModals | MEDIA |
| gestion-documental | gestion-estrategica | useWorkflowFirmas | BAJA |
| gestion-documental | hseq | Auditoría components | MEDIA |
| mi-equipo | hseq | Tipos EPP/seguridad | BAJA |
| mi-portal | sst-game | Entry point lazy | BAJA |
| supply-chain | gestion-estrategica | PILookupField | BAJA |
| sales-crm | gestion-estrategica | PILookupField | BAJA |

**Recomendación:** Mover `PILookupField` y componentes reutilizables a `@/components/shared/`.

---

#### H5 — production_ops tests importan de supply_chain

**Archivo:** `apps/production_ops/recepcion/tests/conftest.py` (líneas 20-23)

```python
from apps.supply_chain.gestion_proveedores.models import Proveedor, TipoProveedor
from apps.supply_chain.catalogos.models import Departamento
```

**Recomendación:** Usar `apps.get_model()` o factory fixtures en shared_library.

---

#### H6 — sales_crm y mi_equipo importan ResumenRevisionMixin

**Archivos:**
- `apps/sales_crm/servicio_cliente/views.py` (línea 13)
- `apps/mi_equipo/seleccion_contratacion/views.py` (línea 19)

```python
from apps.gestion_estrategica.revision_direccion.services.resumen_mixin import ResumenRevisionMixin
```

**Recomendación:** Extraer mixin a `utils/` como herramienta compartida.

---

### MEDIO (P2)

#### H7 — Portales públicos sin guard de acceso

`portals.routes.tsx` expone rutas (`/vacantes`, `/postular`) sin ProtectedRoute. Verificar si es intencional (acceso anónimo para postulaciones).

#### H8 — 4 módulos frontend son legacy redirects

`cumplimiento`, `riesgos`, `gestion-estrategica`, `sistema-gestion` son módulos que solo hacen redirect. Pueden eliminarse en refactorización futura.

#### H9 — workflow_engine.firma_digital tiene FK a audit_system.tareas_recordatorios

FK cruzada entre C2 (workflow) y C0 (audit_system). Aceptable porque audit_system es C0, pero crea acoplamiento tight en migraciones.

---

### BAJO (P3)

#### H10 — shared_library importa serializer de gestion_documental

`apps/shared_library/views.py` (líneas 112-114): Import de `PlantillaDocumentoDetailSerializer`. Aceptable como utility.

#### H11 — Storybook: 3 de 100+ componentes documentados

Design system con cobertura mínima. No bloquea pero limita onboarding de nuevos desarrolladores.

---

## Verificaciones Exitosas

### C3 Solo Lectura: CUMPLE

Analytics cumple perfectamente la regla de solo lectura:
- Usa `apps.get_model()` para acceder a datos C2
- Solo operaciones `.count()`, `.filter()`, `.aggregate()` sobre modelos C2
- Escribe SOLO en sus propios modelos (`ValorKPI`, `AnomaliaDetectada`)
- Servicio `CrossModuleStatsService` lee de 7 módulos C2 sin escribir

### 11 Módulos C2 Limpios

Sin violaciones de independencia inter-C2:
talent_hub, supply_chain, hseq_management, motor_cumplimiento, motor_riesgos, sales_crm, logistics_fleet, accounting, gamificacion, workflow_engine, admin_finance (administracion)

### Patrón Correcto Identificado

`production_ops/recepcion/models.py` implementa el patrón correcto:
```python
proveedor_id = models.PositiveBigIntegerField(
    help_text='ID del proveedor (supply_chain.Proveedor)'
)
```

### API Layer Frontend: Excelente

- API Factory elimina boilerplate (50 líneas → 3)
- 0 URLs hardcodeadas en todo el frontend
- 16+ features usan el factory pattern consistentemente
- axios-config con interceptors JWT centralizados

### Sidebar Dinámico: Correcto

- 11 capas visuales sincronizadas con backend `SIDEBAR_LAYERS`
- Renderizado condicional por `is_category`
- Colores por nivel coherentes con diseño

### Cascada en Código: Correcta

```
L0:  Core + IA                                    LIVE
L10: Fundación (5 apps)                            LIVE
L12: Transversal (workflow 4 + audit 4)            LIVE
L15: Gestión Documental                            LIVE
L20: Mi Equipo (4) + Gamificación                  LIVE
L25: Cumplimiento (4) + Riesgos (6)                COMENTADO
L30: HSEQ (9)                                      COMENTADO
L35: Cadena de Valor (15)                           COMENTADO
L45: Finanzas + Contabilidad (8)                    COMENTADO
L50: Analytics completo (5)                         COMENTADO
L60: Talento continuo (7)                           COMENTADO
```

---

## Puntuación por Area

| Área | Puntuación | Justificación |
|------|-----------|---------------|
| Cascada implementation | 9/10 | Código correcto, niveles bien definidos |
| C2 independencia backend | 6/10 | 6 violaciones en mi_equipo→talent_hub |
| C3 solo lectura | 10/10 | Cumple perfectamente |
| Frontend architecture | 7.5/10 | API excelente, SectionGuard subutilizado |
| Documentación vs código | 5/10 | 9 apps no documentadas, nomenclatura inconsistente |
| Sidebar/Navigation | 9/10 | Sincronizado correctamente |
| **GLOBAL FASE 1** | **7.0/10** | Arquitectura sólida con gaps de RBAC y docs |

---

## Recomendaciones Priorizadas

| Prioridad | Acción | Esfuerzo | Impacto |
|-----------|--------|----------|---------|
| P0-1 | Implementar SectionGuard en rutas LIVE (L0-L20) | 2-3 días | ALTO — RBAC frontend |
| P0-2 | Desacoplar mi_equipo de talent_hub (ContratacionService + NotificadorTH) | 1 día | ALTO — Independencia C2 |
| P0-3 | Actualizar CLAUDE.md (9 apps, nomenclatura, cascada levels) | 2 horas | ALTO — Documentación |
| P1-1 | Mover PILookupField y componentes compartidos a @/components/shared/ | 0.5 día | MEDIO — Frontend clean |
| P1-2 | Extraer ResumenRevisionMixin a utils/ | 0.5 día | MEDIO — Backend clean |
| P2-1 | Verificar acceso anónimo en portals.routes.tsx | 1 hora | BAJO — Seguridad |
| P2-2 | Limpiar legacy redirects (4 módulos frontend) | 1 hora | BAJO — Housekeeping |
| P3-1 | Ampliar cobertura Storybook (3 → 20+ componentes clave) | Continuo | BAJO — DX |

---

*Reporte generado por 4 agentes especializados Claude Code ejecutados en paralelo.*
*Metodología: CVEA (Contextualizar → Validar → Ejecutar → Ajustar)*
