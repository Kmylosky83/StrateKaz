"""
Fixtures especificas para tests de partes_interesadas
"""
import pytest

from apps.motor_cumplimiento.partes_interesadas.models import (
    TipoParteInteresada, ParteInteresada, RequisitoParteInteresada, MatrizComunicacion
)


@pytest.fixture
def tipo_parte_interesada(db):
    """Tipo de parte interesada interna."""
    return TipoParteInteresada.objects.create(
        codigo='TRAB',
        nombre='Trabajadores',
        categoria=TipoParteInteresada.Categoria.INTERNA,
        descripcion='Empleados de la organizacion',
        orden=1,
        is_active=True
    )


@pytest.fixture
def tipo_parte_externa(db):
    """Tipo de parte interesada externa."""
    return TipoParteInteresada.objects.create(
        codigo='PROV',
        nombre='Proveedores',
        categoria=TipoParteInteresada.Categoria.EXTERNA,
        descripcion='Proveedores y contratistas',
        orden=2,
        is_active=True
    )


@pytest.fixture
def parte_interesada(db, empresa, tipo_parte_interesada, user):
    """Parte interesada de prueba."""
    return ParteInteresada.objects.create(
        empresa=empresa,
        tipo=tipo_parte_interesada,
        nombre='Sindicato de Trabajadores',
        descripcion='Sindicato que representa a los empleados',
        representante='Juan Perez',
        cargo_representante='Presidente del Sindicato',
        telefono='3001234567',
        email='sindicato@example.com',
        nivel_influencia=ParteInteresada.NivelInfluencia.ALTA,
        nivel_interes=ParteInteresada.NivelInteres.ALTO,
        relacionado_sst=True,
        relacionado_ambiental=False,
        is_active=True,
        created_by=user
    )


@pytest.fixture
def requisito_parte_interesada(db, empresa, parte_interesada, user):
    """Requisito de parte interesada."""
    return RequisitoParteInteresada.objects.create(
        empresa=empresa,
        parte_interesada=parte_interesada,
        tipo=RequisitoParteInteresada.TipoRequisito.EXPECTATIVA,
        descripcion='Mejores condiciones laborales',
        prioridad=RequisitoParteInteresada.Prioridad.ALTA,
        como_se_aborda='Negociacion colectiva anual',
        cumple=True,
        is_active=True,
        created_by=user
    )


@pytest.fixture
def matriz_comunicacion(db, empresa, parte_interesada, responsable_user, user):
    """Matriz de comunicacion."""
    return MatrizComunicacion.objects.create(
        empresa=empresa,
        parte_interesada=parte_interesada,
        que_comunicar='Estado del sistema de gestion de SST',
        cuando_comunicar=MatrizComunicacion.FrecuenciaComunicacion.MENSUAL,
        como_comunicar=MatrizComunicacion.MedioComunicacion.REUNION,
        responsable=responsable_user,
        aplica_sst=True,
        is_active=True,
        created_by=user
    )
