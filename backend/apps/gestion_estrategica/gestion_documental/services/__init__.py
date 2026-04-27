"""
Servicios de Gestión Documental.

- DocumentoService: Lógica de negocio (códigos, estados, notificaciones)
- PDFSealingService: Sellado X.509 con pyHanko (ISO 27001)
<<<<<<< HEAD
- CertificateService: Generación idempotente de certificados X.509 por tenant
=======
- EventoDocumentalService: Log granular de vistas/descargas/impresiones (ISO 27001 §A.8.10)
>>>>>>> worktree-agent-aa741e32ffbb4ed4c
"""
from .certificate_service import CertificateResult, CertificateService
from .documento_service import DocumentoService
from .evento_documental_service import EventoDocumentalService
from .pdf_sealing import PDFSealingService

<<<<<<< HEAD
__all__ = [
    'CertificateResult',
    'CertificateService',
    'DocumentoService',
    'PDFSealingService',
]
=======
__all__ = ['DocumentoService', 'EventoDocumentalService', 'PDFSealingService']
>>>>>>> worktree-agent-aa741e32ffbb4ed4c
