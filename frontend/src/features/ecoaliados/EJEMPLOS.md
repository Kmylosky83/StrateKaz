# Ejemplos de Uso - Módulo Ecoaliados

## 1. Uso Básico - Importar y Usar la Página

```tsx
// En tu router principal (App.tsx o routes/index.tsx)
import { EcoaliadosPage } from '@/features/ecoaliados';

function App() {
  return (
    <Routes>
      <Route path="/ecoaliados" element={<EcoaliadosPage />} />
    </Routes>
  );
}
```

## 2. Usar Componentes Individualmente

### Tabla de Ecoaliados

```tsx
import { EcoaliadosTable } from '@/features/ecoaliados';
import { useEcoaliados } from '@/features/ecoaliados';

function MiComponente() {
  const { data, isLoading } = useEcoaliados({ is_active: true });

  return (
    <EcoaliadosTable
      ecoaliados={data?.results || []}
      onEdit={(ecoaliado) => console.log('Editar:', ecoaliado)}
      onDelete={(ecoaliado) => console.log('Eliminar:', ecoaliado)}
      onCambiarPrecio={(ecoaliado) => console.log('Cambiar precio:', ecoaliado)}
      onVerHistorial={(ecoaliado) => console.log('Ver historial:', ecoaliado)}
      onToggleStatus={(ecoaliado) => console.log('Toggle:', ecoaliado)}
      canChangePrecio={true}
      isLoading={isLoading}
    />
  );
}
```

### Formulario de Ecoaliado

```tsx
import { EcoaliadoForm } from '@/features/ecoaliados';
import { useCreateEcoaliado } from '@/features/ecoaliados';
import { useState } from 'react';

function MiComponente() {
  const [isOpen, setIsOpen] = useState(false);
  const createMutation = useCreateEcoaliado();

  const handleSubmit = async (data) => {
    await createMutation.mutateAsync(data);
    setIsOpen(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Crear Ecoaliado</button>

      <EcoaliadoForm
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        currentUserId={1}
        isComercial={false}
        isLoading={createMutation.isPending}
      />
    </>
  );
}
```

### Botón de Geolocalización

```tsx
import { GeolocationButton } from '@/features/ecoaliados';
import { useState } from 'react';

function MiComponente() {
  const [coords, setCoords] = useState(null);

  return (
    <div>
      <GeolocationButton
        onCoordsCapture={(coords) => {
          console.log('Coordenadas capturadas:', coords);
          setCoords(coords);
        }}
        currentCoords={coords}
      />

      {coords && (
        <div>
          <p>Latitud: {coords.latitude}</p>
          <p>Longitud: {coords.longitude}</p>
        </div>
      )}
    </div>
  );
}
```

## 3. Usar Hooks de React Query

### Listar Ecoaliados con Filtros

```tsx
import { useEcoaliados } from '@/features/ecoaliados';

function EcoaliadosList() {
  const { data, isLoading, error } = useEcoaliados({
    search: 'Juan',
    unidad_negocio: 5,
    ciudad: 'Bogotá',
    is_active: true,
    page: 1,
    page_size: 20,
  });

  if (isLoading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data.results.map((ecoaliado) => (
        <li key={ecoaliado.id}>
          {ecoaliado.razon_social} - ${ecoaliado.precio_compra_kg}/kg
        </li>
      ))}
    </ul>
  );
}
```

### Obtener Ecoaliado Individual

```tsx
import { useEcoaliado } from '@/features/ecoaliados';

function EcoaliadoDetail({ id }) {
  const { data: ecoaliado, isLoading } = useEcoaliado(id);

  if (isLoading) return <div>Cargando...</div>;
  if (!ecoaliado) return <div>No encontrado</div>;

  return (
    <div>
      <h2>{ecoaliado.razon_social}</h2>
      <p>Código: {ecoaliado.codigo}</p>
      <p>Teléfono: {ecoaliado.telefono}</p>
      <p>Ciudad: {ecoaliado.ciudad}</p>
      <p>Precio: ${parseFloat(ecoaliado.precio_compra_kg).toLocaleString('es-CO')}/kg</p>
    </div>
  );
}
```

### Crear Ecoaliado

