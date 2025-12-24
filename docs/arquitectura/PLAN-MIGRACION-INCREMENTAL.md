# Plan de Migración Incremental del ERP - Sin Romper Funcionalidad

## Contexto del Sistema

### Estado Actual
- **6 niveles jerárquicos** de organización
- **14 módulos funcionales** (Dirección Estratégica, Supply Chain, etc.)
- **81 apps Django** distribuidas
- **154 tablas** en base de datos MySQL
- **Sistema funcionando en producción**

### Objetivo de la Migración
Consolidar la arquitectura de 81 apps dispersas a una estructura modular de ~14 apps organizadas por dominio de negocio, **sin romper funcionalidad existente** en ningún momento.

---

## Módulos a PRESERVAR (NO MIGRAR)

Estos módulos ya están bien estructurados y funcionando correctamente:

```
✅ apps/core/                                    # RBAC, Auth JWT, User
✅ apps/gestion_estrategica/organizacion/       # Areas, Cargos, Consecutivos
✅ apps/gestion_estrategica/configuracion/      # Parámetros del sistema
✅ Sistema de navegación dinámica               # menuConfig.ts
✅ Autenticación JWT                            # SimpleJWT funcionando
```

**RAZÓN:** Estos módulos son la base crítica del sistema y ya siguen la arquitectura objetivo.

---

## Resumen de Fases

| Fase | Duración | Riesgo | Rollback |
|------|----------|--------|----------|
| **Fase 0: Preparación** | 2 días | Bajo | N/A |
| **Fase 1: Estructura Base** | 3 días | Bajo | Git revert |
| **Fase 2: Módulos Simples** | 5 días | Medio | Script rollback |
| **Fase 3: Fusión Módulos** | 7 días | Alto | Snapshot DB |
| **Fase 4: Refactorización Dinámica** | 10 días | Muy Alto | Rollback completo |
| **Fase 5: Integración y Testing** | 5 días | Medio | N/A |

**Duración total estimada:** 32 días (6.4 semanas)

---

# FASE 0: Preparación (2 días)

## Objetivos
- Crear snapshot completo del sistema actual
- Documentar dependencias entre módulos
- Establecer estrategia de rollback
- Preparar entorno de pruebas

## Tareas

### 0.1. Backup Completo

```bash
# Backup de base de datos
mysqldump -u root -p grasas_huesos_db > backup_pre_migracion_$(date +%Y%m%d).sql

# Backup de código
git tag -a "pre-migracion-v1.0.0" -m "Snapshot antes de migración incremental"
git push origin --tags

# Backup de migraciones
cp -r backend/apps/*/migrations/ backup_migrations_$(date +%Y%m%d)/
```

### 0.2. Análisis de Dependencias

Crear matriz de dependencias entre apps:

```python
# scripts/analizar_dependencias.py
"""
Analiza imports entre apps para detectar dependencias.
Genera grafo de dependencias.
"""

import ast
import os
from pathlib import Path

def analizar_dependencias(apps_path):
    dependencias = {}

    for app_dir in Path(apps_path).iterdir():
        if not app_dir.is_dir():
            continue

        app_name = app_dir.name
        dependencias[app_name] = set()

        # Buscar todos los archivos .py
        for py_file in app_dir.rglob("*.py"):
            with open(py_file, 'r', encoding='utf-8') as f:
                try:
                    tree = ast.parse(f.read())
                    for node in ast.walk(tree):
                        if isinstance(node, ast.ImportFrom):
                            if node.module and node.module.startswith('apps.'):
                                imported_app = node.module.split('.')[1]
                                if imported_app != app_name:
                                    dependencias[app_name].add(imported_app)
                except:
                    pass

    return dependencias

if __name__ == '__main__':
    deps = analizar_dependencias('backend/apps')

    print("MATRIZ DE DEPENDENCIAS")
    print("=" * 60)
    for app, imports in sorted(deps.items()):
        if imports:
            print(f"{app}:")
            for imp in sorted(imports):
                print(f"  → {imp}")
```

**Ejecutar:**
```bash
python scripts/analizar_dependencias.py > docs/DEPENDENCIAS-APPS.md
```

### 0.3. Documentar Estado Actual

Crear inventario completo:

```bash
# Contar modelos por app
find backend/apps -name "models.py" -exec wc -l {} \; > docs/INVENTARIO-MODELOS.txt

# Contar migraciones
find backend/apps -path "*/migrations/*.py" ! -name "__init__.py" | wc -l

# Listar tablas de BD
mysql -u root -p grasas_huesos_db -e "SHOW TABLES;" > docs/INVENTARIO-TABLAS.txt
```

### 0.4. Crear Entorno de Testing

```bash
# Crear branch específico
git checkout -b feat/migracion-incremental-fase0

# Copiar DB a DB de testing
mysqldump -u root -p grasas_huesos_db | mysql -u root -p grasas_huesos_db_test

# Actualizar .env.test
cat > backend/.env.test << EOF
DB_NAME=grasas_huesos_db_test
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=3306
DEBUG=True
EOF
```

## Validación de Fase 0

- [ ] Backup de BD creado y verificado
- [ ] Tag de Git creado
- [ ] Matriz de dependencias generada
- [ ] Inventario de modelos documentado
- [ ] Entorno de testing funcionando
- [ ] Tests existentes pasando: `pytest backend/`

## Rollback Plan
**No aplica** - Solo preparación, sin cambios en código.

---

# FASE 1: Estructura Base (3 días)

## Objetivos
- Crear estructura de carpetas del sistema objetivo
- Configurar namespaces sin romper imports existentes
- Mantener apps antiguas funcionando en paralelo

## Estrategia
**Duplicación temporal:** Las apps antiguas seguirán funcionando mientras se crea la nueva estructura en paralelo.

## 1.1. Crear Estructura de Directorios

```bash
cd backend/apps

# Crear módulo de Supply Chain
mkdir -p supply_chain/proveedores
mkdir -p supply_chain/programacion_abastec
mkdir -p supply_chain/recepciones
mkdir -p supply_chain/lotes

# Crear módulo de Gestión Estratégica (ya existe parcialmente)
# Solo añadir los que faltan
mkdir -p gestion_estrategica/direccion_estrategica

# Crear módulo de Certificaciones y Calidad
mkdir -p calidad_certificaciones/certificados

# Crear módulo de Reportes y Analytics
mkdir -p reportes_analytics/reportes

# Crear módulo de Unidades (logística)
mkdir -p logistica/unidades

# Crear módulo de Liquidaciones (financiero)
mkdir -p financiero/liquidaciones
```

## 1.2. Configurar __init__.py para Namespaces

Cada módulo padre debe tener su `__init__.py`:

```python
# backend/apps/supply_chain/__init__.py
"""
Supply Chain - Módulo de Gestión de Cadena de Suministro

Incluye:
- Proveedores y Ecoaliados
- Programación de Abastecimiento (Programaciones + Recolecciones + Liquidaciones)
- Recepciones
- Lotes
"""

# backend/apps/calidad_certificaciones/__init__.py
"""
Calidad y Certificaciones

Incluye:
- Certificados de calidad
- Auditorías
"""

# backend/apps/reportes_analytics/__init__.py
"""
Reportes y Analytics

Incluye:
- Reportes operacionales
- Dashboards
- Analytics
"""

# backend/apps/logistica/__init__.py
"""
Logística

Incluye:
- Unidades de transporte
- Rutas
"""

# backend/apps/financiero/__init__.py
"""
Financiero

Incluye:
- Liquidaciones
- Pagos
"""
```

## 1.3. Actualizar settings.py (SIN romper apps antiguas)

```python
# backend/config/settings.py

INSTALLED_APPS = [
    # Django apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'auditlog',
    'debug_toolbar',

    # Core (NO TOCAR)
    'apps.core',

    # Gestión Estratégica (NO TOCAR)
    'apps.gestion_estrategica.configuracion',
    'apps.gestion_estrategica.organizacion',
    'apps.gestion_estrategica.identidad',
    'apps.gestion_estrategica.planeacion',

    # ===== APPS ANTIGUAS (MANTENER DURANTE MIGRACIÓN) =====
    'apps.proveedores',           # → supply_chain.proveedores
    'apps.ecoaliados',            # → supply_chain.proveedores (fusionar)
    'apps.programaciones',        # → supply_chain.programacion_abastec
    'apps.recolecciones',         # → supply_chain.programacion_abastec
    'apps.liquidaciones',         # → supply_chain.programacion_abastec
    'apps.recepciones',           # → supply_chain.recepciones
    'apps.lotes',                 # → supply_chain.lotes
    'apps.certificados',          # → calidad_certificaciones.certificados
    'apps.reportes',              # → reportes_analytics.reportes
    'apps.unidades',              # → logistica.unidades

    # ===== APPS NUEVAS (SE AÑADIRÁN EN FASES 2-4) =====
    # 'apps.supply_chain.proveedores',
    # 'apps.supply_chain.programacion_abastec',
    # 'apps.supply_chain.recepciones',
    # 'apps.supply_chain.lotes',
    # 'apps.calidad_certificaciones.certificados',
    # 'apps.reportes_analytics.reportes',
    # 'apps.logistica.unidades',
    # 'apps.financiero.liquidaciones',
]
```

## 1.4. Crear README.md para cada módulo

