# Modelos Aspectos Ambientales - ISO 14001

## Resumen de Implementación

Se han implementado 5 modelos completos para el módulo de Aspectos Ambientales según ISO 14001:

### 1. CategoriaAspecto
**Catálogo global de categorías de aspectos ambientales**

- **Tabla**: `aspectos_amb_categoria`
- **Propósito**: Clasificación de aspectos ambientales según tipos (emisiones, vertimientos, residuos, etc.)
- **Campos principales**:
  - `codigo`: Código único de categoría
  - `tipo`: Tipo de aspecto (9 opciones: EMISION, VERTIMIENTO, RESIDUO, CONSUMO_RECURSO, etc.)
  - `nombre`: Nombre descriptivo
  - `descripcion`: Descripción detallada
  - `impactos_asociados`: Posibles impactos que genera
  - `requisitos_legales`: Normatividad colombiana aplicable (ej: Decreto 1076/2015)
  - `is_active`: Estado activo/inactivo

- **Multi-tenancy**: NO (catálogo global)
- **Auditoría**: created_at, updated_at

### 2. AspectoAmbiental
**Aspectos ambientales identificados con evaluación de significancia**

- **Tabla**: `aspectos_amb_aspecto`
- **Propósito**: Registro de aspectos ambientales con cálculo automático de significancia
- **Campos principales**:
  - **Identificación**:
    - `codigo`: Código único por empresa
    - `categoria`: FK a CategoriaAspecto
    - `proceso`: Proceso donde se identifica
    - `actividad`: Actividad específica
    - `descripcion_aspecto`: Descripción del aspecto

  - **Condiciones**:
    - `condicion_operacion`: NORMAL, ANORMAL, EMERGENCIA
    - `tiempo_verbo`: PASADO, PRESENTE, FUTURO

  - **Evaluación de Significancia (escala 1-5)**:
    - `frecuencia`: Frecuencia de ocurrencia
    - `severidad`: Severidad del impacto
    - `probabilidad`: Probabilidad de ocurrencia
    - `alcance`: Extensión del área afectada
    - `reversibilidad`: Capacidad de recuperación
    - `cumplimiento_legal`: Cumple normatividad (boolean)
    - `quejas_comunidad`: Ha generado quejas (boolean)

  - **Cálculos Automáticos**:
    - `valor_significancia`: Frecuencia × Severidad × Probabilidad + ajustes
    - `significancia`: NO_SIGNIFICATIVO, SIGNIFICATIVO, CRITICO (auto-calculado)

  - **Impactos**:
    - `descripcion_impacto`: Cambio ambiental resultante
    - `tipo_impacto`: NEGATIVO o POSITIVO

  - **Controles**:
    - `controles_actuales`: Medidas implementadas
    - `procedimientos_asociados`: Procedimientos relacionados
    - `areas_afectadas`: Ubicaciones afectadas
    - `requisito_legal_aplicable`: Normatividad específica

  - **Gestión**:
    - `estado`: BORRADOR, VIGENTE, EN_REVISION, OBSOLETO
    - `fecha_identificacion`: Fecha de identificación
    - `proxima_evaluacion`: Próxima fecha de evaluación

- **Fórmula de Significancia**:
  ```
  Base: frecuencia × severidad × probabilidad
  Ajustes:
    + 10 si alcance >= 4 (regional)
    + 10 si reversibilidad >= 4 (irreversible)
    + 50 si NO cumple legal
    + 25 si hay quejas de comunidad

  Rangos:
    < 50: No Significativo
    50-99: Significativo
    >= 100: Crítico
  ```

- **Multi-tenancy**: SÍ (empresa_id)
- **Auditoría**: created_at, updated_at, created_by
- **Índices**: empresa_id+estado, empresa_id+significancia, empresa_id+proceso, categoria+significancia

### 3. ImpactoAmbiental
**Impactos específicos derivados de aspectos ambientales**

