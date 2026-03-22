"""
Tests de modelos para Estructura de Cargos - Mi Equipo.

Cobertura:
- Profesiograma: creacion, __str__, validaciones, propiedades
- MatrizCompetencia: creacion, __str__, unicidad, propiedades
- RequisitoEspecial: creacion, __str__, soft delete
- Vacante: creacion, __str__, propiedades, validaciones

Autor: Sistema de Gestion StrateKaz
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from django.core.exceptions import ValidationError


@pytest.mark.django_db
class TestProfesiogramaModel:
    """Tests para el modelo Profesiograma."""

    def test_crear_profesiograma_basico(self, profesiograma):
        """Debe crear un profesiograma con datos minimos."""
        assert profesiograma.pk is not None
        assert profesiograma.codigo == 'PROF-TEST-001'
        assert profesiograma.nombre == 'Profesiograma Analista'
        assert profesiograma.is_active is True

    def test_str_profesiograma(self, profesiograma):
        """__str__ debe retornar codigo - nombre."""
        expected = 'PROF-TEST-001 - Profesiograma Analista'
        assert str(profesiograma) == expected

    def test_estado_default_borrador(self, empresa, cargo, area, user):
        """El estado por defecto debe ser BORRADOR."""
        from apps.mi_equipo.estructura_cargos.models import Profesiograma

        prof = Profesiograma(
            empresa=empresa,
            cargo=cargo,
            area=area,
            codigo='PROF-TEST-002',
            nombre='Profesiograma Default',
            nivel_educativo_minimo='TECNICO',
            created_by=user,
            updated_by=user,
        )
        assert prof.estado == 'BORRADOR'

    def test_esta_vigente_true(self, profesiograma):
        """esta_vigente debe retornar True para profesiograma VIGENTE con fechas validas."""
        assert profesiograma.esta_vigente is True

    def test_esta_vigente_false_obsoleto(self, profesiograma):
        """esta_vigente debe retornar False si estado no es VIGENTE."""
        profesiograma.estado = 'OBSOLETO'
        assert profesiograma.esta_vigente is False

    def test_esta_vigente_false_fecha_futura(self, profesiograma):
        """esta_vigente debe retornar False si la fecha de inicio es futura."""
        profesiograma.fecha_vigencia_inicio = date.today() + timedelta(days=30)
        assert profesiograma.esta_vigente is False

    def test_esta_vigente_false_fecha_pasada(self, profesiograma):
        """esta_vigente debe retornar False si la fecha fin ya paso."""
        profesiograma.fecha_vigencia_fin = date.today() - timedelta(days=1)
        assert profesiograma.esta_vigente is False

    def test_soft_delete(self, profesiograma):
        """soft_delete() debe marcar is_active=False sin borrar de la BD."""
        pk = profesiograma.pk
        profesiograma.soft_delete()
        profesiograma.refresh_from_db()
        assert profesiograma.is_active is False
        assert profesiograma.pk == pk

    def test_codigo_unico(self, profesiograma, empresa, cargo, area, user):
        """No debe permitir codigo duplicado para la misma empresa."""
        from apps.mi_equipo.estructura_cargos.models import Profesiograma
        from django.db import IntegrityError

        with pytest.raises(IntegrityError):
            Profesiograma.objects.create(
                empresa=empresa,
                cargo=cargo,
                area=area,
                codigo='PROF-TEST-001',
                nombre='Duplicado',
                nivel_educativo_minimo='TECNICO',
                created_by=user,
                updated_by=user,
            )

    def test_validacion_fecha_vigencia_invertida(self, profesiograma):
        """clean() debe fallar si fecha_vigencia_fin < fecha_vigencia_inicio."""
        profesiograma.fecha_vigencia_inicio = date(2025, 6, 1)
        profesiograma.fecha_vigencia_fin = date(2025, 1, 1)
        with pytest.raises(ValidationError) as exc_info:
            profesiograma.clean()
        assert 'fecha_vigencia_fin' in exc_info.value.message_dict

    def test_validacion_aprobado_sin_fecha(self, profesiograma):
        """clean() debe fallar si estado=APROBADO sin fecha_aprobacion."""
        profesiograma.estado = 'APROBADO'
        profesiograma.fecha_aprobacion = None
        with pytest.raises(ValidationError) as exc_info:
            profesiograma.clean()
        assert 'fecha_aprobacion' in exc_info.value.message_dict

    def test_experiencia_default(self, empresa, cargo, area, user):
        """experiencia_minima default debe ser SIN_EXPERIENCIA."""
        from apps.mi_equipo.estructura_cargos.models import Profesiograma

        prof = Profesiograma(
            empresa=empresa,
            cargo=cargo,
            area=area,
            codigo='PROF-EXP-DEFAULT',
            nombre='Test Exp Default',
            nivel_educativo_minimo='BACHILLER',
            created_by=user,
            updated_by=user,
        )
        assert prof.experiencia_minima == 'SIN_EXPERIENCIA'

    def test_campos_json_default_list(self, profesiograma):
        """Campos JSON deben inicializar como lista vacia."""
        assert profesiograma.areas_conocimiento == []
        assert profesiograma.competencias_tecnicas_resumen == []
        assert profesiograma.examenes_medicos_ingreso == []
        assert profesiograma.factores_riesgo == []
        assert profesiograma.epp_requeridos == []

    def test_total_competencias(self, profesiograma, matriz_competencia):
        """total_competencias debe contar las competencias activas."""
        assert profesiograma.total_competencias == 1


@pytest.mark.django_db
class TestMatrizCompetenciaModel:
    """Tests para el modelo MatrizCompetencia."""

    def test_crear_competencia(self, matriz_competencia):
        """Debe crear una competencia vinculada a un profesiograma."""
        assert matriz_competencia.pk is not None
        assert matriz_competencia.nombre_competencia == 'Excel Avanzado'
        assert matriz_competencia.tipo_competencia == 'TECNICA'

    def test_str_competencia(self, matriz_competencia):
        """__str__ debe incluir nombre, tipo y nivel."""
        result = str(matriz_competencia)
        assert 'Excel Avanzado' in result
        assert 'Avanzado' in result

    def test_es_excluyente_requerida(self, matriz_competencia):
        """es_excluyente debe ser True para criticidad REQUERIDA."""
        assert matriz_competencia.es_excluyente is True

    def test_es_excluyente_deseable(self, matriz_competencia):
        """es_excluyente debe ser False para criticidad DESEABLE."""
        matriz_competencia.criticidad = 'DESEABLE'
        assert matriz_competencia.es_excluyente is False

    def test_soft_delete(self, matriz_competencia):
        """soft_delete() debe marcar is_active=False."""
        matriz_competencia.soft_delete()
        matriz_competencia.refresh_from_db()
        assert matriz_competencia.is_active is False

    def test_peso_evaluacion_default(self, empresa, profesiograma, user):
        """peso_evaluacion default debe ser 1."""
        from apps.mi_equipo.estructura_cargos.models import MatrizCompetencia

        comp = MatrizCompetencia(
            empresa=empresa,
            profesiograma=profesiograma,
            tipo_competencia='COMPORTAMENTAL',
            nombre_competencia='Trabajo en Equipo',
            nivel_requerido='INTERMEDIO',
            created_by=user,
            updated_by=user,
        )
        assert comp.peso_evaluacion == 1

    def test_unicidad_nombre_por_profesiograma(
        self, matriz_competencia, empresa, profesiograma, user
    ):
        """No debe permitir duplicar nombre_competencia en el mismo profesiograma."""
        from apps.mi_equipo.estructura_cargos.models import MatrizCompetencia
        from django.db import IntegrityError

        with pytest.raises(IntegrityError):
            MatrizCompetencia.objects.create(
                empresa=empresa,
                profesiograma=profesiograma,
                tipo_competencia='SOFTWARE',
                nombre_competencia='Excel Avanzado',
                nivel_requerido='BASICO',
                created_by=user,
                updated_by=user,
            )


@pytest.mark.django_db
class TestRequisitoEspecialModel:
    """Tests para el modelo RequisitoEspecial."""

    def test_crear_requisito(self, empresa, profesiograma, user):
        """Debe crear un requisito especial."""
        from apps.mi_equipo.estructura_cargos.models import RequisitoEspecial

        requisito = RequisitoEspecial.objects.create(
            empresa=empresa,
            profesiograma=profesiograma,
            tipo_requisito='CERTIFICACION',
            nombre_requisito='Certificacion ISO 9001',
            descripcion='Auditor interno ISO 9001:2015',
            criticidad='OBLIGATORIO',
            created_by=user,
            updated_by=user,
        )
        assert requisito.pk is not None
        assert requisito.es_obligatorio_legal is True

    def test_str_requisito(self, empresa, profesiograma, user):
        """__str__ debe incluir nombre del requisito."""
        from apps.mi_equipo.estructura_cargos.models import RequisitoEspecial

        requisito = RequisitoEspecial.objects.create(
            empresa=empresa,
            profesiograma=profesiograma,
            tipo_requisito='LICENCIA',
            nombre_requisito='Licencia B2',
            descripcion='Licencia de conduccion categoria B2',
            created_by=user,
            updated_by=user,
        )
        assert 'Licencia B2' in str(requisito)

    def test_soft_delete_requisito(self, empresa, profesiograma, user):
        """soft_delete() debe marcar is_active=False."""
        from apps.mi_equipo.estructura_cargos.models import RequisitoEspecial

        requisito = RequisitoEspecial.objects.create(
            empresa=empresa,
            profesiograma=profesiograma,
            tipo_requisito='EXAMEN_MEDICO',
            nombre_requisito='Audiometria',
            descripcion='Examen de audiometria ocupacional',
            created_by=user,
            updated_by=user,
        )
        requisito.soft_delete()
        requisito.refresh_from_db()
        assert requisito.is_active is False

    def test_is_active_default_true(self, empresa, profesiograma, user):
        """is_active debe ser True por defecto."""
        from apps.mi_equipo.estructura_cargos.models import RequisitoEspecial

        requisito = RequisitoEspecial.objects.create(
            empresa=empresa,
            profesiograma=profesiograma,
            tipo_requisito='CERTIFICACION',
            nombre_requisito='PMP',
            descripcion='Project Management Professional',
            created_by=user,
            updated_by=user,
        )
        assert requisito.is_active is True


@pytest.mark.django_db
class TestVacanteModel:
    """Tests para el modelo Vacante (estructura_cargos)."""

    def test_crear_vacante(self, empresa, cargo, area, profesiograma, user):
        """Debe crear una vacante vinculada a profesiograma."""
        from apps.mi_equipo.estructura_cargos.models import Vacante

        vacante = Vacante.objects.create(
            empresa=empresa,
            cargo=cargo,
            area=area,
            profesiograma=profesiograma,
            codigo='VAC-TEST-001',
            titulo_vacante='Analista de Calidad',
            estado='APROBADA',
            prioridad='ALTA',
            cantidad_posiciones=2,
            motivo_vacante='NUEVA_POSICION',
            created_by=user,
            updated_by=user,
        )
        assert vacante.pk is not None
        assert vacante.cantidad_posiciones == 2

    def test_str_vacante(self, empresa, cargo, area, profesiograma, user):
        """__str__ debe incluir titulo de la vacante."""
        from apps.mi_equipo.estructura_cargos.models import Vacante

        vacante = Vacante.objects.create(
            empresa=empresa,
            cargo=cargo,
            area=area,
            profesiograma=profesiograma,
            codigo='VAC-TEST-002',
            titulo_vacante='Operario de Planta',
            estado='APROBADA',
            cantidad_posiciones=1,
            motivo_vacante='REEMPLAZO_RENUNCIA',
            created_by=user,
            updated_by=user,
        )
        result = str(vacante)
        assert 'Operario de Planta' in result or 'VAC-TEST-002' in result

    def test_soft_delete_vacante(self, empresa, cargo, area, profesiograma, user):
        """soft_delete() debe marcar is_active=False."""
        from apps.mi_equipo.estructura_cargos.models import Vacante

        vacante = Vacante.objects.create(
            empresa=empresa,
            cargo=cargo,
            area=area,
            profesiograma=profesiograma,
            codigo='VAC-TEST-003',
            titulo_vacante='Vacante Temporal',
            estado='BORRADOR',
            cantidad_posiciones=1,
            motivo_vacante='PROYECTO_TEMPORAL',
            created_by=user,
            updated_by=user,
        )
        vacante.soft_delete()
        vacante.refresh_from_db()
        assert vacante.is_active is False

    def test_posiciones_cubiertas_default_cero(self, empresa, cargo, area, profesiograma, user):
        """posiciones_cubiertas debe iniciar en 0."""
        from apps.mi_equipo.estructura_cargos.models import Vacante

        vacante = Vacante.objects.create(
            empresa=empresa,
            cargo=cargo,
            area=area,
            profesiograma=profesiograma,
            codigo='VAC-TEST-004',
            titulo_vacante='Vacante Default',
            estado='BORRADOR',
            cantidad_posiciones=3,
            motivo_vacante='NUEVA_POSICION',
            created_by=user,
            updated_by=user,
        )
        assert vacante.posiciones_cubiertas == 0
