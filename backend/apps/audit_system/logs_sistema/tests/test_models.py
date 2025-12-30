"""
Tests para modelos de logs_sistema

Coverage:
- ConfiguracionAuditoria: creacion, unique_together, validaciones, str
- LogAcceso: creacion, tipos de evento, validaciones
- LogCambio: creacion, tracking de cambios, referencias genericas
- LogConsulta: creacion, exportaciones, filtrado
"""
import pytest
from datetime import date
from django.db import IntegrityError
from django.contrib.contenttypes.models import ContentType

from apps.audit_system.logs_sistema.models import (
    ConfiguracionAuditoria,
    LogAcceso,
    LogCambio,
    LogConsulta
)


@pytest.mark.django_db
class TestConfiguracionAuditoria:
    """Tests para el modelo ConfiguracionAuditoria."""

    def test_crear_configuracion_basica(self, empresa, user):
        """
        Test: Crear configuracion de auditoria basica

        Given: Datos validos de configuracion
        When: Se crea la configuracion
        Then: Debe crearse correctamente con valores default
        """
        # Act
        config = ConfiguracionAuditoria.objects.create(
            empresa=empresa,
            modulo='hseq_management',
            modelo='AccionCorrectiva',
            created_by=user
        )

        # Assert
        assert config.pk is not None
        assert config.modulo == 'hseq_management'
        assert config.modelo == 'AccionCorrectiva'
        assert config.auditar_creacion is True
        assert config.auditar_modificacion is True
        assert config.auditar_eliminacion is True
        assert config.auditar_consulta is False
        assert config.dias_retencion == 365

    def test_crear_configuracion_completa(self, empresa, user):
        """
        Test: Crear configuracion con todos los campos

        Given: Datos completos de configuracion
        When: Se crea la configuracion
        Then: Debe almacenar todos los valores
        """
        # Act
        config = ConfiguracionAuditoria.objects.create(
            empresa=empresa,
            modulo='motor_cumplimiento',
            modelo='RequisitoLegal',
            auditar_creacion=True,
            auditar_modificacion=True,
            auditar_eliminacion=True,
            auditar_consulta=True,
            campos_sensibles=['password', 'token', 'api_key'],
            dias_retencion=180,
            is_active=True,
            created_by=user
        )

        # Assert
        assert config.auditar_consulta is True
        assert len(config.campos_sensibles) == 3
        assert 'password' in config.campos_sensibles
        assert config.dias_retencion == 180

    def test_configuracion_unique_together(self, configuracion_auditoria, user):
        """
        Test: Empresa, modulo y modelo deben ser unicos

        Given: Una configuracion existente
        When: Se intenta crear otra con mismos valores
        Then: Debe lanzar IntegrityError
        """
        # Act & Assert
        with pytest.raises(IntegrityError):
            ConfiguracionAuditoria.objects.create(
                empresa=configuracion_auditoria.empresa,
                modulo='hseq_management',
                modelo='AccionCorrectiva',
                created_by=user
            )

    def test_configuracion_campos_sensibles_vacio(self, empresa, user):
        """
        Test: campos_sensibles puede estar vacio

        Given: Configuracion sin campos sensibles
        When: Se crea la configuracion
        Then: Debe tener lista vacia
        """
        # Act
        config = ConfiguracionAuditoria.objects.create(
            empresa=empresa,
            modulo='analytics',
            modelo='Indicador',
            campos_sensibles=[],
            created_by=user
        )

        # Assert
        assert config.campos_sensibles == []

    def test_configuracion_str_representation(self, configuracion_auditoria):
        """
        Test: Representacion string de configuracion

        Given: Una configuracion existente
        When: Se convierte a string
        Then: Debe retornar 'modulo.modelo'
        """
        # Act
        str_result = str(configuracion_auditoria)

        # Assert
        assert str_result == 'hseq_management.AccionCorrectiva'

    def test_configuracion_dias_retencion_minimo(self, empresa, user):
        """
        Test: dias_retencion debe ser positivo

        Given: Valor positivo de retencion
        When: Se crea la configuracion
        Then: Debe aceptarlo
        """
        # Act
        config = ConfiguracionAuditoria.objects.create(
            empresa=empresa,
            modulo='core',
            modelo='User',
            dias_retencion=30,
            created_by=user
        )

        # Assert
        assert config.dias_retencion == 30

    def test_configuracion_modulo_index(self, configuracion_auditoria):
        """
        Test: Modulo debe tener indice de DB

        Given: Una configuracion
        When: Se consulta por modulo
        Then: Debe usar el indice eficientemente
        """
        # Act
        configs = ConfiguracionAuditoria.objects.filter(
            modulo='hseq_management'
        )

        # Assert
        assert configs.count() == 1
        assert configuracion_auditoria in configs


