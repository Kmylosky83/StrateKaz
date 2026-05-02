"""
Tests para H-SC-TALONARIO — registro manual post-hoc desde planta.

Cobertura:
  - Modelo: validador funciona en ambos casos (EN_RUTA / TRANSCRIPCION_PLANTA).
  - Endpoint transcribir-talonario: happy path crea N vouchers.
  - Endpoint transcribir-talonario: rollback si una parada falla.
  - Endpoint transcribir-talonario: rechaza proveedor que no es parada de la ruta.
  - Validación al aprobar: error si M2M vacío en modalidad RECOLECCION.
"""
from datetime import date
from decimal import Decimal

from django.core.exceptions import ValidationError

from apps.core.tests.base import BaseTenantTestCase
from apps.core.models import TipoDocumentoIdentidad
from apps.supply_chain.catalogos.models import RutaParada, RutaRecoleccion
from apps.supply_chain.recoleccion.models import VoucherRecoleccion


def _crear_proveedor(numero, nombre='Productor Test'):
    tipo_doc, _ = TipoDocumentoIdentidad.objects.get_or_create(
        codigo='CC',
        defaults={'nombre': 'Cédula de Ciudadanía', 'orden': 1, 'is_active': True},
    )
    from apps.infraestructura.catalogo_productos.proveedores.models import Proveedor
    return Proveedor.objects.create(
        razon_social=nombre,
        nombre_comercial=nombre,
        tipo_persona=Proveedor.TipoPersona.NATURAL,
        tipo_documento=tipo_doc,
        numero_documento=numero,
    )


def _crear_producto(codigo='LECHE', nombre='Leche cruda'):
    from apps.infraestructura.catalogo_productos.models import Producto
    return Producto.objects.create(codigo=codigo, nombre=nombre, tipo='MATERIA_PRIMA')


def _crear_almacen(nombre='Almacén MP'):
    from apps.supply_chain.catalogos.models import Almacen, TipoAlmacen
    tipo, _ = TipoAlmacen.objects.get_or_create(
        codigo='MP', defaults={'nombre': 'Materia Prima'},
    )
    return Almacen.objects.create(codigo=nombre[:10], nombre=nombre, tipo=tipo)


# ══════════════════════════════════════════════════════════════════════
# Modelo — Validación condicional por origen
# ══════════════════════════════════════════════════════════════════════


class TestVoucherRecoleccionValidacionOrigen(BaseTenantTestCase):
    def test_origen_en_ruta_requiere_operador(self):
        ruta = RutaRecoleccion.objects.create(nombre='Norte')
        prov = _crear_proveedor('111111')
        prod = _crear_producto()
        v = VoucherRecoleccion(
            ruta=ruta,
            fecha_recoleccion=date.today(),
            proveedor=prov,
            producto=prod,
            cantidad=Decimal('100'),
            operador=None,
            origen_registro=VoucherRecoleccion.OrigenRegistro.EN_RUTA,
        )
        with self.assertRaises(ValidationError) as ctx:
            v.full_clean()
        self.assertIn('operador', ctx.exception.message_dict)

    def test_origen_transcripcion_planta_requiere_registrado_por(self):
        user_planta = self.create_user('planta1')
        ruta = RutaRecoleccion.objects.create(nombre='Sur')
        prov = _crear_proveedor('222222')
        prod = _crear_producto(codigo='LECHE2')

        # Sin registrado_por_planta → debe fallar
        v = VoucherRecoleccion(
            ruta=ruta,
            fecha_recoleccion=date.today(),
            proveedor=prov,
            producto=prod,
            cantidad=Decimal('50'),
            operador=None,
            origen_registro=(
                VoucherRecoleccion.OrigenRegistro.TRANSCRIPCION_PLANTA
            ),
        )
        with self.assertRaises(ValidationError) as ctx:
            v.full_clean()
        self.assertIn('registrado_por_planta', ctx.exception.message_dict)

        # Con registrado_por_planta y SIN operador → válido
        v.registrado_por_planta = user_planta
        v.full_clean()  # no raise
        v.save()
        self.assertIsNone(v.operador)
        self.assertEqual(v.registrado_por_planta, user_planta)

    def test_origen_default_es_en_ruta(self):
        user = self.create_user('op1')
        ruta = RutaRecoleccion.objects.create(nombre='Centro')
        prov = _crear_proveedor('333333')
        prod = _crear_producto(codigo='LECHE3')
        v = VoucherRecoleccion.objects.create(
            ruta=ruta,
            fecha_recoleccion=date.today(),
            proveedor=prov,
            producto=prod,
            cantidad=Decimal('1'),
            operador=user,
        )
        self.assertEqual(
            v.origen_registro, VoucherRecoleccion.OrigenRegistro.EN_RUTA
        )


