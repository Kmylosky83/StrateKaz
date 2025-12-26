# Tests del Módulo de Gestión de Proyectos (PMI)

Tests completos para el módulo de Gestión de Proyectos basado en PMBOK 7ma edición.

## Estructura de Archivos

```
gestion_proyectos/tests/
├── __init__.py
├── test_models.py         # Tests unitarios de modelos
├── test_views.py          # Tests de API endpoints
├── test_serializers.py    # Tests de serializers
└── README.md             # Este archivo
```

## Cobertura de Tests

### 1. test_models.py (Tests Unitarios de Modelos)

#### Portafolio
- Creación básica de portafolio
- Validación de código único por empresa
- Representación string
- Soporte multi-empresa

#### Programa
- Creación vinculada a portafolio
- Validación de código único
- Relaciones con portafolio

#### Proyecto
- Creación con todos los campos
- Estados disponibles del ciclo PMI
- Transiciones de estado
- **Cálculo de variación de costo (CV = EV - AC)**
  - Variación positiva (bajo presupuesto)
  - Variación negativa (sobre presupuesto)
- **Cálculo de índice de desempeño de costo (CPI = EV / AC)**
  - CPI > 1 (bajo presupuesto)
  - CPI < 1 (sobre presupuesto)
  - CPI con costo real = 0
- Validación de código único
- Proyectos sin programa

#### ProjectCharter
- Creación vinculada a proyecto
- Relación OneToOne con proyecto
- Prevención de duplicados

#### RiesgoProyecto
- Creación básica
- **Cálculo de nivel_riesgo (P x I)**
  - Nivel máximo: muy_alta (5) × muy_alto (5) = 25
  - Nivel mínimo: muy_baja (1) × muy_bajo (1) = 1
  - Nivel medio: media (3) × medio (3) = 9
  - Nivel alto: alta (4) × alto (4) = 16
- Validación de código único por proyecto

#### SeguimientoProyecto
- Creación básica
- **Cálculo de SPI (Schedule Performance Index = EV / PV)**
  - SPI > 1 (adelantado en cronograma)
  - SPI < 1 (atrasado en cronograma)
  - SPI cuando valor_planificado = 0
- **Cálculo de CPI (Cost Performance Index = EV / AC)**
  - CPI > 1 (bajo presupuesto)
  - CPI < 1 (sobre presupuesto)
  - CPI cuando costo_actual = 0
- Validación de fecha única por proyecto

#### ActaCierre
- Creación básica
- **Cálculo de variación de presupuesto**
  - Positiva: presupuesto_final - costo_final > 0
  - Negativa: presupuesto_final - costo_final < 0
- Relación OneToOne con proyecto
- **Cambio automático de estado a COMPLETADO** (se prueba en test_views.py)

#### Otros Modelos
- InteresadoProyecto
- FaseProyecto
- ActividadProyecto
- RecursoProyecto (con cálculo automático de costo_total)
- LeccionAprendida

**Total: 50+ tests en test_models.py**

---

### 2. test_views.py (Tests de API Endpoints)

#### Autenticación
- Rechazo de acceso sin autenticación (401 Unauthorized)
- Protección de endpoints con IsAuthenticated

