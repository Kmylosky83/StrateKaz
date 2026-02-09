"""
Señales personalizadas del Workflow Engine.

Emitidas por WorkflowExecutionService para permitir integracion
cross-modulo sin acoplamiento directo.

Ejemplo de uso en otro modulo:
    from apps.workflow_engine.ejecucion.signals import workflow_completado

    @receiver(workflow_completado)
    def handle_workflow_completed(sender, instancia, **kwargs):
        if instancia.entidad_tipo == 'solicitud_compra':
            SolicitudCompra.objects.filter(id=instancia.entidad_id).update(
                estado='APROBADA'
            )
"""
from django.dispatch import Signal

# Emitida cuando se crea una nueva instancia de flujo
# Provee: instancia (InstanciaFlujo), usuario (User)
workflow_iniciado = Signal()

# Emitida cuando una instancia llega al nodo FIN
# Provee: instancia (InstanciaFlujo), usuario (User)
workflow_completado = Signal()

# Emitida cuando se cancela una instancia
# Provee: instancia (InstanciaFlujo), usuario (User), motivo (str)
workflow_cancelado = Signal()

# Emitida cuando se crea y asigna una nueva tarea
# Provee: tarea (TareaActiva), instancia (InstanciaFlujo), usuario_asignado (User)
tarea_creada = Signal()

# Emitida cuando un usuario completa una tarea
# Provee: tarea (TareaActiva), instancia (InstanciaFlujo), usuario (User), decision (str)
tarea_completada = Signal()

# Emitida cuando un usuario rechaza una tarea
# Provee: tarea (TareaActiva), instancia (InstanciaFlujo), usuario (User), motivo (str)
tarea_rechazada = Signal()

# Emitida cuando una tarea es escalada por vencimiento de SLA
# Provee: tarea (TareaActiva), instancia (InstanciaFlujo), escalada_a (User)
tarea_escalada = Signal()
