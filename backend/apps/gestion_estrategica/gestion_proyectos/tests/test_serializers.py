"""
Tests para serializers de Gestión de Proyectos (PMI)

Cobertura de tests:
1. ProyectoListSerializer vs ProyectoSerializer
2. Campos read_only en serializers
3. Relaciones anidadas (charter, etc.)
4. Campos computados (variacion_costo, indice_desempeno_costo)
5. Validaciones de serializers
"""
import pytest
from decimal import Decimal
from datetime import date

from apps.gestion_estrategica.gestion_proyectos.models import (
    Portafolio, Programa, Proyecto, ProjectCharter,
    RiesgoProyecto, SeguimientoProyecto, ActaCierre
)
from apps.gestion_estrategica.gestion_proyectos.serializers import (
    PortafolioSerializer, ProgramaSerializer,
    ProyectoSerializer, ProyectoListSerializer, ProyectoCreateUpdateSerializer,
    ProjectCharterSerializer, RiesgoProyectoSerializer,
    SeguimientoProyectoSerializer, ActaCierreSerializer
)
from apps.core.models import User


# =============================================================================
# FIXTURES
# =============================================================================

@pytest.fixture
def user_admin(db):
    """Crea un usuario administrador."""
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
def proyecto_con_charter(db, proyecto):
    """Crea un proyecto con charter."""
    charter = ProjectCharter.objects.create(
        proyecto=proyecto,
        proposito='Implementar sistema ERP moderno',
        objetivos_medibles='Go-live en 6 meses',
        version=1
    )
    return proyecto


# =============================================================================
# TESTS DE PORTAFOLIO SERIALIZER
# =============================================================================

@pytest.mark.django_db
class TestPortafolioSerializer:
    """Tests para PortafolioSerializer."""

    def test_serializar_portafolio_basico(self, portafolio):
        """
        Test: Serializar portafolio con campos básicos

        Given: Un portafolio creado
        When: Se serializa
        Then: Debe incluir todos los campos básicos
        """
        # Act
        serializer = PortafolioSerializer(portafolio)
        data = serializer.data

        # Assert
        assert data['codigo'] == 'PORT-001'
        assert data['nombre'] == 'Portafolio Estratégico 2025'
        assert data['presupuesto_asignado'] == '1000000.00'
        assert 'responsable' in data
        assert 'is_active' in data

    def test_campo_responsable_nombre_read_only(self, portafolio):
        """
        Test: Campo responsable_nombre es read_only

        Given: Un portafolio con responsable
        When: Se serializa
        Then: Debe incluir responsable_nombre calculado
        """
        # Act
        serializer = PortafolioSerializer(portafolio)
        data = serializer.data

        # Assert
        assert 'responsable_nombre' in data
        assert data['responsable_nombre'] == 'Admin Test'

    def test_metodo_total_programas(self, portafolio, programa):
        """
        Test: SerializerMethodField total_programas

        Given: Un portafolio con programas
        When: Se serializa
        Then: Debe calcular el total de programas activos
        """
        # Act
        serializer = PortafolioSerializer(portafolio)
        data = serializer.data

        # Assert
        assert 'total_programas' in data
        assert data['total_programas'] == 1

    def test_metodo_total_proyectos(self, portafolio, programa, proyecto):
        """
        Test: SerializerMethodField total_proyectos

        Given: Un portafolio con programas que tienen proyectos
        When: Se serializa
        Then: Debe calcular el total de proyectos activos
        """
        # Act
        serializer = PortafolioSerializer(portafolio)
        data = serializer.data

        # Assert
        assert 'total_proyectos' in data
        assert data['total_proyectos'] == 1

    def test_campos_read_only(self, portafolio):
        """
        Test: Campos read_only definidos en Meta

        Given: PortafolioSerializer
        When: Se verifica read_only_fields
        Then: Debe incluir created_at, updated_at, created_by
        """
        # Act
        serializer = PortafolioSerializer(portafolio)

        # Assert
        assert 'created_at' in serializer.Meta.read_only_fields
        assert 'updated_at' in serializer.Meta.read_only_fields
        assert 'created_by' in serializer.Meta.read_only_fields


# =============================================================================
# TESTS DE PROGRAMA SERIALIZER
# =============================================================================

