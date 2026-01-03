"""
Tests para views de Servicio al Cliente - Sales CRM
Sistema de Gestión StrateKaz
"""
import pytest
from decimal import Decimal
from datetime import date, timedelta
from rest_framework.test import APIClient
from rest_framework import status

from apps.sales_crm.servicio_cliente.models import (
    TipoPQRS, EstadoPQRS, PrioridadPQRS, CanalRecepcion, PQRS
)
from apps.sales_crm.gestion_clientes.models import Cliente, TipoCliente, EstadoCliente, CanalVenta
from apps.core.models import Usuario
from apps.configuracion.models import EmpresaConfig


@pytest.mark.django_db
class TestPQRSViewSet:
    """Tests para PQRS ViewSet."""

    @pytest.fixture
    def setup_data(self):
        """Setup común para tests de API."""
        empresa = EmpresaConfig.objects.create(
            razon_social='Test Company',
            nit='900123456-7'
        )
        usuario = Usuario.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            empresa=empresa
        )

        tipo_cliente = TipoCliente.objects.create(codigo='EMPRESA', nombre='Empresa', orden=1)
        estado_cliente = EstadoCliente.objects.create(codigo='ACTIVO', nombre='Activo', orden=1)
        canal_venta = CanalVenta.objects.create(codigo='DIRECTO', nombre='Directo', orden=1)

        cliente = Cliente.objects.create(
            empresa=empresa,
            tipo_documento='NIT',
            numero_documento='900111111-1',
            razon_social='Cliente Test',
            tipo_cliente=tipo_cliente,
            estado_cliente=estado_cliente,
            canal_venta=canal_venta,
            created_by=usuario
        )

        tipo_pqrs = TipoPQRS.objects.create(codigo='QUEJA', nombre='Queja', tiempo_respuesta_dias=15, orden=1)
        estado = EstadoPQRS.objects.create(codigo='RECIBIDA', nombre='Recibida', es_inicial=True, orden=1)
        prioridad = PrioridadPQRS.objects.create(codigo='ALTA', nombre='Alta', nivel=3, tiempo_sla_horas=24, orden=1)
        canal = CanalRecepcion.objects.create(codigo='EMAIL', nombre='Email', orden=1)

        client = APIClient()
        client.force_authenticate(user=usuario)

        return {
            'client': client,
            'empresa': empresa,
            'usuario': usuario,
            'cliente': cliente,
            'tipo_pqrs': tipo_pqrs,
            'estado': estado,
            'prioridad': prioridad,
            'canal': canal
        }

    def test_list_pqrs(self, setup_data):
        """Test listar PQRS."""
        data = setup_data

        # Crear algunas PQRS
        for i in range(3):
            PQRS.objects.create(
                empresa=data['empresa'],
                cliente=data['cliente'],
                contacto_nombre=f'Contacto {i}',
                contacto_email=f'contacto{i}@test.com',
                tipo=data['tipo_pqrs'],
                estado=data['estado'],
                prioridad=data['prioridad'],
                canal_recepcion=data['canal'],
                asunto=f'PQRS {i}',
                descripcion=f'Descripción {i}',
                created_by=data['usuario']
            )

        response = data['client'].get('/api/sales-crm/servicio-cliente/pqrs/')

        assert response.status_code == status.HTTP_200_OK
        results = response.data['results'] if 'results' in response.data else response.data
        assert len(results) == 3

    def test_create_pqrs(self, setup_data):
        """Test crear PQRS."""
        data = setup_data

        pqrs_data = {
            'cliente': data['cliente'].id,
            'contacto_nombre': 'Juan Pérez',
            'contacto_email': 'juan@test.com',
            'contacto_telefono': '3001234567',
            'tipo': data['tipo_pqrs'].id,
            'estado': data['estado'].id,
            'prioridad': data['prioridad'].id,
            'canal_recepcion': data['canal'].id,
            'asunto': 'Problema con producto',
            'descripcion': 'El producto llegó defectuoso'
        }

        response = data['client'].post(
            '/api/sales-crm/servicio-cliente/pqrs/',
            pqrs_data,
            format='json'
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['asunto'] == 'Problema con producto'
        assert response.data['codigo'].startswith('PQRS-')

    def test_pqrs_dashboard_metricas(self, setup_data):
        """Test dashboard con métricas de PQRS."""
        data = setup_data

        estado_resuelta = EstadoPQRS.objects.create(
            codigo='RESUELTA',
            nombre='Resuelta',
            es_final=True,
            orden=99
        )

        # Crear PQRS en diferentes estados
        PQRS.objects.create(
            empresa=data['empresa'],
            cliente=data['cliente'],
            contacto_nombre='Contacto 1',
            tipo=data['tipo_pqrs'],
            estado=data['estado'],
            prioridad=data['prioridad'],
            canal_recepcion=data['canal'],
            asunto='PQRS 1',
            descripcion='Desc 1',
            created_by=data['usuario']
        )

        PQRS.objects.create(
            empresa=data['empresa'],
            cliente=data['cliente'],
            contacto_nombre='Contacto 2',
            tipo=data['tipo_pqrs'],
            estado=estado_resuelta,
            prioridad=data['prioridad'],
            canal_recepcion=data['canal'],
            asunto='PQRS 2',
            descripcion='Desc 2',
            created_by=data['usuario']
        )

        response = data['client'].get('/api/sales-crm/servicio-cliente/pqrs/dashboard/')

        assert response.status_code == status.HTTP_200_OK
        assert 'total_pqrs' in response.data
        assert 'por_estado' in response.data
        assert 'por_tipo' in response.data

    def test_multi_tenant_isolation_pqrs(self, setup_data):
        """Test aislamiento multi-tenant en PQRS."""
        data = setup_data

        # Crear otra empresa
        empresa2 = EmpresaConfig.objects.create(
            razon_social='Company 2',
            nit='900987654-3'
        )

        usuario2 = Usuario.objects.create_user(
            username='user2',
            email='user2@test.com',
            password='pass123',
            empresa=empresa2
        )

        # Crear PQRS en empresa 1
        PQRS.objects.create(
            empresa=data['empresa'],
            cliente=data['cliente'],
            contacto_nombre='Contacto E1',
            tipo=data['tipo_pqrs'],
            estado=data['estado'],
            prioridad=data['prioridad'],
            canal_recepcion=data['canal'],
            asunto='PQRS Empresa 1',
            descripcion='Descripción',
            created_by=data['usuario']
        )

        # Crear PQRS en empresa 2
        tipo_cliente2 = TipoCliente.objects.create(codigo='EMPRESA2', nombre='Empresa', orden=1)
        estado_cliente2 = EstadoCliente.objects.create(codigo='ACTIVO2', nombre='Activo', orden=1)
        canal_venta2 = CanalVenta.objects.create(codigo='DIRECTO2', nombre='Directo', orden=1)

        cliente2 = Cliente.objects.create(
            empresa=empresa2,
            tipo_documento='NIT',
            numero_documento='900222222-2',
            razon_social='Cliente E2',
            tipo_cliente=tipo_cliente2,
            estado_cliente=estado_cliente2,
            canal_venta=canal_venta2,
            created_by=usuario2
        )

        PQRS.objects.create(
            empresa=empresa2,
            cliente=cliente2,
            contacto_nombre='Contacto E2',
            tipo=data['tipo_pqrs'],
            estado=data['estado'],
            prioridad=data['prioridad'],
            canal_recepcion=data['canal'],
            asunto='PQRS Empresa 2',
            descripcion='Descripción',
            created_by=usuario2
        )

        # Usuario de empresa 1 solo debe ver PQRS de empresa 1
        response = data['client'].get('/api/sales-crm/servicio-cliente/pqrs/')

        assert response.status_code == status.HTTP_200_OK
        results = response.data['results'] if 'results' in response.data else response.data
        assert len(results) == 1
        assert results[0]['asunto'] == 'PQRS Empresa 1'
