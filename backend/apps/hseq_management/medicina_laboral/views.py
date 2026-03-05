"""
Views para Medicina Laboral - HSEQ Management

ViewSets para gestión de medicina laboral y vigilancia epidemiológica
Incluye actions especiales: registrar_seguimiento, cerrar_caso
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.db import models

from .models import (
    TipoExamen,
    ExamenMedico,
    RestriccionMedica,
    ProgramaVigilancia,
    CasoVigilancia,
    DiagnosticoOcupacional,
    EstadisticaMedica
)
from .serializers import (
    TipoExamenSerializer,
    TipoExamenListSerializer,
    ExamenMedicoSerializer,
    ExamenMedicoListSerializer,
    RestriccionMedicaSerializer,
    RestriccionMedicaListSerializer,
    ProgramaVigilanciaSerializer,
    ProgramaVigilanciaListSerializer,
    CasoVigilanciaSerializer,
    CasoVigilanciaListSerializer,
    RegistrarSeguimientoSerializer,
    CerrarCasoSerializer,
    DiagnosticoOcupacionalSerializer,
    DiagnosticoOcupacionalListSerializer,
    EstadisticaMedicaSerializer,
    EstadisticaMedicaListSerializer
)


class TipoExamenViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Tipos de Exámenes Médicos

    Catálogo de tipos de exámenes médicos ocupacionales:
    - Ingreso, Periódico, Egreso, Post-incapacidad, etc.

    list: Listar todos los tipos de exámenes
    retrieve: Obtener detalle de un tipo de examen
    create: Crear nuevo tipo de examen
    update: Actualizar tipo de examen
    partial_update: Actualizar parcialmente tipo de examen
    destroy: Eliminar tipo de examen
    """
    queryset = TipoExamen.objects.all()
    serializer_class = TipoExamenSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo', 'periodicidad', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['codigo', 'nombre', 'tipo', 'created_at']
    ordering = ['tipo', 'nombre']

    def get_serializer_class(self):
        """Usar serializer simplificado para listado"""
        if self.action == 'list':
            return TipoExamenListSerializer
        return TipoExamenSerializer


class ExamenMedicoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Exámenes Médicos Ocupacionales

    Registro de exámenes médicos realizados a colaboradores con:
    - Programación y resultados
    - Conceptos de aptitud
    - Restricciones y seguimientos

    list: Listar exámenes médicos
    retrieve: Obtener detalle de examen médico
    create: Crear nuevo examen médico
    update: Actualizar examen médico
    partial_update: Actualizar parcialmente examen médico
    destroy: Eliminar examen médico
    por_colaborador: Filtrar exámenes de un colaborador específico
    vencidos: Listar exámenes vencidos o por vencer
    estadisticas: Obtener estadísticas de exámenes
    """
    queryset = ExamenMedico.objects.select_related('tipo_examen').all()
    serializer_class = ExamenMedicoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'empresa_id', 'colaborador', 'tipo_examen', 'estado',
        'concepto_aptitud', 'requiere_restricciones', 'requiere_seguimiento'
    ]
    search_fields = ['numero_examen', 'medico_evaluador', 'entidad_prestadora']
    ordering_fields = ['numero_examen', 'fecha_programada', 'fecha_realizado', 'created_at']
    ordering = ['-fecha_programada']

    def get_serializer_class(self):
        """Usar serializer simplificado para listado"""
        if self.action == 'list':
            return ExamenMedicoListSerializer
        return ExamenMedicoSerializer

    def get_queryset(self):
        """Multi-tenant: schema isolation handles filtering"""
        return super().get_queryset()

    @action(detail=False, methods=['get'], url_path='por-colaborador')
    def por_colaborador(self, request):
        """
        Obtener exámenes médicos de un colaborador específico

        Query params:
        - colaborador_id (required): ID del colaborador
        """
        colaborador_id = request.query_params.get('colaborador_id')

        if not colaborador_id:
            return Response(
                {'error': 'Se requiere el parámetro colaborador_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        examenes = self.get_queryset().filter(colaborador_id=colaborador_id)
        serializer = ExamenMedicoListSerializer(examenes, many=True)

        return Response({
            'colaborador_id': colaborador_id,
            'total_examenes': examenes.count(),
            'examenes': serializer.data
        })

    @action(detail=False, methods=['get'])
    def vencidos(self, request):
        """
        Listar exámenes vencidos o próximos a vencer

        Query params:
        - dias (optional): Días de anticipación (default: 30)
        """
        from django.utils import timezone
        from datetime import timedelta

        dias = int(request.query_params.get('dias', 30))
        fecha_limite = timezone.now().date() + timedelta(days=dias)

        examenes = self.get_queryset().filter(
            estado='PROGRAMADO',
            fecha_programada__lte=fecha_limite
        )

        serializer = ExamenMedicoListSerializer(examenes, many=True)

        return Response({
            'dias_anticipacion': dias,
            'fecha_limite': fecha_limite,
            'total': examenes.count(),
            'examenes': serializer.data
        })

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Obtener estadísticas generales de exámenes médicos

        Query params:
        - empresa_id (optional): Filtrar por empresa
        - anio (optional): Filtrar por año
        """
        queryset = self.get_queryset()

        empresa_id = request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        anio = request.query_params.get('anio')
        if anio:
            queryset = queryset.filter(fecha_programada__year=anio)

        total = queryset.count()
        por_estado = queryset.values('estado').annotate(
            count=models.Count('id')
        )
        por_concepto = queryset.values('concepto_aptitud').annotate(
            count=models.Count('id')
        )

        return Response({
            'total_examenes': total,
            'por_estado': list(por_estado),
            'por_concepto': list(por_concepto)
        })


class RestriccionMedicaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Restricciones Médicas

    Restricciones médicas temporales y permanentes:
    - Gestión de restricciones por colaborador
    - Control de vigencia
    - Seguimiento de ajustes realizados

    list: Listar restricciones médicas
    retrieve: Obtener detalle de restricción
    create: Crear nueva restricción
    update: Actualizar restricción
    partial_update: Actualizar parcialmente restricción
    destroy: Eliminar restricción
    por_colaborador: Filtrar restricciones de un colaborador
    activas: Listar solo restricciones activas
    levantar: Levantar una restricción
    """
    queryset = RestriccionMedica.objects.select_related('examen_medico').all()
    serializer_class = RestriccionMedicaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'empresa_id', 'colaborador', 'tipo_restriccion',
        'categoria', 'estado', 'ajuste_realizado'
    ]
    search_fields = ['codigo_restriccion', 'descripcion', 'medico_ordena']
    ordering_fields = ['codigo_restriccion', 'fecha_inicio', 'fecha_fin', 'created_at']
    ordering = ['-fecha_inicio']

    def get_serializer_class(self):
        """Usar serializer simplificado para listado"""
        if self.action == 'list':
            return RestriccionMedicaListSerializer
        return RestriccionMedicaSerializer

    def get_queryset(self):
        """Filtrar por empresa del usuario (multi-tenant)"""
        queryset = super().get_queryset()
        # TODO: Implementar filtro por empresa según usuario autenticado
        return queryset

    @action(detail=False, methods=['get'], url_path='por-colaborador')
    def por_colaborador(self, request):
        """
        Obtener restricciones médicas de un colaborador específico

        Query params:
        - colaborador_id (required): ID del colaborador
        - solo_activas (optional): Solo restricciones activas (default: false)
        """
        colaborador_id = request.query_params.get('colaborador_id')
        solo_activas = request.query_params.get('solo_activas', 'false').lower() == 'true'

        if not colaborador_id:
            return Response(
                {'error': 'Se requiere el parámetro colaborador_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        restricciones = self.get_queryset().filter(colaborador_id=colaborador_id)

        if solo_activas:
            restricciones = restricciones.filter(estado='ACTIVA')

        serializer = RestriccionMedicaListSerializer(restricciones, many=True)

        return Response({
            'colaborador_id': colaborador_id,
            'solo_activas': solo_activas,
            'total_restricciones': restricciones.count(),
            'restricciones': serializer.data
        })

    @action(detail=False, methods=['get'])
    def activas(self, request):
        """Listar solo restricciones activas"""
        restricciones = self.get_queryset().filter(estado='ACTIVA')
        serializer = RestriccionMedicaListSerializer(restricciones, many=True)

        return Response({
            'total': restricciones.count(),
            'restricciones': serializer.data
        })

    @action(detail=True, methods=['post'])
    def levantar(self, request, pk=None):
        """
        Levantar una restricción médica

        Body params:
        - motivo (required): Motivo del levantamiento
        """
        restriccion = self.get_object()

        if restriccion.estado != 'ACTIVA':
            return Response(
                {'error': 'Solo se pueden levantar restricciones activas'},
                status=status.HTTP_400_BAD_REQUEST
            )

        motivo = request.data.get('motivo')
        if not motivo:
            return Response(
                {'error': 'Se requiere el motivo del levantamiento'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from django.utils import timezone
        restriccion.estado = 'LEVANTADA'
        restriccion.fecha_levantamiento = timezone.now().date()
        restriccion.motivo_levantamiento = motivo
        restriccion.save()

        serializer = self.get_serializer(restriccion)
        return Response(serializer.data)


class ProgramaVigilanciaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Programas de Vigilancia Epidemiológica (PVE)

    Programas de vigilancia según riesgos identificados:
    - Osteomuscular, Cardiovascular, Auditivo, etc.
    - Gestión de población objetivo
    - Indicadores y seguimiento

    list: Listar programas de vigilancia
    retrieve: Obtener detalle de programa
    create: Crear nuevo programa
    update: Actualizar programa
    partial_update: Actualizar parcialmente programa
    destroy: Eliminar programa
    activos: Listar solo programas activos
    casos_programa: Obtener casos de un programa específico
    """
    queryset = ProgramaVigilancia.objects.all()
    serializer_class = ProgramaVigilanciaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['empresa_id', 'tipo', 'estado', 'responsable_id']
    search_fields = ['codigo', 'nombre', 'descripcion', 'objetivo']
    ordering_fields = ['codigo', 'nombre', 'fecha_inicio', 'created_at']
    ordering = ['tipo', 'nombre']

    def get_serializer_class(self):
        """Usar serializer simplificado para listado"""
        if self.action == 'list':
            return ProgramaVigilanciaListSerializer
        return ProgramaVigilanciaSerializer

    def get_queryset(self):
        """Filtrar por empresa del usuario (multi-tenant)"""
        queryset = super().get_queryset()
        # TODO: Implementar filtro por empresa según usuario autenticado
        return queryset

    @action(detail=False, methods=['get'])
    def activos(self, request):
        """Listar solo programas activos"""
        programas = self.get_queryset().filter(estado='ACTIVO')
        serializer = ProgramaVigilanciaListSerializer(programas, many=True)

        return Response({
            'total': programas.count(),
            'programas': serializer.data
        })

    @action(detail=True, methods=['get'], url_path='casos-programa')
    def casos_programa(self, request, pk=None):
        """
        Obtener todos los casos de un programa específico

        Query params:
        - estado (optional): Filtrar por estado del caso
        """
        programa = self.get_object()
        casos = programa.casos.all()

        estado_filtro = request.query_params.get('estado')
        if estado_filtro:
            casos = casos.filter(estado=estado_filtro)

        from .serializers import CasoVigilanciaListSerializer
        serializer = CasoVigilanciaListSerializer(casos, many=True)

        return Response({
            'programa': {
                'id': programa.id,
                'codigo': programa.codigo,
                'nombre': programa.nombre
            },
            'total_casos': casos.count(),
            'casos': serializer.data
        })


class CasoVigilanciaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Casos en Vigilancia Epidemiológica

    Casos individuales en seguimiento:
    - Apertura y cierre de casos
    - Registro de seguimientos
    - Plan de intervención
    - Gestión de severidad

    list: Listar casos en vigilancia
    retrieve: Obtener detalle de caso
    create: Crear nuevo caso
    update: Actualizar caso
    partial_update: Actualizar parcialmente caso
    destroy: Eliminar caso
    registrar_seguimiento: Registrar seguimiento en caso (ACTION)
    cerrar_caso: Cerrar caso de vigilancia (ACTION)
    por_colaborador: Filtrar casos de un colaborador
    activos: Listar solo casos activos
    """
    queryset = CasoVigilancia.objects.select_related('programa').all()
    serializer_class = CasoVigilanciaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'empresa_id', 'programa', 'colaborador',
        'severidad', 'estado'
    ]
    search_fields = ['numero_caso', 'descripcion_caso']
    ordering_fields = ['numero_caso', 'fecha_apertura', 'severidad', 'created_at']
    ordering = ['-fecha_apertura']

    def get_serializer_class(self):
        """Usar serializer simplificado para listado"""
        if self.action == 'list':
            return CasoVigilanciaListSerializer
        elif self.action == 'registrar_seguimiento':
            return RegistrarSeguimientoSerializer
        elif self.action == 'cerrar_caso':
            return CerrarCasoSerializer
        return CasoVigilanciaSerializer

    def get_queryset(self):
        """Filtrar por empresa del usuario (multi-tenant)"""
        queryset = super().get_queryset()
        # TODO: Implementar filtro por empresa según usuario autenticado
        return queryset

    @action(detail=True, methods=['post'], url_path='registrar-seguimiento')
    def registrar_seguimiento(self, request, pk=None):
        """
        Registrar un nuevo seguimiento en el caso

        Body params:
        - descripcion (required): Descripción del seguimiento
        - responsable_id (required): ID del responsable del seguimiento
        """
        caso = self.get_object()

        if caso.estado in ['CERRADO', 'CANCELADO']:
            return Response(
                {'error': 'No se pueden registrar seguimientos en casos cerrados o cancelados'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = RegistrarSeguimientoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Registrar seguimiento usando el método del modelo
        caso.registrar_seguimiento(
            descripcion=serializer.validated_data['descripcion'],
            responsable_id=serializer.validated_data['responsable_id']
        )

        # Retornar caso actualizado
        caso_serializer = CasoVigilanciaSerializer(caso)
        return Response(caso_serializer.data)

    @action(detail=True, methods=['post'], url_path='cerrar-caso')
    def cerrar_caso(self, request, pk=None):
        """
        Cerrar un caso de vigilancia

        Body params:
        - motivo (required): Motivo del cierre
        - resultado (required): Resultado final y conclusiones
        """
        caso = self.get_object()

        if caso.estado == 'CERRADO':
            return Response(
                {'error': 'El caso ya está cerrado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CerrarCasoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Cerrar caso usando el método del modelo
        caso.cerrar_caso(
            motivo=serializer.validated_data['motivo'],
            resultado=serializer.validated_data['resultado'],
            user_id=request.user.id
        )

        # Retornar caso actualizado
        caso_serializer = CasoVigilanciaSerializer(caso)
        return Response(caso_serializer.data)

    @action(detail=False, methods=['get'], url_path='por-colaborador')
    def por_colaborador(self, request):
        """
        Obtener casos de un colaborador específico

        Query params:
        - colaborador_id (required): ID del colaborador
        - solo_activos (optional): Solo casos activos (default: false)
        """
        colaborador_id = request.query_params.get('colaborador_id')
        solo_activos = request.query_params.get('solo_activos', 'false').lower() == 'true'

        if not colaborador_id:
            return Response(
                {'error': 'Se requiere el parámetro colaborador_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        casos = self.get_queryset().filter(colaborador_id=colaborador_id)

        if solo_activos:
            casos = casos.filter(estado='ACTIVO')

        serializer = CasoVigilanciaListSerializer(casos, many=True)

        return Response({
            'colaborador_id': colaborador_id,
            'solo_activos': solo_activos,
            'total_casos': casos.count(),
            'casos': serializer.data
        })

    @action(detail=False, methods=['get'])
    def activos(self, request):
        """Listar solo casos activos"""
        casos = self.get_queryset().filter(estado='ACTIVO')
        serializer = CasoVigilanciaListSerializer(casos, many=True)

        return Response({
            'total': casos.count(),
            'casos': serializer.data
        })


class DiagnosticoOcupacionalViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Diagnósticos Ocupacionales (CIE-10)

    Catálogo de diagnósticos:
    - Clasificación según origen (Ocupacional/Común)
    - Relación con riesgos
    - Configuración de vigilancia

    list: Listar diagnósticos
    retrieve: Obtener detalle de diagnóstico
    create: Crear nuevo diagnóstico
    update: Actualizar diagnóstico
    partial_update: Actualizar parcialmente diagnóstico
    destroy: Eliminar diagnóstico
    ocupacionales: Listar solo diagnósticos ocupacionales
    requieren_vigilancia: Listar diagnósticos que requieren PVE
    """
    queryset = DiagnosticoOcupacional.objects.all()
    serializer_class = DiagnosticoOcupacionalSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'origen', 'categoria', 'requiere_vigilancia',
        'requiere_reporte_arl', 'requiere_reporte_secretaria', 'is_active'
    ]
    search_fields = ['codigo_cie10', 'nombre', 'descripcion']
    ordering_fields = ['codigo_cie10', 'nombre', 'created_at']
    ordering = ['codigo_cie10']

    def get_serializer_class(self):
        """Usar serializer simplificado para listado"""
        if self.action == 'list':
            return DiagnosticoOcupacionalListSerializer
        return DiagnosticoOcupacionalSerializer

    @action(detail=False, methods=['get'])
    def ocupacionales(self, request):
        """Listar solo diagnósticos de origen ocupacional"""
        diagnosticos = self.get_queryset().filter(origen__in=['OCUPACIONAL', 'AMBOS'])
        serializer = DiagnosticoOcupacionalListSerializer(diagnosticos, many=True)

        return Response({
            'total': diagnosticos.count(),
            'diagnosticos': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='requieren-vigilancia')
    def requieren_vigilancia(self, request):
        """Listar diagnósticos que requieren vigilancia epidemiológica"""
        diagnosticos = self.get_queryset().filter(requiere_vigilancia=True)
        serializer = DiagnosticoOcupacionalListSerializer(diagnosticos, many=True)

        return Response({
            'total': diagnosticos.count(),
            'diagnosticos': serializer.data
        })


class EstadisticaMedicaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Estadísticas Médicas

    Consolidados mensuales de indicadores:
    - Exámenes realizados
    - Conceptos de aptitud
    - Restricciones activas
    - Casos en vigilancia
    - Indicadores calculados

    list: Listar estadísticas
    retrieve: Obtener detalle de estadística
    create: Crear nueva estadística
    update: Actualizar estadística
    partial_update: Actualizar parcialmente estadística
    destroy: Eliminar estadística
    por_periodo: Filtrar estadísticas por período
    tendencias: Obtener tendencias de indicadores
    """
    queryset = EstadisticaMedica.objects.all()
    serializer_class = EstadisticaMedicaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['empresa_id', 'anio', 'mes']
    ordering_fields = ['anio', 'mes', 'created_at']
    ordering = ['-anio', '-mes']

    def get_serializer_class(self):
        """Usar serializer simplificado para listado"""
        if self.action == 'list':
            return EstadisticaMedicaListSerializer
        return EstadisticaMedicaSerializer

    def get_queryset(self):
        """Filtrar por empresa del usuario (multi-tenant)"""
        queryset = super().get_queryset()
        # TODO: Implementar filtro por empresa según usuario autenticado
        return queryset

    @action(detail=False, methods=['get'], url_path='por-periodo')
    def por_periodo(self, request):
        """
        Obtener estadísticas de un período específico

        Query params:
        - anio (required): Año
        - mes (optional): Mes (si no se especifica, retorna todo el año)
        """
        anio = request.query_params.get('anio')

        if not anio:
            return Response(
                {'error': 'Se requiere el parámetro anio'},
                status=status.HTTP_400_BAD_REQUEST
            )

        estadisticas = self.get_queryset().filter(anio=anio)

        mes = request.query_params.get('mes')
        if mes:
            estadisticas = estadisticas.filter(mes=mes)

        serializer = EstadisticaMedicaListSerializer(estadisticas, many=True)

        return Response({
            'anio': anio,
            'mes': mes,
            'total_registros': estadisticas.count(),
            'estadisticas': serializer.data
        })

    @action(detail=False, methods=['get'])
    def tendencias(self, request):
        """
        Obtener tendencias de indicadores

        Query params:
        - anio (required): Año
        - indicador (optional): Indicador específico (aptitud, cobertura)
        """
        anio = request.query_params.get('anio')

        if not anio:
            return Response(
                {'error': 'Se requiere el parámetro anio'},
                status=status.HTTP_400_BAD_REQUEST
            )

        estadisticas = self.get_queryset().filter(anio=anio).order_by('mes')

        tendencias_data = {
            'anio': anio,
            'meses': []
        }

        for est in estadisticas:
            tendencias_data['meses'].append({
                'mes': est.mes,
                'porcentaje_aptitud': float(est.porcentaje_aptitud),
                'porcentaje_cobertura': float(est.porcentaje_cobertura_examenes),
                'examenes_realizados': est.examenes_realizados,
                'restricciones_activas': est.restricciones_activas,
                'casos_vigilancia_activos': est.casos_vigilancia_activos
            })

        return Response(tendencias_data)
