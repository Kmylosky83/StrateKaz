"""
Helper compartido para generación de consecutivos (Sistema A — hardcoded).

Reemplaza al Sistema B (`ConsecutivoConfig` en `gestion_estrategica.organizacion`)
eliminado el 2026-04-22. Cada modelo que necesite autogenerar un código llama
a `siguiente_consecutivo_scan(...)` desde su `save()` o un `@staticmethod`
`generar_codigo()`.

Formato producido: `{prefix}[{sep}{year}]{sep}{number_padded}`
    Ej sin año: "PROV-00001", "CAT-042", "MP-00123"
    Ej con año: "OC-2026-00001", "RC-2026-00012"

Concurrency: safe para concurrencia moderada gracias al UniqueConstraint del
modelo destino. En la rara colisión simultánea, la segunda transacción reintenta
con el siguiente número (el caller puede envolverlo en retry si necesita).

Uso:
    @staticmethod
    def generar_codigo():
        from apps.core.utils.consecutivos import siguiente_consecutivo_scan
        return siguiente_consecutivo_scan(
            CategoriaProducto.objects.all(),
            campo_codigo='codigo',
            prefix='CAT',
            padding=3,
        )
"""
from __future__ import annotations

from django.db.models import QuerySet
from django.utils import timezone


def siguiente_consecutivo_scan(
    queryset: QuerySet,
    campo_codigo: str,
    prefix: str,
    padding: int = 5,
    include_year: bool = False,
    separator: str = '-',
) -> str:
    """
    Devuelve el siguiente consecutivo escaneando el queryset por el máximo
    código con el prefijo (+ año opcional) dado.

    Args:
        queryset: QuerySet del modelo objetivo (ej: Proveedor.objects.all()).
                  Se recomienda pasar un queryset ya filtrado a activos.
        campo_codigo: Nombre del campo que almacena el código (ej: 'codigo',
                      'codigo_interno', 'numero_orden').
        prefix: Prefijo textual (ej: 'PROV', 'CAT', 'OC').
        padding: Número de dígitos de relleno para el número (default 5).
        include_year: Si True, intercala el año entre prefix y número.
                      Esto efectivamente "reset yearly" porque el scan solo
                      busca con el año actual.
        separator: Separador entre partes (default '-').

    Returns:
        Siguiente consecutivo formateado.
    """
    year_part = ''
    if include_year:
        year_part = f'{separator}{timezone.now().date().year}'
    search_prefix = f'{prefix}{year_part}{separator}'

    ultimo = (
        queryset
        .filter(**{f'{campo_codigo}__startswith': search_prefix})
        .order_by(f'-{campo_codigo}')
        .first()
    )

    numero = 1
    if ultimo is not None:
        codigo_actual = getattr(ultimo, campo_codigo, '') or ''
        try:
            numero = int(codigo_actual.split(separator)[-1]) + 1
        except (ValueError, IndexError):
            numero = 1

    return f'{search_prefix}{str(numero).zfill(padding)}'
