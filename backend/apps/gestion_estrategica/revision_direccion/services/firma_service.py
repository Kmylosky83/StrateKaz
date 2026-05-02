"""
Servicio de Firma Digital para Actas de Revisión por la Dirección.

Integra ActaRevision con el sistema de FirmaDigital de workflow_engine,
usando apps.get_model() para evitar imports directos cross-módulo.
"""
import hashlib
import json
import logging

from django.apps import apps
from django.utils import timezone

logger = logging.getLogger(__name__)

# Roles de firma para el acta
ROLES_ACTA = ['ELABORO', 'REVISO', 'APROBO']

ROL_LABELS = {
    'ELABORO': 'Elaboró',
    'REVISO': 'Revisó',
    'APROBO': 'Aprobó',
}


class ActaFirmaService:
    """
    Gestiona el flujo de firma digital para actas de revisión por la dirección.

    Flujo:
    1. iniciar_proceso_firma() — Crea registros placeholder para los 3 roles
    2. firmar_acta() — Registra la firma de un usuario en su rol
    3. get_estado_firmas() — Consulta el estado actual de todas las firmas
    """

    @staticmethod
    def _get_acta(acta_id: int):
        """Obtiene el acta de revisión."""
        from ..models import ActaRevision
        return ActaRevision.objects.select_related(
            'programa', 'elaborado_por', 'revisado_por', 'aprobado_por'
        ).get(pk=acta_id)

    @staticmethod
    def _get_firma_digital_model():
        """Obtiene el modelo FirmaDigital via apps.get_model (cross-module safe)."""
        return apps.get_model('infra_firma_digital', 'FirmaDigital')

    @staticmethod
    def _get_historial_firma_model():
        """Obtiene el modelo HistorialFirma via apps.get_model (cross-module safe)."""
        return apps.get_model('infra_firma_digital', 'HistorialFirma')

    @staticmethod
    def _generate_acta_hash(acta) -> str:
        """Genera un hash SHA-256 del contenido del acta."""
        data = {
            'numero_acta': acta.numero_acta,
            'fecha': str(acta.fecha),
            'programa_id': acta.programa_id,
            'conclusiones': acta.conclusiones_generales or '',
            'decisiones_mejora': acta.decisiones_mejora or '',
            'evaluacion': acta.evaluacion_sistema,
        }
        content = json.dumps(data, sort_keys=True)
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

    @classmethod
    def iniciar_proceso_firma(cls, acta_id: int, usuario) -> dict:
        """
        Inicia el proceso de firma para un acta de revisión.

        Crea un registro FirmaDigital tipo 'pendiente' para cada uno de los
        3 roles (ELABORO, REVISO, APROBO) vinculado a los usuarios asignados.

        Args:
            acta_id: ID del ActaRevision
            usuario: Usuario que inicia el proceso

        Returns:
            dict con firma_documento_id y estado de cada slot
        """
        from django.contrib.contenttypes.models import ContentType
        from ..models import ActaRevision

        acta = cls._get_acta(acta_id)
        FirmaDigital = cls._get_firma_digital_model()
        HistorialFirma = cls._get_historial_firma_model()

        # Verificar que el acta no tenga ya un proceso de firma
        if acta.firma_documento_id:
            # Ya existe, retornar el estado actual
            return cls.get_estado_firmas(acta_id)

        # Generar hash del documento
        doc_hash = cls._generate_acta_hash(acta)

        # Obtener ContentType del acta
        ct = ContentType.objects.get_for_model(ActaRevision)

        # Mapear roles a usuarios del acta
        roles_usuarios = {
            'ELABORO': acta.elaborado_por,
            'REVISO': acta.revisado_por,
            'APROBO': acta.aprobado_por,
        }

        firmas_creadas = []
        primera_firma_id = None

        for orden, rol in enumerate(ROLES_ACTA, start=1):
            usuario_rol = roles_usuarios.get(rol)
            if not usuario_rol:
                continue

            firma = FirmaDigital.objects.create(
                content_type=ct,
                object_id=acta.pk,
                usuario=usuario_rol,
                cargo=usuario_rol.cargo if hasattr(usuario_rol, 'cargo') and usuario_rol.cargo else None,
                rol_firma=rol,
                firma_imagen='',  # Vacío hasta que firme
                documento_hash=doc_hash,
                firma_hash='',  # Se calcula al firmar
                ip_address='0.0.0.0',
                estado='PENDIENTE',
                orden=orden,
                comentarios='',
                configuracion_flujo=None,
            )

            if primera_firma_id is None:
                primera_firma_id = firma.id

            # Registrar en historial
            HistorialFirma.objects.create(
                firma=firma,
                accion='FIRMA_CREADA',
                usuario=usuario,
                descripcion=f'Proceso de firma iniciado para rol {ROL_LABELS.get(rol, rol)}',
                metadatos={
                    'acta_id': acta_id,
                    'rol': rol,
                    'usuario_asignado_id': usuario_rol.id,
                    'usuario_asignado_nombre': usuario_rol.get_full_name(),
                },
            )

            firmas_creadas.append({
                'firma_id': firma.id,
                'rol': rol,
                'usuario_id': usuario_rol.id,
                'usuario_nombre': usuario_rol.get_full_name(),
            })

        # Guardar la referencia en el acta (usamos el ID de la primera firma como referencia grupal)
        if primera_firma_id:
            acta.firma_documento_id = primera_firma_id
            acta.save(update_fields=['firma_documento_id'])

        return {
            'firma_documento_id': primera_firma_id,
            'estado': 'en_proceso',
            'firmas_creadas': firmas_creadas,
            'hash_documento': doc_hash,
        }

    @classmethod
    def firmar_acta(
        cls,
        acta_id: int,
        usuario,
        rol_firma: str,
        firma_imagen_base64: str,
        observaciones: str = '',
        ip_address: str = '0.0.0.0',
        user_agent: str = '',
    ) -> dict:
        """
        Registra la firma digital de un usuario para su rol asignado.

        Args:
            acta_id: ID del ActaRevision
            usuario: Usuario que firma
            rol_firma: Rol de la firma (ELABORO, REVISO, APROBO)
            firma_imagen_base64: Imagen de la firma en base64
            observaciones: Comentarios opcionales
            ip_address: IP del firmante
            user_agent: User-Agent del navegador

        Returns:
            dict con el resultado de la firma
        """
        from django.contrib.contenttypes.models import ContentType
        from ..models import ActaRevision

        acta = cls._get_acta(acta_id)
        FirmaDigital = cls._get_firma_digital_model()
        HistorialFirma = cls._get_historial_firma_model()

        if rol_firma not in ROLES_ACTA:
            raise ValueError(f'Rol de firma inválido: {rol_firma}. Debe ser uno de {ROLES_ACTA}')

        ct = ContentType.objects.get_for_model(ActaRevision)

        # Buscar la firma pendiente para este rol y acta
        firma = FirmaDigital.objects.filter(
            content_type=ct,
            object_id=acta.pk,
            rol_firma=rol_firma,
            estado='PENDIENTE',
        ).first()

        if not firma:
            raise ValueError(
                f'No se encontró una firma pendiente para el rol {rol_firma} en el acta {acta_id}. '
                'Puede que ya haya sido firmada o que no se haya iniciado el proceso.'
            )

        # Verificar que el usuario es el asignado
        if firma.usuario_id != usuario.id:
            raise PermissionError(
                f'El usuario {usuario.get_full_name()} no está autorizado para firmar '
                f'como {ROL_LABELS.get(rol_firma, rol_firma)}. '
                f'Asignado: {firma.usuario.get_full_name()}'
            )

        # Actualizar la firma
        firma.firma_imagen = firma_imagen_base64
        firma.ip_address = ip_address
        firma.user_agent = user_agent
        firma.comentarios = observaciones
        firma.estado = 'FIRMADO'
        firma.firma_hash = ''  # Se calculará en save()
        firma.save()

        # Registrar en historial
        HistorialFirma.objects.create(
            firma=firma,
            accion='FIRMA_VALIDADA',
            usuario=usuario,
            descripcion=f'{usuario.get_full_name()} firmó como {ROL_LABELS.get(rol_firma, rol_firma)}',
            metadatos={
                'acta_id': acta_id,
                'rol': rol_firma,
                'ip_address': ip_address,
            },
            ip_address=ip_address,
        )

        # Actualizar fecha en el acta según el rol
        now = timezone.now().date()
        if rol_firma == 'ELABORO':
            acta.fecha_elaboracion = now
        elif rol_firma == 'REVISO':
            acta.fecha_revision = now
        elif rol_firma == 'APROBO':
            acta.fecha_aprobacion = now

        update_fields = ['fecha_elaboracion', 'fecha_revision', 'fecha_aprobacion']

        # Verificar si todas las firmas están completas
        todas_firmadas = cls._todas_firmas_completas(acta)
        if todas_firmadas:
            acta.evaluacion_sistema = acta.evaluacion_sistema  # mantener
            # No cambiamos el estado aquí pues eso ya se maneja por separado

        acta.save(update_fields=update_fields)

        return {
            'firma_id': firma.id,
            'rol': rol_firma,
            'usuario_nombre': usuario.get_full_name(),
            'fecha_firma': firma.fecha_firma.isoformat() if firma.fecha_firma else now.isoformat(),
            'estado': firma.estado,
            'todas_firmadas': todas_firmadas,
        }

    @classmethod
    def _todas_firmas_completas(cls, acta) -> bool:
        """Verifica si todos los roles han firmado."""
        from django.contrib.contenttypes.models import ContentType
        from ..models import ActaRevision

        FirmaDigital = cls._get_firma_digital_model()
        ct = ContentType.objects.get_for_model(ActaRevision)

        firmas = FirmaDigital.objects.filter(
            content_type=ct,
            object_id=acta.pk,
        )

        if not firmas.exists():
            return False

        pendientes = firmas.filter(estado='PENDIENTE').count()
        return pendientes == 0

    @classmethod
    def get_estado_firmas(cls, acta_id: int) -> dict:
        """
        Retorna el estado actual de firmas para un acta.

        Returns:
            dict con firma_documento_id, estado global, y array de firmas por slot
        """
        from django.contrib.contenttypes.models import ContentType
        from ..models import ActaRevision

        acta = cls._get_acta(acta_id)
        FirmaDigital = cls._get_firma_digital_model()
        ct = ContentType.objects.get_for_model(ActaRevision)

        firmas = FirmaDigital.objects.filter(
            content_type=ct,
            object_id=acta.pk,
        ).select_related('usuario').order_by('orden')

        if not firmas.exists():
            # No hay proceso de firma iniciado — retornar slots vacíos basados en el acta
            slots = []
            for rol in ROLES_ACTA:
                usuario_map = {
                    'ELABORO': acta.elaborado_por,
                    'REVISO': acta.revisado_por,
                    'APROBO': acta.aprobado_por,
                }
                user = usuario_map.get(rol)
                slots.append({
                    'rol': rol,
                    'rol_label': ROL_LABELS.get(rol, rol),
                    'usuario_id': user.id if user else None,
                    'usuario_nombre': user.get_full_name() if user else 'Sin asignar',
                    'firmado': False,
                    'fecha_firma': None,
                    'firma_imagen_url': None,
                })

            return {
                'firma_documento_id': acta.firma_documento_id,
                'estado': 'pendiente',
                'firmas': slots,
            }

        # Mapear firmas existentes
        slots = []
        todas_firmadas = True
        alguna_firmada = False

        for firma in firmas:
            firmado = firma.estado == 'FIRMADO'
            if firmado:
                alguna_firmada = True
            else:
                todas_firmadas = False

            slots.append({
                'rol': firma.rol_firma,
                'rol_label': ROL_LABELS.get(firma.rol_firma, firma.rol_firma),
                'usuario_id': firma.usuario_id,
                'usuario_nombre': firma.usuario.get_full_name() if firma.usuario else 'Sin asignar',
                'firmado': firmado,
                'fecha_firma': firma.fecha_firma.isoformat() if firma.fecha_firma and firmado else None,
                'firma_imagen_url': firma.firma_imagen[:100] + '...' if firmado and firma.firma_imagen else None,
                'observaciones': firma.comentarios if firmado else None,
            })

        if todas_firmadas:
            estado = 'completado'
        elif alguna_firmada:
            estado = 'en_proceso'
        else:
            estado = 'pendiente'

        return {
            'firma_documento_id': acta.firma_documento_id,
            'estado': estado,
            'firmas': slots,
        }