```markdown
# backend/apps/supply_chain/README.md

# Supply Chain - Gestión de Cadena de Suministro

## Propósito
Gestión integral de proveedores, abastecimiento y recepción de materias primas.

## Sub-apps

### 1. proveedores/
Gestión de proveedores y ecoaliados (fusión de apps.proveedores + apps.ecoaliados)

**Modelos:**
- `Proveedor` (de apps.proveedores)
- `ContactoProveedor`
- `PrecioMateriaPrima`
- `HistorialPrecio`
- `Ecoaliado` (de apps.ecoaliados) → Integrar con Proveedor

### 2. programacion_abastec/
Programación de abastecimiento, recolecciones y liquidaciones

**Modelos:**
- `ProgramacionCompra` (de apps.programaciones)
- `Recoleccion` (de apps.recolecciones)
- `DetalleRecoleccion`
- `Liquidacion` (de apps.liquidaciones)

### 3. recepciones/
Recepción de materias primas en planta

**Modelos:**
- `Recepcion`
- `DetalleRecepcion`

### 4. lotes/
Gestión de lotes de producción

**Modelos:**
- `Lote`
- `MovimientoLote`

## Dependencias
- `apps.core` (User, permisos)
- `apps.gestion_estrategica.organizacion` (Areas, Consecutivos)

## Migración
Ver: `/docs/PLAN-MIGRACION-INCREMENTAL.md`
```

## 1.5. Tests de Integración

Crear tests para validar que la estructura no rompe nada:

```python
# backend/apps/supply_chain/tests/test_structure.py
"""
Tests de estructura - Fase 1
Valida que los directorios existen y están configurados correctamente.
"""
import os
from pathlib import Path
from django.test import TestCase

class StructureTestCase(TestCase):
    """Validar estructura de directorios"""

    def test_supply_chain_exists(self):
        """Validar que existe el módulo supply_chain"""
        path = Path(__file__).parent.parent
        self.assertTrue(path.exists())
        self.assertTrue((path / '__init__.py').exists())

    def test_submodules_exist(self):
        """Validar que existen los submódulos"""
        base = Path(__file__).parent.parent
        submodules = [
            'proveedores',
            'programacion_abastec',
            'recepciones',
            'lotes',
        ]

        for submodule in submodules:
            submodule_path = base / submodule
            self.assertTrue(
                submodule_path.exists(),
                f"Falta submódulo: {submodule}"
            )

    def test_old_apps_still_work(self):
        """Validar que apps antiguas siguen funcionando"""
        from apps.proveedores.models import Proveedor
        from apps.ecoaliados.models import Ecoaliado
        from apps.recolecciones.models import Recoleccion

        # Si los imports funcionan, las apps antiguas siguen OK
        self.assertTrue(True)
```

## Validación de Fase 1

- [ ] Estructura de directorios creada
- [ ] `__init__.py` en todos los módulos padre
- [ ] README.md en cada módulo
- [ ] settings.py actualizado (apps antiguas + comentarios de nuevas)
- [ ] Tests de estructura pasando
- [ ] Servidor de desarrollo arranca sin errores: `python manage.py runserver`
- [ ] Apps antiguas siguen funcionando en frontend

## Rollback Plan

```bash
# Si algo falla en Fase 1:
git checkout main
rm -rf backend/apps/supply_chain
rm -rf backend/apps/calidad_certificaciones
rm -rf backend/apps/reportes_analytics
rm -rf backend/apps/logistica
rm -rf backend/apps/financiero

# Restaurar settings.py
git checkout backend/config/settings.py
```

**Impacto:** Cero. Solo se crearon carpetas y archivos de configuración sin tocar apps existentes.

---

# FASE 2: Migrar Módulos Simples (5 días)

## Objetivos
- Migrar módulos con **pocas dependencias** primero
- Mantener apps antiguas funcionando en paralelo
- Usar aliases de importación para transición suave

## Módulos a Migrar (en orden)

### Prioridad 1: Módulos Independientes
1. **apps.certificados** → `supply_chain.certificados` (0 dependencias)
2. **apps.reportes** → `reportes_analytics.reportes` (solo lectura de otros módulos)
3. **apps.unidades** → `logistica.unidades` (0 dependencias críticas)

### Dependencias de estos módulos
```
certificados:
  ├─ core.User (✅ preservado)
  └─ gestion_estrategica.organizacion (✅ preservado)

reportes:
  ├─ core.User (✅ preservado)
  └─ Múltiples apps (solo lectura, no crítico)

unidades:
  └─ core.User (✅ preservado)
```

## 2.1. Migrar apps.certificados

### Paso 2.1.1: Copiar código a nueva ubicación

```bash
# Copiar (NO mover) app completa
cp -r backend/apps/certificados/ backend/apps/calidad_certificaciones/certificados/

# Verificar estructura
ls -la backend/apps/calidad_certificaciones/certificados/
# Debe contener: models.py, views.py, serializers.py, urls.py, etc.
```

### Paso 2.1.2: Actualizar imports en la nueva app

```python
# backend/apps/calidad_certificaciones/certificados/models.py

# ANTES:
# from apps.core.models import User

# DESPUÉS:
from apps.core.models import User  # ✅ Sin cambios, core está preservado

# Si había imports de otras apps (ej: proveedores):
# ANTES:
# from apps.proveedores.models import Proveedor

# DESPUÉS (temporal):
from apps.proveedores.models import Proveedor  # ✅ App antigua sigue existiendo
```

### Paso 2.1.3: Actualizar settings.py

```python
# backend/config/settings.py

INSTALLED_APPS = [
    # ... apps anteriores ...

    # Apps antiguas (MANTENER durante transición)
    'apps.certificados',           # ⚠️ Mantener temporalmente

    # Apps nuevas
    'apps.calidad_certificaciones.certificados',  # ✅ Nueva ubicación
]
```

### Paso 2.1.4: Crear migración de "squash"

**NO crear nuevas migraciones.** Usar las existentes.

```bash
# Copiar migraciones existentes
cp -r backend/apps/certificados/migrations/ \
      backend/apps/calidad_certificaciones/certificados/migrations/

# Verificar que Django las reconoce
python manage.py showmigrations calidad_certificaciones.certificados
```

### Paso 2.1.5: Actualizar URLs

```python
# backend/config/urls.py

from django.urls import path, include

urlpatterns = [
    # ... otras URLs ...

    # URLs antiguas (MANTENER temporalmente para compatibilidad)
    path('api/certificados/', include('apps.certificados.urls')),

    # URLs nuevas (AÑADIR en paralelo)
    path('api/v2/calidad/certificados/',
         include('apps.calidad_certificaciones.certificados.urls')),
]
```

### Paso 2.1.6: Actualizar frontend (transición gradual)

Opción A: Actualizar todos los endpoints de una vez
Opción B: Usar alias de importación temporal

```typescript
// frontend/src/services/certificados.service.ts

// ANTES:
const API_BASE = '/api/certificados';

// DESPUÉS (transición):
const API_BASE = import.meta.env.VITE_USE_NEW_API === 'true'
  ? '/api/v2/calidad/certificados'  // Nueva ubicación
  : '/api/certificados';             // Antigua (fallback)

// O directamente:
const API_BASE = '/api/v2/calidad/certificados';
```

### Paso 2.1.7: Tests

```python
# backend/apps/calidad_certificaciones/certificados/tests/test_migration.py
"""
Tests de migración - Certificados
Valida que la app migrada funciona igual que la antigua.
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from apps.core.models import User

class CertificadosMigrationTestCase(TestCase):
    """Validar que migración no rompe funcionalidad"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@test.com',
            password='test123'
        )
        self.client.force_authenticate(user=self.user)

    def test_old_endpoint_still_works(self):
        """Validar que endpoint antiguo sigue funcionando"""
        response = self.client.get('/api/certificados/')
        self.assertEqual(response.status_code, 200)

    def test_new_endpoint_works(self):
        """Validar que nuevo endpoint funciona"""
        response = self.client.get('/api/v2/calidad/certificados/')
        self.assertEqual(response.status_code, 200)

    def test_both_endpoints_return_same_data(self):
        """Validar que ambos endpoints retornan los mismos datos"""
        old_response = self.client.get('/api/certificados/')
        new_response = self.client.get('/api/v2/calidad/certificados/')

        self.assertEqual(
            old_response.data,
            new_response.data,
            "Los datos de ambos endpoints deben ser idénticos"
        )
```

### Paso 2.1.8: Validación y Rollback

```bash
# Ejecutar tests
python manage.py test apps.calidad_certificaciones.certificados

# Validar en dev
python manage.py runserver

# Probar endpoints
curl http://localhost:8000/api/certificados/          # Antiguo
curl http://localhost:8000/api/v2/calidad/certificados/  # Nuevo

# Si todo OK, commit
git add .
git commit -m "feat(migracion): Migrar certificados a calidad_certificaciones.certificados (Fase 2.1)"
```

**Rollback si falla:**
```bash
# Remover app nueva de settings.py
# Eliminar carpeta apps/calidad_certificaciones/certificados/
# git reset --hard HEAD~1
```

## 2.2. Migrar apps.reportes

Seguir el mismo proceso que 2.1:

1. Copiar a `reportes_analytics/reportes/`
2. Actualizar imports (sin cambios necesarios)
3. Añadir a INSTALLED_APPS
4. Copiar migraciones
5. Añadir URLs en paralelo: `/api/v2/analytics/reportes/`
6. Tests
7. Validación

## 2.3. Migrar apps.unidades

Seguir el mismo proceso:

1. Copiar a `logistica/unidades/`
2. Actualizar imports
3. Añadir a INSTALLED_APPS
4. Copiar migraciones
5. Añadir URLs en paralelo: `/api/v2/logistica/unidades/`
6. Tests
7. Validación

## Validación de Fase 2

- [ ] 3 módulos migrados y funcionando en paralelo
- [ ] Tests pasando para cada módulo migrado
- [ ] Endpoints antiguos funcionan
- [ ] Endpoints nuevos funcionan
- [ ] Frontend puede acceder a ambas versiones
- [ ] Sin errores en logs de Django

## Rollback Plan de Fase 2

