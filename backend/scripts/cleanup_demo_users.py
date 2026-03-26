"""
Script para limpiar usuarios de un tenant.
Ejecutar en VPS con:
    cd /opt/stratekaz/backend
    source venv/bin/activate
    DJANGO_SETTINGS_MODULE=config.settings.production python manage.py shell < scripts/cleanup_demo_users.py
"""
import sys
from django.db import connection, transaction
from django_tenants.utils import schema_context
from django.apps import apps

# ============================================================
# PASO 0: Descubrir tenants disponibles
# ============================================================
print("=" * 60)
print("DESCUBRIMIENTO DE TENANTS")
print("=" * 60)

# Buscar tabla de tenants dinámicamente
tenant_table = None
with connection.cursor() as c:
    c.execute("""
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE '%%tenant%%'
        AND table_name NOT LIKE '%%user%%'
        AND table_name NOT LIKE '%%access%%'
        AND table_name NOT LIKE '%%domain%%'
        AND table_name NOT LIKE '%%plan%%'
        ORDER BY table_name;
    """)
    candidates = [r[0] for r in c.fetchall()]
    print(f"Tablas tenant candidatas: {candidates}")

    for candidate in candidates:
        try:
            c.execute(f"SELECT id, schema_name, name FROM public.{candidate} ORDER BY id;")
            tenants = c.fetchall()
            tenant_table = candidate
            break
        except Exception:
            connection.cursor()  # Reset cursor after error
            continue

if not tenant_table:
    print("ERROR: No se encontró tabla de tenants")
    sys.exit(1)

print(f"\nTabla de tenants: {tenant_table}")
print(f"\nTenants disponibles:")
for t in tenants:
    print(f"  id={t[0]} | schema={t[1]} | name={t[2]}")

# ============================================================
# SELECCIONAR TENANT A LIMPIAR
# ============================================================
# Buscar tenant demo (tenant_stratekaz)
TARGET_SCHEMA = None
for t in tenants:
    schema = t[1]
    if schema != 'public' and 'stratekaz' in schema.lower():
        TARGET_SCHEMA = schema
        TARGET_NAME = t[2]
        TARGET_ID = t[0]
        break

if not TARGET_SCHEMA:
    # Si no hay uno con 'stratekaz', tomar el primero que no sea public
    for t in tenants:
        if t[1] != 'public':
            TARGET_SCHEMA = t[1]
            TARGET_NAME = t[2]
            TARGET_ID = t[0]
            break

if not TARGET_SCHEMA:
    print("ERROR: No se encontró tenant para limpiar")
    sys.exit(1)

print(f"\n>>> Limpiando tenant: {TARGET_NAME} (schema={TARGET_SCHEMA})")

# ============================================================
# PASO 1: Limpiar dentro del tenant schema
# ============================================================
print("\n" + "=" * 60)
print(f"LIMPIEZA DE USUARIOS - {TARGET_SCHEMA}")
print("=" * 60)

with schema_context(TARGET_SCHEMA):
    from django.contrib.auth import get_user_model
    User = get_user_model()

    # Verificar que la tabla existe
    try:
        total = User.objects.count()
        print(f"\nTotal usuarios en tenant: {total}")
    except Exception as e:
        print(f"ERROR: No se puede acceder a User en {TARGET_SCHEMA}: {e}")
        print("Verificar que las migraciones estan aplicadas.")
        sys.exit(1)

    # Listar usuarios
    superadmins = User.objects.filter(is_superuser=True)
    regulars = User.objects.filter(is_superuser=False)

    print(f"\nSuperadmins (se conservan):")
    for u in superadmins:
        print(f"  [KEEP] {u.email} (id={u.id})")

    print(f"\nUsuarios regulares (se eliminan): {regulars.count()}")
    for u in regulars:
        cargo_name = u.cargo.name if u.cargo else 'Sin cargo'
        print(f"  [DELETE] {u.email} (id={u.id}, cargo={cargo_name})")

    if regulars.count() == 0:
        print("\nNo hay usuarios regulares que eliminar.")
    else:
        # Intentar obtener modelos relacionados
        Colaborador = None
        try:
            Colaborador = apps.get_model('colaboradores', 'Colaborador')
            colabs = Colaborador.objects.all()
            print(f"\nColaboradores a eliminar: {colabs.count()}")
            for c in colabs:
                print(f"  [DELETE] {c.primer_nombre} {c.primer_apellido} (doc={c.numero_identificacion})")
        except LookupError:
            print("\nWARNING: Modelo Colaborador no encontrado, se eliminan solo Users")

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

        # Encontrar el tenant por schema_name
        try:
            demo_tenant = Tenant.objects.get(schema_name=TARGET_SCHEMA)
            print(f"\nTenant: {demo_tenant.name} (schema={demo_tenant.schema_name})")
        except Tenant.DoesNotExist:
            print(f"WARNING: Tenant con schema {TARGET_SCHEMA} no encontrado en ORM. Saltando limpieza de TenantUser.")
            demo_tenant = None

        if demo_tenant:
            all_tenant_users = TenantUser.objects.filter(tenants=demo_tenant)
            print(f"\nTenantUsers con acceso: {all_tenant_users.count()}")

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
                    TenantUserAccess = apps.get_model('tenant', 'TenantUserAccess')

                    for tu in regular_tu:
                        other_tenants = tu.tenants.exclude(id=demo_tenant.id).count()
                        if other_tenants > 0:
                            TenantUserAccess.objects.filter(
                                tenant_user=tu, tenant=demo_tenant
                            ).delete()
                            print(f"  Removido acceso de {tu.email} (tiene {other_tenants} otros tenants)")
                        else:
                            tu.delete()
                            print(f"  Eliminado TenantUser {tu.email} completamente")

                print(f"\nTenantUsers restantes: {TenantUser.objects.filter(tenants=demo_tenant).count()}")
    except LookupError as e:
        print(f"WARNING: No se pudo acceder a TenantUser: {e}")
    except Exception as e:
        print(f"WARNING: Error en limpieza TenantUser: {e}")

print("\n" + "=" * 60)
print("LIMPIEZA COMPLETADA")
print("=" * 60)
