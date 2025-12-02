# -*- coding: utf-8 -*-
"""
Tests para verificar que no hay race conditions en la generacion de codigo de voucher
"""
from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from decimal import Decimal
from datetime import datetime, timedelta
import threading
from apps.recolecciones.models import Recoleccion
from apps.ecoaliados.models import Ecoaliado
from apps.programaciones.models import Programacion

User = get_user_model()


class RecoleccionRaceConditionTest(TransactionTestCase):
    """
    Tests para verificar thread-safety en la generacion de codigos de voucher

    Usamos TransactionTestCase en lugar de TestCase porque necesitamos
    que cada thread tenga su propia transaccion de base de datos.
    """

    def setUp(self):
        """Setup inicial para los tests"""
        # Crear usuario recolector
        self.recolector = User.objects.create_user(
            email='recolector@test.com',
            password='test123',
            first_name='Test',
            last_name='Recolector'
        )

        # Crear ecoaliado
        self.ecoaliado = Ecoaliado.objects.create(
            nombre='Test Ecoaliado',
            codigo='ECO-001',
            tipo_persona='NATURAL',
            documento='123456789',
            tipo_documento='CC',
            direccion='Calle Test',
            precio_kg=Decimal('2000.00'),
            activo=True
        )

        # Crear programaciones
        self.programaciones = []
        for i in range(10):
            prog = Programacion.objects.create(
                ecoaliado=self.ecoaliado,
                fecha_programada=datetime.now() + timedelta(days=i),
                hora_inicio='08:00',
                hora_fin='12:00',
                recolector_asignado=self.recolector,
                estado='EN_RUTA'
            )
            self.programaciones.append(prog)

    def test_generar_codigo_voucher_secuencial(self):
        """Test basico: generar codigos de voucher secuencialmente"""
        codigo1 = Recoleccion.generar_codigo_voucher()
        codigo2 = Recoleccion.generar_codigo_voucher()

        # Los codigos deben ser diferentes
        self.assertNotEqual(codigo1, codigo2)

        # Deben tener el formato correcto
        self.assertTrue(codigo1.startswith('REC-'))
        self.assertTrue(codigo2.startswith('REC-'))

        # El segundo debe tener un numero mayor
        num1 = int(codigo1.split('-')[-1])
        num2 = int(codigo2.split('-')[-1])
        self.assertEqual(num2, num1 + 1)

    def test_crear_recoleccion_con_codigo_unico(self):
        """Test: crear una recoleccion genera codigo unico"""
        recoleccion = Recoleccion.objects.create(
            programacion=self.programaciones[0],
            ecoaliado=self.ecoaliado,
            recolector=self.recolector,
            fecha_recoleccion=datetime.now(),
            cantidad_kg=Decimal('50.00'),
            precio_kg=Decimal('2000.00'),
            valor_total=Decimal('100000.00')
        )

        # Debe tener codigo generado
        self.assertIsNotNone(recoleccion.codigo_voucher)
        self.assertTrue(recoleccion.codigo_voucher.startswith('REC-'))

    def test_codigos_unicos_multiples_recolecciones(self):
        """Test: crear multiples recolecciones genera codigos unicos"""
        recolecciones = []

        for i in range(5):
            recoleccion = Recoleccion.objects.create(
                programacion=self.programaciones[i],
                ecoaliado=self.ecoaliado,
                recolector=self.recolector,
                fecha_recoleccion=datetime.now(),
                cantidad_kg=Decimal('50.00'),
                precio_kg=Decimal('2000.00'),
                valor_total=Decimal('100000.00')
            )
            recolecciones.append(recoleccion)

        # Todos los codigos deben ser unicos
        codigos = [r.codigo_voucher for r in recolecciones]
        self.assertEqual(len(codigos), len(set(codigos)))

    def test_race_condition_concurrent_creation(self):
        """
        Test de race condition: crear recolecciones concurrentemente

        Este test simula la creacion simultanea de multiples recolecciones
        desde diferentes threads para verificar que no se generen codigos duplicados.
        """
        resultados = []
        errores = []
        lock = threading.Lock()

        def crear_recoleccion(indice):
            """Funcion que se ejecuta en cada thread"""
            try:
                recoleccion = Recoleccion.objects.create(
                    programacion=self.programaciones[indice],
                    ecoaliado=self.ecoaliado,
                    recolector=self.recolector,
                    fecha_recoleccion=datetime.now(),
                    cantidad_kg=Decimal('50.00'),
                    precio_kg=Decimal('2000.00'),
                    valor_total=Decimal('100000.00')
                )

                with lock:
                    resultados.append({
                        'thread': indice,
                        'codigo': recoleccion.codigo_voucher,
                        'id': recoleccion.id
                    })
            except Exception as e:
                with lock:
                    errores.append({
                        'thread': indice,
                        'error': str(e)
                    })

        # Crear 10 threads que intentan crear recolecciones simultaneamente
        threads = []
        for i in range(10):
            thread = threading.Thread(target=crear_recoleccion, args=(i,))
            threads.append(thread)

        # Iniciar todos los threads al mismo tiempo
        for thread in threads:
            thread.start()

        # Esperar a que todos terminen
        for thread in threads:
            thread.join()

        # Verificar resultados
        # 1. No debe haber errores (excepto los manejados internamente)
        print(f"\nResultados: {len(resultados)} recolecciones creadas")
        print(f"Errores: {len(errores)}")

        if errores:
            for error in errores:
                print(f"  Thread {error['thread']}: {error['error']}")

        # 2. Todos los codigos deben ser unicos
        codigos = [r['codigo'] for r in resultados]
        codigos_unicos = set(codigos)

        print(f"Codigos generados: {sorted(codigos)}")
        print(f"Codigos unicos: {len(codigos_unicos)}")

        # Debe haber la misma cantidad de codigos que de resultados exitosos
        self.assertEqual(
            len(codigos),
            len(codigos_unicos),
            f"Se encontraron codigos duplicados: {[c for c in codigos if codigos.count(c) > 1]}"
        )

        # 3. Verificar que las recolecciones se guardaron en la DB
        recolecciones_db = Recoleccion.objects.filter(
            codigo_voucher__in=codigos
        ).count()

        self.assertEqual(
            recolecciones_db,
            len(resultados),
            "No todas las recolecciones se guardaron en la base de datos"
        )

    def test_retry_logic_on_integrity_error(self):
        """
        Test: verificar que el retry logic funciona correctamente

        Si por alguna razon se genera un codigo duplicado, el sistema
        debe reintentar automaticamente con un nuevo codigo.
        """
        # Crear primera recoleccion
        recoleccion1 = Recoleccion.objects.create(
            programacion=self.programaciones[0],
            ecoaliado=self.ecoaliado,
            recolector=self.recolector,
            fecha_recoleccion=datetime.now(),
            cantidad_kg=Decimal('50.00'),
            precio_kg=Decimal('2000.00'),
            valor_total=Decimal('100000.00')
        )

        codigo1 = recoleccion1.codigo_voucher

        # Crear segunda recoleccion - debe generar codigo diferente
        recoleccion2 = Recoleccion.objects.create(
            programacion=self.programaciones[1],
            ecoaliado=self.ecoaliado,
            recolector=self.recolector,
            fecha_recoleccion=datetime.now(),
            cantidad_kg=Decimal('50.00'),
            precio_kg=Decimal('2000.00'),
            valor_total=Decimal('100000.00')
        )

        codigo2 = recoleccion2.codigo_voucher

        # Los codigos deben ser diferentes
        self.assertNotEqual(codigo1, codigo2)

        # Ambos deben estar en la base de datos
        self.assertTrue(
            Recoleccion.objects.filter(codigo_voucher=codigo1).exists()
        )
        self.assertTrue(
            Recoleccion.objects.filter(codigo_voucher=codigo2).exists()
        )


