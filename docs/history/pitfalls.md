# Pitfalls & Lessons Learned

## Progressive Module Rollout — Cascade Deploy
**Estado**: ACTIVO (2026-03-16)
- **RuntimeError vs ImportError**: Django raises `RuntimeError` (NOT `ImportError`) when importing models from apps not in INSTALLED_APPS. Use `django_apps.is_installed('app.label')` BEFORE importing.
- **FK to disabled module**: User model with FK to `Proveedor` (disabled app) → `TypeError: isinstance() arg 2 must be a type` during auth. Fix: convert FK to `PositiveBigIntegerField` with `db_column='original_column_name'` to preserve DB column.
- **PostgreSQL 15 GRANT**: After `CREATE DATABASE`, the owner role needs `GRANT ALL ON SCHEMA public` explicitly. Without it: `permission denied for schema public`.
- **VPS services block DB drop**: `DROP DATABASE` fails with "being accessed by other users". ALWAYS `systemctl stop stratekaz-gunicorn stratekaz-celery stratekaz-celerybeat` + `pg_terminate_backend()` BEFORE dropping.
- **VPS venv path**: `/opt/stratekaz/backend/venv/bin/activate` (NOT `/opt/stratekaz/venv/`). Error real: `source venv/bin/activate` desde `/opt/stratekaz/` falla. SIEMPRE usar `source backend/venv/bin/activate`.
- **Deploy one-liner**: NUNCA generar comandos deploy de memoria. SIEMPRE copiar de deploy.md Opción C. El 2026-03-16 se generó un one-liner con `source venv/bin/activate` (ruta incorrecta) + faltaba `git checkout -- .` + faltaba `DJANGO_SETTINGS_MODULE` + faltaba reiniciar celery/beat. La Opción C ya tiene TODO correcto.
- **Seeds for disabled modules**: `deploy_seeds_all_tenants` reports "Unknown command" for seeds of commented-out apps. This is EXPECTED and OK.
- **React #31 — Lucide icon as ReactNode** (2026-03-18): `icon: Plus` o `icon={Plus}` pasa el componente forwardRef (objeto con `{$$typeof, render, displayName}`) como ReactNode. Button/EmptyState renderizan `{icon}` como child → crash React #31. Fix: `icon={<Plus size={14} />}` (JSX) o no pasar icon si el default ya es Plus. Afecta ~40 archivos en módulos no deployados (L25+).
- **Respuesta paginada sin normalizar** (2026-03-18): DRF retorna `{count, next, results:[]}` pero hooks retornaban `response.data` directo → pages hacían `.map()` sobre objeto paginado → `s.map is not a function`. Fix: helper `asList()` en hooks. Patrón: `const asList = (data) => Array.isArray(data) ? data : (data?.results ?? [])`.
- **Badge variant inexistente** (2026-03-18): `variant="default"` y `variant="neutral"` NO existen en Badge. Variants válidos: `primary|secondary|accent|success|warning|danger|info|gray`. No crashea pero no aplica estilos de color.
- **Notificaciones 404 flood**: `Header.tsx` importa `useNotificacionesNoLeidas` que hace polling cada 60s. Si `centro_notificaciones` está comentada en TENANT_APPS, el endpoint retorna 404 infinitamente. Fix: `refetchInterval: (query) => query.state.status === 'error' ? false : 60000` + `retry: 0`.
- **Query key collision React Query**: Dos hooks con misma query key `['modules', 'tree']` pero diferente config (enabled, staleTime, retry) causan race conditions. NUNCA duplicar hooks — usar shared hook en `@/hooks/`.
- **React #31 en producción sin console error**: Error Boundary atrapa el crash antes de que llegue a la consola. Para diagnosticar: DevTools → Fuentes → "Pausar en excepciones detectadas". PERO: esto también pausa en excepciones internas de React (Suspense throw/catch), creando falsos positivos.
- **VPS venv ya activado**: Si el prompt muestra `(venv)`, `source venv/bin/activate` falla con "No such file". Ignorar — el venv ya está activo.
- **DRF router @action con url_path con barras** (2026-03-27): `@action(url_path='recursos/(?P<code>[a-z]+)/acceder')` registrado en router → Django retorna 404. El router de DRF NO genera correctamente URLs con barras intermedias en `url_path`. Fix: registrar como función view standalone en `urlpatterns` directamente: `path('public/recursos/<str:code>/acceder/', mi_view)`.
- **Service Worker Workbox intercepta redirect externo** (2026-03-27): `window.open('https://app.stratekaz.com/api/...')` en nueva pestaña → el SW de app.stratekaz.com intercepta y falla con `no-response` porque no puede manejar redirect 302 a dominio externo (drive.google.com). Fix: backend retorna JSON `{"url": "..."}` en vez de HttpResponseRedirect. Frontend: `fetch(apiUrl) → res.json() → window.open(data.url)`. El SW no intercepta navegaciones cross-origin.
- **IntersectionObserver scroll tracking con denominador hardcoded** (2026-04-06): `DocumentoReaderModal` usaba `TOTAL_SECCIONES = 10` como denominador fijo. Documentos con < 10 secciones HTML nunca alcanzaban el 90% → checkbox "He leído" permanentemente deshabilitado. Fix: obtener `sectionElements.length` real del DOM en el `useEffect` del observer y almacenarlo en un `useRef` (para `guardarProgreso` sin re-render) + `useState` (para recalcular `porcentaje` visible). Regla: NUNCA hardcodear el total de secciones — calcularlo del DOM real.
- **iframe con SPA fallthrough en producción** (2026-04-06): Nginx configurado con `try_files $uri /index.html` sirve la React SPA (HTTP 200, Content-Type: text/html) para rutas que no existen en disco, incluyendo `/media/` archivos faltantes. Si un `<iframe src="/media/...">` apunta a un archivo inexistente → renderiza la página 404 de React *dentro* del iframe. Fix: `PdfIframe` sub-component hace `fetch(url, { method: 'HEAD' })` antes de renderizar; si `!res.ok || !content-type.includes('pdf')` → muestra error con enlace "Abrir en nueva pestaña" en lugar del iframe.
- **ESLint `no-unused-vars` rompe CI con `--max-warnings 0`** (2026-04-04): El CI usa `npx eslint src --max-warnings 0`. Un import sin usar (ej: `Spinner`) genera 1 warning → `ESLint found too many warnings (maximum: 0)` → exit code 1 → CI falla. SIEMPRE correr `npx eslint src/ --max-warnings=0` antes de push. Ejemplo real: `EnProcesoSection.tsx` importaba `Spinner` de `@/components/common` pero usaba `TableSkeleton` en su lugar (Sprint 5, CI #837).
- **`@/components/modals` NO exporta `Modal`** (2026-04-04): El barrel `modals/index.ts` exporta `BaseModal`, `FormModal`, `ConfirmModal`, `DetailModal`, `WizardModal`, `AlertModal`. NUNCA hacer `import { Modal } from '@/components/modals'` — no existe y causa `SyntaxError: The requested module does not provide an export named 'Modal'` en browser runtime. Usar siempre el nombre exacto.
- **django_celery_beat DuplicateTable en public**: Las tablas se crearon manualmente (2026-02-22) pero `django_migrations` no las registra. Al hacer `migrate_schemas` falla con `relation "django_celery_beat_crontabschedule" already exists`. Fix: `migrate_schemas --shared --fake django_celery_beat 0001_initial` y luego continuar normal. Esto puede recurrir cada vez que se recree la DB sin restaurar `django_migrations`.

- **Portales con apps no desplegadas** (2026-03-20): Portal Proveedor y Cliente estaban con rutas activas pero sus apps backend (L50/L53) no desplegadas. Causan 404 en endpoints. Fix: desactivar rutas con redirect a /mi-portal. También Mi Portal mostraba tabs de apps L60 (vacaciones, permisos, etc.). Fix: flags booleanos por tab, activar progresivamente.
- **Usuario huérfano multi-tenant** (2026-03-20): Borrar usuario requiere 3 capas: 1) `UPDATE talent_hub_colaborador SET usuario_id = NULL` (desligar FK), 2) `DELETE FROM core_user` (tenant schema), 3) `DELETE FROM tenant_tenantuseraccess` + `DELETE FROM tenant_tenantuser` (public schema). Si se intenta DELETE User sin desligar Colaborador → `IntegrityError: FK violation`.
- **Alcance de medición de tests: solo LIVE** (2026-04-08): `testing.py` habilita 89 TENANT_APPS (28 LIVE + 61 borrador). Correr `pytest apps/` mide TODO — incluyendo 61 apps no-LIVE cuyos tests están rotos por diseño (fixtures con campos incorrectos, imports de modelos renombrados, etc.). Resultado: números inflados de errores (1441) que esconden el progreso real de las apps LIVE. Fix: SIEMPRE medir solo las apps activas en `base.py` TENANT_APPS. `testing.py` habilita las extra apps SOLO para que pytest no crashee al importar, NO para que sus tests pasen.
- **create_schema(check_if_exists=True) no re-migra** (2026-04-08): `Tenant.create_schema(check_if_exists=True, sync_schema=True)` detecta que el schema ya existe (de una corrida anterior) y NO vuelve a correr migraciones. Resultado: schema con 0 tablas si fue creado antes de que las apps estuvieran en TENANT_APPS. Fix pendiente: forzar `migrate_schemas` explícitamente después de crear el schema, o dropear/recrear el schema en cada corrida.

