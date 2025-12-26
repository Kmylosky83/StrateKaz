"""
Tests para las vistas/endpoints de la API de Gestión de Proyectos (PMI)

Cobertura de tests:
1. ProyectoViewSet: CRUD completo
2. Endpoints especiales:
   - /dashboard/ - Dashboard de proyectos
   - /por_estado/ - Proyectos agrupados por estado
   - /cambiar_estado/ - Cambiar estado de proyecto
3. ActividadProyectoViewSet:
   - /actividades/gantt/ - Datos para diagrama de Gantt
4. RiesgoProyectoViewSet:
   - /riesgos/matriz_riesgos/ - Matriz de riesgos
5. SeguimientoProyectoViewSet:
   - /seguimientos/curva_s/ - Curva S del proyecto
6. Permisos: IsAuthenticated
"""
import pytest
from decimal import Decimal
from datetime import date, timedelta
from rest_framework import status
from rest_framework.test import APIClient

from apps.gestion_estrategica.gestion_proyectos.models import (
    Portafolio, Programa, Proyecto, ProjectCharter,
    ActividadProyecto, RiesgoProyecto, SeguimientoProyecto,
    ActaCierre, InteresadoProyecto
)
from apps.core.models import User


# =============================================================================
# FIXTURES
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
def user_gerente(db):
    """Crea un usuario gerente de proyecto."""
    return User.objects.create_user(
        username='gerente_test',
        email='gerente@test.com',
        password='testpass123',
        first_name='Gerente',
        last_name='Proyecto',
        is_active=True
    )


@pytest.fixture
def api_client(user_admin):
    """Cliente de API autenticado."""
    client = APIClient()
    client.force_authenticate(user=user_admin)
    return client


@pytest.fixture
def portafolio(db, user_admin):
    """Crea un portafolio de proyectos."""
    return Portafolio.objects.create(
        empresa_id=1,
        codigo='PORT-001',
        nombre='Portafolio Estratégico 2025',
        presupuesto_asignado=Decimal('1000000.00'),
        responsable=user_admin,
        is_active=True,
        created_by=user_admin
    )


@pytest.fixture
def programa(db, portafolio, user_admin):
    """Crea un programa vinculado a portafolio."""
    return Programa.objects.create(
        empresa_id=1,
        portafolio=portafolio,
        codigo='PROG-001',
        nombre='Programa de Transformación Digital',
        presupuesto=Decimal('500000.00'),
        responsable=user_admin,
        is_active=True
    )


@pytest.fixture
def proyecto(db, programa, user_admin, user_gerente):
    """Crea un proyecto básico."""
    return Proyecto.objects.create(
        empresa_id=1,
        programa=programa,
        codigo='PROY-001',
        nombre='Implementación ERP',
        descripcion='Sistema ERP para gestión integral',
        tipo=Proyecto.TipoProyecto.IMPLEMENTACION,
        estado=Proyecto.Estado.PLANIFICACION,
        prioridad=Proyecto.Prioridad.ALTA,
        fecha_inicio_plan=date(2025, 2, 1),
        fecha_fin_plan=date(2025, 7, 31),
        presupuesto_aprobado=Decimal('180000.00'),
        costo_real=Decimal('50000.00'),
        porcentaje_avance=25,
        sponsor=user_admin,
        gerente_proyecto=user_gerente,
        is_active=True,
        created_by=user_admin
    )


@pytest.fixture
def proyecto_ejecucion(db, programa, user_admin, user_gerente):
    """Crea un proyecto en estado ejecución."""
    return Proyecto.objects.create(
        empresa_id=1,
        programa=programa,
        codigo='PROY-002',
        nombre='Proyecto en Ejecución',
        estado=Proyecto.Estado.EJECUCION,
        prioridad=Proyecto.Prioridad.MEDIA,
        presupuesto_aprobado=Decimal('100000.00'),
        porcentaje_avance=60,
        gerente_proyecto=user_gerente,
        is_active=True,
        created_by=user_admin
    )


