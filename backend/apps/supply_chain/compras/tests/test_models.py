"""
Tests para modelos de Gestión de Compras
=========================================

Tests completos para validaciones, métodos y propiedades de:
- Catálogos (8 modelos)
- Requisicion y DetalleRequisicion
- Cotizacion y EvaluacionCotizacion
- OrdenCompra y DetalleOrdenCompra
- Contrato
- RecepcionCompra

Autor: Sistema ERP StrateKaz
Fecha: 27 Diciembre 2025
"""
import pytest
from decimal import Decimal
from datetime import date, timedelta
from django.utils import timezone
from django.core.exceptions import ValidationError

from apps.supply_chain.compras.models import (
    EstadoRequisicion,
    EstadoCotizacion,
    EstadoOrdenCompra,
    TipoContrato,
    PrioridadRequisicion,
    Moneda,
    EstadoContrato,
    EstadoMaterial,
    Requisicion,
    DetalleRequisicion,
    Cotizacion,
    EvaluacionCotizacion,
    OrdenCompra,
    DetalleOrdenCompra,
    Contrato,
    RecepcionCompra,
)


# ==============================================================================
# TESTS DE CATALOGOS
# ==============================================================================

@pytest.mark.django_db
class TestEstadoRequisicion:
    """Tests para modelo EstadoRequisicion."""

    def test_crear_estado(self, estado_requisicion_borrador):
        """Test creación de estado."""
        assert estado_requisicion_borrador.pk is not None
        assert estado_requisicion_borrador.codigo == 'BORRADOR'
        assert estado_requisicion_borrador.permite_edicion is True

    def test_str_representation(self, estado_requisicion_borrador):
        """Test representación en string."""
        assert str(estado_requisicion_borrador) == 'Borrador'


@pytest.mark.django_db
class TestMoneda:
    """Tests para modelo Moneda."""

    def test_crear_moneda(self, moneda_cop):
        """Test creación de moneda."""
        assert moneda_cop.pk is not None
        assert moneda_cop.codigo == 'COP'
        assert moneda_cop.es_moneda_base is True

    def test_str_representation(self, moneda_cop):
        """Test representación en string."""
        assert 'COP' in str(moneda_cop)
        assert 'Peso Colombiano' in str(moneda_cop)


# ==============================================================================
# TESTS DE REQUISICION
# ==============================================================================

@pytest.mark.django_db
class TestRequisicion:
    """Tests para modelo Requisicion."""

    def test_crear_requisicion(self, requisicion):
        """Test creación de requisición."""
        assert requisicion.pk is not None
        assert requisicion.codigo is not None
        assert requisicion.codigo.startswith('REQ-')

    def test_codigo_autogenerado(self, empresa, sede, usuario, estado_requisicion_borrador, prioridad_media):
        """Test que el código se genera automáticamente."""
        req = Requisicion.objects.create(
            empresa=empresa,
            sede=sede,
            solicitante=usuario,
            area_solicitante='Compras',
            fecha_requerida=date.today() + timedelta(days=5),
            justificacion='Test',
            estado=estado_requisicion_borrador,
            prioridad=prioridad_media,
            created_by=usuario
        )
        assert req.codigo is not None
        assert len(req.codigo) > 0

    def test_str_representation(self, requisicion):
        """Test representación en string."""
        str_repr = str(requisicion)
        assert requisicion.codigo in str_repr

    def test_soft_delete(self, requisicion):
        """Test eliminación lógica."""
        assert requisicion.deleted_at is None
        requisicion.soft_delete()
        assert requisicion.deleted_at is not None
        assert requisicion.is_deleted is True

    def test_restore(self, requisicion):
        """Test restauración."""
        requisicion.soft_delete()
        requisicion.restore()
        assert requisicion.deleted_at is None
        assert requisicion.is_deleted is False

    def test_property_esta_aprobada(self, requisicion):
        """Test propiedad esta_aprobada."""
        assert requisicion.esta_aprobada is False

        requisicion.aprobado_por = requisicion.solicitante
        requisicion.fecha_aprobacion = timezone.now()
        requisicion.save()

        assert requisicion.esta_aprobada is True

    def test_property_puede_editar(self, requisicion):
        """Test propiedad puede_editar."""
        # Estado BORRADOR permite edición
        assert requisicion.puede_editar is True

    def test_property_tiene_cotizaciones(self, requisicion, cotizacion):
        """Test propiedad tiene_cotizaciones."""
        cotizacion.requisicion = requisicion
        cotizacion.save()
        requisicion.refresh_from_db()

        assert requisicion.tiene_cotizaciones is True

    def test_metodo_aprobar(self, requisicion, usuario_aprobador, estado_requisicion_aprobada):
        """Test método aprobar."""
        assert requisicion.aprobado_por is None

        requisicion.aprobar(usuario_aprobador)

        assert requisicion.aprobado_por == usuario_aprobador
        assert requisicion.fecha_aprobacion is not None
        assert requisicion.estado == estado_requisicion_aprobada

    def test_validacion_fecha_requerida_pasada(self, empresa, sede, usuario,
                                                estado_requisicion_borrador, prioridad_media):
        """Test validación de fecha requerida en el pasado."""
        req = Requisicion(
            empresa=empresa,
            sede=sede,
            solicitante=usuario,
            area_solicitante='Compras',
            fecha_requerida=date.today() - timedelta(days=1),  # Fecha pasada
            justificacion='Test',
            estado=estado_requisicion_borrador,
            prioridad=prioridad_media
        )

        with pytest.raises(ValidationError) as exc_info:
            req.full_clean()

        assert 'fecha_requerida' in exc_info.value.error_dict


