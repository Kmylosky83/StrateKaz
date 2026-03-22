# FASE 3 — Salud del Frontend

**Auditoría:** Health Check Integral StrateKaz SGI
**Fase:** 3 de 7
**Agentes:** React Architect + State Specialist + Security Specialist + Quality Specialist
**Fecha:** 22 de marzo de 2026
**Duración:** ~20 minutos (4 agentes en paralelo)

---

## Resumen Ejecutivo

El frontend React/TypeScript de StrateKaz tiene una **arquitectura sólida** con type safety excepcional (1 solo `any` en 1,299 archivos), factory patterns excelentes (API, CRUD hooks, query keys), y zero código muerto. Sin embargo, presenta **brechas críticas en autorización**: SectionGuard cubre solo 5% de rutas, ProtectedAction tiene 0 usos en features, y hasRole/isInGroup están broken. La deuda técnica se concentra en 322 inline styles, 2 componentes >500 líneas, y Storybook al 2.5%.

**Puntuación global Fase 3: 7.0/10**

---

## Métricas Clave

| Métrica | Valor |
|---------|-------|
| Archivos TypeScript totales | 1,299 (.ts + .tsx) |
| Componentes en features | 640+ |
| Componentes compartidos | 94 |
| Custom hooks centralizados | 26 |
| Custom hooks en features | 40+ |
| Zustand stores | 2 (auth + theme) |
| Query keys centralizados | 40+ (factory pattern) |
| Zod schemas | 147+ |
| Tipos `any` | 1 (legítimo — React Flow) |
| `@ts-ignore` / `@ts-expect-error` | 0 |
| `as unknown as` assertions | 90 |
| Inline styles | 322 en 135 archivos |
| Componentes >300 líneas | 8 |
| Componentes >500 líneas | 2 |
| Storybook stories | 3 de 118 componentes (2.5%) |
| Rutas con ModuleGuard | 113/119 (95%) |
| Rutas con SectionGuard | 6/119 (5%) |
| ProtectedAction usos en features | 0 |
| Hardcoded query keys | 7 |
| URLs hardcodeadas | 0 |

---

## Hallazgos por Severidad

### CRITICO (P0)

#### H1 — ProtectedAction: 0 usos en features (componente existe pero nunca integrado)

**Impacto:** No hay protección a nivel de acción (crear, editar, eliminar). Cualquier usuario con acceso al módulo puede ejecutar todas las acciones.

**Evidencia:**
- `components/common/ProtectedAction.tsx` — Componente completo con CanView, CanCreate, CanEdit, CanDelete
- Exportado en `common/index.ts`
- **0 importaciones** en ningún archivo de features

**El plan de auditoría decía "70% sin ProtectedAction" — la realidad es 100%.**

---

#### H2 — SectionGuard: solo 5% de cobertura (6/119 rutas)

**Impacto:** RBAC frontend prácticamente inexistente a nivel de sección. ModuleGuard valida que el módulo esté activo, pero no verifica permisos granulares.

**Evidencia:**
- 113 rutas usan ModuleGuard (acceso módulo)
- Solo 6 rutas usan SectionGuard (acceso sección)
- admin-global.routes.tsx: 1 uso (superadmin check)
- portals.routes.tsx: 1 uso (usuarios section)
- Resto: 0 usos

---

#### H3 — hasRole() e isInGroup() siempre retornan false

**Impacto:** Cualquier lógica basada en roles o grupos falla para usuarios no-superadmin.

**Causa raíz:** Backend no devuelve `role_codes` ni `group_codes` en el endpoint `/profile`.

**Evidencia:** `hooks/usePermissions.ts` líneas 243-262:
```typescript
const hasRole = useCallback((_role: RoleCode): boolean => {
  if (isSuperAdmin) return true;
  // TODO: Implementar cuando el backend devuelva roles del usuario
  return false;
}, [isSuperAdmin]);
```

**Impacto actual:** BAJO (ningún componente usa hasRole/isInGroup actualmente), pero BLOQUEANTE para RBAC futuro.

---

### ALTO (P1)

#### H4 — 322 inline styles en lugar de Tailwind CSS

**Impacto:** Inconsistencia visual, mantenibilidad reducida, no aprovecha design system.

**Top offenders:**
- gestion-estrategica/EncuestaPublicaPage.tsx — 18 inline styles
- gestion-estrategica/ValoresDragDrop.tsx — 11 inline styles
- gestion-estrategica/MisionVisionSection.tsx — 10 inline styles

---

#### H5 — 2 componentes >500 líneas necesitan refactorización

