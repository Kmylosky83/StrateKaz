# Testing - Correcciones Integrales v4.2.0

> **Fecha:** 2026-02-07 | **Fases:** 6 completadas

Este documento describe las pruebas manuales necesarias para verificar las correcciones aplicadas en las fases 1-5 del plan de correcciones integrales.

---

## 1. Tests de Seguridad (FASE 1)

### 1.1 DATABASE_ROUTERS eliminado

- **Archivo:** `backend/config/settings.py`
- **Verificacion:** Confirmar que NO existe la linea `DATABASE_ROUTERS = [...]`
- **Comando:**
  ```bash
  grep -r "DATABASE_ROUTERS" backend/config/settings.py
  # Esperado: sin resultados
  ```

### 1.2 is_superuser=False en usuarios auto-creados

- **Archivo:** `backend/apps/tenant/authentication.py` (linea ~203)
- **Verificacion:** El parametro `is_superuser` en `User.objects.create()` debe ser `False` siempre
- **Test manual:**
  1. Login como SuperAdmin en un tenant
  2. Verificar en Django Admin que el User auto-creado tiene `is_superuser=False`
  3. Confirmar que el SuperAdmin puede operar normalmente via RBAC (cargo ADMIN)
- **Comando:**
  ```bash
  grep -n "is_superuser" backend/apps/tenant/authentication.py
  # Esperado: is_superuser=False
  ```

### 1.3 IsSuperAdmin valida JWT claims

- **Archivo:** `backend/apps/tenant/views.py`
- **Verificacion:** Todos los endpoints admin-global usan `permission_classes = [IsSuperAdmin]`
- **Test manual:**
  1. Obtener token JWT de un usuario NO superadmin
  2. Intentar acceder a `GET /api/tenant/plans/` con ese token
  3. Esperado: `403 Forbidden`
  4. Repetir con token de superadmin: debe retornar `200 OK`

---

## 2. Tests de Autonomia Admin Tenant (FASE 2)

### 2.1 Endpoint /api/tenant/tenants/me/

- **Test GET:**
  ```bash
  curl -H "Authorization: Bearer <ADMIN_TOKEN>" \
       -H "X-Tenant: <SCHEMA_NAME>" \
       https://localhost:8000/api/tenant/tenants/me/
  # Esperado: 200 con datos del tenant actual
  ```

- **Test PATCH (datos fiscales):**
  ```bash
  curl -X PATCH \
       -H "Authorization: Bearer <ADMIN_TOKEN>" \
       -H "X-Tenant: <SCHEMA_NAME>" \
       -H "Content-Type: application/json" \
       -d '{"nombre_comercial": "Mi Empresa Test"}' \
       https://localhost:8000/api/tenant/tenants/me/
  # Esperado: 200 con datos actualizados
  ```

- **Test PATCH (campo protegido - debe fallar):**
  ```bash
  curl -X PATCH \
       -H "Authorization: Bearer <ADMIN_TOKEN>" \
       -H "Content-Type: application/json" \
       -d '{"plan": 5, "tier": "enterprise"}' \
       https://localhost:8000/api/tenant/tenants/me/
  # Esperado: campos ignorados (no estan en TenantSelfEditSerializer)
  ```

### 2.2 Frontend - Seccion Empresa en Configuracion

1. Login como Admin Tenant (no superadmin)
2. Navegar a: Gestion Estrategica > Configuracion > Empresa
3. Verificar que aparecen 4 cards:
   - Datos Fiscales (NIT, Razon Social, etc.)
   - Contacto (telefono, email, direccion)
   - Branding/Tema (colores, logos)
   - Configuracion Regional
4. Editar un campo (ej: nombre comercial) y guardar
5. Verificar toast de exito
6. **Branding en tiempo real:** Cambiar color primario y verificar que el sidebar/header cambian inmediatamente

### 2.3 Campos protegidos NO visibles

- En la seccion Empresa, verificar que NO aparecen:
  - Plan
  - Tier
  - Max usuarios
  - Max storage
  - Modulos habilitados
  - Trial
  - Fechas de suscripcion

---

## 3. Tests de Compliance Laboral (FASE 3)

### 3.1 Jornada 42h - Ley 2101/2021

