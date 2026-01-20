# Auditoría de Dependencias Hardcodeadas - Consecutivos y Unidades de Medida

**Fecha:** 2026-01-19
**Sistema:** StrateKaz - Sistema de Gestión Integral
**Módulo:** Gestión Estratégica > Configuración

---

## Resumen Ejecutivo

### Hallazgos Principales

**CRÍTICO:** Tanto el modelo `ConsecutivoConfig` como `UnidadMedida` tienen categorías **hardcodeadas** usando `choices` a nivel de modelo Django, lo que impide que los usuarios configuren categorías dinámicamente según su industria o necesidades específicas.

**Estado Actual:**
- ✅ Existe un modelo `Area` en `organizacion` que es dinámico y configurable
- ❌ Las categorías de Consecutivos y Unidades están hardcodeadas
- ❌ No hay relación entre las categorías hardcodeadas y el modelo `Area`
- ❌ No existe un modelo de "Categorías" genérico y reutilizable

---

## 1. Análisis de Consecutivos

### 1.1. Archivo Analizado
**Ubicación:** `backend/apps/gestion_estrategica/configuracion/models_consecutivos.py`

### 1.2. Categorías Hardcodeadas

```python
# Líneas 29-41 del archivo
CATEGORIA_CONSECUTIVO_CHOICES = [
    ('DOCUMENTOS', 'Documentos'),
    ('COMPRAS', 'Compras'),
    ('VENTAS', 'Ventas'),
    ('INVENTARIO', 'Inventario'),
    ('CONTABILIDAD', 'Contabilidad'),
    ('PRODUCCION', 'Producción'),
    ('CALIDAD', 'Calidad'),
    ('RRHH', 'Recursos Humanos'),
    ('SST', 'Seguridad y Salud'),
    ('AMBIENTAL', 'Gestión Ambiental'),
    ('GENERAL', 'General'),
]
```

### 1.3. Uso en el Modelo

```python
# Líneas 91-97 del archivo
categoria = models.CharField(
    max_length=20,
    choices=CATEGORIA_CONSECUTIVO_CHOICES,  # ❌ HARDCODED
    default='GENERAL',
    verbose_name='Categoría',
    help_text='Categoría para agrupar consecutivos'
)
```

### 1.4. Problemas Identificados

1. **Inflexibilidad:** Las categorías están fijas en el código
2. **No adaptable:** Diferentes industrias necesitan diferentes categorías
   - Ejemplo: Una empresa de logística no necesita "PRODUCCION" pero sí "TRANSPORTE"
   - Ejemplo: Una empresa de servicios no necesita "INVENTARIO" pero sí "PROYECTOS"
3. **No escalable:** Agregar una categoría requiere cambio de código y migración
4. **No multi-tenant friendly:** Todas las empresas comparten las mismas categorías

### 1.5. Consecutivos del Sistema Predefinidos

El archivo incluye 11 consecutivos predefinidos (líneas 419-530) que también dependen de estas categorías hardcodeadas.

---

## 2. Análisis de Unidades de Medida

### 2.1. Archivo Analizado
**Ubicación:** `backend/apps/gestion_estrategica/configuracion/models_unidades.py`

### 2.2. Categorías Hardcodeadas

```python
# Líneas 23-32 del archivo
CATEGORIA_UNIDAD_CHOICES = [
    ('MASA', 'Masa / Peso'),
    ('VOLUMEN', 'Volumen'),
    ('LONGITUD', 'Longitud'),
    ('AREA', 'Área'),
    ('CANTIDAD', 'Cantidad / Unidades'),
    ('TIEMPO', 'Tiempo'),
    ('CONTENEDOR', 'Contenedores / Embalaje'),
    ('OTRO', 'Otro'),
]
```

### 2.3. Uso en el Modelo

```python
# Líneas 85-91 del archivo
categoria = models.CharField(
    max_length=20,
    choices=CATEGORIA_UNIDAD_CHOICES,  # ❌ HARDCODED
    db_index=True,
    verbose_name='Categoría',
    help_text='Categoría de la unidad de medida'
)
```

### 2.4. Problemas Identificados

