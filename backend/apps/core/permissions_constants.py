"""
Constantes de Permisos del Sistema - RBAC

IMPORTANTE: Los CODIGOS son inmutables (definidos en codigo).
Las ASIGNACIONES son dinamicas (en base de datos).

Estructura:
- PermissionCodes: Codigos de permisos por modulo
- CargoCodes: Codigos de cargos organizacionales
- RoleCodes: Codigos de roles funcionales
- GroupCodes: Codigos de grupos/equipos
"""


class PermissionCodes:
    """Codigos de permisos organizados por modulo"""

    # ==================== RECOLECCIONES ====================
    class RECOLECCIONES:
        MODULE = 'recolecciones'

        VIEW_LIST = 'recolecciones.view_list'
        VIEW_DETAIL = 'recolecciones.view_detail'
        VIEW_VOUCHER = 'recolecciones.view_voucher'
        VIEW_CERTIFICADO = 'recolecciones.view_certificado'

        CREATE = 'recolecciones.create'
        UPDATE = 'recolecciones.update'
        DELETE = 'recolecciones.delete'

        REGISTER = 'recolecciones.register'
        GENERATE_VOUCHER = 'recolecciones.generate_voucher'
        GENERATE_CERTIFICATE = 'recolecciones.generate_certificate'

        APPROVE = 'recolecciones.approve'
        REJECT = 'recolecciones.reject'
        CANCEL = 'recolecciones.cancel'

    # ==================== PROGRAMACIONES ====================
    class PROGRAMACIONES:
        MODULE = 'programaciones'

        VIEW_LIST = 'programaciones.view_list'
        VIEW_DETAIL = 'programaciones.view_detail'
        VIEW_CALENDAR = 'programaciones.view_calendar'

        CREATE = 'programaciones.create'
        UPDATE = 'programaciones.update'
        DELETE = 'programaciones.delete'

        ASSIGN_COLLECTOR = 'programaciones.assign_collector'
        CHANGE_STATE = 'programaciones.change_state'
        REPROGRAM = 'programaciones.reprogram'
        CONFIRM = 'programaciones.confirm'
        START_ROUTE = 'programaciones.start_route'
        COMPLETE = 'programaciones.complete'

    # ==================== PROVEEDORES ====================
    class PROVEEDORES:
        MODULE = 'proveedores'

        VIEW_LIST = 'proveedores.view_list'
        VIEW_DETAIL = 'proveedores.view_detail'

        CREATE = 'proveedores.create'
        UPDATE = 'proveedores.update'
        DELETE = 'proveedores.delete'

        MANAGE_PRICES = 'proveedores.manage_prices'
        VIEW_PRICE_HISTORY = 'proveedores.view_price_history'

    # ==================== ECOALIADOS ====================
    class ECOALIADOS:
        MODULE = 'ecoaliados'

        VIEW_LIST = 'ecoaliados.view_list'
        VIEW_DETAIL = 'ecoaliados.view_detail'

        CREATE = 'ecoaliados.create'
        UPDATE = 'ecoaliados.update'
        DELETE = 'ecoaliados.delete'

        MANAGE_PRICES = 'ecoaliados.manage_prices'
        VIEW_PRICE_HISTORY = 'ecoaliados.view_price_history'
        ASSIGN_COMMERCIAL = 'ecoaliados.assign_commercial'

    # ==================== RECEPCIONES ====================
    class RECEPCIONES:
        MODULE = 'recepciones'

        VIEW_LIST = 'recepciones.view_list'
        VIEW_DETAIL = 'recepciones.view_detail'

        CREATE = 'recepciones.create'
        UPDATE = 'recepciones.update'
        DELETE = 'recepciones.delete'

        INITIATE = 'recepciones.initiate'
        WEIGH = 'recepciones.weigh'
        CONFIRM = 'recepciones.confirm'
        CANCEL = 'recepciones.cancel'
        STANDBY = 'recepciones.standby'

    # ==================== CERTIFICADOS ====================
    class CERTIFICADOS:
        MODULE = 'certificados'

        VIEW_LIST = 'certificados.view_list'
        VIEW_DETAIL = 'certificados.view_detail'

        CREATE = 'certificados.create'
        DELETE = 'certificados.delete'
        GENERATE = 'certificados.generate'
        DOWNLOAD = 'certificados.download'

    # ==================== USUARIOS ====================
    class USERS:
        MODULE = 'users'

        VIEW_LIST = 'users.view_list'
        VIEW_DETAIL = 'users.view_detail'

        CREATE = 'users.create'
        UPDATE = 'users.update'
        DELETE = 'users.delete'

        ASSIGN_ROLES = 'users.assign_roles'
        ASSIGN_GROUPS = 'users.assign_groups'
        ASSIGN_CARGO = 'users.assign_cargo'
        MANAGE_PERMISSIONS = 'users.manage_permissions'

    # ==================== CONFIGURACION ====================
    class CONFIG:
        MODULE = 'config'

        VIEW_SETTINGS = 'config.view_settings'
        MANAGE_SETTINGS = 'config.manage_settings'

        MANAGE_ROLES = 'config.manage_roles'
        MANAGE_GROUPS = 'config.manage_groups'
        MANAGE_CARGOS = 'config.manage_cargos'
        MANAGE_PERMISSIONS = 'config.manage_permissions'

    # ==================== SST ====================
    class SST:
        MODULE = 'sst'

        VIEW_LIST = 'sst.view_list'
        VIEW_DETAIL = 'sst.view_detail'

        CREATE = 'sst.create'
        UPDATE = 'sst.update'
        DELETE = 'sst.delete'

        MANAGE_COPASST = 'sst.manage_copasst'
        MANAGE_EMERGENCIAS = 'sst.manage_emergencias'
        MANAGE_MEDICINA = 'sst.manage_medicina'


