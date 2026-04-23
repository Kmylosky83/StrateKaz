"""
Modelos del módulo Configuración - Dirección Estratégica
Sistema de Gestión StrateKaz

Define:
- SedeEmpresa: Sedes y ubicaciones
- IntegracionExterna: Integraciones con servicios externos
- NormaISO: Normas ISO y sistemas de gestión
- TipoSede, TipoCambio: Tipos dinámicos configurables

NOTA: EmpresaConfig fue ELIMINADO - todos los datos fiscales y branding
ahora están consolidados en el modelo Tenant (apps.tenant.models.Tenant)
Ver: apps.tenant.models para la fuente única de verdad.

NOTA: UnidadMedida y ConsecutivoConfig fueron migrados a organizacion.
Ver: apps.gestion_estrategica.organizacion.models
"""
from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
import re

from apps.core.base_models import TimestampedModel, AuditModel, SoftDeleteModel, BaseCompanyModel, OrderedModel

# Modelos migrados a organizacion - importar desde allí para backward compatibility
from apps.catalogo_productos.models import UnidadMedida
from apps.gestion_estrategica.organizacion.models_consecutivos import (
    ConsecutivoConfig, CATEGORIA_CONSECUTIVO_CHOICES, CONSECUTIVOS_SISTEMA
)


# ==============================================================================
# CONSTANTES
# ==============================================================================

DEPARTAMENTOS_COLOMBIA = [
    ('AMAZONAS', 'Amazonas'),
    ('ANTIOQUIA', 'Antioquia'),
    ('ARAUCA', 'Arauca'),
    ('ATLANTICO', 'Atlántico'),
    ('BOLIVAR', 'Bolívar'),
    ('BOYACA', 'Boyacá'),
    ('CALDAS', 'Caldas'),
    ('CAQUETA', 'Caquetá'),
    ('CASANARE', 'Casanare'),
    ('CAUCA', 'Cauca'),
    ('CESAR', 'Cesar'),
    ('CHOCO', 'Chocó'),
    ('CORDOBA', 'Córdoba'),
    ('CUNDINAMARCA', 'Cundinamarca'),
    ('GUAINIA', 'Guainía'),
    ('GUAVIARE', 'Guaviare'),
    ('HUILA', 'Huila'),
    ('LA_GUAJIRA', 'La Guajira'),
    ('MAGDALENA', 'Magdalena'),
    ('META', 'Meta'),
    ('NARINO', 'Nariño'),
    ('NORTE_DE_SANTANDER', 'Norte de Santander'),
    ('PUTUMAYO', 'Putumayo'),
    ('QUINDIO', 'Quindío'),
    ('RISARALDA', 'Risaralda'),
    ('SAN_ANDRES', 'San Andrés y Providencia'),
    ('SANTANDER', 'Santander'),
    ('SUCRE', 'Sucre'),
    ('TOLIMA', 'Tolima'),
    ('VALLE_DEL_CAUCA', 'Valle del Cauca'),
    ('VAUPES', 'Vaupés'),
    ('VICHADA', 'Vichada'),
]

TIPO_SOCIEDAD_CHOICES = [
    ('SAS', 'Sociedad por Acciones Simplificada (S.A.S.)'),
    ('SA', 'Sociedad Anónima (S.A.)'),
    ('LTDA', 'Sociedad Limitada (Ltda.)'),
    ('SCA', 'Sociedad en Comandita por Acciones'),
    ('SC', 'Sociedad en Comandita Simple'),
    ('COLECTIVA', 'Sociedad Colectiva'),
    ('ESAL', 'Entidad Sin Ánimo de Lucro'),
    ('PERSONA_NATURAL', 'Persona Natural'),
    ('SUCURSAL_EXTRANJERA', 'Sucursal de Sociedad Extranjera'),
    ('OTRO', 'Otro'),
]

REGIMEN_TRIBUTARIO_CHOICES = [
    ('COMUN', 'Régimen Común (Responsable de IVA)'),
    ('SIMPLE', 'Régimen Simple de Tributación (RST)'),
    ('NO_RESPONSABLE', 'No Responsable de IVA'),
    ('ESPECIAL', 'Régimen Tributario Especial'),
    ('GRAN_CONTRIBUYENTE', 'Gran Contribuyente'),
]

FORMATO_FECHA_CHOICES = [
    ('DD/MM/YYYY', 'DD/MM/YYYY (31/12/2024)'),
    ('MM/DD/YYYY', 'MM/DD/YYYY (12/31/2024)'),
    ('YYYY-MM-DD', 'YYYY-MM-DD (2024-12-31)'),
    ('DD-MM-YYYY', 'DD-MM-YYYY (31-12-2024)'),
]

MONEDA_CHOICES = [
    ('COP', 'Peso Colombiano (COP)'),
    ('USD', 'Dólar Estadounidense (USD)'),
    ('EUR', 'Euro (EUR)'),
]

TIMEZONE_CHOICES = [
    ('America/Bogota', 'Colombia (America/Bogota)'),
    ('America/New_York', 'Este EEUU (America/New_York)'),
    ('America/Los_Angeles', 'Pacífico EEUU (America/Los_Angeles)'),
    ('America/Mexico_City', 'México (America/Mexico_City)'),
    ('Europe/Madrid', 'España (Europe/Madrid)'),
    ('UTC', 'UTC'),
]


# ==============================================================================
# VALIDADORES
# ==============================================================================

def validar_nit_colombiano(value):
    """
    Valida el formato de un NIT colombiano.
    Formato: 9 dígitos + guión + 1 dígito de verificación
    Ejemplo: 900123456-7 o 900.123.456-7
    """
    # Limpiar puntos y espacios
    nit_limpio = re.sub(r'[.\s]', '', value)

    # Patrón: 9 dígitos, guión opcional, 1 dígito de verificación
    patron = r'^\d{9}-?\d$'

    if not re.match(patron, nit_limpio):
        raise ValidationError(
            'El NIT debe tener el formato: 900123456-7 (9 dígitos + dígito de verificación)'
        )

    # Extraer dígitos y dígito de verificación
    nit_sin_guion = nit_limpio.replace('-', '')
    digitos = nit_sin_guion[:-1]
    dv_ingresado = int(nit_sin_guion[-1])

    # Calcular dígito de verificación
    # Algoritmo DIAN: multiplicadores [41, 37, 29, 23, 19, 17, 13, 7, 3]
    multiplicadores = [41, 37, 29, 23, 19, 17, 13, 7, 3]
    suma = sum(int(d) * m for d, m in zip(digitos, multiplicadores))
    residuo = suma % 11

    if residuo == 0:
        dv_calculado = 0
    elif residuo == 1:
        dv_calculado = 1
    else:
        dv_calculado = 11 - residuo

    if dv_ingresado != dv_calculado:
        raise ValidationError(
            f'El dígito de verificación del NIT es incorrecto. '
            f'Debería ser {dv_calculado}, no {dv_ingresado}.'
        )


# ==============================================================================
# MODELO EMPRESA CONFIG
# ==============================================================================
# Modelo requerido por BaseCompanyModel (FK 'configuracion.EmpresaConfig').
# Se crea una instancia por tenant schema en el seed inicial.
# Los datos reales de la empresa están en el modelo Tenant (schema público).
# ==============================================================================

class EmpresaConfig(TimestampedModel):
    """
    Registro de empresa por tenant schema.

    Requerido por BaseCompanyModel como FK para todos los modelos del sistema.
    Se crea automáticamente una instancia en cada tenant al momento del seed.
    Los datos completos de la empresa se gestionan via /api/tenant/tenants/me/.
    """

    nit = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='NIT',
        validators=[validar_nit_colombiano]
    )
    razon_social = models.CharField(
        max_length=250,
        verbose_name='Razón Social',
    )
    separador_miles = models.CharField(
        max_length=1,
        default='.',
        verbose_name='Separador de Miles',
    )
    separador_decimales = models.CharField(
        max_length=1,
        default=',',
        verbose_name='Separador de Decimales',
    )

    class Meta:
        db_table = 'configuracion_empresa'
        verbose_name = 'Configuración de Empresa'
        verbose_name_plural = 'Configuraciones de Empresa'

    def __str__(self):
        return f"{self.razon_social} - NIT: {self.nit}"

    @classmethod
    def get_instance(cls):
        """Obtiene la instancia de configuración del tenant actual."""
        return cls.objects.first()

    @classmethod
    def get_or_create_default(cls):
        """Obtiene o crea instancia con valores por defecto."""
        instance = cls.get_instance()
        if instance:
            return instance, False
        instance = cls(
            nit='000000000-0',
            razon_social='Empresa Sin Configurar',
        )
        instance.save()
        return instance, True


# ==============================================================================
# MODELO TIPO SEDE - 100% DINÁMICO
# ==============================================================================

class TipoSede(TimestampedModel, SoftDeleteModel):
    """
    Tipo de Sede - 100% dinámico y configurable por empresa.

    Ejemplos: Sede Principal, Planta, Almacén, Centro de Acopio, Sucursal, etc.
    Cada empresa puede definir sus propios tipos según su operación.
    """
    code = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del tipo (ej: PLANTA, ALMACEN, SUCURSAL)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del tipo de sede'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Icono',
        help_text='Nombre del icono Lucide (ej: Building, Factory, Warehouse)'
    )
    color = models.CharField(
        max_length=20,
        default='gray',
        verbose_name='Color',
        help_text='Color para identificación visual'
    )
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden'
    )
    es_sistema = models.BooleanField(
        default=False,
        verbose_name='Es del Sistema',
        help_text='Tipos precargados del sistema (no eliminables)'
    )

    # H-SC-10: rol operacional (fusión con ex-tipo_unidad de SedeEmpresa).
    ROL_OPERACIONAL_CHOICES = [
        ('OFICINA', 'Oficina Administrativa'),
        ('PLANTA', 'Planta'),
        ('CENTRO_ACOPIO', 'Centro de Acopio'),
        ('BODEGA', 'Bodega'),
        ('OTRO', 'Otro'),
    ]
    rol_operacional = models.CharField(
        max_length=20,
        choices=ROL_OPERACIONAL_CHOICES,
        default='OTRO',
        verbose_name='Rol operacional',
        help_text=(
            'Rol operativo del tipo de sede. Reemplaza el campo '
            'SedeEmpresa.tipo_unidad (H-SC-10).'
        ),
    )

    class Meta:
        db_table = 'configuracion_tipo_sede'
        verbose_name = 'Tipo de Sede'
        verbose_name_plural = 'Tipos de Sede'
        ordering = ['orden', 'name']

    def __str__(self):
        return self.name

    @classmethod
    def cargar_tipos_sistema(cls):
        """Carga los tipos de sede base del sistema"""
        tipos = [
            {'code': 'SEDE_PRINCIPAL', 'name': 'Sede Principal', 'icon': 'Building2', 'color': 'blue', 'orden': 1},
            {'code': 'SEDE', 'name': 'Sede Administrativa', 'icon': 'Building', 'color': 'gray', 'orden': 2},
            {'code': 'SUCURSAL', 'name': 'Sucursal', 'icon': 'Store', 'color': 'green', 'orden': 3},
            {'code': 'PLANTA', 'name': 'Planta de Producción', 'icon': 'Factory', 'color': 'orange', 'orden': 4},
            {'code': 'CENTRO_ACOPIO', 'name': 'Centro de Acopio', 'icon': 'Container', 'color': 'yellow', 'orden': 5},
            {'code': 'ALMACEN', 'name': 'Almacén', 'icon': 'Warehouse', 'color': 'purple', 'orden': 6},
            {'code': 'BODEGA', 'name': 'Bodega', 'icon': 'Package', 'color': 'cyan', 'orden': 7},
            {'code': 'PUNTO_VENTA', 'name': 'Punto de Venta', 'icon': 'ShoppingBag', 'color': 'pink', 'orden': 8},
            {'code': 'OTRO', 'name': 'Otro', 'icon': 'MapPin', 'color': 'slate', 'orden': 99},
        ]
        creados = 0
        for tipo in tipos:
            obj, created = cls.objects.update_or_create(
                code=tipo['code'],
                defaults={**tipo, 'es_sistema': True, 'is_active': True}
            )
            if created:
                creados += 1
        return creados


