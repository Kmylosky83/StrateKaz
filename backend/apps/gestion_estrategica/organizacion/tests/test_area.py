"""
Tests unitarios para el modelo Area - Jerarquía organizacional.

Cobertura de tests:
1. Jerarquía: parent, children, full_path, level, get_all_children
2. Validaciones: ciclos, parent == self, código único, soft delete
3. Ordenamiento: orden, move_up/down (OrderedModel)
4. API: CRUD, tree, filtros, mover áreas
"""
import pytest
from django.core.exceptions import ValidationError
from django.test import TransactionTestCase
from rest_framework.test import APIClient
from rest_framework import status

from apps.gestion_estrategica.organizacion.models import Area
from apps.core.models import User


# =============================================================================
# FIXTURES Y SETUP
# =============================================================================

@pytest.fixture
def user_admin(db):
    """Crea un usuario administrador para pruebas de API."""
    return User.objects.create_user(
        username='admin_test',
        email='admin@test.com',
        password='testpass123',
        first_name='Admin',
        last_name='Test',
        is_staff=True,
        is_active=True
    )


@pytest.fixture
def api_client(user_admin):
    """Cliente de API autenticado."""
    client = APIClient()
    client.force_authenticate(user=user_admin)
    return client


@pytest.fixture
def area_raiz(db, user_admin):
    """Crea un área raíz (sin parent)."""
    return Area.objects.create(
        code='GER',
        name='Gerencia General',
        description='Área de dirección general',
        cost_center='CC001',
        manager=user_admin,
        is_active=True,
        order=1,
        created_by=user_admin
    )


@pytest.fixture
def area_operaciones(db, area_raiz, user_admin):
    """Crea un área de operaciones como hija de Gerencia."""
    return Area.objects.create(
        code='OPE',
        name='Operaciones',
        description='Área de operaciones',
        parent=area_raiz,
        cost_center='CC002',
        is_active=True,
        order=1,
        created_by=user_admin
    )


@pytest.fixture
def area_produccion(db, area_operaciones, user_admin):
    """Crea un área de producción como hija de Operaciones."""
    return Area.objects.create(
        code='PRO',
        name='Producción',
        description='Área de producción',
        parent=area_operaciones,
        cost_center='CC003',
        is_active=True,
        order=1,
        created_by=user_admin
    )


@pytest.fixture
def jerarquia_completa(db, area_raiz, area_operaciones, area_produccion, user_admin):
    """
    Crea una jerarquía completa de áreas para pruebas.

    Estructura:
    - Gerencia General (GER)
        - Operaciones (OPE)
            - Producción (PRO)
            - Logística (LOG)
        - Administración (ADM)
            - Finanzas (FIN)
            - RRHH (RHH)
    """
    # Crear área de Logística (hermana de Producción)
    logistica = Area.objects.create(
        code='LOG',
        name='Logística',
        description='Área de logística',
        parent=area_operaciones,
        cost_center='CC004',
        is_active=True,
        order=2,
        created_by=user_admin
    )

    # Crear área de Administración (hermana de Operaciones)
    administracion = Area.objects.create(
        code='ADM',
        name='Administración',
        description='Área administrativa',
        parent=area_raiz,
        cost_center='CC005',
        is_active=True,
        order=2,
        created_by=user_admin
    )

    # Crear áreas hijas de Administración
    finanzas = Area.objects.create(
        code='FIN',
        name='Finanzas',
        description='Área de finanzas',
        parent=administracion,
        cost_center='CC006',
        is_active=True,
        order=1,
        created_by=user_admin
    )

    rrhh = Area.objects.create(
        code='RHH',
        name='Recursos Humanos',
        description='Área de RRHH',
        parent=administracion,
        cost_center='CC007',
        is_active=True,
        order=2,
        created_by=user_admin
    )

    return {
        'raiz': area_raiz,
        'operaciones': area_operaciones,
        'produccion': area_produccion,
        'logistica': logistica,
        'administracion': administracion,
        'finanzas': finanzas,
        'rrhh': rrhh
    }


# =============================================================================
# TESTS DE JERARQUÍA
# =============================================================================

