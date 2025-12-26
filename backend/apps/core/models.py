"""
Modelos del módulo Core - Sistema de Gestión Grasas y Huesos del Norte
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
    # TAB 5: PERMISOS DEL SISTEMA
    # ==========================================================================
    rol_sistema = models.ForeignKey(
        'Role',
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
        """Cuenta usuarios asignados a este cargo"""
        return self.usuarios.filter(is_active=True, deleted_at__isnull=True).count()

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
        'organizacion.Area',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='usuarios_sede',
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
    # RBAC HÍBRIDO - ROLES ADICIONALES
    # ==========================================================================
    roles_adicionales = models.ManyToManyField(
        'RolAdicional',
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
        1. Superusuario → todos los permisos
        2. Cargo → permisos del cargo (posición organizacional)
        3. Roles adicionales → permisos de roles transversales (COPASST, Brigadista, etc.)
        4. Roles directos → permisos de roles asignados al usuario
        5. Grupos → permisos de roles asignados a grupos del usuario

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

        # 2. Verificar permisos a través de roles adicionales (NUEVO - RBAC Híbrido)
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
            QuerySet: Todos los permisos activos del usuario
        """
        from django.db.models import Q

        if self.is_superuser:
            return Permiso.objects.filter(is_active=True)

        if not self.is_active or self.is_deleted:
            return Permiso.objects.none()

        permission_codes = set()

        # 1. Permisos del cargo
        if self.cargo:
            cargo_perms = self.cargo.permisos.filter(is_active=True).values_list('code', flat=True)
            permission_codes.update(cargo_perms)

        # 2. Permisos de roles adicionales (NUEVO - RBAC Híbrido)
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
        """Restaura un usuario eliminado lógicamente"""
        self.deleted_at = None
        self.is_active = True
        self.save(update_fields=['deleted_at', 'is_active'
, 'updated_at'])

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


class Permiso(models.Model):
    """Modelo de Permisos del sistema"""

    MODULE_CHOICES = [
        ('CORE', 'Core - Usuarios y Configuración'),
        ('RECOLECCIONES', 'Recolecciones'),
        ('LOTES', 'Lotes'),
        ('LIQUIDACIONES', 'Liquidaciones'),
        ('PROVEEDORES', 'Proveedores'),
        ('ECOALIADOS', 'Ecoaliados'),
        ('PROGRAMACIONES', 'Programaciones'),
        ('UNIDADES', 'Unidades de Recolección'),
        ('CERTIFICADOS', 'Certificados'),
        ('REPORTES', 'Reportes'),
        ('DIRECCION_ESTRATEGICA', 'Dirección Estratégica'),
        ('TALENTO_HUMANO', 'Talento Humano'),
        ('GESTION_INTEGRAL', 'Gestión Integral'),
    ]

    ACTION_CHOICES = [
        ('VIEW', 'Ver'),
        ('CREATE', 'Crear'),
        ('EDIT', 'Editar'),
        ('DELETE', 'Eliminar'),
        ('APPROVE', 'Aprobar'),
        ('EXPORT', 'Exportar'),
        ('MANAGE', 'Administrar'),
    ]

    SCOPE_CHOICES = [
        ('OWN', 'Propios'),
        ('TEAM', 'Equipo'),
        ('ALL', 'Todos'),
    ]

    code = models.CharField(max_length=50, unique=True, db_index=True, verbose_name='Código')
    name = models.CharField(max_length=100, verbose_name='Nombre')
    description = models.TextField(blank=True, null=True, verbose_name='Descripción')
    module = models.CharField(max_length=30, choices=MODULE_CHOICES, db_index=True, verbose_name='Módulo')
    action = models.CharField(max_length=10, choices=ACTION_CHOICES, verbose_name='Acción')
    scope = models.CharField(max_length=10, choices=SCOPE_CHOICES, default='OWN', verbose_name='Alcance')
    is_active = models.BooleanField(default=True, db_index=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')

    class Meta:
        db_table = 'core_permiso'
        verbose_name = 'Permiso'
        verbose_name_plural = 'Permisos'
        ordering = ['module', 'action', 'scope']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['module', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"

    @classmethod
    def get_permissions_by_module(cls, module):
        return cls.objects.filter(module=module, is_active=True)


class CargoPermiso(models.Model):
    """Relación Many-to-Many entre Cargo y Permiso"""

    cargo = models.ForeignKey(Cargo, on_delete=models.CASCADE, related_name='cargo_permisos')
    permiso = models.ForeignKey(Permiso, on_delete=models.CASCADE, related_name='cargo_permisos')
    granted_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de asignación')
    granted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='permisos_otorgados')

    class Meta:
        db_table = 'core_cargo_permiso'
        verbose_name = 'Cargo-Permiso'
        verbose_name_plural = 'Cargos-Permisos'
        unique_together = [['cargo', 'permiso']]
        ordering = ['cargo', 'permiso']

    def __str__(self):
        return f"{self.cargo.code} -> {self.permiso.code}"


Cargo.add_to_class(
    'permisos',
    models.ManyToManyField(
        Permiso,
        through=CargoPermiso,
        related_name='cargos',
        verbose_name='Permisos'
    )
)


# =============================================================================
# SISTEMA RBAC DINÁMICO - Roles y Grupos
# =============================================================================

class Role(models.Model):
    """
    Rol del sistema - Agrupa permisos por función/responsabilidad

    Los roles representan funciones específicas que pueden ser asignadas
    a usuarios independientemente de su cargo. Un usuario puede tener
    múltiples roles.

    Ejemplos: 'aprobador_recolecciones', 'auditor_sst', 'gestor_precios'
    """

    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del rol (ej: aprobador_recolecciones)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del rol'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción de las responsabilidades del rol'
    )
    permisos = models.ManyToManyField(
        Permiso,
        through='RolePermiso',
        related_name='roles',
        verbose_name='Permisos'
    )
    is_system = models.BooleanField(
        default=False,
        verbose_name='Es del sistema',
        help_text='Los roles del sistema no pueden ser eliminados desde la UI'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
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
        db_table = 'core_role'
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'
        ordering = ['name']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"

    def get_all_permissions(self):
        """Obtiene todos los permisos activos del rol"""
        return self.permisos.filter(is_active=True)


class RolePermiso(models.Model):
    """Relación Many-to-Many entre Role y Permiso"""

    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name='role_permisos'
    )
    permiso = models.ForeignKey(
        Permiso,
        on_delete=models.CASCADE,
        related_name='role_permisos'
    )
    granted_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de asignación'
    )
    granted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='permisos_rol_otorgados'
    )

    class Meta:
        db_table = 'core_role_permiso'
        verbose_name = 'Rol-Permiso'
        verbose_name_plural = 'Roles-Permisos'
        unique_together = [['role', 'permiso']]
        ordering = ['role', 'permiso']

    def __str__(self):
        return f"{self.role.code} -> {self.permiso.code}"


