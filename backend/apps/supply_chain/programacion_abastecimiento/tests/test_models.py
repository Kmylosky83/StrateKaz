"""
Tests para modelos de Programacion de Abastecimiento
=====================================================

Tests completos para validaciones, métodos y propiedades de:
- TipoOperacion
- EstadoProgramacion
- UnidadMedida
- EstadoEjecucion
- EstadoLiquidacion
- Programacion
- AsignacionRecurso
- Ejecucion
- Liquidacion

Autor: Sistema ERP StrateKaz
Fecha: 27 Diciembre 2025
"""
import pytest
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.core.exceptions import ValidationError

from apps.supply_chain.programacion_abastecimiento.models import (
    TipoOperacion,
    EstadoProgramacion,
    UnidadMedida,
    EstadoEjecucion,
    EstadoLiquidacion,
    Programacion,
    AsignacionRecurso,
    Ejecucion,
    Liquidacion,
)


# ==============================================================================
# TESTS DE CATÁLOGOS
# ==============================================================================

@pytest.mark.django_db
class TestTipoOperacion:
    """Tests para modelo TipoOperacion."""

    def test_crear_tipo_operacion(self, tipo_operacion_recoleccion):
        """Test creación de tipo de operación."""
        assert tipo_operacion_recoleccion.pk is not None
        assert tipo_operacion_recoleccion.codigo == 'RECOLECCION'
        assert tipo_operacion_recoleccion.requiere_vehiculo is True
        assert tipo_operacion_recoleccion.requiere_conductor is True

    def test_str_representation(self, tipo_operacion_recoleccion):
        """Test representación en string."""
        assert str(tipo_operacion_recoleccion) == 'Recolección de Materia Prima'

    def test_codigo_unico(self, db):
        """Test que el código es único."""
        TipoOperacion.objects.create(codigo='TEST', nombre='Test 1')
        with pytest.raises(Exception):
            TipoOperacion.objects.create(codigo='TEST', nombre='Test 2')


@pytest.mark.django_db
class TestEstadoProgramacion:
    """Tests para modelo EstadoProgramacion."""

    def test_crear_estado(self, estado_programacion_pendiente):
        """Test creación de estado."""
        assert estado_programacion_pendiente.pk is not None
        assert estado_programacion_pendiente.es_estado_inicial is True
        assert estado_programacion_pendiente.es_estado_final is False

    def test_estado_final(self, estado_programacion_completada):
        """Test estado final."""
        assert estado_programacion_completada.es_estado_final is True


@pytest.mark.django_db
class TestUnidadMedida:
    """Tests para modelo UnidadMedida."""

    def test_crear_unidad_medida(self, unidad_medida_kg):
        """Test creación de unidad de medida."""
        assert unidad_medida_kg.pk is not None
        assert unidad_medida_kg.codigo == 'KG'
        assert unidad_medida_kg.simbolo == 'kg'

    def test_str_representation(self, unidad_medida_kg):
        """Test representación en string."""
        assert str(unidad_medida_kg) == 'Kilogramos (kg)'

    def test_factor_conversion(self, unidad_medida_ton):
        """Test factor de conversión."""
        assert unidad_medida_ton.factor_conversion_kg == Decimal('1000.0000')


# ==============================================================================
# TESTS DE PROGRAMACION
# ==============================================================================

