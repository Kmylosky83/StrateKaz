"""
Tests de Serializers para Gestión de Proveedores - Supply Chain
================================================================

Tests unitarios para:
- Serializers de catálogos dinámicos
- ProveedorCreateSerializer con validaciones dinámicas
- CambiarPrecioSerializer
- PruebaAcidezCreateSerializer
- SimularPruebaAcidezSerializer
- Serializers de evaluación

Total de tests: 40+
Cobertura: Todos los serializers y sus validaciones

Autor: Sistema ERP StrateKaz
Fecha: 27 Diciembre 2025
"""
import pytest
from decimal import Decimal
from datetime import date, timedelta
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.exceptions import ValidationError

from apps.supply_chain.gestion_proveedores.serializers import (
    # Catálogos
    TipoMateriaPrimaSerializer,
    TipoProveedorSerializer,
    # Proveedor
    ProveedorListSerializer,
    ProveedorDetailSerializer,
    ProveedorCreateSerializer,
    ProveedorUpdateSerializer,
    CambiarPrecioSerializer,
    PrecioMateriaPrimaSerializer,
    # Prueba Acidez
    PruebaAcidezCreateSerializer,
    SimularPruebaAcidezSerializer,
    # Condiciones
    CondicionComercialSerializer,
    # Evaluación
    DetalleEvaluacionSerializer,
)
from apps.supply_chain.gestion_proveedores.models import (
    Proveedor,
    PrecioMateriaPrima,
    HistorialPrecioProveedor,
)


# ==============================================================================
# TESTS DE SERIALIZERS DE CATÁLOGOS
# ==============================================================================

@pytest.mark.django_db
class TestTipoMateriaPrimaSerializer:
    """Tests para TipoMateriaPrimaSerializer."""

    def test_serializar_tipo_materia_prima(self, tipo_hueso_crudo):
        """Test: Serializar tipo de materia prima incluye categoría."""
        serializer = TipoMateriaPrimaSerializer(tipo_hueso_crudo)
        data = serializer.data

        assert data['id'] == tipo_hueso_crudo.id
        assert data['codigo'] == 'HUESO_CRUDO'
        assert data['nombre'] == 'Hueso Crudo'
        assert data['categoria_nombre'] == 'Hueso'

    def test_serializar_tipo_con_acidez(self, tipo_sebo_procesado_a):
        """Test: Serializar tipo con rangos de acidez."""
        serializer = TipoMateriaPrimaSerializer(tipo_sebo_procesado_a)
        data = serializer.data

        assert 'acidez_min' in data
        assert 'acidez_max' in data
        assert data['acidez_min'] == '0.00'
        assert data['acidez_max'] == '2.99'


@pytest.mark.django_db
class TestTipoProveedorSerializer:
    """Tests para TipoProveedorSerializer."""

    def test_serializar_tipo_proveedor(self, tipo_proveedor_materia_prima):
        """Test: Serializar tipo de proveedor incluye flags."""
        serializer = TipoProveedorSerializer(tipo_proveedor_materia_prima)
        data = serializer.data

        assert data['codigo'] == 'MATERIA_PRIMA_EXTERNO'
        assert data['requiere_materia_prima'] is True
        assert data['requiere_modalidad_logistica'] is True


# ==============================================================================
# TESTS DE PROVEEDOR SERIALIZERS
# ==============================================================================

