# Tests para Módulo de Organización

Este directorio contiene los tests unitarios para el módulo de Organización.

## Estructura de Tests

```
tests/
├── __init__.py
├── test_consecutivo.py    # Tests para ConsecutivoConfig
├── test_area.py           # Tests para Area (jerarquía organizacional)
└── README.md              # Este archivo
```

## test_area.py

Tests completos para el modelo `Area` que maneja la jerarquía organizacional.

### Cobertura de Tests

#### 1. Tests de Jerarquía (TestAreaJerarquia)
- ✓ Área raíz sin parent
- ✓ Área con parent válido
- ✓ Cálculo correcto de full_path
- ✓ Cálculo correcto de level
- ✓ get_all_children() retorna todas las subáreas recursivamente
- ✓ children_count retorna hijos directos activos
- ✓ Jerarquía con múltiples niveles (4+ niveles)
- ✓ Herencia de propiedades de mixins (AuditModel, SoftDeleteModel, OrderedModel)

#### 2. Tests de Validaciones (TestAreaValidaciones)
- ✓ Área no puede ser su propio parent
- ✓ Prevención de ciclos jerárquicos
- ✓ Código único (constraint)
- ✓ Nombre requerido
- ✓ Soft delete mantiene hijos activos

#### 3. Tests de Ordenamiento (TestAreaOrdenamiento)
- ✓ Ordenamiento por campo 'order'
- ✓ move_up() y move_down() funcionan correctamente
- ✓ Ordenamiento independiente por parent

#### 4. Tests de API (TestAreaAPI)
- ✓ GET /api/organizacion/areas/ - Lista todas las áreas
- ✓ POST /api/organizacion/areas/ - Crea área con parent
- ✓ PATCH /api/organizacion/areas/{id}/ - Mueve área a otro parent
- ✓ GET /api/organizacion/areas/?show_inactive=false - Filtra activas
- ✓ GET /api/organizacion/organigrama/ - Datos para visualización

#### 5. Tests de Edge Cases (TestAreaEdgeCases)
- ✓ Área sin manager permitido
- ✓ Área sin cost_center permitido
- ✓ Método __str__ retorna formato correcto
- ✓ get_all_children() en área sin hijos
- ✓ children_count solo cuenta activos
- ✓ full_path de área raíz
- ✓ Múltiples áreas raíz permitidas

### Total de Tests (test_area.py)

- **7 Fixtures**: user_admin, api_client, area_raiz, area_operaciones, area_produccion, jerarquia_completa
- **5 Clases de Test**: Organización por funcionalidad
- **29 Tests individuales**: Cobertura exhaustiva de jerarquía

### Jerarquía de Prueba

El fixture `jerarquia_completa` crea la siguiente estructura:

```
Gerencia General (GER)
├── Operaciones (OPE)
│   ├── Producción (PRO)
│   └── Logística (LOG)
└── Administración (ADM)
    ├── Finanzas (FIN)
    └── Recursos Humanos (RHH)
```

## test_consecutivo.py

Tests completos para el modelo `ConsecutivoConfig` que maneja la numeración automática centralizada.

### Cobertura de Tests

#### 1. Tests de Formato (TestConsecutivoFormato)
- ✓ Formato básico PREFIX-YYYY-00001
- ✓ Formato con mes incluido PREFIX-YYYYMM-00001
- ✓ Formato con día incluido PREFIX-YYYYMMDD-00001
- ✓ Diferentes separadores (-, /, _, sin separador)
- ✓ Sufijos opcionales
- ✓ Padding con diferentes longitudes
- ✓ Formato sin componentes de fecha

#### 2. Tests de Incremento (TestConsecutivoIncremento)
- ✓ Incremento secuencial básico
- ✓ Generación de consecutivo completo
- ✓ Previsualización del siguiente número

#### 3. Tests de Reinicio (TestConsecutivoReinicio)
- ✓ Reinicio anual al cambiar de año
- ✓ No reinicio en el mismo año
- ✓ Reinicio mensual al cambiar de mes
- ✓ Reinicio mensual al cambiar de año
- ✓ No reinicio si ambos flags están desactivados
- ✓ Primer uso sin last_reset_date

#### 4. Tests de Servicio Centralizado (TestConsecutivoServicio)
- ✓ Obtención exitosa de consecutivo por código
- ✓ Excepción si no existe configuración
- ✓ Excepción si el consecutivo está inactivo

#### 5. Tests de Thread-Safety (TestConsecutivoThreadSafety)
- ✓ Acceso concurrente con select_for_update()
- ✓ No generación de duplicados bajo concurrencia

#### 6. Tests de Edge Cases (TestConsecutivoEdgeCases)
- ✓ Números muy grandes que superan el padding
- ✓ Prefijo vacío
- ✓ Constraint OneToOne
- ✓ Método __str__
- ✓ Múltiples consecutivos independientes

#### 7. Tests de Integración (TestConsecutivoIntegracion)
- ✓ Flujo completo de facturación anual
- ✓ Escenario de órdenes de compra mensuales

### Total de Tests (test_consecutivo.py)

- **6 Fixtures**: categoria_documento, tipo_documento, consecutivo_basico, etc.
- **7 Clases de Test**: Organización por funcionalidad
- **~40+ Tests individuales**: Cobertura exhaustiva

## Ejecutar los Tests

### Prerrequisitos

```bash
# Activar entorno virtual
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Instalar dependencias de testing
pip install pytest pytest-django pytest-cov
```

### Comandos de Ejecución