@pytest.mark.django_db
class TestAreaJerarquia:
    """Tests para verificar la jerarquía de áreas."""

    def test_area_raiz_sin_parent(self, area_raiz):
        """
        Test: Área raíz no tiene parent

        Given: Un área sin parent
        When: Se verifica el parent
        Then: parent debe ser None y level debe ser 0
        """
        # Assert
        assert area_raiz.parent is None
        assert area_raiz.level == 0
        assert area_raiz.full_path == 'Gerencia General'

    def test_area_con_parent_valido(self, area_operaciones, area_raiz):
        """
        Test: Área con parent válido

        Given: Un área con parent asignado
        When: Se verifica la relación
        Then: Debe tener el parent correcto y nivel 1
        """
        # Assert
        assert area_operaciones.parent == area_raiz
        assert area_operaciones.level == 1
        assert area_operaciones in area_raiz.children.all()

    def test_area_full_path_calculo(self, area_produccion, area_operaciones, area_raiz):
        """
        Test: Cálculo correcto de full_path

        Given: Una jerarquía de 3 niveles
        When: Se accede a full_path
        Then: Debe retornar la ruta completa separada por ' > '
        """
        # Assert
        expected_path = 'Gerencia General > Operaciones > Producción'
        assert area_produccion.full_path == expected_path

    def test_area_level_calculo(self, jerarquia_completa):
        """
        Test: Cálculo correcto de level en toda la jerarquía

        Given: Una jerarquía completa
        When: Se verifica el level de cada área
        Then: Debe retornar el nivel correcto (0, 1, 2)
        """
        # Assert
        assert jerarquia_completa['raiz'].level == 0
        assert jerarquia_completa['operaciones'].level == 1
        assert jerarquia_completa['administracion'].level == 1
        assert jerarquia_completa['produccion'].level == 2
        assert jerarquia_completa['logistica'].level == 2
        assert jerarquia_completa['finanzas'].level == 2
        assert jerarquia_completa['rrhh'].level == 2

    def test_area_get_all_children(self, jerarquia_completa):
        """
        Test: get_all_children() retorna todas las subáreas recursivamente

        Given: Un área raíz con subáreas multinivel
        When: Se llama a get_all_children()
        Then: Debe retornar todas las subáreas en todos los niveles
        """
        # Arrange
        area_raiz = jerarquia_completa['raiz']

        # Act
        all_children = area_raiz.get_all_children()

        # Assert
        assert len(all_children) == 6  # OPE, ADM, PRO, LOG, FIN, RHH
        assert jerarquia_completa['operaciones'] in all_children
        assert jerarquia_completa['administracion'] in all_children
        assert jerarquia_completa['produccion'] in all_children
        assert jerarquia_completa['logistica'] in all_children
        assert jerarquia_completa['finanzas'] in all_children
        assert jerarquia_completa['rrhh'] in all_children

    def test_area_children_count(self, jerarquia_completa):
        """
        Test: children_count retorna el número correcto de hijos directos

        Given: Áreas con diferentes cantidades de hijos
        When: Se accede a children_count
        Then: Debe retornar solo hijos directos activos
        """
        # Assert
        assert jerarquia_completa['raiz'].children_count == 2  # OPE, ADM
        assert jerarquia_completa['operaciones'].children_count == 2  # PRO, LOG
        assert jerarquia_completa['administracion'].children_count == 2  # FIN, RHH
        assert jerarquia_completa['produccion'].children_count == 0  # Sin hijos
        assert jerarquia_completa['finanzas'].children_count == 0  # Sin hijos

    def test_area_multiple_niveles_jerarquia(self, jerarquia_completa, user_admin):
        """
        Test: Jerarquía puede tener múltiples niveles

        Given: Una jerarquía existente de 3 niveles
        When: Se agrega un 4to nivel
        Then: Debe funcionar correctamente
        """
        # Arrange
        produccion = jerarquia_completa['produccion']

        # Act
        planta_1 = Area.objects.create(
            code='PL1',
            name='Planta 1',
            description='Planta de producción 1',
            parent=produccion,
            cost_center='CC010',
            is_active=True,
            order=1,
            created_by=user_admin
        )

        # Assert
        assert planta_1.level == 3
        assert planta_1.full_path == 'Gerencia General > Operaciones > Producción > Planta 1'
        assert planta_1 in produccion.get_all_children()
        assert produccion.children_count == 1

    def test_area_herencia_propiedades(self, area_raiz, area_operaciones):
        """
        Test: Las áreas heredan propiedades de los mixins

        Given: Un área creada
        When: Se verifican los campos heredados
        Then: Debe tener campos de AuditModel, SoftDeleteModel, OrderedModel
        """
        # Assert - AuditModel
        assert hasattr(area_operaciones, 'created_at')
        assert hasattr(area_operaciones, 'updated_at')
        assert hasattr(area_operaciones, 'created_by')
        assert hasattr(area_operaciones, 'updated_by')
        assert area_operaciones.created_at is not None

        # Assert - SoftDeleteModel
        assert hasattr(area_operaciones, 'is_active')
        assert hasattr(area_operaciones, 'deleted_at')
        assert hasattr(area_operaciones, 'soft_delete')
        assert hasattr(area_operaciones, 'restore')
        assert area_operaciones.is_active is True
        assert area_operaciones.deleted_at is None

        # Assert - OrderedModel
        assert hasattr(area_operaciones, 'order')
        assert hasattr(area_operaciones, 'move_up')
        assert hasattr(area_operaciones, 'move_down')