@pytest.mark.django_db
class TestProgramacion:
    """Tests para modelo Programacion."""

    def test_crear_programacion(self, programacion):
        """Test creación de programación."""
        assert programacion.pk is not None
        assert programacion.codigo is not None
        assert programacion.codigo.startswith('PROG-')

    def test_codigo_autogenerado(self, empresa, sede, tipo_operacion_recoleccion,
                                  estado_programacion_pendiente, proveedor, usuario):
        """Test que el código se genera automáticamente."""
        prog = Programacion.objects.create(
            empresa=empresa,
            sede=sede,
            tipo_operacion=tipo_operacion_recoleccion,
            fecha_programada=timezone.now() + timedelta(days=1),
            proveedor=proveedor,
            responsable=usuario,
            estado=estado_programacion_pendiente,
            created_by=usuario
        )
        assert prog.codigo is not None
        assert len(prog.codigo) > 0

    def test_str_representation(self, programacion):
        """Test representación en string."""
        str_repr = str(programacion)
        assert programacion.codigo in str_repr
        assert programacion.proveedor.nombre_comercial in str_repr

    def test_soft_delete(self, programacion):
        """Test eliminación lógica."""
        assert programacion.deleted_at is None
        assert programacion.is_deleted is False

        programacion.soft_delete()
        assert programacion.deleted_at is not None
        assert programacion.is_deleted is True

    def test_restore(self, programacion):
        """Test restauración después de soft delete."""
        programacion.soft_delete()
        assert programacion.is_deleted is True

        programacion.restore()
        assert programacion.deleted_at is None
        assert programacion.is_deleted is False

    def test_tiene_ejecucion(self, programacion, ejecucion):
        """Test propiedad tiene_ejecucion."""
        # Asignar ejecución a la programación
        ejecucion.programacion = programacion
        ejecucion.save()
        programacion.refresh_from_db()

        assert programacion.tiene_ejecucion is True

    def test_tiene_liquidacion(self, programacion, ejecucion, liquidacion):
        """Test propiedad tiene_liquidacion."""
        ejecucion.programacion = programacion
        ejecucion.save()
        liquidacion.ejecucion = ejecucion
        liquidacion.save()
        programacion.refresh_from_db()

        assert programacion.tiene_liquidacion is True

    def test_validacion_proveedor_inactivo(self, programacion, proveedor):
        """Test validación de proveedor inactivo."""
        proveedor.is_active = False
        proveedor.save()

        programacion.proveedor = proveedor
        with pytest.raises(ValidationError) as exc_info:
            programacion.full_clean()

        assert 'proveedor' in exc_info.value.error_dict

    def test_validacion_sede_inactiva(self, programacion, sede):
        """Test validación de sede inactiva."""
        sede.is_active = False
        sede.save()

        programacion.sede = sede
        with pytest.raises(ValidationError) as exc_info:
            programacion.full_clean()

        assert 'sede' in exc_info.value.error_dict


# ==============================================================================
# TESTS DE ASIGNACION RECURSO
# ==============================================================================

@pytest.mark.django_db
class TestAsignacionRecurso:
    """Tests para modelo AsignacionRecurso."""

    def test_crear_asignacion(self, asignacion_recurso):
        """Test creación de asignación de recurso."""
        assert asignacion_recurso.pk is not None
        assert asignacion_recurso.vehiculo == 'ABC-123'
        assert asignacion_recurso.conductor is not None

    def test_str_representation(self, asignacion_recurso):
        """Test representación en string."""
        str_repr = str(asignacion_recurso)
        assert asignacion_recurso.programacion.codigo in str_repr
        assert 'ABC-123' in str_repr

    def test_validacion_requiere_vehiculo(self, programacion, tipo_operacion_recoleccion, usuario):
        """Test validación de vehículo requerido."""
        # tipo_operacion_recoleccion requiere vehículo
        asignacion = AsignacionRecurso(
            programacion=programacion,
            vehiculo=None,  # No se asigna vehículo
            conductor=usuario,
            asignado_por=usuario
        )

        with pytest.raises(ValidationError) as exc_info:
            asignacion.full_clean()

        assert 'vehiculo' in exc_info.value.error_dict

    def test_validacion_requiere_conductor(self, programacion, tipo_operacion_recoleccion, usuario):
        """Test validación de conductor requerido."""
        asignacion = AsignacionRecurso(
            programacion=programacion,
            vehiculo='ABC-123',
            conductor=None,  # No se asigna conductor
            asignado_por=usuario
        )

        with pytest.raises(ValidationError) as exc_info:
            asignacion.full_clean()

        assert 'conductor' in exc_info.value.error_dict

    def test_operacion_sin_requerimientos(self, programacion, tipo_operacion_compra_directa, usuario):
        """Test operación que no requiere vehículo ni conductor."""
        programacion.tipo_operacion = tipo_operacion_compra_directa
        programacion.save()

        asignacion = AsignacionRecurso.objects.create(
            programacion=programacion,
            vehiculo=None,
            conductor=None,
            asignado_por=usuario
        )

        assert asignacion.pk is not None


# ==============================================================================
# TESTS DE EJECUCION
# ==============================================================================

