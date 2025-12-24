# Instalación del Módulo IntegracionExterna

## Pasos de Instalación

### 1. Instalar Cryptography

```bash
cd backend
pip install cryptography==41.0.7
```

O actualizar requirements:
```bash
pip install -r requirements.txt
```

### 2. Generar Clave de Encriptación

```bash
python manage.py shell
```

```python
from apps.gestion_estrategica.configuracion.models import IntegracionExterna
print(IntegracionExterna.generar_clave_encriptacion())
```

**Output esperado**:
```
dVp2R6tK4mH8wN3sX9zB5yC7jF1qL0aE2uT6vW8xG4pA5hM3nQ9rS1kO7iD2fJ==
```

Copiar esta clave.

### 3. Configurar Variable de Entorno

Agregar al archivo `.env` del proyecto:

```env
# =========================================
# SEGURIDAD - ENCRIPTACIÓN
# =========================================
# CRITICAL: Clave de encriptación para credenciales de IntegracionExterna
# Generar con: from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())
# NUNCA versionar en Git
# Usar claves DIFERENTES por ambiente (Dev, QA, Prod)
ENCRYPTION_KEY=dVp2R6tK4mH8wN3sX9zB5yC7jF1qL0aE2uT6vW8xG4pA5hM3nQ9rS1kO7iD2fJ==
```

**IMPORTANTE**:
- Reemplazar con tu clave generada
- Nunca commitear el `.env` a Git (debe estar en `.gitignore`)
- Documentar la clave en un vault seguro (1Password, Azure Key Vault, etc.)

### 4. Verificar .gitignore

Asegurar que `.env` esté en `.gitignore`:

```bash
# .gitignore
.env
.env.local
.env.*.local
```

### 5. Ejecutar Migraciones

```bash
python manage.py migrate
```

**Output esperado**:
```
Running migrations:
  Applying configuracion.0004_add_integracion_externa... OK
```

### 6. Verificar Instalación

```bash
python manage.py shell
```

```python
from apps.gestion_estrategica.configuracion.models import IntegracionExterna

# Crear integración de prueba
test = IntegracionExterna(
    nombre='Test Gmail',
    tipo_servicio='EMAIL',
    proveedor='GMAIL',
    metodo_autenticacion='OAUTH2'
)

# Probar encriptación
test.credenciales = {
    'client_id': 'test_client_id',
    'client_secret': 'super_secret_123'
}

test.save()

# Verificar desencriptación
print(test.credenciales)
# Output: {'client_id': 'test_client_id', 'client_secret': 'super_secret_123'}

# Verificar que está encriptado en BD
print(test._credenciales_encrypted[:50])
# Output: gAAAAABl... (texto encriptado)

# Limpiar
test.delete()
```

Si todo funciona correctamente, verás:
- Las credenciales se guardan encriptadas
- Se desencriptan correctamente al leerlas
- El campo `_credenciales_encrypted` contiene texto encriptado

---

## Configuración por Ambiente

### Desarrollo

```env
# .env.development
ENCRYPTION_KEY=dev_key_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
DEBUG=True
```

### QA / Staging

```env
# .env.staging
ENCRYPTION_KEY=qa_key_YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
DEBUG=False
```

### Producción

```env
# .env.production
ENCRYPTION_KEY=prod_key_ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ
DEBUG=False
```

**NUNCA** usar la misma clave en diferentes ambientes.

---

## Backup y Recuperación

### Backup de la Clave

1. **Vault Seguro**: Guardar en 1Password, Bitwarden, Azure Key Vault, AWS Secrets Manager
2. **Documentar**: Indicar qué clave corresponde a qué ambiente
3. **Acceso restringido**: Solo administradores senior

### Recuperación en Caso de Pérdida

**ADVERTENCIA**: Si pierdes la clave de encriptación, las credenciales NO SE PUEDEN RECUPERAR.

Opciones:
1. **Si tienes backup de la clave**: Restaurar en `.env`
2. **Si NO tienes backup**: Re-crear todas las integraciones manualmente

---

## Próximos Pasos

1. **Crear primera integración** (ver `docs/INTEGRACIONES-EXTERNAS.md`)
2. **Configurar cronjobs** para reseteo de contadores
3. **Implementar servicios** específicos (EmailService, DianService, etc.)
4. **Configurar monitoreo** de salud de integraciones

---

## Soporte

Para consultas sobre el módulo:
- Documentación completa: `docs/INTEGRACIONES-EXTERNAS.md`
- Ejemplos de uso: Ver sección "Ejemplos de Uso" en la documentación
- Issues técnicos: Contactar al equipo de desarrollo
