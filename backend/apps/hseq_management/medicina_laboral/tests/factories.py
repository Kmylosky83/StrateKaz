"""
Factories para tests de Medicina Laboral usando Factory Boy
"""
import factory
from factory.django import DjangoModelFactory
from datetime import date, timedelta
from decimal import Decimal

from apps.hseq_management.medicina_laboral.models import (
    TipoExamen,
    ExamenMedico,
    RestriccionMedica,
    ProgramaVigilancia,
    CasoVigilancia,
    DiagnosticoOcupacional,
    EstadisticaMedica
)


class TipoExamenFactory(DjangoModelFactory):
    """Factory para TipoExamen"""

    class Meta:
        model = TipoExamen
        django_get_or_create = ('codigo',)

    codigo = factory.Sequence(lambda n: f'EXM-{n:03d}')
    nombre = factory.Faker('sentence', nb_words=4)
    tipo = 'INGRESO'
    descripcion = factory.Faker('paragraph')
    periodicidad = 'UNICO'
    meses_periodicidad = None

    incluye_clinico = True
    incluye_laboratorio = False
    incluye_paraclinicos = False
    incluye_audiometria = False
    incluye_visiometria = False
    incluye_espirometria = False

    enfasis_osteomuscular = False
    enfasis_cardiovascular = False
    enfasis_respiratorio = False
    enfasis_neurologico = False

    is_active = True


class ExamenMedicoFactory(DjangoModelFactory):
    """Factory para ExamenMedico"""

    class Meta:
        model = ExamenMedico

    empresa_id = 1
    numero_examen = factory.Sequence(lambda n: f'EXM-2025-{n:05d}')
    tipo_examen = factory.SubFactory(TipoExamenFactory)
    colaborador_id = 100
    cargo_id = 10

    fecha_programada = factory.LazyFunction(date.today)
    fecha_realizado = None

    entidad_prestadora = factory.Faker('company')
    medico_evaluador = factory.Faker('name')
    licencia_medica = factory.Sequence(lambda n: f'MED-{n:06d}')

    concepto_aptitud = 'PENDIENTE'
    hallazgos_relevantes = None
    recomendaciones = None
    diagnosticos = factory.LazyFunction(list)

    requiere_restricciones = False
    restricciones_temporales = None
    restricciones_permanentes = None

    requiere_seguimiento = False
    tipo_seguimiento = None
    fecha_proximo_control = None

    estado = 'PROGRAMADO'
    costo_examen = Decimal('150000.00')
    created_by_id = 1


class RestriccionMedicaFactory(DjangoModelFactory):
    """Factory para RestriccionMedica"""

    class Meta:
        model = RestriccionMedica

    empresa_id = 1
    codigo_restriccion = factory.Sequence(lambda n: f'RES-{n:05d}')
    examen_medico = factory.SubFactory(ExamenMedicoFactory)
    colaborador_id = 100
    cargo_id = 10

    tipo_restriccion = 'TEMPORAL'
    categoria = 'CARGA'
    descripcion = factory.Faker('sentence')
    actividades_restringidas = factory.Faker('paragraph')

    fecha_inicio = factory.LazyFunction(date.today)
    fecha_fin = factory.LazyFunction(lambda: date.today() + timedelta(days=30))

    medico_ordena = factory.Faker('name')
    licencia_medica = factory.Sequence(lambda n: f'MED-{n:06d}')

    requiere_evaluacion_periodica = False
    frecuencia_evaluacion_meses = None
    proxima_evaluacion = None

    ajuste_realizado = False
    descripcion_ajuste = None

    estado = 'ACTIVA'
    fecha_levantamiento = None
    motivo_levantamiento = None

    created_by_id = 1