@pytest.mark.django_db
class TestDetalleRequisicion:
    """Tests para modelo DetalleRequisicion."""

    def test_crear_detalle(self, detalle_requisicion):
        """Test creación de detalle."""
        assert detalle_requisicion.pk is not None
        assert detalle_requisicion.cantidad == Decimal('10.000')

    def test_str_representation(self, detalle_requisicion):
        """Test representación en string."""
        str_repr = str(detalle_requisicion)
        assert detalle_requisicion.requisicion.codigo in str_repr

    def test_property_valor_estimado_total(self, detalle_requisicion):
        """Test propiedad valor_estimado_total."""
        valor = detalle_requisicion.valor_estimado_total
        expected = Decimal('10.000') * Decimal('50000.00')
        assert valor == expected

    def test_validacion_cantidad_cero(self, requisicion):
        """Test validación de cantidad cero."""
        detalle = DetalleRequisicion(
            requisicion=requisicion,
            producto_servicio='Test',
            descripcion='Test',
            cantidad=Decimal('0.000'),
            unidad_medida='UNIDAD'
        )

        with pytest.raises(ValidationError) as exc_info:
            detalle.full_clean()

        assert 'cantidad' in exc_info.value.error_dict

    def test_validacion_precio_negativo(self, requisicion):
        """Test validación de precio negativo."""
        detalle = DetalleRequisicion(
            requisicion=requisicion,
            producto_servicio='Test',
            descripcion='Test',
            cantidad=Decimal('10.000'),
            unidad_medida='UNIDAD',
            precio_estimado=Decimal('-100.00')
        )

        with pytest.raises(ValidationError) as exc_info:
            detalle.full_clean()

        assert 'precio_estimado' in exc_info.value.error_dict


# ==============================================================================
# TESTS DE COTIZACION
# ==============================================================================

@pytest.mark.django_db
class TestCotizacion:
    """Tests para modelo Cotizacion."""

    def test_crear_cotizacion(self, cotizacion):
        """Test creación de cotización."""
        assert cotizacion.pk is not None
        assert cotizacion.numero_cotizacion == 'COT-001'

    def test_calcular_total(self, cotizacion):
        """Test cálculo de total automático."""
        # Se calcula en save()
        expected = cotizacion.subtotal + cotizacion.impuestos
        assert cotizacion.total == expected

    def test_str_representation(self, cotizacion):
        """Test representación en string."""
        str_repr = str(cotizacion)
        assert cotizacion.numero_cotizacion in str_repr

    def test_property_esta_vigente(self, cotizacion):
        """Test propiedad esta_vigente."""
        assert cotizacion.esta_vigente is True

        # Cotización vencida
        cotizacion.fecha_vencimiento = date.today() - timedelta(days=1)
        cotizacion.save()
        assert cotizacion.esta_vigente is False

    def test_property_tiene_evaluacion(self, cotizacion, evaluacion_cotizacion):
        """Test propiedad tiene_evaluacion."""
        evaluacion_cotizacion.cotizacion = cotizacion
        evaluacion_cotizacion.save()
        cotizacion.refresh_from_db()

        assert cotizacion.tiene_evaluacion is True

    def test_property_puede_evaluar(self, cotizacion):
        """Test propiedad puede_evaluar."""
        # Estado RECIBIDA permite evaluación
        assert cotizacion.puede_evaluar is True

    def test_validacion_fecha_vencimiento_anterior(self, requisicion, proveedor, moneda_cop,
                                                    estado_cotizacion_recibida, usuario):
        """Test validación de fecha vencimiento anterior a fecha cotización."""
        cot = Cotizacion(
            requisicion=requisicion,
            proveedor=proveedor,
            numero_cotizacion='COT-TEST',
            fecha_cotizacion=date.today(),
            fecha_vencimiento=date.today() - timedelta(days=1),
            moneda=moneda_cop,
            subtotal=Decimal('100000.00'),
            impuestos=Decimal('19000.00'),
            total=Decimal('119000.00'),
            tiempo_entrega_dias=10,
            condiciones_pago='Contado',
            estado=estado_cotizacion_recibida
        )

        with pytest.raises(ValidationError) as exc_info:
            cot.full_clean()

        assert 'fecha_vencimiento' in exc_info.value.error_dict