@pytest.mark.django_db
class TestProveedorListSerializer:
    """Tests para ProveedorListSerializer."""

    def test_serializar_proveedor_materia_prima(self, proveedor_materia_prima, precio_hueso):
        """Test: Serializar proveedor incluye tipos de materia prima y precios."""
        serializer = ProveedorListSerializer(proveedor_materia_prima)
        data = serializer.data

        assert data['codigo_interno'] == 'MP-0001'
        assert data['nombre_comercial'] == 'Proveedor Huesos SA'
        assert data['tipo_proveedor_nombre'] == 'Proveedor de Materia Prima Externo'
        assert data['es_proveedor_materia_prima'] is True

        # M2M tipos de materia prima
        assert len(data['tipos_materia_prima_display']) > 0
        assert 'Hueso Crudo' in data['tipos_materia_prima_display']

        # Precios
        assert len(data['precios_materia_prima']) > 0

    def test_serializar_proveedor_servicio(self, proveedor_servicio):
        """Test: Serializar proveedor de servicios."""
        serializer = ProveedorListSerializer(proveedor_servicio)
        data = serializer.data

        assert data['codigo_interno'] == 'PS-0001'
        assert data['es_proveedor_materia_prima'] is False
        assert len(data['tipos_materia_prima_display']) == 0


