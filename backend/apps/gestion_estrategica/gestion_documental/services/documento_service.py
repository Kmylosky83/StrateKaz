"""
DocumentoService - Servicio de lógica de negocio para Gestión Documental.
Patron @classmethod consistente con EvidenciaService, WorkflowExecutionService.

Integración con Centro de Notificaciones para transiciones de estado.
"""
import logging
from django.apps import apps
from django.utils import timezone
from django.db.models import Count, Q

from ..models import (
    TipoDocumento,
    Documento,
    VersionDocumento,
    ControlDocumental,
    AceptacionDocumental,
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

class DocumentoService:
    """Servicio central para gestión documental."""

    @classmethod
    def generar_codigo(cls, tipo_documento, empresa_id, proceso=None):
        """
        Genera código TIPO-PROCESO-NNN (ej: PR-SST-001).

        Motor unificado (Sprint 2 — Arquitectura GD v5 §7):
        - Usa ConsecutivoConfig con código compuesto "PR-SST"
        - Auto-crea la config si no existe (get_or_create)
        - Thread-safe via select_for_update()
        - Si no hay proceso, genera TIPO-NNN (ej: PR-001)
        """
        ConsecutivoConfig = apps.get_model('organizacion', 'ConsecutivoConfig')
        tipo_code = tipo_documento.codigo

        if proceso:
            consecutivo_codigo = f'{tipo_code}-{proceso.code}'
            prefix = f'{tipo_code}-{proceso.code}'
        else:
            consecutivo_codigo = tipo_code
            prefix = tipo_code

        # Auto-crear ConsecutivoConfig si no existe para esta combinación
        config, created = ConsecutivoConfig.objects.get_or_create(
            codigo=consecutivo_codigo,
            empresa_id=empresa_id,
            defaults={
                'nombre': f'{tipo_documento.nombre} — {proceso.name if proceso else "General"}',
                'categoria': 'DOCUMENTOS',
                'prefix': prefix,
                'separator': '-',
                'padding': 3,
                'include_year': False,
                'reset_yearly': False,
                'es_sistema': True,
                'is_active': True,
            },
        )

        if created:
            logger.info(
                '[generar_codigo] ConsecutivoConfig creado: %s (empresa=%s)',
                consecutivo_codigo, empresa_id,
            )

        return ConsecutivoConfig.obtener_siguiente_consecutivo(
            consecutivo_codigo, empresa_id=empresa_id
        )

    # =========================================================================
    # API Pública para Módulos C2 (Sprint 3 — Arquitectura GD v5 §12.2)
    # =========================================================================

    @classmethod
    def archivar_registro(
        cls, pdf_file, tipo_codigo, proceso, empresa_id, usuario,
        modulo_origen='', referencia=None, titulo='', resumen='',
    ):
        """
        Deposita un PDF/registro ya completado directamente como ARCHIVADO.
        Sin ciclo de firmas. Para evidencias, inspecciones, registros operativos.

        Args:
            pdf_file: InMemoryUploadedFile o File con el PDF.
            tipo_codigo: str — código del TipoDocumento (ej: 'RG', 'AC').
            proceso: Area instance — proceso SGI.
            empresa_id: int.
            usuario: User instance.
            modulo_origen: str — 'hseq', 'talento_humano', 'pesv'.
            referencia: objeto Django (opcional) — para GenericFK de trazabilidad.
            titulo: str — título del documento.
            resumen: str — resumen del documento.

        Returns: Documento creado con estado=ARCHIVADO.
        """
        from django.contrib.contenttypes.models import ContentType

        tipo_documento = TipoDocumento.objects.get(codigo=tipo_codigo, empresa_id=empresa_id)
        codigo = cls.generar_codigo(tipo_documento, empresa_id, proceso)

        doc = Documento(
            codigo=codigo,
            titulo=titulo or f'{tipo_documento.nombre} — {proceso.name}',
            tipo_documento=tipo_documento,
            proceso=proceso,
            resumen=resumen,
            estado='ARCHIVADO',
            clasificacion='INTERNO',
            elaborado_por=usuario,
            es_auto_generado=True,
            modulo_origen=modulo_origen,
            empresa_id=empresa_id,
        )

        if referencia:
            doc.referencia_origen_type = ContentType.objects.get_for_model(referencia)
            doc.referencia_origen_id = referencia.pk

        doc.save()

        if pdf_file:
            doc.archivo_pdf.save(f'{codigo}.pdf', pdf_file, save=True)

        logger.info(
            '[archivar_registro] %s archivado desde %s (empresa=%s)',
            codigo, modulo_origen, empresa_id,
        )
        return doc

    @classmethod
    def crear_desde_modulo(
        cls, contenido, tipo_codigo, proceso, empresa_id, usuario,
        firmantes_config=None, modulo_origen='', referencia=None,
        titulo='', resumen='',
    ):
        """
        Crea un documento con ciclo de vida completo (firmas, distribución).
        Para actas, procedimientos generados por BPM.

        Args:
            contenido: str — HTML del documento.
            tipo_codigo: str — código del TipoDocumento (ej: 'AC', 'PR').
            proceso: Area instance.
            empresa_id: int.
            usuario: User instance.
            firmantes_config: list — [{cargo_id, rol_firma, orden}, ...] (opcional).
            modulo_origen: str — 'hseq', 'bpm', 'auditoria'.
            referencia: objeto Django (opcional).
            titulo: str.
            resumen: str.

        Returns: Documento creado con estado=BORRADOR + FirmaDigital creadas.
        """
        from django.contrib.contenttypes.models import ContentType

        tipo_documento = TipoDocumento.objects.get(codigo=tipo_codigo, empresa_id=empresa_id)
        codigo = cls.generar_codigo(tipo_documento, empresa_id, proceso)

        doc = Documento(
            codigo=codigo,
            titulo=titulo or f'{tipo_documento.nombre} — {proceso.name}',
            tipo_documento=tipo_documento,
            proceso=proceso,
            contenido=contenido,
            resumen=resumen,
            estado='BORRADOR',
            clasificacion='INTERNO',
            elaborado_por=usuario,
            es_auto_generado=True,
            modulo_origen=modulo_origen,
            empresa_id=empresa_id,
        )

        if referencia:
            doc.referencia_origen_type = ContentType.objects.get_for_model(referencia)
            doc.referencia_origen_id = referencia.pk

        doc.save()

        # Crear firmas digitales si se proporcionan firmantes
        if firmantes_config and tipo_documento.requiere_firma:
            ct = ContentType.objects.get_for_model(Documento)
            try:
                FirmaDigital = apps.get_model('firma_digital', 'FirmaDigital')
                Cargo = apps.get_model('core', 'Cargo')
                User = apps.get_model('core', 'User')

                for fc in firmantes_config:
                    cargo = Cargo.objects.get(pk=fc['cargo_id'])
                    # Buscar usuario con ese cargo
                    firmante = User.objects.filter(cargo=cargo, is_active=True).first()
                    if firmante:
                        FirmaDigital.objects.create(
                            content_type=ct,
                            object_id=str(doc.pk),
                            usuario=firmante,
                            cargo=cargo,
                            rol_firma=fc.get('rol_firma', 'ELABORO'),
                            orden=fc.get('orden', 0),
                            estado='PENDIENTE',
                            empresa_id=empresa_id,
                        )
            except Exception as e:
                logger.warning('[crear_desde_modulo] Error creando firmas: %s', e)

        logger.info(
            '[crear_desde_modulo] %s creado desde %s con %d firmantes (empresa=%s)',
            codigo, modulo_origen, len(firmantes_config or []), empresa_id,
        )
        return doc

    @classmethod
    def enviar_a_revision(cls, documento_id, usuario, empresa_id, revisor_id=None):
        """BORRADOR -> EN_REVISION."""
        doc = Documento.objects.get(id=documento_id, empresa_id=empresa_id)
        if doc.estado != 'BORRADOR':
            raise ValueError('Solo se pueden enviar borradores a revisión')

        # Bloquear si el tipo requiere firma pero no hay firmantes asignados
        if doc.tipo_documento.requiere_firma:
            estado_firmas = cls.obtener_estado_firmas(doc)
            if estado_firmas['total'] == 0:
                raise ValueError(
                    'Este tipo de documento requiere firma digital. '
                    'Use "Solicitar Firmas" para asignar firmantes antes de enviar a revisión.'
                )

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
    def devolver_a_borrador(cls, documento_id, usuario, empresa_id, motivo=''):
        """EN_REVISION -> BORRADOR. Permite desbloquear documentos enviados sin firmantes."""
        doc = Documento.objects.get(id=documento_id, empresa_id=empresa_id)
        if doc.estado != 'EN_REVISION':
            raise ValueError('Solo se pueden devolver documentos en revisión')

        doc.estado = 'BORRADOR'
        doc.revisado_por = None
        doc.save(update_fields=['estado', 'revisado_por_id', 'updated_at'])

        # Notificar al elaborador
        if doc.elaborado_por and doc.elaborado_por != usuario:
            _send_notification(
                tipo_codigo='DOCUMENTO_DEVUELTO',
                usuario=doc.elaborado_por,
                titulo=f'Documento devuelto a borrador: {doc.codigo}',
                mensaje=(
                    f'El documento "{doc.titulo}" ({doc.codigo}) fue devuelto '
                    f'a borrador por {usuario.get_full_name()}.'
                    f'{f" Motivo: {motivo}" if motivo else ""}'
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

        # ── Invalidar aceptaciones de versiones anteriores ─────────────────
        # Sprint 1 — Arquitectura GD v5 §5.4: al publicar nueva versión,
        # las AceptacionDocumental de versiones previas se invalidan y se
        # re-distribuyen para que los usuarios lean la versión actualizada.
        invalidadas = AceptacionDocumental.objects.filter(
            documento=doc,
            invalidada=False,
        ).exclude(
            version_documento=doc.version_actual,
        ).update(invalidada=True)

        if invalidadas > 0:
            logger.info(
                '[publicar] Documento %s v%s: %d aceptaciones de versiones anteriores invalidadas',
                doc.codigo, doc.version_actual, invalidadas,
            )

        # Distribuir lectura obligatoria a TODOS los usuarios activos
        if doc.lectura_obligatoria:
            cls._distribuir_lectura_obligatoria(doc, usuario)

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
        """
        Dashboard stats completas para Gestión Documental.
        Incluye: totales por estado, por tipo, por nivel, revisiones,
        distribución y lecturas (AceptacionDocumental).
        Diseñado para consumo por BI y dashboard interno.
        """
        from apps.gestion_estrategica.gestion_documental.models import AceptacionDocumental

        hoy = timezone.now().date()
        docs = Documento.objects.filter(empresa_id=empresa_id)

        # ── Totales por estado ────────────────────────────────────────────
        por_estado_raw = dict(
            docs.values_list('estado').annotate(total=Count('id')).values_list('estado', 'total')
        )
        por_estado = {
            'borrador': por_estado_raw.get('BORRADOR', 0),
            'en_revision': por_estado_raw.get('EN_REVISION', 0),
            'aprobado': por_estado_raw.get('APROBADO', 0),
            'publicado': por_estado_raw.get('PUBLICADO', 0),
            'obsoleto': por_estado_raw.get('OBSOLETO', 0),
            'archivado': por_estado_raw.get('ARCHIVADO', 0),
        }

        # ── Por tipo de documento (normalizado: clave 'nombre') ───────────
        por_tipo = [
            {'nombre': row['tipo_documento__nombre'], 'total': row['total']}
            for row in (
                docs.values('tipo_documento__nombre')
                .annotate(total=Count('id'))
                .order_by('-total')[:20]
            )
            if row['tipo_documento__nombre']
        ]

        # ── Por nivel de documento (ESTRATEGICO/TACTICO/OPERATIVO/SOPORTE) ─
        por_nivel = [
            {'nivel': row['tipo_documento__nivel_documento'], 'total': row['total']}
            for row in (
                docs.values('tipo_documento__nivel_documento')
                .annotate(total=Count('id'))
                .order_by('-total')
            )
            if row['tipo_documento__nivel_documento']
        ]

        # ── Score de cobertura (publicados vs total) ──────────────────────
        total = docs.count()
        publicados = por_estado['publicado']
        score_promedio = round((publicados / total) * 100) if total > 0 else 0

        # ── Revisiones programadas ────────────────────────────────────────
        revision_vencida = docs.filter(
            estado='PUBLICADO',
            fecha_revision_programada__lte=hoy,
        ).count()
        proximas_revision = docs.filter(
            estado='PUBLICADO',
            fecha_revision_programada__gt=hoy,
            fecha_revision_programada__lte=hoy + timezone.timedelta(days=30),
        ).count()

        # ── Distribución (ControlDocumental) ─────────────────────────────
        distribuciones = ControlDocumental.objects.filter(
            empresa_id=empresa_id,
            tipo_control='DISTRIBUCION',
            documento__estado='PUBLICADO',
        )
        total_distribuciones = distribuciones.count()
        total_confirmaciones = sum(
            len(d.confirmaciones_recepcion or [])
            for d in distribuciones.only('confirmaciones_recepcion')
        )

        # ── Lecturas (AceptacionDocumental) ───────────────────────────────
        lecturas = AceptacionDocumental.objects.filter(empresa_id=empresa_id)
        lecturas_pendientes = lecturas.filter(estado__in=['PENDIENTE', 'EN_PROGRESO']).count()
        lecturas_completadas = lecturas.filter(estado='ACEPTADO').count()
        lecturas_vencidas = lecturas.filter(estado='VENCIDO').count()
        lecturas_total = lecturas.count()

        return {
            'total': total,
            # Shortcuts directos (más convenientes que .por_estado.publicado)
            'publicados': publicados,
            'obsoletos': por_estado['obsoleto'],
            'archivados': por_estado['archivado'],
            'score_promedio': score_promedio,
            # Desglose por estado
            'por_estado': por_estado,
            # Desglose por tipo y nivel (para gráficas BI)
            'por_tipo': por_tipo,
            'por_nivel': por_nivel,
            # Revisiones
            'revision_vencida': revision_vencida,
            'proximas_revision_30d': proximas_revision,
            # Distribución
            'distribucion': {
                'total_distribuciones': total_distribuciones,
                'total_confirmaciones': total_confirmaciones,
            },
            # Lecturas obligatorias
            'lecturas_total': lecturas_total,
            'lecturas_pendientes': lecturas_pendientes,
            'lecturas_completadas': lecturas_completadas,
            'lecturas_vencidas': lecturas_vencidas,
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
    def iniciar_revision_automatica(cls, documento_id, empresa_id):
        """
        Inicia un ciclo de revisión automático para un documento PUBLICADO vencido.
        PUBLICADO → BORRADOR (nueva versión mayor).

        Crea un VersionDocumento snapshot del estado publicado antes de
        iniciar el borrador, para preservar la trazabilidad ISO 7.5.

        Guarda: no modifica estado si ya está en BORRADOR (idempotente).
        Retorna: (doc, creado) donde creado=True si se inició la revisión.
        """
        doc = Documento.objects.get(id=documento_id, empresa_id=empresa_id)

        if doc.estado != 'PUBLICADO':
            return doc, False

        # Snapshot de la versión publicada actual
        VersionDocumento.objects.filter(
            documento=doc, is_version_actual=True
        ).update(is_version_actual=False)

        VersionDocumento.objects.create(
            documento=doc,
            numero_version=doc.version_actual,
            tipo_cambio='REVISION_MAYOR',
            contenido_snapshot=doc.contenido,
            datos_formulario_snapshot=doc.datos_formulario,
            descripcion_cambios='Snapshot automático — inicio revisión programada',
            creado_por=doc.elaborado_por,
            aprobado_por=doc.aprobado_por,
            fecha_aprobacion=doc.fecha_aprobacion,
            is_version_actual=False,
            empresa_id=empresa_id,
        )

        # Incrementar versión mayor (1.0 → 2.0, 2.3 → 3.0)
        try:
            major = int(doc.version_actual.split('.')[0])
            nueva_version = f'{major + 1}.0'
        except (ValueError, IndexError):
            nueva_version = '2.0'

        doc.estado = 'BORRADOR'
        doc.version_actual = nueva_version
        doc.numero_revision = (doc.numero_revision or 0) + 1
        doc.motivo_cambio_version = 'Revisión programada automática por vencimiento'
        doc.aprobado_por = None
        doc.revisado_por = None
        doc.fecha_aprobacion = None
        doc.save(update_fields=[
            'estado', 'version_actual', 'numero_revision',
            'motivo_cambio_version', 'aprobado_por_id',
            'revisado_por_id', 'fecha_aprobacion', 'updated_at',
        ])

        # Notificar al elaborador
        if doc.elaborado_por:
            _send_notification(
                tipo_codigo='DOCUMENTO_REVISION_INICIADA',
                usuario=doc.elaborado_por,
                titulo=f'Revisión programada iniciada: {doc.codigo}',
                mensaje=(
                    f'El documento "{doc.titulo}" ({doc.codigo}) inició su ciclo '
                    f'de revisión programada automáticamente. '
                    f'Nueva versión: {nueva_version}. Por favor actualice el contenido.'
                ),
                url='/gestion-documental/documentos?section=en_proceso',
                datos_extra={
                    'documento_id': doc.id,
                    'codigo': doc.codigo,
                    'titulo': doc.titulo,
                    'version_anterior': doc.version_actual,
                    'nueva_version': nueva_version,
                },
                prioridad='alta',
            )

        logger.info(
            '[iniciar_revision_automatica] %s (%s) → BORRADOR v%s',
            doc.codigo, doc.titulo, nueva_version,
        )
        return doc, True

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


    # =========================================================================
    # Auto-documentación: generar contenido de procedimiento desde workflow
    # =========================================================================

    @classmethod
    def generar_contenido_desde_workflow(cls, instancia, config=None):
        """
        Convierte los nodos de un workflow completado en secciones de
        procedimiento documentado. Cada nodo se traduce a una sección
        con objetivo, responsable, entradas, salidas y descripción.

        Args:
            instancia: InstanciaFlujo completada con nodos ejecutados
            config: dict opcional con personalización

        Returns:
            str: Contenido HTML estructurado como procedimiento ISO
        """
        from django.apps import apps as django_apps

        config = config or {}

        # Obtener nodos ejecutados del workflow
        try:
            NodoInstancia = django_apps.get_model('ejecucion', 'NodoInstancia')
            nodos = NodoInstancia.objects.filter(
                instancia=instancia,
            ).select_related('nodo_plantilla').order_by('orden', 'created_at')
        except Exception as e:
            logger.warning(f'[Auto-doc] Error obteniendo nodos: {e}')
            nodos = []

        # Obtener info de la plantilla de flujo
        try:
            PlantillaFlujo = django_apps.get_model(
                'disenador_flujos', 'PlantillaFlujo'
            )
            plantilla_flujo = PlantillaFlujo.objects.filter(
                id=instancia.plantilla_id
            ).first()
        except Exception:
            plantilla_flujo = None

        # Header del procedimiento
        fecha_fin = (
            instancia.fecha_fin.strftime('%d/%m/%Y')
            if hasattr(instancia, 'fecha_fin') and instancia.fecha_fin
            else ''
        )
        titulo = instancia.titulo or 'Procedimiento'

        secciones_html = []

        # Sección 1: Objetivo
        objetivo = config.get('objetivo', '')
        if not objetivo and plantilla_flujo:
            objetivo = getattr(plantilla_flujo, 'descripcion', '') or ''
        secciones_html.append(f'''
        <h2>1. Objetivo</h2>
        <p>{objetivo or f"Establecer el procedimiento para {titulo}."}</p>
        ''')

        # Sección 2: Alcance
        alcance = config.get('alcance', '')
        secciones_html.append(f'''
        <h2>2. Alcance</h2>
        <p>{alcance or "Aplica a todas las áreas y procesos involucrados en este flujo."}</p>
        ''')

        # Sección 3: Definiciones (si las hay en config)
        definiciones = config.get('definiciones', [])
        if definiciones:
            defs_html = ''.join(
                f'<li><strong>{d["termino"]}</strong>: {d["definicion"]}</li>'
                for d in definiciones
            )
            secciones_html.append(f'''
            <h2>3. Definiciones</h2>
            <ul>{defs_html}</ul>
            ''')

        # Sección 4: Desarrollo del procedimiento (nodos → pasos)
        secciones_html.append('<h2>4. Desarrollo del Procedimiento</h2>')

        TIPO_NODO_SKIP = {'INICIO', 'FIN', 'CONECTOR', 'NOTA'}
        paso_num = 0

        for nodo in nodos:
            nodo_plantilla = nodo.nodo_plantilla if hasattr(nodo, 'nodo_plantilla') else None
            tipo_nodo = getattr(nodo_plantilla, 'tipo_nodo', '') if nodo_plantilla else ''

            if tipo_nodo in TIPO_NODO_SKIP:
                continue

            paso_num += 1
            nombre = (
                getattr(nodo_plantilla, 'nombre', '')
                if nodo_plantilla else ''
            ) or f'Paso {paso_num}'
            descripcion = (
                getattr(nodo_plantilla, 'descripcion', '')
                if nodo_plantilla else ''
            ) or ''
            responsable = ''
            if nodo_plantilla and hasattr(nodo_plantilla, 'config'):
                nodo_config = nodo_plantilla.config or {}
                responsable = nodo_config.get('responsable', '')

            # Tipo de paso visual
            tipo_label = {
                'TAREA': 'Actividad',
                'DECISION': 'Decisión',
                'APROBACION': 'Aprobación',
                'NOTIFICACION': 'Notificación',
                'SUBPROCESO': 'Subproceso',
                'TEMPORIZADOR': 'Espera',
            }.get(tipo_nodo, 'Actividad')

            secciones_html.append(f'''
            <h3>4.{paso_num}. {nombre}</h3>
            <table>
                <tr>
                    <th style="width: 25%;">Tipo</th>
                    <td>{tipo_label}</td>
                </tr>
                {f'<tr><th>Responsable</th><td>{responsable}</td></tr>' if responsable else ''}
                <tr>
                    <th>Descripción</th>
                    <td>{descripcion or "Ejecutar según instrucciones del proceso."}</td>
                </tr>
            </table>
            ''')

        if paso_num == 0:
            secciones_html.append(
                '<p><em>No se encontraron pasos en el flujo ejecutado.</em></p>'
            )

        # Sección 5: Registros y evidencias
        secciones_html.append(f'''
        <h2>5. Registros y Evidencias</h2>
        <p>Los registros generados durante la ejecución de este procedimiento
        se almacenan en el sistema de gestión documental de StrateKaz.</p>
        <p><strong>Fecha de generación automática:</strong> {fecha_fin}</p>
        <p><strong>Flujo origen:</strong> {titulo}</p>
        ''')

        return '\n'.join(secciones_html)

    # =========================================================================
    # Distribución de lecturas obligatorias
    # =========================================================================

    @classmethod
    def _distribuir_lectura_obligatoria(cls, documento, publicado_por):
        """
        Al publicar un documento con lectura_obligatoria=True, crea
        AceptacionDocumental PENDIENTE para TODOS los usuarios activos
        con cargo (empleados). Notifica a cada uno.

        Idempotente: usa get_or_create para no duplicar si ya existe.
        """
        from ..models import AceptacionDocumental

        User = apps.get_model('core', 'User')
        usuarios = User.objects.filter(
            is_active=True,
            deleted_at__isnull=True,
            cargo__isnull=False,
        ).exclude(id=publicado_por.id if publicado_por else 0)

        creados = 0
        for user in usuarios.iterator():
            _, was_created = AceptacionDocumental.objects.get_or_create(
                documento=documento,
                version_documento=documento.version_actual,
                usuario=user,
                empresa_id=documento.empresa_id,
                defaults={
                    'estado': 'PENDIENTE',
                    'asignado_por': publicado_por,
                },
            )
            if was_created:
                creados += 1
                _send_notification(
                    tipo_codigo='LECTURA_OBLIGATORIA',
                    usuario=user,
                    titulo=f'Lectura obligatoria: {documento.titulo}',
                    mensaje=(
                        f'Se le ha asignado la lectura obligatoria del documento '
                        f'"{documento.titulo}" ({documento.codigo}). '
                        f'Debe leerlo y aceptarlo desde Mi Portal > Lecturas Pendientes.'
                    ),
                    url='/mi-portal?tab=lecturas',
                    datos_extra={
                        'documento_id': documento.id,
                        'codigo': documento.codigo,
                        'titulo': documento.titulo,
                        'version': documento.version_actual,
                        'lectura_obligatoria': True,
                    },
                    prioridad='alta',
                )

        logger.info(
            '[lectura_obligatoria] Documento %s publicado → %d lecturas asignadas de %d usuarios',
            documento.codigo, creados, usuarios.count(),
        )

    @classmethod
    def verificar_habeas_data_publicada(cls, empresa_id):
        """
        Verifica si el tenant tiene una Política de Datos Personales publicada.
        Retorna dict con estado y datos para banner de dashboard.
        """
        doc = Documento.objects.filter(
            empresa_id=empresa_id,
            tipo_documento__codigo='POL',
            titulo__icontains='datos personales',
        ).order_by('-updated_at').first()

        if not doc:
            return {
                'tiene_politica': False,
                'estado': None,
                'mensaje': 'No existe Política de Tratamiento de Datos Personales. '
                           'Créela desde Gestión Documental para cumplir con la Ley 1581/2012.',
            }

        if doc.estado != 'PUBLICADO':
            return {
                'tiene_politica': True,
                'estado': doc.estado,
                'documento_id': doc.id,
                'codigo': doc.codigo,
                'mensaje': (
                    f'La Política de Datos Personales ({doc.codigo}) está en estado '
                    f'{doc.get_estado_display()}. Debe ser aprobada y publicada para '
                    f'cumplir con la Ley 1581/2012.'
                ),
            }

        return {
            'tiene_politica': True,
            'estado': 'PUBLICADO',
            'documento_id': doc.id,
            'codigo': doc.codigo,
            'fecha_publicacion': str(doc.fecha_publicacion) if doc.fecha_publicacion else None,
        }

    @classmethod
    def contar_lecturas_pendientes_obligatorias(cls, usuario):
        """
        Cuenta lecturas pendientes de documentos con lectura_obligatoria=True
        para un usuario específico. Usado en login response y badge de campana.
        """
        from ..models import AceptacionDocumental

        return AceptacionDocumental.objects.filter(
            usuario=usuario,
            estado__in=['PENDIENTE', 'EN_PROGRESO'],
            documento__lectura_obligatoria=True,
            documento__estado='PUBLICADO',
        ).count()

    @classmethod
    def obtener_cobertura_documental(cls):
        """
        Analiza qué procesos/módulos tienen procedimientos documentados
        y cuáles no. Útil para auditorías ISO y dashboards.

        Returns:
            dict: {
                'total_tipos': int,
                'con_documentos': int,
                'sin_documentos': int,
                'cobertura_pct': float,
                'detalle': [
                    {'tipo': 'Procedimiento', 'total': 5, 'publicados': 3, ...}
                ],
                'workflows_sin_procedimiento': [...]
            }
        """
        from django.apps import apps as django_apps

        tipos = TipoDocumento.objects.filter(is_active=True)
        detalle = []
        total_docs = 0
        total_publicados = 0

        for tipo in tipos:
            docs = Documento.objects.filter(tipo_documento=tipo)
            publicados = docs.filter(estado='PUBLICADO').count()
            total = docs.count()
            total_docs += total
            total_publicados += publicados

            detalle.append({
                'tipo_id': tipo.id,
                'tipo_codigo': tipo.codigo,
                'tipo_nombre': tipo.nombre,
                'total': total,
                'publicados': publicados,
                'borradores': docs.filter(estado='BORRADOR').count(),
                'en_revision': docs.filter(estado='EN_REVISION').count(),
                'obsoletos': docs.filter(estado='OBSOLETO').count(),
            })

        # Workflows sin procedimiento documentado (si workflow_engine instalado)
        workflows_sin_doc = []
        try:
            PlantillaFlujo = django_apps.get_model(
                'disenador_flujos', 'PlantillaFlujo'
            )
            plantillas_flujo = PlantillaFlujo.objects.filter(
                is_active=True
            )
            for pf in plantillas_flujo:
                tiene_doc = Documento.objects.filter(
                    workflow_asociado_id=pf.id,
                    estado__in=['PUBLICADO', 'APROBADO', 'EN_REVISION'],
                ).exists()
                if not tiene_doc:
                    workflows_sin_doc.append({
                        'id': pf.id,
                        'nombre': pf.nombre if hasattr(pf, 'nombre') else str(pf),
                        'tiene_auto_gen': bool(
                            getattr(pf, 'config_auto_generacion', {})
                            .get('habilitado', False)
                        ),
                    })
        except Exception:
            pass  # workflow_engine no instalado

        con_documentos = sum(1 for d in detalle if d['total'] > 0)
        total_tipos = len(detalle)

        return {
            'total_tipos': total_tipos,
            'con_documentos': con_documentos,
            'sin_documentos': total_tipos - con_documentos,
            'cobertura_pct': round(
                (con_documentos / total_tipos * 100) if total_tipos > 0 else 0, 1
            ),
            'total_documentos': total_docs,
            'total_publicados': total_publicados,
            'detalle_por_tipo': detalle,
            'workflows_sin_procedimiento': workflows_sin_doc,
        }


def interpolar_variables_empresa(contenido):
    """
    Reemplaza variables {{empresa_*}} en el contenido HTML de un documento
    con los datos reales del tenant (EmpresaConfig).

    Variables soportadas:
    - {{empresa_nombre}} → Razón social
    - {{empresa_nit}} → NIT
    - {{empresa_direccion}} → Dirección
    - {{empresa_telefono}} → Teléfono
    - {{empresa_email}} → Email de contacto
    - {{empresa_ciudad}} → Ciudad
    - {{empresa_representante_legal}} → Representante legal
    - {{fecha_actual}} → Fecha actual formateada

    Se ejecuta al crear un documento desde una plantilla, para que el
    contenido ya venga con los datos reales de la empresa (BPM, no Word).
    """
    import re

    if not contenido or '{{' not in contenido:
        return contenido

    # Los datos de empresa viven en el Tenant (schema público).
    # EmpresaConfig solo tiene nit y razon_social como placeholder.
    # Leer siempre del Tenant para obtener datos completos y reales.
    variables = {}
    try:
        from django.db import connection
        tenant = getattr(connection, 'tenant', None)
        if tenant and hasattr(tenant, 'nit'):
            variables = {
                'empresa_nombre': getattr(tenant, 'razon_social', '') or getattr(tenant, 'nombre_comercial', '') or getattr(tenant, 'name', '') or '',
                'empresa_nit': getattr(tenant, 'nit', '') or '',
                'empresa_razon_social': getattr(tenant, 'razon_social', '') or '',
                'empresa_nombre_comercial': getattr(tenant, 'nombre_comercial', '') or '',
                'empresa_representante_legal': getattr(tenant, 'representante_legal', '') or '',
                'empresa_cedula_representante': getattr(tenant, 'cedula_representante', '') or '',
                'empresa_ciudad': getattr(tenant, 'ciudad', '') or getattr(tenant, 'camara_comercio', '') or '',
                'empresa_pais': getattr(tenant, 'pais', 'Colombia') or 'Colombia',
                'empresa_email': getattr(tenant, 'email', '') or '',
                'empresa_telefono': getattr(tenant, 'telefono', '') or '',
                'empresa_direccion': getattr(tenant, 'direccion', '') or '',
            }
    except Exception as e:
        logger.warning('[documental] No se pudo obtener datos del Tenant: %s', e)

    # Agregar fecha actual
    variables['fecha_actual'] = timezone.now().strftime('%d de %B de %Y')

    # Reemplazar variables en el contenido
    for key, value in variables.items():
        contenido = contenido.replace(f'{{{{{key}}}}}', str(value))

    return contenido
