"""
Tests para modelos de partes_interesadas

Coverage:
- TipoParteInteresada: creacion, categorias
- ParteInteresada: creacion, niveles influencia/interes
- RequisitoParteInteresada: creacion, tipos
- MatrizComunicacion: creacion, frecuencias
"""
import pytest
from django.db import IntegrityError

from apps.motor_cumplimiento.partes_interesadas.models import (
    TipoParteInteresada, ParteInteresada, RequisitoParteInteresada, MatrizComunicacion
)


@pytest.mark.django_db
class TestTipoParteInteresada:
    """Tests para TipoParteInteresada."""

    def test_crear_tipo_parte_interna(self):
        """Test: Crear tipo parte interesada interna."""
        tipo = TipoParteInteresada.objects.create(
            codigo='GERENCIA',
            nombre='Alta Gerencia',
            categoria=TipoParteInteresada.Categoria.INTERNA,
            orden=1,
            is_active=True
        )

        assert tipo.pk is not None
        assert tipo.categoria == 'interna'
        assert tipo.get_categoria_display() == 'Interna'

    def test_codigo_unico(self, tipo_parte_interesada):
        """Test: Codigo debe ser unico."""
        with pytest.raises(IntegrityError):
            TipoParteInteresada.objects.create(
                codigo='TRAB',  # Duplicado
                nombre='Otro'
            )


@pytest.mark.django_db
class TestParteInteresada:
    """Tests para ParteInteresada."""

    def test_crear_parte_interesada(self, empresa, tipo_parte_interesada, user):
        """Test: Crear parte interesada basica."""
        parte = ParteInteresada.objects.create(
            empresa=empresa,
            tipo=tipo_parte_interesada,
            nombre='Comite de Convivencia',
            nivel_influencia=ParteInteresada.NivelInfluencia.MEDIA,
            nivel_interes=ParteInteresada.NivelInteres.ALTO,
            relacionado_sst=True,
            created_by=user
        )

        assert parte.pk is not None
        assert parte.nivel_influencia == 'media'
        assert parte.nivel_interes == 'alto'

    def test_str_representation(self, parte_interesada):
        """Test: Representacion string incluye nombre y tipo."""
        str_result = str(parte_interesada)
        assert 'Sindicato de Trabajadores' in str_result
        assert 'Trabajadores' in str_result


@pytest.mark.django_db
class TestRequisitoParteInteresada:
    """Tests para RequisitoParteInteresada."""

    def test_crear_requisito(self, empresa, parte_interesada, user):
        """Test: Crear requisito de parte interesada."""
        req = RequisitoParteInteresada.objects.create(
            empresa=empresa,
            parte_interesada=parte_interesada,
            tipo=RequisitoParteInteresada.TipoRequisito.NECESIDAD,
            descripcion='Capacitacion en seguridad',
            prioridad=RequisitoParteInteresada.Prioridad.ALTA,
            cumple=False,
            created_by=user
        )

        assert req.pk is not None
        assert req.tipo == 'necesidad'
        assert req.cumple is False


@pytest.mark.django_db
class TestMatrizComunicacion:
    """Tests para MatrizComunicacion."""

    def test_crear_matriz_comunicacion(self, empresa, parte_interesada, responsable_user, user):
        """Test: Crear entrada en matriz de comunicacion."""
        matriz = MatrizComunicacion.objects.create(
            empresa=empresa,
            parte_interesada=parte_interesada,
            que_comunicar='Resultados de auditorias',
            cuando_comunicar=MatrizComunicacion.FrecuenciaComunicacion.TRIMESTRAL,
            como_comunicar=MatrizComunicacion.MedioComunicacion.EMAIL,
            responsable=responsable_user,
            aplica_calidad=True,
            created_by=user
        )

        assert matriz.pk is not None
        assert matriz.cuando_comunicar == 'trimestral'
        assert matriz.como_comunicar == 'email'

    def test_str_representation(self, matriz_comunicacion):
        """Test: Representacion string incluye parte y frecuencia."""
        str_result = str(matriz_comunicacion)
        assert 'Sindicato de Trabajadores' in str_result
        assert 'Mensual' in str_result
