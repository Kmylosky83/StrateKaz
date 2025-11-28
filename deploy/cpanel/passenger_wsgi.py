"""
Passenger WSGI Configuration for cPanel
Sistema de Gestión - Grasas y Huesos del Norte

Este archivo es requerido por Passenger para ejecutar Django en cPanel.
Debe colocarse en el directorio raíz de la aplicación Python en cPanel.
"""
import os
import sys

# Ruta al directorio del proyecto Django (ajustar según cPanel)
# En cPanel típicamente: /home/usuario/grasas.stratekaz.com/backend
DJANGO_PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(DJANGO_PROJECT_DIR, 'backend')

# Agregar el directorio del backend al path
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Agregar el directorio del proyecto al path
if DJANGO_PROJECT_DIR not in sys.path:
    sys.path.insert(0, DJANGO_PROJECT_DIR)

# Configurar Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Importar la aplicación WSGI de Django
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
