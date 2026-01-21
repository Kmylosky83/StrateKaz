# Análisis de Issues en Módulo de Perfil
**Fecha:** 20 Enero 2026
**Versión:** v3.7.0

---

## 🔍 ISSUES REPORTADOS

### Issue 1: Idioma no afecta la UI del software
**Síntoma:** Al cambiar el idioma de "es" a "en" en Preferencias, el cambio se guarda pero la interfaz no cambia de idioma.

**Status:** ✅ **ESPERADO - NO ES UN BUG**

### Issue 2: Empresa y Área no se muestran en perfil
**Síntoma:** En la página de perfil, los campos "Empresa" y "Área" aparecen como "-" (vacíos).

**Status:** ⚠️ **BUG CONFIRMADO**

---

## 📊 ANÁLISIS DETALLADO

### Issue 1: Sistema de Idiomas

#### Estado Actual
```typescript
// frontend/src/features/perfil/pages/PreferenciasPage.tsx
// ✅ El campo de idioma se guarda correctamente en BD
// ✅ GET /api/core/user-preferences/ retorna language: "es" o "en"
// ✅ PATCH actualiza correctamente
```

#### ¿Por qué no cambia la UI?

**Respuesta:** No hay sistema de internacionalización (i18n) implementado.

**Evidencia:**
1. No existe librería `react-i18next` en `package.json`
2. No hay archivos de traducción (`/locales`, `/lang`, etc.)
3. Todos los textos están hardcodeados en español

**Ejemplo:**
```typescript
// frontend/src/features/perfil/pages/PerfilPage.tsx
<h3>Información Personal</h3>  // ← Hardcoded en español
<h3>Información Laboral</h3>   // ← Hardcoded en español
```

#### ¿Esto es un problema?

**NO, es una funcionalidad pendiente de implementar.**

La preferencia de idioma se guarda correctamente para uso futuro cuando se implemente i18n.

---

### Issue 2: Empresa y Área Vacías

#### Estado Actual

**Backend:**
```python
# backend/apps/core/serializers.py (UserDetailSerializer)

# ✅ empresa_nombre existe y funciona
def get_empresa_nombre(self, obj):
    from .models import BrandingConfig
    config = BrandingConfig.objects.first()
    return config.company_name if config else None

# ✅ area_nombre existe y funciona
area_nombre = serializers.CharField(source='cargo.area.name', read_only=True)
```

**Frontend:**
```typescript
// frontend/src/features/perfil/pages/PerfilPage.tsx

const areaName = user?.area_nombre || user?.cargo?.area_nombre || '-';
const empresaName = user?.empresa_nombre || '-';
```

#### Problema Identificado

**El endpoint `/api/core/users/me/` NO usa `UserDetailSerializer`**

**Evidencia:**
```python
# backend/apps/core/views/core_views.py:194

def current_user(request):
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        # ... muchos campos ...
        'cargo': {
            'id': user.cargo.id,
            'code': user.cargo.code,
            'name': user.cargo.name,
            'level': user.cargo.level,
        } if user.cargo else None,
        # ... pero NO incluye:
        # - empresa_nombre ❌
        # - area_nombre ❌
        # - photo_url ❌ (pero este sí funciona por otro motivo)
    })
```

**La view `current_user()` construye el response manualmente** en lugar de usar el serializer.

#### ¿Por qué photo_url sí funciona?

Porque se agregó manualmente después:
```python
# Línea 219-220 (aproximadamente)
'photo_url': request.build_absolute_uri(user.photo.url) if user.photo else None,
```

Pero `empresa_nombre` y `area_nombre` NO están incluidos.

---

## 🔧 SOLUCIONES

### Solución 1: Sistema de Idiomas (i18n)

**Opciones:**

#### Opción A: Implementar i18n completo (RECOMENDADO para futuro)
```bash
npm install react-i18next i18next
```

**Pros:**
- Soporte profesional para múltiples idiomas
- Cambio dinámico de idioma
- Archivos de traducción organizados

**Contras:**
- Requiere refactorizar TODOS los textos de la app (~154,000 líneas)
- Estimado: 40-80 horas de trabajo
- No es prioridad para MVP