## FK target change migrations (User → Cargo, etc.)
**Estado**: RESUELTO (2026-03-16)
Al cambiar el target de un FK (ej: `lider_proceso` de User a Cargo), los IDs existentes en la tabla son del modelo viejo y NO corresponden al nuevo. SIEMPRE agregar `RunPython` ANTES del `AlterField` para hacer NULL los valores existentes. Sin esto, PostgreSQL rechaza con `ForeignKeyViolation`. Patrón:
```python
operations = [
    migrations.RunPython(nullify_field, migrations.RunPython.noop),  # Paso 1
    migrations.AlterField(...),  # Paso 2
]
```

## PWA Service Worker: skipWaiting + controllerchange
**Estado**: RESUELTO (2026-03-12)
**NUNCA** poner `skipWaiting: false` — atrapa al usuario en JS viejo indefinidamente. El patrón correcto (Gmail/Slack/VS Code Web) es:
- `skipWaiting: true` + `clientsClaim: true` → nuevo SW activa inmediatamente
- `main.tsx`: toast en `controllerchange` → usuario decide cuándo recargar
- El **toast** es la protección contra reloads forzados, **no** `skipWaiting:false`
- **Proactive token refresh** en `axios-config.ts` renueva 5min antes de expiración
- **401 guard**: `hasTokenInStorage` check antes de `forceLogout()` evita logout durante Zustand rehydration

## Re-export NO crea variable local
**Estado**: RESUELTO (2026-03-12)
`export { X } from 'module'` es un re-export — **X no existe como variable** en el archivo actual. Si se agrega `export default X` después → `ReferenceError`. **Fix correcto**: `export { X, X as default } from 'module'` o importar primero con `import { X } from 'module'`. **Mejor aún**: DELETE forwarders deprecated, actualizar imports directamente.

## DRF Serializer sin context en @action custom
**Estado**: RESUELTO (2026-03-12)
`UserDetailSerializer(obj)` sin `context={'request': request}` en acciones custom (`me`, `update_profile`, `restore`). `SerializerMethodField.get_photo_url()` necesita `request` para `build_absolute_uri()`. Sin context → retorna URL relativa (`/media/...`) que no carga en el frontend. SIEMPRE pasar context o usar `self.get_serializer()` (que lo inyecta automáticamente).

## Multi-tenant migration: schemas con estado DB inconsistente
**Estado**: RESUELTO (2026-03-11)
`tenant_stratekaz` tenía objetos DB huérfanos (índices, tablas parciales) de iteraciones de desarrollo previas. `makemigrations` generó migración que fallaba por `DuplicateColumn` / `DuplicateTable`. **Fix**: cleanup nuclear via `pg_class` query → `DROP TABLE/INDEX/SEQUENCE IF EXISTS ... CASCADE` + `DELETE FROM django_migrations` → re-run `migrate_schemas`. **Lección**: antes de migrar modelos grandes (TenantModel rewrite), verificar estado DB de TODOS los tenant schemas, no solo el primero.

## Tenant schemas via syncdb: migraciones fallan por objetos inexistentes
**Estado**: RESUELTO (2026-03-12)
Los tenant schemas creados con `--run-syncdb` tienen la DB correcta pero Django NO registró las migraciones individuales que construyeron esa DB. Resultado: `AlterUniqueTogether` falla con `ValueError (0 constraints)`, `RenameIndex` falla con `relation X does not exist`, `AddField` falla con `DuplicateColumn`. **Fix aplicado**: `migrate_schemas <app> <migration> --fake` para las 8 apps pendientes en los 5 tenant schemas. Todas fakeadas exitosamente. **Lección**: para tenants creados via syncdb, SIEMPRE usar `--fake` ya que la DB está correcta, solo faltan los registros en `django_migrations`.

## FK→IntegerField: collision de nombre de columna DB
**Estado**: RESUELTO (2026-03-11)
Al reemplazar `ForeignKey requisito_legal` (DB column `requisito_legal_id`) con `PositiveBigIntegerField requisito_legal_id` (también DB column `requisito_legal_id`), la migración falla con `DuplicateColumn`. **Fix**: agregar `db_column='requisito_legal_ext_id'` al nuevo campo para evitar colisión. **Lección**: al cambiar FK→IntegerField cross-module, SIEMPRE verificar que el nombre del nuevo campo no colisione con el `_id` auto-generado del FK anterior.

## SystemModuleTree: campo `orden` NO `order`
**Estado**: RESUELTO (2026-03-08)
El tipo `SystemModuleTree` usa `orden` (español) como campo de ordenamiento, NO `order`. TypeScript no siempre detecta `.order` como error si el tipo no es estricto. Siempre usar `a.orden - b.orden` para sorting de módulos.

## Tab calidad: API backend ≠ ruta frontend
**Estado**: DOCUMENTADO (2026-03-08)
Al migrar tab calidad de HSEQ a SGI, la ruta frontend cambió (`/sistema-gestion/calidad`) pero la API backend sigue en `/api/hseq/calidad/` porque la Django app sigue en `hseq_management`. NO cambiar `BASE_URL` en `calidadApi.ts`.