1. **Limitación por industria:** Las categorías actuales son genéricas
   - Falta: "ENERGIA" (kWh, MWh) para empresas industriales
   - Falta: "TEMPERATURA" (°C, °F) para empresas de almacenamiento
   - Falta: "PRESION" (PSI, Bar) para empresas de gas/petróleo
   - Falta: "VELOCIDAD" (km/h, m/s) para empresas de transporte

2. **No personalizable:** Una empresa de servicios podría querer categorías como:
   - "RENDIMIENTO" (transacciones/hora, usuarios/día)
   - "CALIDAD" (defectos por millón, nivel sigma)

3. **Validaciones acopladas:** El método `clean()` valida que la unidad base sea de la misma categoría (líneas 193-197), lo que limita conversiones cross-category que podrían ser válidas en ciertos contextos.

### 2.5. Unidades del Sistema Predefinidas

El método `cargar_unidades_sistema()` (líneas 402-609) define 15 unidades predefinidas que dependen de estas categorías.

---

## 3. Modelo de Áreas (Organización)

### 3.1. Archivo Analizado
**Ubicación:** `backend/apps/gestion_estrategica/organizacion/models.py`

### 3.2. Modelo Dinámico Existente

```python
class Area(AuditModel, SoftDeleteModel, OrderedModel):
    """
    Modelo para gestionar áreas/departamentos de la organización.

    Estructura jerárquica que permite definir la estructura organizacional
    con centros de costo y responsables asignados.
    """
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    cost_center = models.CharField(max_length=50, blank=True, null=True)
    manager = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL)
    icon = models.CharField(max_length=50, default='Building2')
    color = models.CharField(max_length=20, default='purple')
```

### 3.3. Características

✅ **Completamente dinámico:** Las áreas se crean desde la UI
✅ **Jerárquico:** Soporte para parent/child
✅ **Multi-tenant compatible:** Puede filtrar por empresa
✅ **Personalizable:** Icon, color, descripción
✅ **Auditable:** Hereda de AuditModel

### 3.4. ¿Por qué NO se usa para Consecutivos/Unidades?

**NO EXISTE RELACIÓN ACTUAL** entre:
- `ConsecutivoConfig.categoria` → No es FK a `Area`
- `UnidadMedida.categoria` → No es FK a `Area`

Son sistemas completamente independientes.

---

## 4. Modelos del Sistema (Core)

### 4.1. Archivo Analizado
**Ubicación:** `backend/apps/core/models/models_system_modules.py`

### 4.2. SystemModule - También usa Categorías Hardcodeadas

```python
CATEGORY_CHOICES = [
    ('ESTRATEGICO', 'Nivel Estrategico'),
    ('MOTOR', 'Motores del Sistema'),
    ('INTEGRAL', 'Gestion Integral'),
    ('MISIONAL', 'Nivel Misional'),
    ('APOYO', 'Nivel de Apoyo'),
    ('INTELIGENCIA', 'Inteligencia de Negocio'),
]

category = models.CharField(
    max_length=20,
    choices=CATEGORY_CHOICES,  # ❌ HARDCODED
    db_index=True,
    verbose_name='Categoria'
)
```

**Observación:** El sistema tiene un patrón de usar categorías hardcodeadas en varios modelos.

---

## 5. Búsqueda de Modelos de Categorías

### 5.1. Búsqueda Realizada

Se buscaron los siguientes patrones en todo el backend:

```bash
# Búsqueda de clases Categoria/Category
class Categoria
class Category
class CategoriaDocumento
class CategoriaConsecutivo
class CategoriaUnidad
class TipoDocumento
class AreaTrabajo
```

### 5.2. Resultado

**NO SE ENCONTRÓ** ningún modelo genérico de categorías reutilizable.

### 5.3. Hallazgos Adicionales

Se encontraron categorías hardcodeadas en otros módulos:

1. **Valores Vividos** (identidad):
   ```python
   CATEGORIA_ACCION_CHOICES = [...]
   ```

2. **Iconos** (configuración):
   ```python
   ICON_CATEGORY_CHOICES = [...]
   ```

3. **Revisión por Dirección**:
   ```python
   class CategoriaISO(models.TextChoices):
   ```

**Patrón:** El sistema tiene múltiples lugares con categorías hardcodeadas.

---

## 6. Impacto y Consecuencias

### 6.1. Impacto Actual

