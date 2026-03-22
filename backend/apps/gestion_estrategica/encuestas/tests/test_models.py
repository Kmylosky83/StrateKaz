"""
Tests para modelos de encuestas

Coverage:
- PreguntaContexto: creacion, perfiles PCI/POAM, unique codigo, str
- EncuestaDofa: creacion, estados, propiedades, metodos, str
- TemaEncuesta: creacion, propiedades de votos, str
- ParticipanteEncuesta: creacion, tipos, metodos de estado
- RespuestaEncuesta: creacion, clasificaciones, constraints, str
"""
import pytest
from django.db import IntegrityError
from django.utils import timezone
from datetime import timedelta


@pytest.mark.django_db
class TestPreguntaContexto:
    """Tests para el modelo PreguntaContexto."""

    def test_crear_pregunta_pci(self, pregunta_contexto_pci):
        """Crear pregunta PCI basica."""
        assert pregunta_contexto_pci.pk is not None
        assert pregunta_contexto_pci.perfil == 'pci'
        assert pregunta_contexto_pci.capacidad_pci == 'directiva'
        assert pregunta_contexto_pci.clasificacion_esperada == 'fd'
        assert pregunta_contexto_pci.es_sistema is True

    def test_crear_pregunta_poam(self, pregunta_contexto_poam):
        """Crear pregunta POAM basica."""
        assert pregunta_contexto_poam.perfil == 'poam'
        assert pregunta_contexto_poam.factor_poam == 'economico'
        assert pregunta_contexto_poam.clasificacion_esperada == 'oa'
        assert pregunta_contexto_poam.dimension_pestel == 'economico'

    def test_pregunta_str(self, pregunta_contexto_pci):
        """Representacion string de PreguntaContexto."""
        result = str(pregunta_contexto_pci)
        assert '[PCI-01]' in result
        assert 'estructura organizacional' in result

    def test_pregunta_codigo_unique(self, pregunta_contexto_pci):
        """Codigo de pregunta debe ser unico."""
        from apps.gestion_estrategica.encuestas.models import PreguntaContexto

        with pytest.raises(IntegrityError):
            PreguntaContexto.objects.create(
                codigo='PCI-01',
                texto='Pregunta duplicada',
                perfil='pci',
                clasificacion_esperada='fd',
                orden=2
            )

    def test_pregunta_capacidades_pci(self):
        """Validar todas las capacidades PCI."""
        from apps.gestion_estrategica.encuestas.models import PreguntaContexto

        capacidades = ['directiva', 'talento_humano', 'tecnologica', 'competitiva', 'financiera']
        for i, cap in enumerate(capacidades):
            pregunta = PreguntaContexto.objects.create(
                codigo=f'PCI-CAP-{i}',
                texto=f'Pregunta capacidad {cap}',
                perfil='pci',
                capacidad_pci=cap,
                clasificacion_esperada='fd',
                orden=i + 10
            )
            assert pregunta.capacidad_pci == cap

    def test_pregunta_factores_poam(self):
        """Validar todos los factores POAM."""
        from apps.gestion_estrategica.encuestas.models import PreguntaContexto

        factores = ['economico', 'politico', 'social', 'tecnologico', 'geografico']
        for i, factor in enumerate(factores):
            pregunta = PreguntaContexto.objects.create(
                codigo=f'POAM-FAC-{i}',
                texto=f'Pregunta factor {factor}',
                perfil='poam',
                factor_poam=factor,
                clasificacion_esperada='oa',
                orden=i + 20
            )
            assert pregunta.factor_poam == factor

    def test_pregunta_personalizada(self):
        """Pregunta personalizada (no del sistema)."""
        from apps.gestion_estrategica.encuestas.models import PreguntaContexto

        pregunta = PreguntaContexto.objects.create(
            codigo='CUSTOM-01',
            texto='Pregunta personalizada por la empresa',
            perfil='pci',
            capacidad_pci='directiva',
            clasificacion_esperada='fd',
            es_sistema=False,
            orden=100
        )
        assert pregunta.es_sistema is False

    def test_pregunta_ordering(self, pregunta_contexto_pci, pregunta_contexto_poam):
        """Preguntas ordenadas por perfil, orden."""
        from apps.gestion_estrategica.encuestas.models import PreguntaContexto

        preguntas = list(PreguntaContexto.objects.all())
        # PCI viene antes que POAM alfabeticamente
        assert preguntas[0].perfil == 'pci'


