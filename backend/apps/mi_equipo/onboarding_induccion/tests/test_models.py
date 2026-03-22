"""
Tests de modelos para Onboarding e Induccion - Mi Equipo.

Cobertura:
- ModuloInduccion: creacion, __str__, propiedades, defaults
- AsignacionPorCargo: creacion, __str__, unicidad
- ItemChecklist: creacion, __str__, defaults
- ChecklistIngreso: creacion, __str__, unicidad
- EjecucionIntegral: creacion, __str__, propiedades
- EntregaEPP: creacion, __str__, propiedades
- EntregaActivo: creacion, __str__, propiedades
- FirmaDocumento: creacion, __str__, defaults

Autor: Sistema de Gestion StrateKaz
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from django.db import IntegrityError


@pytest.mark.django_db
class TestModuloInduccionModel:
    """Tests para el modelo ModuloInduccion."""

    def test_crear_modulo(self, modulo_induccion):
        """Debe crear un modulo de induccion."""
        assert modulo_induccion.pk is not None
        assert modulo_induccion.nombre == 'Induccion General'

    def test_str_modulo(self, modulo_induccion):
        """__str__ debe incluir codigo y nombre."""
        result = str(modulo_induccion)
        assert 'IND-TEST-001' in result
        assert 'Induccion General' in result

    def test_esta_vigente_sin_fechas(self, modulo_induccion):
        """esta_vigente debe ser True si no tiene fechas de vigencia."""
        modulo_induccion.fecha_vigencia_desde = None
        modulo_induccion.fecha_vigencia_hasta = None
        assert modulo_induccion.esta_vigente is True

    def test_esta_vigente_false_fecha_futura(self, modulo_induccion):
        """esta_vigente debe ser False si fecha_vigencia_desde es futura."""
        modulo_induccion.fecha_vigencia_desde = date.today() + timedelta(days=30)
        assert modulo_induccion.esta_vigente is False

    def test_esta_vigente_false_fecha_pasada(self, modulo_induccion):
        """esta_vigente debe ser False si fecha_vigencia_hasta ya paso."""
        modulo_induccion.fecha_vigencia_hasta = date.today() - timedelta(days=1)
        assert modulo_induccion.esta_vigente is False

    def test_tipo_modulo_default(self, empresa, user):
        """tipo_modulo default debe ser induccion_general."""
        from apps.mi_equipo.onboarding_induccion.models import ModuloInduccion

        modulo = ModuloInduccion(
            empresa=empresa,
            codigo='IND-DEF',
            nombre='Test Default',
            created_by=user,
            updated_by=user,
        )
        assert modulo.tipo_modulo == 'induccion_general'

    def test_requiere_evaluacion_default_false(self, modulo_induccion):
        """requiere_evaluacion debe ser False por defecto."""
        assert modulo_induccion.requiere_evaluacion is False

    def test_nota_minima_default(self, modulo_induccion):
        """nota_minima_aprobacion debe ser 70.00 por defecto."""
        assert modulo_induccion.nota_minima_aprobacion == Decimal('70.00')

    def test_es_obligatorio_default_true(self, modulo_induccion):
        """es_obligatorio debe ser True por defecto."""
        assert modulo_induccion.es_obligatorio is True

    def test_soft_delete(self, modulo_induccion):
        """soft_delete() debe marcar is_active=False."""
        modulo_induccion.soft_delete()
        modulo_induccion.refresh_from_db()
        assert modulo_induccion.is_active is False

    def test_duracion_default(self, empresa, user):
        """duracion_minutos debe ser 30 por defecto."""
        from apps.mi_equipo.onboarding_induccion.models import ModuloInduccion

        modulo = ModuloInduccion(
            empresa=empresa,
            codigo='IND-DUR',
            nombre='Test Duracion',
            created_by=user,
            updated_by=user,
        )
        assert modulo.duracion_minutos == 30

    def test_preguntas_evaluacion_default_list(self, modulo_induccion):
        """preguntas_evaluacion debe inicializar como lista vacia."""
        assert modulo_induccion.preguntas_evaluacion == []


@pytest.mark.django_db
class TestAsignacionPorCargoModel:
    """Tests para el modelo AsignacionPorCargo."""

    def test_crear_asignacion(self, empresa, cargo, modulo_induccion, user):
        """Debe crear una asignacion modulo-cargo."""
        from apps.mi_equipo.onboarding_induccion.models import AsignacionPorCargo

        asignacion = AsignacionPorCargo.objects.create(
            empresa=empresa,
            cargo=cargo,
            modulo=modulo_induccion,
            es_obligatorio=True,
            dias_para_completar=30,
            created_by=user,
            updated_by=user,
        )
        assert asignacion.pk is not None

    def test_str_asignacion(self, empresa, cargo, modulo_induccion, user):
        """__str__ debe incluir cargo y nombre del modulo."""
        from apps.mi_equipo.onboarding_induccion.models import AsignacionPorCargo

        asignacion = AsignacionPorCargo.objects.create(
            empresa=empresa,
            cargo=cargo,
            modulo=modulo_induccion,
            created_by=user,
            updated_by=user,
        )
        result = str(asignacion)
        assert 'Analista' in result
        assert 'Induccion General' in result

    def test_unicidad_cargo_modulo(self, empresa, cargo, modulo_induccion, user):
        """No debe permitir duplicar asignacion cargo-modulo."""
        from apps.mi_equipo.onboarding_induccion.models import AsignacionPorCargo

        AsignacionPorCargo.objects.create(
            empresa=empresa,
            cargo=cargo,
            modulo=modulo_induccion,
            created_by=user,
            updated_by=user,
        )
        with pytest.raises(IntegrityError):
            AsignacionPorCargo.objects.create(
                empresa=empresa,
                cargo=cargo,
                modulo=modulo_induccion,
                created_by=user,
                updated_by=user,
            )

    def test_dias_default(self, empresa, cargo, modulo_induccion, user):
        """dias_para_completar debe ser 30 por defecto."""
        from apps.mi_equipo.onboarding_induccion.models import AsignacionPorCargo

        asignacion = AsignacionPorCargo(
            empresa=empresa,
            cargo=cargo,
            modulo=modulo_induccion,
            created_by=user,
            updated_by=user,
        )
        assert asignacion.dias_para_completar == 30


@pytest.mark.django_db
class TestItemChecklistModel:
    """Tests para el modelo ItemChecklist."""

    def test_crear_item(self, item_checklist):
        """Debe crear un item de checklist."""
        assert item_checklist.pk is not None
        assert item_checklist.categoria == 'documentos'

    def test_str_item(self, item_checklist):
        """__str__ debe incluir codigo y descripcion."""
        result = str(item_checklist)
        assert 'CHK-TEST-001' in result

    def test_aplica_a_todos_default(self, item_checklist):
        """aplica_a_todos debe ser True por defecto."""
        assert item_checklist.aplica_a_todos is True

    def test_requiere_adjunto_default_false(self, item_checklist):
        """requiere_adjunto debe ser False por defecto."""
        assert item_checklist.requiere_adjunto is False

    def test_soft_delete(self, item_checklist):
        """soft_delete() debe marcar is_active=False."""
        item_checklist.soft_delete()
        item_checklist.refresh_from_db()
        assert item_checklist.is_active is False


@pytest.mark.django_db
class TestChecklistIngresoModel:
    """Tests para el modelo ChecklistIngreso."""

    def test_crear_checklist_ingreso(self, empresa, colaborador, item_checklist, user):
        """Debe crear un registro de checklist de ingreso."""
        from apps.mi_equipo.onboarding_induccion.models import ChecklistIngreso

        checklist = ChecklistIngreso.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            item=item_checklist,
            estado='pendiente',
            created_by=user,
            updated_by=user,
        )
        assert checklist.pk is not None
        assert checklist.estado == 'pendiente'

    def test_str_checklist(self, empresa, colaborador, item_checklist, user):
        """__str__ debe incluir nombre del colaborador."""
        from apps.mi_equipo.onboarding_induccion.models import ChecklistIngreso

        checklist = ChecklistIngreso.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            item=item_checklist,
            created_by=user,
            updated_by=user,
        )
        result = str(checklist)
        assert 'Juan' in result

    def test_unicidad_colaborador_item(
        self, empresa, colaborador, item_checklist, user
    ):
        """No debe permitir duplicar colaborador-item."""
        from apps.mi_equipo.onboarding_induccion.models import ChecklistIngreso

        ChecklistIngreso.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            item=item_checklist,
            created_by=user,
            updated_by=user,
        )
        with pytest.raises(IntegrityError):
            ChecklistIngreso.objects.create(
                empresa=empresa,
                colaborador=colaborador,
                item=item_checklist,
                created_by=user,
                updated_by=user,
            )

    def test_estado_default_pendiente(self, empresa, colaborador, item_checklist, user):
        """El estado default debe ser 'pendiente'."""
        from apps.mi_equipo.onboarding_induccion.models import ChecklistIngreso

        checklist = ChecklistIngreso(
            empresa=empresa,
            colaborador=colaborador,
            item=item_checklist,
            created_by=user,
            updated_by=user,
        )
        assert checklist.estado == 'pendiente'


@pytest.mark.django_db
class TestEjecucionIntegralModel:
    """Tests para el modelo EjecucionIntegral."""

    def test_crear_ejecucion(self, empresa, colaborador, modulo_induccion, user):
        """Debe crear una ejecucion de induccion."""
        from apps.mi_equipo.onboarding_induccion.models import EjecucionIntegral

        ejecucion = EjecucionIntegral.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            modulo=modulo_induccion,
            fecha_limite=date.today() + timedelta(days=30),
            created_by=user,
            updated_by=user,
        )
        assert ejecucion.pk is not None
        assert ejecucion.estado == 'pendiente'

    def test_str_ejecucion(self, empresa, colaborador, modulo_induccion, user):
        """__str__ debe incluir nombre del colaborador y modulo."""
        from apps.mi_equipo.onboarding_induccion.models import EjecucionIntegral

        ejecucion = EjecucionIntegral.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            modulo=modulo_induccion,
            fecha_limite=date.today() + timedelta(days=30),
            created_by=user,
            updated_by=user,
        )
        result = str(ejecucion)
        assert 'Juan' in result
        assert 'Induccion General' in result

    def test_esta_vencido_true(self, empresa, colaborador, modulo_induccion, user):
        """esta_vencido debe ser True si la fecha limite ya paso."""
        from apps.mi_equipo.onboarding_induccion.models import EjecucionIntegral

        ejecucion = EjecucionIntegral.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            modulo=modulo_induccion,
            fecha_limite=date.today() - timedelta(days=1),
            created_by=user,
            updated_by=user,
        )
        assert ejecucion.esta_vencido is True

    def test_esta_vencido_false_completado(
        self, empresa, colaborador, modulo_induccion, user
    ):
        """esta_vencido debe ser False si esta completado."""
        from apps.mi_equipo.onboarding_induccion.models import EjecucionIntegral

        ejecucion = EjecucionIntegral.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            modulo=modulo_induccion,
            fecha_limite=date.today() - timedelta(days=1),
            estado='completado',
            created_by=user,
            updated_by=user,
        )
        assert ejecucion.esta_vencido is False

    def test_aprobo_sin_evaluacion(
        self, empresa, colaborador, modulo_induccion, user
    ):
        """aprobo debe ser True si no requiere evaluacion y esta completado."""
        from apps.mi_equipo.onboarding_induccion.models import EjecucionIntegral

        ejecucion = EjecucionIntegral.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            modulo=modulo_induccion,
            fecha_limite=date.today() + timedelta(days=30),
            estado='completado',
            created_by=user,
            updated_by=user,
        )
        assert ejecucion.aprobo is True

    def test_aprobo_con_evaluacion_aprobada(
        self, empresa, colaborador, modulo_induccion, user
    ):
        """aprobo debe ser True si nota >= nota_minima_aprobacion."""
        from apps.mi_equipo.onboarding_induccion.models import EjecucionIntegral

        modulo_induccion.requiere_evaluacion = True
        modulo_induccion.nota_minima_aprobacion = Decimal('70.00')
        modulo_induccion.save()

        ejecucion = EjecucionIntegral.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            modulo=modulo_induccion,
            fecha_limite=date.today() + timedelta(days=30),
            estado='completado',
            nota_obtenida=Decimal('85.00'),
            created_by=user,
            updated_by=user,
        )
        assert ejecucion.aprobo is True

    def test_aprobo_con_evaluacion_reprobada(
        self, empresa, colaborador, modulo_induccion, user
    ):
        """aprobo debe ser False si nota < nota_minima_aprobacion."""
        from apps.mi_equipo.onboarding_induccion.models import EjecucionIntegral

        modulo_induccion.requiere_evaluacion = True
        modulo_induccion.nota_minima_aprobacion = Decimal('70.00')
        modulo_induccion.save()

        ejecucion = EjecucionIntegral.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            modulo=modulo_induccion,
            fecha_limite=date.today() + timedelta(days=30),
            estado='completado',
            nota_obtenida=Decimal('50.00'),
            created_by=user,
            updated_by=user,
        )
        assert ejecucion.aprobo is False

    def test_progreso_default_cero(
        self, empresa, colaborador, modulo_induccion, user
    ):
        """progreso_porcentaje debe iniciar en 0."""
        from apps.mi_equipo.onboarding_induccion.models import EjecucionIntegral

        ejecucion = EjecucionIntegral.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            modulo=modulo_induccion,
            fecha_limite=date.today() + timedelta(days=30),
            created_by=user,
            updated_by=user,
        )
        assert ejecucion.progreso_porcentaje == Decimal('0.00')

    def test_unicidad_colaborador_modulo(
        self, empresa, colaborador, modulo_induccion, user
    ):
        """No debe permitir duplicar colaborador-modulo."""
        from apps.mi_equipo.onboarding_induccion.models import EjecucionIntegral

        EjecucionIntegral.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            modulo=modulo_induccion,
            fecha_limite=date.today() + timedelta(days=30),
            created_by=user,
            updated_by=user,
        )
        with pytest.raises(IntegrityError):
            EjecucionIntegral.objects.create(
                empresa=empresa,
                colaborador=colaborador,
                modulo=modulo_induccion,
                fecha_limite=date.today() + timedelta(days=60),
                created_by=user,
                updated_by=user,
            )


@pytest.mark.django_db
class TestEntregaEPPModel:
    """Tests para el modelo EntregaEPP."""

    def test_crear_entrega_epp(self, empresa, colaborador, user):
        """Debe crear un registro de entrega de EPP."""
        from apps.mi_equipo.onboarding_induccion.models import EntregaEPP

        epp = EntregaEPP.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            tipo_epp='casco',
            descripcion='Casco de seguridad blanco',
            fecha_entrega=date.today(),
            entregado_por=user,
            created_by=user,
            updated_by=user,
        )
        assert epp.pk is not None
        assert epp.cantidad == 1

    def test_str_entrega_epp(self, empresa, colaborador, user):
        """__str__ debe incluir nombre del colaborador y tipo."""
        from apps.mi_equipo.onboarding_induccion.models import EntregaEPP

        epp = EntregaEPP.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            tipo_epp='botas',
            descripcion='Botas punta de acero',
            fecha_entrega=date.today(),
            entregado_por=user,
            created_by=user,
            updated_by=user,
        )
        result = str(epp)
        assert 'Juan' in result

    def test_requiere_reposicion_true(self, empresa, colaborador, user):
        """requiere_reposicion debe ser True si fecha_vencimiento paso."""
        from apps.mi_equipo.onboarding_induccion.models import EntregaEPP

        epp = EntregaEPP.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            tipo_epp='guantes',
            descripcion='Guantes de nitrilo',
            fecha_entrega=date.today() - timedelta(days=90),
            fecha_vencimiento=date.today() - timedelta(days=1),
            entregado_por=user,
            created_by=user,
            updated_by=user,
        )
        assert epp.requiere_reposicion is True

    def test_requiere_reposicion_false_sin_fecha(self, empresa, colaborador, user):
        """requiere_reposicion debe ser False si no tiene fecha_vencimiento."""
        from apps.mi_equipo.onboarding_induccion.models import EntregaEPP

        epp = EntregaEPP.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            tipo_epp='gafas',
            descripcion='Gafas de proteccion',
            fecha_entrega=date.today(),
            entregado_por=user,
            created_by=user,
            updated_by=user,
        )
        assert epp.requiere_reposicion is False

    def test_recibido_conforme_default(self, empresa, colaborador, user):
        """recibido_conforme debe ser True por defecto."""
        from apps.mi_equipo.onboarding_induccion.models import EntregaEPP

        epp = EntregaEPP.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            tipo_epp='chaleco',
            descripcion='Chaleco reflectivo',
            fecha_entrega=date.today(),
            entregado_por=user,
            created_by=user,
            updated_by=user,
        )
        assert epp.recibido_conforme is True


@pytest.mark.django_db
class TestEntregaActivoModel:
    """Tests para el modelo EntregaActivo."""

    def test_crear_entrega_activo(self, empresa, colaborador, user):
        """Debe crear un registro de entrega de activo."""
        from apps.mi_equipo.onboarding_induccion.models import EntregaActivo

        activo = EntregaActivo.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            tipo_activo='computador',
            descripcion='Laptop Dell Latitude 5520',
            serial='SN12345',
            fecha_entrega=date.today(),
            entregado_por=user,
            created_by=user,
            updated_by=user,
        )
        assert activo.pk is not None
        assert activo.devuelto is False

    def test_str_entrega_activo(self, empresa, colaborador, user):
        """__str__ debe incluir nombre del colaborador y tipo."""
        from apps.mi_equipo.onboarding_induccion.models import EntregaActivo

        activo = EntregaActivo.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            tipo_activo='celular',
            descripcion='iPhone 15',
            fecha_entrega=date.today(),
            entregado_por=user,
            created_by=user,
            updated_by=user,
        )
        result = str(activo)
        assert 'Juan' in result

    def test_esta_pendiente_devolucion_retirado(
        self, empresa, colaborador_retirado, user
    ):
        """esta_pendiente_devolucion debe ser True para colaborador retirado."""
        from apps.mi_equipo.onboarding_induccion.models import EntregaActivo

        activo = EntregaActivo.objects.create(
            empresa=empresa,
            colaborador=colaborador_retirado,
            tipo_activo='llaves',
            descripcion='Juego de llaves oficina',
            fecha_entrega=date(2024, 1, 1),
            entregado_por=user,
            created_by=user,
            updated_by=user,
        )
        assert activo.esta_pendiente_devolucion is True

    def test_no_pendiente_si_devuelto(
        self, empresa, colaborador_retirado, user
    ):
        """esta_pendiente_devolucion debe ser False si ya fue devuelto."""
        from apps.mi_equipo.onboarding_induccion.models import EntregaActivo

        activo = EntregaActivo.objects.create(
            empresa=empresa,
            colaborador=colaborador_retirado,
            tipo_activo='carnet',
            descripcion='Carnet corporativo',
            fecha_entrega=date(2024, 1, 1),
            devuelto=True,
            fecha_devolucion=date(2025, 12, 31),
            entregado_por=user,
            created_by=user,
            updated_by=user,
        )
        assert activo.esta_pendiente_devolucion is False

    def test_estado_entrega_default_nuevo(self, empresa, colaborador, user):
        """estado_entrega debe ser 'nuevo' por defecto."""
        from apps.mi_equipo.onboarding_induccion.models import EntregaActivo

        activo = EntregaActivo(
            empresa=empresa,
            colaborador=colaborador,
            tipo_activo='herramienta',
            descripcion='Test',
            fecha_entrega=date.today(),
            entregado_por=user,
            created_by=user,
            updated_by=user,
        )
        assert activo.estado_entrega == 'nuevo'


@pytest.mark.django_db
class TestFirmaDocumentoModel:
    """Tests para el modelo FirmaDocumento."""

    def test_crear_firma_documento(self, empresa, colaborador, user):
        """Debe crear un registro de firma de documento."""
        from apps.mi_equipo.onboarding_induccion.models import FirmaDocumento

        firma = FirmaDocumento.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            tipo_documento='contrato',
            nombre_documento='Contrato de Trabajo',
            fecha_firma=date.today(),
            created_by=user,
            updated_by=user,
        )
        assert firma.pk is not None
        assert firma.firmado is False

    def test_str_firma(self, empresa, colaborador, user):
        """__str__ debe incluir nombre del colaborador y documento."""
        from apps.mi_equipo.onboarding_induccion.models import FirmaDocumento

        firma = FirmaDocumento.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            tipo_documento='politica_sst',
            nombre_documento='Politica SST',
            fecha_firma=date.today(),
            created_by=user,
            updated_by=user,
        )
        result = str(firma)
        assert 'Juan' in result
        assert 'Politica SST' in result

    def test_firmado_default_false(self, empresa, colaborador, user):
        """firmado debe ser False por defecto."""
        from apps.mi_equipo.onboarding_induccion.models import FirmaDocumento

        firma = FirmaDocumento(
            empresa=empresa,
            colaborador=colaborador,
            tipo_documento='reglamento_interno',
            nombre_documento='Reglamento',
            fecha_firma=date.today(),
            created_by=user,
            updated_by=user,
        )
        assert firma.firmado is False

    def test_metodo_firma_default_fisico(self, empresa, colaborador, user):
        """metodo_firma debe ser 'fisico' por defecto."""
        from apps.mi_equipo.onboarding_induccion.models import FirmaDocumento

        firma = FirmaDocumento(
            empresa=empresa,
            colaborador=colaborador,
            tipo_documento='acuerdo_confidencialidad',
            nombre_documento='NDA',
            fecha_firma=date.today(),
            created_by=user,
            updated_by=user,
        )
        assert firma.metodo_firma == 'fisico'

    def test_soft_delete(self, empresa, colaborador, user):
        """soft_delete() debe marcar is_active=False."""
        from apps.mi_equipo.onboarding_induccion.models import FirmaDocumento

        firma = FirmaDocumento.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            tipo_documento='politica_datos',
            nombre_documento='Politica Datos',
            fecha_firma=date.today(),
            created_by=user,
            updated_by=user,
        )
        firma.soft_delete()
        firma.refresh_from_db()
        assert firma.is_active is False
