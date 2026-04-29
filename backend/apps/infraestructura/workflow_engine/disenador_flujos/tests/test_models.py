"""
Tests para modelos de disenador_flujos (workflow_engine)

Coverage:
- CategoriaFlujo: creacion, unique_together, validacion color, str
- PlantillaFlujo: creacion, versionamiento, estados, unique_together, str
- NodoFlujo: creacion, tipos BPMN, unique_together, propiedades, str
- TransicionFlujo: creacion, condiciones, evaluacion, validaciones, str
"""
import pytest
from django.db import IntegrityError
from django.core.exceptions import ValidationError


@pytest.mark.django_db
class TestCategoriaFlujo:
    """Tests para el modelo CategoriaFlujo."""

    def test_crear_categoria_basica(self, empresa, user):
        """Crear categoria de flujo con datos basicos."""
        from apps.infraestructura.workflow_engine.disenador_flujos.models import CategoriaFlujo

        categoria = CategoriaFlujo.objects.create(
            empresa_id=empresa.pk,
            codigo='COMPRAS',
            nombre='Compras',
            descripcion='Flujos de compras',
            created_by=user
        )

        assert categoria.pk is not None
        assert categoria.codigo == 'COMPRAS'
        assert categoria.color == '#3B82F6'
        assert categoria.activo is True
        assert categoria.orden == 0

    def test_categoria_str(self, categoria_flujo):
        """Representacion string de CategoriaFlujo."""
        assert str(categoria_flujo) == 'APROBACIONES - Aprobaciones'

    def test_categoria_unique_together(self, categoria_flujo, user):
        """Empresa + codigo deben ser unicos."""
        from apps.infraestructura.workflow_engine.disenador_flujos.models import CategoriaFlujo

        with pytest.raises(IntegrityError):
            CategoriaFlujo.objects.create(
                empresa_id=categoria_flujo.empresa_id,
                codigo='APROBACIONES',
                nombre='Duplicada',
                created_by=user
            )

    def test_categoria_color_invalido(self, empresa, user):
        """Color sin # lanza ValidationError."""
        from apps.infraestructura.workflow_engine.disenador_flujos.models import CategoriaFlujo

        categoria = CategoriaFlujo(
            empresa_id=empresa.pk,
            codigo='INVALIDO',
            nombre='Color Invalido',
            color='FF0000',
            created_by=user
        )
        with pytest.raises(ValidationError):
            categoria.clean()

    def test_categoria_ordering(self, categoria_flujo, categoria_flujo_hseq):
        """Categorias ordenadas por orden, nombre."""
        from apps.infraestructura.workflow_engine.disenador_flujos.models import CategoriaFlujo

        categorias = list(CategoriaFlujo.objects.filter(
            empresa_id=categoria_flujo.empresa_id
        ))
        assert categorias[0] == categoria_flujo
        assert categorias[1] == categoria_flujo_hseq