# ==============================================================================
# MODELO NORMA ISO - 100% DINÁMICO
# ==============================================================================

class NormaISO(TimestampedModel, SoftDeleteModel):
    """
    Normas ISO y Sistemas de Gestión - 100% dinámico.

    Define las normas ISO y sistemas de gestión aplicables:
    ISO 9001, ISO 14001, ISO 45001, PESV, SG-SST, etc.
    Cada empresa puede agregar normas específicas de su sector.
    """
    code = models.CharField(
        max_length=30,
        unique=True,
        blank=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único autogenerado para normas custom'
    )
    name = models.CharField(
        max_length=150,
        verbose_name='Nombre',
        help_text='Nombre completo de la norma'
    )
    short_name = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Nombre Corto',
        help_text='Nombre abreviado (ej: Calidad, SST)'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    category = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Categoría',
        help_text='Grupo de clasificación (ej: Calidad, Ambiental, SST)'
    )
    version = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Versión/Año',
        help_text='Versión o año de la norma (ej: 2015, 2018)'
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Icono',
        help_text='Nombre del icono Lucide'
    )
    color = models.CharField(
        max_length=20,
        default='blue',
        verbose_name='Color'
    )
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden'
    )
    es_sistema = models.BooleanField(
        default=False,
        verbose_name='Es del Sistema',
        help_text='Normas precargadas del sistema (no eliminables)'
    )

    class Meta:
        db_table = 'configuracion_norma_iso'
        verbose_name = 'Norma ISO / Sistema de Gestión'
        verbose_name_plural = 'Normas ISO / Sistemas de Gestión'
        ordering = ['orden', 'name']

    def __str__(self):
        return f"{self.code} - {self.name}"

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self._generate_code()
        super().save(*args, **kwargs)

    @classmethod
    def _generate_code(cls):
        """Genera código secuencial NORMA-001, NORMA-002, etc."""
        last = cls.objects.filter(code__startswith='NORMA_').order_by('-id').values_list('code', flat=True).first()
        if last:
            try:
                num = int(last.split('_')[1]) + 1
            except (ValueError, IndexError):
                num = cls.objects.count() + 1
        else:
            num = cls.objects.count() + 1
        return f'NORMA_{num:03d}'

    @classmethod
    def cargar_normas_sistema(cls):
        """Carga las normas ISO base del sistema"""
        normas = [
            {'code': 'ISO_9001', 'name': 'ISO 9001:2015 - Gestión de Calidad', 'short_name': 'Calidad', 'category': 'Calidad', 'version': '2015', 'icon': 'Award', 'color': 'blue', 'orden': 1},
            {'code': 'ISO_14001', 'name': 'ISO 14001:2015 - Gestión Ambiental', 'short_name': 'Ambiental', 'category': 'Ambiental', 'version': '2015', 'icon': 'Leaf', 'color': 'green', 'orden': 2},
            {'code': 'ISO_45001', 'name': 'ISO 45001:2018 - Seguridad y Salud en el Trabajo', 'short_name': 'SST', 'category': 'SST', 'version': '2018', 'icon': 'Shield', 'color': 'orange', 'orden': 3},
            {'code': 'ISO_27001', 'name': 'ISO 27001:2022 - Seguridad de la Información', 'short_name': 'Seg. Info.', 'category': 'Seguridad', 'version': '2022', 'icon': 'Lock', 'color': 'purple', 'orden': 4},
            {'code': 'ISO_31000', 'name': 'ISO 31000:2018 - Gestión de Riesgos', 'short_name': 'Riesgos', 'category': 'Riesgos', 'version': '2018', 'icon': 'AlertTriangle', 'color': 'red', 'orden': 5},
            {'code': 'ISO_22000', 'name': 'ISO 22000:2018 - Inocuidad Alimentaria', 'short_name': 'Inocuidad', 'category': 'Alimentario', 'version': '2018', 'icon': 'Utensils', 'color': 'cyan', 'orden': 6},
            {'code': 'PESV', 'name': 'Plan Estratégico de Seguridad Vial', 'short_name': 'PESV', 'category': 'Vial', 'version': '2022', 'icon': 'Car', 'color': 'yellow', 'orden': 10},
            {'code': 'SG_SST', 'name': 'Sistema de Gestión SST (Decreto 1072)', 'short_name': 'SG-SST', 'category': 'SST', 'version': '2015', 'icon': 'HardHat', 'color': 'amber', 'orden': 11},
            {'code': 'SARLAFT', 'name': 'SARLAFT - Lavado de Activos', 'short_name': 'SARLAFT', 'category': 'Cumplimiento', 'version': None, 'icon': 'FileSearch', 'color': 'slate', 'orden': 12},
            {'code': 'PTEE', 'name': 'PTEE - Transparencia y Ética Empresarial', 'short_name': 'PTEE', 'category': 'Cumplimiento', 'version': None, 'icon': 'Scale', 'color': 'indigo', 'orden': 13},
        ]
        creados = 0
        for norma in normas:
            obj, created = cls.objects.update_or_create(
                code=norma['code'],
                defaults={**norma, 'es_sistema': True, 'is_active': True}
            )
            if created:
                creados += 1
        return creados


# ==============================================================================
# MODELO TIPO CAMBIO - 100% DINÁMICO
# ==============================================================================

class TipoCambio(TimestampedModel, SoftDeleteModel):
    """
    Tipo de Cambio Organizacional - 100% dinámico.

    Define los tipos de cambio para gestión de cambios:
    Estratégico, Estructural, Proceso, Tecnológico, Normativo, etc.
    Cada empresa puede definir sus propios tipos de cambio.
    """
    code = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del tipo (ej: ESTRATEGICO, PROCESO)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre del tipo de cambio'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Icono',
        help_text='Nombre del icono Lucide'
    )
    color = models.CharField(
        max_length=20,
        default='blue',
        verbose_name='Color'
    )
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden'
    )
    es_sistema = models.BooleanField(
        default=False,
        verbose_name='Es del Sistema',
        help_text='Tipos precargados del sistema (no eliminables)'
    )

    class Meta:
        db_table = 'configuracion_tipo_cambio'
        verbose_name = 'Tipo de Cambio'
        verbose_name_plural = 'Tipos de Cambio'
        ordering = ['orden', 'name']

    def __str__(self):
        return self.name

    @classmethod
    def cargar_tipos_sistema(cls):
        """Carga los tipos de cambio base del sistema"""
        tipos = [
            {'code': 'ESTRATEGICO', 'name': 'Estratégico', 'icon': 'Target', 'color': 'blue', 'orden': 1, 'description': 'Cambios en la dirección estratégica de la organización'},
            {'code': 'ESTRUCTURAL', 'name': 'Estructural', 'icon': 'Building', 'color': 'purple', 'orden': 2, 'description': 'Cambios en la estructura organizacional'},
            {'code': 'PROCESO', 'name': 'Proceso', 'icon': 'Workflow', 'color': 'green', 'orden': 3, 'description': 'Cambios en procesos operativos o de gestión'},
            {'code': 'TECNOLOGICO', 'name': 'Tecnológico', 'icon': 'Laptop', 'color': 'cyan', 'orden': 4, 'description': 'Cambios en sistemas, herramientas o tecnología'},
            {'code': 'NORMATIVO', 'name': 'Normativo', 'icon': 'Scale', 'color': 'orange', 'orden': 5, 'description': 'Cambios por requisitos legales o normativos'},
            {'code': 'CULTURAL', 'name': 'Cultural', 'icon': 'Users', 'color': 'pink', 'orden': 6, 'description': 'Cambios en la cultura organizacional'},
            {'code': 'AMBIENTAL', 'name': 'Ambiental', 'icon': 'Leaf', 'color': 'emerald', 'orden': 7, 'description': 'Cambios relacionados con gestión ambiental'},
            {'code': 'FINANCIERO', 'name': 'Financiero', 'icon': 'DollarSign', 'color': 'yellow', 'orden': 8, 'description': 'Cambios en políticas o procesos financieros'},
        ]
        creados = 0
        for tipo in tipos:
            obj, created = cls.objects.update_or_create(
                code=tipo['code'],
                defaults={**tipo, 'es_sistema': True, 'is_active': True}
            )
            if created:
                creados += 1
        return creados


# ==============================================================================
# MODELO SEDE EMPRESA
# ==============================================================================

