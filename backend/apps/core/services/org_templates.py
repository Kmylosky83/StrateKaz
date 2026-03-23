"""
Templates de Estructura Organizacional por Industria — StrateKaz SGI

Define plantillas predefinidas de áreas y cargos para industrias colombianas típicas.
Cada template contiene áreas (procesos ISO 9001) y cargos con jerarquía completa.

Usado por:
- Management command: seed_org_templates (listado/verificación)
- API endpoint: GET /api/core/org-templates/ (frontend consume)
- API endpoint: POST /api/core/org-templates/apply/ (aplicar al tenant)
"""

# ══════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════

TIPO_PROCESO_MAP = {
    'ESTRATEGICO': 'Estratégico',
    'MISIONAL': 'Misional',
    'APOYO': 'Apoyo',
    'EVALUACION': 'Evaluación',
}


def _area(code, name, description, tipo='APOYO', icon='Building2', color='purple'):
    """Helper para crear definición de área."""
    return {
        'code': code,
        'name': name,
        'description': description,
        'tipo': tipo,
        'icon': icon,
        'color': color,
    }


def _cargo(
    code, name, area_code, nivel='OPERATIVO', is_jefatura=False,
    parent_code=None, cantidad=1, is_externo=False, level=0,
):
    """Helper para crear definición de cargo."""
    # Mapear nivel_jerarquico a level legacy
    level_map = {'ESTRATEGICO': 3, 'TACTICO': 2, 'OPERATIVO': 0, 'APOYO': 1, 'EXTERNO': 0}
    return {
        'code': code,
        'name': name,
        'area': area_code,
        'nivel': nivel,
        'is_jefatura': is_jefatura,
        'parent': parent_code,
        'cantidad': cantidad,
        'is_externo': is_externo,
        'level': level_map.get(nivel, 0),
    }


# ══════════════════════════════════════════════════════════════════
# 1. MANUFACTURA / PRODUCCIÓN INDUSTRIAL
# ══════════════════════════════════════════════════════════════════

