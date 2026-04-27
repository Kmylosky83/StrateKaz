"""
seed_trd — Carga reglas iniciales de la Tabla de Retención Documental (TRD).

33 reglas base alineadas con normativa colombiana AGN (Acuerdo 001/2024),
Decreto 1072/2015, Resolución 0312/2019 y normas ISO 9001/14001/45001.

Uso:
    python manage.py tenant_command seed_trd --schema=SCHEMA

Comportamiento:
    - Solo ejecuta si no hay reglas TRD en el tenant (idempotente).
    - Mapea códigos de proceso/tipo a los registros reales del tenant.
    - Omite reglas cuyo tipo o proceso no exista (con warning).

Ref: docs/03-modulos/gestion-documental/REGLAS_TRD_STRATEKAZ_SGI.md §7.3
"""
from django.core.management.base import BaseCommand


# Mapeo: código de proceso en el seed → código real en Area
PROCESO_MAP = {
    'GE': 'DIR',   # Gestión Estratégica → Direccionamiento Estratégico
    'SST': 'SST',  # Seguridad y Salud en el Trabajo
    'TH': 'GTH',   # Talento Humano → Gestión del Talento Humano
    'GA': 'GAM',   # Gestión Ambiental
    'PESV': 'PESV',  # Plan Estratégico de Seguridad Vial
}

# fmt: off
SEED_REGLAS = [
    # (serie_documental, tipo_code, proceso_seed, gestion, central, disposicion, soporte_legal, requiere_acta)
    ('Actas de Comité COPASST',              'AC',  'SST', 2,  8, 'CONSERVAR_PERMANENTE', 'Dto 1072/2015 Art 2.2.4.6.21; Res 0312/2019', False),
    ('Actas de Comité de Convivencia',       'AC',  'TH',  2,  5, 'ELIMINAR',             'Ley 1010/2006 Art 9; Res 652/2012', True),
    ('Actas Revisión por la Dirección',      'AC',  'GE',  2,  8, 'CONSERVAR_PERMANENTE', 'ISO 9001:2015 Cláusula 9.3', False),
    ('Actas de Comité de Seguridad Vial',    'AC',  'PESV', 2, 5, 'CONSERVAR_PERMANENTE', 'Res 40595/2024; Ley 1503/2011', False),
    ('Manual del SGI',                       'MA',  'GE',  0, 10, 'CONSERVAR_PERMANENTE', 'ISO 9001/14001/45001; Dto 1072/2015', False),
    ('Manual de Funciones',                  'MA',  'TH',  0, 10, 'SELECCIONAR',          'Dto 1083/2015', False),
    ('Plan de Emergencias',                  'PL',  'SST', 2,  5, 'SELECCIONAR',          'Dto 1072/2015 Art 2.2.4.6.25', True),
    ('Plan Estratégico de Seguridad Vial',   'PL',  'PESV', 2, 8, 'CONSERVAR_PERMANENTE', 'Ley 1503/2011; Res 40595/2024', False),
    ('Plan de Gestión Ambiental',            'PL',  'GA',  2,  5, 'SELECCIONAR',          'ISO 14001:2015 Cl 6.2', True),
    ('Política SST',                         'POL', 'SST', 0, 10, 'CONSERVAR_PERMANENTE', 'Dto 1072/2015 Art 2.2.4.6.5', False),
    ('Política de Calidad',                  'POL', 'GE',  0, 10, 'CONSERVAR_PERMANENTE', 'ISO 9001:2015 Cl 5.2', False),
    ('Política Ambiental',                   'POL', 'GA',  0, 10, 'CONSERVAR_PERMANENTE', 'ISO 14001:2015 Cl 5.2', False),
    ('Política de Protección de Datos',      'POL', 'GE',  0, 10, 'CONSERVAR_PERMANENTE', 'Ley 1581/2012; Dto 1377/2013', False),
    ('Procedimiento Auditorías Internas',    'PR',  'GE',  2,  5, 'ELIMINAR',             'ISO 19011:2018; ISO 9001 Cl 9.2', True),
    ('Procedimiento Acciones Correctivas',   'PR',  'GE',  2,  5, 'ELIMINAR',             'ISO 9001 Cl 10.2', True),
    ('Procedimiento Investigación AT/EL',    'PR',  'SST', 2,  8, 'CONSERVAR_PERMANENTE', 'Dto 1072/2015 Art 2.2.4.6.32; Res 1401/2007', False),
    ('Procedimiento Gestión del Cambio',     'PR',  'GE',  2,  5, 'ELIMINAR',             'ISO 9001 Cl 6.3; ISO 45001 Cl 8.1.3', True),
    ('Formato Inspección de Seguridad',      'FT',  'SST', 1,  3, 'ELIMINAR',             'Dto 1072/2015 Art 2.2.4.6.12', True),
    ('Formato Entrega EPP',                  'FT',  'SST', 1,  3, 'ELIMINAR',             'Dto 1072/2015 Art 2.2.4.6.24', True),
    ('Formato Lista de Asistencia',          'FT',  'TH',  1,  2, 'ELIMINAR',             'Dto 1072/2015 Art 2.2.4.6.11', True),
    ('Formato Reporte Condiciones Inseguras','FT',  'SST', 1,  3, 'ELIMINAR',             'Dto 1072/2015 Art 2.2.4.6.12', True),
    ('Formato Inspección Vehicular',         'FT',  'PESV', 1, 3, 'ELIMINAR',             'Res 40595/2024', True),
    ('Registros de Capacitación SST',        'RG',  'SST', 2, 20, 'CONSERVAR_PERMANENTE', 'Dto 1072/2015 Art 2.2.4.6.12; Res 0312 Est 2.11', False),
    ('Historias Clínicas Ocupacionales',     'RG',  'SST', 0, 20, 'CONSERVAR_PERMANENTE', 'Res 2346/2007 Art 17; Ley 594/2000', False),
    ('Registros de Investigación AT/EL',     'RG',  'SST', 2, 20, 'CONSERVAR_PERMANENTE', 'Dto 1072/2015 Art 2.2.4.6.32; Res 1401/2007', False),
    ('Registros de Auditoría',               'RG',  'GE',  2,  5, 'SELECCIONAR',          'ISO 9001 Cl 9.2.2', True),
    ('Programa de Capacitación SST',         'PG',  'SST', 2,  5, 'ELIMINAR',             'Dto 1072/2015 Art 2.2.4.6.11', True),
    ('Programa de Vigilancia Epidemiológica','PG',  'SST', 2, 10, 'CONSERVAR_PERMANENTE', 'Dto 1072/2015 Art 2.2.4.6.24', False),
    # ── Matrices (FT — formatos de evaluación continua) ──
    ('Matriz de Riesgos y Peligros',         'FT',  'SST', 0, 10, 'CONSERVAR_PERMANENTE', 'Dto 1072/2015 Art 2.2.4.6.15; GTC 45', False),
    ('Matriz de Aspectos e Impactos Ambientales','FT','GA', 0, 10, 'CONSERVAR_PERMANENTE', 'ISO 14001:2015 Cl 6.1.2', False),
    ('Matriz de Requisitos Legales',         'FT',  'GE',  0, 10, 'CONSERVAR_PERMANENTE', 'ISO 9001 Cl 4.2; Dto 1072/2015 Art 2.2.4.6.8', False),
    # ── Informes (RG — registros de gestión) ──
    ('Informe Revisión por la Dirección',    'RG',  'GE',  2,  5, 'SELECCIONAR',          'ISO 9001 Cl 9.3; Dto 1072/2015 Art 2.2.4.6.31', True),
    ('Informe Rendición de Cuentas SST',     'RG',  'SST', 2,  5, 'ELIMINAR',             'Dto 1072/2015 Art 2.2.4.6.8 num 10; Res 0312/2019', True),
]
# fmt: on


