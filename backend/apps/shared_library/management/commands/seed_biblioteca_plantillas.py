"""
Seed: Biblioteca Maestra de Plantillas StrateKaz (schema public).

Puebla la tabla shared_biblioteca_plantilla con las plantillas oficiales
StrateKaz para todos los tenants. Este seed corre UNA SOLA VEZ en public
(no es multi-tenant). Los tenants consumen estas plantillas via:
  - seed_plantillas_sgi (copia automática al crear/actualizar tenant)
  - endpoint importar-a-tenant (importación manual por el usuario)

Idempotente — usa update_or_create con codigo (unique).
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.shared_library.models import BibliotecaPlantilla


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
# PLANTILLA: POLÍTICA INTEGRAL SGI (tipo FORMULARIO)
# ============================================================================
# Los campos se definen como JSON y se crean como CampoFormulario en cada tenant.
# Campos AUTO (empresa, código, versión, firmas) NO van aquí — los maneja el sistema.

POLITICA_CAMPOS = [
    # ── SECCIÓN: INFORMACIÓN GENERAL ──
    {
        'nombre_campo': 'seccion_info_general',
        'etiqueta': 'Información General',
        'tipo_campo': 'SECCION',
        'orden': 1,
        'ancho_columna': 12,
    },
    {
        'nombre_campo': 'titulo',
        'etiqueta': 'Título de la Política',
        'tipo_campo': 'TEXT',
        'placeholder': 'Ej: Política Integral de Gestión',
        'valor_por_defecto': 'Política Integral del Sistema de Gestión',
        'es_obligatorio': True,
        'orden': 2,
        'ancho_columna': 12,
        'descripcion': 'Nombre completo de la política.',
    },
    {
        'nombre_campo': 'marco_normativo',
        'etiqueta': 'Marco Normativo Aplicable',
        'tipo_campo': 'MULTISELECT',
        'opciones': [
            {'value': 'ISO9001', 'label': 'ISO 9001 — Calidad'},
            {'value': 'ISO14001', 'label': 'ISO 14001 — Medio Ambiente'},
            {'value': 'ISO45001', 'label': 'ISO 45001 — Seguridad y Salud en el Trabajo'},
            {'value': 'ISO27001', 'label': 'ISO 27001 — Seguridad de la Información'},
            {'value': 'D1072', 'label': 'Decreto 1072 — SG-SST'},
            {'value': 'RES0312', 'label': 'Resolución 0312 — Estándares Mínimos'},
        ],
        'es_obligatorio': True,
        'orden': 3,
        'ancho_columna': 12,
        'descripcion': 'Seleccione las normas que aplican a esta política.',
    },
    {
        'nombre_campo': 'frecuencia_revision',
        'etiqueta': 'Frecuencia de Revisión',
        'tipo_campo': 'SELECT',
        'opciones': [
            {'value': 'ANUAL', 'label': 'Anual'},
            {'value': 'SEMESTRAL', 'label': 'Semestral'},
            {'value': 'POR_CAMBIOS', 'label': 'Cuando haya cambios significativos'},
        ],
        'valor_por_defecto': 'ANUAL',
        'es_obligatorio': True,
        'orden': 4,
        'ancho_columna': 6,
        'descripcion': 'Periodicidad con la que se revisa y actualiza esta política.',
    },
    # ── SECCIÓN: CONTENIDO DE LA POLÍTICA ──
    {
        'nombre_campo': 'seccion_contenido',
        'etiqueta': 'Contenido de la Política',
        'tipo_campo': 'SECCION',
        'orden': 10,
        'ancho_columna': 12,
    },
    {
        'nombre_campo': 'objetivo',
        'etiqueta': 'Objetivo',
        'tipo_campo': 'TEXTAREA',
        'placeholder': 'Describa el propósito de esta política...',
        'es_obligatorio': True,
        'orden': 11,
        'ancho_columna': 12,
        'descripcion': 'Para qué existe esta política y qué propósito cumple dentro del SGI.',
    },
    {
        'nombre_campo': 'alcance',
        'etiqueta': 'Alcance',
        'tipo_campo': 'TEXTAREA',
        'placeholder': 'Aplica a todos los procesos, sedes y colaboradores de la organización...',
        'es_obligatorio': True,
        'orden': 12,
        'ancho_columna': 12,
        'descripcion': (
            'A quién aplica, qué procesos y sedes cubre. '
            'Se sugiere incluir la información de la empresa registrada en Fundación.'
        ),
    },
    {
        'nombre_campo': 'declaracion',
        'etiqueta': 'Declaración de la Política',
        'tipo_campo': 'TEXTAREA',
        'placeholder': 'La alta dirección de [empresa] se compromete a...',
        'es_obligatorio': True,
        'orden': 13,
        'ancho_columna': 12,
        'descripcion': (
            'El texto central de la política. Compromiso formal de la alta dirección. '
            'Es el corazón del documento.'
        ),
    },
    {
        'nombre_campo': 'compromisos',
        'etiqueta': 'Compromisos Específicos',
        'tipo_campo': 'TABLA',
        'orden': 14,
        'ancho_columna': 12,
        'descripcion': (
            'Lista de compromisos concretos de la organización. '
            'Cada uno asociado a la norma o requisito que cumple.'
        ),
        'columnas_tabla': [
            {'nombre_campo': 'compromiso', 'etiqueta': 'Compromiso', 'tipo_campo': 'TEXTAREA'},
            {
                'nombre_campo': 'norma_asociada',
                'etiqueta': 'Norma Asociada',
                'tipo_campo': 'SELECT',
                'opciones': [
                    {'value': 'ISO9001', 'label': 'ISO 9001'},
                    {'value': 'ISO14001', 'label': 'ISO 14001'},
                    {'value': 'ISO45001', 'label': 'ISO 45001'},
                    {'value': 'ISO27001', 'label': 'ISO 27001'},
                    {'value': 'D1072', 'label': 'Decreto 1072'},
                    {'value': 'GENERAL', 'label': 'General'},
                ],
            },
        ],
    },
    {
        'nombre_campo': 'comunicacion',
        'etiqueta': 'Comunicación y Disponibilidad',
        'tipo_campo': 'TEXTAREA',
        'valor_por_defecto': (
            'Esta política será comunicada a todos los niveles de la organización, '
            'estará disponible para las partes interesadas que lo requieran y '
            'será publicada en los medios internos de comunicación.'
        ),
        'es_obligatorio': True,
        'orden': 15,
        'ancho_columna': 12,
        'descripcion': 'Cómo se comunica la política y dónde estará disponible.',
    },
    # ── SECCIÓN: FIRMAS ──
    {
        'nombre_campo': 'seccion_firmas',
        'etiqueta': 'Responsables del Documento',
        'tipo_campo': 'SECCION',
        'orden': 20,
        'ancho_columna': 12,
    },
    {
        'nombre_campo': 'elaboro_nombre',
        'etiqueta': 'Elaboró — Nombre',
        'tipo_campo': 'TEXT',
        'placeholder': 'Nombre del responsable que elaboró',
        'es_obligatorio': True,
        'orden': 21,
        'ancho_columna': 6,
        'descripcion': 'Persona que redactó la política.',
    },
    {
        'nombre_campo': 'elaboro_cargo',
        'etiqueta': 'Elaboró — Cargo',
        'tipo_campo': 'TEXT',
        'placeholder': 'Cargo del responsable',
        'es_obligatorio': True,
        'orden': 22,
        'ancho_columna': 6,
    },
    {
        'nombre_campo': 'reviso_nombre',
        'etiqueta': 'Revisó — Nombre',
        'tipo_campo': 'TEXT',
        'placeholder': 'Nombre del responsable que revisó',
        'es_obligatorio': True,
        'orden': 23,
        'ancho_columna': 6,
        'descripcion': 'Persona que revisó y validó el contenido.',
    },
    {
        'nombre_campo': 'reviso_cargo',
        'etiqueta': 'Revisó — Cargo',
        'tipo_campo': 'TEXT',
        'placeholder': 'Cargo del responsable',
        'es_obligatorio': True,
        'orden': 24,
        'ancho_columna': 6,
    },
]

VARIABLES_POLITICA = [
    'titulo', 'marco_normativo', 'frecuencia_revision',
    'objetivo', 'alcance', 'declaracion', 'compromisos',
    'comunicacion', 'elaboro_nombre', 'elaboro_cargo',
    'reviso_nombre', 'reviso_cargo',
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
# CATÁLOGO DE PLANTILLAS — FUENTE ÚNICA DE VERDAD (SSOT)
# ============================================================================

BIBLIOTECA_PLANTILLAS = [
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
        'contenido_plantilla': PROCEDIMIENTO_HTML,
        'variables_disponibles': VARIABLES_PROCEDIMIENTO,
        'categoria': 'PROCEDIMIENTO',
        'norma_iso_codigo': 'ISO9001',
        'orden': 1,
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
        'contenido_plantilla': INSTRUCTIVO_HTML,
        'variables_disponibles': VARIABLES_INSTRUCTIVO,
        'categoria': 'INSTRUCTIVO',
        'norma_iso_codigo': 'ISO45001',
        'orden': 2,
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
        'contenido_plantilla': FORMATO_HTML,
        'variables_disponibles': VARIABLES_FORMATO,
        'categoria': 'FORMATO',
        'norma_iso_codigo': 'ISO9001',
        'orden': 3,
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
        'contenido_plantilla': MANUAL_HTML,
        'variables_disponibles': VARIABLES_MANUAL,
        'categoria': 'MANUAL',
        'norma_iso_codigo': 'ISO9001',
        'orden': 4,
    },
    {
        'codigo': 'POL-SGI-DEFAULT',
        'nombre': 'Política Integral SGI',
        'descripcion': (
            'Formulario intuitivo para crear la Política Integral del Sistema de '
            'Gestión. El usuario llena los campos (objetivo, alcance, declaración, '
            'compromisos) y el sistema genera el documento con encabezado, firmas '
            'y formato profesional. Requisito ISO 9001/14001/45001/27001 §5.2.'
        ),
        'tipo_documento_codigo': 'POL',
        'tipo_plantilla': 'FORMULARIO',
        'contenido_plantilla': '',
        'variables_disponibles': VARIABLES_POLITICA,
        'campos_formulario': POLITICA_CAMPOS,
        'categoria': 'POLITICA',
        'norma_iso_codigo': 'ISO9001',
        'orden': 5,
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
        'contenido_plantilla': CONTRATO_HTML,
        'variables_disponibles': VARIABLES_CONTRATO,
        'categoria': 'CONTRATO',
        'norma_iso_codigo': '',
        'orden': 6,
    },
]


class Command(BaseCommand):
    help = (
        'Puebla la Biblioteca Maestra (schema public) con las 6 plantillas '
        'oficiales StrateKaz. SSOT para todos los tenants.'
    )

    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0

        with transaction.atomic():
            for data in BIBLIOTECA_PLANTILLAS:
                _, was_created = BibliotecaPlantilla.objects.update_or_create(
                    codigo=data['codigo'],
                    defaults={
                        'nombre': data['nombre'],
                        'descripcion': data['descripcion'],
                        'tipo_documento_codigo': data['tipo_documento_codigo'],
                        'tipo_plantilla': data.get('tipo_plantilla', 'HTML'),
                        'contenido_plantilla': data['contenido_plantilla'],
                        'variables_disponibles': data['variables_disponibles'],
                        'campos_formulario': data.get('campos_formulario', []),
                        'categoria': data['categoria'],
                        'industria': 'GENERAL',
                        'norma_iso_codigo': data['norma_iso_codigo'],
                        'version': '1.0',
                        'is_active': True,
                        'orden': data['orden'],
                    },
                )

                if was_created:
                    created_count += 1
                else:
                    updated_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'    ✓ Biblioteca Maestra: {created_count} creadas, '
            f'{updated_count} actualizadas (total: {len(BIBLIOTECA_PLANTILLAS)})'
        ))
