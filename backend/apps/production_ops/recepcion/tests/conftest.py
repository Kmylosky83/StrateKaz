"""
Fixtures compartidos para tests de Recepción de Materia Prima
==============================================================

Proporciona fixtures reutilizables para:
- Catálogos dinámicos (TipoRecepcion, EstadoRecepcion, PuntoRecepcion)
- Recepciones y detalles
- Controles de calidad

Autor: Sistema ERP StrateKaz
Fecha: 28 Diciembre 2025
"""
import pytest
from datetime import date, time, timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.gestion_estrategica.configuracion.models import EmpresaConfig, SedeEmpresa
from apps.supply_chain.gestion_proveedores.models import (
    Proveedor, TipoProveedor, TipoDocumentoIdentidad, TipoMateriaPrima
)
from apps.supply_chain.catalogos.models import Departamento
from apps.production_ops.recepcion.models import (
    TipoRecepcion,
    EstadoRecepcion,
    PuntoRecepcion,
    Recepcion,
    DetalleRecepcion,
    ControlCalidadRecepcion,
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
def usuario(db):
    """Usuario de prueba."""
    return User.objects.create_user(
        username='testuser',
        email='test@ghn.com',
        password='testpass123',
        first_name='Test',
        last_name='User',
        is_active=True
    )


@pytest.fixture
def usuario_calidad(db):
    """Usuario de control de calidad."""
    return User.objects.create_user(
        username='calidad',
        email='calidad@ghn.com',
        password='testpass123',
        first_name='Control',
        last_name='Calidad',
        is_active=True
    )


# ==============================================================================
# FIXTURES DE CATÁLOGOS DINÁMICOS
# ==============================================================================

@pytest.fixture
def tipo_recepcion_hueso(db):
    """Tipo de recepción: Hueso Crudo."""
    return TipoRecepcion.objects.create(
        codigo='RECEPCION_HUESO_CRUDO',
        nombre='Recepción Hueso Crudo',
        descripcion='Recepción de hueso crudo de frigoríficos',
        requiere_pesaje=True,
        requiere_acidez=False,
        requiere_temperatura=True,
        requiere_control_calidad=True,
        is_active=True,
        orden=1
    )


@pytest.fixture
def tipo_recepcion_sebo(db):
    """Tipo de recepción: Sebo Procesado."""
    return TipoRecepcion.objects.create(
        codigo='RECEPCION_SEBO_PROCESADO',
        nombre='Recepción Sebo Procesado',
        descripcion='Recepción de sebo ya procesado',
        requiere_pesaje=True,
        requiere_acidez=True,
        requiere_temperatura=True,
        requiere_control_calidad=True,
        is_active=True,
        orden=2
    )


@pytest.fixture
def estado_recepcion_pendiente(db):
    """Estado: PENDIENTE."""
    return EstadoRecepcion.objects.create(
        codigo='PENDIENTE',
        nombre='Pendiente',
        descripcion='Recepción programada',
        color='#FFC107',
        es_inicial=True,
        es_final=False,
        permite_edicion=True,
        genera_inventario=False,
        is_active=True,
        orden=1
    )


@pytest.fixture
def estado_recepcion_completada(db):
    """Estado: COMPLETADA."""
    return EstadoRecepcion.objects.create(
        codigo='COMPLETADA',
        nombre='Completada',
        descripcion='Recepción completada',
        color='#28A745',
        es_inicial=False,
        es_final=True,
        permite_edicion=False,
        genera_inventario=True,
        is_active=True,
        orden=4
    )


@pytest.fixture
def estado_recepcion_rechazada(db):
    """Estado: RECHAZADA."""
    return EstadoRecepcion.objects.create(
        codigo='RECHAZADA',
        nombre='Rechazada',
        descripcion='Recepción rechazada',
        color='#DC3545',
        es_inicial=False,
        es_final=True,
        permite_edicion=False,
        genera_inventario=False,
        is_active=True,
        orden=5
    )


@pytest.fixture
def punto_recepcion_bascula(db, empresa):
    """Punto de recepción: Báscula Principal."""
    return PuntoRecepcion.objects.create(
        empresa=empresa,
        codigo='BASCULA_PRINCIPAL',
        nombre='Báscula Principal',
        descripcion='Báscula principal de recepción',
        ubicacion='Entrada planta - Zona A',
        capacidad_kg=Decimal('50000.00'),
        bascula_asignada='BAS-001',
        is_active=True,
        orden=1
    )


# ==============================================================================
# FIXTURES DE PROVEEDOR Y MATERIA PRIMA
# ==============================================================================

@pytest.fixture
def departamento(db):
    """Departamento."""
    return Departamento.objects.create(
        codigo='CUNDINAMARCA',
        nombre='Cundinamarca',
        codigo_dane='25',
        is_active=True
    )


@pytest.fixture
def tipo_documento(db):
    """Tipo de documento."""
    return TipoDocumentoIdentidad.objects.create(
        codigo='NIT',
        nombre='NIT',
        is_active=True
    )


@pytest.fixture
def tipo_proveedor(db):
    """Tipo de proveedor."""
    return TipoProveedor.objects.create(
        codigo='MATERIA_PRIMA',
        nombre='Proveedor de Materia Prima',
        requiere_materia_prima=True,
        is_active=True
    )


@pytest.fixture
def proveedor(db, tipo_proveedor, tipo_documento, departamento):
    """Proveedor de prueba."""
    return Proveedor.objects.create(
        codigo_interno='PROV-001',
        tipo_proveedor=tipo_proveedor,
        nombre_comercial='Frigorífico Test',
        razon_social='Frigorífico Test SAS',
        tipo_documento=tipo_documento,
        numero_documento='900111222',
        telefono='3001234567',
        email='frigorifico@test.com',
        direccion='Calle 10 # 20-30',
        ciudad='Bogotá',
        departamento=departamento,
        is_active=True
    )


@pytest.fixture
def tipo_materia_prima_hueso(db):
    """Tipo de materia prima: Hueso Crudo."""
    return TipoMateriaPrima.objects.create(
        codigo='HUESO_CRUDO',
        nombre='Hueso Crudo',
        descripcion='Hueso de ganado bovino',
        acidez_min=None,
        acidez_max=None,
        is_active=True
    )


# ==============================================================================
# FIXTURES DE RECEPCION
# ==============================================================================

@pytest.fixture
def recepcion(db, empresa, proveedor, tipo_recepcion_hueso,
              punto_recepcion_bascula, estado_recepcion_pendiente, usuario):
    """Recepción de prueba."""
    return Recepcion.objects.create(
        empresa=empresa,
        fecha=date.today(),
        hora_llegada=time(8, 0),
        hora_salida=None,
        proveedor=proveedor,
        tipo_recepcion=tipo_recepcion_hueso,
        punto_recepcion=punto_recepcion_bascula,
        estado=estado_recepcion_pendiente,
        vehiculo_proveedor='ABC123',
        conductor_proveedor='Juan Pérez',
        peso_bruto=Decimal('10000.00'),
        peso_tara=Decimal('2000.00'),
        temperatura_llegada=Decimal('8.00'),
        observaciones='Recepción de prueba',
        recibido_por=usuario,
        created_by=usuario
    )


@pytest.fixture
def detalle_recepcion(db, recepcion, tipo_materia_prima_hueso):
    """Detalle de recepción."""
    return DetalleRecepcion.objects.create(
        recepcion=recepcion,
        tipo_materia_prima=tipo_materia_prima_hueso,
        cantidad=Decimal('8000.000'),
        unidad_medida='KG',
        precio_unitario=Decimal('1500.00'),
        temperatura=Decimal('8.00'),
        observaciones='Detalle de prueba'
    )


@pytest.fixture
def control_calidad(db, recepcion, usuario_calidad):
    """Control de calidad."""
    return ControlCalidadRecepcion.objects.create(
        recepcion=recepcion,
        parametro='temperatura',
        valor_esperado='Entre 0 y 10°C',
        valor_obtenido='8°C',
        cumple=True,
        observaciones='Control de temperatura OK',
        verificado_por=usuario_calidad
    )
