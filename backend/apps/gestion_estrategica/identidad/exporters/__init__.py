"""
Exporters del módulo Identidad Corporativa
==========================================

Generadores de documentos para exportación:
- PDF: Documento profesional con WeasyPrint
- DOCX: Documento editable con python-docx

Uso:
    from apps.gestion_estrategica.identidad.exporters import (
        IdentidadPDFGenerator,
        IdentidadDOCXGenerator,
        generar_pdf_identidad_completa,
        generar_docx_identidad_completa,
    )

    # Generar DOCX de identidad completa
    docx_buffer = generar_docx_identidad_completa(
        identity,
        empresa,
        include_valores=True,
        include_alcances=True
    )

Dependencias:
    pip install weasyprint python-docx
"""

from .pdf_generator import (
    IdentidadPDFGenerator,
    generar_pdf_identidad_completa,
)

from .docx_generator import (
    IdentidadDOCXGenerator,
    generar_docx_identidad_completa,
)

__all__ = [
    # Clases generadoras
    'IdentidadPDFGenerator',
    'IdentidadDOCXGenerator',
    # Funciones de conveniencia PDF
    'generar_pdf_identidad_completa',
    # Funciones de conveniencia DOCX
    'generar_docx_identidad_completa',
]
