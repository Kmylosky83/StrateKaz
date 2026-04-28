"""
Servicio formal para generar PDFs de Voucher de Recepcion.

Centraliza la generacion de PDFs (80mm termico y carta) usando WeasyPrint
con templates HTML separados. Aisla la logica de presentacion del ViewSet
y permite reutilizar el render desde signals, tareas Celery o tests.

H-SC-01 — Voucher PDFService formal (refactor 2026-04-27).
"""
from django.template.loader import render_to_string
from django.contrib.staticfiles import finders
from django.db import connection
from weasyprint import CSS, HTML
from weasyprint.text.fonts import FontConfiguration


class VoucherPDFService:
    """Genera PDFs de VoucherRecepcion con branding del tenant.

    Metodos publicos:
      - generar_pdf_80mm(voucher) -> bytes (ticket termico)
      - generar_pdf_carta(voucher) -> bytes (formato archivo)

    Reglas:
      - El branding se lee dinamicamente de connection.tenant.
      - Los templates viven en `recepcion/templates/voucher/`.
      - WeasyPrint NO soporta CSS flex/grid: los templates usan
        float / inline-block / table-cell.
    """

    # ------------------------------------------------------------------
    # API publica
    # ------------------------------------------------------------------
    @staticmethod
    def generar_pdf_80mm(voucher, tenant_branding=True):
        """Genera PDF 80mm para impresora termica. Devuelve bytes."""
        contexto = VoucherPDFService._build_contexto(voucher, tenant_branding)
        html = render_to_string('voucher/voucher_80mm.html', contexto)
        css_full = finders.find('voucher/voucher_80mm.css')

        font_config = FontConfiguration()
        stylesheets = [CSS(filename=css_full)] if css_full else []
        return HTML(string=html).write_pdf(
            stylesheets=stylesheets,
            font_config=font_config,
            presentational_hints=True,
        )

    @staticmethod
    def generar_pdf_carta(voucher, tenant_branding=True):
        """Genera PDF carta para archivo. Devuelve bytes."""
        contexto = VoucherPDFService._build_contexto(voucher, tenant_branding)
        html = render_to_string('voucher/voucher_carta.html', contexto)
        font_config = FontConfiguration()
        return HTML(string=html).write_pdf(
            font_config=font_config,
            presentational_hints=True,
        )

    # ------------------------------------------------------------------
    # Internos
    # ------------------------------------------------------------------
    @staticmethod
    def _build_contexto(voucher, tenant_branding):
        """Contexto compartido entre formatos 80mm y carta."""
        tenant = getattr(connection, 'tenant', None)
        tenant_nombre = ''
        tenant_nit = ''
        tenant_logo_url = ''
        if tenant is not None:
            tenant_nombre = (
                getattr(tenant, 'nombre_comercial', None)
                or getattr(tenant, 'razon_social', None)
                or getattr(tenant, 'name', '')
                or ''
            )
            tenant_nit = getattr(tenant, 'nit', '') or ''
            logo_field = getattr(tenant, 'logo', None)
            if logo_field and hasattr(logo_field, 'path'):
                # Para WeasyPrint usar path absoluto del filesystem (no URL).
                try:
                    tenant_logo_url = f'file://{logo_field.path}'
                except Exception:
                    tenant_logo_url = ''

        lineas = list(
            voucher.lineas
            .select_related('producto')
            .prefetch_related('measurements__parameter', 'measurements__classified_range')
            .all()
        )

        proveedor = getattr(voucher, 'proveedor', None)
        proveedor_nombre = ''
        if proveedor is not None:
            cod = getattr(proveedor, 'codigo_interno', '') or ''
            nom = getattr(proveedor, 'nombre_comercial', '') or str(proveedor)
            proveedor_nombre = f'{cod} - {nom}' if cod else nom

        ruta = getattr(voucher, 'ruta_recoleccion', None)
        ruta_nombre = getattr(ruta, 'nombre', '') if ruta is not None else ''

        almacen = getattr(voucher, 'almacen_destino', None)
        almacen_nombre = getattr(almacen, 'nombre', '') if almacen is not None else ''

        operador = getattr(voucher, 'operador_bascula', None)
        operador_nombre = ''
        operador_cargo = ''
        if operador is not None:
            operador_nombre = (
                operador.get_full_name() if hasattr(operador, 'get_full_name') else str(operador)
            ) or str(operador)
            if getattr(operador, 'is_superuser', False) and not getattr(operador, 'cargo_id', None):
                operador_cargo = 'Administrador del Sistema'
            else:
                cargo = getattr(operador, 'cargo', None)
                if cargo is not None:
                    operador_cargo = getattr(cargo, 'nombre', '') or getattr(cargo, 'name', '') or ''

        # QC resumen: 'N/A' si ninguna línea requiere QC; 'Pendiente' si lo
        # requiere y no tiene mediciones; 'Registrado' si está completo.
        try:
            requiere_qc = bool(getattr(voucher, 'requiere_qc', False))
            tiene_qc = bool(getattr(voucher, 'tiene_qc', False))
        except Exception:
            requiere_qc = False
            tiene_qc = False
        if not requiere_qc:
            qc_resumen = 'N/A'
        else:
            qc_resumen = 'Registrado' if tiene_qc else 'Pendiente'

        # Estado compacto para ticket térmico ('Aprobado — listo para liquidar'
        # se desborda en 80mm).
        estado_full = (
            voucher.get_estado_display() if hasattr(voucher, 'get_estado_display') else ''
        )
        estado_compacto = {
            'PENDIENTE_QC': 'PENDIENTE QC',
            'APROBADO': 'APROBADO',
            'RECHAZADO': 'RECHAZADO',
            'LIQUIDADO': 'LIQUIDADO',
        }.get(getattr(voucher, 'estado', ''), estado_full)

        return {
            'voucher': voucher,
            'tenant_nombre': tenant_nombre or 'StrateKaz',
            'tenant_nit': tenant_nit,
            'tenant_logo_url': tenant_logo_url,
            'tenant_branding': tenant_branding,
            'lineas': lineas,
            'proveedor_nombre': proveedor_nombre or '—',
            'ruta_nombre': ruta_nombre,
            'almacen_nombre': almacen_nombre or '—',
            'operador_nombre': operador_nombre or '—',
            'operador_cargo': operador_cargo,
            'modalidad_display': voucher.get_modalidad_entrega_display() if hasattr(voucher, 'get_modalidad_entrega_display') else '',
            'estado_display': estado_full,
            'estado_compacto': estado_compacto,
            'qc_resumen': qc_resumen,
            'peso_total': getattr(voucher, 'peso_neto_total', 0) or 0,
        }
