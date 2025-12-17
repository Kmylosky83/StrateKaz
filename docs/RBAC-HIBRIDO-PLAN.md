# Plan de Implementación: Sistema RBAC Híbrido

## Resumen Ejecutivo

Este documento describe el plan para implementar el Sistema RBAC Híbrido solicitado en la plataforma StrateKaz/Grasas y Huesos del Norte.

## Estado Actual vs. Requerido

### Ya Implementado (80%)

| Componente | Estado | Ubicación |
|------------|--------|-----------|
| Modelo `Cargo` | ✅ Completo | `backend/apps/core/models.py` |
| Modelo `Role` | ✅ Completo | `backend/apps/core/models.py` |
| Modelo `Permiso` | ✅ 68 permisos | `backend/apps/core/models.py` |
| Relación `Cargo.permisos` | ✅ ManyToMany | Via `CargoPermiso` |
| Relación `User.cargo` | ✅ ForeignKey | Campo existente |
| Método `User.has_permission()` | ✅ Implementado | Verifica cargo + roles + grupos |
| ViewSets RBAC | ✅ Completos | `backend/apps/core/viewsets_rbac.py` |
| Serializers RBAC | ✅ 30+ serializers | `backend/apps/core/serializers_rbac.py` |
| Frontend Types | ✅ Completo | `frontend/.../organizacion/roles/types.ts` |
| Frontend RolesTab | ✅ Estructura | `frontend/.../rbac/RolesTab.tsx` |
| Frontend SubTabs | ✅ CREADOS | 3 subtabs implementados |

### Pendiente de Implementar (20%)

| Componente | Prioridad | Descripción |
|------------|-----------|-------------|
| Modelo `RolAdicional` | ALTA | Roles transversales (COPASST, Brigadista, etc.) |
| `User.roles_adicionales` | ALTA | ManyToMany con RolAdicional |
| `User.get_permisos_efectivos()` | ALTA | Combinar cargo + roles_adicionales |
| ViewSet `RolAdicionalViewSet` | MEDIA | CRUD + asignación a usuarios |
| Comando `init_roles_sugeridos` | MEDIA | Seed de roles legales colombianos |
| Conexión API real en frontend | BAJA | Reemplazar datos MOCK |

---

