# Generated migration for SedeEmpresa model and TabSection
from django.db import migrations, models
import django.db.models.deletion


def add_sedes_section(apps, schema_editor):
    """
    Agrega la sección 'Sedes y Ubicaciones' al tab Configuración
    después de la sección 'empresa'
    """
    ModuleTab = apps.get_model('core', 'ModuleTab')
    TabSection = apps.get_model('core', 'TabSection')

    try:
        tab_configuracion = ModuleTab.objects.get(code='configuracion')
    except ModuleTab.DoesNotExist:
        return

    # Verificar si ya existe la sección
    if TabSection.objects.filter(tab=tab_configuracion, code='sedes').exists():
        return

    # Obtener el orden de la sección 'empresa' (debería ser 1)
    # Usar 'orden' ya que el campo fue renombrado de 'order' a 'orden'
    empresa_section = TabSection.objects.filter(
        tab=tab_configuracion, code='empresa'
    ).first()
    new_orden = (empresa_section.orden + 1) if empresa_section else 2

    # Mover las secciones posteriores
    TabSection.objects.filter(
        tab=tab_configuracion,
        orden__gte=new_orden
    ).update(orden=models.F('orden') + 1)

    # Crear la sección de sedes
    TabSection.objects.create(
        tab=tab_configuracion,
        code='sedes',
        name='Sedes y Ubicaciones',
        description='Gestión de sedes, plantas, sucursales y ubicaciones de la empresa',
        icon='MapPin',
        orden=new_orden,
        is_enabled=True,
        is_core=True
    )


def remove_sedes_section(apps, schema_editor):
    """Elimina la sección 'sedes' del tab Configuración"""
    TabSection = apps.get_model('core', 'TabSection')
    ModuleTab = apps.get_model('core', 'ModuleTab')

    try:
        tab_configuracion = ModuleTab.objects.get(code='configuracion')
        TabSection.objects.filter(tab=tab_configuracion, code='sedes').delete()
    except ModuleTab.DoesNotExist:
        pass


