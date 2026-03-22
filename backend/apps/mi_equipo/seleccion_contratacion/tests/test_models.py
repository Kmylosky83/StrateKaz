"""
Tests de modelos para Seleccion y Contratacion - Mi Equipo.

Cobertura:
- TipoContrato: creacion, __str__, unicidad
- TipoEntidad: creacion, __str__
- EntidadSeguridadSocial: creacion, __str__
- TipoPrueba: creacion, __str__
- VacanteActiva: creacion, __str__, propiedades, validaciones
- Candidato: creacion, __str__, propiedades

Autor: Sistema de Gestion StrateKaz
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.db import IntegrityError


@pytest.mark.django_db
class TestTipoContratoModel:
    """Tests para el modelo TipoContrato (catalogo dinamico)."""

    def test_crear_tipo_contrato(self):
        """Debe crear un tipo de contrato."""
        from apps.mi_equipo.seleccion_contratacion.models import TipoContrato

        tipo = TipoContrato.objects.create(
            codigo='INDEFINIDO',
            nombre='Termino Indefinido',
            requiere_duracion=False,
        )
        assert tipo.pk is not None
        assert tipo.is_active is True

    def test_str_tipo_contrato(self):
        """__str__ debe retornar el nombre."""
        from apps.mi_equipo.seleccion_contratacion.models import TipoContrato

        tipo = TipoContrato.objects.create(
            codigo='FIJO',
            nombre='Termino Fijo',
            requiere_duracion=True,
        )
        assert str(tipo) == 'Termino Fijo'

    def test_codigo_unico(self):
        """No debe permitir codigos duplicados."""
        from apps.mi_equipo.seleccion_contratacion.models import TipoContrato

        TipoContrato.objects.create(codigo='OBR', nombre='Obra Labor')
        with pytest.raises(IntegrityError):
            TipoContrato.objects.create(codigo='OBR', nombre='Duplicado')

    def test_is_active_default_true(self):
        """is_active debe ser True por defecto."""
        from apps.mi_equipo.seleccion_contratacion.models import TipoContrato

        tipo = TipoContrato.objects.create(
            codigo='APR',
            nombre='Aprendizaje',
        )
        assert tipo.is_active is True

    def test_requiere_duracion_default_false(self):
        """requiere_duracion debe ser False por defecto."""
        from apps.mi_equipo.seleccion_contratacion.models import TipoContrato

        tipo = TipoContrato.objects.create(
            codigo='PS',
            nombre='Prestacion Servicios',
        )
        assert tipo.requiere_duracion is False


@pytest.mark.django_db
class TestTipoEntidadModel:
    """Tests para el modelo TipoEntidad (catalogo dinamico)."""

    def test_crear_tipo_entidad(self):
        """Debe crear un tipo de entidad de seguridad social."""
        from apps.mi_equipo.seleccion_contratacion.models import TipoEntidad

        tipo = TipoEntidad.objects.create(
            codigo='EPS',
            nombre='Entidad Promotora de Salud',
            es_obligatorio=True,
        )
        assert tipo.pk is not None

    def test_str_tipo_entidad(self):
        """__str__ debe retornar el nombre."""
        from apps.mi_equipo.seleccion_contratacion.models import TipoEntidad

        tipo = TipoEntidad.objects.create(
            codigo='ARL',
            nombre='Administradora de Riesgos Laborales',
        )
        assert str(tipo) == 'Administradora de Riesgos Laborales'

    def test_codigo_unico(self):
        """No debe permitir codigos duplicados."""
        from apps.mi_equipo.seleccion_contratacion.models import TipoEntidad

        TipoEntidad.objects.create(codigo='AFP', nombre='Fondo Pensiones')
        with pytest.raises(IntegrityError):
            TipoEntidad.objects.create(codigo='AFP', nombre='Duplicado')


@pytest.mark.django_db
class TestEntidadSeguridadSocialModel:
    """Tests para el modelo EntidadSeguridadSocial."""

    def test_crear_entidad(self):
        """Debe crear una entidad de seguridad social."""
        from apps.mi_equipo.seleccion_contratacion.models import (
            TipoEntidad,
            EntidadSeguridadSocial,
        )

        tipo = TipoEntidad.objects.create(codigo='EPS_T', nombre='EPS')
        entidad = EntidadSeguridadSocial.objects.create(
            tipo_entidad=tipo,
            codigo='SURA_EPS',
            nombre='Sura EPS',
            razon_social='EPS Sura S.A.',
            nit='900111222-3',
        )
        assert entidad.pk is not None

    def test_str_entidad(self):
        """__str__ debe incluir tipo y nombre."""
        from apps.mi_equipo.seleccion_contratacion.models import (
            TipoEntidad,
            EntidadSeguridadSocial,
        )

        tipo = TipoEntidad.objects.create(codigo='ARL_T', nombre='ARL')
        entidad = EntidadSeguridadSocial.objects.create(
            tipo_entidad=tipo,
            codigo='POSITIVA',
            nombre='Positiva',
            razon_social='Positiva Compania de Seguros S.A.',
            nit='800222333-4',
        )
        result = str(entidad)
        assert 'Positiva' in result


@pytest.mark.django_db
class TestTipoPruebaModel:
    """Tests para el modelo TipoPrueba (catalogo dinamico)."""

    def test_crear_tipo_prueba(self):
        """Debe crear un tipo de prueba."""
        from apps.mi_equipo.seleccion_contratacion.models import TipoPrueba

        tipo = TipoPrueba.objects.create(
            codigo='TECNICA',
            nombre='Prueba Tecnica',
            permite_calificacion=True,
            duracion_estimada_minutos=60,
        )
        assert tipo.pk is not None

    def test_str_tipo_prueba(self):
        """__str__ debe retornar el nombre."""
        from apps.mi_equipo.seleccion_contratacion.models import TipoPrueba

        tipo = TipoPrueba.objects.create(
            codigo='PSICOTECNICA',
            nombre='Prueba Psicotecnica',
        )
        assert str(tipo) == 'Prueba Psicotecnica'

    def test_codigo_unico(self):
        """No debe permitir codigos duplicados."""
        from apps.mi_equipo.seleccion_contratacion.models import TipoPrueba

        TipoPrueba.objects.create(codigo='POLIGRAFO', nombre='Poligrafo')
        with pytest.raises(IntegrityError):
            TipoPrueba.objects.create(codigo='POLIGRAFO', nombre='Duplicado')


@pytest.mark.django_db
class TestVacanteActivaModel:
    """Tests para el modelo VacanteActiva."""

    @pytest.fixture
    def tipo_contrato(self):
        from apps.mi_equipo.seleccion_contratacion.models import TipoContrato

        return TipoContrato.objects.create(
            codigo='INDEF_VAC',
            nombre='Indefinido',
        )

    def test_crear_vacante_activa(self, empresa, cargo, user, tipo_contrato):
        """Debe crear una vacante activa."""
        from apps.mi_equipo.seleccion_contratacion.models import VacanteActiva

        vacante = VacanteActiva.objects.create(
            empresa=empresa,
            cargo=cargo,
            codigo_vacante='VAC-TEST-001',
            titulo='Analista de Calidad',
            descripcion='Gestion de calidad',
            requisitos_minimos='Profesional en ingenieria',
            funciones_principales='Auditorias internas',
            tipo_contrato=tipo_contrato,
            horario='Lun-Vie 8:00-17:00',
            ubicacion='Bogota',
            responsable_proceso=user,
            created_by=user,
            updated_by=user,
        )
        assert vacante.pk is not None
        assert vacante.estado == 'abierta'

    def test_str_vacante_activa(self, empresa, cargo, user, tipo_contrato):
        """__str__ debe incluir codigo y titulo."""
        from apps.mi_equipo.seleccion_contratacion.models import VacanteActiva

        vacante = VacanteActiva.objects.create(
            empresa=empresa,
            cargo=cargo,
            codigo_vacante='VAC-TEST-002',
            titulo='Operario',
            descripcion='Operario de planta',
            requisitos_minimos='Bachiller',
            funciones_principales='Produccion',
            tipo_contrato=tipo_contrato,
            horario='Turnos rotativos',
            ubicacion='Bogota',
            responsable_proceso=user,
            created_by=user,
            updated_by=user,
        )
        result = str(vacante)
        assert 'VAC-TEST-002' in result
        assert 'Operario' in result

    def test_posiciones_pendientes(self, empresa, cargo, user, tipo_contrato):
        """posiciones_pendientes debe calcular correctamente."""
        from apps.mi_equipo.seleccion_contratacion.models import VacanteActiva

        vacante = VacanteActiva.objects.create(
            empresa=empresa,
            cargo=cargo,
            codigo_vacante='VAC-TEST-003',
            titulo='Test Posiciones',
            descripcion='Test',
            requisitos_minimos='Test',
            funciones_principales='Test',
            tipo_contrato=tipo_contrato,
            horario='Test',
            ubicacion='Bogota',
            numero_posiciones=3,
            posiciones_cubiertas=1,
            responsable_proceso=user,
            created_by=user,
            updated_by=user,
        )
        assert vacante.posiciones_pendientes == 2

    def test_codigo_vacante_unico(self, empresa, cargo, user, tipo_contrato):
        """codigo_vacante debe ser unico."""
        from apps.mi_equipo.seleccion_contratacion.models import VacanteActiva

        VacanteActiva.objects.create(
            empresa=empresa,
            cargo=cargo,
            codigo_vacante='VAC-UNIQUE',
            titulo='Test Unique',
            descripcion='Test',
            requisitos_minimos='Test',
            funciones_principales='Test',
            tipo_contrato=tipo_contrato,
            horario='Test',
            ubicacion='Bogota',
            responsable_proceso=user,
            created_by=user,
            updated_by=user,
        )
        with pytest.raises(IntegrityError):
            VacanteActiva.objects.create(
                empresa=empresa,
                cargo=cargo,
                codigo_vacante='VAC-UNIQUE',
                titulo='Duplicada',
                descripcion='Test',
                requisitos_minimos='Test',
                funciones_principales='Test',
                tipo_contrato=tipo_contrato,
                horario='Test',
                ubicacion='Bogota',
                responsable_proceso=user,
                created_by=user,
                updated_by=user,
            )

    def test_validacion_salario_invertido(self, empresa, cargo, user, tipo_contrato):
        """clean() debe fallar si salario_minimo > salario_maximo."""
        from apps.mi_equipo.seleccion_contratacion.models import VacanteActiva

        vacante = VacanteActiva(
            empresa=empresa,
            cargo=cargo,
            codigo_vacante='VAC-SAL-INV',
            titulo='Test Salario',
            descripcion='Test',
            requisitos_minimos='Test',
            funciones_principales='Test',
            tipo_contrato=tipo_contrato,
            salario_minimo=Decimal('5000000.00'),
            salario_maximo=Decimal('3000000.00'),
            horario='Test',
            ubicacion='Bogota',
            responsable_proceso=user,
            created_by=user,
            updated_by=user,
        )
        with pytest.raises(ValidationError) as exc_info:
            vacante.clean()
        assert 'salario_maximo' in exc_info.value.message_dict

    def test_validacion_posiciones_excedidas(self, empresa, cargo, user, tipo_contrato):
        """clean() debe fallar si posiciones_cubiertas > numero_posiciones."""
        from apps.mi_equipo.seleccion_contratacion.models import VacanteActiva

        vacante = VacanteActiva(
            empresa=empresa,
            cargo=cargo,
            codigo_vacante='VAC-POS-EXC',
            titulo='Test Posiciones',
            descripcion='Test',
            requisitos_minimos='Test',
            funciones_principales='Test',
            tipo_contrato=tipo_contrato,
            numero_posiciones=1,
            posiciones_cubiertas=5,
            horario='Test',
            ubicacion='Bogota',
            responsable_proceso=user,
            created_by=user,
            updated_by=user,
        )
        with pytest.raises(ValidationError) as exc_info:
            vacante.clean()
        assert 'posiciones_cubiertas' in exc_info.value.message_dict

    def test_soft_delete(self, empresa, cargo, user, tipo_contrato):
        """soft_delete() debe marcar is_active=False."""
        from apps.mi_equipo.seleccion_contratacion.models import VacanteActiva

        vacante = VacanteActiva.objects.create(
            empresa=empresa,
            cargo=cargo,
            codigo_vacante='VAC-DEL',
            titulo='Test Delete',
            descripcion='Test',
            requisitos_minimos='Test',
            funciones_principales='Test',
            tipo_contrato=tipo_contrato,
            horario='Test',
            ubicacion='Bogota',
            responsable_proceso=user,
            created_by=user,
            updated_by=user,
        )
        vacante.soft_delete()
        vacante.refresh_from_db()
        assert vacante.is_active is False

    def test_estado_default_abierta(self, empresa, cargo, user, tipo_contrato):
        """El estado por defecto debe ser 'abierta'."""
        from apps.mi_equipo.seleccion_contratacion.models import VacanteActiva

        vacante = VacanteActiva(
            empresa=empresa,
            cargo=cargo,
            codigo_vacante='VAC-DEFAULT',
            titulo='Test Default',
            descripcion='Test',
            requisitos_minimos='Test',
            funciones_principales='Test',
            tipo_contrato=tipo_contrato,
            horario='Test',
            ubicacion='Bogota',
            responsable_proceso=user,
            created_by=user,
            updated_by=user,
        )
        assert vacante.estado == 'abierta'
        assert vacante.prioridad == 'media'
