"""
Fixtures compartidos para tests de Programacion de Abastecimiento
==================================================================

Proporciona fixtures reutilizables para:
- Catálogos dinámicos (TipoOperacion, EstadoProgramacion, etc.)
- Programaciones de abastecimiento
- Asignaciones de recursos
- Ejecuciones
- Liquidaciones

Autor: Sistema ERP StrateKaz
Fecha: 27 Diciembre 2025
"""
import pytest
from datetime import datetime, date, timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.gestion_estrategica.configuracion.models import EmpresaConfig, SedeEmpresa
from apps.supply_chain.gestion_proveedores.models import Proveedor
from apps.supply_chain.programacion_abastecimiento.models import (
    # Catálogos
    TipoOperacion,
    EstadoProgramacion,
    UnidadMedida,
    EstadoEjecucion,
    EstadoLiquidacion,
    # Principales
    Programacion,
    AsignacionRecurso,
    Ejecucion,
    Liquidacion,
)

User = get_user_model()


# ==============================================================================
# FIXTURES DE EMPRESA Y USUARIOS
# ==============================================================================

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
def sede(db, empresa):
    """Sede de prueba."""
    return SedeEmpresa.objects.create(
        empresa=empresa,
        codigo='BOG-01',
        nombre='Sede Bogotá',
        direccion='Calle 123 # 45-67',
        ciudad='Bogotá',
        departamento='Cundinamarca',
        telefono='6012345678',
        is_active=True
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
def conductor(db):
    """Usuario conductor."""
    return User.objects.create_user(
        username='conductor',
        email='conductor@ghn.com',
        password='testpass123',
        first_name='Juan',
        last_name='Conductor',
        is_active=True
    )


# ==============================================================================
# FIXTURES DE CATÁLOGOS
# ==============================================================================

@pytest.fixture
def tipo_operacion_recoleccion(db):
    """Tipo de operación RECOLECCION."""
    return TipoOperacion.objects.create(
        codigo='RECOLECCION',
        nombre='Recolección de Materia Prima',
        descripcion='Operación de recolección en punto de proveedor',
        requiere_vehiculo=True,
        requiere_conductor=True,
        color_hex='#10B981',
        orden=1,
        is_active=True
    )


@pytest.fixture
def tipo_operacion_compra_directa(db):
    """Tipo de operación COMPRA_DIRECTA."""
    return TipoOperacion.objects.create(
        codigo='COMPRA_DIRECTA',
        nombre='Compra Directa',
        descripcion='Compra directa sin recolección',
        requiere_vehiculo=False,
        requiere_conductor=False,
        color_hex='#3B82F6',
        orden=2,
        is_active=True
    )


@pytest.fixture
def estado_programacion_pendiente(db):
    """Estado PENDIENTE."""
    return EstadoProgramacion.objects.create(
        codigo='PENDIENTE',
        nombre='Pendiente',
        descripcion='Programación pendiente de confirmación',
        es_estado_inicial=True,
        es_estado_final=False,
        color_hex='#F59E0B',
        orden=1,
        is_active=True
    )


@pytest.fixture
def estado_programacion_confirmada(db):
    """Estado CONFIRMADA."""
    return EstadoProgramacion.objects.create(
        codigo='CONFIRMADA',
        nombre='Confirmada',
        descripcion='Programación confirmada',
        es_estado_inicial=False,
        es_estado_final=False,
        color_hex='#10B981',
        orden=2,
        is_active=True
    )


@pytest.fixture
def estado_programacion_completada(db):
    """Estado COMPLETADA."""
    return EstadoProgramacion.objects.create(
        codigo='COMPLETADA',
        nombre='Completada',
        descripcion='Programación completada',
        es_estado_inicial=False,
        es_estado_final=True,
        color_hex='#059669',
        orden=3,
        is_active=True
    )


@pytest.fixture
def unidad_medida_kg(db):
    """Unidad de medida KG."""
    return UnidadMedida.objects.create(
        codigo='KG',
        nombre='Kilogramos',
        simbolo='kg',
        descripcion='Kilogramos',
        factor_conversion_kg=Decimal('1.0000'),
        orden=1,
        is_active=True
    )


@pytest.fixture
def unidad_medida_ton(db):
    """Unidad de medida TONELADAS."""
    return UnidadMedida.objects.create(
        codigo='TON',
        nombre='Toneladas',
        simbolo='t',
        descripcion='Toneladas métricas',
        factor_conversion_kg=Decimal('1000.0000'),
        orden=2,
        is_active=True
    )


@pytest.fixture
def estado_ejecucion_completada(db):
    """Estado de ejecución COMPLETADA."""
    return EstadoEjecucion.objects.create(
        codigo='COMPLETADA',
        nombre='Completada',
        descripcion='Ejecución completada exitosamente',
        es_estado_inicial=False,
        es_estado_final=True,
        color_hex='#10B981',
        orden=1,
        is_active=True
    )


@pytest.fixture
def estado_liquidacion_pendiente(db):
    """Estado de liquidación PENDIENTE."""
    return EstadoLiquidacion.objects.create(
        codigo='PENDIENTE',
        nombre='Pendiente',
        descripcion='Liquidación pendiente de aprobación',
        permite_edicion=True,
        es_estado_inicial=True,
        es_estado_final=False,
        color_hex='#F59E0B',
        orden=1,
        is_active=True
    )


@pytest.fixture
def estado_liquidacion_aprobada(db):
    """Estado de liquidación APROBADA."""
    return EstadoLiquidacion.objects.create(
        codigo='APROBADA',
        nombre='Aprobada',
        descripcion='Liquidación aprobada',
        permite_edicion=False,
        es_estado_inicial=False,
        es_estado_final=False,
        color_hex='#10B981',
        orden=2,
        is_active=True
    )


# ==============================================================================
# FIXTURES DE PROVEEDOR
# ==============================================================================

@pytest.fixture
def proveedor(db):
    """Proveedor de prueba (simplificado para evitar dependencias)."""
    from apps.supply_chain.catalogos.models import Departamento

    departamento = Departamento.objects.create(
        codigo='CUNDINAMARCA',
        nombre='Cundinamarca',
        codigo_dane='25',
        is_active=True
    )

    # Crear tipo de proveedor simple
    from apps.supply_chain.gestion_proveedores.models import TipoProveedor, TipoDocumentoIdentidad

    tipo_doc = TipoDocumentoIdentidad.objects.create(
        codigo='NIT',
        nombre='NIT',
        is_active=True
    )

    tipo_prov = TipoProveedor.objects.create(
        codigo='MATERIA_PRIMA',
        nombre='Materia Prima',
        requiere_materia_prima=True,
        is_active=True
    )

    return Proveedor.objects.create(
        codigo_interno='PROV-001',
        tipo_proveedor=tipo_prov,
        nombre_comercial='Proveedor Test',
        razon_social='Proveedor Test SAS',
        tipo_documento=tipo_doc,
        numero_documento='900111222',
        telefono='3001234567',
        email='proveedor@test.com',
        direccion='Calle 10 # 20-30',
        ciudad='Bogotá',
        departamento=departamento,
        is_active=True
    )


# ==============================================================================
# FIXTURES DE PROGRAMACION
# ==============================================================================

@pytest.fixture
def programacion(db, empresa, sede, tipo_operacion_recoleccion, estado_programacion_pendiente, proveedor, usuario):
    """Programación de prueba."""
    return Programacion.objects.create(
        empresa=empresa,
        sede=sede,
        tipo_operacion=tipo_operacion_recoleccion,
        fecha_programada=timezone.now() + timedelta(days=1),
        proveedor=proveedor,
        responsable=usuario,
        estado=estado_programacion_pendiente,
        observaciones='Programación de prueba',
        created_by=usuario
    )


@pytest.fixture
def asignacion_recurso(db, programacion, conductor, usuario):
    """Asignación de recurso de prueba."""
    return AsignacionRecurso.objects.create(
        programacion=programacion,
        vehiculo='ABC-123',
        conductor=conductor,
        observaciones='Asignación de prueba',
        asignado_por=usuario
    )


@pytest.fixture
def ejecucion(db, programacion, unidad_medida_kg, estado_ejecucion_completada, usuario):
    """Ejecución de prueba."""
    return Ejecucion.objects.create(
        programacion=programacion,
        fecha_inicio=timezone.now() - timedelta(hours=3),
        fecha_fin=timezone.now(),
        kilometraje_inicial=Decimal('10000.00'),
        kilometraje_final=Decimal('10050.00'),
        cantidad_recolectada=Decimal('500.000'),
        unidad_medida=unidad_medida_kg,
        estado=estado_ejecucion_completada,
        ejecutado_por=usuario,
        observaciones='Ejecución exitosa'
    )


@pytest.fixture
def liquidacion(db, ejecucion, estado_liquidacion_pendiente, usuario):
    """Liquidación de prueba."""
    return Liquidacion.objects.create(
        ejecucion=ejecucion,
        precio_unitario=Decimal('2500.00'),
        cantidad=ejecucion.cantidad_recolectada,
        deducciones=Decimal('0.00'),
        liquidado_por=usuario,
        estado=estado_liquidacion_pendiente,
        observaciones='Liquidación de prueba'
    )
