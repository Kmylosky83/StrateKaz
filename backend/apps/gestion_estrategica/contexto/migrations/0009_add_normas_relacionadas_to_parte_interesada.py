# Generated manually - Add dynamic normas relationship to ParteInteresada

from django.db import migrations, models


def migrate_boolean_to_m2m(apps, schema_editor):
    """
    Migra los campos booleanos hardcodeados a relaciones M2M con NormaISO.
    Busca las normas por código y las asocia según los valores booleanos existentes.
    """
    ParteInteresada = apps.get_model('gestion_estrategica_contexto', 'ParteInteresada')
    NormaISO = apps.get_model('configuracion', 'NormaISO')

    # Mapeo de campos booleanos a códigos de norma
    MAPPING = {
        'relacionado_sst': 'ISO45001',
        'relacionado_ambiental': 'ISO14001',
        'relacionado_calidad': 'ISO9001',
        'relacionado_pesv': 'PESV',
    }

    for parte in ParteInteresada.objects.all():
        normas_to_add = []
        for campo, codigo in MAPPING.items():
            if getattr(parte, campo, False):
                try:
                    norma = NormaISO.objects.get(code=codigo)
                    normas_to_add.append(norma)
                except NormaISO.DoesNotExist:
                    # La norma no existe, se ignora
                    print(f"Norma {codigo} no encontrada para {parte.nombre}")
                    pass

        if normas_to_add:
            parte.normas_relacionadas.set(normas_to_add)
            print(f"Migradas {len(normas_to_add)} normas para {parte.nombre}")


def reverse_m2m_to_boolean(apps, schema_editor):
    """
    Operación inversa: convierte M2M de vuelta a booleanos.
    """
    ParteInteresada = apps.get_model('gestion_estrategica_contexto', 'ParteInteresada')

    REVERSE_MAPPING = {
        'ISO45001': 'relacionado_sst',
        'ISO14001': 'relacionado_ambiental',
        'ISO9001': 'relacionado_calidad',
        'PESV': 'relacionado_pesv',
    }

    for parte in ParteInteresada.objects.all():
        for norma in parte.normas_relacionadas.all():
            campo = REVERSE_MAPPING.get(norma.code)
            if campo:
                setattr(parte, campo, True)
        parte.save()


class Migration(migrations.Migration):
    """
    Agrega campo M2M normas_relacionadas a ParteInteresada.

    Esto permite asociar dinámicamente cualquier norma ISO configurada
    en el sistema, en lugar de tener campos booleanos hardcodeados
    (relacionado_sst, relacionado_ambiental, etc).

    Los campos booleanos se mantienen temporalmente por retrocompatibilidad,
    se pueden eliminar en una migración posterior una vez validada la migración.
    """

    dependencies = [
        ('gestion_estrategica_contexto', '0008_rename_contexto_ma_empresa_b8c5f1_idx_contexto_ma_empresa_0d87fa_idx_and_more'),
        ('configuracion', '0002_initial'),  # Asegurar que NormaISO existe
    ]

    operations = [
        # 1. Agregar el campo M2M
        migrations.AddField(
            model_name='parteinteresada',
            name='normas_relacionadas',
            field=models.ManyToManyField(
                blank=True,
                help_text='Normas ISO o sistemas de gestión con los que esta parte interesada tiene relación',
                related_name='partes_interesadas_relacionadas',
                to='configuracion.normaiso',
                verbose_name='Sistemas de Gestión Relacionados',
            ),
        ),
        # 2. Migrar datos de booleanos a M2M
        migrations.RunPython(migrate_boolean_to_m2m, reverse_m2m_to_boolean),
    ]