@pytest.fixture
def proyecto_completado(db, programa, user_admin, user_gerente):
    """Crea un proyecto completado."""
    return Proyecto.objects.create(
        empresa_id=1,
        programa=programa,
        codigo='PROY-003',
        nombre='Proyecto Completado',
        estado=Proyecto.Estado.COMPLETADO,
        prioridad=Proyecto.Prioridad.BAJA,
        presupuesto_aprobado=Decimal('50000.00'),
        costo_real=Decimal('48000.00'),
        porcentaje_avance=100,
        gerente_proyecto=user_gerente,
        is_active=True,
        created_by=user_admin
    )


# =============================================================================
# TESTS DE AUTENTICACIÓN
# =============================================================================

@pytest.mark.django_db
class TestAutenticacion:
    """Tests para verificar que los endpoints requieren autenticación."""

    def test_listar_proyectos_sin_autenticacion(self):
        """
        Test: Acceso sin autenticación debe fallar

        Given: Cliente sin autenticar
        When: Se intenta acceder a /api/gestion-proyectos/proyectos/
        Then: Debe retornar 401 Unauthorized
        """
        # Arrange
        client = APIClient()  # Sin autenticar

        # Act
        response = client.get('/api/gestion-proyectos/proyectos/')

        # Assert
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_crear_proyecto_sin_autenticacion(self):
        """
        Test: Crear proyecto sin autenticación

        Given: Cliente sin autenticar
        When: Se intenta crear un proyecto
        Then: Debe retornar 401 Unauthorized
        """
        # Arrange
        client = APIClient()  # Sin autenticar
        data = {
            'codigo': 'PROY-TEST',
            'nombre': 'Proyecto de Prueba'
        }

        # Act
        response = client.post('/api/gestion-proyectos/proyectos/', data)

        # Assert
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# =============================================================================
# TESTS DE CRUD DE PROYECTOS
# =============================================================================

