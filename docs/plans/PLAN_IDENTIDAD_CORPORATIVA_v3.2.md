# Plan de Trabajo: Identidad Corporativa v3.2
## Brechas y Mejoras del Módulo de Políticas

**Fecha:** 2026-01-12
**Versión:** 3.2
**Estado:** Por Aprobar

---

## Resumen Ejecutivo

Este plan aborda las brechas identificadas en el flujo de políticas del módulo de Identidad Corporativa, incluyendo:

1. **Flujo de Firma por Cargos** - Seleccionar cargos en lugar de usuarios específicos
2. **Integración con Gestor Documental** - Modelo híbrido de exportación
3. **Alcance Dinámico** - Opción de declarar alcance del sistema
4. **Notificaciones Completas** - Campanita + Email integrados

---

## Estado Actual de Componentes

### ✅ Implementado y Funcionando

| Componente | Ubicación | Estado |
|------------|-----------|--------|
| Firma manuscrita digital | `models_workflow_firmas.py` | ✅ Completo |
| Centro de Notificaciones | `audit_system/centro_notificaciones/` | ✅ Completo |
| Gestor Documental | `hseq_management/sistema_documental/` | ✅ Completo |
| Campanita en Header | `layouts/Header.tsx` | ✅ Completo |
| Email Service | `centro_notificaciones/email_service.py` | ✅ Completo |
| Modelo Cargo | `core/models.py` | ✅ Completo |
| Modelo AlcanceSistema | `identidad/models.py` | ✅ Existe (sin UI) |

### ⚠️ Parcialmente Implementado

| Componente | Problema | Solución |
|------------|----------|----------|
| FirmantesSelectionModal | Roles hardcodeados | Cargar cargos desde BD |
| Estados de Política | Faltan EN_APROBACION, POR_CODIFICAR | Agregar al seed |
| Notificación por Cargo | Solo notifica a usuario específico | Notificar a todos del cargo |

### ❌ No Implementado

| Componente | Descripción |
|------------|-------------|
| UI de Alcance | Checkbox "¿Desea declarar alcance?" + formulario |
| Integración Identidad-GestorDocumental | Crear documento al publicar política |
| Exportación completa de Identidad | PDF/DOCX desde Gestor Documental |

---

