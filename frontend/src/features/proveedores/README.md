# Módulo de Proveedores - Frontend

Módulo completo para la gestión de proveedores en el sistema ERP "Grasas y Huesos del Norte".

## Estructura del Módulo

```
proveedores/
├── components/
│   ├── ProveedorForm.tsx          # Formulario de creación/edición con campos condicionales
│   ├── ProveedoresTable.tsx       # Tabla principal con acciones
│   ├── CambiarPrecioModal.tsx     # Modal para cambiar precio (Solo Gerente)
│   └── HistorialPrecioModal.tsx   # Modal para ver historial de precios
├── hooks/
│   └── useProveedores.ts          # React Query hooks para API
├── pages/
│   └── ProveedoresPage.tsx        # Página principal con filtros
├── index.ts                        # Exportaciones del módulo
└── README.md                       # Esta documentación
```

## Tipos de Proveedores

El sistema maneja 3 tipos de proveedores, cada uno con campos específicos:

### 1. Materia Prima Externa (`MATERIA_PRIMA_EXTERNO`)
- **Campos obligatorios adicionales:**
  - `subtipo_materia`: SEBO, HUESO, o ACU
  - `modalidad_logistica`: ENTREGA_PLANTA o COMPRA_EN_PUNTO
  - `precio_compra_kg`: Precio de compra por kilogramo

- **Campos condicionales:**
  - Si `modalidad_logistica === 'COMPRA_EN_PUNTO'`: GPS (latitud, longitud) obligatorios

### 2. Unidad de Negocio (`UNIDAD_NEGOCIO`)
- **Campos obligatorios adicionales:**
  - `subtipo_materia`: SEBO, HUESO, o ACU
  - `unidad_negocio_id`: ID de la unidad de negocio asociada
  - `precio_compra_kg`: Precio de compra por kilogramo

### 3. Producto/Servicio (`PRODUCTO_SERVICIO`)
- **Campos adicionales:**
  - `forma_pago`: CONTADO, CREDITO_15, CREDITO_30, etc.
  - `dias_plazo_pago`: Días de plazo de pago
  - **NO tiene** precio de compra por kg

## Reglas de Negocio - Campos Readonly

### En Creación
Todos los campos son editables.

### En Edición (Update)
Los siguientes campos **NO SE PUEDEN MODIFICAR**:
- `tipo_proveedor`: Solo se define en creación
- `subtipo_materia`: Solo se define en creación
- `modalidad_logistica`: Solo se define en creación
- `unidad_negocio_id`: Solo se define en creación
- `numero_documento`: No se puede cambiar el documento
- `tipo_documento`: No se puede cambiar el tipo de documento
- `precio_compra_kg`: Solo se modifica desde el modal "Cambiar Precio"

## Permisos y Roles

### Crear Proveedor
Permitido para:
- Líder Comercial (`lider_comercial`)
- Líder Comercial Econorte (`lider_com_econorte`)
- Líder Logística Econorte (`lider_log_econorte`)
- Gerente (`gerente`)
- SuperAdmin (`super_admin`)

### Editar Proveedor
Mismos permisos que crear.

### Cambiar Precio
**SOLO** permitido para:
- Gerente (`gerente`)
- SuperAdmin (`super_admin`)

El botón "Cambiar Precio" solo se muestra si el usuario tiene uno de estos roles.

### Ver Historial de Precio
Permitido para todos los usuarios con acceso al módulo de proveedores.

## Componentes Principales

### ProveedorForm

Formulario inteligente que muestra/oculta campos según el tipo de proveedor:

```tsx
<ProveedorForm
  isOpen={isFormOpen}
  onClose={handleCloseForm}
  onSubmit={handleSubmit}
  proveedor={selectedProveedor} // undefined para crear, objeto para editar
  unidadesNegocio={unidadesNegocioData?.results || []}
  isLoading={isLoading}
/>
```

**Características:**
- Validación con Zod según tipo de proveedor
- Campos condicionales (se muestran/ocultan dinámicamente)
- Precio readonly en modo edición (con información de última modificación)
- Soporte para GPS en proveedores COMPRA_EN_PUNTO

### CambiarPrecioModal

Modal especializado para cambiar el precio (solo Gerente):

```tsx
<CambiarPrecioModal
  isOpen={isPrecioModalOpen}
  onClose={handleClosePrecioModal}
  onSubmit={handleCambiarPrecio}
  proveedor={selectedProveedor}
  isLoading={isLoading}
/>
```

**Características:**
- Muestra precio actual vs nuevo precio
- Calcula automáticamente la variación ($ y %)
- Indica si es aumento (rojo) o reducción (verde)
- Campo obligatorio: motivo del cambio (mínimo 10 caracteres)
- Validación: precio nuevo debe ser diferente al actual

### HistorialPrecioModal

Modal para visualizar el historial completo de cambios de precio:

```tsx
<HistorialPrecioModal
  isOpen={isHistorialModalOpen}
  onClose={handleCloseHistorialModal}
  proveedor={selectedProveedor}
/>
```

**Muestra:**
- Precio actual destacado
- Lista cronológica de cambios
- Tipo de cambio: INICIAL, AUMENTO, REDUCCION
- Precio anterior, nuevo, variación
- Motivo del cambio
- Usuario que hizo el cambio
- Fecha y hora del cambio

### ProveedoresTable

Tabla principal con funcionalidad completa:

```tsx
<ProveedoresTable
  proveedores={proveedores}
  onEdit={handleOpenEditForm}
  onDelete={handleOpenDeleteModal}
  onCambiarPrecio={handleOpenPrecioModal}
  onVerHistorial={handleOpenHistorialModal}
  onToggleStatus={handleToggleStatus}
  canChangePrecio={canChangePrecio} // Se calcula según rol del usuario
  isLoading={isLoading}
/>
```

**Columnas:**
1. Proveedor (nombre, documento, teléfono)
2. Tipo (badges con colores)
3. Ubicación (ciudad, departamento)
4. Precio/kg (con botones de historial y cambiar precio)
5. Estado (toggle activo/inactivo)
6. Acciones (editar, eliminar)

**Funcionalidades:**
- Filas expandibles (click en fila) para ver detalles completos
- Badges con colores según tipo de proveedor
- Iconos para modalidad logística
- Precio formateado en pesos colombianos
- Toggle para activar/desactivar

## Hooks Disponibles

### Proveedores CRUD

```tsx
const { data, isLoading, error } = useProveedores(filters);
const { data: proveedor } = useProveedor(id);
const createMutation = useCreateProveedor();
const updateMutation = useUpdateProveedor();
const deleteMutation = useDeleteProveedor();
const toggleStatusMutation = useToggleProveedorStatus();
```

### Gestión de Precios

```tsx
const cambiarPrecioMutation = useCambiarPrecio();
const { data: historial } = useHistorialPrecio(proveedorId);
```

### Unidades de Negocio

```tsx
const { data: unidades } = useUnidadesNegocio();
const { data: unidad } = useUnidadNegocio(id);
const createUnidadMutation = useCreateUnidadNegocio();
```

## Filtros Disponibles

La página de proveedores incluye un sistema completo de filtros:

- **Búsqueda libre:** Nombre comercial, documento
- **Tipo de Proveedor:** MATERIA_PRIMA_EXTERNO, UNIDAD_NEGOCIO, PRODUCTO_SERVICIO
- **Subtipo de Materia:** SEBO, HUESO, ACU
- **Modalidad Logística:** ENTREGA_PLANTA, COMPRA_EN_PUNTO
- **Estado:** Activo, Inactivo
- **Ciudad:** Texto libre

Los filtros se pueden mostrar/ocultar con el botón "Mostrar/Ocultar Filtros".

## Validaciones del Formulario

### Campos Comunes (todos los tipos)
- `nombre_comercial`: Mínimo 2 caracteres, máximo 100
- `razon_social`: Mínimo 2 caracteres, máximo 200
- `numero_documento`: Mínimo 6, máximo 15 caracteres
- `email`: Email válido (opcional)
- `direccion`: Mínimo 5 caracteres
- `ciudad`: Mínimo 2 caracteres
- `departamento`: Mínimo 2 caracteres

### Validaciones Específicas
- **MATERIA_PRIMA_EXTERNO:**
  - `subtipo_materia`: Obligatorio
  - `modalidad_logistica`: Obligatorio
  - Si COMPRA_EN_PUNTO: GPS obligatorio

- **UNIDAD_NEGOCIO:**
  - `subtipo_materia`: Obligatorio
  - `unidad_negocio_id`: Obligatorio

- **PRODUCTO_SERVICIO:**
  - Ninguna validación adicional específica

## Endpoints Consumidos

```
GET    /api/proveedores/proveedores/              # Listar con filtros
POST   /api/proveedores/proveedores/              # Crear
GET    /api/proveedores/proveedores/:id/          # Obtener uno
PATCH  /api/proveedores/proveedores/:id/          # Actualizar
DELETE /api/proveedores/proveedores/:id/          # Eliminar (soft)
POST   /api/proveedores/proveedores/:id/restore/  # Restaurar
POST   /api/proveedores/proveedores/:id/cambiar-precio/  # Cambiar precio (Gerente)
GET    /api/proveedores/proveedores/:id/historial-precio/ # Ver historial

GET    /api/proveedores/unidades-negocio/         # Listar unidades
POST   /api/proveedores/unidades-negocio/         # Crear unidad
```

## Notificaciones (Toasts)

El módulo usa `react-hot-toast` para notificaciones:

- **Éxito:** Verde, operaciones exitosas
- **Error:** Rojo, operaciones fallidas
- **Mensajes personalizados** según el tipo de operación

## Estilos y UI

- **Framework:** Tailwind CSS
- **Componentes base:** Reutilizables desde `@/components/common` y `@/components/forms`
- **Badges con colores:**
  - Materia Prima: Azul (`primary`)
  - Unidad Negocio: Celeste (`info`)
  - Producto/Servicio: Naranja (`warning`)
  - SEBO: Verde (`success`)
  - HUESO: Naranja (`warning`)
  - ACU: Celeste (`info`)

## Próximas Mejoras

- [ ] Exportar a Excel/PDF
- [ ] Importación masiva de proveedores
- [ ] Gestión completa de Condiciones Comerciales (ya tiene endpoints)
- [ ] Mapa interactivo para proveedores COMPRA_EN_PUNTO
- [ ] Gráficos de evolución de precios
- [ ] Comparativa de precios entre proveedores

## Dependencias

```json
{
  "@tanstack/react-query": "^5.x",
  "react-hook-form": "^7.x",
  "zod": "^3.x",
  "@hookform/resolvers": "^3.x",
  "react-hot-toast": "^2.x",
  "zustand": "^4.x",
  "lucide-react": "^0.x"
}
```

## Autor

Desarrollado siguiendo los patrones del módulo de usuarios existente.
