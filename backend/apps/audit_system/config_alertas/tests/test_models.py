"""
Tests para modelos de config_alertas

Coverage: TipoAlerta, ConfiguracionAlerta, AlertaGenerada, EscalamientoAlerta
Incluye: creacion, validaciones, metodos, filtros, str representation
"""
import pytest
from datetime import timedelta
from django.db import IntegrityError
from django.utils import timezone

from apps.audit_system.config_alertas.models import (
    TipoAlerta, ConfiguracionAlerta, AlertaGenerada, EscalamientoAlerta
)


@pytest.mark.django_db
class TestTipoAlerta:
    """Tests para TipoAlerta."""

    def test_crear_tipo_alerta_basico(self, empresa, user):
        """Test: Crear tipo alerta basico"""
        tipo = TipoAlerta.objects.create(
            empresa=empresa, codigo='TEST', nombre='Test Alerta',
            descripcion='Desc', categoria='evento', modulo_origen='test',
            created_by=user
        )
        assert tipo.pk is not None
        assert tipo.severidad_default == 'warning'

    def test_tipo_alerta_codigo_unico(self, tipo_alerta, empresa, user):
        """Test: Codigo debe ser unico"""
        with pytest.raises(IntegrityError):
            TipoAlerta.objects.create(
                empresa=empresa, codigo='VENC_LICENCIA', nombre='Otro',
                descripcion='D', categoria='evento', modulo_origen='test',
                created_by=user
            )

    def test_tipo_alerta_categorias(self, empresa, user):
        """Test: Diferentes categorias"""
        cats = ['vencimiento', 'umbral', 'evento', 'inactividad', 'cumplimiento']
        for cat in cats:
            t = TipoAlerta.objects.create(
                empresa=empresa, codigo=f'CAT_{cat}', nombre=cat,
                descripcion='D', categoria=cat, modulo_origen='test',
                created_by=user
            )
            assert t.categoria == cat

    def test_tipo_alerta_severidades(self, empresa, user):
        """Test: Diferentes severidades default"""
        sevs = ['info', 'warning', 'danger', 'critical']
        for sev in sevs:
            t = TipoAlerta.objects.create(
                empresa=empresa, codigo=f'SEV_{sev}', nombre=sev,
                descripcion='D', categoria='evento', modulo_origen='test',
                severidad_default=sev, created_by=user
            )
            assert t.severidad_default == sev

    def test_tipo_alerta_str(self, tipo_alerta):
        """Test: String representation"""
        assert 'Vencimiento de Licencia' in str(tipo_alerta)
        assert 'vencimiento' in str(tipo_alerta)


@pytest.mark.django_db
class TestConfiguracionAlerta:
    """Tests para ConfiguracionAlerta."""

    def test_crear_configuracion_basica(self, tipo_alerta, empresa, user):
        """Test: Crear configuracion basica"""
        config = ConfiguracionAlerta.objects.create(
            empresa=empresa, tipo_alerta=tipo_alerta,
            nombre='Config Test', condicion={'test': True},
            frecuencia_verificacion='diario', notificar_a='responsable',
            created_by=user
        )
        assert config.pk is not None
        assert config.crear_tarea is False
        assert config.enviar_email is True

    def test_configuracion_con_dias_anticipacion(self, tipo_alerta, empresa, user):
        """Test: Configuracion con dias anticipacion"""
        config = ConfiguracionAlerta.objects.create(
            empresa=empresa, tipo_alerta=tipo_alerta, nombre='Test',
            condicion={}, frecuencia_verificacion='diario',
            notificar_a='responsable', dias_anticipacion=15,
            created_by=user
        )
        assert config.dias_anticipacion == 15

    def test_configuracion_frecuencias(self, tipo_alerta, empresa, user):
        """Test: Diferentes frecuencias"""
        freqs = ['cada_hora', 'diario', 'semanal']
        for freq in freqs:
            c = ConfiguracionAlerta.objects.create(
                empresa=empresa, tipo_alerta=tipo_alerta,
                nombre=f'Config {freq}', condicion={},
                frecuencia_verificacion=freq, notificar_a='responsable',
                created_by=user
            )
            assert c.frecuencia_verificacion == freq

    def test_configuracion_notificar_opciones(self, tipo_alerta, empresa, user):
        """Test: Diferentes opciones de notificar_a"""
        opts = ['responsable', 'jefe', 'area', 'rol_especifico', 'usuarios_especificos']
        for opt in opts:
            c = ConfiguracionAlerta.objects.create(
                empresa=empresa, tipo_alerta=tipo_alerta,
                nombre=f'Config {opt}', condicion={},
                frecuencia_verificacion='diario', notificar_a=opt,
                created_by=user
            )
            assert c.notificar_a == opt

    def test_configuracion_con_roles(self, configuracion_alerta, cargo):
        """Test: Configuracion con roles"""
        configuracion_alerta.roles.add(cargo)
        assert configuracion_alerta.roles.count() == 1

    def test_configuracion_con_usuarios(self, configuracion_alerta, user):
        """Test: Configuracion con usuarios"""
        configuracion_alerta.usuarios.add(user)
        assert configuracion_alerta.usuarios.count() == 1

    def test_configuracion_crear_tarea(self, tipo_alerta, empresa, user):
        """Test: Configuracion que crea tarea"""
        config = ConfiguracionAlerta.objects.create(
            empresa=empresa, tipo_alerta=tipo_alerta, nombre='Test',
            condicion={}, frecuencia_verificacion='diario',
            notificar_a='responsable', crear_tarea=True,
            created_by=user
        )
        assert config.crear_tarea is True

    def test_configuracion_str(self, configuracion_alerta):
        """Test: String representation"""
        assert 'Alertar 30 dias antes' in str(configuracion_alerta)


