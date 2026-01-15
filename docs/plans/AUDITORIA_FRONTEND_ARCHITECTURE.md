# REPORTE AUDITORÍA FRONTEND ARCHITECTURE - StrateKaz

**Fecha:** 2026-01-15
**Auditor:** Claude Code (Agente React Architect)
**Versión del Proyecto:** 3.3.0
**Stack:** React 18 + TypeScript + Vite + Zustand + TanStack Query

---

## RESUMEN EJECUTIVO

| Métrica | Valor | Estado |
|---------|-------|--------|
| **Total Componentes** | 262 | ✅ Bien organizado |
| **Custom Hooks** | 87 | ✅ Excelente abstracción |
| **Componentes >300 líneas** | 40+ | ⚠️ Refactorizar |
| **Componentes >1000 líneas** | 9 | 🔴 CRÍTICO |
| **Módulos de Features** | 19 | ✅ Feature-based |
| **Stores Zustand** | 2 | ✅ Mínimo estado global |
| **Queries React Query** | 1,827 | ✅ Excelente uso |
| **Tipos `any`** | 50+ | ⚠️ Mejorar type safety |
| **TODO pendientes** | 24+ | ⚠️ Deuda técnica |

---

## A. ESTRUCTURA DE COMPONENTES

### Organización de Carpetas

**Patrón:** Híbrido Feature-Based + Atomic Design

```
frontend/src/
├── __tests__/              # Tests separados
├── api/                    # Capa API (4 archivos)
│   ├── auth.api.ts
│   ├── axios-config.ts
│   ├── proveedores.api.ts
│   └── users.api.ts
├── assets/                 # Recursos estáticos
├── components/             # Componentes compartidos (68)
│   ├── common/            # Átomos y moléculas (31)
│   ├── data-display/      # Visualización datos (4)
│   ├── forms/             # Controles formulario (10)
│   ├── layout/            # Layout (5)
│   └── modals/            # Modales genéricos
├── constants/              # Constantes
├── features/               # Módulos por feature (19)
│   ├── accounting/
│   ├── admin-finance/
│   ├── analytics/
│   ├── audit-system/
│   ├── auth/
│   ├── configuracion/
│   ├── cumplimiento/
│   ├── dashboard/
│   ├── gestion-estrategica/  # 55 archivos (MÁS GRANDE)
│   ├── hseq/                 # 14 archivos
│   ├── logistics-fleet/
│   ├── production-ops/
│   ├── proveedores/          # LEGACY (migrar)
│   ├── riesgos/
│   ├── sales-crm/
│   ├── supply-chain/         # NUEVO (migración destino)
│   ├── talent-hub/
│   ├── users/
│   └── workflows/
├── hooks/                  # Hooks globales (12)
├── layouts/                # Layouts principales (4)
├── lib/                    # Configuraciones terceros
├── pages/                  # Páginas top-level (3)
├── routes/                 # Configuración rutas
├── store/                  # Estado global Zustand (2)
├── types/                  # Tipos TypeScript (9)
├── utils/                  # Utilidades (4)
├── App.tsx
└── main.tsx
```

---

### Jerarquía Pages → Features → Components

```
Level 1: Top-Level Pages (3)
└── pages/DashboardPage, LoginPage, NotFoundPage

Level 2: Feature Pages (77 páginas en 19 módulos)
└── features/[module]/pages/[Module]Page.tsx

Level 3: Feature Components (containers/secciones)
└── features/[module]/components/*Tab.tsx, *Section.tsx

Level 4: Shared Components (68)
└── components/common/, forms/, layout/
```

---

### Inventario de Componentes

| Categoría | Cantidad |
|-----------|----------|
| **Total Producción** | 262 |
| Top-level Pages | 3 |
| Feature Pages | 77 |
| Feature Components | 113+ |
| Shared Components | 68 |
| Layout Components | 4 |

**Por Feature (Top 5):**
| Módulo | Archivos |
|--------|----------|
| gestion-estrategica | 55 |
| cumplimiento | ~25 |
| riesgos | ~20 |
| sales-crm | ~18 |
| analytics | ~15 |

---

### Componentes >300 líneas (Candidatos a Dividir)

#### 🔴 CRÍTICO (>1000 líneas) - 9 componentes

