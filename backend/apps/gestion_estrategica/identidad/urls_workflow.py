"""
URLs para el sistema de Workflow de Firmas Digitales y Revisión Periódica
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views_workflow import (
    FirmaDigitalViewSet,
    ConfiguracionRevisionViewSet,
    HistorialVersionViewSet,
    ConfiguracionWorkflowFirmaViewSet,
)

# Router principal
router = DefaultRouter()

# Registrar viewsets
router.register(r'firmas-digitales', FirmaDigitalViewSet, basename='firma-digital')
router.register(r'configuracion-revision', ConfiguracionRevisionViewSet, basename='configuracion-revision')
router.register(r'historial-versiones', HistorialVersionViewSet, basename='historial-version')
router.register(r'workflow-firmas', ConfiguracionWorkflowFirmaViewSet, basename='workflow-firma')

# URLs patterns
urlpatterns = [
    path('', include(router.urls)),
]

"""
ENDPOINTS DISPONIBLES:

=============================================================================
FIRMAS DIGITALES
=============================================================================

GET    /api/gestion-estrategica/identidad/workflow/firmas-digitales/
       - Listar todas las firmas digitales
       - Query params: ?status=PENDIENTE&rol_firma=APROBO&search=Juan

POST   /api/gestion-estrategica/identidad/workflow/firmas-digitales/
       - Crear firma digital (admin)

GET    /api/gestion-estrategica/identidad/workflow/firmas-digitales/{id}/
       - Detalle de firma digital

PUT    /api/gestion-estrategica/identidad/workflow/firmas-digitales/{id}/
       - Actualizar firma digital (admin)

DELETE /api/gestion-estrategica/identidad/workflow/firmas-digitales/{id}/
       - Eliminar firma digital (admin)

POST   /api/gestion-estrategica/identidad/workflow/firmas-digitales/{id}/firmar/
       - Firmar documento
       Body: {
           "firma_base64": "data:image/png;base64,xxxxx",
           "observaciones": "Aprobado"
       }

POST   /api/gestion-estrategica/identidad/workflow/firmas-digitales/{id}/rechazar/
       - Rechazar firma
       Body: {
           "motivo": "No cumple requisitos"
       }

POST   /api/gestion-estrategica/identidad/workflow/firmas-digitales/{id}/delegar/
       - Delegar firma a otro usuario
       Body: {
           "nuevo_firmante_id": 123,
           "motivo": "Ausencia temporal"
       }

GET    /api/gestion-estrategica/identidad/workflow/firmas-digitales/{id}/verificar-integridad/
       - Verificar integridad de firma (hash SHA-256)

GET    /api/gestion-estrategica/identidad/workflow/firmas-digitales/mis-firmas-pendientes/
       - Obtener firmas pendientes del usuario actual
       - Query params: ?es_mi_turno=true

GET    /api/gestion-estrategica/identidad/workflow/firmas-digitales/documento/{content_type_id}/{object_id}/
       - Obtener todas las firmas de un documento específico
       - Ejemplo: /firmas-digitales/documento/45/123/

GET    /api/gestion-estrategica/identidad/workflow/firmas-digitales/estadisticas/
       - Estadísticas de firmas
       - Query params: ?fecha_desde=2024-01-01&fecha_hasta=2024-12-31

=============================================================================
CONFIGURACIÓN DE REVISIÓN PERIÓDICA
=============================================================================

GET    /api/gestion-estrategica/identidad/workflow/configuracion-revision/
       - Listar configuraciones de revisión
       - Query params: ?frecuencia=ANUAL&estado=VIGENTE

POST   /api/gestion-estrategica/identidad/workflow/configuracion-revision/
       - Crear configuración de revisión
       Body: {
           "content_type": 45,
           "object_id": 123,
           "frecuencia": "ANUAL",
           "tipo_revision": "NUEVA_VERSION",
           "alertas_dias_previos": [30, 15, 7],
           "proxima_revision": "2025-01-15"
       }

GET    /api/gestion-estrategica/identidad/workflow/configuracion-revision/{id}/
       - Detalle de configuración

PUT    /api/gestion-estrategica/identidad/workflow/configuracion-revision/{id}/
       - Actualizar configuración

DELETE /api/gestion-estrategica/identidad/workflow/configuracion-revision/{id}/
       - Eliminar configuración

POST   /api/gestion-estrategica/identidad/workflow/configuracion-revision/{id}/iniciar-revision/
       - Iniciar proceso de revisión
       Body: {
           "observaciones": "Iniciando revisión anual"
       }

POST   /api/gestion-estrategica/identidad/workflow/configuracion-revision/{id}/completar-revision/
       - Completar revisión y actualizar próxima fecha
       Body: {
           "observaciones": "Revisión completada sin cambios"
       }

POST   /api/gestion-estrategica/identidad/workflow/configuracion-revision/{id}/enviar-alerta/
       - Enviar alerta de revisión manualmente

GET    /api/gestion-estrategica/identidad/workflow/configuracion-revision/proximos-vencimientos/
       - Obtener configuraciones próximas a vencer
       - Query params: ?dias=30

GET    /api/gestion-estrategica/identidad/workflow/configuracion-revision/vencidas/
       - Obtener configuraciones vencidas

GET    /api/gestion-estrategica/identidad/workflow/configuracion-revision/estadisticas/
       - Estadísticas de revisiones

=============================================================================
HISTORIAL DE VERSIONES
=============================================================================

GET    /api/gestion-estrategica/identidad/workflow/historial-versiones/
       - Listar historial de versiones
       - Query params: ?tipo_cambio=MODIFICACION&usuario=123

GET    /api/gestion-estrategica/identidad/workflow/historial-versiones/{id}/
       - Detalle de versión (incluye snapshot completo)

