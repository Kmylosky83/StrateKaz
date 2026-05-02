"""
Servicio de exportación a Google Drive (Fase 7).
Usa IntegracionExterna del módulo de configuración para credenciales.
Implementa filtros Habeas Data para documentos confidenciales/restringidos.
"""

import logging
import io
from django.utils import timezone

logger = logging.getLogger('gestion_documental')


class GoogleDriveService:
    """Servicio de exportación de documentos a Google Drive."""

    HABEAS_DATA_CLASIFICACIONES = ['CONFIDENCIAL', 'RESTRINGIDO']

    @classmethod
    def _get_drive_client(cls, integracion_id: int):
        """
        Obtiene cliente de Google Drive API desde credenciales de IntegracionExterna.
        Las credenciales están encriptadas con Fernet en el modelo.
        """
        from django.apps import apps
        IntegracionExterna = apps.get_model('configuracion', 'IntegracionExterna')

        integracion = IntegracionExterna.objects.get(
            id=integracion_id,
            is_active=True,
        )
        credenciales = integracion.credenciales  # Auto-desencriptado por property

        if not credenciales:
            raise ValueError('No hay credenciales configuradas para esta integración')

        try:
            from google.oauth2.credentials import Credentials
            from googleapiclient.discovery import build

            creds = Credentials(
                token=credenciales.get('access_token'),
                refresh_token=credenciales.get('refresh_token'),
                token_uri='https://oauth2.googleapis.com/token',
                client_id=credenciales.get('client_id'),
                client_secret=credenciales.get('client_secret'),
            )

            service = build('drive', 'v3', credentials=creds)
            return service, integracion

        except ImportError:
            raise ImportError(
                'google-api-python-client no está instalado. '
                'Ejecute: pip install google-api-python-client google-auth-oauthlib'
            )

    @classmethod
    def verificar_conexion(cls, integracion_id: int) -> dict:
        """Verifica la conexión a Google Drive."""
        try:
            service, integracion = cls._get_drive_client(integracion_id)
            about = service.about().get(fields='user').execute()
            user_email = about.get('user', {}).get('emailAddress', 'desconocido')

            integracion.ultima_conexion_exitosa = timezone.now()
            integracion.save(update_fields=['ultima_conexion_exitosa'])

            return {
                'success': True,
                'message': f'Conectado como {user_email}',
                'email': user_email,
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Error de conexión: {str(e)}',
                'error': str(e),
            }

    @classmethod
    def exportar_documento(
        cls, documento_id: int, integracion_id: int,
        folder_id: str = None, usuario=None
    ) -> dict:
        """
        Exporta un documento individual a Google Drive.
        Aplica filtros Habeas Data.

        Returns: {'drive_file_id': str, 'web_view_link': str}
        """
        from .models import Documento

        documento = Documento.objects.select_related(
            'tipo_documento', 'elaborado_por'
        ).get(id=documento_id)

        # Habeas Data: verificar acceso a documentos sensibles
        if documento.clasificacion in cls.HABEAS_DATA_CLASIFICACIONES:
            if usuario and not cls._tiene_permiso_habeas_data(documento, usuario):
                raise PermissionError(
                    f'Documento {documento.codigo} es {documento.clasificacion}. '
                    f'No tiene permiso para exportar documentos con esta clasificación.'
                )

        service, integracion = cls._get_drive_client(integracion_id)

        # Preparar archivo PDF
        archivo = documento.archivo_pdf or documento.archivo_original
        if not archivo:
            # Generar PDF on-the-fly
            from .exporters.pdf_generator import DocumentoPDFGenerator
            pdf_bytes = DocumentoPDFGenerator.generate(documento)
            file_content = io.BytesIO(pdf_bytes)
            filename = f'{documento.codigo}-v{documento.version_actual}.pdf'
        else:
            file_content = archivo.open('rb')
            filename = f'{documento.codigo}-v{documento.version_actual}.pdf'

        try:
            from googleapiclient.http import MediaIoBaseUpload

            file_metadata = {
                'name': filename,
                'description': (
                    f'{documento.titulo} | {documento.codigo} | '
                    f'v{documento.version_actual} | {documento.estado}'
                ),
            }
            if folder_id:
                file_metadata['parents'] = [folder_id]

            media = MediaIoBaseUpload(
                file_content,
                mimetype='application/pdf',
                resumable=True,
            )

            drive_file = service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id,webViewLink',
            ).execute()

            drive_file_id = drive_file.get('id', '')
            web_view_link = drive_file.get('webViewLink', '')

            # Actualizar documento
            documento.drive_file_id = drive_file_id
            documento.drive_exportado_at = timezone.now()
            documento.save(update_fields=['drive_file_id', 'drive_exportado_at'])

            # Registrar en IntegracionExterna
            integracion.contador_llamadas = (integracion.contador_llamadas or 0) + 1
            integracion.ultima_conexion_exitosa = timezone.now()
            integracion.save(update_fields=[
                'contador_llamadas', 'ultima_conexion_exitosa'
            ])

            logger.info(
                f'[Drive] Documento {documento.codigo} exportado → {drive_file_id}'
            )

            return {
                'drive_file_id': drive_file_id,
                'web_view_link': web_view_link,
                'filename': filename,
            }

        finally:
            if hasattr(file_content, 'close'):
                file_content.close()

    @classmethod
    def exportar_lote(
        cls, empresa_id: int, integracion_id: int,
        folder_id: str = None, usuario=None,
        filtros: dict = None
    ) -> dict:
        """
        Exporta múltiples documentos a Google Drive.
        Excluye automáticamente CONFIDENCIAL/RESTRINGIDO (Habeas Data).

        Returns: {'exportados': int, 'omitidos': int, 'errores': list}
        """
        from .models import Documento

        queryset = Documento.objects.filter(empresa_id=empresa_id)

        # Aplicar filtros opcionales
        if filtros:
            if filtros.get('estado'):
                queryset = queryset.filter(estado=filtros['estado'])
            if filtros.get('tipo_documento'):
                queryset = queryset.filter(tipo_documento_id=filtros['tipo_documento'])

        # Habeas Data: excluir documentos sensibles
        queryset = queryset.exclude(
            clasificacion__in=cls.HABEAS_DATA_CLASIFICACIONES
        )

        # Excluir ya exportados (si no se quiere re-exportar)
        if not (filtros or {}).get('re_exportar'):
            queryset = queryset.filter(drive_file_id='')

        exportados = 0
        errores = []

        for doc in queryset[:100]:  # Limitar batch
            try:
                cls.exportar_documento(
                    doc.id, integracion_id, folder_id, usuario
                )
                exportados += 1
            except Exception as e:
                errores.append({
                    'documento_id': doc.id,
                    'codigo': doc.codigo,
                    'error': str(e),
                })

        return {
            'exportados': exportados,
            'omitidos': queryset.count() - exportados,
            'errores': errores,
        }

    @classmethod
    def _tiene_permiso_habeas_data(cls, documento, usuario) -> bool:
        """Verifica si el usuario tiene permiso para acceder a docs sensibles."""
        # SuperAdmin siempre puede
        if usuario.is_superuser:
            return True
        # El autor siempre puede
        if documento.elaborado_por_id == usuario.id:
            return True
        # Usuarios autorizados explícitamente
        if documento.usuarios_autorizados.filter(id=usuario.id).exists():
            return True
        return False
