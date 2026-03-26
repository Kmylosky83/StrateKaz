"""
Servicio de Onboarding - StrateKaz

Calcula y cachea el progreso de onboarding para usuarios y empresas.
Respeta la independencia C2: accede a modelos de otros módulos
exclusivamente via apps.get_model() o try/except de importación dinámica.

Ponderación del perfil de usuario:
    foto              10%
    firma             15%
    emergencia        15%
    email_personal    10%
    celular           10%
    direccion         10%
    ciudad             5%
    nombre_completo   10%
    documento         15%
    ─────────────────────
    Total            100%
"""
import logging
from typing import Any

from django.apps import apps
from django.core.cache import cache

logger = logging.getLogger(__name__)

# Clave de cache: onboarding:{user_id}
_CACHE_KEY_TEMPLATE = 'onboarding:{user_id}'
_CACHE_TTL = 300  # 5 minutos


class OnboardingService:
    """
    Servicio centralizado para calcular y cachear el progreso de onboarding.

    Métodos principales:
        compute(user)              → Calcula y guarda UserOnboarding
        invalidate_cache(user_id)  → Elimina la entrada de Redis
        get_steps_definition(type) → Definición ordenada de pasos por tipo
    """

    # ------------------------------------------------------------------
    # Ponderación del porcentaje de perfil
    # ------------------------------------------------------------------
    _PROFILE_WEIGHTS = {
        'photo':           10,
        'firma':           15,
        'emergencia':      15,
        'email_personal':  10,
        'celular':         10,
        'direccion':       10,
        'ciudad':           5,
        'nombre_completo': 10,
        'documento':       15,
    }

    # ------------------------------------------------------------------
    # API pública
    # ------------------------------------------------------------------

    @staticmethod
    def compute(user) -> Any:
        """
        Calcula el progreso de onboarding del usuario y guarda los resultados.

        Pasos:
        1. Obtiene o crea UserOnboarding para el usuario.
        2. Calcula has_photo, has_firma, has_emergencia.
        3. Calcula profile_percentage con pesos configurados.
        4. Calcula steps_completed según onboarding_type.
        5. Persiste UserOnboarding (update_fields para eficiencia).
        6. Cachea el resultado en Redis por 5 min.
        7. Retorna la instancia UserOnboarding actualizada.

        Args:
            user: Instancia de User (core.User)

        Returns:
            UserOnboarding actualizado
        """
        UserOnboarding = apps.get_model('core', 'UserOnboarding')
        onboarding, _ = UserOnboarding.objects.get_or_create(user=user)

        # ── 0. Recalcular onboarding_type (puede cambiar si el cargo cambia)
        from apps.core.models.models_onboarding import _resolve_onboarding_type
        current_type = _resolve_onboarding_type(user)
        if onboarding.onboarding_type != current_type:
            logger.info(
                'Onboarding type actualizado para User %s: %s → %s',
                user.pk, onboarding.onboarding_type, current_type
            )
            onboarding.onboarding_type = current_type
            onboarding.save(update_fields=['onboarding_type', 'updated_at'])

        # ── 1. Foto ───────────────────────────────────────────────────
        has_photo = bool(getattr(user, 'photo', None))

        # ── 2. Firma ─────────────────────────────────────────────────
        has_firma = bool(getattr(user, 'firma_guardada', None))

        # ── 3. Contacto de emergencia (via InfoPersonal en mi_equipo) ─
        # Superadmin: no aplica (identidad de plataforma, no empleado)
        if getattr(user, 'is_superuser', False):
            has_emergencia = False
        else:
            has_emergencia = OnboardingService._check_emergencia(user)

        # ── 4. Porcentaje de perfil ───────────────────────────────────
        profile_percentage = OnboardingService._calc_profile_percentage(
            user, has_photo, has_firma, has_emergencia
        )

        # ── 5. Pasos por tipo ─────────────────────────────────────────
        steps_completed = OnboardingService._calc_steps(
            user, onboarding, has_photo, has_firma
        )

        # ── 6. Persistir ──────────────────────────────────────────────
        onboarding.has_photo = has_photo
        onboarding.has_firma = has_firma
        onboarding.has_emergencia = has_emergencia
        onboarding.profile_percentage = profile_percentage
        onboarding.steps_completed = steps_completed
        onboarding.save(update_fields=[
            'has_photo',
            'has_firma',
            'has_emergencia',
            'profile_percentage',
            'steps_completed',
            'updated_at',
        ])

        # ── 7. Cachear ────────────────────────────────────────────────
        cache_key = _CACHE_KEY_TEMPLATE.format(user_id=user.pk)
        try:
            cache.set(cache_key, {
                'has_photo':          has_photo,
                'has_firma':          has_firma,
                'has_emergencia':     has_emergencia,
                'profile_percentage': profile_percentage,
                'steps_completed':    steps_completed,
                'onboarding_type':    onboarding.onboarding_type,
            }, timeout=_CACHE_TTL)
        except Exception as exc:
            logger.warning(
                'No se pudo cachear onboarding para User %s: %s',
                user.pk, exc
            )

        logger.debug(
            'Onboarding calculado para User %s (%s): perfil=%s%%, pasos=%s',
            user.pk, user.email, profile_percentage,
            sum(1 for v in steps_completed.values() if v)
        )
        return onboarding

    @staticmethod
    def invalidate_cache(user_id: int) -> None:
        """
        Elimina la entrada de cache de onboarding para el usuario dado.

        Se llama cuando User, Colaborador o InfoPersonal son modificados,
        para forzar recálculo en el próximo acceso.

        Args:
            user_id: PK del User
        """
        cache_key = _CACHE_KEY_TEMPLATE.format(user_id=user_id)
        try:
            cache.delete(cache_key)
            logger.debug('Cache onboarding invalidado para User %s', user_id)
        except Exception as exc:
            logger.warning(
                'No se pudo invalidar cache onboarding para User %s: %s',
                user_id, exc
            )

    @staticmethod
    def get_steps_definition(onboarding_type: str) -> list:
        """
        Retorna la lista ordenada de pasos para el tipo de onboarding dado.

        Cada paso es un dict con:
            key:         str  — identificador único del paso
            label:       str  — texto mostrado al usuario (español)
            description: str  — descripción breve
            icon:        str  — nombre de ícono Lucide

        Args:
            onboarding_type: 'admin' | 'jefe' | 'contratista' | 'empleado' | 'proveedor' | 'cliente'

        Returns:
            Lista de dicts de pasos en orden de presentación
        """
        definitions = {
            'admin': [
                {
                    'key': 'empresa',
                    'label': 'Configura tu empresa',
                    'description': 'Ingresa el NIT y razón social en Configuración General.',
                    'icon': 'Building2',
                },
                {
                    'key': 'sedes',
                    'label': 'Registra tus sedes',
                    'description': 'Agrega al menos una sede de la empresa.',
                    'icon': 'MapPin',
                },
                {
                    'key': 'identidad',
                    'label': 'Define la identidad corporativa',
                    'description': 'Completa la misión y visión de tu organización.',
                    'icon': 'Target',
                },
                {
                    'key': 'valores',
                    'label': 'Establece los valores corporativos',
                    'description': 'Define los valores que guían a tu empresa.',
                    'icon': 'Star',
                },
                {
                    'key': 'estructura',
                    'label': 'Crea la estructura organizacional',
                    'description': 'Agrega áreas y cargos para tu organización.',
                    'icon': 'Network',
                },
                {
                    'key': 'perfil',
                    'label': 'Completa tu perfil de administrador',
                    'description': 'Sube tu foto y registra tu firma digital.',
                    'icon': 'UserCircle',
                },
                {
                    'key': 'invitar',
                    'label': 'Invita tu primer colaborador',
                    'description': 'Agrega al menos un usuario activo a tu empresa.',
                    'icon': 'UserPlus',
                },
                {
                    'key': 'primer_documento',
                    'label': 'Crea tu primer documento',
                    'description': 'Genera un documento desde cualquier módulo para verificar la plataforma.',
                    'icon': 'FileText',
                },
            ],
            'jefe': [
                {
                    'key': 'perfil',
                    'label': 'Completa tu perfil',
                    'description': 'Agrega tu foto y firma digital.',
                    'icon': 'UserCircle',
                },
                {
                    'key': 'emergencia',
                    'label': 'Registra contacto de emergencia',
                    'description': 'Ingresa el nombre y teléfono de tu contacto de emergencia.',
                    'icon': 'Phone',
                },
                {
                    'key': 'primer_lectura',
                    'label': 'Revisa tu equipo',
                    'description': 'Visita Mi Equipo para conocer los miembros de tu área.',
                    'icon': 'Users',
                },
            ],
            'empleado': [
                {
                    'key': 'perfil',
                    'label': 'Completa tu perfil',
                    'description': 'Sube tu foto de perfil.',
                    'icon': 'UserCircle',
                },
                {
                    'key': 'emergencia',
                    'label': 'Registra contacto de emergencia',
                    'description': 'Ingresa el nombre y teléfono de tu contacto de emergencia.',
                    'icon': 'Phone',
                },
                {
                    'key': 'firma',
                    'label': 'Configura tu firma digital',
                    'description': 'La necesitarás cuando debas firmar documentos.',
                    'icon': 'PenTool',
                },
                {
                    'key': 'primer_lectura',
                    'label': 'Revisa tus lecturas pendientes',
                    'description': 'Visita Mi Portal para ver documentos asignados.',
                    'icon': 'BookOpen',
                },
            ],
            'contratista': [
                {
                    'key': 'perfil',
                    'label': 'Completa tu perfil',
                    'description': 'Agrega tu foto y firma digital.',
                    'icon': 'UserCircle',
                },
                {
                    'key': 'firma',
                    'label': 'Configura tu firma digital',
                    'description': 'Registra tu firma para aprobar documentos electrónicamente.',
                    'icon': 'PenTool',
                },
                {
                    'key': 'politicas',
                    'label': 'Lee las políticas del cliente',
                    'description': 'Revisa las políticas y reglamentos internos de la empresa.',
                    'icon': 'FileText',
                },
                {
                    'key': 'hseq',
                    'label': 'Verifica tu cumplimiento HSEQ',
                    'description': 'Confirma tus exámenes médicos, EPP y certificaciones SST.',
                    'icon': 'ShieldCheck',
                },
            ],
            'proveedor': [
                {
                    'key': 'perfil',
                    'label': 'Completa tu perfil',
                    'description': 'Agrega tu foto de perfil.',
                    'icon': 'UserCircle',
                },
                {
                    'key': 'primer_lectura',
                    'label': 'Revisa tus documentos pendientes',
                    'description': 'Visita el portal para ver órdenes y documentos.',
                    'icon': 'FileText',
                },
            ],
            'cliente': [
                {
                    'key': 'perfil',
                    'label': 'Completa tu perfil',
                    'description': 'Agrega tu foto de perfil.',
                    'icon': 'UserCircle',
                },
                {
                    'key': 'primer_lectura',
                    'label': 'Revisa tus pedidos',
                    'description': 'Visita el portal para ver tus pedidos y documentos.',
                    'icon': 'ShoppingBag',
                },
            ],
        }
        return definitions.get(onboarding_type, definitions['empleado'])

    # ------------------------------------------------------------------
    # Helpers privados
    # ------------------------------------------------------------------

    @staticmethod
    def _check_emergencia(user) -> bool:
        """
        Verifica si el usuario tiene contacto de emergencia registrado.

        Accede a InfoPersonal via Colaborador para respetar la independencia C2.
        Retorna False si el usuario no tiene colaborador o InfoPersonal.
        """
        try:
            colaborador = getattr(user, 'colaborador', None)
            if colaborador is None:
                return False
            info = getattr(colaborador, 'info_personal', None)
            if info is None:
                return False
            return bool(
                getattr(info, 'nombre_contacto_emergencia', '').strip()
                and getattr(info, 'telefono_contacto_emergencia', '').strip()
            )
        except Exception as exc:
            logger.debug(
                'No se pudo verificar emergencia para User %s: %s',
                getattr(user, 'pk', '?'), exc
            )
            return False

    @staticmethod
    def _calc_profile_percentage(user, has_photo: bool, has_firma: bool, has_emergencia: bool) -> int:
        """
        Calcula el porcentaje de completitud del perfil con pesos definidos.

        Fuentes de datos:
        - User.photo, User.firma_guardada
        - Colaborador.email_personal, Colaborador.telefono_movil
        - InfoPersonal.direccion, InfoPersonal.ciudad
        - User.first_name/last_name (nombre_completo)
        - User.document_number (documento)

        Superadmin tiene pesos simplificados (sin dependencia de Colaborador).
        """
        # ── Superadmin: pesos simplificados (identidad de plataforma) ──
        # Sin firma: superadmin no participa en workflows de firma documental.
        if getattr(user, 'is_superuser', False):
            earned = 0
            if has_photo:
                earned += 25
            nombre = (
                f"{getattr(user, 'first_name', '') or ''} "
                f"{getattr(user, 'last_name', '') or ''}"
            ).strip()
            if nombre:
                earned += 30
            doc = getattr(user, 'document_number', '') or ''
            if doc and not doc.startswith('TEMP-'):
                earned += 45
            return min(earned, 100)

        # ── Usuario regular: pesos completos ──
        weights = OnboardingService._PROFILE_WEIGHTS
        earned = 0

        # Foto
        if has_photo:
            earned += weights['photo']

        # Firma
        if has_firma:
            earned += weights['firma']

        # Emergencia
        if has_emergencia:
            earned += weights['emergencia']

        # Nombre completo
        nombre_completo = f"{getattr(user, 'first_name', '') or ''} {getattr(user, 'last_name', '') or ''}".strip()
        if nombre_completo:
            earned += weights['nombre_completo']

        # Documento
        if getattr(user, 'document_number', ''):
            earned += weights['documento']

        # Datos desde Colaborador (C2 — acceso directo via relación)
        try:
            colaborador = getattr(user, 'colaborador', None)
            if colaborador:
                if getattr(colaborador, 'email_personal', ''):
                    earned += weights['email_personal']
                if getattr(colaborador, 'telefono_movil', ''):
                    earned += weights['celular']

                # Datos desde InfoPersonal
                info = getattr(colaborador, 'info_personal', None)
                if info:
                    if getattr(info, 'direccion', ''):
                        earned += weights['direccion']
                    if getattr(info, 'ciudad', ''):
                        earned += weights['ciudad']
        except Exception as exc:
            logger.debug(
                'Error leyendo datos de Colaborador para porcentaje de perfil User %s: %s',
                getattr(user, 'pk', '?'), exc
            )

        return min(earned, 100)

    @staticmethod
    def _calc_steps(user, onboarding, has_photo: bool, has_firma: bool) -> dict:
        """
        Calcula los pasos completados según el tipo de onboarding.

        Para el tipo 'admin' también calcula los pasos de fundación
        (empresa, sedes, identidad, valores, estructura).

        Retorna un dict {step_key: bool}.
        """
        onboarding_type = onboarding.onboarding_type

        # Paso de perfil: foto + firma para jefe/contratista, solo foto para admin/empleado
        perfil_completo = has_photo and has_firma

        if onboarding_type == 'admin':
            # Superadmin: solo foto (no firma — no participa en workflows)
            return OnboardingService._calc_admin_steps(user, has_photo)

        if onboarding_type == 'jefe':
            has_emergencia = onboarding.has_emergencia
            primer_lectura = OnboardingService._check_step_marked(
                onboarding, 'primer_lectura'
            )
            return {
                'perfil':         perfil_completo,
                'emergencia':     has_emergencia,
                'primer_lectura': primer_lectura,
            }

        if onboarding_type == 'empleado':
            # D2: perfil solo requiere foto (quick win), firma es paso separado
            has_emergencia = onboarding.has_emergencia
            primer_lectura = OnboardingService._check_step_marked(
                onboarding, 'primer_lectura'
            )
            return {
                'perfil':         has_photo,
                'emergencia':     has_emergencia,
                'firma':          has_firma,
                'primer_lectura': primer_lectura,
            }

        if onboarding_type == 'contratista':
            return {
                'perfil':     perfil_completo,
                'firma':      has_firma,
                'politicas':  False,  # placeholder — se activa cuando lea políticas
                'hseq':       False,  # placeholder — se activa cuando complete HSEQ
            }

        # proveedor / cliente
        primer_lectura = OnboardingService._check_step_marked(
            onboarding, 'primer_lectura'
        )
        return {
            'perfil':         has_photo,
            'primer_lectura': primer_lectura,
        }

    @staticmethod
    def _calc_admin_steps(user, perfil_completo: bool) -> dict:
        """
        Calcula los pasos de onboarding para el tipo 'admin'.
        Consulta los modelos de fundación usando apps.get_model().

        Pasos evaluados:
        - empresa:          Tenant tiene nit y razon_social
        - sedes:            SedeEmpresa existe al menos una
        - identidad:        CorporateIdentity tiene misión y visión
        - valores:          CorporateValue existe al menos uno
        - estructura:       Area y Cargo existen
        - perfil:           has_photo (superadmin no firma documentos)
        - invitar:          existe al menos un User activo no superuser
        - primer_documento: existe al menos un Documento creado por este usuario
        """
        steps = {
            'empresa':          False,
            'sedes':            False,
            'identidad':        False,
            'valores':          False,
            'estructura':       False,
            'perfil':           perfil_completo,
            'invitar':          False,
            'primer_documento': False,
        }

        # ── empresa ───────────────────────────────────────────────────
        # Los datos fiscales (NIT, razón social) están en Tenant (schema public),
        # NO en EmpresaConfig (eliminado). Leer desde connection.tenant.
        try:
            from django.db import connection as db_connection
            tenant = getattr(db_connection, 'tenant', None)
            if tenant:
                nit = getattr(tenant, 'nit', '') or ''
                razon_social = getattr(tenant, 'razon_social', '') or ''
                if (
                    nit
                    and nit != '000000000-0'
                    and razon_social
                    and razon_social != 'Empresa Sin Configurar'
                ):
                    steps['empresa'] = True
        except Exception as exc:
            logger.debug('Error verificando datos empresa del tenant: %s', exc)

        # ── sedes ─────────────────────────────────────────────────────
        try:
            SedeEmpresa = apps.get_model('configuracion', 'SedeEmpresa')
            steps['sedes'] = SedeEmpresa.objects.exists()
        except LookupError:
            logger.debug('Modelo SedeEmpresa no disponible para onboarding admin')
        except Exception as exc:
            logger.debug('Error verificando SedeEmpresa: %s', exc)

        # ── identidad ─────────────────────────────────────────────────
        # label de la app: 'identidad' (ver apps.gestion_estrategica.identidad.apps)
        try:
            CorporateIdentity = apps.get_model('identidad', 'CorporateIdentity')
            identidad = CorporateIdentity.objects.first()
            if identidad and getattr(identidad, 'mission', '').strip() and getattr(identidad, 'vision', '').strip():
                steps['identidad'] = True
        except LookupError:
            logger.debug('Modelo CorporateIdentity no disponible para onboarding admin')
        except Exception as exc:
            logger.debug('Error verificando CorporateIdentity: %s', exc)

        # ── valores ───────────────────────────────────────────────────
        try:
            CorporateValue = apps.get_model('identidad', 'CorporateValue')
            steps['valores'] = CorporateValue.objects.exists()
        except LookupError:
            logger.debug('Modelo CorporateValue no disponible para onboarding admin')
        except Exception as exc:
            logger.debug('Error verificando CorporateValue: %s', exc)

        # ── estructura ────────────────────────────────────────────────
        # label de la app: 'organizacion' (ver apps.gestion_estrategica.organizacion.apps)
        try:
            Area = apps.get_model('organizacion', 'Area')
            Cargo = apps.get_model('core', 'Cargo')
            steps['estructura'] = Area.objects.exists() and Cargo.objects.exists()
        except LookupError:
            logger.debug('Modelos Area/Cargo no disponibles para onboarding admin')
        except Exception as exc:
            logger.debug('Error verificando Area/Cargo: %s', exc)

        # ── invitar ───────────────────────────────────────────────────
        try:
            User = apps.get_model('core', 'User')
            steps['invitar'] = User.objects.filter(
                is_active=True,
                is_superuser=False,
            ).exists()
        except Exception as exc:
            logger.debug('Error verificando usuarios invitados: %s', exc)

        # ── primer_documento ─────────────────────────────────────────
        steps['primer_documento'] = OnboardingService._check_primer_documento(user)

        return steps

    # ------------------------------------------------------------------
    # Helpers para pasos medibles
    # ------------------------------------------------------------------

    @staticmethod
    def _check_primer_documento(user) -> bool:
        """
        Verifica si el usuario ha creado al menos un Documento en
        gestión documental. Acceso C2 via apps.get_model().
        """
        try:
            Documento = apps.get_model('gestion_documental', 'Documento')
            return Documento.objects.filter(elaborado_por=user).exists()
        except LookupError:
            logger.debug('Modelo Documento no disponible para onboarding')
            return False
        except Exception as exc:
            logger.debug('Error verificando primer documento: %s', exc)
            return False

    @staticmethod
    def _check_step_marked(onboarding, step_key: str) -> bool:
        """
        Verifica si un paso fue marcado manualmente como completado
        en el JSONField steps_completed del onboarding.

        Se usa para pasos que se completan via el endpoint
        POST /api/core/onboarding/mark-step/ (e.g. primer_lectura).
        """
        steps = onboarding.steps_completed or {}
        return bool(steps.get(step_key, False))