| Aspecto | Impacto | Severidad |
|---------|---------|-----------|
| **Flexibilidad** | Categorías fijas limitan adaptación a diferentes industrias | 🔴 ALTA |
| **Multi-tenancy** | Todas las empresas comparten las mismas categorías | 🔴 ALTA |
| **Escalabilidad** | Agregar categorías requiere código + migración | 🟡 MEDIA |
| **Mantenibilidad** | Código acoplado, difícil de extender | 🟡 MEDIA |
| **UX** | Usuario no puede personalizar su sistema | 🔴 ALTA |
| **Internacionalización** | Categorías en español, difícil i18n | 🟡 MEDIA |

### 6.2. Casos de Uso Bloqueados

#### Ejemplo 1: Empresa de Logística
**Necesita:**
- Consecutivos: TRANSPORTE, RUTAS, MANIFIESTOS, GUIAS
- Unidades: PALLETS, CONTENEDORES_20FT, CONTENEDORES_40FT, BULTOS

**Estado actual:** ❌ No puede crear estas categorías

#### Ejemplo 2: Empresa de Servicios IT
**Necesita:**
- Consecutivos: TICKETS, PROYECTOS, SPRINTS, RELEASES
- Unidades: STORY_POINTS, USUARIOS_ACTIVOS, TRANSACCIONES_SEG

**Estado actual:** ❌ No puede crear estas categorías

#### Ejemplo 3: Empresa de Alimentos
**Necesita:**
- Unidades: TEMPERATURA (°C), HUMEDAD (%), pH, GRADOS_BRIX

**Estado actual:** ❌ No puede crear estas categorías

### 6.3. Problemas de Migración

Si se cambia de hardcoded a dinámico:

1. **Migración de datos:** Convertir strings a ForeignKeys
2. **Datos existentes:** Crear registros de categorías para datos actuales
3. **Serializers:** Actualizar todos los serializers que usan `categoria_display`
4. **Frontend:** Actualizar componentes que dependen de choices hardcodeadas
5. **Validaciones:** Actualizar todas las validaciones que asumen categorías fijas

---

## 7. Propuesta de Solución

### 7.1. Opción 1: Usar el Modelo Area Existente (Más Rápido)

**Concepto:** Relacionar categorías con Areas funcionales

```python
class ConsecutivoConfig(AuditModel, SoftDeleteModel):
    # ANTES:
    # categoria = models.CharField(
    #     max_length=20,
    #     choices=CATEGORIA_CONSECUTIVO_CHOICES,
    #     default='GENERAL',
    # )

    # DESPUÉS:
    area_funcional = models.ForeignKey(
        'organizacion.Area',
        on_delete=models.PROTECT,
        null=True,  # Para migración
        blank=True,
        related_name='consecutivos',
        verbose_name='Área Funcional',
        help_text='Área o categoría a la que pertenece este consecutivo'
    )

    # Mantener campo legacy para migración
    categoria_legacy = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        editable=False
    )
```

**Ventajas:**
- ✅ Reutiliza modelo existente
- ✅ Ya tiene UI en el frontend
- ✅ Ya es multi-tenant
- ✅ Menos código nuevo

**Desventajas:**
- ❌ `Area` está pensado para estructura organizacional, no categorías de datos
- ❌ Semántica incorrecta (un consecutivo no "pertenece" a un área)
- ❌ Confusión de conceptos

### 7.2. Opción 2: Crear Modelo CategoriaConsecutivo (Específico)

```python
class CategoriaConsecutivo(AuditModel, SoftDeleteModel):
    """Categorías dinámicas para consecutivos"""
    codigo = models.CharField(max_length=20, db_index=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, default='Folder')
    color = models.CharField(max_length=20, default='gray')
    orden = models.IntegerField(default=0)
    empresa_id = models.PositiveBigIntegerField(db_index=True)
    es_sistema = models.BooleanField(default=False)

    class Meta:
        db_table = 'configuracion_categoria_consecutivo'
        unique_together = [['empresa_id', 'codigo']]
        ordering = ['orden', 'nombre']

class ConsecutivoConfig(AuditModel, SoftDeleteModel):
    categoria = models.ForeignKey(
        'CategoriaConsecutivo',
        on_delete=models.PROTECT,
        related_name='consecutivos'
    )
```

