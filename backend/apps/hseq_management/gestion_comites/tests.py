"""
Tests para Gestión de Comités HSEQ
"""
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from .models import (
    TipoComite, Comite, MiembroComite, Reunion, AsistenciaReunion,
    ActaReunion, Compromiso, SeguimientoCompromiso, Votacion, VotoMiembro
)


class TipoComiteTestCase(TestCase):
    """Tests para TipoComite."""

    def setUp(self):
        """Configuración inicial para las pruebas."""
        self.tipo_comite = TipoComite.objects.create(
            empresa_id=1,
            codigo='COPASST',
            nombre='Comité Paritario de Seguridad y Salud en el Trabajo',
            descripcion='COPASST según Resolución 2013 de 1986',
            normativa_base='Resolución 2013 de 1986',
            periodicidad_reuniones='MENSUAL',
            num_minimo_miembros=2,
            num_maximo_miembros=10,
            requiere_eleccion=True,
            duracion_periodo_meses=24,
            roles_disponibles=['Presidente', 'Secretario', 'Vocal'],
            requiere_quorum=True,
            porcentaje_quorum=50,
            activo=True
        )

    def test_tipo_comite_creation(self):
        """Prueba la creación de un tipo de comité."""
        self.assertEqual(self.tipo_comite.codigo, 'COPASST')
        self.assertEqual(self.tipo_comite.nombre, 'Comité Paritario de Seguridad y Salud en el Trabajo')
        self.assertTrue(self.tipo_comite.activo)

    def test_str_representation(self):
        """Prueba la representación en string."""
        self.assertEqual(
            str(self.tipo_comite),
            'COPASST - Comité Paritario de Seguridad y Salud en el Trabajo'
        )


class ComiteTestCase(TestCase):
    """Tests para Comite."""

    def setUp(self):
        """Configuración inicial para las pruebas."""
        self.tipo_comite = TipoComite.objects.create(
            empresa_id=1,
            codigo='COPASST',
            nombre='COPASST',
            periodicidad_reuniones='MENSUAL',
            num_minimo_miembros=2,
            requiere_quorum=True,
            porcentaje_quorum=50,
            activo=True
        )

        self.comite = Comite.objects.create(
            empresa_id=1,
            tipo_comite=self.tipo_comite,
            codigo_comite='COPASST-2024-2026',
            nombre='COPASST 2024-2026',
            fecha_inicio=timezone.now().date(),
            fecha_fin=timezone.now().date() + timedelta(days=730),
            periodo_descripcion='2024-2026',
            estado='CONFORMACION'
        )

    def test_comite_creation(self):
        """Prueba la creación de un comité."""
        self.assertEqual(self.comite.codigo_comite, 'COPASST-2024-2026')
        self.assertEqual(self.comite.estado, 'CONFORMACION')

    def test_esta_vigente(self):
        """Prueba el método esta_vigente."""
        self.comite.estado = 'ACTIVO'
        self.comite.save()
        self.assertTrue(self.comite.esta_vigente)

    def test_num_miembros(self):
        """Prueba el conteo de miembros activos."""
        MiembroComite.objects.create(
            empresa_id=1,
            comite=self.comite,
            empleado_id=1,
            empleado_nombre='Juan Pérez',
            rol='Presidente',
            fecha_inicio=timezone.now().date(),
            activo=True
        )
        self.assertEqual(self.comite.num_miembros, 1)

    def test_cumple_quorum(self):
        """Prueba el método cumple_quorum."""
        # Crear 4 miembros
        for i in range(1, 5):
            MiembroComite.objects.create(
                empresa_id=1,
                comite=self.comite,
                empleado_id=i,
                empleado_nombre=f'Miembro {i}',
                rol='Vocal',
                fecha_inicio=timezone.now().date(),
                activo=True
            )

        # Con 4 miembros, necesita al menos 2 asistentes (50%)
        self.assertTrue(self.comite.cumple_quorum(2))
        self.assertTrue(self.comite.cumple_quorum(3))
        self.assertFalse(self.comite.cumple_quorum(1))


class ReunionTestCase(TestCase):
    """Tests para Reunion."""

    def setUp(self):
        """Configuración inicial para las pruebas."""
        tipo_comite = TipoComite.objects.create(
            empresa_id=1,
            codigo='COPASST',
            nombre='COPASST',
            periodicidad_reuniones='MENSUAL',
            num_minimo_miembros=2,
            activo=True
        )

        comite = Comite.objects.create(
            empresa_id=1,
            tipo_comite=tipo_comite,
            codigo_comite='COPASST-2024',
            nombre='COPASST 2024',
            fecha_inicio=timezone.now().date(),
            fecha_fin=timezone.now().date() + timedelta(days=365),
            periodo_descripcion='2024',
            estado='ACTIVO'
        )

        self.reunion = Reunion.objects.create(
            empresa_id=1,
            comite=comite,
            numero_reunion='001/2024',
            tipo='ORDINARIA',
            fecha_programada=timezone.now().date(),
            hora_inicio_programada=timezone.now().time(),
            lugar='Sala de Juntas',
            modalidad='PRESENCIAL',
            agenda='Revisión de indicadores',
            estado='PROGRAMADA'
        )

    def test_reunion_creation(self):
        """Prueba la creación de una reunión."""
        self.assertEqual(self.reunion.numero_reunion, '001/2024')
        self.assertEqual(self.reunion.estado, 'PROGRAMADA')

    def test_duracion_minutos(self):
        """Prueba el cálculo de duración de la reunión."""
        self.reunion.fecha_realizada = timezone.now().date()
        self.reunion.hora_inicio_real = timezone.now().time()

        # Simular 2 horas después
        import datetime
        hora_fin = (datetime.datetime.combine(
            datetime.date.today(),
            self.reunion.hora_inicio_real
        ) + timedelta(hours=2)).time()

        self.reunion.hora_fin_real = hora_fin
        self.reunion.save()

        duracion = self.reunion.duracion_minutos
        self.assertIsNotNone(duracion)
        self.assertGreater(duracion, 0)


