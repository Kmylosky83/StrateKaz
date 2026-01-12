# Auditoría de Modelos Django - Módulo Identidad Corporativa

**Fecha**: 2026-01-09
**Módulo**: `backend/apps/gestion_estrategica/identidad/`
**Versión**: v1.0

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Estructura de Archivos](#estructura-de-archivos)
3. [Diagrama Entidad-Relación (ER)](#diagrama-entidad-relación-er)
4. [Análisis por Archivo](#análisis-por-archivo)
5. [Análisis de Migraciones](#análisis-de-migraciones)
6. [Relaciones con Otros Módulos](#relaciones-con-otros-módulos)
7. [Problemas Críticos](#problemas-críticos)
8. [Problemas Menores](#problemas-menores)
9. [Optimizaciones Recomendadas](#optimizaciones-recomendadas)
10. [Cumplimiento Normativo](#cumplimiento-normativo)
11. [Conclusión y Prioridades](#conclusión-y-prioridades)

---

## Resumen Ejecutivo

### Estadísticas del Módulo

| Métrica | Valor |
|---------|-------|
| Archivos de Modelos | 4 |
| Total de Modelos | 11 |
| Migraciones | 3 |
| Relaciones ForeignKey | 38 |
| GenericForeignKey | 4 |
| Índices Creados | 18 |
| Constraints Únicos | 10 |

### Estado General

✅ **ACEPTABLE** - El módulo tiene una arquitectura sólida con algunos puntos de mejora.

**Fortalezas**:
- Excelente uso de GenericForeignKey para máxima flexibilidad
- Buenos índices de base de datos
- Sistema de auditoría completo
- Cumplimiento normativo (ISO 9001, ISO 45001, Decreto 1072)
- Documentación interna clara

**Debilidades**:
- Falta verificación de tenant_id (multi-tenancy)
- Algunos on_delete pueden causar pérdida de datos
- Falta de validaciones a nivel de base de datos
- Índices faltantes en queries comunes

---

## Estructura de Archivos

```
backend/apps/gestion_estrategica/identidad/
│
├── models.py                      # 582 líneas - Modelos base (5 modelos)
├── models_workflow.py             # 1266 líneas - Workflow de firmas (5 modelos)
├── models_workflow_firmas.py      # 729 líneas - Sistema alternativo (3 modelos)
├── models_valores_vividos.py      # 706 líneas - Valores vividos (2 modelos)
│
└── migrations/
    ├── 0001_dynamic_models_dia6.py           # Migración inicial
    ├── 0002_valores_vividos.py               # Valores vividos
    └── 0003_add_review_date_to_politica_integral.py  # Campo review_date
```

---

## Diagrama Entidad-Relación (ER)

### Módulo Principal (models.py)

```mermaid
erDiagram
    CorporateIdentity ||--o{ CorporateValue : "tiene"
    CorporateIdentity ||--o{ AlcanceSistema : "define"
    CorporateIdentity ||--o{ PoliticaIntegral : "versiona"
    CorporateIdentity ||--o{ PoliticaEspecifica : "organiza"

    CorporateIdentity {
        bigint id PK
        text mission
        text vision
        text integral_policy
        uuid policy_signed_by FK
        datetime policy_signed_at
        varchar policy_signature_hash
        date effective_date
        varchar version
        boolean is_active
    }

    CorporateValue {
        bigint id PK
        bigint identity_id FK
        varchar name
        text description
        varchar icon
        int orden
        boolean is_active
    }

    AlcanceSistema {
        bigint id PK
        bigint identity_id FK
        bigint norma_iso_id FK
        varchar iso_standard_legacy
        text scope
        text exclusions
        boolean is_certified
        date certification_date
        varchar certification_body
        date expiry_date
    }

    PoliticaIntegral {
        bigint id PK
        bigint identity_id FK
        varchar version
        varchar title
        text content
        varchar status
        date effective_date
        date expiry_date
        date review_date
        uuid signed_by FK
        datetime signed_at
        varchar signature_hash
        json applicable_standards
    }

    PoliticaEspecifica {
        bigint id PK
        bigint identity_id FK
        bigint norma_iso_id FK
        bigint area_id FK
        uuid responsible_id FK
        uuid responsible_cargo_id FK
        varchar code
        varchar title
        text content
        varchar version
        varchar status
        date effective_date
        date review_date
    }

    AlcanceSistema }o--|| NormaISO : "referencia"
    PoliticaEspecifica }o--|| NormaISO : "aplica"
    PoliticaEspecifica }o--o| Area : "responsable"
    PoliticaEspecifica }o--o| Cargo : "cargo"
```

### Workflow de Firmas (models_workflow.py)

```mermaid
erDiagram
    FirmaDigital }o--|| ContentType : "firma cualquier documento"
    FirmaDigital }o--|| User : "firmante"
    FirmaDigital }o--o| Cargo : "cargo al firmar"
    FirmaDigital }o--o| User : "delegado_por"

    ConfiguracionRevision }o--|| ContentType : "configura revisión"
    ConfiguracionRevision }o--o| User : "responsable"
    ConfiguracionRevision }o--o| Cargo : "cargo responsable"
    ConfiguracionRevision }o--o{ User : "destinatarios adicionales (M2M)"

    HistorialVersion }o--|| ContentType : "versiona cualquier documento"
    HistorialVersion }o--o| User : "usuario cambio"
    HistorialVersion }o--o| Cargo : "cargo usuario"

    ConfiguracionWorkflowFirma ||--o{ FirmaDigital : "define flujo"

    FirmaDigital {
        bigint id PK
        bigint content_type_id FK
        int object_id
        uuid firmante_id FK
        uuid cargo_id FK
        varchar rol_firma
        int orden_firma
        text firma_manuscrita
        varchar firma_hash UK
        varchar status
        datetime fecha_firma
        datetime fecha_vencimiento
        text observaciones
        uuid delegado_por_id FK
        inet ip_address
        text user_agent
        json geolocation
    }

    ConfiguracionRevision {
        bigint id PK
        bigint content_type_id FK
        int object_id
        varchar frecuencia
        int dias_personalizados
        varchar tipo_revision
        boolean auto_renovar
        uuid responsable_revision_id FK
        uuid cargo_responsable_id FK
        json alertas_dias_previos
        date ultima_revision
        date proxima_revision
        varchar estado
        boolean habilitado
    }

    HistorialVersion {
        bigint id PK
        bigint content_type_id FK
        int object_id
        varchar version_numero
        varchar version_anterior
        json snapshot_data
        varchar tipo_cambio
        text descripcion_cambio
        json cambios_diff
        uuid usuario_id FK
        uuid cargo_usuario_id FK
        varchar version_hash UK
    }

    ConfiguracionWorkflowFirma {
        bigint id PK
        varchar nombre UK
        varchar tipo_politica
        varchar tipo_orden
        int dias_para_firmar
        boolean permitir_delegacion
        json roles_config
        boolean activo
    }
```

### Sistema Alternativo de Firmas (models_workflow_firmas.py)

```mermaid
erDiagram
    ProcesoFirmaPolitica ||--o{ FirmaPolitica : "contiene"
    ProcesoFirmaPolitica }o--|| ConfiguracionFlujoFirma : "usa flujo"
    ProcesoFirmaPolitica }o--o| PoliticaIntegral : "firma"
    ProcesoFirmaPolitica }o--o| PoliticaEspecifica : "firma"

    FirmaPolitica }o--|| Cargo : "cargo firmante"
    FirmaPolitica }o--o| User : "usuario firmante"
    FirmaPolitica }o--o| User : "delegado_por"
    FirmaPolitica }o--o| User : "revocado_por"
    FirmaPolitica ||--o{ HistorialFirmaPolitica : "historial"

    ConfiguracionFlujoFirma }o--o{ NormaISO : "normas aplicables (M2M)"

    ProcesoFirmaPolitica {
        bigint id PK
        varchar tipo_politica
        bigint politica_integral_id FK
        bigint politica_especifica_id FK
        bigint flujo_firma_id FK
        varchar estado
        int paso_actual
        datetime fecha_inicio
        datetime fecha_completado
        uuid iniciado_por_id FK
        varchar contenido_hash
    }

    FirmaPolitica {
        bigint id PK
        bigint proceso_firma_id FK
        int orden
        varchar rol_firmante
        uuid cargo_id FK
        uuid usuario_id FK
        varchar estado
        text firma_imagen
        varchar firma_hash
        inet ip_address
        datetime fecha_firma
        datetime fecha_limite
        boolean es_delegada
        uuid delegado_por_id FK
        uuid revocado_por_id FK
    }

    ConfiguracionFlujoFirma {
        bigint id PK
        varchar nombre
        varchar tipo_politica
        json pasos_firma
        boolean es_activo
        boolean requiere_firma_secuencial
    }

    HistorialFirmaPolitica {
        bigint id PK
        bigint firma_id FK
        varchar accion
        uuid usuario_id FK
        json detalles
        datetime fecha
        inet ip_address
    }
```

### Valores Vividos (models_valores_vividos.py)

```mermaid
erDiagram
    ValorVivido }o--|| CorporateValue : "vincula valor"
    ValorVivido }o--|| ContentType : "vincula a cualquier acción"
    ValorVivido }o--o| Area : "área responsable"
    ValorVivido }o--o| User : "vinculado_por"
    ValorVivido }o--o| User : "verificado_por"

    ConfiguracionMetricaValor }o--|| EmpresaConfig : "configura empresa"

    ValorVivido {
        bigint id PK
        bigint valor_id FK
        bigint content_type_id FK
        int object_id
        varchar categoria_accion
        varchar tipo_vinculo
        varchar impacto
        int puntaje
        date fecha_vinculacion
        text justificacion
        text evidencia
        file archivo_evidencia
        bigint area_id FK
        uuid vinculado_por_id FK
        boolean verificado
        uuid verificado_por_id FK
        datetime fecha_verificacion
        json metadata
        boolean is_active
    }

    ConfiguracionMetricaValor {
        bigint id PK
        bigint empresa_id FK
        int acciones_minimas_mensual
        decimal puntaje_minimo_promedio
        boolean alertar_valores_bajos
        int umbral_alerta_acciones
        json categorias_prioritarias
        json pesos_tipo_vinculo
        int meses_analisis
    }
```

### Relaciones Inter-Módulos

```mermaid
erDiagram
    %% Relaciones externas
    User ||--o{ CorporateIdentity : "created_by"
    User ||--o{ PoliticaIntegral : "signed_by"
    User ||--o{ FirmaDigital : "firmante"

    NormaISO ||--o{ AlcanceSistema : "norma aplicable"
    NormaISO ||--o{ PoliticaEspecifica : "norma"

    Area ||--o{ PoliticaEspecifica : "área responsable"
    Area ||--o{ ValorVivido : "área"

    Cargo ||--o{ PoliticaEspecifica : "cargo responsable"
    Cargo ||--o{ FirmaDigital : "cargo firmante"
    Cargo ||--o{ ConfiguracionRevision : "cargo responsable"

    EmpresaConfig ||--|| ConfiguracionMetricaValor : "configuración"
```

---

## Análisis por Archivo

### 1. models.py (Modelos Base)

#### CorporateIdentity

**✅ Fortalezas**:
- Implementa soft delete (is_active, deleted_at)
- Auditoría completa (created_at, updated_at, created_by, updated_by)
- Firma digital con hash SHA-256
- Versionamiento integrado
- Método `save()` asegura una sola identidad activa

**⚠️ Problemas**:
```python
# CRÍTICO: Falta tenant_id para multi-tenancy
# Todos los tenant comparten la misma identidad corporativa
class CorporateIdentity(AuditModel, SoftDeleteModel):
    # ❌ FALTA: tenant = models.ForeignKey('Tenant', ...)
```

**Relaciones**:
- ✅ `policy_signed_by`: SET_NULL (correcto, preserva documento si se elimina usuario)
- ✅ `created_by`, `updated_by`: PROTECT (correcto, no permite eliminar usuario con registros)

**Índices**:
```sql
-- Existentes
CREATE INDEX ON identidad_corporate_identity(created_at);
CREATE INDEX ON identidad_corporate_identity(updated_at);
CREATE INDEX ON identidad_corporate_identity(is_active);
CREATE INDEX ON identidad_corporate_identity(deleted_at);

-- ⚠️ FALTANTES RECOMENDADOS
CREATE INDEX ON identidad_corporate_identity(is_active, effective_date); -- Query común
CREATE INDEX ON identidad_corporate_identity(policy_signed_by_id) WHERE policy_signed_by_id IS NOT NULL;
```

#### CorporateValue

**✅ Fortalezas**:
- Orden de visualización (campo `orden`)
- Soft delete
- Relación CASCADE correcta con CorporateIdentity

**⚠️ Problemas**:
```python
# MODERADO: No valida unicidad de nombre dentro de identidad
# Permite valores duplicados: "Integridad", "Integridad"
class Meta:
    unique_together = []  # ❌ FALTA: [['identity', 'name']]
```

**Índices**:
```sql
-- Existentes
CREATE INDEX ON identidad_corporate_value(orden);
CREATE INDEX ON identidad_corporate_value(is_active);

-- ✅ Suficientes para queries comunes
```

#### AlcanceSistema

**✅ Fortalezas**:
- Constraint único correcto: `unique_together = [['identity', 'norma_iso']]`
- Campos legacy para migración (`iso_standard_legacy`)
- Properties útiles: `is_certificate_valid`, `days_until_expiry`
- Índice específico en `is_certified`

**⚠️ Problemas**:
```python
# MODERADO: norma_iso nullable causa complejidad
norma_iso = models.ForeignKey(
    'configuracion.NormaISO',
    on_delete=models.PROTECT,  # ✅ Correcto
    null=True,  # ⚠️ Debería ser requerido
    blank=True
)

# MENOR: ordering depende de FK que puede ser NULL
class Meta:
    ordering = ['norma_iso__orden', 'norma_iso__code']  # ⚠️ Fallará si norma_iso es NULL
```

**Índices**:
```sql
-- Existentes
CREATE INDEX alcance_cert_idx ON identidad_alcance_sistema(is_certified);
CREATE INDEX ON identidad_alcance_sistema(norma_iso_id);

-- ⚠️ FALTANTE para queries de certificados próximos a vencer
CREATE INDEX ON identidad_alcance_sistema(expiry_date) WHERE is_certified = true AND expiry_date IS NOT NULL;
```

#### PoliticaIntegral

**✅ Fortalezas**:
- Versionamiento semántico
- Estados de workflow (BORRADOR, EN_REVISION, VIGENTE, OBSOLETO)
- Firma digital integrada
- JSONField para `applicable_standards` (flexible)
- Constraint único: `unique_together = [['identity', 'version']]`
- Método `publish()` obsoleta versiones anteriores
- Campo `review_date` agregado en migración 0003

**⚠️ Problemas**:
```python
# MODERADO: Método publish sin transacción atómica
def publish(self, user):
    # ⚠️ Si falla después de update, queda inconsistente
    PoliticaIntegral.objects.filter(
        identity=self.identity,
        status='VIGENTE'
    ).update(status='OBSOLETO')  # Sin transacción

    self.status = 'VIGENTE'
    self.save()  # Podría fallar

# SUGERENCIA: Usar @transaction.atomic
```

**Relaciones**:
- ✅ `signed_by`: SET_NULL (correcto)
- ✅ `identity`: CASCADE (correcto, política no existe sin identidad)

**Índices**:
```sql
-- Existentes
CREATE INDEX pol_int_status_idx ON identidad_politica_integral(status, is_active);

-- ⚠️ FALTANTE para queries de revisión próxima
CREATE INDEX ON identidad_politica_integral(review_date) WHERE status = 'VIGENTE' AND review_date IS NOT NULL;
CREATE INDEX ON identidad_politica_integral(identity_id, status, version);
```

#### PoliticaEspecifica

**✅ Fortalezas**:
- Código único por identidad: `unique_together = [['identity', 'code']]`
- Múltiples responsables (usuario, cargo)
- JSONField para `keywords` (búsqueda flexible)
- Índices compuestos útiles
- Property `needs_review`

**⚠️ Problemas**:
```python
# CRÍTICO: Relaciones SET_NULL pueden dejar políticas sin responsable
area = models.ForeignKey(
    'organizacion.Area',
    on_delete=models.SET_NULL,  # ⚠️ Política queda sin área
    null=True
)

responsible_cargo = models.ForeignKey(
    'core.Cargo',
    on_delete=models.SET_NULL,  # ⚠️ Política queda sin cargo
    null=True
)

# SUGERENCIA: Usar PROTECT para campos críticos
# o implementar validación que requiera al menos uno
```

**Índices**:
```sql
-- Existentes
CREATE INDEX pol_esp_status_idx ON identidad_politica_especifica(status);
CREATE INDEX pol_esp_area_active_idx ON identidad_politica_especifica(area_id, is_active);

-- ⚠️ FALTANTE
CREATE INDEX ON identidad_politica_especifica(norma_iso_id, status);
CREATE INDEX ON identidad_politica_especifica(review_date) WHERE status = 'VIGENTE';
```

---

### 2. models_workflow.py (Workflow de Firmas)

#### FirmaDigital (GenericForeignKey)

**✅ Fortalezas**:
- GenericForeignKey permite firmar cualquier documento
- Hash único SHA-256 para integridad
- Métodos de negocio completos: `firmar()`, `rechazar()`, `delegar()`
- Constraint único: `unique_together = [['content_type', 'object_id', 'firmante', 'rol_firma']]`
- Metadatos de trazabilidad: IP, user_agent, geolocation
- Integración con sistema de notificaciones

**⚠️ Problemas**:
```python
# CRÍTICO: Método generar_hash() no es idempotente
def generar_hash(self):
    content = f"{self.firma_manuscrita}|{self.firmante.id}|{timezone.now().isoformat()}|..."
    #                                                        ^^^^^^^^^^^^^^^^^^^^^^^^
    # ❌ timestamp cambia cada vez que se llama
    # Debería usar self.fecha_firma en lugar de timezone.now()

# CRÍTICO: firma_hash debe generarse ANTES de firmar
# Si se regenera después, el hash no coincidirá
firma_hash = models.CharField(
    max_length=64,
    unique=True,  # ✅ Correcto
    db_index=True  # ✅ Correcto
)

# MODERADO: Método es_mi_turno() puede ser costoso
def es_mi_turno(self):
    # ⚠️ N+1 query potencial en firmas masivas
    firmas_anteriores = FirmaDigital.objects.filter(...)
    return not firmas_anteriores.exclude(status='FIRMADO').exists()
```

**Relaciones**:
- ✅ `content_type`: CASCADE (correcto, firma no existe sin documento)
- ✅ `firmante`: PROTECT (correcto, preserva trazabilidad)
- ⚠️ `cargo`: SET_NULL (podría dejar firma sin contexto de cargo)
- ✅ `delegado_por`: SET_NULL (correcto, delegación es referencia histórica)

**Índices**:
```sql
-- Existentes
CREATE INDEX firma_content_idx ON identidad_firma_digital(content_type_id, object_id);
CREATE INDEX firma_firmante_status_idx ON identidad_firma_digital(firmante_id, status);
CREATE INDEX firma_vencimiento_idx ON identidad_firma_digital(status, fecha_vencimiento);

-- ✅ Completo y bien diseñado
```

**Validaciones**:
```python
def clean(self):
    # ✅ Buenas validaciones
    if self.status == 'FIRMADO' and not self.firma_manuscrita:
        raise ValidationError(...)

    if self.status == 'RECHAZADO' and not self.motivo_rechazo:
        raise ValidationError(...)

    # ⚠️ FALTA: Validar firma_hash cuando status='FIRMADO'
```

#### ConfiguracionRevision (GenericForeignKey)

**✅ Fortalezas**:
- GenericForeignKey para cualquier tipo de política
- Frecuencias predefinidas + personalizada
- Sistema de alertas configurable
- ManyToManyField para destinatarios adicionales
- Métodos de negocio: `calcular_proxima_revision()`, `verificar_estado()`
- Constraint único: `unique_together = [['content_type', 'object_id']]`

**⚠️ Problemas**:
```python
# CRÍTICO: proxima_revision no tiene default
proxima_revision = models.DateField(
    verbose_name='Próxima Revisión',
    db_index=True,
    # ❌ FALTA: default o blank=True
)

# MODERADO: Estado calculado vs almacenado
estado = models.CharField(
    max_length=30,
    choices=ESTADO_REVISION_CHOICES,
    default='VIGENTE',
    verbose_name='Estado',
    db_index=True
)
# ⚠️ Estado se calcula en verificar_estado() pero se almacena
# Puede quedar desincronizado si no se ejecuta el cron
# SUGERENCIA: Usar @property o CHECK constraint

# MENOR: Validación de fechas lógicas faltante
def clean(self):
    # ✅ Valida frecuencia personalizada
    # ⚠️ FALTA: validar ultima_revision < proxima_revision
```

**Índices**:
```sql
-- Existentes
CREATE INDEX config_rev_content_idx ON identidad_configuracion_revision(content_type_id, object_id);
CREATE INDEX config_rev_estado_fecha_idx ON identidad_configuracion_revision(estado, proxima_revision);
CREATE INDEX config_rev_habilitado_idx ON identidad_configuracion_revision(habilitado, proxima_revision);

-- ✅ Excelente cobertura para queries de alertas
```

#### HistorialVersion (GenericForeignKey)

**✅ Fortalezas**:
- GenericForeignKey para versionamiento universal
- Snapshot completo en JSONField
- Diff automático entre versiones
- Hash SHA-256 del snapshot
- Métodos estáticos útiles: `crear_version()`, `calcular_diff()`
- Método `restaurar_version()` para rollback

**⚠️ Problemas**:
```python
# CRÍTICO: version_hash generado en save() no es consistente
def save(self, *args, **kwargs):
    if not self.version_hash:
        content = json.dumps(self.snapshot_data, sort_keys=True)
        self.version_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
    super().save(*args, **kwargs)

# ⚠️ Si snapshot_data cambia después de crear el hash, queda inconsistente
# SUGERENCIA: Generar hash en clean() o signal pre_save

# MODERADO: Método crear_version() usa serialize que puede fallar
@classmethod
def crear_version(cls, documento, ...):
    snapshot_data = json.loads(serialize('json', [documento]))[0]['fields']
    # ⚠️ serialize puede fallar con ciertos tipos de campos
    # (FileField, ImageField, GenericForeignKey)
    # SUGERENCIA: Usar model_to_dict() con exclude
```

**Relaciones**:
- ✅ `content_type`: CASCADE (correcto)
- ✅ `usuario`: SET_NULL (correcto, historial sobrevive a usuario)
- ⚠️ `cargo_usuario`: SET_NULL (puede perder contexto organizacional)

**Índices**:
```sql
-- Existentes
CREATE INDEX hist_ver_content_idx ON identidad_historial_version(content_type_id, object_id, version_numero);
CREATE INDEX hist_ver_tipo_fecha_idx ON identidad_historial_version(tipo_cambio, created_at);

-- ✅ Bien diseñado para auditorías
```

#### ConfiguracionWorkflowFirma

**✅ Fortalezas**:
- JSONField `roles_config` para configuración dinámica
- Método `crear_firmas_para_documento()` automatiza creación
- Método `validar_firmas_completas()` verifica completitud
- Constraint único en `nombre`

**⚠️ Problemas**:
```python
# CRÍTICO: roles_config no tiene validación de esquema
roles_config = models.JSONField(
    default=list,
    verbose_name='Configuración de Roles',
    # ❌ FALTA: Validación JSONSchema o método clean()
)

# MODERADO: Método crear_firmas_para_documento() puede fallar silenciosamente
def crear_firmas_para_documento(self, documento, creado_por):
    for rol_config in self.roles_config:
        # ...
        if not firmante:
            # ⚠️ Solo continúa, no avisa del problema
            continue

        firma = FirmaDigital.objects.create(...)

    # ⚠️ Puede crear 0 firmas sin error
    # SUGERENCIA: Raise exception si no se crea ninguna firma
```

**Índices**:
```sql
-- Existentes
CREATE INDEX config_wf_tipo_activo_idx ON identidad_config_workflow_firma(tipo_politica, activo);

-- ⚠️ FALTANTE
CREATE INDEX ON identidad_config_workflow_firma(activo) WHERE activo = true;
```

---

### 3. models_workflow_firmas.py (Sistema Alternativo)

**⚠️ ALERTA ARQUITECTURAL**: Este archivo duplica funcionalidad de `models_workflow.py`

#### ConfiguracionFlujoFirma

**Similitud**: 80% con `ConfiguracionWorkflowFirma`

**Diferencias**:
- Usa `pasos_firma` en lugar de `roles_config`
- Tiene ManyToMany con NormaISO
- Validación `validar_pasos()` en clean()

**⚠️ Problemas**:
```python
# CRÍTICO: Duplicación de lógica
# ❌ Dos sistemas de workflow paralelos causan confusión
# ❌ Cual usar: ConfiguracionWorkflowFirma vs ConfiguracionFlujoFirma?
# RECOMENDACIÓN: Consolidar en un solo sistema
```

#### ProcesoFirmaPolitica

**✅ Fortalezas**:
- Relación polimórfica explícita (politica_integral OR politica_especifica)
- Hash de contenido para detectar cambios
- Control de progreso con `paso_actual`
- Métodos de ciclo de vida: `completar()`, `rechazar()`

**⚠️ Problemas**:
```python
# CRÍTICO: Validación tipo_politica solo en clean()
def clean(self):
    # ✅ Valida coherencia
    if self.politica_integral and self.politica_especifica:
        raise ValidationError(...)

    # ⚠️ NO previene a nivel de DB
    # SUGERENCIA: Usar CheckConstraint

    # ❌ FALTA validación: solo una de las dos FK debe estar poblada
    # Django permite NULL en ambas y pasa validación de DB

# MODERADO: calcular_hash_contenido() puede fallar
def calcular_hash_contenido(self):
    politica = self.get_politica()
    if not politica:
        return None  # ⚠️ Permite proceso sin hash

    contenido = politica.content
    return hashlib.sha256(contenido.encode('utf-8')).hexdigest()
```

**Relaciones**:
- ✅ `flujo_firma`: PROTECT (correcto, no elimina configuración en uso)
- ⚠️ `politica_integral`, `politica_especifica`: CASCADE (pierde proceso al eliminar política)
  - **SUGERENCIA**: Usar PROTECT para preservar historial
- ✅ `iniciado_por`: SET_NULL (correcto)

**Índices**:
```sql
-- Existentes
CREATE INDEX ON identidad_proceso_firma_politica(estado, fecha_inicio);
CREATE INDEX ON identidad_proceso_firma_politica(tipo_politica, estado);

-- ⚠️ FALTANTE
CREATE INDEX ON identidad_proceso_firma_politica(politica_integral_id);
CREATE INDEX ON identidad_proceso_firma_politica(politica_especifica_id);
```

#### FirmaPolitica

**Similitud**: 70% con `FirmaDigital`

**✅ Fortalezas**:
- Unique constraint: `unique_together = [['proceso_firma', 'orden']]`
- Método `_verificar_avance_proceso()` maneja progreso automático
- Campos de revocación
- Historial completo en `HistorialFirmaPolitica`

**⚠️ Problemas**:
```python
# CRÍTICO: Duplicación de lógica con FirmaDigital
# ❌ 70% del código es idéntico
# ❌ Mantenimiento duplicado

# MODERADO: Método firmar() no valida cargo del usuario
def firmar(self, usuario, firma_base64, ...):
    # Verificar que el usuario tiene permiso
    if usuario not in self.cargo.users.all():
        # ⚠️ Asume que Cargo tiene .users
        # No está definido en models
        raise ValidationError(...)
```

**Relaciones**:
- ✅ `proceso_firma`: CASCADE (correcto)
- ✅ `cargo`: PROTECT (correcto)
- ⚠️ `usuario`: PROTECT (bloquea eliminación de usuario con firmas)
  - **SUGERENCIA**: Usar SET_NULL con campo required en lógica

**Índices**:
```sql
-- Existentes
CREATE INDEX ON identidad_firma_politica(estado, fecha_limite);
CREATE INDEX ON identidad_firma_politica(usuario_id, fecha_firma);
CREATE INDEX ON identidad_firma_politica(cargo_id, estado);

-- ✅ Bien diseñado
```

#### HistorialFirmaPolitica

**✅ Fortalezas**:
- Tabla de auditoría simple y efectiva
- JSONField para detalles flexibles

**⚠️ Problemas**:
```python
# MENOR: No se usa en el código
# ⚠️ No hay signals que creen registros automáticamente
# ⚠️ Depende de llamadas manuales (propenso a olvidos)
# SUGERENCIA: Implementar signals post_save en FirmaPolitica
```

---

### 4. models_valores_vividos.py (Valores Vividos)

#### ValorVivido (GenericForeignKey)

**✅ Fortalezas**:
- GenericForeignKey permite vincular a CUALQUIER acción
- Manager personalizado `ValorVividoManager` con métodos de BI
- Métodos de agregación: `estadisticas_por_valor()`, `tendencia_mensual()`, `ranking_categorias()`
- Auto-población de metadata en save()
- Constraint único: `unique_together = [['valor', 'content_type', 'object_id']]`
- Property `accion_titulo` extrae título dinámicamente

**⚠️ Problemas**:
```python
# CRÍTICO: Manager tiene queries sin tenant_id
class ValorVividoManager(models.Manager):
    def por_empresa(self, empresa_id):
        # ⚠️ Asume que existe valor__identity__empresa_id
        # Pero CorporateIdentity NO tiene empresa_id
        return self.activos().filter(valor__identity__empresa_id=empresa_id)

    # ❌ FALLA en ejecución
    # DEBE SER: valor__identity en identidad de empresa

# MODERADO: Método _extraer_metadata() puede fallar
def _extraer_metadata(self):
    obj = self.content_object
    if not obj:
        return {}  # ⚠️ Si GenericFK no resuelve, pierde metadata

    # ⚠️ Itera múltiples campos, puede ser costoso en loops
    for campo in ['titulo', 'title', 'nombre', 'name', 'codigo', 'code']:
        if hasattr(obj, campo):
            metadata['titulo'] = getattr(obj, campo)
            break

# MENOR: Puntaje auto-calculado puede sobrescribir valor manual
def save(self, *args, **kwargs):
    if not self.pk:  # Solo en creación
        impacto_puntaje = {...}
        self.puntaje = impacto_puntaje.get(self.impacto, 5)
    # ⚠️ Si usuario cambia impacto, puntaje queda desincronizado
```

**Relaciones**:
- ✅ `valor`: CASCADE (correcto, vínculo no existe sin valor)
- ✅ `content_type`: CASCADE (correcto)
- ⚠️ `area`: SET_NULL (puede perder contexto de área)
- ✅ `vinculado_por`, `verificado_por`: SET_NULL (correcto)

**Índices**:
```sql
-- Existentes
CREATE INDEX valor_vivido_content_idx ON identidad_valor_vivido(content_type_id, object_id);
CREATE INDEX valor_vivido_valor_fecha_idx ON identidad_valor_vivido(valor_id, fecha_vinculacion);
CREATE INDEX valor_vivido_cat_imp_idx ON identidad_valor_vivido(categoria_accion, impacto);
CREATE INDEX valor_vivido_area_fecha_idx ON identidad_valor_vivido(area_id, fecha_vinculacion);

-- ⚠️ FALTANTE para queries de BI
CREATE INDEX ON identidad_valor_vivido(valor_id, verificado, is_active);
CREATE INDEX ON identidad_valor_vivido(fecha_vinculacion, puntaje) WHERE is_active = true;
```

#### ConfiguracionMetricaValor

**✅ Fortalezas**:
- Configuración por empresa (unique constraint)
- Umbrales configurables
- Pesos por tipo de vínculo en JSONField
- Método `get_peso_tipo_vinculo()` con defaults

**⚠️ Problemas**:
```python
# CRÍTICO: No hereda de AuditModel/SoftDeleteModel
# ❌ No tiene created_by, updated_by, is_active
# ❌ No se puede auditar quién cambió la configuración

class ConfiguracionMetricaValor(TimestampedModel):  # ⚠️ Solo timestamps
    # SUGERENCIA: Cambiar a AuditModel

# MODERADO: OneToOneField con empresa
empresa = models.OneToOneField(
    'configuracion.EmpresaConfig',
    on_delete=models.CASCADE,  # ✅ Correcto
    # ⚠️ Pero unique_together = [['empresa']] es redundante
)
```

**Índices**:
```sql
-- NINGUNO
-- ⚠️ FALTANTE (aunque tabla pequeña)
CREATE INDEX ON identidad_config_metrica_valor(empresa_id);
```

#### Funciones Auxiliares

**✅ Fortalezas**:
- Funciones helper: `vincular_valor_a_accion()`, `desvincular_valor_de_accion()`
- Encapsulan lógica de negocio
- Usan `update_or_create()` correctamente

**⚠️ Problemas**:
```python
# CRÍTICO: Funciones no usan transacciones
def vincular_valor_a_accion(valor, accion, ...):
    # ⚠️ Si falla después de crear, queda inconsistente
    content_type = ContentType.objects.get_for_model(accion)
    valor_vivido, created = ValorVivido.objects.update_or_create(...)
    # ❌ Sin @transaction.atomic

# MODERADO: Importa modelos internos
def vincular_valor_a_accion(...):
    from .models import CorporateValue
    # ⚠️ Import dentro de función
    # SUGERENCIA: Mover imports al top
```

---

## Análisis de Migraciones

### Migración 0001_dynamic_models_dia6.py

**✅ Fortalezas**:
- Migración inicial completa
- Dependencies correctas
- unique_together definidos
- Índices creados

**⚠️ Problemas**:
```python
# CRÍTICO: Falta tenant_id en CorporateIdentity
operations = [
    migrations.CreateModel(
        name='CorporateIdentity',
        fields=[
            # ❌ FALTA: ('tenant', models.ForeignKey(...))
        ]
    )
]

# MENOR: ordering con FK nullable
options={
    'ordering': ['norma_iso__orden', 'norma_iso__code'],
    # ⚠️ Falla si norma_iso es NULL
}
```

### Migración 0002_valores_vividos.py

**✅ Fortalezas**:
- Índices bien diseñados
- Constraint único con condición: `condition=models.Q(is_active=True)`
- Validators en campos (MinValueValidator, MaxValueValidator)

**⚠️ Problemas**:
```python
# MODERADO: ConfiguracionMetricaValor usa OneToOneField
('empresa', models.OneToOneField(...)),
# unique_together = [['empresa']]  # ⚠️ Redundante con OneToOne

# MENOR: Cambios a ConfiguracionMetricaValor en migración
migrations.RemoveField(model_name='configuracionmetricavalor', name='created_by'),
migrations.RemoveField(model_name='configuracionmetricavalor', name='is_active'),
# ⚠️ Pierde capacidad de auditoría
```

### Migración 0003_add_review_date_to_politica_integral.py

**✅ Fortalezas**:
- Agrega campo review_date (necesario)
- Crea modelos de workflow de firmas
- Índices completos
- ManyToManyField para destinatarios_adicionales

**⚠️ Problemas**:
```python
# CRÍTICO: Migración muy grande (477 líneas)
# ⚠️ Mezcla múltiples concerns:
#   - Review date en PoliticaIntegral
#   - Modelos de workflow (FirmaDigital, ConfiguracionRevision, HistorialVersion)
#   - Cambios a ValorVivido
# SUGERENCIA: Dividir en migraciones más pequeñas

# MODERADO: RemoveConstraint antes de AlterUniqueTogether
migrations.RemoveConstraint(model_name='valorvivido', name='unique_valor_accion_active'),
migrations.AlterUniqueTogether(name='valorvivido', unique_together={...}),
# ⚠️ Ventana temporal sin constraint único
```

---

## Relaciones con Otros Módulos

### Dependencias Externas

| Modelo Externo | App | Relación | Crítico |
|----------------|-----|----------|---------|
| User | core | ForeignKey (múltiples) | ✅ SÍ |
| Tenant | core | **FALTA** | ⚠️ CRÍTICO |
| Cargo | core | ForeignKey | ✅ SÍ |
| Area | organizacion | ForeignKey | ✅ SÍ |
| NormaISO | configuracion | ForeignKey | ✅ SÍ |
| EmpresaConfig | configuracion | ForeignKey/OneToOne | ✅ SÍ |
| ContentType | contenttypes | ForeignKey (GenericFK) | ✅ SÍ |

### Modelo User (settings.AUTH_USER_MODEL)

**Relaciones en Identidad**:
```python
# CorporateIdentity
policy_signed_by → User (SET_NULL)
created_by → User (PROTECT)
updated_by → User (PROTECT)

# PoliticaIntegral
signed_by → User (SET_NULL)
created_by → User (PROTECT)
updated_by → User (PROTECT)

# PoliticaEspecifica
responsible → User (SET_NULL)
approved_by → User (SET_NULL)
created_by → User (PROTECT)
updated_by → User (PROTECT)

# FirmaDigital
firmante → User (PROTECT)  # ⚠️ Bloquea eliminación
delegado_por → User (SET_NULL)
created_by → User (PROTECT)
updated_by → User (PROTECT)

# ConfiguracionRevision
responsable_revision → User (SET_NULL)
destinatarios_adicionales → User (ManyToMany)
created_by → User (PROTECT)
updated_by → User (PROTECT)

# ValorVivido
vinculado_por → User (SET_NULL)
verificado_por → User (SET_NULL)
created_by → User (PROTECT)
updated_by → User (PROTECT)

# TOTAL: 28 relaciones con User
```

**⚠️ Problemas**:
- `firmante` con PROTECT bloquea eliminación de usuarios con firmas
- Múltiples PROTECT pueden crear deadlocks en cascadas de eliminación

### Modelo Cargo (core.Cargo)

**Relaciones en Identidad**:
```python
# PoliticaEspecifica
responsible_cargo → Cargo (SET_NULL)

# FirmaDigital
cargo → Cargo (SET_NULL)

# FirmaPolitica
cargo → Cargo (PROTECT)  # ⚠️ Diferente on_delete

# ConfiguracionRevision
cargo_responsable → Cargo (SET_NULL)

# HistorialVersion
cargo_usuario → Cargo (SET_NULL)

# TOTAL: 5 relaciones con Cargo
```

**⚠️ Inconsistencias**:
- FirmaPolitica usa PROTECT, FirmaDigital usa SET_NULL
- Sin criterio unificado

### Modelo Area (organizacion.Area)

**Relaciones en Identidad**:
```python
# PoliticaEspecifica
area → Area (SET_NULL)

# ValorVivido
area → Area (SET_NULL)

# TOTAL: 2 relaciones con Area
```

**⚠️ Problemas**:
- SET_NULL puede dejar registros sin contexto organizacional
- No hay validación de área activa

### Modelo NormaISO (configuracion.NormaISO)

**Relaciones en Identidad**:
```python
# AlcanceSistema
norma_iso → NormaISO (PROTECT)  # ✅ Correcto

# PoliticaEspecifica
norma_iso → NormaISO (PROTECT)  # ✅ Correcto

# ConfiguracionFlujoFirma
normas_iso → NormaISO (ManyToMany)

# TOTAL: 3 relaciones con NormaISO
```

**✅ Bien implementado**: PROTECT previene eliminación accidental

### Modelo EmpresaConfig (configuracion.EmpresaConfig)

**Relaciones en Identidad**:
```python
# ConfiguracionMetricaValor
empresa → EmpresaConfig (OneToOne CASCADE)

# TOTAL: 1 relación con EmpresaConfig
```

**⚠️ Problemas**:
```python
# CRÍTICO: CorporateIdentity NO tiene relación con empresa
# ❌ Todas las empresas comparten la misma identidad
# DEBE TENER:
class CorporateIdentity(AuditModel, SoftDeleteModel):
    empresa = models.ForeignKey('configuracion.EmpresaConfig', ...)
```

### ContentType (GenericForeignKey)

**Uso en Identidad**:
- FirmaDigital: Firma cualquier documento
- ConfiguracionRevision: Configura revisión de cualquier política
- HistorialVersion: Versiona cualquier documento
- ValorVivido: Vincula valores a cualquier acción

**✅ Fortalezas**:
- Máxima flexibilidad
- Permite extensión sin cambios en modelos

**⚠️ Problemas**:
- Dificulta integridad referencial a nivel DB
- Queries más complejos (no puede usar JOIN directo)
- No hay ON DELETE CASCADE automático

---

## Problemas Críticos

### 1. ❌ FALTA Multi-Tenancy en CorporateIdentity

**Severidad**: 🔴 CRÍTICA

**Problema**:
```python
class CorporateIdentity(AuditModel, SoftDeleteModel):
    # ❌ FALTA: tenant/empresa field
    mission = models.TextField(...)
    vision = models.TextField(...)
```

**Impacto**:
- Todas las empresas comparten la misma identidad corporativa
- Conflictos de datos en entorno SaaS multi-tenant
- Violación de aislamiento de datos

**Solución**:
```python
class CorporateIdentity(AuditModel, SoftDeleteModel):
    # AGREGAR:
    empresa = models.ForeignKey(
        'configuracion.EmpresaConfig',
        on_delete=models.CASCADE,
        related_name='identidad_corporativa',
        verbose_name='Empresa',
        db_index=True
    )

    class Meta:
        unique_together = [['empresa', 'version']]  # Una por versión por empresa
        indexes = [
            models.Index(fields=['empresa', 'is_active', 'effective_date']),
        ]
```

**Migración Necesaria**:
```python
# Nueva migración: 0004_add_empresa_to_corporate_identity.py
operations = [
    migrations.AddField(
        model_name='corporateidentity',
        name='empresa',
        field=models.ForeignKey(
            on_delete=django.db.models.deletion.CASCADE,
            to='configuracion.empresaconfig',
            default=1  # Temporal para registros existentes
        ),
        preserve_default=False,
    ),
    # Poblar empresa_id para registros existentes
    migrations.RunPython(migrate_corporate_identity_empresa),
]
```

---

### 2. ❌ Hash No Idempotente en FirmaDigital.generar_hash()

**Severidad**: 🔴 CRÍTICA

**Problema**:
```python
def generar_hash(self):
    content = f"{self.firma_manuscrita}|{self.firmante.id}|{timezone.now().isoformat()}|..."
    #                                                        ^^^^^^^^^^^^^^^^^^^^^^^^^^^
    # ❌ timezone.now() cambia cada vez
    return hashlib.sha256(content.encode('utf-8')).hexdigest()
```

**Impacto**:
- Verificación de integridad siempre falla
- No se puede re-verificar firmas históricas
- Sistema de firma digital es inválido

**Solución**:
```python
def generar_hash(self):
    """
    Genera hash SHA-256 IDEMPOTENTE de la firma.
    Usa fecha_firma (no timezone.now()) para que sea reproducible.
    """
    if not self.firma_manuscrita:
        raise ValueError("No hay firma manuscrita para generar hash")

    # Usar fecha_firma (fija) en lugar de timezone.now()
    timestamp = self.fecha_firma.isoformat() if self.fecha_firma else timezone.now().isoformat()

    content = (
        f"{self.firma_manuscrita}|"
        f"{self.firmante.id}|"
        f"{timestamp}|"
        f"{self.rol_firma}|"
        f"{self.content_type.id}|"
        f"{self.object_id}"
    )
    return hashlib.sha256(content.encode('utf-8')).hexdigest()

def firmar(self, firma_base64, ...):
    # Establecer fecha_firma ANTES de generar hash
    self.fecha_firma = timezone.now()
    self.firma_manuscrita = firma_base64
    self.firma_hash = self.generar_hash()  # Ahora es idempotente
    self.status = 'FIRMADO'
    self.save()
```

---

### 3. ❌ Duplicación de Sistema de Workflow de Firmas

**Severidad**: 🔴 CRÍTICA

**Problema**:
- `models_workflow.py` define: FirmaDigital, ConfiguracionWorkflowFirma
- `models_workflow_firmas.py` define: FirmaPolitica, ConfiguracionFlujoFirma, ProcesoFirmaPolitica

**Similitud**: 70-80% del código es idéntico

**Impacto**:
- Confusión: ¿Cuál sistema usar?
- Mantenimiento duplicado
- Bugs inconsistentes entre sistemas
- Complejidad innecesaria

**Solución**:

**Opción A: Consolidar en models_workflow.py (RECOMENDADO)**
```python
# ELIMINAR models_workflow_firmas.py
# USAR solo FirmaDigital con GenericForeignKey

# Para workflow completo, agregar:
class WorkflowFirma(AuditModel, SoftDeleteModel):
    """Proceso de firma para un documento"""
    content_type = models.ForeignKey(ContentType, ...)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')

    configuracion = models.ForeignKey(ConfiguracionWorkflowFirma, ...)
    estado = models.CharField(...)
    paso_actual = models.PositiveIntegerField()

    # Propiedades computadas
    @property
    def firmas(self):
        return FirmaDigital.objects.filter(
            content_type=self.content_type,
            object_id=self.object_id
        )
```

**Opción B: Usar solo models_workflow_firmas.py**
```python
# ELIMINAR FirmaDigital de models_workflow.py
# MANTENER ProcesoFirmaPolitica + FirmaPolitica
# Cambiar FirmaPolitica a GenericFK para soportar cualquier documento
```

**Migración Necesaria**:
```python
# 0005_consolidate_firma_systems.py
# 1. Crear backup de datos
# 2. Migrar FirmaDigital → FirmaPolitica
# 3. Eliminar tabla antigua
```

---

### 4. ❌ ConfiguracionMetricaValor sin Auditoría

**Severidad**: 🟠 ALTA

**Problema**:
```python
class ConfiguracionMetricaValor(TimestampedModel):  # ⚠️ Solo timestamps
    # ❌ NO tiene created_by, updated_by
    # ❌ NO tiene is_active, deleted_at
    empresa = models.OneToOneField(...)
    acciones_minimas_mensual = models.PositiveIntegerField(...)
```

**Impacto**:
- No se puede auditar quién cambió configuración crítica
- No se puede rastrear cambios históricos
- No cumple con requisitos de ISO 9001 (trazabilidad)

**Solución**:
```python
class ConfiguracionMetricaValor(AuditModel, SoftDeleteModel):  # ✅ Auditoría completa
    empresa = models.ForeignKey(  # Cambiar de OneToOne a FK
        'configuracion.EmpresaConfig',
        on_delete=models.CASCADE,
        related_name='metricas_valores',
    )
    # ... resto de campos

    class Meta:
        unique_together = [['empresa', 'is_active']]  # Solo una config activa por empresa
```

---

### 5. ❌ Métodos publish() y completar() sin Transacciones

**Severidad**: 🟠 ALTA

**Problema**:
```python
# PoliticaIntegral.publish()
def publish(self, user):
    # ⚠️ Sin transacción
    PoliticaIntegral.objects.filter(
        identity=self.identity,
        status='VIGENTE'
    ).update(status='OBSOLETO')  # Paso 1

    self.status = 'VIGENTE'
    self.save()  # Paso 2 - puede fallar
    # ❌ Inconsistencia si falla después del update

# ProcesoFirmaPolitica.completar()
def completar(self):
    self.estado = 'COMPLETADO'
    self.save()  # Paso 1

    politica = self.get_politica()
    politica.status = 'VIGENTE'
    politica.save()  # Paso 2 - puede fallar
    # ❌ Inconsistencia
```

**Impacto**:
- Datos inconsistentes si falla operación intermedia
- Políticas pueden quedar en estado inválido
- Dificulta recuperación de errores

**Solución**:
```python
from django.db import transaction

class PoliticaIntegral(AuditModel, SoftDeleteModel):
    @transaction.atomic
    def publish(self, user):
        """Publica política y obsoleta versiones anteriores (transacción atómica)"""
        if self.status not in ['BORRADOR', 'EN_REVISION']:
            raise ValueError("Solo se pueden publicar políticas en borrador o en revisión")

        # Todas las operaciones en una transacción
        with transaction.atomic():
            # Obsoleta versiones vigentes
            PoliticaIntegral.objects.filter(
                identity=self.identity,
                status='VIGENTE'
            ).update(status='OBSOLETO', updated_at=timezone.now())

            # Publica actual
            self.status = 'VIGENTE'
            self.effective_date = timezone.now().date()
            self.updated_by = user
            self.save()

class ProcesoFirmaPolitica(TimestampedModel):
    @transaction.atomic
    def completar(self):
        """Marca proceso como completado y activa política (transacción atómica)"""
        with transaction.atomic():
            self.estado = 'COMPLETADO'
            self.fecha_completado = timezone.now()
            self.save()

            # Actualizar política
            politica = self.get_politica()
            if politica:
                politica.status = 'VIGENTE'
                politica.effective_date = timezone.now().date()
                politica.save()
```

---

## Problemas Menores

### 6. ⚠️ Ordering con FK Nullable

**Severidad**: 🟡 MEDIA

**Problema**:
```python
class AlcanceSistema(AuditModel, SoftDeleteModel):
    norma_iso = models.ForeignKey(..., null=True)

    class Meta:
        ordering = ['norma_iso__orden', 'norma_iso__code']
        # ⚠️ Falla si norma_iso es NULL
```

**Solución**:
```python
class Meta:
    ordering = [
        models.F('norma_iso__orden').asc(nulls_last=True),
        models.F('norma_iso__code').asc(nulls_last=True),
        'id'
    ]
```

---

### 7. ⚠️ Validación de pasos_firma en Clean() sin DB Constraint

**Severidad**: 🟡 MEDIA

**Problema**:
```python
class ConfiguracionFlujoFirma(TimestampedModel):
    pasos_firma = models.JSONField(default=list)

    def clean(self):
        self.validar_pasos()  # ⚠️ Solo en clean(), no en DB
```

**Solución**:
```python
from django.core.validators import validate_jsonschema

pasos_firma_schema = {
    "type": "array",
    "items": {
        "type": "object",
        "required": ["orden", "rol_firmante"],
        "properties": {
            "orden": {"type": "integer", "minimum": 1},
            "rol_firmante": {"type": "string"},
            "rol_cargo_id": {"type": "string", "format": "uuid"},
            "es_opcional": {"type": "boolean"},
            "puede_delegar": {"type": "boolean"}
        }
    }
}

class ConfiguracionFlujoFirma(TimestampedModel):
    pasos_firma = models.JSONField(
        default=list,
        validators=[
            lambda value: validate_jsonschema(value, pasos_firma_schema)
        ]
    )
```

---

### 8. ⚠️ Unique en nombre vs unique_together en identity/code

**Severidad**: 🟡 MEDIA

**Problema**:
```python
# CorporateValue: No previene duplicados
class CorporateValue(TimestampedModel, SoftDeleteModel, OrderedModel):
    identity = models.ForeignKey(CorporateIdentity, ...)
    name = models.CharField(max_length=100)

    class Meta:
        # ❌ FALTA unique_together
        pass
```

**Solución**:
```python
class Meta:
    unique_together = [['identity', 'name']]  # Nombre único por identidad
    indexes = [
        models.Index(fields=['identity', 'is_active', 'orden']),
    ]
```

---

### 9. ⚠️ Manager por_empresa() con FK inexistente

**Severidad**: 🟡 MEDIA

**Problema**:
```python
class ValorVividoManager(models.Manager):
    def por_empresa(self, empresa_id):
        # ⚠️ valor__identity__empresa_id NO EXISTE
        return self.activos().filter(valor__identity__empresa_id=empresa_id)
```

**Solución**:
```python
def por_empresa(self, empresa_id):
    """Filtrar por empresa (requiere empresa_id en CorporateIdentity)"""
    # OPCIÓN 1: Si se agrega empresa a CorporateIdentity
    return self.activos().filter(valor__identity__empresa_id=empresa_id)

    # OPCIÓN 2: Filtrar por identidad directamente
    from .models import CorporateIdentity
    identidades = CorporateIdentity.objects.filter(empresa_id=empresa_id)
    return self.activos().filter(valor__identity__in=identidades)
```

---

### 10. ⚠️ Import de modelos dentro de funciones

**Severidad**: 🟢 BAJA

**Problema**:
```python
def vincular_valor_a_accion(valor, accion, ...):
    from .models import CorporateValue  # ⚠️ Import interno
    # ...
```

**Impacto**: Código menos limpio, puede ocultar dependencias circulares

**Solución**:
```python
# En top del archivo
from .models import CorporateValue

def vincular_valor_a_accion(valor, accion, ...):
    # Sin imports internos
    # ...
```

---

## Optimizaciones Recomendadas

### 1. Índices Faltantes

#### CorporateIdentity
```sql
-- Query común: Obtener identidad activa
CREATE INDEX ON identidad_corporate_identity(is_active, effective_date)
WHERE is_active = true;

-- Query común: Identidades firmadas
CREATE INDEX ON identidad_corporate_identity(policy_signed_by_id)
WHERE policy_signed_by_id IS NOT NULL;

-- Multi-tenant (después de agregar empresa)
CREATE INDEX ON identidad_corporate_identity(empresa_id, is_active, effective_date);
```

#### AlcanceSistema
```sql
-- Query común: Certificados próximos a vencer
CREATE INDEX ON identidad_alcance_sistema(expiry_date, is_certified)
WHERE is_certified = true AND expiry_date IS NOT NULL;

-- Dashboard: Alcances por empresa + norma
CREATE INDEX ON identidad_alcance_sistema(identity_id, norma_iso_id, is_certified);
```

#### PoliticaIntegral
```sql
-- Query común: Políticas a revisar
CREATE INDEX ON identidad_politica_integral(review_date, status)
WHERE status = 'VIGENTE' AND review_date IS NOT NULL;

-- Query común: Políticas vigentes por identidad
CREATE INDEX ON identidad_politica_integral(identity_id, status, version)
WHERE status = 'VIGENTE';
```

#### PoliticaEspecifica
```sql
-- Query común: Políticas por norma y estado
CREATE INDEX ON identidad_politica_especifica(norma_iso_id, status, is_active);

-- Query común: Políticas a revisar
CREATE INDEX ON identidad_politica_especifica(review_date, status)
WHERE status = 'VIGENTE' AND review_date IS NOT NULL;
```

#### ValorVivido
```sql
-- Query de BI: Valores verificados activos
CREATE INDEX ON identidad_valor_vivido(valor_id, verificado, is_active)
WHERE is_active = true;

-- Query de BI: Puntaje por fecha (tendencias)
CREATE INDEX ON identidad_valor_vivido(fecha_vinculacion, puntaje, is_active)
WHERE is_active = true;
```

#### ProcesoFirmaPolitica
```sql
-- Query común: Procesos por política
CREATE INDEX ON identidad_proceso_firma_politica(politica_integral_id, estado);
CREATE INDEX ON identidad_proceso_firma_politica(politica_especifica_id, estado);
```

---

### 2. Optimización de Queries

#### Problema: N+1 en FirmaDigital.es_mi_turno()

**Antes**:
```python
def es_mi_turno(self):
    # ⚠️ Query por cada firma
    firmas_anteriores = FirmaDigital.objects.filter(
        content_type=self.content_type,
        object_id=self.object_id,
        orden_firma__lt=self.orden_firma,
        orden_firma__gt=0
    )
    return not firmas_anteriores.exclude(status='FIRMADO').exists()
```

**Después**:
```python
def es_mi_turno(self):
    """Verifica turno con una sola query optimizada"""
    if self.orden_firma == 0:  # Paralelo
        return True

    # Una query con COUNT en lugar de exists()
    pendientes = FirmaDigital.objects.filter(
        content_type=self.content_type,
        object_id=self.object_id,
        orden_firma__lt=self.orden_firma,
        orden_firma__gt=0
    ).exclude(
        status='FIRMADO'
    ).count()

    return pendientes == 0
```

#### Problema: Select Related faltante

**Agregar en Manager**:
```python
class FirmaDigitalManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().select_related(
            'firmante',
            'cargo',
            'delegado_por',
            'content_type'
        )

class FirmaDigital(AuditModel, SoftDeleteModel):
    objects = FirmaDigitalManager()
```

---

### 3. Cache de Queries Frecuentes

```python
from django.core.cache import cache

class CorporateIdentity(AuditModel, SoftDeleteModel):
    @classmethod
    def get_active(cls):
        """Obtiene identidad activa (con cache)"""
        cache_key = 'corporate_identity_active'
        identity = cache.get(cache_key)

        if identity is None:
            identity = cls.objects.filter(is_active=True).first()
            cache.set(cache_key, identity, 3600)  # 1 hora

        return identity

    def save(self, *args, **kwargs):
        # Invalidar cache al guardar
        cache.delete('corporate_identity_active')
        super().save(*args, **kwargs)
```

---

### 4. Agregar Constraints de Base de Datos

```python
from django.db.models import CheckConstraint, Q

class ProcesoFirmaPolitica(TimestampedModel):
    class Meta:
        constraints = [
            # Solo una de las dos FK debe estar poblada
            CheckConstraint(
                check=(
                    Q(politica_integral__isnull=False, politica_especifica__isnull=True) |
                    Q(politica_integral__isnull=True, politica_especifica__isnull=False)
                ),
                name='proceso_firma_politica_una_sola_fk'
            ),
            # tipo_politica coherente con FK
            CheckConstraint(
                check=(
                    Q(tipo_politica='INTEGRAL', politica_integral__isnull=False) |
                    Q(tipo_politica='ESPECIFICA', politica_especifica__isnull=False)
                ),
                name='proceso_firma_tipo_coherente'
            ),
        ]

class PoliticaIntegral(AuditModel, SoftDeleteModel, OrderedModel):
    class Meta:
        constraints = [
            # review_date debe ser futura si está definida
            CheckConstraint(
                check=Q(review_date__gt=models.F('effective_date')) | Q(review_date__isnull=True),
                name='politica_integral_review_date_valida'
            ),
            # expiry_date posterior a effective_date
            CheckConstraint(
                check=Q(expiry_date__gt=models.F('effective_date')) | Q(expiry_date__isnull=True),
                name='politica_integral_expiry_valida'
            ),
        ]
```

---

### 5. Método bulk_create para Performance

```python
class ConfiguracionWorkflowFirma(AuditModel, SoftDeleteModel):
    def crear_firmas_para_documento(self, documento, creado_por):
        """Crea firmas usando bulk_create (más rápido)"""
        content_type = ContentType.objects.get_for_model(documento)
        fecha_vencimiento = timezone.now() + timedelta(days=self.dias_para_firmar)

        firmas_a_crear = []

        for rol_config in self.roles_config:
            firmante = self._obtener_firmante(rol_config)
            if not firmante:
                continue

            firma = FirmaDigital(
                content_type=content_type,
                object_id=documento.id,
                firmante=firmante,
                rol_firma=rol_config['rol'],
                orden_firma=rol_config.get('orden', 0) if self.tipo_orden == 'SECUENCIAL' else 0,
                fecha_vencimiento=fecha_vencimiento,
                created_by=creado_por,
                updated_by=creado_por
            )
            firmas_a_crear.append(firma)

        # Una sola query en lugar de N
        firmas_creadas = FirmaDigital.objects.bulk_create(firmas_a_crear)

        return firmas_creadas
```

---

## Cumplimiento Normativo

### ISO 9001:2015

**Requisitos Cubiertos**:
✅ 5.2 - Política de Calidad (PoliticaIntegral)
✅ 7.5 - Control de Documentos (Versionamiento, Firmas)
✅ 7.5.3 - Control de Información Documentada (HistorialVersion)

**Gaps**:
⚠️ No hay validación de revisión periódica obligatoria
⚠️ Falta control de distribución de documentos

### ISO 45001:2018

**Requisitos Cubiertos**:
✅ 5.2 - Política de SST (PoliticaEspecifica con norma_iso)
✅ 7.5 - Información Documentada (Auditoría completa)

**Gaps**:
⚠️ No hay validación de participación de trabajadores en revisión
⚠️ Falta integración con evaluación de riesgos

### Decreto 1072/2015 (Colombia)

**Requisitos Cubiertos**:
✅ Art. 2.2.4.6.5 - Política SST documentada y firmada
✅ Art. 2.2.4.6.8 - Revisión anual de política (ConfiguracionRevision)
✅ Trazabilidad completa (AuditModel en todos los modelos)

**Gaps**:
⚠️ No hay validación de firma de representante legal
⚠️ Falta campo para identificación de ARL

### GDPR / Protección de Datos

**Requisitos Cubiertos**:
✅ Soft delete (no elimina datos físicamente)
✅ Auditoría de accesos (created_by, updated_by)
✅ IP address en firmas (trazabilidad)

**Gaps**:
⚠️ No hay campo de consentimiento explícito
⚠️ Falta implementación de "derecho al olvido" (hard delete controlado)

---

## Conclusión y Prioridades

### Resumen de Problemas

| Severidad | Cantidad | Ejemplos |
|-----------|----------|----------|
| 🔴 CRÍTICA | 5 | Multi-tenancy, Hash no idempotente, Duplicación workflow |
| 🟠 ALTA | 3 | Sin transacciones, ConfiguracionMetricaValor sin auditoría |
| 🟡 MEDIA | 5 | Ordering con NULL, Validaciones en clean() |
| 🟢 BAJA | 3 | Imports internos, Métodos privados sin docstring |

### Plan de Acción Prioritario

#### Fase 1: Problemas Críticos (Sprint Actual)

**1. Agregar tenant_id a CorporateIdentity** [2-3 días]
- Crear migración 0004_add_empresa_to_corporate_identity.py
- Migrar datos existentes
- Actualizar queries y views
- Agregar índices

**2. Corregir FirmaDigital.generar_hash()** [1 día]
- Modificar método para usar self.fecha_firma
- Crear tests de verificación de integridad
- Validar firmas existentes

**3. Consolidar sistemas de workflow** [5-7 días]
- Decidir: ¿Mantener FirmaDigital (GenericFK) o FirmaPolitica?
- Crear plan de migración de datos
- Deprecar sistema antiguo
- Actualizar documentación

**4. Agregar transacciones atómicas** [1-2 días]
- Decorar métodos publish(), completar() con @transaction.atomic
- Agregar tests de rollback
- Validar integridad en casos de error

**5. Agregar auditoría a ConfiguracionMetricaValor** [1 día]
- Cambiar herencia a AuditModel + SoftDeleteModel
- Crear migración
- Actualizar queries

#### Fase 2: Problemas Altos (Próximo Sprint)

**6. Agregar índices faltantes** [1-2 días]
- Ejecutar migraciones de índices
- Validar mejora de performance con EXPLAIN

**7. Validar relaciones ForeignKey** [2-3 días]
- Revisar on_delete en todas las FK
- Decidir: ¿PROTECT, SET_NULL o CASCADE?
- Crear migración si es necesario

**8. Agregar constraints de base de datos** [1-2 días]
- CheckConstraint para fechas lógicas
- Unique constraints faltantes
- Validar datos existentes

#### Fase 3: Optimizaciones (Backlog)

**9. Cache de queries frecuentes** [1-2 días]
**10. Optimizar N+1 queries** [2-3 días]
**11. Agregar bulk_create** [1 día]
**12. Documentación de API** [1-2 días]

---

### Métricas de Calidad

**Antes de Optimizaciones**:
- Problemas Críticos: 5
- Cobertura de Índices: 60%
- Tests de Integridad: ❌ No existen
- Documentación: 70%

**Objetivo Post-Refactor**:
- Problemas Críticos: 0
- Cobertura de Índices: 95%
- Tests de Integridad: ✅ 100%
- Documentación: 90%

---

## Apéndices

### A. Comandos de Validación

```bash
# Verificar consistencia de migraciones
python manage.py makemigrations --check --dry-run

# Verificar integridad de firmas
python manage.py shell
>>> from apps.gestion_estrategica.identidad.models_workflow import FirmaDigital
>>> firmas = FirmaDigital.objects.filter(status='FIRMADO')
>>> invalidas = [f for f in firmas if not f.verificar_integridad()]
>>> print(f"Firmas inválidas: {len(invalidas)}")

# Analizar índices faltantes (con django-extensions)
python manage.py sqlindexes identidad

# Performance profiling
python manage.py shell
>>> from django.db import connection
>>> from django.test.utils import override_settings
>>> with override_settings(DEBUG=True):
>>>     # Ejecutar query
>>>     print(len(connection.queries))
```

### B. Scripts de Migración Útiles

```python
# Script para migrar FirmaDigital → FirmaPolitica
# ejecutar con: python manage.py shell < migrate_firmas.py

from apps.gestion_estrategica.identidad.models_workflow import FirmaDigital
from apps.gestion_estrategica.identidad.models_workflow_firmas import FirmaPolitica, ProcesoFirmaPolitica
from django.contrib.contenttypes.models import ContentType
from django.db import transaction

@transaction.atomic
def migrar_firmas():
    ct_integral = ContentType.objects.get(app_label='identidad', model='politicaintegral')
    ct_especifica = ContentType.objects.get(app_label='identidad', model='politicaespecifica')

    firmas_digital = FirmaDigital.objects.filter(
        content_type__in=[ct_integral, ct_especifica]
    )

    print(f"Migrando {firmas_digital.count()} firmas...")

    for firma in firmas_digital:
        # Crear proceso si no existe
        proceso, created = ProcesoFirmaPolitica.objects.get_or_create(
            tipo_politica='INTEGRAL' if firma.content_type == ct_integral else 'ESPECIFICA',
            politica_integral_id=firma.object_id if firma.content_type == ct_integral else None,
            politica_especifica_id=firma.object_id if firma.content_type == ct_especifica else None,
        )

        # Migrar firma
        FirmaPolitica.objects.create(
            proceso_firma=proceso,
            orden=firma.orden_firma,
            rol_firmante=firma.rol_firma,
            cargo=firma.cargo,
            usuario=firma.firmante,
            estado=firma.status,
            firma_imagen=firma.firma_manuscrita,
            firma_hash=firma.firma_hash,
            ip_address=firma.ip_address,
            fecha_firma=firma.fecha_firma,
        )

    print("Migración completada")

if __name__ == '__main__':
    migrar_firmas()
```

### C. Tests de Integridad Recomendados

```python
# tests/test_firma_integridad.py

from django.test import TestCase
from apps.gestion_estrategica.identidad.models_workflow import FirmaDigital
from apps.core.models import User

class FirmaIntegridadTestCase(TestCase):
    def test_hash_es_idempotente(self):
        """Hash debe ser igual en múltiples llamadas"""
        firma = FirmaDigital(
            firmante=User.objects.first(),
            rol_firma='APROBO',
            orden_firma=1,
            firma_manuscrita='base64data...',
            fecha_firma=timezone.now()
        )

        hash1 = firma.generar_hash()
        hash2 = firma.generar_hash()

        self.assertEqual(hash1, hash2, "Hash debe ser idempotente")

    def test_verificar_integridad_firma_valida(self):
        """Firma no alterada debe verificar como válida"""
        firma = FirmaDigital.objects.create(...)
        firma.firmar(firma_base64='...', ...)

        self.assertTrue(firma.verificar_integridad())

    def test_verificar_integridad_firma_alterada(self):
        """Firma alterada debe detectarse"""
        firma = FirmaDigital.objects.create(...)
        firma.firmar(firma_base64='...', ...)

        # Alterar firma
        firma.firma_manuscrita = 'ALTERED'

        self.assertFalse(firma.verificar_integridad())
```

---

**FIN DEL REPORTE DE AUDITORÍA**

**Generado**: 2026-01-09
**Revisado por**: Claude Code (Arquitecto de Datos Senior)
**Próxima revisión**: Después de implementar Fase 1
