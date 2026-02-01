"""
Tests para serializers de Programacion de Abastecimiento
=========================================================

Tests de serialización y validación de datos

Autor: Sistema ERP StrateKaz
Fecha: 27 Diciembre 2025
"""
import pytest
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone

from apps.supply_chain.programacion_abastecimiento.serializers import (
    TipoOperacionSerializer,
    EstadoProgramacionSerializer,
    UnidadMedidaSerializer,
    EstadoEjecucionSerializer,
    EstadoLiquidacionSerializer,
)


@pytest.mark.django_db
class TestTipoOperacionSerializer:
    """Tests para serializer de TipoOperacion."""

    def test_serialization(self, tipo_operacion_recoleccion):
        """Test serialización de tipo de operación."""
        serializer = TipoOperacionSerializer(tipo_operacion_recoleccion)
        data = serializer.data

        assert data['codigo'] == 'RECOLECCION'
        assert data['nombre'] == 'Recolección de Materia Prima'
        assert data['requiere_vehiculo'] is True
        assert data['requiere_conductor'] is True

    def test_deserialization(self):
        """Test deserialización de tipo de operación."""
        data = {
            'codigo': 'TEST',
            'nombre': 'Test Operacion',
            'descripcion': 'Test',
            'requiere_vehiculo': True,
            'requiere_conductor': False,
            'color_hex': '#FF0000',
            'orden': 1,
            'is_active': True
        }

        serializer = TipoOperacionSerializer(data=data)
        assert serializer.is_valid()
        instance = serializer.save()
        assert instance.codigo == 'TEST'


@pytest.mark.django_db
class TestEstadoProgramacionSerializer:
    """Tests para serializer de EstadoProgramacion."""

    def test_serialization(self, estado_programacion_pendiente):
        """Test serialización de estado."""
        serializer = EstadoProgramacionSerializer(estado_programacion_pendiente)
        data = serializer.data

        assert data['codigo'] == 'PENDIENTE'
        assert data['nombre'] == 'Pendiente'
        assert data['es_estado_inicial'] is True

    def test_deserialization(self):
        """Test deserialización de estado."""
        data = {
            'codigo': 'TEST',
            'nombre': 'Test Estado',
            'descripcion': 'Test',
            'es_estado_inicial': False,
            'es_estado_final': True,
            'color_hex': '#00FF00',
            'orden': 1,
            'is_active': True
        }

        serializer = EstadoProgramacionSerializer(data=data)
        assert serializer.is_valid()


@pytest.mark.django_db
class TestUnidadMedidaSerializer:
    """Tests para serializer de UnidadMedida."""

    def test_serialization(self, unidad_medida_kg):
        """Test serialización de unidad de medida."""
        serializer = UnidadMedidaSerializer(unidad_medida_kg)
        data = serializer.data

        assert data['codigo'] == 'KG'
        assert data['nombre'] == 'Kilogramos'
        assert data['simbolo'] == 'kg'
        assert Decimal(data['factor_conversion_kg']) == Decimal('1.0000')

    def test_deserialization(self):
        """Test deserialización de unidad de medida."""
        data = {
            'codigo': 'LB',
            'nombre': 'Libras',
            'simbolo': 'lb',
            'descripcion': 'Libras',
            'factor_conversion_kg': '0.4536',
            'orden': 1,
            'is_active': True
        }

        serializer = UnidadMedidaSerializer(data=data)
        assert serializer.is_valid()
