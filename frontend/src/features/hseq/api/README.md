# API Clients - HSEQ Management

API clients para el módulo de Gestión HSEQ del Sistema de Gestión StrateKaz.

## Estructura

```
api/
├── planificacionApi.ts          # API para Planificación del Sistema
├── calidadApi.ts                # API para Gestión de Calidad
├── medicinaLaboralApi.ts        # API para Medicina Laboral
├── seguridadIndustrialApi.ts    # API para Seguridad Industrial
├── accidentalidadApi.ts         # API para Accidentalidad (ATEL)
├── emergenciasApi.ts            # API para Emergencias
├── gestionAmbientalApi.ts       # API para Gestión Ambiental
├── mejoraContinuaApi.ts         # API para Mejora Continua
├── comitesApi.ts                # API para Gestión de Comités
└── README.md                    # Esta documentación
```

> **NOTA:** Sistema Documental ha sido migrado a `@/features/gestion-estrategica/api/gestionDocumentalApi.ts`
> Las firmas digitales ahora usan el sistema consolidado en `workflow_engine.firma_digital`

## Planificación del Sistema

### Módulos Disponibles

1. **Plan de Trabajo Anual** (`planTrabajoApi`)
2. **Actividades del Plan** (`actividadPlanApi`)
3. **Objetivos del Sistema** (`objetivoSistemaApi`)
4. **Programas de Gestión** (`programaGestionApi`)
5. **Actividades de Programas** (`actividadProgramaApi`)
6. **Seguimiento de Cronograma** (`seguimientoCronogramaApi`)

### Ejemplos de Uso

#### 1. Plan de Trabajo Anual

```typescript
import { planTrabajoApi } from '@/features/hseq';

// Obtener todos los planes
const planes = await planTrabajoApi.getAll({
  periodo: 2024,
  estado: 'APROBADO'
});

// Obtener un plan específico
const plan = await planTrabajoApi.getById(1);

// Crear un nuevo plan
const nuevoPlan = await planTrabajoApi.create({
  codigo: 'PTA-2024',
  nombre: 'Plan de Trabajo Anual 2024',
  periodo: 2024,
  responsable: 5,
  fecha_inicio: '2024-01-01',
  fecha_fin: '2024-12-31',
  descripcion: 'Plan de trabajo para el año 2024'
});

// Aprobar un plan
await planTrabajoApi.aprobar(1);

// Cambiar estado
await planTrabajoApi.cambiarEstado(1, 'EN_EJECUCION');

// Obtener estadísticas
const stats = await planTrabajoApi.getEstadisticas(1);
```

#### 2. Actividades del Plan

```typescript
import { actividadPlanApi } from '@/features/hseq';

// Obtener actividades
const actividades = await actividadPlanApi.getAll({
  plan_trabajo: 1,
  estado: 'PENDIENTE'
});

// Crear actividad
const actividad = await actividadPlanApi.create({
  plan_trabajo: 1,
  codigo: 'ACT-001',
  nombre: 'Capacitación SST',
  tipo_actividad: 'CAPACITACION',
  area_responsable: 'HSEQ',
  fecha_programada_inicio: '2024-02-01',
  fecha_programada_fin: '2024-02-28',
  responsable: 5
});

// Actualizar avance
await actividadPlanApi.actualizarAvance(1, 75, 'Avance según lo programado');

// Cambiar estado
await actividadPlanApi.cambiarEstado(1, 'EN_PROCESO');

// Obtener actividades de un plan
const actividadesPlan = await actividadPlanApi.porPlan(1);
```

#### 3. Objetivos del Sistema (BSC)

```typescript
import { objetivoSistemaApi } from '@/features/hseq';

// Crear objetivo vinculado a BSC
const objetivo = await objetivoSistemaApi.create({
  plan_trabajo: 1,
  codigo: 'OBJ-001',
  nombre: 'Reducir accidentalidad',
  descripcion: 'Reducir la tasa de accidentalidad en un 20%',
  perspectiva_bsc: 'PROCESOS',
  tipo_objetivo: 'ESTRATEGICO',
  area_aplicacion: 'SST',
  responsable: 5,
  meta_descripcion: 'Lograr una tasa de accidentalidad menor a 2.5',
  meta_cuantitativa: 2.5,
  unidad_medida: '%',
  indicador_nombre: 'Tasa de Accidentalidad',
  formula_calculo: '(Nº accidentes / Nº trabajadores) * 100',
  fecha_inicio: '2024-01-01',
  fecha_meta: '2024-12-31'
});

// Actualizar cumplimiento
await objetivoSistemaApi.actualizarCumplimiento(1, 2.3, 92);

// Obtener por perspectiva BSC
const objetivosProcesos = await objetivoSistemaApi.porPerspectiva(1, 'PROCESOS');

// Obtener todos los objetivos de un plan
const objetivosPlan = await objetivoSistemaApi.porPlan(1);
```

