"""
Tests de Sesión 2 — migración a TenantModel + tipo_entidad + coexistencia.

Cubre:
  - Herencia TenantModel funcional (soft_delete, timestamps, audit fields)
  - tipo_entidad TextChoices (R fase 2)
  - Cascada a usuarios_vinculados en delete() (R7)
  - HistorialPrecioProveedor append-only + preservación de modificado_por (R1)
  - PrecioMateriaPrima coexistencia FK Producto + FK TipoMateriaPrima (D3)
  - UniqueConstraint condicional Q(is_deleted=False)
  - CondicionComercialProveedor bitemporal
"""
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError

from apps.supply_chain.gestion_proveedores.models import (
    CondicionComercialProveedor,
    HistorialPrecioProveedor,
    PrecioMateriaPrima,
    Proveedor,
)

# Cargar fixtures de conftest_sesion2
pytest_plugins = ['apps.supply_chain.gestion_proveedores.tests.conftest_sesion2']


pytestmark = pytest.mark.django_db

User = get_user_model()


# ==============================================================================
# CLASE: Herencia TenantModel — campos, manager, métodos heredados
# ==============================================================================

class TestProveedorTenantModel:
    """Verificar que Proveedor hereda correctamente de TenantModel."""

    def test_campos_tenant_model_presentes(self, proveedor):
        assert hasattr(proveedor, 'created_at')
        assert hasattr(proveedor, 'updated_at')
        assert hasattr(proveedor, 'is_deleted')
        assert hasattr(proveedor, 'deleted_at')
        assert hasattr(proveedor, 'deleted_by')
        assert hasattr(proveedor, 'created_by')
        assert hasattr(proveedor, 'updated_by')
        assert proveedor.is_deleted is False
        assert proveedor.deleted_at is None

    def test_is_active_preservado_como_campo_negocio(self, proveedor):
        """is_active es campo de NEGOCIO, independiente de is_deleted."""
        assert proveedor.is_active is True
        assert proveedor.is_deleted is False
        # Pueden divergir: proveedor activo pero lógicamente borrado NO ocurre,
        # pero proveedor inactivo comercialmente sí:
        proveedor.is_active = False
        proveedor.save()
        assert proveedor.is_deleted is False  # sigue vivo

    def test_manager_default_excluye_soft_deleted(self, proveedor):
        proveedor.delete()  # soft-delete vía TenantModel
        assert Proveedor.objects.filter(pk=proveedor.pk).count() == 0
        assert Proveedor.all_objects.filter(pk=proveedor.pk).count() == 1


# ==============================================================================
# CLASE: tipo_entidad TextChoices (D2, Fase 2)
# ==============================================================================

class TestTipoEntidad:
    """Campo tipo_entidad como capa semántica de negocio."""

    def test_default_materia_prima(self, proveedor):
        assert proveedor.tipo_entidad == Proveedor.TipoEntidad.MATERIA_PRIMA

    def test_crear_con_servicio(self, tipo_proveedor_servicio, tipo_documento_nit):
        prov = Proveedor.objects.create(
            tipo_proveedor=tipo_proveedor_servicio,
            tipo_entidad=Proveedor.TipoEntidad.SERVICIO,
            nombre_comercial='Servicio Test',
            razon_social='Servicio Test',
            tipo_documento=tipo_documento_nit,
            numero_documento='900000002',
        )
        assert prov.tipo_entidad == 'servicio'

    def test_crear_con_unidad_interna(self, tipo_proveedor_servicio, tipo_documento_nit):
        prov = Proveedor.objects.create(
            tipo_proveedor=tipo_proveedor_servicio,
            tipo_entidad=Proveedor.TipoEntidad.UNIDAD_INTERNA,
            nombre_comercial='Unidad Interna Test',
            razon_social='Unidad Interna Test',
            tipo_documento=tipo_documento_nit,
            numero_documento='900000003',
        )
        assert prov.tipo_entidad == 'unidad_interna'

    def test_tipo_entidad_y_tipo_proveedor_coexisten(self, proveedor):
        """Ambas dimensiones conviven sin conflicto."""
        assert proveedor.tipo_entidad == Proveedor.TipoEntidad.MATERIA_PRIMA
        assert proveedor.tipo_proveedor.codigo == 'MATERIA_PRIMA'
        # son campos independientes — pueden cambiarse por separado
        proveedor.tipo_entidad = Proveedor.TipoEntidad.SERVICIO
        proveedor.save()
        proveedor.refresh_from_db()
        assert proveedor.tipo_entidad == 'servicio'
        assert proveedor.tipo_proveedor.codigo == 'MATERIA_PRIMA'  # FK no cambió


# ==============================================================================
# CLASE: Cascada delete() a usuarios_vinculados (R7 — regresión crítica)
# ==============================================================================