class ProgramaVigilanciaFactory(DjangoModelFactory):
    """Factory para ProgramaVigilancia"""

    class Meta:
        model = ProgramaVigilancia
        django_get_or_create = ('codigo',)

    empresa_id = 1
    codigo = factory.Sequence(lambda n: f'PVE-{n:03d}')
    nombre = factory.Faker('sentence', nb_words=5)
    tipo = 'OSTEOMUSCULAR'
    descripcion = factory.Faker('paragraph')
    objetivo = factory.Faker('sentence')
    alcance = factory.Faker('paragraph')

    cargos_aplicables = factory.LazyFunction(list)
    areas_aplicables = factory.LazyFunction(list)
    actividades_vigilancia = factory.LazyFunction(list)
    indicadores = factory.LazyFunction(list)

    frecuencia_evaluacion_meses = 12
    fecha_inicio = factory.LazyFunction(date.today)
    fecha_revision = None
    proxima_revision = None

    responsable_id = 1
    estado = 'ACTIVO'
    created_by_id = 1


class CasoVigilanciaFactory(DjangoModelFactory):
    """Factory para CasoVigilancia"""

    class Meta:
        model = CasoVigilancia

    empresa_id = 1
    numero_caso = factory.Sequence(lambda n: f'PVE-2025-{n:05d}')
    programa = factory.SubFactory(ProgramaVigilanciaFactory)
    colaborador_id = 100
    cargo_id = 10

    fecha_apertura = factory.LazyFunction(date.today)
    descripcion_caso = factory.Faker('paragraph')
    severidad = 'MODERADA'

    diagnosticos_cie10 = factory.LazyFunction(list)
    factores_riesgo_identificados = factory.Faker('paragraph')
    exposicion_laboral = factory.Faker('paragraph')

    plan_intervencion = factory.Faker('paragraph')
    acciones_implementadas = factory.LazyFunction(list)
    seguimientos = factory.LazyFunction(list)

    fecha_ultimo_seguimiento = None
    fecha_proximo_seguimiento = None

    fecha_cierre = None
    motivo_cierre = None
    resultado_final = None

    estado = 'ACTIVO'
    created_by_id = 1


class DiagnosticoOcupacionalFactory(DjangoModelFactory):
    """Factory para DiagnosticoOcupacional"""

    class Meta:
        model = DiagnosticoOcupacional
        django_get_or_create = ('codigo_cie10',)

    codigo_cie10 = factory.Sequence(lambda n: f'M{n:02d}.{n % 10}')
    nombre = factory.Faker('sentence')
    descripcion = factory.Faker('paragraph')
    categoria = factory.LazyAttribute(lambda obj: obj.codigo_cie10[:3])
    origen = 'OCUPACIONAL'

    riesgos_relacionados = factory.Faker('paragraph')
    requiere_vigilancia = True
    programa_vigilancia_sugerido = 'OSTEOMUSCULAR'

    requiere_reporte_arl = False
    requiere_reporte_secretaria = False
    is_active = True


class EstadisticaMedicaFactory(DjangoModelFactory):
    """Factory para EstadisticaMedica"""

    class Meta:
        model = EstadisticaMedica

    empresa_id = 1
    anio = factory.LazyFunction(lambda: date.today().year)
    mes = factory.LazyFunction(lambda: date.today().month)

    total_colaboradores = 100

    examenes_realizados = 20
    examenes_ingreso = 8
    examenes_periodicos = 10
    examenes_egreso = 2

    aptos = 15
    aptos_con_restricciones = 4
    no_aptos_temporal = 1
    no_aptos_permanente = 0

    restricciones_activas = 10
    restricciones_nuevas = 3
    restricciones_levantadas = 2

    casos_vigilancia_activos = 12
    casos_nuevos = 5
    casos_cerrados = 3

    diagnosticos_ocupacionales = 8
    diagnosticos_comunes = 12

    top_diagnosticos = factory.LazyFunction(list)

    porcentaje_aptitud = Decimal('75.00')
    porcentaje_cobertura_examenes = Decimal('20.00')
    costo_total_examenes = Decimal('3000000.00')

    created_by_id = 1
