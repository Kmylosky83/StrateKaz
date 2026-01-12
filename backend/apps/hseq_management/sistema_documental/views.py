"""
Views para Sistema Documental - HSEQ Management
Sistema de gestión documental integral con control de versiones y firmas digitales
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q, Count
from .models import (
    TipoDocumento,
    PlantillaDocumento,
    Documento,
    VersionDocumento,
    CampoFormulario,
    FirmaDocumento,
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
    FirmaDocumentoListSerializer,
    FirmaDocumentoDetailSerializer,
    ControlDocumentalListSerializer,
    ControlDocumentalDetailSerializer,
    RecibirPoliticaSerializer,
)


class TipoDocumentoViewSet(viewsets.ModelViewSet):
    """ViewSet para Tipos de Documento"""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return TipoDocumentoListSerializer
        return TipoDocumentoDetailSerializer

    def get_queryset(self):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        queryset = TipoDocumento.objects.select_related('created_by')

        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        # Filtros
        activo = self.request.query_params.get('activo')
        if activo is not None:
            queryset = queryset.filter(is_active=activo.lower() == 'true')

        nivel = self.request.query_params.get('nivel')
        if nivel:
            queryset = queryset.filter(nivel_documento=nivel)

        return queryset.order_by('orden', 'codigo')

    def perform_create(self, serializer):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        serializer.save(empresa_id=empresa_id, created_by=self.request.user)

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
        empresa_id = self.request.headers.get('X-Empresa-ID')
        queryset = PlantillaDocumento.objects.select_related(
            'tipo_documento', 'created_by'
        )

        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

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
        empresa_id = self.request.headers.get('X-Empresa-ID')
        serializer.save(empresa_id=empresa_id, created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def activar(self, request, pk=None):
        """Activa una plantilla"""
        plantilla = self.get_object()
        plantilla.estado = 'ACTIVA'
        plantilla.save()
        return Response(PlantillaDocumentoDetailSerializer(plantilla).data)

    @action(detail=True, methods=['post'])
    def marcar_obsoleta(self, request, pk=None):
        """Marca plantilla como obsoleta"""
        plantilla = self.get_object()
        plantilla.estado = 'OBSOLETA'
        plantilla.save()
        return Response(PlantillaDocumentoDetailSerializer(plantilla).data)

    @action(detail=True, methods=['post'])
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
        empresa_id = self.request.headers.get('X-Empresa-ID')
        queryset = CampoFormulario.objects.select_related(
            'plantilla', 'tipo_documento', 'created_by'
        )

        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

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
        empresa_id = self.request.headers.get('X-Empresa-ID')
        serializer.save(empresa_id=empresa_id, created_by=self.request.user)

    @action(detail=False, methods=['post'])
    def reordenar(self, request):
        """Reordena campos de formulario"""
        orden_campos = request.data.get('orden', [])

        for index, campo_id in enumerate(orden_campos):
            CampoFormulario.objects.filter(id=campo_id).update(orden=index)

        return Response({'message': 'Campos reordenados exitosamente'})


class DocumentoViewSet(viewsets.ModelViewSet):
    """ViewSet para Documentos"""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return DocumentoListSerializer
        return DocumentoDetailSerializer

    def get_queryset(self):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        queryset = Documento.objects.select_related(
            'tipo_documento', 'plantilla', 'elaborado_por',
            'revisado_por', 'aprobado_por', 'documento_padre'
        ).prefetch_related('firmas', 'versiones')

        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        # Filtros
        tipo_documento = self.request.query_params.get('tipo_documento')
        if tipo_documento:
            queryset = queryset.filter(tipo_documento_id=tipo_documento)

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
        empresa_id = self.request.headers.get('X-Empresa-ID')
        serializer.save(empresa_id=empresa_id, elaborado_por=self.request.user)

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprueba un documento"""
        documento = self.get_object()

        if documento.estado != 'EN_REVISION':
            return Response(
                {'error': 'Solo se pueden aprobar documentos en revisión'},
                status=status.HTTP_400_BAD_REQUEST
            )

        documento.estado = 'APROBADO'
        documento.aprobado_por = request.user
        documento.fecha_aprobacion = timezone.now().date()
        documento.save()

        return Response(DocumentoDetailSerializer(documento).data)

    @action(detail=True, methods=['post'])
    def publicar(self, request, pk=None):
        """Publica un documento aprobado"""
        documento = self.get_object()

        if documento.estado != 'APROBADO':
            return Response(
                {'error': 'Solo se pueden publicar documentos aprobados'},
                status=status.HTTP_400_BAD_REQUEST
            )

        documento.estado = 'PUBLICADO'
        documento.fecha_publicacion = timezone.now().date()
        documento.fecha_vigencia = timezone.now().date()
        documento.save()

        # Crear versión snapshot
        VersionDocumento.objects.create(
            documento=documento,
            numero_version=documento.version_actual,
            tipo_cambio='CREACION' if documento.numero_revision == 0 else 'REVISION_MAYOR',
            contenido_snapshot=documento.contenido,
            datos_formulario_snapshot=documento.datos_formulario,
            descripcion_cambios=documento.motivo_cambio_version or 'Publicación inicial',
            creado_por=request.user,
            aprobado_por=documento.aprobado_por,
            fecha_aprobacion=documento.fecha_aprobacion,
            is_version_actual=True,
            empresa_id=documento.empresa_id
        )

        return Response(DocumentoDetailSerializer(documento).data)

    @action(detail=True, methods=['post'])
    def marcar_obsoleto(self, request, pk=None):
        """Marca documento como obsoleto"""
        documento = self.get_object()
        documento.estado = 'OBSOLETO'
        documento.fecha_obsolescencia = timezone.now().date()
        documento.save()

        # Crear control de retiro
        ControlDocumental.objects.create(
            documento=documento,
            tipo_control='RETIRO',
            fecha_retiro=timezone.now().date(),
            motivo_retiro=request.data.get('motivo', 'Documento obsoleto'),
            documento_sustituto_id=request.data.get('documento_sustituto'),
            empresa_id=documento.empresa_id,
            created_by=request.user
        )

        return Response(DocumentoDetailSerializer(documento).data)

    @action(detail=True, methods=['post'])
    def enviar_revision(self, request, pk=None):
        """Envía documento a revisión"""
        documento = self.get_object()

        if documento.estado != 'BORRADOR':
            return Response(
                {'error': 'Solo se pueden enviar borradores a revisión'},
                status=status.HTTP_400_BAD_REQUEST
            )

        documento.estado = 'EN_REVISION'
        documento.revisado_por_id = request.data.get('revisor_id')
        documento.save()

        return Response(DocumentoDetailSerializer(documento).data)

    @action(detail=True, methods=['post'])
    def incrementar_descarga(self, request, pk=None):
        """Incrementa contador de descargas"""
        documento = self.get_object()
        documento.numero_descargas += 1
        documento.save(update_fields=['numero_descargas'])
        return Response({'descargas': documento.numero_descargas})

    @action(detail=True, methods=['post'])
    def incrementar_impresion(self, request, pk=None):
        """Incrementa contador de impresiones"""
        documento = self.get_object()
        documento.numero_impresiones += 1
        documento.save(update_fields=['numero_impresiones'])
        return Response({'impresiones': documento.numero_impresiones})

    @action(detail=False, methods=['get'])
    def pendientes_revision(self, request):
        """Documentos pendientes de revisión programada"""
        empresa_id = request.headers.get('X-Empresa-ID')
        hoy = timezone.now().date()

        queryset = Documento.objects.filter(
            empresa_id=empresa_id,
            estado='PUBLICADO',
            fecha_revision_programada__lte=hoy
        )

        return Response(DocumentoListSerializer(queryset, many=True).data)

    @action(detail=False, methods=['get'])
    def listado_maestro(self, request):
        """Listado maestro de documentos publicados"""
        empresa_id = request.headers.get('X-Empresa-ID')

        queryset = Documento.objects.filter(
            empresa_id=empresa_id,
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
    # INTEGRACIÓN CON MÓDULO DE IDENTIDAD CORPORATIVA
    # =========================================================================

    @action(detail=False, methods=['post'], url_path='recibir-politica')
    def recibir_politica(self, request):
        """
        Recibe una política firmada desde el módulo de Identidad Corporativa.

        Este endpoint maneja tanto nuevas políticas como actualizaciones de versión:

        Para NUEVAS políticas:
        1. Crea/obtiene el TipoDocumento "POLITICA" si no existe
        2. Genera código único dinámico (POL-{NORMA}-{SECUENCIAL})
        3. Crea el Documento con estado APROBADO (ya viene firmado)
        4. Registra las firmas que vienen de Identidad
        5. Crea la versión inicial del documento
        6. Publica el documento automáticamente
        7. Actualiza el estado de la política en Identidad a VIGENTE

        Para ACTUALIZACIONES de versión (es_actualizacion=True):
        1. Usa el código existente (no genera nuevo)
        2. Crea nueva versión del documento existente
        3. Marca la versión anterior como no actual
        4. La política anterior en Identidad pasa a OBSOLETO

        Body: datos_documental del endpoint enviar-a-documental de Identidad
        """
        from django.contrib.auth import get_user_model
        User = get_user_model()

        serializer = RecibirPoliticaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        empresa_id = data['empresa_id']
        es_actualizacion = data.get('es_actualizacion', False)
        documento_anterior_id = data.get('documento_anterior_id')
        codigo_existente = data.get('codigo_existente')

        # 1. Obtener o crear TipoDocumento para POLITICA
        tipo_documento, created = TipoDocumento.objects.get_or_create(
            empresa_id=empresa_id,
            codigo='POL',
            defaults={
                'nombre': 'Política',
                'descripcion': 'Políticas corporativas del sistema de gestión',
                'nivel_documento': 'ESTRATEGICO',
                'prefijo_codigo': 'POL-',
                'requiere_aprobacion': True,
                'requiere_firma': True,
                'tiempo_retencion_años': 10,
                'color_identificacion': '#8B5CF6',
                'is_active': True,
                'orden': 1,
                'created_by': request.user,
            }
        )

        # 2. Determinar código del documento
        norma_code = data.get('norma_iso_code', 'GEN')

        if es_actualizacion and codigo_existente:
            # Usar código existente para actualizaciones
            codigo_documento = codigo_existente
        else:
            # Generar nuevo código para nuevas políticas
            codigo_documento = self._generar_codigo_politica(
                empresa_id=empresa_id,
                norma_code=norma_code
            )

        # 3. Obtener usuario solicitante
        try:
            elaborado_por = User.objects.get(id=data['solicitado_por'])
        except User.DoesNotExist:
            elaborado_por = request.user

        # 4. Manejar documento anterior si es actualización
        documento_anterior = None
        if es_actualizacion and documento_anterior_id:
            documento_anterior = Documento.objects.filter(
                id=documento_anterior_id,
                empresa_id=empresa_id
            ).first()

            if documento_anterior:
                # Marcar versiones anteriores como no actuales
                VersionDocumento.objects.filter(
                    documento=documento_anterior,
                    is_version_actual=True
                ).update(is_version_actual=False)

                # Marcar documento anterior como OBSOLETO
                documento_anterior.estado = 'OBSOLETO'
                documento_anterior.save(update_fields=['estado', 'updated_at'])

        # 5. Crear el Documento
        motivo_cambio = data.get('motivo_cambio', '')
        resumen = f"Política de {norma_code} importada desde Identidad Corporativa"
        if es_actualizacion:
            resumen = f"Nueva versión de política {norma_code}. {motivo_cambio}"

        documento = Documento.objects.create(
            codigo=codigo_documento,
            titulo=data['titulo'],
            tipo_documento=tipo_documento,
            resumen=resumen,
            contenido=data['contenido'],
            palabras_clave=data.get('palabras_clave', []),
            version_actual=data.get('version', '1.0'),
            numero_revision=0 if not es_actualizacion else (documento_anterior.numero_revision + 1 if documento_anterior else 1),
            estado='APROBADO',  # Ya viene firmado
            clasificacion=data.get('clasificacion', 'INTERNO'),
            fecha_aprobacion=timezone.now().date(),
            elaborado_por=elaborado_por,
            aprobado_por=elaborado_por,  # El firmante final
            areas_aplicacion=data.get('areas_aplicacion', []),
            observaciones=data.get('observaciones', ''),
            empresa_id=empresa_id,
        )

        # 6. Registrar firmas de Identidad como FirmaDocumento
        firmas_info = data.get('firmas', [])
        for firma_data in firmas_info:
            try:
                firmante = User.objects.get(id=firma_data['usuario_id']) if firma_data.get('usuario_id') else elaborado_por
            except User.DoesNotExist:
                firmante = elaborado_por

            # Mapear rol de Identidad a tipo de firma de Documental
            tipo_firma_map = {
                'ELABORO': 'ELABORACION',
                'REVISO_TECNICO': 'REVISION',
                'REVISO_JURIDICO': 'REVISION',
                'APROBO_DIRECTOR': 'APROBACION',
                'APROBO_GERENTE': 'APROBACION',
                'APROBO_REPRESENTANTE_LEGAL': 'APROBACION',
            }
            tipo_firma = tipo_firma_map.get(firma_data.get('rol', ''), 'VALIDACION')

            FirmaDocumento.objects.create(
                documento=documento,
                tipo_firma=tipo_firma,
                firmante=firmante,
                cargo_firmante=firma_data.get('cargo_nombre', ''),
                estado='FIRMADO',
                fecha_firma=timezone.now(),
                comentarios=f"Firma importada desde Identidad - Proceso #{data.get('proceso_firma_id', 'N/A')}",
                orden_firma=firma_data.get('orden', 1),
                checksum_documento=firma_data.get('firma_hash', ''),
                empresa_id=empresa_id,
            )

        # 7. Crear versión del documento
        tipo_cambio = 'CREACION' if not es_actualizacion else 'ACTUALIZACION'
        descripcion_cambios = 'Política importada desde Identidad Corporativa con firmas completas'
        if es_actualizacion:
            version_anterior = data.get('version_anterior', '?')
            descripcion_cambios = f"Actualización de versión {version_anterior} a {data.get('version', '?')}. {motivo_cambio}"

        VersionDocumento.objects.create(
            documento=documento,
            numero_version=data.get('version', '1.0'),
            tipo_cambio=tipo_cambio,
            contenido_snapshot=data['contenido'],
            descripcion_cambios=descripcion_cambios,
            creado_por=elaborado_por,
            aprobado_por=elaborado_por,
            fecha_aprobacion=timezone.now(),
            is_version_actual=True,
            empresa_id=empresa_id,
        )

        # 8. Publicar documento
        documento.estado = 'PUBLICADO'
        documento.fecha_publicacion = timezone.now().date()
        documento.fecha_vigencia = timezone.now().date()
        documento.save()

        # 9. Crear control de distribución
        observaciones_control = f"Distribución automática desde Identidad Corporativa. Política ID: {data['politica_id']}"
        if es_actualizacion:
            observaciones_control = f"Nueva versión de política. {observaciones_control}"

        ControlDocumental.objects.create(
            documento=documento,
            tipo_control='DISTRIBUCION',
            fecha_distribucion=timezone.now().date(),
            medio_distribucion='DIGITAL',
            areas_distribucion=data.get('areas_aplicacion', []),
            observaciones=observaciones_control,
            empresa_id=empresa_id,
            created_by=request.user,
        )

        # 10. Actualizar estado de política en Identidad (callback)
        self._actualizar_politica_identidad(
            politica_id=data['politica_id'],
            documento_id=documento.id,
            codigo_documento=codigo_documento,
            es_actualizacion=es_actualizacion,
        )

        response_data = {
            'detail': 'Política recibida y publicada exitosamente',
            'documento_id': documento.id,
            'codigo': documento.codigo,
            'titulo': documento.titulo,
            'estado': documento.estado,
            'version': documento.version_actual,
            'fecha_publicacion': documento.fecha_publicacion,
            'total_firmas_registradas': len(firmas_info),
            'url_documento': f"/api/v1/documental/documentos/{documento.id}/",
            'origen': {
                'modulo': data['origen'],
                'tipo': data['tipo_origen'],
                'politica_id': data['politica_id'],
            }
        }

        if es_actualizacion:
            response_data['es_actualizacion'] = True
            response_data['version_anterior'] = data.get('version_anterior')
            if documento_anterior:
                response_data['documento_anterior'] = {
                    'id': documento_anterior.id,
                    'estado': documento_anterior.estado,
                }

        return Response(response_data, status=status.HTTP_201_CREATED)

    def _generar_codigo_politica(self, empresa_id, norma_code):
        """
        Genera código único para políticas: POL-{NORMA}-{SECUENCIAL}

        Ejemplos:
        - POL-SST-001 (Primera política de SST)
        - POL-CA-002 (Segunda política de Calidad)
        - POL-GEN-001 (Política general)
        """
        # Obtener el prefijo según la norma
        prefijo = f"POL-{norma_code}-"

        # Buscar el último documento con este prefijo
        ultimo_doc = Documento.objects.filter(
            empresa_id=empresa_id,
            codigo__startswith=prefijo
        ).order_by('-codigo').first()

        if ultimo_doc:
            # Extraer el número secuencial del último código
            try:
                ultimo_num = int(ultimo_doc.codigo.split('-')[-1])
                nuevo_num = ultimo_num + 1
            except (ValueError, IndexError):
                nuevo_num = 1
        else:
            nuevo_num = 1

        # Formatear con ceros a la izquierda (3 dígitos)
        codigo = f"{prefijo}{nuevo_num:03d}"

        return codigo

    def _actualizar_politica_identidad(self, politica_id, documento_id, codigo_documento, es_actualizacion=False):
        """
        Actualiza el estado de la política en Identidad a VIGENTE.

        Actualiza:
        - status: VIGENTE
        - code: Código oficial del documento (POL-SST-001)
        - documento_id: ID del documento en Gestor Documental
        - effective_date: Fecha de vigencia

        Si es_actualizacion=True, también marca la versión anterior como OBSOLETO.

        Nota: Esta función actualiza directamente el modelo de Identidad.
        En un sistema más desacoplado, esto sería un webhook/callback HTTP.
        """
        try:
            from apps.gestion_estrategica.identidad.models import PoliticaEspecifica

            politica = PoliticaEspecifica.objects.filter(id=politica_id).first()
            if politica:
                # Si es actualización, marcar versiones anteriores con el mismo código como OBSOLETO
                if es_actualizacion and codigo_documento:
                    # Buscar políticas anteriores con el mismo código (excluyendo la actual)
                    PoliticaEspecifica.objects.filter(
                        code=codigo_documento,
                        status='VIGENTE'
                    ).exclude(id=politica_id).update(
                        status='OBSOLETO',
                        updated_at=timezone.now()
                    )

                # Actualizar estado a VIGENTE
                politica.status = 'VIGENTE'
                politica.effective_date = timezone.now().date()

                # Asignar código oficial del Gestor Documental
                politica.code = codigo_documento

                # Guardar referencia al documento (sin FK para evitar dependencia circular)
                politica.documento_id = documento_id

                politica.save(update_fields=[
                    'status',
                    'effective_date',
                    'code',
                    'documento_id',
                    'updated_at'
                ])

        except Exception as e:
            # Log error pero no fallar la operación
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"No se pudo actualizar política {politica_id} en Identidad: {e}")


