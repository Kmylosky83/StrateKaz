"""
Tests para modelos de Gestión de Transporte
============================================

Tests completos para validaciones, métodos y propiedades de:
- Catálogos (TipoRuta, EstadoDespacho)
- Ruta y Conductor
- ProgramacionRuta
- Despacho y DetalleDespacho
- Manifiesto

Autor: Sistema ERP StrateKaz
Fecha: 28 Diciembre 2025
"""
import pytest
from decimal import Decimal
from datetime import date, timedelta, time
from django.utils import timezone
from django.core.exceptions import ValidationError

from apps.logistics_fleet.gestion_transporte.models import (
    TipoRuta,
    EstadoDespacho,
    Ruta,
    Conductor,
    ProgramacionRuta,
    Despacho,
    DetalleDespacho,
    Manifiesto,
)


# ==============================================================================
# TESTS DE CATÁLOGOS
# ==============================================================================

@pytest.mark.django_db
class TestTipoRuta:
    """Tests para modelo TipoRuta."""

    def test_crear_tipo_ruta(self, tipo_ruta_recoleccion):
        """Test creación de tipo de ruta."""
        assert tipo_ruta_recoleccion.pk is not None
        assert tipo_ruta_recoleccion.codigo == 'RECOLECCION'
        assert tipo_ruta_recoleccion.es_recoleccion is True

    def test_str_representation(self, tipo_ruta_recoleccion):
        """Test representación en string."""
        assert str(tipo_ruta_recoleccion) == tipo_ruta_recoleccion.nombre


@pytest.mark.django_db
class TestEstadoDespacho:
    """Tests para modelo EstadoDespacho."""

    def test_crear_estado(self, estado_despacho_programado):
        """Test creación de estado."""
        assert estado_despacho_programado.pk is not None
        assert estado_despacho_programado.codigo == 'PROGRAMADO'
        assert estado_despacho_programado.permite_edicion is True

    def test_str_representation(self, estado_despacho_programado):
        """Test representación en string."""
        assert str(estado_despacho_programado) == estado_despacho_programado.nombre


# ==============================================================================
# TESTS DE RUTA
# ==============================================================================

@pytest.mark.django_db
class TestRuta:
    """Tests para modelo Ruta."""

    def test_crear_ruta(self, ruta):
        """Test creación de ruta."""
        assert ruta.pk is not None
        assert ruta.codigo == 'RUT-001'
        assert ruta.nombre == 'Ruta Bogotá - Soacha'
        assert ruta.distancia_km == Decimal('25.50')

    def test_str_representation(self, ruta):
        """Test representación en string."""
        expected = f"{ruta.codigo} - {ruta.nombre}"
        assert str(ruta) == expected

    def test_validacion_distancia_negativa(self, empresa, tipo_ruta_entrega, usuario):
        """Test validación de distancia negativa."""
        ruta_invalida = Ruta(
            empresa=empresa,
            codigo='RUT-INV',
            nombre='Ruta Inválida',
            tipo_ruta=tipo_ruta_entrega,
            origen_ciudad='Bogotá',
            destino_ciudad='Soacha',
            distancia_km=Decimal('-10.00'),  # Error: distancia negativa
            created_by=usuario
        )

        with pytest.raises(ValidationError) as exc_info:
            ruta_invalida.full_clean()

        assert 'distancia_km' in exc_info.value.error_dict


# ==============================================================================
# TESTS DE CONDUCTOR
# ==============================================================================

@pytest.mark.django_db
class TestConductor:
    """Tests para modelo Conductor."""

    def test_crear_conductor(self, conductor):
        """Test creación de conductor."""
        assert conductor.pk is not None
        assert conductor.nombre_completo == 'Juan Pérez Conductor'
        assert conductor.licencia_conduccion == 'C1-12345678'
        assert conductor.es_empleado is True

    def test_str_representation(self, conductor):
        """Test representación en string."""
        expected = f"{conductor.nombre_completo} - {conductor.licencia_conduccion}"
        assert str(conductor) == expected

    def test_property_licencia_vigente(self, conductor):
        """Test propiedad licencia_vigente."""
        # Licencia vence en 365 días
        assert conductor.licencia_vigente is True

    def test_property_licencia_vencida(self, empresa, usuario):
        """Test propiedad licencia_vigente con licencia vencida."""
        conductor_vencido = Conductor.objects.create(
            empresa=empresa,
            nombre_completo='Pedro Vencido',
            tipo_documento='CC',
            documento_identidad='9999999999',
            licencia_conduccion='C1-99999999',
            categoria_licencia='C1',
            fecha_vencimiento_licencia=date.today() - timedelta(days=1),  # Vencida
            es_empleado=True,
            created_by=usuario
        )

        assert conductor_vencido.licencia_vigente is False

    def test_property_esta_activo(self, conductor):
        """Test propiedad esta_activo."""
        # Conductor con licencia vigente y is_active=True
        assert conductor.esta_activo is True

    def test_conductor_tercero(self, conductor_tercero):
        """Test conductor tercero."""
        assert conductor_tercero.es_empleado is False
        assert conductor_tercero.empresa_transportadora == 'Transportes XYZ S.A.S.'


