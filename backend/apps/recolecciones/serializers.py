# -*- coding: utf-8 -*-
"""
Serializers del modulo Recolecciones - Sistema de Gestion Grasas y Huesos del Norte
"""
from rest_framework import serializers
from django.utils import timezone
from decimal import Decimal
from .models import Recoleccion, CertificadoRecoleccion
from apps.programaciones.models import Programacion
from apps.ecoaliados.models import Ecoaliado


class RecoleccionListSerializer(serializers.ModelSerializer):
    """Serializer para listado de recolecciones"""

    ecoaliado_codigo = serializers.CharField(source='ecoaliado.codigo', read_only=True)
    ecoaliado_razon_social = serializers.CharField(source='ecoaliado.razon_social', read_only=True)
    ecoaliado_ciudad = serializers.CharField(source='ecoaliado.ciudad', read_only=True)
    recolector_nombre = serializers.CharField(source='recolector.get_full_name', read_only=True)
    programacion_codigo = serializers.SerializerMethodField()
    is_deleted = serializers.BooleanField(read_only=True)

    class Meta:
        model = Recoleccion
        fields = [
            'id',
            'codigo_voucher',
            'programacion',
            'programacion_codigo',
            'ecoaliado',
            'ecoaliado_codigo',
            'ecoaliado_razon_social',
            'ecoaliado_ciudad',
            'recolector',
            'recolector_nombre',
            'fecha_recoleccion',
            'cantidad_kg',
            'precio_kg',
            'valor_total',
            'porcentaje_acidez',
            'calidad',
            'requiere_prueba_acidez',
            'is_deleted',
            'created_at',
        ]

    def get_programacion_codigo(self, obj):
        """Obtiene el codigo de la programacion si existe"""
        if obj.programacion:
            return f"PROG-{obj.programacion.id:06d}"
        return None


class RecoleccionDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle completo de recoleccion"""

    ecoaliado_detalle = serializers.SerializerMethodField()
    recolector_nombre = serializers.CharField(source='recolector.get_full_name', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)
    programacion_detalle = serializers.SerializerMethodField()

    class Meta:
        model = Recoleccion
        fields = [
            'id',
            'codigo_voucher',
            'programacion',
            'programacion_detalle',
            'ecoaliado',
            'ecoaliado_detalle',
            'recolector',
            'recolector_nombre',
            'fecha_recoleccion',
            'cantidad_kg',
            'precio_kg',
            'valor_total',
            'porcentaje_acidez',
            'calidad',
            'requiere_prueba_acidez',
            'observaciones',
            'created_by',
            'created_by_nombre',
            'created_at',
            'updated_at',
            'deleted_at',
        ]

    def get_ecoaliado_detalle(self, obj):
        """Obtiene datos relevantes del ecoaliado"""
        if obj.ecoaliado:
            return {
                'id': obj.ecoaliado.id,
                'codigo': obj.ecoaliado.codigo,
                'razon_social': obj.ecoaliado.razon_social,
                'documento_tipo': obj.ecoaliado.documento_tipo,
                'documento_numero': obj.ecoaliado.documento_numero,
                'ciudad': obj.ecoaliado.ciudad,
                'direccion': obj.ecoaliado.direccion,
                'telefono': obj.ecoaliado.telefono,
                'precio_actual_kg': float(obj.ecoaliado.precio_compra_kg) if obj.ecoaliado.precio_compra_kg else None,
            }
        return None

    def get_programacion_detalle(self, obj):
        """Obtiene datos de la programacion asociada"""
        if obj.programacion:
            return {
                'id': obj.programacion.id,
                'codigo': f"PROG-{obj.programacion.id:06d}",
                'fecha_programada': obj.programacion.fecha_programada,
                'cantidad_estimada_kg': float(obj.programacion.cantidad_estimada_kg) if obj.programacion.cantidad_estimada_kg else None,
                'estado': obj.programacion.estado,
            }
        return None


class RegistrarRecoleccionSerializer(serializers.Serializer):
    """
    Serializer para registrar una nueva recoleccion desde una programacion EN_RUTA

    Flujo:
    1. Recolector abre programacion EN_RUTA
    2. Digita cantidad_kg pesada en bascula
    3. Ajusta precio_kg_real si es necesario (por defecto usa el del ecoaliado)
    4. Si el producto es ACU o Sebo Procesado, ingresa porcentaje de acidez
    5. Sistema calcula valor_total = cantidad_kg * precio_kg_real
    6. Se crea Recoleccion y se marca Programacion como COMPLETADA
    7. Se genera voucher para impresion
    """

    programacion_id = serializers.IntegerField(
        help_text='ID de la programacion a completar'
    )
    cantidad_kg = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal('0.01'),
        help_text='Cantidad recolectada en kilogramos'
    )
    valor_real_pagado = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal('1'),
        required=False,
        allow_null=True,
        help_text='Valor total real que pagó el conductor (puede diferir del sugerido)'
    )
    porcentaje_acidez = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        min_value=Decimal('0'),
        max_value=Decimal('100'),
        required=False,
        allow_null=True,
        help_text='Porcentaje de acidez para ACU y Sebo Procesado (0-100%)'
    )
    observaciones = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000,
        help_text='Observaciones del recolector'
    )

    def validate_programacion_id(self, value):
        """Valida que la programacion exista y este en estado correcto"""
        try:
            programacion = Programacion.objects.select_related(
                'ecoaliado', 'recolector_asignado'
            ).get(pk=value, deleted_at__isnull=True)
        except Programacion.DoesNotExist:
            raise serializers.ValidationError('La programacion no existe o fue eliminada')

        # Validar estado - debe ser EN_RUTA
        if programacion.estado != 'EN_RUTA':
            raise serializers.ValidationError(
                f'La programacion debe estar EN_RUTA para registrar recoleccion. Estado actual: {programacion.get_estado_display()}'
            )

        # Validar que no tenga ya una recoleccion
        if hasattr(programacion, 'recoleccion') and programacion.recoleccion:
            raise serializers.ValidationError(
                'Esta programacion ya tiene una recoleccion registrada'
            )

        # Guardar programacion para uso posterior
        self.context['programacion'] = programacion
        return value

    def validate(self, attrs):
        """Validaciones generales"""
        programacion = self.context.get('programacion')
        usuario = self.context.get('usuario')

        if not programacion:
            raise serializers.ValidationError({
                'programacion_id': 'Programacion no encontrada'
            })

        if not usuario:
            raise serializers.ValidationError({
                'detail': 'Usuario no autenticado'
            })

        # Validar que el usuario sea el recolector asignado o tenga permisos superiores
        if programacion.recolector_asignado != usuario:
            if usuario.cargo and usuario.cargo.code not in ['lider_log_econorte', 'gerente', 'superadmin']:
                raise serializers.ValidationError({
                    'detail': 'Solo el recolector asignado puede registrar esta recoleccion'
                })

        # Validar que el ecoaliado tenga precio configurado
        if not programacion.ecoaliado.precio_compra_kg or programacion.ecoaliado.precio_compra_kg <= 0:
            raise serializers.ValidationError({
                'detail': f'El ecoaliado {programacion.ecoaliado.razon_social} no tiene precio de compra configurado'
            })

        return attrs

    def create(self, validated_data):
        """
        Crea la recoleccion y actualiza la programacion a COMPLETADA
        """
        programacion = self.context['programacion']
        usuario = self.context['usuario']
        cantidad_kg = Decimal(str(validated_data['cantidad_kg']))
        observaciones = validated_data.get('observaciones', '')
        porcentaje_acidez = validated_data.get('porcentaje_acidez')

        # Obtener precio negociado del ecoaliado
        precio_kg = Decimal(str(programacion.ecoaliado.precio_compra_kg))

        # Si se proporciona valor_real_pagado, usarlo; sino calcular el sugerido
        valor_real_pagado = validated_data.get('valor_real_pagado')
        if valor_real_pagado and valor_real_pagado > 0:
            # Usar valor real pagado por el conductor (redondeado a entero generalmente)
            valor_total = Decimal(str(int(valor_real_pagado)))
        else:
            # Calcular valor sugerido (redondeado a entero para pesos colombianos)
            valor_total = Decimal(str(int(cantidad_kg * precio_kg)))

        # Determinar si requiere prueba de acidez (ACU siempre, ya que ecoaliados solo manejan ACU)
        # En el futuro podría depender del tipo de materia prima del ecoaliado
        requiere_prueba_acidez = True  # Ecoaliados solo manejan ACU

        # Crear recoleccion usando el constructor directamente para evitar
        # que el save() recalcule el valor_total
        recoleccion = Recoleccion(
            programacion=programacion,
            ecoaliado=programacion.ecoaliado,
            recolector=programacion.recolector_asignado,
            fecha_recoleccion=timezone.now(),
            cantidad_kg=cantidad_kg,
            precio_kg=precio_kg,
            valor_total=valor_total,
            porcentaje_acidez=porcentaje_acidez,
            requiere_prueba_acidez=requiere_prueba_acidez,
            observaciones=observaciones,
            created_by=usuario,
        )
        # Generar codigo voucher
        recoleccion.codigo_voucher = Recoleccion.generar_codigo_voucher()
        # La calidad se calcula automáticamente en el save() si hay porcentaje_acidez
        # Guardar - skip_validation porque ya validamos en el serializer
        recoleccion.save(skip_validation=True)

        # Actualizar programacion a COMPLETADA
        Programacion.objects.filter(pk=programacion.pk).update(
            estado='COMPLETADA',
            updated_at=timezone.now()
        )

        return recoleccion


class VoucherRecoleccionSerializer(serializers.ModelSerializer):
    """
    Serializer para generar datos del voucher de impresion

    Incluye toda la informacion necesaria para imprimir:
    - Datos de la empresa
    - Datos del ecoaliado
    - Detalle de la recoleccion
    - Totales
    """

    empresa = serializers.SerializerMethodField()
    ecoaliado_info = serializers.SerializerMethodField()
    recolector_nombre = serializers.CharField(source='recolector.get_full_name', read_only=True)
    detalle = serializers.SerializerMethodField()

    class Meta:
        model = Recoleccion
        fields = [
            'id',
            'codigo_voucher',
            'fecha_recoleccion',
            'empresa',
            'ecoaliado_info',
            'recolector_nombre',
            'detalle',
        ]

    def get_empresa(self, obj):
        """Datos de la empresa para el encabezado del voucher"""
        return {
            'nombre': 'GRASAS Y HUESOS DEL NORTE S.A.S.',
            'nit': '901.428.464-0',
            'direccion': 'Calle XX # XX-XX, Barranquilla',
            'telefono': '(605) XXX XXXX',
        }

    def get_ecoaliado_info(self, obj):
        """Datos del ecoaliado para el voucher"""
        if obj.ecoaliado:
            # Formar identificación con tipo + número
            identificacion = f"{obj.ecoaliado.documento_tipo}: {obj.ecoaliado.documento_numero}"
            return {
                'codigo': obj.ecoaliado.codigo,
                'razon_social': obj.ecoaliado.razon_social,
                'nit': identificacion,  # Mantener como 'nit' para compatibilidad con frontend
                'direccion': obj.ecoaliado.direccion,
                'ciudad': obj.ecoaliado.ciudad,
            }
        return None

    def get_detalle(self, obj):
        """Detalle de la recoleccion para el voucher"""
        return {
            'cantidad_kg': float(obj.cantidad_kg),
            'precio_kg': float(obj.precio_kg),
            'subtotal': float(obj.valor_total),
            'iva': 0,  # Sin IVA para compra de ACU
            'total': float(obj.valor_total),
            'total_letras': self._numero_a_letras(float(obj.valor_total)),
        }

    def _numero_a_letras(self, numero):
        """Convierte numero a letras (simplificado)"""
        # TODO: Implementar conversion completa
        return f"{numero:,.0f} PESOS M/CTE".replace(',', '.')


class RecoleccionEstadisticasSerializer(serializers.Serializer):
    """Serializer para estadisticas de recolecciones"""

    total_recolecciones = serializers.IntegerField()
    total_kg_recolectados = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_valor_pagado = serializers.DecimalField(max_digits=15, decimal_places=2)
    promedio_kg_por_recoleccion = serializers.DecimalField(max_digits=10, decimal_places=2)
    promedio_valor_por_recoleccion = serializers.DecimalField(max_digits=12, decimal_places=2)
    recolecciones_hoy = serializers.IntegerField()
    recolecciones_semana = serializers.IntegerField()
    recolecciones_mes = serializers.IntegerField()


class CertificadoRecoleccionSerializer(serializers.Serializer):
    """
    Serializer para generar certificado de recoleccion de un ecoaliado

    El certificado resume las recolecciones de un periodo determinado
    y es firmado por el Representante Legal.
    """

    PERIODO_CHOICES = [
        ('mensual', 'Mensual'),
        ('bimestral', 'Bimestral'),
        ('trimestral', 'Trimestral'),
        ('semestral', 'Semestral'),
        ('anual', 'Anual'),
        ('personalizado', 'Personalizado'),
    ]

    ecoaliado_id = serializers.IntegerField(
        help_text='ID del ecoaliado'
    )
    periodo = serializers.ChoiceField(
        choices=PERIODO_CHOICES,
        help_text='Tipo de periodo para el certificado'
    )
    año = serializers.IntegerField(
        required=False,
        help_text='Año del periodo (por defecto año actual)'
    )
    mes = serializers.IntegerField(
        required=False,
        min_value=1,
        max_value=12,
        help_text='Mes (1-12) para periodo mensual'
    )
    fecha_inicio = serializers.DateField(
        required=False,
        help_text='Fecha inicio para periodo personalizado'
    )
    fecha_fin = serializers.DateField(
        required=False,
        help_text='Fecha fin para periodo personalizado'
    )

    def validate_ecoaliado_id(self, value):
        """Valida que el ecoaliado exista"""
        try:
            ecoaliado = Ecoaliado.objects.get(pk=value, deleted_at__isnull=True)
        except Ecoaliado.DoesNotExist:
            raise serializers.ValidationError('El ecoaliado no existe o fue eliminado')
        self.context['ecoaliado'] = ecoaliado
        return value

    def validate(self, attrs):
        """Validaciones cruzadas"""
        from datetime import date
        from calendar import monthrange

        periodo = attrs.get('periodo')
        año = attrs.get('año', date.today().year)
        mes = attrs.get('mes')
        fecha_inicio = attrs.get('fecha_inicio')
        fecha_fin = attrs.get('fecha_fin')

        # Calcular fechas segun el periodo
        if periodo == 'mensual':
            if not mes:
                raise serializers.ValidationError({
                    'mes': 'El mes es requerido para periodo mensual'
                })
            ultimo_dia = monthrange(año, mes)[1]
            fecha_inicio = date(año, mes, 1)
            fecha_fin = date(año, mes, ultimo_dia)

        elif periodo == 'bimestral':
            if not mes:
                raise serializers.ValidationError({
                    'mes': 'El mes inicial es requerido para periodo bimestral'
                })
            # Bimestre = 2 meses, ajustar al inicio del bimestre
            mes = ((mes - 1) // 2) * 2 + 1
            mes_fin = mes + 1 if mes < 12 else 12
            ultimo_dia = monthrange(año, mes_fin)[1]
            fecha_inicio = date(año, mes, 1)
            fecha_fin = date(año, mes_fin, ultimo_dia)

        elif periodo == 'trimestral':
            if not mes:
                # Usar trimestre actual
                mes = ((date.today().month - 1) // 3) * 3 + 1
            # Ajustar al inicio del trimestre
            mes = ((mes - 1) // 3) * 3 + 1
            mes_fin = mes + 2
            ultimo_dia = monthrange(año, mes_fin)[1]
            fecha_inicio = date(año, mes, 1)
            fecha_fin = date(año, mes_fin, ultimo_dia)

        elif periodo == 'semestral':
            if not mes:
                # Usar semestre actual
                mes = 1 if date.today().month <= 6 else 7
            # Ajustar al inicio del semestre
            mes = 1 if mes <= 6 else 7
            mes_fin = 6 if mes == 1 else 12
            ultimo_dia = monthrange(año, mes_fin)[1]
            fecha_inicio = date(año, mes, 1)
            fecha_fin = date(año, mes_fin, ultimo_dia)

        elif periodo == 'anual':
            fecha_inicio = date(año, 1, 1)
            fecha_fin = date(año, 12, 31)

        elif periodo == 'personalizado':
            if not fecha_inicio or not fecha_fin:
                raise serializers.ValidationError({
                    'fecha_inicio': 'Las fechas son requeridas para periodo personalizado',
                    'fecha_fin': 'Las fechas son requeridas para periodo personalizado'
                })
            if fecha_inicio > fecha_fin:
                raise serializers.ValidationError({
                    'fecha_fin': 'La fecha fin debe ser posterior a la fecha inicio'
                })

        attrs['fecha_inicio_calculada'] = fecha_inicio
        attrs['fecha_fin_calculada'] = fecha_fin
        attrs['año'] = año

        return attrs

    def _get_descripcion_periodo(self, periodo, año, mes, fecha_inicio, fecha_fin):
        """Genera descripcion legible del periodo"""
        MESES = [
            '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ]

        # Usar mes de fecha_inicio si mes es None
        mes_efectivo = mes if mes is not None else fecha_inicio.month

        if periodo == 'mensual':
            return f"{MESES[mes_efectivo]} {año}"
        elif periodo == 'bimestral':
            # Calcular bimestre (1-6)
            bimestre = ((mes_efectivo - 1) // 2) + 1
            mes_inicio_bimestre = ((bimestre - 1) * 2) + 1
            mes_fin_bimestre = mes_inicio_bimestre + 1
            # Ordinales correctos: 1er, 2do, 3er, 4to, 5to, 6to
            if bimestre == 1:
                ordinal = "1er"
            elif bimestre == 2:
                ordinal = "2do"
            elif bimestre == 3:
                ordinal = "3er"
            else:
                ordinal = f"{bimestre}to"
            return f"{ordinal} Bimestre {año} ({MESES[mes_inicio_bimestre]} - {MESES[mes_fin_bimestre]})"
        elif periodo == 'trimestral':
            trimestre = ((mes_efectivo - 1) // 3) + 1
            # Ordinales correctos: 1er, 2do, 3er, 4to
            if trimestre == 1:
                ordinal = "1er"
            elif trimestre == 2:
                ordinal = "2do"
            elif trimestre == 3:
                ordinal = "3er"
            else:
                ordinal = "4to"
            return f"{ordinal} Trimestre {año}"
        elif periodo == 'semestral':
            semestre = 1 if mes_efectivo <= 6 else 2
            return f"{'Primer' if semestre == 1 else 'Segundo'} Semestre {año}"
        elif periodo == 'anual':
            return f"Año {año}"
        else:
            return f"{fecha_inicio.strftime('%d/%m/%Y')} - {fecha_fin.strftime('%d/%m/%Y')}"

    def generate_certificado(self):
        """Genera los datos del certificado"""
        from django.db.models import Sum, Avg, Count

        ecoaliado = self.context['ecoaliado']
        usuario = self.context.get('usuario')

        periodo = self.validated_data['periodo']
        año = self.validated_data['año']
        mes = self.validated_data.get('mes')
        fecha_inicio = self.validated_data['fecha_inicio_calculada']
        fecha_fin = self.validated_data['fecha_fin_calculada']

        # Obtener recolecciones del periodo
        recolecciones = Recoleccion.objects.filter(
            ecoaliado=ecoaliado,
            fecha_recoleccion__date__gte=fecha_inicio,
            fecha_recoleccion__date__lte=fecha_fin,
            deleted_at__isnull=True
        ).order_by('fecha_recoleccion')

        # Calcular estadisticas
        stats = recolecciones.aggregate(
            total_recolecciones=Count('id'),
            total_kg=Sum('cantidad_kg'),
            total_valor=Sum('valor_total'),
            promedio_kg=Avg('cantidad_kg'),
            promedio_precio=Avg('precio_kg')
        )

        # Preparar detalle de recolecciones
        detalle_recolecciones = [
            {
                'fecha': r.fecha_recoleccion.strftime('%d/%m/%Y'),
                'codigo_voucher': r.codigo_voucher,
                'cantidad_kg': float(r.cantidad_kg),
                'precio_kg': float(r.precio_kg),
                'valor_total': float(r.valor_total),
            }
            for r in recolecciones
        ]

        # Generar numero de certificado
        from datetime import datetime
        numero_certificado = f"CERT-{ecoaliado.codigo}-{datetime.now().strftime('%Y%m%d%H%M%S')}"

        # Descripcion del periodo
        descripcion_periodo = self._get_descripcion_periodo(periodo, año, mes, fecha_inicio, fecha_fin)

        # Preparar datos del certificado
        certificado_data = {
            'empresa': {
                'nombre': 'GRASAS Y HUESOS DEL NORTE S.A.S.',
                'nit': '901.428.464-0',
                'direccion': 'KDX7 Sector la Playa Vía San Faustino, Cúcuta',
                'telefono': '320 841 0277',
                'representante_legal': 'RAFAEL HERNAN RAMIREZ MOSQUERA',
            },
            'ecoaliado': {
                'codigo': ecoaliado.codigo,
                'razon_social': ecoaliado.razon_social,
                'documento_tipo': ecoaliado.documento_tipo,
                'documento_numero': ecoaliado.documento_numero,
                'direccion': ecoaliado.direccion,
                'ciudad': ecoaliado.ciudad,
                'departamento': ecoaliado.departamento,
                'telefono': ecoaliado.telefono,
            },
            'periodo': {
                'tipo': periodo,
                'fecha_inicio': fecha_inicio.isoformat(),
                'fecha_fin': fecha_fin.isoformat(),
                'descripcion': descripcion_periodo,
            },
            'resumen': {
                'total_recolecciones': stats['total_recolecciones'] or 0,
                'total_kg': float(stats['total_kg'] or 0),
                'total_valor': float(stats['total_valor'] or 0),
                'promedio_kg_por_recoleccion': float(stats['promedio_kg'] or 0),
                'precio_promedio_kg': float(stats['promedio_precio'] or 0),
            },
            'recolecciones': detalle_recolecciones,
            'numero_certificado': numero_certificado,
            'fecha_emision': timezone.now().isoformat(),
            'emitido_por': usuario.get_full_name() if usuario else 'Sistema',
        }

        # Guardar certificado en base de datos
        certificado_obj = CertificadoRecoleccion.objects.create(
            numero_certificado=numero_certificado,
            ecoaliado=ecoaliado,
            periodo=periodo,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            descripcion_periodo=descripcion_periodo,
            total_recolecciones=stats['total_recolecciones'] or 0,
            total_kg=Decimal(str(stats['total_kg'] or 0)),
            total_valor=Decimal(str(stats['total_valor'] or 0)),
            promedio_kg=Decimal(str(stats['promedio_kg'] or 0)),
            precio_promedio_kg=Decimal(str(stats['promedio_precio'] or 0)),
            datos_certificado=certificado_data,
            emitido_por=usuario,
        )

        # Agregar ID del certificado guardado
        certificado_data['id'] = certificado_obj.id

        return certificado_data


class CertificadoListSerializer(serializers.ModelSerializer):
    """Serializer para listado de certificados emitidos"""

    ecoaliado_codigo = serializers.CharField(source='ecoaliado.codigo', read_only=True)
    ecoaliado_razon_social = serializers.CharField(source='ecoaliado.razon_social', read_only=True)
    ecoaliado_ciudad = serializers.CharField(source='ecoaliado.ciudad', read_only=True)
    emitido_por_nombre = serializers.CharField(source='emitido_por.get_full_name', read_only=True)
    periodo_display = serializers.CharField(source='get_periodo_display', read_only=True)

    class Meta:
        model = CertificadoRecoleccion
        fields = [
            'id',
            'numero_certificado',
            'ecoaliado',
            'ecoaliado_codigo',
            'ecoaliado_razon_social',
            'ecoaliado_ciudad',
            'periodo',
            'periodo_display',
            'descripcion_periodo',
            'fecha_inicio',
            'fecha_fin',
            'total_recolecciones',
            'total_kg',
            'total_valor',
            'emitido_por',
            'emitido_por_nombre',
            'fecha_emision',
        ]


class CertificadoDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de certificado (incluye datos completos para reimprimir)"""

    ecoaliado_codigo = serializers.CharField(source='ecoaliado.codigo', read_only=True)
    ecoaliado_razon_social = serializers.CharField(source='ecoaliado.razon_social', read_only=True)
    emitido_por_nombre = serializers.CharField(source='emitido_por.get_full_name', read_only=True)
    periodo_display = serializers.CharField(source='get_periodo_display', read_only=True)

    class Meta:
        model = CertificadoRecoleccion
        fields = [
            'id',
            'numero_certificado',
            'ecoaliado',
            'ecoaliado_codigo',
            'ecoaliado_razon_social',
            'periodo',
            'periodo_display',
            'descripcion_periodo',
            'fecha_inicio',
            'fecha_fin',
            'total_recolecciones',
            'total_kg',
            'total_valor',
            'promedio_kg',
            'precio_promedio_kg',
            'datos_certificado',
            'emitido_por',
            'emitido_por_nombre',
            'fecha_emision',
            'deleted_at',
        ]
