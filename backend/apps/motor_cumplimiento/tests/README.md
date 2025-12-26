# Tests del Módulo Motor de Cumplimiento

Suite completa de tests para el módulo `motor_cumplimiento` según cronograma Semana 7.

## Estructura de Tests

### 1. Matriz Legal (`matriz_legal/tests/`)

#### `test_models.py` (17 tests)
- **TestTipoNorma** (5 tests):
  - Creación básica
  - Código único
  - Soft delete
  - Restore
  - Representación string

- **TestNormaLegal** (5 tests):
  - Creación completa
  - Propiedad codigo_completo
  - Filtrado por sistema SST
  - Filtrado por sistema Ambiental
  - Representación string

- **TestEmpresaNorma** (7 tests):
  - Creación básica
  - Unique together empresa-norma
  - Estados de cumplimiento (Cumple, Alto, Medio, Bajo, No evaluado)
  - Representación string

#### `test_serializers.py` (6 tests)
- **TestTipoNormaSerializer** (1 test):
  - Serialización básica

- **TestNormaLegalSerializer** (3 tests):
  - Serialización completa con nested
  - Campo computado codigo_completo
  - Campo computado sistemas_aplicables

- **TestEmpresaNormaSerializer** (1 test):
  - Serialización con nested y estado_cumplimiento

- **TestEmpresaNormaCreateUpdateSerializer** (2 tests):
  - Validación de justificación cuando no aplica
  - Validación exitosa con justificación

#### `test_views.py` (10 tests)
- **TestTipoNormaViewSet** (3 tests):
  - Listar
  - Crear
  - Toggle active

- **TestNormaLegalViewSet** (4 tests):
  - Listar
  - Filtrar by_sistema
  - Filtrar vigentes
  - Estadísticas

- **TestEmpresaNormaViewSet** (5 tests):
  - Listar
  - Crear
  - Evaluar cumplimiento
  - Matriz de cumplimiento
  - Pendientes de evaluación

**Subtotal Matriz Legal: 33 tests**

---

### 2. Requisitos Legales (`requisitos_legales/tests/`)

#### `test_models.py` (13 tests)
- **TestTipoRequisito** (2 tests):
  - Creación
  - Código único

- **TestRequisitoLegal** (2 tests):
  - Creación
  - Unique together tipo-código

- **TestEmpresaRequisito** (6 tests):
  - Creación
  - Días para vencer positivo/negativo
  - Está vencido (true/false)
  - Está próximo a vencer (true/false)

- **TestAlertaVencimiento** (3 tests):
  - Creación
  - Marcar como enviada
  - Está pendiente

#### `test_views.py` (8 tests)
- **TestTipoRequisitoViewSet** (2 tests)
- **TestRequisitoLegalViewSet** (1 test)
- **TestEmpresaRequisitoViewSet** (4 tests):
  - Por vencer
  - Vencidos
  - Estadísticas
- **TestAlertaVencimientoViewSet** (2 tests):
  - Listar
  - Pendientes

**Subtotal Requisitos Legales: 21 tests**

---

### 3. Partes Interesadas (`partes_interesadas/tests/`)

#### `test_models.py` (7 tests)
- **TestTipoParteInteresada** (2 tests)
- **TestParteInteresada** (2 tests)
- **TestRequisitoParteInteresada** (1 test)
- **TestMatrizComunicacion** (2 tests)

#### `test_views.py` (7 tests)
- **TestTipoParteInteresadaViewSet** (2 tests)
- **TestParteInteresadaViewSet** (3 tests):
  - Incluye matriz poder-interés
- **TestRequisitoParteInteresadaViewSet** (1 test)
- **TestMatrizComunicacionViewSet** (2 tests)

**Subtotal Partes Interesadas: 14 tests**

---

### 4. Reglamentos Internos (`reglamentos_internos/tests/`)

#### `test_models.py` (10 tests)
- **TestTipoReglamento** (2 tests)
- **TestReglamento** (4 tests):
  - Creación en diferentes estados
  - Unique together
  - Multi-tenancy
- **TestVersionReglamento** (2 tests)
- **TestPublicacionReglamento** (2 tests)
- **TestSocializacionReglamento** (2 tests)

#### `test_views.py` (10 tests)
- **TestTipoReglamentoViewSet** (2 tests)
- **TestReglamentoViewSet** (3 tests)
- **TestVersionReglamentoViewSet** (2 tests)
- **TestPublicacionReglamentoViewSet** (2 tests)
- **TestSocializacionReglamentoViewSet** (2 tests)

**Subtotal Reglamentos Internos: 20 tests**

---

## Total de Tests: 88

- **Matriz Legal**: 33 tests
- **Requisitos Legales**: 21 tests
- **Partes Interesadas**: 14 tests
- **Reglamentos Internos**: 20 tests

## Fixtures Compartidas (`conftest.py`)

### Global (`motor_cumplimiento/conftest.py`)
- `user`: Usuario básico
- `admin_user`: Usuario administrador
- `responsable_user`: Usuario responsable de cumplimiento
- `empresa`: Empresa principal
- `empresa_secundaria`: Segunda empresa para multi-tenancy
- `api_client`: Cliente API
- `authenticated_client`: Cliente autenticado
- `admin_client`: Cliente admin autenticado

### Por App
Cada app tiene su propio `conftest.py` con fixtures específicas para sus modelos.

## Ejecución de Tests

### Ejecutar todos los tests del módulo
```bash
cd backend
pytest apps/motor_cumplimiento/ -v
```

### Ejecutar tests por app
```bash
pytest apps/motor_cumplimiento/matriz_legal/tests/ -v
pytest apps/motor_cumplimiento/requisitos_legales/tests/ -v
pytest apps/motor_cumplimiento/partes_interesadas/tests/ -v
pytest apps/motor_cumplimiento/reglamentos_internos/tests/ -v
```

### Coverage
```bash
pytest apps/motor_cumplimiento/ --cov=apps.motor_cumplimiento --cov-report=html
```

### Solo tests de modelos
```bash
pytest apps/motor_cumplimiento/ -k "test_models" -v
```

### Solo tests de views
```bash
pytest apps/motor_cumplimiento/ -k "test_views" -v
```

## Convenciones

### Naming
- Tests de modelos: `test_models.py`
- Tests de serializers: `test_serializers.py`
- Tests de views: `test_views.py`
- Fixtures: `conftest.py`

### Estructura de Test
```python
def test_descripcion_clara(self, fixtures_necesarias):
    """
    Test: Breve descripción

    Given: Estado inicial
    When: Acción ejecutada
    Then: Resultado esperado
    """
    # Arrange
    ...
    # Act
    ...
    # Assert
    ...
```

### Markers
- `@pytest.mark.django_db`: Para tests que acceden a la BD
- Usar fixtures en lugar de setup/teardown

## Coverage Mínimo

- **Target**: 80% coverage
- **Prioridad**: Modelos y lógica de negocio
- **Actual**: Verificar con `pytest --cov`

## Notas

1. **Multi-tenancy**: Todos los tests verifican aislamiento por empresa
2. **Soft Delete**: Tests incluyen verificación de soft delete/restore
3. **API Tests**: Usan `APIClient` con autenticación
4. **Validaciones**: Incluyen tests de validación de serializers
5. **Propiedades Computadas**: Todas las properties tienen tests

## Próximos Pasos

1. Ejecutar tests y verificar coverage
2. Ajustar según fallos encontrados
3. Agregar tests de integración si es necesario
4. Documentar casos edge encontrados