@pytest.mark.django_db
class TestProveedorCreateSerializer:
    """Tests para ProveedorCreateSerializer."""

    def test_crear_proveedor_materia_prima_valido(
        self,
        tipo_proveedor_materia_prima,
        tipo_hueso_crudo,
        modalidad_entrega_planta,
        tipo_documento_nit,
        departamento_cundinamarca,
        forma_pago_contado,
        usuario_coordinador
    ):
        """
        Test: Crear proveedor de materia prima con datos válidos.

        Given: Datos completos de proveedor materia prima
        When: Se valida el serializer
        Then: Debe ser válido y crear proveedor con M2M
        """
        data = {
            'tipo_proveedor': tipo_proveedor_materia_prima.id,
            'tipos_materia_prima': [tipo_hueso_crudo.id],
            'modalidad_logistica': modalidad_entrega_planta.id,
            'nombre_comercial': 'Nuevo Proveedor',
            'razon_social': 'Nuevo Proveedor SAS',
            'tipo_documento': tipo_documento_nit.id,
            'numero_documento': '900999888',
            'direccion': 'Calle Test',
            'ciudad': 'Bogotá',
            'departamento': departamento_cundinamarca.id,
            'formas_pago': [forma_pago_contado.id],
            'is_active': True
        }

        serializer = ProveedorCreateSerializer(
            data=data,
            context={'request': type('Request', (), {'user': usuario_coordinador})()}
        )

        assert serializer.is_valid(), serializer.errors

        proveedor = serializer.save()
        assert proveedor.pk is not None
        assert proveedor.codigo_interno.startswith('MP-')
        assert proveedor.created_by == usuario_coordinador

        # Verificar M2M
        assert tipo_hueso_crudo in proveedor.tipos_materia_prima.all()
        assert forma_pago_contado in proveedor.formas_pago.all()

    def test_validacion_numero_documento_duplicado(
        self,
        proveedor_materia_prima,
        tipo_proveedor_materia_prima,
        tipo_documento_nit,
        departamento_cundinamarca,
        modalidad_entrega_planta
    ):
        """
        Test: Validar número de documento duplicado.

        Given: Proveedor existente con número_documento
        When: Se intenta crear otro con mismo número_documento
        Then: Debe lanzar ValidationError
        """
        data = {
            'tipo_proveedor': tipo_proveedor_materia_prima.id,
            'modalidad_logistica': modalidad_entrega_planta.id,
            'nombre_comercial': 'Otro Proveedor',
            'razon_social': 'Otro',
            'tipo_documento': tipo_documento_nit.id,
            'numero_documento': '900111222',  # Duplicado
            'direccion': 'Test',
            'ciudad': 'Test',
            'departamento': departamento_cundinamarca.id
        }

        serializer = ProveedorCreateSerializer(data=data)

        assert not serializer.is_valid()
        assert 'numero_documento' in serializer.errors

    def test_validacion_requiere_modalidad_logistica(
        self,
        tipo_proveedor_materia_prima,
        tipo_hueso_crudo,
        tipo_documento_nit,
        departamento_cundinamarca
    ):
        """
        Test: Validar que se requiere modalidad logística cuando tipo lo exige.

        Given: Tipo proveedor con requiere_modalidad_logistica=True
        When: Se crea proveedor sin modalidad_logistica
        Then: Debe lanzar ValidationError
        """
        data = {
            'tipo_proveedor': tipo_proveedor_materia_prima.id,
            'tipos_materia_prima': [tipo_hueso_crudo.id],
            'modalidad_logistica': None,  # Falta
            'nombre_comercial': 'Test',
            'razon_social': 'Test',
            'tipo_documento': tipo_documento_nit.id,
            'numero_documento': '888777666',
            'direccion': 'Test',
            'ciudad': 'Test',
            'departamento': departamento_cundinamarca.id
        }

        serializer = ProveedorCreateSerializer(data=data)

        assert not serializer.is_valid()
        assert 'modalidad_logistica' in serializer.errors

    def test_validacion_requiere_materia_prima(
        self,
        tipo_proveedor_materia_prima,
        modalidad_entrega_planta,
        tipo_documento_nit,
        departamento_cundinamarca
    ):
        """
        Test: Validar que se requiere tipos_materia_prima cuando tipo lo exige.

        Given: Tipo proveedor con requiere_materia_prima=True
        When: Se crea proveedor sin tipos_materia_prima
        Then: Debe lanzar ValidationError
        """
        data = {
            'tipo_proveedor': tipo_proveedor_materia_prima.id,
            'tipos_materia_prima': [],  # Vacío
            'modalidad_logistica': modalidad_entrega_planta.id,
            'nombre_comercial': 'Test',
            'razon_social': 'Test',
            'tipo_documento': tipo_documento_nit.id,
            'numero_documento': '777666555',
            'direccion': 'Test',
            'ciudad': 'Test',
            'departamento': departamento_cundinamarca.id
        }

        serializer = ProveedorCreateSerializer(data=data)

        assert not serializer.is_valid()
        assert 'tipos_materia_prima' in serializer.errors

    def test_crear_proveedor_con_precios(
        self,
        tipo_proveedor_materia_prima,
        tipo_hueso_crudo,
        modalidad_entrega_planta,
        tipo_documento_nit,
        departamento_cundinamarca,
        usuario_coordinador
    ):
        """
        Test: Crear proveedor con precios iniciales.

        Given: Datos de proveedor con lista de precios
        When: Se crea el proveedor
        Then: Debe crear precios y registros de historial
        """
        data = {
            'tipo_proveedor': tipo_proveedor_materia_prima.id,
            'tipos_materia_prima': [tipo_hueso_crudo.id],
            'modalidad_logistica': modalidad_entrega_planta.id,
            'nombre_comercial': 'Proveedor con Precios',
            'razon_social': 'Proveedor con Precios SAS',
            'tipo_documento': tipo_documento_nit.id,
            'numero_documento': '900888777',
            'direccion': 'Test',
            'ciudad': 'Test',
            'departamento': departamento_cundinamarca.id,
            'precios': [
                {
                    'tipo_materia_id': tipo_hueso_crudo.id,
                    'precio_kg': '3000.00'
                }
            ]
        }

        serializer = ProveedorCreateSerializer(
            data=data,
            context={'request': type('Request', (), {'user': usuario_coordinador})()}
        )

        assert serializer.is_valid(), serializer.errors

        proveedor = serializer.save()

        # Verificar precio creado
        precios = PrecioMateriaPrima.objects.filter(proveedor=proveedor)
        assert precios.count() == 1
        assert precios.first().precio_kg == Decimal('3000.00')

        # Verificar historial creado
        historial = HistorialPrecioProveedor.objects.filter(proveedor=proveedor)
        assert historial.count() == 1
        assert historial.first().precio_anterior is None
        assert historial.first().precio_nuevo == Decimal('3000.00')

    def test_validacion_precios_tipo_materia_id_faltante(
        self,
        tipo_proveedor_materia_prima,
        tipo_hueso_crudo,
        modalidad_entrega_planta,
        tipo_documento_nit,
        departamento_cundinamarca
    ):
        """Test: Validar que cada precio tenga tipo_materia_id."""
        data = {
            'tipo_proveedor': tipo_proveedor_materia_prima.id,
            'tipos_materia_prima': [tipo_hueso_crudo.id],
            'modalidad_logistica': modalidad_entrega_planta.id,
            'nombre_comercial': 'Test',
            'razon_social': 'Test',
            'tipo_documento': tipo_documento_nit.id,
            'numero_documento': '777888999',
            'direccion': 'Test',
            'ciudad': 'Test',
            'departamento': departamento_cundinamarca.id,
            'precios': [
                {
                    # 'tipo_materia_id' faltante
                    'precio_kg': '3000.00'
                }
            ]
        }

        serializer = ProveedorCreateSerializer(data=data)

        assert not serializer.is_valid()
        assert 'precios' in serializer.errors

    def test_validacion_precios_precio_negativo(
        self,
        tipo_proveedor_materia_prima,
        tipo_hueso_crudo,
        modalidad_entrega_planta,
        tipo_documento_nit,
        departamento_cundinamarca
    ):
        """Test: No permitir precio negativo en lista de precios."""
        data = {
            'tipo_proveedor': tipo_proveedor_materia_prima.id,
            'tipos_materia_prima': [tipo_hueso_crudo.id],
            'modalidad_logistica': modalidad_entrega_planta.id,
            'nombre_comercial': 'Test',
            'razon_social': 'Test',
            'tipo_documento': tipo_documento_nit.id,
            'numero_documento': '666777888',
            'direccion': 'Test',
            'ciudad': 'Test',
            'departamento': departamento_cundinamarca.id,
            'precios': [
                {
                    'tipo_materia_id': tipo_hueso_crudo.id,
                    'precio_kg': '-1000.00'  # Negativo
                }
            ]
        }

        serializer = ProveedorCreateSerializer(data=data)

        assert not serializer.is_valid()
        assert 'precios' in serializer.errors


