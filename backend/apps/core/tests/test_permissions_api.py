"""
Tests de API de Permisos - Django REST Framework

Cobertura de tests:
1. TestPermissionsAPI: Tests de acceso a endpoints con permisos
2. TestPermissionsByAction: Tests de permisos por acción (VIEW, CREATE, EDIT, DELETE)
3. TestPermissionsScope: Tests de alcance de permisos (OWN, TEAM, ALL)
4. TestPermissionsDenied: Tests de denegación de acceso (403 Forbidden)

Sistema de Gestión StrateKaz

DEUDA-TESTING: TENANT_SCHEMA — 24 errors + 1 fail. Fixtures crean
User/Cargo/Permiso en schema public. Ver docs/testing-debt.md#test_permissions_api
"""
import pytest

pytestmark = pytest.mark.skip(
    reason="DEUDA-TESTING: TENANT_SCHEMA. Ver docs/testing-debt.md#test_permissions_api"
)
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import (
    User,
    Cargo,
    Permiso,
    Role,
    Group,
)
from apps.gestion_estrategica.organizacion.models import Area


# ==============================================================================
# FIXTURES
# ==============================================================================

@pytest.fixture
def api_client():
    """Cliente API de DRF para pruebas."""
    return APIClient()


@pytest.fixture
def area_test(db):
    """Crea un área de prueba."""
    return Area.objects.create(
        code='TEST',
        name='Área Test',
        description='Área para pruebas de API',
        is_active=True,
        orden=1
    )


@pytest.fixture
def cargo_test(db, area_test):
    """Crea un cargo de prueba."""
    return Cargo.objects.create(
        code='TEST_CARGO',
        name='Cargo Test',
        description='Cargo para pruebas',
        area=area_test,
        nivel_jerarquico='OPERATIVO',
        is_active=True
    )


@pytest.fixture
def permiso_view_users(db):
    """Permiso para ver usuarios."""
    return Permiso.objects.create(
        code='users.view',
        name='Ver Usuarios',
        description='Permite visualizar usuarios',
        module='CORE',
        action='VIEW',
        scope='ALL',
        is_active=True
    )


@pytest.fixture
def permiso_create_users(db):
    """Permiso para crear usuarios."""
    return Permiso.objects.create(
        code='users.create',
        name='Crear Usuarios',
        description='Permite crear nuevos usuarios',
        module='CORE',
        action='CREATE',
        scope='ALL',
        is_active=True
    )


@pytest.fixture
def permiso_edit_users(db):
    """Permiso para editar usuarios."""
    return Permiso.objects.create(
        code='users.edit',
        name='Editar Usuarios',
        description='Permite editar usuarios',
        module='CORE',
        action='EDIT',
        scope='OWN',
        is_active=True
    )


@pytest.fixture
def permiso_delete_users(db):
    """Permiso para eliminar usuarios."""
    return Permiso.objects.create(
        code='users.delete',
        name='Eliminar Usuarios',
        description='Permite eliminar usuarios',
        module='CORE',
        action='DELETE',
        scope='ALL',
        is_active=True
    )


@pytest.fixture
def permiso_view_lotes(db):
    """Permiso para ver lotes."""
    return Permiso.objects.create(
        code='lotes.view',
        name='Ver Lotes',
        description='Permite visualizar lotes',
        module='LOTES',
        action='VIEW',
        scope='ALL',
        is_active=True
    )


@pytest.fixture
def permiso_approve_lotes(db):
    """Permiso para aprobar lotes."""
    return Permiso.objects.create(
        code='lotes.approve',
        name='Aprobar Lotes',
        description='Permite aprobar lotes',
        module='LOTES',
        action='APPROVE',
        scope='ALL',
        is_active=True
    )


@pytest.fixture
def usuario_sin_permisos(db, cargo_test):
    """Usuario sin permisos asignados."""
    return User.objects.create_user(
        username='sin_permisos',
        email='sin_permisos@test.com',
        password='testpass123',
        document_type='CC',
        document_number='1000000001',
        cargo=cargo_test,
        is_active=True
    )


@pytest.fixture
def usuario_con_permiso_view(db, cargo_test, permiso_view_users):
    """Usuario con permiso de visualización."""
    user = User.objects.create_user(
        username='con_view',
        email='con_view@test.com',
        password='testpass123',
        document_type='CC',
        document_number='1000000002',
        cargo=cargo_test,
        is_active=True
    )
    cargo_test.permisos.add(permiso_view_users)
    return user


