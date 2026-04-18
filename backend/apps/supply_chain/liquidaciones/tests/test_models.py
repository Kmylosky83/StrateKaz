"""
Tests de modelo Liquidacion — Supply Chain S3.

Cubre:
- Cálculo automático subtotal + ajuste_calidad_monto + total_liquidado
- Factory desde_voucher
- Validaciones (precio, peso, ajuste 0-100%)
- OneToOne voucher (no duplicados)
- TenantModel (soft_delete)
- TextChoices estado
"""
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.supply_chain.liquidaciones.models import Liquidacion
from apps.supply_chain.recepcion.models import VoucherRecepcion

# Cargar fixtures de recepcion/tests/conftest.py
pytest_plugins = ['apps.supply_chain.recepcion.tests.conftest']

pytestmark = pytest.mark.django_db


@pytest.fixture
def voucher(voucher_base_kwargs):
    return VoucherRecepcion.objects.create(**voucher_base_kwargs)


# ==============================================================================
# Cálculos automáticos
# ==============================================================================

class TestCalculos:
    def test_subtotal_calculado(self, voucher):
        liq = Liquidacion.objects.create(
            voucher=voucher,
            precio_kg_aplicado=voucher.precio_kg_snapshot,
            peso_neto_kg=voucher.peso_neto_kg,
        )
        # 1000 × 3500 = 3.500.000
        assert liq.subtotal == Decimal('3500000.00')

    def test_ajuste_calidad_monto_calculado(self, voucher):
        liq = Liquidacion.objects.create(
            voucher=voucher,
            precio_kg_aplicado=voucher.precio_kg_snapshot,
            peso_neto_kg=voucher.peso_neto_kg,
            ajuste_calidad_pct=Decimal('10.00'),
        )
        # 10% de 3.500.000 = 350.000
        assert liq.ajuste_calidad_monto == Decimal('350000.00')

    def test_total_liquidado_con_ajuste(self, voucher):
        liq = Liquidacion.objects.create(
            voucher=voucher,
            precio_kg_aplicado=voucher.precio_kg_snapshot,
            peso_neto_kg=voucher.peso_neto_kg,
            ajuste_calidad_pct=Decimal('10.00'),
        )
        # 3.500.000 - 350.000 = 3.150.000
        assert liq.total_liquidado == Decimal('3150000.00')

    def test_total_sin_ajuste_igual_subtotal(self, voucher):
        liq = Liquidacion.objects.create(
            voucher=voucher,
            precio_kg_aplicado=voucher.precio_kg_snapshot,
            peso_neto_kg=voucher.peso_neto_kg,
        )
        assert liq.total_liquidado == liq.subtotal


# ==============================================================================
# Factory desde_voucher
# ==============================================================================

class TestFactoryDesdeVoucher:
    def test_congela_precio_y_peso(self, voucher):
        liq = Liquidacion.desde_voucher(voucher)
        assert liq.precio_kg_aplicado == voucher.precio_kg_snapshot
        assert liq.peso_neto_kg == voucher.peso_neto_kg
        assert liq.pk is not None

    def test_con_ajuste_calidad(self, voucher):
        liq = Liquidacion.desde_voucher(voucher, ajuste_calidad_pct=Decimal('5.00'))
        assert liq.ajuste_calidad_pct == Decimal('5.00')
        assert liq.ajuste_calidad_monto > 0


# ==============================================================================
# Validaciones
# ==============================================================================

class TestValidaciones:
    def test_precio_negativo_rechazado(self, voucher):
        liq = Liquidacion(
            voucher=voucher,
            precio_kg_aplicado=Decimal('-100.00'),
            peso_neto_kg=voucher.peso_neto_kg,
        )
        with pytest.raises(ValidationError) as exc:
            liq.full_clean()
        assert 'precio_kg_aplicado' in exc.value.error_dict

    def test_peso_cero_rechazado(self, voucher):
        liq = Liquidacion(
            voucher=voucher,
            precio_kg_aplicado=voucher.precio_kg_snapshot,
            peso_neto_kg=Decimal('0.000'),
        )
        with pytest.raises(ValidationError) as exc:
            liq.full_clean()
        assert 'peso_neto_kg' in exc.value.error_dict

    def test_ajuste_sobre_100_rechazado(self, voucher):
        liq = Liquidacion(
            voucher=voucher,
            precio_kg_aplicado=voucher.precio_kg_snapshot,
            peso_neto_kg=voucher.peso_neto_kg,
            ajuste_calidad_pct=Decimal('101.00'),
        )
        with pytest.raises(ValidationError) as exc:
            liq.full_clean()
        assert 'ajuste_calidad_pct' in exc.value.error_dict

    def test_ajuste_negativo_rechazado(self, voucher):
        liq = Liquidacion(
            voucher=voucher,
            precio_kg_aplicado=voucher.precio_kg_snapshot,
            peso_neto_kg=voucher.peso_neto_kg,
            ajuste_calidad_pct=Decimal('-1.00'),
        )
        with pytest.raises(ValidationError) as exc:
            liq.full_clean()
        assert 'ajuste_calidad_pct' in exc.value.error_dict


# ==============================================================================
# OneToOne voucher (no duplicados)
# ==============================================================================

class TestOneToOne:
    def test_una_liquidacion_por_voucher(self, voucher):
        Liquidacion.objects.create(
            voucher=voucher,
            precio_kg_aplicado=voucher.precio_kg_snapshot,
            peso_neto_kg=voucher.peso_neto_kg,
        )
        with pytest.raises(IntegrityError):
            Liquidacion.objects.create(
                voucher=voucher,
                precio_kg_aplicado=voucher.precio_kg_snapshot,
                peso_neto_kg=voucher.peso_neto_kg,
            )


# ==============================================================================
# TenantModel y estados
# ==============================================================================

class TestTenantModelYEstados:
    def test_default_pendiente(self, voucher):
        liq = Liquidacion.objects.create(
            voucher=voucher,
            precio_kg_aplicado=voucher.precio_kg_snapshot,
            peso_neto_kg=voucher.peso_neto_kg,
        )
        assert liq.estado == Liquidacion.EstadoLiquidacion.PENDIENTE

    def test_soft_delete(self, voucher):
        liq = Liquidacion.objects.create(
            voucher=voucher,
            precio_kg_aplicado=voucher.precio_kg_snapshot,
            peso_neto_kg=voucher.peso_neto_kg,
        )
        liq.delete()
        assert Liquidacion.objects.filter(pk=liq.pk).count() == 0
        assert Liquidacion.all_objects.filter(pk=liq.pk).count() == 1

    def test_str(self, voucher):
        liq = Liquidacion.objects.create(
            voucher=voucher,
            precio_kg_aplicado=voucher.precio_kg_snapshot,
            peso_neto_kg=voucher.peso_neto_kg,
        )
        assert f'#{liq.pk}' in str(liq)
        assert f'#{voucher.pk}' in str(liq)