| Archivo | Líneas | Módulo |
|---------|--------|--------|
| EmergenciasPage.tsx | 1,412 | hseq |
| MedicinaLaboralPage.tsx | 1,388 | hseq |
| SeguridadIndustrialPage.tsx | 1,274 | hseq |
| PlanificacionSistemaPage.tsx | 1,190 | hseq |
| AccidentalidadPage.tsx | 1,172 | hseq |
| SistemaDocumentalPage.tsx | 1,147 | hseq |
| CalidadPage.tsx | 1,128 | hseq |
| RiesgosOportunidadesTab.tsx | 1,084 | riesgos |
| GestionComitesPage.tsx | 1,001 | hseq |

**Patrón:** Todos los críticos están en **módulo HSEQ** - necesita refactorización arquitectónica.

#### 🟠 ALTO (700-1000 líneas) - 5 componentes

| Archivo | Líneas |
|---------|--------|
| CargoFormModal.tsx | 863 |
| ProveedorForm.tsx | 810 |
| ValoresDragDrop.tsx | 799 |
| AccionesIndicadorPage.tsx | 752 |
| IPEVRTab.tsx | 730 |

---

### Componentes Duplicados

**🔴 Duplicados Confirmados:**

| Componente | Ubicación 1 | Ubicación 2 |
|------------|-------------|-------------|
| ProveedorForm.tsx | features/proveedores/ (810 líneas) | features/supply-chain/ (464 líneas) |
| PruebaAcidezForm.tsx | features/proveedores/ | features/supply-chain/ |
| PruebaAcidezTable.tsx | features/proveedores/ | features/supply-chain/ |
| ProveedoresTable.tsx | features/proveedores/ | features/supply-chain/ |
| Progress (inline) | 5 páginas HSEQ | - |

**Causa:** Migración legacy `proveedores/` → `supply-chain/` incompleta.

**🟡 Oportunidades de Unificación:**

| Tipo | Cantidad | Recomendación |
|------|----------|---------------|
| Tablas (*Table.tsx) | 11 | Crear `<DataTable />` genérico |
| Modales (*FormModal.tsx) | 32 | Crear `<FormModal />` wrapper |
| Tabs (*Tab.tsx) | 30+ | Estandarizar `<TabContainer />` |

---

## B. CUSTOM HOOKS

### Catálogo de Hooks

**Total: 87 hooks**

#### Hooks Core (`/src/hooks/`) - 10 hooks

| Hook | Líneas | Descripción |
|------|--------|-------------|
| **usePermissions.ts** | 355 | RBAC v4.0 - permisos granulares |
| **useGenericCRUD.ts** | 321 | CRUD genérico con React Query |
| **useTimeElapsed.ts** | 324 | Cálculo tiempo transcurrido |
| **useSignature.ts** | 206 | Firma digital |
| **useIcons.ts** | 210 | Registro dinámico de íconos |
| **useDynamicTheme.ts** | 177 | Tema dinámico CSS |
| **useModuleColor.ts** | 155 | Colores por módulo |
| **useBrandingConfig.ts** | 122 | Configuración branding |
| **useLastRoute.ts** | 121 | Persistencia de rutas |
| **useFormModal.ts** | 96 | Estado modales CRUD |

#### Hooks por Feature - 75+ hooks

**gestion-estrategica (11 hooks):**
| Hook | Líneas | Complejidad |
|------|--------|-------------|
| useStrategic.ts | 1,064 | 🔴 DIVIDIR |
| usePoliticas.ts | 917 | ⚠️ Alta |
| useModules.ts | 503 | ⚠️ Alta |
| useWorkflowFirmas.ts | ~200 | Normal |
| useAreas.ts | - | Normal |

**hseq (11 hooks):**
| Hook | Líneas |
|------|--------|
| useMedicinaLaboral.ts | 1,216 |
| useEmergencias.ts | 1,044 |
| useSistemaDocumental.ts | 920 |
| useCalidad.ts | 875 |
| usePlanificacion.ts | 862 |

**configuracion, users, talent-hub, supply-chain, sales-crm, riesgos, cumplimiento:**
Cada módulo tiene hooks dedicados siguiendo patrón estándar CRUD.

---

### Organización de Hooks

**✅ Fortalezas:**
- Hooks core en `/hooks/`
- Hooks de feature en `/features/[module]/hooks/`
- Hooks de modales en `/components/modals/`
- Nomenclatura consistente (`use*`)
- Full TypeScript

**⚠️ Problemas:**

