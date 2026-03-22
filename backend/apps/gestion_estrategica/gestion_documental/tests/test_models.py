"""
Tests para modelos de gestion_documental

Coverage:
- TipoDocumento: creacion, campos, unique_together, str, validaciones
- PlantillaDocumento: creacion, tipos, versionamiento, str
- Documento: creacion, estados, clasificacion, versionamiento, str
- VersionDocumento: creacion, tipos de cambio, str
"""
import pytest
from django.db import IntegrityError
from django.core.exceptions import ValidationError


@pytest.mark.django_db
class TestTipoDocumento:
    """Tests para el modelo TipoDocumento."""

    def test_crear_tipo_documento_basico(self, empresa, user):
        """Crear tipo de documento con datos minimos."""
        from apps.gestion_estrategica.gestion_documental.models import TipoDocumento

        tipo = TipoDocumento.objects.create(
            codigo='IN',
            nombre='Instructivo',
            prefijo_codigo='IN-',
            empresa_id=empresa.pk,
            created_by=user
        )

        assert tipo.pk is not None
        assert tipo.codigo == 'IN'
        assert tipo.nombre == 'Instructivo'
        assert tipo.nivel_documento == 'OPERATIVO'
        assert tipo.requiere_aprobacion is True
        assert tipo.requiere_firma is True
        assert tipo.tiempo_retencion_anos == 5
        assert tipo.is_active is True

    def test_tipo_documento_str(self, tipo_documento):
        """Representacion string de TipoDocumento."""
        assert str(tipo_documento) == 'PR - Procedimiento'

    def test_tipo_documento_unique_together(self, tipo_documento, user):
        """Empresa + codigo deben ser unicos."""
        from apps.gestion_estrategica.gestion_documental.models import TipoDocumento

        with pytest.raises(IntegrityError):
            TipoDocumento.objects.create(
                codigo='PR',
                nombre='Procedimiento Duplicado',
                prefijo_codigo='PR-',
                empresa_id=tipo_documento.empresa_id,
                created_by=user
            )

    def test_tipo_documento_niveles(self, empresa, user):
        """Validar todos los niveles de documento."""
        from apps.gestion_estrategica.gestion_documental.models import TipoDocumento

        niveles = ['ESTRATEGICO', 'TACTICO', 'OPERATIVO', 'SOPORTE']
        for i, nivel in enumerate(niveles):
            tipo = TipoDocumento.objects.create(
                codigo=f'NV{i}',
                nombre=f'Tipo Nivel {nivel}',
                nivel_documento=nivel,
                prefijo_codigo=f'NV{i}-',
                empresa_id=empresa.pk,
                created_by=user
            )
            assert tipo.nivel_documento == nivel

    def test_tipo_documento_campos_obligatorios_json(self, tipo_documento):
        """campos_obligatorios almacena lista JSON correctamente."""
        assert isinstance(tipo_documento.campos_obligatorios, list)
        assert 'titulo' in tipo_documento.campos_obligatorios
        assert 'contenido' in tipo_documento.campos_obligatorios

    def test_tipo_documento_campos_obligatorios_vacio(self, empresa, user):
        """campos_obligatorios puede ser lista vacia."""
        from apps.gestion_estrategica.gestion_documental.models import TipoDocumento

        tipo = TipoDocumento.objects.create(
            codigo='FT',
            nombre='Formato',
            prefijo_codigo='FT-',
            campos_obligatorios=[],
            empresa_id=empresa.pk,
            created_by=user
        )
        assert tipo.campos_obligatorios == []

    def test_tipo_documento_sin_aprobacion(self, empresa, user):
        """Tipo de documento que no requiere aprobacion ni firma."""
        from apps.gestion_estrategica.gestion_documental.models import TipoDocumento

        tipo = TipoDocumento.objects.create(
            codigo='REG',
            nombre='Registro',
            prefijo_codigo='REG-',
            requiere_aprobacion=False,
            requiere_firma=False,
            empresa_id=empresa.pk,
            created_by=user
        )
        assert tipo.requiere_aprobacion is False
        assert tipo.requiere_firma is False

    def test_tipo_documento_retencion_minima(self, empresa, user):
        """Tiempo de retencion con validador MinValue(1)."""
        from apps.gestion_estrategica.gestion_documental.models import TipoDocumento

        tipo = TipoDocumento.objects.create(
            codigo='TMP',
            nombre='Temporal',
            prefijo_codigo='TMP-',
            tiempo_retencion_anos=1,
            empresa_id=empresa.pk,
            created_by=user
        )
        assert tipo.tiempo_retencion_anos == 1

    def test_tipo_documento_ordering(self, tipo_documento, tipo_documento_manual):
        """Tipos de documento ordenados por orden, codigo."""
        from apps.gestion_estrategica.gestion_documental.models import TipoDocumento

        tipos = list(TipoDocumento.objects.filter(
            empresa_id=tipo_documento.empresa_id
        ))
        assert tipos[0] == tipo_documento
        assert tipos[1] == tipo_documento_manual


