# Arquitectura del Sistema Unificado de Firmas Digitales
## StrateKaz - Sistema de Gestión Empresarial

**Versión:** 1.0
**Fecha:** 2026-01-17
**Estado:** Definición Arquitectónica
**Autor:** Arquitecto de Datos Senior

---

## 1. RESUMEN EJECUTIVO

### 1.1 Situación Actual

Actualmente existen **cuatro modelos de firma** distribuidos en diferentes módulos:

| Modelo | Ubicación | Propósito | Estado | Decisión |
|--------|-----------|-----------|--------|----------|
| `FirmaDigital` | `workflow_engine/firma_digital/` | Sistema robusto con GenericForeignKey, workflow completo, hash SHA-256 | **Producción** | ✅ **MANTENER - BASE** |
| `FirmaPolitica` | `gestion_estrategica/identidad/` | Firmas de políticas (deprecado) | **Legacy** | ❌ **ELIMINAR** |
| `FirmaDocumento` | `hseq_management/sistema_documental/` | Firmas de documentos HSEQ (duplicado) | **Legacy** | ❌ **ELIMINAR** |
| `FirmaDocumento` | `talent_hub/onboarding_induccion/` | Firmas de contratos y documentos de ingreso | **Producción** | ✅ **MANTENER - Caso específico** |

### 1.2 Visión Objetivo

**Sistema Unificado de Firmas Digitales** basado en `FirmaDigital` con:

1. **Un solo modelo de firma** para workflows de aprobación (políticas, documentos normativos, procedimientos)
2. **Integración completa con FormBuilder** mediante nuevos modelos de diligenciamiento
3. **Mantener FirmaDocumento de Onboarding** por su propósito específico (contratos de trabajo)
4. **Workflow configurable** para distinguir aprobaciones formales vs. firmas simples

---

## 2. ARQUITECTURA PROPUESTA

### 2.1 Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE FIRMAS DIGITALES                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐   ┌──────────────────┐   ┌─────────────────┐
│ FirmaDigital │   │  FormBuilder     │   │ FirmaDocumento  │
│ (Workflow)   │   │  Diligenciamiento│   │  (Onboarding)   │
└──────────────┘   └──────────────────┘   └─────────────────┘
      │                     │                      │
      │                     │                      │
      ▼                     ▼                      ▼
┌──────────────┐   ┌──────────────────┐   ┌─────────────────┐
│ Políticas    │   │ Formularios      │   │ Contratos       │
│ Documentos   │   │ Listas Asistencia│   │ Docs. Ingreso   │
│ Procedimientos│  │ Actas            │   │                 │
└──────────────┘   └──────────────────┘   └─────────────────┘
```

### 2.2 Responsabilidades por Componente

#### A. FirmaDigital (workflow_engine/firma_digital/)

**Propósito:**
- Firmas con workflow formal de aprobación (ELABORO → REVISO → APROBO)
- Documentos normativos que requieren múltiples validaciones
- Trazabilidad completa con hash SHA-256

**Casos de Uso:**
- ✅ Políticas Integrales y Específicas
- ✅ Documentos ISO 9001, ISO 14001, ISO 45001
- ✅ Procedimientos y Manuales
- ✅ Documentos del Sistema Documental HSEQ
- ✅ Formatos con flujo de aprobación

**Características:**
- GenericForeignKey (puede firmar cualquier modelo)
- Workflow configurable (secuencial, paralelo, mixto)
- Hash de documento y firma
- Delegación de firmas
- Historial completo de auditoría
- Revisiones periódicas automatizadas

#### B. FormBuilder + Modelos de Diligenciamiento (NUEVO)

**Propósito:**
- Formularios diligenciados que requieren firmas simples
- Listas de asistencia, actas, registros operativos
- Sin workflow formal, solo captura y firma

**Casos de Uso:**
- ✅ Listas de asistencia a reuniones
- ✅ Actas de comités
- ✅ Formatos de inspección diligenciados
- ✅ Registros de capacitación
- ✅ Planillas con firmas múltiples

**Características:**
- Campos de tipo SIGNATURE en FormBuilder
- Instancias de formularios (FormularioDiligenciado)
- Respuestas por campo con auditoría
- Asignación a usuarios/áreas

#### C. FirmaDocumento (talent_hub/onboarding_induccion/)

**Propósito:**
- Documentos específicos del proceso de contratación
- Firma de documentos laborales durante onboarding
- Contexto específico de relación laboral

**Casos de Uso:**
- ✅ Contrato de trabajo
- ✅ Reglamento interno de trabajo
- ✅ Acuerdos de confidencialidad
- ✅ Autorizaciones de descuentos
- ✅ Política de tratamiento de datos personales

**Características:**
- Relación directa con Colaborador
- Tipos de documento específicos de RRHH
- Testigo de firma
- Método de firma (digital, manuscrita, electrónica)
- No requiere GenericForeignKey (caso específico)

---

## 3. MODELO DE DATOS DEFINITIVO

### 3.1 FirmaDigital (workflow_engine/firma_digital/models.py)

**Estado:** ✅ **YA IMPLEMENTADO - SIN CAMBIOS**

```python
class FirmaDigital(TimestampedModel):
    """
    Firma digital manuscrita con workflow completo.

    Uso: GenericForeignKey para firmar cualquier documento.
    """

    # GenericForeignKey - puede firmar cualquier modelo
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    documento = GenericForeignKey('content_type', 'object_id')

    # Configuración de workflow
    configuracion_flujo = models.ForeignKey(
        'ConfiguracionFlujoFirma',
        on_delete=models.PROTECT,
        related_name='firmas'
    )
    nodo_flujo = models.ForeignKey(
        'FlowNode',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='firmas'
    )

    # Firmante
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='firmas_digitales',
        db_index=True
    )
    cargo = models.ForeignKey(
        'core.Cargo',
        on_delete=models.PROTECT,
        related_name='firmas_digitales'
    )
    rol_firma = models.CharField(
        max_length=20,
        choices=ROL_FIRMA_CHOICES,  # ELABORO, REVISO, APROBO, VALIDO, AUTORIZO
        db_index=True
    )

    # Firma manuscrita (canvas signature)
    firma_imagen = models.TextField(
        verbose_name='Firma Imagen (Base64)',
        help_text='Imagen de firma desde canvas signature'
    )

    # Integridad y seguridad (SHA-256)
    documento_hash = models.CharField(max_length=64)
    firma_hash = models.CharField(max_length=64)

    # Metadatos de auditoría
    fecha_firma = models.DateTimeField(auto_now_add=True, db_index=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    geolocalizacion = models.JSONField(null=True, blank=True)

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_FIRMA_CHOICES,  # PENDIENTE, FIRMADO, RECHAZADO, DELEGADO, EXPIRADO
        default='FIRMADO',
        db_index=True
    )
    orden = models.PositiveIntegerField(default=0)
    comentarios = models.TextField(blank=True)

    # Delegación
    es_delegada = models.BooleanField(default=False)
    delegante = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='firmas_delegadas'
    )

    class Meta:
        db_table = 'workflow_firma_digital'
        ordering = ['orden', '-fecha_firma']
        indexes = [
            models.Index(fields=['content_type', 'object_id', 'estado']),
            models.Index(fields=['usuario', '-fecha_firma']),
            models.Index(fields=['cargo', 'rol_firma']),
        ]
```

**Modelos Relacionados (ya implementados):**

- ✅ `ConfiguracionFlujoFirma`: Configuración de flujos personalizables
- ✅ `FlowNode`: Nodos del flujo (roles, orden, reglas)
- ✅ `HistorialFirma`: Trazabilidad completa de acciones
- ✅ `DelegacionFirma`: Delegación temporal de autoridad
- ✅ `ConfiguracionRevision`: Ciclos de revisión periódica
- ✅ `AlertaRevision`: Alertas automáticas de revisión
- ✅ `HistorialVersion`: Versionamiento semántico

### 3.2 Modelos para FormBuilder (NUEVOS - A IMPLEMENTAR)

#### 3.2.1 FormularioDiligenciado

```python
# Ubicación: apps/workflow_engine/disenador_flujos/models.py

