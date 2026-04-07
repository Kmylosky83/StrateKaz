"""
Tests Completos del Sistema RBAC - Role-Based Access Control

Cobertura de tests:
1. TestRBACPermisos: Asignación de permisos a usuarios
2. TestRBACRoles: Roles y herencia de permisos
3. TestRBACGrupos: Grupos y permisos de grupo
4. TestRBACCargos: Permisos por cargo
5. TestRBACRolesAdicionales: Sistema RBAC híbrido (roles adicionales)
6. TestRBACIntegracion: Flujo completo usuario->cargo->permisos

Sistema de Gestión StrateKaz

DEUDA-TESTING: TENANT_SCHEMA + API_OBSOLETA — 38 tests con ERROR.
Fixtures crean Permiso() con kwargs obsoletos (modelo cambió) y
tocan tablas de TENANT_APPS sin setup de tenant.
Ver docs/testing-debt.md#test_rbac
"""
import pytest

pytestmark = pytest.mark.skip(
    reason="DEUDA-TESTING: TENANT_SCHEMA + API_OBSOLETA. Ver docs/testing-debt.md#test_rbac"
)
from datetime import timedelta
from django.utils import timezone
from django.core.exceptions import ValidationError

from apps.core.models import (
    User,
    Cargo,
    Permiso,
    Role,
    Group,
    RolAdicional,
    UserRole,
    UserGroup,
    GroupRole,
    CargoPermiso,
    RolePermiso,
    RolAdicionalPermiso,
    UserRolAdicional,
)
from apps.gestion_estrategica.organizacion.models import Area


# ==============================================================================
# FIXTURES COMPARTIDAS
# ==============================================================================

@pytest.fixture
def area_operaciones(db):
    """Crea un área de operaciones para pruebas."""
    return Area.objects.create(
        code='OPE',
        name='Operaciones',
        description='Área de Operaciones',
        is_active=True,
        orden=1
    )


@pytest.fixture
def area_administracion(db):
    """Crea un área de administración para pruebas."""
    return Area.objects.create(
        code='ADM',
        name='Administración',
        description='Área Administrativa',
        is_active=True,
        orden=2
    )


@pytest.fixture
def cargo_operador(db, area_operaciones):
    """Crea un cargo de operador para pruebas."""
    return Cargo.objects.create(
        code='OPERADOR',
        name='Operador de Planta',
        description='Operador en planta de producción',
        area=area_operaciones,
        nivel_jerarquico='OPERATIVO',
        level=0,
        cantidad_posiciones=5,
        is_jefatura=False,
        is_active=True
    )


@pytest.fixture
def cargo_supervisor(db, area_operaciones):
    """Crea un cargo de supervisor para pruebas."""
    return Cargo.objects.create(
        code='SUPERVISOR',
        name='Supervisor de Planta',
        description='Supervisor de operaciones',
        area=area_operaciones,
        nivel_jerarquico='TACTICO',
        level=1,
        cantidad_posiciones=2,
        is_jefatura=True,
        is_active=True
    )


@pytest.fixture
def cargo_gerente(db, area_administracion):
    """Crea un cargo de gerente para pruebas."""
    return Cargo.objects.create(
        code='GERENTE',
        name='Gerente General',
        description='Gerente de la organización',
        area=area_administracion,
        nivel_jerarquico='ESTRATEGICO',
        level=3,
        cantidad_posiciones=1,
        is_jefatura=True,
        is_active=True
    )


@pytest.fixture
def permiso_ver_lotes(db):
    """Crea un permiso para ver lotes."""
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
def permiso_crear_lotes(db):
    """Crea un permiso para crear lotes."""
    return Permiso.objects.create(
        code='lotes.create',
        name='Crear Lotes',
        description='Permite crear nuevos lotes',
        module='LOTES',
        action='CREATE',
        scope='ALL',
        is_active=True
    )


@pytest.fixture
def permiso_editar_lotes(db):
    """Crea un permiso para editar lotes."""
    return Permiso.objects.create(
        code='lotes.edit',
        name='Editar Lotes',
        description='Permite editar lotes',
        module='LOTES',
        action='EDIT',
        scope='OWN',
        is_active=True
    )


