"""
Tareas Celery para Gestión Documental.
- Verificar revisiones programadas vencidas
- Notificar documentos por vencer
- Procesar OCR de documentos (Fase 5)

NOTA: Todas las tareas iteran sobre tenants activos usando schema_context
porque Celery Beat ejecuta en el schema 'public' donde las tablas tenant no existen.

Registradas en config/celery.py → beat_schedule + task_routes
"""
import logging
from celery import shared_task

from django_tenants.utils import schema_context
from apps.tenant.models import Tenant

logger = logging.getLogger(__name__)


def _get_active_tenants():
    """Obtiene todos los tenants activos (excluye public)."""
    return Tenant.objects.exclude(
        schema_name='public'
    ).filter(
        is_active=True
    )


@shared_task(
    name='documental.verificar_revisiones_programadas',
    queue='compliance',
    max_retries=2,
    soft_time_limit=300,
)
def verificar_documentos_revision_programada():
    """
    Diario 7:15AM: Detecta documentos PUBLICADOS cuya fecha_revision_programada < hoy.
    Envía notificación al elaborador del documento.

    Frecuencia recomendada: Diaria a las 7:15 AM
    """
    from django.contrib.auth import get_user_model

    User = get_user_model()
    total_vencidos = 0
    total_notificados = 0

    for tenant in _get_active_tenants():
        try:
            with schema_context(tenant.schema_name):
                from .services import DocumentoService

                docs_vencidos = DocumentoService.verificar_revisiones_programadas()
                if docs_vencidos:
                    logger.info(
                        f'{tenant.schema_name}: Documentos con revisión vencida: '
                        f'{len(docs_vencidos)}'
                    )
                    for doc_id, codigo, titulo, empresa_id, elaborado_por_id in docs_vencidos:
                        logger.warning(
                            f'[{tenant.schema_name}] Documento {codigo} "{titulo}" '
                            f'tiene revisión programada vencida. '
                            f'Responsable: usuario {elaborado_por_id}'
                        )

                        # Notificar al elaborador
                        if elaborado_por_id:
                            try:
                                usuario = User.objects.get(id=elaborado_por_id)
                                _send_notification(
                                    tipo_codigo='DOCUMENTO_REVISION_VENCIDA',
                                    usuario=usuario,
                                    titulo=f'Documento con revisión vencida: {codigo}',
                                    mensaje=(
                                        f'El documento "{titulo}" ({codigo}) tiene su '
                                        f'revisión programada vencida. Por favor programe '
                                        f'la revisión correspondiente.'
                                    ),
                                    url='/gestion-documental/documentos',
                                    datos_extra={
                                        'documento_id': doc_id,
                                        'codigo': codigo,
                                        'titulo': titulo,
                                    },
                                    prioridad='alta',
                                )
                                total_notificados += 1
                            except User.DoesNotExist:
                                logger.warning(
                                    f'Usuario {elaborado_por_id} no encontrado '
                                    f'para notificación de documento {codigo}'
                                )

                    total_vencidos += len(docs_vencidos)
        except Exception as e:
            logger.error(
                f'[documental] Error verificando revisiones en tenant '
                f'{tenant.schema_name}: {e}'
            )

    logger.info(
        f'[documental] verificar_revisiones_programadas: '
        f'{total_vencidos} vencidos, {total_notificados} notificados'
    )
    return {
        'status': 'ok',
        'documentos_vencidos': total_vencidos,
        'notificados': total_notificados,
    }


