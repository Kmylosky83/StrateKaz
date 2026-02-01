"""
Utilidades para sanitización de inputs y prevención de ataques.
"""
import bleach
import re
from django.utils.html import escape


# Configuración de bleach para sanitización HTML
ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
    'a', 'span', 'div',
]

ALLOWED_ATTRIBUTES = {
    'a': ['href', 'title', 'target'],
    'span': ['class'],
    'div': ['class'],
}

ALLOWED_PROTOCOLS = ['http', 'https', 'mailto']


def sanitize_html(html_content):
    """
    Sanitizar contenido HTML para prevenir XSS.

    Args:
        html_content: String con contenido HTML

    Returns:
        String sanitizado
    """
    if not html_content:
        return html_content

    return bleach.clean(
        html_content,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        protocols=ALLOWED_PROTOCOLS,
        strip=True
    )


def sanitize_text(text):
    """
    Sanitizar texto plano escapando caracteres HTML.

    Args:
        text: String con texto

    Returns:
        String escapado
    """
    if not text:
        return text

    return escape(str(text))


def sanitize_filename(filename):
    """
    Sanitizar nombre de archivo para prevenir path traversal.

    Args:
        filename: Nombre del archivo

    Returns:
        Nombre sanitizado
    """
    if not filename:
        return filename

    # Remover caracteres peligrosos
    filename = re.sub(r'[^\w\s\-\.]', '', filename)

    # Remover path traversal
    filename = filename.replace('..', '')
    filename = filename.replace('/', '')
    filename = filename.replace('\\', '')

    # Limitar longitud
    if len(filename) > 255:
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        filename = name[:250] + ('.' + ext if ext else '')

    return filename


def validate_sql_input(text):
    """
    Validar que el texto no contenga patrones de SQL injection.

    Args:
        text: String a validar

    Returns:
        bool: True si es seguro, False si contiene patrones sospechosos
    """
    if not text:
        return True

    # Patrones peligrosos
    dangerous_patterns = [
        r"(\bunion\b.*\bselect\b)",
        r"(\bor\b.*=.*)",
        r"(--)",
        r"(;.*drop\b)",
        r"(;.*delete\b)",
        r"(;.*update\b)",
        r"(;.*insert\b)",
        r"(\bexec\b.*\()",
        r"('.*or.*'.*=.*')",
    ]

    text_lower = text.lower()

    for pattern in dangerous_patterns:
        if re.search(pattern, text_lower):
            return False

    return True


def sanitize_dict(data, fields_to_sanitize=None):
    """
    Sanitizar todos los campos de texto en un diccionario.

    Args:
        data: Diccionario con datos
        fields_to_sanitize: Lista de campos a sanitizar (None = todos)

    Returns:
        Diccionario sanitizado
    """
    if not isinstance(data, dict):
        return data

    sanitized = {}

    for key, value in data.items():
        if fields_to_sanitize and key not in fields_to_sanitize:
            sanitized[key] = value
            continue

        if isinstance(value, str):
            sanitized[key] = sanitize_text(value)
        elif isinstance(value, dict):
            sanitized[key] = sanitize_dict(value, fields_to_sanitize)
        elif isinstance(value, list):
            sanitized[key] = [
                sanitize_dict(item, fields_to_sanitize) if isinstance(item, dict)
                else sanitize_text(item) if isinstance(item, str)
                else item
                for item in value
            ]
        else:
            sanitized[key] = value

    return sanitized


def clean_search_query(query):
    """
    Limpiar query de búsqueda para prevenir ataques.

    Args:
        query: String de búsqueda

    Returns:
        String limpio
    """
    if not query:
        return query

    # Remover caracteres especiales SQL
    query = re.sub(r'[;\'\"\\]', '', query)

    # Remover comentarios SQL
    query = re.sub(r'--.*$', '', query)
    query = re.sub(r'/\*.*?\*/', '', query, flags=re.DOTALL)

    # Limitar longitud
    if len(query) > 200:
        query = query[:200]

    return query.strip()


def validate_email(email):
    """
    Validar formato de email.

    Args:
        email: Email a validar

    Returns:
        bool: True si es válido
    """
    if not email:
        return False

    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_phone(phone):
    """
    Validar formato de teléfono colombiano.

    Args:
        phone: Número de teléfono

    Returns:
        bool: True si es válido
    """
    if not phone:
        return False

    # Limpiar caracteres no numéricos
    phone_clean = re.sub(r'\D', '', phone)

    # Validar longitud (7 o 10 dígitos para Colombia)
    return len(phone_clean) in [7, 10]


def sanitize_url(url):
    """
    Sanitizar URL para prevenir ataques de redirección.

    Args:
        url: URL a sanitizar

    Returns:
        URL sanitizada o None si es peligrosa
    """
    if not url:
        return url

    # Permitir solo URLs relativas o con protocolos seguros
    if url.startswith('/'):
        return url

    if url.startswith('http://') or url.startswith('https://'):
        # Verificar que no contenga caracteres peligrosos
        if re.search(r'[<>"\']', url):
            return None
        return url

    # No permitir otros protocolos
    return None
