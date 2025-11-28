"""
Tests del módulo Ecoaliados
Sistema de Gestión Grasas y Huesos del Norte
"""
from django.test import TestCase
from django.utils import timezone
from decimal import Decimal
from apps.core.models import User, Cargo
from apps.proveedores.models import Proveedor
from .models import Ecoaliado, HistorialPrecioEcoaliado


class EcoaliadoModelTest(TestCase):
    """Tests para el modelo Ecoaliado"""

    def setUp(self):
        """Configuración inicial para los tests"""
        # Crear cargo
        self.cargo_comercial = Cargo.objects.create(
            code='comercial_econorte',
            name='Comercial Econorte',
            level=2
        )

        # Crear usuario comercial
        self.comercial = User.objects.create_user(
            username='comercial_test',
            email='comercial@test.com',
            password='testpass123',
            cargo=self.cargo_comercial
        )

        # Crear unidad de negocio (proveedor tipo UNIDAD_NEGOCIO que maneje ACU)
        self.unidad_negocio = Proveedor.objects.create(
            tipo_proveedor='UNIDAD_NEGOCIO',
            subtipo_materia=['ACU'],
            nombre_comercial='Unidad Test',
            razon_social='Unidad Test SAS',
            tipo_documento='NIT',
            numero_documento='900123456-1',
            direccion='Calle Test 123',
            ciudad='Bogotá',
            departamento='BOGOTA'
        )

    def test_crear_ecoaliado(self):
        """Test de creación de ecoaliado"""
        ecoaliado = Ecoaliado.objects.create(
            razon_social='Restaurante Test',
            documento_tipo='NIT',
            documento_numero='800123456-1',
            unidad_negocio=self.unidad_negocio,
            telefono='3001234567',
            direccion='Carrera Test 456',
            ciudad='Bogotá',
            departamento='Bogotá D.C.',
            precio_compra_kg=Decimal('1500.00'),
            comercial_asignado=self.comercial,
            created_by=self.comercial
        )

        self.assertIsNotNone(ecoaliado.codigo)
        self.assertTrue(ecoaliado.codigo.startswith('ECO-'))
        self.assertEqual(ecoaliado.razon_social, 'Restaurante Test')
        self.assertTrue(ecoaliado.is_active)
        self.assertFalse(ecoaliado.is_deleted)

    def test_codigo_autoincremental(self):
        """Test de generación automática de código"""
        eco1 = Ecoaliado.objects.create(
            razon_social='Test 1',
            documento_tipo='CC',
            documento_numero='123456789',
            unidad_negocio=self.unidad_negocio,
            telefono='3001111111',
            direccion='Calle 1',
            ciudad='Bogotá',
            departamento='Bogotá D.C.',
            precio_compra_kg=Decimal('1000.00'),
            comercial_asignado=self.comercial
        )

        eco2 = Ecoaliado.objects.create(
            razon_social='Test 2',
            documento_tipo='CC',
            documento_numero='987654321',
            unidad_negocio=self.unidad_negocio,
            telefono='3002222222',
            direccion='Calle 2',
            ciudad='Bogotá',
            departamento='Bogotá D.C.',
            precio_compra_kg=Decimal('1200.00'),
            comercial_asignado=self.comercial
        )

        # Los códigos deben ser secuenciales
        codigo1_num = int(eco1.codigo.split('-')[1])
        codigo2_num = int(eco2.codigo.split('-')[1])
        self.assertEqual(codigo2_num, codigo1_num + 1)

    def test_soft_delete(self):
        """Test de eliminación lógica"""
        ecoaliado = Ecoaliado.objects.create(
            razon_social='Test Delete',
            documento_tipo='CC',
            documento_numero='111222333',
            unidad_negocio=self.unidad_negocio,
            telefono='3003333333',
            direccion='Calle Delete',
            ciudad='Bogotá',
            departamento='Bogotá D.C.',
            precio_compra_kg=Decimal('1300.00'),
            comercial_asignado=self.comercial
        )

        self.assertFalse(ecoaliado.is_deleted)
        self.assertIsNone(ecoaliado.deleted_at)

        # Soft delete
        ecoaliado.soft_delete()

        self.assertTrue(ecoaliado.is_deleted)
        self.assertIsNotNone(ecoaliado.deleted_at)
        self.assertFalse(ecoaliado.is_active)

    def test_restore(self):
        """Test de restauración de ecoaliado eliminado"""
        ecoaliado = Ecoaliado.objects.create(
            razon_social='Test Restore',
            documento_tipo='CC',
            documento_numero='444555666',
            unidad_negocio=self.unidad_negocio,
            telefono='3004444444',
            direccion='Calle Restore',
            ciudad='Bogotá',
            departamento='Bogotá D.C.',
            precio_compra_kg=Decimal('1400.00'),
            comercial_asignado=self.comercial
        )

        # Eliminar y restaurar
        ecoaliado.soft_delete()
        self.assertTrue(ecoaliado.is_deleted)

        ecoaliado.restore()
        self.assertFalse(ecoaliado.is_deleted)
        self.assertIsNone(ecoaliado.deleted_at)
        self.assertTrue(ecoaliado.is_active)


