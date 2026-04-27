# Auditoría Diaria 2026-04-26 — Supply Chain: Migraciones + Logging

**Fecha:** 2026-04-26  
**Disparador:** Tarea programada `auditoria-diaria-sentry`  
**Alcance:** Backend LIVE (L0-L20), Supply Chain

---

## Contexto

Sentry no tiene DSN configurado en desarrollo (comentado en `.env.example`).
La auditoría se ejecutó sobre los logs de Docker local y el estado del repo.

---

## Hallazgos detectados

### CRÍTICO — 19 migraciones sin aplicar al arrancar el backend

**Síntoma:** El backend logueaba al inicio:
```
You have 19 unapplied migration(s). Your project may not work properly until
you apply the migrations for app(s): almacenamiento, catalogo_productos,
catalogos, configuracion, liquidaciones, sc_recepcion, sc_recoleccion.
```

**Causa raíz:** Acumulación de migraciones creadas en sprints RUTA-02 que no
habían sido aplicadas (ni el `migrate_schemas` había corrido después de los
commits de H-SC-RUTA-02).

**Resolución:** Ver sección "Acciones tomadas".

---

### CRÍTICO — SystemCheckError: admin.RutaParadaAdmin referencia campo eliminado

**Síntoma:** Al correr `migrate_schemas --shared`:
```
ERRORS:
<class 'apps.supply_chain.catalogos.admin.RutaParadaAdmin'>: (admin.E108)
The value of 'list_display[3]' refers to 'frecuencia_pago', which is not a
callable, an attribute of 'RutaParadaAdmin', or an attribute or method on
'catalogos.RutaParada'.
(admin.E116) The value of 'list_filter[1]' refers to 'frecuencia_pago',
which does not refer to a Field.
```

**Causa raíz:** El campo `frecuencia_pago` fue eliminado del modelo `RutaParada`
(refactor 2026-04-26 según comentario en `models.py`) pero el admin no fue
actualizado en el mismo commit.

**Estado:** El admin en HEAD ya tenía la corrección aplicada (HEAD sin
`frecuencia_pago`). Posible drift entre working tree y HEAD durante la sesión.
El `check` final pasó sin errores.

---

### MEDIA — drift de migraciones post-RUTA-02

Tras aplicar las migraciones previas, `makemigrations` detectó 5 más pendientes
por diferencias de nombres de índices (Django auto-naming vs nombres custom):

| App | Migración creada | Descripción |
|-----|-----------------|-------------|
| `catalogos` | `0011` | Rename índices + recrca constraint `uq_precio_ruta_semi_vigente` |
| `liquidaciones` | `0006` | Rename índice + alter campo `subtotal` |
| `sc_recepcion` | `0008` | Rename índice `voucher_recoleccion_origen` |
| `sc_recoleccion` | `0002` | Rename 5 índices a nombres auto-Django |
| `catalogo_productos` | `0021` | Alter FK `ruta_origen` en Proveedor |

---

### BAJA — logging `viewsets_rbac.py` sin logger

**Síntoma:** El `CargoRBACViewSet.perform_destroy` tenía `except Exception: pass`
sin ningún log. Un `LookupError` (app no instalada) y un error real se trataban igual.

**Resolución:** El diff ya estaba en el working tree desde la sesión anterior.
Se incluyó en el commit de esta sesión.

---

## Acciones tomadas

1. **Fix migration 0004** (`sc_recepcion`): `related_name='vouchers_recoleccion'` →
   `vouchers_recepcion` para alinear con el modelo ya corregido en HEAD.

2. **Fix comentario** `recoleccion/models.py`: actualizado para reflejar el
   `related_name` correcto de `VoucherRecepcion.ruta_recoleccion`.

3. **Fix admin** `catalogos/admin.py`: eliminado `frecuencia_pago` de
   `list_display` y `list_filter` de `RutaParadaAdmin`.

4. **`makemigrations`**: generadas 5 migraciones de drift de índices.

5. **`migrate_schemas`**: aplicadas todas las migraciones en los 3 schemas
   (`public` + 2 tenants). Estado final: `No migrations to apply` en todos.

6. **Commit** `888b9b56`:  
   `fix(supply-chain): logging RBAC + 5 migraciones pendientes auditoria 2026-04-26`

---

## Estado final

| Verificación | Resultado |
|-------------|-----------|
| `manage.py check` | ✅ 0 issues |
| `makemigrations --check` | ✅ No changes detected |
| `migrate_schemas` | ✅ No migrations to apply (3 schemas) |
| Backend Docker | ✅ healthy |

---

## Notas para próximas sesiones

- Sentry requiere DSN configurado en producción. La próxima vez que se active
  Sentry en prod, verificar en el dashboard que los hallazgos de esta sesión
  no dejaron rastros de errores.
- El drift de nombres de índices (auto-Django vs nombres custom) puede aparecer
  de nuevo si se crean nuevas migraciones con nombres explícitos y luego Django
  los renombra al regenerar. Considerar usar siempre nombres auto-Django.
- `frecuencia_pago` fue eliminado del modelo `RutaParada` pero puede quedar en
  serializers, filtros de frontend o seeds. Revisar antes de activar filtrado
  por este campo en UI.