@pytest.mark.django_db
class TestLogAcceso:
    """Tests para el modelo LogAcceso."""

    def test_crear_log_acceso_login_exitoso(self, user):
        """
        Test: Crear log de acceso exitoso

        Given: Datos de login exitoso
        When: Se crea el log
        Then: Debe registrar correctamente
        """
        # Act
        log = LogAcceso.objects.create(
            usuario=user,
            tipo_evento='login',
            ip_address='192.168.1.100',
            user_agent='Mozilla/5.0',
            fue_exitoso=True
        )

        # Assert
        assert log.pk is not None
        assert log.usuario == user
        assert log.tipo_evento == 'login'
        assert log.fue_exitoso is True
        assert log.mensaje_error is None

    def test_crear_log_acceso_logout(self, user):
        """
        Test: Crear log de logout

        Given: Evento de logout
        When: Se crea el log
        Then: Debe registrar tipo correcto
        """
        # Act
        log = LogAcceso.objects.create(
            usuario=user,
            tipo_evento='logout',
            ip_address='192.168.1.100',
            user_agent='Mozilla/5.0',
            fue_exitoso=True
        )

        # Assert
        assert log.tipo_evento == 'logout'
        assert log.fue_exitoso is True

    def test_crear_log_acceso_fallido(self):
        """
        Test: Crear log de acceso fallido

        Given: Login fallido sin usuario
        When: Se crea el log
        Then: Debe permitir usuario null y guardar error
        """
        # Act
        log = LogAcceso.objects.create(
            usuario=None,
            tipo_evento='login_fallido',
            ip_address='192.168.1.200',
            user_agent='Mozilla/5.0',
            fue_exitoso=False,
            mensaje_error='Credenciales invalidas'
        )

        # Assert
        assert log.usuario is None
        assert log.fue_exitoso is False
        assert log.mensaje_error == 'Credenciales invalidas'

    def test_log_acceso_con_ubicacion(self, user):
        """
        Test: Log con informacion de ubicacion

        Given: Datos de geolocalizacion
        When: Se crea el log
        Then: Debe almacenar ubicacion
        """
        # Act
        log = LogAcceso.objects.create(
            usuario=user,
            tipo_evento='login',
            ip_address='192.168.1.100',
            user_agent='Mozilla/5.0',
            ubicacion='Bogota, Colombia',
            fue_exitoso=True
        )

        # Assert
        assert log.ubicacion == 'Bogota, Colombia'

    def test_log_acceso_con_dispositivo(self, user):
        """
        Test: Log con informacion de dispositivo

        Given: Datos de dispositivo y navegador
        When: Se crea el log
        Then: Debe almacenar info del dispositivo
        """
        # Act
        log = LogAcceso.objects.create(
            usuario=user,
            tipo_evento='login',
            ip_address='192.168.1.100',
            user_agent='Mozilla/5.0',
            dispositivo='mobile',
            navegador='Safari',
            fue_exitoso=True
        )

        # Assert
        assert log.dispositivo == 'mobile'
        assert log.navegador == 'Safari'

    def test_log_acceso_cambio_password(self, user):
        """
        Test: Log de cambio de contraseña

        Given: Evento de cambio de password
        When: Se crea el log
        Then: Debe registrar tipo correcto
        """
        # Act
        log = LogAcceso.objects.create(
            usuario=user,
            tipo_evento='cambio_password',
            ip_address='192.168.1.100',
            user_agent='Mozilla/5.0',
            fue_exitoso=True
        )

        # Assert
        assert log.tipo_evento == 'cambio_password'

    def test_log_acceso_sesion_expirada(self, user):
        """
        Test: Log de sesion expirada

        Given: Evento de sesion expirada
        When: Se crea el log
        Then: Debe registrar correctamente
        """
        # Act
        log = LogAcceso.objects.create(
            usuario=user,
            tipo_evento='sesion_expirada',
            ip_address='192.168.1.100',
            user_agent='Mozilla/5.0',
            fue_exitoso=True
        )

        # Assert
        assert log.tipo_evento == 'sesion_expirada'

    def test_log_acceso_str_representation(self, log_acceso):
        """
        Test: Representacion string de log acceso

        Given: Un log de acceso
        When: Se convierte a string
        Then: Debe incluir tipo, usuario y fecha
        """
        # Act
        str_result = str(log_acceso)

        # Assert
        assert 'login' in str_result
        assert 'Test User' in str_result

    def test_log_acceso_ordering(self, user):
        """
        Test: Logs ordenados por fecha descendente

        Given: Multiples logs
        When: Se consultan todos
        Then: Deben venir ordenados por fecha desc
        """
        # Arrange
        log1 = LogAcceso.objects.create(
            usuario=user,
            tipo_evento='login',
            ip_address='192.168.1.100',
            user_agent='Mozilla/5.0',
            fue_exitoso=True
        )
        log2 = LogAcceso.objects.create(
            usuario=user,
            tipo_evento='logout',
            ip_address='192.168.1.100',
            user_agent='Mozilla/5.0',
            fue_exitoso=True
        )

        # Act
        logs = LogAcceso.objects.all()

        # Assert
        assert logs[0] == log2
        assert logs[1] == log1

    def test_log_acceso_filtrar_por_usuario(self, user, admin_user):
        """
        Test: Filtrar logs por usuario

        Given: Logs de diferentes usuarios
        When: Se filtran por usuario
        Then: Debe retornar solo logs de ese usuario
        """
        # Arrange
        log_user = LogAcceso.objects.create(
            usuario=user,
            tipo_evento='login',
            ip_address='192.168.1.100',
            user_agent='Mozilla/5.0',
            fue_exitoso=True
        )
        log_admin = LogAcceso.objects.create(
            usuario=admin_user,
            tipo_evento='login',
            ip_address='192.168.1.200',
            user_agent='Mozilla/5.0',
            fue_exitoso=True
        )

        # Act
        logs_user = LogAcceso.objects.filter(usuario=user)

        # Assert
        assert logs_user.count() == 1
        assert log_user in logs_user
        assert log_admin not in logs_user


