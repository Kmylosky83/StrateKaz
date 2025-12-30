# Tests del Módulo Analytics

## Resumen

Suite completa de tests para el módulo Analytics con 55 tests distribuidos en 3 aplicaciones.

## Estructura

```
analytics/
├── config_indicadores/tests/     # 24 tests (14 modelos + 10 views)
├── dashboard_gerencial/tests/    # 14 tests (7 modelos + 7 views)
└── indicadores_area/tests/       # 17 tests (8 modelos + 9 views)
```

**Total:** 55 tests, 2,452 líneas de código

## Ejecución Rápida

### Ejecutar todos los tests de Analytics
```bash
cd backend
pytest apps/analytics/ -v
```

### Ejecutar por aplicación
```bash
# Config Indicadores (KPIs, Metas, Semáforos)
pytest apps/analytics/config_indicadores/tests/ -v

# Dashboard Gerencial (Vistas, Widgets, Favoritos)
pytest apps/analytics/dashboard_gerencial/tests/ -v

# Indicadores Área (Valores, Acciones, Alertas)
pytest apps/analytics/indicadores_area/tests/ -v
```

### Ejecutar solo tests de modelos o views
```bash
# Solo modelos
pytest apps/analytics/ -k "test_models" -v

# Solo views
pytest apps/analytics/ -k "test_views" -v
```

### Ejecutar test específico
```bash
pytest apps/analytics/config_indicadores/tests/test_models.py::TestCatalogoKPI::test_crear_kpi_completo -v
```

## Con Cobertura

```bash
# Reporte en terminal
pytest apps/analytics/ --cov=apps.analytics --cov-report=term-missing

# Reporte HTML (crea htmlcov/index.html)
pytest apps/analytics/ --cov=apps.analytics --cov-report=html
```

## Filtros Útiles

```bash
# Tests que contienen "semaforo" en el nombre
pytest apps/analytics/ -k "semaforo" -v

# Tests de un modelo específico
pytest apps/analytics/ -k "TestCatalogoKPI" -v

# Tests de acciones customizadas
pytest apps/analytics/ -k "accion_" -v

# Mostrar solo tests fallidos
pytest apps/analytics/ --lf -v
```

## Marcadores

```bash
# Solo tests de base de datos (todos los del módulo)
pytest apps/analytics/ -m django_db -v
```

## Modo Verboso con Detalles

```bash
# Ver cada assert que pasa
pytest apps/analytics/ -vv

# Ver print statements
pytest apps/analytics/ -v -s

# Ver traceback completo en errores
pytest apps/analytics/ -v --tb=long
```

## Verificar Antes de Commit

```bash
# Suite completa rápida (sin cobertura)
pytest apps/analytics/ -v --tb=short

# Suite completa con cobertura
pytest apps/analytics/ --cov=apps.analytics --cov-report=term-missing
```

## Tests por Funcionalidad

### KPIs y Configuración
```bash
pytest apps/analytics/config_indicadores/tests/test_models.py::TestCatalogoKPI -v
pytest apps/analytics/config_indicadores/tests/test_models.py::TestFichaTecnicaKPI -v
pytest apps/analytics/config_indicadores/tests/test_models.py::TestMetaKPI -v
pytest apps/analytics/config_indicadores/tests/test_models.py::TestConfiguracionSemaforo -v
```

### Cálculo de Semáforos
```bash
pytest apps/analytics/config_indicadores/tests/test_models.py::TestConfiguracionSemaforo::test_obtener_color_verde -v
pytest apps/analytics/config_indicadores/tests/test_models.py::TestConfiguracionSemaforo::test_obtener_color_amarillo -v
pytest apps/analytics/config_indicadores/tests/test_models.py::TestConfiguracionSemaforo::test_obtener_color_rojo -v
```

### Valores de KPI
```bash
pytest apps/analytics/indicadores_area/tests/test_models.py::TestValorKPI -v
pytest apps/analytics/indicadores_area/tests/test_views.py::TestValorKPIViewSet -v
```

