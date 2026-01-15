"""
Utilidades para Formateo y Conversión de Unidades de Medida
Sistema de Gestión StrateKaz

Helpers para formatear valores con unidades de medida dinámicas.
"""
from decimal import Decimal
from typing import Optional, Dict, Any
from django.core.exceptions import ValidationError


def formatear_capacidad(
    valor: Optional[float | Decimal],
    unidad_codigo: str = 'KG',
    incluir_simbolo: bool = True,
    locale_config: Optional[Dict[str, str]] = None
) -> str:
    """
    Formatea un valor de capacidad con su unidad de medida.

    Args:
        valor: Valor numérico a formatear
        unidad_codigo: Código de la unidad (ej: 'KG', 'TON', 'M3')
        incluir_simbolo: Si incluir el símbolo/nombre de la unidad
        locale_config: Configuración regional opcional
            {
                'separador_miles': '.',
                'separador_decimales': ',',
            }

    Returns:
        str: Valor formateado (ej: "5.2 ton", "1,200 m³")

    Examples:
        >>> formatear_capacidad(5200, 'KG')
        '5,200 kg'
        >>> formatear_capacidad(5.2, 'TON')
        '5.2 ton'
        >>> formatear_capacidad(1200, 'M3', locale_config={'separador_miles': '.'})
        '1.200 m³'
    """
    from .models_unidades import UnidadMedida

    if valor is None:
        return ''

    # Obtener unidad
    unidad = UnidadMedida.obtener_por_codigo(unidad_codigo)
    if not unidad:
        # Unidad no encontrada, formatear simple
        return str(valor)

    # Usar método de formateo de la unidad
    return unidad.formatear(valor, incluir_simbolo, locale_config)


def formatear_capacidad_auto(
    valor: Optional[float | Decimal],
    unidad_codigo: str = 'KG',
    auto_escalar: bool = True,
    locale_config: Optional[Dict[str, str]] = None
) -> str:
    """
    Formatea un valor con auto-escalado a la unidad más apropiada.

    Por ejemplo:
    - 5000 kg → 5 ton
    - 0.5 ton → 500 kg
    - 1500 m → 1.5 km

    Args:
        valor: Valor numérico a formatear
        unidad_codigo: Código de la unidad base
        auto_escalar: Si auto-escalar a unidad más apropiada
        locale_config: Configuración regional

    Returns:
        str: Valor formateado con auto-escalado

    Examples:
        >>> formatear_capacidad_auto(5000, 'KG')
        '5 ton'
        >>> formatear_capacidad_auto(500, 'GR')
        '0.5 kg'
    """
    from .models_unidades import UnidadMedida

    if valor is None:
        return ''

    # Obtener unidad base
    unidad_base = UnidadMedida.obtener_por_codigo(unidad_codigo)
    if not unidad_base:
        return str(valor)

    if not auto_escalar:
        return unidad_base.formatear(valor, True, locale_config)

    # Obtener todas las unidades de la misma categoría
    unidades = UnidadMedida.obtener_por_categoria(unidad_base.categoria)

    # Convertir a valor base
    if not isinstance(valor, Decimal):
        valor = Decimal(str(valor))

    valor_base = unidad_base.convertir_a_base(valor)

    # Encontrar la mejor unidad para representar el valor
    mejor_unidad = unidad_base
    mejor_valor = valor
    mejor_score = float('inf')

    for unidad in unidades:
        # Convertir a esta unidad
        valor_en_unidad = unidad.convertir_desde_base(valor_base)

        # Calcular "score" - queremos valores entre 0.1 y 10000 idealmente
        if valor_en_unidad == 0:
            continue

        abs_valor = abs(float(valor_en_unidad))

        # Penalizar valores muy pequeños o muy grandes
        if abs_valor < 0.1:
            score = 1000 / abs_valor  # Muy pequeño, mala opción
        elif abs_valor > 10000:
            score = abs_valor / 10  # Muy grande, mala opción
        else:
            # Valor en rango bueno, preferir valores entre 1 y 1000
            if 1 <= abs_valor <= 1000:
                score = 1  # Óptimo
            elif 0.1 <= abs_valor < 1:
                score = 2  # Aceptable (decimales)
            else:
                score = abs_valor / 100  # Grandes pero aceptables

        if score < mejor_score:
            mejor_score = score
            mejor_unidad = unidad
            mejor_valor = valor_en_unidad

    return mejor_unidad.formatear(mejor_valor, True, locale_config)