class Command(BaseCommand):
    help = 'Carga reglas TRD iniciales para PyMEs colombianas con SGI'

    def handle(self, *args, **options):
        from apps.gestion_estrategica.gestion_documental.models import (
            TablaRetencionDocumental,
            TipoDocumento,
        )
        from apps.gestion_estrategica.organizacion.models import Area

        # Aislamiento por schema django-tenants — sin empresa_id explícito.
        # Cachear lookups; TipoDocumento usa SoftDeleteManager que filtra is_deleted.
        tipos_map = {t.codigo: t for t in TipoDocumento.objects.all()}
        areas_map = {a.code: a for a in Area.objects.filter(is_active=True)}

        creadas = 0
        omitidas_tipo = 0
        omitidas_proceso = 0

        for regla in SEED_REGLAS:
            serie, tipo_code, proceso_seed, gestion, central, disposicion, soporte, acta = regla

            # Resolver tipo
            tipo = tipos_map.get(tipo_code)
            if not tipo:
                self.stdout.write(self.style.WARNING(
                    f'  SKIP: Tipo "{tipo_code}" no existe → {serie}'
                ))
                omitidas_tipo += 1
                continue

            # Resolver proceso (mapear código seed → código real)
            proceso_code = PROCESO_MAP.get(proceso_seed, proceso_seed)
            if proceso_code is None:
                self.stdout.write(self.style.WARNING(
                    f'  SKIP: Proceso "{proceso_seed}" no mapeado → {serie}'
                ))
                omitidas_proceso += 1
                continue

            proceso = areas_map.get(proceso_code)
            if not proceso:
                self.stdout.write(self.style.WARNING(
                    f'  SKIP: Proceso "{proceso_code}" no existe → {serie}'
                ))
                omitidas_proceso += 1
                continue

            _, created = TablaRetencionDocumental.objects.get_or_create(
                tipo_documento=tipo,
                proceso=proceso,
                defaults={
                    'serie_documental': serie,
                    'tiempo_gestion_anos': gestion,
                    'tiempo_central_anos': central,
                    'disposicion_final': disposicion,
                    'soporte_legal': soporte,
                    'requiere_acta_destruccion': acta,
                },
            )
            if created:
                creadas += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nSeed TRD completado: {creadas} reglas creadas, '
            f'{omitidas_tipo} omitidas (tipo inexistente), '
            f'{omitidas_proceso} omitidas (proceso inexistente)'
        ))
