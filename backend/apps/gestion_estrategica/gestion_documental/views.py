"""
Views para Gestión Documental - Gestión Estratégica (N1)
Sistema de gestión documental transversal con control de versiones.

Migrado desde: apps.hseq_management.sistema_documental
NOTA: FirmaDocumentoViewSet ha sido ELIMINADO.
Las firmas digitales usan los endpoints de workflow_engine.firma_digital

v4.1: Corregido perform_create() para usar get_tenant_empresa().
      Eliminado filtro por empresa_id (tenant schema isolation lo maneja).
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q, Count
from django.contrib.contenttypes.models import ContentType
from apps.core.mixins import ExportMixin
from apps.core.base_models.mixins import get_tenant_empresa
from .models import (
    TipoDocumento,
    PlantillaDocumento,
    Documento,
    VersionDocumento,
    CampoFormulario,
    ControlDocumental
)
from .serializers import (
    TipoDocumentoListSerializer,
    TipoDocumentoDetailSerializer,
    PlantillaDocumentoListSerializer,
    PlantillaDocumentoDetailSerializer,
    DocumentoListSerializer,
    DocumentoDetailSerializer,
    VersionDocumentoListSerializer,
    VersionDocumentoDetailSerializer,
    CampoFormularioListSerializer,
    CampoFormularioDetailSerializer,
    ControlDocumentalListSerializer,
    ControlDocumentalDetailSerializer,
)


class TipoDocumentoViewSet(ExportMixin, viewsets.ModelViewSet):
    """ViewSet para Tipos de Documento"""
    permission_classes = [IsAuthenticated]
    export_fields = [('codigo', 'Código'), ('nombre', 'Nombre'), ('nivel_documento', 'Nivel'), ('prefijo_codigo', 'Prefijo'), ('requiere_aprobacion', 'Req. Aprobación'), ('requiere_firma', 'Req. Firma')]
    export_filename = 'tipos_documento'

    def get_serializer_class(self):
        if self.action == 'list':
            return TipoDocumentoListSerializer
        return TipoDocumentoDetailSerializer

    def get_queryset(self):
        queryset = TipoDocumento.objects.select_related('created_by')

        # Filtros
        activo = self.request.query_params.get('activo')
        if activo is not None:
            queryset = queryset.filter(is_active=activo.lower() == 'true')

        nivel = self.request.query_params.get('nivel')
        if nivel:
            queryset = queryset.filter(nivel_documento=nivel)

        return queryset.order_by('orden', 'codigo')

    def perform_create(self, serializer):
        empresa = get_tenant_empresa()
        serializer.save(empresa_id=empresa.id if empresa else None, created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def activos(self, request):
        """Obtiene tipos de documento activos"""
        queryset = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class PlantillaDocumentoViewSet(viewsets.ModelViewSet):
    """ViewSet para Plantillas de Documento"""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return PlantillaDocumentoListSerializer
        return PlantillaDocumentoDetailSerializer

    def get_queryset(self):
        queryset = PlantillaDocumento.objects.select_related(
            'tipo_documento', 'created_by'
        )

        # Filtros
        tipo_documento = self.request.query_params.get('tipo_documento')
        if tipo_documento:
            queryset = queryset.filter(tipo_documento_id=tipo_documento)

        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)

        tipo_plantilla = self.request.query_params.get('tipo_plantilla')
        if tipo_plantilla:
            queryset = queryset.filter(tipo_plantilla=tipo_plantilla)

        return queryset.order_by('-es_por_defecto', 'nombre')

    def perform_create(self, serializer):
        empresa = get_tenant_empresa()
        serializer.save(empresa_id=empresa.id if empresa else None, created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def activar(self, request, pk=None):
        """Activa una plantilla"""
        plantilla = self.get_object()
        plantilla.estado = 'ACTIVA'
        plantilla.save()
        return Response(PlantillaDocumentoDetailSerializer(plantilla).data)

    @action(detail=True, methods=['post'], url_path='marcar-obsoleta')
    def marcar_obsoleta(self, request, pk=None):
        """Marca plantilla como obsoleta"""
        plantilla = self.get_object()
        plantilla.estado = 'OBSOLETA'
        plantilla.save()
        return Response(PlantillaDocumentoDetailSerializer(plantilla).data)

    @action(detail=True, methods=['post'], url_path='establecer-por-defecto')
    def establecer_por_defecto(self, request, pk=None):
        """Establece plantilla como predeterminada"""
        plantilla = self.get_object()

        # Quitar flag de otras plantillas del mismo tipo
        PlantillaDocumento.objects.filter(
            empresa_id=plantilla.empresa_id,
            tipo_documento=plantilla.tipo_documento,
            es_por_defecto=True
        ).update(es_por_defecto=False)

        plantilla.es_por_defecto = True
        plantilla.save()

        return Response(PlantillaDocumentoDetailSerializer(plantilla).data)


class CampoFormularioViewSet(viewsets.ModelViewSet):
    """ViewSet para Campos de Formulario"""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return CampoFormularioListSerializer
        return CampoFormularioDetailSerializer

    def get_queryset(self):
        queryset = CampoFormulario.objects.select_related(
            'plantilla', 'tipo_documento', 'created_by'
        )

        # Filtros
        plantilla = self.request.query_params.get('plantilla')
        if plantilla:
            queryset = queryset.filter(plantilla_id=plantilla)

        tipo_documento = self.request.query_params.get('tipo_documento')
        if tipo_documento:
            queryset = queryset.filter(tipo_documento_id=tipo_documento)

        tipo_campo = self.request.query_params.get('tipo_campo')
        if tipo_campo:
            queryset = queryset.filter(tipo_campo=tipo_campo)

        activo = self.request.query_params.get('activo')
        if activo is not None:
            queryset = queryset.filter(is_active=activo.lower() == 'true')

        return queryset.order_by('orden', 'nombre_campo')

    def perform_create(self, serializer):
        empresa = get_tenant_empresa()
        serializer.save(empresa_id=empresa.id if empresa else None, created_by=self.request.user)

    @action(detail=False, methods=['post'])
    def reordenar(self, request):
        """Reordena campos de formulario"""
        orden_campos = request.data.get('orden', [])

        for index, campo_id in enumerate(orden_campos):
            CampoFormulario.objects.filter(id=campo_id).update(orden=index)

        return Response({'message': 'Campos reordenados exitosamente'})


class DocumentoViewSet(ExportMixin, viewsets.ModelViewSet):
    """
    ViewSet para Documentos.

    Las firmas digitales se manejan a través del módulo workflow_engine.firma_digital.
    Use el método get_firmas_digitales() del documento o el endpoint /firmas/ para acceder a ellas.
    """
    permission_classes = [IsAuthenticated]
    export_fields = [('codigo', 'Código'), ('titulo', 'Título'), ('tipo_documento__nombre', 'Tipo'), ('estado', 'Estado'), ('version_actual', 'Versión'), ('clasificacion', 'Clasificación'), ('fecha_publicacion', 'Fecha Publicación'), ('fecha_vigencia', 'Fecha Vigencia')]
    export_filename = 'documentos'

    def get_serializer_class(self):
        if self.action == 'list':
            return DocumentoListSerializer
        return DocumentoDetailSerializer

    def get_queryset(self):
        queryset = Documento.objects.select_related(
            'tipo_documento', 'plantilla', 'elaborado_por',
            'revisado_por', 'aprobado_por', 'documento_padre'
        ).prefetch_related('versiones')

        # Filtros
        tipo_documento = self.request.query_params.get('tipo_documento')
        if tipo_documento:
            queryset = queryset.filter(tipo_documento_id=tipo_documento)

        tipo_documento_codigo = self.request.query_params.get('tipo_documento_codigo')
        if tipo_documento_codigo:
            queryset = queryset.filter(tipo_documento__codigo=tipo_documento_codigo)

        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)

        clasificacion = self.request.query_params.get('clasificacion')
        if clasificacion:
            queryset = queryset.filter(clasificacion=clasificacion)

        # Búsqueda
        buscar = self.request.query_params.get('buscar')
        if buscar:
            queryset = queryset.filter(
                Q(codigo__icontains=buscar) |
                Q(titulo__icontains=buscar) |
                Q(resumen__icontains=buscar)
            )

        return queryset.order_by('-fecha_publicacion', 'codigo')

    def perform_create(self, serializer):
        empresa = get_tenant_empresa()
        empresa_id = empresa.id if empresa else None

        # Auto-generar codigo si no viene en el request
        codigo = serializer.validated_data.get('codigo')
        if not codigo:
            tipo_documento = serializer.validated_data.get('tipo_documento')
            if tipo_documento:
                from .services import DocumentoService
                codigo = DocumentoService.generar_codigo(tipo_documento, empresa_id)

        serializer.save(
            empresa_id=empresa_id,
            elaborado_por=self.request.user,
            codigo=codigo,
        )

    @action(detail=True, methods=['get'])
    def firmas(self, request, pk=None):
        """
        Obtiene las firmas digitales del documento.
        Las firmas están en workflow_engine.firma_digital via GenericForeignKey.
        """
        documento = self.get_object()
        from apps.workflow_engine.firma_digital.serializers import FirmaDigitalSerializer
        firmas = documento.get_firmas_digitales()
        return Response(FirmaDigitalSerializer(firmas, many=True).data)

    @action(detail=False, methods=['get'], url_path='content-type-id')
    def content_type_id(self, request):
        """Retorna el ContentType ID del modelo Documento para uso en FirmaDigital."""
        ct = ContentType.objects.get_for_model(Documento)
        return Response({
            'content_type_id': ct.id,
            'app_label': ct.app_label,
            'model': ct.model,
        })

    @action(detail=True, methods=['get'], url_path='estado-firmas')
    def estado_firmas(self, request, pk=None):
        """Retorna estado de firmas digitales del documento."""
        from .services import DocumentoService
        documento = self.get_object()
        estado = DocumentoService.obtener_estado_firmas(documento)
        return Response(estado)

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprueba un documento (valida firmas si requiere_firma)."""
        from .services import DocumentoService
        documento = self.get_object()
        empresa = get_tenant_empresa()
        try:
            doc = DocumentoService.aprobar_documento(
                documento_id=documento.id,
                usuario=request.user,
                empresa_id=empresa.id if empresa else documento.empresa_id,
                observaciones=request.data.get('observaciones', ''),
            )
            return Response(DocumentoDetailSerializer(doc).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def publicar(self, request, pk=None):
        """Publica un documento aprobado (valida firmas si requiere_firma)."""
        from .services import DocumentoService
        documento = self.get_object()
        empresa = get_tenant_empresa()
        try:
            doc = DocumentoService.publicar_documento(
                documento_id=documento.id,
                usuario=request.user,
                empresa_id=empresa.id if empresa else documento.empresa_id,
                fecha_vigencia=request.data.get('fecha_vigencia'),
            )
            return Response(DocumentoDetailSerializer(doc).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='marcar-obsoleto')
    def marcar_obsoleto(self, request, pk=None):
        """Marca documento como obsoleto."""
        from .services import DocumentoService
        documento = self.get_object()
        empresa = get_tenant_empresa()
        try:
            doc = DocumentoService.marcar_obsoleto(
                documento_id=documento.id,
                usuario=request.user,
                empresa_id=empresa.id if empresa else documento.empresa_id,
                motivo=request.data.get('motivo', 'Documento obsoleto'),
                sustituto_id=request.data.get('documento_sustituto'),
            )
            return Response(DocumentoDetailSerializer(doc).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='enviar-revision')
    def enviar_revision(self, request, pk=None):
        """Envía documento a revisión."""
        from .services import DocumentoService
        documento = self.get_object()
        empresa = get_tenant_empresa()
        try:
            doc = DocumentoService.enviar_a_revision(
                documento_id=documento.id,
                usuario=request.user,
                empresa_id=empresa.id if empresa else documento.empresa_id,
                revisor_id=request.data.get('revisor_id'),
            )
            return Response(DocumentoDetailSerializer(doc).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='incrementar-descarga')
    def incrementar_descarga(self, request, pk=None):
        """Incrementa contador de descargas"""
        documento = self.get_object()
        documento.numero_descargas += 1
        documento.save(update_fields=['numero_descargas'])
        return Response({'descargas': documento.numero_descargas})

    @action(detail=True, methods=['post'], url_path='incrementar-impresion')
    def incrementar_impresion(self, request, pk=None):
        """Incrementa contador de impresiones"""
        documento = self.get_object()
        documento.numero_impresiones += 1
        documento.save(update_fields=['numero_impresiones'])
        return Response({'impresiones': documento.numero_impresiones})

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadísticas del sistema documental para dashboard"""
        from .services import DocumentoService
        empresa = get_tenant_empresa()
        stats = DocumentoService.obtener_estadisticas(empresa.id if empresa else None)
        return Response(stats)

    @action(detail=False, methods=['get'], url_path='pendientes-revision')
    def pendientes_revision(self, request):
        """Documentos pendientes de revisión programada"""
        hoy = timezone.now().date()

        queryset = Documento.objects.filter(
            estado='PUBLICADO',
            fecha_revision_programada__lte=hoy
        )

        return Response(DocumentoListSerializer(queryset, many=True).data)

    @action(detail=False, methods=['get'], url_path='listado-maestro')
    def listado_maestro(self, request):
        """Listado maestro de documentos publicados"""
        queryset = Documento.objects.filter(
            estado='PUBLICADO'
        ).select_related('tipo_documento').order_by('tipo_documento__codigo', 'codigo')

        # Agrupar por tipo
        listado = {}
        for doc in queryset:
            tipo = doc.tipo_documento.codigo
            if tipo not in listado:
                listado[tipo] = {
                    'tipo': doc.tipo_documento.nombre,
                    'documentos': []
                }
            listado[tipo]['documentos'].append(DocumentoListSerializer(doc).data)

        return Response(listado)

    # =========================================================================
    # OCR — Fase 5: Ingesta, reprocesamiento y búsqueda full-text
    # =========================================================================

    @action(detail=False, methods=['post'], url_path='ingestar-externo')
    def ingestar_externo(self, request):
        """
        Ingesta de PDF externo: crea Documento + dispara OCR async.
        Acepta multipart/form-data con archivo PDF.
        """
        archivo = request.FILES.get('archivo')
        if not archivo:
            return Response(
                {'error': 'Se requiere un archivo PDF'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar tipo de archivo
        if not archivo.name.lower().endswith('.pdf'):
            return Response(
                {'error': 'Solo se aceptan archivos PDF'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar tamaño (50MB máximo)
        max_size = 50 * 1024 * 1024
        if archivo.size > max_size:
            return Response(
                {'error': 'El archivo excede el tamaño máximo de 50 MB'},
                status=status.HTTP_400_BAD_REQUEST
            )

        titulo = request.data.get('titulo', archivo.name.rsplit('.', 1)[0])
        tipo_documento_id = request.data.get('tipo_documento')
        clasificacion = request.data.get('clasificacion', 'INTERNO')

        if not tipo_documento_id:
            return Response(
                {'error': 'Se requiere tipo_documento'},
                status=status.HTTP_400_BAD_REQUEST
            )

        empresa = get_tenant_empresa()

        # Generar código automático
        from .services import DocumentoService
        tipo_doc = TipoDocumento.objects.get(id=tipo_documento_id)
        codigo = DocumentoService.generar_codigo(tipo_doc, empresa.id)

        documento = Documento.objects.create(
            codigo=codigo,
            titulo=titulo,
            tipo_documento=tipo_doc,
            estado='BORRADOR',
            clasificacion=clasificacion,
            elaborado_por=request.user,
            archivo_original=archivo,
            es_externo=True,
            ocr_estado='PENDIENTE',
            empresa_id=empresa.id,
        )

        # Palabras clave desde request (opcional)
        palabras = request.data.get('palabras_clave')
        if palabras:
            import json
            try:
                documento.palabras_clave = json.loads(palabras) if isinstance(
                    palabras, str
                ) else palabras
                documento.save(update_fields=['palabras_clave'])
            except (json.JSONDecodeError, TypeError):
                pass

        # Disparar OCR async
        from django.db import connection
        from .tasks import procesar_ocr_documento
        procesar_ocr_documento.delay(documento.id, connection.schema_name)

        serializer = DocumentoDetailSerializer(documento)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='reprocesar-ocr')
    def reprocesar_ocr(self, request, pk=None):
        """Re-dispara OCR para un documento (útil si falló antes)."""
        documento = self.get_object()

        archivo = documento.archivo_original or documento.archivo_pdf
        if not archivo:
            return Response(
                {'error': 'El documento no tiene archivo PDF para procesar'},
                status=status.HTTP_400_BAD_REQUEST
            )

        documento.ocr_estado = 'PENDIENTE'
        documento.ocr_metadatos = {}
        documento.save(update_fields=['ocr_estado', 'ocr_metadatos'])

        from django.db import connection
        from .tasks import procesar_ocr_documento
        procesar_ocr_documento.delay(documento.id, connection.schema_name)

        return Response({
            'mensaje': 'OCR reprogramado. Recibirá una notificación al completar.',
            'ocr_estado': 'PENDIENTE',
        })

    @action(detail=False, methods=['get'], url_path='busqueda-texto')
    def busqueda_texto(self, request):
        """
        Búsqueda full-text usando PostgreSQL tsvector.
        Query param: q (mínimo 3 caracteres).
        """
        query = request.query_params.get('q', '').strip()
        if len(query) < 3:
            return Response(
                {'error': 'La búsqueda requiere al menos 3 caracteres'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from django.contrib.postgres.search import (
            SearchQuery, SearchRank, SearchVector
        )

        search_vector = SearchVector(
            'texto_extraido', 'titulo', 'resumen',
            config='spanish'
        )
        search_query = SearchQuery(query, config='spanish')

        resultados = (
            Documento.objects
            .annotate(
                relevancia=SearchRank(search_vector, search_query),
            )
            .filter(relevancia__gt=0.01)
            .order_by('-relevancia')[:50]
        )

        data = []
        for doc in resultados:
            # Extraer fragmento relevante del texto
            extracto = ''
            if doc.texto_extraido:
                # Buscar contexto alrededor de la primera ocurrencia
                texto_lower = doc.texto_extraido.lower()
                query_lower = query.lower()
                pos = texto_lower.find(query_lower)
                if pos >= 0:
                    start = max(0, pos - 100)
                    end = min(len(doc.texto_extraido), pos + len(query) + 100)
                    extracto = ('...' if start > 0 else '') + \
                        doc.texto_extraido[start:end] + \
                        ('...' if end < len(doc.texto_extraido) else '')

            data.append({
                'id': doc.id,
                'codigo': doc.codigo,
                'titulo': doc.titulo,
                'resumen': doc.resumen[:200] if doc.resumen else '',
                'estado': doc.estado,
                'estado_display': doc.get_estado_display(),
                'clasificacion': doc.clasificacion,
                'relevancia': round(float(doc.relevancia), 4),
                'texto_extracto': extracto,
                'ocr_estado': doc.ocr_estado,
                'es_externo': doc.es_externo,
            })

        return Response(data)

    # =========================================================================
    # SCORING — Fase 6: Score de cumplimiento heurístico
    # =========================================================================

    @action(detail=True, methods=['post'], url_path='calcular-score')
    def calcular_score(self, request, pk=None):
        """Calcula y guarda el score de cumplimiento del documento."""
        documento = self.get_object()
        from .services_scoring import ScoringService
        resultado = ScoringService.actualizar_score(documento)
        return Response(resultado)

    @action(detail=False, methods=['get'], url_path='score-resumen')
    def score_resumen(self, request):
        """Dashboard de scores: promedio, distribución, incompletos."""
        from .services_scoring import ScoringService
        resumen = ScoringService.obtener_resumen(self.get_queryset())
        return Response(resumen)

    # =========================================================================
    # GOOGLE DRIVE — Fase 7: Exportación con Habeas Data
    # =========================================================================

    @action(detail=True, methods=['post'], url_path='exportar-drive')
    def exportar_drive(self, request, pk=None):
        """Exporta un documento individual a Google Drive."""
        documento = self.get_object()
        folder_id = request.data.get('folder_id')

        from django.apps import apps as django_apps
        IntegracionExterna = django_apps.get_model(
            'configuracion', 'IntegracionExterna'
        )
        integracion = IntegracionExterna.objects.filter(
            proveedor='GOOGLE_DRIVE',
            is_active=True,
        ).first()

        if not integracion:
            return Response(
                {'error': 'No hay integración de Google Drive activa configurada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from .services_drive import GoogleDriveService
            resultado = GoogleDriveService.exportar_documento(
                documento_id=documento.id,
                integracion_id=integracion.id,
                folder_id=folder_id,
                usuario=request.user,
            )
            return Response(resultado)
        except PermissionError as e:
            return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)
        except ImportError as e:
            return Response({'error': str(e)}, status=status.HTTP_501_NOT_IMPLEMENTED)

    @action(detail=False, methods=['post'], url_path='exportar-drive-lote')
    def exportar_drive_lote(self, request):
        """Exportación batch de documentos a Google Drive (async via Celery)."""
        from django.apps import apps as django_apps
        IntegracionExterna = django_apps.get_model(
            'configuracion', 'IntegracionExterna'
        )
        integracion = IntegracionExterna.objects.filter(
            proveedor='GOOGLE_DRIVE', is_active=True,
        ).first()

        if not integracion:
            return Response(
                {'error': 'No hay integración de Google Drive activa configurada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        empresa = get_tenant_empresa()
        from django.db import connection
        from .tasks import exportar_drive_lote
        exportar_drive_lote.delay(
            empresa_id=empresa.id,
            integracion_id=integracion.id,
            folder_id=request.data.get('folder_id'),
            usuario_id=request.user.id,
            filtros=request.data.get('filtros', {}),
            tenant_schema=connection.schema_name,
        )

        return Response({
            'mensaje': 'Exportación a Google Drive iniciada. '
                       'Recibirá una notificación al completar.',
        })

    def _get_client_ip(self, request):
        """Obtiene IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class VersionDocumentoViewSet(viewsets.ModelViewSet):
    """ViewSet para Versiones de Documento"""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return VersionDocumentoListSerializer
        return VersionDocumentoDetailSerializer

    def get_queryset(self):
        queryset = VersionDocumento.objects.select_related(
            'documento', 'creado_por', 'aprobado_por'
        )

        documento = self.request.query_params.get('documento')
        if documento:
            queryset = queryset.filter(documento_id=documento)

        return queryset.order_by('-fecha_version')

    def perform_create(self, serializer):
        empresa = get_tenant_empresa()
        serializer.save(empresa_id=empresa.id if empresa else None, creado_por=self.request.user)

    @action(detail=False, methods=['get'], url_path='por-documento')
    def por_documento(self, request):
        """Historial de versiones de un documento específico"""
        documento_id = request.query_params.get('documento_id')

        if not documento_id:
            return Response(
                {'error': 'Debe especificar documento_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.get_queryset().filter(documento_id=documento_id)
        serializer = VersionDocumentoListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def comparar(self, request, pk=None):
        """Compara esta versión con la anterior"""
        version_actual = self.get_object()

        version_anterior = VersionDocumento.objects.filter(
            documento=version_actual.documento,
            fecha_version__lt=version_actual.fecha_version
        ).order_by('-fecha_version').first()

        if not version_anterior:
            return Response({
                'mensaje': 'No hay versión anterior para comparar',
                'version_actual': VersionDocumentoDetailSerializer(version_actual).data
            })

        return Response({
            'version_actual': VersionDocumentoDetailSerializer(version_actual).data,
            'version_anterior': VersionDocumentoDetailSerializer(version_anterior).data,
            'cambios': version_actual.cambios_detectados
        })


# NOTA: FirmaDocumentoViewSet ha sido ELIMINADO
# Las firmas digitales se manejan a través de:
# - workflow_engine.firma_digital.views.FirmaDigitalViewSet
# - Endpoints: /api/workflows/firma-digital/firmas/
# - Documento.get_firmas_digitales() para obtener firmas de un documento específico


class ControlDocumentalViewSet(viewsets.ModelViewSet):
    """ViewSet para Control Documental"""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return ControlDocumentalListSerializer
        return ControlDocumentalDetailSerializer

    def get_queryset(self):
        queryset = ControlDocumental.objects.select_related(
            'documento', 'version_documento', 'documento_sustituto',
            'responsable_destruccion', 'created_by'
        ).prefetch_related('usuarios_distribucion')

        documento = self.request.query_params.get('documento')
        if documento:
            queryset = queryset.filter(documento_id=documento)

        tipo_control = self.request.query_params.get('tipo_control')
        if tipo_control:
            queryset = queryset.filter(tipo_control=tipo_control)

        return queryset.order_by('-fecha_distribucion')

    def perform_create(self, serializer):
        empresa = get_tenant_empresa()
        serializer.save(empresa_id=empresa.id if empresa else None, created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='confirmar-recepcion')
    def confirmar_recepcion(self, request, pk=None):
        """Confirma recepción de documento por usuario"""
        control = self.get_object()

        confirmacion = {
            'usuario_id': request.user.id,
            'usuario_nombre': request.user.get_full_name(),
            'fecha': timezone.now().isoformat(),
            'ip_address': self._get_client_ip(request)
        }

        confirmaciones = control.confirmaciones_recepcion or []
        confirmaciones.append(confirmacion)
        control.confirmaciones_recepcion = confirmaciones
        control.save()

        return Response({'message': 'Recepción confirmada exitosamente'})

    @action(detail=False, methods=['get'], url_path='distribuciones-activas')
    def distribuciones_activas(self, request):
        """Controles de distribución activos"""
        queryset = self.get_queryset().filter(
            tipo_control='DISTRIBUCION',
            documento__estado='PUBLICADO'
        )
        return Response(ControlDocumentalListSerializer(queryset, many=True).data)

    @action(detail=False, methods=['get'], url_path='documentos-obsoletos')
    def documentos_obsoletos(self, request):
        """Controles de documentos retirados/obsoletos"""
        queryset = self.get_queryset().filter(
            tipo_control='RETIRO'
        )
        return Response(ControlDocumentalListSerializer(queryset, many=True).data)

    def _get_client_ip(self, request):
        """Obtiene IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
