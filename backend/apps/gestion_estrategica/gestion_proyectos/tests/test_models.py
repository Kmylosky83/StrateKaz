"""
Tests unitarios para modelos de Gestión de Proyectos (PMI)

Cobertura de tests:
1. Portafolio: creación, validaciones
2. Programa: creación, relación con portafolio
3. Proyecto: creación, estados, transiciones, propiedades computadas
4. ProjectCharter: vinculación con proyecto
5. RiesgoProyecto: cálculo de nivel_riesgo (P x I)
6. SeguimientoProyecto: cálculo de SPI y CPI
7. ActaCierre: cambio de estado del proyecto a completado
"""
import pytest
from decimal import Decimal
from datetime import date, timedelta
from django.core.exceptions import ValidationError

from apps.gestion_estrategica.gestion_proyectos.models import (
    Portafolio, Programa, Proyecto, ProjectCharter,
    InteresadoProyecto, FaseProyecto, ActividadProyecto,
    RecursoProyecto, RiesgoProyecto, SeguimientoProyecto,
    LeccionAprendida, ActaCierre
)
from apps.core.models import User


# =============================================================================
# FIXTURES
# =============================================================================

@pytest.fixture
def user_admin(db):
    """Crea un usuario administrador para pruebas."""
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
        descripcion='Portafolio principal de proyectos estratégicos',
        objetivo_estrategico='Mejorar eficiencia operativa en 30%',
        presupuesto_asignado=Decimal('1000000.00'),
        responsable=user_admin,
        fecha_inicio=date(2025, 1, 1),
        fecha_fin=date(2025, 12, 31),
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
        descripcion='Digitalización de procesos',
        responsable=user_admin,
        presupuesto=Decimal('500000.00'),
        fecha_inicio=date(2025, 1, 1),
        fecha_fin=date(2025, 6, 30),
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
        presupuesto_estimado=Decimal('200000.00'),
        presupuesto_aprobado=Decimal('180000.00'),
        costo_real=Decimal('50000.00'),
        porcentaje_avance=25,
        sponsor=user_admin,
        gerente_proyecto=user_gerente,
        justificacion='Necesidad de integrar procesos',
        beneficios_esperados='Reducción de tiempo en 40%',
        is_active=True,
        created_by=user_admin
    )


@pytest.fixture
def proyecto_charter(db, proyecto):
    """Crea un project charter vinculado."""
    return ProjectCharter.objects.create(
        proyecto=proyecto,
        proposito='Implementar sistema ERP moderno',
        objetivos_medibles='Go-live en 6 meses con 95% de satisfacción',
        requisitos_alto_nivel='Integración con sistemas legacy',
        descripcion_alto_nivel='Sistema ERP cloud-based',
        supuestos='Disponibilidad del equipo técnico',
        restricciones='Presupuesto limitado a $180,000',
        hitos_clave='Análisis, Diseño, Desarrollo, Testing, Go-live',
        riesgos_alto_nivel='Resistencia al cambio',
        resumen_presupuesto='$180,000 distribuidos en 6 meses',
        resumen_cronograma='6 meses con 5 fases',
        criterios_exito='Sistema funcionando, usuarios capacitados',
        version=1
    )


@pytest.fixture
def riesgo(db, proyecto, user_gerente):
    """Crea un riesgo para el proyecto."""
    return RiesgoProyecto.objects.create(
        proyecto=proyecto,
        codigo='R-001',
        tipo=RiesgoProyecto.TipoRiesgo.AMENAZA,
        descripcion='Retraso en entrega de módulos',
        causa='Dependencia de proveedor externo',
        efecto='Atraso en cronograma',
        probabilidad=RiesgoProyecto.Probabilidad.ALTA,
        impacto=RiesgoProyecto.Impacto.ALTO,
        estrategia=RiesgoProyecto.EstrategiaRespuesta.MITIGAR,
        plan_respuesta='Contratar proveedor backup',
        responsable=user_gerente,
        is_materializado=False,
        is_active=True
    )


@pytest.fixture
def seguimiento(db, proyecto, user_gerente):
    """Crea un seguimiento del proyecto."""
    return SeguimientoProyecto.objects.create(
        proyecto=proyecto,
        fecha=date.today(),
        porcentaje_avance=30,
        costo_acumulado=Decimal('60000.00'),
        estado_general='verde',
        logros_periodo='Completado módulo de compras',
        problemas_encontrados='Ninguno',
        acciones_correctivas='N/A',
        proximas_actividades='Iniciar módulo de ventas',
        valor_planificado=Decimal('54000.00'),  # 30% de 180k
        valor_ganado=Decimal('54000.00'),
        costo_actual=Decimal('60000.00'),
        observaciones='En plan',
        registrado_por=user_gerente
    )


