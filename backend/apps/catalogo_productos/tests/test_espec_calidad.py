"""
Tests para ProductoEspecCalidad — extensión de calidad fisicoquímica.

Cubre: patrón OneToOne, CheckConstraint de rango, clean(), classmethod
obtener_por_acidez, consumo defensivo vía hasattr.
"""
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.catalogo_productos.extensiones.espec_calidad import ProductoEspecCalidad


pytestmark = pytest.mark.django_db


class TestProductoEspecCalidadCreation:
    """Creación, relación OneToOne y tipos de datos."""

    def test_create_con_rango_valido(self, espec_calidad):
        assert espec_calidad.pk is not None
        assert espec_calidad.acidez_min == Decimal('0.50')
        assert espec_calidad.acidez_max == Decimal('2.00')
        assert espec_calidad.requiere_prueba_acidez is True

    def test_str_legible(self, espec_calidad):
        s = str(espec_calidad)
        assert 'Calidad:' in s
        assert 'Grasa de Cerdo' in s

    def test_reverse_relation_hasattr(self, producto, espec_calidad):
        """El producto accede a su espec_calidad via OneToOne reverse."""
        assert hasattr(producto, 'espec_calidad')
        assert producto.espec_calidad == espec_calidad

    def test_producto_sin_espec_no_tiene_atributo(self, producto_sin_calidad):
        """Consumo defensivo: producto sin extensión no lanza error al consultar."""
        # hasattr() retorna False para OneToOne reverse sin registro
        assert not hasattr(producto_sin_calidad, 'espec_calidad')

    def test_parametros_adicionales_default_dict(self, espec_calidad):
        assert espec_calidad.parametros_adicionales == {}


class TestRangoAcidezConstraint:
    """CheckConstraint: acidez_max >= acidez_min."""

    def test_rango_igual_permitido(self, producto):
        """Rango con min == max es válido (valor puntual)."""
        espec = ProductoEspecCalidad.objects.create(
            producto=producto,
            acidez_min=Decimal('1.00'),
            acidez_max=Decimal('1.00'),
        )
        assert espec.pk is not None

    def test_rango_invertido_rechazado_por_db(self, producto):
        """DB rechaza acidez_max < acidez_min via CheckConstraint."""
        with pytest.raises(IntegrityError):
            ProductoEspecCalidad.objects.create(
                producto=producto,
                acidez_min=Decimal('5.00'),
                acidez_max=Decimal('1.00'),
            )

    def test_rango_invertido_rechazado_por_clean(self, producto):
        """Aplicación rechaza via clean() (defense in depth)."""
        espec = ProductoEspecCalidad(
            producto=producto,
            acidez_min=Decimal('5.00'),
            acidez_max=Decimal('1.00'),
        )
        with pytest.raises(ValidationError) as exc:
            espec.clean()
        assert 'acidez_max' in exc.value.message_dict


class TestObtenerPorAcidez:
    """Classmethod obtener_por_acidez() — reemplaza método legacy."""

    def test_encuentra_cuando_valor_en_rango(self, espec_calidad):
        resultado = ProductoEspecCalidad.obtener_por_acidez(Decimal('1.00'))
        assert espec_calidad in resultado

    def test_encuentra_cuando_valor_en_limite(self, espec_calidad):
        resultado = ProductoEspecCalidad.obtener_por_acidez(Decimal('0.50'))
        assert espec_calidad in resultado
        resultado = ProductoEspecCalidad.obtener_por_acidez(Decimal('2.00'))
        assert espec_calidad in resultado

    def test_vacio_cuando_valor_fuera_de_rango(self, espec_calidad):
        resultado = ProductoEspecCalidad.obtener_por_acidez(Decimal('3.00'))
        assert espec_calidad not in resultado
        resultado = ProductoEspecCalidad.obtener_por_acidez(Decimal('0.10'))
        assert espec_calidad not in resultado

    def test_select_related_producto(self, espec_calidad):
        """El queryset pre-carga producto para evitar N+1."""
        queryset = ProductoEspecCalidad.obtener_por_acidez(Decimal('1.00'))
        # No assertion directo sobre select_related pero verificamos
        # que la query funciona y el producto está accesible
        for espec in queryset:
            assert espec.producto is not None


class TestTenantModelInheritance:
    """Verificar que la extensión hereda correctamente de TenantModel."""

    def test_soft_delete_marca_is_deleted(self, espec_calidad):
        espec_calidad.soft_delete()
        espec_calidad.refresh_from_db()
        assert espec_calidad.is_deleted is True

    def test_manager_excluye_soft_deleted(self, espec_calidad):
        espec_calidad.soft_delete()
        assert ProductoEspecCalidad.objects.filter(pk=espec_calidad.pk).count() == 0
        # all_objects incluye
        assert ProductoEspecCalidad.all_objects.filter(pk=espec_calidad.pk).count() == 1

    def test_restore_revierte_soft_delete(self, espec_calidad):
        espec_calidad.soft_delete()
        espec_calidad.refresh_from_db()
        espec_calidad.restore()
        espec_calidad.refresh_from_db()
        assert espec_calidad.is_deleted is False

    def test_timestamps_automaticos(self, espec_calidad):
        assert espec_calidad.created_at is not None
        assert espec_calidad.updated_at is not None
