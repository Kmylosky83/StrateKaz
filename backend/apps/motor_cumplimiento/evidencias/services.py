"""
EvidenciaService - Servicio central para gestión de evidencias.

Patrón @classmethod consistente con PermissionCacheService, WorkflowExecutionService.
Cualquier módulo puede usar este servicio para registrar/consultar evidencias
sin importar directamente los modelos.
"""
import logging
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from django.db.models import Count, Q

from .models import Evidencia, HistorialEvidencia

logger = logging.getLogger(__name__)


class EvidenciaService:
    """
    Servicio central para gestión de evidencias cross-module.

    Uso desde cualquier módulo:
        from apps.motor_cumplimiento.evidencias.services import EvidenciaService

        evidencia = EvidenciaService.registrar_evidencia(
            archivo=file_obj,
            entidad=mi_hallazgo,
            usuario=request.user,
            empresa_id=empresa_id,
            titulo='Evidencia fotográfica',
            categoria='FOTOGRAFICA',
        )
    """

    @classmethod
    def registrar_evidencia(cls, archivo, entidad, usuario, empresa_id,
                            titulo='', categoria='OTRO', descripcion='',
                            normas_relacionadas=None, tags=None,
                            fecha_vigencia=None):
        """
        Registra una evidencia vinculada a cualquier entidad del sistema.

        Args:
            archivo: UploadedFile (desde request.FILES)
            entidad: Instancia del modelo al que se vincula
            usuario: User que sube la evidencia
            empresa_id: ID de la empresa (multi-tenancy)
            titulo: Título descriptivo
            categoria: Una de CATEGORIA_CHOICES
            descripcion: Descripción opcional
            normas_relacionadas: Lista de normas ISO ["ISO_9001", ...]
            tags: Lista de etiquetas ["tag1", ...]
            fecha_vigencia: Fecha de vencimiento (para certificados)

        Returns:
            Evidencia creada
        """
        ct = ContentType.objects.get_for_model(entidad)

        evidencia = Evidencia.objects.create(
            empresa_id=empresa_id,
            content_type=ct,
            object_id=entidad.pk,
            archivo=archivo,
            nombre_original=archivo.name,
            mime_type=getattr(archivo, 'content_type', ''),
            tamano_bytes=archivo.size,
            titulo=titulo or archivo.name,
            descripcion=descripcion,
            categoria=categoria,
            normas_relacionadas=normas_relacionadas or [],
            tags=tags or [],
            fecha_vigencia=fecha_vigencia,
            subido_por=usuario,
        )

        HistorialEvidencia.objects.create(
            evidencia=evidencia,
            empresa_id=empresa_id,
            accion='CREADA',
            usuario=usuario,
            comentario=f'Evidencia subida: {archivo.name}',
        )

        logger.info(
            f"[Evidencia] Registrada: {evidencia.titulo} → "
            f"{ct.app_label}.{ct.model}:{entidad.pk} (empresa={empresa_id})"
        )

        return evidencia

    @classmethod
    def aprobar_evidencia(cls, evidencia_id, usuario, empresa_id):
        """Aprueba una evidencia pendiente."""
        evidencia = Evidencia.objects.get(
            id=evidencia_id, empresa_id=empresa_id
        )

        datos_anteriores = {'estado': evidencia.estado}
        evidencia.estado = 'APROBADA'
        evidencia.aprobado_por = usuario
        evidencia.fecha_aprobacion = timezone.now()
        evidencia.save(update_fields=[
            'estado', 'aprobado_por', 'fecha_aprobacion', 'updated_at'
        ])

        HistorialEvidencia.objects.create(
            evidencia=evidencia,
            empresa_id=empresa_id,
            accion='APROBADA',
            usuario=usuario,
            datos_anteriores=datos_anteriores,
        )

        logger.info(f"[Evidencia] Aprobada: {evidencia.titulo} por {usuario}")
        return evidencia

    @classmethod
    def rechazar_evidencia(cls, evidencia_id, usuario, empresa_id, motivo=''):
        """Rechaza una evidencia con motivo."""
        evidencia = Evidencia.objects.get(
            id=evidencia_id, empresa_id=empresa_id
        )

        datos_anteriores = {'estado': evidencia.estado}
        evidencia.estado = 'RECHAZADA'
        evidencia.motivo_rechazo = motivo
        evidencia.save(update_fields=['estado', 'motivo_rechazo', 'updated_at'])

        HistorialEvidencia.objects.create(
            evidencia=evidencia,
            empresa_id=empresa_id,
            accion='RECHAZADA',
            usuario=usuario,
            comentario=motivo,
            datos_anteriores=datos_anteriores,
        )

        logger.info(f"[Evidencia] Rechazada: {evidencia.titulo} - {motivo}")
        return evidencia

    @classmethod
    def archivar_evidencia(cls, evidencia_id, usuario, empresa_id):
        """Archiva una evidencia."""
        evidencia = Evidencia.objects.get(
            id=evidencia_id, empresa_id=empresa_id
        )

        datos_anteriores = {'estado': evidencia.estado}
        evidencia.estado = 'ARCHIVADA'
        evidencia.save(update_fields=['estado', 'updated_at'])

        HistorialEvidencia.objects.create(
            evidencia=evidencia,
            empresa_id=empresa_id,
            accion='ARCHIVADA',
            usuario=usuario,
            datos_anteriores=datos_anteriores,
        )

        return evidencia

    @classmethod
    def obtener_evidencias_entidad(cls, entidad, empresa_id):
        """Lista todas las evidencias vinculadas a una entidad específica."""
        ct = ContentType.objects.get_for_model(entidad)
        return Evidencia.objects.filter(
            empresa_id=empresa_id,
            content_type=ct,
            object_id=entidad.pk,
        ).select_related('subido_por', 'aprobado_por')

    @classmethod
    def obtener_evidencias_por_content_type(cls, app_label, model_name, object_id, empresa_id):
        """Lista evidencias usando app_label.model en vez de instancia."""
        ct = ContentType.objects.get_by_natural_key(app_label, model_name)
        return Evidencia.objects.filter(
            empresa_id=empresa_id,
            content_type=ct,
            object_id=object_id,
        ).select_related('subido_por', 'aprobado_por')

    @classmethod
    def obtener_resumen(cls, empresa_id, norma=None):
        """
        Dashboard: resumen de evidencias por estado, categoría y norma.

        Returns:
            dict con total, pendientes, aprobadas, rechazadas, vencidas,
            por_categoria, por_norma
        """
        qs = Evidencia.objects.filter(empresa_id=empresa_id)

        if norma:
            qs = qs.filter(normas_relacionadas__contains=[norma])

        estados = qs.values('estado').annotate(count=Count('id'))
        categorias = qs.values('categoria').annotate(count=Count('id'))

        estado_map = {e['estado']: e['count'] for e in estados}
        categoria_map = {c['categoria']: c['count'] for c in categorias}

        total = sum(estado_map.values())

        return {
            'total': total,
            'pendientes': estado_map.get('PENDIENTE', 0),
            'aprobadas': estado_map.get('APROBADA', 0),
            'rechazadas': estado_map.get('RECHAZADA', 0),
            'vencidas': estado_map.get('VENCIDA', 0),
            'archivadas': estado_map.get('ARCHIVADA', 0),
            'por_categoria': categoria_map,
        }

    @classmethod
    def verificar_vigencias(cls, empresa_id=None):
        """
        Marca como VENCIDA las evidencias cuya fecha_vigencia ha pasado.
        Si empresa_id es None, verifica todas las empresas.

        Returns:
            int: Cantidad de evidencias marcadas como vencidas
        """
        hoy = timezone.now().date()
        filtros = Q(
            estado__in=['PENDIENTE', 'APROBADA'],
            fecha_vigencia__lt=hoy,
            fecha_vigencia__isnull=False,
        )
        if empresa_id:
            filtros &= Q(empresa_id=empresa_id)

        evidencias_vencidas = Evidencia.objects.filter(filtros)
        count = evidencias_vencidas.count()

        for evidencia in evidencias_vencidas:
            datos_anteriores = {'estado': evidencia.estado}
            evidencia.estado = 'VENCIDA'
            evidencia.save(update_fields=['estado', 'updated_at'])

            HistorialEvidencia.objects.create(
                evidencia=evidencia,
                empresa_id=evidencia.empresa_id,
                accion='VENCIDA',
                usuario=None,
                comentario=f'Vencida automáticamente (vigencia: {evidencia.fecha_vigencia})',
                datos_anteriores=datos_anteriores,
            )

        if count > 0:
            logger.info(f"[Evidencia] {count} evidencias marcadas como vencidas")

        return count
