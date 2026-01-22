"""
Passenger WSGI Configuration for cPanel
Sistema de Gestión Integral - StrateKaz

Este archivo es requerido por Passenger para ejecutar Django en cPanel.
Debe colocarse en el directorio raíz de la aplicación Python en cPanel.

Estructura esperada:
    ~/grasas.stratekaz.com/
    ├── passenger_wsgi.py  (este archivo)
    ├── tmp/
    │   └── restart.txt    (touch para reiniciar)
    ├── backend/
    │   ├── .env           (variables de entorno)
    │   ├── config/
    │   ├── apps/
    │   └── manage.py
    └── public_html/       (frontend React)
"""
import os
import sys

# ═══════════════════════════════════════════════════
# PyMySQL: Alternativa a mysqlclient para cPanel
# ═══════════════════════════════════════════════════
# mysqlclient requiere compilación con mysql-devel
# PyMySQL es Python puro y funciona sin compilación
try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass  # mysqlclient está instalado

# ═══════════════════════════════════════════════════
# Configuración de rutas
# ═══════════════════════════════════════════════════
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(CURRENT_DIR, 'backend')

# Agregar directorios al path de Python
for path in [BACKEND_DIR, CURRENT_DIR]:
    if path not in sys.path:
        sys.path.insert(0, path)

# ═══════════════════════════════════════════════════
# Cargar variables de entorno desde .env
# ═══════════════════════════════════════════════════
try:
    from dotenv import load_dotenv
    env_path = os.path.join(BACKEND_DIR, '.env')
    if os.path.exists(env_path):
        load_dotenv(env_path)
except ImportError:
    pass  # python-decouple manejará el .env

# ═══════════════════════════════════════════════════
# Configurar Django
# ═══════════════════════════════════════════════════
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Importar la aplicación WSGI de Django
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