MANUFACTURA = {
    'code': 'manufactura',
    'name': 'Manufactura / Producción Industrial',
    'description': 'Estructura para empresas de manufactura, procesamiento y producción',
    'icon': 'Factory',
    'areas': [
        _area('DIR', 'Dirección General', 'Alta dirección y planeación estratégica', 'ESTRATEGICO', 'Crown', 'blue'),
        _area('PROD', 'Producción', 'Operaciones de manufactura y producción', 'MISIONAL', 'Cog', 'green'),
        _area('CAL', 'Calidad', 'Control y aseguramiento de calidad', 'EVALUACION', 'ShieldCheck', 'purple'),
        _area('SST', 'Seguridad y Salud en el Trabajo', 'Gestión SST conforme Decreto 1072 y Resolución 0312', 'APOYO', 'HardHat', 'red'),
        _area('LOG', 'Logística y Almacén', 'Almacenamiento, despacho y transporte', 'MISIONAL', 'Warehouse', 'amber'),
        _area('MANT', 'Mantenimiento', 'Mantenimiento preventivo y correctivo de equipos', 'APOYO', 'Wrench', 'gray'),
        _area('ADM', 'Administrativa y Financiera', 'Contabilidad, talento humano, compras', 'APOYO', 'Calculator', 'indigo'),
        _area('COM', 'Comercial', 'Ventas, mercadeo y servicio al cliente', 'MISIONAL', 'TrendingUp', 'emerald'),
    ],
    'cargos': [
        # Estratégico
        _cargo('GER_GENERAL', 'Gerente General', 'DIR', 'ESTRATEGICO', True),
        # Táctico
        _cargo('JEFE_PROD', 'Jefe de Producción', 'PROD', 'TACTICO', True, 'GER_GENERAL'),
        _cargo('SUP_PLANTA', 'Supervisor de Planta', 'PROD', 'TACTICO', True, 'JEFE_PROD'),
        _cargo('JEFE_CAL', 'Jefe de Calidad', 'CAL', 'TACTICO', True, 'GER_GENERAL'),
        _cargo('COORD_SST', 'Coordinador SST', 'SST', 'TACTICO', True, 'GER_GENERAL'),
        _cargo('JEFE_LOG', 'Jefe de Logística', 'LOG', 'TACTICO', True, 'GER_GENERAL'),
        _cargo('JEFE_MANT', 'Jefe de Mantenimiento', 'MANT', 'TACTICO', True, 'GER_GENERAL'),
        _cargo('DIR_ADMIN', 'Director Administrativo', 'ADM', 'TACTICO', True, 'GER_GENERAL'),
        _cargo('DIR_COM', 'Director Comercial', 'COM', 'TACTICO', True, 'GER_GENERAL'),
        # Operativo
        _cargo('OPERARIO', 'Operario de Producción', 'PROD', 'OPERATIVO', False, 'SUP_PLANTA', 10),
        _cargo('INSP_CAL', 'Inspector de Calidad', 'CAL', 'OPERATIVO', False, 'JEFE_CAL', 2),
        _cargo('ALMACENISTA', 'Almacenista', 'LOG', 'OPERATIVO', False, 'JEFE_LOG', 2),
        _cargo('TEC_MANT', 'Técnico de Mantenimiento', 'MANT', 'OPERATIVO', False, 'JEFE_MANT', 2),
        _cargo('CONTADOR', 'Contador', 'ADM', 'OPERATIVO', False, 'DIR_ADMIN'),
        _cargo('AUX_RRHH', 'Auxiliar de Recursos Humanos', 'ADM', 'OPERATIVO', False, 'DIR_ADMIN'),
        _cargo('VENDEDOR', 'Vendedor', 'COM', 'OPERATIVO', False, 'DIR_COM', 3),
    ],
}


# ══════════════════════════════════════════════════════════════════
# 2. SERVICIOS PROFESIONALES / CONSULTORÍA
# ══════════════════════════════════════════════════════════════════

SERVICIOS = {
    'code': 'servicios',
    'name': 'Servicios Profesionales / Consultoría',
    'description': 'Estructura para empresas de consultoría, asesorías y servicios profesionales',
    'icon': 'Briefcase',
    'areas': [
        _area('DIR', 'Dirección General', 'Alta dirección y planeación estratégica', 'ESTRATEGICO', 'Crown', 'blue'),
        _area('OPE', 'Operaciones y Proyectos', 'Ejecución de proyectos y prestación de servicios', 'MISIONAL', 'FolderKanban', 'green'),
        _area('COM', 'Comercial y Desarrollo de Negocios', 'Ventas, propuestas y relación con clientes', 'MISIONAL', 'TrendingUp', 'emerald'),
        _area('TH', 'Talento Humano', 'Selección, bienestar y desarrollo del personal', 'APOYO', 'Users', 'amber'),
        _area('ADM', 'Administrativa y Financiera', 'Contabilidad, tesorería y servicios generales', 'APOYO', 'Calculator', 'indigo'),
        _area('SST', 'Seguridad y Salud en el Trabajo', 'Gestión SST conforme Decreto 1072 y Resolución 0312', 'APOYO', 'HardHat', 'red'),
        _area('TI', 'Tecnología de la Información', 'Soporte TI, sistemas e infraestructura', 'APOYO', 'Monitor', 'gray'),
    ],
    'cargos': [
        # Estratégico
        _cargo('GER_GENERAL', 'Gerente General', 'DIR', 'ESTRATEGICO', True),
        # Táctico
        _cargo('DIR_PROY', 'Director de Proyectos', 'OPE', 'TACTICO', True, 'GER_GENERAL'),
        _cargo('DIR_COM', 'Director Comercial', 'COM', 'TACTICO', True, 'GER_GENERAL'),
        _cargo('COORD_TH', 'Coordinador de Talento Humano', 'TH', 'TACTICO', True, 'GER_GENERAL'),
        _cargo('DIR_ADMIN', 'Director Administrativo', 'ADM', 'TACTICO', True, 'GER_GENERAL'),
        _cargo('COORD_SST', 'Coordinador SST', 'SST', 'TACTICO', True, 'GER_GENERAL'),
        # Operativo
        _cargo('CONS_SR', 'Consultor Senior', 'OPE', 'OPERATIVO', False, 'DIR_PROY', 3),
        _cargo('CONS_JR', 'Consultor Junior', 'OPE', 'OPERATIVO', False, 'DIR_PROY', 4),
        _cargo('EJEC_COM', 'Ejecutivo Comercial', 'COM', 'OPERATIVO', False, 'DIR_COM', 2),
        _cargo('AUX_TH', 'Auxiliar de Talento Humano', 'TH', 'OPERATIVO', False, 'COORD_TH'),
        _cargo('CONTADOR', 'Contador', 'ADM', 'OPERATIVO', False, 'DIR_ADMIN'),
        _cargo('AUX_ADMIN', 'Auxiliar Administrativo', 'ADM', 'OPERATIVO', False, 'DIR_ADMIN'),
        _cargo('ING_TI', 'Ingeniero de Soporte TI', 'TI', 'OPERATIVO', False, 'GER_GENERAL'),
    ],
}