@pytest.mark.django_db
class TestEncuestaDofa:
    """Tests para el modelo EncuestaDofa."""

    def test_crear_encuesta_basica(self, encuesta_dofa):
        """Crear encuesta DOFA basica."""
        assert encuesta_dofa.pk is not None
        assert encuesta_dofa.tipo_encuesta == 'libre'
        assert encuesta_dofa.estado == 'activa'
        assert encuesta_dofa.token_publico is not None
        assert encuesta_dofa.es_publica is False
        assert encuesta_dofa.requiere_justificacion is True

    def test_encuesta_str(self, encuesta_dofa):
        """Representacion string de EncuestaDofa."""
        result = str(encuesta_dofa)
        assert 'Encuesta de Diagnostico 2025' in result
        assert 'Activa' in result

    def test_encuesta_tipos(self, empresa, analisis_dofa, user):
        """Validar tipos de encuesta."""
        from apps.gestion_estrategica.encuestas.models import EncuestaDofa

        for tipo in ['libre', 'pci_poam']:
            encuesta = EncuestaDofa.objects.create(
                empresa=empresa,
                tipo_encuesta=tipo,
                analisis_dofa=analisis_dofa,
                titulo=f'Encuesta {tipo}',
                fecha_inicio=timezone.now(),
                fecha_cierre=timezone.now() + timedelta(days=30),
                estado='borrador',
                responsable=user,
                created_by=user
            )
            assert encuesta.tipo_encuesta == tipo

    def test_encuesta_todos_los_estados(self, empresa, analisis_dofa, user):
        """Validar todos los estados de encuesta."""
        from apps.gestion_estrategica.encuestas.models import EncuestaDofa

        estados = ['borrador', 'activa', 'cerrada', 'procesada', 'cancelada']
        for i, estado in enumerate(estados):
            encuesta = EncuestaDofa.objects.create(
                empresa=empresa,
                tipo_encuesta='libre',
                analisis_dofa=analisis_dofa,
                titulo=f'Encuesta Estado {estado}',
                fecha_inicio=timezone.now(),
                fecha_cierre=timezone.now() + timedelta(days=30),
                estado=estado,
                responsable=user,
                created_by=user
            )
            assert encuesta.estado == estado

    def test_encuesta_esta_vigente(self, encuesta_dofa):
        """Encuesta activa y dentro de fechas esta vigente."""
        assert encuesta_dofa.esta_vigente is True

    def test_encuesta_no_vigente_cerrada(self, empresa, analisis_dofa, user):
        """Encuesta cerrada no esta vigente."""
        from apps.gestion_estrategica.encuestas.models import EncuestaDofa

        encuesta = EncuestaDofa.objects.create(
            empresa=empresa,
            tipo_encuesta='libre',
            analisis_dofa=analisis_dofa,
            titulo='Encuesta Cerrada',
            fecha_inicio=timezone.now() - timedelta(days=30),
            fecha_cierre=timezone.now() + timedelta(days=30),
            estado='cerrada',
            responsable=user,
            created_by=user
        )
        assert encuesta.esta_vigente is False

    def test_encuesta_porcentaje_participacion(self, encuesta_dofa):
        """Porcentaje de participacion calculado correctamente."""
        encuesta_dofa.total_invitados = 20
        encuesta_dofa.total_respondidos = 15
        encuesta_dofa.save()
        assert encuesta_dofa.porcentaje_participacion == 75.0

    def test_encuesta_porcentaje_participacion_sin_invitados(self, empresa, analisis_dofa, user):
        """Porcentaje es 0 sin invitados."""
        from apps.gestion_estrategica.encuestas.models import EncuestaDofa

        encuesta = EncuestaDofa.objects.create(
            empresa=empresa,
            tipo_encuesta='libre',
            analisis_dofa=analisis_dofa,
            titulo='Sin Invitados',
            fecha_inicio=timezone.now(),
            fecha_cierre=timezone.now() + timedelta(days=30),
            estado='borrador',
            total_invitados=0,
            responsable=user,
            created_by=user
        )
        assert encuesta.porcentaje_participacion == 0

    def test_encuesta_enlace_publico(self, encuesta_dofa):
        """Enlace publico contiene token."""
        enlace = encuesta_dofa.enlace_publico
        assert '/encuestas/responder/' in enlace
        assert str(encuesta_dofa.token_publico) in enlace

    def test_encuesta_token_publico_unico(self, encuesta_dofa, empresa, analisis_dofa, user):
        """Cada encuesta tiene token unico."""
        from apps.gestion_estrategica.encuestas.models import EncuestaDofa

        encuesta2 = EncuestaDofa.objects.create(
            empresa=empresa,
            tipo_encuesta='libre',
            analisis_dofa=analisis_dofa,
            titulo='Segunda Encuesta',
            fecha_inicio=timezone.now(),
            fecha_cierre=timezone.now() + timedelta(days=30),
            estado='borrador',
            responsable=user,
            created_by=user
        )
        assert encuesta_dofa.token_publico != encuesta2.token_publico

    def test_encuesta_activar(self, encuesta_dofa_borrador):
        """Metodo activar cambia estado a activa."""
        encuesta_dofa_borrador.activar()
        encuesta_dofa_borrador.refresh_from_db()
        assert encuesta_dofa_borrador.estado == 'activa'

    def test_encuesta_cerrar(self, encuesta_dofa):
        """Metodo cerrar cambia estado a cerrada."""
        encuesta_dofa.cerrar()
        encuesta_dofa.refresh_from_db()
        assert encuesta_dofa.estado == 'cerrada'


