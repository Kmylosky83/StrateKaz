#!/usr/bin/env python
"""
Script de verificación de tests de Medicina Laboral
Muestra estadísticas y estado de los tests
"""
import os
import re
from pathlib import Path


def count_tests_in_file(file_path):
    """Cuenta tests en un archivo"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    return len(re.findall(r'^\s*def test_', content, re.MULTILINE))


def count_fixtures_in_file(file_path):
    """Cuenta fixtures en un archivo"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    return len(re.findall(r'@pytest\.fixture', content))


def count_factories_in_file(file_path):
    """Cuenta factories en un archivo"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    # Buscar clases que hereden de DjangoModelFactory
    return len(re.findall(r'class \w+Factory\(DjangoModelFactory\):', content))


def get_test_classes(file_path):
    """Obtiene las clases de test de un archivo"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    classes = []
    for match in re.finditer(r'class (Test\w+).*?:', content):
        class_name = match.group(1)
        # Contar tests en esta clase
        class_content = content[match.start():]
        next_class = re.search(r'\nclass ', class_content[10:])
        if next_class:
            class_content = class_content[:next_class.start() + 10]

        test_count = len(re.findall(r'^\s*def test_', class_content, re.MULTILINE))
        classes.append((class_name, test_count))

    return classes


def print_separator(char='=', length=70):
    """Imprime un separador"""
    print(char * length)


def main():
    """Función principal"""
    # Obtener ruta del directorio de tests
    current_dir = Path(__file__).parent

    print_separator()
    print("  VERIFICACIÓN DE TESTS - MEDICINA LABORAL")
    print_separator()
    print()

    # Verificar archivos
    files = {
        'conftest.py': current_dir / 'conftest.py',
        'factories.py': current_dir / 'factories.py',
        'test_models.py': current_dir / 'test_models.py',
    }

    all_exist = True
    for name, path in files.items():
        if path.exists():
            print(f"✓ {name} existe")
        else:
            print(f"✗ {name} NO ENCONTRADO")
            all_exist = False

    if not all_exist:
        print("\nERROR: Faltan archivos")
        return

    print()
    print_separator('-')
    print("ESTADÍSTICAS")
    print_separator('-')
    print()

    # Contar fixtures
    fixtures_count = count_fixtures_in_file(files['conftest.py'])
    print(f"Fixtures en conftest.py: {fixtures_count}")

    # Contar factories
    factories_count = count_factories_in_file(files['factories.py'])
    print(f"Factories en factories.py: {factories_count}")

    # Contar tests
    tests_count = count_tests_in_file(files['test_models.py'])
    print(f"Tests en test_models.py: {tests_count}")

    print()
    print_separator('-')
    print("TESTS POR MODELO")
    print_separator('-')
    print()

    # Obtener clases de test
    test_classes = get_test_classes(files['test_models.py'])

    total_tests = 0
    for class_name, test_count in test_classes:
        # Extraer nombre del modelo
        model_name = class_name.replace('Test', '')
        print(f"{model_name:.<50} {test_count:>3} tests")
        total_tests += test_count

    print()
    print_separator('-')
    print(f"TOTAL: {total_tests} tests")
    print_separator('-')
    print()

    # Métricas de calidad
    print_separator('-')
    print("MÉTRICAS DE CALIDAD")
    print_separator('-')
    print()

    models_count = len(test_classes)
    avg_tests_per_model = total_tests / models_count if models_count > 0 else 0

    print(f"Modelos cubiertos: {models_count}")
    print(f"Promedio tests por modelo: {avg_tests_per_model:.1f}")
    print(f"Ratio fixtures/modelos: {fixtures_count / models_count:.1f}")
    print(f"Ratio factories/modelos: {factories_count / models_count:.1f}")
    print()

    # Calcular tamaños de archivos
    print_separator('-')
    print("TAMAÑO DE ARCHIVOS")
    print_separator('-')
    print()

    for name, path in files.items():
        size = path.stat().st_size
        if size < 1024:
            size_str = f"{size} bytes"
        elif size < 1024 * 1024:
            size_str = f"{size / 1024:.1f} KB"
        else:
            size_str = f"{size / (1024 * 1024):.1f} MB"

        print(f"{name:.<40} {size_str:>15}")

    print()
    print_separator()
    print("VERIFICACIÓN COMPLETADA ✓")
    print_separator()
    print()

    # Recomendaciones
    if total_tests < 40:
        print("⚠ ADVERTENCIA: Menos de 40 tests. Considere agregar más casos.")
    else:
        print(f"✓ Excelente cobertura con {total_tests} tests")

    if fixtures_count < models_count:
        print("⚠ ADVERTENCIA: Menos fixtures que modelos. Considere agregar más.")
    else:
        print(f"✓ Buena cantidad de fixtures ({fixtures_count})")

    if factories_count < models_count:
        print("⚠ ADVERTENCIA: Menos factories que modelos. Falta cobertura.")
    else:
        print(f"✓ Todas las factories creadas ({factories_count})")

    print()


if __name__ == '__main__':
    main()
