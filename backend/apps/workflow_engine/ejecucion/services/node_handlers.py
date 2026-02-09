"""
Node Handlers - Strategy Pattern para nodos BPMN.

Cada tipo de nodo (INICIO, FIN, TAREA, GATEWAY_EXCLUSIVO, GATEWAY_PARALELO, EVENTO)
tiene un handler dedicado que sabe como procesarlo dentro del motor de ejecucion.

El handler retorna una lista de nodos siguientes a procesar:
- [] = detenerse (esperar humano o workflow completado)
- [nodo] = continuar al siguiente nodo
- [nodo1, nodo2] = split paralelo
"""
import logging
from datetime import timedelta
from typing import List, Dict, Any, Optional

from django.utils import timezone

logger = logging.getLogger('workflow')


# ============================================================================
# EXCEPCIONES
# ============================================================================

class WorkflowConfigError(Exception):
    """Error en la configuracion del flujo (plantilla invalida, nodo faltante, etc.)"""
    pass


class WorkflowExecutionError(Exception):
    """Error durante la ejecucion del flujo (loop, timeout, etc.)"""
    pass


# ============================================================================
# BASE HANDLER
# ============================================================================

class BaseNodeHandler:
    """
    Clase base abstracta para handlers de nodos BPMN.

    Cada handler procesa un tipo de nodo y retorna los nodos siguientes.
    """

    @classmethod
    def handle(
        cls,
        instancia,
        nodo,
        usuario=None,
        datos_contexto: Optional[Dict[str, Any]] = None,
    ) -> List:
        """
        Procesa el nodo y retorna la lista de nodos siguientes.

        Args:
            instancia: InstanciaFlujo en ejecucion
            nodo: NodoFlujo a procesar
            usuario: User que dispara el avance (puede ser None para sistema)
            datos_contexto: dict con variables del flujo

        Returns:
            list[NodoFlujo]: Nodos siguientes (vacio = detenerse)
        """
        raise NotImplementedError(f"{cls.__name__} must implement handle()")


# ============================================================================
# INICIO NODE HANDLER
# ============================================================================

class InicioNodeHandler(BaseNodeHandler):
    """
    Procesa nodo INICIO.

    Simplemente encuentra la transicion saliente (debe ser exactamente 1)
    y retorna el nodo destino.
    """

    @classmethod
    def handle(cls, instancia, nodo, usuario=None, datos_contexto=None):
        from apps.workflow_engine.disenador_flujos.models import TransicionFlujo

        transiciones = TransicionFlujo.objects.filter(
            nodo_origen=nodo,
            plantilla=nodo.plantilla,
        ).select_related('nodo_destino')

        if not transiciones.exists():
            raise WorkflowConfigError(
                f"Nodo INICIO '{nodo.codigo}' no tiene transiciones salientes"
            )

        # INICIO tipicamente tiene 1 sola transicion
        transicion = transiciones.first()
        logger.info(
            f"[WF:{instancia.codigo_instancia}] INICIO → {transicion.nodo_destino.codigo}"
        )
        return [transicion.nodo_destino]


# ============================================================================
# FIN NODE HANDLER
# ============================================================================

class FinNodeHandler(BaseNodeHandler):
    """
    Procesa nodo FIN.

    Marca la instancia como COMPLETADO, cancela tareas pendientes,
    y emite signal workflow_completado.
    """

    @classmethod
    def handle(cls, instancia, nodo, usuario=None, datos_contexto=None):
        from apps.workflow_engine.ejecucion.models import (
            TareaActiva, NotificacionFlujo,
        )
        from apps.workflow_engine.ejecucion.signals import workflow_completado

        # Marcar instancia como completada
        instancia.estado = 'COMPLETADO'
        instancia.nodo_actual = nodo
        instancia.fecha_fin = timezone.now()
        instancia.finalizado_por = usuario
        instancia.save()

        # Cancelar tareas pendientes que quedaron (ramas paralelas no finalizadas)
        tareas_pendientes = TareaActiva.objects.filter(
            instancia=instancia,
            estado__in=['PENDIENTE', 'EN_PROGRESO'],
        )
        canceladas = tareas_pendientes.count()
        if canceladas > 0:
            tareas_pendientes.update(
                estado='COMPLETADA',
                fecha_completada=timezone.now(),
                observaciones='Auto-completada al finalizar el flujo',
            )
            logger.info(
                f"[WF:{instancia.codigo_instancia}] "
                f"Auto-completadas {canceladas} tareas pendientes al llegar a FIN"
            )

        # Notificar al iniciador
        if instancia.iniciado_por:
            NotificacionFlujo.objects.create(
                instancia=instancia,
                destinatario=instancia.iniciado_por,
                generada_por=usuario,
                tipo_notificacion='FLUJO_COMPLETADO',
                titulo=f'Flujo completado: {instancia.titulo}',
                mensaje=(
                    f'El flujo "{instancia.titulo}" '
                    f'({instancia.codigo_instancia}) ha sido completado.'
                ),
                prioridad='NORMAL',
                empresa_id=instancia.empresa_id,
            )

        # Emitir signal
        workflow_completado.send(
            sender=instancia.__class__,
            instancia=instancia,
            usuario=usuario,
        )

        logger.info(
            f"[WF:{instancia.codigo_instancia}] FIN alcanzado → COMPLETADO"
        )
        return []  # No hay nodos siguientes