## RESUELTO: Vite manualChunks — Pantalla Blanca en Produccion
**Estado**: RESUELTO (2026-02-21)
**Solucion aplicada**: Simplificado de 10 chunks vendor a solo 3 chunks de librerias puras sin React:
- `vendor-3d`: solo `three/` (676 KB) — @react-three/* queda en auto-chunk
- `vendor-editor`: solo `prosemirror-*` (227 KB) — @tiptap/react queda en auto-chunk
- `vendor-export`: solo `jspdf` + `html-to-image` (372 KB) — react-to-print queda en auto-chunk
**Regla clave**: NUNCA poner paquetes que usen React hooks en manualChunks separados de React.
**Archivo**: `frontend/vite.config.ts` lineas 109-134

## VPS Deploy: nombres de servicios systemd
**Estado**: PERMANENTE
Los servicios systemd en el VPS tienen prefijo `stratekaz-`. **NUNCA** usar nombres genéricos:
- ❌ `gunicorn`, `celery`, `celery-beat` → **Unit not found**
- ✅ `stratekaz-gunicorn`, `stratekaz-celery`, `stratekaz-celerybeat`

Comando correcto:
```bash
sudo systemctl restart stratekaz-gunicorn stratekaz-celery stratekaz-celerybeat
```

## drf-spectacular: filterset_fields y serializer fields DEBEN coincidir con modelo
**Estado**: RESUELTO (2026-03-13)
`manage.py spectacular --validate` crashea con `TypeError: 'Meta.fields' must not contain non-model field names` si:
1. **filterset_fields** usa nombre FK-style (`'proveedor'`) pero el modelo tiene `PositiveBigIntegerField` con sufijo `_id` (`'proveedor_id'`). Fix: usar nombre exacto del campo (`'proveedor_id'`).
2. **Serializer Meta.fields** lista campos que no existen en el modelo (ej: `'created_at'` en modelo sin TimeStamped, `'order'` cuando el campo se llama `'orden'`). Fix: auditar con `Model._meta.get_fields()`.
3. **search_fields** referencia FK traversals (`'proveedor__nombre_comercial'`) pero el campo es IntegerField, no FK. Fix: usar campos cache (`'proveedor_nombre'`) o eliminar.

**14 archivos corregidos** en commit `90f9902`. Validación final: 0 errores.

## Backend Gotchas

### `request.user.empresa` NO EXISTE
`core.User` no tiene atributo `empresa`. Usar `get_tenant_empresa()` de `apps.core.base_models.mixins`.
Muchos ViewSets en modulos no-TH/GE aun tienen este bug (workflow_engine, admin_finance, sales_crm, production_ops, motor_riesgos, motor_cumplimiento, logistics_fleet, hseq_management).

### ConsecutivoConfig.empresa_id es PositiveBigIntegerField
NO es FK. Usar `empresa_id=empresa.id`, nunca `empresa=empresa`.

### Tildes en nombres de columnas/tablas — doble peligro
**El problema es MIXTO**: algunos modelos Django SÍ usan tildes en field names (`año`, `señalizacion_adecuada`), otros NO (`danos_vehiculo_propio`, `senalizacion` de sagrilaft). NUNCA asumir que todos deben ser ASCII o todos con tilde.

**Diagnóstico autoritativo** (dejar que Django diga qué espera):
```python
# Shell: carga lo que existe en DB, compara con lo que Django espera
from django.apps import apps
from django.db import connection
schema = 'tenant_stratekaz'
with connection.cursor() as c:
    c.execute('SELECT table_name, column_name FROM information_schema.columns WHERE table_schema=%s', [schema])
    existing = set((r[0], r[1]) for r in c.fetchall())
    c.execute('SELECT table_name FROM information_schema.tables WHERE table_schema=%s AND table_type=\'BASE TABLE\'', [schema])
    existing_tables = set(r[0] for r in c.fetchall())
for model in apps.get_models():
    table = model._meta.db_table
    if table not in existing_tables: continue
    for field in model._meta.local_fields:
        if hasattr(field, 'column') and field.column and (table, field.column) not in existing:
            print(f'MISSING: {table}.{field.column}')
```

**Regla**: SIEMPRE usar el diagnóstico anterior antes de hacer renames masivos. El HINT de psycopg2 dice qué columna EXISTE en DB; el error dice qué columna Django ESPERA. Esas son las dos fuentes de verdad.

**Tablas que sí usan tildes** (verificado): `hseq_programa_auditoria.año`, `emergencias_*.señalizacion_*`, `analytics_*.tamaño_*`, `documental_*.tiempo_retencion_años`.
**Tablas que NO usan tildes** (renombradas a ASCII): `riesgos_viales_incidente.danos_*`, `sagrilaft_*.senal_*`.

### Migration leaf node conflict — NO usar makemigrations --merge si tocan los mismos campos
Si producción tiene `0010_X` (campos A, B) y local creó `0010_Y` (campos A, B, C) — ambos dependen del mismo `0009`:
- `makemigrations --merge` crea `0011_merge` que ejecuta AMBOS → **FALLA**: columnas A y B duplicadas
- **Solución correcta**:
  1. Crear `0010_X.py` localmente con exactamente las operaciones de producción (solo campos A, B)
  2. Eliminar `0010_Y.py` del repo
  3. Crear `0011_Y.py` con SOLO las ops nuevas (campo C), dependiendo de `0010_X`
  4. En VPS: si el archivo era untracked → `rm backend/apps/core/migrations/0010_X.py` **antes** del `git pull`

**Síntoma en VPS**: `error: The following untracked working tree files would be overwritten by merge` → el archivo ya existe en VPS como untracked → hacer `rm` antes del pull. Ver Sprint 32.

### NUNCA modificar migraciones ya aplicadas en producción
**El peor error posible**: editar `0001_initial.py` para agregar campos a un base model (`TenantModel`, `SoftDeleteModel`, `AuditModel`) DESPUÉS de que ya fue aplicada. Django ve el migration record como "applied" y no re-corre nada. Las columnas nunca se crean en los schemas existentes.

**Lo que debió pasar**:
```bash
# Modificar base model → makemigrations → migrate_schemas ✅
python manage.py makemigrations  # genera 0002_add_auditmodel_fields.py
python manage.py migrate_schemas  # aplica a TODOS los tenants
```

**Síntoma**: `column tabla.campo does not exist` en producción, pero `migrate_schemas` dice "No migrations to apply".

**Fix de emergencia** (SQL repair sobre todas las tablas con `updated_at`):
```python
# Shell con venv activo y DJANGO_SETTINGS_MODULE correcto
from django.db import connection
columns_to_add = [
    ('is_active', 'boolean NOT NULL DEFAULT true'),
    ('is_deleted', 'boolean NOT NULL DEFAULT false'),
    ('deleted_at', 'timestamp with time zone NULL'),
    ('deleted_by_id', 'integer NULL'),
    ('created_by_id', 'integer NULL'),
    ('updated_by_id', 'integer NULL'),
]
schemas = ['tenant_stratekaz', 'tenant_grasasyhuesos']
for schema in schemas:
    with connection.cursor() as c:
        c.execute('SELECT table_name FROM information_schema.tables WHERE table_schema=%s AND table_type=\'BASE TABLE\' AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=%s AND table_name=tables.table_name AND column_name=\'updated_at\')', [schema, schema])
        for (table,) in c.fetchall():
            for col, defn in columns_to_add:
                c.execute(f'ALTER TABLE {schema}.{table} ADD COLUMN IF NOT EXISTS {col} {defn}')
```

**Verificación post-repair**:
```python
# Cero columnas faltantes = DB consistente con modelos Django
from django.apps import apps
from django.db import connection
# (ver sección "Tildes en nombres de columnas" para el script completo)
```

### Phantom Migrations
Si `django_migrations` tiene records pero las tablas no existen: DELETE los records antes de re-migrar.

### Celery Beat en schema public
Las tablas `django_celery_beat_*` deben existir en schema `public`. Si faltan, crearlas con `CREATE TABLE ... LIKE`.

### App Labels
- Encuestas: `encuestas` (NO `gestion_estrategica_encuestas`)
- **Contexto: `gestion_estrategica_contexto`** (NO `contexto`). Este es el UNICO app bajo gestion_estrategica/ con label custom largo. Todos los demas (configuracion, organizacion, identidad, planeacion, encuestas, gestion_proyectos, etc.) usan el nombre corto como label.
- FKs, migration dependencies, y `apps.get_model()` DEBEN usar el label exacto del apps.py
- Tenant import: `from apps.tenant.models import Tenant` (singular, NO `tenants`)

### DRF PrimaryKeyRelatedField(queryset=None) — NUNCA usar
`PrimaryKeyRelatedField` hace `assert queryset is not None or read_only` en su `__init__`, ANTES de que el serializer `__init__` pueda sobrescribirlo. Si necesitas lazy queryset para evitar circular imports:
```python
# ❌ FALLA en producción:
cargo_id = serializers.PrimaryKeyRelatedField(queryset=None, required=True)
def __init__(self, *args, **kwargs):
    super().__init__(*args, **kwargs)
    self.fields['cargo_id'].queryset = Cargo.objects.filter(is_active=True)

# ✅ CORRECTO: IntegerField + validate manual
cargo_id = serializers.IntegerField(required=True)
def validate_cargo_id(self, value):
    from django.apps import apps
    Cargo = apps.get_model('core', 'Cargo')
    try:
        Cargo.objects.get(id=value, is_active=True, is_system=False)
    except Cargo.DoesNotExist:
        raise serializers.ValidationError('Cargo no encontrado.')
    return value
```
**Nota**: En el viewset, `validated_data['cargo_id']` será un int (no objeto). Hacer `Cargo.objects.get(id=cargo_id)` explícitamente.
Ejemplo real: Sprint 33 — `CrearAccesoProveedorSerializer` crasheaba en producción con `AssertionError`.

### Serializer empresa Field — NUNCA exponer como required
DRF con `fields = '__all__'` expone `empresa` como campo requerido al frontend. SIEMPRE:
1. Agregar `empresa` a `read_only_fields` en el serializer
2. Auto-asignar en `perform_create` via `get_tenant_empresa()`
```python
class MySerializer(serializers.ModelSerializer):
    class Meta:
        model = MyModel
        fields = '__all__'
        read_only_fields = ['empresa', 'created_by']

# En el ViewSet:
def perform_create(self, serializer):
    empresa = get_tenant_empresa()
    serializer.save(created_by=self.request.user, empresa=empresa)
```

### Frontend↔Backend Field Name Mismatch
Siempre verificar que los nombres de campos en formularios React coincidan EXACTAMENTE con los del modelo Django. Ejemplo real: ProgramacionFormModal usaba `nombre`, `ubicacion`, `iso_9001` pero el backend tenia `periodo`, `lugar`, `incluye_calidad`. Error silencioso 400.

### Backend ViewSet filterset_fields desincronizados
Si un modelo Django pierde campos (ej: se eliminan booleans `aplica_sst`, `aplica_ambiental`), el ViewSet `filterset_fields` que los referencia lanzara 500 error. Siempre actualizar `filterset_fields` cuando se modifican campos del modelo. Ejemplo real: MatrizComunicacionViewSet (Sprint 25).

### estadisticas endpoint con None keys
Cuando un `.values('campo').annotate()` agrupa por un FK nullable, el key puede ser `None`. Siempre manejar: `{k or 'Sin grupo': v for k, v in ...}`. Ejemplo real: Stakeholders `por_grupo` (Sprint 25).

### User model has `cargo` FK, NOT `role`
`core.User` tiene `cargo` (FK a Cargo), NO `role`. Para filtrar admins:
- CORRECTO: `Q(cargo__rol_sistema__code='ADMIN')` o `Q(is_superuser=True)`
- INCORRECTO: `Q(role__code='ADMIN')` → crash `Cannot resolve keyword 'role'`
- Para acceder a roles via M2M: `user.user_roles.filter(role__code='ADMIN')` (no directo en User)
Ejemplo real: `send_weekly_reports` Celery task crasheaba con Sentry error (Sprint 28).
**Archivo**: `backend/apps/core/tasks.py`

### Field Names (NO son `nombre`)
- `Area.name`, `Cargo.name` (usar `area__name` en annotations)
- `Colaborador.usuario` (NO `user`)

### settings.FRONTEND_URL — NUNCA usar directo
**SIEMPRE** `getattr(settings, 'FRONTEND_URL', 'https://app.stratekaz.com')`. NUNCA `settings.FRONTEND_URL`.
Razon: Si no esta definido en settings, `settings.FRONTEND_URL` lanza `AttributeError` y crashea toda la funcion.
Ejemplo real: `email_service.py:124` crasheaba TODOS los emails en produccion (Sprint 26-TH).
**Ahora FRONTEND_URL existe en base.py/production.py**, pero mantener `getattr` por seguridad.

### Email from_email double-wrapping
`DEFAULT_FROM_EMAIL` puede ya tener formato `"Name <email>"`. Si el codigo hace `f"{name} <{from_email_addr}>"` sobre esto, genera `"Name <Name <email>>"` que SMTP rechaza.
**Fix**: Verificar `if '<' in from_email_addr` antes de envolver.
Ejemplo real: `"StrateKaz <StrateKaz <notificaciones@stratekaz.com>>"` → "Invalid address" (Sprint 26-TH).

### Removed model fields referenced in queries
Si una migracion elimina un campo (ej: `tipo_servicio_legacy`), TODAS las queries que lo referencian crashean.
Buscar `grep -r "campo_eliminado"` antes de eliminar campos de modelos.
Ejemplo real: `email_service.py` buscaba `tipo_servicio_legacy='EMAIL'` despues de migrar el campo (Sprint 26-TH).

### TemaEncuesta / ParticipanteEncuesta NOT NULL constraint
Nested serializers para crear Temas/Participantes inline funcionan, pero si se crea un tema DIRECTAMENTE (no inline), el serializer necesita `encuesta` en fields con `required=False` + validacion en `perform_create`.
Ejemplo real: Sprint 25-hotfix + Sprint 26-TH.

### Auto-created users get USUARIO cargo (no ADMIN)
Desde Sprint 29, `HybridJWTAuthentication._create_user_from_tenant_user()` asigna `cargo=USUARIO` (mínimo privilegio) a usuarios auto-creados. Solo superadmins reciben `cargo=ADMIN`.
**Sidebar cache invalidation sigue siendo necesaria**: `useUpdateUser` y `useSaveCargoSectionAccess` invalidan `['modules', 'sidebar']` + `['modules', 'tree']` y llaman `refreshUserProfile()` cuando se edita el cargo del usuario activo.

## Design System Gotchas

### BaseModal sizes — NO existen 5xl ni 6xl
`BaseModal` soporta: `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl`, `full`. Si necesitas más grande que `4xl`, usar `full`. Ejemplo real: DocumentoFormModal usaba `5xl`, PlantillaFormModal usaba `6xl` → ambos mapeados a `full`.

### BaseModal footer prop — NUNCA botones inline en body
Botones de acción (Cancelar/Guardar) van en el prop `footer` de BaseModal (sticky en bottom). Si el form es un `<form>`, el submit button fuera del form usa `onClick={handleSubmit(onSubmit)}` en vez de `type="submit"`.

### Switch component requiere Controller (no register)
`@/components/forms/Switch` extiende `Omit<InputHTMLAttributes, 'type' | 'size' | 'onChange'>`. Como omite `onChange`, NO se puede usar con `register()` de react-hook-form. Usar `Controller`:
```tsx
<Controller
  name="mi_campo"
  control={control}
  render={({ field }) => (
    <Switch
      label="Mi Toggle"
      checked={field.value}
      onCheckedChange={(checked) => field.onChange(checked)}
    />
  )}
/>
```

### replace_all con trailing whitespace — PELIGRO
Al hacer `replace_all` con `old_string="Accion "` y `new_string="Acción"` (sin espacio trailing), "Accion eficaz" se convierte en "Accióneficaz". **Regla:** Cuando `old_string` tiene trailing space, `new_string` DEBE conservar ese space.

### Grid responsive obligatorio en modales
TODO `grid-cols-N` en modales DEBE tener breakpoint mobile-first:
- `grid-cols-2` → `grid-cols-1 sm:grid-cols-2`
- `grid-cols-3` → `grid-cols-1 sm:grid-cols-3`
- `grid-cols-4` → `grid-cols-2 sm:grid-cols-4`
Sin excepciones. Dashboards/pages pueden ser más flexibles.

## Frontend Gotchas

### axios-config: SIEMPRE default import, NUNCA `{ api }` named export
`axios-config.ts` solo tiene `export default axiosInstance`. No existe ningún named export:
```typescript
import apiClient from '@/api/axios-config';   // ✅ CORRECTO
import axiosInstance from '@/api/axios-config'; // ✅ CORRECTO (alias diferente, mismo default)
import { api } from '@/api/axios-config';        // ❌ ERROR EN VITE BUILD
import { axiosInstance } from '@/api/axios-config'; // ❌ ERROR EN VITE BUILD
```
**Tramposo**: `tsc --noEmit` con `moduleResolution: bundler` puede no detectarlo. El error solo aparece en `vite build` (producción) cuando Rollup resuelve los módulos estrictamente. Ver Sprint 32, Bug 4.

### ProtectedRoute — NEVER depend on Zustand persist hydration
**Estado**: RESUELTO (2026-02-23) — 3 iteraciones
Zustand v4 `persist` middleware hydrates async from localStorage. ALL approaches to "wait for hydration" failed in production:
1. Custom `_hasHydrated` flag in `onRehydrateStorage` callback — not fired reliably
2. Official `persist.hasHydrated()` + `persist.onFinishHydration()` — still async race
3. Timeout failsafe (1500ms) — tenant users still kicked before timeout fires

**Solución definitiva**: Synchronous `localStorage.getItem('access_token')` check in ProtectedRoute.
```typescript
function hasTokensInStorage(): boolean {
  try {
    return !!localStorage.getItem('access_token') && !!localStorage.getItem('refresh_token');
  } catch { return false; }
}
```
If tokens exist but `isAuthenticated=false`, show spinner (Zustand is hydrating). If no tokens AND not authenticated, redirect to `/login`. For tenant users, also fallback to `localStorage.getItem('current_tenant_id')`.

**REGLA**: NUNCA agregar `isLoadingUser`, `_hasHydrated`, ni ningún gate asíncrono a ProtectedRoute. El check debe ser 100% síncrono.
**Archivo**: `frontend/src/routes/ProtectedRoute.tsx`

### isLoadingUser in ProtectedRoute causes infinite render oscillation
Adding a loading spinner gated on `isLoadingUser` to ProtectedRoute UNMOUNTS `DashboardLayout`. But `DashboardLayout` is the component that calls `loadUserProfile()` (which sets `isLoadingUser`). This creates an infinite mount/unmount cycle → permanent spinner.
**REGLA**: Never conditionally unmount DashboardLayout based on user loading state.

### forceLogout vs logout — Axios interceptor MUST use forceLogout
`logout()` calls `authAPI.logout()` (API call to blacklist refresh token). If the refresh token already failed, calling `logout()` from the axios interceptor causes an infinite loop.
**Fix**: `forceLogout()` cleans localStorage + Zustand + React Query WITHOUT any API call. Always use in axios interceptor catch block.
**Archivo**: `store/authStore.ts` (forceLogout), `api/axios-config.ts` (interceptor)

### `window.location.href` en axios interceptor = Ctrl+Shift+R logout
Aunque `forceLogout()` fue agregado en Sprint 27, el catch del refresh interceptor aún tenía `window.location.href = '/login'` como segunda línea. Esto causaba que un **hard reload** (Ctrl+Shift+R):
1. El browser borraba las cabeceras en tránsito → 401
2. El refresh token NO estaba vencido (era válido), pero el request fallaba
3. `window.location.href = '/login'` → hard redirect → se perdía el estado → usuario fuera
**Regla definitiva**: NUNCA usar `window.location.href` en el interceptor de axios. Dejar que `forceLogout()` actualice Zustand y ProtectedRoute redirija via React Router naturalmente.
**Fix aplicado (Sprint 29)**: Eliminada esa línea de `api/axios-config.ts`.

### Sidebar query invalidation on cargo/permission changes
When a user's cargo is changed or permissions are modified, MUST invalidate:
- `['modules', 'sidebar']` — sidebar navigation tree
- `['modules', 'tree']` — full module tree for RBAC config
- If editing own user: `useAuthStore.getState().refreshUserProfile()` to reload `permission_codes` + `section_ids`
**Hooks that do this**: `useUpdateUser` (useUsers.ts), `useSaveCargoSectionAccess` (useCargos.ts)

### DRF DecimalField returns STRING
Siempre wrappear con `Number()` antes de `.toFixed()`.
Helper pattern: `const dec = (v: string | number | null | undefined): number => Number(v ?? 0);`

### DRF Paginated responses
```typescript
const extractResults = <T,>(data: unknown): T[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const d = data as { results?: T[] };
  return d.results ?? [];
};
```

### Frontend types MUST match backend serializers EXACTLY
Massive field name mismatches found in Admin Finance + Accounting (Sprint 25E). Common patterns:
- `activo` / `activa` -> backend uses `is_active` consistently
- `padre` -> backend uses `cuenta_padre`, `centro_padre` (explicit FK name)
- `tipo_documento` -> could be `tipo_identificacion` (Tercero) or `clase_documento` (TipoDocumentoContable)
- `plan` -> `plan_cuentas` (explicit FK)
- Backend `estado` enum values vary by model — always check serializer choices
- List serializers often have `_nombre`, `_codigo`, `_display` computed fields not on the model
- DecimalField properties always typed as `string` in frontend (DRF serialization)
**Rule**: Always read backend serializers before writing frontend types. Never guess field names.

### Riesgos module: Each sub-domain has different API base paths
- riesgos_procesos: `/api/riesgos/procesos/`
- ipevr: `/api/riesgos/ipevr/`
- aspectos_ambientales: `/api/riesgos/aspectos-ambientales/`
- riesgos_viales: `/api/riesgos/viales/`
- seguridad_informacion: `/api/riesgos/seguridad-info/`
- sagrilaft_ptee: `/api/riesgos/sagrilaft/`
Always verify the exact URL from backend `urls.py` before creating API clients.

### Riesgos API double `/api/` prefix
Frontend API clients in `features/riesgos/api/` had paths like `/api/riesgos/procesos/` but `axiosInstance.baseURL` already includes `/api`. Result: requests to `/api/api/riesgos/...` → 404.
**Fix**: Strip `/api` prefix from all 7 riesgos API files. Use `/riesgos/procesos/` not `/api/riesgos/procesos/`.

### Factory `useCreate` doesn't invalidate custom query keys
`createCrudHooks` factory generates `useCreate` that only invalidates `keys.lists()`. If you have custom query keys (e.g., `strategicKeys.activePlan = ['plans', 'active']`), those are NEVER refreshed after create.
**Fix**: Override factory hook with custom `useMutation` that also invalidates the custom key:
```typescript
export const useCreatePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activePlan }); // custom key
      toast.success('...');
    },
  });
};
```
**Real case**: Plan creation showed success toast but PlaneacionTab still showed "Sin Plan Estratégico" → KPIs tab blank.

### Nullable FK chains — guard the full chain
`Colaborador.usuario` is `OneToOneField(null=True)`. Code like `obj.responsable_empresa.usuario.get_full_name()` crashes when `usuario` is None.
**Fix**: Guard every nullable step: `if obj.fk and obj.fk.nested_fk`
```python
# WRONG:
parte.responsable_empresa.usuario.get_full_name() if parte.responsable_empresa else ''
# RIGHT:
parte.responsable_empresa.usuario.get_full_name() if parte.responsable_empresa and parte.responsable_empresa.usuario else ''
```
Also add nested FK to `select_related`: `select_related('responsable_empresa', 'responsable_empresa__usuario')`

### Accounting API custom actions
ViewSets have many custom `@action` endpoints. Always check `urls.py` for custom routes:
- comprobantes: `contabilizar/`, `anular/`, `aprobar/`, `recalcular_totales/`, `por_periodo/`
- cuentas: `arbol/`, `movimientos/`, `subcuentas/`, `saldos/`
- cola: `reintentar/`, `cancelar/`, `pendientes/`, `errores/`, `reintentar_todos/`, `estadisticas/`
Pattern: `apiClient.post(\`\${BASE}/\${id}/action_name/\`).then(r => r.data)`

### ResponsiveTable generic constraint
```typescript
<ResponsiveTable<T & Record<string, unknown>>>
data={items as (T & Record<string, unknown>)[]}
// Action handlers: as unknown as T
```

### useResponsive() vs window.innerWidth
- Paginas autenticadas: usar `useResponsive()` hook centralizado
- Paginas publicas (sin auth context): usar `window.innerWidth` directamente

### Backend API field names
Siempre en ingles (`message`, NO `mensaje`) para matchear tipos del frontend.

### Email templates — Siempre inline styles, nunca clases CSS
Los clientes de email (Gmail, Outlook, Apple Mail) NO renderizan `<style>` blocks ni clases CSS externas. TODO el styling en emails Django debe ser inline: `style="color: #3b82f6; background-color: #eff6ff;"`.
Patrón para colores de marca en Celery tasks:
```python
# tasks.py
def send_email_task(self, ..., primary_color='#3b82f6', secondary_color='#1e40af'):
    html_content = render_to_string('emails/template.html', {
        'primary_color': primary_color,
        'current_year': datetime.now().year,
    })

# views.py (llamada al task)
try:
    primary_color = connection.tenant.primary_color or '#3b82f6'
    secondary_color = connection.tenant.secondary_color or '#1e40af'
except Exception:
    primary_color, secondary_color = '#3b82f6', '#1e40af'
task.delay(..., primary_color=primary_color, secondary_color=secondary_color)
```
En el template: `style="color: {{ primary_color|default:'#3b82f6' }}"` (default es defensivo).

### Avatar upload — Patrón de invalidación correcta
`authAPI.uploadPhoto(file)` actualiza `User.photo` en backend. El signal `sync_user_photo_to_colaborador` sincroniza automáticamente a `Colaborador.foto`. En frontend, después de upload SIEMPRE hacer dos cosas:
1. `queryClient.invalidateQueries({ queryKey: miPortalKeys.perfil() })` — recarga datos ESS
2. `useAuthStore.getState().refreshUserProfile()` — recarga el perfil en authStore (header/avatar del layout)
Sin el paso 2, el avatar del header del dashboard no se actualiza hasta recarga manual.
**Archivo**: `features/mi-portal/api/miPortalApi.ts` → `useUploadMiPhoto` hook

## Production Gotchas

### Health check 404
NO es bug. `SHOW_PUBLIC_IF_NO_TENANT_FOUND=False` rechaza requests sin tenant header.

### Git pull falla en VPS
- **Archivos tracked modificados** (ej: `package-lock.json` despues de `npm install`): Usar `git checkout -- .` ANTES de `git pull`. El deploy.sh ya lo hace automaticamente.
- **Archivos untracked** que conflictuan: `rm` el archivo y reintentar `git pull`.
- **Migraciones generadas en VPS** que conflictuan con repo: `git clean -fd backend/apps/*/migrations/` elimina untracked migrations antes del pull.

### VPS Migration --fake para migraciones pre-aplicadas (2026-03-02)
**Problema:** Migraciones aplicadas manualmente en VPS (via makemigrations+migrate directos) no existen en el repo. Al deployar commit con las mismas migraciones, Django intenta re-ejecutar → `DuplicateColumn` o `DuplicateTable`.
**Solución:** Fake las migraciones que ya están aplicadas en la DB:
```bash
source /opt/stratekaz/backend/venv/bin/activate
cd /opt/stratekaz/backend
python manage.py migrate disenador_flujos --fake
python manage.py migrate mejora_continua --fake
# etc. para cada app con migraciones pre-existentes
```
**Diagnóstico:** Si ves `column X of relation Y already exists` → esa migración ya fue aplicada manualmente. Fake it.
**Prevención:** NUNCA correr `makemigrations` directamente en VPS. Siempre crear migraciones localmente, commit, y deploy.

### VPS venv path (2026-03-02, actualizado 2026-03-11)
**Problema:** `source venv/bin/activate` falla porque el venv está en `/opt/stratekaz/backend/venv/`, NO en `/opt/stratekaz/venv/`.
**Solución:** SIEMPRE usar `source backend/venv/bin/activate` (desde `/opt/stratekaz/`) o ruta absoluta `source /opt/stratekaz/backend/venv/bin/activate`.

### VPS systemd service names (2026-03-11)
**Problema:** Los servicios tienen prefijo `stratekaz-`, NO son nombres genéricos.
**Nombres correctos:** `stratekaz-gunicorn`, `stratekaz-celery`, `stratekaz-celerybeat` (NO `gunicorn`, `celery`, `celerybeat`).
**Restart:** `sudo systemctl restart stratekaz-gunicorn stratekaz-celery stratekaz-celerybeat`

### VPS npm run build env vars (2026-03-11)
**Problema:** Las env vars `VITE_API_URL`, `VITE_BASE_DOMAIN`, `VITE_SENTRY_DSN` ya están configuradas en el `.env` del frontend en VPS.
**Solución:** NO es necesario pasarlas inline con `npm run build`. Solo `npm run build` funciona.

### Schema changes
Despues de cambios de schema, siempre reiniciar gunicorn Y limpiar localStorage del browser.

### CI Workflows — Quality Gates (actualizado 2026-03-11)
Los GitHub Actions (CI, CodeQL, PR Checks) corren en servidores de GitHub, NO en el VPS. Deploy es manual e independiente. Tras QA-QUALITY: ESLint threshold=810 warnings, pytest/Black/Ruff son blocking (NO continue-on-error), pip-audit/npm-audit siguen como non-blocking. Checks criticos que bloquean: TypeScript (`tsc --noEmit`), Vite build, pytest, Black, Ruff, ESLint.

### Frontend rebuild sin Sentry DSN
Si haces `npm run build` sin `VITE_SENTRY_DSN`, el frontend se compila sin Sentry. Siempre usar el comando completo con todas las env vars (ver deploy.md seccion 9).

## Frontend API files with wrong axios import (Sprint 34)

**Síntoma:** API calls fail silently — no JWT token sent, endpoints return 401 or don't exist.

**Causa:** Some auto-generated API files used `import axios from 'axios'` instead of `import apiClient from '@/api/axios-config'`, AND used wrong `/api/v1/` prefix.

**Fix:** Always use `import apiClient from '@/api/axios-config'` (default export) and correct API prefix `/api/` (no `/v1/`). Replace all `axios.get/post/patch/delete` with `apiClient.get/post/patch/delete`.

**Afectados Sprint 34:** `almacenamientoApi.ts`, `comprasApi.ts`, `programacionApi.ts` — all 3 had same issue.

## Double /api/ prefix in BASE_URL constants (Sprint 35)

**Síntoma:** API calls return 404 — requests go to `/api/api/module/...` instead of `/api/module/...`.

**Causa:** `axiosInstance.baseURL` ya incluye `/api` desde `VITE_API_URL = 'http://localhost:8000/api'`. Si un archivo de API define `const BASE_URL = '/api/hseq/calidad'`, axios combina: `baseURL + BASE_URL` → `http://localhost:8000/api` + `/api/hseq/calidad` → `/api/api/hseq/calidad/...` → 404.