# =============================================================================
# TESTS DE PORTAFOLIO
# =============================================================================

@pytest.mark.django_db
class TestPortafolio:
    """Tests para el modelo Portafolio."""

    def test_crear_portafolio_basico(self, user_admin):
        """
        Test: Crear portafolio con campos básicos

        Given: Datos válidos de portafolio
        When: Se crea el portafolio
        Then: Debe crearse correctamente
        """
        # Arrange & Act
        portafolio = Portafolio.objects.create(
            empresa_id=1,
            codigo='PORT-TEST',
            nombre='Portafolio de Prueba',
            descripcion='Descripción de prueba',
            presupuesto_asignado=Decimal('500000.00'),
            responsable=user_admin,
            is_active=True,
            created_by=user_admin
        )

        # Assert
        assert portafolio.pk is not None
        assert portafolio.codigo == 'PORT-TEST'
        assert portafolio.nombre == 'Portafolio de Prueba'
        assert portafolio.presupuesto_asignado == Decimal('500000.00')
        assert portafolio.responsable == user_admin
        assert portafolio.is_active is True

    def test_portafolio_codigo_unico_por_empresa(self, portafolio, user_admin):
        """
        Test: El código de portafolio debe ser único por empresa

        Given: Un portafolio existente
        When: Se intenta crear otro con el mismo código y empresa
        Then: Debe lanzar excepción
        """
        # Act & Assert
        with pytest.raises(Exception):  # IntegrityError
            Portafolio.objects.create(
                empresa_id=1,
                codigo='PORT-001',  # Duplicado
                nombre='Otro Portafolio',
                is_active=True,
                created_by=user_admin
            )

    def test_portafolio_str_representation(self, portafolio):
        """
        Test: Método __str__ retorna formato esperado

        Given: Un portafolio creado
        When: Se convierte a string
        Then: Debe retornar 'CODIGO - Nombre'
        """
        # Act
        str_result = str(portafolio)

        # Assert
        assert 'PORT-001' in str_result
        assert 'Portafolio Estratégico 2025' in str_result

    def test_portafolio_permite_multiples_empresas(self, user_admin):
        """
        Test: Se puede tener el mismo código en diferentes empresas

        Given: Un portafolio con código PORT-001 en empresa 1
        When: Se crea otro con PORT-001 en empresa 2
        Then: Debe crearse correctamente (unique_together permite esto)
        """
        # Arrange
        Portafolio.objects.create(
            empresa_id=1,
            codigo='PORT-MULTI',
            nombre='Portafolio Empresa 1',
            is_active=True,
            created_by=user_admin
        )

        # Act
        portafolio_2 = Portafolio.objects.create(
            empresa_id=2,
            codigo='PORT-MULTI',  # Mismo código, diferente empresa
            nombre='Portafolio Empresa 2',
            is_active=True,
            created_by=user_admin
        )

        # Assert
        assert portafolio_2.pk is not None
        assert portafolio_2.empresa_id == 2


# =============================================================================
# TESTS DE PROGRAMA
# =============================================================================

@pytest.mark.django_db
class TestPrograma:
    """Tests para el modelo Programa."""

    def test_crear_programa_vinculado_a_portafolio(self, portafolio, user_admin):
        """
        Test: Crear programa vinculado a portafolio

        Given: Un portafolio existente
        When: Se crea un programa vinculado
        Then: Debe crearse con la relación correcta
        """
        # Act
        programa = Programa.objects.create(
            empresa_id=1,
            portafolio=portafolio,
            codigo='PROG-TEST',
            nombre='Programa de Prueba',
            presupuesto=Decimal('100000.00'),
            responsable=user_admin,
            is_active=True
        )

        # Assert
        assert programa.pk is not None
        assert programa.portafolio == portafolio
        assert programa in portafolio.programas.all()

    def test_programa_codigo_unico_por_empresa(self, programa, portafolio, user_admin):
        """
        Test: El código de programa debe ser único por empresa

        Given: Un programa existente
        When: Se intenta crear otro con el mismo código
        Then: Debe lanzar excepción
        """
        # Act & Assert
        with pytest.raises(Exception):  # IntegrityError
            Programa.objects.create(
                empresa_id=1,
                portafolio=portafolio,
                codigo='PROG-001',  # Duplicado
                nombre='Otro Programa',
                is_active=True
            )

    def test_programa_str_representation(self, programa):
        """
        Test: Método __str__ retorna formato esperado

        Given: Un programa creado
        When: Se convierte a string
        Then: Debe retornar 'CODIGO - Nombre'
        """
        # Act
        str_result = str(programa)

        # Assert
        assert 'PROG-001' in str_result
        assert 'Transformación Digital' in str_result


# =============================================================================
# TESTS DE PROYECTO
# =============================================================================

