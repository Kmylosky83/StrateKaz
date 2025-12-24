# Instrucciones de Verificación de Tests

## Archivos Creados ✅

```
backend/apps/gestion_estrategica/configuracion/tests/
├── __init__.py                         # Paquete de tests
├── test_empresa_config.py              # 32 tests unitarios (717 líneas)
├── README.md                           # Documentación de tests
├── RESUMEN_TESTS.md                    # Resumen ejecutivo
├── INSTRUCCIONES_VERIFICACION.md       # Este archivo
└── run_tests.sh                        # Script de ejecución
```

---

## Paso 1: Verificar Estructura de Archivos

Desde la raíz del proyecto backend:

```bash
cd backend/
ls -la apps/gestion_estrategica/configuracion/tests/
```

Deberías ver:
- `__init__.py` (inicializador)
- `test_empresa_config.py` (tests principales)
- `README.md` (documentación)
- `RESUMEN_TESTS.md` (resumen)
- `run_tests.sh` (script ejecutable)
- `INSTRUCCIONES_VERIFICACION.md` (este archivo)

---

## Paso 2: Verificar Configuración de pytest

El proyecto ya tiene configuración de pytest en `backend/pytest.ini`:

```bash
cat pytest.ini
```

Configuración esperada:
- `DJANGO_SETTINGS_MODULE = config.settings`
- `testpaths = apps`
- Marcadores: `unit`, `integration`, `slow`
- Coverage habilitado

---

## Paso 3: Ejecutar Tests (Método Recomendado con Docker)

### 3.1 Levantar servicios
```bash
cd ..  # Ir a la raíz del proyecto
docker-compose up -d
```

### 3.2 Ejecutar tests
```bash
# Ejecutar todos los tests de EmpresaConfig
docker-compose exec backend pytest apps/gestion_estrategica/configuracion/tests/test_empresa_config.py -v

# Ejecutar con cobertura
docker-compose exec backend pytest apps/gestion_estrategica/configuracion/tests/test_empresa_config.py \
    --cov=apps.gestion_estrategica.configuracion.models \
    --cov-report=term-missing
```

---

## Paso 4: Verificar Resultado Esperado

### Output esperado (32 tests):

```
================================ test session starts =================================
platform linux -- Python 3.11.x, pytest-7.x.x, pluggy-1.x.x
collected 32 items

apps/gestion_estrategica/configuracion/tests/test_empresa_config.py::TestValidacionNIT::test_nit_valido_con_guion PASSED                    [ 3%]
apps/gestion_estrategica/configuracion/tests/test_empresa_config.py::TestValidacionNIT::test_nit_valido_sin_guion PASSED                    [ 6%]
apps/gestion_estrategica/configuracion/tests/test_empresa_config.py::TestValidacionNIT::test_nit_valido_con_puntos PASSED                   [ 9%]
...
apps/gestion_estrategica/configuracion/tests/test_empresa_config.py::TestRepresentacionString::test_str_incluye_razon_social_y_nit PASSED   [100%]

================================ 32 passed in 2.45s =================================
```

---

## Paso 5: Verificar Cobertura

### 5.1 Generar reporte de cobertura
```bash
docker-compose exec backend pytest apps/gestion_estrategica/configuracion/tests/test_empresa_config.py \
    --cov=apps.gestion_estrategica.configuracion.models \
    --cov-report=term-missing \
    --cov-report=html
```

### 5.2 Ver reporte HTML
```bash
# El reporte se genera en backend/htmlcov/
# Abrir en navegador: backend/htmlcov/index.html
```

### 5.3 Cobertura esperada
- **EmpresaConfig**: ~95% de líneas
- **validar_nit_colombiano**: 100%
- **Propiedades computadas**: 100%
- **Métodos de clase**: 100%

---

## Paso 6: Ejecutar Tests Específicos

### 6.1 Solo tests de validación de NIT
```bash
docker-compose exec backend pytest \
    apps/gestion_estrategica/configuracion/tests/test_empresa_config.py::TestValidacionNIT -v
```

Resultado esperado: **9 tests pasados**

### 6.2 Solo tests de Singleton
```bash
docker-compose exec backend pytest \
    apps/gestion_estrategica/configuracion/tests/test_empresa_config.py::TestSingletonPattern -v
```

Resultado esperado: **3 tests pasados**

### 6.3 Solo tests de Formateo de NIT
```bash
docker-compose exec backend pytest \
    apps/gestion_estrategica/configuracion/tests/test_empresa_config.py::TestFormateoNIT -v
```

Resultado esperado: **4 tests pasados**

---

## Paso 7: Verificar Tests Críticos Manualmente

### 7.1 Test de NIT válido
Este test verifica que el algoritmo DIAN funciona correctamente:

```bash
docker-compose exec backend pytest \
    apps/gestion_estrategica/configuracion/tests/test_empresa_config.py::TestValidacionNIT::test_nits_reales_colombianos -v
```