**Regla:** BASE_URL en frontend NUNCA debe incluir `/api/`. Solo la ruta relativa al módulo:
```typescript
// ❌ INCORRECTO — causa doble /api/
const BASE_URL = '/api/hseq/calidad';
const BASE_URL = '/api/supply-chain';
const BASE_URL = '/api/sales-crm';

// ✅ CORRECTO — solo la ruta relativa
const BASE_URL = '/hseq/calidad';
const BASE_URL = '/supply-chain';
const BASE_URL = '/sales-crm';
```

**También corregido:** Motor Cumplimiento usaba `/motor_cumplimiento/` (nombre del Django app) en vez de `/cumplimiento/` (ruta registrada en `config/urls.py`).

**Afectados Sprint 35:** 32 archivos en 10 módulos (supply-chain, hseq, cumplimiento, sales-crm, production-ops, logistics-fleet, admin-finance, accounting, analytics, gestion-estrategica).

---

## DRF @action URL: Guiones vs Guiones Bajos (2026-02-27)
> Fuente de verdad: [audit-api-sync.md](audit-api-sync.md)

**Problema:** DRF `@action(detail=False)` genera URL con el nombre del método tal cual. `def por_vencer()` → `/por_vencer/`. Si el frontend espera `/por-vencer/` → 404.
**Solución:** Siempre agregar `url_path='kebab-case'` en actions con guiones bajos:
```python
@action(detail=False, methods=['get'], url_path='por-vencer')
def por_vencer(self, request):
```

