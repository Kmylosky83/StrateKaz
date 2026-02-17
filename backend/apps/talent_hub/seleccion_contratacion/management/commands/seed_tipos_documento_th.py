"""
Seed: TipoDocumento + PlantillaDocumento para Contratos Laborales (Talent Hub).

Crea en cada tenant:
  - TipoDocumento: CONTRATO_LABORAL (prefijo CTR-, retención 20 años)
  - PlantillaDocumento: CONTRATO-LABORAL-DEFAULT (HTML, con variables de contrato)

Idempotente — usa update_or_create con unique_together (empresa_id, codigo).
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django.apps import apps


# ============================================================================
# PLANTILLA HTML DE CONTRATO LABORAL
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
    'empresa_nombre',
    'empresa_nit',
    'colaborador_nombre',
    'tipo_documento',
    'numero_identificacion',
    'tipo_contrato',
    'cargo',
    'salario_pactado',
    'fecha_inicio',
    'fecha_fin',
    'objeto_contrato',
    'numero_contrato',
    'fecha_contratacion',
]


class Command(BaseCommand):
    help = 'Crea TipoDocumento y PlantillaDocumento para contratos laborales (TH→GD)'

    def handle(self, *args, **options):
        from apps.core.base_models.mixins import get_tenant_empresa

        empresa = get_tenant_empresa(auto_create=True)
        if not empresa:
            self.stdout.write(self.style.WARNING('  No se encontró empresa en el tenant actual'))
            return

        TipoDocumento = apps.get_model('gestion_documental', 'TipoDocumento')
        PlantillaDocumento = apps.get_model('gestion_documental', 'PlantillaDocumento')

        with transaction.atomic():
            # 1. TipoDocumento: CONTRATO_LABORAL
            tipo_doc, td_created = TipoDocumento.objects.update_or_create(
                empresa_id=empresa.id,
                codigo='CONTRATO_LABORAL',
                defaults={
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
                    'color_identificacion': '#6366f1',
                    'is_active': True,
                    'orden': 100,
                },
            )
            action = 'creado' if td_created else 'actualizado'
            self.stdout.write(self.style.SUCCESS(
                f'    ✓ TipoDocumento CONTRATO_LABORAL {action}'
            ))

            # 2. PlantillaDocumento: CONTRATO-LABORAL-DEFAULT
            plantilla, pl_created = PlantillaDocumento.objects.update_or_create(
                empresa_id=empresa.id,
                codigo='CONTRATO-LABORAL-DEFAULT',
                defaults={
                    'nombre': 'Contrato Laboral — Plantilla por Defecto',
                    'descripcion': (
                        'Plantilla HTML estándar para generación de contratos laborales. '
                        'Compatible con variables del sistema de contratación (Talent Hub).'
                    ),
                    'tipo_documento': tipo_doc,
                    'tipo_plantilla': 'HTML',
                    'contenido_plantilla': CONTRATO_HTML,
                    'variables_disponibles': VARIABLES_CONTRATO,
                    'version': '1.0',
                    'estado': 'ACTIVA',
                    'es_por_defecto': True,
                },
            )
            action = 'creada' if pl_created else 'actualizada'
            self.stdout.write(self.style.SUCCESS(
                f'    ✓ PlantillaDocumento CONTRATO-LABORAL-DEFAULT {action}'
            ))