@pytest.mark.django_db
class TestPlantillaFlujo:
    """Tests para el modelo PlantillaFlujo."""

    def test_crear_plantilla_basica(self, empresa, categoria_flujo, user):
        """Crear plantilla de flujo basica."""
        from apps.infraestructura.workflow_engine.disenador_flujos.models import PlantillaFlujo

        plantilla = PlantillaFlujo.objects.create(
            empresa_id=empresa.pk,
            categoria=categoria_flujo,
            codigo='APROB_COMPRA',
            nombre='Aprobacion de Compra',
            version=1,
            created_by=user
        )

        assert plantilla.pk is not None
        assert plantilla.version == 1
        assert plantilla.estado == 'BORRADOR'
        assert plantilla.permite_cancelacion is True
        assert plantilla.requiere_aprobacion_gerencia is False

    def test_plantilla_str(self, plantilla_flujo):
        """Representacion string de PlantillaFlujo."""
        result = str(plantilla_flujo)
        assert 'APROB_VACACIONES' in result
        assert 'v1' in result

    def test_plantilla_unique_together(self, plantilla_flujo, user):
        """Empresa + codigo + version deben ser unicos."""
        from apps.infraestructura.workflow_engine.disenador_flujos.models import PlantillaFlujo

        with pytest.raises(IntegrityError):
            PlantillaFlujo.objects.create(
                empresa_id=plantilla_flujo.empresa_id,
                categoria=plantilla_flujo.categoria,
                codigo='APROB_VACACIONES',
                nombre='Duplicada',
                version=1,
                created_by=user
            )

    def test_plantilla_estados(self, empresa, categoria_flujo, user):
        """Validar todos los estados de version."""
        from apps.infraestructura.workflow_engine.disenador_flujos.models import PlantillaFlujo

        estados = ['BORRADOR', 'ACTIVO', 'OBSOLETO', 'ARCHIVADO']
        for i, estado in enumerate(estados):
            plantilla = PlantillaFlujo.objects.create(
                empresa_id=empresa.pk,
                categoria=categoria_flujo,
                codigo=f'FLUJO_EST_{i}',
                nombre=f'Flujo Estado {estado}',
                version=1,
                estado=estado,
                created_by=user
            )
            assert plantilla.estado == estado

    def test_plantilla_etiquetas_json(self, plantilla_flujo):
        """Etiquetas almacena lista JSON."""
        assert isinstance(plantilla_flujo.etiquetas, list)
        assert 'vacaciones' in plantilla_flujo.etiquetas

    def test_plantilla_json_diagram(self, empresa, categoria_flujo, user):
        """json_diagram almacena configuracion del diagrama."""
        from apps.infraestructura.workflow_engine.disenador_flujos.models import PlantillaFlujo

        diagrama = {'nodos': [{'id': 1, 'tipo': 'INICIO'}], 'edges': []}
        plantilla = PlantillaFlujo.objects.create(
            empresa_id=empresa.pk,
            categoria=categoria_flujo,
            codigo='FLUJO_DIAG',
            nombre='Flujo con Diagrama',
            version=1,
            json_diagram=diagrama,
            created_by=user
        )
        assert plantilla.json_diagram['nodos'][0]['tipo'] == 'INICIO'

    def test_plantilla_config_auto_generacion(self, empresa, categoria_flujo, user):
        """Configuracion de auto-generacion documental."""
        from apps.infraestructura.workflow_engine.disenador_flujos.models import PlantillaFlujo

        config = {'habilitado': True, 'tipo_documento_id': 1, 'estado_inicial': 'BORRADOR'}
        plantilla = PlantillaFlujo.objects.create(
            empresa_id=empresa.pk,
            categoria=categoria_flujo,
            codigo='FLUJO_AUTOGEN',
            nombre='Flujo con Auto-Gen',
            version=1,
            config_auto_generacion=config,
            created_by=user
        )
        assert plantilla.config_auto_generacion['habilitado'] is True

    def test_plantilla_multiples_versiones(self, empresa, categoria_flujo, user):
        """Un flujo puede tener multiples versiones."""
        from apps.infraestructura.workflow_engine.disenador_flujos.models import PlantillaFlujo

        v1 = PlantillaFlujo.objects.create(
            empresa_id=empresa.pk,
            categoria=categoria_flujo,
            codigo='FLUJO_MULTIVERSION',
            nombre='Flujo Multi Version',
            version=1,
            estado='OBSOLETO',
            created_by=user
        )
        v2 = PlantillaFlujo.objects.create(
            empresa_id=empresa.pk,
            categoria=categoria_flujo,
            codigo='FLUJO_MULTIVERSION',
            nombre='Flujo Multi Version v2',
            version=2,
            estado='ACTIVO',
            plantilla_origen=v1,
            created_by=user
        )

        assert v2.plantilla_origen == v1
        assert v2.version == 2


