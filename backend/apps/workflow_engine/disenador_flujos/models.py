"""
Modelos para Diseñador de Flujos BPMN - Workflow Engine

Este módulo gestiona el diseño y versionamiento de flujos de trabajo tipo BPMN.
Permite crear plantillas de workflows reutilizables con nodos, transiciones,
formularios y roles asignados.

Características:
- Versionamiento de plantillas
- Nodos BPMN completos (inicio, fin, tarea, gateways, eventos)
- Transiciones con condiciones dinámicas (JSON)
- Formularios personalizables por tarea
- Roles y permisos por flujo
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError


# ============================================================================
# CHOICES - Constantes del sistema
# ============================================================================

# Tipos de nodos BPMN 2.0
TIPO_NODO_CHOICES = [
    ('INICIO', 'Inicio'),
    ('FIN', 'Fin'),
    ('TAREA', 'Tarea'),
    ('GATEWAY_PARALELO', 'Gateway Paralelo'),
    ('GATEWAY_EXCLUSIVO', 'Gateway Exclusivo'),
    ('EVENTO', 'Evento'),
]

# Estados de versiones de plantillas
ESTADO_VERSION_CHOICES = [
    ('BORRADOR', 'Borrador'),
    ('ACTIVO', 'Activo'),
    ('OBSOLETO', 'Obsoleto'),
    ('ARCHIVADO', 'Archivado'),
]

# Tipos de campos para formularios dinámicos
TIPO_CAMPO_CHOICES = [
    ('TEXT', 'Texto corto'),
    ('TEXTAREA', 'Texto largo'),
    ('NUMBER', 'Número'),
    ('EMAIL', 'Correo electrónico'),
    ('DATE', 'Fecha'),
    ('DATETIME', 'Fecha y hora'),
    ('SELECT', 'Lista desplegable'),
    ('MULTISELECT', 'Selección múltiple'),
    ('CHECKBOX', 'Casilla de verificación'),
    ('RADIO', 'Botones de radio'),
    ('FILE', 'Archivo adjunto'),
]

# Operadores para condiciones de transición
OPERADOR_CONDICION_CHOICES = [
    ('IGUAL', 'Igual a'),
    ('DIFERENTE', 'Diferente de'),
    ('MAYOR', 'Mayor que'),
    ('MENOR', 'Menor que'),
    ('MAYOR_IGUAL', 'Mayor o igual que'),
    ('MENOR_IGUAL', 'Menor o igual que'),
    ('CONTIENE', 'Contiene'),
    ('ENTRE', 'Entre valores'),
]


# ============================================================================
# MODELO: CategoriaFlujo
# ============================================================================

class CategoriaFlujo(models.Model):
    """
    Catálogo de categorías para clasificar flujos de trabajo.

    Permite organizar plantillas por tipo de proceso:
    - Aprobaciones (ej: vacaciones, compras, gastos)
    - Procesos operativos (ej: producción, ventas)
    - Procesos administrativos (ej: contratación, HSEQ)
    - Procesos estratégicos (ej: proyectos, auditorías)

    Tabla: workflow_categoria_flujo
    """

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID',
        help_text='ID de la empresa (multi-tenant)'
    )

    # Identificación
    codigo = models.CharField(
        max_length=50,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de la categoría (ej: APROBACIONES, HSEQ)'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre',
        help_text='Nombre descriptivo de la categoría'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción detallada de la categoría'
    )

    # Configuración
    color = models.CharField(
        max_length=7,
        default='#3B82F6',
        verbose_name='Color',
        help_text='Color en formato hexadecimal para UI (ej: #3B82F6)'
    )
    icono = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Icono',
        help_text='Nombre del icono para representación visual'
    )
    orden = models.PositiveSmallIntegerField(
        default=0,
        verbose_name='Orden',
        help_text='Orden de visualización'
    )

    # Estado
    activo = models.BooleanField(
        default=True,
        verbose_name='Activo',
        help_text='Indica si la categoría está activa'
    )

    # Auditoría
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='categorias_flujo_creadas',
        verbose_name='Creado por'
    )

    class Meta:
        db_table = 'workflow_categoria_flujo'
        verbose_name = 'Categoría de flujo'
        verbose_name_plural = 'Categorías de flujos'
        ordering = ['orden', 'nombre']
        unique_together = [['empresa_id', 'codigo']]
        indexes = [
            models.Index(fields=['empresa_id', 'activo']),
            models.Index(fields=['codigo']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    def clean(self):
        """Validación personalizada"""
        super().clean()

        # Validar formato de color
        if self.color and not self.color.startswith('#'):
            raise ValidationError({
                'color': 'El color debe estar en formato hexadecimal (#RRGGBB)'
            })


# ============================================================================
# MODELO: PlantillaFlujo
# ============================================================================

class PlantillaFlujo(models.Model):
    """
    Plantilla de flujo de trabajo con versionamiento.

    Define la estructura completa de un workflow BPMN incluyendo:
    - Nodos (inicio, tareas, gateways, fin)
    - Transiciones entre nodos
    - Formularios asociados
    - Roles permitidos

    Soporta múltiples versiones de la misma plantilla, permitiendo
    evolución del flujo sin afectar instancias en ejecución.

    Tabla: workflow_plantilla_flujo
    """

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID',
        help_text='ID de la empresa (multi-tenant)'
    )

    # Relaciones
    categoria = models.ForeignKey(
        CategoriaFlujo,
        on_delete=models.PROTECT,
        related_name='plantillas',
        verbose_name='Categoría',
        help_text='Categoría a la que pertenece este flujo'
    )

    # Identificación
    codigo = models.CharField(
        max_length=100,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del flujo (ej: APROB_VACACIONES)'
    )
    nombre = models.CharField(
        max_length=255,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del flujo'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción detallada del propósito del flujo'
    )

    # Versionamiento
    version = models.PositiveSmallIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        verbose_name='Versión',
        help_text='Número de versión de la plantilla'
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_VERSION_CHOICES,
        default='BORRADOR',
        db_index=True,
        verbose_name='Estado',
        help_text='Estado de la versión de la plantilla'
    )

    # Configuración BPMN
    xml_bpmn = models.TextField(
        blank=True,
        verbose_name='XML BPMN 2.0',
        help_text='Representación XML del diagrama BPMN (opcional)'
    )
    json_diagram = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Diagrama JSON',
        help_text='Configuración del diagrama en formato JSON para editor visual'
    )

    # Configuración de ejecución
    tiempo_estimado_horas = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        verbose_name='Tiempo estimado (horas)',
        help_text='Tiempo estimado de ejecución del flujo completo'
    )
    requiere_aprobacion_gerencia = models.BooleanField(
        default=False,
        verbose_name='Requiere aprobación de gerencia',
        help_text='Indica si el flujo requiere aprobación final de gerencia'
    )
    permite_cancelacion = models.BooleanField(
        default=True,
        verbose_name='Permite cancelación',
        help_text='Indica si las instancias pueden ser canceladas'
    )

    # Metadatos
    etiquetas = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Etiquetas',
        help_text='Lista de etiquetas para clasificación y búsqueda'
    )

    # Control de versiones
    plantilla_origen = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='versiones_derivadas',
        verbose_name='Plantilla origen',
        help_text='Plantilla de la cual deriva esta versión'
    )
    fecha_activacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de activación',
        help_text='Fecha en que esta versión fue activada'
    )
    fecha_obsolescencia = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de obsolescencia',
        help_text='Fecha en que esta versión fue marcada como obsoleta'
    )

    # Auditoría
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='plantillas_flujo_creadas',
        verbose_name='Creado por'
    )
    activado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='plantillas_flujo_activadas',
        verbose_name='Activado por'
    )

    class Meta:
        db_table = 'workflow_plantilla_flujo'
        verbose_name = 'Plantilla de flujo'
        verbose_name_plural = 'Plantillas de flujos'
        ordering = ['-created_at']
        unique_together = [['empresa_id', 'codigo', 'version']]
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['codigo', 'version']),
            models.Index(fields=['categoria', 'estado']),
        ]

    def __str__(self):
        return f"{self.codigo} v{self.version} - {self.nombre}"

    def clean(self):
        """Validación personalizada"""
        super().clean()

        # Validar que solo haya una versión ACTIVO por código
        if self.estado == 'ACTIVO':
            activas = PlantillaFlujo.objects.filter(
                empresa_id=self.empresa_id,
                codigo=self.codigo,
                estado='ACTIVO'
            ).exclude(pk=self.pk)

            if activas.exists():
                raise ValidationError({
                    'estado': f'Ya existe una versión activa del flujo {self.codigo}. '
                             f'Debe marcar la versión actual como OBSOLETO primero.'
                })

    def crear_nueva_version(self, usuario):
        """
        Crea una nueva versión de esta plantilla.
        Marca la versión actual como OBSOLETO y crea una copia con versión incrementada.
        """
        # Marcar esta versión como obsoleta
        self.estado = 'OBSOLETO'
        self.fecha_obsolescencia = models.functions.Now()
        self.save()

        # Crear nueva versión
        nueva_plantilla = PlantillaFlujo.objects.create(
            empresa_id=self.empresa_id,
            categoria=self.categoria,
            codigo=self.codigo,
            nombre=self.nombre,
            descripcion=self.descripcion,
            version=self.version + 1,
            estado='BORRADOR',
            xml_bpmn=self.xml_bpmn,
            json_diagram=self.json_diagram,
            tiempo_estimado_horas=self.tiempo_estimado_horas,
            requiere_aprobacion_gerencia=self.requiere_aprobacion_gerencia,
            permite_cancelacion=self.permite_cancelacion,
            etiquetas=self.etiquetas,
            plantilla_origen=self,
            created_by=usuario
        )

        # Copiar nodos y transiciones
        for nodo in self.nodos.all():
            nuevo_nodo = NodoFlujo.objects.create(
                empresa_id=nodo.empresa_id,
                plantilla=nueva_plantilla,
                tipo=nodo.tipo,
                codigo=nodo.codigo,
                nombre=nodo.nombre,
                descripcion=nodo.descripcion,
                posicion_x=nodo.posicion_x,
                posicion_y=nodo.posicion_y,
                rol_asignado=nodo.rol_asignado,
                tiempo_estimado_horas=nodo.tiempo_estimado_horas,
                configuracion=nodo.configuracion,
                created_by=usuario
            )

            # Copiar campos de formulario si es tarea
            for campo in nodo.campos_formulario.all():
                CampoFormulario.objects.create(
                    empresa_id=campo.empresa_id,
                    nodo=nuevo_nodo,
                    nombre=campo.nombre,
                    etiqueta=campo.etiqueta,
                    tipo=campo.tipo,
                    orden=campo.orden,
                    requerido=campo.requerido,
                    valor_defecto=campo.valor_defecto,
                    opciones=campo.opciones,
                    validaciones=campo.validaciones,
                    ayuda=campo.ayuda,
                    created_by=usuario
                )

        # Copiar transiciones
        for transicion in self.transiciones.all():
            # Buscar nodos equivalentes en nueva versión
            nodo_origen = nueva_plantilla.nodos.get(codigo=transicion.nodo_origen.codigo)
            nodo_destino = nueva_plantilla.nodos.get(codigo=transicion.nodo_destino.codigo)

            TransicionFlujo.objects.create(
                empresa_id=transicion.empresa_id,
                plantilla=nueva_plantilla,
                nodo_origen=nodo_origen,
                nodo_destino=nodo_destino,
                nombre=transicion.nombre,
                condicion=transicion.condicion,
                prioridad=transicion.prioridad,
                created_by=usuario
            )

        return nueva_plantilla


# ============================================================================
# MODELO: NodoFlujo
# ============================================================================

class NodoFlujo(models.Model):
    """
    Nodo individual dentro de un flujo BPMN.

    Tipos de nodos soportados:
    - INICIO: Punto de entrada del flujo
    - FIN: Punto de finalización del flujo
    - TAREA: Actividad que requiere acción del usuario
    - GATEWAY_PARALELO: Divide/une flujos que se ejecutan en paralelo
    - GATEWAY_EXCLUSIVO: Divide flujo según condiciones (XOR)
    - EVENTO: Eventos intermedios (temporizadores, mensajes, etc.)

    Tabla: workflow_nodo_flujo
    """

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID',
        help_text='ID de la empresa (multi-tenant)'
    )

    # Relaciones
    plantilla = models.ForeignKey(
        PlantillaFlujo,
        on_delete=models.CASCADE,
        related_name='nodos',
        verbose_name='Plantilla',
        help_text='Plantilla de flujo a la que pertenece este nodo'
    )

    # Identificación
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_NODO_CHOICES,
        db_index=True,
        verbose_name='Tipo de nodo',
        help_text='Tipo de nodo BPMN'
    )
    codigo = models.CharField(
        max_length=100,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del nodo dentro de la plantilla (ej: TAREA_APROBACION_JEFE)'
    )
    nombre = models.CharField(
        max_length=255,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del nodo'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción detallada de la función del nodo'
    )

    # Posición en el diagrama (para editor visual)
    posicion_x = models.IntegerField(
        default=0,
        verbose_name='Posición X',
        help_text='Coordenada X en el diagrama visual'
    )
    posicion_y = models.IntegerField(
        default=0,
        verbose_name='Posición Y',
        help_text='Coordenada Y en el diagrama visual'
    )

    # Configuración de asignación (para nodos tipo TAREA)
    rol_asignado = models.ForeignKey(
        'RolFlujo',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='nodos_asignados',
        verbose_name='Rol asignado',
        help_text='Rol que debe ejecutar esta tarea (solo para tipo TAREA)'
    )

    # Configuración temporal
    tiempo_estimado_horas = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        verbose_name='Tiempo estimado (horas)',
        help_text='Tiempo estimado de ejecución de este nodo'
    )

    # Configuración avanzada (JSON)
    configuracion = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Configuración',
        help_text='''Configuración adicional en JSON. Ejemplos:
        - Para EVENTO: {"tipo_evento": "temporizador", "duracion_horas": 24}
        - Para TAREA: {"notificar_usuario": true, "permitir_delegacion": false}
        - Para GATEWAY: {"tipo_evaluacion": "todas", "timeout_horas": 48}'''
    )

    # Auditoría
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='nodos_flujo_creados',
        verbose_name='Creado por'
    )

    class Meta:
        db_table = 'workflow_nodo_flujo'
        verbose_name = 'Nodo de flujo'
        verbose_name_plural = 'Nodos de flujos'
        ordering = ['plantilla', 'codigo']
        unique_together = [['plantilla', 'codigo']]
        indexes = [
            models.Index(fields=['empresa_id', 'tipo']),
            models.Index(fields=['plantilla', 'tipo']),
            models.Index(fields=['rol_asignado']),
        ]

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.nombre}"

    def clean(self):
        """Validación personalizada"""
        super().clean()

        # Validar que TAREA tenga rol asignado
        if self.tipo == 'TAREA' and not self.rol_asignado:
            raise ValidationError({
                'rol_asignado': 'Los nodos de tipo TAREA deben tener un rol asignado'
            })

        # Validar que solo TAREA tenga rol asignado
        if self.tipo != 'TAREA' and self.rol_asignado:
            raise ValidationError({
                'rol_asignado': 'Solo los nodos de tipo TAREA pueden tener rol asignado'
            })

        # Validar que plantilla pertenezca a la misma empresa
        if hasattr(self, 'plantilla') and self.plantilla.empresa_id != self.empresa_id:
            raise ValidationError({
                'plantilla': 'La plantilla debe pertenecer a la misma empresa'
            })

    @property
    def es_inicio(self):
        """Indica si este nodo es de tipo INICIO"""
        return self.tipo == 'INICIO'

    @property
    def es_fin(self):
        """Indica si este nodo es de tipo FIN"""
        return self.tipo == 'FIN'

    @property
    def es_tarea(self):
        """Indica si este nodo es de tipo TAREA"""
        return self.tipo == 'TAREA'

    @property
    def es_gateway(self):
        """Indica si este nodo es un gateway"""
        return self.tipo in ['GATEWAY_PARALELO', 'GATEWAY_EXCLUSIVO']


# ============================================================================
# MODELO: TransicionFlujo
# ============================================================================

class TransicionFlujo(models.Model):
    """
    Transición (arco/flujo de secuencia) entre nodos.

    Conecta dos nodos y define las condiciones bajo las cuales
    el flujo debe tomar este camino. Soporta:
    - Condiciones simples y complejas en JSON
    - Prioridad para resolver ambigüedades
    - Expresiones dinámicas evaluadas en tiempo de ejecución

    Tabla: workflow_transicion_flujo
    """

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID',
        help_text='ID de la empresa (multi-tenant)'
    )

    # Relaciones
    plantilla = models.ForeignKey(
        PlantillaFlujo,
        on_delete=models.CASCADE,
        related_name='transiciones',
        verbose_name='Plantilla',
        help_text='Plantilla de flujo a la que pertenece esta transición'
    )
    nodo_origen = models.ForeignKey(
        NodoFlujo,
        on_delete=models.CASCADE,
        related_name='transiciones_salida',
        verbose_name='Nodo origen',
        help_text='Nodo desde el cual sale esta transición'
    )
    nodo_destino = models.ForeignKey(
        NodoFlujo,
        on_delete=models.CASCADE,
        related_name='transiciones_entrada',
        verbose_name='Nodo destino',
        help_text='Nodo hacia el cual llega esta transición'
    )

    # Identificación
    nombre = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Nombre',
        help_text='Nombre descriptivo de la transición (ej: "Si es aprobado", "Por defecto")'
    )

    # Condiciones (JSON flexible para expresiones complejas)
    condicion = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Condición',
        help_text='''Condición en formato JSON para evaluar si tomar esta transición.
        Ejemplos:
        - Simple: {"campo": "monto", "operador": "MAYOR", "valor": 1000000}
        - Compuesta: {"operador": "AND", "condiciones": [
            {"campo": "tipo", "operador": "IGUAL", "valor": "URGENTE"},
            {"campo": "monto", "operador": "MAYOR", "valor": 500000}
          ]}
        - Por defecto: {} (vacío, siempre se toma)'''
    )

    # Prioridad (para resolver múltiples transiciones desde gateway exclusivo)
    prioridad = models.PositiveSmallIntegerField(
        default=0,
        verbose_name='Prioridad',
        help_text='Orden de evaluación (mayor número = mayor prioridad). Usar en GATEWAY_EXCLUSIVO'
    )

    # Auditoría
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transiciones_flujo_creadas',
        verbose_name='Creado por'
    )

    class Meta:
        db_table = 'workflow_transicion_flujo'
        verbose_name = 'Transición de flujo'
        verbose_name_plural = 'Transiciones de flujos'
        ordering = ['plantilla', 'nodo_origen', '-prioridad']
        indexes = [
            models.Index(fields=['empresa_id']),
            models.Index(fields=['plantilla', 'nodo_origen']),
            models.Index(fields=['nodo_origen', 'nodo_destino']),
            models.Index(fields=['-prioridad']),
        ]

    def __str__(self):
        nombre_transicion = self.nombre or 'Sin nombre'
        return f"{self.nodo_origen.nombre} → {self.nodo_destino.nombre} ({nombre_transicion})"

    def clean(self):
        """Validación personalizada"""
        super().clean()

        # Validar que origen y destino pertenezcan a la misma plantilla
        if (hasattr(self, 'nodo_origen') and hasattr(self, 'nodo_destino') and
            self.nodo_origen.plantilla != self.nodo_destino.plantilla):
            raise ValidationError({
                'nodo_destino': 'El nodo destino debe pertenecer a la misma plantilla que el origen'
            })

        # Validar que plantilla coincida con la de los nodos
        if hasattr(self, 'plantilla') and hasattr(self, 'nodo_origen'):
            if self.plantilla != self.nodo_origen.plantilla:
                raise ValidationError({
                    'plantilla': 'La plantilla debe coincidir con la plantilla de los nodos'
                })

        # Validar que no sea un ciclo directo (A → A)
        if hasattr(self, 'nodo_origen') and hasattr(self, 'nodo_destino'):
            if self.nodo_origen == self.nodo_destino:
                raise ValidationError({
                    'nodo_destino': 'Una transición no puede conectar un nodo consigo mismo'
                })

        # Validar empresas coincidentes
        if (hasattr(self, 'plantilla') and
            self.plantilla.empresa_id != self.empresa_id):
            raise ValidationError({
                'plantilla': 'La plantilla debe pertenecer a la misma empresa'
            })

    def evaluar_condicion(self, datos_contexto):
        """
        Evalúa la condición de esta transición con los datos del contexto.

        Args:
            datos_contexto (dict): Diccionario con variables del flujo

        Returns:
            bool: True si se cumple la condición, False en caso contrario
        """
        # Si no hay condición, siempre es True (transición por defecto)
        if not self.condicion:
            return True

        try:
            # Evaluación simple
            if 'campo' in self.condicion:
                campo = self.condicion.get('campo')
                operador = self.condicion.get('operador')
                valor_esperado = self.condicion.get('valor')
                valor_actual = datos_contexto.get(campo)

                return self._evaluar_operador(valor_actual, operador, valor_esperado)

            # Evaluación compuesta (AND/OR)
            elif 'operador' in self.condicion and 'condiciones' in self.condicion:
                operador_logico = self.condicion['operador']
                subcondiciones = self.condicion['condiciones']

                resultados = [
                    self._evaluar_subcondicion(subcond, datos_contexto)
                    for subcond in subcondiciones
                ]

                if operador_logico == 'AND':
                    return all(resultados)
                elif operador_logico == 'OR':
                    return any(resultados)
                else:
                    return False

            return False

        except Exception:
            # En caso de error en evaluación, retornar False
            return False

    def _evaluar_subcondicion(self, subcondicion, datos_contexto):
        """Evalúa una subcondición individual"""
        campo = subcondicion.get('campo')
        operador = subcondicion.get('operador')
        valor_esperado = subcondicion.get('valor')
        valor_actual = datos_contexto.get(campo)

        return self._evaluar_operador(valor_actual, operador, valor_esperado)

    def _evaluar_operador(self, valor_actual, operador, valor_esperado):
        """Evalúa un operador de comparación"""
        if operador == 'IGUAL':
            return valor_actual == valor_esperado
        elif operador == 'DIFERENTE':
            return valor_actual != valor_esperado
        elif operador == 'MAYOR':
            return valor_actual > valor_esperado
        elif operador == 'MENOR':
            return valor_actual < valor_esperado
        elif operador == 'MAYOR_IGUAL':
            return valor_actual >= valor_esperado
        elif operador == 'MENOR_IGUAL':
            return valor_actual <= valor_esperado
        elif operador == 'CONTIENE':
            return valor_esperado in str(valor_actual)
        elif operador == 'ENTRE':
            valor_min = valor_esperado.get('min')
            valor_max = valor_esperado.get('max')
            return valor_min <= valor_actual <= valor_max

        return False


# ============================================================================
# MODELO: CampoFormulario
# ============================================================================

class CampoFormulario(models.Model):
    """
    Definición de campo de formulario para nodos de tipo TAREA.

    Permite crear formularios dinámicos que se presentan al usuario
    cuando ejecuta una tarea. Soporta múltiples tipos de campos:
    - Texto, números, fechas
    - Listas desplegables
    - Archivos adjuntos
    - Validaciones personalizadas

    Tabla: workflow_campo_formulario
    """

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID',
        help_text='ID de la empresa (multi-tenant)'
    )

    # Relaciones
    nodo = models.ForeignKey(
        NodoFlujo,
        on_delete=models.CASCADE,
        related_name='campos_formulario',
        limit_choices_to={'tipo': 'TAREA'},
        verbose_name='Nodo',
        help_text='Nodo de tipo TAREA al que pertenece este campo'
    )

    # Identificación
    nombre = models.CharField(
        max_length=100,
        db_index=True,
        verbose_name='Nombre',
        help_text='Nombre técnico del campo (usado como clave en JSON)'
    )
    etiqueta = models.CharField(
        max_length=255,
        verbose_name='Etiqueta',
        help_text='Texto que se muestra al usuario'
    )
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_CAMPO_CHOICES,
        verbose_name='Tipo de campo',
        help_text='Tipo de dato que acepta el campo'
    )

    # Configuración de visualización
    orden = models.PositiveSmallIntegerField(
        default=0,
        verbose_name='Orden',
        help_text='Orden de visualización en el formulario'
    )

    # Validaciones
    requerido = models.BooleanField(
        default=False,
        verbose_name='Requerido',
        help_text='Indica si el campo es obligatorio'
    )
    valor_defecto = models.CharField(
        max_length=500,
        blank=True,
        verbose_name='Valor por defecto',
        help_text='Valor inicial del campo'
    )

    # Opciones (para SELECT, MULTISELECT, RADIO)
    opciones = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Opciones',
        help_text='''Lista de opciones para campos de selección.
        Formato: [
            {"valor": "opcion1", "etiqueta": "Opción 1"},
            {"valor": "opcion2", "etiqueta": "Opción 2"}
        ]'''
    )

    # Validaciones personalizadas
    validaciones = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Validaciones',
        help_text='''Reglas de validación en JSON. Ejemplos:
        - {"min": 0, "max": 100} para números
        - {"min_length": 10, "max_length": 200} para texto
        - {"pattern": "^[A-Z]{3}[0-9]{4}$"} para expresión regular
        - {"min_date": "2024-01-01", "max_date": "2024-12-31"} para fechas'''
    )

    # Ayuda contextual
    ayuda = models.TextField(
        blank=True,
        verbose_name='Texto de ayuda',
        help_text='Texto de ayuda que se muestra al usuario'
    )
    placeholder = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Placeholder',
        help_text='Texto de ejemplo dentro del campo'
    )

    # Auditoría
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='campos_formulario_creados',
        verbose_name='Creado por'
    )

    class Meta:
        db_table = 'workflow_campo_formulario'
        verbose_name = 'Campo de formulario'
        verbose_name_plural = 'Campos de formularios'
        ordering = ['nodo', 'orden', 'nombre']
        unique_together = [['nodo', 'nombre']]
        indexes = [
            models.Index(fields=['empresa_id']),
            models.Index(fields=['nodo', 'orden']),
        ]

    def __str__(self):
        return f"{self.etiqueta} ({self.get_tipo_display()})"

    def clean(self):
        """Validación personalizada"""
        super().clean()

        # Validar que el nodo sea de tipo TAREA
        if hasattr(self, 'nodo') and not self.nodo.es_tarea:
            raise ValidationError({
                'nodo': 'Solo se pueden agregar campos de formulario a nodos de tipo TAREA'
            })

        # Validar que si tiene opciones, el tipo sea compatible
        if self.opciones and self.tipo not in ['SELECT', 'MULTISELECT', 'RADIO']:
            raise ValidationError({
                'opciones': f'El tipo de campo {self.get_tipo_display()} no soporta opciones'
            })

        # Validar que campos de selección tengan opciones
        if self.tipo in ['SELECT', 'MULTISELECT', 'RADIO'] and not self.opciones:
            raise ValidationError({
                'opciones': 'Los campos de selección requieren al menos una opción'
            })

        # Validar empresas coincidentes
        if hasattr(self, 'nodo') and self.nodo.empresa_id != self.empresa_id:
            raise ValidationError({
                'nodo': 'El nodo debe pertenecer a la misma empresa'
            })


# ============================================================================
# MODELO: RolFlujo
# ============================================================================

class RolFlujo(models.Model):
    """
    Rol que puede participar en flujos de trabajo.

    Define qué usuarios pueden ejecutar tareas en un flujo.
    Se relaciona con los roles del sistema RBAC pero permite
    configuración específica para workflows.

    Puede representar:
    - Rol organizacional (Gerente, Supervisor, etc.)
    - Rol funcional (Aprobador, Revisor, etc.)
    - Grupo dinámico (Comité, Equipo, etc.)

    Tabla: workflow_rol_flujo
    """

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID',
        help_text='ID de la empresa (multi-tenant)'
    )

    # Identificación
    codigo = models.CharField(
        max_length=50,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del rol (ej: GERENTE, APROBADOR_L1, COMITE_COMPRAS)'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del rol'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción de las responsabilidades del rol'
    )

    # Configuración de asignación
    tipo_asignacion = models.CharField(
        max_length=20,
        choices=[
            ('ROL_SISTEMA', 'Rol del sistema'),
            ('CARGO', 'Cargo organizacional'),
            ('GRUPO', 'Grupo de usuarios'),
            ('USUARIO', 'Usuario específico'),
            ('DINAMICO', 'Asignación dinámica'),
        ],
        default='ROL_SISTEMA',
        verbose_name='Tipo de asignación',
        help_text='Mecanismo de asignación de usuarios a este rol de flujo'
    )

    # Referencias (según tipo_asignacion)
    rol_sistema_id = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name='ID Rol del sistema',
        help_text='ID del rol en la tabla core.rol (si tipo_asignacion = ROL_SISTEMA)'
    )
    cargo_id = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name='ID Cargo',
        help_text='ID del cargo en la tabla core.cargo (si tipo_asignacion = CARGO)'
    )
    grupo_usuarios_id = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name='ID Grupo de usuarios',
        help_text='ID del grupo (si tipo_asignacion = GRUPO)'
    )
    usuario_id = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name='ID Usuario',
        help_text='ID del usuario específico (si tipo_asignacion = USUARIO)'
    )

    # Configuración dinámica
    regla_asignacion = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Regla de asignación dinámica',
        help_text='''Regla para asignación dinámica en JSON. Ejemplos:
        - Jefe inmediato del solicitante: {"tipo": "jefe_inmediato", "de": "solicitante"}
        - Por área: {"tipo": "cargo_area", "cargo": "GERENTE", "area": "VENTAS"}
        - Por monto: {"tipo": "por_monto", "rangos": [
            {"min": 0, "max": 1000000, "cargo": "SUPERVISOR"},
            {"min": 1000001, "max": 5000000, "cargo": "GERENTE"}
          ]}'''
    )

    # Configuración
    color = models.CharField(
        max_length=7,
        default='#6366F1',
        verbose_name='Color',
        help_text='Color en formato hexadecimal para visualización'
    )
    permite_delegacion = models.BooleanField(
        default=False,
        verbose_name='Permite delegación',
        help_text='Indica si los usuarios pueden delegar tareas a otros'
    )

    # Estado
    activo = models.BooleanField(
        default=True,
        verbose_name='Activo',
        help_text='Indica si el rol está activo'
    )

    # Auditoría
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='roles_flujo_creados',
        verbose_name='Creado por'
    )

    class Meta:
        db_table = 'workflow_rol_flujo'
        verbose_name = 'Rol de flujo'
        verbose_name_plural = 'Roles de flujos'
        ordering = ['nombre']
        unique_together = [['empresa_id', 'codigo']]
        indexes = [
            models.Index(fields=['empresa_id', 'activo']),
            models.Index(fields=['tipo_asignacion']),
            models.Index(fields=['rol_sistema_id']),
            models.Index(fields=['cargo_id']),
            models.Index(fields=['usuario_id']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    def clean(self):
        """Validación personalizada"""
        super().clean()

        # Validar que según tipo_asignacion tenga el ID correspondiente
        if self.tipo_asignacion == 'ROL_SISTEMA' and not self.rol_sistema_id:
            raise ValidationError({
                'rol_sistema_id': 'Debe especificar un rol del sistema'
            })
        elif self.tipo_asignacion == 'CARGO' and not self.cargo_id:
            raise ValidationError({
                'cargo_id': 'Debe especificar un cargo'
            })
        elif self.tipo_asignacion == 'GRUPO' and not self.grupo_usuarios_id:
            raise ValidationError({
                'grupo_usuarios_id': 'Debe especificar un grupo de usuarios'
            })
        elif self.tipo_asignacion == 'USUARIO' and not self.usuario_id:
            raise ValidationError({
                'usuario_id': 'Debe especificar un usuario'
            })
        elif self.tipo_asignacion == 'DINAMICO' and not self.regla_asignacion:
            raise ValidationError({
                'regla_asignacion': 'Debe especificar una regla de asignación dinámica'
            })

        # Validar formato de color
        if self.color and not self.color.startswith('#'):
            raise ValidationError({
                'color': 'El color debe estar en formato hexadecimal (#RRGGBB)'
            })

    def obtener_usuarios_asignados(self, contexto=None):
        """
        Obtiene la lista de usuarios asignados a este rol.

        Args:
            contexto (dict): Contexto adicional para asignación dinámica

        Returns:
            QuerySet: QuerySet de User asignados a este rol
        """
        from apps.core.models import User

        if self.tipo_asignacion == 'USUARIO':
            return User.objects.filter(id=self.usuario_id)

        elif self.tipo_asignacion == 'ROL_SISTEMA':
            # Buscar usuarios con este rol en usuario_empresa
            return User.objects.filter(
                usuarioempresa__rol_id=self.rol_sistema_id,
                usuarioempresa__empresa_id=self.empresa_id,
                usuarioempresa__activo=True
            ).distinct()

        elif self.tipo_asignacion == 'CARGO':
            # Buscar usuarios con este cargo
            return User.objects.filter(
                cargo_id=self.cargo_id,
                is_active=True
            )

        elif self.tipo_asignacion == 'GRUPO':
            # Buscar usuarios del grupo
            # Implementación depende del modelo de grupos
            return User.objects.none()

        elif self.tipo_asignacion == 'DINAMICO':
            # Evaluar regla dinámica con el contexto
            # Implementación específica según reglas definidas
            return User.objects.none()

        return User.objects.none()
