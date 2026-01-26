# Modales de Formulario PESTEL y Porter - Sprint 2

**Sistema de Gestión StrateKaz - Contexto Organizacional**

Este documento describe los 3 modales de formulario creados para el análisis PESTEL y las 5 Fuerzas de Porter en el módulo de Gestión Estratégica.

---

## 📋 Índice

1. [AnalisisPestelFormModal](#1-analisispestelformmodal)
2. [FactorPestelFormModal](#2-factorpestelformmodal)
3. [FuerzaPorterFormModal](#3-fuerzaporterformmodal)
4. [Integración con Componentes](#4-integración-con-componentes)
5. [Validaciones y Reglas de Negocio](#5-validaciones-y-reglas-de-negocio)

---

## 1. AnalisisPestelFormModal

### 📁 Ubicación
```
frontend/src/features/gestion-estrategica/components/modals/AnalisisPestelFormModal.tsx
```

### 🎯 Propósito
Modal completo con **tabs** para gestionar análisis PESTEL (Político, Económico, Social, Tecnológico, Ecológico, Legal), similar al patrón usado en `AnalisisDofaFormModal`.

### 📦 Props

```typescript
interface AnalisisPestelFormModalProps {
  analisis: AnalisisPESTEL | null;  // null = crear, objeto = editar
  isOpen: boolean;
  onClose: () => void;
}
```

### 🏗️ Estructura

**Tab 1: Datos Básicos**
- Nombre del análisis (min 10, max 200 caracteres)
- Fecha de análisis (date picker)
- Periodo (ej: "2026-Q1", "2026 Anual")
- Responsable (select de áreas)
- Conclusiones generales (textarea, max 2000 caracteres)

**Tab 2: Factores** (solo visible en modo edición)
- Estadísticas por tipo (6 cuadrantes: P/E/S/T/E/L)
- Lista de factores con filtros por tipo
- Formulario inline para agregar/editar factores
- Botones de editar/eliminar por factor
- Protección: solo editable en estado "borrador"

### 🎨 Características Visuales

- **6 Cuadrantes con colores distintivos:**
  - 🟣 Político (purple)
  - 🟢 Económico (green)
  - 🔵 Social (blue)
  - 🔷 Tecnológico (cyan)
  - 🟩 Ecológico (emerald)
  - 🟡 Legal (amber)

- **Badges de estado:**
  - Borrador, En Revisión, Aprobado, Vigente, Archivado

### 🔧 Hooks Utilizados
```typescript
import {
  useCreateAnalisisPestel,
  useUpdateAnalisisPestel,
  useAnalisisPestelDetail,
  useFactoresPestel,
  useCreateFactorPestel,
  useUpdateFactorPestel,
  useDeleteFactorPestel,
} from '../../hooks/useContexto';
```

### 📝 Ejemplo de Uso

```typescript
import { AnalisisPestelFormModal } from '@/features/gestion-estrategica/components/modals';

function MiComponente() {
  const [isOpen, setIsOpen] = useState(false);
  const [analisisActual, setAnalisisActual] = useState<AnalisisPESTEL | null>(null);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Nuevo Análisis PESTEL
      </Button>

      <AnalisisPestelFormModal
        analisis={analisisActual}
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setAnalisisActual(null);
        }}
      />
    </>
  );
}
```

---

## 2. FactorPestelFormModal

### 📁 Ubicación
```
frontend/src/features/gestion-estrategica/components/modals/FactorPestelFormModal.tsx
```

### 🎯 Propósito
Modal **standalone** para crear/editar un factor PESTEL individual. Diseñado para ser llamado desde la **matriz PESTEL** cuando el usuario hace click en un cuadrante o en "Agregar factor".

### 📦 Props

```typescript
interface FactorPestelFormModalProps {
  factor: FactorPESTEL | null;       // null = crear, objeto = editar
  analisisId?: number;                // Pre-setear análisis (opcional)
  tipoInicial?: TipoFactorPESTEL;    // Pre-seleccionar tipo (desde cuadrante)
  isOpen: boolean;
  onClose: () => void;
}
```

### 🏗️ Campos del Formulario

1. **Tipo de Factor** (select visual con iconos)
   - Político 🏛️
   - Económico 💰
   - Social 👥
   - Tecnológico 💻
   - Ecológico 🌿
   - Legal ⚖️

2. **Descripción** (textarea, min 20, max 500 caracteres)
   - Descripción detallada del factor externo

3. **Evaluación del Factor:**
   - **Tendencia** (select con iconos):
     - Mejorando 📈
     - Estable ➖
     - Empeorando 📉
   - **Impacto** (select con badges):
     - Alto 🔴, Medio 🟡, Bajo 🟢
   - **Probabilidad** (select con badges):
     - Alta 🔴, Media 🟡, Baja 🟢

4. **Implicaciones** (textarea opcional, max 1000 caracteres)
   - ¿Qué implica para la organización?

5. **Fuentes** (textarea opcional, max 500 caracteres)
   - Referencias, estudios consultados

### 🎨 Características Especiales

- **Preview en tiempo real:** Muestra cómo se verá el factor con todos sus badges
- **Select visual de tipo:** Grid 3x2 con iconos grandes y colores
- **Indicadores visuales:** Badges de impacto, probabilidad y tendencia con colores dinámicos

### ✅ Validación Zod

```typescript
const factorPestelSchema = z.object({
  analisis: z.number().min(1, 'Debe seleccionar un análisis'),
  tipo: z.enum(['politico', 'economico', 'social', 'tecnologico', 'ecologico', 'legal']),
  descripcion: z.string().min(20).max(500),
  tendencia: z.enum(['mejorando', 'estable', 'empeorando']),
  impacto: z.enum(['alto', 'medio', 'bajo']),
  probabilidad: z.enum(['alta', 'media', 'baja']),
  implicaciones: z.string().max(1000).optional(),
  fuentes: z.string().max(500).optional(),
});
```

### 📝 Ejemplo de Uso (desde PESTELMatrix)

```typescript
import { FactorPestelFormModal } from '@/features/gestion-estrategica/components/modals';
import { PESTELMatrix } from '@/features/gestion-estrategica/components/contexto';

function AnalisisPestelPage() {
  const [factorModal, setFactorModal] = useState({
    isOpen: false,
    factor: null as FactorPESTEL | null,
    tipoInicial: undefined as TipoFactorPESTEL | undefined,
  });

  const analisisId = 123; // ID del análisis actual

  return (
    <>
      <PESTELMatrix
        analisisId={analisisId}
        onEditFactor={(factor) => {
          setFactorModal({
            isOpen: true,
            factor,
            tipoInicial: undefined,
          });
        }}
        onAddFactor={(tipo) => {
          setFactorModal({
            isOpen: true,
            factor: null,
            tipoInicial: tipo, // Pre-selecciona el tipo del cuadrante clickeado
          });
        }}
      />

      <FactorPestelFormModal
        factor={factorModal.factor}
        analisisId={analisisId}
        tipoInicial={factorModal.tipoInicial}
        isOpen={factorModal.isOpen}
        onClose={() => {
          setFactorModal({
            isOpen: false,
            factor: null,
            tipoInicial: undefined,
          });
        }}
      />
    </>
  );
}
```

---

## 3. FuerzaPorterFormModal

### 📁 Ubicación
```
frontend/src/features/gestion-estrategica/components/modals/FuerzaPorterFormModal.tsx
```

### 🎯 Propósito
Modal para crear/editar una de las **5 Fuerzas de Porter**:
1. Rivalidad Competitiva ⚔️
2. Amenaza de Nuevos Entrantes 🚪
3. Amenaza de Sustitutos 🔄
4. Poder de Proveedores 🚚
5. Poder de Clientes 👥

### 📦 Props

```typescript
interface FuerzaPorterFormModalProps {
  fuerza: FuerzaPorter | null;      // null = crear, objeto = editar
  periodo?: string;                  // Pre-setear periodo (opcional)
  isOpen: boolean;
  onClose: () => void;
}
```

### 🏗️ Campos del Formulario

1. **Tipo de Fuerza** (select visual)
   - 5 botones grandes con iconos
   - Descripción dinámica según tipo seleccionado
   - Readonly en modo edición

2. **Nivel de Intensidad** (select visual con preview)
   - Alto 🔴 (Fuerte presión competitiva)
   - Medio 🟡 (Presión moderada)
   - Bajo 🟢 (Baja presión)

3. **Información del Análisis:**
   - Fecha de análisis (date picker)
   - Periodo (text input, ej: "2026-Q1")
   - Descripción (textarea, min 20, max 1000 caracteres)

4. **Factores Clave** (campo de lista dinámica)
   - Input + botón "Agregar factor"
   - Lista con botón eliminar por item
   - Mínimo 1 factor
   - Máximo 10 factores
   - Cada factor max 200 caracteres

5. **Implicaciones Estratégicas** (textarea opcional, max 1000 caracteres)

### 🎨 Características Especiales

- **Lista dinámica de factores:**
  - Input con enter para agregar
  - Contador visual de factores
  - Drag & drop (opcional para versión futura)

- **Preview del progress bar:** Según nivel seleccionado

- **Iconos distintivos por fuerza:**
  - Swords ⚔️, UserPlus 🚪, Repeat 🔄, Truck 🚚, Users 👥

### ✅ Validación Zod

```typescript
const fuerzaPorterSchema = z.object({
  tipo: z.enum(['rivalidad', 'nuevos_entrantes', 'sustitutos', 'poder_proveedores', 'poder_clientes']),
  nivel: z.enum(['alto', 'medio', 'bajo']),
  descripcion: z.string().min(20).max(1000),
  factores: z.array(z.string().max(200)).min(1).max(10),
  fecha_analisis: z.string().min(1),
  periodo: z.string().min(4).max(50),
  implicaciones_estrategicas: z.string().max(1000).optional(),
});
```

### 📝 Ejemplo de Uso

```typescript
import { FuerzaPorterFormModal } from '@/features/gestion-estrategica/components/modals';

function PorterAnalysisPage() {
  const [fuerzaModal, setFuerzaModal] = useState({
    isOpen: false,
    fuerza: null as FuerzaPorter | null,
  });

  return (
    <>
      <Button onClick={() => setFuerzaModal({ isOpen: true, fuerza: null })}>
        Nueva Fuerza de Porter
      </Button>

      <FuerzaPorterFormModal
        fuerza={fuerzaModal.fuerza}
        periodo="2026-Q1"
        isOpen={fuerzaModal.isOpen}
        onClose={() => setFuerzaModal({ isOpen: false, fuerza: null })}
      />
    </>
  );
}
```

---

## 4. Integración con Componentes

### 4.1. PESTELMatrix ↔️ FactorPestelFormModal

La matriz PESTEL tiene callbacks para editar y agregar factores:

```typescript
<PESTELMatrix
  analisisId={123}
  onEditFactor={(factor) => {
    // Abrir modal en modo edición
    openFactorModal(factor);
  }}
  onAddFactor={(tipo) => {
    // Abrir modal en modo creación con tipo pre-seleccionado
    openFactorModal(null, tipo);
  }}
  readOnly={false}
/>
```

### 4.2. PorterDiagram ↔️ FuerzaPorterFormModal

El diagrama de Porter puede tener callbacks similares:

```typescript
<PorterDiagram
  periodo="2026-Q1"
  onEditFuerza={(fuerza) => {
    openFuerzaModal(fuerza);
  }}
  onAddFuerza={(tipo) => {
    openFuerzaModal(null, tipo);
  }}
/>
```

---

## 5. Validaciones y Reglas de Negocio

### 5.1. AnalisisPestelFormModal

✅ **Validaciones:**
- Nombre: min 10, max 200 caracteres
- Periodo: min 4, max 50 caracteres (ej: "2026", "2026-Q1")
- Conclusiones: max 2000 caracteres (opcional)

🔒 **Reglas de Negocio:**
- Los factores solo pueden editarse si el análisis está en estado "borrador"
- Al crear un análisis, se crea en estado "borrador" por defecto
- Tab de factores solo visible en modo edición

### 5.2. FactorPestelFormModal

✅ **Validaciones:**
- Descripción: min 20, max 500 caracteres
- Implicaciones: max 1000 caracteres (opcional)
- Fuentes: max 500 caracteres (opcional)
- Todos los selects son obligatorios (tipo, tendencia, impacto, probabilidad)

🔒 **Reglas de Negocio:**
- Debe estar asociado a un análisis PESTEL existente
- Si viene `analisisId`, el campo análisis queda pre-seteado y readonly
- Si viene `tipoInicial`, el tipo se pre-selecciona pero es editable

### 5.3. FuerzaPorterFormModal

✅ **Validaciones:**
- Descripción: min 20, max 1000 caracteres
- Factores: min 1, max 10 elementos
- Cada factor: max 200 caracteres
- Periodo: min 4, max 50 caracteres
- Implicaciones: max 1000 caracteres (opcional)

🔒 **Reglas de Negocio:**
- El tipo de fuerza es readonly en modo edición
- Mínimo 1 factor clave requerido
- Los factores son strings simples (no objetos)
- Fecha de análisis no puede ser futura

---

## 📦 Exportación de Modales

Todos los modales están exportados en:

```typescript
// frontend/src/features/gestion-estrategica/components/modals/index.ts

export { AnalisisPestelFormModal } from './AnalisisPestelFormModal';
export { FactorPestelFormModal } from './FactorPestelFormModal';
export { FuerzaPorterFormModal } from './FuerzaPorterFormModal';
```

---

## 🎨 Patrón de Diseño Utilizado

Todos los modales siguen el mismo patrón establecido en el sistema:

1. **React Hook Form + Zod** para validación
2. **BaseModal** como componente base
3. **Hooks de mutations** de `useContexto.ts`
4. **Toast notifications** con Sonner
5. **Design System dinámico** sin colores hardcoded
6. **Responsive** y accesible (ARIA labels)
7. **Loading states** en botones de submit
8. **Preview en tiempo real** de los datos ingresados

---

## 🔄 Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO INTERACTÚA                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  COMPONENTE ABRE MODAL                       │
│  (PESTELMatrix, PorterDiagram, ContextoPage, etc.)          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    MODAL FORMULARIO                          │
│  (AnalisisPestel, FactorPestel, FuerzaPorter)               │
│                                                               │
│  1. Renderiza form con React Hook Form                       │
│  2. Valida con Zod schema                                    │
│  3. Usuario completa campos                                  │
│  4. Submit → Mutation hook                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     MUTATION HOOK                            │
│  (useCreateAnalisisPestel, useUpdateFactorPestel, etc.)     │
│                                                               │
│  1. POST/PATCH al backend API                                │
│  2. Invalidar queries relacionadas                           │
│  3. Mostrar toast de éxito/error                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    REACT QUERY CACHE                         │
│  - Invalida queries afectadas                                │
│  - Re-fetch automático                                       │
│  - UI se actualiza reactivamente                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📚 Referencias

- **Hooks mutations:** `frontend/src/features/gestion-estrategica/hooks/useContexto.ts`
- **Types:** `frontend/src/features/gestion-estrategica/types/contexto.types.ts`
- **BaseModal:** `frontend/src/components/modals/BaseModal.tsx`
- **Form components:** `frontend/src/components/forms/`
- **Patrón de referencia:** `AnalisisDofaFormModal.tsx`, `ConvertirObjetivoModal.tsx`

---

**Creado:** 2026-01-23
**Sprint:** 2 - Contexto Organizacional
**Sistema:** StrateKaz
**Versión:** 3.7.3
