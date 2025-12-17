# Modales del Módulo de Recepciones

Este directorio contiene los componentes modales para el flujo completo de recepciones de materia prima.

## Componentes Disponibles

### 1. IniciarRecepcionModal

Modal para iniciar una nueva recepción de materia prima.

**Características:**
- Selector de recolector
- Lista de recolecciones pendientes con checkboxes
- Cálculo automático de totales (kg, valor)
- Campo de observaciones opcional
- Validación de selección mínima

**Uso:**
```tsx
import { IniciarRecepcionModal } from '@/features/recepciones/components';

function RecepcionesPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button onClick={() => setShowModal(true)}>
        Iniciar Recepción
      </Button>

      <IniciarRecepcionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          // Recargar lista, mostrar notificación, etc.
          setShowModal(false);
        }}
      />
    </>
  );
}
```

---

### 2. RegistrarPesajeModal

Modal para registrar el pesaje en báscula de una recepción iniciada.

**Características:**
- Muestra datos de la recepción (código, recolector, peso esperado)
- Campo numérico para peso real
- Cálculo de merma en tiempo real con visualización de colores
- Validación: merma no puede exceder 10%
- Advertencia si merma > 5%
- Campo opcional para número de ticket de báscula
- Campo para observaciones de merma (recomendado si merma > 5%)

**Uso:**
```tsx
import { RegistrarPesajeModal } from '@/features/recepciones/components';
import { useRecepcion } from '@/features/recepciones/api/useRecepciones';

function RecepcionesPage() {
  const [recepcionId, setRecepcionId] = useState<number | null>(null);
  const { data: recepcion } = useRecepcion(recepcionId);

  return (
    <>
      <Button onClick={() => setRecepcionId(123)}>
        Registrar Pesaje
      </Button>

      <RegistrarPesajeModal
        isOpen={!!recepcionId}
        onClose={() => setRecepcionId(null)}
        recepcion={recepcion}
        onSuccess={() => {
          // Actualizar estado, mostrar notificación
          setRecepcionId(null);
        }}
      />
    </>
  );
}
```

---

### 3. ConfirmarRecepcionModal

Modal para confirmar una recepción pesada y aplicar el prorrateo de merma.

**Características:**
- Resumen completo de la recepción
- Tabla con prorrateo de merma por recolección
- Advertencia si merma > 5%
- Campo opcional para tanque destino
- Información sobre las consecuencias de confirmar

**Uso:**
```tsx
import { ConfirmarRecepcionModal } from '@/features/recepciones/components';

function RecepcionesPage() {
  const [recepcionToConfirm, setRecepcionToConfirm] = useState<RecepcionDetallada | null>(null);

  return (
    <>
      <Button onClick={() => setRecepcionToConfirm(recepcion)}>
        Confirmar Recepción
      </Button>

      <ConfirmarRecepcionModal
        isOpen={!!recepcionToConfirm}
        onClose={() => setRecepcionToConfirm(null)}
        recepcion={recepcionToConfirm}
        onSuccess={() => {
          setRecepcionToConfirm(null);
        }}
      />
    </>
  );
}
```

---

### 4. RecepcionDetailModal

Modal para ver el detalle completo de una recepción (cualquier estado).

**Características:**
- Información completa de la recepción
- Datos del recolector
- Fechas de todas las etapas
- Resumen de pesos y valores
- Tabla detallada de recolecciones incluidas
- Observaciones y notas
- Información de cancelación (si aplica)
- Botón de impresión (solo si está confirmada)

**Uso:**
```tsx
import { RecepcionDetailModal } from '@/features/recepciones/components';

function RecepcionesTable() {
  const [selectedRecepcion, setSelectedRecepcion] = useState<RecepcionDetallada | null>(null);

  return (
    <>
      <table>
        {recepciones.map(recepcion => (
          <tr key={recepcion.id}>
            <td>{recepcion.codigo_recepcion}</td>
            <td>
              <Button onClick={() => setSelectedRecepcion(recepcion)}>
                Ver Detalle
              </Button>
            </td>
          </tr>
        ))}
      </table>

      <RecepcionDetailModal
        isOpen={!!selectedRecepcion}
        onClose={() => setSelectedRecepcion(null)}
        recepcion={selectedRecepcion}
      />
    </>
  );
}
```

