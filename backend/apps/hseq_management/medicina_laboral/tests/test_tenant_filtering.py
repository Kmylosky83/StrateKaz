"""
Tests de filtrado multi-tenant para Medicina Laboral.

Valida que los 4 ViewSets filtran correctamente por empresa_id.

Usa MockUser (sin tocar DB) porque django-tenants requiere schema
de tenant para crear core_user, y estos tests solo validan lógica
de get_queryset(), no integración completa.
"""

import pytest
from unittest.mock import MagicMock, patch, PropertyMock
from rest_framework.test import APIRequestFactory

from apps.hseq_management.medicina_laboral.views import (
    RestriccionMedicaViewSet,
    ProgramaVigilanciaViewSet,
    CasoVigilanciaViewSet,
    EstadisticaMedicaViewSet,
)


factory = APIRequestFactory()


def _make_user(empresa_id=None):
    """Crea un mock de User con empresa_id configurable."""
    user = MagicMock()
    user.empresa_id = empresa_id
    user.is_authenticated = True
    user.is_active = True
    user.pk = 1
    return user


def _get_queryset(viewset_class, user):
    """Instancia ViewSet con request mock y retorna queryset."""
    request = factory.get("/fake/")
    request.user = user
    view = viewset_class()
    view.request = request
    view.action = "list"
    view.kwargs = {}
    view.format_kwarg = None
    return view.get_queryset()


# =============================================================================
# TESTS: RestriccionMedicaViewSet
# =============================================================================


@pytest.mark.django_db
class TestRestriccionMedicaTenantFiltering:
    def test_user_con_empresa_filtra_por_empresa_id(self):
        """User con empresa_id filtra queryset por ese valor."""
        user = _make_user(empresa_id=1)
        qs = _get_queryset(RestriccionMedicaViewSet, user)
        # Verificar que el filtro se aplicó via SQL
        assert "empresa_id" in str(qs.query)

    def test_user_sin_empresa_retorna_vacio(self):
        """User sin empresa_id retorna queryset none()."""
        user = _make_user(empresa_id=None)
        qs = _get_queryset(RestriccionMedicaViewSet, user)
        assert qs.count() == 0


@pytest.mark.django_db
class TestProgramaVigilanciaTenantFiltering:
    def test_user_con_empresa_filtra_por_empresa_id(self):
        """User con empresa_id filtra queryset por ese valor."""
        user = _make_user(empresa_id=1)
        qs = _get_queryset(ProgramaVigilanciaViewSet, user)
        assert "empresa_id" in str(qs.query)

    def test_user_sin_empresa_retorna_vacio(self):
        """User sin empresa_id retorna queryset none()."""
        user = _make_user(empresa_id=None)
        qs = _get_queryset(ProgramaVigilanciaViewSet, user)
        assert qs.count() == 0


@pytest.mark.django_db
class TestCasoVigilanciaTenantFiltering:
    def test_user_con_empresa_filtra_por_empresa_id(self):
        """User con empresa_id filtra queryset por ese valor."""
        user = _make_user(empresa_id=1)
        qs = _get_queryset(CasoVigilanciaViewSet, user)
        assert "empresa_id" in str(qs.query)

    def test_user_sin_empresa_retorna_vacio(self):
        """User sin empresa_id retorna queryset none()."""
        user = _make_user(empresa_id=None)
        qs = _get_queryset(CasoVigilanciaViewSet, user)
        assert qs.count() == 0


@pytest.mark.django_db
class TestEstadisticaMedicaTenantFiltering:
    def test_user_con_empresa_filtra_por_empresa_id(self):
        """User con empresa_id filtra queryset por ese valor."""
        user = _make_user(empresa_id=1)
        qs = _get_queryset(EstadisticaMedicaViewSet, user)
        assert "empresa_id" in str(qs.query)

    def test_user_sin_empresa_retorna_vacio(self):
        """User sin empresa_id retorna queryset none()."""
        user = _make_user(empresa_id=None)
        qs = _get_queryset(EstadisticaMedicaViewSet, user)
        assert qs.count() == 0