class VersionDocumentoViewSet(viewsets.ModelViewSet):
    """ViewSet para Versiones de Documento"""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return VersionDocumentoListSerializer
        return VersionDocumentoDetailSerializer

    def get_queryset(self):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        queryset = VersionDocumento.objects.select_related(
            'documento', 'creado_por', 'aprobado_por'
        )

        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        # Filtro por documento
        documento = self.request.query_params.get('documento')
        if documento:
            queryset = queryset.filter(documento_id=documento)

        return queryset.order_by('-fecha_version')

    def perform_create(self, serializer):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        serializer.save(empresa_id=empresa_id, creado_por=self.request.user)

    @action(detail=False, methods=['get'])
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

        # Buscar versión anterior
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


class FirmaDocumentoViewSet(viewsets.ModelViewSet):
    """ViewSet para Firmas de Documento"""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return FirmaDocumentoListSerializer
        return FirmaDocumentoDetailSerializer

    def get_queryset(self):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        queryset = FirmaDocumento.objects.select_related(
            'documento', 'version_documento', 'firmante'
        )

        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        # Filtros
        documento = self.request.query_params.get('documento')
        if documento:
            queryset = queryset.filter(documento_id=documento)

        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)

        tipo_firma = self.request.query_params.get('tipo_firma')
        if tipo_firma:
            queryset = queryset.filter(tipo_firma=tipo_firma)

        # Filtro por firmante
        firmante = self.request.query_params.get('firmante')
        if firmante:
            queryset = queryset.filter(firmante_id=firmante)

        return queryset.order_by('orden_firma', 'fecha_solicitud')

    def perform_create(self, serializer):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        serializer.save(empresa_id=empresa_id)

    @action(detail=True, methods=['post'])
    def firmar(self, request, pk=None):
        """Firma digitalmente un documento"""
        firma = self.get_object()

        if firma.estado != 'PENDIENTE':
            return Response(
                {'error': 'Esta firma ya fue procesada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if firma.firmante != request.user:
            return Response(
                {'error': 'No tiene permiso para firmar este documento'},
                status=status.HTTP_403_FORBIDDEN
            )

        firma.estado = 'FIRMADO'
        firma.fecha_firma = timezone.now()
        firma.firma_digital = request.data.get('firma_digital', '')
        firma.certificado_digital = request.data.get('certificado_digital', '')
        firma.ip_address = self.get_client_ip(request)
        firma.user_agent = request.META.get('HTTP_USER_AGENT', '')
        firma.comentarios = request.data.get('comentarios', '')
        firma.save()

        return Response(FirmaDocumentoDetailSerializer(firma).data)

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """Rechaza la firma de un documento"""
        firma = self.get_object()

        if firma.estado != 'PENDIENTE':
            return Response(
                {'error': 'Esta firma ya fue procesada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if firma.firmante != request.user:
            return Response(
                {'error': 'No tiene permiso para rechazar este documento'},
                status=status.HTTP_403_FORBIDDEN
            )

        firma.estado = 'RECHAZADO'
        firma.motivo_rechazo = request.data.get('motivo_rechazo', '')
        firma.save()

        # Actualizar estado del documento
        documento = firma.documento
        documento.estado = 'BORRADOR'
        documento.observaciones = f"Firma rechazada: {firma.motivo_rechazo}"
        documento.save()

        return Response(FirmaDocumentoDetailSerializer(firma).data)

    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """Firmas pendientes del usuario actual"""
        queryset = self.get_queryset().filter(
            firmante=request.user,
            estado='PENDIENTE'
        )
        return Response(FirmaDocumentoListSerializer(queryset, many=True).data)

    @action(detail=False, methods=['get'])
    def mis_firmas(self, request):
        """Todas las firmas del usuario actual"""
        queryset = self.get_queryset().filter(firmante=request.user)
        return Response(FirmaDocumentoListSerializer(queryset, many=True).data)

    def get_client_ip(self, request):
        """Obtiene IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class ControlDocumentalViewSet(viewsets.ModelViewSet):
    """ViewSet para Control Documental"""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return ControlDocumentalListSerializer
        return ControlDocumentalDetailSerializer

    def get_queryset(self):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        queryset = ControlDocumental.objects.select_related(
            'documento', 'version_documento', 'documento_sustituto',
            'responsable_destruccion', 'created_by'
        ).prefetch_related('usuarios_distribucion')

        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        # Filtros
        documento = self.request.query_params.get('documento')
        if documento:
            queryset = queryset.filter(documento_id=documento)

        tipo_control = self.request.query_params.get('tipo_control')
        if tipo_control:
            queryset = queryset.filter(tipo_control=tipo_control)

        return queryset.order_by('-fecha_distribucion')

    def perform_create(self, serializer):
        empresa_id = self.request.headers.get('X-Empresa-ID')
        serializer.save(empresa_id=empresa_id, created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def confirmar_recepcion(self, request, pk=None):
        """Confirma recepción de documento por usuario"""
        control = self.get_object()

        confirmacion = {
            'usuario_id': request.user.id,
            'usuario_nombre': request.user.get_full_name(),
            'fecha': timezone.now().isoformat(),
            'ip_address': self.get_client_ip(request)
        }

        confirmaciones = control.confirmaciones_recepcion or []
        confirmaciones.append(confirmacion)
        control.confirmaciones_recepcion = confirmaciones
        control.save()

        return Response({'message': 'Recepción confirmada exitosamente'})

    @action(detail=False, methods=['get'])
    def distribuciones_activas(self, request):
        """Controles de distribución activos"""
        queryset = self.get_queryset().filter(
            tipo_control='DISTRIBUCION',
            documento__estado='PUBLICADO'
        )
        return Response(ControlDocumentalListSerializer(queryset, many=True).data)

    @action(detail=False, methods=['get'])
    def documentos_obsoletos(self, request):
        """Controles de documentos retirados/obsoletos"""
        queryset = self.get_queryset().filter(
            tipo_control='RETIRO'
        )
        return Response(ControlDocumentalListSerializer(queryset, many=True).data)

    def get_client_ip(self, request):
        """Obtiene IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
