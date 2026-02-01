# AUDITORÍA: AVATAR DROPDOWN - PÁGINAS DE USUARIO

> Documento generado: 2026-01-18
> Módulo: Avatar Dropdown (Header)
> Secciones auditadas: Mi Perfil, Notificaciones, Seguridad, Preferencias

---

## RESUMEN EJECUTIVO

| Sección | Estado | Problemas Críticos |
|---------|--------|-------------------|
| Mi Perfil | ⚠️ Básico (5/10) | Solo lectura, sin PageHeader |
| Notificaciones | ⚠️ Mock (4/10) | Datos hardcodeados, no funcional |
| Seguridad | ⚠️ Placeholder (3/10) | Botones sin función |
| Preferencias | ⚠️ Parcial (5/10) | Solo tema funciona, redundancias |

### Redundancias Identificadas

| Funcionalidad | Ubicación 1 | Ubicación 2 | Acción |
|--------------|-------------|-------------|--------|
| Modo Oscuro | Header.tsx (icono) | PreferenciasPage | **Eliminar de Preferencias** |
| Notificaciones config | PreferenciasPage | NotificacionesPage → Tab Preferencias | **Eliminar de PreferenciasPage** |

---

## 1. MI PERFIL

### 1.1 Estado Actual

**Archivo**: `frontend/src/features/perfil/pages/PerfilPage.tsx` (98 líneas)
**Ruta**: `/perfil`

```typescript
// Datos consumidos
const { user } = useAuthStore();

// Campos mostrados
- first_name, last_name
- username, email
- cargo.name, cargo.area.name
- empresa.nombre
```

### 1.2 Hallazgos

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Solo lectura | ✅ Correcto | No debería editar datos sensibles |
| Design System | ⚠️ Parcial | Usa Card, no PageHeader |
| RBAC | ✅ No aplica | Es el propio usuario |
| Tipado | ⚠️ Débil | Usa `as Record<string, unknown>` |
| Responsive | ✅ Correcto | Grid md:grid-cols-2 |

### 1.3 Mejoras Identificadas

#### [MEDIA] MP-001: Agregar PageHeader Consistente

**Problema**: La página no usa el patrón PageHeader del resto de la aplicación.

**Solución**:
```typescript
// ACTUAL
<div className="p-6 max-w-4xl mx-auto">
  <Card className="p-8">
    {/* Header del perfil */}
    <div className="flex items-center gap-6 mb-8">
      ...
    </div>

// PROPUESTO
<div className="space-y-6">
  <PageHeader
    title="Mi Perfil"
    description="Información de tu cuenta y datos personales"
  />
  <div className="max-w-4xl mx-auto">
    <Card className="p-8">
      ...
```

**Esfuerzo**: 1 hora

---

#### [BAJA] MP-002: Mejorar Tipado del Modelo User

**Problema**: Usa casting forzado por tipado incompleto.

```typescript
// ACTUAL - Problema
<InfoItem label="Area" value={(user?.cargo as Record<string, unknown>)?.area?.name as string || '-'} />
<InfoItem label="Empresa" value={(user as Record<string, unknown>)?.empresa?.nombre as string || '-'} />

// PROPUESTO - Mejorar interface User
interface User {
  // ... campos existentes
  cargo?: {
    id: number;
    name: string;
    area?: {
      id: number;
      name: string;
    };
  };
  empresa?: {
    id: number;
    nombre: string;
  };
}
```

**Esfuerzo**: 2 horas

---

#### [MEDIA] MP-003: Considerar Edición de Datos No Sensibles

**Análisis**: ¿El usuario debería poder actualizar algunos datos?

| Campo | Editable | Razón |
|-------|----------|-------|
| Foto de perfil | ✅ Sí | Personalización |
| Teléfono | ✅ Sí | Contacto |
| first_name | ❌ No | Dato de HR |
| last_name | ❌ No | Dato de HR |
| email | ❌ No | Dato de sistema |
| cargo | ❌ No | Dato de HR |

**Decisión pendiente**: Evaluar si implementar edición de foto y teléfono.

**Esfuerzo**: 8-12 horas (si se implementa)

---

## 2. NOTIFICACIONES

### 2.1 Estado Actual

**Archivo**: `frontend/src/features/audit-system/pages/NotificacionesPage.tsx` (613 líneas)
**Ruta**: `/auditoria/notificaciones`

**Estructura de Tabs**:
```
├── Bandeja - Lista de notificaciones del usuario
├── Tipos - CRUD de tipos de notificación (admin)
├── Preferencias - Configuración por categoría
└── Masivas - Envío a múltiples usuarios (admin)
```