@pytest.mark.django_db
class TestAlertaGenerada:
    """Tests para AlertaGenerada."""

    def test_crear_alerta_basica(self, configuracion_alerta):
        """Test: Crear alerta basica"""
        alerta = AlertaGenerada.objects.create(
            configuracion=configuracion_alerta,
            titulo='Test Alerta', mensaje='Mensaje test',
            severidad='warning', esta_atendida=False
        )
        assert alerta.pk is not None
        assert alerta.esta_atendida is False

    def test_alerta_con_fecha_vencimiento(self, configuracion_alerta):
        """Test: Alerta con fecha vencimiento"""
        fecha = timezone.now() + timedelta(days=10)
        alerta = AlertaGenerada.objects.create(
            configuracion=configuracion_alerta, titulo='Test',
            mensaje='M', severidad='warning', fecha_vencimiento=fecha
        )
        assert alerta.fecha_vencimiento == fecha

    def test_alerta_con_content_type(self, configuracion_alerta):
        """Test: Alerta vinculada a objeto"""
        from django.contrib.contenttypes.models import ContentType
        from apps.gestion_estrategica.configuracion.models import EmpresaConfig
        ct = ContentType.objects.get_for_model(EmpresaConfig)

        alerta = AlertaGenerada.objects.create(
            configuracion=configuracion_alerta, titulo='Test',
            mensaje='M', severidad='warning', content_type=ct,
            object_id='1'
        )
        assert alerta.content_type == ct
        assert alerta.object_id == '1'

    def test_alerta_severidades(self, configuracion_alerta):
        """Test: Diferentes severidades"""
        sevs = ['info', 'warning', 'danger', 'critical']
        for sev in sevs:
            a = AlertaGenerada.objects.create(
                configuracion=configuracion_alerta,
                titulo=f'Alerta {sev}', mensaje='M', severidad=sev
            )
            assert a.severidad == sev

    def test_alerta_atender(self, alerta_generada, user):
        """Test: Atender alerta"""
        assert alerta_generada.esta_atendida is False

        alerta_generada.esta_atendida = True
        alerta_generada.atendida_por = user
        alerta_generada.fecha_atencion = timezone.now()
        alerta_generada.accion_tomada = 'Accion realizada'
        alerta_generada.save()

        assert alerta_generada.esta_atendida is True
        assert alerta_generada.atendida_por == user

    def test_alerta_str(self, alerta_generada):
        """Test: String representation"""
        assert 'Licencia proximo a vencer' in str(alerta_generada)
        assert 'warning' in str(alerta_generada)

    def test_filtrar_pendientes(self, alerta_generada, alerta_atendida):
        """Test: Filtrar alertas pendientes"""
        pendientes = AlertaGenerada.objects.filter(esta_atendida=False)
        assert alerta_generada in pendientes
        assert alerta_atendida not in pendientes


@pytest.mark.django_db
class TestEscalamientoAlerta:
    """Tests para EscalamientoAlerta."""

    def test_crear_escalamiento_basico(self, configuracion_alerta, empresa, user):
        """Test: Crear escalamiento basico"""
        esc = EscalamientoAlerta.objects.create(
            empresa=empresa, configuracion_alerta=configuracion_alerta,
            nivel=1, horas_espera=24, notificar_a='jefe_inmediato',
            mensaje_escalamiento='Mensaje', created_by=user
        )
        assert esc.pk is not None
        assert esc.nivel == 1

    def test_escalamiento_multiples_niveles(self, configuracion_alerta, empresa, user):
        """Test: Multiples niveles de escalamiento"""
        niveles = [
            (1, 24, 'jefe_inmediato'),
            (2, 48, 'gerente_area'),
            (3, 72, 'gerente_general')
        ]
        for nivel, horas, quien in niveles:
            e = EscalamientoAlerta.objects.create(
                empresa=empresa, configuracion_alerta=configuracion_alerta,
                nivel=nivel, horas_espera=horas, notificar_a=quien,
                mensaje_escalamiento='Msg', created_by=user
            )
            assert e.nivel == nivel
            assert e.horas_espera == horas

    def test_escalamiento_con_usuarios(self, escalamiento_alerta, user):
        """Test: Escalamiento con usuarios adicionales"""
        escalamiento_alerta.usuarios_adicionales.add(user)
        assert escalamiento_alerta.usuarios_adicionales.count() == 1

    def test_escalamiento_str(self, escalamiento_alerta):
        """Test: String representation"""
        str_result = str(escalamiento_alerta)
        assert 'Nivel 1' in str_result
        assert 'Alertar 30 dias' in str_result