@pytest.mark.django_db
class TestNodoFlujo:
    """Tests para el modelo NodoFlujo."""

    def test_crear_nodo_inicio(self, nodo_inicio):
        """Crear nodo tipo INICIO."""
        assert nodo_inicio.pk is not None
        assert nodo_inicio.tipo == 'INICIO'
        assert nodo_inicio.es_inicio is True
        assert nodo_inicio.es_fin is False
        assert nodo_inicio.es_tarea is False
        assert nodo_inicio.es_gateway is False

    def test_crear_nodo_fin(self, nodo_fin):
        """Crear nodo tipo FIN."""
        assert nodo_fin.tipo == 'FIN'
        assert nodo_fin.es_fin is True
        assert nodo_fin.es_inicio is False

    def test_nodo_str(self, nodo_inicio):
        """Representacion string de NodoFlujo."""
        result = str(nodo_inicio)
        assert 'Inicio' in result
        assert 'Inicio Solicitud' in result

    def test_nodo_unique_together(self, nodo_inicio, user):
        """Plantilla + codigo deben ser unicos."""
        from apps.infraestructura.workflow_engine.disenador_flujos.models import NodoFlujo

        with pytest.raises(IntegrityError):
            NodoFlujo.objects.create(
                empresa_id=nodo_inicio.empresa_id,
                plantilla=nodo_inicio.plantilla,
                tipo='TAREA',
                codigo='INICIO_VACACIONES',
                nombre='Duplicado',
                created_by=nodo_inicio.created_by
            )

    def test_nodo_tipos_bpmn(self, empresa, plantilla_flujo, user):
        """Validar todos los tipos de nodo BPMN."""
        from apps.infraestructura.workflow_engine.disenador_flujos.models import NodoFlujo

        tipos = ['INICIO', 'FIN', 'TAREA', 'GATEWAY_PARALELO', 'GATEWAY_EXCLUSIVO', 'EVENTO']
        for i, tipo in enumerate(tipos):
            nodo = NodoFlujo.objects.create(
                empresa_id=empresa.pk,
                plantilla=plantilla_flujo,
                tipo=tipo,
                codigo=f'NODO_TIPO_{i}',
                nombre=f'Nodo {tipo}',
                created_by=user
            )
            assert nodo.tipo == tipo

    def test_nodo_gateway_propiedad(self, empresa, plantilla_flujo, user):
        """Propiedad es_gateway para gateways."""
        from apps.infraestructura.workflow_engine.disenador_flujos.models import NodoFlujo

        gw_paralelo = NodoFlujo.objects.create(
            empresa_id=empresa.pk,
            plantilla=plantilla_flujo,
            tipo='GATEWAY_PARALELO',
            codigo='GW_PAR',
            nombre='Gateway Paralelo',
            created_by=user
        )
        gw_exclusivo = NodoFlujo.objects.create(
            empresa_id=empresa.pk,
            plantilla=plantilla_flujo,
            tipo='GATEWAY_EXCLUSIVO',
            codigo='GW_EXC',
            nombre='Gateway Exclusivo',
            created_by=user
        )

        assert gw_paralelo.es_gateway is True
        assert gw_exclusivo.es_gateway is True

    def test_nodo_posicion_diagrama(self, nodo_inicio):
        """Nodo almacena posicion en diagrama visual."""
        assert nodo_inicio.posicion_x == 100
        assert nodo_inicio.posicion_y == 200

    def test_nodo_configuracion_json(self, empresa, plantilla_flujo, user):
        """Configuracion avanzada en JSON."""
        from apps.infraestructura.workflow_engine.disenador_flujos.models import NodoFlujo

        config = {'tipo_evento': 'temporizador', 'duracion_horas': 24}
        nodo = NodoFlujo.objects.create(
            empresa_id=empresa.pk,
            plantilla=plantilla_flujo,
            tipo='EVENTO',
            codigo='EVENTO_TIMER',
            nombre='Temporizador 24h',
            configuracion=config,
            created_by=user
        )
        assert nodo.configuracion['duracion_horas'] == 24


