"""
Tests de modelo Liquidacion — Supply Chain S3.

Cubre:
- Cálculo automático subtotal + ajuste_calidad_monto + total_liquidado
- Factory desde_linea
- Validaciones (precio, peso, ajuste 0-100%)
- OneToOne linea (no duplicados)
- TenantModel (soft_delete)
- TextChoices estado

NOTA: tests legacy pytest.mark.django_db (informativos en CI, no bloqueantes).
"""
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.supply_chain.liquidaciones.models import Liquidacion
from apps.supply_chain.recepcion.models import VoucherLineaMP, VoucherRecepcion

# Cargar fixtures de recepcion/tests/conftest.py
pytest_plugins = ['apps.supply_chain.recepcion.tests.conftest']

pytestmark = pytest.mark.django_db


@pytest.fixture
def voucher_header(voucher_base_kwargs):
    return VoucherRecepcion.objects.create(**voucher_base_kwargs)


@pytest.fixture
def linea(voucher_header, producto_sebo):
    """VoucherLineaMP lista para crear Liquidacion."""
    return VoucherLineaMP.objects.create(
        voucher=voucher_header,
        producto=producto_sebo,
        peso_bruto_kg=Decimal('1050.000'),
        peso_tara_kg=Decimal('50.000'),
    )


# ==============================================================================
# Cálculos automáticos
# ==============================================================================

class TestCalculos:
    def test_subtotal_calculado(self, linea):
        liq = Liquidacion.objects.create(
            linea=linea,
            precio_kg_aplicado=Decimal('3500.00'),
            peso_neto_kg=linea.peso_neto_kg,
        )
        # 1000 × 3500 = 3.500.000
        assert liq.subtotal == Decimal('3500000.00')

    def test_ajuste_calidad_monto_calculado(self, linea):
        liq = Liquidacion.objects.create(
            linea=linea,
            precio_kg_aplicado=Decimal('3500.00'),
            peso_neto_kg=linea.peso_neto_kg,
            ajuste_calidad_pct=Decimal('10.00'),
        )
        # 10% de 3.500.000 = 350.000
        assert liq.ajuste_calidad_monto == Decimal('350000.00')

    def test_total_liquidado_con_ajuste(self, linea):
        liq = Liquidacion.objects.create(
            linea=linea,
            precio_kg_aplicado=Decimal('3500.00'),
            peso_neto_kg=linea.peso_neto_kg,
            ajuste_calidad_pct=Decimal('10.00'),
        )
        # 3.500.000 - 350.000 = 3.150.000
        assert liq.total_liquidado == Decimal('3150000.00')

    def test_total_sin_ajuste_igual_subtotal(self, linea):
        liq = Liquidacion.objects.create(
            linea=linea,
            precio_kg_aplicado=Decimal('3500.00'),
            peso_neto_kg=linea.peso_neto_kg,
        )
        assert liq.total_liquidado == liq.subtotal


# ==============================================================================
# Factory desde_linea
# ==============================================================================

class TestFactoryDesdeLinea:
    def test_congela_precio_y_peso(self, linea, precio_sebo):
        liq = Liquidacion.desde_linea(linea)
        assert liq.precio_kg_aplicado == precio_sebo.precio_kg
        assert liq.peso_neto_kg == linea.peso_neto_kg
        assert liq.pk is not None

    def test_con_ajuste_calidad(self, linea, precio_sebo):
        liq = Liquidacion.desde_linea(linea, ajuste_calidad_pct=Decimal('5.00'))
        assert liq.ajuste_calidad_pct == Decimal('5.00')
        assert liq.ajuste_calidad_monto > 0


# ==============================================================================
# Validaciones
# ==============================================================================

class TestValidaciones:
    def test_precio_negativo_rechazado(self, linea):
        liq = Liquidacion(
            linea=linea,
            precio_kg_aplicado=Decimal('-100.00'),
            peso_neto_kg=linea.peso_neto_kg,
        )
        with pytest.raises(ValidationError) as exc:
            liq.full_clean()
        assert 'precio_kg_aplicado' in exc.value.error_dict

    def test_peso_cero_rechazado(self, linea):
        liq = Liquidacion(
            linea=linea,
            precio_kg_aplicado=Decimal('3500.00'),
            peso_neto_kg=Decimal('0.000'),
        )
        with pytest.raises(ValidationError) as exc:
            liq.full_clean()
        assert 'peso_neto_kg' in exc.value.error_dict

    def test_ajuste_sobre_100_rechazado(self, linea):
        liq = Liquidacion(
            linea=linea,
            precio_kg_aplicado=Decimal('3500.00'),
            peso_neto_kg=linea.peso_neto_kg,
            ajuste_calidad_pct=Decimal('101.00'),
        )
        with pytest.raises(ValidationError) as exc:
            liq.full_clean()
        assert 'ajuste_calidad_pct' in exc.value.error_dict

    def test_ajuste_negativo_rechazado(self, linea):
        liq = Liquidacion(
            linea=linea,
            precio_kg_aplicado=Decimal('3500.00'),
            peso_neto_kg=linea.peso_neto_kg,
            ajuste_calidad_pct=Decimal('-1.00'),
        )
        with pytest.raises(ValidationError) as exc:
            liq.full_clean()
        assert 'ajuste_calidad_pct' in exc.value.error_dict


# ==============================================================================
# OneToOne linea (no duplicados)
# ==============================================================================

class TestOneToOne:
    def test_una_liquidacion_por_linea(self, linea):
        Liquidacion.objects.create(
            linea=linea,
            precio_kg_aplicado=Decimal('3500.00'),
            peso_neto_kg=linea.peso_neto_kg,
        )
        with pytest.raises(IntegrityError):
            Liquidacion.objects.create(
                linea=linea,
                precio_kg_aplicado=Decimal('3500.00'),
                peso_neto_kg=linea.peso_neto_kg,
            )


# ==============================================================================
# TenantModel y estados
# ==============================================================================

class TestTenantModelYEstados:
    def test_default_pendiente(self, linea):
        liq = Liquidacion.objects.create(
            linea=linea,
            precio_kg_aplicado=Decimal('3500.00'),
            peso_neto_kg=linea.peso_neto_kg,
        )
        assert liq.estado == Liquidacion.EstadoLiquidacion.PENDIENTE

    def test_soft_delete(self, linea):
        liq = Liquidacion.objects.create(
            linea=linea,
            precio_kg_aplicado=Decimal('3500.00'),
            peso_neto_kg=linea.peso_neto_kg,
        )
        liq.delete()
        assert Liquidacion.objects.filter(pk=liq.pk).count() == 0
        assert Liquidacion.all_objects.filter(pk=liq.pk).count() == 1

    def test_str(self, linea):
        liq = Liquidacion.objects.create(
            linea=linea,
            precio_kg_aplicado=Decimal('3500.00'),
            peso_neto_kg=linea.peso_neto_kg,
        )
        assert f'#{liq.pk}' in str(liq)
        assert f'#{linea.pk}' in str(liq)
