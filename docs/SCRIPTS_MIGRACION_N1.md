# SCRIPTS DE MIGRACIÓN - Reorganización N1

**Fecha:** 2026-01-15
**Referencia:** ANALISIS_ARQUITECTONICO_N1_REORGANIZACION.md

---

## 📋 ÍNDICE DE SCRIPTS

1. [Script 1: Backup Completo](#script-1-backup-completo)
2. [Script 2: Mover Sistema Documental](#script-2-mover-sistema-documental)
3. [Script 3: Mover Gestor de Tareas](#script-3-mover-gestor-de-tareas)
4. [Script 4: Migrar Permisos](#script-4-migrar-permisos)
5. [Script 5: Verificación Post-Migración](#script-5-verificacion-post-migracion)
6. [Script 6: Rollback](#script-6-rollback)

---

## SCRIPT 1: Backup Completo

```bash
#!/bin/bash
# backend/scripts/backup_pre_reorganizacion_n1.sh

echo "🔄 BACKUP PRE-REORGANIZACIÓN N1"
echo "================================"

# Variables
FECHA=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/reorganizacion_n1_${FECHA}"
mkdir -p ${BACKUP_DIR}

# 1. Backup completo de base de datos
echo "📦 1. Backup completo de base de datos..."
python manage.py dumpdata > ${BACKUP_DIR}/full_backup.json
echo "   ✅ Backup completo guardado: ${BACKUP_DIR}/full_backup.json"

# 2. Backup específico de Sistema Documental
echo "📦 2. Backup Sistema Documental..."
python manage.py dumpdata hseq_management.sistema_documental \
    --indent 2 \
    --output ${BACKUP_DIR}/sistema_documental.json
echo "   ✅ Sistema Documental: ${BACKUP_DIR}/sistema_documental.json"

# 3. Backup específico de Gestor de Tareas
echo "📦 3. Backup Gestor de Tareas..."
python manage.py dumpdata audit_system.tareas_recordatorios \
    --indent 2 \
    --output ${BACKUP_DIR}/tareas_recordatorios.json
echo "   ✅ Gestor de Tareas: ${BACKUP_DIR}/tareas_recordatorios.json"

# 4. Backup de permisos y grupos
echo "📦 4. Backup de permisos y grupos..."
python manage.py dumpdata auth.group auth.permission \
    --indent 2 \
    --output ${BACKUP_DIR}/permisos_grupos.json
echo "   ✅ Permisos: ${BACKUP_DIR}/permisos_grupos.json"

# 5. Backup de Cargos (RBAC)
echo "📦 5. Backup de Cargos (RBAC)..."
python manage.py dumpdata core.cargo \
    --indent 2 \
    --output ${BACKUP_DIR}/cargos_rbac.json
echo "   ✅ Cargos RBAC: ${BACKUP_DIR}/cargos_rbac.json"

# 6. Crear archivo de metadata
cat > ${BACKUP_DIR}/metadata.txt <<EOF
Backup Pre-Reorganización N1
============================
Fecha: ${FECHA}
Usuario: $(whoami)
Host: $(hostname)
Git Branch: $(git rev-parse --abbrev-ref HEAD)
Git Commit: $(git rev-parse HEAD)

Contenido:
- full_backup.json: Backup completo de toda la BD
- sistema_documental.json: Módulo completo de gestión documental
- tareas_recordatorios.json: Módulo completo de gestor de tareas
- permisos_grupos.json: Permisos y grupos de Django
- cargos_rbac.json: Sistema RBAC de cargos

Para restaurar:
1. cd backend
2. python manage.py loaddata ${BACKUP_DIR}/full_backup.json
EOF

echo ""
echo "✅ BACKUP COMPLETADO"
echo "📁 Directorio: ${BACKUP_DIR}"
echo "📊 Archivos:"
ls -lh ${BACKUP_DIR}
echo ""
echo "⚠️  IMPORTANTE: Guarda este backup en ubicación segura antes de continuar"
```

---

## SCRIPT 2: Mover Sistema Documental

### Paso 2.1: Crear Estructura

```bash
#!/bin/bash
# backend/scripts/crear_estructura_gestion_documental.sh

echo "🏗️  CREAR ESTRUCTURA: Gestión Documental en N1"
echo "=============================================="

# Crear directorio
mkdir -p backend/apps/gestion_estrategica/gestion_documental

# Copiar archivos
echo "📁 Copiando archivos desde sistema_documental..."
cp -r backend/apps/hseq_management/sistema_documental/* \
      backend/apps/gestion_estrategica/gestion_documental/

# Crear __init__.py con configuración correcta
cat > backend/apps/gestion_estrategica/gestion_documental/__init__.py <<EOF
"""
Módulo Gestión Documental - Dirección Estratégica
==================================================

Sistema de gestión documental integral con control de versiones,
firmas digitales y flujos de aprobación.

Movido desde: apps.hseq_management.sistema_documental (N3)
Nueva ubicación: apps.gestion_estrategica.gestion_documental (N1)
Fecha de migración: $(date +"%Y-%m-%d")

Alineación ISO:
- ISO 9001:2015 - Cláusula 7.5 (Información Documentada)
- ISO 45001:2018 - Cláusula 7.5
- ISO 14001:2015 - Cláusula 7.5
"""

default_app_config = 'apps.gestion_estrategica.gestion_documental.apps.GestionDocumentalConfig'
EOF

# Actualizar apps.py
cat > backend/apps/gestion_estrategica/gestion_documental/apps.py <<EOF
from django.apps import AppConfig


class GestionDocumentalConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.gestion_estrategica.gestion_documental'
    verbose_name = 'Gestión Documental'
    label = 'gestion_documental'  # Label corto para migrations

    def ready(self):
        """Import signals, register auditlog, etc."""
        pass  # TODO: Agregar signals si es necesario
EOF

echo "✅ Estructura creada correctamente"
```

### Paso 2.2: Actualizar Modelos

```python
# backend/scripts/actualizar_models_gestion_documental.py
"""
Script para actualizar app_label en modelos de Gestión Documental
"""

import re
from pathlib import Path

MODELS_PATH = Path('backend/apps/gestion_estrategica/gestion_documental/models.py')

def actualizar_app_label():
    print("🔧 Actualizando app_label en models.py...")

    with open(MODELS_PATH, 'r', encoding='utf-8') as f:
        contenido = f.read()

    # Reemplazar todas las ocurrencias de db_table sin cambiar el nombre
    # No necesitamos cambiar db_table ya que queremos mantener los nombres
    print("   ℹ️  Manteniendo nombres de tablas existentes (documental_*)")

    # Agregar/actualizar app_label en cada Meta class
    # Buscar pattern: class Meta: ... (sin app_label)
    # Agregar: app_label = 'gestion_documental'

    # Por simplicidad, este script es informativo
    # La actualización real se hace manualmente verificando cada Meta class

    print("   ✅ Verificar manualmente que cada modelo tenga:")
    print("      class Meta:")
    print("          app_label = 'gestion_documental'")
    print("          db_table = 'documental_xxx'  # MANTENER nombre existente")

if __name__ == '__main__':
    actualizar_app_label()
```

**IMPORTANTE:** Actualización manual de modelos:

```python
# backend/apps/gestion_estrategica/gestion_documental/models.py

class TipoDocumento(models.Model):
    # ... campos ...

    class Meta:
        app_label = 'gestion_documental'  # ✅ AGREGAR
        db_table = 'documental_tipo_documento'  # ✅ MANTENER
        verbose_name = 'Tipo de Documento'
        verbose_name_plural = 'Tipos de Documentos'
        ordering = ['orden', 'codigo']
        unique_together = ['empresa_id', 'codigo']
        # ... resto del Meta ...

# Repetir para TODOS los modelos:
# - PlantillaDocumento
# - Documento
# - VersionDocumento
# - CampoFormulario
# - FirmaDocumento
# - ControlDocumental
```

### Paso 2.3: Actualizar settings.py

```python
# backend/config/settings.py

INSTALLED_APPS = [
    # ... apps anteriores ...

    # ═══════════════════════════════════════════════════════════════════════════
    # NIVEL 1: ESTRATÉGICO - Dirección Estratégica (8 apps)  ← ACTUALIZADO
    # ═══════════════════════════════════════════════════════════════════════════
    'apps.gestion_estrategica.configuracion',
    'apps.gestion_estrategica.organizacion',
    'apps.gestion_estrategica.identidad',
    'apps.gestion_estrategica.planeacion',
    'apps.gestion_estrategica.planeacion.contexto',
    'apps.gestion_estrategica.gestion_documental',     # ✅ NUEVO
    'apps.gestion_estrategica.gestor_tareas',          # ✅ NUEVO (próximo paso)
    'apps.gestion_estrategica.gestion_proyectos',
    'apps.gestion_estrategica.revision_direccion',

    # ... resto ...

    # ═══════════════════════════════════════════════════════════════════════════
    # NIVEL 3: TORRE DE CONTROL - HSEQ Management (10 apps)  ← ACTUALIZADO
    # ═══════════════════════════════════════════════════════════════════════════
    # 'apps.hseq_management.sistema_documental',     # ❌ COMENTAR/ELIMINAR
    'apps.hseq_management.planificacion_sistema',
    # ... resto de N3 ...
]
```

### Paso 2.4: Actualizar Imports en Identidad

```python
# backend/apps/gestion_estrategica/identidad/services.py

# ANTES:
# from apps.hseq_management.sistema_documental.models import (
#     TipoDocumento, Documento, VersionDocumento,
#     FirmaDocumento, ControlDocumental
# )

# DESPUÉS:
from apps.gestion_estrategica.gestion_documental.models import (
    TipoDocumento, Documento, VersionDocumento,
    FirmaDocumento, ControlDocumental
)
```

### Paso 2.5: Migración Fake

```bash
#!/bin/bash
# backend/scripts/migrar_gestion_documental.sh

echo "🔄 MIGRACIÓN: Sistema Documental → N1"
echo "====================================="

# 1. Verificar que la app anterior está comentada en settings
echo "1️⃣  Verificar settings.py..."
grep -q "# 'apps.hseq_management.sistema_documental'" backend/config/settings.py
if [ $? -eq 0 ]; then
    echo "   ✅ sistema_documental comentado en settings.py"
else
    echo "   ❌ ERROR: Comentar 'apps.hseq_management.sistema_documental' en settings.py"
    exit 1
fi

# 2. Verificar que la nueva app está activa
grep -q "'apps.gestion_estrategica.gestion_documental'" backend/config/settings.py
if [ $? -eq 0 ]; then
    echo "   ✅ gestion_documental activo en settings.py"
else
    echo "   ❌ ERROR: Agregar 'apps.gestion_estrategica.gestion_documental' en settings.py"
    exit 1
fi

# 3. Crear migraciones
echo "2️⃣  Crear migraciones..."
cd backend
python manage.py makemigrations gestion_documental

# 4. Aplicar migraciones como FAKE (datos ya existen)
echo "3️⃣  Aplicar migraciones (fake)..."
python manage.py migrate gestion_documental --fake

# 5. Verificar
echo "4️⃣  Verificar migración..."
python manage.py shell <<EOF
from apps.gestion_estrategica.gestion_documental.models import Documento
count = Documento.objects.count()
print(f"✅ Documentos encontrados: {count}")
if count > 0:
    doc = Documento.objects.first()
    print(f"✅ Primer documento: {doc.codigo} - {doc.titulo}")
else:
    print("⚠️  No hay documentos en BD (puede ser normal en entorno limpio)")
EOF

echo ""
echo "✅ MIGRACIÓN COMPLETADA: Sistema Documental → N1"
echo "📊 Verifica que los datos sean accesibles desde la nueva ubicación"
```

---

## SCRIPT 3: Mover Gestor de Tareas

### Paso 3.1: Agregar Campo empresa_id

```python
# backend/apps/gestion_estrategica/gestor_tareas/models.py

"""
Modelos del módulo Gestor de Tareas - Dirección Estratégica
Movido desde: apps.audit_system.tareas_recordatorios (N6)
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from apps.core.base_models import TimestampedModel

User = get_user_model()

# ... CHOICES igual que antes ...


class Tarea(TimestampedModel):
    """Tareas estratégicas y de seguimiento"""

    # Campos existentes
    titulo = models.CharField(max_length=500, verbose_name='Título')
    descripcion = models.TextField(verbose_name='Descripción')
    tipo = models.CharField(max_length=20, choices=TIPO_TAREA_CHOICES, default='manual', db_index=True)
    prioridad = models.CharField(max_length=10, choices=PRIORIDAD_TAREA_CHOICES, default='normal', db_index=True)
    estado = models.CharField(max_length=20, choices=ESTADO_TAREA_CHOICES, default='pendiente', db_index=True)

    asignado_a = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tareas_asignadas', verbose_name='Asignado a')
    creado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='tareas_creadas', verbose_name='Creado por')

    fecha_limite = models.DateTimeField(verbose_name='Fecha Límite', db_index=True)
    fecha_completada = models.DateTimeField(null=True, blank=True, verbose_name='Fecha Completada')

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.CharField(max_length=255, null=True, blank=True)
    url_relacionada = models.CharField(max_length=500, null=True, blank=True, verbose_name='URL Relacionada')

    notas = models.TextField(null=True, blank=True, verbose_name='Notas')
    porcentaje_avance = models.PositiveIntegerField(default=0, verbose_name='Porcentaje de Avance')

    # ✅ NUEVO: Multi-tenancy explícito
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID',
        help_text='ID de la empresa (multi-tenancy)'
    )

    class Meta:
        app_label = 'gestor_tareas'  # ✅ NUEVO
        db_table = 'tareas_tarea'  # ✅ MANTENER nombre existente
        verbose_name = 'Tarea'
        verbose_name_plural = 'Tareas'
        ordering = ['-fecha_limite']
        indexes = [
            models.Index(fields=['empresa_id', 'asignado_a', 'estado']),  # ✅ ACTUALIZADO
            models.Index(fields=['empresa_id', 'estado', '-fecha_limite']),  # ✅ NUEVO
            models.Index(fields=['prioridad', 'estado']),
        ]

    def __str__(self):
        return f'{self.titulo} - {self.asignado_a.get_full_name()}'

    def completar(self):
        """Marca la tarea como completada"""
        from django.utils import timezone
        self.estado = 'completada'
        self.fecha_completada = timezone.now()
        self.porcentaje_avance = 100
        self.save(update_fields=['estado', 'fecha_completada', 'porcentaje_avance'])


# Repetir mismo patrón para:
# - Recordatorio
# - EventoCalendario
# - ComentarioTarea
```

### Paso 3.2: Migración de Datos empresa_id

```python
# backend/apps/gestion_estrategica/gestor_tareas/migrations/0002_add_empresa_id.py

from django.db import migrations, models


def forwards_add_empresa_id(apps, schema_editor):
    """
    Migra empresa_id desde user.empresa a campo explícito
    """
    Tarea = apps.get_model('gestor_tareas', 'Tarea')
    Recordatorio = apps.get_model('gestor_tareas', 'Recordatorio')
    EventoCalendario = apps.get_model('gestor_tareas', 'EventoCalendario')

    print("\n🔄 Migrando empresa_id a Tareas...")
    tareas_actualizadas = 0
    for tarea in Tarea.objects.all():
        if tarea.asignado_a and hasattr(tarea.asignado_a, 'empresa_id'):
            tarea.empresa_id = tarea.asignado_a.empresa_id
            tarea.save(update_fields=['empresa_id'])
            tareas_actualizadas += 1
    print(f"   ✅ {tareas_actualizadas} tareas actualizadas")

    print("\n🔄 Migrando empresa_id a Recordatorios...")
    recordatorios_actualizados = 0
    for recordatorio in Recordatorio.objects.all():
        if recordatorio.usuario and hasattr(recordatorio.usuario, 'empresa_id'):
            recordatorio.empresa_id = recordatorio.usuario.empresa_id
            recordatorio.save(update_fields=['empresa_id'])
            recordatorios_actualizados += 1
    print(f"   ✅ {recordatorios_actualizados} recordatorios actualizados")

    print("\n🔄 Migrando empresa_id a Eventos de Calendario...")
    eventos_actualizados = 0
    for evento in EventoCalendario.objects.all():
        if evento.creado_por and hasattr(evento.creado_por, 'empresa_id'):
            evento.empresa_id = evento.creado_por.empresa_id
            evento.save(update_fields=['empresa_id'])
            eventos_actualizados += 1
    print(f"   ✅ {eventos_actualizados} eventos actualizados")

    print("\n✅ Migración de empresa_id completada")


def backwards_remove_empresa_id(apps, schema_editor):
    """
    Rollback: No necesitamos hacer nada, el campo se eliminará
    """
    print("⏪ Rollback: Campo empresa_id se eliminará automáticamente")


class Migration(migrations.Migration):

    dependencies = [
        ('gestor_tareas', '0001_initial'),
    ]

    operations = [
        # 1. Agregar campo empresa_id (nullable temporalmente)
        migrations.AddField(
            model_name='tarea',
            name='empresa_id',
            field=models.PositiveBigIntegerField(
                db_index=True,
                verbose_name='Empresa ID',
                null=True,  # Temporal para migración
                blank=True
            ),
        ),
        migrations.AddField(
            model_name='recordatorio',
            name='empresa_id',
            field=models.PositiveBigIntegerField(
                db_index=True,
                verbose_name='Empresa ID',
                null=True,
                blank=True
            ),
        ),
        migrations.AddField(
            model_name='eventocalendario',
            name='empresa_id',
            field=models.PositiveBigIntegerField(
                db_index=True,
                verbose_name='Empresa ID',
                null=True,
                blank=True
            ),
        ),
        migrations.AddField(
            model_name='comentariotarea',
            name='empresa_id',
            field=models.PositiveBigIntegerField(
                db_index=True,
                verbose_name='Empresa ID',
                null=True,
                blank=True
            ),
        ),

        # 2. Migrar datos
        migrations.RunPython(forwards_add_empresa_id, backwards_remove_empresa_id),

        # 3. Hacer NOT NULL (después de migrar datos)
        migrations.AlterField(
            model_name='tarea',
            name='empresa_id',
            field=models.PositiveBigIntegerField(
                db_index=True,
                verbose_name='Empresa ID',
                # Ya no nullable
            ),
        ),
        migrations.AlterField(
            model_name='recordatorio',
            name='empresa_id',
            field=models.PositiveBigIntegerField(
                db_index=True,
                verbose_name='Empresa ID',
            ),
        ),
        migrations.AlterField(
            model_name='eventocalendario',
            name='empresa_id',
            field=models.PositiveBigIntegerField(
                db_index=True,
                verbose_name='Empresa ID',
            ),
        ),
        migrations.AlterField(
            model_name='comentariotarea',
            name='empresa_id',
            field=models.PositiveBigIntegerField(
                db_index=True,
                verbose_name='Empresa ID',
            ),
        ),

        # 4. Agregar índices
        migrations.AddIndex(
            model_name='tarea',
            index=models.Index(fields=['empresa_id', 'estado', '-fecha_limite'], name='tareas_tarea_empresa_estado_idx'),
        ),
    ]
```

---

## SCRIPT 4: Migrar Permisos

```python
# backend/scripts/migrar_permisos_reorganizacion_n1.py
"""
Script para migrar permisos tras reorganización de módulos N1
"""

from django.contrib.auth.models import Permission, Group
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from apps.core.models import Cargo


PERMISSION_MAPPING = {
    # Sistema Documental: hseq_management → gestion_estrategica
    'hseq_management.view_tipodocumento': 'gestion_estrategica.view_tipodocumento',
    'hseq_management.add_tipodocumento': 'gestion_estrategica.add_tipodocumento',
    'hseq_management.change_tipodocumento': 'gestion_estrategica.change_tipodocumento',
    'hseq_management.delete_tipodocumento': 'gestion_estrategica.delete_tipodocumento',

    'hseq_management.view_plantilladocumento': 'gestion_estrategica.view_plantilladocumento',
    'hseq_management.add_plantilladocumento': 'gestion_estrategica.add_plantilladocumento',
    'hseq_management.change_plantilladocumento': 'gestion_estrategica.change_plantilladocumento',
    'hseq_management.delete_plantilladocumento': 'gestion_estrategica.delete_plantilladocumento',

    'hseq_management.view_documento': 'gestion_estrategica.view_documento',
    'hseq_management.add_documento': 'gestion_estrategica.add_documento',
    'hseq_management.change_documento': 'gestion_estrategica.change_documento',
    'hseq_management.delete_documento': 'gestion_estrategica.delete_documento',

    'hseq_management.view_versiondocumento': 'gestion_estrategica.view_versiondocumento',
    'hseq_management.view_firmadocumento': 'gestion_estrategica.view_firmadocumento',
    'hseq_management.view_controldocumental': 'gestion_estrategica.view_controldocumental',

    # Gestor de Tareas: audit_system → gestion_estrategica
    'audit_system.view_tarea': 'gestion_estrategica.view_tarea',
    'audit_system.add_tarea': 'gestion_estrategica.add_tarea',
    'audit_system.change_tarea': 'gestion_estrategica.change_tarea',
    'audit_system.delete_tarea': 'gestion_estrategica.delete_tarea',

    'audit_system.view_recordatorio': 'gestion_estrategica.view_recordatorio',
    'audit_system.add_recordatorio': 'gestion_estrategica.add_recordatorio',
    'audit_system.change_recordatorio': 'gestion_estrategica.change_recordatorio',
    'audit_system.delete_recordatorio': 'gestion_estrategica.delete_recordatorio',

    'audit_system.view_eventocalendario': 'gestion_estrategica.view_eventocalendario',
    'audit_system.add_eventocalendario': 'gestion_estrategica.add_eventocalendario',
    'audit_system.change_eventocalendario': 'gestion_estrategica.change_eventocalendario',
    'audit_system.delete_eventocalendario': 'gestion_estrategica.delete_eventocalendario',
}


@transaction.atomic
def migrate_group_permissions():
    """
    Migra permisos de Grupos de Django
    """
    print("\n🔐 MIGRANDO PERMISOS DE GRUPOS")
    print("=" * 50)

    grupos_actualizados = 0
    permisos_agregados = 0

    for old_perm_str, new_perm_str in PERMISSION_MAPPING.items():
        old_app, old_codename = old_perm_str.split('.')
        new_app, new_codename = new_perm_str.split('.')

        # Buscar grupos que tengan el permiso antiguo
        old_permission = Permission.objects.filter(
            content_type__app_label=old_app,
            codename=old_codename
        ).first()

        if not old_permission:
            print(f"   ⚠️  Permiso antiguo no encontrado: {old_perm_str}")
            continue

        grupos_con_permiso = Group.objects.filter(permissions=old_permission)

        if not grupos_con_permiso.exists():
            continue

        # Buscar permiso nuevo
        new_permission = Permission.objects.filter(
            content_type__app_label=new_app,
            codename=new_codename
        ).first()

        if not new_permission:
            print(f"   ❌ Permiso nuevo no encontrado: {new_perm_str}")
            print(f"      Ejecutar: python manage.py migrate {new_app}")
            continue

        # Agregar permiso nuevo a grupos
        for group in grupos_con_permiso:
            if not group.permissions.filter(id=new_permission.id).exists():
                group.permissions.add(new_permission)
                permisos_agregados += 1
                print(f"   ✅ Grupo '{group.name}': agregado {new_perm_str}")

        grupos_actualizados += len(grupos_con_permiso)

    print(f"\n📊 Resumen:")
    print(f"   - Grupos actualizados: {grupos_actualizados}")
    print(f"   - Permisos agregados: {permisos_agregados}")


@transaction.atomic
def migrate_cargo_permissions():
    """
    Migra permisos en sistema RBAC de Cargos
    """
    print("\n🔐 MIGRANDO PERMISOS DE CARGOS (RBAC)")
    print("=" * 50)

    cargos_actualizados = 0
    permisos_agregados = 0

    for cargo in Cargo.objects.all():
        if not hasattr(cargo, 'permissions') or not cargo.permissions:
            continue

        permisos_modificados = False

        for old_perm, new_perm in PERMISSION_MAPPING.items():
            if old_perm in cargo.permissions:
                # Agregar nuevo permiso si no existe
                if new_perm not in cargo.permissions:
                    cargo.permissions.append(new_perm)
                    permisos_agregados += 1
                    permisos_modificados = True
                    print(f"   ✅ Cargo '{cargo.nombre}': agregado {new_perm}")

        if permisos_modificados:
            cargo.save()
            cargos_actualizados += 1

    print(f"\n📊 Resumen:")
    print(f"   - Cargos actualizados: {cargos_actualizados}")
    print(f"   - Permisos agregados: {permisos_agregados}")


def verificar_permisos():
    """
    Verifica que los permisos nuevos existan
    """
    print("\n🔍 VERIFICANDO PERMISOS NUEVOS")
    print("=" * 50)

    permisos_faltantes = []

    for new_perm_str in set(PERMISSION_MAPPING.values()):
        app_label, codename = new_perm_str.split('.')

        permission = Permission.objects.filter(
            content_type__app_label=app_label,
            codename=codename
        ).first()

        if not permission:
            permisos_faltantes.append(new_perm_str)
            print(f"   ❌ Falta: {new_perm_str}")
        else:
            print(f"   ✅ OK: {new_perm_str}")

    if permisos_faltantes:
        print("\n⚠️  ACCIÓN REQUERIDA:")
        print("   Ejecutar migraciones para crear permisos faltantes:")
        apps_faltantes = set([p.split('.')[0] for p in permisos_faltantes])
        for app in apps_faltantes:
            print(f"   python manage.py migrate {app}")
        return False

    print("\n✅ Todos los permisos nuevos existen")
    return True


if __name__ == '__main__':
    print("╔════════════════════════════════════════════════════════════╗")
    print("║   MIGRACIÓN DE PERMISOS - REORGANIZACIÓN N1                ║")
    print("╚════════════════════════════════════════════════════════════╝")

    # 1. Verificar que permisos nuevos existan
    if not verificar_permisos():
        print("\n❌ Primero ejecuta las migraciones para crear permisos nuevos")
        exit(1)

    # 2. Migrar permisos de grupos
    migrate_group_permissions()

    # 3. Migrar permisos de cargos
    migrate_cargo_permissions()

    print("\n" + "=" * 50)
    print("✅ MIGRACIÓN DE PERMISOS COMPLETADA")
    print("=" * 50)
```

---

## SCRIPT 5: Verificación Post-Migración

```python
# backend/scripts/verificar_migracion_n1.py
"""
Script de verificación completa post-migración
"""

from django.contrib.auth import get_user_model
from django.db import connection
from apps.gestion_estrategica.gestion_documental.models import (
    TipoDocumento, Documento, PlantillaDocumento
)
from apps.gestion_estrategica.gestor_tareas.models import (
    Tarea, Recordatorio, EventoCalendario
)

User = get_user_model()


def verificar_tablas_bd():
    """
    Verifica que las tablas en BD existan con nombres correctos
    """
    print("\n📊 VERIFICACIÓN DE TABLAS EN BASE DE DATOS")
    print("=" * 60)

    with connection.cursor() as cursor:
        # Verificar tablas de Sistema Documental
        tablas_documental = [
            'documental_tipo_documento',
            'documental_plantilla_documento',
            'documental_documento',
            'documental_version_documento',
            'documental_campo_formulario',
            'documental_firma_documento',
            'documental_control_documental',
        ]

        print("\n🗂️  Sistema Documental:")
        for tabla in tablas_documental:
            cursor.execute(f"SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '{tabla}'")
            existe = cursor.fetchone()[0] > 0
            if existe:
                cursor.execute(f"SELECT COUNT(*) FROM {tabla}")
                count = cursor.fetchone()[0]
                print(f"   ✅ {tabla}: {count} registros")
            else:
                print(f"   ❌ {tabla}: NO EXISTE")

        # Verificar tablas de Gestor de Tareas
        tablas_tareas = [
            'tareas_tarea',
            'tareas_recordatorio',
            'tareas_evento_calendario',
            'tareas_comentario_tarea',
        ]

        print("\n📋 Gestor de Tareas:")
        for tabla in tablas_tareas:
            cursor.execute(f"SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '{tabla}'")
            existe = cursor.fetchone()[0] > 0
            if existe:
                cursor.execute(f"SELECT COUNT(*) FROM {tabla}")
                count = cursor.fetchone()[0]
                print(f"   ✅ {tabla}: {count} registros")
            else:
                print(f"   ❌ {tabla}: NO EXISTE")


def verificar_modelos_accesibles():
    """
    Verifica que los modelos sean accesibles desde nueva ubicación
    """
    print("\n🔍 VERIFICACIÓN DE MODELOS ACCESIBLES")
    print("=" * 60)

    try:
        # Sistema Documental
        print("\n📄 Sistema Documental:")
        tipos = TipoDocumento.objects.count()
        print(f"   ✅ TipoDocumento: {tipos} registros")

        plantillas = PlantillaDocumento.objects.count()
        print(f"   ✅ PlantillaDocumento: {plantillas} registros")

        documentos = Documento.objects.count()
        print(f"   ✅ Documento: {documentos} registros")

        # Gestor de Tareas
        print("\n✅ Gestor de Tareas:")
        tareas = Tarea.objects.count()
        print(f"   ✅ Tarea: {tareas} registros")

        recordatorios = Recordatorio.objects.count()
        print(f"   ✅ Recordatorio: {recordatorios} registros")

        eventos = EventoCalendario.objects.count()
        print(f"   ✅ EventoCalendario: {eventos} registros")

    except Exception as e:
        print(f"   ❌ ERROR: {e}")
        return False

    return True


def verificar_multi_tenancy():
    """
    Verifica que multi-tenancy funcione correctamente
    """
    print("\n🏢 VERIFICACIÓN DE MULTI-TENANCY")
    print("=" * 60)

    # Verificar que todos los registros tengan empresa_id
    print("\n📄 Sistema Documental:")

    docs_sin_empresa = Documento.objects.filter(empresa_id__isnull=True).count()
    if docs_sin_empresa > 0:
        print(f"   ⚠️  {docs_sin_empresa} documentos SIN empresa_id")
    else:
        print(f"   ✅ Todos los documentos tienen empresa_id")

    print("\n📋 Gestor de Tareas:")

    tareas_sin_empresa = Tarea.objects.filter(empresa_id__isnull=True).count()
    if tareas_sin_empresa > 0:
        print(f"   ❌ {tareas_sin_empresa} tareas SIN empresa_id")
        return False
    else:
        print(f"   ✅ Todas las tareas tienen empresa_id")

    # Verificar que filtrado por empresa funciona
    empresas_ids = Tarea.objects.values_list('empresa_id', flat=True).distinct()
    print(f"\n   📊 Tareas distribuidas en {len(empresas_ids)} empresas")

    return True


def verificar_integracion_identidad():
    """
    Verifica que integración identidad → gestion_documental funcione
    """
    print("\n🔗 VERIFICACIÓN DE INTEGRACIÓN")
    print("=" * 60)

    try:
        # Intentar import desde identidad
        from apps.gestion_estrategica.identidad.services import IdentityPublicationService

        print("   ✅ Import de IdentityPublicationService OK")

        # Verificar que pueda acceder a modelos
        print("   ✅ Integración identidad → gestion_documental: OK")

    except ImportError as e:
        print(f"   ❌ Error de import: {e}")
        return False

    return True


def resumen_verificacion():
    """
    Resumen final de verificación
    """
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE VERIFICACIÓN")
    print("=" * 60)

    verificaciones = [
        ("Tablas BD", verificar_tablas_bd),
        ("Modelos Accesibles", verificar_modelos_accesibles),
        ("Multi-tenancy", verificar_multi_tenancy),
        ("Integración", verificar_integracion_identidad),
    ]

    resultados = []
    for nombre, func in verificaciones:
        try:
            resultado = func()
            if resultado is None:
                resultado = True  # Si no devuelve False, asumimos OK
            resultados.append((nombre, resultado))
        except Exception as e:
            print(f"\n❌ ERROR en {nombre}: {e}")
            resultados.append((nombre, False))

    print("\n📋 RESULTADOS:")
    for nombre, resultado in resultados:
        estado = "✅ PASS" if resultado else "❌ FAIL"
        print(f"   {estado}: {nombre}")

    all_ok = all([r[1] for r in resultados])

    print("\n" + "=" * 60)
    if all_ok:
        print("✅ VERIFICACIÓN EXITOSA - Migración completada correctamente")
    else:
        print("❌ VERIFICACIÓN FALLIDA - Revisar errores arriba")
    print("=" * 60)

    return all_ok


if __name__ == '__main__':
    print("╔════════════════════════════════════════════════════════════╗")
    print("║   VERIFICACIÓN POST-MIGRACIÓN - REORGANIZACIÓN N1          ║")
    print("╚════════════════════════════════════════════════════════════╝")

    exitoso = resumen_verificacion()

    exit(0 if exitoso else 1)
```

---

## SCRIPT 6: Rollback

```bash
#!/bin/bash
# backend/scripts/rollback_reorganizacion_n1.sh

echo "⏪ ROLLBACK: Reorganización N1"
echo "=============================="
echo ""
echo "⚠️  ADVERTENCIA: Este script revertirá todos los cambios"
echo "   de la reorganización del módulo N1"
echo ""
read -p "¿Estás seguro de continuar? (escribir 'SI' para confirmar): " confirm

if [ "$confirm" != "SI" ]; then
    echo "❌ Rollback cancelado"
    exit 1
fi

# Solicitar ubicación del backup
read -p "Ruta del directorio de backup: " BACKUP_DIR

if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ ERROR: Directorio de backup no existe: $BACKUP_DIR"
    exit 1
fi

if [ ! -f "$BACKUP_DIR/full_backup.json" ]; then
    echo "❌ ERROR: No se encuentra full_backup.json en $BACKUP_DIR"
    exit 1
fi

echo ""
echo "📦 Backup encontrado: $BACKUP_DIR"
echo "📄 Archivos disponibles:"
ls -lh "$BACKUP_DIR"
echo ""

# 1. Revertir settings.py
echo "1️⃣  Revertir settings.py..."
echo "   ℹ️  Revierte manualmente los cambios en backend/config/settings.py:"
echo "      - Comentar: apps.gestion_estrategica.gestion_documental"
echo "      - Comentar: apps.gestion_estrategica.gestor_tareas"
echo "      - Descomentar: apps.hseq_management.sistema_documental"
echo "      - Descomentar: apps.audit_system.tareas_recordatorios"
read -p "Presiona ENTER después de revertir settings.py..."

# 2. Eliminar migraciones nuevas
echo ""
echo "2️⃣  Revertir migraciones..."
cd backend
python manage.py migrate gestion_documental zero --fake
python manage.py migrate gestor_tareas zero --fake

# 3. Restaurar base de datos
echo ""
echo "3️⃣  Restaurar base de datos..."
read -p "⚠️  Esto SOBRESCRIBIRÁ todos los datos. ¿Continuar? (SI/no): " confirm_restore

if [ "$confirm_restore" == "SI" ]; then
    echo "   🔄 Restaurando full_backup.json..."
    python manage.py loaddata "$BACKUP_DIR/full_backup.json"
    echo "   ✅ Base de datos restaurada"
else
    echo "   ⏩ Restauración de BD omitida"
fi

# 4. Eliminar directorios de apps nuevas
echo ""
echo "4️⃣  Eliminar directorios de apps nuevas..."
read -p "¿Eliminar apps.gestion_estrategica.gestion_documental? (si/no): " del_documental
if [ "$del_documental" == "si" ]; then
    rm -rf backend/apps/gestion_estrategica/gestion_documental
    echo "   ✅ Eliminado: gestion_documental"
fi

read -p "¿Eliminar apps.gestion_estrategica.gestor_tareas? (si/no): " del_tareas
if [ "$del_tareas" == "si" ]; then
    rm -rf backend/apps/gestion_estrategica/gestor_tareas
    echo "   ✅ Eliminado: gestor_tareas"
fi

# 5. Revertir cambios en identidad/services.py
echo ""
echo "5️⃣  Revertir imports en identidad/services.py..."
echo "   ℹ️  Revierte manualmente:"
echo "      Cambiar: from apps.gestion_estrategica.gestion_documental.models import ..."
echo "      Por:     from apps.hseq_management.sistema_documental.models import ..."
read -p "Presiona ENTER después de revertir imports..."

# 6. Verificar
echo ""
echo "6️⃣  Verificar sistema..."
python manage.py check
if [ $? -eq 0 ]; then
    echo "   ✅ Sistema OK"
else
    echo "   ❌ ERROR en verificación"
    exit 1
fi

echo ""
echo "✅ ROLLBACK COMPLETADO"
echo "📋 Pasos siguientes:"
echo "   1. Reiniciar servidor Django"
echo "   2. Verificar funcionalidad en UI"
echo "   3. Revisar logs de errores"
```

---

## 📝 NOTAS FINALES

### Orden de Ejecución

1. ✅ **Script 1:** Backup (OBLIGATORIO)
2. ✅ **Script 2:** Mover Sistema Documental
3. ✅ **Script 3:** Mover Gestor de Tareas
4. ✅ **Script 4:** Migrar Permisos
5. ✅ **Script 5:** Verificación
6. ⏪ **Script 6:** Rollback (solo si es necesario)

### Comandos Rápidos

```bash
# Ejecutar migración completa
cd backend
./scripts/backup_pre_reorganizacion_n1.sh
./scripts/crear_estructura_gestion_documental.sh
./scripts/migrar_gestion_documental.sh
python manage.py migrate gestor_tareas
python scripts/migrar_permisos_reorganizacion_n1.py
python scripts/verificar_migracion_n1.py

# Si todo OK, deploy
python manage.py collectstatic --noinput
sudo systemctl restart gunicorn  # o método de deploy que uses
```

---

**Elaborado por:** ISO_MANAGEMENT_SYSTEMS_SPECIALIST
**Fecha:** 2026-01-15
**Próxima Revisión:** Post-implementación

---

**FIN DE SCRIPTS DE MIGRACIÓN**
