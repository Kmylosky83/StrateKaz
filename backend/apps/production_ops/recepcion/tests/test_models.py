"""
Tests para modelos de Recepción de Materia Prima
=================================================

Tests completos para validaciones, métodos y propiedades de:
- TipoRecepcion
- EstadoRecepcion
- PuntoRecepcion
- Recepcion y DetalleRecepcion
- ControlCalidadRecepcion

Autor: Sistema ERP StrateKaz
Fecha: 28 Diciembre 2025
"""
import pytest
from datetime import date, time, timedelta
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.production_ops.recepcion.models import (
    TipoRecepcion,
    EstadoRecepcion,
    PuntoRecepcion,
    Recepcion,
    DetalleRecepcion,
    ControlCalidadRecepcion,
)


# ==============================================================================
# TESTS DE CATALOGOS
# ==============================================================================

@pytest.mark.django_db
class TestTipoRecepcion:
    """Tests para modelo TipoRecepcion."""

    def test_crear_tipo_recepcion(self, tipo_recepcion_hueso):
        """Test creación de tipo de recepción."""
        assert tipo_recepcion_hueso.pk is not None
        assert tipo_recepcion_hueso.codigo == 'RECEPCION_HUESO_CRUDO'
        assert tipo_recepcion_hueso.requiere_pesaje is True

    def test_str_representation(self, tipo_recepcion_hueso):
        """Test representación en string."""
        assert str(tipo_recepcion_hueso) == 'Recepción Hueso Crudo'

    def test_clean_normaliza_codigo(self):
        """Test que clean() normaliza el código a mayúsculas."""
        tipo = TipoRecepcion(
            codigo='recepcion test',
            nombre='Test',
            is_active=True
        )
        tipo.clean()
        assert tipo.codigo == 'RECEPCION_TEST'


@pytest.mark.django_db
class TestEstadoRecepcion:
    """Tests para modelo EstadoRecepcion."""

    def test_crear_estado(self, estado_recepcion_pendiente):
        """Test creación de estado."""
        assert estado_recepcion_pendiente.pk is not None
        assert estado_recepcion_pendiente.codigo == 'PENDIENTE'
        assert estado_recepcion_pendiente.es_inicial is True

    def test_str_representation(self, estado_recepcion_pendiente):
        """Test representación en string."""
        assert str(estado_recepcion_pendiente) == 'Pendiente'


@pytest.mark.django_db
class TestPuntoRecepcion:
    """Tests para modelo PuntoRecepcion."""

    def test_crear_punto_recepcion(self, punto_recepcion_bascula):
        """Test creación de punto de recepción."""
        assert punto_recepcion_bascula.pk is not None
        assert punto_recepcion_bascula.codigo == 'BASCULA_PRINCIPAL'
        assert punto_recepcion_bascula.capacidad_kg == Decimal('50000.00')

    def test_str_representation(self, punto_recepcion_bascula):
        """Test representación en string."""
        expected = 'Báscula Principal (BASCULA_PRINCIPAL)'
        assert str(punto_recepcion_bascula) == expected


# ==============================================================================
# TESTS DE RECEPCION
# ==============================================================================

@pytest.mark.django_db
class TestRecepcion:
    """Tests para modelo Recepcion."""

    def test_crear_recepcion(self, recepcion):
        """Test creación de recepción."""
        assert recepcion.pk is not None
        assert recepcion.codigo is not None
        assert recepcion.codigo.startswith('REC-')

    def test_codigo_autogenerado(self, empresa, proveedor, tipo_recepcion_hueso,
                                  punto_recepcion_bascula, estado_recepcion_pendiente, usuario):
        """Test que el código se genera automáticamente."""
        rec = Recepcion.objects.create(
            empresa=empresa,
            fecha=date.today(),
            proveedor=proveedor,
            tipo_recepcion=tipo_recepcion_hueso,
            punto_recepcion=punto_recepcion_bascula,
            estado=estado_recepcion_pendiente,
            peso_bruto=Decimal('5000.00'),
            peso_tara=Decimal('1000.00'),
            recibido_por=usuario,
            created_by=usuario
        )
        assert rec.codigo is not None
        assert len(rec.codigo) > 0

    def test_str_representation(self, recepcion):
        """Test representación en string."""
        str_repr = str(recepcion)
        assert recepcion.codigo in str_repr
        assert recepcion.proveedor.nombre_comercial in str_repr

    def test_peso_neto_calculado(self, recepcion):
        """Test cálculo automático de peso neto."""
        assert recepcion.peso_neto == Decimal('8000.00')
        assert recepcion.peso_neto_calculado == Decimal('8000.00')

    def test_duracion_recepcion(self, recepcion):
        """Test cálculo de duración de recepción."""
        recepcion.hora_salida = time(10, 30)
        recepcion.save()
        # 2.5 horas = 150 minutos
        assert recepcion.duracion_recepcion == 150

    def test_tiene_detalles(self, recepcion, detalle_recepcion):
        """Test propiedad tiene_detalles."""
        assert recepcion.tiene_detalles is True

    def test_total_cantidad_detalles(self, recepcion, detalle_recepcion):
        """Test suma total de cantidades de detalles."""
        total = recepcion.total_cantidad_detalles
        assert total == Decimal('8000.000')

    def test_total_valor_detalles(self, recepcion, detalle_recepcion):
        """Test suma total del valor de detalles."""
        total = recepcion.total_valor_detalles
        expected = Decimal('8000.000') * Decimal('1500.00')
        assert total == expected

    def test_validacion_proveedor_inactivo(self, empresa, proveedor, tipo_recepcion_hueso,
                                           punto_recepcion_bascula, estado_recepcion_pendiente, usuario):
        """Test validación de proveedor inactivo."""
        proveedor.is_active = False
        proveedor.save()

        rec = Recepcion(
            empresa=empresa,
            fecha=date.today(),
            proveedor=proveedor,
            tipo_recepcion=tipo_recepcion_hueso,
            punto_recepcion=punto_recepcion_bascula,
            estado=estado_recepcion_pendiente,
            peso_bruto=Decimal('5000.00'),
            peso_tara=Decimal('1000.00'),
            recibido_por=usuario
        )

        with pytest.raises(ValidationError) as exc_info:
            rec.full_clean()

        assert 'proveedor' in exc_info.value.error_dict

    def test_validacion_peso_bruto_menor_tara(self, empresa, proveedor, tipo_recepcion_hueso,
                                               punto_recepcion_bascula, estado_recepcion_pendiente, usuario):
        """Test validación de peso bruto menor que tara."""
        rec = Recepcion(
            empresa=empresa,
            fecha=date.today(),
            proveedor=proveedor,
            tipo_recepcion=tipo_recepcion_hueso,
            punto_recepcion=punto_recepcion_bascula,
            estado=estado_recepcion_pendiente,
            peso_bruto=Decimal('1000.00'),
            peso_tara=Decimal('2000.00'),  # Tara mayor que bruto
            recibido_por=usuario
        )

        with pytest.raises(ValidationError) as exc_info:
            rec.full_clean()

        assert 'peso_bruto' in exc_info.value.error_dict


