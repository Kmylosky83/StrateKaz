"""
Utilidad de cifrado centralizada para StrateKaz.

Usa Fernet (AES-128-CBC con HMAC-SHA256) para cifrar/descifrar valores sensibles.
La clave se obtiene de ENCRYPTION_KEY en .env, con fallback a clave de desarrollo.

Uso:
    from utils.encryption import encrypt_value, decrypt_value
    encrypted = encrypt_value("mi_secret")
    original = decrypt_value(encrypted)
"""

from cryptography.fernet import Fernet, InvalidToken
from decouple import config

# Clave fija SOLO para desarrollo — NUNCA usar en producción
DEV_ENCRYPTION_KEY = 'ZGV2X2tleV9ET19OT1RfVVNFX0lOX1BST0RVQ1RJT04='


def get_encryption_key() -> bytes:
    """
    Obtiene la clave de cifrado desde .env o usa clave de desarrollo.

    IMPORTANTE: En producción DEBE configurarse ENCRYPTION_KEY en .env
    Generar con: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    """
    encryption_key = config('ENCRYPTION_KEY', default=None)

    if not encryption_key:
        import warnings
        warnings.warn(
            "ENCRYPTION_KEY no configurada en .env. Usando clave de desarrollo. "
            "Configure ENCRYPTION_KEY en .env antes de ir a producción.",
            RuntimeWarning
        )
        encryption_key = DEV_ENCRYPTION_KEY

    return encryption_key.encode() if isinstance(encryption_key, str) else encryption_key


def encrypt_value(plaintext: str) -> str:
    """
    Cifra un valor string y retorna el ciphertext en base64.

    Args:
        plaintext: Valor a cifrar

    Returns:
        String cifrado (base64 Fernet token)
    """
    key = get_encryption_key()
    f = Fernet(key)
    return f.encrypt(plaintext.encode('utf-8')).decode('utf-8')


def decrypt_value(ciphertext: str) -> str:
    """
    Descifra un valor cifrado con encrypt_value().

    Args:
        ciphertext: Valor cifrado (base64 Fernet token)

    Returns:
        String original descifrado

    Raises:
        InvalidToken: Si el ciphertext es inválido o la clave cambió
    """
    key = get_encryption_key()
    f = Fernet(key)
    return f.decrypt(ciphertext.encode('utf-8')).decode('utf-8')


def try_decrypt_value(ciphertext: str) -> str:
    """
    Intenta descifrar un valor. Si falla (texto plano legacy), retorna el valor tal cual.
    Útil para migración gradual de campos que antes se guardaban sin cifrar.

    Args:
        ciphertext: Valor posiblemente cifrado

    Returns:
        String descifrado o el valor original si no estaba cifrado
    """
    try:
        return decrypt_value(ciphertext)
    except (InvalidToken, Exception):
        # Asumimos que es texto plano (legacy)
        return ciphertext
