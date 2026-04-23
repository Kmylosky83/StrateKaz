"""
Signals de Configuración Organizacional.

NOTA (H-SC-10): el signal `sincronizar_proveedor_espejo` basado en
`SedeEmpresa.es_proveedor_interno` fue ELIMINADO al mover el concepto
de ruta de recolección desde Fundación a Supply Chain.

El nuevo signal vive en
`apps.supply_chain.catalogos.signals.sincronizar_proveedor_espejo_ruta`
y se dispara sobre `RutaRecoleccion.es_proveedor_interno`.

Este archivo queda reservado para futuros signals propios de Configuración
(sedes, normas ISO, tipos de cambio, etc.). Hoy está vacío a propósito.
"""
