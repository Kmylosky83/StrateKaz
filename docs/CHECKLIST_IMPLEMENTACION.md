# ✅ CHECKLIST DE IMPLEMENTACIÓN - FIX TIMEZONE

## Pre-implementación

- [x] Problema identificado y documentado
- [x] Causa raíz analizada
- [x] Solución diseñada
- [x] Archivos de código creados

---

## Verificación de Archivos Creados/Modificados

### ✅ Archivos NUEVOS

- [ ] `backend/apps/core/fields.py` existe
  - Ubicación: `c:\Proyectos\Grasas y Huesos del Norte\backend\apps\core\fields.py`
  - Líneas: ~73
  - Contiene: `class NaiveDateField(serializers.DateField)`

- [ ] `backend/apps/core/tests/__init__.py` existe
  - Ubicación: `c:\Proyectos\Grasas y Huesos del Norte\backend\apps\core\tests\__init__.py`

- [ ] `backend/apps/core/tests/test_fields.py` existe
  - Ubicación: `c:\Proyectos\Grasas y Huesos del Norte\backend\apps\core\tests\test_fields.py`
  - Líneas: ~180
  - Contiene: 12 tests

- [ ] `backend/verify_timezone_fix.py` existe
  - Ubicación: `c:\Proyectos\Grasas y Huesos del Norte\backend\verify_timezone_fix.py`

- [ ] `backend/TIMEZONE_FIX.md` existe
  - Documentación técnica completa

- [ ] `SOLUCION_TIMEZONE.md` existe
  - Resumen ejecutivo

- [ ] `RESUMEN_FINAL_TIMEZONE.txt` existe
  - Resumen visual

### ✅ Archivos MODIFICADOS

- [ ] `backend/apps/programaciones/serializers.py`
  - Línea ~11: Import agregado `from apps.core.fields import NaiveDateField`
  - Línea ~493: `fecha_reprogramada = NaiveDateField(...)`
  - Línea ~271: `nueva_fecha = NaiveDateField(...)`

---

## Tests de Verificación

### Test 1: Script Automático

```bash
cd backend
py verify_timezone_fix.py
```

**Resultado esperado:**
```
✅ TODOS LOS TESTS PASARON - FIX IMPLEMENTADO CORRECTAMENTE
```

- [ ] Test 1 ejecutado
- [ ] Test 1 pasó exitosamente

### Test 2: Tests Unitarios

```bash
cd backend
py manage.py test apps.core.tests.test_fields
```

**Resultado esperado:**
```
Ran 12 tests in X.XXXs
OK
```

- [ ] Test 2 ejecutado
- [ ] Todos los 12 tests pasaron

### Test 3: Django Shell Manual

```bash
cd backend
py manage.py shell
```

```python
from apps.programaciones.serializers import ReprogramarSerializer
from datetime import date

# Caso 1: String simple
data1 = {'fecha_reprogramada': '2024-12-01', 'motivo_reprogramacion': 'Test'}
s1 = ReprogramarSerializer(data=data1)
assert s1.is_valid()
assert s1.validated_data['fecha_reprogramada'] == date(2024, 12, 1)
print("✅ Test 1: OK")

# Caso 2: UTC timezone (el caso crítico)
data2 = {'fecha_reprogramada': '2024-12-01T00:00:00Z', 'motivo_reprogramacion': 'Test'}
s2 = ReprogramarSerializer(data=data2)
assert s2.is_valid()
assert s2.validated_data['fecha_reprogramada'] == date(2024, 12, 1)
print("✅ Test 2: OK - Timezone ignorado correctamente")

# Caso 3: Bogotá timezone
data3 = {'fecha_reprogramada': '2024-12-01T00:00:00-05:00', 'motivo_reprogramacion': 'Test'}
s3 = ReprogramarSerializer(data=data3)
assert s3.is_valid()
assert s3.validated_data['fecha_reprogramada'] == date(2024, 12, 1)
print("✅ Test 3: OK")

print("\n✅ TODOS LOS TESTS MANUALES PASARON")
```

- [ ] Test 3 ejecutado
- [ ] Todos los asserts pasaron

### Test 4: End-to-End (UI)

**Pre-requisitos:**
- [ ] Backend corriendo: `py manage.py runserver`
- [ ] Frontend corriendo: `npm run dev`
- [ ] Usuario con rol "Líder Logística" disponible