class FormularioDiligenciado(BaseCompanyModel):
    """
    Instancia de un formulario diligenciado.

    Representa un formulario completado por un usuario,
    con captura de firmas y datos estructurados.
    """

    # Plantilla base
    plantilla_flujo = models.ForeignKey(
        'PlantillaFlujo',
        on_delete=models.PROTECT,
        related_name='formularios_diligenciados',
        verbose_name='Plantilla de Formulario'
    )

    # Identificación
    numero_formulario = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Número de Formulario',
        help_text='Código único generado automáticamente (ej: FRM-2026-0001)'
    )
    titulo = models.CharField(
        max_length=255,
        verbose_name='Título',
        help_text='Título descriptivo del formulario diligenciado'
    )

    # Contexto de diligenciamiento
    diligenciado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='formularios_diligenciados',
        verbose_name='Diligenciado Por'
    )
    fecha_diligenciamiento = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Diligenciamiento',
        db_index=True
    )
    fecha_completado = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Completado'
    )

    # Asignación (opcional - si el formulario fue asignado)
    asignacion = models.ForeignKey(
        'AsignacionFormulario',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='formularios_diligenciados',
        verbose_name='Asignación Original'
    )

    # GenericForeignKey para relacionar con cualquier entidad
    # Ej: Reunión, Capacitación, Inspección, etc.
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name='Tipo de Entidad Relacionada'
    )
    object_id = models.UUIDField(
        null=True,
        blank=True,
        verbose_name='ID de Entidad Relacionada'
    )
    entidad_relacionada = GenericForeignKey('content_type', 'object_id')

    # Datos estructurados (JSON)
    datos_formulario = models.JSONField(
        default=dict,
        verbose_name='Datos del Formulario',
        help_text='Datos capturados en formato JSON estructurado'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=[
            ('EN_PROGRESO', 'En Progreso'),
            ('COMPLETADO', 'Completado'),
            ('APROBADO', 'Aprobado'),
            ('RECHAZADO', 'Rechazado'),
            ('ANULADO', 'Anulado'),
        ],
        default='EN_PROGRESO',
        verbose_name='Estado',
        db_index=True
    )

    # Firmas (relación con FirmaDigital)
    # Las firmas se relacionan usando GenericForeignKey desde FirmaDigital

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'workflow_formulario_diligenciado'
        verbose_name = 'Formulario Diligenciado'
        verbose_name_plural = 'Formularios Diligenciados'
        ordering = ['-fecha_diligenciamiento']
        indexes = [
            models.Index(fields=['empresa', 'estado']),
            models.Index(fields=['plantilla_flujo', 'estado']),
            models.Index(fields=['diligenciado_por', '-fecha_diligenciamiento']),
            models.Index(fields=['content_type', 'object_id']),
        ]

    def __str__(self):
        return f"{self.numero_formulario} - {self.titulo}"

    def get_firmas(self):
        """Obtiene todas las firmas asociadas a este formulario."""
        from apps.workflow_engine.firma_digital.models import FirmaDigital
        from django.contrib.contenttypes.models import ContentType

        content_type = ContentType.objects.get_for_model(self)
        return FirmaDigital.objects.filter(
            content_type=content_type,
            object_id=self.pk
        )

    def esta_completado(self):
        """Verifica si el formulario está completado."""
        return self.estado == 'COMPLETADO'

    def requiere_firmas(self):
        """Verifica si el formulario tiene campos de tipo SIGNATURE."""
        # Lógica para verificar si la plantilla tiene campos de firma
        pass
```

#### 3.2.2 RespuestaCampo

```python
# Ubicación: apps/workflow_engine/disenador_flujos/models.py

class RespuestaCampo(TimestampedModel):
    """
    Respuesta individual a un campo de formulario.

    Proporciona auditoría granular por campo, permitiendo
    rastrear quién modificó qué y cuándo.
    """

    formulario_diligenciado = models.ForeignKey(
        'FormularioDiligenciado',
        on_delete=models.CASCADE,
        related_name='respuestas',
        verbose_name='Formulario Diligenciado'
    )

    campo_formulario = models.ForeignKey(
        'CampoFormulario',
        on_delete=models.PROTECT,
        related_name='respuestas',
        verbose_name='Campo de Formulario'
    )

    # Valor de la respuesta (almacenado como JSON para flexibilidad)
    valor = models.JSONField(
        verbose_name='Valor de la Respuesta',
        help_text='Valor capturado (texto, número, fecha, archivo, firma, etc.)'
    )

    # Para campos tipo SIGNATURE
    firma_base64 = models.TextField(
        blank=True,
        null=True,
        verbose_name='Firma en Base64',
        help_text='Imagen de firma capturada desde canvas signature'
    )

    # Auditoría granular
    modificado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='respuestas_modificadas',
        verbose_name='Modificado Por'
    )
    fecha_modificacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de Modificación',
        db_index=True
    )

    # Validación
    es_valido = models.BooleanField(
        default=True,
        verbose_name='Es Válido'
    )
    mensaje_validacion = models.CharField(
        max_length=500,
        blank=True,
        verbose_name='Mensaje de Validación'
    )

    # Historial de cambios
    version = models.PositiveIntegerField(
        default=1,
        verbose_name='Versión',
        help_text='Contador de modificaciones'
    )
    valor_anterior = models.JSONField(
        null=True,
        blank=True,
        verbose_name='Valor Anterior',
        help_text='Valor previo antes de la modificación'
    )

    class Meta:
        db_table = 'workflow_respuesta_campo'
        verbose_name = 'Respuesta de Campo'
        verbose_name_plural = 'Respuestas de Campos'
        ordering = ['campo_formulario__orden']
        unique_together = [['formulario_diligenciado', 'campo_formulario']]
        indexes = [
            models.Index(fields=['formulario_diligenciado', 'campo_formulario']),
            models.Index(fields=['modificado_por', '-fecha_modificacion']),
        ]

    def __str__(self):
        return f"{self.campo_formulario.etiqueta}: {self.valor}"

    def save(self, *args, **kwargs):
        """Override save para incrementar versión en modificaciones."""
        if self.pk:  # Si ya existe
            try:
                anterior = RespuestaCampo.objects.get(pk=self.pk)
                if anterior.valor != self.valor:
                    self.version += 1
                    self.valor_anterior = anterior.valor
            except RespuestaCampo.DoesNotExist:
                pass
        super().save(*args, **kwargs)
```

#### 3.2.3 AsignacionFormulario

```python
# Ubicación: apps/workflow_engine/disenador_flujos/models.py

class AsignacionFormulario(BaseCompanyModel):
    """
    Asignación de formularios a usuarios o áreas.

    Permite asignar formularios específicos a usuarios para
    su diligenciamiento, con fechas límite y notificaciones.
    """

    # Plantilla a asignar
    plantilla_flujo = models.ForeignKey(
        'PlantillaFlujo',
        on_delete=models.CASCADE,
        related_name='asignaciones',
        verbose_name='Plantilla de Formulario'
    )

    # Asignación
    asignado_a = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='formularios_asignados',
        verbose_name='Asignado A'
    )
    asignado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='asignaciones_formularios_creadas',
        verbose_name='Asignado Por'
    )

    # Área (opcional - para asignaciones masivas)
    area = models.ForeignKey(
        'organizacion.Area',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='formularios_asignados',
        verbose_name='Área'
    )

    # Fechas
    fecha_asignacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Asignación',
        db_index=True
    )
    fecha_limite = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Límite',
        db_index=True
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=[
            ('PENDIENTE', 'Pendiente'),
            ('EN_PROGRESO', 'En Progreso'),
            ('COMPLETADO', 'Completado'),
            ('VENCIDO', 'Vencido'),
            ('CANCELADO', 'Cancelado'),
        ],
        default='PENDIENTE',
        verbose_name='Estado',
        db_index=True
    )

    # Prioridad
    prioridad = models.CharField(
        max_length=10,
        choices=[
            ('BAJA', 'Baja'),
            ('NORMAL', 'Normal'),
            ('ALTA', 'Alta'),
            ('URGENTE', 'Urgente'),
        ],
        default='NORMAL',
        verbose_name='Prioridad'
    )

    # Contexto
    titulo = models.CharField(
        max_length=255,
        verbose_name='Título',
        help_text='Título descriptivo de la asignación'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Instrucciones o contexto para el usuario'
    )

    # Notificaciones
    notificacion_enviada = models.BooleanField(
        default=False,
        verbose_name='Notificación Enviada'
    )
    fecha_notificacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Notificación'
    )

    # Recordatorios
    dias_recordatorio = models.PositiveIntegerField(
        default=3,
        verbose_name='Días de Recordatorio',
        help_text='Días antes de la fecha límite para enviar recordatorio'
    )
    recordatorio_enviado = models.BooleanField(
        default=False,
        verbose_name='Recordatorio Enviado'
    )

    class Meta:
        db_table = 'workflow_asignacion_formulario'
        verbose_name = 'Asignación de Formulario'
        verbose_name_plural = 'Asignaciones de Formularios'
        ordering = ['-fecha_asignacion']
        indexes = [
            models.Index(fields=['empresa', 'estado']),
            models.Index(fields=['asignado_a', 'estado']),
            models.Index(fields=['fecha_limite']),
            models.Index(fields=['area', 'estado']),
        ]

    def __str__(self):
        return f"{self.titulo} → {self.asignado_a.get_full_name()}"

    def esta_vencida(self):
        """Verifica si la asignación está vencida."""
        if not self.fecha_limite:
            return False
        from django.utils import timezone
        return self.fecha_limite < timezone.now().date() and self.estado == 'PENDIENTE'

    def requiere_recordatorio(self):
        """Verifica si se debe enviar recordatorio."""
        if not self.fecha_limite or self.recordatorio_enviado:
            return False
        from django.utils import timezone
        from datetime import timedelta
        fecha_recordatorio = self.fecha_limite - timedelta(days=self.dias_recordatorio)
        return fecha_recordatorio <= timezone.now().date() < self.fecha_limite