class CargoCodes:
    """Codigos de cargos (posiciones organizacionales)"""

    # Nivel 3 - Direccion
    GERENTE_GENERAL = 'gerente_general'
    GERENTE = 'gerente'
    ADMIN = 'admin'

    # Nivel 2 - Coordinacion
    LIDER_COMERCIAL = 'lider_comercial'
    LIDER_COMPRAS = 'lider_compras'
    LIDER_COMERCIAL_ECONORTE = 'lider_com_econorte'
    LIDER_LOGISTICA_ECONORTE = 'lider_log_econorte'
    LIDER_CALIDAD = 'lider_calidad'
    LIDER_SST = 'lider_sst'
    LIDER_TALENTO_HUMANO = 'lider_talento_humano'
    CONTADOR = 'contador'
    JEFE_PLANTA = 'jefe_planta'

    # Nivel 1 - Supervision
    COMERCIAL_ECONORTE = 'comercial_econorte'
    COORDINADOR_RECOLECCION = 'coordinador_recoleccion'
    OPERADOR_BASCULA = 'operador_bascula'
    SUPERVISOR_PLANTA = 'supervisor_planta'
    PROFESIONAL_SST = 'profesional_sst'
    PROFESIONAL_CALIDAD = 'profesional_calidad'
    PROFESIONAL_AMBIENTAL = 'profesional_ambiental'

    # Nivel 0 - Operativo
    RECOLECTOR_ECONORTE = 'recolector_econorte'
    AUXILIAR_OPERACIONES = 'auxiliar_operaciones'


class RoleCodes:
    """Codigos de roles funcionales (un usuario puede tener multiples)"""

    # Roles administrativos
    SUPERADMIN = 'superadmin'
    ADMIN_SISTEMA = 'admin_sistema'

    # Roles de aprobacion
    APROBADOR_RECOLECCIONES = 'aprobador_recolecciones'
    APROBADOR_RECEPCIONES = 'aprobador_recepciones'
    APROBADOR_COMPRAS = 'aprobador_compras'

    # Roles operativos
    GESTOR_PROGRAMACIONES = 'gestor_programaciones'
    GESTOR_PROVEEDORES = 'gestor_proveedores'
    GESTOR_ECOALIADOS = 'gestor_ecoaliados'

    # Roles de consulta
    VISUALIZADOR = 'visualizador'
    REPORTEADOR = 'reporteador'


class GroupCodes:
    """Codigos de grupos/equipos"""

    EQUIPO_RECOLECCIONES = 'equipo_recolecciones'
    EQUIPO_COMPRAS = 'equipo_compras'
    EQUIPO_CALIDAD = 'equipo_calidad'
    EQUIPO_OPERACIONES = 'equipo_operaciones'
    EQUIPO_ADMINISTRACION = 'equipo_administracion'
    EQUIPO_SST = 'equipo_sst'


# ==================== DEFINICIONES COMPLETAS ====================