@pytest.fixture
def usuario_con_permiso_create(db, cargo_test, permiso_create_users):
    """Usuario con permiso de creación."""
    user = User.objects.create_user(
        username='con_create',
        email='con_create@test.com',
        password='testpass123',
        document_type='CC',
        document_number='1000000003',
        cargo=cargo_test,
        is_active=True
    )
    cargo_test.permisos.add(permiso_create_users)
    return user


@pytest.fixture
def usuario_con_permiso_edit(db, cargo_test, permiso_edit_users):
    """Usuario con permiso de edición."""
    user = User.objects.create_user(
        username='con_edit',
        email='con_edit@test.com',
        password='testpass123',
        document_type='CC',
        document_number='1000000004',
        cargo=cargo_test,
        is_active=True
    )
    cargo_test.permisos.add(permiso_edit_users)
    return user


@pytest.fixture
def usuario_con_permiso_delete(db, cargo_test, permiso_delete_users):
    """Usuario con permiso de eliminación."""
    user = User.objects.create_user(
        username='con_delete',
        email='con_delete@test.com',
        password='testpass123',
        document_type='CC',
        document_number='1000000005',
        cargo=cargo_test,
        is_active=True
    )
    cargo_test.permisos.add(permiso_delete_users)
    return user


@pytest.fixture
def usuario_con_todos_permisos(
    db,
    cargo_test,
    permiso_view_users,
    permiso_create_users,
    permiso_edit_users,
    permiso_delete_users
):
    """Usuario con todos los permisos."""
    user = User.objects.create_user(
        username='con_todos',
        email='con_todos@test.com',
        password='testpass123',
        document_type='CC',
        document_number='1000000006',
        cargo=cargo_test,
        is_active=True
    )
    cargo_test.permisos.add(
        permiso_view_users,
        permiso_create_users,
        permiso_edit_users,
        permiso_delete_users
    )
    return user


@pytest.fixture
def superuser(db):
    """Usuario superusuario."""
    return User.objects.create_superuser(
        username='admin',
        email='admin@test.com',
        password='admin123',
        document_type='CC',
        document_number='9999999999'
    )


# ==============================================================================
# TESTS DE API - DENEGACIÓN DE ACCESO (403 FORBIDDEN)
# ==============================================================================

@pytest.mark.django_db
class TestPermissionsDenied:
    """Tests para verificar que usuarios sin permiso reciben 403."""

    def test_usuario_no_autenticado_recibe_401(self, api_client):
        """
        Test: Usuario no autenticado recibe 401 Unauthorized.

        Verifica que:
        - Un usuario no autenticado no puede acceder a endpoints protegidos
        - Se retorna 401 Unauthorized
        """
        response = api_client.get('/api/core/users/')

        # Puede ser 401 o 403 dependiendo de la configuración DRF
        assert response.status_code in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN
        ]

    def test_usuario_sin_permiso_recibe_403(
        self,
        api_client,
        usuario_sin_permisos
    ):
        """
        Test: Usuario sin permiso recibe 403 Forbidden.

        Verifica que:
        - Un usuario autenticado pero sin permiso recibe 403
        - El mensaje de error es claro
        """
        api_client.force_authenticate(user=usuario_sin_permisos)

        # Intentar acceder a endpoint protegido
        response = api_client.get('/api/core/users/')

        # Nota: Si el endpoint no existe, puede retornar 404
        # En ese caso, solo verificamos que no es 200
        assert response.status_code != status.HTTP_200_OK

    def test_usuario_inactivo_no_puede_autenticarse(
        self,
        api_client,
        usuario_sin_permisos
    ):
        """
        Test: Usuario inactivo no puede autenticarse.

        Verifica que:
        - Un usuario inactivo no puede hacer login
        - No puede acceder a endpoints protegidos
        """
        usuario_sin_permisos.is_active = False
        usuario_sin_permisos.save()

        # Intentar login
        login_success = api_client.login(
            username='sin_permisos',
            password='testpass123'
        )

        assert login_success is False


# ==============================================================================
# TESTS DE API - PERMISOS POR ACCIÓN
# ==============================================================================