class SedeEmpresa(AuditModel, SoftDeleteModel):
    """
    Sedes y Ubicaciones de la Empresa

    Funcionalidad transversal para gestión multi-sitio.
    Permite asignar recursos (usuarios, vehículos, equipos) a sedes específicas.

    Uso futuro:
    - User.sede_asignada (ForeignKey)
    - Vehiculo.sede_asignada (ForeignKey)
    - Equipo.sede_asignada (ForeignKey)
    - RecepcionMateriaPrima.sede_recepcion (ForeignKey)

    Hereda de AuditModel, SoftDeleteModel:
    - created_at, updated_at (de TimestampedModel vía AuditModel)
    - created_by, updated_by (de AuditModel)
    - is_active, deleted_at (de SoftDeleteModel)
    - soft_delete(), restore(), is_deleted (métodos de SoftDeleteModel)
    """

    # =========================================================================
    # IDENTIFICACIÓN
    # =========================================================================

    codigo = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único autogenerado (ej: SEDE-001)'
    )
    nombre = models.CharField(
        max_length=150,
        verbose_name='Nombre',
        help_text='Nombre de la sede'
    )
    tipo_sede = models.ForeignKey(
        TipoSede,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='sedes',
        verbose_name='Tipo de Sede',
        help_text='Tipo de sede o ubicación'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción detallada de la sede'
    )

    # =========================================================================
    # UBICACIÓN
    # =========================================================================

    direccion = models.TextField(
        blank=True,
        default='',
        verbose_name='Dirección',
        help_text='Dirección física de la sede (opcional para rutas de recolección)',
    )
    # H-SC-10: FK canónica a catálogo core.Ciudad (antes CharField).
    # El departamento se deriva de self.ciudad.departamento (property).
    ciudad = models.ForeignKey(
        'core.Ciudad',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='sedes',
        verbose_name='Ciudad',
    )
    codigo_postal = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        verbose_name='Código Postal'
    )

    # =========================================================================
    # GEOLOCALIZACIÓN
    # =========================================================================

    latitud = models.DecimalField(
        max_digits=10,
        decimal_places=8,
        null=True,
        blank=True,
        verbose_name='Latitud',
        help_text='Coordenada de latitud GPS (ej: 4.60971)'
    )
    longitud = models.DecimalField(
        max_digits=11,
        decimal_places=8,
        null=True,
        blank=True,
        verbose_name='Longitud',
        help_text='Coordenada de longitud GPS (ej: -74.08175)'
    )

    # =========================================================================
    # ADMINISTRACIÓN
    # =========================================================================

    responsable = models.ForeignKey(
        'core.Cargo',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sedes_responsable',
        verbose_name='Responsable',
        help_text='Cargo responsable de la sede'
    )
    telefono = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Teléfono',
        help_text='Teléfono de contacto de la sede'
    )
    email = models.EmailField(
        blank=True,
        null=True,
        verbose_name='Email',
        help_text='Email de contacto de la sede'
    )

    # =========================================================================
    # CONTROL
    # =========================================================================

    es_sede_principal = models.BooleanField(
        default=False,
        verbose_name='Es Sede Principal',
        help_text='Solo puede haber una sede principal'
    )
    fecha_apertura = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Apertura',
        help_text='Fecha de apertura o inicio de operaciones'
    )
    fecha_cierre = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Cierre',
        help_text='Fecha de cierre (si aplica)'
    )

    # =========================================================================
    # ROLES DE LA SEDE
    # =========================================================================
    # H-SC-10: tipo_unidad (CharField con RUTA_RECOLECCION) y es_proveedor_interno
    # fueron ELIMINADOS. El rol operativo ahora vive en TipoSede.rol_operacional.
    # El concepto de "ruta de recolección" se movió a supply_chain.catalogos.RutaRecoleccion.
    es_unidad_negocio = models.BooleanField(
        default=True,
        verbose_name='Es unidad de negocio',
        help_text='Visible para Contabilidad, Presupuesto y Supply Chain como centro de operaciones'
    )
    es_centro_acopio = models.BooleanField(
        default=False,
        verbose_name='Es centro de acopio',
        help_text='Recibe materia prima de proveedores'
    )

    # =========================================================================
    # CAPACIDAD - SISTEMA DINÁMICO (sin hardcoding de unidades)
    # =========================================================================

    capacidad_almacenamiento = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Capacidad de Almacenamiento',
        help_text='Capacidad máxima de almacenamiento (cantidad numérica)'
    )
    unidad_capacidad = models.ForeignKey(
        'catalogo_productos.UnidadMedida',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='sedes_capacidad',
        verbose_name='Unidad de Capacidad',
        help_text='Unidad de medida de la capacidad (ej: kg, ton, m³, pallets)'
    )

    # =========================================================================
    # AUDITORÍA (Todos los campos heredados de AuditModel y SoftDeleteModel)
    # =========================================================================
    # created_at, updated_at: heredados de AuditModel -> TimestampedModel
    # created_by, updated_by: heredados de AuditModel
    # is_active, deleted_at: heredados de SoftDeleteModel

    class Meta:
        db_table = 'configuracion_sede_empresa'
        verbose_name = 'Sede de la Empresa'
        verbose_name_plural = 'Sedes de la Empresa'
        ordering = ['-es_sede_principal', 'nombre']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['is_active', 'tipo_sede']),
            models.Index(fields=['ciudad']),
            models.Index(fields=['deleted_at']),
            models.Index(fields=['es_unidad_negocio']),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.codigo})"

    def save(self, *args, **kwargs):
        if not self.codigo:
            self.codigo = self._generate_code()
        super().save(*args, **kwargs)

    @classmethod
    def _generate_code(cls):
        """Genera código secuencial SEDE-001, SEDE-002, etc."""
        last = cls.objects.order_by('-id').values_list('codigo', flat=True).first()
        if last and last.startswith('SEDE-'):
            try:
                num = int(last.split('-')[1]) + 1
            except (ValueError, IndexError):
                num = cls.objects.count() + 1
        else:
            num = cls.objects.count() + 1
        return f'SEDE-{num:03d}'

    # is_deleted: heredado de SoftDeleteModel como property

    @property
    def tiene_geolocalizacion(self):
        """Verifica si la sede tiene coordenadas GPS configuradas."""
        return self.latitud is not None and self.longitud is not None

    @property
    def departamento(self):
        """
        Nombre del departamento de la ciudad (read-only, derivado).

        H-SC-10: reemplaza el CharField departamento eliminado. La fuente
        de verdad es `ciudad.departamento.nombre`.
        """
        if self.ciudad and self.ciudad.departamento:
            return self.ciudad.departamento.nombre
        return ''

    @property
    def direccion_completa(self):
        """Retorna la dirección completa formateada."""
        partes = []
        if self.direccion:
            partes.append(self.direccion)
        if self.ciudad:
            partes.append(self.ciudad.nombre)
            if self.ciudad.departamento:
                partes.append(self.ciudad.departamento.nombre)
        return ', '.join(partes)

    @property
    def capacidad_formateada(self):
        """
        Retorna la capacidad formateada con su unidad.

        Returns:
            str: Capacidad formateada (ej: "5.2 ton", "1,200 m³") o cadena vacía
        """
        if self.capacidad_almacenamiento is None:
            return ''

        if not self.unidad_capacidad:
            # Sin unidad configurada, mostrar solo el número
            return str(self.capacidad_almacenamiento)

        # Usar el método de formateo de la unidad
        # Los valores regionales ahora vienen del Tenant
        from django.db import connection
        locale_config = None
        if hasattr(connection, 'tenant') and connection.tenant:
            tenant = connection.tenant
            locale_config = {
                'separador_miles': getattr(tenant, 'separador_miles', '.'),
                'separador_decimales': getattr(tenant, 'separador_decimales', ','),
            }

        return self.unidad_capacidad.formatear(
            self.capacidad_almacenamiento,
            incluir_simbolo=True,
            locale_config=locale_config
        )

    def obtener_capacidad_en_unidad(self, unidad_destino):
        """
        Obtiene la capacidad convertida a otra unidad.

        Args:
            unidad_destino (UnidadMedida): Unidad de medida destino

        Returns:
            Decimal: Capacidad en la unidad destino

        Raises:
            ValidationError: Si las unidades no son compatibles
        """
        if self.capacidad_almacenamiento is None or not self.unidad_capacidad:
            return None

        return self.unidad_capacidad.convertir_a(
            self.capacidad_almacenamiento,
            unidad_destino
        )

    # soft_delete(), restore(): heredados de SoftDeleteModel

    def clean(self):
        """Validaciones personalizadas."""
        super().clean()

        # Validar que exista un tenant activo antes de crear sedes
        # (Esta validación ya es implícita en el contexto multi-tenant)

        # Validar que solo haya una sede principal
        if self.es_sede_principal:
            existing = SedeEmpresa.objects.filter(
                es_sede_principal=True
            ).exclude(pk=self.pk).first()
            if existing:
                raise ValidationError({
                    'es_sede_principal': f'Ya existe una sede principal: {existing.nombre}. '
                                         'Solo puede haber una sede principal.'
                })

        # Validar coordenadas GPS (ambas o ninguna)
        if (self.latitud is not None) != (self.longitud is not None):
            raise ValidationError(
                'Debe proporcionar ambas coordenadas (latitud y longitud) o ninguna.'
            )

        # Validar rangos de coordenadas
        if self.latitud is not None:
            if not (-90 <= self.latitud <= 90):
                raise ValidationError({
                    'latitud': 'La latitud debe estar entre -90 y 90 grados.'
                })

        if self.longitud is not None:
            if not (-180 <= self.longitud <= 180):
                raise ValidationError({
                    'longitud': 'La longitud debe estar entre -180 y 180 grados.'
                })

        # Validar fecha de cierre posterior a apertura
        if self.fecha_apertura and self.fecha_cierre:
            if self.fecha_cierre < self.fecha_apertura:
                raise ValidationError({
                    'fecha_cierre': 'La fecha de cierre debe ser posterior a la fecha de apertura.'
                })

        # Validar capacidad positiva
        if self.capacidad_almacenamiento is not None and self.capacidad_almacenamiento < 0:
            raise ValidationError({
                'capacidad_almacenamiento': 'La capacidad de almacenamiento no puede ser negativa.'
            })

    def save(self, *args, **kwargs):
        """Override save para ejecutar validaciones."""
        self.full_clean()
        super().save(*args, **kwargs)

    @classmethod
    def get_sede_principal(cls):
        """Obtiene la sede principal si existe."""
        return cls.objects.filter(es_sede_principal=True, is_active=True).first()

    @classmethod
    def get_sedes_activas(cls):
        """Obtiene todas las sedes activas."""
        return cls.objects.filter(is_active=True, deleted_at__isnull=True)


# ==============================================================================
# MODELO TIPO SERVICIO INTEGRACION - 100% DINÁMICO
# ==============================================================================

class TipoServicioIntegracion(TimestampedModel, SoftDeleteModel):
    """
    Tipo de Servicio de Integración - 100% dinámico.

    Define las categorías de servicios externos:
    Email, SMS, Facturación Electrónica, Almacenamiento, Pagos, etc.
    """
    code = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del tipo (ej: EMAIL, FACTURACION, PAGOS)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del tipo de servicio'
    )
    category = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Categoría',
        help_text='Grupo de clasificación (ej: Comunicación, Financiero, Almacenamiento)'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Icono',
        help_text='Nombre del icono Lucide'
    )
    orden = models.PositiveIntegerField(default=0, verbose_name='Orden')
    es_sistema = models.BooleanField(default=False, verbose_name='Es del Sistema')

    class Meta:
        db_table = 'configuracion_tipo_servicio_integracion'
        verbose_name = 'Tipo de Servicio de Integración'
        verbose_name_plural = 'Tipos de Servicio de Integración'
        ordering = ['orden', 'name']

    def __str__(self):
        return self.name

    @classmethod
    def cargar_tipos_sistema(cls):
        """Carga los tipos de servicio base del sistema"""
        tipos = [
            # Comunicación
            {'code': 'EMAIL', 'name': 'Servicio de Email', 'category': 'Comunicación', 'icon': 'Mail', 'orden': 1},
            {'code': 'SMS', 'name': 'Mensajería SMS', 'category': 'Comunicación', 'icon': 'MessageSquare', 'orden': 2},
            {'code': 'WHATSAPP', 'name': 'Mensajería WhatsApp', 'category': 'Comunicación', 'icon': 'MessageCircle', 'orden': 3},
            {'code': 'NOTIFICACIONES', 'name': 'Notificaciones Push', 'category': 'Comunicación', 'icon': 'Bell', 'orden': 4},
            # Facturación
            {'code': 'FACTURACION', 'name': 'Facturación Electrónica', 'category': 'Tributario', 'icon': 'FileText', 'orden': 10},
            {'code': 'NOMINA', 'name': 'Nómina Electrónica', 'category': 'Tributario', 'icon': 'Users', 'orden': 11},
            {'code': 'RADIAN', 'name': 'RADIAN (Validación Facturas)', 'category': 'Tributario', 'icon': 'CheckCircle', 'orden': 12},
            # Almacenamiento
            {'code': 'ALMACENAMIENTO', 'name': 'Almacenamiento en la Nube', 'category': 'Archivos', 'icon': 'Cloud', 'orden': 20},
            {'code': 'CDN', 'name': 'Content Delivery Network', 'category': 'Archivos', 'icon': 'Globe', 'orden': 21},
            {'code': 'BACKUP', 'name': 'Backup y Recuperación', 'category': 'Archivos', 'icon': 'HardDrive', 'orden': 22},
            # BI
            {'code': 'BI', 'name': 'Business Intelligence', 'category': 'Analítica', 'icon': 'BarChart', 'orden': 30},
            {'code': 'ANALYTICS', 'name': 'Analytics y Métricas', 'category': 'Analítica', 'icon': 'TrendingUp', 'orden': 31},
            # Pagos
            {'code': 'PAGOS', 'name': 'Pasarela de Pagos', 'category': 'Financiero', 'icon': 'CreditCard', 'orden': 40},
            {'code': 'PSE', 'name': 'PSE (Pagos Electrónicos)', 'category': 'Financiero', 'icon': 'Landmark', 'orden': 41},
            {'code': 'BANCARIO', 'name': 'Integración Bancaria', 'category': 'Financiero', 'icon': 'Building', 'orden': 42},
            # Mapas
            {'code': 'MAPAS', 'name': 'Mapas y Geocodificación', 'category': 'Geolocalización', 'icon': 'Map', 'orden': 50},
            {'code': 'RASTREO', 'name': 'Rastreo GPS', 'category': 'Geolocalización', 'icon': 'Navigation', 'orden': 51},
            # Legal
            {'code': 'FIRMA_DIGITAL', 'name': 'Firma Digital Certificada', 'category': 'Legal', 'icon': 'PenTool', 'orden': 60},
            # Cumplimiento
            {'code': 'OFAC', 'name': 'Validación OFAC/Listas Restrictivas', 'category': 'Cumplimiento', 'icon': 'ShieldAlert', 'orden': 61},
            {'code': 'SAGRILAFT', 'name': 'SAGRILAFT/SARLAFT', 'category': 'Cumplimiento', 'icon': 'ShieldCheck', 'orden': 62},
            # Inteligencia Artificial
            {'code': 'IA', 'name': 'Inteligencia Artificial', 'category': 'IA', 'icon': 'Brain', 'orden': 65},
            {'code': 'OCR', 'name': 'Reconocimiento de Documentos (OCR)', 'category': 'IA', 'icon': 'ScanLine', 'orden': 66},
            # ERP/CRM
            {'code': 'ERP', 'name': 'Integración con ERP Externo', 'category': 'Sistemas', 'icon': 'Server', 'orden': 70},
            {'code': 'CRM', 'name': 'Integración con CRM Externo', 'category': 'Sistemas', 'icon': 'UserCheck', 'orden': 71},
            # Otros
            {'code': 'API_TERCEROS', 'name': 'API de Terceros', 'category': 'Otros', 'icon': 'Code', 'orden': 90},
            {'code': 'WEBHOOK', 'name': 'Webhooks', 'category': 'Otros', 'icon': 'Webhook', 'orden': 91},
            {'code': 'OTRO', 'name': 'Otro Servicio', 'category': 'Otros', 'icon': 'MoreHorizontal', 'orden': 99},
        ]
        creados = 0
        for tipo in tipos:
            obj, created = cls.objects.update_or_create(
                code=tipo['code'],
                defaults={**tipo, 'es_sistema': True, 'is_active': True}
            )
            if created:
                creados += 1
        return creados