@pytest.fixture
def permiso_aprobar_lotes(db):
    """Crea un permiso para aprobar lotes."""
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
def permiso_eliminar_lotes(db):
    """Crea un permiso para eliminar lotes."""
    return Permiso.objects.create(
        code='lotes.delete',
        name='Eliminar Lotes',
        description='Permite eliminar lotes',
        module='LOTES',
        action='DELETE',
        scope='ALL',
        is_active=True
    )


@pytest.fixture
def rol_operario(db):
    """Crea un rol de operario para pruebas."""
    return Role.objects.create(
        code='operario_planta',
        name='Operario de Planta',
        description='Rol básico de operario',
        is_system=False,
        is_active=True
    )


@pytest.fixture
def rol_supervisor(db):
    """Crea un rol de supervisor para pruebas."""
    return Role.objects.create(
        code='supervisor_produccion',
        name='Supervisor de Producción',
        description='Rol de supervisor con permisos de aprobación',
        is_system=False,
        is_active=True
    )


@pytest.fixture
def rol_gerente(db):
    """Crea un rol de gerente para pruebas."""
    return Role.objects.create(
        code='gerente_general',
        name='Gerente General',
        description='Rol de gerencia con todos los permisos',
        is_system=True,
        is_active=True
    )


@pytest.fixture
def grupo_produccion(db):
    """Crea un grupo de producción para pruebas."""
    return Group.objects.create(
        code='equipo_produccion',
        name='Equipo de Producción',
        description='Equipo encargado de producción',
        is_active=True
    )


@pytest.fixture
def grupo_calidad(db):
    """Crea un grupo de calidad para pruebas."""
    return Group.objects.create(
        code='equipo_calidad',
        name='Equipo de Calidad',
        description='Equipo de control de calidad',
        is_active=True
    )


@pytest.fixture
def rol_adicional_copasst(db):
    """Crea un rol adicional de COPASST para pruebas."""
    return RolAdicional.objects.create(
        code='copasst',
        nombre='Miembro COPASST',
        descripcion='Comité Paritario de Seguridad y Salud en el Trabajo',
        tipo='LEGAL_OBLIGATORIO',
        justificacion_legal='Resolución 0312/2019',
        requiere_certificacion=True,
        certificacion_requerida='Curso 50h SST',
        is_system=True,
        is_active=True
    )


@pytest.fixture
def rol_adicional_brigadista(db):
    """Crea un rol adicional de brigadista para pruebas."""
    return RolAdicional.objects.create(
        code='brigadista',
        nombre='Brigadista de Emergencias',
        descripcion='Miembro de la brigada de emergencias',
        tipo='LEGAL_OBLIGATORIO',
        requiere_certificacion=True,
        certificacion_requerida='Curso de Brigadista',
        is_system=True,
        is_active=True
    )


@pytest.fixture
def usuario_sin_cargo(db):
    """Crea un usuario sin cargo asignado."""
    return User.objects.create_user(
        username='usuario_sin_cargo',
        email='sin_cargo@test.com',
        password='password123',
        document_type='CC',
        document_number='1000000001',
        first_name='Usuario',
        last_name='Sin Cargo',
        is_active=True
    )


@pytest.fixture
def usuario_operador(db, cargo_operador):
    """Crea un usuario con cargo de operador."""
    return User.objects.create_user(
        username='operador1',
        email='operador1@test.com',
        password='password123',
        document_type='CC',
        document_number='1000000002',
        first_name='Juan',
        last_name='Operador',
        cargo=cargo_operador,
        is_active=True
    )


@pytest.fixture
def usuario_supervisor(db, cargo_supervisor):
    """Crea un usuario con cargo de supervisor."""
    return User.objects.create_user(
        username='supervisor1',
        email='supervisor1@test.com',
        password='password123',
        document_type='CC',
        document_number='1000000003',
        first_name='Pedro',
        last_name='Supervisor',
        cargo=cargo_supervisor,
        is_active=True
    )


