"""
Modelos del módulo Configuración - Dirección Estratégica
Sistema de Gestión Grasas y Huesos del Norte

Define:
- EmpresaConfig: Datos fiscales y legales de la empresa (Singleton)
"""
from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
import re


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
# MODELO EMPRESA CONFIG (SINGLETON)
# ==============================================================================

class EmpresaConfig(models.Model):
    """
    Configuración de Datos Fiscales y Legales de la Empresa

    Modelo Singleton: Solo puede existir un registro en la base de datos.
    Almacena toda la información fiscal, legal y de configuración regional
    de la empresa para uso en reportes, certificados y documentos oficiales.
    """

    # =========================================================================
    # DATOS DE IDENTIFICACIÓN FISCAL
    # =========================================================================

    nit = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='NIT',
        help_text='Número de Identificación Tributaria (ej: 900123456-7)',
        validators=[validar_nit_colombiano]
    )
    razon_social = models.CharField(
        max_length=250,
        verbose_name='Razón Social',
        help_text='Nombre legal completo de la empresa'
    )
    nombre_comercial = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Nombre Comercial',
        help_text='Nombre comercial o de fantasía (opcional)'
    )
    representante_legal = models.CharField(
        max_length=200,
        verbose_name='Representante Legal',
        help_text='Nombre completo del representante legal'
    )
    cedula_representante = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Cédula del Representante',
        help_text='Número de cédula del representante legal'
    )
    tipo_sociedad = models.CharField(
        max_length=30,
        choices=TIPO_SOCIEDAD_CHOICES,
        default='SAS',
        verbose_name='Tipo de Sociedad',
        help_text='Tipo de persona jurídica'
    )
    actividad_economica = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        verbose_name='Actividad Económica (CIIU)',
        help_text='Código de Clasificación Industrial Internacional Uniforme'
    )
    descripcion_actividad = models.CharField(
        max_length=300,
        blank=True,
        null=True,
        verbose_name='Descripción de Actividad',
        help_text='Descripción de la actividad económica principal'
    )
    regimen_tributario = models.CharField(
        max_length=30,
        choices=REGIMEN_TRIBUTARIO_CHOICES,
        default='COMUN',
        verbose_name='Régimen Tributario',
        help_text='Régimen tributario de la empresa'
    )

    # =========================================================================
    # DATOS DE CONTACTO OFICIAL
    # =========================================================================

    direccion_fiscal = models.TextField(
        verbose_name='Dirección Fiscal',
        help_text='Dirección fiscal completa'
    )
    ciudad = models.CharField(
        max_length=100,
        verbose_name='Ciudad'
    )
    departamento = models.CharField(
        max_length=50,
        choices=DEPARTAMENTOS_COLOMBIA,
        verbose_name='Departamento'
    )
    pais = models.CharField(
        max_length=100,
        default='Colombia',
        verbose_name='País'
    )
    codigo_postal = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        verbose_name='Código Postal'
    )
    telefono_principal = models.CharField(
        max_length=20,
        verbose_name='Teléfono Principal',
        help_text='Teléfono fijo o móvil principal'
    )
    telefono_secundario = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Teléfono Secundario'
    )
    email_corporativo = models.EmailField(
        verbose_name='Email Corporativo',
        help_text='Email institucional de la empresa'
    )
    sitio_web = models.URLField(
        blank=True,
        null=True,
        verbose_name='Sitio Web'
    )

    # =========================================================================
    # DATOS DE REGISTRO
    # =========================================================================

    matricula_mercantil = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Matrícula Mercantil',
        help_text='Número de matrícula en Cámara de Comercio'
    )
    camara_comercio = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Cámara de Comercio',
        help_text='Cámara de Comercio donde está registrada'
    )
    fecha_constitucion = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de Constitución',
        help_text='Fecha de constitución de la sociedad'
    )
    fecha_inscripcion_registro = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de Inscripción en Registro',
        help_text='Fecha de inscripción en el registro mercantil'
    )

    # =========================================================================
    # CONFIGURACIÓN REGIONAL
    # =========================================================================

    zona_horaria = models.CharField(
        max_length=50,
        choices=TIMEZONE_CHOICES,
        default='America/Bogota',
        verbose_name='Zona Horaria'
    )
    formato_fecha = models.CharField(
        max_length=20,
        choices=FORMATO_FECHA_CHOICES,
        default='DD/MM/YYYY',
        verbose_name='Formato de Fecha'
    )
    moneda = models.CharField(
        max_length=3,
        choices=MONEDA_CHOICES,
        default='COP',
        verbose_name='Moneda'
    )
    simbolo_moneda = models.CharField(
        max_length=5,
        default='$',
        verbose_name='Símbolo de Moneda'
    )
    separador_miles = models.CharField(
        max_length=1,
        default='.',
        verbose_name='Separador de Miles',
        help_text='Carácter para separar miles (. o ,)'
    )
    separador_decimales = models.CharField(
        max_length=1,
        default=',',
        verbose_name='Separador de Decimales',
        help_text='Carácter para separar decimales (. o ,)'
    )

    # =========================================================================
    # AUDITORÍA
    # =========================================================================

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Última Actualización'
    )
    updated_by = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='empresa_config_updates',
        verbose_name='Actualizado por',
        help_text='Usuario que realizó la última actualización'
    )

    class Meta:
        db_table = 'configuracion_empresa'
        verbose_name = 'Configuración de Empresa'
        verbose_name_plural = 'Configuración de Empresa'

    def __str__(self):
        return f"{self.razon_social} - NIT: {self.nit}"

    def save(self, *args, **kwargs):
        """
        Override save para garantizar que solo exista un registro (Singleton).
        """
        # Si ya existe un registro y no es este, lanzar error
        existing = EmpresaConfig.objects.exclude(pk=self.pk).first()
        if existing:
            raise ValidationError(
                'Ya existe una configuración de empresa. '
                'Solo puede haber un registro. Use get_instance() para obtenerlo.'
            )

        # Formatear NIT antes de guardar
        if self.nit:
            self.nit = self._formatear_nit(self.nit)

        super().save(*args, **kwargs)

    def clean(self):
        """Validaciones adicionales."""
        super().clean()

        # Validar que separador de miles y decimales sean diferentes
        if self.separador_miles == self.separador_decimales:
            raise ValidationError({
                'separador_decimales': 'El separador de decimales debe ser diferente al de miles.'
            })

    @staticmethod
    def _formatear_nit(nit):
        """Formatea el NIT al formato estándar: 900123456-7"""
        # Limpiar todo excepto dígitos
        solo_digitos = re.sub(r'\D', '', nit)

        if len(solo_digitos) == 10:
            return f"{solo_digitos[:9]}-{solo_digitos[9]}"

        return nit

    @classmethod
    def get_instance(cls):
        """
        Obtiene la única instancia de configuración de empresa.

        Returns:
            EmpresaConfig: La instancia existente o None si no existe.
        """
        return cls.objects.first()

    @classmethod
    def get_or_create_default(cls):
        """
        Obtiene la instancia existente o crea una con valores por defecto.

        Returns:
            tuple: (instance, created) donde created es True si se creó nueva.
        """
        instance = cls.get_instance()
        if instance:
            return instance, False

        # Crear instancia con valores mínimos por defecto
        instance = cls(
            nit='000000000-0',
            razon_social='Empresa Sin Configurar',
            representante_legal='Por Definir',
            direccion_fiscal='Por Definir',
            ciudad='Bogotá',
            departamento='CUNDINAMARCA',
            telefono_principal='0000000',
            email_corporativo='configurar@empresa.com',
        )
        instance.save()
        return instance, True

    @property
    def nit_sin_dv(self):
        """Retorna el NIT sin el dígito de verificación."""
        if self.nit:
            return self.nit.split('-')[0]
        return None

    @property
    def digito_verificacion(self):
        """Retorna el dígito de verificación del NIT."""
        if self.nit and '-' in self.nit:
            return self.nit.split('-')[1]
        return None

    @property
    def direccion_completa(self):
        """Retorna la dirección completa formateada."""
        partes = [self.direccion_fiscal]
        if self.ciudad:
            partes.append(self.ciudad)
        if self.departamento:
            # Obtener nombre display del departamento
            for code, name in DEPARTAMENTOS_COLOMBIA:
                if code == self.departamento:
                    partes.append(name)
                    break
        if self.pais and self.pais != 'Colombia':
            partes.append(self.pais)
        return ', '.join(partes)

    def formatear_valor(self, valor):
        """
        Formatea un valor numérico según la configuración regional.

        Args:
            valor: Número a formatear

        Returns:
            str: Valor formateado con símbolo de moneda
        """
        try:
            # Formatear con separadores
            entero = int(valor)
            decimal = valor - entero

            # Formatear parte entera con separador de miles
            entero_str = f"{entero:,}".replace(',', self.separador_miles)

            if decimal > 0:
                decimal_str = f"{decimal:.2f}"[2:]  # Obtener solo decimales
                return f"{self.simbolo_moneda} {entero_str}{self.separador_decimales}{decimal_str}"

            return f"{self.simbolo_moneda} {entero_str}"
        except (ValueError, TypeError):
            return str(valor)