@pytest.mark.django_db
class TestTemaEncuesta:
    """Tests para el modelo TemaEncuesta."""

    def test_crear_tema_basico(self, tema_encuesta):
        """Crear tema de encuesta basico."""
        assert tema_encuesta.pk is not None
        assert tema_encuesta.titulo == 'Gestion del conocimiento organizacional'
        assert tema_encuesta.orden == 1

    def test_tema_str(self, tema_encuesta):
        """Representacion string de TemaEncuesta."""
        result = str(tema_encuesta)
        assert 'Encuesta de Diagnostico 2025' in result
        assert 'Gestion del conocimiento' in result

    def test_tema_con_pregunta_contexto(self, empresa, encuesta_dofa, pregunta_contexto_pci, user):
        """Tema vinculado a pregunta estandar PCI-POAM."""
        from apps.gestion_estrategica.encuestas.models import TemaEncuesta

        tema = TemaEncuesta.objects.create(
            empresa=empresa,
            encuesta=encuesta_dofa,
            pregunta_contexto=pregunta_contexto_pci,
            titulo=pregunta_contexto_pci.texto,
            orden=2,
            created_by=user
        )
        assert tema.pregunta_contexto == pregunta_contexto_pci

    def test_tema_total_votos_sin_respuestas(self, tema_encuesta):
        """Sin respuestas, votos son 0."""
        assert tema_encuesta.total_votos_fortaleza == 0
        assert tema_encuesta.total_votos_debilidad == 0

    def test_tema_clasificacion_consenso_empate(self, tema_encuesta):
        """Clasificacion consenso es empate sin votos."""
        assert tema_encuesta.clasificacion_consenso == 'empate'

    def test_tema_clasificacion_consenso_fortaleza(self, tema_encuesta, user, admin_user):
        """Clasificacion consenso cuando mayoria es fortaleza."""
        from apps.gestion_estrategica.encuestas.models import RespuestaEncuesta

        RespuestaEncuesta.objects.create(
            tema=tema_encuesta,
            respondente=user,
            clasificacion='fortaleza',
            impacto_percibido='alto'
        )
        RespuestaEncuesta.objects.create(
            tema=tema_encuesta,
            respondente=admin_user,
            clasificacion='fortaleza',
            impacto_percibido='medio'
        )
        RespuestaEncuesta.objects.create(
            tema=tema_encuesta,
            token_anonimo='anon-123',
            clasificacion='debilidad',
            impacto_percibido='bajo'
        )

        assert tema_encuesta.clasificacion_consenso == 'fortaleza'
        assert tema_encuesta.total_votos_fortaleza == 2
        assert tema_encuesta.total_votos_debilidad == 1

    def test_tema_multiples_por_encuesta(self, empresa, encuesta_dofa, user):
        """Una encuesta puede tener multiples temas."""
        from apps.gestion_estrategica.encuestas.models import TemaEncuesta

        for i in range(5):
            TemaEncuesta.objects.create(
                empresa=empresa,
                encuesta=encuesta_dofa,
                titulo=f'Tema {i + 1}',
                orden=i + 1,
                created_by=user
            )

        assert encuesta_dofa.temas.count() == 5