# ══════════════════════════════════════════════════════════════════
# 3. CONSTRUCCIÓN / OBRAS CIVILES
# ══════════════════════════════════════════════════════════════════

CONSTRUCCION = {
    'code': 'construccion',
    'name': 'Construcción / Obras Civiles',
    'description': 'Estructura para empresas de construcción, ingeniería civil y obras de infraestructura',
    'icon': 'HardHat',
    'areas': [
        _area('GER', 'Gerencia', 'Alta dirección y gestión estratégica', 'ESTRATEGICO', 'Crown', 'blue'),
        _area('ING', 'Ingeniería y Diseño', 'Diseño, cálculos y especificaciones técnicas', 'MISIONAL', 'Ruler', 'purple'),
        _area('OBRA', 'Obra y Ejecución', 'Ejecución de obras y proyectos en campo', 'MISIONAL', 'Hammer', 'green'),
        _area('SST', 'Seguridad y Salud en el Trabajo', 'Gestión SST en obra, Decreto 1072 y Resolución 0312', 'APOYO', 'HardHat', 'red'),
        _area('EQ', 'Equipos y Maquinaria', 'Gestión de maquinaria, vehículos y equipos pesados', 'APOYO', 'Truck', 'amber'),
        _area('ADM', 'Administrativa y Financiera', 'Contabilidad, RRHH y presupuesto', 'APOYO', 'Calculator', 'indigo'),
        _area('COMP', 'Compras y Almacén', 'Adquisición de materiales y suministros', 'APOYO', 'ShoppingCart', 'gray'),
    ],
    'cargos': [
        # Estratégico
        _cargo('GER_GENERAL', 'Gerente General', 'GER', 'ESTRATEGICO', True),
        # Táctico
        _cargo('DIR_OBRA', 'Director de Obra', 'OBRA', 'TACTICO', True, 'GER_GENERAL'),
        _cargo('RES_OBRA', 'Residente de Obra', 'OBRA', 'TACTICO', True, 'DIR_OBRA'),
        _cargo('ING_DISENO', 'Ingeniero de Diseño', 'ING', 'TACTICO', True, 'GER_GENERAL'),
        _cargo('COORD_SST', 'Coordinador SST', 'SST', 'TACTICO', True, 'GER_GENERAL'),
        _cargo('DIR_ADMIN', 'Director Administrativo', 'ADM', 'TACTICO', True, 'GER_GENERAL'),
        # Operativo
        _cargo('MAESTRO_OBRA', 'Maestro de Obra', 'OBRA', 'OPERATIVO', True, 'RES_OBRA', 2),
        _cargo('OFICIAL', 'Oficial de Construcción', 'OBRA', 'OPERATIVO', False, 'MAESTRO_OBRA', 5),
        _cargo('AYUDANTE', 'Ayudante de Obra', 'OBRA', 'OPERATIVO', False, 'MAESTRO_OBRA', 10),
        _cargo('OPER_MAQUINARIA', 'Operador de Maquinaria', 'EQ', 'OPERATIVO', False, 'DIR_OBRA', 3),
        _cargo('ALMACENISTA', 'Almacenista de Obra', 'COMP', 'OPERATIVO', False, 'DIR_ADMIN'),
        _cargo('CONTADOR', 'Contador', 'ADM', 'OPERATIVO', False, 'DIR_ADMIN'),
        _cargo('AUX_ADMIN', 'Auxiliar Administrativo', 'ADM', 'OPERATIVO', False, 'DIR_ADMIN'),
        _cargo('TOPOGRAFO', 'Topógrafo', 'ING', 'OPERATIVO', False, 'ING_DISENO', 2),
    ],
}


