#!/usr/bin/env python
"""
Script para generar clave de encriptación para IntegracionExterna

Uso:
    python scripts/generar_encryption_key.py

Output:
    - Clave de encriptación en formato base64 (44 caracteres)
    - Instrucciones para agregar a .env
"""

from cryptography.fernet import Fernet
import sys
import os


def generar_clave():
    """Genera una nueva clave de encriptación"""
    return Fernet.generate_key().decode()


def verificar_clave(clave):
    """Verifica que la clave sea válida"""
    try:
        Fernet(clave.encode())
        return True
    except Exception as e:
        print(f"❌ Error: Clave inválida - {e}")
        return False


def main():
    print("=" * 70)
    print("🔐 GENERADOR DE CLAVE DE ENCRIPTACIÓN - IntegracionExterna")
    print("=" * 70)
    print()

    # Generar clave
    nueva_clave = generar_clave()

    # Verificar
    if not verificar_clave(nueva_clave):
        sys.exit(1)

    # Mostrar resultados
    print("✅ Clave generada exitosamente:")
    print()
    print(f"  {nueva_clave}")
    print()
    print("=" * 70)
    print("📋 INSTRUCCIONES DE INSTALACIÓN")
    print("=" * 70)
    print()
    print("1. Copia la clave generada arriba")
    print()
    print("2. Agregar a tu archivo .env:")
    print()
    print(f"   ENCRYPTION_KEY={nueva_clave}")
    print()
    print("3. NUNCA versionar esta clave en Git")
    print()
    print("4. Guardar backup en vault seguro (1Password, Azure Key Vault, etc.)")
    print()
    print("5. Usar CLAVES DIFERENTES por ambiente:")
    print("   - Desarrollo: Una clave")
    print("   - QA/Staging: Otra clave")
    print("   - Producción: Otra clave diferente")
    print()
    print("=" * 70)
    print("⚠️  ADVERTENCIAS DE SEGURIDAD")
    print("=" * 70)
    print()
    print("❌ NUNCA commitear la clave a Git")
    print("❌ NUNCA compartir la clave por email/Slack/WhatsApp")
    print("❌ NUNCA usar la misma clave en diferentes ambientes")
    print("✅ SIEMPRE hacer backup en vault seguro")
    print("✅ SIEMPRE rotar periódicamente (cada 90-180 días)")
    print()
    print("⚠️  Si pierdes la clave, las credenciales NO SE PUEDEN RECUPERAR")
    print()
    print("=" * 70)
    print()

    # Preguntar si desea generar múltiples claves
    respuesta = input("¿Deseas generar claves para múltiples ambientes? (s/n): ")

    if respuesta.lower() == 's':
        print()
        print("=" * 70)
        print("🔐 GENERANDO CLAVES POR AMBIENTE")
        print("=" * 70)
        print()

        ambientes = ['Desarrollo', 'QA/Staging', 'Producción']
        claves = {}

        for ambiente in ambientes:
            clave = generar_clave()
            claves[ambiente] = clave
            print(f"📌 {ambiente}:")
            print(f"   ENCRYPTION_KEY={clave}")
            print()

        print("=" * 70)
        print("💾 GUARDAR EN VAULT SEGURO")
        print("=" * 70)
        print()
        print("Documentar estas claves en tu vault con el formato:")
        print()
        for ambiente, clave in claves.items():
            print(f"Proyecto: Grasas y Huesos del Norte")
            print(f"Ambiente: {ambiente}")
            print(f"Variable: ENCRYPTION_KEY")
            print(f"Valor: {clave}")
            print(f"Generada: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print()
            print("-" * 70)
            print()

    print()
    print("✅ Proceso completado")
    print()


if __name__ == '__main__':
    main()
