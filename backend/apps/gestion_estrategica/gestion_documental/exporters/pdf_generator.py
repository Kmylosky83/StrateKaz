"""
Generador de PDF para Gestión Documental
=========================================
Convierte documentos del SGI a PDF usando WeasyPrint (HTML → PDF).

El HTML se construye con Django templates en:
  templates/pdf/gestion_documental/documento.html
  templates/pdf/gestion_documental/_watermark.html
  templates/pdf/gestion_documental/_firmas.html
  templates/pdf/gestion_documental/_qr.html
  templates/pdf/gestion_documental/_formulario.html
  templates/pdf/base_weasyprint.html

Características:
- Firmas digitales manuscritas incrustadas (canvas → Base64)
- Código QR verificable con hash SHA-256
- Watermarks dinámicos según estado (BORRADOR, COPIA CONTROLADA, OBSOLETO)
- Metadata grid ISO (código, versión, estado, clasificación)
- Form Builder JSON → HTML para documentos tipo FORMULARIO
"""
import base64
import hashlib
from io import BytesIO
from datetime import datetime

from django.template.loader import render_to_string

try:
    from weasyprint import HTML
    WEASYPRINT_AVAILABLE = True
except ImportError:
    WEASYPRINT_AVAILABLE = False

try:
    import qrcode
    QRCODE_AVAILABLE = True
except ImportError:
    QRCODE_AVAILABLE = False


# Textos de watermark por estado
_WATERMARK_CONFIG = {
    'BORRADOR': {
        'texto': 'BORRADOR',
        'subtexto': 'Documento no aprobado — Solo uso interno',
        'color': 'rgba(200, 200, 200, 0.25)',
    },
    'EN_REVISION': {
        'texto': 'EN REVISIÓN',
        'subtexto': 'Pendiente de aprobación',
        'color': 'rgba(200, 200, 200, 0.25)',
    },
    'OBSOLETO': {
        'texto': 'OBSOLETO',
        'subtexto': 'Documento fuera de vigencia',
        'color': 'rgba(220, 50, 50, 0.20)',
    },
}

_ROL_LABELS = {
    'ELABORO': 'Elaboró',
    'REVISO': 'Revisó',
    'APROBO': 'Aprobó',
}

_ESTADO_PENDIENTE_LABELS = {
    'PENDIENTE': 'Pendiente de firma',
    'DELEGADO': 'Delegada',
    'EXPIRADO': 'Expirada',
}


