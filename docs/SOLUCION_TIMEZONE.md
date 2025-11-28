# SOLUCIÓN: Problema de Zona Horaria en Reprogramación

## 📋 RESUMEN EJECUTIVO

**Problema:** Al reprogramar una recolección, la fecha seleccionada (ej: 2024-12-01) se guarda con un día menos (2024-11-30)

**Causa raíz:** Django con `USE_TZ=True` convierte fechas UTC a timezone local (Bogotá UTC-5), causando que medianoche UTC se convierta al día anterior.

**Solución:** Custom `NaiveDateField` que ignora timezone para campos de solo fecha (sin hora)

---

## ✅ ARCHIVOS MODIFICADOS/CREADOS

### 1. **NUEVO:** `backend/apps/core/fields.py`
```python
class NaiveDateField(serializers.DateField):
    """
    DateField que ignora timezone information.
    Para campos de solo fecha, sin conversión de timezone.
    """
```

**Qué hace:**
- Extrae solo la fecha del input, ignorando cualquier información de timezone
- Soporta: `"2024-12-01"`, `"2024-12-01T00:00:00Z"`, `"2024-12-01T00:00:00-05:00"`
- Siempre retorna la fecha correcta sin conversión de timezone

### 2. **MODIFICADO:** `backend/apps/programaciones/serializers.py`

#### Cambio 1: Import
```python
from apps.core.fields import NaiveDateField  # ← NUEVO
```

#### Cambio 2: ReprogramarSerializer
```python
# ❌ ANTES
fecha_reprogramada = serializers.DateField(
    required=True,
    input_formats=['%Y-%m-%d', 'iso-8601'],
    help_text='Nueva fecha programada (formato: YYYY-MM-DD)'
)

# ✅ DESPUÉS
fecha_reprogramada = NaiveDateField(
    required=True,
    help_text='Nueva fecha programada (formato: YYYY-MM-DD)'
)
```

#### Cambio 3: AsignarRecolectorSerializer
```python
# ❌ ANTES
nueva_fecha = serializers.DateField(
    required=False,
    allow_null=True,
    help_text='Nueva fecha de recolección (requerida si la fecha original ya pasó)'
)

# ✅ DESPUÉS
nueva_fecha = NaiveDateField(
    required=False,
    allow_null=True,
    help_text='Nueva fecha de recolección (requerida si la fecha original ya pasó)'
)
```

### 3. **NUEVO:** `backend/apps/core/tests/test_fields.py`
Tests completos para verificar el comportamiento del `NaiveDateField`

### 4. **NUEVO:** `backend/TIMEZONE_FIX.md`
Documentación técnica completa del problema y solución

---

## 🔍 EXPLICACIÓN TÉCNICA

### El Problema en Detalle

```
FRONTEND (Bogotá, UTC-5)
┌─────────────────────────────────────┐
│ Usuario selecciona: 2024-12-01      │
│ Input devuelve: "2024-12-01"        │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ Axios/HTTP Request                  │
│ Puede enviar: "2024-12-01T00:00:00Z"│
│ (medianoche UTC)                    │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ DJANGO (USE_TZ = True)              │
│ 2024-12-01 00:00 UTC                │
│     ↓ (convierte a America/Bogota)  │
│ 2024-11-30 19:00 COT (UTC-5)        │
│     ↓ (extrae fecha)                │
│ 2024-11-30 ❌ (un día menos!)       │
└─────────────────────────────────────┘
```

### La Solución

```
FRONTEND
┌─────────────────────────────────────┐
│ Usuario selecciona: 2024-12-01      │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ HTTP Request (cualquier formato)    │
│ - "2024-12-01"                      │
│ - "2024-12-01T00:00:00Z"            │
│ - "2024-12-01T00:00:00-05:00"       │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ NaiveDateField                      │
│ 1. Detecta si hay 'T' en el string  │
│ 2. Extrae solo: "2024-12-01"        │
│ 3. Ignora timezone                  │
│ 4. Retorna: date(2024, 12, 1) ✅    │
└─────────────────────────────────────┘
```

---

## 🧪 TESTING

### Test Manual (Django Shell)

```bash
cd backend
py manage.py shell
```

