"""
Serializer de importación masiva de Colaboradores desde Excel.
Valida y normaliza una fila del archivo antes de crear el Colaborador.
"""
from decimal import Decimal, InvalidOperation

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .import_utils import (
    TIPO_DOCUMENTO_MAP,
    TIPO_CONTRATO_MAP,
    ESTADO_MAP,
    normalizar_valor,
    parsear_fecha,
    parsear_decimal,
    parsear_entero,
    parsear_bool,
)

User = get_user_model()


class ColaboradorImportRowSerializer(serializers.Serializer):
    """
    Valida una fila del Excel de importación y la convierte a datos listos
    para crear un Colaborador (+ opcionalmente su User).

    Resuelve:
    - cargo_nombre → cargo (FK id) via lookup por name en el tenant
    - area_nombre  → area  (FK id) via lookup por name en el tenant
    - Choices en texto → codes del modelo
    - Fechas en múltiples formatos → YYYY-MM-DD
    """
    # Identificación
    tipo_documento = serializers.CharField()
    numero_identificacion = serializers.CharField()

    # Nombres
    primer_nombre = serializers.CharField()
    segundo_nombre = serializers.CharField(required=False, allow_blank=True, default='')
    primer_apellido = serializers.CharField()
    segundo_apellido = serializers.CharField(required=False, allow_blank=True, default='')

    # Estructura
    cargo_nombre = serializers.CharField()
    area_nombre = serializers.CharField()

    # Laboral
    fecha_ingreso = serializers.CharField()
    tipo_contrato = serializers.CharField()
    fecha_fin_contrato = serializers.CharField(required=False, allow_blank=True, default='')
    salario = serializers.CharField()
    auxilio_transporte = serializers.CharField(required=False, default='Si')
    horas_semanales = serializers.CharField(required=False, default='48')
    estado = serializers.CharField(required=False, default='activo')

    # Contacto opcional
    email_personal = serializers.CharField(required=False, allow_blank=True, default='')
    telefono_movil = serializers.CharField(required=False, allow_blank=True, default='')
    observaciones = serializers.CharField(required=False, allow_blank=True, default='')

    # Acceso al sistema
    crear_acceso = serializers.CharField(required=False, default='No')
    email_corporativo = serializers.CharField(required=False, allow_blank=True, default='')
    username = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_tipo_documento(self, value):
        norm = normalizar_valor(value)
        mapped = TIPO_DOCUMENTO_MAP.get(norm)
        if not mapped:
            raise serializers.ValidationError(
                f'Tipo de documento inválido: "{value}". Valores válidos: CC, CE, TI, PA, PEP, PPT'
            )
        return mapped

    def validate_numero_identificacion(self, value):
        val = str(value).strip()
        if not val:
            raise serializers.ValidationError('El número de identificación es requerido.')
        return val

    def validate_primer_nombre(self, value):
        val = str(value).strip()
        if not val:
            raise serializers.ValidationError('El primer nombre es requerido.')
        if len(val) > 50:
            raise serializers.ValidationError('El primer nombre no puede exceder 50 caracteres.')
        return val.title()

    def validate_primer_apellido(self, value):
        val = str(value).strip()
        if not val:
            raise serializers.ValidationError('El primer apellido es requerido.')
        if len(val) > 50:
            raise serializers.ValidationError('El primer apellido no puede exceder 50 caracteres.')
        return val.title()

    def validate_segundo_nombre(self, value):
        return str(value).strip().title() if value else ''

    def validate_segundo_apellido(self, value):
        return str(value).strip().title() if value else ''

    def validate_cargo_nombre(self, value):
        val = str(value).strip()
        if not val:
            raise serializers.ValidationError('El nombre del cargo es requerido.')
        return val

    def validate_area_nombre(self, value):
        val = str(value).strip()
        if not val:
            raise serializers.ValidationError('El nombre del área es requerido.')
        return val

    def validate_fecha_ingreso(self, value):
        fecha = parsear_fecha(value)
        if not fecha:
            raise serializers.ValidationError(
                f'Fecha de ingreso inválida: "{value}". Formato esperado: AAAA-MM-DD o DD/MM/AAAA'
            )
        return fecha

    def validate_tipo_contrato(self, value):
        norm = normalizar_valor(value)
        mapped = TIPO_CONTRATO_MAP.get(norm)
        if not mapped:
            validos = 'indefinido, fijo, obra_labor, aprendizaje, prestacion_servicios'
            raise serializers.ValidationError(
                f'Tipo de contrato inválido: "{value}". Valores válidos: {validos}'
            )
        return mapped

    def validate_salario(self, value):
        val = parsear_decimal(value)
        if val is None:
            raise serializers.ValidationError(
                f'Salario inválido: "{value}". Debe ser un número (ej: 3000000).'
            )
        try:
            d = Decimal(val)
            if d <= 0:
                raise serializers.ValidationError('El salario debe ser mayor a cero.')
        except InvalidOperation:
            raise serializers.ValidationError(f'Salario inválido: "{value}".')
        return val

    def validate_estado(self, value):
        norm = normalizar_valor(value)
        if not norm:
            return 'activo'
        mapped = ESTADO_MAP.get(norm)
        if not mapped:
            raise serializers.ValidationError(
                f'Estado inválido: "{value}". Valores válidos: activo, inactivo, suspendido, retirado'
            )
        return mapped

    def validate_email_personal(self, value):
        val = str(value).strip() if value else ''
        if val and '@' not in val:
            raise serializers.ValidationError(f'Email personal inválido: "{val}"')
        return val

    def validate(self, attrs):
        # Normalizar booleanos
        attrs['auxilio_transporte'] = parsear_bool(attrs.get('auxilio_transporte', 'Si'))
        attrs['horas_semanales'] = parsear_entero(attrs.get('horas_semanales', '48'), default=48)
        crear_acceso = parsear_bool(attrs.get('crear_acceso', 'No'))
        attrs['_crear_acceso'] = crear_acceso

        # Fecha fin contrato
        fecha_fin_raw = attrs.get('fecha_fin_contrato', '')
        attrs['fecha_fin_contrato'] = parsear_fecha(fecha_fin_raw) if fecha_fin_raw else None

        # Validar fecha fin si contrato fijo
        if attrs.get('tipo_contrato') == 'fijo' and not attrs.get('fecha_fin_contrato'):
            raise serializers.ValidationError({
                'fecha_fin_contrato': 'Los contratos a término fijo requieren Fecha Fin de Contrato.'
            })

        # Validar duplicado de numero_identificacion
        from .models import Colaborador
        if Colaborador.objects.filter(
            numero_identificacion=attrs.get('numero_identificacion')
        ).exists():
            raise serializers.ValidationError({
                'numero_identificacion': (
                    f'Ya existe un colaborador con la identificación '
                    f'{attrs["numero_identificacion"]}.'
                )
            })

        # Resolver Cargo por nombre
        try:
            from apps.core.estructura_cargos.models import Cargo
            cargo = Cargo.objects.get(name__iexact=attrs['cargo_nombre'])
            attrs['_cargo'] = cargo
        except Exception:
            raise serializers.ValidationError({
                'cargo_nombre': (
                    f'No se encontró el cargo "{attrs["cargo_nombre"]}". '
                    f'Verifica el nombre exacto en la hoja "Valores Válidos".'
                )
            })

        # Resolver Área por nombre
        try:
            from apps.gestion_estrategica.organizacion.models import Area
            area = Area.objects.get(name__iexact=attrs['area_nombre'])
            attrs['_area'] = area
        except Exception:
            raise serializers.ValidationError({
                'area_nombre': (
                    f'No se encontró el área "{attrs["area_nombre"]}". '
                    f'Verifica el nombre exacto en la hoja "Valores Válidos".'
                )
            })

        # Validar acceso al sistema
        if crear_acceso:
            email_corp = str(attrs.get('email_corporativo', '')).strip()
            username = str(attrs.get('username', '')).strip()

            if not email_corp:
                raise serializers.ValidationError({
                    'email_corporativo': 'El email corporativo es requerido cuando Crear Acceso = Si.'
                })
            if '@' not in email_corp:
                raise serializers.ValidationError({
                    'email_corporativo': f'Email corporativo inválido: "{email_corp}".'
                })
            if not username:
                raise serializers.ValidationError({
                    'username': 'El username es requerido cuando Crear Acceso = Si.'
                })
            if ' ' in username:
                raise serializers.ValidationError({
                    'username': 'El username no puede contener espacios.'
                })
            if User.objects.filter(email=email_corp).exists():
                raise serializers.ValidationError({
                    'email_corporativo': f'El email "{email_corp}" ya está registrado en el sistema.'
                })
            if User.objects.filter(username=username).exists():
                raise serializers.ValidationError({
                    'username': f'El username "{username}" ya existe en el sistema.'
                })

            attrs['_email_corporativo'] = email_corp
            attrs['_username'] = username

        return attrs
