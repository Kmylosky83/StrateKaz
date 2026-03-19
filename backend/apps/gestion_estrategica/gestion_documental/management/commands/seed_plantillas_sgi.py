"""
Seed: Plantillas de Documento estándar del SGI + Contrato Laboral.

Crea en cada tenant:
  - TipoDocumento: CONTRATO_LABORAL (prefijo CTR-, retención 20 años)
  - PlantillaDocumento × 6:
      1. Procedimiento Estándar SGI (PR)
      2. Instructivo Operativo (IN)
      3. Formato de Registro (FT)
      4. Manual del Sistema de Gestión (MA)
      5. Política Integral SGI (POL)
      6. Contrato Laboral por Defecto (CONTRATO_LABORAL)

Idempotente — usa update_or_create con unique_together (empresa_id, codigo).
Depende de: seed_tipos_documento_sgi (los TipoDocumento base ya deben existir).
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django.apps import apps


# ============================================================================
# PLANTILLA: PROCEDIMIENTO ESTÁNDAR SGI
# ============================================================================

PROCEDIMIENTO_HTML = """
<div class="documento-sgi procedimiento">
  <div class="encabezado text-center mb-4">
    <h2>{{titulo_documento}}</h2>
    <p class="text-muted">{{empresa_nombre}} — Sistema de Gestión Integral</p>
    <p><strong>Código:</strong> {{codigo_documento}} | <strong>Versión:</strong> {{version}} | <strong>Fecha:</strong> {{fecha_emision}}</p>
  </div>

  <div class="seccion mb-3">
    <h4>1. OBJETIVO</h4>
    <p>{{objetivo}}</p>
  </div>

  <div class="seccion mb-3">
    <h4>2. ALCANCE</h4>
    <p>{{alcance}}</p>
  </div>

  <div class="seccion mb-3">
    <h4>3. DEFINICIONES Y ABREVIATURAS</h4>
    <p>{{definiciones}}</p>
  </div>

  <div class="seccion mb-3">
    <h4>4. RESPONSABLES</h4>
    <table class="table table-bordered">
      <thead>
        <tr><th>Cargo</th><th>Responsabilidad</th></tr>
      </thead>
      <tbody>
        <tr><td>{{responsable_1_cargo}}</td><td>{{responsable_1_funcion}}</td></tr>
        <tr><td>{{responsable_2_cargo}}</td><td>{{responsable_2_funcion}}</td></tr>
      </tbody>
    </table>
  </div>

  <div class="seccion mb-3">
    <h4>5. DESCRIPCIÓN DEL PROCEDIMIENTO</h4>
    <p>{{descripcion_procedimiento}}</p>
  </div>

  <div class="seccion mb-3">
    <h4>6. DOCUMENTOS DE REFERENCIA</h4>
    <p>{{documentos_referencia}}</p>
  </div>

  <div class="seccion mb-3">
    <h4>7. REGISTROS ASOCIADOS</h4>
    <p>{{registros_asociados}}</p>
  </div>

  <div class="seccion mb-3">
    <h4>8. CONTROL DE CAMBIOS</h4>
    <table class="table table-bordered">
      <thead>
        <tr><th>Versión</th><th>Fecha</th><th>Descripción del Cambio</th><th>Aprobó</th></tr>
      </thead>
      <tbody>
        <tr><td>{{version}}</td><td>{{fecha_emision}}</td><td>Emisión inicial</td><td>{{aprobado_por}}</td></tr>
      </tbody>
    </table>
  </div>

  <div class="firmas mt-5">
    <div class="row">
      <div class="col-4 text-center">
        <div class="linea-firma">______________________________</div>
        <p><strong>Elaboró</strong></p>
        <p>{{elaborado_por}}</p>
      </div>
      <div class="col-4 text-center">
        <div class="linea-firma">______________________________</div>
        <p><strong>Revisó</strong></p>
        <p>{{revisado_por}}</p>
      </div>
      <div class="col-4 text-center">
        <div class="linea-firma">______________________________</div>
        <p><strong>Aprobó</strong></p>
        <p>{{aprobado_por}}</p>
      </div>
    </div>
  </div>