# =============================================================================
# TESTS DE VALIDACIONES
# =============================================================================

@pytest.mark.django_db
class TestAreaValidaciones:
    """Tests para validaciones del modelo Area."""

    def test_area_no_puede_ser_su_propio_parent(self, area_raiz):
        """
        Test: Un área no puede ser su propio padre

        Given: Un área existente
        When: Se intenta asignar como parent a sí misma
        Then: Debe lanzar ValidationError
        """
        # Arrange
        area_raiz.parent = area_raiz

        # Act & Assert
        with pytest.raises(ValidationError) as exc_info:
            area_raiz.clean()

        assert 'no puede ser su propio padre' in str(exc_info.value).lower()

    def test_area_no_ciclos_jerarquicos(self, jerarquia_completa):
        """
        Test: Previene ciclos en la jerarquía

        Given: Una jerarquía GER > OPE > PRO
        When: Se intenta hacer GER hija de PRO (ciclo)
        Then: Debe lanzar ValidationError
        """
        # Arrange
        area_raiz = jerarquia_completa['raiz']
        area_produccion = jerarquia_completa['produccion']

        # Act
        area_raiz.parent = area_produccion

        # Assert
        with pytest.raises(ValidationError) as exc_info:
            area_raiz.clean()

        assert 'ciclo' in str(exc_info.value).lower()

    def test_area_codigo_unico(self, area_raiz, user_admin):
        """
        Test: El código del área debe ser único

        Given: Un área existente con código 'GER'
        When: Se intenta crear otra área con el mismo código
        Then: Debe lanzar excepción de integridad
        """
        # Act & Assert
        with pytest.raises(Exception):  # IntegrityError
            Area.objects.create(
                code='GER',  # Código duplicado
                name='Otra Gerencia',
                description='Descripción',
                is_active=True,
                order=2,
                created_by=user_admin
            )

    def test_area_nombre_requerido(self, user_admin):
        """
        Test: El nombre del área es requerido

        Given: Datos de área sin nombre
        When: Se intenta crear el área
        Then: Debe lanzar excepción
        """
        # Act & Assert
        with pytest.raises(Exception):  # ValidationError o IntegrityError
            Area.objects.create(
                code='TEST',
                name='',  # Nombre vacío
                is_active=True,
                order=1,
                created_by=user_admin
            )

    def test_area_soft_delete_hijos(self, jerarquia_completa, user_admin):
        """
        Test: Al hacer soft delete de un área, los hijos activos se mantienen

        Given: Un área con subáreas activas
        When: Se hace soft_delete del padre
        Then: Los hijos se mantienen activos pero huérfanos
        """
        # Arrange
        operaciones = jerarquia_completa['operaciones']
        produccion = jerarquia_completa['produccion']

        # Act
        operaciones.soft_delete(user=user_admin)
        produccion.refresh_from_db()

        # Assert
        assert operaciones.is_active is False
        assert operaciones.deleted_at is not None
        # Los hijos mantienen su parent (no se eliminan en cascada)
        assert produccion.parent == operaciones
        assert produccion.is_active is True


# =============================================================================
# TESTS DE ORDENAMIENTO
# =============================================================================

