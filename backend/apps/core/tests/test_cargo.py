"""
Tests Unitarios para el modelo Cargo - Manual de Funciones Completo
Sistema de Gestión StrateKaz

Cobertura de tests para los 5 tabs del manual de funciones:
1. TAB IDENTIFICACIÓN - Datos básicos y ubicación organizacional
2. TAB FUNCIONES - Manual de funciones y responsabilidades
3. TAB REQUISITOS - Educación, experiencia y competencias
4. TAB SST - Seguridad y Salud en el Trabajo
5. TAB PERMISOS - Roles y permisos del sistema
6. INTEGRACIÓN - Tests de flujos completos

Sigue patrón AAA (Arrange-Act-Assert) y Given-When-Then.
"""
import pytest
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.core.models import Cargo, RiesgoOcupacional, Role, User
from apps.gestion_estrategica.organizacion.models import Area


# =============================================================================
# FIXTURES - Datos de prueba reutilizables
# =============================================================================

@pytest.fixture
def area_gerencia(db):
    """Fixture: Área de Gerencia (nivel estratégico)."""
    return Area.objects.create(
        code='GER',
        name='Gerencia General',
        description='Dirección estratégica de la organización',
        cost_center='CC-001',
        is_active=True,
        orden=1
    )


@pytest.fixture
def area_operaciones(db, area_gerencia):
    """Fixture: Área de Operaciones (nivel táctico)."""
    return Area.objects.create(
        code='OPE',
        name='Operaciones',
        description='Gestión de operaciones de recolección',
        parent=area_gerencia,
        cost_center='CC-002',
        is_active=True,
        orden=2
    )


@pytest.fixture
def area_produccion(db, area_operaciones):
    """Fixture: Área de Producción (nivel operativo)."""
    return Area.objects.create(
        code='PROD',
        name='Producción',
        description='Procesamiento de materia prima',
        parent=area_operaciones,
        cost_center='CC-003',
        is_active=True,
        orden=1
    )


@pytest.fixture
def rol_gerente(db):
    """Fixture: Rol de Gerente con permisos completos."""
    return Role.objects.create(
        name='Gerente',
        code='GERENTE',
        description='Acceso completo al sistema',
        level=Role.LEVEL_ADMIN,
        is_active=True
    )


@pytest.fixture
def rol_supervisor(db):
    """Fixture: Rol de Supervisor con permisos limitados."""
    return Role.objects.create(
        name='Supervisor',
        code='SUPERVISOR',
        description='Supervisión de operaciones',
        level=Role.LEVEL_MANAGER,
        is_active=True
    )


@pytest.fixture
def rol_operador(db):
    """Fixture: Rol de Operador básico."""
    return Role.objects.create(
        name='Operador',
        code='OPERADOR',
        description='Operaciones básicas',
        level=Role.LEVEL_USER,
        is_active=True
    )


@pytest.fixture
def riesgo_biologico(db):
    """Fixture: Riesgo ocupacional biológico."""
    return RiesgoOcupacional.objects.create(
        code='BIO-001',
        name='Exposición a material biológico',
        clasificacion='BIOLOGICO',
        descripcion='Contacto con material orgánico en descomposición',
        fuente='Residuos orgánicos animales',
        efectos_posibles='Infecciones, enfermedades zoonóticas',
        nivel_riesgo='II',
        controles_existentes='EPP, vacunación, protocolos de bioseguridad',
        is_active=True
    )


@pytest.fixture
def riesgo_fisico(db):
    """Fixture: Riesgo ocupacional físico (ruido)."""
    return RiesgoOcupacional.objects.create(
        code='FIS-002',
        name='Exposición a ruido',
        clasificacion='FISICO',
        descripcion='Niveles altos de ruido en planta de producción',
        fuente='Maquinaria industrial',
        efectos_posibles='Hipoacusia, fatiga auditiva',
        nivel_riesgo='III',
        controles_existentes='Protección auditiva, pausas activas',
        is_active=True
    )


@pytest.fixture
def riesgo_biomecanico(db):
    """Fixture: Riesgo biomecánico."""
    return RiesgoOcupacional.objects.create(
        code='BIO-003',
        name='Manipulación manual de cargas',
        clasificacion='BIOMECANICO',
        descripcion='Levantamiento de objetos pesados',
        fuente='Traslado de sacos y contenedores',
        efectos_posibles='Lesiones lumbares, desgarros musculares',
        nivel_riesgo='II',
        controles_existentes='Capacitación en manejo de cargas, ayudas mecánicas',
        is_active=True
    )


@pytest.fixture
def cargo_gerente(db, area_gerencia, rol_gerente):
    """Fixture: Cargo de Gerente General (nivel estratégico)."""
    return Cargo.objects.create(
        code='GERENTE',
        name='Gerente General',
        description='Máximo responsable de la organización',
        area=area_gerencia,
        parent_cargo=None,  # No reporta a nadie
        nivel_jerarquico='ESTRATEGICO',
        cantidad_posiciones=1,
        is_jefatura=True,
        objetivo_cargo='Dirigir estratégicamente la organización hacia el cumplimiento de objetivos corporativos',
        nivel_educativo='PROFESIONAL',
        experiencia_requerida='10_ANOS',
        rol_sistema=rol_gerente,
        is_active=True
    )


@pytest.fixture
def cargo_supervisor(db, area_operaciones, cargo_gerente, rol_supervisor):
    """Fixture: Cargo de Supervisor de Operaciones (nivel táctico)."""
    return Cargo.objects.create(
        code='SUPERVISOR',
        name='Supervisor de Operaciones',
        description='Supervisión de rutas y personal operativo',
        area=area_operaciones,
        parent_cargo=cargo_gerente,
        nivel_jerarquico='TACTICO',
        cantidad_posiciones=3,
        is_jefatura=True,
        objetivo_cargo='Garantizar el cumplimiento de metas operativas y supervisar personal de rutas',
        nivel_educativo='TECNOLOGO',
        experiencia_requerida='3_ANOS',
        rol_sistema=rol_supervisor,
        is_active=True
    )


