# Generated manually for extended tenant configuration and branding
# Migrates EmpresaConfig and BrandingConfig fields to Tenant model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tenant", "0002_add_schema_status_fields"),
    ]

    operations = [
        # ======================================================================
        # DATOS FISCALES Y LEGALES (de EmpresaConfig)
        # ======================================================================
        migrations.AddField(
            model_name="tenant",
            name="razon_social",
            field=models.CharField(
                blank=True,
                default="",
                help_text="Nombre legal completo de la empresa",
                max_length=250,
                verbose_name="Razón Social",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="nombre_comercial",
            field=models.CharField(
                blank=True,
                default="",
                help_text="Nombre comercial o de fantasía (opcional)",
                max_length=200,
                verbose_name="Nombre Comercial",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="representante_legal",
            field=models.CharField(
                blank=True,
                default="",
                max_length=200,
                verbose_name="Representante Legal",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="cedula_representante",
            field=models.CharField(
                blank=True,
                default="",
                max_length=20,
                verbose_name="Cédula del Representante",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="tipo_sociedad",
            field=models.CharField(
                choices=[
                    ("SAS", "Sociedad por Acciones Simplificada (S.A.S.)"),
                    ("SA", "Sociedad Anónima (S.A.)"),
                    ("LTDA", "Sociedad Limitada (Ltda.)"),
                    ("SCA", "Sociedad en Comandita por Acciones"),
                    ("SC", "Sociedad en Comandita Simple"),
                    ("COLECTIVA", "Sociedad Colectiva"),
                    ("ESAL", "Entidad Sin Ánimo de Lucro"),
                    ("PERSONA_NATURAL", "Persona Natural"),
                    ("SUCURSAL_EXTRANJERA", "Sucursal de Sociedad Extranjera"),
                    ("OTRO", "Otro"),
                ],
                default="SAS",
                max_length=30,
                verbose_name="Tipo de Sociedad",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="actividad_economica",
            field=models.CharField(
                blank=True,
                default="",
                max_length=10,
                verbose_name="Actividad Económica (CIIU)",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="descripcion_actividad",
            field=models.CharField(
                blank=True,
                default="",
                max_length=300,
                verbose_name="Descripción de Actividad",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="regimen_tributario",
            field=models.CharField(
                choices=[
                    ("COMUN", "Régimen Común (Responsable de IVA)"),
                    ("SIMPLE", "Régimen Simple de Tributación (RST)"),
                    ("NO_RESPONSABLE", "No Responsable de IVA"),
                    ("ESPECIAL", "Régimen Tributario Especial"),
                    ("GRAN_CONTRIBUYENTE", "Gran Contribuyente"),
                ],
                default="COMUN",
                max_length=30,
                verbose_name="Régimen Tributario",
            ),
        ),

        # ======================================================================
        # DATOS DE CONTACTO
        # ======================================================================
        migrations.AddField(
            model_name="tenant",
            name="direccion_fiscal",
            field=models.TextField(
                blank=True,
                default="",
                verbose_name="Dirección Fiscal",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="ciudad",
            field=models.CharField(
                blank=True,
                default="",
                max_length=100,
                verbose_name="Ciudad",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="departamento",
            field=models.CharField(
                blank=True,
                choices=[
                    ("AMAZONAS", "Amazonas"),
                    ("ANTIOQUIA", "Antioquia"),
                    ("ARAUCA", "Arauca"),
                    ("ATLANTICO", "Atlántico"),
                    ("BOLIVAR", "Bolívar"),
                    ("BOYACA", "Boyacá"),
                    ("CALDAS", "Caldas"),
                    ("CAQUETA", "Caquetá"),
                    ("CASANARE", "Casanare"),
                    ("CAUCA", "Cauca"),
                    ("CESAR", "Cesar"),
                    ("CHOCO", "Chocó"),
                    ("CORDOBA", "Córdoba"),
                    ("CUNDINAMARCA", "Cundinamarca"),
                    ("GUAINIA", "Guainía"),
                    ("GUAVIARE", "Guaviare"),
                    ("HUILA", "Huila"),
                    ("LA_GUAJIRA", "La Guajira"),
                    ("MAGDALENA", "Magdalena"),
                    ("META", "Meta"),
                    ("NARINO", "Nariño"),
                    ("NORTE_DE_SANTANDER", "Norte de Santander"),
                    ("PUTUMAYO", "Putumayo"),
                    ("QUINDIO", "Quindío"),
                    ("RISARALDA", "Risaralda"),
                    ("SAN_ANDRES", "San Andrés y Providencia"),
                    ("SANTANDER", "Santander"),
                    ("SUCRE", "Sucre"),
                    ("TOLIMA", "Tolima"),
                    ("VALLE_DEL_CAUCA", "Valle del Cauca"),
                    ("VAUPES", "Vaupés"),
                    ("VICHADA", "Vichada"),
                ],
                default="",
                max_length=50,
                verbose_name="Departamento",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="pais",
            field=models.CharField(
                default="Colombia",
                max_length=100,
                verbose_name="País",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="codigo_postal",
            field=models.CharField(
                blank=True,
                default="",
                max_length=10,
                verbose_name="Código Postal",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="telefono_principal",
            field=models.CharField(
                blank=True,
                default="",
                max_length=20,
                verbose_name="Teléfono Principal",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="telefono_secundario",
            field=models.CharField(
                blank=True,
                default="",
                max_length=20,
                verbose_name="Teléfono Secundario",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="email_corporativo",
            field=models.EmailField(
                blank=True,
                default="",
                max_length=254,
                verbose_name="Email Corporativo",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="sitio_web",
            field=models.URLField(
                blank=True,
                default="",
                verbose_name="Sitio Web",
            ),
        ),

        # ======================================================================
        # DATOS DE REGISTRO MERCANTIL
        # ======================================================================
        migrations.AddField(
            model_name="tenant",
            name="matricula_mercantil",
            field=models.CharField(
                blank=True,
                default="",
                max_length=50,
                verbose_name="Matrícula Mercantil",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="camara_comercio",
            field=models.CharField(
                blank=True,
                default="",
                max_length=100,
                verbose_name="Cámara de Comercio",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="fecha_constitucion",
            field=models.DateField(
                blank=True,
                null=True,
                verbose_name="Fecha de Constitución",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="fecha_inscripcion_registro",
            field=models.DateField(
                blank=True,
                null=True,
                verbose_name="Fecha de Inscripción en Registro",
            ),
        ),

        # ======================================================================
        # CONFIGURACIÓN REGIONAL
        # ======================================================================
        migrations.AddField(
            model_name="tenant",
            name="zona_horaria",
            field=models.CharField(
                choices=[
                    ("America/Bogota", "Colombia (America/Bogota)"),
                    ("America/New_York", "Este EEUU (America/New_York)"),
                    ("America/Los_Angeles", "Pacífico EEUU (America/Los_Angeles)"),
                    ("America/Mexico_City", "México (America/Mexico_City)"),
                    ("Europe/Madrid", "España (Europe/Madrid)"),
                    ("UTC", "UTC"),
                ],
                default="America/Bogota",
                max_length=50,
                verbose_name="Zona Horaria",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="formato_fecha",
            field=models.CharField(
                choices=[
                    ("DD/MM/YYYY", "DD/MM/YYYY (31/12/2024)"),
                    ("MM/DD/YYYY", "MM/DD/YYYY (12/31/2024)"),
                    ("YYYY-MM-DD", "YYYY-MM-DD (2024-12-31)"),
                    ("DD-MM-YYYY", "DD-MM-YYYY (31-12-2024)"),
                ],
                default="DD/MM/YYYY",
                max_length=20,
                verbose_name="Formato de Fecha",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="moneda",
            field=models.CharField(
                choices=[
                    ("COP", "Peso Colombiano (COP)"),
                    ("USD", "Dólar Estadounidense (USD)"),
                    ("EUR", "Euro (EUR)"),
                ],
                default="COP",
                max_length=3,
                verbose_name="Moneda",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="simbolo_moneda",
            field=models.CharField(
                default="$",
                max_length=5,
                verbose_name="Símbolo de Moneda",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="separador_miles",
            field=models.CharField(
                default=".",
                max_length=1,
                verbose_name="Separador de Miles",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="separador_decimales",
            field=models.CharField(
                default=",",
                max_length=1,
                verbose_name="Separador de Decimales",
            ),
        ),

        # ======================================================================
        # BRANDING - IDENTIDAD VISUAL (de BrandingConfig)
        # ======================================================================
        migrations.AddField(
            model_name="tenant",
            name="company_slogan",
            field=models.CharField(
                blank=True,
                default="",
                max_length=200,
                verbose_name="Slogan",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="logo",
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to="tenants/branding/logos/",
                verbose_name="Logo Principal",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="logo_white",
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to="tenants/branding/logos/",
                verbose_name="Logo Blanco (para fondos oscuros)",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="logo_dark",
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to="tenants/branding/logos/",
                verbose_name="Logo para Modo Oscuro",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="favicon",
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to="tenants/branding/favicons/",
                verbose_name="Favicon",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="login_background",
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to="tenants/branding/backgrounds/",
                verbose_name="Imagen de Fondo Login",
            ),
        ),

        # Actualizar campo primary_color existente (default diferente)
        migrations.AlterField(
            model_name="tenant",
            name="primary_color",
            field=models.CharField(
                default="#ec268f",
                help_text="Color HEX (ej: #ec268f - Rosa StrateKaz)",
                max_length=7,
                verbose_name="Color Primario",
            ),
        ),

        migrations.AddField(
            model_name="tenant",
            name="secondary_color",
            field=models.CharField(
                default="#000000",
                max_length=7,
                verbose_name="Color Secundario",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="accent_color",
            field=models.CharField(
                default="#f4ec25",
                max_length=7,
                verbose_name="Color de Acento",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="sidebar_color",
            field=models.CharField(
                default="#1E293B",
                max_length=7,
                verbose_name="Color del Sidebar",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="background_color",
            field=models.CharField(
                default="#F5F5F5",
                max_length=7,
                verbose_name="Color de Fondo",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="showcase_background",
            field=models.CharField(
                default="#1F2937",
                max_length=7,
                verbose_name="Color Fondo Presentaciones",
            ),
        ),

        # Gradientes
        migrations.AddField(
            model_name="tenant",
            name="gradient_mission",
            field=models.CharField(
                blank=True,
                default="",
                max_length=100,
                verbose_name="Gradiente Misión",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="gradient_vision",
            field=models.CharField(
                blank=True,
                default="",
                max_length=100,
                verbose_name="Gradiente Visión",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="gradient_policy",
            field=models.CharField(
                blank=True,
                default="",
                max_length=100,
                verbose_name="Gradiente Política",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="gradient_values",
            field=models.JSONField(
                blank=True,
                default=list,
                verbose_name="Gradientes Valores",
            ),
        ),

        # PWA
        migrations.AddField(
            model_name="tenant",
            name="pwa_name",
            field=models.CharField(
                blank=True,
                default="",
                max_length=200,
                verbose_name="Nombre PWA",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="pwa_short_name",
            field=models.CharField(
                blank=True,
                default="",
                max_length=50,
                verbose_name="Nombre Corto PWA",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="pwa_description",
            field=models.TextField(
                blank=True,
                default="",
                verbose_name="Descripción PWA",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="pwa_theme_color",
            field=models.CharField(
                blank=True,
                default="",
                max_length=7,
                verbose_name="Color de Tema PWA",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="pwa_background_color",
            field=models.CharField(
                blank=True,
                default="#FFFFFF",
                max_length=7,
                verbose_name="Color de Fondo PWA",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="pwa_icon_192",
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to="tenants/branding/pwa/",
                verbose_name="Icono PWA 192x192",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="pwa_icon_512",
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to="tenants/branding/pwa/",
                verbose_name="Icono PWA 512x512",
            ),
        ),
        migrations.AddField(
            model_name="tenant",
            name="pwa_icon_maskable",
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to="tenants/branding/pwa/",
                verbose_name="Icono Maskable PWA",
            ),
        ),
    ]
