"""
Migración: Sistema de Unidades de Medida Dinámico

Agrega:
1. Modelo UnidadMedida - Catálogo de unidades configurables
2. EmpresaConfig.unidad_capacidad_default - Unidad por defecto
3. SedeEmpresa.capacidad_almacenamiento - Capacidad genérica
4. SedeEmpresa.unidad_capacidad - Unidad de la capacidad
5. Marca capacidad_almacenamiento_kg como DEPRECATED

Carga unidades del sistema predefinidas.
"""
from django.db import migrations, models
import django.db.models.deletion
from decimal import Decimal


def cargar_unidades_sistema(apps, schema_editor):
    """
    Carga las unidades de medida predefinidas del sistema.
    """
    UnidadMedida = apps.get_model('configuracion', 'UnidadMedida')

    unidades_sistema = [
        # MASA / PESO - Base: KG
        {
            'codigo': 'KG',
            'nombre': 'Kilogramo',
            'nombre_plural': 'Kilogramos',
            'simbolo': 'kg',
            'categoria': 'MASA',
            'decimales_display': 2,
            'orden_display': 10,
            'es_sistema': True,
            'factor_conversion': Decimal('1.0'),
        },
        {
            'codigo': 'GR',
            'nombre': 'Gramo',
            'nombre_plural': 'Gramos',
            'simbolo': 'g',
            'categoria': 'MASA',
            'decimales_display': 0,
            'orden_display': 5,
            'es_sistema': True,
            'factor_conversion': Decimal('0.001'),
            'unidad_base_codigo': 'KG',
        },
        {
            'codigo': 'LB',
            'nombre': 'Libra',
            'nombre_plural': 'Libras',
            'simbolo': 'lb',
            'categoria': 'MASA',
            'decimales_display': 2,
            'orden_display': 15,
            'es_sistema': True,
            'factor_conversion': Decimal('0.453592'),
            'unidad_base_codigo': 'KG',
        },
        {
            'codigo': 'TON',
            'nombre': 'Tonelada',
            'nombre_plural': 'Toneladas',
            'simbolo': 'ton',
            'categoria': 'MASA',
            'decimales_display': 2,
            'orden_display': 20,
            'es_sistema': True,
            'factor_conversion': Decimal('1000'),
            'unidad_base_codigo': 'KG',
        },

        # VOLUMEN - Base: M3
        {
            'codigo': 'M3',
            'nombre': 'Metro Cúbico',
            'nombre_plural': 'Metros Cúbicos',
            'simbolo': 'm³',
            'categoria': 'VOLUMEN',
            'decimales_display': 2,
            'orden_display': 10,
            'es_sistema': True,
            'factor_conversion': Decimal('1.0'),
        },
        {
            'codigo': 'LT',
            'nombre': 'Litro',
            'nombre_plural': 'Litros',
            'simbolo': 'L',
            'categoria': 'VOLUMEN',
            'decimales_display': 2,
            'orden_display': 5,
            'es_sistema': True,
            'factor_conversion': Decimal('0.001'),
            'unidad_base_codigo': 'M3',
        },

        # CANTIDAD - Base: UND
        {
            'codigo': 'UND',
            'nombre': 'Unidad',
            'nombre_plural': 'Unidades',
            'simbolo': 'und',
            'categoria': 'CANTIDAD',
            'decimales_display': 0,
            'orden_display': 10,
            'es_sistema': True,
            'factor_conversion': Decimal('1.0'),
        },
        {
            'codigo': 'PZA',
            'nombre': 'Pieza',
            'nombre_plural': 'Piezas',
            'simbolo': 'pza',
            'categoria': 'CANTIDAD',
            'decimales_display': 0,
            'orden_display': 20,
            'es_sistema': True,
            'factor_conversion': Decimal('1.0'),
        },
        {
            'codigo': 'DOC',
            'nombre': 'Docena',
            'nombre_plural': 'Docenas',
            'simbolo': 'doc',
            'categoria': 'CANTIDAD',
            'decimales_display': 0,
            'orden_display': 30,
            'es_sistema': True,
            'factor_conversion': Decimal('12'),
            'unidad_base_codigo': 'UND',
        },
        {
            'codigo': 'CIENTO',
            'nombre': 'Ciento',
            'nombre_plural': 'Cientos',
            'simbolo': 'cto',
            'categoria': 'CANTIDAD',
            'decimales_display': 0,
            'orden_display': 40,
            'es_sistema': True,
            'factor_conversion': Decimal('100'),
            'unidad_base_codigo': 'UND',
        },

        # TIEMPO - Base: HORA
        {
            'codigo': 'HORA',
            'nombre': 'Hora',
            'nombre_plural': 'Horas',
            'simbolo': 'hr',
            'categoria': 'TIEMPO',
            'decimales_display': 2,
            'orden_display': 10,
            'es_sistema': True,
            'factor_conversion': Decimal('1.0'),
        },
        {
            'codigo': 'DIA',
            'nombre': 'Día',
            'nombre_plural': 'Días',
            'simbolo': 'día',
            'categoria': 'TIEMPO',
            'decimales_display': 0,
            'orden_display': 20,
            'es_sistema': True,
            'factor_conversion': Decimal('24'),
            'unidad_base_codigo': 'HORA',
        },

        # CONTENEDOR / EMBALAJE
        {
            'codigo': 'PALLET',
            'nombre': 'Pallet',
            'nombre_plural': 'Pallets',
            'simbolo': 'plt',
            'categoria': 'CONTENEDOR',
            'decimales_display': 0,
            'orden_display': 10,
            'es_sistema': True,
            'factor_conversion': Decimal('1.0'),
        },
        {
            'codigo': 'CAJA',
            'nombre': 'Caja',
            'nombre_plural': 'Cajas',
            'simbolo': 'cja',
            'categoria': 'CONTENEDOR',
            'decimales_display': 0,
            'orden_display': 20,
            'es_sistema': True,
            'factor_conversion': Decimal('1.0'),
        },
        {
            'codigo': 'CONTENEDOR',
            'nombre': 'Contenedor',
            'nombre_plural': 'Contenedores',
            'simbolo': 'cont',
            'categoria': 'CONTENEDOR',
            'decimales_display': 0,
            'orden_display': 30,
            'es_sistema': True,
            'factor_conversion': Decimal('1.0'),
        },
    ]

    # Primera pasada: Crear unidades base (sin unidad_base)
    unidades_creadas = {}
    for data in unidades_sistema:
        codigo = data['codigo']
        unidad_base_codigo = data.pop('unidad_base_codigo', None)

        if not unidad_base_codigo:
            # Unidad base, crear inmediatamente
            unidad = UnidadMedida.objects.create(**data)
            unidades_creadas[codigo] = unidad

    # Segunda pasada: Crear unidades derivadas (con unidad_base)
    for data in unidades_sistema:
        codigo = data['codigo']
        if codigo in unidades_creadas:
            continue  # Ya fue creada

        # Obtener datos nuevamente
        data_copy = next(d for d in unidades_sistema if d['codigo'] == codigo)
        unidad_base_codigo = data_copy.get('unidad_base_codigo')

        if unidad_base_codigo:
            unidad_base = unidades_creadas.get(unidad_base_codigo)
            if unidad_base:
                data_copy_clean = {k: v for k, v in data_copy.items() if k != 'unidad_base_codigo'}
                unidad = UnidadMedida.objects.create(
                    unidad_base=unidad_base,
                    **data_copy_clean
                )
                unidades_creadas[codigo] = unidad


