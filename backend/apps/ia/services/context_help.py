"""
ContextualHelpService — Ayuda contextual inteligente.

Genera explicaciones sobre dónde está el usuario y qué puede hacer,
usando metadata de los módulos + IA generativa.

Uso:
    from apps.ia.services.context_help import ContextualHelpService

    result = ContextualHelpService.get_help(
        module_code='planeacion_estrategica',
        tab_code='objetivos',
        user_role='ADMIN',
    )
"""

import logging
from typing import Optional

from django.core.cache import cache

from .gemini_service import GeminiService, AIResult

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════
# METADATA DE MÓDULOS (fallback sin IA)
# ═══════════════════════════════════════════════════════════════════════════

MODULE_HELP = {
    # C1 — Fundación
    'fundacion': {
        'name': 'Fundación Organizacional',
        'description': 'Configura los cimientos de tu organización: empresa, estructura, identidad corporativa.',
        'tabs': {
            'empresa': 'Configuración general de la empresa: datos legales, contacto, logotipo, parámetros del sistema.',
            'estructura': 'Áreas funcionales, procesos y organigrama. Define la estructura organizacional.',
            'identidad': 'Misión, visión, valores y política integral de la organización.',
            'integraciones': 'Conexiones con servicios externos: email, IA, facturación, almacenamiento.',
        },
    },

    # C2 — Planeación Estratégica
    'planeacion_estrategica': {
        'name': 'Planeación Estratégica',
        'description': 'Gestión del plan estratégico organizacional: contexto, objetivos, KPIs y proyectos.',
        'tabs': {
            'contexto': 'Análisis DOFA, partes interesadas y factores internos/externos (ISO 9001 Cláusula 4).',
            'planes': 'Planes estratégicos con períodos de vigencia y seguimiento.',
            'objetivos': 'Objetivos estratégicos alineados con la identidad corporativa.',
            'kpis': 'Indicadores de gestión (KPIs) con metas, umbrales y mediciones periódicas.',
            'riesgos_oportunidades': 'Riesgos y oportunidades estratégicas vinculadas a los objetivos.',
            'proyectos': 'Gestión de proyectos estratégicos con tareas y seguimiento.',
        },
    },

    # C2 — Cumplimiento
    'motor_cumplimiento': {
        'name': 'Cumplimiento Legal',
        'description': 'Gestión de requisitos legales, matriz legal y evidencias de cumplimiento normativo.',
        'tabs': {
            'matriz_legal': 'Matriz de requisitos legales aplicables a la organización.',
            'requisitos': 'Detalle de cada requisito legal con responsables y evidencias.',
            'reglamentos': 'Reglamentos internos de la organización.',
            'evidencias': 'Gestión de evidencias documentales de cumplimiento.',
        },
    },

    # C2 — Riesgos
    'motor_riesgos': {
        'name': 'Motor de Riesgos',
        'description': 'Gestión integral de riesgos organizacionales bajo ISO 31000.',
        'tabs': {
            'riesgos_procesos': 'Identificación y valoración de riesgos por proceso.',
            'ipevr': 'Identificación de Peligros, Evaluación y Valoración de Riesgos (GTC-45).',
            'aspectos_ambientales': 'Aspectos e impactos ambientales (ISO 14001).',
            'riesgos_viales': 'Riesgos viales del PESV (Plan Estratégico de Seguridad Vial).',
            'sagrilaft_ptee': 'Riesgos de lavado de activos y financiación del terrorismo.',
            'seguridad_informacion': 'Riesgos de seguridad de la información (ISO 27001).',
        },
    },

    # C2 — HSEQ
    'hseq_management': {
        'name': 'HSEQ - Torre de Control',
        'description': 'Gestión de Seguridad y Salud en el Trabajo, Calidad y Medio Ambiente.',
        'tabs': {
            'accidentalidad': 'Registro y seguimiento de accidentes, enfermedades e incidentes laborales.',
            'seguridad_industrial': 'Inspecciones, permisos de trabajo, EPP y programas de seguridad.',
            'higiene_industrial': 'Monitoreo de agentes de riesgo: ruido, iluminación, químicos.',
            'medicina_laboral': 'Exámenes médicos, profesiogramas y vigilancia epidemiológica.',
            'emergencias': 'Planes de emergencia, brigadas, simulacros.',
            'gestion_ambiental': 'Gestión ambiental: residuos, emisiones, vertimientos.',
            'calidad': 'Gestión de calidad: no conformidades, acciones correctivas, quejas.',
            'mejora_continua': 'Acciones de mejora, proyectos de mejora continua.',
            'comites': 'Comités organizacionales: COPASST, Convivencia, Brigadas.',
        },
    },

    # C2 — Supply Chain
    'supply_chain': {
        'name': 'Cadena de Suministro',
        'description': 'Gestión de proveedores, compras, inventario y programación de abastecimiento.',
        'tabs': {
            'proveedores': 'Directorio de proveedores con evaluación y documentación.',
            'compras': 'Requisiciones, cotizaciones, órdenes de compra y recepciones.',
            'almacenamiento': 'Control de inventario, movimientos, alertas de stock.',
            'programacion': 'Programación de abastecimiento con asignación de recursos.',
        },
    },

    # C2 — Talent Hub
    'talent_hub': {
        'name': 'Talent Hub - Gestión Humana',
        'description': 'Gestión integral del talento humano: selección, desarrollo, nómina.',
        'tabs': {
            'estructura_cargos': 'Organigrama, profesiogramas, competencias por cargo.',
            'seleccion': 'Pipeline de selección, vacantes, postulaciones, entrevistas.',
            'colaboradores': 'Directorio de colaboradores, hojas de vida, documentos.',
            'onboarding': 'Inducción, checklist, entrega de EPP, firma de contratos.',
            'formacion': 'LMS: capacitaciones, programación, certificados.',
            'desempeno': 'Evaluaciones de desempeño 360°, planes de mejora.',
            'control_tiempo': 'Turnos, asistencia, horas extra.',
            'novedades': 'Incapacidades, licencias, permisos, vacaciones.',
            'disciplinario': 'Proceso disciplinario: llamados, descargos, memorandos.',
            'nomina': 'Períodos de nómina, conceptos, liquidación.',
            'off_boarding': 'Retiro, checklist de salida, paz y salvo.',
        },
    },

    # CT — Workflows
    'infra_workflow_engine': {
        'name': 'Flujos de Trabajo',
        'description': 'Motor BPM para automatización de procesos organizacionales.',
        'tabs': {
            'disenador_flujos': 'Diseñador visual de flujos de trabajo con nodos y transiciones.',
            'ejecucion': 'Instancias de flujos en ejecución, tareas pendientes.',
            'monitoreo': 'Métricas, tiempos de ejecución, cuellos de botella.',
        },
    },

    # C3 — Analytics
    'analytics': {
        'name': 'Analytics e Inteligencia',
        'description': 'Dashboards gerenciales, indicadores, informes y análisis de tendencias.',
        'tabs': {
            'dashboard': 'Dashboard gerencial con KPIs consolidados de todos los módulos.',
            'indicadores': 'Configuración y seguimiento de indicadores por área.',
            'informes': 'Generador de informes automáticos con exportación.',
            'tendencias': 'Análisis de tendencias y proyecciones.',
        },
    },
}