---

### 5. CancelarRecepcionModal

Modal para cancelar una recepción (solo estados INICIADA o PESADA).

**Características:**
- Advertencia destacada sobre la irreversibilidad
- Información de la recepción a cancelar
- Campo requerido para motivo de cancelación (mínimo 10 caracteres)
- Lista de consecuencias claramente explicadas
- Lista de recolecciones que se liberarán
- Confirmación final

**Uso:**
```tsx
import { CancelarRecepcionModal } from '@/features/recepciones/components';

function RecepcionesPage() {
  const [recepcionToCancel, setRecepcionToCancel] = useState<RecepcionDetallada | null>(null);

  return (
    <>
      <Button
        variant="danger"
        onClick={() => setRecepcionToCancel(recepcion)}
        disabled={!recepcion.puede_cancelar}
      >
        Cancelar Recepción
      </Button>

      <CancelarRecepcionModal
        isOpen={!!recepcionToCancel}
        onClose={() => setRecepcionToCancel(null)}
        recepcion={recepcionToCancel}
        onSuccess={() => {
          setRecepcionToCancel(null);
        }}
      />
    </>
  );
}
```

---

## Flujo Completo de Recepción

```
1. INICIADA    → IniciarRecepcionModal
                 - Seleccionar recolector
                 - Seleccionar recolecciones
                 - Agregar observaciones

2. PESADA      → RegistrarPesajeModal
                 - Ingresar peso real
                 - Calcular merma
                 - Registrar ticket báscula
                 - Agregar observaciones de merma

3. CONFIRMADA  → ConfirmarRecepcionModal
                 - Revisar prorrateo de merma
                 - Agregar tanque destino
                 - Confirmar operación

En cualquier momento (antes de confirmar):
   CANCELADA   → CancelarRecepcionModal
                 - Especificar motivo
                 - Liberar recolecciones
```

---

## Estados de Recepción

| Estado | Descripción | Acciones Permitidas |
|--------|-------------|-------------------|
| **INICIADA** | Recepción creada, esperando pesaje | Registrar Pesaje, Cancelar |
| **PESADA** | Peso registrado, esperando confirmación | Confirmar, Cancelar |
| **CONFIRMADA** | Recepción finalizada, merma aplicada | Ver Detalle, Imprimir |
| **CANCELADA** | Recepción cancelada | Ver Detalle |

---

## Propiedades de Control en RecepcionDetallada

```typescript
interface RecepcionDetallada {
  // ... otros campos

  // Propiedades booleanas para control de UI
  puede_pesar: boolean;      // true si estado === 'INICIADA'
  puede_confirmar: boolean;  // true si estado === 'PESADA'
  puede_cancelar: boolean;   // true si estado === 'INICIADA' || 'PESADA'
  es_editable: boolean;      // true si estado !== 'CONFIRMADA' && estado !== 'CANCELADA'
}
```

---

## Dependencias

### Componentes del Design System
- `Modal` de `@/components/common`
- `Button` de `@/components/common`
- `Badge` de `@/components/common`
- `Input` de `@/components/forms`
- `Select` de `@/components/forms`

### Hooks de API
- `useIniciarRecepcion`
- `useRegistrarPesaje`
- `useConfirmarRecepcion`
- `useCancelarRecepcion`
- `useRecepcion`
- `useRecoleccionesPendientes`
- `useRecolectores`

### Utilidades
- `formatCurrency` - Formato de moneda COP
- `formatWeight` - Formato de peso en kg
- `formatPercentage` - Formato de porcentaje
- `formatDate` - Formato de fecha
- `formatDateTime` - Formato de fecha y hora

### Iconos (lucide-react)
- `Package`, `User`, `Calendar`, `Scale`, `TrendingDown`
- `CheckCircle`, `XCircle`, `AlertTriangle`, `Info`
- `Printer`, `FileText`, `RotateCcw`
- `CheckSquare`, `Square`, `Loader2`