</div>
""".strip()

VARIABLES_PROCEDIMIENTO = [
    'empresa_nombre', 'titulo_documento', 'codigo_documento', 'version',
    'fecha_emision', 'objetivo', 'alcance', 'definiciones',
    'responsable_1_cargo', 'responsable_1_funcion',
    'responsable_2_cargo', 'responsable_2_funcion',
    'descripcion_procedimiento', 'documentos_referencia',
    'registros_asociados', 'elaborado_por', 'revisado_por', 'aprobado_por',
]


# ============================================================================
# PLANTILLA: INSTRUCTIVO OPERATIVO
# ============================================================================

INSTRUCTIVO_HTML = """
<div class="documento-sgi instructivo">
  <div class="encabezado text-center mb-4">
    <h2>{{titulo_documento}}</h2>
    <p class="text-muted">{{empresa_nombre}} — Instructivo Operativo</p>
    <p><strong>Código:</strong> {{codigo_documento}} | <strong>Versión:</strong> {{version}} | <strong>Fecha:</strong> {{fecha_emision}}</p>
  </div>

  <div class="seccion mb-3">
    <h4>1. OBJETIVO</h4>
    <p>{{objetivo}}</p>
  </div>

  <div class="seccion mb-3">
    <h4>2. ALCANCE</h4>
    <p>{{alcance}}</p>
  </div>

  <div class="seccion mb-3">
    <h4>3. PRECAUCIONES DE SEGURIDAD</h4>
    <div class="alert alert-warning">
      <strong>EPP Requerido:</strong> {{epp_requerido}}
    </div>
    <p>{{precauciones_seguridad}}</p>
  </div>

  <div class="seccion mb-3">
    <h4>4. MATERIALES Y EQUIPOS</h4>
    <p>{{materiales_equipos}}</p>
  </div>

  <div class="seccion mb-3">
    <h4>5. DESARROLLO PASO A PASO</h4>
    <table class="table table-bordered">
      <thead>
        <tr><th>#</th><th>Actividad</th><th>Responsable</th><th>Observaciones</th></tr>
      </thead>
      <tbody>
        <tr><td>1</td><td>{{paso_1}}</td><td>{{responsable_paso_1}}</td><td>{{obs_paso_1}}</td></tr>
        <tr><td>2</td><td>{{paso_2}}</td><td>{{responsable_paso_2}}</td><td>{{obs_paso_2}}</td></tr>
        <tr><td>3</td><td>{{paso_3}}</td><td>{{responsable_paso_3}}</td><td>{{obs_paso_3}}</td></tr>
      </tbody>
    </table>
  </div>

  <div class="seccion mb-3">
    <h4>6. CRITERIOS DE ACEPTACIÓN</h4>
    <p>{{criterios_aceptacion}}</p>
  </div>

  <div class="firmas mt-5">
    <div class="row">
      <div class="col-6 text-center">
        <div class="linea-firma">______________________________</div>
        <p><strong>Elaboró</strong></p>
        <p>{{elaborado_por}}</p>
      </div>
      <div class="col-6 text-center">
        <div class="linea-firma">______________________________</div>
        <p><strong>Aprobó</strong></p>
        <p>{{aprobado_por}}</p>
      </div>
    </div>
  </div>
