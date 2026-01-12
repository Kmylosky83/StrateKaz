"""
URLs para Valores Corporativos Vividos
======================================

Endpoints para gestionar la conexión entre valores y acciones,
incluyendo estadísticas para el módulo de BI.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views_valores_vividos import (
    ValorVividoViewSet,
    ConfiguracionMetricaValorViewSet,
)

# Router
router = DefaultRouter()
router.register(r'valores-vividos', ValorVividoViewSet, basename='valor-vivido')
router.register(r'config-metricas', ConfiguracionMetricaValorViewSet, basename='config-metrica')

urlpatterns = [
    path('', include(router.urls)),
]

"""
ENDPOINTS DISPONIBLES:

=============================================================================
VALORES VIVIDOS (Conexión valor-acción)
=============================================================================

GET    /api/gestion-estrategica/identidad/bi/valores-vividos/
       - Listar todos los vínculos valor-acción
       - Query params: ?valor=1&categoria_accion=PROYECTO&impacto=ALTO

POST   /api/gestion-estrategica/identidad/bi/valores-vividos/
       - Crear vínculo (usar /vincular/ preferentemente)

GET    /api/gestion-estrategica/identidad/bi/valores-vividos/{id}/
       - Detalle de un vínculo

PUT    /api/gestion-estrategica/identidad/bi/valores-vividos/{id}/
       - Actualizar vínculo

DELETE /api/gestion-estrategica/identidad/bi/valores-vividos/{id}/
       - Eliminar vínculo (soft delete)

POST   /api/gestion-estrategica/identidad/bi/valores-vividos/vincular/
       - Vincular un valor a una acción
       Body: {
           "valor_id": 1,
           "content_type": "planeacion.proyecto",
           "object_id": 123,
           "categoria_accion": "PROYECTO",
           "tipo_vinculo": "REFLEJA",
           "impacto": "ALTO",
           "justificacion": "Este proyecto ejemplifica..."
       }

POST   /api/gestion-estrategica/identidad/bi/valores-vividos/vincular-multiples/
       - Vincular múltiples valores a una acción
       Body: {
           "valores_ids": [1, 2, 3],
           "content_type": "planeacion.proyecto",
           "object_id": 123,
           "categoria_accion": "PROYECTO",
           "justificacion": "Esta acción refleja nuestros valores..."
       }

POST   /api/gestion-estrategica/identidad/bi/valores-vividos/{id}/verificar/
       - Verificar un vínculo (supervisor)
       Body: {
           "observaciones": "Verificado correctamente"
       }

GET    /api/gestion-estrategica/identidad/bi/valores-vividos/por-accion/{content_type}/{object_id}/
       - Obtener valores vinculados a una acción
       - Ejemplo: /por-accion/planeacion.proyecto/123/

GET    /api/gestion-estrategica/identidad/bi/valores-vividos/por-valor/{valor_id}/
       - Obtener acciones vinculadas a un valor
       - Query params: ?categoria=PROYECTO&fecha_desde=2024-01-01

=============================================================================
ESTADÍSTICAS PARA BI
=============================================================================

GET    /api/gestion-estrategica/identidad/bi/valores-vividos/estadisticas/
       - Estadísticas por valor corporativo
       - Query params: ?fecha_desde=2024-01-01&fecha_hasta=2024-12-31
       Response: [
           {
               "valor__id": 1,
               "valor__name": "Innovación",
               "total_acciones": 25,
               "impacto_bajo": 5,
               "impacto_medio": 10,
               "impacto_alto": 7,
               "impacto_muy_alto": 3,
               "porcentaje_alto_impacto": 40.0
           },
           ...
       ]

GET    /api/gestion-estrategica/identidad/bi/valores-vividos/tendencia/
       - Tendencia mensual de valores vividos
       - Query params: ?meses=12
       Response: [
           {"mes": "2024-01-01", "valor__id": 1, "valor__name": "Innovación", "total": 5},
           ...
       ]

GET    /api/gestion-estrategica/identidad/bi/valores-vividos/ranking-categorias/
       - Ranking de categorías de acciones
       - Query params: ?valor_id=1
       Response: [
           {"categoria_accion": "PROYECTO", "total": 25, "porcentaje": 35.5},
           {"categoria_accion": "ACCION_MEJORA", "total": 20, "porcentaje": 28.4},
           ...
       ]

GET    /api/gestion-estrategica/identidad/bi/valores-vividos/subrepresentados/
       - Valores con pocas acciones vinculadas
       - Query params: ?umbral=5
       Response: [
           {
               "valor_id": 3,
               "valor_nombre": "Sostenibilidad",
               "total_acciones": 2,
               "deficit": 3,
               "porcentaje_cumplimiento": 40.0
           },
           ...
       ]

