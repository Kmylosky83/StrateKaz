# GUÍA PRÁCTICA - SISTEMA DE MÓDULOS Y FEATURES

**Para**: Desarrolladores, DevOps, Administradores
**Nivel**: Práctico (paso a paso)
**Actualizado**: 2026-01-18

---

## 📚 ÍNDICE

1. [Agregar un Nuevo Módulo](#1-agregar-un-nuevo-módulo)
2. [Asignar Permisos RBAC](#2-asignar-permisos-rbac)
3. [Verificar Configuración](#3-verificar-configuración)
4. [Troubleshooting Común](#4-troubleshooting-común)
5. [Queries SQL Útiles](#5-queries-sql-útiles)
6. [Testing y QA](#6-testing-y-qa)

---

## 1. AGREGAR UN NUEVO MÓDULO

### Escenario: Crear módulo "Gestión de Proyectos"

#### Paso 1: Crear en Base de Datos

**Opción A: Via Django Admin** (Visual)

```
1. Ir a: http://localhost:8000/admin/core/systemmodule/add/
2. Llenar formulario:
   - Code: gestion_proyectos
   - Name: Gestión de Proyectos
   - Category: MOTOR
   - Icon: Folders
   - Color: teal (opcional, usa default de categoría)
   - Is enabled: ✓
   - Is core: ☐ (dejar sin marcar)
   - Order: 15
3. Guardar
```

**Opción B: Via Management Command** (Recomendado para producción)

```python
# backend/apps/core/management/commands/add_gestion_proyectos.py

from django.core.management.base import BaseCommand
from apps.core.models import SystemModule, ModuleTab, TabSection

class Command(BaseCommand):
    help = 'Agrega módulo de Gestión de Proyectos'

    def handle(self, *args, **options):
        # 1. Crear módulo
        module, created = SystemModule.objects.get_or_create(
            code='gestion_proyectos',
            defaults={
                'name': 'Gestión de Proyectos',
                'category': 'MOTOR',
                'icon': 'Folders',
                'is_core': False,
                'is_enabled': True,
                'orden': 15,
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f'✅ Módulo creado: {module.name}'))
        else:
            self.stdout.write(self.style.WARNING(f'⚠️ Módulo ya existe: {module.name}'))

        # 2. Crear tabs
        portafolio_tab, created = ModuleTab.objects.get_or_create(
            module=module,
            code='portafolio',
            defaults={
                'name': 'Portafolio',
                'icon': 'FolderKanban',
                'orden': 1,
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f'  ✅ Tab creado: {portafolio_tab.name}'))

        # 3. Crear secciones
        sections = [
            {
                'code': 'proyectos_activos',
                'name': 'Proyectos Activos',
                'icon': 'PlayCircle',
                'orden': 1,
            },
            {
                'code': 'proyectos_cerrados',
                'name': 'Proyectos Cerrados',
                'icon': 'CheckCircle',
                'orden': 2,
            },
            {
                'code': 'recursos',
                'name': 'Recursos',
                'icon': 'Users',
                'orden': 3,
            },
        ]

        for sec_data in sections:
            section, created = TabSection.objects.get_or_create(
                tab=portafolio_tab,
                code=sec_data['code'],
                defaults={
                    'name': sec_data['name'],
                    'icon': sec_data['icon'],
                    'orden': sec_data['orden'],
                }
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f'    ✅ Sección creada: {section.name}'))

        self.stdout.write(self.style.SUCCESS('🎉 Estructura completa creada!'))
```

**Ejecutar**:
```bash
python manage.py add_gestion_proyectos
```

**Output esperado**:
```
✅ Módulo creado: Gestión de Proyectos
  ✅ Tab creado: Portafolio
    ✅ Sección creada: Proyectos Activos
    ✅ Sección creada: Proyectos Cerrados
    ✅ Sección creada: Recursos
🎉 Estructura completa creada!
```

---

#### Paso 2: Crear Componentes Frontend

**Estructura de directorios**:

```
frontend/src/features/gestion-proyectos/
├── components/
│   ├── PortafolioTab.tsx
│   ├── ProyectosActivosSection.tsx
│   ├── ProyectosCerradosSection.tsx
│   └── RecursosSection.tsx
├── hooks/
│   ├── useProyectos.ts
│   └── useRecursos.ts
├── types/
│   └── proyectos.types.ts
├── api/
│   └── proyectosApi.ts
└── pages/
    └── ProyectosPage.tsx
```

**Ejemplo: ProyectosActivosSection.tsx**

```typescript
// frontend/src/features/gestion-proyectos/components/ProyectosActivosSection.tsx

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Card, EmptyState } from '@/components/common';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';
import { useProyectos } from '../hooks/useProyectos';

export const ProyectosActivosSection = () => {
  const { canDo } = usePermissions();

  // ✅ RBAC Integration
  const canCreate = canDo(Modules.GESTION_PROYECTOS, Sections.PROYECTOS_ACTIVOS, 'create');
  const canEdit = canDo(Modules.GESTION_PROYECTOS, Sections.PROYECTOS_ACTIVOS, 'edit');

  const { data: proyectos, isLoading } = useProyectos({ estado: 'ACTIVO' });

  if (isLoading) {
    return <div>Cargando proyectos...</div>;
  }

  if (!proyectos || proyectos.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="No hay proyectos activos"
        description="Comienza creando tu primer proyecto"
        action={
          canCreate ? (
            <Button variant="primary">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proyecto
            </Button>
          ) : null
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Proyectos Activos</h2>
        {canCreate && (
          <Button variant="primary">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proyecto
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {proyectos.map((proyecto) => (
          <Card key={proyecto.id}>
            <h3>{proyecto.nombre}</h3>
            <p>{proyecto.descripcion}</p>
            {/* ... */}
          </Card>
        ))}
      </div>
    </div>
  );
};
```

---

#### Paso 3: Registrar en Constants

```typescript
// frontend/src/constants/permissions.ts

export const Modules = {
  // ... existentes
  GESTION_ESTRATEGICA: 'gestion_estrategica',
  HSEQ: 'hseq',
  // ✅ Agregar nuevo
  GESTION_PROYECTOS: 'gestion_proyectos',
} as const;

export const Sections = {
  // ... existentes
  IDENTIDAD_CORPORATIVA: 'identidad_corporativa',
  POLITICAS: 'politicas',
  // ✅ Agregar nuevos
  PROYECTOS_ACTIVOS: 'proyectos_activos',
  PROYECTOS_CERRADOS: 'proyectos_cerrados',
  RECURSOS: 'recursos',
} as const;
```

---

#### Paso 4: Agregar Página y Ruta

```typescript
// frontend/src/features/gestion-proyectos/pages/ProyectosPage.tsx

import { usePageHeader } from '@/hooks/usePageHeader';
import { PortafolioTab } from '../components/PortafolioTab';

export const ProyectosPage = () => {
  const { activeSection, searchQuery } = usePageHeader({
    moduleCode: 'gestion_proyectos',
    tabCode: 'portafolio',
    moduleColor: 'teal',
    searchEnabled: true,
    searchPlaceholder: 'Buscar proyectos...',
  });

  return (
    <div className="space-y-4">
      <PortafolioTab activeSection={activeSection} searchQuery={searchQuery} />
    </div>
  );
};
```

**Registrar ruta**:

```typescript
// frontend/src/App.tsx o routes.tsx

import { ProyectosPage } from '@/features/gestion-proyectos/pages/ProyectosPage';

// En las rutas:
<Route path="/gestion-proyectos" element={<ProyectosPage />} />
```

---

## 2. ASIGNAR PERMISOS RBAC

### Escenario: Dar permisos a diferentes cargos

#### Opción A: Via Django Admin

```
1. Ir a: http://localhost:8000/admin/core/cargosectionaccess/add/

2. Para cada cargo:

   GERENTE (puede todo):
   - Cargo: Gerente
   - Section: Proyectos Activos
   - can_view: ✓
   - can_create: ✓
   - can_edit: ✓
   - can_delete: ✓

   PROJECT MANAGER (puede crear y editar):
   - Cargo: Project Manager
   - Section: Proyectos Activos
   - can_view: ✓
   - can_create: ✓
   - can_edit: ✓
   - can_delete: ☐

   COLABORADOR (solo lectura):
   - Cargo: Colaborador
   - Section: Proyectos Activos
   - can_view: ✓
   - can_create: ☐
   - can_edit: ☐
   - can_delete: ☐
```

#### Opción B: Via SQL Script (Masivo)

```sql
-- script/assign_permissions_proyectos.sql

-- Obtener IDs de secciones
DO $$
DECLARE
    section_proyectos_activos INT;
    section_proyectos_cerrados INT;
    section_recursos INT;
BEGIN
    -- Buscar section IDs
    SELECT id INTO section_proyectos_activos
    FROM core_tab_section WHERE code = 'proyectos_activos';

    SELECT id INTO section_proyectos_cerrados
    FROM core_tab_section WHERE code = 'proyectos_cerrados';

    SELECT id INTO section_recursos
    FROM core_tab_section WHERE code = 'recursos';

    -- GERENTE: Full access
    INSERT INTO core_cargo_section_access (cargo_id, section_id, can_view, can_create, can_edit, can_delete)
    SELECT c.id, section_proyectos_activos, true, true, true, true
    FROM configuracion_cargo c
    WHERE c.code = 'gerente'
    ON CONFLICT (cargo_id, section_id) DO UPDATE
    SET can_view = true, can_create = true, can_edit = true, can_delete = true;

    -- PROJECT MANAGER: Crear y editar
    INSERT INTO core_cargo_section_access (cargo_id, section_id, can_view, can_create, can_edit, can_delete)
    SELECT c.id, section_proyectos_activos, true, true, true, false
    FROM configuracion_cargo c
    WHERE c.code = 'project_manager'
    ON CONFLICT (cargo_id, section_id) DO UPDATE
    SET can_view = true, can_create = true, can_edit = true, can_delete = false;

    -- COLABORADOR: Solo lectura
    INSERT INTO core_cargo_section_access (cargo_id, section_id, can_view, can_create, can_edit, can_delete)
    SELECT c.id, section_proyectos_activos, true, false, false, false
    FROM configuracion_cargo c
    WHERE c.code = 'colaborador'
    ON CONFLICT (cargo_id, section_id) DO UPDATE
    SET can_view = true, can_create = false, can_edit = false, can_delete = false;

    RAISE NOTICE 'Permisos asignados correctamente';
END $$;
```

**Ejecutar**:
```bash
psql -U postgres -d stratekaz_db -f script/assign_permissions_proyectos.sql
```

---

## 3. VERIFICAR CONFIGURACIÓN

### Checklist de Verificación

```bash
# 1. Verificar módulo en BD
psql -U postgres -d stratekaz_db -c "
  SELECT id, code, name, category, is_enabled
  FROM core_system_module
  WHERE code = 'gestion_proyectos';
"
# Output esperado:
# id | code                | name                  | category | is_enabled
# ----+---------------------+-----------------------+----------+-----------
# 15 | gestion_proyectos   | Gestión de Proyectos  | MOTOR    | t

# 2. Verificar tabs
psql -U postgres -d stratekaz_db -c "
  SELECT t.id, t.code, t.name
  FROM core_module_tab t
  WHERE t.module_id = 15;
"
# Output esperado:
# id | code        | name
# ----+-------------+-----------
# 42 | portafolio  | Portafolio

# 3. Verificar secciones
psql -U postgres -d stratekaz_db -c "
  SELECT s.id, s.code, s.name
  FROM core_tab_section s
  WHERE s.tab_id = 42;
"
# Output esperado:
# id  | code                 | name
# ----+----------------------+-------------------
# 156 | proyectos_activos    | Proyectos Activos
# 157 | proyectos_cerrados   | Proyectos Cerrados
# 158 | recursos             | Recursos

# 4. Verificar permisos
psql -U postgres -d stratekaz_db -c "
  SELECT c.name AS cargo, s.name AS seccion,
         csa.can_view, csa.can_create, csa.can_edit, csa.can_delete
  FROM core_cargo_section_access csa
  JOIN configuracion_cargo c ON c.id = csa.cargo_id
  JOIN core_tab_section s ON s.id = csa.section_id
  WHERE s.code = 'proyectos_activos'
  ORDER BY c.name;
"
# Output esperado:
# cargo           | seccion            | can_view | can_create | can_edit | can_delete
# ----------------+--------------------+----------+------------+----------+-----------
# Colaborador     | Proyectos Activos  | t        | f          | f        | f
# Gerente         | Proyectos Activos  | t        | t          | t        | t
# Project Manager | Proyectos Activos  | t        | t          | t        | f
```

---

### Verificar en Frontend

#### 1. Árbol de Módulos (API)

```bash
# Con token de usuario autenticado
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/core/system-modules/tree/ | jq '.modules[] | select(.code=="gestion_proyectos")'
```

**Output esperado**:
```json
{
  "id": 15,
  "code": "gestion_proyectos",
  "name": "Gestión de Proyectos",
  "category": "MOTOR",
  "is_enabled": true,
  "tabs": [
    {
      "id": 42,
      "code": "portafolio",
      "name": "Portafolio",
      "is_enabled": true,
      "sections": [
        {
          "id": 156,
          "code": "proyectos_activos",
          "name": "Proyectos Activos",
          "is_enabled": true
        },
        // ...
      ]
    }
  ]
}
```

#### 2. Sidebar (Navegación)

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/core/system-modules/sidebar/ | jq '.[] | select(.code=="gestion_proyectos")'
```

**Output esperado**:
```json
{
  "code": "gestion_proyectos",
  "name": "Gestión de Proyectos",
  "icon": "Folders",
  "color": "teal",
  "route": "/gestion-proyectos",
  "children": [
    {
      "code": "portafolio",
      "name": "Portafolio",
      "route": "/gestion-proyectos/portafolio"
    }
  ]
}
```

#### 3. Verificar en UI

```
1. Login con usuario (ej: gerente@empresa.com)
2. Ir a Sidebar → Debería aparecer "Gestión de Proyectos"
3. Click → Debería abrir /gestion-proyectos
4. Verificar secciones en sub-navegación
5. Ir a Configuración → Tab "Módulos"
   - Verificar que aparece "Gestión de Proyectos" en categoría MOTOR
   - Switch debería estar ON
```

---

## 4. TROUBLESHOOTING COMÚN

### Problema 1: Módulo no aparece en Sidebar

**Síntomas**:
- Módulo existe en BD
- is_enabled = true
- Pero no aparece en sidebar

**Diagnóstico**:
```sql
-- Verificar permisos del usuario
SELECT u.email, c.name AS cargo
FROM auth_user u
LEFT JOIN configuracion_cargo c ON c.id = u.cargo_id
WHERE u.email = 'usuario@empresa.com';

-- Verificar CargoSectionAccess
SELECT s.code AS seccion, csa.can_view
FROM core_cargo_section_access csa
JOIN core_tab_section s ON s.id = csa.section_id
WHERE csa.cargo_id = (
  SELECT cargo_id FROM auth_user WHERE email = 'usuario@empresa.com'
)
AND s.tab_id IN (
  SELECT id FROM core_module_tab WHERE module_id = 15
);
```

**Soluciones**:

1. **Usuario no tiene cargo**: Asignar cargo
   ```sql
   UPDATE auth_user
   SET cargo_id = (SELECT id FROM configuracion_cargo WHERE code = 'colaborador')
   WHERE email = 'usuario@empresa.com';
   ```

2. **Cargo no tiene permisos**: Agregar `CargoSectionAccess`
   ```sql
   INSERT INTO core_cargo_section_access (cargo_id, section_id, can_view)
   SELECT u.cargo_id, s.id, true
   FROM auth_user u, core_tab_section s
   WHERE u.email = 'usuario@empresa.com'
   AND s.code = 'proyectos_activos';
   ```

3. **Cache del navegador**: Forzar refetch
   ```javascript
   // En DevTools Console
   localStorage.clear();
   window.location.reload();
   ```

---

### Problema 2: Switch no responde en ConfiguracionTab

**Síntomas**:
- Click en switch no hace nada
- Switch parece deshabilitado

**Diagnóstico**:
```typescript
// En ConfiguracionTab.tsx, agregar console.log
const canEditModules = canDo(Modules.GESTION_ESTRATEGICA, Sections.MODULOS, 'edit');
console.log('🔐 canEditModules:', canEditModules);
console.log('⚙️ module:', module);
console.log('🚫 disabled:', !canEditModules || module.is_core || isPending);
```

**Causas comunes**:

1. **Usuario no tiene permiso de edición**:
   ```sql
   SELECT can_edit FROM core_cargo_section_access csa
   JOIN core_tab_section s ON s.id = csa.section_id
   WHERE s.code = 'modulos'
   AND csa.cargo_id = (SELECT cargo_id FROM auth_user WHERE id = <user_id>);
   -- Si can_edit = false → Usuario no puede editar
   ```

2. **Módulo es core**:
   ```sql
   SELECT is_core FROM core_system_module WHERE id = <module_id>;
   -- Si is_core = true → No se puede desactivar
   ```

3. **Mutation pendiente**: Esperar a que termine request anterior

---

### Problema 3: Error 400 al desactivar módulo

**Mensaje**: "Los siguientes módulos dependen de este: X, Y, Z"

**Diagnóstico**:
```sql
-- Identificar dependencias
SELECT m2.name AS modulo_dependiente, m2.is_enabled
FROM core_system_module m1
JOIN core_system_module_dependencies md ON md.from_systemmodule_id = m1.id
JOIN core_system_module m2 ON m2.id = md.to_systemmodule_id
WHERE m1.code = '<codigo_modulo>'
AND m2.is_enabled = true;
```

**Solución**:
Desactivar módulos dependientes primero (en orden inverso):

```python
# Script para desactivar en cascada
from apps.core.models import SystemModule

module = SystemModule.objects.get(code='mi_modulo')

# 1. Listar dependents
dependents = module.dependents.filter(is_enabled=True)
print(f"Dependientes activos: {[d.name for d in dependents]}")

# 2. Desactivar dependents primero
for dep in dependents:
    dep.is_enabled = False
    dep.save()
    print(f"✓ Desactivado: {dep.name}")

# 3. Ahora sí desactivar el módulo
module.is_enabled = False
module.save()
print(f"✓ Desactivado: {module.name}")
```

---

## 5. QUERIES SQL ÚTILES

### Ver estructura completa de un módulo

```sql
SELECT
  m.code AS modulo,
  m.name AS modulo_nombre,
  m.is_enabled AS modulo_activo,
  t.code AS tab,
  t.name AS tab_nombre,
  t.is_enabled AS tab_activo,
  s.code AS seccion,
  s.name AS seccion_nombre,
  s.is_enabled AS seccion_activa
FROM core_system_module m
LEFT JOIN core_module_tab t ON t.module_id = m.id
LEFT JOIN core_tab_section s ON s.tab_id = t.id
WHERE m.code = 'gestion_proyectos'
ORDER BY t.orden, s.orden;
```

---

### Ver permisos de un usuario específico

```sql
SELECT
  m.name AS modulo,
  t.name AS tab,
  s.name AS seccion,
  csa.can_view AS ver,
  csa.can_create AS crear,
  csa.can_edit AS editar,
  csa.can_delete AS eliminar
FROM auth_user u
JOIN configuracion_cargo c ON c.id = u.cargo_id
JOIN core_cargo_section_access csa ON csa.cargo_id = c.id
JOIN core_tab_section s ON s.id = csa.section_id
JOIN core_module_tab t ON t.id = s.tab_id
JOIN core_system_module m ON m.id = t.module_id
WHERE u.email = 'usuario@empresa.com'
ORDER BY m.orden, t.orden, s.orden;
```

---

### Identificar módulos sin permisos asignados

```sql
-- Secciones que no tienen permisos para ningún cargo
SELECT
  m.name AS modulo,
  t.name AS tab,
  s.name AS seccion,
  COUNT(csa.id) AS permisos_asignados
FROM core_tab_section s
JOIN core_module_tab t ON t.id = s.tab_id
JOIN core_system_module m ON m.id = t.module_id
LEFT JOIN core_cargo_section_access csa ON csa.section_id = s.id
GROUP BY m.name, t.name, s.name
HAVING COUNT(csa.id) = 0
ORDER BY m.name, t.name, s.name;
```

---

### Módulos habilitados vs deshabilitados

```sql
SELECT
  category,
  COUNT(*) AS total,
  SUM(CASE WHEN is_enabled THEN 1 ELSE 0 END) AS habilitados,
  SUM(CASE WHEN NOT is_enabled THEN 1 ELSE 0 END) AS deshabilitados
FROM core_system_module
GROUP BY category
ORDER BY category;
```

---

## 6. TESTING Y QA

### Test Suite para Nuevo Módulo

#### 1. Test Backend (Django)

```python
# backend/apps/gestion_proyectos/tests/test_permisos.py

from django.test import TestCase
from rest_framework.test import APIClient
from apps.core.models import CargoSectionAccess, SystemModule, ModuleTab, TabSection
from apps.configuracion.models import Cargo
from django.contrib.auth import get_user_model

User = get_user_model()

class ProyectosPermisosTest(TestCase):
    def setUp(self):
        # Crear módulo
        self.module = SystemModule.objects.create(
            code='gestion_proyectos',
            name='Gestión de Proyectos',
            category='MOTOR',
        )

        # Crear tab
        self.tab = ModuleTab.objects.create(
            module=self.module,
            code='portafolio',
            name='Portafolio',
        )

        # Crear sección
        self.section = TabSection.objects.create(
            tab=self.tab,
            code='proyectos_activos',
            name='Proyectos Activos',
        )

        # Crear cargos
        self.cargo_gerente = Cargo.objects.create(
            code='gerente',
            name='Gerente',
        )

        self.cargo_colaborador = Cargo.objects.create(
            code='colaborador',
            name='Colaborador',
        )

        # Crear usuarios
        self.user_gerente = User.objects.create_user(
            email='gerente@test.com',
            password='test123',
            cargo=self.cargo_gerente,
        )

        self.user_colaborador = User.objects.create_user(
            email='colaborador@test.com',
            password='test123',
            cargo=self.cargo_colaborador,
        )

        # Asignar permisos
        CargoSectionAccess.objects.create(
            cargo=self.cargo_gerente,
            section=self.section,
            can_view=True,
            can_create=True,
            can_edit=True,
            can_delete=True,
        )

        CargoSectionAccess.objects.create(
            cargo=self.cargo_colaborador,
            section=self.section,
            can_view=True,
            can_create=False,
            can_edit=False,
            can_delete=False,
        )

        self.client = APIClient()

    def test_sidebar_filtrado_gerente(self):
        """Gerente debe ver Gestión de Proyectos en sidebar"""
        self.client.force_authenticate(user=self.user_gerente)
        response = self.client.get('/api/core/system-modules/sidebar/')

        self.assertEqual(response.status_code, 200)
        modules = [m['code'] for m in response.data]
        self.assertIn('gestion_proyectos', modules)

    def test_sidebar_filtrado_colaborador(self):
        """Colaborador también debe verlo (tiene can_view)"""
        self.client.force_authenticate(user=self.user_colaborador)
        response = self.client.get('/api/core/system-modules/sidebar/')

        self.assertEqual(response.status_code, 200)
        modules = [m['code'] for m in response.data]
        self.assertIn('gestion_proyectos', modules)

    def test_crear_proyecto_gerente_ok(self):
        """Gerente puede crear proyectos"""
        self.client.force_authenticate(user=self.user_gerente)
        response = self.client.post(
            '/api/gestion-proyectos/proyectos/',
            {'nombre': 'Proyecto Test', 'descripcion': 'Test'}
        )

        self.assertEqual(response.status_code, 201)

    def test_crear_proyecto_colaborador_denied(self):
        """Colaborador NO puede crear proyectos"""
        self.client.force_authenticate(user=self.user_colaborador)
        response = self.client.post(
            '/api/gestion-proyectos/proyectos/',
            {'nombre': 'Proyecto Test', 'descripcion': 'Test'}
        )

        self.assertEqual(response.status_code, 403)
```

**Ejecutar**:
```bash
python manage.py test apps.gestion_proyectos.tests.test_permisos
```

---

#### 2. Test Frontend (React Testing Library)

```typescript
// frontend/src/features/gestion-proyectos/__tests__/ProyectosActivosSection.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProyectosActivosSection } from '../components/ProyectosActivosSection';
import { usePermissions } from '@/hooks/usePermissions';
import { useProyectos } from '../hooks/useProyectos';

jest.mock('@/hooks/usePermissions');
jest.mock('../hooks/useProyectos');

describe('ProyectosActivosSection', () => {
  it('should show "Nuevo Proyecto" button if user has can_create', () => {
    (usePermissions as jest.Mock).mockReturnValue({
      canDo: (module: string, section: string, action: string) =>
        action === 'create' ? true : false,
    });

    (useProyectos as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<ProyectosActivosSection />);

    expect(screen.getByText('Nuevo Proyecto')).toBeInTheDocument();
  });

  it('should NOT show "Nuevo Proyecto" button if user lacks can_create', () => {
    (usePermissions as jest.Mock).mockReturnValue({
      canDo: () => false,
    });

    (useProyectos as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<ProyectosActivosSection />);

    expect(screen.queryByText('Nuevo Proyecto')).not.toBeInTheDocument();
  });

  it('should render list of proyectos', () => {
    (usePermissions as jest.Mock).mockReturnValue({
      canDo: () => true,
    });

    (useProyectos as jest.Mock).mockReturnValue({
      data: [
        { id: 1, nombre: 'Proyecto A', descripcion: 'Desc A' },
        { id: 2, nombre: 'Proyecto B', descripcion: 'Desc B' },
      ],
      isLoading: false,
    });

    render(<ProyectosActivosSection />);

    expect(screen.getByText('Proyecto A')).toBeInTheDocument();
    expect(screen.getByText('Proyecto B')).toBeInTheDocument();
  });
});
```

**Ejecutar**:
```bash
npm test -- ProyectosActivosSection.test.tsx
```

---

### Checklist de QA

```
□ Backend:
  □ Módulo existe en BD (SELECT * FROM core_system_module WHERE code='...')
  □ Tabs creados (SELECT * FROM core_module_tab WHERE module_id=...)
  □ Secciones creadas (SELECT * FROM core_tab_section WHERE tab_id=...)
  □ Permisos asignados a cargos (SELECT * FROM core_cargo_section_access)

□ API:
  □ GET /api/core/system-modules/tree/ retorna módulo
  □ GET /api/core/system-modules/sidebar/ retorna módulo (si user tiene permisos)
  □ PATCH /api/core/system-modules/{id}/toggle/ funciona

□ Frontend:
  □ Módulo aparece en Sidebar
  □ Ruta /gestion-proyectos funciona
  □ Secciones aparecen en sub-navegación
  □ RBAC: botones de crear/editar según permisos
  □ usePermissions() retorna valores correctos
  □ Empty states si no hay datos

□ UI/UX:
  □ Iconos se muestran correctamente
  □ Colores de categoría aplicados
  □ Loading states durante fetch
  □ Error states si falla API
  □ Toast de confirmación en acciones

□ RBAC:
  □ Gerente: puede todo
  □ Project Manager: puede crear/editar
  □ Colaborador: solo lectura
  □ Sin cargo: no ve el módulo

□ Configuración:
  □ Módulo aparece en Configuración > Módulos
  □ Switch funciona (activar/desactivar)
  □ No se puede desactivar si is_core=true
  □ Al desactivar, desaparece del Sidebar
```

---

## 🎯 CONCLUSIÓN

Esta guía cubre el flujo completo de **agregar un nuevo módulo** al sistema StrateKaz:

1. ✅ Crear estructura en BD (Management Command recomendado)
2. ✅ Crear componentes Frontend (RBAC-aware)
3. ✅ Registrar en constants y rutas
4. ✅ Asignar permisos por cargo
5. ✅ Verificar en API y UI
6. ✅ Troubleshooting común
7. ✅ Testing completo

**Tiempo estimado**: 4-6 horas (primera vez), 1-2 horas (con experiencia)

---

**Documentos Relacionados**:
- `/docs/AUDITORIA_SISTEMA_MODULOS_FEATURES.md` - Análisis completo
- `/docs/DIAGRAMA_FLUJO_MODULOS.md` - Diagramas de flujo
- `/docs/RESUMEN_EJECUTIVO_MODULOS.md` - Resumen ejecutivo

**Última Actualización**: 2026-01-18