```tsx
import { useCreateEcoaliado } from '@/features/ecoaliados';

function CreateEcoaliadoButton() {
  const createMutation = useCreateEcoaliado();

  const handleCreate = async () => {
    try {
      const nuevoEcoaliado = await createMutation.mutateAsync({
        razon_social: 'Juan Pérez',
        documento_tipo: 'CC',
        documento_numero: '1234567890',
        unidad_negocio: 5,
        telefono: '3001234567',
        email: 'juan@example.com',
        direccion: 'Calle 123 #45-67',
        ciudad: 'Bogotá',
        departamento: 'Cundinamarca',
        precio_compra_kg: '1500.00',
        comercial_asignado: 1,
        observaciones: 'Cliente nuevo',
        latitud: 4.7110,
        longitud: -74.0721,
      });

      console.log('Ecoaliado creado:', nuevoEcoaliado);
    } catch (error) {
      console.error('Error al crear:', error);
    }
  };

  return (
    <button onClick={handleCreate} disabled={createMutation.isPending}>
      {createMutation.isPending ? 'Creando...' : 'Crear Ecoaliado'}
    </button>
  );
}
```

### Actualizar Ecoaliado

```tsx
import { useUpdateEcoaliado } from '@/features/ecoaliados';

function UpdateEcoaliadoButton({ ecoaliadoId }) {
  const updateMutation = useUpdateEcoaliado();

  const handleUpdate = async () => {
    try {
      await updateMutation.mutateAsync({
        id: ecoaliadoId,
        data: {
          telefono: '3009876543',
          ciudad: 'Medellín',
          departamento: 'Antioquia',
        },
      });
    } catch (error) {
      console.error('Error al actualizar:', error);
    }
  };

  return (
    <button onClick={handleUpdate} disabled={updateMutation.isPending}>
      {updateMutation.isPending ? 'Actualizando...' : 'Actualizar'}
    </button>
  );
}
```

### Cambiar Precio (Solo Líder Comercial+)

```tsx
import { useCambiarPrecio } from '@/features/ecoaliados';

function CambiarPrecioButton({ ecoaliadoId, precioActual }) {
  const cambiarPrecioMutation = useCambiarPrecio();

  const handleCambiarPrecio = async () => {
    try {
      await cambiarPrecioMutation.mutateAsync({
        id: ecoaliadoId,
        data: {
          precio_nuevo: '2000.00',
          justificacion: 'Ajuste por incremento de costos de transporte',
        },
      });
    } catch (error) {
      console.error('Error al cambiar precio:', error);
    }
  };

  return (
    <div>
      <p>Precio actual: ${precioActual}</p>
      <button onClick={handleCambiarPrecio} disabled={cambiarPrecioMutation.isPending}>
        {cambiarPrecioMutation.isPending ? 'Cambiando...' : 'Cambiar a $2,000'}
      </button>
    </div>
  );
}
```

### Ver Historial de Precios

```tsx
import { useHistorialPrecios } from '@/features/ecoaliados';

function HistorialPreciosView({ ecoaliadoId }) {
  const { data, isLoading } = useHistorialPrecios(ecoaliadoId);

  if (isLoading) return <div>Cargando historial...</div>;
  if (!data) return <div>No hay historial</div>;

  return (
    <div>
      <h3>Precio Actual: ${data.precio_actual}</h3>
      <h4>Historial de Cambios:</h4>
      <ul>
        {data.historial.map((cambio) => (
          <li key={cambio.id}>
            <strong>{cambio.tipo_cambio}</strong> -{' '}
            {cambio.precio_anterior && `De $${cambio.precio_anterior} a `}
            ${cambio.precio_nuevo}
            {cambio.porcentaje_cambio && ` (${cambio.porcentaje_cambio}%)`}
            <br />
            <small>
              Por: {cambio.modificado_por_nombre} -{' '}
              {new Date(cambio.fecha_cambio).toLocaleDateString()}
            </small>
            <br />
            <em>{cambio.justificacion}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Toggle Estado Activo/Inactivo

```tsx
import { useToggleEcoaliadoStatus } from '@/features/ecoaliados';

