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
from apps.core.permissions import GranularActionPermission
from django.utils import timezone
from django.db.models import Q, Count
from django.contrib.contenttypes.models import ContentType
from apps.core.mixins import ExportMixin
from apps.core.base_models.mixins import get_tenant_empresa
from apps.audit_system.services import AuditSystemService
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
from .services import DocumentoService


class TipoDocumentoViewSet(ExportMixin, viewsets.ModelViewSet):
    """ViewSet para Tipos de Documento"""
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'documentos'
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
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'documentos'

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

    @action(detail=True, methods=['get'], url_path='resolver-firmantes')
    def resolver_firmantes(self, request, pk=None):
        """
        Preview: resuelve firmantes_por_defecto a usuarios actuales.
        Muestra quién firmaría si se crea un documento hoy desde esta plantilla.
        """
        from django.apps import apps
        plantilla = self.get_object()
        firmantes_config = plantilla.firmantes_por_defecto or []

        if not firmantes_config:
            return Response({
                'firmantes': [],
                'mensaje': 'Esta plantilla no tiene firmantes por defecto configurados.',
            })

        Cargo = apps.get_model('core', 'Cargo')
        User = apps.get_model('core', 'User')
        resultado = []

        for config in firmantes_config:
            cargo_code = config.get('cargo_code', '')
            rol_firma = config.get('rol_firma', '')
            item = {
                'rol_firma': rol_firma,
                'cargo_code': cargo_code,
                'orden': config.get('orden', 0),
                'es_requerido': config.get('es_requerido', True),
                'cargo_nombre': None,
                'usuario_nombre': None,
                'usuario_id': None,
                'resuelto': False,
                'warning': None,
            }

            try:
                cargo = Cargo.objects.get(code=cargo_code, is_active=True)
                item['cargo_nombre'] = cargo.name
            except Cargo.DoesNotExist:
                item['warning'] = f'Cargo "{cargo_code}" no encontrado'
                resultado.append(item)
                continue

            usuario = User.objects.filter(
                cargo=cargo, is_active=True, deleted_at__isnull=True
            ).first()

            if usuario:
                item['usuario_nombre'] = usuario.get_full_name()
                item['usuario_id'] = usuario.pk
                item['resuelto'] = True
            else:
                item['warning'] = f'Sin usuario activo con cargo "{cargo.name}"'

            resultado.append(item)

        return Response({
            'firmantes': resultado,
            'total': len(resultado),
            'resueltos': sum(1 for f in resultado if f['resuelto']),
        })


