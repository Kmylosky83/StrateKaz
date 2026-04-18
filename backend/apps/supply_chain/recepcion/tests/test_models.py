"""
Tests de modelos de Recepción — Supply Chain S3

Cubre VoucherRecepcion + RecepcionCalidad:
- Herencia TenantModel (soft_delete, timestamps, audit)
- Cálculo automático peso_neto
- Validaciones (pesos, precio, modalidad RECOLECCION)
- Snapshot inmutable de precio
- OneToOne RecepcionCalidad con CASCADE
- TextChoices
"""
from datetime import date, datetime
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone

from apps.supply_chain.gestion_proveedores.models import PrecioMateriaPrima
from apps.supply_chain.recepcion.models import RecepcionCalidad, VoucherRecepcion

pytestmark = pytest.mark.django_db


# ==============================================================================
# VoucherRecepcion — Herencia TenantModel
# ==============================================================================

class TestVoucherTenantModel:
    def test_campos_tenant_model_presentes(self, voucher_base_kwargs):
        v = VoucherRecepcion.objects.create(**voucher_base_kwargs)
        assert hasattr(v, 'created_at')
        assert hasattr(v, 'updated_at')
        assert hasattr(v, 'is_deleted')
        assert hasattr(v, 'deleted_at')
        assert v.is_deleted is False

    def test_soft_delete(self, voucher_base_kwargs):
        v = VoucherRecepcion.objects.create(**voucher_base_kwargs)
        v.delete()
        assert VoucherRecepcion.objects.filter(pk=v.pk).count() == 0
        assert VoucherRecepcion.all_objects.filter(pk=v.pk).count() == 1


# ==============================================================================
# VoucherRecepcion — Cálculo peso_neto
# ==============================================================================

class TestPesoNeto:
    def test_calculo_automatico_en_save(self, voucher_base_kwargs):
        v = VoucherRecepcion.objects.create(**voucher_base_kwargs)
        assert v.peso_neto_kg == Decimal('1000.000')

    def test_peso_tara_cero_ok(self, voucher_base_kwargs):
        voucher_base_kwargs['peso_bruto_kg'] = Decimal('500.000')
        voucher_base_kwargs['peso_tara_kg'] = Decimal('0.000')
        v = VoucherRecepcion.objects.create(**voucher_base_kwargs)
        assert v.peso_neto_kg == Decimal('500.000')

    def test_peso_bruto_cero_rechazado(self, voucher_base_kwargs):
        voucher_base_kwargs['peso_bruto_kg'] = Decimal('0.000')
        v = VoucherRecepcion(**voucher_base_kwargs)
        with pytest.raises(ValidationError) as exc:
            v.full_clean()
        assert 'peso_bruto_kg' in exc.value.error_dict

    def test_peso_tara_negativa_rechazada(self, voucher_base_kwargs):
        voucher_base_kwargs['peso_tara_kg'] = Decimal('-1.000')
        v = VoucherRecepcion(**voucher_base_kwargs)
        with pytest.raises(ValidationError) as exc:
            v.full_clean()
        assert 'peso_tara_kg' in exc.value.error_dict

    def test_tara_mayor_que_bruto_rechazada(self, voucher_base_kwargs):
        voucher_base_kwargs['peso_bruto_kg'] = Decimal('100.000')
        voucher_base_kwargs['peso_tara_kg'] = Decimal('200.000')
        v = VoucherRecepcion(**voucher_base_kwargs)
        with pytest.raises(ValidationError) as exc:
            v.full_clean()
        assert 'peso_tara_kg' in exc.value.error_dict


# ==============================================================================
# VoucherRecepcion — Precio snapshot inmutable
# ==============================================================================

class TestPrecioSnapshot:
    def test_snapshot_se_captura(self, voucher_base_kwargs, precio_sebo):
        v = VoucherRecepcion.objects.create(**voucher_base_kwargs)
        assert v.precio_kg_snapshot == Decimal('3500.00')

    def test_cambio_precio_maestro_no_afecta_voucher_existente(
        self, voucher_base_kwargs, precio_sebo
    ):
        v = VoucherRecepcion.objects.create(**voucher_base_kwargs)
        # Cambiar el precio maestro después
        precio_sebo.precio_kg = Decimal('5000.00')
        precio_sebo.save()
        v.refresh_from_db()
        assert v.precio_kg_snapshot == Decimal('3500.00')  # inmutable

    def test_precio_negativo_rechazado(self, voucher_base_kwargs):
        voucher_base_kwargs['precio_kg_snapshot'] = Decimal('-1.00')
        v = VoucherRecepcion(**voucher_base_kwargs)
        with pytest.raises(ValidationError) as exc:
            v.full_clean()
        assert 'precio_kg_snapshot' in exc.value.error_dict


# ==============================================================================
# VoucherRecepcion — Modalidad RECOLECCION requiere transportista
# ==============================================================================

