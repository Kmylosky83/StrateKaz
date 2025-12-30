"""
Tests Unitarios - Modelos de Contexto Organizacional
=====================================================

Tests completos para los modelos del módulo de contexto organizacional:
- AnalisisDOFA y FactorDOFA
- EstrategiaTOWS
- AnalisisPESTEL y FactorPESTEL
- FuerzaPorter

Cobertura:
- Creación de instancias
- Validaciones de campos
- Relaciones entre modelos
- Métodos personalizados
- Constraints y unicidad
- Soft delete y auditoría

Autor: Sistema ERP StrateKaz
Fecha: 2025-12-26
"""
import pytest
from datetime import date, timedelta
from django.db import IntegrityError
from django.core.exceptions import ValidationError

from apps.motor_riesgos.contexto_organizacional.models import (
    AnalisisDOFA,
    FactorDOFA,
    EstrategiaTOWS,
    AnalisisPESTEL,
    FactorPESTEL,
    FuerzaPorter
)


# ============================================================================
# TESTS - ANÁLISIS DOFA
# ============================================================================

@pytest.mark.unit
class TestAnalisisDOFA:
    """Tests para el modelo AnalisisDOFA."""

    def test_crear_analisis_dofa_basico(self, empresa, responsable_user):
        """Test: Crear análisis DOFA con datos mínimos requeridos."""
        analisis = AnalisisDOFA.objects.create(
            empresa=empresa,
            nombre='DOFA Trimestral',
            fecha_analisis=date.today(),
            periodo='2025-Q1',
            responsable=responsable_user
        )

        assert analisis.id is not None
        assert analisis.nombre == 'DOFA Trimestral'
        assert analisis.estado == AnalisisDOFA.EstadoAnalisis.BORRADOR
        assert analisis.observaciones == ''
        assert analisis.aprobado_por is None
        assert analisis.fecha_aprobacion is None
        assert str(analisis) == "DOFA 2025-Q1 - DOFA Trimestral"

    def test_analisis_dofa_estados_validos(self, analisis_dofa):
        """Test: Transición de estados del análisis DOFA."""
        # Estado inicial
        assert analisis_dofa.estado == AnalisisDOFA.EstadoAnalisis.BORRADOR

        # En revisión
        analisis_dofa.estado = AnalisisDOFA.EstadoAnalisis.EN_REVISION
        analisis_dofa.save()
        analisis_dofa.refresh_from_db()
        assert analisis_dofa.estado == AnalisisDOFA.EstadoAnalisis.EN_REVISION

        # Aprobado
        analisis_dofa.estado = AnalisisDOFA.EstadoAnalisis.APROBADO
        analisis_dofa.save()
        assert analisis_dofa.estado == AnalisisDOFA.EstadoAnalisis.APROBADO

    def test_analisis_dofa_con_aprobacion(self, analisis_dofa, aprobador_user):
        """Test: Análisis DOFA con datos de aprobación."""
        analisis_dofa.estado = AnalisisDOFA.EstadoAnalisis.APROBADO
        analisis_dofa.aprobado_por = aprobador_user
        analisis_dofa.fecha_aprobacion = date.today()
        analisis_dofa.save()

        assert analisis_dofa.aprobado_por == aprobador_user
        assert analisis_dofa.fecha_aprobacion == date.today()
        assert analisis_dofa.estado == AnalisisDOFA.EstadoAnalisis.APROBADO

    def test_analisis_dofa_multiples_periodos(self, empresa, responsable_user):
        """Test: Crear múltiples análisis DOFA para diferentes periodos."""
        periodos = ['2025-Q1', '2025-Q2', '2025-Q3', '2025-Q4']

        for periodo in periodos:
            AnalisisDOFA.objects.create(
                empresa=empresa,
                nombre=f'DOFA {periodo}',
                fecha_analisis=date.today(),
                periodo=periodo,
                responsable=responsable_user
            )

        assert AnalisisDOFA.objects.filter(empresa=empresa).count() == 4

    def test_analisis_dofa_ordenamiento(self, empresa, responsable_user):
        """Test: Verificar ordenamiento por fecha_analisis descendente."""
        # Crear análisis en diferentes fechas
        AnalisisDOFA.objects.create(
            empresa=empresa,
            nombre='DOFA Antiguo',
            fecha_analisis=date(2024, 1, 1),
            periodo='2024-Q1',
            responsable=responsable_user
        )
        AnalisisDOFA.objects.create(
            empresa=empresa,
            nombre='DOFA Reciente',
            fecha_analisis=date(2025, 1, 1),
            periodo='2025-Q1',
            responsable=responsable_user
        )

        analisis_list = list(AnalisisDOFA.objects.all())
        assert analisis_list[0].nombre == 'DOFA Reciente'
        assert analisis_list[1].nombre == 'DOFA Antiguo'

    def test_analisis_dofa_filtro_por_empresa(self, empresa, empresa_secundaria, responsable_user):
        """Test: Aislamiento multi-tenant de análisis DOFA."""
        AnalisisDOFA.objects.create(
            empresa=empresa,
            nombre='DOFA Empresa 1',
            fecha_analisis=date.today(),
            periodo='2025-Q1',
            responsable=responsable_user
        )
        AnalisisDOFA.objects.create(
            empresa=empresa_secundaria,
            nombre='DOFA Empresa 2',
            fecha_analisis=date.today(),
            periodo='2025-Q1',
            responsable=responsable_user
        )

        assert AnalisisDOFA.objects.filter(empresa=empresa).count() == 1
        assert AnalisisDOFA.objects.filter(empresa=empresa_secundaria).count() == 1


