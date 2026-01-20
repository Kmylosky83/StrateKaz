# Guía de Auditoría Funcional - StrateKaz

> **Versión:** 1.0
> **Fecha:** 19 Enero 2026
> **Basada en:** Auditorías de Configuración (6 secciones) y Avatar Dropdown (4 secciones)

---

## Principio Fundamental: Doble Verificación

**TODA auditoría debe incluir doble verificación obligatoria:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROCESO DE DOBLE VERIFICACIÓN                │
└─────────────────────────────────────────────────────────────────┘

FASE 1: Auditoría Inicial
├── Análisis de código fuente
├── Revisión de UI/UX
├── Identificación de brechas
└── Documentación de hallazgos

FASE 2: Verificación Cruzada (OBLIGATORIA)
├── Confirmar cada brecha detectada
├── Buscar brechas adicionales no detectadas
├── Validar que las soluciones propuestas son correctas
└── Actualizar documentación con verificación

RESULTADO: Solo se confirman brechas verificadas en ambas fases
```

**Razón:** La doble verificación previene:
- Falsos positivos (reportar brechas inexistentes)
- Falsos negativos (no detectar brechas reales)
- Soluciones incorrectas o incompletas

---

## Estructura de una Auditoría

### 1. Encabezado Estándar

```markdown
# AUDITORÍA FUNCIONAL: [Nombre del Módulo/Sección]

> **Fecha:** DD MMM AAAA
> **Auditor:** [Nombre o ID]
> **Versión del Sistema:** X.X.X
> **Estado:** ⏳ En Progreso | ✅ Verificado | 🔄 Requiere Re-auditoría

## Resumen Ejecutivo

| Métrica | Valor |
|---------|-------|
| Archivos analizados | X |
| Brechas detectadas | X |
| Brechas confirmadas (doble verificación) | X |
| Prioridad Alta | X |
| Prioridad Media | X |
| Prioridad Baja | X |
| Esfuerzo total estimado | Xh |
```

### 2. Secciones de Análisis

Cada módulo debe analizarse en las siguientes dimensiones:

---

## Dimensión 1: Análisis de Modales

### Checklist de Modales

| Criterio | Verificación | Estándar |
|----------|--------------|----------|
| **Tamaño apropiado** | ¿El modal tiene tamaño suficiente para su contenido? | `sm` (480px), `md` (640px), `lg` (768px), `xl` (896px), `2xl` (1024px), `3xl` (1152px) |
| **Responsive** | ¿Funciona en mobile/tablet? | `max-h-[95vh]` mobile, `max-h-[90vh]` desktop |
| **Scroll indicators** | ¿Tiene indicadores de scroll si el contenido es largo? | Sombras gradient top/bottom |
| **Padding responsive** | ¿El padding se adapta al viewport? | `p-4 sm:p-6` |
| **Cierre accesible** | ¿Se puede cerrar con X, Escape, click outside? | Todos los métodos |
| **Loading state** | ¿Muestra spinner durante operaciones? | Spinner en botón submit |
| **Error handling** | ¿Muestra errores de validación? | Toast + inline errors |

### Ejemplo de Hallazgo

```markdown
### MS-001: Tamaño de Modal Insuficiente

**Ubicación:** `components/modals/SedeFormModal.tsx`
**Severidad:** 🟡 MEDIA
**Estado verificación:** ✅ Confirmado en doble verificación

**Problema:**
Modal usa `size="md"` (640px) pero tiene 8+ campos que causan scroll excesivo.

**Evidencia:**
- Línea 45: `<BaseModal size="md" ...>`
- Campos: nombre, dirección, ciudad, teléfono, email, GPS, responsable, estado

**Solución:**
Cambiar a `size="3xl"` (1152px) o `size="lg"` (768px) mínimo.

**Esfuerzo:** 1-2h
```

---

## Dimensión 2: Análisis de Hooks (React Query)

### Checklist de Hooks

| Criterio | Verificación | Estándar |
|----------|--------------|----------|
| **Query keys consistentes** | ¿Usa factory de query keys? | `QUERY_KEYS.entity.list()` |
| **staleTime apropiado** | ¿El cache expira correctamente? | 30s-5min según volatilidad |
| **Invalidación correcta** | ¿Se invalida cache tras mutaciones? | `queryClient.invalidateQueries()` |
| **Error handling** | ¿Maneja errores con toast? | `onError: () => toast.error()` |
| **Loading states** | ¿Expone `isLoading`, `isPending`? | Destructuring completo |
| **Optimistic updates** | ¿Usa updates optimistas donde aplica? | Para UX crítica |
| **Retry policy** | ¿Tiene política de reintentos? | `retry: 3` default |

### Patrón Estándar de Hook

```typescript
// Query keys factory
export const ENTITY_QUERY_KEYS = {
  all: ['entity'] as const,
  list: () => [...ENTITY_QUERY_KEYS.all, 'list'] as const,
  detail: (id: number) => [...ENTITY_QUERY_KEYS.all, 'detail', id] as const,
};

