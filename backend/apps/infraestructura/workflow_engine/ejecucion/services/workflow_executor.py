"""
WorkflowExecutionService - Motor de Ejecucion BPMN

Servicio principal que orquesta la ejecucion de flujos de trabajo:
- Inicia instancias desde plantillas activas
- Avanza el flujo automaticamente al completar/rechazar tareas
- Maneja gateways exclusivos y paralelos
- Detecta nodo FIN y auto-completa instancias
- Registra historial y envia notificaciones

Uso:
    from apps.infraestructura.workflow_engine.ejecucion.services import WorkflowExecutionService

    # Iniciar un flujo
    instancia = WorkflowExecutionService.iniciar_flujo(
        plantilla_id=1,
        datos_iniciales={'monto': 5000000, 'tipo': 'URGENTE'},
        usuario=request.user,
        empresa_id=42,
    )

    # Completar tarea y avanzar automaticamente
    WorkflowExecutionService.completar_tarea_y_avanzar(
        tarea_id=99,
        datos={'comentario': 'Aprobado'},
        decision='APROBAR',
        usuario=request.user,
    )
"""
import logging
from datetime import timedelta
from typing import Dict, Any, Optional

from django.db import transaction
from django.utils import timezone

from .node_handlers import (
    NodeHandlerRegistry,
    WorkflowConfigError,
    WorkflowExecutionError,
)

logger = logging.getLogger('workflow')

# Circuit breaker: maximo de nodos procesados en una sola ejecucion
# Previene loops infinitos por transiciones circulares
MAX_ADVANCEMENT_DEPTH = 100


