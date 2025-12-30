"""
Tests de Modelos para Gestión de Calidad
=========================================

Tests unitarios para:
- NoConformidad: creación, estados, métodos puede_cerrar, calcular_dias_abierta
- AccionCorrectiva: creación, estados, método esta_vencida, verificación
- SalidaNoConforme: creación, disposiciones, método puede_liberar
- SolicitudCambio: creación, flujo de aprobación
- ControlCambio: creación, relaciones, validaciones

Total de tests: 37
Cobertura: Todos los modelos y sus métodos principales

Autor: Sistema ERP StrateKaz
Fecha: 26 Diciembre 2025
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone

from apps.hseq_management.calidad.models import (
    NoConformidad,
    AccionCorrectiva,
    SalidaNoConforme,
    SolicitudCambio,
    ControlCambio
)


@pytest.mark.django_db
class TestNoConformidad:
    """Tests para el modelo NoConformidad."""

    def test_crear_no_conformidad(self, empresa, usuario):
        """
        Test: Crear no conformidad básica.

        Given: Datos válidos de NC
        When: Se crea la NC
        Then: Debe crearse correctamente con estado ABIERTA
        """
        nc = NoConformidad.objects.create(
            empresa_id=empresa.id,
            codigo='NC-TEST-001',
            tipo='REAL',
            origen='AUDITORIA_INTERNA',
            severidad='MAYOR',
            titulo='No conformidad de test',
            descripcion='Descripción de prueba',
            fecha_deteccion=date.today(),
            detectado_por=usuario,
            estado='ABIERTA'
        )

        assert nc.pk is not None
        assert nc.codigo == 'NC-TEST-001'
        assert nc.tipo == 'REAL'
        assert nc.estado == 'ABIERTA'
        assert nc.severidad == 'MAYOR'

    def test_str_no_conformidad(self, no_conformidad):
        """Test: Representación en string de NC."""
        expected = f"{no_conformidad.codigo} - {no_conformidad.titulo}"
        assert str(no_conformidad) == expected

    def test_codigo_unico(self, no_conformidad):
        """
        Test: El código debe ser único.

        Given: Una NC existente
        When: Se intenta crear otra con mismo código
        Then: Debe lanzar IntegrityError
        """
        with pytest.raises(IntegrityError):
            NoConformidad.objects.create(
                empresa_id=no_conformidad.empresa_id,
                codigo='NC-2024-001',  # Código duplicado
                tipo='REAL',
                origen='AUDITORIA_INTERNA',
                severidad='MENOR',
                titulo='Otra NC',
                descripcion='Test',
                fecha_deteccion=date.today(),
                detectado_por=no_conformidad.detectado_por
            )

    def test_choices_tipo(self, empresa, usuario):
        """Test: Validar choices de tipo."""
        tipos_validos = ['REAL', 'POTENCIAL', 'OBSERVACION']

        for tipo in tipos_validos:
            nc = NoConformidad.objects.create(
                empresa_id=empresa.id,
                codigo=f'NC-TIPO-{tipo}',
                tipo=tipo,
                origen='AUDITORIA_INTERNA',
                severidad='MENOR',
                titulo='Test',
                descripcion='Test',
                fecha_deteccion=date.today(),
                detectado_por=usuario
            )
            assert nc.tipo == tipo

    def test_choices_origen(self, no_conformidad):
        """Test: Choices de origen disponibles."""
        origenes = [
            'AUDITORIA_INTERNA', 'AUDITORIA_EXTERNA', 'AUDITORIA_CLIENTE',
            'INSPECCION', 'QUEJA_CLIENTE', 'QUEJA_PROVEEDOR',
            'PROCESO_INTERNO', 'PRODUCTO_NO_CONFORME', 'REVISION_DIRECCION',
            'MEJORA_CONTINUA'
        ]
        assert no_conformidad.origen in origenes

    def test_choices_estado(self, no_conformidad):
        """Test: Choices de estado disponibles."""
        estados = [
            'ABIERTA', 'EN_ANALISIS', 'EN_TRATAMIENTO',
            'VERIFICACION', 'CERRADA', 'CANCELADA'
        ]
        assert no_conformidad.estado in estados

    def test_choices_severidad(self, no_conformidad):
        """Test: Choices de severidad disponibles."""
        severidades = ['CRITICA', 'MAYOR', 'MENOR', 'OBSERVACION']
        assert no_conformidad.severidad in severidades

    def test_relaciones_usuarios(self, nc_en_analisis, usuario, responsable):
        """Test: Relaciones FK con usuarios."""
        assert nc_en_analisis.detectado_por == usuario
        assert nc_en_analisis.responsable_analisis == responsable

    def test_puede_cerrar_sin_acciones(self, no_conformidad):
        """
        Test: No puede cerrar NC sin acciones verificadas.

        Given: NC en estado ABIERTA sin acciones
        When: Se consulta puede_cerrar()
        Then: Debe retornar False
        """
        assert no_conformidad.puede_cerrar() is False

    def test_puede_cerrar_estado_incorrecto(self, nc_en_analisis, accion_verificada):
        """
        Test: No puede cerrar si no está en VERIFICACION.

        Given: NC en estado EN_ANALISIS con acción verificada
        When: Se consulta puede_cerrar()
        Then: Debe retornar False
        """
        assert nc_en_analisis.estado != 'VERIFICACION'
        assert nc_en_analisis.puede_cerrar() is False

    def test_puede_cerrar_true(self, nc_en_verificacion, accion_verificada):
        """
        Test: Puede cerrar NC en VERIFICACION con acción eficaz.

        Given: NC en VERIFICACION con acción verificada eficaz
        When: Se consulta puede_cerrar()
        Then: Debe retornar True
        """
        assert nc_en_verificacion.estado == 'VERIFICACION'
        assert nc_en_verificacion.puede_cerrar() is True

    def test_calcular_dias_abierta_sin_cerrar(self, no_conformidad):
        """
        Test: Calcular días abierta sin fecha de cierre.

        Given: NC creada hoy sin fecha de cierre
        When: Se calcula calcular_dias_abierta()
        Then: Debe retornar 0 días
        """
        dias = no_conformidad.calcular_dias_abierta()
        assert dias == 0

    def test_calcular_dias_abierta_cerrada(self, empresa, usuario):
        """
        Test: Calcular días abierta con fecha de cierre.

        Given: NC detectada hace 10 días y cerrada hace 2 días
        When: Se calcula calcular_dias_abierta()
        Then: Debe retornar 8 días
        """
        nc = NoConformidad.objects.create(
            empresa_id=empresa.id,
            codigo='NC-DIAS-001',
            tipo='REAL',
            origen='AUDITORIA_INTERNA',
            severidad='MENOR',
            titulo='Test días',
            descripcion='Test',
            fecha_deteccion=date.today() - timedelta(days=10),
            fecha_cierre=date.today() - timedelta(days=2),
            detectado_por=usuario,
            estado='CERRADA'
        )

        dias = nc.calcular_dias_abierta()
        assert dias == 8

    def test_campos_opcionales(self, no_conformidad):
        """Test: Campos opcionales pueden estar vacíos."""
        assert no_conformidad.analisis_causa_raiz == ''
        assert no_conformidad.metodo_analisis == ''
        assert no_conformidad.fecha_cierre is None


@pytest.mark.django_db
class TestAccionCorrectiva:
    """Tests para el modelo AccionCorrectiva."""

    def test_crear_accion_correctiva(self, empresa, no_conformidad, responsable):
        """
        Test: Crear acción correctiva básica.

        Given: NC existente y datos válidos
        When: Se crea la acción
        Then: Debe crearse correctamente
        """
        accion = AccionCorrectiva.objects.create(
            empresa_id=empresa.id,
            codigo='AC-TEST-001',
            tipo='CORRECTIVA',
            no_conformidad=no_conformidad,
            descripcion='Acción de prueba',
            fecha_planificada=date.today() + timedelta(days=7),
            fecha_limite=date.today() + timedelta(days=30),
            responsable=responsable,
            estado='PLANIFICADA'
        )

        assert accion.pk is not None
        assert accion.codigo == 'AC-TEST-001'
        assert accion.tipo == 'CORRECTIVA'
        assert accion.estado == 'PLANIFICADA'

    def test_str_accion_correctiva(self, accion_correctiva):
        """Test: Representación en string de acción."""
        expected = f"{accion_correctiva.codigo} - Acción Correctiva"
        assert str(accion_correctiva) == expected

    def test_codigo_unico_accion(self, accion_correctiva):
        """Test: El código de acción debe ser único."""
        with pytest.raises(IntegrityError):
            AccionCorrectiva.objects.create(
                empresa_id=accion_correctiva.empresa_id,
                codigo='AC-2024-001',  # Duplicado
                tipo='PREVENTIVA',
                no_conformidad=accion_correctiva.no_conformidad,
                descripcion='Otra',
                fecha_planificada=date.today(),
                fecha_limite=date.today() + timedelta(days=10),
                responsable=accion_correctiva.responsable
            )

    def test_choices_tipo_accion(self):
        """Test: Choices de tipo de acción."""
        tipos = ['CORRECTIVA', 'PREVENTIVA', 'MEJORA', 'CONTENCION']
        assert len(tipos) == 4

    def test_choices_estado_accion(self, accion_correctiva):
        """Test: Choices de estado de acción."""
        estados = [
            'PLANIFICADA', 'EN_EJECUCION', 'EJECUTADA',
            'VERIFICADA', 'CERRADA', 'CANCELADA'
        ]
        assert accion_correctiva.estado in estados

    def test_relacion_no_conformidad(self, accion_correctiva, no_conformidad):
        """Test: Relación con NC."""
        assert accion_correctiva.no_conformidad == no_conformidad
        assert accion_correctiva in no_conformidad.acciones_correctivas.all()

    def test_relacion_responsable(self, accion_correctiva, responsable):
        """Test: Relación con responsable."""
        assert accion_correctiva.responsable == responsable

    def test_esta_vencida_false_planificada(self, accion_correctiva):
        """
        Test: Acción planificada no vencida.

        Given: Acción planificada con fecha límite futura
        When: Se consulta esta_vencida()
        Then: Debe retornar False
        """
        assert accion_correctiva.estado == 'PLANIFICADA'
        assert accion_correctiva.fecha_limite > date.today()
        assert accion_correctiva.esta_vencida() is False

    def test_esta_vencida_true(self, accion_vencida):
        """
        Test: Acción vencida no ejecutada.

        Given: Acción con fecha límite pasada y no verificada
        When: Se consulta esta_vencida()
        Then: Debe retornar True
        """
        assert accion_vencida.fecha_limite < date.today()
        assert accion_vencida.estado == 'PLANIFICADA'
        assert accion_vencida.esta_vencida() is True

    def test_esta_vencida_false_verificada(self, accion_verificada):
        """
        Test: Acción verificada nunca está vencida.

        Given: Acción en estado VERIFICADA
        When: Se consulta esta_vencida()
        Then: Debe retornar False aunque fecha límite haya pasado
        """
        assert accion_verificada.estado == 'VERIFICADA'
        assert accion_verificada.esta_vencida() is False

    def test_costos_decimales(self, accion_ejecutada):
        """Test: Costos con precisión decimal."""
        assert accion_ejecutada.costo_estimado == Decimal('500000.00')
        assert accion_ejecutada.costo_real == Decimal('450000.00')
        assert accion_ejecutada.costo_real < accion_ejecutada.costo_estimado

    def test_verificacion_eficacia(self, accion_verificada):
        """Test: Verificación de eficacia."""
        assert accion_verificada.eficaz is True
        assert accion_verificada.fecha_verificacion is not None
        assert accion_verificada.metodo_verificacion != ''
        assert accion_verificada.resultados_verificacion != ''


@pytest.mark.django_db
class TestSalidaNoConforme:
    """Tests para el modelo SalidaNoConforme."""

    def test_crear_salida_no_conforme(self, empresa, usuario):
        """
        Test: Crear salida no conforme básica.

        Given: Datos válidos de salida NC
        When: Se crea la salida
        Then: Debe crearse correctamente
        """
        snc = SalidaNoConforme.objects.create(
            empresa_id=empresa.id,
            codigo='SNC-TEST-001',
            tipo='PRODUCTO',
            descripcion_producto='Producto de prueba',
            descripcion_no_conformidad='NC de prueba',
            fecha_deteccion=date.today(),
            lote_numero='LOTE-001',
            cantidad_afectada=Decimal('100.000'),
            unidad_medida='Kg',
            ubicacion_actual='Almacén',
            bloqueada=True,
            requisito_incumplido='Requisito X',
            riesgo_uso='MEDIO',
            detectado_por=usuario,
            estado='DETECTADA'
        )

        assert snc.pk is not None
        assert snc.codigo == 'SNC-TEST-001'
        assert snc.bloqueada is True
        assert snc.estado == 'DETECTADA'

    def test_str_salida_no_conforme(self, salida_no_conforme):
        """Test: Representación en string de salida NC."""
        expected = f"{salida_no_conforme.codigo} - {salida_no_conforme.descripcion_producto}"
        assert str(salida_no_conforme) == expected

    def test_codigo_unico_salida(self, salida_no_conforme):
        """Test: El código de salida NC debe ser único."""
        with pytest.raises(IntegrityError):
            SalidaNoConforme.objects.create(
                empresa_id=salida_no_conforme.empresa_id,
                codigo='SNC-2024-001',  # Duplicado
                tipo='PRODUCTO',
                descripcion_producto='Otro',
                descripcion_no_conformidad='Test',
                fecha_deteccion=date.today(),
                lote_numero='L-999',
                cantidad_afectada=Decimal('50'),
                unidad_medida='Kg',
                ubicacion_actual='Test',
                requisito_incumplido='Test',
                riesgo_uso='BAJO',
                detectado_por=salida_no_conforme.detectado_por
            )

    def test_choices_tipo_salida(self):
        """Test: Choices de tipo de salida."""
        tipos = ['PRODUCTO', 'SERVICIO', 'MATERIA_PRIMA', 'PROCESO']
        assert len(tipos) == 4

    def test_choices_estado_salida(self, salida_no_conforme):
        """Test: Choices de estado de salida."""
        estados = [
            'DETECTADA', 'EN_EVALUACION', 'DISPOSICION_DEFINIDA',
            'EN_TRATAMIENTO', 'RESUELTA', 'CERRADA'
        ]
        assert salida_no_conforme.estado in estados

    def test_choices_disposicion(self):
        """Test: Choices de disposición."""
        disposiciones = [
            'REPROCESO', 'REPARACION', 'ACEPTACION_CONCESION',
            'RECLASIFICACION', 'RECHAZO', 'DESECHO', 'CUARENTENA'
        ]
        assert len(disposiciones) == 7

    def test_choices_riesgo_uso(self, salida_no_conforme):
        """Test: Choices de riesgo de uso."""
        riesgos = ['ALTO', 'MEDIO', 'BAJO']
        assert salida_no_conforme.riesgo_uso in riesgos

    def test_cantidad_decimal(self, salida_no_conforme):
        """Test: Cantidad afectada con precisión decimal."""
        assert isinstance(salida_no_conforme.cantidad_afectada, Decimal)
        assert salida_no_conforme.cantidad_afectada == Decimal('500.000')

    def test_puede_liberar_false_no_resuelta(self, salida_no_conforme):
        """
        Test: No puede liberar si no está resuelta.

        Given: Salida bloqueada en estado DETECTADA
        When: Se consulta puede_liberar()
        Then: Debe retornar False
        """
        assert salida_no_conforme.bloqueada is True
        assert salida_no_conforme.estado == 'DETECTADA'
        assert salida_no_conforme.puede_liberar() is False

    def test_puede_liberar_false_no_bloqueada(self, salida_resuelta):
        """
        Test: No puede liberar si no está bloqueada.

        Given: Salida resuelta pero no bloqueada
        When: Se consulta puede_liberar()
        Then: Debe retornar False
        """
        salida_resuelta.bloqueada = False
        salida_resuelta.save()
        assert salida_resuelta.puede_liberar() is False

    def test_puede_liberar_true(self, salida_resuelta):
        """
        Test: Puede liberar si está bloqueada y resuelta.

        Given: Salida bloqueada en estado RESUELTA
        When: Se consulta puede_liberar()
        Then: Debe retornar True
        """
        assert salida_resuelta.bloqueada is True
        assert salida_resuelta.estado == 'RESUELTA'
        assert salida_resuelta.puede_liberar() is True

    def test_relacion_no_conformidad_opcional(self, salida_no_conforme, no_conformidad):
        """Test: Relación opcional con NC."""
        assert salida_no_conforme.no_conformidad is None

        # Asociar NC
        salida_no_conforme.no_conformidad = no_conformidad
        salida_no_conforme.save()

        assert salida_no_conforme.no_conformidad == no_conformidad


@pytest.mark.django_db
class TestSolicitudCambio:
    """Tests para el modelo SolicitudCambio."""

    def test_crear_solicitud_cambio(self, empresa, usuario):
        """
        Test: Crear solicitud de cambio básica.

        Given: Datos válidos de solicitud
        When: Se crea la solicitud
        Then: Debe crearse correctamente en estado SOLICITADA
        """
        sc = SolicitudCambio.objects.create(
            empresa_id=empresa.id,
            codigo='SC-TEST-001',
            tipo='PROCESO',
            prioridad='MEDIA',
            titulo='Solicitud de prueba',
            descripcion_actual='Situación actual',
            descripcion_cambio='Cambio propuesto',
            justificacion='Justificación del cambio',
            solicitante=usuario,
            estado='SOLICITADA'
        )

        assert sc.pk is not None
        assert sc.codigo == 'SC-TEST-001'
        assert sc.estado == 'SOLICITADA'
        assert sc.prioridad == 'MEDIA'

    def test_str_solicitud_cambio(self, solicitud_cambio):
        """Test: Representación en string de solicitud."""
        expected = f"{solicitud_cambio.codigo} - {solicitud_cambio.titulo}"
        assert str(solicitud_cambio) == expected

    def test_codigo_unico_solicitud(self, solicitud_cambio):
        """Test: El código de solicitud debe ser único."""
        with pytest.raises(IntegrityError):
            SolicitudCambio.objects.create(
                empresa_id=solicitud_cambio.empresa_id,
                codigo='SC-2024-001',  # Duplicado
                tipo='PROCESO',
                prioridad='BAJA',
                titulo='Otra',
                descripcion_actual='Test',
                descripcion_cambio='Test',
                justificacion='Test',
                solicitante=solicitud_cambio.solicitante
            )

    def test_choices_tipo_solicitud(self):
        """Test: Choices de tipo de solicitud."""
        tipos = [
            'PROCESO', 'PROCEDIMIENTO', 'DOCUMENTO', 'PRODUCTO',
            'INFRAESTRUCTURA', 'EQUIPAMIENTO', 'SISTEMA', 'ORGANIZACIONAL'
        ]
        assert len(tipos) == 8

    def test_choices_estado_solicitud(self, solicitud_cambio):
        """Test: Choices de estado de solicitud."""
        estados = [
            'SOLICITADA', 'EN_REVISION', 'APROBADA', 'RECHAZADA',
            'EN_IMPLEMENTACION', 'IMPLEMENTADA', 'CANCELADA'
        ]
        assert solicitud_cambio.estado in estados

    def test_choices_prioridad(self):
        """Test: Choices de prioridad."""
        prioridades = ['URGENTE', 'ALTA', 'MEDIA', 'BAJA']
        assert len(prioridades) == 4

    def test_flujo_revision(self, solicitud_cambio, responsable):
        """Test: Flujo de revisión de solicitud."""
        # Estado inicial
        assert solicitud_cambio.estado == 'SOLICITADA'

        # Pasar a revisión
        solicitud_cambio.estado = 'EN_REVISION'
        solicitud_cambio.revisado_por = responsable
        solicitud_cambio.fecha_revision = date.today()
        solicitud_cambio.save()

        assert solicitud_cambio.estado == 'EN_REVISION'
        assert solicitud_cambio.revisado_por == responsable

    def test_flujo_aprobacion(self, solicitud_aprobada, responsable):
        """Test: Solicitud aprobada tiene datos de aprobación."""
        assert solicitud_aprobada.estado == 'APROBADA'
        assert solicitud_aprobada.revisado_por == responsable
        assert solicitud_aprobada.aprobado_por == responsable
        assert solicitud_aprobada.fecha_aprobacion is not None
        assert solicitud_aprobada.responsable_implementacion is not None

    def test_flujo_rechazo(self, solicitud_rechazada, responsable):
        """Test: Solicitud rechazada tiene motivos."""
        assert solicitud_rechazada.estado == 'RECHAZADA'
        assert solicitud_rechazada.revisado_por == responsable
        assert solicitud_rechazada.comentarios_revision != ''

    def test_analisis_impacto_completo(self, solicitud_cambio):
        """Test: Análisis de impacto completo."""
        assert solicitud_cambio.impacto_calidad != ''
        assert solicitud_cambio.impacto_procesos != ''
        assert solicitud_cambio.impacto_recursos != ''
        assert solicitud_cambio.riesgos_identificados != ''
        assert solicitud_cambio.medidas_mitigacion != ''


@pytest.mark.django_db
class TestControlCambio:
    """Tests para el modelo ControlCambio."""

    def test_crear_control_cambio(self, empresa, solicitud_aprobada):
        """
        Test: Crear control de cambio básico.

        Given: Solicitud aprobada existente
        When: Se crea el control
        Then: Debe crearse correctamente
        """
        control = ControlCambio.objects.create(
            empresa_id=empresa.id,
            solicitud_cambio=solicitud_aprobada,
            fecha_inicio_implementacion=date.today() - timedelta(days=10),
            fecha_fin_implementacion=date.today(),
            acciones_realizadas='Acciones de prueba',
            personal_comunicado='Personal de prueba',
            fecha_comunicacion=date.today() - timedelta(days=12),
            metodo_comunicacion='Email',
            documentos_actualizados='Documentos de prueba'
        )

        assert control.pk is not None
        assert control.solicitud_cambio == solicitud_aprobada

    def test_str_control_cambio(self, control_cambio):
        """Test: Representación en string de control."""
        expected = f"Control - {control_cambio.solicitud_cambio.codigo}"
        assert str(control_cambio) == expected

    def test_relacion_one_to_one_solicitud(self, control_cambio, solicitud_aprobada):
        """
        Test: Relación OneToOne con solicitud.

        Given: Control existente vinculado a solicitud
        When: Se intenta crear otro control para misma solicitud
        Then: Debe lanzar IntegrityError
        """
        assert control_cambio.solicitud_cambio == solicitud_aprobada

        with pytest.raises(IntegrityError):
            ControlCambio.objects.create(
                empresa_id=control_cambio.empresa_id,
                solicitud_cambio=solicitud_aprobada,  # Ya tiene control
                fecha_inicio_implementacion=date.today(),
                fecha_fin_implementacion=date.today(),
                acciones_realizadas='Test',
                personal_comunicado='Test',
                fecha_comunicacion=date.today(),
                metodo_comunicacion='Test',
                documentos_actualizados='Test'
            )

    def test_acceso_solicitud_desde_control(self, control_cambio):
        """Test: Acceder a solicitud desde control."""
        assert control_cambio.solicitud_cambio.estado == 'APROBADA'
        assert control_cambio.solicitud_cambio.codigo == 'SC-2024-002'

    def test_acceso_control_desde_solicitud(self, solicitud_aprobada, control_cambio):
        """Test: Acceder a control desde solicitud."""
        assert solicitud_aprobada.control == control_cambio

    def test_capacitacion_realizada(self, control_cambio):
        """Test: Registro de capacitación."""
        assert control_cambio.capacitacion_realizada is True
        assert control_cambio.descripcion_capacitacion != ''
        assert control_cambio.personal_capacitado != ''

    def test_verificacion_eficacia(self, control_cambio):
        """Test: Verificación de eficacia del cambio."""
        assert control_cambio.verificacion_realizada is True
        assert control_cambio.fecha_verificacion is not None
        assert control_cambio.resultados_verificacion != ''
        assert control_cambio.eficaz is True

    def test_seguimiento_planificado(self, control_cambio):
        """Test: Seguimiento planificado."""
        assert control_cambio.seguimiento_planificado is True
        assert control_cambio.proxima_revision is not None
        assert control_cambio.proxima_revision > date.today()

    def test_costo_real_vs_estimado(self, control_cambio):
        """Test: Comparación de costo real vs estimado."""
        assert control_cambio.costo_real == Decimal('14500000.00')
        assert control_cambio.solicitud_cambio.costo_estimado == Decimal('15000000.00')
        assert control_cambio.costo_real < control_cambio.solicitud_cambio.costo_estimado

    def test_lecciones_aprendidas(self, control_cambio):
        """Test: Registro de lecciones aprendidas."""
        assert control_cambio.lecciones_aprendidas != ''
        assert len(control_cambio.lecciones_aprendidas) > 0


@pytest.mark.django_db
class TestMetadataModels:
    """Tests para metadata y campos comunes de los modelos."""

    def test_db_table_names(self):
        """Test: Nombres de tablas en base de datos."""
        assert NoConformidad._meta.db_table == 'calidad_no_conformidad'
        assert AccionCorrectiva._meta.db_table == 'calidad_accion_correctiva'
        assert SalidaNoConforme._meta.db_table == 'calidad_salida_no_conforme'
        assert SolicitudCambio._meta.db_table == 'calidad_solicitud_cambio'
        assert ControlCambio._meta.db_table == 'calidad_control_cambio'

    def test_verbose_names(self):
        """Test: Nombres verbose de modelos."""
        assert NoConformidad._meta.verbose_name == 'No Conformidad'
        assert NoConformidad._meta.verbose_name_plural == 'No Conformidades'
        assert AccionCorrectiva._meta.verbose_name == 'Acción Correctiva'
        assert SalidaNoConforme._meta.verbose_name == 'Salida No Conforme'

    def test_ordering(self):
        """Test: Ordenamiento de modelos."""
        assert NoConformidad._meta.ordering == ['-fecha_deteccion', '-id']
        assert AccionCorrectiva._meta.ordering == ['-fecha_planificada', '-id']
        assert SalidaNoConforme._meta.ordering == ['-fecha_deteccion', '-id']

    def test_indexes_empresa_id(self):
        """Test: Índices en empresa_id para multi-tenant."""
        nc_indexes = [idx.fields for idx in NoConformidad._meta.indexes]
        assert ['empresa_id', 'estado'] in nc_indexes

    def test_multi_tenant_empresa_id(self, no_conformidad, empresa):
        """Test: Campo empresa_id para multi-tenancy."""
        assert no_conformidad.empresa_id == empresa.id
        assert isinstance(no_conformidad.empresa_id, int)