### 2.2 Hallazgos

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Backend modelo | ✅ Existe | `Notificacion`, `TipoNotificacion`, `PreferenciaNotificacion`, `NotificacionMasiva` |
| API conectada | ❌ NO | Usa mock data hardcodeado |
| PageHeader | ✅ Usa | Correcto |
| Tabs | ✅ Funcionales | 4 tabs bien estructurados |
| RBAC | ❌ NO | No valida permisos |
| Funcionalidad real | ❌ NO | No guarda, no marca leído, no envía |

### 2.3 Backend Disponible (No Conectado)

```python
# backend/apps/audit_system/centro_notificaciones/models.py

class Notificacion:
    - tipo (FK a TipoNotificacion)
    - usuario (FK a User)
    - titulo, mensaje, url
    - prioridad (baja/normal/alta/urgente)
    - esta_leida, fecha_lectura
    - esta_archivada

class PreferenciaNotificacion:
    - usuario (FK)
    - tipo_notificacion (FK)
    - recibir_app, recibir_email, recibir_push
    - horario_inicio, horario_fin (no molestar)
```

### 2.4 REDUNDANCIA CRÍTICA: Preferencias de Notificación

**Ubicación 1**: `/perfil/preferencias` (PreferenciasPage.tsx)
```typescript
// Líneas 75-107 - NO PERSISTE EN BD
<PreferenceToggle
  label="Notificaciones por email"
  description="Recibe un resumen diario de actividad"
  defaultChecked={true}  // ← Solo visual, no se guarda
/>
```

**Ubicación 2**: `/auditoria/notificaciones` → Tab "Preferencias"
```typescript
// Completo con categorías y canales
// Pero también mock data
```

**ACCIÓN**: Eliminar la sección "Notificaciones" de PreferenciasPage.

### 2.5 Mejoras Identificadas

#### [ALTA] MN-001: Conectar NotificacionesPage con Backend

**Problema**: Toda la página usa mock data.

**Solución**: Implementar hooks y conectar a API existente.

```typescript
// hooks/useNotificaciones.ts
export function useNotificaciones() {
  return useQuery({
    queryKey: ['notificaciones'],
    queryFn: () => notificacionesApi.listar()
  });
}

export function useMarcarLeida() {
  return useMutation({
    mutationFn: (id: number) => notificacionesApi.marcarLeida(id),
    onSuccess: () => queryClient.invalidateQueries(['notificaciones'])
  });
}
```

**Archivos a crear/modificar**:
- `frontend/src/features/audit-system/api/notificacionesApi.ts`
- `frontend/src/features/audit-system/hooks/useNotificaciones.ts`
- `frontend/src/features/audit-system/pages/NotificacionesPage.tsx`

**Esfuerzo**: 16-20 horas

---

#### [ALTA] MN-002: Implementar RBAC en Notificaciones

**Problema**: No hay control de permisos. Cualquier usuario ve todas las tabs.

**Análisis de tabs por permiso**:

| Tab | Permisos Requeridos |
|-----|---------------------|
| Bandeja | `view` - Todos los usuarios |
| Tipos | `edit` - Solo administradores |
| Preferencias | `edit` - El propio usuario |
| Masivas | `create` - Solo administradores |

**Solución**:
```typescript
// NotificacionesPage.tsx
const { canDo } = usePermissions();
const canManageTipos = canDo(Modules.AUDIT_SYSTEM, Sections.NOTIFICACIONES, 'edit');
const canSendMasivas = canDo(Modules.AUDIT_SYSTEM, Sections.NOTIFICACIONES, 'create');

const tabs = [
  { id: 'bandeja', label: 'Bandeja', icon: <Bell /> },
  ...(canManageTipos ? [{ id: 'tipos', label: 'Tipos', icon: <Settings /> }] : []),
  { id: 'preferencias', label: 'Preferencias', icon: <Settings /> },
  ...(canSendMasivas ? [{ id: 'masivas', label: 'Masivas', icon: <Send /> }] : []),
];
```

**Esfuerzo**: 4-6 horas

---

#### [MEDIA] MN-003: Eliminar Redundancia en PreferenciasPage

**Problema**: Configuración de notificaciones duplicada.

**Acción**: Eliminar sección "Notificaciones" de `/perfil/preferencias`.

```typescript
// PreferenciasPage.tsx - ELIMINAR líneas 75-107
{/* Notificaciones - ELIMINAR ESTA SECCIÓN */}
<Card className="p-6">
  <div className="flex items-start gap-4">
    <div className="p-3 rounded-lg bg-blue-100">
      <Bell className="h-6 w-6 text-blue-600" />
    </div>
    ...
  </div>
</Card>
```

