"""
Fixtures para tests de Analytics - Config Indicadores

Proporciona fixtures reutilizables para:
- CatalogoKPI con diferentes configuraciones
- FichaTecnicaKPI completa
- MetaKPI con diferentes rangos
- ConfiguracionSemaforo con umbrales
- Fixtures compartidas de empresa y usuarios
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.gestion_estrategica.configuracion.models import EmpresaConfig
from apps.analytics.config_indicadores.models import (
    CatalogoKPI,
    FichaTecnicaKPI,
    MetaKPI,
    ConfiguracionSemaforo
)

User = get_user_model()


@pytest.fixture
def usuario(db):
    """Usuario de prueba basico."""
    return User.objects.create_user(
        username='testuser_analytics',
        email='test@analytics.com',
        password='testpass123',
        first_name='Test',
        last_name='Analytics',
        is_active=True
    )


@pytest.fixture
def responsable(db):
    """Usuario responsable de KPIs."""
    return User.objects.create_user(
        username='responsable_kpi',
        email='responsable@analytics.com',
        password='testpass123',
        first_name='Responsable',
        last_name='KPI',
        is_active=True
    )


@pytest.fixture
def empresa(db):
    """Empresa de prueba."""
    return EmpresaConfig.objects.create(
        nombre='Grasas y Huesos del Norte',
        nit='900123456-1',
        razon_social='Grasas y Huesos del Norte S.A.S.',
        nombre_comercial='GHN',
        email='info@ghn.com',
        telefono='3001234567',
        direccion='Calle 123 # 45-67',
        ciudad='Bogota',
        departamento='Cundinamarca',
        pais='Colombia'
    )


@pytest.fixture
def cargo_medicion(db, empresa):
    """Cargo responsable de medición."""
    from apps.talent_hub.estructura_cargos.models import Cargo
    return Cargo.objects.create(
        empresa_id=empresa.id,
        codigo='CARGO-MED-001',
        nombre='Analista de Calidad',
        nivel_jerarquico=3,
        tipo_cargo='operativo'
    )


@pytest.fixture
def cargo_analisis(db, empresa):
    """Cargo responsable de análisis."""
    from apps.talent_hub.estructura_cargos.models import Cargo
    return Cargo.objects.create(
        empresa_id=empresa.id,
        codigo='CARGO-ANA-001',
        nombre='Jefe de Calidad',
        nivel_jerarquico=2,
        tipo_cargo='jefatura'
    )


@pytest.fixture
def catalogo_kpi(db, empresa):
    """KPI básico de SST."""
    return CatalogoKPI.objects.create(
        empresa_id=empresa.id,
        codigo='KPI-SST-001',
        nombre='Índice de Frecuencia de Accidentes',
        descripcion='Número de accidentes por millón de horas trabajadas',
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
        descripcion='Número de NC por 1000 productos',
        tipo_indicador='eficacia',
        categoria='calidad',
        frecuencia_medicion='mensual',
        unidad_medida='NC/1000 prod',
        es_mayor_mejor=False
    )


@pytest.fixture
def ficha_tecnica(db, empresa, catalogo_kpi, cargo_medicion, cargo_analisis):
    """Ficha técnica completa de KPI."""
    return FichaTecnicaKPI.objects.create(
        empresa_id=empresa.id,
        kpi=catalogo_kpi,
        objetivo='Monitorear la accidentalidad y reducir lesiones',
        formula='(Número de accidentes * 1,000,000) / Total HH trabajadas',
        variables={
            'numero_accidentes': 'Total de accidentes con incapacidad en el período',
            'total_hh': 'Total de horas hombre trabajadas en el período'
        },
        fuente_datos='Sistema de gestión de SST, registros de nómina',
        responsable_medicion=cargo_medicion,
        responsable_analisis=cargo_analisis,
        fecha_inicio_medicion=date(2025, 1, 1),
        notas='Incluye solo accidentes con incapacidad'
    )


@pytest.fixture
def meta_kpi(db, empresa, catalogo_kpi):
    """Meta de KPI para el año."""
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
    """Configuración de semáforo para KPI."""
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
    """Configuración de semáforo para KPI financiero (mayor es mejor)."""
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


@pytest.fixture
def api_client(usuario):
    """API Client autenticado."""
    from rest_framework.test import APIClient
    client = APIClient()
    client.force_authenticate(user=usuario)
    return client
