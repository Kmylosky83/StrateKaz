"""
Tests para modelos de tareas_recordatorios

Coverage: Tarea, Recordatorio, EventoCalendario, ComentarioTarea
Incluye: creacion, validaciones, metodos especiales, completar, filtros
"""
import pytest
from datetime import timedelta, time
from django.utils import timezone

from apps.audit_system.tareas_recordatorios.models import (
    Tarea, Recordatorio, EventoCalendario, ComentarioTarea
)


@pytest.mark.django_db
class TestTarea:
    """Tests para modelo Tarea."""

    def test_crear_tarea_basica(self, user, other_user):
        """Test: Crear tarea basica"""
        tarea = Tarea.objects.create(
            titulo='Tarea de prueba', descripcion='Descripcion',
            tipo='manual', asignado_a=user, creado_por=other_user,
            fecha_limite=timezone.now() + timedelta(days=5)
        )
        assert tarea.pk is not None
        assert tarea.estado == 'pendiente'
        assert tarea.prioridad == 'normal'
        assert tarea.porcentaje_avance == 0

    def test_tarea_tipos(self, user, other_user):
        """Test: Diferentes tipos de tarea"""
        tipos = ['manual', 'automatica', 'recurrente']
        for tipo in tipos:
            t = Tarea.objects.create(
                titulo=f'Tarea {tipo}', descripcion='D',
                tipo=tipo, asignado_a=user, creado_por=other_user,
                fecha_limite=timezone.now() + timedelta(days=1)
            )
            assert t.tipo == tipo

    def test_tarea_prioridades(self, user, other_user):
        """Test: Diferentes prioridades"""
        prioridades = ['baja', 'normal', 'alta', 'urgente']
        for prioridad in prioridades:
            t = Tarea.objects.create(
                titulo=f'Tarea {prioridad}', descripcion='D',
                tipo='manual', prioridad=prioridad,
                asignado_a=user, creado_por=other_user,
                fecha_limite=timezone.now() + timedelta(days=1)
            )
            assert t.prioridad == prioridad

    def test_tarea_estados(self, user, other_user):
        """Test: Diferentes estados"""
        estados = ['pendiente', 'en_progreso', 'completada', 'cancelada', 'vencida']
        for estado in estados:
            t = Tarea.objects.create(
                titulo=f'Tarea {estado}', descripcion='D',
                tipo='manual', estado=estado,
                asignado_a=user, creado_por=other_user,
                fecha_limite=timezone.now() + timedelta(days=1)
            )
            assert t.estado == estado

    def test_tarea_completar(self, tarea):
        """Test: Metodo completar"""
        assert tarea.estado == 'pendiente'
        assert tarea.fecha_completada is None
        assert tarea.porcentaje_avance == 0

        tarea.completar()

        assert tarea.estado == 'completada'
        assert tarea.fecha_completada is not None
        assert tarea.porcentaje_avance == 100

    def test_tarea_con_url(self, user, other_user):
        """Test: Tarea con URL relacionada"""
        tarea = Tarea.objects.create(
            titulo='Tarea', descripcion='D', tipo='manual',
            asignado_a=user, creado_por=other_user,
            fecha_limite=timezone.now() + timedelta(days=1),
            url_relacionada='/modulo/objeto/123'
        )
        assert tarea.url_relacionada == '/modulo/objeto/123'

    def test_tarea_con_content_type(self, user, other_user):
        """Test: Tarea vinculada a objeto via content_type"""
        from django.contrib.contenttypes.models import ContentType
        from apps.gestion_estrategica.configuracion.models import EmpresaConfig
        ct = ContentType.objects.get_for_model(EmpresaConfig)

        tarea = Tarea.objects.create(
            titulo='Tarea', descripcion='D', tipo='manual',
            asignado_a=user, creado_por=other_user,
            fecha_limite=timezone.now() + timedelta(days=1),
            content_type=ct, object_id='1'
        )
        assert tarea.content_type == ct
        assert tarea.object_id == '1'

    def test_tarea_str(self, tarea):
        """Test: String representation"""
        str_result = str(tarea)
        assert 'Revisar documentos SST' in str_result
        assert 'Test User' in str_result

    def test_tarea_porcentaje_avance(self, user, other_user):
        """Test: Porcentaje de avance"""
        tarea = Tarea.objects.create(
            titulo='Tarea', descripcion='D', tipo='manual',
            asignado_a=user, creado_por=other_user,
            fecha_limite=timezone.now() + timedelta(days=1),
            porcentaje_avance=50
        )
        assert tarea.porcentaje_avance == 50

    def test_filtrar_por_asignado(self, tarea, user, other_user):
        """Test: Filtrar por usuario asignado"""
        otra_tarea = Tarea.objects.create(
            titulo='Otra', descripcion='D', tipo='manual',
            asignado_a=other_user, creado_por=user,
            fecha_limite=timezone.now() + timedelta(days=1)
        )

        mis_tareas = Tarea.objects.filter(asignado_a=user)
        assert tarea in mis_tareas
        assert otra_tarea not in mis_tareas


