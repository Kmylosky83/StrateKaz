# RiesgoSelector - Guía de Implementación

## Instalación y Uso Rápido

### 1. Importación

```tsx
import { RiesgoSelector } from '@/features/configuracion/components/RiesgoSelector';
import { useRiesgosOcupacionales } from '@/features/configuracion/hooks/useRiesgosOcupacionales';
```

### 2. Uso Básico

```tsx
function CargoForm() {
  const [selectedRiesgoIds, setSelectedRiesgoIds] = useState<number[]>([]);
  const { data: riesgosData } = useRiesgosOcupacionales({});

  return (
    <RiesgoSelector
      selectedIds={selectedRiesgoIds}
      onChange={setSelectedRiesgoIds}
      riesgos={riesgosData?.results || []}
    />
  );
}
```

### 3. Con Estado Disabled

```tsx
<RiesgoSelector
  selectedIds={formData.riesgo_ids}
  onChange={(ids) => setFormData({ ...formData, riesgo_ids: ids })}
  riesgos={riesgosData?.results || []}
  disabled={isLoading || isSubmitting}
/>
```

---

## Props API

```tsx
interface RiesgoSelectorProps {
  /** IDs de riesgos seleccionados */
  selectedIds: number[];

  /** Callback cuando cambia la selección */
  onChange: (selectedIds: number[]) => void;

  /** Lista de todos los riesgos disponibles */
  riesgos: RiesgoOcupacional[];

  /** Deshabilitar selector (opcional) */
  disabled?: boolean;
}
```

### Tipos Relacionados

```tsx
interface RiesgoOcupacional {
  id: number;
  name: string;
  clasificacion_gtc45:
    | 'BIOLOGICO'
    | 'FISICO'
    | 'QUIMICO'
    | 'PSICOSOCIAL'
    | 'BIOMECANICO'
    | 'CONDICIONES_SEGURIDAD'
    | 'FENOMENOS_NATURALES';
  nivel_riesgo: 'I' | 'II' | 'III' | 'IV';
  descripcion?: string;
}
```

---

## Integración en Formularios

### Ejemplo: React Hook Form

```tsx
import { useForm } from 'react-hook-form';

interface CargoFormData {
  nombre: string;
  descripcion: string;
  riesgo_ids: number[];
}

function CargoFormWithRHF() {
  const { register, watch, setValue } = useForm<CargoFormData>({
    defaultValues: {
      riesgo_ids: []
    }
  });

  const riesgosSeleccionados = watch('riesgo_ids');
  const { data: riesgosData } = useRiesgosOcupacionales({});

  return (
    <form>
      {/* Otros campos */}

      <RiesgoSelector
        selectedIds={riesgosSeleccionados}
        onChange={(ids) => setValue('riesgo_ids', ids)}
        riesgos={riesgosData?.results || []}
      />
    </form>
  );
}
```

### Ejemplo: Estado Formik

```tsx
import { useFormik } from 'formik';

function CargoFormWithFormik() {
  const formik = useFormik({
    initialValues: {
      riesgo_ids: []
    },
    onSubmit: (values) => {
      console.log('Riesgos seleccionados:', values.riesgo_ids);
    }
  });

  const { data: riesgosData } = useRiesgosOcupacionales({});

  return (
    <form onSubmit={formik.handleSubmit}>
      <RiesgoSelector
        selectedIds={formik.values.riesgo_ids}
        onChange={(ids) => formik.setFieldValue('riesgo_ids', ids)}
        riesgos={riesgosData?.results || []}
      />
    </form>
  );
}
```

---

## Casos de Uso Avanzados

### 1. Pre-cargar Selección desde Backend

```tsx
function EditCargoForm({ cargoId }: { cargoId: number }) {
  const { data: cargo } = useCargo(cargoId);
  const { data: riesgosData } = useRiesgosOcupacionales({});

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Cargar riesgos del cargo cuando se obtiene del backend
  useEffect(() => {
    if (cargo?.expuesto_riesgos) {
      setSelectedIds(cargo.expuesto_riesgos);
    }
  }, [cargo]);

  return (
    <RiesgoSelector
      selectedIds={selectedIds}
      onChange={setSelectedIds}
      riesgos={riesgosData?.results || []}
    />
  );
}
```

### 2. Validación de Selección Mínima