# ══════════════════════════════════════════════════════════════════════
# Endpoint /transcribir-talonario/ (happy / sad paths)
# ══════════════════════════════════════════════════════════════════════


class TestTranscribirTalonarioEndpoint(BaseTenantTestCase):
    def _setup_ruta_con_paradas(self, n=3):
        ruta = RutaRecoleccion.objects.create(nombre='Ruta Talonario')
        proveedores = []
        for i in range(n):
            p = _crear_proveedor(f'10000{i}', f'Productor {i}')
            RutaParada.objects.create(
                ruta=ruta, proveedor=p, orden=i, is_active=True,
            )
            proveedores.append(p)
        return ruta, proveedores

    def test_happy_path_crea_n_vouchers(self):
        user = self.create_user('planta_user')
        headers = self.authenticate_as(user)
        ruta, proveedores = self._setup_ruta_con_paradas(3)
        prod = _crear_producto(codigo='HAPPY')

        payload = {
            'ruta_id': ruta.id,
            'fecha_recoleccion': date.today().isoformat(),
            'paradas': [
                {
                    'proveedor_id': proveedores[i].id,
                    'producto_id': prod.id,
                    'cantidad_kg': str(10 + i),
                    'numero_talonario': f'TAL-{i:03d}',
                    'notas': f'Parada {i}',
                }
                for i in range(3)
            ],
        }

        url = '/api/supply-chain/recoleccion/vouchers/transcribir-talonario/'
        response = self.client.post(
            url,
            data=payload,
            content_type='application/json',
            **headers,
        )
        self.assertEqual(response.status_code, 201, response.content)
        body = response.json()
        self.assertEqual(body['total'], 3)
        self.assertEqual(len(body['creados']), 3)

        # Verificar que quedaron persistidos correctamente
        creados = VoucherRecoleccion.objects.filter(ruta=ruta)
        self.assertEqual(creados.count(), 3)
        for v in creados:
            self.assertEqual(
                v.origen_registro,
                VoucherRecoleccion.OrigenRegistro.TRANSCRIPCION_PLANTA,
            )
            self.assertEqual(v.estado, VoucherRecoleccion.Estado.COMPLETADO)
            self.assertEqual(v.registrado_por_planta_id, user.id)
            self.assertIsNone(v.operador_id)
            self.assertTrue(v.numero_talonario.startswith('TAL-'))

    def test_rollback_si_alguna_parada_es_invalida(self):
        user = self.create_user('planta_user2')
        headers = self.authenticate_as(user)
        ruta, proveedores = self._setup_ruta_con_paradas(2)
        prod = _crear_producto(codigo='ROLL')

        # Una parada con cantidad inválida (0) → debe fallar TODO
        payload = {
            'ruta_id': ruta.id,
            'fecha_recoleccion': date.today().isoformat(),
            'paradas': [
                {
                    'proveedor_id': proveedores[0].id,
                    'producto_id': prod.id,
                    'cantidad_kg': '20',
                },
                {
                    'proveedor_id': proveedores[1].id,
                    'producto_id': prod.id,
                    'cantidad_kg': '0',  # ← inválido
                },
            ],
        }
        url = '/api/supply-chain/recoleccion/vouchers/transcribir-talonario/'
        response = self.client.post(
            url, data=payload, content_type='application/json', **headers,
        )
        self.assertEqual(response.status_code, 400)

        # Nada debe haberse creado
        self.assertFalse(
            VoucherRecoleccion.objects.filter(ruta=ruta).exists()
        )

    def test_rechaza_proveedor_que_no_es_parada_de_la_ruta(self):
        user = self.create_user('planta_user3')
        headers = self.authenticate_as(user)
        ruta, proveedores = self._setup_ruta_con_paradas(2)
        prod = _crear_producto(codigo='STRANGER')
        # Proveedor que NO es parada de esta ruta
        intruso = _crear_proveedor('999999', 'Productor Externo')

        payload = {
            'ruta_id': ruta.id,
            'fecha_recoleccion': date.today().isoformat(),
            'paradas': [
                {
                    'proveedor_id': intruso.id,
                    'producto_id': prod.id,
                    'cantidad_kg': '15',
                },
            ],
        }
        url = '/api/supply-chain/recoleccion/vouchers/transcribir-talonario/'
        response = self.client.post(
            url, data=payload, content_type='application/json', **headers,
        )
        self.assertEqual(response.status_code, 400)
        body = response.json()
        # El error debe mencionar 'paradas' o el id del proveedor intruso
        self.assertTrue(
            'paradas' in body or any(str(intruso.id) in str(v) for v in body.values())
        )
        self.assertFalse(
            VoucherRecoleccion.objects.filter(proveedor=intruso).exists()
        )

    def test_rechaza_producto_inexistente(self):
        user = self.create_user('planta_user4')
        headers = self.authenticate_as(user)
        ruta, proveedores = self._setup_ruta_con_paradas(1)

        payload = {
            'ruta_id': ruta.id,
            'fecha_recoleccion': date.today().isoformat(),
            'paradas': [
                {
                    'proveedor_id': proveedores[0].id,
                    'producto_id': 99999,  # no existe
                    'cantidad_kg': '10',
                },
            ],
        }
        url = '/api/supply-chain/recoleccion/vouchers/transcribir-talonario/'
        response = self.client.post(
            url, data=payload, content_type='application/json', **headers,
        )
        self.assertEqual(response.status_code, 400)


