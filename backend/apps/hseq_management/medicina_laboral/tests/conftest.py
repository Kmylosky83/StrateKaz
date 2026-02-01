"""
Fixtures compartidas para tests de Medicina Laboral
"""
import pytest
from datetime import date, timedelta
from django.utils import timezone
from .factories import (
    TipoExamenFactory,
    ExamenMedicoFactory,
    RestriccionMedicaFactory,
    ProgramaVigilanciaFactory,
    CasoVigilanciaFactory,
    DiagnosticoOcupacionalFactory,
    EstadisticaMedicaFactory
)


@pytest.fixture
def empresa():
    """ID de empresa para multi-tenant"""
    return 1


@pytest.fixture
def colaborador_id():
    """ID de colaborador de prueba"""
    return 100


@pytest.fixture
def cargo_id():
    """ID de cargo de prueba"""
    return 10


@pytest.fixture
def user_id():
    """ID de usuario de prueba"""
    return 5


@pytest.fixture
def tipo_examen_ingreso():
    """Tipo de examen de ingreso básico"""
    return TipoExamenFactory(
        codigo='EXM-ING-001',
        nombre='Examen Médico de Ingreso',
        tipo='INGRESO',
        periodicidad='UNICO',
        incluye_clinico=True,
        incluye_laboratorio=True,
        incluye_paraclinicos=False
    )


@pytest.fixture
def tipo_examen_periodico():
    """Tipo de examen periódico básico"""
    return TipoExamenFactory(
        codigo='EXM-PER-001',
        nombre='Examen Médico Periódico',
        tipo='PERIODICO',
        periodicidad='ANUAL',
        incluye_clinico=True,
        incluye_audiometria=True
    )


@pytest.fixture
def examen_medico(empresa, colaborador_id, cargo_id, tipo_examen_ingreso):
    """Examen médico básico"""
    return ExamenMedicoFactory(
        empresa_id=empresa,
        colaborador_id=colaborador_id,
        cargo_id=cargo_id,
        tipo_examen=tipo_examen_ingreso,
        fecha_programada=date.today(),
        estado='PROGRAMADO',
        concepto_aptitud='PENDIENTE'
    )


@pytest.fixture
def examen_completado(empresa, colaborador_id, tipo_examen_ingreso):
    """Examen médico completado"""
    return ExamenMedicoFactory(
        empresa_id=empresa,
        colaborador_id=colaborador_id,
        tipo_examen=tipo_examen_ingreso,
        fecha_programada=date.today() - timedelta(days=7),
        fecha_realizado=date.today() - timedelta(days=5),
        estado='COMPLETADO',
        concepto_aptitud='APTO',
        hallazgos_relevantes='Sin hallazgos relevantes',
        recomendaciones='Continuar con actividades habituales'
    )


@pytest.fixture
def restriccion_medica(empresa, colaborador_id, examen_completado):
    """Restricción médica activa"""
    return RestriccionMedicaFactory(
        empresa_id=empresa,
        colaborador_id=colaborador_id,
        examen_medico=examen_completado,
        tipo_restriccion='TEMPORAL',
        categoria='CARGA',
        descripcion='No levantar más de 10 kg',
        actividades_restringidas='Manipulación de cargas pesadas',
        fecha_inicio=date.today(),
        fecha_fin=date.today() + timedelta(days=30),
        estado='ACTIVA'
    )


@pytest.fixture
def restriccion_permanente(empresa, colaborador_id):
    """Restricción médica permanente"""
    return RestriccionMedicaFactory(
        empresa_id=empresa,
        colaborador_id=colaborador_id,
        tipo_restriccion='PERMANENTE',
        categoria='ALTURA',
        descripcion='No trabajo en alturas',
        fecha_inicio=date.today() - timedelta(days=90),
        fecha_fin=None,
        estado='ACTIVA'
    )


@pytest.fixture
def programa_vigilancia(empresa):
    """Programa de vigilancia epidemiológica básico"""
    return ProgramaVigilanciaFactory(
        empresa_id=empresa,
        codigo='PVE-OST-001',
        nombre='Programa de Vigilancia Osteomuscular',
        tipo='OSTEOMUSCULAR',
        objetivo='Prevenir desórdenes osteomusculares',
        fecha_inicio=date.today() - timedelta(days=365),
        estado='ACTIVO'
    )


@pytest.fixture
def programa_cardiovascular(empresa):
    """Programa de vigilancia cardiovascular"""
    return ProgramaVigilanciaFactory(
        empresa_id=empresa,
        codigo='PVE-CAR-001',
        nombre='Programa de Vigilancia Cardiovascular',
        tipo='CARDIOVASCULAR',
        objetivo='Prevenir riesgo cardiovascular',
        fecha_inicio=date.today() - timedelta(days=180),
        estado='ACTIVO'
    )


@pytest.fixture
def caso_vigilancia(empresa, colaborador_id, programa_vigilancia):
    """Caso de vigilancia activo"""
    return CasoVigilanciaFactory(
        empresa_id=empresa,
        colaborador_id=colaborador_id,
        programa=programa_vigilancia,
        fecha_apertura=date.today() - timedelta(days=30),
        descripcion_caso='Molestias en espalda baja',
        severidad='MODERADA',
        estado='ACTIVO'
    )


@pytest.fixture
def caso_con_seguimientos(empresa, colaborador_id, programa_vigilancia):
    """Caso de vigilancia con seguimientos registrados"""
    caso = CasoVigilanciaFactory(
        empresa_id=empresa,
        colaborador_id=colaborador_id,
        programa=programa_vigilancia,
        fecha_apertura=date.today() - timedelta(days=60),
        estado='EN_SEGUIMIENTO'
    )
    # Agregar seguimientos
    caso.seguimientos = [
        {
            'fecha': (date.today() - timedelta(days=45)).isoformat(),
            'descripcion': 'Primera evaluación',
            'responsable_id': 1
        },
        {
            'fecha': (date.today() - timedelta(days=30)).isoformat(),
            'descripcion': 'Segunda evaluación - mejora parcial',
            'responsable_id': 1
        },
    ]
    caso.fecha_ultimo_seguimiento = date.today() - timedelta(days=30)
    caso.save()
    return caso


@pytest.fixture
def diagnostico_ocupacional():
    """Diagnóstico ocupacional CIE-10"""
    return DiagnosticoOcupacionalFactory(
        codigo_cie10='M54.5',
        nombre='Lumbago no especificado',
        categoria='M54',
        origen='OCUPACIONAL',
        requiere_vigilancia=True,
        programa_vigilancia_sugerido='OSTEOMUSCULAR'
    )


@pytest.fixture
def diagnostico_comun():
    """Diagnóstico común CIE-10"""
    return DiagnosticoOcupacionalFactory(
        codigo_cie10='J06.9',
        nombre='Infección aguda de las vías respiratorias superiores',
        categoria='J06',
        origen='COMUN',
        requiere_vigilancia=False
    )


@pytest.fixture
def estadistica_medica(empresa):
    """Estadística médica mensual"""
    return EstadisticaMedicaFactory(
        empresa_id=empresa,
        anio=date.today().year,
        mes=date.today().month,
        total_colaboradores=100,
        examenes_realizados=25,
        examenes_ingreso=10,
        examenes_periodicos=12,
        examenes_egreso=3,
        aptos=20,
        aptos_con_restricciones=4,
        no_aptos_temporal=1,
        restricciones_activas=10,
        casos_vigilancia_activos=15
    )


@pytest.fixture
def anio_actual():
    """Año actual"""
    return date.today().year


@pytest.fixture
def mes_actual():
    """Mes actual"""
    return date.today().month