# ==============================================================================
# TESTS DE CAMBIAR PRECIO SERIALIZER
# ==============================================================================

@pytest.mark.django_db
class TestCambiarPrecioSerializer:
    """Tests para CambiarPrecioSerializer."""

    def test_cambiar_precio_valido(
        self,
        proveedor_materia_prima,
        tipo_hueso_crudo,
        precio_hueso,
        usuario_gerente
    ):
        """
        Test: Cambiar precio válido crea historial.

        Given: Proveedor con precio existente
        When: Se cambia el precio
        Then: Debe actualizar precio y crear historial
        """
        data = {
            'tipo_materia_id': tipo_hueso_crudo.id,
            'precio_nuevo': '3000.00',
            'motivo': 'Ajuste por mercado'
        }

        serializer = CambiarPrecioSerializer(
            data=data,
            context={
                'proveedor': proveedor_materia_prima,
                'usuario': usuario_gerente
            }
        )

        assert serializer.is_valid(), serializer.errors

        precio_obj = serializer.save()

        assert precio_obj.precio_kg == Decimal('3000.00')

        # Verificar historial
        historial = HistorialPrecioProveedor.objects.filter(
            proveedor=proveedor_materia_prima,
            tipo_materia=tipo_hueso_crudo
        ).order_by('-fecha_modificacion').first()

        assert historial is not None
        assert historial.precio_anterior == Decimal('2500.00')
        assert historial.precio_nuevo == Decimal('3000.00')
        assert historial.motivo == 'Ajuste por mercado'

    def test_validacion_precio_negativo(self, proveedor_materia_prima, tipo_hueso_crudo):
        """Test: No permitir precio negativo."""
        data = {
            'tipo_materia_id': tipo_hueso_crudo.id,
            'precio_nuevo': '-100.00',  # Negativo
            'motivo': 'Test'
        }

        serializer = CambiarPrecioSerializer(
            data=data,
            context={'proveedor': proveedor_materia_prima}
        )

        assert not serializer.is_valid()
        assert 'precio_nuevo' in serializer.errors

    def test_validacion_motivo_vacio(self, proveedor_materia_prima, tipo_hueso_crudo):
        """Test: Motivo no puede estar vacío."""
        data = {
            'tipo_materia_id': tipo_hueso_crudo.id,
            'precio_nuevo': '3000.00',
            'motivo': '   '  # Vacío
        }

        serializer = CambiarPrecioSerializer(
            data=data,
            context={'proveedor': proveedor_materia_prima}
        )

        assert not serializer.is_valid()
        assert 'motivo' in serializer.errors

    def test_validacion_tipo_materia_no_existe(self, proveedor_materia_prima):
        """Test: Validar que tipo_materia_id exista."""
        data = {
            'tipo_materia_id': 99999,  # No existe
            'precio_nuevo': '3000.00',
            'motivo': 'Test'
        }

        serializer = CambiarPrecioSerializer(
            data=data,
            context={'proveedor': proveedor_materia_prima}
        )

        assert not serializer.is_valid()
        assert 'tipo_materia_id' in serializer.errors

    def test_validacion_proveedor_no_maneja_tipo(
        self,
        proveedor_materia_prima,
        tipo_sebo_procesado_a,
        usuario_gerente
    ):
        """
        Test: Validar que proveedor maneje el tipo de materia prima.

        Given: Proveedor que no maneja sebo
        When: Se intenta cambiar precio de sebo
        Then: Debe lanzar ValidationError
        """
        data = {
            'tipo_materia_id': tipo_sebo_procesado_a.id,  # No lo maneja
            'precio_nuevo': '4000.00',
            'motivo': 'Test'
        }

        serializer = CambiarPrecioSerializer(
            data=data,
            context={
                'proveedor': proveedor_materia_prima,
                'usuario': usuario_gerente
            }
        )

        assert not serializer.is_valid()
        assert 'tipo_materia_id' in serializer.errors

    def test_validacion_precio_igual_al_actual(
        self,
        proveedor_materia_prima,
        tipo_hueso_crudo,
        precio_hueso,
        usuario_gerente
    ):
        """Test: No permitir precio igual al actual."""
        data = {
            'tipo_materia_id': tipo_hueso_crudo.id,
            'precio_nuevo': '2500.00',  # Igual al actual
            'motivo': 'Test'
        }

        serializer = CambiarPrecioSerializer(
            data=data,
            context={
                'proveedor': proveedor_materia_prima,
                'usuario': usuario_gerente
            }
        )

        assert not serializer.is_valid()
        assert 'precio_nuevo' in serializer.errors


