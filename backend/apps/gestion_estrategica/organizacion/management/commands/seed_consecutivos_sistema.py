"""
Seed command para crear los consecutivos del sistema.

Crea los ConsecutivoConfig base definidos en CONSECUTIVOS_SISTEMA
más los consecutivos adicionales referenciados en módulos de negocio.

Uso:
    python manage.py seed_consecutivos_sistema
"""
from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = 'Crea los consecutivos del sistema (base + módulos de negocio)'

    def handle(self, *args, **options):
        from apps.gestion_estrategica.organizacion.models_consecutivos import (
            ConsecutivoConfig,
            TODOS_CONSECUTIVOS_SISTEMA,
        )
        from apps.gestion_estrategica.configuracion.models import EmpresaConfig

        empresa = EmpresaConfig.objects.first()
        if not empresa:
            self.stderr.write(self.style.ERROR('No existe EmpresaConfig en este tenant.'))
            return

        all_consecutivos = TODOS_CONSECUTIVOS_SISTEMA
        created = 0
        skipped = 0

        with transaction.atomic():
            for data in all_consecutivos:
                codigo = data['codigo']
                if ConsecutivoConfig.objects.filter(codigo=codigo, empresa_id=empresa.id).exists():
                    skipped += 1
                    continue

                ConsecutivoConfig.objects.create(empresa_id=empresa.id, **data)
                self.stdout.write(self.style.SUCCESS(f'  [OK] {codigo}'))
                created += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nConsecutivos: {created} creados, {skipped} existentes'
        ))
