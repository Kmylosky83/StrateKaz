"""
Fixtures para tests de Analytics - Config Indicadores.

Las fixtures base (user, admin_user, empresa, api_client,
authenticated_client, admin_client) se heredan del root conftest.py.
"""
import pytest
from datetime import date
from decimal import Decimal

from apps.analytics.config_indicadores.models import (
    CatalogoKPI,
    FichaTecnicaKPI,
    MetaKPI,
    ConfiguracionSemaforo
)


@pytest.fixture
def responsable(db):
    """Usuario responsable de KPIs."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    return User.objects.create_user(
        username='responsable_kpi',
        email='responsable@analytics.com',
        password='testpass123',
        first_name='Responsable',
        last_name='KPI',
        is_active=True
    )


@pytest.fixture
def cargo_medicion(db):
    """Cargo responsable de medicion."""
    from apps.core.models import Cargo
    return Cargo.objects.create(
        code='CARGO-MED-001',
        name='Analista de Calidad',
        nivel_jerarquico='OPERATIVO',
    )


@pytest.fixture
def cargo_analisis(db):
    """Cargo responsable de analisis."""
    from apps.core.models import Cargo
    return Cargo.objects.create(
        code='CARGO-ANA-001',
        name='Jefe de Calidad',
        nivel_jerarquico='TACTICO',
    )


@pytest.fixture
def catalogo_kpi(db, empresa):
    """KPI basico de SST."""
    return CatalogoKPI.objects.create(
        empresa_id=empresa.id,
        codigo='KPI-SST-001',
        nombre='Indice de Frecuencia de Accidentes',
        descripcion='Numero de accidentes por millon de horas trabajadas',
        tipo_indicador='eficacia',
        categoria='sst',
        frecuencia_medicion='mensual',
        unidad_medida='accidentes/M HHT',
        es_mayor_mejor=False
    )


@pytest.fixture
def catalogo_kpi_financiero(db, empresa):
    """KPI financiero."""
    return CatalogoKPI.objects.create(
        empresa_id=empresa.id,
        codigo='KPI-FIN-001',
        nombre='Margen de Utilidad Bruta',
        descripcion='Porcentaje de utilidad sobre ventas',
        tipo_indicador='eficiencia',
        categoria='financiero',
        frecuencia_medicion='mensual',
        unidad_medida='%',
        es_mayor_mejor=True
    )


@pytest.fixture
def catalogo_kpi_calidad(db, empresa):
    """KPI de calidad."""
    return CatalogoKPI.objects.create(
        empresa_id=empresa.id,
        codigo='KPI-CAL-001',
        nombre='Tasa de No Conformidades',
        descripcion='Numero de NC por 1000 productos',
        tipo_indicador='eficacia',
        categoria='calidad',
        frecuencia_medicion='mensual',
        unidad_medida='NC/1000 prod',
        es_mayor_mejor=False
    )


@pytest.fixture
def ficha_tecnica(db, empresa, catalogo_kpi, cargo_medicion, cargo_analisis):
    """Ficha tecnica completa de KPI."""
    return FichaTecnicaKPI.objects.create(
        empresa_id=empresa.id,
        kpi=catalogo_kpi,
        objetivo='Monitorear la accidentalidad y reducir lesiones',
        formula='(Numero de accidentes * 1,000,000) / Total HH trabajadas',
        variables={
            'numero_accidentes': 'Total de accidentes con incapacidad en el periodo',
            'total_hh': 'Total de horas hombre trabajadas en el periodo'
        },
        fuente_datos='Sistema de gestion de SST, registros de nomina',
        responsable_medicion=cargo_medicion,
        responsable_analisis=cargo_analisis,
        fecha_inicio_medicion=date(2025, 1, 1),
        notas='Incluye solo accidentes con incapacidad'
    )


@pytest.fixture
def meta_kpi(db, empresa, catalogo_kpi):
    """Meta de KPI para el ano."""
    return MetaKPI.objects.create(
        empresa_id=empresa.id,
        kpi=catalogo_kpi,
        periodo_inicio=date(2025, 1, 1),
        periodo_fin=date(2025, 12, 31),
        valor_meta=Decimal('5.0'),
        valor_minimo_aceptable=Decimal('10.0'),
        valor_satisfactorio=Decimal('5.0'),
        valor_sobresaliente=Decimal('2.0')
    )


@pytest.fixture
def semaforo_config(db, empresa, catalogo_kpi):
    """Configuracion de semaforo para KPI."""
    return ConfiguracionSemaforo.objects.create(
        empresa_id=empresa.id,
        kpi=catalogo_kpi,
        umbral_verde_min=Decimal('0'),
        umbral_verde_max=Decimal('5.0'),
        umbral_amarillo_min=Decimal('5.01'),
        umbral_amarillo_max=Decimal('10.0'),
        umbral_rojo_min=Decimal('10.01'),
        umbral_rojo_max=None
    )


@pytest.fixture
def semaforo_config_financiero(db, empresa, catalogo_kpi_financiero):
    """Configuracion de semaforo para KPI financiero (mayor es mejor)."""
    return ConfiguracionSemaforo.objects.create(
        empresa_id=empresa.id,
        kpi=catalogo_kpi_financiero,
        umbral_verde_min=Decimal('30.0'),
        umbral_verde_max=None,
        umbral_amarillo_min=Decimal('20.0'),
        umbral_amarillo_max=Decimal('29.99'),
        umbral_rojo_min=Decimal('0'),
        umbral_rojo_max=Decimal('19.99')
    )
