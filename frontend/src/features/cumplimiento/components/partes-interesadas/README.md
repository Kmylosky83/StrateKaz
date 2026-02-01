# Componentes de Partes Interesadas

Componentes UI para la gestión de Partes Interesadas según ISO 9001:2015 (Cláusula 4.2).

## Estructura de Archivos

```
partes-interesadas/
├── index.ts                      # Barrel export
├── PartesInteresadasTab.tsx      # Componente principal con subtabs
├── PartesTable.tsx               # Tabla con paginación y acciones CRUD
├── ParteFormModal.tsx            # Modal de creación/edición
├── MatrizInfluenciaInteres.tsx   # Visualización matriz 3x3
└── README.md                     # Esta documentación
```

## Componentes

### 1. PartesInteresadasTab (Principal)

Componente contenedor con navegación por subtabs:

- **Listado de Partes**: Tabla completa con filtros y estadísticas
- **Matriz Influencia/Interés**: Visualización matricial 3x3
- **Requisitos**: Gestión de necesidades y expectativas (próximamente)
- **Comunicaciones**: Plan de comunicación con stakeholders (próximamente)

**Props:**
```typescript
interface PartesInteresadasTabProps {
  activeSection?: string; // Desde DynamicSections
}
```

**Uso:**
```tsx
import { PartesInteresadasTab } from '@/features/cumplimiento/components/partes-interesadas';

<PartesInteresadasTab activeSection="partes-interesadas" />
```

**Características:**
- 4 subtabs con navegación tipo pills
- Cards de estadísticas (Total, Internas, Externas, Alta Influencia)
- Botones de acción (Exportar, Nueva Parte)
- Manejo de estados de carga y error

---

### 2. PartesTable

Tabla de datos con TanStack Table v8.

**Props:**
```typescript
interface PartesTableProps {
  data: ParteInteresada[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  onEdit: (parte: ParteInteresada) => void;
  onDelete: (parte: ParteInteresada) => void;
  isLoading?: boolean;
}
```

**Columnas:**
1. **Tipo**: Badge con categoría (Interna/Externa)
2. **Nombre**: Nombre + descripción truncada
3. **Representante**: Nombre y cargo
4. **Influencia**: Badge colorizado (Alta/Media/Baja)
5. **Interés**: Badge colorizado (Alto/Medio/Bajo)
6. **Sistemas**: Badges de sistemas relacionados (SST, Amb, Cal, PESV)
7. **Contacto**: Email y teléfono
8. **Acciones**: Botones Editar/Eliminar

**Características:**
- Paginación del servidor
- Estados de carga (skeleton)
- Empty state cuando no hay datos
- Hover effects en filas
- Responsive design

---

### 3. MatrizInfluenciaInteres

Visualización matricial 3x3 de partes interesadas según influencia e interés.

**Props:**
```typescript
// No requiere props, obtiene empresaId del authStore
```

**Estructura de Matriz:**

```
                    NIVEL DE INTERÉS
                ALTO          MEDIO         BAJO
        ┌────────────────────────────────────────┐
   ALTA │ GESTIONAR     MANTENER      MANTENER   │
        │ DE CERCA      SATISFECHO    SATISFECHO │
        ├────────────────────────────────────────┤
  MEDIA │ MANTENER      SEGUIMIENTO   MONITOREAR │
        │ INFORMADO     REGULAR                  │
        ├────────────────────────────────────────┤
   BAJA │ MANTENER      MONITOREAR    MONITOREAR │
        │ INFORMADO                              │
        └────────────────────────────────────────┘
```

**Estrategias de Gestión:**

- **Gestionar de Cerca** (Alta/Alto): Comunicación frecuente y participación activa
- **Mantener Satisfecho** (Alta/Medio-Bajo): Satisfacer necesidades sin exceso de comunicación
- **Mantener Informado** (Media-Baja/Alto): Comunicación regular sobre temas relevantes
- **Monitorear** (Media-Baja/Medio-Bajo): Seguimiento mínimo, comunicación básica

**Características:**
- Colores diferenciados por estrategia
- Click en parte para ver detalles
- Modal de vista rápida
- Contador de partes por cuadrante
- Leyenda explicativa de estrategias
- Scroll independiente por cuadrante

**Datos requeridos del API:**
```typescript
{
  alta_alto: ParteInteresada[],
  alta_medio: ParteInteresada[],
  alta_bajo: ParteInteresada[],
  media_alto: ParteInteresada[],
  media_medio: ParteInteresada[],
  media_bajo: ParteInteresada[],
  baja_alto: ParteInteresada[],
  baja_medio: ParteInteresada[],
  baja_bajo: ParteInteresada[]
}
```

---

### 4. ParteFormModal

Modal de creación/edición con formulario completo.

**Props:**
```typescript
interface ParteFormModalProps {
  parte: ParteInteresada | null;  // null = crear, objeto = editar
  isOpen: boolean;
  onClose: () => void;
}
```

**Secciones del Formulario:**

#### Información Básica
- Tipo de Parte Interesada (select con tipos del catálogo)
- Nombre (requerido)
- Descripción (opcional)

#### Representante y Contacto
- Nombre del Representante
- Cargo del Representante
- Correo Electrónico (con validación)
- Teléfono
- Dirección

#### Análisis de Influencia e Interés
Controles tipo radio con descripción visual:

**Nivel de Influencia:**
- Alta: Afecta significativamente (badge rojo)
- Media: Afecta moderadamente (badge naranja)
- Baja: Afecta poco (badge gris)

