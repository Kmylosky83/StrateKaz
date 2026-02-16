"""
Seed: 75 preguntas estándar PCI-POAM
=====================================

Carga el banco de preguntas PCI-POAM para diagnóstico de contexto organizacional.

PCI (1-52): Perfil de Capacidad Interna → Fortaleza/Debilidad
POAM (53-75): Perfil de Oportunidades y Amenazas → Oportunidad/Amenaza

Uso:
    python manage.py seed_preguntas_pci_poam
"""
from django.core.management.base import BaseCommand
from apps.gestion_estrategica.encuestas.models import PreguntaContexto


PREGUNTAS_PCI_POAM = [
    # =========================================================================
    # PCI - CAPACIDAD DIRECTIVA (1-12)
    # =========================================================================
    {
        'codigo': 'PCI-01', 'orden': 1,
        'texto': 'En la organización las características, valores, creencias, historia, filosofía de trabajo y las normas establecidas con las que se identifica y se diferencia de las otras organizaciones, hacen que su imagen corporativa sea una',
        'perfil': 'pci', 'capacidad_pci': 'directiva', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-02', 'orden': 2,
        'texto': 'El compromiso de la alta dirección con los sistemas de gestión ambiental, de seguridad y salud en el trabajo y de calidad es una',
        'perfil': 'pci', 'capacidad_pci': 'directiva', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-03', 'orden': 3,
        'texto': 'El diseño y la implementación de planes estratégicos es una',
        'perfil': 'pci', 'capacidad_pci': 'directiva', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-04', 'orden': 4,
        'texto': 'Cuando se presentan situaciones anómalas o inesperadas, la velocidad de respuesta de la organización es una',
        'perfil': 'pci', 'capacidad_pci': 'directiva', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-05', 'orden': 5,
        'texto': 'La posibilidad de que se modifiquen la distribución de tareas, la estructura de los procesos o los canales de comunicación interna demuestran que la flexibilidad organizacional es una',
        'perfil': 'pci', 'capacidad_pci': 'directiva', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-06', 'orden': 6,
        'texto': 'La forma en la que se maneja la información dentro de la organización demuestra que la comunicación interna es una',
        'perfil': 'pci', 'capacidad_pci': 'directiva', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-07', 'orden': 7,
        'texto': 'La política de seguridad y salud en el trabajo o política integral es una',
        'perfil': 'pci', 'capacidad_pci': 'directiva', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-08', 'orden': 8,
        'texto': 'La orientación empresarial de la organización (hacia dónde va la empresa, es clara y bien estructurada) lo que permite que sea una',
        'perfil': 'pci', 'capacidad_pci': 'directiva', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-09', 'orden': 9,
        'texto': 'La organización cuando debe enfrentar a la competencia demuestra que sus estrategias son una',
        'perfil': 'pci', 'capacidad_pci': 'directiva', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-10', 'orden': 10,
        'texto': 'Los mecanismos utilizados por la alta dirección para la toma de decisiones son una',
        'perfil': 'pci', 'capacidad_pci': 'directiva', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-11', 'orden': 11,
        'texto': 'La gestión para la atención y el tratamiento de peticiones, quejas, reclamos o sugerencias es una',
        'perfil': 'pci', 'capacidad_pci': 'directiva', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-12', 'orden': 12,
        'texto': 'La adopción e integración de cambios tecnológicos de la organización es una',
        'perfil': 'pci', 'capacidad_pci': 'directiva', 'clasificacion_esperada': 'fd',
    },

    # =========================================================================
    # PCI - CAPACIDAD DEL TALENTO HUMANO (13-26)
    # =========================================================================
    {
        'codigo': 'PCI-13', 'orden': 13,
        'texto': 'Los procesos de contratación y la forma de identificar en el mercado personas altamente calificadas, talentosas y creativas, para contratarlos, retenerlos en la organización y hacer que aporten al crecimiento de la empresa es',
        'perfil': 'pci', 'capacidad_pci': 'talento_humano', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-14', 'orden': 14,
        'texto': 'El nivel académico y la experiencia del talento humano de la organización demuestra que es una',
        'perfil': 'pci', 'capacidad_pci': 'talento_humano', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-15', 'orden': 15,
        'texto': 'La estabilidad laboral que ofrece la organización es una',
        'perfil': 'pci', 'capacidad_pci': 'talento_humano', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-16', 'orden': 16,
        'texto': 'En la organización la manera en que ingresa y se retira personal; a lo que se le define rotación de personal, es una',
        'perfil': 'pci', 'capacidad_pci': 'talento_humano', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-17', 'orden': 17,
        'texto': 'Los colaboradores de la organización con su actitud y forma de desarrollar las actividades demuestran que su compromiso (nivel de pertenencia) por la empresa es una',
        'perfil': 'pci', 'capacidad_pci': 'talento_humano', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-18', 'orden': 18,
        'texto': 'La remuneración económica o en especie y las condiciones laborales contractuales de los empleados son una',
        'perfil': 'pci', 'capacidad_pci': 'talento_humano', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-19', 'orden': 19,
        'texto': 'Cómo se lleva actualmente el proceso de inducción y reinducción de la organización demuestra que es una',
        'perfil': 'pci', 'capacidad_pci': 'talento_humano', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-20', 'orden': 20,
        'texto': 'Los programas de capacitación de la organización son una',
        'perfil': 'pci', 'capacidad_pci': 'talento_humano', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-21', 'orden': 21,
        'texto': 'La accidentalidad dentro de la organización es una',
        'perfil': 'pci', 'capacidad_pci': 'talento_humano', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-22', 'orden': 22,
        'texto': 'El ausentismo, solicitud de permisos e incapacidades en la organización son una',
        'perfil': 'pci', 'capacidad_pci': 'talento_humano', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-23', 'orden': 23,
        'texto': 'El procedimiento de evaluación de desempeño donde se mide el desempeño de los colaboradores es una',
        'perfil': 'pci', 'capacidad_pci': 'talento_humano', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-24', 'orden': 24,
        'texto': 'El ambiente laboral de la organización es una',
        'perfil': 'pci', 'capacidad_pci': 'talento_humano', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-25', 'orden': 25,
        'texto': 'Los espacios de consulta e integración de todo el personal en temas referentes a seguridad y salud en el trabajo son una',
        'perfil': 'pci', 'capacidad_pci': 'talento_humano', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-26', 'orden': 26,
        'texto': 'El liderazgo de los procesos es una',
        'perfil': 'pci', 'capacidad_pci': 'talento_humano', 'clasificacion_esperada': 'fd',
    },

    # =========================================================================
    # PCI - CAPACIDAD TECNOLOGICA (27-36)
    # =========================================================================
    {
        'codigo': 'PCI-27', 'orden': 27,
        'texto': 'Equipos de cómputo, herramientas tecnológicas, tablets, celulares, impresoras y otros equipos con los que cuenta la organización tienen un hardware (estado físico) y una versión de software (programas) que demuestran que son una',
        'perfil': 'pci', 'capacidad_pci': 'tecnologica', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-28', 'orden': 28,
        'texto': 'Los equipos como vehículos y herramientas con las que se desarrollan las actividades de la organización cuentan con una tecnología que demuestra que son una',
        'perfil': 'pci', 'capacidad_pci': 'tecnologica', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-29', 'orden': 29,
        'texto': 'Las instalaciones de la organización, sus áreas, confort y ambiente demuestran que son una',
        'perfil': 'pci', 'capacidad_pci': 'tecnologica', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-30', 'orden': 30,
        'texto': 'El personal de la organización tiene gran destreza en el manejo del software administrativo, contable y del sistema de gestión integral, demostrando que es una',
        'perfil': 'pci', 'capacidad_pci': 'tecnologica', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-31', 'orden': 31,
        'texto': 'La organización cuenta con bases de datos actualizadas de los clientes y proveedores demostrando que son una',
        'perfil': 'pci', 'capacidad_pci': 'tecnologica', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-32', 'orden': 32,
        'texto': 'Las herramientas de control y seguimiento que utiliza la empresa para los procesos de la organización son una',
        'perfil': 'pci', 'capacidad_pci': 'tecnologica', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-33', 'orden': 33,
        'texto': 'Los procesos de innovación de la organización son una',
        'perfil': 'pci', 'capacidad_pci': 'tecnologica', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-34', 'orden': 34,
        'texto': 'La coordinación e integración de todas las áreas o departamentos de la organización entre sí demuestran que son una',
        'perfil': 'pci', 'capacidad_pci': 'tecnologica', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-35', 'orden': 35,
        'texto': 'El cumplimiento a los estándares de calidad en el desarrollo de las actividades, para la producción y oferta de productos y servicios es una',
        'perfil': 'pci', 'capacidad_pci': 'tecnologica', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-36', 'orden': 36,
        'texto': 'El mantenimiento preventivo y correctivo de la infraestructura, herramientas y equipos es una',
        'perfil': 'pci', 'capacidad_pci': 'tecnologica', 'clasificacion_esperada': 'fd',
    },

    # =========================================================================
    # PCI - CAPACIDAD COMPETITIVA (37-46)
    # =========================================================================
    {
        'codigo': 'PCI-37', 'orden': 37,
        'texto': 'El posicionamiento y reconocimiento de los productos y servicios de la organización en el mercado son una',
        'perfil': 'pci', 'capacidad_pci': 'competitiva', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-38', 'orden': 38,
        'texto': 'Los productos y servicios que ofrece la organización son oportunos, acordes al mercado y a la razón de ser, demostrando que su oferta es una',
        'perfil': 'pci', 'capacidad_pci': 'competitiva', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-39', 'orden': 39,
        'texto': 'Los procedimientos de selección y evaluación de proveedores y servicios son una',
        'perfil': 'pci', 'capacidad_pci': 'competitiva', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-40', 'orden': 40,
        'texto': 'El diseño e implementación de las estrategias comerciales de la organización son una',
        'perfil': 'pci', 'capacidad_pci': 'competitiva', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-41', 'orden': 41,
        'texto': 'El acompañamiento al cliente durante todo el proceso en la organización es una',
        'perfil': 'pci', 'capacidad_pci': 'competitiva', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-42', 'orden': 42,
        'texto': 'La satisfacción del cliente con nuestros productos es una',
        'perfil': 'pci', 'capacidad_pci': 'competitiva', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-43', 'orden': 43,
        'texto': 'El ambiente para la atención a los clientes es una',
        'perfil': 'pci', 'capacidad_pci': 'competitiva', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-44', 'orden': 44,
        'texto': 'La utilización de las herramientas TIC para promoción de sus servicios y posicionamiento de la organización es una',
        'perfil': 'pci', 'capacidad_pci': 'competitiva', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-45', 'orden': 45,
        'texto': 'El portafolio de productos y servicios es una',
        'perfil': 'pci', 'capacidad_pci': 'competitiva', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-46', 'orden': 46,
        'texto': 'El equipo o departamento comercial es una',
        'perfil': 'pci', 'capacidad_pci': 'competitiva', 'clasificacion_esperada': 'fd',
    },

    # =========================================================================
    # PCI - CAPACIDAD FINANCIERA (47-52)
    # =========================================================================
    {
        'codigo': 'PCI-47', 'orden': 47,
        'texto': 'El acceso al capital económico de la organización cuando se requiere demuestra que es una',
        'perfil': 'pci', 'capacidad_pci': 'financiera', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-48', 'orden': 48,
        'texto': 'La capacidad de utilización del nivel de endeudamiento de la organización con entes externos es una',
        'perfil': 'pci', 'capacidad_pci': 'financiera', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-49', 'orden': 49,
        'texto': 'La rentabilidad y el retorno de la inversión de la organización es una',
        'perfil': 'pci', 'capacidad_pci': 'financiera', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-50', 'orden': 50,
        'texto': 'La habilidad para competir con precios es una',
        'perfil': 'pci', 'capacidad_pci': 'financiera', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-51', 'orden': 51,
        'texto': 'La inversión de capital para fortalecer los procesos y satisfacer la demanda es una',
        'perfil': 'pci', 'capacidad_pci': 'financiera', 'clasificacion_esperada': 'fd',
    },
    {
        'codigo': 'PCI-52', 'orden': 52,
        'texto': 'La estabilidad de costos de la organización es una',
        'perfil': 'pci', 'capacidad_pci': 'financiera', 'clasificacion_esperada': 'fd',
    },

    # =========================================================================
    # POAM - FACTORES ECONOMICOS (53-58)
    # =========================================================================
    {
        'codigo': 'POAM-53', 'orden': 53,
        'texto': 'La apertura económica de la región es una',
        'perfil': 'poam', 'factor_poam': 'economico', 'clasificacion_esperada': 'oa',
        'dimension_pestel': 'economico',
    },
    {
        'codigo': 'POAM-54', 'orden': 54,
        'texto': 'Las nuevas medidas tributarias del gobierno son una',
        'perfil': 'poam', 'factor_poam': 'economico', 'clasificacion_esperada': 'oa',
        'dimension_pestel': 'economico',
    },
    {
        'codigo': 'POAM-55', 'orden': 55,
        'texto': 'La creación de nuevos impuestos es una',
        'perfil': 'poam', 'factor_poam': 'economico', 'clasificacion_esperada': 'oa',
        'dimension_pestel': 'economico',
    },
    {
        'codigo': 'POAM-56', 'orden': 56,
        'texto': 'La inestabilidad de la economía por situaciones incontrolables como pandemias, paros o eventos desconocidos es una',
        'perfil': 'poam', 'factor_poam': 'economico', 'clasificacion_esperada': 'oa',
        'dimension_pestel': 'economico',
    },
    {
        'codigo': 'POAM-57', 'orden': 57,
        'texto': 'La variación de los precios de los proveedores es una',
        'perfil': 'poam', 'factor_poam': 'economico', 'clasificacion_esperada': 'oa',
        'dimension_pestel': 'economico',
    },
    {
        'codigo': 'POAM-58', 'orden': 58,
        'texto': 'La situación económica de la región es una',
        'perfil': 'poam', 'factor_poam': 'economico', 'clasificacion_esperada': 'oa',
        'dimension_pestel': 'economico',
    },

    # =========================================================================
    # POAM - FACTORES POLITICOS (59-63)
    # =========================================================================
    {
        'codigo': 'POAM-59', 'orden': 59,
        'texto': 'La normatividad legal aplicable es una',
        'perfil': 'poam', 'factor_poam': 'politico', 'clasificacion_esperada': 'oa',
        'dimension_pestel': 'politico',
    },
    {
        'codigo': 'POAM-60', 'orden': 60,
        'texto': 'Los cambios gubernamentales son una',
        'perfil': 'poam', 'factor_poam': 'politico', 'clasificacion_esperada': 'oa',
        'dimension_pestel': 'politico',
    },
    {
        'codigo': 'POAM-61', 'orden': 61,
        'texto': 'La emisión de licencias de funcionamiento es una',
        'perfil': 'poam', 'factor_poam': 'politico', 'clasificacion_esperada': 'oa',
        'dimension_pestel': 'politico',
    },
    {
        'codigo': 'POAM-62', 'orden': 62,
        'texto': 'La vigilancia por los entes de control es una',
        'perfil': 'poam', 'factor_poam': 'politico', 'clasificacion_esperada': 'oa',
        'dimension_pestel': 'politico',
    },
    {
        'codigo': 'POAM-63', 'orden': 63,
        'texto': 'Las ayudas económicas emitidas por los gobiernos para la atención de situaciones externas son una',
        'perfil': 'poam', 'factor_poam': 'politico', 'clasificacion_esperada': 'oa',
        'dimension_pestel': 'politico',
    },

    # =========================================================================
    # POAM - FACTORES SOCIALES (64-69)
    # =========================================================================
    {
        'codigo': 'POAM-64', 'orden': 64,
        'texto': 'El impacto ambiental es una',
        'perfil': 'poam', 'factor_poam': 'social', 'clasificacion_esperada': 'oa',
        'dimension_pestel': 'ecologico',
    },
    {
        'codigo': 'POAM-65', 'orden': 65,
        'texto': 'El desempleo es una',
        'perfil': 'poam', 'factor_poam': 'social', 'clasificacion_esperada': 'oa',
        'dimension_pestel': 'social',
    },
    {
        'codigo': 'POAM-66', 'orden': 66,
        'texto': 'La presencia de grupos armados al margen de la ley es una',
        'perfil': 'poam', 'factor_poam': 'social', 'clasificacion_esperada': 'oa',
        'dimension_pestel': 'social',
    },
    {
        'codigo': 'POAM-67', 'orden': 67,
        'texto': 'La inseguridad y delincuencia es una',
        'perfil': 'poam', 'factor_poam': 'social', 'clasificacion_esperada': 'oa',
        'dimension_pestel': 'social',
    },
    {
        'codigo': 'POAM-68', 'orden': 68,
        'texto': 'La infraestructura de la salud para la atención de emergencias sanitarias es una',
        'perfil': 'poam', 'factor_poam': 'social', 'clasificacion_esperada': 'oa',
        'dimension_pestel': 'social',
    },
    {
        'codigo': 'POAM-69', 'orden': 69,
        'texto': 'La responsabilidad social empresarial es una',
        'perfil': 'poam', 'factor_poam': 'social', 'clasificacion_esperada': 'oa',
        'dimension_pestel': 'social',
    },

    # =========================================================================
    # POAM - FACTORES TECNOLOGICOS (70-72)
    # =========================================================================
    {
        'codigo': 'POAM-70', 'orden': 70,
        'texto': 'La facilidad de acceso a la tecnología en la región es una',
        'perfil': 'poam', 'factor_poam': 'tecnologico', 'clasificacion_esperada': 'oa',
        'dimension_pestel': 'tecnologico',
    },
    {
        'codigo': 'POAM-71', 'orden': 71,
        'texto': 'La infraestructura de las telecomunicaciones en la región es una',
        'perfil': 'poam', 'factor_poam': 'tecnologico', 'clasificacion_esperada': 'oa',
        'dimension_pestel': 'tecnologico',
    },
    {
        'codigo': 'POAM-72', 'orden': 72,
        'texto': 'La velocidad del desarrollo tecnológico en la región es una',
        'perfil': 'poam', 'factor_poam': 'tecnologico', 'clasificacion_esperada': 'oa',
        'dimension_pestel': 'tecnologico',
    },

    # =========================================================================
    # POAM - FACTORES GEOGRAFICOS (73-75) → mapean a ecologico en PESTEL
    # =========================================================================
    {
        'codigo': 'POAM-73', 'orden': 73,
        'texto': 'La ubicación geográfica de la compañía y sus centros de operación es una',
        'perfil': 'poam', 'factor_poam': 'geografico', 'clasificacion_esperada': 'oa',
        'dimension_pestel': 'ecologico',
    },
    {
        'codigo': 'POAM-74', 'orden': 74,
        'texto': 'La calidad de las vías en la región para el acceso a los centros de operación es una',
        'perfil': 'poam', 'factor_poam': 'geografico', 'clasificacion_esperada': 'oa',
        'dimension_pestel': 'ecologico',
    },
    {
        'codigo': 'POAM-75', 'orden': 75,
        'texto': 'Los factores climáticos y ambientales de la región son una',
        'perfil': 'poam', 'factor_poam': 'geografico', 'clasificacion_esperada': 'oa',
        'dimension_pestel': 'ecologico',
    },
]