**Reemplazo**: Link a Centro de Notificaciones.

```typescript
<Card className="p-6">
  <div className="flex items-start gap-4">
    <div className="p-3 rounded-lg bg-blue-100">
      <Bell className="h-6 w-6 text-blue-600" />
    </div>
    <div className="flex-1">
      <h2 className="text-lg font-semibold">Notificaciones</h2>
      <p className="text-gray-600 mt-1">
        Configura tus preferencias de notificación.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-4"
        onClick={() => navigate('/auditoria/notificaciones?tab=preferencias')}
      >
        Ir a Preferencias de Notificación
      </Button>
    </div>
  </div>
</Card>
```

**Esfuerzo**: 2 horas

---

## 3. SEGURIDAD

### 3.1 Estado Actual

**Archivo**: `frontend/src/features/perfil/pages/SeguridadPage.tsx` (103 líneas)
**Ruta**: `/perfil/seguridad`

### 3.2 Hallazgos

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Cambio contraseña | ❌ No funciona | Botón sin onClick handler |
| Sesiones activas | ❌ Mock | "Windows - Chrome" hardcodeado |
| 2FA | ❌ Placeholder | "Próximamente disponible" |
| PageHeader | ❌ No usa | Estructura propia |
| Backend | ❌ No existe | No hay endpoints |

### 3.3 Mejoras Identificadas

#### [ALTA] MS-001: Implementar Cambio de Contraseña

**Problema**: Botón "Cambiar Contraseña" no hace nada.

**Solución**: Modal con formulario y endpoint.

```typescript
// Modal de cambio de contraseña
interface CambioContrasenaForm {
  contrasena_actual: string;
  contrasena_nueva: string;
  confirmar_contrasena: string;
}

// Endpoint backend
// POST /api/auth/cambiar-contrasena/
{
  "old_password": "...",
  "new_password": "..."
}
```

**Archivos a crear**:
- `frontend/src/features/perfil/components/CambiarContrasenaModal.tsx`
- `backend/apps/core/views_auth.py` (endpoint cambio contraseña)

**Esfuerzo**: 6-8 horas

---

#### [MEDIA] MS-002: Implementar Sesiones Activas Reales

**Problema**: Sesiones son mock data.

**Solución**: Usar django-rest-knox o similar para tracking de tokens.

```python
# Backend - Modelo de sesiones
class UserSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token_key = models.CharField(max_length=8)  # Primeros 8 chars del token
    user_agent = models.CharField(max_length=500)
    ip_address = models.GenericIPAddressField()
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
```

**Esfuerzo**: 8-12 horas

---

#### [BAJA] MS-003: Agregar PageHeader

**Problema**: No usa PageHeader.

**Solución**:
```typescript
<PageHeader
  title="Seguridad"
  description="Gestiona la seguridad de tu cuenta"
/>
```

**Esfuerzo**: 30 minutos

---

## 4. PREFERENCIAS

### 4.1 Estado Actual

**Archivo**: `frontend/src/features/perfil/pages/PreferenciasPage.tsx` (188 líneas)
**Ruta**: `/perfil/preferencias`

### 4.2 Hallazgos

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Tema | ✅ Funciona | Persiste en localStorage vía Zustand |
| Notificaciones | ⚠️ Redundante | Duplicado con NotificacionesPage |
| Idioma | ❌ Placeholder | "Próximamente más idiomas" |
| Fecha/Hora | ❌ No editable | Solo muestra valores fijos |
| PageHeader | ❌ No usa | Estructura propia |
| Backend | ❌ Parcial | Solo tema persiste localmente |

### 4.3 REDUNDANCIA: Modo Oscuro

**Ubicación 1**: Header.tsx (línea 175-190)
```typescript
{/* Theme Toggle */}
<button onClick={toggleTheme} ...>
  {theme === 'dark' ? <Sun /> : <Moon />}
</button>
```

**Ubicación 2**: PreferenciasPage.tsx (línea 45-70)
```typescript
<button onClick={() => theme === 'dark' && toggleTheme()}>
  <Sun /> Claro
</button>
<button onClick={() => theme === 'light' && toggleTheme()}>
  <Moon /> Oscuro
</button>
```

**DECISIÓN**: Mantener en Header (más accesible). En Preferencias mostrar como información, no como control.

### 4.4 Mejoras Identificadas

#### [MEDIA] MPR-001: Eliminar Redundancia de Modo Oscuro

**Problema**: Mismo control en Header y Preferencias.

**Solución**: En Preferencias, mostrar como información con link al header.