```bash
# Ejecutar todos los tests de organización
pytest apps/gestion_estrategica/organizacion/tests/ -v

# Ejecutar solo tests de Area
pytest apps/gestion_estrategica/organizacion/tests/test_area.py -v

# Ejecutar solo tests de consecutivo
pytest apps/gestion_estrategica/organizacion/tests/test_consecutivo.py -v

# Con cobertura completa
pytest apps/gestion_estrategica/organizacion/tests/ --cov=apps.gestion_estrategica.organizacion.models --cov-report=html

# Ejecutar un test específico de Area
pytest apps/gestion_estrategica/organizacion/tests/test_area.py::TestAreaJerarquia::test_area_full_path_calculo -v

# Ejecutar solo tests de jerarquía
pytest apps/gestion_estrategica/organizacion/tests/test_area.py::TestAreaJerarquia -v

# Ejecutar solo tests de API
pytest apps/gestion_estrategica/organizacion/tests/test_area.py::TestAreaAPI -v

# Ejecutar un test específico de Consecutivo
pytest apps/gestion_estrategica/organizacion/tests/test_consecutivo.py::TestConsecutivoFormato::test_formato_basico_prefix_year_number -v

# Ejecutar solo tests de thread-safety
pytest apps/gestion_estrategica/organizacion/tests/test_consecutivo.py::TestConsecutivoThreadSafety -v

# Con output detallado
pytest apps/gestion_estrategica/organizacion/tests/ -v -s
```

### Desde el directorio backend

```bash
cd backend
pytest apps/gestion_estrategica/organizacion/tests/test_consecutivo.py -v
```

## Validación sin Ejecutar Tests

Si no tienes el entorno configurado, puedes validar la sintaxis:

```bash
# Validar sintaxis del archivo
python validate_test_consecutivo.py
```

## Fixtures Disponibles

### categoria_documento
Crea una categoría de documento de prueba.

```python
@pytest.fixture
def categoria_documento(db):
    return CategoriaDocumento.objects.create(
        code='TEST_CAT',
        name='Categoría Test',
        ...
    )
```

### tipo_documento
Crea un tipo de documento vinculado a una categoría.

```python
@pytest.fixture
def tipo_documento(db, categoria_documento):
    return TipoDocumento.objects.create(
        code='TEST_DOC',
        name='Documento Test',
        categoria=categoria_documento,
        ...
    )
```

### consecutivo_basico
Crea una configuración básica de consecutivo lista para usar.

```python
@pytest.fixture
def consecutivo_basico(db, tipo_documento):
    return ConsecutivoConfig.objects.create(
        tipo_documento=tipo_documento,
        prefix='FAC',
        current_number=0,
        padding=5,
        include_year=True,
        separator='-',
        reset_yearly=True,
        ...
    )
```

## Patrones de Test Utilizados

### AAA Pattern (Arrange-Act-Assert)

Todos los tests siguen el patrón AAA:

```python
def test_formato_basico_prefix_year_number(self, consecutivo_basico):
    # Arrange
    test_date = date(2024, 6, 15)
    test_number = 1

    # Act
    resultado = consecutivo_basico.format_number(
        number=test_number,
        date=test_date
    )

    # Assert
    assert resultado == 'FAC-2024-00001'
```

### Mocking con patch

Para tests dependientes de fechas:

```python
with patch('django.utils.timezone.now') as mock_now:
    mock_now.return_value = timezone.make_aware(
        timezone.datetime(2024, 1, 1, 0, 0, 0)
    )
    resultado = consecutivo_basico.generate_next()
```

### TransactionTestCase para Thread-Safety

```python
class TestConsecutivoThreadSafety(TransactionTestCase):
    def test_thread_safety_concurrent_access(self):
        # Tests con múltiples threads
        ...
```

## Notas Importantes

### Thread-Safety Tests

Los tests de thread-safety usan `TransactionTestCase` en lugar de `@pytest.mark.django_db` porque necesitan manejar transacciones reales para verificar el comportamiento de `select_for_update()`.

### Configuración de Timezone

Los tests usan `django.utils.timezone` para manejar fechas con awareness de zona horaria, siguiendo las mejores prácticas de Django.

### Isolation de Tests

Cada test es completamente independiente y puede ejecutarse en cualquier orden. Se usan fixtures de pytest para garantizar el aislamiento.

## Troubleshooting

### Error: "No module named 'pytest'"

```bash
pip install pytest pytest-django
```

### Error: "django.core.exceptions.ImproperlyConfigured"

Asegúrate de tener configurado `DJANGO_SETTINGS_MODULE`:

```bash
export DJANGO_SETTINGS_MODULE=config.settings  # Linux/Mac
set DJANGO_SETTINGS_MODULE=config.settings     # Windows
```

O verifica que `pytest.ini` esté presente en el directorio backend.

### Tests de Thread-Safety Fallan

Los tests de concurrencia pueden fallar si la base de datos no soporta transacciones. Asegúrate de usar PostgreSQL o MySQL en lugar de SQLite para estos tests.

## Métricas de Calidad

### Cobertura Esperada

- **Líneas cubiertas**: >95% del modelo ConsecutivoConfig
- **Branches cubiertos**: >90% de todas las ramas de decisión
- **Thread-safety**: Verificado con tests de concurrencia

### Tiempo de Ejecución

- Tests unitarios: <5 segundos
- Tests de thread-safety: <10 segundos
- Total: <15 segundos

## Mantenimiento

Al modificar el modelo `ConsecutivoConfig`, asegúrate de:

1. Actualizar los tests afectados
2. Mantener >90% de cobertura
3. Verificar que todos los tests pasan
4. Revisar tests de thread-safety si cambias `get_next_number()`

## Referencias

- [pytest-django documentation](https://pytest-django.readthedocs.io/)
- [Django Testing Tools](https://docs.djangoproject.com/en/stable/topics/testing/tools/)
- [pytest fixtures](https://docs.pytest.org/en/stable/fixture.html)
