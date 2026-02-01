"""
Tests para modelos de centro_notificaciones

Coverage:
- TipoNotificacion: creacion, unique codigo, validaciones, str
- Notificacion: creacion, marcar_leida, filtros, prioridades
- PreferenciaNotificacion: creacion, unique_together, horarios
- NotificacionMasiva: creacion, destinatarios, estadisticas
"""
import pytest
from datetime import time
from django.db import IntegrityError
from django.utils import timezone

from apps.audit_system.centro_notificaciones.models import (
    TipoNotificacion,
    Notificacion,
    PreferenciaNotificacion,
    NotificacionMasiva
)


@pytest.mark.django_db
class TestTipoNotificacion:
    """Tests para el modelo TipoNotificacion."""

    def test_crear_tipo_notificacion_basico(self, empresa, user):
        """Test: Crear tipo de notificacion basico"""
        tipo = TipoNotificacion.objects.create(
            empresa=empresa,
            codigo='TEST_NOTIF',
            nombre='Notificacion de Prueba',
            descripcion='Descripcion de prueba',
            categoria='sistema',
            plantilla_titulo='Titulo {variable}',
            plantilla_mensaje='Mensaje {variable}',
            created_by=user
        )

        assert tipo.pk is not None
        assert tipo.codigo == 'TEST_NOTIF'
        assert tipo.categoria == 'sistema'
        assert tipo.color == 'blue'

    def test_tipo_notificacion_con_todas_opciones(self, empresa, user):
        """Test: Tipo con todas las opciones configuradas"""
        tipo = TipoNotificacion.objects.create(
            empresa=empresa,
            codigo='FULL_CONFIG',
            nombre='Config Completa',
            descripcion='Tipo con todas las opciones',
            icono='bell',
            color='green',
            categoria='aprobacion',
            plantilla_titulo='Titulo',
            plantilla_mensaje='Mensaje',
            url_template='/modulo/{id}',
            es_email=True,
            es_push=True,
            created_by=user
        )

        assert tipo.es_email is True
        assert tipo.es_push is True
        assert tipo.icono == 'bell'
        assert tipo.url_template == '/modulo/{id}'

    def test_tipo_notificacion_codigo_unico(self, tipo_notificacion, empresa, user):
        """Test: Codigo debe ser unico"""
        with pytest.raises(IntegrityError):
            TipoNotificacion.objects.create(
                empresa=empresa,
                codigo='TAREA_ASIGNADA',  # Duplicado
                nombre='Otro Nombre',
                descripcion='Otra desc',
                categoria='tarea',
                plantilla_titulo='T',
                plantilla_mensaje='M',
                created_by=user
            )

    def test_tipo_notificacion_str_representation(self, tipo_notificacion):
        """Test: Representacion string"""
        str_result = str(tipo_notificacion)
        assert 'Tarea Asignada' in str_result
        assert 'tarea' in str_result

    def test_tipo_notificacion_categorias(self, empresa, user):
        """Test: Todas las categorias disponibles"""
        categorias = ['sistema', 'tarea', 'alerta', 'recordatorio', 'aprobacion']

        for categoria in categorias:
            tipo = TipoNotificacion.objects.create(
                empresa=empresa,
                codigo=f'CAT_{categoria.upper()}',
                nombre=f'Tipo {categoria}',
                descripcion='Desc',
                categoria=categoria,
                plantilla_titulo='T',
                plantilla_mensaje='M',
                created_by=user
            )
            assert tipo.categoria == categoria


