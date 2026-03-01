"""
MI-001: Connection Testers para Integraciones Externas
Sistema de Gestión StrateKaz

Servicios para probar conexiones reales con servicios externos:
- Email (SMTP, Gmail API)
- OpenAI
- SAP
- Almacenamiento (S3, Azure Blob)
- Facturación Electrónica (DIAN)

Cada tester implementa la misma interfaz para facilitar su uso.
"""
import logging
import socket
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, Dict, Any, Tuple

logger = logging.getLogger(__name__)


@dataclass
class ConnectionTestResult:
    """Resultado de una prueba de conexión."""
    success: bool
    message: str
    details: Optional[Dict[str, Any]] = None
    response_time_ms: Optional[float] = None
    error_code: Optional[str] = None


class ConnectionTester(ABC):
    """
    Clase base abstracta para testers de conexión.

    Cada tipo de integración debe implementar su propia subclase.
    """

    @abstractmethod
    def test(self, integracion) -> ConnectionTestResult:
        """
        Ejecuta la prueba de conexión.

        Args:
            integracion: Instancia de IntegracionExterna con credenciales

        Returns:
            ConnectionTestResult con el resultado de la prueba
        """
        pass

    @abstractmethod
    def get_required_credentials(self) -> list:
        """
        Retorna la lista de credenciales requeridas para este tipo de integración.

        Returns:
            Lista de strings con las claves de credenciales necesarias
        """
        pass

    def validate_credentials(self, integracion) -> Tuple[bool, Optional[str]]:
        """
        Valida que las credenciales requeridas estén presentes.

        Args:
            integracion: Instancia de IntegracionExterna

        Returns:
            Tupla (is_valid, error_message)
        """
        required = self.get_required_credentials()
        credentials = integracion.credenciales or {}

        missing = [key for key in required if not credentials.get(key)]

        if missing:
            return False, f"Credenciales faltantes: {', '.join(missing)}"

        return True, None

    def get_base_url(self, integracion, default: str = '') -> str:
        """
        Obtiene la URL base del servicio.

        Prioridad:
        1. integracion.endpoint_url (campo del modelo)
        2. credenciales['base_url'] (fallback legacy)
        3. default (valor por defecto)

        Args:
            integracion: Instancia de IntegracionExterna
            default: URL por defecto si no se encuentra

        Returns:
            URL base como string
        """
        # Prioridad 1: campo del modelo
        if integracion.endpoint_url:
            return integracion.endpoint_url

        # Prioridad 2: dentro de credenciales (legacy)
        creds = integracion.credenciales or {}
        if creds.get('base_url'):
            return creds['base_url']

        return default


class EmailConnectionTester(ConnectionTester):
    """
    Tester para conexiones de email SMTP.

    Soporta:
    - SMTP genérico
    - Gmail SMTP
    - SendGrid
    - Amazon SES
    """

    def get_required_credentials(self) -> list:
        return ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password']

    def test(self, integracion) -> ConnectionTestResult:
        """
        Prueba la conexión SMTP.

        Proceso:
        1. Conectar al servidor SMTP
        2. Iniciar TLS si está configurado
        3. Autenticar con credenciales
        4. Cerrar conexión
        """
        import time
        import smtplib

        start_time = time.time()

        try:
            # Validar credenciales
            is_valid, error = self.validate_credentials(integracion)
            if not is_valid:
                return ConnectionTestResult(
                    success=False,
                    message=error,
                    error_code='MISSING_CREDENTIALS'
                )

            creds = integracion.credenciales
            host = creds.get('smtp_host')
            port = int(creds.get('smtp_port', 587))
            user = creds.get('smtp_user')
            password = creds.get('smtp_password')
            use_tls = creds.get('use_tls', True)

            # Timeout de 10 segundos
            socket.setdefaulttimeout(10)

            # Conectar al servidor SMTP
            if port == 465:
                # SMTP_SSL para puerto 465
                server = smtplib.SMTP_SSL(host, port)
            else:
                server = smtplib.SMTP(host, port)
                if use_tls:
                    server.starttls()

            # Autenticar
            server.login(user, password)

            # Obtener información del servidor
            server_info = server.ehlo_resp.decode() if server.ehlo_resp else 'N/A'

            # Cerrar conexión
            server.quit()

            elapsed_ms = (time.time() - start_time) * 1000

            logger.info(f"Conexión SMTP exitosa a {host}:{port} para {integracion.nombre}")

            return ConnectionTestResult(
                success=True,
                message=f"Conexión exitosa a {host}:{port}",
                details={
                    'server': host,
                    'port': port,
                    'tls': use_tls,
                    'server_info': server_info[:100] if server_info else None
                },
                response_time_ms=round(elapsed_ms, 2)
            )

        except smtplib.SMTPAuthenticationError as e:
            elapsed_ms = (time.time() - start_time) * 1000
            logger.warning(f"Error de autenticación SMTP para {integracion.nombre}: {e}")
            return ConnectionTestResult(
                success=False,
                message="Error de autenticación: usuario o contraseña incorrectos",
                error_code='AUTH_ERROR',
                response_time_ms=round(elapsed_ms, 2)
            )

        except smtplib.SMTPConnectError as e:
            elapsed_ms = (time.time() - start_time) * 1000
            logger.error(f"Error de conexión SMTP para {integracion.nombre}: {e}")
            return ConnectionTestResult(
                success=False,
                message=f"No se pudo conectar al servidor: {e}",
                error_code='CONNECTION_ERROR',
                response_time_ms=round(elapsed_ms, 2)
            )

        except socket.timeout:
            elapsed_ms = (time.time() - start_time) * 1000
            logger.error(f"Timeout SMTP para {integracion.nombre}")
            return ConnectionTestResult(
                success=False,
                message="Timeout: el servidor no responde",
                error_code='TIMEOUT',
                response_time_ms=round(elapsed_ms, 2)
            )

        except Exception as e:
            elapsed_ms = (time.time() - start_time) * 1000
            logger.error(f"Error inesperado SMTP para {integracion.nombre}: {e}")
            return ConnectionTestResult(
                success=False,
                message=f"Error: {str(e)}",
                error_code='UNKNOWN_ERROR',
                response_time_ms=round(elapsed_ms, 2)
            )


