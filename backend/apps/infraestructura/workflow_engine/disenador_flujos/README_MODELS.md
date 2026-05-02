# Modelos del Diseñador de Flujos BPMN

## Descripción General

Este módulo implementa un sistema completo de diseño y gestión de flujos de trabajo tipo BPMN 2.0 con las siguientes características:

- **Versionamiento completo**: Múltiples versiones de una misma plantilla
- **Nodos BPMN estándar**: INICIO, FIN, TAREA, GATEWAY_PARALELO, GATEWAY_EXCLUSIVO, EVENTO
- **Transiciones condicionales**: Condiciones dinámicas en formato JSON
- **Formularios dinámicos**: Campos personalizables por tarea
- **Roles flexibles**: Asignación dinámica de usuarios a tareas

## Modelos Implementados

### 1. CategoriaFlujo

**Tabla**: `workflow_categoria_flujo`

Catálogo de categorías para organizar flujos de trabajo.

**Campos principales**:
- `codigo`: Código único (ej: APROBACIONES, HSEQ, OPERATIVOS)
- `nombre`: Nombre descriptivo
- `color`: Color en formato hexadecimal para UI
- `icono`: Nombre del icono para representación visual
- `orden`: Orden de visualización

**Validaciones**:
- Unique constraint: `(empresa_id, codigo)`
- Color debe empezar con `#`

### 2. PlantillaFlujo

**Tabla**: `workflow_plantilla_flujo`

Plantilla de flujo de trabajo con versionamiento completo.

**Campos principales**:
- `codigo`: Código único del flujo (ej: APROB_VACACIONES)
- `nombre`: Nombre descriptivo
- `version`: Número de versión (1, 2, 3...)
- `estado`: BORRADOR, ACTIVO, OBSOLETO, ARCHIVADO
- `xml_bpmn`: XML BPMN 2.0 (opcional)
- `json_diagram`: Configuración JSON para editor visual
- `tiempo_estimado_horas`: Tiempo estimado de ejecución
- `etiquetas`: Array JSON para clasificación

**Relaciones**:
- `categoria`: FK a CategoriaFlujo
- `plantilla_origen`: FK a sí mismo (versiones derivadas)

**Métodos especiales**:
- `crear_nueva_version(usuario)`: Crea nueva versión marcando la actual como OBSOLETO

**Validaciones**:
- Unique constraint: `(empresa_id, codigo, version)`
- Solo puede haber UNA versión ACTIVO por código

### 3. NodoFlujo

**Tabla**: `workflow_nodo_flujo`

Nodos individuales dentro de un flujo BPMN.

**Tipos de nodos**:
- `INICIO`: Punto de entrada del flujo
- `FIN`: Punto de finalización del flujo
- `TAREA`: Actividad que requiere acción del usuario
- `GATEWAY_PARALELO`: Divide/une flujos paralelos (AND)
- `GATEWAY_EXCLUSIVO`: Divide según condiciones (XOR)
- `EVENTO`: Eventos intermedios (temporizadores, mensajes)

**Campos principales**:
- `codigo`: Código único dentro de la plantilla
- `nombre`: Nombre descriptivo
- `posicion_x`, `posicion_y`: Coordenadas para editor visual
- `rol_asignado`: FK a RolFlujo (solo para TAREA)
- `tiempo_estimado_horas`: Tiempo estimado de ejecución
- `configuracion`: JSON con configuración específica del tipo

**Properties**:
- `es_inicio`, `es_fin`, `es_tarea`, `es_gateway`: Helpers booleanos

**Validaciones**:
- Unique constraint: `(plantilla, codigo)`
- Nodos TAREA DEBEN tener rol asignado
- Solo nodos TAREA pueden tener rol asignado

### 4. TransicionFlujo

**Tabla**: `workflow_transicion_flujo`

Transiciones (arcos) entre nodos con condiciones.

**Campos principales**:
- `nodo_origen`: FK a NodoFlujo (desde)
- `nodo_destino`: FK a NodoFlujo (hacia)
- `nombre`: Nombre descriptivo (ej: "Si es aprobado")
- `condicion`: JSON con condición de evaluación
- `prioridad`: Orden de evaluación (mayor número = mayor prioridad)

**Estructura de condiciones JSON**:

```json
// Condición simple
{
  "campo": "monto",
  "operador": "MAYOR",
  "valor": 1000000
}

// Condición compuesta (AND)
{
  "operador": "AND",
  "condiciones": [
    {"campo": "tipo", "operador": "IGUAL", "valor": "URGENTE"},
    {"campo": "monto", "operador": "MAYOR", "valor": 500000}
  ]
}

// Condición por defecto (vacío = siempre true)
{}
```

**Operadores soportados**:
- `IGUAL`, `DIFERENTE`
- `MAYOR`, `MENOR`, `MAYOR_IGUAL`, `MENOR_IGUAL`
- `CONTIENE`
- `ENTRE`: `{"min": 0, "max": 100}`

**Métodos especiales**:
- `evaluar_condicion(datos_contexto)`: Evalúa la condición con datos del flujo

**Validaciones**:
- Origen y destino deben pertenecer a la misma plantilla
- No puede conectar un nodo consigo mismo (A → A)

### 5. CampoFormulario

**Tabla**: `workflow_campo_formulario`

Campos de formularios dinámicos para nodos TAREA.

**Tipos de campos**:
- `TEXT`: Texto corto
- `TEXTAREA`: Texto largo
- `NUMBER`: Número
- `EMAIL`: Correo electrónico
- `DATE`, `DATETIME`: Fechas
- `SELECT`, `MULTISELECT`, `RADIO`: Selección
- `CHECKBOX`: Casilla de verificación
- `FILE`: Archivo adjunto

**Campos principales**:
- `nombre`: Nombre técnico (clave JSON)
- `etiqueta`: Texto mostrado al usuario
- `tipo`: Tipo de campo
- `orden`: Orden de visualización
- `requerido`: Si es obligatorio
- `valor_defecto`: Valor inicial
- `opciones`: JSON con opciones para SELECT/RADIO
- `validaciones`: JSON con reglas de validación
- `ayuda`: Texto de ayuda
- `placeholder`: Texto de ejemplo

**Estructura de opciones JSON**:

```json
[
  {"valor": "opcion1", "etiqueta": "Opción 1"},
  {"valor": "opcion2", "etiqueta": "Opción 2"}
]
```

**Estructura de validaciones JSON**:

```json
// Para números
{"min": 0, "max": 100}

// Para texto
{"min_length": 10, "max_length": 200}

// Para regex
{"pattern": "^[A-Z]{3}[0-9]{4}$"}

// Para fechas
{"min_date": "2024-01-01", "max_date": "2024-12-31"}
```

**Validaciones**:
- Unique constraint: `(nodo, nombre)`
- Solo se pueden agregar a nodos TAREA
- Campos SELECT/RADIO/MULTISELECT deben tener opciones

### 6. RolFlujo

**Tabla**: `workflow_rol_flujo`

Roles que pueden participar en flujos de trabajo.

**Tipos de asignación**:
- `ROL_SISTEMA`: Referencia a rol del sistema RBAC
- `CARGO`: Referencia a cargo organizacional
- `GRUPO`: Referencia a grupo de usuarios
- `USUARIO`: Usuario específico
- `DINAMICO`: Asignación basada en reglas

**Campos principales**:
- `codigo`: Código único (ej: GERENTE, APROBADOR_L1)
- `nombre`: Nombre descriptivo
- `tipo_asignacion`: Tipo de asignación
- `rol_sistema_id`, `cargo_id`, `grupo_usuarios_id`, `usuario_id`: Referencias según tipo
- `regla_asignacion`: JSON con regla para asignación dinámica
- `permite_delegacion`: Si se permite delegar tareas

**Estructura de reglas dinámicas JSON**:

```json
// Jefe inmediato del solicitante
{
  "tipo": "jefe_inmediato",
  "de": "solicitante"
}

// Por área específica
{
  "tipo": "cargo_area",
  "cargo": "GERENTE",
  "area": "VENTAS"
}

// Por monto (escalamiento)
{
  "tipo": "por_monto",
  "rangos": [
    {"min": 0, "max": 1000000, "cargo": "SUPERVISOR"},
    {"min": 1000001, "max": 5000000, "cargo": "GERENTE"}
  ]
}
```

**Métodos especiales**:
- `obtener_usuarios_asignados(contexto)`: Retorna QuerySet de usuarios asignados

**Validaciones**:
- Unique constraint: `(empresa_id, codigo)`
- Según `tipo_asignacion` debe tener el ID correspondiente
- Color debe empezar con `#`

