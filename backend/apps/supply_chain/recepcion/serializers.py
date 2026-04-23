"""
Serializers para Recepción — Supply Chain S3
"""
from decimal import Decimal

from rest_framework import serializers

from .models import RecepcionCalidad, VoucherLineaMP, VoucherRecepcion


class VoucherLineaMPSerializer(serializers.ModelSerializer):
    """Serializer para líneas de MP dentro de un VoucherRecepcion."""
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    producto_codigo = serializers.CharField(source='producto.codigo', read_only=True)
    requiere_qc = serializers.BooleanField(source='producto.requiere_qc_recepcion', read_only=True)

    class Meta:
        model = VoucherLineaMP
        fields = [
            'id', 'producto', 'producto_nombre', 'producto_codigo',
            'peso_bruto_kg', 'peso_tara_kg', 'peso_neto_kg', 'requiere_qc',
        ]
        read_only_fields = [
            'id', 'peso_neto_kg', 'producto_nombre', 'producto_codigo', 'requiere_qc',
        ]


class VoucherRecepcionListSerializer(serializers.ModelSerializer):
    """Serializer liviano para listados."""
    proveedor_nombre = serializers.CharField(source='proveedor.nombre_comercial', read_only=True)
    almacen_nombre = serializers.CharField(source='almacen_destino.nombre', read_only=True)
    modalidad_entrega_display = serializers.CharField(
        source='get_modalidad_entrega_display', read_only=True
    )
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    lineas = VoucherLineaMPSerializer(many=True, read_only=True)
    lineas_count = serializers.SerializerMethodField()
    peso_neto_total = serializers.SerializerMethodField()
    # H-SC-03: flags QC para UI
    requiere_qc = serializers.BooleanField(read_only=True)
    tiene_qc = serializers.BooleanField(read_only=True)

    class Meta:
        model = VoucherRecepcion
        fields = [
            'id',
            'proveedor', 'proveedor_nombre',
            'modalidad_entrega', 'modalidad_entrega_display',
            'fecha_viaje',
            'lineas', 'lineas_count', 'peso_neto_total',
            'almacen_destino', 'almacen_nombre',
            'estado', 'estado_display',
            'requiere_qc', 'tiene_qc',
            'created_at',
        ]

    def get_lineas_count(self, obj):
        return obj.lineas.count()

    def get_peso_neto_total(self, obj):
        total = sum((l.peso_neto_kg for l in obj.lineas.all()), Decimal('0.000'))
        return str(total)