class CompromisoTestCase(TestCase):
    """Tests para Compromiso."""

    def setUp(self):
        """Configuración inicial para las pruebas."""
        tipo_comite = TipoComite.objects.create(
            empresa_id=1,
            codigo='COPASST',
            nombre='COPASST',
            periodicidad_reuniones='MENSUAL',
            num_minimo_miembros=2,
            activo=True
        )

        comite = Comite.objects.create(
            empresa_id=1,
            tipo_comite=tipo_comite,
            codigo_comite='COPASST-2024',
            nombre='COPASST 2024',
            fecha_inicio=timezone.now().date(),
            fecha_fin=timezone.now().date() + timedelta(days=365),
            periodo_descripcion='2024',
            estado='ACTIVO'
        )

        reunion = Reunion.objects.create(
            empresa_id=1,
            comite=comite,
            numero_reunion='001/2024',
            tipo='ORDINARIA',
            fecha_programada=timezone.now().date(),
            hora_inicio_programada=timezone.now().time(),
            lugar='Sala de Juntas',
            modalidad='PRESENCIAL',
            agenda='Revisión',
            estado='REALIZADA'
        )

        acta = ActaReunion.objects.create(
            empresa_id=1,
            reunion=reunion,
            numero_acta='ACTA-001/2024',
            desarrollo='Reunión ordinaria',
            estado='APROBADA'
        )

        self.compromiso = Compromiso.objects.create(
            empresa_id=1,
            acta=acta,
            numero_compromiso='COMP-001/2024',
            descripcion='Actualizar matriz de peligros',
            tipo='ACCION',
            responsable_id=1,
            responsable_nombre='Juan Pérez',
            fecha_compromiso=timezone.now().date(),
            fecha_limite=timezone.now().date() + timedelta(days=30),
            estado='PENDIENTE',
            prioridad='ALTA'
        )

    def test_compromiso_creation(self):
        """Prueba la creación de un compromiso."""
        self.assertEqual(self.compromiso.numero_compromiso, 'COMP-001/2024')
        self.assertEqual(self.compromiso.estado, 'PENDIENTE')

    def test_esta_vencido(self):
        """Prueba el método esta_vencido."""
        # Compromiso no vencido
        self.assertFalse(self.compromiso.esta_vencido)

        # Compromiso vencido
        self.compromiso.fecha_limite = timezone.now().date() - timedelta(days=1)
        self.compromiso.save()
        self.assertTrue(self.compromiso.esta_vencido)

    def test_dias_para_vencimiento(self):
        """Prueba el cálculo de días para vencimiento."""
        # Compromiso con 30 días
        dias = self.compromiso.dias_para_vencimiento
        self.assertGreater(dias, 0)


class VotacionTestCase(TestCase):
    """Tests para Votacion."""

    def setUp(self):
        """Configuración inicial para las pruebas."""
        tipo_comite = TipoComite.objects.create(
            empresa_id=1,
            codigo='COPASST',
            nombre='COPASST',
            periodicidad_reuniones='MENSUAL',
            num_minimo_miembros=2,
            activo=True
        )

        comite = Comite.objects.create(
            empresa_id=1,
            tipo_comite=tipo_comite,
            codigo_comite='COPASST-2024',
            nombre='COPASST 2024',
            fecha_inicio=timezone.now().date(),
            fecha_fin=timezone.now().date() + timedelta(days=365),
            periodo_descripcion='2024',
            estado='ACTIVO'
        )

        self.votacion = Votacion.objects.create(
            empresa_id=1,
            comite=comite,
            numero_votacion='VOT-001/2024',
            titulo='Elección de presidente',
            descripcion='Votación para elegir presidente del comité',
            tipo='ELECCION',
            fecha_inicio=timezone.now(),
            fecha_fin=timezone.now() + timedelta(hours=24),
            es_secreta=False,
            opciones=[
                {'id': 1, 'texto': 'Candidato A'},
                {'id': 2, 'texto': 'Candidato B'}
            ],
            estado='PROGRAMADA'
        )

    def test_votacion_creation(self):
        """Prueba la creación de una votación."""
        self.assertEqual(self.votacion.numero_votacion, 'VOT-001/2024')
        self.assertEqual(self.votacion.tipo, 'ELECCION')

    def test_esta_activa(self):
        """Prueba el método esta_activa."""
        # Iniciar votación
        self.votacion.estado = 'EN_CURSO'
        self.votacion.save()
        self.assertTrue(self.votacion.esta_activa)

        # Cerrar votación
        self.votacion.estado = 'CERRADA'
        self.votacion.save()
        self.assertFalse(self.votacion.esta_activa)
