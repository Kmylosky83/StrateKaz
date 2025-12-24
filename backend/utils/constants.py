"""
Constantes del sistema
"""

# Estados de recolección
ESTADO_RECOLECCION = {
    'PROGRAMADA': 'Programada',
    'EN_RUTA': 'En Ruta',
    'CUMPLIDA': 'Cumplida',
    'INCUMPLIDA': 'Incumplida',
    'CANCELADA': 'Cancelada',
}

# Tipos de proveedor
TIPO_PROVEEDOR = {
    'EXTERNO': 'Externo',
    'ECOALIADO': 'Ecoaliado',
}

# Nota: Los cargos son completamente dinámicos y se gestionan desde
# Dirección Estratégica > Organización > Cargos
# No se deben hardcodear cargos en el código