class Group(models.Model):
    """
    Grupo del sistema - Agrupa usuarios y roles por área/equipo

    Los grupos permiten organizar usuarios por equipos de trabajo
    y asignar roles a nivel de grupo.

    Ejemplos: 'equipo_recolecciones', 'equipo_comercial', 'comite_sst'
    """

    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del grupo (ej: equipo_recolecciones)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del grupo'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción del grupo y su propósito'
    )
    roles = models.ManyToManyField(
        Role,
        through='GroupRole',
        related_name='groups',
        verbose_name='Roles',
        blank=True
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
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
        db_table = 'core_group'
        verbose_name = 'Grupo'
        verbose_name_plural = 'Grupos'
        ordering = ['name']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"

    def get_all_permissions(self):
        """Obtiene todos los permisos del grupo a través de sus roles"""
        from django.db.models import Q
        return Permiso.objects.filter(
            Q(roles__groups=self) & Q(is_active=True)
        ).distinct()


class GroupRole(models.Model):
    """Relación Many-to-Many entre Group y Role"""

    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='group_roles'
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name='group_roles'
    )
    assigned_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de asignación'
    )
    assigned_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='roles_grupo_asignados'
    )

    class Meta:
        db_table = 'core_group_role'
        verbose_name = 'Grupo-Rol'
        verbose_name_plural = 'Grupos-Roles'
        unique_together = [['group', 'role']]
        ordering = ['group', 'role']

    def __str__(self):
        return f"{self.group.code} -> {self.role.code}"


class UserRole(models.Model):
    """
    Relación Many-to-Many entre User y Role

    Permite asignar roles directamente a usuarios,
    independientemente de su cargo o grupo.
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='user_roles'
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name='user_roles'
    )
    assigned_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de asignación'
    )
    assigned_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='roles_asignados'
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de expiración',
        help_text='Fecha en que el rol expira automáticamente'
    )

    class Meta:
        db_table = 'core_user_role'
        verbose_name = 'Usuario-Rol'
        verbose_name_plural = 'Usuarios-Roles'
        unique_together = [['user', 'role']]
        ordering = ['user', 'role']
        indexes = [
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"{self.user.username} -> {self.role.code}"

    @property
    def is_expired(self):
        """Verifica si el rol ha expirado"""
        if self.expires_at is None:
            return False
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        """Verifica si el rol es válido (activo y no expirado)"""
        return self.role.is_active and not self.is_expired


class UserGroup(models.Model):
    """
    Relación Many-to-Many entre User y Group

    Permite asignar usuarios a grupos de trabajo.
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='user_groups'
    )
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='user_groups'
    )
    assigned_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de asignación'
    )
    assigned_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='grupos_asignados'
    )
    is_leader = models.BooleanField(
        default=False,
        verbose_name='Es líder',
        help_text='Indica si el usuario es líder del grupo'
    )

    class Meta:
        db_table = 'core_user_group'
        verbose_name = 'Usuario-Grupo'
        verbose_name_plural = 'Usuarios-Grupos'
        unique_together = [['user', 'group']]
        ordering = ['user', 'group']

    def __str__(self):
        leader = " (Líder)" if self.is_leader else ""
        return f"{self.user.username} -> {self.group.code}{leader}"


