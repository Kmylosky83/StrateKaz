"""
Tests de Modelos - Riesgos de Procesos
======================================

Tests unitarios para los modelos de riesgos de procesos ISO 31000.
"""
import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.motor_riesgos.riesgos_procesos.models import (
    CategoriaRiesgo,
    RiesgoProceso,
    TratamientoRiesgo,
    ControlOperacional,
    Oportunidad
)


# ============================================================================
# Tests de CategoriaRiesgo
# ============================================================================

@pytest.mark.django_db
class TestCategoriaRiesgo:
    """Tests para el modelo CategoriaRiesgo."""

    def test_crear_categoria_riesgo(self, categoria_riesgo):
        """Verifica que se puede crear una categoria de riesgo."""
        assert categoria_riesgo.pk is not None
        assert categoria_riesgo.codigo == 'EST'
        assert categoria_riesgo.nombre == 'Estrategico'

    def test_str_categoria_riesgo(self, categoria_riesgo):
        """Verifica la representacion string de la categoria."""
        assert str(categoria_riesgo) == 'EST - Estrategico'

    def test_codigo_unico(self, categoria_riesgo, db):
        """Verifica que el codigo debe ser unico."""
        with pytest.raises(IntegrityError):
            CategoriaRiesgo.objects.create(
                codigo='EST',  # Mismo codigo
                nombre='Otro nombre',
                orden=2
            )

    def test_orden_categoria(self, categoria_riesgo, categoria_riesgo_operativo):
        """Verifica el ordenamiento de categorias."""
        categorias = list(CategoriaRiesgo.objects.all())
        assert categorias[0].orden < categorias[1].orden


# ============================================================================
# Tests de RiesgoProceso
# ============================================================================

@pytest.mark.django_db
class TestRiesgoProceso:
    """Tests para el modelo RiesgoProceso."""

    def test_crear_riesgo_proceso(self, riesgo_proceso):
        """Verifica que se puede crear un riesgo de proceso."""
        assert riesgo_proceso.pk is not None
        assert riesgo_proceso.codigo == 'R-001'
        assert riesgo_proceso.nombre == 'Riesgo de prueba'

    def test_str_riesgo_proceso(self, riesgo_proceso):
        """Verifica la representacion string del riesgo."""
        assert str(riesgo_proceso) == 'R-001 - Riesgo de prueba'

    def test_nivel_inherente_calculo(self, riesgo_proceso):
        """Verifica el calculo del nivel de riesgo inherente."""
        # probabilidad_inherente=4, impacto_inherente=5
        assert riesgo_proceso.nivel_inherente == 20  # 4 * 5

    def test_nivel_residual_calculo(self, riesgo_proceso):
        """Verifica el calculo del nivel de riesgo residual."""
        # probabilidad_residual=2, impacto_residual=3
        assert riesgo_proceso.nivel_residual == 6  # 2 * 3

    def test_interpretacion_inherente_critico(self, riesgo_proceso):
        """Verifica la interpretacion de nivel critico (>=15)."""
        assert riesgo_proceso.interpretacion_inherente == 'CRITICO'

    def test_interpretacion_residual_moderado(self, riesgo_proceso):
        """Verifica la interpretacion de nivel moderado (5-9)."""
        assert riesgo_proceso.interpretacion_residual == 'MODERADO'

    def test_interpretacion_nivel_bajo(self, db, empresa, usuario):
        """Verifica la interpretacion de nivel bajo (1-4)."""
        riesgo = RiesgoProceso.objects.create(
            empresa=empresa,
            codigo='R-BAJO',
            nombre='Riesgo bajo',
            descripcion='Riesgo de bajo nivel',
            tipo='operativo',
            proceso='Proceso admin',
            causa_raiz='Causa menor',
            consecuencia='Impacto menor',
            probabilidad_inherente=1,
            impacto_inherente=2,
            probabilidad_residual=1,
            impacto_residual=1
        )
        assert riesgo.interpretacion_inherente == 'BAJO'
        assert riesgo.interpretacion_residual == 'BAJO'

    def test_interpretacion_nivel_alto(self, db, empresa, usuario):
        """Verifica la interpretacion de nivel alto (10-14)."""
        riesgo = RiesgoProceso.objects.create(
            empresa=empresa,
            codigo='R-ALTO',
            nombre='Riesgo alto',
            descripcion='Riesgo de alto nivel',
            tipo='financiero',
            proceso='Proceso financiero',
            causa_raiz='Causa importante',
            consecuencia='Impacto significativo',
            probabilidad_inherente=3,
            impacto_inherente=4,  # 12
            probabilidad_residual=2,
            impacto_residual=5  # 10
        )
        assert riesgo.interpretacion_inherente == 'ALTO'
        assert riesgo.interpretacion_residual == 'ALTO'

    def test_reduccion_riesgo_porcentaje(self, riesgo_proceso):
        """Verifica el calculo del porcentaje de reduccion."""
        # Inherente: 20, Residual: 6
        # Reduccion: ((20-6)/20)*100 = 70%
        assert riesgo_proceso.reduccion_riesgo_porcentaje == 70.0

    def test_codigo_unico_por_empresa(self, riesgo_proceso, empresa, usuario):
        """Verifica que el codigo es unico dentro de la empresa."""
        with pytest.raises(IntegrityError):
            RiesgoProceso.objects.create(
                empresa=empresa,
                codigo='R-001',  # Mismo codigo, misma empresa
                nombre='Otro riesgo',
                descripcion='Descripcion',
                tipo='operativo',
                proceso='Otro proceso',
                causa_raiz='Causa',
                consecuencia='Consecuencia',
                probabilidad_inherente=1,
                impacto_inherente=1,
                probabilidad_residual=1,
                impacto_residual=1
            )

    def test_tipo_riesgo_choices(self, riesgo_proceso):
        """Verifica los tipos de riesgo disponibles."""
        tipos_validos = [choice[0] for choice in RiesgoProceso.TipoRiesgo.choices]
        assert riesgo_proceso.tipo in tipos_validos
        assert 'estrategico' in tipos_validos
        assert 'operativo' in tipos_validos
        assert 'financiero' in tipos_validos

    def test_estado_riesgo_choices(self, riesgo_proceso):
        """Verifica los estados de riesgo disponibles."""
        estados_validos = [choice[0] for choice in RiesgoProceso.EstadoRiesgo.choices]
        assert riesgo_proceso.estado in estados_validos
        assert 'identificado' in estados_validos
        assert 'en_tratamiento' in estados_validos
        assert 'cerrado' in estados_validos


