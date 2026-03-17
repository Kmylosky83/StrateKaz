"""
Management command MAESTRO para configurar los 19 módulos del ERP StrateKaz
según la Arquitectura Cascada V2 (14 niveles + infraestructura).

CASCADA V2 — PHVA:
    PLANEAR:
        10. Fundación
        15. Gestión Documental
        18. Flujos de Trabajo
        20. Mi Equipo
        25. Planificación Operativa
        30. Planeación Estratégica
    HACER:
        35. Protección y Cumplimiento
        40. Gestión Integral (HSEQ)
        50-53. Cadena de Valor (supply, production, logistics, sales)
        60. Gestión del Talento
        70-72. Soporte (administración, tesorería, contabilidad)
    VERIFICAR:
        80. Inteligencia (Analytics)
        85. Revisión por la Dirección
    ACTUAR:
        90. Acciones de Mejora
    INFRAESTRUCTURA:
        95. Centro de Control (logs, alertas, notificaciones)

Fuente de verdad: docs/01-arquitectura/ARQUITECTURA-CASCADA-V2.md

Uso:
    docker exec -it backend python manage.py seed_estructura_final
"""
import copy

from django.core.management.base import BaseCommand
from django_tenants.utils import schema_context

from apps.core.models import SystemModule, ModuleTab, TabSection


