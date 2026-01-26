"""
Comando para poblar tipos de parte interesada (catálogo base).

Ejecutar con:
    python manage.py seed_tipos_parte_interesada

Catálogo basado en ISO 9001:2015 Cláusula 4.2 - Comprensión de las
necesidades y expectativas de las partes interesadas.
"""
from django.core.management.base import BaseCommand
from apps.gestion_estrategica.contexto.models import TipoParteInteresada


class Command(BaseCommand):
    help = 'Pobla el catálogo de tipos de parte interesada según ISO 9001:2015'

    def handle(self, *args, **options):
        self.stdout.write('Iniciando seed de Tipos de Parte Interesada...')

        # =====================================================================
        # CATÁLOGO DE TIPOS DE PARTE INTERESADA
        # Basado en ISO 9001:2015 y mejores prácticas de stakeholder management
        # =====================================================================
        tipos_data = [
            # --- PARTES INTERESADAS INTERNAS ---
            {
                'codigo': 'EMP',
                'nombre': 'Empleados',
                'categoria': 'interna',
                'descripcion': 'Personal vinculado directamente a la organización. Incluye operativos, administrativos y técnicos.',
                'orden': 1,
            },
            {
                'codigo': 'DIR',
                'nombre': 'Alta Dirección',
                'categoria': 'interna',
                'descripcion': 'Gerentes, directores y ejecutivos responsables de la toma de decisiones estratégicas.',
                'orden': 2,
            },
            {
                'codigo': 'ACC',
                'nombre': 'Accionistas/Propietarios',
                'categoria': 'interna',
                'descripcion': 'Personas o entidades que poseen participación accionaria en la organización.',
                'orden': 3,
            },
            {
                'codigo': 'SIN',
                'nombre': 'Sindicatos',
                'categoria': 'interna',
                'descripcion': 'Organizaciones sindicales que representan a los trabajadores.',
                'orden': 4,
            },
            {
                'codigo': 'COM',
                'nombre': 'Comités Internos',
                'categoria': 'interna',
                'descripcion': 'COPASST, Comité de Convivencia, Brigadas de Emergencia y otros comités organizacionales.',
                'orden': 5,
            },

            # --- PARTES INTERESADAS EXTERNAS ---
            {
                'codigo': 'CLI',
                'nombre': 'Clientes',
                'categoria': 'externa',
                'descripcion': 'Personas u organizaciones que adquieren productos o servicios de la empresa.',
                'orden': 10,
            },
            {
                'codigo': 'PRO',
                'nombre': 'Proveedores',
                'categoria': 'externa',
                'descripcion': 'Empresas o personas que suministran bienes, materias primas o servicios.',
                'orden': 11,
            },
            {
                'codigo': 'CON',
                'nombre': 'Contratistas',
                'categoria': 'externa',
                'descripcion': 'Empresas o personas que ejecutan trabajos específicos bajo contrato.',
                'orden': 12,
            },
            {
                'codigo': 'GOB',
                'nombre': 'Entidades Gubernamentales',
                'categoria': 'externa',
                'descripcion': 'Ministerios, superintendencias, alcaldías, gobernaciones y entes de control.',
                'orden': 13,
            },
            {
                'codigo': 'REG',
                'nombre': 'Entes Reguladores',
                'categoria': 'externa',
                'descripcion': 'Organismos que regulan y supervisan el sector (ICA, INVIMA, Secretarías de Salud, etc.).',
                'orden': 14,
            },
            {
                'codigo': 'ARL',
                'nombre': 'ARL y Aseguradoras',
                'categoria': 'externa',
                'descripcion': 'Administradoras de Riesgos Laborales, EPS, AFP y compañías de seguros.',
                'orden': 15,
            },
            {
                'codigo': 'CER',
                'nombre': 'Entes Certificadores',
                'categoria': 'externa',
                'descripcion': 'Organismos de certificación ISO, auditorías externas y entidades acreditadoras.',
                'orden': 16,
            },
            {
                'codigo': 'COM_EXT',
                'nombre': 'Comunidad',
                'categoria': 'externa',
                'descripcion': 'Vecinos, comunidades aledañas y ciudadanía en general afectada por las operaciones.',
                'orden': 17,
            },
            {
                'codigo': 'AMB',
                'nombre': 'Autoridades Ambientales',
                'categoria': 'externa',
                'descripcion': 'CAR, Ministerio de Ambiente, ANLA y otras autoridades ambientales.',
                'orden': 18,
            },
            {
                'codigo': 'GRE',
                'nombre': 'Gremios y Asociaciones',
                'categoria': 'externa',
                'descripcion': 'Cámaras de comercio, gremios sectoriales, asociaciones empresariales.',
                'orden': 19,
            },
            {
                'codigo': 'MED',
                'nombre': 'Medios de Comunicación',
                'categoria': 'externa',
                'descripcion': 'Prensa, radio, televisión, redes sociales y medios digitales.',
                'orden': 20,
            },
            {
                'codigo': 'FIN',
                'nombre': 'Entidades Financieras',
                'categoria': 'externa',
                'descripcion': 'Bancos, fondos de inversión, entidades crediticias.',
                'orden': 21,
            },
            {
                'codigo': 'EDU',
                'nombre': 'Instituciones Educativas',
                'categoria': 'externa',
                'descripcion': 'Universidades, SENA, centros de investigación, instituciones de formación.',
                'orden': 22,
            },
            {
                'codigo': 'ONG',
                'nombre': 'ONGs y Fundaciones',
                'categoria': 'externa',
                'descripcion': 'Organizaciones no gubernamentales, fundaciones sociales y ambientales.',
                'orden': 23,
            },
            {
                'codigo': 'COMP',
                'nombre': 'Competidores',
                'categoria': 'externa',
                'descripcion': 'Empresas del mismo sector que compiten en el mercado.',
                'orden': 24,
            },
        ]

        created_count = 0
        updated_count = 0

        for tipo_data in tipos_data:
            tipo, created = TipoParteInteresada.objects.update_or_create(
                codigo=tipo_data['codigo'],
                defaults={
                    'nombre': tipo_data['nombre'],
                    'categoria': tipo_data['categoria'],
                    'descripcion': tipo_data['descripcion'],
                    'orden': tipo_data['orden'],
                    'is_active': True,
                }
            )
            if created:
                created_count += 1
                self.stdout.write(f'  [+] Tipo "{tipo.nombre}" creado')
            else:
                updated_count += 1
                self.stdout.write(f'  [~] Tipo "{tipo.nombre}" actualizado')

        # =====================================================================
        # RESUMEN
        # =====================================================================
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('SEED DE TIPOS DE PARTE INTERESADA COMPLETADO'))
        self.stdout.write(self.style.SUCCESS('=' * 60))

        internos = TipoParteInteresada.objects.filter(categoria='interna', is_active=True).count()
        externos = TipoParteInteresada.objects.filter(categoria='externa', is_active=True).count()
        total = TipoParteInteresada.objects.filter(is_active=True).count()

        self.stdout.write(f'''
Resultados:
  - Tipos creados: {created_count}
  - Tipos actualizados: {updated_count}

Catálogo actual:
  - Partes internas: {internos}
  - Partes externas: {externos}
  - Total activos: {total}

Para probar:
  1. Ir a Dirección Estratégica > Contexto > Stakeholders
  2. Crear nueva parte interesada
  3. Verificar que los tipos aparecen en el dropdown
  4. Verificar clasificación interna/externa
        ''')
