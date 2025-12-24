"""
Script para crear la estructura completa de módulos del ERP StrateKaz
Basado en Estructura Final 22.txt

Ejecutar: python create_erp_structure.py
"""

import os
from pathlib import Path

# Directorio base
BASE_DIR = Path(__file__).parent / "apps"

# Definición completa de módulos
MODULES = {
    # NIVEL 2: CUMPLIMIENTO
    "motor_cumplimiento": {
        "desc": "Motor de Cumplimiento",
        "apps": ["matriz_legal", "requisitos_legales", "partes_interesadas", "reglamentos_internos"]
    },
    "motor_riesgos": {
        "desc": "Motor de Riesgos",
        "apps": ["contexto_organizacional", "riesgos_procesos", "ipevr", "aspectos_ambientales",
                 "riesgos_viales", "sagrilaft_ptee", "seguridad_informacion"]
    },
    "workflow_engine": {
        "desc": "Motor BPM",
        "apps": ["disenador_flujos", "ejecucion", "monitoreo"]
    },

    # NIVEL 3: TORRE DE CONTROL
    "hseq_management": {
        "desc": "Gestión HSEQ",
        "apps": ["sistema_documental", "planificacion_sistema", "calidad", "medicina_laboral",
                 "seguridad_industrial", "higiene_industrial", "gestion_comites", "accidentalidad",
                 "emergencias", "gestion_ambiental", "mejora_continua"]
    },

    # NIVEL 4: CADENA DE VALOR
    "supply_chain": {
        "desc": "Cadena de Suministro",
        "apps": ["gestion_proveedores", "catalogos", "programacion_abastecimiento", "compras", "almacenamiento"]
    },
    "production_ops": {
        "desc": "Operaciones de Producción",
        "apps": ["recepcion", "procesamiento", "mantenimiento_industrial", "producto_terminado"]
    },
    "logistics_fleet": {
        "desc": "Logística y Flota",
        "apps": ["gestion_transporte", "despachos", "gestion_flota", "pesv_operativo"]
    },
    "sales_crm": {
        "desc": "Ventas y CRM",
        "apps": ["gestion_clientes", "pipeline_ventas", "pedidos_facturacion", "servicio_cliente"]
    },

    # NIVEL 5: HABILITADORES
    "talent_hub": {
        "desc": "Centro de Talento",
        "apps": ["estructura_cargos", "seleccion_contratacion", "colaboradores", "onboarding_induccion",
                 "formacion_reinduccion", "desempeno", "control_tiempo", "novedades",
                 "proceso_disciplinario", "nomina", "off_boarding"]
    },
    "admin_finance": {
        "desc": "Administración y Finanzas",
        "apps": ["tesoreria", "presupuesto", "activos_fijos", "servicios_generales"]
    },
    "accounting": {
        "desc": "Contabilidad",
        "apps": ["config_contable", "movimientos", "informes_contables", "integracion"]
    },

    # NIVEL 6: INTELIGENCIA
    "analytics": {
        "desc": "Analítica",
        "apps": ["config_indicadores", "dashboard_gerencial", "indicadores_area", "analisis_tendencias",
                 "generador_informes", "acciones_indicador", "exportacion_integracion"]
    },
    "audit_system": {
        "desc": "Sistema de Auditoría",
        "apps": ["logs_sistema", "centro_notificaciones", "config_alertas", "tareas_recordatorios"]
    }
}


def create_file(path, content):
    """Crear archivo con contenido"""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  Created: {path}")


def get_init():
    return ""


def get_apps_py(app_name, module_name):
    class_name = ''.join(w.capitalize() for w in app_name.split('_'))
    return f'''from django.apps import AppConfig


class {class_name}Config(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.{module_name}.{app_name}'
    verbose_name = '{class_name}'
'''


def get_models(app_name, module_name):
    model_class = ''.join(w.capitalize() for w in app_name.split('_'))
    return f'''"""
Modelos para {app_name} - {module_name}
"""
from django.db import models


# TODO: Implementar modelos específicos según DATABASE-ARCHITECTURE.md
# Por ahora solo placeholder para mantener la app funcional
'''


def get_serializers(app_name, module_name):
    return f'''"""
Serializers para {app_name} - {module_name}
"""
from rest_framework import serializers


# TODO: Implementar serializers cuando se definan los modelos
'''


def get_views(app_name, module_name):
    return f'''"""
Views para {app_name} - {module_name}
"""
from rest_framework import viewsets


# TODO: Implementar ViewSets cuando se definan los modelos y serializers
'''


def get_urls(app_name, module_name):
    return f'''"""
URLs para {app_name} - {module_name}
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = '{app_name}'

router = DefaultRouter()
# TODO: Registrar ViewSets cuando se implementen

urlpatterns = [
    path('', include(router.urls)),
]
'''


def get_admin(app_name, module_name):
    return f'''"""
Admin para {app_name} - {module_name}
"""
from django.contrib import admin


# TODO: Registrar modelos en admin cuando se implementen
'''


def main():
    print("=" * 80)
    print("CREANDO ESTRUCTURA ERP STRATEKAZ")
    print("=" * 80)

    total_apps = 0

    for module_name, config in MODULES.items():
        print(f"\n[MODULE] {module_name} - {config['desc']}")
        print("-" * 60)

        module_path = BASE_DIR / module_name

        # Crear __init__.py del módulo
        create_file(module_path / "__init__.py", get_init())

        for app_name in config['apps']:
            total_apps += 1
            print(f"  [{total_apps:02d}] {app_name}")
            app_path = module_path / app_name

            # Crear archivos estándar
            create_file(app_path / "__init__.py", get_init())
            create_file(app_path / "apps.py", get_apps_py(app_name, module_name))
            create_file(app_path / "models.py", get_models(app_name, module_name))
            create_file(app_path / "serializers.py", get_serializers(app_name, module_name))
            create_file(app_path / "views.py", get_views(app_name, module_name))
            create_file(app_path / "urls.py", get_urls(app_name, module_name))
            create_file(app_path / "admin.py", get_admin(app_name, module_name))

    print("\n" + "=" * 80)
    print(f"ESTRUCTURA CREADA: {len(MODULES)} módulos, {total_apps} apps")
    print("=" * 80)
    print("\nPróximos pasos:")
    print("1. NO registrar apps en INSTALLED_APPS todavía (son placeholders)")
    print("2. Implementar modelos según DATABASE-ARCHITECTURE.md")
    print("3. Registrar apps conforme se implementen")
    print("4. Ejecutar makemigrations y migrate por módulo")


if __name__ == "__main__":
    main()