# ==============================================================================
# MODELO SEDE EMPRESA
# ==============================================================================

TIPO_SEDE_CHOICES = [
    ('SEDE_PRINCIPAL', 'Sede Principal'),
    ('SEDE', 'Sede Administrativa'),
    ('SUCURSAL', 'Sucursal'),
    ('PLANTA', 'Planta de Producción'),
    ('CENTRO_ACOPIO', 'Centro de Acopio'),
    ('ALMACEN', 'Almacén'),
    ('PUNTO_VENTA', 'Punto de Venta'),
    ('BODEGA', 'Bodega'),
    ('OTRO', 'Otro'),
]


class SedeEmpresa(models.Model):
    """
    Sedes y Ubicaciones de la Empresa

    Funcionalidad transversal para gestión multi-sitio.
    Permite asignar recursos (usuarios, vehículos, equipos) a sedes específicas.

    Uso futuro:
    - User.sede_asignada (ForeignKey)
    - Vehiculo.sede_asignada (ForeignKey)
    - Equipo.sede_asignada (ForeignKey)
    - RecepcionMateriaPrima.sede_recepcion (ForeignKey)
    """

    # =========================================================================
    # IDENTIFICACIÓN
    # =========================================================================

    codigo = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de la sede (ej: SEDE-001, PLANTA-BOG)'
    )
    nombre = models.CharField(
        max_length=150,
        verbose_name='Nombre',
        help_text='Nombre de la sede'
    )
    tipo_sede = models.CharField(
        max_length=20,
        choices=TIPO_SEDE_CHOICES,
        default='SEDE',
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
        verbose_name='Dirección',
        help_text='Dirección física de la sede'
    )
    ciudad = models.CharField(
        max_length=100,
        verbose_name='Ciudad'
    )
    departamento = models.CharField(
        max_length=50,
        choices=DEPARTAMENTOS_COLOMBIA,
        verbose_name='Departamento'
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
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sedes_responsable',
        verbose_name='Responsable',
        help_text='Usuario responsable de la sede'
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
    capacidad_almacenamiento_kg = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Capacidad de Almacenamiento (kg)',
        help_text='Capacidad máxima de almacenamiento en kilogramos'
    )

    # =========================================================================
    # AUDITORÍA
    # =========================================================================

    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
        help_text='Si la sede está activa'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Última Actualización'
    )
    created_by = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sedes_creadas',
        verbose_name='Creado por'
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Eliminación',
        help_text='Fecha de eliminación lógica (soft delete)'
    )

    class Meta:
        db_table = 'configuracion_sede_empresa'
        verbose_name = 'Sede de la Empresa'
        verbose_name_plural = 'Sedes de la Empresa'
        ordering = ['-es_sede_principal', 'nombre']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['is_active', 'tipo_sede']),
            models.Index(fields=['departamento', 'ciudad']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.codigo})"

    @property
    def is_deleted(self):
        """Verifica si la sede está eliminada lógicamente."""
        return self.deleted_at is not None

    @property
    def tiene_geolocalizacion(self):
        """Verifica si la sede tiene coordenadas GPS configuradas."""
        return self.latitud is not None and self.longitud is not None

    @property
    def direccion_completa(self):
        """Retorna la dirección completa formateada."""
        partes = [self.direccion]
        if self.ciudad:
            partes.append(self.ciudad)
        if self.departamento:
            for code, name in DEPARTAMENTOS_COLOMBIA:
                if code == self.departamento:
                    partes.append(name)
                    break
        return ', '.join(partes)

    def soft_delete(self):
        """Eliminación lógica de la sede."""
        from django.utils import timezone
        self.deleted_at = timezone.now()
        self.is_active = False
        self.save(update_fields=['deleted_at', 'is_active', 'updated_at'])

    def restore(self):
        """Restaura una sede eliminada lógicamente."""
        self.deleted_at = None
        self.is_active = True
        self.save(update_fields=['deleted_at', 'is_active', 'updated_at'])

    def clean(self):
        """Validaciones personalizadas."""
        super().clean()

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
        if self.capacidad_almacenamiento_kg is not None and self.capacidad_almacenamiento_kg < 0:
            raise ValidationError({
                'capacidad_almacenamiento_kg': 'La capacidad de almacenamiento no puede ser negativa.'
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
# MODELO INTEGRACION EXTERNA - SERVICIOS EXTERNOS
# ==============================================================================

from cryptography.fernet import Fernet
from django.conf import settings
import json


# Clave de encriptación - DEBE estar en settings.py o .env
# Generar con: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Clave fija SOLO para desarrollo - NUNCA usar en producción
# Esta clave permite que los datos encriptados persistan entre reinicios del servidor
DEV_ENCRYPTION_KEY = 'ZGV2X2tleV9ET19OT1RfVVNFX0lOX1BST0RVQ1RJT04='


def get_encryption_key():
    """
    Obtiene la clave de encriptación desde .env o usa clave de desarrollo.

    IMPORTANTE: En producción DEBE configurarse ENCRYPTION_KEY en .env
    Generar con: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    """
    from decouple import config

    # Intentar obtener desde .env
    encryption_key = config('ENCRYPTION_KEY', default=None)

    if not encryption_key:
        # ADVERTENCIA: Esto es solo para desarrollo
        # En producción DEBE estar en .env
        import warnings
        warnings.warn(
            "ENCRYPTION_KEY no configurada en .env. Usando clave de desarrollo. "
            "Configure ENCRYPTION_KEY en .env antes de ir a producción.",
            RuntimeWarning
        )
        # Usar clave fija de desarrollo (no generar una nueva cada vez)
        encryption_key = DEV_ENCRYPTION_KEY

    return encryption_key.encode() if isinstance(encryption_key, str) else encryption_key


class IntegracionExterna(models.Model):
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
    """

    # =========================================================================
    # TIPOS DE SERVICIO
    # =========================================================================

    TIPO_SERVICIO_CHOICES = [
        # Comunicación
        ('EMAIL', 'Servicio de Email'),
        ('SMS', 'Mensajería SMS'),
        ('WHATSAPP', 'Mensajería WhatsApp'),
        ('NOTIFICACIONES', 'Notificaciones Push'),

        # Facturación y Tributario
        ('FACTURACION', 'Facturación Electrónica'),
        ('NOMINA', 'Nómina Electrónica'),
        ('RADIAN', 'RADIAN (Validación Facturas)'),

        # Almacenamiento y Archivos
        ('ALMACENAMIENTO', 'Almacenamiento en la Nube'),
        ('CDN', 'Content Delivery Network'),
        ('BACKUP', 'Backup y Recuperación'),

        # Inteligencia de Negocios
        ('BI', 'Business Intelligence'),
        ('ANALYTICS', 'Analytics y Métricas'),
        ('REPORTES', 'Generación de Reportes'),

        # Pagos y Financiero
        ('PAGOS', 'Pasarela de Pagos'),
        ('PSE', 'PSE (Pagos Electrónicos)'),
        ('BANCARIO', 'Integración Bancaria'),

        # Mapas y Geolocalización
        ('MAPAS', 'Mapas y Geocodificación'),
        ('RASTREO', 'Rastreo GPS'),

        # Firmas y Legal
        ('FIRMA_DIGITAL', 'Firma Digital Certificada'),

        # ERP y CRM
        ('ERP', 'Integración con ERP Externo'),
        ('CRM', 'Integración con CRM Externo'),

        # Otros
        ('API_TERCEROS', 'API de Terceros'),
        ('WEBHOOK', 'Webhooks'),
        ('OTRO', 'Otro Servicio'),
    ]

    # =========================================================================
    # PROVEEDORES COMUNES
    # =========================================================================

    PROVEEDOR_CHOICES = [
        # Email
        ('GMAIL', 'Gmail / Google Workspace'),
        ('OUTLOOK', 'Outlook / Microsoft 365'),
        ('SENDGRID', 'SendGrid'),
        ('MAILGUN', 'Mailgun'),
        ('SES', 'Amazon SES'),

        # SMS y WhatsApp
        ('TWILIO', 'Twilio'),
        ('INFOBIP', 'Infobip'),
        ('MESSAGEBIRD', 'MessageBird'),

        # Facturación Electrónica Colombia
        ('DIAN', 'DIAN (Directo)'),
        ('CARVAJAL', 'Carvajal Tecnología y Servicios'),
        ('EDICOM', 'EDICOM'),
        ('SIIGO', 'Siigo'),
        ('ALEGRA', 'Alegra'),

        # Almacenamiento
        ('AWS_S3', 'Amazon S3'),
        ('GOOGLE_DRIVE', 'Google Drive'),
        ('DROPBOX', 'Dropbox'),
        ('AZURE_BLOB', 'Azure Blob Storage'),
        ('ONEDRIVE', 'OneDrive'),

        # BI
        ('POWER_BI', 'Microsoft Power BI'),
        ('TABLEAU', 'Tableau'),
        ('LOOKER', 'Looker / Google Data Studio'),
        ('METABASE', 'Metabase'),

        # Pagos
        ('PAYU', 'PayU Latam'),
        ('MERCADOPAGO', 'MercadoPago'),
        ('STRIPE', 'Stripe'),
        ('WOMPI', 'Wompi'),
        ('EVERTEC', 'Evertec (PlacetoPay)'),

        # Mapas
        ('GOOGLE_MAPS', 'Google Maps Platform'),
        ('MAPBOX', 'Mapbox'),
        ('HERE', 'HERE Technologies'),

        # Firma Digital
        ('CERTICAMARA', 'Certicámara'),
        ('GSE', 'GSE (Gobierno en Línea)'),
        ('ANDES_SCD', 'Andes SCD'),

        # Otro
        ('PERSONALIZADO', 'Servicio Personalizado'),
        ('OTRO', 'Otro Proveedor'),
    ]

    # =========================================================================
    # MÉTODOS DE AUTENTICACIÓN
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
    # AMBIENTES
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
    tipo_servicio = models.CharField(
        max_length=30,
        choices=TIPO_SERVICIO_CHOICES,
        db_index=True,
        verbose_name='Tipo de Servicio',
        help_text='Categoría del servicio externo'
    )
    proveedor = models.CharField(
        max_length=50,
        choices=PROVEEDOR_CHOICES,
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
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
        help_text='Si la integración está activa y puede usarse'
    )
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
    # AUDITORÍA
    # =========================================================================

    created_by = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='integraciones_creadas',
        verbose_name='Creado por'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Última Actualización'
    )
    updated_by = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='integraciones_actualizadas',
        verbose_name='Actualizado por'
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Eliminación',
        help_text='Fecha de eliminación lógica (soft delete)'
    )

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
        return f"{self.get_tipo_servicio_display()} - {self.nombre} ({self.get_proveedor_display()})"

    # =========================================================================
    # PROPIEDADES DE ENCRIPTACIÓN
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
    # PROPIEDADES DE SALUD Y MONITOREO
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

    @property
    def is_deleted(self):
        """Verifica si la integración está eliminada lógicamente."""
        return self.deleted_at is not None

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
    # MÉTODOS DE GESTIÓN
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

    def soft_delete(self):
        """Eliminación lógica de la integración."""
        from django.utils import timezone
        self.deleted_at = timezone.now()
        self.is_active = False
        self.save(update_fields=['deleted_at', 'is_active', 'updated_at'])

    def restore(self):
        """Restaura una integración eliminada lógicamente."""
        self.deleted_at = None
        # No activar automáticamente, requiere validación manual
        self.save(update_fields=['deleted_at', 'updated_at'])

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