@pytest.mark.django_db
class TestProgramaSerializer:
    """Tests para ProgramaSerializer."""

    def test_serializar_programa_basico(self, programa):
        """
        Test: Serializar programa con campos básicos

        Given: Un programa creado
        When: Se serializa
        Then: Debe incluir todos los campos
        """
        # Act
        serializer = ProgramaSerializer(programa)
        data = serializer.data

        # Assert
        assert data['codigo'] == 'PROG-001'
        assert data['nombre'] == 'Programa de Transformación Digital'
        assert data['presupuesto'] == '500000.00'
        assert 'portafolio' in data

    def test_campo_portafolio_nombre_read_only(self, programa):
        """
        Test: Campo portafolio_nombre es read_only

        Given: Un programa con portafolio
        When: Se serializa
        Then: Debe incluir portafolio_nombre calculado
        """
        # Act
        serializer = ProgramaSerializer(programa)
        data = serializer.data

        # Assert
        assert 'portafolio_nombre' in data
        assert data['portafolio_nombre'] == 'Portafolio Estratégico 2025'

    def test_metodo_total_proyectos(self, programa, proyecto):
        """
        Test: SerializerMethodField total_proyectos

        Given: Un programa con proyectos
        When: Se serializa
        Then: Debe calcular el total de proyectos activos
        """
        # Act
        serializer = ProgramaSerializer(programa)
        data = serializer.data

        # Assert
        assert 'total_proyectos' in data
        assert data['total_proyectos'] == 1


# =============================================================================
# TESTS DE PROYECTO SERIALIZERS
# =============================================================================

@pytest.mark.django_db
class TestProyectoSerializers:
    """Tests para ProyectoSerializer, ProyectoListSerializer, ProyectoCreateUpdateSerializer."""

    def test_proyecto_list_serializer_campos_simplificados(self, proyecto):
        """
        Test: ProyectoListSerializer tiene solo campos esenciales

        Given: Un proyecto
        When: Se usa ProyectoListSerializer
        Then: Debe incluir solo campos de lista (sin relaciones anidadas)
        """
        # Act
        serializer = ProyectoListSerializer(proyecto)
        data = serializer.data

        # Assert
        # Campos esenciales presentes
        assert 'id' in data
        assert 'codigo' in data
        assert 'nombre' in data
        assert 'tipo' in data
        assert 'tipo_display' in data
        assert 'estado' in data
        assert 'estado_display' in data
        assert 'prioridad' in data
        assert 'prioridad_display' in data
        assert 'programa_nombre' in data
        assert 'gerente_nombre' in data
        assert 'porcentaje_avance' in data

        # No debe incluir relaciones anidadas pesadas
        assert 'charter' not in data
        assert 'variacion_costo' not in data
        assert 'total_actividades' not in data

    def test_proyecto_serializer_completo(self, proyecto_con_charter):
        """
        Test: ProyectoSerializer incluye todos los campos y relaciones

        Given: Un proyecto con charter
        When: Se usa ProyectoSerializer
        Then: Debe incluir campos completos, propiedades y relaciones
        """
        # Act
        serializer = ProyectoSerializer(proyecto_con_charter)
        data = serializer.data

        # Assert
        # Campos básicos
        assert data['codigo'] == 'PROY-001'
        assert data['nombre'] == 'Implementación ERP'

        # Campos display
        assert 'estado_display' in data
        assert 'tipo_display' in data
        assert 'prioridad_display' in data

        # Campos de nombres
        assert 'programa_nombre' in data
        assert 'sponsor_nombre' in data
        assert 'gerente_nombre' in data

        # Propiedades computadas
        assert 'variacion_costo' in data
        assert 'indice_desempeno_costo' in data

        # Relaciones anidadas
        assert 'charter' in data
        assert data['charter'] is not None

        # SerializerMethodFields
        assert 'total_actividades' in data
        assert 'total_riesgos' in data
        assert 'total_recursos' in data

    def test_proyecto_variacion_costo_serializada(self, proyecto):
        """
        Test: variacion_costo se serializa correctamente

        Given: Un proyecto con presupuesto y costo real
        When: Se serializa con ProyectoSerializer
        Then: Debe incluir variacion_costo calculada
        """
        # Arrange
        proyecto.presupuesto_aprobado = Decimal('180000.00')
        proyecto.porcentaje_avance = 25
        proyecto.costo_real = Decimal('50000.00')
        proyecto.save()

        # Act
        serializer = ProyectoSerializer(proyecto)
        data = serializer.data

        # Assert
        # EV = 180000 * 0.25 = 45000
        # CV = 45000 - 50000 = -5000
        assert 'variacion_costo' in data
        assert Decimal(data['variacion_costo']) == Decimal('-5000.00')

    def test_proyecto_indice_desempeno_costo_serializado(self, proyecto):
        """
        Test: indice_desempeno_costo se serializa correctamente

        Given: Un proyecto con presupuesto y costo real
        When: Se serializa con ProyectoSerializer
        Then: Debe incluir indice_desempeno_costo calculado
        """
        # Arrange
        proyecto.presupuesto_aprobado = Decimal('180000.00')
        proyecto.porcentaje_avance = 30
        proyecto.costo_real = Decimal('40000.00')
        proyecto.save()

        # Act
        serializer = ProyectoSerializer(proyecto)
        data = serializer.data

        # Assert
        # EV = 180000 * 0.30 = 54000
        # CPI = 54000 / 40000 = 1.35
        assert 'indice_desempeno_costo' in data
        assert data['indice_desempeno_costo'] == 1.35

    def test_proyecto_create_update_serializer_excluye_read_only(self):
        """
        Test: ProyectoCreateUpdateSerializer define campos read_only

        Given: ProyectoCreateUpdateSerializer
        When: Se verifica read_only_fields
        Then: Debe incluir campos de auditoría
        """
        # Act
        serializer = ProyectoCreateUpdateSerializer()

        # Assert
        assert 'created_at' in serializer.Meta.read_only_fields
        assert 'updated_at' in serializer.Meta.read_only_fields
        assert 'fecha_propuesta' in serializer.Meta.read_only_fields
        assert 'created_by' in serializer.Meta.read_only_fields

    def test_proyecto_charter_anidado(self, proyecto_con_charter):
        """
        Test: Charter se serializa como objeto anidado

        Given: Un proyecto con charter
        When: Se serializa con ProyectoSerializer
        Then: charter debe ser un objeto anidado completo
        """
        # Act
        serializer = ProyectoSerializer(proyecto_con_charter)
        data = serializer.data

        # Assert
        assert 'charter' in data
        assert data['charter'] is not None
        assert 'proposito' in data['charter']
        assert 'objetivos_medibles' in data['charter']
        assert data['charter']['proposito'] == 'Implementar sistema ERP moderno'


