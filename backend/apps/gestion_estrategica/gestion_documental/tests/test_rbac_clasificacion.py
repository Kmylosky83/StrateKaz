"""
Tests RBAC para Gestión Documental — H-GD-C3 + H-GD-M4.

H-GD-C3: enforcement de `verificar_acceso_documento` en endpoints sensibles.
  - Acciones que sirven datos del archivo o invocan lógica del documento
    deben devolver 403 a usuarios sin acceso a docs CONFIDENCIAL/RESTRINGIDO.

H-GD-M4: distribución de lectura obligatoria respeta `cargos_distribucion`.
  - Al publicar con `lectura_obligatoria=True` y `cargos_distribucion`
    poblado, solo usuarios con esos cargos reciben AceptacionDocumental.
  - El signal post_save de User aplica la misma regla a usuarios nuevos.

Patrón: BaseTenantTestCase (django-tenants schema real, JWT real).
"""

from rest_framework import status

from apps.core.tests.base import BaseTenantTestCase


# =============================================================================
# Helpers — fixtures locales reutilizables
# =============================================================================

DOCUMENTOS_URL = (
    '/api/gestion-estrategica/gestion-documental/documentos/'
)
ACEPTACIONES_MIS_PENDIENTES = (
    '/api/gestion-estrategica/gestion-documental/aceptaciones/mis-pendientes/'
)


class _GestionDocumentalRBACMixin:
    """Helpers comunes a las dos baterías de tests."""

    def _crear_tipo_documento(self, user):
        from apps.gestion_estrategica.gestion_documental.models import TipoDocumento

        return TipoDocumento.objects.create(
            codigo=f'TX{self._next_id()[:4]}',
            nombre='Procedimiento Test',
            prefijo_codigo='PR-',
            requiere_firma=False,  # evita exigencia de firmas APROBÓ en tests
            requiere_aprobacion=False,
            created_by=user,
        )

    def _crear_documento(
        self,
        autor,
        clasificacion='INTERNO',
        estado='PUBLICADO',
        codigo=None,
        cargos_distribucion=None,
        usuarios_autorizados=None,
        lectura_obligatoria=False,
        aplica_a_todos=False,
    ):
        from apps.gestion_estrategica.gestion_documental.models import Documento

        tipo = self._crear_tipo_documento(autor)
        doc = Documento.objects.create(
            codigo=codigo or f'PR-{self._next_id()[:6]}',
            titulo='Documento RBAC Test',
            tipo_documento=tipo,
            contenido='<p>Contenido</p>',
            estado=estado,
            clasificacion=clasificacion,
            elaborado_por=autor,
            lectura_obligatoria=lectura_obligatoria,
            aplica_a_todos=aplica_a_todos,
        )
        if cargos_distribucion:
            doc.cargos_distribucion.set(cargos_distribucion)
        if usuarios_autorizados:
            doc.usuarios_autorizados.set(usuarios_autorizados)
        return doc

    def _grant_repositorio(self, cargo):
        """Otorga acceso RBAC a la sección repositorio (módulo gestion_documental)."""
        _, _, section = self.create_module_with_section(
            module_code='gestion_documental',
            section_code='repositorio',
        )
        return self.grant_section_access(
            cargo,
            section,
            can_view=True,
            can_create=True,
            can_edit=True,
            can_delete=True,
        )


# =============================================================================
# H-GD-C3 — Enforcement por endpoint
# =============================================================================