@pytest.fixture
def usuario_test(db):
    """Fixture: Usuario de prueba para asignación a cargos."""
    return User.objects.create_user(
        username='jperez',
        email='jperez@grasasdelnorte.com',
        password='test123',
        document_type='CC',
        document_number='1234567890',
        first_name='Juan',
        last_name='Pérez',
        phone='3001234567',
        is_active=True
    )


# =============================================================================
# TAB 1: TESTS DE IDENTIFICACIÓN
# =============================================================================

@pytest.mark.django_db
class TestCargoIdentificacion:
    """Tests para Tab 1: Identificación - Datos básicos del cargo."""

    def test_cargo_codigo_unico(self, area_gerencia):
        """
        Given: Dos cargos con el mismo código
        When: Se intenta crear el segundo
        Then: Debe lanzar excepción de integridad (código único)
        """
        # Arrange
        Cargo.objects.create(
            code='RECOLECTOR',
            name='Recolector de Grasa',
            area=area_gerencia,
            nivel_jerarquico='OPERATIVO',
            is_active=True
        )

        # Act & Assert
        with pytest.raises(Exception):  # IntegrityError por código duplicado
            Cargo.objects.create(
                code='RECOLECTOR',  # Código duplicado
                name='Otro Recolector',
                area=area_gerencia,
                nivel_jerarquico='OPERATIVO',
                is_active=True
            )

    def test_cargo_nombre_requerido(self, area_gerencia):
        """
        Given: Datos de cargo sin nombre
        When: Se intenta crear el cargo
        Then: Debe lanzar excepción (nombre es requerido)
        """
        # Act & Assert
        with pytest.raises(Exception):  # ValidationError o IntegrityError
            Cargo.objects.create(
                code='TEST001',
                name='',  # Nombre vacío
                area=area_gerencia,
                nivel_jerarquico='OPERATIVO'
            )

    def test_cargo_area_asociada(self, area_gerencia, area_operaciones):
        """
        Given: Un cargo asociado a un área
        When: Se consulta el área del cargo
        Then: Debe retornar el área correcta y su nombre
        """
        # Arrange
        cargo = Cargo.objects.create(
            code='ANALISTA',
            name='Analista de Calidad',
            area=area_operaciones,
            nivel_jerarquico='TACTICO',
            is_active=True
        )

        # Act
        area_asociada = cargo.area
        nombre_area = cargo.area_nombre

        # Assert
        assert area_asociada is not None
        assert area_asociada.code == 'OPE'
        assert area_asociada.name == 'Operaciones'
        assert nombre_area == 'Operaciones'

    def test_cargo_nivel_jerarquico(self, area_gerencia):
        """
        Given: Diferentes cargos con niveles jerárquicos distintos
        When: Se crean y consultan los cargos
        Then: Deben tener los niveles correctos y validarse el orden
        """
        # Arrange & Act
        cargo_estrategico = Cargo.objects.create(
            code='CEO',
            name='Director Ejecutivo',
            nivel_jerarquico='ESTRATEGICO',
            area=area_gerencia,
            is_active=True
        )
        cargo_tactico = Cargo.objects.create(
            code='JEFE',
            name='Jefe de Área',
            nivel_jerarquico='TACTICO',
            area=area_gerencia,
            is_active=True
        )
        cargo_operativo = Cargo.objects.create(
            code='OPERARIO',
            name='Operario de Planta',
            nivel_jerarquico='OPERATIVO',
            area=area_gerencia,
            is_active=True
        )
        cargo_apoyo = Cargo.objects.create(
            code='ASISTENTE',
            name='Asistente Administrativo',
            nivel_jerarquico='APOYO',
            area=area_gerencia,
            is_active=True
        )

        # Assert
        assert cargo_estrategico.nivel_jerarquico == 'ESTRATEGICO'
        assert cargo_tactico.nivel_jerarquico == 'TACTICO'
        assert cargo_operativo.nivel_jerarquico == 'OPERATIVO'
        assert cargo_apoyo.nivel_jerarquico == 'APOYO'

        # Verificar choices disponibles
        assert cargo_estrategico.get_nivel_jerarquico_display() == 'Estratégico'

    def test_cargo_reporta_a_jerarquia_valida(self, cargo_gerente, area_operaciones, rol_supervisor):
        """
        Given: Un cargo que reporta a otro con nivel jerárquico superior
        When: Se crea el cargo subordinado
        Then: Debe permitir la creación (jerarquía válida)
        """
        # Arrange & Act
        cargo_subordinado = Cargo.objects.create(
            code='COORDINADOR',
            name='Coordinador de Operaciones',
            area=area_operaciones,
            parent_cargo=cargo_gerente,  # Reporta al gerente (ESTRATEGICO)
            nivel_jerarquico='TACTICO',  # Nivel inferior
            rol_sistema=rol_supervisor,
            is_active=True
        )

        # Assert
        assert cargo_subordinado.parent_cargo == cargo_gerente
        assert cargo_subordinado.parent_cargo.nivel_jerarquico == 'ESTRATEGICO'

    def test_cargo_reporta_a_jerarquia_invalida(self, cargo_supervisor, area_gerencia):
        """
        Given: Un cargo estratégico que reporta a uno táctico (inválido)
        When: Se ejecuta clean()
        Then: Debe lanzar ValidationError
        """
        # Arrange
        cargo_invalido = Cargo(
            code='DIRECTOR',
            name='Director General',
            area=area_gerencia,
            parent_cargo=cargo_supervisor,  # Táctico
            nivel_jerarquico='ESTRATEGICO',  # Estratégico reportando a táctico (INVÁLIDO)
            is_active=True
        )

        # Act & Assert
        with pytest.raises(ValidationError) as exc_info:
            cargo_invalido.clean()

        assert 'nivel jerárquico' in str(exc_info.value).lower()


