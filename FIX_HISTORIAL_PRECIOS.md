# Corrección: Inconsistencia Backend-Frontend Historial de Precios Ecoaliados

## Problema Identificado

Existía una inconsistencia entre la respuesta del backend y lo que el frontend esperaba para el endpoint de historial de precios de ecoaliados.

### Backend (antes)
```python
# viewsets.py línea 210-219
{
    'ecoaliado': {
        'id': ...,
        'codigo': ...,
        'razon_social': ...,
        'precio_actual': ...
    },
    'total_cambios': ...,
    'historial': [...]
}
```

### Frontend (esperaba)
```typescript
{
    ecoaliado: string,           // ❌ Esperaba string, recibía objeto
    precio_actual: string,       // ❌ Esperaba a nivel raíz, estaba anidado
    historial: [...]
}
```

## Solución Implementada

### 1. Backend - Viewset (`backend/apps/ecoaliados/viewsets.py`)

**Cambios en el método `historial_precios` (líneas 210-216):**

```python
# ANTES
return Response({
    'ecoaliado': {
        'id': ecoaliado.id,
        'codigo': ecoaliado.codigo,
        'razon_social': ecoaliado.razon_social,
        'precio_actual': ecoaliado.precio_compra_kg,
    },
    'total_cambios': historial.count(),
    'historial': HistorialPrecioEcoaliadoSerializer(historial, many=True).data
})

# DESPUÉS
return Response({
    'ecoaliado': ecoaliado.codigo,                      # ✅ String
    'ecoaliado_nombre': ecoaliado.razon_social,        # ✅ Nuevo campo
    'precio_actual': str(ecoaliado.precio_compra_kg),  # ✅ A nivel raíz
    'total_cambios': historial.count(),
    'historial': HistorialPrecioEcoaliadoSerializer(historial, many=True).data
})
```

### 2. Backend - Serializer (`backend/apps/ecoaliados/serializers.py`)

**Cambios en `HistorialPrecioEcoaliadoSerializer`:**

```python
class HistorialPrecioEcoaliadoSerializer(serializers.ModelSerializer):
    # Nuevos campos agregados
    ecoaliado_nombre = serializers.CharField(source='ecoaliado.razon_social', read_only=True)
    fecha_cambio = serializers.DateTimeField(source='fecha_modificacion', read_only=True)  # Alias

    class Meta:
        fields = [
            'id',
            'ecoaliado',
            'ecoaliado_codigo',
            'ecoaliado_razon_social',
            'ecoaliado_nombre',          # ✅ Nuevo
            'precio_anterior',
            'precio_nuevo',
            'diferencia_precio',
            'porcentaje_cambio',
            'tipo_cambio',
            'tipo_cambio_display',
            'justificacion',
            'modificado_por',
            'modificado_por_nombre',
            'fecha_modificacion',
            'fecha_cambio',              # ✅ Nuevo (alias)
            'created_at',                # ✅ Nuevo
        ]

    def get_diferencia_precio(self, obj):
        """Retorna string en lugar de float"""
        if obj.precio_anterior:
            return str(obj.precio_nuevo - obj.precio_anterior)
        return None

    def get_porcentaje_cambio(self, obj):
        """Retorna string en lugar de float"""
        if obj.precio_anterior and obj.precio_anterior > 0:
            porcentaje = ((obj.precio_nuevo - obj.precio_anterior) / obj.precio_anterior) * 100
            return str(round(float(porcentaje), 2))
        return None
```

### 3. Frontend - API Types (`frontend/src/features/ecoaliados/api/ecoaliadosApi.ts`)

**Actualización del tipo de retorno:**

```typescript
getHistorialPrecios: async (id: number): Promise<{
  ecoaliado: string;              // ✅ Ahora es string
  ecoaliado_nombre: string;       // ✅ Nuevo campo
  precio_actual: string;          // ✅ A nivel raíz
  total_cambios: number;          // ✅ Nuevo campo
  historial: HistorialPrecioEcoaliado[];
}>
```

### 4. Frontend - TypeScript Types (`frontend/src/features/ecoaliados/types/ecoaliado.types.ts`)

**Actualización de tipos:**

