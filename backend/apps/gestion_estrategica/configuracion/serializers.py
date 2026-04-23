"""
Serializers del módulo Configuración - Dirección Estratégica
Sistema de Gestión StrateKaz

Define serializers para:
- SedeEmpresa: Sedes y ubicaciones de la empresa
- IntegracionExterna: Integraciones con servicios externos
- NormaISO: Normas ISO y sistemas de gestión
- TipoSede, TipoServicioIntegracion, ProveedorIntegracion: Modelos dinámicos
"""
from rest_framework import serializers
from .models import (
    EmpresaConfig,
    SedeEmpresa,
    IntegracionExterna,
    TipoSede,
    TipoServicioIntegracion,
    ProveedorIntegracion,
    IconRegistry,
    NormaISO,
    TipoContrato,
    DEPARTAMENTOS_COLOMBIA,
    ICON_CATEGORY_CHOICES,
)
# Source-of-truth: catalogo_productos (CT-layer). Post-consolidacion S7.
from apps.catalogo_productos.models import UnidadMedida


# ==============================================================================
# SERIALIZERS DE SEDE EMPRESA
# ==============================================================================

class SedeEmpresaSerializer(serializers.ModelSerializer):
    """
    Serializer para SedeEmpresa

    Incluye campos computados y display names para el frontend.
    Soporta creación de nuevo tipo de sede inline via 'tipo_sede_nuevo'.
    """

    # Campo para crear nuevo tipo de sede sobre la marcha
    tipo_sede_nuevo = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        help_text='Nombre del nuevo tipo de sede a crear (si no existe en la lista)'
    )

    # Campos computados de solo lectura
    direccion_completa = serializers.CharField(read_only=True)
    tiene_geolocalizacion = serializers.BooleanField(read_only=True)
    is_deleted = serializers.BooleanField(read_only=True)
    capacidad_formateada = serializers.CharField(read_only=True)

    # Display names - tipo_sede ahora es ForeignKey
    tipo_sede_display = serializers.SerializerMethodField()
    # H-SC-10: departamento ya no es CharField choices — es property derivada
    # de ciudad.departamento.nombre.
    departamento = serializers.CharField(read_only=True)
    departamento_display = serializers.CharField(source='departamento', read_only=True)
    ciudad_nombre = serializers.CharField(source='ciudad.nombre', read_only=True)

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
            'tipo_sede_nuevo',  # Para crear nuevo tipo inline
            'tipo_sede_display',
            'descripcion',
            # Ubicación
            'direccion',
            'direccion_completa',
            'ciudad',
            'ciudad_nombre',
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
            # Roles (H-SC-10: tipo_unidad y es_proveedor_interno eliminados)
            'es_unidad_negocio',
            'es_centro_acopio',
            # Capacidad - Sistema dinámico multi-industria
            'capacidad_almacenamiento',
            'unidad_capacidad',
            'unidad_capacidad_display',
            'capacidad_formateada',
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
            'codigo',
            'created_at',
            'updated_at',
            'deleted_at',
            'direccion_completa',
            'tiene_geolocalizacion',
            'is_deleted',
            'capacidad_formateada',
            'unidad_capacidad_display',
        ]

    def get_tipo_sede_display(self, obj):
        """Retorna el nombre del tipo de sede"""
        if obj.tipo_sede:
            return obj.tipo_sede.name
        return None

    def get_unidad_capacidad_display(self, obj):
        """Retorna el nombre de la unidad de capacidad"""
        if obj.unidad_capacidad:
            return f"{obj.unidad_capacidad.nombre} ({obj.unidad_capacidad.simbolo})"
        return None

    def get_responsable_name(self, obj):
        """Retorna el nombre del cargo responsable"""
        if obj.responsable:
            return obj.responsable.name
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
        """
        Override para:
        1. Auto-generar código usando el sistema de consecutivos (thread-safe)
        2. Registrar el usuario que crea
        3. Crear nuevo TipoSede si se envía tipo_sede_nuevo
        """
        # Extraer tipo_sede_nuevo antes de crear
        tipo_sede_nuevo = validated_data.pop('tipo_sede_nuevo', None)

        # Si se envía un nuevo tipo de sede, crearlo o buscarlo
        if tipo_sede_nuevo and tipo_sede_nuevo.strip():
            tipo_nombre = tipo_sede_nuevo.strip()
            tipo_code = tipo_nombre.upper().replace(' ', '_')[:30]
            tipo_sede, _ = TipoSede.objects.get_or_create(
                code=tipo_code,
                defaults={'name': tipo_nombre, 'is_active': True}
            )
            validated_data['tipo_sede'] = tipo_sede

        # Auto-generar código con el consecutivo SEDE (select_for_update — sin duplicados)
        from apps.gestion_estrategica.organizacion.models_consecutivos import ConsecutivoConfig
        empresa = EmpresaConfig.objects.first()
        if empresa:
            try:
                validated_data['codigo'] = ConsecutivoConfig.obtener_siguiente_consecutivo(
                    'SEDE', empresa_id=empresa.id
                )
            except (ConsecutivoConfig.DoesNotExist, ValueError):
                # Fallback: si el seed no se ha corrido todavía en este tenant
                count = SedeEmpresa.objects.count() + 1
                validated_data['codigo'] = f'SEDE-{count:04d}'

        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """
        Override para manejar tipo_sede_nuevo en actualizaciones
        """
        # Extraer tipo_sede_nuevo antes de actualizar
        tipo_sede_nuevo = validated_data.pop('tipo_sede_nuevo', None)

        # Si se envía un nuevo tipo de sede, crearlo o buscarlo
        if tipo_sede_nuevo and tipo_sede_nuevo.strip():
            tipo_nombre = tipo_sede_nuevo.strip()
            tipo_code = tipo_nombre.upper().replace(' ', '_')[:30]

            tipo_sede, created = TipoSede.objects.get_or_create(
                code=tipo_code,
                defaults={
                    'name': tipo_nombre,
                    'is_active': True
                }
            )
            validated_data['tipo_sede'] = tipo_sede

        return super().update(instance, validated_data)


class SedeEmpresaListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listados de sedes
    """
    tipo_sede_display = serializers.SerializerMethodField()
    # H-SC-10: departamento es property derivada de ciudad.departamento.
    departamento_display = serializers.CharField(source='departamento', read_only=True)
    ciudad_nombre = serializers.CharField(source='ciudad.nombre', read_only=True)
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
            'ciudad_nombre',
            'departamento_display',
            'responsable',
            'responsable_name',
            'es_sede_principal',
            'es_unidad_negocio',
            'es_centro_acopio',
            'is_active',
        ]

    def get_tipo_sede_display(self, obj):
        if obj.tipo_sede:
            return obj.tipo_sede.name
        return None

    def get_responsable_name(self, obj):
        if obj.responsable:
            return obj.responsable.name
        return None


class SedeEmpresaChoicesSerializer(serializers.Serializer):
    """
    Serializer para exponer las opciones de choices de SedeEmpresa al frontend

    Incluye:
    - Tipos de sede (dinámico desde modelo TipoSede)
    - Departamentos de Colombia
    - Unidades de capacidad disponibles (sistema dinámico multi-industria)
    """
    tipos_sede = serializers.SerializerMethodField()
    departamentos = serializers.SerializerMethodField()
    unidades_capacidad = serializers.SerializerMethodField()
    unidad_capacidad_default = serializers.SerializerMethodField()

    def get_tipos_sede(self, obj):
        """Retorna tipos de sede desde modelo dinámico"""
        try:
            tipos = TipoSede.objects.filter(
                is_active=True,
                deleted_at__isnull=True
            ).order_by('orden', 'name')
            return [
                {
                    'value': t.id,
                    'label': t.name,
                    'code': t.code,
                    'icon': t.icon,
                    'color': t.color,
                }
                for t in tipos
            ]
        except Exception:
            return []

    def get_departamentos(self, obj):
        return [{'value': code, 'label': name} for code, name in DEPARTAMENTOS_COLOMBIA]

    def get_unidades_capacidad(self, obj):
        """Retorna las unidades de medida disponibles para capacidad (PESO, VOLUMEN, CONTENEDOR)."""
        try:
            tipos_capacidad = ['PESO', 'VOLUMEN', 'CONTENEDOR']
            unidades = UnidadMedida.objects.filter(
                tipo__in=tipos_capacidad,
                is_deleted=False,
            ).order_by('tipo', 'orden', 'nombre')

            return [
                {
                    'value': u.id,
                    'label': f"{u.nombre} ({u.simbolo or u.abreviatura})",
                    'simbolo': u.simbolo or u.abreviatura,
                    'categoria': u.tipo,  # Alias legacy para compat FE
                }
                for u in unidades
            ]
        except Exception:
            return []

    def get_unidad_capacidad_default(self, obj):
        """Retorna la unidad de capacidad por defecto de la empresa"""
        try:
            empresa_config = EmpresaConfig.get_instance()
            if empresa_config and hasattr(empresa_config, 'unidad_capacidad_default') and empresa_config.unidad_capacidad_default:
                u = empresa_config.unidad_capacidad_default
                return {
                    'value': u.id,
                    'label': f"{u.nombre} ({u.simbolo})",
                    'simbolo': u.simbolo,
                }
        except Exception:
            pass
        return None


# ==============================================================================
# SERIALIZERS DE INTEGRACION EXTERNA
# ==============================================================================


class IntegracionExternaSerializer(serializers.ModelSerializer):
    """
    Serializer completo para IntegracionExterna

    Incluye:
    - Todos los campos del modelo
    - Credenciales enmascaradas para seguridad
    - Campos computados (is_healthy, status_indicator)
    - Display names para choices

    tipo_servicio y proveedor aceptan tanto ID (int) como código (str).
    """

    # Override FK: aceptar ID o código string desde el frontend
    tipo_servicio = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    proveedor = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    # Credenciales: el frontend envía dict, se encripta vía property del modelo
    credenciales = serializers.DictField(
        child=serializers.CharField(allow_blank=True),
        required=False, write_only=True, default=dict,
    )

    # Alias: el frontend envía url_base, el modelo usa endpoint_url
    url_base = serializers.URLField(
        required=False, allow_blank=True, allow_null=True, write_only=True
    )
    # Campos que van a configuracion_adicional (no existen como columnas)
    timeout_segundos = serializers.IntegerField(
        required=False, default=30, write_only=True
    )
    reintentos_max = serializers.IntegerField(
        required=False, default=3, write_only=True
    )

    # Campos computados de solo lectura
    is_healthy = serializers.BooleanField(read_only=True)
    is_deleted = serializers.BooleanField(read_only=True)
    status_indicator = serializers.CharField(read_only=True)
    porcentaje_uso_limite = serializers.FloatField(read_only=True)
    requiere_alerta_limite = serializers.BooleanField(read_only=True)

    # Display names
    tipo_servicio_display = serializers.SerializerMethodField()
    proveedor_display = serializers.SerializerMethodField()
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
            'url_base',          # alias write_only → endpoint_url
            'timeout_segundos',  # write_only → configuracion_adicional
            'reintentos_max',    # write_only → configuracion_adicional
            'metodo_autenticacion',
            'metodo_autenticacion_display',
            'credenciales',       # write_only → encripta vía property
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

    def validate_tipo_servicio(self, value):
        """Resuelve tipo_servicio: acepta ID (int/str numérico) o código (str)."""
        if not value:
            return None
        value_str = str(value).strip()
        if not value_str:
            return None
        # Intentar como ID numérico
        try:
            pk = int(value_str)
            try:
                return TipoServicioIntegracion.objects.get(pk=pk, is_active=True)
            except TipoServicioIntegracion.DoesNotExist:
                raise serializers.ValidationError(
                    f'No se encontró tipo de servicio con ID {pk}.'
                )
        except (ValueError, TypeError):
            pass
        # Intentar como código string
        try:
            return TipoServicioIntegracion.objects.get(code__iexact=value_str, is_active=True)
        except TipoServicioIntegracion.DoesNotExist:
            raise serializers.ValidationError(
                f'No se encontró tipo de servicio "{value_str}". '
                f'Verifique el código en los tipos disponibles.'
            )

    def validate_proveedor(self, value):
        """Resuelve proveedor: acepta ID (int/str numérico) o código (str)."""
        if not value:
            return None
        value_str = str(value).strip()
        if not value_str:
            return None
        # Intentar como ID numérico
        try:
            pk = int(value_str)
            try:
                return ProveedorIntegracion.objects.get(pk=pk, is_active=True)
            except ProveedorIntegracion.DoesNotExist:
                raise serializers.ValidationError(
                    f'No se encontró proveedor con ID {pk}.'
                )
        except (ValueError, TypeError):
            pass
        # Intentar como código string
        try:
            return ProveedorIntegracion.objects.get(code__iexact=value_str, is_active=True)
        except ProveedorIntegracion.DoesNotExist:
            raise serializers.ValidationError(
                f'No se encontró proveedor "{value_str}". '
                f'Verifique el código en los proveedores disponibles.'
            )

    def get_tipo_servicio_display(self, obj):
        """Retorna el nombre del tipo de servicio"""
        if obj.tipo_servicio:
            return obj.tipo_servicio.name
        return None

    def get_proveedor_display(self, obj):
        """Retorna el nombre del proveedor"""
        if obj.proveedor:
            return obj.proveedor.name
        return None

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

    def _map_extra_fields(self, validated_data):
        """Mapea alias de campos del frontend a los campos reales del modelo."""
        # url_base → endpoint_url
        url_base = validated_data.pop('url_base', None)
        if url_base and not validated_data.get('endpoint_url'):
            validated_data['endpoint_url'] = url_base

        # timeout_segundos y reintentos_max → configuracion_adicional
        timeout = validated_data.pop('timeout_segundos', None)
        reintentos = validated_data.pop('reintentos_max', None)
        config = validated_data.get('configuracion_adicional') or {}
        if timeout is not None:
            config['timeout_segundos'] = timeout
        if reintentos is not None:
            config['reintentos_max'] = reintentos
        if config:
            validated_data['configuracion_adicional'] = config

        # credenciales se extraen para asignar vía property después del save
        # (no es un campo de modelo, es un property con setter encriptado)
        validated_data.pop('credenciales', None)

        return validated_data

    def to_representation(self, instance):
        """Representar tipo_servicio y proveedor como código string (no PK int)."""
        data = super().to_representation(instance)
        data['tipo_servicio'] = instance.tipo_servicio.code if instance.tipo_servicio else None
        data['proveedor'] = instance.proveedor.code if instance.proveedor else None
        # Exponer timeout/reintentos desde configuracion_adicional
        config = instance.configuracion_adicional or {}
        data['url_base'] = instance.endpoint_url or ''
        data['timeout_segundos'] = config.get('timeout_segundos', 30)
        data['reintentos_max'] = config.get('reintentos_max', 3)
        return data

    def create(self, validated_data):
        """Override para registrar el usuario que crea y encriptar credenciales."""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
            validated_data['updated_by'] = request.user
        # Extraer credenciales antes del _map_extra_fields
        credenciales = validated_data.get('credenciales') or {}
        validated_data = self._map_extra_fields(validated_data)
        instance = super().create(validated_data)
        # Asignar credenciales vía property (encripta con Fernet)
        if credenciales:
            instance.credenciales = credenciales
            instance.save(update_fields=['_credenciales_encrypted'])
        return instance

    def update(self, instance, validated_data):
        """Override para registrar el usuario que actualiza."""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['updated_by'] = request.user
        credenciales = validated_data.get('credenciales') or {}
        validated_data = self._map_extra_fields(validated_data)
        instance = super().update(instance, validated_data)
        if credenciales:
            instance.credenciales = credenciales
            instance.save(update_fields=['_credenciales_encrypted'])
        return instance


class IntegracionExternaListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listados de integraciones.

    Solo incluye campos relevantes para tablas y listas.
    """

    tipo_servicio_display = serializers.SerializerMethodField()
    proveedor_display = serializers.SerializerMethodField()
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

    def get_tipo_servicio_display(self, obj):
        if obj.tipo_servicio:
            return obj.tipo_servicio.name
        return None

    def get_proveedor_display(self, obj):
        if obj.proveedor:
            return obj.proveedor.name
        return None

    def to_representation(self, instance):
        """Representar tipo_servicio y proveedor como código string (no PK int)."""
        data = super().to_representation(instance)
        data['tipo_servicio'] = instance.tipo_servicio.code if instance.tipo_servicio else None
        data['proveedor'] = instance.proveedor.code if instance.proveedor else None
        return data


