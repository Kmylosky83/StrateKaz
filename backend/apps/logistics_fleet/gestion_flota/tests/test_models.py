"""
Tests para modelos de Gestión de Flota
=======================================

Tests completos para validaciones, métodos y propiedades de:
- Catálogos (TipoVehiculo, EstadoVehiculo)
- Vehiculo
- DocumentoVehiculo
- MantenimientoVehiculo
- CostoOperacion
- VerificacionTercero (PESV)

Autor: Sistema ERP StrateKaz
Fecha: 28 Diciembre 2025
"""
import pytest
from decimal import Decimal
from datetime import date, timedelta
from django.utils import timezone
from django.core.exceptions import ValidationError

from apps.logistics_fleet.gestion_flota.models import (
    TipoVehiculo,
    EstadoVehiculo,
    Vehiculo,
    DocumentoVehiculo,
    HojaVidaVehiculo,
    MantenimientoVehiculo,
    CostoOperacion,
    VerificacionTercero,
)


# ==============================================================================
# TESTS DE CATÁLOGOS
# ==============================================================================

@pytest.mark.django_db
class TestTipoVehiculo:
    """Tests para modelo TipoVehiculo."""

    def test_crear_tipo_vehiculo(self, tipo_vehiculo_camion):
        """Test creación de tipo de vehículo."""
        assert tipo_vehiculo_camion.pk is not None
        assert tipo_vehiculo_camion.codigo == 'CAMION_3TON'
        assert tipo_vehiculo_camion.requiere_licencia_especial is True
        assert tipo_vehiculo_camion.categoria_licencia == 'C1'

    def test_str_representation(self, tipo_vehiculo_camion):
        """Test representación en string."""
        expected = f"{tipo_vehiculo_camion.nombre} ({tipo_vehiculo_camion.codigo})"
        assert str(tipo_vehiculo_camion) == expected

    def test_validacion_licencia_especial_sin_categoria(self):
        """Test validación de licencia especial sin categoría."""
        tipo = TipoVehiculo(
            codigo='TEST',
            nombre='Test',
            requiere_licencia_especial=True,
            categoria_licencia=None  # Error: requiere categoría
        )

        with pytest.raises(ValidationError) as exc_info:
            tipo.full_clean()

        assert 'categoria_licencia' in exc_info.value.error_dict

    def test_tipo_refrigerado(self, tipo_vehiculo_furgon):
        """Test tipo de vehículo con refrigeración."""
        assert tipo_vehiculo_furgon.requiere_refrigeracion is True
        assert tipo_vehiculo_furgon.capacidad_kg == Decimal('1500.00')


@pytest.mark.django_db
class TestEstadoVehiculo:
    """Tests para modelo EstadoVehiculo."""

    def test_crear_estado(self, estado_disponible):
        """Test creación de estado."""
        assert estado_disponible.pk is not None
        assert estado_disponible.codigo == 'DISPONIBLE'
        assert estado_disponible.disponible_para_ruta is True

    def test_str_representation(self, estado_disponible):
        """Test representación en string."""
        assert str(estado_disponible) == estado_disponible.nombre

    def test_estado_mantenimiento(self, estado_mantenimiento):
        """Test estado que requiere mantenimiento."""
        assert estado_mantenimiento.requiere_mantenimiento is True
        assert estado_mantenimiento.disponible_para_ruta is False


# ==============================================================================
# TESTS DE VEHÍCULO
# ==============================================================================