PERMISSIONS_DEFINITIONS = [
    # Recolecciones
    {'code': PermissionCodes.RECOLECCIONES.VIEW_LIST, 'name': 'Ver lista de recolecciones', 'module': 'RECOLECCIONES', 'action': 'VIEW', 'scope': 'ALL'},
    {'code': PermissionCodes.RECOLECCIONES.VIEW_DETAIL, 'name': 'Ver detalle de recoleccion', 'module': 'RECOLECCIONES', 'action': 'VIEW', 'scope': 'ALL'},
    {'code': PermissionCodes.RECOLECCIONES.VIEW_VOUCHER, 'name': 'Ver comprobante', 'module': 'RECOLECCIONES', 'action': 'VIEW', 'scope': 'ALL'},
    {'code': PermissionCodes.RECOLECCIONES.VIEW_CERTIFICADO, 'name': 'Ver certificado', 'module': 'RECOLECCIONES', 'action': 'VIEW', 'scope': 'ALL'},
    {'code': PermissionCodes.RECOLECCIONES.CREATE, 'name': 'Crear recoleccion', 'module': 'RECOLECCIONES', 'action': 'CREATE', 'scope': 'ALL'},
    {'code': PermissionCodes.RECOLECCIONES.UPDATE, 'name': 'Editar recoleccion', 'module': 'RECOLECCIONES', 'action': 'EDIT', 'scope': 'ALL'},
    {'code': PermissionCodes.RECOLECCIONES.DELETE, 'name': 'Eliminar recoleccion', 'module': 'RECOLECCIONES', 'action': 'DELETE', 'scope': 'ALL'},
    {'code': PermissionCodes.RECOLECCIONES.REGISTER, 'name': 'Registrar recoleccion', 'module': 'RECOLECCIONES', 'action': 'CREATE', 'scope': 'OWN'},
    {'code': PermissionCodes.RECOLECCIONES.GENERATE_VOUCHER, 'name': 'Generar comprobante', 'module': 'RECOLECCIONES', 'action': 'CREATE', 'scope': 'ALL'},
    {'code': PermissionCodes.RECOLECCIONES.GENERATE_CERTIFICATE, 'name': 'Generar certificado', 'module': 'RECOLECCIONES', 'action': 'CREATE', 'scope': 'ALL'},
    {'code': PermissionCodes.RECOLECCIONES.APPROVE, 'name': 'Aprobar recoleccion', 'module': 'RECOLECCIONES', 'action': 'APPROVE', 'scope': 'ALL'},
    {'code': PermissionCodes.RECOLECCIONES.REJECT, 'name': 'Rechazar recoleccion', 'module': 'RECOLECCIONES', 'action': 'APPROVE', 'scope': 'ALL'},
    {'code': PermissionCodes.RECOLECCIONES.CANCEL, 'name': 'Cancelar recoleccion', 'module': 'RECOLECCIONES', 'action': 'EDIT', 'scope': 'ALL'},

    # Programaciones
    {'code': PermissionCodes.PROGRAMACIONES.VIEW_LIST, 'name': 'Ver lista de programaciones', 'module': 'PROGRAMACIONES', 'action': 'VIEW', 'scope': 'ALL'},
    {'code': PermissionCodes.PROGRAMACIONES.VIEW_DETAIL, 'name': 'Ver detalle de programacion', 'module': 'PROGRAMACIONES', 'action': 'VIEW', 'scope': 'ALL'},
    {'code': PermissionCodes.PROGRAMACIONES.VIEW_CALENDAR, 'name': 'Ver calendario', 'module': 'PROGRAMACIONES', 'action': 'VIEW', 'scope': 'ALL'},
    {'code': PermissionCodes.PROGRAMACIONES.CREATE, 'name': 'Crear programacion', 'module': 'PROGRAMACIONES', 'action': 'CREATE', 'scope': 'ALL'},
    {'code': PermissionCodes.PROGRAMACIONES.UPDATE, 'name': 'Editar programacion', 'module': 'PROGRAMACIONES', 'action': 'EDIT', 'scope': 'ALL'},
    {'code': PermissionCodes.PROGRAMACIONES.DELETE, 'name': 'Eliminar programacion', 'module': 'PROGRAMACIONES', 'action': 'DELETE', 'scope': 'ALL'},
    {'code': PermissionCodes.PROGRAMACIONES.ASSIGN_COLLECTOR, 'name': 'Asignar recolector', 'module': 'PROGRAMACIONES', 'action': 'EDIT', 'scope': 'ALL'},
    {'code': PermissionCodes.PROGRAMACIONES.CHANGE_STATE, 'name': 'Cambiar estado', 'module': 'PROGRAMACIONES', 'action': 'EDIT', 'scope': 'ALL'},
    {'code': PermissionCodes.PROGRAMACIONES.REPROGRAM, 'name': 'Reprogramar', 'module': 'PROGRAMACIONES', 'action': 'EDIT', 'scope': 'ALL'},
    {'code': PermissionCodes.PROGRAMACIONES.CONFIRM, 'name': 'Confirmar programacion', 'module': 'PROGRAMACIONES', 'action': 'EDIT', 'scope': 'OWN'},
    {'code': PermissionCodes.PROGRAMACIONES.START_ROUTE, 'name': 'Iniciar ruta', 'module': 'PROGRAMACIONES', 'action': 'EDIT', 'scope': 'OWN'},
    {'code': PermissionCodes.PROGRAMACIONES.COMPLETE, 'name': 'Completar programacion', 'module': 'PROGRAMACIONES', 'action': 'EDIT', 'scope': 'OWN'},

    # Proveedores
    {'code': PermissionCodes.PROVEEDORES.VIEW_LIST, 'name': 'Ver lista de proveedores', 'module': 'PROVEEDORES', 'action': 'VIEW', 'scope': 'ALL'},
    {'code': PermissionCodes.PROVEEDORES.VIEW_DETAIL, 'name': 'Ver detalle de proveedor', 'module': 'PROVEEDORES', 'action': 'VIEW', 'scope': 'ALL'},
    {'code': PermissionCodes.PROVEEDORES.CREATE, 'name': 'Crear proveedor', 'module': 'PROVEEDORES', 'action': 'CREATE', 'scope': 'ALL'},
    {'code': PermissionCodes.PROVEEDORES.UPDATE, 'name': 'Editar proveedor', 'module': 'PROVEEDORES', 'action': 'EDIT', 'scope': 'ALL'},
    {'code': PermissionCodes.PROVEEDORES.DELETE, 'name': 'Eliminar proveedor', 'module': 'PROVEEDORES', 'action': 'DELETE', 'scope': 'ALL'},
    {'code': PermissionCodes.PROVEEDORES.MANAGE_PRICES, 'name': 'Gestionar precios', 'module': 'PROVEEDORES', 'action': 'MANAGE', 'scope': 'ALL'},
    {'code': PermissionCodes.PROVEEDORES.VIEW_PRICE_HISTORY, 'name': 'Ver historial de precios', 'module': 'PROVEEDORES', 'action': 'VIEW', 'scope': 'ALL'},

    # Ecoaliados
    {'code': PermissionCodes.ECOALIADOS.VIEW_LIST, 'name': 'Ver lista de ecoaliados', 'module': 'ECOALIADOS', 'action': 'VIEW', 'scope': 'ALL'},
    {'code': PermissionCodes.ECOALIADOS.VIEW_DETAIL, 'name': 'Ver detalle de ecoaliado', 'module': 'ECOALIADOS', 'action': 'VIEW', 'scope': 'ALL'},
    {'code': PermissionCodes.ECOALIADOS.CREATE, 'name': 'Crear ecoaliado', 'module': 'ECOALIADOS', 'action': 'CREATE', 'scope': 'ALL'},
    {'code': PermissionCodes.ECOALIADOS.UPDATE, 'name': 'Editar ecoaliado', 'module': 'ECOALIADOS', 'action': 'EDIT', 'scope': 'ALL'},
    {'code': PermissionCodes.ECOALIADOS.DELETE, 'name': 'Eliminar ecoaliado', 'module': 'ECOALIADOS', 'action': 'DELETE', 'scope': 'ALL'},
    {'code': PermissionCodes.ECOALIADOS.MANAGE_PRICES, 'name': 'Gestionar precios ecoaliados', 'module': 'ECOALIADOS', 'action': 'MANAGE', 'scope': 'ALL'},
    {'code': PermissionCodes.ECOALIADOS.VIEW_PRICE_HISTORY, 'name': 'Ver historial precios ecoaliados', 'module': 'ECOALIADOS', 'action': 'VIEW', 'scope': 'ALL'},
    {'code': PermissionCodes.ECOALIADOS.ASSIGN_COMMERCIAL, 'name': 'Asignar comercial', 'module': 'ECOALIADOS', 'action': 'EDIT', 'scope': 'ALL'},

    # Recepciones
    {'code': PermissionCodes.RECEPCIONES.VIEW_LIST, 'name': 'Ver lista de recepciones', 'module': 'RECEPCIONES', 'action': 'VIEW', 'scope': 'ALL'},
    {'code': PermissionCodes.RECEPCIONES.VIEW_DETAIL, 'name': 'Ver detalle de recepcion', 'module': 'RECEPCIONES', 'action': 'VIEW', 'scope': 'ALL'},
    {'code': PermissionCodes.RECEPCIONES.CREATE, 'name': 'Crear recepcion', 'module': 'RECEPCIONES', 'action': 'CREATE', 'scope': 'ALL'},
    {'code': PermissionCodes.RECEPCIONES.UPDATE, 'name': 'Editar recepcion', 'module': 'RECEPCIONES', 'action': 'EDIT', 'scope': 'ALL'},
    {'code': PermissionCodes.RECEPCIONES.DELETE, 'name': 'Eliminar recepcion', 'module': 'RECEPCIONES', 'action': 'DELETE', 'scope': 'ALL'},
    {'code': PermissionCodes.RECEPCIONES.INITIATE, 'name': 'Iniciar recepcion', 'module': 'RECEPCIONES', 'action': 'CREATE', 'scope': 'ALL'},
    {'code': PermissionCodes.RECEPCIONES.WEIGH, 'name': 'Pesar recepcion', 'module': 'RECEPCIONES', 'action': 'EDIT', 'scope': 'ALL'},
    {'code': PermissionCodes.RECEPCIONES.CONFIRM, 'name': 'Confirmar recepcion', 'module': 'RECEPCIONES', 'action': 'APPROVE', 'scope': 'ALL'},
    {'code': PermissionCodes.RECEPCIONES.CANCEL, 'name': 'Cancelar recepcion', 'module': 'RECEPCIONES', 'action': 'EDIT', 'scope': 'ALL'},
    {'code': PermissionCodes.RECEPCIONES.STANDBY, 'name': 'Pasar a standby', 'module': 'RECEPCIONES', 'action': 'EDIT', 'scope': 'ALL'},

    # Certificados
    {'code': PermissionCodes.CERTIFICADOS.VIEW_LIST, 'name': 'Ver lista de certificados', 'module': 'CERTIFICADOS', 'action': 'VIEW', 'scope': 'ALL'},
    {'code': PermissionCodes.CERTIFICADOS.VIEW_DETAIL, 'name': 'Ver detalle de certificado', 'module': 'CERTIFICADOS', 'action': 'VIEW', 'scope': 'ALL'},
    {'code': PermissionCodes.CERTIFICADOS.CREATE, 'name': 'Crear certificado', 'module': 'CERTIFICADOS', 'action': 'CREATE', 'scope': 'ALL'},
    {'code': PermissionCodes.CERTIFICADOS.DELETE, 'name': 'Eliminar certificado', 'module': 'CERTIFICADOS', 'action': 'DELETE', 'scope': 'ALL'},
    {'code': PermissionCodes.CERTIFICADOS.GENERATE, 'name': 'Generar certificado', 'module': 'CERTIFICADOS', 'action': 'CREATE', 'scope': 'ALL'},
    {'code': PermissionCodes.CERTIFICADOS.DOWNLOAD, 'name': 'Descargar certificado', 'module': 'CERTIFICADOS', 'action': 'EXPORT', 'scope': 'ALL'},

    # Usuarios
    {'code': PermissionCodes.USERS.VIEW_LIST, 'name': 'Ver lista de usuarios', 'module': 'CORE', 'action': 'VIEW', 'scope': 'ALL'},
    {'code': PermissionCodes.USERS.VIEW_DETAIL, 'name': 'Ver detalle de usuario', 'module': 'CORE', 'action': 'VIEW', 'scope': 'ALL'},
    {'code': PermissionCodes.USERS.CREATE, 'name': 'Crear usuario', 'module': 'CORE', 'action': 'CREATE', 'scope': 'ALL'},
    {'code': PermissionCodes.USERS.UPDATE, 'name': 'Editar usuario', 'module': 'CORE', 'action': 'EDIT', 'scope': 'ALL'},
    {'code': PermissionCodes.USERS.DELETE, 'name': 'Eliminar usuario', 'module': 'CORE', 'action': 'DELETE', 'scope': 'ALL'},
    {'code': PermissionCodes.USERS.ASSIGN_ROLES, 'name': 'Asignar roles', 'module': 'CORE', 'action': 'MANAGE', 'scope': 'ALL'},
    {'code': PermissionCodes.USERS.ASSIGN_GROUPS, 'name': 'Asignar grupos', 'module': 'CORE', 'action': 'MANAGE', 'scope': 'ALL'},
    {'code': PermissionCodes.USERS.ASSIGN_CARGO, 'name': 'Asignar cargo', 'module': 'CORE', 'action': 'MANAGE', 'scope': 'ALL'},
    {'code': PermissionCodes.USERS.MANAGE_PERMISSIONS, 'name': 'Gestionar permisos', 'module': 'CORE', 'action': 'MANAGE', 'scope': 'ALL'},

    # Configuracion
    {'code': PermissionCodes.CONFIG.VIEW_SETTINGS, 'name': 'Ver configuracion', 'module': 'CORE', 'action': 'VIEW', 'scope': 'ALL'},
    {'code': PermissionCodes.CONFIG.MANAGE_SETTINGS, 'name': 'Gestionar configuracion', 'module': 'CORE', 'action': 'MANAGE', 'scope': 'ALL'},
    {'code': PermissionCodes.CONFIG.MANAGE_ROLES, 'name': 'Gestionar roles', 'module': 'CORE', 'action': 'MANAGE', 'scope': 'ALL'},
    {'code': PermissionCodes.CONFIG.MANAGE_GROUPS, 'name': 'Gestionar grupos', 'module': 'CORE', 'action': 'MANAGE', 'scope': 'ALL'},
    {'code': PermissionCodes.CONFIG.MANAGE_CARGOS, 'name': 'Gestionar cargos', 'module': 'CORE', 'action': 'MANAGE', 'scope': 'ALL'},
    {'code': PermissionCodes.CONFIG.MANAGE_PERMISSIONS, 'name': 'Gestionar permisos', 'module': 'CORE', 'action': 'MANAGE', 'scope': 'ALL'},

    # SST
    {'code': PermissionCodes.SST.VIEW_LIST, 'name': 'Ver lista SST', 'module': 'GESTION_INTEGRAL', 'action': 'VIEW', 'scope': 'ALL'},
    {'code': PermissionCodes.SST.VIEW_DETAIL, 'name': 'Ver detalle SST', 'module': 'GESTION_INTEGRAL', 'action': 'VIEW', 'scope': 'ALL'},
    {'code': PermissionCodes.SST.CREATE, 'name': 'Crear registro SST', 'module': 'GESTION_INTEGRAL', 'action': 'CREATE', 'scope': 'ALL'},
    {'code': PermissionCodes.SST.UPDATE, 'name': 'Editar registro SST', 'module': 'GESTION_INTEGRAL', 'action': 'EDIT', 'scope': 'ALL'},
    {'code': PermissionCodes.SST.DELETE, 'name': 'Eliminar registro SST', 'module': 'GESTION_INTEGRAL', 'action': 'DELETE', 'scope': 'ALL'},
    {'code': PermissionCodes.SST.MANAGE_COPASST, 'name': 'Gestionar COPASST', 'module': 'GESTION_INTEGRAL', 'action': 'MANAGE', 'scope': 'ALL'},
    {'code': PermissionCodes.SST.MANAGE_EMERGENCIAS, 'name': 'Gestionar emergencias', 'module': 'GESTION_INTEGRAL', 'action': 'MANAGE', 'scope': 'ALL'},
    {'code': PermissionCodes.SST.MANAGE_MEDICINA, 'name': 'Gestionar medicina laboral', 'module': 'GESTION_INTEGRAL', 'action': 'MANAGE', 'scope': 'ALL'},
]

