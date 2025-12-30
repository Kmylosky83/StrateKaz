"""
Configuracion de pytest y fixtures para tests de IPEVR
=======================================================

Fixtures reutilizables para tests del modulo IPEVR.

Autor: Sistema ERP StrateKaz
Fecha: 26 Diciembre 2025
"""
import pytest
from datetime import date, timedelta
from django.contrib.auth import get_user_model
from apps.core.models import Empresa
from apps.motor_riesgos.ipevr.models import (
    ClasificacionPeligro,
    PeligroGTC45,
    MatrizIPEVR,
    ControlSST
)

User = get_user_model()


@pytest.fixture
def usuario_test(db):
    """Fixture para crear un usuario de prueba."""
    return User.objects.create_user(
        username='test_user',
        email='test@example.com',
        password='test123456',
        first_name='Usuario',
        last_name='Test'
    )


@pytest.fixture
def empresa_test(db):
    """Fixture para crear una empresa de prueba."""
    return Empresa.objects.create(
        razon_social='Grasas y Huesos del Norte Test',
        nombre_comercial='GHDN Test',
        nit='900123456-7',
        tipo_identificacion='nit',
        email='test@ghdn.com',
        telefono='3001234567',
        direccion='Calle Test 123',
        ciudad='Bogota',
        pais='Colombia',
        estado='activa'
    )


@pytest.fixture
def clasificacion_biologico(db):
    """Fixture para clasificacion de peligro biologico."""
    return ClasificacionPeligro.objects.create(
        codigo='BIO',
        nombre='Biologico',
        categoria=ClasificacionPeligro.Categoria.BIOLOGICO,
        descripcion='Peligros de origen biologico',
        color='#EF4444',
        icono='Virus',
        orden=1
    )


@pytest.fixture
def clasificacion_fisico(db):
    """Fixture para clasificacion de peligro fisico."""
    return ClasificacionPeligro.objects.create(
        codigo='FIS',
        nombre='Fisico',
        categoria=ClasificacionPeligro.Categoria.FISICO,
        descripcion='Peligros fisicos',
        color='#3B82F6',
        icono='Zap',
        orden=2
    )


@pytest.fixture
def clasificacion_quimico(db):
    """Fixture para clasificacion de peligro quimico."""
    return ClasificacionPeligro.objects.create(
        codigo='QUI',
        nombre='Quimico',
        categoria=ClasificacionPeligro.Categoria.QUIMICO,
        descripcion='Peligros quimicos',
        color='#10B981',
        icono='Flask',
        orden=3
    )


@pytest.fixture
def clasificacion_psicosocial(db):
    """Fixture para clasificacion de peligro psicosocial."""
    return ClasificacionPeligro.objects.create(
        codigo='PSI',
        nombre='Psicosocial',
        categoria=ClasificacionPeligro.Categoria.PSICOSOCIAL,
        descripcion='Peligros psicosociales',
        color='#8B5CF6',
        icono='Brain',
        orden=4
    )


@pytest.fixture
def clasificacion_biomecanico(db):
    """Fixture para clasificacion de peligro biomecanico."""
    return ClasificacionPeligro.objects.create(
        codigo='BIM',
        nombre='Biomecanico',
        categoria=ClasificacionPeligro.Categoria.BIOMECANICO,
        descripcion='Peligros biomecanicos',
        color='#F59E0B',
        icono='Activity',
        orden=5
    )


@pytest.fixture
def clasificacion_seguridad(db):
    """Fixture para clasificacion de peligro de seguridad."""
    return ClasificacionPeligro.objects.create(
        codigo='SEG',
        nombre='Seguridad',
        categoria=ClasificacionPeligro.Categoria.SEGURIDAD,
        descripcion='Condiciones de seguridad',
        color='#EC4899',
        icono='Shield',
        orden=6
    )


@pytest.fixture
def clasificacion_fenomenos(db):
    """Fixture para clasificacion de fenomenos naturales."""
    return ClasificacionPeligro.objects.create(
        codigo='FEN',
        nombre='Fenomenos Naturales',
        categoria=ClasificacionPeligro.Categoria.FENOMENOS,
        descripcion='Fenomenos naturales',
        color='#6B7280',
        icono='Cloud',
        orden=7
    )


