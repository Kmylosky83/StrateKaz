# Generated manually - Fix FK constraint pointing to wrong table

from django.db import migrations, connection


def drop_old_fk_constraint(apps, schema_editor):
    """
    Elimina la FK vieja que apunta a motor_riesgos_analisis_dofa.
    MySQL no soporta IF EXISTS para DROP FOREIGN KEY, así que
    primero verificamos si existe.
    """
    with connection.cursor() as cursor:
        # Obtener el nombre de la constraint actual
        cursor.execute("""
            SELECT CONSTRAINT_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'encuestas_dofa'
              AND COLUMN_NAME = 'analisis_dofa_id'
              AND REFERENCED_TABLE_NAME IS NOT NULL
        """)
        result = cursor.fetchone()

        if result:
            constraint_name = result[0]
            print(f"Eliminando FK existente: {constraint_name}")
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            cursor.execute(f"ALTER TABLE `encuestas_dofa` DROP FOREIGN KEY `{constraint_name}`")
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
        else:
            print("No se encontró FK existente para analisis_dofa_id")


def create_new_fk_constraint(apps, schema_editor):
    """
    Crea la nueva FK que apunta a contexto_analisis_dofa.
    """
    with connection.cursor() as cursor:
        print("Creando nueva FK hacia contexto_analisis_dofa")
        cursor.execute("""
            ALTER TABLE `encuestas_dofa`
            ADD CONSTRAINT `encuestas_dofa_analisis_dofa_id_fk_contexto`
            FOREIGN KEY (`analisis_dofa_id`)
            REFERENCES `contexto_analisis_dofa` (`id`)
            ON DELETE CASCADE
        """)


class Migration(migrations.Migration):
    """
    Corrige la FK de analisis_dofa que apunta a motor_riesgos_analisis_dofa
    en lugar de contexto_analisis_dofa (gestion_estrategica_contexto.AnalisisDOFA).

    El problema es que la tabla encuestas_dofa se creó con una constraint
    que referencia la tabla antigua motor_riesgos_analisis_dofa.
    """

    dependencies = [
        ('encuestas', '0001_initial'),
        ('gestion_estrategica_contexto', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(drop_old_fk_constraint, migrations.RunPython.noop),
        migrations.RunPython(create_new_fk_constraint, migrations.RunPython.noop),
    ]
