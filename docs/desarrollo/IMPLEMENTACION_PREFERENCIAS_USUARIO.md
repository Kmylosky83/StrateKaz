# Implementación del Sistema de Preferencias de Usuario - MS-003

## Resumen

Se ha implementado completamente el sistema de persistencia de preferencias de usuario para StrateKaz, permitiendo a cada usuario personalizar:

- **Idioma**: Español (es) o English (en)
- **Zona horaria**: 70+ zonas horarias comunes
- **Formato de fecha**: DD/MM/YYYY, MM/DD/YYYY o YYYY-MM-DD

## Archivos Creados/Modificados

### Backend

#### Nuevos Archivos:
1. **`backend/apps/core/models/models_user_preferences.py`**
   - Modelo `UserPreferences` con relación 1:1 con User
   - Campos: language, timezone, date_format
   - Método `get_or_create_for_user(user)` para crear automáticamente preferencias

2. **`backend/apps/core/migrations/0015_userpreferences.py`**
   - Migración para crear la tabla `core_user_preferences`

#### Archivos Modificados:
3. **`backend/apps/core/serializers.py`**
   - Agregado `UserPreferencesSerializer` con validaciones:
     - Validación de idioma (es, en)
     - Validación de formato de fecha
     - Validación de zona horaria usando pytz

4. **`backend/apps/core/viewsets.py`**
   - Agregado `UserPreferencesViewSet` con endpoints:
     - `GET /api/core/user-preferences/` - Obtener preferencias (crea automáticamente si no existen)
     - `PUT /api/core/user-preferences/` - Actualizar preferencias completas
     - `PATCH /api/core/user-preferences/` - Actualizar preferencias parciales

5. **`backend/apps/core/urls.py`**
   - Registrado `UserPreferencesViewSet` en el router

6. **`backend/apps/core/models/__init__.py`**
   - Exportado modelo `UserPreferences`

7. **`backend/apps/core/utils/audit_logging.py`**
   - Agregada función `log_preferences_updated()` para auditoría

### Frontend

#### Nuevos Archivos:
1. **`frontend/src/features/perfil/types/preferences.types.ts`**
   - Interfaces: `UserPreferences`, `UpdatePreferencesDTO`
   - Enums: `Language`, `DateFormat`
   - Tipos para opciones: `TimezoneOption`, `LanguageOption`, `DateFormatOption`

2. **`frontend/src/features/perfil/api/preferences.api.ts`**
   - Funciones API:
     - `getUserPreferences()` - GET preferences
     - `updateUserPreferences()` - PUT preferences
     - `patchUserPreferences()` - PATCH preferences

3. **`frontend/src/features/perfil/hooks/usePreferences.ts`**
   - Hooks React Query:
     - `usePreferences()` - Obtener preferencias con cache
     - `useUpdatePreferences()` - Actualizar preferencias (PUT)
     - `usePatchPreferences()` - Actualizar preferencias (PATCH)

4. **`frontend/src/constants/timezones.ts`**
   - Lista de 70+ zonas horarias comunes organizadas por región:
     - América del Sur (10 zonas)
     - América Central y Caribe (10 zonas)
     - América del Norte (8 zonas)
     - Europa (15 zonas)
     - Asia (10 zonas)
     - Oceanía (5 zonas)
     - África (4 zonas)
     - UTC
   - Funciones helper: `getTimezoneLabel()`, `searchTimezones()`

#### Archivos Modificados:
5. **`frontend/src/features/perfil/pages/PreferenciasPage.tsx`**
   - Reemplazada implementación estática con formulario funcional:
     - Selector de idioma (botones Español/English)
     - Selector de zona horaria (dropdown con 70+ opciones)
     - Selector de formato de fecha (3 opciones con ejemplos visuales)
     - Botones "Guardar cambios" y "Restaurar valores"
     - Loading states y validación con react-hook-form
     - Toast notifications en éxito/error

## Pasos para Completar la Implementación

### 1. Aplicar Migración

Ejecutar desde el directorio `backend/`:

```bash
python manage.py migrate core
```

Esto creará la tabla `core_user_preferences`.