# ============================================================================
# TAREA NODE HANDLER
# ============================================================================

class TareaNodeHandler(BaseNodeHandler):
    """
    Procesa nodo TAREA.

    Crea una TareaActiva, la asigna al usuario correspondiente,
    construye el formulario_schema, y DETIENE el flujo (espera accion humana).
    """

    @classmethod
    def handle(cls, instancia, nodo, usuario=None, datos_contexto=None):
        from apps.workflow_engine.ejecucion.models import (
            TareaActiva, HistorialTarea, NotificacionFlujo,
        )
        from apps.workflow_engine.ejecucion.signals import tarea_creada

        # 1. Resolver usuario asignado
        usuario_asignado = cls._resolver_usuario(nodo, datos_contexto or {})

        # 2. Generar codigo de tarea unico
        codigo_tarea = cls._generar_codigo_tarea(instancia, nodo)

        # 3. Calcular fecha de vencimiento
        fecha_vencimiento = None
        if nodo.tiempo_estimado_horas:
            fecha_vencimiento = timezone.now() + timedelta(
                hours=float(nodo.tiempo_estimado_horas)
            )

        # 4. Construir formulario schema desde CampoFormulario
        formulario_schema = cls._construir_formulario_schema(nodo)

        # 5. Determinar tipo de tarea
        tipo_tarea = 'FORMULARIO'
        if nodo.configuracion and isinstance(nodo.configuracion, dict):
            tipo_tarea = nodo.configuracion.get('tipo_tarea', 'FORMULARIO')

        # 6. Crear TareaActiva
        tarea = TareaActiva(
            instancia=instancia,
            nodo=nodo,
            codigo_tarea=codigo_tarea,
            nombre_tarea=nodo.nombre,
            descripcion=nodo.descripcion or '',
            tipo_tarea=tipo_tarea,
            estado='PENDIENTE',
            asignado_a=usuario_asignado,
            asignado_por=usuario,
            formulario_schema=formulario_schema,
            fecha_vencimiento=fecha_vencimiento,
            empresa_id=instancia.empresa_id,
            created_by=usuario,
        )
        tarea.save()

        # 7. Registrar historial
        HistorialTarea.objects.create(
            tarea=tarea,
            instancia=instancia,
            accion='CREACION',
            descripcion=f'Tarea "{nodo.nombre}" creada automaticamente por el motor de ejecucion',
            estado_nuevo='PENDIENTE',
            usuario=usuario,
            empresa_id=instancia.empresa_id,
        )

        # 8. Actualizar instancia
        instancia.nodo_actual = nodo
        instancia.estado = 'EN_PROCESO'
        instancia.responsable_actual = usuario_asignado
        instancia.save()

        # 9. Notificar al asignado
        if usuario_asignado:
            NotificacionFlujo.objects.create(
                instancia=instancia,
                tarea=tarea,
                destinatario=usuario_asignado,
                generada_por=usuario,
                tipo_notificacion='TAREA_ASIGNADA',
                titulo=f'Nueva tarea: {nodo.nombre}',
                mensaje=(
                    f'Se te ha asignado la tarea "{nodo.nombre}" '
                    f'en el flujo "{instancia.titulo}".'
                ),
                prioridad=instancia.prioridad,
                empresa_id=instancia.empresa_id,
            )

        # 10. Emitir signal
        tarea_creada.send(
            sender=tarea.__class__,
            tarea=tarea,
            instancia=instancia,
            usuario_asignado=usuario_asignado,
        )

        logger.info(
            f"[WF:{instancia.codigo_instancia}] TAREA '{nodo.codigo}' creada → "
            f"asignada a {usuario_asignado or 'SIN ASIGNAR'}"
        )

        return []  # Detener: esperar accion humana

    @classmethod
    def _resolver_usuario(cls, nodo, datos_contexto):
        """Resuelve el usuario asignado desde RolFlujo."""
        if not nodo.rol_asignado:
            return None

        try:
            usuarios = nodo.rol_asignado.obtener_usuarios_asignados(
                contexto=datos_contexto
            )
            if usuarios.exists():
                # Seleccionar el usuario con menos tareas activas
                from django.db.models import Count, Q
                usuario = usuarios.annotate(
                    tareas_activas=Count(
                        'workflow_tareas_asignadas',
                        filter=Q(
                            workflow_tareas_asignadas__estado__in=[
                                'PENDIENTE', 'EN_PROGRESO'
                            ]
                        )
                    )
                ).order_by('tareas_activas').first()
                return usuario
        except Exception as e:
            logger.warning(
                f"Error resolviendo usuario para nodo '{nodo.codigo}': {e}"
            )

        return None

    @classmethod
    def _generar_codigo_tarea(cls, instancia, nodo):
        """Genera codigo unico para la tarea."""
        from apps.workflow_engine.ejecucion.models import TareaActiva

        base = f"TK-{instancia.codigo_instancia}-{nodo.codigo}"

        # Verificar si ya existe (puede pasar en rejoin paralelo)
        if not TareaActiva.objects.filter(codigo_tarea=base).exists():
            return base

        # Agregar sufijo numerico
        counter = 1
        while True:
            codigo = f"{base}-{counter:02d}"
            if not TareaActiva.objects.filter(codigo_tarea=codigo).exists():
                return codigo
            counter += 1
            if counter > 99:
                raise WorkflowExecutionError(
                    f"No se puede generar codigo unico para tarea en nodo '{nodo.codigo}'"
                )

    @classmethod
    def _construir_formulario_schema(cls, nodo):
        """Construye el JSON schema del formulario desde CampoFormulario."""
        campos = nodo.campos_formulario.all().order_by('orden')

        if not campos.exists():
            return {}

        fields = []
        for campo in campos:
            field_def = {
                'nombre': campo.nombre,
                'etiqueta': campo.etiqueta,
                'tipo': campo.tipo,
                'orden': campo.orden,
                'requerido': campo.requerido,
            }
            if campo.opciones:
                field_def['opciones'] = campo.opciones
            if campo.validaciones:
                field_def['validaciones'] = campo.validaciones
            if campo.valor_defecto:
                field_def['valor_defecto'] = campo.valor_defecto
            if campo.ayuda:
                field_def['ayuda'] = campo.ayuda

            fields.append(field_def)

        return {'fields': fields}


