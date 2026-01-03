# Logistics Fleet Management Module

Sistema completo de Gestión de Flota y Transporte para StrateKaz.

## Características Principales

### Cumplimiento PESV (Resolución 40595/2022)

- Control automático de vencimientos de documentos vehiculares (SOAT, Tecnomecánica)
- Verificación de licencias de conducción vigentes
- Inspecciones preoperacionales diarias con checklist dinámico
- Alertas visuales para documentos vencidos o próximos a vencer
- Bloqueo operativo de vehículos con documentos vencidos

### Gestión de Flota

#### Vehículos
- **Catálogos Dinámicos**: Tipos de vehículos y estados personalizables
- **Información Completa**: Datos técnicos, legales, propiedad y GPS
- **Dashboard**: KPIs en tiempo real (disponibles, en mantenimiento, documentos vencidos)
- **Documentación**: Gestión de SOAT, tecnomecánica, tarjeta de propiedad, pólizas
- **Hoja de Vida**: Historial completo de eventos (mantenimientos, accidentes, infracciones)

#### Mantenimientos
- **Tipos**: Preventivo, correctivo y predictivo
- **Control de Costos**: Mano de obra y repuestos
- **Programación**: Calendario de mantenimientos con alertas de vencimiento
- **Kilometraje**: Control por kilómetros recorridos
- **Estados**: Programado, en ejecución, completado, cancelado

#### Costos Operativos
- **Tipos**: Combustible, peajes, parqueaderos, lavados, lubricantes, neumáticos, multas
- **Indicadores**: Consumo km/litro, costo por kilómetro
- **Estadísticas**: Análisis de costos por vehículo y período
- **Trazabilidad**: Facturación y control financiero

#### Verificaciones PESV
- **Inspecciones Preoperacionales Diarias**: Checklist dinámico JSON
- **Inspecciones Mensuales**: Control periódico
- **Auditorías Externas**: Registro de inspecciones de terceros
- **Resultados**: Aprobado, aprobado con observaciones, rechazado
- **Acciones Correctivas**: Seguimiento de hallazgos

### Gestión de Transporte

#### Rutas
- **Rutas Predefinidas**: Origen, destino, puntos intermedios
- **Tipos**: Recolección, entrega, transferencia
- **Información**: Distancia, tiempo estimado, costos, peajes
- **Cadena de Frío**: Identificación de rutas que requieren refrigeración

#### Conductores
- **Información Completa**: Datos personales, contacto, vinculación
- **Licencias**: Número, categoría, fecha de vencimiento
- **Tipo**: Empleados directos o terceros (empresas transportadoras)
- **Control de Vigencia**: Alertas de licencias próximas a vencer o vencidas
- **Archivos**: Foto y firma digital

#### Programaciones de Rutas
- **Asignación**: Vehículo + Conductor + Ruta + Fecha
- **Código Automático**: PR-YYYYMMDD-NNNN
- **Control de Viaje**: Hora salida/llegada real, kilometraje inicial/final
- **Estados**: Programada, en curso, completada, cancelada
- **Observaciones**: Registro de novedades del viaje

#### Despachos
- **Código Automático**: DESP-YYYYMMDD-NNNN
- **Cliente**: Nombre, dirección, contacto
- **Carga**: Peso, volumen, valor declarado
- **Cadena de Frío**: Temperatura requerida
- **Entrega**: Fecha estimada/real, recibido por, firma digital
- **Novedades**: Registro de incidencias
- **Detalles**: Líneas de productos con trazabilidad

#### Manifiestos (RNDC)
- **Número Automático**: MAN-YYYYMMDD-NNNN
- **Remitente y Destinatario**: Información completa (NIT, dirección)
- **Carga**: Descripción, peso, unidades, valor flete
- **Vehículo y Conductor**: Datos para el manifiesto
- **Generación PDF**: Documento oficial para transporte

## Estructura del Módulo

```
frontend/src/features/logistics-fleet/
├── types/
│   └── logistics-fleet.types.ts      # ~20 interfaces TypeScript
├── api/
│   └── logisticsFleetApi.ts          # Funciones CRUD para todos los modelos
├── hooks/
│   └── useLogisticsFleet.ts          # React Query hooks
├── components/
│   ├── GestionFlotaTab.tsx           # Tab de gestión de flota
│   └── GestionTransporteTab.tsx      # Tab de gestión de transporte
├── pages/
│   └── LogisticsFleetPage.tsx        # Página principal con 2 tabs
└── index.ts                          # Exportaciones del módulo
```

## Tecnologías Utilizadas

- **React 18+** con TypeScript 5.x
- **React Query (TanStack Query)** para gestión de estado servidor
- **Shadcn/UI** para componentes de interfaz
- **Tailwind CSS** para estilos
- **Lucide React** para iconos
- **date-fns** para manejo de fechas
- **Axios** para comunicación con API

## Backend APIs

