"""
Fixtures compartidos para tests de Gestión de Transporte
=========================================================

Proporciona fixtures reutilizables para:
- Catálogos dinámicos (TipoRuta, EstadoDespacho)
- Rutas y Conductores
- Programaciones de Ruta
- Despachos y Detalles
- Manifiestos

Autor: Sistema ERP StrateKaz
Fecha: 28 Diciembre 2025
"""
import pytest
from datetime import date, timedelta, time
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.gestion_estrategica.configuracion.models import EmpresaConfig, SedeEmpresa
from apps.logistics_fleet.gestion_flota.models import Vehiculo, TipoVehiculo, EstadoVehiculo
from apps.logistics_fleet.gestion_transporte.models import (
    TipoRuta,
    EstadoDespacho,
    Ruta,
    Conductor,
    ProgramacionRuta,
    Despacho,
    DetalleDespacho,
    Manifiesto,
)

User = get_user_model()


# ==============================================================================
# FIXTURES DE EMPRESA Y USUARIOS
# ==============================================================================

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
def usuario(db, empresa):
    """Usuario de prueba."""
    user = User.objects.create_user(
        username='testuser_transporte',
        email='test.transporte@ghn.com',
        password='testpass123',
        first_name='Test',
        last_name='Transporte',
        is_active=True
    )
    user.empresa = empresa
    user.save()
    return user


# ==============================================================================
# FIXTURES DE CATÁLOGOS
# ==============================================================================

@pytest.fixture
def tipo_ruta_recoleccion(db):
    """Tipo de ruta: Recolección."""
    return TipoRuta.objects.create(
        codigo='RECOLECCION',
        nombre='Recolección',
        descripcion='Ruta de recolección de materia prima',
        es_recoleccion=True,
        es_entrega=False,
        es_transferencia=False,
        requiere_cadena_frio=False,
        orden=1,
        activo=True
    )


@pytest.fixture
def tipo_ruta_entrega(db):
    """Tipo de ruta: Entrega."""
    return TipoRuta.objects.create(
        codigo='ENTREGA',
        nombre='Entrega',
        descripcion='Ruta de entrega/distribución',
        es_recoleccion=False,
        es_entrega=True,
        es_transferencia=False,
        requiere_cadena_frio=True,
        orden=2,
        activo=True
    )


@pytest.fixture
def estado_despacho_programado(db):
    """Estado despacho: Programado."""
    return EstadoDespacho.objects.create(
        codigo='PROGRAMADO',
        nombre='Programado',
        descripcion='Despacho programado',
        color='#3B82F6',
        en_transito=False,
        es_final=False,
        permite_edicion=True,
        orden=1,
        activo=True
    )


@pytest.fixture
def estado_despacho_en_transito(db):
    """Estado despacho: En Tránsito."""
    return EstadoDespacho.objects.create(
        codigo='EN_TRANSITO',
        nombre='En Tránsito',
        descripcion='Despacho en tránsito',
        color='#F59E0B',
        en_transito=True,
        es_final=False,
        permite_edicion=False,
        orden=2,
        activo=True
    )


@pytest.fixture
def estado_despacho_entregado(db):
    """Estado despacho: Entregado."""
    return EstadoDespacho.objects.create(
        codigo='ENTREGADO',
        nombre='Entregado',
        descripcion='Despacho entregado',
        color='#10B981',
        en_transito=False,
        es_final=True,
        permite_edicion=False,
        orden=3,
        activo=True
    )


# ==============================================================================
# FIXTURES DE VEHÍCULOS (para programaciones)
# ==============================================================================

@pytest.fixture
def tipo_vehiculo_camion(db):
    """Tipo de vehículo para tests."""
    return TipoVehiculo.objects.create(
        codigo='CAMION_TEST',
        nombre='Camión Test',
        capacidad_kg=Decimal('3000.00'),
        requiere_licencia_especial=True,
        categoria_licencia='C1',
        orden=1,
        is_active=True
    )


