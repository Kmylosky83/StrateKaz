# Plan de Eliminación de PoliticaIntegral - Backend

**Versión:** 1.0
**Fecha:** 2026-01-12
**Autor:** Claude Code
**Estado:** Pendiente de Implementación

---

## Resumen Ejecutivo

Este documento detalla el plan para eliminar el modelo `PoliticaIntegral` del backend, consolidando toda la funcionalidad de políticas en el modelo `PoliticaEspecifica`. El objetivo es simplificar la arquitectura y alinear el backend con el frontend, que ya consume un modelo unificado.

### Métricas del Impacto

| Métrica | Valor |
|---------|-------|
| Archivos afectados | 15-19 |
| Líneas a eliminar | ~400 |
| Líneas a modificar | ~200 |
| Migraciones nuevas | 1 (3 partes) |
| Complejidad | Media |
| Tiempo estimado | 8-10 horas |
| Riesgo | Bajo |

---

## Tabla de Contenidos

1. [Análisis de Dependencias](#1-análisis-de-dependencias)
2. [Cambios en el Modelo de Datos](#2-cambios-en-el-modelo-de-datos)
3. [Plan de Migración de Datos](#3-plan-de-migración-de-datos)
4. [Fases de Implementación](#4-fases-de-implementación)
5. [Cambios por Archivo](#5-cambios-por-archivo)
6. [Impacto en API/Endpoints](#6-impacto-en-apiendpoints)
7. [Testing y Validación](#7-testing-y-validación)
8. [Checklist de Ejecución](#8-checklist-de-ejecución)

---

## 1. Análisis de Dependencias

### 1.1 Modelo PoliticaIntegral (a eliminar)

**Ubicación:** `backend/apps/gestion_estrategica/identidad/models.py:384-524`

```python
class PoliticaIntegral(AuditModel, SoftDeleteModel, OrderedModel):
    identity = FK(CorporateIdentity)
    version = CharField(max_length=20)
    title = CharField(max_length=200)
    content = TextField()
    status = CharField(choices=POLICY_STATUS_CHOICES)
    effective_date = DateField(null=True)
    expiry_date = DateField(null=True)
    review_date = DateField(null=True)
    signed_by = FK(User, null=True)
    signed_at = DateTimeField(null=True)
    signature_hash = CharField(max_length=255, null=True)
    applicable_standards = JSONField(default=list)
    document_file = FileField()
    change_reason = TextField(null=True)
```

### 1.2 Dependencias Directas

| Archivo | Tipo | Líneas | Descripción |
|---------|------|--------|-------------|
| `models_workflow_firmas.py` | FK | 188-195 | `ProcesoFirmaPolitica.politica_integral` |
| `serializers.py` | Serializer | 176-248 | 4 serializers de PoliticaIntegral |
| `views.py` | ViewSet | 382-498 | `PoliticaIntegralViewSet` |
| `urls.py` | Router | 48 | Ruta `politicas-integrales` |
| `views_export.py` | Endpoints | 70-130 | Export PDF/DOCX |
| `exporters/pdf_generator.py` | Generador | 380-410 | `generate_politica_integral_pdf()` |
| `exporters/docx_generator.py` | Generador | 403-430 | `generate_politica_integral_docx()` |

### 1.3 ProcesoFirmaPolitica - Estructura Polimórfica Actual

**Ubicación:** `backend/apps/gestion_estrategica/identidad/models_workflow_firmas.py:174-373`

```python
class ProcesoFirmaPolitica(TimestampedModel):
    # Polimorfismo: exactamente una política
    tipo_politica = CharField(choices=[('INTEGRAL', ...), ('ESPECIFICA', ...)])
    politica_integral = FK(PoliticaIntegral, null=True)     # A ELIMINAR
    politica_especifica = FK(PoliticaEspecifica, null=True) # A CONSERVAR

    def clean(self):
        # Validación: solo una política a la vez
        if self.politica_integral and self.politica_especifica:
            raise ValidationError('Solo puede asociarse a una política')
```

---

## 2. Cambios en el Modelo de Datos

### 2.1 Campos a Agregar en PoliticaEspecifica

| Campo | Tipo | De PoliticaIntegral | Propósito |
|-------|------|---------------------|-----------|
| `signature_hash` | CharField(255) | Sí | Hash de firma digital |
| `expiry_date` | DateField | Sí | Fecha de vencimiento |
| `change_reason` | TextField | Sí | Motivo del cambio de versión |
| `is_integral_policy` | BooleanField | No (nuevo) | Flag para identificar integrales |

### 2.2 Comparación de Campos

| Campo | PoliticaIntegral | PoliticaEspecifica | Acción |
|-------|------------------|-------------------|--------|
| identity | ✓ | ✓ | Mantener |
| version | ✓ | ✓ | Mantener |
| title | ✓ | ✓ | Mantener |
| content | ✓ | ✓ | Mantener |
| status | ✓ | ✓ | Mantener |
| effective_date | ✓ | ✓ | Mantener |
| review_date | ✓ | ✓ | Mantener |
| document_file | ✓ | ✓ | Mantener |
| signed_by | ✓ | approved_by | Renombrar/Alias |
| signed_at | ✓ | approved_at | Renombrar/Alias |
| signature_hash | ✓ | ❌ | **AGREGAR** |
| expiry_date | ✓ | ❌ | **AGREGAR** |
| change_reason | ✓ | ❌ | **AGREGAR** |
| applicable_standards | ✓ | norma_iso | Usar FK existente |
| norma_iso | ❌ | ✓ | Mantener |
| area | ❌ | ✓ | Mantener |
| responsible | ❌ | ✓ | Mantener |
| code | ❌ | ✓ | Mantener |
| keywords | ❌ | ✓ | Mantener |

### 2.3 Cambios en ProcesoFirmaPolitica

**Antes:**
```python
class ProcesoFirmaPolitica:
    tipo_politica = CharField(...)        # ELIMINAR
    politica_integral = FK(...)           # ELIMINAR
    politica_especifica = FK(...)         # RENOMBRAR a 'politica'
```

**Después:**
```python
class ProcesoFirmaPolitica:
    politica = FK(PoliticaEspecifica, on_delete=CASCADE)
```

---

## 3. Plan de Migración de Datos

### 3.1 Migración de PoliticaIntegral → PoliticaEspecifica

```python
def migrate_politica_integral_to_especifica(apps, schema_editor):
    """
    Migra todos los registros de PoliticaIntegral a PoliticaEspecifica.
    Cada PoliticaIntegral se crea como PoliticaEspecifica con is_integral_policy=True.
    """
    PoliticaIntegral = apps.get_model('identidad', 'PoliticaIntegral')
    PoliticaEspecifica = apps.get_model('identidad', 'PoliticaEspecifica')
    TipoPolitica = apps.get_model('identidad', 'TipoPolitica')

    # Obtener o crear el tipo INTEGRAL
    tipo_integral, _ = TipoPolitica.objects.get_or_create(
        code='INTEGRAL',
        defaults={'name': 'Política Integral', 'orden': 1}
    )

    migrated_count = 0
    for pol_int in PoliticaIntegral.objects.all():
        # Crear PoliticaEspecifica equivalente
        PoliticaEspecifica.objects.create(
            identity=pol_int.identity,
            title=pol_int.title,
            content=pol_int.content,
            version=pol_int.version,
            status=pol_int.status,
            effective_date=pol_int.effective_date,
            expiry_date=pol_int.expiry_date,
            review_date=pol_int.review_date,
            approved_by=pol_int.signed_by,
            approved_at=pol_int.signed_at,
            signature_hash=pol_int.signature_hash,
            change_reason=pol_int.change_reason,
            document_file=pol_int.document_file,
            is_integral_policy=True,
            is_active=pol_int.is_active,
            orden=pol_int.orden,
            created_by=pol_int.created_by,
            updated_by=pol_int.updated_by,
            created_at=pol_int.created_at,
            updated_at=pol_int.updated_at,
        )
        migrated_count += 1

    print(f"  → Migradas {migrated_count} políticas integrales")
```

### 3.2 Migración de ProcesoFirmaPolitica

```python
def migrate_procesos_firma(apps, schema_editor):
    """
    Actualiza los procesos de firma que apuntan a PoliticaIntegral
    para que apunten a la nueva PoliticaEspecifica equivalente.
    """
    ProcesoFirmaPolitica = apps.get_model('identidad', 'ProcesoFirmaPolitica')
    PoliticaEspecifica = apps.get_model('identidad', 'PoliticaEspecifica')

    updated_count = 0
    for proceso in ProcesoFirmaPolitica.objects.filter(
        politica_integral__isnull=False
    ):
        # Buscar la PoliticaEspecifica correspondiente
        pol_esp = PoliticaEspecifica.objects.filter(
            identity=proceso.politica_integral.identity,
            is_integral_policy=True,
            version=proceso.politica_integral.version
        ).first()

        if pol_esp:
            proceso.politica_especifica = pol_esp
            proceso.save()
            updated_count += 1

    print(f"  → Actualizados {updated_count} procesos de firma")
```

---

## 4. Fases de Implementación

### Fase 1: Preparación (Sin cambios en BD)

**Objetivo:** Agregar campos nuevos a PoliticaEspecifica

**Archivos a modificar:**
1. `models.py` - Agregar campos a PoliticaEspecifica
2. `serializers.py` - Actualizar serializers

**Migración 0010a:**
```python
migrations.AddField(
    model_name='politicaespecifica',
    name='signature_hash',
    field=models.CharField(blank=True, max_length=255, null=True),
),
migrations.AddField(
    model_name='politicaespecifica',
    name='expiry_date',
    field=models.DateField(blank=True, null=True),
),
migrations.AddField(
    model_name='politicaespecifica',
    name='change_reason',
    field=models.TextField(blank=True, null=True),
),
migrations.AddField(
    model_name='politicaespecifica',
    name='is_integral_policy',
    field=models.BooleanField(default=False, db_index=True),
),
```

### Fase 2: Migración de Datos

**Objetivo:** Copiar datos de PoliticaIntegral a PoliticaEspecifica

**Migración 0010b:**
```python
migrations.RunPython(
    migrate_politica_integral_to_especifica,
    reverse_code=migrations.RunPython.noop
),
migrations.RunPython(
    migrate_procesos_firma,
    reverse_code=migrations.RunPython.noop
),
```

### Fase 3: Refactorización de API

**Objetivo:** Consolidar ViewSets y Serializers

**Archivos a modificar:**
1. `serializers.py` - Eliminar serializers de PoliticaIntegral
2. `views.py` - Eliminar PoliticaIntegralViewSet, agregar acciones a PoliticaEspecificaViewSet
3. `urls.py` - Eliminar ruta de integrales

**Acciones a agregar en PoliticaEspecificaViewSet:**
```python
@action(detail=True, methods=['post'])
def sign(self, request, pk=None):
    """Firma digitalmente la política"""

@action(detail=True, methods=['post'])
def publish(self, request, pk=None):
    """Publica la política (cambia a VIGENTE)"""
```

### Fase 4: Eliminación del Modelo

**Objetivo:** Eliminar tabla PoliticaIntegral

**Migración 0010c:**
```python
migrations.RemoveField(
    model_name='procesofirmapolitica',
    name='politica_integral',
),
migrations.RemoveField(
    model_name='procesofirmapolitica',
    name='tipo_politica',
),
migrations.RenameField(
    model_name='procesofirmapolitica',
    old_name='politica_especifica',
    new_name='politica',
),
migrations.DeleteModel(
    name='PoliticaIntegral',
),
```

### Fase 5: Limpieza

**Objetivo:** Eliminar código muerto y actualizar documentación

**Archivos a modificar:**
1. `views_export.py` - Eliminar endpoints de export integral
2. `exporters/pdf_generator.py` - Eliminar método integral
3. `exporters/docx_generator.py` - Eliminar método integral
4. `management/commands/seed_identidad.py` - Actualizar seeds
5. `management/commands/seed_workflows.py` - Actualizar referencias

---

## 5. Cambios por Archivo

### 5.1 models.py

| Líneas | Operación | Descripción |
|--------|-----------|-------------|
| 384-524 | ELIMINAR | Clase `PoliticaIntegral` completa |
| 526-560 | MODIFICAR | Agregar 4 campos a `PoliticaEspecifica` |
| 670-680 | AGREGAR | Métodos `sign()` y `publish()` |

**Código a agregar en PoliticaEspecifica:**
```python
# Nuevos campos
signature_hash = models.CharField(
    max_length=255,
    blank=True,
    null=True,
    verbose_name='Hash de Firma'
)
expiry_date = models.DateField(
    blank=True,
    null=True,
    verbose_name='Fecha de Vencimiento'
)
change_reason = models.TextField(
    blank=True,
    null=True,
    verbose_name='Motivo del Cambio'
)
is_integral_policy = models.BooleanField(
    default=False,
    db_index=True,
    verbose_name='Es Política Integral'
)

# Nuevos métodos
def sign(self, user):
    """Firma digitalmente la política"""
    import hashlib
    content = f"{self.content}|{user.id}|{timezone.now().isoformat()}"
    self.signature_hash = hashlib.sha256(content.encode()).hexdigest()
    self.approved_by = user
    self.approved_at = timezone.now()
    self.save()

def publish(self, user):
    """Publica la política (cambia a VIGENTE)"""
    if self.is_integral_policy:
        # Obsoleta las políticas integrales vigentes anteriores
        PoliticaEspecifica.objects.filter(
            identity=self.identity,
            is_integral_policy=True,
            status='VIGENTE'
        ).update(status='OBSOLETO')

    self.status = 'VIGENTE'
    self.effective_date = timezone.now().date()
    self.updated_by = user
    self.save()

@property
def is_signed(self):
    """Verifica si la política está firmada"""
    return self.approved_by is not None and self.signature_hash is not None
```

### 5.2 models_workflow_firmas.py

| Líneas | Operación | Descripción |
|--------|-----------|-------------|
| 77-85 | ELIMINAR | Campo `tipo_politica` |
| 188-195 | ELIMINAR | FK `politica_integral` |
| 196-203 | RENOMBRAR | `politica_especifica` → `politica` |
| 282-296 | SIMPLIFICAR | Método `clean()` |
| 298-302 | SIMPLIFICAR | Método `get_politica()` |

### 5.3 serializers.py

| Líneas | Operación | Descripción |
|--------|-----------|-------------|
| 14 | MODIFICAR | Eliminar import `PoliticaIntegral` |
| 176-206 | ELIMINAR | `PoliticaIntegralSerializer` |
| 208-218 | ELIMINAR | `PoliticaIntegralCreateUpdateSerializer` |
| 220-233 | ELIMINAR | `SignPoliticaIntegralSerializer` |
| 235-248 | ELIMINAR | `PublishPoliticaIntegralSerializer` |
| 254-318 | MODIFICAR | Agregar campos a `PoliticaEspecificaSerializer` |

### 5.4 views.py

| Líneas | Operación | Descripción |
|--------|-----------|-------------|
| 26 | MODIFICAR | Eliminar import `PoliticaIntegral` |
| 34-37 | ELIMINAR | Imports de serializers integrales |
| 382-498 | ELIMINAR | `PoliticaIntegralViewSet` completo |
| 500+ | MODIFICAR | Agregar acciones `sign()` y `publish()` a `PoliticaEspecificaViewSet` |

### 5.5 urls.py

| Líneas | Operación | Descripción |
|--------|-----------|-------------|
| 22 | ELIMINAR | Import `PoliticaIntegralViewSet` |
| 48 | ELIMINAR | Ruta `politicas-integrales` |
| 69-70 | ELIMINAR | Rutas de export integral |

### 5.6 views_export.py

| Líneas | Operación | Descripción |
|--------|-----------|-------------|
| 25 | ELIMINAR | Import `PoliticaIntegral` |
| 70-106 | ELIMINAR | `export_politica_integral_pdf()` |
| 130-162 | ELIMINAR | `export_politica_integral_docx()` |

### 5.7 exporters/pdf_generator.py

| Líneas | Operación | Descripción |
|--------|-----------|-------------|
| 380-410 | ELIMINAR | `generate_politica_integral_pdf()` |
| 474-520 | ELIMINAR | `_render_politica_integral_html()` |
| 815-830 | ELIMINAR | `generar_pdf_politica_integral()` |

### 5.8 exporters/docx_generator.py

| Líneas | Operación | Descripción |
|--------|-----------|-------------|
| 403-430 | ELIMINAR | `generate_politica_integral_docx()` |
| 729-745 | ELIMINAR | `generar_docx_politica_integral()` |

### 5.9 management/commands/seed_identidad.py

| Líneas | Operación | Descripción |
|--------|-----------|-------------|
| 12 | ELIMINAR | Import `PoliticaIntegral` |
| 306-328 | MODIFICAR | Cambiar creación de integral a PoliticaEspecifica |

---

## 6. Impacto en API/Endpoints

### 6.1 Endpoints Eliminados

```
DELETE /api/v1/identidad/politicas-integrales/
DELETE /api/v1/identidad/politicas-integrales/{id}/
DELETE /api/v1/identidad/politicas-integrales/{id}/sign/
DELETE /api/v1/identidad/politicas-integrales/{id}/publish/
DELETE /api/v1/identidad/politicas-integrales/current/
DELETE /api/v1/identidad/politicas-integrales/by-identity/{id}/
DELETE /api/v1/identidad/export/politica-integral/{id}/pdf/
DELETE /api/v1/identidad/export/politica-integral/{id}/docx/
```

### 6.2 Endpoints Modificados

```
GET  /api/v1/identidad/politicas-especificas/
     → Ahora incluye políticas integrales (filtrar con ?is_integral_policy=true)

POST /api/v1/identidad/politicas-especificas/
     → Acepta is_integral_policy en el body

GET  /api/v1/identidad/politicas-especificas/{id}/
     → Response incluye campos: signature_hash, expiry_date, change_reason, is_integral_policy
```

### 6.3 Endpoints Nuevos (en PoliticaEspecificaViewSet)

```
POST /api/v1/identidad/politicas-especificas/{id}/sign/
     → Firma digitalmente la política
     → Body: { "confirm": true }
     → Solo para is_integral_policy=true

POST /api/v1/identidad/politicas-especificas/{id}/publish/
     → Publica la política integral (VIGENTE)
     → Body: { "confirm": true }
     → Solo para is_integral_policy=true
```

### 6.4 Migración de Clientes (Frontend)

El frontend ya está configurado para consumir un modelo unificado. Cambios necesarios:

```typescript
// Antes (frontend/src/features/gestion-estrategica/hooks/usePoliticas.ts)
// Ya eliminado: usePoliticasIntegrales, usePoliticaIntegralVigente

// Después - sin cambios necesarios
// usePoliticas() ya consume /politicas-especificas/
// El backend retornará is_integral_policy=true para integrales
```

---

## 7. Testing y Validación

### 7.1 Tests Unitarios a Crear

```python
# tests/test_politica_especifica_integral.py

class TestPoliticaEspecificaAsIntegral(TestCase):
    """Tests para PoliticaEspecifica usada como integral"""

    def test_crear_politica_integral(self):
        """Crear PoliticaEspecifica con is_integral_policy=True"""

    def test_firma_digital_integral(self):
        """Verificar firma digital en política integral"""

    def test_publish_integral(self):
        """Publicar política integral obsoleta anteriores"""

    def test_publish_especifica_no_permitido(self):
        """Publicar específica no usa lógica de obsoletos"""

class TestMigracionDatos(TestCase):
    """Tests de validación de migración"""

    def test_politicas_integrales_migradas(self):
        """Verificar que todas las PoliticaIntegral se migraron"""

    def test_procesos_firma_migrados(self):
        """Verificar que procesos de firma se actualizaron"""

    def test_integridad_datos_migrados(self):
        """Verificar que los datos migrados son correctos"""
```

### 7.2 Tests de Integración

```python
class TestAPIConsolidada(APITestCase):
    """Tests de endpoints consolidados"""

    def test_list_incluye_integrales(self):
        """GET /politicas-especificas/ incluye integrales"""

    def test_filter_solo_integrales(self):
        """GET /politicas-especificas/?is_integral_policy=true"""

    def test_sign_action(self):
        """POST /politicas-especificas/{id}/sign/"""

    def test_publish_action(self):
        """POST /politicas-especificas/{id}/publish/"""
```

### 7.3 Validación de Migración

```sql
-- Verificar migración completa
SELECT
    (SELECT COUNT(*) FROM identidad_politica_integral) as integrales_origen,
    (SELECT COUNT(*) FROM identidad_politica_especifica WHERE is_integral_policy = true) as integrales_destino;

-- Verificar procesos de firma
SELECT
    COUNT(*) as procesos_sin_politica
FROM identidad_proceso_firma_politica
WHERE politica_id IS NULL;
```

---

## 8. Checklist de Ejecución

### Pre-Ejecución

- [ ] Crear respaldo de base de datos
- [ ] Crear rama: `git checkout -b refactor/consolidate-politicas`
- [ ] Documentar estado actual de datos (counts)
- [ ] Crear tests antes de cambios

### Fase 1: Preparación

- [ ] Modificar `models.py` - agregar campos a PoliticaEspecifica
- [ ] Crear migración 0010a
- [ ] Ejecutar migración en desarrollo
- [ ] Verificar que campos existen

### Fase 2: Migración de Datos

- [ ] Crear funciones de migración
- [ ] Crear migración 0010b
- [ ] Ejecutar migración en desarrollo
- [ ] Validar datos migrados correctamente
- [ ] Ejecutar queries de validación

### Fase 3: Refactorización de API

- [ ] Eliminar serializers de PoliticaIntegral
- [ ] Actualizar PoliticaEspecificaSerializer
- [ ] Eliminar PoliticaIntegralViewSet
- [ ] Agregar acciones a PoliticaEspecificaViewSet
- [ ] Actualizar urls.py
- [ ] Ejecutar tests de API

### Fase 4: Eliminación del Modelo

- [ ] Crear migración 0010c
- [ ] Ejecutar migración en desarrollo
- [ ] Verificar que tabla fue eliminada

### Fase 5: Limpieza

- [ ] Eliminar endpoints de export integral
- [ ] Eliminar métodos de exporters
- [ ] Actualizar seeds
- [ ] Eliminar imports no usados
- [ ] Limpiar comentarios obsoletos

### Post-Ejecución

- [ ] Ejecutar suite completa de tests
- [ ] Verificar migración en fresh DB
- [ ] Actualizar documentación de API
- [ ] Crear PR con descripción detallada
- [ ] Code review
- [ ] Merge a develop
- [ ] Deploy a staging
- [ ] Validación en staging
- [ ] Merge a main
- [ ] Deploy a producción

---

## Anexos

### A. Estructura de Migración Consolidada

```python
# migrations/0010_consolidate_politicas.py

from django.db import migrations, models
import django.db.models.deletion

def migrate_politica_integral_to_especifica(apps, schema_editor):
    # ... (código de migración)

def migrate_procesos_firma(apps, schema_editor):
    # ... (código de migración)

class Migration(migrations.Migration):
    dependencies = [
        ('identidad', '0009_dynamic_config_models'),
    ]

    operations = [
        # Fase 1: Agregar campos
        migrations.AddField(
            model_name='politicaespecifica',
            name='signature_hash',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='politicaespecifica',
            name='expiry_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='politicaespecifica',
            name='change_reason',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='politicaespecifica',
            name='is_integral_policy',
            field=models.BooleanField(default=False, db_index=True),
        ),

        # Fase 2: Migrar datos
        migrations.RunPython(
            migrate_politica_integral_to_especifica,
            reverse_code=migrations.RunPython.noop
        ),
        migrations.RunPython(
            migrate_procesos_firma,
            reverse_code=migrations.RunPython.noop
        ),

        # Fase 4: Eliminar modelo
        migrations.RemoveField(
            model_name='procesofirmapolitica',
            name='politica_integral',
        ),
        migrations.RemoveField(
            model_name='procesofirmapolitica',
            name='tipo_politica',
        ),
        migrations.RenameField(
            model_name='procesofirmapolitica',
            old_name='politica_especifica',
            new_name='politica',
        ),
        migrations.DeleteModel(
            name='PoliticaIntegral',
        ),
    ]
```

### B. Comandos Útiles

```bash
# Crear migración vacía
python manage.py makemigrations identidad --empty --name consolidate_politicas

# Verificar migraciones pendientes
python manage.py showmigrations identidad

# Ejecutar migraciones
python manage.py migrate identidad

# Revertir última migración
python manage.py migrate identidad 0009

# Ver SQL de migración
python manage.py sqlmigrate identidad 0010
```

### C. Rollback Plan

En caso de fallo, revertir:

1. **Si falla en Fase 4:**
   - `python manage.py migrate identidad 0010b`
   - Los datos permanecen en ambas tablas

2. **Si falla en Fase 2:**
   - `python manage.py migrate identidad 0010a`
   - Restaurar backup de BD

3. **Si falla en producción:**
   - Revertir código a commit anterior
   - `python manage.py migrate identidad 0009`
   - Restaurar backup de BD
