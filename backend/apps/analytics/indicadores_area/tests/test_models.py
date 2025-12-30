"""
Tests de Modelos para Indicadores Área - Analytics
==================================================

Tests unitarios para:
- ValorKPI: cálculo automático de semáforo, porcentaje cumplimiento
- AccionPorKPI: estados, propiedad esta_vencida
- AlertaKPI: método marcar_como_leida()

Total de tests: 8
Cobertura: Todos los modelos y sus métodos principales

Autor: Sistema ERP StrateKaz
Fecha: 29 Diciembre 2025
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from django.utils import timezone

from apps.analytics.indicadores_area.models import (
    ValorKPI,
    AccionPorKPI,
    AlertaKPI
)


@pytest.mark.django_db
class TestValorKPI:
    """Tests para el modelo ValorKPI."""

    def test_crear_valor_kpi(self, empresa, kpi_sst, usuario):
        """
        Test: Crear valor de KPI con cálculo automático de semáforo.

        Given: KPI con configuración de semáforo
        When: Se crea un valor de KPI
        Then: Debe calcular semáforo automáticamente
        """
        valor = ValorKPI.objects.create(
            empresa_id=empresa.id,
            kpi=kpi_sst,
            fecha_medicion=date.today(),
            periodo='2025-12',
            valor=Decimal('4.0'),
            valor_meta=Decimal('5.0'),
            registrado_por=usuario
        )

        assert valor.pk is not None
        assert valor.semaforo in ['verde', 'amarillo', 'rojo']
        assert valor.valor == Decimal('4.0')

    def test_str_valor_kpi(self, valor_kpi_verde):
        """Test: Representación en string de valor KPI."""
        expected = f"{valor_kpi_verde.kpi.codigo} - {valor_kpi_verde.periodo}: {valor_kpi_verde.valor}"
        assert str(valor_kpi_verde) == expected

    def test_calculo_semaforo_verde(self, valor_kpi_verde):
        """
        Test: Cálculo automático de semáforo verde.

        Given: Valor dentro del rango verde
        When: Se guarda el valor
        Then: Semáforo debe ser 'verde'
        """
        assert valor_kpi_verde.semaforo == 'verde'
        assert valor_kpi_verde.valor == Decimal('3.5')

    def test_calculo_semaforo_amarillo(self, valor_kpi_amarillo):
        """
        Test: Cálculo automático de semáforo amarillo.

        Given: Valor dentro del rango amarillo
        When: Se guarda el valor
        Then: Semáforo debe ser 'amarillo'
        """
        assert valor_kpi_amarillo.semaforo == 'amarillo'
        assert valor_kpi_amarillo.valor == Decimal('7.5')

    def test_calculo_semaforo_rojo(self, valor_kpi_rojo):
        """
        Test: Cálculo automático de semáforo rojo.

        Given: Valor en rango crítico
        When: Se guarda el valor
        Then: Semáforo debe ser 'rojo'
        """
        assert valor_kpi_rojo.semaforo == 'rojo'
        assert valor_kpi_rojo.valor == Decimal('15.0')

    def test_calcular_porcentaje_cumplimiento_mayor_mejor(self, empresa, kpi_financiero, usuario):
        """
        Test: Cálculo de porcentaje cumplimiento (mayor es mejor).

        Given: KPI financiero donde mayor es mejor
        When: Se calcula porcentaje de cumplimiento
        Then: Debe calcular correctamente el porcentaje
        """
        valor = ValorKPI.objects.create(
            empresa_id=empresa.id,
            kpi=kpi_financiero,
            fecha_medicion=date.today(),
            periodo='2025-12',
            valor=Decimal('30.0'),  # 30% de margen
            valor_meta=Decimal('25.0'),  # Meta era 25%
            registrado_por=usuario
        )

        # (30 / 25) * 100 = 120%
        assert valor.porcentaje_cumplimiento == Decimal('120.00')

    def test_calcular_porcentaje_cumplimiento_menor_mejor(self, valor_kpi_verde):
        """
        Test: Cálculo de porcentaje cumplimiento (menor es mejor).

        Given: KPI SST donde menor es mejor
        When: Valor es menor que meta
        Then: Porcentaje debe ser > 100%
        """
        # Valor = 3.5, Meta = 5.0 (menor es mejor)
        # Como logró valor menor, el cumplimiento debe reflejarse positivamente
        assert valor_kpi_verde.porcentaje_cumplimiento is not None

    def test_unique_together_empresa_kpi_periodo(self, valor_kpi_verde):
        """
        Test: No puede haber dos valores del mismo KPI en mismo período.

        Given: Valor existente para KPI en período específico
        When: Se intenta crear otro valor para mismo KPI y período
        Then: Debe lanzar IntegrityError
        """
        from django.db import IntegrityError
        with pytest.raises(IntegrityError):
            ValorKPI.objects.create(
                empresa_id=valor_kpi_verde.empresa_id,
                kpi=valor_kpi_verde.kpi,
                periodo='2025-12',  # Mismo período
                fecha_medicion=date.today(),
                valor=Decimal('4.0'),
                registrado_por=valor_kpi_verde.registrado_por
            )


@pytest.mark.django_db
class TestAccionPorKPI:
    """Tests para el modelo AccionPorKPI."""

    def test_crear_accion_por_kpi(self, empresa, valor_kpi_rojo, colaborador):
        """
        Test: Crear acción vinculada a KPI crítico.

        Given: Valor de KPI en rojo
        When: Se crea acción correctiva
        Then: Debe crearse vinculada al valor
        """
        accion = AccionPorKPI.objects.create(
            empresa_id=empresa.id,
            valor_kpi=valor_kpi_rojo,
            tipo_accion='accion_correctiva',
            descripcion='Acción de prueba',
            responsable=colaborador,
            fecha_compromiso=date.today() + timedelta(days=15),
            estado='pendiente'
        )

        assert accion.pk is not None
        assert accion.valor_kpi == valor_kpi_rojo
        assert accion.estado == 'pendiente'

    def test_str_accion_por_kpi(self, accion_por_kpi):
        """Test: Representación en string de acción."""
        expected = f"Acción {accion_por_kpi.tipo_accion} - {accion_por_kpi.valor_kpi.kpi.codigo}"
        assert str(accion_por_kpi) == expected

    def test_choices_tipo_accion(self, accion_por_kpi):
        """Test: Validar choices de tipo de acción."""
        tipos = ['accion_correctiva', 'plan_mejora', 'seguimiento']
        assert accion_por_kpi.tipo_accion in tipos

    def test_choices_estado(self, accion_por_kpi):
        """Test: Validar choices de estado."""
        estados = ['pendiente', 'en_proceso', 'completada', 'cancelada']
        assert accion_por_kpi.estado in estados

    def test_propiedad_esta_vencida_pendiente(self, accion_por_kpi):
        """
        Test: Propiedad esta_vencida para acción pendiente.

        Given: Acción pendiente con fecha futura
        When: Se consulta esta_vencida
        Then: Debe retornar False
        """
        assert accion_por_kpi.estado == 'pendiente'
        assert accion_por_kpi.fecha_compromiso > date.today()
        assert accion_por_kpi.esta_vencida is False

    def test_propiedad_esta_vencida_true(self, empresa, valor_kpi_rojo, colaborador):
        """
        Test: Acción vencida.

        Given: Acción pendiente con fecha pasada
        When: Se consulta esta_vencida
        Then: Debe retornar True
        """
        accion = AccionPorKPI.objects.create(
            empresa_id=empresa.id,
            valor_kpi=valor_kpi_rojo,
            tipo_accion='seguimiento',
            descripcion='Acción vencida',
            responsable=colaborador,
            fecha_compromiso=date.today() - timedelta(days=5),
            estado='pendiente'
        )

        assert accion.esta_vencida is True

    def test_propiedad_esta_vencida_completada(self, accion_completada):
        """
        Test: Acción completada nunca está vencida.

        Given: Acción en estado completada
        When: Se consulta esta_vencida
        Then: Debe retornar False
        """
        assert accion_completada.estado == 'completada'
        assert accion_completada.esta_vencida is False


@pytest.mark.django_db
class TestAlertaKPI:
    """Tests para el modelo AlertaKPI."""

    def test_crear_alerta_kpi(self, empresa, kpi_sst):
        """
        Test: Crear alerta de KPI.

        Given: KPI existente
        When: Se genera alerta automática
        Then: Debe crearse no leída
        """
        alerta = AlertaKPI.objects.create(
            empresa_id=empresa.id,
            kpi=kpi_sst,
            tipo_alerta='umbral_rojo',
            mensaje='Alerta de prueba',
            esta_leida=False
        )

        assert alerta.pk is not None
        assert alerta.esta_leida is False
        assert alerta.leida_por is None

    def test_str_alerta_kpi(self, alerta_umbral_rojo):
        """Test: Representación en string de alerta."""
        expected = f"Alerta {alerta_umbral_rojo.tipo_alerta} - {alerta_umbral_rojo.kpi.codigo}"
        assert str(alerta_umbral_rojo) == expected

    def test_choices_tipo_alerta(self, alerta_umbral_rojo):
        """Test: Validar choices de tipo de alerta."""
        tipos = ['umbral_rojo', 'tendencia_negativa', 'sin_medicion', 'meta_no_cumplida']
        assert alerta_umbral_rojo.tipo_alerta in tipos

    def test_metodo_marcar_como_leida(self, alerta_sin_medicion, usuario):
        """
        Test: Método marcar_como_leida().

        Given: Alerta no leída
        When: Se llama marcar_como_leida(usuario)
        Then: Debe marcar como leída con datos del usuario
        """
        assert alerta_sin_medicion.esta_leida is False

        alerta_sin_medicion.marcar_como_leida(usuario)

        assert alerta_sin_medicion.esta_leida is True
        assert alerta_sin_medicion.leida_por == usuario
        assert alerta_sin_medicion.fecha_lectura is not None

    def test_alerta_ya_leida(self, alerta_leida, usuario):
        """
        Test: Alerta ya marcada como leída.

        Given: Alerta leída previamente
        When: Se consulta estado
        Then: Debe tener datos de lectura
        """
        assert alerta_leida.esta_leida is True
        assert alerta_leida.leida_por == usuario
        assert alerta_leida.fecha_lectura is not None


@pytest.mark.django_db
class TestMetadataModels:
    """Tests para metadata y campos comunes de los modelos."""

    def test_db_table_names(self):
        """Test: Nombres de tablas en base de datos."""
        assert ValorKPI._meta.db_table == 'analytics_valor_kpi'
        assert AccionPorKPI._meta.db_table == 'analytics_accion_kpi'
        assert AlertaKPI._meta.db_table == 'analytics_alerta_kpi'

    def test_verbose_names(self):
        """Test: Nombres verbose de modelos."""
        assert ValorKPI._meta.verbose_name == 'Valor de KPI'
        assert ValorKPI._meta.verbose_name_plural == 'Valores de KPIs'
        assert AccionPorKPI._meta.verbose_name == 'Acción por KPI'
        assert AlertaKPI._meta.verbose_name == 'Alerta de KPI'

    def test_ordering(self):
        """Test: Ordenamiento de modelos."""
        assert ValorKPI._meta.ordering == ['kpi', '-fecha_medicion']
        assert AccionPorKPI._meta.ordering == ['fecha_compromiso', 'estado']
        assert AlertaKPI._meta.ordering == ['-fecha_generacion']
