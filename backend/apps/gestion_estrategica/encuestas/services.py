"""
Servicios para Encuestas Colaborativas DOFA
============================================

Servicios de negocio para:
- Envío de notificaciones a participantes
- Consolidación de respuestas en factores DOFA
- Generación de tokens anónimos
- Cálculo de estadísticas
"""
import uuid
import hashlib
from typing import List, Optional, Dict, Any
from django.db import transaction
from django.utils import timezone
from django.db.models import Count, Q

from .models import (
    EncuestaDofa,
    TemaEncuesta,
    ParticipanteEncuesta,
    RespuestaEncuesta
)
from apps.gestion_estrategica.contexto.models import FactorDOFA


class EncuestaService:
    """
    Servicio principal para gestión de encuestas DOFA.
    """

    @staticmethod
    def generar_token_anonimo(ip: str, user_agent: str) -> str:
        """
        Genera un token único para respuestas anónimas.
        Basado en IP y User-Agent para evitar duplicados del mismo dispositivo.
        """
        data = f"{ip}:{user_agent}:{uuid.uuid4()}"
        return hashlib.sha256(data.encode()).hexdigest()[:64]

    @staticmethod
    def obtener_usuarios_por_participantes(encuesta: EncuestaDofa) -> List:
        """
        Obtiene la lista de usuarios a partir de los participantes definidos.
        Expande áreas y cargos a usuarios individuales.
        """
        from django.contrib.auth import get_user_model
        User = get_user_model()

        usuarios = set()
        participantes = encuesta.participantes.all()

        for participante in participantes:
            if participante.tipo == ParticipanteEncuesta.TipoParticipante.USUARIO:
                if participante.usuario and participante.usuario.is_active:
                    usuarios.add(participante.usuario)

            elif participante.tipo == ParticipanteEncuesta.TipoParticipante.AREA:
                if participante.area:
                    # Obtener usuarios del área
                    users_area = User.objects.filter(
                        cargo__area=participante.area,
                        is_active=True
                    )
                    usuarios.update(users_area)

            elif participante.tipo == ParticipanteEncuesta.TipoParticipante.CARGO:
                if participante.cargo:
                    # Obtener usuarios del cargo
                    users_cargo = User.objects.filter(
                        cargo=participante.cargo,
                        is_active=True
                    )
                    usuarios.update(users_cargo)

        return list(usuarios)

    @staticmethod
    def enviar_notificaciones(encuesta: EncuestaDofa) -> Dict[str, Any]:
        """
        Envía notificaciones a todos los participantes de la encuesta.
        Usa el NotificationService existente.

        Returns:
            Dict con estadísticas del envío
        """
        from apps.audit_system.centro_notificaciones.services import NotificationService

        usuarios = EncuestaService.obtener_usuarios_por_participantes(encuesta)

        if not usuarios:
            return {
                'success': False,
                'mensaje': 'No hay participantes definidos',
                'enviados': 0
            }

        # Datos para la notificación
        datos_extra = {
            'encuesta_id': encuesta.id,
            'encuesta_titulo': encuesta.titulo,
            'fecha_cierre': encuesta.fecha_cierre.isoformat(),
            'enlace': f"/gestion-estrategica/encuestas/{encuesta.id}/responder/"
        }

        # Enviar notificación masiva
        try:
            NotificationService.send_bulk_notification(
                tipo_codigo='ENCUESTA_DOFA',
                usuarios=usuarios,
                titulo=f"📋 Nueva encuesta: {encuesta.titulo}",
                mensaje=(
                    f"Se te ha invitado a participar en la encuesta DOFA "
                    f"'{encuesta.titulo}'. Tu opinión es importante para "
                    f"identificar fortalezas y debilidades organizacionales. "
                    f"Fecha límite: {encuesta.fecha_cierre.strftime('%d/%m/%Y %H:%M')}"
                ),
                url=datos_extra['enlace'],
                datos_extra=datos_extra,
                prioridad='normal'
            )

            # Actualizar estado de participantes
            encuesta.participantes.update(
                estado=ParticipanteEncuesta.EstadoParticipacion.NOTIFICADO,
                fecha_notificacion=timezone.now()
            )

            # Actualizar encuesta
            encuesta.notificacion_enviada = True
            encuesta.fecha_notificacion = timezone.now()
            encuesta.total_invitados = len(usuarios)
            encuesta.save(update_fields=[
                'notificacion_enviada',
                'fecha_notificacion',
                'total_invitados',
                'updated_at'
            ])

            return {
                'success': True,
                'mensaje': f'Notificaciones enviadas a {len(usuarios)} usuarios',
                'enviados': len(usuarios)
            }

        except Exception as e:
            return {
                'success': False,
                'mensaje': f'Error al enviar notificaciones: {str(e)}',
                'enviados': 0
            }

    @staticmethod
    def enviar_recordatorio(encuesta: EncuestaDofa) -> Dict[str, Any]:
        """
        Envía recordatorio a participantes que no han respondido.
        """
        from apps.audit_system.centro_notificaciones.services import NotificationService

        # Obtener usuarios que no han respondido
        usuarios_respondieron = encuesta.respuestas.values_list(
            'respondente_id', flat=True
        ).distinct()

        usuarios_pendientes = []
        for participante in encuesta.participantes.filter(
            estado__in=[
                ParticipanteEncuesta.EstadoParticipacion.NOTIFICADO,
                ParticipanteEncuesta.EstadoParticipacion.EN_PROGRESO
            ]
        ):
            if participante.usuario and participante.usuario.id not in usuarios_respondieron:
                usuarios_pendientes.append(participante.usuario)

        if not usuarios_pendientes:
            return {
                'success': True,
                'mensaje': 'Todos los participantes han respondido',
                'enviados': 0
            }

        try:
            NotificationService.send_bulk_notification(
                tipo_codigo='ENCUESTA_DOFA_RECORDATORIO',
                usuarios=usuarios_pendientes,
                titulo=f"⏰ Recordatorio: {encuesta.titulo}",
                mensaje=(
                    f"Te recordamos que aún no has completado la encuesta DOFA "
                    f"'{encuesta.titulo}'. La fecha límite es "
                    f"{encuesta.fecha_cierre.strftime('%d/%m/%Y %H:%M')}."
                ),
                url=f"/gestion-estrategica/encuestas/{encuesta.id}/responder/",
                prioridad='alta'
            )

            return {
                'success': True,
                'mensaje': f'Recordatorios enviados a {len(usuarios_pendientes)} usuarios',
                'enviados': len(usuarios_pendientes)
            }

        except Exception as e:
            return {
                'success': False,
                'mensaje': f'Error al enviar recordatorios: {str(e)}',
                'enviados': 0
            }

    @staticmethod
    @transaction.atomic
    def consolidar_en_dofa(encuesta: EncuestaDofa, umbral_consenso: float = 0.6) -> Dict[str, Any]:
        """
        Consolida las respuestas de la encuesta en factores DOFA.

        Args:
            encuesta: La encuesta a consolidar
            umbral_consenso: Porcentaje mínimo para considerar consenso (0.6 = 60%)

        Returns:
            Dict con estadísticas de la consolidación
        """
        if encuesta.estado != EncuestaDofa.EstadoEncuesta.CERRADA:
            return {
                'success': False,
                'mensaje': 'La encuesta debe estar cerrada para consolidar',
                'factores_creados': 0
            }

        factores_creados = []
        temas_sin_consenso = []

        for tema in encuesta.temas.all():
            respuestas = tema.respuestas.all()
            total_respuestas = respuestas.count()

            if total_respuestas == 0:
                continue

            # Contar votos
            votos_fortaleza = respuestas.filter(
                clasificacion=RespuestaEncuesta.Clasificacion.FORTALEZA
            ).count()
            votos_debilidad = respuestas.filter(
                clasificacion=RespuestaEncuesta.Clasificacion.DEBILIDAD
            ).count()

            # Calcular porcentajes
            pct_fortaleza = votos_fortaleza / total_respuestas
            pct_debilidad = votos_debilidad / total_respuestas

            # Determinar clasificación por consenso
            if pct_fortaleza >= umbral_consenso:
                tipo_factor = FactorDOFA.TipoFactor.FORTALEZA
            elif pct_debilidad >= umbral_consenso:
                tipo_factor = FactorDOFA.TipoFactor.DEBILIDAD
            else:
                temas_sin_consenso.append({
                    'tema': tema.titulo,
                    'votos_fortaleza': votos_fortaleza,
                    'votos_debilidad': votos_debilidad,
                    'total': total_respuestas
                })
                continue

            # Calcular impacto promedio
            impacto_mapping = {'alto': 3, 'medio': 2, 'bajo': 1}
            impactos = respuestas.values_list('impacto_percibido', flat=True)
            promedio_impacto = sum(impacto_mapping.get(i, 2) for i in impactos) / total_respuestas

            if promedio_impacto >= 2.5:
                nivel_impacto = FactorDOFA.NivelImpacto.ALTO
            elif promedio_impacto >= 1.5:
                nivel_impacto = FactorDOFA.NivelImpacto.MEDIO
            else:
                nivel_impacto = FactorDOFA.NivelImpacto.BAJO

            # Recopilar justificaciones
            justificaciones = respuestas.exclude(
                justificacion=''
            ).values_list('justificacion', flat=True)[:5]

            evidencias = "\n".join([
                f"- {j}" for j in justificaciones
            ]) if justificaciones else ""

            # Crear factor DOFA
            factor = FactorDOFA.objects.create(
                empresa=encuesta.empresa,
                analisis=encuesta.analisis_dofa,
                tipo=tipo_factor,
                descripcion=tema.titulo,
                area=tema.area,
                impacto=nivel_impacto,
                evidencias=evidencias,
                fuente='encuesta',
                votos_fortaleza=votos_fortaleza,
                votos_debilidad=votos_debilidad
            )

            factores_creados.append({
                'id': factor.id,
                'tema': tema.titulo,
                'tipo': tipo_factor,
                'votos_a_favor': votos_fortaleza if tipo_factor == 'fortaleza' else votos_debilidad,
                'total_votos': total_respuestas
            })

        # Actualizar estado de la encuesta
        encuesta.estado = EncuestaDofa.EstadoEncuesta.PROCESADA
        encuesta.save(update_fields=['estado', 'updated_at'])

        return {
            'success': True,
            'mensaje': f'Consolidación completada. {len(factores_creados)} factores creados.',
            'factores_creados': len(factores_creados),
            'factores': factores_creados,
            'sin_consenso': temas_sin_consenso,
            'umbral_usado': umbral_consenso
        }

    @staticmethod
    def obtener_estadisticas(encuesta: EncuestaDofa) -> Dict[str, Any]:
        """
        Obtiene estadísticas detalladas de la encuesta.
        """
        temas_stats = []

        for tema in encuesta.temas.all():
            respuestas = tema.respuestas.all()
            total = respuestas.count()

            if total > 0:
                fortalezas = respuestas.filter(
                    clasificacion=RespuestaEncuesta.Clasificacion.FORTALEZA
                ).count()
                debilidades = total - fortalezas

                temas_stats.append({
                    'id': tema.id,
                    'titulo': tema.titulo,
                    'area': tema.area.name if tema.area else None,
                    'total_respuestas': total,
                    'fortalezas': fortalezas,
                    'debilidades': debilidades,
                    'pct_fortaleza': round((fortalezas / total) * 100, 1),
                    'pct_debilidad': round((debilidades / total) * 100, 1),
                    'consenso': tema.clasificacion_consenso
                })

        # Participación general
        usuarios_unicos = encuesta.respuestas.values(
            'respondente'
        ).distinct().count()

        return {
            'encuesta_id': encuesta.id,
            'titulo': encuesta.titulo,
            'estado': encuesta.estado,
            'fecha_inicio': encuesta.fecha_inicio,
            'fecha_cierre': encuesta.fecha_cierre,
            'total_invitados': encuesta.total_invitados,
            'total_respondieron': usuarios_unicos,
            'porcentaje_participacion': encuesta.porcentaje_participacion,
            'temas': temas_stats,
            'total_temas': len(temas_stats),
            'esta_vigente': encuesta.esta_vigente
        }

    @staticmethod
    def puede_responder(
        encuesta: EncuestaDofa,
        usuario=None,
        token_anonimo: str = None
    ) -> Dict[str, Any]:
        """
        Verifica si un usuario o token puede responder la encuesta.
        """
        # Verificar vigencia
        if not encuesta.esta_vigente:
            return {
                'puede': False,
                'razon': 'La encuesta no está vigente'
            }

        # Si es pública y hay token anónimo
        if encuesta.es_publica and token_anonimo:
            # Verificar si ya respondió con ese token
            ya_respondio = RespuestaEncuesta.objects.filter(
                tema__encuesta=encuesta,
                token_anonimo=token_anonimo
            ).exists()

            if ya_respondio:
                return {
                    'puede': False,
                    'razon': 'Ya has respondido esta encuesta'
                }
            return {'puede': True, 'razon': None}

        # Si hay usuario autenticado
        if usuario:
            # Verificar si ya respondió
            ya_respondio = RespuestaEncuesta.objects.filter(
                tema__encuesta=encuesta,
                respondente=usuario
            ).exists()

            if ya_respondio:
                return {
                    'puede': False,
                    'razon': 'Ya has respondido esta encuesta'
                }

            # Verificar si está invitado (si no es pública)
            if not encuesta.es_publica:
                esta_invitado = encuesta.participantes.filter(
                    Q(usuario=usuario) |
                    Q(area=usuario.cargo.area if hasattr(usuario, 'cargo') and usuario.cargo else None) |
                    Q(cargo=usuario.cargo if hasattr(usuario, 'cargo') else None)
                ).exists()

                if not esta_invitado:
                    return {
                        'puede': False,
                        'razon': 'No estás invitado a esta encuesta'
                    }

            return {'puede': True, 'razon': None}

        # Si la encuesta es pública y no hay identificación
        if encuesta.es_publica:
            return {'puede': True, 'razon': None}

        return {
            'puede': False,
            'razon': 'Debes iniciar sesión para responder'
        }