```bash
# Script de rollback automático
cat > scripts/rollback_fase2.sh << 'EOF'
#!/bin/bash
echo "Iniciando rollback de Fase 2..."

# Restaurar settings.py
git checkout HEAD~3 -- backend/config/settings.py

# Restaurar urls.py
git checkout HEAD~3 -- backend/config/urls.py

# Eliminar apps migradas
rm -rf backend/apps/calidad_certificaciones/
rm -rf backend/apps/reportes_analytics/
rm -rf backend/apps/logistica/

# Reiniciar servidor
pkill -f "python manage.py runserver"

echo "Rollback completado. Apps antiguas restauradas."
EOF

chmod +x scripts/rollback_fase2.sh
```

---

# FASE 3: Fusionar Módulos Relacionados (7 días)

## Objetivos
- Fusionar apps relacionadas en una sola app cohesiva
- Mantener compatibilidad con código antiguo durante transición
- Migrar datos si es necesario

## Módulos a Fusionar

### 3.1. proveedores + ecoaliados → supply_chain.proveedores

**Análisis:**
- `apps.proveedores`: Proveedor (2190 líneas de models.py)
- `apps.ecoaliados`: Ecoaliado (351 líneas de models.py)

**Estrategia:** Fusionar en una sola app con múltiples modelos.

#### Paso 3.1.1: Análisis de Modelos

```python
# apps.proveedores.models
class Proveedor:
    codigo_interno     # ej: MP-001, PS-002
    nombre_comercial
    tipo_proveedor     # MATERIA_PRIMA, SERVICIO, INSUMO
    subtipo_materia    # HUESO, SEBO, CABEZAS, ACU
    # ... 50+ campos

class ContactoProveedor:
    proveedor (FK)
    nombre
    telefono
    email

class PrecioMateriaPrima:
    proveedor (FK)
    tipo_materia
    precio
    fecha_inicio
    # Historial de precios

# apps.ecoaliados.models
class Ecoaliado:
    codigo             # ej: ECO-001
    nombre
    tipo_ecoaliado     # CARNICERIA, MATADERO, RESTAURANTE
    # ... campos similares a Proveedor
```

**Decisión de diseño:**
- `Ecoaliado` es un tipo específico de `Proveedor`
- Fusionar en un solo modelo con campo `categoria`

#### Paso 3.1.2: Diseño del Modelo Unificado

```python
# backend/apps/supply_chain/proveedores/models.py
"""
Proveedores Unificados - Fusión de apps.proveedores + apps.ecoaliados
"""
from django.db import models
from django.conf import settings

class CategoriaProveedor(models.TextChoices):
    """
    Categorías de proveedores
    """
    MATERIA_PRIMA = 'MATERIA_PRIMA', 'Proveedor de Materia Prima'
    SERVICIO = 'SERVICIO', 'Proveedor de Servicios'
    INSUMO = 'INSUMO', 'Proveedor de Insumos'
    ECOALIADO = 'ECOALIADO', 'Ecoaliado'  # ✅ Nuevo: integración

class TipoEcoaliado(models.TextChoices):
    """
    Tipos específicos de ecoaliados (solo aplica si categoria=ECOALIADO)
    """
    CARNICERIA = 'CARNICERIA', 'Carnicería'
    MATADERO = 'MATADERO', 'Matadero'
    RESTAURANTE = 'RESTAURANTE', 'Restaurante'
    SUPERMERCADO = 'SUPERMERCADO', 'Supermercado'
    OTRO = 'OTRO', 'Otro'

class ProveedorUnificado(models.Model):
    """
    Modelo unificado de Proveedor (antes: Proveedor + Ecoaliado)

    Combina:
    - apps.proveedores.Proveedor
    - apps.ecoaliados.Ecoaliado
    """

    # ===== Identificación =====
    codigo_interno = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        help_text='Código autogenerado: MP-001 (Materia Prima), ECO-001 (Ecoaliado)'
    )

    # ===== Categorización =====
    categoria = models.CharField(
        max_length=20,
        choices=CategoriaProveedor.choices,
        default=CategoriaProveedor.MATERIA_PRIMA,
        db_index=True,
        help_text='Categoría principal del proveedor'
    )

    # Campo específico para ecoaliados
    tipo_ecoaliado = models.CharField(
        max_length=20,
        choices=TipoEcoaliado.choices,
        blank=True,
        null=True,
        help_text='Tipo de ecoaliado (solo si categoria=ECOALIADO)'
    )

    # ===== Información Básica =====
    nombre_comercial = models.CharField(max_length=255)
    razon_social = models.CharField(max_length=255, blank=True)
    nit = models.CharField(max_length=20, blank=True)

    # ===== Tipo de Materia (solo para MATERIA_PRIMA) =====
    subtipo_materia = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text='Tipo de materia prima (HUESO, SEBO, etc.)'
    )

    # ===== Contacto =====
    direccion = models.TextField(blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)

    # ===== Geolocalización =====
    latitud = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        blank=True,
        null=True
    )
    longitud = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        blank=True,
        null=True
    )
    zona = models.CharField(max_length=100, blank=True)

    # ===== Estado =====
    estado = models.CharField(
        max_length=20,
        choices=[
            ('ACTIVO', 'Activo'),
            ('INACTIVO', 'Inactivo'),
            ('SUSPENDIDO', 'Suspendido'),
        ],
        default='ACTIVO',
        db_index=True
    )

    # ===== Auditoría =====
    fecha_registro = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='proveedores_created'
    )

    # ===== Migración (campos temporales) =====
    # Para rastrear de dónde vino el registro
    migrated_from = models.CharField(
        max_length=20,
        blank=True,
        choices=[
            ('proveedores', 'apps.proveedores'),
            ('ecoaliados', 'apps.ecoaliados'),
        ],
        help_text='App de origen para tracking de migración'
    )
    legacy_id = models.IntegerField(
        blank=True,
        null=True,
        help_text='ID original antes de migración'
    )

    class Meta:
        db_table = 'supply_chain_proveedor_unificado'
        verbose_name = 'Proveedor'
        verbose_name_plural = 'Proveedores'
        ordering = ['nombre_comercial']
        indexes = [
            models.Index(fields=['categoria', 'estado']),
            models.Index(fields=['codigo_interno']),
            models.Index(fields=['migrated_from', 'legacy_id']),
        ]

    def __str__(self):
        return f"{self.codigo_interno} - {self.nombre_comercial}"

    @property
    def es_ecoaliado(self):
        """Verifica si es un ecoaliado"""
        return self.categoria == CategoriaProveedor.ECOALIADO

    @property
    def es_materia_prima(self):
        """Verifica si provee materia prima"""
        return self.categoria == CategoriaProveedor.MATERIA_PRIMA

# Mantener modelos relacionados sin cambios
class ContactoProveedor(models.Model):
    """Contactos de proveedor (sin cambios)"""
    proveedor = models.ForeignKey(
        ProveedorUnificado,  # ✅ Apuntar a nuevo modelo
        on_delete=models.CASCADE,
        related_name='contactos'
    )
    nombre = models.CharField(max_length=255)
    cargo = models.CharField(max_length=100, blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    # ... resto de campos sin cambios

    class Meta:
        db_table = 'supply_chain_contacto_proveedor'

class PrecioMateriaPrima(models.Model):
    """Precios de materia prima (sin cambios en lógica)"""
    proveedor = models.ForeignKey(
        ProveedorUnificado,  # ✅ Apuntar a nuevo modelo
        on_delete=models.CASCADE,
        related_name='precios'
    )
    tipo_materia = models.CharField(max_length=50)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    # ... resto de campos sin cambios

    class Meta:
        db_table = 'supply_chain_precio_materia_prima'
```

#### Paso 3.1.3: Migración de Datos

**IMPORTANTE:** Esta es la parte crítica. Necesitamos migrar datos de 2 tablas antiguas a 1 nueva **sin perder datos**.

