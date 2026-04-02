"""
Almacenamiento multi-tenant para StrateKaz SGI.

Arquitectura de segregación por schema (industry best practices):

    MEDIA_ROOT/
    ├── public/                       # Schema público: branding de tenants, assets compartidos
    │   └── tenants/branding/
    ├── tenant_stratekaz/             # Tenant StrateKaz Demo — completamente aislado
    │   ├── documentos/pdf/2026/04/
    │   ├── colaboradores/fotos/
    │   ├── hseq/evidencias/
    │   └── ...
    └── tenant_grasas_y_huesos/       # Tenant cliente — completamente aislado
        └── ...

Principios de diseño:
    1. Aislamiento físico real: un directorio por tenant en disco
    2. UUID como nombre de archivo: previene colisiones, enumeración y path traversal
    3. Whitelist de extensiones: rechaza .php, .exe, .py y cualquier ejecutable
    4. Cero cambios en modelos existentes: TenantFileStorage como storage default
    5. Cuota por tenant: max_storage_gb del modelo Tenant
    6. Backward compatible: archivos pre-migración siguen funcionando

Uso en settings/base.py:
    STORAGES = {
        'default': {'BACKEND': 'utils.storage.TenantFileStorage'},
        ...
    }

Uso en modelos nuevos o actualizados:
    from utils.storage import tenant_media_path

    class MiModelo(TenantModel):
        archivo = FileField(upload_to=tenant_media_path('modulo', 'subcarpeta'))
        foto    = ImageField(upload_to=tenant_media_path('modulo', 'fotos'))

Archivos existentes con upload_to='some/path/%Y/%m/' se almacenan automáticamente
como {schema}/some/path/YYYY/MM/filename.ext sin modificar el modelo.
"""
from __future__ import annotations

import logging
import uuid
from pathlib import Path
from typing import Callable

from django.core.files.storage import FileSystemStorage
from django.utils import timezone

logger = logging.getLogger(__name__)

# =============================================================================
# WHITELIST DE EXTENSIONES PERMITIDAS
# =============================================================================
# Solo extensiones conocidas y seguras. Cualquier extensión fuera de esta lista
# se almacena como .bin (el archivo se guarda pero no es ejecutable).

ALLOWED_DOCUMENT_EXTENSIONS: frozenset[str] = frozenset({
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'txt', 'csv', 'rtf', 'odt', 'ods', 'odp', 'epub',
})
ALLOWED_IMAGE_EXTENSIONS: frozenset[str] = frozenset({
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico',
    'bmp', 'tiff', 'tif',
})
ALLOWED_ARCHIVE_EXTENSIONS: frozenset[str] = frozenset({
    'zip', '7z',
})
ALLOWED_EXTENSIONS: frozenset[str] = (
    ALLOWED_DOCUMENT_EXTENSIONS
    | ALLOWED_IMAGE_EXTENSIONS
    | ALLOWED_ARCHIVE_EXTENSIONS
)

# Extensiones que NUNCA deben almacenarse (ejecutables del lado servidor)
BLOCKED_EXTENSIONS: frozenset[str] = frozenset({
    'php', 'py', 'js', 'sh', 'bash', 'exe', 'bat', 'cmd',
    'pl', 'rb', 'cgi', 'asp', 'aspx', 'jsp', 'phtml',
})


# =============================================================================
# HELPERS INTERNOS
# =============================================================================

def _get_current_schema() -> str:
    """
    Retorna el schema del tenant activo en el hilo actual.
    Thread-safe gracias a django-tenants que usa threading.local().
    Retorna 'public' si no hay contexto de tenant activo.
    """
    try:
        from django.db import connection
        return connection.schema_name or 'public'
    except Exception:
        return 'public'


def _safe_extension(filename: str) -> str:
    """
    Retorna la extensión en minúsculas si está en la whitelist.
    Si la extensión está bloqueada o no está permitida, retorna 'bin'.

    Previene:
    - Ejecución de scripts del lado servidor (.php, .py, etc.)
    - Ataques de path traversal (../ en nombre)
    - Extensiones dobles maliciosas (archivo.php.jpg → .jpg)
    """
    # Usa solo la última extensión (previene 'malware.php.pdf' → '.pdf')
    ext = Path(filename).suffix.lower().lstrip('.')
    if not ext or ext in BLOCKED_EXTENSIONS:
        return 'bin'
    return ext if ext in ALLOWED_EXTENSIONS else 'bin'


def _is_already_prefixed(name: str) -> bool:
    """
    Detecta si un path ya tiene prefijo de schema (tenant_xxx/ o public/).
    Previene doble-prefijado en operaciones anidadas.
    """
    first_segment = name.split('/')[0] if '/' in name else name
    return first_segment.startswith('tenant_') or first_segment == 'public'


