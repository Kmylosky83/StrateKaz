# Módulo de Recepciones

Sistema de gestión de recepciones de materia prima en planta para Grasas y Huesos del Norte.

## Descripción

Este módulo gestiona el proceso de recepción de materia prima en planta cuando un recolector llega con múltiples recolecciones:

1. **Iniciar Recepción**: Agrupa varias recolecciones de un recolector en una sola recepción
2. **Registrar Pesaje**: Registra el peso real medido en báscula de planta
3. **Calcular Merma**: Compara peso esperado vs peso real y calcula la merma
4. **Prorrateo**: Distribuye la merma proporcionalmente entre todas las recolecciones
5. **Confirmar**: Actualiza las recolecciones con pesos y valores reales

## Estructura de Archivos

```
recepciones/
├── api/
│   ├── recepcionesApi.ts       # Cliente API con endpoints
│   ├── useRecepciones.ts       # Hooks React Query
│   └── index.ts                # Exports
├── types/
│   ├── recepcion.types.ts      # Tipos TypeScript
│   └── index.ts                # Exports
├── index.ts                    # Barrel export principal
└── README.md                   # Esta documentación
```

## API Client

### Endpoints Disponibles

```typescript
import { recepcionesAPI } from '@/features/recepciones';

// Listar recepciones con filtros
const recepciones = await recepcionesAPI.getRecepciones({
  recolector: 123,
  estado: 'CONFIRMADA',
  fecha_desde: '2024-12-01',
  fecha_hasta: '2024-12-31',
  page: 1,
  page_size: 20,
});

// Obtener detalle de recepción
const recepcion = await recepcionesAPI.getRecepcion(456);

// Iniciar nueva recepción
const nuevaRecepcion = await recepcionesAPI.iniciarRecepcion({
  recolector_id: 123,
  recoleccion_ids: [789, 790, 791],
  observaciones_recepcion: 'Material en buen estado',
});

// Registrar pesaje en báscula
const pesaje = await recepcionesAPI.registrarPesaje(456, {
  peso_real_kg: 1234.50,
  numero_ticket_bascula: 'TICKET-001',
  observaciones_merma: 'Merma normal por evaporación',
});

// Confirmar recepción (aplica prorrateo de merma)
const confirmacion = await recepcionesAPI.confirmarRecepcion(456, {
  tanque_destino: 'TANQUE-ACU-01',
});

// Cancelar recepción
const cancelacion = await recepcionesAPI.cancelarRecepcion(456, {
  motivo_cancelacion: 'Error en el pesaje',
});

// Recolecciones pendientes de recepción
const pendientes = await recepcionesAPI.getRecoleccionesPendientes(123);

// Estadísticas
const stats = await recepcionesAPI.getEstadisticas('2024-12-01', '2024-12-31');
```

## React Query Hooks

### Queries (Lectura)

```typescript
import {
  useRecepciones,
  useRecepcion,
  useRecoleccionesPendientes,
  useEstadisticasRecepciones,
} from '@/features/recepciones';

// Hook para listar recepciones
function RecepcionesPage() {
  const { data, isLoading, error } = useRecepciones({
    estado: 'CONFIRMADA',
    page: 1,
    page_size: 20,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;

  return (
    <div>
      {data?.results.map((recepcion) => (
        <RecepcionCard key={recepcion.id} recepcion={recepcion} />
      ))}
    </div>
  );
}

// Hook para detalle de recepción
function RecepcionDetail({ id }: { id: number }) {
  const { data: recepcion, isLoading } = useRecepcion(id);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h1>{recepcion?.codigo_recepcion}</h1>
      <p>Estado: {recepcion?.estado_display}</p>
      <p>Merma: {recepcion?.porcentaje_merma}%</p>

      <h2>Detalles</h2>
      {recepcion?.detalles.map((detalle) => (
        <DetalleCard key={detalle.id} detalle={detalle} />
      ))}
    </div>
  );
}

// Hook para recolecciones pendientes
function RecoleccionesPendientes() {
  const { data, isLoading } = useRecoleccionesPendientes();

  return (
    <div>
      <h2>Pendientes de Recepción: {data?.count}</h2>
      {data?.recolecciones.map((rec) => (
        <RecoleccionPendienteCard key={rec.id} recoleccion={rec} />
      ))}
    </div>
  );
}

// Hook para estadísticas
function RecepcionesStats() {
  const { data: stats } = useEstadisticasRecepciones();

  return (
    <div>
      <StatCard
        title="Total Recepciones"
        value={stats?.total_recepciones}
      />
      <StatCard
        title="Kg Recibidos"
        value={stats?.total_kg_recibidos}
      />
      <StatCard
        title="Merma Promedio"
        value={`${stats?.porcentaje_merma_promedio}%`}
      />
    </div>
  );
}
```

### Mutations (Escritura)

