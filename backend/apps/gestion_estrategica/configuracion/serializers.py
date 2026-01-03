"""
Serializers del módulo Configuración - Dirección Estratégica
Sistema de Gestión StrateKaz

Define serializers para:
- EmpresaConfig: Datos fiscales y legales de la empresa
- SedeEmpresa: Sedes y ubicaciones de la empresa
"""
from rest_framework import serializers
from .models import (
    EmpresaConfig,
    SedeEmpresa,
    DEPARTAMENTOS_COLOMBIA,
    TIPO_SOCIEDAD_CHOICES,
    REGIMEN_TRIBUTARIO_CHOICES,
    FORMATO_FECHA_CHOICES,
    MONEDA_CHOICES,
    TIMEZONE_CHOICES,
    TIPO_SEDE_CHOICES,
)
from .models_unidades import UnidadMedida


class EmpresaConfigSerializer(serializers.ModelSerializer):
    """
    Serializer para EmpresaConfig

    Incluye campos computados y choices para el frontend
    """

    # Campos de solo lectura computados
    nit_sin_dv = serializers.CharField(read_only=True)
    digito_verificacion = serializers.CharField(read_only=True)
    direccion_completa = serializers.CharField(read_only=True)

    # Display names para campos con choices
    tipo_sociedad_display = serializers.CharField(
        source='get_tipo_sociedad_display',
        read_only=True
    )
    regimen_tributario_display = serializers.CharField(
        source='get_regimen_tributario_display',
        read_only=True
    )
    departamento_display = serializers.CharField(
        source='get_departamento_display',
        read_only=True
    )
    zona_horaria_display = serializers.CharField(
        source='get_zona_horaria_display',
        read_only=True
    )
    formato_fecha_display = serializers.CharField(
        source='get_formato_fecha_display',
        read_only=True
    )
    moneda_display = serializers.CharField(
        source='get_moneda_display',
        read_only=True
    )

    # Usuario que actualizó
    updated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = EmpresaConfig
        fields = [
            'id',
            # Datos de identificación fiscal
            'nit',
            'nit_sin_dv',
            'digito_verificacion',
            'razon_social',
            'nombre_comercial',
            'representante_legal',
            'cedula_representante',
            'tipo_sociedad',
            'tipo_sociedad_display',
            'actividad_economica',
            'descripcion_actividad',
            'regimen_tributario',
            'regimen_tributario_display',
            # Datos de contacto
            'direccion_fiscal',
            'direccion_completa',
            'ciudad',
            'departamento',
            'departamento_display',
            'pais',
            'codigo_postal',
            'telefono_principal',
            'telefono_secundario',
            'email_corporativo',
            'sitio_web',
            # Datos de registro
            'matricula_mercantil',
            'camara_comercio',
            'fecha_constitucion',
            'fecha_inscripcion_registro',
            # Configuración regional
            'zona_horaria',
            'zona_horaria_display',
            'formato_fecha',
            'formato_fecha_display',
            'moneda',
            'moneda_display',
            'simbolo_moneda',
            'separador_miles',
            'separador_decimales',
            # Auditoría
            'created_at',
            'updated_at',
            'updated_by',
            'updated_by_name',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'nit_sin_dv',
            'digito_verificacion',
            'direccion_completa',
        ]

    def get_updated_by_name(self, obj):
        """Retorna el nombre completo del usuario que actualizó"""
        if obj.updated_by:
            return obj.updated_by.get_full_name() or obj.updated_by.username
        return None

    def validate_nit(self, value):
        """
        Validación adicional del NIT.
        El validador del modelo ya verifica el formato y dígito de verificación.
        """
        if not value:
            raise serializers.ValidationError('El NIT es requerido.')
        return value

    def validate(self, attrs):
        """Validaciones a nivel de objeto"""
        # Validar separadores diferentes
        sep_miles = attrs.get('separador_miles', self.instance.separador_miles if self.instance else '.')
        sep_dec = attrs.get('separador_decimales', self.instance.separador_decimales if self.instance else ',')

        if sep_miles == sep_dec:
            raise serializers.ValidationError({
                'separador_decimales': 'El separador de decimales debe ser diferente al de miles.'
            })

        return attrs

    def update(self, instance, validated_data):
        """Override para registrar el usuario que actualiza"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['updated_by'] = request.user
        return super().update(instance, validated_data)

    def create(self, validated_data):
        """Override para registrar el usuario que crea"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['updated_by'] = request.user
        return super().create(validated_data)


