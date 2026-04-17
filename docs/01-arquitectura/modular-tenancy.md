# Tenancy Modular: Universal vs Específico por Industria

> Documento fundacional de StrateKaz. Define cómo diseñar modelos, campos
> y features en un SaaS multi-tenant modular sin acoplarlos al primer
> cliente. Aplicable de forma **prospectiva** (todo módulo nuevo) y
> **retroactiva** (cada vez que se toque un módulo LIVE existente).

---

## 1. Principio fundacional

> **Un módulo LIVE de StrateKaz debe servir a cualquier tenant, sin
> importar su industria.**
>
> Los campos, modelos y lógica que solo aplican a UNA industria viven
> en extensiones opcionales, activables por tenant.

**Ejemplo positivo** (universal): `Producto.nombre`, `Producto.precio_referencia`, `Producto.unidad_medida` — todos los tenants los necesitan.

**Ejemplo negativo** (acoplado): `TipoMateriaPrima.acidez_min` — solo aplica a industrias de rendering, química, farma. Una panadería o una consultora no tienen acidez.

---

## 2. Las dos dimensiones de modularidad

StrateKaz tiene **dos dimensiones independientes** de modularidad. Confundirlas es la causa raíz del acoplamiento accidental.

| Dimensión | Qué controla | Mecanismo | Granularidad |
|-----------|--------------|-----------|--------------|
| **Deploy Level** | Qué módulos llegan a producción | `CURRENT_DEPLOY_LEVEL` + `base.py` TENANT_APPS | Global (todos los tenants) |
| **Per-Tenant Features** | Qué features ve cada empresa dentro de un módulo | Configuración por tenant + extensiones OneToOne | Por tenant |

### Ejemplo concreto

- **Dimensión 1 (deploy level):** `gestion_proveedores` está en L25. Si `CURRENT_DEPLOY_LEVEL=20`, ningún tenant lo ve. Cuando sube a L25, todos los tenants lo ven al mismo tiempo.
- **Dimensión 2 (per-tenant):** Dentro de `gestion_proveedores` ya activo, el tenant "Grasas y Huesos" ve campos de acidez porque tiene activada la extensión `EspecCalidad`. El tenant "Panadería Nueva" no los ve.

**Antes de este documento:** StrateKaz solo tenía la dimensión 1. La dimensión 2 se emulaba metiendo todo en el modelo universal (antipatrón).

---

## 3. Patrón técnico: OneToOne Extension

El patrón obligatorio para separar universal de específico es **OneToOne opcional**.

### Estructura

```python
# Universal — vive en módulo LIVE, lo usan TODOS los tenants
class Producto(TenantModel):
    codigo = CharField(...)
    nombre = CharField(...)
    categoria = ForeignKey(CategoriaProducto, ...)
    unidad_medida = ForeignKey(UnidadMedida, ...)
    precio_referencia = DecimalField(...)
    # ... solo campos universales

# Extensión específica — opcional, se activa por tenant
class ProductoEspecCalidad(TenantModel):
    producto = OneToOneField(
        Producto,
        on_delete=models.CASCADE,
        related_name='espec_calidad',
    )
    acidez_min = DecimalField(...)
    acidez_max = DecimalField(...)
    parametro_fisicoquimico_1 = ...
    # ... campos específicos de industrias con control de calidad
```

### Ubicación física

**Regla:** la extensión vive en la misma capa (CT o C2) que el modelo base, en un **submódulo `extensiones/`** dentro del módulo:

```
apps/catalogo_productos/
  models.py                    # Producto, CategoriaProducto, UnidadMedida (universales)
  extensiones/
    __init__.py
    espec_calidad.py           # ProductoEspecCalidad (química/rendering/farma)
    espec_alimentos.py         # ProductoEspecAlimentos (vencimiento, lote)
    espec_textil.py            # ProductoEspecTextil (talla, color)
  admin.py
  serializers.py
  ...
```

### Consumo desde código

```python
# Query defensiva
producto = Producto.objects.get(pk=1)
if hasattr(producto, 'espec_calidad'):
    acidez = producto.espec_calidad.acidez_min

# En serializer (campo condicional nested)
class ProductoSerializer(serializers.ModelSerializer):
    espec_calidad = ProductoEspecCalidadSerializer(read_only=True, required=False)

    class Meta:
        model = Producto
        fields = ['codigo', 'nombre', 'espec_calidad', ...]
```