@pytest.fixture
def peligro_virus(db, clasificacion_biologico):
    """Fixture para peligro de virus."""
    return PeligroGTC45.objects.create(
        clasificacion=clasificacion_biologico,
        codigo='BIO-001',
        nombre='Virus',
        descripcion='Exposicion a virus infecciosos',
        efectos_posibles='Enfermedades infecciosas, gripe, COVID-19',
        orden=1
    )


@pytest.fixture
def peligro_ruido(db, clasificacion_fisico):
    """Fixture para peligro de ruido."""
    return PeligroGTC45.objects.create(
        clasificacion=clasificacion_fisico,
        codigo='FIS-001',
        nombre='Ruido',
        descripcion='Exposicion a ruido continuo o intermitente',
        efectos_posibles='Hipoacusia, estres, fatiga auditiva',
        orden=1
    )


@pytest.fixture
def peligro_quimico_gases(db, clasificacion_quimico):
    """Fixture para peligro de gases toxicos."""
    return PeligroGTC45.objects.create(
        clasificacion=clasificacion_quimico,
        codigo='QUI-001',
        nombre='Gases y Vapores',
        descripcion='Exposicion a gases toxicos',
        efectos_posibles='Intoxicacion, irritacion respiratoria',
        orden=1
    )


@pytest.fixture
def peligro_postural(db, clasificacion_biomecanico):
    """Fixture para peligro postural."""
    return PeligroGTC45.objects.create(
        clasificacion=clasificacion_biomecanico,
        codigo='BIM-001',
        nombre='Postura prolongada',
        descripcion='Posiciones estaticas prolongadas',
        efectos_posibles='Lesiones musculoesqueleticas, fatiga',
        orden=1
    )


@pytest.fixture
def matriz_ipevr_critica(db, empresa_test, peligro_virus, usuario_test):
    """Fixture para matriz IPEVR con riesgo critico (Nivel I)."""
    return MatrizIPEVR.objects.create(
        empresa=empresa_test,
        area='Laboratorio',
        cargo='Tecnico de Laboratorio',
        proceso='Analisis de Muestras',
        actividad='Manipulacion de muestras biologicas',
        tarea='Toma y procesamiento de muestras de sangre',
        rutinaria=True,
        peligro=peligro_virus,
        fuente='Muestras biologicas infectadas',
        medio='Aire, contacto directo',
        trabajador='Tecnico de laboratorio',
        efectos='Infeccion viral grave',
        control_fuente='Protocolos de bioseguridad',
        control_medio='Ventilacion adecuada',
        control_individuo='EPP completo: guantes, mascarilla, gafas',
        nivel_deficiencia=10,  # Muy Alto
        nivel_exposicion=4,    # Continua
        nivel_consecuencia=100, # Mortal
        num_expuestos=3,
        peor_consecuencia='Muerte por infeccion grave',
        requisito_legal='Resolucion 2400 de 1979',
        responsable=usuario_test,
        fecha_valoracion=date.today(),
        estado=MatrizIPEVR.EstadoMatriz.VIGENTE,
        created_by=usuario_test
    )


@pytest.fixture
def matriz_ipevr_alta(db, empresa_test, peligro_ruido, usuario_test):
    """Fixture para matriz IPEVR con riesgo alto (Nivel II)."""
    return MatrizIPEVR.objects.create(
        empresa=empresa_test,
        area='Produccion',
        cargo='Operario de Maquinas',
        proceso='Corte y Procesamiento',
        actividad='Operacion de sierra industrial',
        tarea='Corte de piezas con sierra circular',
        rutinaria=True,
        peligro=peligro_ruido,
        fuente='Sierra circular industrial',
        medio='Aire',
        trabajador='Operario',
        efectos='Perdida auditiva',
        control_fuente='Mantenimiento de maquina',
        control_medio='Aislamiento acustico',
        control_individuo='Protectores auditivos',
        nivel_deficiencia=6,   # Alto
        nivel_exposicion=4,    # Continua
        nivel_consecuencia=60, # Muy Grave
        num_expuestos=5,
        peor_consecuencia='Hipoacusia severa irreversible',
        requisito_legal='Resolucion 1792 de 1990',
        responsable=usuario_test,
        fecha_valoracion=date.today(),
        estado=MatrizIPEVR.EstadoMatriz.VIGENTE,
        created_by=usuario_test
    )