## Arquitectura del Sistema RBAC Híbrido

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUARIO                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐    ┌──────────────────┐    ┌─────────────┐   │
│   │   CARGO     │    │ ROLES ADICIONALES │    │   GRUPOS    │   │
│   │  (1 : 1)    │    │     (1 : N)       │    │   (1 : N)   │   │
│   │             │    │                   │    │             │   │
│   │ Permisos    │    │ - COPASST         │    │ Roles       │   │
│   │ del cargo   │    │ - Brigadista      │    │ de grupo    │   │
│   │             │    │ - Auditor ISO     │    │             │   │
│   └──────┬──────┘    └────────┬──────────┘    └──────┬──────┘   │
│          │                    │                       │          │
│          └────────────────────┴───────────────────────┘          │
│                               │                                  │
│                               ▼                                  │
│                    ┌──────────────────────┐                     │
│                    │  PERMISOS EFECTIVOS  │                     │
│                    │     (OR Logic)       │                     │
│                    └──────────────────────┘                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Jerarquía de verificación:
1. Superusuario → todos los permisos
2. Cargo → permisos base del puesto
3. Roles Adicionales → permisos especializados (NUEVO)
4. Grupos → permisos colaborativos
```

---

## Modelos a Crear

### 1. RolAdicional

```python
class RolAdicional(models.Model):
    """
    Roles transversales que NO son cargos organizacionales.
    Ejemplos: COPASST, Brigadista, Auditor ISO, Aprobador de Compras
    """

    TIPO_CHOICES = [
        ('LEGAL_OBLIGATORIO', 'Legal Obligatorio'),
        ('SISTEMA_GESTION', 'Sistema de Gestión'),
        ('OPERATIVO', 'Operativo Especial'),
        ('CUSTOM', 'Personalizado'),
    ]

    code = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)

    permisos = models.ManyToManyField('Permiso', through='RolAdicionalPermiso')

    justificacion_legal = models.TextField(blank=True)
    requiere_certificacion = models.BooleanField(default=False)
    certificacion_requerida = models.CharField(max_length=200, blank=True)

    is_system = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    created_by = models.ForeignKey('User', null=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 2. UserRolAdicional (Through Table)

```python
class UserRolAdicional(models.Model):
    """
    Asignación de rol adicional a usuario con metadata.
    """
    user = models.ForeignKey('User', on_delete=models.CASCADE)
    rol_adicional = models.ForeignKey('RolAdicional', on_delete=models.CASCADE)

    assigned_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    assigned_by = models.ForeignKey('User', null=True, on_delete=models.SET_NULL)
    justificacion = models.TextField(blank=True)

    # Para roles que requieren certificación
    certificacion_adjunta = models.FileField(upload_to='certificaciones/', null=True)
    fecha_certificacion = models.DateField(null=True)
    certificacion_expira = models.DateField(null=True)

    is_active = models.BooleanField(default=True)
```

### 3. Modificación a User

```python
# Agregar campo ManyToMany
roles_adicionales = models.ManyToManyField(
    'RolAdicional',
    through='UserRolAdicional',
    related_name='users',
    blank=True
)

# Nuevo método
def get_permisos_efectivos(self):
    """Combina permisos de cargo + roles_adicionales + grupos"""
    permisos = set()

    # 1. Permisos del cargo
    if self.cargo:
        permisos.update(self.cargo.permisos.values_list('code', flat=True))

    # 2. Permisos de roles adicionales
    for asignacion in self.usuarios_roles_adicionales.filter(is_active=True):
        if asignacion.is_valid:
            permisos.update(asignacion.rol_adicional.get_permisos_codigos())

    # 3. Permisos de grupos (existente)
    # ...

    return list(permisos)
```

---

## Roles Sugeridos (Plantillas)

### Legales Obligatorios (Colombia)

| Rol | Código | Norma | Certificación |
|-----|--------|-------|---------------|
| Líder COPASST | `lider_copasst` | Res. 2013/1986, Dec. 1072/2015 | 50h SST |
| Miembro COPASST | `miembro_copasst` | Res. 2013/1986 | 50h SST |
| Vigía SST | `vigia_sst` | Res. 0312/2019 (< 10 trabajadores) | 50h SST |
| Brigadista | `brigadista` | Res. 1016/1989 | Primera Respuesta |
| Líder COCOLA | `lider_cocola` | Res. 652/2012 | Acoso Laboral |
| Miembro COCOLA | `miembro_cocola` | Res. 652/2012 | Acoso Laboral |

### Sistema de Gestión

| Rol | Código | Certificación |
|-----|--------|---------------|
| Auditor Interno ISO 9001 | `auditor_iso9001` | Auditor ISO 9001 |
| Auditor Interno ISO 45001 | `auditor_iso45001` | Auditor ISO 45001 |
| Responsable Ambiental | `responsable_ambiental` | Profesional Ambiental |
| Coordinador PESV | `coordinador_pesv` | 50h Seguridad Vial |
| Responsable SG-SST | `responsable_sgsst` | Licencia SST |

### Operativos

| Rol | Código | Descripción |
|-----|--------|-------------|
| Aprobador Compras N1 | `aprobador_compras_n1` | Hasta $5M COP |
| Aprobador Compras N2 | `aprobador_compras_n2` | Hasta $20M COP |
| Supervisor de Turno | `supervisor_turno` | Aprobación temporal |
| Aprobador Recolecciones | `aprobador_recolecciones` | Aprobar/rechazar |

---

## API Endpoints Requeridos

### Roles Adicionales

```
GET    /api/organizacion/roles-adicionales/           # Listar
POST   /api/organizacion/roles-adicionales/           # Crear
GET    /api/organizacion/roles-adicionales/{id}/      # Detalle
PATCH  /api/organizacion/roles-adicionales/{id}/      # Actualizar
DELETE /api/organizacion/roles-adicionales/{id}/      # Eliminar
GET    /api/organizacion/roles-adicionales/sugeridos/ # Plantillas
GET    /api/organizacion/roles-adicionales/{id}/usuarios/ # Usuarios asignados
```

### Asignación a Usuarios

```
GET    /api/users/{id}/roles-adicionales/    # Roles del usuario
POST   /api/users/{id}/asignar-rol/          # Asignar rol
DELETE /api/users/{id}/quitar-rol/{rol_id}/  # Quitar rol
GET    /api/users/{id}/permisos-efectivos/   # Permisos combinados
```

---

## Componentes Frontend Creados

### Estructura

```
frontend/src/features/gestion-estrategica/components/rbac/
├── index.ts                      # ✅ Exportaciones
├── RolesTab.tsx                  # ✅ Tab principal (3 subtabs)
├── PermisosCargoSubTab.tsx       # ✅ CREADO - Permisos por cargo
├── RolesAdicionalesSubTab.tsx    # ✅ CREADO - CRUD roles adicionales
└── TodosPermisosSubTab.tsx       # ✅ CREADO - 68 permisos referencia

frontend/src/features/gestion-estrategica/components/organizacion/roles/
└── types.ts                      # ✅ Tipos + Plantillas de roles
```

### Funcionalidades Implementadas

1. **PermisosCargoSubTab**
   - Tabla de cargos con conteo de permisos
   - Filtros por nivel jerárquico y búsqueda
   - Modal de edición con árbol de permisos expandible
   - Checkboxes por módulo con selección múltiple

2. **RolesAdicionalesSubTab**
   - Plantillas sugeridas (cards colapsables)
   - Tabla de roles con filtros por tipo
   - Modal crear/editar rol
   - Modal asignar rol a usuario (con certificación)
   - Badges por tipo de rol y estado

3. **TodosPermisosSubTab**
   - 68 permisos organizados por módulo
   - Filtros por módulo y acción
   - Estadísticas por tipo de acción
   - Leyenda de alcances (OWN, TEAM, ALL)

---

## Pasos de Implementación

### Fase 1: Backend - Modelos (4-6 horas)

1. Crear migración `0019_add_roles_adicionales.py`
   - Modelo `RolAdicional`
   - Modelo `RolAdicionalPermiso`
   - Modelo `UserRolAdicional`
   - Campo `User.roles_adicionales`

2. Agregar métodos a `User`:
   - `get_permisos_efectivos()`
   - `tiene_rol_adicional(rol_code)`
   - `get_roles_adicionales_validos()`

3. Modificar `User.has_permission()` para incluir roles adicionales

### Fase 2: Backend - API (3-4 horas)

1. Crear `RolAdicionalViewSet` con:
   - CRUD completo
   - Filtros por tipo
   - Acción `sugeridos`
   - Acción `usuarios`

2. Crear serializers:
   - `RolAdicionalListSerializer`
   - `RolAdicionalDetailSerializer`
   - `AsignarRolUsuarioSerializer`

3. Registrar rutas en `urls.py`

### Fase 3: Backend - Seed Data (1-2 horas)

1. Crear comando `init_roles_sugeridos.py`
2. Definir 14 roles legales y de gestión
3. Mapear permisos existentes a cada rol

### Fase 4: Frontend - Conexión API (2-3 horas)

1. Crear hooks:
   - `useRolesAdicionales.ts`
   - `useCargosPermisos.ts`
   - `usePermisosAgrupados.ts`

2. Reemplazar datos MOCK con llamadas a API
3. Conectar formularios con mutaciones

### Fase 5: Testing y QA (2-3 horas)

1. Tests unitarios de modelos
2. Tests de API endpoints
3. Tests de permisos
4. Pruebas manuales de UI

---

## Estimación Total

| Fase | Tiempo Estimado |
|------|-----------------|
| Backend - Modelos | 4-6 horas |
| Backend - API | 3-4 horas |
| Backend - Seed | 1-2 horas |
| Frontend - API | 2-3 horas |
| Testing | 2-3 horas |
| **TOTAL** | **12-18 horas** |

---

## Archivos a Modificar/Crear

### Backend

- `backend/apps/core/models.py` - Agregar RolAdicional, modificar User
- `backend/apps/core/migrations/0019_*.py` - Nueva migración
- `backend/apps/core/serializers_rbac.py` - Nuevos serializers
- `backend/apps/core/viewsets_rbac.py` - Nuevo ViewSet
- `backend/apps/core/urls.py` - Registrar rutas
- `backend/apps/core/management/commands/init_roles_sugeridos.py` - Comando seed

### Frontend (Ya Creados)

- `frontend/src/features/gestion-estrategica/components/rbac/PermisosCargoSubTab.tsx` ✅
- `frontend/src/features/gestion-estrategica/components/rbac/RolesAdicionalesSubTab.tsx` ✅
- `frontend/src/features/gestion-estrategica/components/rbac/TodosPermisosSubTab.tsx` ✅
- `frontend/src/features/gestion-estrategica/components/rbac/index.ts` ✅

### Frontend (Pendientes)

- `frontend/src/features/gestion-estrategica/hooks/useRolesAdicionales.ts`
- `frontend/src/features/gestion-estrategica/api/rolesApi.ts`

---

## Compatibilidad

- ✅ 100% retrocompatible con sistema actual
- ✅ No rompe permisos existentes
- ✅ Implementación incremental posible
- ✅ Datos de seed idempotentes

---

## Próximos Pasos Inmediatos

1. **Revisar este plan** con el equipo
2. **Crear migración** de modelos en backend
3. **Ejecutar migración** en ambiente de desarrollo
4. **Crear ViewSet** y serializers
5. **Conectar frontend** con API real
6. **Crear comando seed** de roles sugeridos
7. **Testing** completo del flujo

---

*Documento generado el 15/12/2024*
