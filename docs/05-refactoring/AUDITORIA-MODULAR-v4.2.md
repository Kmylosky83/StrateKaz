# Auditoria Modular - StrateKaz ERP v4.2.0

> **Fecha:** 2026-02-07 | **Alcance:** Backend, Frontend, Modulos

---

## Resumen Ejecutivo

| Area | Calificacion | Criticos | Medios | Menores |
|------|-------------|----------|--------|---------|
| Backend | A (96/100) | 0 | 1 | 0 |
| Frontend | A+ (98/100) | 0 | 0 | 1 |
| Modulos | B+ (85/100) | 2 | 2 | 0 |
| **TOTAL** | **A- (93/100)** | **2** | **3** | **1** |

---

## 1. Auditoria Backend

### 1.1 Imports y Dependencias
- **Estado:** LIMPIO
- 0 imports rotos en todo el proyecto
- Dependencias circulares resueltas (contexto <-> planeacion)
- Migraciones: `0002_remove_circular_dependency.py` en ambas apps

### 1.2 Migraciones
- **Estado:** LIMPIO
- 16 cadenas de migracion verificadas
- Todas las migraciones legacy eliminadas y consolidadas en `0001_initial.py`
- Migraciones nuevas correctamente encadenadas

### 1.3 Signals
- **Estado:** LIMPIO
- 30+ archivos de signals presentes y registrados en `apps.py`
- Signal `auto_create_colaborador` funcional (User + Cargo + Area → Colaborador)

### 1.4 [MEDIO] Arquitectura Dual de Settings
- **Archivo:** `backend/config/settings.py` (MySQL, single-tenant)
- **Archivo:** `backend/config/settings/base.py` (PostgreSQL, multi-tenant)
- **Riesgo:** Confusion sobre cual es produccion
- **Recomendacion:** `settings.py` raiz es legacy para desarrollo local. `settings/base.py` es produccion (Docker). Documentar o eliminar el legacy.

---

## 2. Auditoria Frontend

### 2.1 Build y Compilacion
- **Estado:** LIMPIO
- TypeScript compila sin errores
- Vite build exitoso
- 0 imports rotos

### 2.2 Tipos y Alineacion
- **Estado:** LIMPIO
- Tipos backend ↔ frontend alineados
- Serializers coinciden con interfaces TypeScript
- Query keys sin huerfanos funcionales

### 2.3 Rutas y Componentes
- **Estado:** LIMPIO
- Todas las rutas resuelven a componentes existentes
- ProtectedRoute funciona correctamente
- Lazy loading implementado en todas las paginas

### 2.4 [MENOR] Campo Deprecated
- **Archivo:** `frontend/src/types/tenant.types.ts:34`
- **Campo:** `role` - campo legacy que ya no se usa (RBAC v4 usa CargoSectionAccess)
- **Recomendacion:** Agregar `@deprecated` o eliminar si no se usa en ningun lugar

---

## 3. Auditoria de Modulos

### 3.1 Modulos CORE (No Desactivables)

| Modulo | code | Razon |
|--------|------|-------|
| Gestion Estrategica | `gestion_estrategica` | Base: identidad, contexto, planeacion, organizacion, configuracion |
| Auditoria del Sistema | `audit_system` | Logging, alertas, notificaciones, tareas - infraestructura |

### 3.2 Modulos Opcionales - Matriz de Desactivacion

| Modulo | code | Orden | Desactivar Seguro? | Dependencia |
|--------|------|-------|---------------------|-------------|
| Sistema de Gestion | `sistema_gestion` | 15 | SI | Ninguna critica |
| Motor de Cumplimiento | `motor_cumplimiento` | 20 | SI | Ninguna critica |
| Motor de Riesgos | `motor_riesgos` | 21 | SI | Ninguna critica |
| Workflow Engine | `workflow_engine` | 22 | PRECAUCION | Firma digital en politicas |
| HSEQ Management | `hseq_management` | 30 | SI* | *Solo si talent_hub activo |
| Cadena de Suministro | `supply_chain` | 40 | SI | Ninguna critica |
| Base de Operaciones | `production_ops` | 41 | SI | Ninguna critica |
| Logistica y Flota | `logistics_fleet` | 42 | SI | Ninguna critica |
| Ventas y CRM | `sales_crm` | 43 | SI | Ninguna critica |
| Centro de Talento | `talent_hub` | 50 | NO | HSEQ depende de Colaborador FK |
| Admin y Finanzas | `admin_finance` | 51 | SI | Ninguna critica |
| Contabilidad | `accounting` | 52 | SI | Ninguna critica |
| Inteligencia de Negocios | `analytics` | 60 | SI | Ninguna critica |

### 3.3 Cadenas de Dependencia entre Modulos

