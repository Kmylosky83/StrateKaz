# Módulo Ecoaliados - Frontend

Módulo completo para gestión de Ecoaliados (proveedores de material reciclable) en el sistema Grasas y Huesos del Norte.

## 📁 Estructura

```
ecoaliados/
├── api/
│   ├── ecoaliadosApi.ts          # Cliente API con Axios
│   └── useEcoaliados.ts          # React Query hooks
├── components/
│   ├── EcoaliadosTable.tsx       # Tabla principal con filas expandibles
│   ├── EcoaliadoForm.tsx         # Formulario crear/editar
│   ├── GeolocationButton.tsx     # Botón captura GPS
│   ├── CambiarPrecioModal.tsx    # Modal cambio de precio
│   └── HistorialPrecioModal.tsx  # Modal historial de precios
├── types/
│   └── ecoaliado.types.ts        # Interfaces TypeScript
├── pages/
│   └── EcoaliadosPage.tsx        # Página principal
├── index.ts                       # Exports
└── README.md                      # Esta documentación
```

## 🚀 Características

### 1. **Gestión CRUD Completa**
- ✅ Crear ecoaliado con validación Zod
- ✅ Editar información (excepto documento y precio)
- ✅ Eliminar (soft delete)
- ✅ Activar/Desactivar estado

### 2. **Captura de Geolocalización GPS**
- ✅ Botón interactivo con `navigator.geolocation`
- ✅ Manejo de permisos y errores
- ✅ Visualización de coordenadas capturadas
- ✅ Opcional (no requerido)
- ✅ Ícono de GPS en tabla

### 3. **Gestión de Precios (Solo Líder Comercial+)**
- ✅ Cambiar precio de compra por kg
- ✅ Validación de diferencia (no puede ser igual)
- ✅ Visualización de aumento/disminución con %
- ✅ Justificación obligatoria
- ✅ Auditoría completa con usuario y fecha

### 4. **Historial de Precios**
- ✅ Timeline visual de cambios
- ✅ Mostrar precio anterior, nuevo, diferencia y %
- ✅ Tipo de cambio: INICIAL, AUMENTO, DISMINUCIÓN
- ✅ Justificación de cada cambio
- ✅ Usuario que modificó

### 5. **Filtros Avanzados**
- ✅ Búsqueda por código/razón social
- ✅ Filtrar por Unidad de Negocio
- ✅ Filtrar por Ciudad y Departamento
- ✅ Filtrar por Estado (Activo/Inactivo)
- ✅ Indicador de filtros activos
- ✅ Limpiar todos los filtros

### 6. **Tabla con Detalles Expandibles**
- ✅ Clic en fila para expandir/contraer
- ✅ Vista de toda la información organizada por secciones
- ✅ Dark mode support completo
- ✅ Responsive design

### 7. **Control de Permisos por Rol**
- ✅ **Comercial**: Solo ve/edita SUS ecoaliados (filtrado en backend)
- ✅ **Líder Comercial**: Ve/edita TODOS + puede cambiar precios
- ✅ **Gerente/Superadmin**: Control total

### 8. **Validaciones**
- ✅ documento_numero único (validado en backend)
- ✅ precio >= 0
- ✅ Unidad de Negocio debe ser tipo UNIDAD_NEGOCIO
- ✅ Email format válido
- ✅ Teléfono y dirección requeridos
- ✅ Todas con Zod schema

## 🔌 API Endpoints Utilizados

```typescript
// Ecoaliados CRUD
GET    /api/ecoaliados/ecoaliados/              // Lista (filtrado por permisos)
POST   /api/ecoaliados/ecoaliados/              // Crear
GET    /api/ecoaliados/ecoaliados/{id}/         // Detalle
PUT    /api/ecoaliados/ecoaliados/{id}/         // Actualizar completo
PATCH  /api/ecoaliados/ecoaliados/{id}/         // Actualizar parcial
DELETE /api/ecoaliados/ecoaliados/{id}/         // Soft delete

// Gestión de Precios
POST   /api/ecoaliados/ecoaliados/{id}/cambiar-precio/      // Cambiar precio
GET    /api/ecoaliados/ecoaliados/{id}/historial-precios/   // Ver historial

// Unidades de Negocio
GET    /api/proveedores/proveedores/?tipo_proveedor=UNIDAD_NEGOCIO
```

## 📦 React Query Hooks

```typescript
// CRUD
useEcoaliados(filters)          // Lista con filtros
useEcoaliado(id)                // Detalle por ID
useCreateEcoaliado()            // Crear
useUpdateEcoaliado()            // Actualizar
useDeleteEcoaliado()            // Eliminar (soft delete)
useToggleEcoaliadoStatus()      // Activar/Desactivar

// Precios
useCambiarPrecio()              // Cambiar precio (solo Líder+)
useHistorialPrecios(id)         // Ver historial

// Otros
useUnidadesNegocio()            // Listar unidades para dropdown
```

## 🎨 Componentes Principales

### EcoaliadosPage
Página principal que integra todos los componentes. Maneja:
- Estado de filtros
- Apertura/cierre de modales
- Llamadas a mutations
- Control de permisos

### EcoaliadosTable
Tabla responsiva con:
- Filas expandibles (clic para ver detalles)
- Acciones por fila: Editar, Eliminar, Cambiar Precio, Ver Historial
- Toggle de estado activo/inactivo
- Ícono de GPS si tiene coordenadas
- Dark mode completo

