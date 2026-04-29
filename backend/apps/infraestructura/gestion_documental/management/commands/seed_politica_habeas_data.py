"""
Seed: Plantilla de Política de Tratamiento de Datos Personales (Habeas Data).

Crea una PlantillaDocumento ACTIVA tipo POL con contenido HTML pre-armado
conforme a la Ley 1581/2012 y Decreto 1377/2013 (Colombia).

El flujo esperado del tenant es:
  1. Admin va a Gestión Documental → Documentos → Crear Documento
  2. Selecciona tipo "Política" → aparece la plantilla "Habeas Data"
  3. El contenido se pre-carga con datos del tenant (personalizable)
  4. El admin asigna firmantes manualmente (ELABORÓ, APROBÓ, etc.)
  5. El firmante firma → admin publica → se distribuye como lectura obligatoria

Los firmantes son DINÁMICOS: el admin los asigna según necesidad
al enviar a revisión, NO se pre-cargan desde la plantilla.

Uso:
    python manage.py seed_politica_habeas_data
    python manage.py seed_politica_habeas_data --schema=tenant_demo
"""
import logging

from django.core.management.base import BaseCommand

logger = logging.getLogger('gestion_documental')

# Contenido de la plantilla — usa variables {{empresa_nombre}} y {{empresa_nit}}
# que el admin reemplaza al crear el documento (o se pre-interpolan desde EmpresaConfig).
CONTENIDO_PLANTILLA = """
<h1>POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES</h1>
<h2>{{empresa_nombre}}</h2>
<p><strong>NIT:</strong> {{empresa_nit}}</p>

<h3>1. RESPONSABLE DEL TRATAMIENTO</h3>
<p><strong>{{empresa_nombre}}</strong>, identificada con NIT {{empresa_nit}},
en calidad de Responsable del Tratamiento de datos personales, informa a todos los
titulares de datos personales que, en cumplimiento de la Ley Estatutaria 1581 de 2012,
el Decreto Reglamentario 1377 de 2013 y demás normatividad concordante, adopta la
presente Política de Tratamiento de Datos Personales.</p>

<h3>2. ALCANCE</h3>
<p>Esta política aplica a todas las bases de datos y/o archivos que contengan datos
personales que sean objeto de tratamiento por parte de <strong>{{empresa_nombre}}</strong>,
considerada como responsable y/o encargada del tratamiento de datos personales.</p>

<h3>3. DEFINICIONES</h3>
<ul>
<li><strong>Autorización:</strong> Consentimiento previo, expreso e informado del titular
para llevar a cabo el tratamiento de datos personales.</li>
<li><strong>Base de Datos:</strong> Conjunto organizado de datos personales que sea objeto
de tratamiento.</li>
<li><strong>Dato Personal:</strong> Cualquier información vinculada o que pueda asociarse
a una o varias personas naturales determinadas o determinables.</li>
<li><strong>Dato Sensible:</strong> Datos que afectan la intimidad del titular o cuyo uso
indebido puede generar discriminación (origen racial, orientación política, convicciones
religiosas, datos de salud, vida sexual, datos biométricos).</li>
<li><strong>Encargado del Tratamiento:</strong> Persona natural o jurídica, pública o
privada, que por sí misma o en asocio con otros, realice el tratamiento de datos
personales por cuenta del responsable.</li>
<li><strong>Responsable del Tratamiento:</strong> Persona natural o jurídica, pública o
privada, que por sí misma o en asocio con otros, decida sobre la base de datos y/o el
tratamiento de los datos.</li>
<li><strong>Titular:</strong> Persona natural cuyos datos personales sean objeto de
tratamiento.</li>
<li><strong>Tratamiento:</strong> Cualquier operación o conjunto de operaciones sobre datos
personales (recolección, almacenamiento, uso, circulación o supresión).</li>
</ul>

<h3>4. PRINCIPIOS RECTORES</h3>
<p>El tratamiento de datos personales se regirá por los siguientes principios:</p>
<ul>
<li><strong>Legalidad:</strong> Actividad regulada conforme a la ley.</li>
<li><strong>Finalidad:</strong> Obedecerá a una finalidad legítima informada al titular.</li>
<li><strong>Libertad:</strong> Solo puede ejercerse con consentimiento previo, expreso e
informado del titular.</li>
<li><strong>Veracidad:</strong> La información sujeta a tratamiento debe ser veraz, completa,
exacta, actualizada y comprobable.</li>
<li><strong>Transparencia:</strong> Debe garantizarse el derecho del titular a obtener
información sobre sus datos.</li>
<li><strong>Acceso y circulación restringida:</strong> Los datos no podrán estar en medios
de divulgación o comunicación masiva, salvo autorización.</li>
<li><strong>Seguridad:</strong> Los datos serán manejados con medidas técnicas, humanas y
administrativas necesarias para brindar seguridad.</li>
<li><strong>Confidencialidad:</strong> Todas las personas que intervengan en el tratamiento
están obligadas a garantizar la reserva de la información.</li>
</ul>

<h3>5. FINALIDADES DEL TRATAMIENTO</h3>
<p><strong>{{empresa_nombre}}</strong> tratará los datos personales para las siguientes
finalidades:</p>
<ul>
<li>Gestión de la relación laboral con empleados y contratistas.</li>
<li>Gestión comercial con clientes y proveedores.</li>
<li>Cumplimiento de obligaciones legales y contractuales.</li>
<li>Envío de comunicaciones relacionadas con la relación comercial o laboral.</li>
<li>Gestión de seguridad y salud en el trabajo (SST).</li>
<li>Gestión de sistemas integrados (ISO 9001, 14001, 45001, 27001).</li>
</ul>

<h3>6. DERECHOS DE LOS TITULARES</h3>
<p>Los titulares de datos personales tienen derecho a:</p>
<ul>
<li>Conocer, actualizar y rectificar sus datos personales.</li>
<li>Solicitar prueba de la autorización otorgada.</li>
<li>Ser informado respecto del uso dado a sus datos.</li>
<li>Revocar la autorización y/o solicitar la supresión del dato.</li>
<li>Presentar quejas ante la SIC por infracciones a la ley.</li>
<li>Acceder en forma gratuita a sus datos personales.</li>
</ul>

<h3>7. PROCEDIMIENTO PARA CONSULTAS Y RECLAMOS</h3>
<p>Las consultas y reclamos se podrán presentar a través de los canales de atención
de <strong>{{empresa_nombre}}</strong>. El término de respuesta será de diez (10) días
hábiles para consultas y quince (15) días hábiles para reclamos, contados a partir
de la fecha de recibo.</p>

<h3>8. VIGENCIA</h3>
<p>Esta política rige a partir de su fecha de publicación y estará vigente mientras
<strong>{{empresa_nombre}}</strong> mantenga actividades que involucren tratamiento de
datos personales.</p>

""".strip()


