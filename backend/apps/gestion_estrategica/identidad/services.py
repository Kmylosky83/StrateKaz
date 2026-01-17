"""
Servicios de integración del módulo Identidad Corporativa

GestorDocumentalService: Integración con el módulo Sistema Documental
- Envío automático de políticas firmadas
- Callback para actualización de estados

Fase 0.3.4: Usa exclusivamente FirmaDigital (workflow_engine).
Los modelos legacy (FirmaPolitica) están deprecados.
"""
import logging
from typing import Optional, Dict, Any, List
from django.utils import timezone
from django.apps import apps
from django.contrib.contenttypes.models import ContentType

logger = logging.getLogger(__name__)


class GestorDocumentalService:
    """
    Servicio de integración con el Gestor Documental.

    Maneja el envío automático de políticas firmadas al módulo de
    Sistema Documental para su codificación, versionamiento y publicación.

    Flujo:
    1. Política en IDENTIDAD completa proceso de firmas → estado FIRMADO
    2. Este servicio envía automáticamente al Gestor Documental
    3. Gestor Documental asigna código, crea documento, publica
    4. Callback actualiza la política en IDENTIDAD a estado VIGENTE
    """

    @staticmethod
    def is_documental_available() -> bool:
        """
        Verifica si el módulo de Sistema Documental está disponible.

        Returns:
            bool: True si el módulo está instalado y activo
        """
        try:
            apps.get_model('sistema_documental', 'Documento')
            return True
        except LookupError:
            return False

    @classmethod
    def enviar_politica_a_documental(
        cls,
        politica,
        firmas_digitales: List,
        request_user,
        clasificacion: str = 'INTERNO',
        areas_aplicacion: list = None,
        observaciones: str = ''
    ) -> Dict[str, Any]:
        """
        Envía una política firmada al Gestor Documental.

        Fase 0.3.4: Usa FirmaDigital directamente.

        Args:
            politica: Instancia de PoliticaEspecifica
            firmas_digitales: Lista de FirmaDigital completadas
            request_user: Usuario que solicita el envío
            clasificacion: Nivel de clasificación del documento
            areas_aplicacion: Lista de IDs de áreas donde aplica
            observaciones: Observaciones adicionales

        Returns:
            dict: Resultado de la operación con detalles del documento creado

        Raises:
            ValueError: Si la política no está en estado válido
            RuntimeError: Si el Gestor Documental no está disponible
        """
        if not cls.is_documental_available():
            raise RuntimeError(
                "El módulo Sistema Documental no está disponible. "
                "Verifique que esté instalado en INSTALLED_APPS."
            )

        # Validar estado de la política
        if politica.status not in ['FIRMADO', 'EN_REVISION', 'POR_CODIFICAR']:
            raise ValueError(
                f"La política debe estar en estado FIRMADO, EN_REVISION o POR_CODIFICAR, "
                f"estado actual: {politica.status}"
            )

        # Validar que hay firmas
        if not firmas_digitales:
            raise ValueError("Debe haber al menos una firma digital completada")

        # Preparar datos para el Gestor Documental
        datos_documental = cls._preparar_datos_documental(
            politica=politica,
            firmas_digitales=firmas_digitales,
            request_user=request_user,
            clasificacion=clasificacion,
            areas_aplicacion=areas_aplicacion or [],
            observaciones=observaciones
        )

        # Importar el modelo de Documento del Gestor Documental
        from apps.hseq_management.sistema_documental.models import (
            TipoDocumento, Documento, VersionDocumento,
            FirmaDocumento, ControlDocumental
        )
        from django.contrib.auth import get_user_model
        User = get_user_model()

        empresa_id = datos_documental['empresa_id']
        es_actualizacion = datos_documental.get('es_actualizacion', False)

        # 1. Obtener o crear TipoDocumento para POLITICA
        tipo_documento, created = TipoDocumento.objects.get_or_create(
            empresa_id=empresa_id,
            codigo='POL',
            defaults={
                'nombre': 'Política',
                'descripcion': 'Políticas corporativas del sistema de gestión',
                'nivel_documento': 'ESTRATEGICO',
                'prefijo_codigo': 'POL-',
                'requiere_aprobacion': True,
                'requiere_firma': True,
                'tiempo_retencion_años': 10,
                'color_identificacion': '#8B5CF6',
                'is_active': True,
                'orden': 1,
            }
        )

        # 2. Determinar código del documento
        norma_code = datos_documental.get('norma_iso_code', 'GEN')
        codigo_existente = datos_documental.get('codigo_existente')

        if es_actualizacion and codigo_existente:
            codigo_documento = codigo_existente
        else:
            codigo_documento = cls._generar_codigo_politica(
                empresa_id=empresa_id,
                norma_code=norma_code
            )

        # 3. Obtener usuario elaborador
        try:
            elaborado_por = User.objects.get(id=datos_documental['solicitado_por'])
        except User.DoesNotExist:
            elaborado_por = request_user

        # 4. Manejar documento anterior si es actualización
        documento_anterior = None
        documento_anterior_id = datos_documental.get('documento_anterior_id')

        if es_actualizacion and documento_anterior_id:
            documento_anterior = Documento.objects.filter(
                id=documento_anterior_id,
                empresa_id=empresa_id
            ).first()

            if documento_anterior:
                # Marcar versiones anteriores como no actuales
                VersionDocumento.objects.filter(
                    documento=documento_anterior,
                    is_version_actual=True
                ).update(is_version_actual=False)

                # Marcar documento anterior como OBSOLETO
                documento_anterior.estado = 'OBSOLETO'
                documento_anterior.save(update_fields=['estado', 'updated_at'])

        # 5. Crear el Documento
        motivo_cambio = datos_documental.get('motivo_cambio', '')
        resumen = f"Política de {norma_code} importada desde Identidad Corporativa"
        if es_actualizacion:
            resumen = f"Nueva versión de política {norma_code}. {motivo_cambio}"

        numero_revision = 0
        if es_actualizacion and documento_anterior:
            numero_revision = documento_anterior.numero_revision + 1
        elif es_actualizacion:
            numero_revision = 1

        documento = Documento.objects.create(
            codigo=codigo_documento,
            titulo=datos_documental['titulo'],
            tipo_documento=tipo_documento,
            resumen=resumen,
            contenido=datos_documental['contenido'],
            palabras_clave=datos_documental.get('palabras_clave', []),
            version_actual=datos_documental.get('version', '1.0'),
            numero_revision=numero_revision,
            estado='APROBADO',
            clasificacion=clasificacion,
            fecha_aprobacion=timezone.now().date(),
            elaborado_por=elaborado_por,
            aprobado_por=elaborado_por,
            areas_aplicacion=areas_aplicacion or [],
            observaciones=observaciones,
            empresa_id=empresa_id,
        )

        # 6. Vincular FirmaDigital existentes al documento
        # Fase 0.3.3: Usamos FirmaDigital del workflow_engine en lugar de crear
        # FirmaDocumento duplicados. Las FirmaDigital usan GenericForeignKey
        # y pueden apuntar a cualquier modelo.
        firmas_info = datos_documental.get('firmas', [])
        firmas_digitales = datos_documental.get('firmas_digitales', [])

        # Si ya tenemos FirmaDigital, las referenciamos directamente
        if firmas_digitales:
            # Las firmas ya están vinculadas al documento a través de GenericForeignKey
            logger.info(
                f"Documento {documento.id} vinculado con {len(firmas_digitales)} firmas digitales existentes"
            )
        else:
            # Fallback: crear FirmaDocumento legacy solo si no hay FirmaDigital
            # Esto mantiene compatibilidad durante la migración
            for firma_data in firmas_info:
                try:
                    firmante = User.objects.get(id=firma_data['usuario_id']) if firma_data.get('usuario_id') else elaborado_por
                except User.DoesNotExist:
                    firmante = elaborado_por

                # Mapear rol de Identidad a tipo de firma de Documental
                tipo_firma_map = {
                    'ELABORO': 'ELABORACION',
                    'REVISO': 'REVISION',
                    'REVISO_TECNICO': 'REVISION',
                    'REVISO_JURIDICO': 'REVISION',
                    'APROBO': 'APROBACION',
                    'APROBO_DIRECTOR': 'APROBACION',
                    'APROBO_GERENTE': 'APROBACION',
                    'APROBO_REPRESENTANTE_LEGAL': 'APROBACION',
                    'VALIDO': 'VALIDACION',
                    'AUTORIZO': 'APROBACION',
                }
                tipo_firma = tipo_firma_map.get(firma_data.get('rol', ''), 'VALIDACION')

                FirmaDocumento.objects.create(
                    documento=documento,
                    tipo_firma=tipo_firma,
                    firmante=firmante,
                    cargo_firmante=firma_data.get('cargo_nombre', ''),
                    estado='FIRMADO',
                    fecha_firma=timezone.now(),
                    comentarios=f"Firma importada desde Identidad - Proceso #{proceso_firma.id}",
                    orden_firma=firma_data.get('orden', 1),
                    checksum_documento=firma_data.get('firma_hash', ''),
                    empresa_id=empresa_id,
                )

        # 7. Crear versión del documento
        tipo_cambio = 'CREACION' if not es_actualizacion else 'ACTUALIZACION'
        descripcion_cambios = 'Política importada desde Identidad Corporativa con firmas completas'
        if es_actualizacion:
            version_anterior = datos_documental.get('version_anterior', '?')
            descripcion_cambios = f"Actualización de versión {version_anterior} a {datos_documental.get('version', '?')}. {motivo_cambio}"

        VersionDocumento.objects.create(
            documento=documento,
            numero_version=datos_documental.get('version', '1.0'),
            tipo_cambio=tipo_cambio,
            contenido_snapshot=datos_documental['contenido'],
            descripcion_cambios=descripcion_cambios,
            creado_por=elaborado_por,
            aprobado_por=elaborado_por,
            fecha_aprobacion=timezone.now(),
            is_version_actual=True,
            empresa_id=empresa_id,
        )

        # 8. Publicar documento
        documento.estado = 'PUBLICADO'
        documento.fecha_publicacion = timezone.now().date()
        documento.fecha_vigencia = timezone.now().date()
        documento.save()

        # 9. Crear control de distribución
        observaciones_control = f"Distribución automática desde Identidad Corporativa. Política ID: {politica.id}"
        if es_actualizacion:
            observaciones_control = f"Nueva versión de política. {observaciones_control}"

        ControlDocumental.objects.create(
            documento=documento,
            tipo_control='DISTRIBUCION',
            fecha_distribucion=timezone.now().date(),
            medio_distribucion='DIGITAL',
            areas_distribucion=areas_aplicacion or [],
            observaciones=observaciones_control,
            empresa_id=empresa_id,
        )

        # 10. Actualizar estado de política en Identidad (callback)
        cls._actualizar_politica_identidad(
            politica=politica,
            documento_id=documento.id,
            codigo_documento=codigo_documento,
            es_actualizacion=es_actualizacion,
        )

        logger.info(
            f"Política {politica.id} enviada exitosamente al Gestor Documental. "
            f"Documento: {documento.id} - Código: {codigo_documento}"
        )

        return {
            'success': True,
            'detail': 'Política enviada y publicada exitosamente',
            'documento_id': documento.id,
            'codigo': documento.codigo,
            'titulo': documento.titulo,
            'estado': documento.estado,
            'version': documento.version_actual,
            'fecha_publicacion': documento.fecha_publicacion,
            'total_firmas_registradas': len(firmas_info),
            'url_documento': f"/api/hseq/documentos/{documento.id}/",
            'es_actualizacion': es_actualizacion,
            'origen': {
                'modulo': 'IDENTIDAD_CORPORATIVA',
                'tipo': datos_documental['tipo_origen'],
                'politica_id': politica.id,
            }
        }

    @staticmethod
    def _preparar_datos_documental(
        politica,
        firmas_digitales: List,
        request_user,
        clasificacion: str,
        areas_aplicacion: list,
        observaciones: str
    ) -> Dict[str, Any]:
        """
        Prepara los datos estructurados para el Gestor Documental.

        Fase 0.3.4: Usa exclusivamente FirmaDigital.
        """
        # Determinar tipo de política
        tipo_origen = 'POLITICA_ESPECIFICA'
        if hasattr(politica, 'identity') and not hasattr(politica, 'norma_iso'):
            tipo_origen = 'POLITICA_INTEGRAL'

        # Obtener código de norma ISO
        norma_code = 'GEN'
        if hasattr(politica, 'norma_iso') and politica.norma_iso:
            norma_code = politica.norma_iso.code

        # Preparar información de firmas desde FirmaDigital
        firmas_info = []
        firmas_ids = []

        for firma in firmas_digitales:
            firmas_ids.append(str(firma.id))
            firmas_info.append({
                'orden': firma.orden,
                'rol': firma.rol_firma,
                'rol_display': firma.get_rol_firma_display(),
                'cargo_id': str(firma.cargo_id) if firma.cargo_id else None,
                'cargo_nombre': firma.cargo.name if firma.cargo else '',
                'usuario_id': firma.usuario_id,
                'usuario_nombre': firma.usuario.get_full_name() if firma.usuario else None,
                'fecha_firma': firma.fecha_firma.isoformat() if firma.fecha_firma else None,
                'firma_hash': firma.firma_hash,
                'firma_digital_id': str(firma.id),
            })

        # Detectar si es actualización
        es_actualizacion = bool(getattr(politica, 'change_reason', '')) and politica.version != '1.0'

        # Buscar política anterior si es actualización
        documento_anterior_id = None
        codigo_existente = None
        version_anterior = None

        if es_actualizacion:
            from .models import PoliticaEspecifica

            politica_anterior = PoliticaEspecifica.objects.filter(
                identity=politica.identity,
                norma_iso=politica.norma_iso,
                title=politica.title,
                status__in=['VIGENTE', 'OBSOLETO'],
                code__isnull=False
            ).exclude(id=politica.id).order_by('-version').first()

            if politica_anterior:
                version_anterior = politica_anterior.version
                documento_anterior_id = politica_anterior.documento_id
                codigo_existente = politica_anterior.code

        # Obtener empresa_id
        empresa_id = None
        if hasattr(politica, 'identity') and politica.identity:
            empresa_id = politica.identity.empresa_id

        # Obtener fecha de la última firma
        fecha_ultima_firma = None
        if firmas_digitales:
            ultima = max(firmas_digitales, key=lambda f: f.fecha_firma or timezone.now())
            fecha_ultima_firma = ultima.fecha_firma.isoformat() if ultima.fecha_firma else None

        return {
            'origen': 'IDENTIDAD_CORPORATIVA',
            'tipo_origen': tipo_origen,
            'politica_id': politica.id,
            'empresa_id': empresa_id,
            'titulo': politica.title,
            'contenido': politica.content,
            'version': politica.version,
            'norma_iso_code': norma_code,
            'area_id': getattr(politica, 'area_id', None),
            'area_nombre': politica.area.nombre if hasattr(politica, 'area') and politica.area else None,
            'palabras_clave': getattr(politica, 'keywords', []) or [],
            'clasificacion': clasificacion,
            'areas_aplicacion': areas_aplicacion,
            'observaciones': observaciones,
            'firmas': firmas_info,
            'firmas_digitales': firmas_ids,  # Fase 0.3.4: IDs de FirmaDigital
            'fecha_firma_completada': fecha_ultima_firma,
            'solicitado_por': request_user.id,
            'solicitado_por_nombre': request_user.get_full_name(),
            'fecha_solicitud': timezone.now().isoformat(),
            'es_actualizacion': es_actualizacion,
            'documento_anterior_id': documento_anterior_id,
            'codigo_existente': codigo_existente,
            'version_anterior': version_anterior,
            'motivo_cambio': getattr(politica, 'change_reason', '') or '',
        }

    @staticmethod
    def _generar_codigo_politica(empresa_id: int, norma_code: str) -> str:
        """
        Genera código único para políticas: POL-{NORMA}-{SECUENCIAL}

        Ejemplos:
        - POL-SST-001 (Primera política de SST)
        - POL-CA-002 (Segunda política de Calidad)
        - POL-GEN-001 (Política general)
        """
        from apps.hseq_management.sistema_documental.models import Documento

        prefijo = f"POL-{norma_code}-"

        # Buscar el último documento con este prefijo
        ultimo_doc = Documento.objects.filter(
            empresa_id=empresa_id,
            codigo__startswith=prefijo
        ).order_by('-codigo').first()

        if ultimo_doc:
            try:
                ultimo_num = int(ultimo_doc.codigo.split('-')[-1])
                nuevo_num = ultimo_num + 1
            except (ValueError, IndexError):
                nuevo_num = 1
        else:
            nuevo_num = 1

        return f"{prefijo}{nuevo_num:03d}"

    @staticmethod
    def _actualizar_politica_identidad(
        politica,
        documento_id: int,
        codigo_documento: str,
        es_actualizacion: bool = False
    ) -> None:
        """
        Callback: Actualiza el estado de la política en Identidad a VIGENTE.

        Actualiza:
        - status: VIGENTE
        - code: Código oficial del documento (POL-SST-001)
        - documento_id: ID del documento en Gestor Documental
        - effective_date: Fecha de vigencia

        Si es_actualizacion=True, también marca versiones anteriores como OBSOLETO.
        """
        from .models import PoliticaEspecifica

        # Si es actualización, marcar versiones anteriores como OBSOLETO
        if es_actualizacion and codigo_documento:
            PoliticaEspecifica.objects.filter(
                code=codigo_documento,
                status='VIGENTE'
            ).exclude(id=politica.id).update(
                status='OBSOLETO',
                updated_at=timezone.now()
            )

        # Actualizar la política actual
        politica.status = 'VIGENTE'
        politica.effective_date = timezone.now().date()
        politica.code = codigo_documento
        politica.documento_id = documento_id

        politica.save(update_fields=[
            'status',
            'effective_date',
            'code',
            'documento_id',
            'updated_at'
        ])

        logger.info(
            f"Política {politica.id} actualizada a VIGENTE. "
            f"Código: {codigo_documento}, Documento: {documento_id}"
        )
