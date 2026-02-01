"""
Tests para modelos de requisitos_legales

Coverage:
- TipoRequisito: creacion, soft delete
- RequisitoLegal: creacion, unique_together
- EmpresaRequisito: creacion, propiedades dias_para_vencer, esta_vencido, esta_proximo_vencer
- AlertaVencimiento: creacion, marcar_como_enviada, esta_pendiente
"""
import pytest
from datetime import date, timedelta
from django.db import IntegrityError
from django.utils import timezone

from apps.motor_cumplimiento.requisitos_legales.models import (
    TipoRequisito, RequisitoLegal, EmpresaRequisito, AlertaVencimiento
)


@pytest.mark.django_db
class TestTipoRequisito:
    """Tests para el modelo TipoRequisito."""

    def test_crear_tipo_requisito(self):
        """
        Test: Crear tipo de requisito

        Given: Datos validos de tipo requisito
        When: Se crea el tipo
        Then: Debe crearse correctamente
        """
        # Act
        tipo = TipoRequisito.objects.create(
            codigo='CON-BOM',
            nombre='Concepto de Bomberos',
            descripcion='Conceptos emitidos por bomberos',
            requiere_renovacion=True,
            dias_anticipacion_alerta=45,
            is_active=True
        )

        # Assert
        assert tipo.pk is not None
        assert tipo.codigo == 'CON-BOM'
        assert tipo.requiere_renovacion is True
        assert tipo.dias_anticipacion_alerta == 45

    def test_tipo_requisito_codigo_unico(self, tipo_requisito):
        """
        Test: El codigo debe ser unico

        Given: Un tipo de requisito existente
        When: Se intenta crear otro con mismo codigo
        Then: Debe lanzar IntegrityError
        """
        # Act & Assert
        with pytest.raises(IntegrityError):
            TipoRequisito.objects.create(
                codigo='LIC-AMB',  # Duplicado
                nombre='Otra Licencia',
                is_active=True
            )


@pytest.mark.django_db
class TestRequisitoLegal:
    """Tests para el modelo RequisitoLegal."""

    def test_crear_requisito_legal(self, tipo_requisito, user):
        """
        Test: Crear requisito legal

        Given: Datos validos de requisito
        When: Se crea el requisito
        Then: Debe crearse correctamente
        """
        # Act
        requisito = RequisitoLegal.objects.create(
            tipo=tipo_requisito,
            codigo='LIC-002',
            nombre='Licencia Ambiental Tipo B',
            descripcion='Licencia para comercio',
            entidad_emisora='CAR',
            base_legal='Decreto XXX',
            aplica_ambiental=True,
            es_obligatorio=True,
            is_active=True,
            created_by=user
        )

        # Assert
        assert requisito.pk is not None
        assert requisito.codigo == 'LIC-002'
        assert requisito.aplica_ambiental is True

    def test_requisito_legal_unique_together(self, requisito_legal, user):
        """
        Test: Tipo y codigo deben ser unicos juntos

        Given: Un requisito existente
        When: Se intenta crear otro con mismo tipo y codigo
        Then: Debe lanzar IntegrityError
        """
        # Act & Assert
        with pytest.raises(IntegrityError):
            RequisitoLegal.objects.create(
                tipo=requisito_legal.tipo,
                codigo='LIC-001',  # Duplicado
                nombre='Otro nombre',
                entidad_emisora='Otra entidad',
                created_by=user
            )


