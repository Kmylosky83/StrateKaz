"""
Seed de Grupos de Partes Interesadas - Sprint 17
=================================================

Crea los 10 grupos estándar de partes interesadas basados en el formato
F-GD-04 MATRIZ PARTES INTERESADAS.xlsx

Grupos:
1. Personal
2. Propiedad
3. Clientes
4. Proveedores
5. Competidores
6. Comunidad Local
7. Administraciones Públicas
8. Agentes Sociales
9. Sociedad
10. Medio Ambiente

Uso:
    python manage.py seed_grupos_partes_interesadas
"""

from django.core.management.base import BaseCommand
from apps.gestion_estrategica.contexto.models import GrupoParteInteresada


class Command(BaseCommand):
    help = 'Crea los 10 grupos estándar de partes interesadas (sistema)'

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.MIGRATE_HEADING('\n=== SEED: Grupos de Partes Interesadas ===\n')
        )

        grupos = [
            {
                'codigo': 'PERSONAL',
                'nombre': 'Personal',
                'descripcion': 'Empleados, directivos, personal de oficina, nuevos empleados y familia',
                'icono': 'Users',
                'color': 'blue',
                'orden': 1,
                'es_sistema': True,
            },
            {
                'codigo': 'PROPIEDAD',
                'nombre': 'Propiedad',
                'descripcion': 'Accionistas, propietarios e inversores de la organización',
                'icono': 'Building2',
                'color': 'purple',
                'orden': 2,
                'es_sistema': True,
            },
            {
                'codigo': 'CLIENTES',
                'nombre': 'Clientes',
                'descripcion': 'Clientes actuales, potenciales, franquicias y no clientes',
                'icono': 'ShoppingCart',
                'color': 'green',
                'orden': 3,
                'es_sistema': True,
            },
            {
                'codigo': 'PROVEEDORES',
                'nombre': 'Proveedores',
                'descripcion': 'Proveedores de materias primas, servicios y subcontratistas',
                'icono': 'Truck',
                'color': 'orange',
                'orden': 4,
                'es_sistema': True,
            },
            {
                'codigo': 'COMPETIDORES',
                'nombre': 'Competidores',
                'descripcion': 'Empresas competidoras, asociaciones empresariales, clusters y patronales',
                'icono': 'Target',
                'color': 'red',
                'orden': 5,
                'es_sistema': True,
            },
            {
                'codigo': 'COMUNIDAD_LOCAL',
                'nombre': 'Comunidad Local',
                'descripcion': 'Vecinos, asociaciones locales y empresas cercanas a la organización',
                'icono': 'MapPin',
                'color': 'cyan',
                'orden': 6,
                'es_sistema': True,
            },
            {
                'codigo': 'ADMIN_PUBLICAS',
                'nombre': 'Administraciones Públicas',
                'descripcion': 'Gobierno, ayuntamientos, agencias de desarrollo local y entidades gubernamentales',
                'icono': 'Landmark',
                'color': 'indigo',
                'orden': 7,
                'es_sistema': True,
            },
            {
                'codigo': 'AGENTES_SOCIALES',
                'nombre': 'Agentes Sociales',
                'descripcion': 'Universidades, escuelas de formación profesional y centros de investigación',
                'icono': 'GraduationCap',
                'color': 'violet',
                'orden': 8,
                'es_sistema': True,
            },
            {
                'codigo': 'SOCIEDAD',
                'nombre': 'Sociedad',
                'descripcion': 'ONGs, grupos de presión, medios de comunicación y opinión pública',
                'icono': 'Newspaper',
                'color': 'pink',
                'orden': 9,
                'es_sistema': True,
            },
            {
                'codigo': 'MEDIO_AMBIENTE',
                'nombre': 'Medio Ambiente',
                'descripcion': 'Grupos ecologistas y organizaciones de protección ambiental',
                'icono': 'Leaf',
                'color': 'emerald',
                'orden': 10,
                'es_sistema': True,
            },
        ]

        created_count = 0
        updated_count = 0

        for grupo_data in grupos:
            grupo, created = GrupoParteInteresada.objects.update_or_create(
                codigo=grupo_data['codigo'],
                defaults=grupo_data
            )

            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'  ✓ Creado: {grupo.nombre}')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'  ⚠ Actualizado: {grupo.nombre}')
                )

        self.stdout.write('')
        self.stdout.write(
            self.style.MIGRATE_LABEL(
                f'Resumen: {created_count} creados, {updated_count} actualizados'
            )
        )
        self.stdout.write(
            self.style.SUCCESS(f'\n✅ Proceso completado exitosamente\n')
        )