### Gestión de Flota
- Base URL: `/api/logistics-fleet/gestion-flota`

#### Endpoints:
- `GET /tipos-vehiculo/` - Catálogo de tipos de vehículos
- `GET /estados-vehiculo/` - Catálogo de estados
- `GET /vehiculos/` - Lista de vehículos (con filtros)
- `GET /vehiculos/:id/` - Detalle de vehículo
- `POST /vehiculos/` - Crear vehículo
- `PATCH /vehiculos/:id/` - Actualizar vehículo
- `DELETE /vehiculos/:id/` - Eliminar vehículo
- `GET /vehiculos/vencidos/` - Vehículos con documentos vencidos
- `GET /vehiculos/dashboard/` - Dashboard de flota
- `GET /documentos/` - Documentos de vehículos
- `GET /hoja-vida/` - Hoja de vida de vehículos
- `GET /mantenimientos/` - Mantenimientos
- `POST /mantenimientos/:id/completar/` - Completar mantenimiento
- `GET /costos-operacion/` - Costos operativos
- `GET /costos-operacion/estadisticas/` - Estadísticas de costos
- `GET /verificaciones/` - Verificaciones PESV

### Gestión de Transporte
- Base URL: `/api/logistics-fleet/gestion-transporte`

#### Endpoints:
- `GET /tipos-ruta/` - Catálogo de tipos de rutas
- `GET /estados-despacho/` - Catálogo de estados de despacho
- `GET /rutas/` - Lista de rutas
- `GET /conductores/` - Lista de conductores
- `GET /conductores/licencia-vencida/` - Conductores con licencia vencida
- `GET /programaciones/` - Programaciones de rutas
- `POST /programaciones/:id/iniciar/` - Iniciar viaje
- `POST /programaciones/:id/finalizar/` - Finalizar viaje
- `GET /despachos/` - Lista de despachos
- `GET /detalles-despacho/` - Detalles de despachos
- `GET /manifiestos/` - Lista de manifiestos
- `GET /manifiestos/:id/generar-pdf/` - Generar PDF de manifiesto

## Uso

### Importar el módulo

```typescript
import { LogisticsFleetPage } from '@/features/logistics-fleet';
```

### Usar hooks

```typescript
import {
  useVehiculos,
  useDashboardFlota,
  useVehiculosVencidos
} from '@/features/logistics-fleet';

function MyComponent() {
  const { data: vehiculos, isLoading } = useVehiculos({ is_active: true });
  const { data: dashboard } = useDashboardFlota();
  const { data: vencidos } = useVehiculosVencidos();

  // ... resto del componente
}
```

### Crear un vehículo

```typescript
import { useCreateVehiculo } from '@/features/logistics-fleet';
import type { CreateVehiculoDTO } from '@/features/logistics-fleet';

function CreateVehicleForm() {
  const createMutation = useCreateVehiculo();

  const handleSubmit = async (data: CreateVehiculoDTO) => {
    await createMutation.mutateAsync(data);
  };

  // ... resto del formulario
}
```

## Características Técnicas

### Tipos TypeScript Estrictos
- ~20 interfaces completas basadas en los modelos del backend
- DTOs específicos para Create/Update
- Tipos de filtros para cada endpoint
- Respuestas paginadas tipadas

### React Query
- Stale time configurado por tipo de dato
- Invalidación automática de caché en mutaciones
- Optimistic updates donde aplica
- Retry logic y error handling

### Componentes Reutilizables
- Tabs principales (Flota / Transporte)
- Sub-tabs para Transporte (5 secciones)
- Cards de dashboard con KPIs
- Tablas con búsqueda y paginación
- Badges de estado con colores dinámicos
- Alertas PESV para documentos vencidos

### Alertas PESV
- Documentos vehiculares vencidos (SOAT, Tecnomecánica)
- Licencias de conducción vencidas
- Badges de advertencia con días hasta vencimiento
- Bloqueo visual de vehículos no operables

## Próximos Pasos

### Formularios Completos
- Crear formularios modales para cada entidad
- Validación con Zod
- React Hook Form para manejo de estado

### Detalles Expandidos
- Vista detallada de vehículo con tabs (Info, Documentos, Hoja Vida, Mantenimientos, Costos)
- Vista detallada de conductor
- Vista detallada de programación con timeline
- Vista detallada de despacho con tracking

### Reportes
- Reporte de costos por vehículo
- Reporte de mantenimientos
- Reporte de inspecciones PESV
- Estadísticas de despachos

### Funcionalidades Avanzadas
- Upload de documentos con preview
- Firma digital para verificaciones
- Geolocalización en tiempo real
- Notificaciones push para vencimientos
- Calendario visual de programaciones

## Autor

Módulo desarrollado para el sistema ERP de StrateKaz.

Cumplimiento: Resolución 40595 de 2022 - Plan Estratégico de Seguridad Vial (PESV)