// Hook de listado
export const useEntities = () => {
  return useQuery({
    queryKey: ENTITY_QUERY_KEYS.list(),
    queryFn: entityApi.getAll,
    staleTime: 30 * 1000, // 30 segundos
  });
};

// Hook de mutación
export const useCreateEntity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: entityApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTITY_QUERY_KEYS.list() });
      toast.success('Entidad creada correctamente');
    },
    onError: () => {
      toast.error('Error al crear la entidad');
    },
  });
};
```

### Ejemplo de Hallazgo

```markdown
### MH-001: Hook sin Invalidación de Cache

**Ubicación:** `hooks/useProveedores.ts:45`
**Severidad:** 🔴 ALTA
**Estado verificación:** ✅ Confirmado en doble verificación

**Problema:**
`useDeleteProveedor` no invalida el cache de la lista tras eliminar.

**Evidencia:**
```typescript
// Actual (incorrecto)
return useMutation({
  mutationFn: proveedorApi.delete,
  onSuccess: () => toast.success('Eliminado'),
});
```

**Solución:**
```typescript
// Correcto
return useMutation({
  mutationFn: proveedorApi.delete,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: PROVEEDOR_KEYS.list() });
    toast.success('Eliminado');
  },
});
```

**Esfuerzo:** 30min
```

---

## Dimensión 3: Análisis de Componentes UI

### Checklist de Componentes

| Criterio | Verificación | Estándar |
|----------|--------------|----------|
| **PageHeader presente** | ¿Todas las páginas tienen header consistente? | `<SectionHeader>` o `<PageHeader>` |
| **Componentes reutilizables** | ¿Usa componentes de `@/components/common`? | Card, Button, Spinner, etc. |
| **Props tipadas** | ¿Tiene interface de props? | `interface ComponentProps {}` |
| **Estados de carga** | ¿Muestra skeleton/spinner? | `{isLoading && <Spinner />}` |
| **Estados vacíos** | ¿Muestra mensaje cuando no hay datos? | `<EmptyState />` |
| **Estados de error** | ¿Muestra mensaje de error? | `<ErrorAlert />` |
| **Accesibilidad** | ¿Tiene aria-labels, roles? | WCAG 2.1 AA |
| **Dark mode** | ¿Soporta tema oscuro? | `dark:` classes de Tailwind |

### Ejemplo de Hallazgo

```markdown
### MC-001: Página sin SectionHeader

**Ubicación:** `pages/ConfiguracionPage.tsx`
**Severidad:** 🟡 MEDIA
**Estado verificación:** ✅ Confirmado en doble verificación

**Problema:**
La página no tiene header consistente con el resto del sistema.

**Evidencia:**
- No hay `<SectionHeader>` ni `<PageHeader>` en el componente
- Otras páginas del módulo sí lo tienen

**Solución:**
```tsx
<SectionHeader
  title="Configuración"
  description="Gestiona la configuración del sistema"
  icon={<Settings className="h-6 w-6" />}
  variant="large"
/>
```

**Esfuerzo:** 30min
```

---

## Dimensión 4: Análisis de API/Backend

### Checklist de Endpoints

| Criterio | Verificación | Estándar |
|----------|--------------|----------|
| **RBAC implementado** | ¿Tiene `permission_classes`? | `GranularActionPermission` |
| **section_code definido** | ¿ViewSet tiene section_code para RBAC? | `section_code = 'modulo.seccion'` |
| **Validaciones** | ¿Serializer valida datos? | `validate_campo()` methods |
| **Paginación** | ¿Endpoints de lista paginan? | `PageNumberPagination` |
| **Filtros** | ¿Soporta filtros útiles? | `django-filter` |
| **Documentación** | ¿Tiene docstrings para OpenAPI? | `@extend_schema` decorators |
| **Tests** | ¿Tiene tests unitarios? | `test_viewset.py` |

### Ejemplo de Hallazgo

```markdown
### MA-001: Endpoint sin RBAC

**Ubicación:** `viewsets.py:ProveedorViewSet`
**Severidad:** 🔴 ALTA
**Estado verificación:** ✅ Confirmado en doble verificación