```tsx
function CargoFormWithValidation() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [error, setError] = useState<string>('');

  const handleChange = (ids: number[]) => {
    setSelectedIds(ids);

    // Validar que se seleccione al menos 1 riesgo
    if (ids.length === 0) {
      setError('Debes seleccionar al menos un riesgo ocupacional');
    } else {
      setError('');
    }
  };

  return (
    <>
      <RiesgoSelector
        selectedIds={selectedIds}
        onChange={handleChange}
        riesgos={riesgosData?.results || []}
      />
      {error && (
        <p className="mt-2 text-sm text-danger-600 dark:text-danger-400">
          {error}
        </p>
      )}
    </>
  );
}
```

### 3. Mostrar Riesgos Seleccionados Resumidos

```tsx
function RiesgosSummary({ selectedIds, riesgos }: {
  selectedIds: number[];
  riesgos: RiesgoOcupacional[];
}) {
  const riesgosSeleccionados = riesgos.filter(r => selectedIds.includes(r.id));

  // Agrupar por clasificación
  const grouped = riesgosSeleccionados.reduce((acc, r) => {
    const key = r.clasificacion_gtc45;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {} as Record<string, RiesgoOcupacional[]>);

  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <h5 className="font-medium mb-2">Resumen de Riesgos Seleccionados</h5>
      {Object.entries(grouped).map(([clasificacion, riesgos]) => (
        <div key={clasificacion} className="mb-2">
          <span className="font-medium">{clasificacion}:</span>{' '}
          <span className="text-gray-600 dark:text-gray-400">
            {riesgos.map(r => r.name).join(', ')}
          </span>
        </div>
      ))}
    </div>
  );
}
```

### 4. Filtrado Condicional de Riesgos

```tsx
function RiesgoSelectorCondicional({ tipoArea }: { tipoArea: string }) {
  const { data: riesgosData } = useRiesgosOcupacionales({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Filtrar riesgos relevantes según el área
  const riesgosFiltrados = useMemo(() => {
    if (!riesgosData?.results) return [];

    // Ejemplo: Área administrativa solo muestra riesgos PSICOSOCIAL y BIOMECANICO
    if (tipoArea === 'ADMINISTRATIVA') {
      return riesgosData.results.filter(r =>
        ['PSICOSOCIAL', 'BIOMECANICO'].includes(r.clasificacion_gtc45)
      );
    }

    // Área de producción muestra todos
    return riesgosData.results;
  }, [riesgosData, tipoArea]);

  return (
    <RiesgoSelector
      selectedIds={selectedIds}
      onChange={setSelectedIds}
      riesgos={riesgosFiltrados}
    />
  );
}
```

---

## Personalización de Estilos

### Modificar Altura Máxima del Scroll

```tsx
// En RiesgoSelector.tsx, línea ~200
<div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
  {/* Cambiar a max-h-[600px] para más altura */}
```

### Cambiar Colores de Niveles de Riesgo

```tsx
// Editar constante NIVEL_RIESGO_VARIANTS
const NIVEL_RIESGO_VARIANTS = {
  'I': 'danger',   // Crítico
  'II': 'warning', // Alto
  'III': 'info',   // Medio (cambiar de warning a info)
  'IV': 'success', // Bajo
} as const;
```

### Personalizar Iconos de Categorías

```tsx
// Editar constante CLASIFICACION_ICONS
import { CustomIcon } from 'lucide-react';

const CLASIFICACION_ICONS = {
  BIOLOGICO: Biohazard,
  FISICO: CustomIcon, // Tu icono personalizado
  // ...
} as const;
```

---

## Testing

### Unit Test Básico

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { RiesgoSelector } from './RiesgoSelector';

const mockRiesgos: RiesgoOcupacional[] = [
  {
    id: 1,
    name: 'Virus',
    clasificacion_gtc45: 'BIOLOGICO',
    nivel_riesgo: 'I'
  },
  {
    id: 2,
    name: 'Ruido',
    clasificacion_gtc45: 'FISICO',
    nivel_riesgo: 'II'
  }
];