| Componente | Líneas | Problema |
|-----------|--------|----------|
| OrganigramaCanvas.tsx | ~600 | React Flow + nodos + toolbar + handlers en un solo archivo |
| WorkflowDesignerCanvas.tsx | ~500 | BPMN designer monolítico |

**6 componentes adicionales >300 líneas:** MapaEstrategicoCanvas (450), PlantillaFormModal (400), DocumentoReaderModal (350), DynamicFormRenderer (350), GanttView (320), GanttTimeline (300).

---

#### H6 — Query key mismatch en workflows (bug)

**Archivo:** `workflows/CategoriaFormModal.tsx:53,64`

Invalidación usa `['wf-categorias']` (root) pero query usa `['wf-categorias', 'list']` (nested). **La lista NO se actualiza** después de crear/eliminar categorías.

---

#### H7 — Bug en useUsers: variable `_error` no usada

**Archivo:** `features/users/hooks/useUsers.ts:38-40, 71-73`

```typescript
onError: (_error: unknown) => {
  const message = error.response?.data?.message || 'Error';
  //               ↑ usa 'error' pero el parámetro es '_error'
```

Error handling roto en createUser, updateUser y deleteUser.

---

#### H8 — Storybook: 2.5% cobertura (3/118 componentes)

Solo Badge, Button y TimeElapsedDisplay tienen stories. FormBuilder, Tables, Modals, y todos los componentes HSEQ/Workflows sin documentación visual.

---

### MEDIO (P2)

#### H9 — 7 hardcoded query keys fuera del factory

Archivos: CategoriaFormModal, UsersPage, UserImpersonationModal, ImportCargosModal, GeneradorInformesPage. Riesgo de typos y cache mismatches.

#### H10 — No hay optimistic updates en mutations

Todas las mutations esperan respuesta del servidor antes de actualizar UI (500ms-2s delay percibido).

#### H11 — Tokens JWT en localStorage (XSS-vulnerable)

Access y refresh tokens almacenados en localStorage. Mitigado por CSP headers, pero httpOnly cookies serían más seguros.

#### H12 — ModuleGuard sin fallback de error

Si la API de módulos falla, muestra loader indefinidamente. Usuario no puede navegar.

#### H13 — 90 assertions `as unknown as`

Usados en casos controlados pero podrían reducirse con branded types.

---

### BAJO (P3)

#### H14 — dangerouslySetInnerHTML en 5 archivos

IdentityFormModal, MisionVisionSection, DocumentoReaderModal, DocumentoDetailModal — contenido rico de TipTap.

#### H15 — ~20 features sin API files propios

Normal — leen de APIs compartidas. No es un problema, pero dificulta trazabilidad.

---

## Verificaciones Exitosas

### Type Safety: EXCEPCIONAL

| Aspecto | Estado |
|---------|--------|
| TypeScript strict mode | `strict: true` habilitado |
| `any` types | 1 sola ocurrencia (legítimo — React Flow nodeTypes) |
| `@ts-ignore` | 0 en toda la codebase |
| `@ts-expect-error` | 0 en toda la codebase |
| Utility types avanzados | 40+ (CreateDTO, UpdateDTO, Brand, DeepPartial, etc.) |
| Type guards | 10+ (isDefined, isEmail, isNIT, etc.) |
| Branded types | 7 (Email, NIT, UUID, URL, Code, Percentage, PositiveInteger) |
| Zod schemas | 147+ con zodResolver integrado |

### Factory Patterns: EXCELENTE

| Factory | Propósito | Estado |
|---------|----------|--------|
| API Factory (`lib/api-factory.ts`) | Genera CRUD clients tipados | 0 URLs hardcodeadas |
| CRUD Hooks Factory (`lib/crud-hooks-factory.ts`) | useList, useDetail, useCreate, useUpdate, useDelete | 16+ features lo usan |
| Query Keys Factory (`lib/query-keys.ts`) | all, lists, list, details, detail, custom | 40+ keys centralizados |

### State Management: BIEN DISEÑADO

| Store | Estado | Observaciones |
|-------|--------|---------------|
| authStore (Zustand) | 10 state vars, 15 actions | Persist v5, impersonation support |
| themeStore (Zustand) | 1 state var, 2 actions | Limpio, sin issues |
| TanStack Query | staleTime 5min, gcTime 10min | Buena config default |
| Cache invalidation | List-level post-mutation | Funcional, sin optimistic updates |

### Auth Flow: EXCELENTE

