# Migration: Dynamic CategoriaDocumento
#
# Esta migración:
# 1. Crea el modelo CategoriaDocumento
# 2. Agrega campo categoria (FK) a TipoDocumento
# 3. Migra datos del campo category (CharField) a categoria (FK)
# 4. Elimina el campo category antiguo

from django.db import migrations, models
import django.db.models.deletion


def migrate_categories_to_fk(apps, schema_editor):
    """
    Migra los datos del campo category (CharField) al nuevo campo categoria (FK).

    1. Crea las categorías base del sistema
    2. Asigna cada TipoDocumento a su categoría correspondiente
    """
    CategoriaDocumento = apps.get_model('organizacion', 'CategoriaDocumento')
    TipoDocumento = apps.get_model('organizacion', 'TipoDocumento')

    # Definir categorías del sistema con sus colores e iconos
    categorias_sistema = [
        {
            'code': 'FINANCIERO',
            'name': 'Financiero',
            'description': 'Documentos financieros y contables',
            'color': 'green',
            'icon': 'DollarSign',
            'is_system': True,
            'order': 1,
        },
        {
            'code': 'COMPRAS',
            'name': 'Compras',
            'description': 'Documentos del proceso de compras',
            'color': 'purple',
            'icon': 'ShoppingCart',
            'is_system': True,
            'order': 2,
        },
        {
            'code': 'GESTION_INTEGRAL',
            'name': 'Gestión Integral',
            'description': 'Documentos del sistema de gestión (calidad, SST, ambiente)',
            'color': 'amber',
            'icon': 'Shield',
            'is_system': True,
            'order': 3,
        },
        {
            'code': 'MANTENIMIENTO',
            'name': 'Mantenimiento',
            'description': 'Documentos de mantenimiento y activos',
            'color': 'slate',
            'icon': 'Wrench',
            'is_system': True,
            'order': 4,
        },
    ]

    # Crear categorías
    categoria_map = {}
    for cat_data in categorias_sistema:
        cat, _ = CategoriaDocumento.objects.get_or_create(
            code=cat_data['code'],
            defaults=cat_data
        )
        categoria_map[cat_data['code']] = cat

    # Migrar TipoDocumento: asignar categoria FK basado en category CharField
    for tipo in TipoDocumento.objects.all():
        old_category = tipo.category if hasattr(tipo, 'category') else None
        if old_category and old_category in categoria_map:
            tipo.categoria = categoria_map[old_category]
            tipo.save(update_fields=['categoria'])
        else:
            # Asignar a GESTION_INTEGRAL por defecto si no tiene categoría válida
            tipo.categoria = categoria_map['GESTION_INTEGRAL']
            tipo.save(update_fields=['categoria'])

    print(f"Migradas {TipoDocumento.objects.count()} tipos de documento a categorías dinámicas")


def reverse_categories(apps, schema_editor):
    """Reverse: copiar categoria.code de vuelta a category CharField"""
    TipoDocumento = apps.get_model('organizacion', 'TipoDocumento')

    for tipo in TipoDocumento.objects.select_related('categoria').all():
        if tipo.categoria:
            tipo.category = tipo.categoria.code
            tipo.save(update_fields=['category'])


class Migration(migrations.Migration):

    dependencies = [
        ('organizacion', '0004_refactor_consecutivos_v2'),
    ]

    operations = [
        # 1. Crear modelo CategoriaDocumento
        migrations.CreateModel(
            name='CategoriaDocumento',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(db_index=True, help_text='Código único de la categoría (ej: FINANCIERO, COMPRAS)', max_length=30, verbose_name='Código')),
                ('name', models.CharField(help_text='Nombre descriptivo de la categoría', max_length=100, verbose_name='Nombre')),
                ('description', models.TextField(blank=True, verbose_name='Descripción')),
                ('color', models.CharField(default='gray', help_text='Color para badges en el frontend (ej: blue, green, red, gray)', max_length=20, verbose_name='Color')),
                ('icon', models.CharField(blank=True, help_text='Nombre del icono Lucide (ej: FileText, DollarSign, Package)', max_length=50, verbose_name='Icono')),
                ('is_system', models.BooleanField(default=False, help_text='Las categorías del sistema no pueden eliminarse', verbose_name='Es del sistema')),
                ('is_active', models.BooleanField(db_index=True, default=True, verbose_name='Activo')),
                ('order', models.PositiveIntegerField(default=0, help_text='Orden de visualización', verbose_name='Orden')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Creado')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Actualizado')),
            ],
            options={
                'verbose_name': 'Categoría de Documento',
                'verbose_name_plural': 'Categorías de Documento',
                'db_table': 'organizacion_categoria_documento',
                'ordering': ['order', 'name'],
            },
        ),

        # 2. Agregar índices
        migrations.AddIndex(
            model_name='categoriadocumento',
            index=models.Index(fields=['code'], name='organizacio_code_cat_idx'),
        ),
        migrations.AddIndex(
            model_name='categoriadocumento',
            index=models.Index(fields=['is_active'], name='organizacio_active_cat_idx'),
        ),
        migrations.AddIndex(
            model_name='categoriadocumento',
            index=models.Index(fields=['order'], name='organizacio_order_cat_idx'),
        ),

        # 3. Agregar constraint unique
        migrations.AddConstraint(
            model_name='categoriadocumento',
            constraint=models.UniqueConstraint(fields=['code'], name='unique_categoria_code'),
        ),

        # 4. Agregar campo categoria (FK) a TipoDocumento - nullable inicialmente
        migrations.AddField(
            model_name='tipodocumento',
            name='categoria',
            field=models.ForeignKey(
                null=True,  # Nullable inicialmente para permitir migración
                blank=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='tipos_documento',
                to='organizacion.categoriadocumento',
                verbose_name='Categoría',
                help_text='Categoría a la que pertenece este tipo de documento'
            ),
        ),

        # 5. Migrar datos
        migrations.RunPython(migrate_categories_to_fk, reverse_categories),

        # 6. Hacer el campo categoria NOT NULL
        migrations.AlterField(
            model_name='tipodocumento',
            name='categoria',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='tipos_documento',
                to='organizacion.categoriadocumento',
                verbose_name='Categoría',
                help_text='Categoría a la que pertenece este tipo de documento'
            ),
        ),

        # 7. Eliminar campo category antiguo (CharField)
        migrations.RemoveField(
            model_name='tipodocumento',
            name='category',
        ),

        # 8. Actualizar ordering de TipoDocumento
        migrations.AlterModelOptions(
            name='tipodocumento',
            options={
                'ordering': ['categoria__order', 'order', 'name'],
                'verbose_name': 'Tipo de Documento',
                'verbose_name_plural': 'Tipos de Documento',
            },
        ),
    ]