**Nivel de Interés:**
- Alto: Muy interesado (badge rojo)
- Medio: Moderadamente interesado (badge naranja)
- Bajo: Poco interesado (badge gris)

#### Sistemas de Gestión Relacionados
Checkboxes colorizados:
- SST (naranja)
- Ambiental (verde)
- Calidad (azul)
- PESV (morado)

**Validaciones:**
- Tipo requerido
- Nombre requerido
- Email válido (si se proporciona)

---

## Hooks Utilizados

### usePartesInteresadas
```typescript
const { data, isLoading, error } = usePartesInteresadas(filters);
```

**Filtros disponibles:**
```typescript
interface ParteInteresadaFilters {
  page?: number;
  page_size?: number;
  search?: string;
  tipo?: number;
  categoria?: 'interna' | 'externa';
  nivel_influencia?: 'alta' | 'media' | 'baja';
  nivel_interes?: 'alto' | 'medio' | 'bajo';
  relacionado_sst?: boolean;
  relacionado_ambiental?: boolean;
  relacionado_calidad?: boolean;
  relacionado_pesv?: boolean;
}
```

### useMatrizInfluenciaInteres
```typescript
const { data, isLoading, error } = useMatrizInfluenciaInteres(empresaId);
```

### useTiposParteInteresada
```typescript
const { data } = useTiposParteInteresada();
```

---

## Tipos de Datos

### ParteInteresada
```typescript
interface ParteInteresada {
  id: number;
  empresa_id: number;
  tipo: number;
  tipo_nombre: string;
  nombre: string;
  descripcion?: string;
  representante?: string;
  cargo_representante?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  nivel_influencia: 'alta' | 'media' | 'baja';
  nivel_influencia_display: string;
  nivel_interes: 'alto' | 'medio' | 'bajo';
  nivel_interes_display: string;
  relacionado_sst: boolean;
  relacionado_ambiental: boolean;
  relacionado_calidad: boolean;
  relacionado_pesv: boolean;
  created_at: string;
  updated_at: string;
}
```

---

## Paleta de Colores

### Niveles de Influencia
- Alta: `danger` (rojo) - `bg-red-50 border-red-300 text-red-700`
- Media: `warning` (naranja) - `bg-orange-50 border-orange-300 text-orange-700`
- Baja: `gray` - `bg-gray-50 border-gray-300 text-gray-700`

### Niveles de Interés
- Alto: `danger` (rojo)
- Medio: `warning` (naranja)
- Bajo: `gray`

### Categorías
- Interna: `info` (azul) + icono Building2
- Externa: `success` (verde) + icono User

### Sistemas
- SST: `warning` (naranja)
- Ambiental: `success` (verde)
- Calidad: `info` (azul)
- PESV: `primary` (morado)

---

## Estado de Implementación

### Completado ✅
- [x] PartesInteresadasTab con estructura de subtabs
- [x] PartesTable con todas las columnas
- [x] ParteFormModal con formulario completo
- [x] MatrizInfluenciaInteres con cuadrantes 3x3
- [x] Integración con hooks de React Query
- [x] Tipos TypeScript completos
- [x] Estados de carga y error
- [x] Diseño responsive

### Pendiente ⏳
- [ ] Subtab de Requisitos (Semana 8)
- [ ] Subtab de Comunicaciones (Semana 8)
- [ ] Implementar mutations (create, update, delete)
- [ ] Exportación a Excel
- [ ] Filtros avanzados en listado
- [ ] Búsqueda en tiempo real

---

## Relación con Backend

### Endpoints
```
GET    /api/motor_cumplimiento/partes-interesadas/tipos/
GET    /api/motor_cumplimiento/partes-interesadas/partes/
GET    /api/motor_cumplimiento/partes-interesadas/partes/{id}/
POST   /api/motor_cumplimiento/partes-interesadas/partes/
PATCH  /api/motor_cumplimiento/partes-interesadas/partes/{id}/
DELETE /api/motor_cumplimiento/partes-interesadas/partes/{id}/
GET    /api/motor_cumplimiento/partes-interesadas/partes/matriz-influencia-interes/
```

### Apps Django
- `backend/apps/motor_cumplimiento/partes_interesadas/models.py`
- `backend/apps/motor_cumplimiento/partes_interesadas/serializers.py`
- `backend/apps/motor_cumplimiento/partes_interesadas/views.py`

---

## Convenciones de Código

- Todos los componentes usan TypeScript estricto
- Naming: PascalCase para componentes, camelCase para funciones
- Barrel exports en `index.ts`
- Comentarios JSDoc en componentes principales
- Separación clara de secciones con comentarios de líneas `=====`
- Uso de Design System existente (Button, Card, Badge, etc.)
- Manejo de errores con try-catch
- Estados de carga con Spinner o skeleton
- Empty states informativos

---

## Mejoras Futuras

1. **Filtros Avanzados**: Panel de filtros colapsable con todos los criterios
2. **Vista de Tarjetas**: Alternativa a la tabla para móviles
3. **Exportación**: PDF y Excel con gráficos
4. **Importación**: CSV/Excel para carga masiva
5. **Dashboards**: Gráficos de distribución (pie charts, bar charts)
6. **Historial**: Timeline de cambios por parte interesada
7. **Adjuntos**: Soporte para documentos relacionados
8. **Notificaciones**: Alertas de cambios en partes críticas

---

## Autor

Sistema de Gestión Integral - StrateKaz
Módulo de Cumplimiento - Partes Interesadas
Desarrollado siguiendo estándares ISO 9001:2015
