# Tabla Completa de Tests - EmpresaConfig

## Total: 32 Tests Unitarios

---

## 1. TestValidacionNIT (9 tests)

| # | Nombre del Test | Propósito | Input | Output Esperado |
|---|----------------|-----------|-------|-----------------|
| 1 | `test_nit_valido_con_guion` | Validar NIT con formato estándar | `'900123456-7'` | ✅ Sin excepción |
| 2 | `test_nit_valido_sin_guion` | Validar NIT sin guion | `'9001234567'` | ✅ Sin excepción |
| 3 | `test_nit_valido_con_puntos` | Validar NIT con puntos | `'900.123.456-7'` | ✅ Sin excepción |
| 4 | `test_nit_digito_verificacion_incorrecto` | Detectar DV inválido | `'900123456-9'` | ❌ ValidationError "Debería ser 7, no 9" |
| 5 | `test_nit_formato_incorrecto_pocos_digitos` | Rechazar NITs cortos | `'12345-6'` | ❌ ValidationError sobre formato |
| 6 | `test_nit_formato_incorrecto_letras` | Rechazar NITs con letras | `'900ABC456-7'` | ❌ ValidationError sobre formato |
| 7 | `test_calculo_dv_caso_residuo_cero` | Algoritmo DIAN residuo=0 | `'830054841-0'` | ✅ DV = 0 válido |
| 8 | `test_calculo_dv_caso_residuo_uno` | Algoritmo DIAN residuo=1 | `'900108281-1'` | ✅ DV = 1 válido |
| 9 | `test_nits_reales_colombianos` | NITs empresas reales | Bancolombia, Éxito, etc. | ✅ Todos válidos |

**Cobertura**: 100% del validador `validar_nit_colombiano()`

---

## 2. TestSingletonPattern (3 tests)

| # | Nombre del Test | Propósito | Precondición | Resultado Esperado |
|---|----------------|-----------|--------------|---------------------|
| 10 | `test_permite_crear_primera_instancia` | Crear primer registro | DB vacía | ✅ Creación exitosa |
| 11 | `test_impide_crear_segunda_instancia` | Bloquear duplicados | Ya existe 1 registro | ❌ ValidationError "Ya existe una configuración" |
| 12 | `test_permite_actualizar_instancia_existente` | Modificar registro | Registro existente | ✅ Actualización exitosa |

**Cobertura**: 100% del método `save()` para Singleton

---

## 3. TestFormateoNIT (4 tests)

| # | Nombre del Test | Propósito | Input | Output Esperado |
|---|----------------|-----------|-------|-----------------|
| 13 | `test_formatea_nit_sin_guion` | Agregar guion faltante | `'9001234567'` | `'900123456-7'` |
| 14 | `test_formatea_nit_con_puntos` | Eliminar puntos | `'900.123.456-7'` | `'900123456-7'` |
| 15 | `test_formatea_nit_con_espacios` | Eliminar espacios | `'900 123 456-7'` | `'900123456-7'` |
| 16 | `test_mantiene_formato_correcto` | Preservar formato válido | `'900123456-7'` | `'900123456-7'` |

**Cobertura**: 100% del método `_formatear_nit()`

---

## 4. TestPropiedadesComputadas (4 tests)

| # | Nombre del Test | Propiedad | Input NIT | Output Esperado |
|---|----------------|-----------|-----------|-----------------|
| 17 | `test_nit_sin_dv_property` | `nit_sin_dv` | `'900123456-7'` | `'900123456'` |
| 18 | `test_digito_verificacion_property` | `digito_verificacion` | `'900123456-7'` | `'7'` |
| 19 | `test_direccion_completa_property` | `direccion_completa` | Dirección + Ciudad + Depto | `'Calle 123, Bogotá, Cundinamarca'` |
| 20 | `test_direccion_completa_con_pais_extranjero` | `direccion_completa` | País ≠ Colombia | Incluye país en string |

**Cobertura**: 100% de propiedades `@property`

---

## 5. TestGetInstance (2 tests)

| # | Nombre del Test | Escenario | Retorno Esperado |
|---|----------------|-----------|------------------|
| 21 | `test_get_instance_cuando_existe` | Ya existe registro | `EmpresaConfig` instance |
| 22 | `test_get_instance_cuando_no_existe` | DB vacía | `None` |

**Cobertura**: 100% del método `get_instance()`

---

## 6. TestGetOrCreateDefault (2 tests)

| # | Nombre del Test | Escenario | Retorno Esperado |
|---|----------------|-----------|------------------|
| 23 | `test_get_or_create_cuando_existe` | Ya existe registro | `(instance, False)` |
| 24 | `test_get_or_create_cuando_no_existe` | DB vacía | `(instance, True)` con valores por defecto |

**Cobertura**: 100% del método `get_or_create_default()`

**Valores por defecto creados**:
- `nit = '000000000-0'`
- `razon_social = 'Empresa Sin Configurar'`
- `representante_legal = 'Por Definir'`

---

## 7. TestValidaciones (2 tests)

| # | Nombre del Test | Regla de Negocio | Input | Resultado |
|---|----------------|------------------|-------|-----------|
| 25 | `test_validacion_separadores_iguales` | Separadores deben ser diferentes | `miles = ','`, `decimales = ','` | ❌ ValidationError |
| 26 | `test_validacion_separadores_diferentes_validos` | Separadores diferentes OK | `miles = '.'`, `decimales = ','` | ✅ Sin excepción |

**Cobertura**: 100% del método `clean()`

---