describe('RiesgoSelector', () => {
  it('muestra todos los riesgos agrupados', () => {
    render(
      <RiesgoSelector
        selectedIds={[]}
        onChange={jest.fn()}
        riesgos={mockRiesgos}
      />
    );

    expect(screen.getByText('Biológico')).toBeInTheDocument();
    expect(screen.getByText('Físico')).toBeInTheDocument();
  });

  it('permite seleccionar riesgos individuales', () => {
    const onChange = jest.fn();

    render(
      <RiesgoSelector
        selectedIds={[]}
        onChange={onChange}
        riesgos={mockRiesgos}
      />
    );

    // Expandir categoría
    fireEvent.click(screen.getByText('Biológico'));

    // Seleccionar riesgo
    fireEvent.click(screen.getByText('Virus'));

    expect(onChange).toHaveBeenCalledWith([1]);
  });

  it('permite búsqueda de riesgos', () => {
    render(
      <RiesgoSelector
        selectedIds={[]}
        onChange={jest.fn()}
        riesgos={mockRiesgos}
      />
    );

    const searchInput = screen.getByPlaceholderText('Buscar riesgo...');
    fireEvent.change(searchInput, { target: { value: 'virus' } });

    expect(screen.getByText(/virus/i)).toBeInTheDocument();
    expect(screen.queryByText('Ruido')).not.toBeInTheDocument();
  });
});
```

### Integration Test con React Query

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useRiesgosOcupacionales } from '../hooks/useRiesgosOcupacionales';

describe('RiesgoSelector Integration', () => {
  it('carga riesgos desde API', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useRiesgosOcupacionales({}), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.results.length).toBeGreaterThan(0);
  });
});
```

---

## Troubleshooting

### Problema: No se muestran los riesgos

**Causa:** El hook `useRiesgosOcupacionales` no está retornando datos

**Solución:**
```tsx
// Verificar que el query está en estado success
const { data, isLoading, isError } = useRiesgosOcupacionales({});

if (isLoading) return <LoadingSpinner />;
if (isError) return <ErrorMessage />;
if (!data?.results || data.results.length === 0) {
  return <EmptyState message="No hay riesgos configurados" />;
}

return <RiesgoSelector riesgos={data.results} {...props} />;
```

### Problema: Búsqueda no funciona con caracteres especiales

**Causa:** Regex no escapa caracteres especiales

**Solución:** Ya implementada en el componente con `split()` seguro

### Problema: Performance lenta con 78 riesgos

**Causa:** Re-renders innecesarios

**Solución:**
```tsx
// Memoizar callbacks
const handleChange = useCallback((ids: number[]) => {
  setFormData(prev => ({ ...prev, riesgo_ids: ids }));
}, []);

<RiesgoSelector onChange={handleChange} {...props} />
```

---

## Mejoras Futuras Planeadas

### v1.1 - Filtros Avanzados
```tsx
interface RiesgoSelectorProps {
  // Props existentes...
  filters?: {
    nivelesRiesgo?: ('I' | 'II' | 'III' | 'IV')[];
    clasificaciones?: string[];
  };
}
```

### v1.2 - Modo Compacto
```tsx
<RiesgoSelector
  mode="compact" // Muestra solo contadores sin detalles
  {...props}
/>
```

### v1.3 - Export/Import
```tsx
<RiesgoSelector
  onExport={() => exportToPDF(selectedIds)}
  onImport={(file) => importFromTemplate(file)}
  {...props}
/>
```

---

## Recursos Adicionales

### Documentación Relacionada
- [RIESGO-SELECTOR-UX-DESIGN.md](./RIESGO-SELECTOR-UX-DESIGN.md) - Decisiones de diseño UX
- [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) - Sistema de diseño general
- [COMPONENTES-DESIGN-SYSTEM.md](./COMPONENTES-DESIGN-SYSTEM.md) - Componentes reutilizables

### Ejemplos Completos
- `CargoFormModal.tsx` - Implementación en producción
- `PermissionSelector.tsx` - Componente similar para permisos

### Referencias Externas
- [GTC 45 PDF](https://www.mintrabajo.gov.co/documents/20147/45107/Gu%C3%ADa+T%C3%A9cnica+Colombiana+GTC+45.pdf)
- [React Patterns - Accordion](https://reactpatterns.com/#accordion)
- [Tailwind UI - Disclosure](https://tailwindui.com/components/application-ui/navigation/disclosure)

---

**Última actualización:** 2025-12-15
**Versión:** 1.0
**Mantenedor:** Equipo Frontend