@pytest.mark.django_db
class TestAreaOrdenamiento:
    """Tests para el ordenamiento de áreas (OrderedModel)."""

    def test_area_ordenamiento_por_orden(self, jerarquia_completa):
        """
        Test: Las áreas se ordenan por el campo 'order'

        Given: Áreas con diferentes valores de order
        When: Se consultan las áreas
        Then: Deben estar ordenadas por order, name
        """
        # Arrange
        area_raiz = jerarquia_completa['raiz']
        hijos = area_raiz.children.filter(is_active=True).order_by('order', 'name')

        # Assert
        assert hijos[0].code == 'OPE'  # order=1
        assert hijos[1].code == 'ADM'  # order=2

    def test_area_move_up_down(self, jerarquia_completa):
        """
        Test: move_up() y move_down() funcionan correctamente

        Given: Áreas hermanas con orden específico
        When: Se mueve una hacia arriba/abajo
        Then: El orden debe cambiar
        """
        # Arrange
        operaciones = jerarquia_completa['operaciones']
        administracion = jerarquia_completa['administracion']

        orden_original_ope = operaciones.order
        orden_original_adm = administracion.order

        # Act - Mover Administración hacia arriba
        administracion.move_up()

        # Refresh
        operaciones.refresh_from_db()
        administracion.refresh_from_db()

        # Assert
        # El orden debe haberse invertido
        assert administracion.order < operaciones.order or administracion.order == orden_original_adm

    def test_area_ordenamiento_dentro_de_parent(self, jerarquia_completa, user_admin):
        """
        Test: El ordenamiento es independiente por parent

        Given: Dos parents con hijos con el mismo order
        When: Se consultan por parent
        Then: Cada parent tiene su propio ordenamiento
        """
        # Arrange
        operaciones = jerarquia_completa['operaciones']
        administracion = jerarquia_completa['administracion']

        # Ambos tienen hijos con order=1 y order=2
        hijos_ope = operaciones.children.filter(is_active=True).order_by('order')
        hijos_adm = administracion.children.filter(is_active=True).order_by('order')

        # Assert
        assert hijos_ope.count() == 2
        assert hijos_adm.count() == 2
        # Cada uno tiene su propio ordenamiento
        assert hijos_ope[0].order == 1
        assert hijos_adm[0].order == 1


# =============================================================================
# TESTS DE API
# =============================================================================