```typescript
import {
  useIniciarRecepcion,
  useRegistrarPesaje,
  useConfirmarRecepcion,
  useCancelarRecepcion,
} from '@/features/recepciones';

// Hook para iniciar recepción
function IniciarRecepcionForm() {
  const iniciarRecepcion = useIniciarRecepcion();

  const handleSubmit = async (formData) => {
    await iniciarRecepcion.mutateAsync({
      recolector_id: formData.recolectorId,
      recoleccion_ids: formData.recoleccionIds,
      observaciones_recepcion: formData.observaciones,
    });
    // Toast automático en caso de éxito/error
    // Invalidación automática de queries relacionadas
  };

  return (
    <form onSubmit={handleSubmit}>
      <RecolectorSelect />
      <RecoleccionesMultiSelect />
      <TextArea name="observaciones" />
      <Button
        type="submit"
        disabled={iniciarRecepcion.isPending}
      >
        {iniciarRecepcion.isPending ? 'Iniciando...' : 'Iniciar Recepción'}
      </Button>
    </form>
  );
}

// Hook para registrar pesaje
function RegistrarPesajeForm({ recepcionId }: { recepcionId: number }) {
  const registrarPesaje = useRegistrarPesaje();

  const handleSubmit = async (formData) => {
    const response = await registrarPesaje.mutateAsync({
      id: recepcionId,
      data: {
        peso_real_kg: formData.pesoReal,
        numero_ticket_bascula: formData.ticket,
        observaciones_merma: formData.observaciones,
      },
    });

    // Mostrar resultado de la merma
    console.log('Merma calculada:', response.merma);
  };

  return (
    <form onSubmit={handleSubmit}>
      <NumberInput
        label="Peso Real (kg)"
        name="pesoReal"
        required
      />
      <TextInput
        label="Ticket Báscula"
        name="ticket"
      />
      <TextArea
        label="Observaciones Merma"
        name="observaciones"
      />
      <Button type="submit">Registrar Pesaje</Button>
    </form>
  );
}

// Hook para confirmar recepción
function ConfirmarRecepcionButton({ recepcionId }: { recepcionId: number }) {
  const confirmarRecepcion = useConfirmarRecepcion();

  const handleConfirmar = async () => {
    const response = await confirmarRecepcion.mutateAsync({
      id: recepcionId,
      data: {
        tanque_destino: 'TANQUE-ACU-01',
      },
    });

    // Mostrar resumen del prorrateo
    console.log('Prorrateo aplicado:', response.resumen_prorrateo);
  };

  return (
    <Button
      onClick={handleConfirmar}
      disabled={confirmarRecepcion.isPending}
    >
      Confirmar Recepción
    </Button>
  );
}

// Hook para cancelar recepción
function CancelarRecepcionButton({ recepcionId }: { recepcionId: number }) {
  const cancelarRecepcion = useCancelarRecepcion();

  const handleCancelar = async () => {
    const motivo = prompt('Motivo de cancelación:');
    if (!motivo) return;

    await cancelarRecepcion.mutateAsync({
      id: recepcionId,
      data: { motivo_cancelacion: motivo },
    });
  };

  return (
    <Button
      variant="destructive"
      onClick={handleCancelar}
    >
      Cancelar Recepción
    </Button>
  );
}
```

## Tipos TypeScript

```typescript
import type {
  Recepcion,
  RecepcionDetallada,
  EstadoRecepcion,
  RecepcionFilters,
} from '@/features/recepciones';

// Estados disponibles
const estados: EstadoRecepcion[] = ['INICIADA', 'PESADA', 'CONFIRMADA', 'CANCELADA'];

// Filtros
const filtros: RecepcionFilters = {
  recolector: 123,
  estado: 'CONFIRMADA',
  fecha_desde: '2024-12-01',
  fecha_hasta: '2024-12-31',
  search: 'RMP-20241204',
  page: 1,
  page_size: 20,
};

// Recepción (listado)
function RecepcionCard({ recepcion }: { recepcion: Recepcion }) {
  return (
    <div>
      <h3>{recepcion.codigo_recepcion}</h3>
      <p>Recolector: {recepcion.recolector_nombre}</p>
      <p>Estado: {recepcion.estado_display}</p>
      <p>Merma: {recepcion.porcentaje_merma}%</p>
      <p>Puede pesar: {recepcion.puede_pesar ? 'Sí' : 'No'}</p>
      <p>Puede confirmar: {recepcion.puede_confirmar ? 'Sí' : 'No'}</p>
    </div>
  );
}

// Recepción detallada (con detalles anidados)
function RecepcionDetailView({ recepcion }: { recepcion: RecepcionDetallada }) {
  return (
    <div>
      <h1>{recepcion.codigo_recepcion}</h1>

      <section>
        <h2>Información General</h2>
        <p>Recolector: {recepcion.recolector_nombre}</p>
        <p>Documento: {recepcion.recolector_documento}</p>
        <p>Recibido por: {recepcion.recibido_por_nombre}</p>
        <p>Tanque destino: {recepcion.tanque_destino}</p>
      </section>

      <section>
        <h2>Pesos y Merma</h2>
        <p>Peso esperado: {recepcion.peso_esperado_kg} kg</p>
        <p>Peso real: {recepcion.peso_real_kg} kg</p>
        <p>Merma: {recepcion.merma_kg} kg ({recepcion.porcentaje_merma}%)</p>
      </section>

      <section>
        <h2>Detalles de Recolecciones ({recepcion.cantidad_recolecciones})</h2>
        {recepcion.detalles.map((detalle) => (
          <DetalleRow key={detalle.id}>
            <td>{detalle.recoleccion_codigo}</td>
            <td>{detalle.ecoaliado_nombre}</td>
            <td>{detalle.peso_esperado_kg} kg</td>
            <td>{detalle.peso_real_kg} kg</td>
            <td>{detalle.merma_kg} kg</td>
            <td>{detalle.porcentaje_merma}%</td>
          </DetalleRow>
        ))}
      </section>
    </div>
  );
}
```