@pytest.mark.django_db
class TestVehiculo:
    """Tests para modelo Vehiculo."""

    def test_crear_vehiculo(self, vehiculo):
        """Test creación de vehículo."""
        assert vehiculo.pk is not None
        assert vehiculo.placa == 'ABC123'
        assert vehiculo.marca == 'Chevrolet'
        assert vehiculo.modelo == 'NPR'
        assert vehiculo.es_propio is True

    def test_str_representation(self, vehiculo):
        """Test representación en string."""
        expected = f"{vehiculo.placa} - {vehiculo.marca} {vehiculo.modelo}"
        assert str(vehiculo) == expected

    def test_validacion_vin_longitud(self, empresa, tipo_vehiculo_camion, estado_disponible, usuario):
        """Test validación de longitud de VIN."""
        vehiculo = Vehiculo(
            empresa=empresa,
            placa='TEST123',
            tipo_vehiculo=tipo_vehiculo_camion,
            estado=estado_disponible,
            marca='Test',
            modelo='Test',
            anio=2020,
            capacidad_kg=Decimal('1000.00'),
            vin='123',  # VIN inválido: debe tener 17 caracteres
            es_propio=True,
            created_by=usuario
        )

        with pytest.raises(ValidationError) as exc_info:
            vehiculo.full_clean()

        assert 'vin' in exc_info.value.error_dict

    def test_validacion_propio_y_contratado(self, empresa, tipo_vehiculo_camion, estado_disponible, usuario):
        """Test validación: no puede ser propio y contratado."""
        vehiculo = Vehiculo(
            empresa=empresa,
            placa='TEST456',
            tipo_vehiculo=tipo_vehiculo_camion,
            estado=estado_disponible,
            marca='Test',
            modelo='Test',
            anio=2020,
            capacidad_kg=Decimal('1000.00'),
            es_propio=True,
            es_contratado=True,  # Error: no puede ser ambos
            created_by=usuario
        )

        with pytest.raises(ValidationError) as exc_info:
            vehiculo.full_clean()

        assert 'es_contratado' in exc_info.value.error_dict

    def test_property_dias_hasta_vencimiento_soat(self, vehiculo):
        """Test propiedad dias_hasta_vencimiento_soat."""
        dias = vehiculo.dias_hasta_vencimiento_soat
        expected = (vehiculo.fecha_soat - date.today()).days
        assert dias == expected

    def test_property_dias_hasta_vencimiento_tecnomecanica(self, vehiculo):
        """Test propiedad dias_hasta_vencimiento_tecnomecanica."""
        dias = vehiculo.dias_hasta_vencimiento_tecnomecanica
        expected = (vehiculo.fecha_tecnomecanica - date.today()).days
        assert dias == expected

    def test_property_documentos_al_dia(self, vehiculo):
        """Test propiedad documentos_al_dia."""
        # Vehículo con documentos vigentes
        assert vehiculo.documentos_al_dia is True

    def test_property_documentos_al_dia_vencidos(self, vehiculo_documentos_vencidos):
        """Test propiedad documentos_al_dia con documentos vencidos."""
        # Vehículo con SOAT vencido
        assert vehiculo_documentos_vencidos.documentos_al_dia is False

    def test_property_documentos_al_dia_sin_fechas(self, empresa, tipo_vehiculo_camion, estado_disponible, usuario):
        """Test propiedad documentos_al_dia sin fechas."""
        vehiculo = Vehiculo.objects.create(
            empresa=empresa,
            placa='SIN-DOC',
            tipo_vehiculo=tipo_vehiculo_camion,
            estado=estado_disponible,
            marca='Test',
            modelo='Test',
            anio=2020,
            capacidad_kg=Decimal('1000.00'),
            fecha_soat=None,
            fecha_tecnomecanica=None,
            created_by=usuario
        )

        assert vehiculo.documentos_al_dia is False

    def test_property_disponible_para_operar(self, vehiculo):
        """Test propiedad disponible_para_operar."""
        # Vehículo activo, estado disponible y documentos al día
        assert vehiculo.disponible_para_operar is True

    def test_property_disponible_para_operar_documentos_vencidos(self, vehiculo_documentos_vencidos):
        """Test disponible_para_operar con documentos vencidos."""
        # Vehículo con SOAT vencido
        assert vehiculo_documentos_vencidos.disponible_para_operar is False

    def test_property_disponible_para_operar_estado_no_disponible(self, vehiculo, estado_mantenimiento):
        """Test disponible_para_operar con estado no disponible."""
        vehiculo.estado = estado_mantenimiento
        vehiculo.save()

        assert vehiculo.disponible_para_operar is False


# ==============================================================================
# TESTS DE DOCUMENTO VEHÍCULO
# ==============================================================================