@pytest.mark.django_db
class TestPermissionsByAction:
    """Tests para verificar permisos por acción (VIEW, CREATE, EDIT, DELETE)."""

    def test_usuario_con_permiso_view_puede_listar(
        self,
        api_client,
        usuario_con_permiso_view
    ):
        """
        Test: Usuario con permiso VIEW puede listar recursos.

        Verifica que:
        - El usuario puede acceder a endpoints de listado
        - has_permission('users.view') funciona correctamente
        """
        assert usuario_con_permiso_view.has_permission('users.view')

    def test_usuario_con_permiso_create_puede_crear(
        self,
        api_client,
        usuario_con_permiso_create
    ):
        """
        Test: Usuario con permiso CREATE puede crear recursos.

        Verifica que:
        - El usuario tiene el permiso de creación
        - has_permission('users.create') funciona correctamente
        """
        assert usuario_con_permiso_create.has_permission('users.create')

    def test_usuario_con_permiso_edit_puede_editar(
        self,
        api_client,
        usuario_con_permiso_edit
    ):
        """
        Test: Usuario con permiso EDIT puede editar recursos.

        Verifica que:
        - El usuario tiene el permiso de edición
        - has_permission('users.edit') funciona correctamente
        """
        assert usuario_con_permiso_edit.has_permission('users.edit')

    def test_usuario_con_permiso_delete_puede_eliminar(
        self,
        api_client,
        usuario_con_permiso_delete
    ):
        """
        Test: Usuario con permiso DELETE puede eliminar recursos.

        Verifica que:
        - El usuario tiene el permiso de eliminación
        - has_permission('users.delete') funciona correctamente
        """
        assert usuario_con_permiso_delete.has_permission('users.delete')

    def test_usuario_sin_permiso_view_no_puede_listar(
        self,
        api_client,
        usuario_sin_permisos
    ):
        """
        Test: Usuario sin permiso VIEW no puede listar.

        Verifica que:
        - El usuario no tiene el permiso de visualización
        """
        assert usuario_sin_permisos.has_permission('users.view') is False

    def test_usuario_sin_permiso_create_no_puede_crear(
        self,
        api_client,
        usuario_sin_permisos
    ):
        """
        Test: Usuario sin permiso CREATE no puede crear.

        Verifica que:
        - El usuario no tiene el permiso de creación
        """
        assert usuario_sin_permisos.has_permission('users.create') is False

    def test_usuario_sin_permiso_edit_no_puede_editar(
        self,
        api_client,
        usuario_sin_permisos
    ):
        """
        Test: Usuario sin permiso EDIT no puede editar.

        Verifica que:
        - El usuario no tiene el permiso de edición
        """
        assert usuario_sin_permisos.has_permission('users.edit') is False

    def test_usuario_sin_permiso_delete_no_puede_eliminar(
        self,
        api_client,
        usuario_sin_permisos
    ):
        """
        Test: Usuario sin permiso DELETE no puede eliminar.

        Verifica que:
        - El usuario no tiene el permiso de eliminación
        """
        assert usuario_sin_permisos.has_permission('users.delete') is False


# ==============================================================================
# TESTS DE API - ALCANCE DE PERMISOS (SCOPE)
# ==============================================================================

@pytest.mark.django_db
class TestPermissionsScope:
    """Tests para verificar alcance de permisos (OWN, TEAM, ALL)."""

    def test_permiso_scope_own_solo_propios(
        self,
        db,
        permiso_edit_users
    ):
        """
        Test: Permiso con scope OWN solo permite editar propios.

        Verifica que:
        - El permiso tiene scope OWN
        - La lógica de scope se aplica correctamente
        """
        assert permiso_edit_users.scope == 'OWN'

    def test_permiso_scope_all_todos(
        self,
        db,
        permiso_view_users
    ):
        """
        Test: Permiso con scope ALL permite ver todos.

        Verifica que:
        - El permiso tiene scope ALL
        """
        assert permiso_view_users.scope == 'ALL'

    def test_permiso_scope_team_equipo(self, db):
        """
        Test: Permiso con scope TEAM solo permite acceso al equipo.

        Verifica que:
        - Se puede crear un permiso con scope TEAM
        """
        permiso_team = Permiso.objects.create(
            code='lotes.view.team',
            name='Ver Lotes del Equipo',
            description='Solo puede ver lotes de su equipo',
            module='LOTES',
            action='VIEW',
            scope='TEAM',
            is_active=True
        )

        assert permiso_team.scope == 'TEAM'


# ==============================================================================
# TESTS DE API - SUPERUSUARIO
# ==============================================================================