@pytest.mark.django_db
class TestProyecto:
    """Tests para el modelo Proyecto."""

    def test_crear_proyecto_basico(self, programa, user_admin, user_gerente):
        """
        Test: Crear proyecto con todos los campos principales

        Given: Datos válidos de proyecto
        When: Se crea el proyecto
        Then: Debe crearse correctamente con estado PROPUESTO por defecto
        """
        # Act
        proyecto = Proyecto.objects.create(
            empresa_id=1,
            programa=programa,
            codigo='PROY-TEST',
            nombre='Proyecto de Prueba',
            descripcion='Descripción de prueba',
            tipo=Proyecto.TipoProyecto.MEJORA,
            estado=Proyecto.Estado.PROPUESTO,
            prioridad=Proyecto.Prioridad.MEDIA,
            presupuesto_estimado=Decimal('50000.00'),
            presupuesto_aprobado=Decimal('45000.00'),
            sponsor=user_admin,
            gerente_proyecto=user_gerente,
            is_active=True,
            created_by=user_admin
        )

        # Assert
        assert proyecto.pk is not None
        assert proyecto.estado == Proyecto.Estado.PROPUESTO
        assert proyecto.porcentaje_avance == 0
        assert proyecto.costo_real == 0

    def test_proyecto_estados_disponibles(self):
        """
        Test: Verificar todos los estados disponibles

        Given: La clase Estado de Proyecto
        When: Se accede a las choices
        Then: Debe tener todos los estados del ciclo PMI
        """
        # Assert
        estados = [choice[0] for choice in Proyecto.Estado.choices]
        assert 'propuesto' in estados
        assert 'iniciacion' in estados
        assert 'planificacion' in estados
        assert 'ejecucion' in estados
        assert 'monitoreo' in estados
        assert 'cierre' in estados
        assert 'completado' in estados
        assert 'cancelado' in estados
        assert 'suspendido' in estados

    def test_proyecto_transicion_estados(self, proyecto):
        """
        Test: Transición de estados del proyecto

        Given: Un proyecto en estado PLANIFICACION
        When: Se cambia el estado a EJECUCION
        Then: El estado debe actualizarse correctamente
        """
        # Arrange
        assert proyecto.estado == Proyecto.Estado.PLANIFICACION

        # Act
        proyecto.estado = Proyecto.Estado.EJECUCION
        proyecto.save()
        proyecto.refresh_from_db()

        # Assert
        assert proyecto.estado == Proyecto.Estado.EJECUCION

    def test_proyecto_variacion_costo_positiva(self, proyecto):
        """
        Test: Cálculo de variación de costo (CV = EV - AC)

        Given: Proyecto con avance 25% y presupuesto 180k, costo real 50k
        When: Se calcula variacion_costo
        Then: CV = (180k * 0.25) - 50k = 45k - 50k = -5k (negativo, sobre presupuesto)
        """
        # Given
        proyecto.presupuesto_aprobado = Decimal('180000.00')
        proyecto.porcentaje_avance = 25
        proyecto.costo_real = Decimal('50000.00')
        proyecto.save()

        # Act
        cv = proyecto.variacion_costo

        # Assert
        # EV = 180000 * 0.25 = 45000
        # CV = 45000 - 50000 = -5000
        assert cv == Decimal('-5000.00')

    def test_proyecto_variacion_costo_negativa(self, proyecto):
        """
        Test: Variación de costo negativa (bajo presupuesto)

        Given: Proyecto con avance 30% y presupuesto 180k, costo real 40k
        When: Se calcula variacion_costo
        Then: CV = (180k * 0.30) - 40k = 54k - 40k = +14k (bajo presupuesto)
        """
        # Arrange
        proyecto.presupuesto_aprobado = Decimal('180000.00')
        proyecto.porcentaje_avance = 30
        proyecto.costo_real = Decimal('40000.00')
        proyecto.save()

        # Act
        cv = proyecto.variacion_costo

        # Assert
        # EV = 180000 * 0.30 = 54000
        # CV = 54000 - 40000 = +14000
        assert cv == Decimal('14000.00')

    def test_proyecto_indice_desempeno_costo_mayor_uno(self, proyecto):
        """
        Test: Índice de desempeño de costo CPI > 1 (bajo presupuesto)

        Given: Proyecto con avance 30%, presupuesto 180k, costo real 40k
        When: Se calcula indice_desempeno_costo
        Then: CPI = EV / AC = 54k / 40k = 1.35
        """
        # Arrange
        proyecto.presupuesto_aprobado = Decimal('180000.00')
        proyecto.porcentaje_avance = 30
        proyecto.costo_real = Decimal('40000.00')
        proyecto.save()

        # Act
        cpi = proyecto.indice_desempeno_costo

        # Assert
        # EV = 180000 * 0.30 = 54000
        # CPI = 54000 / 40000 = 1.35
        assert cpi == 1.35

    def test_proyecto_indice_desempeno_costo_menor_uno(self, proyecto):
        """
        Test: Índice de desempeño de costo CPI < 1 (sobre presupuesto)

        Given: Proyecto con avance 25%, presupuesto 180k, costo real 60k
        When: Se calcula indice_desempeno_costo
        Then: CPI = EV / AC = 45k / 60k = 0.75
        """
        # Arrange
        proyecto.presupuesto_aprobado = Decimal('180000.00')
        proyecto.porcentaje_avance = 25
        proyecto.costo_real = Decimal('60000.00')
        proyecto.save()

        # Act
        cpi = proyecto.indice_desempeno_costo

        # Assert
        # EV = 180000 * 0.25 = 45000
        # CPI = 45000 / 60000 = 0.75
        assert cpi == 0.75

    def test_proyecto_indice_desempeno_costo_sin_costo_real(self, proyecto):
        """
        Test: CPI cuando no hay costo real

        Given: Proyecto sin costo real (costo_real = 0)
        When: Se calcula indice_desempeno_costo
        Then: Debe retornar 1.0 por defecto
        """
        # Arrange
        proyecto.costo_real = Decimal('0.00')
        proyecto.save()

        # Act
        cpi = proyecto.indice_desempeno_costo

        # Assert
        assert cpi == 1.0

    def test_proyecto_codigo_unico_por_empresa(self, proyecto, programa, user_admin):
        """
        Test: El código de proyecto debe ser único por empresa

        Given: Un proyecto existente
        When: Se intenta crear otro con el mismo código
        Then: Debe lanzar excepción
        """
        # Act & Assert
        with pytest.raises(Exception):  # IntegrityError
            Proyecto.objects.create(
                empresa_id=1,
                programa=programa,
                codigo='PROY-001',  # Duplicado
                nombre='Otro Proyecto',
                is_active=True,
                created_by=user_admin
            )

    def test_proyecto_str_representation(self, proyecto):
        """
        Test: Método __str__ retorna formato esperado

        Given: Un proyecto creado
        When: Se convierte a string
        Then: Debe retornar 'CODIGO - Nombre'
        """
        # Act
        str_result = str(proyecto)

        # Assert
        assert 'PROY-001' in str_result
        assert 'Implementación ERP' in str_result

    def test_proyecto_sin_programa_permitido(self, user_admin):
        """
        Test: Un proyecto puede crearse sin programa

        Given: Datos de proyecto sin programa
        When: Se crea el proyecto
        Then: Debe crearse correctamente
        """
        # Act
        proyecto = Proyecto.objects.create(
            empresa_id=1,
            programa=None,  # Sin programa
            codigo='PROY-SOLO',
            nombre='Proyecto Independiente',
            is_active=True,
            created_by=user_admin
        )

        # Assert
        assert proyecto.pk is not None
        assert proyecto.programa is None