## Multi-Tenancy

Todos los modelos incluyen:
- `empresa_id`: PositiveBigIntegerField con índice
- Validaciones para asegurar que entidades relacionadas pertenezcan a la misma empresa

## Auditoría

Todos los modelos incluyen:
- `created_at`: Fecha de creación (auto_now_add)
- `updated_at`: Fecha de actualización (auto_now)
- `created_by`: FK a User (quien creó el registro)

Modelos adicionales con campos de auditoría específicos:
- **PlantillaFlujo**: `activado_por`, `fecha_activacion`, `fecha_obsolescencia`

## Índices de Base de Datos

Cada modelo incluye índices optimizados para:
- Filtrado por `empresa_id`
- Búsqueda por `codigo`
- Filtrado por `estado` / `activo`
- Relaciones FK más consultadas

## Próximos Pasos

1. **Crear migraciones**:
   ```bash
   python manage.py makemigrations disenador_flujos
   python manage.py migrate
   ```

2. **Crear admin.py**: Registrar modelos en Django Admin

3. **Crear serializers.py**: Serializers DRF para API

4. **Crear views.py**: ViewSets para CRUD de plantillas

5. **Crear urls.py**: Rutas de API

6. **Frontend**: Editor visual BPMN con bpmn-js o similar

## Ejemplo de Uso

```python
from apps.infraestructura.workflow_engine.disenador_flujos.models import (
    CategoriaFlujo, PlantillaFlujo, NodoFlujo,
    TransicionFlujo, CampoFormulario, RolFlujo
)

# Crear categoría
categoria = CategoriaFlujo.objects.create(
    empresa_id=1,
    codigo='APROBACIONES',
    nombre='Aprobaciones',
    color='#3B82F6',
    created_by=usuario
)

# Crear plantilla
plantilla = PlantillaFlujo.objects.create(
    empresa_id=1,
    categoria=categoria,
    codigo='APROB_VACACIONES',
    nombre='Aprobación de Vacaciones',
    version=1,
    estado='BORRADOR',
    created_by=usuario
)

# Crear rol
rol_jefe = RolFlujo.objects.create(
    empresa_id=1,
    codigo='JEFE_INMEDIATO',
    nombre='Jefe Inmediato',
    tipo_asignacion='DINAMICO',
    regla_asignacion={'tipo': 'jefe_inmediato', 'de': 'solicitante'},
    created_by=usuario
)

# Crear nodos
nodo_inicio = NodoFlujo.objects.create(
    empresa_id=1,
    plantilla=plantilla,
    tipo='INICIO',
    codigo='INICIO',
    nombre='Inicio',
    created_by=usuario
)

nodo_tarea = NodoFlujo.objects.create(
    empresa_id=1,
    plantilla=plantilla,
    tipo='TAREA',
    codigo='APROBACION_JEFE',
    nombre='Aprobación del Jefe',
    rol_asignado=rol_jefe,
    tiempo_estimado_horas=24,
    created_by=usuario
)

# Crear campo de formulario
campo = CampoFormulario.objects.create(
    empresa_id=1,
    nodo=nodo_tarea,
    nombre='observaciones',
    etiqueta='Observaciones',
    tipo='TEXTAREA',
    orden=1,
    requerido=False,
    created_by=usuario
)

# Crear transición
transicion = TransicionFlujo.objects.create(
    empresa_id=1,
    plantilla=plantilla,
    nodo_origen=nodo_inicio,
    nodo_destino=nodo_tarea,
    nombre='Iniciar aprobación',
    created_by=usuario
)

# Crear nueva versión
nueva_version = plantilla.crear_nueva_version(usuario)
# Esto marca la v1 como OBSOLETO y crea v2 en BORRADOR
# con copia de todos los nodos, transiciones y campos
```

## Consideraciones de Diseño

1. **JSONField**: Se usa extensivamente para máxima flexibilidad sin cambios de schema
2. **Versionamiento**: Permite evolución de flujos sin romper instancias en ejecución
3. **Validaciones**: Implementadas en `clean()` para integridad de datos
4. **Cascade**: CASCADE en relaciones internas, PROTECT en referencias externas
5. **Soft delete**: No implementado, usar `estado='ARCHIVADO'` en PlantillaFlujo
