"""
Tests para modelos de Medicina Laboral
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError

from apps.hseq_management.medicina_laboral.models import (
    TipoExamen,
    ExamenMedico,
    RestriccionMedica,
    ProgramaVigilancia,
    CasoVigilancia,
    DiagnosticoOcupacional,
    EstadisticaMedica
)
from .factories import (
    TipoExamenFactory,
    ExamenMedicoFactory,
    RestriccionMedicaFactory,
    ProgramaVigilanciaFactory,
    CasoVigilanciaFactory,
    DiagnosticoOcupacionalFactory,
    EstadisticaMedicaFactory
)


# ============================================================================
# TESTS PARA TipoExamen
# ============================================================================

@pytest.mark.django_db
class TestTipoExamen:
    """Tests para el modelo TipoExamen"""

    def test_create_tipo_examen(self):
        """Test crear tipo de examen válido"""
        tipo = TipoExamenFactory(
            codigo='EXM-ING-001',
            nombre='Examen de Ingreso',
            tipo='INGRESO'
        )
        assert tipo.pk is not None
        assert tipo.codigo == 'EXM-ING-001'
        assert tipo.tipo == 'INGRESO'
        assert tipo.is_active is True

    def test_tipo_examen_str(self):
        """Test método __str__"""
        tipo = TipoExamenFactory(
            tipo='PERIODICO',
            nombre='Examen Periódico'
        )
        expected = f"{tipo.get_tipo_display()} - {tipo.nombre}"
        assert str(tipo) == expected

    def test_tipo_examen_codigo_unique(self):
        """Test código único"""
        TipoExamenFactory(codigo='EXM-001')
        with pytest.raises(IntegrityError):
            TipoExamenFactory(codigo='EXM-001')

    def test_tipo_examen_periodicidad_choices(self):
        """Test validación de choices para periodicidad"""
        tipo = TipoExamenFactory(periodicidad='ANUAL')
        assert tipo.periodicidad == 'ANUAL'

    def test_tipo_examen_tipo_choices(self):
        """Test validación de choices para tipo"""
        for tipo_choice in ['INGRESO', 'PERIODICO', 'EGRESO', 'POST_INCAPACIDAD', 'RETIRO', 'CAMBIO_OCUPACION']:
            tipo_examen = TipoExamenFactory(tipo=tipo_choice)
            assert tipo_examen.tipo == tipo_choice

    def test_tipo_examen_clean_personalizado_sin_meses(self):
        """Test validación: periodicidad personalizada requiere meses"""
        tipo = TipoExamenFactory.build(
            periodicidad='PERSONALIZADO',
            meses_periodicidad=None
        )
        with pytest.raises(ValidationError) as exc:
            tipo.clean()
        assert 'meses_periodicidad' in exc.value.message_dict

    def test_tipo_examen_clean_personalizado_con_meses(self):
        """Test validación: periodicidad personalizada con meses es válida"""
        tipo = TipoExamenFactory.build(
            periodicidad='PERSONALIZADO',
            meses_periodicidad=6
        )
        tipo.clean()  # No debe lanzar excepción

    def test_tipo_examen_incluye_pruebas(self):
        """Test configuración de pruebas incluidas"""
        tipo = TipoExamenFactory(
            incluye_clinico=True,
            incluye_laboratorio=True,
            incluye_audiometria=True,
            incluye_visiometria=False
        )
        assert tipo.incluye_clinico is True
        assert tipo.incluye_laboratorio is True
        assert tipo.incluye_audiometria is True
        assert tipo.incluye_visiometria is False

    def test_tipo_examen_enfasis(self):
        """Test configuración de énfasis"""
        tipo = TipoExamenFactory(
            enfasis_osteomuscular=True,
            enfasis_cardiovascular=True,
            enfasis_respiratorio=False
        )
        assert tipo.enfasis_osteomuscular is True
        assert tipo.enfasis_cardiovascular is True
        assert tipo.enfasis_respiratorio is False


# ============================================================================
# TESTS PARA ExamenMedico
# ============================================================================

@pytest.mark.django_db
class TestExamenMedico:
    """Tests para el modelo ExamenMedico"""

    def test_create_examen_medico(self, empresa, colaborador_id, tipo_examen_ingreso):
        """Test crear examen médico válido"""
        examen = ExamenMedicoFactory(
            empresa_id=empresa,
            colaborador_id=colaborador_id,
            tipo_examen=tipo_examen_ingreso
        )
        assert examen.pk is not None
        assert examen.empresa_id == empresa
        assert examen.colaborador_id == colaborador_id
        assert examen.estado == 'PROGRAMADO'

    def test_examen_medico_str(self, examen_medico):
        """Test método __str__"""
        expected = f"{examen_medico.numero_examen} - {examen_medico.tipo_examen.nombre}"
        assert str(examen_medico) == expected

    def test_examen_medico_numero_unique(self, empresa, colaborador_id, tipo_examen_ingreso):
        """Test número de examen único"""
        numero = 'EXM-2025-00001'
        ExamenMedicoFactory(numero_examen=numero)
        with pytest.raises(IntegrityError):
            ExamenMedicoFactory(numero_examen=numero)

    def test_examen_medico_auto_numero(self, empresa, colaborador_id, tipo_examen_ingreso):
        """Test generación automática de número de examen"""
        examen = ExamenMedico(
            empresa_id=empresa,
            colaborador_id=colaborador_id,
            tipo_examen=tipo_examen_ingreso,
            fecha_programada=date.today()
        )
        examen.save()
        assert examen.numero_examen is not None
        assert examen.numero_examen.startswith('EXM-')

    def test_examen_medico_concepto_choices(self, examen_medico):
        """Test validación de choices para concepto"""
        for concepto in ['APTO', 'APTO_CON_RESTRICCIONES', 'NO_APTO_TEMPORAL', 'NO_APTO_PERMANENTE', 'PENDIENTE']:
            examen_medico.concepto_aptitud = concepto
            examen_medico.save()
            assert examen_medico.concepto_aptitud == concepto

    def test_examen_medico_estado_choices(self, examen_medico):
        """Test validación de choices para estado"""
        for estado in ['PROGRAMADO', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO', 'VENCIDO']:
            examen_medico.estado = estado
            examen_medico.save()
            assert examen_medico.estado == estado

    def test_examen_medico_clean_completado_sin_fecha(self, examen_medico):
        """Test validación: completado requiere fecha realizado"""
        examen_medico.estado = 'COMPLETADO'
        examen_medico.fecha_realizado = None
        with pytest.raises(ValidationError) as exc:
            examen_medico.clean()
        assert 'fecha_realizado' in exc.value.message_dict

    def test_examen_medico_clean_concepto_sin_fecha(self, examen_medico):
        """Test validación: concepto requiere fecha realizado"""
        examen_medico.concepto_aptitud = 'APTO'
        examen_medico.fecha_realizado = None
        with pytest.raises(ValidationError) as exc:
            examen_medico.clean()
        assert 'concepto_aptitud' in exc.value.message_dict

    def test_examen_medico_json_diagnosticos(self, examen_medico):
        """Test campo JSON de diagnósticos"""
        diagnosticos = [
            {'codigo': 'M54.5', 'nombre': 'Lumbago'},
            {'codigo': 'H52.4', 'nombre': 'Presbicia'}
        ]
        examen_medico.diagnosticos = diagnosticos
        examen_medico.save()
        examen_medico.refresh_from_db()
        assert len(examen_medico.diagnosticos) == 2
        assert examen_medico.diagnosticos[0]['codigo'] == 'M54.5'

    def test_examen_medico_relacion_tipo_examen(self, examen_medico, tipo_examen_ingreso):
        """Test relación con TipoExamen"""
        assert examen_medico.tipo_examen == tipo_examen_ingreso
        assert examen_medico in tipo_examen_ingreso.examenes.all()


# ============================================================================
# TESTS PARA RestriccionMedica
# ============================================================================

@pytest.mark.django_db
class TestRestriccionMedica:
    """Tests para el modelo RestriccionMedica"""

    def test_create_restriccion_medica(self, empresa, colaborador_id, examen_completado):
        """Test crear restricción médica válida"""
        restriccion = RestriccionMedicaFactory(
            empresa_id=empresa,
            colaborador_id=colaborador_id,
            examen_medico=examen_completado
        )
        assert restriccion.pk is not None
        assert restriccion.empresa_id == empresa
        assert restriccion.estado == 'ACTIVA'

    def test_restriccion_medica_str(self, restriccion_medica):
        """Test método __str__"""
        expected = f"{restriccion_medica.codigo_restriccion} - {restriccion_medica.get_tipo_restriccion_display()}"
        assert str(restriccion_medica) == expected

    def test_restriccion_codigo_unique(self):
        """Test código único"""
        codigo = 'RES-00001'
        RestriccionMedicaFactory(codigo_restriccion=codigo)
        with pytest.raises(IntegrityError):
            RestriccionMedicaFactory(codigo_restriccion=codigo)

    def test_restriccion_tipo_choices(self, restriccion_medica):
        """Test validación de choices para tipo"""
        for tipo in ['TEMPORAL', 'PERMANENTE', 'CONDICIONAL']:
            restriccion_medica.tipo_restriccion = tipo
            restriccion_medica.save()
            assert restriccion_medica.tipo_restriccion == tipo

    def test_restriccion_categoria_choices(self, restriccion_medica):
        """Test validación de choices para categoría"""
        for categoria in ['CARGA', 'POSTURA', 'MOVIMIENTO', 'ALTURA', 'ESPACIOS_CONFINADOS']:
            restriccion_medica.categoria = categoria
            restriccion_medica.save()
            assert restriccion_medica.categoria == categoria

    def test_restriccion_clean_temporal_sin_fecha_fin(self, restriccion_medica):
        """Test validación: temporal requiere fecha fin"""
        restriccion_medica.tipo_restriccion = 'TEMPORAL'
        restriccion_medica.fecha_fin = None
        with pytest.raises(ValidationError) as exc:
            restriccion_medica.clean()
        assert 'fecha_fin' in exc.value.message_dict

    def test_restriccion_clean_permanente_con_fecha_fin(self, restriccion_permanente):
        """Test validación: permanente no debe tener fecha fin"""
        restriccion_permanente.fecha_fin = date.today() + timedelta(days=30)
        with pytest.raises(ValidationError) as exc:
            restriccion_permanente.clean()
        assert 'fecha_fin' in exc.value.message_dict

    def test_restriccion_esta_vigente_activa(self, restriccion_medica):
        """Test propiedad esta_vigente - restricción activa"""
        restriccion_medica.estado = 'ACTIVA'
        restriccion_medica.fecha_fin = date.today() + timedelta(days=10)
        restriccion_medica.save()
        assert restriccion_medica.esta_vigente is True

    def test_restriccion_esta_vigente_vencida(self, restriccion_medica):
        """Test propiedad esta_vigente - restricción vencida por fecha"""
        restriccion_medica.estado = 'ACTIVA'
        restriccion_medica.fecha_fin = date.today() - timedelta(days=1)
        restriccion_medica.save()
        assert restriccion_medica.esta_vigente is False

    def test_restriccion_esta_vigente_estado_inactivo(self, restriccion_medica):
        """Test propiedad esta_vigente - estado no activo"""
        restriccion_medica.estado = 'LEVANTADA'
        restriccion_medica.save()
        assert restriccion_medica.esta_vigente is False

    def test_restriccion_relacion_examen(self, restriccion_medica, examen_completado):
        """Test relación con ExamenMedico"""
        assert restriccion_medica.examen_medico == examen_completado
        assert restriccion_medica in examen_completado.restricciones.all()


# ============================================================================
# TESTS PARA ProgramaVigilancia
# ============================================================================

@pytest.mark.django_db
class TestProgramaVigilancia:
    """Tests para el modelo ProgramaVigilancia"""

    def test_create_programa_vigilancia(self, empresa):
        """Test crear programa de vigilancia válido"""
        programa = ProgramaVigilanciaFactory(
            empresa_id=empresa,
            codigo='PVE-OST-001',
            tipo='OSTEOMUSCULAR'
        )
        assert programa.pk is not None
        assert programa.empresa_id == empresa
        assert programa.estado == 'ACTIVO'

    def test_programa_vigilancia_str(self, programa_vigilancia):
        """Test método __str__"""
        expected = f"{programa_vigilancia.codigo} - {programa_vigilancia.nombre}"
        assert str(programa_vigilancia) == expected

    def test_programa_codigo_unique(self):
        """Test código único"""
        codigo = 'PVE-001'
        ProgramaVigilanciaFactory(codigo=codigo)
        with pytest.raises(IntegrityError):
            ProgramaVigilanciaFactory(codigo=codigo)

    def test_programa_tipo_choices(self, programa_vigilancia):
        """Test validación de choices para tipo"""
        tipos = ['OSTEOMUSCULAR', 'CARDIOVASCULAR', 'AUDITIVO', 'RESPIRATORIO', 'VISUAL', 'PSICOSOCIAL']
        for tipo in tipos:
            programa_vigilancia.tipo = tipo
            programa_vigilancia.save()
            assert programa_vigilancia.tipo == tipo

    def test_programa_json_cargos_aplicables(self, programa_vigilancia):
        """Test campo JSON de cargos aplicables"""
        cargos = [1, 2, 3, 5, 8]
        programa_vigilancia.cargos_aplicables = cargos
        programa_vigilancia.save()
        programa_vigilancia.refresh_from_db()
        assert programa_vigilancia.cargos_aplicables == cargos

    def test_programa_json_actividades(self, programa_vigilancia):
        """Test campo JSON de actividades"""
        actividades = [
            {'nombre': 'Evaluación inicial', 'frecuencia': 'Inicial'},
            {'nombre': 'Seguimiento', 'frecuencia': 'Trimestral'}
        ]
        programa_vigilancia.actividades_vigilancia = actividades
        programa_vigilancia.save()
        programa_vigilancia.refresh_from_db()
        assert len(programa_vigilancia.actividades_vigilancia) == 2

    def test_programa_json_indicadores(self, programa_vigilancia):
        """Test campo JSON de indicadores"""
        indicadores = [
            {'nombre': 'Tasa de incidencia', 'meta': '5%'},
            {'nombre': 'Cobertura', 'meta': '100%'}
        ]
        programa_vigilancia.indicadores = indicadores
        programa_vigilancia.save()
        programa_vigilancia.refresh_from_db()
        assert len(programa_vigilancia.indicadores) == 2

    def test_programa_casos_activos_count(self, programa_vigilancia):
        """Test propiedad casos_activos_count"""
        # Crear 3 casos activos
        for _ in range(3):
            CasoVigilanciaFactory(
                programa=programa_vigilancia,
                estado='ACTIVO'
            )
        # Crear 2 casos cerrados
        for _ in range(2):
            CasoVigilanciaFactory(
                programa=programa_vigilancia,
                estado='CERRADO'
            )
        assert programa_vigilancia.casos_activos_count == 3


# ============================================================================
# TESTS PARA CasoVigilancia
# ============================================================================

@pytest.mark.django_db
class TestCasoVigilancia:
    """Tests para el modelo CasoVigilancia"""

    def test_create_caso_vigilancia(self, empresa, colaborador_id, programa_vigilancia):
        """Test crear caso de vigilancia válido"""
        caso = CasoVigilanciaFactory(
            empresa_id=empresa,
            colaborador_id=colaborador_id,
            programa=programa_vigilancia
        )
        assert caso.pk is not None
        assert caso.empresa_id == empresa
        assert caso.estado == 'ACTIVO'

    def test_caso_vigilancia_str(self, caso_vigilancia):
        """Test método __str__"""
        expected = f"{caso_vigilancia.numero_caso} - {caso_vigilancia.programa.nombre}"
        assert str(caso_vigilancia) == expected

    def test_caso_numero_unique(self):
        """Test número de caso único"""
        numero = 'PVE-2025-00001'
        CasoVigilanciaFactory(numero_caso=numero)
        with pytest.raises(IntegrityError):
            CasoVigilanciaFactory(numero_caso=numero)

    def test_caso_auto_numero(self, empresa, colaborador_id, programa_vigilancia):
        """Test generación automática de número de caso"""
        caso = CasoVigilancia(
            empresa_id=empresa,
            colaborador_id=colaborador_id,
            programa=programa_vigilancia,
            fecha_apertura=date.today(),
            descripcion_caso='Test',
            severidad='LEVE'
        )
        caso.save()
        assert caso.numero_caso is not None
        assert caso.numero_caso.startswith('PVE-')

    def test_caso_severidad_choices(self, caso_vigilancia):
        """Test validación de choices para severidad"""
        for severidad in ['LEVE', 'MODERADA', 'SEVERA', 'CRITICA']:
            caso_vigilancia.severidad = severidad
            caso_vigilancia.save()
            assert caso_vigilancia.severidad == severidad

    def test_caso_estado_choices(self, caso_vigilancia):
        """Test validación de choices para estado"""
        for estado in ['ACTIVO', 'EN_SEGUIMIENTO', 'CONTROLADO', 'CERRADO', 'CANCELADO']:
            caso_vigilancia.estado = estado
            caso_vigilancia.save()
            assert caso_vigilancia.estado == estado

    def test_caso_json_diagnosticos(self, caso_vigilancia):
        """Test campo JSON de diagnósticos"""
        diagnosticos = [
            {'codigo': 'M54.5', 'nombre': 'Lumbago'},
            {'codigo': 'M79.1', 'nombre': 'Mialgia'}
        ]
        caso_vigilancia.diagnosticos_cie10 = diagnosticos
        caso_vigilancia.save()
        caso_vigilancia.refresh_from_db()
        assert len(caso_vigilancia.diagnosticos_cie10) == 2

    def test_caso_json_acciones(self, caso_vigilancia):
        """Test campo JSON de acciones implementadas"""
        acciones = [
            {'descripcion': 'Ajuste de puesto', 'fecha': '2025-01-15'},
            {'descripcion': 'Capacitación ergonómica', 'fecha': '2025-01-20'}
        ]
        caso_vigilancia.acciones_implementadas = acciones
        caso_vigilancia.save()
        caso_vigilancia.refresh_from_db()
        assert len(caso_vigilancia.acciones_implementadas) == 2

    def test_caso_registrar_seguimiento(self, caso_vigilancia, user_id):
        """Test método registrar_seguimiento"""
        caso_vigilancia.seguimientos = []
        caso_vigilancia.save()

        descripcion = 'Evaluación inicial - mejora leve'
        caso_vigilancia.registrar_seguimiento(descripcion, user_id)

        caso_vigilancia.refresh_from_db()
        assert len(caso_vigilancia.seguimientos) == 1
        assert caso_vigilancia.seguimientos[0]['descripcion'] == descripcion
        assert caso_vigilancia.fecha_ultimo_seguimiento == date.today()

    def test_caso_registrar_multiples_seguimientos(self, caso_vigilancia, user_id):
        """Test registrar múltiples seguimientos"""
        caso_vigilancia.registrar_seguimiento('Seguimiento 1', user_id)
        caso_vigilancia.registrar_seguimiento('Seguimiento 2', user_id)
        caso_vigilancia.registrar_seguimiento('Seguimiento 3', user_id)

        caso_vigilancia.refresh_from_db()
        assert len(caso_vigilancia.seguimientos) == 3

    def test_caso_cerrar_caso(self, caso_vigilancia, user_id):
        """Test método cerrar_caso"""
        motivo = 'Resolución completa del caso'
        resultado = 'Colaborador sin síntomas, retoma actividades normales'

        caso_vigilancia.cerrar_caso(motivo, resultado, user_id)

        caso_vigilancia.refresh_from_db()
        assert caso_vigilancia.estado == 'CERRADO'
        assert caso_vigilancia.fecha_cierre == date.today()
        assert caso_vigilancia.motivo_cierre == motivo
        assert caso_vigilancia.resultado_final == resultado

    def test_caso_relacion_programa(self, caso_vigilancia, programa_vigilancia):
        """Test relación con ProgramaVigilancia"""
        assert caso_vigilancia.programa == programa_vigilancia
        assert caso_vigilancia in programa_vigilancia.casos.all()


# ============================================================================
# TESTS PARA DiagnosticoOcupacional
# ============================================================================

@pytest.mark.django_db
class TestDiagnosticoOcupacional:
    """Tests para el modelo DiagnosticoOcupacional"""

    def test_create_diagnostico_ocupacional(self):
        """Test crear diagnóstico ocupacional válido"""
        diagnostico = DiagnosticoOcupacionalFactory(
            codigo_cie10='M54.5',
            nombre='Lumbago no especificado',
            origen='OCUPACIONAL'
        )
        assert diagnostico.pk is not None
        assert diagnostico.codigo_cie10 == 'M54.5'
        assert diagnostico.is_active is True

    def test_diagnostico_str(self, diagnostico_ocupacional):
        """Test método __str__"""
        expected = f"{diagnostico_ocupacional.codigo_cie10} - {diagnostico_ocupacional.nombre}"
        assert str(diagnostico_ocupacional) == expected

    def test_diagnostico_codigo_unique(self):
        """Test código CIE-10 único"""
        codigo = 'M54.5'
        DiagnosticoOcupacionalFactory(codigo_cie10=codigo)
        with pytest.raises(IntegrityError):
            DiagnosticoOcupacionalFactory(codigo_cie10=codigo)

    def test_diagnostico_origen_choices(self, diagnostico_ocupacional):
        """Test validación de choices para origen"""
        for origen in ['OCUPACIONAL', 'COMUN', 'AMBOS']:
            diagnostico_ocupacional.origen = origen
            diagnostico_ocupacional.save()
            assert diagnostico_ocupacional.origen == origen

    def test_diagnostico_requiere_vigilancia(self, diagnostico_ocupacional):
        """Test configuración requiere vigilancia"""
        diagnostico_ocupacional.requiere_vigilancia = True
        diagnostico_ocupacional.programa_vigilancia_sugerido = 'OSTEOMUSCULAR'
        diagnostico_ocupacional.save()
        assert diagnostico_ocupacional.requiere_vigilancia is True
        assert diagnostico_ocupacional.programa_vigilancia_sugerido == 'OSTEOMUSCULAR'

    def test_diagnostico_requiere_reportes(self, diagnostico_ocupacional):
        """Test configuración de reportes requeridos"""
        diagnostico_ocupacional.requiere_reporte_arl = True
        diagnostico_ocupacional.requiere_reporte_secretaria = True
        diagnostico_ocupacional.save()
        assert diagnostico_ocupacional.requiere_reporte_arl is True
        assert diagnostico_ocupacional.requiere_reporte_secretaria is True


# ============================================================================
# TESTS PARA EstadisticaMedica
# ============================================================================

@pytest.mark.django_db
class TestEstadisticaMedica:
    """Tests para el modelo EstadisticaMedica"""

    def test_create_estadistica_medica(self, empresa, anio_actual, mes_actual):
        """Test crear estadística médica válida"""
        estadistica = EstadisticaMedicaFactory(
            empresa_id=empresa,
            anio=anio_actual,
            mes=mes_actual
        )
        assert estadistica.pk is not None
        assert estadistica.empresa_id == empresa
        assert estadistica.anio == anio_actual

    def test_estadistica_str(self, estadistica_medica):
        """Test método __str__"""
        expected = f"Estadística {estadistica_medica.anio}-{estadistica_medica.mes:02d}"
        assert str(estadistica_medica) == expected

    def test_estadistica_unique_together(self, empresa, anio_actual, mes_actual):
        """Test unique constraint empresa-año-mes"""
        EstadisticaMedicaFactory(
            empresa_id=empresa,
            anio=anio_actual,
            mes=mes_actual
        )
        with pytest.raises(IntegrityError):
            EstadisticaMedicaFactory(
                empresa_id=empresa,
                anio=anio_actual,
                mes=mes_actual
            )

    def test_estadistica_calcular_indicadores(self, estadistica_medica):
        """Test método calcular_indicadores"""
        estadistica_medica.total_colaboradores = 100
        estadistica_medica.aptos = 75
        estadistica_medica.examenes_realizados = 30
        estadistica_medica.save()

        estadistica_medica.calcular_indicadores()

        estadistica_medica.refresh_from_db()
        assert estadistica_medica.porcentaje_aptitud == Decimal('75.00')
        assert estadistica_medica.porcentaje_cobertura_examenes == Decimal('30.00')

    def test_estadistica_calcular_indicadores_sin_colaboradores(self):
        """Test cálculo de indicadores sin colaboradores"""
        estadistica = EstadisticaMedicaFactory(total_colaboradores=0)
        estadistica.calcular_indicadores()
        # No debe lanzar excepción, indicadores quedan en 0

    def test_estadistica_json_top_diagnosticos(self, estadistica_medica):
        """Test campo JSON de top diagnósticos"""
        top = [
            {'codigo': 'M54.5', 'nombre': 'Lumbago', 'cantidad': 15},
            {'codigo': 'H52.4', 'nombre': 'Presbicia', 'cantidad': 12},
            {'codigo': 'I10', 'nombre': 'Hipertensión', 'cantidad': 8}
        ]
        estadistica_medica.top_diagnosticos = top
        estadistica_medica.save()
        estadistica_medica.refresh_from_db()
        assert len(estadistica_medica.top_diagnosticos) == 3
        assert estadistica_medica.top_diagnosticos[0]['cantidad'] == 15

    def test_estadistica_contadores_examenes(self, estadistica_medica):
        """Test contadores de exámenes por tipo"""
        estadistica_medica.examenes_ingreso = 10
        estadistica_medica.examenes_periodicos = 12
        estadistica_medica.examenes_egreso = 3
        estadistica_medica.examenes_realizados = 25
        estadistica_medica.save()

        total = (
            estadistica_medica.examenes_ingreso +
            estadistica_medica.examenes_periodicos +
            estadistica_medica.examenes_egreso
        )
        assert total == estadistica_medica.examenes_realizados

    def test_estadistica_contadores_aptitud(self, estadistica_medica):
        """Test contadores de conceptos de aptitud"""
        estadistica_medica.aptos = 20
        estadistica_medica.aptos_con_restricciones = 4
        estadistica_medica.no_aptos_temporal = 1
        estadistica_medica.no_aptos_permanente = 0
        estadistica_medica.save()

        total_evaluados = (
            estadistica_medica.aptos +
            estadistica_medica.aptos_con_restricciones +
            estadistica_medica.no_aptos_temporal +
            estadistica_medica.no_aptos_permanente
        )
        assert total_evaluados == 25

    def test_estadistica_contadores_restricciones(self, estadistica_medica):
        """Test contadores de restricciones"""
        estadistica_medica.restricciones_activas = 10
        estadistica_medica.restricciones_nuevas = 3
        estadistica_medica.restricciones_levantadas = 2
        estadistica_medica.save()
        assert estadistica_medica.restricciones_activas == 10

    def test_estadistica_contadores_vigilancia(self, estadistica_medica):
        """Test contadores de vigilancia epidemiológica"""
        estadistica_medica.casos_vigilancia_activos = 15
        estadistica_medica.casos_nuevos = 5
        estadistica_medica.casos_cerrados = 3
        estadistica_medica.save()
        assert estadistica_medica.casos_vigilancia_activos == 15