@pytest.mark.django_db
class TestPlantillaDocumento:
    """Tests para el modelo PlantillaDocumento."""

    def test_crear_plantilla_basica(self, empresa, tipo_documento, user):
        """Crear plantilla de documento basica."""
        from apps.gestion_estrategica.gestion_documental.models import PlantillaDocumento

        plantilla = PlantillaDocumento.objects.create(
            codigo='PLT-TEST-001',
            nombre='Plantilla Test',
            tipo_documento=tipo_documento,
            tipo_plantilla='HTML',
            contenido_plantilla='<p>Test</p>',
            empresa_id=empresa.pk,
            created_by=user
        )

        assert plantilla.pk is not None
        assert plantilla.tipo_plantilla == 'HTML'
        assert plantilla.version == '1.0'
        assert plantilla.estado == 'BORRADOR'
        assert plantilla.es_por_defecto is False

    def test_plantilla_str(self, plantilla_documento):
        """Representacion string de PlantillaDocumento."""
        assert 'PLT-PR-001' in str(plantilla_documento)
        assert 'v1.0' in str(plantilla_documento)

    def test_plantilla_tipos(self, empresa, tipo_documento, user):
        """Validar los tres tipos de plantilla."""
        from apps.gestion_estrategica.gestion_documental.models import PlantillaDocumento

        tipos = ['HTML', 'MARKDOWN', 'FORMULARIO']
        for i, tipo in enumerate(tipos):
            plantilla = PlantillaDocumento.objects.create(
                codigo=f'PLT-T{i}',
                nombre=f'Plantilla {tipo}',
                tipo_documento=tipo_documento,
                tipo_plantilla=tipo,
                contenido_plantilla='Contenido test',
                empresa_id=empresa.pk,
                created_by=user
            )
            assert plantilla.tipo_plantilla == tipo

    def test_plantilla_estados(self, empresa, tipo_documento, user):
        """Validar estados de plantilla."""
        from apps.gestion_estrategica.gestion_documental.models import PlantillaDocumento

        estados = ['BORRADOR', 'ACTIVA', 'OBSOLETA']
        for i, estado in enumerate(estados):
            plantilla = PlantillaDocumento.objects.create(
                codigo=f'PLT-E{i}',
                nombre=f'Plantilla Estado {estado}',
                tipo_documento=tipo_documento,
                tipo_plantilla='HTML',
                contenido_plantilla='Contenido',
                estado=estado,
                empresa_id=empresa.pk,
                created_by=user
            )
            assert plantilla.estado == estado

    def test_plantilla_variables_disponibles(self, plantilla_documento):
        """Variables disponibles almacena lista JSON."""
        assert isinstance(plantilla_documento.variables_disponibles, list)
        assert 'titulo' in plantilla_documento.variables_disponibles

    def test_plantilla_unique_together(self, plantilla_documento, user):
        """Empresa + codigo deben ser unicos."""
        from apps.gestion_estrategica.gestion_documental.models import PlantillaDocumento

        with pytest.raises(IntegrityError):
            PlantillaDocumento.objects.create(
                codigo='PLT-PR-001',
                nombre='Duplicada',
                tipo_documento=plantilla_documento.tipo_documento,
                tipo_plantilla='HTML',
                contenido_plantilla='Test',
                empresa_id=plantilla_documento.empresa_id,
                created_by=user
            )

    def test_plantilla_firmantes_por_defecto(self, empresa, tipo_documento, user):
        """Firmantes por defecto almacena lista JSON."""
        from apps.gestion_estrategica.gestion_documental.models import PlantillaDocumento

        firmantes = [
            {"rol_firma": "ELABORO", "cargo_code": "COORD_HSEQ", "orden": 1},
            {"rol_firma": "APROBO", "cargo_code": "GERENTE", "orden": 2},
        ]
        plantilla = PlantillaDocumento.objects.create(
            codigo='PLT-FIRM-001',
            nombre='Plantilla con Firmantes',
            tipo_documento=tipo_documento,
            tipo_plantilla='HTML',
            contenido_plantilla='<p>Con firmas</p>',
            firmantes_por_defecto=firmantes,
            empresa_id=empresa.pk,
            created_by=user
        )
        assert len(plantilla.firmantes_por_defecto) == 2
        assert plantilla.firmantes_por_defecto[0]['rol_firma'] == 'ELABORO'


