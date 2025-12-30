"""
Factories para tests de calidad usando Factory Boy

Factories disponibles:
- NoConformidadFactory
- AccionCorrectivaFactory
- SalidaNoConformeFactory
- SolicitudCambioFactory
- ControlCambioFactory

Nota: Este archivo está preparado para usar Factory Boy en el futuro.
Actualmente el proyecto usa fixtures de pytest directamente.
"""
# import factory
# from factory.django import DjangoModelFactory
# from datetime import date, timedelta
# from decimal import Decimal
#
# from apps.hseq_management.calidad.models import (
#     NoConformidad,
#     AccionCorrectiva,
#     SalidaNoConforme,
#     SolicitudCambio,
#     ControlCambio
# )
#
#
# class NoConformidadFactory(DjangoModelFactory):
#     """Factory para crear NoConformidad."""
#
#     class Meta:
#         model = NoConformidad
#
#     empresa_id = 1
#     codigo = factory.Sequence(lambda n: f'NC-2024-{n:03d}')
#     tipo = 'REAL'
#     origen = 'AUDITORIA_INTERNA'
#     severidad = 'MAYOR'
#     titulo = factory.Faker('sentence', nb_words=6)
#     descripcion = factory.Faker('paragraph')
#     fecha_deteccion = factory.LazyFunction(date.today)
#     estado = 'ABIERTA'
#     detectado_por = factory.SubFactory('apps.core.tests.factories.UserFactory')
#
#
# class AccionCorrectivaFactory(DjangoModelFactory):
#     """Factory para crear AccionCorrectiva."""
#
#     class Meta:
#         model = AccionCorrectiva
#
#     empresa_id = 1
#     codigo = factory.Sequence(lambda n: f'AC-2024-{n:03d}')
#     tipo = 'CORRECTIVA'
#     no_conformidad = factory.SubFactory(NoConformidadFactory)
#     descripcion = factory.Faker('paragraph')
#     fecha_planificada = factory.LazyFunction(lambda: date.today() + timedelta(days=7))
#     fecha_limite = factory.LazyFunction(lambda: date.today() + timedelta(days=30))
#     estado = 'PLANIFICADA'
#     responsable = factory.SubFactory('apps.core.tests.factories.UserFactory')
#
#
# class SalidaNoConformeFactory(DjangoModelFactory):
#     """Factory para crear SalidaNoConforme."""
#
#     class Meta:
#         model = SalidaNoConforme
#
#     empresa_id = 1
#     codigo = factory.Sequence(lambda n: f'SNC-2024-{n:03d}')
#     tipo = 'PRODUCTO'
#     descripcion_producto = factory.Faker('sentence')
#     descripcion_no_conformidad = factory.Faker('paragraph')
#     fecha_deteccion = factory.LazyFunction(date.today)
#     lote_numero = factory.Sequence(lambda n: f'L-2024-{n:05d}')
#     cantidad_afectada = Decimal('100.000')
#     unidad_medida = 'Kg'
#     ubicacion_actual = 'Almacén de cuarentena'
#     bloqueada = True
#     requisito_incumplido = factory.Faker('sentence')
#     riesgo_uso = 'MEDIO'
#     estado = 'DETECTADA'
#     detectado_por = factory.SubFactory('apps.core.tests.factories.UserFactory')
#
#
# class SolicitudCambioFactory(DjangoModelFactory):
#     """Factory para crear SolicitudCambio."""
#
#     class Meta:
#         model = SolicitudCambio
#
#     empresa_id = 1
#     codigo = factory.Sequence(lambda n: f'SC-2024-{n:03d}')
#     tipo = 'PROCESO'
#     prioridad = 'MEDIA'
#     titulo = factory.Faker('sentence')
#     descripcion_actual = factory.Faker('paragraph')
#     descripcion_cambio = factory.Faker('paragraph')
#     justificacion = factory.Faker('paragraph')
#     estado = 'SOLICITADA'
#     solicitante = factory.SubFactory('apps.core.tests.factories.UserFactory')
#
#
# class ControlCambioFactory(DjangoModelFactory):
#     """Factory para crear ControlCambio."""
#
#     class Meta:
#         model = ControlCambio
#
#     empresa_id = 1
#     solicitud_cambio = factory.SubFactory(SolicitudCambioFactory)
#     fecha_inicio_implementacion = factory.LazyFunction(lambda: date.today() - timedelta(days=20))
#     fecha_fin_implementacion = factory.LazyFunction(lambda: date.today() - timedelta(days=5))
#     acciones_realizadas = factory.Faker('paragraph')
#     personal_comunicado = factory.Faker('sentence')
#     fecha_comunicacion = factory.LazyFunction(lambda: date.today() - timedelta(days=25))
#     metodo_comunicacion = 'Reunión y correos'
#     documentos_actualizados = 'Procedimientos actualizados'
