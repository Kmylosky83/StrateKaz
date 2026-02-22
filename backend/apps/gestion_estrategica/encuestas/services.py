"""
Servicios para Encuestas de Contexto Organizacional
=====================================================

Servicios de negocio para:
- Envío de notificaciones a participantes
- Consolidación de respuestas en DOFA y PESTEL
- Compartir encuestas por email
- Generación de QR codes
- Generación de tokens anónimos
- Cálculo de estadísticas
"""
import io
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
from apps.gestion_estrategica.contexto.models import FactorDOFA, FactorPESTEL


class EncuestaService:
    """Servicio principal para gestión de encuestas de contexto."""

    @staticmethod
    def generar_token_anonimo(ip: str, user_agent: str) -> str:
        """Genera un token único para respuestas anónimas."""
        data = f"{ip}:{user_agent}:{uuid.uuid4()}"
        return hashlib.sha256(data.encode()).hexdigest()[:64]

    @staticmethod
    def obtener_usuarios_por_participantes(encuesta: EncuestaDofa) -> List:
        """Obtiene la lista de usuarios expandiendo áreas y cargos."""
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
                    users_area = User.objects.filter(
                        cargo__area=participante.area,
                        is_active=True
                    )
                    usuarios.update(users_area)
            elif participante.tipo == ParticipanteEncuesta.TipoParticipante.CARGO:
                if participante.cargo:
                    users_cargo = User.objects.filter(
                        cargo=participante.cargo,
                        is_active=True
                    )
                    usuarios.update(users_cargo)

        return list(usuarios)

    @staticmethod
    def enviar_notificaciones(encuesta: EncuestaDofa) -> Dict[str, Any]:
        """Envía notificaciones a todos los participantes de la encuesta."""
        from apps.audit_system.centro_notificaciones.services import NotificationService

        usuarios = EncuestaService.obtener_usuarios_por_participantes(encuesta)

        if not usuarios:
            return {
                'success': False,
                'mensaje': 'No hay participantes definidos',
                'enviados': 0
            }

        datos_extra = {
            'encuesta_id': encuesta.id,
            'encuesta_titulo': encuesta.titulo,
            'fecha_cierre': encuesta.fecha_cierre.isoformat(),
            'enlace': f"/gestion-estrategica/encuestas/{encuesta.id}/responder/"
        }

        try:
            NotificationService.send_bulk_notification(
                tipo_codigo='ENCUESTA_DOFA',
                usuarios=usuarios,
                titulo=f"Nueva encuesta: {encuesta.titulo}",
                mensaje=(
                    f"Se te ha invitado a participar en la encuesta "
                    f"'{encuesta.titulo}'. Tu opinión es importante para "
                    f"identificar el contexto organizacional. "
                    f"Fecha límite: {encuesta.fecha_cierre.strftime('%d/%m/%Y %H:%M')}"
                ),
                url=datos_extra['enlace'],
                datos_extra=datos_extra,
                prioridad='normal'
            )

            encuesta.participantes.update(
                estado=ParticipanteEncuesta.EstadoParticipacion.NOTIFICADO,
                fecha_notificacion=timezone.now()
            )

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
        """Envía recordatorio a participantes que no han respondido."""
        from apps.audit_system.centro_notificaciones.services import NotificationService

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
                titulo=f"Recordatorio: {encuesta.titulo}",
                mensaje=(
                    f"Te recordamos que aún no has completado la encuesta "
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

    # ==========================================================================
    # CONSOLIDACIÓN: ENCUESTA → DOFA + PESTEL
    # ==========================================================================

    @staticmethod
    @transaction.atomic
    def consolidar(encuesta: EncuestaDofa, umbral_consenso: float = 0.6) -> Dict[str, Any]:
        """
        Consolida las respuestas de la encuesta en factores DOFA y PESTEL.

        Para encuestas PCI-POAM:
        - PCI (F/D): Genera FactorDOFA tipo fortaleza o debilidad
        - POAM (O/A): Genera FactorDOFA tipo oportunidad o amenaza
                      + Genera FactorPESTEL con dimensión correcta

        Para encuestas libres: Comportamiento original (solo DOFA F/D).
        """
        if encuesta.estado != EncuestaDofa.EstadoEncuesta.CERRADA:
            return {
                'success': False,
                'mensaje': 'La encuesta debe estar cerrada para consolidar',
                'factores_dofa_creados': 0,
                'factores_pestel_creados': 0
            }

        es_pci_poam = encuesta.tipo_encuesta == EncuestaDofa.TipoEncuesta.PCI_POAM
        factores_dofa = []
        factores_pestel = []
        temas_sin_consenso = []

        for tema in encuesta.temas.select_related('pregunta_contexto').all():
            respuestas = tema.respuestas.all()
            total_respuestas = respuestas.count()

            if total_respuestas == 0:
                continue

            pregunta = tema.pregunta_contexto

            # Determinar clasificaciones válidas según perfil
            if es_pci_poam and pregunta:
                if pregunta.clasificacion_esperada == 'oa':
                    resultado = EncuestaService._clasificar_oa(respuestas, total_respuestas, umbral_consenso)
                else:
                    resultado = EncuestaService._clasificar_fd(respuestas, total_respuestas, umbral_consenso)
            else:
                resultado = EncuestaService._clasificar_fd(respuestas, total_respuestas, umbral_consenso)

            if resultado is None:
                temas_sin_consenso.append({
                    'tema': tema.titulo[:100],
                    'total': total_respuestas,
                    'codigo': pregunta.codigo if pregunta else None,
                })
                continue

            tipo_factor, votos_a_favor = resultado

            # Calcular impacto promedio
            nivel_impacto = EncuestaService._calcular_impacto(respuestas, total_respuestas)

            # Recopilar justificaciones
            evidencias = EncuestaService._recopilar_evidencias(respuestas)

            # Crear FactorDOFA
            if encuesta.analisis_dofa:
                factor_dofa = FactorDOFA.objects.create(
                    empresa=encuesta.empresa,
                    analisis=encuesta.analisis_dofa,
                    tipo=tipo_factor,
                    descripcion=tema.titulo,
                    area=tema.area,
                    impacto=nivel_impacto,
                    evidencias=evidencias,
                    fuente='encuesta_pci_poam' if es_pci_poam else 'encuesta',
                    votos_fortaleza=respuestas.filter(clasificacion='fortaleza').count(),
                    votos_debilidad=respuestas.filter(clasificacion='debilidad').count(),
                    votos_oportunidad=respuestas.filter(clasificacion='oportunidad').count(),
                    votos_amenaza=respuestas.filter(clasificacion='amenaza').count(),
                )
                factores_dofa.append({
                    'id': factor_dofa.id,
                    'tema': tema.titulo[:100],
                    'tipo': tipo_factor,
                    'votos_a_favor': votos_a_favor,
                    'total_votos': total_respuestas,
                })

            # Crear FactorPESTEL para preguntas POAM
            if (es_pci_poam and pregunta and pregunta.dimension_pestel
                    and encuesta.analisis_pestel):
                factor_pestel = FactorPESTEL.objects.create(
                    empresa=encuesta.empresa,
                    analisis=encuesta.analisis_pestel,
                    tipo=pregunta.dimension_pestel,
                    descripcion=tema.titulo,
                    tendencia='estable',
                    impacto=nivel_impacto,
                    probabilidad='media',
                    implicaciones=evidencias,
                    fuentes=f'Encuesta PCI-POAM: {encuesta.titulo}',
                )
                factores_pestel.append({
                    'id': factor_pestel.id,
                    'tema': tema.titulo[:100],
                    'dimension': pregunta.dimension_pestel,
                })

        # Actualizar estado
        encuesta.estado = EncuestaDofa.EstadoEncuesta.PROCESADA
        encuesta.save(update_fields=['estado', 'updated_at'])

        return {
            'success': True,
            'mensaje': (
                f'Consolidación completada. '
                f'{len(factores_dofa)} factores DOFA y '
                f'{len(factores_pestel)} factores PESTEL creados.'
            ),
            'factores_dofa_creados': len(factores_dofa),
            'factores_pestel_creados': len(factores_pestel),
            'factores_dofa': factores_dofa,
            'factores_pestel': factores_pestel,
            'sin_consenso': temas_sin_consenso,
            'umbral_usado': umbral_consenso,
        }

    @staticmethod
    def _clasificar_fd(respuestas, total, umbral):
        """Clasifica como Fortaleza o Debilidad por consenso."""
        fortalezas = respuestas.filter(clasificacion='fortaleza').count()
        debilidades = respuestas.filter(clasificacion='debilidad').count()

        pct_f = fortalezas / total
        pct_d = debilidades / total

        if pct_f >= umbral:
            return 'fortaleza', fortalezas
        elif pct_d >= umbral:
            return 'debilidad', debilidades
        return None

    @staticmethod
    def _clasificar_oa(respuestas, total, umbral):
        """Clasifica como Oportunidad o Amenaza por consenso."""
        oportunidades = respuestas.filter(clasificacion='oportunidad').count()
        amenazas = respuestas.filter(clasificacion='amenaza').count()

        pct_o = oportunidades / total
        pct_a = amenazas / total

        if pct_o >= umbral:
            return 'oportunidad', oportunidades
        elif pct_a >= umbral:
            return 'amenaza', amenazas
        return None

    @staticmethod
    def _calcular_impacto(respuestas, total):
        """Calcula nivel de impacto promedio."""
        mapping = {'alto': 3, 'medio': 2, 'bajo': 1}
        impactos = respuestas.values_list('impacto_percibido', flat=True)
        promedio = sum(mapping.get(i, 2) for i in impactos) / total

        if promedio >= 2.5:
            return 'alto'
        elif promedio >= 1.5:
            return 'medio'
        return 'bajo'

    @staticmethod
    def _recopilar_evidencias(respuestas):
        """Recopila las top justificaciones como evidencia."""
        justificaciones = respuestas.exclude(
            justificacion=''
        ).values_list('justificacion', flat=True)[:5]

        if justificaciones:
            return "\n".join([f"- {j}" for j in justificaciones])
        return ""

    # ==========================================================================
    # COMPARTIR POR EMAIL
    # ==========================================================================

    @staticmethod
    def compartir_por_email(
        encuesta: EncuestaDofa,
        emails: List[str],
        mensaje_personalizado: str = '',
        base_url: str = ''
    ) -> Dict[str, Any]:
        """Envía enlace de encuesta a emails externos usando template HTML."""
        from apps.audit_system.centro_notificaciones.email_service import EmailService

        if not encuesta.es_publica:
            return {
                'success': False,
                'message': 'La encuesta debe ser pública para compartir por email'
            }

        # Usar el enlace_publico del modelo (ya incluye dominio del tenant)
        enlace = encuesta.enlace_publico
        if not enlace.startswith('http') and base_url:
            enlace = f"{base_url}{enlace}"
        tipo_label = 'PCI-POAM' if encuesta.tipo_encuesta == 'pci_poam' else 'Contexto Organizacional'

        # Obtener nombre de la empresa
        empresa_nombre = 'Organización'
        try:
            from apps.gestion_estrategica.configuracion.models import EmpresaConfig
            config = EmpresaConfig.objects.first()
            if config:
                empresa_nombre = config.razon_social
        except Exception:
            pass

        asunto = f"Encuesta {tipo_label}: {encuesta.titulo}"

        context = {
            'encuesta_titulo': encuesta.titulo,
            'encuesta_descripcion': encuesta.descripcion or '',
            'tipo_label': tipo_label,
            'empresa_nombre': empresa_nombre,
            'responsable_nombre': encuesta.responsable.get_full_name() if encuesta.responsable else '',
            'fecha_cierre': encuesta.fecha_cierre.strftime('%d/%m/%Y %H:%M'),
            'mensaje_personalizado': mensaje_personalizado,
            'action_url': enlace,
        }

        enviados = 0
        errores = []

        for email in emails:
            try:
                EmailService.send_email(
                    to_email=email,
                    subject=asunto,
                    template_name='encuesta_compartida',
                    context=context,
                )
                enviados += 1
            except Exception as e:
                errores.append(f"{email}: {str(e)}")

        return {
            'success': enviados > 0,
            'message': f'{enviados} email(s) enviado(s) exitosamente' + (f', {len(errores)} error(es)' if errores else ''),
            'total_enviados': enviados,
            'errores': errores,
        }

    # ==========================================================================
    # QR CODE
    # ==========================================================================

    @staticmethod
    def generar_qr_code(encuesta: EncuestaDofa, base_url: str = '') -> bytes:
        """Genera QR code PNG con el enlace público de la encuesta."""
        import qrcode

        # Usar el enlace_publico del modelo (ya incluye dominio del tenant)
        enlace = encuesta.enlace_publico
        if not enlace.startswith('http') and base_url:
            enlace = f"{base_url}{enlace}"

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(enlace)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")

        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        return buffer.getvalue()

    # ==========================================================================
    # ESTADÍSTICAS
    # ==========================================================================

    @staticmethod
    def obtener_estadisticas(encuesta: EncuestaDofa) -> Dict[str, Any]:
        """Obtiene estadísticas detalladas de la encuesta."""
        temas_stats = []

        for tema in encuesta.temas.select_related('pregunta_contexto').all():
            respuestas = tema.respuestas.all()
            total = respuestas.count()

            if total > 0:
                fortalezas = respuestas.filter(clasificacion='fortaleza').count()
                debilidades = respuestas.filter(clasificacion='debilidad').count()
                oportunidades = respuestas.filter(clasificacion='oportunidad').count()
                amenazas = respuestas.filter(clasificacion='amenaza').count()

                pregunta = tema.pregunta_contexto
                tema_stat = {
                    'id': tema.id,
                    'titulo': tema.titulo,
                    'area': tema.area.name if tema.area else None,
                    'total_respuestas': total,
                    'fortalezas': fortalezas,
                    'debilidades': debilidades,
                    'oportunidades': oportunidades,
                    'amenazas': amenazas,
                    'consenso': tema.clasificacion_consenso,
                }
                if pregunta:
                    tema_stat['codigo'] = pregunta.codigo
                    tema_stat['perfil'] = pregunta.perfil
                    tema_stat['capacidad_pci'] = pregunta.capacidad_pci
                    tema_stat['factor_poam'] = pregunta.factor_poam

                temas_stats.append(tema_stat)

        usuarios_unicos = encuesta.respuestas.values(
            'respondente'
        ).distinct().count()

        return {
            'encuesta_id': encuesta.id,
            'titulo': encuesta.titulo,
            'estado': encuesta.estado,
            'tipo_encuesta': encuesta.tipo_encuesta,
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
        """Verifica si un usuario o token puede responder la encuesta."""
        if not encuesta.esta_vigente:
            return {
                'puede': False,
                'razon': 'La encuesta no está vigente'
            }

        if encuesta.es_publica and token_anonimo:
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

        if usuario:
            ya_respondio = RespuestaEncuesta.objects.filter(
                tema__encuesta=encuesta,
                respondente=usuario
            ).exists()

            if ya_respondio:
                return {
                    'puede': False,
                    'razon': 'Ya has respondido esta encuesta'
                }

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

        if encuesta.es_publica:
            return {'puede': True, 'razon': None}

        return {
            'puede': False,
            'razon': 'Debes iniciar sesión para responder'
        }