### Migraciones

Cada extensión tiene su propia migración. Si el tenant no la necesita, la tabla existe vacía (coste de storage: despreciable). Si se quiere no crear la tabla por tenant, usar `managed = False` en Meta y activar solo en tenants con feature flag (avanzado, no requerido en fase actual).

---

## 4. Activación por tenant

Una extensión OneToOne está **disponible técnicamente** para todos los tenants (la tabla existe). Pero **solo se usa** por los tenants cuya industria lo requiere. El control es por configuración, no por schema.

### Almacenamiento del feature flag

En `apps.gestion_estrategica.configuracion` (ya existe) agregar:

```python
class ConfiguracionEmpresa(TenantModel):
    # ... campos existentes ...

    industria_principal = CharField(
        max_length=50,
        choices=INDUSTRIAS,
        blank=True,
        help_text='Industria principal del tenant — determina extensiones por defecto',
    )
    features_habilitados = ArrayField(
        CharField(max_length=100),
        default=list,
        blank=True,
        help_text='Lista de feature keys habilitados (ej: ["productos.espec_calidad"])',
    )
```

### Helper de consulta

```python
# apps/utils/features.py
def tenant_has_feature(feature_key: str) -> bool:
    """Check if current tenant has a specific feature enabled."""
    from apps.gestion_estrategica.configuracion.models import ConfiguracionEmpresa
    config = ConfiguracionEmpresa.objects.first()
    if not config:
        return False
    return feature_key in (config.features_habilitados or [])
```

### Uso en UI (frontend)

El endpoint de configuración del tenant devuelve `features_habilitados`. El frontend condiciona qué campos muestra:

```tsx
{tenantFeatures.includes('productos.espec_calidad') && (
  <EspecCalidadFields />
)}
```

### Uso en backend

```python
# Validación condicional en serializer
def validate(self, attrs):
    if 'espec_calidad' in attrs and not tenant_has_feature('productos.espec_calidad'):
        raise ValidationError('Esta funcionalidad no está habilitada para tu empresa')
    return attrs
```

---

## 5. Checklist para módulo nuevo (prospectivo)

Antes de merge de cualquier módulo que se va a activar en deploy level, responder **todas** las preguntas:

- [ ] **Universalidad:** ¿Este modelo aplica a TODOS los tenants posibles (panadería, ferretería, consultora, manufactura, servicios, rendering, farma...)? Si hay un solo contraejemplo, **NO es universal**.
- [ ] **Campos específicos:** ¿Cada campo del modelo tiene sentido para todas las industrias? Si uno no lo tiene → extraer a extensión.
- [ ] **Extensión aislada:** ¿Los campos específicos viven en un modelo OneToOne separado en `extensiones/`?
- [ ] **Feature flag:** ¿La extensión está registrada en `features_habilitados` con una key documentada?
- [ ] **Consumo defensivo:** ¿Todo código que use la extensión usa `hasattr()` o `tenant_has_feature()`?
- [ ] **Sin ejemplos de cliente:** ¿El docstring/comentarios están libres de nombres de clientes o ejemplos específicos de industria? (`"Ejemplos: HUESO, SEBO_CRUDO"` ❌)
- [ ] **Nombres genéricos:** ¿Los nombres de campos y modelos son neutros? (`acidez` ❌ en modelo universal, ✅ en `EspecCalidad`)
- [ ] **Industrias documentadas:** ¿Hay nota en el README del módulo sobre qué extensiones hay y para qué industrias aplican?

Si alguna respuesta es NO → refactorizar antes de merge. No se activa deploy level con deuda de acoplamiento.

---

## 6. Checklist al tocar módulo LIVE existente (retroactivo)

Cada vez que se abra un PR sobre un módulo LIVE:

- [ ] **Scan rápido:** Antes de tu cambio, ¿el modelo/campo que tocás tiene pinta de ser específico de alguna industria? (acidez, vencimiento, talla, voltaje, horas estimadas, acidez, color, lote...)
- [ ] **Si detectás acoplamiento:**
  - Si el refactor de desacople es pequeño (<50 LOC, sin data migration compleja) → **hacerlo en este PR**.
  - Si es grande → **anotar como hallazgo** en `docs/architecture/HALLAZGOS-PENDIENTES-*.md` con severidad y plan de extracción.