```

#### 3.2.4 Actualización de CampoFormulario (EXISTENTE)

**Ubicación:** `apps/hseq_management/sistema_documental/models.py`

```python
# CAMPO YA EXISTENTE - SOLO SE DOCUMENTA SU USO

class CampoFormulario(models.Model):
    """
    Campos dinámicos configurables para Form Builder.

    NOTA: Campo tipo 'SIGNATURE' ya está implementado.
    """

    TIPO_CAMPO_CHOICES = [
        # ... otros tipos ...
        ('SIGNATURE', 'Firma'),  # ✅ YA IMPLEMENTADO
        # ... otros tipos ...
    ]

    tipo_campo = models.CharField(
        max_length=20,
        choices=TIPO_CAMPO_CHOICES,
        verbose_name='Tipo de Campo'
    )

    # INTEGRACIÓN CON FIRMEDIGITAL:
    # Cuando tipo_campo == 'SIGNATURE', el FormularioDiligenciado
    # debe crear instancias de FirmaDigital con GenericForeignKey
    # apuntando al FormularioDiligenciado.
    #
    # Flujo:
    # 1. Usuario captura firma en canvas → Base64
    # 2. Se crea RespuestaCampo con firma_base64
    # 3. Se crea FirmaDigital con:
    #    - content_type = ContentType(FormularioDiligenciado)
    #    - object_id = formulario_diligenciado.id
    #    - firma_imagen = firma_base64
    #    - rol_firma = 'CONFORMIDAD' o 'PARTICIPANTE'
```

### 3.3 FirmaDocumento de Onboarding (SIN CAMBIOS)

**Estado:** ✅ **MANTENER - Caso específico de RRHH**

**Ubicación:** `apps/talent_hub/onboarding_induccion/models.py`

```python
class FirmaDocumento(BaseCompanyModel):
    """
    Firma de documentos específicos del proceso de onboarding.

    PROPÓSITO ESPECÍFICO:
    - Documentos laborales (contratos, reglamentos)
    - Contexto de relación laboral (Colaborador)
    - Testigo de firma
    - NO usa GenericForeignKey (caso específico)

    Este modelo NO se elimina porque tiene un propósito
    diferente a FirmaDigital (workflow).
    """

    colaborador = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.CASCADE,
        related_name='firmas_documentos'
    )

    tipo_documento = models.CharField(
        max_length=30,
        choices=TIPO_DOCUMENTO_FIRMA_CHOICES
    )

    nombre_documento = models.CharField(max_length=200)
    version = models.CharField(max_length=20, blank=True)

    documento = models.FileField(upload_to='onboarding/documentos/')
    documento_firmado = models.FileField(upload_to='onboarding/documentos_firmados/')

    fecha_firma = models.DateField(db_index=True)
    firmado = models.BooleanField(default=False)
    metodo_firma = models.CharField(max_length=20)

    testigo = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='firmas_testigo'
    )

    observaciones = models.TextField(blank=True)

    class Meta:
        db_table = 'talent_hub_firma_documento'
```

**Justificación de Mantener:**
1. Propósito específico de RRHH (contratación)
2. Relación directa con Colaborador (no GenericForeignKey)
3. Campos específicos: testigo, método_firma
4. No requiere workflow complejo
5. Contexto diferente (laboral vs. documental)

---

## 4. FLUJO DE WORKFLOW: CUÁNDO USAR CADA MODELO

### 4.1 Árbol de Decisión

```
¿Qué tipo de documento necesita firma?
│
├─ ¿Es un contrato o documento de ingreso de personal?
│  └─ SÍ → FirmaDocumento (Onboarding)
│
├─ ¿Es un formulario diligenciado (lista asistencia, acta, formato)?
│  └─ SÍ → FormularioDiligenciado + FirmaDigital
│      │
│      ├─ Crear FormularioDiligenciado
│      ├─ Capturar respuestas en RespuestaCampo
│      └─ Crear FirmaDigital con GenericForeignKey → FormularioDiligenciado
│
└─ ¿Es un documento normativo (política, procedimiento, manual)?
   └─ SÍ → FirmaDigital con Workflow
       │
       ├─ Configurar ConfiguracionFlujoFirma
       ├─ Definir FlowNode (ELABORO → REVISO → APROBO)
       └─ Crear FirmaDigital para cada rol
```

### 4.2 Configuración por Tipo de Documento

| Tipo de Documento | Modelo | Workflow | Roles | Ejemplo |
|-------------------|--------|----------|-------|---------|
| **Política Integral** | FirmaDigital | SECUENCIAL | ELABORO → REVISO → APROBO | Política SST, Política Calidad |
| **Política Específica** | FirmaDigital | SECUENCIAL | REVISO → APROBO | Política de Compras |
| **Procedimiento** | FirmaDigital | SECUENCIAL | ELABORO → REVISO → APROBO | Procedimiento de Auditoría |
| **Manual** | FirmaDigital | SECUENCIAL | ELABORO → REVISO → APROBO | Manual de Calidad |
| **Formato con Aprobación** | FirmaDigital | SECUENCIAL | ELABORO → APROBO | Formato de Inspección (plantilla) |
| **Lista de Asistencia** | FormularioDiligenciado + FirmaDigital | NINGUNO | PARTICIPANTE | Asistencia a reunión |
| **Acta de Comité** | FormularioDiligenciado + FirmaDigital | NINGUNO | CONFORMIDAD | Acta COPASST |
| **Formato Diligenciado** | FormularioDiligenciado + FirmaDigital | NINGUNO | CONFORMIDAD | Inspección diligenciada |
| **Contrato de Trabajo** | FirmaDocumento (Onboarding) | NINGUNO | - | Contrato laboral |
| **Reglamento Interno** | FirmaDocumento (Onboarding) | NINGUNO | - | Firma de colaborador |

### 4.3 Configuración de Flujos de Firma

#### A. Flujo Estándar ISO (Secuencial)

```python
# Configuración para documentos ISO 9001, ISO 14001, ISO 45001

ConfiguracionFlujoFirma.objects.create(
    nombre='Flujo Estándar ISO',
    codigo='FLUJO_ISO_ESTANDAR',
    tipo_flujo='SECUENCIAL',
    configuracion_nodos=[
        {
            "orden": 1,
            "rol": "ELABORO",
            "cargo_id": "uuid_coordinador_hseq",
            "requerido": True
        },
        {
            "orden": 2,
            "rol": "REVISO",
            "cargo_id": "uuid_jefe_area",
            "requerido": True
        },
        {
            "orden": 3,
            "rol": "APROBO",
            "cargo_id": "uuid_director_general",
            "requerido": True
        }
    ],
    permite_delegacion=True,
    dias_max_firma=5,
    requiere_comentario_rechazo=True
)
```

#### B. Flujo Paralelo (Revisiones Simultáneas)

```python
# Configuración para documentos que requieren revisión de múltiples áreas

ConfiguracionFlujoFirma.objects.create(
    nombre='Flujo Paralelo Multi-Área',
    codigo='FLUJO_PARALELO_MULTI',
    tipo_flujo='PARALELO',
    configuracion_nodos=[
        {
            "grupo": "REVISION",
            "rol": "REVISO",
            "cargo_ids": [
                "uuid_jefe_sst",
                "uuid_jefe_calidad",
                "uuid_jefe_ambiental"
            ],
            "todos_requeridos": False,  # Basta con 2 de 3
            "minimo_requerido": 2
        },
        {
            "grupo": "APROBACION",
            "rol": "APROBO",
            "cargo_id": "uuid_director_general",
            "requerido": True
        }
    ]
)
```

#### C. Firma Simple (Sin Workflow)

```python
# Para FormularioDiligenciado - firmas de conformidad