#### Opción B: Mantener solo español (RECOMENDADO para MVP)
- El campo de idioma existe en preferencias
- Se guarda correctamente
- Cuando se implemente i18n en el futuro, ya estará la preferencia guardada

**Decisión:** Opción B (documentar que i18n es future feature)

---

### Solución 2: Empresa y Área en Perfil (CRÍTICO - ARREGLAR AHORA)

#### Opción A: Refactorizar current_user() para usar UserDetailSerializer

**Cambio:**
```python
# backend/apps/core/views/core_views.py

def current_user(request):
    """Endpoint para obtener información del usuario autenticado actual"""
    from .serializers import UserDetailSerializer

    serializer = UserDetailSerializer(request.user, context={'request': request})
    return Response(serializer.data)
```

**Pros:**
- ✅ Usa código existente y probado
- ✅ Automáticamente incluye empresa_nombre y area_nombre
- ✅ Mantiene consistencia con otros endpoints
- ✅ DRY (Don't Repeat Yourself)

**Contras:**
- Cambia estructura del response (puede afectar frontend)

#### Opción B: Agregar campos faltantes manualmente

**Cambio:**
```python
def current_user(request):
    # ... código existente ...

    # Agregar empresa_nombre
    empresa_nombre = None
    from apps.core.models import BrandingConfig
    config = BrandingConfig.objects.first()
    if config:
        empresa_nombre = config.company_name

    # Agregar area_nombre
    area_nombre = None
    if user.cargo and user.cargo.area:
        area_nombre = user.cargo.area.name

    return Response({
        # ... todos los campos existentes ...
        'empresa_nombre': empresa_nombre,
        'area_nombre': area_nombre,
    })
```

**Pros:**
- No cambia estructura existente
- Cambio mínimo

**Contras:**
- Duplica lógica que ya existe en serializer
- Menos mantenible

**Decisión:** Opción A (usar serializer) - Más limpio y profesional

---

## ⚠️ IMPACTO DE CAMBIOS

### Si usamos UserDetailSerializer en current_user()

**Campos que se AGREGAN:**
```diff
+ empresa_nombre
+ area_nombre
+ section_ids
+ permission_codes
+ created_by_username
+ created_at
+ updated_at
+ deleted_at
```

**Campos que CAMBIAN de estructura:**
```diff
- cargo_code (directamente en root)
- cargo_level (directamente en root)
+ cargo (objeto con más datos: area_id, area_nombre, subordinados_count)
```

**Compatibilidad Frontend:**

El frontend ya está preparado para ambas estructuras:
```typescript
// PerfilPage.tsx línea 45-46
const areaName = user?.area_nombre || user?.cargo?.area_nombre || '-';
const empresaName = user?.empresa_nombre || '-';
```

Funciona con:
- `user.area_nombre` (nuevo, desde serializer) ✅
- `user.cargo.area_nombre` (fallback) ✅

---

## 🎯 PLAN DE ACCIÓN

### Prioridad Alta (Arreglar ahora)

1. ✅ **Corregir current_user() para incluir empresa y área**
   - Usar UserDetailSerializer
   - Tiempo estimado: 15 minutos
   - Testing: 10 minutos

### Prioridad Baja (Futuro)

2. ⏳ **Implementar sistema i18n completo**
   - Agregar react-i18next
   - Crear archivos de traducción
   - Refactorizar textos hardcodeados
   - Tiempo estimado: 40-80 horas
   - Milestone: v4.0.0 (post-MVP)

---

## 📝 NOTAS ADICIONALES

### Estado de photo_url

**Observación:** El campo `photo_url` SÍ funciona en el perfil.

**Explicación:**
- El endpoint `current_user()` ya incluye `photo_url` manualmente
- Se agregó en línea ~219 del archivo
- Por eso el avatar se muestra correctamente

### Validación de Cargo y Área

**Importante:** No todos los usuarios tienen cargo asignado.

Si `user.cargo` es `None`:
- `cargo`: None
- `area_nombre`: None (normal)
- `empresa_nombre`: SÍ debe mostrarse (viene de BrandingConfig, no de cargo)

---

**Autor:** Claude Code
**Fecha:** 20 Enero 2026
**Próximo paso:** Implementar corrección de current_user()