```python
from apps.programaciones.serializers import ReprogramarSerializer

# Test 1: Fecha simple
data = {
    'fecha_reprogramada': '2024-12-01',
    'motivo_reprogramacion': 'Test de timezone fix'
}
s = ReprogramarSerializer(data=data)
print(s.is_valid())  # True
print(s.validated_data['fecha_reprogramada'])  # 2024-12-01 ✅

# Test 2: Fecha con timezone UTC (el caso problemático)
data = {
    'fecha_reprogramada': '2024-12-01T00:00:00Z',
    'motivo_reprogramacion': 'Test de timezone fix'
}
s = ReprogramarSerializer(data=data)
print(s.is_valid())  # True
print(s.validated_data['fecha_reprogramada'])  # 2024-12-01 ✅ (no 2024-11-30)
```

### Test Automatizado

```bash
cd backend
py manage.py test apps.core.tests.test_fields
```

Debe pasar todos los tests (12 tests):
- ✅ test_simple_date_string
- ✅ test_iso_datetime_with_utc_timezone (el caso crítico)
- ✅ test_iso_datetime_with_bogota_timezone
- ✅ test_iso_datetime_without_timezone
- ✅ test_date_object
- ✅ test_datetime_object
- ✅ test_invalid_date_format
- ✅ test_null_value_with_required_false
- ✅ test_to_representation
- ✅ test_edge_case_midnight_bogota_time
- ✅ test_reprogramacion_real_world_scenario
- ✅ test_reprogramar_serializer_uses_naive_date_field

### Test End-to-End (Frontend + Backend)

1. Iniciar backend: `py manage.py runserver`
2. Iniciar frontend: `npm run dev`
3. Login como Líder Logística
4. Ir a una programación existente
5. Click en "Reprogramar"
6. Seleccionar fecha: **2024-12-15**
7. Ingresar motivo
8. Guardar
9. **Verificar:** La fecha guardada debe ser **2024-12-15** (no 2024-12-14)

---

## 📝 NOTAS IMPORTANTES

### ✅ Qué campos deben usar NaiveDateField

**SÍ usar para:**
- `fecha_programada` (solo fecha, sin hora)
- `fecha_reprogramada` (solo fecha, sin hora)
- `nueva_fecha` (solo fecha, sin hora)
- Cualquier campo de solo fecha en formularios

**NO usar para:**
- `created_at` (fecha + hora, necesita timezone)
- `updated_at` (fecha + hora, necesita timezone)
- `fecha_asignacion` (fecha + hora, necesita timezone)
- Cualquier timestamp que incluya hora

### 🎯 Beneficios de esta Solución

1. **Centralizada:** Un solo archivo (`core/fields.py`)
2. **Reutilizable:** Usar en cualquier serializer
3. **No invasiva:** No afecta otros campos
4. **No requiere cambios en frontend:** Fix backend-only
5. **Bien documentada:** Código claro con docstrings
6. **Testeada:** Suite completa de tests

### 🚫 Alternativas Descartadas

❌ **Deshabilitar `USE_TZ`:** Afectaría DateTimeFields
❌ **Modificar frontend:** No es confiable entre navegadores
❌ **Parsear manualmente:** Código duplicado en múltiples lugares

---

## 🔄 MIGRACIÓN (Si Ya Hay Datos Afectados)

Si ya existen programaciones con fechas incorrectas:

```python
# Script de corrección (ejecutar en Django shell)
from apps.programaciones.models import Programacion
from datetime import timedelta

# Identificar programaciones afectadas
# (comparar fecha_programada con observaciones_logistica para ver la fecha original)

# Corregir manualmente caso por caso
programacion = Programacion.objects.get(id=123)
programacion.fecha_programada = programacion.fecha_programada + timedelta(days=1)
programacion.save()
```

**Nota:** Evaluar caso por caso, no aplicar masivamente.

---

## ✨ RESULTADO FINAL

### Antes del Fix
```
Input:  2024-12-01 (del calendario)
Output: 2024-11-30 (en BD) ❌
```

### Después del Fix
```
Input:  2024-12-01 (del calendario)
Output: 2024-12-01 (en BD) ✅
```

---

## 📞 SOPORTE

Si el problema persiste:
1. Verificar que los cambios en `serializers.py` se aplicaron correctamente
2. Reiniciar el servidor Django
3. Revisar logs en consola del navegador (Network tab)
4. Ejecutar tests: `py manage.py test apps.core.tests.test_fields`

---

**Fecha de implementación:** 2025-11-25
**Versión:** 8.0
**Estado:** ✅ RESUELTO