```typescript
{/* Tema - REEMPLAZAR controles por info */}
<Card className="p-6">
  <div className="flex items-start gap-4">
    <div className="p-3 rounded-lg bg-amber-100">
      {theme === 'dark' ? <Moon /> : <Sun />}
    </div>
    <div className="flex-1">
      <h2 className="text-lg font-semibold">Tema de la Interfaz</h2>
      <p className="text-gray-600 mt-1">
        Tema actual: <strong>{theme === 'dark' ? 'Oscuro' : 'Claro'}</strong>
      </p>
      <p className="text-sm text-gray-500 mt-2">
        Puedes cambiar el tema usando el icono <Sun className="inline w-4 h-4" /> en la barra superior.
      </p>
    </div>
  </div>
</Card>
```

**Esfuerzo**: 1 hora

---

#### [MEDIA] MPR-002: Eliminar Sección Notificaciones (Redundante)

**Ya documentado en MN-003**

---

#### [BAJA] MPR-003: Agregar PageHeader

**Esfuerzo**: 30 minutos

---

#### [BAJA] MPR-004: Implementar Formato de Fecha Configurable

**Problema**: Formato de fecha no es editable.

**Solución futura**: Crear modelo UserPreferences en backend.

```python
class UserPreferences(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    date_format = models.CharField(max_length=20, default='DD/MM/YYYY')
    timezone = models.CharField(max_length=50, default='America/Bogota')
    language = models.CharField(max_length=10, default='es-CO')
```

**Esfuerzo**: 8-12 horas

---

## 5. PRIORIZACIÓN DE MEJORAS

### Sprint 1 - Crítico (Funcionalidad Básica)

| ID | Mejora | Esfuerzo | Impacto |
|----|--------|----------|---------|
| MS-001 | Cambio de contraseña funcional | 6-8h | Alto |
| MN-001 | Conectar notificaciones con backend | 16-20h | Alto |
| MN-002 | RBAC en notificaciones | 4-6h | Alto |

### Sprint 2 - Eliminar Redundancias

| ID | Mejora | Esfuerzo | Impacto |
|----|--------|----------|---------|
| MN-003 | Eliminar notificaciones de PreferenciasPage | 2h | Medio |
| MPR-001 | Eliminar modo oscuro de PreferenciasPage | 1h | Medio |
| MP-001 | PageHeader en Mi Perfil | 1h | Bajo |
| MPR-003 | PageHeader en Preferencias | 30min | Bajo |
| MS-003 | PageHeader en Seguridad | 30min | Bajo |

### Backlog

| ID | Mejora | Esfuerzo | Impacto |
|----|--------|----------|---------|
| MS-002 | Sesiones activas reales | 8-12h | Medio |
| MP-002 | Mejorar tipado User | 2h | Bajo |
| MPR-004 | Formato fecha configurable | 8-12h | Bajo |

---

## 6. DIAGRAMA DE FLUJO PROPUESTO

```
Avatar Dropdown (UserMenu.tsx)
│
├── Mi Perfil (/perfil)
│   └── Solo visualización de datos
│       - Nombre, email, cargo, área, empresa
│       - [Futuro] Editar foto y teléfono
│
├── Notificaciones (/auditoria/notificaciones)
│   └── Centro completo de notificaciones
│       - Bandeja (todos)
│       - Tipos (admin)
│       - Preferencias (todos)
│       - Masivas (admin)
│
├── Seguridad (/perfil/seguridad)
│   └── Configuración de seguridad
│       - Cambiar contraseña ✅
│       - Sesiones activas
│       - 2FA (futuro)
│
├── Preferencias (/perfil/preferencias)
│   └── Configuración personal (SIN redundancias)
│       - Tema: Solo info (control en Header)
│       - Notificaciones: Link a Centro
│       - Idioma (futuro)
│       - Formato fecha (futuro)
│
└── Cerrar Sesión
    └── logout()
```

---

## 7. ARCHIVOS CLAVE

| Archivo | Líneas | Estado |
|---------|--------|--------|
| `components/common/UserMenu.tsx` | 243 | ✅ Bien estructurado |
| `features/perfil/pages/PerfilPage.tsx` | 98 | ⚠️ Falta PageHeader |
| `features/perfil/pages/SeguridadPage.tsx` | 103 | ⚠️ Botones sin función |
| `features/perfil/pages/PreferenciasPage.tsx` | 188 | ⚠️ Redundancias |
| `features/audit-system/pages/NotificacionesPage.tsx` | 613 | ⚠️ Mock data |

---

*Documento generado: 2026-01-18*
*Próxima revisión: Después de implementar mejoras Sprint 1*
