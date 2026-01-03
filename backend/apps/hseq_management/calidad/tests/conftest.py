"""
Fixtures especificas para tests de calidad

Proporciona fixtures reutilizables para:
- NoConformidad y sus diferentes estados
- AccionCorrectiva vinculadas a NC
- SalidaNoConforme con diferentes disposiciones
- SolicitudCambio en diferentes estados
- ControlCambio asociados a solicitudes
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.gestion_estrategica.configuracion.models import EmpresaConfig
from apps.hseq_management.calidad.models import (
    NoConformidad,
    AccionCorrectiva,
    SalidaNoConforme,
    SolicitudCambio,
    ControlCambio
)

User = get_user_model()


@pytest.fixture
def usuario(db):
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
def responsable(db):
    """Usuario responsable de acciones."""
    return User.objects.create_user(
        username='responsable',
        email='responsable@example.com',
        password='testpass123',
        first_name='Responsable',
        last_name='Calidad',
        is_active=True
    )


@pytest.fixture
def verificador(db):
    """Usuario verificador de acciones."""
    return User.objects.create_user(
        username='verificador',
        email='verificador@example.com',
        password='testpass123',
        first_name='Verificador',
        last_name='Calidad',
        is_active=True
    )


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
def no_conformidad(db, empresa, usuario):
    """No Conformidad básica en estado ABIERTA."""
    return NoConformidad.objects.create(
        empresa_id=empresa.id,
        codigo='NC-2024-001',
        tipo='REAL',
        origen='AUDITORIA_INTERNA',
        severidad='MAYOR',
        titulo='Falta de registros de calibración',
        descripcion='No se encontraron registros de calibración de balanzas',
        fecha_deteccion=date.today(),
        ubicacion='Área de producción',
        proceso_relacionado='Control de calidad',
        requisito_incumplido='ISO 9001:2015 - Cláusula 7.1.5',
        detectado_por=usuario,
        estado='ABIERTA'
    )


@pytest.fixture
def nc_en_analisis(db, empresa, usuario, responsable):
    """No Conformidad en estado EN_ANALISIS."""
    return NoConformidad.objects.create(
        empresa_id=empresa.id,
        codigo='NC-2024-002',
        tipo='REAL',
        origen='QUEJA_CLIENTE',
        severidad='CRITICA',
        titulo='Producto no conforme entregado',
        descripcion='Cliente reporta producto fuera de especificación',
        fecha_deteccion=date.today() - timedelta(days=5),
        detectado_por=usuario,
        responsable_analisis=responsable,
        estado='EN_ANALISIS',
        fecha_analisis=date.today() - timedelta(days=3)
    )


@pytest.fixture
def nc_en_verificacion(db, empresa, usuario, responsable):
    """No Conformidad en estado VERIFICACION."""
    return NoConformidad.objects.create(
        empresa_id=empresa.id,
        codigo='NC-2024-003',
        tipo='REAL',
        origen='PROCESO_INTERNO',
        severidad='MENOR',
        titulo='Documentación desactualizada',
        descripcion='Procedimiento operativo no actualizado',
        fecha_deteccion=date.today() - timedelta(days=20),
        detectado_por=usuario,
        responsable_analisis=responsable,
        responsable_cierre=responsable,
        estado='VERIFICACION',
        fecha_analisis=date.today() - timedelta(days=15),
        analisis_causa_raiz='Falta de control de cambios documentales',
        metodo_analisis='5_PORQUES'
    )


@pytest.fixture
def accion_correctiva(db, empresa, no_conformidad, responsable):
    """Acción Correctiva básica en estado PLANIFICADA."""
    return AccionCorrectiva.objects.create(
        empresa_id=empresa.id,
        codigo='AC-2024-001',
        tipo='CORRECTIVA',
        no_conformidad=no_conformidad,
        descripcion='Implementar sistema de control de calibraciones',
        objetivo='Asegurar trazabilidad de calibraciones',
        fecha_planificada=date.today() + timedelta(days=7),
        fecha_limite=date.today() + timedelta(days=30),
        responsable=responsable,
        estado='PLANIFICADA',
        recursos_necesarios='Software de gestión, capacitación al personal'
    )


@pytest.fixture
def accion_ejecutada(db, empresa, no_conformidad, responsable, verificador):
    """Acción Correctiva ejecutada pendiente de verificación."""
    return AccionCorrectiva.objects.create(
        empresa_id=empresa.id,
        codigo='AC-2024-002',
        tipo='CORRECTIVA',
        no_conformidad=no_conformidad,
        descripcion='Capacitar personal en procedimientos',
        fecha_planificada=date.today() - timedelta(days=15),
        fecha_limite=date.today() + timedelta(days=15),
        responsable=responsable,
        verificador=verificador,
        estado='EJECUTADA',
        fecha_ejecucion=date.today() - timedelta(days=5),
        comentarios_ejecucion='Capacitación realizada a 15 personas',
        costo_estimado=Decimal('500000.00'),
        costo_real=Decimal('450000.00')
    )


@pytest.fixture
def accion_verificada(db, empresa, nc_en_verificacion, responsable, verificador):
    """Acción Correctiva verificada como eficaz."""
    return AccionCorrectiva.objects.create(
        empresa_id=empresa.id,
        codigo='AC-2024-003',
        tipo='CORRECTIVA',
        no_conformidad=nc_en_verificacion,
        descripcion='Actualizar documentación del proceso',
        fecha_planificada=date.today() - timedelta(days=20),
        fecha_limite=date.today() - timedelta(days=5),
        responsable=responsable,
        verificador=verificador,
        estado='VERIFICADA',
        fecha_ejecucion=date.today() - timedelta(days=10),
        fecha_verificacion=date.today() - timedelta(days=2),
        eficaz=True,
        metodo_verificacion='Auditoría interna de seguimiento',
        resultados_verificacion='Documentación actualizada y socializada'
    )


@pytest.fixture
def accion_vencida(db, empresa, no_conformidad, responsable):
    """Acción Correctiva vencida."""
    return AccionCorrectiva.objects.create(
        empresa_id=empresa.id,
        codigo='AC-2024-004',
        tipo='PREVENTIVA',
        no_conformidad=no_conformidad,
        descripcion='Acción vencida no ejecutada',
        fecha_planificada=date.today() - timedelta(days=20),
        fecha_limite=date.today() - timedelta(days=5),
        responsable=responsable,
        estado='PLANIFICADA'
    )


@pytest.fixture
def salida_no_conforme(db, empresa, usuario):
    """Salida No Conforme básica detectada."""
    return SalidaNoConforme.objects.create(
        empresa_id=empresa.id,
        codigo='SNC-2024-001',
        tipo='PRODUCTO',
        descripcion_producto='Lote 12345 - Grasa industrial',
        descripcion_no_conformidad='Viscosidad fuera de especificación',
        fecha_deteccion=date.today(),
        lote_numero='L-2024-12345',
        cantidad_afectada=Decimal('500.000'),
        unidad_medida='Kg',
        ubicacion_actual='Almacén de cuarentena',
        bloqueada=True,
        requisito_incumplido='Especificación técnica: viscosidad 100-120 cSt',
        impacto_cliente='No se puede liberar para venta',
        riesgo_uso='ALTO',
        detectado_por=usuario,
        estado='DETECTADA'
    )


@pytest.fixture
def salida_en_evaluacion(db, empresa, usuario, responsable):
    """Salida No Conforme en evaluación."""
    return SalidaNoConforme.objects.create(
        empresa_id=empresa.id,
        codigo='SNC-2024-002',
        tipo='MATERIA_PRIMA',
        descripcion_producto='Huesos bovinos',
        descripcion_no_conformidad='Contaminación microbiológica detectada',
        fecha_deteccion=date.today() - timedelta(days=2),
        lote_numero='MP-2024-456',
        cantidad_afectada=Decimal('1000.000'),
        unidad_medida='Kg',
        ubicacion_actual='Zona de recepción bloqueada',
        bloqueada=True,
        requisito_incumplido='NTC 1325 - Parámetros microbiológicos',
        riesgo_uso='ALTO',
        detectado_por=usuario,
        responsable_evaluacion=responsable,
        estado='EN_EVALUACION'
    )


@pytest.fixture
def salida_resuelta(db, empresa, usuario, responsable):
    """Salida No Conforme resuelta."""
    return SalidaNoConforme.objects.create(
        empresa_id=empresa.id,
        codigo='SNC-2024-003',
        tipo='PRODUCTO',
        descripcion_producto='Grasa lubricante',
        descripcion_no_conformidad='Empaque dañado',
        fecha_deteccion=date.today() - timedelta(days=10),
        lote_numero='L-2024-789',
        cantidad_afectada=Decimal('100.000'),
        unidad_medida='Unidades',
        ubicacion_actual='Reempacado',
        bloqueada=True,
        requisito_incumplido='Requisito de empaque intacto',
        riesgo_uso='BAJO',
        detectado_por=usuario,
        responsable_disposicion=responsable,
        estado='RESUELTA',
        disposicion='REPROCESO',
        justificacion_disposicion='Reempacar producto en nuevos envases',
        fecha_disposicion=date.today() - timedelta(days=5),
        acciones_tomadas='Producto reempacado y verificado',
        fecha_resolucion=date.today() - timedelta(days=2),
        costo_estimado=Decimal('300000.00')
    )


@pytest.fixture
def solicitud_cambio(db, empresa, usuario):
    """Solicitud de Cambio básica."""
    return SolicitudCambio.objects.create(
        empresa_id=empresa.id,
        codigo='SC-2024-001',
        tipo='PROCEDIMIENTO',
        prioridad='ALTA',
        titulo='Actualización procedimiento de inspección',
        descripcion_actual='Procedimiento manual con registros en papel',
        descripcion_cambio='Digitalizar proceso de inspección',
        justificacion='Mejorar trazabilidad y reducir errores',
        solicitante=usuario,
        estado='SOLICITADA',
        impacto_calidad='Mejora en registro de datos',
        impacto_procesos='Todos los procesos de inspección',
        impacto_recursos='Software y capacitación',
        riesgos_identificados='Resistencia al cambio del personal',
        medidas_mitigacion='Plan de capacitación gradual',
        costo_estimado=Decimal('2000000.00')
    )


@pytest.fixture
def solicitud_aprobada(db, empresa, usuario, responsable):
    """Solicitud de Cambio aprobada."""
    return SolicitudCambio.objects.create(
        empresa_id=empresa.id,
        codigo='SC-2024-002',
        tipo='PROCESO',
        prioridad='MEDIA',
        titulo='Cambio en proceso de mezcla',
        descripcion_actual='Mezcla manual',
        descripcion_cambio='Instalar mezclador automático',
        justificacion='Estandarizar mezcla y reducir variabilidad',
        solicitante=usuario,
        revisado_por=responsable,
        fecha_revision=date.today() - timedelta(days=10),
        comentarios_revision='Revisado y viable técnicamente',
        aprobado_por=responsable,
        fecha_aprobacion=date.today() - timedelta(days=5),
        comentarios_aprobacion='Aprobado para implementación',
        responsable_implementacion=responsable,
        fecha_implementacion_planificada=date.today() + timedelta(days=30),
        estado='APROBADA',
        costo_estimado=Decimal('15000000.00')
    )


@pytest.fixture
def solicitud_rechazada(db, empresa, usuario, responsable):
    """Solicitud de Cambio rechazada."""
    return SolicitudCambio.objects.create(
        empresa_id=empresa.id,
        codigo='SC-2024-003',
        tipo='PRODUCTO',
        prioridad='BAJA',
        titulo='Cambio de proveedor de materia prima',
        descripcion_actual='Proveedor actual certificado',
        descripcion_cambio='Cambiar a proveedor más económico',
        justificacion='Reducción de costos',
        solicitante=usuario,
        revisado_por=responsable,
        fecha_revision=date.today() - timedelta(days=3),
        comentarios_revision='Nuevo proveedor no cumple requisitos de calidad',
        estado='RECHAZADA'
    )


@pytest.fixture
def control_cambio(db, empresa, solicitud_aprobada, responsable):
    """Control de Cambio para solicitud aprobada."""
    return ControlCambio.objects.create(
        empresa_id=empresa.id,
        solicitud_cambio=solicitud_aprobada,
        fecha_inicio_implementacion=date.today() - timedelta(days=20),
        fecha_fin_implementacion=date.today() - timedelta(days=5),
        acciones_realizadas='Instalación de mezclador, ajustes y pruebas',
        personal_comunicado='Personal de producción, supervisores',
        fecha_comunicacion=date.today() - timedelta(days=25),
        metodo_comunicacion='Reunión general y correos electrónicos',
        capacitacion_realizada=True,
        descripcion_capacitacion='Capacitación en operación del nuevo equipo',
        personal_capacitado='10 operarios de producción',
        documentos_actualizados='PO-001 Procedimiento de Mezcla v2.0',
        nueva_version='2.0',
        verificacion_realizada=True,
        fecha_verificacion=date.today() - timedelta(days=2),
        resultados_verificacion='Equipo operando correctamente, proceso estandarizado',
        eficaz=True,
        seguimiento_planificado=True,
        proxima_revision=date.today() + timedelta(days=90),
        costo_real=Decimal('14500000.00'),
        lecciones_aprendidas='Tiempo de adaptación del personal fue menor al esperado'
    )