- [ ] **Al agregar campo nuevo:** ¿Es universal o específico? Si específico → va en extensión, no en modelo base.
- [ ] **Al agregar lógica nueva:** Misma pregunta.

**Regla anti-pereza:** no se permite agregar nuevo campo específico a un modelo universal "por ahora, luego lo saco". La deuda nunca se paga después.

---

## 7. Anti-patrones a evitar

### 7.1 Campo específico en modelo universal

```python
# ❌ MAL
class Producto(TenantModel):
    codigo = CharField(...)
    nombre = CharField(...)
    acidez_min = DecimalField(...)    # solo rendering/química
    fecha_vencimiento = DateField(...)  # solo alimentos/farma

# ✅ BIEN
class Producto(TenantModel):
    codigo = CharField(...)
    nombre = CharField(...)

class ProductoEspecCalidad(TenantModel):  # extensión rendering/química
    producto = OneToOneField(Producto, ...)
    acidez_min = DecimalField(...)

class ProductoEspecAlimentos(TenantModel):  # extensión alimentos
    producto = OneToOneField(Producto, ...)
    fecha_vencimiento = DateField(...)
```

### 7.2 Ejemplos y comentarios al cliente en el código

```python
# ❌ MAL
class TipoMateriaPrima(models.Model):
    """
    Tipo específico de materia prima.
    Ejemplos: HUESO_CRUDO, SEBO_PROCESADO_A, ACU
    """

# ✅ BIEN
class TipoMateriaPrima(models.Model):
    """
    Tipo específico de materia prima. Clasificación definida por el tenant
    mediante el catálogo dinámico de su configuración.
    """
```

### 7.3 Enum/choices con valores de industria específica

```python
# ❌ MAL — enum hardcoded industria rendering
class TipoMP(TextChoices):
    HUESO = 'hueso'
    SEBO_CRUDO = 'sebo_crudo'
    SEBO_PROC = 'sebo_procesado'

# ✅ BIEN — valores genéricos, clasificación específica vive en data
class Producto(TenantModel):
    tipo = CharField(choices=[
        ('MATERIA_PRIMA', 'Materia prima'),
        ('INSUMO', 'Insumo'),
        ('PRODUCTO_TERMINADO', 'Producto terminado'),
        ('SERVICIO', 'Servicio'),
    ])
    # El tenant define sus categorías específicas en CategoriaProducto (dinámico)
```

### 7.4 Lógica de negocio específica mezclada

```python
# ❌ MAL — método de industria específica en modelo universal
class Producto(TenantModel):
    @classmethod
    def obtener_por_acidez(cls, valor):  # solo rendering
        ...

# ✅ BIEN — método en extensión
class ProductoEspecCalidad(TenantModel):
    @classmethod
    def find_by_acidez(cls, valor):
        return cls.objects.filter(
            acidez_min__lte=valor,
            acidez_max__gte=valor,
        )
```

### 7.5 Constantes hardcoded con semántica de industria

```python
# ❌ MAL — diccionario de consecutivos con tipos específicos hardcoded
class Proveedor:
    CONSECUTIVO_POR_TIPO = {
        'MATERIA_PRIMA': 'PROVEEDOR_MP',
        'TRANSPORTISTA': 'PROVEEDOR_TR',
        ...
    }

# ✅ BIEN — consecutivo configurable dinámicamente en ConsecutivoConfig
# El tenant define el mapeo tipo_proveedor → código consecutivo en su admin
```

---

## 8. Ejemplo trabajado: `catalogo_productos` + extensiones

### Estado deseado (post-desacople)

```
apps/catalogo_productos/
  models.py                        # UNIVERSAL
    class CategoriaProducto(TenantModel): ...
    class UnidadMedida(TenantModel): ...
    class Producto(TenantModel): ...
  extensiones/
    __init__.py
    espec_calidad.py               # RENDERING / QUÍMICA / FARMA
      class ProductoEspecCalidad(TenantModel):
        producto = OneToOneField(Producto, ..., related_name='espec_calidad')
        acidez_min = DecimalField(...)
        acidez_max = DecimalField(...)
        ph = DecimalField(...)
        # otros parámetros fisicoquímicos
    espec_alimentos.py             # ALIMENTOS
      class ProductoEspecAlimentos(TenantModel):
        producto = OneToOneField(Producto, ..., related_name='espec_alimentos')
        fecha_vencimiento = DateField(...)
        lote = CharField(...)
        requiere_refrigeracion = BooleanField(...)
```