# ==============================================================================
# TESTS DE PROGRAMACION RUTA
# ==============================================================================

@pytest.mark.django_db
class TestProgramacionRuta:
    """Tests para modelo ProgramacionRuta."""

    def test_crear_programacion(self, programacion_ruta):
        """Test creación de programación de ruta."""
        assert programacion_ruta.pk is not None
        assert programacion_ruta.codigo is not None
        assert programacion_ruta.codigo.startswith('PRG-')
        assert programacion_ruta.estado == 'PROGRAMADA'

    def test_str_representation(self, programacion_ruta):
        """Test representación en string."""
        str_repr = str(programacion_ruta)
        assert programacion_ruta.codigo in str_repr
        assert programacion_ruta.ruta.nombre in str_repr

    def test_codigo_autogenerado(self, empresa, ruta, vehiculo, conductor, usuario):
        """Test que el código se genera automáticamente."""
        prog = ProgramacionRuta.objects.create(
            empresa=empresa,
            ruta=ruta,
            vehiculo=vehiculo,
            conductor=conductor,
            fecha_programada=date.today() + timedelta(days=1),
            hora_salida_programada=time(10, 0),
            estado='PROGRAMADA',
            programado_por=usuario,
            created_by=usuario
        )

        assert prog.codigo is not None
        assert prog.codigo.startswith('PRG-')

    def test_property_duracion_real(self, programacion_en_curso):
        """Test propiedad duracion_real."""
        # Programación iniciada hace 2 horas
        duracion = programacion_en_curso.duracion_real
        assert duracion is not None
        assert duracion.total_seconds() > 0

    def test_property_km_recorridos(self, programacion_en_curso):
        """Test propiedad km_recorridos."""
        programacion_en_curso.km_final = Decimal('30500.00')
        programacion_en_curso.save()

        km = programacion_en_curso.km_recorridos
        assert km == Decimal('500.00')  # 30500 - 30000

    def test_validacion_fecha_pasada(self, empresa, ruta, vehiculo, conductor, usuario):
        """Test validación de fecha programada en el pasado."""
        prog = ProgramacionRuta(
            empresa=empresa,
            ruta=ruta,
            vehiculo=vehiculo,
            conductor=conductor,
            fecha_programada=date.today() - timedelta(days=1),  # Error: fecha pasada
            hora_salida_programada=time(8, 0),
            estado='PROGRAMADA',
            programado_por=usuario
        )

        with pytest.raises(ValidationError) as exc_info:
            prog.full_clean()

        assert 'fecha_programada' in exc_info.value.error_dict


# ==============================================================================
# TESTS DE DESPACHO
# ==============================================================================

@pytest.mark.django_db
class TestDespacho:
    """Tests para modelo Despacho."""

    def test_crear_despacho(self, despacho):
        """Test creación de despacho."""
        assert despacho.pk is not None
        assert despacho.codigo is not None
        assert despacho.codigo.startswith('DESP-')
        assert despacho.cliente_nombre == 'Carnicería El Buen Sabor'

    def test_str_representation(self, despacho):
        """Test representación en string."""
        str_repr = str(despacho)
        assert despacho.codigo in str_repr
        assert despacho.cliente_nombre in str_repr

    def test_codigo_autogenerado(self, empresa, programacion_ruta, estado_despacho_programado, usuario):
        """Test que el código se genera automáticamente."""
        desp = Despacho.objects.create(
            empresa=empresa,
            programacion_ruta=programacion_ruta,
            estado_despacho=estado_despacho_programado,
            cliente_nombre='Cliente Test',
            peso_total_kg=Decimal('100.00'),
            created_by=usuario
        )

        assert desp.codigo is not None
        assert desp.codigo.startswith('DESP-')

    def test_property_puede_editar(self, despacho):
        """Test propiedad puede_editar."""
        # Estado PROGRAMADO permite edición
        assert despacho.puede_editar is True

    def test_property_puede_editar_false(self, despacho, estado_despacho_en_transito):
        """Test propiedad puede_editar con estado no editable."""
        despacho.estado_despacho = estado_despacho_en_transito
        despacho.save()

        assert despacho.puede_editar is False

    def test_property_esta_finalizado(self, despacho, estado_despacho_entregado):
        """Test propiedad esta_finalizado."""
        # Despacho programado
        assert despacho.esta_finalizado is False

        # Despacho entregado
        despacho.estado_despacho = estado_despacho_entregado
        despacho.save()
        assert despacho.esta_finalizado is True

    def test_validacion_peso_negativo(self, empresa, programacion_ruta, estado_despacho_programado, usuario):
        """Test validación de peso negativo."""
        desp = Despacho(
            empresa=empresa,
            programacion_ruta=programacion_ruta,
            estado_despacho=estado_despacho_programado,
            cliente_nombre='Cliente Test',
            peso_total_kg=Decimal('-50.00'),  # Error: peso negativo
            created_by=usuario
        )

        with pytest.raises(ValidationError) as exc_info:
            desp.full_clean()

        assert 'peso_total_kg' in exc_info.value.error_dict