# ==============================================================================
# MODELO PROVEEDOR INTEGRACION - 100% DINÁMICO
# ==============================================================================

class ProveedorIntegracion(TimestampedModel, SoftDeleteModel):
    """
    Proveedor de Servicios de Integración - 100% dinámico.

    Define los proveedores de servicios externos:
    Gmail, Twilio, AWS, PayU, DIAN, etc.
    """
    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del proveedor (ej: GMAIL, TWILIO, AWS_S3)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre del proveedor'
    )
    tipo_servicio = models.ForeignKey(
        TipoServicioIntegracion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='proveedores',
        verbose_name='Tipo de Servicio Principal',
        help_text='Tipo de servicio principal que ofrece'
    )
    website = models.URLField(
        blank=True,
        null=True,
        verbose_name='Sitio Web'
    )
    documentation_url = models.URLField(
        blank=True,
        null=True,
        verbose_name='URL de Documentación'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    logo = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Logo',
        help_text='Nombre del archivo de logo o URL'
    )
    pais_origen = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='País de Origen'
    )
    orden = models.PositiveIntegerField(default=0, verbose_name='Orden')
    es_sistema = models.BooleanField(default=False, verbose_name='Es del Sistema')

    class Meta:
        db_table = 'configuracion_proveedor_integracion'
        verbose_name = 'Proveedor de Integración'
        verbose_name_plural = 'Proveedores de Integración'
        ordering = ['orden', 'name']

    def __str__(self):
        return self.name

    @classmethod
    def cargar_proveedores_sistema(cls):
        """
        Carga los proveedores base del sistema con su tipo_servicio FK asignado.

        Cada proveedor se vincula a su TipoServicioIntegracion principal.
        Proveedores que sirven múltiples tipos (ej: SIIGO para FACTURACION y NOMINA)
        se asignan al tipo primario más relevante.

        IMPORTANTE: Ejecutar DESPUÉS de TipoServicioIntegracion.cargar_tipos_sistema()
        para que los tipos ya existan en la base de datos.
        """
        # ── Construir lookup de tipos por code ──
        tipos_qs = TipoServicioIntegracion.objects.filter(es_sistema=True)
        tipos_map = {t.code: t for t in tipos_qs}

        def _tipo(code):
            """Retorna la instancia del tipo o None si no existe."""
            return tipos_map.get(code)

        # ── Definición completa de proveedores con tipo_servicio ──
        # Formato: (code, name, pais_origen, tipo_servicio_code, orden)
        # tipo_servicio_code=None para proveedores genéricos (PERSONALIZADO, OTRO)
        proveedores = [
            # ── Comunicación: Email ──
            {'code': 'GMAIL', 'name': 'Gmail / Google Workspace', 'pais_origen': 'USA', 'tipo': 'EMAIL', 'orden': 1},
            {'code': 'OUTLOOK', 'name': 'Outlook / Microsoft 365', 'pais_origen': 'USA', 'tipo': 'EMAIL', 'orden': 2},
            {'code': 'SENDGRID', 'name': 'SendGrid', 'pais_origen': 'USA', 'tipo': 'EMAIL', 'orden': 3},
            {'code': 'SES', 'name': 'Amazon SES', 'pais_origen': 'USA', 'tipo': 'EMAIL', 'orden': 4},
            {'code': 'SMTP_CUSTOM', 'name': 'SMTP Personalizado', 'pais_origen': None, 'tipo': 'EMAIL', 'orden': 5},

            # ── Comunicación: SMS ──
            {'code': 'TWILIO', 'name': 'Twilio', 'pais_origen': 'USA', 'tipo': 'SMS', 'orden': 10},
            {'code': 'MESSAGEBIRD', 'name': 'MessageBird', 'pais_origen': 'Países Bajos', 'tipo': 'SMS', 'orden': 11},
            {'code': 'INFOBIP', 'name': 'Infobip', 'pais_origen': 'Croacia', 'tipo': 'SMS', 'orden': 12},

            # ── Comunicación: WhatsApp ──
            {'code': 'WHATSAPP_BUSINESS', 'name': 'WhatsApp Business API', 'pais_origen': 'USA', 'tipo': 'WHATSAPP', 'orden': 15},

            # ── Comunicación: Notificaciones Push ──
            {'code': 'FIREBASE', 'name': 'Firebase Cloud Messaging', 'pais_origen': 'USA', 'tipo': 'NOTIFICACIONES', 'orden': 18},
            {'code': 'ONESIGNAL', 'name': 'OneSignal', 'pais_origen': 'USA', 'tipo': 'NOTIFICACIONES', 'orden': 19},

            # ── Tributario: Facturación Electrónica ──
            {'code': 'DIAN', 'name': 'DIAN (Directo)', 'pais_origen': 'Colombia', 'tipo': 'FACTURACION', 'orden': 20},
            {'code': 'CARVAJAL', 'name': 'Carvajal Tecnología y Servicios', 'pais_origen': 'Colombia', 'tipo': 'FACTURACION', 'orden': 21},
            {'code': 'SIIGO', 'name': 'Siigo', 'pais_origen': 'Colombia', 'tipo': 'FACTURACION', 'orden': 22},
            {'code': 'ALEGRA', 'name': 'Alegra', 'pais_origen': 'Colombia', 'tipo': 'FACTURACION', 'orden': 23},

            # ── Archivos: Almacenamiento en la Nube ──
            {'code': 'GOOGLE_DRIVE', 'name': 'Google Drive', 'pais_origen': 'USA', 'tipo': 'ALMACENAMIENTO', 'orden': 30},
            {'code': 'AWS_S3', 'name': 'Amazon S3', 'pais_origen': 'USA', 'tipo': 'ALMACENAMIENTO', 'orden': 31},
            {'code': 'AZURE_BLOB', 'name': 'Azure Blob Storage', 'pais_origen': 'USA', 'tipo': 'ALMACENAMIENTO', 'orden': 32},
            {'code': 'GCS', 'name': 'Google Cloud Storage', 'pais_origen': 'USA', 'tipo': 'ALMACENAMIENTO', 'orden': 33},

            # ── Archivos: CDN ──
            {'code': 'CLOUDFLARE', 'name': 'Cloudflare CDN', 'pais_origen': 'USA', 'tipo': 'CDN', 'orden': 36},
            {'code': 'AWS_CLOUDFRONT', 'name': 'Amazon CloudFront', 'pais_origen': 'USA', 'tipo': 'CDN', 'orden': 37},

            # ── Analítica: BI ──
            {'code': 'POWER_BI', 'name': 'Microsoft Power BI', 'pais_origen': 'USA', 'tipo': 'BI', 'orden': 40},
            {'code': 'METABASE', 'name': 'Metabase', 'pais_origen': 'USA', 'tipo': 'BI', 'orden': 41},
            {'code': 'GOOGLE_LOOKER', 'name': 'Google Looker Studio', 'pais_origen': 'USA', 'tipo': 'BI', 'orden': 42},
            {'code': 'GOOGLE_SHEETS', 'name': 'Google Sheets (BI)', 'pais_origen': 'USA', 'tipo': 'BI', 'orden': 43},

            # ── Analítica: Analytics ──
            {'code': 'GOOGLE_ANALYTICS', 'name': 'Google Analytics', 'pais_origen': 'USA', 'tipo': 'ANALYTICS', 'orden': 46},
            {'code': 'MIXPANEL', 'name': 'Mixpanel', 'pais_origen': 'USA', 'tipo': 'ANALYTICS', 'orden': 47},

            # ── Financiero: Pasarela de Pagos ──
            {'code': 'WOMPI', 'name': 'Wompi', 'pais_origen': 'Colombia', 'tipo': 'PAGOS', 'orden': 50},
            {'code': 'PAYU', 'name': 'PayU Latam', 'pais_origen': 'Colombia', 'tipo': 'PAGOS', 'orden': 51},
            {'code': 'MERCADOPAGO', 'name': 'MercadoPago', 'pais_origen': 'Argentina', 'tipo': 'PAGOS', 'orden': 52},

            # ── Financiero: PSE ──
            {'code': 'ACH_COLOMBIA', 'name': 'ACH Colombia', 'pais_origen': 'Colombia', 'tipo': 'PSE', 'orden': 55},
            {'code': 'EVERTEC', 'name': 'Evertec (PlacetoPay)', 'pais_origen': 'Colombia', 'tipo': 'PSE', 'orden': 56},

            # ── Financiero: Bancario ──
            {'code': 'BANCOLOMBIA', 'name': 'Bancolombia', 'pais_origen': 'Colombia', 'tipo': 'BANCARIO', 'orden': 58},
            {'code': 'DAVIVIENDA', 'name': 'Davivienda', 'pais_origen': 'Colombia', 'tipo': 'BANCARIO', 'orden': 59},
            {'code': 'BBVA', 'name': 'BBVA Colombia', 'pais_origen': 'Colombia', 'tipo': 'BANCARIO', 'orden': 60},

            # ── Geolocalización: Mapas ──
            {'code': 'GOOGLE_MAPS', 'name': 'Google Maps Platform', 'pais_origen': 'USA', 'tipo': 'MAPAS', 'orden': 62},
            {'code': 'MAPBOX', 'name': 'Mapbox', 'pais_origen': 'USA', 'tipo': 'MAPAS', 'orden': 63},
            {'code': 'OSM', 'name': 'OpenStreetMap', 'pais_origen': 'Internacional', 'tipo': 'MAPAS', 'orden': 64},

            # ── Geolocalización: Rastreo ──
            {'code': 'RUNT', 'name': 'RUNT (Registro Único Nacional de Tránsito)', 'pais_origen': 'Colombia', 'tipo': 'RASTREO', 'orden': 66},
            {'code': 'MINTRANSPORTE', 'name': 'Ministerio de Transporte', 'pais_origen': 'Colombia', 'tipo': 'RASTREO', 'orden': 67},

            # ── Legal: Firma Digital ──
            {'code': 'CERTICAMARA', 'name': 'Certicámara', 'pais_origen': 'Colombia', 'tipo': 'FIRMA_DIGITAL', 'orden': 70},
            {'code': 'GSE', 'name': 'GSE (Gestión de Seguridad Electrónica)', 'pais_origen': 'Colombia', 'tipo': 'FIRMA_DIGITAL', 'orden': 71},
            {'code': 'ANDES_SCD', 'name': 'Andes SCD', 'pais_origen': 'Colombia', 'tipo': 'FIRMA_DIGITAL', 'orden': 72},

            # ── Cumplimiento: OFAC ──
            {'code': 'DOW_JONES', 'name': 'Dow Jones Risk & Compliance', 'pais_origen': 'USA', 'tipo': 'OFAC', 'orden': 74},
            {'code': 'REFINITIV', 'name': 'Refinitiv World-Check', 'pais_origen': 'UK', 'tipo': 'OFAC', 'orden': 75},

            # ── Cumplimiento: SAGRILAFT ──
            {'code': 'INFOLAFT', 'name': 'Infolaft', 'pais_origen': 'Colombia', 'tipo': 'SAGRILAFT', 'orden': 77},
            {'code': 'TRANSPARENCIA_CO', 'name': 'Transparencia Colombia', 'pais_origen': 'Colombia', 'tipo': 'SAGRILAFT', 'orden': 78},

            # ── IA: Inteligencia Artificial ──
            {'code': 'OPENAI', 'name': 'OpenAI (GPT)', 'pais_origen': 'USA', 'tipo': 'IA', 'orden': 80},
            {'code': 'ANTHROPIC', 'name': 'Anthropic (Claude)', 'pais_origen': 'USA', 'tipo': 'IA', 'orden': 81},
            {'code': 'GOOGLE_AI', 'name': 'Google AI (Gemini)', 'pais_origen': 'USA', 'tipo': 'IA', 'orden': 82},

            # ── IA: OCR ──
            {'code': 'GOOGLE_VISION', 'name': 'Google Cloud Vision', 'pais_origen': 'USA', 'tipo': 'OCR', 'orden': 84},
            {'code': 'AWS_TEXTRACT', 'name': 'Amazon Textract', 'pais_origen': 'USA', 'tipo': 'OCR', 'orden': 85},

            # ── Sistemas: ERP ──
            {'code': 'WORLD_OFFICE', 'name': 'World Office', 'pais_origen': 'Colombia', 'tipo': 'ERP', 'orden': 88},
            {'code': 'SAP', 'name': 'SAP', 'pais_origen': 'Alemania', 'tipo': 'ERP', 'orden': 89},

            # ── Sistemas: CRM ──
            {'code': 'HUBSPOT', 'name': 'HubSpot', 'pais_origen': 'USA', 'tipo': 'CRM', 'orden': 91},
            {'code': 'SALESFORCE', 'name': 'Salesforce', 'pais_origen': 'USA', 'tipo': 'CRM', 'orden': 92},
            {'code': 'ZOHO', 'name': 'Zoho CRM', 'pais_origen': 'India', 'tipo': 'CRM', 'orden': 93},

            # ── Genéricos (tipo_servicio=None, funcionan para cualquier tipo) ──
            {'code': 'PERSONALIZADO', 'name': 'Servicio Personalizado', 'pais_origen': None, 'tipo': None, 'orden': 98},
            {'code': 'OTRO', 'name': 'Otro Proveedor', 'pais_origen': None, 'tipo': None, 'orden': 99},
        ]

        creados = 0
        for prov in proveedores:
            tipo_code = prov.pop('tipo')
            tipo_servicio = _tipo(tipo_code) if tipo_code else None
            obj, created = cls.objects.update_or_create(
                code=prov['code'],
                defaults={
                    **prov,
                    'tipo_servicio': tipo_servicio,
                    'es_sistema': True,
                    'is_active': True,
                }
            )
            if created:
                creados += 1
        return creados