@pytest.fixture
def matriz_ipevr_media(db, empresa_test, peligro_postural, usuario_test):
    """Fixture para matriz IPEVR con riesgo medio (Nivel III)."""
    return MatrizIPEVR.objects.create(
        empresa=empresa_test,
        area='Administracion',
        cargo='Asistente Administrativo',
        proceso='Tareas Administrativas',
        actividad='Trabajo de oficina',
        tarea='Digitacion y atencion al publico',
        rutinaria=True,
        peligro=peligro_postural,
        fuente='Estacion de trabajo inadecuada',
        medio='Contacto directo',
        trabajador='Asistente',
        efectos='Dolor lumbar, fatiga',
        control_fuente='Silla ergonomica',
        control_medio='Pausas activas',
        control_individuo='Capacitacion en ergonomia',
        nivel_deficiencia=2,   # Medio
        nivel_exposicion=4,    # Continua
        nivel_consecuencia=25, # Grave
        num_expuestos=10,
        peor_consecuencia='Lesion musculoesqueletica cronica',
        requisito_legal='Resolucion 2400 de 1979',
        responsable=usuario_test,
        fecha_valoracion=date.today(),
        estado=MatrizIPEVR.EstadoMatriz.VIGENTE,
        created_by=usuario_test
    )


@pytest.fixture
def matriz_ipevr_baja(db, empresa_test, peligro_postural, usuario_test):
    """Fixture para matriz IPEVR con riesgo bajo (Nivel IV)."""
    return MatrizIPEVR.objects.create(
        empresa=empresa_test,
        area='Recepcion',
        cargo='Recepcionista',
        proceso='Atencion al Cliente',
        actividad='Recepcion de visitantes',
        tarea='Atencion en recepcion',
        rutinaria=True,
        peligro=peligro_postural,
        fuente='Posicion sentada',
        medio='Contacto directo',
        trabajador='Recepcionista',
        efectos='Fatiga leve',
        control_fuente='Silla ergonomica',
        control_medio='Pausas programadas',
        control_individuo='Capacitacion',
        nivel_deficiencia=2,   # Medio
        nivel_exposicion=2,    # Ocasional
        nivel_consecuencia=10, # Leve
        num_expuestos=2,
        peor_consecuencia='Molestia temporal',
        requisito_legal='',
        responsable=usuario_test,
        fecha_valoracion=date.today(),
        estado=MatrizIPEVR.EstadoMatriz.VIGENTE,
        created_by=usuario_test
    )


@pytest.fixture
def control_eliminacion(db, matriz_ipevr_critica, usuario_test):
    """Fixture para control de tipo eliminacion."""
    return ControlSST.objects.create(
        empresa=matriz_ipevr_critica.empresa,
        matriz_ipevr=matriz_ipevr_critica,
        tipo_control=ControlSST.TipoControl.ELIMINACION,
        descripcion='Automatizar proceso de manejo de muestras',
        responsable=usuario_test,
        fecha_implementacion=date.today() + timedelta(days=30),
        estado=ControlSST.EstadoControl.PROPUESTO,
        efectividad=ControlSST.Efectividad.NO_EVALUADA,
        observaciones='Requiere inversion en tecnologia',
        created_by=usuario_test
    )


@pytest.fixture
def control_ingenieria(db, matriz_ipevr_alta, usuario_test):
    """Fixture para control de ingenieria."""
    return ControlSST.objects.create(
        empresa=matriz_ipevr_alta.empresa,
        matriz_ipevr=matriz_ipevr_alta,
        tipo_control=ControlSST.TipoControl.INGENIERIA,
        descripcion='Instalacion de cabina insonorizada',
        responsable=usuario_test,
        fecha_implementacion=date.today() + timedelta(days=15),
        estado=ControlSST.EstadoControl.EN_IMPLEMENTACION,
        efectividad=ControlSST.Efectividad.NO_EVALUADA,
        observaciones='En proceso de cotizacion',
        created_by=usuario_test
    )


@pytest.fixture
def control_epp(db, matriz_ipevr_alta, usuario_test):
    """Fixture para control de EPP."""
    return ControlSST.objects.create(
        empresa=matriz_ipevr_alta.empresa,
        matriz_ipevr=matriz_ipevr_alta,
        tipo_control=ControlSST.TipoControl.EPP,
        descripcion='Suministro de protectores auditivos tipo copa',
        responsable=usuario_test,
        fecha_implementacion=date.today() - timedelta(days=10),
        estado=ControlSST.EstadoControl.IMPLEMENTADO,
        efectividad=ControlSST.Efectividad.ALTA,
        observaciones='Personal capacitado en uso',
        created_by=usuario_test
    )