# ============================================================================
# GATEWAY EXCLUSIVO HANDLER
# ============================================================================

class GatewayExclusivoHandler(BaseNodeHandler):
    """
    Procesa GATEWAY_EXCLUSIVO (XOR).

    Evalua las condiciones de las transiciones salientes por orden de prioridad.
    Toma la PRIMERA que sea True. Si ninguna coincide, toma la transicion
    sin condicion (default). Si no hay default, queda en error.
    """

    @classmethod
    def handle(cls, instancia, nodo, usuario=None, datos_contexto=None):
        from apps.workflow_engine.disenador_flujos.models import TransicionFlujo
        from apps.workflow_engine.monitoreo.models import AlertaFlujo

        datos = datos_contexto or {}

        transiciones = TransicionFlujo.objects.filter(
            nodo_origen=nodo,
            plantilla=nodo.plantilla,
        ).select_related('nodo_destino').order_by('-prioridad')

        if not transiciones.exists():
            raise WorkflowConfigError(
                f"GATEWAY_EXCLUSIVO '{nodo.codigo}' no tiene transiciones salientes"
            )

        # Evaluar condiciones por prioridad (mayor primero)
        transicion_default = None
        for transicion in transiciones:
            if not transicion.condicion:
                transicion_default = transicion
                continue

            if transicion.evaluar_condicion(datos):
                logger.info(
                    f"[WF:{instancia.codigo_instancia}] GATEWAY_EXCLUSIVO "
                    f"'{nodo.codigo}' → condicion match → {transicion.nodo_destino.codigo}"
                )
                return [transicion.nodo_destino]

        # Si ninguna condicion coincidio, usar default
        if transicion_default:
            logger.info(
                f"[WF:{instancia.codigo_instancia}] GATEWAY_EXCLUSIVO "
                f"'{nodo.codigo}' → default → {transicion_default.nodo_destino.codigo}"
            )
            return [transicion_default.nodo_destino]

        # Sin match y sin default: error
        logger.error(
            f"[WF:{instancia.codigo_instancia}] GATEWAY_EXCLUSIVO "
            f"'{nodo.codigo}' → SIN MATCH. Datos: {datos}"
        )
        AlertaFlujo.objects.create(
            tipo='error',
            severidad='alta',
            instancia=instancia,
            titulo=f'Gateway sin transicion valida: {nodo.codigo}',
            descripcion=(
                f'El gateway exclusivo "{nodo.nombre}" no encontro '
                f'ninguna transicion valida con los datos actuales. '
                f'Datos de contexto: {datos}'
            ),
            empresa_id=instancia.empresa_id,
        )
        return []  # Quedarse en el nodo actual