# =============================================================================
# MODELO DE MENÚ DINÁMICO - Para Sidebar basado en permisos
# =============================================================================

class MenuItem(models.Model):
    """
    Item de menú del sistema - Permite configurar el Sidebar dinámicamente

    Estructura jerárquica:
    - Macroprocesos (nivel 0): Dirección Estratégica, Gestión Misional, etc.
    - Módulos (nivel 1): Proveedores, Planta, SST, etc.
    - Submódulos (nivel 2): EcoNorte, Recepciones, etc.

    El acceso se controla mediante:
    - allowed_cargos: Cargos que pueden ver el item
    - allowed_roles: Roles que pueden ver el item
    - required_permissions: Permisos requeridos para ver el item
    """

    MACROPROCESS_CHOICES = [
        ('DIRECCION_ESTRATEGICA', 'Dirección Estratégica'),
        ('GESTION_MISIONAL', 'Gestión Misional'),
        ('GESTION_APOYO', 'Gestión de Apoyo'),
        ('GESTION_INTEGRAL', 'Gestión Integral'),
    ]

    COLOR_CHOICES = [
        ('purple', 'Púrpura'),
        ('blue', 'Azul'),
        ('green', 'Verde'),
        ('orange', 'Naranja'),
        ('red', 'Rojo'),
        ('gray', 'Gris'),
    ]

    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del item de menú (ej: menu.econorte)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre visible en el menú'
    )
    path = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Ruta',
        help_text='Ruta del frontend (ej: /proveedores/econorte)'
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Icono',
        help_text='Nombre del icono de Lucide (ej: Users, Truck, Package)'
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children',
        verbose_name='Item padre',
        help_text='Item de menú padre (para jerarquía)'
    )
    macroprocess = models.CharField(
        max_length=30,
        choices=MACROPROCESS_CHOICES,
        blank=True,
        null=True,
        db_index=True,
        verbose_name='Macroproceso',
        help_text='Macroproceso al que pertenece (solo para items de nivel 0)'
    )
    color = models.CharField(
        max_length=20,
        choices=COLOR_CHOICES,
        blank=True,
        null=True,
        verbose_name='Color',
        help_text='Color del macroproceso (solo para items de nivel 0)'
    )
    orden = models.IntegerField(
        default=0,
        verbose_name='Orden',
        help_text='Orden de aparición en el menú'
    )
    badge = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Badge',
        help_text='Texto del badge (ej: Nuevo, Beta)'
    )
    allowed_cargos = models.ManyToManyField(
        Cargo,
        blank=True,
        related_name='menu_items',
        verbose_name='Cargos permitidos',
        help_text='Cargos que pueden ver este item'
    )
    allowed_roles = models.ManyToManyField(
        Role,
        blank=True,
        related_name='menu_items',
        verbose_name='Roles permitidos',
        help_text='Roles que pueden ver este item'
    )
    required_permissions = models.ManyToManyField(
        Permiso,
        blank=True,
        related_name='menu_items',
        verbose_name='Permisos requeridos',
        help_text='Permisos necesarios para ver este item'
    )
    is_category = models.BooleanField(
        default=False,
        verbose_name='Es categoría',
        help_text='Si es un macroproceso (categoría sin ruta)'
    )
    allow_all = models.BooleanField(
        default=False,
        verbose_name='Permitir todos',
        help_text='Si está activo, todos los usuarios autenticados pueden ver este item'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
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
        db_table = 'core_menu_item'
        verbose_name = 'Item de Menú'
        verbose_name_plural = 'Items de Menú'
        ordering = ['orden', 'name']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active', 'orden']),
            models.Index(fields=['parent', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"

    @property
    def level(self):
        """Calcula el nivel jerárquico del item"""
        level = 0
        parent = self.parent
        while parent:
            level += 1
            parent = parent.parent
        return level

    def user_has_access(self, user):
        """
        Verifica si un usuario tiene acceso a este item de menú

        Args:
            user: Usuario a verificar

        Returns:
            bool: True si tiene acceso
        """
        # Superusuario siempre tiene acceso
        if user.is_superuser:
            return True

        # Si permite todos, cualquier usuario autenticado puede ver
        if self.allow_all:
            return True

        # Verificar por cargo
        if user.cargo and self.allowed_cargos.filter(id=user.cargo.id).exists():
            return True

        # Verificar por roles del usuario
        user_role_ids = user.user_roles.filter(
            role__is_active=True
        ).values_list('role_id', flat=True)

        if self.allowed_roles.filter(id__in=user_role_ids).exists():
            return True

        # Verificar por permisos requeridos
        required_perms = self.required_permissions.filter(is_active=True)
        if required_perms.exists():
            user_perms = user.get_all_permissions()
            required_codes = set(required_perms.values_list('code', flat=True))
            user_codes = set(user_perms.values_list('code', flat=True))
            if required_codes.issubset(user_codes):
                return True

        return False

    @classmethod
    def get_user_menu(cls, user):
        """
        Obtiene el menú completo filtrado para un usuario

        Args:
            user: Usuario para filtrar el menú

        Returns:
            list: Lista de items de menú accesibles en estructura jerárquica
        """
        def build_tree(items, parent=None):
            result = []
            for item in items:
                if item.parent == parent and item.user_has_access(user):
                    children = build_tree(items, item)
                    item_data = {
                        'id': item.id,
                        'code': item.code,
                        'name': item.name,
                        'path': item.path,
                        'icon': item.icon,
                        'color': item.color,
                        'badge': item.badge,
                        'is_category': item.is_category,
                        'orden': item.orden,
                        'children': children if children else None
                    }
                    result.append(item_data)
            return sorted(result, key=lambda x: x['orden'])

        all_items = cls.objects.filter(is_active=True).prefetch_related(
            'allowed_cargos', 'allowed_roles', 'required_permissions'
        )
        return build_tree(list(all_items))


# =============================================================================
# Agregar relación de Cargo con Roles por defecto
# =============================================================================

Cargo.add_to_class(
    'default_roles',
    models.ManyToManyField(
        Role,
        through='CargoRole',
        related_name='default_for_cargos',
        verbose_name='Roles por defecto',
        blank=True
    )
)


class CargoRole(models.Model):
    """Relación Many-to-Many entre Cargo y Role (roles por defecto del cargo)"""

    cargo = models.ForeignKey(
        Cargo,
        on_delete=models.CASCADE,
        related_name='cargo_roles'
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name='cargo_roles'
    )
    assigned_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de asignación'
    )

    class Meta:
        db_table = 'core_cargo_role'
        verbose_name = 'Cargo-Rol por defecto'
        verbose_name_plural = 'Cargos-Roles por defecto'
        unique_together = [['cargo', 'role']]
        ordering = ['cargo', 'role']

    def __str__(self):
        return f"{self.cargo.code} -> {self.role.code}"


# =============================================================================
# NOTA: CorporateIdentity y CorporateValue MOVIDOS
# =============================================================================
# Estos modelos han sido migrados a:
#     apps.gestion_estrategica.identidad.models
#
# Importar desde:
#     from apps.gestion_estrategica.identidad.models import CorporateIdentity, CorporateValue
# =============================================================================


# =============================================================================
# NOTA: StrategicPlan y StrategicObjective MOVIDOS
# =============================================================================
# Estos modelos han sido migrados a:
#     apps.gestion_estrategica.planeacion.models
#
# Importar desde:
#     from apps.gestion_estrategica.planeacion.models import StrategicPlan, StrategicObjective
# =============================================================================


# =============================================================================
# TAB 4: CONFIGURACIÓN DEL SISTEMA
# Marketplace de Módulos, Branding, Consecutivos
# =============================================================================

class SystemModule(models.Model):
    """
    Módulo del Sistema - Marketplace de módulos On/Off

    Permite activar/desactivar módulos del sistema dinámicamente.
    """

    CATEGORY_CHOICES = [
        ('ESTRATEGICO', 'Nivel Estratégico'),
        ('MOTOR', 'Motores del Sistema'),
        ('INTEGRAL', 'Gestión Integral'),
        ('MISIONAL', 'Nivel Misional'),
        ('APOYO', 'Nivel de Apoyo'),
        ('INTELIGENCIA', 'Inteligencia de Negocio'),
    ]

    COLOR_CHOICES = [
        ('purple', 'Púrpura'),
        ('blue', 'Azul'),
        ('green', 'Verde'),
        ('orange', 'Naranja'),
        ('red', 'Rojo'),
        ('gray', 'Gris'),
        ('yellow', 'Amarillo'),
        ('pink', 'Rosa'),
        ('indigo', 'Índigo'),
        ('teal', 'Verde azulado'),
    ]

    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del módulo (ej: apps.supply_chain)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre del módulo'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción de las funcionalidades del módulo'
    )
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        db_index=True,
        verbose_name='Categoría'
    )
    color = models.CharField(
        max_length=20,
        choices=COLOR_CHOICES,
        blank=True,
        null=True,
        verbose_name='Color',
        help_text='Color del macroproceso/módulo (para visualización en UI)'
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Icono',
        help_text='Nombre del icono de Lucide'
    )
    is_core = models.BooleanField(
        default=False,
        verbose_name='Es módulo core',
        help_text='Los módulos core no pueden desactivarse'
    )
    is_enabled = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Habilitado',
        help_text='Si el módulo está activo en el sistema'
    )
    requires_license = models.BooleanField(
        default=False,
        verbose_name='Requiere licencia',
        help_text='Si el módulo requiere licencia adicional'
    )
    license_expires_at = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de expiración de licencia'
    )
    dependencies = models.ManyToManyField(
        'self',
        symmetrical=False,
        blank=True,
        related_name='dependents',
        verbose_name='Dependencias',
        help_text='Módulos que deben estar activos para que este funcione'
    )
    orden = models.IntegerField(
        default=0,
        verbose_name='Orden'
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
        db_table = 'core_system_module'
        verbose_name = 'Módulo del Sistema'
        verbose_name_plural = 'Módulos del Sistema'
        ordering = ['category', 'orden', 'name']

    def __str__(self):
        return f"{self.name} ({self.code})"

    def can_disable(self):
        """Verifica si el módulo puede ser desactivado"""
        if self.is_core:
            return False, "Este es un módulo core y no puede desactivarse"

        # Verificar si hay módulos que dependen de este
        dependents = self.dependents.filter(is_enabled=True)
        if dependents.exists():
            names = ", ".join(dependents.values_list('name', flat=True))
            return False, f"Los siguientes módulos dependen de este: {names}"

        return True, None

    def enable(self):
        """Activa el módulo y sus dependencias"""
        # Activar dependencias primero
        for dep in self.dependencies.all():
            if not dep.is_enabled:
                dep.is_enabled = True
                dep.save(update_fields=['is_enabled'])
        self.is_enabled = True
        self.save(update_fields=['is_enabled'])

    def disable(self):
        """Desactiva el módulo si es posible"""
        can_disable, reason = self.can_disable()
        if not can_disable:
            raise ValidationError(reason)
        self.is_enabled = False
        self.save(update_fields=['is_enabled'])

    def get_enabled_tabs(self):
        """Obtiene todos los tabs habilitados del módulo"""
        return self.tabs.filter(is_enabled=True).order_by('orden', 'name')

    def get_tab_count(self):
        """Cuenta el total de tabs del módulo"""
        return self.tabs.count()

    def get_enabled_tab_count(self):
        """Cuenta los tabs habilitados del módulo"""
        return self.tabs.filter(is_enabled=True).count()


class ModuleTab(models.Model):
    """
    Tab dentro de un módulo del sistema

    Permite organizar funcionalidades de un módulo en pestañas (tabs).
    Ejemplo: En el módulo 'Dirección Estratégica' puede haber tabs como
    'Identidad Corporativa', 'Plan Estratégico', 'Indicadores', etc.
    """

    module = models.ForeignKey(
        SystemModule,
        on_delete=models.CASCADE,
        related_name='tabs',
        verbose_name='Módulo'
    )
    code = models.CharField(
        max_length=50,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del tab (ej: identidad, plan_estrategico)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre visible del tab (ej: Identidad Corporativa)'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción de las funcionalidades del tab'
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Icono',
        help_text='Nombre del icono de Lucide (ej: Building2, Target, BarChart)'
    )
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden',
        help_text='Orden de aparición del tab'
    )
    is_enabled = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Habilitado',
        help_text='Si el tab está activo en el sistema'
    )
    is_core = models.BooleanField(
        default=False,
        verbose_name='Es tab core',
        help_text='Los tabs core no pueden desactivarse'
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
        db_table = 'core_module_tab'
        verbose_name = 'Tab de Módulo'
        verbose_name_plural = 'Tabs de Módulos'
        ordering = ['module', 'orden', 'name']
        unique_together = [['module', 'code']]
        indexes = [
            models.Index(fields=['module', 'is_enabled']),
            models.Index(fields=['code']),
        ]

    def __str__(self):
        return f"{self.module.name} > {self.name}"

    def can_disable(self):
        """Verifica si el tab puede ser desactivado"""
        if self.is_core:
            return False, "Este es un tab core y no puede desactivarse"
        return True, None

    def disable(self):
        """Desactiva el tab si es posible"""
        can_disable, reason = self.can_disable()
        if not can_disable:
            raise ValidationError(reason)
        self.is_enabled = False
        self.save(update_fields=['is_enabled'])

    def enable(self):
        """Activa el tab"""
        self.is_enabled = True
        self.save(update_fields=['is_enabled'])

    def get_enabled_sections(self):
        """Obtiene todas las secciones habilitadas del tab"""
        return self.sections.filter(is_enabled=True).order_by('orden', 'name')

    def get_section_count(self):
        """Cuenta el total de secciones del tab"""
        return self.sections.count()

    def get_enabled_section_count(self):
        """Cuenta las secciones habilitadas del tab"""
        return self.sections.filter(is_enabled=True).count()


class TabSection(models.Model):
    """
    Sección/SubNavigation dentro de un Tab

    Permite organizar contenido dentro de un tab mediante secciones.
    Ejemplo: En el tab 'Identidad Corporativa' puede haber secciones como
    'Misión y Visión', 'Valores', 'Política Integral', etc.
    """

    tab = models.ForeignKey(
        ModuleTab,
        on_delete=models.CASCADE,
        related_name='sections',
        verbose_name='Tab'
    )
    code = models.CharField(
        max_length=50,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de la sección (ej: mision_vision, valores)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre visible de la sección (ej: Misión y Visión)'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción del contenido de la sección'
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Icono',
        help_text='Nombre del icono de Lucide (ej: Eye, Heart, FileText)'
    )
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden',
        help_text='Orden de aparición de la sección'
    )
    is_enabled = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Habilitado',
        help_text='Si la sección está activa en el sistema'
    )
    is_core = models.BooleanField(
        default=False,
        verbose_name='Es sección core',
        help_text='Las secciones core no pueden desactivarse'
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
        db_table = 'core_tab_section'
        verbose_name = 'Sección de Tab'
        verbose_name_plural = 'Secciones de Tabs'
        ordering = ['tab', 'orden', 'name']
        unique_together = [['tab', 'code']]
        indexes = [
            models.Index(fields=['tab', 'is_enabled']),
            models.Index(fields=['code']),
        ]

    def __str__(self):
        return f"{self.tab.module.name} > {self.tab.name} > {self.name}"

    def can_disable(self):
        """Verifica si la sección puede ser desactivada"""
        if self.is_core:
            return False, "Esta es una sección core y no puede desactivarse"
        return True, None

    def disable(self):
        """Desactiva la sección si es posible"""
        can_disable, reason = self.can_disable()
        if not can_disable:
            raise ValidationError(reason)
        self.is_enabled = False
        self.save(update_fields=['is_enabled'])

    def enable(self):
        """Activa la sección"""
        self.is_enabled = True
        self.save(update_fields=['is_enabled'])

    @property
    def full_path(self):
        """Retorna la ruta completa de la sección"""
        return f"{self.tab.module.code}.{self.tab.code}.{self.code}"


class BrandingConfig(models.Model):
    """
    Configuración de Branding - Logo, Colores, Favicon

    Permite personalizar la apariencia del sistema.
    """

    company_name = models.CharField(
        max_length=200,
        default='Grasas y Huesos del Norte',
        verbose_name='Nombre de la Empresa'
    )
    company_short_name = models.CharField(
        max_length=50,
        default='GRASHNORTE',
        verbose_name='Nombre Corto'
    )
    company_slogan = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Slogan'
    )
    logo = models.ImageField(
        upload_to='branding/logos/',
        blank=True,
        null=True,
        verbose_name='Logo Principal'
    )
    logo_white = models.ImageField(
        upload_to='branding/logos/',
        blank=True,
        null=True,
        verbose_name='Logo Blanco (para fondos oscuros)'
    )
    favicon = models.ImageField(
        upload_to='branding/favicons/',
        blank=True,
        null=True,
        verbose_name='Favicon'
    )
    primary_color = models.CharField(
        max_length=7,
        default='#16A34A',
        verbose_name='Color Primario',
        help_text='Color en formato HEX (ej: #16A34A)'
    )
    secondary_color = models.CharField(
        max_length=7,
        default='#059669',
        verbose_name='Color Secundario'
    )
    accent_color = models.CharField(
        max_length=7,
        default='#10B981',
        verbose_name='Color de Acento'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
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
        db_table = 'core_branding_config'
        verbose_name = 'Configuración de Branding'
        verbose_name_plural = 'Configuraciones de Branding'

    def __str__(self):
        return f"Branding - {self.company_name}"

    def save(self, *args, **kwargs):
        if self.is_active:
            BrandingConfig.objects.exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)