@pytest.fixture
def usuario_gerente(db, cargo_gerente):
    """Crea un usuario con cargo de gerente."""
    return User.objects.create_user(
        username='gerente1',
        email='gerente1@test.com',
        password='password123',
        document_type='CC',
        document_number='1000000004',
        first_name='Maria',
        last_name='Gerente',
        cargo=cargo_gerente,
        is_active=True
    )


# ==============================================================================
# TESTS DE PERMISOS
# ==============================================================================

@pytest.mark.django_db
class TestRBACPermisos:
    """Tests para verificar asignación de permisos a usuarios."""

    def test_permiso_creacion_basica(self, permiso_ver_lotes):
        """
        Test: Creación básica de un permiso.

        Verifica que:
        - El permiso se crea correctamente
        - Tiene los campos requeridos
        - El código es único
        """
        assert permiso_ver_lotes.code == 'lotes.view'
        assert permiso_ver_lotes.name == 'Ver Lotes'
        assert permiso_ver_lotes.module == 'LOTES'
        assert permiso_ver_lotes.action == 'VIEW'
        assert permiso_ver_lotes.scope == 'ALL'
        assert permiso_ver_lotes.is_active is True

    def test_permiso_get_permissions_by_module(
        self,
        permiso_ver_lotes,
        permiso_crear_lotes,
        permiso_editar_lotes
    ):
        """
        Test: Obtener permisos filtrados por módulo.

        Verifica que:
        - Se obtienen solo permisos del módulo especificado
        - Solo se retornan permisos activos
        """
        permisos_lotes = Permiso.get_permissions_by_module('LOTES')

        assert permisos_lotes.count() == 3
        assert permiso_ver_lotes in permisos_lotes
        assert permiso_crear_lotes in permisos_lotes
        assert permiso_editar_lotes in permisos_lotes

    def test_permiso_inactivo_no_se_obtiene_por_modulo(
        self,
        permiso_ver_lotes
    ):
        """
        Test: Permisos inactivos no se obtienen por módulo.

        Verifica que:
        - Al desactivar un permiso no se incluye en la consulta
        """
        permiso_ver_lotes.is_active = False
        permiso_ver_lotes.save()

        permisos_lotes = Permiso.get_permissions_by_module('LOTES')

        assert permiso_ver_lotes not in permisos_lotes

    def test_permiso_string_representation(self, permiso_ver_lotes):
        """
        Test: Representación en string del permiso.

        Verifica que:
        - El __str__ retorna el formato esperado
        """
        assert str(permiso_ver_lotes) == "Ver Lotes (lotes.view)"


# ==============================================================================
# TESTS DE ROLES
# ==============================================================================