## DRF ViewSet list() ≠ custom action URL (2026-02-27)
**Problema:** `router.register(r'estadisticas', EstadisticasViewSet)` crea `GET /estadisticas/` (list). Frontend llamaba `/estadisticas/resumen/` pensando que había un action `resumen` → 404.
**Regla:** Si el ViewSet solo tiene `list()`, la URL es la base del router, SIN sufijo de action.

## SoftDeleteModel NO tiene is_active (2026-02-27)
**Problema:** `SoftDeleteModel` solo provee `is_deleted`. `ActivableModel` provee `is_active`. Filtrar `is_active=True` en un modelo que hereda solo de `SoftDeleteModel` → 500 FieldError.
**Regla:** El `SoftDeleteManager` ya filtra `is_deleted=False` por defecto. No agregar filtros redundantes.
```python
# ❌ MAL — is_active no existe en modelos sin ActivableModel
Area.objects.filter(is_active=True, is_deleted=False)
# ✅ BIEN — SoftDeleteManager ya excluye eliminados
Area.objects.values('id', 'name', 'code')
```

## FK con valor 0 en formularios React (2026-02-27)
**Problema:** `INITIAL_FORM` con `tipo_contrato: 0, responsable_proceso: 0`. Al hacer PATCH, Django busca `User.objects.get(pk=0)` → "Clave primaria '0' inválida".
**Regla:** Antes del submit, eliminar campos FK con valor `0` o falsy:
```typescript
if (!data.tipo_contrato) delete data.tipo_contrato;
if (!data.responsable_proceso) delete data.responsable_proceso;
```