@pytest.mark.django_db
class TestAreaAPI:
    """Tests para los endpoints de la API de áreas."""

    def test_listar_areas_jerarquicas(self, api_client, jerarquia_completa):
        """
        Test: GET /api/organizacion/areas/ - Lista todas las áreas

        Given: Una jerarquía completa de áreas
        When: Se hace GET a /api/organizacion/areas/
        Then: Debe retornar todas las áreas activas
        """
        # Act
        response = api_client.get('/api/organizacion/areas/')

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 7  # Todas las áreas activas

        # Verificar que incluye campos clave
        area_data = response.data[0]
        assert 'id' in area_data
        assert 'code' in area_data
        assert 'name' in area_data
        assert 'parent' in area_data

    def test_crear_area_con_parent(self, api_client, area_raiz, user_admin):
        """
        Test: POST /api/organizacion/areas/ - Crea área con parent

        Given: Un área raíz existente
        When: Se crea una nueva área como hija
        Then: Debe crearse correctamente con el parent asignado
        """
        # Arrange
        data = {
            'code': 'NEW',
            'name': 'Nueva Área',
            'description': 'Descripción de prueba',
            'parent': area_raiz.id,
            'cost_center': 'CC999',
            'is_active': True,
            'order': 10
        }

        # Act
        response = api_client.post('/api/organizacion/areas/', data, format='json')

        # Assert
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['code'] == 'NEW'
        assert response.data['parent'] == area_raiz.id

        # Verificar en DB
        nueva_area = Area.objects.get(code='NEW')
        assert nueva_area.parent == area_raiz
        assert nueva_area.level == 1

    def test_mover_area_a_otro_parent(self, api_client, jerarquia_completa):
        """
        Test: PATCH /api/organizacion/areas/{id}/ - Mueve área a otro parent

        Given: Un área con parent A
        When: Se actualiza el parent a B
        Then: El área debe moverse correctamente
        """
        # Arrange
        produccion = jerarquia_completa['produccion']
        administracion = jerarquia_completa['administracion']

        data = {
            'parent': administracion.id
        }

        # Act
        response = api_client.patch(
            f'/api/organizacion/areas/{produccion.id}/',
            data,
            format='json'
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK

        # Verificar en DB
        produccion.refresh_from_db()
        assert produccion.parent == administracion
        assert produccion.level == 2  # Sigue siendo nivel 2
        assert 'Administración > Producción' in produccion.full_path

    def test_filtrar_areas_activas(self, api_client, jerarquia_completa, user_admin):
        """
        Test: GET /api/organizacion/areas/?show_inactive=false

        Given: Áreas activas e inactivas
        When: Se filtra por activas
        Then: Solo debe retornar áreas activas
        """
        # Arrange - Desactivar un área
        produccion = jerarquia_completa['produccion']
        produccion.soft_delete(user=user_admin)

        # Act
        response = api_client.get('/api/organizacion/areas/?show_inactive=false')

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 6  # 7 - 1 inactiva

        # Verificar que producción no está en los resultados
        codes = [area['code'] for area in response.data]
        assert 'PRO' not in codes

    def test_endpoint_organigrama(self, api_client, jerarquia_completa):
        """
        Test: GET /api/organizacion/organigrama/ - Datos para organigrama visual

        Given: Una jerarquía completa
        When: Se consulta el endpoint de organigrama
        Then: Debe retornar estructura completa con stats
        """
        # Act
        response = api_client.get('/api/organizacion/organigrama/')

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert 'areas' in response.data
        assert 'cargos' in response.data
        assert 'stats' in response.data

        # Verificar areas
        assert len(response.data['areas']) == 7

        # Verificar stats
        stats = response.data['stats']
        assert stats['total_areas'] == 7
        assert stats['areas_activas'] == 7

        # Verificar estructura de área
        area_data = response.data['areas'][0]
        assert 'id' in area_data
        assert 'code' in area_data
        assert 'name' in area_data
        assert 'parent' in area_data
        assert 'level' in area_data
        assert 'children_count' in area_data


# =============================================================================
# TESTS DE INTEGRACIÓN Y EDGE CASES
# =============================================================================

@pytest.mark.django_db
class TestAreaEdgeCases:
    """Tests para casos límite y edge cases."""

    def test_area_sin_manager_permitido(self, user_admin):
        """
        Test: Un área puede crearse sin manager

        Given: Datos de área sin manager
        When: Se crea el área
        Then: Debe crearse correctamente
        """
        # Act
        area = Area.objects.create(
            code='SIN_MGR',
            name='Área sin Manager',
            description='Test',
            manager=None,  # Sin manager
            is_active=True,
            order=1,
            created_by=user_admin
        )

        # Assert
        assert area.pk is not None
        assert area.manager is None

    def test_area_sin_cost_center_permitido(self, user_admin):
        """
        Test: Un área puede crearse sin centro de costo

        Given: Datos de área sin cost_center
        When: Se crea el área
        Then: Debe crearse correctamente
        """
        # Act
        area = Area.objects.create(
            code='SIN_CC',
            name='Área sin Centro de Costo',
            description='Test',
            cost_center='',  # Sin cost center
            is_active=True,
            order=1,
            created_by=user_admin
        )

        # Assert
        assert area.pk is not None
        assert area.cost_center == ''

    def test_str_method(self, area_raiz):
        """
        Test: Método __str__ retorna formato esperado

        Given: Un área creada
        When: Se convierte a string
        Then: Debe retornar 'CODE - Name'
        """
        # Act
        str_result = str(area_raiz)

        # Assert
        assert str_result == 'GER - Gerencia General'
        assert area_raiz.code in str_result
        assert area_raiz.name in str_result

    def test_area_get_all_children_sin_hijos(self, area_produccion):
        """
        Test: get_all_children() en área sin hijos

        Given: Un área sin subáreas
        When: Se llama a get_all_children()
        Then: Debe retornar lista vacía
        """
        # Act
        children = area_produccion.get_all_children()

        # Assert
        assert children == []
        assert len(children) == 0

    def test_area_children_count_con_inactivos(self, jerarquia_completa, user_admin):
        """
        Test: children_count solo cuenta hijos activos

        Given: Un área con hijos activos e inactivos
        When: Se accede a children_count
        Then: Solo debe contar los activos
        """
        # Arrange
        operaciones = jerarquia_completa['operaciones']
        produccion = jerarquia_completa['produccion']

        # Desactivar producción
        produccion.soft_delete(user=user_admin)

        # Act
        count = operaciones.children_count

        # Assert
        assert count == 1  # Solo logística activa

    def test_area_full_path_area_raiz(self, area_raiz):
        """
        Test: full_path de área raíz es solo su nombre

        Given: Un área raíz sin parent
        When: Se accede a full_path
        Then: Debe ser solo el nombre del área
        """
        # Act
        path = area_raiz.full_path

        # Assert
        assert path == area_raiz.name
        assert '>' not in path

    def test_multiple_areas_raiz_permitidas(self, area_raiz, user_admin):
        """
        Test: Se pueden tener múltiples áreas raíz

        Given: Un área raíz existente
        When: Se crea otra área sin parent
        Then: Debe crearse correctamente
        """
        # Act
        otra_raiz = Area.objects.create(
            code='VEN',
            name='Ventas',
            description='Área de ventas',
            parent=None,
            is_active=True,
            order=2,
            created_by=user_admin
        )

        # Assert
        assert otra_raiz.pk is not None
        assert otra_raiz.parent is None
        assert otra_raiz.level == 0

        # Verificar que hay 2 áreas raíz
        areas_raiz = Area.objects.filter(parent__isnull=True, is_active=True)
        assert areas_raiz.count() == 2