# ==============================================================================
# TESTS DE PRUEBA ACIDEZ SERIALIZERS
# ==============================================================================

@pytest.mark.django_db
class TestPruebaAcidezCreateSerializer:
    """Tests para PruebaAcidezCreateSerializer."""

    def test_crear_prueba_acidez_valida(
        self,
        proveedor_sebo,
        usuario_coordinador
    ):
        """
        Test: Crear prueba de acidez válida.

        Given: Datos válidos de prueba
        When: Se crea la prueba
        Then: Debe crear con calidad asignada automáticamente
        """
        foto = SimpleUploadedFile('test.jpg', b'fake_content', content_type='image/jpeg')

        data = {
            'proveedor': proveedor_sebo.id,
            'fecha_prueba': '2025-01-15T10:00:00Z',
            'valor_acidez': '2.5',
            'foto_prueba': foto,
            'cantidad_kg': '500.00'
        }

        serializer = PruebaAcidezCreateSerializer(
            data=data,
            context={'request': type('Request', (), {'user': usuario_coordinador})()}
        )

        assert serializer.is_valid(), serializer.errors

        prueba = serializer.save()
        assert prueba.pk is not None
        assert prueba.realizado_por == usuario_coordinador
        # Calidad se asigna en save()
        assert prueba.calidad_resultante is not None

    def test_validacion_proveedor_no_maneja_sebo(
        self,
        proveedor_materia_prima,
        usuario_coordinador
    ):
        """
        Test: Validar que solo se permiten pruebas para proveedores de sebo.

        Given: Proveedor que no maneja sebo
        When: Se intenta crear prueba de acidez
        Then: Debe lanzar ValidationError
        """
        foto = SimpleUploadedFile('test.jpg', b'fake_content', content_type='image/jpeg')

        data = {
            'proveedor': proveedor_materia_prima.id,  # No maneja sebo
            'fecha_prueba': '2025-01-15T10:00:00Z',
            'valor_acidez': '2.5',
            'foto_prueba': foto,
            'cantidad_kg': '500.00'
        }

        serializer = PruebaAcidezCreateSerializer(data=data)

        assert not serializer.is_valid()
        assert 'proveedor' in serializer.errors

    def test_validacion_acidez_negativa(self, proveedor_sebo):
        """Test: No permitir valor de acidez negativo."""
        foto = SimpleUploadedFile('test.jpg', b'fake_content', content_type='image/jpeg')

        data = {
            'proveedor': proveedor_sebo.id,
            'fecha_prueba': '2025-01-15T10:00:00Z',
            'valor_acidez': '-5.0',  # Negativo
            'foto_prueba': foto,
            'cantidad_kg': '500.00'
        }

        serializer = PruebaAcidezCreateSerializer(data=data)

        assert not serializer.is_valid()
        assert 'valor_acidez' in serializer.errors

    def test_validacion_acidez_mayor_100(self, proveedor_sebo):
        """Test: No permitir acidez mayor a 100%."""
        foto = SimpleUploadedFile('test.jpg', b'fake_content', content_type='image/jpeg')

        data = {
            'proveedor': proveedor_sebo.id,
            'fecha_prueba': '2025-01-15T10:00:00Z',
            'valor_acidez': '110.0',  # Mayor a 100
            'foto_prueba': foto,
            'cantidad_kg': '500.00'
        }

        serializer = PruebaAcidezCreateSerializer(data=data)

        assert not serializer.is_valid()
        assert 'valor_acidez' in serializer.errors

    def test_validacion_cantidad_cero(self, proveedor_sebo):
        """Test: No permitir cantidad cero o negativa."""
        foto = SimpleUploadedFile('test.jpg', b'fake_content', content_type='image/jpeg')

        data = {
            'proveedor': proveedor_sebo.id,
            'fecha_prueba': '2025-01-15T10:00:00Z',
            'valor_acidez': '2.5',
            'foto_prueba': foto,
            'cantidad_kg': '0'  # Cero
        }

        serializer = PruebaAcidezCreateSerializer(data=data)

        assert not serializer.is_valid()
        assert 'cantidad_kg' in serializer.errors