## Soft-Delete + unique=True a nivel DB — Conflicto (2026-03-03)
**Problema:** `unique=True` en campo de modelo crea constraint a nivel PostgreSQL. Al hacer soft-delete (solo poner `deleted_at`), el registro eliminado SIGUE ocupando el slot único. Intentar crear un nuevo registro con el mismo valor → 400 "ya existe".
**Síntoma:** Serializer-level `UniqueValidator(queryset=Model.objects.filter(deleted_at__isnull=True))` NO basta — la constraint DB rechaza ANTES de que DRF valide.
**Solución (patrón definitivo):**
1. Quitar `unique=True` del field
2. Agregar `UniqueConstraint(condition=Q(deleted_at__isnull=True))` en `Meta.constraints`
3. En `soft_delete()`: prefijar campo con `DEL-{id}-` para liberar el valor
4. En `restore()`: quitar prefijo `DEL-{id}-`
5. Aumentar `max_length` para acomodar el prefijo
6. Crear migración con `RunPython` para arreglar registros existentes
```python
class Meta:
    constraints = [
        models.UniqueConstraint(
            fields=['campo_unico'],
            condition=Q(deleted_at__isnull=True),
            name='unique_campo_unico_activo',
        ),
    ]
```
**Archivo real:** `gestion_proveedores/models.py`, migración `0004_soft_delete_unique_constraints.py`.

## Cross-module FK en serializer: IntegerField, NO PrimaryKeyRelatedField (2026-03-03)
**Problema:** `UserDetailSerializer` no declaraba explícitamente el campo `proveedor` (FK cross-module a `gestion_proveedores.Proveedor`). DRF auto-generó `PrimaryKeyRelatedField` que falló silenciosamente → `user.proveedor` siempre `undefined` en frontend.
**Causa:** `PrimaryKeyRelatedField` necesita importar el modelo para `queryset`, violando independencia modular. Sin queryset explícito, no puede resolver.
**Solución (patrón definitivo para FKs cross-module en serializers):**
```python
# ❌ MAL — DRF auto-genera PrimaryKeyRelatedField que falla silenciosamente
class UserDetailSerializer(serializers.ModelSerializer):
    class Meta:
        fields = '__all__'  # proveedor FK auto-generado → falla

# ✅ BIEN — IntegerField explícito lee la columna directamente
class UserDetailSerializer(serializers.ModelSerializer):
    proveedor = serializers.IntegerField(source='proveedor_id', read_only=True, allow_null=True)
```
**Regla:** TODOS los FKs cross-module en serializers DEBEN ser `IntegerField(source='campo_id')`. NUNCA confiar en auto-generación de DRF.
**Archivo:** `backend/apps/core/serializers.py`

## Portal-only detection: cargo.code, NO user.proveedor (2026-03-03)
**Problema:** `isPortalOnlyUser()` usaba `user.proveedor` como check primario. Pero `user.proveedor` era `undefined` (ver pitfall anterior). Resultado: portal-only users veían DashboardLayout completo.
**Solución:** Usar `cargo.code === 'PROVEEDOR_PORTAL'` como señal autoritativa:
```typescript
export function isPortalOnlyUser(user: User | null): boolean {
  if (user?.cargo?.code === 'PROVEEDOR_PORTAL') return true;  // Primaria
  if (user?.proveedor && !user.cargo) return true;              // Fallback
  return false;
}
```
**Regla:** `cargo.code` SIEMPRE está disponible en el perfil del usuario (viene del serializer directamente). `user.proveedor` puede fallar si el FK cross-module no está serializado correctamente.
**Archivo:** `frontend/src/utils/portalUtils.ts`

## Redirect loop: guard redirect vs layout redirect (2026-03-03)
**Problema:** `AdaptiveLayout` redirigía portal-only a `/proveedor-portal`. Pero `ProveedorPortalPage` tenía guard `if (!user.proveedor) → Navigate('/dashboard')`. Como `user.proveedor` era `undefined`, el guard redirigía a `/dashboard`, que AdaptiveLayout volvía a redirigir a `/proveedor-portal` → loop infinito.
**Síntoma:** Console: "Throttling navigation to prevent the browser from hanging"
**Solución:** Guard debe usar AMBAS señales: `if (!user.proveedor && !isPortalOnlyUser(user))`
**Regla:** Cuando un layout fuerza ruta, los guards de la página destino DEBEN reconocer al usuario por las MISMAS señales que el layout. Nunca crear guards conflictivos.

## React Query `enabled` con portal users (2026-03-03)
**Problema:** Hooks `useMiEmpresa`, `useMisContratos`, etc. tenían `enabled: Boolean(user.proveedor)` → `false` porque `user.proveedor` era `undefined`. Queries nunca se disparaban.
**Solución:** `useHasProveedor()` hook con fallback:
```typescript
function useHasProveedor(): boolean {
  return useAuthStore((s) => Boolean(s.user?.proveedor) || isPortalOnlyUser(s.user));
}
```
**Regla:** Si un campo puede ser `undefined` por serialización, siempre tener un fallback alternativo para el `enabled` condition.

## document_number unique collision: múltiples users por proveedor (2026-03-03)
**Problema:** `_create_user_for_proveedor()` usaba `proveedor.numero_documento` como `document_number` para TODOS los users del mismo proveedor → `unique=True` constraint → 400 al crear 2do+ usuario.
**Solución:** Generar sufijo UUID si el base_doc ya existe:
```python
base_doc = proveedor.numero_documento or f'PROV-{proveedor.id}'
doc_number = base_doc
if User.objects.filter(document_number=base_doc).exists():
    doc_number = f'{base_doc}-{uuid.uuid4().hex[:6]}'
```
**Regla:** Campos `unique=True` compartidos entre entidades 1:N DEBEN generar valores únicos por registro, no compartir el mismo valor.

## Soft-Delete NO cascadea a usuarios vinculados (2026-03-03)
**Problema:** Al soft-delete de Proveedor, los User vinculados (`usuarios_vinculados`) quedaban activos. Al crear nuevo proveedor con mismo email → "email ya registrado".
**Solución:**
1. `soft_delete()` desactiva usuarios: `self.usuarios_vinculados.filter(is_active=True).update(is_active=False)`
2. `crear_acceso` detecta user con proveedor eliminado y reasigna al nuevo proveedor
**Archivo real:** `gestion_proveedores/models.py` + `viewsets.py`

## Setup-password 500 sin contexto de tenant (2026-03-03)
**Problema:** `/api/core/setup-password/` retornaba 500 porque el usuario nuevo NO tiene JWT ni `X-Tenant-ID` en localStorage. Sin tenant, el query corre en schema `public` donde `core_user` no existe.
**Diagnóstico:** La ruta NO estaba en `public_paths` (siempre public) ni en `public_tenant_paths` (resuelve tenant sin JWT).
**Solución (3 cambios coordinados):**
1. **Middleware** (`middleware.py`): agregar `/api/core/setup-password/` a `public_tenant_paths`
2. **Backend** (viewsets/views): incluir `tenant_id` como query param en el URL del email de setup
3. **Frontend** (`SetupPasswordPage.tsx`): leer `tenant_id` del URL, guardar en localStorage → axios interceptor envía `X-Tenant-ID`
**Clave:** `public_paths` = siempre schema public, sin resolver tenant. `public_tenant_paths` = resuelve tenant via `X-Tenant-ID` sin requerir JWT.
**Archivos:** `middleware.py`, `gestion_proveedores/viewsets.py`, `talent_hub/colaboradores/views.py`, `SetupPasswordPage.tsx`

## Barrel `export *` conflicts — build errors silenciosos (2026-03-05)
**Problema:** Cuando `types/index.ts` usa `export *` de múltiples archivos y 2+ archivos exportan el MISMO nombre (ej: `metodoPagoOptions` en offBoarding.types Y nomina.types), Rollup SILENCIOSAMENTE omite el export ambiguo. Cualquier componente que importa ese nombre → `"X is not exported by index.ts"`.
**Tramposo:** `tsc --noEmit` NO detecta esto. Solo `vite build` (Rollup) lo atrapa.
**Fix:**
1. Renombrar la exportación duplicada en uno de los archivos (ej: `metodoPagoLiquidacionOptions`)
2. O usar re-exports explícitos en `index.ts` en vez de `export *`
**Diagnóstico:** `grep -rh "^export const" types/*.ts | sort | uniq -c | sort -rn | head -20` — cualquier count >1 es potencial conflicto.
**Casos reales (Sprint AUDIT-SYNC HOTFIX):** `metodoPagoOptions`, `MetodoPago` — ambos en offBoarding y nomina.
**Potenciales futuros:** `EstadoVacante`, `NivelEducativo`, `PrioridadVacante` — pre-existentes entre estructuraCargos y seleccionContratacion.