## Arquitectura de Notificaciones Actual

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE NOTIFICACIONES                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   IN_APP     │    │    EMAIL     │    │  PUSH/SMS    │       │
│  │  (Campanita) │    │  (SMTP)      │    │  (TODO)      │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │                │
│         └───────────────────┼───────────────────┘                │
│                             │                                    │
│                    ┌────────▼────────┐                          │
│                    │ enviar_notificacion() │                     │
│                    │   utils.py      │                          │
│                    └────────┬────────┘                          │
│                             │                                    │
│         ┌───────────────────┼───────────────────┐               │
│         │                   │                   │                │
│  ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐         │
│  │ Notificacion │    │ EmailService │    │ SMS/Push   │         │
│  │   (modelo)   │    │  (templates) │    │  (TODO)    │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Canales por Prioridad:
- BAJA:    [IN_APP]
- MEDIA:   [EMAIL, IN_APP]
- ALTA:    [EMAIL, IN_APP, PUSH]
- CRITICA: [EMAIL, SMS, IN_APP, PUSH]
```

**Estado de Canales:**
| Canal | Estado | Implementación |
|-------|--------|----------------|
| IN_APP (Campanita) | ✅ Funcionando | `Header.tsx` + `useNotificacionesNoLeidas` |
| EMAIL | ✅ Funcionando | `EmailService` + templates HTML |
| SMS | ⚠️ Estructura lista | Requiere integración Twilio/AWS SNS |
| PUSH | ⚠️ Estructura lista | Requiere integración Firebase FCM |

---

## Flujo de Políticas Objetivo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FLUJO DE POLÍTICAS v3.2                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. BORRADOR                                                            │
│     │                                                                    │
│     │  Usuario crea política                                            │
│     │  Selecciona CARGO revisor (no usuario)                            │
│     │  Selecciona CARGO aprobador (no usuario)                          │
│     │                                                                    │
│     ▼                                                                    │
│  2. EN_REVISION ──────────────────────────────────────────────────────► │
│     │                                                                    │
│     │  📧 Notificación a TODOS los usuarios del CARGO revisor           │
│     │  🔔 Campanita muestra pendiente                                   │
│     │  Cualquier usuario del cargo puede revisar                        │
│     │  Firma manuscrita de revisión                                     │
│     │                                                                    │
│     ▼                                            ┌───────────────┐      │
│  3. EN_APROBACION ──────────────────────────────►│   RECHAZADO   │      │
│     │                                            │ (vuelve a 1)  │      │
│     │  📧 Notificación a TODOS los usuarios del CARGO aprobador        │
│     │  🔔 Campanita muestra pendiente                                   │
│     │  Firma manuscrita de aprobación                                   │
│     │                                                                    │
│     ▼                                                                    │
│  4. POR_CODIFICAR (Gestor Documental)                                   │
│     │                                                                    │
│     │  📧 Notificación al Gestor Documental                             │
│     │  Asigna código formal (POL-SST-001)                               │
│     │  Genera PDF oficial                                                │
│     │  Crea registro en sistema_documental.Documento                    │
│     │                                                                    │
│     ▼                                                                    │
│  5. VIGENTE                                                              │
│     │                                                                    │
│     │  Visible en sistema                                                │
│     │  Exportable desde Identidad + Gestor Documental                   │
│     │  📧 Notificación de publicación a interesados                     │
│     │                                                                    │
│     ▼                                                                    │
│  6. OBSOLETO (cuando nueva versión reemplaza)                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Plan de Implementación

### FASE 1: Backend - Estados y Notificaciones (Prioridad Alta)

#### Tarea 1.1: Agregar Estados Faltantes
**Archivo:** `backend/apps/gestion_estrategica/identidad/management/commands/seed_config_identidad.py`

```python
# Estados a agregar:
{
    'code': 'EN_APROBACION',
    'label': 'En Aprobación',
    'description': 'Política revisada, pendiente de aprobación final',
    'color': 'amber',
    'icon': 'ClipboardCheck',
    'orden': 4,  # Entre EN_REVISION (3) y FIRMADO (5)
    'permite_firma': True,
    'transiciones_permitidas': ['FIRMADO', 'RECHAZADO', 'BORRADOR']
},
{
    'code': 'POR_CODIFICAR',
    'label': 'Por Codificar',
    'description': 'Aprobada, pendiente de codificación en Gestor Documental',
    'color': 'purple',
    'icon': 'FileCode',
    'orden': 5,
    'permite_firma': False,
    'transiciones_permitidas': ['VIGENTE']
},
{
    'code': 'RECHAZADO',
    'label': 'Rechazado',
    'description': 'Política rechazada, requiere correcciones',
    'color': 'red',
    'icon': 'XCircle',
    'orden': 99,
    'permite_firma': False,
    'transiciones_permitidas': ['BORRADOR']
}
```

**Estimación:** 1 hora

---

#### Tarea 1.2: Crear Función de Notificación por Cargo
**Archivo:** `backend/apps/audit_system/centro_notificaciones/utils.py`

```python
def notificar_cargo(
    cargo,
    tipo,
    asunto,
    mensaje,
    link=None,
    prioridad='MEDIA',
    excluir_usuario=None
):
    """
    Envía notificación a TODOS los usuarios de un cargo.

    Args:
        cargo: Instancia de Cargo o ID
        tipo: Tipo de notificación
        asunto: Asunto
        mensaje: Mensaje
        link: URL opcional
        prioridad: BAJA, MEDIA, ALTA, CRITICA
        excluir_usuario: Usuario a excluir (ej: el creador)

    Returns:
        dict: Estadísticas de envío
    """
    from apps.core.models import User, Cargo

    if isinstance(cargo, int):
        cargo = Cargo.objects.get(id=cargo)

    # Obtener usuarios del cargo
    usuarios = User.objects.filter(
        cargo=cargo,
        is_active=True
    )

    if excluir_usuario:
        usuarios = usuarios.exclude(id=excluir_usuario.id)

    return notificar_grupo(
        usuarios=usuarios,
        tipo=tipo,
        asunto=asunto,
        mensaje=mensaje,
        link=link,
        prioridad=prioridad
    )
