"""
Fixtures compartidas para tests de Motor de Cumplimiento

Este archivo contiene fixtures reutilizables para todos los tests
del modulo motor_cumplimiento.
"""
import pytest
from decimal import Decimal
from datetime import date, timedelta
from django.contrib.auth import get_user_model

from apps.gestion_estrategica.configuracion.models import EmpresaConfig

User = get_user_model()


@pytest.fixture
def user(db):
    """Usuario de prueba basico."""
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User',
        is_active=True
    )


@pytest.fixture
def admin_user(db):
    """Usuario administrador de prueba."""
    return User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='adminpass123',
        first_name='Admin',
        last_name='User'
    )


@pytest.fixture
def responsable_user(db):
    """Usuario responsable de cumplimiento."""
    return User.objects.create_user(
        username='responsable',
        email='responsable@example.com',
        password='testpass123',
        first_name='Responsable',
        last_name='Cumplimiento',
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
def empresa_secundaria(db):
    """Segunda empresa para tests de multi-tenancy."""
    return EmpresaConfig.objects.create(
        nombre='Empresa Secundaria',
        nit='900987654-2',
        razon_social='Empresa Secundaria S.A.S.',
        nombre_comercial='ES',
        email='info@es.com',
        telefono='3009876543',
        direccion='Avenida 45 # 67-89',
        ciudad='Medellin',
        departamento='Antioquia',
        pais='Colombia'
    )


@pytest.fixture
def api_client():
    """Cliente API de prueba."""
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def authenticated_client(api_client, user):
    """Cliente API autenticado con usuario basico."""
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    """Cliente API autenticado con usuario admin."""
    api_client.force_authenticate(user=admin_user)
    return api_client