class OpenAIConnectionTester(ConnectionTester):
    """
    Tester para conexiones a OpenAI API.
    """

    def get_required_credentials(self) -> list:
        return ['api_key']

    def test(self, integracion) -> ConnectionTestResult:
        """
        Prueba la conexión a OpenAI API.

        Proceso:
        1. Hacer una llamada simple a /models
        2. Verificar que la API key es válida
        """
        import time
        import requests

        start_time = time.time()

        try:
            is_valid, error = self.validate_credentials(integracion)
            if not is_valid:
                return ConnectionTestResult(
                    success=False,
                    message=error,
                    error_code='MISSING_CREDENTIALS'
                )

            creds = integracion.credenciales
            api_key = creds.get('api_key')
            base_url = self.get_base_url(integracion, default='https://api.openai.com/v1')

            # Hacer request a /models (endpoint ligero)
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }

            response = requests.get(
                f'{base_url}/models',
                headers=headers,
                timeout=10
            )

            elapsed_ms = (time.time() - start_time) * 1000

            if response.status_code == 200:
                data = response.json()
                models_count = len(data.get('data', []))

                logger.info(f"Conexión OpenAI exitosa para {integracion.nombre}")

                return ConnectionTestResult(
                    success=True,
                    message=f"Conexión exitosa. {models_count} modelos disponibles.",
                    details={
                        'models_count': models_count,
                        'api_version': 'v1'
                    },
                    response_time_ms=round(elapsed_ms, 2)
                )
            elif response.status_code == 401:
                return ConnectionTestResult(
                    success=False,
                    message="API Key inválida o expirada",
                    error_code='AUTH_ERROR',
                    response_time_ms=round(elapsed_ms, 2)
                )
            elif response.status_code == 429:
                return ConnectionTestResult(
                    success=False,
                    message="Rate limit excedido. Intente más tarde.",
                    error_code='RATE_LIMIT',
                    response_time_ms=round(elapsed_ms, 2)
                )
            else:
                return ConnectionTestResult(
                    success=False,
                    message=f"Error HTTP {response.status_code}: {response.text[:100]}",
                    error_code=f'HTTP_{response.status_code}',
                    response_time_ms=round(elapsed_ms, 2)
                )

        except requests.Timeout:
            elapsed_ms = (time.time() - start_time) * 1000
            return ConnectionTestResult(
                success=False,
                message="Timeout: el servidor no responde",
                error_code='TIMEOUT',
                response_time_ms=round(elapsed_ms, 2)
            )

        except requests.ConnectionError as e:
            elapsed_ms = (time.time() - start_time) * 1000
            return ConnectionTestResult(
                success=False,
                message=f"Error de conexión: {str(e)}",
                error_code='CONNECTION_ERROR',
                response_time_ms=round(elapsed_ms, 2)
            )

        except Exception as e:
            elapsed_ms = (time.time() - start_time) * 1000
            logger.error(f"Error inesperado OpenAI para {integracion.nombre}: {e}")
            return ConnectionTestResult(
                success=False,
                message=f"Error: {str(e)}",
                error_code='UNKNOWN_ERROR',
                response_time_ms=round(elapsed_ms, 2)
            )


