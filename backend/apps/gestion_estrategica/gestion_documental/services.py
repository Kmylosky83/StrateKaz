"""
DocumentoService - Servicio de lógica de negocio para Gestión Documental.
Patron @classmethod consistente con EvidenciaService, WorkflowExecutionService.

Integración con Centro de Notificaciones para transiciones de estado.
"""
import logging
from django.apps import apps
from django.utils import timezone
from django.db.models import Count, Q

from .models import (
    TipoDocumento,
    Documento,
    VersionDocumento,
    ControlDocumental,
)

logger = logging.getLogger(__name__)


def _send_notification(tipo_codigo, usuario, titulo, mensaje, url, datos_extra=None,
                       prioridad='normal'):
    """
    Envía notificación de forma segura (no falla si el servicio no está disponible).
    """
    try:
        from apps.audit_system.centro_notificaciones.services import NotificationService

        NotificationService.send_notification(
            tipo_codigo=tipo_codigo,
            usuario=usuario,
            titulo=titulo,
            mensaje=mensaje,
            url=url,
            datos_extra=datos_extra or {},
            prioridad=prioridad,
        )
    except Exception as e:
        logger.warning(f'[documental] No se pudo enviar notificación: {e}')

# Mapping: TipoDocumento.codigo -> ConsecutivoConfig.codigo
TIPO_DOC_TO_CONSECUTIVO = {
    'PR': 'PROCEDIMIENTO',
    'IN': 'INSTRUCTIVO',
    'FT': 'FORMATO',
}
# Cualquier otro tipo → fallback 'DOCUMENTO'
CONSECUTIVO_FALLBACK = 'DOCUMENTO'