# =============================================================================
# TAB 2: TESTS DE FUNCIONES
# =============================================================================

@pytest.mark.django_db
class TestCargoFunciones:
    """Tests para Tab 2: Funciones - Manual de funciones y responsabilidades."""

    def test_cargo_objetivo(self, area_operaciones):
        """
        Given: Un cargo con objetivo definido
        When: Se consulta el objetivo
        Then: Debe retornar el objetivo correcto
        """
        # Arrange
        objetivo_esperado = 'Garantizar la recolección eficiente de materia prima en las rutas asignadas'
        cargo = Cargo.objects.create(
            code='RECOLECTOR',
            name='Recolector de Ruta',
            area=area_operaciones,
            nivel_jerarquico='OPERATIVO',
            objetivo_cargo=objetivo_esperado,
            is_active=True
        )

        # Act
        objetivo = cargo.objetivo_cargo

        # Assert
        assert objetivo == objetivo_esperado
        assert len(objetivo) > 20  # Debe ser descriptivo

    def test_cargo_funciones_lista(self, area_operaciones):
        """
        Given: Un cargo con lista de funciones en JSONField
        When: Se asignan y consultan las funciones
        Then: Debe almacenar y retornar la lista correctamente
        """
        # Arrange
        funciones = [
            'Recolectar material en rutas asignadas según cronograma',
            'Verificar calidad y estado del material recolectado',
            'Registrar en sistema las cantidades recolectadas',
            'Mantener vehículo en condiciones óptimas',
            'Reportar novedades al supervisor inmediato'
        ]

        cargo = Cargo.objects.create(
            code='RECOLECTOR',
            name='Recolector de Ruta',
            area=area_operaciones,
            nivel_jerarquico='OPERATIVO',
            funciones_responsabilidades=funciones,
            is_active=True
        )

        # Act
        funciones_guardadas = cargo.funciones_responsabilidades

        # Assert
        assert isinstance(funciones_guardadas, list)
        assert len(funciones_guardadas) == 5
        assert funciones_guardadas[0] == 'Recolectar material en rutas asignadas según cronograma'
        assert 'Reportar novedades al supervisor inmediato' in funciones_guardadas

    def test_cargo_responsabilidades_varias(self, area_gerencia):
        """
        Given: Un cargo de jefatura con múltiples responsabilidades
        When: Se asigna autoridad y responsabilidades
        Then: Debe almacenar correctamente ambos campos
        """
        # Arrange
        responsabilidades = [
            'Aprobar presupuestos hasta 50 millones de pesos',
            'Contratar y desvincular personal operativo',
            'Representar la empresa ante entidades reguladoras',
            'Autorizar compras y pagos operativos'
        ]

        autoridad = 'Autoridad total sobre decisiones operativas y financieras. Representa legalmente a la empresa.'

        cargo = Cargo.objects.create(
            code='GERENTE',
            name='Gerente General',
            area=area_gerencia,
            nivel_jerarquico='ESTRATEGICO',
            funciones_responsabilidades=responsabilidades,
            autoridad_autonomia=autoridad,
            is_active=True
        )

        # Act & Assert
        assert len(cargo.funciones_responsabilidades) == 4
        assert 'presupuestos' in cargo.funciones_responsabilidades[0]
        assert cargo.autoridad_autonomia is not None
        assert 'Autoridad total' in cargo.autoridad_autonomia

    def test_cargo_autoridad(self, area_operaciones):
        """
        Given: Un cargo con nivel de autoridad definido
        When: Se consulta la autoridad
        Then: Debe retornar la descripción de autoridad correcta
        """
        # Arrange
        autoridad = 'Puede tomar decisiones sobre asignación de rutas y ajustes operativos menores sin requerir aprobación superior.'

        cargo = Cargo.objects.create(
            code='SUPERVISOR',
            name='Supervisor de Rutas',
            area=area_operaciones,
            nivel_jerarquico='TACTICO',
            autoridad_autonomia=autoridad,
            is_active=True
        )

        # Act
        autoridad_guardada = cargo.autoridad_autonomia

        # Assert
        assert autoridad_guardada == autoridad
        assert 'decisiones' in autoridad_guardada


# =============================================================================
# TAB 3: TESTS DE REQUISITOS
# =============================================================================