**Ventajas:**
- ✅ Semántica correcta
- ✅ Personalizable por empresa
- ✅ Migración más controlada

**Desventajas:**
- ❌ Más código
- ❌ Nueva tabla en BD
- ❌ Nueva UI necesaria

### 7.3. Opción 3: Modelo Genérico TipoCategoria (Reutilizable)

```python
class TipoCategoria(models.Model):
    """Tipos de categorías en el sistema"""
    codigo = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'core_tipo_categoria'

class Categoria(AuditModel, SoftDeleteModel):
    """Categorías dinámicas multi-propósito"""
    tipo = models.ForeignKey(
        'TipoCategoria',
        on_delete=models.CASCADE,
        related_name='categorias',
        help_text='Tipo: CONSECUTIVO, UNIDAD_MEDIDA, DOCUMENTO, etc.'
    )
    codigo = models.CharField(max_length=20, db_index=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, default='Folder')
    color = models.CharField(max_length=20, default='gray')
    orden = models.IntegerField(default=0)
    empresa_id = models.PositiveBigIntegerField(db_index=True)
    es_sistema = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'core_categoria'
        unique_together = [['empresa_id', 'tipo', 'codigo']]
        ordering = ['tipo', 'orden', 'nombre']

# Uso:
class ConsecutivoConfig(AuditModel, SoftDeleteModel):
    categoria = models.ForeignKey(
        'core.Categoria',
        on_delete=models.PROTECT,
        limit_choices_to={'tipo__codigo': 'CONSECUTIVO'},
        related_name='consecutivos'
    )

class UnidadMedida(AuditModel, SoftDeleteModel):
    categoria = models.ForeignKey(
        'core.Categoria',
        on_delete=models.PROTECT,
        limit_choices_to={'tipo__codigo': 'UNIDAD_MEDIDA'},
        related_name='unidades'
    )
```