def convertir_capacidad(
    valor: float | Decimal,
    unidad_origen_codigo: str,
    unidad_destino_codigo: str
) -> Decimal:
    """
    Convierte un valor de una unidad a otra.

    Args:
        valor: Valor a convertir
        unidad_origen_codigo: Código de la unidad origen
        unidad_destino_codigo: Código de la unidad destino

    Returns:
        Decimal: Valor convertido

    Raises:
        ValidationError: Si las unidades no son compatibles

    Examples:
        >>> convertir_capacidad(5, 'TON', 'KG')
        Decimal('5000')
        >>> convertir_capacidad(1000, 'GR', 'KG')
        Decimal('1')
    """
    from .models_unidades import UnidadMedida

    unidad_origen = UnidadMedida.obtener_por_codigo(unidad_origen_codigo)
    unidad_destino = UnidadMedida.obtener_por_codigo(unidad_destino_codigo)

    if not unidad_origen:
        raise ValidationError(f'Unidad origen "{unidad_origen_codigo}" no encontrada')

    if not unidad_destino:
        raise ValidationError(f'Unidad destino "{unidad_destino_codigo}" no encontrada')

    return unidad_origen.convertir_a(valor, unidad_destino)


def obtener_locale_config() -> Dict[str, str]:
    """
    Obtiene la configuración regional de la empresa.

    Returns:
        dict: Configuración con separadores de miles y decimales
    """
    from .models import EmpresaConfig

    empresa = EmpresaConfig.get_instance()
    if empresa:
        return {
            'separador_miles': empresa.separador_miles,
            'separador_decimales': empresa.separador_decimales,
        }

    # Valores por defecto (Colombia)
    return {
        'separador_miles': '.',
        'separador_decimales': ',',
    }


def obtener_unidad_capacidad_default():
    """
    Obtiene la unidad de capacidad configurada por defecto en la empresa.

    Returns:
        UnidadMedida|None: Unidad por defecto o None
    """
    from .models import EmpresaConfig

    empresa = EmpresaConfig.get_instance()
    if empresa and empresa.unidad_capacidad_default:
        return empresa.unidad_capacidad_default

    # Fallback: intentar obtener KG
    from .models_unidades import UnidadMedida
    return UnidadMedida.obtener_por_codigo('KG')


def formatear_capacidad_sede(sede) -> str:
    """
    Formatea la capacidad de una sede usando su configuración.

    Args:
        sede: Instancia de SedeEmpresa

    Returns:
        str: Capacidad formateada

    Examples:
        >>> sede = SedeEmpresa.objects.get(codigo='SEDE-001')
        >>> formatear_capacidad_sede(sede)
        '5.2 ton'
    """
    # Usar el property del modelo
    return sede.capacidad_formateada


def crear_reporte_capacidades(sedes_queryset) -> Dict[str, Any]:
    """
    Crea un reporte consolidado de capacidades por unidad.

    Args:
        sedes_queryset: QuerySet de SedeEmpresa

    Returns:
        dict: Reporte con totales por unidad
            {
                'total_global': Decimal('...'),
                'unidad_global': UnidadMedida,
                'total_formateado': '5,200 ton',
                'por_unidad': [
                    {
                        'unidad': UnidadMedida,
                        'total': Decimal('...'),
                        'total_formateado': '...',
                        'cantidad_sedes': 5
                    },
                    ...
                ]
            }
    """
    from .models_unidades import UnidadMedida
    from decimal import Decimal
    from collections import defaultdict

    # Agrupar por unidad
    capacidades_por_unidad = defaultdict(lambda: {'total': Decimal('0'), 'sedes': 0})

    for sede in sedes_queryset:
        if sede.capacidad_almacenamiento and sede.unidad_capacidad:
            key = sede.unidad_capacidad.codigo
            capacidades_por_unidad[key]['total'] += sede.capacidad_almacenamiento
            capacidades_por_unidad[key]['sedes'] += 1
            capacidades_por_unidad[key]['unidad'] = sede.unidad_capacidad

    # Obtener unidad global (default de empresa)
    unidad_global = obtener_unidad_capacidad_default()
    total_global = Decimal('0')

    # Convertir todo a unidad global
    for data in capacidades_por_unidad.values():
        unidad = data['unidad']
        total = data['total']

        if unidad_global and unidad.id != unidad_global.id:
            # Convertir a unidad global
            try:
                total_convertido = unidad.convertir_a(total, unidad_global)
                total_global += total_convertido
            except (ValueError, TypeError, AttributeError):
                # Si falla conversión, sumar directamente
                total_global += total
        else:
            total_global += total

    # Formatear totales
    locale = obtener_locale_config()
    por_unidad = []

    for data in capacidades_por_unidad.values():
        unidad = data['unidad']
        total = data['total']

        por_unidad.append({
            'unidad': unidad,
            'total': total,
            'total_formateado': unidad.formatear(total, True, locale),
            'cantidad_sedes': data['sedes']
        })

    # Ordenar por categoría y orden
    por_unidad.sort(key=lambda x: (x['unidad'].categoria, x['unidad'].orden_display))

    return {
        'total_global': total_global,
        'unidad_global': unidad_global,
        'total_formateado': unidad_global.formatear(total_global, True, locale) if unidad_global else str(total_global),
        'por_unidad': por_unidad
    }
