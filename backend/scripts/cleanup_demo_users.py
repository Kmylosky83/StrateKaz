"""
Script para limpiar usuarios de demo en stratekaz_demo.
Ejecutar en VPS con:
    cd /opt/stratekaz/backend
    source venv/bin/activate
    DJANGO_SETTINGS_MODULE=config.settings.production python manage.py shell < scripts/cleanup_demo_users.py
"""
import django
from django.db import transaction
from django_tenants.utils import schema_context, tenant_context
from django.apps import apps

# ============================================================
# PASO 1: Limpiar dentro del tenant schema (stratekaz_demo)
# ============================================================
print("=" * 60)
print("LIMPIEZA DE USUARIOS - stratekaz_demo")
print("=" * 60)

with schema_context('stratekaz_demo'):
    from django.contrib.auth import get_user_model
    User = get_user_model()

    # Verificar que la tabla existe
    try:
        total = User.objects.count()
        print(f"\nTotal usuarios en tenant: {total}")
    except Exception as e:
        print(f"ERROR: No se puede acceder a User en stratekaz_demo: {e}")
        print("Verificar que las migraciones estan aplicadas.")
        import sys
        sys.exit(1)

    # Listar usuarios
    superadmins = User.objects.filter(is_superuser=True)
    regulars = User.objects.filter(is_superuser=False)

    print(f"\nSuperadmins (se conservan):")
    for u in superadmins:
        print(f"  [KEEP] {u.email} (id={u.id})")

    print(f"\nUsuarios regulares (se eliminan): {regulars.count()}")
    for u in regulars:
        print(f"  [DELETE] {u.email} (id={u.id}, cargo={u.cargo})")

    if regulars.count() == 0:
        print("\nNo hay usuarios regulares que eliminar.")
    else:
        # Intentar obtener modelos relacionados
        try:
            Colaborador = apps.get_model('colaboradores', 'Colaborador')
            colabs = Colaborador.objects.all()
            print(f"\nColaboradores a eliminar: {colabs.count()}")
            for c in colabs:
                print(f"  [DELETE] {c.primer_nombre} {c.primer_apellido} (doc={c.numero_identificacion})")
        except LookupError:
            print("\nWARNING: Modelo Colaborador no encontrado, se eliminan solo Users")
            Colaborador = None

        # Ejecutar limpieza
        with transaction.atomic():
            # 1. Eliminar Colaboradores (CASCADE borra HojaVida, InfoPersonal, HistorialLaboral)
            if Colaborador:
                deleted_colabs = Colaborador.objects.all().delete()
                print(f"\nColaboradores eliminados: {deleted_colabs}")

            # 2. Eliminar Users no-superadmin
            deleted_users = regulars.delete()
            print(f"Usuarios eliminados: {deleted_users}")

        print("\n--- Verificacion post-limpieza (tenant) ---")
        print(f"Users restantes: {User.objects.count()}")
        if Colaborador:
            print(f"Colaboradores restantes: {Colaborador.objects.count()}")

# ============================================================
# PASO 2: Limpiar TenantUser en schema public
# ============================================================
print("\n" + "=" * 60)
print("LIMPIEZA DE TENANT USERS - public schema")
print("=" * 60)

with schema_context('public'):
    try:
        TenantUser = apps.get_model('tenant', 'TenantUser')
        Tenant = apps.get_model('tenant', 'Tenant')

        # Encontrar el tenant stratekaz_demo
        try:
            demo_tenant = Tenant.objects.get(schema_name='stratekaz_demo')
            print(f"\nTenant: {demo_tenant.name} (schema={demo_tenant.schema_name})")
        except Tenant.DoesNotExist:
            print("ERROR: Tenant stratekaz_demo no existe")
            import sys
            sys.exit(1)

        # Listar TenantUsers con acceso a este tenant
        all_tenant_users = TenantUser.objects.filter(
            tenants=demo_tenant
        )
        print(f"\nTenantUsers con acceso a {demo_tenant.name}: {all_tenant_users.count()}")

        superadmin_tu = all_tenant_users.filter(is_superadmin=True)
        regular_tu = all_tenant_users.filter(is_superadmin=False)

        print(f"\nSuperadmin TenantUsers (se conservan):")
        for tu in superadmin_tu:
            print(f"  [KEEP] {tu.email} (id={tu.id})")

        print(f"\nRegular TenantUsers (se eliminan): {regular_tu.count()}")
        for tu in regular_tu:
            print(f"  [DELETE] {tu.email} (id={tu.id})")

        if regular_tu.count() > 0:
            with transaction.atomic():
                # Solo eliminar el acceso al tenant, no el TenantUser global
                # (podrian tener acceso a otros tenants)
                TenantUserAccess = apps.get_model('tenant', 'TenantUserAccess')

                for tu in regular_tu:
                    # Verificar si tiene acceso a otros tenants
                    other_tenants = tu.tenants.exclude(id=demo_tenant.id).count()
                    if other_tenants > 0:
                        # Solo remover acceso a este tenant
                        TenantUserAccess.objects.filter(
                            tenant_user=tu, tenant=demo_tenant
                        ).delete()
                        print(f"  Removido acceso de {tu.email} a {demo_tenant.name} (tiene {other_tenants} otros tenants)")
                    else:
                        # Sin otros tenants, eliminar completamente
                        tu.delete()
                        print(f"  Eliminado TenantUser {tu.email} completamente")

            print(f"\nTenantUsers restantes con acceso: {TenantUser.objects.filter(tenants=demo_tenant).count()}")
    except LookupError as e:
        print(f"WARNING: No se pudo acceder a TenantUser: {e}")

print("\n" + "=" * 60)
print("LIMPIEZA COMPLETADA")
print("=" * 60)