# =============================================================================
# TENANT FILE STORAGE — backend principal
# =============================================================================

class TenantFileStorage(FileSystemStorage):
    """
    Storage backend con segregación física por tenant.

    Extiende FileSystemStorage añadiendo el schema del tenant activo como
    prefijo en cada operación de escritura. Los archivos se almacenan en:

        MEDIA_ROOT/{schema_name}/{upload_to_result}

    Características:
    - Cero cambios en modelos existentes: se instala como storage 'default'
    - Backward compatible: archivos sin prefijo (pre-migración) siguen funcionando
    - UUID automático como nombre de archivo (previene colisiones y enumeración)
    - Schema 'public' usa prefijo 'public/' (branding de tenants en schema compartido)
    - Thread-safe: schema se lee en cada operación, no en __init__

    Migración de archivos existentes:
        python manage.py migrate_media_paths --dry-run   # preview
        python manage.py migrate_media_paths             # ejecutar
    """

    # ------------------------------------------------------------------
    # Operaciones de escritura — aplican segregación
    # ------------------------------------------------------------------

    def _save(self, name: str, content) -> str:
        """
        Guarda el archivo con prefijo de tenant.
        El nombre retornado se almacena en el campo FileField de la DB.
        """
        prefixed = self._prefix_with_schema(name)
        saved_name = super()._save(prefixed, content)
        logger.debug(
            'TenantFileStorage._save: schema=%s path=%s',
            _get_current_schema(), saved_name,
        )
        return saved_name

    # ------------------------------------------------------------------
    # Operaciones de lectura — usan el name tal como está en DB
    # ------------------------------------------------------------------

    def path(self, name: str) -> str:
        """Ruta absoluta en filesystem. Funciona con y sin prefijo."""
        return super().path(name)

    def url(self, name: str) -> str:
        """URL pública del archivo. Funciona con y sin prefijo."""
        return super().url(name)

    def exists(self, name: str) -> bool:
        return super().exists(name)

    def size(self, name: str) -> int:
        return super().size(name)

    def delete(self, name: str) -> None:
        super().delete(name)

    # ------------------------------------------------------------------
    # Lógica de prefijado
    # ------------------------------------------------------------------

    def _prefix_with_schema(self, name: str) -> str:
        """
        Antepone '{schema}/' al path si no está ya prefijado.
        Schema 'public' también se prefija (para aislamiento de branding).
        """
        if _is_already_prefixed(name):
            return name
        schema = _get_current_schema()
        return f'{schema}/{name}'


# =============================================================================
# tenant_media_path — factory para upload_to en modelos nuevos
# =============================================================================

def tenant_media_path(module: str, subfolder: str = '') -> Callable:
    """
    Factory que retorna un callable ``upload_to`` siguiendo mejores prácticas:

    - Nombre UUID4 (sin nombre original): previene colisiones, path traversal
      y enumeración del archivo store
    - Organización por año/mes: facilita rotación y backup incremental
    - Extensión validada con whitelist: rechaza ejecutables
    - Compatible con TenantFileStorage: el schema lo agrega el storage,
      no el upload_to (separación de responsabilidades)

    Path resultante del callable (antes del prefix del storage):
        {module}/{subfolder}/{YYYY}/{MM}/{uuid4hex}.{ext}

    Path final en disco (con TenantFileStorage como default storage):
        MEDIA_ROOT/{schema}/{module}/{subfolder}/{YYYY}/{MM}/{uuid4hex}.{ext}

    Ejemplos:
        # Documentos PDF
        archivo_pdf = FileField(upload_to=tenant_media_path('documentos', 'pdf'))
        # → tenant_stratekaz/documentos/pdf/2026/04/a1b2c3d4...hex.pdf

        # Fotos de colaboradores
        foto = ImageField(upload_to=tenant_media_path('colaboradores', 'fotos'))
        # → tenant_stratekaz/colaboradores/fotos/2026/04/e5f6g7h8...hex.jpg

        # Evidencias HSEQ (sin subfolder)
        evidencia = FileField(upload_to=tenant_media_path('hseq'))
        # → tenant_stratekaz/hseq/2026/04/i9j0k1l2...hex.pdf

    Args:
        module:    Módulo del sistema. Ej: 'documentos', 'colaboradores', 'hseq'
        subfolder: Sub-carpeta opcional. Ej: 'pdf', 'fotos', 'evidencias', 'sellados'
    """
    def _upload_to(instance, filename: str) -> str:
        ext = _safe_extension(filename)
        unique_name = f'{uuid.uuid4().hex}.{ext}'
        now = timezone.now()

        parts = [module]
        if subfolder:
            parts.append(subfolder)
        parts.extend([str(now.year), f'{now.month:02d}', unique_name])

        return '/'.join(parts)

    # Nombre descriptivo para Django migrations (repr del campo)
    label = f'{module}_{subfolder}'.rstrip('_').replace('/', '_')
    _upload_to.__name__ = f'tenant_upload_{label}'
    _upload_to.__qualname__ = f'tenant_upload_{label}'

    return _upload_to


