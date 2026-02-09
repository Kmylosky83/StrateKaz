# Guía de Testing

**Fecha:** 6 de febrero de 2026
**Proyecto:** StrateKaz ERP
**Versión:** v3.7.0

Esta guía consolidada cubre todos los aspectos del testing en StrateKaz: pruebas automatizadas backend y frontend, testing manual, y referencia de endpoints.

---

## Tabla de Contenidos

1. [Backend Testing](#backend-testing)
2. [Frontend Testing](#frontend-testing)
3. [Testing Manual](#testing-manual)
4. [Referencia de Endpoints](#referencia-de-endpoints)
5. [Troubleshooting](#troubleshooting)

---

## Backend Testing

### Framework y Herramientas

El backend utiliza un stack moderno de testing para Python/Django:

- **pytest** + **pytest-django** - Framework de testing
- **Factory Boy** - Generación de fixtures y datos de prueba
- **Coverage.py** - Análisis de cobertura de código

### Comandos Básicos

```bash
# Ejecutar todos los tests
docker-compose exec backend pytest

# Tests con reporte de cobertura
docker-compose exec backend pytest --cov=apps --cov-report=html

# Tests de una aplicación específica
docker-compose exec backend pytest apps/core/tests/

# Tests con mayor verbosidad
docker-compose exec backend pytest -v

# Tests que coincidan con un patrón
docker-compose exec backend pytest -k "test_cargo"

# Solo tests fallidos anteriormente
docker-compose exec backend pytest --lf

# Tests con salida detallada
docker-compose exec backend pytest -vv --tb=short
```

### Estructura de Tests

```
backend/apps/
├── core/
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py          # Fixtures compartidas
│       ├── test_models.py       # Tests de modelos
│       ├── test_views.py        # Tests de vistas/API
│       ├── test_serializers.py  # Tests de serializers
│       └── test_permissions.py  # Tests de permisos
├── gestion_estrategica/
│   ├── gestion_proyectos/
│   │   └── tests/
│   │       ├── conftest.py      # Fixtures PMI
│   │       ├── test_models.py   # Tests Portafolio, Proyecto
│   │       └── test_views.py    # Tests ViewSets
│   └── revision_direccion/
│       └── tests/
│           ├── conftest.py      # Fixtures ISO 9.3
│           ├── test_models.py   # Tests Programa, Acta, Compromiso
│           └── test_views.py    # Tests ViewSets
```

### Ejemplo de Test Básico

```python
# apps/core/tests/test_models.py
import pytest
from apps.core.models import Cargo

@pytest.mark.django_db
class TestCargoModel:
    def test_create_cargo(self):
        cargo = Cargo.objects.create(
            codigo='gerente_general',
            nombre='Gerente General',
            nivel_jerarquico='ESTRATEGICO'
        )
        assert cargo.id is not None
        assert cargo.is_active is True

    def test_cargo_str(self):
        cargo = Cargo(nombre='Gerente General')
        assert str(cargo) == 'Gerente General'

    def test_soft_delete(self):
        cargo = Cargo.objects.create(nombre='Test')
        cargo.soft_delete()
        assert cargo.is_active is False
        assert cargo.deleted_at is not None
```

### Fixtures con Factory Boy

```python
# apps/core/tests/factories.py
import factory
from apps.core.models import User, Cargo

class CargoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Cargo

    codigo = factory.Sequence(lambda n: f'cargo_{n}')
    nombre = factory.Faker('job', locale='es')
    nivel_jerarquico = 'OPERATIVO'
    is_active = True

class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Faker('email')
    first_name = factory.Faker('first_name', locale='es')
    last_name = factory.Faker('last_name', locale='es')
    cargo = factory.SubFactory(CargoFactory)
```

### Resumen de Tests Backend

| Categoría | Tests | Descripción |
|-----------|-------|-------------|
| RBAC System | 106+ | Permisos, roles, grupos, jerarquías |
| Jerarquía Áreas | 29 | Tests de árbol jerárquico |
| Modelo Cargo | 32 | Manual de funciones completo |
| EmpresaConfig | 32 | Singleton, validaciones DIAN |
| ConsecutivoConfig | 40 | Thread-safe, reinicio automático |
| Gestión Proyectos | 50+ | Portafolios, programas, proyectos PMI |
| Revisión Dirección | 40+ | Programas, actas, compromisos ISO 9.3 |
| **Total Backend** | **310+** | Tests automatizados |

---

## Frontend Testing

### Framework y Herramientas

El frontend utiliza herramientas modernas de testing para React:

- **Vitest** - Framework de testing (compatible con Jest)
- **React Testing Library** - Testing de componentes React
- **MSW (Mock Service Worker)** - Mocking de API
- **Storybook** - Catálogo visual de componentes

### Configuración

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Comandos Básicos

```bash
# Ejecutar todos los tests
npm test

# Tests con reporte de cobertura
npm run test:coverage

# Tests en modo watch (re-ejecuta al cambiar archivos)
npm run test:watch

# Tests con UI interactiva
npm run test:ui
```

### Estructura de Tests

```
frontend/src/
├── __tests__/
│   ├── components/
│   │   ├── Button.test.tsx
│   │   └── Modal.test.tsx
│   ├── hooks/
│   │   └── useGenericCRUD.test.ts
│   └── utils/
│       └── formatters.test.ts
├── components/
│   └── common/
│       ├── Button.tsx
│       └── Button.test.tsx  # Tests co-localizados
```

### Ejemplo de Test de Componente

```typescript
// src/__tests__/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/common/Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when loading', () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies variant classes', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
  });
});
```

### Storybook

Storybook proporciona un catálogo visual de componentes UI.

**Comandos:**

```bash
# Iniciar Storybook en modo desarrollo
npm run storybook

# Build de Storybook para producción
npm run build-storybook
```

**URL:** http://localhost:6006

**Ejemplo de Story:**

```typescript
// src/components/common/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'ghost'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
  },
};

export const Loading: Story = {
  args: {
    children: 'Saving...',
    loading: true,
  },
};

export const Danger: Story = {
  args: {
    children: 'Delete',
    variant: 'danger',
  },
};
```

**Stories Creadas:**
- `Button.stories.tsx` - Variantes de botón
- `Badge.stories.tsx` - Badges/etiquetas
- `Modal.stories.tsx` - Sistema de modales
- `Card.stories.tsx` - Tarjetas

### Resumen de Tests Frontend

| Categoría | Tests | Framework |
|-----------|-------|-----------|
| Componentes UI | 71+ | Vitest + React Testing Library |
| Componentes Visuales | - | Storybook |

---

## Testing Manual

Esta sección describe los procedimientos de testing manual para validar funcionalidades críticas antes de deployment.

### Pre-requisitos

1. **Servidores activos:**
   - Backend: http://localhost:8000
   - Frontend: http://localhost:3010

2. **Verificación de salud:**
   ```bash
   # Backend
   curl http://localhost:8000/api/core/health/

   # Frontend
   curl http://localhost:3010/
   ```

3. **Obtener token de autenticación:**
   - Hacer login en la aplicación
   - Abrir DevTools (F12) → Application → Local Storage
   - Copiar el valor de `access_token`

### Checklist de Testing Manual

#### 1. Login y Tokens (5 min)

**Paso 1.1: Login**
1. Abrir http://localhost:3010/login
2. Ingresar credenciales (username: `admin`)
3. Hacer clic en "Iniciar Sesión"

**Verificar:**
- ✓ Redirección a Mi Portal (/mi-portal)
- ✓ No hay errores en consola
- ✓ Login exitoso

**Paso 1.2: Verificar Tokens en LocalStorage**
1. Abrir DevTools (F12) → Application
2. Local Storage → http://localhost:3010
3. Buscar las claves:
   - `access_token` → debe tener un valor JWT
   - `refresh_token` → debe tener un valor JWT

**Verificar:**
- [ ] `access_token` existe y no es null
- [ ] `refresh_token` existe y no es null
- [ ] Tokens tienen formato JWT (tres partes separadas por puntos)

#### 2. User Preferences (10 min)

**Paso 2.1: Acceder a Preferencias**
1. En Mi Portal, ir al menú de usuario
2. Navegar a: http://localhost:3010/perfil/preferencias

**Verificar:**
- [ ] La página carga sin errores
- [ ] Se muestra el formulario de preferencias
- [ ] Los campos tienen valores actuales

**Paso 2.2: Verificar Carga (GET)**
1. Abrir DevTools → Network (XHR)
2. Recargar la página (Ctrl+R)
3. Buscar petición a: `user-preferences/`

**Verificar:**
- [ ] Request a `/api/core/user-preferences/` → Status: 200 OK
- [ ] Request incluye header: `Authorization: Bearer [token]`
- [ ] Response contiene: `language`, `timezone`, `date_format`
- [ ] NO hay error 401 (Unauthorized)
- [ ] NO hay error 405 (Method Not Allowed)

**Paso 2.3: Cambiar Idioma (PATCH)**
1. Cambiar idioma (Español ↔ English)
2. Hacer clic en "Guardar cambios"
3. Observar toast de confirmación

**Verificar:**
- [ ] Toast muestra "Guardado exitosamente"
- [ ] Request `PATCH /api/core/user-preferences/` → 200 OK
- [ ] Response muestra el idioma actualizado

**Paso 2.4: Verificar Persistencia**
1. Recargar la página completa (Ctrl+F5)
2. Verificar que el idioma persiste

**Verificar:**
- [ ] El idioma no se resetea a valores por defecto
- [ ] GET retorna el valor actualizado

#### 3. Avatar Upload (10 min)

**Paso 3.1: Acceder a Perfil**
1. Navegar a: http://localhost:3010/perfil
2. Buscar la sección de Avatar/Foto de perfil

**Verificar:**
- [ ] Se muestra avatar con iniciales o foto actual
- [ ] Hay botón "Cambiar foto"

**Paso 3.2: Subir Foto de Perfil**
1. Hacer clic en "Cambiar foto"
2. Arrastra una imagen (JPG, PNG, o WebP) **< 2MB**
3. Se muestra preview de la imagen
4. Hacer clic en "Guardar"

**Verificar:**
- [ ] Modal se abre correctamente
- [ ] Drag & drop funciona
- [ ] Preview se muestra antes de subir
- [ ] Request `POST /api/core/users/upload_photo/` → 200 OK
- [ ] Toast de éxito se muestra
- [ ] Avatar se actualiza inmediatamente
- [ ] NO hay memory leaks

**Paso 3.3: Validaciones de Upload**

Intentar subir archivo **> 2MB**:
- [ ] Se muestra error: "File too large (max 2MB)"
- [ ] No se permite la subida

Intentar subir archivo **no válido** (PDF, TXT):
- [ ] Se muestra error: "Invalid file type"
- [ ] Solo acepta: JPG, PNG, WebP

#### 4. Branding y Sidebar (5 min)

**Paso 4.1: Branding Público (Sin Login)**
1. Cerrar sesión (logout)
2. Ir a: http://localhost:3010/login
3. Observar la página de login

**Verificar:**
- [ ] Logo de la empresa se carga
- [ ] Nombre de empresa se muestra
- [ ] Colores corporativos aplicados
- [ ] Request `GET /api/core/branding/active/` → 200 OK (sin token)
- [ ] NO hay error 401 en branding endpoint

**Paso 4.2: Sidebar Dinámico**
1. Hacer login nuevamente
2. Observar el sidebar (menú lateral)

**Verificar:**
- [ ] Sidebar carga módulos según permisos
- [ ] Request `GET /api/core/system-modules/sidebar/` → 200 OK
- [ ] Solo se muestran módulos autorizados
- [ ] Superadmin: todos los módulos visibles
- [ ] Usuario normal: solo módulos con permisos

#### 5. Notificaciones (5 min)

**Paso 5.1: Campanita de Notificaciones**
1. En el header, buscar el icono de campanita
2. Hacer clic en la campanita

**Verificar:**
- [ ] Panel de notificaciones se abre
- [ ] Request `GET /api/audit/notificaciones/no_leidas/` → 200 OK
- [ ] Se muestran notificaciones no leídas
- [ ] Contador de no leídas funciona
- [ ] NO hay error 401

#### 6. Sesiones Activas (5 min)

**Paso 6.1: Ver Sesiones Activas**
1. Ir a: http://localhost:3010/perfil/seguridad
2. Buscar sección "Sesiones Activas"

**Verificar:**
- [ ] Se muestra lista de sesiones activas
- [ ] Request `GET /api/core/sessions/` → 200 OK
- [ ] Se ve información de dispositivo/navegador
- [ ] Se ve IP de conexión
- [ ] Se ve fecha de última actividad

**Paso 6.2: Cerrar Sesión Remota (Opcional)**
1. Si hay múltiples sesiones, cerrar una remota
2. Hacer clic en "Cerrar sesión"

**Verificar:**
- [ ] Request `DELETE /api/core/sessions/{id}/` → 204 No Content
- [ ] Sesión se elimina de la lista
- [ ] Toast de confirmación

#### 7. Autenticación 2FA (Opcional - 10 min)

**Paso 7.1: Verificar Estado 2FA**
1. Ir a: http://localhost:3010/perfil/seguridad
2. Buscar sección "Autenticación de Dos Factores (2FA)"

**Verificar:**
- [ ] Se muestra estado actual (habilitado/deshabilitado)
- [ ] Request `GET /api/core/2fa/status/` → 200 OK
- [ ] Hay botón para habilitar/deshabilitar 2FA

### Checklist Final Pre-Producción

Antes de deployar a producción, confirmar todos los puntos:

**Core Functionality:**
- [ ] Login funciona correctamente
- [ ] Tokens se guardan en localStorage
- [ ] Refresh token automático funciona

**User Preferences:**
- [ ] GET `/api/core/user-preferences/` → 200 OK
- [ ] PATCH `/api/core/user-preferences/` → 200 OK
- [ ] Cambios persisten después de recargar
- [ ] NO hay errores 401 o 405

**Avatar Upload:**
- [ ] Upload de foto funciona
- [ ] Validaciones de tamaño (2MB) funcionan
- [ ] Validaciones de tipo (JPG/PNG/WebP) funcionan
- [ ] Preview se muestra correctamente
- [ ] Avatar se actualiza inmediatamente
- [ ] NO hay memory leaks

**Branding:**
- [ ] GET `/api/core/branding/active/` → 200 OK (público, sin token)
- [ ] Logo se muestra en login
- [ ] Colores corporativos aplicados

**Sidebar:**
- [ ] GET `/api/core/system-modules/sidebar/` → 200 OK
- [ ] Sidebar filtra por permisos
- [ ] Módulos visibles según cargo

**Notificaciones:**
- [ ] GET `/api/audit/notificaciones/no_leidas/` → 200 OK
- [ ] Campanita muestra contador
- [ ] Panel de notificaciones funciona

**Sesiones:**
- [ ] GET `/api/core/sessions/` → 200 OK
- [ ] Lista de sesiones activas visible
- [ ] Cerrar sesión remota funciona

**2FA (Opcional):**
- [ ] GET `/api/core/2fa/status/` → 200 OK
- [ ] Setup de 2FA funciona
- [ ] QR code se genera
- [ ] Códigos de backup disponibles

---

## Referencia de Endpoints

Esta sección documenta los endpoints principales del sistema con ejemplos de uso mediante cURL.

### Autenticación

#### Login
```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "tu_password"}'
```

**Respuesta esperada:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### Refresh Token
```bash
curl -X POST http://localhost:8000/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "TU_REFRESH_TOKEN"}'
```

### Core - User Preferences

#### GET User Preferences
```bash
# Sin autenticación (debe fallar con 401)
curl http://localhost:8000/api/core/user-preferences/

# Con autenticación (debe funcionar)
curl -H "Authorization: Bearer TU_TOKEN" \
  http://localhost:8000/api/core/user-preferences/
```

**Respuesta esperada:**
```json
{
  "id": 1,
  "user": 1,
  "language": "es",
  "timezone": "America/Bogota",
  "date_format": "DD/MM/YYYY",
  "created_at": "2026-01-20T10:00:00Z",
  "updated_at": "2026-01-20T10:00:00Z"
}
```

#### PATCH User Preferences (actualización parcial)
```bash
curl -X PATCH http://localhost:8000/api/core/user-preferences/ \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"language": "en"}'
```

#### PUT User Preferences (actualización completa)
```bash
curl -X PUT http://localhost:8000/api/core/user-preferences/ \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "language": "es",
    "timezone": "America/Bogota",
    "date_format": "DD/MM/YYYY"
  }'
```

### Core - Branding

#### GET Active Branding (público, sin autenticación)
```bash
curl http://localhost:8000/api/core/branding/active/
```

**Respuesta esperada:**
```json
{
  "id": 1,
  "company_name": "Mi Empresa",
  "logo_url": "/media/branding/logo.png",
  "primary_color": "#1e40af",
  "secondary_color": "#64748b"
}
```

**Status:** 200 OK (público, no requiere autenticación)

### Core - System Modules

#### GET Sidebar Modules
```bash
curl -H "Authorization: Bearer TU_TOKEN" \
  http://localhost:8000/api/core/system-modules/sidebar/
```

**Respuesta esperada:**
```json
[
  {
    "id": 1,
    "code": "gestion-estrategica",
    "name": "Gestión Estratégica",
    "icon": "Target",
    "tabs": [
      {
        "id": 1,
        "name": "Configuración",
        "route": "/gestion-estrategica/configuracion"
      }
    ]
  }
]
```

### Core - Users

#### Upload Photo
```bash
curl -X POST http://localhost:8000/api/core/users/upload_photo/ \
  -H "Authorization: Bearer TU_TOKEN" \
  -F "photo=@/ruta/a/imagen.jpg"
```

### Audit - Notificaciones

#### GET Unread Notifications
```bash
curl -H "Authorization: Bearer TU_TOKEN" \
  "http://localhost:8000/api/audit/notificaciones/no_leidas/?usuario_id=1"
```

**Respuesta esperada:**
```json
[
  {
    "id": 1,
    "tipo": {
      "id": 1,
      "nombre": "Sistema"
    },
    "titulo": "Bienvenido",
    "mensaje": "Tu cuenta ha sido creada",
    "leida": false,
    "created_at": "2026-01-20T10:00:00Z"
  }
]
```

### Core - Sessions

#### GET Active Sessions
```bash
curl -H "Authorization: Bearer TU_TOKEN" \
  http://localhost:8000/api/core/sessions/
```

#### DELETE Session (cerrar sesión remota)
```bash
curl -X DELETE http://localhost:8000/api/core/sessions/SESSION_ID/ \
  -H "Authorization: Bearer TU_TOKEN"
```

### Core - 2FA

#### GET 2FA Status
```bash
curl -H "Authorization: Bearer TU_TOKEN" \
  http://localhost:8000/api/core/2fa/status/
```

### Verificación de Endpoints Corregidos

**Estado anterior (Errores):**
```
✗ GET /api/core/user-preferences/ → 401 Unauthorized
✗ GET /api/core/user-preferences/ → 405 Method Not Allowed
✗ GET /api/core/branding/active/ → 401 Unauthorized
✗ GET /api/core/system-modules/sidebar/ → 401 Unauthorized
✗ GET /api/audit/notificaciones/no_leidas/ → 401 Unauthorized
```

**Estado actual (Esperado):**
```
✓ GET /api/core/user-preferences/ → 200 OK (con token)
✓ GET /api/core/user-preferences/ → 401 Unauthorized (sin token - esperado)
✓ PATCH /api/core/user-preferences/ → 200 OK (con token)
✓ PUT /api/core/user-preferences/ → 200 OK (con token)
✓ GET /api/core/branding/active/ → 200 OK (público)
✓ GET /api/core/system-modules/sidebar/ → 200 OK (con token)
✓ GET /api/audit/notificaciones/no_leidas/ → 200 OK (con token)
```

---

## Troubleshooting

### Error 401 Persiste

**Síntomas:**
```
GET /api/core/user-preferences/ → 401 Unauthorized
GET /api/core/system-modules/sidebar/ → 401 Unauthorized
```

**Solución:**
1. Verificar en DevTools → Application → Local Storage
2. Confirmar que `access_token` existe
3. En Network → Headers, verificar que se envía: `Authorization: Bearer [token]`
4. Si no hay token: cerrar sesión y volver a hacer login
5. Si sigue fallando: limpiar localStorage y cookies

### Error 405 en User Preferences

**Síntomas:**
```
GET /api/core/user-preferences/ → 405 Method Not Allowed
```

**Solución:**
- Este error NO debería ocurrir (ya corregido)
- Si ocurre: el servidor no se reinició correctamente
- Reiniciar backend:
  ```powershell
  cd backend
  .\venv\Scripts\activate
  python manage.py runserver
  ```

### Avatar No Se Carga

**Solución:**
1. Verificar que la imagen sea < 2MB
2. Verificar que sea JPG, PNG o WebP
3. Verificar que el campo `photo_url` en `/api/core/users/me/` tenga valor
4. Si hay URL pero no se ve: verificar permisos de media files

### Preferencias No Persisten

**Solución:**
1. Verificar que el PATCH retorna 200 OK
2. Verificar que la respuesta incluye el valor actualizado
3. Hacer un GET para confirmar que se guardó en BD
4. Si no persiste: revisar logging del backend (consola del servidor)

### Error CORS

**Síntoma:**
```
Access to fetch at ... has been blocked by CORS policy
```

**Solución:**
1. Verificar que el backend está corriendo en puerto 8000
2. Verificar `CORS_ALLOWED_ORIGINS` en `backend/.env`
3. Reiniciar servidor backend

### Error 500 en Endpoints

**Solución:**
1. Revisar logs del servidor Django en consola
2. Verificar que las migraciones están aplicadas:
   ```bash
   python manage.py migrate
   ```
3. Verificar dependencias instaladas:
   ```bash
   pip list | grep pyotp
   ```

### Token No Se Guarda en LocalStorage

**Causa:** Token no se guarda después de login

**Solución:**
1. Verificar en DevTools → Network → XHR → login
2. Verificar que la respuesta incluye `access` y `refresh`
3. Verificar que el authStore de Zustand guarda los tokens
4. Revisar `frontend/src/store/authStore.ts`

### Comandos Útiles para Debugging

**Ver logs del servidor Django:**
```bash
# Los logs están visibles en la consola donde corre el servidor
# O redirigir a archivo:
python manage.py runserver > django.log 2>&1
```

**Ver logs del servidor Vite:**
```bash
# Los logs están visibles en la consola donde corre npm run dev
npm run dev | tee vite.log
```

**Reiniciar servidores:**
```bash
# Backend: Ctrl+C en la consola, luego:
python manage.py runserver

# Frontend: Ctrl+C en la consola, luego:
npm run dev
```

---

## Objetivos de Cobertura

| Área | Objetivo | Actual |
|------|----------|--------|
| Backend models | 90% | 85% |
| Backend views | 80% | 75% |
| Frontend components | 70% | 65% |
| Frontend hooks | 80% | 70% |

---

## Documentación Adicional

- [INFORME_TESTING_SEMANA_3.md](../desarrollo/sesiones/INFORME_TESTING_SEMANA_3.md) - Informe detallado de testing
- [TESTS_RBAC_COMPLETADO.md](../desarrollo/sesiones/TESTS_RBAC_COMPLETADO.md) - Tests del sistema RBAC
- [frontend/.storybook/README.md](../../frontend/.storybook/README.md) - Guía completa de Storybook

---

**Última actualización:** 6 de febrero de 2026
**Mantenido por:** Equipo de Desarrollo StrateKaz
