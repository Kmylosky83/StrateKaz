"""
Fixtures para tests de Riesgos de Procesos
==========================================

Fixtures compartidas para tests de modelos y views.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.motor_riesgos.riesgos_procesos.models import (
    CategoriaRiesgo,
    RiesgoProceso,
    TratamientoRiesgo,
    ControlOperacional,
    Oportunidad
)

User = get_user_model()


@pytest.fixture
def api_client():
    """Cliente API sin autenticar."""
    return APIClient()


@pytest.fixture
def usuario(db):
    """Usuario de prueba."""
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )


@pytest.fixture
def usuario_admin(db):
    """Usuario administrador de prueba."""
    return User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='adminpass123'
    )


@pytest.fixture
def authenticated_client(api_client, usuario):
    """Cliente API autenticado."""
    api_client.force_authenticate(user=usuario)
    return api_client


@pytest.fixture
def empresa(db):
    """Empresa de prueba."""
    from apps.gestion_estrategica.configuracion.models import EmpresaConfig
    empresa, _ = EmpresaConfig.objects.get_or_create(
        defaults={
            'nombre': 'Empresa Test',
            'nit': '900123456-1',
            'razon_social': 'Empresa Test S.A.S.',
        }
    )
    return empresa


@pytest.fixture
def categoria_riesgo(db):
    """Categoria de riesgo de prueba."""
    return CategoriaRiesgo.objects.create(
        codigo='EST',
        nombre='Estrategico',
        descripcion='Riesgos estrategicos de la organizacion',
        color='#EF4444',
        orden=1
    )


@pytest.fixture
def categoria_riesgo_operativo(db):
    """Categoria de riesgo operativo."""
    return CategoriaRiesgo.objects.create(
        codigo='OPE',
        nombre='Operativo',
        descripcion='Riesgos operativos',
        color='#F59E0B',
        orden=2
    )


@pytest.fixture
def riesgo_proceso(db, empresa, categoria_riesgo, usuario):
    """Riesgo de proceso de prueba."""
    return RiesgoProceso.objects.create(
        empresa=empresa,
        codigo='R-001',
        nombre='Riesgo de prueba',
        descripcion='Descripcion del riesgo de prueba',
        tipo='estrategico',
        categoria=categoria_riesgo,
        proceso='Proceso de ventas',
        causa_raiz='Falta de controles',
        consecuencia='Perdida economica',
        probabilidad_inherente=4,
        impacto_inherente=5,
        probabilidad_residual=2,
        impacto_residual=3,
        responsable=usuario,
        estado='identificado'
    )


@pytest.fixture
def riesgo_critico(db, empresa, categoria_riesgo, usuario):
    """Riesgo critico (nivel alto) de prueba."""
    return RiesgoProceso.objects.create(
        empresa=empresa,
        codigo='R-002',
        nombre='Riesgo critico',
        descripcion='Riesgo de alta severidad',
        tipo='operativo',
        categoria=categoria_riesgo,
        proceso='Proceso de produccion',
        causa_raiz='Falla de equipos',
        consecuencia='Paro de produccion',
        probabilidad_inherente=5,
        impacto_inherente=5,
        probabilidad_residual=4,
        impacto_residual=4,
        responsable=usuario,
        estado='en_tratamiento'
    )


@pytest.fixture
def tratamiento_riesgo(db, empresa, riesgo_proceso, usuario):
    """Tratamiento de riesgo de prueba."""
    return TratamientoRiesgo.objects.create(
        empresa=empresa,
        riesgo=riesgo_proceso,
        tipo='mitigar',
        descripcion='Plan de mitigacion',
        control_propuesto='Implementar control automatico',
        responsable=usuario,
        estado='pendiente'
    )


@pytest.fixture
def control_operacional(db, empresa, riesgo_proceso, usuario):
    """Control operacional de prueba."""
    return ControlOperacional.objects.create(
        empresa=empresa,
        riesgo=riesgo_proceso,
        nombre='Control preventivo',
        descripcion='Control para prevenir el riesgo',
        tipo_control='preventivo',
        frecuencia='Diaria',
        responsable=usuario,
        efectividad='Alta'
    )


@pytest.fixture
def oportunidad(db, empresa, usuario):
    """Oportunidad de prueba."""
    return Oportunidad.objects.create(
        empresa=empresa,
        codigo='O-001',
        nombre='Oportunidad de mercado',
        descripcion='Nueva oportunidad de negocio',
        fuente='Mercado',
        impacto_potencial='Alto',
        viabilidad='Alta',
        recursos_requeridos='Inversion inicial',
        responsable=usuario,
        estado='identificada'
    )