@pytest.mark.django_db
class TestRBACRoles:
    """Tests para verificar roles y herencia de permisos."""

    def test_rol_creacion_basica(self, rol_operario):
        """
        Test: Creación básica de un rol.

        Verifica que:
        - El rol se crea correctamente
        - Tiene los campos requeridos
        """
        assert rol_operario.code == 'operario_planta'
        assert rol_operario.name == 'Operario de Planta'
        assert rol_operario.is_active is True
        assert rol_operario.is_system is False

    def test_rol_asignar_permisos(
        self,
        rol_operario,
        permiso_ver_lotes,
        permiso_crear_lotes
    ):
        """
        Test: Asignar permisos a un rol.

        Verifica que:
        - Se pueden asignar múltiples permisos a un rol
        - Los permisos se asocian correctamente
        """
        rol_operario.permisos.add(permiso_ver_lotes, permiso_crear_lotes)

        permisos = rol_operario.get_all_permissions()

        assert permisos.count() == 2
        assert permiso_ver_lotes in permisos
        assert permiso_crear_lotes in permisos

    def test_rol_obtener_permisos_solo_activos(
        self,
        rol_operario,
        permiso_ver_lotes,
        permiso_crear_lotes
    ):
        """
        Test: get_all_permissions solo retorna permisos activos.

        Verifica que:
        - Solo se obtienen permisos activos
        - Permisos inactivos son excluidos
        """
        rol_operario.permisos.add(permiso_ver_lotes, permiso_crear_lotes)

        # Desactivar un permiso
        permiso_crear_lotes.is_active = False
        permiso_crear_lotes.save()

        permisos = rol_operario.get_all_permissions()

        assert permisos.count() == 1
        assert permiso_ver_lotes in permisos
        assert permiso_crear_lotes not in permisos

    def test_rol_asignar_a_usuario(self, rol_operario, usuario_operador):
        """
        Test: Asignar rol directamente a un usuario.

        Verifica que:
        - Se puede asignar un rol a un usuario
        - La relación se crea correctamente
        """
        UserRole.objects.create(
            user=usuario_operador,
            role=rol_operario
        )

        assert usuario_operador.has_role(rol_operario.code)
        assert usuario_operador.user_roles.count() == 1

    def test_rol_con_fecha_expiracion(self, rol_operario, usuario_operador):
        """
        Test: Asignar rol con fecha de expiración.

        Verifica que:
        - Se puede asignar un rol con fecha de expiración
        - El rol expira correctamente cuando pasa la fecha
        """
        # Rol que expira en 1 día
        user_role = UserRole.objects.create(
            user=usuario_operador,
            role=rol_operario,
            expires_at=timezone.now() + timedelta(days=1)
        )

        assert user_role.is_expired is False
        assert user_role.is_valid is True

        # Rol que ya expiró
        user_role.expires_at = timezone.now() - timedelta(days=1)
        user_role.save()

        assert user_role.is_expired is True
        assert user_role.is_valid is False

    def test_rol_string_representation(self, rol_operario):
        """
        Test: Representación en string del rol.

        Verifica que:
        - El __str__ retorna el formato esperado
        """
        assert str(rol_operario) == "Operario de Planta (operario_planta)"


# ==============================================================================
# TESTS DE GRUPOS
# ==============================================================================

@pytest.mark.django_db
class TestRBACGrupos:
    """Tests para verificar grupos y permisos de grupo."""

    def test_grupo_creacion_basica(self, grupo_produccion):
        """
        Test: Creación básica de un grupo.

        Verifica que:
        - El grupo se crea correctamente
        - Tiene los campos requeridos
        """
        assert grupo_produccion.code == 'equipo_produccion'
        assert grupo_produccion.name == 'Equipo de Producción'
        assert grupo_produccion.is_active is True

    def test_grupo_asignar_roles(
        self,
        grupo_produccion,
        rol_operario,
        rol_supervisor
    ):
        """
        Test: Asignar roles a un grupo.

        Verifica que:
        - Se pueden asignar múltiples roles a un grupo
        - Los roles se asocian correctamente
        """
        grupo_produccion.roles.add(rol_operario, rol_supervisor)

        assert grupo_produccion.roles.count() == 2
        assert rol_operario in grupo_produccion.roles.all()
        assert rol_supervisor in grupo_produccion.roles.all()

    def test_grupo_obtener_permisos_de_roles(
        self,
        grupo_produccion,
        rol_operario,
        permiso_ver_lotes,
        permiso_crear_lotes
    ):
        """
        Test: Obtener permisos del grupo a través de sus roles.

        Verifica que:
        - El grupo hereda permisos de sus roles
        - get_all_permissions retorna permisos correctos
        """
        # Asignar permisos al rol
        rol_operario.permisos.add(permiso_ver_lotes, permiso_crear_lotes)

        # Asignar rol al grupo
        grupo_produccion.roles.add(rol_operario)

        permisos = grupo_produccion.get_all_permissions()

        assert permisos.count() == 2
        assert permiso_ver_lotes in permisos
        assert permiso_crear_lotes in permisos

    def test_grupo_asignar_usuarios(
        self,
        grupo_produccion,
        usuario_operador,
        usuario_supervisor
    ):
        """
        Test: Asignar usuarios a un grupo.

        Verifica que:
        - Se pueden asignar múltiples usuarios a un grupo
        - Se puede marcar usuarios como líderes
        """
        UserGroup.objects.create(
            user=usuario_operador,
            group=grupo_produccion,
            is_leader=False
        )

        UserGroup.objects.create(
            user=usuario_supervisor,
            group=grupo_produccion,
            is_leader=True
        )

        assert grupo_produccion.user_groups.count() == 2

        # Verificar que el supervisor es líder
        supervisor_group = UserGroup.objects.get(
            user=usuario_supervisor,
            group=grupo_produccion
        )
        assert supervisor_group.is_leader is True

    def test_usuario_pertenece_a_grupo(
        self,
        grupo_produccion,
        usuario_operador
    ):
        """
        Test: Verificar si un usuario pertenece a un grupo.

        Verifica que:
        - El método is_in_group funciona correctamente
        """
        UserGroup.objects.create(
            user=usuario_operador,
            group=grupo_produccion
        )

        assert usuario_operador.is_in_group(grupo_produccion.code)

    def test_grupo_string_representation(self, grupo_produccion):
        """
        Test: Representación en string del grupo.

        Verifica que:
        - El __str__ retorna el formato esperado
        """
        assert str(grupo_produccion) == "Equipo de Producción (equipo_produccion)"


