"""
Management command para cargar catalogo de Tipos de Contrato Laboral.
Basado en legislacion laboral colombiana (Codigo Sustantivo del Trabajo).

Tipos:
1. Termino Indefinido (CST Art. 47)
2. Termino Fijo (CST Art. 46) - max 3 anos
3. Obra o Labor (CST Art. 45)
4. Prestacion de Servicios (contrato civil, no laboral)
5. Aprendizaje SENA (Ley 789/2002)
6. Temporal (Ley 50/1990)

Uso:
    python manage.py seed_tipos_contrato
"""
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Carga catalogo de Tipos de Contrato Laboral (legislacion colombiana)'

    def handle(self, *args, **kwargs):
        from apps.talent_hub.seleccion_contratacion.models import TipoContrato

        self.stdout.write(self.style.HTTP_INFO('=' * 60))
        self.stdout.write(self.style.HTTP_INFO('CARGANDO TIPOS DE CONTRATO LABORAL'))
        self.stdout.write(self.style.HTTP_INFO('=' * 60))

        tipos = [
            {
                'codigo': 'TI',
                'nombre': 'Termino Indefinido',
                'descripcion': 'Contrato sin fecha de terminacion definida. '
                               'Se mantiene vigente mientras subsistan las causas '
                               'que le dieron origen (CST Art. 47).',
                'requiere_duracion': False,
                'requiere_objeto': False,
                'color_badge': 'green',
                'orden': 1,
            },
            {
                'codigo': 'TF',
                'nombre': 'Termino Fijo',
                'descripcion': 'Contrato con duracion determinada, maximo 3 anos. '
                               'Debe constar por escrito. Prorrogable automaticamente '
                               'si no hay preaviso de 30 dias (CST Art. 46).',
                'requiere_duracion': True,
                'requiere_objeto': False,
                'color_badge': 'blue',
                'orden': 2,
            },
            {
                'codigo': 'OL',
                'nombre': 'Obra o Labor',
                'descripcion': 'Contrato que dura mientras se ejecute la obra o labor '
                               'contratada. Termina al finalizar la obra (CST Art. 45).',
                'requiere_duracion': False,
                'requiere_objeto': True,
                'color_badge': 'yellow',
                'orden': 3,
            },
            {
                'codigo': 'PS',
                'nombre': 'Prestacion de Servicios',
                'descripcion': 'Contrato civil de prestacion de servicios profesionales. '
                               'No genera relacion laboral. El contratista asume sus '
                               'propias obligaciones de seguridad social.',
                'requiere_duracion': True,
                'requiere_objeto': True,
                'color_badge': 'gray',
                'orden': 4,
            },
            {
                'codigo': 'AP',
                'nombre': 'Aprendizaje',
                'descripcion': 'Contrato especial de aprendizaje SENA. '
                               'Fase lectiva: 75% SMMLV. Fase practica: 100% SMMLV. '
                               'No constituye contrato de trabajo (Ley 789/2002).',
                'requiere_duracion': True,
                'requiere_objeto': False,
                'color_badge': 'purple',
                'orden': 5,
            },
            {
                'codigo': 'TE',
                'nombre': 'Temporal',
                'descripcion': 'Contrato a traves de empresa de servicios temporales. '
                               'Para atender picos de produccion, licencias o vacaciones '
                               'del personal (Ley 50/1990).',
                'requiere_duracion': True,
                'requiere_objeto': False,
                'color_badge': 'orange',
                'orden': 6,
            },
        ]

        created_count = 0
        updated_count = 0

        for tipo_data in tipos:
            codigo = tipo_data.pop('codigo')
            obj, created = TipoContrato.objects.update_or_create(
                codigo=codigo,
                defaults=tipo_data
            )
            if created:
                created_count += 1
                self.stdout.write(f'  + {codigo}: {obj.nombre}')
            else:
                updated_count += 1
                self.stdout.write(f'  ~ {codigo}: {obj.nombre} (actualizado)')

        self.stdout.write(self.style.SUCCESS(
            f'\n  COMPLETADO: {created_count} creados, {updated_count} actualizados'
        ))
        self.stdout.write(self.style.SUCCESS(
            f'  Total tipos de contrato: {TipoContrato.objects.filter(is_active=True).count()}'
        ))
