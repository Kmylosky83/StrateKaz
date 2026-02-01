# Iniciar Servidores - StrateKaz v3.7.0

## 🚀 Instrucciones de Inicio

### Opción 1: Manual (Recomendado)

#### Terminal 1 - Backend Django
```powershell
cd C:\Proyectos\StrateKaz\backend
.\venv\Scripts\activate
python manage.py runserver
```

**Espera a ver:**
```
Django version 5.0.9, using settings 'config.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

#### Terminal 2 - Frontend Vite
```powershell
cd C:\Proyectos\StrateKaz\frontend
npm run dev
```

**Espera a ver:**
```
VITE v5.0.0  ready in XXX ms

➜  Local:   http://localhost:3010/
➜  Network: use --host to expose
➜  press h + enter to show help
```

---

### Opción 2: Scripts Automatizados

#### Windows PowerShell

**Iniciar Backend:**
```powershell
.\start-backend.ps1
```

**Iniciar Frontend:**
```powershell
.\start-frontend.ps1
```

---

## ✅ Verificación

### 1. Backend
Abre: http://localhost:8000/api/core/health/

**Esperado:**
```json
{
  "status": "healthy",
  "database": "connected",
  "service": "stratekaz-backend",
  "version": "1.0.0"
}
```

### 2. Frontend
Abre: http://localhost:3010/

**Esperado:** Página de login de StrateKaz

---

## 🧪 Testing Después del Reinicio

### 1. Login
1. Ve a http://localhost:3010/login
2. Login con tus credenciales

### 2. Verificar Perfil
1. Ve a http://localhost:3010/perfil
2. **Verifica:**
   - ✅ **Empresa:** Debe mostrar "Palmicultores del norte S.A.S" (o tu empresa)
   - ✅ **Área:** Debe mostrar el área del usuario
   - ✅ **Cargo:** Debe mostrar el cargo
   - ✅ **Foto:** Si la subiste, debe verse

### 3. Verificar Preferencias
1. Ve a http://localhost:3010/perfil/preferencias
2. Cambia el idioma
3. Guarda
4. **Verifica:**
   - ✅ Toast de éxito
   - ✅ Recarga la página y el idioma persiste
   - ⚠️ La UI sigue en español (normal, no hay i18n)

---

## 🐛 Troubleshooting

### Backend no inicia

**Error:** `Address already in use`

**Solución:**
```powershell
# Verificar qué proceso usa el puerto 8000
netstat -ano | findstr ":8000"

# Matar el proceso (reemplaza PID con el número mostrado)
powershell -Command "Stop-Process -Id PID -Force"
```

### Frontend no inicia

**Error:** `EADDRINUSE: address already in use :::3010`

**Solución:**
```powershell
# Verificar qué proceso usa el puerto 3010
netstat -ano | findstr ":3010"

# Matar el proceso
powershell -Command "Stop-Process -Id PID -Force"
```

### Base de datos no conecta

**Solución:**
1. Verifica que MySQL esté corriendo
2. Verifica credenciales en `backend/.env`
3. Ejecuta migraciones: `python manage.py migrate`

---

## 📝 Logs

### Backend
Los logs se ven en la **Terminal 1** donde iniciaste el backend.

**Errores comunes:**
- `ModuleNotFoundError` → Falta instalar dependencia: `pip install [paquete]`
- `django.db.utils.OperationalError` → Problema con BD MySQL

### Frontend
Los logs se ven en la **Terminal 2** donde iniciaste el frontend.

**Errores comunes:**
- `ENOENT` → Falta archivo, ejecuta `npm install`
- Errores de TypeScript → Ejecuta `npx tsc --noEmit`

---

## ⚡ Shortcuts

**Detener servidores:**
- Backend: `Ctrl+C` en Terminal 1
- Frontend: `Ctrl+C` en Terminal 2

**Reiniciar rápido:**
1. `Ctrl+C` en ambas terminales
2. Flecha arriba ↑ (repite último comando)
3. Enter

---

**Última actualización:** 20 Enero 2026
**Versión:** v3.7.0
**Commit:** 6cea5ac