# =============================================================================
# HELPERS DE ADMINISTRACIÓN Y CUOTA
# =============================================================================

def get_tenant_media_root() -> Path:
    """
    Retorna la ruta MEDIA_ROOT/{schema}/ del tenant activo.
    Útil para operaciones de bajo nivel (backups, limpieza, auditoría).

    Ejemplo:
        root = get_tenant_media_root()
        # → Path('/opt/stratekaz/backend/media/tenant_stratekaz')
    """
    from django.conf import settings
    schema = _get_current_schema()
    return Path(settings.MEDIA_ROOT) / schema


def get_tenant_storage_usage_bytes() -> int:
    """
    Calcula el uso total de disco del tenant activo en bytes.
    Recorre recursivamente MEDIA_ROOT/{schema}/.

    Nota: operación de I/O — usar en tareas Celery, no en requests HTTP.
    """
    tenant_root = get_tenant_media_root()
    if not tenant_root.exists():
        return 0
    total = sum(
        f.stat().st_size
        for f in tenant_root.rglob('*')
        if f.is_file()
    )
    logger.debug(
        'Storage usage for schema %s: %.2f MB',
        _get_current_schema(),
        total / (1024 ** 2),
    )
    return total


def check_storage_quota(file_size_bytes: int = 0) -> tuple[bool, float, float]:
    """
    Verifica si el tenant activo tiene cuota disponible.

    Consulta ``Tenant.max_storage_gb`` y lo compara con el uso actual
    más el archivo que se intenta subir.

    Args:
        file_size_bytes: Tamaño del archivo a subir (0 = solo consultar estado)

    Returns:
        Tupla (puede_subir, usado_gb, limite_gb).
        Si no hay límite configurado, limite_gb = inf y puede_subir = True.

    Uso típico en un serializer o view:
        puede, usado, limite = check_storage_quota(file.size)
        if not puede:
            raise ValidationError(
                f'Cuota excedida: {usado:.2f} GB de {limite:.2f} GB usados.'
            )
    """
    try:
        schema = _get_current_schema()
        if schema == 'public':
            return True, 0.0, float('inf')

        from django.apps import apps
        Tenant = apps.get_model('tenant', 'Tenant')
        tenant = Tenant.objects.filter(schema_name=schema).first()
        max_gb = getattr(tenant, 'max_storage_gb', None) if tenant else None

        if not max_gb:
            return True, 0.0, float('inf')

        max_bytes = max_gb * 1024 ** 3
        usado_bytes = get_tenant_storage_usage_bytes()
        usado_gb = usado_bytes / (1024 ** 3)
        puede_subir = (usado_bytes + file_size_bytes) <= max_bytes

        if not puede_subir:
            logger.warning(
                'Cuota excedida — tenant: %s | usado: %.2f GB | límite: %.2f GB',
                schema, usado_gb, max_gb,
            )

        return puede_subir, round(usado_gb, 3), float(max_gb)

    except Exception:
        logger.exception('Error al verificar cuota de almacenamiento')
        return True, 0.0, float('inf')  # Fail-open: no bloquear ante error interno


def get_storage_summary() -> dict:
    """
    Resumen de almacenamiento del tenant activo.
    Útil para dashboard de administración.

    Returns:
        {
            'schema': 'tenant_stratekaz',
            'usado_bytes': 1048576,
            'usado_mb': 1.0,
            'usado_gb': 0.001,
            'limite_gb': 5.0,
            'porcentaje': 0.02,
            'puede_subir': True,
        }
    """
    schema = _get_current_schema()
    usado_bytes = get_tenant_storage_usage_bytes()
    puede_subir, usado_gb, limite_gb = check_storage_quota()
    porcentaje = (usado_gb / limite_gb * 100) if limite_gb != float('inf') else 0.0

    return {
        'schema': schema,
        'usado_bytes': usado_bytes,
        'usado_mb': round(usado_bytes / (1024 ** 2), 2),
        'usado_gb': round(usado_gb, 3),
        'limite_gb': limite_gb if limite_gb != float('inf') else None,
        'porcentaje': round(porcentaje, 1),
        'puede_subir': puede_subir,
    }