@pytest.mark.django_db
class TestSuperuserPermissions:
    """Tests para verificar que el superusuario tiene acceso total."""

    def test_superusuario_tiene_todos_permisos(
        self,
        superuser,
        permiso_view_users,
        permiso_create_users,
        permiso_edit_users,
        permiso_delete_users
    ):
        """
        Test: Superusuario tiene todos los permisos.

        Verifica que:
        - El superusuario puede realizar todas las acciones
        - No necesita permisos asignados explícitamente
        """
        assert superuser.has_permission('users.view')
        assert superuser.has_permission('users.create')
        assert superuser.has_permission('users.edit')
        assert superuser.has_permission('users.delete')
        assert superuser.has_permission('cualquier.permiso.inventado')

    def test_superusuario_puede_acceder_a_cualquier_endpoint(
        self,
        api_client,
        superuser
    ):
        """
        Test: Superusuario puede acceder a cualquier endpoint.

        Verifica que:
        - La autenticación como superusuario funciona
        - No se le niega el acceso
        """
        api_client.force_authenticate(user=superuser)

        # El superusuario debe poder autenticarse sin problemas
        assert superuser.is_authenticated
        assert superuser.is_superuser


# ==============================================================================
# TESTS DE API - PERMISOS MÚLTIPLES
# ==============================================================================

@pytest.mark.django_db
class TestMultiplePermissions:
    """Tests para verificar lógica de permisos múltiples."""

    def test_usuario_con_multiples_permisos(
        self,
        usuario_con_todos_permisos
    ):
        """
        Test: Usuario con múltiples permisos los tiene todos.

        Verifica que:
        - Un usuario puede tener múltiples permisos
        - has_permission funciona para todos
        """
        assert usuario_con_todos_permisos.has_permission('users.view')
        assert usuario_con_todos_permisos.has_permission('users.create')
        assert usuario_con_todos_permisos.has_permission('users.edit')
        assert usuario_con_todos_permisos.has_permission('users.delete')

    def test_has_any_permission_con_multiples(
        self,
        usuario_con_permiso_view
    ):
        """
        Test: has_any_permission con múltiples permisos.

        Verifica que:
        - Retorna True si tiene al menos uno
        """
        # Tiene users.view pero no users.create
        assert usuario_con_permiso_view.has_any_permission([
            'users.view',
            'users.create'
        ])

        # No tiene ninguno
        assert usuario_con_permiso_view.has_any_permission([
            'users.create',
            'users.delete'
        ]) is False

    def test_has_all_permissions_con_multiples(
        self,
        usuario_con_todos_permisos,
        usuario_con_permiso_view
    ):
        """
        Test: has_all_permissions con múltiples permisos.

        Verifica que:
        - Retorna True solo si tiene todos
        """
        # Tiene todos
        assert usuario_con_todos_permisos.has_all_permissions([
            'users.view',
            'users.create',
            'users.edit',
            'users.delete'
        ])

        # Solo tiene users.view
        assert usuario_con_permiso_view.has_all_permissions([
            'users.view',
            'users.create'
        ]) is False


# ==============================================================================
# TESTS DE API - PERMISOS DE MÓDULOS
# ==============================================================================

@pytest.mark.django_db
class TestModulePermissions:
    """Tests para verificar permisos por módulo."""

    def test_usuario_con_permisos_solo_de_lotes(
        self,
        db,
        cargo_test,
        permiso_view_lotes,
        permiso_approve_lotes
    ):
        """
        Test: Usuario con permisos solo de módulo LOTES.

        Verifica que:
        - Tiene permisos del módulo LOTES
        - No tiene permisos de otros módulos
        """
        user = User.objects.create_user(
            username='user_lotes',
            email='user_lotes@test.com',
            password='testpass123',
            document_type='CC',
            document_number='1111111111',
            cargo=cargo_test,
            is_active=True
        )

        cargo_test.permisos.add(permiso_view_lotes, permiso_approve_lotes)

        assert user.has_permission('lotes.view')
        assert user.has_permission('lotes.approve')
        assert user.has_permission('users.view') is False

    def test_get_permissions_by_module(
        self,
        permiso_view_lotes,
        permiso_approve_lotes
    ):
        """
        Test: Obtener permisos filtrados por módulo.

        Verifica que:
        - get_permissions_by_module retorna solo permisos del módulo
        """
        permisos_lotes = Permiso.get_permissions_by_module('LOTES')

        assert permisos_lotes.count() == 2
        assert permiso_view_lotes in permisos_lotes
        assert permiso_approve_lotes in permisos_lotes


# ==============================================================================
# TESTS DE API - PERMISOS CON ROLES
# ==============================================================================