@pytest.mark.django_db
class TestEmpresaRequisito:
    """Tests para el modelo EmpresaRequisito."""

    def test_crear_empresa_requisito(self, empresa, requisito_legal, user):
        """
        Test: Crear empresa requisito

        Given: Empresa y requisito existentes
        When: Se crea la relacion
        Then: Debe crearse correctamente
        """
        # Act
        er = EmpresaRequisito.objects.create(
            empresa=empresa,
            requisito=requisito_legal,
            numero_documento='LIC-2025-100',
            fecha_expedicion=date.today(),
            fecha_vencimiento=date.today() + timedelta(days=365),
            estado=EmpresaRequisito.Estado.VIGENTE,
            is_active=True,
            created_by=user
        )

        # Assert
        assert er.pk is not None
        assert er.numero_documento == 'LIC-2025-100'
        assert er.estado == EmpresaRequisito.Estado.VIGENTE

    def test_dias_para_vencer_positivo(self, empresa_requisito):
        """
        Test: Calcular dias para vencer

        Given: Requisito con vencimiento futuro
        When: Se calcula dias_para_vencer
        Then: Debe retornar numero positivo de dias
        """
        # Act
        dias = empresa_requisito.dias_para_vencer

        # Assert
        assert dias is not None
        assert dias > 0
        assert dias == 60

    def test_dias_para_vencer_negativo_cuando_vencido(self, empresa, requisito_legal, user):
        """
        Test: Dias negativos cuando esta vencido

        Given: Requisito con vencimiento en el pasado
        When: Se calcula dias_para_vencer
        Then: Debe retornar numero negativo
        """
        # Arrange
        er = EmpresaRequisito.objects.create(
            empresa=empresa,
            requisito=requisito_legal,
            fecha_vencimiento=date.today() - timedelta(days=10),
            estado=EmpresaRequisito.Estado.VENCIDO,
            created_by=user
        )

        # Act
        dias = er.dias_para_vencer

        # Assert
        assert dias is not None
        assert dias < 0
        assert dias == -10

    def test_esta_vencido_true(self, empresa, requisito_legal, user):
        """
        Test: Verificar si esta vencido

        Given: Requisito vencido
        When: Se consulta esta_vencido
        Then: Debe retornar True
        """
        # Arrange
        er = EmpresaRequisito.objects.create(
            empresa=empresa,
            requisito=requisito_legal,
            fecha_vencimiento=date.today() - timedelta(days=5),
            estado=EmpresaRequisito.Estado.VENCIDO,
            created_by=user
        )

        # Act & Assert
        assert er.esta_vencido is True

    def test_esta_vencido_false(self, empresa_requisito):
        """
        Test: No esta vencido si fecha es futura

        Given: Requisito con fecha futura
        When: Se consulta esta_vencido
        Then: Debe retornar False
        """
        # Act & Assert
        assert empresa_requisito.esta_vencido is False

    def test_esta_proximo_vencer_true(self, empresa_requisito_por_vencer):
        """
        Test: Verificar si esta proximo a vencer

        Given: Requisito que vence en 15 dias (menos de 30)
        When: Se consulta esta_proximo_vencer
        Then: Debe retornar True
        """
        # Act & Assert
        assert empresa_requisito_por_vencer.esta_proximo_vencer is True

    def test_esta_proximo_vencer_false(self, empresa_requisito):
        """
        Test: No esta proximo a vencer si quedan mas dias

        Given: Requisito que vence en 60 dias (mas de 30)
        When: Se consulta esta_proximo_vencer
        Then: Debe retornar False
        """
        # Act & Assert
        assert empresa_requisito.esta_proximo_vencer is False


@pytest.mark.django_db
class TestAlertaVencimiento:
    """Tests para el modelo AlertaVencimiento."""

    def test_crear_alerta_vencimiento(self, empresa_requisito):
        """
        Test: Crear alerta de vencimiento

        Given: Empresa requisito existente
        When: Se crea la alerta
        Then: Debe crearse correctamente
        """
        # Act
        alerta = AlertaVencimiento.objects.create(
            empresa_requisito=empresa_requisito,
            dias_antes=15,
            tipo_alerta=AlertaVencimiento.TipoAlerta.EMAIL,
            destinatarios='admin@example.com',
            fecha_programada=empresa_requisito.fecha_vencimiento - timedelta(days=15),
            enviada=False
        )

        # Assert
        assert alerta.pk is not None
        assert alerta.dias_antes == 15
        assert alerta.enviada is False

    def test_marcar_como_enviada(self, alerta_vencimiento):
        """
        Test: Marcar alerta como enviada

        Given: Alerta no enviada
        When: Se ejecuta marcar_como_enviada()
        Then: enviada debe ser True y tener fecha_envio
        """
        # Arrange
        assert alerta_vencimiento.enviada is False
        assert alerta_vencimiento.fecha_envio is None

        # Act
        alerta_vencimiento.marcar_como_enviada()
        alerta_vencimiento.refresh_from_db()

        # Assert
        assert alerta_vencimiento.enviada is True
        assert alerta_vencimiento.fecha_envio is not None

    def test_esta_pendiente_true(self, empresa_requisito):
        """
        Test: Verificar si alerta esta pendiente

        Given: Alerta no enviada con fecha pasada
        When: Se consulta esta_pendiente
        Then: Debe retornar True
        """
        # Arrange
        alerta = AlertaVencimiento.objects.create(
            empresa_requisito=empresa_requisito,
            dias_antes=30,
            fecha_programada=date.today() - timedelta(days=1),
            enviada=False
        )

        # Act & Assert
        assert alerta.esta_pendiente is True

    def test_esta_pendiente_false_ya_enviada(self, alerta_vencimiento):
        """
        Test: No esta pendiente si ya fue enviada

        Given: Alerta ya enviada
        When: Se consulta esta_pendiente
        Then: Debe retornar False
        """
        # Arrange
        alerta_vencimiento.marcar_como_enviada()

        # Act & Assert
        assert alerta_vencimiento.esta_pendiente is False