# ============================================================================
# TESTS - FACTOR DOFA
# ============================================================================

@pytest.mark.unit
class TestFactorDOFA:
    """Tests para el modelo FactorDOFA."""

    def test_crear_fortaleza(self, analisis_dofa, empresa):
        """Test: Crear factor tipo Fortaleza."""
        factor = FactorDOFA.objects.create(
            empresa=empresa,
            analisis=analisis_dofa,
            tipo=FactorDOFA.TipoFactor.FORTALEZA,
            descripcion='Personal altamente capacitado',
            area_afectada='Recursos Humanos',
            impacto=FactorDOFA.NivelImpacto.ALTO,
            orden=1
        )

        assert factor.id is not None
        assert factor.tipo == FactorDOFA.TipoFactor.FORTALEZA
        assert factor.get_tipo_display() == 'Fortaleza'
        assert factor.impacto == FactorDOFA.NivelImpacto.ALTO
        assert 'Fortaleza:' in str(factor)

    def test_crear_oportunidad(self, analisis_dofa, empresa):
        """Test: Crear factor tipo Oportunidad."""
        factor = FactorDOFA.objects.create(
            empresa=empresa,
            analisis=analisis_dofa,
            tipo=FactorDOFA.TipoFactor.OPORTUNIDAD,
            descripcion='Mercado en crecimiento del 20% anual',
            impacto=FactorDOFA.NivelImpacto.ALTO,
            evidencias='Estudio de mercado DANE 2024',
            orden=1
        )

        assert factor.tipo == FactorDOFA.TipoFactor.OPORTUNIDAD
        assert factor.evidencias == 'Estudio de mercado DANE 2024'

    def test_crear_debilidad(self, analisis_dofa, empresa):
        """Test: Crear factor tipo Debilidad."""
        factor = FactorDOFA.objects.create(
            empresa=empresa,
            analisis=analisis_dofa,
            tipo=FactorDOFA.TipoFactor.DEBILIDAD,
            descripcion='Alta rotación de personal',
            area_afectada='Recursos Humanos',
            impacto=FactorDOFA.NivelImpacto.MEDIO,
            orden=1
        )

        assert factor.tipo == FactorDOFA.TipoFactor.DEBILIDAD
        assert factor.impacto == FactorDOFA.NivelImpacto.MEDIO

    def test_crear_amenaza(self, analisis_dofa, empresa):
        """Test: Crear factor tipo Amenaza."""
        factor = FactorDOFA.objects.create(
            empresa=empresa,
            analisis=analisis_dofa,
            tipo=FactorDOFA.TipoFactor.AMENAZA,
            descripcion='Competidores con precios más bajos',
            impacto=FactorDOFA.NivelImpacto.ALTO,
            orden=1
        )

        assert factor.tipo == FactorDOFA.TipoFactor.AMENAZA
        assert 'Amenaza:' in str(factor)

    def test_factores_multiples_por_analisis(self, analisis_dofa, empresa):
        """Test: Crear múltiples factores en un mismo análisis."""
        # Crear 2 fortalezas
        FactorDOFA.objects.create(
            empresa=empresa,
            analisis=analisis_dofa,
            tipo=FactorDOFA.TipoFactor.FORTALEZA,
            descripcion='Fortaleza 1',
            impacto=FactorDOFA.NivelImpacto.ALTO,
            orden=1
        )
        FactorDOFA.objects.create(
            empresa=empresa,
            analisis=analisis_dofa,
            tipo=FactorDOFA.TipoFactor.FORTALEZA,
            descripcion='Fortaleza 2',
            impacto=FactorDOFA.NivelImpacto.MEDIO,
            orden=2
        )

        # Crear 2 debilidades
        FactorDOFA.objects.create(
            empresa=empresa,
            analisis=analisis_dofa,
            tipo=FactorDOFA.TipoFactor.DEBILIDAD,
            descripcion='Debilidad 1',
            impacto=FactorDOFA.NivelImpacto.ALTO,
            orden=1
        )
        FactorDOFA.objects.create(
            empresa=empresa,
            analisis=analisis_dofa,
            tipo=FactorDOFA.TipoFactor.DEBILIDAD,
            descripcion='Debilidad 2',
            impacto=FactorDOFA.NivelImpacto.BAJO,
            orden=2
        )

        assert analisis_dofa.factores.count() == 4
        assert analisis_dofa.factores.filter(tipo=FactorDOFA.TipoFactor.FORTALEZA).count() == 2
        assert analisis_dofa.factores.filter(tipo=FactorDOFA.TipoFactor.DEBILIDAD).count() == 2

    def test_ordenamiento_factores(self, analisis_dofa, empresa):
        """Test: Verificar ordenamiento de factores por análisis, tipo y orden."""
        # Crear factores en orden específico
        for i in range(3):
            FactorDOFA.objects.create(
                empresa=empresa,
                analisis=analisis_dofa,
                tipo=FactorDOFA.TipoFactor.FORTALEZA,
                descripcion=f'Fortaleza {i+1}',
                impacto=FactorDOFA.NivelImpacto.ALTO,
                orden=i+1
            )

        factores = list(analisis_dofa.factores.all())
        assert factores[0].orden == 1
        assert factores[1].orden == 2
        assert factores[2].orden == 3

    def test_factor_eliminacion_cascada(self, analisis_dofa, fortaleza):
        """Test: Eliminar análisis DOFA elimina factores en cascada."""
        factor_id = fortaleza.id
        analisis_dofa.delete()

        assert not FactorDOFA.objects.filter(id=factor_id).exists()