# =============================================================================
# NOTA: ConsecutivoConfig ELIMINADO de este archivo
# =============================================================================
# El modelo ConsecutivoConfig ha sido migrado permanentemente a:
#     apps.gestion_estrategica.organizacion.models.ConsecutivoConfig
#
# El nuevo modelo usa ForeignKey a TipoDocumento y Area (más flexible).
#
# Para generar consecutivos, usar:
#     from apps.gestion_estrategica.organizacion.models import ConsecutivoConfig
#     ConsecutivoConfig.obtener_siguiente_consecutivo('TIPO_DOCUMENTO')
# =============================================================================


# =============================================================================
# SISTEMA RBAC HÍBRIDO - Roles Adicionales
# =============================================================================

class RolAdicional(models.Model):
    """
    Rol Adicional - Sistema RBAC Híbrido para asignaciones especiales.

    Permite asignar roles específicos a usuarios independientemente de su cargo,
    cubriendo:
    - Roles legales obligatorios (COPASST, Vigía SST, Brigadista, COCOLA)
    - Roles de sistemas de gestión (Auditor Interno, Responsable Ambiental)
    - Roles operativos especiales (Aprobador de Compras, Supervisor Turno)
    - Roles custom definidos por la empresa

    Jerarquía de permisos del usuario:
    1. Superusuario → todos los permisos
    2. Cargo → permisos base del cargo
    3. Roles adicionales → permisos especializados extra (ESTE MODELO)
    4. Grupos → permisos colaborativos

    Estos roles NO reemplazan al cargo, sino que SUMAN permisos adicionales.
    """

    TIPO_CHOICES = [
        ('LEGAL_OBLIGATORIO', 'Legal Obligatorio'),
        ('SISTEMA_GESTION', 'Sistema de Gestión'),
        ('OPERATIVO', 'Operativo Especial'),
        ('CUSTOM', 'Personalizado'),
    ]

    # ==========================================================================
    # IDENTIFICACIÓN
    # ==========================================================================
    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del rol adicional (ej: copasst, brigadista)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del rol (ej: Miembro COPASST)'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción detallada de las responsabilidades del rol'
    )
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_CHOICES,
        default='CUSTOM',
        db_index=True,
        verbose_name='Tipo de Rol'
    )

    # ==========================================================================
    # PERMISOS
    # ==========================================================================
    permisos = models.ManyToManyField(
        'Permiso',
        through='RolAdicionalPermiso',
        related_name='roles_adicionales',
        verbose_name='Permisos',
        blank=True,
        help_text='Permisos que otorga este rol adicional'
    )

    # ==========================================================================
    # INFORMACIÓN LEGAL (para roles legales obligatorios)
    # ==========================================================================
    justificacion_legal = models.TextField(
        blank=True,
        null=True,
        verbose_name='Justificación Legal',
        help_text='Normativa que exige este rol (ej: Resolución 0312/2019)'
    )
    requiere_certificacion = models.BooleanField(
        default=False,
        verbose_name='Requiere Certificación',
        help_text='Si el rol requiere certificación o capacitación específica'
    )
    certificacion_requerida = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Certificación Requerida',
        help_text='Nombre de la certificación/curso requerido (ej: Curso 50h SST)'
    )

    # ==========================================================================
    # CONTROL
    # ==========================================================================
    is_system = models.BooleanField(
        default=False,
        verbose_name='Es del sistema',
        help_text='Los roles del sistema no pueden eliminarse desde la UI'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
        help_text='Si el rol está activo en el sistema'
    )

    # ==========================================================================
    # AUDITORÍA
    # ==========================================================================
    created_by = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='roles_adicionales_creados',
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
        db_table = 'core_rol_adicional'
        verbose_name = 'Rol Adicional'
        verbose_name_plural = 'Roles Adicionales'
        ordering = ['tipo', 'nombre']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['tipo', 'is_active']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.code})"

    def get_permisos_codigos(self):
        """
        Retorna lista de códigos de permisos activos de este rol.

        Returns:
            list: Lista de códigos de permisos (ej: ['lotes.approve', 'lotes.view'])
        """
        return list(
            self.permisos.filter(is_active=True).values_list('code', flat=True)
        )

    def usuarios_count(self):
        """
        Cuenta cuántos usuarios tienen asignado este rol adicional.

        Returns:
            int: Número de usuarios con este rol
        """
        return self.usuarios_asignados.filter(
            is_active=True,
            user__is_active=True,
            user__deleted_at__isnull=True
        ).count()

    usuarios_count.short_description = 'Usuarios Asignados'

    def puede_eliminar(self):
        """
        Verifica si el rol adicional puede ser eliminado.

        Returns:
            tuple: (bool, str) - (puede_eliminar, razón si no puede)
        """
        if self.is_system:
            return False, "Este es un rol del sistema y no puede eliminarse"

        usuarios_asignados = self.usuarios_count()
        if usuarios_asignados > 0:
            return False, f"Hay {usuarios_asignados} usuario(s) con este rol asignado"

        return True, None

    def get_tipo_display_color(self):
        """
        Retorna color asociado al tipo de rol (para UI).

        Returns:
            str: Color CSS (ej: 'red', 'blue', 'green')
        """
        colores = {
            'LEGAL_OBLIGATORIO': 'red',
            'SISTEMA_GESTION': 'blue',
            'OPERATIVO': 'green',
            'CUSTOM': 'purple',
        }
        return colores.get(self.tipo, 'gray')