# ==============================================================================
# MODELO INTEGRACION EXTERNA - SERVICIOS EXTERNOS
# ==============================================================================

from cryptography.fernet import Fernet
import json

# Utilidad de cifrado centralizada
from utils.encryption import get_encryption_key


class IntegracionExterna(AuditModel, SoftDeleteModel):
    """
    Integración Externa - Configuración de Servicios Externos

    Gestiona las conexiones con servicios externos como:
    - Email (Gmail, SMTP, SendGrid)
    - Facturación Electrónica (DIAN)
    - Mensajería (SMS, WhatsApp - Twilio, etc.)
    - Almacenamiento (AWS S3, Google Drive, Azure)
    - BI (Power BI, Tableau)
    - Pagos (PayU, MercadoPago, Stripe)
    - ERP externos
    - Firma Digital

    SEGURIDAD: Las credenciales se almacenan ENCRIPTADAS con cryptography.fernet

    Hereda de AuditModel, SoftDeleteModel:
    - created_at, updated_at (de TimestampedModel vía AuditModel)
    - created_by, updated_by (de AuditModel)
    - is_active, deleted_at (de SoftDeleteModel)
    - soft_delete(), restore(), is_deleted (métodos de SoftDeleteModel)
    """

    # =========================================================================
    # MÉTODOS DE AUTENTICACIÓN (estos sí son estándares técnicos fijos)
    # =========================================================================

    METODO_AUTENTICACION_CHOICES = [
        ('API_KEY', 'API Key'),
        ('BEARER_TOKEN', 'Bearer Token'),
        ('OAUTH2', 'OAuth 2.0'),
        ('OAUTH1', 'OAuth 1.0'),
        ('BASIC_AUTH', 'Basic Authentication (Usuario/Contraseña)'),
        ('JWT', 'JSON Web Token (JWT)'),
        ('SERVICE_ACCOUNT', 'Service Account (Cuenta de Servicio)'),
        ('CERTIFICATE', 'Certificado Digital (TLS/SSL Client Certificate)'),
        ('HMAC', 'HMAC Signature'),
        ('CUSTOM', 'Autenticación Personalizada'),
    ]

    # =========================================================================
    # AMBIENTES (estándares fijos)
    # =========================================================================

    AMBIENTE_CHOICES = [
        ('PRODUCCION', 'Producción'),
        ('SANDBOX', 'Sandbox / Pruebas'),
        ('DESARROLLO', 'Desarrollo'),
    ]

    # =========================================================================
    # CAMPOS DE IDENTIFICACIÓN
    # =========================================================================

    nombre = models.CharField(
        max_length=150,
        verbose_name='Nombre',
        help_text='Nombre descriptivo de la integración (ej: "Email Corporativo Gmail")'
    )
    tipo_servicio = models.ForeignKey(
        TipoServicioIntegracion,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='integraciones',
        db_index=True,
        verbose_name='Tipo de Servicio',
        help_text='Categoría del servicio externo'
    )
    proveedor = models.ForeignKey(
        ProveedorIntegracion,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='integraciones',
        db_index=True,
        verbose_name='Proveedor',
        help_text='Proveedor del servicio'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción detallada del propósito de la integración'
    )

    # =========================================================================
    # CONFIGURACIÓN TÉCNICA
    # =========================================================================

    endpoint_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name='URL del Endpoint',
        help_text='URL base de la API del servicio (ej: https://api.servicio.com/v1)'
    )
    metodo_autenticacion = models.CharField(
        max_length=30,
        choices=METODO_AUTENTICACION_CHOICES,
        default='API_KEY',
        verbose_name='Método de Autenticación',
        help_text='Tipo de autenticación utilizado'
    )

    # CAMPO ENCRIPTADO - credenciales
    _credenciales_encrypted = models.TextField(
        blank=True,
        null=True,
        verbose_name='Credenciales (Encriptadas)',
        help_text='Almacena credenciales encriptadas (API keys, tokens, passwords, etc.)',
        db_column='credenciales_encrypted'
    )

    configuracion_adicional = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Configuración Adicional',
        help_text='Parámetros específicos del servicio (timeouts, límites, etc.)'
    )

    # =========================================================================
    # CONTROL Y MONITOREO
    # =========================================================================

    ambiente = models.CharField(
        max_length=20,
        choices=AMBIENTE_CHOICES,
        default='PRODUCCION',
        verbose_name='Ambiente',
        help_text='Ambiente de la integración'
    )
    # is_active: heredado de SoftDeleteModel
    ultima_conexion_exitosa = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Última Conexión Exitosa',
        help_text='Fecha y hora de la última conexión exitosa'
    )
    ultima_falla = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Última Falla',
        help_text='Fecha y hora de la última falla de conexión'
    )
    contador_llamadas = models.IntegerField(
        default=0,
        verbose_name='Contador de Llamadas',
        help_text='Total de llamadas realizadas (para rate limiting)'
    )
    errores_recientes = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Errores Recientes',
        help_text='Lista de los últimos 10 errores con timestamp y detalle'
    )

    # =========================================================================
    # LÍMITES Y ALERTAS
    # =========================================================================

    limite_llamadas_dia = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='Límite de Llamadas por Día',
        help_text='Límite máximo de llamadas permitidas por día (null = sin límite)'
    )
    alerta_porcentaje_limite = models.IntegerField(
        default=80,
        verbose_name='% para Alerta de Límite',
        help_text='Porcentaje del límite para enviar alerta (ej: 80 = alerta al 80%)'
    )

    # =========================================================================
    # AUDITORÍA (Todos los campos heredados de AuditModel y SoftDeleteModel)
    # =========================================================================
    # created_at, updated_at: heredados de AuditModel -> TimestampedModel
    # created_by, updated_by: heredados de AuditModel
    # deleted_at: heredado de SoftDeleteModel

    class Meta:
        db_table = 'configuracion_integracion_externa'
        verbose_name = 'Integración Externa'
        verbose_name_plural = 'Integraciones Externas'
        ordering = ['tipo_servicio', 'nombre']
        indexes = [
            models.Index(fields=['tipo_servicio', 'is_active']),
            models.Index(fields=['proveedor', 'is_active']),
            models.Index(fields=['ambiente']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        tipo_str = self.tipo_servicio.name if self.tipo_servicio else 'Sin Tipo'
        proveedor_str = self.proveedor.name if self.proveedor else 'Sin Proveedor'
        return f"{tipo_str} - {self.nombre} ({proveedor_str})"

    # =========================================================================
    # PROPIEDADES DE ENCRIPTACIÓN (Específicas de IntegracionExterna)
    # =========================================================================

    @property
    def credenciales(self):
        """
        Obtiene las credenciales desencriptadas.

        Returns:
            dict: Diccionario con credenciales desencriptadas
        """
        if not self._credenciales_encrypted:
            return {}

        try:
            fernet = Fernet(get_encryption_key())
            decrypted_bytes = fernet.decrypt(self._credenciales_encrypted.encode())
            return json.loads(decrypted_bytes.decode())
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error al desencriptar credenciales de {self.nombre}: {e}")
            return {}

    @credenciales.setter
    def credenciales(self, value):
        """
        Establece las credenciales y las encripta.

        Args:
            value (dict): Diccionario con credenciales a encriptar
                Ejemplos:
                - API_KEY: {'api_key': 'sk_test_xxxxx'}
                - OAUTH2: {'client_id': 'xxx', 'client_secret': 'yyy', 'refresh_token': 'zzz'}
                - BASIC_AUTH: {'username': 'user', 'password': 'pass'}
                - SERVICE_ACCOUNT: {'service_account_email': 'x@y.com', 'private_key': '...'}
        """
        if not value:
            self._credenciales_encrypted = None
            return

        try:
            fernet = Fernet(get_encryption_key())
            json_bytes = json.dumps(value).encode()
            encrypted_bytes = fernet.encrypt(json_bytes)
            self._credenciales_encrypted = encrypted_bytes.decode()
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error al encriptar credenciales de {self.nombre}: {e}")
            raise ValidationError(f"Error al encriptar credenciales: {e}")

    # =========================================================================
    # PROPIEDADES DE SALUD Y MONITOREO (Específicas de IntegracionExterna)
    # =========================================================================

    @property
    def is_healthy(self):
        """
        Determina si la integración está saludable.

        Criterios:
        - Última conexión exitosa en las últimas 24 horas
        - Sin errores recientes críticos

        Returns:
            bool: True si está saludable
        """
        from django.utils import timezone
        from datetime import timedelta

        if not self.is_active:
            return False

        # Verificar última conexión exitosa
        if self.ultima_conexion_exitosa:
            hace_24h = timezone.now() - timedelta(hours=24)
            if self.ultima_conexion_exitosa > hace_24h:
                # Conexión reciente exitosa
                return True

        # Si hay errores recientes pero no hay conexión exitosa reciente
        if self.errores_recientes and len(self.errores_recientes) > 0:
            return False

        # Si nunca se ha conectado, considerarlo no saludable
        if not self.ultima_conexion_exitosa:
            return False

        return True

    # is_deleted: heredado de SoftDeleteModel como property

    @property
    def porcentaje_uso_limite(self):
        """
        Calcula el porcentaje de uso del límite diario de llamadas.

        Returns:
            float: Porcentaje (0-100) o None si no hay límite
        """
        if not self.limite_llamadas_dia:
            return None

        return (self.contador_llamadas / self.limite_llamadas_dia) * 100

    @property
    def requiere_alerta_limite(self):
        """
        Determina si se debe enviar alerta por acercarse al límite.

        Returns:
            bool: True si el uso está por encima del porcentaje de alerta
        """
        porcentaje = self.porcentaje_uso_limite
        if porcentaje is None:
            return False

        return porcentaje >= self.alerta_porcentaje_limite

    @property
    def status_indicator(self):
        """
        Retorna un indicador de estado para el frontend.

        Returns:
            str: 'success', 'warning', o 'error'
        """
        if not self.is_active:
            return 'error'

        if self.is_healthy:
            return 'success'

        # Si hay errores recientes pero está activo
        if self.errores_recientes and len(self.errores_recientes) > 0:
            return 'warning'

        # Si nunca se ha conectado
        if not self.ultima_conexion_exitosa:
            return 'warning'

        return 'success'

    # =========================================================================
    # MÉTODOS DE GESTIÓN (Específicos de IntegracionExterna)
    # =========================================================================

    def registrar_exito(self):
        """Registra una conexión exitosa."""
        from django.utils import timezone
        self.ultima_conexion_exitosa = timezone.now()
        self.contador_llamadas += 1
        self.save(update_fields=['ultima_conexion_exitosa', 'contador_llamadas', 'updated_at'])

    def registrar_error(self, error_message, error_code=None):
        """
        Registra un error en la integración.

        Args:
            error_message (str): Mensaje de error
            error_code (str, optional): Código de error
        """
        from django.utils import timezone

        self.ultima_falla = timezone.now()

        # Agregar error a la lista de errores recientes
        error_entry = {
            'timestamp': timezone.now().isoformat(),
            'message': str(error_message),
            'code': error_code
        }

        if not isinstance(self.errores_recientes, list):
            self.errores_recientes = []

        self.errores_recientes.insert(0, error_entry)

        # Mantener solo los últimos 10 errores
        self.errores_recientes = self.errores_recientes[:10]

        self.save(update_fields=['ultima_falla', 'errores_recientes', 'updated_at'])

    def limpiar_errores(self):
        """Limpia la lista de errores recientes."""
        self.errores_recientes = []
        self.save(update_fields=['errores_recientes', 'updated_at'])

    def resetear_contador_llamadas(self):
        """Resetea el contador de llamadas (útil para límites diarios)."""
        self.contador_llamadas = 0
        self.save(update_fields=['contador_llamadas', 'updated_at'])

    # soft_delete(), restore(): heredados de SoftDeleteModel
    # NOTA: El restore() de IntegracionExterna no activa automáticamente (requiere validación manual)
    # Si se necesita comportamiento especial, se puede override aquí

    def get_credencial(self, key, default=None):
        """
        Obtiene una credencial específica del diccionario.

        Args:
            key (str): Clave de la credencial
            default: Valor por defecto si no existe

        Returns:
            Valor de la credencial o default
        """
        return self.credenciales.get(key, default)

    def validar_credenciales(self):
        """
        Valida que las credenciales requeridas estén presentes según el método de autenticación.

        Returns:
            tuple: (is_valid, error_message)
        """
        creds = self.credenciales

        if not creds:
            return False, "No se han configurado credenciales"

        # Validaciones según método de autenticación
        validaciones = {
            'API_KEY': ['api_key'],
            'BEARER_TOKEN': ['token'],
            'OAUTH2': ['client_id', 'client_secret'],
            'BASIC_AUTH': ['username', 'password'],
            'JWT': ['secret_key'],
            'SERVICE_ACCOUNT': ['service_account_email', 'private_key'],
            'CERTIFICATE': ['certificate_path', 'private_key_path'],
        }

        campos_requeridos = validaciones.get(self.metodo_autenticacion, [])

        for campo in campos_requeridos:
            if campo not in creds or not creds[campo]:
                return False, f"Falta la credencial requerida: {campo}"

        return True, ""

    def clean(self):
        """Validaciones personalizadas."""
        super().clean()

        # Validar que las credenciales sean válidas si están configuradas
        if self._credenciales_encrypted:
            is_valid, error = self.validar_credenciales()
            if not is_valid:
                raise ValidationError({'credenciales': error})

    def save(self, *args, **kwargs):
        """Override save para ejecutar validaciones."""
        # No ejecutar full_clean si skip_validation está en kwargs
        skip_validation = kwargs.pop('skip_validation', False)
        if not skip_validation:
            self.full_clean()

        super().save(*args, **kwargs)

    # =========================================================================
    # MÉTODOS ESTÁTICOS
    # =========================================================================

    @staticmethod
    def generar_clave_encriptacion():
        """
        Genera una nueva clave de encriptación para usar en .env

        Returns:
            str: Clave de encriptación en formato base64
        """
        return Fernet.generate_key().decode()

    @classmethod
    def obtener_por_tipo(cls, tipo_servicio, activas_only=True):
        """
        Obtiene integraciones por tipo de servicio.

        Args:
            tipo_servicio (str): Tipo de servicio
            activas_only (bool): Si solo retornar integraciones activas

        Returns:
            QuerySet: Integraciones del tipo especificado
        """
        qs = cls.objects.filter(tipo_servicio=tipo_servicio, deleted_at__isnull=True)
        if activas_only:
            qs = qs.filter(is_active=True)
        return qs

    @classmethod
    def obtener_por_proveedor(cls, proveedor, activas_only=True):
        """
        Obtiene integraciones por proveedor.

        Args:
            proveedor (str): Proveedor
            activas_only (bool): Si solo retornar integraciones activas

        Returns:
            QuerySet: Integraciones del proveedor especificado
        """
        qs = cls.objects.filter(proveedor=proveedor, deleted_at__isnull=True)
        if activas_only:
            qs = qs.filter(is_active=True)
        return qs


# ==============================================================================
# MODELO CERTIFICADO DIGITAL - PARA INTEGRACIONES
# ==============================================================================

import os
from django.core.files.storage import default_storage


def certificado_upload_path(instance, filename):
    """
    Genera ruta segura para almacenar certificados.
    Los certificados se almacenan en una carpeta protegida fuera del media público.
    """
    # Sanitizar nombre de archivo
    base, ext = os.path.splitext(filename)
    safe_name = f"{instance.integracion.id}_{base[:20]}{ext}"
    return f"certificados_digitales/{instance.integracion.id}/{safe_name}"


class CertificadoDigital(AuditModel, SoftDeleteModel):
    """
    Certificado Digital para Integraciones Externas

    Gestiona certificados digitales utilizados para:
    - Facturación Electrónica DIAN (.p12, .pfx)
    - Nómina Electrónica
    - Firma Digital de documentos
    - Autenticación TLS/SSL Client Certificate
    - Web Services con certificados

    SEGURIDAD:
    - Los certificados se almacenan en carpeta protegida (no pública)
    - Las contraseñas de los certificados se encriptan con Fernet
    - Se validan fechas de expiración automáticamente

    LIBRERÍAS UTILIZADAS:
    - cryptography: Encriptación de contraseñas y lectura de certificados
    - pyOpenSSL: Validación y extracción de metadata de certificados X.509
    - django-storages (opcional): Para almacenamiento en S3/Azure

    Hereda de AuditModel, SoftDeleteModel:
    - created_at, updated_at, created_by, updated_by
    - is_active, deleted_at, soft_delete(), restore()
    """

    # =========================================================================
    # TIPOS DE CERTIFICADO (estándares técnicos fijos)
    # =========================================================================

    TIPO_CERTIFICADO_CHOICES = [
        ('P12', 'PKCS#12 (.p12/.pfx) - Certificado con clave privada'),
        ('PEM', 'PEM (.pem/.crt) - Certificado X.509'),
        ('DER', 'DER (.der/.cer) - Certificado binario'),
        ('JKS', 'Java KeyStore (.jks) - Almacén Java'),
        ('PFX', 'PFX (.pfx) - Personal Information Exchange'),
    ]

    USO_CERTIFICADO_CHOICES = [
        ('FACTURACION_DIAN', 'Facturación Electrónica DIAN'),
        ('NOMINA_ELECTRONICA', 'Nómina Electrónica'),
        ('FIRMA_DIGITAL', 'Firma Digital de Documentos'),
        ('TLS_CLIENT', 'Autenticación TLS/SSL Client'),
        ('WEB_SERVICE', 'Web Services (SOAP/REST)'),
        ('OTRO', 'Otro uso'),
    ]

    ESTADO_CHOICES = [
        ('ACTIVO', 'Activo'),
        ('PROXIMO_VENCER', 'Próximo a Vencer'),
        ('VENCIDO', 'Vencido'),
        ('REVOCADO', 'Revocado'),
        ('PENDIENTE', 'Pendiente de Validación'),
    ]

    # =========================================================================
    # RELACIÓN CON INTEGRACIÓN
    # =========================================================================

    integracion = models.ForeignKey(
        IntegracionExterna,
        on_delete=models.CASCADE,
        related_name='certificados',
        verbose_name='Integración',
        help_text='Integración externa a la que pertenece este certificado'
    )

    # =========================================================================
    # IDENTIFICACIÓN
    # =========================================================================

    nombre = models.CharField(
        max_length=150,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del certificado (ej: "Certificado DIAN 2025")'
    )
    tipo_certificado = models.CharField(
        max_length=10,
        choices=TIPO_CERTIFICADO_CHOICES,
        default='P12',
        verbose_name='Tipo de Certificado'
    )
    uso = models.CharField(
        max_length=30,
        choices=USO_CERTIFICADO_CHOICES,
        default='FACTURACION_DIAN',
        verbose_name='Uso del Certificado'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )

    # =========================================================================
    # ARCHIVO DEL CERTIFICADO
    # =========================================================================

    archivo = models.FileField(
        upload_to=certificado_upload_path,
        verbose_name='Archivo del Certificado',
        help_text='Archivo .p12, .pfx, .pem, .crt, etc.'
    )

    # Contraseña encriptada del certificado
    _password_encrypted = models.TextField(
        blank=True,
        null=True,
        verbose_name='Contraseña (Encriptada)',
        db_column='password_encrypted',
        help_text='Contraseña del certificado (almacenada encriptada)'
    )

    # =========================================================================
    # METADATA DEL CERTIFICADO (extraída automáticamente)
    # =========================================================================

    serial_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Número de Serie',
        help_text='Número de serie del certificado (extraído automáticamente)'
    )
    subject_cn = models.CharField(
        max_length=250,
        blank=True,
        null=True,
        verbose_name='Subject (CN)',
        help_text='Common Name del sujeto del certificado'
    )
    issuer_cn = models.CharField(
        max_length=250,
        blank=True,
        null=True,
        verbose_name='Emisor (CN)',
        help_text='Common Name del emisor del certificado'
    )
    fecha_emision = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Emisión',
        help_text='Fecha desde la cual el certificado es válido'
    )
    fecha_expiracion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Expiración',
        help_text='Fecha hasta la cual el certificado es válido'
    )
    huella_digital = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Huella Digital (SHA-256)',
        help_text='Fingerprint SHA-256 del certificado'
    )

    # =========================================================================
    # CONTROL Y ESTADO
    # =========================================================================

    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='PENDIENTE',
        verbose_name='Estado'
    )
    dias_alerta_vencimiento = models.PositiveIntegerField(
        default=30,
        verbose_name='Días para Alerta',
        help_text='Días antes del vencimiento para generar alerta'
    )
    ultima_validacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Última Validación',
        help_text='Fecha de la última validación del certificado'
    )
    notas = models.TextField(
        blank=True,
        null=True,
        verbose_name='Notas',
        help_text='Notas adicionales sobre el certificado'
    )

    class Meta:
        db_table = 'configuracion_certificado_digital'
        verbose_name = 'Certificado Digital'
        verbose_name_plural = 'Certificados Digitales'
        ordering = ['-fecha_expiracion', 'nombre']
        indexes = [
            models.Index(fields=['integracion', 'is_active']),
            models.Index(fields=['estado', 'fecha_expiracion']),
            models.Index(fields=['uso']),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.get_tipo_certificado_display()})"

    # =========================================================================
    # PROPIEDADES DE CONTRASEÑA ENCRIPTADA
    # =========================================================================

    @property
    def password(self):
        """Obtiene la contraseña desencriptada del certificado."""
        if not self._password_encrypted:
            return None

        try:
            fernet = Fernet(get_encryption_key())
            decrypted_bytes = fernet.decrypt(self._password_encrypted.encode())
            return decrypted_bytes.decode()
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error al desencriptar password de certificado {self.nombre}: {e}")
            return None

    @password.setter
    def password(self, value):
        """Establece y encripta la contraseña del certificado."""
        if not value:
            self._password_encrypted = None
            return

        try:
            fernet = Fernet(get_encryption_key())
            encrypted_bytes = fernet.encrypt(value.encode())
            self._password_encrypted = encrypted_bytes.decode()
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error al encriptar password de certificado {self.nombre}: {e}")
            raise ValidationError(f"Error al encriptar contraseña: {e}")

    # =========================================================================
    # PROPIEDADES DE ESTADO
    # =========================================================================

    @property
    def dias_para_vencer(self):
        """Calcula los días restantes hasta el vencimiento."""
        if not self.fecha_expiracion:
            return None

        from django.utils import timezone
        delta = self.fecha_expiracion - timezone.now()
        return delta.days

    @property
    def esta_vencido(self):
        """Verifica si el certificado está vencido."""
        dias = self.dias_para_vencer
        if dias is None:
            return False
        return dias < 0

    @property
    def proximo_a_vencer(self):
        """Verifica si el certificado está próximo a vencer."""
        dias = self.dias_para_vencer
        if dias is None:
            return False
        return 0 <= dias <= self.dias_alerta_vencimiento

    @property
    def status_color(self):
        """Retorna el color de estado para el frontend."""
        if self.estado == 'VENCIDO' or self.esta_vencido:
            return 'red'
        if self.estado == 'REVOCADO':
            return 'gray'
        if self.estado == 'PROXIMO_VENCER' or self.proximo_a_vencer:
            return 'yellow'
        if self.estado == 'PENDIENTE':
            return 'blue'
        return 'green'

    # =========================================================================
    # MÉTODOS DE VALIDACIÓN Y EXTRACCIÓN
    # =========================================================================

    def extraer_metadata(self):
        """
        Extrae metadata del certificado usando cryptography/pyOpenSSL.

        Returns:
            dict: Metadata extraída del certificado
        """
        if not self.archivo:
            return {'error': 'No hay archivo de certificado'}

        try:
            from cryptography import x509
            from cryptography.hazmat.primitives.serialization import pkcs12
            from cryptography.hazmat.backends import default_backend
            import hashlib

            # Leer el archivo
            file_content = self.archivo.read()
            self.archivo.seek(0)  # Reset file pointer

            metadata = {}

            if self.tipo_certificado in ['P12', 'PFX']:
                # PKCS#12 format
                password_bytes = self.password.encode() if self.password else None

                try:
                    private_key, certificate, additional_certs = pkcs12.load_key_and_certificates(
                        file_content,
                        password_bytes,
                        default_backend()
                    )

                    if certificate:
                        # Extraer información del certificado
                        metadata['serial_number'] = str(certificate.serial_number)
                        metadata['subject_cn'] = certificate.subject.rfc4514_string()
                        metadata['issuer_cn'] = certificate.issuer.rfc4514_string()
                        metadata['fecha_emision'] = certificate.not_valid_before_utc
                        metadata['fecha_expiracion'] = certificate.not_valid_after_utc

                        # Calcular huella digital SHA-256
                        fingerprint = hashlib.sha256(certificate.public_bytes(
                            serialization.Encoding.DER
                        )).hexdigest().upper()
                        metadata['huella_digital'] = ':'.join(
                            fingerprint[i:i+2] for i in range(0, len(fingerprint), 2)
                        )

                except Exception as e:
                    metadata['error'] = f"Error al leer PKCS#12: {str(e)}"

            elif self.tipo_certificado in ['PEM', 'DER']:
                # Certificado X.509
                try:
                    if self.tipo_certificado == 'PEM':
                        certificate = x509.load_pem_x509_certificate(
                            file_content, default_backend()
                        )
                    else:
                        certificate = x509.load_der_x509_certificate(
                            file_content, default_backend()
                        )

                    metadata['serial_number'] = str(certificate.serial_number)
                    metadata['subject_cn'] = certificate.subject.rfc4514_string()
                    metadata['issuer_cn'] = certificate.issuer.rfc4514_string()
                    metadata['fecha_emision'] = certificate.not_valid_before_utc
                    metadata['fecha_expiracion'] = certificate.not_valid_after_utc

                except Exception as e:
                    metadata['error'] = f"Error al leer certificado: {str(e)}"

            return metadata

        except ImportError:
            return {'error': 'cryptography library no instalada. Ejecutar: pip install cryptography'}
        except Exception as e:
            return {'error': str(e)}

    def validar_y_actualizar_metadata(self):
        """
        Valida el certificado y actualiza la metadata automáticamente.

        Returns:
            tuple: (success, message)
        """
        from django.utils import timezone

        metadata = self.extraer_metadata()

        if 'error' in metadata:
            return False, metadata['error']

        # Actualizar campos con metadata extraída
        self.serial_number = metadata.get('serial_number')
        self.subject_cn = metadata.get('subject_cn')
        self.issuer_cn = metadata.get('issuer_cn')
        self.fecha_emision = metadata.get('fecha_emision')
        self.fecha_expiracion = metadata.get('fecha_expiracion')
        self.huella_digital = metadata.get('huella_digital')
        self.ultima_validacion = timezone.now()

        # Actualizar estado basado en fechas
        if self.esta_vencido:
            self.estado = 'VENCIDO'
        elif self.proximo_a_vencer:
            self.estado = 'PROXIMO_VENCER'
        else:
            self.estado = 'ACTIVO'

        self.save()
        return True, "Certificado validado correctamente"

    def clean(self):
        """Validaciones personalizadas."""
        super().clean()

        # Validar que el archivo tenga extensión correcta
        if self.archivo:
            ext = os.path.splitext(self.archivo.name)[1].lower()
            extensiones_validas = {
                'P12': ['.p12', '.pfx'],
                'PFX': ['.p12', '.pfx'],
                'PEM': ['.pem', '.crt', '.cer'],
                'DER': ['.der', '.cer'],
                'JKS': ['.jks'],
            }
            validas = extensiones_validas.get(self.tipo_certificado, [])
            if validas and ext not in validas:
                raise ValidationError({
                    'archivo': f'El archivo debe tener extensión {", ".join(validas)} para tipo {self.tipo_certificado}'
                })

    def save(self, *args, **kwargs):
        """Override save para ejecutar validaciones."""
        self.full_clean()
        super().save(*args, **kwargs)

    @classmethod
    def obtener_proximos_a_vencer(cls, dias=30):
        """
        Obtiene certificados que vencen en los próximos N días.

        Args:
            dias (int): Días para considerar como "próximo a vencer"

        Returns:
            QuerySet: Certificados próximos a vencer
        """
        from django.utils import timezone
        from datetime import timedelta

        fecha_limite = timezone.now() + timedelta(days=dias)
        return cls.objects.filter(
            is_active=True,
            deleted_at__isnull=True,
            fecha_expiracion__lte=fecha_limite,
            fecha_expiracion__gte=timezone.now()
        ).order_by('fecha_expiracion')


