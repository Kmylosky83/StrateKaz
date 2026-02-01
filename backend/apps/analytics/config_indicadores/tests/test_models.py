"""
Tests de Modelos para Config Indicadores - Analytics
====================================================

Tests unitarios para:
- CatalogoKPI: creación, validaciones, unique constraints
- FichaTecnicaKPI: relación OneToOne, variables JSON
- MetaKPI: rangos de valores, períodos
- ConfiguracionSemaforo: método obtener_color(), umbrales

Total de tests: 14
Cobertura: Todos los modelos y sus métodos principales

Autor: Sistema ERP StrateKaz
Fecha: 29 Diciembre 2025
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from django.db import IntegrityError
from django.core.exceptions import ValidationError

from apps.analytics.config_indicadores.models import (
    CatalogoKPI,
    FichaTecnicaKPI,
    MetaKPI,
    ConfiguracionSemaforo
)


@pytest.mark.django_db
class TestCatalogoKPI:
    """Tests para el modelo CatalogoKPI."""

    def test_crear_kpi_completo(self, empresa):
        """
        Test: Crear KPI con todos los campos requeridos.

        Given: Datos válidos de KPI
        When: Se crea el KPI
        Then: Debe crearse correctamente con estado activo
        """
        kpi = CatalogoKPI.objects.create(
            empresa_id=empresa.id,
            codigo='KPI-TEST-001',
            nombre='KPI de Test',
            descripcion='Descripción de prueba',
            tipo_indicador='eficiencia',
            categoria='sst',
            frecuencia_medicion='mensual',
            unidad_medida='%',
            es_mayor_mejor=True
        )

        assert kpi.pk is not None
        assert kpi.codigo == 'KPI-TEST-001'
        assert kpi.is_active is True
        assert kpi.es_mayor_mejor is True

    def test_str_catalogo_kpi(self, catalogo_kpi):
        """Test: Representación en string de KPI."""
        expected = f"{catalogo_kpi.codigo} - {catalogo_kpi.nombre}"
        assert str(catalogo_kpi) == expected

    def test_codigo_unico_por_empresa(self, empresa, catalogo_kpi):
        """
        Test: Código debe ser único por empresa.

        Given: KPI existente con código único
        When: Se intenta crear otro KPI con mismo código
        Then: Debe lanzar IntegrityError
        """
        with pytest.raises(IntegrityError):
            CatalogoKPI.objects.create(
                empresa_id=empresa.id,
                codigo='KPI-SST-001',  # Código duplicado
                nombre='Otro KPI',
                descripcion='Test',
                tipo_indicador='eficacia',
                categoria='calidad',
                frecuencia_medicion='mensual',
                unidad_medida='%'
            )

    def test_choices_tipo_indicador(self, catalogo_kpi):
        """Test: Validar choices de tipo de indicador."""
        tipos_validos = ['eficiencia', 'eficacia', 'efectividad']
        assert catalogo_kpi.tipo_indicador in tipos_validos

    def test_choices_categoria(self, catalogo_kpi):
        """Test: Validar choices de categoría."""
        categorias = ['sst', 'pesv', 'ambiental', 'calidad',
                      'financiero', 'operacional', 'rrhh', 'comercial']
        assert catalogo_kpi.categoria in categorias

    def test_choices_frecuencia_medicion(self, catalogo_kpi):
        """Test: Validar choices de frecuencia."""
        frecuencias = ['diario', 'semanal', 'quincenal', 'mensual',
                       'trimestral', 'semestral', 'anual']
        assert catalogo_kpi.frecuencia_medicion in frecuencias

    def test_es_mayor_mejor_flag(self, catalogo_kpi, catalogo_kpi_financiero):
        """
        Test: Flag es_mayor_mejor según tipo de KPI.

        Given: KPIs de diferentes tipos
        When: Se consulta es_mayor_mejor
        Then: Debe reflejar si valores altos son positivos
        """
        # SST: menor es mejor (menos accidentes)
        assert catalogo_kpi.es_mayor_mejor is False

        # Financiero: mayor es mejor (más margen)
        assert catalogo_kpi_financiero.es_mayor_mejor is True


@pytest.mark.django_db
class TestFichaTecnicaKPI:
    """Tests para el modelo FichaTecnicaKPI."""

    def test_crear_ficha_tecnica(self, empresa, catalogo_kpi, cargo_medicion, cargo_analisis):
        """
        Test: Crear ficha técnica completa.

        Given: KPI existente y cargos responsables
        When: Se crea la ficha técnica
        Then: Debe crearse correctamente
        """
        ficha = FichaTecnicaKPI.objects.create(
            empresa_id=empresa.id,
            kpi=catalogo_kpi,
            objetivo='Objetivo de prueba',
            formula='A / B * 100',
            variables={'A': 'Variable A', 'B': 'Variable B'},
            fuente_datos='Sistema X',
            responsable_medicion=cargo_medicion,
            responsable_analisis=cargo_analisis,
            fecha_inicio_medicion=date.today()
        )

        assert ficha.pk is not None
        assert ficha.kpi == catalogo_kpi
        assert isinstance(ficha.variables, dict)

    def test_str_ficha_tecnica(self, ficha_tecnica):
        """Test: Representación en string de ficha técnica."""
        expected = f"Ficha Técnica: {ficha_tecnica.kpi.nombre}"
        assert str(ficha_tecnica) == expected

    def test_relacion_one_to_one_kpi(self, ficha_tecnica, empresa, cargo_medicion, cargo_analisis):
        """
        Test: Relación OneToOne con KPI.

        Given: Ficha técnica existente vinculada a KPI
        When: Se intenta crear otra ficha para mismo KPI
        Then: Debe lanzar IntegrityError
        """
        with pytest.raises(IntegrityError):
            FichaTecnicaKPI.objects.create(
                empresa_id=empresa.id,
                kpi=ficha_tecnica.kpi,  # Mismo KPI
                objetivo='Otro objetivo',
                formula='X / Y',
                variables={},
                fuente_datos='Test',
                responsable_medicion=cargo_medicion,
                responsable_analisis=cargo_analisis,
                fecha_inicio_medicion=date.today()
            )

    def test_variables_json_field(self, ficha_tecnica):
        """
        Test: Campo variables como JSON.

        Given: Ficha técnica con variables definidas
        When: Se accede al campo variables
        Then: Debe ser un diccionario con las definiciones
        """
        assert isinstance(ficha_tecnica.variables, dict)
        assert 'numero_accidentes' in ficha_tecnica.variables
        assert 'total_hh' in ficha_tecnica.variables


@pytest.mark.django_db
class TestMetaKPI:
    """Tests para el modelo MetaKPI."""

    def test_crear_meta_kpi(self, empresa, catalogo_kpi):
        """
        Test: Crear meta de KPI con rangos.

        Given: KPI existente
        When: Se crea la meta con rangos de valores
        Then: Debe crearse correctamente
        """
        meta = MetaKPI.objects.create(
            empresa_id=empresa.id,
            kpi=catalogo_kpi,
            periodo_inicio=date(2025, 1, 1),
            periodo_fin=date(2025, 12, 31),
            valor_meta=Decimal('5.0'),
            valor_minimo_aceptable=Decimal('10.0'),
            valor_satisfactorio=Decimal('5.0'),
            valor_sobresaliente=Decimal('2.0')
        )

        assert meta.pk is not None
        assert meta.valor_meta == Decimal('5.0')
        assert meta.valor_sobresaliente < meta.valor_meta

    def test_str_meta_kpi(self, meta_kpi):
        """Test: Representación en string de meta."""
        expected = f"Meta {meta_kpi.kpi.codigo} ({meta_kpi.periodo_inicio} - {meta_kpi.periodo_fin})"
        assert str(meta_kpi) == expected

    def test_rangos_valores_meta(self, meta_kpi):
        """
        Test: Rangos de valores escalonados.

        Given: Meta con valores escalonados
        When: Se consultan los valores
        Then: Deben estar ordenados correctamente para "menor es mejor"
        """
        # Para KPI donde menor es mejor:
        # Sobresaliente < Satisfactorio = Meta < Mínimo Aceptable
        assert meta_kpi.valor_sobresaliente < meta_kpi.valor_satisfactorio
        assert meta_kpi.valor_satisfactorio == meta_kpi.valor_meta
        assert meta_kpi.valor_meta < meta_kpi.valor_minimo_aceptable


@pytest.mark.django_db
class TestConfiguracionSemaforo:
    """Tests para el modelo ConfiguracionSemaforo."""

    def test_crear_configuracion_semaforo(self, empresa, catalogo_kpi):
        """
        Test: Crear configuración de semáforo.

        Given: KPI existente
        When: Se crea configuración con umbrales
        Then: Debe crearse correctamente
        """
        config = ConfiguracionSemaforo.objects.create(
            empresa_id=empresa.id,
            kpi=catalogo_kpi,
            umbral_verde_min=Decimal('0'),
            umbral_verde_max=Decimal('5.0'),
            umbral_amarillo_min=Decimal('5.01'),
            umbral_amarillo_max=Decimal('10.0'),
            umbral_rojo_min=Decimal('10.01'),
            umbral_rojo_max=None
        )

        assert config.pk is not None
        assert config.kpi == catalogo_kpi

    def test_str_configuracion_semaforo(self, semaforo_config):
        """Test: Representación en string de configuración."""
        expected = f"Semáforo: {semaforo_config.kpi.nombre}"
        assert str(semaforo_config) == expected

    def test_obtener_color_verde(self, semaforo_config):
        """
        Test: Método obtener_color retorna verde.

        Given: Valor dentro del rango verde
        When: Se llama obtener_color()
        Then: Debe retornar 'verde'
        """
        assert semaforo_config.obtener_color(Decimal('3.5')) == 'verde'
        assert semaforo_config.obtener_color(Decimal('0')) == 'verde'
        assert semaforo_config.obtener_color(Decimal('5.0')) == 'verde'

    def test_obtener_color_amarillo(self, semaforo_config):
        """
        Test: Método obtener_color retorna amarillo.

        Given: Valor dentro del rango amarillo
        When: Se llama obtener_color()
        Then: Debe retornar 'amarillo'
        """
        assert semaforo_config.obtener_color(Decimal('7.5')) == 'amarillo'
        assert semaforo_config.obtener_color(Decimal('5.01')) == 'amarillo'
        assert semaforo_config.obtener_color(Decimal('10.0')) == 'amarillo'

    def test_obtener_color_rojo(self, semaforo_config):
        """
        Test: Método obtener_color retorna rojo.

        Given: Valor fuera de rangos verde y amarillo
        When: Se llama obtener_color()
        Then: Debe retornar 'rojo'
        """
        assert semaforo_config.obtener_color(Decimal('15.0')) == 'rojo'
        assert semaforo_config.obtener_color(Decimal('10.01')) == 'rojo'
        assert semaforo_config.obtener_color(Decimal('100.0')) == 'rojo'

    def test_obtener_color_sin_limite_superior(self, semaforo_config_financiero):
        """
        Test: Semáforo sin umbral superior (mayor es mejor).

        Given: Configuración donde verde no tiene límite superior
        When: Se evalúan valores altos
        Then: Deben ser verdes si superan el umbral mínimo
        """
        # Verde sin límite superior (>= 30)
        assert semaforo_config_financiero.obtener_color(Decimal('30.0')) == 'verde'
        assert semaforo_config_financiero.obtener_color(Decimal('50.0')) == 'verde'
        assert semaforo_config_financiero.obtener_color(Decimal('100.0')) == 'verde'

        # Amarillo (20-29.99)
        assert semaforo_config_financiero.obtener_color(Decimal('25.0')) == 'amarillo'

        # Rojo (< 20)
        assert semaforo_config_financiero.obtener_color(Decimal('15.0')) == 'rojo'


@pytest.mark.django_db
class TestMetadataModels:
    """Tests para metadata y campos comunes de los modelos."""

    def test_db_table_names(self):
        """Test: Nombres de tablas en base de datos."""
        assert CatalogoKPI._meta.db_table == 'analytics_catalogo_kpi'
        assert FichaTecnicaKPI._meta.db_table == 'analytics_ficha_tecnica_kpi'
        assert MetaKPI._meta.db_table == 'analytics_meta_kpi'
        assert ConfiguracionSemaforo._meta.db_table == 'analytics_configuracion_semaforo'

    def test_verbose_names(self):
        """Test: Nombres verbose de modelos."""
        assert CatalogoKPI._meta.verbose_name == 'Catálogo KPI'
        assert CatalogoKPI._meta.verbose_name_plural == 'Catálogo de KPIs'
        assert FichaTecnicaKPI._meta.verbose_name == 'Ficha Técnica KPI'
        assert MetaKPI._meta.verbose_name == 'Meta KPI'

    def test_ordering(self):
        """Test: Ordenamiento de modelos."""
        assert CatalogoKPI._meta.ordering == ['categoria', 'codigo']
        assert MetaKPI._meta.ordering == ['kpi', '-periodo_inicio']

    def test_indexes_empresa_id(self):
        """Test: Índices en empresa_id para multi-tenant."""
        kpi_indexes = [idx.fields for idx in CatalogoKPI._meta.indexes]
        assert ['empresa', 'categoria'] in kpi_indexes
        assert ['empresa', 'tipo_indicador'] in kpi_indexes

    def test_multi_tenant_empresa_id(self, catalogo_kpi, empresa):
        """Test: Campo empresa_id para multi-tenancy."""
        assert catalogo_kpi.empresa_id == empresa.id
        assert isinstance(catalogo_kpi.empresa_id, int)
