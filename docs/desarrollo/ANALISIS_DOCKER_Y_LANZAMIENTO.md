# Análisis de Referencias Docker y Estado del Proyecto

## Resumen Ejecutivo
Se ha realizado un análisis del proyecto `StrateKaz` para identificar referencias a Docker y evaluar la capacidad de ejecución local sin contenedores.

### Referencias a Docker Encontradas
El proyecto mantiene fuertes dependencias conceptuales y de configuración hacia Docker, aunque no se encontraron archivos `Dockerfile` o `docker-compose.yml` activos en la raíz (posiblemente eliminados previamente, pero referenciados).

1.  **Makefile**: El archivo `Makefile` en la raíz contiene numerosos comandos (`build`, `up`, `down`, `logs`) que dependen explícitamente de `docker-compose`. Estos comandos no funcionarán en un entorno sin Docker.
2.  **Documentación**: Múltiples archivos en `docs/` hacen referencia a despliegues y flujos de trabajo basados en Docker.
3.  **Configuración de Backend**: `backend/config/settings.py` tiene lógica condicional para usar Redis (común en Docker) vs Base de Datos (modo cPanel/Local).
4.  **Dependencias**: `frontend/package-lock.json` menciona paquetes como `is-docker`, lo cual es normal en dependencias de Node.js y no requiere acción.

### Estado de Puertos
Se verificó la disponibilidad de los puertos solicitados:
- **Puerto 8000 (Backend)**: Disponible.
- **Puerto 3010 (Frontend)**: Disponible.
- **Puerto 3306 (MySQL)**: Ocupado (Servicio MySQL activo localmente).
- **Puerto 6379 (Redis)**: Libre (Sin servicio Redis activo).

### Estrategia de Lanzamiento ("No Docker")
Dado que no se utiliza Docker en desarrollo y no se detectó un servicio Redis local, se procederá con la siguiente configuración para garantizar la estabilidad:

1.  **Backend**: Se ejecutará con la variable de entorno `USE_CPANEL=True`.
    -   Esto configura Django para usar la **Base de Datos** como backend de Celery (tareas síncronas) y Caché, evitando errores de conexión a Redis.
    -   Se requiere crear la tabla de caché (`python manage.py createcachetable`).
2.  **Frontend**: Se ejecutará con `vite` en el puerto 3010.

## Comandos para Desarrollo Local
Para futuras ejecuciones sin Docker, se recomienda usar:

**Backend:**
```powershell
$env:USE_CPANEL="True"
backend\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000
```

**Frontend:**
```powershell
npm run dev
```
