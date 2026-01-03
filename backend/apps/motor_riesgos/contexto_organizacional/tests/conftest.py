"""
Fixtures para tests de Contexto Organizacional
===============================================

Fixtures reutilizables para todos los tests del módulo contexto_organizacional.
Proporciona datos de prueba consistentes para análisis DOFA, PESTEL y Porter.

Autor: Sistema ERP StrateKaz
Fecha: 2025-12-26
"""
import pytest
from datetime import date, timedelta
from django.contrib.auth import get_user_model

from apps.gestion_estrategica.configuracion.models import EmpresaConfig
from apps.motor_riesgos.contexto_organizacional.models import (
    AnalisisDOFA,
    FactorDOFA,
    EstrategiaTOWS,
    AnalisisPESTEL,
    FactorPESTEL,
    FuerzaPorter
)

User = get_user_model()


# ============================================================================
# FIXTURES BASE (Usuario y Empresa)
# ============================================================================

@pytest.fixture
def user(db):
    """Usuario de prueba básico."""
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User',
        is_active=True
    )


@pytest.fixture
def responsable_user(db):
    """Usuario responsable de análisis estratégico."""
    return User.objects.create_user(
        username='responsable',
        email='responsable@ghn.com',
        password='testpass123',
        first_name='Carlos',
        last_name='Estratega',
        is_active=True
    )


@pytest.fixture
def aprobador_user(db):
    """Usuario con autoridad para aprobar análisis."""
    return User.objects.create_user(
        username='aprobador',
        email='director@ghn.com',
        password='testpass123',
        first_name='María',
        last_name='Directora',
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
        direccion='Zona Industrial Calle 123 # 45-67',
        ciudad='Bogotá',
        departamento='Cundinamarca',
        pais='Colombia'
    )


@pytest.fixture
def empresa_secundaria(db):
    """Segunda empresa para tests de multi-tenancy."""
    return EmpresaConfig.objects.create(
        nombre='Competidor S.A.',
        nit='900987654-2',
        razon_social='Competidor S.A.',
        nombre_comercial='COMP',
        email='info@comp.com',
        telefono='3009876543',
        direccion='Av. Principal 100',
        ciudad='Medellín',
        departamento='Antioquia',
        pais='Colombia'
    )


# ============================================================================
# FIXTURES ANÁLISIS DOFA
# ============================================================================

@pytest.fixture
def analisis_dofa(db, empresa, responsable_user):
    """Análisis DOFA en estado borrador."""
    return AnalisisDOFA.objects.create(
        empresa=empresa,
        nombre='Análisis DOFA Q1 2025',
        fecha_analisis=date.today(),
        periodo='2025-Q1',
        responsable=responsable_user,
        estado=AnalisisDOFA.EstadoAnalisis.BORRADOR,
        observaciones='Análisis inicial del primer trimestre 2025'
    )


@pytest.fixture
def analisis_dofa_aprobado(db, empresa, responsable_user, aprobador_user):
    """Análisis DOFA aprobado y vigente."""
    return AnalisisDOFA.objects.create(
        empresa=empresa,
        nombre='Análisis DOFA 2024',
        fecha_analisis=date(2024, 12, 1),
        periodo='2024-Anual',
        responsable=responsable_user,
        estado=AnalisisDOFA.EstadoAnalisis.APROBADO,
        observaciones='Análisis consolidado anual 2024',
        aprobado_por=aprobador_user,
        fecha_aprobacion=date(2024, 12, 15)
    )


@pytest.fixture
def fortaleza(db, analisis_dofa, empresa):
    """Factor de tipo Fortaleza."""
    return FactorDOFA.objects.create(
        empresa=empresa,
        analisis=analisis_dofa,
        tipo=FactorDOFA.TipoFactor.FORTALEZA,
        descripcion='Equipo técnico altamente capacitado con certificaciones internacionales',
        area_afectada='Recursos Humanos',
        impacto=FactorDOFA.NivelImpacto.ALTO,
        evidencias='10 ingenieros certificados ISO 9001, 5 certificados en Six Sigma',
        orden=1
    )


@pytest.fixture
def oportunidad(db, analisis_dofa, empresa):
    """Factor de tipo Oportunidad."""
    return FactorDOFA.objects.create(
        empresa=empresa,
        analisis=analisis_dofa,
        tipo=FactorDOFA.TipoFactor.OPORTUNIDAD,
        descripcion='Creciente demanda de productos ecológicos y sostenibles en el mercado',
        area_afectada='Comercial',
        impacto=FactorDOFA.NivelImpacto.ALTO,
        evidencias='Estudio de mercado 2025 muestra crecimiento del 35% en productos verdes',
        orden=1
    )