---

## Validaciones Importantes

### RegistrarPesajeModal
- ✅ Peso real > 0
- ✅ Merma ≤ 10% del peso esperado
- ⚠️ Advertencia si merma > 5%

### CancelarRecepcionModal
- ✅ Motivo de cancelación requerido
- ✅ Motivo mínimo 10 caracteres
- ✅ Solo estados INICIADA o PESADA

### IniciarRecepcionModal
- ✅ Recolector requerido
- ✅ Al menos 1 recolección seleccionada

---

## Estilos y UX

### Colores de Estado
- **Merma Normal** (≤5%): Verde/Success
- **Merma Alta** (5-10%): Amarillo/Warning
- **Merma Excesiva** (>10%): Rojo/Danger

### Tamaños de Modal
- `IniciarRecepcionModal`: 3xl (pantalla amplia para lista)
- `RegistrarPesajeModal`: 2xl
- `ConfirmarRecepcionModal`: 3xl (tabla de prorrateo)
- `RecepcionDetailModal`: 4xl (vista completa)
- `CancelarRecepcionModal`: 2xl

### Dark Mode
Todos los modales soportan modo oscuro usando clases de Tailwind:
- `dark:bg-gray-800`
- `dark:text-gray-100`
- `dark:border-gray-700`

---

## Notas de Implementación

1. **Manejo de Errores**: Los hooks de API ya manejan errores con `toast.error()`
2. **Loading States**: Todos los botones de submit usan `isLoading` para mostrar spinner
3. **Reseteo de Formularios**: Se resetean automáticamente al cerrar con `useEffect`
4. **Validaciones**: Se realizan antes de submit con mensajes claros
5. **Responsividad**: Grids se adaptan de columnas a filas en móviles

---

## Ejemplo de Página Completa

```tsx
import { useState } from 'react';
import {
  IniciarRecepcionModal,
  RegistrarPesajeModal,
  ConfirmarRecepcionModal,
  RecepcionDetailModal,
  CancelarRecepcionModal,
} from '@/features/recepciones/components';
import { useRecepciones, useRecepcion } from '@/features/recepciones/api/useRecepciones';

export default function RecepcionesPage() {
  const [showIniciar, setShowIniciar] = useState(false);
  const [recepcionParaPesar, setRecepcionParaPesar] = useState<number | null>(null);
  const [recepcionParaConfirmar, setRecepcionParaConfirmar] = useState<RecepcionDetallada | null>(null);
  const [recepcionDetalle, setRecepcionDetalle] = useState<RecepcionDetallada | null>(null);
  const [recepcionParaCancelar, setRecepcionParaCancelar] = useState<RecepcionDetallada | null>(null);

  const { data: recepciones, refetch } = useRecepciones();
  const { data: recepcion } = useRecepcion(recepcionParaPesar);

  const handleSuccess = () => {
    refetch();
  };

  return (
    <div>
      <Button onClick={() => setShowIniciar(true)}>
        Nueva Recepción
      </Button>

      {/* Tabla de recepciones con acciones */}

      {/* Modales */}
      <IniciarRecepcionModal
        isOpen={showIniciar}
        onClose={() => setShowIniciar(false)}
        onSuccess={handleSuccess}
      />

      <RegistrarPesajeModal
        isOpen={!!recepcionParaPesar}
        onClose={() => setRecepcionParaPesar(null)}
        recepcion={recepcion}
        onSuccess={handleSuccess}
      />

      <ConfirmarRecepcionModal
        isOpen={!!recepcionParaConfirmar}
        onClose={() => setRecepcionParaConfirmar(null)}
        recepcion={recepcionParaConfirmar}
        onSuccess={handleSuccess}
      />

      <RecepcionDetailModal
        isOpen={!!recepcionDetalle}
        onClose={() => setRecepcionDetalle(null)}
        recepcion={recepcionDetalle}
      />

      <CancelarRecepcionModal
        isOpen={!!recepcionParaCancelar}
        onClose={() => setRecepcionParaCancelar(null)}
        recepcion={recepcionParaCancelar}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
```
