"""
Tests para modelos de matriz_legal

Coverage:
- TipoNorma: creacion, soft delete, validaciones
- NormaLegal: creacion, propiedades computadas, filtrado por sistema
- EmpresaNorma: creacion, estado_cumplimiento, unique_together
"""
import pytest
from datetime import date
from django.db import IntegrityError

from apps.motor_cumplimiento.matriz_legal.models import (
    TipoNorma, NormaLegal, EmpresaNorma
)


@pytest.mark.django_db
class TestTipoNorma:
    """Tests para el modelo TipoNorma."""

    def test_crear_tipo_norma_basico(self):
        """
        Test: Crear tipo de norma con campos basicos

        Given: Datos validos de tipo de norma
        When: Se crea el tipo de norma
        Then: Debe crearse correctamente con todos los campos
        """
        # Arrange & Act
        tipo = TipoNorma.objects.create(
            codigo='RES',
            nombre='Resolucion',
            descripcion='Resoluciones ministeriales',
            is_active=True
        )

        # Assert
        assert tipo.pk is not None
        assert tipo.codigo == 'RES'
        assert tipo.nombre == 'Resolucion'
        assert tipo.is_active is True
        assert tipo.deleted_at is None

    def test_tipo_norma_codigo_unico(self, tipo_norma):
        """
        Test: El codigo de tipo norma debe ser unico

        Given: Un tipo de norma existente
        When: Se intenta crear otro con el mismo codigo
        Then: Debe lanzar IntegrityError
        """
        # Act & Assert
        with pytest.raises(IntegrityError):
            TipoNorma.objects.create(
                codigo='LEY',  # Duplicado
                nombre='Ley Nacional',
                is_active=True
            )

    def test_tipo_norma_soft_delete(self, tipo_norma):
        """
        Test: Soft delete de tipo de norma

        Given: Un tipo de norma activo
        When: Se ejecuta soft_delete()
        Then: is_active debe ser False y deleted_at debe tener fecha
        """
        # Arrange
        assert tipo_norma.is_active is True
        assert tipo_norma.deleted_at is None

        # Act
        tipo_norma.soft_delete()
        tipo_norma.refresh_from_db()

        # Assert
        assert tipo_norma.is_active is False
        assert tipo_norma.deleted_at is not None

    def test_tipo_norma_restore(self, tipo_norma):
        """
        Test: Restaurar tipo de norma eliminado

        Given: Un tipo de norma soft-deleted
        When: Se ejecuta restore()
        Then: is_active debe ser True y deleted_at debe ser None
        """
        # Arrange
        tipo_norma.soft_delete()
        assert tipo_norma.is_active is False

        # Act
        tipo_norma.restore()
        tipo_norma.refresh_from_db()

        # Assert
        assert tipo_norma.is_active is True
        assert tipo_norma.deleted_at is None

    def test_tipo_norma_str_representation(self, tipo_norma):
        """
        Test: Representacion string del tipo de norma

        Given: Un tipo de norma creado
        When: Se convierte a string
        Then: Debe retornar 'CODIGO - Nombre'
        """
        # Act
        str_result = str(tipo_norma)

        # Assert
        assert 'LEY' in str_result
        assert 'Ley' in str_result


@pytest.mark.django_db
class TestNormaLegal:
    """Tests para el modelo NormaLegal."""

    def test_crear_norma_legal_completa(self, tipo_norma):
        """
        Test: Crear norma legal con todos los campos

        Given: Datos completos de norma legal
        When: Se crea la norma
        Then: Debe crearse correctamente
        """
        # Act
        norma = NormaLegal.objects.create(
            tipo_norma=tipo_norma,
            numero='1562',
            anio=2012,
            titulo='Sistema de Gestion de SST',
            entidad_emisora='Ministerio del Trabajo',
            fecha_expedicion=date(2012, 7, 11),
            fecha_vigencia=date(2012, 7, 11),
            url_original='https://example.com',
            resumen='Norma de SST',
            aplica_sst=True,
            vigente=True,
            is_active=True
        )

        # Assert
        assert norma.pk is not None
        assert norma.numero == '1562'
        assert norma.anio == 2012
        assert norma.aplica_sst is True
        assert norma.vigente is True

    def test_norma_legal_codigo_completo_property(self, norma_legal):
        """
        Test: Propiedad codigo_completo

        Given: Una norma legal existente
        When: Se accede a codigo_completo
        Then: Debe retornar 'TIPO NUMERO/ANIO'
        """
        # Act
        codigo = norma_legal.codigo_completo

        # Assert
        assert codigo == 'LEY 1072/2015'

    def test_norma_legal_get_by_sistema_sst(self, norma_legal, norma_ambiental):
        """
        Test: Filtrar normas por sistema SST

        Given: Normas de SST y Ambiental
        When: Se consulta get_by_sistema('sst')
        Then: Solo debe retornar normas de SST activas y vigentes
        """
        # Act
        normas_sst = NormaLegal.get_by_sistema('sst')

        # Assert
        assert normas_sst.count() == 1
        assert norma_legal in normas_sst
        assert norma_ambiental not in normas_sst

    def test_norma_legal_get_by_sistema_ambiental(self, norma_legal, norma_ambiental):
        """
        Test: Filtrar normas por sistema Ambiental

        Given: Normas de SST y Ambiental
        When: Se consulta get_by_sistema('ambiental')
        Then: Solo debe retornar normas ambientales
        """
        # Act
        normas_amb = NormaLegal.get_by_sistema('ambiental')

        # Assert
        assert normas_amb.count() == 1
        assert norma_ambiental in normas_amb
        assert norma_legal not in normas_amb

    def test_norma_legal_str_representation(self, norma_legal):
        """
        Test: Representacion string de norma legal

        Given: Una norma legal
        When: Se convierte a string
        Then: Debe retornar 'TIPO NUMERO de ANIO'
        """
        # Act
        str_result = str(norma_legal)

        # Assert
        assert 'LEY 1072 de 2015' in str_result


