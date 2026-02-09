#!/usr/bin/env python3
"""
Passenger WSGI Entry Point para cPanel
Sistema de Gestión Integral - StrateKaz

Este archivo es el punto de entrada para Passenger en cPanel.
Passenger es el servidor de aplicaciones que ejecuta aplicaciones Python en cPanel.

IMPORTANTE:
- Este archivo debe estar en el directorio raíz de la aplicación
- El nombre DEBE ser exactamente 'passenger_wsgi.py'
- cPanel lo detectará automáticamente al configurar Python App
"""

import sys
import os
from pathlib import Path

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURACIÓN DE RUTAS
# ═══════════════════════════════════════════════════════════════════════════
# Obtener el directorio de la aplicación (donde está este archivo)
# En cPanel será algo como: /home/usuario/grasas.stratekaz.com/backend
CURRENT_DIR = Path(__file__).resolve().parent

# Añadir el directorio de la aplicación al Python path
sys.path.insert(0, str(CURRENT_DIR))

# Añadir el directorio padre (para que funcione 'from config import settings')
sys.path.insert(0, str(CURRENT_DIR.parent))

# Verificar que estamos usando el virtualenv correcto
# En cPanel, Passenger maneja esto automáticamente, pero es bueno verificarlo
VENV_PATH = CURRENT_DIR / 'venv'
if VENV_PATH.exists():
    # Activar el entorno virtual si existe
    activate_this = VENV_PATH / 'bin' / 'activate_this.py'
    if activate_this.exists():
        exec(open(str(activate_this)).read(), {'__file__': str(activate_this)})

# ═══════════════════════════════════════════════════════════════════════════
# VARIABLES DE ENTORNO
# ═══════════════════════════════════════════════════════════════════════════
# En cPanel, las variables de entorno se configuran en la interfaz de Python App
# o en un archivo .env en el directorio de la aplicación

# Asegurar que Django use el archivo de configuración correcto
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')

# Modo cPanel (sin Redis ni Celery workers)
os.environ.setdefault('USE_CPANEL', 'True')

# Cargar variables de entorno desde .env si existe
ENV_FILE = CURRENT_DIR / '.env'
if ENV_FILE.exists():
    try:
        from decouple import config
        # El módulo python-decouple se encargará de cargar el .env automáticamente
    except ImportError:
        # Si no está instalado decouple, cargar manualmente
        with open(ENV_FILE) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ.setdefault(key.strip(), value.strip())

# ═══════════════════════════════════════════════════════════════════════════
# LOGGING PARA DEBUGGING
# ═══════════════════════════════════════════════════════════════════════════
# Crear directorio de logs si no existe
LOGS_DIR = CURRENT_DIR / 'logs'
LOGS_DIR.mkdir(exist_ok=True)

# Log de inicio de Passenger (útil para debugging)
import logging
logging.basicConfig(
    filename=str(LOGS_DIR / 'passenger.log'),
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

logger = logging.getLogger(__name__)
logger.info('=' * 80)
logger.info('Passenger WSGI iniciando...')
logger.info(f'Python Path: {sys.path}')
logger.info(f'Current Dir: {CURRENT_DIR}')
logger.info(f'Python Version: {sys.version}')
logger.info(f'DJANGO_SETTINGS_MODULE: {os.environ.get("DJANGO_SETTINGS_MODULE")}')
logger.info(f'USE_CPANEL: {os.environ.get("USE_CPANEL")}')
logger.info('=' * 80)

# ═══════════════════════════════════════════════════════════════════════════
# IMPORTAR DJANGO WSGI APPLICATION
# ═══════════════════════════════════════════════════════════════════════════
try:
    from django.core.wsgi import get_wsgi_application

    # Inicializar Django
    application = get_wsgi_application()

    logger.info('✓ Django WSGI application cargada exitosamente')

except Exception as e:
    logger.error(f'✗ Error al cargar Django WSGI application: {e}', exc_info=True)

    # Crear una aplicación WSGI de emergencia que muestre el error
    def application(environ, start_response):
        import traceback
        error_html = f'''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Error de Configuración - StrateKaz SGI</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    max-width: 800px;
                    margin: 50px auto;
                    padding: 20px;
                    background: #f5f5f5;
                }}
                .error-box {{
                    background: white;
                    border-left: 4px solid #dc2626;
                    padding: 20px;
                    border-radius: 4px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                h1 {{
                    color: #dc2626;
                    margin-top: 0;
                }}
                pre {{
                    background: #1f2937;
                    color: #f3f4f6;
                    padding: 15px;
                    border-radius: 4px;
                    overflow-x: auto;
                    font-size: 12px;
                }}
                .steps {{
                    background: #fef3c7;
                    border-left: 4px solid #f59e0b;
                    padding: 15px;
                    margin-top: 20px;
                    border-radius: 4px;
                }}
                .steps h2 {{
                    color: #92400e;
                    margin-top: 0;
                }}
                .steps ol {{
                    margin: 10px 0;
                }}
                .steps li {{
                    margin: 5px 0;
                }}
            </style>
        </head>
        <body>
            <div class="error-box">
                <h1>⚠ Error al Iniciar la Aplicación</h1>
                <p><strong>No se pudo cargar Django WSGI application.</strong></p>
                <p>Error: {str(e)}</p>
                <pre>{traceback.format_exc()}</pre>
            </div>

            <div class="steps">
                <h2>Pasos para Resolver:</h2>
                <ol>
                    <li>Verifica que todas las dependencias estén instaladas: <code>pip install -r requirements.txt</code></li>
                    <li>Verifica que el archivo .env exista y tenga las variables necesarias</li>
                    <li>Verifica la conexión a la base de datos PostgreSQL</li>
                    <li>Revisa el archivo de logs: <code>logs/passenger.log</code></li>
                    <li>En cPanel, reinicia la aplicación Python desde "Setup Python App"</li>
                </ol>
            </div>

            <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 4px;">
                <p><strong>Información del Sistema:</strong></p>
                <ul>
                    <li>Python: {sys.version}</li>
                    <li>Directorio: {CURRENT_DIR}</li>
                    <li>DJANGO_SETTINGS_MODULE: {os.environ.get('DJANGO_SETTINGS_MODULE', 'No configurado')}</li>
                </ul>
            </div>
        </body>
        </html>
        '''

        status = '500 Internal Server Error'
        response_headers = [
            ('Content-Type', 'text/html; charset=utf-8'),
            ('Content-Length', str(len(error_html.encode('utf-8'))))
        ]
        start_response(status, response_headers)
        return [error_html.encode('utf-8')]

# ═══════════════════════════════════════════════════════════════════════════
# HEALTH CHECK ENDPOINT
# ═══════════════════════════════════════════════════════════════════════════
# Passenger llama a esta función en cada request
# Django manejará el routing interno

# NOTA PARA CPANEL:
# Una vez configurada la aplicación Python en cPanel:
# 1. Ve a "Setup Python App"
# 2. Selecciona tu aplicación
# 3. En "Application startup file" debe aparecer "passenger_wsgi.py"
# 4. En "Application Entry point" debe aparecer "application"
# 5. Configura las variables de entorno necesarias
# 6. Reinicia la aplicación

logger.info('passenger_wsgi.py cargado completamente')