@pytest.fixture
def estado_vehiculo_disponible(db):
    """Estado de vehículo para tests."""
    return EstadoVehiculo.objects.create(
        codigo='DISPONIBLE',
        nombre='Disponible',
        disponible_para_ruta=True,
        orden=1,
        is_active=True
    )


@pytest.fixture
def vehiculo(db, empresa, tipo_vehiculo_camion, estado_vehiculo_disponible, usuario):
    """Vehículo de prueba."""
    return Vehiculo.objects.create(
        empresa=empresa,
        placa='TRN123',
        tipo_vehiculo=tipo_vehiculo_camion,
        estado=estado_vehiculo_disponible,
        marca='Chevrolet',
        modelo='NPR',
        anio=2021,
        capacidad_kg=Decimal('3000.00'),
        km_actual=30000,
        fecha_soat=date.today() + timedelta(days=90),
        fecha_tecnomecanica=date.today() + timedelta(days=120),
        es_propio=True,
        created_by=usuario
    )


# ==============================================================================
# FIXTURES DE RUTAS
# ==============================================================================

@pytest.fixture
def ruta(db, empresa, tipo_ruta_entrega, usuario):
    """Ruta de prueba."""
    return Ruta.objects.create(
        empresa=empresa,
        codigo='RUT-001',
        nombre='Ruta Bogotá - Soacha',
        descripcion='Ruta de entrega a Soacha',
        tipo_ruta=tipo_ruta_entrega,
        origen_nombre='Planta Principal',
        origen_direccion='Calle 123 # 45-67',
        origen_ciudad='Bogotá',
        destino_nombre='Cliente Soacha',
        destino_direccion='Carrera 10 # 20-30',
        destino_ciudad='Soacha',
        distancia_km=Decimal('25.50'),
        tiempo_estimado_minutos=60,
        costo_estimado=Decimal('85000.00'),
        peajes_estimados=Decimal('15000.00'),
        puntos_intermedios=[],
        is_active=True,
        created_by=usuario
    )


# ==============================================================================
# FIXTURES DE CONDUCTORES
# ==============================================================================

@pytest.fixture
def conductor(db, empresa, usuario):
    """Conductor de prueba."""
    return Conductor.objects.create(
        empresa=empresa,
        nombre_completo='Juan Pérez Conductor',
        tipo_documento='CC',
        documento_identidad='1234567890',
        telefono='3101234567',
        email='conductor@test.com',
        licencia_conduccion='C1-12345678',
        categoria_licencia='C1',
        fecha_vencimiento_licencia=date.today() + timedelta(days=365),
        fecha_ingreso=date.today() - timedelta(days=730),
        es_empleado=True,
        is_active=True,
        created_by=usuario
    )


@pytest.fixture
def conductor_tercero(db, empresa, usuario):
    """Conductor tercero de prueba."""
    return Conductor.objects.create(
        empresa=empresa,
        nombre_completo='Carlos Gómez',
        tipo_documento='CC',
        documento_identidad='9876543210',
        telefono='3209876543',
        licencia_conduccion='C1-87654321',
        categoria_licencia='C1',
        fecha_vencimiento_licencia=date.today() + timedelta(days=200),
        fecha_ingreso=date.today() - timedelta(days=180),
        es_empleado=False,
        empresa_transportadora='Transportes XYZ S.A.S.',
        is_active=True,
        created_by=usuario
    )


# ==============================================================================
# FIXTURES DE PROGRAMACIONES
# ==============================================================================

@pytest.fixture
def programacion_ruta(db, empresa, ruta, vehiculo, conductor, usuario):
    """Programación de ruta de prueba."""
    return ProgramacionRuta.objects.create(
        empresa=empresa,
        ruta=ruta,
        vehiculo=vehiculo,
        conductor=conductor,
        fecha_programada=date.today(),
        hora_salida_programada=time(8, 0),
        hora_llegada_estimada=time(10, 0),
        estado='PROGRAMADA',
        programado_por=usuario,
        is_active=True,
        created_by=usuario
    )