# =============================================================================
# TESTS DE PROJECT CHARTER SERIALIZER
# =============================================================================

@pytest.mark.django_db
class TestProjectCharterSerializer:
    """Tests para ProjectCharterSerializer."""

    def test_serializar_charter_basico(self, proyecto):
        """
        Test: Serializar charter con campos básicos

        Given: Un charter creado
        When: Se serializa
        Then: Debe incluir todos los campos
        """
        # Arrange
        charter = ProjectCharter.objects.create(
            proyecto=proyecto,
            proposito='Propósito del proyecto',
            objetivos_medibles='Objetivos claros',
            version=1
        )

        # Act
        serializer = ProjectCharterSerializer(charter)
        data = serializer.data

        # Assert
        assert 'proyecto' in data
        assert data['proposito'] == 'Propósito del proyecto'
        assert data['objetivos_medibles'] == 'Objetivos claros'
        assert data['version'] == 1

    def test_campo_aprobado_por_nombre_read_only(self, proyecto, user_admin):
        """
        Test: Campo aprobado_por_nombre es read_only

        Given: Un charter con aprobador
        When: Se serializa
        Then: Debe incluir aprobado_por_nombre
        """
        # Arrange
        charter = ProjectCharter.objects.create(
            proyecto=proyecto,
            proposito='Propósito',
            objetivos_medibles='Objetivos',
            aprobado_por=user_admin,
            version=1
        )

        # Act
        serializer = ProjectCharterSerializer(charter)
        data = serializer.data

        # Assert
        assert 'aprobado_por_nombre' in data
        assert data['aprobado_por_nombre'] == 'Admin Test'

    def test_campos_read_only(self):
        """
        Test: Campos read_only definidos en Meta

        Given: ProjectCharterSerializer
        When: Se verifica read_only_fields
        Then: Debe incluir created_at, updated_at
        """
        # Act
        serializer = ProjectCharterSerializer()

        # Assert
        assert 'created_at' in serializer.Meta.read_only_fields
        assert 'updated_at' in serializer.Meta.read_only_fields


