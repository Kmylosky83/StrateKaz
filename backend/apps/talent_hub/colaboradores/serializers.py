"""
Serializers de Colaboradores - Talent Hub

Serializers con nested data para gestión completa de empleados.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import (
    Colaborador,
    HojaVida,
    InfoPersonal,
    HistorialLaboral,
)

User = get_user_model()


# =============================================================================
# SERIALIZERS ANIDADOS (NESTED)
# =============================================================================

class UsuarioBasicoSerializer(serializers.ModelSerializer):
    """Serializer básico de Usuario para nested."""
    nombre_completo = serializers.CharField(source='get_full_name', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'nombre_completo']
        read_only_fields = fields


class CargoBasicoSerializer(serializers.Serializer):
    """Serializer básico de Cargo (lazy-loaded)."""
    id = serializers.IntegerField()
    code = serializers.CharField()
    name = serializers.CharField()


class AreaBasicaSerializer(serializers.Serializer):
    """Serializer básico de Área (lazy-loaded)."""
    id = serializers.IntegerField()
    code = serializers.CharField()
    name = serializers.CharField()
    full_path = serializers.CharField()


# =============================================================================
# HOJA DE VIDA SERIALIZER
# =============================================================================

class HojaVidaSerializer(serializers.ModelSerializer):
    """
    Serializer completo de Hoja de Vida.
    """
    total_anios_experiencia = serializers.ReadOnlyField()
    tiene_formacion_completa = serializers.ReadOnlyField()

    class Meta:
        model = HojaVida
        fields = [
            'id',
            'colaborador',
            'nivel_estudio_maximo',
            'titulo_academico',
            'institucion',
            'anio_graduacion',
            'estudios_adicionales',
            'certificaciones',
            'experiencia_previa',
            'idiomas',
            'habilidades',
            'competencias_blandas',
            'referencias_laborales',
            'cv_documento',
            'certificados_estudios',
            'observaciones',
            # Computed
            'total_anios_experiencia',
            'tiene_formacion_completa',
            # Audit
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_anio_graduacion(self, value):
        """Valida que el año de graduación sea razonable."""
        if value:
            from django.utils import timezone
            current_year = timezone.now().year
            if value < 1950 or value > current_year + 1:
                raise serializers.ValidationError(
                    f"El año de graduación debe estar entre 1950 y {current_year + 1}"
                )
        return value


class HojaVidaCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear/actualizar Hoja de Vida.
    """
    class Meta:
        model = HojaVida
        exclude = ['empresa', 'created_by', 'updated_by', 'created_at', 'updated_at', 'is_active', 'deleted_at']


# =============================================================================
# INFORMACIÓN PERSONAL SERIALIZER (Datos Sensibles)
# =============================================================================

