"""
Tests de Modelos para Dashboard Gerencial - Analytics
=====================================================

Tests unitarios para:
- VistaDashboard: perspectivas BSC, permisos por rol
- WidgetDashboard: tipos de widget, posicionamiento grid
- FavoritoDashboard: favoritos por usuario, dashboard default único

Total de tests: 7
Cobertura: Todos los modelos y sus métodos principales

Autor: Sistema ERP StrateKaz
Fecha: 29 Diciembre 2025
"""
import pytest
from django.db import IntegrityError

from apps.analytics.dashboard_gerencial.models import (
    VistaDashboard,
    WidgetDashboard,
    FavoritoDashboard
)


@pytest.mark.django_db
class TestVistaDashboard:
    """Tests para el modelo VistaDashboard."""

    def test_crear_vista_dashboard(self, empresa):
        """
        Test: Crear vista de dashboard básica.

        Given: Datos válidos de vista
        When: Se crea la vista
        Then: Debe crearse correctamente con perspectiva BSC
        """
        vista = VistaDashboard.objects.create(
            empresa_id=empresa.id,
            codigo='DASH-TEST-001',
            nombre='Dashboard Test',
            descripcion='Dashboard de prueba',
            perspectiva_bsc='cliente',
            es_publica=True,
            orden=1
        )

        assert vista.pk is not None
        assert vista.codigo == 'DASH-TEST-001'
        assert vista.perspectiva_bsc == 'cliente'
        assert vista.es_publica is True

    def test_str_vista_dashboard(self, vista_dashboard_financiera):
        """Test: Representación en string de vista."""
        expected = f"{vista_dashboard_financiera.codigo} - {vista_dashboard_financiera.nombre}"
        assert str(vista_dashboard_financiera) == expected

    def test_codigo_unico_vista(self, vista_dashboard_financiera):
        """
        Test: Código debe ser único globalmente.

        Given: Vista existente con código único
        When: Se intenta crear otra vista con mismo código
        Then: Debe lanzar IntegrityError
        """
        with pytest.raises(IntegrityError):
            VistaDashboard.objects.create(
                empresa_id=vista_dashboard_financiera.empresa_id,
                codigo='DASH-FIN-001',  # Código duplicado
                nombre='Otra vista',
                descripcion='Test',
                perspectiva_bsc='general',
                es_publica=True
            )

    def test_choices_perspectiva_bsc(self, vista_dashboard_financiera):
        """Test: Validar choices de perspectiva BSC."""
        perspectivas = ['financiera', 'cliente', 'procesos', 'aprendizaje', 'general']
        assert vista_dashboard_financiera.perspectiva_bsc in perspectivas

    def test_relacion_roles_permitidos(self, vista_dashboard_restringida, rol):
        """
        Test: Relación ManyToMany con roles.

        Given: Vista restringida con roles asignados
        When: Se consultan roles_permitidos
        Then: Debe retornar los roles asociados
        """
        assert vista_dashboard_restringida.es_publica is False
        assert rol in vista_dashboard_restringida.roles_permitidos.all()


@pytest.mark.django_db
class TestWidgetDashboard:
    """Tests para el modelo WidgetDashboard."""

    def test_crear_widget_dashboard(self, empresa, vista_dashboard_financiera):
        """
        Test: Crear widget básico.

        Given: Vista de dashboard existente
        When: Se crea el widget
        Then: Debe crearse correctamente con posición grid
        """
        widget = WidgetDashboard.objects.create(
            empresa_id=empresa.id,
            vista=vista_dashboard_financiera,
            tipo_widget='kpi_card',
            titulo='Widget Test',
            configuracion={'color': 'green'},
            posicion_x=0,
            posicion_y=0,
            ancho=4,
            alto=1,
            orden=1
        )

        assert widget.pk is not None
        assert widget.tipo_widget == 'kpi_card'
        assert widget.posicion_x == 0
        assert widget.ancho == 4

    def test_str_widget_dashboard(self, widget_kpi_card):
        """Test: Representación en string de widget."""
        expected = f"{widget_kpi_card.vista.codigo} - {widget_kpi_card.titulo}"
        assert str(widget_kpi_card) == expected

    def test_choices_tipo_widget(self, widget_kpi_card):
        """Test: Validar choices de tipo de widget."""
        tipos = ['kpi_card', 'grafico_linea', 'grafico_barra',
                 'grafico_pie', 'tabla', 'gauge', 'mapa_calor']
        assert widget_kpi_card.tipo_widget in tipos

    def test_relacion_kpis_many_to_many(self, widget_grafico_linea, kpi_financiero):
        """
        Test: Relación ManyToMany con KPIs.

        Given: Widget con KPIs asociados
        When: Se consultan los KPIs
        Then: Debe retornar los KPIs vinculados
        """
        assert kpi_financiero in widget_grafico_linea.kpis.all()

    def test_posicionamiento_grid(self, widget_kpi_card, widget_grafico_linea):
        """
        Test: Posicionamiento en grid layout.

        Given: Widgets con diferentes posiciones
        When: Se consultan las coordenadas
        Then: Deben estar dentro del sistema de 12 columnas
        """
        # Widget 1: posición (0,0) tamaño 4x1
        assert widget_kpi_card.posicion_x == 0
        assert widget_kpi_card.posicion_y == 0
        assert widget_kpi_card.ancho == 4
        assert widget_kpi_card.ancho <= 12

        # Widget 2: posición (4,0) tamaño 8x2
        assert widget_grafico_linea.posicion_x == 4
        assert widget_grafico_linea.ancho == 8
        assert widget_grafico_linea.posicion_x + widget_grafico_linea.ancho <= 12

    def test_configuracion_json_field(self, widget_kpi_card):
        """
        Test: Campo configuracion como JSON.

        Given: Widget con configuración
        When: Se accede al campo configuracion
        Then: Debe ser un diccionario
        """
        assert isinstance(widget_kpi_card.configuracion, dict)
        assert 'color' in widget_kpi_card.configuracion
        assert widget_kpi_card.configuracion['color'] == 'blue'