@shared_task(
    name='documental.notificar_documentos_por_vencer',
    queue='compliance',
    max_retries=2,
    soft_time_limit=300,
)
def notificar_documentos_por_vencer():
    """
    Diario 8AM: Avisa 15 días antes de que venza la revisión programada.
    Envía notificación al elaborador del documento.

    Frecuencia recomendada: Diaria a las 8:00 AM
    """
    from django.contrib.auth import get_user_model

    User = get_user_model()
    total_por_vencer = 0
    total_notificados = 0

    for tenant in _get_active_tenants():
        try:
            with schema_context(tenant.schema_name):
                from .services import DocumentoService

                docs_por_vencer = DocumentoService.documentos_por_vencer(dias=15)
                if docs_por_vencer:
                    logger.info(
                        f'{tenant.schema_name}: Documentos por vencer revisión (15 días): '
                        f'{len(docs_por_vencer)}'
                    )
                    for doc_id, codigo, titulo, empresa_id, elaborado_por_id, fecha_rev in docs_por_vencer:
                        logger.info(
                            f'[{tenant.schema_name}] Documento {codigo} "{titulo}" '
                            f'vence revisión el {fecha_rev}. '
                            f'Responsable: usuario {elaborado_por_id}'
                        )

                        # Notificar al elaborador
                        if elaborado_por_id:
                            try:
                                usuario = User.objects.get(id=elaborado_por_id)
                                from django.utils import timezone

                                hoy = timezone.now().date()
                                dias_restantes = (fecha_rev - hoy).days

                                _send_notification(
                                    tipo_codigo='DOCUMENTO_PROXIMO_REVISION',
                                    usuario=usuario,
                                    titulo=f'Documento próximo a revisión: {codigo}',
                                    mensaje=(
                                        f'El documento "{titulo}" ({codigo}) tiene '
                                        f'revisión programada para el '
                                        f'{fecha_rev.strftime("%d/%m/%Y")} '
                                        f'({dias_restantes} días restantes). '
                                        f'Planifique la revisión con anticipación.'
                                    ),
                                    url='/gestion-documental/documentos',
                                    datos_extra={
                                        'documento_id': doc_id,
                                        'codigo': codigo,
                                        'titulo': titulo,
                                        'fecha_revision': fecha_rev.isoformat(),
                                        'dias_restantes': dias_restantes,
                                    },
                                )
                                total_notificados += 1
                            except User.DoesNotExist:
                                logger.warning(
                                    f'Usuario {elaborado_por_id} no encontrado '
                                    f'para notificación de documento {codigo}'
                                )

                    total_por_vencer += len(docs_por_vencer)
        except Exception as e:
            logger.error(
                f'[documental] Error notificando documentos en tenant '
                f'{tenant.schema_name}: {e}'
            )

    logger.info(
        f'[documental] notificar_documentos_por_vencer: '
        f'{total_por_vencer} por vencer, {total_notificados} notificados'
    )
    return {
        'status': 'ok',
        'documentos_por_vencer': total_por_vencer,
        'notificados': total_notificados,
    }


# =============================================================================
# OCR — Procesamiento individual y batch (Fase 5)
# =============================================================================