### Dashboards y Favoritos
```bash
pytest apps/analytics/dashboard_gerencial/tests/test_models.py::TestVistaDashboard -v
pytest apps/analytics/dashboard_gerencial/tests/test_models.py::TestFavoritoDashboard -v
pytest apps/analytics/dashboard_gerencial/tests/test_views.py::TestVistaDashboardViewSet::test_accion_mis_favoritos -v
```

### Alertas y Acciones
```bash
pytest apps/analytics/indicadores_area/tests/test_models.py::TestAlertaKPI -v
pytest apps/analytics/indicadores_area/tests/test_models.py::TestAccionPorKPI -v
```

## Fixtures Disponibles

Cada app tiene sus propias fixtures en `tests/conftest.py`:

### config_indicadores (20 fixtures)
- Usuarios: `usuario`, `responsable`
- Empresa: `empresa`
- Cargos: `cargo_medicion`, `cargo_analisis`
- KPIs: `catalogo_kpi`, `catalogo_kpi_financiero`, `catalogo_kpi_calidad`
- Configuraciones: `ficha_tecnica`, `meta_kpi`, `semaforo_config`, `semaforo_config_financiero`
- Cliente: `api_client`

### dashboard_gerencial (15 fixtures)
- Usuarios: `usuario`, `otro_usuario`
- Roles: `rol`
- Vistas: `vista_dashboard_financiera`, `vista_dashboard_procesos`, `vista_dashboard_restringida`
- Widgets: `widget_kpi_card`, `widget_grafico_linea`
- Favoritos: `favorito_dashboard`, `favorito_default`

### indicadores_area (16 fixtures)
- Colaboradores: `colaborador`
- KPIs: `kpi_sst`, `kpi_financiero`
- Configuraciones: `semaforo_sst`, `meta_sst`
- Valores: `valor_kpi_verde`, `valor_kpi_amarillo`, `valor_kpi_rojo`
- Acciones: `accion_por_kpi`, `accion_completada`
- Alertas: `alerta_umbral_rojo`, `alerta_sin_medicion`, `alerta_leida`

## Troubleshooting

### Error: "No module named 'apps.analytics'"
```bash
# Asegúrate de estar en el directorio backend
cd backend
pytest apps/analytics/ -v
```

### Error: "Database is not set up"
```bash
# Ejecuta las migraciones
python manage.py migrate
pytest apps/analytics/ -v
```

### Tests muy lentos
```bash
# Usa la opción --reuse-db para reutilizar la BD entre ejecuciones
pytest apps/analytics/ -v --reuse-db

# O ejecuta en paralelo (requiere pytest-xdist)
pytest apps/analytics/ -v -n auto
```

### Ver solo nombres de tests sin ejecutar
```bash
pytest apps/analytics/ --collect-only
```

## Integración Continua

Para CI/CD, usar:
```bash
pytest apps/analytics/ \
  --cov=apps.analytics \
  --cov-report=xml \
  --cov-report=term \
  --junitxml=junit.xml \
  -v
```

## Documentación Adicional

- **Resumen Completo:** `docs/desarrollo/TEST-ANALYTICS-RESUMEN.md`
- **Estándares de Tests:** `docs/desarrollo/PLANTILLAS-CODIGO-HSEQ.md`
- **Configuración pytest:** `backend/pytest.ini`

## Contribuir

Al agregar nuevos tests:
1. Seguir el patrón AAA (Arrange, Act, Assert)
2. Usar nombres descriptivos: `test_<lo_que_hace>_<resultado_esperado>`
3. Agregar docstrings con Given/When/Then
4. Crear fixtures reutilizables en conftest.py
5. Verificar que pasan: `pytest apps/analytics/ -v`

---

**Última actualización:** 29 Diciembre 2025
**Total de tests:** 55
**Líneas de código:** 2,452
