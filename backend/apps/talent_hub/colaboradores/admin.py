"""
Admin para Colaboradores - Talent Hub
Sistema de Gestión StrateKaz
"""
from django.contrib import admin
from .models import Colaborador, HojaVida, InfoPersonal, HistorialLaboral


class HojaVidaInline(admin.StackedInline):
    """Inline para Hoja de Vida"""
    model = HojaVida
    can_delete = False
    extra = 0
    fieldsets = [
        ('Educación', {
            'fields': [
                'nivel_estudio_maximo',
                'titulo_academico',
                'institucion',
                'anio_graduacion',
            ]
        }),
        ('Estudios y Certificaciones', {
            'fields': [
                'estudios_adicionales',
                'certificaciones',
            ],
            'classes': ['collapse'],
        }),
        ('Experiencia e Idiomas', {
            'fields': [
                'experiencia_previa',
                'idiomas',
            ],
            'classes': ['collapse'],
        }),
        ('Habilidades', {
            'fields': [
                'habilidades',
                'competencias_blandas',
            ],
            'classes': ['collapse'],
        }),
        ('Referencias y Archivos', {
            'fields': [
                'referencias_laborales',
                'cv_documento',
                'certificados_estudios',
                'observaciones',
            ],
            'classes': ['collapse'],
        }),
    ]


class InfoPersonalInline(admin.StackedInline):
    """Inline para Información Personal"""
    model = InfoPersonal
    can_delete = False
    extra = 0
    fieldsets = [
        ('Datos Personales', {
            'fields': [
                'fecha_nacimiento',
                'genero',
                'estado_civil',
            ]
        }),
        ('Dirección', {
            'fields': [
                'direccion',
                'ciudad',
                'departamento',
                'telefono_fijo',
            ]
        }),
        ('Contacto de Emergencia', {
            'fields': [
                'nombre_contacto_emergencia',
                'parentesco_contacto_emergencia',
                'telefono_contacto_emergencia',
            ],
            'classes': ['collapse'],
        }),
        ('Datos Bancarios', {
            'fields': [
                'banco',
                'tipo_cuenta',
                'numero_cuenta',
            ],
            'classes': ['collapse'],
        }),
        ('Información de Salud', {
            'fields': [
                'tipo_sangre',
                'alergias',
                'medicamentos_permanentes',
                'condiciones_medicas',
                'eps',
                'arl',
                'fondo_pensiones',
                'caja_compensacion',
            ],
            'classes': ['collapse'],
        }),
        ('Tallas', {
            'fields': [
                'talla_camisa',
                'talla_pantalon',
                'talla_zapatos',
                'talla_overol',
            ],
            'classes': ['collapse'],
        }),
        ('Familia', {
            'fields': [
                'numero_hijos',
                'personas_a_cargo',
            ],
            'classes': ['collapse'],
        }),
    ]


class HistorialLaboralInline(admin.TabularInline):
    """Inline para Historial Laboral"""
    model = HistorialLaboral
    extra = 0
    fields = [
        'tipo_movimiento',
        'fecha_movimiento',
        'cargo_anterior',
        'cargo_nuevo',
        'salario_anterior',
        'salario_nuevo',
        'motivo',
    ]
    readonly_fields = ['created_at']
    ordering = ['-fecha_movimiento']
    show_change_link = True


@admin.register(Colaborador)
class ColaboradorAdmin(admin.ModelAdmin):
    """Admin para Colaborador"""
    list_display = [
        'numero_identificacion',
        'get_nombre_completo',
        'cargo',
        'area',
        'estado',
        'tipo_contrato',
        'fecha_ingreso',
        'salario',
        'is_active',
    ]
    list_filter = [
        'estado',
        'tipo_contrato',
        'area',
        'cargo',
        'is_active',
        'empresa',
    ]
    search_fields = [
        'numero_identificacion',
        'primer_nombre',
        'segundo_nombre',
        'primer_apellido',
        'segundo_apellido',
        'email_personal',
    ]
    readonly_fields = [
        'get_nombre_completo',
        'antiguedad_dias',
        'antiguedad_anios',
        'esta_activo',
        'tiene_contrato_vigente',
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
    ]
    date_hierarchy = 'fecha_ingreso'
    fieldsets = [
        ('Identificación', {
            'fields': [
                'empresa',
                'tipo_documento',
                'numero_identificacion',
            ]
        }),
        ('Datos Personales', {
            'fields': [
                'primer_nombre',
                'segundo_nombre',
                'primer_apellido',
                'segundo_apellido',
                'get_nombre_completo',
                'foto',
            ]
        }),
        ('Vinculación al Sistema', {
            'fields': ['usuario']
        }),
        ('Estructura Organizacional', {
            'fields': ['cargo', 'area']
        }),
        ('Información Laboral', {
            'fields': [
                'fecha_ingreso',
                'fecha_retiro',
                'estado',
                'motivo_retiro',
                'antiguedad_dias',
                'antiguedad_anios',
            ]
        }),
        ('Contratación', {
            'fields': [
                'tipo_contrato',
                'fecha_fin_contrato',
                'tiene_contrato_vigente',
            ]
        }),
        ('Salario', {
            'fields': [
                'salario',
                'auxilio_transporte',
                'horas_semanales',
            ]
        }),
        ('Contacto', {
            'fields': [
                'email_personal',
                'telefono_movil',
            ]
        }),
        ('Observaciones', {
            'fields': ['observaciones']
        }),
        ('Auditoría', {
            'fields': [
                'is_active',
                'created_at',
                'updated_at',
                'created_by',
                'updated_by',
            ],
            'classes': ['collapse'],
        }),
    ]
    inlines = [HojaVidaInline, InfoPersonalInline, HistorialLaboralInline]

    def get_nombre_completo(self, obj):
        return obj.get_nombre_completo()
    get_nombre_completo.short_description = 'Nombre Completo'

    def antiguedad_dias(self, obj):
        return obj.antiguedad_dias
    antiguedad_dias.short_description = 'Antigüedad (días)'

    def antiguedad_anios(self, obj):
        return round(obj.antiguedad_anios, 2)
    antiguedad_anios.short_description = 'Antigüedad (años)'

    def esta_activo(self, obj):
        return obj.esta_activo
    esta_activo.boolean = True
    esta_activo.short_description = 'Activo'

    def tiene_contrato_vigente(self, obj):
        return obj.tiene_contrato_vigente
    tiene_contrato_vigente.boolean = True
    tiene_contrato_vigente.short_description = 'Contrato Vigente'