class Command(BaseCommand):
    help = 'Configura los 19 módulos del ERP según Arquitectura Cascada V2'

    def handle(self, *args, **options):
        self.stdout.write('=' * 80)
        self.stdout.write(self.style.MIGRATE_HEADING(
            '  SEED ESTRUCTURA FINAL - CASCADA V2'
        ))
        self.stdout.write(self.style.MIGRATE_HEADING(
            '  19 Módulos | PHVA | 14 Niveles + Infraestructura'
        ))
        self.stdout.write('=' * 80)

        # PASO 0: Actualizar Tenant.enabled_modules en schema PUBLIC
        self._update_tenant_enabled_modules()

        # PASO 1+2: Iterar TODOS los tenants (SystemModule es tabla TENANT)
        from apps.tenant.models import Tenant
        with schema_context('public'):
            tenants = list(Tenant.objects.exclude(schema_name='public'))

        if not tenants:
            self.stdout.write(self.style.WARNING(
                '\n  [WARN] No hay tenants activos. Nada que configurar.'
            ))
            return

        for tenant in tenants:
            self.stdout.write('\n' + '=' * 80)
            self.stdout.write(self.style.MIGRATE_HEADING(
                f'  TENANT: {tenant.schema_name}'
            ))
            self.stdout.write('=' * 80)

            with schema_context(tenant.schema_name):
                self._seed_for_current_tenant()

    def _seed_for_current_tenant(self):
        """Ejecuta el seed completo dentro del schema del tenant actual."""
        # PASO 1: Migrar módulos V1 → V2
        self._migrate_v1_to_v2()

        # PASO 2: Configurar todos los módulos V2
        modules_config = self.get_modules_config()

        total_modules = 0
        total_tabs = 0
        total_sections = 0
        deleted_sections = 0
        deleted_tabs = 0

        for module_data in modules_config:
            # deep copy para no mutar la config original entre tenants
            module_data = copy.deepcopy(module_data)
            module_code = module_data['code']
            tabs = module_data.pop('tabs', [])
            module = self.create_or_update_module(module_data)
            total_modules += 1

            # Guardar códigos de tabs válidos para este módulo
            valid_tab_codes = [t['code'] for t in tabs]

            for tab_data in tabs:
                tab_code = tab_data['code']
                sections = tab_data.pop('sections', [])
                tab = self.create_or_update_tab(module, tab_data)
                total_tabs += 1

                # Crear secciones del tab
                for section_data in sections:
                    self.create_or_update_section(tab, section_data)
                    total_sections += 1

                # Eliminar secciones que ya no están en la configuración
                deleted_count = self.cleanup_obsolete_sections(tab, [s['code'] for s in sections])
                deleted_sections += deleted_count

            # Eliminar tabs que ya no están en la configuración del módulo
            deleted_tabs_count = self.cleanup_obsolete_tabs(module, valid_tab_codes)
            deleted_tabs += deleted_tabs_count

        # PASO 3: Eliminar módulos obsoletos V1
        self._cleanup_obsolete_modules()

        self.print_summary(total_modules, total_tabs, total_sections, deleted_sections, deleted_tabs)

    # =========================================================================
    # MIGRACIÓN V1 → V2
    # =========================================================================

    def _migrate_v1_to_v2(self):
        """
        Migra estructura V1 a V2. Usa UPDATE de FK (no delete+create)
        para preservar TabSection IDs → CargoSectionAccess intacto.
        """
        self.stdout.write(self.style.MIGRATE_HEADING(
            '\n  MIGRACIÓN V1 → V2'
        ))

        # 1. Migrar gestion_estrategica → fundacion + planeacion_estrategica + revision_direccion
        self._migrate_gestion_estrategica()

        # 2. Migrar sistema_gestion → gestion_documental + planificacion_operativa + acciones_mejora
        self._migrate_sistema_gestion()

        # 3. Migrar motor_cumplimiento + motor_riesgos → proteccion_cumplimiento
        self._migrate_proteccion_cumplimiento()

        # 4. Migrar hseq_management → gestion_integral
        self._migrate_hseq()

        # 5. Migrar talent_hub → mi_equipo + talent_hub (reducido)
        self._migrate_talent_hub()

        # 6. Migrar admin_finance → administracion + tesoreria
        self._migrate_admin_finance()

    def _migrate_gestion_estrategica(self):
        """gestion_estrategica → fundacion + planeacion_estrategica + revision_direccion"""
        try:
            old_module = SystemModule.objects.get(code='gestion_estrategica')
        except SystemModule.DoesNotExist:
            return

        self.stdout.write('  Migrando gestion_estrategica...')

        TAB_MIGRATION = {
            'configuracion': 'fundacion',
            'organizacion': 'fundacion',
            'identidad': 'fundacion',
            'mi_empresa': 'fundacion',
            'sistema_gestion': 'fundacion',
            'contexto': 'planeacion_estrategica',
            'planeacion': 'planeacion_estrategica',
            'riesgos_oportunidades': 'planeacion_estrategica',
            'gestion_proyectos': 'planeacion_estrategica',
            'revision_direccion': 'revision_direccion',
        }

        for tab in ModuleTab.objects.filter(module=old_module):
            target_code = TAB_MIGRATION.get(tab.code)
            if target_code:
                target_module, _ = SystemModule.objects.get_or_create(
                    code=target_code,
                    defaults={'name': target_code, 'orden': 0, 'is_enabled': True}
                )
                tab.module = target_module
                tab.save(update_fields=['module'])
                self.stdout.write(self.style.SUCCESS(
                    f'    [MIGRADO] Tab "{tab.code}" → {target_code}'
                ))

        remaining = ModuleTab.objects.filter(module=old_module).count()
        if remaining == 0:
            old_module.delete()
            self.stdout.write(self.style.SUCCESS('    [OK] gestion_estrategica eliminado'))
        else:
            self.stdout.write(self.style.WARNING(
                f'    [WARN] gestion_estrategica aún tiene {remaining} tabs'
            ))

    def _migrate_sistema_gestion(self):
        """sistema_gestion → tabs se redistribuyen a nuevos módulos"""
        try:
            old_module = SystemModule.objects.get(code='sistema_gestion')
        except SystemModule.DoesNotExist:
            return

        self.stdout.write('  Migrando sistema_gestion...')

        TAB_MIGRATION = {
            'gestion_documental': 'gestion_documental',
            'planificacion_sistema': 'planificacion_operativa',
            'auditorias_internas': 'gestion_documental',  # queda con documental temporalmente
            'acciones_mejora': 'acciones_mejora',
        }

        for tab in ModuleTab.objects.filter(module=old_module):
            target_code = TAB_MIGRATION.get(tab.code)
            if target_code:
                target_module, _ = SystemModule.objects.get_or_create(
                    code=target_code,
                    defaults={'name': target_code, 'orden': 0, 'is_enabled': True}
                )
                tab.module = target_module
                tab.save(update_fields=['module'])
                self.stdout.write(self.style.SUCCESS(
                    f'    [MIGRADO] Tab "{tab.code}" → {target_code}'
                ))

        remaining = ModuleTab.objects.filter(module=old_module).count()
        if remaining == 0:
            old_module.delete()
            self.stdout.write(self.style.SUCCESS('    [OK] sistema_gestion eliminado'))
        else:
            self.stdout.write(self.style.WARNING(
                f'    [WARN] sistema_gestion aún tiene {remaining} tabs'
            ))

    def _migrate_proteccion_cumplimiento(self):
        """motor_cumplimiento + motor_riesgos → proteccion_cumplimiento"""
        target_module, _ = SystemModule.objects.get_or_create(
            code='proteccion_cumplimiento',
            defaults={'name': 'Protección y Cumplimiento', 'orden': 35, 'is_enabled': True}
        )

        for old_code in ['motor_cumplimiento', 'motor_riesgos']:
            try:
                old_module = SystemModule.objects.get(code=old_code)
            except SystemModule.DoesNotExist:
                continue

            self.stdout.write(f'  Migrando {old_code}...')
            for tab in ModuleTab.objects.filter(module=old_module):
                tab.module = target_module
                tab.save(update_fields=['module'])
                self.stdout.write(self.style.SUCCESS(
                    f'    [MIGRADO] Tab "{tab.code}" → proteccion_cumplimiento'
                ))

            remaining = ModuleTab.objects.filter(module=old_module).count()
            if remaining == 0:
                old_module.delete()
                self.stdout.write(self.style.SUCCESS(f'    [OK] {old_code} eliminado'))
            else:
                self.stdout.write(self.style.WARNING(
                    f'    [WARN] {old_code} tiene {remaining} tabs sin migrar, no se elimina'
                ))

    def _migrate_hseq(self):
        """hseq_management → gestion_integral (rename)"""
        try:
            old_module = SystemModule.objects.get(code='hseq_management')
        except SystemModule.DoesNotExist:
            return

        self.stdout.write('  Renombrando hseq_management → gestion_integral...')

        # Si ya existe gestion_integral, mover tabs
        try:
            new_module = SystemModule.objects.get(code='gestion_integral')
            for tab in ModuleTab.objects.filter(module=old_module):
                tab.module = new_module
                tab.save(update_fields=['module'])
            old_module.delete()
        except SystemModule.DoesNotExist:
            # Renombrar directamente
            old_module.code = 'gestion_integral'
            old_module.save(update_fields=['code'])

        self.stdout.write(self.style.SUCCESS('    [OK] hseq_management → gestion_integral'))

    def _migrate_talent_hub(self):
        """talent_hub → mi_equipo (vinculación) + talent_hub (gestión continua)"""
        try:
            old_module = SystemModule.objects.get(code='talent_hub')
        except SystemModule.DoesNotExist:
            return

        # Tabs que se mueven a mi_equipo
        MI_EQUIPO_TABS = {'perfiles_cargo', 'seleccion_contratacion', 'colaboradores', 'onboarding_induccion'}

        mi_equipo_tabs = ModuleTab.objects.filter(module=old_module, code__in=MI_EQUIPO_TABS)
        if mi_equipo_tabs.exists():
            self.stdout.write('  Extrayendo tabs de talent_hub → mi_equipo...')
            target_module, _ = SystemModule.objects.get_or_create(
                code='mi_equipo',
                defaults={'name': 'Mi Equipo', 'orden': 20, 'is_enabled': True}
            )
            for tab in mi_equipo_tabs:
                tab.module = target_module
                tab.save(update_fields=['module'])
                self.stdout.write(self.style.SUCCESS(
                    f'    [MIGRADO] Tab "{tab.code}" → mi_equipo'
                ))

    def _migrate_admin_finance(self):
        """admin_finance → administracion + tesoreria"""
        try:
            old_module = SystemModule.objects.get(code='admin_finance')
        except SystemModule.DoesNotExist:
            return

        self.stdout.write('  Migrando admin_finance...')

        TAB_MIGRATION = {
            'tesoreria': 'tesoreria',
            'presupuesto': 'administracion',
            'activos_fijos': 'administracion',
            'servicios_generales': 'administracion',
        }

        for tab in ModuleTab.objects.filter(module=old_module):
            target_code = TAB_MIGRATION.get(tab.code)
            if target_code:
                target_module, _ = SystemModule.objects.get_or_create(
                    code=target_code,
                    defaults={'name': target_code, 'orden': 0, 'is_enabled': True}
                )
                tab.module = target_module
                tab.save(update_fields=['module'])
                self.stdout.write(self.style.SUCCESS(
                    f'    [MIGRADO] Tab "{tab.code}" → {target_code}'
                ))

        remaining = ModuleTab.objects.filter(module=old_module).count()
        if remaining == 0:
            old_module.delete()
            self.stdout.write(self.style.SUCCESS('    [OK] admin_finance eliminado'))
        else:
            self.stdout.write(self.style.WARNING(
                f'    [WARN] admin_finance aún tiene {remaining} tabs'
            ))

    def _cleanup_obsolete_modules(self):
        """Eliminar módulos V1 que ya no existen en V2"""
        OBSOLETE_CODES = [
            'gestion_estrategica', 'sistema_gestion',
            'motor_cumplimiento', 'motor_riesgos',
            'hseq_management', 'admin_finance',
        ]
        for code in OBSOLETE_CODES:
            try:
                module = SystemModule.objects.get(code=code)
                tabs_count = module.tabs.count()
                if tabs_count == 0:
                    module.delete()
                    self.stdout.write(self.style.SUCCESS(
                        f'  [CLEANUP] Módulo obsoleto eliminado: {code}'
                    ))
                else:
                    self.stdout.write(self.style.WARNING(
                        f'  [SKIP] {code} aún tiene {tabs_count} tabs — no eliminado'
                    ))
            except SystemModule.DoesNotExist:
                pass

    # =========================================================================
    # MIGRACIÓN: Tenant.enabled_modules + Plan.features
    # =========================================================================

    def _update_tenant_enabled_modules(self):
        """
        Actualiza Tenant.enabled_modules y Plan.features para reemplazar
        códigos V1 por los nuevos códigos V2.
        """
        # Mapeo V1 → V2 (un código V1 se expande a N códigos V2)
        V1_TO_V2 = {
            'gestion_estrategica': ['fundacion', 'planeacion_estrategica', 'revision_direccion'],
            'sistema_gestion': ['gestion_documental', 'planificacion_operativa', 'acciones_mejora'],
            'motor_cumplimiento': ['proteccion_cumplimiento'],
            'motor_riesgos': ['proteccion_cumplimiento'],
            'hseq_management': ['gestion_integral'],
            'admin_finance': ['administracion', 'tesoreria'],
            'talent_hub': ['mi_equipo', 'talent_hub'],
        }

        with schema_context('public'):
            # Actualizar Tenant.enabled_modules
            try:
                from apps.tenant.models import Tenant
                for tenant in Tenant.objects.all():
                    modules = list(tenant.enabled_modules or [])
                    if not modules:
                        continue

                    changed = False
                    for old_code, new_codes in V1_TO_V2.items():
                        if old_code in modules:
                            modules.remove(old_code)
                            changed = True
                        for new_code in new_codes:
                            if new_code not in modules:
                                modules.append(new_code)
                                changed = True

                    if changed:
                        # Eliminar duplicados preservando orden
                        seen = set()
                        unique = []
                        for m in modules:
                            if m not in seen:
                                seen.add(m)
                                unique.append(m)
                        tenant.enabled_modules = unique
                        tenant.save(update_fields=['enabled_modules'])
                        self.stdout.write(self.style.SUCCESS(
                            f'  [TENANT] {tenant.schema_name}: enabled_modules actualizado '
                            f'({len(unique)} módulos)'
                        ))
            except Exception as e:
                self.stdout.write(self.style.WARNING(
                    f'  [WARN] No se pudo actualizar Tenant.enabled_modules: {e}'
                ))

            # Actualizar Plan.features
            try:
                from apps.tenant.models import Plan
                for plan in Plan.objects.all():
                    features = list(plan.features or [])
                    if not features:
                        continue

                    changed = False
                    for old_code, new_codes in V1_TO_V2.items():
                        if old_code in features:
                            features.remove(old_code)
                            changed = True
                        for new_code in new_codes:
                            if new_code not in features:
                                features.append(new_code)
                                changed = True

                    if changed:
                        seen = set()
                        unique = []
                        for f in features:
                            if f not in seen:
                                seen.add(f)
                                unique.append(f)
                        plan.features = unique
                        plan.save(update_fields=['features'])
                        self.stdout.write(self.style.SUCCESS(
                            f'  [PLAN] {plan.name}: features actualizado ({len(unique)} módulos)'
                        ))
            except Exception as e:
                self.stdout.write(self.style.WARNING(
                    f'  [WARN] No se pudo actualizar Plan.features: {e}'
                ))

    # =========================================================================
    # CONFIGURACIÓN DE 19 MÓDULOS V2
    # =========================================================================

    def get_modules_config(self):
        """Retorna la configuración completa de los 19 módulos (Cascada V2)"""
        return [
            # =================================================================
            # ═══ PLANEAR (P) — Constituir, documentar, vincular, planificar
            # =================================================================

            # ─── Nivel 1: FUNDACIÓN ──────────────────────────────────────
            {
                'code': 'fundacion',
                'name': 'Fundación',
                'description': 'Constitución de la empresa: quién soy, dónde estoy, cómo me organizo, qué reglas tengo',
                'category': 'STRATEGIC',
                'color': 'blue',
                'icon': 'Landmark',
                'route': '/fundacion',
                'is_core': True,
                'is_enabled': True,
                'orden': 10,
                'tabs': [
                    {
                        'code': 'mi_empresa',
                        'name': 'Mi Empresa',
                        'icon': 'Building2',
                        'route': 'mi-empresa',
                        'orden': 1,
                        'sections': [
                            {'code': 'empresa', 'name': 'Empresa', 'icon': 'Building2', 'orden': 1, 'description': 'Razón social, NIT, sector económico, actividad CIIU, datos de contacto, branding'},
                            {'code': 'sedes', 'name': 'Sedes y Unidades', 'icon': 'MapPin', 'orden': 2, 'description': 'Ubicaciones físicas + roles (unidad de negocio, centro de acopio, proveedor interno). Se consumen en Supply Chain, Contabilidad'},
                        ]
                    },
                    {
                        'code': 'contexto_identidad',
                        'name': 'Mi Contexto e Identidad',
                        'icon': 'Compass',
                        'route': 'contexto-identidad',
                        'orden': 2,
                        'sections': [
                            {'code': 'partes_interesadas', 'name': 'Partes Interesadas', 'icon': 'Users', 'orden': 1, 'description': 'Catálogo maestro de stakeholders: proveedores, clientes, colaboradores, entidades, comunidad'},
                            {'code': 'analisis_contexto', 'name': 'Análisis del Contexto', 'icon': 'Compass', 'orden': 2, 'description': 'Herramientas de diagnóstico: PCI, POAM, PESTEL, Porter'},
                            {'code': 'mision_vision', 'name': 'Misión y Visión', 'icon': 'Compass', 'orden': 3, 'description': 'Direccionamiento estratégico. Nace del análisis del contexto'},
                            {'code': 'valores', 'name': 'Valores', 'icon': 'Heart', 'orden': 4, 'description': 'Principios y valores corporativos'},
                            {'code': 'normas_iso', 'name': 'Normas', 'icon': 'Award', 'orden': 5, 'description': 'Normas ISO y sistemas de gestión aplicables (9001, 14001, 45001, 27001)'},
                            {'code': 'alcance_sig', 'name': 'Alcance del SIG', 'icon': 'Target', 'orden': 6, 'description': 'Cobertura geográfica, procesos incluidos y exclusiones del Sistema Integrado de Gestión'},
                        ]
                    },
                    {
                        'code': 'organizacion',
                        'name': 'Mi Organización',
                        'icon': 'Network',
                        'route': 'organizacion',
                        'orden': 3,
                        'sections': [
                            {'code': 'areas', 'name': 'Procesos', 'icon': 'FolderTree', 'orden': 1, 'description': 'Estructura jerárquica de áreas y procesos con objetivos, líder y tipo'},
                            {'code': 'cargos', 'name': 'Cargos', 'icon': 'Network', 'orden': 2, 'description': 'Gestión de cargos: manual de funciones, permisos, turno/jornada, EPP requerido, activos, documentos'},
                            {'code': 'mapa_procesos', 'name': 'Mapa de Procesos', 'icon': 'Grid3x3', 'orden': 3, 'description': 'Visualización interactiva de la estructura de procesos (estratégicos, misionales, apoyo)'},
                            {'code': 'caracterizaciones', 'name': 'Caracterizaciones', 'icon': 'ClipboardList', 'orden': 4, 'description': 'Ficha SIPOC por proceso: proveedores, entradas, actividades, salidas y clientes'},
                            {'code': 'organigrama', 'name': 'Organigrama', 'icon': 'GitBranch', 'orden': 5, 'description': 'Visualización interactiva de la jerarquía de cargos'},
                        ]
                    },
                    # Tab 4 "Políticas y Reglamentos" ELIMINADO — se gestiona
                    # desde Gestión Documental (Nivel 2) que tiene motor completo
                    # de estados, versionamiento y firma digital.
                ]
            },

            # ─── Nivel 2: GESTIÓN DOCUMENTAL ─────────────────────────────
            {
                'code': 'gestion_documental',
                'name': 'Gestión Documental',
                'description': 'Crear, aprobar, versionar y asignar documentos a cargos',
                'category': 'STRATEGIC',
                'color': 'indigo',
                'icon': 'FileText',
                'route': '/gestion-documental',
                'is_core': False,
                'is_enabled': True,
                'orden': 15,
                'tabs': [
                    {
                        'code': 'gestion_documental',
                        'name': 'Documentos',
                        'icon': 'FileText',
                        'route': 'documentos',
                        'orden': 1,
                        'sections': [
                            {'code': 'tipos_documento', 'name': 'Tipos de Documento', 'icon': 'FileType', 'orden': 1, 'description': 'Clasificación: procedimiento, instructivo, formato, registro, manual, guía, protocolo'},
                            {'code': 'documentos', 'name': 'Documentos', 'icon': 'Files', 'orden': 2, 'description': 'Crear o cargar documentos. Flujo: Borrador → Revisión → Aprobado → Vigente → Obsoleto'},
                            {'code': 'control_cambios', 'name': 'Control de Cambios', 'icon': 'History', 'orden': 3, 'description': 'Historial de versiones, quién cambió qué y cuándo'},
                            {'code': 'distribucion', 'name': 'Distribución', 'icon': 'Share2', 'orden': 4, 'description': 'Control de copias y distribución. Registro de lectura y firma por colaborador'},
                        ]
                    },
                    {
                        'code': 'auditorias_internas',
                        'name': 'Auditorías Internas',
                        'icon': 'ClipboardCheck',
                        'route': 'auditorias',
                        'orden': 2,
                        'sections': [
                            {'code': 'ejecucion_auditoria', 'name': 'Ejecución', 'icon': 'Play', 'orden': 1, 'description': 'Listas de verificación, ejecución de auditorías y registro de hallazgos'},
                            {'code': 'informes', 'name': 'Informes', 'icon': 'FileText', 'orden': 2, 'description': 'Informes de auditoría, conclusiones y recomendaciones'},
                        ]
                    },
                ]
            },

            # ─── Nivel 3: WORKFLOWS ──────────────────────────────────────
            {
                'code': 'workflow_engine',
                'name': 'Flujos de Trabajo',
                'description': 'Motor transversal de flujos de aprobación y automatización',
                'category': 'STRATEGIC',
                'color': 'purple',
                'icon': 'Workflow',
                'route': '/workflows',
                'is_core': False,
                'is_enabled': True,
                'orden': 18,
                'tabs': [
                    {'code': 'disenador_flujos', 'name': 'Diseñador de Flujos', 'icon': 'PenTool', 'route': 'disenador', 'orden': 1, 'sections': [
                        {'code': 'flujos', 'name': 'Flujos', 'icon': 'PenTool', 'orden': 1, 'description': 'Diseño visual de flujos de trabajo BPMN'},
                    ]},
                    {'code': 'ejecucion', 'name': 'Ejecución', 'icon': 'Play', 'route': 'ejecucion', 'orden': 2, 'sections': [
                        {'code': 'instancias', 'name': 'Instancias', 'icon': 'Play', 'orden': 1, 'description': 'Instancias de flujo en ejecución'},
                    ]},
                    {'code': 'monitoreo', 'name': 'Monitoreo', 'icon': 'Activity', 'route': 'monitoreo', 'orden': 3, 'sections': [
                        {'code': 'metricas', 'name': 'Métricas', 'icon': 'Activity', 'orden': 1, 'description': 'Monitoreo y métricas de rendimiento de flujos'},
                    ]},
                ]
            },

            # ─── Nivel 4: MI EQUIPO ──────────────────────────────────────
            {
                'code': 'mi_equipo',
                'name': 'Mi Equipo',
                'description': 'Ciclo de vinculación del colaborador: perfil de cargo hasta onboarding completado',
                'category': 'SUPPORT',
                'color': 'sky',
                'icon': 'UserPlus',
                'route': '/mi-equipo',
                'is_core': False,
                'is_enabled': True,
                'orden': 20,
                'tabs': [
                    {'code': 'perfiles_cargo', 'name': 'Perfiles de Cargo', 'icon': 'Briefcase', 'route': 'perfiles-cargo', 'orden': 1, 'sections': [
                        {'code': 'perfiles_cargo', 'name': 'Perfiles de Cargo', 'icon': 'Briefcase', 'orden': 1, 'description': 'Requisitos, competencias y SST por cargo. Consume cargos de Fundación'},
                    ]},
                    {'code': 'seleccion_contratacion', 'name': 'Selección y Contratación', 'icon': 'UserPlus', 'route': 'seleccion', 'orden': 2, 'sections': [
                        {'code': 'vacantes', 'name': 'Vacantes', 'icon': 'Briefcase', 'orden': 1, 'description': 'Publicación y gestión de vacantes'},
                        {'code': 'candidatos', 'name': 'Candidatos', 'icon': 'UserPlus', 'orden': 2, 'description': 'Evaluación y seguimiento de candidatos'},
                        {'code': 'contratacion', 'name': 'Contratación', 'icon': 'FileSignature', 'orden': 3, 'description': 'Proceso de contratación y documentación'},
                    ]},
                    {'code': 'colaboradores', 'name': 'Colaboradores', 'icon': 'Users', 'route': 'colaboradores', 'orden': 3, 'sections': [
                        {'code': 'directorio', 'name': 'Directorio', 'icon': 'Users', 'orden': 1, 'description': 'Listado y gestión de colaboradores activos'},
                        {'code': 'hoja_vida', 'name': 'Hoja de Vida', 'icon': 'FileText', 'orden': 2, 'description': 'Información personal, laboral y documentación'},
                        {'code': 'contratos', 'name': 'Contratos', 'icon': 'FileSignature', 'orden': 3, 'description': 'Gestión de contratos laborales'},
                    ]},
                    {'code': 'onboarding_induccion', 'name': 'Onboarding e Inducción', 'icon': 'Rocket', 'route': 'onboarding', 'orden': 4, 'sections': [
                        {'code': 'programas_induccion', 'name': 'Programas de Inducción', 'icon': 'Rocket', 'orden': 1, 'description': 'Configuración y seguimiento de programas de inducción'},
                        {'code': 'afiliaciones', 'name': 'Afiliaciones', 'icon': 'Shield', 'orden': 2, 'description': 'Gestión de afiliaciones a seguridad social'},
                        {'code': 'entrega_dotacion', 'name': 'Entrega de Dotación', 'icon': 'Package', 'orden': 3, 'description': 'Entrega de activos y EPP según cargo. Consume de Administración e inventario EPP'},
                    ]},
                ]
            },

            # ─── Nivel 5: PLANIFICACIÓN OPERATIVA ────────────────────────
            {
                'code': 'planificacion_operativa',
                'name': 'Planificación Operativa',
                'description': 'Plan de trabajo por proceso, programas de gestión y recursos',
                'category': 'STRATEGIC',
                'color': 'sky',
                'icon': 'Calendar',
                'route': '/planificacion-operativa',
                'is_core': False,
                'is_enabled': True,
                'orden': 25,
                'tabs': [
                    {
                        'code': 'planificacion_sistema',
                        'name': 'Planificación del Sistema',
                        'icon': 'Calendar',
                        'route': 'planificacion',
                        'orden': 1,
                        'sections': [
                            {'code': 'plan_trabajo', 'name': 'Plan de Trabajo', 'icon': 'CalendarRange', 'orden': 1, 'description': 'Cronograma unificado de actividades por proceso. Consume objetivos de procesos de Fundación'},
                            {'code': 'programas', 'name': 'Programas', 'icon': 'ListChecks', 'orden': 2, 'description': 'Programas de gestión (SST, Ambiental, Calidad, Formación). Se integran al Plan de Trabajo'},
                            {'code': 'recursos_proceso', 'name': 'Recursos', 'icon': 'Briefcase', 'orden': 3, 'description': 'Recursos necesarios por proceso. Alimenta Presupuesto en Soporte'},
                        ]
                    },
                ]
            },

            # ─── Nivel 6: PLANEACIÓN ESTRATÉGICA ─────────────────────────
            {
                'code': 'planeacion_estrategica',
                'name': 'Planeación Estratégica',
                'description': 'DOFA, BSC, proyectos y gestión del cambio',
                'category': 'STRATEGIC',
                'color': 'indigo',
                'icon': 'Target',
                'route': '/planeacion-estrategica',
                'is_core': False,
                'is_enabled': True,
                'orden': 30,
                'tabs': [
                    {
                        'code': 'contexto',
                        'name': 'DOFA y Estrategias',
                        'icon': 'Compass',
                        'route': 'contexto',
                        'orden': 1,
                        'sections': [
                            {'code': 'analisis_contexto', 'name': 'Análisis del Contexto', 'icon': 'Compass', 'orden': 1, 'description': 'Herramientas PCI, POAM, PESTEL, Porter (consume de Fundación Tab 2)'},
                            {'code': 'dofa_estrategias', 'name': 'DOFA y Estrategias', 'icon': 'Grid3X3', 'orden': 2, 'description': 'Matriz DOFA + formulación de estrategias. Cada estrategia genera Proyecto, Acción o Cambio'},
                        ]
                    },
                    {
                        'code': 'planeacion',
                        'name': 'Plan Estratégico',
                        'icon': 'Target',
                        'route': 'planeacion',
                        'orden': 2,
                        'sections': [
                            {'code': 'objetivos_bsc', 'name': 'Objetivos', 'icon': 'Target', 'orden': 1, 'description': 'Objetivos por perspectiva BSC vinculados al plan estratégico'},
                            {'code': 'mapa_estrategico', 'name': 'Mapa Estratégico', 'icon': 'Map', 'orden': 2, 'description': 'Visualización interactiva de objetivos y relaciones causa-efecto'},
                            {'code': 'gestion_cambio', 'name': 'Gestión del Cambio', 'icon': 'RefreshCw', 'orden': 3, 'description': 'Registre y dé seguimiento a cambios estratégicos, organizacionales, de procesos o tecnológicos'},
                        ]
                    },
                    {
                        'code': 'riesgos_oportunidades',
                        'name': 'Riesgos y Oportunidades',
                        'icon': 'ShieldAlert',
                        'route': 'riesgos-oportunidades',
                        'orden': 3,
                        'sections': [
                            {'code': 'mapa_calor', 'name': 'Mapa de Calor', 'icon': 'Grid3X3', 'orden': 1, 'description': 'Vista consolidada: probabilidad vs impacto (lee Motor de Riesgos)'},
                            {'code': 'riesgos_proceso', 'name': 'Riesgos por Proceso', 'icon': 'AlertTriangle', 'orden': 2, 'description': 'Riesgos vinculados a caracterización de procesos'},
                        ]
                    },
                    {
                        'code': 'gestion_proyectos',
                        'name': 'Gestión de Proyectos',
                        'icon': 'FolderKanban',
                        'route': 'proyectos',
                        'orden': 4,
                        'sections': [
                            {'code': 'portafolio', 'name': 'Portafolio', 'icon': 'Briefcase', 'orden': 1, 'description': 'Vista general del portafolio, programas y estado de proyectos'},
                            {'code': 'iniciacion', 'name': 'Iniciación', 'icon': 'FileSignature', 'orden': 2, 'description': 'Acta de constitución, aprobación y registro de partes interesadas'},
                            {'code': 'planificacion', 'name': 'Planificación', 'icon': 'CalendarRange', 'orden': 3, 'description': 'Alcance, cronograma, recursos, costos y plan de riesgos'},
                            {'code': 'ejecucion_monitoreo', 'name': 'Ejecución y Monitoreo', 'icon': 'Activity', 'orden': 4, 'description': 'Seguimiento de avance, indicadores EVM y control de cambios'},
                            {'code': 'cierre', 'name': 'Cierre', 'icon': 'CheckCircle2', 'orden': 5, 'description': 'Lecciones aprendidas, acta de cierre y liberación de recursos'},
                        ]
                    },
                ]
            },

            # =================================================================
            # ═══ HACER (H) — Proteger, operar, gestionar talento, soportar
            # =================================================================

            # ─── Nivel 7: PROTECCIÓN Y CUMPLIMIENTO ──────────────────────
            {
                'code': 'proteccion_cumplimiento',
                'name': 'Protección y Cumplimiento',
                'description': 'Cumplimiento legal, riesgos ISO 31000, IPEVR, aspectos ambientales, vial, info y LAFT',
                'category': 'COMPLIANCE',
                'color': 'amber',
                'icon': 'ShieldCheck',
                'route': '/proteccion',
                'is_core': False,
                'is_enabled': True,
                'orden': 35,
                'tabs': [
                    {
                        'code': 'cumplimiento_legal',
                        'name': 'Cumplimiento Legal',
                        'icon': 'Scale',
                        'route': 'cumplimiento-legal',
                        'orden': 1,
                        'sections': [
                            {'code': 'normas', 'name': 'Normas', 'icon': 'BookOpen', 'orden': 1, 'description': 'Registro de decretos, leyes y resoluciones'},
                            {'code': 'requisitos', 'name': 'Requisitos', 'icon': 'FileCheck', 'orden': 2, 'description': 'Gestión de requisitos legales aplicables'},
                            {'code': 'reglamentos', 'name': 'Reglamentos', 'icon': 'Gavel', 'orden': 3, 'description': 'Gestión de reglamentos internos de la organización'},
                            {'code': 'evaluacion', 'name': 'Evaluación', 'icon': 'ClipboardCheck', 'orden': 4, 'description': 'Evaluación de cumplimiento por norma'},
                        ]
                    },
                    {'code': 'riesgos_procesos', 'name': 'Riesgos por Proceso', 'icon': 'AlertTriangle', 'route': 'procesos', 'orden': 2, 'sections': [
                        {'code': 'matriz_riesgos', 'name': 'Matriz de Riesgos', 'icon': 'Grid3X3', 'orden': 1, 'description': 'Identificación y valoración de riesgos por proceso (ISO 31000)'},
                        {'code': 'controles', 'name': 'Controles', 'icon': 'Shield', 'orden': 2, 'description': 'Gestión de controles asociados a riesgos'},
                    ]},
                    {'code': 'ipevr', 'name': 'IPEVR (GTC-45)', 'icon': 'ShieldAlert', 'route': 'ipevr', 'orden': 3, 'sections': [
                        {'code': 'identificacion_peligros', 'name': 'Identificación de Peligros', 'icon': 'ShieldAlert', 'orden': 1, 'description': 'Identificación, evaluación y valoración de riesgos en SST por cargo y actividad'},
                    ]},
                    {'code': 'aspectos_ambientales', 'name': 'Aspectos Ambientales', 'icon': 'Leaf', 'route': 'ambientales', 'orden': 4, 'sections': [
                        {'code': 'matriz_aspectos', 'name': 'Matriz de Aspectos', 'icon': 'Leaf', 'orden': 1, 'description': 'Aspectos e impactos ambientales significativos (ISO 14001)'},
                    ]},
                    {'code': 'riesgos_viales', 'name': 'Riesgos Viales', 'icon': 'Car', 'route': 'viales', 'orden': 5, 'sections': [
                        {'code': 'matriz_vial', 'name': 'Matriz Vial', 'icon': 'Car', 'orden': 1, 'description': 'Riesgos viales asociados al PESV (Resolución 40595)'},
                    ]},
                    {'code': 'seguridad_informacion', 'name': 'Seguridad de la Información', 'icon': 'Lock', 'route': 'seguridad-info', 'orden': 6, 'sections': [
                        {'code': 'activos_info', 'name': 'Activos de Información', 'icon': 'Lock', 'orden': 1, 'description': 'Riesgos de seguridad de la información (ISO 27001)'},
                    ]},
                    {'code': 'sagrilaft_ptee', 'name': 'SAGRILAFT/PTEE', 'icon': 'ShieldCheck', 'route': 'sagrilaft', 'orden': 7, 'sections': [
                        {'code': 'riesgos_laft', 'name': 'Riesgos LAFT', 'icon': 'ShieldCheck', 'orden': 1, 'description': 'Gestión de riesgos de lavado de activos (si aplica por sector)'},
                    ]},
                ]
            },

            # ─── Nivel 8: GESTIÓN INTEGRAL (HSEQ) ───────────────────────
            {
                'code': 'gestion_integral',
                'name': 'Gestión Integral',
                'description': 'Ejecución diaria de protección: medicina, seguridad, higiene, comités, ATEL, emergencias, ambiental',
                'category': 'INTEGRATED',
                'color': 'emerald',
                'icon': 'Shield',
                'route': '/gestion-integral',
                'is_core': False,
                'is_enabled': True,
                'orden': 40,
                'tabs': [
                    {'code': 'medicina_laboral', 'name': 'Medicina Laboral', 'icon': 'Heart', 'route': 'medicina-laboral', 'orden': 1, 'sections': [
                        {'code': 'examenes_medicos', 'name': 'Exámenes Médicos', 'icon': 'Heart', 'orden': 1, 'description': 'Gestión de exámenes médicos ocupacionales'},
                        {'code': 'condiciones_salud', 'name': 'Condiciones de Salud', 'icon': 'Activity', 'orden': 2, 'description': 'Seguimiento de condiciones de salud'},
                    ]},
                    {'code': 'seguridad_industrial', 'name': 'Seguridad Industrial', 'icon': 'HardHat', 'route': 'seguridad-industrial', 'orden': 2, 'sections': [
                        {'code': 'inspecciones', 'name': 'Inspecciones', 'icon': 'HardHat', 'orden': 1, 'description': 'Inspecciones de seguridad industrial. Consume controles de Protección'},
                    ]},
                    {'code': 'higiene_industrial', 'name': 'Higiene Industrial', 'icon': 'Thermometer', 'route': 'higiene-industrial', 'orden': 3, 'sections': [
                        {'code': 'mediciones', 'name': 'Mediciones', 'icon': 'Thermometer', 'orden': 1, 'description': 'Mediciones higiénicas ambientales'},
                    ]},
                    {'code': 'gestion_comites', 'name': 'Gestión de Comités', 'icon': 'Users', 'route': 'comites', 'orden': 4, 'sections': [
                        {'code': 'comites', 'name': 'Comités', 'icon': 'Users', 'orden': 1, 'description': 'COPASST, Convivencia y otros comités obligatorios'},
                    ]},
                    {'code': 'accidentalidad', 'name': 'Accidentalidad (ATEL)', 'icon': 'AlertCircle', 'route': 'accidentalidad', 'orden': 5, 'sections': [
                        {'code': 'registro_atel', 'name': 'Registro ATEL', 'icon': 'AlertCircle', 'orden': 1, 'description': 'Registro de accidentes de trabajo y enfermedades laborales'},
                        {'code': 'investigacion', 'name': 'Investigación', 'icon': 'Search', 'orden': 2, 'description': 'Investigación de incidentes y accidentes'},
                    ]},
                    {'code': 'emergencias', 'name': 'Emergencias', 'icon': 'Siren', 'route': 'emergencias', 'orden': 6, 'sections': [
                        {'code': 'plan_emergencias', 'name': 'Plan de Emergencias', 'icon': 'Siren', 'orden': 1, 'description': 'Plan de prevención, preparación y respuesta ante emergencias'},
                    ]},
                    {'code': 'gestion_ambiental', 'name': 'Gestión Ambiental', 'icon': 'Leaf', 'route': 'gestion-ambiental', 'orden': 7, 'sections': [
                        {'code': 'programas_ambientales', 'name': 'Programas Ambientales', 'icon': 'Leaf', 'orden': 1, 'description': 'Programas de gestión ambiental operativos'},
                    ]},
                ]
            },

            # ─── Nivel 9: CADENA DE VALOR ────────────────────────────────

            # 9A: Supply Chain
            {
                'code': 'supply_chain',
                'name': 'Cadena de Suministro',
                'description': 'Gestión de proveedores, compras, inventarios y evaluaciones',
                'category': 'OPERATIONAL',
                'color': 'green',
                'icon': 'Package',
                'route': '/supply-chain',
                'is_core': False,
                'is_enabled': True,
                'orden': 50,
                'tabs': [
                    {'code': 'proveedores', 'name': 'Proveedores', 'icon': 'Users', 'route': 'proveedores', 'orden': 1, 'sections': [
                        {'code': 'registro_proveedores', 'name': 'Registro', 'icon': 'Users', 'orden': 1, 'description': 'Consume de Partes Interesadas (Fundación). Enriquece con datos comerciales'},
                        {'code': 'importacion_proveedores', 'name': 'Importación', 'icon': 'Upload', 'orden': 2, 'description': 'Importación masiva de proveedores'},
                    ]},
                    {'code': 'precios', 'name': 'Precios', 'icon': 'DollarSign', 'route': 'precios', 'orden': 2, 'sections': [
                        {'code': 'precios_materia_prima', 'name': 'Precios Materia Prima', 'icon': 'DollarSign', 'orden': 1, 'description': 'Control de precios por tipo de materia prima'},
                    ]},
                    {'code': 'compras', 'name': 'Compras', 'icon': 'ShoppingCart', 'route': 'compras', 'orden': 3, 'sections': [
                        {'code': 'ordenes_compra', 'name': 'Órdenes de Compra', 'icon': 'ShoppingCart', 'orden': 1, 'description': 'Gestión de órdenes de compra. Consume UNeg y sedes de Fundación'},
                    ]},
                    {'code': 'almacenamiento', 'name': 'Almacenamiento', 'icon': 'Warehouse', 'route': 'almacenamiento', 'orden': 4, 'sections': [
                        {'code': 'inventario', 'name': 'Inventario', 'icon': 'Warehouse', 'orden': 1, 'description': 'Control de inventario y almacén'},
                    ]},
                    {'code': 'programacion_abastecimiento', 'name': 'Programación', 'icon': 'Calendar', 'route': 'programacion', 'orden': 5, 'sections': [
                        {'code': 'programacion_sc', 'name': 'Programación', 'icon': 'Calendar', 'orden': 1, 'description': 'Programación de abastecimiento'},
                    ]},
                    {'code': 'evaluaciones', 'name': 'Evaluaciones', 'icon': 'ClipboardCheck', 'route': 'evaluaciones', 'orden': 6, 'sections': [
                        {'code': 'evaluaciones_prov', 'name': 'Evaluación Proveedores', 'icon': 'ClipboardCheck', 'orden': 1, 'description': 'Evaluación periódica de proveedores'},
                    ]},
                    {'code': 'catalogos', 'name': 'Catálogos', 'icon': 'FolderOpen', 'route': 'catalogos', 'orden': 7, 'sections': [
                        {'code': 'catalogos_sc', 'name': 'Catálogos', 'icon': 'FolderOpen', 'orden': 1, 'description': 'Catálogos dinámicos de la cadena de suministro'},
                    ]},
                ]
            },

            # 9B: Production Ops
            {
                'code': 'production_ops',
                'name': 'Base de Operaciones',
                'description': 'Gestión de procesos productivos, mantenimiento y producto terminado',
                'category': 'OPERATIONAL',
                'color': 'amber',
                'icon': 'Factory',
                'route': '/produccion',
                'is_core': False,
                'is_enabled': True,
                'orden': 51,
                'tabs': [
                    {'code': 'recepcion', 'name': 'Recepción', 'icon': 'Download', 'route': 'recepcion', 'orden': 1, 'sections': [
                        {'code': 'recepcion_mp', 'name': 'Recepción MP', 'icon': 'Download', 'orden': 1, 'description': 'Recepción de materia prima'},
                    ]},
                    {'code': 'procesamiento', 'name': 'Procesamiento', 'icon': 'Cog', 'route': 'procesamiento', 'orden': 2, 'sections': [
                        {'code': 'ordenes_produccion', 'name': 'Órdenes de Producción', 'icon': 'Cog', 'orden': 1, 'description': 'Gestión de órdenes de producción. Consume activos tipo "productivo" de Administración'},
                    ]},
                    {'code': 'mantenimiento_industrial', 'name': 'Mantenimiento Industrial', 'icon': 'Wrench', 'route': 'mantenimiento', 'orden': 3, 'sections': [
                        {'code': 'plan_mantenimiento', 'name': 'Plan de Mantenimiento', 'icon': 'Wrench', 'orden': 1, 'description': 'Mantenimiento preventivo y correctivo. Consume activos tipo "productivo"'},
                    ]},
                    {'code': 'producto_terminado', 'name': 'Producto Terminado', 'icon': 'PackageCheck', 'route': 'producto-terminado', 'orden': 4, 'sections': [
                        {'code': 'lotes', 'name': 'Lotes', 'icon': 'PackageCheck', 'orden': 1, 'description': 'Control de producto terminado y lotes'},
                    ]},
                ]
            },

            # 9C: Logistics Fleet
            {
                'code': 'logistics_fleet',
                'name': 'Logística y Flota',
                'description': 'Gestión de transporte, despachos, flota vehicular y PESV',
                'category': 'OPERATIONAL',
                'color': 'cyan',
                'icon': 'Truck',
                'route': '/logistica',
                'is_core': False,
                'is_enabled': True,
                'orden': 52,
                'tabs': [
                    {'code': 'gestion_transporte', 'name': 'Gestión Transporte', 'icon': 'Route', 'route': 'transporte', 'orden': 1, 'sections': [
                        {'code': 'rutas', 'name': 'Rutas', 'icon': 'Route', 'orden': 1, 'description': 'Gestión de rutas de transporte'},
                    ]},
                    {'code': 'despachos', 'name': 'Despachos', 'icon': 'Send', 'route': 'despachos', 'orden': 2, 'sections': [
                        {'code': 'ordenes_despacho', 'name': 'Órdenes de Despacho', 'icon': 'Send', 'orden': 1, 'description': 'Programación y seguimiento de despachos'},
                    ]},
                    {'code': 'gestion_flota', 'name': 'Gestión de Flota', 'icon': 'Car', 'route': 'flota', 'orden': 3, 'sections': [
                        {'code': 'vehiculos', 'name': 'Vehículos', 'icon': 'Car', 'orden': 1, 'description': 'Consume activos tipo "vehículo" de Administración. SOAT, tecnomecánica, kilometraje'},
                    ]},
                    {'code': 'pesv_operativo', 'name': 'PESV Operativo', 'icon': 'Shield', 'route': 'pesv', 'orden': 4, 'sections': [
                        {'code': 'pesv', 'name': 'PESV', 'icon': 'Shield', 'orden': 1, 'description': 'Plan Estratégico de Seguridad Vial operativo'},
                    ]},
                ]
            },

            # 9D: Sales CRM
            {
                'code': 'sales_crm',
                'name': 'Ventas y CRM',
                'description': 'Gestión comercial, pipeline de ventas y servicio al cliente',
                'category': 'OPERATIONAL',
                'color': 'rose',
                'icon': 'TrendingUp',
                'route': '/ventas',
                'is_core': False,
                'is_enabled': True,
                'orden': 53,
                'tabs': [
                    {'code': 'gestion_clientes', 'name': 'Gestión de Clientes', 'icon': 'Users', 'route': 'clientes', 'orden': 1, 'sections': [
                        {'code': 'clientes', 'name': 'Clientes', 'icon': 'Users', 'orden': 1, 'description': 'Consume de Partes Interesadas (Fundación). Enriquece con datos comerciales'},
                    ]},
                    {'code': 'pipeline_ventas', 'name': 'Pipeline Ventas', 'icon': 'Funnel', 'route': 'pipeline', 'orden': 2, 'sections': [
                        {'code': 'oportunidades_venta', 'name': 'Oportunidades', 'icon': 'Funnel', 'orden': 1, 'description': 'Pipeline y oportunidades de venta'},
                    ]},
                    {'code': 'pedidos_facturacion', 'name': 'Pedidos y Facturación', 'icon': 'FileText', 'route': 'pedidos', 'orden': 3, 'sections': [
                        {'code': 'pedidos', 'name': 'Pedidos', 'icon': 'FileText', 'orden': 1, 'description': 'Gestión de pedidos y facturación'},
                    ]},
                    {'code': 'servicio_cliente', 'name': 'Servicio al Cliente', 'icon': 'Headphones', 'route': 'pqrs', 'orden': 4, 'sections': [
                        {'code': 'pqrs', 'name': 'PQRS', 'icon': 'Headphones', 'orden': 1, 'description': 'Peticiones, quejas, reclamos y sugerencias'},
                    ]},
                ]
            },

            # ─── Nivel 10: TALENTO (gestión continua) ────────────────────
            {
                'code': 'talent_hub',
                'name': 'Gestión del Talento',
                'description': 'Gestión del ciclo laboral continuo: formación, desempeño, nómina, disciplinario, retiro',
                'category': 'SUPPORT',
                'color': 'violet',
                'icon': 'GraduationCap',
                'route': '/talento',
                'is_core': False,
                'is_enabled': True,
                'orden': 60,
                'tabs': [
                    {'code': 'formacion_reinduccion', 'name': 'Formación y Gamificación', 'icon': 'BookOpen', 'route': 'formacion', 'orden': 1, 'sections': [
                        {'code': 'plan_formacion', 'name': 'Plan de Formación', 'icon': 'BookOpen', 'orden': 1, 'description': 'Planificación y cronograma de capacitaciones'},
                        {'code': 'capacitaciones', 'name': 'Capacitaciones', 'icon': 'GraduationCap', 'orden': 2, 'description': 'Registro y seguimiento de capacitaciones. Incluye Juego SST'},
                        {'code': 'reinduccion', 'name': 'Reinducción', 'icon': 'RefreshCw', 'orden': 3, 'description': 'Programas de reinducción periódica'},
                    ]},
                    {'code': 'desempeno', 'name': 'Desempeño', 'icon': 'Award', 'route': 'desempeno', 'orden': 2, 'sections': [
                        {'code': 'evaluaciones_desempeno', 'name': 'Evaluaciones', 'icon': 'Award', 'orden': 1, 'description': 'Evaluaciones de desempeño por período'},
                        {'code': 'planes_desarrollo', 'name': 'Planes de Desarrollo', 'icon': 'TrendingUp', 'orden': 2, 'description': 'Planes individuales de desarrollo profesional'},
                    ]},
                    {'code': 'control_tiempo', 'name': 'Control de Tiempo', 'icon': 'Clock', 'route': 'control-tiempo', 'orden': 3, 'sections': [
                        {'code': 'turnos', 'name': 'Turnos', 'icon': 'Clock', 'orden': 1, 'description': 'Turnos se configuran en Fundación/Cargos. Aquí se asignan y gestionan'},
                        {'code': 'marcajes', 'name': 'Marcajes', 'icon': 'Timer', 'orden': 2, 'description': 'Registro de marcajes de entrada y salida'},
                        {'code': 'ausencias', 'name': 'Ausencias', 'icon': 'CalendarX', 'orden': 3, 'description': 'Gestión de ausencias e incapacidades'},
                    ]},
                    {'code': 'novedades_nomina', 'name': 'Novedades y Nómina', 'icon': 'DollarSign', 'route': 'novedades-nomina', 'orden': 4, 'sections': [
                        {'code': 'registro_novedades', 'name': 'Registro de Novedades', 'icon': 'Bell', 'orden': 1, 'description': 'Novedades que afectan liquidación'},
                        {'code': 'liquidacion_nomina', 'name': 'Liquidación de Nómina', 'icon': 'DollarSign', 'orden': 2, 'description': 'Cálculo y liquidación de nómina. El PAGO se confirma en Tesorería'},
                        {'code': 'prestaciones', 'name': 'Prestaciones', 'icon': 'Gift', 'orden': 3, 'description': 'Gestión de prestaciones sociales'},
                    ]},
                    {'code': 'proceso_disciplinario', 'name': 'Proceso Disciplinario', 'icon': 'Gavel', 'route': 'disciplinario', 'orden': 5, 'sections': [
                        {'code': 'casos_disciplinarios', 'name': 'Casos Disciplinarios', 'icon': 'Gavel', 'orden': 1, 'description': 'Gestión de procesos disciplinarios'},
                    ]},
                    {'code': 'off_boarding', 'name': 'Off Boarding', 'icon': 'LogOut', 'route': 'off-boarding', 'orden': 6, 'sections': [
                        {'code': 'proceso_retiro', 'name': 'Proceso de Retiro', 'icon': 'LogOut', 'orden': 1, 'description': 'Gestión del proceso de desvinculación'},
                        {'code': 'liquidacion_final', 'name': 'Liquidación Final', 'icon': 'FileText', 'orden': 2, 'description': 'Cálculo de liquidación definitiva'},
                        {'code': 'paz_salvo', 'name': 'Paz y Salvo', 'icon': 'CheckCircle', 'orden': 3, 'description': 'Devolución de activos y EPP → reintegro a inventario'},
                    ]},
                    {'code': 'consultores_externos', 'name': 'Consultores Externos', 'icon': 'UserCog', 'route': 'consultores-externos', 'orden': 7, 'sections': [
                        {'code': 'consultores_externos', 'name': 'Consultores Externos', 'icon': 'UserCog', 'orden': 1, 'description': 'Consultores y contratistas externos vinculados a la organización'},
                    ]},
                ]
            },

            # ─── Nivel 11: SOPORTE ───────────────────────────────────────

            # 11A: Administración
            {
                'code': 'administracion',
                'name': 'Administración',
                'description': 'Catálogo maestro de activos, servicios generales y presupuesto',
                'category': 'SUPPORT',
                'color': 'amber',
                'icon': 'Building2',
                'route': '/administracion',
                'is_core': False,
                'is_enabled': True,
                'orden': 70,
                'tabs': [
                    {'code': 'activos_fijos', 'name': 'Activos', 'icon': 'Building', 'route': 'activos-fijos', 'orden': 1, 'sections': [
                        {'code': 'inventario_activos', 'name': 'Inventario de Activos', 'icon': 'Building', 'orden': 1, 'description': 'Catálogo maestro de TODOS los activos (administrativos, productivos, vehículos, infraestructura)'},
                        {'code': 'hojas_vida', 'name': 'Hojas de Vida', 'icon': 'FileText', 'orden': 2, 'description': 'Hoja de vida por activo'},
                        {'code': 'depreciacion', 'name': 'Depreciación', 'icon': 'TrendingDown', 'orden': 3, 'description': 'Cálculo y seguimiento de depreciación → alimenta Contabilidad'},
                    ]},
                    {'code': 'servicios_generales', 'name': 'Servicios Generales', 'icon': 'Wrench', 'route': 'servicios-generales', 'orden': 2, 'sections': [
                        {'code': 'gestion_servicios', 'name': 'Gestión de Servicios', 'icon': 'Wrench', 'orden': 1, 'description': 'Mantenimiento de activos administrativos e infraestructura'},
                    ]},
                    {'code': 'presupuesto', 'name': 'Presupuesto', 'icon': 'PieChart', 'route': 'presupuesto', 'orden': 3, 'sections': [
                        {'code': 'partidas_presupuestales', 'name': 'Partidas Presupuestales', 'icon': 'PieChart', 'orden': 1, 'description': 'Consume recursos planificados de Planificación Operativa'},
                        {'code': 'ejecucion_presupuestal', 'name': 'Ejecución Presupuestal', 'icon': 'BarChart3', 'orden': 2, 'description': 'Seguimiento ejecución vs presupuesto'},
                    ]},
                ]
            },

            # 11B: Tesorería
            {
                'code': 'tesoreria',
                'name': 'Tesorería',
                'description': 'Flujo de caja, pagos y dispersión',
                'category': 'SUPPORT',
                'color': 'emerald',
                'icon': 'Wallet',
                'route': '/tesoreria',
                'is_core': False,
                'is_enabled': True,
                'orden': 71,
                'tabs': [
                    {'code': 'tesoreria', 'name': 'Flujo de Caja', 'icon': 'Landmark', 'route': 'tesoreria', 'orden': 1, 'sections': [
                        {'code': 'flujo_caja', 'name': 'Flujo de Caja', 'icon': 'Landmark', 'orden': 1, 'description': 'Control de ingresos/egresos. Confirma pagos de nómina, proveedores, honorarios'},
                        {'code': 'cuentas_bancarias', 'name': 'Cuentas Bancarias', 'icon': 'CreditCard', 'orden': 2, 'description': 'Gestión de cuentas bancarias y conciliaciones'},
                    ]},
                    {'code': 'pagos', 'name': 'Pagos y Dispersión', 'icon': 'CreditCard', 'route': 'pagos', 'orden': 2, 'sections': [
                        {'code': 'pagos_proveedores', 'name': 'Pagos a Proveedores', 'icon': 'CreditCard', 'orden': 1, 'description': 'Confirmación y dispersión de pagos a proveedores'},
                        {'code': 'pagos_nomina', 'name': 'Pagos de Nómina', 'icon': 'DollarSign', 'orden': 2, 'description': 'Confirmación de pagos de nómina'},
                        {'code': 'pagos_honorarios', 'name': 'Pagos de Honorarios', 'icon': 'Wallet', 'orden': 3, 'description': 'Pago de honorarios a consultores y contratistas'},
                    ]},
                ]
            },

            # 11C: Contabilidad
            {
                'code': 'accounting',
                'name': 'Contabilidad',
                'description': 'PUC colombiano, movimientos contables, estados financieros e integración',
                'category': 'SUPPORT',
                'color': 'lime',
                'icon': 'Calculator',
                'route': '/contabilidad',
                'is_core': False,
                'is_enabled': True,
                'orden': 72,
                'tabs': [
                    {'code': 'config_contable', 'name': 'Config. Contable', 'icon': 'Settings', 'route': 'configuracion', 'orden': 1, 'sections': [
                        {'code': 'plan_cuentas', 'name': 'Plan de Cuentas', 'icon': 'List', 'orden': 1, 'description': 'Plan único de cuentas (PUC colombiano)'},
                        {'code': 'centros_costo', 'name': 'Centros de Costo', 'icon': 'Target', 'orden': 2, 'description': 'Consume unidades de negocio de Fundación'},
                        {'code': 'periodos_contables', 'name': 'Períodos Contables', 'icon': 'Calendar', 'orden': 3, 'description': 'Gestión de períodos contables'},
                    ]},
                    {'code': 'movimientos', 'name': 'Movimientos', 'icon': 'ArrowLeftRight', 'route': 'movimientos', 'orden': 2, 'sections': [
                        {'code': 'comprobantes', 'name': 'Comprobantes', 'icon': 'ArrowLeftRight', 'orden': 1, 'description': 'Comprobantes contables. Recibe de Tesorería, Nómina, Compras, Ventas, Depreciación'},
                        {'code': 'libro_diario', 'name': 'Libro Diario', 'icon': 'BookOpen', 'orden': 2, 'description': 'Libro diario de movimientos contables'},
                    ]},
                    {'code': 'informes_contables', 'name': 'Informes Contables', 'icon': 'FileText', 'route': 'informes', 'orden': 3, 'sections': [
                        {'code': 'balance_general', 'name': 'Balance General', 'icon': 'FileText', 'orden': 1, 'description': 'Estado de situación financiera'},
                        {'code': 'estado_resultados', 'name': 'Estado de Resultados', 'icon': 'BarChart3', 'orden': 2, 'description': 'Estado de resultados del período'},
                    ]},
                    {'code': 'integracion', 'name': 'Integración', 'icon': 'Link', 'route': 'integracion', 'orden': 4, 'sections': [
                        {'code': 'integracion_contable', 'name': 'Integración Contable', 'icon': 'Link', 'orden': 1, 'description': 'Integración con otros módulos y sistemas externos'},
                    ]},
                ]
            },

            # =================================================================
            # ═══ VERIFICAR (V) — Medir, analizar, revisar
            # =================================================================

            # ─── Nivel 12: INTELIGENCIA ──────────────────────────────────
            {
                'code': 'analytics',
                'name': 'Inteligencia de Negocios',
                'description': 'Dashboards, indicadores, análisis de tendencias e informes gerenciales',
                'category': 'INTELLIGENCE',
                'color': 'purple',
                'icon': 'BarChart3',
                'route': '/analytics',
                'is_core': False,
                'is_enabled': True,
                'orden': 80,
                'tabs': [
                    {'code': 'dashboard_gerencial', 'name': 'Dashboard Gerencial', 'icon': 'LayoutDashboard', 'route': 'dashboards', 'orden': 1, 'sections': [
                        {'code': 'tableros', 'name': 'Tableros', 'icon': 'LayoutDashboard', 'orden': 1, 'description': 'Vista ejecutiva consolidada. KPIs principales'},
                    ]},
                    {'code': 'indicadores_area', 'name': 'Indicadores por Área', 'icon': 'TrendingUp', 'route': 'indicadores', 'orden': 2, 'sections': [
                        {'code': 'indicadores', 'name': 'Indicadores', 'icon': 'TrendingUp', 'orden': 1, 'description': 'Indicadores de gestión por área y proceso'},
                        {'code': 'mediciones', 'name': 'Mediciones', 'icon': 'BarChart3', 'orden': 2, 'description': 'Registro de mediciones periódicas'},
                    ]},
                    {'code': 'analisis_tendencias', 'name': 'Análisis y Tendencias', 'icon': 'LineChart', 'route': 'analisis', 'orden': 3, 'sections': [
                        {'code': 'tendencias', 'name': 'Tendencias', 'icon': 'LineChart', 'orden': 1, 'description': 'Proyecciones, comparativos, análisis estadístico'},
                    ]},
                    {'code': 'generador_informes', 'name': 'Generador Informes', 'icon': 'FileText', 'route': 'informes', 'orden': 4, 'sections': [
                        {'code': 'plantillas_informe', 'name': 'Plantillas de Informe', 'icon': 'FileText', 'orden': 1, 'description': 'Plantillas y generación de informes para junta directiva'},
                    ]},
                    {'code': 'acciones_indicador', 'name': 'Acciones x Indicador', 'icon': 'Zap', 'route': 'acciones', 'orden': 5, 'sections': [
                        {'code': 'acciones_mejora_ind', 'name': 'Acciones de Mejora', 'icon': 'Zap', 'orden': 1, 'description': 'Planes de acción por indicador fuera de meta'},
                    ]},
                ]
            },

            # ─── Nivel 13: REVISIÓN POR LA DIRECCIÓN ─────────────────────
            {
                'code': 'revision_direccion',
                'name': 'Revisión por la Dirección',
                'description': 'Revisiones gerenciales, actas y compromisos. Cierre del ciclo gerencial',
                'category': 'INTELLIGENCE',
                'color': 'purple',
                'icon': 'ClipboardCheck',
                'route': '/revision-direccion',
                'is_core': False,
                'is_enabled': True,
                'orden': 85,
                'tabs': [
                    {
                        'code': 'revision_direccion',
                        'name': 'Revisión por la Dirección',
                        'icon': 'ClipboardCheck',
                        'route': 'programacion',
                        'orden': 1,
                        'sections': [
                            {'code': 'programacion', 'name': 'Programación', 'icon': 'Calendar', 'orden': 1, 'description': 'Calendario y listado de revisiones gerenciales programadas'},
                            {'code': 'actas', 'name': 'Actas', 'icon': 'FileText', 'orden': 2, 'description': 'Gestión de actas generadas en las revisiones por la dirección'},
                            {'code': 'compromisos', 'name': 'Compromisos', 'icon': 'ClipboardList', 'orden': 3, 'description': 'Seguimiento de compromisos. Generan acciones que retroalimentan la cascada'},
                        ]
                    },
                ]
            },

            # =================================================================
            # ═══ ACTUAR (A) — Mejorar
            # =================================================================

            # ─── Nivel 14: ACCIONES DE MEJORA ────────────────────────────
            {
                'code': 'acciones_mejora',
                'name': 'Acciones de Mejora',
                'description': 'Cierre del ciclo PHVA: no conformidades, correctivas y oportunidades de mejora',
                'category': 'INTELLIGENCE',
                'color': 'red',
                'icon': 'TrendingUp',
                'route': '/acciones-mejora',
                'is_core': False,
                'is_enabled': True,
                'orden': 90,
                'tabs': [
                    {
                        'code': 'acciones_mejora',
                        'name': 'Acciones de Mejora',
                        'icon': 'TrendingUp',
                        'route': 'acciones',
                        'orden': 1,
                        'sections': [
                            {'code': 'no_conformidades', 'name': 'No Conformidades', 'icon': 'AlertCircle', 'orden': 1, 'description': 'Registro y tratamiento de NC desde auditorías, inspecciones, quejas, accidentes'},
                            {'code': 'acciones_correctivas', 'name': 'Acciones Correctivas', 'icon': 'CheckCircle', 'orden': 2, 'description': 'Plan de acción para eliminar causas. Genera actividad, proyecto o cambio de proceso'},
                            {'code': 'acciones_preventivas', 'name': 'Acciones Preventivas', 'icon': 'Shield', 'orden': 3, 'description': 'Acciones para prevenir no conformidades potenciales'},
                            {'code': 'oportunidades_mejora', 'name': 'Oportunidades de Mejora', 'icon': 'Lightbulb', 'orden': 4, 'description': 'Ideas y proyectos de mejora continua'},
                        ]
                    },
                ]
            },

            # =================================================================
            # ═══ INFRAESTRUCTURA — Transversal, siempre disponible
            # =================================================================

            # ─── Configuración de Plataforma ──────────────────────────────
            {
                'code': 'configuracion_plataforma',
                'name': 'Configuración',
                'description': 'Ajustes técnicos de la plataforma: módulos, consecutivos, catálogos, integraciones',
                'category': 'INFRASTRUCTURE',
                'color': 'slate',
                'icon': 'Settings',
                'route': '/configuracion-admin',
                'is_core': True,
                'is_enabled': True,
                'orden': 97,
                'tabs': [
                    {'code': 'general', 'name': 'General', 'icon': 'Settings', 'route': 'general', 'orden': 1, 'sections': [
                        {'code': 'modulos', 'name': 'Módulos del Sistema', 'icon': 'Blocks', 'orden': 1, 'description': 'Activar y desactivar módulos, tabs y secciones del sistema'},
                        {'code': 'consecutivos', 'name': 'Consecutivos', 'icon': 'Hash', 'orden': 2, 'description': 'Configuración de numeración automática por tipo de documento'},
                    ]},
                    {'code': 'catalogos_tab', 'name': 'Catálogos', 'icon': 'Library', 'route': 'catalogos', 'orden': 2, 'sections': [
                        {'code': 'catalogos', 'name': 'Catálogos Maestros', 'icon': 'Library', 'orden': 1, 'description': 'Tablas maestras transversales: unidades de medida, tipos de contrato, EPP, normas y más'},
                    ]},
                    {'code': 'conexiones', 'name': 'Conexiones', 'icon': 'Plug', 'route': 'conexiones', 'orden': 3, 'sections': [
                        {'code': 'integraciones', 'name': 'Integraciones', 'icon': 'Plug', 'orden': 1, 'description': 'Conexiones con sistemas externos (contabilidad, nómina, ERP)'},
                        {'code': 'automatizaciones', 'name': 'Automatizaciones', 'icon': 'Workflow', 'orden': 2, 'description': 'Diseñador de flujos de trabajo y automatizaciones del sistema'},
                        {'code': 'importacion_exportacion', 'name': 'Importación / Exportación', 'icon': 'ArrowUpDown', 'orden': 3, 'description': 'Importación masiva de datos (Excel) y exportación para herramientas de BI externo'},
                    ]},
                    {'code': 'avanzado', 'name': 'Avanzado', 'icon': 'Sliders', 'route': 'avanzado', 'orden': 4, 'sections': [
                        {'code': 'plantillas_notificacion', 'name': 'Plantillas de Notificación', 'icon': 'Bell', 'orden': 1, 'description': 'Configuración de plantillas de correo electrónico y notificaciones push por evento del sistema'},
                        {'code': 'config_indicadores', 'name': 'Config. Indicadores', 'icon': 'BarChart3', 'orden': 2, 'description': 'Tipos de indicador, fuentes de datos y fórmulas de cálculo'},
                        {'code': 'auditoria_configuracion', 'name': 'Auditoría de Configuración', 'icon': 'ShieldCheck', 'orden': 3, 'description': 'Registro de cambios en configuración del sistema: quién modificó qué y cuándo'},
                    ]},
                ]
            },

            # ─── Centro de Control ────────────────────────────────────────
            {
                'code': 'audit_system',
                'name': 'Centro de Control',
                'description': 'Logs, notificaciones, alertas y trazabilidad del sistema',
                'category': 'INTELLIGENCE',
                'color': 'slate',
                'icon': 'Shield',
                'route': '/auditoria',
                'is_core': True,
                'is_enabled': True,
                'orden': 95,
                'tabs': [
                    {'code': 'logs_sistema', 'name': 'Logs del Sistema', 'icon': 'Terminal', 'route': 'logs', 'orden': 1, 'sections': [
                        {'code': 'logs_auditoria', 'name': 'Logs de Auditoría', 'icon': 'Terminal', 'orden': 1, 'description': 'Registro de actividad y trazabilidad del sistema'},
                    ]},
                    {'code': 'centro_notificaciones', 'name': 'Centro Notificaciones', 'icon': 'Bell', 'route': 'notificaciones', 'orden': 2, 'sections': [
                        {'code': 'notificaciones', 'name': 'Notificaciones', 'icon': 'Bell', 'orden': 1, 'description': 'Centro de notificaciones y comunicaciones'},
                    ]},
                    {'code': 'config_alertas', 'name': 'Config. Alertas', 'icon': 'BellRing', 'route': 'alertas', 'orden': 3, 'sections': [
                        {'code': 'reglas_alerta', 'name': 'Reglas de Alerta', 'icon': 'BellRing', 'orden': 1, 'description': 'Configuración de reglas y condiciones de alerta'},
                    ]},
                    {'code': 'tareas_recordatorios', 'name': 'Tareas/Recordatorios', 'icon': 'CheckSquare', 'route': 'tareas', 'orden': 4, 'sections': [
                        {'code': 'tareas', 'name': 'Tareas', 'icon': 'CheckSquare', 'orden': 1, 'description': 'Gestión de tareas y recordatorios del sistema'},
                    ]},
                ]
            },
        ]

    # =========================================================================
    # CRUD helpers
    # =========================================================================

    def create_or_update_module(self, data):
        """Crear o actualizar un módulo"""
        code = data['code']

        module, created = SystemModule.objects.get_or_create(
            code=code,
            defaults=data
        )

        if created:
            self.stdout.write(
                self.style.SUCCESS(f'  [OK] [{data["orden"]:02d}] {data["name"]} (CREADO)')
            )
        else:
            for key, value in data.items():
                if key != 'code':
                    setattr(module, key, value)
            module.save()
            self.stdout.write(
                self.style.WARNING(f'  [UPD] [{data["orden"]:02d}] {data["name"]} (ACTUALIZADO)')
            )

        return module

    def create_or_update_tab(self, module, data):
        """Crear o actualizar un tab"""
        code = data['code']

        tab, created = ModuleTab.objects.get_or_create(
            module=module,
            code=code,
            defaults={
                'name': data['name'],
                'icon': data['icon'],
                'route': data.get('route'),
                'orden': data['orden'],
                'is_enabled': True,
                'is_core': False,
            }
        )

        if not created:
            tab.name = data['name']
            tab.icon = data['icon']
            tab.route = data.get('route')
            tab.orden = data['orden']
            tab.is_enabled = True
            tab.save()

        return tab

    def create_or_update_section(self, tab, data):
        """Crear o actualizar una sección de tab"""
        code = data['code']

        section, created = TabSection.objects.get_or_create(
            tab=tab,
            code=code,
            defaults={
                'name': data['name'],
                'icon': data.get('icon', ''),
                'description': data.get('description', ''),
                'orden': data['orden'],
                'is_enabled': True,
                'is_core': data.get('is_core', False),
            }
        )

        if not created:
            section.name = data['name']
            section.icon = data.get('icon', '')
            section.description = data.get('description', '')
            section.orden = data['orden']
            section.is_enabled = True
            section.save()

        return section

    def cleanup_obsolete_sections(self, tab, valid_section_codes):
        """Eliminar secciones que ya no están en la configuración"""
        existing_sections = TabSection.objects.filter(tab=tab)
        deleted_count = 0

        for section in existing_sections:
            if section.code not in valid_section_codes:
                self.stdout.write(
                    self.style.ERROR(f'    [DEL] Eliminando sección obsoleta: {section.name} ({section.code})')
                )
                section.delete()
                deleted_count += 1

        return deleted_count

    def cleanup_obsolete_tabs(self, module, valid_tab_codes):
        """Eliminar tabs que ya no están en la configuración"""
        existing_tabs = ModuleTab.objects.filter(module=module)
        deleted_count = 0

        for tab in existing_tabs:
            if tab.code not in valid_tab_codes:
                sections_count = tab.sections.count()
                self.stdout.write(
                    self.style.ERROR(
                        f'    [DEL] Eliminando tab obsoleto: {tab.name} ({tab.code}) '
                        f'con {sections_count} secciones'
                    )
                )
                tab.sections.all().delete()
                tab.delete()
                deleted_count += 1

        return deleted_count

    def print_summary(self, modules, tabs, sections, deleted_sections, deleted_tabs):
        self.stdout.write('\n' + '-' * 60)
        self.stdout.write(self.style.MIGRATE_HEADING('  RESUMEN'))
        self.stdout.write(f'    Módulos:    {modules}')
        self.stdout.write(f'    Tabs:       {tabs}')
        self.stdout.write(f'    Secciones:  {sections}')
        if deleted_sections > 0:
            self.stdout.write(self.style.ERROR(f'    Secciones eliminadas: {deleted_sections}'))
        if deleted_tabs > 0:
            self.stdout.write(self.style.ERROR(f'    Tabs eliminados: {deleted_tabs}'))
        self.stdout.write('-' * 60)