@pytest.mark.django_db
class TestEjecucion:
    """Tests para modelo Ejecucion."""

    def test_crear_ejecucion(self, ejecucion):
        """Test creación de ejecución."""
        assert ejecucion.pk is not None
        assert ejecucion.cantidad_recolectada == Decimal('500.000')

    def test_str_representation(self, ejecucion):
        """Test representación en string."""
        str_repr = str(ejecucion)
        assert ejecucion.programacion.codigo in str_repr
        assert '500' in str_repr

    def test_kilometros_recorridos(self, ejecucion):
        """Test cálculo de kilómetros recorridos."""
        km = ejecucion.kilometros_recorridos
        assert km == Decimal('50.00')

    def test_duracion_horas(self, ejecucion):
        """Test cálculo de duración en horas."""
        duracion = ejecucion.duracion_horas
        assert duracion is not None
        assert duracion >= 0

    def test_tiene_liquidacion(self, ejecucion, liquidacion):
        """Test propiedad tiene_liquidacion."""
        liquidacion.ejecucion = ejecucion
        liquidacion.save()
        ejecucion.refresh_from_db()

        assert ejecucion.tiene_liquidacion is True

    def test_validacion_fecha_fin_anterior(self, programacion, unidad_medida_kg,
                                           estado_ejecucion_completada, usuario):
        """Test validación de fecha fin anterior a fecha inicio."""
        now = timezone.now()
        ejecucion = Ejecucion(
            programacion=programacion,
            fecha_inicio=now,
            fecha_fin=now - timedelta(hours=1),  # Fecha fin anterior a inicio
            cantidad_recolectada=Decimal('100.000'),
            unidad_medida=unidad_medida_kg,
            estado=estado_ejecucion_completada,
            ejecutado_por=usuario
        )

        with pytest.raises(ValidationError) as exc_info:
            ejecucion.full_clean()

        assert 'fecha_fin' in exc_info.value.error_dict

    def test_validacion_kilometraje_final_menor(self, programacion, unidad_medida_kg,
                                                 estado_ejecucion_completada, usuario):
        """Test validación de kilometraje final menor al inicial."""
        ejecucion = Ejecucion(
            programacion=programacion,
            fecha_inicio=timezone.now() - timedelta(hours=2),
            fecha_fin=timezone.now(),
            kilometraje_inicial=Decimal('10000.00'),
            kilometraje_final=Decimal('9500.00'),  # Menor al inicial
            cantidad_recolectada=Decimal('100.000'),
            unidad_medida=unidad_medida_kg,
            estado=estado_ejecucion_completada,
            ejecutado_por=usuario
        )

        with pytest.raises(ValidationError) as exc_info:
            ejecucion.full_clean()

        assert 'kilometraje_final' in exc_info.value.error_dict

    def test_validacion_cantidad_cero(self, programacion, unidad_medida_kg,
                                      estado_ejecucion_completada, usuario):
        """Test validación de cantidad cero o negativa."""
        ejecucion = Ejecucion(
            programacion=programacion,
            fecha_inicio=timezone.now() - timedelta(hours=2),
            fecha_fin=timezone.now(),
            cantidad_recolectada=Decimal('0.000'),  # Cero
            unidad_medida=unidad_medida_kg,
            estado=estado_ejecucion_completada,
            ejecutado_por=usuario
        )

        with pytest.raises(ValidationError) as exc_info:
            ejecucion.full_clean()

        assert 'cantidad_recolectada' in exc_info.value.error_dict


# ==============================================================================
# TESTS DE LIQUIDACION
# ==============================================================================