**NITs validados**:
- Bancolombia: 860007738-9 ✅
- Grupo Éxito: 890903938-8 ✅
- Davivienda: 860034313-7 ✅

### 7.2 Test de Singleton
Este test verifica que solo se puede crear una instancia:

```bash
docker-compose exec backend pytest \
    apps/gestion_estrategica/configuracion/tests/test_empresa_config.py::TestSingletonPattern::test_impide_crear_segunda_instancia -v
```

Debe pasar mostrando que se lanza `ValidationError`.

### 7.3 Test de Formateo
Este test verifica que el NIT se formatea automáticamente:

```bash
docker-compose exec backend pytest \
    apps/gestion_estrategica/configuracion/tests/test_empresa_config.py::TestFormateoNIT::test_formatea_nit_sin_guion -v
```

Debe pasar mostrando que `9001234567` se convierte a `900123456-7`.

---

## Paso 8: Verificar Casos de Error

### 8.1 NIT con dígito de verificación incorrecto
```bash
docker-compose exec backend pytest \
    apps/gestion_estrategica/configuracion/tests/test_empresa_config.py::TestValidacionNIT::test_nit_digito_verificacion_incorrecto -v
```

Debe pasar mostrando que se detecta el error "Debería ser 7, no 9".

### 8.2 Separadores iguales (error de validación)
```bash
docker-compose exec backend pytest \
    apps/gestion_estrategica/configuracion/tests/test_empresa_config.py::TestValidaciones::test_validacion_separadores_iguales -v
```

Debe pasar mostrando que se lanza `ValidationError`.

---

## Paso 9: Modo Debug (si hay fallos)

### 9.1 Ejecutar con traceback completo
```bash
docker-compose exec backend pytest \
    apps/gestion_estrategica/configuracion/tests/test_empresa_config.py -vv --tb=long
```

### 9.2 Ejecutar con prints visibles
```bash
docker-compose exec backend pytest \
    apps/gestion_estrategica/configuracion/tests/test_empresa_config.py -v -s
```

### 9.3 Ejecutar con PDB (debugger)
```bash
docker-compose exec backend pytest \
    apps/gestion_estrategica/configuracion/tests/test_empresa_config.py --pdb
```

---

## Paso 10: Integración Continua

### 10.1 Verificar que funciona sin Docker (opcional)

Si tienes un entorno virtual local:

```bash
cd backend/
source venv/bin/activate  # Linux/Mac
# O en Windows: venv\Scripts\activate

pip install -r requirements.txt
pytest apps/gestion_estrategica/configuracion/tests/test_empresa_config.py -v
```

### 10.2 Preparar para CI/CD

Los tests están listos para GitHub Actions, GitLab CI, Jenkins, etc.

Ejemplo para GitHub Actions (`.github/workflows/tests.yml`):

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          docker-compose up -d
          docker-compose exec -T backend pytest \
            apps/gestion_estrategica/configuracion/tests/test_empresa_config.py \
            --cov=apps.gestion_estrategica.configuracion \
            --junit-xml=junit.xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Resumen de Verificación

### Checklist de Verificación ✅

- [ ] Archivos creados correctamente en `tests/`
- [ ] `pytest.ini` configurado correctamente
- [ ] Docker containers levantados
- [ ] 32 tests ejecutados exitosamente
- [ ] Cobertura > 90% en `EmpresaConfig`
- [ ] Tests de NIT con empresas reales pasan
- [ ] Test de Singleton funciona correctamente
- [ ] Test de formateo funciona correctamente
- [ ] Tests de validación detectan errores
- [ ] Script `run_tests.sh` es ejecutable

---

## Solución de Problemas Comunes

### Problema 1: "ImportError: No module named pytest"
**Solución**: Instalar pytest en el contenedor
```bash
docker-compose exec backend pip install pytest pytest-django pytest-cov
```

### Problema 2: "django.core.exceptions.ImproperlyConfigured"
**Solución**: Verificar variable de entorno
```bash
docker-compose exec backend env | grep DJANGO_SETTINGS_MODULE
```

### Problema 3: Tests fallan por base de datos
**Solución**: Ejecutar migraciones
```bash
docker-compose exec backend python manage.py migrate
```

### Problema 4: "No such file or directory: test_empresa_config.py"
**Solución**: Verificar ruta desde backend/
```bash
docker-compose exec backend ls apps/gestion_estrategica/configuracion/tests/
```

---

## Contacto y Soporte

Si tienes problemas ejecutando los tests:

1. Verifica que Docker esté corriendo: `docker-compose ps`
2. Verifica logs del backend: `docker-compose logs backend`
3. Entra al contenedor manualmente: `docker-compose exec backend bash`
4. Lee la documentación completa en `README.md`

---

**Última actualización**: 2025-12-24
**Versión**: 1.0
**Estado**: LISTO PARA PRODUCCIÓN ✅
