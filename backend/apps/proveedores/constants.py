"""
Constantes del módulo Proveedores
Sistema de Gestión Grasas y Huesos del Norte

Jerarquía de Materia Prima v2.0:
├── HUESO
│   ├── HUESO_CRUDO
│   ├── HUESO_CALCINADO
│   └── HUESO_CENIZA
├── SEBO_CRUDO (sin procesar)
│   ├── SEBO_CRUDO_CARNICERIA
│   ├── SEBO_CRUDO_MATADERO
│   ├── SEBO_CUERO
│   ├── SEBO_CUERO_VIRIL
│   └── SEBO_POLLO
├── SEBO_PROCESADO (por nivel de acidez)
│   ├── SEBO_PROCESADO_A  (1-5% acidez)
│   ├── SEBO_PROCESADO_B  (5.1-8% acidez)
│   ├── SEBO_PROCESADO_B1 (8.1-10% acidez)
│   ├── SEBO_PROCESADO_B2 (10.1-15% acidez)
│   ├── SEBO_PROCESADO_B4 (15.1-20% acidez)
│   └── SEBO_PROCESADO_C  (>20.1% acidez)
├── CHICHARRON
├── CABEZAS
└── ACU (Aceite Comestible Usado)
"""

# Tipos de cuenta bancaria
TIPO_CUENTA_CHOICES = [
    ('AHORROS', 'Ahorros'),
    ('CORRIENTE', 'Corriente'),
]

# ==============================================================================
# CATEGORÍAS PRINCIPALES DE MATERIA PRIMA (para agrupación en UI)
# ==============================================================================

CATEGORIA_MATERIA_PRIMA_CHOICES = [
    ('HUESO', 'Hueso'),
    ('SEBO_CRUDO', 'Sebo Crudo'),
    ('SEBO_PROCESADO', 'Sebo Procesado'),
    ('OTROS', 'Otros'),
]

# ==============================================================================
# CÓDIGOS COMPLETOS DE MATERIA PRIMA - CADA UNO CON PRECIO INDEPENDIENTE
# ==============================================================================

CODIGO_MATERIA_PRIMA_CHOICES = [
    # ===== HUESO =====
    ('HUESO_CRUDO', 'Hueso Crudo'),
    ('HUESO_SECO', 'Hueso Seco'),
    ('HUESO_CALCINADO', 'Hueso Calcinado'),
    ('HUESO_CENIZA', 'Hueso Ceniza'),

    # ===== SEBO CRUDO (sin procesar) =====
    ('SEBO_CRUDO_CARNICERIA', 'Sebo Crudo Carnicería'),
    ('SEBO_CRUDO_MATADERO', 'Sebo Crudo Matadero'),
    ('SEBO_CUERO', 'Sebo de Cuero'),
    ('SEBO_CUERO_VIRIL', 'Sebo de Cuero de Viril'),
    ('SEBO_POLLO', 'Sebo Pollo'),

    # ===== SEBO PROCESADO (por acidez) =====
    ('SEBO_PROCESADO_A', 'Sebo Procesado Tipo A (1-5% Acidez)'),
    ('SEBO_PROCESADO_B', 'Sebo Procesado Tipo B (5.1-8% Acidez)'),
    ('SEBO_PROCESADO_B1', 'Sebo Procesado Tipo B1 (8.1-10% Acidez)'),
    ('SEBO_PROCESADO_B2', 'Sebo Procesado Tipo B2 (10.1-15% Acidez)'),
    ('SEBO_PROCESADO_B4', 'Sebo Procesado Tipo B4 (15.1-20% Acidez)'),
    ('SEBO_PROCESADO_C', 'Sebo Procesado Tipo C (>20.1% Acidez)'),

    # ===== OTROS =====
    ('CHICHARRON', 'Chicharrón'),
    ('CABEZAS', 'Cabezas'),
    ('ACU', 'ACU - Aceite de Cocina Usado'),
]

# ==============================================================================
# MAPEO DE CÓDIGO A CATEGORÍA PRINCIPAL
# ==============================================================================

CODIGO_A_CATEGORIA = {
    # Hueso
    'HUESO_CRUDO': 'HUESO',
    'HUESO_SECO': 'HUESO',
    'HUESO_CALCINADO': 'HUESO',
    'HUESO_CENIZA': 'HUESO',
    # Sebo Crudo
    'SEBO_CRUDO_CARNICERIA': 'SEBO_CRUDO',
    'SEBO_CRUDO_MATADERO': 'SEBO_CRUDO',
    'SEBO_CUERO': 'SEBO_CRUDO',
    'SEBO_CUERO_VIRIL': 'SEBO_CRUDO',
    'SEBO_POLLO': 'SEBO_CRUDO',
    # Sebo Procesado
    'SEBO_PROCESADO_A': 'SEBO_PROCESADO',
    'SEBO_PROCESADO_B': 'SEBO_PROCESADO',
    'SEBO_PROCESADO_B1': 'SEBO_PROCESADO',
    'SEBO_PROCESADO_B2': 'SEBO_PROCESADO',
    'SEBO_PROCESADO_B4': 'SEBO_PROCESADO',
    'SEBO_PROCESADO_C': 'SEBO_PROCESADO',
    # Otros
    'CHICHARRON': 'OTROS',
    'CABEZAS': 'OTROS',
    'ACU': 'OTROS',
}