#### 4. Programas de Gestión

```typescript
import { programaGestionApi } from '@/features/hseq';

// Crear programa
const programa = await programaGestionApi.create({
  plan_trabajo: 1,
  codigo: 'PVE-001',
  nombre: 'Programa de Vigilancia Epidemiológica',
  descripcion: 'PVE para riesgo biomecánico',
  tipo_programa: 'PVE',
  alcance: 'Todo el personal operativo',
  objetivos: 'Prevenir lesiones osteomusculares',
  responsable: 5,
  fecha_inicio: '2024-01-01',
  fecha_fin: '2024-12-31'
});

// Actualizar avance
await programaGestionApi.actualizarAvance(1, 60);

// Obtener programas por tipo
const programasPVE = await programaGestionApi.porTipo('PVE');

// Obtener programas de un plan
const programasPlan = await programaGestionApi.porPlan(1);
```

#### 5. Actividades de Programas

```typescript
import { actividadProgramaApi } from '@/features/hseq';

// Crear actividad de programa
const actividad = await actividadProgramaApi.create({
  programa: 1,
  codigo: 'ACT-PVE-001',
  nombre: 'Evaluación biomecánica',
  descripcion: 'Evaluación de puestos de trabajo',
  fecha_programada: '2024-03-15',
  responsable: 8
});

// Ejecutar actividad
await actividadProgramaApi.ejecutar(
  1,
  'Se evaluaron 25 puestos de trabajo',
  'Informe técnico adjunto en sistema documental'
);

// Cancelar actividad
await actividadProgramaApi.cancelar(2, 'Cambio en prioridades');

// Obtener actividades de un programa
const actividadesPrograma = await actividadProgramaApi.porPrograma(1);
```

#### 6. Seguimiento de Cronograma

```typescript
import { seguimientoCronogramaApi } from '@/features/hseq';

// Crear seguimiento
const seguimiento = await seguimientoCronogramaApi.create({
  plan_trabajo: 1,
  periodo: 'Enero 2024',
  fecha_seguimiento: '2024-01-31',
  realizado_por: 5,
  actividades_totales: 20,
  actividades_completadas: 12,
  actividades_en_proceso: 5,
  actividades_retrasadas: 2,
  actividades_pendientes: 1,
  porcentaje_avance_general: 60,
  presupuesto_planificado: 50000000,
  presupuesto_ejecutado: 28000000,
  desviaciones_identificadas: 'Retraso en actividades de capacitación',
  causas_desviacion: 'Indisponibilidad de instructores externos',
  acciones_correctivas: 'Reprogramar capacitaciones para febrero',
  nivel_cumplimiento: 'BUENO'
});

// Generar reporte en PDF
await seguimientoCronogramaApi.generarReporte(1, 'pdf');

// Generar reporte en Excel
await seguimientoCronogramaApi.generarReporte(1, 'excel');

// Obtener seguimientos de un plan
const seguimientos = await seguimientoCronogramaApi.porPlan(1);
```

### Uso con React Query Hooks

Para facilitar el uso en componentes React, utiliza los hooks personalizados:

```typescript
import {
  usePlanesTrabajoQuery,
  usePlanTrabajoQuery,
  useCreatePlanTrabajo,
  useActualizarAvanceActividad
} from '@/features/hseq';

function PlanTrabajoPage() {
  // Obtener lista de planes
  const { data: planes, isLoading } = usePlanesTrabajoQuery({
    periodo: 2024,
    estado: 'EN_EJECUCION'
  });

  // Obtener plan específico
  const { data: plan } = usePlanTrabajoQuery(1);

  // Crear plan
  const createMutation = useCreatePlanTrabajo();

  const handleCreate = async (formData) => {
    await createMutation.mutateAsync(formData);
  };

  // Actualizar avance de actividad
  const updateAvance = useActualizarAvanceActividad();

  const handleUpdateAvance = async (actividadId, porcentaje) => {
    await updateAvance.mutateAsync({
      id: actividadId,
      porcentaje,
      observaciones: 'Actualización manual'
    });
  };

  return (
    // ... JSX
  );
}
```

