"""
Views para Estructura de Cargos - Talent Hub
Sistema de Gestión StrateKaz

ViewSets CRUD completos para profesiogramas, competencias,
requisitos especiales y vacantes.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q

from apps.core.base_models import get_tenant_empresa
from .models import Profesiograma, MatrizCompetencia, RequisitoEspecial, Vacante
from .serializers import (
    # Profesiograma
    ProfesiogramaListSerializer,
    ProfesiogramaDetailSerializer,
    ProfesiogramaCreateUpdateSerializer,
    ProfesiogramaEstadisticasSerializer,
    # MatrizCompetencia
    MatrizCompetenciaSerializer,
    MatrizCompetenciaCreateSerializer,
    # RequisitoEspecial
    RequisitoEspecialSerializer,
    RequisitoEspecialCreateSerializer,
    # Vacante
    VacanteListSerializer,
    VacanteDetailSerializer,
    VacanteCreateUpdateSerializer,
    VacanteEstadisticasSerializer,
)


class ProfesiogramaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Profesiogramas.

    Endpoints:
    - GET /profesiogramas/ - Listar profesiogramas
    - POST /profesiogramas/ - Crear profesiograma
    - GET /profesiogramas/{id}/ - Detalle de profesiograma
    - PUT /profesiogramas/{id}/ - Actualizar profesiograma
    - DELETE /profesiogramas/{id}/ - Eliminar profesiograma (soft delete)
    - GET /profesiogramas/estadisticas/ - Estadísticas
    - GET /profesiogramas/vigentes/ - Solo profesiogramas vigentes
    - GET /profesiogramas/por-cargo/{cargo_id}/ - Filtrar por cargo
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Profesiograma.objects.filter(is_active=True)

        # Filtros opcionales
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)

        cargo_id = self.request.query_params.get('cargo')
        if cargo_id:
            queryset = queryset.filter(cargo_id=cargo_id)

        area_id = self.request.query_params.get('area')
        if area_id:
            queryset = queryset.filter(area_id=area_id)

        nivel_educativo = self.request.query_params.get('nivel_educativo')
        if nivel_educativo:
            queryset = queryset.filter(nivel_educativo_minimo=nivel_educativo)

        return queryset.select_related('cargo', 'area', 'aprobado_por')

    def get_serializer_class(self):
        if self.action == 'list':
            return ProfesiogramaListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProfesiogramaCreateUpdateSerializer
        return ProfesiogramaDetailSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user,
            updated_by=self.request.user
        )

    def perform_update(self, serializer):
        """Actualiza usuario de modificación"""
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        """Soft delete"""
        instance.soft_delete()

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Retorna estadísticas de profesiogramas"""
        queryset = self.get_queryset()

        # Contar por estado
        por_estado = dict(queryset.values_list('estado').annotate(count=Count('id')))

        # Contar por nivel educativo
        por_nivel = dict(queryset.values_list('nivel_educativo_minimo').annotate(count=Count('id')))

        # Contar vigentes
        vigentes = sum(1 for p in queryset if p.esta_vigente)

        data = {
            'total': queryset.count(),
            'vigentes': vigentes,
            'por_estado': por_estado,
            'por_nivel_educativo': por_nivel,
        }

        serializer = ProfesiogramaEstadisticasSerializer(data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def vigentes(self, request):
        """Retorna solo profesiogramas vigentes"""
        queryset = self.get_queryset().filter(estado='VIGENTE')
        # Filtrar en Python por fecha de vigencia
        vigentes = [p for p in queryset if p.esta_vigente]
        serializer = ProfesiogramaListSerializer(vigentes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='por-cargo/(?P<cargo_id>[^/.]+)')
    def por_cargo(self, request, cargo_id=None):
        """Retorna profesiogramas por cargo"""
        queryset = self.get_queryset().filter(cargo_id=cargo_id)
        serializer = ProfesiogramaListSerializer(queryset, many=True)
        return Response(serializer.data)


class MatrizCompetenciaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Matriz de Competencias.

    Endpoints:
    - GET /competencias/ - Listar competencias
    - POST /competencias/ - Crear competencia
    - GET /competencias/{id}/ - Detalle de competencia
    - PUT /competencias/{id}/ - Actualizar competencia
    - DELETE /competencias/{id}/ - Eliminar competencia
    - GET /competencias/por-profesiograma/{id}/ - Competencias por profesiograma
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = MatrizCompetencia.objects.filter(is_active=True)

        # Filtros opcionales
        profesiograma_id = self.request.query_params.get('profesiograma')
        if profesiograma_id:
            queryset = queryset.filter(profesiograma_id=profesiograma_id)

        tipo = self.request.query_params.get('tipo')
        if tipo:
            queryset = queryset.filter(tipo_competencia=tipo)

        criticidad = self.request.query_params.get('criticidad')
        if criticidad:
            queryset = queryset.filter(criticidad=criticidad)

        return queryset.select_related('profesiograma')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return MatrizCompetenciaCreateSerializer
        return MatrizCompetenciaSerializer

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

    @action(detail=False, methods=['get'], url_path='por-profesiograma/(?P<profesiograma_id>[^/.]+)')
    def por_profesiograma(self, request, profesiograma_id=None):
        """Retorna competencias de un profesiograma"""
        queryset = self.get_queryset().filter(profesiograma_id=profesiograma_id)
        serializer = MatrizCompetenciaSerializer(queryset, many=True)
        return Response(serializer.data)


class RequisitoEspecialViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Requisitos Especiales.

    Endpoints:
    - GET /requisitos-especiales/ - Listar requisitos
    - POST /requisitos-especiales/ - Crear requisito
    - GET /requisitos-especiales/{id}/ - Detalle
    - PUT /requisitos-especiales/{id}/ - Actualizar
    - DELETE /requisitos-especiales/{id}/ - Eliminar
    - GET /requisitos-especiales/por-profesiograma/{id}/ - Por profesiograma
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = RequisitoEspecial.objects.filter(is_active=True)

        profesiograma_id = self.request.query_params.get('profesiograma')
        if profesiograma_id:
            queryset = queryset.filter(profesiograma_id=profesiograma_id)

        tipo = self.request.query_params.get('tipo')
        if tipo:
            queryset = queryset.filter(tipo_requisito=tipo)

        return queryset.select_related('profesiograma')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return RequisitoEspecialCreateSerializer
        return RequisitoEspecialSerializer

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

    @action(detail=False, methods=['get'], url_path='por-profesiograma/(?P<profesiograma_id>[^/.]+)')
    def por_profesiograma(self, request, profesiograma_id=None):
        queryset = self.get_queryset().filter(profesiograma_id=profesiograma_id)
        serializer = RequisitoEspecialSerializer(queryset, many=True)
        return Response(serializer.data)


class VacanteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Vacantes.

    Endpoints:
    - GET /vacantes/ - Listar vacantes
    - POST /vacantes/ - Crear vacante
    - GET /vacantes/{id}/ - Detalle
    - PUT /vacantes/{id}/ - Actualizar
    - DELETE /vacantes/{id}/ - Eliminar
    - GET /vacantes/estadisticas/ - Estadísticas
    - GET /vacantes/abiertas/ - Solo abiertas
    - POST /vacantes/{id}/cerrar/ - Cerrar vacante
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Vacante.objects.filter(is_active=True)

        # Filtros
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)

        prioridad = self.request.query_params.get('prioridad')
        if prioridad:
            queryset = queryset.filter(prioridad=prioridad)

        cargo_id = self.request.query_params.get('cargo')
        if cargo_id:
            queryset = queryset.filter(cargo_id=cargo_id)

        area_id = self.request.query_params.get('area')
        if area_id:
            queryset = queryset.filter(area_id=area_id)

        return queryset.select_related(
            'cargo', 'area', 'profesiograma',
            'aprobado_por', 'responsable_reclutamiento'
        )

    def get_serializer_class(self):
        if self.action == 'list':
            return VacanteListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return VacanteCreateUpdateSerializer
        return VacanteDetailSerializer

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

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadísticas de vacantes"""
        queryset = self.get_queryset()

        por_estado = dict(queryset.values_list('estado').annotate(count=Count('id')))
        por_prioridad = dict(queryset.values_list('prioridad').annotate(count=Count('id')))

        # Contar abiertas
        abiertas = sum(1 for v in queryset if v.esta_abierta)
        cerradas = queryset.filter(
            estado__in=['CERRADA_CONTRATADA', 'CERRADA_CANCELADA']
        ).count()

        # Posiciones
        posiciones_totales = sum(v.cantidad_posiciones for v in queryset)
        posiciones_cubiertas = sum(v.posiciones_cubiertas for v in queryset)

        data = {
            'total': queryset.count(),
            'abiertas': abiertas,
            'cerradas': cerradas,
            'por_estado': por_estado,
            'por_prioridad': por_prioridad,
            'posiciones_totales': posiciones_totales,
            'posiciones_cubiertas': posiciones_cubiertas,
            'posiciones_pendientes': posiciones_totales - posiciones_cubiertas,
        }

        serializer = VacanteEstadisticasSerializer(data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def abiertas(self, request):
        """Retorna solo vacantes abiertas"""
        queryset = self.get_queryset().filter(
            estado__in=['APROBADA', 'PUBLICADA', 'EN_PROCESO', 'FINALISTAS']
        )
        serializer = VacanteListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cerrar(self, request, pk=None):
        """Cierra una vacante"""
        vacante = self.get_object()
        motivo = request.data.get('motivo_cierre', '')
        contratada = request.data.get('contratada', True)

        if contratada:
            vacante.estado = 'CERRADA_CONTRATADA'
        else:
            vacante.estado = 'CERRADA_CANCELADA'

        vacante.motivo_cierre = motivo
        vacante.fecha_cierre_real = request.data.get('fecha_cierre')
        vacante.updated_by = request.user
        vacante.save()

        serializer = VacanteDetailSerializer(vacante)
        return Response(serializer.data)
