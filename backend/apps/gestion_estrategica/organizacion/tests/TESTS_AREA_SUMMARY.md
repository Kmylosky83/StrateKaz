# Resumen de Tests para Area - Jerarquía Organizacional

## Archivo Creado

`backend/apps/gestion_estrategica/organizacion/tests/test_area.py`

## Objetivo

Proveer cobertura completa de tests para el modelo `Area`, que maneja la jerarquía organizacional con estructura de árbol (parent-child relationships).

## Estadísticas de Cobertura

- **Total de Tests**: 29 tests individuales
- **Clases de Test**: 5 clases organizadas por funcionalidad
- **Fixtures**: 7 fixtures reutilizables
- **Líneas de Código**: ~650 líneas

## Estructura de Tests

### 1. TestAreaJerarquia (8 tests)

Verifica el correcto funcionamiento de la estructura jerárquica de áreas.

**Tests incluidos:**
- `test_area_raiz_sin_parent`: Verifica áreas raíz sin parent (nivel 0)
- `test_area_con_parent_valido`: Valida relación parent-child
- `test_area_full_path_calculo`: Prueba generación de ruta completa (ej: "Gerencia > Operaciones > Producción")
- `test_area_level_calculo`: Verifica cálculo correcto de profundidad en la jerarquía
- `test_area_get_all_children`: Prueba obtención recursiva de todas las subáreas
- `test_area_children_count`: Valida conteo de hijos directos activos
- `test_area_multiple_niveles_jerarquia`: Prueba jerarquías de 4+ niveles
- `test_area_herencia_propiedades`: Verifica herencia de AuditModel, SoftDeleteModel, OrderedModel

### 2. TestAreaValidaciones (5 tests)

Prueba las validaciones de integridad del modelo.

**Tests incluidos:**
- `test_area_no_puede_ser_su_propio_parent`: Previene que area.parent == area
- `test_area_no_ciclos_jerarquicos`: Detecta ciclos en la jerarquía (ej: A → B → C → A)
- `test_area_codigo_unico`: Valida constraint de código único
- `test_area_nombre_requerido`: Verifica que el nombre es obligatorio
- `test_area_soft_delete_hijos`: Prueba que soft delete mantiene hijos activos

### 3. TestAreaOrdenamiento (3 tests)

Verifica el ordenamiento de áreas usando OrderedModel.

**Tests incluidos:**
- `test_area_ordenamiento_por_orden`: Valida orden por campo 'order'
- `test_area_move_up_down`: Prueba métodos move_up() y move_down()
- `test_area_ordenamiento_dentro_de_parent`: Verifica ordenamiento independiente por parent

### 4. TestAreaAPI (5 tests)

Prueba los endpoints de la API REST.

**Tests incluidos:**
- `test_listar_areas_jerarquicas`: GET /api/organizacion/areas/
- `test_crear_area_con_parent`: POST /api/organizacion/areas/
- `test_mover_area_a_otro_parent`: PATCH /api/organizacion/areas/{id}/
- `test_filtrar_areas_activas`: GET /api/organizacion/areas/?show_inactive=false
- `test_endpoint_organigrama`: GET /api/organizacion/organigrama/

### 5. TestAreaEdgeCases (8 tests)

Cubre casos límite y edge cases.

**Tests incluidos:**
- `test_area_sin_manager_permitido`: Área puede no tener manager
- `test_area_sin_cost_center_permitido`: Área puede no tener centro de costo
- `test_str_method`: Verifica formato __str__
- `test_area_get_all_children_sin_hijos`: get_all_children() retorna []
- `test_area_children_count_con_inactivos`: Solo cuenta hijos activos
- `test_area_full_path_area_raiz`: full_path en raíz es solo el nombre
- `test_multiple_areas_raiz_permitidas`: Múltiples áreas raíz son válidas

## Fixtures Reutilizables

### user_admin
Crea un usuario administrador para pruebas de auditoría y API.

### api_client
Cliente de API REST autenticado, listo para hacer requests.

### area_raiz
Área raíz "Gerencia General" (GER) sin parent.

### area_operaciones
Área "Operaciones" (OPE) hija de Gerencia General.

### area_produccion
Área "Producción" (PRO) hija de Operaciones (nivel 3).

### jerarquia_completa
Fixture complejo que crea la siguiente estructura:

```
Gerencia General (GER)
├── Operaciones (OPE)
│   ├── Producción (PRO)
│   └── Logística (LOG)
└── Administración (ADM)
    ├── Finanzas (FIN)
    └── Recursos Humanos (RHH)
```

Retorna un diccionario con todas las áreas para fácil acceso:
```python
{
    'raiz': Area,
    'operaciones': Area,
    'produccion': Area,
    'logistica': Area,
    'administracion': Area,
    'finanzas': Area,
    'rrhh': Area
}
```

## Patrones Utilizados

### AAA Pattern (Arrange-Act-Assert)

Todos los tests siguen el patrón AAA para claridad:

```python
def test_area_full_path_calculo(self, area_produccion, area_operaciones, area_raiz):
    # Arrange (preparación implícita en fixtures)

    # Act
    expected_path = 'Gerencia General > Operaciones > Producción'

    # Assert
    assert area_produccion.full_path == expected_path
```

### Given-When-Then en Docstrings

Los docstrings usan formato BDD para claridad:

```python
"""
Test: Cálculo correcto de full_path

Given: Una jerarquía de 3 niveles
When: Se accede a full_path
Then: Debe retornar la ruta completa separada por ' > '
"""
```

### Uso de @pytest.mark.django_db

Todos los tests de modelo usan el decorador `@pytest.mark.django_db` para acceso a la base de datos.

### API Client con Autenticación

Los tests de API usan `APIClient` con `force_authenticate()` para simular usuarios autenticados.

## Cobertura de Funcionalidades

### Modelo Area

- ✅ Campos básicos (code, name, description)
- ✅ Relación jerárquica (parent, children)
- ✅ Propiedades computadas (full_path, level, children_count)
- ✅ Método get_all_children()
- ✅ Validación clean() (ciclos, parent == self)
- ✅ Soft delete
- ✅ Auditoría (created_by, updated_by)
- ✅ Ordenamiento (OrderedModel)

### API Endpoints

- ✅ GET /api/organizacion/areas/ (listar)
- ✅ POST /api/organizacion/areas/ (crear)
- ✅ PATCH /api/organizacion/areas/{id}/ (actualizar)
- ✅ GET /api/organizacion/areas/?show_inactive=false (filtrar)
- ✅ GET /api/organizacion/organigrama/ (visualización)

### Casos Especiales

- ✅ Áreas raíz múltiples
- ✅ Jerarquías profundas (4+ niveles)
- ✅ Soft delete manteniendo integridad
- ✅ Ordenamiento independiente por parent
- ✅ Campos opcionales (manager, cost_center)

## Ejecución de Tests

### Ejecutar todos los tests de Area

```bash
cd backend
pytest apps/gestion_estrategica/organizacion/tests/test_area.py -v
```

### Ejecutar una clase específica

```bash
pytest apps/gestion_estrategica/organizacion/tests/test_area.py::TestAreaJerarquia -v
```

### Ejecutar un test individual

```bash
pytest apps/gestion_estrategica/organizacion/tests/test_area.py::TestAreaJerarquia::test_area_full_path_calculo -v
```

### Con cobertura

```bash
pytest apps/gestion_estrategica/organizacion/tests/test_area.py --cov=apps.gestion_estrategica.organizacion.models --cov-report=html
```

## Comparación con test_consecutivo.py

| Aspecto | test_consecutivo.py | test_area.py |
|---------|---------------------|--------------|
| Total de tests | ~40+ | 29 |
| Clases de test | 7 | 5 |
| Fixtures | 6 | 7 |
| Usa TransactionTestCase | Sí (thread-safety) | No |
| Tests de API | No | Sí (5 tests) |
| Tests de concurrencia | Sí | No |
| Validación de ciclos | No | Sí |

## Próximos Pasos Recomendados

1. **Ejecutar tests** y verificar que todos pasen
2. **Revisar cobertura** con pytest-cov
3. **Agregar tests de rendimiento** si la jerarquía crece mucho
4. **Tests de API adicionales**:
   - GET /api/organizacion/areas/tree/
   - GET /api/organizacion/areas/root/
   - GET /api/organizacion/areas/{id}/children/
   - POST /api/organizacion/areas/{id}/toggle/
5. **Tests de integración** con otros módulos (Cargo, User)

## Notas Técnicas

### Por qué NO se usa TransactionTestCase

A diferencia de `test_consecutivo.py`, estos tests no necesitan `TransactionTestCase` porque:
- No hay operaciones concurrentes
- No se requiere `select_for_update()`
- Los tests de jerarquía son deterministas y secuenciales

### Manejo de Ciclos

La validación de ciclos se prueba en `test_area_no_ciclos_jerarquicos`, que verifica el método `clean()` del modelo.

### Soft Delete en Jerarquías

El test `test_area_soft_delete_hijos` verifica que:
- Al hacer soft_delete de un padre, los hijos mantienen su relación
- Los hijos siguen activos (no se eliminan en cascada)
- Esto es intencional para preservar la integridad de datos

## Mantenimiento

Al modificar el modelo `Area`, actualizar tests relacionados:

1. **Si se agrega un campo**: Agregar test de validación si es requerido
2. **Si se modifica full_path**: Actualizar `test_area_full_path_calculo`
3. **Si se cambia validación**: Actualizar `TestAreaValidaciones`
4. **Si se agrega endpoint**: Agregar test en `TestAreaAPI`

## Referencias

- Modelo: `backend/apps/gestion_estrategica/organizacion/models.py`
- Serializers: `backend/apps/gestion_estrategica/organizacion/serializers.py`
- Views: `backend/apps/gestion_estrategica/organizacion/views.py`
- Tests de referencia: `test_consecutivo.py`, `test_empresa_config.py`