class HistorialPrecioEcoaliadoModelTest(TestCase):
    """Tests para el modelo HistorialPrecioEcoaliado"""

    def setUp(self):
        """Configuración inicial"""
        # Crear cargo
        self.cargo_lider = Cargo.objects.create(
            code='lider_com_econorte',
            name='Líder Comercial Econorte',
            level=2
        )

        # Crear usuario
        self.lider = User.objects.create_user(
            username='lider_test',
            email='lider@test.com',
            password='testpass123',
            cargo=self.cargo_lider
        )

        # Crear unidad de negocio
        self.unidad_negocio = Proveedor.objects.create(
            tipo_proveedor='UNIDAD_NEGOCIO',
            subtipo_materia=['ACU'],
            nombre_comercial='Unidad Test',
            razon_social='Unidad Test SAS',
            tipo_documento='NIT',
            numero_documento='900123456-1',
            direccion='Calle Test 123',
            ciudad='Bogotá',
            departamento='BOGOTA'
        )

        # Crear ecoaliado
        self.ecoaliado = Ecoaliado.objects.create(
            razon_social='Restaurante Historial',
            documento_tipo='NIT',
            documento_numero='800777888-1',
            unidad_negocio=self.unidad_negocio,
            telefono='3005555555',
            direccion='Carrera Historial 789',
            ciudad='Bogotá',
            departamento='Bogotá D.C.',
            precio_compra_kg=Decimal('1500.00'),
            comercial_asignado=self.lider
        )

    def test_crear_historial_precio(self):
        """Test de creación de registro en historial"""
        historial = HistorialPrecioEcoaliado.objects.create(
            ecoaliado=self.ecoaliado,
            precio_anterior=Decimal('1500.00'),
            precio_nuevo=Decimal('1800.00'),
            tipo_cambio='AUMENTO',
            justificacion='Ajuste por inflación',
            modificado_por=self.lider
        )

        self.assertEqual(historial.ecoaliado, self.ecoaliado)
        self.assertEqual(historial.precio_nuevo, Decimal('1800.00'))
        self.assertIsNotNone(historial.fecha_modificacion)

    def test_diferencia_precio(self):
        """Test de cálculo de diferencia de precio"""
        historial = HistorialPrecioEcoaliado.objects.create(
            ecoaliado=self.ecoaliado,
            precio_anterior=Decimal('1500.00'),
            precio_nuevo=Decimal('1800.00'),
            tipo_cambio='AUMENTO',
            justificacion='Test',
            modificado_por=self.lider
        )

        self.assertEqual(historial.diferencia_precio, Decimal('300.00'))

    def test_porcentaje_cambio(self):
        """Test de cálculo de porcentaje de cambio"""
        historial = HistorialPrecioEcoaliado.objects.create(
            ecoaliado=self.ecoaliado,
            precio_anterior=Decimal('1000.00'),
            precio_nuevo=Decimal('1200.00'),
            tipo_cambio='AUMENTO',
            justificacion='Test',
            modificado_por=self.lider
        )

        # 20% de aumento
        self.assertEqual(historial.porcentaje_cambio, 20.0)

    def test_precio_inicial_sin_anterior(self):
        """Test de registro inicial sin precio anterior"""
        historial = HistorialPrecioEcoaliado.objects.create(
            ecoaliado=self.ecoaliado,
            precio_anterior=None,
            precio_nuevo=Decimal('1500.00'),
            tipo_cambio='CREACION',
            justificacion='Precio inicial',
            modificado_por=self.lider
        )

        self.assertIsNone(historial.precio_anterior)
        self.assertIsNone(historial.diferencia_precio)
        self.assertIsNone(historial.porcentaje_cambio)