@pytest.mark.django_db
class TestEmpresaNorma:
    """Tests para el modelo EmpresaNorma."""

    def test_crear_empresa_norma_basica(self, empresa, norma_legal, responsable_user, user):
        """
        Test: Crear relacion empresa-norma

        Given: Empresa y norma existentes
        When: Se crea la relacion
        Then: Debe crearse correctamente
        """
        # Act
        empresa_norma = EmpresaNorma.objects.create(
            empresa=empresa,
            norma=norma_legal,
            responsable=responsable_user,
            aplica=True,
            porcentaje_cumplimiento=50,
            is_active=True,
            created_by=user
        )

        # Assert
        assert empresa_norma.pk is not None
        assert empresa_norma.empresa == empresa
        assert empresa_norma.norma == norma_legal
        assert empresa_norma.porcentaje_cumplimiento == 50

    def test_empresa_norma_unique_together(self, empresa_norma, user):
        """
        Test: Empresa y norma deben ser unicos juntos

        Given: Una relacion empresa-norma existente
        When: Se intenta crear otra con misma empresa y norma
        Then: Debe lanzar IntegrityError
        """
        # Act & Assert
        with pytest.raises(IntegrityError):
            EmpresaNorma.objects.create(
                empresa=empresa_norma.empresa,
                norma=empresa_norma.norma,  # Duplicado
                aplica=True,
                created_by=user
            )

    def test_empresa_norma_estado_cumplimiento_cumple(self, empresa, norma_legal, user):
        """
        Test: Estado cumplimiento cuando cumple 100%

        Given: Empresa-norma con 100% cumplimiento
        When: Se consulta estado_cumplimiento
        Then: Debe retornar 'Cumple'
        """
        # Arrange
        en = EmpresaNorma.objects.create(
            empresa=empresa,
            norma=norma_legal,
            aplica=True,
            porcentaje_cumplimiento=100,
            created_by=user
        )

        # Act
        estado = en.estado_cumplimiento

        # Assert
        assert estado == 'Cumple'

    def test_empresa_norma_estado_cumplimiento_alto(self, empresa, norma_legal, user):
        """
        Test: Estado cumplimiento alto (75%)

        Given: Empresa-norma con 75% cumplimiento
        When: Se consulta estado_cumplimiento
        Then: Debe retornar 'Alto'
        """
        # Arrange
        en = EmpresaNorma.objects.create(
            empresa=empresa,
            norma=norma_legal,
            aplica=True,
            porcentaje_cumplimiento=75,
            created_by=user
        )

        # Act
        estado = en.estado_cumplimiento

        # Assert
        assert estado == 'Alto'

    def test_empresa_norma_estado_cumplimiento_medio(self, empresa, norma_legal, user):
        """
        Test: Estado cumplimiento medio (50%)

        Given: Empresa-norma con 50% cumplimiento
        When: Se consulta estado_cumplimiento
        Then: Debe retornar 'Medio'
        """
        # Arrange
        en = EmpresaNorma.objects.create(
            empresa=empresa,
            norma=norma_legal,
            aplica=True,
            porcentaje_cumplimiento=50,
            created_by=user
        )

        # Act
        estado = en.estado_cumplimiento

        # Assert
        assert estado == 'Medio'

    def test_empresa_norma_estado_cumplimiento_bajo(self, empresa, norma_legal, user):
        """
        Test: Estado cumplimiento bajo (25%)

        Given: Empresa-norma con 25% cumplimiento
        When: Se consulta estado_cumplimiento
        Then: Debe retornar 'Bajo'
        """
        # Arrange
        en = EmpresaNorma.objects.create(
            empresa=empresa,
            norma=norma_legal,
            aplica=True,
            porcentaje_cumplimiento=25,
            created_by=user
        )

        # Act
        estado = en.estado_cumplimiento

        # Assert
        assert estado == 'Bajo'

    def test_empresa_norma_estado_cumplimiento_no_evaluado(self, empresa, norma_legal, user):
        """
        Test: Estado cumplimiento no evaluado (0%)

        Given: Empresa-norma con 0% cumplimiento
        When: Se consulta estado_cumplimiento
        Then: Debe retornar 'No evaluado'
        """
        # Arrange
        en = EmpresaNorma.objects.create(
            empresa=empresa,
            norma=norma_legal,
            aplica=True,
            porcentaje_cumplimiento=0,
            created_by=user
        )

        # Act
        estado = en.estado_cumplimiento

        # Assert
        assert estado == 'No evaluado'

    def test_empresa_norma_str_representation(self, empresa_norma):
        """
        Test: Representacion string de empresa-norma

        Given: Una relacion empresa-norma
        When: Se convierte a string
        Then: Debe contener razon social y norma
        """
        # Act
        str_result = str(empresa_norma)

        # Assert
        assert 'StrateKaz' in str_result
        assert '1072' in str_result
