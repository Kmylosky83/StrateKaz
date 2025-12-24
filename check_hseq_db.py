#!/usr/bin/env python3
"""
Script independiente para verificar módulos HSEQ en la base de datos
No requiere Django - solo MySQL connector

Uso:
    python check_hseq_db.py

Requisitos:
    pip install mysql-connector-python
"""

import sys

try:
    import mysql.connector
except ImportError:
    print("❌ Error: mysql-connector-python no está instalado")
    print("   Instálalo con: pip install mysql-connector-python")
    sys.exit(1)


# Configuración de la base de datos
# Ajusta estos valores según tu .env
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',  # Pon tu password aquí
    'database': 'grasas_huesos_db'  # Pon el nombre de tu BD aquí
}


def print_header(title):
    """Imprime un encabezado decorado"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def check_module():
    """Verifica el módulo HSEQ Management"""
    print_header("📦 MÓDULO HSEQ MANAGEMENT")

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            id, code, name, category, color, icon,
            is_enabled, is_core, `order`, created_at
        FROM core_system_module
        WHERE code = 'hseq_management'
    """)

    module = cursor.fetchone()

    if not module:
        print("❌ Módulo HSEQ Management NO ENCONTRADO")
        print("   Ejecuta: python manage.py seed_hseq_modules")
        cursor.close()
        conn.close()
        return None

    print("✅ Módulo encontrado:")
    print(f"   - ID: {module['id']}")
    print(f"   - Código: {module['code']}")
    print(f"   - Nombre: {module['name']}")
    print(f"   - Categoría: {module['category']}")
    print(f"   - Color: {module['color']}")
    print(f"   - Icono: {module['icon']}")
    print(f"   - Habilitado: {'Sí' if module['is_enabled'] else 'No'}")
    print(f"   - Es Core: {'Sí' if module['is_core'] else 'No'}")
    print(f"   - Orden: {module['order']}")
    print(f"   - Creado: {module['created_at']}")

    cursor.close()
    conn.close()
    return module['id']


def check_tabs(module_id):
    """Verifica los tabs del módulo"""
    print_header("📑 TABS DEL MÓDULO")

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            id, code, name, icon, `order`,
            is_enabled, is_core
        FROM core_module_tab
        WHERE module_id = %s
        ORDER BY `order`
    """, (module_id,))

    tabs = cursor.fetchall()

    if not tabs:
        print("❌ No se encontraron tabs")
        cursor.close()
        conn.close()
        return

    print(f"✅ Encontrados {len(tabs)} tabs:\n")

    for tab in tabs:
        status = "✓" if tab['is_enabled'] else "✗"
        route = f"/hseq-management/{tab['code'].replace('_', '-')}"
        print(f"  {tab['order']:2d}. {tab['name']}")
        print(f"      - Código: {tab['code']}")
        print(f"      - Icono: {tab['icon']}")
        print(f"      - Ruta: {route}")
        print(f"      - Habilitado: {status}")
        print()

    cursor.close()
    conn.close()
    return tabs


def check_expected_tabs(module_id):
    """Verifica que todos los tabs esperados existan"""
    print_header("🔍 VALIDACIÓN DE TABS ESPERADOS")

    expected = [
        'sistema_documental',
        'planificacion_sistema',
        'calidad',
        'medicina_laboral',
        'seguridad_industrial',
        'higiene_industrial',
        'gestion_comites',
        'accidentalidad',
        'emergencias',
        'gestion_ambiental',
        'mejora_continua',
    ]

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT code FROM core_module_tab WHERE module_id = %s
    """, (module_id,))

    found = {row['code'] for row in cursor.fetchall()}

    missing = set(expected) - found
    extra = found - set(expected)

    if not missing and not extra:
        print("✅ Todos los tabs esperados están presentes")
    else:
        if missing:
            print(f"⚠️  Tabs faltantes ({len(missing)}):")
            for tab in missing:
                print(f"   - {tab}")

        if extra:
            print(f"\n⚠️  Tabs extra ({len(extra)}):")
            for tab in extra:
                print(f"   - {tab}")

    cursor.close()
    conn.close()