class Migration(migrations.Migration):

    dependencies = [
        ('configuracion', '0002_add_empresa_tabsection'),
        ('core', '0008_populate_system_modules_tree'),
    ]

    operations = [
        # Crear el modelo SedeEmpresa
        migrations.CreateModel(
            name='SedeEmpresa',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('codigo', models.CharField(db_index=True, help_text='Código único de la sede (ej: SEDE-001, PLANTA-BOG)', max_length=20, unique=True, verbose_name='Código')),
                ('nombre', models.CharField(help_text='Nombre de la sede', max_length=150, verbose_name='Nombre')),
                ('tipo_sede', models.CharField(
                    choices=[
                        ('SEDE_PRINCIPAL', 'Sede Principal'),
                        ('SEDE', 'Sede Administrativa'),
                        ('SUCURSAL', 'Sucursal'),
                        ('PLANTA', 'Planta de Producción'),
                        ('CENTRO_ACOPIO', 'Centro de Acopio'),
                        ('ALMACEN', 'Almacén'),
                        ('PUNTO_VENTA', 'Punto de Venta'),
                        ('BODEGA', 'Bodega'),
                        ('OTRO', 'Otro'),
                    ],
                    default='SEDE',
                    help_text='Tipo de sede o ubicación',
                    max_length=20,
                    verbose_name='Tipo de Sede'
                )),
                ('descripcion', models.TextField(blank=True, help_text='Descripción detallada de la sede', null=True, verbose_name='Descripción')),
                ('direccion', models.TextField(help_text='Dirección física de la sede', verbose_name='Dirección')),
                ('ciudad', models.CharField(max_length=100, verbose_name='Ciudad')),
                ('departamento', models.CharField(
                    choices=[
                        ('AMAZONAS', 'Amazonas'),
                        ('ANTIOQUIA', 'Antioquia'),
                        ('ARAUCA', 'Arauca'),
                        ('ATLANTICO', 'Atlántico'),
                        ('BOLIVAR', 'Bolívar'),
                        ('BOYACA', 'Boyacá'),
                        ('CALDAS', 'Caldas'),
                        ('CAQUETA', 'Caquetá'),
                        ('CASANARE', 'Casanare'),
                        ('CAUCA', 'Cauca'),
                        ('CESAR', 'Cesar'),
                        ('CHOCO', 'Chocó'),
                        ('CORDOBA', 'Córdoba'),
                        ('CUNDINAMARCA', 'Cundinamarca'),
                        ('GUAINIA', 'Guainía'),
                        ('GUAVIARE', 'Guaviare'),
                        ('HUILA', 'Huila'),
                        ('LA_GUAJIRA', 'La Guajira'),
                        ('MAGDALENA', 'Magdalena'),
                        ('META', 'Meta'),
                        ('NARINO', 'Nariño'),
                        ('NORTE_DE_SANTANDER', 'Norte de Santander'),
                        ('PUTUMAYO', 'Putumayo'),
                        ('QUINDIO', 'Quindío'),
                        ('RISARALDA', 'Risaralda'),
                        ('SAN_ANDRES', 'San Andrés y Providencia'),
                        ('SANTANDER', 'Santander'),
                        ('SUCRE', 'Sucre'),
                        ('TOLIMA', 'Tolima'),
                        ('VALLE_DEL_CAUCA', 'Valle del Cauca'),
                        ('VAUPES', 'Vaupés'),
                        ('VICHADA', 'Vichada'),
                    ],
                    max_length=50,
                    verbose_name='Departamento'
                )),
                ('codigo_postal', models.CharField(blank=True, max_length=10, null=True, verbose_name='Código Postal')),
                ('latitud', models.DecimalField(blank=True, decimal_places=8, help_text='Coordenada de latitud GPS (ej: 4.60971)', max_digits=10, null=True, verbose_name='Latitud')),
                ('longitud', models.DecimalField(blank=True, decimal_places=8, help_text='Coordenada de longitud GPS (ej: -74.08175)', max_digits=11, null=True, verbose_name='Longitud')),
                ('telefono', models.CharField(blank=True, help_text='Teléfono de contacto de la sede', max_length=20, null=True, verbose_name='Teléfono')),
                ('email', models.EmailField(blank=True, help_text='Email de contacto de la sede', max_length=254, null=True, verbose_name='Email')),
                ('es_sede_principal', models.BooleanField(default=False, help_text='Solo puede haber una sede principal', verbose_name='Es Sede Principal')),
                ('fecha_apertura', models.DateField(blank=True, help_text='Fecha de apertura o inicio de operaciones', null=True, verbose_name='Fecha de Apertura')),
                ('fecha_cierre', models.DateField(blank=True, help_text='Fecha de cierre (si aplica)', null=True, verbose_name='Fecha de Cierre')),
                ('capacidad_almacenamiento_kg', models.DecimalField(blank=True, decimal_places=2, help_text='Capacidad máxima de almacenamiento en kilogramos', max_digits=12, null=True, verbose_name='Capacidad de Almacenamiento (kg)')),
                ('is_active', models.BooleanField(db_index=True, default=True, help_text='Si la sede está activa', verbose_name='Activo')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Última Actualización')),
                ('deleted_at', models.DateTimeField(blank=True, help_text='Fecha de eliminación lógica (soft delete)', null=True, verbose_name='Fecha de Eliminación')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='sedes_creadas', to='core.user', verbose_name='Creado por')),
                ('responsable', models.ForeignKey(blank=True, help_text='Usuario responsable de la sede', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='sedes_responsable', to='core.user', verbose_name='Responsable')),
            ],
            options={
                'verbose_name': 'Sede de la Empresa',
                'verbose_name_plural': 'Sedes de la Empresa',
                'db_table': 'configuracion_sede_empresa',
                'ordering': ['-es_sede_principal', 'nombre'],
            },
        ),
        # Índices
        migrations.AddIndex(
            model_name='sedeempresa',
            index=models.Index(fields=['codigo'], name='configuraci_codigo_sede_idx'),
        ),
        migrations.AddIndex(
            model_name='sedeempresa',
            index=models.Index(fields=['is_active', 'tipo_sede'], name='configuraci_active_tipo_idx'),
        ),
        migrations.AddIndex(
            model_name='sedeempresa',
            index=models.Index(fields=['departamento', 'ciudad'], name='configuraci_depto_ciudad_idx'),
        ),
        migrations.AddIndex(
            model_name='sedeempresa',
            index=models.Index(fields=['deleted_at'], name='configuraci_deleted_sede_idx'),
        ),
        # Agregar la sección al tab de Configuración
        migrations.RunPython(add_sedes_section, remove_sedes_section),
    ]