## Flujo de Trabajo Completo

```typescript
import {
  useRecoleccionesPendientes,
  useIniciarRecepcion,
  useRegistrarPesaje,
  useConfirmarRecepcion,
  useRecepcion,
} from '@/features/recepciones';

function ProcesoRecepcionCompleto() {
  const [recepcionId, setRecepcionId] = useState<number | null>(null);
  const [paso, setPaso] = useState<'pendientes' | 'pesaje' | 'confirmar'>('pendientes');

  // Paso 1: Ver recolecciones pendientes
  const { data: pendientes } = useRecoleccionesPendientes();
  const iniciarRecepcion = useIniciarRecepcion();

  // Paso 2: Registrar pesaje
  const registrarPesaje = useRegistrarPesaje();

  // Paso 3: Confirmar recepción
  const confirmarRecepcion = useConfirmarRecepcion();
  const { data: recepcion } = useRecepcion(recepcionId);

  // Paso 1: Iniciar
  const handleIniciarRecepcion = async (recoleccionIds: number[]) => {
    const response = await iniciarRecepcion.mutateAsync({
      recolector_id: 123,
      recoleccion_ids: recoleccionIds,
    });
    setRecepcionId(response.recepcion.id);
    setPaso('pesaje');
  };

  // Paso 2: Pesar
  const handleRegistrarPesaje = async (pesoReal: number) => {
    await registrarPesaje.mutateAsync({
      id: recepcionId!,
      data: { peso_real_kg: pesoReal },
    });
    setPaso('confirmar');
  };

  // Paso 3: Confirmar
  const handleConfirmar = async () => {
    await confirmarRecepcion.mutateAsync({
      id: recepcionId!,
      data: { tanque_destino: 'TANQUE-ACU-01' },
    });
    // Proceso completado
    alert('Recepción confirmada exitosamente');
  };

  return (
    <div>
      {paso === 'pendientes' && (
        <RecoleccionesPendientesStep
          pendientes={pendientes?.recolecciones || []}
          onIniciar={handleIniciarRecepcion}
        />
      )}

      {paso === 'pesaje' && recepcion && (
        <RegistrarPesajeStep
          recepcion={recepcion}
          onRegistrar={handleRegistrarPesaje}
        />
      )}

      {paso === 'confirmar' && recepcion && (
        <ConfirmarRecepcionStep
          recepcion={recepcion}
          onConfirmar={handleConfirmar}
        />
      )}
    </div>
  );
}
```

## Características de los Hooks

Todos los hooks de React Query incluyen:

- **Caché automático**: Los datos se cachean para evitar llamadas innecesarias
- **Invalidación automática**: Cuando una mutation tiene éxito, invalida las queries relacionadas
- **Toasts automáticos**: Mensajes de éxito/error automáticos con react-hot-toast
- **Loading states**: Estados `isPending`, `isLoading`, `isError` incluidos
- **Optimistic updates**: Las queries se invalidan automáticamente después de mutations
- **Type safety**: TypeScript completo en todas las operaciones

## Notas Importantes

1. **Prorrateo de Merma**: La merma se distribuye proporcionalmente entre todas las recolecciones del lote según su peso
2. **Estados**: Solo se pueden cancelar recepciones en estado INICIADA o PESADA
3. **Soft Delete**: Las recepciones eliminadas solo se marcan como eliminadas, no se borran de la BD
4. **Permisos**: Los endpoints requieren permisos específicos según el rol del usuario
5. **Validaciones**: El backend valida que el peso real no exceda el esperado en más del 10%

## Soporte

Para más información, consultar:
- Backend: `backend/apps/recepciones/`
- Documentación API: `/api/docs/` (Swagger)
- Tests: `backend/apps/recepciones/tests/`
