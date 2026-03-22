"""
Tests para modelos de ejecucion (workflow_engine)

Coverage:
- InstanciaFlujo: creacion, estados, prioridades, propiedades, validaciones, str
- TareaActiva: creacion, estados, tipos, vencimiento, propiedades, str
- HistorialTarea: creacion, acciones, str
"""
import pytest
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta


@pytest.mark.django_db
class TestInstanciaFlujo:
    """Tests para el modelo InstanciaFlujo."""

    def test_crear_instancia_basica(self, instancia_flujo):
        """Crear instancia de flujo con datos basicos."""
        assert instancia_flujo.pk is not None
        assert instancia_flujo.codigo_instancia == 'WF-SC-2025-0001'
        assert instancia_flujo.estado == 'INICIADO'
        assert instancia_flujo.prioridad == 'NORMAL'
        assert instancia_flujo.fecha_fin is None

    def test_instancia_str(self, instancia_flujo):
        """Representacion string de InstanciaFlujo."""
        result = str(instancia_flujo)
        assert 'WF-SC-2025-0001' in result
        assert 'Solicitud de Compra' in result

    def test_instancia_todos_los_estados(self, empresa, plantilla_flujo, nodo_inicio, user):
        """Validar todos los estados de instancia."""
        from apps.workflow_engine.ejecucion.models import InstanciaFlujo

        estados_sin_validacion = ['INICIADO', 'EN_PROCESO', 'PAUSADO']
        for i, estado in enumerate(estados_sin_validacion):
            inst = InstanciaFlujo.objects.create(
                codigo_instancia=f'WF-EST-{i}',
                titulo=f'Instancia Estado {estado}',
                plantilla=plantilla_flujo,
                nodo_actual=nodo_inicio,
                estado=estado,
                iniciado_por=user,
                empresa_id=empresa.pk,
                created_by=user
            )
            assert inst.estado == estado

    def test_instancia_prioridades(self, empresa, plantilla_flujo, nodo_inicio, user):
        """Validar todas las prioridades."""
        from apps.workflow_engine.ejecucion.models import InstanciaFlujo

        prioridades = ['BAJA', 'NORMAL', 'ALTA', 'URGENTE']
        for i, prio in enumerate(prioridades):
            inst = InstanciaFlujo.objects.create(
                codigo_instancia=f'WF-PRI-{i}',
                titulo=f'Instancia Prioridad {prio}',
                plantilla=plantilla_flujo,
                nodo_actual=nodo_inicio,
                estado='INICIADO',
                prioridad=prio,
                iniciado_por=user,
                empresa_id=empresa.pk,
                created_by=user
            )
            assert inst.prioridad == prio

    def test_instancia_data_contexto(self, instancia_flujo):
        """Data de contexto almacena JSON correctamente."""
        assert instancia_flujo.data_contexto['tipo'] == 'compra'
        assert instancia_flujo.data_contexto['monto'] == 500000

    def test_instancia_variables_flujo(self, empresa, plantilla_flujo, nodo_inicio, user):
        """Variables de flujo almacena JSON."""
        from apps.workflow_engine.ejecucion.models import InstanciaFlujo

        inst = InstanciaFlujo.objects.create(
            codigo_instancia='WF-VAR-001',
            titulo='Con Variables',
            plantilla=plantilla_flujo,
            nodo_actual=nodo_inicio,
            estado='INICIADO',
            variables_flujo={'contador': 0, 'aprobado': False},
            iniciado_por=user,
            empresa_id=empresa.pk,
            created_by=user
        )
        assert inst.variables_flujo['contador'] == 0
        assert inst.variables_flujo['aprobado'] is False

    def test_instancia_esta_vencida_sin_fecha_limite(self, instancia_flujo):
        """Instancia sin fecha limite no esta vencida."""
        assert instancia_flujo.esta_vencida is False

    def test_instancia_esta_vencida_true(self, empresa, plantilla_flujo, nodo_inicio, user):
        """Instancia con fecha limite pasada esta vencida."""
        from apps.workflow_engine.ejecucion.models import InstanciaFlujo

        inst = InstanciaFlujo.objects.create(
            codigo_instancia='WF-VENCIDA-001',
            titulo='Vencida',
            plantilla=plantilla_flujo,
            nodo_actual=nodo_inicio,
            estado='EN_PROCESO',
            fecha_limite=timezone.now() - timedelta(hours=1),
            iniciado_por=user,
            empresa_id=empresa.pk,
            created_by=user
        )
        assert inst.esta_vencida is True

    def test_instancia_progreso_sin_tareas(self, instancia_flujo):
        """Progreso es 0% sin tareas."""
        assert instancia_flujo.progreso_porcentaje == 0

    def test_instancia_cancelada_requiere_motivo(self, empresa, plantilla_flujo, nodo_inicio, user):
        """Instancia cancelada sin motivo lanza ValidationError."""
        from apps.workflow_engine.ejecucion.models import InstanciaFlujo

        with pytest.raises(ValidationError):
            InstanciaFlujo.objects.create(
                codigo_instancia='WF-CANC-001',
                titulo='Cancelada sin motivo',
                plantilla=plantilla_flujo,
                nodo_actual=nodo_inicio,
                estado='CANCELADO',
                motivo_cancelacion='',
                iniciado_por=user,
                empresa_id=empresa.pk,
                created_by=user
            )

    def test_instancia_completada_calcula_tiempo(self, empresa, plantilla_flujo, nodo_inicio, user):
        """Instancia completada calcula tiempo total."""
        from apps.workflow_engine.ejecucion.models import InstanciaFlujo

        inst = InstanciaFlujo.objects.create(
            codigo_instancia='WF-COMP-001',
            titulo='Completada',
            plantilla=plantilla_flujo,
            nodo_actual=nodo_inicio,
            estado='COMPLETADO',
            iniciado_por=user,
            empresa_id=empresa.pk,
            created_by=user
        )
        # fecha_fin se auto-asigna en clean() si COMPLETADO
        assert inst.fecha_fin is not None

    def test_instancia_entidad_relacionada(self, empresa, plantilla_flujo, nodo_inicio, user):
        """Entidad relacionada polimorficamente."""
        from apps.workflow_engine.ejecucion.models import InstanciaFlujo

        inst = InstanciaFlujo.objects.create(
            codigo_instancia='WF-ENT-001',
            titulo='Con Entidad',
            plantilla=plantilla_flujo,
            nodo_actual=nodo_inicio,
            estado='INICIADO',
            entidad_tipo='recepcion',
            entidad_id=42,
            iniciado_por=user,
            empresa_id=empresa.pk,
            created_by=user
        )
        assert inst.entidad_tipo == 'recepcion'
        assert inst.entidad_id == 42