class DocumentoService:
    """Servicio central para gestión documental."""

    @classmethod
    def generar_codigo(cls, tipo_documento, empresa_id):
        """
        Genera código único usando ConsecutivoConfig (thread-safe, select_for_update).
        Fallback a generación artesanal si no existe ConsecutivoConfig.
        """
        consecutivo_codigo = TIPO_DOC_TO_CONSECUTIVO.get(
            tipo_documento.codigo, CONSECUTIVO_FALLBACK
        )
        try:
            ConsecutivoConfig = apps.get_model('organizacion', 'ConsecutivoConfig')
            return ConsecutivoConfig.obtener_siguiente_consecutivo(
                consecutivo_codigo, empresa_id=empresa_id
            )
        except Exception as e:
            logger.warning(
                'ConsecutivoConfig no disponible para %s (empresa=%s): %s. '
                'Usando generación artesanal.',
                consecutivo_codigo, empresa_id, e
            )
            return cls._generar_codigo_artesanal(tipo_documento, empresa_id)

    @classmethod
    def _generar_codigo_artesanal(cls, tipo_documento, empresa_id):
        """Fallback: genera código con contador simple (NO thread-safe)."""
        prefijo = tipo_documento.prefijo_codigo or f'{tipo_documento.codigo}-'
        ultimo = Documento.objects.filter(
            empresa_id=empresa_id,
            codigo__startswith=prefijo
        ).order_by('-codigo').first()

        if ultimo:
            try:
                ultimo_num = int(ultimo.codigo.replace(prefijo, ''))
                nuevo_num = ultimo_num + 1
            except (ValueError, IndexError):
                nuevo_num = 1
        else:
            nuevo_num = 1

        return f'{prefijo}{nuevo_num:04d}'

    @classmethod
    def enviar_a_revision(cls, documento_id, usuario, empresa_id, revisor_id=None):
        """BORRADOR -> EN_REVISION."""
        doc = Documento.objects.get(id=documento_id, empresa_id=empresa_id)
        if doc.estado != 'BORRADOR':
            raise ValueError('Solo se pueden enviar borradores a revisión')

        doc.estado = 'EN_REVISION'
        if revisor_id:
            doc.revisado_por_id = revisor_id
        doc.save(update_fields=['estado', 'revisado_por_id', 'updated_at'])

        # Notificar al revisor asignado
        if doc.revisado_por:
            _send_notification(
                tipo_codigo='DOCUMENTO_REVISION',
                usuario=doc.revisado_por,
                titulo=f'Documento requiere revisión: {doc.codigo}',
                mensaje=(
                    f'El documento "{doc.titulo}" ({doc.codigo}) ha sido '
                    f'enviado a revisión por {usuario.get_full_name()}. '
                    f'Por favor revísalo.'
                ),
                url='/gestion-documental/documentos',
                datos_extra={
                    'documento_id': doc.id,
                    'codigo': doc.codigo,
                    'titulo': doc.titulo,
                },
            )

        return doc

    @classmethod
    def obtener_estado_firmas(cls, documento):
        """Retorna estado de firmas digitales del documento."""
        firmas = documento.get_firmas_digitales()
        total = firmas.count()
        if total == 0:
            return {'total': 0, 'firmadas': 0, 'pendientes': 0, 'rechazadas': 0, 'puede_publicar': True}

        firmadas = firmas.filter(estado='FIRMADO').count()
        pendientes = firmas.filter(estado='PENDIENTE').count()
        rechazadas = firmas.filter(estado='RECHAZADO').count()
        return {
            'total': total,
            'firmadas': firmadas,
            'pendientes': pendientes,
            'rechazadas': rechazadas,
            'puede_publicar': pendientes == 0 and rechazadas == 0,
        }

    @classmethod
    def aprobar_documento(cls, documento_id, usuario, empresa_id, observaciones=''):
        """EN_REVISION -> APROBADO, crea VersionDocumento snapshot."""
        doc = Documento.objects.get(id=documento_id, empresa_id=empresa_id)
        if doc.estado != 'EN_REVISION':
            raise ValueError('Solo se pueden aprobar documentos en revisión')

        # Validar firmas si el tipo lo requiere
        if doc.tipo_documento.requiere_firma:
            estado_firmas = cls.obtener_estado_firmas(doc)
            if estado_firmas['total'] == 0:
                raise ValueError(
                    'Este tipo de documento requiere firma digital. '
                    'Asigne firmantes antes de aprobar.'
                )
            if estado_firmas['pendientes'] > 0:
                raise ValueError(
                    f'Hay {estado_firmas["pendientes"]} firma(s) pendiente(s). '
                    f'Todas las firmas deben completarse antes de aprobar.'
                )
            if estado_firmas['rechazadas'] > 0:
                raise ValueError(
                    f'Hay {estado_firmas["rechazadas"]} firma(s) rechazada(s). '
                    f'Resuelva las firmas rechazadas antes de aprobar.'
                )

        doc.estado = 'APROBADO'
        doc.aprobado_por = usuario
        doc.fecha_aprobacion = timezone.now().date()
        if observaciones:
            doc.observaciones = observaciones
        doc.save()

        # Notificar al elaborador que su documento fue aprobado
        if doc.elaborado_por:
            _send_notification(
                tipo_codigo='DOCUMENTO_APROBADO',
                usuario=doc.elaborado_por,
                titulo=f'Documento aprobado: {doc.codigo}',
                mensaje=(
                    f'El documento "{doc.titulo}" ({doc.codigo}) ha sido '
                    f'aprobado por {usuario.get_full_name()}. '
                    f'Puede proceder a publicarlo.'
                ),
                url='/gestion-documental/documentos',
                datos_extra={
                    'documento_id': doc.id,
                    'codigo': doc.codigo,
                    'titulo': doc.titulo,
                    'version': doc.version_actual,
                },
            )

        return doc

    @classmethod
    def publicar_documento(cls, documento_id, usuario, empresa_id, fecha_vigencia=None):
        """APROBADO -> PUBLICADO, crea VersionDocumento + ControlDocumental."""
        doc = Documento.objects.get(id=documento_id, empresa_id=empresa_id)
        if doc.estado != 'APROBADO':
            raise ValueError('Solo se pueden publicar documentos aprobados')

        # Validar firmas si el tipo lo requiere
        if doc.tipo_documento.requiere_firma:
            estado_firmas = cls.obtener_estado_firmas(doc)
            if not estado_firmas['puede_publicar']:
                raise ValueError(
                    'No se puede publicar: hay firmas pendientes o rechazadas. '
                    f'Firmadas: {estado_firmas["firmadas"]}/{estado_firmas["total"]}'
                )

        doc.estado = 'PUBLICADO'
        doc.fecha_publicacion = timezone.now().date()
        doc.fecha_vigencia = fecha_vigencia or timezone.now().date()
        doc.save()

        # Marcar versiones anteriores como no actuales
        VersionDocumento.objects.filter(
            documento=doc, is_version_actual=True
        ).update(is_version_actual=False)

        # Crear snapshot de versión
        VersionDocumento.objects.create(
            documento=doc,
            numero_version=doc.version_actual,
            tipo_cambio='CREACION' if doc.numero_revision == 0 else 'REVISION_MAYOR',
            contenido_snapshot=doc.contenido,
            datos_formulario_snapshot=doc.datos_formulario,
            descripcion_cambios=doc.motivo_cambio_version or 'Publicación',
            creado_por=usuario,
            aprobado_por=doc.aprobado_por,
            fecha_aprobacion=doc.fecha_aprobacion,
            is_version_actual=True,
            empresa_id=empresa_id,
        )

        # Crear control de distribución automático
        ControlDocumental.objects.create(
            documento=doc,
            tipo_control='DISTRIBUCION',
            fecha_distribucion=timezone.now().date(),
            medio_distribucion='DIGITAL',
            areas_distribucion=doc.areas_aplicacion,
            observaciones='Distribución automática al publicar',
            empresa_id=empresa_id,
            created_by=usuario,
        )

        # Notificar al elaborador y al revisor que el documento fue publicado
        notificados = set()
        for dest_usuario in [doc.elaborado_por, doc.revisado_por]:
            if dest_usuario and dest_usuario.id not in notificados:
                notificados.add(dest_usuario.id)
                _send_notification(
                    tipo_codigo='DOCUMENTO_PUBLICADO',
                    usuario=dest_usuario,
                    titulo=f'Documento publicado: {doc.codigo}',
                    mensaje=(
                        f'El documento "{doc.titulo}" ({doc.codigo}) ha sido '
                        f'publicado (versión {doc.version_actual}) y está '
                        f'disponible para consulta.'
                    ),
                    url='/gestion-documental/documentos',
                    datos_extra={
                        'documento_id': doc.id,
                        'codigo': doc.codigo,
                        'titulo': doc.titulo,
                        'version': doc.version_actual,
                    },
                )

        return doc

    @classmethod
    def marcar_obsoleto(cls, documento_id, usuario, empresa_id, motivo, sustituto_id=None):
        """PUBLICADO -> OBSOLETO, crea ControlDocumental de retiro."""
        doc = Documento.objects.get(id=documento_id, empresa_id=empresa_id)
        doc.estado = 'OBSOLETO'
        doc.fecha_obsolescencia = timezone.now().date()
        doc.save(update_fields=['estado', 'fecha_obsolescencia', 'updated_at'])

        ControlDocumental.objects.create(
            documento=doc,
            tipo_control='RETIRO',
            fecha_retiro=timezone.now().date(),
            motivo_retiro=motivo,
            documento_sustituto_id=sustituto_id,
            empresa_id=empresa_id,
            created_by=usuario,
        )

        # Notificar al elaborador que su documento fue marcado como obsoleto
        if doc.elaborado_por and doc.elaborado_por != usuario:
            _send_notification(
                tipo_codigo='DOCUMENTO_OBSOLETO',
                usuario=doc.elaborado_por,
                titulo=f'Documento obsoleto: {doc.codigo}',
                mensaje=(
                    f'El documento "{doc.titulo}" ({doc.codigo}) ha sido '
                    f'marcado como obsoleto por {usuario.get_full_name()}. '
                    f'Motivo: {motivo}'
                ),
                url='/gestion-documental/documentos',
                datos_extra={
                    'documento_id': doc.id,
                    'codigo': doc.codigo,
                    'titulo': doc.titulo,
                    'motivo': motivo,
                },
            )

        return doc

    @classmethod
    def obtener_estadisticas(cls, empresa_id):
        """Dashboard stats: totales por estado, por tipo, revisiones pendientes."""
        hoy = timezone.now().date()
        docs = Documento.objects.filter(empresa_id=empresa_id)

        por_estado = dict(
            docs.values_list('estado').annotate(total=Count('id')).values_list('estado', 'total')
        )

        por_tipo = list(
            docs.values('tipo_documento__nombre')
            .annotate(total=Count('id'))
            .order_by('-total')[:10]
        )

        revision_vencida = docs.filter(
            estado='PUBLICADO',
            fecha_revision_programada__lte=hoy
        ).count()

        proximas_revision = docs.filter(
            estado='PUBLICADO',
            fecha_revision_programada__gt=hoy,
            fecha_revision_programada__lte=hoy + timezone.timedelta(days=30)
        ).count()

        # Stats de distribución
        distribuciones = ControlDocumental.objects.filter(
            empresa_id=empresa_id,
            tipo_control='DISTRIBUCION',
            documento__estado='PUBLICADO'
        )
        total_distribuciones = distribuciones.count()
        total_confirmaciones = sum(
            len(d.confirmaciones_recepcion or [])
            for d in distribuciones.only('confirmaciones_recepcion')
        )

        return {
            'total': docs.count(),
            'por_estado': {
                'borrador': por_estado.get('BORRADOR', 0),
                'en_revision': por_estado.get('EN_REVISION', 0),
                'aprobado': por_estado.get('APROBADO', 0),
                'publicado': por_estado.get('PUBLICADO', 0),
                'obsoleto': por_estado.get('OBSOLETO', 0),
                'archivado': por_estado.get('ARCHIVADO', 0),
            },
            'por_tipo': por_tipo,
            'revision_vencida': revision_vencida,
            'proximas_revision_30d': proximas_revision,
            'distribucion': {
                'total_distribuciones': total_distribuciones,
                'total_confirmaciones': total_confirmaciones,
            },
        }

    @classmethod
    def verificar_revisiones_programadas(cls, empresa_id=None):
        """
        Encuentra documentos con fecha_revision_programada pasada.
        Retorna lista de IDs para notificación.
        """
        hoy = timezone.now().date()
        filtros = Q(
            estado='PUBLICADO',
            fecha_revision_programada__lte=hoy,
        )
        if empresa_id:
            filtros &= Q(empresa_id=empresa_id)

        docs_vencidos = Documento.objects.filter(filtros).values_list(
            'id', 'codigo', 'titulo', 'empresa_id', 'elaborado_por_id'
        )
        return list(docs_vencidos)

    @classmethod
    def documentos_por_vencer(cls, empresa_id=None, dias=15):
        """
        Documentos cuya revisión programada vence en los próximos N días.
        """
        hoy = timezone.now().date()
        limite = hoy + timezone.timedelta(days=dias)
        filtros = Q(
            estado='PUBLICADO',
            fecha_revision_programada__gt=hoy,
            fecha_revision_programada__lte=limite,
        )
        if empresa_id:
            filtros &= Q(empresa_id=empresa_id)

        return list(
            Documento.objects.filter(filtros).values_list(
                'id', 'codigo', 'titulo', 'empresa_id', 'elaborado_por_id',
                'fecha_revision_programada'
            )
        )

    @classmethod
    def renderizar_plantilla(cls, contenido_plantilla: str, variables: dict) -> str:
        """
        Renderiza una plantilla reemplazando {{variable}} con valores del dict.
        Variables no encontradas quedan como placeholder vacío.
        """
        import re

        if not contenido_plantilla:
            return ''

        def reemplazar(match):
            key = match.group(1).strip()
            valor = variables.get(key, '')
            return str(valor) if valor is not None else ''

        return re.sub(r'\{\{(\s*\w+\s*)\}\}', reemplazar, contenido_plantilla)