@pytest.mark.django_db
class TestDocumento:
    """Tests para el modelo Documento."""

    def test_crear_documento_basico(self, empresa, tipo_documento, user):
        """Crear documento con datos minimos."""
        from apps.gestion_estrategica.gestion_documental.models import Documento

        doc = Documento.objects.create(
            codigo='PR-TEST-001',
            titulo='Procedimiento de Prueba',
            tipo_documento=tipo_documento,
            contenido='<p>Contenido de prueba</p>',
            elaborado_por=user,
            empresa_id=empresa.pk
        )

        assert doc.pk is not None
        assert doc.version_actual == '1.0'
        assert doc.numero_revision == 0
        assert doc.estado == 'BORRADOR'
        assert doc.clasificacion == 'INTERNO'
        assert doc.numero_descargas == 0

    def test_documento_str(self, documento):
        """Representacion string de Documento."""
        result = str(documento)
        assert 'PR-001' in result
        assert 'v1.0' in result

    def test_documento_todos_los_estados(self, empresa, tipo_documento, user):
        """Validar todos los estados de documento."""
        from apps.gestion_estrategica.gestion_documental.models import Documento

        estados = ['BORRADOR', 'EN_REVISION', 'APROBADO', 'PUBLICADO', 'OBSOLETO', 'ARCHIVADO']
        for i, estado in enumerate(estados):
            doc = Documento.objects.create(
                codigo=f'DOC-EST-{i}',
                titulo=f'Doc Estado {estado}',
                tipo_documento=tipo_documento,
                contenido='Contenido',
                estado=estado,
                elaborado_por=user,
                empresa_id=empresa.pk
            )
            assert doc.estado == estado

    def test_documento_clasificaciones(self, empresa, tipo_documento, user):
        """Validar todas las clasificaciones de seguridad."""
        from apps.gestion_estrategica.gestion_documental.models import Documento

        clasificaciones = ['PUBLICO', 'INTERNO', 'CONFIDENCIAL', 'RESTRINGIDO']
        for i, clasif in enumerate(clasificaciones):
            doc = Documento.objects.create(
                codigo=f'DOC-CL-{i}',
                titulo=f'Doc Clasificacion {clasif}',
                tipo_documento=tipo_documento,
                contenido='Contenido',
                clasificacion=clasif,
                elaborado_por=user,
                empresa_id=empresa.pk
            )
            assert doc.clasificacion == clasif

    def test_documento_unique_together(self, documento, user):
        """Empresa + codigo deben ser unicos."""
        from apps.gestion_estrategica.gestion_documental.models import Documento

        with pytest.raises(IntegrityError):
            Documento.objects.create(
                codigo='PR-001',
                titulo='Duplicado',
                tipo_documento=documento.tipo_documento,
                contenido='Contenido',
                elaborado_por=user,
                empresa_id=documento.empresa_id
            )

    def test_documento_con_plantilla(self, documento, plantilla_documento):
        """Documento vinculado a plantilla."""
        assert documento.plantilla == plantilla_documento
        assert documento.plantilla.tipo_plantilla == 'HTML'

    def test_documento_palabras_clave(self, empresa, tipo_documento, user):
        """Palabras clave almacena lista JSON."""
        from apps.gestion_estrategica.gestion_documental.models import Documento

        doc = Documento.objects.create(
            codigo='PR-KW-001',
            titulo='Doc con Keywords',
            tipo_documento=tipo_documento,
            contenido='Contenido',
            palabras_clave=['calidad', 'ISO', 'procedimiento'],
            elaborado_por=user,
            empresa_id=empresa.pk
        )
        assert len(doc.palabras_clave) == 3
        assert 'calidad' in doc.palabras_clave

    def test_documento_datos_formulario(self, empresa, tipo_documento, user):
        """Datos de formulario almacena JSON."""
        from apps.gestion_estrategica.gestion_documental.models import Documento

        datos = {'campo1': 'valor1', 'campo2': 42}
        doc = Documento.objects.create(
            codigo='PR-FORM-001',
            titulo='Doc Formulario',
            tipo_documento=tipo_documento,
            contenido='Contenido',
            datos_formulario=datos,
            elaborado_por=user,
            empresa_id=empresa.pk
        )
        assert doc.datos_formulario['campo1'] == 'valor1'
        assert doc.datos_formulario['campo2'] == 42

    def test_documento_ocr_estados(self, empresa, tipo_documento, user):
        """Validar estados OCR."""
        from apps.gestion_estrategica.gestion_documental.models import Documento

        doc = Documento.objects.create(
            codigo='PR-OCR-001',
            titulo='Doc OCR',
            tipo_documento=tipo_documento,
            contenido='Contenido',
            ocr_estado='PENDIENTE',
            elaborado_por=user,
            empresa_id=empresa.pk
        )
        assert doc.ocr_estado == 'PENDIENTE'

    def test_documento_sellado_estados(self, empresa, tipo_documento, user):
        """Validar estados de sellado PDF."""
        from apps.gestion_estrategica.gestion_documental.models import Documento

        doc = Documento.objects.create(
            codigo='PR-SELL-001',
            titulo='Doc Sellado',
            tipo_documento=tipo_documento,
            contenido='Contenido',
            sellado_estado='COMPLETADO',
            hash_pdf_sellado='abc123def456',
            elaborado_por=user,
            empresa_id=empresa.pk
        )
        assert doc.sellado_estado == 'COMPLETADO'
        assert doc.hash_pdf_sellado == 'abc123def456'

    def test_documento_workflow_asociado(self, empresa, tipo_documento, user):
        """Documento con workflow BPM asociado."""
        from apps.gestion_estrategica.gestion_documental.models import Documento

        doc = Documento.objects.create(
            codigo='PR-WF-001',
            titulo='Doc con Workflow',
            tipo_documento=tipo_documento,
            contenido='Contenido',
            workflow_asociado_id=42,
            workflow_asociado_nombre='Flujo Aprobacion Docs',
            es_auto_generado=True,
            elaborado_por=user,
            empresa_id=empresa.pk
        )
        assert doc.workflow_asociado_id == 42
        assert doc.es_auto_generado is True

    def test_documento_score_cumplimiento(self, empresa, tipo_documento, user):
        """Score de cumplimiento heuristico."""
        from apps.gestion_estrategica.gestion_documental.models import Documento

        doc = Documento.objects.create(
            codigo='PR-SCORE-001',
            titulo='Doc con Score',
            tipo_documento=tipo_documento,
            contenido='Contenido',
            score_cumplimiento=85,
            score_detalle={'completitud': 90, 'firmas': 80},
            elaborado_por=user,
            empresa_id=empresa.pk
        )
        assert doc.score_cumplimiento == 85
        assert doc.score_detalle['completitud'] == 90