```

**Estimación:** 2 horas

---

#### Tarea 1.3: Modificar FirmaPolitica para usar Cargo
**Archivo:** `backend/apps/gestion_estrategica/identidad/models_workflow_firmas.py`

El modelo ya tiene `cargo` como FK. Verificar que el flujo use cargo para notificar.

**Cambio en views.py - acción iniciar_firma:**
```python
def iniciar_firma(self, request, pk=None):
    # ...
    # Al crear cada FirmaPolitica, notificar al cargo
    for firmante_data in firmantes:
        cargo = Cargo.objects.get(id=firmante_data['cargo_id'])

        firma = FirmaPolitica.objects.create(
            proceso=proceso,
            cargo=cargo,
            rol_firmante=firmante_data['rol'],
            orden=firmante_data['orden'],
            estado='PENDIENTE'
        )

        # Notificar a todos los usuarios del cargo
        notificar_cargo(
            cargo=cargo,
            tipo='FIRMA_REQUERIDA',
            asunto=f'Firma pendiente: {politica.title}',
            mensaje=f'La política "{politica.title}" requiere su {firma.get_rol_firmante_display()}.',
            link=f'/gestion-estrategica/identidad/politicas/{politica.id}',
            prioridad='ALTA',
            excluir_usuario=request.user  # No notificar al creador
        )
```

**Estimación:** 3 horas

---

### FASE 2: Frontend - Modal de Firmantes Dinámico (Prioridad Alta)

#### Tarea 2.1: Crear Hook useCargos
**Archivo:** `frontend/src/features/configuracion/hooks/useCargos.ts` (ya existe, verificar)

```typescript
// Verificar que exista endpoint para obtener cargos con usuarios
export const useCargosConUsuarios = () => {
  return useQuery({
    queryKey: ['cargos', 'con-usuarios'],
    queryFn: () => api.get('/api/organizacion/cargos/?include_users=true'),
  });
};
```

**Estimación:** 1 hora

---

#### Tarea 2.2: Refactorizar FirmantesSelectionModal
**Archivo:** `frontend/src/features/gestion-estrategica/components/politicas/FirmantesSelectionModal.tsx`

**Cambios principales:**
1. Eliminar `ROLES_DISPONIBLES` hardcodeado
2. Cargar cargos desde API
3. Mostrar: Cargo → Usuarios del cargo (info)
4. Seleccionar cargo, no usuario específico

```typescript
// ANTES (hardcodeado):
const ROLES_DISPONIBLES = [
  { code: 'REVISO_TECNICO', label: 'Revisó (Técnico)', ... },
  { code: 'APROBO_GERENTE', label: 'Aprobó (Gerente)', ... },
];

// DESPUÉS (dinámico):
const { data: cargos, isLoading } = useCargos();
const { data: rolesFirmante } = useRolesFirmante(); // Desde API config

// El usuario selecciona:
// 1. Rol de firma (REVISOR, APROBADOR)
// 2. Cargo que cumplirá ese rol
// 3. Se muestra cuántos usuarios tiene ese cargo
```

**Estimación:** 4 horas

---

### FASE 3: UI de Alcance Dinámico (Prioridad Media)

#### Tarea 3.1: Agregar campo declara_alcance a CorporateIdentity
**Archivo:** `backend/apps/gestion_estrategica/identidad/models.py`

```python
class CorporateIdentity(BaseCompanyModel):
    # ... campos existentes ...

    # Nuevo campo
    declara_alcance = models.BooleanField(
        default=False,
        verbose_name='¿Declara Alcance?',
        help_text='Si es True, se mostrará la sección de Alcance del Sistema'
    )