@pytest.mark.django_db
class TestLogCambio:
    """Tests para el modelo LogCambio."""

    def test_crear_log_cambio_crear(self, user):
        """
        Test: Log de creacion de objeto

        Given: Creacion de nuevo objeto
        When: Se crea el log
        Then: Debe registrar accion crear
        """
        # Arrange
        from apps.gestion_estrategica.configuracion.models import EmpresaConfig
        content_type = ContentType.objects.get_for_model(EmpresaConfig)

        # Act
        log = LogCambio.objects.create(
            usuario=user,
            content_type=content_type,
            object_id='1',
            object_repr='Nueva Empresa',
            accion='crear',
            cambios={
                'nombre': {'old': None, 'new': 'Nueva Empresa'}
            }
        )

        # Assert
        assert log.accion == 'crear'
        assert 'nombre' in log.cambios

    def test_crear_log_cambio_modificar(self, user):
        """
        Test: Log de modificacion de objeto

        Given: Modificacion de objeto existente
        When: Se crea el log
        Then: Debe registrar valores old y new
        """
        # Arrange
        from apps.gestion_estrategica.configuracion.models import EmpresaConfig
        content_type = ContentType.objects.get_for_model(EmpresaConfig)

        # Act
        log = LogCambio.objects.create(
            usuario=user,
            content_type=content_type,
            object_id='1',
            object_repr='Empresa Modificada',
            accion='modificar',
            cambios={
                'telefono': {
                    'old': '3001234567',
                    'new': '3009876543'
                },
                'email': {
                    'old': 'old@example.com',
                    'new': 'new@example.com'
                }
            }
        )

        # Assert
        assert log.accion == 'modificar'
        assert len(log.cambios) == 2
        assert log.cambios['telefono']['old'] == '3001234567'
        assert log.cambios['telefono']['new'] == '3009876543'

    def test_crear_log_cambio_eliminar(self, user):
        """
        Test: Log de eliminacion de objeto

        Given: Eliminacion de objeto
        When: Se crea el log
        Then: Debe registrar accion eliminar
        """
        # Arrange
        from apps.gestion_estrategica.configuracion.models import EmpresaConfig
        content_type = ContentType.objects.get_for_model(EmpresaConfig)

        # Act
        log = LogCambio.objects.create(
            usuario=user,
            content_type=content_type,
            object_id='1',
            object_repr='Empresa Eliminada',
            accion='eliminar',
            cambios={}
        )

        # Assert
        assert log.accion == 'eliminar'

    def test_log_cambio_con_ip(self, user):
        """
        Test: Log con direccion IP

        Given: Log con IP del cliente
        When: Se crea el log
        Then: Debe almacenar IP
        """
        # Arrange
        from apps.gestion_estrategica.configuracion.models import EmpresaConfig
        content_type = ContentType.objects.get_for_model(EmpresaConfig)

        # Act
        log = LogCambio.objects.create(
            usuario=user,
            content_type=content_type,
            object_id='1',
            object_repr='Empresa',
            accion='modificar',
            cambios={'nombre': {'old': 'A', 'new': 'B'}},
            ip_address='192.168.1.100'
        )

        # Assert
        assert log.ip_address == '192.168.1.100'

    def test_log_cambio_str_representation(self, log_cambio):
        """
        Test: Representacion string de log cambio

        Given: Un log de cambio
        When: Se convierte a string
        Then: Debe incluir accion y objeto
        """
        # Act
        str_result = str(log_cambio)

        # Assert
        assert 'modificar' in str_result
        assert 'Grasas y Huesos del Norte' in str_result

    def test_log_cambio_filtrar_por_content_type(self, user):
        """
        Test: Filtrar logs por tipo de contenido

        Given: Logs de diferentes modelos
        When: Se filtran por content_type
        Then: Debe retornar solo logs de ese modelo
        """
        # Arrange
        from apps.gestion_estrategica.configuracion.models import EmpresaConfig
        from django.contrib.auth import get_user_model
        User = get_user_model()

        ct_empresa = ContentType.objects.get_for_model(EmpresaConfig)
        ct_user = ContentType.objects.get_for_model(User)

        log1 = LogCambio.objects.create(
            usuario=user,
            content_type=ct_empresa,
            object_id='1',
            object_repr='Empresa',
            accion='modificar',
            cambios={}
        )
        log2 = LogCambio.objects.create(
            usuario=user,
            content_type=ct_user,
            object_id='1',
            object_repr='Usuario',
            accion='modificar',
            cambios={}
        )

        # Act
        logs_empresa = LogCambio.objects.filter(content_type=ct_empresa)

        # Assert
        assert logs_empresa.count() == 1
        assert log1 in logs_empresa
        assert log2 not in logs_empresa