# ============================================================================
# GATEWAY PARALELO HANDLER
# ============================================================================

class GatewayParaleloHandler(BaseNodeHandler):
    """
    Procesa GATEWAY_PARALELO (AND).

    Dos comportamientos:
    - SPLIT: Si tiene >1 transiciones salientes, activa TODAS las ramas.
    - JOIN: Si tiene >1 transiciones entrantes, espera que todas completen.
    """

    @classmethod
    def handle(cls, instancia, nodo, usuario=None, datos_contexto=None):
        from apps.workflow_engine.disenador_flujos.models import TransicionFlujo

        transiciones_salientes = TransicionFlujo.objects.filter(
            nodo_origen=nodo,
            plantilla=nodo.plantilla,
        ).select_related('nodo_destino')

        transiciones_entrantes = TransicionFlujo.objects.filter(
            nodo_destino=nodo,
            plantilla=nodo.plantilla,
        )

        es_split = transiciones_salientes.count() > 1
        es_join = transiciones_entrantes.count() > 1

        if es_join and not es_split:
            return cls._handle_join(instancia, nodo, transiciones_salientes, datos_contexto)
        elif es_split:
            return cls._handle_split(instancia, nodo, transiciones_salientes, datos_contexto)
        else:
            # Gateway con 1 entrada y 1 salida: pass-through
            if transiciones_salientes.exists():
                return [transiciones_salientes.first().nodo_destino]
            return []

    @classmethod
    def _handle_split(cls, instancia, nodo, transiciones_salientes, datos_contexto):
        """Activa todas las ramas en paralelo."""
        destinos = [t.nodo_destino for t in transiciones_salientes]
        destino_codigos = [d.codigo for d in destinos]

        # Determinar join gateway
        join_gateway = None
        if nodo.configuracion and isinstance(nodo.configuracion, dict):
            join_gateway = nodo.configuracion.get('join_gateway')

        # Guardar tracking en variables_flujo
        variables = instancia.variables_flujo or {}
        if '_parallel_branches' not in variables:
            variables['_parallel_branches'] = {}

        variables['_parallel_branches'][nodo.codigo] = {
            'expected': destino_codigos,
            'completed': [],
            'join_gateway': join_gateway,
            'started_at': timezone.now().isoformat(),
        }
        instancia.variables_flujo = variables
        instancia.nodo_actual = nodo
        instancia.save()

        logger.info(
            f"[WF:{instancia.codigo_instancia}] GATEWAY_PARALELO SPLIT "
            f"'{nodo.codigo}' → {destino_codigos}"
        )
        return destinos

    @classmethod
    def _handle_join(cls, instancia, nodo, transiciones_salientes, datos_contexto):
        """
        Verifica si todas las ramas han completado.
        Este metodo es llamado DESPUES de que _manejar_join_paralelo
        en el executor confirma que todas las ramas estan completas.
        """
        if transiciones_salientes.exists():
            destino = transiciones_salientes.first().nodo_destino
            logger.info(
                f"[WF:{instancia.codigo_instancia}] GATEWAY_PARALELO JOIN "
                f"'{nodo.codigo}' → todas las ramas completas → {destino.codigo}"
            )
            return [destino]

        logger.warning(
            f"[WF:{instancia.codigo_instancia}] GATEWAY_PARALELO JOIN "
            f"'{nodo.codigo}' → sin transiciones salientes"
        )
        return []