CARGOS_DEFINITIONS = [
    # Nivel 3 - Direccion
    {'code': CargoCodes.GERENTE_GENERAL, 'name': 'Gerente General', 'level': 3},
    {'code': CargoCodes.GERENTE, 'name': 'Gerente', 'level': 3},
    {'code': CargoCodes.ADMIN, 'name': 'Administrador', 'level': 3},

    # Nivel 2 - Coordinacion
    {'code': CargoCodes.LIDER_COMERCIAL, 'name': 'Lider Comercial', 'level': 2},
    {'code': CargoCodes.LIDER_COMPRAS, 'name': 'Lider de Compras', 'level': 2},
    {'code': CargoCodes.LIDER_COMERCIAL_ECONORTE, 'name': 'Lider Comercial EcoNorte', 'level': 2},
    {'code': CargoCodes.LIDER_LOGISTICA_ECONORTE, 'name': 'Lider Logistica EcoNorte', 'level': 2},
    {'code': CargoCodes.LIDER_CALIDAD, 'name': 'Lider de Calidad', 'level': 2},
    {'code': CargoCodes.LIDER_SST, 'name': 'Lider SST', 'level': 2},
    {'code': CargoCodes.LIDER_TALENTO_HUMANO, 'name': 'Lider Talento Humano', 'level': 2},
    {'code': CargoCodes.CONTADOR, 'name': 'Contador', 'level': 2},
    {'code': CargoCodes.JEFE_PLANTA, 'name': 'Jefe de Planta', 'level': 2},

    # Nivel 1 - Supervision
    {'code': CargoCodes.COMERCIAL_ECONORTE, 'name': 'Comercial EcoNorte', 'level': 1},
    {'code': CargoCodes.COORDINADOR_RECOLECCION, 'name': 'Coordinador de Recoleccion', 'level': 1},
    {'code': CargoCodes.OPERADOR_BASCULA, 'name': 'Operador de Bascula', 'level': 1},
    {'code': CargoCodes.SUPERVISOR_PLANTA, 'name': 'Supervisor de Planta', 'level': 1},
    {'code': CargoCodes.PROFESIONAL_SST, 'name': 'Profesional SST', 'level': 1},
    {'code': CargoCodes.PROFESIONAL_CALIDAD, 'name': 'Profesional de Calidad', 'level': 1},
    {'code': CargoCodes.PROFESIONAL_AMBIENTAL, 'name': 'Profesional Ambiental', 'level': 1},

    # Nivel 0 - Operativo
    {'code': CargoCodes.RECOLECTOR_ECONORTE, 'name': 'Recolector EcoNorte', 'level': 0},
    {'code': CargoCodes.AUXILIAR_OPERACIONES, 'name': 'Auxiliar de Operaciones', 'level': 0},
]

