"""
Comando para poblar datos de prueba en Identidad Corporativa.

Ejecutar con:
    python manage.py seed_identidad
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.gestion_estrategica.identidad.models import (
    CorporateIdentity, CorporateValue, AlcanceSistema
)
from apps.gestion_estrategica.configuracion.models import NormaISO
from apps.core.models import User


class Command(BaseCommand):
    help = 'Pobla datos de prueba para el módulo Identidad Corporativa'

    def handle(self, *args, **options):
        self.stdout.write('Iniciando seed de Identidad Corporativa...')

        # Obtener usuario admin o el primero disponible
        try:
            user = User.objects.filter(is_superuser=True).first()
            if not user:
                user = User.objects.first()
            if not user:
                self.stdout.write(self.style.ERROR('No hay usuarios en la base de datos'))
                return
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error obteniendo usuario: {e}'))
            return

        # =====================================================================
        # 1. IDENTIDAD CORPORATIVA
        # =====================================================================
        identity, created = CorporateIdentity.objects.get_or_create(
            is_active=True,
            defaults={
                'mission': '''<p><strong>Somos una empresa dedicada a la recolección, procesamiento y comercialización de subproductos de origen animal</strong>, comprometida con:</p>
<ul>
<li>La <strong>satisfacción de nuestros clientes</strong> a través de productos de alta calidad</li>
<li>El <strong>bienestar de nuestros colaboradores</strong> mediante ambientes de trabajo seguros</li>
<li>La <strong>protección del medio ambiente</strong> con procesos sostenibles</li>
<li>El <strong>cumplimiento normativo</strong> en todas nuestras operaciones</li>
</ul>
<p>Transformamos residuos en recursos valiosos, contribuyendo a la economía circular.</p>''',

                'vision': '''<p>Para el año <strong>2030</strong>, ser reconocidos como la empresa líder en el sector de rendering en el norte de Colombia, destacándonos por:</p>
<ol>
<li><strong>Innovación tecnológica</strong> en procesos de transformación</li>
<li><strong>Excelencia operacional</strong> con certificaciones ISO integradas</li>
<li><strong>Responsabilidad social</strong> y ambiental ejemplar</li>
<li><strong>Expansión regional</strong> con presencia en toda la Costa Caribe</li>
</ol>
<p><em>Transformando el presente, cuidando el futuro.</em></p>''',

                'effective_date': timezone.now().date(),
                'version': '1.0',
                'created_by': user,
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS('[OK] Identidad Corporativa creada'))
        else:
            self.stdout.write('  Identidad Corporativa ya existe')

        # =====================================================================
        # 2. VALORES CORPORATIVOS
        # =====================================================================
        valores_data = [
            {
                'name': 'Integridad',
                'description': 'Actuamos con honestidad, transparencia y ética en todas nuestras relaciones. Cumplimos lo que prometemos y asumimos responsabilidad por nuestras acciones.',
                'icon': 'Shield',
                'orden': 1,
            },
            {
                'name': 'Compromiso',
                'description': 'Nos dedicamos con pasión al logro de nuestros objetivos. Damos lo mejor de nosotros en cada tarea y buscamos siempre superar las expectativas.',
                'icon': 'Heart',
                'orden': 2,
            },
            {
                'name': 'Excelencia',
                'description': 'Buscamos la mejora continua en todo lo que hacemos. No nos conformamos con lo bueno, aspiramos a lo extraordinario.',
                'icon': 'Star',
                'orden': 3,
            },
            {
                'name': 'Trabajo en Equipo',
                'description': 'Colaboramos activamente para alcanzar metas comunes. Valoramos la diversidad de ideas y el aporte de cada miembro del equipo.',
                'icon': 'Users',
                'orden': 4,
            },
            {
                'name': 'Innovación',
                'description': 'Fomentamos la creatividad y la búsqueda de nuevas soluciones. Nos adaptamos al cambio y aprovechamos las oportunidades de mejora.',
                'icon': 'Lightbulb',
                'orden': 5,
            },
            {
                'name': 'Sostenibilidad',
                'description': 'Operamos con responsabilidad ambiental y social. Cuidamos los recursos para las generaciones futuras y contribuimos al desarrollo de nuestra comunidad.',
                'icon': 'Leaf',
                'orden': 6,
            },
        ]

        for valor_data in valores_data:
            valor, created = CorporateValue.objects.get_or_create(
                identity=identity,
                name=valor_data['name'],
                defaults={
                    'description': valor_data['description'],
                    'icon': valor_data['icon'],
                    'orden': valor_data['orden'],
                    'is_active': True,
                }
            )
            if created:
                self.stdout.write(f'  [+] Valor "{valor.name}" creado')

        # =====================================================================
        # 3. NORMAS ISO (para alcances y politicas)
        # =====================================================================
        normas_data = [
            {
                'code': 'ISO_9001',
                'name': 'ISO 9001:2015 Sistema de Gestion de la Calidad',
                'short_name': 'Calidad',
                'category': 'Calidad',
                'version': '2015',
                'icon': 'Award',
                'color': 'blue',
            },
            {
                'code': 'ISO_45001',
                'name': 'ISO 45001:2018 Sistema de Gestion de SST',
                'short_name': 'SST',
                'category': 'Seguridad',
                'version': '2018',
                'icon': 'Shield',
                'color': 'orange',
            },
            {
                'code': 'ISO_14001',
                'name': 'ISO 14001:2015 Sistema de Gestion Ambiental',
                'short_name': 'Ambiental',
                'category': 'Ambiente',
                'version': '2015',
                'icon': 'Leaf',
                'color': 'green',
            },
            {
                'code': 'SG_SST',
                'name': 'SG-SST Decreto 1072/2015',
                'short_name': 'SG-SST',
                'category': 'Seguridad',
                'version': '2015',
                'icon': 'Heart',
                'color': 'red',
            },
            {
                'code': 'PESV',
                'name': 'PESV Resolucion 40595/2022',
                'short_name': 'PESV',
                'category': 'Vial',
                'version': '2022',
                'icon': 'Car',
                'color': 'purple',
            },
        ]

        normas_map = {}
        for norma_data in normas_data:
            norma, created = NormaISO.objects.get_or_create(
                code=norma_data['code'],
                defaults={
                    'name': norma_data['name'],
                    'short_name': norma_data['short_name'],
                    'category': norma_data['category'],
                    'version': norma_data['version'],
                    'icon': norma_data['icon'],
                    'color': norma_data['color'],
                    'es_sistema': True,
                    'is_active': True,
                }
            )
            normas_map[norma_data['code']] = norma
            if created:
                self.stdout.write(f'  [+] Norma ISO "{norma.short_name}" creada')

        # =====================================================================
        # 4. ALCANCES DEL SISTEMA
        # =====================================================================
        alcances_data = [
            {
                'norma_code': 'ISO_9001',
                'scope': '''Diseno, produccion y comercializacion de harinas y aceites de origen animal para uso en alimentacion animal, incluyendo:
- Recoleccion de subproductos de plantas de beneficio
- Procesamiento mediante coccion, prensado y secado
- Control de calidad en laboratorio propio
- Distribucion a clientes industriales''',
                'is_certified': True,
                'certification_body': 'ICONTEC',
                'certificate_number': 'CO-SC 007321',
                'certification_date': (timezone.now() - timedelta(days=365)).date(),
                'expiry_date': (timezone.now() + timedelta(days=730)).date(),
            },
            {
                'norma_code': 'ISO_45001',
                'scope': '''Sistema de Gestion de Seguridad y Salud en el Trabajo aplicable a todas las actividades de la organizacion:
- Operaciones de planta de rendering
- Recoleccion y transporte de materias primas
- Almacenamiento y despacho de productos
- Actividades administrativas''',
                'is_certified': False,
                'certification_body': 'Bureau Veritas',
            },
            {
                'norma_code': 'SG_SST',
                'scope': '''Sistema de Gestion de Seguridad y Salud en el Trabajo segun Decreto 1072 de 2015 y Resolucion 0312 de 2019:
- Identificacion de peligros y evaluacion de riesgos
- Prevencion de accidentes y enfermedades laborales
- Preparacion y respuesta ante emergencias
- Vigilancia de la salud de los trabajadores''',
                'is_certified': True,
                'certification_body': 'ARL Sura',
                'certificate_number': 'SST-2024-12345',
                'certification_date': (timezone.now() - timedelta(days=180)).date(),
                'expiry_date': (timezone.now() + timedelta(days=185)).date(),
            },
            {
                'norma_code': 'PESV',
                'scope': '''Plan Estrategico de Seguridad Vial segun Resolucion 40595 de 2022:
- Flota de 15 vehiculos de recoleccion
- 20 conductores certificados
- Rutas de recoleccion en 5 departamentos
- Programa de mantenimiento preventivo''',
                'is_certified': True,
                'certification_body': 'Ministerio de Transporte',
                'certificate_number': 'PESV-ATL-2024-0089',
                'certification_date': (timezone.now() - timedelta(days=90)).date(),
                'expiry_date': (timezone.now() + timedelta(days=275)).date(),
            },
        ]

        for alcance_data in alcances_data:
            norma = normas_map.get(alcance_data['norma_code'])
            alcance, created = AlcanceSistema.objects.get_or_create(
                identity=identity,
                norma_iso=norma,
                defaults={
                    'scope': alcance_data['scope'],
                    'is_certified': alcance_data.get('is_certified', False),
                    'certification_body': alcance_data.get('certification_body'),
                    'certificate_number': alcance_data.get('certificate_number'),
                    'certification_date': alcance_data.get('certification_date'),
                    'expiry_date': alcance_data.get('expiry_date'),
                    'is_active': True,
                    'created_by': user,
                }
            )
            if created:
                self.stdout.write(f'  [+] Alcance "{alcance_data["norma_code"]}" creado')

        # =====================================================================
        # RESUMEN
        # =====================================================================
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('SEED DE IDENTIDAD CORPORATIVA COMPLETADO'))
        self.stdout.write(self.style.SUCCESS('=' * 60))

        self.stdout.write(f'''
Datos creados:
  - 1 Identidad Corporativa
  - {CorporateValue.objects.filter(identity=identity).count()} Valores Corporativos
  - {AlcanceSistema.objects.filter(identity=identity).count()} Alcances del Sistema

Para probar:
  1. Ir a Direccion Estrategica > Identidad Corporativa
  2. Verificar las secciones: Mision/Vision, Valores
  3. Probar el Drag & Drop de valores
  4. Probar el editor de texto enriquecido
        ''')