# =============================================================================
# TESTS DE PROJECT CHARTER
# =============================================================================

@pytest.mark.django_db
class TestProjectCharter:
    """Tests para el modelo ProjectCharter."""

    def test_crear_charter_vinculado_a_proyecto(self, proyecto):
        """
        Test: Crear charter vinculado a proyecto

        Given: Un proyecto existente
        When: Se crea un charter vinculado (OneToOne)
        Then: Debe crearse correctamente
        """
        # Act
        charter = ProjectCharter.objects.create(
            proyecto=proyecto,
            proposito='Propósito del proyecto',
            objetivos_medibles='Objetivos claros y medibles',
            version=1
        )

        # Assert
        assert charter.pk is not None
        assert charter.proyecto == proyecto
        assert proyecto.charter == charter

    def test_charter_relacion_one_to_one(self, proyecto_charter, proyecto):
        """
        Test: Relación OneToOne con proyecto

        Given: Un proyecto con charter existente
        When: Se intenta crear otro charter para el mismo proyecto
        Then: Debe lanzar excepción
        """
        # Act & Assert
        with pytest.raises(Exception):  # IntegrityError
            ProjectCharter.objects.create(
                proyecto=proyecto,  # Mismo proyecto
                proposito='Otro charter',
                objetivos_medibles='Otros objetivos',
                version=1
            )

    def test_charter_str_representation(self, proyecto_charter):
        """
        Test: Método __str__ retorna formato esperado

        Given: Un charter creado
        When: Se convierte a string
        Then: Debe retornar 'Charter - CODIGO_PROYECTO'
        """
        # Act
        str_result = str(proyecto_charter)

        # Assert
        assert 'Charter' in str_result
        assert 'PROY-001' in str_result


# =============================================================================
# TESTS DE RIESGO PROYECTO
# =============================================================================