# ============================================================================
# TESTS - ESTRATEGIA TOWS
# ============================================================================

@pytest.mark.unit
class TestEstrategiaTOWS:
    """Tests para el modelo EstrategiaTOWS."""

    def test_crear_estrategia_fo(self, analisis_dofa, empresa, responsable_user):
        """Test: Crear estrategia FO (Fortalezas-Oportunidades)."""
        estrategia = EstrategiaTOWS.objects.create(
            empresa=empresa,
            analisis=analisis_dofa,
            tipo=EstrategiaTOWS.TipoEstrategia.FO,
            descripcion='Expandir a nuevos mercados usando experiencia',
            objetivo='Incrementar market share en 20%',
            responsable=responsable_user,
            fecha_limite=date.today() + timedelta(days=180),
            prioridad=EstrategiaTOWS.Prioridad.ALTA
        )

        assert estrategia.tipo == EstrategiaTOWS.TipoEstrategia.FO
        assert estrategia.get_tipo_display() == 'FO - Fortalezas-Oportunidades (Ofensiva)'
        assert estrategia.estado == EstrategiaTOWS.EstadoEstrategia.PROPUESTA
        assert estrategia.progreso_porcentaje == 0

    def test_crear_estrategia_fa(self, analisis_dofa, empresa, responsable_user):
        """Test: Crear estrategia FA (Fortalezas-Amenazas)."""
        estrategia = EstrategiaTOWS.objects.create(
            empresa=empresa,
            analisis=analisis_dofa,
            tipo=EstrategiaTOWS.TipoEstrategia.FA,
            descripcion='Usar calidad superior para contrarrestar competencia',
            objetivo='Retener clientes clave',
            responsable=responsable_user,
            fecha_limite=date.today() + timedelta(days=90),
            prioridad=EstrategiaTOWS.Prioridad.ALTA
        )

        assert estrategia.tipo == EstrategiaTOWS.TipoEstrategia.FA
        assert 'FA -' in estrategia.get_tipo_display()

    def test_crear_estrategia_do(self, analisis_dofa, empresa, responsable_user):
        """Test: Crear estrategia DO (Debilidades-Oportunidades)."""
        estrategia = EstrategiaTOWS.objects.create(
            empresa=empresa,
            analisis=analisis_dofa,
            tipo=EstrategiaTOWS.TipoEstrategia.DO,
            descripcion='Capacitar personal para aprovechar nuevas tecnologías',
            objetivo='Mejorar productividad en 30%',
            responsable=responsable_user,
            fecha_limite=date.today() + timedelta(days=120),
            prioridad=EstrategiaTOWS.Prioridad.MEDIA
        )

        assert estrategia.tipo == EstrategiaTOWS.TipoEstrategia.DO
        assert estrategia.prioridad == EstrategiaTOWS.Prioridad.MEDIA

    def test_crear_estrategia_da(self, analisis_dofa, empresa, responsable_user):
        """Test: Crear estrategia DA (Debilidades-Amenazas)."""
        estrategia = EstrategiaTOWS.objects.create(
            empresa=empresa,
            analisis=analisis_dofa,
            tipo=EstrategiaTOWS.TipoEstrategia.DA,
            descripcion='Reducir costos para sobrevivir guerra de precios',
            objetivo='Disminuir costos operativos en 15%',
            responsable=responsable_user,
            fecha_limite=date.today() + timedelta(days=60),
            prioridad=EstrategiaTOWS.Prioridad.ALTA
        )

        assert estrategia.tipo == EstrategiaTOWS.TipoEstrategia.DA
        assert 'DA -' in estrategia.get_tipo_display()

    def test_estrategia_transicion_estados(self, estrategia_fo):
        """Test: Transición de estados de una estrategia."""
        # Estado inicial
        assert estrategia_fo.estado == EstrategiaTOWS.EstadoEstrategia.PROPUESTA

        # Aprobada
        estrategia_fo.estado = EstrategiaTOWS.EstadoEstrategia.APROBADA
        estrategia_fo.save()
        assert estrategia_fo.estado == EstrategiaTOWS.EstadoEstrategia.APROBADA

        # En ejecución
        estrategia_fo.estado = EstrategiaTOWS.EstadoEstrategia.EN_EJECUCION
        estrategia_fo.progreso_porcentaje = 50
        estrategia_fo.save()
        assert estrategia_fo.progreso_porcentaje == 50

        # Completada
        estrategia_fo.estado = EstrategiaTOWS.EstadoEstrategia.COMPLETADA
        estrategia_fo.progreso_porcentaje = 100
        estrategia_fo.save()
        assert estrategia_fo.estado == EstrategiaTOWS.EstadoEstrategia.COMPLETADA

    def test_estrategia_con_recursos_e_indicadores(self, analisis_dofa, empresa, responsable_user):
        """Test: Estrategia con recursos necesarios e indicadores."""
        estrategia = EstrategiaTOWS.objects.create(
            empresa=empresa,
            analisis=analisis_dofa,
            tipo=EstrategiaTOWS.TipoEstrategia.FO,
            descripcion='Lanzar nuevo producto',
            objetivo='Lograr $500M en ventas',
            responsable=responsable_user,
            fecha_limite=date.today() + timedelta(days=365),
            prioridad=EstrategiaTOWS.Prioridad.ALTA,
            recursos_necesarios='$200M presupuesto, 10 personas, 6 meses',
            indicadores_exito='Ventas, participación de mercado, satisfacción cliente'
        )

        assert estrategia.recursos_necesarios != ''
        assert estrategia.indicadores_exito != ''
        assert '$200M' in estrategia.recursos_necesarios
        assert 'Ventas' in estrategia.indicadores_exito

    def test_multiples_estrategias_por_analisis(self, analisis_dofa, empresa, responsable_user):
        """Test: Crear múltiples estrategias para un análisis."""
        tipos = [
            EstrategiaTOWS.TipoEstrategia.FO,
            EstrategiaTOWS.TipoEstrategia.FA,
            EstrategiaTOWS.TipoEstrategia.DO,
            EstrategiaTOWS.TipoEstrategia.DA
        ]

        for tipo in tipos:
            EstrategiaTOWS.objects.create(
                empresa=empresa,
                analisis=analisis_dofa,
                tipo=tipo,
                descripcion=f'Estrategia {tipo}',
                objetivo='Objetivo test',
                responsable=responsable_user,
                fecha_limite=date.today() + timedelta(days=90),
                prioridad=EstrategiaTOWS.Prioridad.MEDIA
            )

        assert analisis_dofa.estrategias.count() == 4

    def test_estrategia_ordenamiento_por_prioridad(self, analisis_dofa, empresa, responsable_user):
        """Test: Verificar ordenamiento por prioridad y fecha límite."""
        # Alta prioridad
        EstrategiaTOWS.objects.create(
            empresa=empresa,
            analisis=analisis_dofa,
            tipo=EstrategiaTOWS.TipoEstrategia.FO,
            descripcion='Estrategia urgente',
            objetivo='Objetivo',
            responsable=responsable_user,
            fecha_limite=date.today() + timedelta(days=30),
            prioridad=EstrategiaTOWS.Prioridad.ALTA
        )

        # Baja prioridad
        EstrategiaTOWS.objects.create(
            empresa=empresa,
            analisis=analisis_dofa,
            tipo=EstrategiaTOWS.TipoEstrategia.DO,
            descripcion='Estrategia no urgente',
            objetivo='Objetivo',
            responsable=responsable_user,
            fecha_limite=date.today() + timedelta(days=180),
            prioridad=EstrategiaTOWS.Prioridad.BAJA
        )

        estrategias = list(EstrategiaTOWS.objects.all())
        assert estrategias[0].prioridad == EstrategiaTOWS.Prioridad.ALTA