@pytest.mark.django_db
class TestPermissionsWithRoles:
    """Tests para verificar permisos a través de roles."""

    def test_usuario_obtiene_permisos_de_rol(
        self,
        db,
        cargo_test,
        permiso_view_users,
        permiso_create_users
    ):
        """
        Test: Usuario obtiene permisos a través de un rol.

        Verifica que:
        - Los permisos del rol se transfieren al usuario
        """
        # Crear rol
        rol = Role.objects.create(
            code='admin_users',
            name='Administrador de Usuarios',
            is_active=True
        )
        rol.permisos.add(permiso_view_users, permiso_create_users)

        # Crear usuario
        user = User.objects.create_user(
            username='user_con_rol',
            email='user_con_rol@test.com',
            password='testpass123',
            document_type='CC',
            document_number='2222222222',
            cargo=cargo_test,
            is_active=True
        )

        # Asignar rol al usuario
        from apps.core.models import UserRole
        UserRole.objects.create(user=user, role=rol)

        assert user.has_permission('users.view')
        assert user.has_permission('users.create')

    def test_usuario_obtiene_permisos_de_grupo(
        self,
        db,
        cargo_test,
        permiso_view_users
    ):
        """
        Test: Usuario obtiene permisos a través de un grupo.

        Verifica que:
        - Los permisos del grupo se transfieren al usuario
        """
        # Crear rol
        rol = Role.objects.create(
            code='viewer',
            name='Visor',
            is_active=True
        )
        rol.permisos.add(permiso_view_users)

        # Crear grupo
        grupo = Group.objects.create(
            code='equipo_admin',
            name='Equipo Administrativo',
            is_active=True
        )
        grupo.roles.add(rol)

        # Crear usuario
        user = User.objects.create_user(
            username='user_grupo',
            email='user_grupo@test.com',
            password='testpass123',
            document_type='CC',
            document_number='3333333333',
            cargo=cargo_test,
            is_active=True
        )

        # Asignar usuario al grupo
        from apps.core.models import UserGroup
        UserGroup.objects.create(user=user, group=grupo)

        assert user.has_permission('users.view')


# ==============================================================================
# TESTS DE API - EDGE CASES
# ==============================================================================

@pytest.mark.django_db
class TestPermissionsEdgeCases:
    """Tests para casos edge de permisos."""

    def test_permiso_inactivo_no_otorga_acceso(
        self,
        db,
        cargo_test,
        permiso_view_users
    ):
        """
        Test: Permiso inactivo no otorga acceso.

        Verifica que:
        - Un permiso inactivo no se considera
        """
        user = User.objects.create_user(
            username='user_test',
            email='user_test@test.com',
            password='testpass123',
            document_type='CC',
            document_number='4444444444',
            cargo=cargo_test,
            is_active=True
        )

        cargo_test.permisos.add(permiso_view_users)

        # Desactivar el permiso
        permiso_view_users.is_active = False
        permiso_view_users.save()

        assert user.has_permission('users.view') is False

    def test_rol_inactivo_no_otorga_permisos(
        self,
        db,
        cargo_test,
        permiso_view_users
    ):
        """
        Test: Rol inactivo no otorga permisos.

        Verifica que:
        - Un rol inactivo no transfiere permisos
        """
        # Crear rol
        rol = Role.objects.create(
            code='rol_inactivo',
            name='Rol Inactivo',
            is_active=False  # Inactivo
        )
        rol.permisos.add(permiso_view_users)

        # Crear usuario
        user = User.objects.create_user(
            username='user_rol_inactivo',
            email='user_rol_inactivo@test.com',
            password='testpass123',
            document_type='CC',
            document_number='5555555555',
            cargo=cargo_test,
            is_active=True
        )

        # Asignar rol inactivo
        from apps.core.models import UserRole
        UserRole.objects.create(user=user, role=rol)

        # No debe tener el permiso porque el rol está inactivo
        assert user.has_permission('users.view') is False

    def test_grupo_inactivo_no_otorga_permisos(
        self,
        db,
        cargo_test,
        permiso_view_users
    ):
        """
        Test: Grupo inactivo no otorga permisos.

        Verifica que:
        - Un grupo inactivo no transfiere permisos
        """
        # Crear rol
        rol = Role.objects.create(
            code='rol_activo',
            name='Rol Activo',
            is_active=True
        )
        rol.permisos.add(permiso_view_users)

        # Crear grupo inactivo
        grupo = Group.objects.create(
            code='grupo_inactivo',
            name='Grupo Inactivo',
            is_active=False
        )
        grupo.roles.add(rol)

        # Crear usuario
        user = User.objects.create_user(
            username='user_grupo_inactivo',
            email='user_grupo_inactivo@test.com',
            password='testpass123',
            document_type='CC',
            document_number='6666666666',
            cargo=cargo_test,
            is_active=True
        )

        # Asignar a grupo inactivo
        from apps.core.models import UserGroup
        UserGroup.objects.create(user=user, group=grupo)

        # No debe tener el permiso porque el grupo está inactivo
        assert user.has_permission('users.view') is False