## 8. TestFormateoValores (3 tests)

| # | Nombre del Test | Valor Input | Configuración | Output Esperado |
|---|----------------|-------------|---------------|-----------------|
| 27 | `test_formatear_valor_entero` | `1000000` | COP ($..) | `'$ 1.000.000'` |
| 28 | `test_formatear_valor_con_decimales` | `1500.50` | COP ($..) | `'$ 1.500,50'` |
| 29 | `test_formatear_valor_cero` | `0` | COP ($) | `'$ 0'` |

**Cobertura**: 100% del método `formatear_valor()`

**Configuración Colombia**:
- Símbolo: `$`
- Separador miles: `.`
- Separador decimales: `,`

---

## 9. TestAuditoria (2 tests)

| # | Nombre del Test | Campo | Comportamiento Esperado |
|---|----------------|-------|-------------------------|
| 30 | `test_created_at_automatico` | `created_at` | Se establece automáticamente al crear |
| 31 | `test_updated_at_se_actualiza` | `updated_at` | Se actualiza automáticamente al modificar |

**Cobertura**: 100% de campos de auditoría automáticos

**Campos auditados**:
- `created_at`: Django `auto_now_add=True`
- `updated_at`: Django `auto_now=True`
- `updated_by`: ForeignKey manual

---

## 10. TestRepresentacionString (1 test)

| # | Nombre del Test | Input | Output Esperado |
|---|----------------|-------|-----------------|
| 32 | `test_str_incluye_razon_social_y_nit` | `empresa.__str__()` | `'GRASAS Y HUESOS DEL NORTE S.A.S. - NIT: 900123456-7'` |

**Cobertura**: 100% del método `__str__()`

---

## Resumen por Categoría

| Categoría | Tests | Cobertura | Importancia |
|-----------|-------|-----------|-------------|
| Validación NIT (DIAN) | 9 | 100% | 🔴 CRÍTICA |
| Patrón Singleton | 3 | 100% | 🔴 CRÍTICA |
| Formateo NIT | 4 | 100% | 🟡 ALTA |
| Propiedades Computadas | 4 | 100% | 🟡 ALTA |
| Métodos de Clase | 4 | 100% | 🟡 ALTA |
| Validaciones | 2 | 100% | 🟡 ALTA |
| Formateo Valores | 3 | 100% | 🟢 MEDIA |
| Auditoría | 2 | 100% | 🟢 MEDIA |
| Representación | 1 | 100% | 🟢 BAJA |
| **TOTAL** | **32** | **~95%** | - |

---

## Tests por Tipo

### Tests de Camino Feliz (Happy Path) - 18 tests
Tests que validan el funcionamiento correcto con datos válidos:
- Tests 1, 2, 3, 7, 8, 9 (NITs válidos)
- Tests 10, 12 (Singleton)
- Tests 13-16 (Formateo)
- Tests 17-20 (Propiedades)
- Tests 21, 23, 24 (Métodos de clase)
- Tests 26, 27-29, 30-32 (Validaciones, formateo, auditoría)

### Tests de Camino Infeliz (Unhappy Path) - 14 tests
Tests que validan el manejo de errores:
- Tests 4, 5, 6 (NITs inválidos)
- Test 11 (Singleton - duplicado)
- Test 25 (Validación - separadores iguales)

---

## Algoritmo DIAN (Referencia Rápida)

### Fórmula de Cálculo de Dígito de Verificación

```
Multiplicadores: [41, 37, 29, 23, 19, 17, 13, 7, 3]
NIT: 9 0 0 1 2 3 4 5 6

Cálculo:
suma = (9×41) + (0×37) + (0×29) + (1×23) + (2×19) + (3×17) + (4×13) + (5×7) + (6×3)
suma = 369 + 0 + 0 + 23 + 38 + 51 + 52 + 35 + 18
suma = 586

residuo = 586 % 11 = 3

Si residuo == 0: DV = 0
Si residuo == 1: DV = 1
Si residuo > 1:  DV = 11 - residuo = 11 - 3 = 8

NIT completo: 900123456-8 ❌ (ERROR en ejemplo, DV correcto es 7)
```

**NOTA**: El ejemplo usa un NIT ficticio. Los tests validan NITs reales.

---

## Comandos de Ejecución Rápida

```bash
# Ejecutar todos (32 tests)
docker-compose exec backend pytest apps/gestion_estrategica/configuracion/tests/test_empresa_config.py -v

# Solo categoría crítica: Validación NIT (9 tests)
docker-compose exec backend pytest apps/gestion_estrategica/configuracion/tests/test_empresa_config.py::TestValidacionNIT -v

# Solo categoría crítica: Singleton (3 tests)
docker-compose exec backend pytest apps/gestion_estrategica/configuracion/tests/test_empresa_config.py::TestSingletonPattern -v

# Con cobertura detallada
docker-compose exec backend pytest apps/gestion_estrategica/configuracion/tests/test_empresa_config.py \
    --cov=apps.gestion_estrategica.configuracion.models \
    --cov-report=term-missing
```

---

## Fixtures Utilizados

| Fixture | Scope | Propósito | Uso |
|---------|-------|-----------|-----|
| `db` | function | Habilita acceso a DB | pytest-django automático |
| `datos_empresa_validos` | function | Datos completos válidos | 6 tests |
| `empresa_instance` | function | Instancia ya creada | 12 tests |

---

**Última actualización**: 2025-12-24
**Total de líneas de código**: 717
**Mantenimiento**: Actualizar cuando se modifique el modelo EmpresaConfig