@pytest.fixture
def programacion_en_curso(db, empresa, ruta, vehiculo, conductor, usuario):
    """Programación en curso."""
    return ProgramacionRuta.objects.create(
        empresa=empresa,
        ruta=ruta,
        vehiculo=vehiculo,
        conductor=conductor,
        fecha_programada=date.today(),
        hora_salida_programada=time(6, 0),
        hora_llegada_estimada=time(8, 0),
        estado='EN_CURSO',
        km_inicial=Decimal('30000.00'),
        hora_salida_real=timezone.now() - timedelta(hours=2),
        programado_por=usuario,
        is_active=True,
        created_by=usuario
    )


# ==============================================================================
# FIXTURES DE DESPACHOS
# ==============================================================================

@pytest.fixture
def despacho(db, empresa, programacion_ruta, estado_despacho_programado, usuario):
    """Despacho de prueba."""
    return Despacho.objects.create(
        empresa=empresa,
        programacion_ruta=programacion_ruta,
        estado_despacho=estado_despacho_programado,
        cliente_nombre='Carnicería El Buen Sabor',
        cliente_direccion='Calle 50 # 30-20',
        cliente_telefono='3151234567',
        cliente_contacto='María López',
        peso_total_kg=Decimal('150.50'),
        volumen_total_m3=Decimal('2.50'),
        valor_declarado=Decimal('2500000.00'),
        requiere_cadena_frio=True,
        temperatura_requerida='-2°C a 4°C',
        fecha_entrega_estimada=timezone.now() + timedelta(hours=3),
        observaciones_entrega='Entregar en horas de la mañana',
        is_active=True,
        created_by=usuario
    )


@pytest.fixture
def detalle_despacho(db, empresa, despacho, usuario):
    """Detalle de despacho de prueba."""
    return DetalleDespacho.objects.create(
        empresa=empresa,
        despacho=despacho,
        descripcion_producto='Grasa Industrial Premium',
        codigo_producto='GIP-001',
        cantidad=Decimal('100.00'),
        unidad_medida='kg',
        peso_kg=Decimal('100.00'),
        lote_origen='LOT-2025-001',
        is_active=True,
        created_by=usuario
    )


# ==============================================================================
# FIXTURES DE MANIFIESTOS
# ==============================================================================

@pytest.fixture
def manifiesto(db, empresa, programacion_ruta, usuario):
    """Manifiesto de carga de prueba."""
    return Manifiesto.objects.create(
        empresa=empresa,
        programacion_ruta=programacion_ruta,
        fecha_expedicion=timezone.now(),
        remitente_nombre='Grasas y Huesos del Norte S.A.S.',
        remitente_nit='900123456-1',
        remitente_direccion='Calle 123 # 45-67',
        destinatario_nombre='Carnicería El Buen Sabor',
        destinatario_nit='900987654-2',
        destinatario_direccion='Calle 50 # 30-20',
        origen_ciudad='Bogotá',
        destino_ciudad='Soacha',
        descripcion_carga='Grasa industrial premium',
        peso_kg=Decimal('150.50'),
        unidades=3,
        valor_flete=Decimal('85000.00'),
        valor_declarado=Decimal('2500000.00'),
        vehiculo_placa=programacion_ruta.vehiculo.placa,
        vehiculo_tipo=programacion_ruta.vehiculo.tipo_vehiculo.nombre,
        conductor_nombre=programacion_ruta.conductor.nombre_completo,
        conductor_documento=programacion_ruta.conductor.documento_identidad,
        generado_por=usuario,
        is_active=True,
        created_by=usuario
    )


# ==============================================================================
# FIXTURES PARA API TESTING
# ==============================================================================

@pytest.fixture
def api_client():
    """Cliente API de prueba."""
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def authenticated_client(api_client, usuario):
    """Cliente API autenticado."""
    api_client.force_authenticate(user=usuario)
    return api_client
