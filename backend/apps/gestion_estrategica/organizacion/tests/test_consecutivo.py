"""
Tests unitarios para ConsecutivoConfig - Numeración automática centralizada.

Cobertura de tests:
- Generación de consecutivo con formato correcto
- Incremento secuencial
- Reinicio anual y mensual
- Formateo con diferentes separadores
- Thread-safety (TransactionTestCase)
- Manejo de excepciones
"""
import pytest
from datetime import date, timedelta
from django.test import TransactionTestCase
from django.utils import timezone
from django.core.exceptions import ValidationError
from unittest.mock import patch
import threading
import time

from apps.gestion_estrategica.organizacion.models import (
    ConsecutivoConfig,
    TipoDocumento,
    CategoriaDocumento
)


# =============================================================================
# FIXTURES Y SETUP
# =============================================================================

@pytest.fixture
def categoria_documento(db):
    """Crea una categoría de documento de prueba."""
    return CategoriaDocumento.objects.create(
        code='TEST_CAT',
        name='Categoría Test',
        description='Categoría para pruebas',
        color='blue',
        icon='FileText',
        is_active=True,
        order=1
    )


@pytest.fixture
def tipo_documento(db, categoria_documento):
    """Crea un tipo de documento de prueba."""
    return TipoDocumento.objects.create(
        code='TEST_DOC',
        name='Documento Test',
        categoria=categoria_documento,
        description='Tipo de documento para pruebas',
        prefijo_sugerido='TEST',
        is_system=False,
        is_active=True,
        order=1
    )


@pytest.fixture
def consecutivo_basico(db, tipo_documento):
    """Crea una configuración básica de consecutivo."""
    return ConsecutivoConfig.objects.create(
        tipo_documento=tipo_documento,
        prefix='FAC',
        current_number=0,
        padding=5,
        include_year=True,
        include_month=False,
        include_day=False,
        separator='-',
        reset_yearly=True,
        reset_monthly=False,
        is_active=True
    )


# =============================================================================
# TESTS DE GENERACIÓN DE FORMATO
# =============================================================================