@pytest.mark.django_db
class TestEvaluacionCotizacion:
    """Tests para modelo EvaluacionCotizacion."""

    def test_crear_evaluacion(self, evaluacion_cotizacion):
        """Test creación de evaluación."""
        assert evaluacion_cotizacion.pk is not None
        assert evaluacion_cotizacion.puntaje_total == Decimal('85.00')

    def test_calcular_puntaje(self, cotizacion, usuario):
        """Test cálculo automático de puntaje."""
        evaluacion = EvaluacionCotizacion.objects.create(
            cotizacion=cotizacion,
            evaluado_por=usuario,
            criterios_evaluacion={'precio': 80, 'calidad': 90, 'servicio': 85},
            puntaje_total=Decimal('0.00'),  # Se calcula automáticamente
            recomendacion='Test'
        )

        # El puntaje debe calcularse como promedio
        assert evaluacion.puntaje_total > 0


# ==============================================================================
# TESTS DE ORDEN DE COMPRA
# ==============================================================================

@pytest.mark.django_db
class TestOrdenCompra:
    """Tests para modelo OrdenCompra."""

    def test_crear_orden_compra(self, orden_compra):
        """Test creación de orden de compra."""
        assert orden_compra.pk is not None
        assert orden_compra.numero_orden is not None
        assert orden_compra.numero_orden.startswith('OC-')

    def test_calcular_total(self, orden_compra):
        """Test cálculo de total automático."""
        expected = orden_compra.subtotal + orden_compra.impuestos - orden_compra.descuento
        assert orden_compra.total == expected

    def test_str_representation(self, orden_compra):
        """Test representación en string."""
        str_repr = str(orden_compra)
        assert orden_compra.numero_orden in str_repr

    def test_property_esta_aprobada(self, orden_compra):
        """Test propiedad esta_aprobada."""
        assert orden_compra.esta_aprobada is False

        orden_compra.aprobado_por = orden_compra.creado_por
        orden_compra.fecha_aprobacion = timezone.now()
        orden_compra.save()

        assert orden_compra.esta_aprobada is True

    def test_property_puede_editar(self, orden_compra):
        """Test propiedad puede_editar."""
        assert orden_compra.puede_editar is True

    def test_property_puede_recibir(self, orden_compra, estado_orden_aprobada):
        """Test propiedad puede_recibir."""
        # Estado BORRADOR no permite recepción
        assert orden_compra.puede_recibir is False

        # Estado APROBADA permite recepción
        orden_compra.estado = estado_orden_aprobada
        orden_compra.save()
        assert orden_compra.puede_recibir is True

    def test_property_porcentaje_recibido(self, orden_compra, detalle_orden_compra):
        """Test propiedad porcentaje_recibido."""
        # Sin recibir nada
        assert orden_compra.porcentaje_recibido == Decimal('0.00')

        # Recibir parcialmente
        detalle_orden_compra.cantidad_recibida = Decimal('5.000')
        detalle_orden_compra.save()
        orden_compra.refresh_from_db()

        assert orden_compra.porcentaje_recibido == Decimal('50.00')

    def test_metodo_aprobar(self, orden_compra, usuario_aprobador, estado_orden_aprobada):
        """Test método aprobar."""
        orden_compra.aprobar(usuario_aprobador)

        assert orden_compra.aprobado_por == usuario_aprobador
        assert orden_compra.fecha_aprobacion is not None
        assert orden_compra.estado == estado_orden_aprobada