class CampoFormularioViewSet(viewsets.ModelViewSet):
    """ViewSet para Campos de Formulario"""
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'documentos'

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
        """Reordena campos de formulario.
        Acepta dos formatos:
        - {campos: [{id, orden}, ...]} — frontend actual
        - {orden: [id1, id2, ...]} — formato legacy
        """
        campos = request.data.get('campos', [])
        if campos:
            for item in campos:
                CampoFormulario.objects.filter(id=item['id']).update(orden=item['orden'])
        else:
            # Formato legacy: lista plana de IDs
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
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'documentos'
    export_fields = [('codigo', 'Código'), ('titulo', 'Título'), ('tipo_documento__nombre', 'Tipo'), ('estado', 'Estado'), ('version_actual', 'Versión'), ('clasificacion', 'Clasificación'), ('fecha_publicacion', 'Fecha Publicación'), ('fecha_vigencia', 'Fecha Vigencia')]
    export_filename = 'documentos'

    # Self-service: endpoints accesibles sin RBAC (Mi Portal, Dashboard)
    SELF_SERVICE_ACTIONS = {'habeas_data_status', 'mis_lecturas_count'}

    def get_permissions(self):
        if self.action in self.SELF_SERVICE_ACTIONS:
            return [IsAuthenticated()]
        return super().get_permissions()

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
        from rest_framework.exceptions import PermissionDenied
        user = self.request.user

        # Solo usuarios con cargo asignado pueden crear documentos SGI.
        # El superadmin administra la plataforma pero no opera como funcionario
        # dentro del sistema de gestión. Los documentos deben tener un responsable
        # con cargo real (estructura organizacional).
        if not getattr(user, 'cargo', None):
            raise PermissionDenied(
                'Debes tener un cargo asignado para crear documentos. '
                'Los documentos SGI requieren un responsable con cargo en la organización.'
            )

        empresa = get_tenant_empresa()
        empresa_id = empresa.id if empresa else None

        # Auto-generar codigo si no viene en el request
        codigo = serializer.validated_data.get('codigo')
        if not codigo:
            tipo_documento = serializer.validated_data.get('tipo_documento')
            if tipo_documento:
                from .services import DocumentoService
                codigo = DocumentoService.generar_codigo(tipo_documento, empresa_id)

        documento = serializer.save(
            empresa_id=empresa_id,
            elaborado_por=self.request.user,
            codigo=codigo,
        )

        # Registrar en LogCambio (Centro de Control)
        AuditSystemService.log_cambio(
            self.request.user, documento, 'crear',
            {'creado': {'old': None, 'new': f'{documento.codigo} - {documento.titulo}'}},
            self.request,
        )

        # Auto-interpolar variables de empresa en contenido de plantilla
        if documento.plantilla and documento.contenido:
            from .services.documento_service import interpolar_variables_empresa
            documento.contenido = interpolar_variables_empresa(documento.contenido)
            documento.save(update_fields=['contenido', 'updated_at'])

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

    @action(detail=False, methods=['get'], url_path='habeas-data-status')
    def habeas_data_status(self, request):
        """
        Estado de la Política de Habeas Data del tenant.
        Usado por dashboard para mostrar banner si no está publicada.
        """
        empresa = get_tenant_empresa()
        if not empresa:
            return Response({'tiene_politica': False, 'estado': None})
        resultado = DocumentoService.verificar_habeas_data_publicada(empresa.id)
        return Response(resultado)

    @action(detail=False, methods=['get'], url_path='mis-lecturas-count')
    def mis_lecturas_count(self, request):
        """
        Cuenta lecturas obligatorias pendientes del usuario autenticado.
        Self-service: solo requiere IsAuthenticated.
        """
        count = DocumentoService.contar_lecturas_pendientes_obligatorias(request.user)
        return Response({'count': count})

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

        # Actualizar lectura_obligatoria si el admin lo indicó al publicar
        lectura_obligatoria = request.data.get('lectura_obligatoria')
        if lectura_obligatoria is not None:
            documento.lectura_obligatoria = bool(lectura_obligatoria)
            documento.save(update_fields=['lectura_obligatoria', 'updated_at'])

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

    @action(detail=True, methods=['post'], url_path='devolver-borrador')
    def devolver_borrador(self, request, pk=None):
        """Devuelve documento de EN_REVISION a BORRADOR."""
        from .services import DocumentoService
        documento = self.get_object()
        empresa = get_tenant_empresa()
        try:
            doc = DocumentoService.devolver_a_borrador(
                documento_id=documento.id,
                usuario=request.user,
                empresa_id=empresa.id if empresa else documento.empresa_id,
                motivo=request.data.get('motivo', ''),
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

    @action(detail=False, methods=['get'], url_path='cobertura-documental')
    def cobertura_documental(self, request):
        """
        Dashboard de cobertura documental: qué tipos tienen documentos,
        cuáles no, y qué workflows carecen de procedimiento documentado.
        Útil para auditorías ISO y revisión por la dirección.
        """
        cobertura = DocumentoService.obtener_cobertura_documental()
        return Response(cobertura)

    # =========================================================================
    # ARCHIVOS ANEXOS — Upload, listado y eliminación de evidencias
    # =========================================================================

    ALLOWED_EXTENSIONS = {
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp',
        '.csv', '.txt', '.zip', '.rar', '.7z',
    }
    MAX_ANEXO_SIZE = 20 * 1024 * 1024  # 20 MB por archivo

    @action(detail=True, methods=['post'], url_path='subir-anexo')
    def subir_anexo(self, request, pk=None):
        """
        Sube un archivo anexo a un documento existente.
        Acepta multipart/form-data con campo 'archivo'.
        Almacena metadata en archivos_anexos (JSONField).
        """
        documento = self.get_object()
        archivo = request.FILES.get('archivo')
        if not archivo:
            return Response(
                {'error': 'Se requiere un archivo'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validar extensión
        import os
        ext = os.path.splitext(archivo.name)[1].lower()
        if ext not in self.ALLOWED_EXTENSIONS:
            return Response(
                {'error': f'Extensión {ext} no permitida. '
                          f'Permitidas: {", ".join(sorted(self.ALLOWED_EXTENSIONS))}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validar tamaño
        if archivo.size > self.MAX_ANEXO_SIZE:
            return Response(
                {'error': 'El archivo excede el tamaño máximo de 20 MB'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Guardar archivo en media/documentos/anexos/YYYY/MM/
        from django.core.files.storage import default_storage
        from django.utils import timezone
        import uuid

        ahora = timezone.now()
        filename = f'{uuid.uuid4().hex[:8]}_{archivo.name}'
        path = f'documentos/anexos/{ahora.year}/{ahora.month:02d}/{filename}'
        saved_path = default_storage.save(path, archivo)

        # Agregar metadata al JSONField
        anexos = documento.archivos_anexos or []
        anexo_meta = {
            'id': uuid.uuid4().hex[:12],
            'nombre': archivo.name,
            'path': saved_path,
            'url': default_storage.url(saved_path),
            'tipo_mime': archivo.content_type or 'application/octet-stream',
            'tamaño': archivo.size,
            'extension': ext,
            'subido_por': request.user.id,
            'subido_por_nombre': request.user.get_full_name(),
            'fecha_subida': ahora.isoformat(),
            'descripcion': request.data.get('descripcion', ''),
        }
        anexos.append(anexo_meta)
        documento.archivos_anexos = anexos
        documento.save(update_fields=['archivos_anexos'])

        return Response(
            {'mensaje': 'Archivo anexo subido', 'anexo': anexo_meta},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['delete'], url_path='eliminar-anexo/(?P<anexo_id>[\\w]+)')
    def eliminar_anexo(self, request, pk=None, anexo_id=None):
        """Elimina un archivo anexo por su ID interno."""
        documento = self.get_object()
        anexos = documento.archivos_anexos or []

        anexo_encontrado = None
        nuevos_anexos = []
        for anexo in anexos:
            if anexo.get('id') == anexo_id:
                anexo_encontrado = anexo
            else:
                nuevos_anexos.append(anexo)

        if not anexo_encontrado:
            return Response(
                {'error': 'Anexo no encontrado'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Eliminar archivo físico
        from django.core.files.storage import default_storage
        try:
            if anexo_encontrado.get('path'):
                default_storage.delete(anexo_encontrado['path'])
        except Exception:
            pass  # Si el archivo ya no existe, no es error

        documento.archivos_anexos = nuevos_anexos
        documento.save(update_fields=['archivos_anexos'])

        return Response({'mensaje': 'Anexo eliminado'})

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

    @action(detail=False, methods=['post'], url_path='ingestar-lote')
    def ingestar_lote(self, request):
        """
        Ingesta masiva de PDFs: crea múltiples documentos + OCR para cada uno.
        Acepta multipart/form-data con múltiples archivos en 'archivos'.
        Comparte tipo_documento y clasificacion para todo el lote.
        """
        archivos = request.FILES.getlist('archivos')
        if not archivos:
            return Response(
                {'error': 'Se requiere al menos un archivo PDF'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(archivos) > 20:
            return Response(
                {'error': 'Máximo 20 archivos por lote'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tipo_documento_id = request.data.get('tipo_documento')
        clasificacion = request.data.get('clasificacion', 'INTERNO')
        if not tipo_documento_id:
            return Response(
                {'error': 'Se requiere tipo_documento'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        empresa = get_tenant_empresa()
        from .services import DocumentoService
        tipo_doc = TipoDocumento.objects.get(id=tipo_documento_id)

        from django.db import connection
        from .tasks import procesar_ocr_documento

        max_size = 50 * 1024 * 1024
        creados = []
        errores = []

        for archivo in archivos:
            if not archivo.name.lower().endswith('.pdf'):
                errores.append({'archivo': archivo.name, 'error': 'No es PDF'})
                continue
            if archivo.size > max_size:
                errores.append({'archivo': archivo.name, 'error': 'Excede 50 MB'})
                continue

            try:
                codigo = DocumentoService.generar_codigo(tipo_doc, empresa.id)
                titulo = archivo.name.rsplit('.', 1)[0]
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
                procesar_ocr_documento.delay(documento.id, connection.schema_name)
                creados.append({
                    'id': documento.id,
                    'codigo': codigo,
                    'titulo': titulo,
                })
            except Exception as e:
                errores.append({'archivo': archivo.name, 'error': str(e)})

        return Response({
            'creados': len(creados),
            'errores': len(errores),
            'documentos': creados,
            'detalle_errores': errores,
        }, status=status.HTTP_201_CREATED)

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
    # SELLADO PDF — Mejora 2: Firma digital X.509 con pyHanko
    # =========================================================================

    @action(detail=True, methods=['post'], url_path='sellar-pdf')
    def sellar_pdf(self, request, pk=None):
        """Inicia sellado PDF con firma digital X.509 via Celery."""
        documento = self.get_object()

        if documento.estado != 'PUBLICADO':
            return Response(
                {'error': 'Solo se pueden sellar documentos PUBLICADOS'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if documento.sellado_estado not in ('NO_APLICA', 'ERROR'):
            return Response(
                {'error': f'El documento ya está en estado de sellado: {documento.sellado_estado}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        documento.sellado_estado = 'PENDIENTE'
        documento.sellado_metadatos = {}
        documento.save(update_fields=['sellado_estado', 'sellado_metadatos'])

        from django.db import connection
        from .tasks import sellar_pdf_pyhanko
        sellar_pdf_pyhanko.delay(
            documento.id,
            connection.schema_name,
            request.user.id,
        )

        return Response(
            {
                'mensaje': 'Sellado iniciado. Recibirá una notificación al completar.',
                'sellado_estado': 'PENDIENTE',
            },
            status=status.HTTP_202_ACCEPTED,
        )

    @action(detail=True, methods=['get'], url_path='verificar-sellado')
    def verificar_sellado(self, request, pk=None):
        """Verifica integridad del PDF sellado recalculando SHA-256."""
        documento = self.get_object()

        if documento.sellado_estado != 'COMPLETADO':
            return Response(
                {'error': 'El documento no tiene un PDF sellado para verificar'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .services.pdf_sealing import PDFSealingService
        resultado = PDFSealingService.verificar_integridad(documento)
        return Response(resultado)

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
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'documentos'

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
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'documentos'

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


# =============================================================================
# ACEPTACIÓN DOCUMENTAL (Mejora 3 — Lectura Verificada)
# =============================================================================

class AceptacionDocumentalViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de lecturas verificadas de documentos.
    ISO 7.3 Toma de Conciencia + Decreto 1072 Art. 2.2.4.6.10/12.
    """
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'documentos'
    http_method_names = ['get', 'post', 'patch']

    def get_permissions(self):
        """mis_pendientes es self-service (Mi Portal) — solo requiere autenticación."""
        if self.action == 'mis_pendientes':
            return [IsAuthenticated()]
        return super().get_permissions()

    def get_serializer_class(self):
        from .serializers import (
            AceptacionDocumentalListSerializer,
            AceptacionDocumentalDetailSerializer,
        )
        if self.action in ('list', 'mis_pendientes'):
            return AceptacionDocumentalListSerializer
        return AceptacionDocumentalDetailSerializer

    def get_queryset(self):
        from .models import AceptacionDocumental
        qs = AceptacionDocumental.objects.select_related(
            'documento', 'usuario', 'asignado_por'
        )
        estado = self.request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado=estado)
        documento_id = self.request.query_params.get('documento')
        if documento_id:
            qs = qs.filter(documento_id=documento_id)
        return qs

    @action(detail=False, methods=['get'], url_path='mis-pendientes')
    def mis_pendientes(self, request):
        """Documentos pendientes de lectura del usuario autenticado."""
        from .models import AceptacionDocumental
        from .serializers import AceptacionDocumentalListSerializer

        qs = AceptacionDocumental.objects.select_related(
            'documento', 'asignado_por'
        ).filter(
            usuario=request.user,
            estado__in=['PENDIENTE', 'EN_PROGRESO'],
        ).order_by('fecha_limite', '-fecha_asignacion')

        return Response(AceptacionDocumentalListSerializer(qs, many=True).data)

    @action(detail=False, methods=['post'], url_path='asignar')
    def asignar(self, request):
        """Asigna lectura verificada de un documento a una lista de usuarios."""
        from .serializers import AsignarLecturaSerializer
        from .models import AceptacionDocumental, Documento

        serializer = AsignarLecturaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        documento_id = serializer.validated_data['documento_id']
        usuario_ids = serializer.validated_data['usuario_ids']
        fecha_limite = serializer.validated_data.get('fecha_limite')

        try:
            documento = Documento.objects.get(id=documento_id, estado='PUBLICADO')
        except Documento.DoesNotExist:
            return Response(
                {'error': 'Documento no encontrado o no está publicado'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        empresa = get_tenant_empresa(request)
        from django.contrib.auth import get_user_model
        User = get_user_model()

        creados = 0
        omitidos = 0
        for uid in usuario_ids:
            try:
                usuario = User.objects.get(id=uid)
            except User.DoesNotExist:
                omitidos += 1
                continue

            _, created = AceptacionDocumental.objects.get_or_create(
                documento=documento,
                version_documento=documento.version_actual,
                usuario=usuario,
                empresa_id=empresa.id if empresa else 0,
                defaults={
                    'asignado_por': request.user,
                    'fecha_limite': fecha_limite,
                    'estado': 'PENDIENTE',
                },
            )
            if created:
                creados += 1
            else:
                omitidos += 1

        return Response({
            'mensaje': f'Lectura asignada a {creados} usuario(s)',
            'creados': creados,
            'omitidos': omitidos,
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='registrar-progreso')
    def registrar_progreso(self, request, pk=None):
        """Actualiza progreso de scroll y tiempo de lectura."""
        aceptacion = self.get_object()

        if aceptacion.usuario != request.user:
            return Response(
                {'error': 'Solo el usuario asignado puede registrar progreso'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if aceptacion.estado in ('ACEPTADO', 'RECHAZADO'):
            return Response(
                {'error': 'Esta lectura ya fue finalizada'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not aceptacion.fecha_inicio_lectura:
            aceptacion.fecha_inicio_lectura = timezone.now()
            aceptacion.estado = 'EN_PROGRESO'

        porcentaje = request.data.get('porcentaje_lectura', aceptacion.porcentaje_lectura)
        tiempo = request.data.get('tiempo_lectura_seg', aceptacion.tiempo_lectura_seg)
        scroll_data = request.data.get('scroll_data', aceptacion.scroll_data)

        aceptacion.porcentaje_lectura = min(int(porcentaje), 100)
        aceptacion.tiempo_lectura_seg = int(tiempo)
        aceptacion.scroll_data = scroll_data
        aceptacion.save(update_fields=[
            'porcentaje_lectura', 'tiempo_lectura_seg', 'scroll_data',
            'fecha_inicio_lectura', 'estado', 'updated_at',
        ])

        return Response({
            'porcentaje_lectura': aceptacion.porcentaje_lectura,
            'tiempo_lectura_seg': aceptacion.tiempo_lectura_seg,
            'estado': aceptacion.estado,
        })

    @action(detail=True, methods=['post'], url_path='aceptar')
    def aceptar(self, request, pk=None):
        """Acepta el documento tras lectura verificada (requiere >= 90%)."""
        aceptacion = self.get_object()

        if aceptacion.usuario != request.user:
            return Response(
                {'error': 'Solo el usuario asignado puede aceptar'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if aceptacion.estado in ('ACEPTADO', 'RECHAZADO'):
            return Response(
                {'error': 'Esta lectura ya fue finalizada'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if aceptacion.porcentaje_lectura < 90:
            return Response(
                {'error': f'Debe leer al menos el 90% del documento (actual: {aceptacion.porcentaje_lectura}%)'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        aceptacion.estado = 'ACEPTADO'
        aceptacion.fecha_aceptacion = timezone.now()
        aceptacion.texto_aceptacion = request.data.get(
            'texto_aceptacion',
            'He leído y comprendido el contenido de este documento.'
        )
        aceptacion.ip_address = _get_client_ip(request)
        aceptacion.user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
        aceptacion.save(update_fields=[
            'estado', 'fecha_aceptacion', 'texto_aceptacion',
            'ip_address', 'user_agent', 'updated_at',
        ])

        from .serializers import AceptacionDocumentalDetailSerializer
        return Response(AceptacionDocumentalDetailSerializer(aceptacion).data)

    @action(detail=True, methods=['post'], url_path='rechazar')
    def rechazar(self, request, pk=None):
        """Rechaza la lectura del documento con motivo."""
        aceptacion = self.get_object()

        if aceptacion.usuario != request.user:
            return Response(
                {'error': 'Solo el usuario asignado puede rechazar'},
                status=status.HTTP_403_FORBIDDEN,
            )

        motivo = request.data.get('motivo_rechazo', '')
        if not motivo.strip():
            return Response(
                {'error': 'Debe indicar un motivo de rechazo'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        aceptacion.estado = 'RECHAZADO'
        aceptacion.fecha_rechazo = timezone.now()
        aceptacion.motivo_rechazo = motivo
        aceptacion.ip_address = _get_client_ip(request)
        aceptacion.user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
        aceptacion.save(update_fields=[
            'estado', 'fecha_rechazo', 'motivo_rechazo',
            'ip_address', 'user_agent', 'updated_at',
        ])

        from .serializers import AceptacionDocumentalDetailSerializer
        return Response(AceptacionDocumentalDetailSerializer(aceptacion).data)

    @action(detail=False, methods=['get'], url_path='resumen')
    def resumen(self, request):
        """Dashboard de aceptaciones: pendientes, completados, vencidos."""
        from .models import AceptacionDocumental
        from django.db.models import Avg

        qs = AceptacionDocumental.objects.all()
        documento_id = request.query_params.get('documento')
        if documento_id:
            qs = qs.filter(documento_id=documento_id)

        stats = qs.aggregate(
            total=Count('id'),
            pendientes=Count('id', filter=Q(estado='PENDIENTE')),
            en_progreso=Count('id', filter=Q(estado='EN_PROGRESO')),
            aceptados=Count('id', filter=Q(estado='ACEPTADO')),
            rechazados=Count('id', filter=Q(estado='RECHAZADO')),
            vencidos=Count('id', filter=Q(estado='VENCIDO')),
            promedio_tiempo=Avg('tiempo_lectura_seg', filter=Q(estado='ACEPTADO')),
            promedio_porcentaje=Avg('porcentaje_lectura'),
        )
        return Response(stats)


def _get_client_ip(request):
    """Obtiene IP del cliente (función standalone para reutilizar)."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0]
    return request.META.get('REMOTE_ADDR')
