"""
Servicio de compresión de PDF con Ghostscript.

Se aplica a todo PDF que ingresa al sistema (adopción, ingesta, archivar_registro).
Si el comprimido es mayor que el original, se conserva el original.

Dependencia: ghostscript (apt-get install -y ghostscript)
"""
import logging
import subprocess
import tempfile
import os

logger = logging.getLogger('gestion_documental')

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def comprimir_pdf(pdf_bytes: bytes, dpi: int = 150) -> bytes:
    """
    Comprime un PDF usando Ghostscript.

    Args:
        pdf_bytes: Contenido del PDF original.
        dpi: Resolución de compresión (default 150 DPI = /ebook).

    Returns:
        bytes del PDF comprimido, o el original si el comprimido es mayor.

    Raises:
        subprocess.CalledProcessError: Si Ghostscript falla.
        FileNotFoundError: Si Ghostscript no está instalado.
    """
    if len(pdf_bytes) > MAX_FILE_SIZE:
        raise ValueError(
            f'El archivo excede el tamaño máximo de '
            f'{MAX_FILE_SIZE // (1024 * 1024)} MB'
        )

    with tempfile.TemporaryDirectory() as tmpdir:
        input_path = os.path.join(tmpdir, 'input.pdf')
        output_path = os.path.join(tmpdir, 'output.pdf')

        with open(input_path, 'wb') as f:
            f.write(pdf_bytes)

        try:
            subprocess.run(
                [
                    'gs', '-sDEVICE=pdfwrite',
                    '-dCompatibilityLevel=1.4',
                    '-dPDFSETTINGS=/ebook',
                    '-dNOPAUSE', '-dBATCH', '-dQUIET',
                    f'-sOutputFile={output_path}',
                    input_path,
                ],
                check=True,
                timeout=120,
                capture_output=True,
            )
        except FileNotFoundError:
            logger.warning('Ghostscript no instalado, retornando PDF sin comprimir')
            return pdf_bytes
        except subprocess.CalledProcessError as e:
            logger.error('Error Ghostscript: %s', e.stderr.decode() if e.stderr else str(e))
            return pdf_bytes
        except subprocess.TimeoutExpired:
            logger.error('Ghostscript timeout (120s)')
            return pdf_bytes

        with open(output_path, 'rb') as f:
            compressed = f.read()

        original_size = len(pdf_bytes)
        compressed_size = len(compressed)

        if compressed_size >= original_size:
            logger.info(
                'Compresión no redujo tamaño (%d → %d bytes), conservando original',
                original_size, compressed_size,
            )
            return pdf_bytes

        ratio = (1 - compressed_size / original_size) * 100
        logger.info(
            'PDF comprimido: %d → %d bytes (%.1f%% reducción)',
            original_size, compressed_size, ratio,
        )
        return compressed