# ============================================================================
# TESTS - ANÁLISIS PESTEL
# ============================================================================

@pytest.mark.unit
class TestAnalisisPESTEL:
    """Tests para el modelo AnalisisPESTEL."""

    def test_crear_analisis_pestel_basico(self, empresa, responsable_user):
        """Test: Crear análisis PESTEL básico."""
        analisis = AnalisisPESTEL.objects.create(
            empresa=empresa,
            nombre='PESTEL Q1 2025',
            fecha_analisis=date.today(),
            periodo='2025-Q1',
            responsable=responsable_user
        )

        assert analisis.id is not None
        assert analisis.estado == AnalisisPESTEL.EstadoAnalisis.BORRADOR
        assert str(analisis) == "PESTEL 2025-Q1 - PESTEL Q1 2025"

    def test_analisis_pestel_con_conclusiones(self, analisis_pestel):
        """Test: Análisis PESTEL con conclusiones."""
        conclusiones = (
            "El entorno político es favorable con incentivos.\n"
            "El entorno económico presenta desafíos.\n"
            "Tecnología ofrece oportunidades de automatización."
        )
        analisis_pestel.conclusiones = conclusiones
        analisis_pestel.save()

        assert conclusiones in analisis_pestel.conclusiones

    def test_analisis_pestel_estados(self, analisis_pestel):
        """Test: Transición de estados de análisis PESTEL."""
        estados = [
            AnalisisPESTEL.EstadoAnalisis.BORRADOR,
            AnalisisPESTEL.EstadoAnalisis.EN_REVISION,
            AnalisisPESTEL.EstadoAnalisis.APROBADO,
            AnalisisPESTEL.EstadoAnalisis.VIGENTE,
            AnalisisPESTEL.EstadoAnalisis.ARCHIVADO
        ]

        for estado in estados:
            analisis_pestel.estado = estado
            analisis_pestel.save()
            analisis_pestel.refresh_from_db()
            assert analisis_pestel.estado == estado