def migrar_capacidades_existentes(apps, schema_editor):
    """
    Migra las capacidades existentes de capacidad_almacenamiento_kg
    al nuevo sistema dinámico.
    """
    SedeEmpresa = apps.get_model('configuracion', 'SedeEmpresa')
    UnidadMedida = apps.get_model('configuracion', 'UnidadMedida')

    # Obtener unidad KG
    try:
        unidad_kg = UnidadMedida.objects.get(codigo='KG')
    except UnidadMedida.DoesNotExist:
        # Si no existe KG, no podemos migrar
        return

    # Migrar todas las sedes con capacidad_almacenamiento_kg
    sedes = SedeEmpresa.objects.exclude(capacidad_almacenamiento_kg__isnull=True)

    for sede in sedes:
        if sede.capacidad_almacenamiento is None:
            sede.capacidad_almacenamiento = sede.capacidad_almacenamiento_kg
            sede.unidad_capacidad = unidad_kg
            sede.save(update_fields=['capacidad_almacenamiento', 'unidad_capacidad'])


def configurar_unidad_default_empresa(apps, schema_editor):
    """
    Configura la unidad de capacidad default en EmpresaConfig.
    """
    EmpresaConfig = apps.get_model('configuracion', 'EmpresaConfig')
    UnidadMedida = apps.get_model('configuracion', 'UnidadMedida')

    # Obtener instancia de empresa
    empresa = EmpresaConfig.objects.first()
    if not empresa:
        return

    # Configurar KG como unidad default si no tiene una
    if not empresa.unidad_capacidad_default:
        try:
            unidad_kg = UnidadMedida.objects.get(codigo='KG')
            empresa.unidad_capacidad_default = unidad_kg
            empresa.save(update_fields=['unidad_capacidad_default'])
        except UnidadMedida.DoesNotExist:
            pass