@shared_task(
    name='documental.procesar_ocr_documento',
    queue='files',
    bind=True,
    max_retries=2,
    soft_time_limit=600,
    time_limit=660,
)
def procesar_ocr_documento(self, documento_id: int, tenant_schema: str):
    """
    Procesa OCR de un documento individual.
    Se dispara después de upload de PDF externo o reprocesamiento manual.
    """
    from django.conf import settings

    with schema_context(tenant_schema):
        from .models import Documento
        from .services_ocr import OcrService

        try:
            documento = Documento.objects.get(id=documento_id)
        except Documento.DoesNotExist:
            logger.error(
                f'[OCR] Documento {documento_id} no encontrado en '
                f'{tenant_schema}'
            )
            return {'status': 'error', 'error': 'Documento no encontrado'}

        # Marcar como procesando
        documento.ocr_estado = 'PROCESANDO'
        documento.save(update_fields=['ocr_estado'])

        # Determinar archivo a procesar
        archivo = documento.archivo_original or documento.archivo_pdf
        if not archivo:
            documento.ocr_estado = 'ERROR'
            documento.ocr_metadatos = {'error': 'No hay archivo PDF para procesar'}
            documento.save(update_fields=['ocr_estado', 'ocr_metadatos'])
            return {'status': 'error', 'error': 'Sin archivo PDF'}

        # Resolver path absoluto
        file_path = str(archivo.path) if hasattr(archivo, 'path') else str(
            settings.MEDIA_ROOT / str(archivo)
        )

        try:
            resultado = OcrService.extraer_texto_pdf(file_path)

            documento.texto_extraido = resultado['texto']
            documento.ocr_metadatos = {
                'metodo': resultado['metodo'],
                'confianza': resultado['confianza'],
                'paginas_procesadas': resultado['paginas_procesadas'],
                'total_paginas': resultado['total_paginas'],
                'duracion_seg': resultado['duracion_seg'],
                'error': resultado['error'],
            }

            if resultado['texto'].strip():
                documento.ocr_estado = 'COMPLETADO'
            elif resultado['error']:
                documento.ocr_estado = 'ERROR'
            else:
                documento.ocr_estado = 'COMPLETADO'
                documento.ocr_metadatos['nota'] = (
                    'No se detectó texto en el documento'
                )

            documento.save(update_fields=[
                'texto_extraido', 'ocr_estado', 'ocr_metadatos'
            ])

            # Notificar al elaborador
            if documento.elaborado_por_id:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                try:
                    usuario = User.objects.get(id=documento.elaborado_por_id)
                    estado_label = (
                        'completada' if documento.ocr_estado == 'COMPLETADO'
                        else 'con errores'
                    )
                    _send_notification(
                        tipo_codigo='DOCUMENTO_OCR_COMPLETADO',
                        usuario=usuario,
                        titulo=f'Extracción de texto {estado_label}: '
                               f'{documento.codigo}',
                        mensaje=(
                            f'La extracción de texto del documento '
                            f'"{documento.titulo}" ({documento.codigo}) '
                            f'finalizó {estado_label}. '
                            f'Método: {resultado["metodo"]}, '
                            f'Confianza: {resultado["confianza"]:.0%}.'
                        ),
                        url='/gestion-documental/documentos',
                        datos_extra={
                            'documento_id': documento.id,
                            'codigo': documento.codigo,
                            'metodo': resultado['metodo'],
                            'confianza': resultado['confianza'],
                        },
                    )
                except User.DoesNotExist:
                    pass

            logger.info(
                f'[OCR] {tenant_schema}: Documento {documento.codigo} procesado '
                f'({resultado["metodo"]}, {resultado["confianza"]:.0%})'
            )
            return {
                'status': 'ok',
                'documento_id': documento_id,
                'metodo': resultado['metodo'],
                'confianza': resultado['confianza'],
                'chars': len(resultado['texto']),
            }

        except Exception as e:
            documento.ocr_estado = 'ERROR'
            documento.ocr_metadatos = {'error': str(e)}
            documento.save(update_fields=['ocr_estado', 'ocr_metadatos'])
            logger.error(
                f'[OCR] Error procesando documento {documento_id} en '
                f'{tenant_schema}: {e}'
            )
            raise self.retry(exc=e, countdown=60)


@shared_task(
    name='documental.procesar_ocr_pendientes',
    queue='files',
    max_retries=1,
    soft_time_limit=300,
)
def procesar_ocr_pendientes():
    """
    Batch diario: busca documentos con ocr_estado='PENDIENTE' en todos los tenants
    y dispara procesamiento individual para cada uno.
    """
    total_dispatched = 0

    for tenant in _get_active_tenants():
        try:
            with schema_context(tenant.schema_name):
                from .models import Documento

                pendientes = Documento.objects.filter(
                    ocr_estado='PENDIENTE'
                ).values_list('id', flat=True)[:50]  # Limitar batch

                for doc_id in pendientes:
                    procesar_ocr_documento.delay(doc_id, tenant.schema_name)
                    total_dispatched += 1

                if pendientes:
                    logger.info(
                        f'[OCR] {tenant.schema_name}: '
                        f'{len(pendientes)} documentos en cola OCR'
                    )
        except Exception as e:
            logger.error(
                f'[OCR] Error buscando pendientes en {tenant.schema_name}: {e}'
            )

    logger.info(f'[OCR] procesar_ocr_pendientes: {total_dispatched} despachados')
    return {'status': 'ok', 'dispatched': total_dispatched}


# =============================================================================
# SCORING — Cálculo batch de scores (Fase 6)
# =============================================================================