# =============================================================================
# TESTS DE RIESGO PROYECTO SERIALIZER
# =============================================================================

@pytest.mark.django_db
class TestRiesgoProyectoSerializer:
    """Tests para RiesgoProyectoSerializer."""

    def test_serializar_riesgo_basico(self, proyecto):
        """
        Test: Serializar riesgo con campos básicos

        Given: Un riesgo creado
        When: Se serializa
        Then: Debe incluir todos los campos
        """
        # Arrange
        riesgo = RiesgoProyecto.objects.create(
            proyecto=proyecto,
            codigo='R-001',
            descripcion='Riesgo técnico',
            probabilidad=RiesgoProyecto.Probabilidad.ALTA,
            impacto=RiesgoProyecto.Impacto.ALTO,
            is_active=True
        )

        # Act
        serializer = RiesgoProyectoSerializer(riesgo)
        data = serializer.data

        # Assert
        assert data['codigo'] == 'R-001'
        assert data['descripcion'] == 'Riesgo técnico'
        assert data['probabilidad'] == 'alta'
        assert data['impacto'] == 'alto'

    def test_campo_nivel_riesgo_read_only(self, proyecto):
        """
        Test: Campo nivel_riesgo es read_only y se calcula

        Given: Un riesgo con probabilidad e impacto
        When: Se serializa
        Then: Debe incluir nivel_riesgo calculado (P x I)
        """
        # Arrange
        riesgo = RiesgoProyecto.objects.create(
            proyecto=proyecto,
            codigo='R-002',
            descripcion='Riesgo crítico',
            probabilidad=RiesgoProyecto.Probabilidad.MUY_ALTA,  # 5
            impacto=RiesgoProyecto.Impacto.MUY_ALTO,  # 5
            is_active=True
        )

        # Act
        serializer = RiesgoProyectoSerializer(riesgo)
        data = serializer.data

        # Assert
        assert 'nivel_riesgo' in data
        assert data['nivel_riesgo'] == 25  # 5 * 5

    def test_campos_display_read_only(self, proyecto):
        """
        Test: Campos display son read_only

        Given: Un riesgo
        When: Se serializa
        Then: Debe incluir campos display
        """
        # Arrange
        riesgo = RiesgoProyecto.objects.create(
            proyecto=proyecto,
            codigo='R-003',
            descripcion='Riesgo',
            probabilidad=RiesgoProyecto.Probabilidad.MEDIA,
            impacto=RiesgoProyecto.Impacto.MEDIO,
            tipo=RiesgoProyecto.TipoRiesgo.AMENAZA,
            is_active=True
        )

        # Act
        serializer = RiesgoProyectoSerializer(riesgo)
        data = serializer.data

        # Assert
        assert 'probabilidad_display' in data
        assert 'Media' in data['probabilidad_display']
        assert 'impacto_display' in data
        assert 'Medio' in data['impacto_display']
        assert 'tipo_display' in data
        assert 'Amenaza' in data['tipo_display']

    def test_campos_read_only_auditoria(self):
        """
        Test: Campos de auditoría son read_only

        Given: RiesgoProyectoSerializer
        When: Se verifica read_only_fields
        Then: Debe incluir campos de auditoría
        """
        # Act
        serializer = RiesgoProyectoSerializer()

        # Assert
        assert 'created_at' in serializer.Meta.read_only_fields
        assert 'updated_at' in serializer.Meta.read_only_fields
        assert 'fecha_identificacion' in serializer.Meta.read_only_fields


# =============================================================================
# TESTS DE SEGUIMIENTO PROYECTO SERIALIZER
# =============================================================================