class SAPConnectionTester(ConnectionTester):
    """
    Tester para conexiones a SAP (RFC o REST).
    """

    def get_required_credentials(self) -> list:
        return ['host', 'client', 'user', 'password']

    def test(self, integracion) -> ConnectionTestResult:
        """
        Prueba la conexión a SAP.

        Nota: Para conexiones RFC reales se requiere pyrfc.
        Esta implementación usa REST API o verifica conectividad básica.
        """
        import time
        import requests

        start_time = time.time()

        try:
            is_valid, error = self.validate_credentials(integracion)
            if not is_valid:
                return ConnectionTestResult(
                    success=False,
                    message=error,
                    error_code='MISSING_CREDENTIALS'
                )

            creds = integracion.credenciales
            host = creds.get('host')
            port = creds.get('port', 443)
            user = creds.get('user')
            password = creds.get('password')

            # Intentar conexión HTTP básica al servidor SAP
            # En producción, esto debería usar RFC o OData
            url = f"https://{host}:{port}/sap/bc/ping"

            try:
                response = requests.get(
                    url,
                    auth=(user, password),
                    timeout=15,
                    verify=True
                )

                elapsed_ms = (time.time() - start_time) * 1000

                if response.status_code in [200, 204]:
                    return ConnectionTestResult(
                        success=True,
                        message="Conexión SAP exitosa",
                        details={
                            'host': host,
                            'port': port,
                            'status_code': response.status_code
                        },
                        response_time_ms=round(elapsed_ms, 2)
                    )
                elif response.status_code == 401:
                    return ConnectionTestResult(
                        success=False,
                        message="Credenciales SAP inválidas",
                        error_code='AUTH_ERROR',
                        response_time_ms=round(elapsed_ms, 2)
                    )
                else:
                    return ConnectionTestResult(
                        success=False,
                        message=f"Error HTTP {response.status_code}",
                        error_code=f'HTTP_{response.status_code}',
                        response_time_ms=round(elapsed_ms, 2)
                    )

            except requests.exceptions.SSLError:
                # Intentar sin verificación SSL (no recomendado en producción)
                elapsed_ms = (time.time() - start_time) * 1000
                return ConnectionTestResult(
                    success=False,
                    message="Error de certificado SSL. Verifique la configuración.",
                    error_code='SSL_ERROR',
                    response_time_ms=round(elapsed_ms, 2)
                )

        except Exception as e:
            elapsed_ms = (time.time() - start_time) * 1000
            logger.error(f"Error inesperado SAP para {integracion.nombre}: {e}")
            return ConnectionTestResult(
                success=False,
                message=f"Error: {str(e)}",
                error_code='UNKNOWN_ERROR',
                response_time_ms=round(elapsed_ms, 2)
            )


