"""
ViewSet para Biblioteca Maestra — Read-only + importar a tenant.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import BibliotecaPlantilla
from .serializers import (
    BibliotecaPlantillaListSerializer,
    BibliotecaPlantillaDetailSerializer,
)


class BibliotecaPlantillaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet read-only para plantillas de la biblioteca maestra.
    Accesible desde cualquier tenant (modelo en schema public).
    """
    permission_classes = [IsAuthenticated]
    queryset = BibliotecaPlantilla.objects.filter(is_active=True)

    def get_serializer_class(self):
        if self.action == 'list':
            return BibliotecaPlantillaListSerializer
        return BibliotecaPlantillaDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        categoria = self.request.query_params.get('categoria')
        if categoria:
            queryset = queryset.filter(categoria=categoria)

        industria = self.request.query_params.get('industria')
        if industria:
            queryset = queryset.filter(industria=industria)

        norma = self.request.query_params.get('norma_iso_codigo')
        if norma:
            queryset = queryset.filter(norma_iso_codigo=norma)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(nombre__icontains=search)

        return queryset

    @action(detail=True, methods=['post'], url_path='importar-a-tenant')
    def importar_a_tenant(self, request, pk=None):
        """
        Copia una plantilla de la biblioteca maestra al tenant actual.
        Crea un TipoDocumento si no existe y una PlantillaDocumento local.
        """
        from django.apps import apps

        biblioteca = self.get_object()

        # Obtener modelos del tenant (C2 isolation: apps.get_model)
        TipoDocumento = apps.get_model('gestion_documental', 'TipoDocumento')
        PlantillaDocumento = apps.get_model('gestion_documental', 'PlantillaDocumento')

        from apps.core.base_models.mixins import get_tenant_empresa
        empresa = get_tenant_empresa()

        # Verificar si ya existe
        existente = PlantillaDocumento.objects.filter(
            plantilla_maestra_codigo=biblioteca.codigo,
            empresa_id=empresa.id,
        ).first()

        if existente:
            return Response(
                {'error': f'La plantilla "{biblioteca.nombre}" ya fue importada.'},
                status=status.HTTP_409_CONFLICT,
            )

        # Buscar o crear TipoDocumento que coincida
        tipo_doc, _ = TipoDocumento.objects.get_or_create(
            codigo=biblioteca.tipo_documento_codigo,
            empresa_id=empresa.id,
            defaults={
                'nombre': dict(BibliotecaPlantilla.CATEGORIA_CHOICES).get(
                    biblioteca.categoria, biblioteca.categoria
                ),
                'nivel_documento': 'OPERATIVO',
                'is_active': True,
            },
        )

        # Crear PlantillaDocumento en el tenant
        plantilla = PlantillaDocumento.objects.create(
            codigo=f'BIB-{biblioteca.codigo}',
            nombre=biblioteca.nombre,
            descripcion=biblioteca.descripcion,
            tipo_documento=tipo_doc,
            tipo_plantilla='HTML',
            contenido_plantilla=biblioteca.contenido_plantilla,
            variables_disponibles=biblioteca.variables_disponibles,
            estilos_css=biblioteca.estilos_css,
            encabezado=biblioteca.encabezado,
            pie_pagina=biblioteca.pie_pagina,
            version=biblioteca.version,
            estado='ACTIVA',
            plantilla_maestra_codigo=biblioteca.codigo,
            es_personalizada=False,
            empresa_id=empresa.id,
            created_by=request.user,
        )

        from apps.gestion_estrategica.gestion_documental.serializers import (
            PlantillaDocumentoDetailSerializer,
        )
        serializer = PlantillaDocumentoDetailSerializer(plantilla)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def choices(self, request):
        """Retorna opciones de filtro disponibles."""
        return Response({
            'categorias': BibliotecaPlantilla.CATEGORIA_CHOICES,
            'industrias': BibliotecaPlantilla.INDUSTRIA_CHOICES,
        })