- **Modelo:** `control_tiempo.Turno`
- **Campos nuevos:** `horas_semanales_maximas`, `tipo_jornada`
- **Test:**
  1. Crear un turno en Django Admin
  2. Verificar que `horas_semanales_maximas` tiene default `47.00` (progresivo: 47h en 2023, 46h en 2024, 44h en 2025, 42h desde julio 2026)
  3. Verificar que `tipo_jornada` tiene choices: `ordinaria`, `flexible`, `por_turnos`, `reducida`
  4. Verificar `help_text` explica la progresion de la Ley 2101

### 3.2 Dotacion - Art. 230 CST

- **Modelos:** `novedades.ConfiguracionDotacion`, `novedades.EntregaDotacion`
- **Endpoints:**
  - `GET/POST /api/talent-hub/novedades/dotacion-config/`
  - `GET/POST /api/talent-hub/novedades/entregas-dotacion/`

- **Test ConfiguracionDotacion:**
  1. `POST /api/talent-hub/novedades/dotacion-config/` con:
     ```json
     {
       "periodos_entrega": ["abril", "agosto", "diciembre"],
       "salario_maximo_smmlv": 2,
       "items_obligatorios": ["zapatos", "overol", "vestido_labor"]
     }
     ```
  2. Esperado: `201 Created`

- **Test EntregaDotacion:**
  1. `POST /api/talent-hub/novedades/entregas-dotacion/` con:
     ```json
     {
       "colaborador": 1,
       "periodo": "abril",
       "anio": 2026,
       "items_entregados": [
         {"nombre": "Zapatos", "talla": "42", "cantidad": 1},
         {"nombre": "Overol", "talla": "M", "cantidad": 2}
       ],
       "firma_recibido": true
     }
     ```
  2. Esperado: `201 Created`
  3. Intentar duplicar misma entrega (mismo colaborador + periodo + anio): `400 Bad Request`

### 3.3 Certificado de Trabajo - Art. 57+62 CST

- **Modelo:** `off_boarding.CertificadoTrabajo`
- **Endpoint:** `GET/POST /api/talent-hub/off-boarding/certificados-trabajo/`
- **Actions custom:** `generar`, `entregar`

- **Test completo:**
  1. `POST /api/talent-hub/off-boarding/certificados-trabajo/` con:
     ```json
     {
       "colaborador": 1,
       "tipo_certificado": "laboral",
       "dirigido_a": "A quien interese",
       "incluir_cargo": true,
       "incluir_salario": false,
       "incluir_funciones": true
     }
     ```
  2. Esperado: `201 Created` con `estado: "pendiente"`
  3. `POST /api/talent-hub/off-boarding/certificados-trabajo/{id}/generar/`
  4. Esperado: `estado` cambia a `"generado"`, `fecha_expedicion` se llena, `generado_por` se asigna
  5. `POST /api/talent-hub/off-boarding/certificados-trabajo/{id}/entregar/`
  6. Esperado: `estado` cambia a `"entregado"`

### 3.4 Denuncia Acoso Laboral - Ley 1010/2006

- **Modelo:** `proceso_disciplinario.DenunciaAcosoLaboral`
- **Endpoint:** `GET/POST /api/talent-hub/proceso-disciplinario/denuncias-acoso/`
- **Actions custom:** `cambiar_estado`, `notificar_comite`

- **Test denuncia nominada:**
  1. `POST /api/talent-hub/proceso-disciplinario/denuncias-acoso/` con:
     ```json
     {
       "es_anonima": false,
       "denunciante": 2,
       "denunciado": 3,
       "tipo_acoso": "maltrato",
       "descripcion_hechos": "Gritos constantes y humillaciones publicas",
       "fecha_hechos": "2026-02-01",
       "lugar_hechos": "Oficina principal",
       "testigos": [4, 5]
     }
     ```
  2. Esperado: `201 Created` con `estado: "recibida"`

- **Test denuncia anonima:**
  1. Repetir sin `denunciante` y con `"es_anonima": true`
  2. Esperado: `201 Created`, campo `denunciante` es `null`

- **Test cambio de estado:**
  1. `POST /api/talent-hub/proceso-disciplinario/denuncias-acoso/{id}/cambiar_estado/` con:
     ```json
     {"estado": "investigacion"}
     ```
  2. Esperado: `200 OK` con estado actualizado

- **Test notificacion comite:**
  1. `POST /api/talent-hub/proceso-disciplinario/denuncias-acoso/{id}/notificar_comite/`
  2. Esperado: `comite_convivencia_notificado: true`, `fecha_notificacion_comite` se llena