# NO requiere ConfiguracionFlujoFirma
# Las firmas se crean directamente con rol 'CONFORMIDAD'

FirmaDigital.objects.create(
    content_type=ContentType.objects.get_for_model(FormularioDiligenciado),
    object_id=formulario.pk,
    configuracion_flujo=None,  # Sin workflow
    nodo_flujo=None,
    usuario=participante,
    cargo=participante.cargo,
    rol_firma='CONFORMIDAD',  # Rol especial para firmas simples
    firma_imagen=firma_base64,
    documento_hash=calcular_hash(formulario.datos_formulario),
    ip_address=request.META.get('REMOTE_ADDR'),
    estado='FIRMADO'
)
```

---

## 5. PLAN DE ELIMINACIÓN DE MODELOS DUPLICADOS

### 5.1 Modelos a Eliminar

#### A. FirmaPolitica (gestion_estrategica/identidad/)

**Ubicación:**
- Modelo: `apps/gestion_estrategica/identidad/models.py`
- Admin: `apps/gestion_estrategica/identidad/admin.py`
- Serializers: `apps/gestion_estrategica/identidad/serializers.py`
- Views: `apps/gestion_estrategica/identidad/views.py`

**Estado Actual:**
- ❌ DEPRECADO desde v3.1
- Ya se consolidó en `PoliticaEspecifica.sign()` con `signature_hash`

**Acción:**
```python
# Verificar si hay registros
from apps.gestion_estrategica.identidad.models import FirmaPolitica

# Si existen firmas, migrar a FirmaDigital
if FirmaPolitica.objects.exists():
    # Migración manual - ver sección 5.2
    pass
else:
    # Eliminar modelo directamente
    pass
```

#### B. FirmaDocumento (hseq_management/sistema_documental/)

**Ubicación:**
- Modelo: `apps/hseq_management/sistema_documental/models.py` (línea 797)
- Admin: `apps/hseq_management/sistema_documental/admin.py`
- Serializers: `apps/hseq_management/sistema_documental/serializers.py`
- Views: `apps/hseq_management/sistema_documental/views.py`

**Estado Actual:**
- Duplicado de funcionalidad con `FirmaDigital`
- Usado para firmas de documentos del sistema documental

**Acción:**
```python
# Verificar uso actual
from apps.hseq_management.sistema_documental.models import FirmaDocumento

# Migrar a FirmaDigital con GenericForeignKey
# Ver sección 5.2.2
```

### 5.2 Migraciones de Datos

#### 5.2.1 Migración de FirmaPolitica → FirmaDigital

```python
# Archivo: apps/gestion_estrategica/identidad/migrations/0011_migrate_firma_politica.py

from django.db import migrations
from django.contrib.contenttypes.models import ContentType

def migrate_firma_politica_to_firma_digital(apps, schema_editor):
    """
    Migra firmas de políticas al modelo FirmaDigital.

    NOTA: Este paso es solo si existen registros legacy de FirmaPolitica.
    Si el campo ya está deprecado y sin uso, se puede omitir.
    """
    # Obtener modelos
    FirmaPolitica = apps.get_model('identidad', 'FirmaPolitica')
    PoliticaEspecifica = apps.get_model('identidad', 'PoliticaEspecifica')
    FirmaDigital = apps.get_model('firma_digital', 'FirmaDigital')
    ConfiguracionFlujoFirma = apps.get_model('firma_digital', 'ConfiguracionFlujoFirma')

    # Obtener ContentType de PoliticaEspecifica
    content_type = ContentType.objects.get_for_model(PoliticaEspecifica)

    # Crear configuración de flujo genérica si no existe
    flujo, created = ConfiguracionFlujoFirma.objects.get_or_create(
        codigo='FLUJO_POLITICA_LEGACY',
        defaults={
            'nombre': 'Flujo Legacy de Políticas',
            'tipo_flujo': 'SECUENCIAL',
            'configuracion_nodos': [
                {"orden": 1, "rol": "APROBO", "requerido": True}
            ]
        }
    )

    # Migrar cada firma
    for firma_old in FirmaPolitica.objects.all():
        politica = firma_old.politica_especifica

        FirmaDigital.objects.create(
            content_type=content_type,
            object_id=politica.pk,
            configuracion_flujo=flujo,
            usuario=firma_old.firmante,
            cargo=firma_old.firmante.cargo,
            rol_firma='APROBO',
            firma_imagen='',  # Legacy no tenía imagen
            documento_hash=firma_old.signature_hash[:64] if firma_old.signature_hash else '',
            firma_hash=firma_old.signature_hash[:64] if firma_old.signature_hash else '',
            fecha_firma=firma_old.fecha_firma,
            ip_address='0.0.0.0',  # No disponible en legacy
            estado='FIRMADO',
            orden=1,
            comentarios=f'Migrado desde FirmaPolitica (legacy)'
        )

def reverse_migration(apps, schema_editor):
    """Reversa - no implementada (no se puede revertir)."""
    pass

