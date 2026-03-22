"""
Tests de modelos para Colaboradores - Mi Equipo.

Cobertura:
- Colaborador: creacion, __str__, propiedades, validaciones, soft delete
- HojaVida: creacion, __str__, propiedades
- InfoPersonal: creacion, __str__, propiedades
- HistorialLaboral: creacion, __str__, propiedades, validaciones

Autor: Sistema de Gestion StrateKaz
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.utils import timezone


@pytest.mark.django_db
class TestColaboradorModel:
    """Tests para el modelo Colaborador."""

    def test_crear_colaborador_basico(self, colaborador):
        """Debe crear un colaborador con datos minimos."""
        assert colaborador.pk is not None
        assert colaborador.primer_nombre == 'Juan'
        assert colaborador.is_active is True

    def test_str_colaborador(self, colaborador):
        """__str__ debe retornar nombre completo - identificacion."""
        result = str(colaborador)
        assert '1234567890' in result
        assert 'Juan' in result
        assert 'Perez' in result

    def test_get_nombre_completo(self, colaborador):
        """get_nombre_completo() debe incluir todos los nombres y apellidos."""
        nombre = colaborador.get_nombre_completo()
        assert 'Juan' in nombre
        assert 'Carlos' in nombre
        assert 'Perez' in nombre
        assert 'Lopez' in nombre

    def test_get_nombre_corto(self, colaborador):
        """get_nombre_corto() debe retornar solo primer nombre + primer apellido."""
        nombre = colaborador.get_nombre_corto()
        assert nombre == 'Juan Perez'

    def test_esta_activo_true(self, colaborador):
        """esta_activo debe ser True para colaborador activo."""
        assert colaborador.esta_activo is True

    def test_esta_activo_false_retirado(self, colaborador_retirado):
        """esta_activo debe ser False para colaborador retirado."""
        assert colaborador_retirado.esta_activo is False

    def test_antiguedad_dias(self, colaborador):
        """antiguedad_dias debe calcular correctamente."""
        dias = colaborador.antiguedad_dias
        assert isinstance(dias, int)
        assert dias > 0

    def test_antiguedad_anios(self, colaborador):
        """antiguedad_anios debe calcular correctamente."""
        anios = colaborador.antiguedad_anios
        assert isinstance(anios, float)
        assert anios > 0

    def test_tiene_contrato_vigente_indefinido(self, colaborador):
        """tiene_contrato_vigente debe ser True para indefinido activo."""
        assert colaborador.tiene_contrato_vigente is True

    def test_tiene_contrato_vigente_fijo_vencido(self, colaborador):
        """tiene_contrato_vigente debe ser False si fecha_fin_contrato paso."""
        colaborador.tipo_contrato = 'fijo'
        colaborador.fecha_fin_contrato = date.today() - timedelta(days=1)
        assert colaborador.tiene_contrato_vigente is False

    def test_soft_delete(self, colaborador):
        """soft_delete() debe marcar is_active=False sin borrar de la BD."""
        pk = colaborador.pk
        colaborador.soft_delete()
        colaborador.refresh_from_db()
        assert colaborador.is_active is False
        assert colaborador.pk == pk

    def test_numero_identificacion_unico(self, colaborador, empresa, cargo, area, user):
        """No debe permitir numero_identificacion duplicado."""
        from apps.mi_equipo.colaboradores.models import Colaborador
        from django.db import IntegrityError

        with pytest.raises(IntegrityError):
            Colaborador.objects.create(
                empresa=empresa,
                numero_identificacion='1234567890',
                tipo_documento='CC',
                primer_nombre='Otro',
                primer_apellido='Duplicado',
                cargo=cargo,
                area=area,
                fecha_ingreso=date.today(),
                tipo_contrato='indefinido',
                salario=Decimal('2000000.00'),
                created_by=user,
                updated_by=user,
            )

    def test_estado_default_activo(self, empresa, cargo, area, user):
        """El estado por defecto debe ser 'activo'."""
        from apps.mi_equipo.colaboradores.models import Colaborador

        colab = Colaborador(
            empresa=empresa,
            numero_identificacion='5555555555',
            primer_nombre='Default',
            primer_apellido='Estado',
            cargo=cargo,
            area=area,
            fecha_ingreso=date.today(),
            tipo_contrato='indefinido',
            salario=Decimal('2000000.00'),
            created_by=user,
            updated_by=user,
        )
        assert colab.estado == 'activo'

    def test_tipo_documento_default_cc(self, empresa, cargo, area, user):
        """El tipo_documento por defecto debe ser 'CC'."""
        from apps.mi_equipo.colaboradores.models import Colaborador

        colab = Colaborador(
            empresa=empresa,
            numero_identificacion='6666666666',
            primer_nombre='Default',
            primer_apellido='Doc',
            cargo=cargo,
            area=area,
            fecha_ingreso=date.today(),
            tipo_contrato='indefinido',
            salario=Decimal('2000000.00'),
            created_by=user,
            updated_by=user,
        )
        assert colab.tipo_documento == 'CC'

    def test_horas_semanales_default(self, colaborador):
        """horas_semanales debe ser 48 por defecto."""
        assert colaborador.horas_semanales == 48

    def test_auxilio_transporte_default(self, colaborador):
        """auxilio_transporte debe ser True por defecto."""
        assert colaborador.auxilio_transporte is True

    def test_validacion_fecha_retiro_anterior_ingreso(self, colaborador):
        """clean() debe fallar si fecha_retiro < fecha_ingreso."""
        colaborador.fecha_retiro = date(2023, 1, 1)
        with pytest.raises(ValidationError) as exc_info:
            colaborador.clean()
        assert 'fecha_retiro' in exc_info.value.message_dict

    def test_validacion_retirado_sin_fecha(self, colaborador):
        """clean() debe fallar si estado=retirado sin fecha_retiro."""
        colaborador.estado = 'retirado'
        colaborador.fecha_retiro = None
        with pytest.raises(ValidationError) as exc_info:
            colaborador.clean()
        assert 'fecha_retiro' in exc_info.value.message_dict

    def test_validacion_fijo_sin_fecha_fin(self, colaborador):
        """clean() debe fallar si tipo_contrato=fijo sin fecha_fin_contrato."""
        colaborador.tipo_contrato = 'fijo'
        colaborador.fecha_fin_contrato = None
        with pytest.raises(ValidationError) as exc_info:
            colaborador.clean()
        assert 'fecha_fin_contrato' in exc_info.value.message_dict

    def test_segundo_nombre_opcional(self, empresa, cargo, area, user):
        """segundo_nombre debe ser opcional (blank)."""
        from apps.mi_equipo.colaboradores.models import Colaborador

        colab = Colaborador.objects.create(
            empresa=empresa,
            numero_identificacion='7777777777',
            primer_nombre='Solo',
            primer_apellido='UnNombre',
            cargo=cargo,
            area=area,
            fecha_ingreso=date.today(),
            tipo_contrato='indefinido',
            salario=Decimal('2000000.00'),
            created_by=user,
            updated_by=user,
        )
        assert colab.segundo_nombre == ''
        assert colab.get_nombre_corto() == 'Solo UnNombre'


@pytest.mark.django_db
class TestHojaVidaModel:
    """Tests para el modelo HojaVida."""

    def test_crear_hoja_vida(self, colaborador, empresa, user):
        """Debe crear una hoja de vida vinculada a un colaborador."""
        from apps.mi_equipo.colaboradores.models import HojaVida

        hv = HojaVida.objects.create(
            colaborador=colaborador,
            empresa=empresa,
            nivel_estudio_maximo='profesional',
            titulo_academico='Ingeniero Industrial',
            institucion='Universidad Nacional',
            created_by=user,
            updated_by=user,
        )
        assert hv.pk is not None
        assert hv.titulo_academico == 'Ingeniero Industrial'

    def test_str_hoja_vida(self, colaborador, empresa, user):
        """__str__ debe incluir nombre del colaborador."""
        from apps.mi_equipo.colaboradores.models import HojaVida

        hv = HojaVida.objects.create(
            colaborador=colaborador,
            empresa=empresa,
            created_by=user,
            updated_by=user,
        )
        assert 'Juan' in str(hv)

    def test_tiene_formacion_completa_true(self, colaborador, empresa, user):
        """tiene_formacion_completa debe ser True con datos completos."""
        from apps.mi_equipo.colaboradores.models import HojaVida

        hv = HojaVida.objects.create(
            colaborador=colaborador,
            empresa=empresa,
            nivel_estudio_maximo='profesional',
            titulo_academico='Administrador',
            institucion='EAFIT',
            created_by=user,
            updated_by=user,
        )
        assert hv.tiene_formacion_completa is True

    def test_tiene_formacion_completa_false(self, colaborador, empresa, user):
        """tiene_formacion_completa debe ser False sin datos academicos."""
        from apps.mi_equipo.colaboradores.models import HojaVida

        hv = HojaVida.objects.create(
            colaborador=colaborador,
            empresa=empresa,
            created_by=user,
            updated_by=user,
        )
        assert hv.tiene_formacion_completa is False

    def test_total_anios_experiencia(self, colaborador, empresa, user):
        """total_anios_experiencia debe calcular correctamente."""
        from apps.mi_equipo.colaboradores.models import HojaVida

        hv = HojaVida.objects.create(
            colaborador=colaborador,
            empresa=empresa,
            experiencia_previa=[
                {'empresa': 'Empresa A', 'meses_duracion': 24},
                {'empresa': 'Empresa B', 'meses_duracion': 36},
            ],
            created_by=user,
            updated_by=user,
        )
        assert hv.total_anios_experiencia == 5.0

    def test_campos_json_default_list(self, colaborador, empresa, user):
        """Campos JSON deben inicializar como lista vacia."""
        from apps.mi_equipo.colaboradores.models import HojaVida

        hv = HojaVida.objects.create(
            colaborador=colaborador,
            empresa=empresa,
            created_by=user,
            updated_by=user,
        )
        assert hv.estudios_adicionales == []
        assert hv.certificaciones == []
        assert hv.idiomas == []
        assert hv.habilidades == []


@pytest.mark.django_db
class TestInfoPersonalModel:
    """Tests para el modelo InfoPersonal."""

    def test_crear_info_personal(self, colaborador, empresa, user):
        """Debe crear informacion personal vinculada a un colaborador."""
        from apps.mi_equipo.colaboradores.models import InfoPersonal

        info = InfoPersonal.objects.create(
            colaborador=colaborador,
            empresa=empresa,
            fecha_nacimiento=date(1990, 5, 15),
            genero='M',
            estado_civil='soltero',
            tipo_sangre='O+',
            eps='Sura',
            created_by=user,
            updated_by=user,
        )
        assert info.pk is not None
        assert info.tipo_sangre == 'O+'

    def test_str_info_personal(self, colaborador, empresa, user):
        """__str__ debe incluir nombre del colaborador."""
        from apps.mi_equipo.colaboradores.models import InfoPersonal

        info = InfoPersonal.objects.create(
            colaborador=colaborador,
            empresa=empresa,
            created_by=user,
            updated_by=user,
        )
        assert 'Juan' in str(info)

    def test_edad_calcula_correctamente(self, colaborador, empresa, user):
        """edad debe calcular la edad correctamente."""
        from apps.mi_equipo.colaboradores.models import InfoPersonal

        info = InfoPersonal.objects.create(
            colaborador=colaborador,
            empresa=empresa,
            fecha_nacimiento=date(1990, 1, 1),
            created_by=user,
            updated_by=user,
        )
        edad = info.edad
        assert edad is not None
        assert edad >= 35

    def test_edad_none_sin_fecha_nacimiento(self, colaborador, empresa, user):
        """edad debe retornar None si no hay fecha_nacimiento."""
        from apps.mi_equipo.colaboradores.models import InfoPersonal

        info = InfoPersonal.objects.create(
            colaborador=colaborador,
            empresa=empresa,
            created_by=user,
            updated_by=user,
        )
        assert info.edad is None

    def test_tiene_datos_bancarios_true(self, colaborador, empresa, user):
        """tiene_datos_bancarios debe ser True con datos completos."""
        from apps.mi_equipo.colaboradores.models import InfoPersonal

        info = InfoPersonal.objects.create(
            colaborador=colaborador,
            empresa=empresa,
            banco='bancolombia',
            tipo_cuenta='ahorros',
            numero_cuenta='12345678901',
            created_by=user,
            updated_by=user,
        )
        assert info.tiene_datos_bancarios is True

    def test_tiene_datos_bancarios_false(self, colaborador, empresa, user):
        """tiene_datos_bancarios debe ser False sin datos bancarios."""
        from apps.mi_equipo.colaboradores.models import InfoPersonal

        info = InfoPersonal.objects.create(
            colaborador=colaborador,
            empresa=empresa,
            created_by=user,
            updated_by=user,
        )
        assert info.tiene_datos_bancarios is False

    def test_tiene_contacto_emergencia(self, colaborador, empresa, user):
        """tiene_contacto_emergencia debe validar nombre y telefono."""
        from apps.mi_equipo.colaboradores.models import InfoPersonal

        info = InfoPersonal.objects.create(
            colaborador=colaborador,
            empresa=empresa,
            nombre_contacto_emergencia='Ana Lopez',
            telefono_contacto_emergencia='3009876543',
            created_by=user,
            updated_by=user,
        )
        assert info.tiene_contacto_emergencia is True

    def test_numero_hijos_default(self, colaborador, empresa, user):
        """numero_hijos debe ser 0 por defecto."""
        from apps.mi_equipo.colaboradores.models import InfoPersonal

        info = InfoPersonal.objects.create(
            colaborador=colaborador,
            empresa=empresa,
            created_by=user,
            updated_by=user,
        )
        assert info.numero_hijos == 0
        assert info.personas_a_cargo == 0


@pytest.mark.django_db
class TestHistorialLaboralModel:
    """Tests para el modelo HistorialLaboral."""

    def test_crear_historial_contratacion(self, colaborador, empresa, cargo, area, user):
        """Debe crear un movimiento de contratacion."""
        from apps.mi_equipo.colaboradores.models import HistorialLaboral

        historial = HistorialLaboral.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            tipo_movimiento='contratacion',
            fecha_movimiento=date(2024, 1, 15),
            cargo_nuevo=cargo,
            area_nueva=area,
            salario_nuevo=Decimal('3500000.00'),
            motivo='Contratacion inicial',
            created_by=user,
            updated_by=user,
        )
        assert historial.pk is not None
        assert historial.tipo_movimiento == 'contratacion'

    def test_str_historial(self, colaborador, empresa, user):
        """__str__ debe incluir nombre corto y tipo de movimiento."""
        from apps.mi_equipo.colaboradores.models import HistorialLaboral

        historial = HistorialLaboral.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            tipo_movimiento='contratacion',
            fecha_movimiento=date(2024, 1, 15),
            motivo='Test',
            created_by=user,
            updated_by=user,
        )
        result = str(historial)
        assert 'Juan' in result

    def test_es_ascenso(self, colaborador, empresa, cargo, cargo_gerente, area, user):
        """es_ascenso debe ser True para tipo_movimiento=ascenso."""
        from apps.mi_equipo.colaboradores.models import HistorialLaboral

        historial = HistorialLaboral.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            tipo_movimiento='ascenso',
            fecha_movimiento=date.today(),
            cargo_anterior=cargo,
            cargo_nuevo=cargo_gerente,
            motivo='Promocion',
            created_by=user,
            updated_by=user,
        )
        assert historial.es_ascenso is True
        assert historial.es_retiro is False

    def test_es_retiro(self, colaborador, empresa, user):
        """es_retiro debe ser True para tipo_movimiento=retiro."""
        from apps.mi_equipo.colaboradores.models import HistorialLaboral

        historial = HistorialLaboral.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            tipo_movimiento='retiro',
            fecha_movimiento=date.today(),
            motivo='Renuncia voluntaria',
            created_by=user,
            updated_by=user,
        )
        assert historial.es_retiro is True
        assert historial.es_ascenso is False

    def test_incremento_salarial(self, colaborador, empresa, user):
        """incremento_salarial debe calcular valor y porcentaje."""
        from apps.mi_equipo.colaboradores.models import HistorialLaboral

        historial = HistorialLaboral.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            tipo_movimiento='cambio_salario',
            fecha_movimiento=date.today(),
            salario_anterior=Decimal('3000000.00'),
            salario_nuevo=Decimal('3300000.00'),
            motivo='Aumento anual',
            created_by=user,
            updated_by=user,
        )
        inc = historial.incremento_salarial
        assert inc is not None
        assert inc['valor'] == Decimal('300000.00')
        assert inc['porcentaje'] == 10.0

    def test_incremento_salarial_none(self, colaborador, empresa, user):
        """incremento_salarial debe retornar None si no hay salarios."""
        from apps.mi_equipo.colaboradores.models import HistorialLaboral

        historial = HistorialLaboral.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            tipo_movimiento='contratacion',
            fecha_movimiento=date.today(),
            motivo='Test',
            created_by=user,
            updated_by=user,
        )
        assert historial.incremento_salarial is None

    def test_validacion_ascenso_sin_cargos(self, colaborador, empresa, user):
        """clean() debe fallar para ascenso sin cargo anterior y nuevo."""
        from apps.mi_equipo.colaboradores.models import HistorialLaboral

        historial = HistorialLaboral(
            empresa=empresa,
            colaborador=colaborador,
            tipo_movimiento='ascenso',
            fecha_movimiento=date.today(),
            motivo='Ascenso sin cargos',
            created_by=user,
            updated_by=user,
        )
        with pytest.raises(ValidationError) as exc_info:
            historial.clean()
        assert 'tipo_movimiento' in exc_info.value.message_dict

    def test_validacion_traslado_sin_areas(self, colaborador, empresa, user):
        """clean() debe fallar para traslado sin area anterior y nueva."""
        from apps.mi_equipo.colaboradores.models import HistorialLaboral

        historial = HistorialLaboral(
            empresa=empresa,
            colaborador=colaborador,
            tipo_movimiento='traslado',
            fecha_movimiento=date.today(),
            motivo='Traslado sin areas',
            created_by=user,
            updated_by=user,
        )
        with pytest.raises(ValidationError) as exc_info:
            historial.clean()
        assert 'tipo_movimiento' in exc_info.value.message_dict

    def test_validacion_cambio_salario_sin_valores(self, colaborador, empresa, user):
        """clean() debe fallar para cambio_salario sin salarios."""
        from apps.mi_equipo.colaboradores.models import HistorialLaboral

        historial = HistorialLaboral(
            empresa=empresa,
            colaborador=colaborador,
            tipo_movimiento='cambio_salario',
            fecha_movimiento=date.today(),
            motivo='Cambio sin valores',
            created_by=user,
            updated_by=user,
        )
        with pytest.raises(ValidationError) as exc_info:
            historial.clean()
        assert 'tipo_movimiento' in exc_info.value.message_dict

    def test_soft_delete(self, colaborador, empresa, user):
        """soft_delete() debe marcar is_active=False."""
        from apps.mi_equipo.colaboradores.models import HistorialLaboral

        historial = HistorialLaboral.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            tipo_movimiento='contratacion',
            fecha_movimiento=date.today(),
            motivo='Test soft delete',
            created_by=user,
            updated_by=user,
        )
        historial.soft_delete()
        historial.refresh_from_db()
        assert historial.is_active is False