class VoucherRecepcionSerializer(serializers.ModelSerializer):
    """Serializer completo para detalle / create / update."""
    proveedor_nombre = serializers.CharField(source='proveedor.nombre_comercial', read_only=True)
    uneg_transportista_nombre = serializers.CharField(
        source='uneg_transportista.nombre', read_only=True
    )
    almacen_nombre = serializers.CharField(source='almacen_destino.nombre', read_only=True)
    operador_nombre = serializers.CharField(source='operador_bascula.get_full_name', read_only=True)
    modalidad_entrega_display = serializers.CharField(
        source='get_modalidad_entrega_display', read_only=True
    )
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    lineas = VoucherLineaMPSerializer(many=True)
    lineas_count = serializers.SerializerMethodField()
    peso_neto_total = serializers.SerializerMethodField()
    # H-SC-03: flags QC para UI
    requiere_qc = serializers.BooleanField(read_only=True)
    tiene_qc = serializers.BooleanField(read_only=True)

    class Meta:
        model = VoucherRecepcion
        fields = [
            'id',
            # Partes
            'proveedor', 'proveedor_nombre',
            # Logística
            'modalidad_entrega', 'modalidad_entrega_display',
            'uneg_transportista', 'uneg_transportista_nombre',
            'fecha_viaje',
            # OC opcional
            'orden_compra',
            # Líneas de MP
            'lineas', 'lineas_count', 'peso_neto_total',
            # Destino
            'almacen_destino', 'almacen_nombre',
            # Operador
            'operador_bascula', 'operador_nombre',
            # Estado
            'estado', 'estado_display',
            'observaciones',
            # H-SC-03: flags QC
            'requiere_qc', 'tiene_qc',
            # Auditoría
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'created_at', 'updated_at',
        ]

    def get_lineas_count(self, obj):
        return obj.lineas.count()

    def get_peso_neto_total(self, obj):
        total = sum((l.peso_neto_kg for l in obj.lineas.all()), Decimal('0.000'))
        return str(total)

    def validate_almacen_destino(self, value):
        """
        H-SC-07: valida que el almacén destino pertenezca a la sede del
        operador (request.user.sede_asignada) si ambos tienen sede.

        Soft: si el almacén no tiene sede asignada (data vieja) o el user
        no tiene sede_asignada, la validación no aplica.
        """
        if value is None:
            return value

        request = self.context.get('request')
        user = getattr(request, 'user', None)
        sede_usuario = getattr(user, 'sede_asignada', None)
        sede_almacen = getattr(value, 'sede', None)

        if sede_usuario is not None and sede_almacen is not None:
            if sede_almacen_id := getattr(sede_almacen, 'pk', None):
                if sede_almacen_id != sede_usuario.pk:
                    raise serializers.ValidationError(
                        'El almacén pertenece a otra sede distinta a la tuya.'
                    )
        return value

    def validate(self, attrs):
        # Validar el header (modalidad vs uneg_transportista)
        modalidad = attrs.get('modalidad_entrega')
        uneg = attrs.get('uneg_transportista')
        if (
            modalidad == VoucherRecepcion.ModalidadEntrega.RECOLECCION
            and not uneg
        ):
            raise serializers.ValidationError({
                'uneg_transportista': (
                    'Modalidad RECOLECCION requiere especificar UNeg transportista.'
                )
            })
        return attrs

    def create(self, validated_data):
        lineas_data = validated_data.pop('lineas', [])
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        voucher = VoucherRecepcion.objects.create(**validated_data)
        for linea_data in lineas_data:
            VoucherLineaMP.objects.create(
                voucher=voucher,
                created_by=user,
                updated_by=user,
                **linea_data,
            )
        return voucher

    def update(self, instance, validated_data):
        # Las líneas no se actualizan vía PUT/PATCH del voucher header;
        # se gestionan con endpoints dedicados de línea cuando se necesite.
        validated_data.pop('lineas', None)
        return super().update(instance, validated_data)


class RecepcionCalidadSerializer(serializers.ModelSerializer):
    """Resultado de control de calidad aplicado al voucher."""
    voucher_codigo = serializers.IntegerField(source='voucher.pk', read_only=True)
    analista_nombre = serializers.CharField(source='analista.get_full_name', read_only=True)
    resultado_display = serializers.CharField(source='get_resultado_display', read_only=True)
    cumplimiento_specs = serializers.SerializerMethodField()

    class Meta:
        model = RecepcionCalidad
        fields = [
            'id',
            'voucher', 'voucher_codigo',
            'parametros_medidos',
            'resultado', 'resultado_display',
            'analista', 'analista_nombre',
            'fecha_analisis',
            'observaciones',
            'cumplimiento_specs',
            'created_at',
        ]
        read_only_fields = ['created_at', 'cumplimiento_specs']

    def get_cumplimiento_specs(self, obj):
        """
        Compara parametros_medidos contra las specs del primer producto con specs.

        Retorna:
            {
                "acidez": {"medido": 1.2, "rango": [0.5, 2.0], "cumple": true, "es_critico": true},
                "humedad": {"medido": 8.5, "rango": [0, 12], "cumple": true, "es_critico": false}
            }
        """
        from decimal import Decimal as D
        # Buscar la primera línea del voucher que tenga specs de calidad
        producto = None
        for linea in obj.voucher.lineas.select_related('producto').all():
            if hasattr(linea.producto, 'espec_calidad'):
                producto = linea.producto
                break
        if producto is None:
            return {}

        parametros_medidos = obj.parametros_medidos or {}
        result = {}
        for param in producto.espec_calidad.parametros.filter(is_deleted=False):
            nombre = param.nombre_parametro
            medido = parametros_medidos.get(nombre)
            if medido is None:
                result[nombre] = {
                    'medido': None,
                    'rango': [str(param.valor_min), str(param.valor_max)],
                    'cumple': False,
                    'es_critico': param.es_critico,
                    'unidad': param.unidad,
                    'faltante': True,
                }
                continue
            try:
                medido_dec = D(str(medido))
                cumple = param.valor_min <= medido_dec <= param.valor_max
            except (ValueError, TypeError):
                cumple = False
            result[nombre] = {
                'medido': str(medido),
                'rango': [str(param.valor_min), str(param.valor_max)],
                'cumple': cumple,
                'es_critico': param.es_critico,
                'unidad': param.unidad,
            }
        return result