@pytest.mark.django_db
class TestConsecutivoFormato:
    """Tests para verificar el formateo correcto de consecutivos."""

    def test_formato_basico_prefix_year_number(self, consecutivo_basico):
        """
        Test: Formato básico PREFIX-YYYY-00001

        Verifica que el formato predeterminado genera correctamente
        el consecutivo con prefijo, año y número con padding.
        """
        # Arrange
        test_date = date(2024, 6, 15)
        test_number = 1

        # Act
        resultado = consecutivo_basico.format_number(
            number=test_number,
            date=test_date
        )

        # Assert
        assert resultado == 'FAC-2024-00001'
        assert consecutivo_basico.prefix in resultado
        assert '2024' in resultado
        assert '00001' in resultado

    def test_formato_con_mes(self, consecutivo_basico):
        """
        Test: Formato con mes incluido PREFIX-YYYYMM-00001

        Verifica que al activar include_month se incluye el mes en formato YYYYMM.
        """
        # Arrange
        consecutivo_basico.include_month = True
        consecutivo_basico.include_year = False
        consecutivo_basico.save()
        test_date = date(2024, 3, 15)

        # Act
        resultado = consecutivo_basico.format_number(number=5, date=test_date)

        # Assert
        assert resultado == 'FAC-202403-00005'
        assert '202403' in resultado

    def test_formato_con_dia(self, consecutivo_basico):
        """
        Test: Formato con día incluido PREFIX-YYYYMMDD-00001

        Verifica que al activar include_day se incluye la fecha completa.
        """
        # Arrange
        consecutivo_basico.include_day = True
        consecutivo_basico.include_year = False
        consecutivo_basico.save()
        test_date = date(2024, 12, 25)

        # Act
        resultado = consecutivo_basico.format_number(number=42, date=test_date)

        # Assert
        assert resultado == 'FAC-20241225-00042'
        assert '20241225' in resultado

    def test_formato_sin_separador(self, consecutivo_basico):
        """
        Test: Formato sin separador FACYYYY00001

        Verifica que se puede configurar sin separador.
        """
        # Arrange
        consecutivo_basico.separator = ''
        consecutivo_basico.save()
        test_date = date(2024, 1, 1)

        # Act
        resultado = consecutivo_basico.format_number(number=123, date=test_date)

        # Assert
        assert resultado == 'FAC202400123'
        assert '-' not in resultado
        assert '/' not in resultado

    def test_formato_separador_diagonal(self, consecutivo_basico):
        """
        Test: Formato con separador diagonal FAC/2024/00001

        Verifica que se pueden usar diferentes separadores.
        """
        # Arrange
        consecutivo_basico.separator = '/'
        consecutivo_basico.save()
        test_date = date(2024, 1, 1)

        # Act
        resultado = consecutivo_basico.format_number(number=99, date=test_date)

        # Assert
        assert resultado == 'FAC/2024/00099'
        assert resultado.count('/') == 2

    def test_formato_separador_guion_bajo(self, consecutivo_basico):
        """
        Test: Formato con separador guión bajo FAC_2024_00001
        """
        # Arrange
        consecutivo_basico.separator = '_'
        consecutivo_basico.save()
        test_date = date(2024, 1, 1)

        # Act
        resultado = consecutivo_basico.format_number(number=7, date=test_date)

        # Assert
        assert resultado == 'FAC_2024_00007'
        assert resultado.count('_') == 2

    def test_formato_con_sufijo(self, consecutivo_basico):
        """
        Test: Formato con sufijo PREFIX-YYYY-00001-SUFFIX

        Verifica que se puede agregar un sufijo al final del consecutivo.
        """
        # Arrange
        consecutivo_basico.suffix = 'CO'
        consecutivo_basico.save()
        test_date = date(2024, 1, 1)

        # Act
        resultado = consecutivo_basico.format_number(number=10, date=test_date)

        # Assert
        assert resultado == 'FAC-2024-00010-CO'
        assert resultado.endswith('-CO')

    def test_padding_diferentes_longitudes(self, consecutivo_basico):
        """
        Test: Padding con diferentes longitudes

        Verifica que el padding funciona correctamente con diferentes valores.
        """
        # Arrange & Act & Assert
        test_cases = [
            (3, 1, '001'),
            (5, 42, '00042'),
            (7, 999, '0000999'),
            (4, 10000, '10000'),  # Número mayor que padding
        ]

        for padding, number, expected_padded in test_cases:
            consecutivo_basico.padding = padding
            consecutivo_basico.save()

            resultado = consecutivo_basico.format_number(
                number=number,
                date=date(2024, 1, 1)
            )

            assert expected_padded in resultado

    def test_formato_sin_year_month_day(self, consecutivo_basico):
        """
        Test: Formato solo con prefijo y número PREFIX-00001

        Verifica que se puede configurar sin componentes de fecha.
        """
        # Arrange
        consecutivo_basico.include_year = False
        consecutivo_basico.include_month = False
        consecutivo_basico.include_day = False
        consecutivo_basico.save()

        # Act
        resultado = consecutivo_basico.format_number(number=25, date=date(2024, 6, 15))

        # Assert
        assert resultado == 'FAC-00025'
        assert '2024' not in resultado


# =============================================================================
# TESTS DE INCREMENTO SECUENCIAL
# =============================================================================

@pytest.mark.django_db
class TestConsecutivoIncremento:
    """Tests para verificar el incremento correcto de consecutivos."""

    def test_incremento_secuencial_basico(self, consecutivo_basico):
        """
        Test: Incremento secuencial básico 1, 2, 3...

        Verifica que get_next_number() incrementa correctamente el contador.
        """
        # Arrange
        assert consecutivo_basico.current_number == 0

        # Act & Assert
        num1 = consecutivo_basico.get_next_number()
        assert num1 == 1

        consecutivo_basico.refresh_from_db()
        num2 = consecutivo_basico.get_next_number()
        assert num2 == 2

        consecutivo_basico.refresh_from_db()
        num3 = consecutivo_basico.get_next_number()
        assert num3 == 3

    def test_generate_next_completo(self, consecutivo_basico):
        """
        Test: generate_next() genera consecutivo completo formateado

        Verifica que generate_next() retorna el consecutivo completo
        e incrementa el contador.
        """
        # Arrange
        with patch('django.utils.timezone.now') as mock_now:
            mock_now.return_value = timezone.make_aware(
                timezone.datetime(2024, 6, 15, 10, 0, 0)
            )

            # Act
            consecutivo1 = consecutivo_basico.generate_next()
            consecutivo2 = consecutivo_basico.generate_next()
            consecutivo3 = consecutivo_basico.generate_next()

            # Assert
            assert consecutivo1 == 'FAC-2024-00001'
            assert consecutivo2 == 'FAC-2024-00002'
            assert consecutivo3 == 'FAC-2024-00003'

            consecutivo_basico.refresh_from_db()
            assert consecutivo_basico.current_number == 3

    def test_ejemplo_formato_siguiente_numero(self, consecutivo_basico):
        """
        Test: get_ejemplo_formato() muestra el próximo consecutivo

        Verifica que get_ejemplo_formato() muestra el siguiente número
        sin modificar el contador.
        """
        # Arrange
        consecutivo_basico.current_number = 5
        consecutivo_basico.save()

        # Act
        ejemplo = consecutivo_basico.get_ejemplo_formato()

        # Assert
        assert '00006' in ejemplo  # Siguiente sería 6
        consecutivo_basico.refresh_from_db()
        assert consecutivo_basico.current_number == 5  # No cambió