class EmpresaConfigChoicesSerializer(serializers.Serializer):
    """
    Serializer para exponer las opciones de choices al frontend
    Útil para poblar selects y dropdowns
    """
    departamentos = serializers.SerializerMethodField()
    tipos_sociedad = serializers.SerializerMethodField()
    regimenes_tributarios = serializers.SerializerMethodField()
    formatos_fecha = serializers.SerializerMethodField()
    monedas = serializers.SerializerMethodField()
    zonas_horarias = serializers.SerializerMethodField()

    def get_departamentos(self, obj):
        return [{'value': code, 'label': name} for code, name in DEPARTAMENTOS_COLOMBIA]

    def get_tipos_sociedad(self, obj):
        return [{'value': code, 'label': name} for code, name in TIPO_SOCIEDAD_CHOICES]

    def get_regimenes_tributarios(self, obj):
        return [{'value': code, 'label': name} for code, name in REGIMEN_TRIBUTARIO_CHOICES]

    def get_formatos_fecha(self, obj):
        return [{'value': code, 'label': name} for code, name in FORMATO_FECHA_CHOICES]

    def get_monedas(self, obj):
        return [{'value': code, 'label': name} for code, name in MONEDA_CHOICES]

    def get_zonas_horarias(self, obj):
        return [{'value': code, 'label': name} for code, name in TIMEZONE_CHOICES]


# ==============================================================================
# SERIALIZERS DE SEDE EMPRESA
# ==============================================================================

