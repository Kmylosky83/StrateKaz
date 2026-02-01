"""
Configuración inicial del proyecto Django
Sistema de Gestión Integral - StrateKaz

Este archivo se ejecuta al importar el módulo 'config'.
Se usa para configurar aspectos que deben estar disponibles antes de cargar settings.
"""

import os

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURACIÓN DE PyMySQL (ALTERNATIVA A mysqlclient)
# ═══════════════════════════════════════════════════════════════════════════
# En algunos servidores cPanel, mysqlclient puede requerir compilación y
# dependencias del sistema que no están disponibles.
#
# PyMySQL es una alternativa 100% Python que NO requiere compilación.
#
# INSTRUCCIONES:
# 1. Si mysqlclient falla en cPanel, usa PyMySQL:
#    - En requirements-cpanel.txt, comenta mysqlclient
#    - Descomenta PyMySQL
#
# 2. Descomentar las siguientes líneas para usar PyMySQL:
# ═══════════════════════════════════════════════════════════════════════════

# import pymysql
# pymysql.install_as_MySQLdb()

# NOTA: Solo descomenta las líneas anteriores si:
# - Obtienes error de compilación con mysqlclient
# - No puedes instalar libmysqlclient-dev en cPanel
# - El hosting no soporta mysqlclient

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURACIÓN DE CELERY
# ═══════════════════════════════════════════════════════════════════════════
# Solo configurar Celery si no estamos en modo cPanel
# En modo cPanel (USE_CPANEL=True), Celery se ejecuta en modo EAGER

if not os.getenv('USE_CPANEL', 'False').lower() == 'true':
    # Importar Celery app solo si no estamos en cPanel
    # En cPanel, las tareas se ejecutan síncronamente
    try:
        from .celery import app as celery_app
        __all__ = ('celery_app',)
    except ImportError:
        # Si falla la importación de Celery, no es crítico en cPanel
        __all__ = ()
else:
    # En modo cPanel, no necesitamos Celery app
    __all__ = ()
