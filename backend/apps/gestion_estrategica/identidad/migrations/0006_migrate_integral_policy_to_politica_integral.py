"""
Migración de datos: Trasladar integral_policy de CorporateIdentity a PoliticaIntegral

Esta migración:
1. Crea un registro PoliticaIntegral por cada CorporateIdentity que tenga integral_policy
2. Marca el campo integral_policy como deprecated
3. Preserva los datos originales para rollback

Fecha: 2026-01-10
"""
from django.db import migrations
from django.utils import timezone


def migrate_integral_policy_to_politica_integral(apps, schema_editor):
    """
    Migra los datos de integral_policy a PoliticaIntegral.
    Solo migra si no existe ya una PoliticaIntegral para esa identidad.
    """
    CorporateIdentity = apps.get_model('identidad', 'CorporateIdentity')
    PoliticaIntegral = apps.get_model('identidad', 'PoliticaIntegral')

    identities_migrated = 0

    for identity in CorporateIdentity.objects.filter(is_active=True):
        # Verificar si tiene contenido en integral_policy
        if not identity.integral_policy or not identity.integral_policy.strip():
            continue

        # Verificar si ya existe una PoliticaIntegral vigente
        existing = PoliticaIntegral.objects.filter(
            identity=identity,
            status='VIGENTE',
            is_active=True
        ).exists()

        if existing:
            continue

        # Crear nueva PoliticaIntegral con los datos legacy
        PoliticaIntegral.objects.create(
            identity=identity,
            title='Política Integral del Sistema de Gestión',
            content=identity.integral_policy,
            version=identity.version or '1.0',
            status='VIGENTE',  # Marcar como vigente ya que era el contenido activo
            effective_date=identity.effective_date or timezone.now().date(),
            # Preservar firma si existía
            signed_by_id=identity.policy_signed_by_id if hasattr(identity, 'policy_signed_by_id') else None,
            signed_at=identity.policy_signed_at if hasattr(identity, 'policy_signed_at') else None,
            signature_hash=identity.policy_signature_hash if hasattr(identity, 'policy_signature_hash') else None,
            created_by_id=identity.created_by_id if hasattr(identity, 'created_by_id') else None,
            is_active=True,
            orden=1,
        )
        identities_migrated += 1

    if identities_migrated > 0:
        print(f"\n  → Migradas {identities_migrated} políticas integrales de CorporateIdentity a PoliticaIntegral")


def reverse_migration(apps, schema_editor):
    """
    Rollback: No eliminamos las PoliticaIntegral creadas, solo informamos.
    Los datos originales siguen en integral_policy.
    """
    print("\n  → Rollback: Los datos originales permanecen en integral_policy")
    print("  → Las PoliticaIntegral creadas se mantienen (eliminar manualmente si es necesario)")


class Migration(migrations.Migration):
    """
    Migración para trasladar datos legacy de integral_policy a PoliticaIntegral.
    """

    dependencies = [
        ('identidad', '0005_alter_corporateidentity_integral_policy_and_more'),
    ]

    operations = [
        migrations.RunPython(
            migrate_integral_policy_to_politica_integral,
            reverse_migration,
        ),
    ]
