# Guía de Testing Manual - StrateKaz v3.7.0
## Core, Configuración y Avatar - Pre-Producción

**Fecha:** 20 Enero 2026
**Servidores:** ✅ Backend (8000) | ✅ Frontend (3010)
**Estado:** Listo para testing

---

## ✅ SERVIDORES VERIFICADOS

```
✓ Backend:  http://localhost:8000/api/core/health/
✓ Frontend: http://localhost:3010/
✓ Branding: http://localhost:8000/api/core/branding/active/ (público)
```

---

## 📋 CHECKLIST DE TESTING

### PARTE 1: LOGIN Y TOKENS (5 min)

#### Paso 1.1: Login
1. Abre en el navegador: **http://localhost:3010/login**
2. Ingresa credenciales:
   - Username: `admin` (o tu usuario)
   - Password: [tu contraseña]
3. Haz clic en "Iniciar Sesión"

**✅ Verificar:**
- Redirección al dashboard
- No hay errores en consola
- Login exitoso

#### Paso 1.2: Verificar Tokens en LocalStorage
1. Abre **DevTools** (F12)
2. Ve a la pestaña **Application**
3. En el panel izquierdo: **Local Storage** → **http://localhost:3010**
4. Busca las claves:
   - `access_token` → debe tener un valor largo (JWT)
   - `refresh_token` → debe tener un valor largo (JWT)

**✅ Verificar:**
- [ ] `access_token` existe y no es null
- [ ] `refresh_token` existe y no es null
- [ ] Tokens tienen formato JWT (tres partes separadas por puntos)

---

### PARTE 2: USER PREFERENCES (10 min)

#### Paso 2.1: Acceder a Preferencias
1. En el dashboard, busca el menú de usuario (esquina superior derecha)
2. Haz clic en "Perfil" o navega a: **http://localhost:3010/perfil/preferencias**

**✅ Verificar:**
- La página carga sin errores
- Se muestra el formulario de preferencias
- Los campos tienen valores actuales

#### Paso 2.2: Verificar Carga de Preferencias (GET)
1. Abre **DevTools** → **Network** (pestaña XHR)
2. Recarga la página (Ctrl+R)
3. Busca la petición a: `user-preferences/`

**✅ Verificar:**
- [ ] Request a `/api/core/user-preferences/` → Status: **200 OK**
- [ ] Request incluye header: `Authorization: Bearer [token]`
- [ ] Response contiene: `language`, `timezone`, `date_format`
- [ ] **NO hay error 401** (Unauthorized)
- [ ] **NO hay error 405** (Method Not Allowed)

#### Paso 2.3: Cambiar Idioma (PATCH)
1. En la página de preferencias, cambia el idioma:
   - De **Español** a **English** (o viceversa)
2. Haz clic en "Guardar cambios" o "Save changes"
3. Observa el toast de confirmación

**✅ Verificar:**
- [ ] Toast muestra "Guardado exitosamente" / "Saved successfully"
- [ ] En Network: Request `PATCH /api/core/user-preferences/` → **200 OK**
- [ ] Response muestra el idioma actualizado

#### Paso 2.4: Verificar Persistencia
1. **Recarga la página completa** (Ctrl+F5)
2. Verifica que el idioma sigue siendo el que seleccionaste

**✅ Verificar:**
- [ ] El idioma persiste después de recargar
- [ ] No se resetea a valores por defecto
- [ ] GET `/api/core/user-preferences/` retorna el valor actualizado

#### Paso 2.5: Cambiar Timezone (PATCH)
1. Cambia la zona horaria a otra diferente (ej: "America/New_York")
2. Guarda cambios
3. Verifica toast de éxito

**✅ Verificar:**
- [ ] Timezone se actualiza correctamente
- [ ] Request PATCH → 200 OK
- [ ] Persiste después de recargar

---

### PARTE 3: AVATAR UPLOAD (MS-004) (10 min)

#### Paso 3.1: Acceder a Perfil
1. Navega a: **http://localhost:3010/perfil**
2. Busca la sección de Avatar/Foto de perfil

**✅ Verificar:**
- Se muestra avatar con iniciales o foto actual
- Hay botón "Cambiar foto" o "Upload photo"