### EcoaliadoForm
Formulario modal para crear/editar con:
- Validación Zod
- Campos agrupados por sección
- GeolocationButton integrado
- Auto-asignación de comercial si es rol COMERCIAL
- Campos no editables en modo edición: documento_tipo, documento_numero, precio (usar CambiarPrecio)

### GeolocationButton
Componente reutilizable para captura GPS:
- Solicita permisos al usuario
- Muestra loading state
- Visualiza coordenadas capturadas
- Manejo de errores amigable
- Soporte para recapturar

### CambiarPrecioModal
Modal para cambiar precio (solo Líder+):
- Muestra precio actual
- Calcula diferencia y % automáticamente
- Badge de AUMENTO/DISMINUCIÓN
- Justificación obligatoria (min 10 chars)
- Advertencia de auditoría

### HistorialPrecioModal
Modal con timeline visual:
- Muestra todos los cambios históricos
- Badges de tipo de cambio
- Diferencia en pesos y porcentaje
- Justificación de cada cambio
- Usuario y fecha

## 🛡️ TypeScript Types

Todos los tipos están en `types/ecoaliado.types.ts`:

```typescript
// Principales
Ecoaliado                    // Entidad completa
CreateEcoaliadoDTO           // Para crear
UpdateEcoaliadoDTO           // Para actualizar
CambiarPrecioEcoaliadoDTO    // Para cambiar precio
HistorialPrecioEcoaliado     // Item de historial
EcoaliadoFilters             // Filtros de búsqueda

// Enums
TipoDocumento                // CC, CE, NIT, PASAPORTE
TipoCambioPrecio             // INICIAL, AUMENTO, DISMINUCION

// Geolocalización
GeolocationCoordinates       // { latitude, longitude, accuracy }
GeolocationError             // { code, message }
```

## 🔧 Uso

### 1. Importar en tu router

```tsx
import { EcoaliadosPage } from '@/features/ecoaliados';

// En tu router
<Route path="/ecoaliados" element={<EcoaliadosPage />} />
```

### 2. Configurar permisos

```tsx
// En EcoaliadosPage.tsx
// Reemplazar MOCK_CURRENT_USER con tu contexto de auth
import { useAuth } from '@/context/AuthContext';

const { user } = useAuth();
const canChangePrecio = ['LIDER_COMERCIAL', 'GERENTE', 'SUPER_ADMIN'].includes(user.role);
const isComercial = user.role === 'COMERCIAL';
```

### 3. Configurar lista de comerciales

```tsx
// En EcoaliadoForm.tsx
// Reemplazar comercialesOptions con query real
const { data: comerciales } = useComerciales(); // Crear este hook

const comercialesOptions = comerciales?.map(c => ({
  value: c.id,
  label: c.nombre_completo
})) || [];
```

## ⚠️ Consideraciones Importantes

### Permisos Backend
El backend YA implementa filtrado por permisos:
- **Comerciales**: Solo ven ecoaliados donde `comercial_asignado = user.id`
- **Líder Comercial+**: Ven todos

### Campos No Editables
En modo edición, estos campos NO son editables:
- `documento_tipo` y `documento_numero` (únicos, no se pueden cambiar)
- `precio_compra_kg` (usar endpoint `/cambiar-precio/`)
- `unidad_negocio` (asignada al crear, no se cambia)

### Geolocalización
- Requiere HTTPS en producción (excepto localhost)
- El usuario debe dar permisos explícitos
- Es OPCIONAL (no requerido para crear ecoaliado)

### Validación de Unicidad
`documento_numero` debe ser único. La validación se hace en el backend.
Si hay duplicado, se muestra toast de error.

## 🎨 Dark Mode

Todos los componentes tienen soporte completo para dark mode usando clases Tailwind:
```tsx
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
```

## 📱 Responsive

Todos los componentes son responsive:
- Tabla scroll horizontal en móvil
- Grid responsive en formularios (1 col móvil, 2 cols tablet+)
- Modales adaptables

## 🚧 TODOs Pendientes

1. **Obtener comerciales del backend**
   - Crear endpoint `/api/usuarios/comerciales/`
   - Crear hook `useComerciales()`
   - Reemplazar en EcoaliadoForm

2. **Integrar contexto de autenticación**
   - Reemplazar `MOCK_CURRENT_USER` con `useAuth()`
   - Obtener permisos del token JWT

3. **Paginación en tabla**
   - Implementar botones prev/next
   - Mostrar número de página actual

4. **Exportar a Excel**
   - Botón para descargar listado filtrado

5. **Mapa de ecoaliados**
   - Visualizar en mapa los que tienen GPS
   - Usar Google Maps o Leaflet

## 📝 Notas de Desarrollo

- Sigue el patrón del módulo **Proveedores**
- Reutiliza componentes comunes: Button, Input, Select, Modal, Badge, Card
- Usa React Query para estado del servidor
- Validación con Zod
- Errores manejados con toast (react-hot-toast)
- TypeScript estricto (no `any`)

## 🐛 Troubleshooting

### Error: "documento_numero already exists"
- Validación de unicidad en backend
- Verificar que no exista otro ecoaliado con ese documento

### Geolocalización no funciona
- Verificar que el sitio sea HTTPS (o localhost)
- Revisar permisos del navegador
- Verificar que el navegador soporte `navigator.geolocation`

### No puedo cambiar precio
- Verificar rol de usuario (debe ser Líder Comercial o superior)
- Revisar que `canChangePrecio` sea `true`

### No veo todos los ecoaliados (Comercial)
- Es correcto: los comerciales solo ven SUS ecoaliados
- El filtrado se hace en el backend por seguridad

## 📄 Licencia

Parte del proyecto Grasas y Huesos del Norte.