```python
# backend/apps/supply_chain/proveedores/migrations/0001_migration_from_legacy.py
"""
Migración de datos desde apps antiguas a ProveedorUnificado
"""
from django.db import migrations

def migrar_proveedores(apps, schema_editor):
    """
    Migrar datos de apps.proveedores.Proveedor → ProveedorUnificado
    """
    # Obtener modelos antiguos
    ProveedorAntiguo = apps.get_model('proveedores', 'Proveedor')

    # Obtener modelo nuevo
    ProveedorUnificado = apps.get_model('supply_chain_proveedores', 'ProveedorUnificado')

    proveedores_migrados = []

    for proveedor_antiguo in ProveedorAntiguo.objects.all():
        proveedor_nuevo = ProveedorUnificado(
            codigo_interno=proveedor_antiguo.codigo_interno,
            categoria=proveedor_antiguo.tipo_proveedor,  # MATERIA_PRIMA, SERVICIO, INSUMO
            nombre_comercial=proveedor_antiguo.nombre_comercial,
            razon_social=proveedor_antiguo.razon_social,
            nit=proveedor_antiguo.nit,
            subtipo_materia=proveedor_antiguo.subtipo_materia,
            direccion=proveedor_antiguo.direccion,
            telefono=proveedor_antiguo.telefono,
            email=proveedor_antiguo.email,
            latitud=proveedor_antiguo.latitud,
            longitud=proveedor_antiguo.longitud,
            zona=proveedor_antiguo.zona,
            estado=proveedor_antiguo.estado,
            fecha_registro=proveedor_antiguo.fecha_registro,
            created_at=proveedor_antiguo.created_at,
            updated_at=proveedor_antiguo.updated_at,
            created_by=proveedor_antiguo.created_by,
            # Tracking de migración
            migrated_from='proveedores',
            legacy_id=proveedor_antiguo.id,
        )
        proveedores_migrados.append(proveedor_nuevo)

    # Inserción bulk para performance
    ProveedorUnificado.objects.bulk_create(proveedores_migrados, batch_size=100)

    print(f"✅ Migrados {len(proveedores_migrados)} proveedores")

def migrar_ecoaliados(apps, schema_editor):
    """
    Migrar datos de apps.ecoaliados.Ecoaliado → ProveedorUnificado
    """
    EcoaliadoAntiguo = apps.get_model('ecoaliados', 'Ecoaliado')
    ProveedorUnificado = apps.get_model('supply_chain_proveedores', 'ProveedorUnificado')

    ecoaliados_migrados = []

    for ecoaliado_antiguo in EcoaliadoAntiguo.objects.all():
        proveedor_nuevo = ProveedorUnificado(
            codigo_interno=ecoaliado_antiguo.codigo,  # ECO-001, ECO-002
            categoria='ECOALIADO',  # ✅ Nueva categoría
            tipo_ecoaliado=ecoaliado_antiguo.tipo_ecoaliado,  # CARNICERIA, MATADERO, etc.
            nombre_comercial=ecoaliado_antiguo.nombre,
            nit=ecoaliado_antiguo.nit,
            direccion=ecoaliado_antiguo.direccion,
            telefono=ecoaliado_antiguo.telefono,
            email=ecoaliado_antiguo.email,
            latitud=ecoaliado_antiguo.latitud,
            longitud=ecoaliado_antiguo.longitud,
            zona=ecoaliado_antiguo.zona,
            estado=ecoaliado_antiguo.estado,
            created_at=ecoaliado_antiguo.created_at,
            updated_at=ecoaliado_antiguo.updated_at,
            # Tracking de migración
            migrated_from='ecoaliados',
            legacy_id=ecoaliado_antiguo.id,
        )
        ecoaliados_migrados.append(proveedor_nuevo)

    ProveedorUnificado.objects.bulk_create(ecoaliados_migrados, batch_size=100)

    print(f"✅ Migrados {len(ecoaliados_migrados)} ecoaliados")

def rollback_migracion(apps, schema_editor):
    """
    Rollback: eliminar datos migrados
    """
    ProveedorUnificado = apps.get_model('supply_chain_proveedores', 'ProveedorUnificado')

    count = ProveedorUnificado.objects.filter(
        migrated_from__in=['proveedores', 'ecoaliados']
    ).count()

    ProveedorUnificado.objects.filter(
        migrated_from__in=['proveedores', 'ecoaliados']
    ).delete()

    print(f"⚠️ Rollback: Eliminados {count} registros migrados")

class Migration(migrations.Migration):
    dependencies = [
        ('supply_chain_proveedores', '0001_initial'),  # Depende de creación de tablas
        ('proveedores', '__latest__'),  # Apps antiguas deben existir
        ('ecoaliados', '__latest__'),
    ]

    operations = [
        migrations.RunPython(migrar_proveedores, rollback_migracion),
        migrations.RunPython(migrar_ecoaliados, rollback_migracion),
    ]
```

#### Paso 3.1.4: Capa de Compatibilidad (Proxy Models)

Para que el código antiguo siga funcionando mientras migramos el frontend:

```python
# backend/apps/supply_chain/proveedores/compatibility.py
"""
Capa de compatibilidad para apps antiguas.
Permite que código legacy acceda a ProveedorUnificado como si fuera Proveedor.
"""
from .models import ProveedorUnificado

class ProveedorLegacyProxy(ProveedorUnificado):
    """
    Proxy para compatibilidad con apps.proveedores.Proveedor
    """
    class Meta:
        proxy = True
        app_label = 'proveedores'  # ✅ Simula ser la app antigua

    @property
    def tipo_proveedor(self):
        """Alias para compatibilidad"""
        return self.categoria

class EcoaliadoLegacyProxy(ProveedorUnificado):
    """
    Proxy para compatibilidad con apps.ecoaliados.Ecoaliado
    """
    class Meta:
        proxy = True
        app_label = 'ecoaliados'  # ✅ Simula ser la app antigua

    objects = ProveedorUnificado.objects.filter(categoria='ECOALIADO')

    @property
    def codigo(self):
        """Alias para compatibilidad"""
        return self.codigo_interno

    @property
    def nombre(self):
        """Alias para compatibilidad"""
        return self.nombre_comercial
```

#### Paso 3.1.5: Actualizar Serializers

```python
# backend/apps/supply_chain/proveedores/serializers.py
from rest_framework import serializers
from .models import ProveedorUnificado, ContactoProveedor, PrecioMateriaPrima

class ProveedorUnificadoSerializer(serializers.ModelSerializer):
    """
    Serializer unificado para Proveedor
    """
    es_ecoaliado = serializers.BooleanField(read_only=True)
    es_materia_prima = serializers.BooleanField(read_only=True)

    class Meta:
        model = ProveedorUnificado
        fields = '__all__'
        read_only_fields = ['codigo_interno', 'created_at', 'updated_at', 'migrated_from', 'legacy_id']

    def validate(self, data):
        """Validaciones"""
        # Si es ECOALIADO, tipo_ecoaliado es requerido
        if data.get('categoria') == 'ECOALIADO' and not data.get('tipo_ecoaliado'):
            raise serializers.ValidationError({
                'tipo_ecoaliado': 'Requerido para ecoaliados'
            })

        # Si es MATERIA_PRIMA, subtipo_materia es requerido
        if data.get('categoria') == 'MATERIA_PRIMA' and not data.get('subtipo_materia'):
            raise serializers.ValidationError({
                'subtipo_materia': 'Requerido para proveedores de materia prima'
            })

        return data

# Serializers de compatibilidad para endpoints antiguos
class ProveedorLegacySerializer(ProveedorUnificadoSerializer):
    """
    Serializer de compatibilidad que simula la estructura antigua de Proveedor
    """
    tipo_proveedor = serializers.CharField(source='categoria')

    class Meta(ProveedorUnificadoSerializer.Meta):
        # Excluir campos nuevos para mantener formato antiguo
        exclude = ['categoria', 'tipo_ecoaliado', 'migrated_from', 'legacy_id']

class EcoaliadoLegacySerializer(ProveedorUnificadoSerializer):
    """
    Serializer de compatibilidad que simula la estructura antigua de Ecoaliado
    """
    codigo = serializers.CharField(source='codigo_interno')
    nombre = serializers.CharField(source='nombre_comercial')

    class Meta(ProveedorUnificadoSerializer.Meta):
        exclude = ['codigo_interno', 'nombre_comercial', 'categoria', 'subtipo_materia', 'migrated_from', 'legacy_id']
```

#### Paso 3.1.6: Actualizar ViewSets con Compatibilidad

```python
# backend/apps/supply_chain/proveedores/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ProveedorUnificado
from .serializers import (
    ProveedorUnificadoSerializer,
    ProveedorLegacySerializer,
    EcoaliadoLegacySerializer
)

class ProveedorUnificadoViewSet(viewsets.ModelViewSet):
    """
    ViewSet unificado para proveedores
    """
    queryset = ProveedorUnificado.objects.all()
    serializer_class = ProveedorUnificadoSerializer
    filterset_fields = ['categoria', 'estado', 'zona']
    search_fields = ['nombre_comercial', 'codigo_interno', 'nit']

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filtro por categoría desde query params
        categoria = self.request.query_params.get('categoria')
        if categoria:
            queryset = queryset.filter(categoria=categoria)

        return queryset

    @action(detail=False, methods=['get'])
    def ecoaliados(self, request):
        """
        Endpoint específico para ecoaliados
        Equivalente a /api/ecoaliados/ (compatibilidad)
        """
        ecoaliados = self.queryset.filter(categoria='ECOALIADO')
        serializer = EcoaliadoLegacySerializer(ecoaliados, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def materia_prima(self, request):
        """
        Endpoint específico para proveedores de materia prima
        """
        proveedores_mp = self.queryset.filter(categoria='MATERIA_PRIMA')
        serializer = ProveedorLegacySerializer(proveedores_mp, many=True)
        return Response(serializer.data)

# ===== ViewSets de compatibilidad para endpoints antiguos =====

class ProveedorLegacyViewSet(ProveedorUnificadoViewSet):
    """
    ViewSet de compatibilidad para /api/proveedores/
    Mantiene funcionando código antiguo del frontend
    """
    serializer_class = ProveedorLegacySerializer

    def get_queryset(self):
        # Excluir ecoaliados (solo proveedores tradicionales)
        return ProveedorUnificado.objects.exclude(categoria='ECOALIADO')

class EcoaliadoLegacyViewSet(ProveedorUnificadoViewSet):
    """
    ViewSet de compatibilidad para /api/ecoaliados/
    Mantiene funcionando código antiguo del frontend
    """
    serializer_class = EcoaliadoLegacySerializer

    def get_queryset(self):
        # Solo ecoaliados
        return ProveedorUnificado.objects.filter(categoria='ECOALIADO')
```

#### Paso 3.1.7: Configurar URLs con Compatibilidad

```python
# backend/apps/supply_chain/proveedores/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProveedorUnificadoViewSet,
    ProveedorLegacyViewSet,
    EcoaliadoLegacyViewSet
)

router = DefaultRouter()

# Endpoints nuevos (API v2)
router.register('proveedores', ProveedorUnificadoViewSet, basename='proveedor-unificado')

# Endpoints de compatibilidad (mantener antiguos funcionando)
router.register('legacy/proveedores', ProveedorLegacyViewSet, basename='proveedor-legacy')
router.register('legacy/ecoaliados', EcoaliadoLegacyViewSet, basename='ecoaliado-legacy')

urlpatterns = [
    path('', include(router.urls)),
]

# backend/config/urls.py
from django.urls import path, include

urlpatterns = [
    # ... otras URLs ...

    # ===== ENDPOINTS ANTIGUOS (compatibilidad durante transición) =====
    # Redirigen a endpoints legacy internamente
    path('api/proveedores/',
         include(('apps.supply_chain.proveedores.urls', 'proveedores-legacy'),
                 namespace='proveedores-legacy-compat')),
    path('api/ecoaliados/',
         include(('apps.supply_chain.proveedores.urls', 'ecoaliados-legacy'),
                 namespace='ecoaliados-legacy-compat')),

    # ===== ENDPOINTS NUEVOS (API v2) =====
    path('api/v2/supply-chain/',
         include('apps.supply_chain.proveedores.urls')),
]
```