class HGDC3VerificarAccesoDocumentoTests(
    _GestionDocumentalRBACMixin, BaseTenantTestCase
):
    """
    Cada endpoint sensible debe responder 403 cuando un usuario sin acceso
    al documento CONFIDENCIAL/RESTRINGIDO lo intenta operar.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Desconectar signal de auto-asignación para no contaminar setUp.
        from django.db.models.signals import post_save
        from django.contrib.auth import get_user_model
        from apps.gestion_estrategica.gestion_documental.signal_handlers import (
            auto_asignar_lecturas_obligatorias,
        )

        cls._User = get_user_model()
        post_save.disconnect(
            auto_asignar_lecturas_obligatorias,
            sender=cls._User,
        )

    @classmethod
    def tearDownClass(cls):
        from django.db.models.signals import post_save
        from apps.gestion_estrategica.gestion_documental.signal_handlers import (
            auto_asignar_lecturas_obligatorias,
        )

        post_save.connect(
            auto_asignar_lecturas_obligatorias,
            sender=cls._User,
        )
        super().tearDownClass()

    def setUp(self):
        super().setUp()

        # Admin (superuser) — bypassa RBAC y verificar_acceso_documento.
        self.admin = self.create_user(
            username=f'admin_{self._next_id()[:5]}',
            is_superuser=True,
            is_staff=True,
        )

        # Cargo "Operativo" sin acceso a docs confidenciales.
        self.cargo_operativo = self.create_cargo(name='Operativo Sin Acceso')
        self.user_sin_acceso = self.create_user(
            username=f'sinacc_{self._next_id()[:5]}',
            cargo=self.cargo_operativo,
        )
        self._grant_repositorio(self.cargo_operativo)

        # Cargo "Gerencial" autorizado vía cargos_distribucion.
        self.cargo_gerencial = self.create_cargo(name='Gerencial Con Acceso')
        self.user_con_cargo = self.create_user(
            username=f'concar_{self._next_id()[:5]}',
            cargo=self.cargo_gerencial,
        )
        self._grant_repositorio(self.cargo_gerencial)

        # Documento CONFIDENCIAL distribuido al cargo gerencial.
        self.doc_confidencial = self._crear_documento(
            autor=self.admin,
            clasificacion='CONFIDENCIAL',
            estado='PUBLICADO',
            cargos_distribucion=[self.cargo_gerencial],
        )

    # -------------------------------------------------------------------------
    # Endpoints cubiertos por H-GD-C3
    # -------------------------------------------------------------------------

    ENDPOINTS_GET = [
        ('firmas',          'firmas'),
        ('estado-firmas',   'estado-firmas'),
        ('verificar-sellado', 'verificar-sellado'),
    ]

    ENDPOINTS_POST = [
        'subir-anexo',
        'incrementar-descarga',
        'incrementar-impresion',
        'reprocesar-ocr',
        'sellar-pdf',
        'exportar-drive',
    ]

    def _url(self, accion):
        return f'{DOCUMENTOS_URL}{self.doc_confidencial.id}/{accion}/'

    # ---- ADMIN (superuser): siempre 200 (o status válido, no 403) -----------

    def test_admin_accede_subir_anexo(self):
        """Admin (superuser) puede subir anexo a doc confidencial."""
        from django.core.files.uploadedfile import SimpleUploadedFile

        headers = self.authenticate_as(self.admin)
        archivo = SimpleUploadedFile(
            'evidencia.pdf', b'%PDF-1.4 fake', content_type='application/pdf'
        )
        response = self.client.post(
            self._url('subir-anexo'),
            data={'archivo': archivo, 'descripcion': 'evidencia'},
            **headers,
        )
        self.assertNotEqual(
            response.status_code, status.HTTP_403_FORBIDDEN,
            f'Admin no debería ser 403 — got {response.status_code}: {response.content!r}',
        )

    def test_admin_accede_incrementar_descarga(self):
        """Admin puede incrementar descargas en doc confidencial."""
        headers = self.authenticate_as(self.admin)
        response = self.client.post(self._url('incrementar-descarga'), **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # ---- USER SIN ACCESO: 403 en cada endpoint sensible ---------------------

    def test_sin_acceso_firmas_403(self):
        headers = self.authenticate_as(self.user_sin_acceso)
        response = self.client.get(self._url('firmas'), **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_sin_acceso_estado_firmas_403(self):
        headers = self.authenticate_as(self.user_sin_acceso)
        response = self.client.get(self._url('estado-firmas'), **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_sin_acceso_verificar_sellado_403(self):
        headers = self.authenticate_as(self.user_sin_acceso)
        response = self.client.get(self._url('verificar-sellado'), **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_sin_acceso_subir_anexo_403(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        headers = self.authenticate_as(self.user_sin_acceso)
        archivo = SimpleUploadedFile(
            'leak.pdf', b'%PDF-1.4 fake', content_type='application/pdf'
        )
        response = self.client.post(
            self._url('subir-anexo'),
            data={'archivo': archivo},
            **headers,
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_sin_acceso_eliminar_anexo_403(self):
        # Crear primero un anexo (admin)
        self.doc_confidencial.archivos_anexos = [{'id': 'abc123', 'path': 'x'}]
        self.doc_confidencial.save(update_fields=['archivos_anexos'])

        headers = self.authenticate_as(self.user_sin_acceso)
        url = f'{DOCUMENTOS_URL}{self.doc_confidencial.id}/eliminar-anexo/abc123/'
        response = self.client.delete(url, **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_sin_acceso_incrementar_descarga_403(self):
        headers = self.authenticate_as(self.user_sin_acceso)
        response = self.client.post(self._url('incrementar-descarga'), **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_sin_acceso_incrementar_impresion_403(self):
        headers = self.authenticate_as(self.user_sin_acceso)
        response = self.client.post(self._url('incrementar-impresion'), **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_sin_acceso_reprocesar_ocr_403(self):
        headers = self.authenticate_as(self.user_sin_acceso)
        response = self.client.post(self._url('reprocesar-ocr'), **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_sin_acceso_sellar_pdf_403(self):
        headers = self.authenticate_as(self.user_sin_acceso)
        response = self.client.post(self._url('sellar-pdf'), **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_sin_acceso_exportar_drive_403(self):
        headers = self.authenticate_as(self.user_sin_acceso)
        response = self.client.post(self._url('exportar-drive'), **headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ---- USER CON CARGO EN cargos_distribucion: 200 (no 403) ----------------

    def test_con_cargo_distribuido_firmas_200(self):
        """Usuario con cargo en cargos_distribucion accede a /firmas."""
        headers = self.authenticate_as(self.user_con_cargo)
        response = self.client.get(self._url('firmas'), **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_con_cargo_distribuido_estado_firmas_200(self):
        headers = self.authenticate_as(self.user_con_cargo)
        response = self.client.get(self._url('estado-firmas'), **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_con_cargo_distribuido_incrementar_descarga_200(self):
        headers = self.authenticate_as(self.user_con_cargo)
        response = self.client.post(self._url('incrementar-descarga'), **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # ---- mis-pendientes: filtra docs confidenciales sin acceso --------------

    def test_mis_pendientes_filtra_doc_confidencial_sin_acceso(self):
        """
        Si una AceptacionDocumental quedó asignada a un doc CONFIDENCIAL
        al cual el usuario ya no tiene acceso, NO debe aparecer en
        mis-pendientes (defensa contra distribuciones legacy).
        """
        from apps.gestion_estrategica.gestion_documental.models import (
            AceptacionDocumental,
        )

        # Inyectar manualmente una asignación legacy a usuario sin acceso.
        AceptacionDocumental.objects.create(
            documento=self.doc_confidencial,
            version_documento=self.doc_confidencial.version_actual,
            usuario=self.user_sin_acceso,
            estado='PENDIENTE',
            asignado_por=None,
        )

        headers = self.authenticate_as(self.user_sin_acceso)
        response = self.client.get(ACEPTACIONES_MIS_PENDIENTES, **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [a['documento'] for a in response.json()] if response.json() else []
        self.assertNotIn(
            self.doc_confidencial.id, ids,
            'doc CONFIDENCIAL sin acceso no debe aparecer en mis-pendientes',
        )

    def test_mis_pendientes_incluye_doc_con_acceso_por_cargo(self):
        """Usuario con cargo en cargos_distribucion sí ve el doc en mis-pendientes."""
        from apps.gestion_estrategica.gestion_documental.models import (
            AceptacionDocumental,
        )

        AceptacionDocumental.objects.create(
            documento=self.doc_confidencial,
            version_documento=self.doc_confidencial.version_actual,
            usuario=self.user_con_cargo,
            estado='PENDIENTE',
            asignado_por=None,
        )

        headers = self.authenticate_as(self.user_con_cargo)
        response = self.client.get(ACEPTACIONES_MIS_PENDIENTES, **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        ids = [a['documento'] for a in payload] if payload else []
        self.assertIn(self.doc_confidencial.id, ids)


# =============================================================================
# H-GD-M4 — Distribución por cargos al publicar y al crear nuevo usuario
# =============================================================================

class HGDM4DistribucionLecturaObligatoriaTests(
    _GestionDocumentalRBACMixin, BaseTenantTestCase
):
    """
    `_distribuir_lectura_obligatoria` debe respetar la audiencia configurada:
      - aplica_a_todos=True              → todos los usuarios con cargo.
      - cargos_distribucion poblado      → solo usuarios con esos cargos.
      - lectura_obligatoria solo (sin filtros) → todos con cargo (legacy).

    El signal post_save de User aplica la misma regla a nuevos usuarios.
    """

    def setUp(self):
        super().setUp()
        self.admin = self.create_user(
            username=f'admin_{self._next_id()[:5]}',
            is_superuser=True,
            is_staff=True,
        )

        # Dos cargos distintos para discriminar la audiencia.
        self.cargo_a = self.create_cargo(name='Cargo A — Distribución')
        self.cargo_b = self.create_cargo(name='Cargo B — Excluido')

        # Usuarios existentes con cada cargo.
        self.user_a = self.create_user(
            username=f'a_{self._next_id()[:5]}', cargo=self.cargo_a,
        )
        self.user_b = self.create_user(
            username=f'b_{self._next_id()[:5]}', cargo=self.cargo_b,
        )

    def _publicar_con_distribucion(self, **kwargs):
        """Publica un BORRADOR vía DocumentoService.publicar_documento."""
        from apps.gestion_estrategica.gestion_documental.services import (
            DocumentoService,
        )

        doc = self._crear_documento(
            autor=self.admin,
            clasificacion='INTERNO',
            estado='APROBADO',  # publicar_documento requiere APROBADO
            **kwargs,
        )
        # publicar_documento dispara distribución si lectura_obligatoria=True
        return DocumentoService.publicar_documento(
            documento_id=doc.id,
            usuario=self.admin,
        )

    # ---- Escenario 1: aplica_a_todos=True ----------------------------------

    def test_aplica_a_todos_distribuye_a_todos_los_cargos(self):
        from apps.gestion_estrategica.gestion_documental.models import (
            AceptacionDocumental,
        )

        doc = self._publicar_con_distribucion(
            lectura_obligatoria=True,
            aplica_a_todos=True,
        )

        usuarios_asignados = set(
            AceptacionDocumental.objects.filter(documento=doc)
            .values_list('usuario_id', flat=True)
        )
        self.assertIn(self.user_a.id, usuarios_asignados)
        self.assertIn(self.user_b.id, usuarios_asignados)

    # ---- Escenario 2: solo cargos_distribucion -----------------------------

    def test_cargos_distribucion_excluye_otros_cargos(self):
        """
        Con `cargos_distribucion=[cargo_a]` y aplica_a_todos=False, solo
        usuarios con cargo_a reciben la asignación. user_b (cargo_b) NO.
        """
        from apps.gestion_estrategica.gestion_documental.models import (
            AceptacionDocumental,
        )

        doc = self._publicar_con_distribucion(
            lectura_obligatoria=True,
            aplica_a_todos=False,
            cargos_distribucion=[self.cargo_a],
        )

        usuarios_asignados = set(
            AceptacionDocumental.objects.filter(documento=doc)
            .values_list('usuario_id', flat=True)
        )
        self.assertIn(self.user_a.id, usuarios_asignados)
        self.assertNotIn(
            self.user_b.id, usuarios_asignados,
            'user_b NO debe recibir asignación: su cargo no está en cargos_distribucion',
        )

    # ---- Escenario 3: solo lectura_obligatoria (sin filtros) ---------------

    def test_solo_lectura_obligatoria_mantiene_legacy_universal(self):
        """
        `lectura_obligatoria=True` sin `aplica_a_todos` ni
        `cargos_distribucion` distribuye a TODOS los usuarios con cargo
        (compatibilidad con políticas universales tipo Habeas Data).
        """
        from apps.gestion_estrategica.gestion_documental.models import (
            AceptacionDocumental,
        )

        doc = self._publicar_con_distribucion(
            lectura_obligatoria=True,
            aplica_a_todos=False,
            cargos_distribucion=None,
        )

        usuarios_asignados = set(
            AceptacionDocumental.objects.filter(documento=doc)
            .values_list('usuario_id', flat=True)
        )
        self.assertIn(self.user_a.id, usuarios_asignados)
        self.assertIn(self.user_b.id, usuarios_asignados)

    # ---- Signal: nuevo usuario respeta cargos_distribucion -----------------

    def test_signal_nuevo_usuario_respeta_cargos_distribucion(self):
        """
        Cuando se crea un usuario nuevo con cargo_b, NO debe recibir
        asignación de un documento publicado con
        `lectura_obligatoria=True` y `cargos_distribucion=[cargo_a]`.
        """
        from apps.gestion_estrategica.gestion_documental.models import (
            AceptacionDocumental,
        )

        # Publicar documento dirigido solo a cargo_a.
        doc = self._publicar_con_distribucion(
            lectura_obligatoria=True,
            aplica_a_todos=False,
            cargos_distribucion=[self.cargo_a],
        )

        # Crear nuevo usuario con cargo_b — el signal NO debe asignarle el doc.
        nuevo_user_b = self.create_user(
            username=f'newb_{self._next_id()[:5]}',
            cargo=self.cargo_b,
        )

        asignaciones_b = AceptacionDocumental.objects.filter(
            documento=doc, usuario=nuevo_user_b,
        )
        self.assertFalse(
            asignaciones_b.exists(),
            'Nuevo usuario con cargo fuera de cargos_distribucion NO debe '
            'recibir asignación automática.',
        )

    def test_signal_nuevo_usuario_recibe_doc_aplica_a_todos(self):
        """
        Nuevo usuario con cualquier cargo recibe documentos publicados con
        `aplica_a_todos=True`.
        """
        from apps.gestion_estrategica.gestion_documental.models import (
            AceptacionDocumental,
        )

        doc = self._publicar_con_distribucion(
            lectura_obligatoria=True,
            aplica_a_todos=True,
        )

        nuevo_user_b = self.create_user(
            username=f'newall_{self._next_id()[:5]}',
            cargo=self.cargo_b,
        )

        self.assertTrue(
            AceptacionDocumental.objects.filter(
                documento=doc, usuario=nuevo_user_b,
            ).exists(),
            'aplica_a_todos=True debe asignar a cualquier nuevo usuario con cargo.',
        )

    def test_signal_nuevo_usuario_recibe_politica_universal(self):
        """
        Documento con `lectura_obligatoria=True` SIN `aplica_a_todos` ni
        `cargos_distribucion` (política universal legacy) se asigna a
        cualquier nuevo usuario con cargo.
        """
        from apps.gestion_estrategica.gestion_documental.models import (
            AceptacionDocumental,
        )

        doc = self._publicar_con_distribucion(
            lectura_obligatoria=True,
            aplica_a_todos=False,
            cargos_distribucion=None,
        )

        nuevo_user = self.create_user(
            username=f'newuni_{self._next_id()[:5]}',
            cargo=self.cargo_b,
        )

        self.assertTrue(
            AceptacionDocumental.objects.filter(
                documento=doc, usuario=nuevo_user,
            ).exists(),
            'Política universal (solo lectura_obligatoria) debe asignarse a '
            'cualquier nuevo usuario con cargo.',
        )