# ============================================================================
# TESTS - FACTOR PESTEL
# ============================================================================

@pytest.mark.unit
class TestFactorPESTEL:
    """Tests para el modelo FactorPESTEL."""

    def test_crear_factor_politico(self, analisis_pestel, empresa):
        """Test: Crear factor político."""
        factor = FactorPESTEL.objects.create(
            empresa=empresa,
            analisis=analisis_pestel,
            tipo=FactorPESTEL.TipoFactor.POLITICO,
            descripcion='Estabilidad política favorable',
            tendencia=FactorPESTEL.TendenciaFactor.MEJORANDO,
            impacto=FactorPESTEL.NivelImpacto.ALTO,
            probabilidad=FactorPESTEL.Probabilidad.ALTA,
            orden=1
        )

        assert factor.tipo == FactorPESTEL.TipoFactor.POLITICO
        assert factor.get_tipo_display() == 'Político'
        assert factor.tendencia == FactorPESTEL.TendenciaFactor.MEJORANDO

    def test_crear_factor_economico(self, analisis_pestel, empresa):
        """Test: Crear factor económico."""
        factor = FactorPESTEL.objects.create(
            empresa=empresa,
            analisis=analisis_pestel,
            tipo=FactorPESTEL.TipoFactor.ECONOMICO,
            descripcion='Inflación controlada',
            tendencia=FactorPESTEL.TendenciaFactor.ESTABLE,
            impacto=FactorPESTEL.NivelImpacto.MEDIO,
            probabilidad=FactorPESTEL.Probabilidad.ALTA,
            orden=1
        )

        assert factor.tipo == FactorPESTEL.TipoFactor.ECONOMICO

    def test_crear_factor_social(self, analisis_pestel, empresa):
        """Test: Crear factor social."""
        factor = FactorPESTEL.objects.create(
            empresa=empresa,
            analisis=analisis_pestel,
            tipo=FactorPESTEL.TipoFactor.SOCIAL,
            descripcion='Cambio en preferencias del consumidor',
            tendencia=FactorPESTEL.TendenciaFactor.EMPEORANDO,
            impacto=FactorPESTEL.NivelImpacto.ALTO,
            probabilidad=FactorPESTEL.Probabilidad.MEDIA,
            orden=1
        )

        assert factor.tipo == FactorPESTEL.TipoFactor.SOCIAL

    def test_crear_factor_tecnologico(self, analisis_pestel, empresa):
        """Test: Crear factor tecnológico."""
        factor = FactorPESTEL.objects.create(
            empresa=empresa,
            analisis=analisis_pestel,
            tipo=FactorPESTEL.TipoFactor.TECNOLOGICO,
            descripcion='Digitalización acelerada',
            tendencia=FactorPESTEL.TendenciaFactor.MEJORANDO,
            impacto=FactorPESTEL.NivelImpacto.ALTO,
            probabilidad=FactorPESTEL.Probabilidad.ALTA,
            implicaciones='Necesidad de inversión en IT',
            fuentes='Gartner 2025',
            orden=1
        )

        assert factor.tipo == FactorPESTEL.TipoFactor.TECNOLOGICO
        assert factor.implicaciones != ''
        assert factor.fuentes != ''

    def test_crear_factor_ecologico(self, analisis_pestel, empresa):
        """Test: Crear factor ecológico."""
        factor = FactorPESTEL.objects.create(
            empresa=empresa,
            analisis=analisis_pestel,
            tipo=FactorPESTEL.TipoFactor.ECOLOGICO,
            descripcion='Regulaciones ambientales más estrictas',
            tendencia=FactorPESTEL.TendenciaFactor.EMPEORANDO,
            impacto=FactorPESTEL.NivelImpacto.MEDIO,
            probabilidad=FactorPESTEL.Probabilidad.ALTA,
            orden=1
        )

        assert factor.tipo == FactorPESTEL.TipoFactor.ECOLOGICO
        assert 'Ambiental' in factor.get_tipo_display()

    def test_crear_factor_legal(self, analisis_pestel, empresa):
        """Test: Crear factor legal."""
        factor = FactorPESTEL.objects.create(
            empresa=empresa,
            analisis=analisis_pestel,
            tipo=FactorPESTEL.TipoFactor.LEGAL,
            descripcion='Nueva ley laboral',
            tendencia=FactorPESTEL.TendenciaFactor.ESTABLE,
            impacto=FactorPESTEL.NivelImpacto.MEDIO,
            probabilidad=FactorPESTEL.Probabilidad.ALTA,
            orden=1
        )

        assert factor.tipo == FactorPESTEL.TipoFactor.LEGAL
        assert 'Regulatorio' in factor.get_tipo_display()

    def test_factores_pestel_completos(self, analisis_pestel, empresa):
        """Test: Crear análisis PESTEL completo con los 6 tipos de factores."""
        tipos = [
            (FactorPESTEL.TipoFactor.POLITICO, 'Factor político'),
            (FactorPESTEL.TipoFactor.ECONOMICO, 'Factor económico'),
            (FactorPESTEL.TipoFactor.SOCIAL, 'Factor social'),
            (FactorPESTEL.TipoFactor.TECNOLOGICO, 'Factor tecnológico'),
            (FactorPESTEL.TipoFactor.ECOLOGICO, 'Factor ecológico'),
            (FactorPESTEL.TipoFactor.LEGAL, 'Factor legal')
        ]

        for tipo, descripcion in tipos:
            FactorPESTEL.objects.create(
                empresa=empresa,
                analisis=analisis_pestel,
                tipo=tipo,
                descripcion=descripcion,
                tendencia=FactorPESTEL.TendenciaFactor.ESTABLE,
                impacto=FactorPESTEL.NivelImpacto.MEDIO,
                probabilidad=FactorPESTEL.Probabilidad.MEDIA,
                orden=1
            )

        assert analisis_pestel.factores.count() == 6
        assert analisis_pestel.factores.filter(tipo=FactorPESTEL.TipoFactor.POLITICO).exists()
        assert analisis_pestel.factores.filter(tipo=FactorPESTEL.TipoFactor.LEGAL).exists()