@pytest.mark.django_db
class TestCargoRequisitos:
    """Tests para Tab 3: Requisitos - Educación, experiencia y competencias."""

    def test_cargo_nivel_educativo(self, area_gerencia):
        """
        Given: Cargos con diferentes niveles educativos requeridos
        When: Se consultan los niveles educativos
        Then: Deben retornar los niveles correctos según choices
        """
        # Arrange & Act
        cargo_operativo = Cargo.objects.create(
            code='OPERARIO',
            name='Operario de Planta',
            area=area_gerencia,
            nivel_jerarquico='OPERATIVO',
            nivel_educativo='BACHILLER',
            is_active=True
        )
        cargo_tecnico = Cargo.objects.create(
            code='TECNICO',
            name='Técnico de Mantenimiento',
            area=area_gerencia,
            nivel_jerarquico='OPERATIVO',
            nivel_educativo='TECNICO',
            is_active=True
        )
        cargo_profesional = Cargo.objects.create(
            code='CONTADOR',
            name='Contador',
            area=area_gerencia,
            nivel_jerarquico='TACTICO',
            nivel_educativo='PROFESIONAL',
            titulo_requerido='Contador Público',
            is_active=True
        )
        cargo_especialista = Cargo.objects.create(
            code='GERENTE_CALIDAD',
            name='Gerente de Calidad',
            area=area_gerencia,
            nivel_jerarquico='ESTRATEGICO',
            nivel_educativo='ESPECIALIZACION',
            titulo_requerido='Especialización en Sistemas de Gestión',
            is_active=True
        )

        # Assert
        assert cargo_operativo.nivel_educativo == 'BACHILLER'
        assert cargo_operativo.get_nivel_educativo_display() == 'Bachiller'
        assert cargo_tecnico.nivel_educativo == 'TECNICO'
        assert cargo_profesional.nivel_educativo == 'PROFESIONAL'
        assert cargo_profesional.titulo_requerido == 'Contador Público'
        assert cargo_especialista.nivel_educativo == 'ESPECIALIZACION'

    def test_cargo_experiencia_minima(self, area_operaciones):
        """
        Given: Cargos con diferentes niveles de experiencia requerida
        When: Se consultan los requisitos de experiencia
        Then: Deben retornar los años de experiencia correctos
        """
        # Arrange & Act
        cargo_sin_exp = Cargo.objects.create(
            code='AUXILIAR',
            name='Auxiliar de Operaciones',
            area=area_operaciones,
            nivel_jerarquico='OPERATIVO',
            experiencia_requerida='SIN_EXPERIENCIA',
            is_active=True
        )
        cargo_junior = Cargo.objects.create(
            code='ANALISTA',
            name='Analista Junior',
            area=area_operaciones,
            nivel_jerarquico='TACTICO',
            experiencia_requerida='1_ANO',
            is_active=True
        )
        cargo_senior = Cargo.objects.create(
            code='COORDINADOR',
            name='Coordinador Senior',
            area=area_operaciones,
            nivel_jerarquico='TACTICO',
            experiencia_requerida='5_ANOS',
            experiencia_especifica='Mínimo 3 años en coordinación de operaciones logísticas',
            is_active=True
        )

        # Assert
        assert cargo_sin_exp.experiencia_requerida == 'SIN_EXPERIENCIA'
        assert cargo_sin_exp.get_experiencia_requerida_display() == 'Sin experiencia'
        assert cargo_junior.experiencia_requerida == '1_ANO'
        assert cargo_senior.experiencia_requerida == '5_ANOS'
        assert 'coordinación' in cargo_senior.experiencia_especifica

    def test_cargo_competencias_tecnicas(self, area_gerencia):
        """
        Given: Un cargo con competencias técnicas definidas
        When: Se consultan las competencias técnicas
        Then: Debe retornar la lista de competencias correctamente
        """
        # Arrange
        competencias_tecnicas = [
            'Manejo de Microsoft Excel avanzado',
            'Conocimiento de normas ISO 9001 y 14001',
            'Uso de software SAP para gestión de inventarios',
            'Lectura e interpretación de planos técnicos'
        ]

        cargo = Cargo.objects.create(
            code='COORDINADOR_CALIDAD',
            name='Coordinador de Calidad',
            area=area_gerencia,
            nivel_jerarquico='TACTICO',
            competencias_tecnicas=competencias_tecnicas,
            is_active=True
        )

        # Act
        competencias = cargo.competencias_tecnicas

        # Assert
        assert isinstance(competencias, list)
        assert len(competencias) == 4
        assert 'Excel' in competencias[0]
        assert 'ISO 9001' in competencias[1]

    def test_cargo_competencias_blandas(self, area_operaciones):
        """
        Given: Un cargo con competencias blandas definidas
        When: Se consultan las competencias blandas
        Then: Debe retornar la lista de habilidades interpersonales
        """
        # Arrange
        competencias_blandas = [
            'Liderazgo de equipos',
            'Comunicación asertiva',
            'Resolución de conflictos',
            'Orientación a resultados',
            'Trabajo bajo presión'
        ]

        cargo = Cargo.objects.create(
            code='SUPERVISOR',
            name='Supervisor de Rutas',
            area=area_operaciones,
            nivel_jerarquico='TACTICO',
            competencias_blandas=competencias_blandas,
            is_active=True
        )

        # Act
        habilidades = cargo.competencias_blandas

        # Assert
        assert isinstance(habilidades, list)
        assert len(habilidades) == 5
        assert 'Liderazgo' in habilidades[0]
        assert 'Comunicación asertiva' in habilidades


# =============================================================================
# TAB 4: TESTS DE SST (SEGURIDAD Y SALUD EN EL TRABAJO)
# =============================================================================