| Problema | Hook | Líneas | Acción |
|----------|------|--------|--------|
| Demasiado grande | useStrategic.ts | 1,064 | DIVIDIR en 6-7 hooks |
| Demasiado grande | usePoliticas.ts | 917 | Considerar división |
| Demasiado grande | useMedicinaLaboral.ts | 1,216 | DIVIDIR |
| Confusión nombres | usePermissions.ts (2 archivos) | - | Renombrar uno |

---

## C. GESTIÓN DE ESTADO

### Soluciones Implementadas

```
┌─────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA DE ESTADO                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌────────────────────────────────────┐ │
│  │   Zustand   │     │         TanStack Query             │ │
│  │  (Global)   │     │        (Server State)              │ │
│  ├─────────────┤     ├────────────────────────────────────┤ │
│  │ authStore   │     │ 1,827 queries en 76 archivos       │ │
│  │ themeStore  │     │ 17 módulos con hooks dedicados     │ │
│  │ (2 stores)  │     │ Caché 5 min, refetch inteligente   │ │
│  └─────────────┘     └────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              React Local State (useState)               │ │
│  │       167 ocurrencias en 104 componentes                │ │
│  │       UI toggles, forms, filtros, estados temp          │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

### Zustand Stores (Estado Global)

**authStore.ts (86 líneas):**
```typescript
{
  user: User | null,
  accessToken: string | null,
  refreshToken: string | null,
  isAuthenticated: boolean,
  // Methods: login(), logout(), refreshProfile(), setUser()
}
```

**themeStore.ts (44 líneas):**
```typescript
{
  theme: 'light' | 'dark',
  // Methods: toggleTheme(), setTheme()
}
```

**✅ Excelente:** Solo 2 stores, estado global mínimo.

---

### TanStack Query (Estado Servidor)

**Configuración:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    }
  }
});
```

**Query Keys organizados:**
```typescript
export const strategicKeys = {
  identities: ['identities'] as const,
  identity: (id: number) => ['identity', id] as const,
  activeIdentity: ['identity', 'active'] as const,
  // ... 30+ keys organizadas
};
```

---

### Prop Drilling

**✅ NO HAY PROP DRILLING SIGNIFICATIVO**

Los componentes acceden datos directamente via hooks:
```typescript
// Cada componente obtiene sus datos
const { data: identity } = useActiveIdentity();
const { canDo } = usePermissions();
const user = useAuthStore((state) => state.user);
```

---

## D. INTEGRACIÓN CON BACKEND

### Librería HTTP: Axios

**Configuración:** `src/api/axios-config.ts`

```typescript
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});
```

---

### Configuración URLs

**✅ Centralizado:**
```typescript
// src/utils/constants.ts
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
```

**✅ Sin URLs hardcodeadas** en componentes.

---

### Interceptores

