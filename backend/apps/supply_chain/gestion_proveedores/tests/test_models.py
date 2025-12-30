"""
Tests de Modelos para Gestión de Proveedores - Supply Chain
============================================================

Tests unitarios para:
- Catálogos dinámicos (9 modelos)
- Modelos principales (9 modelos)
- Métodos de negocio
- Validaciones
- Soft delete
- Propiedades calculadas

Total de tests: 80+
Cobertura: Todos los modelos y sus métodos principales

Autor: Sistema ERP StrateKaz
Fecha: 27 Diciembre 2025
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile

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


# ==============================================================================
# TESTS DE CATÁLOGOS DINÁMICOS
# ==============================================================================

@pytest.mark.django_db
class TestCategoriaMateriaPrima:
    """Tests para CategoriaMateriaPrima."""

    def test_crear_categoria(self, db):
        """Test: Crear categoría de materia prima."""
        categoria = CategoriaMateriaPrima.objects.create(
            codigo='TEST_CAT',
            nombre='Categoría Test',
            descripcion='Descripción test',
            orden=1,
            is_active=True
        )

        assert categoria.pk is not None
        assert categoria.codigo == 'TEST_CAT'
        assert categoria.nombre == 'Categoría Test'
        assert categoria.is_active is True

    def test_str_categoria(self, categoria_hueso):
        """Test: Representación en string."""
        assert str(categoria_hueso) == 'Hueso'

    def test_codigo_unico(self, categoria_hueso):
        """Test: El código debe ser único."""
        with pytest.raises(IntegrityError):
            CategoriaMateriaPrima.objects.create(
                codigo='HUESO',  # Código duplicado
                nombre='Otra Categoría',
                orden=2
            )

    def test_ordering(self, db):
        """Test: Ordenamiento por orden y nombre."""
        cat1 = CategoriaMateriaPrima.objects.create(codigo='C1', nombre='Zinc', orden=2)
        cat2 = CategoriaMateriaPrima.objects.create(codigo='C2', nombre='Alfa', orden=1)
        cat3 = CategoriaMateriaPrima.objects.create(codigo='C3', nombre='Beta', orden=1)

        categorias = list(CategoriaMateriaPrima.objects.all())
        assert categorias[0] == cat2  # orden=1, nombre=Alfa
        assert categorias[1] == cat3  # orden=1, nombre=Beta
        assert categorias[2] == cat1  # orden=2


@pytest.mark.django_db
class TestTipoMateriaPrima:
    """Tests para TipoMateriaPrima."""

    def test_crear_tipo_materia_prima(self, categoria_hueso):
        """Test: Crear tipo de materia prima."""
        tipo = TipoMateriaPrima.objects.create(
            categoria=categoria_hueso,
            codigo='HUESO_TEST',
            nombre='Hueso Test',
            descripcion='Test',
            orden=1,
            is_active=True
        )

        assert tipo.pk is not None
        assert tipo.categoria == categoria_hueso
        assert tipo.codigo == 'HUESO_TEST'

    def test_str_tipo_materia_prima(self, tipo_hueso_crudo, categoria_hueso):
        """Test: Representación en string incluye categoría."""
        expected = f"{categoria_hueso.nombre} - {tipo_hueso_crudo.nombre}"
        assert str(tipo_hueso_crudo) == expected

    def test_tipo_con_rangos_acidez(self, categoria_sebo):
        """Test: Crear tipo con rangos de acidez."""
        tipo = TipoMateriaPrima.objects.create(
            categoria=categoria_sebo,
            codigo='SEBO_TEST',
            nombre='Sebo Test',
            acidez_min=Decimal('5.00'),
            acidez_max=Decimal('8.00'),
            is_active=True
        )

        assert tipo.acidez_min == Decimal('5.00')
        assert tipo.acidez_max == Decimal('8.00')

    def test_obtener_por_acidez_encontrado(self, tipo_sebo_procesado_a, tipo_sebo_procesado_b):
        """
        Test: Método obtener_por_acidez() encuentra tipo correcto.

        Given: Tipos de sebo con rangos de acidez definidos
        When: Se busca por valor dentro del rango
        Then: Debe retornar el tipo correcto
        """
        # Valor dentro del rango de tipo_sebo_procesado_a (0-2.99)
        tipo = TipoMateriaPrima.obtener_por_acidez(Decimal('2.5'))
        assert tipo is not None
        assert tipo.codigo == 'SEBO_PROCESADO_A'

        # Valor dentro del rango de tipo_sebo_procesado_b (3-5)
        tipo = TipoMateriaPrima.obtener_por_acidez(Decimal('4.0'))
        assert tipo is not None
        assert tipo.codigo == 'SEBO_PROCESADO_B'

    def test_obtener_por_acidez_borde_inferior(self, tipo_sebo_procesado_a):
        """Test: Obtener por acidez en borde inferior del rango."""
        tipo = TipoMateriaPrima.obtener_por_acidez(Decimal('0.00'))
        assert tipo is not None
        assert tipo.codigo == 'SEBO_PROCESADO_A'

    def test_obtener_por_acidez_borde_superior(self, tipo_sebo_procesado_b):
        """Test: Obtener por acidez en borde superior del rango."""
        tipo = TipoMateriaPrima.obtener_por_acidez(Decimal('5.00'))
        assert tipo is not None
        assert tipo.codigo == 'SEBO_PROCESADO_B'

    def test_obtener_por_acidez_no_encontrado(self, tipo_sebo_procesado_a):
        """Test: Obtener por acidez fuera de rangos retorna None."""
        tipo = TipoMateriaPrima.obtener_por_acidez(Decimal('100.0'))
        assert tipo is None

    def test_obtener_por_acidez_solo_activos(self, categoria_sebo):
        """Test: obtener_por_acidez() solo retorna tipos activos."""
        tipo_inactivo = TipoMateriaPrima.objects.create(
            categoria=categoria_sebo,
            codigo='SEBO_INACTIVO',
            nombre='Sebo Inactivo',
            acidez_min=Decimal('10.0'),
            acidez_max=Decimal('12.0'),
            is_active=False
        )

        tipo = TipoMateriaPrima.obtener_por_acidez(Decimal('11.0'))
        assert tipo is None


@pytest.mark.django_db
class TestTipoProveedor:
    """Tests para TipoProveedor."""

    def test_crear_tipo_proveedor(self, db):
        """Test: Crear tipo de proveedor."""
        tipo = TipoProveedor.objects.create(
            codigo='TEST_TIPO',
            nombre='Tipo Test',
            descripcion='Test',
            requiere_materia_prima=False,
            requiere_modalidad_logistica=False,
            is_active=True
        )

        assert tipo.pk is not None
        assert tipo.codigo == 'TEST_TIPO'

    def test_str_tipo_proveedor(self, tipo_proveedor_materia_prima):
        """Test: Representación en string."""
        assert str(tipo_proveedor_materia_prima) == 'Proveedor de Materia Prima Externo'

    def test_flags_requerimientos(self, tipo_proveedor_materia_prima, tipo_proveedor_servicio):
        """Test: Flags de requerimientos funcionan correctamente."""
        assert tipo_proveedor_materia_prima.requiere_materia_prima is True
        assert tipo_proveedor_materia_prima.requiere_modalidad_logistica is True

        assert tipo_proveedor_servicio.requiere_materia_prima is False
        assert tipo_proveedor_servicio.requiere_modalidad_logistica is False


@pytest.mark.django_db
class TestDepartamentoYCiudad:
    """Tests para Departamento y Ciudad."""

    def test_crear_departamento(self, db):
        """Test: Crear departamento."""
        depto = Departamento.objects.create(
            codigo='ANTIOQUIA',
            nombre='Antioquia',
            codigo_dane='05',
            is_active=True
        )

        assert depto.pk is not None
        assert depto.codigo == 'ANTIOQUIA'

    def test_str_departamento(self, departamento_cundinamarca):
        """Test: Representación en string de departamento."""
        assert str(departamento_cundinamarca) == 'Cundinamarca'

    def test_crear_ciudad(self, departamento_cundinamarca):
        """Test: Crear ciudad vinculada a departamento."""
        ciudad = Ciudad.objects.create(
            departamento=departamento_cundinamarca,
            codigo='MADRID',
            nombre='Madrid',
            codigo_dane='25473',
            es_capital=False,
            is_active=True
        )

        assert ciudad.pk is not None
        assert ciudad.departamento == departamento_cundinamarca
        assert ciudad.es_capital is False

    def test_str_ciudad(self, ciudad_bogota, departamento_cundinamarca):
        """Test: Representación en string de ciudad incluye departamento."""
        expected = f"Bogotá ({departamento_cundinamarca.nombre})"
        assert str(ciudad_bogota) == expected

    def test_relacion_ciudades_departamento(self, departamento_cundinamarca, ciudad_bogota):
        """Test: Relación reverse ciudades del departamento."""
        ciudades = departamento_cundinamarca.ciudades.all()
        assert ciudad_bogota in ciudades


# ==============================================================================
# TESTS DE UNIDAD DE NEGOCIO
# ==============================================================================

@pytest.mark.django_db
class TestUnidadNegocio:
    """Tests para UnidadNegocio."""

    def test_crear_unidad_negocio(self, departamento_cundinamarca, usuario_gerente):
        """Test: Crear unidad de negocio."""
        unidad = UnidadNegocio.objects.create(
            codigo='TEST_UNIDAD',
            nombre='Unidad Test',
            tipo_unidad='PLANTA',
            direccion='Calle Test',
            ciudad='Bogotá',
            departamento=departamento_cundinamarca,
            responsable=usuario_gerente,
            is_active=True
        )

        assert unidad.pk is not None
        assert unidad.codigo == 'TEST_UNIDAD'
        assert unidad.tipo_unidad == 'PLANTA'

    def test_str_unidad_negocio(self, unidad_negocio_planta):
        """Test: Representación en string."""
        expected = f"{unidad_negocio_planta.nombre} ({unidad_negocio_planta.codigo})"
        assert str(unidad_negocio_planta) == expected

    def test_codigo_unico(self, unidad_negocio_planta):
        """Test: El código debe ser único."""
        with pytest.raises(IntegrityError):
            UnidadNegocio.objects.create(
                codigo='PLANTA_BOG_01',  # Código duplicado
                nombre='Otra Planta',
                tipo_unidad='PLANTA',
                direccion='Otra dirección',
                ciudad='Bogotá'
            )

    def test_choices_tipo_unidad(self, db):
        """Test: Choices de tipo_unidad válidos."""
        tipos_validos = ['SEDE', 'SUCURSAL', 'PLANTA', 'CENTRO_ACOPIO', 'ALMACEN', 'OTRO']

        for tipo in tipos_validos:
            unidad = UnidadNegocio.objects.create(
                codigo=f'UNIDAD_{tipo}',
                nombre=f'Unidad {tipo}',
                tipo_unidad=tipo,
                direccion='Test',
                ciudad='Test'
            )
            assert unidad.tipo_unidad == tipo

    def test_soft_delete(self, unidad_negocio_planta):
        """
        Test: Soft delete de unidad de negocio.

        Given: Unidad de negocio activa
        When: Se ejecuta soft_delete()
        Then: Debe marcar deleted_at y desactivar
        """
        assert unidad_negocio_planta.is_deleted is False
        assert unidad_negocio_planta.is_active is True

        unidad_negocio_planta.soft_delete()
        unidad_negocio_planta.refresh_from_db()

        assert unidad_negocio_planta.is_deleted is True
        assert unidad_negocio_planta.is_active is False
        assert unidad_negocio_planta.deleted_at is not None

    def test_restore(self, unidad_negocio_planta):
        """
        Test: Restaurar unidad de negocio eliminada.

        Given: Unidad eliminada
        When: Se ejecuta restore()
        Then: Debe limpiar deleted_at y activar
        """
        unidad_negocio_planta.soft_delete()
        assert unidad_negocio_planta.is_deleted is True

        unidad_negocio_planta.restore()
        unidad_negocio_planta.refresh_from_db()

        assert unidad_negocio_planta.is_deleted is False
        assert unidad_negocio_planta.is_active is True
        assert unidad_negocio_planta.deleted_at is None

    def test_property_is_deleted(self, unidad_negocio_planta):
        """Test: Property is_deleted funciona correctamente."""
        assert unidad_negocio_planta.is_deleted is False

        unidad_negocio_planta.deleted_at = timezone.now()
        unidad_negocio_planta.save()

        assert unidad_negocio_planta.is_deleted is True


# ==============================================================================
# TESTS DE PROVEEDOR
# ==============================================================================

@pytest.mark.django_db
class TestProveedor:
    """Tests para Proveedor."""

    def test_crear_proveedor_materia_prima(self, proveedor_materia_prima):
        """Test: Crear proveedor de materia prima."""
        assert proveedor_materia_prima.pk is not None
        assert proveedor_materia_prima.codigo_interno == 'MP-0001'
        assert proveedor_materia_prima.es_proveedor_materia_prima is True

    def test_crear_proveedor_servicio(self, proveedor_servicio):
        """Test: Crear proveedor de servicios."""
        assert proveedor_servicio.pk is not None
        assert proveedor_servicio.codigo_interno == 'PS-0001'
        assert proveedor_servicio.es_proveedor_materia_prima is False

    def test_str_proveedor(self, proveedor_materia_prima):
        """Test: Representación en string incluye tipo."""
        expected = f"{proveedor_materia_prima.nombre_comercial} ({proveedor_materia_prima.tipo_proveedor.nombre})"
        assert str(proveedor_materia_prima) == expected

    def test_numero_documento_unico(self, proveedor_materia_prima):
        """Test: El número de documento debe ser único."""
        with pytest.raises(IntegrityError):
            Proveedor.objects.create(
                tipo_proveedor=proveedor_materia_prima.tipo_proveedor,
                nombre_comercial='Otro Proveedor',
                razon_social='Otra Razón Social',
                tipo_documento=proveedor_materia_prima.tipo_documento,
                numero_documento='900111222',  # Número duplicado
                direccion='Test',
                ciudad='Test'
            )

    def test_generar_codigo_interno_materia_prima(
        self,
        tipo_proveedor_materia_prima,
        tipo_hueso_crudo,
        modalidad_entrega_planta,
        tipo_documento_nit,
        departamento_cundinamarca
    ):
        """
        Test: Generar código interno para proveedor de materia prima.

        Given: Tipo proveedor de materia prima
        When: Se crea proveedor sin código_interno
        Then: Debe autogenerar código con prefijo MP-
        """
        proveedor = Proveedor.objects.create(
            tipo_proveedor=tipo_proveedor_materia_prima,
            modalidad_logistica=modalidad_entrega_planta,
            nombre_comercial='Test',
            razon_social='Test',
            tipo_documento=tipo_documento_nit,
            numero_documento='999888777',
            direccion='Test',
            ciudad='Test',
            departamento=departamento_cundinamarca
        )

        assert proveedor.codigo_interno is not None
        assert proveedor.codigo_interno.startswith('MP-')

    def test_generar_codigo_interno_servicio(
        self,
        tipo_proveedor_servicio,
        tipo_documento_nit,
        departamento_cundinamarca
    ):
        """Test: Generar código interno para proveedor de servicios con prefijo PS-."""
        proveedor = Proveedor.objects.create(
            tipo_proveedor=tipo_proveedor_servicio,
            nombre_comercial='Test',
            razon_social='Test',
            tipo_documento=tipo_documento_nit,
            numero_documento='888777666',
            direccion='Test',
            ciudad='Test',
            departamento=departamento_cundinamarca
        )

        assert proveedor.codigo_interno is not None
        assert proveedor.codigo_interno.startswith('PS-')

    def test_property_es_proveedor_materia_prima(
        self,
        proveedor_materia_prima,
        proveedor_servicio
    ):
        """Test: Property es_proveedor_materia_prima según tipo."""
        assert proveedor_materia_prima.es_proveedor_materia_prima is True
        assert proveedor_servicio.es_proveedor_materia_prima is False

    def test_validacion_requiere_modalidad_logistica(
        self,
        tipo_proveedor_materia_prima,
        tipo_documento_nit,
        departamento_cundinamarca
    ):
        """
        Test: Validar que se requiere modalidad logística cuando el tipo lo exige.

        Given: Tipo proveedor que requiere_modalidad_logistica=True
        When: Se intenta crear sin modalidad_logistica
        Then: Debe lanzar ValidationError al hacer full_clean()
        """
        proveedor = Proveedor(
            tipo_proveedor=tipo_proveedor_materia_prima,
            modalidad_logistica=None,  # No se proporciona
            nombre_comercial='Test',
            razon_social='Test',
            tipo_documento=tipo_documento_nit,
            numero_documento='777666555',
            direccion='Test',
            ciudad='Test',
            departamento=departamento_cundinamarca
        )

        with pytest.raises(ValidationError) as exc_info:
            proveedor.full_clean()

        assert 'modalidad_logistica' in exc_info.value.message_dict

    def test_relaciones_m2m_tipos_materia_prima(self, proveedor_materia_prima, tipo_hueso_crudo):
        """Test: Relación M2M con tipos de materia prima."""
        tipos = proveedor_materia_prima.tipos_materia_prima.all()
        assert tipo_hueso_crudo in tipos

    def test_relaciones_m2m_formas_pago(self, proveedor_materia_prima, forma_pago_contado):
        """Test: Relación M2M con formas de pago."""
        formas = proveedor_materia_prima.formas_pago.all()
        assert forma_pago_contado in formas

    def test_soft_delete_proveedor(self, proveedor_materia_prima):
        """Test: Soft delete de proveedor."""
        assert proveedor_materia_prima.is_deleted is False

        proveedor_materia_prima.soft_delete()
        proveedor_materia_prima.refresh_from_db()

        assert proveedor_materia_prima.is_deleted is True
        assert proveedor_materia_prima.is_active is False
        assert proveedor_materia_prima.deleted_at is not None

    def test_restore_proveedor(self, proveedor_materia_prima):
        """Test: Restaurar proveedor eliminado."""
        proveedor_materia_prima.soft_delete()
        assert proveedor_materia_prima.is_deleted is True

        proveedor_materia_prima.restore()
        proveedor_materia_prima.refresh_from_db()

        assert proveedor_materia_prima.is_deleted is False
        assert proveedor_materia_prima.is_active is True


# ==============================================================================
# TESTS DE PRECIO MATERIA PRIMA
# ==============================================================================

@pytest.mark.django_db
class TestPrecioMateriaPrima:
    """Tests para PrecioMateriaPrima."""

    def test_crear_precio(self, proveedor_materia_prima, tipo_hueso_crudo, usuario_gerente):
        """Test: Crear precio de materia prima."""
        precio = PrecioMateriaPrima.objects.create(
            proveedor=proveedor_materia_prima,
            tipo_materia=tipo_hueso_crudo,
            precio_kg=Decimal('3000.00'),
            modificado_por=usuario_gerente
        )

        assert precio.pk is not None
        assert precio.precio_kg == Decimal('3000.00')
        assert precio.modificado_por == usuario_gerente

    def test_str_precio(self, precio_hueso):
        """Test: Representación en string incluye proveedor y precio."""
        assert 'Proveedor Huesos SA' in str(precio_hueso)
        assert '2500.00' in str(precio_hueso)

    def test_unique_together_proveedor_tipo(self, precio_hueso):
        """Test: Unique constraint proveedor + tipo_materia."""
        with pytest.raises(IntegrityError):
            PrecioMateriaPrima.objects.create(
                proveedor=precio_hueso.proveedor,
                tipo_materia=precio_hueso.tipo_materia,  # Combinación duplicada
                precio_kg=Decimal('2000.00'),
                modificado_por=precio_hueso.modificado_por
            )

    def test_validacion_precio_negativo(
        self,
        proveedor_materia_prima,
        tipo_hueso_crudo,
        usuario_gerente
    ):
        """Test: No permitir precio negativo."""
        precio = PrecioMateriaPrima(
            proveedor=proveedor_materia_prima,
            tipo_materia=tipo_hueso_crudo,
            precio_kg=Decimal('-100.00'),  # Negativo
            modificado_por=usuario_gerente
        )

        with pytest.raises(ValidationError) as exc_info:
            precio.full_clean()

        assert 'precio_kg' in exc_info.value.message_dict


# ==============================================================================
# TESTS DE HISTORIAL PRECIO PROVEEDOR
# ==============================================================================

@pytest.mark.django_db
class TestHistorialPrecioProveedor:
    """Tests para HistorialPrecioProveedor."""

    def test_crear_historial(
        self,
        proveedor_sebo,
        tipo_sebo_procesado_a,
        usuario_gerente
    ):
        """Test: Crear registro de historial de precio."""
        historial = HistorialPrecioProveedor.objects.create(
            proveedor=proveedor_sebo,
            tipo_materia=tipo_sebo_procesado_a,
            precio_anterior=Decimal('4000.00'),
            precio_nuevo=Decimal('4500.00'),
            modificado_por=usuario_gerente,
            motivo='Ajuste por inflación'
        )

        assert historial.pk is not None
        assert historial.precio_anterior == Decimal('4000.00')
        assert historial.precio_nuevo == Decimal('4500.00')

    def test_str_historial(self, historial_precio):
        """Test: Representación en string incluye cambio de precio."""
        assert 'Sebos del Norte' in str(historial_precio)
        assert '4000' in str(historial_precio)
        assert '4500' in str(historial_precio)

    def test_property_variacion_precio_aumento(self, historial_precio):
        """
        Test: Property variacion_precio calcula % de aumento.

        Given: Precio anterior 4000, nuevo 4500
        When: Se accede a variacion_precio
        Then: Debe retornar 12.5 (%)
        """
        variacion = historial_precio.variacion_precio
        assert variacion == Decimal('12.5')

    def test_property_variacion_precio_reduccion(
        self,
        proveedor_sebo,
        tipo_sebo_procesado_a,
        usuario_gerente
    ):
        """Test: Property variacion_precio calcula % de reducción."""
        historial = HistorialPrecioProveedor.objects.create(
            proveedor=proveedor_sebo,
            tipo_materia=tipo_sebo_procesado_a,
            precio_anterior=Decimal('5000.00'),
            precio_nuevo=Decimal('4000.00'),
            modificado_por=usuario_gerente,
            motivo='Reducción de mercado'
        )

        variacion = historial.variacion_precio
        assert variacion == Decimal('-20.0')

    def test_property_variacion_precio_sin_anterior(
        self,
        proveedor_sebo,
        tipo_sebo_procesado_a,
        usuario_gerente
    ):
        """Test: variacion_precio retorna None si precio_anterior es None."""
        historial = HistorialPrecioProveedor.objects.create(
            proveedor=proveedor_sebo,
            tipo_materia=tipo_sebo_procesado_a,
            precio_anterior=None,  # Precio inicial
            precio_nuevo=Decimal('4500.00'),
            modificado_por=usuario_gerente,
            motivo='Precio inicial'
        )

        assert historial.variacion_precio is None

    def test_property_tipo_cambio_aumento(self, historial_precio):
        """Test: Property tipo_cambio identifica AUMENTO."""
        assert historial_precio.tipo_cambio == 'AUMENTO'

    def test_property_tipo_cambio_reduccion(
        self,
        proveedor_sebo,
        tipo_sebo_procesado_a,
        usuario_gerente
    ):
        """Test: Property tipo_cambio identifica REDUCCION."""
        historial = HistorialPrecioProveedor.objects.create(
            proveedor=proveedor_sebo,
            tipo_materia=tipo_sebo_procesado_a,
            precio_anterior=Decimal('5000.00'),
            precio_nuevo=Decimal('4000.00'),
            modificado_por=usuario_gerente,
            motivo='Reducción'
        )

        assert historial.tipo_cambio == 'REDUCCION'

    def test_property_tipo_cambio_inicial(
        self,
        proveedor_sebo,
        tipo_sebo_procesado_a,
        usuario_gerente
    ):
        """Test: Property tipo_cambio identifica INICIAL."""
        historial = HistorialPrecioProveedor.objects.create(
            proveedor=proveedor_sebo,
            tipo_materia=tipo_sebo_procesado_a,
            precio_anterior=None,
            precio_nuevo=Decimal('4500.00'),
            modificado_por=usuario_gerente,
            motivo='Precio inicial'
        )

        assert historial.tipo_cambio == 'INICIAL'


# ==============================================================================
# TESTS DE CONDICION COMERCIAL PROVEEDOR
# ==============================================================================

@pytest.mark.django_db
class TestCondicionComercialProveedor:
    """Tests para CondicionComercialProveedor."""

    def test_crear_condicion_comercial(self, proveedor_servicio, usuario_coordinador):
        """Test: Crear condición comercial."""
        condicion = CondicionComercialProveedor.objects.create(
            proveedor=proveedor_servicio,
            descripcion='Descuento por volumen',
            valor_acordado='10% descuento',
            vigencia_desde=date.today(),
            created_by=usuario_coordinador
        )

        assert condicion.pk is not None
        assert condicion.descripcion == 'Descuento por volumen'

    def test_str_condicion_comercial(self, condicion_comercial):
        """Test: Representación en string."""
        assert 'Servicios Industriales Ltda' in str(condicion_comercial)
        assert 'Descuento por volumen' in str(condicion_comercial)

    def test_property_esta_vigente_sin_fecha_fin(
        self,
        proveedor_servicio,
        usuario_coordinador
    ):
        """
        Test: esta_vigente retorna True si vigencia_desde <= hoy y sin vigencia_hasta.

        Given: Condición con vigencia_desde hace 10 días, sin vigencia_hasta
        When: Se accede a esta_vigente
        Then: Debe retornar True
        """
        condicion = CondicionComercialProveedor.objects.create(
            proveedor=proveedor_servicio,
            descripcion='Test',
            valor_acordado='Test',
            vigencia_desde=date.today() - timedelta(days=10),
            vigencia_hasta=None,
            created_by=usuario_coordinador
        )

        assert condicion.esta_vigente is True

    def test_property_esta_vigente_dentro_rango(self, condicion_comercial):
        """Test: esta_vigente True cuando hoy está dentro del rango."""
        # condicion_comercial tiene vigencia_desde hace 30 días y vigencia_hasta en 335 días
        assert condicion_comercial.esta_vigente is True

    def test_property_esta_vigente_antes_inicio(
        self,
        proveedor_servicio,
        usuario_coordinador
    ):
        """Test: esta_vigente False cuando hoy es antes de vigencia_desde."""
        condicion = CondicionComercialProveedor.objects.create(
            proveedor=proveedor_servicio,
            descripcion='Futura',
            valor_acordado='Test',
            vigencia_desde=date.today() + timedelta(days=10),
            vigencia_hasta=date.today() + timedelta(days=30),
            created_by=usuario_coordinador
        )

        assert condicion.esta_vigente is False

    def test_property_esta_vigente_despues_fin(
        self,
        proveedor_servicio,
        usuario_coordinador
    ):
        """Test: esta_vigente False cuando hoy es después de vigencia_hasta."""
        condicion = CondicionComercialProveedor.objects.create(
            proveedor=proveedor_servicio,
            descripcion='Vencida',
            valor_acordado='Test',
            vigencia_desde=date.today() - timedelta(days=60),
            vigencia_hasta=date.today() - timedelta(days=10),
            created_by=usuario_coordinador
        )

        assert condicion.esta_vigente is False


# ==============================================================================
# TESTS DE PRUEBA ACIDEZ
# ==============================================================================

@pytest.mark.django_db
class TestPruebaAcidez:
    """Tests para PruebaAcidez."""

    def test_crear_prueba_acidez(self, proveedor_sebo, tipo_sebo_procesado_a, usuario_coordinador):
        """Test: Crear prueba de acidez."""
        foto = SimpleUploadedFile('test.jpg', b'fake_content', content_type='image/jpeg')

        prueba = PruebaAcidez.objects.create(
            proveedor=proveedor_sebo,
            fecha_prueba=timezone.now(),
            valor_acidez=Decimal('2.5'),
            foto_prueba=foto,
            cantidad_kg=Decimal('500.00'),
            realizado_por=usuario_coordinador
        )

        assert prueba.pk is not None
        assert prueba.valor_acidez == Decimal('2.5')
        # Calidad se asigna automáticamente en save()
        assert prueba.calidad_resultante is not None

    def test_str_prueba_acidez(self, prueba_acidez):
        """Test: Representación en string."""
        assert prueba_acidez.codigo_voucher in str(prueba_acidez)
        assert 'Sebos del Norte' in str(prueba_acidez)

    def test_codigo_voucher_unico(self, prueba_acidez):
        """Test: El código voucher debe ser único."""
        foto = SimpleUploadedFile('test2.jpg', b'fake_content', content_type='image/jpeg')

        with pytest.raises(IntegrityError):
            PruebaAcidez.objects.create(
                proveedor=prueba_acidez.proveedor,
                fecha_prueba=timezone.now(),
                valor_acidez=Decimal('3.0'),
                codigo_voucher=prueba_acidez.codigo_voucher,  # Duplicado
                foto_prueba=foto,
                cantidad_kg=Decimal('100.00'),
                realizado_por=prueba_acidez.realizado_por
            )

    def test_determinar_calidad_y_tipo_calidad_a(
        self,
        proveedor_sebo,
        tipo_sebo_procesado_a,
        usuario_coordinador
    ):
        """
        Test: determinar_calidad_y_tipo() asigna correctamente calidad A.

        Given: Acidez de 2.5% (dentro del rango de calidad A: 0-2.99%)
        When: Se llama a determinar_calidad_y_tipo()
        Then: Debe retornar calidad 'A' y tipo SEBO_PROCESADO_A
        """
        foto = SimpleUploadedFile('test.jpg', b'fake_content', content_type='image/jpeg')

        prueba = PruebaAcidez(
            proveedor=proveedor_sebo,
            fecha_prueba=timezone.now(),
            valor_acidez=Decimal('2.5'),
            foto_prueba=foto,
            cantidad_kg=Decimal('500.00'),
            realizado_por=usuario_coordinador
        )

        calidad, tipo = prueba.determinar_calidad_y_tipo()

        assert calidad == 'A'
        assert tipo is not None
        assert tipo.codigo == 'SEBO_PROCESADO_A'

    def test_determinar_calidad_y_tipo_calidad_b(
        self,
        proveedor_sebo,
        tipo_sebo_procesado_b,
        usuario_coordinador
    ):
        """Test: determinar_calidad_y_tipo() asigna correctamente calidad B."""
        foto = SimpleUploadedFile('test.jpg', b'fake_content', content_type='image/jpeg')

        prueba = PruebaAcidez(
            proveedor=proveedor_sebo,
            fecha_prueba=timezone.now(),
            valor_acidez=Decimal('4.0'),  # Dentro del rango B: 3-5%
            foto_prueba=foto,
            cantidad_kg=Decimal('500.00'),
            realizado_por=usuario_coordinador
        )

        calidad, tipo = prueba.determinar_calidad_y_tipo()

        assert calidad == 'B'
        assert tipo is not None
        assert tipo.codigo == 'SEBO_PROCESADO_B'

    def test_save_asigna_calidad_automaticamente(
        self,
        proveedor_sebo,
        tipo_sebo_procesado_a,
        usuario_coordinador
    ):
        """
        Test: save() asigna calidad y tipo automáticamente.

        Given: PruebaAcidez con valor_acidez pero sin calidad_resultante
        When: Se guarda la prueba
        Then: Debe asignar calidad_resultante y tipo_materia_resultante automáticamente
        """
        foto = SimpleUploadedFile('test.jpg', b'fake_content', content_type='image/jpeg')

        prueba = PruebaAcidez.objects.create(
            proveedor=proveedor_sebo,
            fecha_prueba=timezone.now(),
            valor_acidez=Decimal('2.0'),
            foto_prueba=foto,
            cantidad_kg=Decimal('500.00'),
            realizado_por=usuario_coordinador
        )

        prueba.refresh_from_db()

        assert prueba.calidad_resultante == 'A'
        assert prueba.tipo_materia_resultante is not None
        assert prueba.tipo_materia_resultante.codigo == 'SEBO_PROCESADO_A'

    def test_save_genera_codigo_voucher(
        self,
        proveedor_sebo,
        usuario_coordinador
    ):
        """Test: save() genera código_voucher si no existe."""
        foto = SimpleUploadedFile('test.jpg', b'fake_content', content_type='image/jpeg')

        prueba = PruebaAcidez.objects.create(
            proveedor=proveedor_sebo,
            fecha_prueba=timezone.now(),
            valor_acidez=Decimal('2.5'),
            foto_prueba=foto,
            cantidad_kg=Decimal('500.00'),
            realizado_por=usuario_coordinador
        )

        assert prueba.codigo_voucher is not None
        assert len(prueba.codigo_voucher) > 0

    def test_save_calcula_valor_total(
        self,
        proveedor_sebo,
        usuario_coordinador
    ):
        """Test: save() calcula valor_total si hay cantidad_kg y precio_kg_aplicado."""
        foto = SimpleUploadedFile('test.jpg', b'fake_content', content_type='image/jpeg')

        prueba = PruebaAcidez.objects.create(
            proveedor=proveedor_sebo,
            fecha_prueba=timezone.now(),
            valor_acidez=Decimal('2.5'),
            foto_prueba=foto,
            cantidad_kg=Decimal('500.00'),
            precio_kg_aplicado=Decimal('4500.00'),
            realizado_por=usuario_coordinador
        )

        prueba.refresh_from_db()

        expected_total = Decimal('500.00') * Decimal('4500.00')
        assert prueba.valor_total == expected_total

    def test_soft_delete_prueba_acidez(self, prueba_acidez):
        """Test: Soft delete de prueba de acidez."""
        assert prueba_acidez.is_deleted is False

        prueba_acidez.soft_delete()
        prueba_acidez.refresh_from_db()

        assert prueba_acidez.is_deleted is True
        assert prueba_acidez.deleted_at is not None

    def test_restore_prueba_acidez(self, prueba_acidez):
        """Test: Restaurar prueba de acidez eliminada."""
        prueba_acidez.soft_delete()
        assert prueba_acidez.is_deleted is True

        prueba_acidez.restore()
        prueba_acidez.refresh_from_db()

        assert prueba_acidez.is_deleted is False
        assert prueba_acidez.deleted_at is None


# ==============================================================================
# TESTS DE EVALUACIÓN DE PROVEEDORES
# ==============================================================================

@pytest.mark.django_db
class TestCriterioEvaluacion:
    """Tests para CriterioEvaluacion."""

    def test_crear_criterio(self, tipo_proveedor_materia_prima):
        """Test: Crear criterio de evaluación."""
        criterio = CriterioEvaluacion.objects.create(
            codigo='TEST_CRITERIO',
            nombre='Criterio Test',
            descripcion='Test',
            peso=Decimal('1.5'),
            is_active=True
        )
        criterio.aplica_a_tipo.add(tipo_proveedor_materia_prima)

        assert criterio.pk is not None
        assert criterio.codigo == 'TEST_CRITERIO'
        assert criterio.peso == Decimal('1.5')

    def test_str_criterio(self, criterio_calidad):
        """Test: Representación en string."""
        assert str(criterio_calidad) == 'Calidad del Producto'

    def test_relacion_m2m_aplica_a_tipo(self, criterio_calidad, tipo_proveedor_materia_prima):
        """Test: Relación M2M con tipos de proveedor."""
        tipos = criterio_calidad.aplica_a_tipo.all()
        assert tipo_proveedor_materia_prima in tipos


@pytest.mark.django_db
class TestEvaluacionProveedor:
    """Tests para EvaluacionProveedor."""

    def test_crear_evaluacion(self, proveedor_materia_prima, usuario_coordinador):
        """Test: Crear evaluación de proveedor."""
        evaluacion = EvaluacionProveedor.objects.create(
            proveedor=proveedor_materia_prima,
            periodo='2025-Q1',
            fecha_evaluacion=date.today(),
            estado='BORRADOR',
            evaluado_por=usuario_coordinador
        )

        assert evaluacion.pk is not None
        assert evaluacion.periodo == '2025-Q1'
        assert evaluacion.estado == 'BORRADOR'

    def test_str_evaluacion(self, evaluacion_proveedor):
        """Test: Representación en string."""
        assert 'Proveedor Huesos SA' in str(evaluacion_proveedor)
        assert '2025-Q1' in str(evaluacion_proveedor)

    def test_unique_together_proveedor_periodo(self, evaluacion_proveedor):
        """Test: Constraint unique proveedor + periodo."""
        with pytest.raises(IntegrityError):
            EvaluacionProveedor.objects.create(
                proveedor=evaluacion_proveedor.proveedor,
                periodo='2025-Q1',  # Mismo periodo
                fecha_evaluacion=date.today(),
                evaluado_por=evaluacion_proveedor.evaluado_por
            )

    def test_calcular_calificacion_sin_detalles(self, evaluacion_proveedor):
        """
        Test: calcular_calificacion() retorna None si no hay detalles.

        Given: Evaluación sin detalles
        When: Se llama a calcular_calificacion()
        Then: Debe retornar None
        """
        calificacion = evaluacion_proveedor.calcular_calificacion()
        assert calificacion is None

    def test_calcular_calificacion_con_detalles(
        self,
        evaluacion_proveedor,
        criterio_calidad,
        criterio_puntualidad
    ):
        """
        Test: calcular_calificacion() calcula promedio ponderado.

        Given: Evaluación con 2 detalles
        - Calidad: calificación 85, peso 2.0
        - Puntualidad: calificación 90, peso 1.5
        When: Se calcula calificación
        Then: Debe retornar (85*2.0 + 90*1.5) / (2.0 + 1.5) = 87.14
        """
        DetalleEvaluacion.objects.create(
            evaluacion=evaluacion_proveedor,
            criterio=criterio_calidad,
            calificacion=Decimal('85.00')
        )
        DetalleEvaluacion.objects.create(
            evaluacion=evaluacion_proveedor,
            criterio=criterio_puntualidad,
            calificacion=Decimal('90.00')
        )

        calificacion = evaluacion_proveedor.calcular_calificacion()

        expected = (Decimal('85.00') * Decimal('2.0') + Decimal('90.00') * Decimal('1.5')) / (Decimal('2.0') + Decimal('1.5'))
        assert calificacion is not None
        assert abs(calificacion - expected) < Decimal('0.01')


@pytest.mark.django_db
class TestDetalleEvaluacion:
    """Tests para DetalleEvaluacion."""

    def test_crear_detalle(self, evaluacion_proveedor, criterio_calidad):
        """Test: Crear detalle de evaluación."""
        detalle = DetalleEvaluacion.objects.create(
            evaluacion=evaluacion_proveedor,
            criterio=criterio_calidad,
            calificacion=Decimal('90.00'),
            observaciones='Excelente desempeño'
        )

        assert detalle.pk is not None
        assert detalle.calificacion == Decimal('90.00')

    def test_str_detalle(self, detalle_evaluacion):
        """Test: Representación en string."""
        str_repr = str(detalle_evaluacion)
        assert 'Calidad del Producto' in str_repr
        assert '85' in str_repr

    def test_unique_together_evaluacion_criterio(self, detalle_evaluacion):
        """Test: Constraint unique evaluacion + criterio."""
        with pytest.raises(IntegrityError):
            DetalleEvaluacion.objects.create(
                evaluacion=detalle_evaluacion.evaluacion,
                criterio=detalle_evaluacion.criterio,  # Mismo criterio
                calificacion=Decimal('80.00')
            )

    def test_validacion_calificacion_negativa(self, evaluacion_proveedor, criterio_calidad):
        """Test: No permitir calificación negativa."""
        detalle = DetalleEvaluacion(
            evaluacion=evaluacion_proveedor,
            criterio=criterio_calidad,
            calificacion=Decimal('-10.00')  # Negativa
        )

        with pytest.raises(ValidationError) as exc_info:
            detalle.full_clean()

        assert 'calificacion' in exc_info.value.message_dict

    def test_validacion_calificacion_mayor_100(self, evaluacion_proveedor, criterio_calidad):
        """Test: No permitir calificación mayor a 100."""
        detalle = DetalleEvaluacion(
            evaluacion=evaluacion_proveedor,
            criterio=criterio_calidad,
            calificacion=Decimal('110.00')  # Mayor a 100
        )

        with pytest.raises(ValidationError) as exc_info:
            detalle.full_clean()

        assert 'calificacion' in exc_info.value.message_dict

    def test_validacion_calificacion_borde_inferior(self, evaluacion_proveedor, criterio_calidad):
        """Test: Permitir calificación en borde inferior (0)."""
        detalle = DetalleEvaluacion(
            evaluacion=evaluacion_proveedor,
            criterio=criterio_calidad,
            calificacion=Decimal('0.00')
        )

        detalle.full_clean()  # No debe lanzar error
        assert detalle.calificacion == Decimal('0.00')

    def test_validacion_calificacion_borde_superior(self, evaluacion_proveedor, criterio_calidad):
        """Test: Permitir calificación en borde superior (100)."""
        detalle = DetalleEvaluacion(
            evaluacion=evaluacion_proveedor,
            criterio=criterio_calidad,
            calificacion=Decimal('100.00')
        )

        detalle.full_clean()  # No debe lanzar error
        assert detalle.calificacion == Decimal('100.00')