# =============================================================================
# TESTS DE REINICIO ANUAL Y MENSUAL
# =============================================================================

@pytest.mark.django_db
class TestConsecutivoReinicio:
    """Tests para verificar los reinicios automáticos de consecutivos."""

    def test_reinicio_anual_cambio_de_year(self, consecutivo_basico):
        """
        Test: Reinicio anual al cambiar de año

        Verifica que el consecutivo se reinicia a 1 cuando cambia el año
        si reset_yearly=True.
        """
        # Arrange
        consecutivo_basico.current_number = 999
        consecutivo_basico.last_reset_date = date(2023, 12, 31)
        consecutivo_basico.reset_yearly = True
        consecutivo_basico.save()

        # Act - Simular que hoy es 2024
        with patch('django.utils.timezone.now') as mock_now:
            mock_now.return_value = timezone.make_aware(
                timezone.datetime(2024, 1, 1, 0, 0, 0)
            )

            next_number = consecutivo_basico.get_next_number()

        # Assert
        assert next_number == 1  # Se reinició
        consecutivo_basico.refresh_from_db()
        assert consecutivo_basico.last_reset_date == date(2024, 1, 1)

    def test_no_reinicio_mismo_year(self, consecutivo_basico):
        """
        Test: No reinicia si es el mismo año

        Verifica que el consecutivo continúa incrementando si no cambió el año.
        """
        # Arrange
        consecutivo_basico.current_number = 500
        consecutivo_basico.last_reset_date = date(2024, 1, 15)
        consecutivo_basico.reset_yearly = True
        consecutivo_basico.save()

        # Act
        with patch('django.utils.timezone.now') as mock_now:
            mock_now.return_value = timezone.make_aware(
                timezone.datetime(2024, 6, 30, 0, 0, 0)
            )

            next_number = consecutivo_basico.get_next_number()

        # Assert
        assert next_number == 501  # Continuó incrementando

    def test_reinicio_mensual_cambio_de_mes(self, consecutivo_basico):
        """
        Test: Reinicio mensual al cambiar de mes

        Verifica que el consecutivo se reinicia cuando cambia el mes
        si reset_monthly=True.
        """
        # Arrange
        consecutivo_basico.current_number = 250
        consecutivo_basico.last_reset_date = date(2024, 5, 31)
        consecutivo_basico.reset_yearly = False
        consecutivo_basico.reset_monthly = True
        consecutivo_basico.save()

        # Act
        with patch('django.utils.timezone.now') as mock_now:
            mock_now.return_value = timezone.make_aware(
                timezone.datetime(2024, 6, 1, 0, 0, 0)
            )

            next_number = consecutivo_basico.get_next_number()

        # Assert
        assert next_number == 1  # Se reinició
        consecutivo_basico.refresh_from_db()
        assert consecutivo_basico.last_reset_date == date(2024, 6, 1)

    def test_reinicio_mensual_cambio_de_year_y_mes(self, consecutivo_basico):
        """
        Test: Reinicio mensual también funciona al cambiar de año

        Verifica que reset_monthly se activa tanto al cambiar mes como año.
        """
        # Arrange
        consecutivo_basico.current_number = 999
        consecutivo_basico.last_reset_date = date(2023, 12, 31)
        consecutivo_basico.reset_yearly = False
        consecutivo_basico.reset_monthly = True
        consecutivo_basico.save()

        # Act
        with patch('django.utils.timezone.now') as mock_now:
            mock_now.return_value = timezone.make_aware(
                timezone.datetime(2024, 1, 1, 0, 0, 0)
            )

            next_number = consecutivo_basico.get_next_number()

        # Assert
        assert next_number == 1

    def test_no_reinicio_sin_flags(self, consecutivo_basico):
        """
        Test: No reinicia si reset_yearly y reset_monthly son False

        Verifica que el consecutivo nunca se reinicia si ambos flags están desactivados.
        """
        # Arrange
        consecutivo_basico.current_number = 5000
        consecutivo_basico.last_reset_date = date(2020, 1, 1)
        consecutivo_basico.reset_yearly = False
        consecutivo_basico.reset_monthly = False
        consecutivo_basico.save()

        # Act
        with patch('django.utils.timezone.now') as mock_now:
            mock_now.return_value = timezone.make_aware(
                timezone.datetime(2024, 12, 31, 0, 0, 0)
            )

            next_number = consecutivo_basico.get_next_number()

        # Assert
        assert next_number == 5001  # Continuó incrementando

    def test_primer_uso_sin_last_reset_date(self, consecutivo_basico):
        """
        Test: Primer uso cuando last_reset_date es None

        Verifica que funciona correctamente en el primer uso.
        """
        # Arrange
        consecutivo_basico.current_number = 0
        consecutivo_basico.last_reset_date = None
        consecutivo_basico.reset_yearly = True
        consecutivo_basico.save()

        # Act
        next_number = consecutivo_basico.get_next_number()

        # Assert
        assert next_number == 1
        consecutivo_basico.refresh_from_db()
        assert consecutivo_basico.last_reset_date is not None


