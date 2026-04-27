"""
Tests para el bootstrap automático del Gestor Documental (H-GD-A3, H-GD-m3).

Cubre:
1. CertificateService.ensure_certificate_for_schema es idempotente.
2. CertificateService genera archivos cert/clave en MEDIA_ROOT/certificados/{schema}/.
3. PDFSealingService.sellar_documento devuelve fallback graceful cuando
   no existe certificado, sin levantar ValueError. El documento queda
   PUBLICADO con sellado_estado='ERROR' y sellado_metadatos['fallback']=True.
4. seed_trd corre limpio en el tenant de test (idempotente).

Patrón: BaseTenantTestCase para los que tocan modelos. Para CertificateService
solo (sin modelos), basta con TestCase de Django.
"""
import os
import shutil
import tempfile

from django.conf import settings
from django.test import TestCase, override_settings

from apps.core.tests.base import BaseTenantTestCase


@override_settings(MEDIA_ROOT=tempfile.mkdtemp(prefix='stratekaz_test_media_'))
class CertificateServiceTests(TestCase):
    """
    Tests del servicio de generación de certificados X.509.

    No requiere multi-tenant porque sólo opera sobre el filesystem.
    Usa MEDIA_ROOT temporal aislado por test class.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls._tmp_media = settings.MEDIA_ROOT
        os.makedirs(cls._tmp_media, exist_ok=True)

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        try:
            shutil.rmtree(cls._tmp_media, ignore_errors=True)
        except Exception:
            pass

    def setUp(self):
        # Limpieza por test: cada test usa su propio schema name
        self.schema_name = f'tenant_test_{self._testMethodName[-30:]}'
        cert_dir = os.path.join(
            settings.MEDIA_ROOT, 'certificados', self.schema_name,
        )
        if os.path.exists(cert_dir):
            shutil.rmtree(cert_dir, ignore_errors=True)

    def test_ensure_certificate_creates_files_first_call(self):
        """Primera llamada genera ambos archivos cert + clave."""
        from apps.gestion_estrategica.gestion_documental.services import (
            CertificateService,
        )

        result = CertificateService.ensure_certificate_for_schema(
            schema_name=self.schema_name,
            empresa_nombre='Empresa Test',
            razon_social='Empresa Test SAS',
        )

        self.assertTrue(result.created)
        self.assertTrue(os.path.exists(result.cert_path))
        self.assertTrue(os.path.exists(result.key_path))
        self.assertEqual(result.schema_name, self.schema_name)
        self.assertIsNotNone(result.valid_until)

        # Archivos no vacíos
        self.assertGreater(os.path.getsize(result.cert_path), 0)
        self.assertGreater(os.path.getsize(result.key_path), 0)

    def test_ensure_certificate_is_idempotent(self):
        """Segunda llamada retorna sin regenerar (created=False)."""
        from apps.gestion_estrategica.gestion_documental.services import (
            CertificateService,
        )

        first = CertificateService.ensure_certificate_for_schema(
            schema_name=self.schema_name,
        )
        self.assertTrue(first.created)

        # Capturar mtime para confirmar que no se reescribió
        mtime_cert = os.path.getmtime(first.cert_path)
        mtime_key = os.path.getmtime(first.key_path)

        second = CertificateService.ensure_certificate_for_schema(
            schema_name=self.schema_name,
        )
        self.assertFalse(second.created)
        self.assertEqual(first.cert_path, second.cert_path)
        self.assertEqual(first.key_path, second.key_path)

        # mtime no cambió → archivos no fueron reescritos
        self.assertEqual(mtime_cert, os.path.getmtime(second.cert_path))
        self.assertEqual(mtime_key, os.path.getmtime(second.key_path))

    def test_ensure_certificate_force_regenerates(self):
        """Con force=True regenera aunque ya exista."""
        from apps.gestion_estrategica.gestion_documental.services import (
            CertificateService,
        )

        first = CertificateService.ensure_certificate_for_schema(
            schema_name=self.schema_name,
        )
        self.assertTrue(first.created)

        # Esperar tick mínimo para que mtime cambie en filesystems con
        # resolución de 1s. Leer original y reescribir directamente.
        original_cert = open(first.cert_path, 'rb').read()

        second = CertificateService.ensure_certificate_for_schema(
            schema_name=self.schema_name,
            force=True,
        )
        self.assertTrue(second.created)

        # El cert tiene un serial random — debe diferir tras force
        new_cert = open(second.cert_path, 'rb').read()
        self.assertNotEqual(original_cert, new_cert)

    def test_certificate_exists_helper(self):
        """certificate_exists refleja el estado real del filesystem."""
        from apps.gestion_estrategica.gestion_documental.services import (
            CertificateService,
        )

        self.assertFalse(
            CertificateService.certificate_exists(self.schema_name)
        )
        CertificateService.ensure_certificate_for_schema(
            schema_name=self.schema_name,
        )
        self.assertTrue(
            CertificateService.certificate_exists(self.schema_name)
        )

    def test_get_paths_returns_consistent_structure(self):
        """get_paths devuelve rutas determinísticas bajo MEDIA_ROOT."""
        from apps.gestion_estrategica.gestion_documental.services import (
            CertificateService,
        )

        cert_path, key_path = CertificateService.get_paths(self.schema_name)

        expected_dir = os.path.join(
            settings.MEDIA_ROOT, 'certificados', self.schema_name,
        )
        self.assertEqual(os.path.dirname(cert_path), expected_dir)
        self.assertEqual(os.path.dirname(key_path), expected_dir)
        self.assertTrue(cert_path.endswith('certificado.pem'))
        self.assertTrue(key_path.endswith('clave_privada.key'))


class PDFSealingFallbackTests(BaseTenantTestCase):
    """
    Test de fallback graceful cuando no existe certificado X.509.

    Usa BaseTenantTestCase porque crea Documento en el schema del tenant.
    Verifica H-GD-A3: NO crashear el flujo de publicación.
    """

    def setUp(self):
        super().setUp()
        # Aislar MEDIA_ROOT para que no haya cert pre-existente del schema 'test'
        self._tmp_media = tempfile.mkdtemp(prefix='stratekaz_test_seal_')
        self._media_override = override_settings(MEDIA_ROOT=self._tmp_media)
        self._media_override.enable()

    def tearDown(self):
        self._media_override.disable()
        shutil.rmtree(self._tmp_media, ignore_errors=True)
        super().tearDown()

    def _create_documento(self, user):
        """Crea un Documento minimal sin archivo PDF (genera desde HTML)."""
        from apps.gestion_estrategica.gestion_documental.models import (
            Documento,
            TipoDocumento,
        )

        tipo = TipoDocumento.objects.create(
            codigo='PR',
            nombre='Procedimiento',
            prefijo_codigo='PR-',
            nivel_documento='OPERATIVO',
            requiere_aprobacion=True,
            requiere_firma=True,
            tiempo_retencion_años=5,
            created_by=user,
        )
        return Documento.objects.create(
            codigo='PR-FALLBACK-001',
            titulo='Procedimiento Fallback Test',
            tipo_documento=tipo,
            contenido='<h1>Test</h1>',
            version_actual='1.0',
            estado='PUBLICADO',
            clasificacion='INTERNO',
            elaborado_por=user,
        )

    def test_sellar_documento_sin_cert_retorna_fallback_graceful(self):
        """
        H-GD-A3: cuando no existe certificado X.509, sellar_documento
        NO debe levantar ValueError. Devuelve fallback con flag y marca
        sellado_estado='ERROR'. El documento mantiene su estado PUBLICADO.
        """
        from apps.gestion_estrategica.gestion_documental.services import (
            PDFSealingService,
        )

        user = self.create_user('autor_fallback')
        documento = self._create_documento(user)

        # Pre-condición: estado inicial del sellado
        self.assertEqual(documento.sellado_estado, 'NO_APLICA')

        # Garantizamos que NO hay certificado en el MEDIA_ROOT del test
        cert_path = os.path.join(
            self._tmp_media, 'certificados', self.tenant.schema_name,
            'certificado.pem',
        )
        self.assertFalse(os.path.exists(cert_path))

        # Acción: invocar sellar_documento — NO debe crashear
        try:
            resultado = PDFSealingService.sellar_documento(documento)
        except ValueError as e:  # pragma: no cover
            self.fail(
                f'sellar_documento levantó ValueError en lugar de '
                f'fallback graceful: {e}'
            )

        # El servicio retorna el dict de fallback
        self.assertTrue(resultado.get('fallback'))
        self.assertIsNone(resultado.get('hash_sha256'))
        self.assertIn('error', resultado['metadatos'])
        self.assertIn('Certificado X.509', resultado['metadatos']['error'])
        self.assertIn('generar_certificado_x509', resultado['metadatos']['error'])

        # Refrescar desde DB y verificar persistencia
        documento.refresh_from_db()
        self.assertEqual(documento.sellado_estado, 'ERROR')
        self.assertEqual(documento.estado, 'PUBLICADO')  # documento NO afectado
        self.assertTrue(documento.sellado_metadatos.get('fallback'))
        self.assertIn('error', documento.sellado_metadatos)


class SeedTRDIdempotencyTests(BaseTenantTestCase):
    """
    H-GD-m3: seed_trd debe ser idempotente.

    Como BaseTenantTestCase no incluye Areas, EmpresaConfig ni TipoDocumento
    en el schema 'test' por defecto, el seed reportará 'OmitIDAS' pero NO
    debe levantar excepción ni crear registros duplicados al reejecutarse.
    """

    def test_seed_trd_runs_clean_without_dependencies(self):
        """
        seed_trd no falla si faltan tipos/areas — sólo reporta omitidas.
        Precondición H-GD-m3 (auto-bootstrap).
        """
        from django.core.management import call_command

        # Primera ejecución
        try:
            call_command('seed_trd', verbosity=0)
        except Exception as e:  # pragma: no cover
            self.fail(f'seed_trd primera ejecución levantó excepción: {e}')

        # Segunda ejecución — idempotencia: tampoco debe levantar
        try:
            call_command('seed_trd', verbosity=0)
        except Exception as e:  # pragma: no cover
            self.fail(f'seed_trd segunda ejecución levantó excepción: {e}')

    def test_seed_trd_idempotent_when_dependencies_exist(self):
        """
        Cuando hay TipoDocumento + Area + EmpresaConfig, seed_trd crea
        reglas. Una segunda ejecución NO debe duplicarlas.
        """
        from django.core.management import call_command

        from apps.gestion_estrategica.configuracion.models import EmpresaConfig
        from apps.gestion_estrategica.gestion_documental.models import (
            TablaRetencionDocumental,
            TipoDocumento,
        )
        from apps.gestion_estrategica.organizacion.models import Area

        user = self.create_user('autor_trd')

        # Setup mínimo: EmpresaConfig + Area + un TipoDocumento del seed
        EmpresaConfig.objects.get_or_create(
            nit='900111222-3',
            defaults={'razon_social': 'Empresa TRD Test'},
        )
        Area.objects.get_or_create(
            code='DIR',
            defaults={
                'name': 'Direccionamiento Estrategico',
                'tipo': 'ESTRATEGICO',
            },
        )
        TipoDocumento.objects.create(
            codigo='AC',
            nombre='Acta',
            prefijo_codigo='AC-',
            nivel_documento='SOPORTE',
            tiempo_retencion_años=5,
            created_by=user,
        )

        # Primera ejecución
        call_command('seed_trd', verbosity=0)
        count_after_first = TablaRetencionDocumental.objects.count()
        self.assertGreater(
            count_after_first, 0,
            'seed_trd debería crear al menos una regla con AC + DIR'
        )

        # Segunda ejecución — get_or_create asegura idempotencia
        call_command('seed_trd', verbosity=0)
        count_after_second = TablaRetencionDocumental.objects.count()

        self.assertEqual(
            count_after_first,
            count_after_second,
            'seed_trd duplicó reglas en segunda ejecución (no idempotente)',
        )