### 3.5 Licencia de Paternidad - Ley 2114/2021

- **Verificacion:** El modelo `novedades.Licencia` ya soporta licencia de paternidad via TipoLicencia
- **Test:** Crear un TipoLicencia con `categoria: "paternidad"` y asociar una Licencia

---

## 4. Tests de Limpieza Legacy (FASE 4)

### 4.1 EmpresaConfig API eliminada

```bash
curl -H "Authorization: Bearer <TOKEN>" \
     https://localhost:8000/api/configuracion/empresa-config/
# Esperado: 404 Not Found
```

### 4.2 Imports limpios en frontend

```bash
# Desde la raiz del proyecto
grep -r "empresaApi\|useEmpresa\|empresa.types\|BrandingFormModal\|EmpresaSection" frontend/src/
# Esperado: solo la nueva EmpresaSection, sin refs al viejo
```

### 4.3 Error toasts con detalle del backend

1. Intentar crear un tenant con datos invalidos
2. Verificar que el toast muestra el mensaje de error del backend (ej: "El NIT ya esta registrado")
3. NO debe mostrar mensajes genericos como "Error al crear la empresa"

### 4.4 Boton "Gestionar Empresas" funcional

1. Login como SuperAdmin
2. Panel Admin Global > Usuarios
3. Click en menu de acciones de un usuario > "Gestionar Empresas"
4. Verificar que abre el modal de edicion del usuario con la seccion de empresas

---

## 5. Tests de Admin, Serializers, URLs (FASE 5)

### 5.1 Django Admin

Verificar que los siguientes modelos aparecen en Django Admin:
- `novedades > ConfiguracionDotacion`
- `novedades > EntregaDotacion`
- `off_boarding > CertificadoTrabajo`
- `proceso_disciplinario > DenunciaAcosoLaboral`

### 5.2 Endpoints disponibles

```bash
# Dotacion
curl -H "Authorization: Bearer <TOKEN>" http://localhost:8000/api/talent-hub/novedades/dotacion-config/
curl -H "Authorization: Bearer <TOKEN>" http://localhost:8000/api/talent-hub/novedades/entregas-dotacion/

# Certificados
curl -H "Authorization: Bearer <TOKEN>" http://localhost:8000/api/talent-hub/off-boarding/certificados-trabajo/

# Denuncias Acoso
curl -H "Authorization: Bearer <TOKEN>" http://localhost:8000/api/talent-hub/proceso-disciplinario/denuncias-acoso/

# Todos deben retornar 200 OK con lista (posiblemente vacia)
```

---

## 6. Checklist Pre-Deploy

- [ ] `python manage.py makemigrations` - sin migraciones pendientes
- [ ] `python manage.py migrate` - sin errores
- [ ] `python manage.py check --deploy` - sin warnings criticos
- [ ] Frontend `npm run build` - sin errores de compilacion
- [ ] Todos los endpoints anteriores responden correctamente
- [ ] Django Admin muestra los 4 nuevos modelos
- [ ] Branding en tiempo real funciona (cambiar color, refrescar sidebar)
- [ ] Token de usuario normal NO accede a admin-global
- [ ] `is_superuser=False` en usuarios auto-creados

---

## Resumen de Cambios por Fase

| Fase | Descripcion | Archivos Clave |
|------|-------------|----------------|
| 1 | Seguridad: DATABASE_ROUTERS, is_superuser, IsSuperAdmin | `settings.py`, `authentication.py`, `views.py` |
| 2 | Autonomia Admin Tenant: endpoint `/me/`, EmpresaSection | `tenant/views.py`, `tenant/serializers.py`, `ConfiguracionTab.tsx` |
| 3 | Compliance Laboral: Ley 2101, Art. 230 CST, Art. 57+62, Ley 1010 | `control_tiempo/models.py`, `novedades/models.py`, `off_boarding/models.py`, `proceso_disciplinario/models.py` |
| 4 | Limpieza Legacy: EmpresaConfig API, error toasts, UX | `configuracion/`, `useAdminGlobal.ts`, `UsersGlobalSection.tsx` |
| 5 | Admin + Serializers + ViewSets + URLs para modelos nuevos | `admin.py`, `serializers.py`, `views.py`, `urls.py` (3 apps) |
| 6 | Documentacion para testing | Este documento |