### Feature keys registradas

```
productos.espec_calidad       — ProductoEspecCalidad activa
productos.espec_alimentos     — ProductoEspecAlimentos activa
productos.espec_textil        — (cuando se implemente)
```

### Configuración de tenants

| Tenant | industria_principal | features_habilitados |
|--------|---------------------|---------------------|
| Grasas y Huesos del Llano | `RENDERING` | `['productos.espec_calidad']` |
| (futuro) Panadería Nueva | `ALIMENTOS` | `['productos.espec_alimentos']` |
| (futuro) Consultora XYZ | `SERVICIOS` | `[]` |

### API response condicional

```json
// Tenant Grasas y Huesos (tiene espec_calidad)
{
  "codigo": "SEBO-A",
  "nombre": "Sebo procesado tipo A",
  "espec_calidad": {
    "acidez_min": "0.50",
    "acidez_max": "2.00"
  }
}

// Tenant Consultora (no tiene extensiones)
{
  "codigo": "SVC-CONSULT",
  "nombre": "Consultoría SST"
}
```

---

## 9. Industrias típicas en Colombia (referencia)

Catálogo de industrias a considerar al diseñar extensiones. No exhaustivo.

| Código | Industria | Extensiones típicas |
|--------|-----------|---------------------|
| `RENDERING` | Rendering / procesadoras animales | Calidad fisicoquímica, trazabilidad origen |
| `ALIMENTOS` | Alimentos y bebidas | Vencimiento, lote, cadena de frío |
| `FARMA` | Farmacéutica | Vencimiento, lote, INVIMA, cadena de frío |
| `QUIMICA` | Química industrial | Calidad fisicoquímica, SGA, fichas de seguridad |
| `TEXTIL` | Textil y confección | Talla, color, composición |
| `FERRETERIA` | Ferretería y hardware | Voltaje, dimensiones, material |
| `SERVICIOS` | Servicios profesionales | Horas estimadas, entregables |
| `CONSTRUCCION` | Construcción | Resistencia, norma NSR, garantía |
| `TRANSPORTE` | Transporte y logística | Capacidad, tipo carga, licencias |
| `AGRO` | Agroindustria | Variedad, ciclo cultivo, origen |

Esta lista se extiende según onboarding de cada cliente nuevo.

---

## 10. Aplicación retroactiva: hallazgos conocidos

Módulos LIVE o pre-LIVE con acoplamiento detectado al 2026-04-17:

### `supply_chain.gestion_proveedores` (pre-LIVE, activando Sesiones 2-4)
- `TipoMateriaPrima.acidez_min/max` → extraer a `ProductoEspecCalidad`
- `CategoriaMateriaPrima` con ejemplos "HUESO, SEBO_CRUDO" → genericar docstring
- `Proveedor.CONSECUTIVO_POR_TIPO` hardcoded → mover a `ConsecutivoConfig` dinámico
- **Plan:** Sesión 2 extrae `EspecCalidad`, Sesión 3/4 completan el resto

### `production_ops.recepcion` (no-LIVE, dormido)
- `PruebaAcidez` es específica de sebo procesado → si se activa algún día, extraer a extensión
- **Plan:** revisar al activar (doctrina LIVE-only)

### `hseq_management` (no-LIVE)
- Pendiente auditar al activar

### Otros módulos LIVE (L0-L20)
- No se han auditado con este lente. Al tocar cualquiera en sesión futura, aplicar checklist retroactivo (sección 6).

---

## 11. Referencias cruzadas

- [CLAUDE.md](../../CLAUDE.md) — sección "Principio fundacional: LIVE es la verdad"
- [SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md) — Colaborador master, User identidad
- [config-admin-module.md](./config-admin-module.md) — Configuración por tenant
- [HALLAZGOS-PENDIENTES-2026-04.md](../architecture/HALLAZGOS-PENDIENTES-2026-04.md) — Hallazgos activos
- [feedback_live_only_scope.md](../../memory/feedback_live_only_scope.md) — Doctrina LIVE

---

## 12. Changelog

- **2026-04-17** — Creación del documento. Producto de sesión de diseño
  post-inventario `gestion_proveedores`. Decisión: patrón OneToOne Extension
  + feature flags en `ConfiguracionEmpresa`. Aplicación prospectiva +
  retroactiva aprobada por Camilo.
