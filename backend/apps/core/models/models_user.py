"""
Modelos de Usuario y Cargo - StrateKaz

User: Modelo de usuario personalizado
Cargo: Puestos de trabajo con manual de funciones
RiesgoOcupacional: Catálogo de riesgos para SST
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError


class Cargo(models.Model):
    """
    Modelo de Cargo - Define puestos de trabajo con manual de funciones completo

    Sistema dinámico que incluye:
    - Identificación: código, nombre, descripción
    - Ubicación organizacional: área (FK), reporta_a, nivel jerárquico
    - Configuración: cantidad posiciones, jefatura, requisitos especiales
    - Manual de funciones: objetivo, funciones, autoridad
    - Requisitos: educación, experiencia, competencias técnicas y blandas
    - SST: riesgos, EPP, exámenes médicos, restricciones
    - Permisos: rol del sistema asociado
    - Auditoría: versión, aprobación, creado por
    """

    # ==========================================================================
    # CHOICES
    # ==========================================================================
    LEVEL_CHOICES = [
        (0, 'Operativo'),
        (1, 'Supervisión'),
        (2, 'Coordinación'),
        (3, 'Dirección'),
    ]

    NIVEL_JERARQUICO_CHOICES = [
        ('ESTRATEGICO', 'Estratégico'),
        ('TACTICO', 'Táctico'),
        ('OPERATIVO', 'Operativo'),
        ('APOYO', 'Apoyo'),
        ('EXTERNO', 'Externo'),  # Contratistas, consultores, auditores
    ]

    NIVEL_EDUCATIVO_CHOICES = [
        ('PRIMARIA', 'Primaria'),
        ('BACHILLER', 'Bachiller'),
        ('TECNICO', 'Técnico'),
        ('TECNOLOGO', 'Tecnólogo'),
        ('PROFESIONAL', 'Profesional'),
        ('ESPECIALIZACION', 'Especialización'),
        ('MAESTRIA', 'Maestría'),
        ('DOCTORADO', 'Doctorado'),
    ]

    EXPERIENCIA_CHOICES = [
        ('SIN_EXPERIENCIA', 'Sin experiencia'),
        ('6_MESES', '6 meses'),
        ('1_ANO', '1 año'),
        ('2_ANOS', '2 años'),
        ('3_ANOS', '3 años'),
        ('5_ANOS', '5 años'),
        ('10_ANOS', '10+ años'),
    ]

    # ==========================================================================
    # TAB 1: IDENTIFICACIÓN
    # ==========================================================================
    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del cargo (ej: RECOLECTOR, SUPERVISOR)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del cargo'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción general del cargo'
    )

    # ==========================================================================
    # TAB 1: UBICACIÓN ORGANIZACIONAL
    # ==========================================================================
    area = models.ForeignKey(
        'organizacion.Area',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cargos',
        db_index=True,
        verbose_name='Área',
        help_text='Área/departamento al que pertenece el cargo'
    )
    parent_cargo = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subordinados',
        verbose_name='Reporta a',
        help_text='Cargo al que reporta (supervisor directo)'
    )
    level = models.IntegerField(
        choices=LEVEL_CHOICES,
        default=0,
        verbose_name='Nivel (legacy)',
        help_text='Nivel jerárquico legacy (0=Operativo, 3=Dirección)'
    )
    nivel_jerarquico = models.CharField(
        max_length=20,
        choices=NIVEL_JERARQUICO_CHOICES,
        default='OPERATIVO',
        db_index=True,
        verbose_name='Nivel Jerárquico',
        help_text='Clasificación estratégica del cargo'
    )

    # ==========================================================================
    # TAB 1: CONFIGURACIÓN DEL CARGO
    # ==========================================================================
    cantidad_posiciones = models.PositiveIntegerField(
        default=1,
        verbose_name='Cantidad de Posiciones',
        help_text='Número de personas que pueden ocupar este cargo'
    )
    is_jefatura = models.BooleanField(
        default=False,
        verbose_name='Es Jefatura',
        help_text='Indica si el cargo tiene personal a cargo'
    )
    is_externo = models.BooleanField(
        default=False,
        verbose_name='Es Externo',
        help_text='Indica si es un cargo externo (contratista, consultor, auditor, socio)'
    )
    requiere_licencia_conduccion = models.BooleanField(
        default=False,
        verbose_name='Requiere Licencia de Conducción',
        help_text='Si el cargo requiere licencia para operar vehículos'
    )
    categoria_licencia = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Categoría de Licencia',
        help_text='Categoría requerida (ej: B1, C1, C2, C3)'
    )
    requiere_licencia_sst = models.BooleanField(
        default=False,
        verbose_name='Requiere Licencia SST',
        help_text='Si el cargo requiere Licencia en Seguridad y Salud en el Trabajo'
    )
    requiere_tarjeta_contador = models.BooleanField(
        default=False,
        verbose_name='Requiere Tarjeta Profesional Contador',
        help_text='Si el cargo requiere Tarjeta Profesional de Contador Público'
    )
    requiere_tarjeta_abogado = models.BooleanField(
        default=False,
        verbose_name='Requiere Tarjeta Profesional Abogado',
        help_text='Si el cargo requiere Tarjeta Profesional de Abogado'
    )

    # ==========================================================================
    # TAB 2: MANUAL DE FUNCIONES
    # ==========================================================================
    objetivo_cargo = models.TextField(
        blank=True,
        null=True,
        verbose_name='Objetivo del Cargo',
        help_text='Objetivo principal y propósito del cargo en la organización'
    )
    funciones_responsabilidades = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Funciones y Responsabilidades',
        help_text='Lista de funciones principales del cargo (JSON array)'
    )
    autoridad_autonomia = models.TextField(
        blank=True,
        null=True,
        verbose_name='Autoridad y Autonomía',
        help_text='Nivel de autoridad y decisiones que puede tomar'
    )
    relaciones_internas = models.TextField(
        blank=True,
        null=True,
        verbose_name='Relaciones Internas',
        help_text='Áreas/cargos con los que interactúa internamente'
    )
    relaciones_externas = models.TextField(
        blank=True,
        null=True,
        verbose_name='Relaciones Externas',
        help_text='Entidades externas con las que interactúa'
    )

    # ==========================================================================
    # TAB 3: REQUISITOS
    # ==========================================================================
    nivel_educativo = models.CharField(
        max_length=20,
        choices=NIVEL_EDUCATIVO_CHOICES,
        blank=True,
        null=True,
        verbose_name='Nivel Educativo Mínimo',
        help_text='Nivel de formación académica requerido'
    )
    titulo_requerido = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Título Requerido',
        help_text='Título profesional o técnico específico requerido'
    )
    experiencia_requerida = models.CharField(
        max_length=20,
        choices=EXPERIENCIA_CHOICES,
        blank=True,
        null=True,
        verbose_name='Experiencia Requerida',
        help_text='Tiempo mínimo de experiencia laboral'
    )
    experiencia_especifica = models.TextField(
        blank=True,
        null=True,
        verbose_name='Experiencia Específica',
        help_text='Descripción de experiencia específica requerida'
    )
    competencias_tecnicas = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Competencias Técnicas',
        help_text='Lista de competencias técnicas requeridas (JSON array)'
    )
    competencias_blandas = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Competencias Blandas',
        help_text='Lista de habilidades interpersonales requeridas (JSON array)'
    )
    licencias_certificaciones = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Licencias y Certificaciones',
        help_text='Certificaciones profesionales requeridas (JSON array)'
    )
    formacion_complementaria = models.TextField(
        blank=True,
        null=True,
        verbose_name='Formación Complementaria',
        help_text='Cursos o capacitaciones adicionales deseables'
    )

    # ==========================================================================
    # TAB 4: SST - SEGURIDAD Y SALUD EN EL TRABAJO
    # ==========================================================================
    expuesto_riesgos = models.ManyToManyField(
        'RiesgoOcupacional',
        blank=True,
        related_name='cargos_expuestos',
        verbose_name='Riesgos Ocupacionales',
        help_text='Riesgos a los que está expuesto el cargo'
    )
    epp_requeridos = models.JSONField(
        default=list,
        blank=True,
        verbose_name='EPP Requeridos',
        help_text='Elementos de Protección Personal requeridos (JSON array)'
    )
    examenes_medicos = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Exámenes Médicos',
        help_text='Exámenes médicos ocupacionales requeridos (JSON array)'
    )
    restricciones_medicas = models.TextField(
        blank=True,
        null=True,
        verbose_name='Restricciones Médicas',
        help_text='Condiciones médicas que impiden ejercer el cargo'
    )
    capacitaciones_sst = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Capacitaciones SST',
        help_text='Capacitaciones de SST requeridas (JSON array)'
    )

    # ==========================================================================
    # TAB 5: HORARIOS Y TURNOS
    # ==========================================================================
    TURNO_TRABAJO_CHOICES = [
        ('DIURNO', 'Diurno'),
        ('NOCTURNO', 'Nocturno'),
        ('MIXTO', 'Mixto'),
        ('ROTATIVO', 'Rotativo'),
        ('FLEXIBLE', 'Flexible'),
    ]

    turno_trabajo = models.CharField(
        max_length=20,
        choices=TURNO_TRABAJO_CHOICES,
        default='DIURNO',
        blank=True,
        verbose_name='Turno de Trabajo',
        help_text='Tipo de turno asignado al cargo'
    )
    horario_entrada = models.TimeField(
        null=True,
        blank=True,
        verbose_name='Horario de Entrada',
        help_text='Hora de inicio de jornada (ej: 07:00)'
    )
    horario_salida = models.TimeField(
        null=True,
        blank=True,
        verbose_name='Horario de Salida',
        help_text='Hora de fin de jornada (ej: 17:00)'
    )
    dias_laborales = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Días Laborales',
        help_text='Días de la semana laborables (ej: ["LUN","MAR","MIE","JUE","VIE"])'
    )

    # ==========================================================================
    # TAB 6: PERMISOS DEL SISTEMA
    # ==========================================================================
    rol_sistema = models.ForeignKey(
        'core.Role',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cargos_asignados',
        verbose_name='Rol del Sistema',
        help_text='Rol de permisos asignado por defecto al cargo'
    )

    # ==========================================================================
    # CAMPOS DE CONTROL
    # ==========================================================================
    is_system = models.BooleanField(
        default=False,
        verbose_name='Es del sistema',
        help_text='Los cargos del sistema no pueden eliminarse'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
        help_text='Si el cargo está activo en el sistema'
    )
    version = models.PositiveIntegerField(
        default=1,
        verbose_name='Versión',
        help_text='Versión del documento de cargo'
    )
    fecha_aprobacion = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de Aprobación',
        help_text='Fecha en que se aprobó el manual de funciones'
    )
    aprobado_por = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cargos_aprobados',
        verbose_name='Aprobado por'
    )
    created_by = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cargos_creados',
        verbose_name='Creado por'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )

    class Meta:
        db_table = 'core_cargo'
        verbose_name = 'Cargo'
        verbose_name_plural = 'Cargos'
        ordering = ['nivel_jerarquico', 'name']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active', 'nivel_jerarquico']),
            models.Index(fields=['area']),
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"

    def clean(self):
        """Validaciones personalizadas"""
        # Validar que el cargo padre tenga nivel superior o igual
        if self.parent_cargo:
            niveles_orden = {'ESTRATEGICO': 3, 'TACTICO': 2, 'OPERATIVO': 1, 'APOYO': 0}
            nivel_padre = niveles_orden.get(self.parent_cargo.nivel_jerarquico, 0)
            nivel_actual = niveles_orden.get(self.nivel_jerarquico, 0)
            if nivel_padre < nivel_actual:
                raise ValidationError(
                    'El cargo superior debe tener un nivel jerárquico igual o mayor'
                )

    def get_subordinados_recursivos(self):
        """Obtiene todos los subordinados de forma recursiva"""
        subordinados = list(self.subordinados.all())
        for subordinado in list(subordinados):
            subordinados.extend(subordinado.get_subordinados_recursivos())
        return subordinados

    @property
    def usuarios_asignados_count(self):
        """Cuenta usuarios asignados a este cargo (excluye superusuarios)"""
        return self.usuarios.filter(
            is_active=True, deleted_at__isnull=True
        ).exclude(is_superuser=True).count()

    @property
    def posiciones_disponibles(self):
        """Calcula posiciones disponibles"""
        return max(0, self.cantidad_posiciones - self.usuarios_asignados_count)

    @property
    def area_nombre(self):
        """Retorna nombre del área o None"""
        return self.area.name if self.area else None

    def incrementar_version(self):
        """Incrementa la versión del cargo al modificar el manual"""
        self.version += 1
        self.save(update_fields=['version', 'updated_at'])


# =============================================================================
# RIESGO OCUPACIONAL - Para integración SST en Cargos
# =============================================================================

class RiesgoOcupacional(models.Model):
    """
    Catálogo de Riesgos Ocupacionales basado en GTC 45

    Clasificación según metodología GTC 45 para identificación de peligros
    y valoración de riesgos en seguridad y salud en el trabajo.
    """

    CLASIFICACION_CHOICES = [
        ('BIOLOGICO', 'Biológico'),
        ('FISICO', 'Físico'),
        ('QUIMICO', 'Químico'),
        ('PSICOSOCIAL', 'Psicosocial'),
        ('BIOMECANICO', 'Biomecánico'),
        ('CONDICIONES_SEGURIDAD', 'Condiciones de Seguridad'),
        ('FENOMENOS_NATURALES', 'Fenómenos Naturales'),
    ]

    NIVEL_RIESGO_CHOICES = [
        ('I', 'I - No Aceptable'),
        ('II', 'II - No Aceptable o Aceptable con Control'),
        ('III', 'III - Mejorable'),
        ('IV', 'IV - Aceptable'),
    ]

    code = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del riesgo (ej: BIO-001, FIS-002)'
    )
    name = models.CharField(
        max_length=150,
        verbose_name='Nombre del Peligro',
        help_text='Descripción del peligro identificado'
    )
    clasificacion = models.CharField(
        max_length=25,
        choices=CLASIFICACION_CHOICES,
        db_index=True,
        verbose_name='Clasificación',
        help_text='Tipo de peligro según GTC 45'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción detallada del riesgo'
    )
    fuente = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Fuente',
        help_text='Origen o fuente del peligro'
    )
    efectos_posibles = models.TextField(
        blank=True,
        null=True,
        verbose_name='Efectos Posibles',
        help_text='Consecuencias potenciales para la salud'
    )
    nivel_riesgo = models.CharField(
        max_length=5,
        choices=NIVEL_RIESGO_CHOICES,
        default='III',
        verbose_name='Nivel de Riesgo',
        help_text='Nivel de riesgo según valoración GTC 45'
    )
    controles_existentes = models.TextField(
        blank=True,
        null=True,
        verbose_name='Controles Existentes',
        help_text='Medidas de control implementadas'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'core_riesgo_ocupacional'
        verbose_name = 'Riesgo Ocupacional'
        verbose_name_plural = 'Riesgos Ocupacionales'
        ordering = ['clasificacion', 'name']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['clasificacion', 'is_active']),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"


class User(AbstractUser):
    """
    Modelo de Usuario personalizado
    Extiende AbstractUser de Django con campos adicionales

    Incluye:
    - Datos de identificación: documento, teléfono
    - Datos laborales: cargo, sede, tipo contrato, fecha ingreso
    - Control: creación, eliminación lógica
    """

    DOCUMENT_TYPE_CHOICES = [
        ('CC', 'Cédula de Ciudadanía'),
        ('CE', 'Cédula de Extranjería'),
        ('NIT', 'NIT'),
        ('PA', 'Pasaporte'),
        ('TI', 'Tarjeta de Identidad'),
    ]

    TIPO_CONTRATO_CHOICES = [
        ('INDEFINIDO', 'Término Indefinido'),
        ('FIJO', 'Término Fijo'),
        ('OBRA_LABOR', 'Obra o Labor'),
        ('PRESTACION_SERVICIOS', 'Prestación de Servicios'),
        ('APRENDIZAJE', 'Aprendizaje'),
        ('TEMPORAL', 'Temporal'),
    ]

    ESTADO_EMPLEADO_CHOICES = [
        ('ACTIVO', 'Activo'),
        ('VACACIONES', 'Vacaciones'),
        ('INCAPACIDAD', 'Incapacidad'),
        ('LICENCIA', 'Licencia'),
        ('SUSPENDIDO', 'Suspendido'),
        ('RETIRADO', 'Retirado'),
    ]

    # ==========================================================================
    # DATOS DE IDENTIFICACIÓN
    # ==========================================================================
    document_type = models.CharField(
        max_length=3,
        choices=DOCUMENT_TYPE_CHOICES,
        default='CC',
        verbose_name='Tipo de documento'
    )
    document_number = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Número de documento',
        help_text='Número de identificación único'
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Teléfono',
        help_text='Número de teléfono de contacto'
    )
    phone_emergency = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Teléfono de Emergencia',
        help_text='Contacto en caso de emergencia'
    )
    address = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Dirección',
        help_text='Dirección de residencia'
    )
    birth_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de Nacimiento'
    )

    # ==========================================================================
    # DATOS LABORALES
    # ==========================================================================
    cargo = models.ForeignKey(
        Cargo,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='usuarios',
        verbose_name='Cargo',
        help_text='Cargo del usuario en la organización'
    )
    sede_asignada = models.ForeignKey(
        'configuracion.SedeEmpresa',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='usuarios',
        verbose_name='Sede Asignada',
        help_text='Ubicación física de trabajo'
    )
    fecha_ingreso = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de Ingreso',
        help_text='Fecha de inicio de labores'
    )
    fecha_retiro = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de Retiro',
        help_text='Fecha de terminación del contrato'
    )
    tipo_contrato = models.CharField(
        max_length=25,
        choices=TIPO_CONTRATO_CHOICES,
        blank=True,
        null=True,
        verbose_name='Tipo de Contrato',
        help_text='Modalidad de contratación'
    )
    estado_empleado = models.CharField(
        max_length=15,
        choices=ESTADO_EMPLEADO_CHOICES,
        default='ACTIVO',
        db_index=True,
        verbose_name='Estado del Empleado',
        help_text='Estado laboral actual'
    )
    salario_base = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Salario Base',
        help_text='Salario mensual base'
    )
    numero_cuenta = models.CharField(
        max_length=30,
        blank=True,
        null=True,
        verbose_name='Número de Cuenta',
        help_text='Cuenta bancaria para nómina'
    )
    banco = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Banco',
        help_text='Entidad bancaria'
    )

    # ==========================================================================
    # DATOS SST
    # ==========================================================================
    eps = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='EPS',
        help_text='Entidad Promotora de Salud'
    )
    arl = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='ARL',
        help_text='Administradora de Riesgos Laborales'
    )
    fondo_pensiones = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Fondo de Pensiones'
    )
    caja_compensacion = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Caja de Compensación'
    )
    tipo_sangre = models.CharField(
        max_length=5,
        blank=True,
        null=True,
        verbose_name='Tipo de Sangre',
        help_text='Grupo sanguíneo y RH (ej: O+, A-, AB+)'
    )

    # ==========================================================================
    # FOTO DE PERFIL
    # ==========================================================================
    photo = models.ImageField(
        upload_to='usuarios/fotos/',
        blank=True,
        null=True,
        verbose_name='Foto de Perfil',
        help_text='Foto del usuario para el organigrama y perfil'
    )

    # ==========================================================================
    # CAMPOS DE CONTROL
    # ==========================================================================
    created_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='usuarios_creados',
        verbose_name='Creado por',
        help_text='Usuario que creó este registro'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de eliminación',
        help_text='Fecha de eliminación lógica (soft delete)'
    )

    # ==========================================================================
    # PASSWORD SETUP (para usuarios creados desde Talent Hub sin contraseña)
    # ==========================================================================
    PASSWORD_SETUP_EXPIRY_HOURS = 168  # 7 días

    password_setup_token = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        verbose_name='Token de configuración de contraseña',
        help_text='Token único para configurar contraseña inicial'
    )
    password_setup_expires = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Expiración token contraseña',
        help_text='Fecha de expiración del token de configuración'
    )

    # ==========================================================================
    # PROVEEDOR VINCULADO (para usuarios externos: consultores, auditores)
    # ==========================================================================
    proveedor = models.ForeignKey(
        'gestion_proveedores.Proveedor',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='usuarios_vinculados',
        verbose_name='Proveedor vinculado',
        help_text='Solo para usuarios externos (consultores, auditores, proveedores de servicios)',
    )

    # ==========================================================================
    # CLIENTE VINCULADO (para usuarios del portal de clientes)
    # ==========================================================================
    cliente = models.ForeignKey(
        'gestion_clientes.Cliente',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='usuarios_vinculados',
        verbose_name='Cliente vinculado',
        help_text='Solo para usuarios del portal de clientes',
    )

    # ==========================================================================
    # RBAC HÍBRIDO - ROLES ADICIONALES
    # ==========================================================================
    roles_adicionales = models.ManyToManyField(
        'core.RolAdicional',
        through='UserRolAdicional',
        through_fields=('user', 'rol_adicional'),
        related_name='users',
        blank=True,
        verbose_name='Roles Adicionales',
        help_text='Roles especiales asignados además del cargo base (COPASST, Brigadista, etc.)'
    )

    class Meta:
        db_table = 'core_user'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-date_joined']
        indexes = [
            models.Index(fields=['document_number']),
            models.Index(fields=['cargo', 'is_active']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        if self.get_full_name():
            return f"{self.get_full_name()} ({self.username})"
        return self.username

    @property
    def cargo_code(self):
        """Retorna el código del cargo del usuario"""
        return self.cargo.code if self.cargo else None

    @property
    def cargo_level(self):
        """Retorna el nivel jerárquico del usuario"""
        return self.cargo.level if self.cargo else None

    @property
    def is_deleted(self):
        """Verifica si el usuario está eliminado lógicamente"""
        return self.deleted_at is not None

    def has_permission(self, permission_code):
        """
        Verifica si el usuario tiene un permiso específico

        Jerarquía de verificación (RBAC Híbrido):
        1. Superusuario -> todos los permisos
        2. Cargo -> permisos del cargo (posición organizacional)
        3. Roles adicionales -> permisos de roles transversales (COPASST, Brigadista, etc.)
        4. Roles directos -> permisos de roles asignados al usuario
        5. Grupos -> permisos de roles asignados a grupos del usuario

        Args:
            permission_code (str): Código del permiso a verificar

        Returns:
            bool: True si tiene el permiso, False en caso contrario
        """
        # Si es superusuario, tiene todos los permisos
        if self.is_superuser:
            return True

        # Si no está activo o está eliminado, no tiene permisos
        if not self.is_active or self.is_deleted:
            return False

        # 1. Verificar permisos a través del cargo
        if self.cargo:
            if self.cargo.permisos.filter(
                code=permission_code,
                is_active=True
            ).exists():
                return True

        # 2. Verificar permisos a través de roles adicionales (RBAC Híbrido)
        from django.db.models import Q
        roles_adicionales_activos = self.usuarios_roles_adicionales.filter(
            is_active=True,
            rol_adicional__is_active=True
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        )

        for asignacion in roles_adicionales_activos:
            if asignacion.rol_adicional.permisos.filter(
                code=permission_code,
                is_active=True
            ).exists():
                return True

        # 3. Verificar permisos a través de roles directos
        user_roles = self.user_roles.filter(
            role__is_active=True
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        )

        for user_role in user_roles:
            if user_role.role.permisos.filter(
                code=permission_code,
                is_active=True
            ).exists():
                return True

        # 4. Verificar permisos a través de grupos
        user_groups = self.user_groups.filter(group__is_active=True)

        for user_group in user_groups:
            # Obtener roles del grupo
            group_roles = user_group.group.roles.filter(is_active=True)
            for role in group_roles:
                if role.permisos.filter(
                    code=permission_code,
                    is_active=True
                ).exists():
                    return True

        return False

    def get_all_permissions(self):
        """
        Obtiene todos los permisos del usuario de todas las fuentes (RBAC Híbrido)

        Fuentes de permisos:
        1. Cargo (posición organizacional)
        2. Roles adicionales (COPASST, Brigadista, Auditor, etc.)
        3. Roles directos
        4. Grupos

        Returns:
            QuerySet[core.Permiso]: Todos los permisos activos del usuario
        """
        from django.db.models import Q
        from apps.core.models import Permiso

        if self.is_superuser:
            return Permiso.objects.filter(is_active=True)

        if not self.is_active or self.is_deleted:
            return Permiso.objects.none()

        permission_codes = set()

        # 1. Permisos del cargo
        if self.cargo:
            cargo_perms = self.cargo.permisos.filter(is_active=True).values_list('code', flat=True)
            permission_codes.update(cargo_perms)

        # 2. Permisos de roles adicionales (RBAC Híbrido)
        roles_adicionales_activos = self.usuarios_roles_adicionales.filter(
            is_active=True,
            rol_adicional__is_active=True
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        )

        for asignacion in roles_adicionales_activos:
            rol_perms = asignacion.rol_adicional.permisos.filter(is_active=True).values_list('code', flat=True)
            permission_codes.update(rol_perms)

        # 3. Permisos de roles directos
        user_roles = self.user_roles.filter(
            role__is_active=True
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        )

        for user_role in user_roles:
            role_perms = user_role.role.permisos.filter(is_active=True).values_list('code', flat=True)
            permission_codes.update(role_perms)

        # 4. Permisos de grupos
        user_groups = self.user_groups.filter(group__is_active=True)

        for user_group in user_groups:
            group_roles = user_group.group.roles.filter(is_active=True)
            for role in group_roles:
                role_perms = role.permisos.filter(is_active=True).values_list('code', flat=True)
                permission_codes.update(role_perms)

        return Permiso.objects.filter(code__in=permission_codes, is_active=True)

    def has_any_permission(self, permission_codes):
        """
        Verifica si el usuario tiene al menos uno de los permisos

        Args:
            permission_codes (list): Lista de códigos de permisos

        Returns:
            bool: True si tiene al menos uno
        """
        return any(self.has_permission(code) for code in permission_codes)

    def has_all_permissions(self, permission_codes):
        """
        Verifica si el usuario tiene todos los permisos

        Args:
            permission_codes (list): Lista de códigos de permisos

        Returns:
            bool: True si tiene todos
        """
        return all(self.has_permission(code) for code in permission_codes)

    def has_role(self, role_code):
        """
        Verifica si el usuario tiene un rol específico

        Args:
            role_code (str): Código del rol

        Returns:
            bool: True si tiene el rol
        """
        from django.db.models import Q

        if self.is_superuser:
            return True

        # Verificar rol directo
        has_direct = self.user_roles.filter(
            role__code=role_code,
            role__is_active=True
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        ).exists()

        if has_direct:
            return True

        # Verificar rol a través de grupos
        user_groups = self.user_groups.filter(group__is_active=True)
        for user_group in user_groups:
            if user_group.group.roles.filter(code=role_code, is_active=True).exists():
                return True

        return False

    def has_cargo(self, cargo_code):
        """
        Verifica si el usuario tiene un cargo específico

        Args:
            cargo_code (str): Código del cargo

        Returns:
            bool: True si tiene el cargo
        """
        if self.is_superuser:
            return True

        return self.cargo and self.cargo.code == cargo_code

    def is_in_group(self, group_code):
        """
        Verifica si el usuario pertenece a un grupo

        Args:
            group_code (str): Código del grupo

        Returns:
            bool: True si pertenece al grupo
        """
        return self.user_groups.filter(
            group__code=group_code,
            group__is_active=True
        ).exists()

    # =========================================================================
    # Métodos para Roles Adicionales (RBAC Híbrido)
    # =========================================================================

    def tiene_rol_adicional(self, rol_code):
        """
        Verifica si el usuario tiene un rol adicional específico activo

        Args:
            rol_code (str): Código del rol adicional (ej: 'copasst', 'brigadista')

        Returns:
            bool: True si tiene el rol adicional activo y no expirado
        """
        from django.db.models import Q

        if self.is_superuser:
            return True

        return self.usuarios_roles_adicionales.filter(
            rol_adicional__code=rol_code,
            rol_adicional__is_active=True,
            is_active=True
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        ).exists()

    def get_roles_adicionales_activos(self):
        """
        Obtiene todos los roles adicionales activos del usuario

        Returns:
            QuerySet: Roles adicionales activos (no expirados)
        """
        from django.db.models import Q

        return self.usuarios_roles_adicionales.filter(
            is_active=True,
            rol_adicional__is_active=True
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        ).select_related('rol_adicional')

    def get_permisos_efectivos(self):
        """
        Obtiene todos los códigos de permisos efectivos del usuario (RBAC Híbrido)

        Combina permisos de:
        - Cargo (posición organizacional)
        - Roles adicionales (transversales: COPASST, Brigadista, etc.)
        - Roles directos
        - Grupos

        Returns:
            list: Lista de códigos de permisos únicos
        """
        return list(self.get_all_permissions().values_list('code', flat=True))

    def get_roles_adicionales_por_tipo(self, tipo):
        """
        Obtiene roles adicionales del usuario filtrados por tipo

        Args:
            tipo (str): Tipo de rol ('LEGAL_OBLIGATORIO', 'SISTEMA_GESTION', 'OPERATIVO', 'CUSTOM')

        Returns:
            QuerySet: Roles adicionales del tipo especificado
        """
        from django.db.models import Q

        return self.usuarios_roles_adicionales.filter(
            is_active=True,
            rol_adicional__is_active=True,
            rol_adicional__tipo=tipo
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        ).select_related('rol_adicional')

    def get_certificaciones_por_vencer(self, dias=30):
        """
        Obtiene los roles adicionales del usuario con certificaciones próximas a vencer

        Args:
            dias (int): Número de días para considerar como "próximo a vencer"

        Returns:
            QuerySet: Asignaciones con certificaciones por vencer
        """
        from datetime import timedelta
        fecha_limite = timezone.now().date() + timedelta(days=dias)

        return self.usuarios_roles_adicionales.filter(
            is_active=True,
            rol_adicional__is_active=True,
            certificacion_expira__isnull=False,
            certificacion_expira__lte=fecha_limite,
            certificacion_expira__gte=timezone.now().date()
        ).select_related('rol_adicional')

    def has_cargo_level(self, min_level):
        """
        Verifica si el usuario tiene un nivel jerárquico mínimo

        Args:
            min_level (int): Nivel mínimo requerido (0-3)

        Returns:
            bool: True si cumple el nivel, False en caso contrario
        """
        if self.is_superuser:
            return True

        return self.cargo and self.cargo.level >= min_level

    def soft_delete(self):
        """
        Eliminación lógica del usuario
        Marca el usuario como eliminado sin borrarlo de la BD
        """
        self.deleted_at = timezone.now()
        self.is_active = False
        self.save(update_fields=['deleted_at', 'is_active', 'updated_at'])

    def restore(self):
        """
        Restaura un usuario eliminado lógicamente.

        Bloquea la restauración si el usuario fue retirado vía proceso de
        offboarding (estado_empleado='RETIRADO'). En ese caso se requiere
        un nuevo proceso de contratación.
        """
        if self.estado_empleado == 'RETIRADO':
            raise ValidationError(
                'No se puede restaurar un usuario retirado. '
                'Debe pasar por un nuevo proceso de contratación.'
            )
        self.deleted_at = None
        self.is_active = True
        self.save(update_fields=['deleted_at', 'is_active', 'updated_at'])

    def clean(self):
        """Validaciones personalizadas"""
        if ' ' in self.username:
            raise ValidationError(
                {'username': 'El nombre de usuario no puede contener espacios'}
            )
        if self.email and '@' not in self.email:
            raise ValidationError(
                {'email': 'Proporcione un email válido'}
            )