@pytest.mark.django_db
class TestNotificacion:
    """Tests para el modelo Notificacion."""

    def test_crear_notificacion_basica(self, tipo_notificacion, user):
        """Test: Crear notificacion basica"""
        notif = Notificacion.objects.create(
            tipo=tipo_notificacion,
            usuario=user,
            titulo='Titulo de prueba',
            mensaje='Mensaje de prueba'
        )

        assert notif.pk is not None
        assert notif.esta_leida is False
        assert notif.esta_archivada is False
        assert notif.prioridad == 'normal'

    def test_notificacion_con_url(self, tipo_notificacion, user):
        """Test: Notificacion con URL"""
        notif = Notificacion.objects.create(
            tipo=tipo_notificacion,
            usuario=user,
            titulo='Titulo',
            mensaje='Mensaje',
            url='/tareas/123'
        )

        assert notif.url == '/tareas/123'

    def test_notificacion_con_datos_extra(self, tipo_notificacion, user):
        """Test: Notificacion con datos extra en JSON"""
        notif = Notificacion.objects.create(
            tipo=tipo_notificacion,
            usuario=user,
            titulo='Titulo',
            mensaje='Mensaje',
            datos_extra={'key1': 'value1', 'key2': 123}
        )

        assert len(notif.datos_extra) == 2
        assert notif.datos_extra['key1'] == 'value1'
        assert notif.datos_extra['key2'] == 123

    def test_notificacion_prioridades(self, tipo_notificacion, user):
        """Test: Diferentes niveles de prioridad"""
        prioridades = ['baja', 'normal', 'alta', 'urgente']

        for prioridad in prioridades:
            notif = Notificacion.objects.create(
                tipo=tipo_notificacion,
                usuario=user,
                titulo=f'Notif {prioridad}',
                mensaje='Mensaje',
                prioridad=prioridad
            )
            assert notif.prioridad == prioridad

    def test_marcar_leida(self, notificacion):
        """Test: Metodo marcar_leida"""
        assert notificacion.esta_leida is False
        assert notificacion.fecha_lectura is None

        notificacion.marcar_leida()

        assert notificacion.esta_leida is True
        assert notificacion.fecha_lectura is not None

    def test_marcar_leida_idempotente(self, notificacion):
        """Test: Marcar leida es idempotente"""
        notificacion.marcar_leida()
        primera_fecha = notificacion.fecha_lectura

        notificacion.marcar_leida()
        segunda_fecha = notificacion.fecha_lectura

        assert primera_fecha == segunda_fecha

    def test_notificacion_str_representation(self, notificacion):
        """Test: Representacion string"""
        str_result = str(notificacion)
        assert 'Nueva tarea' in str_result
        assert 'Test User' in str_result

    def test_notificacion_archivada(self, tipo_notificacion, user):
        """Test: Notificacion archivada"""
        notif = Notificacion.objects.create(
            tipo=tipo_notificacion,
            usuario=user,
            titulo='Titulo',
            mensaje='Mensaje',
            esta_archivada=True
        )

        assert notif.esta_archivada is True

    def test_filtrar_no_leidas(self, notificacion, notificacion_leida, user):
        """Test: Filtrar notificaciones no leidas"""
        no_leidas = Notificacion.objects.filter(usuario=user, esta_leida=False)

        assert notificacion in no_leidas
        assert notificacion_leida not in no_leidas

    def test_filtrar_por_prioridad_alta(self, tipo_notificacion, user):
        """Test: Filtrar por prioridad alta"""
        notif_alta = Notificacion.objects.create(
            tipo=tipo_notificacion,
            usuario=user,
            titulo='Alta',
            mensaje='M',
            prioridad='alta'
        )
        notif_baja = Notificacion.objects.create(
            tipo=tipo_notificacion,
            usuario=user,
            titulo='Baja',
            mensaje='M',
            prioridad='baja'
        )

        altas = Notificacion.objects.filter(usuario=user, prioridad='alta')

        assert notif_alta in altas
        assert notif_baja not in altas