@pytest.mark.django_db
class TestCargoSST:
    """Tests para Tab 4: SST - Seguridad y Salud en el Trabajo."""

    def test_cargo_riesgos_ocupacionales(self, area_produccion, riesgo_biologico, riesgo_fisico, riesgo_biomecanico):
        """
        Given: Un cargo expuesto a múltiples riesgos ocupacionales
        When: Se asignan los riesgos al cargo
        Then: Debe almacenar y retornar todos los riesgos correctamente
        """
        # Arrange
        cargo = Cargo.objects.create(
            code='OPERARIO_PLANTA',
            name='Operario de Planta',
            area=area_produccion,
            nivel_jerarquico='OPERATIVO',
            is_active=True
        )

        # Act
        cargo.expuesto_riesgos.add(riesgo_biologico, riesgo_fisico, riesgo_biomecanico)

        # Assert
        riesgos = cargo.expuesto_riesgos.all()
        assert riesgos.count() == 3
        assert riesgo_biologico in riesgos
        assert riesgo_fisico in riesgos
        assert riesgo_biomecanico in riesgos

        # Verificar clasificaciones
        clasificaciones = [r.clasificacion for r in riesgos]
        assert 'BIOLOGICO' in clasificaciones
        assert 'FISICO' in clasificaciones
        assert 'BIOMECANICO' in clasificaciones

    def test_cargo_epp_requerido(self, area_produccion):
        """
        Given: Un cargo que requiere EPP específico
        When: Se consulta el EPP requerido
        Then: Debe retornar la lista completa de EPP
        """
        # Arrange
        epp_requeridos = [
            'Casco de seguridad',
            'Gafas de protección',
            'Guantes de nitrilo',
            'Botas de seguridad con punta de acero',
            'Overol industrial',
            'Protector respiratorio N95',
            'Protectores auditivos tipo copa'
        ]

        cargo = Cargo.objects.create(
            code='OPERARIO',
            name='Operario de Producción',
            area=area_produccion,
            nivel_jerarquico='OPERATIVO',
            epp_requeridos=epp_requeridos,
            is_active=True
        )

        # Act
        epp = cargo.epp_requeridos

        # Assert
        assert isinstance(epp, list)
        assert len(epp) == 7
        assert 'Casco de seguridad' in epp
        assert 'Protector respiratorio N95' in epp

    def test_cargo_examenes_medicos(self, area_operaciones):
        """
        Given: Un cargo con exámenes médicos ocupacionales requeridos
        When: Se consultan los exámenes médicos
        Then: Debe retornar la lista de exámenes periódicos
        """
        # Arrange
        examenes = [
            'Examen médico de ingreso',
            'Audiometría anual',
            'Visiometría anual',
            'Espirometría cada 6 meses',
            'Laboratorio clínico general',
            'Examen osteomuscular'
        ]

        cargo = Cargo.objects.create(
            code='CONDUCTOR',
            name='Conductor de Vehículo Pesado',
            area=area_operaciones,
            nivel_jerarquico='OPERATIVO',
            examenes_medicos=examenes,
            is_active=True
        )

        # Act
        examenes_guardados = cargo.examenes_medicos

        # Assert
        assert isinstance(examenes_guardados, list)
        assert len(examenes_guardados) == 6
        assert 'Audiometría anual' in examenes_guardados
        assert 'Espirometría' in examenes_guardados[3]

    def test_cargo_capacitaciones_obligatorias(self, area_produccion, riesgo_biologico):
        """
        Given: Un cargo con capacitaciones SST obligatorias
        When: Se consultan las capacitaciones requeridas
        Then: Debe retornar la lista de capacitaciones
        """
        # Arrange
        capacitaciones = [
            'Inducción en SST - 8 horas',
            'Manejo seguro de materiales peligrosos',
            'Uso correcto de EPP',
            'Plan de emergencias y evacuación',
            'Primeros auxilios básicos',
            'Prevención de riesgos biológicos'
        ]

        cargo = Cargo.objects.create(
            code='OPERARIO',
            name='Operario de Planta',
            area=area_produccion,
            nivel_jerarquico='OPERATIVO',
            capacitaciones_sst=capacitaciones,
            is_active=True
        )
        cargo.expuesto_riesgos.add(riesgo_biologico)

        # Act
        caps = cargo.capacitaciones_sst

        # Assert
        assert isinstance(caps, list)
        assert len(caps) == 6
        assert 'Inducción en SST' in caps[0]
        assert 'Primeros auxilios' in caps[4]

    def test_cargo_restricciones_medicas(self, area_operaciones):
        """
        Given: Un cargo con restricciones médicas definidas
        When: Se consultan las restricciones
        Then: Debe retornar las condiciones que impiden ejercer el cargo
        """
        # Arrange
        restricciones = (
            'No apto para personas con: '
            'Enfermedades cardiovasculares graves, '
            'Epilepsia no controlada, '
            'Limitaciones visuales no corregibles, '
            'Problemas de audición severos, '
            'Alergias respiratorias crónicas'
        )

        cargo = Cargo.objects.create(
            code='CONDUCTOR',
            name='Conductor de Vehículo Pesado',
            area=area_operaciones,
            nivel_jerarquico='OPERATIVO',
            requiere_licencia_conduccion=True,
            categoria_licencia='C2',
            restricciones_medicas=restricciones,
            is_active=True
        )

        # Act
        restricciones_guardadas = cargo.restricciones_medicas

        # Assert
        assert restricciones_guardadas is not None
        assert 'cardiovasculares' in restricciones_guardadas
        assert 'Epilepsia' in restricciones_guardadas
        assert cargo.requiere_licencia_conduccion is True
        assert cargo.categoria_licencia == 'C2'


# =============================================================================
# TAB 5: TESTS DE PERMISOS
# =============================================================================