class TestProveedorDeleteCascadaUsuarios:
    """Regresión R7: delete() debe desactivar usuarios vinculados."""

    def test_delete_desactiva_usuarios_vinculados(self, proveedor):
        """Al borrar proveedor, sus usuarios se desactivan."""
        # Crear un usuario vinculado al proveedor via proveedor_id_ext
        user = User.objects.create_user(
            username='user_proveedor@test.com',
            email='user_proveedor@test.com',
            password='testpass123',
            is_active=True,
            proveedor_id_ext=proveedor.pk,
        )
        assert user.is_active is True

        # Soft-delete el proveedor
        proveedor.delete()

        # El usuario vinculado debe quedar inactivo
        user.refresh_from_db()
        assert user.is_active is False

    def test_delete_marca_proveedor_como_inactivo(self, proveedor):
        """is_active=False se aplica en el override de delete()."""
        assert proveedor.is_active is True
        proveedor.delete()
        # Recuperar vía all_objects (manager default excluye)
        prov_deleted = Proveedor.all_objects.get(pk=proveedor.pk)
        assert prov_deleted.is_active is False
        assert prov_deleted.is_deleted is True


# ==============================================================================
# CLASE: UniqueConstraint condicional con Q(is_deleted=False)
# ==============================================================================

class TestUniqueConstraintCondicional:
    """UniqueConstraint condicional permite re-crear tras soft-delete."""

    def test_no_puede_crear_duplicado_activo(self, proveedor, tipo_proveedor_mp, tipo_documento_nit):
        """No se permite crear dos proveedores activos con el mismo numero_documento."""
        with pytest.raises(IntegrityError):
            Proveedor.objects.create(
                tipo_proveedor=tipo_proveedor_mp,
                nombre_comercial='Duplicado',
                razon_social='Duplicado',
                tipo_documento=tipo_documento_nit,
                numero_documento=proveedor.numero_documento,
            )

    def test_puede_recrear_tras_soft_delete(self, proveedor, tipo_proveedor_mp, tipo_documento_nit):
        """Post soft-delete, el numero_documento se libera."""
        doc = proveedor.numero_documento
        proveedor.delete()  # soft-delete
        # Ahora debería permitir crear otro con el mismo numero_documento
        prov_nuevo = Proveedor.objects.create(
            tipo_proveedor=tipo_proveedor_mp,
            nombre_comercial='Nuevo',
            razon_social='Nuevo',
            tipo_documento=tipo_documento_nit,
            numero_documento=doc,
        )
        assert prov_nuevo.pk != proveedor.pk
        assert prov_nuevo.numero_documento == doc


# ==============================================================================
# CLASE: PrecioMateriaPrima — coexistencia FK producto + FK tipo_materia (D3)
# ==============================================================================

class TestPrecioMateriaPrimaCoexistencia:
    """Coexistencia de FK Producto (nuevo) y FK TipoMateriaPrima (legado)."""

    def test_solo_tipo_materia_legacy(self, proveedor, tipo_materia_sebo):
        precio = PrecioMateriaPrima.objects.create(
            proveedor=proveedor,
            tipo_materia=tipo_materia_sebo,
            precio_kg=Decimal('2500.00'),
        )
        assert precio.tipo_materia == tipo_materia_sebo
        assert precio.producto is None

    def test_solo_producto_catalogo(self, proveedor, producto_catalogo):
        precio = PrecioMateriaPrima.objects.create(
            proveedor=proveedor,
            producto=producto_catalogo,
            precio_kg=Decimal('2500.00'),
        )
        assert precio.producto == producto_catalogo
        assert precio.tipo_materia is None

    def test_ambas_fks(self, proveedor, tipo_materia_sebo, producto_catalogo):
        precio = PrecioMateriaPrima.objects.create(
            proveedor=proveedor,
            tipo_materia=tipo_materia_sebo,
            producto=producto_catalogo,
            precio_kg=Decimal('2500.00'),
        )
        assert precio.tipo_materia == tipo_materia_sebo
        assert precio.producto == producto_catalogo

    def test_rechaza_sin_ninguna_fk(self, proveedor):
        """clean() rechaza crear sin tipo_materia NI producto."""
        from django.core.exceptions import ValidationError
        precio = PrecioMateriaPrima(
            proveedor=proveedor,
            precio_kg=Decimal('100.00'),
        )
        with pytest.raises(ValidationError):
            precio.clean()

    def test_rechaza_precio_negativo(self, proveedor, tipo_materia_sebo):
        from django.core.exceptions import ValidationError
        precio = PrecioMateriaPrima(
            proveedor=proveedor,
            tipo_materia=tipo_materia_sebo,
            precio_kg=Decimal('-10.00'),
        )
        with pytest.raises(ValidationError):
            precio.clean()


# ==============================================================================
# CLASE: HistorialPrecioProveedor append-only (R1 — preservar modificado_por)
# ==============================================================================

