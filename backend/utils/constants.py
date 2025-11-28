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

# Roles/Cargos del sistema
CARGOS = {
    'SUPERADMIN': 'superadmin',
    'GERENTE': 'gerente',
    'ADMIN': 'admin',
    'LIDER_COMERCIAL': 'lider_comercial',
    'LIDER_COMPRAS': 'lider_compras',
    'LIDER_COM_ECONORTE': 'lider_com_econorte',
    'LIDER_LOG_ECONORTE': 'lider_log_econorte',
    'SUPERVISOR_PLANTA': 'supervisor_planta',
    'JEFE_PLANTA': 'jefe_planta',
    'COMERCIAL_ECONORTE': 'comercial_econorte',
    'RECOLECTOR_ECONORTE': 'recolector_econorte',
    'LIDER_TALENTO_HUMANO': 'lider_talento_humano',
    'PROFESIONAL_SST': 'profesional_sst',
}

# Unidades de negocio
UNIDADES_NEGOCIO = {
    'GRASAS_HUESOS': 'Grasas y Huesos del Norte S.A.S',
    'ECONORTE': 'EcoNorte',
}
