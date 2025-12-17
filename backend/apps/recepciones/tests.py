# -*- coding: utf-8 -*-
"""
Tests del módulo Recepciones - Sistema de Gestión Grasas y Huesos del Norte

Tests para validar el correcto funcionamiento del prorrateo de merma
y los estados de las recepciones.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.exceptions import ValidationError
from decimal import Decimal
from apps.core.models import Cargo
from apps.proveedores.models import Proveedor
from apps.ecoaliados.models import Ecoaliado
from apps.programaciones.models import Programacion
from apps.recolecciones.models import Recoleccion
from .models import RecepcionMateriaPrima, RecepcionDetalle

User = get_user_model()


class RecepcionMateriaPrimaTestCase(TestCase):
    """Tests para RecepcionMateriaPrima"""

    def setUp(self):
        """Configuración inicial de datos de prueba"""
        # Crear cargos
        self.cargo_recolector = Cargo.objects.create(
            code='recolector_econorte',
            name='Recolector Econorte',
            level=0
        )
        self.cargo_operario = Cargo.objects.create(
            code='operario_planta',
            name='Operario de Planta',
            level=1
        )

        # Crear usuarios
        self.recolector = User.objects.create_user(
            username='recolector1',
            email='recolector1@test.com',
            password='test123',
            cargo=self.cargo_recolector,
            document_type='CC',
            document_number='123456789'
        )

        self.operario = User.objects.create_user(
            username='operario1',
            email='operario1@test.com',
            password='test123',
            cargo=self.cargo_operario,
            document_type='CC',
            document_number='987654321'
        )

        # Crear unidad de negocio
        self.unidad = Proveedor.objects.create(
            tipo_proveedor='UNIDAD_NEGOCIO',
            codigo='UN-001',
            razon_social='Unidad Norte',
            nit='900123456',
            subtipo_materia=['ACU'],
            es_activo_ica=False,
            es_activo_tripa=False
        )

        # Crear ecoaliados
        self.eco1 = Ecoaliado.objects.create(
            codigo='ECO-0001',
            razon_social='Restaurante 1',
            documento_tipo='NIT',
            documento_numero='111111111',
            unidad_negocio=self.unidad,
            telefono='3001234567',
            direccion='Calle 1',
            ciudad='Bogotá',
            departamento='Cundinamarca',
            precio_compra_kg=Decimal('2000.00'),
            comercial_asignado=self.recolector
        )

        self.eco2 = Ecoaliado.objects.create(
            codigo='ECO-0002',
            razon_social='Restaurante 2',
            documento_tipo='NIT',
            documento_numero='222222222',
            unidad_negocio=self.unidad,
            telefono='3001234568',
            direccion='Calle 2',
            ciudad='Bogotá',
            departamento='Cundinamarca',
            precio_compra_kg=Decimal('2100.00'),
            comercial_asignado=self.recolector
        )

        self.eco3 = Ecoaliado.objects.create(
            codigo='ECO-0003',
            razon_social='Restaurante 3',
            documento_tipo='NIT',
            documento_numero='333333333',
            unidad_negocio=self.unidad,
            telefono='3001234569',
            direccion='Calle 3',
            ciudad='Bogotá',
            departamento='Cundinamarca',
            precio_compra_kg=Decimal('2000.00'),
            comercial_asignado=self.recolector
        )

        # Crear programaciones
        fecha_hoy = timezone.now().date()

        self.prog1 = Programacion.objects.create(
            ecoaliado=self.eco1,
            programado_por=self.recolector,
            fecha_programada=fecha_hoy,
            cantidad_estimada_kg=Decimal('50.00'),
            tipo_programacion='PROGRAMADA',
            estado='EN_RUTA',
            recolector_asignado=self.recolector,
            created_by=self.recolector
        )

        self.prog2 = Programacion.objects.create(
            ecoaliado=self.eco2,
            programado_por=self.recolector,
            fecha_programada=fecha_hoy,
            cantidad_estimada_kg=Decimal('30.00'),
            tipo_programacion='PROGRAMADA',
            estado='EN_RUTA',
            recolector_asignado=self.recolector,
            created_by=self.recolector
        )

        self.prog3 = Programacion.objects.create(
            ecoaliado=self.eco3,
            programado_por=self.recolector,
            fecha_programada=fecha_hoy,
            cantidad_estimada_kg=Decimal('70.00'),
            tipo_programacion='PROGRAMADA',
            estado='EN_RUTA',
            recolector_asignado=self.recolector,
            created_by=self.recolector
        )

        # Crear recolecciones
        self.rec1 = Recoleccion.objects.create(
            programacion=self.prog1,
            ecoaliado=self.eco1,
            recolector=self.recolector,
            fecha_recoleccion=timezone.now(),
            cantidad_kg=Decimal('50.00'),
            precio_kg=Decimal('2000.00'),
            valor_total=Decimal('100000.00'),
            created_by=self.recolector
        )

        self.rec2 = Recoleccion.objects.create(
            programacion=self.prog2,
            ecoaliado=self.eco2,
            recolector=self.recolector,
            fecha_recoleccion=timezone.now(),
            cantidad_kg=Decimal('30.00'),
            precio_kg=Decimal('2100.00'),
            valor_total=Decimal('63000.00'),
            created_by=self.recolector
        )

        self.rec3 = Recoleccion.objects.create(
            programacion=self.prog3,
            ecoaliado=self.eco3,
            recolector=self.recolector,
            fecha_recoleccion=timezone.now(),
            cantidad_kg=Decimal('70.00'),
            precio_kg=Decimal('2000.00'),
            valor_total=Decimal('140000.00'),
            created_by=self.recolector
        )

    def test_crear_recepcion_con_codigo_auto(self):
        """Test: Crear recepción genera código automáticamente"""
        recepcion = RecepcionMateriaPrima.objects.create(
            recolector=self.recolector,
            recibido_por=self.operario,
            fecha_recepcion=timezone.now(),
            created_by=self.operario
        )

        self.assertIsNotNone(recepcion.codigo_recepcion)
        self.assertTrue(recepcion.codigo_recepcion.startswith('RMP-'))

    def test_calcular_peso_esperado(self):
        """Test: Calcular peso esperado suma las recolecciones"""
        recepcion = RecepcionMateriaPrima.objects.create(
            recolector=self.recolector,
            recibido_por=self.operario,
            fecha_recepcion=timezone.now(),
            created_by=self.operario
        )

        # Asociar recolecciones
        RecepcionDetalle.objects.create(
            recepcion=recepcion,
            recoleccion=self.rec1
        )
        RecepcionDetalle.objects.create(
            recepcion=recepcion,
            recoleccion=self.rec2
        )
        RecepcionDetalle.objects.create(
            recepcion=recepcion,
            recoleccion=self.rec3
        )

        peso_esperado = recepcion.calcular_peso_esperado()
        # 50 + 30 + 70 = 150
        self.assertEqual(peso_esperado, Decimal('150.00'))

    def test_registrar_pesaje_calcula_merma(self):
        """Test: Registrar pesaje calcula la merma correctamente"""
        recepcion = RecepcionMateriaPrima.objects.create(
            recolector=self.recolector,
            recibido_por=self.operario,
            fecha_recepcion=timezone.now(),
            peso_esperado_kg=Decimal('150.00'),
            valor_esperado_total=Decimal('303000.00'),
            created_by=self.operario
        )

        # Registrar pesaje con merma del 4%
        recepcion.registrar_pesaje(
            peso_bascula=Decimal('144.00'),
            numero_ticket='TICK-001'
        )

        # Verificar cálculos
        self.assertEqual(recepcion.estado, 'PESADA')
        self.assertEqual(recepcion.peso_real_kg, Decimal('144.00'))
        self.assertEqual(recepcion.merma_kg, Decimal('6.00'))
        self.assertEqual(recepcion.porcentaje_merma, Decimal('4.00'))

    def test_prorrateo_merma_correcto(self):
        """Test: El prorrateo de merma se distribuye correctamente"""
        recepcion = RecepcionMateriaPrima.objects.create(
            recolector=self.recolector,
            recibido_por=self.operario,
            fecha_recepcion=timezone.now(),
            peso_esperado_kg=Decimal('150.00'),
            valor_esperado_total=Decimal('303000.00'),
            created_by=self.operario
        )

        # Asociar recolecciones
        det1 = RecepcionDetalle.objects.create(
            recepcion=recepcion,
            recoleccion=self.rec1
        )
        det2 = RecepcionDetalle.objects.create(
            recepcion=recepcion,
            recoleccion=self.rec2
        )
        det3 = RecepcionDetalle.objects.create(
            recepcion=recepcion,
            recoleccion=self.rec3
        )

        # Registrar pesaje
        recepcion.registrar_pesaje(peso_bascula=Decimal('144.00'))

        # Confirmar recepción (aplica prorrateo)
        recepcion.confirmar_recepcion()

        # Recargar detalles
        det1.refresh_from_db()
        det2.refresh_from_db()
        det3.refresh_from_db()

        # Verificar pesos reales
        self.assertEqual(det1.peso_real_kg, Decimal('48.00'))   # 50 × 0.96
        self.assertEqual(det2.peso_real_kg, Decimal('28.80'))   # 30 × 0.96
        self.assertEqual(det3.peso_real_kg, Decimal('67.20'))   # 70 × 0.96

        # Verificar mermas
        self.assertEqual(det1.merma_kg, Decimal('2.00'))        # 50 - 48
        self.assertEqual(det2.merma_kg, Decimal('1.20'))        # 30 - 28.8
        self.assertEqual(det3.merma_kg, Decimal('2.80'))        # 70 - 67.2

        # Verificar porcentaje de merma (debe ser igual para todos)
        self.assertEqual(det1.porcentaje_merma, Decimal('4.00'))
        self.assertEqual(det2.porcentaje_merma, Decimal('4.00'))
        self.assertEqual(det3.porcentaje_merma, Decimal('4.00'))

        # Verificar valores (se mantienen)
        self.assertEqual(det1.valor_real, Decimal('100000.00'))
        self.assertEqual(det2.valor_real, Decimal('63000.00'))
        self.assertEqual(det3.valor_real, Decimal('140000.00'))

        # Verificar suma total
        suma_pesos = det1.peso_real_kg + det2.peso_real_kg + det3.peso_real_kg
        self.assertEqual(suma_pesos, Decimal('144.00'))

        suma_mermas = det1.merma_kg + det2.merma_kg + det3.merma_kg
        self.assertEqual(suma_mermas, Decimal('6.00'))

    def test_precio_real_kg_ajustado_por_merma(self):
        """Test: El precio real por kg se ajusta correctamente"""
        recepcion = RecepcionMateriaPrima.objects.create(
            recolector=self.recolector,
            recibido_por=self.operario,
            fecha_recepcion=timezone.now(),
            peso_esperado_kg=Decimal('150.00'),
            valor_esperado_total=Decimal('303000.00'),
            created_by=self.operario
        )

        det1 = RecepcionDetalle.objects.create(
            recepcion=recepcion,
            recoleccion=self.rec1
        )

        recepcion.registrar_pesaje(peso_bascula=Decimal('144.00'))
        recepcion.confirmar_recepcion()

        det1.refresh_from_db()

        # Precio real/kg = Valor esperado / Peso real
        # $100,000 / 48 kg = $2,083.33/kg
        precio_esperado = Decimal('100000.00') / Decimal('48.00')
        self.assertEqual(det1.precio_real_kg, precio_esperado.quantize(Decimal('0.01')))

    def test_no_puede_confirmar_sin_pesar(self):
        """Test: No se puede confirmar sin registrar pesaje"""
        recepcion = RecepcionMateriaPrima.objects.create(
            recolector=self.recolector,
            recibido_por=self.operario,
            fecha_recepcion=timezone.now(),
            peso_esperado_kg=Decimal('150.00'),
            created_by=self.operario
        )

        with self.assertRaises(ValidationError):
            recepcion.confirmar_recepcion()

    def test_cancelar_recepcion(self):
        """Test: Cancelar recepción funciona correctamente"""
        recepcion = RecepcionMateriaPrima.objects.create(
            recolector=self.recolector,
            recibido_por=self.operario,
            fecha_recepcion=timezone.now(),
            peso_esperado_kg=Decimal('150.00'),
            created_by=self.operario
        )

        recepcion.cancelar(
            usuario=self.operario,
            motivo='Báscula averiada'
        )

        self.assertEqual(recepcion.estado, 'CANCELADA')
        self.assertEqual(recepcion.motivo_cancelacion, 'Báscula averiada')
        self.assertEqual(recepcion.cancelado_por, self.operario)
        self.assertIsNotNone(recepcion.fecha_cancelacion)

    def test_proporcion_lote(self):
        """Test: La proporción del lote se calcula correctamente"""
        recepcion = RecepcionMateriaPrima.objects.create(
            recolector=self.recolector,
            recibido_por=self.operario,
            fecha_recepcion=timezone.now(),
            peso_esperado_kg=Decimal('150.00'),
            created_by=self.operario
        )

        det1 = RecepcionDetalle.objects.create(
            recepcion=recepcion,
            recoleccion=self.rec1
        )
        det2 = RecepcionDetalle.objects.create(
            recepcion=recepcion,
            recoleccion=self.rec2
        )
        det3 = RecepcionDetalle.objects.create(
            recepcion=recepcion,
            recoleccion=self.rec3
        )

        # Verificar proporciones
        # Rec1: 50/150 = 0.3333
        self.assertAlmostEqual(float(det1.proporcion_lote), 0.3333, places=4)
        # Rec2: 30/150 = 0.2000
        self.assertAlmostEqual(float(det2.proporcion_lote), 0.2000, places=4)
        # Rec3: 70/150 = 0.4667
        self.assertAlmostEqual(float(det3.proporcion_lote), 0.4667, places=4)

    def test_validacion_recoleccion_duplicada(self):
        """Test: No se puede agregar la misma recolección dos veces"""
        recepcion1 = RecepcionMateriaPrima.objects.create(
            recolector=self.recolector,
            recibido_por=self.operario,
            fecha_recepcion=timezone.now(),
            peso_esperado_kg=Decimal('50.00'),
            created_by=self.operario
        )

        recepcion2 = RecepcionMateriaPrima.objects.create(
            recolector=self.recolector,
            recibido_por=self.operario,
            fecha_recepcion=timezone.now(),
            peso_esperado_kg=Decimal('30.00'),
            created_by=self.operario
        )

        # Agregar a primera recepción
        RecepcionDetalle.objects.create(
            recepcion=recepcion1,
            recoleccion=self.rec1
        )

        # Intentar agregar a segunda recepción
        with self.assertRaises(ValidationError):
            det = RecepcionDetalle(
                recepcion=recepcion2,
                recoleccion=self.rec1
            )
            det.full_clean()


class RecepcionDetalleTestCase(TestCase):
    """Tests para RecepcionDetalle"""

    def setUp(self):
        """Reutilizar setup de RecepcionMateriaPrimaTestCase"""
        # Código similar al setUp anterior
        pass

    # Tests adicionales específicos de RecepcionDetalle