@pytest.mark.django_db
class TestDocumentoVehiculo:
    """Tests para modelo DocumentoVehiculo."""

    def test_crear_documento(self, documento_soat):
        """Test creación de documento."""
        assert documento_soat.pk is not None
        assert documento_soat.tipo_documento == 'SOAT'
        assert documento_soat.numero_documento == 'SOAT-2025-001'

    def test_str_representation(self, documento_soat):
        """Test representación en string."""
        expected = f"{documento_soat.vehiculo.placa} - {documento_soat.get_tipo_documento_display()}"
        assert str(documento_soat) == expected

    def test_property_dias_hasta_vencimiento(self, documento_soat):
        """Test propiedad dias_hasta_vencimiento."""
        dias = documento_soat.dias_hasta_vencimiento
        expected = (documento_soat.fecha_vencimiento - date.today()).days
        assert dias == expected

    def test_property_esta_vencido(self, documento_vencido):
        """Test propiedad esta_vencido."""
        assert documento_vencido.esta_vencido is True

    def test_property_esta_vencido_vigente(self, documento_soat):
        """Test propiedad esta_vencido con documento vigente."""
        assert documento_soat.esta_vencido is False

    def test_property_proximo_a_vencer(self, empresa, vehiculo, usuario):
        """Test propiedad proximo_a_vencer."""
        # Documento que vence en 15 días
        doc = DocumentoVehiculo.objects.create(
            empresa=empresa,
            vehiculo=vehiculo,
            tipo_documento='SOAT',
            numero_documento='SOAT-PROXIMO',
            fecha_expedicion=date.today() - timedelta(days=300),
            fecha_vencimiento=date.today() + timedelta(days=15),
            created_by=usuario
        )

        assert doc.proximo_a_vencer is True

    def test_property_proximo_a_vencer_no_proximo(self, documento_soat):
        """Test propiedad proximo_a_vencer con documento no próximo."""
        # Documento que vence en 60 días
        assert documento_soat.proximo_a_vencer is False

    def test_validacion_fecha_vencimiento_anterior(self, empresa, vehiculo, usuario):
        """Test validación de fecha vencimiento anterior a expedición."""
        doc = DocumentoVehiculo(
            empresa=empresa,
            vehiculo=vehiculo,
            tipo_documento='SOAT',
            numero_documento='SOAT-INVALIDO',
            fecha_expedicion=date.today(),
            fecha_vencimiento=date.today() - timedelta(days=1),  # Error
            created_by=usuario
        )

        with pytest.raises(ValidationError) as exc_info:
            doc.full_clean()

        assert 'fecha_vencimiento' in exc_info.value.error_dict


# ==============================================================================
# TESTS DE MANTENIMIENTO
# ==============================================================================

@pytest.mark.django_db
class TestMantenimientoVehiculo:
    """Tests para modelo MantenimientoVehiculo."""

    def test_crear_mantenimiento(self, mantenimiento_programado):
        """Test creación de mantenimiento."""
        assert mantenimiento_programado.pk is not None
        assert mantenimiento_programado.tipo == 'PREVENTIVO'
        assert mantenimiento_programado.estado == 'PROGRAMADO'

    def test_str_representation(self, mantenimiento_programado):
        """Test representación en string."""
        str_repr = str(mantenimiento_programado)
        assert mantenimiento_programado.vehiculo.placa in str_repr
        assert mantenimiento_programado.get_tipo_display() in str_repr

    def test_calcular_costo_total(self, mantenimiento_programado):
        """Test cálculo automático de costo total."""
        expected = mantenimiento_programado.costo_mano_obra + mantenimiento_programado.costo_repuestos
        assert mantenimiento_programado.costo_total == expected

    def test_property_esta_vencido_true(self, mantenimiento_vencido):
        """Test propiedad esta_vencido con mantenimiento vencido."""
        assert mantenimiento_vencido.esta_vencido is True

    def test_property_esta_vencido_false(self, mantenimiento_programado):
        """Test propiedad esta_vencido con mantenimiento futuro."""
        assert mantenimiento_programado.esta_vencido is False

    def test_property_esta_vencido_completado(self, mantenimiento_completado):
        """Test propiedad esta_vencido con mantenimiento completado."""
        # Los completados nunca están vencidos
        assert mantenimiento_completado.esta_vencido is False

    def test_validacion_fecha_ejecucion_anterior(self, empresa, vehiculo, usuario):
        """Test validación de fecha ejecución anterior a programada."""
        mant = MantenimientoVehiculo(
            empresa=empresa,
            vehiculo=vehiculo,
            tipo='PREVENTIVO',
            descripcion='Test',
            fecha_programada=date.today(),
            fecha_ejecucion=date.today() - timedelta(days=1),  # Error
            km_mantenimiento=50000,
            estado='COMPLETADO'
        )

        with pytest.raises(ValidationError) as exc_info:
            mant.full_clean()

        assert 'fecha_ejecucion' in exc_info.value.error_dict


