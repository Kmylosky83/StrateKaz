"""
Views para Colaboradores - Talent Hub
Sistema de Gestión StrateKaz

ViewSets CRUD completos para colaboradores, hojas de vida,
información personal e historial laboral.
"""
import logging

from django.apps import apps
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from apps.core.permissions import GranularActionPermission
from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone

from apps.core.base_models import get_tenant_empresa
from apps.gestion_estrategica.revision_direccion.services.resumen_mixin import ResumenRevisionMixin
from .models import Colaborador, HojaVida, InfoPersonal, HistorialLaboral
from .serializers import (
    ColaboradorListSerializer,
    ColaboradorDetailSerializer,
    ColaboradorCreateUpdateSerializer,
    ColaboradorCreateWithAccessSerializer,
    ColaboradorCompleteSerializer,
    ColaboradorEstadisticasSerializer,
    HojaVidaSerializer,
    HojaVidaCreateUpdateSerializer,
    InfoPersonalSerializer,
    InfoPersonalPublicSerializer,
    InfoPersonalCreateUpdateSerializer,
    HistorialLaboralSerializer,
    HistorialLaboralCreateSerializer,
)

logger = logging.getLogger(__name__)
User = get_user_model()


class ColaboradorViewSet(ResumenRevisionMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de Colaboradores.

    Endpoints:
    - GET /colaboradores/ - Listar colaboradores
    - POST /colaboradores/ - Crear colaborador
    - GET /colaboradores/{id}/ - Detalle
    - PUT /colaboradores/{id}/ - Actualizar
    - DELETE /colaboradores/{id}/ - Eliminar (soft delete)
    - GET /colaboradores/estadisticas/ - Estadísticas
    - GET /colaboradores/activos/ - Solo colaboradores activos
    - GET /colaboradores/por-area/{area_id}/ - Filtrar por área
    - GET /colaboradores/por-cargo/{cargo_id}/ - Filtrar por cargo
    - POST /colaboradores/{id}/retirar/ - Marcar como retirado
    - GET /colaboradores/{id}/completo/ - Obtener perfil completo
    """
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'colaboradores'

    # ResumenRevisionMixin config
    resumen_date_field = 'fecha_ingreso'
    resumen_modulo_nombre = 'talento_humano'

    def get_resumen_data(self, queryset, fecha_desde, fecha_hasta):
        """Resumen de talento humano para Revisión por la Dirección."""
        # Todos los colaboradores activos
        todos = Colaborador.objects.filter(is_active=True)
        total_activos = todos.filter(estado='activo').count()
        total_inactivos = todos.filter(estado='inactivo').count()
        total_retirados = todos.filter(estado='retirado').count()

        # Nuevos ingresos en período
        nuevos_ingresos = queryset.count()

        # Retiros en período
        retiros_periodo = Colaborador.objects.filter(
            fecha_retiro__range=[fecha_desde, fecha_hasta]
        ).count()

        # Tasa de rotación
        promedio_activos = (total_activos + total_activos + nuevos_ingresos - retiros_periodo) / 2
        tasa_rotacion = round(
            (retiros_periodo / promedio_activos * 100), 1
        ) if promedio_activos > 0 else 0

        # Por tipo de contrato
        por_contrato = list(
            todos.filter(estado='activo').values('tipo_contrato')
            .annotate(cantidad=Count('id'))
            .order_by('-cantidad')
        )

        # Por área
        por_area = list(
            todos.filter(estado='activo').values('area__name')
            .annotate(cantidad=Count('id'))
            .order_by('-cantidad')[:10]
        )

        return {
            'total_activos': total_activos,
            'total_inactivos': total_inactivos,
            'total_retirados': total_retirados,
            'nuevos_ingresos_periodo': nuevos_ingresos,
            'retiros_periodo': retiros_periodo,
            'tasa_rotacion': tasa_rotacion,
            'por_tipo_contrato': por_contrato,
            'por_area': por_area,
        }

    def get_queryset(self):
        queryset = Colaborador.objects.filter(is_active=True)

        # Filtros
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)

        cargo_id = self.request.query_params.get('cargo')
        if cargo_id:
            queryset = queryset.filter(cargo_id=cargo_id)

        area_id = self.request.query_params.get('area')
        if area_id:
            queryset = queryset.filter(area_id=area_id)

        tipo_contrato = self.request.query_params.get('tipo_contrato')
        if tipo_contrato:
            queryset = queryset.filter(tipo_contrato=tipo_contrato)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(primer_nombre__icontains=search) |
                Q(primer_apellido__icontains=search) |
                Q(numero_identificacion__icontains=search)
            )

        return queryset.select_related('cargo', 'area', 'usuario')

    def get_serializer_class(self):
        if self.action == 'list':
            return ColaboradorListSerializer
        elif self.action == 'create':
            return ColaboradorCreateWithAccessSerializer
        elif self.action in ['update', 'partial_update']:
            return ColaboradorCreateUpdateSerializer
        elif self.action == 'completo':
            return ColaboradorCompleteSerializer
        return ColaboradorDetailSerializer

    @transaction.atomic
    def perform_create(self, serializer):
        """
        Creacion unificada de Colaborador con registros asociados.

        1. Crea Colaborador con datos laborales completos
        2. Auto-crea HojaVida vacia (para documentos en Mi Portal)
        3. Auto-crea InfoPersonal vacia (para datos personales)
        4. Crea HistorialLaboral tipo='contratacion'
        5. Opcionalmente crea User + envia email para configurar contraseña
        """
        empresa = get_tenant_empresa()
        user = self.request.user

        # Extraer campos de acceso (no son campos del modelo Colaborador)
        crear_acceso = serializer.validated_data.pop('crear_acceso', False)
        email_corporativo = serializer.validated_data.pop('email_corporativo', None)
        username = serializer.validated_data.pop('username', None)

        # 1. Guardar Colaborador
        colaborador = serializer.save(
            empresa=empresa,
            created_by=user,
            updated_by=user
        )

        # 2. Auto-crear HojaVida vacia
        HojaVida.objects.create(
            colaborador=colaborador,
            empresa=empresa,
            created_by=user,
            updated_by=user
        )

        # 3. Auto-crear InfoPersonal vacia
        InfoPersonal.objects.create(
            colaborador=colaborador,
            empresa=empresa,
            created_by=user,
            updated_by=user
        )

        # 4. Crear HistorialLaboral de contratacion
        HistorialLaboral.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            tipo_movimiento='contratacion',
            fecha_movimiento=colaborador.fecha_ingreso,
            cargo_nuevo=colaborador.cargo,
            area_nueva=colaborador.area,
            salario_nuevo=colaborador.salario,
            motivo='Contratación inicial',
            created_by=user,
            updated_by=user
        )

        # 5. Opcionalmente crear User con acceso al sistema
        if crear_acceso and email_corporativo and username:
            self._create_user_for_colaborador(
                colaborador, email_corporativo.strip(), username.strip(), empresa, user
            )

    def _create_user_for_colaborador(
        self, colaborador, email, username, empresa, created_by
    ):
        """
        Crea cuenta de usuario vinculada al colaborador y envía
        email de setup vía UserSetupFactory (centralizado en core).
        """
        from apps.core.utils.user_factory import UserSetupFactory

        # Crear User con setup token via factory centralizada
        new_user, _token = UserSetupFactory.create_user_with_setup(
            email=email,
            username=username,
            first_name=colaborador.primer_nombre,
            last_name=colaborador.primer_apellido,
            cargo=colaborador.cargo,
            created_by=created_by,
            document_type=colaborador.tipo_documento,
            document_number=colaborador.numero_identificacion,
            phone=colaborador.telefono_movil or '',
            fecha_ingreso=colaborador.fecha_ingreso,
        )

        # Vincular Colaborador al User
        colaborador.usuario = new_user
        colaborador.save(update_fields=['usuario'])

        # Enviar email de setup de contraseña (async)
        UserSetupFactory.send_setup_email(
            new_user,
            empresa=empresa,
            cargo_name=(
                colaborador.cargo.name if colaborador.cargo else ''
            ),
        )

        logger.info(
            'User #%s creado para Colaborador #%s, '
            'email de setup enviado a %s',
            new_user.pk,
            colaborador.pk,
            email,
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Retorna estadísticas de colaboradores"""
        queryset = self.get_queryset()

        # Contar por estado
        por_estado = dict(queryset.values_list('estado').annotate(count=Count('id')))

        # Contar por tipo de contrato
        por_contrato = dict(queryset.values_list('tipo_contrato').annotate(count=Count('id')))

        # Contar por área
        por_area = dict(
            queryset.values_list('area__name').annotate(count=Count('id'))
        )

        # Activos
        activos = queryset.filter(estado='activo').count()

        data = {
            'total': queryset.count(),
            'activos': activos,
            'por_estado': por_estado,
            'por_tipo_contrato': por_contrato,
            'por_area': por_area,
        }

        serializer = ColaboradorEstadisticasSerializer(data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def activos(self, request):
        """Retorna solo colaboradores activos"""
        queryset = self.get_queryset().filter(estado='activo')
        serializer = ColaboradorListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='por-area/(?P<area_id>[^/.]+)')
    def por_area(self, request, area_id=None):
        """Retorna colaboradores por área"""
        queryset = self.get_queryset().filter(area_id=area_id)
        serializer = ColaboradorListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='por-cargo/(?P<cargo_id>[^/.]+)')
    def por_cargo(self, request, cargo_id=None):
        """Retorna colaboradores por cargo"""
        queryset = self.get_queryset().filter(cargo_id=cargo_id)
        serializer = ColaboradorListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def retirar(self, request, pk=None):
        """Marca al colaborador como retirado"""
        colaborador = self.get_object()
        colaborador.estado = 'retirado'
        colaborador.fecha_retiro = request.data.get(
            'fecha_retiro',
            timezone.now().date()
        )
        colaborador.motivo_retiro = request.data.get('motivo_retiro', '')
        colaborador.updated_by = request.user
        colaborador.save()

        # Crear registro en historial
        HistorialLaboral.objects.create(
            empresa=get_tenant_empresa(),
            colaborador=colaborador,
            tipo_movimiento='retiro',
            fecha_movimiento=colaborador.fecha_retiro,
            motivo=colaborador.motivo_retiro,
            salario_anterior=colaborador.salario,
            cargo_anterior=colaborador.cargo,
            area_anterior=colaborador.area,
            created_by=request.user,
            updated_by=request.user
        )

        serializer = ColaboradorDetailSerializer(colaborador)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def completo(self, request, pk=None):
        """Retorna el perfil completo del colaborador"""
        colaborador = self.get_object()
        serializer = ColaboradorCompleteSerializer(colaborador)
        return Response(serializer.data)

    # =========================================================================
    # IMPORTACION MASIVA DESDE EXCEL
    # =========================================================================

    @action(detail=False, methods=['get'], url_path='plantilla-importacion')
    def plantilla_importacion(self, request):
        """
        Descarga la plantilla Excel para importación masiva de colaboradores.
        GET /colaboradores/plantilla-importacion/
        Incluye hoja de datos + hoja de referencia con valores válidos del tenant.
        """
        from django.http import HttpResponse
        from .import_utils import generate_import_template

        # Obtener cargos y áreas del tenant para la hoja de referencia
        try:
            from apps.core.models.models_user import Cargo
            cargos = list(Cargo.objects.filter(is_active=True, is_system=False).values('name'))
        except Exception:
            logger.warning("No se pudieron obtener los cargos para la plantilla de importación")
            cargos = []

        try:
            Area = apps.get_model('organizacion', 'Area')
            areas = list(Area.objects.filter(is_active=True).values('name'))
        except Exception:
            logger.warning("No se pudieron obtener las áreas para la plantilla de importación")
            areas = []

        excel_bytes = generate_import_template(cargos=cargos, areas=areas)

        response = HttpResponse(
            excel_bytes,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="plantilla_colaboradores.xlsx"'
        return response

    @action(detail=False, methods=['post'], url_path='importar')
    def importar(self, request):
        """
        Importa colaboradores desde un archivo Excel/CSV.
        POST /colaboradores/importar/   multipart/form-data  campo: archivo

        Procesa fila por fila — los errores NO bloquean las filas válidas.
        Respuesta:
        {
          "creados": N,
          "con_acceso": N,
          "errores": [{"fila": X, "identificacion": "...", "errores": [...]}]
        }
        """
        archivo = request.FILES.get('archivo')
        if not archivo:
            return Response(
                {'detail': 'Se requiere el archivo Excel (.xlsx).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar extensión
        nombre = archivo.name.lower()
        if not (nombre.endswith('.xlsx') or nombre.endswith('.xls') or nombre.endswith('.csv')):
            return Response(
                {'detail': 'El archivo debe ser Excel (.xlsx) o CSV (.csv).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Parsear el archivo
        try:
            from .import_utils import parse_excel_file, COLUMNAS
            contenido = archivo.read()
            filas = parse_excel_file(contenido)
        except Exception as e:
            logger.error('Error parseando archivo de importación: %s', e, exc_info=True)
            return Response(
                {'detail': f'No se pudo leer el archivo: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not filas:
            return Response(
                {'detail': 'El archivo no contiene datos. Verifica que haya filas después de la cabecera.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        empresa = get_tenant_empresa()
        user = request.user
        creados = 0
        con_acceso = 0
        errores = []

        from .import_serializer import ColaboradorImportRowSerializer

        for fila_raw in filas:
            num_fila = fila_raw.pop('_fila', '?')
            identificacion = str(fila_raw.get('numero_identificacion', '')).strip()

            # Construir dict normalizado para el serializer
            datos = {col: fila_raw.get(col, '') for col in COLUMNAS if col != '_fila'}

            serializer = ColaboradorImportRowSerializer(data=datos)
            if not serializer.is_valid():
                # Aplanar errores a lista de strings
                msgs = []
                for field, errs in serializer.errors.items():
                    if isinstance(errs, list):
                        msgs.extend([str(e) for e in errs])
                    else:
                        msgs.append(str(errs))
                errores.append({
                    'fila': num_fila,
                    'identificacion': identificacion or '—',
                    'errores': msgs,
                })
                continue

            vdata = serializer.validated_data
            cargo = vdata.pop('_cargo')
            area = vdata.pop('_area')
            crear_acceso = vdata.pop('_crear_acceso', False)
            email_corp = vdata.pop('_email_corporativo', None)
            username_corp = vdata.pop('_username', None)

            # Limpiar campos auxiliares no presentes en el modelo
            for key in ['cargo_nombre', 'area_nombre', 'crear_acceso',
                        'email_corporativo', 'username']:
                vdata.pop(key, None)

            try:
                with transaction.atomic():
                    colaborador = Colaborador(
                        **vdata,
                        cargo=cargo,
                        area=area,
                        empresa=empresa,
                        created_by=user,
                        updated_by=user,
                    )
                    colaborador.full_clean(exclude=['usuario'])
                    colaborador.save()

                    # Records asociados
                    HojaVida.objects.create(
                        colaborador=colaborador,
                        empresa=empresa,
                        created_by=user,
                        updated_by=user,
                    )
                    InfoPersonal.objects.create(
                        colaborador=colaborador,
                        empresa=empresa,
                        created_by=user,
                        updated_by=user,
                    )
                    HistorialLaboral.objects.create(
                        empresa=empresa,
                        colaborador=colaborador,
                        tipo_movimiento='contratacion',
                        fecha_movimiento=colaborador.fecha_ingreso,
                        cargo_nuevo=cargo,
                        area_nueva=area,
                        salario_nuevo=colaborador.salario,
                        motivo='Contratación — importación masiva',
                        created_by=user,
                        updated_by=user,
                    )

                    # Crear acceso si aplica
                    if crear_acceso and email_corp and username_corp:
                        self._create_user_for_colaborador(
                            colaborador, email_corp, username_corp, empresa, user
                        )
                        con_acceso += 1

                    creados += 1

            except Exception as e:
                logger.error(
                    'Error importando fila %s (CC %s): %s',
                    num_fila, identificacion, e, exc_info=True
                )
                errores.append({
                    'fila': num_fila,
                    'identificacion': identificacion or '—',
                    'errores': [str(e)],
                })

        return Response({
            'creados': creados,
            'con_acceso': con_acceso,
            'errores': errores,
            'total_filas': creados + len(errores),
        }, status=status.HTTP_200_OK if creados > 0 else status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='crear-acceso')
    @transaction.atomic
    def crear_acceso(self, request, pk=None):
        """
        Crea cuenta de usuario para un colaborador existente sin acceso.

        POST /colaboradores/{id}/crear-acceso/
        Body: {email_corporativo, username}
        """
        colaborador = self.get_object()

        if colaborador.usuario:
            return Response(
                {'detail': 'Este colaborador ya tiene acceso al sistema.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        email = request.data.get('email_corporativo', '').strip()
        username = request.data.get('username', '').strip()

        if not email or not username:
            return Response(
                {'detail': 'El email corporativo y nombre de usuario son requeridos.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {'detail': 'Este email ya está registrado en el sistema.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'detail': 'Este nombre de usuario ya existe.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        empresa = get_tenant_empresa()
        self._create_user_for_colaborador(
            colaborador, email, username, empresa, request.user
        )

        serializer = ColaboradorDetailSerializer(colaborador)
        return Response({
            'detail': 'Acceso al sistema creado exitosamente. Se envió un correo para configurar la contraseña.',
            'colaborador': serializer.data
        })


class HojaVidaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Hojas de Vida.

    Endpoints:
    - GET /hojas-vida/ - Listar hojas de vida
    - POST /hojas-vida/ - Crear hoja de vida
    - GET /hojas-vida/{id}/ - Detalle
    - PUT /hojas-vida/{id}/ - Actualizar
    - DELETE /hojas-vida/{id}/ - Eliminar
    - GET /hojas-vida/por-colaborador/{colaborador_id}/ - Por colaborador
    """
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'colaboradores'

    def get_queryset(self):
        queryset = HojaVida.objects.filter(is_active=True)

        colaborador_id = self.request.query_params.get('colaborador')
        if colaborador_id:
            queryset = queryset.filter(colaborador_id=colaborador_id)

        nivel_estudio = self.request.query_params.get('nivel_estudio')
        if nivel_estudio:
            queryset = queryset.filter(nivel_estudio_maximo=nivel_estudio)

        return queryset.select_related('colaborador')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return HojaVidaCreateUpdateSerializer
        return HojaVidaSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user,
            updated_by=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=False, methods=['get'], url_path='por-colaborador/(?P<colaborador_id>[^/.]+)')
    def por_colaborador(self, request, colaborador_id=None):
        """Retorna la hoja de vida de un colaborador"""
        try:
            hoja_vida = HojaVida.objects.get(
                colaborador_id=colaborador_id,
                is_active=True
            )
            serializer = HojaVidaSerializer(hoja_vida)
            return Response(serializer.data)
        except HojaVida.DoesNotExist:
            return Response(
                {'detail': 'No existe hoja de vida para este colaborador'},
                status=status.HTTP_404_NOT_FOUND
            )


class InfoPersonalViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Información Personal.

    Información sensible - requiere permisos especiales.

    Endpoints:
    - GET /info-personal/ - Listar (solo datos públicos)
    - POST /info-personal/ - Crear
    - GET /info-personal/{id}/ - Detalle
    - PUT /info-personal/{id}/ - Actualizar
    - DELETE /info-personal/{id}/ - Eliminar
    - GET /info-personal/por-colaborador/{colaborador_id}/ - Por colaborador
    """
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'colaboradores'

    def get_queryset(self):
        queryset = InfoPersonal.objects.filter(is_active=True)

        colaborador_id = self.request.query_params.get('colaborador')
        if colaborador_id:
            queryset = queryset.filter(colaborador_id=colaborador_id)

        return queryset.select_related('colaborador')

    def get_serializer_class(self):
        if self.action == 'list':
            return InfoPersonalPublicSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return InfoPersonalCreateUpdateSerializer
        return InfoPersonalSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user,
            updated_by=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=False, methods=['get'], url_path='por-colaborador/(?P<colaborador_id>[^/.]+)')
    def por_colaborador(self, request, colaborador_id=None):
        """Retorna la información personal de un colaborador"""
        try:
            info_personal = InfoPersonal.objects.get(
                colaborador_id=colaborador_id,
                is_active=True
            )
            serializer = InfoPersonalSerializer(info_personal)
            return Response(serializer.data)
        except InfoPersonal.DoesNotExist:
            return Response(
                {'detail': 'No existe información personal para este colaborador'},
                status=status.HTTP_404_NOT_FOUND
            )


class HistorialLaboralViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Historial Laboral.

    Endpoints:
    - GET /historial-laboral/ - Listar movimientos
    - POST /historial-laboral/ - Registrar movimiento
    - GET /historial-laboral/{id}/ - Detalle
    - PUT /historial-laboral/{id}/ - Actualizar
    - DELETE /historial-laboral/{id}/ - Eliminar
    - GET /historial-laboral/por-colaborador/{colaborador_id}/ - Por colaborador
    - GET /historial-laboral/ascensos/ - Solo ascensos
    - GET /historial-laboral/traslados/ - Solo traslados
    """
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'colaboradores'

    def get_queryset(self):
        queryset = HistorialLaboral.objects.filter(is_active=True)

        colaborador_id = self.request.query_params.get('colaborador')
        if colaborador_id:
            queryset = queryset.filter(colaborador_id=colaborador_id)

        tipo_movimiento = self.request.query_params.get('tipo_movimiento')
        if tipo_movimiento:
            queryset = queryset.filter(tipo_movimiento=tipo_movimiento)

        fecha_desde = self.request.query_params.get('fecha_desde')
        if fecha_desde:
            queryset = queryset.filter(fecha_movimiento__gte=fecha_desde)

        fecha_hasta = self.request.query_params.get('fecha_hasta')
        if fecha_hasta:
            queryset = queryset.filter(fecha_movimiento__lte=fecha_hasta)

        return queryset.select_related(
            'colaborador',
            'cargo_anterior', 'cargo_nuevo',
            'area_anterior', 'area_nueva',
            'aprobado_por'
        ).order_by('-fecha_movimiento')

    def get_serializer_class(self):
        if self.action == 'create':
            return HistorialLaboralCreateSerializer
        return HistorialLaboralSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user,
            updated_by=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=False, methods=['get'], url_path='por-colaborador/(?P<colaborador_id>[^/.]+)')
    def por_colaborador(self, request, colaborador_id=None):
        """Retorna el historial laboral de un colaborador"""
        queryset = self.get_queryset().filter(colaborador_id=colaborador_id)
        serializer = HistorialLaboralSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def ascensos(self, request):
        """Retorna solo ascensos"""
        queryset = self.get_queryset().filter(tipo_movimiento='ascenso')
        serializer = HistorialLaboralSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def traslados(self, request):
        """Retorna solo traslados"""
        queryset = self.get_queryset().filter(tipo_movimiento='traslado')
        serializer = HistorialLaboralSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='cambios-salario')
    def cambios_salario(self, request):
        """Retorna solo cambios de salario"""
        queryset = self.get_queryset().filter(tipo_movimiento='cambio_salario')
        serializer = HistorialLaboralSerializer(queryset, many=True)
        return Response(serializer.data)
