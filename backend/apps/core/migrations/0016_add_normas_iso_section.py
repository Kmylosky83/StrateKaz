# Generated manually on 2026-01-20
# Migración de datos para agregar la sección "Normas" (Normas y Sistemas de Gestión)
# al tab de Configuración en Gestión Estratégica

from django.db import migrations


def create_normas_iso_section(apps, schema_editor):
    """
    Crea la sección 'Normas' (Normas y Sistemas de Gestión) en el tab de Configuración
    """
    TabSection = apps.get_model('core', 'TabSection')
    ModuleTab = apps.get_model('core', 'ModuleTab')

    try:
        # Buscar el tab de Configuración en el módulo Gestión Estratégica
        # Tab code: 'configuracion' en módulo 'gestion_estrategica'
        configuracion_tab = ModuleTab.objects.get(code='configuracion')

        # Verificar si la sección ya existe
        exists = TabSection.objects.filter(
            tab=configuracion_tab,
            code='normas-iso'
        ).exists()

        if not exists:
            # Crear la sección
            TabSection.objects.create(
                tab=configuracion_tab,
                code='normas-iso',
                name='Normas',  # Nombre de una sola palabra
                description='ISO, PESV, SG-SST y otras normativas aplicables',
                icon='ShieldCheck',
                orden=4,  # Después de Integraciones (3)
                is_enabled=True,
                is_core=False,
            )
            print("✅ Sección 'Normas' creada exitosamente")
        else:
            print("ℹ️  Sección 'Normas' ya existe")

    except ModuleTab.DoesNotExist:
        print("⚠️  Tab 'configuracion' no encontrado. Ejecuta primero las migraciones del sistema de módulos.")
    except Exception as e:
        print(f"❌ Error al crear sección: {e}")


def reverse_normas_iso_section(apps, schema_editor):
    """
    Elimina la sección 'Normas'
    """
    TabSection = apps.get_model('core', 'TabSection')

    TabSection.objects.filter(code='normas-iso').delete()
    print("✅ Sección 'Normas' eliminada")


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0015_add_twofactorauth'),
    ]

    operations = [
        migrations.RunPython(
            create_normas_iso_section,
            reverse_normas_iso_section
        ),
    ]