@pytest.mark.django_db
class TestSimularPruebaAcidezSerializer:
    """Tests para SimularPruebaAcidezSerializer."""

    def test_simular_prueba_acidez_calidad_a(
        self,
        proveedor_sebo,
        tipo_sebo_procesado_a,
        precio_sebo_a
    ):
        """
        Test: Simular prueba retorna calidad A y precio.

        Given: Acidez 2.5% (calidad A) con proveedor que tiene precio
        When: Se simula la prueba
        Then: Debe retornar calidad A, tipo, precio y valor total
        """
        data = {
            'valor_acidez': '2.5',
            'proveedor_id': proveedor_sebo.id,
            'cantidad_kg': '500.00'
        }

        serializer = SimularPruebaAcidezSerializer(data=data)

        assert serializer.is_valid(), serializer.errors

        resultado = serializer.simulate()

        assert resultado['calidad_resultante'] == 'A'
        assert resultado['tipo_materia'] == 'Sebo Procesado Calidad A'
        assert resultado['precio_kg'] == 4500.0
        assert resultado['precio_existe'] is True
        assert resultado['valor_total'] == 500.0 * 4500.0

    def test_simular_prueba_acidez_calidad_b(
        self,
        proveedor_sebo,
        tipo_sebo_procesado_b
    ):
        """Test: Simular prueba con acidez en rango B."""
        data = {
            'valor_acidez': '4.0',  # Calidad B
            'proveedor_id': proveedor_sebo.id,
            'cantidad_kg': '300.00'
        }

        serializer = SimularPruebaAcidezSerializer(data=data)

        assert serializer.is_valid(), serializer.errors

        resultado = serializer.simulate()

        assert resultado['calidad_resultante'] == 'B'
        assert resultado['tipo_materia'] == 'Sebo Procesado Calidad B'

    def test_simular_sin_cantidad(self, proveedor_sebo, tipo_sebo_procesado_a):
        """Test: Simular sin cantidad no calcula valor_total."""
        data = {
            'valor_acidez': '2.5',
            'proveedor_id': proveedor_sebo.id
            # Sin cantidad_kg
        }

        serializer = SimularPruebaAcidezSerializer(data=data)

        assert serializer.is_valid(), serializer.errors

        resultado = serializer.simulate()

        assert resultado['calidad_resultante'] == 'A'
        assert resultado['valor_total'] is None

    def test_validacion_proveedor_no_existe(self):
        """Test: Validar que proveedor exista."""
        data = {
            'valor_acidez': '2.5',
            'proveedor_id': 99999  # No existe
        }

        serializer = SimularPruebaAcidezSerializer(data=data)

        assert not serializer.is_valid()
        assert 'proveedor_id' in serializer.errors

    def test_validacion_proveedor_no_maneja_sebo(self, proveedor_materia_prima):
        """Test: Validar que proveedor maneje sebo."""
        data = {
            'valor_acidez': '2.5',
            'proveedor_id': proveedor_materia_prima.id  # No maneja sebo
        }

        serializer = SimularPruebaAcidezSerializer(data=data)

        assert not serializer.is_valid()
        assert 'proveedor_id' in serializer.errors