# ══════════════════════════════════════════════════════════════════════
# Validación al aprobar VoucherRecepcion modalidad=RECOLECCION
# ══════════════════════════════════════════════════════════════════════


class TestAprobarRecepcionRecoleccionRequiereVouchers(BaseTenantTestCase):
    def _crear_recepcion_recoleccion(self, ruta, almacen, user):
        from apps.supply_chain.recepcion.models import (
            VoucherLineaMP,
            VoucherRecepcion,
        )

        voucher = VoucherRecepcion.objects.create(
            modalidad_entrega=VoucherRecepcion.ModalidadEntrega.RECOLECCION,
            ruta_recoleccion=ruta,
            almacen_destino=almacen,
            operador_bascula=user,
            fecha_viaje=date.today(),
            estado=VoucherRecepcion.EstadoVoucher.PENDIENTE_QC,
            created_by=user,
            updated_by=user,
        )
        # Una línea para que aprobar() no falle por "no tiene líneas".
        prod = _crear_producto(codigo='RECEP_LIN')
        VoucherLineaMP.objects.create(
            voucher=voucher,
            producto=prod,
            peso_bruto_kg=Decimal('100'),
            peso_tara_kg=Decimal('0'),
            peso_neto_kg=Decimal('100'),
            created_by=user,
            updated_by=user,
        )
        return voucher

    def test_aprobar_falla_si_modalidad_recoleccion_sin_vouchers_asociados(self):
        user = self.create_user('basc1')
        headers = self.authenticate_as(user)
        ruta = RutaRecoleccion.objects.create(nombre='Ruta R1')
        almacen = _crear_almacen('Almacen R1')
        recepcion = self._crear_recepcion_recoleccion(ruta, almacen, user)

        url = (
            f'/api/supply-chain/recepcion/vouchers/{recepcion.id}/aprobar/'
        )
        response = self.client.post(url, **headers)
        self.assertEqual(response.status_code, 400, response.content)
        body = response.json()
        # Mensaje debe mencionar "vouchers de recolección" o "talonario"
        msg = str(body.get('detail', '')).lower()
        self.assertTrue('recolecci' in msg or 'talonario' in msg, body)

    def test_aprobar_funciona_si_recoleccion_tiene_vouchers_asociados(self):
        user = self.create_user('basc2')
        headers = self.authenticate_as(user)
        ruta = RutaRecoleccion.objects.create(nombre='Ruta R2')
        almacen = _crear_almacen('Almacen R2')
        prov = _crear_proveedor('555555')
        RutaParada.objects.create(
            ruta=ruta, proveedor=prov, orden=0, is_active=True,
        )
        prod = _crear_producto(codigo='OK')
        # Crear voucher de recolección y asociarlo
        vrc = VoucherRecoleccion.objects.create(
            ruta=ruta,
            fecha_recoleccion=date.today(),
            proveedor=prov,
            producto=prod,
            cantidad=Decimal('80'),
            operador=user,
            estado=VoucherRecoleccion.Estado.COMPLETADO,
        )
        recepcion = self._crear_recepcion_recoleccion(ruta, almacen, user)
        recepcion.vouchers_recoleccion.add(vrc)

        url = (
            f'/api/supply-chain/recepcion/vouchers/{recepcion.id}/aprobar/'
        )
        response = self.client.post(url, **headers)
        self.assertEqual(response.status_code, 200, response.content)
        recepcion.refresh_from_db()
        from apps.supply_chain.recepcion.models import VoucherRecepcion
        self.assertEqual(
            recepcion.estado, VoucherRecepcion.EstadoVoucher.APROBADO,
        )
