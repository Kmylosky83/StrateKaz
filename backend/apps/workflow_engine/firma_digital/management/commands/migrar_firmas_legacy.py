"""
Management Command: Migrar Firmas Legacy a FirmaDigital

Script de migración para consolidar los sistemas de firma:
- FirmaPolitica (identidad) → FirmaDigital
- FirmaDocumento (sistema_documental) → FirmaDigital

Uso:
    python manage.py migrar_firmas_legacy --dry-run  # Ver qué se migraría
    python manage.py migrar_firmas_legacy --execute  # Ejecutar migración
    python manage.py migrar_firmas_legacy --validate # Validar integridad post-migración

Parte de: PLAN_INTERVENCION_BRECHAS.md - Fase 0.3.2
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


# Mapeo de roles FirmaPolitica → FirmaDigital
MAPEO_ROL_POLITICA = {
    'ELABORO': 'ELABORO',
    'REVISO_TECNICO': 'REVISO',
    'REVISO_JURIDICO': 'REVISO',
    'APROBO_DIRECTOR': 'APROBO',
    'APROBO_GERENTE': 'APROBO',
    'APROBO_REPRESENTANTE_LEGAL': 'AUTORIZO',
}

# Mapeo de roles FirmaDocumento → FirmaDigital
MAPEO_TIPO_FIRMA_DOCUMENTO = {
    'ELABORACION': 'ELABORO',
    'REVISION': 'REVISO',
    'APROBACION': 'APROBO',
    'CONFORMIDAD': 'VALIDO',
    'VALIDACION': 'VALIDO',
}

# Mapeo de estados
MAPEO_ESTADO = {
    'PENDIENTE': 'PENDIENTE',
    'FIRMADO': 'FIRMADO',
    'RECHAZADO': 'RECHAZADO',
    'REVOCADO': 'EXPIRADO',
}


class Command(BaseCommand):
    help = 'Migra firmas de FirmaPolitica y FirmaDocumento hacia FirmaDigital'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simula la migración sin hacer cambios',
        )
        parser.add_argument(
            '--execute',
            action='store_true',
            help='Ejecuta la migración real',
        )
        parser.add_argument(
            '--validate',
            action='store_true',
            help='Valida la integridad después de la migración',
        )
        parser.add_argument(
            '--source',
            type=str,
            choices=['politica', 'documento', 'all'],
            default='all',
            help='Fuente a migrar: politica, documento, o all',
        )
        parser.add_argument(
            '--empresa-id',
            type=int,
            help='Migrar solo una empresa específica',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=100,
            help='Tamaño del lote para procesamiento',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        execute = options['execute']
        validate = options['validate']
        source = options['source']
        empresa_id = options.get('empresa_id')
        batch_size = options['batch_size']

        if not any([dry_run, execute, validate]):
            raise CommandError(
                'Debe especificar --dry-run, --execute o --validate'
            )

        if validate:
            self.validar_migracion(empresa_id)
            return

        self.stdout.write(self.style.NOTICE(
            f"\n{'='*60}\n"
            f"MIGRACIÓN DE FIRMAS LEGACY → FirmaDigital\n"
            f"{'='*60}\n"
            f"Modo: {'SIMULACIÓN (dry-run)' if dry_run else 'EJECUCIÓN REAL'}\n"
            f"Fuente: {source}\n"
            f"Empresa ID: {empresa_id or 'Todas'}\n"
            f"Batch size: {batch_size}\n"
            f"{'='*60}\n"
        ))

        resultados = {
            'politica': {'total': 0, 'migradas': 0, 'errores': 0},
            'documento': {'total': 0, 'migradas': 0, 'errores': 0},
            'historial': {'total': 0, 'migradas': 0, 'errores': 0},
        }

        try:
            if source in ['politica', 'all']:
                self.migrar_firmas_politica(
                    dry_run, empresa_id, batch_size, resultados
                )

            if source in ['documento', 'all']:
                self.migrar_firmas_documento(
                    dry_run, empresa_id, batch_size, resultados
                )

            self.mostrar_resumen(resultados, dry_run)

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\nError fatal: {str(e)}'))
            logger.exception('Error en migración de firmas')
            raise

    def migrar_firmas_politica(self, dry_run, empresa_id, batch_size, resultados):
        """Migra FirmaPolitica → FirmaDigital"""
        self.stdout.write(self.style.NOTICE('\n--- Migrando FirmaPolitica ---'))

        try:
            from apps.gestion_estrategica.identidad.models_workflow_firmas import (
                FirmaPolitica, HistorialFirmaPolitica
            )
            from apps.workflow_engine.firma_digital.models import (
                FirmaDigital, HistorialFirma, ConfiguracionFlujoFirma
            )
        except ImportError as e:
            self.stdout.write(self.style.WARNING(
                f'No se pueden importar modelos de FirmaPolitica: {e}'
            ))
            return

        # Obtener o crear configuración de flujo para políticas
        config_flujo = self._obtener_config_flujo_politicas()

        # Query base
        queryset = FirmaPolitica.objects.select_related(
            'proceso_firma__politica',
            'cargo',
            'usuario'
        ).order_by('id')

        if empresa_id:
            queryset = queryset.filter(
                proceso_firma__politica__empresa_id=empresa_id
            )

        total = queryset.count()
        resultados['politica']['total'] = total
        self.stdout.write(f'Total FirmaPolitica a migrar: {total}')

        # Obtener ContentType para PoliticaEspecifica
        try:
            from apps.gestion_estrategica.identidad.models import PoliticaEspecifica
            ct_politica = ContentType.objects.get_for_model(PoliticaEspecifica)
        except Exception:
            self.stdout.write(self.style.WARNING(
                'No se puede obtener ContentType de PoliticaEspecifica'
            ))
            return

        # Procesar en lotes
        for offset in range(0, total, batch_size):
            batch = queryset[offset:offset + batch_size]

            for firma_legacy in batch:
                try:
                    self._migrar_firma_politica(
                        firma_legacy,
                        ct_politica,
                        config_flujo,
                        dry_run,
                        resultados
                    )
                except Exception as e:
                    resultados['politica']['errores'] += 1
                    self.stdout.write(self.style.ERROR(
                        f'  Error migrando FirmaPolitica {firma_legacy.id}: {e}'
                    ))
                    logger.exception(f'Error migrando firma {firma_legacy.id}')

            self.stdout.write(
                f'  Procesadas {min(offset + batch_size, total)}/{total}'
            )

    def _migrar_firma_politica(self, firma_legacy, ct_politica, config_flujo, dry_run, resultados):
        """Migra una FirmaPolitica individual"""
        from apps.workflow_engine.firma_digital.models import FirmaDigital, HistorialFirma

        # Obtener la política asociada
        politica = firma_legacy.proceso_firma.politica

        # Mapear rol
        rol_nuevo = MAPEO_ROL_POLITICA.get(
            firma_legacy.rol_firmante, 'VALIDO'
        )

        # Mapear estado
        estado_nuevo = MAPEO_ESTADO.get(
            firma_legacy.estado, 'PENDIENTE'
        )

        # Verificar si ya existe (evitar duplicados)
        existe = FirmaDigital.objects.filter(
            content_type=ct_politica,
            object_id=politica.id,
            usuario=firma_legacy.usuario,
            rol_firma=rol_nuevo,
        ).exists()

        if existe:
            self.stdout.write(self.style.WARNING(
                f'  Firma ya existe para política {politica.id}, usuario {firma_legacy.usuario_id}'
            ))
            return

        if dry_run:
            self.stdout.write(
                f'  [DRY-RUN] Migraría FirmaPolitica {firma_legacy.id} → '
                f'FirmaDigital(politica={politica.id}, rol={rol_nuevo}, estado={estado_nuevo})'
            )
            resultados['politica']['migradas'] += 1
            return

        # Crear FirmaDigital
        with transaction.atomic():
            nueva_firma = FirmaDigital.objects.create(
                content_type=ct_politica,
                object_id=politica.id,
                configuracion_flujo=config_flujo,
                nodo_flujo=None,  # Se asignará después si es necesario
                usuario=firma_legacy.usuario,
                cargo=firma_legacy.cargo,
                rol_firma=rol_nuevo,
                firma_imagen=firma_legacy.firma_imagen or '',
                documento_hash=firma_legacy.firma_hash or '',
                firma_hash=firma_legacy.firma_hash or '',
                fecha_firma=firma_legacy.fecha_firma or timezone.now(),
                ip_address=firma_legacy.ip_address or '0.0.0.0',
                user_agent=firma_legacy.user_agent or '',
                geolocalizacion=firma_legacy.geolocalizacion,
                estado=estado_nuevo,
                orden=firma_legacy.orden,
                comentarios=firma_legacy.comentarios or '',
                es_delegada=firma_legacy.es_delegada,
                delegante=firma_legacy.delegado_por,
            )

            # Crear historial de migración
            HistorialFirma.objects.create(
                firma=nueva_firma,
                accion='MIGRADO',
                usuario=firma_legacy.usuario,
                descripcion=f'Migrado desde FirmaPolitica ID={firma_legacy.id}',
                metadatos={
                    'fuente': 'FirmaPolitica',
                    'id_original': str(firma_legacy.id),
                    'fecha_migracion': timezone.now().isoformat(),
                },
                ip_address=firma_legacy.ip_address or '0.0.0.0',
            )

            resultados['politica']['migradas'] += 1

    def migrar_firmas_documento(self, dry_run, empresa_id, batch_size, resultados):
        """Migra FirmaDocumento (sistema_documental) → FirmaDigital"""
        self.stdout.write(self.style.NOTICE('\n--- Migrando FirmaDocumento ---'))

        try:
            from apps.hseq_management.sistema_documental.models import (
                FirmaDocumento, Documento
            )
            from apps.workflow_engine.firma_digital.models import (
                FirmaDigital, HistorialFirma, ConfiguracionFlujoFirma
            )
        except ImportError as e:
            self.stdout.write(self.style.WARNING(
                f'No se pueden importar modelos de FirmaDocumento: {e}'
            ))
            return

        # Obtener o crear configuración de flujo para documentos
        config_flujo = self._obtener_config_flujo_documentos()

        # Query base
        queryset = FirmaDocumento.objects.select_related(
            'documento',
            'firmante'
        ).order_by('id')

        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        total = queryset.count()
        resultados['documento']['total'] = total
        self.stdout.write(f'Total FirmaDocumento a migrar: {total}')

        # Obtener ContentType para Documento
        try:
            ct_documento = ContentType.objects.get_for_model(Documento)
        except Exception:
            self.stdout.write(self.style.WARNING(
                'No se puede obtener ContentType de Documento'
            ))
            return

        # Procesar en lotes
        for offset in range(0, total, batch_size):
            batch = queryset[offset:offset + batch_size]

            for firma_legacy in batch:
                try:
                    self._migrar_firma_documento(
                        firma_legacy,
                        ct_documento,
                        config_flujo,
                        dry_run,
                        resultados
                    )
                except Exception as e:
                    resultados['documento']['errores'] += 1
                    self.stdout.write(self.style.ERROR(
                        f'  Error migrando FirmaDocumento {firma_legacy.id}: {e}'
                    ))
                    logger.exception(f'Error migrando firma documento {firma_legacy.id}')

            self.stdout.write(
                f'  Procesadas {min(offset + batch_size, total)}/{total}'
            )

    def _migrar_firma_documento(self, firma_legacy, ct_documento, config_flujo, dry_run, resultados):
        """Migra una FirmaDocumento individual"""
        from apps.workflow_engine.firma_digital.models import FirmaDigital, HistorialFirma
        from apps.core.models import Cargo

        documento = firma_legacy.documento

        # Mapear tipo de firma a rol
        rol_nuevo = MAPEO_TIPO_FIRMA_DOCUMENTO.get(
            firma_legacy.tipo_firma, 'VALIDO'
        )

        # Mapear estado
        estado_nuevo = MAPEO_ESTADO.get(
            firma_legacy.estado, 'PENDIENTE'
        )

        # Verificar si ya existe
        existe = FirmaDigital.objects.filter(
            content_type=ct_documento,
            object_id=documento.id,
            usuario=firma_legacy.firmante,
            rol_firma=rol_nuevo,
        ).exists()

        if existe:
            self.stdout.write(self.style.WARNING(
                f'  Firma ya existe para documento {documento.id}, usuario {firma_legacy.firmante_id}'
            ))
            return

        if dry_run:
            self.stdout.write(
                f'  [DRY-RUN] Migraría FirmaDocumento {firma_legacy.id} → '
                f'FirmaDigital(doc={documento.id}, rol={rol_nuevo}, estado={estado_nuevo})'
            )
            resultados['documento']['migradas'] += 1
            return

        # Obtener cargo del usuario (o crear uno temporal)
        cargo = None
        if hasattr(firma_legacy.firmante, 'cargo') and firma_legacy.firmante.cargo:
            cargo = firma_legacy.firmante.cargo
        else:
            # Buscar cargo por nombre si está guardado como texto
            if firma_legacy.cargo_firmante:
                cargo = Cargo.objects.filter(
                    nombre__icontains=firma_legacy.cargo_firmante
                ).first()

        # Construir geolocalización desde lat/long
        geolocalizacion = None
        if firma_legacy.latitud and firma_legacy.longitud:
            geolocalizacion = {
                'latitude': float(firma_legacy.latitud),
                'longitude': float(firma_legacy.longitud),
            }

        with transaction.atomic():
            nueva_firma = FirmaDigital.objects.create(
                content_type=ct_documento,
                object_id=documento.id,
                configuracion_flujo=config_flujo,
                nodo_flujo=None,
                usuario=firma_legacy.firmante,
                cargo=cargo,
                rol_firma=rol_nuevo,
                firma_imagen=firma_legacy.firma_digital or '',
                documento_hash=firma_legacy.checksum_documento or '',
                firma_hash='',  # Se calculará después si es necesario
                fecha_firma=firma_legacy.fecha_firma or timezone.now(),
                ip_address=firma_legacy.ip_address or '0.0.0.0',
                user_agent=firma_legacy.user_agent or '',
                geolocalizacion=geolocalizacion,
                estado=estado_nuevo,
                orden=firma_legacy.orden_firma,
                comentarios=firma_legacy.comentarios or firma_legacy.motivo_rechazo or '',
                es_delegada=False,
                delegante=None,
            )

            # Crear historial
            HistorialFirma.objects.create(
                firma=nueva_firma,
                accion='MIGRADO',
                usuario=firma_legacy.firmante,
                descripcion=f'Migrado desde FirmaDocumento ID={firma_legacy.id}',
                metadatos={
                    'fuente': 'FirmaDocumento',
                    'id_original': str(firma_legacy.id),
                    'tipo_firma_original': firma_legacy.tipo_firma,
                    'fecha_migracion': timezone.now().isoformat(),
                },
                ip_address=firma_legacy.ip_address or '0.0.0.0',
            )

            resultados['documento']['migradas'] += 1

    def _obtener_config_flujo_politicas(self):
        """Obtiene o crea la configuración de flujo para políticas"""
        from apps.workflow_engine.firma_digital.models import ConfiguracionFlujoFirma

        config, created = ConfiguracionFlujoFirma.objects.get_or_create(
            codigo='FLUJO_POLITICAS_MIGRADO',
            defaults={
                'nombre': 'Flujo Políticas (Migrado)',
                'descripcion': 'Flujo creado durante migración desde FirmaPolitica',
                'tipo_flujo': 'SECUENCIAL',
                'configuracion_nodos': [
                    {'orden': 1, 'rol': 'ELABORO', 'requerido': True},
                    {'orden': 2, 'rol': 'REVISO', 'requerido': True},
                    {'orden': 3, 'rol': 'APROBO', 'requerido': True},
                ],
                'permite_delegacion': True,
                'dias_max_firma': 5,
                'requiere_comentario_rechazo': True,
                'empresa_id': 1,  # Default
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS(
                '  Creada ConfiguracionFlujoFirma: FLUJO_POLITICAS_MIGRADO'
            ))

        return config

    def _obtener_config_flujo_documentos(self):
        """Obtiene o crea la configuración de flujo para documentos"""
        from apps.workflow_engine.firma_digital.models import ConfiguracionFlujoFirma

        config, created = ConfiguracionFlujoFirma.objects.get_or_create(
            codigo='FLUJO_DOCUMENTOS_MIGRADO',
            defaults={
                'nombre': 'Flujo Documentos (Migrado)',
                'descripcion': 'Flujo creado durante migración desde FirmaDocumento',
                'tipo_flujo': 'SECUENCIAL',
                'configuracion_nodos': [
                    {'orden': 1, 'rol': 'ELABORO', 'requerido': True},
                    {'orden': 2, 'rol': 'REVISO', 'requerido': True},
                    {'orden': 3, 'rol': 'APROBO', 'requerido': True},
                ],
                'permite_delegacion': True,
                'dias_max_firma': 5,
                'requiere_comentario_rechazo': True,
                'empresa_id': 1,  # Default
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS(
                '  Creada ConfiguracionFlujoFirma: FLUJO_DOCUMENTOS_MIGRADO'
            ))

        return config

    def validar_migracion(self, empresa_id):
        """Valida la integridad de la migración"""
        self.stdout.write(self.style.NOTICE('\n--- Validando Migración ---'))

        from apps.workflow_engine.firma_digital.models import FirmaDigital, HistorialFirma

        # Contar firmas migradas
        firmas_migradas = HistorialFirma.objects.filter(
            accion='MIGRADO'
        )

        if empresa_id:
            firmas_migradas = firmas_migradas.filter(
                firma__content_type__model__in=['politicaespecifica', 'documento']
            )

        total_migradas = firmas_migradas.count()

        # Agrupar por fuente
        from_politica = firmas_migradas.filter(
            metadatos__fuente='FirmaPolitica'
        ).count()

        from_documento = firmas_migradas.filter(
            metadatos__fuente='FirmaDocumento'
        ).count()

        self.stdout.write(f'\nFirmas migradas totales: {total_migradas}')
        self.stdout.write(f'  - Desde FirmaPolitica: {from_politica}')
        self.stdout.write(f'  - Desde FirmaDocumento: {from_documento}')

        # Verificar integridad
        firmas_sin_hash = FirmaDigital.objects.filter(
            historialfirma__accion='MIGRADO',
            firma_hash=''
        ).count()

        if firmas_sin_hash > 0:
            self.stdout.write(self.style.WARNING(
                f'\n⚠ Firmas sin hash: {firmas_sin_hash}'
            ))
        else:
            self.stdout.write(self.style.SUCCESS('\n✓ Todas las firmas tienen hash'))

        # Verificar estados
        for estado in ['PENDIENTE', 'FIRMADO', 'RECHAZADO', 'EXPIRADO']:
            count = FirmaDigital.objects.filter(
                historialfirma__accion='MIGRADO',
                estado=estado
            ).count()
            self.stdout.write(f'  Estado {estado}: {count}')

    def mostrar_resumen(self, resultados, dry_run):
        """Muestra resumen final de la migración"""
        self.stdout.write(self.style.NOTICE(
            f"\n{'='*60}\n"
            f"RESUMEN DE MIGRACIÓN {'(SIMULACIÓN)' if dry_run else ''}\n"
            f"{'='*60}"
        ))

        for fuente, stats in resultados.items():
            if stats['total'] > 0:
                self.stdout.write(
                    f"\n{fuente.upper()}:\n"
                    f"  Total: {stats['total']}\n"
                    f"  Migradas: {stats['migradas']}\n"
                    f"  Errores: {stats['errores']}"
                )

        total_migradas = sum(s['migradas'] for s in resultados.values())
        total_errores = sum(s['errores'] for s in resultados.values())

        if dry_run:
            self.stdout.write(self.style.SUCCESS(
                f"\n✓ Simulación completada. Se migrarían {total_migradas} registros."
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f"\n✓ Migración completada: {total_migradas} registros migrados, "
                f"{total_errores} errores."
            ))

        if total_errores > 0:
            self.stdout.write(self.style.WARNING(
                '\n⚠ Revise los logs para detalles de errores.'
            ))