#### Paso 3.1.8: Tests de Migración

```python
# backend/apps/supply_chain/proveedores/tests/test_migration.py
"""
Tests de migración de proveedores + ecoaliados
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.proveedores.models import Proveedor as ProveedorAntiguo
from apps.ecoaliados.models import Ecoaliado as EcoaliadoAntiguo
from apps.supply_chain.proveedores.models import ProveedorUnificado

User = get_user_model()

class ProveedorMigrationTestCase(TestCase):
    """Validar migración de proveedores"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@test.com',
            password='test123'
        )

    def test_proveedor_migrado_correctamente(self):
        """Validar que proveedor antiguo fue migrado"""
        # Crear proveedor antiguo
        proveedor_antiguo = ProveedorAntiguo.objects.create(
            codigo_interno='MP-TEST-001',
            nombre_comercial='Proveedor Test',
            tipo_proveedor='MATERIA_PRIMA',
            subtipo_materia='HUESO_CRUDO',
            estado='ACTIVO',
            created_by=self.user
        )

        # Ejecutar migración (en test, se ejecuta automáticamente)
        # Verificar que existe en ProveedorUnificado
        proveedor_nuevo = ProveedorUnificado.objects.get(
            migrated_from='proveedores',
            legacy_id=proveedor_antiguo.id
        )

        self.assertEqual(proveedor_nuevo.codigo_interno, 'MP-TEST-001')
        self.assertEqual(proveedor_nuevo.nombre_comercial, 'Proveedor Test')
        self.assertEqual(proveedor_nuevo.categoria, 'MATERIA_PRIMA')
        self.assertEqual(proveedor_nuevo.subtipo_materia, 'HUESO_CRUDO')
        self.assertEqual(proveedor_nuevo.estado, 'ACTIVO')

    def test_ecoaliado_migrado_como_proveedor(self):
        """Validar que ecoaliado fue migrado como proveedor con categoria=ECOALIADO"""
        # Crear ecoaliado antiguo
        ecoaliado_antiguo = EcoaliadoAntiguo.objects.create(
            codigo='ECO-TEST-001',
            nombre='Ecoaliado Test',
            tipo_ecoaliado='CARNICERIA',
            estado='ACTIVO'
        )

        # Verificar que existe en ProveedorUnificado
        proveedor_nuevo = ProveedorUnificado.objects.get(
            migrated_from='ecoaliados',
            legacy_id=ecoaliado_antiguo.id
        )

        self.assertEqual(proveedor_nuevo.codigo_interno, 'ECO-TEST-001')
        self.assertEqual(proveedor_nuevo.nombre_comercial, 'Ecoaliado Test')
        self.assertEqual(proveedor_nuevo.categoria, 'ECOALIADO')
        self.assertEqual(proveedor_nuevo.tipo_ecoaliado, 'CARNICERIA')
        self.assertTrue(proveedor_nuevo.es_ecoaliado)

    def test_todos_los_proveedores_migrados(self):
        """Validar que todos los registros fueron migrados"""
        count_antiguos = ProveedorAntiguo.objects.count()
        count_ecoaliados = EcoaliadoAntiguo.objects.count()

        count_nuevos_proveedores = ProveedorUnificado.objects.filter(
            migrated_from='proveedores'
        ).count()
        count_nuevos_ecoaliados = ProveedorUnificado.objects.filter(
            migrated_from='ecoaliados'
        ).count()

        self.assertEqual(count_antiguos, count_nuevos_proveedores)
        self.assertEqual(count_ecoaliados, count_nuevos_ecoaliados)

    def test_legacy_endpoints_funcionan(self):
        """Validar que endpoints antiguos siguen funcionando"""
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(user=self.user)

        # Endpoint antiguo de proveedores
        response = client.get('/api/proveedores/')
        self.assertEqual(response.status_code, 200)

        # Endpoint antiguo de ecoaliados
        response = client.get('/api/ecoaliados/')
        self.assertEqual(response.status_code, 200)

        # Nuevo endpoint unificado
        response = client.get('/api/v2/supply-chain/proveedores/')
        self.assertEqual(response.status_code, 200)
```

#### Paso 3.1.9: Validación de Fase 3.1

```bash
# Ejecutar migración de datos
python manage.py migrate

# Validar integridad de datos
python manage.py shell
>>> from apps.supply_chain.proveedores.models import ProveedorUnificado
>>> from apps.proveedores.models import Proveedor
>>> from apps.ecoaliados.models import Ecoaliado
>>>
>>> print(f"Proveedores antiguos: {Proveedor.objects.count()}")
>>> print(f"Ecoaliados antiguos: {Ecoaliado.objects.count()}")
>>> print(f"Proveedores migrados: {ProveedorUnificado.objects.filter(migrated_from='proveedores').count()}")
>>> print(f"Ecoaliados migrados: {ProveedorUnificado.objects.filter(migrated_from='ecoaliados').count()}")
>>> print(f"TOTAL unificado: {ProveedorUnificado.objects.count()}")

# Ejecutar tests
python manage.py test apps.supply_chain.proveedores.tests.test_migration

# Validar endpoints en dev
curl http://localhost:8000/api/proveedores/          # Antiguo
curl http://localhost:8000/api/ecoaliados/           # Antiguo
curl http://localhost:8000/api/v2/supply-chain/proveedores/  # Nuevo
```

Checklist:
- [ ] Modelo `ProveedorUnificado` creado
- [ ] Migración de datos ejecutada sin errores
- [ ] Todos los proveedores migrados (count coincide)
- [ ] Todos los ecoaliados migrados (count coincide)
- [ ] Endpoints antiguos funcionan (compatibilidad)
- [ ] Endpoint nuevo funciona
- [ ] Tests pasando
- [ ] Frontend antiguo sigue funcionando

## 3.2. programaciones + recolecciones + liquidaciones → supply_chain.programacion_abastec

Este es el más complejo. Requiere fusionar 3 apps en 1.

**Análisis de flujo:**
```
1. PROGRAMACIÓN (apps.programaciones)
   ↓
2. RECOLECCIÓN (apps.recolecciones)
   ↓
3. LIQUIDACIÓN (apps.liquidaciones)
```

**Estrategia:** Fusionar en una sola app con 3 modelos principales + sus detalles.

### Diseño Unificado

```python
# backend/apps/supply_chain/programacion_abastec/models.py
"""
Programación de Abastecimiento - Fusión de 3 apps:
- apps.programaciones
- apps.recolecciones
- apps.liquidaciones
"""

class ProgramacionCompra(models.Model):
    """
    Programación de compra (antes: apps.programaciones.ProgramacionCompra)
    """
    consecutivo = models.CharField(max_length=50, unique=True)
    fecha_programada = models.DateField()
    proveedor = models.ForeignKey(
        'supply_chain_proveedores.ProveedorUnificado',  # ✅ Usar modelo unificado
        on_delete=models.PROTECT
    )
    # ... resto de campos

    class Meta:
        db_table = 'supply_chain_programacion_compra'

class Recoleccion(models.Model):
    """
    Recolección de materia prima (antes: apps.recolecciones.Recoleccion)
    """
    numero_recoleccion = models.CharField(max_length=50, unique=True)
    programacion = models.ForeignKey(
        ProgramacionCompra,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    proveedor = models.ForeignKey(
        'supply_chain_proveedores.ProveedorUnificado',
        on_delete=models.PROTECT
    )
    fecha_recoleccion = models.DateTimeField()
    # ... resto de campos

    class Meta:
        db_table = 'supply_chain_recoleccion'

class DetalleRecoleccion(models.Model):
    """
    Detalle de recolección por tipo de materia
    """
    recoleccion = models.ForeignKey(
        Recoleccion,
        on_delete=models.CASCADE,
        related_name='detalles'
    )
    tipo_materia = models.CharField(max_length=50)
    kilos = models.DecimalField(max_digits=10, decimal_places=2)
    precio_kilo = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    # ... resto de campos

    class Meta:
        db_table = 'supply_chain_detalle_recoleccion'

class Liquidacion(models.Model):
    """
    Liquidación de proveedor (antes: apps.liquidaciones.Liquidacion)
    """
    numero_liquidacion = models.CharField(max_length=50, unique=True)
    proveedor = models.ForeignKey(
        'supply_chain_proveedores.ProveedorUnificado',
        on_delete=models.PROTECT
    )
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    recolecciones = models.ManyToManyField(
        Recoleccion,
        related_name='liquidaciones'
    )
    # ... resto de campos

    class Meta:
        db_table = 'supply_chain_liquidacion'
```

### Migración de Datos (similar a 3.1.3)

```python
# backend/apps/supply_chain/programacion_abastec/migrations/0002_migrate_from_legacy.py

def migrar_programaciones(apps, schema_editor):
    ProgramacionAntigua = apps.get_model('programaciones', 'ProgramacionCompra')
    ProgramacionNueva = apps.get_model('supply_chain_programacion_abastec', 'ProgramacionCompra')

    programaciones_migradas = []
    for prog in ProgramacionAntigua.objects.all():
        programaciones_migradas.append(
            ProgramacionNueva(
                consecutivo=prog.consecutivo,
                fecha_programada=prog.fecha_programada,
                # ... mapear campos
                migrated_from='programaciones',
                legacy_id=prog.id
            )
        )

    ProgramacionNueva.objects.bulk_create(programaciones_migradas, batch_size=100)

def migrar_recolecciones(apps, schema_editor):
    RecoleccionAntigua = apps.get_model('recolecciones', 'Recoleccion')
    RecoleccionNueva = apps.get_model('supply_chain_programacion_abastec', 'Recoleccion')

    # Similar a programaciones...

def migrar_liquidaciones(apps, schema_editor):
    LiquidacionAntigua = apps.get_model('liquidaciones', 'Liquidacion')
    LiquidacionNueva = apps.get_model('supply_chain_programacion_abastec', 'Liquidacion')

    # Similar a programaciones...

class Migration(migrations.Migration):
    dependencies = [
        ('supply_chain_programacion_abastec', '0001_initial'),
        ('supply_chain_proveedores', '0002_migration_from_legacy'),  # ✅ Depende de proveedores
        ('programaciones', '__latest__'),
        ('recolecciones', '__latest__'),
        ('liquidaciones', '__latest__'),
    ]

    operations = [
        migrations.RunPython(migrar_programaciones, migrations.RunPython.noop),
        migrations.RunPython(migrar_recolecciones, migrations.RunPython.noop),
        migrations.RunPython(migrar_liquidaciones, migrations.RunPython.noop),
    ]
```