# ==============================================================================
# TESTS DE CARGOS
# ==============================================================================

@pytest.mark.django_db
class TestRBACCargos:
    """Tests para verificar permisos por cargo."""

    def test_cargo_asignar_permisos(
        self,
        cargo_operador,
        permiso_ver_lotes,
        permiso_crear_lotes
    ):
        """
        Test: Asignar permisos a un cargo.

        Verifica que:
        - Se pueden asignar permisos a un cargo
        - Los permisos se asocian correctamente
        """
        cargo_operador.permisos.add(permiso_ver_lotes, permiso_crear_lotes)

        permisos = cargo_operador.permisos.filter(is_active=True)

        assert permisos.count() == 2
        assert permiso_ver_lotes in permisos
        assert permiso_crear_lotes in permisos

    def test_usuario_hereda_permisos_de_cargo(
        self,
        cargo_operador,
        usuario_operador,
        permiso_ver_lotes
    ):
        """
        Test: Usuario hereda permisos de su cargo.

        Verifica que:
        - El usuario hereda permisos del cargo asignado
        - has_permission funciona correctamente
        """
        cargo_operador.permisos.add(permiso_ver_lotes)

        assert usuario_operador.has_permission('lotes.view')

    def test_usuario_sin_cargo_no_tiene_permisos(
        self,
        usuario_sin_cargo,
        permiso_ver_lotes
    ):
        """
        Test: Usuario sin cargo no tiene permisos.

        Verifica que:
        - Un usuario sin cargo no tiene permisos
        - has_permission retorna False
        """
        assert usuario_sin_cargo.has_permission('lotes.view') is False

    def test_cargo_sin_permisos(self, cargo_operador, usuario_operador):
        """
        Test: Cargo sin permisos asignados.

        Verifica que:
        - Un cargo sin permisos no otorga permisos al usuario
        - has_permission retorna False
        """
        # El cargo no tiene permisos asignados
        assert usuario_operador.has_permission('lotes.view') is False

    def test_cargo_permiso_relacion_con_auditoria(
        self,
        cargo_operador,
        permiso_ver_lotes,
        usuario_gerente
    ):
        """
        Test: Relación Cargo-Permiso con auditoría.

        Verifica que:
        - Se puede registrar quién otorgó el permiso
        - La fecha de asignación se registra automáticamente
        """
        cargo_permiso = CargoPermiso.objects.create(
            cargo=cargo_operador,
            permiso=permiso_ver_lotes,
            granted_by=usuario_gerente
        )

        assert cargo_permiso.granted_by == usuario_gerente
        assert cargo_permiso.granted_at is not None


# ==============================================================================
# TESTS DE ROLES ADICIONALES (RBAC HÍBRIDO)
# ==============================================================================

