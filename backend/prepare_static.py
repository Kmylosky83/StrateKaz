#!/usr/bin/env python3
"""
Script para preparar archivos estáticos para despliegue
Sistema de Gestión Integral - StrateKaz

USO:
    python prepare_static.py

DESCRIPCIÓN:
    Este script recolecta todos los archivos estáticos de Django
    y los coloca en el directorio staticfiles/ listo para ser
    servido por Nginx en el VPS Hostinger.

NOTA IMPORTANTE:
    En producción (VPS Hostinger), Nginx sirve los archivos estáticos
    directamente. Es CRÍTICO ejecutar collectstatic antes de desplegar.
"""

import os
import sys
import django
from pathlib import Path

# Configurar Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')

# Cargar .env si existe
ENV_FILE = BASE_DIR / '.env'
if ENV_FILE.exists():
    print(f"✓ Cargando variables de entorno desde {ENV_FILE}")
    from decouple import config
else:
    print("⚠ Advertencia: No se encontró archivo .env")

# Inicializar Django
django.setup()

from django.core.management import call_command
from django.conf import settings

def main():
    """Ejecutar collectstatic y preparar archivos estáticos."""

    print("=" * 80)
    print("PREPARACIÓN DE ARCHIVOS ESTÁTICOS PARA VPS")
    print("=" * 80)
    print()

    # Información del entorno
    print(f"📁 BASE_DIR: {settings.BASE_DIR}")
    print(f"📁 STATIC_ROOT: {settings.STATIC_ROOT}")
    print(f"📁 STATIC_URL: {settings.STATIC_URL}")
    print(f"📁 MEDIA_ROOT: {settings.MEDIA_ROOT}")
    print(f"📁 MEDIA_URL: {settings.MEDIA_URL}")
    print()

    # Verificar que STATIC_ROOT esté configurado
    if not settings.STATIC_ROOT:
        print("❌ ERROR: STATIC_ROOT no está configurado en settings.py")
        sys.exit(1)

    # Crear directorios si no existen
    print("📂 Creando directorios necesarios...")
    static_root = Path(settings.STATIC_ROOT)
    media_root = Path(settings.MEDIA_ROOT)

    static_root.mkdir(parents=True, exist_ok=True)
    media_root.mkdir(parents=True, exist_ok=True)
    print(f"  ✓ {static_root}")
    print(f"  ✓ {media_root}")
    print()

    # Ejecutar collectstatic
    print("🔄 Ejecutando collectstatic...")
    print()

    try:
        call_command(
            'collectstatic',
            '--noinput',  # No pedir confirmación
            '--clear',    # Limpiar archivos existentes
            '--verbosity', '2'  # Mostrar detalles
        )
        print()
        print("✅ Archivos estáticos recolectados exitosamente")
        print()
    except Exception as e:
        print(f"❌ ERROR al ejecutar collectstatic: {e}")
        sys.exit(1)

    # Contar archivos
    static_files = list(static_root.rglob('*'))
    static_count = len([f for f in static_files if f.is_file()])

    print("=" * 80)
    print("RESUMEN")
    print("=" * 80)
    print(f"📊 Total de archivos estáticos: {static_count}")
    print(f"📁 Ubicación: {static_root}")
    print()

    # Mostrar estructura de directorios
    print("📂 Estructura de staticfiles/:")
    subdirs = sorted([d for d in static_root.iterdir() if d.is_dir()])
    for subdir in subdirs:
        file_count = len([f for f in subdir.rglob('*') if f.is_file()])
        print(f"  ├─ {subdir.name}/ ({file_count} archivos)")
    print()

    # Instrucciones para VPS Hostinger
    print("=" * 80)
    print("PRÓXIMOS PASOS EN VPS HOSTINGER")
    print("=" * 80)
    print()
    print("1. Verifica que Nginx apunte al directorio de staticfiles:")
    print(f"   location /static/ {{ alias {static_root}/; }}")
    print()
    print("2. Para archivos MEDIA (uploads de usuarios):")
    print(f"   location /media/ {{ alias {media_root}/; }}")
    print()
    print("3. Reinicia Nginx: sudo systemctl reload nginx")
    print()
    print("=" * 80)
    print("✅ PREPARACIÓN COMPLETADA")
    print("=" * 80)

if __name__ == '__main__':
    main()
