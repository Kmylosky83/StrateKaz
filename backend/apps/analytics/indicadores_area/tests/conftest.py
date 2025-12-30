"""
Fixtures para tests de Analytics - Indicadores Área

Proporciona fixtures reutilizables para:
- ValorKPI con diferentes semáforos
- AccionPorKPI vinculada a valores críticos
- AlertaKPI con diferentes tipos
- Fixtures compartidas de empresa, usuarios y KPIs
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.gestion_estrategica.configuracion.models import EmpresaConfig
from apps.analytics.config_indicadores.models import CatalogoKPI, ConfiguracionSemaforo, MetaKPI
from apps.analytics.indicadores_area.models import (
    ValorKPI,
    AccionPorKPI,
    AlertaKPI
)

User = get_user_model()


@pytest.fixture
def usuario(db):
    """Usuario de prueba basico."""
    return User.objects.create_user(
        username='testuser_valores',
        email='test@valores.com',
        password='testpass123',
        first_name='Test',
        last_name='Valores',
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
def colaborador(db, empresa, usuario):
    """Colaborador responsable de acciones."""
    from apps.talent_hub.colaboradores.models import Colaborador
    return Colaborador.objects.create(
        empresa_id=empresa.id,
        numero_identificacion='1234567890',
        tipo_identificacion='CC',
        primer_nombre='Juan',
        primer_apellido='Pérez',
        email='juan.perez@ghn.com',
        telefono='3001234567',
        estado='activo',
        fecha_ingreso=date.today() - timedelta(days=365)
    )


@pytest.fixture
def kpi_sst(db, empresa):
    """KPI de SST."""
    return CatalogoKPI.objects.create(
        empresa_id=empresa.id,
        codigo='KPI-SST-001',
        nombre='Índice de Frecuencia de Accidentes',
        descripcion='Número de accidentes por millón de horas',
        tipo_indicador='eficacia',
        categoria='sst',
        frecuencia_medicion='mensual',
        unidad_medida='accidentes/M HHT',
        es_mayor_mejor=False
    )


@pytest.fixture
def kpi_financiero(db, empresa):
    """KPI financiero."""
    return CatalogoKPI.objects.create(
        empresa_id=empresa.id,
        codigo='KPI-FIN-001',
        nombre='Margen de Utilidad',
        descripcion='Porcentaje de margen de utilidad',
        tipo_indicador='eficiencia',
        categoria='financiero',
        frecuencia_medicion='mensual',
        unidad_medida='%',
        es_mayor_mejor=True
    )


@pytest.fixture
def semaforo_sst(db, empresa, kpi_sst):
    """Configuración de semáforo para KPI SST."""
    return ConfiguracionSemaforo.objects.create(
        empresa_id=empresa.id,
        kpi=kpi_sst,
        umbral_verde_min=Decimal('0'),
        umbral_verde_max=Decimal('5.0'),
        umbral_amarillo_min=Decimal('5.01'),
        umbral_amarillo_max=Decimal('10.0'),
        umbral_rojo_min=Decimal('10.01'),
        umbral_rojo_max=None
    )


@pytest.fixture
def meta_sst(db, empresa, kpi_sst):
    """Meta para KPI SST."""
    return MetaKPI.objects.create(
        empresa_id=empresa.id,
        kpi=kpi_sst,
        periodo_inicio=date(2025, 1, 1),
        periodo_fin=date(2025, 12, 31),
        valor_meta=Decimal('5.0'),
        valor_minimo_aceptable=Decimal('10.0'),
        valor_satisfactorio=Decimal('5.0'),
        valor_sobresaliente=Decimal('2.0')
    )


@pytest.fixture
def valor_kpi_verde(db, empresa, kpi_sst, usuario, semaforo_sst):
    """Valor de KPI en semáforo verde."""
    return ValorKPI.objects.create(
        empresa_id=empresa.id,
        kpi=kpi_sst,
        fecha_medicion=date.today(),
        periodo='2025-12',
        valor=Decimal('3.5'),
        valor_meta=Decimal('5.0'),
        semaforo='verde',
        observaciones='Valor dentro del rango óptimo',
        registrado_por=usuario
    )


@pytest.fixture
def valor_kpi_amarillo(db, empresa, kpi_sst, usuario, semaforo_sst):
    """Valor de KPI en semáforo amarillo."""
    return ValorKPI.objects.create(
        empresa_id=empresa.id,
        kpi=kpi_sst,
        fecha_medicion=date.today() - timedelta(days=30),
        periodo='2025-11',
        valor=Decimal('7.5'),
        valor_meta=Decimal('5.0'),
        semaforo='amarillo',
        observaciones='Valor en alerta',
        registrado_por=usuario
    )


@pytest.fixture
def valor_kpi_rojo(db, empresa, kpi_sst, usuario, semaforo_sst):
    """Valor de KPI en semáforo rojo."""
    return ValorKPI.objects.create(
        empresa_id=empresa.id,
        kpi=kpi_sst,
        fecha_medicion=date.today() - timedelta(days=60),
        periodo='2025-10',
        valor=Decimal('15.0'),
        valor_meta=Decimal('5.0'),
        semaforo='rojo',
        observaciones='Valor crítico - requiere acción inmediata',
        registrado_por=usuario
    )


@pytest.fixture
def accion_por_kpi(db, empresa, valor_kpi_rojo, colaborador):
    """Acción generada por KPI en rojo."""
    return AccionPorKPI.objects.create(
        empresa_id=empresa.id,
        valor_kpi=valor_kpi_rojo,
        tipo_accion='accion_correctiva',
        descripcion='Implementar medidas de prevención de accidentes',
        responsable=colaborador,
        fecha_compromiso=date.today() + timedelta(days=30),
        estado='pendiente'
    )


@pytest.fixture
def accion_completada(db, empresa, valor_kpi_rojo, colaborador):
    """Acción completada."""
    return AccionPorKPI.objects.create(
        empresa_id=empresa.id,
        valor_kpi=valor_kpi_rojo,
        tipo_accion='plan_mejora',
        descripcion='Capacitación en seguridad',
        responsable=colaborador,
        fecha_compromiso=date.today() - timedelta(days=5),
        fecha_cierre=date.today() - timedelta(days=2),
        estado='completada',
        efectividad='Capacitación efectiva, mejora observada'
    )


@pytest.fixture
def alerta_umbral_rojo(db, empresa, kpi_sst):
    """Alerta de umbral rojo."""
    return AlertaKPI.objects.create(
        empresa_id=empresa.id,
        kpi=kpi_sst,
        tipo_alerta='umbral_rojo',
        mensaje='KPI de accidentalidad ha superado el umbral crítico',
        esta_leida=False
    )


@pytest.fixture
def alerta_sin_medicion(db, empresa, kpi_sst):
    """Alerta de sin medición."""
    return AlertaKPI.objects.create(
        empresa_id=empresa.id,
        kpi=kpi_sst,
        tipo_alerta='sin_medicion',
        mensaje='No se ha registrado medición del KPI en el período actual',
        esta_leida=False
    )


@pytest.fixture
def alerta_leida(db, empresa, kpi_sst, usuario):
    """Alerta marcada como leída."""
    alerta = AlertaKPI.objects.create(
        empresa_id=empresa.id,
        kpi=kpi_sst,
        tipo_alerta='meta_no_cumplida',
        mensaje='Meta mensual no alcanzada',
        esta_leida=True,
        leida_por=usuario,
        fecha_lectura=timezone.now()
    )
    return alerta


@pytest.fixture
def api_client(usuario):
    """API Client autenticado."""
    from rest_framework.test import APIClient
    client = APIClient()
    client.force_authenticate(user=usuario)
    return client
