"""
Tests para modelos de Producto Terminado
=========================================

Tests completos para validaciones, métodos y propiedades de:
- TipoProducto, EstadoLote
- ProductoTerminado
- StockProducto (reservas, consumo, vencimiento)
- Liberacion (aprobar/rechazar)
- CertificadoCalidad

Autor: Sistema ERP StrateKaz
Fecha: 28 Diciembre 2025
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.production_ops.producto_terminado.models import (
    TipoProducto,
    EstadoLote,
    ProductoTerminado,
    StockProducto,
    Liberacion,
    CertificadoCalidad,
)


# ==============================================================================
# TESTS DE CATALOGOS
# ==============================================================================

@pytest.mark.django_db
class TestTipoProducto:
    """Tests para modelo TipoProducto."""

    def test_crear_tipo_producto(self, tipo_producto_harina):
        """Test creación de tipo de producto."""
        assert tipo_producto_harina.pk is not None
        assert tipo_producto_harina.codigo == 'HARINA_HUESO'
        assert tipo_producto_harina.requiere_certificado is True

    def test_str_representation(self, tipo_producto_harina):
        """Test representación en string."""
        expected = 'HARINA_HUESO - Harina de Hueso'
        assert str(tipo_producto_harina) == expected


@pytest.mark.django_db
class TestEstadoLote:
    """Tests para modelo EstadoLote."""

    def test_crear_estado_lote(self, estado_lote_liberado):
        """Test creación de estado de lote."""
        assert estado_lote_liberado.pk is not None
        assert estado_lote_liberado.codigo == 'LIBERADO'
        assert estado_lote_liberado.permite_despacho is True

    def test_str_representation(self, estado_lote_liberado):
        """Test representación en string."""
        expected = 'LIBERADO - Liberado'
        assert str(estado_lote_liberado) == expected


# ==============================================================================
# TESTS DE PRODUCTO TERMINADO
# ==============================================================================

@pytest.mark.django_db
class TestProductoTerminado:
    """Tests para modelo ProductoTerminado."""

    def test_crear_producto(self, producto_harina_45):
        """Test creación de producto terminado."""
        assert producto_harina_45.pk is not None
        assert producto_harina_45.codigo == 'HH-45'
        assert producto_harina_45.precio_base == Decimal('3500.00')

    def test_str_representation(self, producto_harina_45):
        """Test representación en string."""
        expected = 'HH-45 - Harina de Hueso 45% Proteína'
        assert str(producto_harina_45) == expected


# ==============================================================================
# TESTS DE STOCK PRODUCTO - CRITICO
# ==============================================================================

@pytest.mark.django_db
class TestStockProducto:
    """Tests para modelo StockProducto."""

    def test_crear_stock(self, stock_producto):
        """Test creación de stock."""
        assert stock_producto.pk is not None
        assert stock_producto.codigo_lote_pt is not None
        assert stock_producto.cantidad_disponible == Decimal('1000.000')

    def test_codigo_lote_autogenerado(self, stock_producto):
        """Test generación automática de código de lote."""
        assert stock_producto.codigo_lote_pt.startswith('PT-')
        assert 'HH' in stock_producto.codigo_lote_pt  # Del código del producto

    def test_str_representation(self, stock_producto):
        """Test representación en string."""
        str_repr = str(stock_producto)
        assert stock_producto.codigo_lote_pt in str_repr
        assert 'KG' in str_repr

    def test_valor_total_calculado(self, stock_producto):
        """Test cálculo automático de valor total."""
        expected = Decimal('1000.000') * Decimal('2500.00')
        assert stock_producto.valor_total == expected

    def test_fecha_vencimiento_calculada(self, empresa, producto_harina_45, estado_lote_cuarentena):
        """Test cálculo automático de fecha de vencimiento."""
        stock = StockProducto.objects.create(
            empresa=empresa,
            producto=producto_harina_45,
            estado_lote=estado_lote_cuarentena,
            cantidad_inicial=Decimal('500.000'),
            cantidad_disponible=Decimal('500.000'),
            fecha_produccion=date.today(),
            # No se proporciona fecha_vencimiento
            costo_unitario=Decimal('2500.00'),
            is_active=True
        )
        # Debe calcular vencimiento = fecha_produccion + vida_util_dias (365)
        expected_vencimiento = date.today() + timedelta(days=365)
        assert stock.fecha_vencimiento == expected_vencimiento

    def test_property_esta_vencido(self, stock_producto):
        """Test propiedad esta_vencido."""
        # No debe estar vencido (vence en 365 días)
        assert stock_producto.esta_vencido is False

        # Modificar fecha para que esté vencido
        stock_producto.fecha_vencimiento = date.today() - timedelta(days=1)
        stock_producto.save()
        assert stock_producto.esta_vencido is True

    def test_property_dias_para_vencer(self, stock_producto):
        """Test propiedad dias_para_vencer."""
        dias = stock_producto.dias_para_vencer
        expected = 365  # fecha_vencimiento = today + 365
        assert dias == expected

    def test_property_porcentaje_consumido(self, stock_producto):
        """Test propiedad porcentaje_consumido."""
        # Sin consumir
        assert stock_producto.porcentaje_consumido == Decimal('0.00')

        # Consumir 30%
        stock_producto.cantidad_disponible = Decimal('700.000')
        stock_producto.save()
        # Consumido = 1000 - 700 = 300, porcentaje = 30%
        assert stock_producto.porcentaje_consumido == Decimal('30.00')

    def test_reservar_cantidad(self, stock_producto):
        """Test reservar cantidad del stock."""
        stock_producto.reservar_cantidad(Decimal('200.000'))

        assert stock_producto.cantidad_disponible == Decimal('800.000')
        assert stock_producto.cantidad_reservada == Decimal('200.000')

    def test_reservar_cantidad_insuficiente(self, stock_producto):
        """Test validación al reservar más de lo disponible."""
        with pytest.raises(ValidationError):
            stock_producto.reservar_cantidad(Decimal('1500.000'))

    def test_liberar_reserva(self, stock_producto):
        """Test liberar cantidad reservada."""
        # Primero reservar
        stock_producto.reservar_cantidad(Decimal('200.000'))

        # Luego liberar
        stock_producto.liberar_reserva(Decimal('100.000'))

        assert stock_producto.cantidad_disponible == Decimal('900.000')
        assert stock_producto.cantidad_reservada == Decimal('100.000')

    def test_consumir_cantidad(self, stock_producto):
        """Test consumir/despachar cantidad."""
        # Reservar primero
        stock_producto.reservar_cantidad(Decimal('300.000'))

        # Consumir 200 (debe consumir de la reserva)
        stock_producto.consumir_cantidad(Decimal('200.000'))

        assert stock_producto.cantidad_reservada == Decimal('100.000')
        assert stock_producto.cantidad_disponible == Decimal('700.000')

    def test_validacion_cantidad_disponible_negativa(self, empresa, producto_harina_45, estado_lote_cuarentena):
        """Test validación de cantidad disponible negativa."""
        stock = StockProducto(
            empresa=empresa,
            producto=producto_harina_45,
            estado_lote=estado_lote_cuarentena,
            cantidad_inicial=Decimal('100.000'),
            cantidad_disponible=Decimal('-10.000'),  # Negativa
            fecha_produccion=date.today()
        )

        with pytest.raises(ValidationError) as exc_info:
            stock.full_clean()

        assert 'cantidad_disponible' in exc_info.value.error_dict

    def test_validacion_fecha_vencimiento_anterior(self, empresa, producto_harina_45, estado_lote_cuarentena):
        """Test validación de fecha vencimiento anterior a producción."""
        stock = StockProducto(
            empresa=empresa,
            producto=producto_harina_45,
            estado_lote=estado_lote_cuarentena,
            cantidad_inicial=Decimal('100.000'),
            cantidad_disponible=Decimal('100.000'),
            fecha_produccion=date.today(),
            fecha_vencimiento=date.today() - timedelta(days=1)  # Anterior
        )

        with pytest.raises(ValidationError) as exc_info:
            stock.full_clean()

        assert 'fecha_vencimiento' in exc_info.value.error_dict


# ==============================================================================
# TESTS DE LIBERACION - CRITICO
# ==============================================================================

@pytest.mark.django_db
class TestLiberacion:
    """Tests para modelo Liberacion."""

    def test_crear_liberacion(self, liberacion_pendiente):
        """Test creación de liberación."""
        assert liberacion_pendiente.pk is not None
        assert liberacion_pendiente.resultado == 'PENDIENTE'

    def test_str_representation(self, liberacion_pendiente):
        """Test representación en string."""
        str_repr = str(liberacion_pendiente)
        assert 'PENDIENTE' in str_repr
        assert liberacion_pendiente.stock_producto.codigo_lote_pt in str_repr

    def test_property_permite_despacho(self, liberacion_aprobada, liberacion_pendiente):
        """Test propiedad permite_despacho."""
        assert liberacion_aprobada.permite_despacho is True
        assert liberacion_pendiente.permite_despacho is False

    def test_property_esta_pendiente(self, liberacion_pendiente):
        """Test propiedad esta_pendiente."""
        assert liberacion_pendiente.esta_pendiente is True

    def test_metodo_aprobar(self, liberacion_pendiente, usuario_calidad, estado_lote_liberado):
        """Test método aprobar liberación."""
        parametros = [
            {'parametro': 'Proteína', 'valor': '46%', 'cumple': True}
        ]

        liberacion_pendiente.aprobar(
            usuario=usuario_calidad,
            observaciones='Aprobado',
            parametros_evaluados=parametros
        )

        assert liberacion_pendiente.resultado == 'APROBADO'
        assert liberacion_pendiente.aprobado_por == usuario_calidad
        assert liberacion_pendiente.fecha_liberacion is not None
        assert liberacion_pendiente.stock_producto.estado_lote.codigo == 'LIBERADO'

    def test_metodo_rechazar(self, liberacion_pendiente, usuario_calidad, estado_lote_rechazado):
        """Test método rechazar liberación."""
        parametros = [
            {'parametro': 'Proteína', 'valor': '40%', 'cumple': False}
        ]

        liberacion_pendiente.rechazar(
            usuario=usuario_calidad,
            observaciones='No cumple proteína mínima',
            parametros_evaluados=parametros
        )

        assert liberacion_pendiente.resultado == 'RECHAZADO'
        assert liberacion_pendiente.aprobado_por == usuario_calidad
        assert liberacion_pendiente.fecha_liberacion is not None
        assert liberacion_pendiente.stock_producto.estado_lote.codigo == 'RECHAZADO'

    def test_metodo_aprobar_con_observaciones(self, liberacion_pendiente, usuario_calidad):
        """Test método aprobar con observaciones."""
        liberacion_pendiente.aprobar_con_observaciones(
            usuario=usuario_calidad,
            observaciones='Aprobado pero revisar humedad en siguiente lote'
        )

        assert liberacion_pendiente.resultado == 'APROBADO_CON_OBSERVACIONES'
        assert liberacion_pendiente.permite_despacho is True

    def test_validacion_rechazar_sin_observaciones(self, liberacion_pendiente, usuario_calidad):
        """Test validación al rechazar sin observaciones."""
        with pytest.raises(ValidationError):
            liberacion_pendiente.rechazar(
                usuario=usuario_calidad,
                observaciones=''  # Vacías
            )


# ==============================================================================
# TESTS DE CERTIFICADO CALIDAD
# ==============================================================================

@pytest.mark.django_db
class TestCertificadoCalidad:
    """Tests para modelo CertificadoCalidad."""

    def test_crear_certificado(self, certificado_calidad):
        """Test creación de certificado."""
        assert certificado_calidad.pk is not None
        assert certificado_calidad.numero_certificado is not None

    def test_numero_certificado_autogenerado(self, certificado_calidad):
        """Test generación automática de número de certificado."""
        assert certificado_calidad.numero_certificado.startswith('CERT-')

    def test_str_representation(self, certificado_calidad):
        """Test representación en string."""
        str_repr = str(certificado_calidad)
        assert certificado_calidad.numero_certificado in str_repr
        assert certificado_calidad.cliente_nombre in str_repr

    def test_validacion_liberacion_no_aprobada(self, empresa, liberacion_pendiente, usuario_calidad):
        """Test validación al crear certificado para liberación no aprobada."""
        cert = CertificadoCalidad(
            empresa=empresa,
            liberacion=liberacion_pendiente,  # PENDIENTE, no aprobada
            cliente_nombre='Cliente Test',
            emitido_por=usuario_calidad
        )

        with pytest.raises(ValidationError) as exc_info:
            cert.full_clean()

        assert 'liberacion' in exc_info.value.error_dict