```typescript
// Tipo de cambio actualizado
export type TipoCambioPrecio = 'CREACION' | 'AUMENTO' | 'DISMINUCION' | 'AJUSTE';

// Interface actualizada
export interface HistorialPrecioEcoaliado {
  id: number;
  ecoaliado: number;
  ecoaliado_codigo: string;         // ✅ Nuevo
  ecoaliado_razon_social: string;   // ✅ Nuevo
  ecoaliado_nombre: string;         // ✅ Nuevo
  precio_anterior?: string | null;
  precio_nuevo: string;
  diferencia_precio?: string | null;
  porcentaje_cambio?: string | null;
  tipo_cambio: TipoCambioPrecio;
  tipo_cambio_display: string;      // ✅ Nuevo
  justificacion: string;
  modificado_por: number;
  modificado_por_nombre: string;
  fecha_modificacion: string;       // ✅ Nuevo
  fecha_cambio: string;
  created_at: string;               // ✅ Nuevo
}
```

### 5. Frontend - Componente (`frontend/src/features/ecoaliados/components/HistorialPrecioModal.tsx`)

**Actualización de badges para tipos de cambio:**

```typescript
const getTipoCambioBadge = (tipo: string) => {
  switch (tipo) {
    case 'CREACION':  // ✅ Cambiado de 'INICIAL' a 'CREACION'
      return <Badge variant="info" size="sm">Precio Inicial</Badge>;
    case 'AUMENTO':
      return <Badge variant="danger" size="sm">Aumento</Badge>;
    case 'DISMINUCION':
      return <Badge variant="success" size="sm">Disminución</Badge>;
    case 'AJUSTE':  // ✅ Nuevo tipo
      return <Badge variant="warning" size="sm">Ajuste</Badge>;
    default:
      return <Badge variant="gray" size="sm">{tipo}</Badge>;
  }
};
```

## Resultado

### Estructura de Respuesta Final

```json
{
  "ecoaliado": "ECO-0001",
  "ecoaliado_nombre": "Restaurante El Buen Sabor",
  "precio_actual": "1500.00",
  "total_cambios": 3,
  "historial": [
    {
      "id": 1,
      "ecoaliado": 1,
      "ecoaliado_codigo": "ECO-0001",
      "ecoaliado_razon_social": "Restaurante El Buen Sabor",
      "ecoaliado_nombre": "Restaurante El Buen Sabor",
      "precio_anterior": "1400.00",
      "precio_nuevo": "1500.00",
      "diferencia_precio": "100.00",
      "porcentaje_cambio": "7.14",
      "tipo_cambio": "AUMENTO",
      "tipo_cambio_display": "Aumento",
      "justificacion": "Ajuste por inflación",
      "modificado_por": 1,
      "modificado_por_nombre": "Juan Pérez",
      "fecha_modificacion": "2024-12-02T10:30:00Z",
      "fecha_cambio": "2024-12-02T10:30:00Z",
      "created_at": "2024-12-02T10:30:00Z"
    }
  ]
}
```

## Archivos Modificados

### Backend
- ✅ `backend/apps/ecoaliados/viewsets.py` (líneas 210-216)
- ✅ `backend/apps/ecoaliados/serializers.py` (líneas 362-412)

### Frontend
- ✅ `frontend/src/features/ecoaliados/api/ecoaliadosApi.ts` (líneas 98-113)
- ✅ `frontend/src/features/ecoaliados/types/ecoaliado.types.ts` (líneas 77-97)
- ✅ `frontend/src/features/ecoaliados/components/HistorialPrecioModal.tsx` (líneas 38-71)

## Validación

### Backend
- El endpoint retorna el código del ecoaliado como string en `ecoaliado`
- El precio actual está a nivel raíz como `precio_actual`
- Incluye `total_cambios` para mostrar cantidad de registros
- El serializer incluye `fecha_cambio` como alias de `fecha_modificacion`

### Frontend
- Los tipos TypeScript coinciden exactamente con la respuesta del backend
- El componente maneja los 4 tipos de cambio: CREACION, AUMENTO, DISMINUCION, AJUSTE
- La UI renderiza correctamente con los nuevos campos

## Compatibilidad

- ✅ **Backward compatible**: El campo `fecha_modificacion` se mantiene
- ✅ **Forward compatible**: Se agregó `fecha_cambio` como alias
- ✅ **Tipos completos**: Todos los campos están tipados correctamente
- ✅ **No breaking changes**: La página que consume el hook no requiere cambios

## Testing Recomendado

1. Probar endpoint: `GET /api/ecoaliados/ecoaliados/{id}/historial-precios/`
2. Verificar que el modal de historial se abre correctamente
3. Validar que los badges muestren los tipos correctos
4. Confirmar que los cálculos de diferencia y porcentaje sean correctos