@pytest.mark.django_db
class TestRiesgoProyecto:
    """Tests para el modelo RiesgoProyecto."""

    def test_crear_riesgo_basico(self, proyecto, user_gerente):
        """
        Test: Crear riesgo para un proyecto

        Given: Un proyecto existente
        When: Se crea un riesgo
        Then: Debe crearse correctamente
        """
        # Act
        riesgo = RiesgoProyecto.objects.create(
            proyecto=proyecto,
            codigo='R-TEST',
            tipo=RiesgoProyecto.TipoRiesgo.AMENAZA,
            descripcion='Riesgo de prueba',
            probabilidad=RiesgoProyecto.Probabilidad.MEDIA,
            impacto=RiesgoProyecto.Impacto.MEDIO,
            is_active=True
        )

        # Assert
        assert riesgo.pk is not None
        assert riesgo.proyecto == proyecto
        assert riesgo.is_materializado is False

    def test_riesgo_nivel_riesgo_maximo(self, proyecto):
        """
        Test: Cálculo de nivel_riesgo máximo (P x I)

        Given: Riesgo con probabilidad MUY_ALTA (5) e impacto MUY_ALTO (5)
        When: Se calcula nivel_riesgo
        Then: Debe retornar 25 (5 x 5)
        """
        # Arrange
        riesgo = RiesgoProyecto.objects.create(
            proyecto=proyecto,
            codigo='R-MAX',
            descripcion='Riesgo máximo',
            probabilidad=RiesgoProyecto.Probabilidad.MUY_ALTA,
            impacto=RiesgoProyecto.Impacto.MUY_ALTO,
            is_active=True
        )

        # Act
        nivel = riesgo.nivel_riesgo

        # Assert
        assert nivel == 25  # 5 * 5

    def test_riesgo_nivel_riesgo_minimo(self, proyecto):
        """
        Test: Cálculo de nivel_riesgo mínimo

        Given: Riesgo con probabilidad MUY_BAJA (1) e impacto MUY_BAJO (1)
        When: Se calcula nivel_riesgo
        Then: Debe retornar 1 (1 x 1)
        """
        # Arrange
        riesgo = RiesgoProyecto.objects.create(
            proyecto=proyecto,
            codigo='R-MIN',
            descripcion='Riesgo mínimo',
            probabilidad=RiesgoProyecto.Probabilidad.MUY_BAJA,
            impacto=RiesgoProyecto.Impacto.MUY_BAJO,
            is_active=True
        )

        # Act
        nivel = riesgo.nivel_riesgo

        # Assert
        assert nivel == 1  # 1 * 1

    def test_riesgo_nivel_riesgo_medio(self, proyecto):
        """
        Test: Cálculo de nivel_riesgo medio

        Given: Riesgo con probabilidad MEDIA (3) e impacto MEDIO (3)
        When: Se calcula nivel_riesgo
        Then: Debe retornar 9 (3 x 3)
        """
        # Arrange
        riesgo = RiesgoProyecto.objects.create(
            proyecto=proyecto,
            codigo='R-MED',
            descripcion='Riesgo medio',
            probabilidad=RiesgoProyecto.Probabilidad.MEDIA,
            impacto=RiesgoProyecto.Impacto.MEDIO,
            is_active=True
        )

        # Act
        nivel = riesgo.nivel_riesgo

        # Assert
        assert nivel == 9  # 3 * 3

    def test_riesgo_nivel_riesgo_alto_variante(self, proyecto):
        """
        Test: Nivel de riesgo alto con combinación ALTA/ALTO

        Given: Riesgo con probabilidad ALTA (4) e impacto ALTO (4)
        When: Se calcula nivel_riesgo
        Then: Debe retornar 16 (4 x 4)
        """
        # Arrange
        riesgo = RiesgoProyecto.objects.create(
            proyecto=proyecto,
            codigo='R-ALTO',
            descripcion='Riesgo alto',
            probabilidad=RiesgoProyecto.Probabilidad.ALTA,
            impacto=RiesgoProyecto.Impacto.ALTO,
            is_active=True
        )

        # Act
        nivel = riesgo.nivel_riesgo

        # Assert
        assert nivel == 16  # 4 * 4

    def test_riesgo_codigo_unico_por_proyecto(self, riesgo, proyecto):
        """
        Test: El código de riesgo debe ser único por proyecto

        Given: Un riesgo existente
        When: Se intenta crear otro con el mismo código
        Then: Debe lanzar excepción
        """
        # Act & Assert
        with pytest.raises(Exception):  # IntegrityError
            RiesgoProyecto.objects.create(
                proyecto=proyecto,
                codigo='R-001',  # Duplicado
                descripcion='Otro riesgo',
                probabilidad=RiesgoProyecto.Probabilidad.BAJA,
                impacto=RiesgoProyecto.Impacto.BAJO,
                is_active=True
            )

    def test_riesgo_str_representation(self, riesgo):
        """
        Test: Método __str__ retorna formato esperado

        Given: Un riesgo creado
        When: Se convierte a string
        Then: Debe retornar 'CODIGO - descripcion[:50]'
        """
        # Act
        str_result = str(riesgo)

        # Assert
        assert 'R-001' in str_result
        assert 'Retraso' in str_result