class Migration(migrations.Migration):
    dependencies = [
        ('identidad', '0010_consolidate_politicas'),
        ('firma_digital', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(
            migrate_firma_politica_to_firma_digital,
            reverse_migration
        ),
    ]
```

#### 5.2.2 Migración de FirmaDocumento (Sistema Documental) → FirmaDigital

```python
# Archivo: apps/hseq_management/sistema_documental/migrations/0002_migrate_firma_documento.py

from django.db import migrations
from django.contrib.contenttypes.models import ContentType

def migrate_firma_documento_to_firma_digital(apps, schema_editor):
    """
    Migra firmas de documentos HSEQ al modelo FirmaDigital.
    """
    # Obtener modelos
    FirmaDocumento = apps.get_model('sistema_documental', 'FirmaDocumento')
    Documento = apps.get_model('sistema_documental', 'Documento')
    FirmaDigital = apps.get_model('firma_digital', 'FirmaDigital')
    ConfiguracionFlujoFirma = apps.get_model('firma_digital', 'ConfiguracionFlujoFirma')
    User = apps.get_model('auth', 'User')

    # ContentType de Documento
    content_type = ContentType.objects.get_for_model(Documento)

    # Crear configuraciones de flujo por tipo de firma
    flujos = {}
    for tipo_firma, display in [
        ('ELABORACION', 'ELABORO'),
        ('REVISION', 'REVISO'),
        ('APROBACION', 'APROBO'),
        ('CONFORMIDAD', 'CONFORMIDAD'),
        ('VALIDACION', 'VALIDO')
    ]:
        flujo, created = ConfiguracionFlujoFirma.objects.get_or_create(
            codigo=f'FLUJO_DOCUMENTAL_{tipo_firma}',
            defaults={
                'nombre': f'Flujo {display}',
                'tipo_flujo': 'SECUENCIAL',
                'configuracion_nodos': [
                    {"orden": 1, "rol": display, "requerido": True}
                ]
            }
        )
        flujos[tipo_firma] = flujo

    # Migrar firmas
    for firma_old in FirmaDocumento.objects.all():
        documento = firma_old.documento
        tipo_firma = firma_old.tipo_firma

        FirmaDigital.objects.create(
            content_type=content_type,
            object_id=documento.pk,
            configuracion_flujo=flujos.get(tipo_firma),
            usuario=firma_old.firmante,
            cargo=firma_old.firmante.cargo if hasattr(firma_old.firmante, 'cargo') else None,
            rol_firma=tipo_firma if tipo_firma in ['ELABORO', 'REVISO', 'APROBO'] else 'CONFORMIDAD',
            firma_imagen=firma_old.firma_digital if firma_old.firma_digital else '',
            documento_hash=firma_old.checksum_documento if firma_old.checksum_documento else '',
            firma_hash=firma_old.certificado_digital[:64] if firma_old.certificado_digital else '',
            fecha_firma=firma_old.fecha_firma,
            ip_address=firma_old.ip_address if firma_old.ip_address else '0.0.0.0',
            user_agent=firma_old.user_agent if firma_old.user_agent else '',
            geolocalizacion={
                'latitud': float(firma_old.latitud) if firma_old.latitud else None,
                'longitud': float(firma_old.longitud) if firma_old.longitud else None
            } if firma_old.latitud and firma_old.longitud else None,
            estado='FIRMADO' if firma_old.estado == 'FIRMADO' else firma_old.estado,
            orden=firma_old.orden_firma,
            comentarios=firma_old.comentarios if firma_old.comentarios else ''
        )

def reverse_migration(apps, schema_editor):
    """Reversa - no implementada."""
    pass

class Migration(migrations.Migration):
    dependencies = [
        ('sistema_documental', '0001_initial'),
        ('firma_digital', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(
            migrate_firma_documento_to_firma_digital,
            reverse_migration
        ),
    ]
```

### 5.3 Orden de Ejecución de Migraciones

```bash
# 1. Crear migraciones de nuevos modelos (FormBuilder)
python manage.py makemigrations workflow_engine --name add_formulario_diligenciado

# 2. Ejecutar migraciones de nuevos modelos
python manage.py migrate workflow_engine

# 3. Migrar datos de FirmaPolitica
python manage.py migrate identidad 0011_migrate_firma_politica

# 4. Migrar datos de FirmaDocumento (Sistema Documental)
python manage.py migrate sistema_documental 0002_migrate_firma_documento

# 5. Verificar integridad de datos migrados
python manage.py shell
>>> from apps.workflow_engine.firma_digital.models import FirmaDigital
>>> FirmaDigital.objects.filter(comentarios__contains='Migrado').count()

# 6. Eliminar modelos deprecados (después de validación)
python manage.py makemigrations identidad --name remove_firma_politica
python manage.py makemigrations sistema_documental --name remove_firma_documento

# 7. Ejecutar eliminación
python manage.py migrate
```

### 5.4 Scripts de Validación Post-Migración

```python
# backend/scripts/validate_firma_migration.py

from apps.workflow_engine.firma_digital.models import FirmaDigital
from apps.gestion_estrategica.identidad.models import PoliticaEspecifica
from apps.hseq_management.sistema_documental.models import Documento
from django.contrib.contenttypes.models import ContentType

def validate_politica_firmas():
    """Valida que todas las políticas tengan sus firmas migradas."""
    politicas = PoliticaEspecifica.objects.filter(is_active=True)
    content_type = ContentType.objects.get_for_model(PoliticaEspecifica)

    for politica in politicas:
        firmas_count = FirmaDigital.objects.filter(
            content_type=content_type,
            object_id=politica.pk
        ).count()

        print(f"Política {politica.code}: {firmas_count} firmas")

        if politica.approved_by and firmas_count == 0:
            print(f"  ⚠️  ADVERTENCIA: Política aprobada sin firmas en FirmaDigital")

def validate_documento_firmas():
    """Valida que todos los documentos tengan sus firmas migradas."""
    documentos = Documento.objects.filter(estado='PUBLICADO')
    content_type = ContentType.objects.get_for_model(Documento)

    for documento in documentos:
        firmas_count = FirmaDigital.objects.filter(
            content_type=content_type,
            object_id=documento.pk
        ).count()

        print(f"Documento {documento.codigo}: {firmas_count} firmas")

        if documento.aprobado_por and firmas_count == 0:
            print(f"  ⚠️  ADVERTENCIA: Documento aprobado sin firmas en FirmaDigital")

if __name__ == '__main__':
    print("=== VALIDACIÓN DE MIGRACIÓN DE FIRMAS ===\n")
    print("1. Validando firmas de políticas...")
    validate_politica_firmas()
    print("\n2. Validando firmas de documentos...")
    validate_documento_firmas()
    print("\n=== VALIDACIÓN COMPLETADA ===")
```

**Ejecutar:**
```bash
python backend/scripts/validate_firma_migration.py
```

---

## 6. INTEGRACIÓN CON FORMBUILDER

### 6.1 Flujo de Captura de Firmas en Formularios

```typescript
// frontend/src/features/workflow/types/formBuilder.types.ts

export interface CampoFormulario {
  id: string;
  tipo_campo: 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'DATE' | 'SELECT' | 'SIGNATURE';
  etiqueta: string;
  es_obligatorio: boolean;
}

export interface RespuestaCampo {
  campo_formulario_id: string;
  valor: any;
  firma_base64?: string; // Para campos tipo SIGNATURE
}

export interface FormularioDiligenciado {
  id: string;
  plantilla_flujo_id: string;
  numero_formulario: string;
  titulo: string;
  estado: 'EN_PROGRESO' | 'COMPLETADO' | 'APROBADO';
  datos_formulario: Record<string, any>;
  respuestas: RespuestaCampo[];
  firmas: FirmaDigital[];
}
```

### 6.2 Componente de Firma en FormBuilder

```typescript
// frontend/src/features/workflow/components/SignatureField.tsx

import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignatureFieldProps {
  campo: CampoFormulario;
  value?: string; // Base64
  onChange: (base64: string) => void;
  readonly?: boolean;
}

export const SignatureField: React.FC<SignatureFieldProps> = ({
  campo,
  value,
  onChange,
  readonly = false
}) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [signed, setSigned] = useState(!!value);

  const handleClear = () => {
    sigCanvas.current?.clear();
    setSigned(false);
    onChange('');
  };

  const handleSave = () => {
    if (sigCanvas.current) {
      const base64 = sigCanvas.current.toDataURL();
      onChange(base64);
      setSigned(true);
    }
  };

  if (readonly && value) {
    return (
      <div className="signature-field-readonly">
        <label>{campo.etiqueta}</label>
        <img src={value} alt="Firma" className="signature-image" />
      </div>
    );
  }

  return (
    <div className="signature-field">
      <label>
        {campo.etiqueta}
        {campo.es_obligatorio && <span className="required">*</span>}
      </label>

      <div className="signature-canvas-container">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            className: 'signature-canvas',
            width: 500,
            height: 200
          }}
          onEnd={handleSave}
        />
      </div>

      <div className="signature-actions">
        <button onClick={handleClear} className="btn-secondary">
          Limpiar
        </button>
        {signed && (
          <span className="signature-status">✓ Firmado</span>
        )}
      </div>
    </div>
  );
};
```

### 6.3 Lógica de Backend para Guardar Firmas

```python
# backend/apps/workflow_engine/disenador_flujos/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.contenttypes.models import ContentType
from apps.workflow_engine.firma_digital.models import FirmaDigital