@pytest.mark.django_db
class TestTareaActiva:
    """Tests para el modelo TareaActiva."""

    def test_crear_tarea_basica(self, tarea_activa):
        """Crear tarea activa con datos basicos."""
        assert tarea_activa.pk is not None
        assert tarea_activa.codigo_tarea == 'TK-2025-0001-001'
        assert tarea_activa.estado == 'PENDIENTE'
        assert tarea_activa.tipo_tarea == 'REVISION'

    def test_tarea_str(self, tarea_activa):
        """Representacion string de TareaActiva."""
        result = str(tarea_activa)
        assert 'TK-2025-0001-001' in result
        assert 'Revisar Solicitud' in result

    def test_tarea_tipos(self, empresa, instancia_flujo, nodo_inicio, user):
        """Validar todos los tipos de tarea."""
        from apps.workflow_engine.ejecucion.models import TareaActiva

        tipos = ['APROBACION', 'REVISION', 'FORMULARIO', 'NOTIFICACION', 'FIRMA', 'SISTEMA']
        for i, tipo in enumerate(tipos):
            tarea = TareaActiva.objects.create(
                instancia=instancia_flujo,
                nodo=nodo_inicio,
                codigo_tarea=f'TK-TIPO-{i}',
                nombre_tarea=f'Tarea {tipo}',
                tipo_tarea=tipo,
                estado='PENDIENTE',
                empresa_id=empresa.pk,
                created_by=user
            )
            assert tarea.tipo_tarea == tipo

    def test_tarea_estados(self, empresa, instancia_flujo, nodo_inicio, user):
        """Validar estados basicos de tarea (PENDIENTE, EN_PROGRESO)."""
        from apps.workflow_engine.ejecucion.models import TareaActiva

        for i, estado in enumerate(['PENDIENTE', 'EN_PROGRESO']):
            tarea = TareaActiva.objects.create(
                instancia=instancia_flujo,
                nodo=nodo_inicio,
                codigo_tarea=f'TK-EST-{i}',
                nombre_tarea=f'Tarea {estado}',
                estado=estado,
                empresa_id=empresa.pk,
                created_by=user
            )
            assert tarea.estado == estado

    def test_tarea_esta_vencida_false(self, tarea_activa):
        """Tarea con vencimiento futuro no esta vencida."""
        assert tarea_activa.esta_vencida is False

    def test_tarea_esta_vencida_true(self, empresa, instancia_flujo, nodo_inicio, user):
        """Tarea con vencimiento pasado esta vencida."""
        from apps.workflow_engine.ejecucion.models import TareaActiva

        tarea = TareaActiva.objects.create(
            instancia=instancia_flujo,
            nodo=nodo_inicio,
            codigo_tarea='TK-VENCIDA-001',
            nombre_tarea='Vencida',
            estado='PENDIENTE',
            fecha_vencimiento=timezone.now() - timedelta(hours=1),
            empresa_id=empresa.pk,
            created_by=user
        )
        assert tarea.esta_vencida is True

    def test_tarea_horas_restantes(self, tarea_activa):
        """Horas restantes calculadas correctamente."""
        horas = tarea_activa.horas_restantes
        assert horas is not None
        assert horas > 0

    def test_tarea_horas_restantes_sin_vencimiento(self, empresa, instancia_flujo, nodo_inicio, user):
        """Horas restantes es None sin fecha de vencimiento."""
        from apps.workflow_engine.ejecucion.models import TareaActiva

        tarea = TareaActiva.objects.create(
            instancia=instancia_flujo,
            nodo=nodo_inicio,
            codigo_tarea='TK-SINVENC-001',
            nombre_tarea='Sin vencimiento',
            estado='PENDIENTE',
            empresa_id=empresa.pk,
            created_by=user
        )
        assert tarea.horas_restantes is None

    def test_tarea_formulario_data(self, empresa, instancia_flujo, nodo_inicio, user):
        """Formulario data almacena JSON."""
        from apps.workflow_engine.ejecucion.models import TareaActiva

        tarea = TareaActiva.objects.create(
            instancia=instancia_flujo,
            nodo=nodo_inicio,
            codigo_tarea='TK-FORM-001',
            nombre_tarea='Con Formulario',
            estado='PENDIENTE',
            formulario_data={'campo1': 'valor1', 'monto': 100000},
            empresa_id=empresa.pk,
            created_by=user
        )
        assert tarea.formulario_data['campo1'] == 'valor1'

    def test_tarea_rechazada_requiere_motivo(self, empresa, instancia_flujo, nodo_inicio, user):
        """Tarea rechazada sin motivo lanza ValidationError."""
        from apps.workflow_engine.ejecucion.models import TareaActiva

        with pytest.raises(ValidationError):
            TareaActiva.objects.create(
                instancia=instancia_flujo,
                nodo=nodo_inicio,
                codigo_tarea='TK-RECH-001',
                nombre_tarea='Rechazada',
                estado='RECHAZADA',
                motivo_rechazo='',
                empresa_id=empresa.pk,
                created_by=user
            )

    def test_tarea_escalada_requiere_escalada_a(self, empresa, instancia_flujo, nodo_inicio, user):
        """Tarea escalada sin escalada_a lanza ValidationError."""
        from apps.workflow_engine.ejecucion.models import TareaActiva

        with pytest.raises(ValidationError):
            TareaActiva.objects.create(
                instancia=instancia_flujo,
                nodo=nodo_inicio,
                codigo_tarea='TK-ESC-001',
                nombre_tarea='Escalada',
                estado='ESCALADA',
                empresa_id=empresa.pk,
                created_by=user
            )


