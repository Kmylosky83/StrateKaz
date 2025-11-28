# Fix: Problema de Zona Horaria en Fechas (DateField)

## Problema Detectado

**Síntoma:**
- Usuario en Bogotá (UTC-5) selecciona fecha `2024-12-01` en el frontend
- Backend guarda `2024-11-30` (un día menos)

## Causa Raíz

### El Flujo del Problema:

1. **Frontend:** `<input type="date">` devuelve `"2024-12-01"` (string puro YYYY-MM-DD)

2. **HTTP Request:** Cuando Axios serializa a JSON, algunos navegadores pueden agregar información de timezone implícita, convirtiendo:
   - `"2024-12-01"` → `"2024-12-01T00:00:00Z"` (medianoche UTC)

3. **Django Backend con `USE_TZ = True`:**
   - Recibe: `"2024-12-01T00:00:00Z"` (UTC)
   - Convierte a timezone local: `America/Bogota` (UTC-5)
   - Resultado: `2024-12-01 00:00:00 UTC` = `2024-11-30 19:00:00 COT`
   - Al extraer la fecha: `2024-11-30` ❌

### Por qué pasa esto:

Django Rest Framework con `USE_TZ = True` está diseñado para manejar **DateTimeFields** (fecha + hora) con conversión automática de timezone. Sin embargo, para **DateFields** (solo fecha, sin hora), esta conversión no tiene sentido y causa errores.

## Solución Implementada

### Archivo Creado: `backend/apps/core/fields.py`

```python
class NaiveDateField(serializers.DateField):
    """
    DateField que ignora timezone information.

    Para campos de solo fecha (sin hora), no debería haber conversión
    de zona horaria. Este field asegura que la fecha recibida sea
    la fecha guardada, sin importar timezone.
    """
```

### Comportamiento:

- **Input:** `"2024-12-01"`, `"2024-12-01T00:00:00"`, o `"2024-12-01T00:00:00Z"`
- **Output:** `date(2024, 12, 1)` (siempre la fecha correcta)

### Cambios Realizados:

1. **Creado:** `backend/apps/core/fields.py` - Custom DateField
2. **Modificado:** `backend/apps/programaciones/serializers.py`
   - Importado `NaiveDateField`
   - Reemplazado en:
     - `ReprogramarSerializer.fecha_reprogramada`
     - `AsignarRecolectorSerializer.nueva_fecha`

## Uso

### En Serializers:

```python
from apps.core.fields import NaiveDateField

class MiSerializer(serializers.Serializer):
    fecha = NaiveDateField(required=True)
```

### En ModelSerializers:

```python
from apps.core.fields import NaiveDateField

class MiModelSerializer(serializers.ModelSerializer):
    fecha_especial = NaiveDateField()

    class Meta:
        model = MiModelo
        fields = '__all__'
```

## Testing

Para probar que el fix funciona:

```bash
# Desde backend/
py manage.py shell
```

```python
from apps.programaciones.serializers import ReprogramarSerializer

# Test 1: Fecha simple
data = {'fecha_reprogramada': '2024-12-01', 'motivo_reprogramacion': 'Test de timezone'}
s = ReprogramarSerializer(data=data)
s.is_valid()
print(s.validated_data['fecha_reprogramada'])  # Debe mostrar: 2024-12-01

# Test 2: Fecha con timezone
data = {'fecha_reprogramada': '2024-12-01T00:00:00Z', 'motivo_reprogramacion': 'Test de timezone'}
s = ReprogramarSerializer(data=data)
s.is_valid()
print(s.validated_data['fecha_reprogramada'])  # Debe mostrar: 2024-12-01 (no 2024-11-30)
```

## Otros Serializers que Deberían Usar NaiveDateField

Si encuentras más DateFields que tengan el mismo problema, reemplázalos:

```python
# ❌ Antes
fecha = serializers.DateField()

# ✅ Después
fecha = NaiveDateField()
```

### Candidatos a revisar:

- `ProgramacionCreateSerializer.fecha_programada`
- `ProgramacionUpdateSerializer.fecha_programada`
- Cualquier otro serializer con campos de tipo fecha (sin hora)

## Notas Importantes

- **DateTimeField:** NO usar NaiveDateField. Los DateTimeField DEBEN conservar timezone.
- **DateField en modelos:** El modelo no necesita cambios. Esto es solo para serializers.
- **Frontend:** No necesita cambios. El fix es backend-only.

## Alternativas Consideradas

### Opción 2: Deshabilitar USE_TZ
```python
USE_TZ = False  # ❌ No recomendado
```
**Por qué no:** Afecta negativamente todos los DateTimeFields del sistema.

### Opción 3: Modificar el frontend
```typescript
// Enviar solo la fecha, nunca con hora
fecha_reprogramada: formData.fecha.split('T')[0]
```
**Por qué no:** No es confiable. Diferentes navegadores pueden comportarse distinto.

### Opción 4: Parsear manualmente en validate_fecha_reprogramada
```python
def validate_fecha_reprogramada(self, value):
    if isinstance(value, str) and 'T' in value:
        value = value.split('T')[0]
    # ... resto de validación
```
**Por qué no:** Código repetitivo en cada serializer.

## Conclusión

La solución con `NaiveDateField` es la más robusta porque:
- ✅ Centraliza la lógica
- ✅ Reutilizable en todo el proyecto
- ✅ No afecta otros campos
- ✅ Documentada y clara
- ✅ Compatible con cualquier formato de input

---

**Fecha del Fix:** 2025-11-25
**Autor:** Claude (StrateKaz Expert)
**Issue:** Fechas con 1 día de diferencia en reprogramación
