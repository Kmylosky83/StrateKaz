"""
Fixtures compartidos para tests de Gestión de Proveedores
==========================================================

Proporciona fixtures reutilizables para:
- Usuarios con diferentes niveles de cargo
- Catálogos dinámicos (TipoProveedor, TipoMateriaPrima, etc.)
- Proveedores de diferentes tipos
- Precios y historial de precios
- Pruebas de acidez
- Evaluaciones de proveedores

Autor: Sistema ERP StrateKaz
Fecha: 27 Diciembre 2025
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.gestion_estrategica.configuracion.models import EmpresaConfig
from apps.core.models import Cargo
from apps.supply_chain.gestion_proveedores.models import (
    # Catálogos
    CategoriaMateriaPrima,
    TipoMateriaPrima,
    TipoProveedor,
    ModalidadLogistica,
    FormaPago,
    TipoCuentaBancaria,
    TipoDocumentoIdentidad,
    Departamento,
    Ciudad,
    # Modelos principales
    UnidadNegocio,
    Proveedor,
    PrecioMateriaPrima,
    HistorialPrecioProveedor,
    CondicionComercialProveedor,
    PruebaAcidez,
    CriterioEvaluacion,
    EvaluacionProveedor,
    DetalleEvaluacion,
)

User = get_user_model()


# ==============================================================================
# FIXTURES DE USUARIOS Y EMPRESA
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
def cargo_operativo(db):
    """Cargo nivel operativo (nivel 1)."""
    return Cargo.objects.create(
        code='OPERARIO',
        name='Operario',
        nivel_jerarquico=1
    )


@pytest.fixture
def cargo_coordinador(db):
    """Cargo nivel coordinación (nivel 2)."""
    return Cargo.objects.create(
        code='COORDINADOR',
        name='Coordinador',
        nivel_jerarquico=2
    )


@pytest.fixture
def cargo_gerente(db):
    """Cargo nivel gerencia (nivel 3)."""
    return Cargo.objects.create(
        code='GERENTE',
        name='Gerente',
        nivel_jerarquico=3
    )


@pytest.fixture
def usuario_operativo(db, cargo_operativo):
    """Usuario con cargo operativo (nivel 1)."""
    user = User.objects.create_user(
        username='operativo',
        email='operativo@ghn.com',
        password='testpass123',
        first_name='Usuario',
        last_name='Operativo',
        is_active=True
    )
    user.cargo = cargo_operativo
    user.save()
    return user


@pytest.fixture
def usuario_coordinador(db, cargo_coordinador):
    """Usuario con cargo coordinador (nivel 2)."""
    user = User.objects.create_user(
        username='coordinador',
        email='coordinador@ghn.com',
        password='testpass123',
        first_name='Usuario',
        last_name='Coordinador',
        is_active=True
    )
    user.cargo = cargo_coordinador
    user.save()
    return user


@pytest.fixture
def usuario_gerente(db, cargo_gerente):
    """Usuario con cargo gerente (nivel 3)."""
    user = User.objects.create_user(
        username='gerente',
        email='gerente@ghn.com',
        password='testpass123',
        first_name='Usuario',
        last_name='Gerente',
        is_active=True
    )
    user.cargo = cargo_gerente
    user.save()
    return user


@pytest.fixture
def superadmin(db):
    """Usuario superadmin."""
    return User.objects.create_superuser(
        username='admin',
        email='admin@ghn.com',
        password='adminpass123',
        first_name='Super',
        last_name='Admin'
    )


# ==============================================================================
# FIXTURES DE CATÁLOGOS DINÁMICOS
# ==============================================================================

@pytest.fixture
def categoria_hueso(db):
    """Categoría HUESO."""
    return CategoriaMateriaPrima.objects.create(
        codigo='HUESO',
        nombre='Hueso',
        descripcion='Materia prima de huesos',
        orden=1,
        is_active=True
    )


@pytest.fixture
def categoria_sebo(db):
    """Categoría SEBO."""
    return CategoriaMateriaPrima.objects.create(
        codigo='SEBO',
        nombre='Sebo',
        descripcion='Materia prima de sebo',
        orden=2,
        is_active=True
    )


@pytest.fixture
def tipo_hueso_crudo(db, categoria_hueso):
    """Tipo HUESO_CRUDO."""
    return TipoMateriaPrima.objects.create(
        categoria=categoria_hueso,
        codigo='HUESO_CRUDO',
        nombre='Hueso Crudo',
        descripcion='Hueso sin procesar',
        orden=1,
        is_active=True
    )


@pytest.fixture
def tipo_sebo_procesado_a(db, categoria_sebo):
    """Tipo SEBO_PROCESADO_A (acidez < 3%)."""
    return TipoMateriaPrima.objects.create(
        categoria=categoria_sebo,
        codigo='SEBO_PROCESADO_A',
        nombre='Sebo Procesado Calidad A',
        descripcion='Acidez menor a 3%',
        acidez_min=Decimal('0.00'),
        acidez_max=Decimal('2.99'),
        orden=1,
        is_active=True
    )


@pytest.fixture
def tipo_sebo_procesado_b(db, categoria_sebo):
    """Tipo SEBO_PROCESADO_B (acidez 3-5%)."""
    return TipoMateriaPrima.objects.create(
        categoria=categoria_sebo,
        codigo='SEBO_PROCESADO_B',
        nombre='Sebo Procesado Calidad B',
        descripcion='Acidez entre 3% y 5%',
        acidez_min=Decimal('3.00'),
        acidez_max=Decimal('5.00'),
        orden=2,
        is_active=True
    )


@pytest.fixture
def tipo_proveedor_materia_prima(db):
    """Tipo MATERIA_PRIMA_EXTERNO."""
    return TipoProveedor.objects.create(
        codigo='MATERIA_PRIMA_EXTERNO',
        nombre='Proveedor de Materia Prima Externo',
        descripcion='Proveedor externo de materias primas',
        requiere_materia_prima=True,
        requiere_modalidad_logistica=True,
        orden=1,
        is_active=True
    )


@pytest.fixture
def tipo_proveedor_servicio(db):
    """Tipo PRODUCTO_SERVICIO."""
    return TipoProveedor.objects.create(
        codigo='PRODUCTO_SERVICIO',
        nombre='Proveedor de Productos y Servicios',
        descripcion='Proveedor de productos o servicios',
        requiere_materia_prima=False,
        requiere_modalidad_logistica=False,
        orden=2,
        is_active=True
    )


@pytest.fixture
def modalidad_entrega_planta(db):
    """Modalidad ENTREGA_PLANTA."""
    return ModalidadLogistica.objects.create(
        codigo='ENTREGA_PLANTA',
        nombre='Entrega en Planta',
        descripcion='Proveedor entrega en planta',
        orden=1,
        is_active=True
    )


@pytest.fixture
def modalidad_compra_punto(db):
    """Modalidad COMPRA_EN_PUNTO."""
    return ModalidadLogistica.objects.create(
        codigo='COMPRA_EN_PUNTO',
        nombre='Compra en Punto',
        descripcion='Se compra en punto de acopio',
        orden=2,
        is_active=True
    )


@pytest.fixture
def forma_pago_contado(db):
    """Forma de pago CONTADO."""
    return FormaPago.objects.create(
        codigo='CONTADO',
        nombre='Contado',
        descripcion='Pago de contado',
        orden=1,
        is_active=True
    )


@pytest.fixture
def forma_pago_transferencia(db):
    """Forma de pago TRANSFERENCIA."""
    return FormaPago.objects.create(
        codigo='TRANSFERENCIA',
        nombre='Transferencia Bancaria',
        descripcion='Pago por transferencia',
        orden=2,
        is_active=True
    )


@pytest.fixture
def tipo_cuenta_ahorros(db):
    """Tipo de cuenta AHORROS."""
    return TipoCuentaBancaria.objects.create(
        codigo='AHORROS',
        nombre='Cuenta de Ahorros',
        orden=1,
        is_active=True
    )


@pytest.fixture
def tipo_documento_cc(db):
    """Tipo de documento CC."""
    return TipoDocumentoIdentidad.objects.create(
        codigo='CC',
        nombre='Cédula de Ciudadanía',
        orden=1,
        is_active=True
    )


@pytest.fixture
def tipo_documento_nit(db):
    """Tipo de documento NIT."""
    return TipoDocumentoIdentidad.objects.create(
        codigo='NIT',
        nombre='NIT',
        orden=2,
        is_active=True
    )


@pytest.fixture
def departamento_cundinamarca(db):
    """Departamento Cundinamarca."""
    return Departamento.objects.create(
        codigo='CUNDINAMARCA',
        nombre='Cundinamarca',
        codigo_dane='25',
        orden=1,
        is_active=True
    )


@pytest.fixture
def ciudad_bogota(db, departamento_cundinamarca):
    """Ciudad Bogotá."""
    return Ciudad.objects.create(
        departamento=departamento_cundinamarca,
        codigo='BOGOTA',
        nombre='Bogotá',
        codigo_dane='25001',
        es_capital=True,
        orden=1,
        is_active=True
    )


# ==============================================================================
# FIXTURES DE UNIDAD DE NEGOCIO
# ==============================================================================

@pytest.fixture
def unidad_negocio_planta(db, departamento_cundinamarca, usuario_gerente):
    """Unidad de negocio tipo PLANTA."""
    return UnidadNegocio.objects.create(
        codigo='PLANTA_BOG_01',
        nombre='Planta Bogotá 1',
        tipo_unidad='PLANTA',
        direccion='Calle 123 # 45-67',
        ciudad='Bogotá',
        departamento=departamento_cundinamarca,
        responsable=usuario_gerente,
        is_active=True
    )


# ==============================================================================
# FIXTURES DE PROVEEDORES
# ==============================================================================

@pytest.fixture
def proveedor_materia_prima(
    db,
    tipo_proveedor_materia_prima,
    tipo_hueso_crudo,
    modalidad_entrega_planta,
    tipo_documento_nit,
    departamento_cundinamarca,
    forma_pago_contado,
    tipo_cuenta_ahorros,
    usuario_coordinador
):
    """Proveedor de materia prima completo."""
    proveedor = Proveedor.objects.create(
        codigo_interno='MP-0001',
        tipo_proveedor=tipo_proveedor_materia_prima,
        modalidad_logistica=modalidad_entrega_planta,
        nombre_comercial='Proveedor Huesos SA',
        razon_social='Proveedor de Huesos S.A.S.',
        tipo_documento=tipo_documento_nit,
        numero_documento='900111222',
        nit='900111222-3',
        telefono='3001234567',
        email='contacto@proveedorhuesos.com',
        direccion='Cra 10 # 20-30',
        ciudad='Bogotá',
        departamento=departamento_cundinamarca,
        banco='Bancolombia',
        tipo_cuenta=tipo_cuenta_ahorros,
        numero_cuenta='12345678901',
        titular_cuenta='Proveedor de Huesos S.A.S.',
        dias_plazo_pago=30,
        is_active=True,
        created_by=usuario_coordinador
    )
    proveedor.tipos_materia_prima.add(tipo_hueso_crudo)
    proveedor.formas_pago.add(forma_pago_contado)
    return proveedor


@pytest.fixture
def proveedor_sebo(
    db,
    tipo_proveedor_materia_prima,
    tipo_sebo_procesado_a,
    tipo_sebo_procesado_b,
    modalidad_compra_punto,
    tipo_documento_cc,
    departamento_cundinamarca,
    forma_pago_transferencia,
    usuario_coordinador
):
    """Proveedor de sebo procesado."""
    proveedor = Proveedor.objects.create(
        codigo_interno='MP-0002',
        tipo_proveedor=tipo_proveedor_materia_prima,
        modalidad_logistica=modalidad_compra_punto,
        nombre_comercial='Sebos del Norte',
        razon_social='Juan Pérez',
        tipo_documento=tipo_documento_cc,
        numero_documento='123456789',
        telefono='3009876543',
        email='juan@sebosdelnorte.com',
        direccion='Calle 50 # 30-40',
        ciudad='Bogotá',
        departamento=departamento_cundinamarca,
        is_active=True,
        created_by=usuario_coordinador
    )
    proveedor.tipos_materia_prima.set([tipo_sebo_procesado_a, tipo_sebo_procesado_b])
    proveedor.formas_pago.add(forma_pago_transferencia)
    return proveedor


@pytest.fixture
def proveedor_servicio(
    db,
    tipo_proveedor_servicio,
    tipo_documento_nit,
    departamento_cundinamarca,
    forma_pago_transferencia,
    usuario_coordinador
):
    """Proveedor de servicios."""
    proveedor = Proveedor.objects.create(
        codigo_interno='PS-0001',
        tipo_proveedor=tipo_proveedor_servicio,
        nombre_comercial='Servicios Industriales Ltda',
        razon_social='Servicios Industriales Ltda',
        tipo_documento=tipo_documento_nit,
        numero_documento='800222333',
        nit='800222333-4',
        telefono='6012345678',
        email='info@serviciosindustriales.com',
        direccion='Av 30 # 40-50',
        ciudad='Bogotá',
        departamento=departamento_cundinamarca,
        is_active=True,
        created_by=usuario_coordinador
    )
    proveedor.formas_pago.add(forma_pago_transferencia)
    return proveedor


# ==============================================================================
# FIXTURES DE PRECIOS
# ==============================================================================

@pytest.fixture
def precio_hueso(db, proveedor_materia_prima, tipo_hueso_crudo, usuario_gerente):
    """Precio para hueso crudo."""
    return PrecioMateriaPrima.objects.create(
        proveedor=proveedor_materia_prima,
        tipo_materia=tipo_hueso_crudo,
        precio_kg=Decimal('2500.00'),
        modificado_por=usuario_gerente
    )


@pytest.fixture
def precio_sebo_a(db, proveedor_sebo, tipo_sebo_procesado_a, usuario_gerente):
    """Precio para sebo calidad A."""
    return PrecioMateriaPrima.objects.create(
        proveedor=proveedor_sebo,
        tipo_materia=tipo_sebo_procesado_a,
        precio_kg=Decimal('4500.00'),
        modificado_por=usuario_gerente
    )


@pytest.fixture
def historial_precio(db, proveedor_sebo, tipo_sebo_procesado_a, usuario_gerente):
    """Historial de cambio de precio."""
    return HistorialPrecioProveedor.objects.create(
        proveedor=proveedor_sebo,
        tipo_materia=tipo_sebo_procesado_a,
        precio_anterior=Decimal('4000.00'),
        precio_nuevo=Decimal('4500.00'),
        modificado_por=usuario_gerente,
        motivo='Ajuste por inflación'
    )


# ==============================================================================
# FIXTURES DE CONDICIONES COMERCIALES
# ==============================================================================

@pytest.fixture
def condicion_comercial(db, proveedor_servicio, usuario_coordinador):
    """Condición comercial vigente."""
    return CondicionComercialProveedor.objects.create(
        proveedor=proveedor_servicio,
        descripcion='Descuento por volumen',
        valor_acordado='10% descuento en compras mayores a $5.000.000',
        forma_pago='Transferencia a 15 días',
        plazo_entrega='48 horas',
        garantias='Garantía de 6 meses',
        vigencia_desde=date.today() - timedelta(days=30),
        vigencia_hasta=date.today() + timedelta(days=335),
        created_by=usuario_coordinador
    )


# ==============================================================================
# FIXTURES DE PRUEBAS DE ACIDEZ
# ==============================================================================

@pytest.fixture
def prueba_acidez(db, proveedor_sebo, tipo_sebo_procesado_a, usuario_coordinador):
    """Prueba de acidez calidad A."""
    from django.core.files.uploadedfile import SimpleUploadedFile

    # Crear imagen de prueba
    foto = SimpleUploadedFile(
        name='prueba_acidez.jpg',
        content=b'fake_image_content',
        content_type='image/jpeg'
    )

    return PruebaAcidez.objects.create(
        proveedor=proveedor_sebo,
        fecha_prueba=timezone.now(),
        valor_acidez=Decimal('2.5'),
        calidad_resultante='A',
        tipo_materia_resultante=tipo_sebo_procesado_a,
        foto_prueba=foto,
        cantidad_kg=Decimal('500.00'),
        precio_kg_aplicado=Decimal('4500.00'),
        valor_total=Decimal('2250000.00'),
        observaciones='Prueba exitosa',
        lote_numero='L-2025-001',
        codigo_voucher='ACID-20251227-0001',
        realizado_por=usuario_coordinador
    )


# ==============================================================================
# FIXTURES DE EVALUACIÓN DE PROVEEDORES
# ==============================================================================

@pytest.fixture
def criterio_calidad(db, tipo_proveedor_materia_prima):
    """Criterio de evaluación de calidad."""
    criterio = CriterioEvaluacion.objects.create(
        codigo='CALIDAD',
        nombre='Calidad del Producto',
        descripcion='Evalúa la calidad del producto entregado',
        peso=Decimal('2.0'),
        orden=1,
        is_active=True
    )
    criterio.aplica_a_tipo.add(tipo_proveedor_materia_prima)
    return criterio


@pytest.fixture
def criterio_puntualidad(db, tipo_proveedor_materia_prima):
    """Criterio de evaluación de puntualidad."""
    criterio = CriterioEvaluacion.objects.create(
        codigo='PUNTUALIDAD',
        nombre='Puntualidad en Entregas',
        descripcion='Evalúa cumplimiento de tiempos de entrega',
        peso=Decimal('1.5'),
        orden=2,
        is_active=True
    )
    criterio.aplica_a_tipo.add(tipo_proveedor_materia_prima)
    return criterio


@pytest.fixture
def evaluacion_proveedor(db, proveedor_materia_prima, usuario_coordinador):
    """Evaluación de proveedor en borrador."""
    return EvaluacionProveedor.objects.create(
        proveedor=proveedor_materia_prima,
        periodo='2025-Q1',
        fecha_evaluacion=date.today(),
        estado='BORRADOR',
        evaluado_por=usuario_coordinador
    )


@pytest.fixture
def detalle_evaluacion(db, evaluacion_proveedor, criterio_calidad):
    """Detalle de evaluación por criterio."""
    return DetalleEvaluacion.objects.create(
        evaluacion=evaluacion_proveedor,
        criterio=criterio_calidad,
        calificacion=Decimal('85.00'),
        observaciones='Buen desempeño en calidad'
    )
