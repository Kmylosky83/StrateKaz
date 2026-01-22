# Gunicorn configuration file for StrateKaz
# /var/www/stratekaz/gunicorn.conf.py

import multiprocessing

# Bind to socket
bind = "127.0.0.1:8000"

# Workers
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 120
keepalive = 5

# Logging
accesslog = "/var/www/stratekaz/logs/gunicorn-access.log"
errorlog = "/var/www/stratekaz/logs/gunicorn-error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Process naming
proc_name = "stratekaz-gunicorn"

# Server mechanics
daemon = False
pidfile = "/var/www/stratekaz/logs/gunicorn.pid"
user = "stratekaz"
group = "stratekaz"
tmp_upload_dir = None

# SSL (if not using Nginx for SSL termination)
# keyfile = "/path/to/keyfile"
# certfile = "/path/to/certfile"

# Server hooks
def on_starting(server):
    pass

def on_reload(server):
    pass

def when_ready(server):
    pass

def worker_int(worker):
    pass

def worker_abort(worker):
    pass