## Validación de Fase 3

- [ ] proveedores + ecoaliados fusionados en `ProveedorUnificado`
- [ ] programaciones + recolecciones + liquidaciones fusionados
- [ ] Migraciones de datos ejecutadas sin pérdida
- [ ] Endpoints antiguos funcionan (compatibilidad)
- [ ] Endpoints nuevos funcionan
- [ ] Tests de migración pasando
- [ ] Frontend antiguo sigue funcionando

## Rollback Plan de Fase 3

```bash
# Script de rollback de Fase 3
cat > scripts/rollback_fase3.sh << 'EOF'
#!/bin/bash
echo "⚠️ ROLLBACK DE FASE 3 - FUSIÓN DE MÓDULOS"

# 1. Restaurar snapshot de BD
mysql -u root -p grasas_huesos_db < backup_antes_fase3.sql

# 2. Eliminar apps nuevas de settings.py
git checkout HEAD~5 -- backend/config/settings.py

# 3. Eliminar código migrado
rm -rf backend/apps/supply_chain/proveedores/
rm -rf backend/apps/supply_chain/programacion_abastec/

# 4. Revertir migraciones
python manage.py migrate proveedores
python manage.py migrate ecoaliados
python manage.py migrate programaciones
python manage.py migrate recolecciones
python manage.py migrate liquidaciones

echo "✅ Rollback completado. Apps antiguas restauradas."
EOF

chmod +x scripts/rollback_fase3.sh
```

**Antes de Fase 3:**
```bash
# IMPORTANTE: Snapshot de BD antes de fusionar
mysqldump -u root -p grasas_huesos_db > backup_antes_fase3.sql
```

---

# FASE 4: Refactorización Dinámica (10 días)

## Objetivos
- Convertir `apps.recolecciones` a sistema dinámico con JSON Schema
- Permitir configuración de formularios desde BD
- No perder funcionalidad existente

## Contexto
Actualmente `recolecciones` tiene campos hardcodeados. Queremos hacerlo configurable.

## 4.1. Análisis de Campos Actuales

```python
# apps.recolecciones.models.py (actual)
class Recoleccion:
    numero_recoleccion
    fecha_recoleccion
    proveedor (FK)
    vehiculo
    conductor
    kilos_brutos
    kilos_netos
    observaciones
    estado
    # ... 20+ campos hardcodeados
```

## 4.2. Diseño de Sistema Dinámico

```python
# backend/apps/supply_chain/programacion_abastec/models_dynamic.py
"""
Sistema dinámico de formularios para recolecciones
"""

class TipoRecoleccion(models.Model):
    """
    Define tipos de recolección con esquemas configurables
    """
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    # JSON Schema del formulario
    form_schema = models.JSONField(
        default=dict,
        help_text='JSON Schema del formulario dinámico'
    )

    # UI Schema (configuración visual)
    ui_schema = models.JSONField(
        default=dict,
        blank=True,
        help_text='Configuración de UI (orden, widgets, etc.)'
    )

    # Validaciones custom
    validations = models.JSONField(
        default=dict,
        blank=True,
        help_text='Reglas de validación adicionales'
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'supply_chain_tipo_recoleccion'

class RecoleccionDinamica(models.Model):
    """
    Recolección con datos dinámicos
    """
    # Campos estáticos (siempre presentes)
    numero_recoleccion = models.CharField(max_length=50, unique=True)
    tipo_recoleccion = models.ForeignKey(
        TipoRecoleccion,
        on_delete=models.PROTECT
    )
    fecha_recoleccion = models.DateTimeField()
    proveedor = models.ForeignKey(
        'supply_chain_proveedores.ProveedorUnificado',
        on_delete=models.PROTECT
    )
    estado = models.CharField(
        max_length=20,
        choices=[
            ('BORRADOR', 'Borrador'),
            ('CONFIRMADA', 'Confirmada'),
            ('EN_RUTA', 'En Ruta'),
            ('COMPLETADA', 'Completada'),
        ],
        default='BORRADOR'
    )

    # Datos dinámicos (según tipo_recoleccion.form_schema)
    datos_dinamicos = models.JSONField(
        default=dict,
        help_text='Datos del formulario dinámico'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )

    class Meta:
        db_table = 'supply_chain_recoleccion_dinamica'

    def validate_dynamic_data(self):
        """
        Valida datos_dinamicos contra form_schema del tipo
        """
        import jsonschema

        schema = self.tipo_recoleccion.form_schema

        try:
            jsonschema.validate(instance=self.datos_dinamicos, schema=schema)
            return True, None
        except jsonschema.ValidationError as e:
            return False, str(e)

    def save(self, *args, **kwargs):
        # Validar antes de guardar
        is_valid, error = self.validate_dynamic_data()
        if not is_valid:
            raise ValidationError(f"Datos inválidos: {error}")

        super().save(*args, **kwargs)
```

## 4.3. Ejemplo de JSON Schema

```python
# Ejemplo de form_schema para tipo de recolección "MATERIA_PRIMA"
{
    "type": "object",
    "required": ["vehiculo", "conductor", "kilos_brutos", "kilos_netos"],
    "properties": {
        "vehiculo": {
            "type": "string",
            "title": "Placa del Vehículo",
            "minLength": 6,
            "maxLength": 10
        },
        "conductor": {
            "type": "string",
            "title": "Nombre del Conductor",
            "minLength": 3
        },
        "kilos_brutos": {
            "type": "number",
            "title": "Kilos Brutos",
            "minimum": 0,
            "maximum": 50000
        },
        "kilos_netos": {
            "type": "number",
            "title": "Kilos Netos",
            "minimum": 0,
            "maximum": 50000
        },
        "observaciones": {
            "type": "string",
            "title": "Observaciones"
        },
        "foto_bascula": {
            "type": "string",
            "title": "URL de Foto de Báscula",
            "format": "uri"
        }
    }
}

# UI Schema correspondiente (configuración visual)
{
    "vehiculo": {
        "ui:widget": "text",
        "ui:placeholder": "Ej: ABC123"
    },
    "conductor": {
        "ui:widget": "text",
        "ui:autocomplete": "conductores"  # Sugerir desde BD
    },
    "kilos_brutos": {
        "ui:widget": "number",
        "ui:suffix": "kg"
    },
    "kilos_netos": {
        "ui:widget": "number",
        "ui:suffix": "kg"
    },
    "observaciones": {
        "ui:widget": "textarea",
        "ui:rows": 3
    },
    "foto_bascula": {
        "ui:widget": "file-upload",
        "ui:accept": "image/*"
    }
}
```

## 4.4. Migración de Datos Hardcodeados → Dinámicos

```python
# backend/apps/supply_chain/programacion_abastec/migrations/0003_convert_to_dynamic.py

def crear_tipo_recoleccion_default(apps, schema_editor):
    """
    Crear tipo de recolección por defecto con esquema de campos actuales
    """
    TipoRecoleccion = apps.get_model('supply_chain_programacion_abastec', 'TipoRecoleccion')

    # Schema que replica campos actuales
    default_schema = {
        "type": "object",
        "required": ["vehiculo", "conductor", "kilos_brutos", "kilos_netos"],
        "properties": {
            "vehiculo": {"type": "string", "title": "Placa del Vehículo"},
            "conductor": {"type": "string", "title": "Conductor"},
            "kilos_brutos": {"type": "number", "title": "Kilos Brutos"},
            "kilos_netos": {"type": "number", "title": "Kilos Netos"},
            "tara": {"type": "number", "title": "Tara"},
            "observaciones": {"type": "string", "title": "Observaciones"},
            # ... resto de campos actuales
        }
    }

    default_ui_schema = {
        "vehiculo": {"ui:widget": "text"},
        "conductor": {"ui:widget": "text"},
        "kilos_brutos": {"ui:widget": "number", "ui:suffix": "kg"},
        "kilos_netos": {"ui:widget": "number", "ui:suffix": "kg"},
        # ... resto de configuración UI
    }

    TipoRecoleccion.objects.create(
        code='MATERIA_PRIMA_DEFAULT',
        name='Recolección de Materia Prima (Por Defecto)',
        description='Tipo de recolección por defecto que replica campos hardcodeados',
        form_schema=default_schema,
        ui_schema=default_ui_schema,
        is_active=True
    )

def migrar_recolecciones_a_dinamicas(apps, schema_editor):
    """
    Migrar recolecciones hardcodeadas a formato dinámico
    """
    RecoleccionAntigua = apps.get_model('supply_chain_programacion_abastec', 'Recoleccion')
    RecoleccionDinamica = apps.get_model('supply_chain_programacion_abastec', 'RecoleccionDinamica')
    TipoRecoleccion = apps.get_model('supply_chain_programacion_abastec', 'TipoRecoleccion')

    tipo_default = TipoRecoleccion.objects.get(code='MATERIA_PRIMA_DEFAULT')

    recolecciones_migradas = []

    for rec_antigua in RecoleccionAntigua.objects.all():
        # Convertir campos hardcodeados a JSON
        datos_dinamicos = {
            "vehiculo": rec_antigua.vehiculo,
            "conductor": rec_antigua.conductor,
            "kilos_brutos": float(rec_antigua.kilos_brutos) if rec_antigua.kilos_brutos else 0,
            "kilos_netos": float(rec_antigua.kilos_netos) if rec_antigua.kilos_netos else 0,
            "tara": float(rec_antigua.tara) if rec_antigua.tara else 0,
            "observaciones": rec_antigua.observaciones or "",
            # ... mapear resto de campos
        }

        rec_dinamica = RecoleccionDinamica(
            numero_recoleccion=rec_antigua.numero_recoleccion,
            tipo_recoleccion=tipo_default,
            fecha_recoleccion=rec_antigua.fecha_recoleccion,
            proveedor=rec_antigua.proveedor,
            estado=rec_antigua.estado,
            datos_dinamicos=datos_dinamicos,
            created_at=rec_antigua.created_at,
            updated_at=rec_antigua.updated_at,
            created_by=rec_antigua.created_by,
        )
        recolecciones_migradas.append(rec_dinamica)

    RecoleccionDinamica.objects.bulk_create(recolecciones_migradas, batch_size=100)

    print(f"✅ Migradas {len(recolecciones_migradas)} recolecciones a formato dinámico")

class Migration(migrations.Migration):
    dependencies = [
        ('supply_chain_programacion_abastec', '0002_migrate_from_legacy'),
    ]

    operations = [
        migrations.RunPython(crear_tipo_recoleccion_default, migrations.RunPython.noop),
        migrations.RunPython(migrar_recolecciones_a_dinamicas, migrations.RunPython.noop),
    ]
```