# ============================================================================
# TESTS - 5 FUERZAS DE PORTER
# ============================================================================

@pytest.mark.unit
class TestFuerzaPorter:
    """Tests para el modelo FuerzaPorter."""

    def test_crear_fuerza_rivalidad(self, empresa):
        """Test: Crear fuerza de rivalidad entre competidores."""
        fuerza = FuerzaPorter.objects.create(
            empresa=empresa,
            tipo=FuerzaPorter.TipoFuerza.RIVALIDAD,
            nivel=FuerzaPorter.NivelFuerza.ALTO,
            descripcion='Competencia intensa en el sector',
            fecha_analisis=date.today(),
            periodo='2025-Q1',
            factores=['Muchos competidores', 'Productos similares']
        )

        assert fuerza.tipo == FuerzaPorter.TipoFuerza.RIVALIDAD
        assert '1. Rivalidad' in fuerza.get_tipo_display()
        assert fuerza.nivel == FuerzaPorter.NivelFuerza.ALTO
        assert len(fuerza.factores) == 2

    def test_crear_fuerza_nuevos_entrantes(self, empresa):
        """Test: Crear fuerza de amenaza de nuevos entrantes."""
        fuerza = FuerzaPorter.objects.create(
            empresa=empresa,
            tipo=FuerzaPorter.TipoFuerza.NUEVOS_ENTRANTES,
            nivel=FuerzaPorter.NivelFuerza.BAJO,
            descripcion='Altas barreras de entrada',
            fecha_analisis=date.today(),
            periodo='2025-Q1',
            factores=['Capital inicial alto', 'Economías de escala'],
            implicaciones_estrategicas='Posición defendible'
        )

        assert fuerza.tipo == FuerzaPorter.TipoFuerza.NUEVOS_ENTRANTES
        assert fuerza.nivel == FuerzaPorter.NivelFuerza.BAJO

    def test_crear_fuerza_sustitutos(self, empresa):
        """Test: Crear fuerza de amenaza de productos sustitutos."""
        fuerza = FuerzaPorter.objects.create(
            empresa=empresa,
            tipo=FuerzaPorter.TipoFuerza.SUSTITUTOS,
            nivel=FuerzaPorter.NivelFuerza.MEDIO,
            descripcion='Existen alternativas pero con diferente valor',
            fecha_analisis=date.today(),
            periodo='2025-Q1',
            factores=['Productos alternativos disponibles', 'Costo de cambio moderado']
        )

        assert fuerza.tipo == FuerzaPorter.TipoFuerza.SUSTITUTOS
        assert '3. Amenaza de Productos' in fuerza.get_tipo_display()

    def test_crear_fuerza_poder_proveedores(self, empresa):
        """Test: Crear fuerza de poder de negociación de proveedores."""
        fuerza = FuerzaPorter.objects.create(
            empresa=empresa,
            tipo=FuerzaPorter.TipoFuerza.PODER_PROVEEDORES,
            nivel=FuerzaPorter.NivelFuerza.BAJO,
            descripcion='Múltiples proveedores disponibles',
            fecha_analisis=date.today(),
            periodo='2025-Q1',
            factores=['Muchos proveedores', 'Productos no diferenciados']
        )

        assert fuerza.tipo == FuerzaPorter.TipoFuerza.PODER_PROVEEDORES
        assert '4. Poder de Negociación de Proveedores' in fuerza.get_tipo_display()

    def test_crear_fuerza_poder_clientes(self, empresa):
        """Test: Crear fuerza de poder de negociación de clientes."""
        fuerza = FuerzaPorter.objects.create(
            empresa=empresa,
            tipo=FuerzaPorter.TipoFuerza.PODER_CLIENTES,
            nivel=FuerzaPorter.NivelFuerza.ALTO,
            descripcion='Clientes grandes con alto volumen de compra',
            fecha_analisis=date.today(),
            periodo='2025-Q1',
            factores=['Concentración de clientes', 'Sensibilidad al precio']
        )

        assert fuerza.tipo == FuerzaPorter.TipoFuerza.PODER_CLIENTES
        assert '5. Poder de Negociación de Clientes' in fuerza.get_tipo_display()

    def test_cinco_fuerzas_completas(self, empresa):
        """Test: Crear análisis completo de las 5 fuerzas de Porter."""
        tipos_fuerzas = [
            FuerzaPorter.TipoFuerza.RIVALIDAD,
            FuerzaPorter.TipoFuerza.NUEVOS_ENTRANTES,
            FuerzaPorter.TipoFuerza.SUSTITUTOS,
            FuerzaPorter.TipoFuerza.PODER_PROVEEDORES,
            FuerzaPorter.TipoFuerza.PODER_CLIENTES
        ]

        for tipo in tipos_fuerzas:
            FuerzaPorter.objects.create(
                empresa=empresa,
                tipo=tipo,
                nivel=FuerzaPorter.NivelFuerza.MEDIO,
                descripcion=f'Análisis de {tipo}',
                fecha_analisis=date.today(),
                periodo='2025-Q1',
                factores=['Factor 1', 'Factor 2']
            )

        assert FuerzaPorter.objects.filter(empresa=empresa).count() == 5

    def test_fuerza_porter_constraint_unicidad(self, empresa):
        """Test: Constraint de unicidad empresa-tipo-periodo."""
        # Crear primera fuerza
        FuerzaPorter.objects.create(
            empresa=empresa,
            tipo=FuerzaPorter.TipoFuerza.RIVALIDAD,
            nivel=FuerzaPorter.NivelFuerza.ALTO,
            descripcion='Primera fuerza',
            fecha_analisis=date.today(),
            periodo='2025-Q1',
            factores=[]
        )

        # Intentar crear duplicado debe fallar
        with pytest.raises(IntegrityError):
            FuerzaPorter.objects.create(
                empresa=empresa,
                tipo=FuerzaPorter.TipoFuerza.RIVALIDAD,
                nivel=FuerzaPorter.NivelFuerza.MEDIO,
                descripcion='Duplicado',
                fecha_analisis=date.today(),
                periodo='2025-Q1',
                factores=[]
            )

    def test_fuerza_porter_diferentes_periodos(self, empresa):
        """Test: Permitir misma fuerza en diferentes periodos."""
        periodos = ['2025-Q1', '2025-Q2', '2025-Q3']

        for periodo in periodos:
            FuerzaPorter.objects.create(
                empresa=empresa,
                tipo=FuerzaPorter.TipoFuerza.RIVALIDAD,
                nivel=FuerzaPorter.NivelFuerza.ALTO,
                descripcion='Rivalidad',
                fecha_analisis=date.today(),
                periodo=periodo,
                factores=[]
            )

        assert FuerzaPorter.objects.filter(
            empresa=empresa,
            tipo=FuerzaPorter.TipoFuerza.RIVALIDAD
        ).count() == 3
