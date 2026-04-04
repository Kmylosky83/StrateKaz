"""
Sprint 2 — Migración de datos: areas_aplicacion → proceso FK.

Para cada documento con areas_aplicacion no vacío:
1. Toma el primer elemento del array
2. Busca Area por name o code
3. Asigna FK proceso

También estandariza areas_aplicacion a usar Area.code en vez de nombres.
"""
from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = 'Migra areas_aplicacion (JSON) → proceso (FK Area) + estandariza a Area.code'

    def handle(self, *args, **options):
        from apps.gestion_estrategica.gestion_documental.models import Documento
        from apps.gestion_estrategica.organizacion.models import Area

        areas = {a.name.lower(): a for a in Area.objects.all()}
        areas_by_code = {a.code.upper(): a for a in Area.objects.all()}

        docs = Documento.objects.filter(proceso__isnull=True)
        migrados = 0
        sin_match = 0

        with transaction.atomic():
            for doc in docs:
                if not doc.areas_aplicacion:
                    continue

                primer = doc.areas_aplicacion[0] if doc.areas_aplicacion else None
                if not primer:
                    continue

                # Buscar por nombre exacto, luego por código
                area = areas.get(primer.lower()) or areas_by_code.get(primer.upper())
                if area:
                    doc.proceso = area
                    # Estandarizar areas_aplicacion a Area.code
                    nuevas = []
                    for item in doc.areas_aplicacion:
                        a = areas.get(item.lower()) or areas_by_code.get(item.upper())
                        nuevas.append(a.code if a else item)
                    doc.areas_aplicacion = nuevas
                    doc.save(update_fields=['proceso', 'areas_aplicacion', 'updated_at'])
                    migrados += 1
                else:
                    sin_match += 1
                    self.stdout.write(self.style.WARNING(
                        f'  Sin match: {doc.codigo} — areas_aplicacion={doc.areas_aplicacion}'
                    ))

        self.stdout.write(self.style.SUCCESS(
            f'  Migración completada: {migrados} documentos migrados, {sin_match} sin match'
        ))