# ==============================================================================
# ESTRUCTURA JERÁRQUICA PARA UI (Selección en formularios)
# ==============================================================================

JERARQUIA_MATERIA_PRIMA = {
    'HUESO': {
        'nombre': 'Hueso',
        'descripcion': 'Hueso en diferentes estados de procesamiento',
        'items': [
            {'codigo': 'HUESO_CRUDO', 'nombre': 'Hueso Crudo'},
            {'codigo': 'HUESO_SECO', 'nombre': 'Hueso Seco'},
            {'codigo': 'HUESO_CALCINADO', 'nombre': 'Hueso Calcinado'},
            {'codigo': 'HUESO_CENIZA', 'nombre': 'Hueso Ceniza'},
        ],
    },
    'SEBO_CRUDO': {
        'nombre': 'Sebo Crudo',
        'descripcion': 'Sebo sin procesar de diferentes orígenes',
        'items': [
            {'codigo': 'SEBO_CRUDO_CARNICERIA', 'nombre': 'Sebo Crudo Carnicería'},
            {'codigo': 'SEBO_CRUDO_MATADERO', 'nombre': 'Sebo Crudo Matadero'},
            {'codigo': 'SEBO_CUERO', 'nombre': 'Sebo de Cuero'},
            {'codigo': 'SEBO_CUERO_VIRIL', 'nombre': 'Sebo de Cuero de Viril'},
            {'codigo': 'SEBO_POLLO', 'nombre': 'Sebo Pollo'},
        ],
    },
    'SEBO_PROCESADO': {
        'nombre': 'Sebo Procesado',
        'descripcion': 'Sebo procesado clasificado por nivel de acidez',
        'items': [
            {'codigo': 'SEBO_PROCESADO_A', 'nombre': 'Tipo A (1-5% Acidez)', 'acidez_min': 1, 'acidez_max': 5},
            {'codigo': 'SEBO_PROCESADO_B', 'nombre': 'Tipo B (5.1-8% Acidez)', 'acidez_min': 5.1, 'acidez_max': 8},
            {'codigo': 'SEBO_PROCESADO_B1', 'nombre': 'Tipo B1 (8.1-10% Acidez)', 'acidez_min': 8.1, 'acidez_max': 10},
            {'codigo': 'SEBO_PROCESADO_B2', 'nombre': 'Tipo B2 (10.1-15% Acidez)', 'acidez_min': 10.1, 'acidez_max': 15},
            {'codigo': 'SEBO_PROCESADO_B4', 'nombre': 'Tipo B4 (15.1-20% Acidez)', 'acidez_min': 15.1, 'acidez_max': 20},
            {'codigo': 'SEBO_PROCESADO_C', 'nombre': 'Tipo C (>20.1% Acidez)', 'acidez_min': 20.1, 'acidez_max': 100},
        ],
    },
    'OTROS': {
        'nombre': 'Otros',
        'descripcion': 'Otras materias primas',
        'items': [
            {'codigo': 'CHICHARRON', 'nombre': 'Chicharrón'},
            {'codigo': 'CABEZAS', 'nombre': 'Cabezas'},
            {'codigo': 'ACU', 'nombre': 'ACU - Aceite de Cocina Usado'},
        ],
    },
}

# ==============================================================================
# RANGOS DE ACIDEZ PARA SEBO PROCESADO
# ==============================================================================

RANGOS_ACIDEZ_SEBO = [
    {'codigo': 'SEBO_PROCESADO_A', 'calidad': 'A', 'min': 1, 'max': 5, 'nombre': 'Tipo A'},
    {'codigo': 'SEBO_PROCESADO_B', 'calidad': 'B', 'min': 5.1, 'max': 8, 'nombre': 'Tipo B'},
    {'codigo': 'SEBO_PROCESADO_B1', 'calidad': 'B1', 'min': 8.1, 'max': 10, 'nombre': 'Tipo B1'},
    {'codigo': 'SEBO_PROCESADO_B2', 'calidad': 'B2', 'min': 10.1, 'max': 15, 'nombre': 'Tipo B2'},
    {'codigo': 'SEBO_PROCESADO_B4', 'calidad': 'B4', 'min': 15.1, 'max': 20, 'nombre': 'Tipo B4'},
    {'codigo': 'SEBO_PROCESADO_C', 'calidad': 'C', 'min': 20.1, 'max': 100, 'nombre': 'Tipo C'},
]