@pytest.mark.django_db
class TestRecordatorio:
    """Tests para modelo Recordatorio."""

    def test_crear_recordatorio_basico(self, user):
        """Test: Crear recordatorio basico"""
        rec = Recordatorio.objects.create(
            titulo='Recordatorio', mensaje='Mensaje',
            usuario=user,
            fecha_recordatorio=timezone.now() + timedelta(days=1),
            repetir='una_vez'
        )
        assert rec.pk is not None
        assert rec.esta_activo is True

    def test_recordatorio_vinculado_tarea(self, tarea, user):
        """Test: Recordatorio vinculado a tarea"""
        rec = Recordatorio.objects.create(
            tarea=tarea, titulo='Rec', mensaje='M',
            usuario=user,
            fecha_recordatorio=timezone.now() + timedelta(days=1),
            repetir='una_vez'
        )
        assert rec.tarea == tarea

    def test_recordatorio_tipos_repeticion(self, user):
        """Test: Tipos de repeticion"""
        tipos = ['una_vez', 'diario', 'semanal', 'mensual']
        for tipo in tipos:
            r = Recordatorio.objects.create(
                titulo=f'Rec {tipo}', mensaje='M',
                usuario=user,
                fecha_recordatorio=timezone.now() + timedelta(days=1),
                repetir=tipo
            )
            assert r.repetir == tipo

    def test_recordatorio_diario_con_hora(self, user):
        """Test: Recordatorio diario con hora especifica"""
        rec = Recordatorio.objects.create(
            titulo='Rec diario', mensaje='M', usuario=user,
            fecha_recordatorio=timezone.now() + timedelta(days=1),
            repetir='diario', hora_repeticion=time(9, 30)
        )
        assert rec.hora_repeticion == time(9, 30)

    def test_recordatorio_semanal_con_dias(self, user):
        """Test: Recordatorio semanal con dias especificos"""
        rec = Recordatorio.objects.create(
            titulo='Rec semanal', mensaje='M', usuario=user,
            fecha_recordatorio=timezone.now() + timedelta(days=1),
            repetir='semanal',
            dias_repeticion=[1, 3, 5],  # Lun, Mier, Vier
            hora_repeticion=time(10, 0)
        )
        assert rec.dias_repeticion == [1, 3, 5]

    def test_recordatorio_str(self, recordatorio):
        """Test: String representation"""
        str_result = str(recordatorio)
        assert 'Recordatorio de tarea' in str_result
        assert 'Test User' in str_result

    def test_recordatorio_desactivado(self, user):
        """Test: Recordatorio desactivado"""
        rec = Recordatorio.objects.create(
            titulo='Rec', mensaje='M', usuario=user,
            fecha_recordatorio=timezone.now() + timedelta(days=1),
            repetir='una_vez', esta_activo=False
        )
        assert rec.esta_activo is False


