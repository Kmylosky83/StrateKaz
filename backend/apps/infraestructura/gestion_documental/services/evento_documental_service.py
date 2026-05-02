"""
EventoDocumentalService — Registro granular de eventos documentales.

Helper para registrar eventos sobre documentos (vista, descarga, impresión,
acceso denegado, etc.) con snapshot de versión, IP y user-agent.

Cumple ISO 27001 §A.8.10 (logging granular de uso de información sensible).
"""
from __future__ import annotations

import logging
from typing import Any, Optional

logger = logging.getLogger('gestion_documental')


def _get_client_ip(request) -> Optional[str]:
    """Extrae la IP del cliente respetando X-Forwarded-For (proxy / nginx)."""
    if request is None:
        return None
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR') if hasattr(request, 'META') else None
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    if hasattr(request, 'META'):
        return request.META.get('REMOTE_ADDR')
    return None


class EventoDocumentalService:
    """
    Registra eventos sobre documentos para trazabilidad ISO 27001.

    Uso:
        EventoDocumentalService.registrar(
            documento=doc,
            usuario=request.user,
            tipo='DESCARGA_PDF',
            request=request,
            metadatos={'origen': 'export_documento_pdf'},
        )

    No falla la operación principal si el registro de evento falla:
    captura cualquier excepción y la logguea para análisis posterior.
    """

    @staticmethod
    def registrar(
        documento,
        usuario,
        tipo: str,
        request=None,
        metadatos: Optional[dict[str, Any]] = None,
    ):
        """
        Crea un EventoDocumental.

        Args:
            documento: instancia de Documento (FK).
            usuario: instancia de User (puede ser None para eventos del sistema).
            tipo: uno de EventoDocumental.TIPO_EVENTO_CHOICES.
            request: HttpRequest opcional (para extraer IP y user-agent).
            metadatos: diccionario serializable JSON con contexto adicional.

        Returns:
            EventoDocumental instance, o None si falló el registro.
        """
        # Import local para evitar ciclos en el momento de carga de la app.
        from ..models import EventoDocumental

        try:
            ip = _get_client_ip(request)
            user_agent = ''
            if request is not None and hasattr(request, 'META'):
                user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]

            usuario_efectivo = usuario if (usuario and getattr(usuario, 'is_authenticated', False)) else None

            return EventoDocumental.objects.create(
                documento=documento,
                usuario=usuario_efectivo,
                tipo_evento=tipo,
                version_documento=getattr(documento, 'version_actual', '') or '',
                ip_address=ip,
                user_agent=user_agent or '',
                metadatos=metadatos or {},
            )
        except Exception as exc:  # pragma: no cover — best-effort logging
            logger.warning(
                'EventoDocumentalService.registrar fallo: doc=%s tipo=%s err=%s',
                getattr(documento, 'id', None), tipo, exc,
            )
            return None
