"""
Validadores centralizados para el sistema StrateKaz.
Estos validadores pueden ser usados en serializers y modelos.

Este modulo centraliza la logica de validacion comun para evitar duplicacion
y garantizar consistencia en todo el sistema.

Uso en Serializers:
    from apps.core.validators import UniqueCodeValidator, HexColorValidator

    class MySerializer(serializers.ModelSerializer):
        code = serializers.CharField(validators=[UniqueCodeValidator(MyModel)])
        color = serializers.CharField(validators=[HexColorValidator()])
"""
import re
from datetime import date, datetime
from decimal import Decimal
from typing import Any, List, Optional, Type, Tuple, Union

from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.password_validation import validate_password
from django.db.models import Model
from django.utils import timezone
from rest_framework import serializers


# =============================================================================
# VALIDADORES DE UNICIDAD
# =============================================================================

class UniqueCodeValidator:
    """
    Valida que un codigo sea unico en un modelo.

    Args:
        model_class: Clase del modelo Django
        field_name: Nombre del campo a validar (default: 'code')
        message: Mensaje de error personalizado
        case_sensitive: Si la comparacion es sensible a mayusculas

    Usage:
        code = serializers.CharField(validators=[UniqueCodeValidator(SystemModule)])

    En metodo validate_code de serializer:
        def validate_code(self, value):
            UniqueCodeValidator(MyModel)(value, self.instance)
            return value
    """

    requires_context = True

    def __init__(
        self,
        model_class: Type[Model],
        field_name: str = 'code',
        message: Optional[str] = None,
        case_sensitive: bool = False
    ):
        self.model_class = model_class
        self.field_name = field_name
        self.message = message or f'Este {field_name} ya existe.'
        self.case_sensitive = case_sensitive

    def __call__(self, value: str, serializer_field=None) -> str:
        """
        Valida unicidad del codigo.

        Args:
            value: Valor a validar
            serializer_field: Campo del serializer (para contexto)

        Returns:
            str: Valor validado

        Raises:
            serializers.ValidationError: Si el codigo ya existe
        """
        instance = None
        if serializer_field and hasattr(serializer_field, 'parent'):
            instance = getattr(serializer_field.parent, 'instance', None)

        return self.validate(value, instance)

    def validate(self, value: str, instance: Optional[Model] = None) -> str:
        """
        Metodo directo de validacion (para uso en validate_<field>).

        Args:
            value: Valor a validar
            instance: Instancia actual (para excluir en updates)

        Returns:
            str: Valor validado
        """
        if self.case_sensitive:
            lookup = {self.field_name: value}
        else:
            lookup = {f'{self.field_name}__iexact': value}

        queryset = self.model_class.objects.filter(**lookup)

        if instance and instance.pk:
            queryset = queryset.exclude(pk=instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(self.message)

        return value


class UniqueFieldValidator:
    """
    Validador generico para campos unicos.

    Similar a UniqueCodeValidator pero mas flexible para cualquier campo.

    Usage:
        email = serializers.EmailField(
            validators=[UniqueFieldValidator(User, 'email', 'Este email ya esta registrado')]
        )
    """

    requires_context = True

    def __init__(
        self,
        model_class: Type[Model],
        field_name: str,
        message: Optional[str] = None,
        case_sensitive: bool = True,
        filter_kwargs: Optional[dict] = None
    ):
        self.model_class = model_class
        self.field_name = field_name
        self.message = message or f'Este valor de {field_name} ya existe.'
        self.case_sensitive = case_sensitive
        self.filter_kwargs = filter_kwargs or {}

    def __call__(self, value: Any, serializer_field=None) -> Any:
        instance = None
        if serializer_field and hasattr(serializer_field, 'parent'):
            instance = getattr(serializer_field.parent, 'instance', None)

        return self.validate(value, instance)

    def validate(self, value: Any, instance: Optional[Model] = None) -> Any:
        if value is None:
            return value

        if isinstance(value, str) and not self.case_sensitive:
            lookup = {f'{self.field_name}__iexact': value}
        else:
            lookup = {self.field_name: value}

        lookup.update(self.filter_kwargs)
        queryset = self.model_class.objects.filter(**lookup)

        if instance and instance.pk:
            queryset = queryset.exclude(pk=instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(self.message)

        return value


# =============================================================================
# VALIDADORES DE FORMATO
# =============================================================================

class HexColorValidator:
    """
    Valida que un valor este en formato de color hexadecimal (#RRGGBB o #RGB).

    Usage:
        primary_color = serializers.CharField(validators=[HexColorValidator()])

    Acepta formatos:
        - #RRGGBB (ej: #FF5733)
        - #RGB (ej: #F53)
        - #RRGGBBAA (con alpha)
    """

    HEX_COLOR_PATTERN = re.compile(r'^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$')

    def __init__(
        self,
        message: Optional[str] = None,
        allow_empty: bool = True,
        normalize: bool = False
    ):
        self.message = message or 'El color debe estar en formato HEX (#RRGGBB)'
        self.allow_empty = allow_empty
        self.normalize = normalize

    def __call__(self, value: Optional[str]) -> Optional[str]:
        if not value:
            if self.allow_empty:
                return value
            raise serializers.ValidationError('El color es requerido')

        if not self.HEX_COLOR_PATTERN.match(value):
            raise serializers.ValidationError(self.message)

        if self.normalize:
            return value.upper()

        return value


class PhoneNumberValidator:
    """
    Valida formato de numero de telefono colombiano.

    Acepta formatos:
        - +57 XXX XXX XXXX
        - 57XXXXXXXXXX
        - 3XXXXXXXXX (celular)
        - (X) XXX XXXX (fijo)
    """

    PHONE_PATTERNS = [
        re.compile(r'^\+?57\s?\d{3}\s?\d{3}\s?\d{4}$'),  # Internacional
        re.compile(r'^3\d{9}$'),  # Celular
        re.compile(r'^\(\d\)\s?\d{3}\s?\d{4}$'),  # Fijo
        re.compile(r'^\d{7,10}$'),  # Generico
    ]

    def __init__(
        self,
        message: Optional[str] = None,
        allow_empty: bool = True
    ):
        self.message = message or 'Formato de telefono invalido'
        self.allow_empty = allow_empty

    def __call__(self, value: Optional[str]) -> Optional[str]:
        if not value:
            if self.allow_empty:
                return value
            raise serializers.ValidationError('El telefono es requerido')

        # Limpiar espacios y guiones
        cleaned = re.sub(r'[\s\-]', '', value)

        for pattern in self.PHONE_PATTERNS:
            if pattern.match(cleaned):
                return value

        raise serializers.ValidationError(self.message)


class NITColombiaValidator:
    """
    Valida NIT colombiano con digito de verificacion.

    Formato esperado: XXXXXXXXX-X (9 digitos + guion + digito verificacion)
    """

    NIT_PATTERN = re.compile(r'^(\d{9})-(\d)$')

    def __init__(self, message: Optional[str] = None):
        self.message = message or 'NIT invalido. Formato esperado: XXXXXXXXX-X'

    def __call__(self, value: str) -> str:
        if not value:
            raise serializers.ValidationError('El NIT es requerido')

        match = self.NIT_PATTERN.match(value)
        if not match:
            raise serializers.ValidationError(self.message)

        nit_base = match.group(1)
        dv_provided = int(match.group(2))
        dv_calculated = self._calculate_dv(nit_base)

        if dv_provided != dv_calculated:
            raise serializers.ValidationError(
                f'Digito de verificacion incorrecto. Deberia ser {dv_calculated}'
            )

        return value

    @staticmethod
    def _calculate_dv(nit: str) -> int:
        """Calcula el digito de verificacion del NIT usando algoritmo DIAN."""
        factors = [71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3]
        nit_padded = nit.zfill(15)

        total = sum(
            int(digit) * factor
            for digit, factor in zip(nit_padded, factors)
        )

        remainder = total % 11

        if remainder in (0, 1):
            return remainder
        return 11 - remainder


# =============================================================================
# VALIDADORES DE FECHAS
# =============================================================================

class DateRangeValidator:
    """
    Valida que una fecha de inicio sea anterior a una fecha de fin.

    Uso en metodo validate() del serializer:
        def validate(self, attrs):
            DateRangeValidator('start_date', 'end_date').validate_attrs(attrs)
            return attrs
    """

    def __init__(
        self,
        start_field: str = 'start_date',
        end_field: str = 'end_date',
        message: Optional[str] = None,
        allow_equal: bool = False
    ):
        self.start_field = start_field
        self.end_field = end_field
        self.message = message or f'La fecha de fin debe ser posterior a la fecha de inicio'
        self.allow_equal = allow_equal

    def validate_attrs(
        self,
        attrs: dict,
        instance: Optional[Model] = None
    ) -> None:
        """
        Valida atributos de un serializer.

        Args:
            attrs: Diccionario de atributos validados
            instance: Instancia actual (para obtener valores no proporcionados)
        """
        start_date = attrs.get(self.start_field)
        end_date = attrs.get(self.end_field)

        # Si es update, obtener valores de instancia si no se proporcionan
        if instance:
            if start_date is None and self.start_field not in attrs:
                start_date = getattr(instance, self.start_field, None)
            if end_date is None and self.end_field not in attrs:
                end_date = getattr(instance, self.end_field, None)

        if start_date and end_date:
            if self.allow_equal:
                if start_date > end_date:
                    raise serializers.ValidationError({
                        self.end_field: self.message
                    })
            else:
                if start_date >= end_date:
                    raise serializers.ValidationError({
                        self.end_field: self.message
                    })


class FutureDateValidator:
    """
    Valida que una fecha sea futura.

    Usage:
        expires_at = serializers.DateTimeField(validators=[FutureDateValidator()])
    """

    def __init__(
        self,
        message: Optional[str] = None,
        allow_today: bool = False
    ):
        self.message = message or 'La fecha debe ser futura'
        self.allow_today = allow_today

    def __call__(self, value: Union[date, datetime]) -> Union[date, datetime]:
        if value is None:
            return value

        now = timezone.now() if isinstance(value, datetime) else date.today()

        if self.allow_today:
            if value < now:
                raise serializers.ValidationError(self.message)
        else:
            if value <= now:
                raise serializers.ValidationError(self.message)

        return value


class PastDateValidator:
    """
    Valida que una fecha sea pasada o actual.

    Usage:
        birth_date = serializers.DateField(validators=[PastDateValidator()])
    """

    def __init__(
        self,
        message: Optional[str] = None,
        allow_today: bool = True
    ):
        self.message = message or 'La fecha debe ser pasada'
        self.allow_today = allow_today

    def __call__(self, value: Union[date, datetime]) -> Union[date, datetime]:
        if value is None:
            return value

        now = timezone.now() if isinstance(value, datetime) else date.today()

        if self.allow_today:
            if value > now:
                raise serializers.ValidationError(self.message)
        else:
            if value >= now:
                raise serializers.ValidationError(self.message)

        return value


# =============================================================================
# VALIDADORES DE CONFIRMACION
# =============================================================================

class ConfirmationValidator:
    """
    Valida que un campo de confirmacion sea True.

    Usado para acciones criticas como firmar politicas, aprobar planes, etc.

    Usage:
        confirm = serializers.BooleanField(validators=[ConfirmationValidator()])
    """

    def __init__(
        self,
        message: Optional[str] = None,
        action_name: str = 'la accion'
    ):
        self.message = message or f'Debe confirmar {action_name}'

    def __call__(self, value: bool) -> bool:
        if not value:
            raise serializers.ValidationError(self.message)
        return value


# =============================================================================
# VALIDADORES DE CONTRASENAS
# =============================================================================

class PasswordStrengthValidator:
    """
    Valida fortaleza de contrasena usando validadores de Django.

    Usage:
        password = serializers.CharField(validators=[PasswordStrengthValidator()])
    """

    def __init__(
        self,
        min_length: int = 8,
        use_django_validators: bool = True
    ):
        self.min_length = min_length
        self.use_django_validators = use_django_validators

    def __call__(self, value: str) -> str:
        if len(value) < self.min_length:
            raise serializers.ValidationError(
                f'La contrasena debe tener al menos {self.min_length} caracteres'
            )

        if self.use_django_validators:
            try:
                validate_password(value)
            except DjangoValidationError as e:
                raise serializers.ValidationError(list(e.messages))

        return value


class PasswordMatchValidator:
    """
    Valida que dos campos de contrasena coincidan.

    Uso en metodo validate() del serializer:
        def validate(self, attrs):
            PasswordMatchValidator().validate_attrs(attrs)
            return attrs
    """

    def __init__(
        self,
        password_field: str = 'password',
        confirm_field: str = 'password_confirm',
        message: Optional[str] = None
    ):
        self.password_field = password_field
        self.confirm_field = confirm_field
        self.message = message or 'Las contrasenas no coinciden'

    def validate_attrs(self, attrs: dict) -> str:
        """Valida y retorna la contrasena, eliminando el campo de confirmacion."""
        password = attrs.get(self.password_field)
        confirm = attrs.pop(self.confirm_field, None)

        if password != confirm:
            raise serializers.ValidationError({
                self.confirm_field: self.message
            })

        return password


# =============================================================================
# VALIDADORES DE COORDENADAS
# =============================================================================

class CoordinatesValidator:
    """
    Valida coordenadas geograficas (latitud/longitud).

    Uso en metodo validate() del serializer:
        def validate(self, attrs):
            CoordinatesValidator().validate_attrs(attrs, self.instance)
            return attrs
    """

    def __init__(
        self,
        lat_field: str = 'latitud',
        lng_field: str = 'longitud',
        both_or_none: bool = True
    ):
        self.lat_field = lat_field
        self.lng_field = lng_field
        self.both_or_none = both_or_none

    def validate_attrs(
        self,
        attrs: dict,
        instance: Optional[Model] = None
    ) -> None:
        lat = attrs.get(self.lat_field)
        lng = attrs.get(self.lng_field)

        # Si es update, obtener valores de instancia si no se proporcionan
        if instance:
            if lat is None and self.lat_field not in attrs:
                lat = getattr(instance, self.lat_field, None)
            if lng is None and self.lng_field not in attrs:
                lng = getattr(instance, self.lng_field, None)

        # Validar ambos o ninguno
        if self.both_or_none:
            if (lat is not None) != (lng is not None):
                raise serializers.ValidationError(
                    'Debe proporcionar ambas coordenadas (latitud y longitud) o ninguna.'
                )

        # Validar rangos
        if lat is not None and not (-90 <= lat <= 90):
            raise serializers.ValidationError({
                self.lat_field: 'La latitud debe estar entre -90 y 90 grados.'
            })

        if lng is not None and not (-180 <= lng <= 180):
            raise serializers.ValidationError({
                self.lng_field: 'La longitud debe estar entre -180 y 180 grados.'
            })


# =============================================================================
# VALIDADORES DE LISTAS
# =============================================================================

class NonEmptyListValidator:
    """
    Valida que una lista tenga al menos un elemento.

    Usage:
        permission_ids = serializers.ListField(
            validators=[NonEmptyListValidator('Debe proporcionar al menos un permiso')]
        )
    """

    def __init__(
        self,
        message: Optional[str] = None,
        min_items: int = 1
    ):
        self.message = message or f'Debe proporcionar al menos {min_items} elemento(s)'
        self.min_items = min_items

    def __call__(self, value: List) -> List:
        if not value or len(value) < self.min_items:
            raise serializers.ValidationError(self.message)
        return value


class IDsExistValidator:
    """
    Valida que una lista de IDs existan en un modelo.

    Usage:
        permission_ids = serializers.ListField(
            child=serializers.IntegerField(),
            validators=[IDsExistValidator(Permiso, filter_kwargs={'is_active': True})]
        )
    """

    def __init__(
        self,
        model_class: Type[Model],
        message: Optional[str] = None,
        filter_kwargs: Optional[dict] = None
    ):
        self.model_class = model_class
        self.message = message or 'Algunos IDs no existen o estan inactivos'
        self.filter_kwargs = filter_kwargs or {}

    def __call__(self, value: List[int]) -> List[int]:
        if not value:
            return value

        queryset = self.model_class.objects.filter(
            id__in=value,
            **self.filter_kwargs
        )

        if queryset.count() != len(value):
            raise serializers.ValidationError(self.message)

        return value


class UniqueListValidator:
    """
    Valida que una lista no tenga elementos duplicados.

    Usage:
        role_ids = serializers.ListField(validators=[UniqueListValidator()])
    """

    def __init__(self, message: Optional[str] = None):
        self.message = message or 'La lista contiene elementos duplicados'

    def __call__(self, value: List) -> List:
        if len(value) != len(set(value)):
            raise serializers.ValidationError(self.message)
        return value


# =============================================================================
# VALIDADORES DE TEXTO
# =============================================================================

class NoWhitespaceValidator:
    """
    Valida que un texto no contenga espacios en blanco.

    Usage:
        username = serializers.CharField(validators=[NoWhitespaceValidator()])
    """

    def __init__(
        self,
        message: Optional[str] = None,
        allow_internal: bool = False
    ):
        self.message = message or 'El valor no puede contener espacios'
        self.allow_internal = allow_internal

    def __call__(self, value: str) -> str:
        if self.allow_internal:
            # Solo validar espacios al inicio y final
            if value != value.strip():
                raise serializers.ValidationError(self.message)
        else:
            # No permitir ningun espacio
            if ' ' in value:
                raise serializers.ValidationError(self.message)

        return value


class MinMaxLengthValidator:
    """
    Valida longitud minima y maxima de texto.

    Usage:
        code = serializers.CharField(validators=[MinMaxLengthValidator(2, 10)])
    """

    def __init__(
        self,
        min_length: Optional[int] = None,
        max_length: Optional[int] = None
    ):
        self.min_length = min_length
        self.max_length = max_length

    def __call__(self, value: str) -> str:
        if self.min_length and len(value) < self.min_length:
            raise serializers.ValidationError(
                f'El valor debe tener al menos {self.min_length} caracteres'
            )

        if self.max_length and len(value) > self.max_length:
            raise serializers.ValidationError(
                f'El valor no puede exceder {self.max_length} caracteres'
            )

        return value


# =============================================================================
# VALIDADORES DE NUMEROS
# =============================================================================

class PositiveNumberValidator:
    """
    Valida que un numero sea positivo.

    Usage:
        cantidad = serializers.IntegerField(validators=[PositiveNumberValidator()])
    """

    def __init__(
        self,
        message: Optional[str] = None,
        allow_zero: bool = False
    ):
        self.message = message or 'El valor debe ser positivo'
        self.allow_zero = allow_zero

    def __call__(self, value: Union[int, float, Decimal]) -> Union[int, float, Decimal]:
        if self.allow_zero:
            if value < 0:
                raise serializers.ValidationError(self.message)
        else:
            if value <= 0:
                raise serializers.ValidationError(self.message)

        return value


class RangeValidator:
    """
    Valida que un numero este dentro de un rango.

    Usage:
        progress = serializers.IntegerField(validators=[RangeValidator(0, 100)])
    """

    def __init__(
        self,
        min_value: Optional[Union[int, float, Decimal]] = None,
        max_value: Optional[Union[int, float, Decimal]] = None,
        message: Optional[str] = None
    ):
        self.min_value = min_value
        self.max_value = max_value
        self.message = message

    def __call__(self, value: Union[int, float, Decimal]) -> Union[int, float, Decimal]:
        if self.min_value is not None and value < self.min_value:
            msg = self.message or f'El valor debe ser mayor o igual a {self.min_value}'
            raise serializers.ValidationError(msg)

        if self.max_value is not None and value > self.max_value:
            msg = self.message or f'El valor debe ser menor o igual a {self.max_value}'
            raise serializers.ValidationError(msg)

        return value


# =============================================================================
# VALIDADORES COMPUESTOS
# =============================================================================

class DifferentFieldsValidator:
    """
    Valida que dos campos sean diferentes.

    Util para validar que nueva contrasena sea diferente a la actual, etc.

    Uso en metodo validate() del serializer:
        def validate(self, attrs):
            DifferentFieldsValidator('old_password', 'new_password').validate_attrs(attrs)
            return attrs
    """

    def __init__(
        self,
        field1: str,
        field2: str,
        message: Optional[str] = None
    ):
        self.field1 = field1
        self.field2 = field2
        self.message = message or f'{field2} debe ser diferente de {field1}'

    def validate_attrs(self, attrs: dict) -> None:
        value1 = attrs.get(self.field1)
        value2 = attrs.get(self.field2)

        if value1 and value2 and value1 == value2:
            raise serializers.ValidationError({
                self.field2: self.message
            })


class UniqueTogetherValidator:
    """
    Valida unicidad de combinacion de campos.

    Uso en metodo validate() del serializer:
        def validate(self, attrs):
            UniqueTogetherValidator(
                MyModel, ['plan_id', 'code'],
                'Este codigo ya existe en el plan'
            ).validate_attrs(attrs, self.instance)
            return attrs
    """

    def __init__(
        self,
        model_class: Type[Model],
        fields: List[str],
        message: Optional[str] = None
    ):
        self.model_class = model_class
        self.fields = fields
        self.message = message or 'Esta combinacion de valores ya existe'

    def validate_attrs(
        self,
        attrs: dict,
        instance: Optional[Model] = None
    ) -> None:
        lookup = {}
        for field in self.fields:
            value = attrs.get(field)
            if value is None and instance:
                value = getattr(instance, field, None)
            if value is not None:
                lookup[field] = value

        # Solo validar si tenemos todos los campos
        if len(lookup) != len(self.fields):
            return

        queryset = self.model_class.objects.filter(**lookup)

        if instance and instance.pk:
            queryset = queryset.exclude(pk=instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(self.message)


# =============================================================================
# FUNCIONES AUXILIARES DE VALIDACION
# =============================================================================

def validate_unique_code(
    model_class: Type[Model],
    value: str,
    instance: Optional[Model] = None,
    field_name: str = 'code',
    message: Optional[str] = None
) -> str:
    """
    Funcion auxiliar para validar codigo unico.

    Usage en validate_code():
        def validate_code(self, value):
            return validate_unique_code(MyModel, value, self.instance)
    """
    validator = UniqueCodeValidator(model_class, field_name, message)
    return validator.validate(value, instance)


def validate_hex_color(value: Optional[str], allow_empty: bool = True) -> Optional[str]:
    """
    Funcion auxiliar para validar color hexadecimal.

    Usage en validate_color():
        def validate_primary_color(self, value):
            return validate_hex_color(value)
    """
    validator = HexColorValidator(allow_empty=allow_empty)
    return validator(value)


def validate_ids_exist(
    model_class: Type[Model],
    ids: List[int],
    filter_kwargs: Optional[dict] = None,
    message: Optional[str] = None
) -> List[int]:
    """
    Funcion auxiliar para validar que IDs existan.

    Usage:
        def validate_permission_ids(self, value):
            return validate_ids_exist(Permiso, value, {'is_active': True})
    """
    validator = IDsExistValidator(model_class, message, filter_kwargs)
    return validator(value)


def validate_date_range(
    attrs: dict,
    start_field: str = 'start_date',
    end_field: str = 'end_date',
    instance: Optional[Model] = None,
    message: Optional[str] = None
) -> None:
    """
    Funcion auxiliar para validar rango de fechas.

    Usage en validate():
        def validate(self, attrs):
            validate_date_range(attrs, instance=self.instance)
            return attrs
    """
    validator = DateRangeValidator(start_field, end_field, message)
    validator.validate_attrs(attrs, instance)


# =============================================================================
# VALIDADORES DE ESTADO Y ACTIVIDAD
# =============================================================================

class ActiveRelationValidator:
    """
    Valida que un objeto relacionado este activo.

    Patron encontrado en:
    - UserUpdateSerializer.validate_cargo_id

    Usage:
        def validate_cargo_id(self, value):
            return ActiveRelationValidator('is_active', 'El cargo no esta activo').validate(value)
    """

    def __init__(
        self,
        active_field: str = 'is_active',
        message: Optional[str] = None
    ):
        self.active_field = active_field
        self.message = message or 'El objeto seleccionado no esta activo'

    def __call__(self, value: Optional[Model]) -> Optional[Model]:
        return self.validate(value)

    def validate(self, value: Optional[Model]) -> Optional[Model]:
        if value is None:
            return value

        if not getattr(value, self.active_field, True):
            raise serializers.ValidationError(self.message)

        return value


class RequiredIfValidator:
    """
    Valida que campos sean requeridos condicionalmente.

    Patron encontrado en:
    - RolAdicionalCreateSerializer.validate (requiere_certificacion -> certificacion_requerida)
    - AsignarRolAdicionalSerializer.validate

    Uso en metodo validate() del serializer:
        def validate(self, attrs):
            RequiredIfValidator(
                condition_field='requiere_certificacion',
                condition_value=True,
                required_fields=['certificado_numero', 'certificado_vigencia']
            ).validate_attrs(attrs)
            return attrs
    """

    def __init__(
        self,
        condition_field: str,
        condition_value: Any,
        required_fields: List[str],
        message_template: Optional[str] = None
    ):
        self.condition_field = condition_field
        self.condition_value = condition_value
        self.required_fields = required_fields
        self.message_template = message_template or 'Este campo es requerido cuando {condition_field} es {condition_value}'

    def validate_attrs(self, attrs: dict) -> None:
        """
        Valida campos requeridos condicionalmente.

        Args:
            attrs: Diccionario de atributos validados

        Raises:
            serializers.ValidationError: Si faltan campos requeridos
        """
        if attrs.get(self.condition_field) != self.condition_value:
            return

        errors = {}
        for field in self.required_fields:
            if not attrs.get(field):
                msg = self.message_template.format(
                    condition_field=self.condition_field,
                    condition_value=self.condition_value
                )
                errors[field] = msg

        if errors:
            raise serializers.ValidationError(errors)


class DisjointListsValidator:
    """
    Valida que dos listas no tengan elementos en comun.

    Patron encontrado en:
    - AsignarRolesSerializer.validate (add_role_ids vs remove_role_ids)

    Uso en metodo validate() del serializer:
        def validate(self, attrs):
            DisjointListsValidator(
                'add_role_ids', 'remove_role_ids',
                'No puede agregar y quitar los mismos roles'
            ).validate_attrs(attrs)
            return attrs
    """

    def __init__(
        self,
        list1_field: str,
        list2_field: str,
        message: Optional[str] = None
    ):
        self.list1_field = list1_field
        self.list2_field = list2_field
        self.message = message or 'Las listas no pueden tener elementos en comun'

    def validate_attrs(self, attrs: dict) -> None:
        """
        Valida que las listas sean disjuntas.

        Args:
            attrs: Diccionario de atributos validados

        Raises:
            serializers.ValidationError: Si hay elementos en comun
        """
        list1 = set(attrs.get(self.list1_field) or [])
        list2 = set(attrs.get(self.list2_field) or [])

        common = list1 & list2
        if common:
            raise serializers.ValidationError(
                f"{self.message}: {common}"
            )


class AtLeastOneRequiredValidator:
    """
    Valida que al menos uno de los campos tenga valor.

    Patron encontrado en:
    - AsignarRolesSerializer.validate

    Uso en metodo validate() del serializer:
        def validate(self, attrs):
            AtLeastOneRequiredValidator(
                ['add_role_ids', 'remove_role_ids'],
                'Debe proporcionar add_role_ids o remove_role_ids'
            ).validate_attrs(attrs)
            return attrs
    """

    def __init__(
        self,
        fields: List[str],
        message: Optional[str] = None
    ):
        self.fields = fields
        self.message = message or f'Debe proporcionar al menos uno de: {", ".join(fields)}'

    def validate_attrs(self, attrs: dict) -> None:
        """
        Valida que al menos un campo tenga valor.

        Args:
            attrs: Diccionario de atributos validados

        Raises:
            serializers.ValidationError: Si ningun campo tiene valor
        """
        has_value = any(attrs.get(field) for field in self.fields)

        if not has_value:
            raise serializers.ValidationError(self.message)


class UniquePrincipalValidator:
    """
    Valida que solo exista un registro con un campo booleano en True.

    Patron encontrado en:
    - SedeEmpresaSerializer.validate (es_sede_principal)

    Uso en metodo validate() del serializer:
        def validate(self, attrs):
            UniquePrincipalValidator(
                SedeEmpresa, 'es_sede_principal',
                instance=self.instance
            ).validate_attrs(attrs)
            return attrs
    """

    def __init__(
        self,
        model_class: Type[Model],
        field: str,
        instance: Optional[Model] = None,
        message: Optional[str] = None,
        name_field: str = 'nombre'
    ):
        self.model_class = model_class
        self.field = field
        self.instance = instance
        self.message = message or f'Solo puede haber un registro con {field} activo'
        self.name_field = name_field

    def validate_attrs(self, attrs: dict) -> None:
        """
        Valida unicidad del campo booleano.

        Args:
            attrs: Diccionario de atributos validados

        Raises:
            serializers.ValidationError: Si ya existe otro con el campo True
        """
        if not attrs.get(self.field, False):
            return

        filter_kwargs = {self.field: True}
        existing = self.model_class.objects.filter(**filter_kwargs)

        if self.instance and self.instance.pk:
            existing = existing.exclude(pk=self.instance.pk)

        if existing.exists():
            existing_obj = existing.first()
            name = getattr(existing_obj, self.name_field, None) or str(existing_obj)
            raise serializers.ValidationError({
                self.field: f"{self.message}: {name}"
            })


class SystemRoleProtectionValidator:
    """
    Valida que roles/cargos del sistema no sean modificados.

    Patron encontrado en:
    - RoleUpdateSerializer.validate
    - CargoUpdateSerializer.validate
    - RolAdicionalUpdateSerializer.validate

    Uso en metodo validate() del serializer:
        def validate(self, attrs):
            SystemRoleProtectionValidator(
                self.instance,
                allowed_fields=['is_active', 'descripcion']
            ).validate_attrs(attrs)
            return attrs
    """

    def __init__(
        self,
        instance: Optional[Model],
        system_field: str = 'is_system',
        allowed_fields: Optional[List[str]] = None,
        message: Optional[str] = None
    ):
        self.instance = instance
        self.system_field = system_field
        self.allowed_fields = set(allowed_fields or ['is_active'])
        self.message = message or 'Los registros del sistema no pueden modificar: {fields}'

    def validate_attrs(self, attrs: dict) -> None:
        """
        Valida proteccion de registros del sistema.

        Args:
            attrs: Diccionario de atributos validados

        Raises:
            serializers.ValidationError: Si se intentan modificar campos protegidos
        """
        if not self.instance or not getattr(self.instance, self.system_field, False):
            return

        changed_fields = set(attrs.keys()) - self.allowed_fields

        if changed_fields:
            raise serializers.ValidationError(
                self.message.format(fields=', '.join(changed_fields))
            )


class NoSelfReferenceValidator:
    """
    Valida que un FK no apunte a si mismo (evita ciclos).

    Usage:
        def validate_parent(self, value):
            return NoSelfReferenceValidator(self.instance).validate(value)
    """

    def __init__(
        self,
        instance: Optional[Model],
        message: Optional[str] = None
    ):
        self.instance = instance
        self.message = message or 'No puede referenciarse a si mismo'

    def __call__(self, value: Optional[Model]) -> Optional[Model]:
        return self.validate(value)

    def validate(self, value: Optional[Model]) -> Optional[Model]:
        if value is None or self.instance is None:
            return value

        if hasattr(value, 'pk') and value.pk == self.instance.pk:
            raise serializers.ValidationError(self.message)

        return value


# =============================================================================
# VALIDADORES DE CERTIFICACION
# =============================================================================

class CertificationValidator:
    """
    Valida datos de certificacion cuando son requeridos.

    Patron encontrado en:
    - AsignarRolAdicionalSerializer.validate

    Uso en metodo validate() del serializer:
        def validate(self, attrs):
            # Obtener el rol para verificar si requiere certificacion
            rol = RolAdicional.objects.get(id=attrs['rol_adicional_id'])
            CertificationValidator(rol.requiere_certificacion).validate_attrs(attrs)
            return attrs
    """

    def __init__(
        self,
        requires_certification: bool,
        number_field: str = 'certificado_numero',
        expiry_field: str = 'certificado_vigencia',
        entity_field: Optional[str] = 'certificado_entidad'
    ):
        self.requires_certification = requires_certification
        self.number_field = number_field
        self.expiry_field = expiry_field
        self.entity_field = entity_field

    def validate_attrs(self, attrs: dict) -> None:
        """
        Valida datos de certificacion.

        Args:
            attrs: Diccionario de atributos validados

        Raises:
            serializers.ValidationError: Si faltan datos de certificacion
        """
        if not self.requires_certification:
            return

        errors = {}

        if not attrs.get(self.number_field):
            errors[self.number_field] = 'Este campo requiere numero de certificado'

        if not attrs.get(self.expiry_field):
            errors[self.expiry_field] = 'Este campo requiere fecha de vigencia'

        if errors:
            raise serializers.ValidationError(errors)


# =============================================================================
# FUNCIONES AUXILIARES ADICIONALES
# =============================================================================

def validate_active_relation(
    value: Optional[Model],
    active_field: str = 'is_active',
    message: Optional[str] = None
) -> Optional[Model]:
    """
    Funcion auxiliar para validar que un objeto relacionado este activo.

    Usage:
        def validate_cargo(self, value):
            return validate_active_relation(value, message='El cargo no esta activo')
    """
    validator = ActiveRelationValidator(active_field, message)
    return validator.validate(value)


def validate_confirmation(value: bool, action_name: str = 'la accion') -> bool:
    """
    Funcion auxiliar para validar confirmacion.

    Usage:
        def validate_confirm(self, value):
            return validate_confirmation(value, 'la firma de la politica')
    """
    validator = ConfirmationValidator(action_name=action_name)
    return validator(value)


def validate_password_match(
    attrs: dict,
    password_field: str = 'password',
    confirm_field: str = 'password_confirm',
    message: Optional[str] = None
) -> str:
    """
    Funcion auxiliar para validar coincidencia de contrasenas.

    Usage:
        def validate(self, attrs):
            password = validate_password_match(attrs)
            return attrs
    """
    validator = PasswordMatchValidator(password_field, confirm_field, message)
    return validator.validate_attrs(attrs)


def validate_coordinates(
    attrs: dict,
    lat_field: str = 'latitud',
    lng_field: str = 'longitud',
    instance: Optional[Model] = None
) -> None:
    """
    Funcion auxiliar para validar coordenadas.

    Usage:
        def validate(self, attrs):
            validate_coordinates(attrs, instance=self.instance)
            return attrs
    """
    validator = CoordinatesValidator(lat_field, lng_field)
    validator.validate_attrs(attrs, instance)