```

**Migración:** `0011_add_declara_alcance.py`

**Estimación:** 1 hora

---

#### Tarea 3.2: Crear UI de Alcance en IdentidadTab
**Archivo:** `frontend/src/features/gestion-estrategica/components/IdentidadTab.tsx`

```typescript
// Nueva sección después de Valores:
{identity.declara_alcance && (
  <AlcanceSection identity={identity} />
)}

// Toggle en formulario de edición de identidad:
<Switch
  label="¿Desea declarar el alcance del sistema?"
  checked={formData.declara_alcance}
  onChange={(checked) => setFormData({...formData, declara_alcance: checked})}
/>
```

**Componente AlcanceSection:**
- Lista de alcances por tipo (GEOGRAFICO, PROCESOS, PRODUCTOS, EXCLUSIONES)
- CRUD para cada tipo
- RichTextEditor para descripción

**Estimación:** 6 horas

---

### FASE 4: Integración con Gestor Documental (Prioridad Media)

> **DECISIÓN:** Exportación SOLO desde Gestor Documental para garantizar trazabilidad completa.

#### Tarea 4.1: Crear Servicio de Integración
**Archivo:** `backend/apps/gestion_estrategica/identidad/services_documental.py`

```python
class IdentidadDocumentalService:
    """
    Servicio para integrar Identidad Corporativa con Gestor Documental.

    Modelo de Exportación Centralizado:
    - Al publicar política, se crea registro en Gestor Documental
    - Exportación de Identidad Corporativa SOLO desde Gestor Documental
    - Garantiza trazabilidad, control de versiones y auditoría
    """

    @staticmethod
    def publicar_politica_en_gestor(politica, usuario):
        """
        Crea un Documento en el Gestor Documental cuando una política
        pasa a estado VIGENTE.
        """
        from apps.hseq_management.sistema_documental.models import (
            Documento, TipoDocumento, VersionDocumento
        )

        # Obtener o crear tipo de documento "Política"
        tipo_doc, _ = TipoDocumento.objects.get_or_create(
            codigo='POL',
            empresa_id=politica.identity.empresa_id,
            defaults={
                'nombre': 'Política',
                'nivel_documento': 'ESTRATEGICO',
                'prefijo_codigo': 'POL-',
                'requiere_aprobacion': True,
                'requiere_firma': True,
            }
        )

        # Crear documento
        documento = Documento.objects.create(
            codigo=politica.code or f"POL-{politica.tipo.code}-{politica.id:03d}",
            titulo=politica.title,
            tipo_documento=tipo_doc,
            resumen=f"Política de {politica.tipo.name}",
            contenido=politica.content,
            version_actual=politica.version,
            estado='PUBLICADO',
            clasificacion='INTERNO',
            fecha_publicacion=timezone.now().date(),
            fecha_vigencia=politica.effective_date,
            elaborado_por=politica.created_by or usuario,
            empresa_id=politica.identity.empresa_id,
        )

        # Crear versión inicial
        VersionDocumento.objects.create(
            documento=documento,
            numero_version=politica.version,
            tipo_cambio='CREACION',
            contenido_snapshot=politica.content,
            descripcion_cambios='Versión inicial publicada desde Identidad Corporativa',
            creado_por=usuario,
            is_version_actual=True,
            empresa_id=politica.identity.empresa_id,
        )

        return documento

    @staticmethod
    def publicar_identidad_completa_en_gestor(identity, usuario):
        """
        Publica la Identidad Corporativa completa en el Gestor Documental.

        Crea un documento maestro que incluye:
        - Misión, Visión
        - Valores corporativos
        - Alcance del sistema (si declara_alcance=True)
        - Referencias a políticas vigentes

        La exportación a PDF/DOCX se hace DESDE el Gestor Documental.
        """
        from apps.hseq_management.sistema_documental.models import (
            Documento, TipoDocumento, VersionDocumento
        )
        from apps.gestion_estrategica.identidad.exporters import pdf_generator

        # Obtener o crear tipo de documento "Identidad Corporativa"
        tipo_doc, _ = TipoDocumento.objects.get_or_create(
            codigo='IDC',
            empresa_id=identity.empresa_id,
            defaults={
                'nombre': 'Identidad Corporativa',
                'nivel_documento': 'ESTRATEGICO',
                'prefijo_codigo': 'IDC-',
                'requiere_aprobacion': True,
                'requiere_firma': True,
            }
        )

        # Generar contenido HTML de la identidad
        contenido_html = pdf_generator.generate_identity_html(identity)

        # Crear o actualizar documento
        documento, created = Documento.objects.update_or_create(
            codigo=f"IDC-{identity.empresa_id:03d}",
            empresa_id=identity.empresa_id,
            defaults={
                'titulo': 'Identidad Corporativa',
                'tipo_documento': tipo_doc,
                'resumen': f"Identidad Corporativa - {identity.mission[:100] if identity.mission else ''}...",
                'contenido': contenido_html,
                'version_actual': identity.version,
                'estado': 'PUBLICADO',
                'clasificacion': 'INTERNO',
                'fecha_publicacion': timezone.now().date(),
                'elaborado_por': usuario,
            }
        )

        # Crear versión
        VersionDocumento.objects.create(
            documento=documento,
            numero_version=identity.version,
            tipo_cambio='ACTUALIZACION' if not created else 'CREACION',
            contenido_snapshot=contenido_html,
            descripcion_cambios='Actualización desde módulo Identidad Corporativa',
            creado_por=usuario,
            is_version_actual=True,
            empresa_id=identity.empresa_id,
        )

        return documento
