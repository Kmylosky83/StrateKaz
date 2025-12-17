# Refactorización del Sistema de Consecutivos

## Cambios Realizados

### 1. Modelo TipoDocumento (`models.py`)

**Cambios en CATEGORY_CHOICES:**
- ✅ Cambiado de 5 a 6 categorías:
  - `FINANCIERO` (Factura, Remisión, Cotización, NC, ND)
  - `COMPRAS` (Orden Compra, Requisición)
  - `CALIDAD_SST` (No Conformidad, AC, AP, AM, Incidente, Accidente, Auditoría)
  - `MAESTRO` (Código Cliente, Código Proveedor)
  - `MANTENIMIENTO` (Orden de Trabajo)
  - `OPERACIONAL` (Custom)

**Campos nuevos:**
- ✅ `prefijo_sugerido` (CharField, max_length=10, blank=True) - Prefijo sugerido para consecutivo
- ✅ `created_by` (ForeignKey a User, null=True) - Usuario que creó el tipo

**Métodos nuevos:**
- ✅ `puede_eliminar()` - Retorna tuple (bool, str) con validación
- ✅ `tiene_consecutivo` (property) - Verifica si tiene consecutivo configurado

**Índices agregados:**
- ✅ Index en `code`
- ✅ Index en `category`
- ✅ Index en `is_active`
- ✅ Index en `is_system`

---

### 2. Modelo ConsecutivoConfig (`models.py`)

**Campos ELIMINADOS:**
- ✅ `area` (ForeignKey) - ELIMINADO
- ✅ `include_area` (BooleanField) - ELIMINADO

**Métodos actualizados:**
- ✅ `format_number()` - Simplificado, sin lógica de área
- ✅ `get_ejemplo_formato()` - Nuevo método para obtener ejemplo
- ✅ `generate_next()` - Simplificado
- ✅ `obtener_siguiente_consecutivo()` - Sin parámetro `area_code`

**Formato simplificado:**
```
PREFIX-YYYY-00001
```

**Índices agregados:**
- ✅ Index en `is_active`
- ✅ Index en `tipo_documento`

---

### 3. Serializers (`serializers.py`)

**TipoDocumentoSerializer:**
- ✅ Agregado `prefijo_sugerido`
- ✅ Agregado `tiene_consecutivo` (property)
- ✅ Agregado `puede_eliminar_bool` (SerializerMethodField)
- ✅ Agregado `puede_eliminar_mensaje` (SerializerMethodField)
- ✅ Agregado `created_by_name`
- ✅ Método `create()` asigna `created_by`

**ConsecutivoConfigSerializer:**
- ✅ ELIMINADO `area`, `area_code`, `area_name`, `include_area`
- ✅ Agregado `tipo_documento_category`
- ✅ Usa `get_ejemplo_formato()` del modelo

**ConsecutivoChoicesSerializer:**
- ✅ ELIMINADO método `get_areas()`
- ✅ `get_tipos_documento()` incluye `category` y `prefijo_sugerido`

---

### 4. ViewSets (`views.py`)

**TipoDocumentoViewSet:**
- ✅ Filtro por `tipo` (sistema/custom) via query param
- ✅ `perform_create()` - Fuerza `is_system=False` y asigna `created_by`
- ✅ `update()` - Valida que tipos sistema solo permitan cambiar `is_active`
- ✅ `destroy()` - Usa método `puede_eliminar()`
- ✅ Action `sistema()` - Retorna solo tipos del sistema
- ✅ Action `custom()` - Retorna solo tipos custom

**ConsecutivoConfigViewSet:**
- ✅ ELIMINADO `area` de `filterset_fields`
- ✅ ELIMINADO `area` de `select_related()`
- ✅ `generate_by_type()` sin parámetro `area_code`

---

### 5. Migración (`0001_refactor_consecutivos.py`)

**Operaciones:**
1. ✅ AlterField en `category` con nuevas opciones
2. ✅ AddField `prefijo_sugerido` en TipoDocumento
3. ✅ AddField `created_by` en TipoDocumento
4. ✅ AlterField `is_system` help_text actualizado
5. ✅ AddIndex para TipoDocumento (4 índices)
6. ✅ RemoveField `area` de ConsecutivoConfig
7. ✅ RemoveField `include_area` de ConsecutivoConfig
8. ✅ AddIndex para ConsecutivoConfig (2 índices)

---

### 6. Comando Management (`init_tipos_documento.py`)

**17 tipos predefinidos del sistema:**