@pytest.mark.django_db
class TestLogConsulta:
    """Tests para el modelo LogConsulta."""

    def test_crear_log_consulta_basica(self, user):
        """
        Test: Crear log de consulta basica

        Given: Consulta a endpoint
        When: Se crea el log
        Then: Debe registrar correctamente
        """
        # Act
        log = LogConsulta.objects.create(
            usuario=user,
            modulo='hseq_management',
            endpoint='/api/hseq/accidentes/',
            parametros={},
            registros_accedidos=10,
            fue_exportacion=False,
            ip_address='192.168.1.100'
        )

        # Assert
        assert log.pk is not None
        assert log.modulo == 'hseq_management'
        assert log.fue_exportacion is False

    def test_crear_log_consulta_con_parametros(self, user):
        """
        Test: Log de consulta con parametros

        Given: Consulta con filtros
        When: Se crea el log
        Then: Debe almacenar parametros
        """
        # Act
        log = LogConsulta.objects.create(
            usuario=user,
            modulo='motor_cumplimiento',
            endpoint='/api/cumplimiento/requisitos/',
            parametros={
                'estado': 'vigente',
                'fecha_desde': '2024-01-01',
                'area': 'SST'
            },
            registros_accedidos=25,
            fue_exportacion=False,
            ip_address='192.168.1.100'
        )

        # Assert
        assert len(log.parametros) == 3
        assert log.parametros['estado'] == 'vigente'

    def test_crear_log_consulta_exportacion_excel(self, user):
        """
        Test: Log de exportacion a Excel

        Given: Exportacion de datos a Excel
        When: Se crea el log
        Then: Debe marcar como exportacion
        """
        # Act
        log = LogConsulta.objects.create(
            usuario=user,
            modulo='analytics',
            endpoint='/api/analytics/indicadores/',
            parametros={'periodo': '2024'},
            registros_accedidos=100,
            fue_exportacion=True,
            formato_exportacion='excel',
            ip_address='192.168.1.100'
        )

        # Assert
        assert log.fue_exportacion is True
        assert log.formato_exportacion == 'excel'

    def test_crear_log_consulta_exportacion_pdf(self, user):
        """
        Test: Log de exportacion a PDF

        Given: Exportacion de datos a PDF
        When: Se crea el log
        Then: Debe registrar formato PDF
        """
        # Act
        log = LogConsulta.objects.create(
            usuario=user,
            modulo='hseq_management',
            endpoint='/api/hseq/reportes/',
            parametros={},
            registros_accedidos=50,
            fue_exportacion=True,
            formato_exportacion='pdf',
            ip_address='192.168.1.100'
        )

        # Assert
        assert log.formato_exportacion == 'pdf'

    def test_log_consulta_str_representation(self, log_consulta):
        """
        Test: Representacion string de log consulta

        Given: Un log de consulta
        When: Se convierte a string
        Then: Debe incluir modulo y usuario
        """
        # Act
        str_result = str(log_consulta)

        # Assert
        assert 'hseq_management' in str_result
        assert 'Test User' in str_result

    def test_log_consulta_filtrar_exportaciones(self, user):
        """
        Test: Filtrar solo exportaciones

        Given: Logs con y sin exportacion
        When: Se filtran exportaciones
        Then: Debe retornar solo exportaciones
        """
        # Arrange
        log_export = LogConsulta.objects.create(
            usuario=user,
            modulo='analytics',
            endpoint='/api/analytics/export/',
            parametros={},
            registros_accedidos=100,
            fue_exportacion=True,
            formato_exportacion='excel',
            ip_address='192.168.1.100'
        )
        log_normal = LogConsulta.objects.create(
            usuario=user,
            modulo='analytics',
            endpoint='/api/analytics/data/',
            parametros={},
            registros_accedidos=20,
            fue_exportacion=False,
            ip_address='192.168.1.100'
        )

        # Act
        exportaciones = LogConsulta.objects.filter(fue_exportacion=True)

        # Assert
        assert exportaciones.count() == 1
        assert log_export in exportaciones
        assert log_normal not in exportaciones

    def test_log_consulta_registros_accedidos_zero(self, user):
        """
        Test: Log con cero registros accedidos

        Given: Consulta que no retorna datos
        When: Se crea el log
        Then: Debe permitir cero registros
        """
        # Act
        log = LogConsulta.objects.create(
            usuario=user,
            modulo='supply_chain',
            endpoint='/api/supply/productos/',
            parametros={'categoria': 'inexistente'},
            registros_accedidos=0,
            fue_exportacion=False,
            ip_address='192.168.1.100'
        )

        # Assert
        assert log.registros_accedidos == 0
