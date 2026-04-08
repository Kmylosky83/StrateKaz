# Convenciones de Naming — snake_case vs kebab-case vs camelCase vs PascalCase

## Regla General por Contexto

| Contexto | Estilo | Ejemplo | Por qué |
|----------|--------|---------|---------|
| **URLs de API** (rutas HTTP) | `kebab-case` | `/api/riesgos/riesgos-viales/cambiar-estado/` | Estándar HTTP/REST universal |
| **Python** (funciones, variables, campos) | `snake_case` | `def cambiar_estado(self, request):` | PEP 8 |
| **Python** (clases) | `PascalCase` | `class RiesgoVialViewSet` | PEP 8 |
| **Django models** (campos DB) | `snake_case` | `fecha_implementacion = DateField()` | PEP 8 + Django convention |
| **Django router register** | `kebab-case` | `router.register(r'riesgos-viales', ...)` | URLs REST |
| **DRF @action url_path** | `kebab-case` | `url_path='cambiar-estado'` | URLs REST |
| **DRF @action método Python** | `snake_case` | `def cambiar_estado(...)` | PEP 8 |
| **TypeScript** (variables, funciones) | `camelCase` | `const cambiarEstado = async (id) => ...` | TS/JS convention |
| **TypeScript** (interfaces, types, components) | `PascalCase` | `interface RiesgoVial { ... }` | TS/React convention |
| **TypeScript** (constantes globales) | `UPPER_SNAKE_CASE` | `const BASE_URL = '/riesgos'` | Convention |
| **Frontend URL strings** (en API calls) | `kebab-case` | `` `${BASE_URL}/cambiar-estado/` `` | Debe coincidir con BE |
| **Frontend carpetas features** | `kebab-case` | `features/talent-hub/`, `features/sales-crm/` | Convention proyecto |
| **Frontend archivos componentes** | `PascalCase` | `RiesgoFormModal.tsx` | React convention |
| **Frontend archivos API/hooks** | `camelCase` | `riesgosApi.ts`, `useRiesgos.ts` | Convention proyecto |
| **Campos JSON en request/response** | `snake_case` | `{ "fecha_implementacion": "2026-01-01" }` | DRF serializer default |
| **Query params** | `snake_case` | `?tipo_riesgo=alto&estado=activo` | DRF filter convention |
| **HTML/CSS classes** | `kebab-case` | `class="btn-primary text-danger-600"` | Tailwind/CSS convention |
| **Git branches** | `kebab-case` | `feat/risk-matrix`, `fix/auth-bug` | Convention proyecto |
| **Commit messages** | Conventional Commits | `feat(riesgos): add risk matrix` | CI requirement |

---

## El Problema Específico: DRF @action y url_path
> Fuente de verdad detallada: [audit-api-sync.md](audit-api-sync.md) — módulos afectados y fixes aplicados.

Django REST Framework genera URLs de `@action` usando el **nombre del método Python**, que es `snake_case`:

```python
@action(detail=True, methods=['post'])
def cambiar_estado(self, request, pk=None):
    # DRF genera: /api/.../cambiar_estado/  ← SNAKE_CASE en la URL
```

Pero las URLs REST deben ser `kebab-case`. Sin `url_path` explícito, hay un **mismatch silencioso** entre lo que el FE llama y lo que el BE sirve → **404**.

### Regla obligatoria (aplicada desde Sprint AUDIT-SYNC, 2026-03-05)

```python
# ✅ SIEMPRE agregar url_path='kebab-case' en @action con nombre multi-palabra
@action(detail=True, methods=['post'], url_path='cambiar-estado')
def cambiar_estado(self, request, pk=None):
    # DRF genera: /api/.../cambiar-estado/  ← KEBAB-CASE correcto
```

**Excepción:** Métodos de una sola palabra (`estadisticas`, `aprobar`, `reorder`) no necesitan `url_path` porque no hay guión que convertir.

### Checklist al crear un nuevo @action

1. [ ] Nombre del método Python: `snake_case` (PEP 8)
2. [ ] `url_path='kebab-case'` si el nombre tiene más de una palabra
3. [ ] Frontend API call usa exactamente el mismo `kebab-case` del `url_path`
4. [ ] Si el action usa regex params: `url_path='por-riesgo/(?P<riesgo_id>[^/.]+)'`

---

## Campos de Modelo → Serializer → TypeScript

El flujo de un nombre de campo a través del stack:

```
Django Model (snake_case)     →  DRF Serializer (snake_case)  →  JSON response (snake_case)  →  TS type (snake_case)
fecha_implementacion: Date    →  fecha_implementacion          →  "fecha_implementacion"       →  fecha_implementacion: string
```

**NUNCA** transformar snake_case a camelCase en el JSON. DRF envía snake_case, el frontend lo recibe snake_case, y los tipos TS lo declaran snake_case.

```typescript
// ✅ CORRECTO — snake_case en los campos, coincide con serializer
interface RiesgoVial {
  id: number;
  fecha_identificacion: string;
  tipo_riesgo: number;
  nivel_riesgo: string;
}

// ❌ MAL — camelCase en campos, no coincide con lo que devuelve el BE
interface RiesgoVial {
  id: number;
  fechaIdentificacion: string;  // el BE devuelve fecha_identificacion
  tipoRiesgo: number;           // el BE devuelve tipo_riesgo
}
```

### Excepción: variables TS internas

Las variables TypeScript internas (NO campos de API) sí usan camelCase:

```typescript
const riesgoActual = riesgos.find(r => r.id === selectedId);  // camelCase
const fechaFormateada = formatDate(riesgoActual.fecha_identificacion);  // camelCase
```

---

## Resumen Visual

```
                  BACKEND                           FRONTEND
                  ───────                           ────────
Clases:           PascalCase                        PascalCase (components, types)
Funciones:        snake_case                        camelCase
Variables:        snake_case                        camelCase
Campos modelo:    snake_case                        snake_case (en types, iguala BE)
URLs:             kebab-case (url_path)             kebab-case (API calls)
Archivos:         snake_case (Python)               PascalCase (.tsx) / camelCase (.ts)
Carpetas:         snake_case (Django apps)          kebab-case (features/)
```
