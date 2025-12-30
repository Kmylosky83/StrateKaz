"""
Tests de serializers para Gestión de Flota
"""

import pytest
from decimal import Decimal
from datetime import date

# from apps.logistics_fleet.gestion_flota.serializers import (
#     VehiculoListSerializer,
#     VehiculoDetailSerializer,
#     ConductorSerializer,
#     InspeccionPreoperacionalSerializer
# )


# TODO: Implementar tests de serializers
# @pytest.mark.django_db
# class TestVehiculoSerializer:
#     """Tests del serializer de Vehiculo"""
#
#     def test_serializar_vehiculo(self, vehiculo_test):
#         """Test serialización de vehículo"""
#         serializer = VehiculoListSerializer(vehiculo_test)
#         data = serializer.data
#
#         assert data['placa'] == vehiculo_test.placa
#         assert data['tipo'] == vehiculo_test.tipo
#         assert 'tipo_display' in data
#
#     def test_crear_vehiculo_valido(self, empresa_id):
#         """Test creación con datos válidos"""
#         data = {
#             'placa': 'XYZ789',
#             'tipo': 'CAMIONETA',
#             'marca': 'Toyota',
#             'modelo': 'Hilux',
#             'ano': 2021
#         }
#         serializer = VehiculoDetailSerializer(data=data)
#         assert serializer.is_valid()