# ==============================================================================
# TESTS DE COSTO OPERACIÓN
# ==============================================================================

@pytest.mark.django_db
class TestCostoOperacion:
    """Tests para modelo CostoOperacion."""

    def test_crear_costo(self, costo_combustible):
        """Test creación de costo."""
        assert costo_combustible.pk is not None
        assert costo_combustible.tipo_costo == 'COMBUSTIBLE'
        assert costo_combustible.valor == Decimal('250000.00')

    def test_str_representation(self, costo_combustible):
        """Test representación en string."""
        str_repr = str(costo_combustible)
        assert costo_combustible.vehiculo.placa in str_repr
        assert costo_combustible.get_tipo_costo_display() in str_repr

    def test_calcular_consumo_km_litro(self, costo_combustible):
        """Test cálculo automático de consumo km/litro."""
        # 500 km / 50 litros = 10 km/litro
        expected = Decimal('500') / Decimal('50.00')
        assert costo_combustible.consumo_km_litro == expected

    def test_property_costo_por_km(self, costo_combustible):
        """Test propiedad costo_por_km."""
        # 250000 / 500 km = 500 por km
        expected = costo_combustible.valor / Decimal('500')
        assert costo_combustible.costo_por_km == expected

    def test_property_costo_por_km_sin_km(self, costo_peaje):
        """Test propiedad costo_por_km sin kilómetros."""
        # Peaje sin km_recorridos
        assert costo_peaje.costo_por_km is None

    def test_costo_sin_calculo_consumo(self, costo_lavado):
        """Test costo sin cálculo de consumo (no es combustible)."""
        assert costo_lavado.consumo_km_litro is None


# ==============================================================================
# TESTS DE VERIFICACIÓN TERCERO (PESV)
# ==============================================================================

