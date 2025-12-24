from rest_framework import serializers
from .models import (
    CategoriaFlujo,
    PlantillaFlujo,
    NodoFlujo,
    TransicionFlujo,
    CampoFormulario,
    RolFlujo
)


class CategoriaFlujoSerializer(serializers.ModelSerializer):
    """Serializer para CategoriaFlujo"""
    total_plantillas = serializers.SerializerMethodField()
    created_by_nombre = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )

    class Meta:
        model = CategoriaFlujo
        fields = [
            'id',
            'empresa_id',
            'codigo',
            'nombre',
            'descripcion',
            'color',
            'icono',
            'orden',
            'activo',
            'total_plantillas',
            'created_by',
            'created_by_nombre',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['empresa_id', 'created_by', 'created_at', 'updated_at']

    def get_total_plantillas(self, obj):
        """Retorna el total de plantillas en esta categoría"""
        return obj.plantillas.count()


class PlantillaFlujoSerializer(serializers.ModelSerializer):
    """Serializer para PlantillaFlujo"""
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    categoria_color = serializers.CharField(source='categoria.color', read_only=True)
    created_by_nombre = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )
    activado_por_nombre = serializers.CharField(
        source='activado_por.get_full_name',
        read_only=True
    )
    plantilla_origen_nombre = serializers.CharField(
        source='plantilla_origen.nombre',
        read_only=True
    )
    total_nodos = serializers.SerializerMethodField()
    total_transiciones = serializers.SerializerMethodField()
    puede_activar = serializers.SerializerMethodField()

    class Meta:
        model = PlantillaFlujo
        fields = [
            'id',
            'empresa_id',
            'categoria',
            'categoria_nombre',
            'categoria_color',
            'codigo',
            'nombre',
            'descripcion',
            'version',
            'estado',
            'xml_bpmn',
            'json_diagram',
            'tiempo_estimado_horas',
            'requiere_aprobacion_gerencia',
            'permite_cancelacion',
            'etiquetas',
            'plantilla_origen',
            'plantilla_origen_nombre',
            'fecha_activacion',
            'fecha_obsolescencia',
            'total_nodos',
            'total_transiciones',
            'puede_activar',
            'created_by',
            'created_by_nombre',
            'activado_por',
            'activado_por_nombre',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'empresa_id',
            'created_by',
            'activado_por',
            'fecha_activacion',
            'fecha_obsolescencia',
            'created_at',
            'updated_at'
        ]

    def get_total_nodos(self, obj):
        """Retorna el total de nodos en esta plantilla"""
        return obj.nodos.count()

    def get_total_transiciones(self, obj):
        """Retorna el total de transiciones en esta plantilla"""
        return obj.transiciones.count()

    def get_puede_activar(self, obj):
        """Indica si la plantilla puede ser activada"""
        # Solo puede activarse si está en BORRADOR y tiene al menos un nodo INICIO y FIN
        if obj.estado != 'BORRADOR':
            return False

        tiene_inicio = obj.nodos.filter(tipo='INICIO').exists()
        tiene_fin = obj.nodos.filter(tipo='FIN').exists()

        return tiene_inicio and tiene_fin

    def validate(self, data):
        """Validaciones personalizadas"""
        # Validar que la categoría pertenezca a la misma empresa
        if 'categoria' in data:
            request = self.context.get('request')
            if request and hasattr(request.user, 'empresa_id'):
                if data['categoria'].empresa_id != request.user.empresa_id:
                    raise serializers.ValidationError({
                        'categoria': 'La categoría debe pertenecer a la misma empresa'
                    })

        return data