@shared_task(
    name='documental.calcular_scores_batch',
    queue='compliance',
    max_retries=1,
    soft_time_limit=300,
)
def calcular_scores_batch():
    """
    Batch diario: recalcula scores de cumplimiento para todos los documentos.
    """
    total_actualizados = 0

    for tenant in _get_active_tenants():
        try:
            with schema_context(tenant.schema_name):
                from .models import Documento
                from .services_scoring import ScoringService

                documentos = Documento.objects.exclude(estado='ARCHIVADO')
                for doc in documentos[:500]:
                    try:
                        ScoringService.actualizar_score(doc)
                        total_actualizados += 1
                    except Exception as e:
                        logger.warning(
                            f'[Scoring] Error en doc {doc.id}: {e}'
                        )
        except Exception as e:
            logger.error(
                f'[Scoring] Error en tenant {tenant.schema_name}: {e}'
            )

    logger.info(
        f'[Scoring] calcular_scores_batch: {total_actualizados} actualizados'
    )
    return {'status': 'ok', 'actualizados': total_actualizados}


# =============================================================================
# BPM AUTO-GENERACIÓN — Crear documento desde workflow (Fase 4)
# =============================================================================

@shared_task(
    name='documental.generar_documento_desde_workflow',
    queue='files',
    bind=True,
    max_retries=2,
    soft_time_limit=120,
)
def generar_documento_desde_workflow(
    self, instancia_id: int, config: dict,
    usuario_id: int = None, tenant_schema: str = ''
):
    """
    Genera un documento automáticamente cuando un workflow BPM se completa.
    Usa la plantilla y tipo configurados en PlantillaFlujo.config_auto_generacion.
    """
    with schema_context(tenant_schema):
        from django.apps import apps
        from .models import Documento, TipoDocumento, PlantillaDocumento
        from .services import DocumentoService

        # Obtener InstanciaFlujo (C2→C2: apps.get_model)
        InstanciaFlujo = apps.get_model('ejecucion', 'InstanciaFlujo')
        try:
            instancia = InstanciaFlujo.objects.get(id=instancia_id)
        except InstanciaFlujo.DoesNotExist:
            logger.error(f'[BPM→Doc] InstanciaFlujo {instancia_id} no encontrada')
            return {'status': 'error', 'error': 'Instancia no encontrada'}

        # Obtener tipo de documento
        tipo_doc_id = config.get('tipo_documento_id')
        if not tipo_doc_id:
            logger.error('[BPM→Doc] config sin tipo_documento_id')
            return {'status': 'error', 'error': 'Config sin tipo_documento_id'}

        try:
            tipo_doc = TipoDocumento.objects.get(id=tipo_doc_id)
        except TipoDocumento.DoesNotExist:
            logger.error(f'[BPM→Doc] TipoDocumento {tipo_doc_id} no encontrado')
            return {'status': 'error', 'error': 'Tipo documento no encontrado'}

        # Generar código
        empresa_id = instancia.empresa_id if hasattr(instancia, 'empresa_id') else 1
        codigo = DocumentoService.generar_codigo(tipo_doc, empresa_id)

        # Renderizar contenido desde plantilla (si configurada)
        contenido = ''
        plantilla_doc = None
        plantilla_doc_id = config.get('plantilla_documento_id')
        if plantilla_doc_id:
            try:
                plantilla_doc = PlantillaDocumento.objects.get(id=plantilla_doc_id)
                variables = instancia.data_contexto or {}
                variables.update({
                    'codigo': codigo,
                    'titulo': instancia.titulo or f'Documento de {tipo_doc.nombre}',
                    'workflow': instancia.titulo or '',
                    'fecha': instancia.fecha_fin.strftime('%d/%m/%Y') if instancia.fecha_fin else '',
                })
                contenido = DocumentoService.renderizar_plantilla(
                    plantilla_doc.contenido_plantilla, variables
                )
            except PlantillaDocumento.DoesNotExist:
                logger.warning(
                    f'[BPM→Doc] PlantillaDocumento {plantilla_doc_id} no encontrada, '
                    f'creando documento sin contenido de plantilla'
                )

        # Crear documento
        estado_inicial = config.get('estado_inicial', 'BORRADOR')
        documento = Documento.objects.create(
            codigo=codigo,
            titulo=instancia.titulo or f'Documento de {tipo_doc.nombre}',
            tipo_documento=tipo_doc,
            plantilla=plantilla_doc,
            contenido=contenido,
            datos_formulario=instancia.data_contexto or {},
            estado=estado_inicial,
            elaborado_por_id=usuario_id,
            workflow_asociado_id=instancia.plantilla_id,
            workflow_asociado_nombre=instancia.titulo or '',
            es_auto_generado=True,
            empresa_id=empresa_id,
        )

        # Calcular score inicial
        from .services_scoring import ScoringService
        ScoringService.actualizar_score(documento)

        # Notificar
        if usuario_id:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                usuario = User.objects.get(id=usuario_id)
                _send_notification(
                    tipo_codigo='DOCUMENTO_AUTO_GENERADO',
                    usuario=usuario,
                    titulo=f'Documento auto-generado: {codigo}',
                    mensaje=(
                        f'El flujo "{instancia.titulo}" generó automáticamente '
                        f'el documento "{documento.titulo}" ({codigo}). '
                        f'Estado: {estado_inicial}.'
                    ),
                    url='/gestion-documental/documentos',
                    datos_extra={
                        'documento_id': documento.id,
                        'codigo': codigo,
                        'workflow_id': instancia.id,
                    },
                )
            except User.DoesNotExist:
                pass

        logger.info(
            f'[BPM→Doc] Documento {codigo} generado desde workflow '
            f'{instancia.id} ({tenant_schema})'
        )
        return {
            'status': 'ok',
            'documento_id': documento.id,
            'codigo': codigo,
        }