@pytest.mark.django_db
class TestLiquidacion:
    """Tests para modelo Liquidacion."""

    def test_crear_liquidacion(self, liquidacion):
        """Test creación de liquidación."""
        assert liquidacion.pk is not None
        assert liquidacion.precio_unitario == Decimal('2500.00')
        assert liquidacion.cantidad == Decimal('500.000')

    def test_calcular_totales(self, liquidacion):
        """Test cálculo de subtotal y valor total."""
        # subtotal = precio_unitario * cantidad
        # valor_total = subtotal - deducciones
        expected_subtotal = Decimal('2500.00') * Decimal('500.000')
        expected_total = expected_subtotal - Decimal('0.00')

        assert liquidacion.subtotal == expected_subtotal
        assert liquidacion.valor_total == expected_total

    def test_calcular_totales_con_deducciones(self, ejecucion, estado_liquidacion_pendiente, usuario):
        """Test cálculo con deducciones."""
        liquidacion = Liquidacion.objects.create(
            ejecucion=ejecucion,
            precio_unitario=Decimal('2500.00'),
            cantidad=Decimal('500.000'),
            deducciones=Decimal('50000.00'),
            liquidado_por=usuario,
            estado=estado_liquidacion_pendiente
        )

        expected_subtotal = Decimal('2500.00') * Decimal('500.000')
        expected_total = expected_subtotal - Decimal('50000.00')

        assert liquidacion.subtotal == expected_subtotal
        assert liquidacion.valor_total == expected_total

    def test_str_representation(self, liquidacion):
        """Test representación en string."""
        str_repr = str(liquidacion)
        assert liquidacion.ejecucion.programacion.codigo in str_repr

    def test_property_proveedor(self, liquidacion):
        """Test propiedad proveedor."""
        proveedor = liquidacion.proveedor
        assert proveedor is not None
        assert proveedor == liquidacion.ejecucion.programacion.proveedor

    def test_property_puede_editar(self, liquidacion):
        """Test propiedad puede_editar."""
        # Estado PENDIENTE permite edición
        assert liquidacion.puede_editar is True

    def test_property_esta_aprobada(self, liquidacion):
        """Test propiedad esta_aprobada."""
        assert liquidacion.esta_aprobada is False

        # Aprobar
        liquidacion.aprobado_por = liquidacion.liquidado_por
        liquidacion.fecha_aprobacion = timezone.now()
        liquidacion.save()

        assert liquidacion.esta_aprobada is True

    def test_metodo_aprobar(self, liquidacion, usuario, estado_liquidacion_aprobada):
        """Test método aprobar."""
        assert liquidacion.aprobado_por is None
        assert liquidacion.fecha_aprobacion is None

        liquidacion.aprobar(usuario)

        assert liquidacion.aprobado_por == usuario
        assert liquidacion.fecha_aprobacion is not None
        assert liquidacion.estado == estado_liquidacion_aprobada

    def test_validacion_cantidad_diferente(self, ejecucion, estado_liquidacion_pendiente, usuario):
        """Test validación de cantidad diferente a la recolectada."""
        liquidacion = Liquidacion(
            ejecucion=ejecucion,
            precio_unitario=Decimal('2500.00'),
            cantidad=Decimal('400.000'),  # Diferente a cantidad recolectada (500)
            deducciones=Decimal('0.00'),
            liquidado_por=usuario,
            estado=estado_liquidacion_pendiente
        )

        with pytest.raises(ValidationError) as exc_info:
            liquidacion.full_clean()

        assert 'cantidad' in exc_info.value.error_dict

    def test_validacion_precio_negativo(self, ejecucion, estado_liquidacion_pendiente, usuario):
        """Test validación de precio negativo."""
        liquidacion = Liquidacion(
            ejecucion=ejecucion,
            precio_unitario=Decimal('-100.00'),  # Precio negativo
            cantidad=ejecucion.cantidad_recolectada,
            deducciones=Decimal('0.00'),
            liquidado_por=usuario,
            estado=estado_liquidacion_pendiente
        )

        with pytest.raises(ValidationError) as exc_info:
            liquidacion.full_clean()

        assert 'precio_unitario' in exc_info.value.error_dict

    def test_validacion_deducciones_mayores_subtotal(self, ejecucion, estado_liquidacion_pendiente, usuario):
        """Test validación de deducciones mayores al subtotal."""
        liquidacion = Liquidacion(
            ejecucion=ejecucion,
            precio_unitario=Decimal('2500.00'),
            cantidad=ejecucion.cantidad_recolectada,
            deducciones=Decimal('2000000.00'),  # Mayor al subtotal
            liquidado_por=usuario,
            estado=estado_liquidacion_pendiente
        )

        with pytest.raises(ValidationError) as exc_info:
            liquidacion.full_clean()

        assert 'deducciones' in exc_info.value.error_dict

    def test_validacion_edicion_estado_no_editable(self, liquidacion, estado_liquidacion_aprobada):
        """Test validación de edición en estado no editable."""
        # Cambiar a estado APROBADA (no permite edición)
        liquidacion.estado = estado_liquidacion_aprobada
        liquidacion.save()

        # Intentar cambiar precio
        liquidacion_db = Liquidacion.objects.get(pk=liquidacion.pk)
        liquidacion_db.precio_unitario = Decimal('3000.00')

        with pytest.raises(ValidationError):
            liquidacion_db.full_clean()
