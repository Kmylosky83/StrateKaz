# Quick Start - Tests de Medicina Laboral

Guía rápida para ejecutar los tests del módulo de Medicina Laboral.

## Instalación Rápida

```bash
# Instalar dependencias
pip install pytest pytest-django factory-boy faker

# Opcional: Cobertura
pip install pytest-cov

# Opcional: Ejecución paralela
pip install pytest-xdist
```

## Comandos Rápidos

### 1. Ejecutar todos los tests
```bash
pytest backend/apps/hseq_management/medicina_laboral/tests/
```

### 2. Ejecutar con verbosidad
```bash
pytest backend/apps/hseq_management/medicina_laboral/tests/ -v
```

### 3. Ejecutar con cobertura
```bash
pytest backend/apps/hseq_management/medicina_laboral/tests/ \
    --cov=apps.hseq_management.medicina_laboral \
    --cov-report=html
```

### 4. Ejecutar en paralelo (más rápido)
```bash
pytest backend/apps/hseq_management/medicina_laboral/tests/ -n auto
```

### 5. Ejecutar un modelo específico
```bash
# Solo tests de ExamenMedico
pytest backend/apps/hseq_management/medicina_laboral/tests/test_models.py::TestExamenMedico -v
```

### 6. Ejecutar un test específico
```bash
pytest backend/apps/hseq_management/medicina_laboral/tests/test_models.py::TestExamenMedico::test_create_examen_medico -v
```

## Scripts de Ayuda

### Linux/Mac
```bash
cd backend/apps/hseq_management/medicina_laboral/tests
chmod +x run_tests.sh
./run_tests.sh
```

### Windows
```cmd
cd backend\apps\hseq_management\medicina_laboral\tests
run_tests.bat
```

### Verificación de Tests
```bash
cd backend
python apps/hseq_management/medicina_laboral/tests/check_tests.py
```

## Estructura de Tests

```
tests/
├── __init__.py              # Paquete
├── conftest.py              # 23 fixtures
├── factories.py             # 7 factories
├── test_models.py           # 66 tests
├── README.md                # Documentación completa
├── QUICKSTART.md           # Esta guía
├── run_tests.sh            # Script Linux/Mac
├── run_tests.bat           # Script Windows
└── check_tests.py          # Verificación
```

## Modelos Testeados (66 tests)

| Modelo | Tests | Descripción |
|--------|-------|-------------|
| TipoExamen | 9 | Tipos de exámenes médicos |
| ExamenMedico | 11 | Exámenes realizados |
| RestriccionMedica | 11 | Restricciones médicas |
| ProgramaVigilancia | 8 | Programas PVE |
| CasoVigilancia | 13 | Casos en vigilancia |
| DiagnosticoOcupacional | 6 | Diagnósticos CIE-10 |
| EstadisticaMedica | 8 | Estadísticas mensuales |

## Fixtures Disponibles

Usa estas fixtures en tus tests:

```python
def test_mi_funcion(examen_medico, restriccion_medica, caso_vigilancia):
    # Los objetos ya están creados y listos para usar
    assert examen_medico.estado == 'PROGRAMADO'
    assert restriccion_medica.esta_vigente
    assert caso_vigilancia.programa is not None
```

### Fixtures básicas
- `empresa`, `colaborador_id`, `cargo_id`, `user_id`
- `anio_actual`, `mes_actual`

### Fixtures de modelos
- `tipo_examen_ingreso`, `tipo_examen_periodico`
- `examen_medico`, `examen_completado`
- `restriccion_medica`, `restriccion_permanente`
- `programa_vigilancia`, `programa_cardiovascular`
- `caso_vigilancia`, `caso_con_seguimientos`
- `diagnostico_ocupacional`, `diagnostico_comun`
- `estadistica_medica`

## Factories Disponibles

Crea datos de prueba fácilmente:

```python
from .factories import ExamenMedicoFactory, RestriccionMedicaFactory

# Crear con defaults
examen = ExamenMedicoFactory()

# Crear con valores específicos
examen = ExamenMedicoFactory(
    empresa_id=1,
    colaborador_id=100,
    estado='COMPLETADO'
)

# Crear múltiples
examenes = ExamenMedicoFactory.create_batch(5)
```

Factories disponibles:
- `TipoExamenFactory`
- `ExamenMedicoFactory`
- `RestriccionMedicaFactory`
- `ProgramaVigilanciaFactory`
- `CasoVigilanciaFactory`
- `DiagnosticoOcupacionalFactory`
- `EstadisticaMedicaFactory`

## Ejemplos de Tests

### Test básico
```python
import pytest
from .factories import ExamenMedicoFactory

@pytest.mark.django_db
def test_crear_examen():
    examen = ExamenMedicoFactory()
    assert examen.pk is not None
```

### Test con fixture
```python
@pytest.mark.django_db
def test_con_fixture(examen_medico):
    assert examen_medico.estado == 'PROGRAMADO'
```

### Test de validación
```python
@pytest.mark.django_db
def test_validacion_fecha(examen_medico):
    examen_medico.estado = 'COMPLETADO'
    examen_medico.fecha_realizado = None

    with pytest.raises(ValidationError):
        examen_medico.clean()
```

### Test de método custom
```python
@pytest.mark.django_db
def test_registrar_seguimiento(caso_vigilancia):
    caso_vigilancia.registrar_seguimiento('Test', 1)
    assert len(caso_vigilancia.seguimientos) == 1
```

## Troubleshooting

### Error: "django.core.exceptions.ImproperlyConfigured"
```bash
# Asegúrate de estar en el directorio correcto
cd backend

# Ejecuta con la variable de entorno
DJANGO_SETTINGS_MODULE=config.settings pytest apps/hseq_management/medicina_laboral/tests/
```

### Error: "No module named 'factory'"
```bash
pip install factory-boy
```

### Error: "No module named 'pytest'"
```bash
pip install pytest pytest-django
```

### Tests muy lentos
```bash
# Usa ejecución paralela
pip install pytest-xdist
pytest apps/hseq_management/medicina_laboral/tests/ -n auto
```

### Error: "Database locked"
```bash
# Usa --reuse-db para reutilizar la base de datos
pytest apps/hseq_management/medicina_laboral/tests/ --reuse-db
```

## Tips y Tricks

### Ejecutar solo tests fallidos
```bash
pytest --lf  # Last failed
```

### Detener en primer error
```bash
pytest -x
```

### Mostrar prints durante tests
```bash
pytest -s
```

### Output más detallado
```bash
pytest -vv
```

### Ver warnings
```bash
pytest -W all
```

### Generar reporte JUnit (para CI/CD)
```bash
pytest --junitxml=test-results.xml
```

## Integración Continua

### GitHub Actions
```yaml
- name: Run Tests
  run: |
    pytest apps/hseq_management/medicina_laboral/tests/ \
      --cov=apps.hseq_management.medicina_laboral \
      --junitxml=test-results.xml
```

### GitLab CI
```yaml
test:
  script:
    - pytest apps/hseq_management/medicina_laboral/tests/
      --cov=apps.hseq_management.medicina_laboral
```

## Próximos Pasos

1. Lee el [README.md](README.md) para documentación completa
2. Revisa [test_models.py](test_models.py) para ejemplos
3. Explora [conftest.py](conftest.py) para ver todas las fixtures
4. Usa [factories.py](factories.py) para crear datos de prueba

## Recursos

- [pytest Documentation](https://docs.pytest.org/)
- [pytest-django](https://pytest-django.readthedocs.io/)
- [Factory Boy](https://factoryboy.readthedocs.io/)
- [Django Testing](https://docs.djangoproject.com/en/stable/topics/testing/)

---

**¿Listo para empezar?**

```bash
pytest backend/apps/hseq_management/medicina_laboral/tests/ -v
```