#### Paso 3.2: Subir Foto de Perfil
1. Haz clic en "Cambiar foto" / "Upload photo"
2. Se abre modal de upload
3. Arrastra una imagen (JPG, PNG, o WebP) **menor a 2MB**
4. O haz clic para seleccionar archivo
5. Se muestra preview de la imagen
6. Haz clic en "Guardar" / "Save"

**✅ Verificar:**
- [ ] Modal se abre correctamente
- [ ] Drag & drop funciona
- [ ] Preview se muestra antes de subir
- [ ] Request `POST /api/core/users/upload_photo/` → **200 OK**
- [ ] Toast de éxito se muestra
- [ ] Avatar se actualiza inmediatamente con la nueva foto
- [ ] **NO hay memory leaks** (URLs de objeto se limpian)

#### Paso 3.3: Validaciones de Upload
1. Intenta subir un archivo **mayor a 2MB**

**✅ Verificar:**
- [ ] Se muestra error: "File too large (max 2MB)"
- [ ] No se permite la subida

2. Intenta subir un archivo **no válido** (PDF, TXT, etc.)

**✅ Verificar:**
- [ ] Se muestra error: "Invalid file type"
- [ ] Solo acepta: JPG, PNG, WebP

---

### PARTE 4: BRANDING Y SIDEBAR (5 min)

#### Paso 4.1: Branding Público (Sin Login)
1. **Cierra sesión** (logout)
2. Ve a: **http://localhost:3010/login**
3. Observa la página de login

**✅ Verificar:**
- [ ] Logo de la empresa se carga correctamente
- [ ] Nombre de empresa se muestra
- [ ] Colores corporativos aplicados
- [ ] Request `GET /api/core/branding/active/` → **200 OK** (sin token)
- [ ] **NO hay error 401** en branding endpoint

#### Paso 4.2: Sidebar Dinámico
1. Haz login nuevamente
2. Observa el sidebar (menú lateral)

**✅ Verificar:**
- [ ] Sidebar carga módulos según permisos del usuario
- [ ] Request `GET /api/core/system-modules/sidebar/` → **200 OK**
- [ ] Solo se muestran módulos autorizados para el cargo del usuario
- [ ] Si eres superadmin: todos los módulos visibles
- [ ] Si eres usuario normal: solo módulos con permisos

---

### PARTE 5: NOTIFICACIONES (5 min)

#### Paso 5.1: Campanita de Notificaciones
1. En el header (arriba), busca el icono de campanita 🔔
2. Haz clic en la campanita

**✅ Verificar:**
- [ ] Panel de notificaciones se abre
- [ ] Request `GET /api/audit/notificaciones/no_leidas/` → **200 OK**
- [ ] Se muestran notificaciones no leídas (si las hay)
- [ ] Contador de no leídas funciona
- [ ] **NO hay error 401**

---

### PARTE 6: SESIONES ACTIVAS (MS-002-A) (5 min)

#### Paso 6.1: Ver Sesiones Activas
1. Ve a: **http://localhost:3010/perfil/seguridad**
2. Busca la sección "Sesiones Activas"

**✅ Verificar:**
- [ ] Se muestra lista de sesiones activas
- [ ] Request `GET /api/core/sessions/` → **200 OK**
- [ ] Se ve información de dispositivo/navegador
- [ ] Se ve IP de conexión
- [ ] Se ve fecha de última actividad

#### Paso 6.2: Cerrar Sesión Remota (Opcional)
1. Si hay múltiples sesiones, intenta cerrar una sesión remota
2. Haz clic en "Cerrar sesión" en una de las sesiones

**✅ Verificar:**
- [ ] Request `DELETE /api/core/sessions/{id}/` → **204 No Content**
- [ ] Sesión se elimina de la lista
- [ ] Toast de confirmación

---

### PARTE 7: AUTENTICACIÓN 2FA (MS-002-B) (Opcional - 10 min)

#### Paso 7.1: Verificar Estado 2FA
1. Ve a: **http://localhost:3010/perfil/seguridad**
2. Busca sección "Autenticación de Dos Factores (2FA)"

**✅ Verificar:**
- [ ] Se muestra estado actual (habilitado/deshabilitado)
- [ ] Request `GET /api/core/2fa/status/` → **200 OK**
- [ ] Hay botón para habilitar/deshabilitar 2FA

---

## 🐛 TROUBLESHOOTING

### Error 401 Persiste