class WorkflowExecutionService:
    """
    Motor de ejecucion de flujos de trabajo BPMN.

    Todos los metodos publicos son @classmethod siguiendo el patron
    de PermissionCacheService en core/services/.
    Todas las operaciones multi-modelo usan transaction.atomic().
    """

    # ====================================================================
    # API PUBLICA
    # ====================================================================

    @classmethod
    def iniciar_flujo(
        cls,
        plantilla_id: int,
        datos_iniciales: Dict[str, Any],
        usuario,
        empresa_id: int,
        titulo: str = '',
        descripcion: str = '',
        prioridad: str = 'NORMAL',
        entidad_tipo: str = '',
        entidad_id: Optional[int] = None,
    ):
        """
        Inicia una nueva instancia de flujo desde una plantilla activa.

        1. Valida que la plantilla existe y esta activa
        2. Encuentra el nodo INICIO
        3. Crea la InstanciaFlujo
        4. Avanza desde INICIO hasta la primera TAREA

        Returns:
            InstanciaFlujo: La instancia creada con su primera tarea

        Raises:
            WorkflowConfigError: Si la plantilla no existe, no esta activa,
                                 o no tiene nodo INICIO
        """
        from apps.infraestructura.workflow_engine.disenador_flujos.models import (
            PlantillaFlujo, NodoFlujo,
        )
        from apps.infraestructura.workflow_engine.ejecucion.models import InstanciaFlujo
        from apps.infraestructura.workflow_engine.ejecucion.signals import workflow_iniciado

        # 1. Validar plantilla
        try:
            plantilla = PlantillaFlujo.objects.get(
                id=plantilla_id,
                empresa_id=empresa_id,
                estado='ACTIVO',
            )
        except PlantillaFlujo.DoesNotExist:
            raise WorkflowConfigError(
                f"Plantilla ID={plantilla_id} no encontrada o no esta activa "
                f"para empresa {empresa_id}"
            )

        # 2. Encontrar nodo INICIO
        nodos_inicio = NodoFlujo.objects.filter(
            plantilla=plantilla,
            tipo='INICIO',
        )
        if not nodos_inicio.exists():
            raise WorkflowConfigError(
                f"Plantilla '{plantilla.codigo}' no tiene nodo INICIO"
            )
        if nodos_inicio.count() > 1:
            raise WorkflowConfigError(
                f"Plantilla '{plantilla.codigo}' tiene multiples nodos INICIO"
            )
        nodo_inicio = nodos_inicio.first()

        # 3. Generar codigo unico
        codigo = cls._generar_codigo_instancia(plantilla, empresa_id)

        # 4. Titulo por defecto
        if not titulo:
            titulo = f'{plantilla.nombre} - {codigo}'

        with transaction.atomic():
            # 5. Crear instancia
            fecha_limite = None
            if plantilla.tiempo_estimado_horas:
                fecha_limite = timezone.now() + timedelta(
                    hours=float(plantilla.tiempo_estimado_horas)
                )

            instancia = InstanciaFlujo(
                codigo_instancia=codigo,
                titulo=titulo,
                descripcion=descripcion,
                plantilla=plantilla,
                nodo_actual=nodo_inicio,
                estado='INICIADO',
                prioridad=prioridad,
                entidad_tipo=entidad_tipo,
                entidad_id=entidad_id,
                data_contexto=datos_iniciales or {},
                variables_flujo={},
                fecha_limite=fecha_limite,
                iniciado_por=usuario,
                empresa_id=empresa_id,
            )
            instancia.save()

            # 6. Emitir signal
            workflow_iniciado.send(
                sender=instancia.__class__,
                instancia=instancia,
                usuario=usuario,
            )

            logger.info(
                f"[WF:{codigo}] Flujo iniciado desde plantilla "
                f"'{plantilla.codigo}' v{plantilla.version} por {usuario}"
            )

            # 7. Avanzar desde INICIO
            cls._avanzar_desde_nodo(
                instancia=instancia,
                nodo_actual=nodo_inicio,
                usuario=usuario,
                datos_contexto=instancia.data_contexto,
                depth=0,
            )

        # Refrescar desde DB para obtener estado actualizado
        instancia.refresh_from_db()
        return instancia

    @classmethod
    def completar_tarea_y_avanzar(
        cls,
        tarea_id: int,
        datos: Dict[str, Any],
        decision: str,
        usuario,
    ):
        """
        Completa una tarea y avanza el flujo al siguiente nodo.

        Este metodo es llamado DESPUES de que el ViewSet ya marco la tarea
        como COMPLETADA. Aqui nos encargamos de:
        1. Mergear datos del formulario en data_contexto
        2. Evaluar transiciones salientes del nodo actual
        3. Avanzar al siguiente nodo

        Returns:
            TareaActiva: La tarea completada

        Note:
            No lanza excepciones criticas - si el avance falla, la tarea
            ya esta completada y el error se registra en logs.
        """
        from apps.infraestructura.workflow_engine.ejecucion.models import TareaActiva
        from apps.infraestructura.workflow_engine.ejecucion.signals import tarea_completada

        try:
            tarea = TareaActiva.objects.select_related(
                'instancia', 'nodo', 'instancia__plantilla'
            ).get(id=tarea_id)
        except TareaActiva.DoesNotExist:
            logger.error(f"Tarea ID={tarea_id} no encontrada para avance")
            return None

        instancia = tarea.instancia

        # No avanzar si la instancia ya finalizo
        if instancia.estado in ('COMPLETADO', 'CANCELADO'):
            logger.warning(
                f"[WF:{instancia.codigo_instancia}] Intento de avanzar "
                f"instancia ya finalizada ({instancia.estado})"
            )
            return tarea

        with transaction.atomic():
            # 1. Mergear datos en contexto
            data_contexto = instancia.data_contexto or {}
            if datos:
                data_contexto.update(datos)
            data_contexto['_last_decision'] = decision
            data_contexto[f'decision_{tarea.nodo.codigo}'] = decision
            instancia.data_contexto = data_contexto
            instancia.save()

            # 2. Emitir signal
            tarea_completada.send(
                sender=tarea.__class__,
                tarea=tarea,
                instancia=instancia,
                usuario=usuario,
                decision=decision,
            )

            # 3. Verificar si es parte de un join paralelo
            join_satisfecho, join_nodo = cls._manejar_join_paralelo(
                instancia, tarea.nodo, data_contexto
            )

            if join_satisfecho and join_nodo:
                # Todas las ramas del paralelo completaron - avanzar desde el join
                cls._avanzar_desde_nodo(
                    instancia=instancia,
                    nodo_actual=join_nodo,
                    usuario=usuario,
                    datos_contexto=data_contexto,
                    depth=0,
                )
            elif not join_satisfecho and join_nodo is not None:
                # Aun faltan ramas - no avanzar
                logger.info(
                    f"[WF:{instancia.codigo_instancia}] Rama paralela "
                    f"'{tarea.nodo.codigo}' completada, esperando otras ramas"
                )
            else:
                # No es parte de un paralelo - avance normal
                cls._avanzar_desde_nodo(
                    instancia=instancia,
                    nodo_actual=tarea.nodo,
                    usuario=usuario,
                    datos_contexto=data_contexto,
                    depth=0,
                )

        return tarea

    @classmethod
    def rechazar_tarea(
        cls,
        tarea_id: int,
        motivo: str,
        usuario,
    ):
        """
        Maneja el rechazo de una tarea.

        Busca una transicion de rechazo (condicion con decision=RECHAZAR).
        Si existe, sigue esa ruta. Si no, no avanza (workflow queda en estado actual).

        Returns:
            TareaActiva: La tarea rechazada
        """
        from apps.infraestructura.workflow_engine.ejecucion.models import TareaActiva
        from apps.infraestructura.workflow_engine.ejecucion.signals import tarea_rechazada

        try:
            tarea = TareaActiva.objects.select_related(
                'instancia', 'nodo', 'instancia__plantilla'
            ).get(id=tarea_id)
        except TareaActiva.DoesNotExist:
            logger.error(f"Tarea ID={tarea_id} no encontrada para rechazo")
            return None

        instancia = tarea.instancia

        if instancia.estado in ('COMPLETADO', 'CANCELADO'):
            return tarea

        with transaction.atomic():
            # Mergear rechazo en contexto
            data_contexto = instancia.data_contexto or {}
            data_contexto['_last_decision'] = 'RECHAZAR'
            data_contexto[f'decision_{tarea.nodo.codigo}'] = 'RECHAZAR'
            data_contexto[f'motivo_rechazo_{tarea.nodo.codigo}'] = motivo
            instancia.data_contexto = data_contexto
            instancia.save()

            # Emitir signal
            tarea_rechazada.send(
                sender=tarea.__class__,
                tarea=tarea,
                instancia=instancia,
                usuario=usuario,
                motivo=motivo,
            )

            # Intentar avanzar usando la ruta de rechazo
            cls._avanzar_desde_nodo(
                instancia=instancia,
                nodo_actual=tarea.nodo,
                usuario=usuario,
                datos_contexto=data_contexto,
                depth=0,
            )

        return tarea

    # ====================================================================
    # MOTOR INTERNO
    # ====================================================================

    @classmethod
    def _avanzar_desde_nodo(
        cls,
        instancia,
        nodo_actual,
        usuario,
        datos_contexto: Dict[str, Any],
        depth: int = 0,
    ):
        """
        Loop recursivo que procesa nodos hasta detenerse.

        Se detiene cuando:
        - Llega a un nodo TAREA (espera humano)
        - Llega a un nodo FIN (workflow completado)
        - Llega a un EVENTO con timer (espera celery)
        - No hay transiciones validas (error/queda en nodo)
        - Se alcanza MAX_ADVANCEMENT_DEPTH (circuit breaker)
        """
        if depth >= MAX_ADVANCEMENT_DEPTH:
            raise WorkflowExecutionError(
                f"[WF:{instancia.codigo_instancia}] Profundidad maxima de avance "
                f"({MAX_ADVANCEMENT_DEPTH}) alcanzada. Posible loop circular."
            )

        # Para nodos que NO son el nodo actual del flujo,
        # primero evaluamos transiciones salientes
        if nodo_actual.tipo in ('INICIO', 'TAREA'):
            # Estos nodos ya fueron procesados; buscar siguiente
            next_nodes = cls._evaluar_transiciones_salientes(
                nodo_actual, datos_contexto
            )
        elif nodo_actual.tipo in ('GATEWAY_EXCLUSIVO', 'GATEWAY_PARALELO', 'FIN', 'EVENTO'):
            # Estos nodos se procesan directamente con su handler
            handler = NodeHandlerRegistry.get_handler(nodo_actual.tipo)
            next_nodes = handler.handle(
                instancia, nodo_actual, usuario, datos_contexto
            )
        else:
            logger.warning(
                f"[WF:{instancia.codigo_instancia}] Tipo de nodo desconocido: "
                f"'{nodo_actual.tipo}'"
            )
            return

        # Procesar cada nodo siguiente
        for next_nodo in next_nodes:
            if next_nodo.tipo == 'TAREA':
                # Crear tarea y detenerse
                from .node_handlers import TareaNodeHandler
                TareaNodeHandler.handle(
                    instancia, next_nodo, usuario, datos_contexto
                )
            elif next_nodo.tipo == 'FIN':
                # Completar workflow
                from .node_handlers import FinNodeHandler
                FinNodeHandler.handle(
                    instancia, next_nodo, usuario, datos_contexto
                )
            else:
                # Gateways, eventos: seguir recursivamente
                cls._avanzar_desde_nodo(
                    instancia, next_nodo, usuario, datos_contexto, depth + 1
                )

    @classmethod
    def _evaluar_transiciones_salientes(cls, nodo, datos_contexto):
        """
        Evalua las transiciones salientes de un nodo y retorna los destinos.

        Para nodos INICIO/TAREA: retorna todas las transiciones que matchean.
        Para gateways: se manejan en sus propios handlers.
        """
        from apps.infraestructura.workflow_engine.disenador_flujos.models import TransicionFlujo

        transiciones = TransicionFlujo.objects.filter(
            nodo_origen=nodo,
            plantilla=nodo.plantilla,
        ).select_related('nodo_destino').order_by('-prioridad')

        if not transiciones.exists():
            logger.warning(
                f"Nodo '{nodo.codigo}' no tiene transiciones salientes"
            )
            return []

        # Para TAREA con multiples transiciones (ej: APROBAR/RECHAZAR),
        # evaluar como gateway exclusivo
        if transiciones.count() > 1:
            datos = datos_contexto or {}
            default = None

            for transicion in transiciones:
                if not transicion.condicion:
                    default = transicion
                    continue
                if transicion.evaluar_condicion(datos):
                    return [transicion.nodo_destino]

            # Usar default si no hay match
            if default:
                return [default.nodo_destino]

            # Si hay exactamente una transicion sin condicion, usarla
            return []

        # Transicion unica: siempre seguir
        return [transiciones.first().nodo_destino]

    @classmethod
    def _generar_codigo_instancia(cls, plantilla, empresa_id: int) -> str:
        """
        Genera codigo unico de instancia.

        Formato: WF-{PLANTILLA_CODIGO}-{YYYY}-{NNNN}
        Ejemplo: WF-APROB_VACACIONES-2026-0001
        """
        from apps.infraestructura.workflow_engine.ejecucion.models import InstanciaFlujo

        year = timezone.now().year
        prefix = f"WF-{plantilla.codigo}-{year}"

        count = InstanciaFlujo.objects.filter(
            codigo_instancia__startswith=prefix,
            empresa_id=empresa_id,
        ).count()

        return f"{prefix}-{(count + 1):04d}"

    @classmethod
    def _manejar_join_paralelo(cls, instancia, nodo_completado, datos_contexto):
        """
        Verifica si el nodo completado es parte de un split paralelo
        y maneja la logica de join.

        Returns:
            tuple(bool, NodoFlujo | None):
                - (True, join_nodo): Todas las ramas completaron, avanzar desde join
                - (False, marker): Aun faltan ramas, no avanzar
                - (False, None): No es parte de un paralelo, avance normal
        """
        from apps.infraestructura.workflow_engine.disenador_flujos.models import NodoFlujo

        variables = instancia.variables_flujo or {}
        parallel_data = variables.get('_parallel_branches', {})

        if not parallel_data:
            return False, None

        # Buscar si este nodo esta en alguna rama paralela
        for gateway_codigo, branch_info in parallel_data.items():
            expected = branch_info.get('expected', [])
            completed = branch_info.get('completed', [])

            if nodo_completado.codigo in expected:
                # Marcar rama como completada
                if nodo_completado.codigo not in completed:
                    completed.append(nodo_completado.codigo)
                    branch_info['completed'] = completed
                    variables['_parallel_branches'][gateway_codigo] = branch_info
                    instancia.variables_flujo = variables
                    instancia.save()

                # Verificar si todas completaron
                if set(completed) >= set(expected):
                    logger.info(
                        f"[WF:{instancia.codigo_instancia}] Todas las ramas "
                        f"del paralelo '{gateway_codigo}' completadas: {completed}"
                    )

                    # Encontrar el nodo join
                    join_codigo = branch_info.get('join_gateway')
                    if join_codigo:
                        try:
                            join_nodo = NodoFlujo.objects.get(
                                plantilla=instancia.plantilla,
                                codigo=join_codigo,
                            )
                            # Limpiar tracking
                            del variables['_parallel_branches'][gateway_codigo]
                            instancia.variables_flujo = variables
                            instancia.save()
                            return True, join_nodo
                        except NodoFlujo.DoesNotExist:
                            logger.error(
                                f"[WF:{instancia.codigo_instancia}] Nodo join "
                                f"'{join_codigo}' no encontrado"
                            )
                            return True, None

                    # Sin join gateway configurado: buscar por estructura
                    join_nodo = cls._detectar_join_gateway(
                        instancia.plantilla, gateway_codigo
                    )
                    if join_nodo:
                        del variables['_parallel_branches'][gateway_codigo]
                        instancia.variables_flujo = variables
                        instancia.save()
                        return True, join_nodo

                    # No se encontro join: avanzar sin join
                    return True, None

                # Faltan ramas
                return False, 'waiting'

        # No es parte de ningun paralelo
        return False, None

    @classmethod
    def _detectar_join_gateway(cls, plantilla, split_gateway_codigo):
        """
        Intenta detectar automaticamente el join gateway correspondiente
        a un split gateway, buscando un GATEWAY_PARALELO que recibe
        transiciones de las ramas del split.
        """
        from apps.infraestructura.workflow_engine.disenador_flujos.models import NodoFlujo, TransicionFlujo

        # Buscar todos los GATEWAY_PARALELO de la plantilla que no sean el split
        join_candidates = NodoFlujo.objects.filter(
            plantilla=plantilla,
            tipo='GATEWAY_PARALELO',
        ).exclude(codigo=split_gateway_codigo)

        for candidate in join_candidates:
            entrantes = TransicionFlujo.objects.filter(
                nodo_destino=candidate,
                plantilla=plantilla,
            ).count()
            # Un join tiene multiples transiciones entrantes
            if entrantes > 1:
                return candidate

        return None
