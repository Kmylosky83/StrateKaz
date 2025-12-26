"""
Tests para serializers de matriz_legal

Coverage:
- TipoNormaSerializer: serializacion basica
- NormaLegalSerializer: campos computados, nested serializers
- EmpresaNormaSerializer: validaciones, campos read-only
- EmpresaNormaCreateUpdateSerializer: validacion de justificacion
"""
import pytest
from datetime import date

from apps.motor_cumplimiento.matriz_legal.serializers import (
    TipoNormaSerializer,
    NormaLegalSerializer,
    EmpresaNormaSerializer,
    EmpresaNormaCreateUpdateSerializer
)


@pytest.mark.django_db
class TestTipoNormaSerializer:
    """Tests para TipoNormaSerializer."""

    def test_serializar_tipo_norma(self, tipo_norma):
        """
        Test: Serializacion de tipo de norma

        Given: Un tipo de norma existente
        When: Se serializa
        Then: Debe contener todos los campos esperados
        """
        # Act
        serializer = TipoNormaSerializer(tipo_norma)
        data = serializer.data

        # Assert
        assert data['id'] == tipo_norma.id
        assert data['codigo'] == 'LEY'
        assert data['nombre'] == 'Ley'
        assert data['is_active'] is True
        assert 'created_at' in data
        assert 'updated_at' in data


@pytest.mark.django_db
class TestNormaLegalSerializer:
    """Tests para NormaLegalSerializer."""

    def test_serializar_norma_legal(self, norma_legal):
        """
        Test: Serializacion de norma legal

        Given: Una norma legal existente
        When: Se serializa
        Then: Debe contener todos los campos y nested tipo_norma
        """
        # Act
        serializer = NormaLegalSerializer(norma_legal)
        data = serializer.data

        # Assert
        assert data['id'] == norma_legal.id
        assert data['numero'] == '1072'
        assert data['anio'] == 2015
        assert data['vigente'] is True
        assert 'tipo_norma' in data
        assert data['tipo_norma']['codigo'] == 'LEY'

    def test_serializar_codigo_completo(self, norma_legal):
        """
        Test: Campo computado codigo_completo

        Given: Una norma legal
        When: Se serializa
        Then: Debe incluir codigo_completo
        """
        # Act
        serializer = NormaLegalSerializer(norma_legal)
        data = serializer.data

        # Assert
        assert 'codigo_completo' in data
        assert data['codigo_completo'] == 'LEY 1072/2015'

    def test_serializar_sistemas_aplicables(self, norma_legal):
        """
        Test: Campo computado sistemas_aplicables

        Given: Una norma que aplica a SST
        When: Se serializa
        Then: sistemas_aplicables debe contener ['SST']
        """
        # Act
        serializer = NormaLegalSerializer(norma_legal)
        data = serializer.data

        # Assert
        assert 'sistemas_aplicables' in data
        assert 'SST' in data['sistemas_aplicables']
        assert len(data['sistemas_aplicables']) == 1


@pytest.mark.django_db
class TestEmpresaNormaSerializer:
    """Tests para EmpresaNormaSerializer."""

    def test_serializar_empresa_norma(self, empresa_norma):
        """
        Test: Serializacion de empresa-norma

        Given: Una relacion empresa-norma
        When: Se serializa
        Then: Debe contener todos los campos y nested norma
        """
        # Act
        serializer = EmpresaNormaSerializer(empresa_norma)
        data = serializer.data

        # Assert
        assert data['id'] == empresa_norma.id
        assert data['empresa_id'] == empresa_norma.empresa_id
        assert 'norma' in data
        assert data['norma']['numero'] == '1072'
        assert data['porcentaje_cumplimiento'] == 75
        assert data['aplica'] is True

    def test_serializar_estado_cumplimiento(self, empresa_norma):
        """
        Test: Campo computado estado_cumplimiento

        Given: Empresa-norma con 75% cumplimiento
        When: Se serializa
        Then: estado_cumplimiento debe ser 'Alto'
        """
        # Act
        serializer = EmpresaNormaSerializer(empresa_norma)
        data = serializer.data

        # Assert
        assert 'estado_cumplimiento' in data
        assert data['estado_cumplimiento'] == 'Alto'


@pytest.mark.django_db
class TestEmpresaNormaCreateUpdateSerializer:
    """Tests para EmpresaNormaCreateUpdateSerializer."""

    def test_validar_justificacion_cuando_no_aplica(self, empresa, norma_legal):
        """
        Test: Validacion de justificacion cuando norma no aplica

        Given: Datos con aplica=False sin justificacion
        When: Se valida
        Then: Debe lanzar ValidationError
        """
        # Arrange
        data = {
            'empresa_id': empresa.id,
            'norma': norma_legal.id,
            'aplica': False,
            'justificacion': '',  # Vacio
            'porcentaje_cumplimiento': 0
        }

        # Act
        serializer = EmpresaNormaCreateUpdateSerializer(data=data)

        # Assert
        assert not serializer.is_valid()
        assert 'justificacion' in serializer.errors

    def test_validar_con_justificacion_valida(self, empresa, norma_legal):
        """
        Test: Validacion exitosa cuando hay justificacion

        Given: Datos con aplica=False y justificacion
        When: Se valida
        Then: Debe ser valido
        """
        # Arrange
        data = {
            'empresa_id': empresa.id,
            'norma': norma_legal.id,
            'aplica': False,
            'justificacion': 'La empresa no realiza esta actividad',
            'porcentaje_cumplimiento': 0
        }

        # Act
        serializer = EmpresaNormaCreateUpdateSerializer(data=data)

        # Assert
        assert serializer.is_valid()