@pytest.mark.django_db
class TestDetalleRecepcion:
    """Tests para modelo DetalleRecepcion."""

    def test_crear_detalle(self, detalle_recepcion):
        """Test creación de detalle."""
        assert detalle_recepcion.pk is not None
        assert detalle_recepcion.cantidad == Decimal('8000.000')

    def test_str_representation(self, detalle_recepcion):
        """Test representación en string."""
        str_repr = str(detalle_recepcion)
        assert detalle_recepcion.recepcion.codigo in str_repr
        assert 'KG' in str_repr

    def test_subtotal_calculado(self, detalle_recepcion):
        """Test cálculo automático de subtotal."""
        expected = Decimal('8000.000') * Decimal('1500.00')
        assert detalle_recepcion.subtotal == expected

    def test_lote_asignado_autogenerado(self, detalle_recepcion):
        """Test generación automática de lote."""
        assert detalle_recepcion.lote_asignado is not None
        assert 'LOTE-' in detalle_recepcion.lote_asignado

    def test_validacion_cantidad_cero(self, recepcion, tipo_materia_prima_hueso):
        """Test validación de cantidad cero."""
        detalle = DetalleRecepcion(
            recepcion=recepcion,
            tipo_materia_prima=tipo_materia_prima_hueso,
            cantidad=Decimal('0.000'),
            unidad_medida='KG',
            precio_unitario=Decimal('1000.00')
        )

        with pytest.raises(ValidationError) as exc_info:
            detalle.full_clean()

        assert 'cantidad' in exc_info.value.error_dict

    def test_validacion_precio_negativo(self, recepcion, tipo_materia_prima_hueso):
        """Test validación de precio negativo."""
        detalle = DetalleRecepcion(
            recepcion=recepcion,
            tipo_materia_prima=tipo_materia_prima_hueso,
            cantidad=Decimal('100.000'),
            unidad_medida='KG',
            precio_unitario=Decimal('-100.00')
        )

        with pytest.raises(ValidationError) as exc_info:
            detalle.full_clean()

        assert 'precio_unitario' in exc_info.value.error_dict


# ==============================================================================
# TESTS DE CONTROL DE CALIDAD
# ==============================================================================

@pytest.mark.django_db
class TestControlCalidadRecepcion:
    """Tests para modelo ControlCalidadRecepcion."""

    def test_crear_control_calidad(self, control_calidad):
        """Test creación de control de calidad."""
        assert control_calidad.pk is not None
        assert control_calidad.parametro == 'temperatura'
        assert control_calidad.cumple is True

    def test_str_representation(self, control_calidad):
        """Test representación en string."""
        str_repr = str(control_calidad)
        assert control_calidad.recepcion.codigo in str_repr
        assert 'temperatura' in str_repr

    def test_estado_cumplimiento(self, control_calidad):
        """Test propiedad estado_cumplimiento."""
        assert control_calidad.estado_cumplimiento == 'CUMPLE'

    def test_validacion_parametro_vacio(self, recepcion, usuario_calidad):
        """Test validación de parámetro vacío."""
        control = ControlCalidadRecepcion(
            recepcion=recepcion,
            parametro='  ',
            valor_esperado='Test',
            valor_obtenido='Test',
            cumple=True,
            verificado_por=usuario_calidad
        )

        with pytest.raises(ValidationError) as exc_info:
            control.full_clean()

        assert 'parametro' in exc_info.value.error_dict