@pytest.mark.django_db
class TestEventoCalendario:
    """Tests para modelo EventoCalendario."""

    def test_crear_evento_basico(self, user):
        """Test: Crear evento basico"""
        evento = EventoCalendario.objects.create(
            titulo='Reunion', tipo='reunion',
            fecha_inicio=timezone.now() + timedelta(days=1),
            fecha_fin=timezone.now() + timedelta(days=1, hours=1),
            creado_por=user
        )
        assert evento.pk is not None
        assert evento.todo_el_dia is False

    def test_evento_tipos(self, user):
        """Test: Diferentes tipos de evento"""
        tipos = ['reunion', 'capacitacion', 'auditoria', 'mantenimiento', 'otro']
        for tipo in tipos:
            e = EventoCalendario.objects.create(
                titulo=f'Evento {tipo}', tipo=tipo,
                fecha_inicio=timezone.now() + timedelta(days=1),
                fecha_fin=timezone.now() + timedelta(days=1, hours=1),
                creado_por=user
            )
            assert e.tipo == tipo

    def test_evento_todo_el_dia(self, user):
        """Test: Evento todo el dia"""
        evento = EventoCalendario.objects.create(
            titulo='Feriado', tipo='otro',
            fecha_inicio=timezone.now() + timedelta(days=1),
            fecha_fin=timezone.now() + timedelta(days=1),
            todo_el_dia=True, creado_por=user
        )
        assert evento.todo_el_dia is True

    def test_evento_con_ubicacion(self, user):
        """Test: Evento con ubicacion"""
        evento = EventoCalendario.objects.create(
            titulo='Reunion', tipo='reunion',
            fecha_inicio=timezone.now() + timedelta(days=1),
            fecha_fin=timezone.now() + timedelta(days=1, hours=1),
            ubicacion='Sala de conferencias', creado_por=user
        )
        assert evento.ubicacion == 'Sala de conferencias'

    def test_evento_con_url_reunion(self, user):
        """Test: Evento con URL de reunion virtual"""
        evento = EventoCalendario.objects.create(
            titulo='Reunion virtual', tipo='reunion',
            fecha_inicio=timezone.now() + timedelta(days=1),
            fecha_fin=timezone.now() + timedelta(days=1, hours=1),
            url_reunion='https://zoom.us/j/123456789',
            creado_por=user
        )
        assert evento.url_reunion == 'https://zoom.us/j/123456789'

    def test_evento_con_participantes(self, evento_calendario, user, other_user):
        """Test: Evento con participantes"""
        assert evento_calendario.participantes.count() == 2
        assert user in evento_calendario.participantes.all()
        assert other_user in evento_calendario.participantes.all()

    def test_evento_str(self, evento_calendario):
        """Test: String representation"""
        str_result = str(evento_calendario)
        assert 'Reunion de comite SST' in str_result

    def test_evento_recordar_antes(self, user):
        """Test: Evento con recordatorio previo"""
        evento = EventoCalendario.objects.create(
            titulo='Reunion', tipo='reunion',
            fecha_inicio=timezone.now() + timedelta(days=1),
            fecha_fin=timezone.now() + timedelta(days=1, hours=1),
            recordar_antes=15, creado_por=user
        )
        assert evento.recordar_antes == 15


@pytest.mark.django_db
class TestComentarioTarea:
    """Tests para modelo ComentarioTarea."""

    def test_crear_comentario_basico(self, tarea, user):
        """Test: Crear comentario basico"""
        com = ComentarioTarea.objects.create(
            tarea=tarea, usuario=user,
            mensaje='Este es un comentario'
        )
        assert com.pk is not None
        assert com.mensaje == 'Este es un comentario'

    def test_comentario_str(self, comentario_tarea):
        """Test: String representation"""
        str_result = str(comentario_tarea)
        assert 'Comentario en' in str_result
        assert 'Revisar documentos SST' in str_result
        assert 'Test User' in str_result

    def test_multiples_comentarios(self, tarea, user, other_user):
        """Test: Multiples comentarios en una tarea"""
        com1 = ComentarioTarea.objects.create(
            tarea=tarea, usuario=user, mensaje='Primer comentario'
        )
        com2 = ComentarioTarea.objects.create(
            tarea=tarea, usuario=other_user, mensaje='Segundo comentario'
        )

        comentarios = ComentarioTarea.objects.filter(tarea=tarea)
        assert comentarios.count() == 2