@pytest.mark.django_db
class TestSeguimientoProyectoSerializer:
    """Tests para SeguimientoProyectoSerializer."""

    def test_serializar_seguimiento_basico(self, proyecto, user_gerente):
        """
        Test: Serializar seguimiento con campos básicos

        Given: Un seguimiento creado
        When: Se serializa
        Then: Debe incluir todos los campos
        """
        # Arrange
        seguimiento = SeguimientoProyecto.objects.create(
            proyecto=proyecto,
            fecha=date.today(),
            porcentaje_avance=30,
            valor_planificado=Decimal('54000.00'),
            valor_ganado=Decimal('54000.00'),
            costo_actual=Decimal('60000.00'),
            registrado_por=user_gerente
        )

        # Act
        serializer = SeguimientoProyectoSerializer(seguimiento)
        data = serializer.data

        # Assert
        assert 'proyecto' in data
        assert data['porcentaje_avance'] == 30
        assert data['valor_planificado'] == '54000.00'
        assert data['valor_ganado'] == '54000.00'
        assert data['costo_actual'] == '60000.00'

    def test_campo_spi_read_only(self, proyecto, user_gerente):
        """
        Test: Campo SPI es read_only y se calcula

        Given: Un seguimiento con PV y EV
        When: Se serializa
        Then: Debe incluir SPI calculado (EV / PV)
        """
        # Arrange
        seguimiento = SeguimientoProyecto.objects.create(
            proyecto=proyecto,
            fecha=date.today(),
            porcentaje_avance=30,
            valor_planificado=Decimal('45000.00'),  # PV
            valor_ganado=Decimal('54000.00'),  # EV > PV
            costo_actual=Decimal('50000.00'),
            registrado_por=user_gerente
        )

        # Act
        serializer = SeguimientoProyectoSerializer(seguimiento)
        data = serializer.data

        # Assert
        assert 'spi' in data
        assert data['spi'] == 1.2  # 54000 / 45000

    def test_campo_cpi_read_only(self, proyecto, user_gerente):
        """
        Test: Campo CPI es read_only y se calcula

        Given: Un seguimiento con EV y AC
        When: Se serializa
        Then: Debe incluir CPI calculado (EV / AC)
        """
        # Arrange
        seguimiento = SeguimientoProyecto.objects.create(
            proyecto=proyecto,
            fecha=date.today(),
            porcentaje_avance=30,
            valor_planificado=Decimal('54000.00'),
            valor_ganado=Decimal('54000.00'),  # EV
            costo_actual=Decimal('45000.00'),  # AC < EV
            registrado_por=user_gerente
        )

        # Act
        serializer = SeguimientoProyectoSerializer(seguimiento)
        data = serializer.data

        # Assert
        assert 'cpi' in data
        assert data['cpi'] == 1.2  # 54000 / 45000

    def test_campo_registrado_por_nombre(self, proyecto, user_gerente):
        """
        Test: Campo registrado_por_nombre es read_only

        Given: Un seguimiento con registrador
        When: Se serializa
        Then: Debe incluir registrado_por_nombre
        """
        # Arrange
        seguimiento = SeguimientoProyecto.objects.create(
            proyecto=proyecto,
            fecha=date.today(),
            porcentaje_avance=25,
            valor_planificado=Decimal('45000.00'),
            valor_ganado=Decimal('45000.00'),
            costo_actual=Decimal('50000.00'),
            registrado_por=user_gerente
        )

        # Act
        serializer = SeguimientoProyectoSerializer(seguimiento)
        data = serializer.data

        # Assert
        assert 'registrado_por_nombre' in data
        assert data['registrado_por_nombre'] == 'Gerente Proyecto'


# =============================================================================
# TESTS DE ACTA CIERRE SERIALIZER
# =============================================================================