def obtener_calidad_por_acidez(valor_acidez: float) -> dict:
    """
    Determina la calidad del sebo procesado basándose en el valor de acidez.

    Args:
        valor_acidez: Porcentaje de acidez (ej: 3.5 para 3.5%)

    Returns:
        dict con codigo, calidad y nombre, o None si no está en rango válido
    """
    for rango in RANGOS_ACIDEZ_SEBO:
        if rango['min'] <= valor_acidez <= rango['max']:
            return {
                'codigo': rango['codigo'],
                'calidad': rango['calidad'],
                'nombre': rango['nombre'],
            }
    return None


# Lista de todos los códigos válidos para validación
CODIGOS_MATERIA_PRIMA_VALIDOS = [code for code, _ in CODIGO_MATERIA_PRIMA_CHOICES]

# Diccionario para búsqueda rápida de nombres
CODIGO_MATERIA_PRIMA_DICT = dict(CODIGO_MATERIA_PRIMA_CHOICES)

# ==============================================================================
# LEGACY - Mantener compatibilidad con código existente
# ==============================================================================

# Alias para compatibilidad con código existente
TIPO_MATERIA_PRIMA_CHOICES = CATEGORIA_MATERIA_PRIMA_CHOICES
CODIGO_A_TIPO_PRINCIPAL = CODIGO_A_CATEGORIA

# DEPRECATED: subtipo_materia original - usar CODIGO_MATERIA_PRIMA_CHOICES
SUBTIPO_MATERIA_LEGACY_CHOICES = [
    ('SEBO', 'Sebo'),
    ('HUESO', 'Hueso'),
    ('CABEZAS', 'Cabezas'),
    ('ACU', 'Aceite Comestible Usado'),
]

# Mapeo de legacy a nuevos códigos (para migración)
LEGACY_TO_NEW_MAPPING = {
    'HUESO': ['HUESO_CRUDO', 'HUESO_SECO', 'HUESO_CALCINADO', 'HUESO_CENIZA'],
    'SEBO': [
        'SEBO_CRUDO_CARNICERIA', 'SEBO_CRUDO_MATADERO', 'SEBO_CUERO',
        'SEBO_CUERO_VIRIL', 'SEBO_POLLO',
        'SEBO_PROCESADO_A', 'SEBO_PROCESADO_B', 'SEBO_PROCESADO_B1',
        'SEBO_PROCESADO_B2', 'SEBO_PROCESADO_B4', 'SEBO_PROCESADO_C',
        'CHICHARRON',
    ],
    'CABEZAS': ['CABEZAS'],
    'ACU': ['ACU'],
}

# Mapeo inverso: de código nuevo a legacy (para validaciones)
def _build_new_to_legacy():
    mapping = {}
    for legacy, codes in LEGACY_TO_NEW_MAPPING.items():
        for code in codes:
            mapping[code] = legacy
    return mapping

NEW_TO_LEGACY_MAPPING = _build_new_to_legacy()

# ==============================================================================
# DEPARTAMENTOS DE COLOMBIA
# ==============================================================================

DEPARTAMENTOS_COLOMBIA = [
    ('AMAZONAS', 'Amazonas'),
    ('ANTIOQUIA', 'Antioquia'),
    ('ARAUCA', 'Arauca'),
    ('ATLANTICO', 'Atlántico'),
    ('BOLIVAR', 'Bolívar'),
    ('BOYACA', 'Boyacá'),
    ('CALDAS', 'Caldas'),
    ('CAQUETA', 'Caquetá'),
    ('CASANARE', 'Casanare'),
    ('CAUCA', 'Cauca'),
    ('CESAR', 'Cesar'),
    ('CHOCO', 'Chocó'),
    ('CORDOBA', 'Córdoba'),
    ('CUNDINAMARCA', 'Cundinamarca'),
    ('GUAINIA', 'Guainía'),
    ('GUAVIARE', 'Guaviare'),
    ('HUILA', 'Huila'),
    ('LA_GUAJIRA', 'La Guajira'),
    ('MAGDALENA', 'Magdalena'),
    ('META', 'Meta'),
    ('NARINO', 'Nariño'),
    ('NORTE_DE_SANTANDER', 'Norte de Santander'),
    ('PUTUMAYO', 'Putumayo'),
    ('QUINDIO', 'Quindío'),
    ('RISARALDA', 'Risaralda'),
    ('SAN_ANDRES', 'San Andrés y Providencia'),
    ('SANTANDER', 'Santander'),
    ('SUCRE', 'Sucre'),
    ('TOLIMA', 'Tolima'),
    ('VALLE_DEL_CAUCA', 'Valle del Cauca'),
    ('VAUPES', 'Vaupés'),
    ('VICHADA', 'Vichada'),
]