# =============================================================================
# TESTS DE SERVICIO CENTRALIZADO
# =============================================================================

@pytest.mark.django_db
class TestConsecutivoServicio:
    """Tests para el servicio centralizado obtener_siguiente_consecutivo."""

    def test_obtener_siguiente_consecutivo_exitoso(self, consecutivo_basico):
        """
        Test: Servicio centralizado obtiene consecutivo correctamente

        Verifica que obtener_siguiente_consecutivo() funciona correctamente
        con el código del tipo de documento.
        """
        # Act
        with patch('django.utils.timezone.now') as mock_now:
            mock_now.return_value = timezone.make_aware(
                timezone.datetime(2024, 6, 15, 0, 0, 0)
            )

            consecutivo = ConsecutivoConfig.obtener_siguiente_consecutivo('TEST_DOC')

        # Assert
        assert consecutivo == 'FAC-2024-00001'

    def test_obtener_siguiente_consecutivo_tipo_inexistente(self, db):
        """
        Test: Excepción si no existe configuración para el tipo

        Verifica que lanza DoesNotExist con mensaje descriptivo.
        """
        # Act & Assert
        with pytest.raises(ConsecutivoConfig.DoesNotExist) as exc_info:
            ConsecutivoConfig.obtener_siguiente_consecutivo('TIPO_INEXISTENTE')

        assert 'No existe configuración' in str(exc_info.value)
        assert 'TIPO_INEXISTENTE' in str(exc_info.value)

    def test_obtener_siguiente_consecutivo_inactivo(self, consecutivo_basico):
        """
        Test: Excepción si el consecutivo está inactivo

        Verifica que lanza ValueError si is_active=False.
        """
        # Arrange
        consecutivo_basico.is_active = False
        consecutivo_basico.save()

        # Act & Assert
        with pytest.raises(ValueError) as exc_info:
            ConsecutivoConfig.obtener_siguiente_consecutivo('TEST_DOC')

        assert 'inactivo' in str(exc_info.value)


# =============================================================================
# TESTS DE THREAD-SAFETY (TransactionTestCase)
# =============================================================================

