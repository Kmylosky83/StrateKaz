"""
Validadores personalizados — StrateKaz SGI

Validaciones de seguridad que van más allá del formato básico de Django.
"""
import logging

from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)


def validate_email_domain(email: str) -> str:
    """
    Valida que el dominio del email tenga registros MX o A (puede recibir correo).

    Estrategia:
    1. Busca registros MX (estándar para servidores de correo).
    2. Fallback a registro A (algunos dominios pequeños no tienen MX explícito).
    3. Si hay error de red/timeout → fail-open (no bloquea, para no romper UX).
    4. Si el dominio no existe (NXDOMAIN) → bloquea con ValidationError.

    Args:
        email: Dirección de correo a validar.

    Returns:
        El email sin cambios si el dominio es válido.

    Raises:
        ValidationError: Si el dominio no tiene servidor de correo.
    """
    import dns.resolver

    if not email or '@' not in email:
        return email

    domain = email.rsplit('@', 1)[-1].strip().lower()

    if not domain:
        raise ValidationError('El email no tiene un dominio válido.')

    # Paso 1: Buscar registros MX
    try:
        answers = dns.resolver.resolve(domain, 'MX')
        if answers:
            return email
    except dns.resolver.NXDOMAIN:
        # Dominio definitivamente no existe
        raise ValidationError(
            f'El dominio @{domain} no existe. Verifique la dirección de correo.'
        )
    except dns.resolver.NoAnswer:
        pass  # No tiene MX, intentar con A
    except dns.resolver.NoNameservers:
        # Servidores DNS no responden — podría ser temporal
        logger.warning(
            'DNS NoNameservers para dominio %s — permitiendo email %s',
            domain, email,
        )
        return email
    except dns.resolver.LifetimeTimeout:
        # Timeout — no bloquear por problema de red transitorio
        logger.warning(
            'DNS timeout para dominio %s — permitiendo email %s',
            domain, email,
        )
        return email
    except Exception as exc:
        # Cualquier otro error DNS — fail-open
        logger.warning(
            'Error DNS inesperado para %s: %s — permitiendo email %s',
            domain, exc, email,
        )
        return email

    # Paso 2: Fallback a registro A
    try:
        answers = dns.resolver.resolve(domain, 'A')
        if answers:
            return email
    except dns.resolver.NXDOMAIN:
        raise ValidationError(
            f'El dominio @{domain} no existe. Verifique la dirección de correo.'
        )
    except Exception as exc:
        # Si falla el A también, el dominio no puede recibir correo
        logger.info(
            'Dominio %s sin registros MX ni A: %s',
            domain, exc,
        )
        raise ValidationError(
            f'El dominio @{domain} no tiene servidor de correo configurado.'
        )

    # Si llegamos aquí sin respuestas, el dominio no puede recibir correo
    raise ValidationError(
        f'El dominio @{domain} no tiene servidor de correo configurado.'
    )