**Problema:**
ViewSet no tiene `section_code` definido, RBAC no puede verificar permisos.

**Evidencia:**
```python
class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
    # Falta: section_code = 'supply_chain.proveedores'
```

**Solución:**
```python
class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'supply_chain.proveedores'
```

**Esfuerzo:** 1h
```

---

## Dimensión 5: Análisis de Validaciones

### Checklist de Validaciones

| Criterio | Verificación | Estándar |
|----------|--------------|----------|
| **Validación frontend** | ¿Zod schema valida antes de enviar? | `zodResolver(schema)` |
| **Validación backend** | ¿Serializer valida en servidor? | `validate_*` methods |
| **Mensajes de error claros** | ¿Los errores son entendibles? | Español, específicos |
| **Validaciones de negocio** | ¿Se validan reglas de negocio? | NIT, fechas, rangos |
| **Feedback visual** | ¿Campos inválidos se marcan? | `border-red-500` |

### Ejemplo de Hallazgo

```markdown
### MV-001: Validación NIT Solo en Backend

**Ubicación:** `EmpresaSection.tsx`, `serializers.py`
**Severidad:** 🟡 MEDIA
**Estado verificación:** ✅ Confirmado en doble verificación

**Problema:**
El NIT se valida solo en backend, causando round-trip innecesario.

**Evidencia:**
- Frontend: Sin validación de formato NIT
- Backend: `validate_nit()` en serializer

**Solución:**
Agregar validación frontend con algoritmo módulo 11 DIAN:

```typescript
const validateNIT = (nit: string): boolean => {
  // Algoritmo módulo 11 DIAN
  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  // ... implementación
};
```

**Esfuerzo:** 2-3h
```

---

## Dimensión 6: Análisis de UX/Redundancias

### Checklist de UX

| Criterio | Verificación | Estándar |
|----------|--------------|----------|
| **Sin redundancias UI** | ¿Hay controles duplicados? | 0 redundancias |
| **Navegación consistente** | ¿El flujo es predecible? | Breadcrumbs, back buttons |
| **Feedback de acciones** | ¿Toda acción tiene feedback? | Toast success/error |
| **Confirmación destructiva** | ¿Eliminar pide confirmación? | `<ConfirmDialog>` |
| **Estados de transición** | ¿Se muestra progreso? | Loading indicators |
| **Responsive** | ¿Funciona en todos los viewports? | Mobile-first |

### Ejemplo de Hallazgo

```markdown
### MU-001: Control de Tema Duplicado

**Ubicación:** `Header.tsx`, `PreferenciasPage.tsx`
**Severidad:** 🟡 MEDIA
**Estado verificación:** ✅ Confirmado en doble verificación

**Problema:**
El toggle de modo oscuro aparece en dos lugares:
1. Header (icono sol/luna)
2. Preferencias > Apariencia

**Solución:**
Eliminar de PreferenciasPage, mantener solo en Header (más accesible).