- **Tabla**: `aspectos_amb_impacto`
- **Propósito**: Permite registrar múltiples impactos por cada aspecto
- **Campos principales**:
  - `aspecto`: FK a AspectoAmbiental (CASCADE)
  - `codigo`: Código del impacto (único por aspecto)
  - `nombre`: Nombre del impacto
  - `descripcion`: Cambio ambiental resultante
  - `componente_ambiental`: AIRE, AGUA, SUELO, FLORA, FAUNA, PAISAJE, SOCIAL, ECONOMICO
  - `tipo_impacto`: NEGATIVO, POSITIVO
  - `magnitud`: MUY_BAJA a MUY_ALTA
  - `duracion`: TEMPORAL, MEDIO_PLAZO, PERMANENTE
  - `extension`: PUNTUAL, LOCAL, REGIONAL, NACIONAL
  - `valor_cuantitativo`: Valor numérico (ej: kg CO2)
  - `unidad_medida`: Unidad de medición
  - `medidas_control`: Acciones para prevenir/mitigar

- **Multi-tenancy**: SÍ (empresa_id)
- **Auditoría**: created_at, updated_at, created_by
- **Índices**: empresa_id+componente_ambiental, tipo_impacto+magnitud

### 4. ProgramaAmbiental
**Programas de gestión ambiental (ISO 14001 Cláusula 6.1.4)**

- **Tabla**: `aspectos_amb_programa`
- **Propósito**: Planificación de acciones para abordar aspectos significativos
- **Campos principales**:
  - **Identificación**:
    - `codigo`: Código único por empresa
    - `nombre`: Nombre del programa
    - `objetivo`: Qué se pretende lograr
    - `tipo_programa`: PREVENCION, MITIGACION, COMPENSACION, MEJORAMIENTO, CUMPLIMIENTO

  - **Relaciones**:
    - `aspectos_relacionados`: ManyToMany con AspectoAmbiental
    - `responsable`: Usuario responsable
    - `equipo_apoyo`: ManyToMany con usuarios

  - **Planificación**:
    - `fecha_inicio`: Fecha de inicio planificada
    - `fecha_fin`: Fecha de fin planificada
    - `actividades`: Descripción de actividades
    - `metas`: Metas SMART
    - `indicadores_medicion`: Cómo se medirá
    - `presupuesto`: Presupuesto asignado
    - `recursos_necesarios`: Recursos requeridos

  - **Seguimiento**:
    - `estado`: PLANIFICADO, EN_EJECUCION, COMPLETADO, SUSPENDIDO, CANCELADO
    - `porcentaje_avance`: 0-100%
    - `observaciones`: Notas del seguimiento

  - **Resultados**:
    - `fecha_completado`: Fecha real de completación
    - `resultados_obtenidos`: Descripción de logros
    - `eficacia`: NO_EVALUADO, EFICAZ, PARCIALMENTE_EFICAZ, NO_EFICAZ

- **Métodos**:
  - `clean()`: Valida que fecha_fin >= fecha_inicio
  - `get_duracion_dias()`: Calcula duración en días
  - `is_vencido()`: Verifica si está vencido

- **Multi-tenancy**: SÍ (empresa_id)
- **Auditoría**: created_at, updated_at, created_by
- **Índices**: empresa_id+estado, responsable+estado, fecha_inicio+fecha_fin

### 5. MonitoreoAmbiental
**Registros de monitoreo ambiental (ISO 14001 Cláusula 9.1)**