### 2. Verificar Backend

Probar los endpoints con un usuario autenticado:

```bash
# Obtener preferencias (las crea automáticamente si no existen)
GET /api/core/user-preferences/
Authorization: Bearer <access_token>

# Actualizar preferencias
PATCH /api/core/user-preferences/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "language": "en",
  "timezone": "America/New_York",
  "date_format": "MM/DD/YYYY"
}
```

### 3. Verificar Frontend

1. Navegar a **Perfil > Preferencias**
2. Verificar que los valores actuales se cargan correctamente
3. Cambiar idioma, zona horaria o formato de fecha
4. Hacer clic en "Guardar cambios"
5. Verificar toast de éxito
6. Recargar la página y verificar que los cambios persisten

### 4. Verificar Auditoría

Revisar logs para confirmar que se registran los cambios:

```bash
# En los logs del backend buscar:
PREFERENCES_UPDATED: user 'username' (ID:X) - Fields: language=en, timezone=America/New_York
```

## Características Implementadas

### Backend
- ✅ Modelo UserPreferences con relación 1:1 a User
- ✅ Creación automática de preferencias al primer acceso
- ✅ Validación de valores (choices para language y date_format)
- ✅ Validación de zonas horarias con pytz
- ✅ Serializer con campos read-only para labels
- ✅ ViewSet con endpoints GET/PUT/PATCH
- ✅ Logging de auditoría para cambios
- ✅ Migración generada

### Frontend
- ✅ Types completos para preferencias
- ✅ API client con funciones tipadas
- ✅ Hooks React Query con cache y mutations
- ✅ Constantes con 70+ zonas horarias
- ✅ UI completa con formulario funcional
- ✅ Loading states y skeleton loaders
- ✅ Validación con react-hook-form
- ✅ Toast notifications
- ✅ Botón "Restaurar valores" funcional
- ✅ Diseño responsive con Design System

## Estructura de Datos

### Modelo UserPreferences

```python
class UserPreferences:
    user: OneToOneField(User)          # PK
    language: CharField                 # 'es' | 'en'
    timezone: CharField                 # 'America/Bogota', etc.
    date_format: CharField              # 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
    created_at: DateTimeField
    updated_at: DateTimeField
```

### Response API

```json
{
  "language": "es",
  "language_display": "Español",
  "timezone": "America/Bogota",
  "date_format": "DD/MM/YYYY",
  "date_format_display": "DD/MM/YYYY",
  "created_at": "2025-01-20T10:30:00Z",
  "updated_at": "2025-01-20T10:30:00Z"
}
```

## Próximos Pasos (Opcional)

1. **Integrar preferencias con i18n**
   - Usar `preferences.language` para cambiar idioma de la interfaz

2. **Usar timezone en fechas**
   - Formatear fechas según `preferences.timezone`

3. **Usar date_format en componentes**
   - Aplicar `preferences.date_format` en todas las fechas mostradas

4. **Agregar más opciones**
   - Formato de hora (12h/24h)
   - Primer día de la semana
   - Formato de números/moneda

## Notas Técnicas

- Las preferencias se crean automáticamente con valores por defecto al primer acceso
- La validación de timezone usa pytz para garantizar zonas horarias válidas
- Los cambios se registran en el log de auditoría
- La caché de React Query mantiene las preferencias por 5 minutos
- El formulario usa react-hook-form para validación y estado
- El diseño sigue el Design System de StrateKaz

## Compatibilidad

- ✅ Django 4.x+
- ✅ Python 3.9+
- ✅ React 18+
- ✅ TypeScript 5+
- ✅ React Query (TanStack Query) v5
- ✅ react-hook-form v7
- ✅ Sonner (toast notifications)

## Build Status

✅ **Frontend build successful** - Todas las dependencias resueltas correctamente
✅ **TypeScript compilation passed** - Sin errores de tipos
✅ **Code splitting optimized** - Chunks generados correctamente

---

**Implementado por:** Claude Sonnet 4.5
**Fecha:** 2025-01-20
**Ticket:** MS-003 - Sistema de Preferencias de Usuario
