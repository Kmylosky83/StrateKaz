"""
Shared factories — factory_boy para tests de StrateKaz.

Uso:
    from tests.factories import UserFactory, EmpresaConfigFactory

    user = UserFactory()                          # usuario con datos aleatorios
    user = UserFactory(first_name="Carlos")       # override parcial
    users = UserFactory.create_batch(5)           # 5 usuarios
    empresa = EmpresaConfigFactory()              # empresa con NIT colombiano

Todas las factories usan Faker('es_CO') para generar datos
realistas en contexto colombiano.
"""

import factory
from factory.django import DjangoModelFactory
from faker import Faker

fake = Faker("es_CO")


# =============================================================================
# CORE — USUARIOS
# =============================================================================


class UserFactory(DjangoModelFactory):
    """Factory para el modelo User (core.User)."""

    class Meta:
        model = "core.User"
        django_get_or_create = ("username",)
        skip_postgeneration_save = True

    username = factory.LazyFunction(lambda: fake.unique.user_name())
    email = factory.LazyAttribute(lambda obj: f"{obj.username}@example.com")
    first_name = factory.LazyFunction(lambda: fake.first_name())
    last_name = factory.LazyFunction(lambda: fake.last_name())
    password = factory.PostGenerationMethodCall("set_password", "testpass123")
    document_type = "CC"
    document_number = factory.LazyFunction(
        lambda: fake.unique.numerify(text="##########")
    )
    phone = factory.LazyFunction(lambda: fake.numerify(text="3#########"))
    is_active = True
    is_staff = False
    is_superuser = False


class AdminUserFactory(UserFactory):
    """Factory para superusuario."""

    is_staff = True
    is_superuser = True
    username = factory.LazyFunction(lambda: f"admin_{fake.unique.user_name()}")


# =============================================================================
# CONFIGURACION — EMPRESA
# =============================================================================


class EmpresaConfigFactory(DjangoModelFactory):
    """Factory para EmpresaConfig (configuracion.EmpresaConfig)."""

    class Meta:
        model = "configuracion.EmpresaConfig"
        django_get_or_create = ("nit",)

    nit = factory.LazyFunction(
        lambda: fake.unique.numerify(text="9########") + "-" + str(fake.random_digit())
    )
    razon_social = factory.LazyFunction(
        lambda: f"{fake.company()} S.A.S."
    )


# =============================================================================
# ESTRUCTURA ORGANIZACIONAL — AREA / PROCESO
# =============================================================================


class AreaFactory(DjangoModelFactory):
    """Factory para Area/Proceso (organizacion.Area)."""

    class Meta:
        model = "organizacion.Area"
        django_get_or_create = ("code",)

    code = factory.Sequence(lambda n: f"PROC-{n:03d}")
    name = factory.LazyFunction(lambda: fake.bs().title()[:100])
    tipo = factory.Iterator(["ESTRATEGICO", "MISIONAL", "APOYO", "EVALUACION"])
    description = factory.LazyFunction(lambda: fake.sentence(nb_words=10))
    created_by = factory.SubFactory(UserFactory)


# =============================================================================
# CORE — CARGO
# =============================================================================


class CargoFactory(DjangoModelFactory):
    """Factory para Cargo (core.Cargo)."""

    class Meta:
        model = "core.Cargo"
        django_get_or_create = ("code",)

    code = factory.Sequence(lambda n: f"CARGO-{n:03d}")
    name = factory.LazyFunction(lambda: fake.job()[:100])
    area = factory.SubFactory(AreaFactory)
    nivel_jerarquico = factory.Iterator(
        ["ESTRATEGICO", "TACTICO", "OPERATIVO", "APOYO"]
    )
    level = 0


# =============================================================================
# MI EQUIPO — COLABORADOR
# =============================================================================


class ColaboradorFactory(DjangoModelFactory):
    """Factory para Colaborador (colaboradores.Colaborador)."""

    class Meta:
        model = "colaboradores.Colaborador"
        django_get_or_create = ("numero_identificacion",)

    empresa = factory.SubFactory(EmpresaConfigFactory)
    numero_identificacion = factory.LazyFunction(
        lambda: fake.unique.numerify(text="##########")
    )
    tipo_documento = "CC"
    primer_nombre = factory.LazyFunction(lambda: fake.first_name())
    segundo_nombre = factory.LazyFunction(lambda: fake.first_name())
    primer_apellido = factory.LazyFunction(lambda: fake.last_name())
    segundo_apellido = factory.LazyFunction(lambda: fake.last_name())
    created_by = factory.SubFactory(UserFactory)