class FormularioDiligenciadoViewSet(viewsets.ModelViewSet):
    """ViewSet para formularios diligenciados con captura de firmas."""

    @action(detail=True, methods=['post'])
    def guardar_firma(self, request, pk=None):
        """
        Guarda una firma capturada en un campo tipo SIGNATURE.

        Body:
        {
            "campo_formulario_id": "uuid",
            "firma_base64": "data:image/png;base64,...",
            "rol_firma": "CONFORMIDAD"  // Opcional
        }
        """
        formulario = self.get_object()
        campo_id = request.data.get('campo_formulario_id')
        firma_base64 = request.data.get('firma_base64')
        rol_firma = request.data.get('rol_firma', 'CONFORMIDAD')

        # Validar campo
        campo = CampoFormulario.objects.get(pk=campo_id)
        if campo.tipo_campo != 'SIGNATURE':
            return Response(
                {'error': 'El campo no es de tipo SIGNATURE'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Guardar respuesta del campo
        respuesta, created = RespuestaCampo.objects.update_or_create(
            formulario_diligenciado=formulario,
            campo_formulario=campo,
            defaults={
                'valor': {'firmado': True},
                'firma_base64': firma_base64,
                'modificado_por': request.user
            }
        )

        # Crear FirmaDigital asociada
        content_type = ContentType.objects.get_for_model(FormularioDiligenciado)

        firma_digital = FirmaDigital.objects.create(
            content_type=content_type,
            object_id=formulario.pk,
            configuracion_flujo=None,  # Sin workflow para firmas simples
            nodo_flujo=None,
            usuario=request.user,
            cargo=request.user.cargo,
            rol_firma=rol_firma,
            firma_imagen=firma_base64,
            documento_hash=self._calcular_hash_formulario(formulario),
            firma_hash='',  # Se calcula en save()
            ip_address=self._get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            estado='FIRMADO',
            orden=0,
            comentarios=f'Firma en campo: {campo.etiqueta}'
        )

        return Response({
            'status': 'Firma guardada exitosamente',
            'firma_digital_id': firma_digital.pk,
            'respuesta_campo_id': respuesta.pk
        }, status=status.HTTP_201_CREATED)

    def _calcular_hash_formulario(self, formulario):
        """Calcula hash SHA-256 del contenido del formulario."""
        import hashlib
        import json

        contenido = json.dumps(formulario.datos_formulario, sort_keys=True)
        return hashlib.sha256(contenido.encode('utf-8')).hexdigest()

    def _get_client_ip(self, request):
        """Obtiene IP del cliente."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
```

---

## 7. CASOS DE USO DETALLADOS

### 7.1 Caso de Uso 1: Aprobar Política Integral SST

**Actores:**
- Coordinador HSEQ (ELABORO)
- Jefe SST (REVISO)
- Director General (APROBO)

**Flujo:**

1. **Coordinador HSEQ crea borrador de Política SST**
   ```python
   politica = PoliticaEspecifica.objects.create(
       identity=identity,
       norma_iso=norma_iso_45001,
       is_integral_policy=True,
       title='Política del Sistema de Gestión de Seguridad y Salud en el Trabajo',
       content='...',
       status='BORRADOR',
       responsible=coordinador_hseq
   )
   ```

2. **Se configura flujo de firma**
   ```python
   flujo = ConfiguracionFlujoFirma.objects.get(codigo='FLUJO_ISO_ESTANDAR')
   # Flujo: ELABORO → REVISO → APROBO
   ```

3. **Coordinador firma (ELABORO)**
   ```python
   FirmaDigital.objects.create(
       content_type=ContentType.objects.get_for_model(PoliticaEspecifica),
       object_id=politica.pk,
       configuracion_flujo=flujo,
       nodo_flujo=flujo.nodos.get(orden=1),
       usuario=coordinador_hseq,
       cargo=coordinador_hseq.cargo,
       rol_firma='ELABORO',
       firma_imagen=firma_base64,
       documento_hash=politica.calcular_hash(),
       ip_address='192.168.1.100',
       estado='FIRMADO',
       orden=1
   )
   politica.status = 'EN_REVISION'
   politica.save()
   ```

4. **Jefe SST firma (REVISO)**
   ```python
   FirmaDigital.objects.create(
       content_type=ContentType.objects.get_for_model(PoliticaEspecifica),
       object_id=politica.pk,
       configuracion_flujo=flujo,
       nodo_flujo=flujo.nodos.get(orden=2),
       usuario=jefe_sst,
       cargo=jefe_sst.cargo,
       rol_firma='REVISO',
       firma_imagen=firma_base64,
       documento_hash=politica.calcular_hash(),
       ip_address='192.168.1.101',
       estado='FIRMADO',
       orden=2
   )
   ```

5. **Director General firma (APROBO)**
   ```python
   FirmaDigital.objects.create(
       content_type=ContentType.objects.get_for_model(PoliticaEspecifica),
       object_id=politica.pk,
       configuracion_flujo=flujo,
       nodo_flujo=flujo.nodos.get(orden=3),
       usuario=director,
       cargo=director.cargo,
       rol_firma='APROBO',
       firma_imagen=firma_base64,
       documento_hash=politica.calcular_hash(),
       ip_address='192.168.1.102',
       estado='FIRMADO',
       orden=3
   )

   # Completar workflow
   politica.status = 'FIRMADO'
   politica.approved_by = director
   politica.approved_at = timezone.now()
   politica.save()
   ```

6. **Enviar a Gestor Documental**
   ```python
   # Al publicar, se asigna código oficial
   politica.status = 'VIGENTE'
   politica.code = 'POL-SST-001'  # Asignado por Gestor Documental
   politica.documento_id = 123  # ID en Gestor Documental
   politica.save()
   ```

### 7.2 Caso de Uso 2: Lista de Asistencia a Reunión COPASST

**Actores:**
- Secretario COPASST (crea lista)
- Participantes (firman asistencia)

**Flujo:**

1. **Crear reunión de COPASST**
   ```python
   reunion = ReunionComite.objects.create(
       comite=copasst,
       fecha=date.today(),
       tema='Revisión de accidentes laborales Q1 2026'
   )
   ```

2. **Crear formulario de asistencia**
   ```python
   # Plantilla de lista de asistencia
   plantilla = PlantillaFlujo.objects.get(codigo='LISTA_ASISTENCIA_COMITE')

   formulario = FormularioDiligenciado.objects.create(
       plantilla_flujo=plantilla,
       numero_formulario='AST-2026-0042',
       titulo=f'Lista de Asistencia - {reunion.tema}',
       diligenciado_por=secretario,
       content_type=ContentType.objects.get_for_model(ReunionComite),
       object_id=reunion.pk,
       datos_formulario={
           'fecha': str(reunion.fecha),
           'tema': reunion.tema,
           'hora_inicio': '14:00',
           'hora_fin': '16:00'
       },
       estado='EN_PROGRESO'
   )
   ```

3. **Participantes firman asistencia**
   ```python
   for participante in reunion.participantes.all():
       # Capturar firma desde frontend
       firma_base64 = capturar_firma_canvas(participante)

       # Crear respuesta del campo SIGNATURE
       RespuestaCampo.objects.create(
           formulario_diligenciado=formulario,
           campo_formulario=campo_firma,
           valor={'firmado': True},
           firma_base64=firma_base64,
           modificado_por=participante
       )

       # Crear FirmaDigital asociada
       FirmaDigital.objects.create(
           content_type=ContentType.objects.get_for_model(FormularioDiligenciado),
           object_id=formulario.pk,
           configuracion_flujo=None,  # Sin workflow
           usuario=participante,
           cargo=participante.cargo,
           rol_firma='CONFORMIDAD',
           firma_imagen=firma_base64,
           documento_hash=formulario.calcular_hash(),
           ip_address=participante_ip,
           estado='FIRMADO'
       )
   ```

4. **Completar formulario**
   ```python
   formulario.estado = 'COMPLETADO'
   formulario.fecha_completado = timezone.now()
   formulario.save()
   ```

### 7.3 Caso de Uso 3: Firma de Contrato de Trabajo (Onboarding)

**Actores:**
- Colaborador (firma contrato)
- Jefe de RRHH (testigo)

**Flujo:**

1. **Crear registro de firma de contrato**
   ```python
   firma_contrato = FirmaDocumento.objects.create(
       colaborador=nuevo_colaborador,
       tipo_documento='contrato',
       nombre_documento='Contrato de Trabajo a Término Indefinido',
       version='1.0',
       documento=archivo_contrato_pdf,
       fecha_firma=date.today(),
       firmado=False,
       metodo_firma='digital',
       testigo=jefe_rrhh,
       observaciones='Contrato inicial'
   )
   ```

2. **Colaborador firma (proceso presencial o digital)**
   ```python
   # Opción A: Firma digital con canvas
   firma_contrato.documento_firmado = generar_pdf_con_firma(
       archivo_contrato_pdf,
       firma_base64
   )
   firma_contrato.firmado = True
   firma_contrato.save()

   # Opción B: Firma manuscrita (escaneo posterior)
   # Se marca como firmado después de validar escaneo
   ```

3. **No se usa FirmaDigital** porque:
   - Es contexto específico de RRHH (relación laboral)
   - No requiere workflow de aprobación
   - Tiene campos específicos (testigo, método_firma)
   - Relación directa con Colaborador

---

## 8. BENEFICIOS DE LA ARQUITECTURA PROPUESTA

### 8.1 Beneficios Técnicos

| Beneficio | Descripción | Impacto |
|-----------|-------------|---------|
| **Consolidación** | Un solo modelo de firma para workflows | Reducción de 50% en complejidad de código |
| **Reutilización** | GenericForeignKey permite firmar cualquier entidad | Escalabilidad infinita |
| **Auditoría** | Hash SHA-256 + historial completo | Cumplimiento ISO 9001, ISO 45001 |
| **Flexibilidad** | Workflow configurable (secuencial, paralelo, mixto) | Adaptable a cualquier proceso |
| **Trazabilidad** | IP, user agent, geolocalización, timestamp | Evidencia legal robusta |
| **Delegación** | Delegación temporal de firmas | Continuidad operativa |
| **Revisiones** | Alertas automáticas de revisión periódica | Cumplimiento normativo |
| **Versionamiento** | Historial completo de versiones | Trazabilidad de cambios |

### 8.2 Beneficios Funcionales

| Módulo | Antes | Después | Mejora |
|--------|-------|---------|--------|
| **Políticas** | Firma simple (hash) | Workflow completo ELABORO → REVISO → APROBO | ✅ 100% trazable |
| **Documentos HSEQ** | Modelo duplicado | Integrado con FirmaDigital | ✅ Consolidado |
| **Formularios** | Sin integración | FormularioDiligenciado + FirmaDigital | ✅ Firmas múltiples |
| **Onboarding** | Modelo separado | Mantiene FirmaDocumento (caso específico) | ✅ Sin cambios |
| **Actas/Asistencia** | Sin solución | FormularioDiligenciado + campo SIGNATURE | ✅ Nueva funcionalidad |

### 8.3 Beneficios de Cumplimiento Normativo

| Norma | Requisito | Cómo se Cumple |
|-------|-----------|----------------|
| **ISO 9001:2015** | 7.5.3 Control de información documentada | FirmaDigital con workflow de aprobación |
| **ISO 45001:2018** | 5.2 Política de SST (firmada) | PoliticaEspecifica + FirmaDigital (APROBO) |
| **Decreto 1072/2015** | Art. 2.2.4.6.8 Política de SST firmada | FirmaDigital con rol APROBO + hash SHA-256 |
| **Decreto 1072/2015** | Art. 2.2.4.6.12 Documentación del SG-SST | HistorialVersion + FirmaDigital |
| **ISO 9001:2015** | 9.2 Auditoría interna | HistorialFirma + trazabilidad completa |
| **GDPR / Habeas Data** | Trazabilidad de consentimientos | IP + timestamp + hash en FirmaDigital |

---

## 9. CRONOGRAMA DE IMPLEMENTACIÓN

### Fase 1: Preparación (Semana 1-2)

| Tarea | Responsable | Duración | Entregable |
|-------|-------------|----------|------------|
| Revisión de código existente | Arquitecto | 2 días | Mapa de dependencias |
| Diseño detallado de nuevos modelos | Arquitecto | 2 días | DDL SQL + Django models |
| Validación con stakeholders | Product Owner | 1 día | Aprobación arquitectura |
| Creación de branch `feature/firma-unificada` | DevOps | 1 hora | Branch listo |

### Fase 2: Implementación de Nuevos Modelos (Semana 2-3)

| Tarea | Responsable | Duración | Entregable |
|-------|-------------|----------|------------|
| Implementar FormularioDiligenciado | Backend Dev | 2 días | Modelo + migración |
| Implementar RespuestaCampo | Backend Dev | 1 día | Modelo + migración |
| Implementar AsignacionFormulario | Backend Dev | 1 día | Modelo + migración |
| Crear serializers y viewsets | Backend Dev | 2 días | API REST completa |
| Tests unitarios | QA | 2 días | Cobertura >80% |

### Fase 3: Migración de Datos (Semana 3-4)

| Tarea | Responsable | Duración | Entregable |
|-------|-------------|----------|------------|
| Script migración FirmaPolitica | Backend Dev | 1 día | Migración Django |
| Script migración FirmaDocumento (HSEQ) | Backend Dev | 1 día | Migración Django |
| Validación de datos migrados | QA | 1 día | Reporte de validación |
| Backup completo de BD | DevOps | 1 hora | Backup verificado |

### Fase 4: Integración Frontend (Semana 4-5)

| Tarea | Responsable | Duración | Entregable |
|-------|-------------|----------|------------|
| Componente SignatureField | Frontend Dev | 1 día | Componente React |
| Formulario diligenciado (UI) | Frontend Dev | 2 días | CRUD completo |
| Integración con FirmaDigital | Frontend Dev | 2 días | Captura de firmas |
| Tests E2E | QA | 2 días | Suite de tests |

### Fase 5: Eliminación de Modelos Legacy (Semana 5-6)

| Tarea | Responsable | Duración | Entregable |
|-------|-------------|----------|------------|
| Eliminación de FirmaPolitica | Backend Dev | 1 día | Migración de eliminación |
| Eliminación de FirmaDocumento (HSEQ) | Backend Dev | 1 día | Migración de eliminación |
| Actualizar documentación | Tech Writer | 2 días | Docs actualizados |
| Regression testing | QA | 2 días | Reporte de QA |

### Fase 6: Despliegue (Semana 6)

| Tarea | Responsable | Duración | Entregable |
|-------|-------------|----------|------------|
| Deploy a staging | DevOps | 1 día | Staging actualizado |
| Validación en staging | QA + PO | 2 días | Sign-off |
| Deploy a producción | DevOps | 4 horas | Producción actualizada |
| Monitoreo post-deploy | DevOps | 1 semana | Logs + métricas |

**Duración Total:** 6 semanas (30 días hábiles)

---

## 10. RIESGOS Y MITIGACIÓN

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Pérdida de datos en migración** | Media | Alto | Backup completo + validación exhaustiva + rollback plan |
| **Incompatibilidad con frontend existente** | Baja | Medio | Tests E2E antes de deploy + feature flags |
| **Performance en carga de firmas** | Baja | Medio | Índices optimizados + caching de consultas frecuentes |
| **Resistencia al cambio de usuarios** | Media | Bajo | Capacitación + documentación clara + soporte dedicado |
| **Bugs en workflow de aprobación** | Media | Alto | Suite completa de tests + QA exhaustivo en staging |
| **Dependencias circulares** | Baja | Alto | GenericForeignKey evita dependencias duras |

---

## 11. CONCLUSIONES Y RECOMENDACIONES

### 11.1 Conclusiones

1. ✅ **FirmaDigital es el modelo base robusto** para firmas con workflow de aprobación
2. ✅ **FormBuilder requiere 3 nuevos modelos** (FormularioDiligenciado, RespuestaCampo, AsignacionFormulario)
3. ✅ **FirmaDocumento de Onboarding se mantiene** por su propósito específico de RRHH
4. ✅ **FirmaPolitica y FirmaDocumento (HSEQ) se eliminan** después de migración
5. ✅ **GenericForeignKey permite escalabilidad infinita** para firmar cualquier entidad

### 11.2 Recomendaciones

#### A. Técnicas

1. **Implementar índices compuestos** en FirmaDigital para optimizar consultas frecuentes:
   ```sql
   CREATE INDEX idx_firma_content_estado ON workflow_firma_digital(content_type_id, object_id, estado);
   CREATE INDEX idx_firma_usuario_fecha ON workflow_firma_digital(usuario_id, fecha_firma DESC);
   ```

2. **Cachear configuraciones de flujo** para evitar consultas repetitivas:
   ```python
   from django.core.cache import cache

   def get_flujo_firma(codigo):
       cache_key = f'flujo_firma_{codigo}'
       flujo = cache.get(cache_key)
       if not flujo:
           flujo = ConfiguracionFlujoFirma.objects.get(codigo=codigo)
           cache.set(cache_key, flujo, 3600)  # 1 hora
       return flujo
   ```

3. **Implementar firma electrónica avanzada** (opcional - futuro):
   - Integración con certificados digitales (ej: ANDES PKI, Certicámara)
   - Firma con token USB
   - Biometría (huella dactilar)

4. **Async processing para generación de PDFs** con firmas:
   ```python
   from celery import shared_task

   @shared_task
   def generar_pdf_con_firmas(documento_id):
       documento = Documento.objects.get(pk=documento_id)
       firmas = documento.get_firmas()
       pdf = generar_pdf(documento, firmas)
       documento.archivo_pdf = pdf
       documento.save()
   ```

#### B. Funcionales

1. **Configurar workflows por defecto** para cada tipo de documento:
   - Políticas Integrales → Flujo ISO Estándar
   - Procedimientos → Flujo Operativo
   - Formatos → Flujo Simplificado

2. **Automatizar alertas de firmas pendientes**:
   - Notificación a los 3 días de asignación
   - Escalamiento a los 5 días (según `dias_max_firma`)
   - Alerta a superior inmediato

3. **Dashboard de firmas pendientes** por usuario:
   - Mis firmas pendientes (prioridad)
   - Firmas delegadas
   - Firmas rechazadas (requieren acción)

#### C. De Cumplimiento

1. **Auditoría mensual de firmas** (reporte automático):
   - Firmas creadas en el período
   - Firmas rechazadas (motivos)
   - Delegaciones activas
   - Firmas con hash inválido (integridad comprometida)

2. **Revisión anual de políticas** (automatizada):
   - AlertaRevision programa revisiones
   - Notificación a responsables 30 días antes
   - Escalamiento si no se revisa

3. **Trazabilidad completa** (HistorialFirma):
   - Todos los eventos se registran
   - Inmutabilidad del historial
   - Exportación para auditorías externas

---

## 12. APÉNDICES

### Apéndice A: Diccionario de Datos

#### FirmaDigital

| Campo | Tipo | Nulo | Descripción |
|-------|------|------|-------------|
| `id` | UUID | No | Identificador único |
| `content_type_id` | INT | No | Tipo de entidad firmada (FK ContentType) |
| `object_id` | UUID | No | ID de la entidad firmada |
| `configuracion_flujo_id` | UUID | Sí | FK ConfiguracionFlujoFirma (null si sin workflow) |
| `nodo_flujo_id` | UUID | Sí | FK FlowNode (null si sin workflow) |
| `usuario_id` | UUID | No | FK User (firmante) |
| `cargo_id` | UUID | No | FK Cargo (al momento de firmar) |
| `rol_firma` | VARCHAR(20) | No | ELABORO, REVISO, APROBO, VALIDO, AUTORIZO, CONFORMIDAD |
| `firma_imagen` | TEXT | No | Base64 de imagen de firma |
| `documento_hash` | VARCHAR(64) | No | SHA-256 del documento |
| `firma_hash` | VARCHAR(64) | No | SHA-256 de la firma |
| `fecha_firma` | TIMESTAMP | No | Fecha y hora de firma |
| `ip_address` | INET | No | IP del cliente |
| `user_agent` | TEXT | Sí | Navegador y SO |
| `geolocalizacion` | JSONB | Sí | {latitud, longitud} |
| `estado` | VARCHAR(20) | No | PENDIENTE, FIRMADO, RECHAZADO, DELEGADO, EXPIRADO |
| `orden` | INT | No | Orden en flujo secuencial |
| `comentarios` | TEXT | Sí | Comentarios del firmante |
| `es_delegada` | BOOLEAN | No | Si es firma delegada |
| `delegante_id` | UUID | Sí | FK User (quien delegó) |
| `created_at` | TIMESTAMP | No | Fecha de creación |
| `updated_at` | TIMESTAMP | No | Fecha de actualización |

#### FormularioDiligenciado

| Campo | Tipo | Nulo | Descripción |
|-------|------|------|-------------|
| `id` | UUID | No | Identificador único |
| `empresa_id` | BIGINT | No | FK EmpresaConfig (multi-tenant) |
| `plantilla_flujo_id` | UUID | No | FK PlantillaFlujo |
| `numero_formulario` | VARCHAR(50) | No | Código único (ej: FRM-2026-0001) |
| `titulo` | VARCHAR(255) | No | Título descriptivo |
| `diligenciado_por_id` | UUID | No | FK User |
| `fecha_diligenciamiento` | TIMESTAMP | No | Fecha de creación |
| `fecha_completado` | TIMESTAMP | Sí | Fecha de completado |
| `asignacion_id` | UUID | Sí | FK AsignacionFormulario |
| `content_type_id` | INT | Sí | Tipo de entidad relacionada |
| `object_id` | UUID | Sí | ID de entidad relacionada |
| `datos_formulario` | JSONB | No | Datos estructurados |
| `estado` | VARCHAR(20) | No | EN_PROGRESO, COMPLETADO, APROBADO, RECHAZADO, ANULADO |
| `observaciones` | TEXT | Sí | Observaciones generales |
| `created_at` | TIMESTAMP | No | Fecha de creación |
| `updated_at` | TIMESTAMP | No | Fecha de actualización |
| `created_by_id` | UUID | Sí | FK User |
| `updated_by_id` | UUID | Sí | FK User |
| `is_active` | BOOLEAN | No | Borrado lógico |
| `deleted_at` | TIMESTAMP | Sí | Fecha de borrado |

### Apéndice B: Diagramas UML

```
┌─────────────────────────────────────────────────────────────────┐
│                    DIAGRAMA DE CLASES                           │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────┐
│  FirmaDigital         │
├───────────────────────┤
│ + content_type        │◄─────┐
│ + object_id           │      │ GenericForeignKey
│ + usuario             │      │
│ + cargo               │      │
│ + rol_firma           │      │
│ + firma_imagen        │      │
│ + documento_hash      │      │
│ + firma_hash          │      │
│ + fecha_firma         │      │
│ + estado              │      │
└───────────────────────┘      │
        │                      │
        │ 0..*                 │
        │                      │
        │                      │
┌───────────────────────┐      │
│ ConfiguracionFlujo    │      │
│ Firma                 │      │
├───────────────────────┤      │
│ + nombre              │      │
│ + codigo              │      │
│ + tipo_flujo          │      │
│ + configuracion_nodos │      │
│ + permite_delegacion  │      │
└───────────────────────┘      │
        │                      │
        │ 1..*                 │
        ▼                      │
┌───────────────────────┐      │
│  FlowNode             │      │
├───────────────────────┤      │
│ + orden               │      │
│ + rol_firma           │      │
│ + cargo               │      │
│ + es_requerido        │      │
└───────────────────────┘      │
                              │
                              │
┌───────────────────────┐      │
│ FormularioDiligenciado│──────┘
├───────────────────────┤
│ + numero_formulario   │
│ + titulo              │
│ + plantilla_flujo     │
│ + diligenciado_por    │
│ + datos_formulario    │
│ + estado              │
│ + get_firmas()        │
└───────────────────────┘
        │
        │ 1..*
        ▼
┌───────────────────────┐
│  RespuestaCampo       │
├───────────────────────┤
│ + campo_formulario    │
│ + valor               │
│ + firma_base64        │
│ + modificado_por      │
│ + version             │
└───────────────────────┘


┌───────────────────────┐
│ FirmaDocumento        │
│ (Onboarding)          │
├───────────────────────┤
│ + colaborador         │
│ + tipo_documento      │
│ + documento           │
│ + documento_firmado   │
│ + fecha_firma         │
│ + testigo             │
│ + metodo_firma        │
└───────────────────────┘
```

### Apéndice C: Scripts de Utilidad

#### C.1 Generar Reporte de Firmas Pendientes

```python
# backend/scripts/reporte_firmas_pendientes.py

from django.utils import timezone
from datetime import timedelta
from apps.workflow_engine.firma_digital.models import FirmaDigital, ConfiguracionFlujoFirma
from apps.core.models import User

def generar_reporte_firmas_pendientes():
    """
    Genera reporte de firmas pendientes por usuario.
    """
    usuarios = User.objects.filter(is_active=True)

    print("=== REPORTE DE FIRMAS PENDIENTES ===\n")

    for usuario in usuarios:
        firmas_pendientes = FirmaDigital.objects.filter(
            usuario=usuario,
            estado='PENDIENTE'
        ).select_related('configuracion_flujo')

        if firmas_pendientes.exists():
            print(f"\n{usuario.get_full_name()} ({usuario.email})")
            print("-" * 60)

            for firma in firmas_pendientes:
                dias_pendiente = (timezone.now() - firma.created_at).days
                urgente = dias_pendiente >= firma.configuracion_flujo.dias_max_firma

                print(f"  • {firma.documento} ({firma.get_rol_firma_display()})")
                print(f"    Asignada: {firma.created_at.strftime('%Y-%m-%d')}")
                print(f"    Pendiente: {dias_pendiente} días {'⚠️  URGENTE' if urgente else ''}")

            print(f"\n  Total pendientes: {firmas_pendientes.count()}")

    print("\n=== FIN DEL REPORTE ===")

if __name__ == '__main__':
    generar_reporte_firmas_pendientes()
```

#### C.2 Verificar Integridad de Firmas

```python
# backend/scripts/verificar_integridad_firmas.py

from apps.workflow_engine.firma_digital.models import FirmaDigital
from django.contrib.contenttypes.models import ContentType

def verificar_integridad_firmas():
    """
    Verifica la integridad de todas las firmas comparando hashes.
    """
    firmas = FirmaDigital.objects.filter(estado='FIRMADO')

    print("=== VERIFICACIÓN DE INTEGRIDAD DE FIRMAS ===\n")

    invalidas = 0
    validas = 0

    for firma in firmas:
        # Obtener documento original
        try:
            documento = firma.documento

            # Recalcular hash
            if hasattr(documento, 'calcular_hash'):
                hash_actual = documento.calcular_hash()
            else:
                # Método genérico
                import hashlib
                import json
                contenido = str(documento)
                hash_actual = hashlib.sha256(contenido.encode()).hexdigest()

            # Comparar
            if hash_actual != firma.documento_hash:
                print(f"❌ FIRMA INVÁLIDA: {firma}")
                print(f"   Hash esperado: {firma.documento_hash}")
                print(f"   Hash actual:   {hash_actual}")
                print(f"   Documento modificado después de la firma\n")
                invalidas += 1
            else:
                validas += 1

        except Exception as e:
            print(f"⚠️  ERROR al verificar {firma}: {e}\n")

    print(f"\n=== RESUMEN ===")
    print(f"Firmas válidas:   {validas}")
    print(f"Firmas inválidas: {invalidas}")
    print(f"Total verificadas: {validas + invalidas}")

if __name__ == '__main__':
    verificar_integridad_firmas()
```

---

**FIN DEL DOCUMENTO DE ARQUITECTURA**

**Aprobaciones:**

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| Arquitecto de Datos | [Pendiente] | | |
| Product Owner | [Pendiente] | | |
| Tech Lead Backend | [Pendiente] | | |
| Tech Lead Frontend | [Pendiente] | | |

**Control de Versiones:**

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | 2026-01-17 | Arquitecto de Datos | Versión inicial |