class StorageConnectionTester(ConnectionTester):
    """
    Tester para conexiones a almacenamiento en la nube.

    Soporta:
    - AWS S3
    - Azure Blob Storage
    - Google Cloud Storage
    """

    def get_required_credentials(self) -> list:
        # Credenciales varían según el proveedor
        return ['provider']  # Mínimo requerido

    def test(self, integracion) -> ConnectionTestResult:
        """
        Prueba la conexión a almacenamiento cloud.
        """
        import time

        start_time = time.time()

        try:
            creds = integracion.credenciales or {}
            provider = creds.get('provider', 's3').lower()

            if provider == 's3':
                return self._test_s3(integracion, start_time)
            elif provider == 'azure':
                return self._test_azure(integracion, start_time)
            elif provider == 'gcs':
                return self._test_gcs(integracion, start_time)
            else:
                return ConnectionTestResult(
                    success=False,
                    message=f"Proveedor no soportado: {provider}",
                    error_code='UNSUPPORTED_PROVIDER'
                )

        except Exception as e:
            elapsed_ms = (time.time() - start_time) * 1000
            return ConnectionTestResult(
                success=False,
                message=f"Error: {str(e)}",
                error_code='UNKNOWN_ERROR',
                response_time_ms=round(elapsed_ms, 2)
            )

    def _test_s3(self, integracion, start_time) -> ConnectionTestResult:
        """Prueba conexión a AWS S3."""
        import time

        try:
            import boto3
            from botocore.exceptions import ClientError, NoCredentialsError
        except ImportError:
            return ConnectionTestResult(
                success=False,
                message="boto3 no instalado. Ejecute: pip install boto3",
                error_code='MISSING_DEPENDENCY'
            )

        creds = integracion.credenciales
        required = ['aws_access_key_id', 'aws_secret_access_key', 'bucket_name']
        missing = [k for k in required if not creds.get(k)]

        if missing:
            return ConnectionTestResult(
                success=False,
                message=f"Credenciales faltantes: {', '.join(missing)}",
                error_code='MISSING_CREDENTIALS'
            )

        try:
            s3 = boto3.client(
                's3',
                aws_access_key_id=creds['aws_access_key_id'],
                aws_secret_access_key=creds['aws_secret_access_key'],
                region_name=creds.get('region', 'us-east-1')
            )

            # Verificar acceso al bucket
            bucket_name = creds['bucket_name']
            s3.head_bucket(Bucket=bucket_name)

            elapsed_ms = (time.time() - start_time) * 1000

            return ConnectionTestResult(
                success=True,
                message=f"Conexión S3 exitosa. Bucket: {bucket_name}",
                details={
                    'bucket': bucket_name,
                    'region': creds.get('region', 'us-east-1')
                },
                response_time_ms=round(elapsed_ms, 2)
            )

        except NoCredentialsError:
            elapsed_ms = (time.time() - start_time) * 1000
            return ConnectionTestResult(
                success=False,
                message="Credenciales AWS inválidas",
                error_code='AUTH_ERROR',
                response_time_ms=round(elapsed_ms, 2)
            )

        except ClientError as e:
            elapsed_ms = (time.time() - start_time) * 1000
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            return ConnectionTestResult(
                success=False,
                message=f"Error S3: {error_code}",
                error_code=f'S3_{error_code}',
                response_time_ms=round(elapsed_ms, 2)
            )

    def _test_azure(self, integracion, start_time) -> ConnectionTestResult:
        """Prueba conexión a Azure Blob Storage."""
        import time

        try:
            from azure.storage.blob import BlobServiceClient
            from azure.core.exceptions import AzureError
        except ImportError:
            return ConnectionTestResult(
                success=False,
                message="azure-storage-blob no instalado.",
                error_code='MISSING_DEPENDENCY'
            )

        creds = integracion.credenciales
        connection_string = creds.get('connection_string')

        if not connection_string:
            return ConnectionTestResult(
                success=False,
                message="Falta connection_string de Azure",
                error_code='MISSING_CREDENTIALS'
            )

        try:
            blob_service = BlobServiceClient.from_connection_string(connection_string)
            # Listar containers para verificar conexión
            containers = list(blob_service.list_containers(max_results=1))

            elapsed_ms = (time.time() - start_time) * 1000

            return ConnectionTestResult(
                success=True,
                message="Conexión Azure Blob exitosa",
                details={
                    'account_name': blob_service.account_name
                },
                response_time_ms=round(elapsed_ms, 2)
            )

        except AzureError as e:
            elapsed_ms = (time.time() - start_time) * 1000
            return ConnectionTestResult(
                success=False,
                message=f"Error Azure: {str(e)}",
                error_code='AZURE_ERROR',
                response_time_ms=round(elapsed_ms, 2)
            )

    def _test_gcs(self, integracion, start_time) -> ConnectionTestResult:
        """Prueba conexión a Google Cloud Storage."""
        import time

        try:
            from google.cloud import storage
            from google.auth.exceptions import DefaultCredentialsError
        except ImportError:
            return ConnectionTestResult(
                success=False,
                message="google-cloud-storage no instalado.",
                error_code='MISSING_DEPENDENCY'
            )

        creds = integracion.credenciales
        bucket_name = creds.get('bucket_name')

        if not bucket_name:
            return ConnectionTestResult(
                success=False,
                message="Falta bucket_name de GCS",
                error_code='MISSING_CREDENTIALS'
            )

        try:
            client = storage.Client()
            bucket = client.get_bucket(bucket_name)

            elapsed_ms = (time.time() - start_time) * 1000

            return ConnectionTestResult(
                success=True,
                message=f"Conexión GCS exitosa. Bucket: {bucket_name}",
                details={
                    'bucket': bucket_name,
                    'location': bucket.location
                },
                response_time_ms=round(elapsed_ms, 2)
            )

        except DefaultCredentialsError:
            elapsed_ms = (time.time() - start_time) * 1000
            return ConnectionTestResult(
                success=False,
                message="Credenciales GCS no configuradas",
                error_code='AUTH_ERROR',
                response_time_ms=round(elapsed_ms, 2)
            )