@pytest.mark.django_db
class TestVerificacionTercero:
    """Tests para modelo VerificacionTercero."""

    def test_crear_verificacion(self, verificacion_preoperacional):
        """Test creación de verificación."""
        assert verificacion_preoperacional.pk is not None
        assert verificacion_preoperacional.tipo == 'PREOPERACIONAL_DIARIA'
        assert verificacion_preoperacional.resultado == 'APROBADO'

    def test_str_representation(self, verificacion_preoperacional):
        """Test representación en string."""
        str_repr = str(verificacion_preoperacional)
        assert verificacion_preoperacional.vehiculo.placa in str_repr
        assert verificacion_preoperacional.get_tipo_display() in str_repr

    def test_property_requiere_accion_inmediata(self, verificacion_rechazada):
        """Test propiedad requiere_accion_inmediata."""
        assert verificacion_rechazada.requiere_accion_inmediata is True

    def test_property_requiere_accion_inmediata_aprobada(self, verificacion_preoperacional):
        """Test propiedad requiere_accion_inmediata con verificación aprobada."""
        assert verificacion_preoperacional.requiere_accion_inmediata is False

    def test_property_porcentaje_cumplimiento_perfecto(self, verificacion_preoperacional):
        """Test propiedad porcentaje_cumplimiento con 100%."""
        # 5 items, todos cumplen = 100%
        assert verificacion_preoperacional.porcentaje_cumplimiento == Decimal('100.00')

    def test_property_porcentaje_cumplimiento_parcial(self, verificacion_rechazada):
        """Test propiedad porcentaje_cumplimiento con cumplimiento parcial."""
        # 5 items, 3 cumplen = 60%
        assert verificacion_rechazada.porcentaje_cumplimiento == Decimal('60.00')

    def test_property_porcentaje_cumplimiento_sin_items(self, empresa, vehiculo, usuario_inspector, usuario):
        """Test propiedad porcentaje_cumplimiento sin items."""
        verificacion = VerificacionTercero.objects.create(
            empresa=empresa,
            vehiculo=vehiculo,
            fecha=timezone.now(),
            tipo='PREOPERACIONAL_DIARIA',
            inspector=usuario_inspector,
            checklist_items=[],
            resultado='APROBADO',
            kilometraje=50000,
            created_by=usuario
        )

        assert verificacion.porcentaje_cumplimiento is None

    def test_validacion_sin_inspector(self, empresa, vehiculo, usuario):
        """Test validación: debe tener al menos un inspector."""
        verificacion = VerificacionTercero(
            empresa=empresa,
            vehiculo=vehiculo,
            fecha=timezone.now(),
            tipo='PREOPERACIONAL_DIARIA',
            inspector=None,  # Sin inspector
            inspector_externo=None,  # Sin inspector externo
            checklist_items=[],
            resultado='APROBADO',
            kilometraje=50000
        )

        with pytest.raises(ValidationError) as exc_info:
            verificacion.full_clean()

        assert 'inspector' in exc_info.value.error_dict

    def test_validacion_checklist_estructura_invalida(self, empresa, vehiculo, usuario_inspector, usuario):
        """Test validación de estructura de checklist."""
        verificacion = VerificacionTercero(
            empresa=empresa,
            vehiculo=vehiculo,
            fecha=timezone.now(),
            tipo='PREOPERACIONAL_DIARIA',
            inspector=usuario_inspector,
            checklist_items=[
                {'item': 'Test'},  # Error: falta 'cumple'
            ],
            resultado='APROBADO',
            kilometraje=50000
        )

        with pytest.raises(ValidationError) as exc_info:
            verificacion.full_clean()

        assert 'checklist_items' in exc_info.value.error_dict

    def test_verificacion_con_inspector_externo(self, empresa, vehiculo, usuario):
        """Test verificación con inspector externo."""
        verificacion = VerificacionTercero.objects.create(
            empresa=empresa,
            vehiculo=vehiculo,
            fecha=timezone.now(),
            tipo='AUDITORIA_EXTERNA',
            inspector_externo='Juan Pérez - Auditor Certificado',
            checklist_items=[
                {'item': 'Test', 'cumple': True, 'observacion': ''}
            ],
            resultado='APROBADO',
            kilometraje=50000,
            created_by=usuario
        )

        assert verificacion.pk is not None
        assert verificacion.inspector_externo is not None


# ==============================================================================
# TESTS DE HOJA DE VIDA
# ==============================================================================

@pytest.mark.django_db
class TestHojaVidaVehiculo:
    """Tests para modelo HojaVidaVehiculo."""

    def test_crear_hoja_vida(self, hoja_vida_mantenimiento):
        """Test creación de evento de hoja de vida."""
        assert hoja_vida_mantenimiento.pk is not None
        assert hoja_vida_mantenimiento.tipo_evento == 'MANTENIMIENTO'
        assert hoja_vida_mantenimiento.km_evento == 45000

    def test_str_representation(self, hoja_vida_mantenimiento):
        """Test representación en string."""
        str_repr = str(hoja_vida_mantenimiento)
        assert hoja_vida_mantenimiento.vehiculo.placa in str_repr
        assert hoja_vida_mantenimiento.get_tipo_evento_display() in str_repr

    def test_evento_con_costo(self, hoja_vida_mantenimiento):
        """Test evento con costo asociado."""
        assert hoja_vida_mantenimiento.costo == Decimal('350000.00')
        assert hoja_vida_mantenimiento.proveedor is not None