@pytest.mark.django_db
class TestDetalleOrdenCompra:
    """Tests para modelo DetalleOrdenCompra."""

    def test_crear_detalle(self, detalle_orden_compra):
        """Test creación de detalle."""
        assert detalle_orden_compra.pk is not None
        assert detalle_orden_compra.cantidad_solicitada == Decimal('10.000')

    def test_calcular_subtotal(self, detalle_orden_compra):
        """Test cálculo de subtotal automático."""
        expected = detalle_orden_compra.precio_unitario * detalle_orden_compra.cantidad_solicitada
        assert detalle_orden_compra.subtotal == expected

    def test_property_cantidad_pendiente(self, detalle_orden_compra):
        """Test propiedad cantidad_pendiente."""
        pendiente = detalle_orden_compra.cantidad_pendiente
        expected = detalle_orden_compra.cantidad_solicitada - detalle_orden_compra.cantidad_recibida
        assert pendiente == expected

    def test_property_porcentaje_recibido(self, detalle_orden_compra):
        """Test propiedad porcentaje_recibido."""
        # Sin recibir
        assert detalle_orden_compra.porcentaje_recibido == Decimal('0.00')

        # Recibir 50%
        detalle_orden_compra.cantidad_recibida = Decimal('5.000')
        detalle_orden_compra.save()
        assert detalle_orden_compra.porcentaje_recibido == Decimal('50.00')

    def test_property_esta_completo(self, detalle_orden_compra):
        """Test propiedad esta_completo."""
        assert detalle_orden_compra.esta_completo is False

        detalle_orden_compra.cantidad_recibida = detalle_orden_compra.cantidad_solicitada
        detalle_orden_compra.save()
        assert detalle_orden_compra.esta_completo is True


# ==============================================================================
# TESTS DE CONTRATO
# ==============================================================================

@pytest.mark.django_db
class TestContrato:
    """Tests para modelo Contrato."""

    def test_crear_contrato(self, contrato):
        """Test creación de contrato."""
        assert contrato.pk is not None
        assert contrato.numero_contrato == 'CONT-2025-001'

    def test_str_representation(self, contrato):
        """Test representación en string."""
        str_repr = str(contrato)
        assert contrato.numero_contrato in str_repr

    def test_property_esta_vigente(self, contrato):
        """Test propiedad esta_vigente."""
        assert contrato.esta_vigente is True

        # Contrato vencido
        contrato.fecha_fin = date.today() - timedelta(days=1)
        contrato.save()
        assert contrato.esta_vigente is False

    def test_property_dias_restantes(self, contrato):
        """Test propiedad dias_restantes."""
        dias = contrato.dias_restantes
        assert dias > 0

    def test_property_puede_generar_ordenes(self, contrato):
        """Test propiedad puede_generar_ordenes."""
        assert contrato.puede_generar_ordenes is True


# ==============================================================================
# TESTS DE RECEPCION
# ==============================================================================

@pytest.mark.django_db
class TestRecepcionCompra:
    """Tests para modelo RecepcionCompra."""

    def test_crear_recepcion(self, recepcion_compra):
        """Test creación de recepción."""
        assert recepcion_compra.pk is not None
        assert recepcion_compra.numero_remision == 'REM-001'

    def test_str_representation(self, recepcion_compra):
        """Test representación en string."""
        str_repr = str(recepcion_compra)
        assert recepcion_compra.numero_remision in str_repr

    def test_property_material_conforme(self, recepcion_compra):
        """Test propiedad material_conforme."""
        assert recepcion_compra.material_conforme is True

    def test_property_requiere_accion(self, recepcion_compra):
        """Test propiedad requiere_accion."""
        assert recepcion_compra.requiere_accion is False

    def test_validacion_cantidad_cero(self, orden_compra, estado_material_conforme, usuario):
        """Test validación de cantidad cero."""
        recepcion = RecepcionCompra(
            orden_compra=orden_compra,
            numero_remision='REM-TEST',
            fecha_recepcion=timezone.now(),
            recibido_por=usuario,
            cantidad_recibida=Decimal('0.000'),
            estado_material=estado_material_conforme
        )

        with pytest.raises(ValidationError) as exc_info:
            recepcion.full_clean()

        assert 'cantidad_recibida' in exc_info.value.error_dict

    def test_validacion_orden_no_permite_recepcion(self, orden_compra, estado_material_conforme, usuario):
        """Test validación de orden que no permite recepción."""
        # Estado BORRADOR no permite recepción
        recepcion = RecepcionCompra(
            orden_compra=orden_compra,
            numero_remision='REM-TEST',
            fecha_recepcion=timezone.now(),
            recibido_por=usuario,
            cantidad_recibida=Decimal('10.000'),
            estado_material=estado_material_conforme
        )

        with pytest.raises(ValidationError) as exc_info:
            recepcion.full_clean()

        assert 'orden_compra' in exc_info.value.error_dict