class RegistrarQCSerializer(serializers.Serializer):
    """
    Serializer dedicado para el endpoint POST /vouchers/{id}/registrar-qc/.

    Crea o actualiza el RecepcionCalidad asociado al voucher. Valida que
    todos los parámetros CRÍTICOS del producto estén presentes en
    parametros_medidos.

    H-SC-03.
    """
    parametros_medidos = serializers.JSONField(
        help_text='Dict {nombre_parametro: valor_medido}. Ej: {"acidez": 1.2, "humedad": 8.5}'
    )
    resultado = serializers.ChoiceField(choices=RecepcionCalidad.ResultadoQC.choices)
    analista = serializers.IntegerField(required=False, help_text='User id del analista. Si se omite, se usa request.user.')
    fecha_analisis = serializers.DateTimeField(required=False)
    observaciones = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_parametros_medidos(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError(
                'parametros_medidos debe ser un objeto JSON (dict).'
            )
        return value

    def validate(self, attrs):
        """
        Valida que parámetros críticos del producto estén presentes.
        Si resultado=APROBADO, valida además que los críticos estén en rango.

        Multi-línea: valida contra la primera línea que tenga specs de calidad.
        """
        from decimal import Decimal
        voucher = self.context.get('voucher')
        if voucher is None:
            return attrs

        # Multi-linea: buscar la primera línea con specs de calidad
        linea_con_specs = None
        for linea in voucher.lineas.select_related('producto').all():
            if hasattr(linea.producto, 'espec_calidad'):
                linea_con_specs = linea
                break

        if linea_con_specs is None:
            # Sin specs — no hay nada que validar
            return attrs

        producto = linea_con_specs.producto
        parametros_medidos = attrs.get('parametros_medidos', {})
        parametros_criticos = producto.espec_calidad.parametros.filter(
            is_deleted=False, es_critico=True
        )

        faltantes = [
            p.nombre_parametro for p in parametros_criticos
            if p.nombre_parametro not in parametros_medidos
        ]
        if faltantes:
            raise serializers.ValidationError({
                'parametros_medidos': (
                    f'Faltan parámetros críticos: {", ".join(faltantes)}'
                )
            })

        # Si se pretende aprobar, validar rangos de parámetros críticos
        if attrs.get('resultado') == RecepcionCalidad.ResultadoQC.APROBADO:
            fuera_rango = []
            for p in parametros_criticos:
                medido = parametros_medidos.get(p.nombre_parametro)
                try:
                    medido_dec = Decimal(str(medido))
                    if not (p.valor_min <= medido_dec <= p.valor_max):
                        fuera_rango.append(
                            f'{p.nombre_parametro}={medido} fuera de rango '
                            f'[{p.valor_min}, {p.valor_max}]'
                        )
                except (ValueError, TypeError):
                    fuera_rango.append(
                        f'{p.nombre_parametro}={medido} inválido'
                    )
            if fuera_rango:
                raise serializers.ValidationError({
                    'parametros_medidos': (
                        f'No se puede marcar como APROBADO con parámetros '
                        f'críticos fuera de rango: {"; ".join(fuera_rango)}. '
                        f'Use resultado=CONDICIONAL o RECHAZADO.'
                    )
                })

        return attrs