**Request Interceptor:**
```typescript
// Agrega JWT token automáticamente
const token = localStorage.getItem('access_token');
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

**Response Interceptor:**
- 401 → Intenta refresh token
- Refresh exitoso → Reintenta request original
- Refresh fallido → Redirect a /login

---

### Autenticación Frontend

| Aspecto | Implementación |
|---------|----------------|
| **Token Storage** | localStorage |
| **Tokens** | access_token, refresh_token |
| **Envío en Requests** | Bearer token via interceptor |
| **Refresh** | Automático en 401 |
| **Logout** | Limpia localStorage + Zustand |

---

## E. PROBLEMAS DETECTADOS

### 1. Archivos Excesivamente Grandes

| Prioridad | Tipo | Cantidad | Acción |
|-----------|------|----------|--------|
| 🔴 CRÍTICO | Páginas >1000 líneas | 9 | Dividir en subcomponentes |
| 🟠 ALTO | Hooks >900 líneas | 6 | Dividir por dominio |
| 🟡 MEDIO | Componentes >500 líneas | 22 | Evaluar división |

**Módulo más afectado:** HSEQ (8 de 9 archivos críticos)

---

### 2. Tipos `any` (50+ instancias)

**Ubicaciones principales:**
- Error handlers: `catch (error: any)`
- Event handlers: `(value: any)`
- Metadata: `metadata?: any`

**Recomendación:** Usar `unknown` + type guards.

---

### 3. Duplicación de Código

| Problema | Cantidad | Acción |
|----------|----------|--------|
| Migración proveedores incompleta | 4 componentes | Completar migración |
| Progress component duplicado | 5 instancias | Extraer a common/ |
| Tablas similares | 11 | Crear DataTable genérico |
| Modales similares | 32 | Crear FormModal wrapper |

---

### 4. TODOs Pendientes (24+)

**Críticos (backend dependency):**
- `usePermissions.ts:230` - Roles de usuario
- `usePermissions.ts:241` - Grupos de usuario

**Features incompletos:**
- Export functionality en reglamentos
- Delete mutations en partes interesadas
- Modales en riesgos (9 instancias)

---

### 5. Console Statements (74+)

**Remover en producción:**
- `authStore.ts:68` - console.error
- `useDynamicTheme.ts:32,42` - console.warn

---

### 6. Falta i18n

Strings en español hardcodeados en toda la aplicación:
- Labels de botones
- Mensajes de estado
- Labels de formularios
- Títulos de secciones

---

## F. RECOMENDACIONES

### Prioridad CRÍTICA (Semana 1)

1. **Dividir páginas HSEQ**
   ```
   EmergenciasPage.tsx (1,412 líneas) →
   ├── EmergenciasDashboard.tsx
   ├── EmergenciasForm.tsx
   ├── PlanesEmergenciaTab.tsx
   ├── BrigadasTab.tsx
   └── SimulacrosTab.tsx
   ```
   - Estimado: 16 horas

2. **Completar migración supply-chain**
   - Eliminar `features/proveedores/`
   - Consolidar en `features/supply-chain/`
   - Estimado: 4 horas

3. **Dividir useStrategic.ts**
   ```
   useStrategic.ts (1,064 líneas) →
   ├── useIdentity.ts
   ├── usePlans.ts
   ├── useBranding.ts
   ├── useSedes.ts
   └── useAlcances.ts
   ```
   - Estimado: 8 horas

### Prioridad ALTA (Semana 2)

4. **Extraer componente Progress**
   - De 5 páginas HSEQ a `components/common/Progress.tsx`
   - Estimado: 2 horas

5. **Reemplazar tipos `any`**
   - Usar `unknown` en error handlers
   - Crear interfaces para metadata
   - Estimado: 4 horas

6. **Crear DataTable genérico**
   - Unificar 11 tablas similares
   - Estimado: 8 horas

### Prioridad MEDIA (Semana 3-4)

7. **Implementar i18n**
   - Instalar react-i18next
   - Crear archivos es-CO.json
   - Estimado: 16 horas

8. **Remover console statements**
   - 74+ instancias
   - Implementar logging service
   - Estimado: 4 horas

9. **Completar TODOs**
   - 24+ pendientes
   - Estimado: 16 horas

---

## G. MÉTRICAS DE CALIDAD

| Aspecto | Rating | Notas |
|---------|--------|-------|
| Elección State Management | ⭐⭐⭐⭐⭐ | Zustand + React Query perfecto |
| Organización Código | ⭐⭐⭐⭐⭐ | Feature-based excelente |
| Type Safety | ⭐⭐⭐⭐ | Mejorar `any` types |
| Performance | ⭐⭐⭐⭐⭐ | Caché optimizado |
| Consistencia | ⭐⭐⭐⭐⭐ | Patrones uniformes |
| Mantenibilidad | ⭐⭐⭐ | Archivos muy grandes |
| **Overall** | **⭐⭐⭐⭐** | **Muy bueno, necesita refactor HSEQ** |

---

## H. CONCLUSIÓN

**Estado General:** ✅ EXCELENTE arquitectura con problemas de tamaño de archivos

**Fortalezas:**
- ✅ Arquitectura feature-based moderna
- ✅ Estado global mínimo (2 stores Zustand)
- ✅ Excelente uso de React Query (1,827 queries)
- ✅ Sin prop drilling
- ✅ TypeScript completo
- ✅ Code splitting con React.lazy()
- ✅ Interceptores JWT automáticos
- ✅ 87 custom hooks bien organizados

**Debilidades:**
- 🔴 9 archivos >1000 líneas (todos HSEQ)
- 🔴 6 hooks >900 líneas
- ⚠️ 50+ tipos `any`
- ⚠️ Migración proveedores incompleta
- ⚠️ Falta i18n
- ⚠️ 24+ TODOs pendientes

**Esfuerzo de Corrección:**
- Crítico: 28 horas (dividir HSEQ + hooks)
- Alto: 14 horas (tipos, componentes)
- Total: ~70-90 horas

---

*Generado por Claude Code - Agente React Architect*