def check_summary(module_id):
    """Resumen general"""
    print_header("📊 RESUMEN")

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            COUNT(*) as total_tabs,
            SUM(CASE WHEN is_enabled = 1 THEN 1 ELSE 0 END) as enabled_tabs,
            SUM(CASE WHEN is_core = 1 THEN 1 ELSE 0 END) as core_tabs,
            SUM(CASE WHEN icon IS NOT NULL AND icon != '' THEN 1 ELSE 0 END) as tabs_with_icon
        FROM core_module_tab
        WHERE module_id = %s
    """, (module_id,))

    summary = cursor.fetchone()

    print(f"📊 Total tabs: {summary['total_tabs']}")
    print(f"✓ Tabs habilitados: {summary['enabled_tabs']}")
    print(f"🔒 Tabs core: {summary['core_tabs']}")
    print(f"🎨 Tabs con icono: {summary['tabs_with_icon']}")

    cursor.execute("""
        SELECT is_enabled FROM core_system_module WHERE id = %s
    """, (module_id,))

    module_enabled = cursor.fetchone()['is_enabled']
    print(f"📦 Módulo habilitado: {'Sí' if module_enabled else 'No'}")

    # Estado general
    if (summary['total_tabs'] == 11 and
        summary['enabled_tabs'] == 11 and
        summary['tabs_with_icon'] == 11 and
        module_enabled):
        print("\n" + "=" * 70)
        print("✅ CONFIGURACIÓN COMPLETA Y CORRECTA")
        print("=" * 70)
    else:
        print("\n" + "=" * 70)
        print("⚠️  CONFIGURACIÓN INCOMPLETA")
        print("=" * 70)
        print("\n💡 Ejecuta: python manage.py seed_hseq_modules")

    cursor.close()
    conn.close()


def check_all_modules():
    """Lista todos los módulos del sistema"""
    print_header("📦 TODOS LOS MÓDULOS DEL SISTEMA")

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            sm.code,
            sm.name,
            sm.category,
            sm.is_enabled,
            sm.`order`,
            COUNT(mt.id) as num_tabs
        FROM core_system_module sm
        LEFT JOIN core_module_tab mt ON mt.module_id = sm.id
        GROUP BY sm.id
        ORDER BY sm.`order`, sm.name
    """)

    modules = cursor.fetchall()

    if not modules:
        print("⚠️  No se encontraron módulos en el sistema")
    else:
        print(f"Total de módulos: {len(modules)}\n")
        for mod in modules:
            status = "✓" if mod['is_enabled'] else "✗"
            print(f"  {status} {mod['name']}")
            print(f"     - Código: {mod['code']}")
            print(f"     - Categoría: {mod['category']}")
            print(f"     - Tabs: {mod['num_tabs']}")
            print()

    cursor.close()
    conn.close()


def main():
    """Función principal"""
    print("\n" + "=" * 70)
    print("  🔍 VERIFICACIÓN MÓDULOS HSEQ MANAGEMENT")
    print("  Script independiente de Django")
    print("=" * 70)

    # Intentar conectar
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        print(f"\n✅ Conectado a MySQL: {DB_CONFIG['database']}")
        conn.close()
    except mysql.connector.Error as err:
        print(f"\n❌ Error de conexión MySQL: {err}")
        print("\n💡 Verifica la configuración en este script:")
        print(f"   - Host: {DB_CONFIG['host']}")
        print(f"   - Usuario: {DB_CONFIG['user']}")
        print(f"   - Base de datos: {DB_CONFIG['database']}")
        print("\n   Edita las variables DB_CONFIG al inicio del script")
        sys.exit(1)

    # Ejecutar verificaciones
    module_id = check_module()

    if module_id:
        check_tabs(module_id)
        check_expected_tabs(module_id)
        check_summary(module_id)

    check_all_modules()

    print("\n" + "=" * 70)
    print("  ✓ Verificación completada")
    print("=" * 70)
    print("\n💡 Para más detalles, usa:")
    print("   python manage.py verify_hseq_modules")
    print()


if __name__ == "__main__":
    main()