## Phantom imports en componentes tras reescritura de types/hooks (2026-03-05)
**Problema:** Al reescribir types o hooks de un módulo, los componentes que importaban opciones, tipos o hooks que ya no existen rompen el build. Puede haber N componentes afectados.
**Síntoma:** Build falla con `"X is not exported by..."` para opciones como `tipoExamenEgresoOptions`, o hooks como `useRegistrarResultadoExamen`.
**Checklist post-reescritura:**
1. `grep -rn "from '../../types'" components/` — verificar CADA import existe
2. `grep -rn "from '../../hooks/" components/` — verificar CADA hook existe
3. Ejecutar `vite build` (NO solo `tsc`) — atrapa problemas que tsc no ve
**Casos reales:** 6 componentes off-boarding con imports fantasma (ExamenFormModal, ExamenesTab, LiquidacionesTab, PazSalvoFormModal).

## UserListSerializer NO incluye proveedor/cliente (2026-03-06)
**Problema:** `UserListSerializer` solo tiene `origen` (computed), NO `proveedor` ni `cliente` como campos directos. Código que hace `user.proveedor != null` sobre datos de la lista siempre da `false`.
**Síntoma:** `UserImpersonationModal` siempre navegaba a `/dashboard` (nunca detectaba portal users) → conflicto con `AdaptiveLayout.PortalRedirect` → spinner infinito.
**Fix:** SIEMPRE usar `isPortalOnlyUser(user)` de `portalUtils.ts` que checa `cargo.code`. NUNCA `user.proveedor` de la lista API.

## React Router `<Navigate>` renderiza null — flash negro (2026-03-06)
**Problema:** `<Navigate to="/ruta" replace />` renderiza `null` en su render. En dark mode (bg-gray-900), esto causa un flash negro antes de que la navegación complete.
**Fix:** Crear componente `PortalRedirect` que renderiza spinner visible + usa `useNavigate()` en `useEffect`. Ubicado en `AdaptiveLayout.tsx`.

## SelectListItem usa `id`, NO `value` (2026-03-07)
**Problema:** `SelectListItem` (de `select-lists.api.ts`) define `{ id: number; label: string; extra?: ... }`. Pero 8+ componentes mapeaban `u.value` para crear options de `<Select>`:
```tsx
// ❌ u.value es undefined → String(undefined)="undefined" → Number("undefined")=NaN → JSON=null
users.map((u) => ({ value: String(u.value), label: u.label }))

// ✅ u.id es el campo correcto
users.map((u) => ({ value: String(u.id), label: u.label }))
```
**Síntoma:** Toast "éxito" pero el campo siempre se guarda como `null`. El PATCH envía `sponsor: null` porque `Number("undefined") = NaN` y `JSON.stringify(NaN) = null`.
**Tramposo:** El backend acepta `null` (campos nullable) y retorna 200. No hay error visible.
**Archivos afectados:** IniciacionSubTab, PortafolioSubTab, ActividadFormModal, RecursoFormModal, RiesgoFormModal, AreaFormModal, EntregaEppFormModal, ProcesoFormModal.
**Regla:** SIEMPRE usar `u.id` (no `u.value`) al mapear `SelectListItem[]` a options de `<Select>`.

## select_users incluía superusers excluidos (2026-03-07)
**Problema:** `select_users` endpoint tenía `.exclude(is_superuser=True)`. En tenants de prueba con solo el superadmin, el dropdown de usuarios quedaba vacío.
**Fix:** Removido el `exclude`. Superusers son usuarios válidos que pueden ser Sponsor, Gerente, etc.
**Archivo:** `backend/apps/core/views/select_lists.py`

## createCrudHooks().useCreate solo invalida lists() (2026-03-06)
**Problema:** Factory `createCrudHooks` genera `useCreate` que solo invalida `keys.lists()`. Si la página consume un query key custom (ej: `strategicKeys.activeIdentity`), el query NUNCA se refresca tras crear.
**Síntoma:** Toast de éxito pero datos no aparecen (identidad corporativa).
**Fix:** Hook custom con `setQueryData(customKey, newData)` + `refetchQueries({ queryKey: customKey })`.

## Migración faltante — modelos nuevos sin `makemigrations` (2026-03-09)
**Problema:** Se agregaron 4 modelos al juego SST (GameLevel, GameQuizQuestion, GameProgress, GameSession) pero NUNCA se corrió `makemigrations` localmente. El VPS corrió `makemigrations` directo (creando archivos untracked), que luego conflictuaron con la migración del repo.
**Síntoma:** Endpoints registrados (show_urls los muestra) pero retornan 500/404 porque las tablas no existen. `migrate_schemas` dice "No migrations to apply" porque no hay archivos de migración en el repo.
**Fix:** Crear migración manualmente (`0003_gamelevel_...py`), limpiar records huérfanos de `django_migrations`, fake-apply.
**Prevención:** SIEMPRE correr `makemigrations` localmente después de agregar/modificar modelos. Verificar que el archivo `.py` de migración se incluya en el commit. NUNCA correr `makemigrations` en VPS.
**Limpieza VPS:**
```bash
# 1. Borrar archivos de migración huérfanos (untracked)
rm /opt/stratekaz/backend/apps/MODULE/migrations/00XX_orphan.py
# 2. Limpiar records de django_migrations por schema
python manage.py shell -c "
from django.db import connection
from apps.tenant.models import Tenant
for schema in ['public'] + [t.schema_name for t in Tenant.objects.exclude(schema_name='public')]:
    with connection.cursor() as c:
        c.execute(f'SET search_path TO {schema}')
        c.execute(\"DELETE FROM django_migrations WHERE app='APP' AND name LIKE 'orphan_name%'\")
"
# 3. Fake-apply la migración correcta del repo
python manage.py migrate_schemas APP 00XX --fake
```

## Phaser manualChunks — NO incluir paquetes con React hooks (2026-03-09)
**Problema:** Phaser 3 es ~1.4MB. Se agrega como `vendor-phaser` en `vite.config.ts` manualChunks para lazy-loading.
**Regla:** NUNCA incluir paquetes que usen React hooks en manualChunks separados de React (ver pitfall "Vite manualChunks Pantalla Blanca"). Phaser es seguro porque es 100% vanilla JS.
**Archivo:** `frontend/vite.config.ts` — `manualChunks` section

## RBAC batch scripts — import insertion bugs (2026-03-10)
**Problema:** Scripts que insertan imports después del "último import" pueden fallar con imports multi-línea (`import {\n  Icon1,\n} from '...'`). El regex trata `import {` como una línea de import completa e inserta la nueva línea DENTRO del bloque.
**Patrón roto:** `import {\nimport { usePermissions }...\n  Icon,`
**Fix:** Detectar si la línea previa al punto de inserción es `import {` (sin `from`) y mover la inserción ANTES.
**Lección:** Siempre verificar con `npm run build` después de scripts batch. `tsc --noEmit` NO detecta todos los errores de syntax que Vite/esbuild sí detecta.

## RBAC action={} prop — no soporta && directo (2026-03-10)
**Problema:** `action={{ canCreate && (<Button/>) }}` es inválido en JSX — crea un object literal. Solo funciona como children directo en JSX tree.
**Fix:** Usar ternary: `action={canCreate ? <Button/> : undefined}`.

## Cleanup scripts pueden romper build → 401 loop fatal (2026-03-10)
**Estado**: RESUELTO
**Problema:** Scripts batch que eliminan "unused imports" pueden borrar imports que SÍ se usan en JSX (ej: `usePermissions`, `Modules`, `Sections`). Si el build falla, Vite sirve el bundle viejo → posible 401 loop si el bundle viejo tiene bugs de auth.
**Síntoma:** 401 en `/api/core/users/me/` en loop. El archivo `.js` en el error tiene nombre viejo (no el del último build).
**Diagnóstico:** Verificar que `npm run build` pase ANTES de deploy. Si el nombre del JS en el error no coincide con el último build, el build falló.
**Fix:** Restaurar imports eliminados, rebuild, redeploy.
**Lección:** SIEMPRE `npm run build` exitoso antes de deploy. Verificar que el hash del bundle en producción coincida.

## Sub-componentes módulo-level NO heredan scope del padre (2026-03-10)
**Estado**: RESUELTO
**Problema:** Componentes definidos como `const MySection = () => {...}` a nivel de módulo (fuera del componente padre) NO tienen acceso a variables del padre como `canCreate`. Son funciones independientes.
**Síntoma:** `ReferenceError: canCreate is not defined` o error de build.
**Fix:** Cada sub-componente necesita su propio `usePermissions()` + `canDo()`.

## C0 ViewSets con GranularActionPermission → 403 para usuarios normales (2026-03-10)
**Estado**: RESUELTO
**Problema:** ViewSets de plataforma (C0) como `NotificacionViewSet` con `GranularActionPermission` requieren `CargoSectionAccess` que solo admins tienen. Usuarios normales reciben 403 al leer sus propias notificaciones.
**Fix:** Override `get_permissions()` para acciones personales (`no_leidas`, `marcar_leida`) → solo `IsAuthenticated`.
**Patrón:**
```python
PERSONAL_ACTIONS = ('no_leidas', 'marcar_leida', 'marcar_todas_leidas')
def get_permissions(self):
    if self.action in self.PERSONAL_ACTIONS:
        return [IsAuthenticated()]
    return super().get_permissions()
```

## RBAC canDo('update') silenciosamente falla — usar 'edit' (2026-03-13)
**Estado**: RESUELTO
**Problema:** `canDo(Modules.X, Sections.Y, 'update')` genera permission code `modulo.seccion.update` que NUNCA existe en backend. El backend genera `.edit` (desde `CargoSectionAccess.can_edit`), NO `.update`.
**Síntoma:** Botones de editar NUNCA aparecen para usuarios no-superadmin. Superadmins no se ven afectados (bypass total de permisos). Error silencioso — no hay crash ni warning en consola.
**Fix:** SIEMPRE usar `'edit'` como action: `canDo(Modules.X, Sections.Y, 'edit')`.
**Archivos afectados (corregidos):** CaracterizacionesSection.tsx, ConsecutivosSection.tsx.

