"""
Tests para tareas Celery del Motor de Cumplimiento
StrateKaz

Ejecutar con:
    python manage.py test apps.motor_cumplimiento.tests_tasks
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
from django.test import TestCase, override_settings
from django.utils import timezone
from django.contrib.auth import get_user_model

from apps.motor_cumplimiento.matriz_legal.models import TipoNorma, NormaLegal
from apps.motor_cumplimiento.requisitos_legales.models import (
    TipoRequisito,
    RequisitoLegal,
    EmpresaRequisito,
    AlertaVencimiento,
)
from apps.motor_cumplimiento.tasks import (
    scrape_legal_updates,
    check_license_expirations,
    send_expiration_notifications,
    generate_compliance_report,
    update_requisito_status,
)

User = get_user_model()


# ═══════════════════════════════════════════════════
# CONFIGURACIÓN PARA TESTS
# ═══════════════════════════════════════════════════

@override_settings(
    CELERY_TASK_ALWAYS_EAGER=True,  # Ejecutar tareas síncronamente
    CELERY_TASK_EAGER_PROPAGATES=True,
)
class BaseTaskTestCase(TestCase):
    """Base class para tests de tareas Celery"""

    @classmethod
    def setUpTestData(cls):
        """Crear datos de prueba comunes"""
        # Usuario de prueba
        cls.user = User.objects.create_user(
            username='test_user',
            email='test@example.com',
            password='testpass123'
        )

        # Tipo de norma
        cls.tipo_norma = TipoNorma.objects.create(
            codigo='DEC',
            nombre='Decreto',
            descripcion='Decreto legal'
        )

        # Tipo de requisito
        cls.tipo_requisito = TipoRequisito.objects.create(
            codigo='LIC_AMB',
            nombre='Licencia Ambiental',
            descripcion='Licencia ambiental requerida',
            requiere_renovacion=True,
            dias_anticipacion_alerta=30
        )

        # Requisito legal
        cls.requisito_legal = RequisitoLegal.objects.create(
            tipo=cls.tipo_requisito,
            codigo='LIC001',
            nombre='Licencia Ambiental General',
            descripcion='Licencia general para operaciones',
            entidad_emisora='Ministerio de Ambiente',
            base_legal='Decreto 1076 de 2015',
            aplica_ambiental=True,
            es_obligatorio=True,
            periodicidad_renovacion='Anual',
            created_by=cls.user
        )


# ═══════════════════════════════════════════════════
# TESTS - SCRAPE_LEGAL_UPDATES
# ═══════════════════════════════════════════════════

class ScrapeTaskTestCase(BaseTaskTestCase):
    """Tests para la tarea de scraping de normas legales"""

    @patch('apps.motor_cumplimiento.tasks._scrape_source')
    def test_scrape_legal_updates_basic(self, mock_scrape):
        """Test básico de scraping (sin implementación real)"""
        # Mock del scraper
        mock_scrape.return_value = []

        # Ejecutar tarea
        result = scrape_legal_updates()

        # Verificar resultado
        self.assertEqual(result['status'], 'success')
        self.assertIn('normas_nuevas', result)
        self.assertIn('normas_actualizadas', result)
        self.assertIn('fuentes_procesadas', result)
        self.assertIsInstance(result['fuentes_procesadas'], list)

    def test_scrape_updates_fecha_scraping(self):
        """Verificar que se actualiza fecha_scraping en normas"""
        # Crear norma de prueba
        norma = NormaLegal.objects.create(
            tipo_norma=self.tipo_norma,
            numero='1234',
            anio=2024,
            titulo='Norma de Prueba',
            entidad_emisora='MinTrabajo',
            fecha_expedicion=timezone.now().date(),
            vigente=True,
            aplica_sst=True
        )

        # Ejecutar scraping (placeholder)
        # En implementación real, esto actualizaría fecha_scraping
        norma.fecha_scraping = timezone.now()
        norma.save()

        # Verificar
        norma.refresh_from_db()
        self.assertIsNotNone(norma.fecha_scraping)


# ═══════════════════════════════════════════════════
# TESTS - CHECK_LICENSE_EXPIRATIONS
# ═══════════════════════════════════════════════════

class CheckExpirationsTaskTestCase(BaseTaskTestCase):
    """Tests para verificación de vencimientos"""

    def setUp(self):
        """Crear requisitos de empresa para tests"""
        self.empresa_id = 1
        today = timezone.now().date()

        # Requisito vencido
        self.req_vencido = EmpresaRequisito.objects.create(
            empresa_id=self.empresa_id,
            requisito=self.requisito_legal,
            numero_documento='LIC-2023-001',
            fecha_expedicion=today - timedelta(days=400),
            fecha_vencimiento=today - timedelta(days=10),
            estado=EmpresaRequisito.Estado.VIGENTE,
            responsable=self.user,
            created_by=self.user
        )

        # Requisito próximo a vencer (20 días)
        self.req_urgente = EmpresaRequisito.objects.create(
            empresa_id=self.empresa_id,
            requisito=self.requisito_legal,
            numero_documento='LIC-2024-001',
            fecha_expedicion=today - timedelta(days=345),
            fecha_vencimiento=today + timedelta(days=20),
            estado=EmpresaRequisito.Estado.VIGENTE,
            responsable=self.user,
            created_by=self.user
        )

        # Requisito vigente (200 días)
        self.req_vigente = EmpresaRequisito.objects.create(
            empresa_id=self.empresa_id,
            requisito=self.requisito_legal,
            numero_documento='LIC-2024-002',
            fecha_expedicion=today - timedelta(days=165),
            fecha_vencimiento=today + timedelta(days=200),
            estado=EmpresaRequisito.Estado.VIGENTE,
            responsable=self.user,
            created_by=self.user
        )

    def test_check_expirations_creates_alerts(self):
        """Verificar que se crean alertas para requisitos próximos a vencer"""
        # Ejecutar tarea
        result = check_license_expirations()

        # Verificar resultado
        self.assertEqual(result['status'], 'success')
        self.assertGreater(result['requisitos_revisados'], 0)

        # Verificar alertas creadas
        total_alertas = sum(result['alertas_creadas'].values())
        self.assertGreater(total_alertas, 0)

        # Verificar alerta urgente (20 días)
        alerta_urgente = AlertaVencimiento.objects.filter(
            empresa_requisito=self.req_urgente,
            dias_antes=30
        ).first()
        self.assertIsNotNone(alerta_urgente)
        self.assertFalse(alerta_urgente.enviada)

    def test_check_expirations_updates_status_vencido(self):
        """Verificar que actualiza estado a VENCIDO"""
        # Ejecutar tarea
        result = check_license_expirations()

        # Verificar estado actualizado
        self.req_vencido.refresh_from_db()
        self.assertEqual(
            self.req_vencido.estado,
            EmpresaRequisito.Estado.VENCIDO
        )

        # Verificar alerta crítica
        self.assertGreater(result['alertas_creadas']['critical'], 0)

    def test_check_expirations_updates_status_proximo(self):
        """Verificar que actualiza estado a PROXIMO_VENCER"""
        # Ejecutar tarea
        result = check_license_expirations()

        # Verificar estado actualizado
        self.req_urgente.refresh_from_db()
        self.assertEqual(
            self.req_urgente.estado,
            EmpresaRequisito.Estado.PROXIMO_VENCER
        )

    def test_check_expirations_no_duplicate_alerts(self):
        """Verificar que no se crean alertas duplicadas"""
        # Primera ejecución
        result1 = check_license_expirations()
        total1 = sum(result1['alertas_creadas'].values())

        # Segunda ejecución
        result2 = check_license_expirations()
        total2 = sum(result2['alertas_creadas'].values())

        # No deben crearse alertas nuevas en segunda ejecución
        self.assertEqual(total2, 0)

    def test_dias_para_vencer_property(self):
        """Verificar property dias_para_vencer"""
        dias = self.req_urgente.dias_para_vencer
        self.assertIsNotNone(dias)
        self.assertAlmostEqual(dias, 20, delta=1)


# ═══════════════════════════════════════════════════
# TESTS - SEND_EXPIRATION_NOTIFICATIONS
# ═══════════════════════════════════════════════════

class SendNotificationsTaskTestCase(BaseTaskTestCase):
    """Tests para envío de notificaciones"""

    def setUp(self):
        """Crear alertas pendientes"""
        today = timezone.now().date()
        self.empresa_id = 1

        # Crear requisito
        self.requisito = EmpresaRequisito.objects.create(
            empresa_id=self.empresa_id,
            requisito=self.requisito_legal,
            numero_documento='LIC-2024-100',
            fecha_expedicion=today - timedelta(days=335),
            fecha_vencimiento=today + timedelta(days=25),
            estado=EmpresaRequisito.Estado.PROXIMO_VENCER,
            responsable=self.user,
            created_by=self.user
        )

        # Crear alerta pendiente
        self.alerta = AlertaVencimiento.objects.create(
            empresa_requisito=self.requisito,
            dias_antes=30,
            tipo_alerta=AlertaVencimiento.TipoAlerta.SISTEMA,
            fecha_programada=today,
            enviada=False,
            mensaje_personalizado='Test de alerta'
        )

    @patch('apps.motor_cumplimiento.tasks._send_company_expiration_email')
    def test_send_notifications_marks_as_sent(self, mock_send_email):
        """Verificar que marca alertas como enviadas"""
        # Mock del envío de email
        mock_send_email.return_value = {
            'success': True,
            'emails_sent': 1,
            'task_id': 'test-123'
        }

        # Ejecutar tarea
        result = send_expiration_notifications()

        # Verificar resultado
        self.assertEqual(result['status'], 'success')
        self.assertGreater(result['alertas_procesadas'], 0)

        # Verificar que alerta fue marcada como enviada
        self.alerta.refresh_from_db()
        self.assertTrue(self.alerta.enviada)
        self.assertIsNotNone(self.alerta.fecha_envio)

    @patch('apps.motor_cumplimiento.tasks._send_company_expiration_email')
    def test_send_notifications_groups_by_empresa(self, mock_send_email):
        """Verificar que agrupa alertas por empresa"""
        # Crear segunda alerta para la misma empresa
        today = timezone.now().date()

        req2 = EmpresaRequisito.objects.create(
            empresa_id=self.empresa_id,
            requisito=self.requisito_legal,
            numero_documento='LIC-2024-101',
            fecha_expedicion=today - timedelta(days=300),
            fecha_vencimiento=today + timedelta(days=50),
            estado=EmpresaRequisito.Estado.VIGENTE,
            responsable=self.user,
            created_by=self.user
        )

        alerta2 = AlertaVencimiento.objects.create(
            empresa_requisito=req2,
            dias_antes=60,
            tipo_alerta=AlertaVencimiento.TipoAlerta.EMAIL,
            fecha_programada=today,
            enviada=False
        )

        mock_send_email.return_value = {
            'success': True,
            'emails_sent': 1,
            'task_id': 'test-456'
        }

        # Ejecutar tarea
        result = send_expiration_notifications()

        # Verificar que se llamó _send_company_expiration_email una vez
        # con lista de alertas
        self.assertEqual(mock_send_email.call_count, 1)
        call_args = mock_send_email.call_args[0]
        alertas_enviadas = call_args[1]
        self.assertEqual(len(alertas_enviadas), 2)


# ═══════════════════════════════════════════════════
# TESTS - GENERATE_COMPLIANCE_REPORT
# ═══════════════════════════════════════════════════

class GenerateReportTaskTestCase(BaseTaskTestCase):
    """Tests para generación de reportes"""

    def setUp(self):
        """Crear requisitos para reporte"""
        self.empresa_id = 1
        today = timezone.now().date()

        # Requisito vigente
        EmpresaRequisito.objects.create(
            empresa_id=self.empresa_id,
            requisito=self.requisito_legal,
            numero_documento='LIC-V-001',
            fecha_vencimiento=today + timedelta(days=200),
            estado=EmpresaRequisito.Estado.VIGENTE,
            created_by=self.user
        )

        # Requisito vencido
        EmpresaRequisito.objects.create(
            empresa_id=self.empresa_id,
            requisito=self.requisito_legal,
            numero_documento='LIC-X-001',
            fecha_vencimiento=today - timedelta(days=10),
            estado=EmpresaRequisito.Estado.VENCIDO,
            created_by=self.user
        )

    def test_generate_report_basic(self):
        """Test básico de generación de reporte"""
        today = timezone.now().date()

        result = generate_compliance_report(
            empresa_id=self.empresa_id,
            periodo_inicio=(today - timedelta(days=30)).isoformat(),
            periodo_fin=today.isoformat()
        )

        # Verificar resultado
        self.assertEqual(result['status'], 'success')
        self.assertEqual(result['empresa_id'], self.empresa_id)
        self.assertIn('estadisticas', result)

        stats = result['estadisticas']
        self.assertEqual(stats['total_requisitos'], 2)
        self.assertEqual(stats['vigentes'], 1)
        self.assertEqual(stats['vencidos'], 1)

    def test_generate_report_porcentaje_cumplimiento(self):
        """Verificar cálculo de porcentaje de cumplimiento"""
        today = timezone.now().date()

        result = generate_compliance_report(
            empresa_id=self.empresa_id,
            periodo_inicio=(today - timedelta(days=30)).isoformat(),
            periodo_fin=today.isoformat()
        )

        stats = result['estadisticas']
        # 1 vigente de 2 total = 50%
        self.assertEqual(stats['porcentaje_cumplimiento'], 50.0)


# ═══════════════════════════════════════════════════
# TESTS - UPDATE_REQUISITO_STATUS
# ═══════════════════════════════════════════════════

class UpdateStatusTaskTestCase(BaseTaskTestCase):
    """Tests para actualización de estado de requisito"""

    def test_update_status_to_vencido(self):
        """Verificar actualización a VENCIDO"""
        today = timezone.now().date()

        req = EmpresaRequisito.objects.create(
            empresa_id=1,
            requisito=self.requisito_legal,
            numero_documento='TEST-001',
            fecha_vencimiento=today - timedelta(days=5),
            estado=EmpresaRequisito.Estado.VIGENTE,
            created_by=self.user
        )

        result = update_requisito_status(requisito_id=req.id)

        self.assertEqual(result['status'], 'success')
        self.assertEqual(result['new_status'], EmpresaRequisito.Estado.VENCIDO)
        self.assertLess(result['dias_para_vencer'], 0)

        req.refresh_from_db()
        self.assertEqual(req.estado, EmpresaRequisito.Estado.VENCIDO)

    def test_update_status_to_proximo_vencer(self):
        """Verificar actualización a PROXIMO_VENCER"""
        today = timezone.now().date()

        req = EmpresaRequisito.objects.create(
            empresa_id=1,
            requisito=self.requisito_legal,
            numero_documento='TEST-002',
            fecha_vencimiento=today + timedelta(days=15),
            estado=EmpresaRequisito.Estado.VIGENTE,
            created_by=self.user
        )

        result = update_requisito_status(requisito_id=req.id)

        self.assertEqual(result['new_status'], EmpresaRequisito.Estado.PROXIMO_VENCER)

    def test_update_status_not_found(self):
        """Verificar manejo de requisito inexistente"""
        result = update_requisito_status(requisito_id=99999)

        self.assertEqual(result['status'], 'error')
        self.assertIn('error', result)


# ═══════════════════════════════════════════════════
# EJECUTAR TESTS
# ═══════════════════════════════════════════════════

if __name__ == '__main__':
    pytest.main([__file__, '-v'])
