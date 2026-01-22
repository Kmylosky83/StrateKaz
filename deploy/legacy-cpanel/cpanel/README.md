# Deployment Multi-Instancia - StrateKaz

Scripts y templates para deployment en arquitectura multi-instancia sobre cPanel.

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA MULTI-INSTANCIA                  │
└─────────────────────────────────────────────────────────────────┘

Empresa A ──> [Instancia A] ──> [DB A] ──> acme.stratekaz.com
Empresa B ──> [Instancia B] ──> [DB B] ──> beta.stratekaz.com
Empresa C ──> [Instancia C] ──> [DB C] ──> gamma.stratekaz.com
```

Cada empresa tiene:
- Su propia instalacion Django
- Base de datos MySQL independiente
- Subdominio unico
- Aislamiento completo de datos

## Estructura de Archivos

```
deploy/cpanel/
├── README.md                    # Este archivo
├── create-instance.sh           # Crear nueva instancia
├── deploy-all.sh                # Actualizar todas las instancias
└── templates/
    ├── env.template             # Template de .env
    ├── nginx.conf.template      # Template Nginx (VPS)
    └── supervisor.conf.template # Template Supervisor (VPS)
```

## Scripts

### create-instance.sh

Crea una nueva instancia completa para una empresa.

```bash
# Uso basico
./create-instance.sh acme

# Con email de administrador
./create-instance.sh acme --admin-email=admin@acme.com

# Modo simulacion (no ejecuta cambios)
./create-instance.sh acme --dry-run

# Sin frontend (solo backend)
./create-instance.sh acme --skip-frontend
```

**Proceso:**
1. Verifica que no exista la instancia
2. Guia para crear subdominio en cPanel
3. Guia para crear base de datos MySQL
4. Guia para configurar Python App
5. Copia codigo base
6. Genera archivo .env con credenciales
7. Instala dependencias Python
8. Ejecuta migraciones
9. Crea superusuario
10. Ejecuta seeds de datos iniciales
11. Recolecta archivos estaticos
12. Reinicia aplicacion
13. Verifica health check
14. Guarda credenciales en archivo seguro

### deploy-all.sh

Actualiza todas las instancias existentes con nuevo codigo.

```bash
# Actualizar todas las instancias
./deploy-all.sh

# Solo instancias especificas
./deploy-all.sh --only=acme,beta

# Excluir instancias
./deploy-all.sh --skip=test,demo

# Con migraciones
./deploy-all.sh --migrate

# Sin actualizar frontend
./deploy-all.sh --skip-frontend

# Modo simulacion
./deploy-all.sh --dry-run
```

**Proceso por instancia:**
1. Backup de .env
2. Actualiza codigo backend (rsync)
3. Actualiza frontend (si aplica)
4. Instala nuevas dependencias
5. Ejecuta migraciones (si --migrate)
6. Recolecta estaticos
7. Reinicia aplicacion
8. Verifica health check

## Templates

### env.template

Template para archivo .env de cada instancia. Variables a reemplazar:
- `{{SECRET_KEY}}` - Clave secreta Django
- `{{DOMINIO}}` - Dominio de la instancia
- `{{DB_NAME}}`, `{{DB_USER}}`, `{{DB_PASSWORD}}` - Credenciales MySQL
- `{{EMAIL_*}}` - Configuracion SMTP

### nginx.conf.template

Template para deployments en VPS con Nginx (no aplica en cPanel).

### supervisor.conf.template

Template para deployments en VPS con Supervisor (no aplica en cPanel).

## Prerequisitos cPanel

1. **Acceso SSH** al servidor
2. **Usuario cPanel** con permisos para:
   - Crear subdominios
   - Crear bases de datos MySQL
   - Configurar Python Apps
3. **Codigo base** disponible en `/home/{user}/stratekaz-base/`

## Workflow de Deployment

### Nueva Empresa

```bash
# 1. Crear instancia
./create-instance.sh nueva_empresa --admin-email=admin@empresa.com

# 2. Guardar credenciales generadas
# (automaticamente en ~/.credentials/nueva_empresa.txt)

# 3. Verificar acceso
curl https://nueva_empresa.stratekaz.com/api/health/
```

### Actualizacion de Version

```bash
# 1. Actualizar codigo base
cd /home/strat/stratekaz-base
git pull origin main

# 2. Build del frontend
cd frontend && npm run build

# 3. Deployar a todas las instancias
cd /home/strat/deploy/cpanel
./deploy-all.sh --migrate
```

### Rollback

```bash
# El codigo base mantiene versiones en Git
cd /home/strat/stratekaz-base
git checkout v3.2.0

# Redeployar
./deploy-all.sh
```

## Seguridad

- Los archivos .env tienen permisos 600
- Las credenciales se guardan en ~/.credentials/ con permisos 700
- El script genera passwords aleatorios seguros
- Health checks verifican que la API responda

## Logs

Los logs de deployment se guardan en:
```
/home/{user}/deploy-logs/{empresa}-{timestamp}.log
```

Los logs de aplicacion estan en:
```
/home/{user}/{dominio}/backend/logs/
```

## Troubleshooting

### Error: "API no responde"
```bash
# Ver logs de Django
tail -100 /home/strat/acme.stratekaz.com/backend/logs/django.log

# Ver logs de Passenger
tail -100 /home/strat/acme.stratekaz.com/passenger.log
```

### Error: "Dependencias no instaladas"
```bash
# Activar virtualenv e instalar manualmente
source /home/strat/virtualenv/acme.stratekaz.com/3.11/bin/activate
cd /home/strat/acme.stratekaz.com/backend
pip install -r requirements.txt
```

### Error: "Migraciones fallidas"
```bash
# Ejecutar migraciones manualmente
source /home/strat/virtualenv/acme.stratekaz.com/3.11/bin/activate
cd /home/strat/acme.stratekaz.com/backend
python manage.py migrate --noinput
```