# ══════════════════════════════════════════════════════════════════
# 4. TRANSPORTE Y LOGÍSTICA
# ══════════════════════════════════════════════════════════════════

TRANSPORTE = {
    'code': 'transporte',
    'name': 'Transporte y Logística',
    'description': 'Estructura para empresas de transporte de carga, pasajeros y operadores logísticos',
    'icon': 'Truck',
    'areas': [
        _area('GER', 'Gerencia', 'Alta dirección y planeación estratégica', 'ESTRATEGICO', 'Crown', 'blue'),
        _area('OPE', 'Operaciones', 'Planificación y control de operaciones de transporte', 'MISIONAL', 'Route', 'green'),
        _area('FLOTA', 'Gestión de Flota', 'Mantenimiento y control de vehículos', 'APOYO', 'Truck', 'amber'),
        _area('DESP', 'Despacho y Distribución', 'Programación de rutas y entregas', 'MISIONAL', 'MapPin', 'emerald'),
        _area('SST', 'SST y PESV', 'Seguridad vial, Decreto 1072 y Plan Estratégico de Seguridad Vial', 'APOYO', 'HardHat', 'red'),
        _area('ADM', 'Administrativa y Financiera', 'Contabilidad, talento humano, cartera', 'APOYO', 'Calculator', 'indigo'),
        _area('COM', 'Comercial', 'Ventas, servicio al cliente y fidelización', 'MISIONAL', 'TrendingUp', 'purple'),
    ],
    'cargos': [
        # Estratégico
        _cargo('GER_GENERAL', 'Gerente General', 'GER', 'ESTRATEGICO', True),
        # Táctico
        _cargo('JEFE_OPE', 'Jefe de Operaciones', 'OPE', 'TACTICO', True, 'GER_GENERAL'),
        _cargo('COORD_FLOTA', 'Coordinador de Flota', 'FLOTA', 'TACTICO', True, 'JEFE_OPE'),
        _cargo('COORD_DESP', 'Coordinador de Despacho', 'DESP', 'TACTICO', True, 'JEFE_OPE'),
        _cargo('COORD_SST', 'Coordinador SST / PESV', 'SST', 'TACTICO', True, 'GER_GENERAL'),
        _cargo('DIR_ADMIN', 'Director Administrativo', 'ADM', 'TACTICO', True, 'GER_GENERAL'),
        _cargo('DIR_COM', 'Director Comercial', 'COM', 'TACTICO', True, 'GER_GENERAL'),
        # Operativo
        _cargo('DESPACHADOR', 'Despachador', 'DESP', 'OPERATIVO', False, 'COORD_DESP', 2),
        _cargo('CONDUCTOR', 'Conductor', 'OPE', 'OPERATIVO', False, 'JEFE_OPE', 15),
        _cargo('MECANICO', 'Mecánico', 'FLOTA', 'OPERATIVO', False, 'COORD_FLOTA', 2),
        _cargo('AUX_OPE', 'Auxiliar de Operaciones', 'OPE', 'OPERATIVO', False, 'JEFE_OPE', 3),
        _cargo('CONTADOR', 'Contador', 'ADM', 'OPERATIVO', False, 'DIR_ADMIN'),
        _cargo('AUX_ADMIN', 'Auxiliar Administrativo', 'ADM', 'OPERATIVO', False, 'DIR_ADMIN'),
        _cargo('EJEC_COM', 'Ejecutivo Comercial', 'COM', 'OPERATIVO', False, 'DIR_COM', 2),
    ],
}


