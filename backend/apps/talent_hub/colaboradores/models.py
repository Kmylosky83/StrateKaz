"""
Modelos de Colaboradores - Talent Hub

Gestión completa de empleados, hojas de vida, información personal e historial laboral.

Estructura:
- Colaborador: Registro principal del empleado
- HojaVida: CV y competencias del colaborador
- InfoPersonal: Datos personales sensibles
- HistorialLaboral: Movimientos y cambios en la vida laboral
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, RegexValidator
from django.core.exceptions import ValidationError
from decimal import Decimal

from apps.core.base_models import BaseCompanyModel, TimestampedModel


# =============================================================================
# OPCIONES Y CONSTANTES
# =============================================================================

TIPO_DOCUMENTO_CHOICES = [
    ('CC', 'Cédula de Ciudadanía'),
    ('CE', 'Cédula de Extranjería'),
    ('TI', 'Tarjeta de Identidad'),
    ('PA', 'Pasaporte'),
    ('PEP', 'Permiso Especial de Permanencia'),
    ('PPT', 'Permiso de Protección Temporal'),
]

ESTADO_COLABORADOR_CHOICES = [
    ('activo', 'Activo'),
    ('inactivo', 'Inactivo'),
    ('suspendido', 'Suspendido'),
    ('retirado', 'Retirado'),
]

TIPO_CONTRATO_CHOICES = [
    ('indefinido', 'Término Indefinido'),
    ('fijo', 'Término Fijo'),
    ('obra_labor', 'Obra o Labor'),
    ('aprendizaje', 'Aprendizaje'),
    ('prestacion_servicios', 'Prestación de Servicios'),
]

NIVEL_ESTUDIO_CHOICES = [
    ('primaria', 'Primaria'),
    ('bachillerato', 'Bachillerato'),
    ('tecnico', 'Técnico'),
    ('tecnologo', 'Tecnólogo'),
    ('profesional', 'Profesional'),
    ('especializacion', 'Especialización'),
    ('maestria', 'Maestría'),
    ('doctorado', 'Doctorado'),
]

NIVEL_IDIOMA_CHOICES = [
    ('basico', 'Básico'),
    ('intermedio', 'Intermedio'),
    ('avanzado', 'Avanzado'),
    ('nativo', 'Nativo'),
]

TIPO_MOVIMIENTO_CHOICES = [
    ('contratacion', 'Contratación'),
    ('ascenso', 'Ascenso'),
    ('traslado', 'Traslado'),
    ('cambio_salario', 'Cambio de Salario'),
    ('cambio_cargo', 'Cambio de Cargo'),
    ('cambio_contrato', 'Cambio de Contrato'),
    ('suspension', 'Suspensión'),
    ('reactivacion', 'Reactivación'),
    ('retiro', 'Retiro'),
]

TIPO_SANGRE_CHOICES = [
    ('O+', 'O+'),
    ('O-', 'O-'),
    ('A+', 'A+'),
    ('A-', 'A-'),
    ('B+', 'B+'),
    ('B-', 'B-'),
    ('AB+', 'AB+'),
    ('AB-', 'AB-'),
]

TIPO_BANCO_CHOICES = [
    ('bancolombia', 'Bancolombia'),
    ('banco_bogota', 'Banco de Bogotá'),
    ('davivienda', 'Davivienda'),
    ('bbva', 'BBVA'),
    ('banco_popular', 'Banco Popular'),
    ('banco_occidente', 'Banco de Occidente'),
    ('banco_caja_social', 'Banco Caja Social'),
    ('colpatria', 'Colpatria'),
    ('av_villas', 'AV Villas'),
    ('nequi', 'Nequi'),
    ('daviplata', 'Daviplata'),
    ('otro', 'Otro'),
]

TIPO_CUENTA_CHOICES = [
    ('ahorros', 'Ahorros'),
    ('corriente', 'Corriente'),
]


# =============================================================================
# COLABORADOR - Modelo Principal
# =============================================================================

class Colaborador(BaseCompanyModel):
    """
    Colaborador - Empleado activo de la empresa.

    Registro principal que centraliza toda la información laboral del empleado.

    Hereda de BaseCompanyModel:
    - empresa (FK a EmpresaConfig)
    - created_at, updated_at, created_by, updated_by
    - is_active, deleted_at, soft_delete(), restore()
    """

    # Identificación
    numero_identificacion = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Número de Identificación',
        help_text='Número de documento de identidad único',
        validators=[
            RegexValidator(
                regex=r'^[a-zA-Z0-9-]+$',
                message='Solo se permiten números, letras y guiones'
            )
        ]
    )
    tipo_documento = models.CharField(
        max_length=5,
        choices=TIPO_DOCUMENTO_CHOICES,
        default='CC',
        verbose_name='Tipo de Documento'
    )

    # Datos Básicos
    primer_nombre = models.CharField(
        max_length=50,
        verbose_name='Primer Nombre'
    )
    segundo_nombre = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Segundo Nombre'
    )
    primer_apellido = models.CharField(
        max_length=50,
        verbose_name='Primer Apellido'
    )
    segundo_apellido = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Segundo Apellido'
    )

    # Vinculación al Sistema
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='colaborador',
        verbose_name='Usuario del Sistema',
        help_text='Usuario del sistema vinculado (opcional)'
    )

    # Estructura Organizacional
    cargo = models.ForeignKey(
        'core.Cargo',
        on_delete=models.PROTECT,
        related_name='colaboradores',
        verbose_name='Cargo',
        help_text='Cargo que desempeña el colaborador'
    )
    area = models.ForeignKey(
        'organizacion.Area',
        on_delete=models.PROTECT,
        related_name='colaboradores',
        verbose_name='Área',
        help_text='Área a la que pertenece'
    )

    # Información Laboral
    fecha_ingreso = models.DateField(
        verbose_name='Fecha de Ingreso',
        db_index=True
    )
    fecha_retiro = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Retiro'
    )

    # Estado
    estado = models.CharField(
        max_length=15,
        choices=ESTADO_COLABORADOR_CHOICES,
        default='activo',
        db_index=True,
        verbose_name='Estado Laboral'
    )
    motivo_retiro = models.TextField(
        blank=True,
        verbose_name='Motivo de Retiro'
    )

    # Contratación
    tipo_contrato = models.CharField(
        max_length=25,
        choices=TIPO_CONTRATO_CHOICES,
        verbose_name='Tipo de Contrato'
    )
    fecha_fin_contrato = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Fin de Contrato',
        help_text='Solo para contratos a término fijo u obra/labor'
    )

    # Salario (información sensible)
    salario = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Salario Actual',
        help_text='Salario mensual en COP'
    )
    auxilio_transporte = models.BooleanField(
        default=True,
        verbose_name='Recibe Auxilio de Transporte'
    )

    # Jornada Laboral
    horas_semanales = models.PositiveIntegerField(
        default=48,
        verbose_name='Horas Semanales',
        help_text='Horas laborales por semana (default: 48)'
    )

    # Información de Contacto Rápida
    email_personal = models.EmailField(
        blank=True,
        verbose_name='Email Personal'
    )
    telefono_movil = models.CharField(
        max_length=15,
        blank=True,
        verbose_name='Teléfono Móvil'
    )

    # Foto
    foto = models.ImageField(
        upload_to='colaboradores/fotos/',
        null=True,
        blank=True,
        verbose_name='Foto del Colaborador'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones Generales'
    )

    class Meta:
        db_table = 'talent_hub_colaborador'
        verbose_name = 'Colaborador'
        verbose_name_plural = 'Colaboradores'
        ordering = ['-fecha_ingreso', 'primer_apellido', 'primer_nombre']
        indexes = [
            models.Index(fields=['numero_identificacion']),
            models.Index(fields=['estado']),
            models.Index(fields=['cargo']),
            models.Index(fields=['area']),
            models.Index(fields=['fecha_ingreso']),
            models.Index(fields=['empresa', 'estado']),
        ]

    def __str__(self):
        return f"{self.get_nombre_completo()} - {self.numero_identificacion}"

    def get_nombre_completo(self):
        """Retorna el nombre completo del colaborador."""
        nombres = [self.primer_nombre]
        if self.segundo_nombre:
            nombres.append(self.segundo_nombre)

        apellidos = [self.primer_apellido]
        if self.segundo_apellido:
            apellidos.append(self.segundo_apellido)

        return f"{' '.join(nombres)} {' '.join(apellidos)}"

    def get_nombre_corto(self):
        """Retorna nombre corto (primer nombre + primer apellido)."""
        return f"{self.primer_nombre} {self.primer_apellido}"

    @property
    def antiguedad_dias(self):
        """Calcula la antigüedad en días."""
        from django.utils import timezone
        fecha_fin = self.fecha_retiro or timezone.now().date()
        return (fecha_fin - self.fecha_ingreso).days

    @property
    def antiguedad_anios(self):
        """Calcula la antigüedad en años."""
        return self.antiguedad_dias / 365.25

    @property
    def esta_activo(self):
        """Verifica si el colaborador está en estado activo."""
        return self.estado == 'activo'

    @property
    def tiene_contrato_vigente(self):
        """Verifica si el contrato está vigente."""
        from django.utils import timezone
        if self.tipo_contrato in ['indefinido', 'prestacion_servicios']:
            return self.esta_activo
        if self.fecha_fin_contrato:
            return self.fecha_fin_contrato >= timezone.now().date()
        return True

    def clean(self):
        """Validaciones del modelo."""
        from django.utils import timezone

        # Validar fechas
        if self.fecha_retiro and self.fecha_ingreso:
            if self.fecha_retiro < self.fecha_ingreso:
                raise ValidationError({
                    'fecha_retiro': 'La fecha de retiro no puede ser anterior a la fecha de ingreso.'
                })

        # Si está retirado, debe tener fecha de retiro
        if self.estado == 'retirado' and not self.fecha_retiro:
            raise ValidationError({
                'fecha_retiro': 'Debe especificar la fecha de retiro para colaboradores retirados.'
            })

        # Contratos a término fijo deben tener fecha fin
        if self.tipo_contrato == 'fijo' and not self.fecha_fin_contrato:
            raise ValidationError({
                'fecha_fin_contrato': 'Los contratos a término fijo deben tener fecha de finalización.'
            })

        # Validar que área y cargo pertenezcan a la misma empresa
        if self.cargo and self.empresa:
            # Nota: Cargo debe tener empresa (asumir estructura futura)
            pass


# =============================================================================
# HOJA DE VIDA - Información del CV
# =============================================================================

class HojaVida(BaseCompanyModel):
    """
    Hoja de Vida - Curriculum Vitae del colaborador.

    Información académica, experiencia previa, certificaciones, idiomas y habilidades.
    """

    colaborador = models.OneToOneField(
        Colaborador,
        on_delete=models.CASCADE,
        related_name='hoja_vida',
        verbose_name='Colaborador'
    )

    # Educación
    nivel_estudio_maximo = models.CharField(
        max_length=20,
        choices=NIVEL_ESTUDIO_CHOICES,
        blank=True,
        verbose_name='Nivel de Estudio Máximo'
    )
    titulo_academico = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Título Académico'
    )
    institucion = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Institución Educativa'
    )
    anio_graduacion = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Año de Graduación'
    )

    # Estudios Adicionales (JSON)
    estudios_adicionales = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Estudios Adicionales',
        help_text='Lista de estudios complementarios en formato JSON'
    )

    # Certificaciones (JSON)
    certificaciones = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Certificaciones',
        help_text='Lista de certificaciones en formato JSON'
    )

    # Experiencia Laboral Previa (JSON)
    experiencia_previa = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Experiencia Laboral Previa',
        help_text='Lista de empleos anteriores en formato JSON'
    )

    # Idiomas (JSON)
    idiomas = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Idiomas',
        help_text='Lista de idiomas con nivel en formato JSON. Ejemplo: [{"idioma": "Inglés", "nivel": "intermedio"}]'
    )

    # Habilidades y Competencias
    habilidades = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Habilidades Técnicas',
        help_text='Lista de habilidades técnicas'
    )
    competencias_blandas = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Competencias Blandas',
        help_text='Lista de competencias blandas (liderazgo, trabajo en equipo, etc.)'
    )

    # Referencias Laborales (JSON)
    referencias_laborales = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Referencias Laborales',
        help_text='Lista de referencias laborales en formato JSON'
    )

    # Archivos adjuntos
    cv_documento = models.FileField(
        upload_to='colaboradores/cv/',
        null=True,
        blank=True,
        verbose_name='CV en PDF'
    )
    certificados_estudios = models.FileField(
        upload_to='colaboradores/certificados/',
        null=True,
        blank=True,
        verbose_name='Certificados de Estudios'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones de la Hoja de Vida'
    )

    class Meta:
        db_table = 'talent_hub_hoja_vida'
        verbose_name = 'Hoja de Vida'
        verbose_name_plural = 'Hojas de Vida'

    def __str__(self):
        return f"Hoja de Vida - {self.colaborador.get_nombre_completo()}"

    @property
    def total_anios_experiencia(self):
        """Calcula el total de años de experiencia previa."""
        total_meses = 0
        for exp in self.experiencia_previa:
            if 'meses_duracion' in exp:
                total_meses += exp['meses_duracion']
        return round(total_meses / 12, 1)

    @property
    def tiene_formacion_completa(self):
        """Verifica si tiene formación académica completa registrada."""
        return bool(
            self.nivel_estudio_maximo and
            self.titulo_academico and
            self.institucion
        )


# =============================================================================
# INFORMACIÓN PERSONAL - Datos Sensibles
# =============================================================================

class InfoPersonal(BaseCompanyModel):
    """
    Información Personal - Datos sensibles del colaborador.

    Dirección, contacto de emergencia, datos bancarios, salud, etc.
    Debe tener permisos especiales para acceder.
    """

    colaborador = models.OneToOneField(
        Colaborador,
        on_delete=models.CASCADE,
        related_name='info_personal',
        verbose_name='Colaborador'
    )

    # Datos Personales
    fecha_nacimiento = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Nacimiento'
    )
    genero = models.CharField(
        max_length=10,
        choices=[
            ('M', 'Masculino'),
            ('F', 'Femenino'),
            ('O', 'Otro'),
            ('N', 'Prefiere no decir'),
        ],
        blank=True,
        verbose_name='Género'
    )
    estado_civil = models.CharField(
        max_length=15,
        choices=[
            ('soltero', 'Soltero/a'),
            ('casado', 'Casado/a'),
            ('union_libre', 'Unión Libre'),
            ('divorciado', 'Divorciado/a'),
            ('viudo', 'Viudo/a'),
        ],
        blank=True,
        verbose_name='Estado Civil'
    )

    # Dirección de Residencia
    direccion = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Dirección de Residencia'
    )
    ciudad = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Ciudad'
    )
    departamento = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Departamento'
    )

    # Contacto
    telefono_fijo = models.CharField(
        max_length=15,
        blank=True,
        verbose_name='Teléfono Fijo'
    )

    # Contacto de Emergencia
    nombre_contacto_emergencia = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Nombre Contacto de Emergencia'
    )
    parentesco_contacto_emergencia = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Parentesco'
    )
    telefono_contacto_emergencia = models.CharField(
        max_length=15,
        blank=True,
        verbose_name='Teléfono de Emergencia'
    )

    # Datos Bancarios para Nómina
    banco = models.CharField(
        max_length=30,
        choices=TIPO_BANCO_CHOICES,
        blank=True,
        verbose_name='Banco'
    )
    tipo_cuenta = models.CharField(
        max_length=10,
        choices=TIPO_CUENTA_CHOICES,
        blank=True,
        verbose_name='Tipo de Cuenta'
    )
    numero_cuenta = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Número de Cuenta',
        help_text='Información sensible - encriptar en producción'
    )

    # Información de Salud Básica
    tipo_sangre = models.CharField(
        max_length=5,
        choices=TIPO_SANGRE_CHOICES,
        blank=True,
        verbose_name='Tipo de Sangre'
    )
    alergias = models.TextField(
        blank=True,
        verbose_name='Alergias Conocidas'
    )
    medicamentos_permanentes = models.TextField(
        blank=True,
        verbose_name='Medicamentos de Uso Permanente'
    )
    condiciones_medicas = models.TextField(
        blank=True,
        verbose_name='Condiciones Médicas Relevantes'
    )
    eps = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='EPS'
    )
    arl = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='ARL'
    )
    fondo_pensiones = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Fondo de Pensiones'
    )
    caja_compensacion = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Caja de Compensación'
    )

    # Tallas de Uniformes y EPP
    talla_camisa = models.CharField(
        max_length=10,
        blank=True,
        verbose_name='Talla Camisa/Camiseta'
    )
    talla_pantalon = models.CharField(
        max_length=10,
        blank=True,
        verbose_name='Talla Pantalón'
    )
    talla_zapatos = models.CharField(
        max_length=10,
        blank=True,
        verbose_name='Talla Zapatos'
    )
    talla_overol = models.CharField(
        max_length=10,
        blank=True,
        verbose_name='Talla Overol'
    )

    # Número de Hijos (para prestaciones)
    numero_hijos = models.PositiveIntegerField(
        default=0,
        verbose_name='Número de Hijos'
    )
    personas_a_cargo = models.PositiveIntegerField(
        default=0,
        verbose_name='Personas a Cargo'
    )

    class Meta:
        db_table = 'talent_hub_info_personal'
        verbose_name = 'Información Personal'
        verbose_name_plural = 'Información Personal'

    def __str__(self):
        return f"Info Personal - {self.colaborador.get_nombre_completo()}"

    @property
    def edad(self):
        """Calcula la edad actual del colaborador."""
        if not self.fecha_nacimiento:
            return None
        from django.utils import timezone
        today = timezone.now().date()
        return today.year - self.fecha_nacimiento.year - (
            (today.month, today.day) < (self.fecha_nacimiento.month, self.fecha_nacimiento.day)
        )

    @property
    def tiene_datos_bancarios(self):
        """Verifica si tiene datos bancarios completos."""
        return bool(self.banco and self.tipo_cuenta and self.numero_cuenta)

    @property
    def tiene_contacto_emergencia(self):
        """Verifica si tiene contacto de emergencia registrado."""
        return bool(
            self.nombre_contacto_emergencia and
            self.telefono_contacto_emergencia
        )


# =============================================================================
# HISTORIAL LABORAL - Movimientos y Cambios
# =============================================================================

class HistorialLaboral(BaseCompanyModel):
    """
    Historial Laboral - Registro de movimientos en la vida laboral del colaborador.

    Ascensos, traslados, cambios salariales, suspensiones, reactivaciones, etc.
    """

    colaborador = models.ForeignKey(
        Colaborador,
        on_delete=models.CASCADE,
        related_name='historial_laboral',
        verbose_name='Colaborador'
    )

    # Tipo de Movimiento
    tipo_movimiento = models.CharField(
        max_length=20,
        choices=TIPO_MOVIMIENTO_CHOICES,
        db_index=True,
        verbose_name='Tipo de Movimiento'
    )
    fecha_movimiento = models.DateField(
        db_index=True,
        verbose_name='Fecha del Movimiento'
    )
    fecha_efectiva = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Efectiva',
        help_text='Fecha en que el cambio entra en vigencia (si es diferente)'
    )

    # Cambios Específicos
    cargo_anterior = models.ForeignKey(
        'core.Cargo',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='historial_cargo_anterior',
        verbose_name='Cargo Anterior'
    )
    cargo_nuevo = models.ForeignKey(
        'core.Cargo',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='historial_cargo_nuevo',
        verbose_name='Cargo Nuevo'
    )

    area_anterior = models.ForeignKey(
        'organizacion.Area',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='historial_area_anterior',
        verbose_name='Área Anterior'
    )
    area_nueva = models.ForeignKey(
        'organizacion.Area',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='historial_area_nueva',
        verbose_name='Área Nueva'
    )

    salario_anterior = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Salario Anterior'
    )
    salario_nuevo = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Salario Nuevo'
    )

    # Detalles
    motivo = models.TextField(
        verbose_name='Motivo del Movimiento'
    )
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    # Soporte
    documento_soporte = models.FileField(
        upload_to='colaboradores/historial/',
        null=True,
        blank=True,
        verbose_name='Documento de Soporte',
        help_text='Carta de ascenso, memorando, etc.'
    )

    # Aprobación
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='historial_aprobado',
        verbose_name='Aprobado Por'
    )
    fecha_aprobacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Aprobación'
    )

    class Meta:
        db_table = 'talent_hub_historial_laboral'
        verbose_name = 'Historial Laboral'
        verbose_name_plural = 'Historial Laboral'
        ordering = ['-fecha_movimiento', '-created_at']
        indexes = [
            models.Index(fields=['colaborador', 'tipo_movimiento']),
            models.Index(fields=['fecha_movimiento']),
            models.Index(fields=['tipo_movimiento']),
        ]

    def __str__(self):
        return f"{self.colaborador.get_nombre_corto()} - {self.get_tipo_movimiento_display()} ({self.fecha_movimiento})"

    @property
    def incremento_salarial(self):
        """Calcula el incremento salarial (si aplica)."""
        if self.salario_anterior and self.salario_nuevo:
            incremento = self.salario_nuevo - self.salario_anterior
            porcentaje = (incremento / self.salario_anterior) * 100
            return {
                'valor': incremento,
                'porcentaje': round(porcentaje, 2)
            }
        return None

    @property
    def es_ascenso(self):
        """Verifica si es un movimiento de ascenso."""
        return self.tipo_movimiento == 'ascenso'

    @property
    def es_retiro(self):
        """Verifica si es un movimiento de retiro."""
        return self.tipo_movimiento == 'retiro'

    def clean(self):
        """Validaciones del modelo."""
        # Validar que cambios de cargo tengan cargo anterior y nuevo
        if self.tipo_movimiento in ['ascenso', 'cambio_cargo']:
            if not self.cargo_anterior or not self.cargo_nuevo:
                raise ValidationError({
                    'tipo_movimiento': 'Los cambios de cargo deben especificar cargo anterior y nuevo.'
                })

        # Validar que traslados tengan área anterior y nueva
        if self.tipo_movimiento == 'traslado':
            if not self.area_anterior or not self.area_nueva:
                raise ValidationError({
                    'tipo_movimiento': 'Los traslados deben especificar área anterior y nueva.'
                })

        # Validar que cambios salariales tengan salarios
        if self.tipo_movimiento == 'cambio_salario':
            if not self.salario_anterior or not self.salario_nuevo:
                raise ValidationError({
                    'tipo_movimiento': 'Los cambios salariales deben especificar salario anterior y nuevo.'
                })
