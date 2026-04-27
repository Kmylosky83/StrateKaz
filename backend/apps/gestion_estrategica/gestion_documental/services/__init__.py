"""
Servicios de Gestión Documental.

- DocumentoService: Lógica de negocio (códigos, estados, notificaciones)
- PDFSealingService: Sellado X.509 con pyHanko (ISO 27001)
- EventoDocumentalService: Log granular de vistas/descargas/impresiones (ISO 27001 §A.8.10)
"""
from .documento_service import DocumentoService
from .evento_documental_service import EventoDocumentalService
from .pdf_sealing import PDFSealingService

__all__ = ['DocumentoService', 'EventoDocumentalService', 'PDFSealingService']