#### CRUD de Proyectos (ProyectoViewSet)
- **GET /proyectos/** - Listar proyectos
  - Uso de ProyectoListSerializer (campos simplificados)
- **GET /proyectos/{id}/** - Detalle de proyecto
  - Uso de ProyectoSerializer (completo con propiedades)
- **POST /proyectos/** - Crear proyecto
  - Creación con estado PROPUESTO por defecto
  - Asignación automática de created_by
- **PATCH /proyectos/{id}/** - Actualizar proyecto
- **DELETE /proyectos/{id}/** - Eliminar proyecto
- Filtros:
  - Por estado
  - Por prioridad
  - Por búsqueda (nombre, código)

#### Endpoints Especiales de Proyecto
- **GET /proyectos/dashboard/**
  - Estadísticas agregadas
  - Total de proyectos
  - Proyectos por estado
  - Proyectos por prioridad
  - Proyectos críticos
  - Avance promedio
  - Presupuesto y costo total
  - Filtrado por empresa

- **GET /proyectos/por_estado/**
  - Proyectos agrupados por cada estado
  - Incluye todos los estados posibles

- **POST /proyectos/{id}/cambiar_estado/**
  - Cambio de estado válido
  - Rechazo de estado inválido (400 Bad Request)
  - Actualización correcta en BD

#### Actividades y Gantt (ActividadProyectoViewSet)
- **GET /actividades/** - Listar actividades
- **GET /actividades/gantt/?proyecto={id}**
  - Estructura para diagrama de Gantt
  - Incluye: id, codigo_wbs, nombre, inicio, fin, avance, responsable, predecesoras, estado
  - Dependencias entre actividades (predecesoras)
  - Requiere parámetro proyecto (400 si falta)

#### Riesgos y Matriz (RiesgoProyectoViewSet)
- **GET /riesgos/** - Listar riesgos
- **GET /riesgos/matriz_riesgos/?proyecto={id}**
  - Matriz 5×5 de riesgos
  - Clasificación por probabilidad e impacto
  - Total de riesgos
  - Riesgos de alto nivel
  - Excluye riesgos materializados
  - Requiere parámetro proyecto (400 si falta)

#### Seguimientos y Curva S (SeguimientoProyectoViewSet)
- **GET /seguimientos/** - Listar seguimientos
- **POST /seguimientos/** - Crear seguimiento
  - **Actualización automática del proyecto**: porcentaje_avance y costo_real
- **GET /seguimientos/curva_s/?proyecto={id}**
  - Serie temporal con PV, EV, AC
  - Incluye: fecha, valor_planificado, valor_ganado, costo_actual, avance, SPI, CPI
  - Orden cronológico
  - Requiere parámetro proyecto (400 si falta)

#### Acta de Cierre (ActaCierreViewSet)
- **GET /actas-cierre/** - Listar actas
- **POST /actas-cierre/** - Crear acta de cierre
  - **Cambio automático de estado del proyecto a COMPLETADO**
  - **Actualización de fecha_fin_real del proyecto**

#### Otros ViewSets
- PortafolioViewSet
- ProgramaViewSet
- ProjectCharterViewSet
- InteresadoProyectoViewSet

**Total: 40+ tests en test_views.py**

---

### 3. test_serializers.py (Tests de Serializers)

#### PortafolioSerializer
- Serialización básica
- Campo responsable_nombre (read_only)
- SerializerMethodField: total_programas
- SerializerMethodField: total_proyectos
- Campos read_only: created_at, updated_at, created_by

#### ProgramaSerializer
- Serialización básica
- Campo portafolio_nombre (read_only)
- SerializerMethodField: total_proyectos

#### Serializers de Proyecto
- **ProyectoListSerializer**
  - Campos simplificados para listados
  - Sin relaciones anidadas pesadas
  - Incluye: id, codigo, nombre, tipo_display, estado_display, prioridad_display, etc.

- **ProyectoSerializer (Completo)**
  - Todos los campos y propiedades
  - Campos display: estado_display, tipo_display, prioridad_display
  - Campos de nombres: programa_nombre, sponsor_nombre, gerente_nombre
  - **Propiedades computadas**: variacion_costo, indice_desempeno_costo
  - **Relación anidada**: charter (ProjectCharterSerializer)
  - SerializerMethodFields: total_actividades, total_riesgos, total_recursos

- **ProyectoCreateUpdateSerializer**
  - Para creación y actualización
  - Campos read_only: created_at, updated_at, fecha_propuesta, created_by

#### ProjectCharterSerializer
- Serialización básica
- Campo aprobado_por_nombre (read_only)
- Campos read_only: created_at, updated_at

#### RiesgoProyectoSerializer
- Serialización básica
- **Campo nivel_riesgo (read_only, calculado P × I)**
- Campos display: probabilidad_display, impacto_display, tipo_display
- Campos read_only: created_at, updated_at, fecha_identificacion

#### SeguimientoProyectoSerializer
- Serialización básica
- **Campo SPI (read_only, calculado EV / PV)**
- **Campo CPI (read_only, calculado EV / AC)**
- Campo registrado_por_nombre (read_only)

#### ActaCierreSerializer
- Serialización básica
- **Campo variacion_presupuesto (read_only, calculado)**
- Campos proyecto_codigo, proyecto_nombre (read_only)
- Campos read_only: created_at, variacion_presupuesto

#### Validaciones
- Validación de datos para crear proyecto
- Validación de datos para crear seguimiento

**Total: 30+ tests en test_serializers.py**

---

## Ejecutar los Tests

### Ejecutar todos los tests del módulo
```bash
cd backend
pytest apps/gestion_estrategica/gestion_proyectos/tests/ -v
```

### Ejecutar un archivo específico
```bash
pytest apps/gestion_estrategica/gestion_proyectos/tests/test_models.py -v
pytest apps/gestion_estrategica/gestion_proyectos/tests/test_views.py -v
pytest apps/gestion_estrategica/gestion_proyectos/tests/test_serializers.py -v
```

### Ejecutar con reporte de cobertura
```bash
pytest apps/gestion_estrategica/gestion_proyectos/tests/ --cov=apps.gestion_estrategica.gestion_proyectos --cov-report=html
```

### Ejecutar un test específico
```bash
pytest apps/gestion_estrategica/gestion_proyectos/tests/test_models.py::TestProyecto::test_proyecto_variacion_costo_positiva -v
```

## Patrones Utilizados

### Patrón AAA (Arrange, Act, Assert)
Todos los tests siguen el patrón AAA para máxima claridad:
```python
def test_ejemplo(self, fixture):
    # Arrange - Preparar datos
    proyecto.presupuesto_aprobado = Decimal('180000.00')
    proyecto.porcentaje_avance = 25

    # Act - Ejecutar acción
    cv = proyecto.variacion_costo

    # Assert - Verificar resultado
    assert cv == Decimal('-5000.00')
```

### Fixtures Reutilizables
- `user_admin`: Usuario administrador
- `user_gerente`: Usuario gerente de proyecto
- `api_client`: Cliente de API autenticado
- `portafolio`: Portafolio de ejemplo
- `programa`: Programa vinculado a portafolio
- `proyecto`: Proyecto base para tests
- `proyecto_con_charter`: Proyecto con charter incluido

### Docstrings Descriptivos
Cada test incluye docstring con formato:
```python
"""
Test: Descripción breve

Given: Estado inicial / Precondiciones
When: Acción ejecutada
Then: Resultado esperado
"""
```

## Casos de Prueba Principales

### 1. Propiedades Computadas de Proyecto
- ✅ **variacion_costo**: CV = EV - AC
  - Valor positivo: proyecto bajo presupuesto
  - Valor negativo: proyecto sobre presupuesto

- ✅ **indice_desempeno_costo**: CPI = EV / AC
  - CPI > 1: eficiencia mayor a lo planeado
  - CPI < 1: sobre presupuesto
  - CPI = 1.0 cuando costo_real = 0

### 2. Nivel de Riesgo
- ✅ **nivel_riesgo**: P × I
  - Matriz 5×5: valores de 1 a 25
  - Usado para priorizar gestión de riesgos

### 3. Indicadores EVM (Earned Value Management)
- ✅ **SPI (Schedule Performance Index)**: EV / PV
  - SPI > 1: adelantado en cronograma
  - SPI < 1: atrasado en cronograma

- ✅ **CPI (Cost Performance Index)**: EV / AC
  - CPI > 1: bajo presupuesto
  - CPI < 1: sobre presupuesto

### 4. Automatizaciones
- ✅ Actualización automática de proyecto al crear seguimiento
- ✅ Cambio de estado a COMPLETADO al crear acta de cierre
- ✅ Cálculo automático de costo_total en RecursoProyecto
- ✅ Cálculo automático de variacion_presupuesto en ActaCierre

## Cobertura Total

**120+ tests** que cubren:
- ✅ Todos los modelos principales
- ✅ Todas las propiedades computadas
- ✅ Todos los endpoints de la API
- ✅ Todos los serializers
- ✅ Validaciones y restricciones
- ✅ Permisos de autenticación
- ✅ Casos límite y edge cases

## Mantenimiento

Al agregar nuevas funcionalidades:
1. Agregar tests en el archivo correspondiente
2. Seguir el patrón AAA
3. Usar fixtures existentes cuando sea posible
4. Documentar con docstring descriptivo
5. Ejecutar tests antes de commit

## Referencias

- [pytest Documentation](https://docs.pytest.org/)
- [Django REST Framework Testing](https://www.django-rest-framework.org/api-guide/testing/)
- [PMBOK 7th Edition](https://www.pmi.org/pmbok-guide-standards)
- Tests de referencia: `backend/apps/gestion_estrategica/organizacion/tests/`