class Command(BaseCommand):
    help = 'Carga las 75 preguntas estándar PCI-POAM para diagnóstico de contexto organizacional'

    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0
        skipped_count = 0

        for pregunta_data in PREGUNTAS_PCI_POAM:
            codigo = pregunta_data['codigo']

            obj, created = PreguntaContexto.objects.update_or_create(
                codigo=codigo,
                defaults={
                    'texto': pregunta_data['texto'],
                    'perfil': pregunta_data['perfil'],
                    'capacidad_pci': pregunta_data.get('capacidad_pci', ''),
                    'factor_poam': pregunta_data.get('factor_poam', ''),
                    'clasificacion_esperada': pregunta_data['clasificacion_esperada'],
                    'dimension_pestel': pregunta_data.get('dimension_pestel', ''),
                    'orden': pregunta_data['orden'],
                    'es_sistema': True,
                }
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

        total = len(PREGUNTAS_PCI_POAM)
        self.stdout.write(self.style.SUCCESS(
            f'PCI-POAM: {total} preguntas procesadas '
            f'({created_count} creadas, {updated_count} actualizadas)'
        ))

        # Resumen por sección
        pci = sum(1 for p in PREGUNTAS_PCI_POAM if p['perfil'] == 'pci')
        poam = sum(1 for p in PREGUNTAS_PCI_POAM if p['perfil'] == 'poam')
        self.stdout.write(f'  PCI (Capacidad Interna): {pci} preguntas')
        self.stdout.write(f'  POAM (Oportunidades/Amenazas): {poam} preguntas')