@pytest.mark.django_db
class TestFavoritoDashboard:
    """Tests para el modelo FavoritoDashboard."""

    def test_crear_favorito_dashboard(self, usuario, vista_dashboard_financiera):
        """
        Test: Crear favorito de dashboard.

        Given: Usuario y vista de dashboard
        When: Se marca como favorito
        Then: Debe crearse la relación
        """
        favorito = FavoritoDashboard.objects.create(
            usuario=usuario,
            vista=vista_dashboard_financiera,
            es_default=False
        )

        assert favorito.pk is not None
        assert favorito.usuario == usuario
        assert favorito.vista == vista_dashboard_financiera
        assert favorito.es_default is False

    def test_str_favorito_dashboard(self, favorito_dashboard):
        """Test: Representación en string de favorito."""
        expected = f"{favorito_dashboard.usuario.email} - {favorito_dashboard.vista.nombre}"
        assert str(favorito_dashboard) == expected

    def test_unique_together_usuario_vista(self, favorito_dashboard):
        """
        Test: Usuario no puede marcar misma vista como favorita dos veces.

        Given: Favorito existente
        When: Se intenta crear otro favorito con mismo usuario y vista
        Then: Debe lanzar IntegrityError
        """
        with pytest.raises(IntegrityError):
            FavoritoDashboard.objects.create(
                usuario=favorito_dashboard.usuario,
                vista=favorito_dashboard.vista,
                es_default=False
            )

    def test_solo_un_default_por_usuario(self, usuario, vista_dashboard_financiera, vista_dashboard_procesos):
        """
        Test: Solo un dashboard default por usuario.

        Given: Usuario con un favorito default
        When: Se marca otro favorito como default
        Then: El anterior debe dejar de ser default
        """
        # Crear primer favorito default
        fav1 = FavoritoDashboard.objects.create(
            usuario=usuario,
            vista=vista_dashboard_financiera,
            es_default=True
        )
        assert fav1.es_default is True

        # Crear segundo favorito default
        fav2 = FavoritoDashboard.objects.create(
            usuario=usuario,
            vista=vista_dashboard_procesos,
            es_default=True
        )
        assert fav2.es_default is True

        # Verificar que el primero dejó de ser default
        fav1.refresh_from_db()
        assert fav1.es_default is False

    def test_favoritos_por_usuario_diferente(self, usuario, otro_usuario, vista_dashboard_financiera):
        """
        Test: Usuarios diferentes pueden tener misma vista como favorita.

        Given: Dos usuarios diferentes
        When: Ambos marcan misma vista como favorita
        Then: Deben crearse ambos favoritos
        """
        fav1 = FavoritoDashboard.objects.create(
            usuario=usuario,
            vista=vista_dashboard_financiera,
            es_default=False
        )

        fav2 = FavoritoDashboard.objects.create(
            usuario=otro_usuario,
            vista=vista_dashboard_financiera,
            es_default=False
        )

        assert fav1.pk != fav2.pk
        assert fav1.vista == fav2.vista
        assert fav1.usuario != fav2.usuario


@pytest.mark.django_db
class TestMetadataModels:
    """Tests para metadata y campos comunes de los modelos."""

    def test_db_table_names(self):
        """Test: Nombres de tablas en base de datos."""
        assert VistaDashboard._meta.db_table == 'analytics_vista_dashboard'
        assert WidgetDashboard._meta.db_table == 'analytics_widget_dashboard'
        assert FavoritoDashboard._meta.db_table == 'analytics_favorito_dashboard'

    def test_verbose_names(self):
        """Test: Nombres verbose de modelos."""
        assert VistaDashboard._meta.verbose_name == 'Vista de Dashboard'
        assert VistaDashboard._meta.verbose_name_plural == 'Vistas de Dashboard'
        assert WidgetDashboard._meta.verbose_name == 'Widget de Dashboard'
        assert FavoritoDashboard._meta.verbose_name == 'Dashboard Favorito'

    def test_ordering(self):
        """Test: Ordenamiento de modelos."""
        assert VistaDashboard._meta.ordering == ['orden', 'nombre']
        assert WidgetDashboard._meta.ordering == ['vista', 'orden']
        assert FavoritoDashboard._meta.ordering == ['-es_default', '-fecha_agregado']