class TestModalidadEntrega:
    def test_directo_sin_transportista_ok(self, voucher_base_kwargs):
        voucher_base_kwargs['modalidad_entrega'] = 'DIRECTO'
        v = VoucherRecepcion(**voucher_base_kwargs)
        v.full_clean()  # no debe lanzar

    def test_transporte_interno_sin_transportista_ok(self, voucher_base_kwargs):
        voucher_base_kwargs['modalidad_entrega'] = 'TRANSPORTE_INTERNO'
        v = VoucherRecepcion(**voucher_base_kwargs)
        v.full_clean()  # no debe lanzar

    def test_recoleccion_sin_transportista_rechazada(self, voucher_base_kwargs):
        voucher_base_kwargs['modalidad_entrega'] = 'RECOLECCION'
        voucher_base_kwargs['uneg_transportista'] = None
        v = VoucherRecepcion(**voucher_base_kwargs)
        with pytest.raises(ValidationError) as exc:
            v.full_clean()
        assert 'uneg_transportista' in exc.value.error_dict

    def test_recoleccion_con_transportista_ok(self, voucher_base_kwargs, uneg_recolectora):
        voucher_base_kwargs['modalidad_entrega'] = 'RECOLECCION'
        voucher_base_kwargs['uneg_transportista'] = uneg_recolectora
        v = VoucherRecepcion(**voucher_base_kwargs)
        v.full_clean()


# ==============================================================================
# VoucherRecepcion — OC nullable sin validación restrictiva
# ==============================================================================

class TestOCNullable:
    def test_sin_oc_ok(self, voucher_base_kwargs):
        """MP acopio típico: sin OC."""
        assert voucher_base_kwargs.get('orden_compra') is None
        v = VoucherRecepcion.objects.create(**voucher_base_kwargs)
        assert v.orden_compra is None


# ==============================================================================
# VoucherRecepcion — Propiedades
# ==============================================================================

class TestPropiedades:
    def test_valor_total_estimado(self, voucher_base_kwargs):
        v = VoucherRecepcion.objects.create(**voucher_base_kwargs)
        # 1000 kg × 3500 = 3.500.000
        assert v.valor_total_estimado == Decimal('3500000.00')

    def test_str(self, voucher_base_kwargs):
        v = VoucherRecepcion.objects.create(**voucher_base_kwargs)
        assert 'Finca El Prado' in str(v)
        assert '1000' in str(v)


# ==============================================================================
# VoucherRecepcion — Estados
# ==============================================================================

class TestEstado:
    def test_default_pendiente_qc(self, voucher_base_kwargs):
        v = VoucherRecepcion.objects.create(**voucher_base_kwargs)
        assert v.estado == VoucherRecepcion.EstadoVoucher.PENDIENTE_QC

    def test_transicion_aprobado(self, voucher_base_kwargs):
        v = VoucherRecepcion.objects.create(**voucher_base_kwargs)
        v.estado = VoucherRecepcion.EstadoVoucher.APROBADO
        v.save()
        v.refresh_from_db()
        assert v.estado == 'APROBADO'


# ==============================================================================
# RecepcionCalidad — OneToOne + CASCADE
# ==============================================================================

class TestRecepcionCalidad:
    def _crear_voucher(self, kwargs):
        return VoucherRecepcion.objects.create(**kwargs)

    def test_crear_calidad_con_voucher(self, voucher_base_kwargs, user_analista):
        v = self._crear_voucher(voucher_base_kwargs)
        qc = RecepcionCalidad.objects.create(
            voucher=v,
            parametros_medidos={'humedad': {'rango': [0, 12], 'medido': 10.5}},
            resultado=RecepcionCalidad.ResultadoQC.APROBADO,
            analista=user_analista,
            fecha_analisis=timezone.now(),
        )
        assert qc.pk is not None
        assert qc.voucher == v

    def test_onetoone_no_duplicado(self, voucher_base_kwargs, user_analista):
        v = self._crear_voucher(voucher_base_kwargs)
        RecepcionCalidad.objects.create(
            voucher=v,
            parametros_medidos={},
            resultado='APROBADO',
            analista=user_analista,
            fecha_analisis=timezone.now(),
        )
        with pytest.raises(IntegrityError):
            RecepcionCalidad.objects.create(
                voucher=v,
                parametros_medidos={},
                resultado='APROBADO',
                analista=user_analista,
                fecha_analisis=timezone.now(),
            )

    def test_cascade_al_borrar_voucher(self, voucher_base_kwargs, user_analista):
        v = self._crear_voucher(voucher_base_kwargs)
        qc = RecepcionCalidad.objects.create(
            voucher=v,
            parametros_medidos={},
            resultado='APROBADO',
            analista=user_analista,
            fecha_analisis=timezone.now(),
        )
        v.hard_delete()  # delete real (CASCADE)
        assert RecepcionCalidad.objects.filter(pk=qc.pk).count() == 0

    def test_str(self, voucher_base_kwargs, user_analista):
        v = self._crear_voucher(voucher_base_kwargs)
        qc = RecepcionCalidad.objects.create(
            voucher=v,
            parametros_medidos={},
            resultado='CONDICIONAL',
            analista=user_analista,
            fecha_analisis=timezone.now(),
        )
        assert 'Condicional' in str(qc) or 'CONDICIONAL' in str(qc)


# ==============================================================================
# TipoAlmacen — FK nullable en Almacen (backward compat)
# ==============================================================================

class TestTipoAlmacen:
    def test_almacen_sin_tipo_ok(self, almacen_sin_tipo):
        assert almacen_sin_tipo.tipo_almacen is None

    def test_almacen_con_tipo_ok(self, almacen_silo, tipo_almacen_silo):
        assert almacen_silo.tipo_almacen == tipo_almacen_silo

    def test_str_tipo_almacen(self, tipo_almacen_silo):
        assert 'Silo' in str(tipo_almacen_silo)