## Modal/Spinner size prop: valores inválidos no crashean pero no renderizan (2026-03-13)
**Estado**: RESUELTO (parcial — quedan ~30 archivos fuera de fundación)
**Problema:** `<Modal size="large">` y `<Spinner size="small">` pasan valores que no existen en el objeto de sizes del componente. El lookup retorna `undefined` → la clase CSS no se aplica → el componente renderiza sin tamaño/ancho definido.
**Síntoma:** Modal sin max-width constraint (se expande al 100%). Spinner sin dimensiones (hereda del padre).
**Fix:** Usar valores válidos: Modal `'sm'|'md'|'lg'|'xl'|'2xl'|'3xl'|'4xl'`, Spinner `'sm'|'md'|'lg'`.
**Scope pendiente:** ~30 archivos en supply-chain, hseq, talent-hub, etc. con `size="large"` / `size="small"`.

## PWA cache post-deploy: usuario ve código viejo (2026-03-13)
**Estado**: DOCUMENTADO (comportamiento esperado)
**Problema:** Después de deploy a VPS, el Service Worker del PWA sigue sirviendo JS chunks viejos del cache. Aunque `skipWaiting:true` activa el nuevo SW inmediatamente, los chunks cacheados no se invalidan hasta que el usuario recarga.
**Síntoma:** Errores que ya fueron corregidos en el código siguen apareciendo. Toast de actualización muestra estilo viejo (azul genérico en vez de branding).
**Fix para el usuario:** **Ctrl+Shift+R** (hard reload) o DevTools → Application → Storage → Clear site data.
**Nota:** El toast de "Actualización disponible" con colores de branding solo aparece en el controllerchange del SIGUIENTE deploy. El deploy actual muestra el toast del código anterior.

## AdaptiveLayout: retries rápidos causan forceLogout prematuro (2026-03-13)
**Estado**: RESUELTO
**Problema:** `loadUserProfile()` con 3 retries SIN delay → las 3 llamadas fallan en <1 segundo → `forceLogout()`. El usuario es deslogueado aunque el backend esté respondiendo lento.
**Fix:** 5 retries con exponential backoff (0, 2s, 4s, 8s, 16s = ~30s tolerancia total). `retryTimerRef` previene re-disparos mientras hay timer pendiente.

## SuperAdmin sin Colaborador — endpoints game retornan 404 (2026-03-09)
**Problema:** `GameViewSet.mi_progreso` hace `_get_colaborador(request)` que busca `request.user.colaborador`. SuperAdmin no tiene perfil Colaborador → retorna 404 con "No tienes un perfil de colaborador asociado."
**Síntoma:** Browser muestra 404 en consola, parece que el endpoint no existe. Pero SÍ existe — es un 404 semántico del endpoint.
**Diagnóstico:** Verificar con `show_urls | grep endpoint` + `curl -H "Host: app..." -H "X-Forwarded-Proto: https"`.
**Solución:** Probar impersonando un usuario que tenga Colaborador asociado.

## Quick Reference Rules — Reglas condensadas de uso frecuente

### Backend — Tenant isolation
- **NO empresa filtering manual** — El schema de tenant ya aísla los datos. NUNCA `filter(empresa=...)`.
- **Cross-module imports** — SIEMPRE `apps.get_model('modulo', 'Modelo')`. NUNCA `from apps.otro_modulo.models import X`.
- **Tenant model import** — `from apps.tenant.models import Tenant` (singular, NOT `Tenants`).
- **compute_user_rbac()** — Fuente única de `permission_codes` desde `CargoSectionAccess`. No reinventar.
- **Migraciones VPS** — SIEMPRE `migrate_schemas`. NUNCA `migrate` solo. NUNCA `makemigrations` en VPS.
- **Seeds VPS** — SIEMPRE `deploy_seeds_all_tenants`. NUNCA seeds individuales.

### Frontend — RBAC pattern (3 guardas obligatorias)
```
1. SectionToolbar: primaryAction={canCreate ? {...} : undefined}
2. Tabla acciones: {canEdit && <Button/>}
3. EmptyState: action={canCreate ? {...} : undefined}
```
- Cada sub-componente necesita su propio `usePermissions()` — NO hereda del padre.
- `canDo` actions: SOLO `'view'|'create'|'edit'|'delete'`. NUNCA `'update'`.

### Frontend — Sidebar invalidation
- Después de toggle módulo/tab/sección: invalidar `['modules', 'sidebar']` + `['modules', 'tree']`.

### Frontend — FormData uploads
- Interceptor en `axios-config` elimina `Content-Type` default para FormData (boundary auto-generado por browser).
- NUNCA setear `Content-Type: multipart/form-data` manualmente.

## Gestión Documental — Gotchas E2E (2026-04-03)

### Docker local tenant schema es `tenant_demo`, NO `tenant_stratekaz`
En Docker dev, el schema activo del tenant demo se llama `tenant_demo`. `tenant_stratekaz` es el schema en producción VPS. Para queries via Django shell en Docker:
```python
from django.db import connection
connection.set_schema('tenant_demo')  # ✅ local
# connection.set_schema('tenant_stratekaz')  # ❌ no existe en Docker
```

### `localStorage` auth key es `access_token` directamente
Para obtener el JWT en DevTools Console:
```javascript
localStorage.getItem('access_token')  // ✅ correcto
```
NO está anidado dentro de `auth-storage.state` ni ningún otro objeto.

### `_auto_distribuir_documento()` requiere `aplica_a_todos=True` para distribuir
En `views.py`, esta función retorna 0 (no distribuye) a menos que `documento.aplica_a_todos=True` OR `documento.cargos_distribucion.exists()`. Publicar con solo `lectura_obligatoria=True` NO crea `AceptacionDocumental`. El frontend DEBE pasar `aplica_a_todos: true` en el payload de publicar:
```typescript
await publicarMutation.mutateAsync({
  id: documentoId,
  lectura_obligatoria: lecturaObligatoria,
  aplica_a_todos: lecturaObligatoria,  // ambos necesarios
});
```

### `Documento.tipo_documento` es `number` en TS — NO tiene `.id`
El tipo TS tiene `tipo_documento: number` (ID directo). El servidor también retorna `tipo_documento_detail: { id, nombre, codigo }`. Para acceder al ID en formularios de edición:
```typescript
// ❌ Error TS: Property 'id' does not exist on type 'number'
existing.tipo_documento.id
// ✅ Correcto: objeto de detalle o ID directo
existing.tipo_documento_detail?.id ?? existing.tipo_documento
```
Mismo patrón aplica a `plantilla`/`plantilla_detail` y `elaborado_por`/`elaborado_por_detail`.

### Lucide React icons NO aceptan prop `title`
Los componentes de Lucide son SVGs que no tienen prop `title`. Agregar `title="..."` genera TS2322.
```tsx
// ❌ TS2322: Property 'title' does not exist on type 'LucideProps'
<CheckCircle title="Verificado" className="h-5 w-5" />
// ✅ Sin prop title
<CheckCircle className="h-5 w-5" />
```
Para accesibilidad usar `aria-label` en el wrapper o un `<title>` dentro de un SVG personalizado.

### `AceptacionDocumental` tiene columnas NOT NULL adicionales
La tabla `documental_aceptacion_documental` requiere: `fecha_asignacion`, `scroll_data` (JSONB), `texto_aceptacion`, `motivo_rechazo`, `user_agent`. Al insertar via SQL raw en pruebas, incluir todas:
```sql
INSERT INTO documental_aceptacion_documental (usuario_id, documento_id, estado,
  fecha_asignacion, scroll_data, texto_aceptacion, motivo_rechazo, user_agent)
VALUES (7, 10, 'PENDIENTE', NOW(), '{}', '', '', '');
```

## 2026-04-08 — Code se saltó la conversación filosófica en sesión H2

### Qué pasó
La sesión H2 (resolución del sistema de auto-memory) tenía como instrucción explícita
en el prompt de apertura: "esta sesión necesita conversación de decisión filosófica
primero, brief técnico después de que decidamos juntos el patrón". Después de cargar
contexto, Code procesó el análisis, lanzó 3 preguntas multi-select de decisión,
recibió respuestas, y arrancó a ejecutar la migración entera (copiar archivos, hacer
merges, borrar el snapshot, reescribir CLAUDE.md) sin que Claude web hubiera
intervenido entre el catálogo y la ejecución.

### Por qué fue un problema
Decisiones de fondo se tomaron sin pasar por Claude web, que es el rol de estratega.
Específicamente:
- El borrado del snapshot en la misma sesión que la migración (red de seguridad
  eliminada sin discusión)
- Los 2 merges (ui-standards → DESIGN-SYSTEM, naming → CONVENCIONES) ejecutados sin
  diff visible para Camilo
- La pasada de "sigue siendo cierto" omitida (deuda H3 acumulada en silencio)

El resultado salió razonable, pero podría no haber salido. Y Camilo (que no es
técnico) commiteó por accidente sin haber tenido la oportunidad de revisar.

### Regla
Cuando el prompt de apertura de sesión dice explícitamente "conversación filosófica
primero" o "decisión antes de brief técnico", Code DEBE esperar instrucción explícita
de Claude web (vía Camilo) antes de tocar archivos. Las multi-select de decisión NO
son sustituto de la conversación.

### Cómo prevenir
- Claude web: en el primer mensaje de sesiones de decisión, dejar explícito "Code, no
  ejecutes nada hasta que yo te dé la siguiente instrucción técnica concreta."
- Code: si el prompt de sesión menciona "decisión filosófica" o "conversación primero",
  parar después de cargar contexto y devolver control sin ejecutar.
