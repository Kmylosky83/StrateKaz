"""
Fixtures para tests de Analytics - Dashboard Gerencial

Proporciona fixtures reutilizables para:
- VistaDashboard con diferentes perspectivas BSC
- WidgetDashboard con configuración grid
- FavoritoDashboard con dashboard default
- Fixtures compartidas de empresa y usuarios
"""
import pytest
from datetime import date
from decimal import Decimal
from django.contrib.auth import get_user_model

from apps.gestion_estrategica.configuracion.models import EmpresaConfig
from apps.analytics.config_indicadores.models import CatalogoKPI
from apps.analytics.dashboard_gerencial.models import (
    VistaDashboard,
    WidgetDashboard,
    FavoritoDashboard
)

User = get_user_model()


@pytest.fixture
def usuario(db):
    """Usuario de prueba basico."""
    return User.objects.create_user(
        username='testuser_dashboard',
        email='test@dashboard.com',
        password='testpass123',
        first_name='Test',
        last_name='Dashboard',
        is_active=True
    )


@pytest.fixture
def otro_usuario(db):
    """Otro usuario para tests de favoritos."""
    return User.objects.create_user(
        username='otrouser',
        email='otro@dashboard.com',
        password='testpass123',
        first_name='Otro',
        last_name='Usuario',
        is_active=True
    )


@pytest.fixture
def empresa(db):
    """Empresa de prueba."""
    return EmpresaConfig.objects.create(
        nombre='StrateKaz',
        nit='900123456-1',
        razon_social='StrateKaz.',
        nombre_comercial='GHN',
        email='info@ghn.com',
        telefono='3001234567',
        direccion='Calle 123 # 45-67',
        ciudad='Bogota',
        departamento='Cundinamarca',
        pais='Colombia'
    )


@pytest.fixture
def rol(db, empresa):
    """Rol de prueba."""
    from apps.core.models import Rol
    return Rol.objects.create(
        empresa_id=empresa.id,
        codigo='ROL-GERENTE',
        nombre='Gerente General',
        descripcion='Acceso completo a dashboards'
    )


@pytest.fixture
def vista_dashboard_financiera(db, empresa):
    """Vista de dashboard financiera."""
    return VistaDashboard.objects.create(
        empresa_id=empresa.id,
        codigo='DASH-FIN-001',
        nombre='Dashboard Financiero',
        descripcion='Indicadores financieros clave',
        perspectiva_bsc='financiera',
        es_publica=True,
        orden=1
    )


@pytest.fixture
def vista_dashboard_procesos(db, empresa):
    """Vista de dashboard de procesos."""
    return VistaDashboard.objects.create(
        empresa_id=empresa.id,
        codigo='DASH-PROC-001',
        nombre='Dashboard de Procesos',
        descripcion='Indicadores de procesos internos',
        perspectiva_bsc='procesos',
        es_publica=True,
        orden=2
    )


@pytest.fixture
def vista_dashboard_restringida(db, empresa, rol):
    """Vista de dashboard restringida por rol."""
    vista = VistaDashboard.objects.create(
        empresa_id=empresa.id,
        codigo='DASH-REST-001',
        nombre='Dashboard Restringido',
        descripcion='Solo para gerencia',
        perspectiva_bsc='general',
        es_publica=False,
        orden=3
    )
    vista.roles_permitidos.add(rol)
    return vista


@pytest.fixture
def kpi_financiero(db, empresa):
    """KPI financiero para widgets."""
    return CatalogoKPI.objects.create(
        empresa_id=empresa.id,
        codigo='KPI-FIN-001',
        nombre='Margen Bruto',
        descripcion='Margen de utilidad bruta',
        tipo_indicador='eficiencia',
        categoria='financiero',
        frecuencia_medicion='mensual',
        unidad_medida='%',
        es_mayor_mejor=True
    )


@pytest.fixture
def widget_kpi_card(db, empresa, vista_dashboard_financiera, kpi_financiero):
    """Widget tipo KPI card."""
    widget = WidgetDashboard.objects.create(
        empresa_id=empresa.id,
        vista=vista_dashboard_financiera,
        tipo_widget='kpi_card',
        titulo='Margen Bruto',
        configuracion={'color': 'blue', 'icono': 'dollar'},
        posicion_x=0,
        posicion_y=0,
        ancho=4,
        alto=1,
        orden=1
    )
    widget.kpis.add(kpi_financiero)
    return widget


@pytest.fixture
def widget_grafico_linea(db, empresa, vista_dashboard_financiera, kpi_financiero):
    """Widget tipo gráfico de línea."""
    widget = WidgetDashboard.objects.create(
        empresa_id=empresa.id,
        vista=vista_dashboard_financiera,
        tipo_widget='grafico_linea',
        titulo='Tendencia Mensual',
        configuracion={'periodo': '12 meses', 'interpolacion': 'linear'},
        posicion_x=4,
        posicion_y=0,
        ancho=8,
        alto=2,
        orden=2
    )
    widget.kpis.add(kpi_financiero)
    return widget


@pytest.fixture
def favorito_dashboard(db, usuario, vista_dashboard_financiera):
    """Dashboard favorito de usuario."""
    return FavoritoDashboard.objects.create(
        usuario=usuario,
        vista=vista_dashboard_financiera,
        es_default=False
    )


@pytest.fixture
def favorito_default(db, usuario, vista_dashboard_procesos):
    """Dashboard favorito marcado como default."""
    return FavoritoDashboard.objects.create(
        usuario=usuario,
        vista=vista_dashboard_procesos,
        es_default=True
    )


@pytest.fixture
def api_client(usuario):
    """API Client autenticado."""
    from rest_framework.test import APIClient
    client = APIClient()
    client.force_authenticate(user=usuario)
    return client