- **Tabla**: `aspectos_amb_monitoreo`
- **Propósito**: Seguimiento, medición y análisis de desempeño ambiental
- **Campos principales**:
  - **Identificación**:
    - `codigo`: Código único por empresa
    - `tipo_monitoreo`: 11 tipos (EMISION_ATMOSFERICA, CALIDAD_AGUA, VERTIMIENTO, RUIDO, RESIDUOS, etc.)
    - `aspecto_relacionado`: FK a AspectoAmbiental (opcional)
    - `programa_relacionado`: FK a ProgramaAmbiental (opcional)

  - **Ubicación y Tiempo**:
    - `ubicacion`: Lugar del monitoreo
    - `fecha_monitoreo`: Fecha de ejecución
    - `hora_monitoreo`: Hora de ejecución
    - `frecuencia_requerida`: DIARIA, SEMANAL, MENSUAL, TRIMESTRAL, etc.

  - **Mediciones**:
    - `parametro_medido`: Parámetro evaluado (pH, DBO, PM, dB(A), etc.)
    - `valor_medido`: Valor obtenido
    - `unidad_medida`: Unidad de medición
    - `valor_referencia`: Límite legal o meta

  - **Cumplimiento**:
    - `cumplimiento`: CUMPLE, NO_CUMPLE, NO_APLICA
    - `normatividad_aplicable`: Resolución/Decreto que establece límite

  - **Metodología**:
    - `metodo_medicion`: Método o norma técnica
    - `equipo_utilizado`: Equipo de medición
    - `responsable_medicion`: Usuario que realizó

  - **Laboratorio (opcional)**:
    - `laboratorio_externo`: Nombre del laboratorio acreditado
    - `numero_informe`: Número de informe de laboratorio

  - **Acciones**:
    - `observaciones`: Observaciones generales
    - `acciones_tomadas`: Acciones correctivas si no cumple

  - **Evidencias**:
    - `evidencia_fotografica`: URLs de fotos
    - `archivo_adjunto`: Ruta del informe/certificado

- **Métodos**:
  - `get_porcentaje_cumplimiento()`: Calcula % respecto a valor de referencia
  - `requiere_accion_correctiva()`: Determina si requiere acción

- **Multi-tenancy**: SÍ (empresa_id)
- **Auditoría**: created_at, updated_at, created_by
- **Índices**: empresa_id+tipo_monitoreo, empresa_id+fecha_monitoreo, aspecto_relacionado+fecha_monitoreo, cumplimiento

## Características Comunes

### Multi-tenancy
- Todos los modelos (excepto CategoriaAspecto) incluyen `empresa_id` para aislamiento de datos
- Índices compuestos con empresa_id para optimizar consultas

### Auditoría
- `created_at`: Timestamp de creación (auto_now_add=True)
- `updated_at`: Timestamp de última actualización (auto_now=True)
- `created_by`: Usuario que creó el registro (opcional en algunos modelos)

### Nomenclatura
- Tablas: Prefijo `aspectos_amb_` para fácil identificación
- Campos: `verbose_name` en español para admin de Django
- Help text: Documentación en línea para usuarios

### Validaciones
- `MinValueValidator` y `MaxValueValidator` para campos numéricos
- Método `clean()` para validaciones personalizadas (ej: fechas)
- Choices predefinidos para campos de selección

### Índices
- Índices en `empresa_id` para queries multi-tenant eficientes
- Índices compuestos para consultas comunes
- unique_together donde aplica (empresa_id + codigo)

## Normatividad Colombiana Aplicable

- **Decreto 1076/2015**: Sector Ambiente y Desarrollo Sostenible
- **Resolución 0631/2015**: Parámetros de vertimientos
- **Resolución 2254/2017**: Niveles de ruido ambiental
- **Decreto 1609/2002**: Transporte de mercancías peligrosas
- **Resolución 1362/2007**: Registro de generadores de residuos peligrosos

## Próximos Pasos

1. Crear migraciones: `python manage.py makemigrations aspectos_ambientales`
2. Aplicar migraciones: `python manage.py migrate`
3. Registrar modelos en `admin.py`
4. Crear serializers en `serializers.py`
5. Crear viewsets en `views.py`
6. Configurar URLs en `urls.py`
7. Agregar permisos en el sistema RBAC
8. Crear fixtures con datos iniciales de CategoriaAspecto

## Notas Técnicas

- Los cálculos de significancia se ejecutan automáticamente en el método `save()` de AspectoAmbiental
- Las relaciones ManyToMany permiten flexibilidad (un programa puede atender múltiples aspectos)
- Las validaciones de fecha en ProgramaAmbiental previenen errores de datos
- Los métodos helper facilitan cálculos y reportes (ej: get_porcentaje_cumplimiento)