ROLES_DEFINITIONS = [
    {'code': RoleCodes.SUPERADMIN, 'name': 'Super Administrador', 'description': 'Acceso total al sistema'},
    {'code': RoleCodes.ADMIN_SISTEMA, 'name': 'Administrador del Sistema', 'description': 'Administracion de configuracion'},
    {'code': RoleCodes.APROBADOR_RECOLECCIONES, 'name': 'Aprobador de Recolecciones', 'description': 'Aprueba recolecciones'},
    {'code': RoleCodes.APROBADOR_RECEPCIONES, 'name': 'Aprobador de Recepciones', 'description': 'Aprueba recepciones'},
    {'code': RoleCodes.APROBADOR_COMPRAS, 'name': 'Aprobador de Compras', 'description': 'Aprueba compras'},
    {'code': RoleCodes.GESTOR_PROGRAMACIONES, 'name': 'Gestor de Programaciones', 'description': 'Gestiona programaciones'},
    {'code': RoleCodes.GESTOR_PROVEEDORES, 'name': 'Gestor de Proveedores', 'description': 'Gestiona proveedores'},
    {'code': RoleCodes.GESTOR_ECOALIADOS, 'name': 'Gestor de EcoAliados', 'description': 'Gestiona ecoaliados'},
    {'code': RoleCodes.VISUALIZADOR, 'name': 'Visualizador', 'description': 'Solo lectura'},
    {'code': RoleCodes.REPORTEADOR, 'name': 'Generador de Reportes', 'description': 'Genera reportes'},
]

GROUPS_DEFINITIONS = [
    {'code': GroupCodes.EQUIPO_RECOLECCIONES, 'name': 'Equipo de Recolecciones'},
    {'code': GroupCodes.EQUIPO_COMPRAS, 'name': 'Equipo de Compras'},
    {'code': GroupCodes.EQUIPO_CALIDAD, 'name': 'Equipo de Calidad'},
    {'code': GroupCodes.EQUIPO_OPERACIONES, 'name': 'Equipo de Operaciones'},
    {'code': GroupCodes.EQUIPO_ADMINISTRACION, 'name': 'Equipo de Administracion'},
    {'code': GroupCodes.EQUIPO_SST, 'name': 'Equipo SST'},
]