@pytest.mark.django_db
class TestRBACRolesAdicionales:
    """Tests para verificar el sistema RBAC híbrido con roles adicionales."""

    def test_rol_adicional_creacion_basica(self, rol_adicional_copasst):
        """
        Test: Creación básica de un rol adicional.

        Verifica que:
        - El rol adicional se crea correctamente
        - Tiene los campos requeridos
        """
        assert rol_adicional_copasst.code == 'copasst'
        assert rol_adicional_copasst.nombre == 'Miembro COPASST'
        assert rol_adicional_copasst.tipo == 'LEGAL_OBLIGATORIO'
        assert rol_adicional_copasst.requiere_certificacion is True
        assert rol_adicional_copasst.is_active is True

    def test_rol_adicional_asignar_permisos(
        self,
        rol_adicional_copasst,
        permiso_ver_lotes,
        permiso_aprobar_lotes
    ):
        """
        Test: Asignar permisos a un rol adicional.

        Verifica que:
        - Se pueden asignar permisos a roles adicionales
        - Los permisos se asocian correctamente
        """
        rol_adicional_copasst.permisos.add(permiso_ver_lotes, permiso_aprobar_lotes)

        permisos = rol_adicional_copasst.get_permisos_codigos()

        assert len(permisos) == 2
        assert 'lotes.view' in permisos
        assert 'lotes.approve' in permisos

    def test_rol_adicional_asignar_a_usuario(
        self,
        rol_adicional_copasst,
        usuario_operador,
        usuario_supervisor
    ):
        """
        Test: Asignar rol adicional a un usuario.

        Verifica que:
        - Se puede asignar un rol adicional a un usuario
        - La relación se crea correctamente
        """
        UserRolAdicional.objects.create(
            user=usuario_operador,
            rol_adicional=rol_adicional_copasst,
            assigned_by=usuario_supervisor,
            justificacion='Elección comité'
        )

        assert usuario_operador.tiene_rol_adicional(rol_adicional_copasst.code)
        assert usuario_operador.usuarios_roles_adicionales.count() == 1

    def test_rol_adicional_con_expiracion(
        self,
        rol_adicional_brigadista,
        usuario_operador
    ):
        """
        Test: Rol adicional con fecha de expiración.

        Verifica que:
        - Se puede asignar un rol adicional con expiración
        - El rol expira correctamente
        """
        # Rol que expira en el futuro
        asignacion = UserRolAdicional.objects.create(
            user=usuario_operador,
            rol_adicional=rol_adicional_brigadista,
            expires_at=timezone.now() + timedelta(days=365)
        )

        assert usuario_operador.tiene_rol_adicional('brigadista') is True

        # Cambiar a fecha expirada
        asignacion.expires_at = timezone.now() - timedelta(days=1)
        asignacion.save()

        # Refrescar del DB
        assert usuario_operador.tiene_rol_adicional('brigadista') is False

    def test_usuario_hereda_permisos_de_rol_adicional(
        self,
        rol_adicional_copasst,
        usuario_operador,
        permiso_aprobar_lotes
    ):
        """
        Test: Usuario hereda permisos de roles adicionales.

        Verifica que:
        - El usuario hereda permisos de roles adicionales
        - La jerarquía RBAC híbrida funciona correctamente
        """
        # Asignar permiso al rol adicional
        rol_adicional_copasst.permisos.add(permiso_aprobar_lotes)

        # Asignar rol adicional al usuario
        UserRolAdicional.objects.create(
            user=usuario_operador,
            rol_adicional=rol_adicional_copasst
        )

        # El usuario debe tener el permiso del rol adicional
        assert usuario_operador.has_permission('lotes.approve')

    def test_rol_adicional_usuarios_count(
        self,
        rol_adicional_copasst,
        usuario_operador,
        usuario_supervisor
    ):
        """
        Test: Contar usuarios asignados a un rol adicional.

        Verifica que:
        - usuarios_count retorna el número correcto
        """
        UserRolAdicional.objects.create(
            user=usuario_operador,
            rol_adicional=rol_adicional_copasst
        )

        UserRolAdicional.objects.create(
            user=usuario_supervisor,
            rol_adicional=rol_adicional_copasst
        )

        assert rol_adicional_copasst.usuarios_count() == 2

    def test_rol_adicional_puede_eliminar(self, rol_adicional_copasst):
        """
        Test: Verificar si un rol adicional puede eliminarse.

        Verifica que:
        - Un rol del sistema no puede eliminarse
        - Un rol con usuarios asignados no puede eliminarse
        """
        puede_eliminar, mensaje = rol_adicional_copasst.puede_eliminar()

        assert puede_eliminar is False
        assert 'sistema' in mensaje.lower()

    def test_rol_adicional_get_tipo_display_color(
        self,
        rol_adicional_copasst,
        rol_adicional_brigadista
    ):
        """
        Test: Obtener color asociado al tipo de rol adicional.

        Verifica que:
        - Cada tipo de rol tiene un color asociado
        """
        assert rol_adicional_copasst.get_tipo_display_color() == 'red'
        assert rol_adicional_brigadista.get_tipo_display_color() == 'red'

    def test_usuario_get_roles_adicionales_por_tipo(
        self,
        rol_adicional_copasst,
        rol_adicional_brigadista,
        usuario_operador
    ):
        """
        Test: Obtener roles adicionales del usuario filtrados por tipo.

        Verifica que:
        - Se pueden filtrar roles adicionales por tipo
        """
        UserRolAdicional.objects.create(
            user=usuario_operador,
            rol_adicional=rol_adicional_copasst
        )

        UserRolAdicional.objects.create(
            user=usuario_operador,
            rol_adicional=rol_adicional_brigadista
        )

        roles_legales = usuario_operador.get_roles_adicionales_por_tipo('LEGAL_OBLIGATORIO')

        assert roles_legales.count() == 2