</div>
""".strip()

VARIABLES_INSTRUCTIVO = [
    'empresa_nombre', 'titulo_documento', 'codigo_documento', 'version',
    'fecha_emision', 'objetivo', 'alcance', 'epp_requerido',
    'precauciones_seguridad', 'materiales_equipos',
    'paso_1', 'responsable_paso_1', 'obs_paso_1',
    'paso_2', 'responsable_paso_2', 'obs_paso_2',
    'paso_3', 'responsable_paso_3', 'obs_paso_3',
    'criterios_aceptacion', 'elaborado_por', 'aprobado_por',
]


# ============================================================================
# PLANTILLA: FORMATO DE REGISTRO
# ============================================================================

FORMATO_HTML = """
<div class="documento-sgi formato">
  <div class="encabezado text-center mb-4">
    <h2>{{titulo_documento}}</h2>
    <p class="text-muted">{{empresa_nombre}}</p>
    <p><strong>Código:</strong> {{codigo_documento}} | <strong>Versión:</strong> {{version}} | <strong>Fecha:</strong> {{fecha_emision}}</p>
  </div>

  <div class="seccion mb-3">
    <h4>INFORMACIÓN GENERAL</h4>
    <table class="table table-bordered">
      <tr><td><strong>Proceso:</strong></td><td>{{proceso}}</td></tr>
      <tr><td><strong>Área:</strong></td><td>{{area}}</td></tr>
      <tr><td><strong>Responsable:</strong></td><td>{{responsable}}</td></tr>
      <tr><td><strong>Fecha de registro:</strong></td><td>{{fecha_registro}}</td></tr>
    </table>
  </div>

  <div class="seccion mb-3">
    <h4>REGISTRO DE DATOS</h4>
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>No.</th>
          <th>{{campo_1_titulo}}</th>
          <th>{{campo_2_titulo}}</th>
          <th>{{campo_3_titulo}}</th>
          <th>Observaciones</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>1</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>2</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>3</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>4</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>5</td><td></td><td></td><td></td><td></td></tr>
      </tbody>
    </table>
  </div>

  <div class="seccion mb-3">
    <h4>OBSERVACIONES GENERALES</h4>
    <p>{{observaciones_generales}}</p>
  </div>

  <div class="firmas mt-5">
    <div class="row">
      <div class="col-6 text-center">
        <div class="linea-firma">______________________________</div>
        <p><strong>Registró</strong></p>
        <p>{{registrado_por}}</p>
      </div>
      <div class="col-6 text-center">
        <div class="linea-firma">______________________________</div>
        <p><strong>Verificó</strong></p>
        <p>{{verificado_por}}</p>
      </div>
    </div>
  </div>
</div>
""".strip()

VARIABLES_FORMATO = [
    'empresa_nombre', 'titulo_documento', 'codigo_documento', 'version',
    'fecha_emision', 'proceso', 'area', 'responsable', 'fecha_registro',
    'campo_1_titulo', 'campo_2_titulo', 'campo_3_titulo',
    'observaciones_generales', 'registrado_por', 'verificado_por',
]


# ============================================================================
# PLANTILLA: MANUAL DEL SISTEMA DE GESTIÓN
# ============================================================================

MANUAL_HTML = """
<div class="documento-sgi manual">
  <div class="encabezado text-center mb-4">
    <h2>{{titulo_documento}}</h2>
    <p class="text-muted">{{empresa_nombre}} — Sistema de Gestión Integral</p>
    <p><strong>Código:</strong> {{codigo_documento}} | <strong>Versión:</strong> {{version}} | <strong>Fecha:</strong> {{fecha_emision}}</p>
  </div>

  <div class="seccion mb-3">
    <h4>TABLA DE CONTENIDO</h4>
    <ol>
      <li>Contexto de la Organización</li>
      <li>Liderazgo y Compromiso</li>
      <li>Planificación</li>
      <li>Apoyo</li>
      <li>Operación</li>
      <li>Evaluación del Desempeño</li>
      <li>Mejora</li>
    </ol>
  </div>

  <div class="seccion mb-3">
    <h4>1. CONTEXTO DE LA ORGANIZACIÓN</h4>
    <p><strong>1.1 Comprensión de la organización y su contexto:</strong> {{contexto_organizacion}}</p>
    <p><strong>1.2 Partes interesadas:</strong> {{partes_interesadas}}</p>
    <p><strong>1.3 Alcance del SGI:</strong> {{alcance_sgi}}</p>
  </div>

  <div class="seccion mb-3">
    <h4>2. LIDERAZGO Y COMPROMISO</h4>
    <p><strong>2.1 Política integrada:</strong> {{politica_integrada}}</p>
    <p><strong>2.2 Roles y responsabilidades:</strong> {{roles_responsabilidades}}</p>
  </div>

  <div class="seccion mb-3">
    <h4>3. PLANIFICACIÓN</h4>
    <p><strong>3.1 Riesgos y oportunidades:</strong> {{riesgos_oportunidades}}</p>
    <p><strong>3.2 Objetivos del SGI:</strong> {{objetivos_sgi}}</p>
  </div>

  <div class="seccion mb-3">
    <h4>4. APOYO</h4>
    <p><strong>4.1 Recursos:</strong> {{recursos}}</p>
    <p><strong>4.2 Competencia y formación:</strong> {{competencia_formacion}}</p>
    <p><strong>4.3 Información documentada:</strong> {{informacion_documentada}}</p>
  </div>

  <div class="seccion mb-3">
    <h4>5. OPERACIÓN</h4>
    <p>{{operacion}}</p>
  </div>

  <div class="seccion mb-3">
    <h4>6. EVALUACIÓN DEL DESEMPEÑO</h4>
    <p><strong>6.1 Seguimiento y medición:</strong> {{seguimiento_medicion}}</p>
    <p><strong>6.2 Auditoría interna:</strong> {{auditoria_interna}}</p>
    <p><strong>6.3 Revisión por la dirección:</strong> {{revision_direccion}}</p>
  </div>

  <div class="seccion mb-3">
    <h4>7. MEJORA</h4>
    <p><strong>7.1 No conformidades y acciones correctivas:</strong> {{no_conformidades}}</p>
    <p><strong>7.2 Mejora continua:</strong> {{mejora_continua}}</p>
  </div>

  <div class="firmas mt-5">
    <div class="row">
      <div class="col-4 text-center">
        <div class="linea-firma">______________________________</div>
        <p><strong>Elaboró</strong></p>
        <p>{{elaborado_por}}</p>
      </div>
      <div class="col-4 text-center">
        <div class="linea-firma">______________________________</div>
        <p><strong>Revisó</strong></p>
        <p>{{revisado_por}}</p>
      </div>
      <div class="col-4 text-center">
        <div class="linea-firma">______________________________</div>
        <p><strong>Aprobó</strong></p>
        <p>{{aprobado_por}}</p>
      </div>
    </div>
  </div>