class SedeEmpresaSerializer(serializers.ModelSerializer):
    """
    Serializer para SedeEmpresa

    Incluye campos computados y display names para el frontend
    """

    # Campos computados de solo lectura
    direccion_completa = serializers.CharField(read_only=True)
    tiene_geolocalizacion = serializers.BooleanField(read_only=True)
    is_deleted = serializers.BooleanField(read_only=True)
    capacidad_formateada = serializers.CharField(read_only=True)

    # Display names
    tipo_sede_display = serializers.CharField(
        source='get_tipo_sede_display',
        read_only=True
    )
    departamento_display = serializers.CharField(
        source='get_departamento_display',
        read_only=True
    )

    # Información del responsable
    responsable_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    # Unidad de capacidad - display
    unidad_capacidad_display = serializers.SerializerMethodField()

    class Meta:
        model = SedeEmpresa
        fields = [
            'id',
            # Identificación
            'codigo',
            'nombre',
            'tipo_sede',
            'tipo_sede_display',
            'descripcion',
            # Ubicación
            'direccion',
            'direccion_completa',
            'ciudad',
            'departamento',
            'departamento_display',
            'codigo_postal',
            # Geolocalización
            'latitud',
            'longitud',
            'tiene_geolocalizacion',
            # Administración
            'responsable',
            'responsable_name',
            'telefono',
            'email',
            # Control
            'es_sede_principal',
            'fecha_apertura',
            'fecha_cierre',
            # Capacidad - Sistema dinámico multi-industria
            'capacidad_almacenamiento',
            'unidad_capacidad',
            'unidad_capacidad_display',
            'capacidad_formateada',
            # DEPRECATED: Mantener para compatibilidad temporal
            'capacidad_almacenamiento_kg',
            # Auditoría
            'is_active',
            'is_deleted',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'deleted_at',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'deleted_at',
            'direccion_completa',
            'tiene_geolocalizacion',
            'is_deleted',
            'capacidad_formateada',
            'unidad_capacidad_display',
        ]

    def get_unidad_capacidad_display(self, obj):
        """Retorna el nombre de la unidad de capacidad"""
        if obj.unidad_capacidad:
            return f"{obj.unidad_capacidad.nombre} ({obj.unidad_capacidad.simbolo})"
        return None

    def get_responsable_name(self, obj):
        """Retorna el nombre completo del responsable"""
        if obj.responsable:
            return obj.responsable.get_full_name() or obj.responsable.username
        return None

    def get_created_by_name(self, obj):
        """Retorna el nombre del usuario que creó la sede"""
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None

    def validate(self, attrs):
        """Validaciones a nivel de objeto"""
        # Validar coordenadas GPS (ambas o ninguna)
        latitud = attrs.get('latitud')
        longitud = attrs.get('longitud')

        if self.instance:
            # En update, usar valores existentes si no se proporcionan nuevos
            if latitud is None and 'latitud' not in attrs:
                latitud = self.instance.latitud
            if longitud is None and 'longitud' not in attrs:
                longitud = self.instance.longitud

        if (latitud is not None) != (longitud is not None):
            raise serializers.ValidationError(
                'Debe proporcionar ambas coordenadas (latitud y longitud) o ninguna.'
            )

        # Validar rangos de coordenadas
        if latitud is not None and not (-90 <= latitud <= 90):
            raise serializers.ValidationError({
                'latitud': 'La latitud debe estar entre -90 y 90 grados.'
            })

        if longitud is not None and not (-180 <= longitud <= 180):
            raise serializers.ValidationError({
                'longitud': 'La longitud debe estar entre -180 y 180 grados.'
            })

        # Validar fecha de cierre
        fecha_apertura = attrs.get('fecha_apertura')
        fecha_cierre = attrs.get('fecha_cierre')

        if self.instance:
            if fecha_apertura is None and 'fecha_apertura' not in attrs:
                fecha_apertura = self.instance.fecha_apertura
            if fecha_cierre is None and 'fecha_cierre' not in attrs:
                fecha_cierre = self.instance.fecha_cierre

        if fecha_apertura and fecha_cierre and fecha_cierre < fecha_apertura:
            raise serializers.ValidationError({
                'fecha_cierre': 'La fecha de cierre debe ser posterior a la fecha de apertura.'
            })

        # Validar sede principal única
        es_sede_principal = attrs.get('es_sede_principal', False)
        if es_sede_principal:
            existing = SedeEmpresa.objects.filter(es_sede_principal=True)
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                sede_existente = existing.first()
                raise serializers.ValidationError({
                    'es_sede_principal': f'Ya existe una sede principal: {sede_existente.nombre}. '
                                         'Solo puede haber una sede principal.'
                })

        return attrs

    def create(self, validated_data):
        """Override para registrar el usuario que crea"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)


class SedeEmpresaListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listados de sedes
    """
    tipo_sede_display = serializers.CharField(
        source='get_tipo_sede_display',
        read_only=True
    )
    departamento_display = serializers.CharField(
        source='get_departamento_display',
        read_only=True
    )
    responsable_name = serializers.SerializerMethodField()

    class Meta:
        model = SedeEmpresa
        fields = [
            'id',
            'codigo',
            'nombre',
            'tipo_sede',
            'tipo_sede_display',
            'ciudad',
            'departamento_display',
            'responsable',
            'responsable_name',
            'es_sede_principal',
            'is_active',
        ]

    def get_responsable_name(self, obj):
        if obj.responsable:
            return obj.responsable.get_full_name() or obj.responsable.username
        return None


class SedeEmpresaChoicesSerializer(serializers.Serializer):
    """
    Serializer para exponer las opciones de choices de SedeEmpresa al frontend

    Incluye:
    - Tipos de sede
    - Departamentos de Colombia
    - Unidades de capacidad disponibles (sistema dinámico multi-industria)
    """
    tipos_sede = serializers.SerializerMethodField()
    departamentos = serializers.SerializerMethodField()
    unidades_capacidad = serializers.SerializerMethodField()
    unidad_capacidad_default = serializers.SerializerMethodField()

    def get_tipos_sede(self, obj):
        return [{'value': code, 'label': name} for code, name in TIPO_SEDE_CHOICES]

    def get_departamentos(self, obj):
        return [{'value': code, 'label': name} for code, name in DEPARTAMENTOS_COLOMBIA]

    def get_unidades_capacidad(self, obj):
        """Retorna las unidades de medida disponibles para capacidad (MASA, VOLUMEN, CONTENEDOR)"""
        categorias_capacidad = ['MASA', 'VOLUMEN', 'CONTENEDOR']
        unidades = UnidadMedida.objects.filter(
            categoria__in=categorias_capacidad,
            is_active=True,
            deleted_at__isnull=True
        ).order_by('categoria', 'orden_display', 'nombre')

        return [
            {
                'value': u.id,
                'label': f"{u.nombre} ({u.simbolo})",
                'simbolo': u.simbolo,
                'categoria': u.categoria,
            }
            for u in unidades
        ]

    def get_unidad_capacidad_default(self, obj):
        """Retorna la unidad de capacidad por defecto de la empresa"""
        empresa_config = EmpresaConfig.get_instance()
        if empresa_config and empresa_config.unidad_capacidad_default:
            u = empresa_config.unidad_capacidad_default
            return {
                'value': u.id,
                'label': f"{u.nombre} ({u.simbolo})",
                'simbolo': u.simbolo,
            }
        return None


