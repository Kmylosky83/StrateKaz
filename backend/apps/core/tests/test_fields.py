"""
Tests para Custom Fields
"""
from django.test import TestCase
from datetime import date, datetime
from apps.core.fields import NaiveDateField
from rest_framework import serializers


class TestNaiveDateField(TestCase):
    """Test suite para NaiveDateField"""

    def setUp(self):
        """Setup test serializer"""
        class TestSerializer(serializers.Serializer):
            fecha = NaiveDateField(required=True)

        self.serializer_class = TestSerializer

    def test_simple_date_string(self):
        """Test: String de fecha simple YYYY-MM-DD"""
        data = {'fecha': '2024-12-01'}
        serializer = self.serializer_class(data=data)

        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['fecha'], date(2024, 12, 1))

    def test_iso_datetime_with_utc_timezone(self):
        """
        Test: String ISO con timezone UTC (el caso problemático)

        Problema original:
        - Input: "2024-12-01T00:00:00Z" (medianoche UTC)
        - Con DateField normal + USE_TZ=True: se convierte a "2024-11-30" (UTC-5)
        - Con NaiveDateField: debe mantener "2024-12-01"
        """
        data = {'fecha': '2024-12-01T00:00:00Z'}
        serializer = self.serializer_class(data=data)

        self.assertTrue(serializer.is_valid())
        # Debe extraer solo la fecha, ignorando timezone
        self.assertEqual(serializer.validated_data['fecha'], date(2024, 12, 1))

    def test_iso_datetime_with_bogota_timezone(self):
        """Test: String ISO con timezone de Bogotá"""
        data = {'fecha': '2024-12-01T00:00:00-05:00'}
        serializer = self.serializer_class(data=data)

        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['fecha'], date(2024, 12, 1))

    def test_iso_datetime_without_timezone(self):
        """Test: String ISO sin timezone"""
        data = {'fecha': '2024-12-01T00:00:00'}
        serializer = self.serializer_class(data=data)

        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['fecha'], date(2024, 12, 1))

    def test_date_object(self):
        """Test: Objeto date de Python"""
        data = {'fecha': date(2024, 12, 1)}
        serializer = self.serializer_class(data=data)

        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['fecha'], date(2024, 12, 1))

    def test_datetime_object(self):
        """Test: Objeto datetime de Python (debe extraer solo la fecha)"""
        data = {'fecha': datetime(2024, 12, 1, 15, 30, 0)}
        serializer = self.serializer_class(data=data)

        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['fecha'], date(2024, 12, 1))

    def test_invalid_date_format(self):
        """Test: Formato inválido debe fallar"""
        data = {'fecha': 'invalid-date'}
        serializer = self.serializer_class(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn('fecha', serializer.errors)

    def test_null_value_with_required_false(self):
        """Test: Valor null con required=False"""
        class OptionalDateSerializer(serializers.Serializer):
            fecha = NaiveDateField(required=False, allow_null=True)

        data = {'fecha': None}
        serializer = OptionalDateSerializer(data=data)

        self.assertTrue(serializer.is_valid())
        self.assertIsNone(serializer.validated_data['fecha'])

    def test_to_representation(self):
        """Test: Serialización de salida (date → string)"""
        class OutputSerializer(serializers.Serializer):
            fecha = NaiveDateField()

        instance = {'fecha': date(2024, 12, 1)}
        serializer = OutputSerializer(instance)

        self.assertEqual(serializer.data['fecha'], '2024-12-01')

    def test_edge_case_midnight_bogota_time(self):
        """
        Test: Caso edge - medianoche en Bogotá que cae en día anterior en UTC

        2024-12-01 00:00:00 Bogotá (UTC-5) = 2024-12-01 05:00:00 UTC

        Debe mantener 2024-12-01 (fecha local, no UTC)
        """
        # Simular lo que podría enviar un navegador en timezone de Bogotá
        data = {'fecha': '2024-12-01T05:00:00Z'}  # Medianoche Bogotá en UTC
        serializer = self.serializer_class(data=data)

        self.assertTrue(serializer.is_valid())
        # Debe extraer la fecha del string, ignorando conversión de timezone
        self.assertEqual(serializer.validated_data['fecha'], date(2024, 12, 1))

    def test_reprogramacion_real_world_scenario(self):
        """
        Test: Escenario real de reprogramación

        Usuario en Bogotá selecciona 2024-12-15 en el calendario.
        El navegador puede enviar "2024-12-15T00:00:00Z" o "2024-12-15".
        En ambos casos, debe guardarse 2024-12-15.
        """
        # Caso 1: String simple
        data1 = {'fecha': '2024-12-15'}
        s1 = self.serializer_class(data=data1)
        self.assertTrue(s1.is_valid())
        self.assertEqual(s1.validated_data['fecha'], date(2024, 12, 15))

        # Caso 2: Con timestamp UTC
        data2 = {'fecha': '2024-12-15T00:00:00Z'}
        s2 = self.serializer_class(data=data2)
        self.assertTrue(s2.is_valid())
        self.assertEqual(s2.validated_data['fecha'], date(2024, 12, 15))

        # Caso 3: Con timezone de Bogotá
        data3 = {'fecha': '2024-12-15T00:00:00-05:00'}
        s3 = self.serializer_class(data=data3)
        self.assertTrue(s3.is_valid())
        self.assertEqual(s3.validated_data['fecha'], date(2024, 12, 15))


class TestNaiveDateFieldIntegration(TestCase):
    """Tests de integración con ReprogramarSerializer"""

    def test_reprogramar_serializer_uses_naive_date_field(self):
        """Verificar que ReprogramarSerializer usa NaiveDateField"""
        from apps.programaciones.serializers import ReprogramarSerializer

        # El campo debe ser instancia de NaiveDateField
        self.assertIsInstance(
            ReprogramarSerializer().fields['fecha_reprogramada'],
            NaiveDateField
        )

    def test_asignar_recolector_serializer_uses_naive_date_field(self):
        """Verificar que AsignarRecolectorSerializer usa NaiveDateField"""
        from apps.programaciones.serializers import AsignarRecolectorSerializer

        # El campo debe ser instancia de NaiveDateField
        self.assertIsInstance(
            AsignarRecolectorSerializer().fields['nueva_fecha'],
            NaiveDateField
        )