# ============================================================================
# Tests de TratamientoRiesgo
# ============================================================================

@pytest.mark.django_db
class TestTratamientoRiesgo:
    """Tests para el modelo TratamientoRiesgo."""

    def test_crear_tratamiento(self, tratamiento_riesgo):
        """Verifica que se puede crear un tratamiento."""
        assert tratamiento_riesgo.pk is not None
        assert tratamiento_riesgo.tipo == 'mitigar'
        assert tratamiento_riesgo.estado == 'pendiente'

    def test_str_tratamiento(self, tratamiento_riesgo):
        """Verifica la representacion string del tratamiento."""
        expected = f"{tratamiento_riesgo.riesgo.codigo} - Mitigar"
        assert str(tratamiento_riesgo) == expected

    def test_relacion_riesgo(self, tratamiento_riesgo, riesgo_proceso):
        """Verifica la relacion con el riesgo."""
        assert tratamiento_riesgo.riesgo == riesgo_proceso
        assert tratamiento_riesgo in riesgo_proceso.tratamientos.all()

    def test_tipo_tratamiento_choices(self, tratamiento_riesgo):
        """Verifica los tipos de tratamiento disponibles."""
        tipos = [c[0] for c in TratamientoRiesgo.TipoTratamiento.choices]
        assert 'evitar' in tipos
        assert 'mitigar' in tipos
        assert 'transferir' in tipos
        assert 'aceptar' in tipos


# ============================================================================
# Tests de ControlOperacional
# ============================================================================

@pytest.mark.django_db
class TestControlOperacional:
    """Tests para el modelo ControlOperacional."""

    def test_crear_control(self, control_operacional):
        """Verifica que se puede crear un control operacional."""
        assert control_operacional.pk is not None
        assert control_operacional.tipo_control == 'preventivo'
        assert control_operacional.efectividad == 'Alta'

    def test_str_control(self, control_operacional):
        """Verifica la representacion string del control."""
        expected = f"{control_operacional.riesgo.codigo} - {control_operacional.nombre}"
        assert str(control_operacional) == expected

    def test_relacion_riesgo(self, control_operacional, riesgo_proceso):
        """Verifica la relacion con el riesgo."""
        assert control_operacional.riesgo == riesgo_proceso
        assert control_operacional in riesgo_proceso.controles.all()

    def test_tipo_control_choices(self, control_operacional):
        """Verifica los tipos de control disponibles."""
        tipos = [c[0] for c in ControlOperacional.TipoControl.choices]
        assert 'preventivo' in tipos
        assert 'detectivo' in tipos
        assert 'correctivo' in tipos


# ============================================================================
# Tests de Oportunidad
# ============================================================================

@pytest.mark.django_db
class TestOportunidad:
    """Tests para el modelo Oportunidad."""

    def test_crear_oportunidad(self, oportunidad):
        """Verifica que se puede crear una oportunidad."""
        assert oportunidad.pk is not None
        assert oportunidad.codigo == 'O-001'
        assert oportunidad.estado == 'identificada'

    def test_str_oportunidad(self, oportunidad):
        """Verifica la representacion string de la oportunidad."""
        assert str(oportunidad) == 'O-001 - Oportunidad de mercado'

    def test_estado_oportunidad_choices(self, oportunidad):
        """Verifica los estados de oportunidad disponibles."""
        estados = [c[0] for c in Oportunidad.EstadoOportunidad.choices]
        assert 'identificada' in estados
        assert 'aprobada' in estados
        assert 'materializada' in estados
        assert 'descartada' in estados

    def test_codigo_unico_por_empresa(self, oportunidad, empresa, usuario):
        """Verifica que el codigo es unico por empresa."""
        with pytest.raises(IntegrityError):
            Oportunidad.objects.create(
                empresa=empresa,
                codigo='O-001',  # Mismo codigo
                nombre='Otra oportunidad',
                descripcion='Descripcion',
                fuente='Tecnologia',
                impacto_potencial='Medio',
                viabilidad='Media'
            )