```

**Estimación:** 4 horas

---

#### Tarea 4.2: Trigger al Publicar Política
**Archivo:** `backend/apps/gestion_estrategica/identidad/views.py`

```python
@action(detail=True, methods=['post'])
def publicar(self, request, pk=None):
    """
    Publica una política aprobada:
    1. Cambia estado a VIGENTE
    2. Crea registro en Gestor Documental
    3. Notifica a interesados
    """
    politica = self.get_object()

    # Validar que esté en estado correcto
    if politica.status != 'POR_CODIFICAR':
        return Response(
            {'error': 'Solo políticas aprobadas pueden publicarse'},
            status=400
        )

    # Cambiar estado
    politica.status = 'VIGENTE'
    politica.save()

    # Crear en Gestor Documental
    from .services_documental import IdentidadDocumentalService
    documento = IdentidadDocumentalService.publicar_politica_en_gestor(
        politica=politica,
        usuario=request.user
    )

    # Notificar publicación
    # TODO: Definir quiénes deben ser notificados

    return Response({
        'message': 'Política publicada exitosamente',
        'documento_id': documento.id,
        'codigo': documento.codigo
    })
```

**Estimación:** 3 horas

---

### FASE 5: Exportación desde Gestor Documental (Prioridad Baja)

#### Tarea 5.1: Endpoint de Exportación en Gestor Documental
**Archivo:** `backend/apps/hseq_management/sistema_documental/views.py`

```python
@action(detail=False, methods=['get'])
def exportar_identidad_corporativa(self, request):
    """
    Exporta la Identidad Corporativa completa.

    Query params:
    - formato: pdf | docx (default: pdf)
    - identity_id: ID de la identidad (opcional, usa activa si no se especifica)
    """
    formato = request.query_params.get('formato', 'pdf')
    identity_id = request.query_params.get('identity_id')

    # Obtener identidad
    if identity_id:
        identity = CorporateIdentity.objects.get(
            id=identity_id,
            empresa_id=request.user.empresa_id
        )
    else:
        identity = CorporateIdentity.objects.filter(
            empresa_id=request.user.empresa_id,
            is_active=True
        ).first()

    if not identity:
        return Response({'error': 'No hay identidad corporativa activa'}, status=404)

    # Generar exportación
    from apps.gestion_estrategica.identidad.services_documental import (
        IdentidadDocumentalService
    )

    content = IdentidadDocumentalService.exportar_identidad_completa(
        identity=identity,
        formato=formato
    )

    # Retornar archivo
    content_type = 'application/pdf' if formato == 'pdf' else \
                   'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    extension = 'pdf' if formato == 'pdf' else 'docx'

    response = HttpResponse(content, content_type=content_type)
    response['Content-Disposition'] = f'attachment; filename="identidad_corporativa.{extension}"'

    return response