class TestConsecutivoThreadSafety(TransactionTestCase):
    """
    Tests de concurrencia para verificar thread-safety.

    Usa TransactionTestCase en lugar de pytest para manejar transacciones
    correctamente en tests de concurrencia.
    """

    def setUp(self):
        """Setup para cada test."""
        self.categoria = CategoriaDocumento.objects.create(
            code='THREAD_CAT',
            name='Categoría Thread Test',
            color='blue',
            is_active=True
        )
        self.tipo_doc = TipoDocumento.objects.create(
            code='THREAD_DOC',
            name='Documento Thread Test',
            categoria=self.categoria,
            prefijo_sugerido='THR',
            is_active=True
        )
        self.consecutivo = ConsecutivoConfig.objects.create(
            tipo_documento=self.tipo_doc,
            prefix='THR',
            current_number=0,
            padding=5,
            include_year=True,
            separator='-',
            reset_yearly=False,
            is_active=True
        )

    def test_thread_safety_concurrent_access(self):
        """
        Test: Thread-safety con acceso concurrente

        Verifica que select_for_update() previene race conditions
        cuando múltiples threads solicitan consecutivos simultáneamente.
        """
        # Arrange
        num_threads = 10
        results = []
        errors = []

        def get_consecutivo():
            try:
                from django.db import connection
                connection.ensure_connection()

                config = ConsecutivoConfig.objects.get(pk=self.consecutivo.pk)
                number = config.get_next_number()
                results.append(number)
            except Exception as e:
                errors.append(str(e))

        # Act
        threads = []
        for _ in range(num_threads):
            thread = threading.Thread(target=get_consecutivo)
            threads.append(thread)
            thread.start()

        for thread in threads:
            thread.join()

        # Assert
        assert len(errors) == 0, f"Errores encontrados: {errors}"
        assert len(results) == num_threads
        assert len(set(results)) == num_threads  # Todos únicos
        assert sorted(results) == list(range(1, num_threads + 1))

    def test_thread_safety_no_duplicates(self):
        """
        Test: No genera números duplicados bajo concurrencia

        Verifica que no se generan consecutivos duplicados.
        """
        # Arrange
        num_threads = 20
        consecutivos_generados = []
        lock = threading.Lock()

        def generar_consecutivo():
            try:
                from django.db import connection
                connection.ensure_connection()

                consecutivo = ConsecutivoConfig.obtener_siguiente_consecutivo('THREAD_DOC')
                with lock:
                    consecutivos_generados.append(consecutivo)
            except Exception:
                pass

        # Act
        threads = []
        for _ in range(num_threads):
            thread = threading.Thread(target=generar_consecutivo)
            threads.append(thread)
            thread.start()

        for thread in threads:
            thread.join()

        # Assert
        assert len(consecutivos_generados) == num_threads
        # Verificar que no hay duplicados
        assert len(set(consecutivos_generados)) == len(consecutivos_generados)


# =============================================================================
# TESTS DE EDGE CASES Y VALIDACIONES
# =============================================================================

@pytest.mark.django_db
class TestConsecutivoEdgeCases:
    """Tests para casos límite y validaciones."""

    def test_numero_muy_grande(self, consecutivo_basico):
        """
        Test: Números muy grandes superan el padding

        Verifica que números mayores al padding se muestran completos.
        """
        # Arrange
        consecutivo_basico.current_number = 999999
        consecutivo_basico.padding = 5
        consecutivo_basico.save()

        # Act
        next_num = consecutivo_basico.get_next_number()
        resultado = consecutivo_basico.format_number(next_num)

        # Assert
        assert '1000000' in resultado  # Sin truncar

    def test_prefijo_vacio(self, tipo_documento):
        """
        Test: Consecutivo con prefijo vacío

        Verifica que funciona correctamente sin prefijo.
        """
        # Arrange
        config = ConsecutivoConfig.objects.create(
            tipo_documento=tipo_documento,
            prefix='',
            current_number=0,
            padding=3,
            include_year=False,
            separator='-',
            is_active=True
        )

        # Act
        resultado = config.format_number(number=5)

        # Assert
        # Debería ser "-005" o "005" dependiendo de cómo maneja el separador
        assert '005' in resultado

    def test_onetoone_constraint(self, db, tipo_documento, consecutivo_basico):
        """
        Test: OneToOneField constraint - un tipo solo puede tener un consecutivo

        Verifica que no se pueden crear múltiples consecutivos para el mismo tipo.
        """
        # Act & Assert
        with pytest.raises(Exception):  # IntegrityError o similar
            ConsecutivoConfig.objects.create(
                tipo_documento=tipo_documento,  # Mismo tipo
                prefix='DUP',
                current_number=0,
                padding=5,
                is_active=True
            )

    def test_str_method(self, consecutivo_basico):
        """
        Test: Método __str__ retorna formato esperado
        """
        # Act
        str_result = str(consecutivo_basico)

        # Assert
        assert 'Documento Test' in str_result
        assert 'FAC' in str_result

    def test_multiple_consecutivos_diferentes_tipos(self, db, categoria_documento):
        """
        Test: Múltiples consecutivos para diferentes tipos funcionan independientemente

        Verifica que diferentes tipos de documento tienen contadores independientes.
        """
        # Arrange
        tipo1 = TipoDocumento.objects.create(
            code='TIPO1',
            name='Tipo 1',
            categoria=categoria_documento,
            is_active=True
        )
        tipo2 = TipoDocumento.objects.create(
            code='TIPO2',
            name='Tipo 2',
            categoria=categoria_documento,
            is_active=True
        )

        config1 = ConsecutivoConfig.objects.create(
            tipo_documento=tipo1,
            prefix='T1',
            current_number=0,
            padding=3,
            include_year=False,
            separator='-',
            is_active=True
        )
        config2 = ConsecutivoConfig.objects.create(
            tipo_documento=tipo2,
            prefix='T2',
            current_number=0,
            padding=3,
            include_year=False,
            separator='-',
            is_active=True
        )

        # Act
        cons1_1 = config1.generate_next()
        cons2_1 = config2.generate_next()
        cons1_2 = config1.generate_next()
        cons2_2 = config2.generate_next()

        # Assert
        assert cons1_1 == 'T1-001'
        assert cons2_1 == 'T2-001'
        assert cons1_2 == 'T1-002'
        assert cons2_2 == 'T2-002'