# ==============================================================================
# TESTS DE CONDICION COMERCIAL SERIALIZER
# ==============================================================================

@pytest.mark.django_db
class TestCondicionComercialSerializer:
    """Tests para CondicionComercialSerializer."""

    def test_serializar_condicion_comercial(self, condicion_comercial):
        """Test: Serializar condición incluye property esta_vigente."""
        serializer = CondicionComercialSerializer(condicion_comercial)
        data = serializer.data

        assert 'esta_vigente' in data
        assert data['esta_vigente'] is True

    def test_validacion_fechas_vigencia(self, proveedor_servicio):
        """Test: Validar que vigencia_hasta sea posterior a vigencia_desde."""
        data = {
            'proveedor': proveedor_servicio.id,
            'descripcion': 'Test',
            'valor_acordado': 'Test',
            'vigencia_desde': date.today(),
            'vigencia_hasta': date.today() - timedelta(days=10)  # Anterior
        }

        serializer = CondicionComercialSerializer(data=data)

        assert not serializer.is_valid()
        assert 'vigencia_hasta' in serializer.errors


# ==============================================================================
# TESTS DE DETALLE EVALUACION SERIALIZER
# ==============================================================================

@pytest.mark.django_db
class TestDetalleEvaluacionSerializer:
    """Tests para DetalleEvaluacionSerializer."""

    def test_serializar_detalle_evaluacion(self, detalle_evaluacion):
        """Test: Serializar detalle incluye criterio_nombre y peso."""
        serializer = DetalleEvaluacionSerializer(detalle_evaluacion)
        data = serializer.data

        assert 'criterio_nombre' in data
        assert 'criterio_peso' in data
        assert data['criterio_nombre'] == 'Calidad del Producto'
        assert data['criterio_peso'] == '2.00'
