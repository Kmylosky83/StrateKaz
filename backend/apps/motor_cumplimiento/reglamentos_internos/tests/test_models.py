"""
Tests para modelos de reglamentos_internos

Coverage:
- TipoReglamento: creacion, unique codigo
- Reglamento: creacion, estados, unique_together, versionamiento
- VersionReglamento: creacion, unique_together
- PublicacionReglamento: creacion, medios
- SocializacionReglamento: creacion, tipos
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from django.db import IntegrityError

from apps.motor_cumplimiento.reglamentos_internos.models import (
    TipoReglamento, Reglamento, VersionReglamento, PublicacionReglamento, SocializacionReglamento
)


@pytest.mark.django_db
class TestTipoReglamento:
    """Tests para TipoReglamento."""

    def test_crear_tipo_reglamento(self):
        """Test: Crear tipo de reglamento."""
        tipo = TipoReglamento.objects.create(
            codigo='MANUAL-SST',
            nombre='Manual de SST',
            descripcion='Manual del sistema de gestion de SST',
            requiere_aprobacion_legal=False,
            vigencia_anios=1,
            orden=1,
            is_active=True
        )

        assert tipo.pk is not None
        assert tipo.codigo == 'MANUAL-SST'
        assert tipo.vigencia_anios == 1

    def test_codigo_unico(self, tipo_reglamento):
        """Test: Codigo debe ser unico."""
        with pytest.raises(IntegrityError):
            TipoReglamento.objects.create(
                codigo='RITH',  # Duplicado
                nombre='Otro'
            )


@pytest.mark.django_db
class TestReglamento:
    """Tests para Reglamento."""

    def test_crear_reglamento_borrador(self, empresa, tipo_reglamento, user):
        """Test: Crear reglamento en estado borrador."""
        reglamento = Reglamento.objects.create(
            empresa=empresa,
            tipo=tipo_reglamento,
            codigo='RITH-2026',
            nombre='Reglamento 2026',
            estado=Reglamento.Estado.BORRADOR,
            version_actual='0.1',
            orden=1,
            created_by=user
        )

        assert reglamento.pk is not None
        assert reglamento.estado == 'borrador'
        assert reglamento.version_actual == '0.1'

    def test_reglamento_unique_together(self, reglamento, user):
        """Test: Empresa, tipo y codigo deben ser unicos juntos."""
        with pytest.raises(IntegrityError):
            Reglamento.objects.create(
                empresa=reglamento.empresa,
                tipo=reglamento.tipo,
                codigo='RITH-2025',  # Duplicado
                nombre='Otro nombre',
                created_by=user
            )

    def test_reglamento_permite_mismo_codigo_diferente_empresa(
        self, empresa_secundaria, reglamento, user
    ):
        """Test: Mismo codigo es permitido en diferente empresa."""
        reglamento2 = Reglamento.objects.create(
            empresa=empresa_secundaria,  # Diferente empresa
            tipo=reglamento.tipo,
            codigo='RITH-2025',  # Mismo codigo
            nombre='Reglamento empresa 2',
            created_by=user
        )

        assert reglamento2.pk is not None
        assert reglamento2.empresa != reglamento.empresa

    def test_reglamento_str_representation(self, reglamento):
        """Test: Representacion string incluye codigo, nombre y version."""
        str_result = str(reglamento)
        assert 'RITH-2025' in str_result
        assert 'v1.0' in str_result


@pytest.mark.django_db
class TestVersionReglamento:
    """Tests para VersionReglamento."""

    def test_crear_version(self, empresa, reglamento, user):
        """Test: Crear version de reglamento."""
        version = VersionReglamento.objects.create(
            empresa=empresa,
            reglamento=reglamento,
            numero_version='2.0',
            fecha_version=date.today(),
            cambios_realizados='Actualizacion de articulos 5 y 7',
            motivo_cambio='Cambios en legislacion laboral',
            elaborado_por=user,
            created_by=user
        )

        assert version.pk is not None
        assert version.numero_version == '2.0'

    def test_version_unique_together(self, version_reglamento, user):
        """Test: Reglamento y numero_version deben ser unicos."""
        with pytest.raises(IntegrityError):
            VersionReglamento.objects.create(
                empresa=version_reglamento.empresa,
                reglamento=version_reglamento.reglamento,
                numero_version='1.0',  # Duplicado
                fecha_version=date.today(),
                cambios_realizados='Otros cambios',
                created_by=user
            )


@pytest.mark.django_db
class TestPublicacionReglamento:
    """Tests para PublicacionReglamento."""

    def test_crear_publicacion(self, empresa, reglamento, user):
        """Test: Crear publicacion de reglamento."""
        pub = PublicacionReglamento.objects.create(
            empresa=empresa,
            reglamento=reglamento,
            version_publicada='1.0',
            fecha_publicacion=date.today(),
            medio=PublicacionReglamento.MedioPublicacion.INTRANET,
            ubicacion='Portal corporativo',
            publicado_por=user,
            created_by=user
        )

        assert pub.pk is not None
        assert pub.medio == 'intranet'

    def test_publicacion_str_representation(self, publicacion_reglamento):
        """Test: Representacion string incluye codigo, medio y fecha."""
        str_result = str(publicacion_reglamento)
        assert 'RITH-2025' in str_result
        assert 'Cartelera' in str_result


@pytest.mark.django_db
class TestSocializacionReglamento:
    """Tests para SocializacionReglamento."""

    def test_crear_socializacion(self, empresa, reglamento, responsable_user, user):
        """Test: Crear socializacion de reglamento."""
        social = SocializacionReglamento.objects.create(
            empresa=empresa,
            reglamento=reglamento,
            tipo=SocializacionReglamento.TipoSocializacion.CAPACITACION,
            fecha=date.today(),
            duracion_horas=Decimal('3.5'),
            facilitador=responsable_user,
            numero_asistentes=40,
            temas_tratados='Capitulos 1 al 5',
            created_by=user
        )

        assert social.pk is not None
        assert social.tipo == 'capacitacion'
        assert social.duracion_horas == Decimal('3.5')

    def test_socializacion_str_representation(self, socializacion_reglamento):
        """Test: Representacion string incluye codigo, tipo y fecha."""
        str_result = str(socializacion_reglamento)
        assert 'RITH-2025' in str_result
        assert 'Induccion' in str_result or 'Inducción' in str_result