class RolAdicionalPermiso(models.Model):
    """
    Relación Many-to-Many entre RolAdicional y Permiso.

    Tabla intermedia para control de auditoría de asignación de permisos.
    """

    rol_adicional = models.ForeignKey(
        RolAdicional,
        on_delete=models.CASCADE,
        related_name='rol_adicional_permisos',
        verbose_name='Rol Adicional'
    )
    permiso = models.ForeignKey(
        'Permiso',
        on_delete=models.CASCADE,
        related_name='rol_adicional_permisos',
        verbose_name='Permiso'
    )
    granted_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de asignación'
    )
    granted_by = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='permisos_rol_adicional_otorgados',
        verbose_name='Asignado por'
    )

    class Meta:
        db_table = 'core_rol_adicional_permiso'
        verbose_name = 'Permiso de Rol Adicional'
        verbose_name_plural = 'Permisos de Roles Adicionales'
        unique_together = [['rol_adicional', 'permiso']]
        ordering = ['rol_adicional', 'permiso']

    def __str__(self):
        return f"{self.rol_adicional.code} → {self.permiso.code}"


class UserRolAdicional(models.Model):
    """
    Relación Many-to-Many entre User y RolAdicional.

    Permite asignar roles adicionales a usuarios con control de:
    - Vigencia temporal (fecha de expiración)
    - Auditoría de asignación
    - Justificación de la asignación
    - Certificación adjunta (para roles que la requieren)
    """

    user = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='usuarios_roles_adicionales',
        verbose_name='Usuario'
    )
    rol_adicional = models.ForeignKey(
        RolAdicional,
        on_delete=models.CASCADE,
        related_name='usuarios_asignados',
        verbose_name='Rol Adicional'
    )

    # ==========================================================================
    # VIGENCIA
    # ==========================================================================
    assigned_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de asignación'
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de expiración',
        help_text='Fecha en que el rol expira automáticamente (opcional)'
    )

    # ==========================================================================
    # AUDITORÍA Y JUSTIFICACIÓN
    # ==========================================================================
    assigned_by = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='roles_adicionales_asignados_por_mi',
        verbose_name='Asignado por'
    )
    justificacion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Justificación',
        help_text='Razón o justificación de la asignación del rol'
    )

    # ==========================================================================
    # CERTIFICACIÓN (para roles que la requieren)
    # ==========================================================================
    certificacion_adjunta = models.FileField(
        upload_to='roles_adicionales/certificaciones/%Y/%m/',
        blank=True,
        null=True,
        verbose_name='Certificación Adjunta',
        help_text='Certificado o documento que acredita la capacitación'
    )
    fecha_certificacion = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de Certificación',
        help_text='Fecha de emisión del certificado'
    )
    certificacion_expira = models.DateField(
        blank=True,
        null=True,
        verbose_name='Certificación Expira',
        help_text='Fecha de vencimiento del certificado'
    )

    # ==========================================================================
    # ESTADO
    # ==========================================================================
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
        help_text='Si la asignación está activa'
    )

    class Meta:
        db_table = 'core_user_rol_adicional'
        verbose_name = 'Usuario-Rol Adicional'
        verbose_name_plural = 'Usuarios-Roles Adicionales'
        unique_together = [['user', 'rol_adicional']]
        ordering = ['user', 'rol_adicional']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['certificacion_expira']),
        ]

    def __str__(self):
        return f"{self.user.username} → {self.rol_adicional.nombre}"

    @property
    def is_expired(self):
        """Verifica si el rol ha expirado por fecha."""
        if self.expires_at is None:
            return False
        return timezone.now() > self.expires_at

    @property
    def certificacion_is_expired(self):
        """Verifica si la certificación ha expirado."""
        if self.certificacion_expira is None:
            return False
        return timezone.now().date() > self.certificacion_expira

    @property
    def is_valid(self):
        """
        Verifica si la asignación del rol es válida.

        Considera:
        - Rol activo
        - Asignación activa
        - No expirado por fecha
        - Certificación vigente (si aplica)

        Returns:
            bool: True si es válido
        """
        if not self.is_active:
            return False

        if not self.rol_adicional.is_active:
            return False

        if self.is_expired:
            return False

        # Si el rol requiere certificación, verificar vigencia
        if self.rol_adicional.requiere_certificacion:
            if not self.certificacion_adjunta:
                return False
            if self.certificacion_is_expired:
                return False

        return True

    @property
    def estado_certificacion(self):
        """
        Retorna el estado de la certificación.

        Returns:
            str: 'VIGENTE', 'VENCIDA', 'PROXIMA_VENCER', 'NO_REQUERIDA', 'NO_CARGADA'
        """
        if not self.rol_adicional.requiere_certificacion:
            return 'NO_REQUERIDA'

        if not self.certificacion_adjunta:
            return 'NO_CARGADA'

        if self.certificacion_is_expired:
            return 'VENCIDA'

        if self.certificacion_expira:
            from datetime import timedelta
            dias_para_vencer = (self.certificacion_expira - timezone.now().date()).days
            if dias_para_vencer <= 30:
                return 'PROXIMA_VENCER'

        return 'VIGENTE'


# =============================================================================
# =============================================================================
# NOTA: La relación User.roles_adicionales está definida directamente en el
# modelo User con through_fields para resolver ambigüedad de FK.
# =============================================================================