@pytest.mark.django_db
class TestCargoPermisos:
    """Tests para Tab 5: Permisos - Roles y permisos del sistema."""

    def test_cargo_rol_sistema(self, area_gerencia, rol_gerente):
        """
        Given: Un cargo con rol del sistema asignado
        When: Se consulta el rol del cargo
        Then: Debe retornar el rol correcto
        """
        # Arrange
        cargo = Cargo.objects.create(
            code='GERENTE',
            name='Gerente General',
            area=area_gerencia,
            nivel_jerarquico='ESTRATEGICO',
            rol_sistema=rol_gerente,
            is_active=True
        )

        # Act
        rol = cargo.rol_sistema

        # Assert
        assert rol is not None
        assert rol.code == 'GERENTE'
        assert rol.name == 'Gerente'
        assert rol.level == Role.LEVEL_ADMIN

    def test_cargo_permisos_directos_herencia(self, area_operaciones, rol_supervisor, rol_operador):
        """
        Given: Cargos con diferentes roles y niveles de acceso
        When: Se consultan los roles asignados
        Then: Deben tener los permisos correctos según el rol
        """
        # Arrange
        cargo_supervisor = Cargo.objects.create(
            code='SUPERVISOR',
            name='Supervisor de Operaciones',
            area=area_operaciones,
            nivel_jerarquico='TACTICO',
            rol_sistema=rol_supervisor,
            is_active=True
        )

        cargo_operador = Cargo.objects.create(
            code='OPERARIO',
            name='Operario',
            area=area_operaciones,
            nivel_jerarquico='OPERATIVO',
            rol_sistema=rol_operador,
            is_active=True
        )

        # Act & Assert
        assert cargo_supervisor.rol_sistema.level == Role.LEVEL_MANAGER
        assert cargo_operador.rol_sistema.level == Role.LEVEL_USER
        assert cargo_supervisor.rol_sistema.level > cargo_operador.rol_sistema.level

    def test_cargo_roles_adicionales_multiples(self, area_gerencia, rol_gerente, rol_supervisor):
        """
        Given: Un cargo que puede tener rol principal y adicionales
        When: Se asigna el rol principal
        Then: El sistema debe permitir gestionar roles adicionales (preparado para M2M)
        """
        # Arrange
        cargo = Cargo.objects.create(
            code='DIRECTOR',
            name='Director de Operaciones',
            area=area_gerencia,
            nivel_jerarquico='ESTRATEGICO',
            rol_sistema=rol_gerente,  # Rol principal
            is_active=True
        )

        # Act
        rol_principal = cargo.rol_sistema

        # Assert
        assert rol_principal == rol_gerente
        assert rol_principal.code == 'GERENTE'
        # Nota: Si en el futuro se implementa M2M de roles adicionales,
        # aquí se validaría cargo.roles_adicionales.add(rol_supervisor)

    def test_cargo_herencia_permisos_jerarquia(self, cargo_gerente, cargo_supervisor, area_operaciones):
        """
        Given: Una jerarquía de cargos con diferentes niveles
        When: Se consulta la jerarquía
        Then: Los subordinados deben heredar relación con cargo superior
        """
        # Arrange
        cargo_operario = Cargo.objects.create(
            code='OPERARIO',
            name='Operario de Ruta',
            area=area_operaciones,
            parent_cargo=cargo_supervisor,
            nivel_jerarquico='OPERATIVO',
            is_active=True
        )

        # Act
        supervisor_del_operario = cargo_operario.parent_cargo
        gerente_del_supervisor = cargo_supervisor.parent_cargo

        # Assert
        assert supervisor_del_operario == cargo_supervisor
        assert gerente_del_supervisor == cargo_gerente
        assert supervisor_del_operario.nivel_jerarquico == 'TACTICO'
        assert gerente_del_supervisor.nivel_jerarquico == 'ESTRATEGICO'


# =============================================================================
# TESTS DE INTEGRACIÓN - Flujos completos
# =============================================================================