# =============================================================================
# TESTS DE INTEGRACIÓN
# =============================================================================

@pytest.mark.django_db
class TestConsecutivoIntegracion:
    """Tests de integración con escenarios reales."""

    def test_flujo_completo_facturacion_anual(self, db, categoria_documento):
        """
        Test: Flujo completo de facturación con reinicio anual

        Simula un año completo de facturación con reinicio anual.
        """
        # Arrange
        tipo_factura = TipoDocumento.objects.create(
            code='FACTURA',
            name='Factura de Venta',
            categoria=categoria_documento,
            prefijo_sugerido='FAC',
            is_active=True
        )
        config = ConsecutivoConfig.objects.create(
            tipo_documento=tipo_factura,
            prefix='FAC',
            current_number=0,
            padding=5,
            include_year=True,
            separator='-',
            reset_yearly=True,
            last_reset_date=date(2023, 12, 31),
            is_active=True
        )

        # Act - Simular facturas en 2024
        with patch('django.utils.timezone.now') as mock_now:
            # Enero 2024
            mock_now.return_value = timezone.make_aware(
                timezone.datetime(2024, 1, 15, 10, 0, 0)
            )
            fac1 = config.generate_next()

            # Junio 2024
            mock_now.return_value = timezone.make_aware(
                timezone.datetime(2024, 6, 20, 10, 0, 0)
            )
            fac2 = config.generate_next()

            # Diciembre 2024
            mock_now.return_value = timezone.make_aware(
                timezone.datetime(2024, 12, 31, 23, 59, 0)
            )
            fac3 = config.generate_next()

            # Enero 2025 - Debe reiniciar
            config.refresh_from_db()
            config.current_number = 999  # Simular muchas facturas
            config.save()

            mock_now.return_value = timezone.make_aware(
                timezone.datetime(2025, 1, 1, 0, 1, 0)
            )
            fac_2025 = config.generate_next()

        # Assert
        assert fac1 == 'FAC-2024-00001'
        assert fac2 == 'FAC-2024-00002'
        assert fac3 == 'FAC-2024-00003'
        assert fac_2025 == 'FAC-2025-00001'  # Se reinició

    def test_escenario_orden_compra_mensual(self, db, categoria_documento):
        """
        Test: Escenario de órdenes de compra con reinicio mensual

        Simula órdenes de compra que se reinician cada mes.
        """
        # Arrange
        tipo_oc = TipoDocumento.objects.create(
            code='ORDEN_COMPRA',
            name='Orden de Compra',
            categoria=categoria_documento,
            prefijo_sugerido='OC',
            is_active=True
        )
        config = ConsecutivoConfig.objects.create(
            tipo_documento=tipo_oc,
            prefix='OC',
            current_number=0,
            padding=4,
            include_month=True,
            separator='/',
            reset_monthly=True,
            last_reset_date=date(2024, 5, 31),
            is_active=True
        )

        # Act
        with patch('django.utils.timezone.now') as mock_now:
            # Junio 2024
            mock_now.return_value = timezone.make_aware(
                timezone.datetime(2024, 6, 5, 10, 0, 0)
            )
            oc1 = config.generate_next()
            oc2 = config.generate_next()

            # Julio 2024 - Debe reiniciar
            mock_now.return_value = timezone.make_aware(
                timezone.datetime(2024, 7, 1, 10, 0, 0)
            )
            oc3 = config.generate_next()

        # Assert
        assert oc1 == 'OC/202406/0001'
        assert oc2 == 'OC/202406/0002'
        assert oc3 == 'OC/202407/0001'  # Se reinició
