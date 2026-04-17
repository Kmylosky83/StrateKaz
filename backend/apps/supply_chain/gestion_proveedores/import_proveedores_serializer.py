"""
Serializer de importación masiva de Proveedores desde Excel.
Valida y normaliza una fila del archivo antes de crear el Proveedor.
"""
from django.contrib.auth import get_user_model
from rest_framework import serializers

from .import_proveedores_utils import normalizar_valor, parsear_bool, parsear_entero

User = get_user_model()


class ProveedorImportRowSerializer(serializers.Serializer):
    """
    Valida una fila del Excel de importación y la convierte a datos listos
    para crear un Proveedor.

    Resuelve:
    - tipo_proveedor_nombre → tipo_proveedor (FK) via lookup
    - tipo_documento_nombre → tipo_documento (FK) via lookup
    - departamento_nombre → departamento (FK) via lookup
    """
    # Requeridos
    tipo_proveedor_nombre = serializers.CharField()
    nombre_comercial = serializers.CharField()
    razon_social = serializers.CharField()
    tipo_documento_nombre = serializers.CharField()
    numero_documento = serializers.CharField()

    # Opcionales
    nit = serializers.CharField(required=False, allow_blank=True, default='')
    telefono = serializers.CharField(required=False, allow_blank=True, default='')
    email = serializers.CharField(required=False, allow_blank=True, default='')
    direccion = serializers.CharField(required=False, allow_blank=True, default='')
    ciudad = serializers.CharField(required=False, allow_blank=True, default='')
    departamento_nombre = serializers.CharField(required=False, allow_blank=True, default='')
    banco = serializers.CharField(required=False, allow_blank=True, default='')
    numero_cuenta = serializers.CharField(required=False, allow_blank=True, default='')
    titular_cuenta = serializers.CharField(required=False, allow_blank=True, default='')
    dias_plazo_pago = serializers.CharField(required=False, default='0')
    observaciones = serializers.CharField(required=False, allow_blank=True, default='')

    # Acceso al portal (opcionales)
    crear_acceso = serializers.CharField(required=False, allow_blank=True, default='No')
    email_portal = serializers.CharField(required=False, allow_blank=True, default='')
    username = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_nombre_comercial(self, value):
        val = str(value).strip()
        if not val:
            raise serializers.ValidationError('El nombre comercial es requerido.')
        if len(val) > 200:
            raise serializers.ValidationError('El nombre comercial no puede exceder 200 caracteres.')
        return val

    def validate_razon_social(self, value):
        val = str(value).strip()
        if not val:
            raise serializers.ValidationError('La razón social es requerida.')
        if len(val) > 200:
            raise serializers.ValidationError('La razón social no puede exceder 200 caracteres.')
        return val

    def validate_numero_documento(self, value):
        val = str(value).strip()
        if not val:
            raise serializers.ValidationError('El número de documento es requerido.')
        if len(val) > 20:
            raise serializers.ValidationError('El número de documento no puede exceder 20 caracteres.')
        return val

    def validate(self, attrs):
        # Normalizar valores numéricos
        attrs['dias_plazo_pago'] = parsear_entero(attrs.get('dias_plazo_pago', '0'), default=0)

        from .models import Proveedor, TipoProveedor, TipoDocumentoIdentidad, Departamento

        # Verificar número de documento único (manager default excluye soft-deleted)
        numero_doc = attrs.get('numero_documento')
        if Proveedor.objects.filter(numero_documento=numero_doc).exists():
            raise serializers.ValidationError({
                'numero_documento': f'Ya existe un proveedor con el documento "{numero_doc}".'
            })

        # Resolver Tipo de Proveedor por nombre
        tipo_prov_nombre = str(attrs.get('tipo_proveedor_nombre', '')).strip()
        if tipo_prov_nombre:
            try:
                tipo_prov = TipoProveedor.objects.get(nombre__iexact=tipo_prov_nombre, is_active=True)
                attrs['_tipo_proveedor'] = tipo_prov
            except TipoProveedor.DoesNotExist:
                raise serializers.ValidationError({
                    'tipo_proveedor_nombre': (
                        f'No se encontró el tipo de proveedor "{tipo_prov_nombre}". '
                        f'Verifica el nombre exacto en la hoja "Referencia".'
                    )
                })
        else:
            raise serializers.ValidationError({
                'tipo_proveedor_nombre': 'El tipo de proveedor es requerido.'
            })

        # Resolver Tipo de Documento por nombre
        tipo_doc_nombre = str(attrs.get('tipo_documento_nombre', '')).strip()
        if tipo_doc_nombre:
            try:
                tipo_doc = TipoDocumentoIdentidad.objects.get(nombre__iexact=tipo_doc_nombre, is_active=True)
                attrs['_tipo_documento'] = tipo_doc
            except TipoDocumentoIdentidad.DoesNotExist:
                # Intentar match por código
                norm = normalizar_valor(tipo_doc_nombre)
                try:
                    tipo_doc = TipoDocumentoIdentidad.objects.get(codigo__iexact=norm, is_active=True)
                    attrs['_tipo_documento'] = tipo_doc
                except TipoDocumentoIdentidad.DoesNotExist:
                    raise serializers.ValidationError({
                        'tipo_documento_nombre': (
                            f'No se encontró el tipo de documento "{tipo_doc_nombre}". '
                            f'Verifica el nombre exacto en la hoja "Referencia".'
                        )
                    })
        else:
            raise serializers.ValidationError({
                'tipo_documento_nombre': 'El tipo de documento es requerido.'
            })

        # Resolver Departamento por nombre (opcional)
        depto_nombre = str(attrs.get('departamento_nombre', '')).strip()
        if depto_nombre:
            try:
                departamento = Departamento.objects.get(nombre__iexact=depto_nombre, is_active=True)
                attrs['_departamento'] = departamento
            except Departamento.DoesNotExist:
                raise serializers.ValidationError({
                    'departamento_nombre': (
                        f'No se encontró el departamento "{depto_nombre}". '
                        f'Verifica el nombre exacto en la hoja "Referencia".'
                    )
                })
        else:
            attrs['_departamento'] = None

        # ── Validar acceso al portal ─────────────────────────────────────
        crear_acceso = parsear_bool(attrs.get('crear_acceso', 'No'))
        attrs['_crear_acceso'] = crear_acceso

        if crear_acceso:
            email_portal = str(attrs.get('email_portal', '')).strip()
            username_val = str(attrs.get('username', '')).strip()

            if not email_portal:
                raise serializers.ValidationError({
                    'email_portal': 'El email de portal es requerido cuando Crear Acceso = Si.'
                })
            if '@' not in email_portal:
                raise serializers.ValidationError({
                    'email_portal': f'Email de portal inválido: "{email_portal}".'
                })
            if not username_val:
                raise serializers.ValidationError({
                    'username': 'El username es requerido cuando Crear Acceso = Si.'
                })
            if ' ' in username_val:
                raise serializers.ValidationError({
                    'username': 'El username no puede contener espacios.'
                })
            if len(username_val) > 150:
                raise serializers.ValidationError({
                    'username': 'El username no puede exceder 150 caracteres.'
                })
            if User.objects.filter(email=email_portal).exists():
                raise serializers.ValidationError({
                    'email_portal': f'El email "{email_portal}" ya está registrado en el sistema.'
                })
            if User.objects.filter(username=username_val).exists():
                raise serializers.ValidationError({
                    'username': f'El username "{username_val}" ya existe en el sistema.'
                })

            attrs['_email_portal'] = email_portal
            attrs['_username'] = username_val

        return attrs
