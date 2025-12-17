# Generated manually - Extension de Cargo con Manual de Funciones, Requisitos y SST
# También extiende User con datos laborales

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0013_delete_consecutivoconfig_and_more"),
        ("organizacion", "0001_initial"),  # Dependency para Area
    ]

    operations = [
        # =================================================================
        # 1. CREAR MODELO RiesgoOcupacional
        # =================================================================
        migrations.CreateModel(
            name="RiesgoOcupacional",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(db_index=True, help_text="Código único del riesgo (ej: BIO-001, FIS-002)", max_length=30, unique=True, verbose_name="Código")),
                ("name", models.CharField(help_text="Descripción del peligro identificado", max_length=150, verbose_name="Nombre del Peligro")),
                ("clasificacion", models.CharField(choices=[("BIOLOGICO", "Biológico"), ("FISICO", "Físico"), ("QUIMICO", "Químico"), ("PSICOSOCIAL", "Psicosocial"), ("BIOMECANICO", "Biomecánico"), ("CONDICIONES_SEGURIDAD", "Condiciones de Seguridad"), ("FENOMENOS_NATURALES", "Fenómenos Naturales")], db_index=True, help_text="Tipo de peligro según GTC 45", max_length=25, verbose_name="Clasificación")),
                ("descripcion", models.TextField(blank=True, help_text="Descripción detallada del riesgo", null=True, verbose_name="Descripción")),
                ("fuente", models.CharField(blank=True, help_text="Origen o fuente del peligro", max_length=200, null=True, verbose_name="Fuente")),
                ("efectos_posibles", models.TextField(blank=True, help_text="Consecuencias potenciales para la salud", null=True, verbose_name="Efectos Posibles")),
                ("nivel_riesgo", models.CharField(choices=[("I", "I - No Aceptable"), ("II", "II - No Aceptable o Aceptable con Control"), ("III", "III - Mejorable"), ("IV", "IV - Aceptable")], default="III", help_text="Nivel de riesgo según valoración GTC 45", max_length=5, verbose_name="Nivel de Riesgo")),
                ("controles_existentes", models.TextField(blank=True, help_text="Medidas de control implementadas", null=True, verbose_name="Controles Existentes")),
                ("is_active", models.BooleanField(db_index=True, default=True, verbose_name="Activo")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Riesgo Ocupacional",
                "verbose_name_plural": "Riesgos Ocupacionales",
                "db_table": "core_riesgo_ocupacional",
                "ordering": ["clasificacion", "name"],
            },
        ),
        migrations.AddIndex(
            model_name="riesgoocupacional",
            index=models.Index(fields=["code"], name="core_riesgo_code_idx"),
        ),
        migrations.AddIndex(
            model_name="riesgoocupacional",
            index=models.Index(fields=["clasificacion", "is_active"], name="core_riesgo_clasif_idx"),
        ),

        # =================================================================
        # 2. MODIFICAR MODELO Cargo - Nuevos campos
        # =================================================================
        # Campo area: cambia de CharField a FK
        migrations.RemoveField(
            model_name="cargo",
            name="area",
        ),
        migrations.AddField(
            model_name="cargo",
            name="area",
            field=models.ForeignKey(blank=True, db_index=True, help_text="Área/departamento al que pertenece el cargo", null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="cargos", to="organizacion.area", verbose_name="Área"),
        ),

        # Nivel jerárquico nuevo
        migrations.AddField(
            model_name="cargo",
            name="nivel_jerarquico",
            field=models.CharField(choices=[("ESTRATEGICO", "Estratégico"), ("TACTICO", "Táctico"), ("OPERATIVO", "Operativo"), ("APOYO", "Apoyo")], db_index=True, default="OPERATIVO", help_text="Clasificación estratégica del cargo", max_length=20, verbose_name="Nivel Jerárquico"),
        ),

        # Configuración del cargo
        migrations.AddField(
            model_name="cargo",
            name="cantidad_posiciones",
            field=models.PositiveIntegerField(default=1, help_text="Número de personas que pueden ocupar este cargo", verbose_name="Cantidad de Posiciones"),
        ),
        migrations.AddField(
            model_name="cargo",
            name="is_jefatura",
            field=models.BooleanField(default=False, help_text="Indica si el cargo tiene personal a cargo", verbose_name="Es Jefatura"),
        ),
        migrations.AddField(
            model_name="cargo",
            name="requiere_licencia_conduccion",
            field=models.BooleanField(default=False, help_text="Si el cargo requiere licencia para operar vehículos", verbose_name="Requiere Licencia de Conducción"),
        ),
        migrations.AddField(
            model_name="cargo",
            name="categoria_licencia",
            field=models.CharField(blank=True, help_text="Categoría requerida (ej: B1, C1, C2, C3)", max_length=20, null=True, verbose_name="Categoría de Licencia"),
        ),

        # Manual de funciones
        migrations.AddField(
            model_name="cargo",
            name="objetivo_cargo",
            field=models.TextField(blank=True, help_text="Objetivo principal y propósito del cargo en la organización", null=True, verbose_name="Objetivo del Cargo"),
        ),
        migrations.AddField(
            model_name="cargo",
            name="funciones_responsabilidades",
            field=models.JSONField(blank=True, default=list, help_text="Lista de funciones principales del cargo (JSON array)", verbose_name="Funciones y Responsabilidades"),
        ),
        migrations.AddField(
            model_name="cargo",
            name="autoridad_autonomia",
            field=models.TextField(blank=True, help_text="Nivel de autoridad y decisiones que puede tomar", null=True, verbose_name="Autoridad y Autonomía"),
        ),
        migrations.AddField(
            model_name="cargo",
            name="relaciones_internas",
            field=models.TextField(blank=True, help_text="Áreas/cargos con los que interactúa internamente", null=True, verbose_name="Relaciones Internas"),
        ),
        migrations.AddField(
            model_name="cargo",
            name="relaciones_externas",
            field=models.TextField(blank=True, help_text="Entidades externas con las que interactúa", null=True, verbose_name="Relaciones Externas"),
        ),

        # Requisitos
        migrations.AddField(
            model_name="cargo",
            name="nivel_educativo",
            field=models.CharField(blank=True, choices=[("PRIMARIA", "Primaria"), ("BACHILLER", "Bachiller"), ("TECNICO", "Técnico"), ("TECNOLOGO", "Tecnólogo"), ("PROFESIONAL", "Profesional"), ("ESPECIALIZACION", "Especialización"), ("MAESTRIA", "Maestría"), ("DOCTORADO", "Doctorado")], help_text="Nivel de formación académica requerido", max_length=20, null=True, verbose_name="Nivel Educativo Mínimo"),
        ),
        migrations.AddField(
            model_name="cargo",
            name="titulo_requerido",
            field=models.CharField(blank=True, help_text="Título profesional o técnico específico requerido", max_length=200, null=True, verbose_name="Título Requerido"),
        ),
        migrations.AddField(
            model_name="cargo",
            name="experiencia_requerida",
            field=models.CharField(blank=True, choices=[("SIN_EXPERIENCIA", "Sin experiencia"), ("6_MESES", "6 meses"), ("1_ANO", "1 año"), ("2_ANOS", "2 años"), ("3_ANOS", "3 años"), ("5_ANOS", "5 años"), ("10_ANOS", "10+ años")], help_text="Tiempo mínimo de experiencia laboral", max_length=20, null=True, verbose_name="Experiencia Requerida"),
        ),
        migrations.AddField(
            model_name="cargo",
            name="experiencia_especifica",
            field=models.TextField(blank=True, help_text="Descripción de experiencia específica requerida", null=True, verbose_name="Experiencia Específica"),
        ),
        migrations.AddField(
            model_name="cargo",
            name="competencias_tecnicas",
            field=models.JSONField(blank=True, default=list, help_text="Lista de competencias técnicas requeridas (JSON array)", verbose_name="Competencias Técnicas"),
        ),
        migrations.AddField(
            model_name="cargo",
            name="competencias_blandas",
            field=models.JSONField(blank=True, default=list, help_text="Lista de habilidades interpersonales requeridas (JSON array)", verbose_name="Competencias Blandas"),
        ),
        migrations.AddField(
            model_name="cargo",
            name="licencias_certificaciones",
            field=models.JSONField(blank=True, default=list, help_text="Certificaciones profesionales requeridas (JSON array)", verbose_name="Licencias y Certificaciones"),
        ),
        migrations.AddField(
            model_name="cargo",
            name="formacion_complementaria",
            field=models.TextField(blank=True, help_text="Cursos o capacitaciones adicionales deseables", null=True, verbose_name="Formación Complementaria"),
        ),

        # SST
        migrations.AddField(
            model_name="cargo",
            name="expuesto_riesgos",
            field=models.ManyToManyField(blank=True, help_text="Riesgos a los que está expuesto el cargo", related_name="cargos_expuestos", to="core.riesgoocupacional", verbose_name="Riesgos Ocupacionales"),
        ),
        migrations.AddField(
            model_name="cargo",
            name="epp_requeridos",
            field=models.JSONField(blank=True, default=list, help_text="Elementos de Protección Personal requeridos (JSON array)", verbose_name="EPP Requeridos"),
        ),
        migrations.AddField(
            model_name="cargo",
            name="examenes_medicos",
            field=models.JSONField(blank=True, default=list, help_text="Exámenes médicos ocupacionales requeridos (JSON array)", verbose_name="Exámenes Médicos"),
        ),
        migrations.AddField(
            model_name="cargo",
            name="restricciones_medicas",
            field=models.TextField(blank=True, help_text="Condiciones médicas que impiden ejercer el cargo", null=True, verbose_name="Restricciones Médicas"),
        ),
        migrations.AddField(
            model_name="cargo",
            name="capacitaciones_sst",
            field=models.JSONField(blank=True, default=list, help_text="Capacitaciones de SST requeridas (JSON array)", verbose_name="Capacitaciones SST"),
        ),

        # Permisos del sistema
        migrations.AddField(
            model_name="cargo",
            name="rol_sistema",
            field=models.ForeignKey(blank=True, help_text="Rol de permisos asignado por defecto al cargo", null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="cargos_asignados", to="core.role", verbose_name="Rol del Sistema"),
        ),

        # Campos de control
        migrations.AddField(
            model_name="cargo",
            name="version",
            field=models.PositiveIntegerField(default=1, help_text="Versión del documento de cargo", verbose_name="Versión"),
        ),
        migrations.AddField(
            model_name="cargo",
            name="fecha_aprobacion",
            field=models.DateField(blank=True, help_text="Fecha en que se aprobó el manual de funciones", null=True, verbose_name="Fecha de Aprobación"),
        ),
        migrations.AddField(
            model_name="cargo",
            name="aprobado_por",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="cargos_aprobados", to=settings.AUTH_USER_MODEL, verbose_name="Aprobado por"),
        ),
        migrations.AddField(
            model_name="cargo",
            name="created_by",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="cargos_creados", to=settings.AUTH_USER_MODEL, verbose_name="Creado por"),
        ),

        # =================================================================
        # 3. MODIFICAR MODELO User - Datos laborales y SST
        # =================================================================
        migrations.AddField(
            model_name="user",
            name="phone_emergency",
            field=models.CharField(blank=True, help_text="Contacto en caso de emergencia", max_length=20, null=True, verbose_name="Teléfono de Emergencia"),
        ),
        migrations.AddField(
            model_name="user",
            name="address",
            field=models.CharField(blank=True, help_text="Dirección de residencia", max_length=200, null=True, verbose_name="Dirección"),
        ),
        migrations.AddField(
            model_name="user",
            name="birth_date",
            field=models.DateField(blank=True, null=True, verbose_name="Fecha de Nacimiento"),
        ),
        migrations.AddField(
            model_name="user",
            name="sede_asignada",
            field=models.ForeignKey(blank=True, help_text="Ubicación física de trabajo", null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="usuarios_sede", to="organizacion.area", verbose_name="Sede Asignada"),
        ),
        migrations.AddField(
            model_name="user",
            name="fecha_ingreso",
            field=models.DateField(blank=True, help_text="Fecha de inicio de labores", null=True, verbose_name="Fecha de Ingreso"),
        ),
        migrations.AddField(
            model_name="user",
            name="fecha_retiro",
            field=models.DateField(blank=True, help_text="Fecha de terminación del contrato", null=True, verbose_name="Fecha de Retiro"),
        ),
        migrations.AddField(
            model_name="user",
            name="tipo_contrato",
            field=models.CharField(blank=True, choices=[("INDEFINIDO", "Término Indefinido"), ("FIJO", "Término Fijo"), ("OBRA_LABOR", "Obra o Labor"), ("PRESTACION_SERVICIOS", "Prestación de Servicios"), ("APRENDIZAJE", "Aprendizaje"), ("TEMPORAL", "Temporal")], help_text="Modalidad de contratación", max_length=25, null=True, verbose_name="Tipo de Contrato"),
        ),
        migrations.AddField(
            model_name="user",
            name="estado_empleado",
            field=models.CharField(choices=[("ACTIVO", "Activo"), ("VACACIONES", "Vacaciones"), ("INCAPACIDAD", "Incapacidad"), ("LICENCIA", "Licencia"), ("SUSPENDIDO", "Suspendido"), ("RETIRADO", "Retirado")], db_index=True, default="ACTIVO", help_text="Estado laboral actual", max_length=15, verbose_name="Estado del Empleado"),
        ),
        migrations.AddField(
            model_name="user",
            name="salario_base",
            field=models.DecimalField(blank=True, decimal_places=2, help_text="Salario mensual base", max_digits=12, null=True, verbose_name="Salario Base"),
        ),
        migrations.AddField(
            model_name="user",
            name="numero_cuenta",
            field=models.CharField(blank=True, help_text="Cuenta bancaria para nómina", max_length=30, null=True, verbose_name="Número de Cuenta"),
        ),
        migrations.AddField(
            model_name="user",
            name="banco",
            field=models.CharField(blank=True, help_text="Entidad bancaria", max_length=50, null=True, verbose_name="Banco"),
        ),
        migrations.AddField(
            model_name="user",
            name="eps",
            field=models.CharField(blank=True, help_text="Entidad Promotora de Salud", max_length=100, null=True, verbose_name="EPS"),
        ),
        migrations.AddField(
            model_name="user",
            name="arl",
            field=models.CharField(blank=True, help_text="Administradora de Riesgos Laborales", max_length=100, null=True, verbose_name="ARL"),
        ),
        migrations.AddField(
            model_name="user",
            name="fondo_pensiones",
            field=models.CharField(blank=True, max_length=100, null=True, verbose_name="Fondo de Pensiones"),
        ),
        migrations.AddField(
            model_name="user",
            name="caja_compensacion",
            field=models.CharField(blank=True, max_length=100, null=True, verbose_name="Caja de Compensación"),
        ),
        migrations.AddField(
            model_name="user",
            name="tipo_sangre",
            field=models.CharField(blank=True, help_text="Grupo sanguíneo y RH (ej: O+, A-, AB+)", max_length=5, null=True, verbose_name="Tipo de Sangre"),
        ),

        # Actualizar document_type choices
        migrations.AlterField(
            model_name="user",
            name="document_type",
            field=models.CharField(choices=[("CC", "Cédula de Ciudadanía"), ("CE", "Cédula de Extranjería"), ("NIT", "NIT"), ("PA", "Pasaporte"), ("TI", "Tarjeta de Identidad")], default="CC", max_length=3, verbose_name="Tipo de documento"),
        ),

        # =================================================================
        # 4. ACTUALIZAR ÍNDICES DE Cargo
        # =================================================================
        migrations.AlterModelOptions(
            name="cargo",
            options={"ordering": ["nivel_jerarquico", "name"], "verbose_name": "Cargo", "verbose_name_plural": "Cargos"},
        ),
    ]