## 4.5. Serializers para Sistema Dinámico

```python
# backend/apps/supply_chain/programacion_abastec/serializers_dynamic.py

class TipoRecoleccionSerializer(serializers.ModelSerializer):
    """Serializer para tipos de recolección"""

    class Meta:
        model = TipoRecoleccion
        fields = '__all__'

class RecoleccionDinamicaSerializer(serializers.ModelSerializer):
    """Serializer para recolecciones dinámicas"""

    # Incluir schema del tipo para renderizar formulario en frontend
    form_schema = serializers.SerializerMethodField()
    ui_schema = serializers.SerializerMethodField()

    class Meta:
        model = RecoleccionDinamica
        fields = '__all__'

    def get_form_schema(self, obj):
        """Retornar schema del tipo para frontend"""
        return obj.tipo_recoleccion.form_schema

    def get_ui_schema(self, obj):
        """Retornar UI schema para frontend"""
        return obj.tipo_recoleccion.ui_schema

    def validate_datos_dinamicos(self, value):
        """Validar datos dinámicos contra schema"""
        # La validación se hace en el modelo, pero también aquí
        tipo_id = self.initial_data.get('tipo_recoleccion')
        if tipo_id:
            tipo = TipoRecoleccion.objects.get(id=tipo_id)

            import jsonschema
            try:
                jsonschema.validate(instance=value, schema=tipo.form_schema)
            except jsonschema.ValidationError as e:
                raise serializers.ValidationError(f"Datos inválidos: {e.message}")

        return value
```

## 4.6. Frontend con React JSON Schema Form

```typescript
// frontend/src/features/recolecciones/components/RecoleccionDinamicaForm.tsx
import React from 'react';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';

interface RecoleccionDinamicaFormProps {
  tipoRecoleccion: TipoRecoleccion;
  initialData?: any;
  onSubmit: (data: any) => void;
}

export const RecoleccionDinamicaForm: React.FC<RecoleccionDinamicaFormProps> = ({
  tipoRecoleccion,
  initialData,
  onSubmit,
}) => {
  const handleSubmit = (data: any) => {
    onSubmit({
      tipo_recoleccion: tipoRecoleccion.id,
      datos_dinamicos: data.formData,
    });
  };

  return (
    <div>
      <h2>{tipoRecoleccion.name}</h2>
      <p>{tipoRecoleccion.description}</p>

      <Form
        schema={tipoRecoleccion.form_schema}
        uiSchema={tipoRecoleccion.ui_schema}
        formData={initialData?.datos_dinamicos}
        validator={validator}
        onSubmit={handleSubmit}
      />
    </div>
  );
};
```

## Validación de Fase 4

- [ ] Modelo `TipoRecoleccion` creado
- [ ] Modelo `RecoleccionDinamica` creado
- [ ] Migración de datos hardcodeados a dinámicos
- [ ] Tipo por defecto creado con campos actuales
- [ ] JSON Schema validando correctamente
- [ ] API retornando schemas
- [ ] Frontend renderizando formularios dinámicos
- [ ] Recolecciones antiguas funcionando como antes
- [ ] Admin puede crear nuevos tipos desde interfaz

## Rollback Plan de Fase 4

```bash
# Rollback de Fase 4
mysql -u root -p grasas_huesos_db < backup_antes_fase4.sql
python manage.py migrate supply_chain_programacion_abastec 0002_migrate_from_legacy
```

---

# FASE 5: Integración y Testing (5 días)

## Objetivos
- Validar que TODO el sistema funciona correctamente
- Tests end-to-end
- Documentación final
- Limpieza de código antiguo (opcional)

## 5.1. Tests de Integración Completos

```python
# backend/tests/integration/test_full_migration.py
"""
Tests de integración completa del sistema migrado
"""
from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from apps.supply_chain.proveedores.models import ProveedorUnificado
from apps.supply_chain.programacion_abastec.models import (
    ProgramacionCompra,
    Recoleccion,
    RecoleccionDinamica,
    Liquidacion
)

User = get_user_model()

class FullMigrationIntegrationTestCase(TransactionTestCase):
    """Tests de integración completa"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='admin@test.com',
            password='admin123'
        )

    def test_flujo_completo_proveedor_recoleccion(self):
        """
        Test del flujo completo:
        1. Crear proveedor
        2. Crear programación
        3. Crear recolección
        4. Crear liquidación
        """
        # 1. Crear proveedor unificado
        proveedor = ProveedorUnificado.objects.create(
            codigo_interno='MP-TEST-001',
            nombre_comercial='Proveedor Test Integración',
            categoria='MATERIA_PRIMA',
            subtipo_materia='HUESO_CRUDO',
            estado='ACTIVO',
            created_by=self.user
        )

        # 2. Crear programación
        programacion = ProgramacionCompra.objects.create(
            consecutivo='PROG-2025-001',
            fecha_programada='2025-01-15',
            proveedor=proveedor,
            created_by=self.user
        )

        # 3. Crear recolección
        recoleccion = Recoleccion.objects.create(
            numero_recoleccion='REC-2025-001',
            programacion=programacion,
            proveedor=proveedor,
            fecha_recoleccion='2025-01-15 10:00:00',
            created_by=self.user
        )

        # 4. Crear liquidación
        liquidacion = Liquidacion.objects.create(
            numero_liquidacion='LIQ-2025-001',
            proveedor=proveedor,
            fecha_inicio='2025-01-01',
            fecha_fin='2025-01-31',
            created_by=self.user
        )
        liquidacion.recolecciones.add(recoleccion)

        # Validaciones
        self.assertIsNotNone(proveedor.id)
        self.assertIsNotNone(programacion.id)
        self.assertIsNotNone(recoleccion.id)
        self.assertIsNotNone(liquidacion.id)
        self.assertEqual(liquidacion.recolecciones.count(), 1)

        print("✅ Flujo completo funciona correctamente")

    def test_compatibilidad_endpoints_antiguos(self):
        """Validar que endpoints antiguos siguen funcionando"""
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(user=self.user)

        endpoints_antiguos = [
            '/api/proveedores/',
            '/api/ecoaliados/',
            '/api/programaciones/',
            '/api/recolecciones/',
            '/api/liquidaciones/',
        ]

        for endpoint in endpoints_antiguos:
            response = client.get(endpoint)
            self.assertEqual(
                response.status_code,
                200,
                f"Endpoint antiguo falló: {endpoint}"
            )

        print("✅ Todos los endpoints antiguos funcionan")

    def test_nuevos_endpoints_v2(self):
        """Validar que nuevos endpoints v2 funcionan"""
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(user=self.user)

        endpoints_nuevos = [
            '/api/v2/supply-chain/proveedores/',
            '/api/v2/supply-chain/programacion-abastec/programaciones/',
            '/api/v2/supply-chain/programacion-abastec/recolecciones/',
            '/api/v2/supply-chain/programacion-abastec/liquidaciones/',
        ]

        for endpoint in endpoints_nuevos:
            response = client.get(endpoint)
            self.assertEqual(
                response.status_code,
                200,
                f"Endpoint nuevo falló: {endpoint}"
            )

        print("✅ Todos los endpoints v2 funcionan")

    def test_migracion_datos_sin_perdidas(self):
        """Validar que no se perdieron datos en la migración"""
        from apps.proveedores.models import Proveedor as ProveedorAntiguo
        from apps.ecoaliados.models import Ecoaliado as EcoaliadoAntiguo

        # Contar registros antiguos
        count_proveedores_antiguos = ProveedorAntiguo.objects.count()
        count_ecoaliados_antiguos = EcoaliadoAntiguo.objects.count()

        # Contar registros migrados
        count_proveedores_migrados = ProveedorUnificado.objects.filter(
            migrated_from='proveedores'
        ).count()
        count_ecoaliados_migrados = ProveedorUnificado.objects.filter(
            migrated_from='ecoaliados'
        ).count()

        # Validar
        self.assertEqual(count_proveedores_antiguos, count_proveedores_migrados)
        self.assertEqual(count_ecoaliados_antiguos, count_ecoaliados_migrados)

        print(f"✅ Sin pérdidas: {count_proveedores_antiguos} proveedores + {count_ecoaliados_antiguos} ecoaliados migrados")
```

## 5.2. Tests de Performance