class Command(BaseCommand):
    help = 'Crea la Plantilla de Política de Habeas Data (Ley 1581/2012)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Actualiza la plantilla existente con el contenido más reciente',
        )

    def handle(self, *args, **options):
        from apps.infraestructura.gestion_documental.models import (
            PlantillaDocumento,
            TipoDocumento,
        )
        from apps.core.models import User

        # 1. Verificar TipoDocumento POL
        # TipoDocumento usa SoftDeleteManager que filtra is_deleted automáticamente
        tipo_pol = TipoDocumento.objects.filter(codigo='POL').first()
        if not tipo_pol:
            self.stderr.write(self.style.ERROR(
                'No existe TipoDocumento con código POL. Ejecute seed_tipos_documento_sgi primero.'
            ))
            return

        # 2. Buscar usuario admin como creador
        creador = User.objects.filter(
            is_superuser=True, is_active=True,
        ).first() or User.objects.filter(is_active=True).first()

        # 4. Verificar idempotencia
        plantilla_existente = PlantillaDocumento.objects.filter(
            tipo_documento=tipo_pol,
            nombre__icontains='datos personales',
        ).first()

        if plantilla_existente and not options.get('reset'):
            # Actualizar siempre el contenido para limpiar datos pre-interpolados
            plantilla_existente.contenido_plantilla = CONTENIDO_PLANTILLA
            plantilla_existente.firmantes_por_defecto = []
            plantilla_existente.save(update_fields=['contenido_plantilla', 'firmantes_por_defecto', 'updated_at'])
            self.stdout.write(self.style.SUCCESS(
                f'Plantilla actualizada con variables: "{plantilla_existente.nombre}"'
            ))
            return

        if plantilla_existente and options.get('reset'):
            plantilla_existente.contenido_plantilla = CONTENIDO_PLANTILLA
            plantilla_existente.firmantes_por_defecto = []
            plantilla_existente.save(update_fields=['contenido_plantilla', 'firmantes_por_defecto', 'updated_at'])
            self.stdout.write(self.style.SUCCESS(f'Plantilla RESET: "{plantilla_existente.nombre}"'))
            return

        # 5. Crear PlantillaDocumento — contenido con variables {{...}}, SIN pre-interpolar
        #    La interpolación ocurre al crear un documento desde la plantilla.
        plantilla = PlantillaDocumento.objects.create(
            nombre='Política de Tratamiento de Datos Personales (Habeas Data)',
            descripcion=(
                'Plantilla de la Política de Tratamiento y Protección de Datos '
                'Personales conforme a la Ley 1581/2012 y Decreto 1377/2013. '
                'Requiere firma de la alta dirección.'
            ),
            tipo_documento=tipo_pol,
            tipo_plantilla='HTML',
            contenido_plantilla=CONTENIDO_PLANTILLA,
            variables_disponibles=[
                'empresa_nombre', 'empresa_nit', 'empresa_razon_social',
                'empresa_representante_legal', 'empresa_ciudad', 'fecha_actual',
            ],
            version='1.0',
            estado='ACTIVA',
            es_por_defecto=True,
            firmantes_por_defecto=[],
            created_by=creador,
        )

        self.stdout.write(self.style.SUCCESS(
            f'Plantilla creada: "{plantilla.nombre}"'
        ))
        self.stdout.write(f'  Tipo: {tipo_pol.nombre} ({tipo_pol.codigo})')
        self.stdout.write(f'  Estado: ACTIVA')
        self.stdout.write(f'  es_por_defecto: True')
        self.stdout.write(f'  Firmantes: dinámicos (el admin asigna al enviar a firma)')
        self.stdout.write(f'  Creada por: {creador.get_full_name() or creador.email}')
        self.stdout.write('')
        self.stdout.write(
            '  Flujo: Admin crea documento desde esta plantilla → '
            'asigna firmantes → firma → publicar → '
            'se distribuye como lectura obligatoria.'
        )
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Seed Habeas Data completado.'))
