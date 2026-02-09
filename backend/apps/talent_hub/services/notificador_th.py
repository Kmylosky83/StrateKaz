"""
Servicio de Notificaciones para Talent Hub.

Centraliza el envío de notificaciones para todos los submódulos
de Talent Hub, usando el NotificationService de audit_system.
"""
import logging
from apps.audit_system.centro_notificaciones.services import NotificationService

logger = logging.getLogger(__name__)


class NotificadorTH:
    """
    Servicio de notificaciones para Talent Hub.

    Usa NotificationService como canal de envío.
    Cada método corresponde a un evento de negocio del módulo.
    """

    # === PROCESO DISCIPLINARIO ===

    @staticmethod
    def notificar_citacion_descargos(descargo):
        """Notifica al colaborador sobre citación a descargos."""
        try:
            usuario = getattr(descargo.colaborador, 'user', None)
            if not usuario:
                return None
            return NotificationService.send_notification(
                tipo_codigo='TH_CITACION_DESCARGOS',
                usuario=usuario,
                datos={
                    'colaborador_nombre': descargo.colaborador.get_nombre_completo(),
                    'fecha_citacion': str(descargo.fecha_citacion),
                    'hora_citacion': str(descargo.hora_citacion),
                    'lugar': descargo.lugar_citacion,
                    'tipo_falta': descargo.tipo_falta.nombre,
                },
                url=f'/talent-hub/proceso-disciplinario/descargos/{descargo.id}'
            )
        except Exception as e:
            logger.error(f'Error notificando citación descargos: {e}')
            return None

    @staticmethod
    def notificar_sancion_aplicada(memorando):
        """Notifica al colaborador sobre sanción aplicada."""
        try:
            usuario = getattr(memorando.colaborador, 'user', None)
            if not usuario:
                return None
            return NotificationService.send_notification(
                tipo_codigo='TH_SANCION_APLICADA',
                usuario=usuario,
                datos={
                    'colaborador_nombre': memorando.colaborador.get_nombre_completo(),
                    'numero_memorando': memorando.numero_memorando,
                    'sancion': memorando.get_sancion_aplicada_display(),
                },
                url=f'/talent-hub/proceso-disciplinario/memorandos/{memorando.id}'
            )
        except Exception as e:
            logger.error(f'Error notificando sanción: {e}')
            return None

    # === CONTRATOS ===

    @staticmethod
    def notificar_contrato_por_vencer(colaborador, dias):
        """Notifica sobre contrato próximo a vencer."""
        try:
            usuario = getattr(colaborador, 'user', None)
            jefe = colaborador.cargo.parent_cargo if colaborador.cargo else None
            destinatarios = []
            if usuario:
                destinatarios.append(usuario)

            for dest in destinatarios:
                NotificationService.send_notification(
                    tipo_codigo='TH_CONTRATO_POR_VENCER',
                    usuario=dest,
                    datos={
                        'colaborador_nombre': colaborador.get_nombre_completo(),
                        'dias': dias,
                    },
                    url=f'/talent-hub/seleccion-contratacion/historial-contratos?colaborador={colaborador.id}'
                )
        except Exception as e:
            logger.error(f'Error notificando contrato por vencer: {e}')

    @staticmethod
    def notificar_contrato_firmado(historial_contrato):
        """Notifica que un contrato fue firmado."""
        try:
            usuario = getattr(historial_contrato.colaborador, 'user', None)
            if not usuario:
                return None
            return NotificationService.send_notification(
                tipo_codigo='TH_CONTRATO_FIRMADO',
                usuario=usuario,
                datos={
                    'numero_contrato': historial_contrato.numero_contrato,
                    'tipo_contrato': str(historial_contrato.tipo_contrato),
                },
                url=f'/talent-hub/seleccion-contratacion/historial-contratos/{historial_contrato.id}'
            )
        except Exception as e:
            logger.error(f'Error notificando contrato firmado: {e}')
            return None

    # === VACACIONES Y PERMISOS ===

    @staticmethod
    def notificar_vacaciones_solicitud(solicitud):
        """Notifica al jefe sobre solicitud de vacaciones."""
        try:
            colaborador = solicitud.colaborador
            jefe_user = None
            if colaborador.cargo and colaborador.cargo.parent_cargo:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                jefe_user = User.objects.filter(
                    cargo=colaborador.cargo.parent_cargo,
                    empresa=colaborador.empresa,
                    is_active=True
                ).first()

            if not jefe_user:
                return None
            return NotificationService.send_notification(
                tipo_codigo='TH_VACACIONES_SOLICITUD',
                usuario=jefe_user,
                datos={
                    'colaborador_nombre': colaborador.get_nombre_completo(),
                    'fecha_inicio': str(solicitud.fecha_inicio),
                    'fecha_fin': str(solicitud.fecha_fin),
                },
                url=f'/talent-hub/novedades/vacaciones/{solicitud.id}'
            )
        except Exception as e:
            logger.error(f'Error notificando solicitud vacaciones: {e}')
            return None

    @staticmethod
    def notificar_vacaciones_aprobadas(solicitud):
        """Notifica al empleado que sus vacaciones fueron aprobadas."""
        try:
            usuario = getattr(solicitud.colaborador, 'user', None)
            if not usuario:
                return None
            return NotificationService.send_notification(
                tipo_codigo='TH_VACACIONES_APROBADAS',
                usuario=usuario,
                datos={
                    'fecha_inicio': str(solicitud.fecha_inicio),
                    'fecha_fin': str(solicitud.fecha_fin),
                },
                url=f'/talent-hub/novedades/vacaciones/{solicitud.id}'
            )
        except Exception as e:
            logger.error(f'Error notificando vacaciones aprobadas: {e}')
            return None

    @staticmethod
    def notificar_vacaciones_rechazadas(solicitud):
        """Notifica al empleado que sus vacaciones fueron rechazadas."""
        try:
            usuario = getattr(solicitud.colaborador, 'user', None)
            if not usuario:
                return None
            return NotificationService.send_notification(
                tipo_codigo='TH_VACACIONES_RECHAZADAS',
                usuario=usuario,
                datos={
                    'fecha_inicio': str(solicitud.fecha_inicio),
                    'fecha_fin': str(solicitud.fecha_fin),
                },
                url=f'/talent-hub/novedades/vacaciones/{solicitud.id}'
            )
        except Exception as e:
            logger.error(f'Error notificando vacaciones rechazadas: {e}')
            return None

    @staticmethod
    def notificar_permiso_solicitud(permiso):
        """Notifica al jefe sobre solicitud de permiso."""
        try:
            colaborador = permiso.colaborador
            jefe_user = None
            if colaborador.cargo and colaborador.cargo.parent_cargo:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                jefe_user = User.objects.filter(
                    cargo=colaborador.cargo.parent_cargo,
                    empresa=colaborador.empresa,
                    is_active=True
                ).first()

            if not jefe_user:
                return None
            return NotificationService.send_notification(
                tipo_codigo='TH_PERMISO_SOLICITUD',
                usuario=jefe_user,
                datos={
                    'colaborador_nombre': colaborador.get_nombre_completo(),
                    'tipo_permiso': str(getattr(permiso, 'tipo', 'Permiso')),
                },
                url=f'/talent-hub/novedades/permisos/{permiso.id}'
            )
        except Exception as e:
            logger.error(f'Error notificando solicitud permiso: {e}')
            return None

    @staticmethod
    def notificar_incapacidad_registrada(incapacidad):
        """Notifica al jefe sobre incapacidad registrada."""
        try:
            colaborador = incapacidad.colaborador
            jefe_user = None
            if colaborador.cargo and colaborador.cargo.parent_cargo:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                jefe_user = User.objects.filter(
                    cargo=colaborador.cargo.parent_cargo,
                    empresa=colaborador.empresa,
                    is_active=True
                ).first()

            if not jefe_user:
                return None
            return NotificationService.send_notification(
                tipo_codigo='TH_INCAPACIDAD_REGISTRADA',
                usuario=jefe_user,
                datos={
                    'colaborador_nombre': colaborador.get_nombre_completo(),
                    'dias': getattr(incapacidad, 'dias_incapacidad', 0),
                },
                url=f'/talent-hub/novedades/incapacidades/{incapacidad.id}'
            )
        except Exception as e:
            logger.error(f'Error notificando incapacidad: {e}')
            return None

    # === FORMACIÓN ===

    @staticmethod
    def notificar_capacitacion_programada(programacion):
        """Notifica a asistentes sobre capacitación programada."""
        try:
            return NotificationService.send_notification(
                tipo_codigo='TH_CAPACITACION_PROGRAMADA',
                usuario=None,
                datos={
                    'nombre': getattr(programacion, 'nombre', str(programacion)),
                    'fecha': str(getattr(programacion, 'fecha_inicio', '')),
                },
                url=f'/talent-hub/formacion/programaciones/{programacion.id}'
            )
        except Exception as e:
            logger.error(f'Error notificando capacitación: {e}')
            return None

    # === EVALUACIÓN DE DESEMPEÑO ===

    @staticmethod
    def notificar_evaluacion_pendiente(evaluacion):
        """Notifica al empleado sobre evaluación pendiente."""
        try:
            usuario = getattr(evaluacion.colaborador, 'user', None)
            if not usuario:
                return None
            return NotificationService.send_notification(
                tipo_codigo='TH_EVALUACION_PENDIENTE',
                usuario=usuario,
                datos={
                    'periodo': str(getattr(evaluacion, 'periodo', '')),
                },
                url=f'/talent-hub/desempeno/evaluaciones/{evaluacion.id}'
            )
        except Exception as e:
            logger.error(f'Error notificando evaluación pendiente: {e}')
            return None

    # === ONBOARDING ===

    @staticmethod
    def notificar_onboarding_tarea(checklist):
        """Notifica al nuevo empleado sobre tarea de onboarding."""
        try:
            usuario = getattr(checklist.colaborador, 'user', None)
            if not usuario:
                return None
            return NotificationService.send_notification(
                tipo_codigo='TH_ONBOARDING_TAREA',
                usuario=usuario,
                datos={
                    'tarea': str(getattr(checklist, 'nombre', str(checklist))),
                },
                url=f'/talent-hub/onboarding/{checklist.id}'
            )
        except Exception as e:
            logger.error(f'Error notificando tarea onboarding: {e}')
            return None

    # === PERÍODO DE PRUEBA ===

    @staticmethod
    def notificar_periodo_prueba(colaborador, dias):
        """Notifica al jefe sobre periodo de prueba próximo a vencer."""
        try:
            jefe_user = None
            if colaborador.cargo and colaborador.cargo.parent_cargo:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                jefe_user = User.objects.filter(
                    cargo=colaborador.cargo.parent_cargo,
                    empresa=colaborador.empresa,
                    is_active=True
                ).first()

            if not jefe_user:
                return None
            return NotificationService.send_notification(
                tipo_codigo='TH_PERIODO_PRUEBA',
                usuario=jefe_user,
                datos={
                    'colaborador_nombre': colaborador.get_nombre_completo(),
                    'dias': dias,
                },
                url=f'/talent-hub/colaboradores/{colaborador.id}'
            )
        except Exception as e:
            logger.error(f'Error notificando periodo de prueba: {e}')
            return None

    # === HORAS EXTRA ===

    @staticmethod
    def notificar_horas_extra_limite(colaborador, horas):
        """Notifica al jefe y empleado sobre límite de horas extra."""
        try:
            destinatarios = []
            usuario = getattr(colaborador, 'user', None)
            if usuario:
                destinatarios.append(usuario)

            if colaborador.cargo and colaborador.cargo.parent_cargo:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                jefe = User.objects.filter(
                    cargo=colaborador.cargo.parent_cargo,
                    empresa=colaborador.empresa,
                    is_active=True
                ).first()
                if jefe:
                    destinatarios.append(jefe)

            for dest in destinatarios:
                NotificationService.send_notification(
                    tipo_codigo='TH_HORAS_EXTRA_LIMITE',
                    usuario=dest,
                    datos={
                        'colaborador_nombre': colaborador.get_nombre_completo(),
                        'horas_acumuladas': str(horas),
                    },
                    url=f'/talent-hub/control-tiempo/horas-extra?colaborador={colaborador.id}'
                )
        except Exception as e:
            logger.error(f'Error notificando límite horas extra: {e}')

    # === NÓMINA ===

    @staticmethod
    def notificar_nomina_liquidada(liquidacion):
        """Notifica al empleado que su nómina fue liquidada."""
        try:
            usuario = getattr(liquidacion.colaborador, 'user', None)
            if not usuario:
                return None
            return NotificationService.send_notification(
                tipo_codigo='TH_NOMINA_LIQUIDADA',
                usuario=usuario,
                datos={
                    'periodo': str(getattr(liquidacion, 'periodo', '')),
                },
                url=f'/talent-hub/nomina/liquidaciones/{liquidacion.id}'
            )
        except Exception as e:
            logger.error(f'Error notificando nómina liquidada: {e}')
            return None