# =============================================================================
# GOOGLE DRIVE — Export batch (Fase 7)
# =============================================================================

@shared_task(
    name='documental.exportar_drive_lote',
    queue='files',
    bind=True,
    max_retries=1,
    soft_time_limit=600,
)
def exportar_drive_lote(
    self, empresa_id: int, integracion_id: int,
    folder_id: str = None, usuario_id: int = None,
    filtros: dict = None, tenant_schema: str = ''
):
    """Export batch de documentos a Google Drive."""
    with schema_context(tenant_schema):
        from .services_drive import GoogleDriveService
        from django.contrib.auth import get_user_model

        usuario = None
        if usuario_id:
            User = get_user_model()
            try:
                usuario = User.objects.get(id=usuario_id)
            except User.DoesNotExist:
                pass

        try:
            resultado = GoogleDriveService.exportar_lote(
                empresa_id=empresa_id,
                integracion_id=integracion_id,
                folder_id=folder_id,
                usuario=usuario,
                filtros=filtros,
            )

            if usuario:
                _send_notification(
                    tipo_codigo='DOCUMENTO_DRIVE_EXPORTADO',
                    usuario=usuario,
                    titulo='Exportación a Google Drive completada',
                    mensaje=(
                        f'Se exportaron {resultado["exportados"]} documentos '
                        f'a Google Drive. '
                        f'{len(resultado["errores"])} errores.'
                    ),
                    url='/gestion-documental/documentos',
                    datos_extra=resultado,
                )

            logger.info(
                f'[Drive] Lote exportado: {resultado["exportados"]} docs '
                f'({tenant_schema})'
            )
            return resultado

        except Exception as e:
            logger.error(f'[Drive] Error en export lote: {e}')
            raise self.retry(exc=e, countdown=120)


# =============================================================================
# SELLADO PDF — Mejora 2 (ISO 27001)
# =============================================================================

