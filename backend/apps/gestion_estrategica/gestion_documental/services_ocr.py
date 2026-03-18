"""
Servicio OCR para extracción de texto de PDFs.
Estrategia dos tiers:
  1. pdfplumber (rápido, para PDFs digitales nativos)
  2. Tesseract OCR (para PDFs escaneados/imagen)
"""

import logging
import os
import time

logger = logging.getLogger('gestion_documental')


class OcrService:
    """Servicio de extracción de texto de PDFs con fallback a OCR."""

    MAX_PAGES = 100
    MIN_TEXT_PER_PAGE = 50  # chars promedio/página para considerar "digital"
    TESSERACT_LANG = 'spa'  # Español

    @classmethod
    def extraer_texto_pdf(cls, file_path: str) -> dict:
        """
        Extrae texto de un PDF con estrategia dos tiers.

        Returns:
            {
                'texto': str,
                'metodo': 'pdfplumber' | 'tesseract' | 'mixto',
                'confianza': float (0-1),
                'paginas_procesadas': int,
                'total_paginas': int,
                'duracion_seg': float,
                'error': str | None,
            }
        """
        if not os.path.exists(file_path):
            return {
                'texto': '',
                'metodo': 'ninguno',
                'confianza': 0.0,
                'paginas_procesadas': 0,
                'total_paginas': 0,
                'duracion_seg': 0.0,
                'error': f'Archivo no encontrado: {file_path}',
            }

        inicio = time.time()

        # Tier 1: pdfplumber (rápido)
        texto, paginas_procesadas, total_paginas = cls._extraer_con_pdfplumber(
            file_path
        )

        # Evaluar si el texto es suficiente
        if paginas_procesadas > 0:
            chars_por_pagina = len(texto) / paginas_procesadas
        else:
            chars_por_pagina = 0

        if chars_por_pagina >= cls.MIN_TEXT_PER_PAGE:
            # PDF digital nativo — pdfplumber fue suficiente
            confianza = cls._calcular_confianza_pdfplumber(texto, paginas_procesadas)
            duracion = time.time() - inicio
            logger.info(
                f'[OCR] pdfplumber OK: {paginas_procesadas}/{total_paginas} págs, '
                f'{len(texto)} chars, confianza={confianza:.2f}, {duracion:.1f}s'
            )
            return {
                'texto': texto,
                'metodo': 'pdfplumber',
                'confianza': confianza,
                'paginas_procesadas': paginas_procesadas,
                'total_paginas': total_paginas,
                'duracion_seg': round(duracion, 2),
                'error': None,
            }

        # Tier 2: Tesseract OCR (PDF escaneado/imagen)
        logger.info(
            f'[OCR] pdfplumber insuficiente ({chars_por_pagina:.0f} chars/pág), '
            f'intentando Tesseract...'
        )
        try:
            texto_ocr, confianza_ocr, pags_ocr, total_ocr = (
                cls._extraer_con_tesseract(file_path)
            )
            duracion = time.time() - inicio
            logger.info(
                f'[OCR] Tesseract OK: {pags_ocr}/{total_ocr} págs, '
                f'{len(texto_ocr)} chars, confianza={confianza_ocr:.2f}, {duracion:.1f}s'
            )
            return {
                'texto': texto_ocr,
                'metodo': 'tesseract',
                'confianza': confianza_ocr,
                'paginas_procesadas': pags_ocr,
                'total_paginas': total_ocr,
                'duracion_seg': round(duracion, 2),
                'error': None,
            }
        except Exception as e:
            duracion = time.time() - inicio
            error_msg = f'Tesseract falló: {str(e)}'
            logger.error(f'[OCR] {error_msg}')
            # Si Tesseract falla pero pdfplumber sacó algo, retornar eso
            if texto.strip():
                return {
                    'texto': texto,
                    'metodo': 'pdfplumber',
                    'confianza': cls._calcular_confianza_pdfplumber(
                        texto, paginas_procesadas
                    ),
                    'paginas_procesadas': paginas_procesadas,
                    'total_paginas': total_paginas,
                    'duracion_seg': round(duracion, 2),
                    'error': error_msg,
                }
            return {
                'texto': '',
                'metodo': 'ninguno',
                'confianza': 0.0,
                'paginas_procesadas': 0,
                'total_paginas': total_paginas,
                'duracion_seg': round(duracion, 2),
                'error': error_msg,
            }

    @classmethod
    def _extraer_con_pdfplumber(cls, file_path: str) -> tuple:
        """
        Extrae texto usando pdfplumber (PDFs digitales nativos).
        Returns: (texto, paginas_procesadas, total_paginas)
        """
        import pdfplumber

        textos = []
        paginas_procesadas = 0
        total_paginas = 0

        try:
            with pdfplumber.open(file_path) as pdf:
                total_paginas = len(pdf.pages)
                paginas_a_procesar = min(total_paginas, cls.MAX_PAGES)

                for i in range(paginas_a_procesar):
                    page = pdf.pages[i]
                    texto_pagina = page.extract_text() or ''
                    if texto_pagina.strip():
                        textos.append(texto_pagina.strip())
                    paginas_procesadas += 1

        except Exception as e:
            logger.warning(f'[OCR] pdfplumber error: {e}')

        texto_completo = '\n\n'.join(textos)
        return texto_completo, paginas_procesadas, total_paginas

    @classmethod
    def _extraer_con_tesseract(cls, file_path: str) -> tuple:
        """
        Extrae texto usando Tesseract OCR (PDFs escaneados/imagen).
        Convierte páginas a imagen y aplica OCR.
        Returns: (texto, confianza_promedio, paginas_procesadas, total_paginas)
        """
        import pytesseract
        from pdf2image import convert_from_path

        # Convertir PDF a imágenes (limitar a MAX_PAGES)
        images = convert_from_path(
            file_path,
            dpi=300,
            last_page=cls.MAX_PAGES,
        )
        total_paginas = len(images)

        textos = []
        confianzas = []

        for i, image in enumerate(images):
            try:
                # Extraer texto con datos de confianza
                data = pytesseract.image_to_data(
                    image,
                    lang=cls.TESSERACT_LANG,
                    output_type=pytesseract.Output.DICT,
                )

                # Reconstruir texto de la página
                palabras = []
                confs_pagina = []
                for j, word in enumerate(data['text']):
                    if word.strip():
                        palabras.append(word)
                        conf = int(data['conf'][j])
                        if conf > 0:
                            confs_pagina.append(conf)

                texto_pagina = ' '.join(palabras)
                if texto_pagina.strip():
                    textos.append(texto_pagina.strip())

                if confs_pagina:
                    confianzas.extend(confs_pagina)

            except Exception as e:
                logger.warning(f'[OCR] Tesseract error en página {i + 1}: {e}')

        texto_completo = '\n\n'.join(textos)

        # Calcular confianza promedio (0-1)
        if confianzas:
            confianza_promedio = sum(confianzas) / len(confianzas) / 100.0
        else:
            confianza_promedio = 0.0

        return texto_completo, confianza_promedio, total_paginas, total_paginas

    @classmethod
    def _calcular_confianza_pdfplumber(cls, texto: str, paginas: int) -> float:
        """
        Heurística de confianza para extracción con pdfplumber.
        PDFs digitales nativos suelen tener extracción perfecta.
        """
        if paginas == 0 or not texto.strip():
            return 0.0

        chars_por_pagina = len(texto) / paginas

        # PDFs digitales con buen contenido → alta confianza
        if chars_por_pagina >= 500:
            return 0.98
        elif chars_por_pagina >= 200:
            return 0.95
        elif chars_por_pagina >= 100:
            return 0.85
        elif chars_por_pagina >= cls.MIN_TEXT_PER_PAGE:
            return 0.70
        else:
            return 0.50