POST   /api/gestion-estrategica/identidad/workflow/historial-versiones/comparar/
       - Comparar dos versiones
       Body: {
           "version_a_id": 123,
           "version_b_id": 456
       }

POST   /api/gestion-estrategica/identidad/workflow/historial-versiones/{id}/restaurar/
       - Restaurar documento a esta versión (solo staff)
       Body: {
           "confirmar": true
       }

GET    /api/gestion-estrategica/identidad/workflow/historial-versiones/documento/{content_type_id}/{object_id}/
       - Obtener historial completo de un documento
       - Ejemplo: /historial-versiones/documento/45/123/

=============================================================================
CONFIGURACIÓN DE WORKFLOW DE FIRMA
=============================================================================

GET    /api/gestion-estrategica/identidad/workflow/workflow-firmas/
       - Listar workflows de firma
       - Query params: ?tipo_politica=INTEGRAL&activo=true

POST   /api/gestion-estrategica/identidad/workflow/workflow-firmas/
       - Crear workflow de firma
       Body: {
           "nombre": "Workflow Política SST",
           "tipo_orden": "SECUENCIAL",
           "dias_para_firmar": 5,
           "roles_config": [
               {
                   "rol": "ELABORO",
                   "orden": 1,
                   "cargo_id": 10
               },
               {
                   "rol": "REVISO",
                   "orden": 2,
                   "cargo_id": 15
               },
               {
                   "rol": "APROBO",
                   "orden": 3,
                   "usuario_id": 5
               }
           ]
       }

GET    /api/gestion-estrategica/identidad/workflow/workflow-firmas/{id}/
       - Detalle de workflow

PUT    /api/gestion-estrategica/identidad/workflow/workflow-firmas/{id}/
       - Actualizar workflow

DELETE /api/gestion-estrategica/identidad/workflow/workflow-firmas/{id}/
       - Eliminar workflow

POST   /api/gestion-estrategica/identidad/workflow/workflow-firmas/{id}/aplicar/
       - Aplicar workflow a un documento
       Body: {
           "content_type": "identidad.politicaintegral",
           "object_id": 123
       }

GET    /api/gestion-estrategica/identidad/workflow/workflow-firmas/{id}/validar/
       - Validar configuración del workflow

POST   /api/gestion-estrategica/identidad/workflow/workflow-firmas/{id}/duplicar/
       - Duplicar workflow
       Body: {
           "nuevo_nombre": "Workflow Política SST - Copia"
       }

=============================================================================
EJEMPLOS DE USO
=============================================================================

1. CREAR WORKFLOW DE FIRMA:
   POST /api/gestion-estrategica/identidad/workflow/workflow-firmas/
   {
       "nombre": "Workflow Política SST",
       "descripcion": "Workflow estándar para políticas SST",
       "tipo_politica": "ESPECIFICA",
       "tipo_orden": "SECUENCIAL",
       "dias_para_firmar": 5,
       "permitir_delegacion": true,
       "roles_config": [
           {
               "rol": "ELABORO",
               "orden": 1,
               "obligatorio": true,
               "cargo_id": 10
           },
           {
               "rol": "REVISO",
               "orden": 2,
               "obligatorio": true,
               "cargo_id": 15
           },
           {
               "rol": "APROBO",
               "orden": 3,
               "obligatorio": true,
               "usuario_id": 5
           }
       ]
   }

2. APLICAR WORKFLOW A POLÍTICA:
   POST /api/gestion-estrategica/identidad/workflow/workflow-firmas/1/aplicar/
   {
       "content_type": "identidad.politicaespecifica",
       "object_id": 45
   }

3. FIRMAR DOCUMENTO:
   POST /api/gestion-estrategica/identidad/workflow/firmas-digitales/1/firmar/
   {
       "firma_base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...",
       "observaciones": "Aprobado según criterios técnicos y normativos"
   }

4. CONFIGURAR REVISIÓN PERIÓDICA:
   POST /api/gestion-estrategica/identidad/workflow/configuracion-revision/
   {
       "content_type": 45,
       "object_id": 123,
       "frecuencia": "ANUAL",
       "tipo_revision": "NUEVA_VERSION",
       "auto_renovar": false,
       "responsable_revision": 5,
       "alertas_dias_previos": [30, 15, 7],
       "alertar_creador": true,
       "alertar_responsable": true,
       "proxima_revision": "2025-01-15"
   }

5. COMPARAR VERSIONES:
   POST /api/gestion-estrategica/identidad/workflow/historial-versiones/comparar/
   {
       "version_a_id": 10,
       "version_b_id": 11
   }

6. OBTENER MIS FIRMAS PENDIENTES:
   GET /api/gestion-estrategica/identidad/workflow/firmas-digitales/mis-firmas-pendientes/?es_mi_turno=true

7. DELEGAR FIRMA:
   POST /api/gestion-estrategica/identidad/workflow/firmas-digitales/1/delegar/
   {
       "nuevo_firmante_id": 25,
       "motivo": "Vacaciones programadas del 15 al 30 de enero"
   }

8. VER PRÓXIMOS VENCIMIENTOS:
   GET /api/gestion-estrategica/identidad/workflow/configuracion-revision/proximos-vencimientos/?dias=30

9. INICIAR REVISIÓN:
   POST /api/gestion-estrategica/identidad/workflow/configuracion-revision/1/iniciar-revision/
   {
       "observaciones": "Iniciando revisión anual programada según Decreto 1072"
   }

10. VERIFICAR INTEGRIDAD DE FIRMA:
    GET /api/gestion-estrategica/identidad/workflow/firmas-digitales/1/verificar-integridad/
"""