# ══════════════════════════════════════════════════════════════════
# 5. COMERCIO / DISTRIBUCIÓN
# ══════════════════════════════════════════════════════════════════

COMERCIO = {
    'code': 'comercio',
    'name': 'Comercio / Distribución',
    'description': 'Estructura para empresas de comercio mayorista, minorista y distribución',
    'icon': 'ShoppingBag',
    'areas': [
        _area('GER', 'Gerencia', 'Alta dirección y planeación estratégica', 'ESTRATEGICO', 'Crown', 'blue'),
        _area('VEN', 'Ventas', 'Gestión comercial y fuerza de ventas', 'MISIONAL', 'TrendingUp', 'green'),
        _area('COMP', 'Compras', 'Adquisición de mercancía y negociación con proveedores', 'MISIONAL', 'ShoppingCart', 'emerald'),
        _area('ALM', 'Almacén y Bodega', 'Recepción, almacenamiento y despacho de mercancía', 'MISIONAL', 'Warehouse', 'amber'),
        _area('CONT', 'Contabilidad y Finanzas', 'Registros contables, tesorería y cartera', 'APOYO', 'Calculator', 'indigo'),
        _area('SST', 'Seguridad y Salud en el Trabajo', 'Gestión SST conforme Decreto 1072 y Resolución 0312', 'APOYO', 'HardHat', 'red'),
        _area('SAC', 'Servicio al Cliente', 'Atención posventa, PQR y fidelización', 'MISIONAL', 'Headphones', 'purple'),
    ],
    'cargos': [
        # Estratégico
        _cargo('GER_GENERAL', 'Gerente General', 'GER', 'ESTRATEGICO', True),
        # Táctico
        _cargo('JEFE_VEN', 'Jefe de Ventas', 'VEN', 'TACTICO', True, 'GER_GENERAL'),
        _cargo('JEFE_COMP', 'Jefe de Compras', 'COMP', 'TACTICO', True, 'GER_GENERAL'),
        _cargo('JEFE_ALM', 'Jefe de Almacén', 'ALM', 'TACTICO', True, 'GER_GENERAL'),
        _cargo('COORD_SST', 'Coordinador SST', 'SST', 'TACTICO', True, 'GER_GENERAL'),
        _cargo('COORD_SAC', 'Coordinador Servicio al Cliente', 'SAC', 'TACTICO', True, 'GER_GENERAL'),
        # Operativo
        _cargo('VENDEDOR', 'Vendedor', 'VEN', 'OPERATIVO', False, 'JEFE_VEN', 5),
        _cargo('AUX_COMP', 'Auxiliar de Compras', 'COMP', 'OPERATIVO', False, 'JEFE_COMP'),
        _cargo('AUX_ALM', 'Auxiliar de Almacén', 'ALM', 'OPERATIVO', False, 'JEFE_ALM', 3),
        _cargo('CONTADOR', 'Contador', 'CONT', 'OPERATIVO', False, 'GER_GENERAL'),
        _cargo('AUX_CONT', 'Auxiliar Contable', 'CONT', 'OPERATIVO', False, 'CONTADOR'),
        _cargo('CAJERO', 'Cajero', 'VEN', 'OPERATIVO', False, 'JEFE_VEN', 3),
        _cargo('ASESOR_SAC', 'Asesor de Servicio al Cliente', 'SAC', 'OPERATIVO', False, 'COORD_SAC', 2),
    ],
}