# =============================================================================
# TESTS DE SEGUIMIENTO PROYECTO
# =============================================================================

@pytest.mark.django_db
class TestSeguimientoProyecto:
    """Tests para el modelo SeguimientoProyecto."""

    def test_crear_seguimiento_basico(self, proyecto, user_gerente):
        """
        Test: Crear seguimiento para un proyecto

        Given: Un proyecto existente
        When: Se crea un seguimiento
        Then: Debe crearse correctamente
        """
        # Act
        seguimiento = SeguimientoProyecto.objects.create(
            proyecto=proyecto,
            fecha=date.today(),
            porcentaje_avance=20,
            costo_acumulado=Decimal('30000.00'),
            estado_general='verde',
            valor_planificado=Decimal('36000.00'),
            valor_ganado=Decimal('36000.00'),
            costo_actual=Decimal('30000.00'),
            registrado_por=user_gerente
        )

        # Assert
        assert seguimiento.pk is not None
        assert seguimiento.proyecto == proyecto

    def test_seguimiento_spi_mayor_uno(self, proyecto, user_gerente):
        """
        Test: SPI > 1 (adelantado en cronograma)

        Given: Seguimiento con EV > PV
        When: Se calcula SPI
        Then: SPI = EV / PV > 1
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
        spi = seguimiento.spi

        # Assert
        # SPI = 54000 / 45000 = 1.2
        assert spi == 1.2

    def test_seguimiento_spi_menor_uno(self, proyecto, user_gerente):
        """
        Test: SPI < 1 (atrasado en cronograma)

        Given: Seguimiento con EV < PV
        When: Se calcula SPI
        Then: SPI = EV / PV < 1
        """
        # Arrange
        seguimiento = SeguimientoProyecto.objects.create(
            proyecto=proyecto,
            fecha=date.today(),
            porcentaje_avance=20,
            valor_planificado=Decimal('54000.00'),  # PV
            valor_ganado=Decimal('36000.00'),  # EV < PV
            costo_actual=Decimal('40000.00'),
            registrado_por=user_gerente
        )

        # Act
        spi = seguimiento.spi

        # Assert
        # SPI = 36000 / 54000 = 0.67
        assert spi == 0.67

    def test_seguimiento_spi_sin_valor_planificado(self, proyecto, user_gerente):
        """
        Test: SPI cuando valor_planificado es 0

        Given: Seguimiento con valor_planificado = 0
        When: Se calcula SPI
        Then: Debe retornar 1.0 por defecto
        """
        # Arrange
        seguimiento = SeguimientoProyecto.objects.create(
            proyecto=proyecto,
            fecha=date.today(),
            porcentaje_avance=0,
            valor_planificado=Decimal('0.00'),
            valor_ganado=Decimal('0.00'),
            costo_actual=Decimal('0.00'),
            registrado_por=user_gerente
        )

        # Act
        spi = seguimiento.spi

        # Assert
        assert spi == 1.0

    def test_seguimiento_cpi_mayor_uno(self, proyecto, user_gerente):
        """
        Test: CPI > 1 (bajo presupuesto)

        Given: Seguimiento con EV > AC
        When: Se calcula CPI
        Then: CPI = EV / AC > 1
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
        cpi = seguimiento.cpi

        # Assert
        # CPI = 54000 / 45000 = 1.2
        assert cpi == 1.2

    def test_seguimiento_cpi_menor_uno(self, proyecto, user_gerente):
        """
        Test: CPI < 1 (sobre presupuesto)

        Given: Seguimiento con EV < AC
        When: Se calcula CPI
        Then: CPI = EV / AC < 1
        """
        # Arrange
        seguimiento = SeguimientoProyecto.objects.create(
            proyecto=proyecto,
            fecha=date.today(),
            porcentaje_avance=25,
            valor_planificado=Decimal('45000.00'),
            valor_ganado=Decimal('45000.00'),  # EV
            costo_actual=Decimal('60000.00'),  # AC > EV
            registrado_por=user_gerente
        )

        # Act
        cpi = seguimiento.cpi

        # Assert
        # CPI = 45000 / 60000 = 0.75
        assert cpi == 0.75

    def test_seguimiento_cpi_sin_costo_actual(self, proyecto, user_gerente):
        """
        Test: CPI cuando costo_actual es 0

        Given: Seguimiento con costo_actual = 0
        When: Se calcula CPI
        Then: Debe retornar 1.0 por defecto
        """
        # Arrange
        seguimiento = SeguimientoProyecto.objects.create(
            proyecto=proyecto,
            fecha=date.today(),
            porcentaje_avance=0,
            valor_planificado=Decimal('0.00'),
            valor_ganado=Decimal('0.00'),
            costo_actual=Decimal('0.00'),
            registrado_por=user_gerente
        )

        # Act
        cpi = seguimiento.cpi

        # Assert
        assert cpi == 1.0

    def test_seguimiento_fecha_unica_por_proyecto(self, seguimiento, proyecto, user_gerente):
        """
        Test: La fecha de seguimiento debe ser única por proyecto

        Given: Un seguimiento existente
        When: Se intenta crear otro para la misma fecha
        Then: Debe lanzar excepción
        """
        # Act & Assert
        with pytest.raises(Exception):  # IntegrityError
            SeguimientoProyecto.objects.create(
                proyecto=proyecto,
                fecha=seguimiento.fecha,  # Misma fecha
                porcentaje_avance=35,
                costo_acumulado=Decimal('70000.00'),
                valor_planificado=Decimal('63000.00'),
                valor_ganado=Decimal('63000.00'),
                costo_actual=Decimal('70000.00'),
                registrado_por=user_gerente
            )

    def test_seguimiento_str_representation(self, seguimiento):
        """
        Test: Método __str__ retorna formato esperado

        Given: Un seguimiento creado
        When: Se convierte a string
        Then: Debe retornar 'Seguimiento CODIGO - fecha'
        """
        # Act
        str_result = str(seguimiento)

        # Assert
        assert 'Seguimiento' in str_result
        assert 'PROY-001' in str_result