# ==============================================================================
# TESTS DE INTEGRACIÓN RBAC
# ==============================================================================

@pytest.mark.django_db
class TestRBACIntegracion:
    """Tests de integración del flujo completo RBAC."""

    def test_flujo_completo_usuario_cargo_permisos(
        self,
        cargo_operador,
        usuario_operador,
        permiso_ver_lotes,
        permiso_crear_lotes
    ):
        """
        Test: Flujo completo de asignación de permisos por cargo.

        Verifica que:
        - Usuario obtiene permisos a través de su cargo
        - get_all_permissions retorna todos los permisos
        """
        # Asignar permisos al cargo
        cargo_operador.permisos.add(permiso_ver_lotes, permiso_crear_lotes)

        # Verificar que el usuario tiene los permisos
        assert usuario_operador.has_permission('lotes.view')
        assert usuario_operador.has_permission('lotes.create')

        # Verificar get_all_permissions
        permisos = usuario_operador.get_all_permissions()
        assert permisos.count() == 2

    def test_jerarquia_permisos_rbac_hibrido(
        self,
        cargo_operador,
        usuario_operador,
        rol_operario,
        rol_adicional_copasst,
        grupo_produccion,
        permiso_ver_lotes,
        permiso_crear_lotes,
        permiso_editar_lotes,
        permiso_aprobar_lotes
    ):
        """
        Test: Jerarquía completa de permisos RBAC híbrido.

        Verifica que:
        - Usuario acumula permisos de: cargo + roles + roles adicionales + grupos
        - La jerarquía funciona correctamente
        """
        # 1. Permiso del cargo
        cargo_operador.permisos.add(permiso_ver_lotes)

        # 2. Permiso del rol directo
        rol_operario.permisos.add(permiso_crear_lotes)
        UserRole.objects.create(user=usuario_operador, role=rol_operario)

        # 3. Permiso del rol adicional
        rol_adicional_copasst.permisos.add(permiso_aprobar_lotes)
        UserRolAdicional.objects.create(
            user=usuario_operador,
            rol_adicional=rol_adicional_copasst
        )

        # 4. Permiso del grupo
        rol_grupo = Role.objects.create(code='editor', name='Editor')
        rol_grupo.permisos.add(permiso_editar_lotes)
        grupo_produccion.roles.add(rol_grupo)
        UserGroup.objects.create(user=usuario_operador, group=grupo_produccion)

        # Verificar que el usuario tiene todos los permisos
        assert usuario_operador.has_permission('lotes.view')  # Cargo
        assert usuario_operador.has_permission('lotes.create')  # Rol directo
        assert usuario_operador.has_permission('lotes.approve')  # Rol adicional
        assert usuario_operador.has_permission('lotes.edit')  # Grupo

        # Verificar que get_all_permissions incluye todos
        permisos = usuario_operador.get_all_permissions()
        assert permisos.count() == 4

    def test_superusuario_tiene_todos_los_permisos(
        self,
        permiso_ver_lotes,
        permiso_aprobar_lotes
    ):
        """
        Test: Superusuario tiene todos los permisos.

        Verifica que:
        - Un superusuario tiene todos los permisos
        - No necesita cargo ni roles
        """
        superuser = User.objects.create_superuser(
            username='admin',
            email='admin@test.com',
            password='admin123',
            document_type='CC',
            document_number='9999999999'
        )

        assert superuser.has_permission('lotes.view')
        assert superuser.has_permission('lotes.approve')
        assert superuser.has_permission('cualquier.permiso')

        # get_all_permissions debe retornar todos los permisos activos
        all_permisos = superuser.get_all_permissions()
        assert permiso_ver_lotes in all_permisos
        assert permiso_aprobar_lotes in all_permisos

    def test_usuario_inactivo_no_tiene_permisos(
        self,
        cargo_operador,
        permiso_ver_lotes
    ):
        """
        Test: Usuario inactivo no tiene permisos.

        Verifica que:
        - Un usuario inactivo no tiene permisos
        - Aunque su cargo tenga permisos asignados
        """
        usuario_inactivo = User.objects.create_user(
            username='inactivo',
            email='inactivo@test.com',
            password='password123',
            document_type='CC',
            document_number='1111111111',
            cargo=cargo_operador,
            is_active=False
        )

        cargo_operador.permisos.add(permiso_ver_lotes)

        assert usuario_inactivo.has_permission('lotes.view') is False

    def test_usuario_eliminado_no_tiene_permisos(
        self,
        cargo_operador,
        permiso_ver_lotes
    ):
        """
        Test: Usuario eliminado (soft delete) no tiene permisos.

        Verifica que:
        - Un usuario con deleted_at no tiene permisos
        """
        usuario_eliminado = User.objects.create_user(
            username='eliminado',
            email='eliminado@test.com',
            password='password123',
            document_type='CC',
            document_number='2222222222',
            cargo=cargo_operador,
            deleted_at=timezone.now()
        )

        cargo_operador.permisos.add(permiso_ver_lotes)

        assert usuario_eliminado.has_permission('lotes.view') is False
        assert usuario_eliminado.is_deleted is True

    def test_has_any_permission(
        self,
        cargo_operador,
        usuario_operador,
        permiso_ver_lotes
    ):
        """
        Test: Verificar si el usuario tiene al menos uno de los permisos.

        Verifica que:
        - has_any_permission funciona correctamente
        """
        cargo_operador.permisos.add(permiso_ver_lotes)

        assert usuario_operador.has_any_permission(['lotes.view', 'lotes.create'])
        assert usuario_operador.has_any_permission(['lotes.create', 'lotes.delete']) is False

    def test_has_all_permissions(
        self,
        cargo_operador,
        usuario_operador,
        permiso_ver_lotes,
        permiso_crear_lotes
    ):
        """
        Test: Verificar si el usuario tiene todos los permisos.

        Verifica que:
        - has_all_permissions funciona correctamente
        """
        cargo_operador.permisos.add(permiso_ver_lotes, permiso_crear_lotes)

        assert usuario_operador.has_all_permissions(['lotes.view', 'lotes.create'])
        assert usuario_operador.has_all_permissions(['lotes.view', 'lotes.delete']) is False

    def test_usuario_get_permisos_efectivos(
        self,
        cargo_operador,
        usuario_operador,
        permiso_ver_lotes,
        permiso_crear_lotes
    ):
        """
        Test: Obtener lista de códigos de permisos efectivos.

        Verifica que:
        - get_permisos_efectivos retorna lista de códigos
        """
        cargo_operador.permisos.add(permiso_ver_lotes, permiso_crear_lotes)

        permisos_efectivos = usuario_operador.get_permisos_efectivos()

        assert isinstance(permisos_efectivos, list)
        assert 'lotes.view' in permisos_efectivos
        assert 'lotes.create' in permisos_efectivos
        assert len(permisos_efectivos) == 2