class GenericHTTPTester(ConnectionTester):
    """
    Tester genérico para APIs HTTP/REST.

    Útil para integraciones que no tienen un tester específico.
    Usa endpoint_url del modelo o base_url de credenciales.
    """

    def get_required_credentials(self) -> list:
        # No requerimos base_url en credenciales; se obtiene de endpoint_url
        return []

    def test(self, integracion) -> ConnectionTestResult:
        """
        Prueba la conexión haciendo un GET a la URL base.
        Busca la URL en: endpoint_url (modelo) → base_url (credenciales).
        """
        import time
        import requests

        start_time = time.time()

        try:
            creds = integracion.credenciales or {}
            base_url = self.get_base_url(integracion)

            if not base_url:
                return ConnectionTestResult(
                    success=False,
                    message="Falta la URL del endpoint. Configure el campo 'URL Base' de la integración.",
                    error_code='MISSING_URL'
                )

            headers = {}

            # Añadir autenticación si está configurada
            if creds.get('api_key'):
                headers['Authorization'] = f"Bearer {creds['api_key']}"
            elif creds.get('token'):
                headers['Authorization'] = f"Bearer {creds['token']}"

            response = requests.get(
                base_url,
                headers=headers,
                timeout=10
            )

            elapsed_ms = (time.time() - start_time) * 1000

            if response.status_code < 400:
                return ConnectionTestResult(
                    success=True,
                    message=f"Conexión exitosa (HTTP {response.status_code})",
                    details={
                        'url': base_url,
                        'status_code': response.status_code
                    },
                    response_time_ms=round(elapsed_ms, 2)
                )
            else:
                return ConnectionTestResult(
                    success=False,
                    message=f"Error HTTP {response.status_code}",
                    error_code=f'HTTP_{response.status_code}',
                    response_time_ms=round(elapsed_ms, 2)
                )

        except Exception as e:
            elapsed_ms = (time.time() - start_time) * 1000
            return ConnectionTestResult(
                success=False,
                message=f"Error: {str(e)}",
                error_code='UNKNOWN_ERROR',
                response_time_ms=round(elapsed_ms, 2)
            )


# ==============================================================================
# FACTORY FUNCTION
# ==============================================================================

# Mapeo de códigos de tipo de servicio a testers
# Los tipos no listados aquí usan GenericHTTPTester (fallback)
TESTER_MAP = {
    # Email
    'EMAIL': EmailConnectionTester,
    'SMTP': EmailConnectionTester,
    # IA
    'OPENAI': OpenAIConnectionTester,
    'IA': OpenAIConnectionTester,
    # ERP
    'SAP': SAPConnectionTester,
    'ERP': SAPConnectionTester,
    # Almacenamiento
    'ALMACENAMIENTO': StorageConnectionTester,
    'STORAGE': StorageConnectionTester,
    'S3': StorageConnectionTester,
    'AZURE_BLOB': StorageConnectionTester,
    'GCS': StorageConnectionTester,
    'BACKUP': StorageConnectionTester,
    'CDN': StorageConnectionTester,
}


def get_connection_tester(tipo_servicio_code: str) -> ConnectionTester:
    """
    Factory function para obtener el tester apropiado según el tipo de servicio.

    Args:
        tipo_servicio_code: Código del tipo de servicio (ej: 'EMAIL', 'OPENAI')

    Returns:
        Instancia del ConnectionTester apropiado

    Example:
        >>> tester = get_connection_tester('EMAIL')
        >>> result = tester.test(integracion)
        >>> if result.success:
        ...     print(f"Conexión OK en {result.response_time_ms}ms")
    """
    tester_class = TESTER_MAP.get(tipo_servicio_code)

    if tester_class:
        return tester_class()

    # Fallback a tester genérico HTTP
    logger.warning(
        f"No hay tester específico para tipo '{tipo_servicio_code}'. "
        "Usando tester HTTP genérico."
    )
    return GenericHTTPTester()