</div>
""".strip()

VARIABLES_MANUAL = [
    'empresa_nombre', 'titulo_documento', 'codigo_documento', 'version',
    'fecha_emision', 'contexto_organizacion', 'partes_interesadas',
    'alcance_sgi', 'politica_integrada', 'roles_responsabilidades',
    'riesgos_oportunidades', 'objetivos_sgi', 'recursos',
    'competencia_formacion', 'informacion_documentada', 'operacion',
    'seguimiento_medicion', 'auditoria_interna', 'revision_direccion',
    'no_conformidades', 'mejora_continua',
    'elaborado_por', 'revisado_por', 'aprobado_por',
]


# ============================================================================
# PLANTILLA: POLÍTICA INTEGRAL SGI
# ============================================================================

POLITICA_HTML = """
<div class="documento-sgi politica">
  <div class="encabezado text-center mb-4">
    <h2>POLÍTICA INTEGRAL DEL SISTEMA DE GESTIÓN</h2>
    <p class="text-muted">{{empresa_nombre}}</p>
    <p><strong>Código:</strong> {{codigo_documento}} | <strong>Versión:</strong> {{version}} | <strong>Fecha:</strong> {{fecha_emision}}</p>
  </div>

  <div class="seccion mb-3">
    <h4>DECLARACIÓN DE LA POLÍTICA</h4>
    <p>{{declaracion_politica}}</p>
  </div>

  <div class="seccion mb-3">
    <h4>COMPROMISOS</h4>
    <p><strong>Calidad (ISO 9001):</strong> {{compromiso_calidad}}</p>
    <p><strong>Medio Ambiente (ISO 14001):</strong> {{compromiso_ambiental}}</p>
    <p><strong>Seguridad y Salud en el Trabajo (ISO 45001):</strong> {{compromiso_sst}}</p>
    <p><strong>Seguridad de la Información (ISO 27001):</strong> {{compromiso_seguridad_info}}</p>
  </div>

  <div class="seccion mb-3">
    <h4>MARCO DE REFERENCIA</h4>
    <p>{{marco_referencia}}</p>
  </div>

  <div class="seccion mb-3">
    <h4>COMUNICACIÓN Y DIFUSIÓN</h4>
    <p>Esta política será comunicada a todos los niveles de la organización y estará
    disponible para las partes interesadas que así lo requieran.</p>
  </div>

  <div class="firmas mt-5">
    <div class="row">
      <div class="col-12 text-center">
        <div class="linea-firma">______________________________</div>
        <p><strong>{{cargo_representante_legal}}</strong></p>
        <p>{{nombre_representante_legal}}</p>
        <p>{{empresa_nombre}}</p>
        <p>Fecha de aprobación: {{fecha_aprobacion}}</p>
      </div>
    </div>
  </div>