@pytest.mark.django_db
class TestCargoIntegracion:
    """Tests de integración para flujos completos del modelo Cargo."""

    def test_crear_cargo_completo_5_tabs(
        self, area_produccion, cargo_supervisor, rol_operador,
        riesgo_biologico, riesgo_fisico, riesgo_biomecanico
    ):
        """
        Given: Todos los datos necesarios para un cargo completo con los 5 tabs
        When: Se crea el cargo con toda la información
        Then: Debe almacenar correctamente todos los datos en todas las secciones
        """
        # Arrange - Datos completos para los 5 tabs
        cargo_data = {
            # TAB 1: IDENTIFICACIÓN
            'code': 'OPERARIO_001',
            'name': 'Operario de Producción',
            'description': 'Operario encargado del procesamiento de materia prima',
            'area': area_produccion,
            'parent_cargo': cargo_supervisor,
            'nivel_jerarquico': 'OPERATIVO',
            'cantidad_posiciones': 5,
            'is_jefatura': False,
            'requiere_licencia_conduccion': False,

            # TAB 2: FUNCIONES
            'objetivo_cargo': 'Garantizar el procesamiento eficiente de materia prima cumpliendo estándares de calidad',
            'funciones_responsabilidades': [
                'Operar maquinaria de procesamiento',
                'Verificar calidad del producto',
                'Mantener limpio y ordenado puesto de trabajo',
                'Reportar novedades al supervisor'
            ],
            'autoridad_autonomia': 'Puede detener proceso ante detección de no conformidades',
            'relaciones_internas': 'Supervisor, Coordinador de Calidad, Almacenista',
            'relaciones_externas': 'Ninguna',

            # TAB 3: REQUISITOS
            'nivel_educativo': 'BACHILLER',
            'titulo_requerido': 'Bachiller académico',
            'experiencia_requerida': '6_MESES',
            'experiencia_especifica': 'Preferible experiencia en planta de producción',
            'competencias_tecnicas': [
                'Operación de maquinaria básica',
                'Lectura de procedimientos',
                'Manejo de herramientas manuales'
            ],
            'competencias_blandas': [
                'Trabajo en equipo',
                'Responsabilidad',
                'Atención al detalle'
            ],

            # TAB 4: SST
            'epp_requeridos': [
                'Casco',
                'Guantes',
                'Botas',
                'Overol',
                'Protector auditivo'
            ],
            'examenes_medicos': [
                'Examen de ingreso',
                'Audiometría anual',
                'Osteomuscular anual'
            ],
            'restricciones_medicas': 'No apto para alergias respiratorias graves',
            'capacitaciones_sst': [
                'Inducción SST',
                'Uso de EPP',
                'Plan de emergencias'
            ],

            # TAB 5: PERMISOS
            'rol_sistema': rol_operador,

            # CONTROL
            'is_active': True,
            'version': 1
        }

        # Act
        cargo = Cargo.objects.create(**cargo_data)
        cargo.expuesto_riesgos.add(riesgo_biologico, riesgo_fisico, riesgo_biomecanico)

        # Assert - Validar todos los tabs
        # TAB 1: Identificación
        assert cargo.code == 'OPERARIO_001'
        assert cargo.name == 'Operario de Producción'
        assert cargo.area == area_produccion
        assert cargo.parent_cargo == cargo_supervisor
        assert cargo.nivel_jerarquico == 'OPERATIVO'
        assert cargo.cantidad_posiciones == 5

        # TAB 2: Funciones
        assert cargo.objetivo_cargo is not None
        assert len(cargo.funciones_responsabilidades) == 4
        assert 'maquinaria' in cargo.funciones_responsabilidades[0]
        assert cargo.autoridad_autonomia is not None

        # TAB 3: Requisitos
        assert cargo.nivel_educativo == 'BACHILLER'
        assert cargo.experiencia_requerida == '6_MESES'
        assert len(cargo.competencias_tecnicas) == 3
        assert len(cargo.competencias_blandas) == 3

        # TAB 4: SST
        assert len(cargo.epp_requeridos) == 5
        assert len(cargo.examenes_medicos) == 3
        assert len(cargo.capacitaciones_sst) == 3
        assert cargo.expuesto_riesgos.count() == 3
        assert cargo.restricciones_medicas is not None

        # TAB 5: Permisos
        assert cargo.rol_sistema == rol_operador

    def test_asignar_usuario_a_cargo(self, cargo_supervisor, usuario_test):
        """
        Given: Un cargo con posiciones disponibles y un usuario
        When: Se asigna el usuario al cargo
        Then: El cargo debe reflejar el usuario asignado y posiciones ocupadas
        """
        # Arrange
        cargo_supervisor.cantidad_posiciones = 3
        cargo_supervisor.save()

        # Act
        usuario_test.cargo = cargo_supervisor
        usuario_test.save()

        # Assert
        cargo_supervisor.refresh_from_db()
        assert cargo_supervisor.usuarios_asignados_count == 1
        assert cargo_supervisor.posiciones_disponibles == 2
        assert usuario_test.cargo == cargo_supervisor

    def test_cargo_con_subordinados(self, cargo_gerente, cargo_supervisor, area_operaciones):
        """
        Given: Un cargo con subordinados directos e indirectos
        When: Se consultan los subordinados recursivos
        Then: Debe retornar toda la cadena jerárquica de subordinados
        """
        # Arrange
        cargo_operario1 = Cargo.objects.create(
            code='OPERARIO1',
            name='Operario 1',
            area=area_operaciones,
            parent_cargo=cargo_supervisor,
            nivel_jerarquico='OPERATIVO',
            is_active=True
        )
        cargo_operario2 = Cargo.objects.create(
            code='OPERARIO2',
            name='Operario 2',
            area=area_operaciones,
            parent_cargo=cargo_supervisor,
            nivel_jerarquico='OPERATIVO',
            is_active=True
        )

        # Act
        subordinados_gerente = cargo_gerente.get_subordinados_recursivos()
        subordinados_supervisor = cargo_supervisor.get_subordinados_recursivos()

        # Assert
        # El gerente tiene como subordinado al supervisor y transitivamente a los operarios
        assert cargo_supervisor in subordinados_gerente
        # El supervisor tiene directamente a los operarios
        assert cargo_operario1 in subordinados_supervisor
        assert cargo_operario2 in subordinados_supervisor
        assert len(subordinados_supervisor) == 2

    def test_cargo_en_organigrama_completo(self, area_gerencia, area_operaciones, area_produccion):
        """
        Given: Una estructura organizacional completa con áreas y cargos
        When: Se crea un organigrama completo
        Then: Debe mantener consistencia entre áreas y cargos
        """
        # Arrange & Act
        cargo_gerente = Cargo.objects.create(
            code='GERENTE',
            name='Gerente General',
            area=area_gerencia,
            parent_cargo=None,
            nivel_jerarquico='ESTRATEGICO',
            is_jefatura=True,
            is_active=True
        )

        cargo_jefe_operaciones = Cargo.objects.create(
            code='JEFE_OPE',
            name='Jefe de Operaciones',
            area=area_operaciones,
            parent_cargo=cargo_gerente,
            nivel_jerarquico='TACTICO',
            is_jefatura=True,
            is_active=True
        )

        cargo_supervisor_produccion = Cargo.objects.create(
            code='SUPER_PROD',
            name='Supervisor de Producción',
            area=area_produccion,
            parent_cargo=cargo_jefe_operaciones,
            nivel_jerarquico='TACTICO',
            is_jefatura=True,
            is_active=True
        )

        cargo_operario = Cargo.objects.create(
            code='OPERARIO',
            name='Operario',
            area=area_produccion,
            parent_cargo=cargo_supervisor_produccion,
            nivel_jerarquico='OPERATIVO',
            is_jefatura=False,
            is_active=True
        )

        # Assert - Validar jerarquía completa
        assert cargo_gerente.area == area_gerencia
        assert cargo_jefe_operaciones.area == area_operaciones
        assert cargo_supervisor_produccion.area == area_produccion
        assert cargo_operario.area == area_produccion

        # Validar cadena de mando
        assert cargo_operario.parent_cargo == cargo_supervisor_produccion
        assert cargo_supervisor_produccion.parent_cargo == cargo_jefe_operaciones
        assert cargo_jefe_operaciones.parent_cargo == cargo_gerente
        assert cargo_gerente.parent_cargo is None

        # Validar niveles jerárquicos
        assert cargo_gerente.nivel_jerarquico == 'ESTRATEGICO'
        assert cargo_jefe_operaciones.nivel_jerarquico == 'TACTICO'
        assert cargo_supervisor_produccion.nivel_jerarquico == 'TACTICO'
        assert cargo_operario.nivel_jerarquico == 'OPERATIVO'

        # Validar jefaturas
        assert cargo_gerente.is_jefatura is True
        assert cargo_operario.is_jefatura is False

        # Validar subordinados recursivos
        subordinados_gerente = cargo_gerente.get_subordinados_recursivos()
        assert len(subordinados_gerente) == 3
        assert cargo_jefe_operaciones in subordinados_gerente
        assert cargo_supervisor_produccion in subordinados_gerente
        assert cargo_operario in subordinados_gerente


