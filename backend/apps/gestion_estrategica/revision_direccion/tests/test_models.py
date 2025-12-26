"""
Tests para modelos de Revision por la Direccion
"""
import pytest
from datetime import date, timedelta
from django.core.exceptions import ValidationError

from apps.gestion_estrategica.revision_direccion.models import (
    ProgramaRevision, ParticipanteRevision, TemaRevision,
    ActaRevision, AnalisisTemaActa, CompromisoRevision,
    SeguimientoCompromiso
)


@pytest.mark.django_db
class TestProgramaRevision:
    """Tests para el modelo ProgramaRevision"""

    def test_crear_programa(self, programa_revision):
        """Test crear programa de revision"""
        assert programa_revision.id is not None
        assert programa_revision.periodo == 'Primer Semestre 2025'
        assert programa_revision.estado == 'programada'
        assert programa_revision.is_active is True

    def test_programa_str(self, programa_revision):
        """Test representacion string del programa"""
        assert 'Primer Semestre 2025' in str(programa_revision)

    def test_programa_unique_together(self, programa_revision, empresa, user):
        """Test restriccion unique_together"""
        with pytest.raises(Exception):
            ProgramaRevision.objects.create(
                empresa=empresa,
                anio=2025,
                periodo='Primer Semestre 2025',  # Mismo periodo
                frecuencia='semestral',
                fecha_programada=date.today() + timedelta(days=30),
                created_by=user
            )

    def test_programa_soft_delete(self, programa_revision):
        """Test soft delete del programa"""
        programa_revision.soft_delete()
        assert programa_revision.is_active is False
        assert programa_revision.deleted_at is not None


@pytest.mark.django_db
class TestParticipanteRevision:
    """Tests para el modelo ParticipanteRevision"""

    def test_crear_participante(self, participante_revision):
        """Test crear participante"""
        assert participante_revision.id is not None
        assert participante_revision.rol == 'direccion'
        assert participante_revision.es_obligatorio is True

    def test_participante_str(self, participante_revision):
        """Test representacion string del participante"""
        assert 'Alta Direcci' in str(participante_revision)


@pytest.mark.django_db
class TestTemaRevision:
    """Tests para el modelo TemaRevision"""

    def test_crear_tema(self, tema_revision):
        """Test crear tema de revision"""
        assert tema_revision.id is not None
        assert tema_revision.categoria == 'objetivos'
        assert tema_revision.orden == 1

    def test_tema_str(self, tema_revision):
        """Test representacion string del tema"""
        assert '1.' in str(tema_revision)


@pytest.mark.django_db
class TestActaRevision:
    """Tests para el modelo ActaRevision"""

    def test_crear_acta(self, acta_revision):
        """Test crear acta de revision"""
        assert acta_revision.id is not None
        assert acta_revision.numero_acta == 'ACTA-RXD-2025-001'
        assert acta_revision.evaluacion_sistema == 'adecuado'

    def test_acta_str(self, acta_revision):
        """Test representacion string del acta"""
        assert 'ACTA-RXD-2025-001' in str(acta_revision)

    def test_acta_soft_delete(self, acta_revision):
        """Test soft delete del acta"""
        acta_revision.soft_delete()
        assert acta_revision.is_active is False


@pytest.mark.django_db
class TestCompromisoRevision:
    """Tests para el modelo CompromisoRevision"""

    def test_crear_compromiso(self, compromiso_revision):
        """Test crear compromiso"""
        assert compromiso_revision.id is not None
        assert compromiso_revision.tipo == 'mejora'
        assert compromiso_revision.estado == 'pendiente'

    def test_compromiso_str(self, compromiso_revision):
        """Test representacion string del compromiso"""
        assert 'COMP-RXD-2025-001' in str(compromiso_revision)

    def test_compromiso_dias_para_vencer(self, compromiso_revision):
        """Test propiedad dias_para_vencer"""
        dias = compromiso_revision.dias_para_vencer
        assert dias is not None
        assert dias > 0  # Fecha futura

    def test_compromiso_esta_vencido_false(self, compromiso_revision):
        """Test propiedad esta_vencido cuando no esta vencido"""
        assert compromiso_revision.esta_vencido is False

    def test_compromiso_vencido(self, acta_revision, user):
        """Test compromiso vencido"""
        compromiso = CompromisoRevision.objects.create(
            acta=acta_revision,
            consecutivo='COMP-VENCIDO-001',
            tipo='mejora',
            descripcion='Compromiso vencido',
            responsable=user,
            fecha_compromiso=date.today() - timedelta(days=10),
            estado='pendiente',
            created_by=user
        )
        assert compromiso.esta_vencido is True

    def test_compromiso_soft_delete(self, compromiso_revision):
        """Test soft delete del compromiso"""
        compromiso_revision.soft_delete()
        assert compromiso_revision.is_active is False


@pytest.mark.django_db
class TestSeguimientoCompromiso:
    """Tests para el modelo SeguimientoCompromiso"""

    def test_crear_seguimiento(self, seguimiento_compromiso):
        """Test crear seguimiento"""
        assert seguimiento_compromiso.id is not None
        assert seguimiento_compromiso.porcentaje_avance == 25

    def test_seguimiento_str(self, seguimiento_compromiso):
        """Test representacion string del seguimiento"""
        assert 'Seguimiento' in str(seguimiento_compromiso)

    def test_seguimiento_actualiza_compromiso(self, compromiso_revision, user):
        """Test que seguimiento actualiza el avance del compromiso"""
        SeguimientoCompromiso.objects.create(
            compromiso=compromiso_revision,
            fecha=date.today(),
            porcentaje_avance=50,
            descripcion_avance='Avance al 50%',
            registrado_por=user
        )
        compromiso_revision.refresh_from_db()
        assert compromiso_revision.porcentaje_avance == 50
        assert compromiso_revision.estado == 'en_progreso'

    def test_seguimiento_completa_compromiso(self, compromiso_revision, user):
        """Test que seguimiento al 100% completa el compromiso"""
        SeguimientoCompromiso.objects.create(
            compromiso=compromiso_revision,
            fecha=date.today(),
            porcentaje_avance=100,
            descripcion_avance='Completado',
            registrado_por=user
        )
        compromiso_revision.refresh_from_db()
        assert compromiso_revision.porcentaje_avance == 100
        assert compromiso_revision.estado == 'completado'
        assert compromiso_revision.fecha_cumplimiento is not None