</div>
""".strip()

VARIABLES_POLITICA = [
    'empresa_nombre', 'codigo_documento', 'version', 'fecha_emision',
    'declaracion_politica', 'compromiso_calidad', 'compromiso_ambiental',
    'compromiso_sst', 'compromiso_seguridad_info', 'marco_referencia',
    'cargo_representante_legal', 'nombre_representante_legal',
    'fecha_aprobacion',
]


# ============================================================================
# PLANTILLA: CONTRATO LABORAL
# ============================================================================

CONTRATO_HTML = """
<div class="contrato-laboral">
  <div class="encabezado text-center mb-4">
    <h2>CONTRATO INDIVIDUAL DE TRABAJO</h2>
    <p class="text-muted">{{empresa_nombre}} — NIT {{empresa_nit}}</p>
  </div>

  <div class="datos-partes mb-3">
    <p>Entre <strong>{{empresa_nombre}}</strong>, identificada con NIT {{empresa_nit}},
    representada legalmente, en adelante EL EMPLEADOR, y
    <strong>{{colaborador_nombre}}</strong>, identificado(a) con
    {{tipo_documento}} No. {{numero_identificacion}}, en adelante EL TRABAJADOR,
    se celebra el presente contrato de trabajo, regido por las siguientes cláusulas:</p>
  </div>

  <div class="clausulas">
    <h4>PRIMERA — OBJETO</h4>
    <p>EL TRABAJADOR se obliga a prestar sus servicios personales en el cargo de
    <strong>{{cargo}}</strong>, ejecutando las funciones propias del cargo y las
    que le sean asignadas por EL EMPLEADOR.</p>

    <h4>SEGUNDA — TIPO DE CONTRATO</h4>
    <p>El presente contrato es de tipo <strong>{{tipo_contrato}}</strong>.</p>

    <h4>TERCERA — DURACIÓN</h4>
    <p>Fecha de inicio: <strong>{{fecha_inicio}}</strong>.
    {{#fecha_fin}}Fecha de finalización: <strong>{{fecha_fin}}</strong>.{{/fecha_fin}}
    {{^fecha_fin}}El contrato es a término indefinido.{{/fecha_fin}}</p>

    <h4>CUARTA — REMUNERACIÓN</h4>
    <p>EL EMPLEADOR pagará al TRABAJADOR un salario de
    <strong>{{salario_pactado}}</strong> mensuales, pagaderos en los períodos
    establecidos por la empresa.</p>

    {{#objeto_contrato}}
    <h4>QUINTA — OBJETO CONTRACTUAL</h4>
    <p>{{objeto_contrato}}</p>
    {{/objeto_contrato}}
  </div>

  <div class="firmas mt-5">
    <div class="row">
      <div class="col-6 text-center">
        <div class="linea-firma">______________________________</div>
        <p><strong>EL EMPLEADOR</strong></p>
        <p>{{empresa_nombre}}</p>
      </div>
      <div class="col-6 text-center">
        <div class="linea-firma">______________________________</div>
        <p><strong>EL TRABAJADOR</strong></p>
        <p>{{colaborador_nombre}}</p>
        <p>{{tipo_documento}} {{numero_identificacion}}</p>
      </div>
    </div>
  </div>
</div>
""".strip()

VARIABLES_CONTRATO = [
    'empresa_nombre', 'empresa_nit', 'colaborador_nombre',
    'tipo_documento', 'numero_identificacion', 'tipo_contrato',
    'cargo', 'salario_pactado', 'fecha_inicio', 'fecha_fin',
    'objeto_contrato', 'numero_contrato', 'fecha_contratacion',
]


# ============================================================================
# CATÁLOGO DE PLANTILLAS
# ============================================================================

PLANTILLAS_SGI = [
    {
        'codigo': 'PR-SGI-DEFAULT',
        'nombre': 'Procedimiento Estándar SGI',
        'descripcion': (
            'Plantilla HTML estándar para procedimientos del Sistema de Gestión '
            'Integral. Estructura: objetivo, alcance, definiciones, responsables, '
            'descripción, documentos de referencia, registros, control de cambios. '
            'Compatible con ISO 9001 §4.4.2, ISO 45001 §8.1.'
        ),
        'tipo_documento_codigo': 'PR',
        'tipo_plantilla': 'HTML',
        'contenido_plantilla': PROCEDIMIENTO_HTML,
        'variables_disponibles': VARIABLES_PROCEDIMIENTO,
    },
    {
        'codigo': 'IN-SGI-DEFAULT',
        'nombre': 'Instructivo Operativo',
        'descripcion': (
            'Plantilla HTML para instructivos paso a paso. Incluye precauciones '
            'de seguridad, EPP requerido, materiales/equipos y criterios de '
            'aceptación. Ideal para tareas operativas con componente HSEQ.'
        ),
        'tipo_documento_codigo': 'IN',
        'tipo_plantilla': 'HTML',
        'contenido_plantilla': INSTRUCTIVO_HTML,
        'variables_disponibles': VARIABLES_INSTRUCTIVO,
    },
    {
        'codigo': 'FT-SGI-DEFAULT',
        'nombre': 'Formato de Registro',
        'descripcion': (
            'Plantilla HTML para formatos tabulares de registro de datos. '
            'Incluye información general del proceso, tabla de datos con '
            'columnas personalizables y sección de observaciones. '
            'El formato vacío es documento controlado; diligenciado es registro (RG).'
        ),
        'tipo_documento_codigo': 'FT',
        'tipo_plantilla': 'HTML',
        'contenido_plantilla': FORMATO_HTML,
        'variables_disponibles': VARIABLES_FORMATO,
    },
    {
        'codigo': 'MA-SGI-DEFAULT',
        'nombre': 'Manual del Sistema de Gestión',
        'descripcion': (
            'Plantilla HTML para el Manual del SGI. Estructura basada en el '
            'ciclo PHVA con los 7 capítulos de la estructura de alto nivel (HLS) '
            'ISO: contexto, liderazgo, planificación, apoyo, operación, '
            'evaluación del desempeño y mejora.'
        ),
        'tipo_documento_codigo': 'MA',
        'tipo_plantilla': 'HTML',
        'contenido_plantilla': MANUAL_HTML,
        'variables_disponibles': VARIABLES_MANUAL,
    },
    {
        'codigo': 'POL-SGI-DEFAULT',
        'nombre': 'Política Integral SGI',
        'descripcion': (
            'Plantilla HTML para la Política Integral del Sistema de Gestión. '
            'Declaración de compromiso + 4 ejes (calidad, medio ambiente, SST, '
            'seguridad de la información) + firma del representante legal. '
            'Requisito ISO 9001 §5.2, ISO 14001 §5.2, ISO 45001 §5.2, ISO 27001 §5.2.'
        ),
        'tipo_documento_codigo': 'POL',
        'tipo_plantilla': 'HTML',
        'contenido_plantilla': POLITICA_HTML,
        'variables_disponibles': VARIABLES_POLITICA,
    },
    {
        'codigo': 'CTR-DEFAULT',
        'nombre': 'Contrato Laboral — Plantilla por Defecto',
        'descripcion': (
            'Plantilla HTML estándar para generación de contratos laborales '
            'individuales de trabajo. Compatible con variables del módulo de '
            'contratación. Incluye cláusulas base según Código Sustantivo del Trabajo.'
        ),
        'tipo_documento_codigo': 'CONTRATO_LABORAL',
        'tipo_plantilla': 'HTML',
        'contenido_plantilla': CONTRATO_HTML,
        'variables_disponibles': VARIABLES_CONTRATO,
        'crear_tipo_documento': True,
        'tipo_documento_data': {
            'nombre': 'Contrato de Trabajo',
            'descripcion': (
                'Contratos laborales individuales de trabajo. '
                'Incluye contratos a término fijo, indefinido, obra o labor y aprendizaje.'
            ),
            'nivel_documento': 'OPERATIVO',
            'prefijo_codigo': 'CTR-',
            'requiere_aprobacion': True,
            'requiere_firma': True,
            'tiempo_retencion_años': 20,
            'color_identificacion': '#6366F1',
            'orden': 100,
        },
    },
]


class Command(BaseCommand):
    help = (
        'Crea 6 PlantillaDocumento estándar del SGI + TipoDocumento CONTRATO_LABORAL. '
        'Depende de seed_tipos_documento_sgi (los 12 tipos base).'
    )

    def handle(self, *args, **options):
        from apps.core.base_models.mixins import get_tenant_empresa

        empresa = get_tenant_empresa(auto_create=True)
        if not empresa:
            self.stdout.write(self.style.WARNING(
                '  No se encontró empresa en el tenant actual'
            ))
            return

        TipoDocumento = apps.get_model('gestion_documental', 'TipoDocumento')
        PlantillaDocumento = apps.get_model('gestion_documental', 'PlantillaDocumento')

        created_count = 0
        updated_count = 0
        tipo_created = False

        with transaction.atomic():
            for plantilla_data in PLANTILLAS_SGI:
                tipo_codigo = plantilla_data['tipo_documento_codigo']

                # Si necesita crear su propio TipoDocumento (CONTRATO_LABORAL)
                if plantilla_data.get('crear_tipo_documento'):
                    td_defaults = plantilla_data['tipo_documento_data'].copy()
                    td_defaults['is_active'] = True
                    tipo_doc, was_created = TipoDocumento.objects.update_or_create(
                        empresa_id=empresa.id,
                        codigo=tipo_codigo,
                        defaults=td_defaults,
                    )
                    if was_created:
                        tipo_created = True
                else:
                    # Buscar TipoDocumento existente (ya creado por seed_tipos_documento_sgi)
                    try:
                        tipo_doc = TipoDocumento.objects.get(
                            empresa_id=empresa.id,
                            codigo=tipo_codigo,
                        )
                    except TipoDocumento.DoesNotExist:
                        self.stdout.write(self.style.WARNING(
                            f'    ⚠ TipoDocumento {tipo_codigo} no encontrado — '
                            f'ejecute primero seed_tipos_documento_sgi'
                        ))
                        continue

                # Crear/actualizar PlantillaDocumento
                _, was_created = PlantillaDocumento.objects.update_or_create(
                    empresa_id=empresa.id,
                    codigo=plantilla_data['codigo'],
                    defaults={
                        'nombre': plantilla_data['nombre'],
                        'descripcion': plantilla_data['descripcion'],
                        'tipo_documento': tipo_doc,
                        'tipo_plantilla': plantilla_data['tipo_plantilla'],
                        'contenido_plantilla': plantilla_data['contenido_plantilla'],
                        'variables_disponibles': plantilla_data['variables_disponibles'],
                        'version': '1.0',
                        'estado': 'ACTIVA',
                        'es_por_defecto': True,
                    },
                )

                if was_created:
                    created_count += 1
                else:
                    updated_count += 1

        # Reporte
        if tipo_created:
            self.stdout.write(self.style.SUCCESS(
                '    ✓ TipoDocumento CONTRATO_LABORAL creado'
            ))

        self.stdout.write(self.style.SUCCESS(
            f'    ✓ Plantillas SGI: {created_count} creadas, '
            f'{updated_count} actualizadas (total: {len(PLANTILLAS_SGI)})'
        ))