**Esfuerzo:** 1h
```

---

## Dimensión 7: Análisis de TypeScript

### Checklist de TypeScript

| Criterio | Verificación | Estándar |
|----------|--------------|----------|
| **Sin `any`** | ¿Evita tipos `any`? | 0 any en código nuevo |
| **Interfaces definidas** | ¿Tipos en archivos `.types.ts`? | `feature/types/*.types.ts` |
| **DTOs tipados** | ¿Create/Update DTOs definidos? | `CreateEntityDTO`, `UpdateEntityDTO` |
| **Props tipadas** | ¿Componentes tienen interface Props? | `interface ComponentProps` |
| **Return types** | ¿Funciones tienen return type? | Explícito o inferido |
| **Null safety** | ¿Maneja nullables correctamente? | Optional chaining `?.` |

### Ejemplo de Hallazgo

```markdown
### MT-001: Tipo `any` en Response

**Ubicación:** `api/proveedorApi.ts:23`
**Severidad:** 🟡 MEDIA
**Estado verificación:** ✅ Confirmado en doble verificación

**Problema:**
```typescript
export const getProveedores = async (): Promise<any[]> => {
```

**Solución:**
```typescript
export const getProveedores = async (): Promise<Proveedor[]> => {
```

**Esfuerzo:** 30min
```

---

## Plantilla de Reporte de Auditoría

```markdown
# AUDITORÍA FUNCIONAL: [Módulo]

> **Fecha inicial:** DD MMM AAAA
> **Fecha doble verificación:** DD MMM AAAA
> **Auditor:** [ID]
> **Versión:** X.X.X
> **Estado:** ✅ VERIFICADO

---

## Resumen Ejecutivo

| Métrica | Valor |
|---------|-------|
| Archivos analizados | X |
| Brechas detectadas (fase 1) | X |
| Brechas confirmadas (fase 2) | X |
| Falsos positivos descartados | X |
| Prioridad Alta | X |
| Prioridad Media | X |
| Prioridad Baja | X |
| Esfuerzo total | Xh |

---

## Hallazgos Confirmados

### 🔴 ALTA PRIORIDAD

| ID | Descripción | Ubicación | Esfuerzo |
|----|-------------|-----------|----------|
| XX-001 | ... | ... | Xh |

### 🟡 MEDIA PRIORIDAD

| ID | Descripción | Ubicación | Esfuerzo |
|----|-------------|-----------|----------|
| XX-002 | ... | ... | Xh |

### 🟢 BAJA PRIORIDAD

| ID | Descripción | Ubicación | Esfuerzo |
|----|-------------|-----------|----------|
| XX-003 | ... | ... | Xh |

---

## Detalle de Hallazgos

### XX-001: [Título]

**Severidad:** 🔴 ALTA
**Estado verificación:** ✅ Confirmado en doble verificación
**Ubicación:** `path/to/file.ts:línea`

**Problema:**
[Descripción del problema]

**Evidencia:**
[Código o screenshot]

**Solución propuesta:**
[Código corregido o pasos]

**Esfuerzo:** Xh

---

## Notas de Doble Verificación

- [X] Fase 1 completada: DD/MM/AAAA
- [X] Fase 2 completada: DD/MM/AAAA
- [X] Falsos positivos identificados y descartados
- [X] Brechas adicionales encontradas en fase 2: X

### Brechas descartadas (falsos positivos)

| ID temporal | Razón de descarte |
|-------------|-------------------|
| ... | ... |

---

## Checklist Pre-Cierre

- [ ] Todos los hallazgos tienen ID único
- [ ] Todos los hallazgos tienen ubicación exacta (archivo:línea)
- [ ] Todos los hallazgos tienen solución propuesta
- [ ] Todos los hallazgos tienen esfuerzo estimado
- [ ] Doble verificación documentada
- [ ] Sin falsos positivos en reporte final

---

*Auditoría completada: DD MMM AAAA*
*Próxima re-auditoría sugerida: DD MMM AAAA (post-implementación)*
```

---

## Flujo de Trabajo Recomendado

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE AUDITORÍA COMPLETO                  │
└─────────────────────────────────────────────────────────────────┘

1. PREPARACIÓN (30min)
   ├── Identificar scope del módulo
   ├── Listar archivos a analizar
   └── Preparar plantilla de reporte

2. FASE 1: ANÁLISIS INICIAL (2-4h por módulo)
   ├── Revisar cada dimensión (7 dimensiones)
   ├── Documentar hallazgos candidatos
   └── Asignar severidad tentativa

3. PAUSA (24h recomendado)
   └── Permitir "ojos frescos" para fase 2

4. FASE 2: DOBLE VERIFICACIÓN (1-2h por módulo)
   ├── Re-revisar cada hallazgo
   ├── Confirmar o descartar
   ├── Buscar brechas no detectadas
   └── Ajustar severidades

5. DOCUMENTACIÓN FINAL (1h)
   ├── Consolidar hallazgos confirmados
   ├── Calcular esfuerzo total
   └── Priorizar implementación

6. REVISIÓN DE PARES (opcional, 30min)
   └── Otro desarrollador valida hallazgos críticos
```

---

## Priorización de Hallazgos

| Prioridad | Criterio | Acción |
|-----------|----------|--------|
| 🔴 **ALTA** | Seguridad, pérdida de datos, bloquea usuarios | Sprint actual |
| 🟡 **MEDIA** | UX degradada, inconsistencias, deuda técnica | Próximo sprint |
| 🟢 **BAJA** | Mejoras nice-to-have, optimizaciones menores | Backlog |

---

## Referencias

- [MEJORAS_CONFIGURACION_FASE1.md](../plans/MEJORAS_CONFIGURACION_FASE1.md) - Ejemplo de auditoría de Configuración
- [AUDITORIA_AVATAR_DROPDOWN.md](../plans/AUDITORIA_AVATAR_DROPDOWN.md) - Ejemplo de auditoría de Avatar Dropdown
- [PLAN_IMPLEMENTACION_FASE1_COMPLETO.md](../plans/PLAN_IMPLEMENTACION_FASE1_COMPLETO.md) - Consolidación de auditorías

---

*Guía creada: 19 Enero 2026*
*Basada en metodología aplicada en Sprints 1-4 de StrateKaz*