@pytest.mark.django_db
class TestProyectoCRUD:
    """Tests para operaciones CRUD de ProyectoViewSet."""

    def test_listar_proyectos(self, api_client, proyecto, proyecto_ejecucion, proyecto_completado):
        """
        Test: GET /api/gestion-proyectos/proyectos/ - Lista todos los proyectos

        Given: Varios proyectos creados
        When: Se hace GET a la lista de proyectos
        Then: Debe retornar todos los proyectos activos
        """
        # Act
        response = api_client.get('/api/gestion-proyectos/proyectos/')

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 3

        # Verificar que usa ProyectoListSerializer (campos simplificados)
        proyecto_data = response.data[0]
        assert 'id' in proyecto_data
        assert 'codigo' in proyecto_data
        assert 'nombre' in proyecto_data
        assert 'estado' in proyecto_data
        assert 'estado_display' in proyecto_data
        assert 'porcentaje_avance' in proyecto_data

    def test_obtener_detalle_proyecto(self, api_client, proyecto):
        """
        Test: GET /api/gestion-proyectos/proyectos/{id}/ - Detalle de proyecto

        Given: Un proyecto existente
        When: Se consulta el detalle
        Then: Debe retornar ProyectoSerializer con todos los campos
        """
        # Act
        response = api_client.get(f'/api/gestion-proyectos/proyectos/{proyecto.id}/')

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert response.data['codigo'] == 'PROY-001'
        assert response.data['nombre'] == 'Implementación ERP'
        assert response.data['estado'] == 'planificacion'
        assert 'variacion_costo' in response.data
        assert 'indice_desempeno_costo' in response.data
        assert 'total_actividades' in response.data
        assert 'total_riesgos' in response.data

    def test_crear_proyecto_completo(self, api_client, programa, user_admin, user_gerente):
        """
        Test: POST /api/gestion-proyectos/proyectos/ - Crear proyecto

        Given: Datos válidos de proyecto
        When: Se crea un nuevo proyecto
        Then: Debe crearse correctamente con estado PROPUESTO por defecto
        """
        # Arrange
        data = {
            'empresa_id': 1,
            'programa': programa.id,
            'codigo': 'PROY-NEW',
            'nombre': 'Nuevo Proyecto',
            'descripcion': 'Descripción del nuevo proyecto',
            'tipo': 'mejora',
            'prioridad': 'alta',
            'presupuesto_estimado': '100000.00',
            'presupuesto_aprobado': '90000.00',
            'sponsor': user_admin.id,
            'gerente_proyecto': user_gerente.id,
            'justificacion': 'Necesario para mejorar procesos',
            'is_active': True
        }

        # Act
        response = api_client.post('/api/gestion-proyectos/proyectos/', data, format='json')

        # Assert
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['codigo'] == 'PROY-NEW'
        assert response.data['nombre'] == 'Nuevo Proyecto'
        assert response.data['estado'] == 'propuesto'  # Estado por defecto

        # Verificar en DB
        proyecto = Proyecto.objects.get(codigo='PROY-NEW')
        assert proyecto.created_by == user_admin  # Se asigna automáticamente

    def test_actualizar_proyecto(self, api_client, proyecto):
        """
        Test: PATCH /api/gestion-proyectos/proyectos/{id}/ - Actualizar proyecto

        Given: Un proyecto existente
        When: Se actualiza parcialmente
        Then: Los cambios deben guardarse correctamente
        """
        # Arrange
        data = {
            'nombre': 'Implementación ERP - Actualizado',
            'porcentaje_avance': 30
        }

        # Act
        response = api_client.patch(
            f'/api/gestion-proyectos/proyectos/{proyecto.id}/',
            data,
            format='json'
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert response.data['nombre'] == 'Implementación ERP - Actualizado'

        # Verificar en DB
        proyecto.refresh_from_db()
        assert proyecto.nombre == 'Implementación ERP - Actualizado'
        assert proyecto.porcentaje_avance == 30

    def test_eliminar_proyecto_no_permitido(self, api_client, proyecto):
        """
        Test: DELETE no debería eliminar físicamente (soft delete recomendado)

        Given: Un proyecto existente
        When: Se intenta eliminar
        Then: Puede retornar 204 o marcar como inactivo
        """
        # Act
        response = api_client.delete(f'/api/gestion-proyectos/proyectos/{proyecto.id}/')

        # Assert
        # Dependiendo de la configuración, puede ser 204 o 405
        assert response.status_code in [status.HTTP_204_NO_CONTENT, status.HTTP_405_METHOD_NOT_ALLOWED]

    def test_filtrar_proyectos_por_estado(self, api_client, proyecto, proyecto_ejecucion, proyecto_completado):
        """
        Test: Filtrar proyectos por estado

        Given: Proyectos en diferentes estados
        When: Se filtra por estado=ejecucion
        Then: Solo debe retornar proyectos en ejecución
        """
        # Act
        response = api_client.get('/api/gestion-proyectos/proyectos/?estado=ejecucion')

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        for proyecto_data in response.data:
            assert proyecto_data['estado'] == 'ejecucion'

    def test_filtrar_proyectos_por_prioridad(self, api_client, proyecto, proyecto_ejecucion):
        """
        Test: Filtrar proyectos por prioridad

        Given: Proyectos con diferentes prioridades
        When: Se filtra por prioridad=alta
        Then: Solo debe retornar proyectos de alta prioridad
        """
        # Act
        response = api_client.get('/api/gestion-proyectos/proyectos/?prioridad=alta')

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        for proyecto_data in response.data:
            assert proyecto_data['prioridad'] == 'alta'

    def test_buscar_proyectos_por_nombre(self, api_client, proyecto):
        """
        Test: Buscar proyectos por nombre

        Given: Proyectos con nombres diferentes
        When: Se busca por nombre
        Then: Debe retornar proyectos que coincidan
        """
        # Act
        response = api_client.get('/api/gestion-proyectos/proyectos/?search=ERP')

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        assert 'ERP' in response.data[0]['nombre']


# =============================================================================
# TESTS DE ENDPOINTS ESPECIALES DE PROYECTO
# =============================================================================

@pytest.mark.django_db
class TestProyectoEndpointsEspeciales:
    """Tests para endpoints especiales de ProyectoViewSet."""

    def test_dashboard_proyectos(self, api_client, proyecto, proyecto_ejecucion, proyecto_completado):
        """
        Test: GET /api/gestion-proyectos/proyectos/dashboard/

        Given: Varios proyectos con diferentes estados
        When: Se consulta el dashboard
        Then: Debe retornar estadísticas agregadas
        """
        # Act
        response = api_client.get('/api/gestion-proyectos/proyectos/dashboard/')

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert 'total_proyectos' in response.data
        assert 'proyectos_por_estado' in response.data
        assert 'proyectos_por_prioridad' in response.data
        assert 'proyectos_criticos' in response.data
        assert 'porcentaje_avance_promedio' in response.data
        assert 'presupuesto_total' in response.data
        assert 'costo_total_real' in response.data

        # Verificar que hay datos
        assert response.data['total_proyectos'] >= 3
        assert 'planificacion' in response.data['proyectos_por_estado']
        assert 'ejecucion' in response.data['proyectos_por_estado']

    def test_dashboard_filtrado_por_empresa(self, api_client, proyecto):
        """
        Test: Dashboard filtrado por empresa

        Given: Proyectos de empresa_id=1
        When: Se consulta dashboard con empresa=1
        Then: Solo debe incluir proyectos de esa empresa
        """
        # Act
        response = api_client.get('/api/gestion-proyectos/proyectos/dashboard/?empresa=1')

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert 'total_proyectos' in response.data

    def test_por_estado_agrupa_correctamente(self, api_client, proyecto, proyecto_ejecucion, proyecto_completado):
        """
        Test: GET /api/gestion-proyectos/proyectos/por_estado/

        Given: Proyectos en diferentes estados
        When: Se consulta por_estado
        Then: Debe retornar proyectos agrupados por cada estado
        """
        # Act
        response = api_client.get('/api/gestion-proyectos/proyectos/por_estado/')

        # Assert
        assert response.status_code == status.HTTP_200_OK

        # Verificar que incluye todos los estados posibles
        for estado, _ in Proyecto.Estado.choices:
            assert estado in response.data

        # Verificar que planificacion tiene al menos un proyecto
        assert len(response.data['planificacion']) >= 1
        assert response.data['planificacion'][0]['codigo'] == 'PROY-001'

        # Verificar que ejecucion tiene al menos un proyecto
        assert len(response.data['ejecucion']) >= 1

        # Verificar que completado tiene al menos un proyecto
        assert len(response.data['completado']) >= 1

    def test_cambiar_estado_proyecto_valido(self, api_client, proyecto):
        """
        Test: POST /api/gestion-proyectos/proyectos/{id}/cambiar_estado/

        Given: Un proyecto en estado PLANIFICACION
        When: Se cambia a estado EJECUCION
        Then: El estado debe actualizarse correctamente
        """
        # Arrange
        assert proyecto.estado == Proyecto.Estado.PLANIFICACION
        data = {'estado': 'ejecucion'}

        # Act
        response = api_client.post(
            f'/api/gestion-proyectos/proyectos/{proyecto.id}/cambiar_estado/',
            data,
            format='json'
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert response.data['estado'] == 'ejecucion'
        assert 'Ejecución' in response.data['detail']

        # Verificar en DB
        proyecto.refresh_from_db()
        assert proyecto.estado == Proyecto.Estado.EJECUCION

    def test_cambiar_estado_proyecto_invalido(self, api_client, proyecto):
        """
        Test: Cambiar a estado inválido

        Given: Un proyecto existente
        When: Se intenta cambiar a estado inválido
        Then: Debe retornar 400 Bad Request
        """
        # Arrange
        data = {'estado': 'estado_invalido'}

        # Act
        response = api_client.post(
            f'/api/gestion-proyectos/proyectos/{proyecto.id}/cambiar_estado/',
            data,
            format='json'
        )

        # Assert
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'inválido' in response.data['detail'].lower()


# =============================================================================
# TESTS DE ACTIVIDADES Y GANTT
# =============================================================================

@pytest.mark.django_db
class TestActividadesGantt:
    """Tests para ActividadProyectoViewSet y endpoint Gantt."""

    def test_listar_actividades(self, api_client, proyecto, user_gerente):
        """
        Test: GET /api/gestion-proyectos/actividades/

        Given: Actividades creadas
        When: Se lista
        Then: Debe retornar todas las actividades
        """
        # Arrange
        ActividadProyecto.objects.create(
            proyecto=proyecto,
            codigo_wbs='1.1',
            nombre='Análisis de Requerimientos',
            estado=ActividadProyecto.Estado.PENDIENTE,
            fecha_inicio_plan=date(2025, 2, 1),
            fecha_fin_plan=date(2025, 2, 15),
            responsable=user_gerente,
            is_active=True
        )

        # Act
        response = api_client.get('/api/gestion-proyectos/actividades/')

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_gantt_retorna_datos_correctos(self, api_client, proyecto, user_gerente):
        """
        Test: GET /api/gestion-proyectos/actividades/gantt/

        Given: Actividades con fechas y dependencias
        When: Se consulta el endpoint gantt
        Then: Debe retornar estructura para diagrama de Gantt
        """
        # Arrange
        act1 = ActividadProyecto.objects.create(
            proyecto=proyecto,
            codigo_wbs='1.1',
            nombre='Análisis',
            fecha_inicio_plan=date(2025, 2, 1),
            fecha_fin_plan=date(2025, 2, 15),
            porcentaje_avance=100,
            responsable=user_gerente,
            is_active=True
        )

        act2 = ActividadProyecto.objects.create(
            proyecto=proyecto,
            codigo_wbs='1.2',
            nombre='Diseño',
            fecha_inicio_plan=date(2025, 2, 16),
            fecha_fin_plan=date(2025, 3, 1),
            porcentaje_avance=50,
            responsable=user_gerente,
            is_active=True
        )
        act2.predecesoras.add(act1)

        # Act
        response = api_client.get(f'/api/gestion-proyectos/actividades/gantt/?proyecto={proyecto.id}')

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2

        # Verificar estructura de datos
        actividad_data = response.data[0]
        assert 'id' in actividad_data
        assert 'codigo_wbs' in actividad_data
        assert 'nombre' in actividad_data
        assert 'inicio' in actividad_data
        assert 'fin' in actividad_data
        assert 'avance' in actividad_data
        assert 'responsable' in actividad_data
        assert 'predecesoras' in actividad_data
        assert 'estado' in actividad_data

        # Verificar que la segunda actividad tiene predecesora
        act2_data = next(a for a in response.data if a['codigo_wbs'] == '1.2')
        assert act1.id in act2_data['predecesoras']

    def test_gantt_sin_proyecto_retorna_error(self, api_client):
        """
        Test: Gantt requiere parámetro proyecto

        Given: Endpoint gantt
        When: Se consulta sin parámetro proyecto
        Then: Debe retornar 400 Bad Request
        """
        # Act
        response = api_client.get('/api/gestion-proyectos/actividades/gantt/')

        # Assert
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'proyecto' in response.data['detail'].lower()


# =============================================================================
# TESTS DE RIESGOS Y MATRIZ
# =============================================================================

@pytest.mark.django_db
class TestRiesgosMatriz:
    """Tests para RiesgoProyectoViewSet y matriz de riesgos."""

    def test_listar_riesgos(self, api_client, proyecto, user_gerente):
        """
        Test: GET /api/gestion-proyectos/riesgos/

        Given: Riesgos creados
        When: Se lista
        Then: Debe retornar todos los riesgos
        """
        # Arrange
        RiesgoProyecto.objects.create(
            proyecto=proyecto,
            codigo='R-001',
            descripcion='Riesgo técnico',
            probabilidad=RiesgoProyecto.Probabilidad.ALTA,
            impacto=RiesgoProyecto.Impacto.ALTO,
            responsable=user_gerente,
            is_active=True
        )

        # Act
        response = api_client.get('/api/gestion-proyectos/riesgos/')

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_matriz_riesgos_retorna_estructura_correcta(self, api_client, proyecto, user_gerente):
        """
        Test: GET /api/gestion-proyectos/riesgos/matriz_riesgos/

        Given: Riesgos con diferentes probabilidades e impactos
        When: Se consulta matriz_riesgos
        Then: Debe retornar matriz 5x5 con riesgos clasificados
        """
        # Arrange
        RiesgoProyecto.objects.create(
            proyecto=proyecto,
            codigo='R-ALTO',
            descripcion='Riesgo crítico',
            probabilidad=RiesgoProyecto.Probabilidad.ALTA,
            impacto=RiesgoProyecto.Impacto.ALTO,
            is_active=True
        )

        RiesgoProyecto.objects.create(
            proyecto=proyecto,
            codigo='R-MEDIO',
            descripcion='Riesgo medio',
            probabilidad=RiesgoProyecto.Probabilidad.MEDIA,
            impacto=RiesgoProyecto.Impacto.MEDIO,
            is_active=True
        )

        RiesgoProyecto.objects.create(
            proyecto=proyecto,
            codigo='R-BAJO',
            descripcion='Riesgo bajo',
            probabilidad=RiesgoProyecto.Probabilidad.BAJA,
            impacto=RiesgoProyecto.Impacto.BAJO,
            is_active=True
        )

        # Act
        response = api_client.get(f'/api/gestion-proyectos/riesgos/matriz_riesgos/?proyecto={proyecto.id}')

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert 'matriz' in response.data
        assert 'total_riesgos' in response.data
        assert 'riesgos_alto_nivel' in response.data

        # Verificar estructura de matriz 5x5
        matriz = response.data['matriz']
        for prob in ['muy_baja', 'baja', 'media', 'alta', 'muy_alta']:
            assert prob in matriz
            for imp in ['muy_bajo', 'bajo', 'medio', 'alto', 'muy_alto']:
                assert imp in matriz[prob]

        # Verificar que el riesgo alto está en su celda
        assert len(matriz['alta']['alto']) >= 1

        # Verificar totales
        assert response.data['total_riesgos'] == 3
        assert response.data['riesgos_alto_nivel'] >= 1

    def test_matriz_riesgos_excluye_materializados(self, api_client, proyecto):
        """
        Test: Matriz de riesgos excluye riesgos materializados

        Given: Riesgos materializados y no materializados
        When: Se consulta matriz_riesgos
        Then: Solo debe incluir riesgos no materializados
        """
        # Arrange
        RiesgoProyecto.objects.create(
            proyecto=proyecto,
            codigo='R-ACTIVO',
            descripcion='Riesgo activo',
            probabilidad=RiesgoProyecto.Probabilidad.ALTA,
            impacto=RiesgoProyecto.Impacto.ALTO,
            is_materializado=False,
            is_active=True
        )

        RiesgoProyecto.objects.create(
            proyecto=proyecto,
            codigo='R-MATERIALIZADO',
            descripcion='Riesgo materializado',
            probabilidad=RiesgoProyecto.Probabilidad.ALTA,
            impacto=RiesgoProyecto.Impacto.ALTO,
            is_materializado=True,
            is_active=True
        )

        # Act
        response = api_client.get(f'/api/gestion-proyectos/riesgos/matriz_riesgos/?proyecto={proyecto.id}')

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert response.data['total_riesgos'] == 1  # Solo el no materializado

    def test_matriz_riesgos_sin_proyecto_retorna_error(self, api_client):
        """
        Test: Matriz requiere parámetro proyecto

        Given: Endpoint matriz_riesgos
        When: Se consulta sin parámetro proyecto
        Then: Debe retornar 400 Bad Request
        """
        # Act
        response = api_client.get('/api/gestion-proyectos/riesgos/matriz_riesgos/')

        # Assert
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'proyecto' in response.data['detail'].lower()


# =============================================================================
# TESTS DE SEGUIMIENTOS Y CURVA S
# =============================================================================

@pytest.mark.django_db
class TestSeguimientosCurvaS:
    """Tests para SeguimientoProyectoViewSet y curva S."""

    def test_listar_seguimientos(self, api_client, proyecto, user_gerente):
        """
        Test: GET /api/gestion-proyectos/seguimientos/

        Given: Seguimientos creados
        When: Se lista
        Then: Debe retornar todos los seguimientos
        """
        # Arrange
        SeguimientoProyecto.objects.create(
            proyecto=proyecto,
            fecha=date.today(),
            porcentaje_avance=30,
            costo_acumulado=Decimal('60000.00'),
            valor_planificado=Decimal('54000.00'),
            valor_ganado=Decimal('54000.00'),
            costo_actual=Decimal('60000.00'),
            registrado_por=user_gerente
        )

        # Act
        response = api_client.get('/api/gestion-proyectos/seguimientos/')

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_crear_seguimiento_actualiza_proyecto(self, api_client, proyecto, user_gerente):
        """
        Test: POST /api/gestion-proyectos/seguimientos/

        Given: Un proyecto con avance actual
        When: Se crea un seguimiento
        Then: Debe actualizar porcentaje_avance y costo_real del proyecto
        """
        # Arrange
        assert proyecto.porcentaje_avance == 25
        data = {
            'proyecto': proyecto.id,
            'fecha': date.today().isoformat(),
            'porcentaje_avance': 40,
            'costo_acumulado': '75000.00',
            'estado_general': 'verde',
            'valor_planificado': '72000.00',
            'valor_ganado': '72000.00',
            'costo_actual': '75000.00'
        }

        # Act
        response = api_client.post('/api/gestion-proyectos/seguimientos/', data, format='json')

        # Assert
        assert response.status_code == status.HTTP_201_CREATED

        # Verificar que el proyecto se actualizó
        proyecto.refresh_from_db()
        assert proyecto.porcentaje_avance == 40
        assert proyecto.costo_real == Decimal('75000.00')

    def test_curva_s_retorna_datos_historicos(self, api_client, proyecto, user_gerente):
        """
        Test: GET /api/gestion-proyectos/seguimientos/curva_s/

        Given: Múltiples seguimientos en diferentes fechas
        When: Se consulta curva_s
        Then: Debe retornar serie temporal con PV, EV, AC
        """
        # Arrange
        base_date = date(2025, 2, 1)
        for i in range(5):
            SeguimientoProyecto.objects.create(
                proyecto=proyecto,
                fecha=base_date + timedelta(days=i*30),
                porcentaje_avance=(i+1) * 20,
                valor_planificado=Decimal((i+1) * 36000),
                valor_ganado=Decimal((i+1) * 36000),
                costo_actual=Decimal((i+1) * 40000),
                registrado_por=user_gerente
            )

        # Act
        response = api_client.get(f'/api/gestion-proyectos/seguimientos/curva_s/?proyecto={proyecto.id}')

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 5

        # Verificar estructura de cada punto
        punto = response.data[0]
        assert 'fecha' in punto
        assert 'valor_planificado' in punto
        assert 'valor_ganado' in punto
        assert 'costo_actual' in punto
        assert 'avance' in punto
        assert 'spi' in punto
        assert 'cpi' in punto

        # Verificar orden cronológico
        fechas = [punto['fecha'] for punto in response.data]
        assert fechas == sorted(fechas)

    def test_curva_s_sin_proyecto_retorna_error(self, api_client):
        """
        Test: Curva S requiere parámetro proyecto

        Given: Endpoint curva_s
        When: Se consulta sin parámetro proyecto
        Then: Debe retornar 400 Bad Request
        """
        # Act
        response = api_client.get('/api/gestion-proyectos/seguimientos/curva_s/')

        # Assert
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'proyecto' in response.data['detail'].lower()


# =============================================================================
# TESTS DE ACTA DE CIERRE
# =============================================================================

@pytest.mark.django_db
class TestActaCierre:
    """Tests para ActaCierreViewSet."""

    def test_crear_acta_cierre_cambia_estado_proyecto(self, api_client, proyecto, user_admin):
        """
        Test: POST /api/gestion-proyectos/actas-cierre/

        Given: Un proyecto en estado CIERRE
        When: Se crea un acta de cierre
        Then: El proyecto debe cambiar a estado COMPLETADO
        """
        # Arrange
        proyecto.estado = Proyecto.Estado.CIERRE
        proyecto.save()

        data = {
            'proyecto': proyecto.id,
            'fecha_cierre': date.today().isoformat(),
            'objetivos_cumplidos': 'Todos los objetivos cumplidos',
            'entregables_completados': 'Sistema ERP funcionando',
            'presupuesto_final': '180000.00',
            'costo_final': '175000.00',
            'duracion_planificada_dias': 180,
            'duracion_real_dias': 185,
            'aprobado_por_sponsor': True
        }

        # Act
        response = api_client.post('/api/gestion-proyectos/actas-cierre/', data, format='json')

        # Assert
        assert response.status_code == status.HTTP_201_CREATED

        # Verificar que el proyecto cambió a COMPLETADO
        proyecto.refresh_from_db()
        assert proyecto.estado == Proyecto.Estado.COMPLETADO
        assert proyecto.fecha_fin_real == date.today()

    def test_listar_actas_cierre(self, api_client, proyecto, user_admin):
        """
        Test: GET /api/gestion-proyectos/actas-cierre/

        Given: Actas de cierre creadas
        When: Se lista
        Then: Debe retornar todas las actas
        """
        # Arrange
        ActaCierre.objects.create(
            proyecto=proyecto,
            fecha_cierre=date.today(),
            objetivos_cumplidos='Objetivos cumplidos',
            entregables_completados='Entregables completos',
            presupuesto_final=Decimal('180000.00'),
            costo_final=Decimal('180000.00'),
            duracion_planificada_dias=180,
            duracion_real_dias=180,
            created_by=user_admin
        )

        # Act
        response = api_client.get('/api/gestion-proyectos/actas-cierre/')

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1


# =============================================================================
# TESTS DE OTROS VIEWSETS
# =============================================================================

@pytest.mark.django_db
class TestOtrosViewSets:
    """Tests para otros ViewSets del módulo."""

    def test_listar_portafolios(self, api_client, portafolio):
        """Test: GET /api/gestion-proyectos/portafolios/"""
        response = api_client.get('/api/gestion-proyectos/portafolios/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_listar_programas(self, api_client, programa):
        """Test: GET /api/gestion-proyectos/programas/"""
        response = api_client.get('/api/gestion-proyectos/programas/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_listar_charters(self, api_client, proyecto):
        """Test: GET /api/gestion-proyectos/charters/"""
        ProjectCharter.objects.create(
            proyecto=proyecto,
            proposito='Propósito del proyecto',
            objetivos_medibles='Objetivos medibles',
            version=1
        )
        response = api_client.get('/api/gestion-proyectos/charters/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_listar_interesados(self, api_client, proyecto):
        """Test: GET /api/gestion-proyectos/interesados/"""
        InteresadoProyecto.objects.create(
            proyecto=proyecto,
            nombre='Juan Pérez',
            nivel_interes=InteresadoProyecto.NivelInteres.ALTO,
            nivel_influencia=InteresadoProyecto.NivelInfluencia.ALTA,
            is_active=True
        )
        response = api_client.get('/api/gestion-proyectos/interesados/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
