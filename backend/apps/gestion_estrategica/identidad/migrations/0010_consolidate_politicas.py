"""
Migración para consolidar PoliticaIntegral en PoliticaEspecifica.

Esta migración:
1. Agrega campos nuevos a PoliticaEspecifica (signature_hash, expiry_date, change_reason, is_integral_policy)
2. Migra datos de PoliticaIntegral a PoliticaEspecifica
3. Actualiza ProcesoFirmaPolitica para apuntar a las nuevas políticas
4. Elimina campos obsoletos de ProcesoFirmaPolitica
5. Elimina el modelo PoliticaIntegral

Fecha: 2026-01-12
Versión: 3.1
"""
from django.db import migrations, models
import django.db.models.deletion


def migrate_politica_integral_to_especifica(apps, schema_editor):
    """
    Migra todos los registros de PoliticaIntegral a PoliticaEspecifica.
    Cada PoliticaIntegral se crea como PoliticaEspecifica con is_integral_policy=True.
    """
    PoliticaIntegral = apps.get_model('identidad', 'PoliticaIntegral')
    PoliticaEspecifica = apps.get_model('identidad', 'PoliticaEspecifica')

    migrated_count = 0
    for pol_int in PoliticaIntegral.objects.all():
        # Verificar si ya existe una política específica equivalente
        existing = PoliticaEspecifica.objects.filter(
            identity_id=pol_int.identity_id,
            is_integral_policy=True,
            version=pol_int.version
        ).first()

        if existing:
            print(f"  -> Politica integral v{pol_int.version} ya migrada, saltando...")
            continue

        # Crear PoliticaEspecifica equivalente
        pol_esp = PoliticaEspecifica(
            identity_id=pol_int.identity_id,
            title=pol_int.title,
            content=pol_int.content,
            version=pol_int.version,
            status=pol_int.status,
            effective_date=pol_int.effective_date,
            expiry_date=pol_int.expiry_date,
            review_date=pol_int.review_date,
            approved_by_id=pol_int.signed_by_id,
            approved_at=pol_int.signed_at,
            signature_hash=pol_int.signature_hash,
            change_reason=pol_int.change_reason,
            document_file=pol_int.document_file,
            is_integral_policy=True,
            is_active=pol_int.is_active,
            orden=pol_int.orden,
            created_by_id=pol_int.created_by_id,
            updated_by_id=pol_int.updated_by_id,
        )
        # No podemos asignar created_at/updated_at directamente en el modelo
        pol_esp.save()

        # Guardar el mapeo viejo_id -> nuevo_id para la migración de procesos
        pol_int._new_politica_especifica_id = pol_esp.id
        migrated_count += 1

    print(f"  -> Migradas {migrated_count} politicas integrales a PoliticaEspecifica")


def migrate_procesos_firma(apps, schema_editor):
    """
    Actualiza los procesos de firma que apuntan a PoliticaIntegral
    para que apunten a la nueva PoliticaEspecifica equivalente.
    """
    ProcesoFirmaPolitica = apps.get_model('identidad', 'ProcesoFirmaPolitica')
    PoliticaIntegral = apps.get_model('identidad', 'PoliticaIntegral')
    PoliticaEspecifica = apps.get_model('identidad', 'PoliticaEspecifica')

    updated_count = 0
    orphan_count = 0

    for proceso in ProcesoFirmaPolitica.objects.filter(
        politica_integral__isnull=False
    ):
        # Buscar la PoliticaIntegral original
        pol_int = proceso.politica_integral

        # Buscar la PoliticaEspecifica correspondiente
        pol_esp = PoliticaEspecifica.objects.filter(
            identity_id=pol_int.identity_id,
            is_integral_policy=True,
            version=pol_int.version
        ).first()

        if pol_esp:
            proceso.politica_especifica = pol_esp
            proceso.save()
            updated_count += 1
        else:
            orphan_count += 1
            print(f"  ! Proceso {proceso.id} sin politica equivalente encontrada")

    print(f"  -> Actualizados {updated_count} procesos de firma")
    if orphan_count > 0:
        print(f"  ! {orphan_count} procesos huerfanos (requieren revision manual)")


def reverse_migration(apps, schema_editor):
    """
    Rollback: No elimina datos, solo informa que las políticas migradas
    permanecerán en PoliticaEspecifica con is_integral_policy=True.
    """
    print("  -> Rollback: Las PoliticaEspecifica con is_integral_policy=True se mantienen")
    print("  -> Si necesita eliminarlas, hagalo manualmente")


class Migration(migrations.Migration):

    dependencies = [
        ('identidad', '0009_dynamic_config_models'),
    ]

    operations = [
        # =====================================================================
        # NOTA: Los campos (signature_hash, expiry_date, change_reason,
        # is_integral_policy) ya existen en la tabla - fueron agregados
        # previamente. Solo ejecutamos la migracion de datos.
        # =====================================================================

        # =====================================================================
        # FASE 2: Migrar datos
        # =====================================================================
        migrations.RunPython(
            migrate_politica_integral_to_especifica,
            reverse_code=reverse_migration
        ),
        migrations.RunPython(
            migrate_procesos_firma,
            reverse_code=migrations.RunPython.noop
        ),

        # =====================================================================
        # FASE 3: Actualizar ProcesoFirmaPolitica
        # Primero hacemos nullable el campo politica_especifica si no lo es,
        # luego renombramos, y finalmente eliminamos los campos obsoletos
        # =====================================================================

        # Renombrar politica_especifica a politica
        migrations.RenameField(
            model_name='procesofirmapolitica',
            old_name='politica_especifica',
            new_name='politica',
        ),

        # Eliminar campo politica_integral (ya no necesario)
        migrations.RemoveField(
            model_name='procesofirmapolitica',
            name='politica_integral',
        ),

        # Eliminar campo tipo_politica (ya no necesario, usamos is_integral_policy)
        migrations.RemoveField(
            model_name='procesofirmapolitica',
            name='tipo_politica',
        ),

        # =====================================================================
        # FASE 4: Eliminar modelo PoliticaIntegral
        # =====================================================================
        migrations.DeleteModel(
            name='PoliticaIntegral',
        ),
    ]