@admin.register(HojaVida)
class HojaVidaAdmin(admin.ModelAdmin):
    """Admin para HojaVida"""
    list_display = [
        'colaborador',
        'nivel_estudio_maximo',
        'titulo_academico',
        'institucion',
        'anio_graduacion',
        'is_active',
    ]
    list_filter = [
        'nivel_estudio_maximo',
        'is_active',
    ]
    search_fields = [
        'colaborador__primer_nombre',
        'colaborador__primer_apellido',
        'titulo_academico',
        'institucion',
    ]
    readonly_fields = [
        'total_anios_experiencia',
        'tiene_formacion_completa',
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
    ]

    def total_anios_experiencia(self, obj):
        return obj.total_anios_experiencia
    total_anios_experiencia.short_description = 'Años de Experiencia'

    def tiene_formacion_completa(self, obj):
        return obj.tiene_formacion_completa
    tiene_formacion_completa.boolean = True
    tiene_formacion_completa.short_description = 'Formación Completa'


@admin.register(InfoPersonal)
class InfoPersonalAdmin(admin.ModelAdmin):
    """Admin para InfoPersonal"""
    list_display = [
        'colaborador',
        'fecha_nacimiento',
        'edad',
        'genero',
        'ciudad',
        'eps',
        'tiene_contacto_emergencia',
        'is_active',
    ]
    list_filter = [
        'genero',
        'estado_civil',
        'banco',
        'tipo_sangre',
        'is_active',
    ]
    search_fields = [
        'colaborador__primer_nombre',
        'colaborador__primer_apellido',
        'direccion',
        'ciudad',
    ]
    readonly_fields = [
        'edad',
        'tiene_datos_bancarios',
        'tiene_contacto_emergencia',
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
    ]

    def edad(self, obj):
        return obj.edad
    edad.short_description = 'Edad'

    def tiene_datos_bancarios(self, obj):
        return obj.tiene_datos_bancarios
    tiene_datos_bancarios.boolean = True
    tiene_datos_bancarios.short_description = 'Datos Bancarios'

    def tiene_contacto_emergencia(self, obj):
        return obj.tiene_contacto_emergencia
    tiene_contacto_emergencia.boolean = True
    tiene_contacto_emergencia.short_description = 'Contacto Emergencia'


@admin.register(HistorialLaboral)
class HistorialLaboralAdmin(admin.ModelAdmin):
    """Admin para HistorialLaboral"""
    list_display = [
        'colaborador',
        'tipo_movimiento',
        'fecha_movimiento',
        'cargo_anterior',
        'cargo_nuevo',
        'salario_anterior',
        'salario_nuevo',
        'incremento_salarial_display',
        'aprobado_por',
        'is_active',
    ]
    list_filter = [
        'tipo_movimiento',
        'is_active',
        'empresa',
    ]
    search_fields = [
        'colaborador__primer_nombre',
        'colaborador__primer_apellido',
        'motivo',
    ]
    readonly_fields = [
        'incremento_salarial_display',
        'es_ascenso',
        'es_retiro',
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
    ]
    date_hierarchy = 'fecha_movimiento'
    fieldsets = [
        ('Identificación', {
            'fields': ['empresa', 'colaborador']
        }),
        ('Movimiento', {
            'fields': [
                'tipo_movimiento',
                'fecha_movimiento',
                'fecha_efectiva',
            ]
        }),
        ('Cambio de Cargo', {
            'fields': [
                'cargo_anterior',
                'cargo_nuevo',
            ]
        }),
        ('Cambio de Área', {
            'fields': [
                'area_anterior',
                'area_nueva',
            ]
        }),
        ('Cambio Salarial', {
            'fields': [
                'salario_anterior',
                'salario_nuevo',
                'incremento_salarial_display',
            ]
        }),
        ('Detalles', {
            'fields': [
                'motivo',
                'observaciones',
                'documento_soporte',
            ]
        }),
        ('Aprobación', {
            'fields': [
                'aprobado_por',
                'fecha_aprobacion',
            ]
        }),
        ('Estado', {
            'fields': [
                'es_ascenso',
                'es_retiro',
            ]
        }),
        ('Auditoría', {
            'fields': [
                'is_active',
                'created_at',
                'updated_at',
                'created_by',
                'updated_by',
            ],
            'classes': ['collapse'],
        }),
    ]

    def incremento_salarial_display(self, obj):
        incremento = obj.incremento_salarial
        if incremento:
            return f"${incremento['valor']:,.0f} ({incremento['porcentaje']}%)"
        return "-"
    incremento_salarial_display.short_description = 'Incremento'

    def es_ascenso(self, obj):
        return obj.es_ascenso
    es_ascenso.boolean = True
    es_ascenso.short_description = 'Es Ascenso'

    def es_retiro(self, obj):
        return obj.es_retiro
    es_retiro.boolean = True
    es_retiro.short_description = 'Es Retiro'
