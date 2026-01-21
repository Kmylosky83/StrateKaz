# Testing de Endpoints Corregidos - 20 Enero 2026

## Pre-requisitos

1. **Servidor Backend corriendo:**
   ```powershell
   cd backend
   .\venv\Scripts\activate
   python manage.py runserver
   ```

2. **Servidor Frontend corriendo:**
   ```powershell
   cd frontend
   npm run dev
   ```

3. **Token de autenticación:**
   - Hacer login en la aplicación
   - Abrir DevTools → Application → Local Storage
   - Copiar el valor de `access_token`

---

## Tests Manuales

### 1. Test: GET /api/core/user-preferences/ ✅

**Sin autenticación (debe fallar con 401):**
```powershell
curl http://localhost:8000/api/core/user-preferences/
```

**Esperado:** `{"detail": "Authentication credentials were not provided."}`

**Con autenticación (debe funcionar):**
```powershell
# Reemplazar YOUR_TOKEN con el token real
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/core/user-preferences/
```

**Esperado:**
```json
{
  "id": 1,
  "user": 1,
  "language": "es",
  "timezone": "America/Bogota",
  "date_format": "DD/MM/YYYY",
  "created_at": "...",
  "updated_at": "..."
}
```

---

### 2. Test: PATCH /api/core/user-preferences/ ✅

**Actualización parcial:**
```powershell
curl -X PATCH http://localhost:8000/api/core/user-preferences/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"language\": \"en\"}"
```

**Esperado:** Respuesta con `language: "en"` actualizado

---

### 3. Test: GET /api/core/branding/active/ ✅

**Endpoint público (sin autenticación):**
```powershell
curl http://localhost:8000/api/core/branding/active/
```

**Esperado:**
```json
{
  "id": 1,
  "company_name": "...",
  "logo_url": "...",
  "primary_color": "...",
  ...
}
```

**Status:** `200 OK` (público, no requiere autenticación)

---

### 4. Test: GET /api/core/system-modules/sidebar/ ✅

**Con autenticación:**
```powershell
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/core/system-modules/sidebar/
```

**Esperado:** Array de módulos filtrados según permisos del usuario

```json
[
  {
    "id": 1,
    "code": "gestion-estrategica",
    "name": "Gestión Estratégica",
    "icon": "Target",
    "tabs": [...]
  },
  ...
]
```

---

### 5. Test: GET /api/audit/notificaciones/no_leidas/ ✅

**Con autenticación:**
```powershell
curl -H "Authorization: Bearer YOUR_TOKEN" "http://localhost:8000/api/audit/notificaciones/no_leidas/?usuario_id=1"
```

**Esperado:** Array de notificaciones no leídas

```json
[
  {
    "id": 1,
    "tipo": {...},
    "titulo": "...",
    "mensaje": "...",
    "leida": false,
    ...
  }
]
```

---

## Tests desde el Frontend

### 1. Test: Login y Token Storage

1. Abrir http://localhost:3010/login
2. Hacer login con credenciales válidas
3. Abrir DevTools → Console
4. Ejecutar:
   ```javascript
   console.log('Access Token:', localStorage.getItem('access_token'));
   console.log('Refresh Token:', localStorage.getItem('refresh_token'));
   ```

**Esperado:** Ambos tokens deben tener valores no null

---

### 2. Test: Preferencias en Perfil

1. Ir a http://localhost:3010/perfil/preferencias
2. Cambiar idioma de "Español" a "English"
3. Hacer clic en "Guardar cambios"
4. Verificar toast de éxito
5. Recargar página
6. Verificar que el cambio persiste

**Esperado:** Preferencia guardada correctamente

---

### 3. Test: Branding en Login

1. Cerrar sesión (logout)
2. Ir a http://localhost:3010/login
3. Verificar que el logo y nombre de empresa se cargan

**Esperado:** Logo y branding visible sin autenticación

---

### 4. Test: Sidebar Dinámico

1. Login como usuario normal (no superadmin)
2. Verificar que el sidebar solo muestra módulos autorizados
3. Login como superadmin
4. Verificar que el sidebar muestra todos los módulos

**Esperado:** Sidebar filtrado según permisos

---

### 5. Test: Notificaciones

1. Login con cualquier usuario
2. Verificar campanita en header
3. Hacer clic en la campanita
4. Verificar que carga las notificaciones

**Esperado:** Panel de notificaciones funcional

---

## Verificación de Errores Resueltos

### Antes (Errores)
```
✗ GET /api/core/user-preferences/ → 401 Unauthorized
✗ GET /api/core/user-preferences/ → 405 Method Not Allowed
✗ GET /api/core/branding/active/ → 401 Unauthorized
✗ GET /api/core/system-modules/sidebar/ → 401 Unauthorized
✗ GET /api/audit/notificaciones/no_leidas/ → 401 Unauthorized
```

### Después (Esperado)
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

### Error 401 persiste después de login

**Causa:** Token no se guarda en localStorage

**Solución:**
1. Verificar en DevTools → Network → XHR → login
2. Verificar que la respuesta incluye `access` y `refresh`
3. Verificar que el authStore de Zustand guarda los tokens
4. Revisar [frontend/src/store/authStore.ts](frontend/src/store/authStore.ts)

---

### Error CORS

**Síntoma:** `Access to fetch at ... has been blocked by CORS policy`

**Solución:**
1. Verificar que el backend está corriendo en puerto 8000
2. Verificar CORS_ALLOWED_ORIGINS en backend/.env
3. Reiniciar servidor backend

---

### Error 500 en endpoints

**Solución:**
1. Revisar logs del servidor Django en consola
2. Verificar que las migraciones están aplicadas: `python manage.py migrate`
3. Verificar que pyotp está instalado: `pip list | grep pyotp`

---

## Comandos Útiles

**Ver logs del servidor Django:**
```powershell
# Ya están visibles en la consola donde corre el servidor
```

**Ver logs del servidor Vite:**
```powershell
# Ya están visibles en la consola donde corre npm run dev
```

**Reiniciar servidores:**
```powershell
# Backend: Ctrl+C en la consola, luego:
python manage.py runserver

# Frontend: Ctrl+C en la consola, luego:
npm run dev
```

---

## Checklist Final

- [ ] Backend corriendo en puerto 8000
- [ ] Frontend corriendo en puerto 3010
- [ ] Login exitoso y tokens guardados
- [ ] GET /api/core/user-preferences/ retorna 200 OK
- [ ] PATCH /api/core/user-preferences/ funciona
- [ ] GET /api/core/branding/active/ retorna 200 OK (sin auth)
- [ ] GET /api/core/system-modules/sidebar/ retorna 200 OK
- [ ] Sidebar muestra módulos según permisos
- [ ] Preferencias se guardan y persisten
- [ ] Notificaciones cargan correctamente

---

**Autor:** Claude Code
**Fecha:** 20 Enero 2026
**Versión:** v3.7.0
**Commit:** 266bbfc