@shared_task(
    name='documental.sellar_pdf_pyhanko',
    queue='files',
    bind=True,
    max_retries=2,
    soft_time_limit=300,
    time_limit=360,
)
def sellar_pdf_pyhanko(self, documento_id: int, tenant_schema: str,
                       usuario_id: int = None):
    """
    Sella un documento con firma digital X.509 + estampa visual via pyHanko.
    Se dispara desde el endpoint POST /documentos/{id}/sellar-pdf/.
    """
    with schema_context(tenant_schema):
        from .models import Documento
        from .services.pdf_sealing import PDFSealingService

        try:
            documento = Documento.objects.get(id=documento_id)
        except Documento.DoesNotExist:
            logger.error(
                f'[SELLADO] Documento {documento_id} no encontrado en '
                f'{tenant_schema}'
            )
            return {'status': 'error', 'error': 'Documento no encontrado'}

        # Marcar como procesando
        documento.sellado_estado = 'PROCESANDO'
        documento.save(update_fields=['sellado_estado'])

        try:
            resultado = PDFSealingService.sellar_documento(documento)

            # Notificar al usuario que solicitó el sellado
            if usuario_id:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                try:
                    usuario = User.objects.get(id=usuario_id)
                    _send_notification(
                        tipo_codigo='DOCUMENTO_SELLADO_COMPLETADO',
                        usuario=usuario,
                        titulo=f'PDF sellado: {documento.codigo}',
                        mensaje=(
                            f'El documento "{documento.titulo}" ({documento.codigo}) '
                            f'fue sellado exitosamente con firma digital X.509.'
                        ),
                        url='/gestion-documental/documentos',
                        datos_extra={
                            'documento_id': documento.id,
                            'codigo': documento.codigo,
                            'hash': resultado['hash_sha256'][:16],
                        },
                    )
                except User.DoesNotExist:
                    pass

            logger.info(
                f'[SELLADO] {tenant_schema}: Documento {documento.codigo} sellado '
                f'(hash: {resultado["hash_sha256"][:16]}...)'
            )
            return {
                'status': 'ok',
                'documento_id': documento_id,
                'hash': resultado['hash_sha256'],
            }

        except Exception as e:
            documento.sellado_estado = 'ERROR'
            documento.sellado_metadatos = {'error': str(e)}
            documento.save(update_fields=['sellado_estado', 'sellado_metadatos'])
            logger.error(
                f'[SELLADO] Error sellando documento {documento_id} en '
                f'{tenant_schema}: {e}'
            )
            raise self.retry(exc=e, countdown=60)


# =============================================================================
# LECTURA VERIFICADA — Mejora 3 (ISO 7.3 Toma de Conciencia)
# =============================================================================

@shared_task(
    name='documental.verificar_aceptaciones_vencidas',
    queue='compliance',
    max_retries=2,
    soft_time_limit=300,
)
def verificar_aceptaciones_vencidas():
    """
    Diario 8:00AM: Marca VENCIDO las aceptaciones cuya fecha_limite < hoy.
    Notifica al usuario y al asignador.
    """
    from django.contrib.auth import get_user_model

    User = get_user_model()
    total_vencidos = 0
    total_notificados = 0

    for tenant in _get_active_tenants():
        try:
            with schema_context(tenant.schema_name):
                from .models import AceptacionDocumental
                from django.utils import timezone

                hoy = timezone.now().date()
                pendientes_vencidas = AceptacionDocumental.objects.filter(
                    estado__in=['PENDIENTE', 'EN_PROGRESO'],
                    fecha_limite__lt=hoy,
                )

                for aceptacion in pendientes_vencidas:
                    aceptacion.estado = 'VENCIDO'
                    aceptacion.save(update_fields=['estado', 'updated_at'])
                    total_vencidos += 1

                    # Notificar al usuario
                    try:
                        usuario = User.objects.get(id=aceptacion.usuario_id)
                        _send_notification(
                            tipo_codigo='DOCUMENTO_LECTURA_VENCIDA',
                            usuario=usuario,
                            titulo=f'Lectura vencida: {aceptacion.documento.codigo}',
                            mensaje=(
                                f'El plazo para leer "{aceptacion.documento.titulo}" '
                                f'({aceptacion.documento.codigo}) ha vencido.'
                            ),
                            url='/mi-portal',
                            datos_extra={
                                'documento_id': aceptacion.documento_id,
                                'aceptacion_id': aceptacion.id,
                            },
                        )
                        total_notificados += 1
                    except User.DoesNotExist:
                        pass

        except Exception as e:
            logger.error(
                f'[LECTURA] Error verificando vencimientos en '
                f'{tenant.schema_name}: {e}'
            )

    logger.info(
        f'[LECTURA] Aceptaciones vencidas: {total_vencidos}, '
        f'notificados: {total_notificados}'
    )
    return {
        'vencidos': total_vencidos,
        'notificados': total_notificados,
    }


# =============================================================================
# HELPER: Envío seguro de notificaciones
# =============================================================================

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
