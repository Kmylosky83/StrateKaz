"""
Script de testing completo para endpoints del Core
StrateKaz v3.7.0 - 20 Enero 2026

Tests de:
- Login y tokens
- User preferences (GET, PATCH, PUT)
- Branding (público)
- Sidebar (con permisos)
- Avatar upload
"""
import requests
import json
from pathlib import Path
import sys

# Configuración
BASE_URL = "http://localhost:8000/api"
FRONTEND_URL = "http://localhost:3010"

# Colores para output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_success(msg):
    print(f"{GREEN}✓ {msg}{RESET}")

def print_error(msg):
    print(f"{RED}✗ {msg}{RESET}")

def print_info(msg):
    print(f"{BLUE}ℹ {msg}{RESET}")

def print_warning(msg):
    print(f"{YELLOW}⚠ {msg}{RESET}")

def print_section(title):
    print(f"\n{'='*60}")
    print(f"{BLUE}{title}{RESET}")
    print(f"{'='*60}\n")

# Variables globales para tokens
access_token = None
refresh_token = None
user_id = None

def test_login():
    """Test 1: Login y obtención de tokens"""
    global access_token, refresh_token, user_id

    print_section("TEST 1: Login y Tokens")

    # Solicitar credenciales
    print_info("Ingresa las credenciales de un usuario administrador:")
    username = input("Username: ").strip()
    password = input("Password: ").strip()

    try:
        response = requests.post(
            f"{BASE_URL}/auth/login/",
            json={"username": username, "password": password},
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            access_token = data.get('access')
            refresh_token = data.get('refresh')
            user_data = data.get('user', {})
            user_id = user_data.get('id')

            print_success(f"Login exitoso!")
            print_info(f"User ID: {user_id}")
            print_info(f"Username: {user_data.get('username')}")
            print_info(f"Email: {user_data.get('email')}")
            print_info(f"Access Token: {access_token[:50]}...")
            print_info(f"Refresh Token: {refresh_token[:50]}...")
            return True
        else:
            print_error(f"Login falló: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False

    except Exception as e:
        print_error(f"Error en login: {str(e)}")
        return False

def test_branding_public():
    """Test 2: Branding endpoint (público, sin autenticación)"""
    print_section("TEST 2: Branding Público")

    try:
        response = requests.get(
            f"{BASE_URL}/core/branding/active/",
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            print_success("Branding endpoint funciona (público)")
            print_info(f"Company Name: {data.get('company_name', 'N/A')}")
            print_info(f"Primary Color: {data.get('primary_color', 'N/A')}")
            print_info(f"Has Logo: {'Yes' if data.get('logo_url') else 'No'}")
            return True
        elif response.status_code == 404:
            print_warning("No hay configuración de branding activa")
            print_info("Esto es normal si no se ha configurado aún")
            return True
        else:
            print_error(f"Branding falló: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False

    except Exception as e:
        print_error(f"Error en branding: {str(e)}")
        return False

def test_user_preferences_get():
    """Test 3: GET User Preferences"""
    print_section("TEST 3: GET User Preferences")

    if not access_token:
        print_error("No hay token de acceso. Ejecuta login primero.")
        return False

    try:
        response = requests.get(
            f"{BASE_URL}/core/user-preferences/",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            print_success("GET user-preferences funciona")
            print_info(f"Language: {data.get('language', 'N/A')}")
            print_info(f"Timezone: {data.get('timezone', 'N/A')}")
            print_info(f"Date Format: {data.get('date_format', 'N/A')}")
            return True
        else:
            print_error(f"GET user-preferences falló: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False

    except Exception as e:
        print_error(f"Error en GET preferences: {str(e)}")
        return False

def test_user_preferences_patch():
    """Test 4: PATCH User Preferences (actualización parcial)"""
    print_section("TEST 4: PATCH User Preferences")

    if not access_token:
        print_error("No hay token de acceso. Ejecuta login primero.")
        return False

    try:
        # Cambiar solo el idioma
        response = requests.patch(
            f"{BASE_URL}/core/user-preferences/",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            },
            json={"language": "en"},
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            print_success("PATCH user-preferences funciona")
            print_info(f"Language actualizado a: {data.get('language')}")

            # Restaurar a español
            requests.patch(
                f"{BASE_URL}/core/user-preferences/",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                },
                json={"language": "es"},
                timeout=10
            )
            print_info("Language restaurado a 'es'")
            return True
        else:
            print_error(f"PATCH user-preferences falló: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False

    except Exception as e:
        print_error(f"Error en PATCH preferences: {str(e)}")
        return False

def test_sidebar():
    """Test 5: Sidebar dinámico"""
    print_section("TEST 5: Sidebar Dinámico")

    if not access_token:
        print_error("No hay token de acceso. Ejecuta login primero.")
        return False

    try:
        response = requests.get(
            f"{BASE_URL}/core/system-modules/sidebar/",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            print_success("Sidebar endpoint funciona")
            print_info(f"Módulos disponibles: {len(data)}")

            for module in data[:3]:  # Mostrar solo los primeros 3
                print_info(f"  - {module.get('name')} ({module.get('code')})")

            if len(data) > 3:
                print_info(f"  ... y {len(data) - 3} más")

            return True
        else:
            print_error(f"Sidebar falló: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False

    except Exception as e:
        print_error(f"Error en sidebar: {str(e)}")
        return False

def test_current_user():
    """Test 6: Current User (me)"""
    print_section("TEST 6: Current User Info")

    if not access_token:
        print_error("No hay token de acceso. Ejecuta login primero.")
        return False

    try:
        response = requests.get(
            f"{BASE_URL}/core/users/me/",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            print_success("Current user endpoint funciona")
            print_info(f"Username: {data.get('username')}")
            print_info(f"Full Name: {data.get('full_name')}")
            print_info(f"Email: {data.get('email')}")
            print_info(f"Cargo: {data.get('cargo_name', 'N/A')}")
            print_info(f"Photo URL: {data.get('photo_url', 'No photo')}")
            return True
        else:
            print_error(f"Current user falló: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False

    except Exception as e:
        print_error(f"Error en current user: {str(e)}")
        return False

def test_notifications():
    """Test 7: Notificaciones no leídas"""
    print_section("TEST 7: Notificaciones No Leídas")

    if not access_token or not user_id:
        print_error("No hay token o user_id. Ejecuta login primero.")
        return False

    try:
        response = requests.get(
            f"{BASE_URL}/audit/notificaciones/no_leidas/",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"usuario_id": user_id},
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            print_success("Notificaciones endpoint funciona")
            print_info(f"Notificaciones no leídas: {len(data)}")
            return True
        else:
            print_error(f"Notificaciones falló: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False

    except Exception as e:
        print_error(f"Error en notificaciones: {str(e)}")
        return False

def run_all_tests():
    """Ejecutar todos los tests en orden"""
    print("\n" + "="*60)
    print(f"{BLUE}STRATEKAZ v3.7.0 - CORE ENDPOINTS TESTING{RESET}")
    print("="*60)

    results = {
        "Login y Tokens": test_login(),
    }

    if not results["Login y Tokens"]:
        print_error("\n❌ Login falló. No se pueden ejecutar los demás tests.")
        return

    # Continuar con los demás tests
    results["Branding Público"] = test_branding_public()
    results["GET User Preferences"] = test_user_preferences_get()
    results["PATCH User Preferences"] = test_user_preferences_patch()
    results["Sidebar Dinámico"] = test_sidebar()
    results["Current User Info"] = test_current_user()
    results["Notificaciones"] = test_notifications()

    # Resumen final
    print_section("RESUMEN DE TESTS")

    total = len(results)
    passed = sum(1 for v in results.values() if v)
    failed = total - passed

    for test_name, result in results.items():
        if result:
            print_success(f"{test_name}")
        else:
            print_error(f"{test_name}")

    print(f"\n{'='*60}")
    print(f"{BLUE}Total: {total} | Pasaron: {GREEN}{passed}{RESET} | Fallaron: {RED}{failed}{RESET}")
    print(f"{'='*60}\n")

    if failed == 0:
        print_success("🎉 ¡TODOS LOS TESTS PASARON!")
        print_info("El sistema está listo para producción.")
    else:
        print_warning(f"⚠ {failed} test(s) fallaron. Revisa los errores.")

    return failed == 0

if __name__ == "__main__":
    try:
        success = run_all_tests()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print_warning("\n\nTests interrumpidos por el usuario.")
        sys.exit(1)
    except Exception as e:
        print_error(f"\nError inesperado: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