**Ventajas:**
- ✅ Máxima reutilización
- ✅ DRY (Don't Repeat Yourself)
- ✅ Un solo lugar para gestionar categorías
- ✅ Extensible para futuros módulos

**Desventajas:**
- ❌ Mayor complejidad inicial
- ❌ Más abstracto
- ❌ Requiere más planning

---

## 8. Recomendación

### 8.1. Recomendación Inmediata: Opción 2

**Crear modelos específicos** `CategoriaConsecutivo` y `CategoriaUnidad` porque:

1. ✅ **Semántica clara:** Cada concepto tiene su modelo
2. ✅ **Migración segura:** Más fácil de controlar y testear
3. ✅ **Menos acoplamiento:** No mezcla conceptos organizacionales con categorías de datos
4. ✅ **Mejor UX:** UI específica para cada tipo de categoría

### 8.2. Recomendación a Largo Plazo: Opción 3

**Refactorizar hacia modelo genérico** cuando se detecten más casos de categorías hardcodeadas en otros módulos.

---

## 9. Plan de Migración (Opción 2)

### 9.1. Fase 1: Crear Modelos de Categorías

**Archivo:** `backend/apps/gestion_estrategica/configuracion/models_categorias.py`

```python
from django.db import models
from apps.core.base_models import AuditModel, SoftDeleteModel

class CategoriaConsecutivo(AuditModel, SoftDeleteModel):
    """Categorías dinámicas para consecutivos"""
    codigo = models.CharField(
        max_length=20,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de la categoría (ej: COMPRAS, SST)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo de la categoría'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    icon = models.CharField(
        max_length=50,
        default='Folder',
        verbose_name='Icono',
        help_text='Icono Lucide'
    )
    color = models.CharField(
        max_length=20,
        default='gray',
        verbose_name='Color'
    )
    orden = models.IntegerField(
        default=0,
        verbose_name='Orden'
    )
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID'
    )
    es_sistema = models.BooleanField(
        default=False,
        verbose_name='Es del Sistema',
        help_text='Categoría predefinida del sistema'
    )

    class Meta:
        db_table = 'configuracion_categoria_consecutivo'
        verbose_name = 'Categoría de Consecutivo'
        verbose_name_plural = 'Categorías de Consecutivos'
        unique_together = [['empresa_id', 'codigo']]
        ordering = ['orden', 'nombre']
        indexes = [
            models.Index(fields=['empresa_id', 'is_active']),
            models.Index(fields=['codigo']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

class CategoriaUnidad(AuditModel, SoftDeleteModel):
    """Categorías dinámicas para unidades de medida"""
    codigo = models.CharField(
        max_length=20,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de la categoría (ej: MASA, VOLUMEN)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo de la categoría'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    icon = models.CharField(
        max_length=50,
        default='Ruler',
        verbose_name='Icono'
    )
    color = models.CharField(
        max_length=20,
        default='blue',
        verbose_name='Color'
    )
    orden = models.IntegerField(
        default=0,
        verbose_name='Orden'
    )
    # Sin empresa_id: las categorías de unidades son globales
    es_sistema = models.BooleanField(
        default=False,
        verbose_name='Es del Sistema'
    )

    class Meta:
        db_table = 'configuracion_categoria_unidad'
        verbose_name = 'Categoría de Unidad'
        verbose_name_plural = 'Categorías de Unidades'
        unique_together = [['codigo']]
        ordering = ['orden', 'nombre']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"
```

### 9.2. Fase 2: Migración Django

**Archivo:** `backend/apps/gestion_estrategica/configuracion/migrations/000X_add_categorias_dinamicas.py`

```python
from django.db import migrations, models
import django.db.models.deletion

def crear_categorias_iniciales(apps, schema_editor):
    """Migración de datos: crear categorías desde choices hardcodeados"""

    # Crear categorías de consecutivos
    CategoriaConsecutivo = apps.get_model('configuracion', 'CategoriaConsecutivo')
    consecutivo_choices = [
        ('DOCUMENTOS', 'Documentos', 'FileText', 'purple'),
        ('COMPRAS', 'Compras', 'ShoppingCart', 'blue'),
        ('VENTAS', 'Ventas', 'TrendingUp', 'green'),
        ('INVENTARIO', 'Inventario', 'Package', 'orange'),
        ('CONTABILIDAD', 'Contabilidad', 'Calculator', 'indigo'),
        ('PRODUCCION', 'Producción', 'Factory', 'red'),
        ('CALIDAD', 'Calidad', 'Award', 'yellow'),
        ('RRHH', 'Recursos Humanos', 'Users', 'pink'),
        ('SST', 'Seguridad y Salud', 'Shield', 'red'),
        ('AMBIENTAL', 'Gestión Ambiental', 'Leaf', 'green'),
        ('GENERAL', 'General', 'Folder', 'gray'),
    ]

    for codigo, nombre, icon, color in consecutivo_choices:
        CategoriaConsecutivo.objects.get_or_create(
            codigo=codigo,
            empresa_id=1,  # Empresa por defecto
            defaults={
                'nombre': nombre,
                'icon': icon,
                'color': color,
                'es_sistema': True,
                'is_active': True,
            }
        )

    # Crear categorías de unidades
    CategoriaUnidad = apps.get_model('configuracion', 'CategoriaUnidad')
    unidad_choices = [
        ('MASA', 'Masa / Peso', 'Weight', 'blue'),
        ('VOLUMEN', 'Volumen', 'Container', 'cyan'),
        ('LONGITUD', 'Longitud', 'Ruler', 'green'),
        ('AREA', 'Área', 'Maximize', 'yellow'),
        ('CANTIDAD', 'Cantidad / Unidades', 'Hash', 'purple'),
        ('TIEMPO', 'Tiempo', 'Clock', 'orange'),
        ('CONTENEDOR', 'Contenedores / Embalaje', 'Package', 'brown'),
        ('OTRO', 'Otro', 'MoreHorizontal', 'gray'),
    ]

    for codigo, nombre, icon, color in unidad_choices:
        CategoriaUnidad.objects.get_or_create(
            codigo=codigo,
            defaults={
                'nombre': nombre,
                'icon': icon,
                'color': color,
                'es_sistema': True,
                'is_active': True,
            }
        )

def migrar_consecutivos_a_categorias(apps, schema_editor):
    """Migrar consecutivos existentes a usar ForeignKey"""
    ConsecutivoConfig = apps.get_model('configuracion', 'ConsecutivoConfig')
    CategoriaConsecutivo = apps.get_model('configuracion', 'CategoriaConsecutivo')

    for consecutivo in ConsecutivoConfig.objects.all():
        if consecutivo.categoria_legacy:
            try:
                categoria = CategoriaConsecutivo.objects.get(
                    codigo=consecutivo.categoria_legacy,
                    empresa_id=consecutivo.empresa_id
                )
                consecutivo.categoria = categoria
                consecutivo.save(update_fields=['categoria'])
            except CategoriaConsecutivo.DoesNotExist:
                # Crear categoría si no existe
                categoria = CategoriaConsecutivo.objects.create(
                    codigo=consecutivo.categoria_legacy,
                    nombre=consecutivo.categoria_legacy.replace('_', ' ').title(),
                    empresa_id=consecutivo.empresa_id,
                    es_sistema=False,
                    is_active=True,
                )
                consecutivo.categoria = categoria
                consecutivo.save(update_fields=['categoria'])

def migrar_unidades_a_categorias(apps, schema_editor):
    """Migrar unidades existentes a usar ForeignKey"""
    UnidadMedida = apps.get_model('configuracion', 'UnidadMedida')
    CategoriaUnidad = apps.get_model('configuracion', 'CategoriaUnidad')

    for unidad in UnidadMedida.objects.all():
        if unidad.categoria_legacy:
            try:
                categoria = CategoriaUnidad.objects.get(codigo=unidad.categoria_legacy)
                unidad.categoria = categoria
                unidad.save(update_fields=['categoria'])
            except CategoriaUnidad.DoesNotExist:
                # Crear categoría si no existe
                categoria = CategoriaUnidad.objects.create(
                    codigo=unidad.categoria_legacy,
                    nombre=unidad.categoria_legacy.replace('_', ' ').title(),
                    es_sistema=False,
                    is_active=True,
                )
                unidad.categoria = categoria
                unidad.save(update_fields=['categoria'])

class Migration(migrations.Migration):
    dependencies = [
        ('configuracion', '000X_previous_migration'),
    ]

    operations = [
        # 1. Crear modelos de categorías
        migrations.CreateModel(
            name='CategoriaConsecutivo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True)),
                # ... todos los campos
            ],
        ),
        migrations.CreateModel(
            name='CategoriaUnidad',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True)),
                # ... todos los campos
            ],
        ),

        # 2. Renombrar campo categoria a categoria_legacy en ambos modelos
        migrations.RenameField(
            model_name='consecutivoconfig',
            old_name='categoria',
            new_name='categoria_legacy',
        ),
        migrations.RenameField(
            model_name='unidadmedida',
            old_name='categoria',
            new_name='categoria_legacy',
        ),

        # 3. Agregar nuevos campos FK (nullable)
        migrations.AddField(
            model_name='consecutivoconfig',
            name='categoria',
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='consecutivos',
                to='configuracion.categoriaconsecutivo',
            ),
        ),
        migrations.AddField(
            model_name='unidadmedida',
            name='categoria',
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='unidades',
                to='configuracion.categoriaunidad',
            ),
        ),

        # 4. Ejecutar migraciones de datos
        migrations.RunPython(
            crear_categorias_iniciales,
            reverse_code=migrations.RunPython.noop,
        ),
        migrations.RunPython(
            migrar_consecutivos_a_categorias,
            reverse_code=migrations.RunPython.noop,
        ),
        migrations.RunPython(
            migrar_unidades_a_categorias,
            reverse_code=migrations.RunPython.noop,
        ),

        # 5. Hacer campos FK required (NOT NULL)
        migrations.AlterField(
            model_name='consecutivoconfig',
            name='categoria',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='consecutivos',
                to='configuracion.categoriaconsecutivo',
            ),
        ),
        migrations.AlterField(
            model_name='unidadmedida',
            name='categoria',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='unidades',
                to='configuracion.categoriaunidad',
            ),
        ),

        # 6. (Opcional) Eliminar campos legacy después de verificar
        # migrations.RemoveField(
        #     model_name='consecutivoconfig',
        #     name='categoria_legacy',
        # ),
        # migrations.RemoveField(
        #     model_name='unidadmedida',
        #     name='categoria_legacy',
        # ),
    ]
```

### 9.3. Fase 3: Actualizar Serializers

**Consecutivos:**
```python
# serializers_consecutivos.py
class ConsecutivoConfigSerializer(serializers.ModelSerializer):
    categoria_id = serializers.PrimaryKeyRelatedField(
        source='categoria',
        queryset=CategoriaConsecutivo.objects.filter(is_active=True),
        write_only=True
    )
    categoria = serializers.SerializerMethodField(read_only=True)

    def get_categoria(self, obj):
        return {
            'id': obj.categoria.id,
            'codigo': obj.categoria.codigo,
            'nombre': obj.categoria.nombre,
            'icon': obj.categoria.icon,
            'color': obj.categoria.color,
        }
```

**Unidades:**
```python
# serializers_unidades.py
class UnidadMedidaSerializer(serializers.ModelSerializer):
    categoria_id = serializers.PrimaryKeyRelatedField(
        source='categoria',
        queryset=CategoriaUnidad.objects.filter(is_active=True),
        write_only=True
    )
    categoria = serializers.SerializerMethodField(read_only=True)

    def get_categoria(self, obj):
        return {
            'id': obj.categoria.id,
            'codigo': obj.categoria.codigo,
            'nombre': obj.categoria.nombre,
            'icon': obj.categoria.icon,
            'color': obj.categoria.color,
        }
```

### 9.4. Fase 4: Crear APIs para Categorías

```python
# viewsets_categorias.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

class CategoriaConsecutivoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar categorías de consecutivos
    """
    queryset = CategoriaConsecutivo.objects.all()
    serializer_class = CategoriaConsecutivoSerializer

    def get_queryset(self):
        # Filtrar por empresa del usuario
        empresa_id = self.request.user.empresa_id
        return CategoriaConsecutivo.objects.filter(
            empresa_id=empresa_id,
            is_active=True
        )

    @action(detail=False, methods=['get'])
    def choices(self, request):
        """Endpoint para obtener categorías como choices"""
        categorias = self.get_queryset().order_by('orden', 'nombre')
        return Response({
            'categorias': [
                {
                    'value': cat.id,
                    'label': cat.nombre,
                    'codigo': cat.codigo,
                    'icon': cat.icon,
                    'color': cat.color,
                }
                for cat in categorias
            ]
        })

class CategoriaUnidadViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar categorías de unidades
    """
    queryset = CategoriaUnidad.objects.all()
    serializer_class = CategoriaUnidadSerializer

    def get_queryset(self):
        return CategoriaUnidad.objects.filter(is_active=True)

    @action(detail=False, methods=['get'])
    def choices(self, request):
        """Endpoint para obtener categorías como choices"""
        categorias = self.get_queryset().order_by('orden', 'nombre')
        return Response({
            'categorias': [
                {
                    'value': cat.id,
                    'label': cat.nombre,
                    'codigo': cat.codigo,
                    'icon': cat.icon,
                    'color': cat.color,
                }
                for cat in categorias
            ]
        })
```

### 9.5. Fase 5: Actualizar Frontend

**Tipos TypeScript:**
```typescript
// types/categorias.types.ts
export interface CategoriaConsecutivo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  icon: string;
  color: string;
  orden: number;
  es_sistema: boolean;
  is_active: boolean;
}

export interface CategoriaUnidad {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  icon: string;
  color: string;
  orden: number;
  es_sistema: boolean;
  is_active: boolean;
}
```

**API Hooks:**
```typescript
// hooks/useCategorias.ts
export const useCategorias = () => {
  const fetchCategoriasConsecutivo = async () => {
    const response = await api.get('/api/gestion-estrategica/configuracion/categorias-consecutivo/choices/');
    return response.data.categorias;
  };

  const fetchCategoriasUnidad = async () => {
    const response = await api.get('/api/gestion-estrategica/configuracion/categorias-unidad/choices/');
    return response.data.categorias;
  };

  return {
    fetchCategoriasConsecutivo,
    fetchCategoriasUnidad,
  };
};
```

**Componentes:**
```tsx
// components/ConsecutivoForm.tsx
const ConsecutivoForm = () => {
  const { fetchCategoriasConsecutivo } = useCategorias();
  const [categorias, setCategorias] = useState<CategoriaConsecutivo[]>([]);

  useEffect(() => {
    fetchCategoriasConsecutivo().then(setCategorias);
  }, []);

  return (
    <Select
      label="Categoría"
      options={categorias.map(cat => ({
        value: cat.id,
        label: cat.nombre,
        icon: cat.icon,
        color: cat.color,
      }))}
    />
  );
};
```

---

## 10. Estimación de Esfuerzo

| Fase | Tareas | Esfuerzo Estimado |
|------|--------|-------------------|
| **Fase 1: Modelos** | Crear `models_categorias.py` con 2 modelos | 2 horas |
| **Fase 2: Migración** | Escribir migración compleja con data migration | 4 horas |
| **Fase 3: Serializers** | Actualizar serializers existentes | 2 horas |
| **Fase 4: APIs** | Crear ViewSets y endpoints | 3 horas |
| **Fase 5: Frontend** | Actualizar tipos, hooks, componentes | 4 horas |
| **Testing** | Tests unitarios e integración | 4 horas |
| **QA** | Pruebas manuales y ajustes | 3 horas |
| **Documentación** | Actualizar docs y guías de usuario | 2 horas |
| **TOTAL** | - | **24 horas** (3 días) |

---

## 11. Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Pérdida de datos** | Baja | Alto | Backup completo antes de migración, migración reversible |
| **Inconsistencias** | Media | Medio | Validaciones en migración, script de verificación post-migración |
| **Breaking changes en API** | Alta | Alto | Versionado de API, deprecation warnings, periodo de transición |
| **Problemas de rendimiento** | Baja | Medio | Indexes en FKs, pruebas de carga |
| **Resistencia de usuarios** | Media | Bajo | Capacitación, documentación clara |

---

## 12. Conclusiones

### 12.1. Hallazgos Críticos

1. ✅ **Confirmado:** Las categorías están **100% hardcodeadas** en ambos modelos
2. ✅ **Identificado:** NO existe relación con el modelo `Area` dinámico existente
3. ✅ **Descubierto:** El patrón de categorías hardcodeadas se repite en múltiples módulos del sistema
4. ✅ **Validado:** NO existe un modelo genérico de categorías reutilizable

### 12.2. Impacto en el Negocio

- **Limitación de mercado:** El sistema no se puede adaptar a diferentes industrias sin cambios de código
- **Competitividad:** Sistemas competidores ofrecen configuración dinámica
- **Satisfacción del cliente:** Usuarios no pueden personalizar el sistema a sus necesidades

### 12.3. Próximos Pasos Recomendados

1. **Inmediato:** Revisar y aprobar la propuesta de solución (Opción 2)
2. **Corto plazo:** Implementar migración para Consecutivos y Unidades
3. **Mediano plazo:** Evaluar otros módulos con categorías hardcodeadas
4. **Largo plazo:** Considerar refactorización a modelo genérico (Opción 3)

---

## Anexos

### A. Archivos Analizados

1. `backend/apps/gestion_estrategica/configuracion/models_consecutivos.py` (531 líneas)
2. `backend/apps/gestion_estrategica/configuracion/models_unidades.py` (610 líneas)
3. `backend/apps/gestion_estrategica/organizacion/models.py` (144 líneas)
4. `backend/apps/core/models/models_system_modules.py` (581 líneas)
5. `backend/apps/gestion_estrategica/configuracion/serializers_consecutivos.py` (251 líneas)

### B. Categorías Hardcodeadas Identificadas

**Consecutivos (11):**
DOCUMENTOS, COMPRAS, VENTAS, INVENTARIO, CONTABILIDAD, PRODUCCION, CALIDAD, RRHH, SST, AMBIENTAL, GENERAL

**Unidades (8):**
MASA, VOLUMEN, LONGITUD, AREA, CANTIDAD, TIEMPO, CONTENEDOR, OTRO

**Módulos del Sistema (6):**
ESTRATEGICO, MOTOR, INTEGRAL, MISIONAL, APOYO, INTELIGENCIA

### C. Referencias

- Django Documentation: Model Field Choices → https://docs.djangoproject.com/en/5.0/ref/models/fields/#choices
- Django Documentation: ForeignKey → https://docs.djangoproject.com/en/5.0/ref/models/fields/#foreignkey
- Django Documentation: Data Migrations → https://docs.djangoproject.com/en/5.0/topics/migrations/#data-migrations

---

**Documento generado por:** Claude Code (Anthropic)
**Versión:** 1.0
**Fecha de generación:** 2026-01-19