class DocumentoPDFGenerator:
    """Genera PDFs de documentos del sistema de gestión documental."""

    def __init__(self, empresa=None):
        self.empresa = empresa
        self.logo_base64 = None
        if empresa and hasattr(empresa, 'logo') and empresa.logo:
            self._load_logo()

    def _load_logo(self):
        try:
            if self.empresa.logo and hasattr(self.empresa.logo, 'path'):
                with open(self.empresa.logo.path, 'rb') as f:
                    self.logo_base64 = base64.b64encode(f.read()).decode('utf-8')
        except Exception:
            pass

    def _get_empresa_info(self):
        if self.empresa:
            return {
                'razon_social': self.empresa.razon_social or 'Empresa',
                'nit': self.empresa.nit or '',
            }
        return {'razon_social': 'Empresa', 'nit': ''}

    # =========================================================================
    # Método principal
    # =========================================================================

    def generate_documento_pdf(self, documento, usuario=None):
        """
        Genera PDF de un documento.

        Args:
            documento: Instancia de Documento
            usuario: Usuario que solicita la copia (para watermark PUBLICADO)

        Returns:
            BytesIO: Buffer con el PDF generado
        """
        if not WEASYPRINT_AVAILABLE:
            raise ImportError("WeasyPrint no está instalado. Ejecute: pip install weasyprint")

        context = self._build_context(documento, usuario)
        html_string = render_to_string('pdf/gestion_documental/documento.html', context)

        pdf_buffer = BytesIO()
        HTML(string=html_string).write_pdf(pdf_buffer)
        pdf_buffer.seek(0)
        return pdf_buffer

    # =========================================================================
    # Construcción del contexto para el template
    # =========================================================================

    def _build_context(self, documento, usuario):
        empresa_info = self._get_empresa_info()
        fecha_generacion = datetime.now().strftime('%d/%m/%Y %H:%M')
        usuario_nombre = usuario.get_full_name() if usuario else 'N/A'

        # Watermark
        watermark_config = _WATERMARK_CONFIG.get(documento.estado)
        if documento.estado == 'PUBLICADO':
            watermark_config = {
                'texto': 'COPIA CONTROLADA',
                'subtexto': f'{fecha_generacion} — {usuario_nombre}',
                'color': 'rgba(200, 200, 200, 0.25)',
            }

        # Plantilla: estilos y encabezado/pie personalizados
        custom_css = ''
        encabezado_html = ''
        pie_pagina_html = ''
        if documento.plantilla:
            custom_css = documento.plantilla.estilos_css or ''
            encabezado_html = documento.plantilla.encabezado or ''
            pie_pagina_html = documento.plantilla.pie_pagina or ''

        # Contenido con variables sustituidas
        contenido = self._sustituir_variables(documento, empresa_info)

        # Tipo de documento
        es_formulario = (
            hasattr(documento, 'tipo_documento')
            and documento.tipo_documento
            and documento.tipo_documento.categoria == 'FORMULARIO'
        )

        return {
            # Empresa
            'razon_social': empresa_info['razon_social'],
            'nit': empresa_info['nit'],
            'logo_base64': self.logo_base64,

            # Documento
            'documento_codigo': documento.codigo or '',
            'titulo': documento.titulo or '',
            'version_actual': documento.version_actual or '',
            'estado_key': documento.estado,
            'estado_display': documento.get_estado_display(),
            'clasificacion_display': documento.get_clasificacion_display(),
            'tipo_documento_nombre': documento.tipo_documento.nombre if documento.tipo_documento else '',
            'elaborado_nombre': documento.elaborado_por.get_full_name() if documento.elaborado_por else 'N/A',
            'revisado_nombre': documento.revisado_por.get_full_name() if documento.revisado_por else '—',
            'aprobado_nombre': documento.aprobado_por.get_full_name() if documento.aprobado_por else '—',
            'fecha_publicacion': (
                documento.fecha_publicacion.strftime('%d/%m/%Y')
                if documento.fecha_publicacion else '—'
            ),
            'fecha_vigencia': (
                documento.fecha_vigencia.strftime('%d/%m/%Y')
                if documento.fecha_vigencia else '—'
            ),

            # Watermark
            'watermark_texto': watermark_config['texto'] if watermark_config else None,
            'watermark_subtexto': watermark_config.get('subtexto', '') if watermark_config else '',
            'watermark_color': watermark_config['color'] if watermark_config else '',

            # Plantilla personalizada
            'custom_css': custom_css,
            'encabezado_html': encabezado_html,
            'pie_pagina_html': pie_pagina_html,

            # Contenido
            'es_formulario': es_formulario,
            'contenido': contenido,
            'campos_formulario': self._preparar_campos_formulario(documento) if es_formulario else [],

            # Firmas
            'firmas': self._preparar_firmas(documento),

            # QR
            **self._preparar_qr(documento, empresa_info),

            # Meta
            'fecha_generacion': fecha_generacion,
        }

    # =========================================================================
    # Sustitución de variables {{var}} en el contenido
    # =========================================================================

    def _sustituir_variables(self, documento, empresa_info):
        contenido = documento.contenido or ''
        variables = {
            '{{codigo}}': documento.codigo or '',
            '{{titulo}}': documento.titulo or '',
            '{{version}}': documento.version_actual or '',
            '{{estado}}': documento.get_estado_display(),
            '{{empresa}}': empresa_info['razon_social'],
            '{{nit}}': empresa_info['nit'],
            '{{fecha_publicacion}}': (
                documento.fecha_publicacion.strftime('%d/%m/%Y')
                if documento.fecha_publicacion else ''
            ),
            '{{fecha_vigencia}}': (
                documento.fecha_vigencia.strftime('%d/%m/%Y')
                if documento.fecha_vigencia else ''
            ),
            '{{elaborado_por}}': (
                documento.elaborado_por.get_full_name()
                if documento.elaborado_por else ''
            ),
            '{{revisado_por}}': (
                documento.revisado_por.get_full_name()
                if documento.revisado_por else ''
            ),
            '{{aprobado_por}}': (
                documento.aprobado_por.get_full_name()
                if documento.aprobado_por else ''
            ),
        }
        for var, value in variables.items():
            contenido = contenido.replace(var, value)
        return contenido

    # =========================================================================
    # Preparación de datos de firmas para el template
    # =========================================================================

    def _preparar_firmas(self, documento):
        """
        Retorna lista de dicts con datos de cada firma listos para el template.
        El template no necesita acceder a ORM — solo itera la lista.
        """
        try:
            firmas_qs = documento.get_firmas_digitales().select_related(
                'usuario', 'cargo'
            ).order_by('orden', 'created_at')
        except Exception:
            return []

        if not firmas_qs.exists():
            return []

        resultado = []
        for firma in firmas_qs:
            img_src = ''
            if firma.estado == 'FIRMADO' and firma.firma_imagen:
                img_src = firma.firma_imagen
                if not img_src.startswith('data:'):
                    img_src = f'data:image/png;base64,{img_src}'

            resultado.append({
                'rol_label': _ROL_LABELS.get(firma.rol_firma, firma.rol_firma),
                'nombre': firma.usuario.get_full_name() if firma.usuario else 'N/A',
                'cargo_nombre': firma.cargo.nombre if firma.cargo else '',
                'fecha_str': (
                    firma.fecha_firma.strftime('%d/%m/%Y %H:%M')
                    if firma.fecha_firma else ''
                ),
                'hash_short': firma.firma_hash[:16] if firma.firma_hash else '',
                'estado': firma.estado,
                'estado_label': _ESTADO_PENDIENTE_LABELS.get(firma.estado, 'Pendiente'),
                'comentarios': firma.comentarios or 'Sin motivo especificado',
                'img_src': img_src,
            })

        return resultado

    # =========================================================================
    # Preparación de datos QR para el template
    # =========================================================================

    def _preparar_qr(self, documento, empresa_info):
        """
        Retorna dict con qr_base64 y doc_hash para el template _qr.html.
        Si la generación del QR falla, retorna qr_base64='' y doc_hash igual.
        """
        contenido_raw = (documento.contenido or '') + (documento.codigo or '')
        doc_hash = hashlib.sha256(contenido_raw.encode('utf-8')).hexdigest()

        if not QRCODE_AVAILABLE:
            return {'qr_base64': '', 'doc_hash': doc_hash}

        verificacion_url = (
            f'https://app.stratekaz.com/verificar-documento'
            f'?codigo={documento.codigo}'
            f'&version={documento.version_actual}'
            f'&hash={doc_hash[:16]}'
        )

        try:
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_M,
                box_size=4,
                border=1,
            )
            qr.add_data(verificacion_url)
            qr.make(fit=True)

            qr_buffer = BytesIO()
            img = qr.make_image(fill_color='#2d3748', back_color='white')
            img.save(qr_buffer, format='PNG')
            qr_base64 = base64.b64encode(qr_buffer.getvalue()).decode('utf-8')

            return {'qr_base64': qr_base64, 'doc_hash': doc_hash}

        except Exception:
            return {'qr_base64': '', 'doc_hash': doc_hash}

    # =========================================================================
    # Form Builder: CampoFormulario JSON → lista de dicts para el template
    # =========================================================================

    def _preparar_campos_formulario(self, documento):
        """
        Transforma documento.datos_formulario (JSON) +
        tipo_documento.campos_personalizados (CampoFormulario queryset)
        en una lista de dicts lista para iterar en _formulario.html.

        Cada dict tiene:
          etiqueta, tipo_campo, es_seccion,
          valor_display, img_src, columnas_tabla, filas_tabla
        """
        if not documento.tipo_documento:
            return []

        datos = documento.datos_formulario or {}

        try:
            campos_qs = (
                documento.tipo_documento.campos_personalizados
                .filter(is_active=True)
                .order_by('orden')
            )
        except Exception:
            return []

        resultado = []
        for campo in campos_qs:
            tipo = campo.tipo_campo
            valor_raw = datos.get(campo.nombre_campo)

            if tipo == 'SECCION':
                resultado.append({
                    'etiqueta': campo.etiqueta,
                    'tipo_campo': tipo,
                    'es_seccion': True,
                    'valor_display': '',
                    'img_src': '',
                    'columnas_tabla': [],
                    'filas_tabla': [],
                })
                continue

            # Normalizar valor según tipo
            valor_display = ''
            img_src = ''
            columnas_tabla = []
            filas_tabla = []

            if valor_raw is None or valor_raw == '':
                pass  # valor_display queda vacío

            elif tipo == 'SIGNATURE':
                raw = str(valor_raw)
                img_src = raw if raw.startswith('data:') else f'data:image/png;base64,{raw}'

            elif tipo == 'TABLA':
                columnas_def = campo.columnas_tabla or []
                # columnas_def puede ser lista de strings o lista de dicts con 'key'/'label'
                if columnas_def and isinstance(columnas_def[0], dict):
                    columnas_tabla = [c.get('label', c.get('key', '')) for c in columnas_def]
                    col_keys = [c.get('key', '') for c in columnas_def]
                else:
                    columnas_tabla = list(columnas_def)
                    col_keys = list(columnas_def)

                if isinstance(valor_raw, list):
                    for fila in valor_raw:
                        if isinstance(fila, dict):
                            filas_tabla.append([fila.get(k, '') for k in col_keys])
                        else:
                            filas_tabla.append([str(fila)])

            elif tipo in ('CHECKBOX', 'MULTISELECT'):
                if isinstance(valor_raw, list):
                    valor_display = ', '.join(str(v) for v in valor_raw)
                else:
                    valor_display = str(valor_raw)

            elif tipo in ('DATE', 'DATETIME'):
                try:
                    # Intentar parsear ISO y reformatear a español
                    from datetime import date
                    dt = datetime.fromisoformat(str(valor_raw).replace('Z', '+00:00'))
                    valor_display = dt.strftime('%d/%m/%Y %H:%M') if tipo == 'DATETIME' else dt.strftime('%d/%m/%Y')
                except Exception:
                    valor_display = str(valor_raw)

            elif tipo == 'FILE':
                # Solo mostrar nombre, no URL (PDFs no pueden hacer links funcionales)
                valor_display = str(valor_raw).split('/')[-1]

            else:
                valor_display = str(valor_raw)

            resultado.append({
                'etiqueta': campo.etiqueta,
                'tipo_campo': tipo,
                'es_seccion': False,
                'valor_display': valor_display,
                'img_src': img_src,
                'columnas_tabla': columnas_tabla,
                'filas_tabla': filas_tabla,
            })

        return resultado