```python
# backend/tests/performance/test_migration_performance.py
"""
Tests de performance del sistema migrado
"""
import time
from django.test import TestCase
from apps.supply_chain.proveedores.models import ProveedorUnificado

class MigrationPerformanceTestCase(TestCase):
    """Validar que migración no afectó performance"""

    def test_query_proveedores_rapido(self):
        """Validar que queries de proveedores son rápidos"""
        # Crear 1000 proveedores de prueba
        proveedores = [
            ProveedorUnificado(
                codigo_interno=f'MP-TEST-{i:04d}',
                nombre_comercial=f'Proveedor Test {i}',
                categoria='MATERIA_PRIMA',
                estado='ACTIVO'
            )
            for i in range(1000)
        ]
        ProveedorUnificado.objects.bulk_create(proveedores)

        # Medir tiempo de query
        start = time.time()
        proveedores = list(ProveedorUnificado.objects.filter(estado='ACTIVO'))
        duration = time.time() - start

        # Debe ser menor a 0.5 segundos
        self.assertLess(duration, 0.5, f"Query demasiado lento: {duration}s")

        print(f"✅ Query de 1000 proveedores: {duration:.3f}s")

    def test_endpoint_response_time(self):
        """Validar que endpoints responden rápido"""
        from rest_framework.test import APIClient
        from django.contrib.auth import get_user_model

        User = get_user_model()
        user = User.objects.create_user(email='test@test.com', password='test123')

        client = APIClient()
        client.force_authenticate(user=user)

        start = time.time()
        response = client.get('/api/v2/supply-chain/proveedores/')
        duration = time.time() - start

        self.assertEqual(response.status_code, 200)
        self.assertLess(duration, 1.0, f"Endpoint demasiado lento: {duration}s")

        print(f"✅ Endpoint response time: {duration:.3f}s")
```

## 5.3. Documentación Final

```bash
# Crear documentación completa de la migración
cat > docs/MIGRACION-COMPLETADA.md << 'EOF'
# Migración Completada - Resumen

## Fecha de Completación
[Fecha aquí]

## Módulos Migrados

### 1. Supply Chain
- **apps.proveedores** + **apps.ecoaliados** → `supply_chain.proveedores`
- **apps.programaciones** + **apps.recolecciones** + **apps.liquidaciones** → `supply_chain.programacion_abastec`
- **apps.recepciones** → `supply_chain.recepciones`
- **apps.lotes** → `supply_chain.lotes`

### 2. Calidad y Certificaciones
- **apps.certificados** → `calidad_certificaciones.certificados`

### 3. Reportes y Analytics
- **apps.reportes** → `reportes_analytics.reportes`

### 4. Logística
- **apps.unidades** → `logistica.unidades`

### 5. Financiero
- **apps.liquidaciones** → `financiero.liquidaciones`

## Cambios Principales

### Fusión de Proveedores
`ProveedorUnificado` ahora incluye:
- Proveedores de materia prima (MP-)
- Proveedores de servicios (PS-)
- Proveedores de insumos (PI-)
- Ecoaliados (ECO-)

Campo `categoria` diferencia el tipo.

### Sistema Dinámico de Recolecciones
- Tipos de recolección configurables desde BD
- Formularios definidos con JSON Schema
- Sin campos hardcodeados

## Endpoints

### Antiguos (mantener por compatibilidad)
```
GET /api/proveedores/
GET /api/ecoaliados/
GET /api/programaciones/
GET /api/recolecciones/
GET /api/liquidaciones/
```

### Nuevos (recomendados)
```
GET /api/v2/supply-chain/proveedores/
GET /api/v2/supply-chain/proveedores/ecoaliados/
GET /api/v2/supply-chain/programacion-abastec/programaciones/
GET /api/v2/supply-chain/programacion-abastec/recolecciones/
GET /api/v2/supply-chain/programacion-abastec/liquidaciones/
```

## Tests
- Total: 150+ tests
- Coverage: 85%
- Performance: OK

## Próximos Pasos
1. Migrar frontend a usar endpoints v2
2. Deprecar endpoints antiguos (en 6 meses)
3. Eliminar apps antiguas (en 1 año)
EOF
```

## 5.4. Limpieza de Código Antiguo (Opcional)

**IMPORTANTE:** Solo hacer esto después de validar que TODO funciona.

```bash
# Script para limpiar código antiguo (OPCIONAL, solo después de validar)
cat > scripts/cleanup_old_apps.sh << 'EOF'
#!/bin/bash
echo "⚠️ ADVERTENCIA: Este script elimina apps antiguas"
echo "Solo ejecutar después de validar que sistema nuevo funciona 100%"
echo ""
read -p "¿Está seguro? (escriba 'SI' para continuar): " confirm

if [ "$confirm" != "SI" ]; then
    echo "Cancelado."
    exit 1
fi

# Backup antes de eliminar
mysqldump -u root -p grasas_huesos_db > backup_antes_cleanup_$(date +%Y%m%d).sql

# Comentar (no eliminar) apps antiguas en settings.py
echo "Comentando apps antiguas en settings.py..."

# Mover apps antiguas a carpeta legacy
mkdir -p backend/apps_legacy
mv backend/apps/proveedores backend/apps_legacy/
mv backend/apps/ecoaliados backend/apps_legacy/
mv backend/apps/programaciones backend/apps_legacy/
mv backend/apps/recolecciones backend/apps_legacy/
mv backend/apps/liquidaciones backend/apps_legacy/

echo "✅ Apps antiguas movidas a backend/apps_legacy/"
echo "Si todo funciona bien por 6 meses, eliminar definitivamente."
EOF

chmod +x scripts/cleanup_old_apps.sh
```

## Validación Final de Fase 5

- [ ] Tests de integración pasando (150+ tests)
- [ ] Tests de performance OK
- [ ] Documentación completa creada
- [ ] Endpoints antiguos funcionan
- [ ] Endpoints nuevos funcionan
- [ ] Frontend migrado a usar v2
- [ ] Sin errores en logs por 1 semana
- [ ] Aprobación de stakeholders

---

# RESUMEN DEL PLAN COMPLETO

## Timeline

| Fase | Duración | Riesgo | Estado |
|------|----------|--------|--------|
| 0. Preparación | 2 días | Bajo | ⬜ Pendiente |
| 1. Estructura Base | 3 días | Bajo | ⬜ Pendiente |
| 2. Módulos Simples | 5 días | Medio | ⬜ Pendiente |
| 3. Fusión Módulos | 7 días | Alto | ⬜ Pendiente |
| 4. Refactorización Dinámica | 10 días | Muy Alto | ⬜ Pendiente |
| 5. Integración y Testing | 5 días | Medio | ⬜ Pendiente |
| **TOTAL** | **32 días** | - | - |

## Apps por Fase

### Fase 0: Preparación
- Backup completo
- Análisis de dependencias
- Entorno de testing

### Fase 1: Estructura Base
- Crear directorios
- Configurar namespaces
- README.md

### Fase 2: Módulos Simples
- apps.certificados → calidad_certificaciones.certificados
- apps.reportes → reportes_analytics.reportes
- apps.unidades → logistica.unidades

### Fase 3: Fusión Módulos
- apps.proveedores + apps.ecoaliados → supply_chain.proveedores
- apps.programaciones + apps.recolecciones + apps.liquidaciones → supply_chain.programacion_abastec
- apps.recepciones → supply_chain.recepciones
- apps.lotes → supply_chain.lotes

### Fase 4: Refactorización Dinámica
- Recolecciones hardcodeadas → JSON Schema

### Fase 5: Integración y Testing
- Tests completos
- Documentación
- Limpieza (opcional)

## Estrategia de Rollback por Fase

| Fase | Rollback | Tiempo | Impacto |
|------|----------|--------|---------|
| 1 | `git revert` | 5 min | Cero |
| 2 | Script + git | 15 min | Bajo |
| 3 | Restore DB snapshot | 30 min | Medio |
| 4 | Restore DB snapshot | 30 min | Alto |
| 5 | N/A | - | - |

## Checklist de Seguridad

Antes de cada fase:
- [ ] Backup de BD
- [ ] Tag de Git
- [ ] Tests pasando
- [ ] Stakeholders notificados

Durante cada fase:
- [ ] Validar funcionamiento continuo
- [ ] Monitorear logs
- [ ] Tests después de cada cambio

Después de cada fase:
- [ ] Documentar cambios
- [ ] Actualizar checklist
- [ ] Comunicar progreso

## Criterios de Éxito

La migración será exitosa cuando:

1. **Funcionalidad Preservada:**
   - ✅ Todos los endpoints antiguos funcionan
   - ✅ Frontend antiguo funciona sin cambios
   - ✅ No hay errores en logs

2. **Nuevas Funcionalidades:**
   - ✅ Endpoints v2 funcionan
   - ✅ Sistema dinámico de recolecciones operativo
   - ✅ Proveedores unificados

3. **Calidad:**
   - ✅ Tests: 85%+ coverage
   - ✅ Performance: Igual o mejor que antes
   - ✅ Sin pérdida de datos

4. **Documentación:**
   - ✅ Guías de migración completas
   - ✅ API docs actualizadas
   - ✅ Diagramas de arquitectura nueva

## Comunicación con Stakeholders

### Antes de iniciar:
- Presentar plan completo
- Explicar beneficios
- Definir ventanas de mantenimiento

### Durante migración:
- Updates diarios de progreso
- Alertas inmediatas si hay problemas
- Demos de nuevas funcionalidades

### Después de completar:
- Presentación de resultados
- Capacitación en nuevas funcionalidades
- Documentación de usuario

---

## Contacto

Para preguntas sobre este plan:
- **Documento:** `/docs/PLAN-MIGRACION-INCREMENTAL.md`
- **Última actualización:** 2025-12-22
- **Versión:** 1.0.0

---

**FIN DEL PLAN DE MIGRACIÓN INCREMENTAL**