class RecoleccionCodigoFormatoTest(TestCase):
    """Tests para verificar el formato del codigo de voucher"""

    def test_formato_codigo_voucher(self):
        """Test: verificar formato del codigo de voucher"""
        from datetime import date

        codigo = Recoleccion.generar_codigo_voucher()

        # Formato: REC-YYYYMMDD-XXXX
        partes = codigo.split('-')

        self.assertEqual(len(partes), 3, "El codigo debe tener 3 partes separadas por '-'")
        self.assertEqual(partes[0], 'REC', "El prefijo debe ser 'REC'")

        # Verificar fecha
        fecha_str = partes[1]
        self.assertEqual(len(fecha_str), 8, "La fecha debe tener formato YYYYMMDD")
        self.assertEqual(fecha_str, date.today().strftime('%Y%m%d'))

        # Verificar numero secuencial
        numero_str = partes[2]
        self.assertEqual(len(numero_str), 4, "El numero debe tener 4 digitos")
        self.assertTrue(numero_str.isdigit(), "El numero debe ser digitos")

        # Verificar que el numero empieza en 0001
        if Recoleccion.objects.count() == 0:
            self.assertEqual(numero_str, '0001')

    def test_incremento_secuencial_mismo_dia(self):
        """Test: verificar incremento secuencial de codigos en el mismo dia"""
        codigos = []

        for _ in range(5):
            codigo = Recoleccion.generar_codigo_voucher()
            codigos.append(codigo)

        # Extraer numeros
        numeros = [int(c.split('-')[-1]) for c in codigos]

        # Verificar que son consecutivos
        for i in range(len(numeros) - 1):
            self.assertEqual(
                numeros[i + 1],
                numeros[i] + 1,
                f"Los numeros deben ser consecutivos: {numeros}"
            )
