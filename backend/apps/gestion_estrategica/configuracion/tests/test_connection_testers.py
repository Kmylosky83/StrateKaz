"""
MI-003: Tests para Connection Testers
Sistema de Gestión StrateKaz

Tests unitarios para los servicios de prueba de conexión:
- EmailConnectionTester
- OpenAIConnectionTester
- SAPConnectionTester
- StorageConnectionTester
- GenericHTTPTester
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from dataclasses import asdict

from apps.gestion_estrategica.configuracion.services.connection_testers import (
    ConnectionTestResult,
    EmailConnectionTester,
    OpenAIConnectionTester,
    SAPConnectionTester,
    StorageConnectionTester,
    GenericHTTPTester,
    get_connection_tester,
)


# ==============================================================================
# FIXTURES
# ==============================================================================

@pytest.fixture
def mock_integracion():
    """Fixture para crear una integración mock."""
    integracion = Mock()
    integracion.nombre = "Test Integration"
    integracion.is_active = True
    integracion.tipo_servicio = Mock()
    integracion.tipo_servicio.code = "EMAIL"
    integracion.credenciales = {}
    return integracion


@pytest.fixture
def email_credentials():
    """Credenciales de email para testing."""
    return {
        'smtp_host': 'smtp.gmail.com',
        'smtp_port': 587,
        'smtp_user': 'test@gmail.com',
        'smtp_password': 'test_password',
        'use_tls': True,
    }


@pytest.fixture
def openai_credentials():
    """Credenciales de OpenAI para testing."""
    return {
        'api_key': 'sk-test-key-123456',
        'base_url': 'https://api.openai.com/v1',
    }


@pytest.fixture
def s3_credentials():
    """Credenciales de S3 para testing."""
    return {
        'provider': 's3',
        'aws_access_key_id': 'AKIAIOSFODNN7EXAMPLE',
        'aws_secret_access_key': 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        'bucket_name': 'test-bucket',
        'region': 'us-east-1',
    }


# ==============================================================================
# TEST: ConnectionTestResult
# ==============================================================================

class TestConnectionTestResult:
    """Tests para la dataclass ConnectionTestResult."""

    def test_success_result(self):
        """Test resultado exitoso."""
        result = ConnectionTestResult(
            success=True,
            message="Conexión exitosa",
            response_time_ms=150.5
        )

        assert result.success is True
        assert result.message == "Conexión exitosa"
        assert result.response_time_ms == 150.5
        assert result.error_code is None

    def test_error_result(self):
        """Test resultado con error."""
        result = ConnectionTestResult(
            success=False,
            message="Error de autenticación",
            error_code="AUTH_ERROR",
            response_time_ms=50.0
        )

        assert result.success is False
        assert result.error_code == "AUTH_ERROR"

    def test_result_with_details(self):
        """Test resultado con detalles adicionales."""
        details = {'server': 'smtp.gmail.com', 'port': 587}
        result = ConnectionTestResult(
            success=True,
            message="OK",
            details=details
        )

        assert result.details == details


# ==============================================================================
# TEST: EmailConnectionTester
# ==============================================================================

class TestEmailConnectionTester:
    """Tests para EmailConnectionTester."""

    def test_get_required_credentials(self):
        """Test credenciales requeridas."""
        tester = EmailConnectionTester()
        required = tester.get_required_credentials()

        assert 'smtp_host' in required
        assert 'smtp_port' in required
        assert 'smtp_user' in required
        assert 'smtp_password' in required

    def test_validate_credentials_missing(self, mock_integracion):
        """Test validación con credenciales faltantes."""
        tester = EmailConnectionTester()
        mock_integracion.credenciales = {'smtp_host': 'smtp.test.com'}

        is_valid, error = tester.validate_credentials(mock_integracion)

        assert is_valid is False
        assert 'smtp_port' in error or 'smtp_user' in error

    def test_validate_credentials_complete(self, mock_integracion, email_credentials):
        """Test validación con credenciales completas."""
        tester = EmailConnectionTester()
        mock_integracion.credenciales = email_credentials

        is_valid, error = tester.validate_credentials(mock_integracion)

        assert is_valid is True
        assert error is None

    @patch('smtplib.SMTP')
    def test_connection_success(self, mock_smtp, mock_integracion, email_credentials):
        """Test conexión SMTP exitosa."""
        mock_integracion.credenciales = email_credentials

        # Configurar mock de SMTP
        mock_server = MagicMock()
        mock_server.ehlo_resp = b'smtp.gmail.com ESMTP'
        mock_smtp.return_value = mock_server

        tester = EmailConnectionTester()
        result = tester.test(mock_integracion)

        assert result.success is True
        assert 'smtp.gmail.com' in result.message
        assert result.response_time_ms is not None

    @patch('smtplib.SMTP')
    def test_connection_auth_error(self, mock_smtp, mock_integracion, email_credentials):
        """Test error de autenticación SMTP."""
        import smtplib

        mock_integracion.credenciales = email_credentials

        # Simular error de autenticación
        mock_server = MagicMock()
        mock_server.starttls.return_value = None
        mock_server.login.side_effect = smtplib.SMTPAuthenticationError(535, 'Auth failed')
        mock_smtp.return_value = mock_server

        tester = EmailConnectionTester()
        result = tester.test(mock_integracion)

        assert result.success is False
        assert result.error_code == 'AUTH_ERROR'

    def test_connection_missing_credentials(self, mock_integracion):
        """Test conexión con credenciales faltantes."""
        mock_integracion.credenciales = {}

        tester = EmailConnectionTester()
        result = tester.test(mock_integracion)

        assert result.success is False
        assert result.error_code == 'MISSING_CREDENTIALS'


# ==============================================================================
# TEST: OpenAIConnectionTester
# ==============================================================================

class TestOpenAIConnectionTester:
    """Tests para OpenAIConnectionTester."""

    def test_get_required_credentials(self):
        """Test credenciales requeridas."""
        tester = OpenAIConnectionTester()
        required = tester.get_required_credentials()

        assert 'api_key' in required

    @patch('requests.get')
    def test_connection_success(self, mock_get, mock_integracion, openai_credentials):
        """Test conexión OpenAI exitosa."""
        mock_integracion.credenciales = openai_credentials

        # Mock respuesta exitosa
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'data': [{'id': 'gpt-4'}, {'id': 'gpt-3.5'}]}
        mock_get.return_value = mock_response

        tester = OpenAIConnectionTester()
        result = tester.test(mock_integracion)

        assert result.success is True
        assert '2 modelos' in result.message
        assert result.details['models_count'] == 2

    @patch('requests.get')
    def test_connection_invalid_key(self, mock_get, mock_integracion, openai_credentials):
        """Test API key inválida."""
        mock_integracion.credenciales = openai_credentials

        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_get.return_value = mock_response

        tester = OpenAIConnectionTester()
        result = tester.test(mock_integracion)

        assert result.success is False
        assert result.error_code == 'AUTH_ERROR'

    @patch('requests.get')
    def test_connection_rate_limit(self, mock_get, mock_integracion, openai_credentials):
        """Test rate limit excedido."""
        mock_integracion.credenciales = openai_credentials

        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_get.return_value = mock_response

        tester = OpenAIConnectionTester()
        result = tester.test(mock_integracion)

        assert result.success is False
        assert result.error_code == 'RATE_LIMIT'


# ==============================================================================
# TEST: StorageConnectionTester
# ==============================================================================

class TestStorageConnectionTester:
    """Tests para StorageConnectionTester."""

    def test_get_required_credentials(self):
        """Test credenciales requeridas."""
        tester = StorageConnectionTester()
        required = tester.get_required_credentials()

        assert 'provider' in required

    def test_unsupported_provider(self, mock_integracion):
        """Test proveedor no soportado."""
        mock_integracion.credenciales = {'provider': 'unknown_provider'}

        tester = StorageConnectionTester()
        result = tester.test(mock_integracion)

        assert result.success is False
        assert result.error_code == 'UNSUPPORTED_PROVIDER'

    @patch('apps.gestion_estrategica.configuracion.services.connection_testers.StorageConnectionTester._test_s3')
    def test_s3_provider_routing(self, mock_test_s3, mock_integracion, s3_credentials):
        """Test que se usa el tester correcto para S3."""
        mock_integracion.credenciales = s3_credentials

        mock_test_s3.return_value = ConnectionTestResult(
            success=True,
            message="S3 OK"
        )

        tester = StorageConnectionTester()
        result = tester.test(mock_integracion)

        mock_test_s3.assert_called_once()
        assert result.success is True


# ==============================================================================
# TEST: GenericHTTPTester
# ==============================================================================

class TestGenericHTTPTester:
    """Tests para GenericHTTPTester."""

    def test_get_required_credentials(self):
        """Test credenciales requeridas."""
        tester = GenericHTTPTester()
        required = tester.get_required_credentials()

        assert 'base_url' in required

    @patch('requests.get')
    def test_connection_success(self, mock_get, mock_integracion):
        """Test conexión HTTP exitosa."""
        mock_integracion.credenciales = {'base_url': 'https://api.example.com'}

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_get.return_value = mock_response

        tester = GenericHTTPTester()
        result = tester.test(mock_integracion)

        assert result.success is True
        assert 'HTTP 200' in result.message

    @patch('requests.get')
    def test_connection_http_error(self, mock_get, mock_integracion):
        """Test error HTTP."""
        mock_integracion.credenciales = {'base_url': 'https://api.example.com'}

        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_get.return_value = mock_response

        tester = GenericHTTPTester()
        result = tester.test(mock_integracion)

        assert result.success is False
        assert result.error_code == 'HTTP_500'


# ==============================================================================
# TEST: Factory Function
# ==============================================================================

class TestGetConnectionTester:
    """Tests para la factory function get_connection_tester."""

    def test_get_email_tester(self):
        """Test obtener tester de email."""
        tester = get_connection_tester('EMAIL')
        assert isinstance(tester, EmailConnectionTester)

    def test_get_email_tester_lowercase(self):
        """Test obtener tester con código en minúsculas."""
        tester = get_connection_tester('email')
        assert isinstance(tester, EmailConnectionTester)

    def test_get_openai_tester(self):
        """Test obtener tester de OpenAI."""
        tester = get_connection_tester('OPENAI')
        assert isinstance(tester, OpenAIConnectionTester)

    def test_get_storage_tester(self):
        """Test obtener tester de almacenamiento."""
        tester = get_connection_tester('STORAGE')
        assert isinstance(tester, StorageConnectionTester)

    def test_get_sap_tester(self):
        """Test obtener tester de SAP."""
        tester = get_connection_tester('SAP')
        assert isinstance(tester, SAPConnectionTester)

    def test_unknown_type_fallback(self):
        """Test fallback a tester genérico."""
        tester = get_connection_tester('UNKNOWN_TYPE')
        assert isinstance(tester, GenericHTTPTester)


# ==============================================================================
# TEST: Integration (End-to-End simulado)
# ==============================================================================

class TestIntegrationE2E:
    """Tests de integración simulados para el flujo completo."""

    @patch('smtplib.SMTP')
    def test_full_email_flow(self, mock_smtp, mock_integracion, email_credentials):
        """Test flujo completo para email."""
        mock_integracion.credenciales = email_credentials
        mock_integracion.tipo_servicio.code = 'EMAIL'

        mock_server = MagicMock()
        mock_server.ehlo_resp = b'OK'
        mock_smtp.return_value = mock_server

        # Obtener tester apropiado
        tester = get_connection_tester(mock_integracion.tipo_servicio.code)

        # Validar credenciales
        is_valid, _ = tester.validate_credentials(mock_integracion)
        assert is_valid is True

        # Ejecutar test
        result = tester.test(mock_integracion)
        assert result.success is True
        assert result.response_time_ms is not None