# ==============================================================================
# MODELO ICON REGISTRY - SISTEMA DINAMICO DE ICONOS
# ==============================================================================

ICON_CATEGORY_CHOICES = [
    ('VALORES', 'Valores Corporativos'),
    ('NORMAS', 'Normas y Sistemas'),
    ('ACCIONES', 'Acciones y Botones'),
    ('ESTADOS', 'Estados y Status'),
    ('NAVEGACION', 'Navegacion'),
    ('DOCUMENTOS', 'Documentos'),
    ('COMUNICACION', 'Comunicacion'),
    ('PERSONAS', 'Personas y Equipos'),
    ('FINANZAS', 'Finanzas'),
    ('RIESGOS', 'Riesgos y Alertas'),
    ('GENERAL', 'Uso General'),
]


class IconRegistry(TimestampedModel, SoftDeleteModel):
    """
    Registro de Iconos Disponibles - 100% dinamico.

    Define los iconos de Lucide disponibles en el sistema,
    categorizados para facilitar la seleccion en formularios.
    Permite agregar nuevos iconos sin modificar el frontend.
    """
    name = models.CharField(
        max_length=50,
        db_index=True,
        verbose_name='Nombre del Icono',
        help_text='Nombre exacto del icono en Lucide (ej: Heart, Shield, Star)'
    )
    label = models.CharField(
        max_length=100,
        verbose_name='Etiqueta',
        help_text='Nombre amigable para mostrar al usuario (ej: Corazon, Escudo)'
    )
    category = models.CharField(
        max_length=30,
        choices=ICON_CATEGORY_CHOICES,
        default='GENERAL',
        db_index=True,
        verbose_name='Categoria',
        help_text='Categoria para agrupar iconos en el selector'
    )
    description = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Descripcion',
        help_text='Descripcion o contexto de uso del icono'
    )
    keywords = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Palabras Clave',
        help_text='Palabras clave para busqueda (separadas por coma)'
    )
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden',
        help_text='Orden de aparicion en el selector'
    )
    es_sistema = models.BooleanField(
        default=False,
        verbose_name='Es del Sistema',
        help_text='Iconos precargados del sistema (no eliminables)'
    )

    class Meta:
        db_table = 'configuracion_icon_registry'
        verbose_name = 'Icono del Sistema'
        verbose_name_plural = 'Iconos del Sistema'
        ordering = ['category', 'orden', 'label']
        indexes = [
            models.Index(fields=['category', 'orden']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['name', 'category'],
                name='unique_icon_per_category'
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.label})"

    @classmethod
    def cargar_iconos_sistema(cls):
        """Carga los iconos base del sistema para diferentes contextos"""
        iconos = [
            # Valores Corporativos
            {'name': 'Heart', 'label': 'Corazon', 'category': 'VALORES', 'keywords': 'amor,pasion,compromiso', 'orden': 1},
            {'name': 'Shield', 'label': 'Escudo', 'category': 'VALORES', 'keywords': 'proteccion,seguridad,defensa', 'orden': 2},
            {'name': 'Star', 'label': 'Estrella', 'category': 'VALORES', 'keywords': 'excelencia,calidad,destacado', 'orden': 3},
            {'name': 'Users', 'label': 'Equipo', 'category': 'VALORES', 'keywords': 'trabajo en equipo,colaboracion,personas', 'orden': 4},
            {'name': 'Zap', 'label': 'Rayo', 'category': 'VALORES', 'keywords': 'energia,rapidez,dinamismo', 'orden': 5},
            {'name': 'Target', 'label': 'Objetivo', 'category': 'VALORES', 'keywords': 'meta,enfoque,precision', 'orden': 6},
            {'name': 'Award', 'label': 'Premio', 'category': 'VALORES', 'keywords': 'reconocimiento,logro,merito', 'orden': 7},
            {'name': 'Lightbulb', 'label': 'Idea', 'category': 'VALORES', 'keywords': 'innovacion,creatividad,solucion', 'orden': 8},
            {'name': 'HeartHandshake', 'label': 'Acuerdo', 'category': 'VALORES', 'keywords': 'compromiso,trato,confianza', 'orden': 9},
            {'name': 'Scale', 'label': 'Balanza', 'category': 'VALORES', 'keywords': 'justicia,equilibrio,equidad', 'orden': 10},
            {'name': 'Leaf', 'label': 'Hoja', 'category': 'VALORES', 'keywords': 'ambiente,naturaleza,sostenibilidad', 'orden': 11},
            {'name': 'Globe', 'label': 'Globo', 'category': 'VALORES', 'keywords': 'global,mundo,internacional', 'orden': 12},
            {'name': 'Clock', 'label': 'Reloj', 'category': 'VALORES', 'keywords': 'tiempo,puntualidad,eficiencia', 'orden': 13},
            {'name': 'CheckCircle', 'label': 'Verificado', 'category': 'VALORES', 'keywords': 'cumplimiento,aprobado,correcto', 'orden': 14},
            {'name': 'TrendingUp', 'label': 'Crecimiento', 'category': 'VALORES', 'keywords': 'mejora,progreso,avance', 'orden': 15},
            {'name': 'Gem', 'label': 'Gema', 'category': 'VALORES', 'keywords': 'valor,calidad,excelencia', 'orden': 16},
            {'name': 'Sparkles', 'label': 'Brillos', 'category': 'VALORES', 'keywords': 'excelencia,destacado,especial', 'orden': 17},
            {'name': 'Rocket', 'label': 'Cohete', 'category': 'VALORES', 'keywords': 'innovacion,impulso,lanzamiento', 'orden': 18},

            # Normas y Sistemas de Gestion
            {'name': 'Award', 'label': 'Certificacion', 'category': 'NORMAS', 'keywords': 'iso,certificado,calidad', 'orden': 1},
            {'name': 'FileCheck', 'label': 'Documento Verificado', 'category': 'NORMAS', 'keywords': 'auditoria,cumplimiento', 'orden': 2},
            {'name': 'ClipboardCheck', 'label': 'Lista Verificada', 'category': 'NORMAS', 'keywords': 'checklist,control', 'orden': 3},
            {'name': 'Car', 'label': 'Vehiculo', 'category': 'NORMAS', 'keywords': 'pesv,transporte,flota', 'orden': 4},
            {'name': 'HardHat', 'label': 'Casco', 'category': 'NORMAS', 'keywords': 'sst,seguridad,proteccion', 'orden': 5},
            {'name': 'Lock', 'label': 'Candado', 'category': 'NORMAS', 'keywords': 'seguridad,informacion,privacidad', 'orden': 6},

            # Estados y Status
            {'name': 'CircleDot', 'label': 'En Progreso', 'category': 'ESTADOS', 'keywords': 'activo,procesando', 'orden': 1},
            {'name': 'CheckCircle2', 'label': 'Completado', 'category': 'ESTADOS', 'keywords': 'terminado,listo,aprobado', 'orden': 2},
            {'name': 'XCircle', 'label': 'Cancelado', 'category': 'ESTADOS', 'keywords': 'rechazado,error,fallido', 'orden': 3},
            {'name': 'Clock', 'label': 'Pendiente', 'category': 'ESTADOS', 'keywords': 'espera,programado', 'orden': 4},
            {'name': 'AlertTriangle', 'label': 'Alerta', 'category': 'ESTADOS', 'keywords': 'advertencia,atencion', 'orden': 5},
            {'name': 'AlertCircle', 'label': 'Informacion', 'category': 'ESTADOS', 'keywords': 'info,aviso', 'orden': 6},

            # Riesgos
            {'name': 'AlertTriangle', 'label': 'Riesgo', 'category': 'RIESGOS', 'keywords': 'peligro,advertencia', 'orden': 1},
            {'name': 'ShieldAlert', 'label': 'Alerta Seguridad', 'category': 'RIESGOS', 'keywords': 'vulnerabilidad,amenaza', 'orden': 2},
            {'name': 'Flame', 'label': 'Incendio', 'category': 'RIESGOS', 'keywords': 'fuego,emergencia', 'orden': 3},
            {'name': 'Droplets', 'label': 'Derrame', 'category': 'RIESGOS', 'keywords': 'liquido,contaminacion', 'orden': 4},
            {'name': 'Skull', 'label': 'Peligro Mortal', 'category': 'RIESGOS', 'keywords': 'fatal,critico', 'orden': 5},

            # Personas
            {'name': 'User', 'label': 'Usuario', 'category': 'PERSONAS', 'keywords': 'persona,perfil', 'orden': 1},
            {'name': 'Users', 'label': 'Usuarios', 'category': 'PERSONAS', 'keywords': 'grupo,equipo', 'orden': 2},
            {'name': 'UserCheck', 'label': 'Usuario Verificado', 'category': 'PERSONAS', 'keywords': 'aprobado,activo', 'orden': 3},
            {'name': 'UserX', 'label': 'Usuario Inactivo', 'category': 'PERSONAS', 'keywords': 'deshabilitado,bloqueado', 'orden': 4},
            {'name': 'UserPlus', 'label': 'Agregar Usuario', 'category': 'PERSONAS', 'keywords': 'nuevo,registrar', 'orden': 5},

            # Documentos
            {'name': 'File', 'label': 'Archivo', 'category': 'DOCUMENTOS', 'keywords': 'documento,paper', 'orden': 1},
            {'name': 'FileText', 'label': 'Documento Texto', 'category': 'DOCUMENTOS', 'keywords': 'texto,contenido', 'orden': 2},
            {'name': 'FileCheck', 'label': 'Documento Aprobado', 'category': 'DOCUMENTOS', 'keywords': 'verificado,firmado', 'orden': 3},
            {'name': 'FilePlus', 'label': 'Nuevo Documento', 'category': 'DOCUMENTOS', 'keywords': 'crear,agregar', 'orden': 4},
            {'name': 'FileX', 'label': 'Documento Eliminado', 'category': 'DOCUMENTOS', 'keywords': 'borrado,obsoleto', 'orden': 5},
            {'name': 'Folder', 'label': 'Carpeta', 'category': 'DOCUMENTOS', 'keywords': 'directorio,categoria', 'orden': 6},

            # General
            {'name': 'Settings', 'label': 'Configuracion', 'category': 'GENERAL', 'keywords': 'ajustes,opciones', 'orden': 1},
            {'name': 'Search', 'label': 'Buscar', 'category': 'GENERAL', 'keywords': 'encontrar,filtrar', 'orden': 2},
            {'name': 'Plus', 'label': 'Agregar', 'category': 'GENERAL', 'keywords': 'nuevo,crear', 'orden': 3},
            {'name': 'Trash2', 'label': 'Eliminar', 'category': 'GENERAL', 'keywords': 'borrar,quitar', 'orden': 4},
            {'name': 'Edit', 'label': 'Editar', 'category': 'GENERAL', 'keywords': 'modificar,cambiar', 'orden': 5},
            {'name': 'Eye', 'label': 'Ver', 'category': 'GENERAL', 'keywords': 'visualizar,mostrar', 'orden': 6},
            {'name': 'Download', 'label': 'Descargar', 'category': 'GENERAL', 'keywords': 'bajar,exportar', 'orden': 7},
            {'name': 'Upload', 'label': 'Subir', 'category': 'GENERAL', 'keywords': 'cargar,importar', 'orden': 8},
            {'name': 'RefreshCw', 'label': 'Actualizar', 'category': 'GENERAL', 'keywords': 'refrescar,recargar', 'orden': 9},
            {'name': 'Save', 'label': 'Guardar', 'category': 'GENERAL', 'keywords': 'almacenar,grabar', 'orden': 10},
        ]

        creados = 0
        for icono in iconos:
            obj, created = cls.objects.update_or_create(
                name=icono['name'],
                category=icono['category'],
                defaults={**icono, 'es_sistema': True, 'is_active': True}
            )
            if created:
                creados += 1
        return creados

    @classmethod
    def obtener_por_categoria(cls, categoria):
        """Obtiene iconos activos de una categoria especifica"""
        return cls.objects.filter(
            category=categoria,
            is_active=True,
            deleted_at__isnull=True
        ).order_by('orden', 'label')

    @classmethod
    def buscar(cls, query):
        """Busca iconos por nombre, etiqueta o palabras clave"""
        from django.db.models import Q
        return cls.objects.filter(
            Q(name__icontains=query) |
            Q(label__icontains=query) |
            Q(keywords__icontains=query),
            is_active=True,
            deleted_at__isnull=True
        ).order_by('category', 'orden')