| Aspecto | Grade |
|---------|-------|
| ProtectedRoute (autenticación) | A |
| Token proactive refresh (5min antes de expirar) | A |
| Token reactive refresh (queue serialization) | A |
| Cross-tab logout sync | A |
| Race condition handling | A |
| Impersonation (superadmin) | A- |

### Code Splitting: SOFISTICADO

11 vendor chunks configurados en Vite:
- echarts (~800KB), recharts (~350KB), three.js (~680KB), xyflow (~250KB)
- tiptap (~250KB), jspdf (~370KB), framer-motion (~180KB), phaser (~1MB)
- Chunk limit: 800KB
- PWA con Service Worker (NetworkOnly para APIs cross-tenant)

### Componentes Compartidos: BIEN ORGANIZADOS

94 componentes en `src/components/`: common (68), forms (11), modals (4), data-display (3), layout (1), mobile, users, proveedores.

---

## Puntuación por Área

| Área | Puntuación | Justificación |
|------|-----------|---------------|
| TypeScript type safety | 10/10 | 1 `any` en 1,299 archivos, strict mode, branded types |
| Factory patterns (API/CRUD/Keys) | 10/10 | Excelente DRY, 0 URLs hardcodeadas |
| State management | 8/10 | Zustand + Query bien separados, sin optimistic updates |
| Auth/Token flow | 9/10 | Proactive refresh, cross-tab sync, queue serialization |
| Route guards (auth) | 9/10 | ProtectedRoute sólido, ModuleGuard 95% |
| Route guards (RBAC) | 3/10 | SectionGuard 5%, ProtectedAction 0% |
| Component architecture | 7/10 | 2 componentes >500 líneas, 322 inline styles |
| Code splitting/Build | 9/10 | 11 chunks, PWA, Vite optimizado |
| Storybook/Docs | 2/10 | 2.5% cobertura |
| Error handling | 7/10 | ErrorBoundary global, algunos silent failures |
| **GLOBAL FASE 3** | **7.0/10** | Type safety excepcional, RBAC frontend crítico |

---

## Recomendaciones Priorizadas

| Prioridad | Acción | Esfuerzo | Impacto |
|-----------|--------|----------|---------|
| P0-1 | Integrar ProtectedAction en features LIVE (L0-L20) | 2-3 días | RBAC acciones |
| P0-2 | Desplegar SectionGuard en rutas sensibles | 1-2 días | RBAC secciones |
| P0-3 | Backend: retornar role_codes + group_codes en /profile | 2 horas BE | Desbloquea hasRole/isInGroup |
| P1-1 | Fix bug useUsers `_error` variable | 5 min | Error handling |
| P1-2 | Fix query key mismatch en workflows | 10 min | Cache sync |
| P1-3 | Migrar 322 inline styles a Tailwind | 1 sprint | Consistencia UI |
| P1-4 | Refactorizar OrganigramaCanvas y WorkflowDesignerCanvas | 1 sprint | Mantenibilidad |
| P2-1 | Centralizar 7 hardcoded query keys | 1 hora | DRY |
| P2-2 | Implementar optimistic updates en CRUD factory | 2 días | UX percepción |
| P2-3 | Agregar fallback error en ModuleGuard | 30 min | UX |
| P3-1 | Crear 20-30 Storybook stories para componentes clave | Continuo | Documentación |
| P3-2 | Evaluar migración tokens a httpOnly cookies | Investigación | Seguridad XSS |

---

## Comparativa con Fase 2 (Backend)

| Aspecto | Backend (F2) | Frontend (F3) | Delta |
|---------|-------------|---------------|-------|
| Puntuación global | 7.5/10 | 7.0/10 | Backend +0.5 |
| Permisos/Auth | 9/10 (100% IsAuthenticated) | 3/10 (SectionGuard 5%) | **Backend >>> Frontend** |
| Código muerto | 10/10 (cero) | 9/10 (casi cero) | Similar |
| Type safety | N/A | 10/10 (1 `any`) | Excepcional |
| Factory patterns | N/A | 10/10 | Excepcional |
| Documentación | Mejora necesaria | 2/10 (Storybook) | Ambos débiles |

**Conclusión:** La brecha más grande de toda la plataforma está en **RBAC frontend** — el backend protege correctamente todos los endpoints (100% IsAuthenticated + throttling), pero el frontend no valida permisos granulares en rutas ni acciones.

---

*Reporte generado por 4 agentes especializados Claude Code ejecutados en paralelo.*
*Metodología: CVEA (Contextualizar → Validar → Ejecutar → Ajustar)*