@pytest.fixture
def debilidad(db, analisis_dofa, empresa):
    """Factor de tipo Debilidad."""
    return FactorDOFA.objects.create(
        empresa=empresa,
        analisis=analisis_dofa,
        tipo=FactorDOFA.TipoFactor.DEBILIDAD,
        descripcion='Infraestructura tecnológica obsoleta y sistemas no integrados',
        area_afectada='Tecnología',
        impacto=FactorDOFA.NivelImpacto.MEDIO,
        evidencias='Servidores con 7 años de antigüedad, 3 sistemas independientes',
        orden=1
    )


@pytest.fixture
def amenaza(db, analisis_dofa, empresa):
    """Factor de tipo Amenaza."""
    return FactorDOFA.objects.create(
        empresa=empresa,
        analisis=analisis_dofa,
        tipo=FactorDOFA.TipoFactor.AMENAZA,
        descripcion='Entrada de competidores internacionales con economías de escala',
        area_afectada='Competitividad',
        impacto=FactorDOFA.NivelImpacto.ALTO,
        evidencias='3 multinacionales anunciaron expansión a Colombia en 2025',
        orden=1
    )


@pytest.fixture
def estrategia_fo(db, analisis_dofa, empresa, responsable_user):
    """Estrategia tipo FO (Fortalezas-Oportunidades)."""
    return EstrategiaTOWS.objects.create(
        empresa=empresa,
        analisis=analisis_dofa,
        tipo=EstrategiaTOWS.TipoEstrategia.FO,
        descripcion='Desarrollar línea de productos ecológicos utilizando la expertise técnica',
        objetivo='Capturar 15% del mercado de productos sostenibles en 12 meses',
        responsable=responsable_user,
        fecha_implementacion=date.today() + timedelta(days=30),
        fecha_limite=date.today() + timedelta(days=365),
        prioridad=EstrategiaTOWS.Prioridad.ALTA,
        estado=EstrategiaTOWS.EstadoEstrategia.PROPUESTA,
        recursos_necesarios='$50M para I+D, equipo de 5 especialistas',
        indicadores_exito='Market share, satisfacción del cliente, ventas',
        progreso_porcentaje=0
    )


@pytest.fixture
def estrategia_da(db, analisis_dofa, empresa, responsable_user):
    """Estrategia tipo DA (Debilidades-Amenazas)."""
    return EstrategiaTOWS.objects.create(
        empresa=empresa,
        analisis=analisis_dofa,
        tipo=EstrategiaTOWS.TipoEstrategia.DA,
        descripcion='Modernizar infraestructura IT para competir con grandes jugadores',
        objetivo='Implementar ERP integrado y migrar a la nube en 6 meses',
        responsable=responsable_user,
        fecha_implementacion=date.today() + timedelta(days=15),
        fecha_limite=date.today() + timedelta(days=180),
        prioridad=EstrategiaTOWS.Prioridad.ALTA,
        estado=EstrategiaTOWS.EstadoEstrategia.EN_EJECUCION,
        recursos_necesarios='$80M para software y hardware, 2 consultores',
        indicadores_exito='Tiempo de procesamiento, integración de datos, ROI',
        progreso_porcentaje=25
    )


# ============================================================================
# FIXTURES ANÁLISIS PESTEL
# ============================================================================

@pytest.fixture
def analisis_pestel(db, empresa, responsable_user):
    """Análisis PESTEL básico."""
    return AnalisisPESTEL.objects.create(
        empresa=empresa,
        nombre='Análisis PESTEL Q1 2025',
        fecha_analisis=date.today(),
        periodo='2025-Q1',
        responsable=responsable_user,
        estado=AnalisisPESTEL.EstadoAnalisis.BORRADOR,
        conclusiones='Análisis preliminar del entorno externo'
    )


@pytest.fixture
def factor_politico(db, analisis_pestel, empresa):
    """Factor político del análisis PESTEL."""
    return FactorPESTEL.objects.create(
        empresa=empresa,
        analisis=analisis_pestel,
        tipo=FactorPESTEL.TipoFactor.POLITICO,
        descripcion='Nueva política de incentivos para industrias sostenibles',
        tendencia=FactorPESTEL.TendenciaFactor.MEJORANDO,
        impacto=FactorPESTEL.NivelImpacto.ALTO,
        probabilidad=FactorPESTEL.Probabilidad.ALTA,
        implicaciones='Acceso a financiación preferencial y exenciones tributarias',
        fuentes='Ministerio de Ambiente, Ley 2169 de 2021',
        orden=1
    )