## Convenciones

### Nombres de Funciones

- **getAll**: Obtener lista paginada con filtros opcionales
- **getById**: Obtener un registro específico por ID
- **create**: Crear un nuevo registro
- **update**: Actualizar un registro existente (PATCH)
- **delete**: Eliminar un registro
- **aprobar**: Aprobar un registro (cambio de estado especial)
- **cambiarEstado**: Cambiar el estado de un registro
- **actualizarAvance**: Actualizar porcentaje de avance
- **actualizarCumplimiento**: Actualizar cumplimiento de objetivos
- **ejecutar**: Marcar actividad como ejecutada
- **cancelar**: Cancelar actividad o registro
- **porPlan**: Filtrar por plan de trabajo
- **porPrograma**: Filtrar por programa
- **porPerspectiva**: Filtrar por perspectiva BSC
- **porTipo**: Filtrar por tipo
- **generarReporte**: Generar reportes en diferentes formatos

### Parámetros Comunes

```typescript
// Paginación
{
  page?: number;          // Número de página (1-indexed)
  page_size?: number;     // Registros por página (default: 10)
}

// Búsqueda
{
  search?: string;        // Búsqueda general en campos relevantes
}

// Filtros por fecha
{
  fecha_desde?: string;   // Formato: 'YYYY-MM-DD'
  fecha_hasta?: string;   // Formato: 'YYYY-MM-DD'
}

// Filtros por relación
{
  plan_trabajo?: number;  // ID del plan de trabajo
  programa?: number;      // ID del programa
  responsable?: number;   // ID del usuario responsable
}

// Filtros por estado
{
  estado?: string;        // Estado específico del modelo
}
```

### Tipos de Respuesta

```typescript
// Lista paginada
interface PaginatedResponse<T> {
  count: number;           // Total de registros
  next: string | null;     // URL siguiente página
  previous: string | null; // URL página anterior
  results: T[];           // Array de resultados
}

// Registro individual
type Response<T> = T;
```

## Manejo de Errores

Los errores se propagan desde el backend y pueden ser capturados:

```typescript
try {
  const plan = await planTrabajoApi.create(data);
} catch (error: any) {
  console.error('Error:', error.response?.data);
  // error.response.data.message - Mensaje de error
  // error.response.data.errors - Errores de validación
}
```

Con React Query hooks:

```typescript
const mutation = useCreatePlanTrabajo();

mutation.mutate(data, {
  onSuccess: (data) => {
    console.log('Éxito:', data);
  },
  onError: (error: any) => {
    console.error('Error:', error.response?.data);
  }
});
```

## Base URL

Todos los endpoints utilizan la base URL:

```
/api/hseq/planificacion-sistema/
```

## Documentación Relacionada

- [Tipos TypeScript](../types/planificacion-sistema.types.ts)
- [Custom Hooks](../hooks/usePlanificacionSistema.ts)
- [Modelos Backend](../../../../backend/apps/hseq_management/planificacion_sistema/models.py)

## Notas Importantes

1. **Multi-tenant**: Todos los endpoints respetan el contexto de empresa (`empresa_id`), que se maneja automáticamente en el backend mediante middleware.

2. **Autenticación**: Se requiere autenticación JWT válida para todos los endpoints.

3. **Permisos**: Algunos endpoints requieren permisos específicos (ej: aprobar planes).

4. **Validaciones**: El backend valida los datos según las reglas de negocio definidas en los modelos.

5. **Transacciones**: Las operaciones críticas (aprobar, cambiar estado) se manejan con transacciones atómicas.

6. **Cache**: Los hooks de React Query configuran automáticamente el cache con `staleTime` de 5 minutos.

7. **Optimistic Updates**: Los hooks invalidan automáticamente las queries relacionadas después de mutaciones exitosas.