# ==============================================================================
# SERIALIZERS DE INTEGRACION EXTERNA
# ==============================================================================

from .models import IntegracionExterna


class IntegracionExternaSerializer(serializers.ModelSerializer):
    """
    Serializer completo para IntegracionExterna

    Incluye:
    - Todos los campos del modelo
    - Credenciales enmascaradas para seguridad
    - Campos computados (is_healthy, status_indicator)
    - Display names para choices
    """

    # Campos computados de solo lectura
    is_healthy = serializers.BooleanField(read_only=True)
    is_deleted = serializers.BooleanField(read_only=True)
    status_indicator = serializers.CharField(read_only=True)
    porcentaje_uso_limite = serializers.FloatField(read_only=True)
    requiere_alerta_limite = serializers.BooleanField(read_only=True)

    # Display names para choices
    tipo_servicio_display = serializers.CharField(
        source='get_tipo_servicio_display',
        read_only=True
    )
    proveedor_display = serializers.CharField(
        source='get_proveedor_display',
        read_only=True
    )
    metodo_autenticacion_display = serializers.CharField(
        source='get_metodo_autenticacion_display',
        read_only=True
    )
    ambiente_display = serializers.CharField(
        source='get_ambiente_display',
        read_only=True
    )

    # Información del usuario que creó/actualizó
    created_by_name = serializers.SerializerMethodField()
    updated_by_name = serializers.SerializerMethodField()

    # Credenciales enmascaradas (solo últimos 4 caracteres)
    credenciales_masked = serializers.SerializerMethodField()

    class Meta:
        model = IntegracionExterna
        fields = [
            'id',
            # Identificación
            'nombre',
            'tipo_servicio',
            'tipo_servicio_display',
            'proveedor',
            'proveedor_display',
            'descripcion',
            # Configuración técnica
            'endpoint_url',
            'metodo_autenticacion',
            'metodo_autenticacion_display',
            'credenciales_masked',
            'configuracion_adicional',
            # Control y monitoreo
            'ambiente',
            'ambiente_display',
            'is_active',
            'ultima_conexion_exitosa',
            'ultima_falla',
            'contador_llamadas',
            'errores_recientes',
            # Límites y alertas
            'limite_llamadas_dia',
            'alerta_porcentaje_limite',
            # Campos computados
            'is_healthy',
            'is_deleted',
            'status_indicator',
            'porcentaje_uso_limite',
            'requiere_alerta_limite',
            # Auditoría
            'created_by',
            'created_by_name',
            'created_at',
            'updated_by',
            'updated_by_name',
            'updated_at',
            'deleted_at',
        ]
        read_only_fields = [
            'id',
            'ultima_conexion_exitosa',
            'ultima_falla',
            'contador_llamadas',
            'errores_recientes',
            'created_at',
            'updated_at',
            'deleted_at',
            'is_healthy',
            'is_deleted',
            'status_indicator',
            'porcentaje_uso_limite',
            'requiere_alerta_limite',
        ]

    def get_created_by_name(self, obj):
        """Retorna el nombre del usuario que creó"""
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None

    def get_updated_by_name(self, obj):
        """Retorna el nombre del usuario que actualizó"""
        if obj.updated_by:
            return obj.updated_by.get_full_name() or obj.updated_by.username
        return None

    def get_credenciales_masked(self, obj):
        """
        Retorna credenciales enmascaradas mostrando solo los últimos 4 caracteres.

        Returns:
            dict: Diccionario con valores enmascarados
        """
        credenciales = obj.credenciales

        if not credenciales:
            return {}

        masked = {}
        for key, value in credenciales.items():
            if isinstance(value, str) and len(value) > 4:
                # Mostrar solo últimos 4 caracteres
                masked[key] = f"****{value[-4:]}"
            else:
                # Para valores muy cortos, enmascararlos completamente
                masked[key] = "****"

        return masked

    def create(self, validated_data):
        """Override para registrar el usuario que crea"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
            validated_data['updated_by'] = request.user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Override para registrar el usuario que actualiza"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['updated_by'] = request.user
        return super().update(instance, validated_data)


class IntegracionExternaListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listados de integraciones.

    Solo incluye campos relevantes para tablas y listas.
    """

    tipo_servicio_display = serializers.CharField(
        source='get_tipo_servicio_display',
        read_only=True
    )
    proveedor_display = serializers.CharField(
        source='get_proveedor_display',
        read_only=True
    )
    ambiente_display = serializers.CharField(
        source='get_ambiente_display',
        read_only=True
    )

    # Indicadores de estado
    is_healthy = serializers.BooleanField(read_only=True)
    status_indicator = serializers.CharField(read_only=True)

    class Meta:
        model = IntegracionExterna
        fields = [
            'id',
            'nombre',
            'tipo_servicio',
            'tipo_servicio_display',
            'proveedor',
            'proveedor_display',
            'ambiente',
            'ambiente_display',
            'is_active',
            'is_healthy',
            'status_indicator',
            'ultima_conexion_exitosa',
            'ultima_falla',
        ]


