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


def auto_asignar_firmantes_desde_plantilla(documento, plantilla):
    """
    Resuelve firmantes_por_defecto de una plantilla y crea FirmaDigital
    records para un Documento recién creado.

    Regla C2→C2: usa apps.get_model() en vez de import directo
    de workflow_engine.

    Returns:
        dict: {
            'firmantes_creados': [FirmaDigital, ...],
            'warnings': ['Cargo X no tiene usuario asignado', ...],
        }
    """
    from django.contrib.contenttypes.models import ContentType

    firmantes_config = plantilla.firmantes_por_defecto
    if not firmantes_config:
        return {'firmantes_creados': [], 'warnings': []}

    FirmaDigital = apps.get_model('firma_digital', 'FirmaDigital')
    HistorialFirma = apps.get_model('firma_digital', 'HistorialFirma')
    Cargo = apps.get_model('core', 'Cargo')
    User = apps.get_model('core', 'User')

    content_type = ContentType.objects.get_for_model(documento)
    firmantes_creados = []
    warnings = []

    for config in firmantes_config:
        cargo_code = config.get('cargo_code', '')
        rol_firma = config.get('rol_firma', 'ELABORO')
        orden = config.get('orden', 0)

        # Resolver cargo por code
        try:
            cargo = Cargo.objects.get(code=cargo_code, is_active=True)
        except Cargo.DoesNotExist:
            warnings.append(
                f'Cargo "{cargo_code}" no encontrado o inactivo. '
                f'Firmante {rol_firma} debe asignarse manualmente.'
            )
            continue

        # Resolver usuario activo con ese cargo
        usuario = User.objects.filter(
            cargo=cargo, is_active=True, deleted_at__isnull=True
        ).first()

        if not usuario:
            warnings.append(
                f'No hay usuario activo con cargo "{cargo.name}" '
                f'({cargo_code}). Firmante {rol_firma} debe asignarse manualmente.'
            )
            continue

        # Crear FirmaDigital en PENDIENTE
        try:
            firma = FirmaDigital.objects.create(
                content_type=content_type,
                object_id=documento.pk,
                configuracion_flujo=None,
                nodo_flujo=None,
                usuario=usuario,
                cargo=cargo,
                rol_firma=rol_firma,
                orden=orden,
                estado='PENDIENTE',
                firma_imagen='',
                documento_hash='pending',
                ip_address='0.0.0.0',
                user_agent='auto-assigned-from-plantilla',
            )
            firmantes_creados.append(firma)

            # Historial de auditoría
            HistorialFirma.objects.create(
                firma=firma,
                accion='FIRMA_CREADA',
                usuario=usuario,
                descripcion=(
                    f'Auto-asignado desde plantilla "{plantilla.codigo}": '
                    f'{rol_firma} → {usuario.get_full_name()}'
                ),
                metadatos={
                    'plantilla_codigo': plantilla.codigo,
                    'cargo_code': cargo_code,
                    'auto_asignado': True,
                },
                ip_address='0.0.0.0',
            )
            logger.info(
                '[documental] Auto-asignado firmante: %s (%s) como %s para doc %s',
                usuario.get_full_name(), cargo_code, rol_firma, documento.pk,
            )
        except Exception as e:
            logger.error(
                '[documental] Error creando FirmaDigital para %s/%s: %s',
                cargo_code, rol_firma, e,
            )
            warnings.append(f'Error al crear firma para {rol_firma}: {str(e)}')

    return {'firmantes_creados': firmantes_creados, 'warnings': warnings}