function ToggleStatusButton({ ecoaliado }) {
  const toggleMutation = useToggleEcoaliadoStatus();

  const handleToggle = async () => {
    try {
      await toggleMutation.mutateAsync({
        id: ecoaliado.id,
        is_active: !ecoaliado.is_active,
      });
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };

  return (
    <button onClick={handleToggle} disabled={toggleMutation.isPending}>
      {toggleMutation.isPending
        ? 'Cambiando...'
        : ecoaliado.is_active
        ? 'Desactivar'
        : 'Activar'}
    </button>
  );
}
```

### Eliminar Ecoaliado

```tsx
import { useDeleteEcoaliado } from '@/features/ecoaliados';

function DeleteEcoaliadoButton({ ecoaliadoId, razonSocial }) {
  const deleteMutation = useDeleteEcoaliado();

  const handleDelete = async () => {
    if (window.confirm(`¿Eliminar a ${razonSocial}?`)) {
      try {
        await deleteMutation.mutateAsync(ecoaliadoId);
      } catch (error) {
        console.error('Error al eliminar:', error);
      }
    }
  };

  return (
    <button onClick={handleDelete} disabled={deleteMutation.isPending}>
      {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
    </button>
  );
}
```

## 4. Usar API Directamente (Sin Hooks)

```tsx
import { ecoaliadosAPI } from '@/features/ecoaliados';

// Listar
const listar = async () => {
  const response = await ecoaliadosAPI.getEcoaliados({
    search: 'Juan',
    is_active: true,
  });
  console.log(response.results);
};

// Obtener uno
const obtener = async (id) => {
  const ecoaliado = await ecoaliadosAPI.getEcoaliado(id);
  console.log(ecoaliado);
};

// Crear
const crear = async () => {
  const nuevo = await ecoaliadosAPI.createEcoaliado({
    razon_social: 'Juan Pérez',
    documento_tipo: 'CC',
    documento_numero: '1234567890',
    // ... resto de campos
  });
  console.log(nuevo);
};

// Actualizar
const actualizar = async (id) => {
  const actualizado = await ecoaliadosAPI.updateEcoaliado(id, {
    telefono: '3009876543',
  });
  console.log(actualizado);
};

// Eliminar
const eliminar = async (id) => {
  await ecoaliadosAPI.deleteEcoaliado(id);
  console.log('Eliminado');
};

// Cambiar precio
const cambiarPrecio = async (id) => {
  const resultado = await ecoaliadosAPI.cambiarPrecio(id, {
    precio_nuevo: '2000.00',
    justificacion: 'Ajuste de precios',
  });
  console.log(resultado);
};

// Ver historial
const verHistorial = async (id) => {
  const historial = await ecoaliadosAPI.getHistorialPrecios(id);
  console.log(historial);
};
```

## 5. Integrar con Context API

```tsx
// EcoaliadosContext.tsx
import { createContext, useContext, useState } from 'react';
import type { Ecoaliado, EcoaliadoFilters } from '@/features/ecoaliados';

interface EcoaliadosContextType {
  filters: EcoaliadoFilters;
  setFilters: (filters: EcoaliadoFilters) => void;
  selectedEcoaliado: Ecoaliado | null;
  setSelectedEcoaliado: (ecoaliado: Ecoaliado | null) => void;
}

const EcoaliadosContext = createContext<EcoaliadosContextType | undefined>(undefined);

export function EcoaliadosProvider({ children }) {
  const [filters, setFilters] = useState<EcoaliadoFilters>({});
  const [selectedEcoaliado, setSelectedEcoaliado] = useState<Ecoaliado | null>(null);

  return (
    <EcoaliadosContext.Provider
      value={{ filters, setFilters, selectedEcoaliado, setSelectedEcoaliado }}
    >
      {children}
    </EcoaliadosContext.Provider>
  );
}

export function useEcoaliadosContext() {
  const context = useContext(EcoaliadosContext);
  if (!context) {
    throw new Error('useEcoaliadosContext must be used within EcoaliadosProvider');
  }
  return context;
}
```

## 6. Validación de Formulario Manual

```tsx
import { z } from 'zod';

const ecoaliadoSchema = z.object({
  razon_social: z.string().min(3).max(255),
  documento_numero: z.string().min(5).max(50),
  telefono: z.string().min(7).max(20),
  email: z.string().email().optional().or(z.literal('')),
  precio_compra_kg: z.number().min(0),
});

// Validar manualmente
try {
  const validData = ecoaliadoSchema.parse({
    razon_social: 'Juan Pérez',
    documento_numero: '1234567890',
    telefono: '3001234567',
    email: 'juan@example.com',
    precio_compra_kg: 1500,
  });
  console.log('Datos válidos:', validData);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('Errores de validación:', error.errors);
  }
}
```

## 7. Exportar Ecoaliados a Excel (Ejemplo Futuro)

```tsx
// Ejemplo de cómo podrías implementar export a Excel
import { useEcoaliados } from '@/features/ecoaliados';
import { exportToExcel } from '@/utils/excel'; // Implementar con xlsx

function ExportButton() {
  const { data } = useEcoaliados();

  const handleExport = () => {
    if (!data) return;

    const excelData = data.results.map((e) => ({
      Código: e.codigo,
      'Razón Social': e.razon_social,
      Documento: `${e.documento_tipo} ${e.documento_numero}`,
      Ciudad: e.ciudad,
      Departamento: e.departamento,
      Teléfono: e.telefono,
      'Precio kg': e.precio_compra_kg,
      Comercial: e.comercial_asignado_nombre,
      Estado: e.is_active ? 'Activo' : 'Inactivo',
    }));

    exportToExcel(excelData, 'Ecoaliados.xlsx');
  };

  return <button onClick={handleExport}>Exportar a Excel</button>;
}
```

## 8. Integrar con React Router Data API

```tsx
// Si usas React Router v6.4+ con loaders
import { useLoaderData } from 'react-router-dom';
import { ecoaliadosAPI } from '@/features/ecoaliados';

// En tu router
const router = createBrowserRouter([
  {
    path: '/ecoaliados/:id',
    element: <EcoaliadoDetailPage />,
    loader: async ({ params }) => {
      const ecoaliado = await ecoaliadosAPI.getEcoaliado(Number(params.id));
      return { ecoaliado };
    },
  },
]);

// En tu componente
function EcoaliadoDetailPage() {
  const { ecoaliado } = useLoaderData();

  return (
    <div>
      <h1>{ecoaliado.razon_social}</h1>
      {/* ... */}
    </div>
  );
}
```

## 9. Configurar Permisos Dinámicos

```tsx
import { useAuth } from '@/context/AuthContext';

function EcoaliadosPageWithPermissions() {
  const { user } = useAuth();

  // Calcular permisos
  const permissions = {
    canCreate: ['COMERCIAL', 'LIDER_COMERCIAL', 'GERENTE'].includes(user.role),
    canEdit: ['COMERCIAL', 'LIDER_COMERCIAL', 'GERENTE'].includes(user.role),
    canDelete: ['LIDER_COMERCIAL', 'GERENTE'].includes(user.role),
    canChangePrecio: ['LIDER_COMERCIAL', 'GERENTE'].includes(user.role),
    canViewAll: ['LIDER_COMERCIAL', 'GERENTE'].includes(user.role),
  };

  return (
    <div>
      {permissions.canCreate && <button>Crear Ecoaliado</button>}
      {/* Pasar permissions a componentes hijos */}
    </div>
  );
}
```

## 10. Testing con React Testing Library

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EcoaliadoForm } from '@/features/ecoaliados';

describe('EcoaliadoForm', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should submit form with valid data', async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();

    render(
      <EcoaliadoForm
        isOpen={true}
        onClose={() => {}}
        onSubmit={mockSubmit}
        currentUserId={1}
      />,
      { wrapper }
    );

    // Llenar formulario
    await user.type(screen.getByLabelText(/razón social/i), 'Juan Pérez');
    await user.selectOptions(screen.getByLabelText(/tipo de documento/i), 'CC');
    await user.type(screen.getByLabelText(/número de documento/i), '1234567890');

    // Submit
    await user.click(screen.getByText(/crear ecoaliado/i));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          razon_social: 'Juan Pérez',
          documento_tipo: 'CC',
          documento_numero: '1234567890',
        })
      );
    });
  });
});
```

---

Estos son los ejemplos más comunes de uso del módulo Ecoaliados. Para más detalles, consulta:
- README.md
- INTEGRACION.md
- Código fuente de los componentes