class IntegracionExternaChoicesSerializer(serializers.Serializer):
    """
    Serializer para exponer opciones de choices al frontend.

    Útil para poblar selects/dropdowns.
    Tipos de servicio y proveedores ahora son dinámicos desde modelos.
    """

    tipos_servicio = serializers.SerializerMethodField()
    proveedores = serializers.SerializerMethodField()
    metodos_autenticacion = serializers.SerializerMethodField()
    ambientes = serializers.SerializerMethodField()

    def get_tipos_servicio(self, obj):
        """Retorna tipos de servicio desde modelo dinámico"""
        tipos = TipoServicioIntegracion.objects.filter(
            is_active=True,
            deleted_at__isnull=True
        ).order_by('orden', 'name')
        return [
            {
                'value': t.id,
                'label': t.name,
                'code': t.code,
                'category': t.category,
                'icon': t.icon,
            }
            for t in tipos
        ]

    def get_proveedores(self, obj):
        """Retorna proveedores desde modelo dinámico"""
        proveedores = ProveedorIntegracion.objects.filter(
            is_active=True,
            deleted_at__isnull=True
        ).order_by('orden', 'name')
        return [
            {
                'value': p.id,
                'label': p.name,
                'code': p.code,
                'tipo_servicio_id': p.tipo_servicio_id,
                'pais_origen': p.pais_origen,
            }
            for p in proveedores
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


# ==============================================================================
# ICON REGISTRY SERIALIZERS
# ==============================================================================

class IconRegistrySerializer(serializers.ModelSerializer):
    """
    Serializer para IconRegistry - Sistema Dinamico de Iconos

    Expone los iconos disponibles para uso en el frontend
    """
    category_display = serializers.CharField(
        source='get_category_display',
        read_only=True
    )

    class Meta:
        model = IconRegistry
        fields = [
            'id',
            'name',
            'label',
            'category',
            'category_display',
            'description',
            'keywords',
            'orden',
            'es_sistema',
            'is_active',
        ]
        read_only_fields = ['es_sistema']


class IconRegistryListSerializer(serializers.ModelSerializer):
    """
    Serializer reducido para listados de iconos
    """
    class Meta:
        model = IconRegistry
        fields = ['id', 'name', 'label', 'category']


class IconCategorySerializer(serializers.Serializer):
    """
    Serializer para categorias de iconos
    """
    code = serializers.CharField()
    name = serializers.CharField()
    icon_count = serializers.IntegerField()


# ==============================================================================
# NORMA ISO SERIALIZERS
# ==============================================================================

class NormaISOSerializer(serializers.ModelSerializer):
    """
    Serializer para NormaISO - Sistema Dinámico de Normas ISO y Sistemas de Gestión

    Expone las normas ISO disponibles para uso en políticas, alcances, etc.
    """
    category_display = serializers.CharField(
        source='get_category_display',
        read_only=True
    )

    class Meta:
        model = NormaISO
        fields = [
            'id',
            'code',
            'name',
            'short_name',
            'description',
            'category',
            'category_display',
            'version',
            'icon',
            'color',
            'orden',
            'es_sistema',
            'is_active',
        ]
        read_only_fields = ['code', 'es_sistema']


class NormaISOListSerializer(serializers.ModelSerializer):
    """
    Serializer reducido para listados y selects de normas ISO
    """
    category_display = serializers.CharField(
        source='get_category_display',
        read_only=True
    )

    class Meta:
        model = NormaISO
        fields = ['id', 'code', 'name', 'short_name', 'icon', 'color', 'category', 'category_display', 'es_sistema', 'is_active']


class NormaISOChoicesSerializer(serializers.Serializer):
    """
    Serializer para exponer categorías de normas ISO
    """
    code = serializers.CharField()
    name = serializers.CharField()
    count = serializers.IntegerField()


# ==============================================================================
# SERIALIZERS DE TIPO DE CONTRATO
# ==============================================================================

class TipoContratoSerializer(serializers.ModelSerializer):
    """
    Serializer CRUD para Tipos de Contrato laboral.
    Fundación Tab 4: Mis Políticas y Reglamentos → Contratos Tipo.
    """
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = TipoContrato
        fields = [
            'id', 'empresa', 'nombre', 'tipo', 'tipo_display', 'descripcion',
            'clausulas_principales', 'duracion_default_dias', 'periodo_prueba_dias',
            'requiere_poliza', 'plantilla_documento', 'notas_legales', 'orden',
            'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class TipoContratoListSerializer(serializers.ModelSerializer):
    """Serializer de lista ligero para Tipos de Contrato."""
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = TipoContrato
        fields = [
            'id', 'nombre', 'tipo', 'tipo_display', 'duracion_default_dias',
            'periodo_prueba_dias', 'requiere_poliza', 'orden', 'is_active',
        ]


# UnidadNegocio ELIMINADO — Unificado con SedeEmpresa (v5.2.0)
# Los select-lists de unidades de negocio ahora filtran SedeEmpresa.es_unidad_negocio=True
