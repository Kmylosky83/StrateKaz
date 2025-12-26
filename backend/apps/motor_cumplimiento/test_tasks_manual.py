#!/usr/bin/env python
"""
Script de prueba manual para tareas Celery del Motor de Cumplimiento

IMPORTANTE: Este script debe ejecutarse desde Django shell o con Django settings configurado.

Uso:
    python manage.py shell < backend/apps/motor_cumplimiento/test_tasks_manual.py

O en Django shell:
    exec(open('backend/apps/motor_cumplimiento/test_tasks_manual.py').read())
"""
import os
import django
from datetime import datetime, timedelta
from django.utils import timezone

# Configurar Django
if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    django.setup()

from apps.motor_cumplimiento.tasks import (
    scrape_legal_updates,
    check_license_expirations,
    send_expiration_notifications,
    generate_compliance_report,
    update_requisito_status,
)
from apps.motor_cumplimiento.matriz_legal.models import TipoNorma, NormaLegal
from apps.motor_cumplimiento.requisitos_legales.models import (
    TipoRequisito,
    RequisitoLegal,
    EmpresaRequisito,
    AlertaVencimiento,
)


def separator(title):
    """Imprime un separador visual"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80 + "\n")


def test_scraping():
    """Test de scraping de normas legales"""
    separator("TEST 1: Web Scraping de Normas Legales")

    print("Ejecutando scrape_legal_updates()...")
    print("NOTA: Esta es una versión placeholder, no hace scraping real\n")

    try:
        result = scrape_legal_updates.delay()
        print("✓ Tarea enviada a Celery")
        print(f"  Task ID: {result.id}")
        print(f"  Status: {result.status}")

        # Si ejecutamos con CELERY_TASK_ALWAYS_EAGER=True, tendremos resultado inmediato
        if result.ready():
            task_result = result.get()
            print("\n✓ Resultado:")
            print(f"  Status: {task_result.get('status')}")
            print(f"  Normas nuevas: {task_result.get('normas_nuevas')}")
            print(f"  Normas actualizadas: {task_result.get('normas_actualizadas')}")
            print(f"  Fuentes procesadas: {len(task_result.get('fuentes_procesadas', []))}")
        else:
            print("\n⏳ Tarea en ejecución...")
            print("  Ejecute: result.get(timeout=30) para esperar el resultado")

    except Exception as e:
        print(f"✗ Error: {str(e)}")


def test_check_expirations():
    """Test de verificación de vencimientos"""
    separator("TEST 2: Verificación de Vencimientos")

    # Verificar si hay requisitos en la BD
    requisitos_count = EmpresaRequisito.objects.filter(is_active=True).count()
    print(f"Requisitos activos en BD: {requisitos_count}")

    if requisitos_count == 0:
        print("\n⚠️ No hay requisitos para verificar")
        print("Crear datos de prueba con:")
        print("  python manage.py shell")
        print("  >>> from apps.motor_cumplimiento.requisitos_legales.models import *")
        print("  >>> # Crear TipoRequisito, RequisitoLegal, EmpresaRequisito")
        return

    print("\nEjecutando check_license_expirations()...\n")

    try:
        result = check_license_expirations.delay()
        print("✓ Tarea enviada a Celery")

        if result.ready():
            task_result = result.get()
            print("\n✓ Resultado:")
            print(f"  Requisitos revisados: {task_result.get('requisitos_revisados')}")
            print(f"  Alertas creadas:")
            for nivel, count in task_result.get('alertas_creadas', {}).items():
                if count > 0:
                    print(f"    - {nivel.upper()}: {count}")
            print(f"  Empresas afectadas: {task_result.get('empresas_afectadas')}")
        else:
            print("\n⏳ Tarea en ejecución...")

    except Exception as e:
        print(f"✗ Error: {str(e)}")


def test_notifications():
    """Test de envío de notificaciones"""
    separator("TEST 3: Envío de Notificaciones")

    # Verificar alertas pendientes
    alertas_pendientes = AlertaVencimiento.objects.filter(
        enviada=False,
        fecha_programada__lte=timezone.now().date()
    ).count()

    print(f"Alertas pendientes de envío: {alertas_pendientes}")

    if alertas_pendientes == 0:
        print("\n⚠️ No hay alertas pendientes para enviar")
        print("Ejecutar primero: test_check_expirations()")
        return

    print("\nEjecutando send_expiration_notifications()...\n")

    try:
        result = send_expiration_notifications.delay()
        print("✓ Tarea enviada a Celery")

        if result.ready():
            task_result = result.get()
            print("\n✓ Resultado:")
            print(f"  Emails enviados: {task_result.get('emails_enviados')}")
            print(f"  Notificaciones sistema: {task_result.get('notificaciones_sistema')}")
            print(f"  Empresas notificadas: {task_result.get('empresas_notificadas')}")
            print(f"  Alertas procesadas: {task_result.get('alertas_procesadas')}")

            if task_result.get('errores'):
                print(f"\n⚠️ Errores:")
                for error in task_result['errores']:
                    print(f"    - {error}")
        else:
            print("\n⏳ Tarea en ejecución...")

    except Exception as e:
        print(f"✗ Error: {str(e)}")


def test_compliance_report():
    """Test de generación de reporte de cumplimiento"""
    separator("TEST 4: Reporte de Cumplimiento")

    # Verificar requisitos por empresa
    empresa_id = 1
    requisitos = EmpresaRequisito.objects.filter(empresa_id=empresa_id).count()

    print(f"Requisitos para empresa {empresa_id}: {requisitos}")

    if requisitos == 0:
        print(f"\n⚠️ No hay requisitos para empresa {empresa_id}")
        return

    today = timezone.now().date()
    periodo_inicio = (today - timedelta(days=30)).isoformat()
    periodo_fin = today.isoformat()

    print(f"\nGenerando reporte para periodo: {periodo_inicio} a {periodo_fin}\n")

    try:
        result = generate_compliance_report.delay(
            empresa_id=empresa_id,
            periodo_inicio=periodo_inicio,
            periodo_fin=periodo_fin
        )
        print("✓ Tarea enviada a Celery")

        if result.ready():
            task_result = result.get()
            print("\n✓ Resultado:")
            print(f"  Empresa ID: {task_result.get('empresa_id')}")

            stats = task_result.get('estadisticas', {})
            print(f"\n  Estadísticas:")
            print(f"    Total requisitos: {stats.get('total_requisitos')}")
            print(f"    Vigentes: {stats.get('vigentes')}")
            print(f"    Próximos a vencer: {stats.get('proximos_vencer')}")
            print(f"    Vencidos: {stats.get('vencidos')}")
            print(f"    En trámite: {stats.get('en_tramite')}")
            print(f"    % Cumplimiento: {stats.get('porcentaje_cumplimiento')}%")
        else:
            print("\n⏳ Tarea en ejecución...")

    except Exception as e:
        print(f"✗ Error: {str(e)}")


def test_update_status():
    """Test de actualización de estado individual"""
    separator("TEST 5: Actualización de Estado Individual")

    # Buscar un requisito activo
    requisito = EmpresaRequisito.objects.filter(is_active=True).first()

    if not requisito:
        print("⚠️ No hay requisitos activos para probar")
        return

    print(f"Actualizando estado de requisito ID: {requisito.id}")
    print(f"  Documento: {requisito.numero_documento}")
    print(f"  Fecha vencimiento: {requisito.fecha_vencimiento}")
    print(f"  Estado actual: {requisito.estado}")
    print(f"  Días para vencer: {requisito.dias_para_vencer}\n")

    try:
        result = update_requisito_status.delay(requisito_id=requisito.id)
        print("✓ Tarea enviada a Celery")

        if result.ready():
            task_result = result.get()
            print("\n✓ Resultado:")
            print(f"  Status: {task_result.get('status')}")
            print(f"  Estado anterior: {task_result.get('old_status')}")
            print(f"  Estado nuevo: {task_result.get('new_status')}")
            print(f"  Días para vencer: {task_result.get('dias_para_vencer')}")
        else:
            print("\n⏳ Tarea en ejecución...")

    except Exception as e:
        print(f"✗ Error: {str(e)}")


def run_all_tests():
    """Ejecutar todos los tests"""
    separator("TESTS CELERY - MOTOR DE CUMPLIMIENTO")

    print("Este script ejecutará pruebas de todas las tareas Celery")
    print("implementadas para el Motor de Cumplimiento.\n")

    # Verificar configuración de Celery
    from django.conf import settings

    if hasattr(settings, 'CELERY_TASK_ALWAYS_EAGER'):
        print(f"CELERY_TASK_ALWAYS_EAGER: {settings.CELERY_TASK_ALWAYS_EAGER}")
    else:
        print("⚠️ CELERY_TASK_ALWAYS_EAGER no configurado")
        print("   Para tests síncronos, agregar a settings:")
        print("   CELERY_TASK_ALWAYS_EAGER = True\n")

    # Ejecutar tests
    test_scraping()
    test_check_expirations()
    test_notifications()
    test_compliance_report()
    test_update_status()

    separator("TESTS COMPLETADOS")
    print("Para más información, revisar:")
    print("  - backend/apps/motor_cumplimiento/CELERY_TASKS.md")
    print("  - backend/apps/motor_cumplimiento/tasks.py")
    print("")


# Funciones auxiliares para crear datos de prueba
def create_test_data():
    """Crear datos de prueba para ejecutar tests"""
    separator("CREAR DATOS DE PRUEBA")

    from django.contrib.auth import get_user_model
    User = get_user_model()

    # Usuario
    user, created = User.objects.get_or_create(
        username='test_compliance',
        defaults={
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User'
        }
    )
    if created:
        user.set_password('testpass123')
        user.save()
        print("✓ Usuario creado")
    else:
        print("→ Usuario ya existe")

    # Tipo de norma
    tipo_norma, created = TipoNorma.objects.get_or_create(
        codigo='DEC',
        defaults={
            'nombre': 'Decreto',
            'descripcion': 'Decreto legal'
        }
    )
    if created:
        print("✓ Tipo de norma creado")
    else:
        print("→ Tipo de norma ya existe")

    # Tipo de requisito
    tipo_req, created = TipoRequisito.objects.get_or_create(
        codigo='LIC_AMB',
        defaults={
            'nombre': 'Licencia Ambiental',
            'descripcion': 'Licencia ambiental',
            'requiere_renovacion': True,
            'dias_anticipacion_alerta': 30
        }
    )
    if created:
        print("✓ Tipo de requisito creado")
    else:
        print("→ Tipo de requisito ya existe")

    # Requisito legal
    req_legal, created = RequisitoLegal.objects.get_or_create(
        tipo=tipo_req,
        codigo='LIC001',
        defaults={
            'nombre': 'Licencia Ambiental General',
            'descripcion': 'Licencia para operaciones',
            'entidad_emisora': 'MinAmbiente',
            'aplica_ambiental': True,
            'es_obligatorio': True,
            'created_by': user
        }
    )
    if created:
        print("✓ Requisito legal creado")
    else:
        print("→ Requisito legal ya existe")

    # Requisito de empresa (próximo a vencer)
    today = timezone.now().date()

    emp_req, created = EmpresaRequisito.objects.get_or_create(
        empresa_id=1,
        requisito=req_legal,
        numero_documento='LIC-TEST-001',
        defaults={
            'fecha_expedicion': today - timedelta(days=335),
            'fecha_vencimiento': today + timedelta(days=25),
            'estado': EmpresaRequisito.Estado.VIGENTE,
            'responsable': user,
            'created_by': user
        }
    )
    if created:
        print("✓ Requisito de empresa creado (vence en 25 días)")
    else:
        print("→ Requisito de empresa ya existe")

    print("\n✓ Datos de prueba listos")
    print("\nAhora puede ejecutar: run_all_tests()")


# Script principal
if __name__ == '__main__':
    print("\n" + "=" * 80)
    print("  SCRIPT DE PRUEBA MANUAL - TAREAS CELERY")
    print("  Motor de Cumplimiento - Grasas y Huesos del Norte")
    print("=" * 80)

    print("\nOpciones disponibles:")
    print("  1. create_test_data()     - Crear datos de prueba")
    print("  2. run_all_tests()        - Ejecutar todos los tests")
    print("  3. test_scraping()        - Test de scraping")
    print("  4. test_check_expirations() - Test de vencimientos")
    print("  5. test_notifications()   - Test de notificaciones")
    print("  6. test_compliance_report() - Test de reportes")
    print("  7. test_update_status()   - Test de actualización")
    print("\nEjemplo de uso en Django shell:")
    print("  >>> exec(open('backend/apps/motor_cumplimiento/test_tasks_manual.py').read())")
    print("  >>> create_test_data()")
    print("  >>> run_all_tests()")
    print("")
else:
    # Si se ejecuta desde shell, mostrar mensaje
    print("\n✓ Script cargado. Funciones disponibles:")
    print("  - create_test_data()")
    print("  - run_all_tests()")
    print("  - test_scraping()")
    print("  - test_check_expirations()")
    print("  - test_notifications()")
    print("  - test_compliance_report()")
    print("  - test_update_status()")
    print("")