@pytest.mark.django_db
class TestPreferenciaNotificacion:
    """Tests para el modelo PreferenciaNotificacion."""

    def test_crear_preferencia_basica(self, empresa, user, tipo_notificacion):
        """Test: Crear preferencia basica"""
        pref = PreferenciaNotificacion.objects.create(
            empresa=empresa,
            usuario=user,
            tipo_notificacion=tipo_notificacion,
            created_by=user
        )

        assert pref.pk is not None
        assert pref.recibir_app is True
        assert pref.recibir_email is True
        assert pref.recibir_push is False

    def test_preferencia_con_horarios(self, empresa, user, tipo_notificacion):
        """Test: Preferencia con horarios"""
        pref = PreferenciaNotificacion.objects.create(
            empresa=empresa,
            usuario=user,
            tipo_notificacion=tipo_notificacion,
            horario_inicio=time(9, 0),
            horario_fin=time(17, 0),
            created_by=user
        )

        assert pref.horario_inicio == time(9, 0)
        assert pref.horario_fin == time(17, 0)

    def test_preferencia_desactivar_email(self, empresa, user, tipo_notificacion):
        """Test: Desactivar email en preferencia"""
        pref = PreferenciaNotificacion.objects.create(
            empresa=empresa,
            usuario=user,
            tipo_notificacion=tipo_notificacion,
            recibir_email=False,
            created_by=user
        )

        assert pref.recibir_email is False

    def test_preferencia_activar_push(self, empresa, user, tipo_notificacion):
        """Test: Activar notificaciones push"""
        pref = PreferenciaNotificacion.objects.create(
            empresa=empresa,
            usuario=user,
            tipo_notificacion=tipo_notificacion,
            recibir_push=True,
            created_by=user
        )

        assert pref.recibir_push is True

    def test_preferencia_str_representation(self, empresa, user, tipo_notificacion):
        """Test: Representacion string"""
        pref = PreferenciaNotificacion.objects.create(
            empresa=empresa,
            usuario=user,
            tipo_notificacion=tipo_notificacion,
            created_by=user
        )

        str_result = str(pref)
        assert 'Test User' in str_result
        assert 'Tarea Asignada' in str_result


@pytest.mark.django_db
class TestNotificacionMasiva:
    """Tests para el modelo NotificacionMasiva."""

    def test_crear_notificacion_masiva(self, tipo_notificacion, admin_user):
        """Test: Crear notificacion masiva"""
        notif = NotificacionMasiva.objects.create(
            tipo=tipo_notificacion,
            titulo='Titulo masivo',
            mensaje='Mensaje masivo',
            destinatarios_tipo='todos',
            enviada_por=admin_user
        )

        assert notif.pk is not None
        assert notif.total_enviadas == 0
        assert notif.total_leidas == 0

    def test_notificacion_masiva_por_rol(self, tipo_notificacion, admin_user, cargo):
        """Test: Notificacion masiva por rol"""
        notif = NotificacionMasiva.objects.create(
            tipo=tipo_notificacion,
            titulo='Titulo',
            mensaje='Mensaje',
            destinatarios_tipo='rol',
            enviada_por=admin_user
        )
        notif.roles.add(cargo)

        assert notif.destinatarios_tipo == 'rol'
        assert notif.roles.count() == 1

    def test_notificacion_masiva_por_area(self, tipo_notificacion, admin_user, area):
        """Test: Notificacion masiva por area"""
        notif = NotificacionMasiva.objects.create(
            tipo=tipo_notificacion,
            titulo='Titulo',
            mensaje='Mensaje',
            destinatarios_tipo='area',
            enviada_por=admin_user
        )
        notif.areas.add(area)

        assert notif.destinatarios_tipo == 'area'
        assert notif.areas.count() == 1

    def test_notificacion_masiva_usuarios_especificos(self, tipo_notificacion, admin_user, user, other_user):
        """Test: Notificacion a usuarios especificos"""
        notif = NotificacionMasiva.objects.create(
            tipo=tipo_notificacion,
            titulo='Titulo',
            mensaje='Mensaje',
            destinatarios_tipo='usuarios_especificos',
            enviada_por=admin_user
        )
        notif.usuarios.add(user, other_user)

        assert notif.destinatarios_tipo == 'usuarios_especificos'
        assert notif.usuarios.count() == 2

    def test_notificacion_masiva_estadisticas(self, tipo_notificacion, admin_user):
        """Test: Actualizar estadisticas"""
        notif = NotificacionMasiva.objects.create(
            tipo=tipo_notificacion,
            titulo='Titulo',
            mensaje='Mensaje',
            destinatarios_tipo='todos',
            total_enviadas=100,
            total_leidas=25,
            enviada_por=admin_user
        )

        assert notif.total_enviadas == 100
        assert notif.total_leidas == 25

    def test_notificacion_masiva_str_representation(self, notificacion_masiva):
        """Test: Representacion string"""
        str_result = str(notificacion_masiva)
        assert 'Mantenimiento del sistema' in str_result
        assert 'todos' in str_result