**Síntomas:**
```
GET /api/core/user-preferences/ → 401 Unauthorized
GET /api/core/system-modules/sidebar/ → 401 Unauthorized
```

**Solución:**
1. Verifica en DevTools → Application → Local Storage
2. Confirma que `access_token` existe
3. En Network → Headers, verifica que se envía: `Authorization: Bearer [token]`
4. Si no hay token: cierra sesión y vuelve a hacer login
5. Si sigue fallando: limpia localStorage y cookies

### Error 405 en User Preferences

**Síntomas:**
```
GET /api/core/user-preferences/ → 405 Method Not Allowed
```

**Solución:**
- ❌ **Esto NO debería pasar** (ya lo corregimos)
- Si ocurre: el servidor no se reinició correctamente
- Reiniciar backend:
  ```powershell
  cd backend
  .\venv\Scripts\activate
  python manage.py runserver
  ```

### Avatar No Se Carga

**Solución:**
1. Verifica que la imagen sea < 2MB
2. Verifica que sea JPG, PNG o WebP
3. Verifica que el campo `photo_url` en `/api/core/users/me/` tenga valor
4. Si hay URL pero no se ve: verifica permisos de media files

### Preferencias No Persisten

**Solución:**
1. Verifica que el PATCH retorna 200 OK
2. Verifica que la respuesta incluye el valor actualizado
3. Haz un GET para confirmar que se guardó en BD
4. Si no persiste: revisa logging del backend (consola del servidor)

---

## ✅ CHECKLIST FINAL PRE-PRODUCCIÓN

Antes de deployar a producción, confirma:

### Core Functionality
- [ ] Login funciona correctamente
- [ ] Tokens se guardan en localStorage
- [ ] Refresh token automático funciona

### User Preferences (MS-003)
- [ ] GET `/api/core/user-preferences/` → 200 OK
- [ ] PATCH `/api/core/user-preferences/` → 200 OK
- [ ] PUT `/api/core/user-preferences/` → 200 OK
- [ ] Cambios persisten después de recargar
- [ ] NO hay errores 401 o 405

### Avatar Upload (MS-004)
- [ ] Upload de foto funciona
- [ ] Validaciones de tamaño (2MB) funcionan
- [ ] Validaciones de tipo (JPG/PNG/WebP) funcionan
- [ ] Preview se muestra correctamente
- [ ] Avatar se actualiza inmediatamente
- [ ] NO hay memory leaks

### Branding
- [ ] GET `/api/core/branding/active/` → 200 OK (público, sin token)
- [ ] Logo se muestra en login
- [ ] Colores corporativos aplicados

### Sidebar
- [ ] GET `/api/core/system-modules/sidebar/` → 200 OK
- [ ] Sidebar filtra por permisos
- [ ] Módulos visibles según cargo

### Notificaciones
- [ ] GET `/api/audit/notificaciones/no_leidas/` → 200 OK
- [ ] Campanita muestra contador
- [ ] Panel de notificaciones funciona

### Sesiones (MS-002-A)
- [ ] GET `/api/core/sessions/` → 200 OK
- [ ] Lista de sesiones activas visible
- [ ] Cerrar sesión remota funciona

### 2FA (MS-002-B) - Opcional
- [ ] GET `/api/core/2fa/status/` → 200 OK
- [ ] Setup de 2FA funciona
- [ ] QR code se genera
- [ ] Códigos de backup disponibles

---

## 🚀 SIGUIENTE PASO: DEPLOY A PRODUCCIÓN

Si **todos los checks están ✅**, procede con:

1. **Commit final** (ya hecho):
   ```bash
   git status  # Verificar que todo esté commiteado
   ```

2. **Push a repositorio**:
   ```bash
   git push origin main
   ```

3. **Deploy según tu método**:
   - cPanel: Seguir [docs/devops/GUIA-DESPLIEGUE-CPANEL.md](docs/devops/GUIA-DESPLIEGUE-CPANEL.md)
   - Docker: Seguir [docs/devops/DOCKER.md](docs/devops/DOCKER.md)
   - Otro: Consultar documentación específica

4. **Verificar en producción**:
   - Repetir los tests principales
   - Confirmar que los datos persisten
   - Verificar logs del servidor

---

**Autor:** Claude Code
**Fecha:** 20 Enero 2026
**Versión:** v3.7.0
**Commit:** 266bbfc
**Status:** ✅ Ready for Production Testing
