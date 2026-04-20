"""
Servicio de Contratación - Talent Hub
Flujo completo Candidato → Colaborador → User → Contrato → Onboarding

Orquesta el proceso de contratación end-to-end:
1. Validar candidato aprobado
2. Crear Colaborador desde datos del Candidato
3. Crear User con acceso al portal (password temporal = documento)
4. Crear HistorialContrato (Ley 2466/2025 compliance)
5. Actualizar Candidato y VacanteActiva (thread-safe)
6. Iniciar onboarding automático
7. Enviar notificaciones
8. Generar documento GD (opcional)

Al crear el User, los signals auto-crean:
- TenantUser + TenantUserAccess (acceso global)
- Email de bienvenida con credenciales temporales
"""
import logging
from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from django.apps import apps
from rest_framework.exceptions import ValidationError

from apps.core.base_models.mixins import get_tenant_empresa

logger = logging.getLogger(__name__)


class ContratacionService:
    """
    Servicio central de contratación.

    Todos los métodos son @classmethod para facilitar uso desde views
    sin necesidad de instanciar.
    """

    # =========================================================================
    # FLUJO PRINCIPAL: Contratar Candidato
    # =========================================================================

    @classmethod
    def contratar_candidato(
        cls,
        candidato_id: int,
        datos_contrato: dict,
        usuario_contratante,
        empresa=None,
    ) -> dict:
        """
        Flujo completo de contratación de un candidato aprobado.

        Args:
            candidato_id: ID del Candidato a contratar
            datos_contrato: {
                numero_contrato: str,
                tipo_contrato_id: int,
                fecha_inicio: str (YYYY-MM-DD),
                fecha_fin: str|None,
                salario_pactado: Decimal|str,
                objeto_contrato: str,
                justificacion_tipo_contrato: str,
                generar_documento: bool (default False),
                plantilla_id: int|None,
                proveedor_origen_id: int|None (firma que envía al contratista),
            }
            usuario_contratante: User que ejecuta la acción
            empresa: EmpresaConfig (auto-resuelve si None)

        Returns:
            {
                'colaborador': Colaborador instance,
                'user': User|None (acceso al portal),
                'contrato': HistorialContrato instance,
                'onboarding': {'checklist_items': int, 'modulos_asignados': int},
                'documento': Documento|None,
            }

        Raises:
            ValidationError: si candidato no está aprobado, datos faltantes, etc.
        """
        Candidato = apps.get_model('seleccion_contratacion', 'Candidato')
        VacanteActiva = apps.get_model('seleccion_contratacion', 'VacanteActiva')

        if not empresa:
            empresa = get_tenant_empresa()

        with transaction.atomic():
            # 1. Obtener y validar candidato
            try:
                candidato = Candidato.objects.select_related(
                    'vacante', 'vacante__cargo', 'vacante__tipo_contrato'
                ).get(pk=candidato_id, is_active=True)
            except Candidato.DoesNotExist:
                raise ValidationError({'candidato': 'Candidato no encontrado.'})

            if candidato.estado != 'aprobado':
                raise ValidationError({
                    'candidato': f'El candidato debe estar en estado "aprobado" para ser contratado. '
                                 f'Estado actual: {candidato.estado}'
                })

            vacante = candidato.vacante
            if vacante.estado not in ('abierta', 'en_proceso'):
                raise ValidationError({
                    'vacante': f'La vacante no está disponible. Estado: {vacante.estado}'
                })

            # 2. Validar datos de contrato
            cls._validar_datos_contrato(datos_contrato, vacante)

            # 3. Crear Colaborador
            colaborador = cls._crear_colaborador_desde_candidato(
                candidato=candidato,
                datos_contrato=datos_contrato,
                empresa=empresa,
                usuario=usuario_contratante,
            )

            # 4. Crear User con acceso al portal
            user = cls._crear_user_para_colaborador(
                candidato=candidato,
                colaborador=colaborador,
                cargo=vacante.cargo,
                usuario_contratante=usuario_contratante,
            )

            # 5. Crear HistorialContrato
            contrato = cls._crear_historial_contrato(
                colaborador=colaborador,
                datos_contrato=datos_contrato,
                empresa=empresa,
                usuario=usuario_contratante,
            )

            # 6. Actualizar Candidato
            candidato.estado = 'contratado'
            candidato.fecha_contratacion = datos_contrato.get(
                'fecha_inicio', timezone.now().date()
            )
            candidato.salario_ofrecido = datos_contrato.get('salario_pactado')
            candidato.updated_by = usuario_contratante
            candidato.save()

            # 7. Actualizar VacanteActiva (thread-safe)
            vacante_locked = VacanteActiva.objects.select_for_update().get(
                pk=vacante.pk
            )
            vacante_locked.posiciones_cubiertas = (
                vacante_locked.posiciones_cubiertas or 0
            ) + 1
            if vacante_locked.posiciones_cubiertas >= vacante_locked.numero_posiciones:
                vacante_locked.estado = 'cerrada'
                vacante_locked.fecha_cierre_real = timezone.now().date()
            vacante_locked.save()

            # 8. Auto-crear FirmaDocumento vinculado al contrato laboral
            cls._crear_firma_documento_contrato(
                colaborador=colaborador,
                historial_contrato=contrato,
                empresa=empresa,
                usuario=usuario_contratante,
            )

            # 8b. Propagar afiliaciones SS del candidato a InfoPersonal del colaborador
            cls._propagar_afiliaciones_ss(
                candidato=candidato,
                colaborador=colaborador,
                empresa=empresa,
                usuario=usuario_contratante,
            )

            # 9. Iniciar onboarding automático
            onboarding_result = cls._iniciar_onboarding(
                colaborador=colaborador,
                empresa=empresa,
                usuario=usuario_contratante,
            )

            # 10. Generar documento GD (opcional)
            documento = None
            if datos_contrato.get('generar_documento', False):
                documento = cls._generar_documento_contrato(
                    contrato=contrato,
                    empresa=empresa,
                    usuario=usuario_contratante,
                    plantilla_id=datos_contrato.get('plantilla_id'),
                )

        # 11. Enviar notificaciones (fuera de transaction para no bloquear)
        cls._enviar_notificaciones_contratacion(
            colaborador=colaborador,
            contrato=contrato,
            onboarding_result=onboarding_result,
        )

        logger.info(
            f"Contratación exitosa: Candidato #{candidato_id} → "
            f"Colaborador #{colaborador.id} ({colaborador.get_nombre_completo()})"
        )

        return {
            'colaborador': colaborador,
            'user': user,
            'contrato': contrato,
            'onboarding': onboarding_result,
            'documento': documento,
        }

    # =========================================================================
    # RENOVACIÓN DE CONTRATO (Ley 2466/2025)
    # =========================================================================

    @classmethod
    def renovar_contrato(
        cls,
        historial_contrato_id: int,
        datos_renovacion: dict,
        usuario,
        empresa=None,
    ) -> 'HistorialContrato':
        """
        Renueva un contrato existente cumpliendo Ley 2466/2025.

        Args:
            historial_contrato_id: ID del contrato a renovar
            datos_renovacion: {
                fecha_inicio: str,
                fecha_fin: str|None,
                salario_pactado: Decimal|str,
                objeto_contrato: str,
                justificacion_tipo_contrato: str,
            }
            usuario: User que ejecuta
            empresa: EmpresaConfig

        Returns:
            Nuevo HistorialContrato (renovación)
        """
        HistorialContrato = apps.get_model('seleccion_contratacion', 'HistorialContrato')

        if not empresa:
            empresa = get_tenant_empresa()

        with transaction.atomic():
            try:
                contrato_actual = HistorialContrato.objects.select_related(
                    'colaborador', 'tipo_contrato'
                ).get(pk=historial_contrato_id, is_active=True)
            except HistorialContrato.DoesNotExist:
                raise ValidationError({'contrato': 'Contrato no encontrado.'})

            # Calcular número de renovación
            num_renovacion = HistorialContrato.objects.filter(
                empresa=empresa,
                colaborador=contrato_actual.colaborador,
                tipo_movimiento='renovacion',
                is_active=True,
            ).count() + 1

            # Generar nuevo número de contrato
            numero_contrato = cls._generar_numero_contrato(
                contrato_actual.numero_contrato, num_renovacion
            )

            nuevo_contrato = HistorialContrato.objects.create(
                empresa=empresa,
                colaborador=contrato_actual.colaborador,
                tipo_contrato=contrato_actual.tipo_contrato,
                numero_contrato=numero_contrato,
                fecha_inicio=datos_renovacion['fecha_inicio'],
                fecha_fin=datos_renovacion.get('fecha_fin'),
                salario_pactado=Decimal(str(datos_renovacion['salario_pactado'])),
                objeto_contrato=datos_renovacion.get(
                    'objeto_contrato', contrato_actual.objeto_contrato
                ),
                tipo_movimiento='renovacion',
                contrato_padre=contrato_actual,
                numero_renovacion=num_renovacion,
                justificacion_tipo_contrato=datos_renovacion.get(
                    'justificacion_tipo_contrato', ''
                ),
                created_by=usuario,
                updated_by=usuario,
            )

            # Actualizar fecha_fin_contrato del Colaborador
            colaborador = contrato_actual.colaborador
            colaborador.fecha_fin_contrato = datos_renovacion.get('fecha_fin')
            if datos_renovacion.get('salario_pactado'):
                colaborador.salario = Decimal(str(datos_renovacion['salario_pactado']))
            colaborador.updated_by = usuario
            colaborador.save(update_fields=[
                'fecha_fin_contrato', 'salario', 'updated_by', 'updated_at'
            ])

        # Notificar
        try:
            from .notificador_th import NotificadorTH
            NotificadorTH.notificar_renovacion_contrato(nuevo_contrato)
        except Exception as e:
            logger.error(f'Error notificando renovación: {e}')

        logger.info(
            f"Renovación de contrato: {contrato_actual.numero_contrato} → "
            f"{nuevo_contrato.numero_contrato} (renovación #{num_renovacion})"
        )

        return nuevo_contrato

    # =========================================================================
    # OTROSÍ
    # =========================================================================

    @classmethod
    def crear_otrosi(
        cls,
        historial_contrato_id: int,
        datos_otrosi: dict,
        usuario,
        empresa=None,
    ) -> 'HistorialContrato':
        """
        Crea un otrosí (modificación) a un contrato existente.

        Args:
            historial_contrato_id: ID del contrato original
            datos_otrosi: {
                numero_contrato: str (nuevo número del otrosí),
                salario_pactado: Decimal|str (nuevo salario, puede ser igual),
                objeto_contrato: str (descripción de las modificaciones),
                justificacion_tipo_contrato: str,
                fecha_fin: str|None (nueva fecha fin si cambia),
            }
            usuario: User que ejecuta
            empresa: EmpresaConfig

        Returns:
            Nuevo HistorialContrato (otrosí)
        """
        HistorialContrato = apps.get_model('seleccion_contratacion', 'HistorialContrato')

        if not empresa:
            empresa = get_tenant_empresa()

        with transaction.atomic():
            try:
                contrato_actual = HistorialContrato.objects.select_related(
                    'colaborador', 'tipo_contrato'
                ).get(pk=historial_contrato_id, is_active=True)
            except HistorialContrato.DoesNotExist:
                raise ValidationError({'contrato': 'Contrato no encontrado.'})

            otrosi = HistorialContrato.objects.create(
                empresa=empresa,
                colaborador=contrato_actual.colaborador,
                tipo_contrato=contrato_actual.tipo_contrato,
                numero_contrato=datos_otrosi['numero_contrato'],
                fecha_inicio=contrato_actual.fecha_inicio,
                fecha_fin=datos_otrosi.get('fecha_fin', contrato_actual.fecha_fin),
                salario_pactado=Decimal(str(
                    datos_otrosi.get('salario_pactado', contrato_actual.salario_pactado)
                )),
                objeto_contrato=datos_otrosi.get('objeto_contrato', ''),
                tipo_movimiento='otrosi',
                contrato_padre=contrato_actual,
                justificacion_tipo_contrato=datos_otrosi.get(
                    'justificacion_tipo_contrato', ''
                ),
                created_by=usuario,
                updated_by=usuario,
            )

            # Actualizar colaborador si cambia salario
            if datos_otrosi.get('salario_pactado'):
                colaborador = contrato_actual.colaborador
                colaborador.salario = Decimal(str(datos_otrosi['salario_pactado']))
                if datos_otrosi.get('fecha_fin'):
                    colaborador.fecha_fin_contrato = datos_otrosi['fecha_fin']
                colaborador.updated_by = usuario
                colaborador.save(update_fields=[
                    'salario', 'fecha_fin_contrato', 'updated_by', 'updated_at'
                ])

        logger.info(
            f"Otrosí creado: {otrosi.numero_contrato} sobre "
            f"contrato {contrato_actual.numero_contrato}"
        )

        return otrosi

    # =========================================================================
    # MÉTODOS PRIVADOS
    # =========================================================================

    @classmethod
    def _validar_datos_contrato(cls, datos_contrato: dict, vacante) -> None:
        """Valida que los datos de contrato estén completos."""
        errores = {}

        if not datos_contrato:
            raise ValidationError({
                'datos_contrato': 'Debe proporcionar los datos del contrato.'
            })

        campos_requeridos = ['numero_contrato', 'tipo_contrato_id', 'fecha_inicio', 'salario_pactado']
        for campo in campos_requeridos:
            if not datos_contrato.get(campo):
                errores[campo] = f'El campo {campo} es requerido.'

        if errores:
            raise ValidationError(errores)

        # Validar que salario sea positivo
        try:
            salario = Decimal(str(datos_contrato['salario_pactado']))
            if salario <= 0:
                errores['salario_pactado'] = 'El salario debe ser mayor a 0.'
        except (ValueError, TypeError):
            errores['salario_pactado'] = 'El salario no es un valor válido.'

        if errores:
            raise ValidationError(errores)

    @classmethod
    def _crear_colaborador_desde_candidato(
        cls, candidato, datos_contrato, empresa, usuario
    ) -> 'Colaborador':
        """
        Crea un Colaborador a partir de los datos del Candidato.

        Mapeo de campos:
        - candidato.nombres → primer_nombre (primer token) + segundo_nombre (resto)
        - candidato.apellidos → primer_apellido (primer token) + segundo_apellido (resto)
        - candidato.numero_documento → numero_identificacion
        - candidato.tipo_documento → tipo_documento
        - candidato.email → email_personal
        - candidato.telefono → telefono_movil
        - vacante.cargo → cargo
        - vacante.cargo.area → area (si el cargo tiene area)
        """
        Colaborador = apps.get_model('colaboradores', 'Colaborador')
        TipoContrato = apps.get_model('seleccion_contratacion', 'TipoContrato')

        vacante = candidato.vacante

        # Parsear nombres
        nombres_parts = candidato.nombres.strip().split()
        primer_nombre = nombres_parts[0] if nombres_parts else candidato.nombres
        segundo_nombre = ' '.join(nombres_parts[1:]) if len(nombres_parts) > 1 else ''

        # Parsear apellidos
        apellidos_parts = candidato.apellidos.strip().split()
        primer_apellido = apellidos_parts[0] if apellidos_parts else candidato.apellidos
        segundo_apellido = ' '.join(apellidos_parts[1:]) if len(apellidos_parts) > 1 else ''

        # Resolver cargo y área
        cargo = vacante.cargo
        if not cargo:
            raise ValidationError({
                'cargo': 'La vacante no tiene un cargo asociado. No se puede crear el colaborador.'
            })

        area = cargo.area if hasattr(cargo, 'area') and cargo.area else None
        if not area:
            raise ValidationError({
                'area': 'El cargo no tiene un área asignada. Asigne un área al cargo antes de contratar.'
            })

        # Resolver tipo_contrato como CharField del Colaborador
        try:
            tipo_contrato_obj = TipoContrato.objects.get(
                pk=datos_contrato['tipo_contrato_id']
            )
        except TipoContrato.DoesNotExist:
            raise ValidationError({
                'tipo_contrato_id': 'Tipo de contrato no encontrado.'
            })

        # Mapear código de TipoContrato a choices del Colaborador
        CODIGO_TO_CHOICE = {
            'INDEFINIDO': 'indefinido',
            'FIJO': 'fijo',
            'OBRA': 'obra_labor',
            'APRENDIZAJE': 'aprendizaje',
            'SERVICIOS': 'prestacion_servicios',
            'TEMPORAL': 'fijo',
        }
        tipo_contrato_choice = CODIGO_TO_CHOICE.get(
            tipo_contrato_obj.codigo.upper(), 'indefinido'
        )

        salario = Decimal(str(datos_contrato['salario_pactado']))

        # Determinar auxilio de transporte (2x SMMLV 2025 = COP 2,847,000)
        SMMLV = Decimal('1423500')
        TOPE_AUXILIO = SMMLV * 2
        auxilio_transporte = salario <= TOPE_AUXILIO

        # Resolver proveedor de origen (para contratistas externos)
        proveedor_origen = None
        proveedor_id = datos_contrato.get('proveedor_origen_id')
        if proveedor_id:
            try:
                Proveedor = apps.get_model('catalogo_productos', 'Proveedor')
                proveedor_origen = Proveedor.objects.get(pk=proveedor_id)
            except Exception:
                logger.warning(f"Proveedor #{proveedor_id} no encontrado, se omite")

        colaborador = Colaborador.objects.create(
            empresa=empresa,
            numero_identificacion=candidato.numero_documento,
            tipo_documento=candidato.tipo_documento,
            primer_nombre=primer_nombre,
            segundo_nombre=segundo_nombre,
            primer_apellido=primer_apellido,
            segundo_apellido=segundo_apellido,
            cargo=cargo,
            area=area,
            proveedor_origen=proveedor_origen,
            fecha_ingreso=datos_contrato['fecha_inicio'],
            estado='activo',
            tipo_contrato=tipo_contrato_choice,
            fecha_fin_contrato=datos_contrato.get('fecha_fin'),
            salario=salario,
            auxilio_transporte=auxilio_transporte,
            email_personal=getattr(candidato, 'email', ''),
            telefono_movil=getattr(candidato, 'telefono', ''),
            created_by=usuario,
            updated_by=usuario,
        )

        logger.info(
            f"Colaborador creado: #{colaborador.id} "
            f"{colaborador.get_nombre_completo()} ({cargo.name})"
        )

        return colaborador

    @classmethod
    def _crear_user_para_colaborador(
        cls, candidato, colaborador, cargo, usuario_contratante
    ):
        """
        Crea un User con acceso al portal para el nuevo colaborador.

        - Password temporal = numero de documento del candidato
        - El flag _from_contratacion evita que los signals dupliquen
          el Colaborador y la actualizacion de vacante
        - El flag _temp_password_hint se pasa al email de bienvenida
        - Vincula el Colaborador.usuario con el nuevo User

        Returns:
            User creado o None si falla
        """
        from apps.core.models import User

        try:
            email = getattr(candidato, 'email', '')
            if not email:
                logger.warning(
                    f"No se puede crear User para Colaborador #{colaborador.id}: "
                    "candidato sin email"
                )
                return None

            # Verificar que no exista ya un User con este email
            if User.objects.filter(email=email).exists():
                existing = User.objects.get(email=email)
                # Vincular colaborador al User existente
                colaborador.usuario = existing
                colaborador.save(update_fields=['usuario'])
                logger.info(
                    f"User existente #{existing.id} vinculado a "
                    f"Colaborador #{colaborador.id}"
                )
                return existing

            # Generar username unico basado en email
            base_username = email.split('@')[0]
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}_{counter}"
                counter += 1

            # Password temporal = numero de documento
            temp_password = candidato.numero_documento

            # Parsear nombres del candidato
            nombres_parts = candidato.nombres.strip().split()
            first_name = nombres_parts[0] if nombres_parts else candidato.nombres
            apellidos_parts = candidato.apellidos.strip().split()
            last_name = apellidos_parts[0] if apellidos_parts else candidato.apellidos

            # Crear User con flags para signals
            user = User(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                is_active=True,
                document_type=candidato.tipo_documento,
                document_number=candidato.numero_documento,
                cargo=cargo,
                created_by=usuario_contratante,
            )

            # Flags para que los signals no dupliquen trabajo
            user._from_contratacion = True
            user._temp_password_hint = 'Tu numero de documento'

            user.set_password(temp_password)
            user.save()

            # Vincular Colaborador con el User
            colaborador.usuario = user
            colaborador.save(update_fields=['usuario'])

            logger.info(
                f"User #{user.id} ({username}) creado para "
                f"Colaborador #{colaborador.id} ({colaborador.get_nombre_completo()})"
            )

            return user

        except Exception as e:
            # No abortar la contratacion si falla la creacion del User
            logger.error(
                f"Error creando User para Colaborador #{colaborador.id}: {e}",
                exc_info=True
            )
            return None

    @classmethod
    def _crear_historial_contrato(
        cls, colaborador, datos_contrato, empresa, usuario
    ) -> 'HistorialContrato':
        """Crea el registro de HistorialContrato inicial."""
        HistorialContrato = apps.get_model('seleccion_contratacion', 'HistorialContrato')
        TipoContrato = apps.get_model('seleccion_contratacion', 'TipoContrato')

        tipo_contrato = TipoContrato.objects.get(
            pk=datos_contrato['tipo_contrato_id']
        )

        contrato = HistorialContrato.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            tipo_contrato=tipo_contrato,
            numero_contrato=datos_contrato['numero_contrato'],
            fecha_inicio=datos_contrato['fecha_inicio'],
            fecha_fin=datos_contrato.get('fecha_fin'),
            salario_pactado=Decimal(str(datos_contrato['salario_pactado'])),
            objeto_contrato=datos_contrato.get('objeto_contrato', ''),
            tipo_movimiento='contrato_inicial',
            justificacion_tipo_contrato=datos_contrato.get(
                'justificacion_tipo_contrato', ''
            ),
            created_by=usuario,
            updated_by=usuario,
        )

        logger.info(
            f"HistorialContrato creado: #{contrato.id} "
            f"{contrato.numero_contrato} ({tipo_contrato.nombre})"
        )

        return contrato

    @classmethod
    def _iniciar_onboarding(cls, colaborador, empresa, usuario) -> dict:
        """
        Inicia el onboarding automático basado en el cargo del colaborador.

        Delega a OnboardingService. Si no hay AsignacionPorCargo configurada,
        retorna resultado vacío sin fallar.
        """
        try:
            from .onboarding_service import OnboardingService
            return OnboardingService.iniciar_onboarding(
                colaborador=colaborador,
                empresa=empresa,
                usuario=usuario,
            )
        except Exception as e:
            logger.warning(
                f"No se pudo iniciar onboarding automático para "
                f"{colaborador.get_nombre_completo()}: {e}"
            )
            return {'checklist_items': 0, 'modulos_asignados': 0}

    @classmethod
    def _generar_documento_contrato(cls, contrato, empresa, usuario, plantilla_id=None):
        """
        Genera documento de contrato vía Gestor Documental.

        Delega a ContratoDocumentoService. Si falla, registra error sin abortar.
        """
        try:
            from .contrato_documento_service import ContratoDocumentoService
            return ContratoDocumentoService.generar_documento_contrato(
                historial_contrato=contrato,
                usuario=usuario,
                empresa=empresa,
                plantilla_id=plantilla_id,
            )
        except Exception as e:
            logger.error(
                f"Error generando documento de contrato "
                f"{contrato.numero_contrato}: {e}"
            )
            return None

    @classmethod
    def _enviar_notificaciones_contratacion(
        cls, colaborador, contrato, onboarding_result
    ) -> None:
        """Envía notificaciones post-contratación."""
        try:
            from .notificador_th import NotificadorTH

            # Notificar contratación exitosa
            NotificadorTH.notificar_contratacion_exitosa(colaborador)

            # Notificar inicio de onboarding
            total_tareas = (
                onboarding_result.get('checklist_items', 0)
                + onboarding_result.get('modulos_asignados', 0)
            )
            if total_tareas > 0:
                NotificadorTH.notificar_onboarding_iniciado(
                    colaborador, total_tareas
                )

        except Exception as e:
            logger.error(f'Error enviando notificaciones de contratación: {e}')

    @classmethod
    def _crear_firma_documento_contrato(
        cls, colaborador, historial_contrato, empresa, usuario
    ) -> None:
        """
        Auto-crea un FirmaDocumento de tipo 'contrato' vinculado al HistorialContrato.

        Este registro permite que el módulo de Onboarding tenga trazabilidad del
        contrato laboral firmado y pueda gestionarlo desde la ficha del colaborador.
        """
        try:
            FirmaDocumento = apps.get_model('onboarding_induccion', 'FirmaDocumento')
            FirmaDocumento.objects.create(
                empresa=empresa,
                colaborador=colaborador,
                tipo_documento='contrato',
                nombre_documento=f'Contrato Laboral - {colaborador.get_nombre_completo()}',
                metodo_firma='digital',
                fecha_firma=historial_contrato.fecha_inicio,
                firmado=False,
                historial_contrato=historial_contrato,
                created_by=usuario,
                updated_by=usuario,
            )
            logger.info(
                f"FirmaDocumento de contrato creado para Colaborador #{colaborador.id}"
            )
        except Exception as e:
            logger.error(
                f"Error creando FirmaDocumento para Colaborador #{colaborador.id}: {e}"
            )

    @classmethod
    def _propagar_afiliaciones_ss(
        cls, candidato, colaborador, empresa, usuario
    ) -> None:
        """
        Propaga las afiliaciones a seguridad social del Candidato hacia InfoPersonal.

        Mapeo de tipo_entidad.codigo → campo InfoPersonal:
        - EPS  → eps
        - ARL  → arl
        - AFP  → fondo_pensiones
        - CCF  → caja_compensacion

        Solo actualiza campos cuyas afiliaciones estén en estado 'afiliado'.
        Si InfoPersonal no existe, la crea.
        """
        try:
            AfiliacionSS = apps.get_model('seleccion_contratacion', 'AfiliacionSS')
            InfoPersonal = apps.get_model('colaboradores', 'InfoPersonal')

            # Buscar afiliaciones en estado 'afiliado' del candidato
            afiliaciones = AfiliacionSS.objects.filter(
                candidato=candidato,
                estado='afiliado',
                is_active=True,
            ).select_related('entidad__tipo_entidad')

            if not afiliaciones.exists():
                return

            # Mapeo tipo entidad → campo InfoPersonal
            TIPO_TO_CAMPO = {
                'EPS': 'eps',
                'ARL': 'arl',
                'AFP': 'fondo_pensiones',
                'CCF': 'caja_compensacion',
            }

            campos_actualizar = {}
            for afiliacion in afiliaciones:
                codigo_tipo = afiliacion.entidad.tipo_entidad.codigo.upper()
                campo = TIPO_TO_CAMPO.get(codigo_tipo)
                if campo:
                    campos_actualizar[campo] = afiliacion.entidad.nombre

            if not campos_actualizar:
                return

            # Obtener o crear InfoPersonal del colaborador
            info_personal, created = InfoPersonal.objects.get_or_create(
                colaborador=colaborador,
                defaults={
                    'empresa': empresa,
                    'created_by': usuario,
                    'updated_by': usuario,
                },
            )

            # Actualizar campos con datos de afiliaciones
            for campo, valor in campos_actualizar.items():
                setattr(info_personal, campo, valor)

            info_personal.updated_by = usuario
            campos_save = list(campos_actualizar.keys()) + ['updated_by', 'updated_at']
            if created:
                # Si se acaba de crear, guardar todo
                info_personal.save()
            else:
                info_personal.save(update_fields=campos_save)

            logger.info(
                f"AfiliacionSS propagada a InfoPersonal de Colaborador #{colaborador.id}: "
                f"{list(campos_actualizar.keys())}"
            )
        except Exception as e:
            logger.error(
                f"Error propagando afiliaciones SS para Colaborador #{colaborador.id}: {e}"
            )

    @classmethod
    def _generar_numero_contrato(cls, numero_base: str, num_renovacion: int) -> str:
        """
        Genera número de contrato para renovación.

        Ejemplo: CTR-2026-001 → CTR-2026-001-R1
        """
        # Si ya tiene sufijo de renovación, reemplazarlo
        if '-R' in numero_base:
            base = numero_base.rsplit('-R', 1)[0]
        else:
            base = numero_base
        return f"{base}-R{num_renovacion}"