# =============================================================================
# TESTS ADICIONALES - Propiedades y métodos especiales
# =============================================================================

@pytest.mark.django_db
class TestCargoPropiedadesMetodos:
    """Tests para propiedades computadas y métodos especiales."""

    def test_cargo_str_representation(self, area_gerencia):
        """
        Given: Un cargo creado
        When: Se convierte a string
        Then: Debe retornar formato 'Nombre (CODE)'
        """
        # Arrange
        cargo = Cargo.objects.create(
            code='GERENTE',
            name='Gerente General',
            area=area_gerencia,
            nivel_jerarquico='ESTRATEGICO',
            is_active=True
        )

        # Act
        str_repr = str(cargo)

        # Assert
        assert 'Gerente General' in str_repr
        assert 'GERENTE' in str_repr
        assert str_repr == 'Gerente General (GERENTE)'

    def test_cargo_incrementar_version(self, area_gerencia):
        """
        Given: Un cargo con versión inicial
        When: Se incrementa la versión del manual
        Then: La versión debe aumentar en 1
        """
        # Arrange
        cargo = Cargo.objects.create(
            code='SUPERVISOR',
            name='Supervisor',
            area=area_gerencia,
            nivel_jerarquico='TACTICO',
            version=1,
            is_active=True
        )

        # Act
        version_inicial = cargo.version
        cargo.incrementar_version()
        cargo.refresh_from_db()

        # Assert
        assert version_inicial == 1
        assert cargo.version == 2

        # Incrementar de nuevo
        cargo.incrementar_version()
        cargo.refresh_from_db()
        assert cargo.version == 3

    def test_cargo_posiciones_disponibles_calculo(self, area_operaciones, usuario_test):
        """
        Given: Un cargo con 5 posiciones y 2 usuarios asignados
        When: Se calcula posiciones_disponibles
        Then: Debe retornar 3 posiciones disponibles
        """
        # Arrange
        cargo = Cargo.objects.create(
            code='RECOLECTOR',
            name='Recolector',
            area=area_operaciones,
            nivel_jerarquico='OPERATIVO',
            cantidad_posiciones=5,
            is_active=True
        )

        usuario2 = User.objects.create_user(
            username='mgarcia',
            email='mgarcia@test.com',
            password='test123',
            document_type='CC',
            document_number='9876543210',
            is_active=True
        )

        # Act
        usuario_test.cargo = cargo
        usuario_test.save()
        usuario2.cargo = cargo
        usuario2.save()

        cargo.refresh_from_db()
        disponibles = cargo.posiciones_disponibles
        asignados = cargo.usuarios_asignados_count

        # Assert
        assert asignados == 2
        assert disponibles == 3

    def test_cargo_licencias_especiales(self, area_operaciones):
        """
        Given: Cargos con requisitos especiales de licencias
        When: Se consultan los requisitos
        Then: Debe retornar correctamente las licencias requeridas
        """
        # Arrange
        cargo_conductor = Cargo.objects.create(
            code='CONDUCTOR',
            name='Conductor',
            area=area_operaciones,
            nivel_jerarquico='OPERATIVO',
            requiere_licencia_conduccion=True,
            categoria_licencia='C2',
            is_active=True
        )

        cargo_sst = Cargo.objects.create(
            code='COORD_SST',
            name='Coordinador SST',
            area=area_operaciones,
            nivel_jerarquico='TACTICO',
            requiere_licencia_sst=True,
            is_active=True
        )

        cargo_contador = Cargo.objects.create(
            code='CONTADOR',
            name='Contador',
            area=area_operaciones,
            nivel_jerarquico='TACTICO',
            requiere_tarjeta_contador=True,
            is_active=True
        )

        cargo_abogado = Cargo.objects.create(
            code='ABOGADO',
            name='Abogado',
            area=area_operaciones,
            nivel_jerarquico='TACTICO',
            requiere_tarjeta_abogado=True,
            is_active=True
        )

        # Assert
        assert cargo_conductor.requiere_licencia_conduccion is True
        assert cargo_conductor.categoria_licencia == 'C2'
        assert cargo_sst.requiere_licencia_sst is True
        assert cargo_contador.requiere_tarjeta_contador is True
        assert cargo_abogado.requiere_tarjeta_abogado is True

    def test_cargo_auditoria_campos(self, area_gerencia, usuario_test):
        """
        Given: Un cargo creado con usuario y fechas de auditoría
        When: Se consultan los campos de auditoría
        Then: Debe tener created_at, updated_at y created_by correctos
        """
        # Arrange
        antes_creacion = timezone.now()

        cargo = Cargo.objects.create(
            code='GERENTE',
            name='Gerente',
            area=area_gerencia,
            nivel_jerarquico='ESTRATEGICO',
            created_by=usuario_test,
            is_active=True
        )

        # Act
        despues_creacion = timezone.now()

        # Assert
        assert cargo.created_at is not None
        assert cargo.updated_at is not None
        assert cargo.created_by == usuario_test
        assert antes_creacion <= cargo.created_at <= despues_creacion