class InfoPersonalSerializer(serializers.ModelSerializer):
    """
    Serializer completo de Información Personal.

    NOTA: Contiene información sensible - aplicar permisos especiales.
    """
    edad = serializers.ReadOnlyField()
    tiene_datos_bancarios = serializers.ReadOnlyField()
    tiene_contacto_emergencia = serializers.ReadOnlyField()

    class Meta:
        model = InfoPersonal
        fields = [
            'id',
            'colaborador',
            'fecha_nacimiento',
            'genero',
            'estado_civil',
            'direccion',
            'ciudad',
            'departamento',
            'telefono_fijo',
            'nombre_contacto_emergencia',
            'parentesco_contacto_emergencia',
            'telefono_contacto_emergencia',
            'banco',
            'tipo_cuenta',
            'numero_cuenta',
            'tipo_sangre',
            'alergias',
            'medicamentos_permanentes',
            'condiciones_medicas',
            'eps',
            'arl',
            'fondo_pensiones',
            'caja_compensacion',
            'talla_camisa',
            'talla_pantalon',
            'talla_zapatos',
            'talla_overol',
            'numero_hijos',
            'personas_a_cargo',
            # Computed
            'edad',
            'tiene_datos_bancarios',
            'tiene_contacto_emergencia',
            # Audit
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class InfoPersonalPublicSerializer(serializers.ModelSerializer):
    """
    Serializer público de Información Personal.

    Solo expone información no sensible (sin datos bancarios, salud detallada, etc.).
    """
    edad = serializers.ReadOnlyField()
    tiene_contacto_emergencia = serializers.ReadOnlyField()

    class Meta:
        model = InfoPersonal
        fields = [
            'id',
            'ciudad',
            'departamento',
            'telefono_fijo',
            'eps',
            'arl',
            'tiene_contacto_emergencia',
            'edad',
        ]
        read_only_fields = fields


class InfoPersonalCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear/actualizar Información Personal.
    """
    class Meta:
        model = InfoPersonal
        exclude = ['empresa', 'created_by', 'updated_by', 'created_at', 'updated_at', 'is_active', 'deleted_at']


# =============================================================================
# HISTORIAL LABORAL SERIALIZER
# =============================================================================

class HistorialLaboralSerializer(serializers.ModelSerializer):
    """
    Serializer completo de Historial Laboral.
    """
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    tipo_movimiento_display = serializers.CharField(source='get_tipo_movimiento_display', read_only=True)

    cargo_anterior_nombre = serializers.CharField(source='cargo_anterior.name', read_only=True)
    cargo_nuevo_nombre = serializers.CharField(source='cargo_nuevo.name', read_only=True)
    area_anterior_nombre = serializers.CharField(source='area_anterior.name', read_only=True)
    area_nueva_nombre = serializers.CharField(source='area_nueva.name', read_only=True)

    aprobado_por_nombre = serializers.CharField(source='aprobado_por.get_full_name', read_only=True)

    incremento_salarial = serializers.ReadOnlyField()
    es_ascenso = serializers.ReadOnlyField()
    es_retiro = serializers.ReadOnlyField()

    class Meta:
        model = HistorialLaboral
        fields = [
            'id',
            'colaborador',
            'colaborador_nombre',
            'tipo_movimiento',
            'tipo_movimiento_display',
            'fecha_movimiento',
            'fecha_efectiva',
            'cargo_anterior',
            'cargo_anterior_nombre',
            'cargo_nuevo',
            'cargo_nuevo_nombre',
            'area_anterior',
            'area_anterior_nombre',
            'area_nueva',
            'area_nueva_nombre',
            'salario_anterior',
            'salario_nuevo',
            'motivo',
            'observaciones',
            'documento_soporte',
            'aprobado_por',
            'aprobado_por_nombre',
            'fecha_aprobacion',
            # Computed
            'incremento_salarial',
            'es_ascenso',
            'es_retiro',
            # Audit
            'created_at',
            'updated_at',
            'created_by',
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']


class HistorialLaboralCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear registros de Historial Laboral.
    """
    class Meta:
        model = HistorialLaboral
        exclude = ['empresa', 'created_by', 'updated_by', 'created_at', 'updated_at', 'is_active', 'deleted_at']

    def validate(self, attrs):
        """Validaciones de negocio."""
        tipo_movimiento = attrs.get('tipo_movimiento')

        # Validaciones según tipo de movimiento
        if tipo_movimiento in ['ascenso', 'cambio_cargo']:
            if not attrs.get('cargo_anterior') or not attrs.get('cargo_nuevo'):
                raise serializers.ValidationError({
                    'tipo_movimiento': 'Los cambios de cargo requieren cargo anterior y nuevo.'
                })

        if tipo_movimiento == 'traslado':
            if not attrs.get('area_anterior') or not attrs.get('area_nueva'):
                raise serializers.ValidationError({
                    'tipo_movimiento': 'Los traslados requieren área anterior y nueva.'
                })

        if tipo_movimiento == 'cambio_salario':
            if not attrs.get('salario_anterior') or not attrs.get('salario_nuevo'):
                raise serializers.ValidationError({
                    'tipo_movimiento': 'Los cambios salariales requieren salario anterior y nuevo.'
                })

        return attrs


# =============================================================================
# COLABORADOR SERIALIZER PRINCIPAL
# =============================================================================

class ColaboradorListSerializer(serializers.ModelSerializer):
    """
    Serializer para listar colaboradores (vista resumida).
    """
    nombre_completo = serializers.CharField(source='get_nombre_completo', read_only=True)
    nombre_corto = serializers.CharField(source='get_nombre_corto', read_only=True)
    tipo_documento_display = serializers.CharField(source='get_tipo_documento_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    tipo_contrato_display = serializers.CharField(source='get_tipo_contrato_display', read_only=True)

    cargo_nombre = serializers.CharField(source='cargo.name', read_only=True)
    area_nombre = serializers.CharField(source='area.name', read_only=True)

    antiguedad_anios = serializers.ReadOnlyField()
    esta_activo = serializers.ReadOnlyField()

    class Meta:
        model = Colaborador
        fields = [
            'id',
            'numero_identificacion',
            'tipo_documento',
            'tipo_documento_display',
            'nombre_completo',
            'nombre_corto',
            'primer_nombre',
            'primer_apellido',
            'cargo',
            'cargo_nombre',
            'area',
            'area_nombre',
            'fecha_ingreso',
            'estado',
            'estado_display',
            'tipo_contrato',
            'tipo_contrato_display',
            'email_personal',
            'telefono_movil',
            'foto',
            # Computed
            'antiguedad_anios',
            'esta_activo',
        ]


class ColaboradorDetailSerializer(serializers.ModelSerializer):
    """
    Serializer detallado de Colaborador con información completa.
    """
    nombre_completo = serializers.CharField(source='get_nombre_completo', read_only=True)
    nombre_corto = serializers.CharField(source='get_nombre_corto', read_only=True)
    tipo_documento_display = serializers.CharField(source='get_tipo_documento_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    tipo_contrato_display = serializers.CharField(source='get_tipo_contrato_display', read_only=True)

    # Nested data (solo lectura)
    usuario_data = UsuarioBasicoSerializer(source='usuario', read_only=True)
    cargo_data = serializers.SerializerMethodField()
    area_data = serializers.SerializerMethodField()

    # Relaciones OneToOne (incluir si existen)
    hoja_vida = HojaVidaSerializer(read_only=True)
    info_personal = InfoPersonalPublicSerializer(read_only=True)  # Versión pública por defecto

    # Computed properties
    antiguedad_dias = serializers.ReadOnlyField()
    antiguedad_anios = serializers.ReadOnlyField()
    esta_activo = serializers.ReadOnlyField()
    tiene_contrato_vigente = serializers.ReadOnlyField()

    class Meta:
        model = Colaborador
        fields = [
            'id',
            'numero_identificacion',
            'tipo_documento',
            'tipo_documento_display',
            'primer_nombre',
            'segundo_nombre',
            'primer_apellido',
            'segundo_apellido',
            'nombre_completo',
            'nombre_corto',
            'usuario',
            'usuario_data',
            'cargo',
            'cargo_data',
            'area',
            'area_data',
            'fecha_ingreso',
            'fecha_retiro',
            'estado',
            'estado_display',
            'motivo_retiro',
            'tipo_contrato',
            'tipo_contrato_display',
            'fecha_fin_contrato',
            'salario',
            'auxilio_transporte',
            'horas_semanales',
            'email_personal',
            'telefono_movil',
            'foto',
            'observaciones',
            # Nested
            'hoja_vida',
            'info_personal',
            # Computed
            'antiguedad_dias',
            'antiguedad_anios',
            'esta_activo',
            'tiene_contrato_vigente',
            # Audit
            'created_at',
            'updated_at',
            'created_by',
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def get_cargo_data(self, obj):
        """Obtiene datos del cargo."""
        if obj.cargo:
            return {
                'id': obj.cargo.id,
                'code': obj.cargo.code,
                'name': obj.cargo.name,
            }
        return None

    def get_area_data(self, obj):
        """Obtiene datos del área."""
        if obj.area:
            return {
                'id': obj.area.id,
                'code': obj.area.code,
                'name': obj.area.name,
                'full_path': obj.area.full_path,
            }
        return None


class ColaboradorCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear y actualizar colaboradores.
    """
    class Meta:
        model = Colaborador
        exclude = ['empresa', 'created_by', 'updated_by', 'created_at', 'updated_at', 'is_active', 'deleted_at']

    def validate_numero_identificacion(self, value):
        """Valida que el número de identificación sea único."""
        if self.instance:
            # Update - excluir el registro actual
            if Colaborador.objects.filter(
                numero_identificacion=value
            ).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError(
                    "Ya existe un colaborador con este número de identificación."
                )
        else:
            # Create
            if Colaborador.objects.filter(numero_identificacion=value).exists():
                raise serializers.ValidationError(
                    "Ya existe un colaborador con este número de identificación."
                )
        return value

    def validate(self, attrs):
        """Validaciones de negocio."""
        # Validar fechas
        fecha_ingreso = attrs.get('fecha_ingreso')
        fecha_retiro = attrs.get('fecha_retiro')

        if fecha_retiro and fecha_ingreso:
            if fecha_retiro < fecha_ingreso:
                raise serializers.ValidationError({
                    'fecha_retiro': 'La fecha de retiro no puede ser anterior a la fecha de ingreso.'
                })

        # Estado retirado requiere fecha de retiro
        estado = attrs.get('estado', getattr(self.instance, 'estado', None))
        if estado == 'retirado' and not fecha_retiro:
            raise serializers.ValidationError({
                'fecha_retiro': 'Los colaboradores retirados deben tener fecha de retiro.'
            })

        # Contratos a término fijo requieren fecha fin
        tipo_contrato = attrs.get('tipo_contrato', getattr(self.instance, 'tipo_contrato', None))
        fecha_fin_contrato = attrs.get('fecha_fin_contrato')
        if tipo_contrato == 'fijo' and not fecha_fin_contrato:
            raise serializers.ValidationError({
                'fecha_fin_contrato': 'Los contratos a término fijo deben tener fecha de finalización.'
            })

        # Validar auxilio de transporte vs SMMLV (Colombia: aplica hasta 2x SMMLV)
        salario = attrs.get('salario', getattr(self.instance, 'salario', None))
        auxilio_transporte = attrs.get('auxilio_transporte', getattr(self.instance, 'auxilio_transporte', None))
        if salario and auxilio_transporte:
            from decimal import Decimal
            # SMMLV 2026 Colombia: $1.423.500
            SMMLV = Decimal('1423500')
            TOPE_AUXILIO = SMMLV * 2
            if salario > TOPE_AUXILIO:
                attrs['auxilio_transporte'] = False

        return attrs


class ColaboradorCreateWithAccessSerializer(ColaboradorCreateUpdateSerializer):
    """
    Serializer extendido para crear Colaborador con acceso opcional al sistema.

    Agrega 3 campos write-only que NO se almacenan en Colaborador:
    - crear_acceso: toggle para crear cuenta de usuario
    - email_corporativo: email del usuario en el sistema
    - username: nombre de usuario para login
    """
    crear_acceso = serializers.BooleanField(
        default=False, write_only=True, required=False
    )
    email_corporativo = serializers.EmailField(
        write_only=True, required=False, allow_blank=True
    )
    username = serializers.CharField(
        write_only=True, required=False, allow_blank=True, max_length=150
    )

    def validate(self, attrs):
        attrs = super().validate(attrs)

        crear_acceso = attrs.get('crear_acceso', False)
        if crear_acceso:
            email_corporativo = attrs.get('email_corporativo', '').strip()
            username = attrs.get('username', '').strip()

            if not email_corporativo:
                raise serializers.ValidationError({
                    'email_corporativo': 'El email corporativo es requerido para crear acceso al sistema.'
                })
            if not username:
                raise serializers.ValidationError({
                    'username': 'El nombre de usuario es requerido para crear acceso al sistema.'
                })
            if ' ' in username:
                raise serializers.ValidationError({
                    'username': 'El nombre de usuario no puede contener espacios.'
                })

            # Validar unicidad en User
            if User.objects.filter(email=email_corporativo).exists():
                raise serializers.ValidationError({
                    'email_corporativo': 'Este email ya está registrado en el sistema.'
                })
            if User.objects.filter(username=username).exists():
                raise serializers.ValidationError({
                    'username': 'Este nombre de usuario ya existe.'
                })

        return attrs


class ColaboradorCompleteSerializer(serializers.ModelSerializer):
    """
    Serializer completo con TODA la información (incluyendo datos sensibles).
    Solo para usuarios con permisos especiales.
    """
    nombre_completo = serializers.CharField(source='get_nombre_completo', read_only=True)

    # Nested completo
    usuario_data = UsuarioBasicoSerializer(source='usuario', read_only=True)
    cargo_data = serializers.SerializerMethodField()
    area_data = serializers.SerializerMethodField()
    hoja_vida = HojaVidaSerializer(read_only=True)
    info_personal = InfoPersonalSerializer(read_only=True)  # Versión completa con datos sensibles

    # Historial laboral (últimos 10 registros)
    historial_reciente = serializers.SerializerMethodField()

    class Meta:
        model = Colaborador
        fields = '__all__'

    def get_cargo_data(self, obj):
        """Obtiene datos del cargo."""
        if obj.cargo:
            return {
                'id': obj.cargo.id,
                'code': obj.cargo.code,
                'name': obj.cargo.name,
            }
        return None

    def get_area_data(self, obj):
        """Obtiene datos del área."""
        if obj.area:
            return {
                'id': obj.area.id,
                'code': obj.area.code,
                'name': obj.area.name,
                'full_path': obj.area.full_path,
            }
        return None

    def get_historial_reciente(self, obj):
        """Obtiene los últimos movimientos del historial laboral."""
        historial = obj.historial_laboral.all()[:10]
        return HistorialLaboralSerializer(historial, many=True).data


# =============================================================================
# SERIALIZERS DE ESTADÍSTICAS
# =============================================================================

class ColaboradorEstadisticasSerializer(serializers.Serializer):
    """
    Serializer para estadísticas de colaboradores.
    Campos deben coincidir con lo que retorna ColaboradorViewSet.estadisticas()
    """
    total = serializers.IntegerField()
    activos = serializers.IntegerField()
    por_estado = serializers.DictField(child=serializers.IntegerField(), required=False)
    por_tipo_contrato = serializers.DictField(child=serializers.IntegerField(), required=False)
    por_area = serializers.DictField(child=serializers.IntegerField(), required=False)