class Migration(migrations.Migration):

    dependencies = [
        ('configuracion', '0007_alter_integracionexterna_created_by_and_more'),
        ('core', '0001_initial'),
    ]

    operations = [
        # 1. Crear modelo UnidadMedida
        migrations.CreateModel(
            name='UnidadMedida',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Fecha de Actualización')),
                ('is_active', models.BooleanField(default=True, verbose_name='Activo')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='Fecha de Eliminación')),
                ('codigo', models.CharField(db_index=True, help_text='Código único de la unidad (ej: KG, TON, M3, UND)', max_length=20, unique=True, verbose_name='Código')),
                ('nombre', models.CharField(help_text='Nombre completo de la unidad (ej: Kilogramo, Tonelada)', max_length=100, verbose_name='Nombre')),
                ('nombre_plural', models.CharField(blank=True, help_text='Nombre en plural (ej: Kilogramos, Toneladas). Si vacío, se agrega "s"', max_length=100, verbose_name='Nombre Plural')),
                ('simbolo', models.CharField(help_text='Símbolo o abreviatura (ej: kg, ton, m³, hrs)', max_length=10, verbose_name='Símbolo')),
                ('categoria', models.CharField(choices=[('MASA', 'Masa / Peso'), ('VOLUMEN', 'Volumen'), ('LONGITUD', 'Longitud'), ('AREA', 'Área'), ('CANTIDAD', 'Cantidad / Unidades'), ('TIEMPO', 'Tiempo'), ('CONTENEDOR', 'Contenedores / Embalaje'), ('OTRO', 'Otro')], db_index=True, help_text='Categoría de la unidad de medida', max_length=20, verbose_name='Categoría')),
                ('factor_conversion', models.DecimalField(decimal_places=10, default=Decimal('1.0'), help_text='Factor para convertir a unidad base (ej: 1 ton = 1000 kg → factor: 1000)', max_digits=20, verbose_name='Factor de Conversión')),
                ('decimales_display', models.IntegerField(default=2, help_text='Cantidad de decimales para mostrar (0-6)', verbose_name='Decimales para Display')),
                ('prefiere_notacion_cientifica', models.BooleanField(default=False, help_text='Usar notación científica para valores muy grandes/pequeños', verbose_name='Notación Científica')),
                ('usar_separador_miles', models.BooleanField(default=True, help_text='Formatear con separador de miles (ej: 1,200 vs 1200)', verbose_name='Usar Separador de Miles')),
                ('descripcion', models.TextField(blank=True, help_text='Descripción o notas sobre la unidad', null=True, verbose_name='Descripción')),
                ('es_sistema', models.BooleanField(default=False, help_text='Unidad precargada del sistema (no editable por usuarios)', verbose_name='Es del Sistema')),
                ('orden_display', models.IntegerField(default=0, help_text='Orden para mostrar en listas (menor primero)', verbose_name='Orden de Visualización')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created', to='core.user', verbose_name='Creado por')),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated', to='core.user', verbose_name='Actualizado por')),
                ('unidad_base', models.ForeignKey(blank=True, help_text='Unidad base para conversión (ej: kg es base de ton)', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='unidades_derivadas', to='configuracion.unidadmedida', verbose_name='Unidad Base')),
            ],
            options={
                'verbose_name': 'Unidad de Medida',
                'verbose_name_plural': 'Unidades de Medida',
                'db_table': 'configuracion_unidad_medida',
                'ordering': ['categoria', 'orden_display', 'nombre'],
            },
        ),

        # 2. Agregar índices a UnidadMedida
        migrations.AddIndex(
            model_name='unidadmedida',
            index=models.Index(fields=['codigo'], name='configuraci_codigo_idx001'),
        ),
        migrations.AddIndex(
            model_name='unidadmedida',
            index=models.Index(fields=['categoria', 'is_active'], name='configuraci_categor_idx002'),
        ),
        migrations.AddIndex(
            model_name='unidadmedida',
            index=models.Index(fields=['es_sistema'], name='configuraci_es_sist_idx003'),
        ),
        migrations.AddIndex(
            model_name='unidadmedida',
            index=models.Index(fields=['deleted_at'], name='configuraci_deleted_idx004'),
        ),

        # 3. Agregar campo unidad_capacidad_default a EmpresaConfig
        migrations.AddField(
            model_name='empresaconfig',
            name='unidad_capacidad_default',
            field=models.ForeignKey(blank=True, help_text='Unidad de medida predeterminada para capacidad de almacenamiento (ej: kg, ton, m³)', null=True, on_delete=django.db.models.deletion.PROTECT, related_name='empresas_capacidad_default', to='configuracion.unidadmedida', verbose_name='Unidad de Capacidad por Defecto'),
        ),

        # 4. Agregar campos nuevos a SedeEmpresa
        migrations.AddField(
            model_name='sedeempresa',
            name='capacidad_almacenamiento',
            field=models.DecimalField(blank=True, decimal_places=2, help_text='Capacidad máxima de almacenamiento (cantidad numérica)', max_digits=12, null=True, verbose_name='Capacidad de Almacenamiento'),
        ),
        migrations.AddField(
            model_name='sedeempresa',
            name='unidad_capacidad',
            field=models.ForeignKey(blank=True, help_text='Unidad de medida de la capacidad (ej: kg, ton, m³, pallets)', null=True, on_delete=django.db.models.deletion.PROTECT, related_name='sedes_capacidad', to='configuracion.unidadmedida', verbose_name='Unidad de Capacidad'),
        ),

        # 5. Modificar campo deprecated (cambiar help_text)
        migrations.AlterField(
            model_name='sedeempresa',
            name='capacidad_almacenamiento_kg',
            field=models.DecimalField(blank=True, decimal_places=2, help_text='DEPRECATED: Use capacidad_almacenamiento + unidad_capacidad', max_digits=12, null=True, verbose_name='[DEPRECATED] Capacidad de Almacenamiento (kg)'),
        ),

        # 6. Cargar unidades del sistema
        migrations.RunPython(
            cargar_unidades_sistema,
            reverse_code=migrations.RunPython.noop,
        ),

        # 7. Migrar capacidades existentes
        migrations.RunPython(
            migrar_capacidades_existentes,
            reverse_code=migrations.RunPython.noop,
        ),

        # 8. Configurar unidad default en empresa
        migrations.RunPython(
            configurar_unidad_default_empresa,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
