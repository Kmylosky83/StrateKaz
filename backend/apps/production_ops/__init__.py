"""
Módulo de Operaciones de Producción

Este módulo agrupa las aplicaciones relacionadas con las operaciones diarias de producción:
- Recepción: Control de entrada de materia prima (ganado, vísceras)
- Procesamiento: Gestión de líneas de producción y transformación
- Mantenimiento: Gestión de mantenimiento preventivo y correctivo de equipos
- Producto Terminado: Control de salida y distribución de productos finales

Todas las apps heredan de BaseCompanyModel para multi-tenancy.
"""

default_app_config = 'apps.production_ops.apps.ProductionOpsConfig'