@pytest.mark.django_db
class TestTransicionFlujo:
    """Tests para el modelo TransicionFlujo."""

    def test_crear_transicion_basica(self, transicion_flujo):
        """Crear transicion entre nodos."""
        assert transicion_flujo.pk is not None
        assert transicion_flujo.nombre == 'Flujo directo'
        assert transicion_flujo.prioridad == 0

    def test_transicion_str(self, transicion_flujo):
        """Representacion string de TransicionFlujo."""
        result = str(transicion_flujo)
        assert 'Inicio Solicitud' in result
        assert 'Fin Solicitud' in result

    def test_transicion_condicion_vacia_evalua_true(self, transicion_flujo):
        """Transicion sin condicion siempre evalua True."""
        assert transicion_flujo.evaluar_condicion({}) is True
        assert transicion_flujo.evaluar_condicion({'cualquier': 'dato'}) is True

    def test_transicion_condicion_simple_igual(self, empresa, plantilla_flujo, nodo_inicio, nodo_fin, user):
        """Evaluar condicion simple con operador IGUAL."""
        from apps.infraestructura.workflow_engine.disenador_flujos.models import TransicionFlujo

        transicion = TransicionFlujo.objects.create(
            empresa_id=empresa.pk,
            plantilla=plantilla_flujo,
            nodo_origen=nodo_inicio,
            nodo_destino=nodo_fin,
            nombre='Si es aprobado',
            condicion={'campo': 'decision', 'operador': 'IGUAL', 'valor': 'APROBADO'},
            prioridad=1,
            created_by=user
        )

        assert transicion.evaluar_condicion({'decision': 'APROBADO'}) is True
        assert transicion.evaluar_condicion({'decision': 'RECHAZADO'}) is False

    def test_transicion_condicion_mayor(self, empresa, plantilla_flujo, nodo_inicio, nodo_fin, user):
        """Evaluar condicion con operador MAYOR."""
        from apps.infraestructura.workflow_engine.disenador_flujos.models import TransicionFlujo

        transicion = TransicionFlujo.objects.create(
            empresa_id=empresa.pk,
            plantilla=plantilla_flujo,
            nodo_origen=nodo_inicio,
            nodo_destino=nodo_fin,
            nombre='Monto alto',
            condicion={'campo': 'monto', 'operador': 'MAYOR', 'valor': 1000000},
            prioridad=2,
            created_by=user
        )

        assert transicion.evaluar_condicion({'monto': 2000000}) is True
        assert transicion.evaluar_condicion({'monto': 500000}) is False

    def test_transicion_validacion_ciclo_directo(self, empresa, plantilla_flujo, nodo_inicio, user):
        """Transicion no puede conectar nodo consigo mismo."""
        from apps.infraestructura.workflow_engine.disenador_flujos.models import TransicionFlujo

        transicion = TransicionFlujo(
            empresa_id=empresa.pk,
            plantilla=plantilla_flujo,
            nodo_origen=nodo_inicio,
            nodo_destino=nodo_inicio,
            nombre='Ciclo',
            created_by=user
        )
        with pytest.raises(ValidationError):
            transicion.clean()

    def test_transicion_con_prioridad(self, empresa, plantilla_flujo, nodo_inicio, nodo_fin, user):
        """Transiciones con diferente prioridad."""
        from apps.infraestructura.workflow_engine.disenador_flujos.models import TransicionFlujo

        t1 = TransicionFlujo.objects.create(
            empresa_id=empresa.pk,
            plantilla=plantilla_flujo,
            nodo_origen=nodo_inicio,
            nodo_destino=nodo_fin,
            nombre='Baja prioridad',
            prioridad=0,
            created_by=user
        )
        t2 = TransicionFlujo.objects.create(
            empresa_id=empresa.pk,
            plantilla=plantilla_flujo,
            nodo_origen=nodo_inicio,
            nodo_destino=nodo_fin,
            nombre='Alta prioridad',
            prioridad=10,
            created_by=user
        )

        assert t2.prioridad > t1.prioridad