# ==============================================================================
# TIPO DE CONTRATO — Plantillas de contratos laborales
# ==============================================================================

class TipoContrato(BaseCompanyModel, OrderedModel):
    """
    Plantilla de contrato laboral.

    CST Art. 37-47. Obligatorio antes del primer empleado.
    Fundación Tab 4: Mis Políticas y Reglamentos → Contratos Tipo.
    """
    class TipoContratoChoices(models.TextChoices):
        TERMINO_FIJO = 'TERMINO_FIJO', 'Contrato a Término Fijo'
        INDEFINIDO = 'INDEFINIDO', 'Contrato a Término Indefinido'
        OBRA_LABOR = 'OBRA_LABOR', 'Contrato por Obra o Labor'
        PRESTACION_SERVICIOS = 'PRESTACION_SERVICIOS', 'Prestación de Servicios'
        APRENDIZAJE = 'APRENDIZAJE', 'Contrato de Aprendizaje'

    nombre = models.CharField(max_length=200, verbose_name='Nombre')
    tipo = models.CharField(
        max_length=30,
        choices=TipoContratoChoices.choices,
        verbose_name='Tipo de Contrato'
    )
    descripcion = models.TextField(blank=True, verbose_name='Descripción')
    clausulas_principales = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Cláusulas Principales',
        help_text='Lista de cláusulas tipo del contrato (JSON array)'
    )
    duracion_default_dias = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Duración por Defecto (días)',
        help_text='Duración estándar del contrato en días. Null para indefinido.'
    )
    periodo_prueba_dias = models.PositiveIntegerField(
        default=0,
        verbose_name='Período de Prueba (días)',
        help_text='CST Art. 76-80. Máximo 2 meses.'
    )
    requiere_poliza = models.BooleanField(
        default=False,
        verbose_name='Requiere Póliza',
        help_text='Indica si el contrato requiere póliza de cumplimiento'
    )
    plantilla_documento = models.FileField(
        upload_to='contratos/plantillas/',
        blank=True,
        null=True,
        verbose_name='Plantilla del Documento',
        help_text='Archivo Word/PDF con la plantilla del contrato'
    )
    notas_legales = models.TextField(
        blank=True,
        verbose_name='Notas Legales',
        help_text='Observaciones legales o normativas aplicables'
    )

    class Meta:
        db_table = 'gestion_estrategica_tipocontrato'
        verbose_name = 'Tipo de Contrato'
        verbose_name_plural = 'Tipos de Contrato'
        ordering = ['empresa', 'orden', 'nombre']
        unique_together = ['empresa', 'tipo', 'nombre']

    def __str__(self):
        return f"{self.nombre} ({self.get_tipo_display()})"


# ==============================================================================
# UnidadNegocio ELIMINADO — Unificado con SedeEmpresa (v5.2.0)
# Cross-module refs usan SedeEmpresa.id donde antes usaban UnidadNegocio.id
# Supply Chain: campo unidad_negocio_id ahora apunta a SedeEmpresa
# ==============================================================================