@pytest.mark.django_db
class TestParticipanteEncuesta:
    """Tests para el modelo ParticipanteEncuesta."""

    def test_crear_participante_usuario(self, encuesta_dofa, user):
        """Crear participante tipo usuario."""
        from apps.gestion_estrategica.encuestas.models import ParticipanteEncuesta

        participante = ParticipanteEncuesta.objects.create(
            encuesta=encuesta_dofa,
            tipo='usuario',
            usuario=user,
            estado='pendiente'
        )

        assert participante.pk is not None
        assert participante.tipo == 'usuario'
        assert participante.estado == 'pendiente'

    def test_participante_str_con_usuario(self, encuesta_dofa, user):
        """Representacion string con usuario."""
        from apps.gestion_estrategica.encuestas.models import ParticipanteEncuesta

        participante = ParticipanteEncuesta.objects.create(
            encuesta=encuesta_dofa,
            tipo='usuario',
            usuario=user
        )
        result = str(participante)
        assert 'Encuesta de Diagnostico 2025' in result
        assert 'Test User' in result

    def test_participante_todos_los_estados(self, encuesta_dofa, user):
        """Validar todos los estados de participacion."""
        from apps.gestion_estrategica.encuestas.models import ParticipanteEncuesta

        estados = ['pendiente', 'notificado', 'en_progreso', 'completado']
        for i, estado in enumerate(estados):
            u = User.objects.create_user(
                username=f'part_estado_{i}',
                email=f'part{i}@test.com',
                password='testpass123',
                first_name='Part',
                last_name=f'Estado{i}'
            )
            participante = ParticipanteEncuesta.objects.create(
                encuesta=encuesta_dofa,
                tipo='usuario',
                usuario=u,
                estado=estado
            )
            assert participante.estado == estado

    def test_participante_marcar_notificado(self, encuesta_dofa, user):
        """Metodo marcar_notificado actualiza estado y fecha."""
        from apps.gestion_estrategica.encuestas.models import ParticipanteEncuesta

        participante = ParticipanteEncuesta.objects.create(
            encuesta=encuesta_dofa,
            tipo='usuario',
            usuario=user
        )
        participante.marcar_notificado()
        participante.refresh_from_db()

        assert participante.estado == 'notificado'
        assert participante.fecha_notificacion is not None

    def test_participante_marcar_completado(self, encuesta_dofa, user):
        """Metodo marcar_completado actualiza estado y fecha."""
        from apps.gestion_estrategica.encuestas.models import ParticipanteEncuesta

        participante = ParticipanteEncuesta.objects.create(
            encuesta=encuesta_dofa,
            tipo='usuario',
            usuario=user,
            estado='en_progreso'
        )
        participante.marcar_completado()
        participante.refresh_from_db()

        assert participante.estado == 'completado'
        assert participante.fecha_completado is not None


