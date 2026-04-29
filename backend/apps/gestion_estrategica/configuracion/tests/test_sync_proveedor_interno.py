"""
Tests para H-SC-05 — sincronización Fundación ↔ Proveedores (Ruta A).

Verifica que crear/actualizar una SedeEmpresa con
`tipo_sede.rol_operacional == 'PROVEEDOR_INTERNO'` mantiene un
Proveedor interno espejo, y que el serializer protege los campos
sincronizados.
"""
from apps.core.tests.base import BaseTenantTestCase


class TestSincronizacionSedeProveedor(BaseTenantTestCase):
    """Cobertura del signal sync_sede_to_proveedor_interno."""

    def setUp(self):
        super().setUp()
        # Modelos resueltos perezosamente para respetar el schema del tenant.
        from apps.gestion_estrategica.configuracion.models import (
            ConfiguracionEmpresa,
            TipoSede,
        )
        from apps.core.models import TipoDocumentoIdentidad

        self.TipoSede = TipoSede
        self.ConfiguracionEmpresa = ConfiguracionEmpresa
        self.TipoDocumentoIdentidad = TipoDocumentoIdentidad

        # Asegura un TipoDocumentoIdentidad NIT y una empresa configurada
        # para que el signal pueda construir números de documento estables.
        TipoDocumentoIdentidad.objects.get_or_create(
            codigo='NIT',
            defaults={'nombre': 'NIT', 'orden': 1, 'is_active': True},
        )
        ConfiguracionEmpresa.objects.get_or_create(
            defaults={
                'nit': '900123456-7',
                'razon_social': 'Empresa Test',
            },
        )

    def _crear_tipo_sede(self, code, rol):
        return self.TipoSede.objects.create(
            code=code,
            name=code.replace('_', ' ').title(),
            rol_operacional=rol,
        )

    def _crear_sede(self, nombre, tipo_sede, **extra):
        from apps.gestion_estrategica.configuracion.models import SedeEmpresa

        defaults = {
            'nombre': nombre,
            'tipo_sede': tipo_sede,
            'direccion': 'Calle Falsa 123',
        }
        defaults.update(extra)
        return SedeEmpresa.objects.create(**defaults)

    # ------------------------------------------------------------------
    # 1. Sede con rol PROVEEDOR_INTERNO crea Proveedor.
    # ------------------------------------------------------------------
    def test_sede_con_tipo_proveedor_interno_crea_proveedor(self):
        from apps.infraestructura.catalogo_productos.proveedores.models import Proveedor

        tipo = self._crear_tipo_sede(
            f'tipo_int_{self._next_id()}',
            'PROVEEDOR_INTERNO',
        )
        sede = self._crear_sede('Planta Norte', tipo)

        proveedores = Proveedor.objects.filter(sede_empresa_origen=sede)
        self.assertEqual(proveedores.count(), 1)
        proveedor = proveedores.first()
        self.assertEqual(proveedor.razon_social, 'Planta Norte')
        self.assertEqual(proveedor.nombre_comercial, 'Planta Norte')
        self.assertEqual(proveedor.direccion, 'Calle Falsa 123')

    # ------------------------------------------------------------------
    # 2. Update no duplica el proveedor.
    # ------------------------------------------------------------------
    def test_sede_actualiza_no_duplica_proveedor(self):
        from apps.infraestructura.catalogo_productos.proveedores.models import Proveedor

        tipo = self._crear_tipo_sede(
            f'tipo_int_{self._next_id()}',
            'PROVEEDOR_INTERNO',
        )
        sede = self._crear_sede('Planta Sur', tipo)

        sede.nombre = 'Planta Sur Renombrada'
        sede.save()

        proveedores = Proveedor.objects.filter(sede_empresa_origen=sede)
        self.assertEqual(proveedores.count(), 1)
        self.assertEqual(
            proveedores.first().razon_social, 'Planta Sur Renombrada'
        )

    # ------------------------------------------------------------------
    # 3. Sede con rol OFICINA NO crea proveedor.
    # ------------------------------------------------------------------
    def test_sede_tipo_oficina_no_crea_proveedor(self):
        from apps.infraestructura.catalogo_productos.proveedores.models import Proveedor

        tipo = self._crear_tipo_sede(
            f'tipo_ofc_{self._next_id()}',
            'OFICINA',
        )
        sede = self._crear_sede('Oficina Central', tipo)

        self.assertFalse(
            Proveedor.objects.filter(sede_empresa_origen=sede).exists()
        )

    # ------------------------------------------------------------------
    # 4. Serializer protege razón social / nombre comercial / dirección.
    # ------------------------------------------------------------------
    def test_serializer_protege_campos_sincronizados(self):
        from apps.infraestructura.catalogo_productos.proveedores.models import Proveedor
        from apps.infraestructura.catalogo_productos.proveedores.serializers import (
            ProveedorCreateUpdateSerializer,
        )

        tipo = self._crear_tipo_sede(
            f'tipo_int_{self._next_id()}',
            'PROVEEDOR_INTERNO',
        )
        sede = self._crear_sede('Planta Este', tipo)

        proveedor = Proveedor.objects.get(sede_empresa_origen=sede)
        serializer = ProveedorCreateUpdateSerializer(
            instance=proveedor,
            data={'razon_social': 'Editada Manualmente'},
            partial=True,
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn('razon_social', serializer.errors)