@pytest.mark.django_db
class TestHistorialTarea:
    """Tests para el modelo HistorialTarea."""

    def test_crear_historial_creacion(self, empresa, instancia_flujo, tarea_activa, user):
        """Crear registro de historial de creacion."""
        from apps.workflow_engine.ejecucion.models import HistorialTarea

        historial = HistorialTarea.objects.create(
            tarea=tarea_activa,
            instancia=instancia_flujo,
            accion='CREACION',
            descripcion='Tarea creada automaticamente',
            estado_anterior='',
            estado_nuevo='PENDIENTE',
            usuario=user,
            empresa_id=empresa.pk,
            created_by=user
        )

        assert historial.pk is not None
        assert historial.accion == 'CREACION'
        assert historial.estado_nuevo == 'PENDIENTE'

    def test_historial_str(self, empresa, instancia_flujo, tarea_activa, user):
        """Representacion string de HistorialTarea."""
        from apps.workflow_engine.ejecucion.models import HistorialTarea

        historial = HistorialTarea.objects.create(
            tarea=tarea_activa,
            instancia=instancia_flujo,
            accion='ASIGNACION',
            descripcion='Tarea asignada',
            usuario=user,
            empresa_id=empresa.pk,
            created_by=user
        )
        result = str(historial)
        assert 'TK-2025-0001-001' in result
        assert 'Asignaci' in result

    def test_historial_todas_las_acciones(self, empresa, instancia_flujo, tarea_activa, user):
        """Validar todas las acciones de historial."""
        from apps.workflow_engine.ejecucion.models import HistorialTarea

        acciones = [
            'CREACION', 'ASIGNACION', 'REASIGNACION', 'INICIO',
            'COMPLETACION', 'RECHAZO', 'ESCALAMIENTO',
            'COMENTARIO', 'MODIFICACION', 'CANCELACION'
        ]
        for i, accion in enumerate(acciones):
            historial = HistorialTarea.objects.create(
                tarea=tarea_activa,
                instancia=instancia_flujo,
                accion=accion,
                descripcion=f'Accion {accion}',
                usuario=user,
                empresa_id=empresa.pk,
                created_by=user
            )
            assert historial.accion == accion

    def test_historial_con_asignados(self, empresa, instancia_flujo, tarea_activa, user, admin_user):
        """Historial con cambio de asignacion."""
        from apps.workflow_engine.ejecucion.models import HistorialTarea

        historial = HistorialTarea.objects.create(
            tarea=tarea_activa,
            instancia=instancia_flujo,
            accion='REASIGNACION',
            descripcion='Reasignado a admin',
            asignado_anterior=user,
            asignado_nuevo=admin_user,
            usuario=user,
            empresa_id=empresa.pk,
            created_by=user
        )
        assert historial.asignado_anterior == user
        assert historial.asignado_nuevo == admin_user

    def test_historial_datos_cambio_json(self, empresa, instancia_flujo, tarea_activa, user):
        """Datos del cambio almacena JSON."""
        from apps.workflow_engine.ejecucion.models import HistorialTarea

        historial = HistorialTarea.objects.create(
            tarea=tarea_activa,
            instancia=instancia_flujo,
            accion='MODIFICACION',
            descripcion='Campo formulario modificado',
            datos_cambio={'campo': 'monto', 'anterior': 500000, 'nuevo': 750000},
            usuario=user,
            empresa_id=empresa.pk,
            created_by=user
        )
        assert historial.datos_cambio['campo'] == 'monto'

    def test_historial_ordering(self, empresa, instancia_flujo, tarea_activa, user):
        """Historial ordenado por fecha descendente."""
        from apps.workflow_engine.ejecucion.models import HistorialTarea

        h1 = HistorialTarea.objects.create(
            tarea=tarea_activa,
            instancia=instancia_flujo,
            accion='CREACION',
            descripcion='Primero',
            usuario=user,
            empresa_id=empresa.pk,
            created_by=user
        )
        h2 = HistorialTarea.objects.create(
            tarea=tarea_activa,
            instancia=instancia_flujo,
            accion='INICIO',
            descripcion='Segundo',
            usuario=user,
            empresa_id=empresa.pk,
            created_by=user
        )

        historiales = list(HistorialTarea.objects.filter(tarea=tarea_activa))
        assert historiales[0] == h2
        assert historiales[1] == h1