# ==============================================================================
# TESTS DE DETALLE DESPACHO
# ==============================================================================

@pytest.mark.django_db
class TestDetalleDespacho:
    """Tests para modelo DetalleDespacho."""

    def test_crear_detalle(self, detalle_despacho):
        """Test creación de detalle de despacho."""
        assert detalle_despacho.pk is not None
        assert detalle_despacho.descripcion_producto == 'Grasa Industrial Premium'
        assert detalle_despacho.cantidad == Decimal('100.00')

    def test_str_representation(self, detalle_despacho):
        """Test representación en string."""
        str_repr = str(detalle_despacho)
        assert detalle_despacho.despacho.codigo in str_repr
        assert detalle_despacho.descripcion_producto in str_repr

    def test_validacion_cantidad_cero(self, empresa, despacho, usuario):
        """Test validación de cantidad cero."""
        detalle = DetalleDespacho(
            empresa=empresa,
            despacho=despacho,
            descripcion_producto='Test',
            cantidad=Decimal('0.00'),  # Error: cantidad cero
            unidad_medida='kg',
            created_by=usuario
        )

        with pytest.raises(ValidationError) as exc_info:
            detalle.full_clean()

        assert 'cantidad' in exc_info.value.error_dict


# ==============================================================================
# TESTS DE MANIFIESTO
# ==============================================================================

@pytest.mark.django_db
class TestManifiesto:
    """Tests para modelo Manifiesto."""

    def test_crear_manifiesto(self, manifiesto):
        """Test creación de manifiesto."""
        assert manifiesto.pk is not None
        assert manifiesto.numero_manifiesto is not None
        assert manifiesto.numero_manifiesto.startswith('MAN-')
        assert manifiesto.remitente_nombre == 'Grasas y Huesos del Norte S.A.S.'

    def test_str_representation(self, manifiesto):
        """Test representación en string."""
        expected = f"{manifiesto.numero_manifiesto} - {manifiesto.destinatario_nombre}"
        assert str(manifiesto) == expected

    def test_numero_manifiesto_autogenerado(self, empresa, programacion_ruta, usuario):
        """Test que el número de manifiesto se genera automáticamente."""
        man = Manifiesto.objects.create(
            empresa=empresa,
            programacion_ruta=programacion_ruta,
            fecha_expedicion=timezone.now(),
            remitente_nombre='Test',
            destinatario_nombre='Test Dest',
            origen_ciudad='Bogotá',
            destino_ciudad='Soacha',
            descripcion_carga='Test',
            peso_kg=Decimal('100.00'),
            generado_por=usuario,
            created_by=usuario
        )

        assert man.numero_manifiesto is not None
        assert man.numero_manifiesto.startswith('MAN-')

    def test_validacion_peso_cero(self, empresa, programacion_ruta, usuario):
        """Test validación de peso cero."""
        man = Manifiesto(
            empresa=empresa,
            programacion_ruta=programacion_ruta,
            fecha_expedicion=timezone.now(),
            remitente_nombre='Test',
            destinatario_nombre='Test Dest',
            origen_ciudad='Bogotá',
            destino_ciudad='Soacha',
            descripcion_carga='Test',
            peso_kg=Decimal('0.00'),  # Error: peso cero
            generado_por=usuario
        )

        with pytest.raises(ValidationError) as exc_info:
            man.full_clean()

        assert 'peso_kg' in exc_info.value.error_dict