| Categoría | Código | Nombre | Prefijo |
|-----------|--------|--------|---------|
| FINANCIERO | FACTURA | Factura de Venta | FAC |
| FINANCIERO | REMISION | Remisión | REM |
| FINANCIERO | COTIZACION | Cotización | COT |
| FINANCIERO | NOTA_CREDITO | Nota Crédito | NC |
| FINANCIERO | NOTA_DEBITO | Nota Débito | ND |
| COMPRAS | ORDEN_COMPRA | Orden de Compra | OC |
| COMPRAS | REQUISICION | Requisición de Compra | REQ |
| CALIDAD_SST | NO_CONFORMIDAD | No Conformidad | NC |
| CALIDAD_SST | ACCION_CORRECTIVA | Acción Correctiva | AC |
| CALIDAD_SST | ACCION_PREVENTIVA | Acción Preventiva | AP |
| CALIDAD_SST | ACCION_MEJORA | Acción de Mejora | AM |
| CALIDAD_SST | INCIDENTE | Reporte de Incidente | INC |
| CALIDAD_SST | ACCIDENTE | Reporte de Accidente | ACC |
| CALIDAD_SST | AUDITORIA | Auditoría Interna | AUD |
| MAESTRO | CODIGO_CLIENTE | Código de Cliente | CLI |
| MAESTRO | CODIGO_PROVEEDOR | Código de Proveedor | PROV |
| MANTENIMIENTO | ORDEN_TRABAJO | Orden de Trabajo | OT |

**Características:**
- ✅ Usa `update_or_create()` para seguridad
- ✅ Marca todos como `is_system=True`
- ✅ No sobrescribe tipos custom (validación)
- ✅ Muestra estadísticas por categoría

---

## Pasos para Aplicar

### 1. Aplicar migración
```bash
cd backend
python manage.py migrate organizacion
```

### 2. Inicializar tipos predefinidos
```bash
python manage.py init_tipos_documento
```

### 3. Verificar datos
```bash
python manage.py shell
>>> from apps.gestion_estrategica.organizacion.models import TipoDocumento
>>> TipoDocumento.objects.filter(is_system=True).count()
17
>>> TipoDocumento.objects.values('category').annotate(count=Count('id'))
```

---

## Compatibilidad Backward

### ✅ Referencias en otros módulos
Los siguientes módulos ya usan el formato simplificado sin `area_code`:

- `apps/recolecciones/models.py:185` - ✅ `obtener_siguiente_consecutivo('RECOLECCION')`
- `apps/proveedores/models.py:410` - ✅ `obtener_siguiente_consecutivo(document_type)`
- `apps/proveedores/models.py:1084` - ✅ `obtener_siguiente_consecutivo('PRUEBA_ACIDEZ')`
- `apps/recepciones/models.py:449` - ✅ `obtener_siguiente_consecutivo('RECEPCION')`

**No se requieren cambios adicionales.**

---

## Endpoints Actualizados

### TipoDocumento
- `GET /api/organizacion/tipos-documento/` - Lista todos
- `GET /api/organizacion/tipos-documento/?tipo=sistema` - Solo sistema
- `GET /api/organizacion/tipos-documento/?tipo=custom` - Solo custom
- `GET /api/organizacion/tipos-documento/sistema/` - Action sistema
- `GET /api/organizacion/tipos-documento/custom/` - Action custom
- `POST /api/organizacion/tipos-documento/` - Crear tipo custom
- `PUT /api/organizacion/tipos-documento/{id}/` - Editar (validado)
- `DELETE /api/organizacion/tipos-documento/{id}/` - Eliminar (validado)

### ConsecutivoConfig
- `GET /api/organizacion/consecutivos/` - Lista todos
- `GET /api/organizacion/consecutivos/choices/` - Sin áreas
- `POST /api/organizacion/consecutivos/generate_by_type/` - Sin area_code
  ```json
  {
    "tipo_documento_code": "FACTURA"
  }
  ```

---

## Testing

### Casos de prueba
```python
# 1. No se pueden eliminar tipos sistema
tipo_sistema = TipoDocumento.objects.get(code='FACTURA')
puede, msg = tipo_sistema.puede_eliminar()
assert puede == False

# 2. No se pueden editar tipos sistema (excepto is_active)
response = client.patch(f'/api/organizacion/tipos-documento/{tipo_sistema.id}/', {
    'name': 'Nuevo nombre'
})
assert response.status_code == 400

# 3. Se pueden crear tipos custom
response = client.post('/api/organizacion/tipos-documento/', {
    'code': 'CUSTOM_DOC',
    'name': 'Documento Custom',
    'category': 'OPERACIONAL',
    'prefijo_sugerido': 'CD'
})
assert response.status_code == 201
assert response.data['is_system'] == False

# 4. Consecutivos sin área
config = ConsecutivoConfig.objects.create(
    tipo_documento=tipo_sistema,
    prefix='FAC',
    current_number=0
)
consecutivo = config.generate_next()
assert 'FAC-2025-00001' == consecutivo
```

---

## Beneficios

1. ✅ **Simplificación**: Eliminación de complejidad innecesaria (áreas en consecutivo)
2. ✅ **Estandarización**: 17 tipos universales predefinidos
3. ✅ **Flexibilidad**: Empresas pueden crear tipos custom
4. ✅ **Seguridad**: Tipos sistema protegidos contra edición/eliminación
5. ✅ **Performance**: Índices optimizados en campos clave
6. ✅ **Mantenibilidad**: Código más limpio y fácil de mantener

---

## Notas

- Los tipos custom creados por empresas permanecen intactos
- La migración es no destructiva (solo agrega campos y remueve área)
- El formato de consecutivos se simplifica pero mantiene flexibilidad
- Thread-safety mantenido en `get_next_number()`