# ============================================================================
# EVENTO NODE HANDLER
# ============================================================================

class EventoNodeHandler(BaseNodeHandler):
    """
    Procesa nodo EVENTO.

    Tipos de evento soportados:
    - temporizador: Espera N horas y luego avanza (via Celery delayed task)
    - default: Pass-through al siguiente nodo
    """

    @classmethod
    def handle(cls, instancia, nodo, usuario=None, datos_contexto=None):
        from apps.workflow_engine.disenador_flujos.models import TransicionFlujo

        config = nodo.configuracion or {}
        tipo_evento = config.get('tipo_evento', 'default')

        if tipo_evento == 'temporizador':
            return cls._handle_timer(instancia, nodo, config)

        # Default: pass-through
        transiciones = TransicionFlujo.objects.filter(
            nodo_origen=nodo,
            plantilla=nodo.plantilla,
        ).select_related('nodo_destino')

        if transiciones.exists():
            logger.info(
                f"[WF:{instancia.codigo_instancia}] EVENTO '{nodo.codigo}' "
                f"(pass-through) → {transiciones.first().nodo_destino.codigo}"
            )
            return [transiciones.first().nodo_destino]

        return []

    @classmethod
    def _handle_timer(cls, instancia, nodo, config):
        """Programa un Celery task para disparar despues del delay."""
        duracion_horas = config.get('duracion_horas', 1)

        try:
            from apps.workflow_engine.ejecucion.tasks import ejecutar_evento_temporizador

            task_result = ejecutar_evento_temporizador.apply_async(
                args=[instancia.id, nodo.id],
                countdown=int(duracion_horas * 3600),
            )

            # Guardar task_id para posible cancelacion
            variables = instancia.variables_flujo or {}
            variables[f'_timer_{nodo.codigo}'] = {
                'task_id': task_result.id,
                'scheduled_at': timezone.now().isoformat(),
                'fire_at': (
                    timezone.now() + timedelta(hours=duracion_horas)
                ).isoformat(),
            }
            instancia.variables_flujo = variables
            instancia.nodo_actual = nodo
            instancia.save()

            logger.info(
                f"[WF:{instancia.codigo_instancia}] EVENTO temporizador "
                f"'{nodo.codigo}' → programado en {duracion_horas}h (task: {task_result.id})"
            )
        except Exception as e:
            logger.error(
                f"[WF:{instancia.codigo_instancia}] Error programando timer "
                f"'{nodo.codigo}': {e}. Haciendo pass-through."
            )
            # Fallback: pass-through
            from apps.workflow_engine.disenador_flujos.models import TransicionFlujo
            transiciones = TransicionFlujo.objects.filter(
                nodo_origen=nodo,
                plantilla=nodo.plantilla,
            ).select_related('nodo_destino')
            if transiciones.exists():
                return [transiciones.first().nodo_destino]

        return []  # Esperar al timer


# ============================================================================
# NODE HANDLER REGISTRY
# ============================================================================

class NodeHandlerRegistry:
    """
    Registro que mapea NodoFlujo.tipo a su handler correspondiente.
    """

    _handlers = {
        'INICIO': InicioNodeHandler,
        'FIN': FinNodeHandler,
        'TAREA': TareaNodeHandler,
        'GATEWAY_EXCLUSIVO': GatewayExclusivoHandler,
        'GATEWAY_PARALELO': GatewayParaleloHandler,
        'EVENTO': EventoNodeHandler,
    }

    @classmethod
    def get_handler(cls, tipo_nodo: str) -> type:
        """Retorna la clase handler para el tipo de nodo dado."""
        handler = cls._handlers.get(tipo_nodo)
        if not handler:
            raise WorkflowConfigError(
                f"No existe handler para el tipo de nodo: '{tipo_nodo}'"
            )
        return handler
