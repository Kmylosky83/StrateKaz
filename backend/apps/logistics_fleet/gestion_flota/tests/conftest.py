"""
Fixtures compartidos para tests de Gestión de Flota
====================================================

Proporciona fixtures reutilizables para:
- Catálogos dinámicos (TipoVehiculo, EstadoVehiculo)
- Vehículos y documentación
- Mantenimientos
- Costos operacionales
- Verificaciones PESV

Autor: Sistema ERP StrateKaz
Fecha: 28 Diciembre 2025
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.gestion_estrategica.configuracion.models import EmpresaConfig, SedeEmpresa
from apps.logistics_fleet.gestion_flota.models import (
    TipoVehiculo,
    EstadoVehiculo,
    Vehiculo,
    DocumentoVehiculo,
    HojaVidaVehiculo,
    MantenimientoVehiculo,
    CostoOperacion,
    VerificacionTercero,
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
def usuario(db, empresa):
    """Usuario de prueba."""
    user = User.objects.create_user(
        username='testuser',
        email='test@ghn.com',
        password='testpass123',
        first_name='Test',
        last_name='User',
        is_active=True
    )
    user.empresa = empresa
    user.save()
    return user


@pytest.fixture
def usuario_inspector(db, empresa):
    """Usuario inspector."""
    user = User.objects.create_user(
        username='inspector',
        email='inspector@ghn.com',
        password='testpass123',
        first_name='Inspector',
        last_name='PESV',
        is_active=True
    )
    user.empresa = empresa
    user.save()
    return user


# ==============================================================================
# FIXTURES DE CATÁLOGOS
# ==============================================================================

@pytest.fixture
def tipo_vehiculo_camion(db):
    """Tipo de vehículo: Camión 3 toneladas."""
    return TipoVehiculo.objects.create(
        codigo='CAMION_3TON',
        nombre='Camión 3 Toneladas',
        descripcion='Camión para carga general de 3 toneladas',
        capacidad_kg=Decimal('3000.00'),
        capacidad_m3=Decimal('15.00'),
        requiere_refrigeracion=False,
        requiere_licencia_especial=True,
        categoria_licencia='C1',
        orden=1,
        is_active=True
    )


@pytest.fixture
def tipo_vehiculo_furgon(db):
    """Tipo de vehículo: Furgón refrigerado."""
    return TipoVehiculo.objects.create(
        codigo='FURGON_REFRIGERADO',
        nombre='Furgón Refrigerado',
        descripcion='Furgón con sistema de refrigeración',
        capacidad_kg=Decimal('1500.00'),
        capacidad_m3=Decimal('8.00'),
        requiere_refrigeracion=True,
        requiere_licencia_especial=True,
        categoria_licencia='C1',
        orden=2,
        is_active=True
    )


@pytest.fixture
def estado_disponible(db):
    """Estado: Disponible."""
    return EstadoVehiculo.objects.create(
        codigo='DISPONIBLE',
        nombre='Disponible',
        descripcion='Vehículo disponible para asignación',
        color='#10B981',
        disponible_para_ruta=True,
        requiere_mantenimiento=False,
        orden=1,
        is_active=True
    )


@pytest.fixture
def estado_en_ruta(db):
    """Estado: En Ruta."""
    return EstadoVehiculo.objects.create(
        codigo='EN_RUTA',
        nombre='En Ruta',
        descripcion='Vehículo en ruta activa',
        color='#3B82F6',
        disponible_para_ruta=False,
        requiere_mantenimiento=False,
        orden=2,
        is_active=True
    )


@pytest.fixture
def estado_mantenimiento(db):
    """Estado: En Mantenimiento."""
    return EstadoVehiculo.objects.create(
        codigo='MANTENIMIENTO',
        nombre='En Mantenimiento',
        descripcion='Vehículo en mantenimiento',
        color='#F59E0B',
        disponible_para_ruta=False,
        requiere_mantenimiento=True,
        orden=3,
        is_active=True
    )


# ==============================================================================
# FIXTURES DE VEHÍCULOS
# ==============================================================================

@pytest.fixture
def vehiculo(db, empresa, tipo_vehiculo_camion, estado_disponible, usuario):
    """Vehículo de prueba."""
    return Vehiculo.objects.create(
        empresa=empresa,
        placa='ABC123',
        tipo_vehiculo=tipo_vehiculo_camion,
        estado=estado_disponible,
        marca='Chevrolet',
        modelo='NPR',
        anio=2020,
        color='Blanco',
        numero_motor='MOTOR123',
        numero_chasis='CHASIS123',
        vin='1HGBH41JXMN109186',
        capacidad_kg=Decimal('3000.00'),
        km_actual=50000,
        fecha_matricula=date(2020, 1, 15),
        fecha_soat=date.today() + timedelta(days=60),
        fecha_tecnomecanica=date.today() + timedelta(days=90),
        propietario_nombre='Grasas y Huesos del Norte S.A.S.',
        propietario_documento='900123456-1',
        es_propio=True,
        es_contratado=False,
        gps_instalado=True,
        numero_gps='GPS-001',
        observaciones='Vehículo en excelente estado',
        is_active=True,
        created_by=usuario,
        updated_by=usuario
    )


@pytest.fixture
def vehiculo_documentos_vencidos(db, empresa, tipo_vehiculo_furgon, estado_disponible, usuario):
    """Vehículo con documentos vencidos."""
    return Vehiculo.objects.create(
        empresa=empresa,
        placa='XYZ789',
        tipo_vehiculo=tipo_vehiculo_furgon,
        estado=estado_disponible,
        marca='Mazda',
        modelo='B2200',
        anio=2018,
        capacidad_kg=Decimal('1500.00'),
        km_actual=80000,
        fecha_soat=date.today() - timedelta(days=10),  # Vencido
        fecha_tecnomecanica=date.today() + timedelta(days=5),  # Por vencer
        es_propio=True,
        es_contratado=False,
        is_active=True,
        created_by=usuario
    )


# ==============================================================================
# FIXTURES DE DOCUMENTOS
# ==============================================================================

@pytest.fixture
def documento_soat(db, empresa, vehiculo, usuario):
    """Documento SOAT."""
    return DocumentoVehiculo.objects.create(
        empresa=empresa,
        vehiculo=vehiculo,
        tipo_documento='SOAT',
        numero_documento='SOAT-2025-001',
        fecha_expedicion=date.today() - timedelta(days=300),
        fecha_vencimiento=date.today() + timedelta(days=60),
        entidad_emisora='Seguros del Estado',
        observaciones='SOAT vigente',
        is_active=True,
        created_by=usuario
    )


@pytest.fixture
def documento_tecnomecanica(db, empresa, vehiculo, usuario):
    """Documento Tecnomecánica."""
    return DocumentoVehiculo.objects.create(
        empresa=empresa,
        vehiculo=vehiculo,
        tipo_documento='TECNOMECANICA',
        numero_documento='TECNO-2025-001',
        fecha_expedicion=date.today() - timedelta(days=270),
        fecha_vencimiento=date.today() + timedelta(days=90),
        entidad_emisora='CDA Bogotá',
        observaciones='Tecnomecánica aprobada',
        is_active=True,
        created_by=usuario
    )


@pytest.fixture
def documento_vencido(db, empresa, vehiculo, usuario):
    """Documento vencido."""
    return DocumentoVehiculo.objects.create(
        empresa=empresa,
        vehiculo=vehiculo,
        tipo_documento='POLIZA',
        numero_documento='POL-2024-001',
        fecha_expedicion=date.today() - timedelta(days=400),
        fecha_vencimiento=date.today() - timedelta(days=10),  # Vencido
        entidad_emisora='Aseguradora Test',
        is_active=True,
        created_by=usuario
    )


# ==============================================================================
# FIXTURES DE MANTENIMIENTOS
# ==============================================================================

@pytest.fixture
def mantenimiento_programado(db, empresa, vehiculo, usuario):
    """Mantenimiento programado."""
    return MantenimientoVehiculo.objects.create(
        empresa=empresa,
        vehiculo=vehiculo,
        tipo='PREVENTIVO',
        descripcion='Cambio de aceite y filtros',
        fecha_programada=date.today() + timedelta(days=15),
        km_mantenimiento=50000,
        km_proximo_mantenimiento=55000,
        costo_mano_obra=Decimal('150000.00'),
        costo_repuestos=Decimal('250000.00'),
        proveedor_nombre='Taller Automotriz ABC',
        responsable=usuario,
        estado='PROGRAMADO',
        is_active=True,
        created_by=usuario
    )


@pytest.fixture
def mantenimiento_completado(db, empresa, vehiculo, usuario):
    """Mantenimiento completado."""
    return MantenimientoVehiculo.objects.create(
        empresa=empresa,
        vehiculo=vehiculo,
        tipo='CORRECTIVO',
        descripcion='Reparación de frenos',
        fecha_programada=date.today() - timedelta(days=10),
        fecha_ejecucion=date.today() - timedelta(days=8),
        km_mantenimiento=48000,
        costo_mano_obra=Decimal('200000.00'),
        costo_repuestos=Decimal('450000.00'),
        proveedor_nombre='Taller Automotriz ABC',
        factura_numero='FACT-001',
        responsable=usuario,
        estado='COMPLETADO',
        is_active=True,
        created_by=usuario
    )


@pytest.fixture
def mantenimiento_vencido(db, empresa, vehiculo, usuario):
    """Mantenimiento vencido."""
    return MantenimientoVehiculo.objects.create(
        empresa=empresa,
        vehiculo=vehiculo,
        tipo='PREVENTIVO',
        descripcion='Revisión 50000 km',
        fecha_programada=date.today() - timedelta(days=5),  # Vencido
        km_mantenimiento=50000,
        costo_mano_obra=Decimal('100000.00'),
        costo_repuestos=Decimal('150000.00'),
        estado='PROGRAMADO',
        is_active=True,
        created_by=usuario
    )


# ==============================================================================
# FIXTURES DE COSTOS
# ==============================================================================

@pytest.fixture
def costo_combustible(db, empresa, vehiculo, usuario):
    """Costo de combustible."""
    return CostoOperacion.objects.create(
        empresa=empresa,
        vehiculo=vehiculo,
        fecha=date.today(),
        tipo_costo='COMBUSTIBLE',
        valor=Decimal('250000.00'),
        cantidad=Decimal('50.00'),  # 50 litros
        km_recorridos=500,  # 500 km recorridos
        factura_numero='FACT-COMB-001',
        observaciones='Tanqueada completa',
        registrado_por=usuario,
        is_active=True,
        created_by=usuario
    )


@pytest.fixture
def costo_peaje(db, empresa, vehiculo, usuario):
    """Costo de peaje."""
    return CostoOperacion.objects.create(
        empresa=empresa,
        vehiculo=vehiculo,
        fecha=date.today(),
        tipo_costo='PEAJE',
        valor=Decimal('15000.00'),
        factura_numero='PEAJE-001',
        observaciones='Peaje ruta norte',
        registrado_por=usuario,
        is_active=True,
        created_by=usuario
    )


@pytest.fixture
def costo_lavado(db, empresa, vehiculo, usuario):
    """Costo de lavado."""
    return CostoOperacion.objects.create(
        empresa=empresa,
        vehiculo=vehiculo,
        fecha=date.today() - timedelta(days=2),
        tipo_costo='LAVADO',
        valor=Decimal('35000.00'),
        observaciones='Lavado completo con encerado',
        registrado_por=usuario,
        is_active=True,
        created_by=usuario
    )


# ==============================================================================
# FIXTURES DE VERIFICACIONES PESV
# ==============================================================================

@pytest.fixture
def verificacion_preoperacional(db, empresa, vehiculo, usuario_inspector, usuario):
    """Verificación preoperacional diaria."""
    return VerificacionTercero.objects.create(
        empresa=empresa,
        vehiculo=vehiculo,
        fecha=timezone.now(),
        tipo='PREOPERACIONAL_DIARIA',
        inspector=usuario_inspector,
        checklist_items=[
            {'item': 'Luces funcionando', 'cumple': True, 'observacion': ''},
            {'item': 'Frenos en buen estado', 'cumple': True, 'observacion': ''},
            {'item': 'Llantas en buen estado', 'cumple': True, 'observacion': ''},
            {'item': 'Nivel de aceite OK', 'cumple': True, 'observacion': ''},
            {'item': 'Kit de carretera completo', 'cumple': True, 'observacion': ''},
        ],
        resultado='APROBADO',
        kilometraje=50000,
        nivel_combustible='3/4',
        observaciones_generales='Vehículo en perfectas condiciones',
        is_active=True,
        created_by=usuario
    )


@pytest.fixture
def verificacion_rechazada(db, empresa, vehiculo, usuario_inspector, usuario):
    """Verificación rechazada."""
    return VerificacionTercero.objects.create(
        empresa=empresa,
        vehiculo=vehiculo,
        fecha=timezone.now() - timedelta(days=1),
        tipo='PREOPERACIONAL_DIARIA',
        inspector=usuario_inspector,
        checklist_items=[
            {'item': 'Luces funcionando', 'cumple': True, 'observacion': ''},
            {'item': 'Frenos en buen estado', 'cumple': False, 'observacion': 'Frenos traseros desgastados'},
            {'item': 'Llantas en buen estado', 'cumple': True, 'observacion': ''},
            {'item': 'Nivel de aceite OK', 'cumple': False, 'observacion': 'Nivel bajo de aceite'},
            {'item': 'Kit de carretera completo', 'cumple': True, 'observacion': ''},
        ],
        resultado='RECHAZADO',
        kilometraje=50050,
        nivel_combustible='1/2',
        observaciones_generales='Requiere mantenimiento urgente',
        acciones_correctivas='Cambiar frenos traseros y aceite de motor',
        is_active=True,
        created_by=usuario
    )


@pytest.fixture
def verificacion_con_observaciones(db, empresa, vehiculo, usuario_inspector, usuario):
    """Verificación aprobada con observaciones."""
    return VerificacionTercero.objects.create(
        empresa=empresa,
        vehiculo=vehiculo,
        fecha=timezone.now() - timedelta(days=2),
        tipo='INSPECCION_MENSUAL',
        inspector=usuario_inspector,
        checklist_items=[
            {'item': 'Luces funcionando', 'cumple': True, 'observacion': ''},
            {'item': 'Frenos en buen estado', 'cumple': True, 'observacion': ''},
            {'item': 'Llantas en buen estado', 'cumple': True, 'observacion': 'Desgaste medio'},
            {'item': 'Nivel de aceite OK', 'cumple': True, 'observacion': ''},
        ],
        resultado='APROBADO_CON_OBSERVACIONES',
        kilometraje=49000,
        observaciones_generales='Llantas con desgaste medio, programar cambio',
        acciones_correctivas='Programar cambio de llantas en próximo mes',
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