**Pasos:**
1. [ ] Login como Líder Logística
2. [ ] Navegar a Programaciones
3. [ ] Seleccionar una programación existente
4. [ ] Click en botón "Reprogramar"
5. [ ] En el modal, seleccionar fecha: **15 de Diciembre de 2024**
6. [ ] Escribir motivo: "Prueba de fix de timezone"
7. [ ] Click en "Reprogramar Recolección"
8. [ ] Esperar respuesta exitosa
9. [ ] **Verificar:** La programación muestra fecha **2024-12-15**
10. [ ] **Verificar en base de datos:** `fecha_programada = 2024-12-15`

**Verificación en BD (opcional):**
```sql
SELECT id, fecha_programada, observaciones_logistica
FROM programaciones_programacion
ORDER BY updated_at DESC
LIMIT 5;
```

- [ ] Test 4 ejecutado
- [ ] Fecha guardada correctamente (sin día de diferencia)

---

## Verificación de Código

### Archivo: `backend/apps/core/fields.py`

- [ ] Clase `NaiveDateField` definida
- [ ] Hereda de `serializers.DateField`
- [ ] Método `to_internal_value` sobrescrito
- [ ] Método `to_representation` sobrescrito
- [ ] Docstring completo
- [ ] Maneja casos: string simple, ISO con timezone, date object, datetime object

### Archivo: `backend/apps/programaciones/serializers.py`

- [ ] Import `NaiveDateField` en la parte superior
- [ ] `ReprogramarSerializer.fecha_reprogramada` usa `NaiveDateField`
- [ ] `AsignarRecolectorSerializer.nueva_fecha` usa `NaiveDateField`
- [ ] No hay errores de sintaxis

### Archivo: `backend/apps/core/tests/test_fields.py`

- [ ] Clase `TestNaiveDateField` definida
- [ ] Test `test_iso_datetime_with_utc_timezone` presente (caso crítico)
- [ ] Clase `TestNaiveDateFieldIntegration` definida
- [ ] Tests verifican ambos serializers

---

## Despliegue

### Pre-deployment

- [ ] Todos los tests pasaron
- [ ] Código revisado
- [ ] Sin errores de linting
- [ ] Documentación completa

### Deployment

- [ ] Código en repositorio Git
- [ ] Servidor Django reiniciado
- [ ] Tests de smoke post-deployment ejecutados
- [ ] Funcionalidad verificada en ambiente de producción

### Post-deployment

- [ ] Monitorear logs por 24 horas
- [ ] Verificar que no hay errores relacionados con fechas
- [ ] Confirmar con usuarios que las fechas se guardan correctamente

---

## Rollback Plan (Si algo sale mal)

**Si necesitas revertir:**

1. [ ] Revertir cambios en `serializers.py`:
   ```python
   # Volver a usar:
   fecha_reprogramada = serializers.DateField(
       required=True,
       input_formats=['%Y-%m-%d', 'iso-8601']
   )
   ```

2. [ ] Eliminar archivos nuevos (opcional):
   - `backend/apps/core/fields.py`
   - `backend/apps/core/tests/test_fields.py`

3. [ ] Reiniciar servidor

**Nota:** El rollback es seguro porque no hay cambios en base de datos.

---

## Documentación

- [ ] `TIMEZONE_FIX.md` leído y entendido
- [ ] `SOLUCION_TIMEZONE.md` disponible para referencia
- [ ] `RESUMEN_FINAL_TIMEZONE.txt` impreso/guardado
- [ ] Equipo notificado del cambio

---

## Comunicación

- [ ] Equipo de desarrollo notificado
- [ ] Usuarios (Líderes Logística) informados de la corrección
- [ ] Documentación en wiki/confluence actualizada
- [ ] Ticket/Issue cerrado

---

## Métricas de Éxito

**El fix es exitoso si:**

- [x] ✅ Todos los tests automáticos pasan
- [ ] ✅ Test manual en UI muestra fechas correctas
- [ ] ✅ No hay errores en logs después de deployment
- [ ] ✅ Usuarios confirman que las fechas se guardan correctamente
- [ ] ✅ No hay regresiones en otras funcionalidades

---

## Notas Adicionales

**Fecha de implementación:** _______________________

**Implementado por:** _______________________

**Revisado por:** _______________________

**Notas:**
```





```

---

## 🎉 Firma de Completado

Una vez que todos los checkboxes estén marcados:

**Implementación completada:** [ ]

**Firma:** _________________ **Fecha:** _________________

---

**Última actualización:** 2025-11-25