class NodoFlujoSerializer(serializers.ModelSerializer):
    """Serializer para NodoFlujo"""
    plantilla_nombre = serializers.CharField(source='plantilla.nombre', read_only=True)
    plantilla_codigo = serializers.CharField(source='plantilla.codigo', read_only=True)
    rol_asignado_nombre = serializers.CharField(source='rol_asignado.nombre', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    created_by_nombre = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )
    total_campos_formulario = serializers.SerializerMethodField()
    total_transiciones_salida = serializers.SerializerMethodField()
    total_transiciones_entrada = serializers.SerializerMethodField()
    es_tarea = serializers.BooleanField(read_only=True)
    es_gateway = serializers.BooleanField(read_only=True)

    class Meta:
        model = NodoFlujo
        fields = [
            'id',
            'empresa_id',
            'plantilla',
            'plantilla_nombre',
            'plantilla_codigo',
            'tipo',
            'tipo_display',
            'codigo',
            'nombre',
            'descripcion',
            'posicion_x',
            'posicion_y',
            'rol_asignado',
            'rol_asignado_nombre',
            'tiempo_estimado_horas',
            'configuracion',
            'total_campos_formulario',
            'total_transiciones_salida',
            'total_transiciones_entrada',
            'es_tarea',
            'es_gateway',
            'created_by',
            'created_by_nombre',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['empresa_id', 'created_by', 'created_at', 'updated_at']

    def get_total_campos_formulario(self, obj):
        """Retorna el total de campos de formulario (solo para tareas)"""
        if obj.tipo == 'TAREA':
            return obj.campos_formulario.count()
        return 0

    def get_total_transiciones_salida(self, obj):
        """Retorna el total de transiciones de salida"""
        return obj.transiciones_salida.count()

    def get_total_transiciones_entrada(self, obj):
        """Retorna el total de transiciones de entrada"""
        return obj.transiciones_entrada.count()

    def validate(self, data):
        """Validaciones personalizadas"""
        # Validar que la plantilla pertenezca a la misma empresa
        if 'plantilla' in data:
            request = self.context.get('request')
            if request and hasattr(request.user, 'empresa_id'):
                if data['plantilla'].empresa_id != request.user.empresa_id:
                    raise serializers.ValidationError({
                        'plantilla': 'La plantilla debe pertenecer a la misma empresa'
                    })

        # Validar que nodos tipo TAREA tengan rol asignado
        if data.get('tipo') == 'TAREA' and not data.get('rol_asignado'):
            raise serializers.ValidationError({
                'rol_asignado': 'Los nodos de tipo TAREA deben tener un rol asignado'
            })

        # Validar que solo TAREA tenga rol asignado
        if data.get('tipo') != 'TAREA' and data.get('rol_asignado'):
            raise serializers.ValidationError({
                'rol_asignado': 'Solo los nodos de tipo TAREA pueden tener rol asignado'
            })

        return data


class TransicionFlujoSerializer(serializers.ModelSerializer):
    """Serializer para TransicionFlujo"""
    plantilla_nombre = serializers.CharField(source='plantilla.nombre', read_only=True)
    nodo_origen_nombre = serializers.CharField(source='nodo_origen.nombre', read_only=True)
    nodo_origen_tipo = serializers.CharField(source='nodo_origen.tipo', read_only=True)
    nodo_destino_nombre = serializers.CharField(source='nodo_destino.nombre', read_only=True)
    nodo_destino_tipo = serializers.CharField(source='nodo_destino.tipo', read_only=True)
    created_by_nombre = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )
    tiene_condicion = serializers.SerializerMethodField()

    class Meta:
        model = TransicionFlujo
        fields = [
            'id',
            'empresa_id',
            'plantilla',
            'plantilla_nombre',
            'nodo_origen',
            'nodo_origen_nombre',
            'nodo_origen_tipo',
            'nodo_destino',
            'nodo_destino_nombre',
            'nodo_destino_tipo',
            'nombre',
            'condicion',
            'prioridad',
            'tiene_condicion',
            'created_by',
            'created_by_nombre',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['empresa_id', 'created_by', 'created_at', 'updated_at']

    def get_tiene_condicion(self, obj):
        """Indica si la transición tiene condición definida"""
        return bool(obj.condicion)

    def validate(self, data):
        """Validaciones personalizadas"""
        # Validar que la plantilla pertenezca a la misma empresa
        if 'plantilla' in data:
            request = self.context.get('request')
            if request and hasattr(request.user, 'empresa_id'):
                if data['plantilla'].empresa_id != request.user.empresa_id:
                    raise serializers.ValidationError({
                        'plantilla': 'La plantilla debe pertenecer a la misma empresa'
                    })

        # Validar que origen y destino pertenezcan a la misma plantilla
        if 'nodo_origen' in data and 'nodo_destino' in data:
            if data['nodo_origen'].plantilla != data['nodo_destino'].plantilla:
                raise serializers.ValidationError({
                    'nodo_destino': 'El nodo destino debe pertenecer a la misma plantilla que el origen'
                })

        # Validar que no sea un ciclo directo (A → A)
        if 'nodo_origen' in data and 'nodo_destino' in data:
            if data['nodo_origen'] == data['nodo_destino']:
                raise serializers.ValidationError({
                    'nodo_destino': 'Una transición no puede conectar un nodo consigo mismo'
                })

        # Validar que plantilla coincida con la de los nodos
        if 'plantilla' in data and 'nodo_origen' in data:
            if data['plantilla'] != data['nodo_origen'].plantilla:
                raise serializers.ValidationError({
                    'plantilla': 'La plantilla debe coincidir con la plantilla de los nodos'
                })

        return data


class CampoFormularioSerializer(serializers.ModelSerializer):
    """Serializer para CampoFormulario"""
    nodo_nombre = serializers.CharField(source='nodo.nombre', read_only=True)
    nodo_codigo = serializers.CharField(source='nodo.codigo', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    created_by_nombre = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )
    requiere_opciones = serializers.SerializerMethodField()

    class Meta:
        model = CampoFormulario
        fields = [
            'id',
            'empresa_id',
            'nodo',
            'nodo_nombre',
            'nodo_codigo',
            'nombre',
            'etiqueta',
            'tipo',
            'tipo_display',
            'orden',
            'requerido',
            'valor_defecto',
            'opciones',
            'validaciones',
            'ayuda',
            'placeholder',
            'requiere_opciones',
            'created_by',
            'created_by_nombre',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['empresa_id', 'created_by', 'created_at', 'updated_at']

    def get_requiere_opciones(self, obj):
        """Indica si este tipo de campo requiere opciones"""
        return obj.tipo in ['SELECT', 'MULTISELECT', 'RADIO']

    def validate(self, data):
        """Validaciones personalizadas"""
        # Validar que el nodo pertenezca a la misma empresa
        if 'nodo' in data:
            request = self.context.get('request')
            if request and hasattr(request.user, 'empresa_id'):
                if data['nodo'].empresa_id != request.user.empresa_id:
                    raise serializers.ValidationError({
                        'nodo': 'El nodo debe pertenecer a la misma empresa'
                    })

        # Validar que el nodo sea de tipo TAREA
        if 'nodo' in data:
            if data['nodo'].tipo != 'TAREA':
                raise serializers.ValidationError({
                    'nodo': 'Solo se pueden agregar campos de formulario a nodos de tipo TAREA'
                })

        # Validar que si tiene opciones, el tipo sea compatible
        if data.get('opciones') and data.get('tipo') not in ['SELECT', 'MULTISELECT', 'RADIO']:
            raise serializers.ValidationError({
                'opciones': f'El tipo de campo {data.get("tipo")} no soporta opciones'
            })

        # Validar que campos de selección tengan opciones
        if data.get('tipo') in ['SELECT', 'MULTISELECT', 'RADIO'] and not data.get('opciones'):
            raise serializers.ValidationError({
                'opciones': 'Los campos de selección requieren al menos una opción'
            })

        return data


class RolFlujoSerializer(serializers.ModelSerializer):
    """Serializer para RolFlujo"""
    tipo_asignacion_display = serializers.CharField(
        source='get_tipo_asignacion_display',
        read_only=True
    )
    created_by_nombre = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )
    total_nodos_asignados = serializers.SerializerMethodField()

    class Meta:
        model = RolFlujo
        fields = [
            'id',
            'empresa_id',
            'codigo',
            'nombre',
            'descripcion',
            'tipo_asignacion',
            'tipo_asignacion_display',
            'rol_sistema_id',
            'cargo_id',
            'grupo_usuarios_id',
            'usuario_id',
            'regla_asignacion',
            'color',
            'permite_delegacion',
            'activo',
            'total_nodos_asignados',
            'created_by',
            'created_by_nombre',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['empresa_id', 'created_by', 'created_at', 'updated_at']

    def get_total_nodos_asignados(self, obj):
        """Retorna el total de nodos asignados a este rol"""
        return obj.nodos_asignados.count()

    def validate(self, data):
        """Validaciones personalizadas"""
        tipo_asignacion = data.get('tipo_asignacion')

        # Validar que según tipo_asignacion tenga el ID correspondiente
        if tipo_asignacion == 'ROL_SISTEMA' and not data.get('rol_sistema_id'):
            raise serializers.ValidationError({
                'rol_sistema_id': 'Debe especificar un rol del sistema'
            })
        elif tipo_asignacion == 'CARGO' and not data.get('cargo_id'):
            raise serializers.ValidationError({
                'cargo_id': 'Debe especificar un cargo'
            })
        elif tipo_asignacion == 'GRUPO' and not data.get('grupo_usuarios_id'):
            raise serializers.ValidationError({
                'grupo_usuarios_id': 'Debe especificar un grupo de usuarios'
            })
        elif tipo_asignacion == 'USUARIO' and not data.get('usuario_id'):
            raise serializers.ValidationError({
                'usuario_id': 'Debe especificar un usuario'
            })
        elif tipo_asignacion == 'DINAMICO' and not data.get('regla_asignacion'):
            raise serializers.ValidationError({
                'regla_asignacion': 'Debe especificar una regla de asignación dinámica'
            })

        # Validar formato de color
        if 'color' in data and data['color'] and not data['color'].startswith('#'):
            raise serializers.ValidationError({
                'color': 'El color debe estar en formato hexadecimal (#RRGGBB)'
            })

        return data