class IntegracionExternaChoicesSerializer(serializers.Serializer):
    """
    Serializer para exponer opciones de choices al frontend.

    Útil para poblar selects/dropdowns.
    """

    tipos_servicio = serializers.SerializerMethodField()
    proveedores = serializers.SerializerMethodField()
    metodos_autenticacion = serializers.SerializerMethodField()
    ambientes = serializers.SerializerMethodField()

    def get_tipos_servicio(self, obj):
        return [
            {'value': code, 'label': name}
            for code, name in IntegracionExterna.TIPO_SERVICIO_CHOICES
        ]

    def get_proveedores(self, obj):
        return [
            {'value': code, 'label': name}
            for code, name in IntegracionExterna.PROVEEDOR_CHOICES
        ]

    def get_metodos_autenticacion(self, obj):
        return [
            {'value': code, 'label': name}
            for code, name in IntegracionExterna.METODO_AUTENTICACION_CHOICES
        ]

    def get_ambientes(self, obj):
        return [
            {'value': code, 'label': name}
            for code, name in IntegracionExterna.AMBIENTE_CHOICES
        ]


class IntegracionExternaCredencialesSerializer(serializers.ModelSerializer):
    """
    Serializer especial para ver/editar credenciales completas.

    SEGURIDAD: Solo accesible por SuperAdmin.
    NO usar en respuestas regulares.
    """

    # Exponer credenciales desencriptadas (solo para SuperAdmin)
    credenciales = serializers.JSONField()

    # Validación de credenciales
    credenciales_validas = serializers.SerializerMethodField()
    mensaje_validacion = serializers.SerializerMethodField()

    class Meta:
        model = IntegracionExterna
        fields = [
            'id',
            'nombre',
            'metodo_autenticacion',
            'credenciales',
            'credenciales_validas',
            'mensaje_validacion',
        ]

    def get_credenciales_validas(self, obj):
        """Verifica si las credenciales son válidas"""
        is_valid, _ = obj.validar_credenciales()
        return is_valid

    def get_mensaje_validacion(self, obj):
        """Retorna mensaje de validación de credenciales"""
        _, mensaje = obj.validar_credenciales()
        return mensaje if mensaje else "Credenciales válidas"

    def update(self, instance, validated_data):
        """
        Actualiza las credenciales de manera segura.

        IMPORTANTE: Las credenciales se encriptan automáticamente
        mediante el setter del modelo.
        """
        if 'credenciales' in validated_data:
            # El setter del modelo se encarga de encriptar
            instance.credenciales = validated_data['credenciales']

        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            instance.updated_by = request.user

        instance.save()
        return instance