@pytest.mark.django_db
class TestRespuestaEncuesta:
    """Tests para el modelo RespuestaEncuesta."""

    def test_crear_respuesta_basica(self, respuesta_encuesta):
        """Crear respuesta de encuesta basica."""
        assert respuesta_encuesta.pk is not None
        assert respuesta_encuesta.clasificacion == 'fortaleza'
        assert respuesta_encuesta.impacto_percibido == 'alto'
        assert respuesta_encuesta.respondente is not None

    def test_respuesta_str(self, respuesta_encuesta):
        """Representacion string de RespuestaEncuesta."""
        result = str(respuesta_encuesta)
        assert 'Gestion del conocimiento' in result
        assert 'Test User' in result
        assert 'Fortaleza' in result

    def test_respuesta_todas_las_clasificaciones(self, tema_encuesta):
        """Validar todas las clasificaciones."""
        from apps.gestion_estrategica.encuestas.models import RespuestaEncuesta

        clasificaciones = ['fortaleza', 'debilidad', 'oportunidad', 'amenaza']
        for i, clasif in enumerate(clasificaciones):
            resp = RespuestaEncuesta.objects.create(
                tema=tema_encuesta,
                token_anonimo=f'anon-clasif-{i}',
                clasificacion=clasif,
                impacto_percibido='medio'
            )
            assert resp.clasificacion == clasif

    def test_respuesta_niveles_impacto(self, tema_encuesta):
        """Validar niveles de impacto."""
        from apps.gestion_estrategica.encuestas.models import RespuestaEncuesta

        niveles = ['alto', 'medio', 'bajo']
        for i, nivel in enumerate(niveles):
            resp = RespuestaEncuesta.objects.create(
                tema=tema_encuesta,
                token_anonimo=f'anon-imp-{i}',
                clasificacion='fortaleza',
                impacto_percibido=nivel
            )
            assert resp.impacto_percibido == nivel

    def test_respuesta_anonima(self, tema_encuesta):
        """Respuesta anonima con token."""
        from apps.gestion_estrategica.encuestas.models import RespuestaEncuesta

        resp = RespuestaEncuesta.objects.create(
            tema=tema_encuesta,
            respondente=None,
            token_anonimo='anon-token-abc123',
            clasificacion='debilidad',
            justificacion='Necesita mejorar',
            impacto_percibido='medio',
            ip_address='10.0.0.1'
        )
        assert resp.respondente is None
        assert resp.token_anonimo == 'anon-token-abc123'

    def test_respuesta_str_anonima(self, tema_encuesta):
        """Representacion string de respuesta anonima."""
        from apps.gestion_estrategica.encuestas.models import RespuestaEncuesta

        resp = RespuestaEncuesta.objects.create(
            tema=tema_encuesta,
            token_anonimo='anon-str-test',
            clasificacion='fortaleza',
            impacto_percibido='alto'
        )
        result = str(resp)
        assert 'Anon' in result  # 'Anonimo' en __str__

    def test_respuesta_unique_usuario_por_tema(self, tema_encuesta, user):
        """Un usuario solo puede responder una vez por tema."""
        from apps.gestion_estrategica.encuestas.models import RespuestaEncuesta

        RespuestaEncuesta.objects.create(
            tema=tema_encuesta,
            respondente=user,
            clasificacion='fortaleza',
            impacto_percibido='alto'
        )

        with pytest.raises(IntegrityError):
            RespuestaEncuesta.objects.create(
                tema=tema_encuesta,
                respondente=user,
                clasificacion='debilidad',
                impacto_percibido='bajo'
            )

    def test_respuesta_unique_anonimo_por_tema(self, tema_encuesta):
        """Un anonimo (mismo token) solo puede responder una vez por tema."""
        from apps.gestion_estrategica.encuestas.models import RespuestaEncuesta

        RespuestaEncuesta.objects.create(
            tema=tema_encuesta,
            token_anonimo='unique-anon-test',
            clasificacion='fortaleza',
            impacto_percibido='alto'
        )

        with pytest.raises(IntegrityError):
            RespuestaEncuesta.objects.create(
                tema=tema_encuesta,
                token_anonimo='unique-anon-test',
                clasificacion='debilidad',
                impacto_percibido='bajo'
            )

    def test_respuesta_con_metadatos(self, tema_encuesta, user):
        """Respuesta con IP y user agent."""
        from apps.gestion_estrategica.encuestas.models import RespuestaEncuesta

        resp = RespuestaEncuesta.objects.create(
            tema=tema_encuesta,
            respondente=user,
            clasificacion='fortaleza',
            impacto_percibido='medio',
            ip_address='192.168.1.100',
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        )
        assert resp.ip_address == '192.168.1.100'
        assert 'Mozilla' in resp.user_agent

    def test_respuesta_ordering(self, tema_encuesta):
        """Respuestas ordenadas por fecha descendente."""
        from apps.gestion_estrategica.encuestas.models import RespuestaEncuesta

        r1 = RespuestaEncuesta.objects.create(
            tema=tema_encuesta,
            token_anonimo='order-1',
            clasificacion='fortaleza',
            impacto_percibido='alto'
        )
        r2 = RespuestaEncuesta.objects.create(
            tema=tema_encuesta,
            token_anonimo='order-2',
            clasificacion='debilidad',
            impacto_percibido='bajo'
        )

        respuestas = list(RespuestaEncuesta.objects.filter(tema=tema_encuesta))
        assert respuestas[0] == r2
        assert respuestas[1] == r1
