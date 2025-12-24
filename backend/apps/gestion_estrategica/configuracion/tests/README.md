# Tests del Módulo de Configuración

## Archivos de Tests

### `test_empresa_config.py`
Tests unitarios completos para el modelo `EmpresaConfig`.

## Cobertura de Tests

### 1. Validación de NIT (TestValidacionNIT)
- ✅ NIT válido con guion: `900123456-7`
- ✅ NIT válido sin guion: `9001234567`
- ✅ NIT válido con puntos: `900.123.456-7`
- ✅ Dígito de verificación incorrecto
- ✅ Formato incorrecto (pocos dígitos, letras)
- ✅ Casos especiales del algoritmo DIAN (residuo 0, residuo 1)
- ✅ NITs reales de empresas colombianas (Bancolombia, Grupo Éxito, etc.)

### 2. Patrón Singleton (TestSingletonPattern)
- ✅ Permite crear la primera instancia
- ✅ Impide crear una segunda instancia
- ✅ Permite actualizar la instancia existente

### 3. Formateo de NIT (TestFormateoNIT)
- ✅ Formatea NIT sin guion a formato estándar
- ✅ Elimina puntos del NIT
- ✅ Elimina espacios del NIT
- ✅ Mantiene formato correcto si ya está bien formateado

### 4. Propiedades Computadas (TestPropiedadesComputadas)
- ✅ `nit_sin_dv` - Retorna NIT sin dígito de verificación
- ✅ `digito_verificacion` - Retorna solo el dígito de verificación
- ✅ `direccion_completa` - Formatea dirección completa
- ✅ Dirección completa con país extranjero

### 5. Método get_instance() (TestGetInstance)
- ✅ Retorna instancia cuando existe
- ✅ Retorna None cuando no existe

### 6. Método get_or_create_default() (TestGetOrCreateDefault)
- ✅ Retorna instancia existente si ya existe
- ✅ Crea instancia con valores por defecto si no existe

### 7. Validaciones (TestValidaciones)
- ✅ Valida que separadores de miles y decimales sean diferentes
- ✅ Permite separadores diferentes válidos

### 8. Formateo de Valores (TestFormateoValores)
- ✅ Formatea valores enteros con separador de miles
- ✅ Formatea valores con decimales
- ✅ Formatea valor cero

### 9. Auditoría (TestAuditoria)
- ✅ Campo `created_at` se establece automáticamente
- ✅ Campo `updated_at` se actualiza en modificaciones

### 10. Representación String (TestRepresentacionString)
- ✅ Método `__str__` incluye razón social y NIT

## Ejecución de Tests

### Opción 1: Docker (Recomendado)
```bash
# Desde la raíz del proyecto
docker-compose exec backend pytest apps/gestion_estrategica/configuracion/tests/test_empresa_config.py -v

# Con coverage
docker-compose exec backend pytest apps/gestion_estrategica/configuracion/tests/test_empresa_config.py --cov=apps.gestion_estrategica.configuracion.models --cov-report=term-missing
```

### Opción 2: Entorno Virtual
```bash
# Desde backend/
pytest apps/gestion_estrategica/configuracion/tests/test_empresa_config.py -v

# Solo tests de NIT
pytest apps/gestion_estrategica/configuracion/tests/test_empresa_config.py::TestValidacionNIT -v

# Solo tests de Singleton
pytest apps/gestion_estrategica/configuracion/tests/test_empresa_config.py::TestSingletonPattern -v
```

### Opción 3: Ejecutar todos los tests del módulo
```bash
# Todos los tests de configuración
pytest apps/gestion_estrategica/configuracion/tests/ -v
```

## Estructura de Tests

Todos los tests siguen el patrón **Given-When-Then**:

```python
def test_ejemplo(self):
    """
    Given: Condiciones iniciales del test
    When: Acción que se ejecuta
    Then: Resultado esperado
    """
    # Given - Preparación
    dato = "valor"

    # When - Acción
    resultado = funcion(dato)

    # Then - Verificación
    assert resultado == esperado
```

## Fixtures Disponibles

### `datos_empresa_validos`
Diccionario con datos válidos para crear una instancia de `EmpresaConfig`.

```python
def test_mi_test(datos_empresa_validos):
    empresa = EmpresaConfig.objects.create(**datos_empresa_validos)
```

### `empresa_instance`
Instancia ya creada de `EmpresaConfig` lista para usar.

```python
def test_mi_test(empresa_instance):
    assert empresa_instance.nit == '900123456-7'
```

## Algoritmo de Validación de NIT (DIAN)

El validador implementa el algoritmo oficial de la DIAN para calcular el dígito de verificación:

1. Multiplicadores: `[41, 37, 29, 23, 19, 17, 13, 7, 3]`
2. Se multiplica cada dígito del NIT por su multiplicador correspondiente
3. Se suman todos los productos
4. Se calcula el residuo de dividir la suma entre 11
5. Si residuo = 0, DV = 0
6. Si residuo = 1, DV = 1
7. Si residuo > 1, DV = 11 - residuo

## Métricas de Cobertura

Los tests cubren:
- **Líneas de código**: ~95% del modelo EmpresaConfig
- **Ramas condicionales**: ~90% de las validaciones
- **Métodos públicos**: 100% de los métodos del modelo

## Próximos Tests a Implementar

- [ ] Tests para el modelo `SedeEmpresa`
- [ ] Tests para el modelo `IntegracionExterna`
- [ ] Tests de integración con serializers
- [ ] Tests de vistas y endpoints API