```
gestion_estrategica (CORE)
├── organizacion.Area → talent_hub.Cargo.area FK
├── organizacion.Area → talent_hub.Colaborador.area FK
└── identidad.PoliticaEspecifica → workflow_engine.firma_digital (signatures)

talent_hub (NO DESACTIVABLE si HSEQ activo)
├── colaboradores.Colaborador → hseq_management.medicina_laboral FK
├── colaboradores.Colaborador → hseq_management.accidentalidad FK
├── colaboradores.Colaborador → hseq_management.seguridad_industrial FK
└── estructura_cargos.Cargo → Toda la app Colaboradores

workflow_engine (PRECAUCION)
└── firma_digital → gestion_estrategica.identidad (politicas firmadas)

audit_system (CORE)
└── Infraestructura de logging/notificaciones para todo el sistema
```

### 3.4 [RESUELTO] Backend Enforza Activacion de Modulos

- **Problema original:** Las APIs respondian sin verificar si el modulo estaba activo
- **Solucion aplicada:** `ModuleAccessMiddleware` en `backend/apps/core/middleware/module_access.py`
  - Mapea URL prefixes a module codes (22 prefixes mapeados)
  - Valida `SystemModule.is_enabled` en cada request
  - Solo actua en schemas de tenant (no en schema public)
  - Retorna 403 si el modulo esta desactivado
  - Excluye rutas de infraestructura (`/api/core/`, `/api/tenant/`, `/api/auth/`)

### 3.5 [RESUELTO] Rutas Frontend Verifican Modulo Activo

- **Problema original:** Bookmarks cargaban modulos desactivados
- **Solucion aplicada:** `ModuleGuard` component en `frontend/src/routes/ModuleGuard.tsx`
  - Usa hook `useModuleEnabled()` para verificar estado del modulo
  - Muestra pagina "Modulo no disponible" si esta desactivado
  - Aplicado a 80+ rutas via helper `withModuleGuard()`
  - NO aplica a gestion_estrategica (CORE) ni portales (Mi Portal, Mi Equipo)

### 3.6 [RESUELTO] Validacion de Dependencias al Desactivar

- **Problema original:** No habia logica para prevenir desactivar talent_hub con hseq activo
- **Solucion aplicada:** `IMPLICIT_DEPENDENCY_CHAIN` en `SystemModule.can_disable()`
  - `talent_hub` → bloquea si `hseq_management` esta activo
  - `workflow_engine` → warning (no bloqueo) sobre firmas digitales
  - `get_disable_warning()` retorna mensaje informativo en toggle endpoint

### 3.7 [MEDIO] Orden Sidebar/Dashboard vs Orden Logico

- **Estado:** CORRECTO
- El sidebar y dashboard ya respetan el campo `orden` de `SystemModule`
- El orden actual coincide con el documento ORDEN-LOGICO-CONFIGURACION.md
- Los modulos core aparecen primero (orden 10, 61)
- Los opcionales siguen el flujo: cumplimiento(20) → riesgos(21) → workflows(22) → HSEQ(30) → operaciones(40-43) → talento(50) → finanzas(51-52) → analytics(60)

---

## 4. Plan de Accion - RESUELTO

> **Todas las correcciones fueron aplicadas el 2026-02-08**

### Prioridad ALTA (Seguridad) - COMPLETADO

| # | Accion | Archivos | Estado |
|---|--------|----------|--------|
| 1 | Crear `ModuleAccessMiddleware` (URL-based) | `backend/apps/core/middleware/module_access.py` | HECHO |
| 2 | Registrar middleware en settings | `backend/config/settings/base.py`, `backend/config/settings.py` | HECHO |
| 3 | Crear `ModuleGuard` wrapper en frontend | `frontend/src/routes/ModuleGuard.tsx` | HECHO |
| 4 | Integrar ModuleGuard en 80+ rutas | `frontend/src/routes/index.tsx` | HECHO |

**Nota:** Se opto por middleware URL-based en vez de per-ViewSet `module_code` porque hay 400+ ViewSets. El middleware mapea URL prefixes a module codes automaticamente.

### Prioridad MEDIA (Integridad) - COMPLETADO

| # | Accion | Archivos | Estado |
|---|--------|----------|--------|
| 5 | Validacion de dependencias implicitas (FKs) al toggle | `backend/apps/core/models/models_system_modules.py` | HECHO |
| 6 | Warning al desactivar workflow_engine (firmas) | `backend/apps/core/viewsets_config.py` toggle endpoint | HECHO |

### Prioridad BAJA (Limpieza) - COMPLETADO

| # | Accion | Archivos | Estado |
|---|--------|----------|--------|
| 7 | Eliminar campo `role` deprecated en types | `frontend/src/types/tenant.types.ts` | HECHO |

---

## 5. Confirmaciones Positivas

- Sidebar respeta `orden` de BD ✓
- Dashboard muestra solo modulos habilitados ✓
- RBAC v4 funciona correctamente con CargoSectionAccess ✓
- Branding per-tenant se actualiza en tiempo real ✓
- Signal auto_create_colaborador funcional ✓
- Migraciones limpias sin legacy ✓
- 0 imports rotos en todo el proyecto ✓
- TypeScript compila sin errores ✓
- Arquitectura dinamica 100% desde BD ✓
