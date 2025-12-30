#!/usr/bin/env python
"""
Script para verificar la configuración de seguridad del proyecto.

Uso:
    python check_security.py
"""
import os
import sys
from pathlib import Path


def check_file_exists(filepath, description):
    """Verificar que un archivo existe."""
    if Path(filepath).exists():
        print(f"✅ {description}")
        return True
    else:
        print(f"❌ {description} - FALTA: {filepath}")
        return False


def check_settings_configuration():
    """Verificar configuraciones en settings.py"""
    settings_path = Path(__file__).parent / 'config' / 'settings.py'

    if not settings_path.exists():
        print("❌ settings.py no encontrado")
        return False

    with open(settings_path, 'r', encoding='utf-8') as f:
        content = f.read()

    checks = [
        ('csp', 'CSP instalado en INSTALLED_APPS'),
        ('SecurityMiddleware', 'SecurityMiddleware configurado'),
        ('IPBlockMiddleware', 'IPBlockMiddleware configurado'),
        ('SECURE_BROWSER_XSS_FILTER', 'XSS Filter configurado'),
        ('SECURE_CONTENT_TYPE_NOSNIFF', 'Content Type Nosniff configurado'),
        ('X_FRAME_OPTIONS', 'X-Frame-Options configurado'),
        ('RATELIMIT_ENABLE', 'Rate Limiting habilitado'),
        ('CSP_DEFAULT_SRC', 'CSP configurado'),
        ('CSRF_TRUSTED_ORIGINS', 'CSRF Trusted Origins configurado'),
        ('SESSION_COOKIE_HTTPONLY', 'Session Cookie segura'),
    ]

    all_ok = True
    for check_str, description in checks:
        if check_str in content:
            print(f"✅ {description}")
        else:
            print(f"❌ {description}")
            all_ok = False

    return all_ok


def check_requirements():
    """Verificar que las dependencias están en requirements.txt"""
    req_path = Path(__file__).parent / 'requirements.txt'

    if not req_path.exists():
        print("❌ requirements.txt no encontrado")
        return False

    with open(req_path, 'r', encoding='utf-8') as f:
        content = f.read()

    required_packages = [
        ('django-ratelimit', 'Rate Limiting'),
        ('django-csp', 'Content Security Policy'),
        ('bleach', 'HTML Sanitization'),
    ]

    all_ok = True
    for package, description in required_packages:
        if package in content:
            print(f"✅ {description} ({package})")
        else:
            print(f"❌ {description} ({package}) - Agregar a requirements.txt")
            all_ok = False

    return all_ok


def check_directory_structure():
    """Verificar estructura de directorios y archivos."""
    base_path = Path(__file__).parent

    required_files = [
        ('apps/core/middleware/security.py', 'Security Middleware'),
        ('apps/core/middleware/__init__.py', 'Middleware __init__'),
        ('apps/core/decorators/ratelimit.py', 'Rate Limit Decorators'),
        ('apps/core/decorators/__init__.py', 'Decorators __init__'),
        ('apps/core/utils/sanitization.py', 'Sanitization Utils'),
        ('apps/core/utils/__init__.py', 'Utils __init__'),
        ('apps/core/views/security.py', 'Security Views'),
        ('apps/core/views/__init__.py', 'Views __init__'),
    ]

    all_ok = True
    for filepath, description in required_files:
        full_path = base_path / filepath
        if not check_file_exists(full_path, description):
            all_ok = False

    return all_ok


def check_logs_directory():
    """Verificar que el directorio de logs existe."""
    logs_path = Path(__file__).parent / 'logs'

    if logs_path.exists():
        print(f"✅ Directorio de logs existe")
        return True
    else:
        print(f"⚠️  Directorio de logs no existe - Se creará automáticamente")
        try:
            logs_path.mkdir(exist_ok=True)
            print(f"✅ Directorio de logs creado")
            return True
        except Exception as e:
            print(f"❌ Error al crear directorio de logs: {e}")
            return False


def check_env_example():
    """Verificar que existe el archivo de ejemplo .env"""
    env_example = Path(__file__).parent / '.env.security.example'

    if env_example.exists():
        print(f"✅ Archivo .env.security.example existe")
        return True
    else:
        print(f"❌ Archivo .env.security.example no encontrado")
        return False


def main():
    """Ejecutar todas las verificaciones."""
    print("=" * 60)
    print("VERIFICACIÓN DE CONFIGURACIÓN DE SEGURIDAD")
    print("=" * 60)
    print()

    results = []

    print("1. Verificando estructura de archivos...")
    print("-" * 60)
    results.append(check_directory_structure())
    print()

    print("2. Verificando dependencias en requirements.txt...")
    print("-" * 60)
    results.append(check_requirements())
    print()

    print("3. Verificando configuración en settings.py...")
    print("-" * 60)
    results.append(check_settings_configuration())
    print()

    print("4. Verificando directorio de logs...")
    print("-" * 60)
    results.append(check_logs_directory())
    print()

    print("5. Verificando archivo .env de ejemplo...")
    print("-" * 60)
    results.append(check_env_example())
    print()

    # Resumen
    print("=" * 60)
    print("RESUMEN")
    print("=" * 60)

    if all(results):
        print("✅ TODAS LAS VERIFICACIONES PASARON")
        print()
        print("Próximos pasos:")
        print("1. Instalar dependencias: pip install -r requirements.txt")
        print("2. Ejecutar migraciones: python manage.py migrate")
        print("3. Iniciar servidor: python manage.py runserver")
        print()
        print("Para producción:")
        print("1. Copiar .env.security.example a .env")
        print("2. Configurar variables de producción")
        print("3. Habilitar SSL/HTTPS")
        return 0
    else:
        print("❌ ALGUNAS VERIFICACIONES FALLARON")
        print()
        print("Por favor, revisar los errores anteriores y corregir.")
        return 1


if __name__ == '__main__':
    sys.exit(main())