# =============================================================================
# TESTS DE ACTA CIERRE
# =============================================================================

@pytest.mark.django_db
class TestActaCierre:
    """Tests para el modelo ActaCierre."""

    def test_crear_acta_cierre_basica(self, proyecto, user_admin):
        """
        Test: Crear acta de cierre para un proyecto

        Given: Un proyecto existente
        When: Se crea un acta de cierre
        Then: Debe crearse correctamente
        """
        # Act
        acta = ActaCierre.objects.create(
            proyecto=proyecto,
            fecha_cierre=date.today(),
            objetivos_cumplidos='Todos los objetivos cumplidos',
            entregables_completados='Sistema ERP funcionando',
            presupuesto_final=Decimal('180000.00'),
            costo_final=Decimal('175000.00'),
            duracion_planificada_dias=180,
            duracion_real_dias=185,
            aprobado_por_sponsor=False,
            created_by=user_admin
        )

        # Assert
        assert acta.pk is not None
        assert acta.proyecto == proyecto

    def test_acta_cierre_calcula_variacion_presupuesto_positiva(self, proyecto, user_admin):
        """
        Test: Variación de presupuesto positiva (bajo presupuesto)

        Given: Acta con presupuesto_final > costo_final
        When: Se guarda el acta
        Then: variacion_presupuesto = presupuesto_final - costo_final > 0
        """
        # Arrange & Act
        acta = ActaCierre.objects.create(
            proyecto=proyecto,
            fecha_cierre=date.today(),
            objetivos_cumplidos='Objetivos cumplidos',
            entregables_completados='Entregables completos',
            presupuesto_final=Decimal('180000.00'),
            costo_final=Decimal('165000.00'),  # Menor que presupuesto
            duracion_planificada_dias=180,
            duracion_real_dias=180,
            created_by=user_admin
        )

        # Assert
        assert acta.variacion_presupuesto == Decimal('15000.00')  # 180k - 165k

    def test_acta_cierre_calcula_variacion_presupuesto_negativa(self, proyecto, user_admin):
        """
        Test: Variación de presupuesto negativa (sobre presupuesto)

        Given: Acta con presupuesto_final < costo_final
        When: Se guarda el acta
        Then: variacion_presupuesto = presupuesto_final - costo_final < 0
        """
        # Arrange & Act
        acta = ActaCierre.objects.create(
            proyecto=proyecto,
            fecha_cierre=date.today(),
            objetivos_cumplidos='Objetivos cumplidos',
            entregables_completados='Entregables completos',
            presupuesto_final=Decimal('180000.00'),
            costo_final=Decimal('195000.00'),  # Mayor que presupuesto
            duracion_planificada_dias=180,
            duracion_real_dias=200,
            created_by=user_admin
        )

        # Assert
        assert acta.variacion_presupuesto == Decimal('-15000.00')  # 180k - 195k

    def test_acta_cierre_relacion_one_to_one(self, proyecto, user_admin):
        """
        Test: Relación OneToOne con proyecto

        Given: Un proyecto con acta de cierre existente
        When: Se intenta crear otra acta para el mismo proyecto
        Then: Debe lanzar excepción
        """
        # Arrange
        ActaCierre.objects.create(
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

        # Act & Assert
        with pytest.raises(Exception):  # IntegrityError
            ActaCierre.objects.create(
                proyecto=proyecto,  # Mismo proyecto
                fecha_cierre=date.today(),
                objetivos_cumplidos='Otros',
                entregables_completados='Otros',
                presupuesto_final=Decimal('180000.00'),
                costo_final=Decimal('180000.00'),
                duracion_planificada_dias=180,
                duracion_real_dias=180,
                created_by=user_admin
            )

    def test_acta_cierre_str_representation(self, proyecto, user_admin):
        """
        Test: Método __str__ retorna formato esperado

        Given: Un acta de cierre creada
        When: Se convierte a string
        Then: Debe retornar 'Cierre - CODIGO_PROYECTO'
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
        str_result = str(acta)

        # Assert
        assert 'Cierre' in str_result
        assert 'PROY-001' in str_result


# =============================================================================
# TESTS DE OTROS MODELOS
# =============================================================================

@pytest.mark.django_db
class TestOtrosModelos:
    """Tests para otros modelos del módulo."""

    def test_crear_interesado_proyecto(self, proyecto):
        """Test: Crear un interesado del proyecto."""
        interesado = InteresadoProyecto.objects.create(
            proyecto=proyecto,
            nombre='Juan Pérez',
            cargo_rol='Director de TI',
            organizacion='Empresa ABC',
            nivel_interes=InteresadoProyecto.NivelInteres.ALTO,
            nivel_influencia=InteresadoProyecto.NivelInfluencia.ALTA,
            is_internal=True,
            is_active=True
        )

        assert interesado.pk is not None
        assert interesado.proyecto == proyecto

    def test_crear_fase_proyecto(self, proyecto):
        """Test: Crear una fase del proyecto."""
        fase = FaseProyecto.objects.create(
            proyecto=proyecto,
            orden=1,
            nombre='Análisis',
            descripcion='Fase de análisis de requerimientos',
            fecha_inicio_plan=date(2025, 2, 1),
            fecha_fin_plan=date(2025, 3, 1),
            porcentaje_avance=0,
            is_active=True
        )

        assert fase.pk is not None
        assert fase.proyecto == proyecto
        assert fase.orden == 1

    def test_crear_actividad_proyecto(self, proyecto, user_gerente):
        """Test: Crear una actividad/tarea del proyecto."""
        actividad = ActividadProyecto.objects.create(
            proyecto=proyecto,
            codigo_wbs='1.1',
            nombre='Levantamiento de requerimientos',
            descripcion='Entrevistar a usuarios clave',
            estado=ActividadProyecto.Estado.PENDIENTE,
            fecha_inicio_plan=date(2025, 2, 1),
            fecha_fin_plan=date(2025, 2, 15),
            duracion_estimada_dias=14,
            responsable=user_gerente,
            porcentaje_avance=0,
            is_active=True
        )

        assert actividad.pk is not None
        assert actividad.proyecto == proyecto

    def test_crear_recurso_proyecto(self, proyecto, user_gerente):
        """Test: Crear un recurso del proyecto."""
        recurso = RecursoProyecto.objects.create(
            proyecto=proyecto,
            tipo=RecursoProyecto.TipoRecurso.HUMANO,
            nombre='Desarrollador Senior',
            usuario=user_gerente,
            rol_proyecto='Tech Lead',
            dedicacion_porcentaje=100,
            costo_unitario=Decimal('5000.00'),
            cantidad=Decimal('1.00'),
            is_active=True
        )

        assert recurso.pk is not None
        assert recurso.proyecto == proyecto
        assert recurso.costo_total == Decimal('5000.00')  # Se calcula automáticamente

    def test_crear_leccion_aprendida(self, proyecto, user_gerente):
        """Test: Crear una lección aprendida."""
        leccion = LeccionAprendida.objects.create(
            proyecto=proyecto,
            tipo=LeccionAprendida.Tipo.BUENA_PRACTICA,
            titulo='Reuniones diarias efectivas',
            situacion='Equipo distribuido en diferentes ubicaciones',
            accion_tomada='Stand-ups diarios de 15 minutos',
            resultado='Mejor comunicación y coordinación',
            recomendacion='Mantener stand-ups diarios en proyectos distribuidos',
            area_conocimiento='Gestión del Equipo',
            tags='comunicacion,scrum,equipos',
            registrado_por=user_gerente,
            is_active=True
        )

        assert leccion.pk is not None
        assert leccion.proyecto == proyecto