GET    /api/gestion-estrategica/identidad/bi/valores-vividos/resumen/
       - Resumen ejecutivo para dashboard BI
       Response: {
           "total_vinculos": 150,
           "total_valores_activos": 8,
           "valores_con_acciones": 6,
           "valores_sin_acciones": 2,
           "promedio_acciones_por_valor": 18.75,
           "puntaje_promedio": 6.5,
           "por_impacto": {"BAJO": 20, "MEDIO": 80, "ALTO": 40, "MUY_ALTO": 10},
           "por_categoria": [...],
           "top_valores": [...],
           "valores_subrepresentados": [...]
       }

=============================================================================
CONFIGURACIÓN DE MÉTRICAS
=============================================================================

GET    /api/gestion-estrategica/identidad/bi/config-metricas/
       - Listar configuraciones de métricas

POST   /api/gestion-estrategica/identidad/bi/config-metricas/
       - Crear configuración

GET    /api/gestion-estrategica/identidad/bi/config-metricas/{id}/
       - Detalle de configuración

PUT    /api/gestion-estrategica/identidad/bi/config-metricas/{id}/
       - Actualizar configuración

GET    /api/gestion-estrategica/identidad/bi/config-metricas/mi-configuracion/
       - Obtener configuración de la empresa del usuario (crea si no existe)

=============================================================================
EJEMPLOS DE USO
=============================================================================

1. VINCULAR VALOR A PROYECTO:
   POST /api/gestion-estrategica/identidad/bi/valores-vividos/vincular/
   {
       "valor_id": 1,
       "content_type": "planeacion.proyecto",
       "object_id": 45,
       "categoria_accion": "PROYECTO",
       "tipo_vinculo": "REFLEJA",
       "impacto": "ALTO",
       "justificacion": "Este proyecto de innovación tecnológica ejemplifica
                        nuestro valor de Innovación al implementar nuevas
                        soluciones para optimizar procesos."
   }

2. VINCULAR MÚLTIPLES VALORES A ACCIÓN CORRECTIVA:
   POST /api/gestion-estrategica/identidad/bi/valores-vividos/vincular-multiples/
   {
       "valores_ids": [2, 5],
       "content_type": "mejora_continua.accioncorrectiva",
       "object_id": 123,
       "categoria_accion": "ACCION_CORRECTIVA",
       "tipo_vinculo": "MEJORA",
       "impacto": "MEDIO",
       "justificacion": "Esta acción correctiva demuestra nuestro compromiso
                        con la mejora continua y la responsabilidad."
   }

3. OBTENER VALORES DE UN PROYECTO:
   GET /api/gestion-estrategica/identidad/bi/valores-vividos/por-accion/planeacion.proyecto/45/

   Response:
   {
       "count": 2,
       "accion": {
           "content_type": "planeacion.proyecto",
           "object_id": "45"
       },
       "valores": [...]
   }

4. DASHBOARD BI - RESUMEN:
   GET /api/gestion-estrategica/identidad/bi/valores-vividos/resumen/

5. TENDENCIA PARA GRÁFICO:
   GET /api/gestion-estrategica/identidad/bi/valores-vividos/tendencia/?meses=12

6. IDENTIFICAR VALORES DÉBILES:
   GET /api/gestion-estrategica/identidad/bi/valores-vividos/subrepresentados/?umbral=5

=============================================================================
CATEGORÍAS DE ACCIONES DISPONIBLES
=============================================================================

- PROYECTO: Proyectos estratégicos
- OBJETIVO: Objetivos estratégicos
- INICIATIVA: Iniciativas
- ACCION_CORRECTIVA: Acciones correctivas
- ACCION_PREVENTIVA: Acciones preventivas
- ACCION_MEJORA: Acciones de mejora
- OPORTUNIDAD_MEJORA: Oportunidades de mejora
- GESTION_CAMBIO: Gestión del cambio
- INVESTIGACION_INCIDENTE: Investigación de incidentes
- INSPECCION: Inspecciones
- HALLAZGO_AUDITORIA: Hallazgos de auditoría
- NO_CONFORMIDAD: No conformidades
- ACCION_PESV: Acciones PESV
- OTRO: Otros

=============================================================================
TIPOS DE VÍNCULO
=============================================================================

- REFLEJA: La acción ejemplifica el valor
- PROMUEVE: La acción fomenta el valor
- RESULTADO: La acción es consecuencia del valor
- MEJORA: La acción fortalece el valor

=============================================================================
NIVELES DE IMPACTO
=============================================================================

- BAJO: Impacto bajo (puntaje base: 2)
- MEDIO: Impacto medio (puntaje base: 5)
- ALTO: Impacto alto (puntaje base: 8)
- MUY_ALTO: Impacto muy alto (puntaje base: 10)
"""