@pytest.fixture
def factor_economico(db, analisis_pestel, empresa):
    """Factor económico del análisis PESTEL."""
    return FactorPESTEL.objects.create(
        empresa=empresa,
        analisis=analisis_pestel,
        tipo=FactorPESTEL.TipoFactor.ECONOMICO,
        descripcion='Aumento de tasas de interés y restricción crediticia',
        tendencia=FactorPESTEL.TendenciaFactor.EMPEORANDO,
        impacto=FactorPESTEL.NivelImpacto.MEDIO,
        probabilidad=FactorPESTEL.Probabilidad.ALTA,
        implicaciones='Mayor costo de capital para inversiones y expansión',
        fuentes='Banco de la República, Informe económico Q4 2024',
        orden=2
    )


@pytest.fixture
def factor_tecnologico(db, analisis_pestel, empresa):
    """Factor tecnológico del análisis PESTEL."""
    return FactorPESTEL.objects.create(
        empresa=empresa,
        analisis=analisis_pestel,
        tipo=FactorPESTEL.TipoFactor.TECNOLOGICO,
        descripcion='Avances en automatización industrial e IA',
        tendencia=FactorPESTEL.TendenciaFactor.MEJORANDO,
        impacto=FactorPESTEL.NivelImpacto.ALTO,
        probabilidad=FactorPESTEL.Probabilidad.MEDIA,
        implicaciones='Oportunidad de optimizar procesos y reducir costos operativos',
        fuentes='Gartner Report 2025, MIT Technology Review',
        orden=3
    )


# ============================================================================
# FIXTURES 5 FUERZAS DE PORTER
# ============================================================================

@pytest.fixture
def fuerza_rivalidad(db, empresa):
    """Fuerza de Porter: Rivalidad entre competidores."""
    return FuerzaPorter.objects.create(
        empresa=empresa,
        tipo=FuerzaPorter.TipoFuerza.RIVALIDAD,
        nivel=FuerzaPorter.NivelFuerza.ALTO,
        descripcion='Alta competencia en el sector con 15 competidores principales',
        factores=[
            'Fragmentación del mercado',
            'Productos commoditizados',
            'Bajas barreras de salida',
            'Alta capacidad instalada en la industria'
        ],
        fecha_analisis=date.today(),
        periodo='2025-Q1',
        implicaciones_estrategicas='Necesidad de diferenciación por calidad y servicio'
    )


@pytest.fixture
def fuerza_nuevos_entrantes(db, empresa):
    """Fuerza de Porter: Amenaza de nuevos entrantes."""
    return FuerzaPorter.objects.create(
        empresa=empresa,
        tipo=FuerzaPorter.TipoFuerza.NUEVOS_ENTRANTES,
        nivel=FuerzaPorter.NivelFuerza.MEDIO,
        descripcion='Barreras moderadas de entrada debido a inversión inicial requerida',
        factores=[
            'Inversión inicial en maquinaria: $200M',
            'Certificaciones ISO requeridas',
            'Relaciones establecidas con distribuidores',
            'Economías de escala de incumbentes'
        ],
        fecha_analisis=date.today(),
        periodo='2025-Q1',
        implicaciones_estrategicas='Mantener ventajas de costo y relaciones con canales'
    )


@pytest.fixture
def fuerza_proveedores(db, empresa):
    """Fuerza de Porter: Poder de negociación de proveedores."""
    return FuerzaPorter.objects.create(
        empresa=empresa,
        tipo=FuerzaPorter.TipoFuerza.PODER_PROVEEDORES,
        nivel=FuerzaPorter.NivelFuerza.BAJO,
        descripcion='Bajo poder de proveedores por múltiples opciones disponibles',
        factores=[
            'Materia prima commoditizada',
            '20+ proveedores alternativos',
            'Bajo costo de cambio',
            'Integración vertical posible'
        ],
        fecha_analisis=date.today(),
        periodo='2025-Q1',
        implicaciones_estrategicas='Oportunidad de negociar mejores términos y precios'
    )


# ============================================================================
# FIXTURES PARA TESTS DE API
# ============================================================================

@pytest.fixture
def api_client():
    """Cliente API de prueba."""
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def authenticated_client(api_client, user):
    """Cliente API autenticado con usuario básico."""
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def responsable_client(api_client, responsable_user):
    """Cliente API autenticado como responsable."""
    api_client.force_authenticate(user=responsable_user)
    return api_client