@pytest.mark.django_db
class TestActaCierreSerializer:
    """Tests para ActaCierreSerializer."""

    def test_serializar_acta_cierre_basica(self, proyecto, user_admin):
        """
        Test: Serializar acta de cierre con campos básicos

        Given: Un acta de cierre creada
        When: Se serializa
        Then: Debe incluir todos los campos
        """
        # Arrange
        acta = ActaCierre.objects.create(
            proyecto=proyecto,
            fecha_cierre=date.today(),
            objetivos_cumplidos='Todos cumplidos',
            entregables_completados='Sistema funcionando',
            presupuesto_final=Decimal('180000.00'),
            costo_final=Decimal('175000.00'),
            duracion_planificada_dias=180,
            duracion_real_dias=185,
            created_by=user_admin
        )

        # Act
        serializer = ActaCierreSerializer(acta)
        data = serializer.data

        # Assert
        assert 'proyecto' in data
        assert data['objetivos_cumplidos'] == 'Todos cumplidos'
        assert data['presupuesto_final'] == '180000.00'
        assert data['costo_final'] == '175000.00'
        assert data['duracion_planificada_dias'] == 180

    def test_campo_variacion_presupuesto_read_only(self, proyecto, user_admin):
        """
        Test: Campo variacion_presupuesto es read_only y se calcula

        Given: Un acta de cierre con presupuesto y costo
        When: Se serializa
        Then: Debe incluir variacion_presupuesto calculada
        """
        # Arrange
        acta = ActaCierre.objects.create(
            proyecto=proyecto,
            fecha_cierre=date.today(),
            objetivos_cumplidos='Cumplidos',
            entregables_completados='Completos',
            presupuesto_final=Decimal('180000.00'),
            costo_final=Decimal('165000.00'),
            duracion_planificada_dias=180,
            duracion_real_dias=180,
            created_by=user_admin
        )

        # Act
        serializer = ActaCierreSerializer(acta)
        data = serializer.data

        # Assert
        assert 'variacion_presupuesto' in data
        assert Decimal(data['variacion_presupuesto']) == Decimal('15000.00')

    def test_campos_proyecto_read_only(self, proyecto, user_admin):
        """
        Test: Campos del proyecto son read_only

        Given: Un acta de cierre
        When: Se serializa
        Then: Debe incluir proyecto_codigo y proyecto_nombre
        """
        # Arrange
        acta = ActaCierre.objects.create(
            proyecto=proyecto,
            fecha_cierre=date.today(),
            objetivos_cumplidos='Cumplidos',
            entregables_completados='Completos',
            presupuesto_final=Decimal('180000.00'),
            costo_final=Decimal('180000.00'),
            duracion_planificada_dias=180,
            duracion_real_dias=180,
            created_by=user_admin
        )

        # Act
        serializer = ActaCierreSerializer(acta)
        data = serializer.data

        # Assert
        assert 'proyecto_codigo' in data
        assert data['proyecto_codigo'] == 'PROY-001'
        assert 'proyecto_nombre' in data
        assert data['proyecto_nombre'] == 'Implementación ERP'

    def test_campos_read_only_meta(self):
        """
        Test: Campos read_only definidos en Meta

        Given: ActaCierreSerializer
        When: Se verifica read_only_fields
        Then: Debe incluir created_at y variacion_presupuesto
        """
        # Act
        serializer = ActaCierreSerializer()

        # Assert
        assert 'created_at' in serializer.Meta.read_only_fields
        assert 'variacion_presupuesto' in serializer.Meta.read_only_fields


# =============================================================================
# TESTS DE VALIDACIONES
# =============================================================================

@pytest.mark.django_db
class TestValidacionesSerializers:
    """Tests para validaciones de serializers."""

    def test_crear_proyecto_datos_validos(self, programa, user_admin, user_gerente):
        """
        Test: Crear proyecto con datos válidos

        Given: Datos válidos de proyecto
        When: Se deserializa y valida
        Then: Debe ser válido
        """
        # Arrange
        data = {
            'empresa_id': 1,
            'programa': programa.id,
            'codigo': 'PROY-VALID',
            'nombre': 'Proyecto Válido',
            'tipo': 'mejora',
            'estado': 'propuesto',
            'prioridad': 'media',
            'presupuesto_estimado': '50000.00',
            'gerente_proyecto': user_gerente.id,
            'is_active': True
        }

        # Act
        serializer = ProyectoCreateUpdateSerializer(data=data)

        # Assert
        assert serializer.is_valid(), serializer.errors

    def test_crear_seguimiento_datos_validos(self, proyecto, user_gerente):
        """
        Test: Crear seguimiento con datos válidos

        Given: Datos válidos de seguimiento
        When: Se deserializa y valida
        Then: Debe ser válido
        """
        # Arrange
        data = {
            'proyecto': proyecto.id,
            'fecha': date.today().isoformat(),
            'porcentaje_avance': 30,
            'costo_acumulado': '60000.00',
            'estado_general': 'verde',
            'valor_planificado': '54000.00',
            'valor_ganado': '54000.00',
            'costo_actual': '60000.00'
        }

        # Act
        serializer = SeguimientoProyectoSerializer(data=data)

        # Assert
        assert serializer.is_valid(), serializer.errors