@pytest.mark.django_db
class TestVersionDocumento:
    """Tests para el modelo VersionDocumento."""

    def test_crear_version_basica(self, documento, user):
        """Crear version de documento."""
        from apps.gestion_estrategica.gestion_documental.models import VersionDocumento

        version = VersionDocumento.objects.create(
            documento=documento,
            numero_version='1.0',
            tipo_cambio='CREACION',
            contenido_snapshot='<p>Contenido v1.0</p>',
            descripcion_cambios='Creacion inicial',
            creado_por=user
        )

        assert version.pk is not None
        assert version.numero_version == '1.0'
        assert version.tipo_cambio == 'CREACION'

    def test_version_tipos_cambio(self, documento, user):
        """Validar todos los tipos de cambio."""
        from apps.gestion_estrategica.gestion_documental.models import VersionDocumento

        tipos = ['CREACION', 'REVISION_MENOR', 'REVISION_MAYOR', 'CORRECCION', 'ACTUALIZACION']
        for i, tipo in enumerate(tipos):
            version = VersionDocumento.objects.create(
                documento=documento,
                numero_version=f'1.{i}',
                tipo_cambio=tipo,
                contenido_snapshot='Snapshot',
                descripcion_cambios=f'Cambio tipo {tipo}',
                creado_por=user
            )
            assert version.tipo_cambio == tipo

    def test_version_con_cambios_detectados(self, documento, user):
        """Version con lista de cambios detectados."""
        from apps.gestion_estrategica.gestion_documental.models import VersionDocumento

        cambios = [
            {'campo': 'titulo', 'anterior': 'Titulo v1', 'nuevo': 'Titulo v2'},
            {'campo': 'contenido', 'anterior': 'viejo', 'nuevo': 'nuevo'},
        ]
        version = VersionDocumento.objects.create(
            documento=documento,
            numero_version='2.0',
            tipo_cambio='REVISION_MAYOR',
            contenido_snapshot='Contenido v2',
            descripcion_cambios='Revision mayor',
            cambios_detectados=cambios,
            creado_por=user
        )
        assert len(version.cambios_detectados) == 2
        assert version.cambios_detectados[0]['campo'] == 'titulo'

    def test_version_multiples_por_documento(self, documento, user):
        """Un documento puede tener multiples versiones."""
        from apps.gestion_estrategica.gestion_documental.models import VersionDocumento

        v1 = VersionDocumento.objects.create(
            documento=documento,
            numero_version='1.0',
            tipo_cambio='CREACION',
            contenido_snapshot='V1',
            descripcion_cambios='Creacion',
            creado_por=user
        )
        v2 = VersionDocumento.objects.create(
            documento=documento,
            numero_version='1.1',
            tipo_cambio='REVISION_MENOR',
            contenido_snapshot='V1.1',
            descripcion_cambios='Correccion menor',
            creado_por=user
        )

        versiones = documento.versiones.all()
        assert versiones.count() == 2