class TestHistorialPrecioAppendOnly:
    """Append-only: no se permite modificar ni eliminar registros históricos."""

    @pytest.fixture
    def usuario(self, db):
        return User.objects.create_user(
            username='historial_user@test.com',
            email='historial_user@test.com',
            password='testpass123',
        )

    def test_create_ok(self, proveedor, tipo_materia_sebo, usuario):
        hist = HistorialPrecioProveedor.objects.create(
            proveedor=proveedor,
            tipo_materia=tipo_materia_sebo,
            precio_anterior=Decimal('2000.00'),
            precio_nuevo=Decimal('2500.00'),
            modificado_por=usuario,
            motivo='Ajuste por inflación',
        )
        assert hist.pk is not None
        assert hist.modificado_por == usuario  # R1: preservado

    def test_no_puede_modificar_existente(self, proveedor, tipo_materia_sebo, usuario):
        hist = HistorialPrecioProveedor.objects.create(
            proveedor=proveedor,
            tipo_materia=tipo_materia_sebo,
            precio_nuevo=Decimal('2500.00'),
            modificado_por=usuario,
            motivo='Inicial',
        )
        hist.motivo = 'Intento de modificar'
        with pytest.raises(PermissionError):
            hist.save()

    def test_no_puede_eliminar(self, proveedor, tipo_materia_sebo, usuario):
        hist = HistorialPrecioProveedor.objects.create(
            proveedor=proveedor,
            tipo_materia=tipo_materia_sebo,
            precio_nuevo=Decimal('2500.00'),
            modificado_por=usuario,
            motivo='Inicial',
        )
        with pytest.raises(PermissionError):
            hist.delete()

    def test_modificado_por_preservado_campo_negocio(self, proveedor, tipo_materia_sebo, usuario):
        """R1: modificado_por es campo de negocio, NO de AuditModel."""
        hist = HistorialPrecioProveedor.objects.create(
            proveedor=proveedor,
            tipo_materia=tipo_materia_sebo,
            precio_nuevo=Decimal('100.00'),
            modificado_por=usuario,
            motivo='Test',
        )
        # El modelo NO hereda AuditModel (sin created_by/updated_by). Sólo
        # tiene created_at/updated_at de TimeStampedModel.
        assert hasattr(hist, 'created_at')
        assert hasattr(hist, 'updated_at')
        assert not hasattr(hist, 'created_by')
        assert not hasattr(hist, 'updated_by')
        # Pero SÍ tiene modificado_por (campo de negocio preservado)
        assert hist.modificado_por == usuario

    def test_variacion_precio_property(self, proveedor, tipo_materia_sebo, usuario):
        hist = HistorialPrecioProveedor.objects.create(
            proveedor=proveedor,
            tipo_materia=tipo_materia_sebo,
            precio_anterior=Decimal('2000.00'),
            precio_nuevo=Decimal('2500.00'),
            modificado_por=usuario,
            motivo='Ajuste',
        )
        assert hist.variacion_precio == Decimal('25.00')

    def test_tipo_cambio_aumento(self, proveedor, tipo_materia_sebo, usuario):
        hist = HistorialPrecioProveedor.objects.create(
            proveedor=proveedor,
            tipo_materia=tipo_materia_sebo,
            precio_anterior=Decimal('2000.00'),
            precio_nuevo=Decimal('2500.00'),
            modificado_por=usuario,
            motivo='Ajuste',
        )
        assert hist.tipo_cambio == 'AUMENTO'


# ==============================================================================
# CLASE: CondicionComercialProveedor — bitemporal + CheckConstraint
# ==============================================================================

class TestCondicionComercialBitemporal:
    """Bitemporal: vigencia_desde + vigencia_hasta nullable."""

    def test_create_con_vigencia_abierta(self, proveedor):
        from datetime import date
        cc = CondicionComercialProveedor.objects.create(
            proveedor=proveedor,
            descripcion='Descuento por volumen',
            valor_acordado='5% sobre lista base',
            vigencia_desde=date.today(),
            # vigencia_hasta=None → indefinida
        )
        assert cc.vigencia_hasta is None
        assert cc.esta_vigente is True

    def test_create_con_vigencia_cerrada(self, proveedor):
        from datetime import date, timedelta
        cc = CondicionComercialProveedor.objects.create(
            proveedor=proveedor,
            descripcion='Descuento temporal',
            valor_acordado='10% junio-julio',
            vigencia_desde=date.today(),
            vigencia_hasta=date.today() + timedelta(days=30),
        )
        assert cc.vigencia_hasta is not None
        assert cc.esta_vigente is True

    def test_rango_invertido_rechazado(self, proveedor):
        """CheckConstraint rechaza vigencia_hasta < vigencia_desde."""
        from datetime import date, timedelta
        with pytest.raises(IntegrityError):
            CondicionComercialProveedor.objects.create(
                proveedor=proveedor,
                descripcion='Inválido',
                valor_acordado='test',
                vigencia_desde=date.today(),
                vigencia_hasta=date.today() - timedelta(days=30),  # invertido
            )
