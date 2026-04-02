"""
Management command para crear tipos de notificación iniciales

Uso:
    python manage.py seed_notification_types

Este comando crea los tipos de notificación base que pueden ser usados
por diferentes módulos del sistema.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from apps.audit_system.centro_notificaciones.models import TipoNotificacion
from apps.gestion_estrategica.configuracion.models import EmpresaConfig


class Command(BaseCommand):
    help = 'Crea tipos de notificación iniciales para el sistema'

    def add_arguments(self, parser):
        parser.add_argument(
            '--company-id',
            type=int,
            help='ID de la empresa (opcional, usa la primera activa si no se especifica)'
        )

    def handle(self, *args, **options):
        company_id = options.get('company_id')

        if not company_id:
            # Usar la primera empresa (EmpresaConfig es singleton)
            empresa = EmpresaConfig.objects.first()
            if not empresa:
                self.stdout.write(
                    self.style.ERROR('No hay empresa configurada. Configura EmpresaConfig primero.')
                )
                return
            company_id = empresa.id

        self.stdout.write(f'Creando tipos de notificación para empresa ID: {company_id}')

        tipos_creados = 0
        tipos_existentes = 0

        with transaction.atomic():
            for tipo_data in TIPOS_NOTIFICACION:
                tipo_data['empresa_id'] = company_id

                # Verificar si ya existe
                exists = TipoNotificacion.objects.filter(
                    codigo=tipo_data['codigo'],
                    empresa_id=company_id
                ).exists()

                if exists:
                    self.stdout.write(
                        self.style.WARNING(f"  [SKIP] Ya existe: {tipo_data['codigo']}")
                    )
                    tipos_existentes += 1
                    continue

                # Crear tipo
                TipoNotificacion.objects.create(**tipo_data)
                self.stdout.write(
                    self.style.SUCCESS(f"  [OK] Creado: {tipo_data['codigo']} - {tipo_data['nombre']}")
                )
                tipos_creados += 1

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'Resumen:'))
        self.stdout.write(f'  - Tipos creados: {tipos_creados}')
        self.stdout.write(f'  - Tipos existentes: {tipos_existentes}')
        self.stdout.write(f'  - Total: {tipos_creados + tipos_existentes}')


# =============================================================================
# DEFINICIÓN DE TIPOS DE NOTIFICACIÓN
# =============================================================================

TIPOS_NOTIFICACION = [
    # =========================================================================
    # PLANEACIÓN ESTRATÉGICA
    # =========================================================================
    {
        'codigo': 'NUEVA_TAREA',
        'nombre': 'Nueva Tarea Asignada',
        'descripcion': 'Notifica al usuario cuando se le asigna una nueva tarea en el módulo de planeación',
        'categoria': 'tarea',
        'color': '#3B82F6',  # Blue
        'icono': 'check-square',
        'plantilla_titulo': 'Nueva tarea: {titulo}',
        'plantilla_mensaje': 'Se te ha asignado la tarea: {descripcion}. Responsable: {responsable}. Fecha límite: {fecha_limite}',
        'url_template': '/planeacion-estrategica/planeacion',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'TAREA_VENCIDA',
        'nombre': 'Tarea Vencida',
        'descripcion': 'Alerta cuando una tarea ha superado su fecha límite',
        'categoria': 'alerta',
        'color': '#EF4444',  # Red
        'icono': 'alert-triangle',
        'plantilla_titulo': 'Tarea vencida: {titulo}',
        'plantilla_mensaje': 'La tarea "{titulo}" venció el {fecha_vencimiento}. Por favor actualiza su estado.',
        'url_template': '/planeacion-estrategica/planeacion',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'TAREA_COMPLETADA',
        'nombre': 'Tarea Completada',
        'descripcion': 'Notifica al creador cuando una tarea asignada es completada',
        'categoria': 'sistema',
        'color': '#10B981',  # Green
        'icono': 'check-circle',
        'plantilla_titulo': 'Tarea completada: {titulo}',
        'plantilla_mensaje': '{completado_por} ha completado la tarea: {titulo}',
        'url_template': '/planeacion-estrategica/planeacion',
        'es_email': False,
        'es_push': True,
    },
    {
        'codigo': 'OBJETIVO_PROXIMO_VENCER',
        'nombre': 'Objetivo Próximo a Vencer',
        'descripcion': 'Recordatorio cuando un objetivo estratégico está próximo a su fecha límite',
        'categoria': 'recordatorio',
        'color': '#F59E0B',  # Amber
        'icono': 'clock',
        'plantilla_titulo': 'Objetivo próximo a vencer: {objetivo}',
        'plantilla_mensaje': 'El objetivo "{objetivo}" vence en {dias_restantes} días. Avance actual: {porcentaje_avance}%',
        'url_template': '/planeacion-estrategica/planeacion',
        'es_email': True,
        'es_push': False,
    },

    # =========================================================================
    # WORKFLOW ENGINE (Aprobaciones)
    # =========================================================================
    {
        'codigo': 'SOLICITUD_APROBACION',
        'nombre': 'Solicitud de Aprobación',
        'descripcion': 'Notifica al aprobador cuando llega una nueva solicitud',
        'categoria': 'aprobacion',
        'color': '#8B5CF6',  # Purple
        'icono': 'file-text',
        'plantilla_titulo': 'Nueva solicitud de {solicitante}',
        'plantilla_mensaje': 'Requiere tu aprobación: {descripcion}. Tipo: {tipo_solicitud}',
        'url_template': '/workflow/aprobaciones/{solicitud_id}',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'APROBACION_CONCEDIDA',
        'nombre': 'Aprobación Concedida',
        'descripcion': 'Notifica al solicitante cuando su solicitud es aprobada',
        'categoria': 'sistema',
        'color': '#10B981',  # Green
        'icono': 'check-circle',
        'plantilla_titulo': 'Solicitud aprobada',
        'plantilla_mensaje': '{aprobador} aprobó tu solicitud: {descripcion}',
        'url_template': '/workflow/mis-solicitudes/{solicitud_id}',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'APROBACION_RECHAZADA',
        'nombre': 'Aprobación Rechazada',
        'descripcion': 'Notifica al solicitante cuando su solicitud es rechazada',
        'categoria': 'alerta',
        'color': '#EF4444',  # Red
        'icono': 'x-circle',
        'plantilla_titulo': 'Solicitud rechazada',
        'plantilla_mensaje': '{aprobador} rechazó tu solicitud: {descripcion}. Motivo: {motivo_rechazo}',
        'url_template': '/workflow/mis-solicitudes/{solicitud_id}',
        'es_email': True,
        'es_push': True,
    },

    # =========================================================================
    # HSEQ MANAGEMENT (SST, Calidad, Ambiental)
    # =========================================================================
    {
        'codigo': 'INCIDENTE_SST',
        'nombre': 'Incidente SST Reportado',
        'descripcion': 'Alerta a coordinadores SST cuando se reporta un incidente',
        'categoria': 'alerta',
        'color': '#DC2626',  # Dark Red
        'icono': 'alert-triangle',
        'plantilla_titulo': 'Nuevo incidente SST - {tipo_incidente}',
        'plantilla_mensaje': 'Reportado en {area}: {descripcion}. Gravedad: {gravedad}',
        'url_template': '/hseq/incidentes/{incidente_id}',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'CAPACITACION_PROXIMA',
        'nombre': 'Capacitación Próxima',
        'descripcion': 'Recordatorio de capacitación programada',
        'categoria': 'recordatorio',
        'color': '#3B82F6',  # Blue
        'icono': 'book-open',
        'plantilla_titulo': 'Capacitación programada: {tema}',
        'plantilla_mensaje': 'Tienes una capacitación el {fecha} a las {hora}. Tema: {tema}. Ubicación: {ubicacion}',
        'url_template': '/hseq/capacitaciones/{capacitacion_id}',
        'es_email': True,
        'es_push': False,
    },
    {
        'codigo': 'INSPECCION_PENDIENTE',
        'nombre': 'Inspección Pendiente',
        'descripcion': 'Recordatorio de inspección programada pendiente',
        'categoria': 'recordatorio',
        'color': '#F59E0B',  # Amber
        'icono': 'clipboard-check',
        'plantilla_titulo': 'Inspección pendiente: {tipo_inspeccion}',
        'plantilla_mensaje': 'Debes realizar la inspección de {area} antes del {fecha_limite}',
        'url_template': '/hseq/inspecciones/{inspeccion_id}',
        'es_email': True,
        'es_push': False,
    },
    {
        'codigo': 'AUDITORIA_PROGRAMADA',
        'nombre': 'Auditoría Programada',
        'descripcion': 'Notifica sobre auditoría interna o externa programada',
        'categoria': 'recordatorio',
        'color': '#8B5CF6',  # Purple
        'icono': 'search',
        'plantilla_titulo': 'Auditoría programada: {norma}',
        'plantilla_mensaje': 'Auditoría {tipo_auditoria} de {norma} el {fecha}. Área: {area}',
        'url_template': '/hseq/auditorias/{auditoria_id}',
        'es_email': True,
        'es_push': False,
    },
    {
        'codigo': 'NO_CONFORMIDAD_ASIGNADA',
        'nombre': 'No Conformidad Asignada',
        'descripcion': 'Notifica al responsable cuando se le asigna una no conformidad',
        'categoria': 'alerta',
        'color': '#EF4444',  # Red
        'icono': 'alert-circle',
        'plantilla_titulo': 'No conformidad asignada',
        'plantilla_mensaje': 'Se te ha asignado la NC: {descripcion}. Fecha límite para acción correctiva: {fecha_limite}',
        'url_template': '/hseq/no-conformidades/{nc_id}',
        'es_email': True,
        'es_push': True,
    },

    # =========================================================================
    # TALENT HUB (RRHH)
    # =========================================================================
    {
        'codigo': 'BIENVENIDA',
        'nombre': 'Mensaje de Bienvenida',
        'descripcion': 'Mensaje de bienvenida para nuevos colaboradores',
        'categoria': 'sistema',
        'color': '#10B981',  # Green
        'icono': 'user-plus',
        'plantilla_titulo': '¡Bienvenido a {empresa}!',
        'plantilla_mensaje': 'Hola {nombre}, bienvenido al equipo. Completa tu proceso de onboarding para empezar.',
        'url_template': '/onboarding/inicio',
        'es_email': True,
        'es_push': False,
    },
    {
        'codigo': 'EVALUACION_PENDIENTE',
        'nombre': 'Evaluación de Desempeño Pendiente',
        'descripcion': 'Recordatorio de evaluación de desempeño',
        'categoria': 'recordatorio',
        'color': '#F59E0B',  # Amber
        'icono': 'star',
        'plantilla_titulo': 'Evaluación de desempeño pendiente',
        'plantilla_mensaje': 'Tienes una evaluación de desempeño pendiente. Período: {periodo}. Fecha límite: {fecha_limite}',
        'url_template': '/talent/evaluaciones/{evaluacion_id}',
        'es_email': True,
        'es_push': False,
    },
    {
        'codigo': 'VACACIONES_APROBADAS',
        'nombre': 'Vacaciones Aprobadas',
        'descripcion': 'Notifica cuando las vacaciones solicitadas son aprobadas',
        'categoria': 'sistema',
        'color': '#10B981',  # Green
        'icono': 'calendar',
        'plantilla_titulo': 'Vacaciones aprobadas',
        'plantilla_mensaje': 'Tus vacaciones del {fecha_inicio} al {fecha_fin} han sido aprobadas.',
        'url_template': '/talent/mis-vacaciones',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'DOCUMENTO_VENCIDO',
        'nombre': 'Documento Personal Vencido',
        'descripcion': 'Alerta cuando un documento personal (cédula, licencia, etc.) está vencido',
        'categoria': 'alerta',
        'color': '#EF4444',  # Red
        'icono': 'file-text',
        'plantilla_titulo': 'Documento vencido: {tipo_documento}',
        'plantilla_mensaje': 'Tu {tipo_documento} venció el {fecha_vencimiento}. Por favor actualízalo.',
        'url_template': '/talent/mis-documentos',
        'es_email': True,
        'es_push': False,
    },
    {
        'codigo': 'TH_CONTRATACION_EXITOSA',
        'nombre': 'Contratación Exitosa',
        'descripcion': 'Notifica al nuevo colaborador sobre su contratación exitosa y proceso de onboarding',
        'categoria': 'sistema',
        'color': '#10B981',  # Green
        'icono': 'user-check',
        'plantilla_titulo': '¡Bienvenido! Contratación exitosa',
        'plantilla_mensaje': 'Hola {colaborador_nombre}, has sido contratado como {cargo}. Tu fecha de ingreso es {fecha_ingreso}. Completa tu proceso de onboarding.',
        'url_template': '/talento/onboarding',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'TH_ONBOARDING_INICIADO',
        'nombre': 'Onboarding Iniciado',
        'descripcion': 'Notifica al colaborador que su proceso de inducción ha iniciado con tareas asignadas',
        'categoria': 'sistema',
        'color': '#3B82F6',  # Blue
        'icono': 'clipboard-check',
        'plantilla_titulo': 'Tu proceso de inducción ha iniciado',
        'plantilla_mensaje': 'Hola {colaborador_nombre}, se te han asignado {total_tareas} tareas de onboarding. Revisa tu checklist para completarlas.',
        'url_template': '/talento/onboarding',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'TH_CONTRATO_GENERADO',
        'nombre': 'Contrato Generado',
        'descripcion': 'Notifica que el documento de contrato laboral ha sido generado y está listo para revisión',
        'categoria': 'tarea',
        'color': '#8B5CF6',  # Purple
        'icono': 'file-text',
        'plantilla_titulo': 'Contrato generado: {numero_contrato}',
        'plantilla_mensaje': 'Tu contrato {tipo_contrato} #{numero_contrato} ha sido generado. Revisa el documento en Gestión Documental.',
        'url_template': '/talento/seleccion?tab=contratos',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'TH_RENOVACION_CONTRATO',
        'nombre': 'Renovación de Contrato',
        'descripcion': 'Notifica al colaborador sobre la renovación de su contrato laboral',
        'categoria': 'sistema',
        'color': '#F59E0B',  # Amber
        'icono': 'refresh-cw',
        'plantilla_titulo': 'Contrato renovado: {numero_contrato}',
        'plantilla_mensaje': 'Tu contrato #{numero_contrato} ha sido renovado (renovación #{renovacion_num}). Nueva fecha de finalización: {fecha_fin}.',
        'url_template': '/talento/seleccion?tab=contratos',
        'es_email': True,
        'es_push': False,
    },

    # =========================================================================
    # SISTEMA GENERAL
    # =========================================================================
    {
        'codigo': 'ACTUALIZACION_SISTEMA',
        'nombre': 'Actualización del Sistema',
        'descripcion': 'Notifica sobre nuevas versiones o actualizaciones importantes',
        'categoria': 'sistema',
        'color': '#3B82F6',  # Blue
        'icono': 'download',
        'plantilla_titulo': 'Nueva actualización disponible',
        'plantilla_mensaje': 'StrateKaz se actualizó a la versión {version}. Novedades: {novedades}',
        'url_template': '/changelog',
        'es_email': False,
        'es_push': True,
    },
    {
        'codigo': 'MANTENIMIENTO_PROGRAMADO',
        'nombre': 'Mantenimiento Programado',
        'descripcion': 'Alerta sobre mantenimiento del sistema',
        'categoria': 'alerta',
        'color': '#F59E0B',  # Amber
        'icono': 'tool',
        'plantilla_titulo': 'Mantenimiento programado',
        'plantilla_mensaje': 'El sistema estará en mantenimiento el {fecha} de {hora_inicio} a {hora_fin}',
        'url_template': '/',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'CAMBIO_CONTRASENA',
        'nombre': 'Cambio de Contraseña',
        'descripcion': 'Notifica cuando se cambia la contraseña de la cuenta',
        'categoria': 'sistema',
        'color': '#3B82F6',  # Blue
        'icono': 'lock',
        'plantilla_titulo': 'Contraseña actualizada',
        'plantilla_mensaje': 'Tu contraseña fue cambiada exitosamente el {fecha}. Si no fuiste tú, contacta al administrador.',
        'url_template': '/perfil/seguridad',
        'es_email': True,
        'es_push': False,
    },
    {
        'codigo': 'NUEVO_MENSAJE',
        'nombre': 'Nuevo Mensaje',
        'descripcion': 'Notifica cuando se recibe un mensaje interno',
        'categoria': 'sistema',
        'color': '#3B82F6',  # Blue
        'icono': 'mail',
        'plantilla_titulo': 'Nuevo mensaje de {remitente}',
        'plantilla_mensaje': '{asunto}',
        'url_template': '/mensajes/{mensaje_id}',
        'es_email': False,
        'es_push': True,
    },

    # =========================================================================
    # SUPPLY CHAIN & PRODUCCIÓN
    # =========================================================================
    {
        'codigo': 'ORDEN_COMPRA_APROBADA',
        'nombre': 'Orden de Compra Aprobada',
        'descripcion': 'Notifica al solicitante cuando su orden de compra es aprobada',
        'categoria': 'sistema',
        'color': '#10B981',  # Green
        'icono': 'shopping-cart',
        'plantilla_titulo': 'Orden de compra #{numero} aprobada',
        'plantilla_mensaje': 'Tu orden de compra para {proveedor} fue aprobada. Monto: {monto}',
        'url_template': '/supply-chain/ordenes/{orden_id}',
        'es_email': True,
        'es_push': False,
    },
    {
        'codigo': 'STOCK_BAJO',
        'nombre': 'Stock Bajo',
        'descripcion': 'Alerta cuando el inventario está por debajo del mínimo',
        'categoria': 'alerta',
        'color': '#F59E0B',  # Amber
        'icono': 'package',
        'plantilla_titulo': 'Stock bajo: {producto}',
        'plantilla_mensaje': 'El producto {producto} tiene stock bajo. Actual: {cantidad_actual}. Mínimo: {cantidad_minima}',
        'url_template': '/supply-chain/inventario/{producto_id}',
        'es_email': True,
        'es_push': False,
    },
    {
        'codigo': 'MANTENIMIENTO_EQUIPO',
        'nombre': 'Mantenimiento de Equipo Programado',
        'descripcion': 'Recordatorio de mantenimiento preventivo de maquinaria',
        'categoria': 'recordatorio',
        'color': '#3B82F6',  # Blue
        'icono': 'tool',
        'plantilla_titulo': 'Mantenimiento programado: {equipo}',
        'plantilla_mensaje': 'Mantenimiento preventivo del {equipo} programado para el {fecha}',
        'url_template': '/produccion/mantenimientos/{mantenimiento_id}',
        'es_email': True,
        'es_push': False,
    },

    # =========================================================================
    # ENCUESTAS COLABORATIVAS DOFA
    # =========================================================================
    {
        'codigo': 'ENCUESTA_DOFA',
        'nombre': 'Invitación a Encuesta DOFA',
        'descripcion': 'Invita a colaboradores a participar en encuesta de análisis DOFA',
        'categoria': 'tarea',
        'color': '#8B5CF6',  # Purple
        'icono': 'clipboard-list',
        'plantilla_titulo': 'Nueva encuesta: {encuesta_titulo}',
        'plantilla_mensaje': 'Se te ha invitado a participar en la encuesta DOFA "{encuesta_titulo}". Tu opinión es importante para identificar fortalezas y debilidades organizacionales. Fecha límite: {fecha_cierre}',
        'url_template': '/gestion-estrategica/encuestas/{encuesta_id}/responder',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'ENCUESTA_DOFA_RECORDATORIO',
        'nombre': 'Recordatorio de Encuesta DOFA',
        'descripcion': 'Recuerda a colaboradores completar la encuesta DOFA',
        'categoria': 'recordatorio',
        'color': '#F59E0B',  # Amber
        'icono': 'clock',
        'plantilla_titulo': 'Recordatorio: {encuesta_titulo}',
        'plantilla_mensaje': 'Te recordamos que aún no has completado la encuesta DOFA "{encuesta_titulo}". La fecha límite es {fecha_cierre}.',
        'url_template': '/gestion-estrategica/encuestas/{encuesta_id}/responder',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'ENCUESTA_DOFA_CERRADA',
        'nombre': 'Encuesta DOFA Cerrada',
        'descripcion': 'Notifica al responsable cuando la encuesta se cierra',
        'categoria': 'sistema',
        'color': '#10B981',  # Green
        'icono': 'check-circle',
        'plantilla_titulo': 'Encuesta cerrada: {encuesta_titulo}',
        'plantilla_mensaje': 'La encuesta "{encuesta_titulo}" ha sido cerrada. Total participantes: {total_respondidos}. Porcentaje de participación: {porcentaje}%',
        'url_template': '/gestion-estrategica/encuestas/{encuesta_id}/resultados',
        'es_email': True,
        'es_push': False,
    },

    # =========================================================================
    # GESTIÓN DOCUMENTAL
    # =========================================================================
    {
        'codigo': 'DOCUMENTO_REVISION',
        'nombre': 'Documento en Revisión',
        'descripcion': 'Notifica cuando un documento requiere revisión',
        'categoria': 'tarea',
        'color': '#8B5CF6',  # Purple
        'icono': 'file-text',
        'plantilla_titulo': 'Documento requiere revisión',
        'plantilla_mensaje': 'El documento "{titulo}" requiere tu revisión. Código: {codigo}',
        'url_template': '/gestion-documental/documentos/{documento_id}',
        'es_email': True,
        'es_push': False,
    },
    {
        'codigo': 'DOCUMENTO_APROBADO',
        'nombre': 'Documento Aprobado',
        'descripcion': 'Notifica al elaborador cuando un documento es aprobado por el revisor',
        'categoria': 'sistema',
        'color': '#10B981',  # Green
        'icono': 'check-circle',
        'plantilla_titulo': 'Documento aprobado: {codigo}',
        'plantilla_mensaje': 'El documento "{titulo}" ({codigo}) ha sido aprobado. Puede proceder a publicarlo.',
        'url_template': '/sistema-gestion/gestion-documental',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'DOCUMENTO_REVISION_VENCIDA',
        'nombre': 'Documento con Revisión Vencida',
        'descripcion': 'Alerta cuando un documento publicado tiene su revisión programada vencida',
        'categoria': 'alerta',
        'color': '#EF4444',  # Red
        'icono': 'alert-triangle',
        'plantilla_titulo': 'Documento con revisión vencida: {codigo}',
        'plantilla_mensaje': 'El documento "{titulo}" ({codigo}) tiene su revisión programada vencida. Por favor programe la revisión correspondiente.',
        'url_template': '/sistema-gestion/gestion-documental',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'DOCUMENTO_PROXIMO_REVISION',
        'nombre': 'Documento Próximo a Revisión',
        'descripcion': 'Recordatorio cuando un documento publicado está próximo a su fecha de revisión programada',
        'categoria': 'recordatorio',
        'color': '#F59E0B',  # Amber
        'icono': 'clock',
        'plantilla_titulo': 'Documento próximo a revisión: {codigo}',
        'plantilla_mensaje': 'El documento "{titulo}" ({codigo}) tiene revisión programada para el {fecha_revision} ({dias_restantes} días restantes).',
        'url_template': '/sistema-gestion/gestion-documental',
        'es_email': True,
        'es_push': False,
    },
    {
        'codigo': 'DOCUMENTO_PUBLICADO',
        'nombre': 'Documento Publicado',
        'descripcion': 'Notifica a los responsables cuando un documento es publicado y distribuido',
        'categoria': 'sistema',
        'color': '#10B981',  # Green
        'icono': 'book-open',
        'plantilla_titulo': 'Documento publicado: {codigo}',
        'plantilla_mensaje': 'El documento "{titulo}" ({codigo}) ha sido publicado (versión {version}) y está disponible para consulta.',
        'url_template': '/sistema-gestion/gestion-documental',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'DOCUMENTO_OBSOLETO',
        'nombre': 'Documento Marcado como Obsoleto',
        'descripcion': 'Notifica al elaborador cuando un documento es marcado como obsoleto',
        'categoria': 'alerta',
        'color': '#6B7280',  # Gray
        'icono': 'archive',
        'plantilla_titulo': 'Documento obsoleto: {codigo}',
        'plantilla_mensaje': 'El documento "{titulo}" ({codigo}) ha sido marcado como obsoleto y retirado de circulación.',
        'url_template': '/sistema-gestion/gestion-documental',
        'es_email': True,
        'es_push': False,
    },

    # =========================================================================
    # LECTURA VERIFICADA (Mejora 3 — ISO 7.3 Toma de Conciencia)
    # =========================================================================
    {
        'codigo': 'DOCUMENTO_LECTURA_REQUERIDA',
        'nombre': 'Lectura de Documento Requerida',
        'descripcion': 'Notifica al usuario que tiene un documento obligatorio pendiente de lectura y aceptación',
        'categoria': 'aprobacion',
        'color': '#6366F1',  # Indigo
        'icono': 'book-open',
        'plantilla_titulo': 'Lectura requerida: {codigo}',
        'plantilla_mensaje': 'Se le ha asignado la lectura obligatoria del documento "{titulo}" ({codigo}). Fecha límite: {fecha_limite}.',
        'url_template': '/mi-portal',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'DOCUMENTO_LECTURA_COMPLETADA',
        'nombre': 'Lectura de Documento Completada',
        'descripcion': 'Notifica al asignador que un usuario completó la lectura verificada de un documento',
        'categoria': 'sistema',
        'color': '#10B981',  # Green
        'icono': 'check-circle',
        'plantilla_titulo': 'Lectura completada: {codigo}',
        'plantilla_mensaje': 'El usuario {usuario_nombre} completó la lectura del documento "{titulo}" ({codigo}). Tiempo: {tiempo_lectura}.',
        'url_template': '/sistema-gestion/gestion-documental',
        'es_email': False,
        'es_push': True,
    },
    {
        'codigo': 'DOCUMENTO_LECTURA_VENCIDA',
        'nombre': 'Lectura de Documento Vencida',
        'descripcion': 'Alerta cuando el plazo para lectura obligatoria de un documento ha vencido',
        'categoria': 'alerta',
        'color': '#EF4444',  # Red
        'icono': 'alert-triangle',
        'plantilla_titulo': 'Lectura vencida: {codigo}',
        'plantilla_mensaje': 'El plazo para leer el documento "{titulo}" ({codigo}) ha vencido. Por favor complete la lectura lo antes posible.',
        'url_template': '/mi-portal',
        'es_email': True,
        'es_push': True,
    },

    # =========================================================================
    # FIRMA DIGITAL (Workflow de Firmas)
    # =========================================================================
    {
        'codigo': 'FIRMA_PENDIENTE',
        'nombre': 'Firma Pendiente',
        'descripcion': 'Notifica al usuario que tiene una firma digital pendiente',
        'categoria': 'aprobacion',
        'color': '#8B5CF6',  # Purple
        'icono': 'edit-3',
        'plantilla_titulo': 'Firma pendiente: {documento_titulo}',
        'plantilla_mensaje': 'Tienes una firma ({rol_firma}) pendiente para el documento "{documento_titulo}".',
        'url_template': '/gestion-documental/documentos?section=control_cambios',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'FIRMA_COMPLETADA',
        'nombre': 'Firma Completada',
        'descripcion': 'Notifica al creador del documento que alguien firmó',
        'categoria': 'aprobacion',
        'color': '#10B981',  # Green
        'icono': 'check-circle',
        'plantilla_titulo': 'Firma completada: {documento_titulo}',
        'plantilla_mensaje': '{firmante_nombre} ha firmado ({rol_firma}) el documento "{documento_titulo}".',
        'url_template': '/gestion-documental/documentos?section=control_cambios',
        'es_email': False,
        'es_push': True,
    },
    {
        'codigo': 'FIRMA_RECHAZADA',
        'nombre': 'Firma Rechazada',
        'descripcion': 'Notifica al creador que una firma fue rechazada',
        'categoria': 'alerta',
        'color': '#EF4444',  # Red
        'icono': 'x-circle',
        'plantilla_titulo': 'Firma rechazada: {documento_titulo}',
        'plantilla_mensaje': '{firmante_nombre} ha rechazado la firma del documento "{documento_titulo}". Motivo: {motivo}',
        'url_template': '/gestion-documental/documentos?section=control_cambios',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'FIRMA_DELEGADA',
        'nombre': 'Firma Delegada',
        'descripcion': 'Notifica al nuevo firmante que le delegaron una firma',
        'categoria': 'sistema',
        'color': '#F59E0B',  # Amber
        'icono': 'user-check',
        'plantilla_titulo': 'Firma delegada: {documento_titulo}',
        'plantilla_mensaje': '{delegante} te ha delegado la firma ({rol_firma}) del documento "{documento_titulo}".',
        'url_template': '/gestion-documental/documentos?section=control_cambios',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'DOCUMENTO_TODAS_FIRMAS',
        'nombre': 'Documento con Todas las Firmas',
        'descripcion': 'Notifica cuando un documento recibe todas las firmas requeridas',
        'categoria': 'sistema',
        'color': '#10B981',  # Green
        'icono': 'award',
        'plantilla_titulo': 'Documento aprobado: {documento_titulo}',
        'plantilla_mensaje': 'El documento "{documento_titulo}" ha sido aprobado con todas las firmas completadas.',
        'url_template': '/gestion-documental/documentos?section=control_cambios',
        'es_email': True,
        'es_push': True,
    },

    # =========================================================================
    # AUDITORÍAS INTERNAS — MEJORA CONTINUA
    # =========================================================================
    {
        'codigo': 'AUDITORIA_PROGRAMA_APROBADO',
        'nombre': 'Programa de Auditoría Aprobado',
        'descripcion': 'Notifica cuando un programa de auditoría es aprobado',
        'categoria': 'sistema',
        'color': '#10B981',
        'icono': 'check-circle',
        'plantilla_titulo': 'Programa aprobado: {codigo}',
        'plantilla_mensaje': 'El programa de auditoría "{nombre}" ha sido aprobado.',
        'url_template': '/sistema-gestion/auditorias',
        'es_email': True,
        'es_push': False,
    },
    {
        'codigo': 'AUDITORIA_PROGRAMA_INICIADO',
        'nombre': 'Programa de Auditoría Iniciado',
        'descripcion': 'Notifica cuando un programa de auditoría inicia ejecución',
        'categoria': 'sistema',
        'color': '#3B82F6',
        'icono': 'play-circle',
        'plantilla_titulo': 'Programa iniciado: {codigo}',
        'plantilla_mensaje': 'El programa "{nombre}" ha iniciado ejecución.',
        'url_template': '/sistema-gestion/auditorias',
        'es_email': False,
        'es_push': False,
    },
    {
        'codigo': 'AUDITORIA_PROGRAMA_COMPLETADO',
        'nombre': 'Programa de Auditoría Completado',
        'descripcion': 'Notifica cuando un programa de auditoría se completa',
        'categoria': 'sistema',
        'color': '#10B981',
        'icono': 'check-circle',
        'plantilla_titulo': 'Programa completado: {codigo}',
        'plantilla_mensaje': 'El programa "{nombre}" ha sido completado exitosamente.',
        'url_template': '/sistema-gestion/auditorias',
        'es_email': True,
        'es_push': False,
    },
    {
        'codigo': 'AUDITORIA_INICIADA',
        'nombre': 'Auditoría Iniciada',
        'descripcion': 'Notifica al auditor líder cuando una auditoría inicia',
        'categoria': 'tarea',
        'color': '#3B82F6',
        'icono': 'search',
        'plantilla_titulo': 'Auditoría iniciada: {codigo}',
        'plantilla_mensaje': 'La auditoría "{titulo}" ha iniciado ejecución.',
        'url_template': '/sistema-gestion/auditorias',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'AUDITORIA_CERRADA',
        'nombre': 'Auditoría Cerrada',
        'descripcion': 'Notifica al auditor líder cuando una auditoría se cierra',
        'categoria': 'sistema',
        'color': '#10B981',
        'icono': 'check-circle',
        'plantilla_titulo': 'Auditoría cerrada: {codigo}',
        'plantilla_mensaje': 'La auditoría "{titulo}" ha sido cerrada.',
        'url_template': '/sistema-gestion/auditorias',
        'es_email': True,
        'es_push': False,
    },
    {
        'codigo': 'HALLAZGO_COMUNICADO',
        'nombre': 'Hallazgo Comunicado',
        'descripcion': 'Notifica al responsable del proceso cuando un hallazgo le es comunicado',
        'categoria': 'alerta',
        'color': '#F59E0B',
        'icono': 'alert-circle',
        'plantilla_titulo': 'Hallazgo comunicado: {codigo}',
        'plantilla_mensaje': 'El hallazgo "{titulo}" le ha sido comunicado. Requiere su atención.',
        'url_template': '/sistema-gestion/auditorias',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'HALLAZGO_VERIFICADO',
        'nombre': 'Hallazgo Verificado',
        'descripcion': 'Notifica cuando un hallazgo ha sido verificado',
        'categoria': 'sistema',
        'color': '#8B5CF6',
        'icono': 'check-square',
        'plantilla_titulo': 'Hallazgo verificado: {codigo}',
        'plantilla_mensaje': 'El hallazgo "{titulo}" ha sido verificado.',
        'url_template': '/sistema-gestion/auditorias',
        'es_email': False,
        'es_push': True,
    },
    {
        'codigo': 'HALLAZGO_CERRADO',
        'nombre': 'Hallazgo Cerrado',
        'descripcion': 'Notifica cuando un hallazgo ha sido cerrado exitosamente',
        'categoria': 'sistema',
        'color': '#10B981',
        'icono': 'check-circle',
        'plantilla_titulo': 'Hallazgo cerrado: {codigo}',
        'plantilla_mensaje': 'El hallazgo "{titulo}" ha sido cerrado exitosamente.',
        'url_template': '/sistema-gestion/auditorias',
        'es_email': True,
        'es_push': False,
    },

    # =========================================================================
    # ONBOARDING — Activación y perfil de usuario
    # =========================================================================
    {
        'codigo': 'PERFIL_INCOMPLETO',
        'nombre': 'Completa tu perfil',
        'descripcion': 'Recuerda al usuario completar su perfil tras el primer ingreso al sistema',
        'categoria': 'recordatorio',
        'color': '#6366F1',  # Indigo
        'icono': 'UserCircle',
        'plantilla_titulo': 'Tu perfil está al {porcentaje}%',
        'plantilla_mensaje': 'Hola {nombre}, tu perfil en {empresa} está incompleto. Complétalo para acceder a todas las funciones.',
        'url_template': '/mi-portal',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'FIRMA_PENDIENTE_ONBOARDING',
        'nombre': 'Configura tu firma digital',
        'descripcion': 'Notifica al usuario que aún no ha configurado su firma digital durante el onboarding',
        'categoria': 'tarea',
        'color': '#8B5CF6',  # Purple
        'icono': 'PenTool',
        'plantilla_titulo': 'Configura tu firma digital',
        'plantilla_mensaje': 'Hola {nombre}, aún no has configurado tu firma digital en {empresa}. Es necesaria para firmar documentos y contratos.',
        'url_template': '/mi-portal',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'EMERGENCIA_PENDIENTE',
        'nombre': 'Actualiza datos de emergencia',
        'descripcion': 'Recuerda al usuario registrar o actualizar sus contactos y datos de emergencia',
        'categoria': 'recordatorio',
        'color': '#F59E0B',  # Amber
        'icono': 'AlertTriangle',
        'plantilla_titulo': 'Actualiza tus datos de emergencia',
        'plantilla_mensaje': 'Hola {nombre}, no tienes datos de emergencia registrados en {empresa}. Por tu seguridad, completa esta información.',
        'url_template': '/mi-portal',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'ACTIVACION_PENDIENTE',
        'nombre': 'Usuario no activó su cuenta',
        'descripcion': 'Alerta al administrador cuando un usuario invitado no ha activado su cuenta',
        'categoria': 'alerta',
        'color': '#EF4444',  # Red
        'icono': 'UserX',
        'plantilla_titulo': 'Usuario sin activar: {usuario_nombre}',
        'plantilla_mensaje': 'El usuario {usuario_nombre} ({usuario_email}) aún no ha activado su cuenta en {empresa}. La invitación vence en {dias_restantes} días.',
        'url_template': '/talento/colaboradores',
        'es_email': False,
        'es_push': True,
    },
    {
        'codigo': 'EMPLEADOS_SIN_ACTIVAR',
        'nombre': 'Empleados pendientes de activación',
        'descripcion': 'Notifica al administrador sobre empleados que no han configurado su contraseña',
        'categoria': 'recordatorio',
        'color': '#F59E0B',  # Amber
        'icono': 'user-plus',
        'plantilla_titulo': 'Tienes {count} empleados pendientes de activación',
        'plantilla_mensaje': 'Los siguientes empleados no han configurado su contraseña: {nombres}. Puedes reenviar la invitación desde el panel de usuarios.',
        'url_template': '/configuracion/usuarios',
        'es_email': False,
        'es_push': False,
    },
]