class ContextualHelpService:
    """
    Servicio para generar ayuda contextual inteligente.

    1. Busca metadata predefinida del módulo/tab
    2. Si hay IA disponible, enriquece con Gemini
    3. Retorna respuesta estructurada
    """

    # Instrucción del sistema para Gemini
    SYSTEM_INSTRUCTION = (
        'Eres un asistente de ayuda contextual para StrateKaz, '
        'un Sistema de Gestión Integral (SGI) para empresas colombianas. '
        'Tu rol es explicar de forma clara y concisa en qué sección está el usuario '
        'y qué acciones puede realizar. '
        'Responde SIEMPRE en español colombiano. '
        'Sé breve, amigable y práctico. '
        'Usa viñetas para las acciones disponibles. '
        'NO uses jerga técnica innecesaria. '
        'Máximo 200 palabras.'
    )

    CACHE_TTL = 60 * 60 * 24  # 24 horas

    @classmethod
    def get_help(
        cls,
        module_code: str,
        tab_code: Optional[str] = None,
        section_name: Optional[str] = None,
        use_ai: bool = True,
    ) -> dict:
        """
        Obtiene ayuda contextual para el módulo/tab actual.

        Args:
            module_code: Código del módulo (ej: 'planeacion_estrategica')
            tab_code: Código del tab activo (ej: 'objetivos')
            section_name: Nombre de la sección específica
            use_ai: Si debe usar IA para enriquecer (default True)

        Returns:
            dict con keys: title, description, actions, tips, ai_enhanced
        """
        # Intentar cache
        cache_key = f'ia_help_{module_code}_{tab_code or "main"}_{section_name or ""}'
        cached = cache.get(cache_key)
        if cached:
            return cached

        # Obtener metadata estática
        module_info = MODULE_HELP.get(module_code, {})
        module_name = module_info.get('name', module_code.replace('_', ' ').title())
        module_desc = module_info.get('description', '')
        tab_desc = module_info.get('tabs', {}).get(tab_code, '') if tab_code else ''

        # Respuesta base (sin IA)
        result = {
            'title': module_name,
            'description': module_desc,
            'tab_help': tab_desc,
            'section_help': '',
            'tips': [],
            'ai_enhanced': False,
        }

        # Enriquecer con IA si está disponible
        if use_ai and GeminiService.is_available():
            try:
                ai_result = cls._enrich_with_ai(
                    module_name=module_name,
                    module_desc=module_desc,
                    tab_code=tab_code,
                    tab_desc=tab_desc,
                    section_name=section_name,
                )
                if ai_result.success:
                    result['ai_response'] = ai_result.text
                    result['ai_enhanced'] = True
                    result['tokens_used'] = ai_result.tokens_used
            except Exception as e:
                logger.warning(f'Error enriqueciendo ayuda con IA: {e}')

        # Cachear resultado
        cache.set(cache_key, result, cls.CACHE_TTL)

        return result

    @classmethod
    def _enrich_with_ai(
        cls,
        module_name: str,
        module_desc: str,
        tab_code: Optional[str],
        tab_desc: str,
        section_name: Optional[str],
    ) -> AIResult:
        """Genera texto enriquecido con Gemini."""
        parts = [
            f'El usuario está en el módulo "{module_name}".',
        ]
        if module_desc:
            parts.append(f'Descripción del módulo: {module_desc}')
        if tab_code and tab_desc:
            parts.append(f'Tab activo: "{tab_code}". Descripción: {tab_desc}')
        if section_name:
            parts.append(f'Sección específica: "{section_name}".')

        parts.append(
            'Explica brevemente dónde está el usuario, qué puede hacer aquí '
            'y da 3-5 tips prácticos para sacarle provecho a esta sección.'
        )

        prompt = '\n'.join(parts)

        return GeminiService.generate(
            prompt=prompt,
            system_instruction=cls.SYSTEM_INSTRUCTION,
            max_tokens=400,
            temperature=0.5,
        )