# ══════════════════════════════════════════════════════════════════
# REGISTRO GLOBAL
# ══════════════════════════════════════════════════════════════════

ORG_TEMPLATES = [
    MANUFACTURA,
    SERVICIOS,
    CONSTRUCCION,
    TRANSPORTE,
    COMERCIO,
]

ORG_TEMPLATES_MAP = {t['code']: t for t in ORG_TEMPLATES}


def get_all_templates():
    """Retorna todos los templates con conteos."""
    result = []
    for t in ORG_TEMPLATES:
        result.append({
            'code': t['code'],
            'name': t['name'],
            'description': t['description'],
            'icon': t['icon'],
            'areas_count': len(t['areas']),
            'cargos_count': len(t['cargos']),
            'areas': t['areas'],
            'cargos': t['cargos'],
        })
    return result


def get_template(code):
    """Retorna un template por su código o None."""
    return ORG_TEMPLATES_MAP.get(code)


def apply_template(template_code):
    """
    Aplica un template al tenant actual (debe ejecutarse dentro de schema_context).

    Retorna dict con resumen: areas_created, cargos_created, skipped.
    """
    from django.apps import apps

    Area = apps.get_model('organizacion', 'Area')
    Cargo = apps.get_model('core', 'Cargo')

    template = get_template(template_code)
    if not template:
        raise ValueError(f"Template '{template_code}' no encontrado")

    areas_created = 0
    cargos_created = 0
    skipped = 0

    # Paso 1: Crear áreas
    area_map = {}  # code -> Area instance
    for idx, area_def in enumerate(template['areas']):
        existing = Area.objects.filter(code=area_def['code']).first()
        if existing:
            area_map[area_def['code']] = existing
            skipped += 1
            continue

        area = Area.objects.create(
            code=area_def['code'],
            name=area_def['name'],
            description=area_def['description'],
            tipo=area_def['tipo'],
            icon=area_def.get('icon', 'Building2'),
            color=area_def.get('color', 'purple'),
            orden=idx + 1,
        )
        area_map[area_def['code']] = area
        areas_created += 1

    # Paso 2: Crear cargos (dos pasadas para resolver parent_cargo)
    cargo_map = {}  # code -> Cargo instance

    # Primero recoger cargos existentes
    for cargo_def in template['cargos']:
        existing = Cargo.objects.filter(code=cargo_def['code']).first()
        if existing:
            cargo_map[cargo_def['code']] = existing

    # Crear cargos en orden (padres primero por diseño del template)
    for cargo_def in template['cargos']:
        if cargo_def['code'] in cargo_map:
            skipped += 1
            continue

        area_instance = area_map.get(cargo_def['area'])
        parent_instance = cargo_map.get(cargo_def['parent']) if cargo_def['parent'] else None

        cargo = Cargo.objects.create(
            code=cargo_def['code'],
            name=cargo_def['name'],
            area=area_instance,
            nivel_jerarquico=cargo_def['nivel'],
            level=cargo_def.get('level', 0),
            is_jefatura=cargo_def['is_jefatura'],
            is_externo=cargo_def.get('is_externo', False),
            parent_cargo=parent_instance,
            cantidad_posiciones=cargo_def.get('cantidad', 1),
        )
        cargo_map[cargo_def['code']] = cargo
        cargos_created += 1

    return {
        'areas_created': areas_created,
        'cargos_created': cargos_created,
        'skipped': skipped,
        'template_name': template['name'],
    }