```

**Estimación:** 3 horas

---

## Resumen de Tiempos

| Fase | Descripción | Horas Est. |
|------|-------------|------------|
| 1 | Backend - Estados y Notificaciones | 6 h |
| 2 | Frontend - Modal Firmantes Dinámico | 5 h |
| 3 | UI de Alcance Dinámico | 7 h |
| 4 | Integración con Gestor Documental | 7 h |
| 5 | Exportación desde Gestor Documental | 3 h |
| **Total** | | **28 h** |

---

## Orden de Ejecución Recomendado

```
Semana 1:
├── Fase 1: Estados y Notificaciones por Cargo
│   ├── 1.1 Agregar estados faltantes
│   ├── 1.2 Función notificar_cargo
│   └── 1.3 Modificar flujo de firma
│
└── Fase 2: Modal Firmantes Dinámico
    ├── 2.1 Hook useCargos
    └── 2.2 Refactorizar FirmantesSelectionModal

Semana 2:
├── Fase 3: UI de Alcance
│   ├── 3.1 Campo declara_alcance
│   └── 3.2 Componente AlcanceSection
│
└── Fase 4: Integración Gestor Documental
    ├── 4.1 Servicio de integración
    └── 4.2 Trigger al publicar

Semana 3:
└── Fase 5: Exportación
    └── 5.1 Endpoint en Gestor Documental
```

---

## Dependencias y Riesgos

### Dependencias
1. **Cargos creados** - El flujo requiere que existan cargos con usuarios asignados
2. **Email configurado** - Para notificaciones por correo
3. **Gestor Documental migrado** - Tablas deben existir

### Riesgos
| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| BD sin migrar | Alta | Alto | Ejecutar migraciones primero |
| Sin cargos creados | Media | Alto | Seed con cargos de ejemplo |
| Email no configurado | Media | Medio | Fallback solo a IN_APP |

---

## Criterios de Aceptación

### Flujo de Firma por Cargos
- [ ] Usuario puede seleccionar CARGO (no usuario) para revisar
- [ ] Usuario puede seleccionar CARGO (no usuario) para aprobar
- [ ] Al enviar a firma, se notifica a TODOS los usuarios del cargo
- [ ] Notificación aparece en campanita
- [ ] Notificación se envía por email
- [ ] Cualquier usuario del cargo puede firmar

### Alcance Dinámico
- [ ] Toggle "¿Desea declarar alcance?" en formulario de identidad
- [ ] Si activo, muestra sección de Alcance
- [ ] CRUD de alcances por tipo (Geográfico, Procesos, etc.)

### Integración Gestor Documental
- [ ] Al publicar política, se crea Documento en Gestor
- [ ] Documento tiene código, versión, contenido
- [ ] Se puede exportar Identidad completa desde Gestor Documental
- [ ] Exportación incluye: Misión, Visión, Valores, Alcance, Políticas

---

## Aprobación

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| Desarrollador | | | |
| Líder Técnico | | | |
| Product Owner | | | |

---

*Documento generado automáticamente - Sistema de Gestión StrateKaz*
