# MEJORAS IDENTIFICADAS - FASE 1: CONFIGURACIÓN

> Documento generado: 2026-01-18
> Módulo: Gestión Estratégica → Configuración
> Secciones auditadas: Datos de Empresa, Sedes, Integraciones, Branding, Módulos y Features

---

## RESUMEN EJECUTIVO

| Sección | Estado Actual | Mejoras Identificadas |
|---------|---------------|----------------------|
| Datos de Empresa | ✅ Funcional | 3 mejoras (1 alta, 2 media) |
| Sedes | ✅ Funcional | 4 mejoras (1 alta, 2 media, 1 baja) |
| Integraciones | ✅ Funcional (9/10) | 4 mejoras (2 alta, 1 media, 1 baja) |
| Branding | ✅ Funcional (7.3/10) | 4 mejoras (2 alta, 2 media) |
| Módulos y Features | ✅ Robusto (9/10) | 3 mejoras (1 alta, 2 media) |
| Catálogos Base | ⚠️ Sin UI | 2 mejoras (2 media) |
| **Total** | - | **20 mejoras** |

---

## 1. DATOS DE EMPRESA

### 1.1 Estado Actual
- **Frontend**: 678 líneas, patrón Singleton, Design System integrado
- **Backend**: EmpresaConfig con validación NIT DIAN
- **RBAC**: Permisos view/create/edit funcionando
- **Dependencias**: 150+ modelos con FK a Empresa

### 1.2 Mejoras Identificadas

#### [ALTA] ME-001: Validación NIT en Frontend
**Problema**: La validación del NIT con dígito de verificación DIAN solo existe en backend.
**Impacto**: El usuario no recibe feedback inmediato si el NIT es inválido.
**Solución**: Implementar validación DIAN en el frontend antes de enviar.

```typescript
// utils/validators/nitValidator.ts
export function validarNitDian(nit: string): { valid: boolean; digito?: number; error?: string } {
  const nitLimpio = nit.replace(/[^0-9]/g, '');
  if (nitLimpio.length < 9 || nitLimpio.length > 10) {
    return { valid: false, error: 'NIT debe tener 9-10 dígitos' };
  }

  const pesos = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  let suma = 0;
  const digitos = nitLimpio.slice(0, -1).split('').reverse();

  digitos.forEach((d, i) => {
    suma += parseInt(d) * pesos[i];
  });

  const residuo = suma % 11;
  const digitoVerificacion = residuo > 1 ? 11 - residuo : residuo;
  const digitoIngresado = parseInt(nitLimpio.slice(-1));

  if (digitoVerificacion !== digitoIngresado) {
    return {
      valid: false,
      digito: digitoVerificacion,
      error: `Dígito de verificación incorrecto. Debería ser ${digitoVerificacion}`
    };
  }

  return { valid: true, digito: digitoVerificacion };
}
```

**Archivos a modificar**:
- `frontend/src/utils/validators/nitValidator.ts` (crear)
- `frontend/src/features/gestion-estrategica/components/EmpresaSection.tsx`

**Esfuerzo estimado**: 2-3 horas

---

#### [MEDIA] ME-002: Autocompletado de Ciudad por Departamento
**Problema**: El usuario debe buscar manualmente la ciudad después de seleccionar departamento.
**Impacto**: Experiencia de usuario subóptima.
**Solución**: Filtrar ciudades automáticamente según el departamento seleccionado.

**Archivos a modificar**:
- `frontend/src/features/gestion-estrategica/components/EmpresaSection.tsx`
- Backend: endpoint `/api/configuracion/empresa/ciudades/?departamento=XXX`

**Esfuerzo estimado**: 3-4 horas

---

#### [MEDIA] ME-003: Preview de Logo en Tiempo Real
**Problema**: El usuario no ve cómo quedará el logo hasta después de guardar.
**Impacto**: Posibles iteraciones innecesarias para ajustar el logo.
**Solución**: Mostrar preview del logo con diferentes fondos (claro/oscuro).

```typescript
// Componente LogoPreview
<div className="grid grid-cols-2 gap-4">
  <div className="p-4 bg-white rounded-lg border">
    <img src={logoPreviewUrl} alt="Preview claro" className="max-h-16" />
  </div>
  <div className="p-4 bg-gray-900 rounded-lg">
    <img src={logoPreviewUrl} alt="Preview oscuro" className="max-h-16" />
  </div>
</div>
```

**Archivos a modificar**:
- `frontend/src/features/gestion-estrategica/components/EmpresaSection.tsx`

**Esfuerzo estimado**: 2 horas

---

## 2. SEDES

### 2.1 Estado Actual
- **Frontend**: 780 líneas (SedesSection + SedeFormModal)
- **Backend**: 20+ campos, 7 validaciones, soft delete
- **RBAC**: Permisos view/create/edit/delete funcionando
- **Dependencias**: User, SolicitudCompra, OrdenCompra, ProgramaAbastecimiento

### 2.2 Mejoras Identificadas

#### [ALTA] MS-001: Aumentar Tamaño del Modal de Sedes
**Problema**: El modal usa `size="xl"` (576px) que es muy pequeño para 17 campos en 5 secciones.
**Impacto**: Scroll excesivo, formulario apretado, mala UX.
**Solución**: Cambiar a `size="lg"` (800px) o implementar sistema de tamaños mejorado.

```typescript
// Cambio directo
<BaseModal
  isOpen={isOpen}
  onClose={onClose}
  title={sede ? 'Editar Sede' : 'Nueva Sede'}
  size="lg" // Cambiar de "xl" a "lg" (800px)
>
```

**Alternativa (mejor)**: Implementar sistema de tamaños consistente:
```typescript
// components/modals/BaseModal.tsx
const sizeClasses = {
  xs: 'max-w-[360px]',
  sm: 'max-w-[480px]',
  md: 'max-w-[600px]',
  lg: 'max-w-[800px]',   // Para formularios complejos como Sedes
  xl: 'max-w-[960px]',   // Para tablas embebidas
  '2xl': 'max-w-[1120px]',
  full: 'max-w-[95vw]'
};
```

**Archivos a modificar**:
- `frontend/src/features/gestion-estrategica/components/modals/SedeFormModal.tsx`
- `frontend/src/components/modals/BaseModal.tsx` (opcional, para sistema de tamaños)

**Esfuerzo estimado**: 1-2 horas

---

#### [MEDIA] MS-002: Indicadores Visuales de Scroll en Modal
**Problema**: No hay indicación visual de que hay más contenido arriba/abajo del área visible.
**Impacto**: Usuarios pueden no darse cuenta que hay más campos.
**Solución**: Agregar sombras sutiles que indiquen scroll disponible.

```typescript
// components/modals/ModalBody.tsx
export function ModalBody({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(true);

  const handleScroll = () => {
    if (!ref.current) return;
    const { scrollTop, scrollHeight, clientHeight } = ref.current;
    setShowTopShadow(scrollTop > 0);
    setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 5);
  };

  return (
    <div className="relative flex-1 overflow-hidden">
      {showTopShadow && (
        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black/5 to-transparent z-10 pointer-events-none" />
      )}
      <div ref={ref} onScroll={handleScroll} className="h-full overflow-y-auto px-6 py-4">
        {children}
      </div>
      {showBottomShadow && (
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-black/5 to-transparent z-10 pointer-events-none" />
      )}
    </div>
  );
}
```

**Archivos a modificar**:
- `frontend/src/components/modals/BaseModal.tsx`

**Esfuerzo estimado**: 2-3 horas

---

#### [MEDIA] MS-003: Responsive Mobile para Modal de Sedes
**Problema**: En mobile el modal puede no adaptarse bien.
**Impacto**: Experiencia degradada en dispositivos móviles.
**Solución**: Implementar comportamiento full-screen en mobile.

```css
/* En BaseModal */
@media (max-width: 767px) {
  .modal-content {
    position: fixed;
    inset: 0;
    max-height: 100%;
    border-radius: 0;
    animation: slideUp 0.3s ease-out;
  }
}
```

**Archivos a modificar**:
- `frontend/src/components/modals/BaseModal.tsx`

**Esfuerzo estimado**: 2 horas

---

#### [BAJA] MS-004: Mapa Interactivo para Selección GPS
**Problema**: El usuario debe ingresar coordenadas manualmente o usar geolocalización del navegador.
**Impacto**: No puede seleccionar ubicación visualmente en un mapa.
**Solución**: Integrar componente de mapa (Leaflet/Google Maps) para selección visual.

```typescript
// Componente MapaPicker (futuro)
<MapaPicker
  latitud={form.latitud}
  longitud={form.longitud}
  onChange={(lat, lng) => {
    setForm(prev => ({ ...prev, latitud: lat, longitud: lng }));
  }}
/>
```

**Nota**: Esta mejora requiere integración con librería de mapas. Evaluar si es necesaria para MVP.

**Archivos a crear**:
- `frontend/src/components/common/MapaPicker.tsx`

**Esfuerzo estimado**: 8-12 horas

---

## 3. INTEGRACIONES

### 3.1 Estado Actual
- **Frontend**: 1,520 líneas totales (5 componentes)
  - IntegracionesSection.tsx: 435 líneas
  - IntegracionFormModal.tsx: 528 líneas
  - Componentes auxiliares: 520 líneas
- **Backend**: 3 módulos de integración
  - IntegracionExterna (principal)
  - Integración Contable
  - Exportación Analytics
- **RBAC**: Permisos granulares usando `usePermissions` + `canDo()`
  - `canDo(Modules.GESTION_ESTRATEGICA, Sections.INTEGRACIONES, 'create')`
  - `canDo(Modules.GESTION_ESTRATEGICA, Sections.INTEGRACIONES, 'edit')`
- **Tipos de Servicio**: 10 categorías, 40+ proveedores
- **Seguridad**: Credenciales encriptadas con Fernet

### 3.2 Hallazgos Positivos

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| TypeScript | ✅ Excelente | 100% tipado, sin `any` |
| Design System | ✅ 95% | Card, Badge, Button, ActionButtons |
| React Query | ✅ Correcto | Cache, invalidación estratégica |
| RBAC Frontend | ✅ Funcionando | Renderizado condicional por permisos |
| RBAC Backend | ✅ Funcionando | `section_code = 'integraciones'` |
| Seguridad | ✅ Robusta | Credenciales enmascaradas en API |
| UX | ✅ Buena | Loading states, empty states, feedback |
| Filtros | ✅ Completos | Por tipo de servicio y estado |

### 3.3 Mejoras Identificadas

#### [ALTA] MI-001: Implementar Test de Conexión Real
**Problema**: El endpoint `test_connection` existe pero no tiene lógica específica por tipo de servicio.
**Impacto**: No se valida realmente la conectividad con el servicio externo.
**Solución**: Implementar test_connection real por cada tipo de servicio.

```python
# backend/apps/gestion_estrategica/configuracion/services/connection_testers.py

class ConnectionTesterFactory:
    @staticmethod
    def get_tester(tipo_servicio: str):
        testers = {
            'EMAIL': EmailConnectionTester,
            'FACTURACION': FacturacionConnectionTester,
            'SMS': SMSConnectionTester,
            'PAGOS': PagosConnectionTester,
            # ... más testers
        }
        return testers.get(tipo_servicio, GenericConnectionTester)

class EmailConnectionTester:
    def test(self, credentials: dict) -> dict:
        """Prueba conexión SMTP/IMAP."""
        try:
            # Lógica de conexión real
            return {'success': True, 'message': 'Conexión exitosa'}
        except Exception as e:
            return {'success': False, 'message': str(e)}
```

**Archivos a crear/modificar**:
- `backend/apps/gestion_estrategica/configuracion/services/connection_testers.py` (crear)
- `backend/apps/gestion_estrategica/configuracion/views.py` (modificar test_connection)

**Esfuerzo estimado**: 6-8 horas

---

#### [ALTA] MI-002: Configurar ENCRYPTION_KEY en Producción
**Problema**: La clave de encriptación Fernet debe estar configurada correctamente en producción.
**Impacto**: Seguridad de credenciales de integraciones.
**Solución**: Verificar y documentar configuración de ENCRYPTION_KEY.

```python
# .env.production
ENCRYPTION_KEY=<Fernet-key-generada-con-cryptography>

# Generar clave:
# from cryptography.fernet import Fernet
# print(Fernet.generate_key().decode())
```

**Archivos a verificar**:
- `.env.production`
- `backend/config/settings/production.py`
- Documentación de despliegue

**Esfuerzo estimado**: 1-2 horas

---

#### [MEDIA] MI-003: Tests Unitarios e Integración
**Problema**: No hay tests automatizados para el módulo de integraciones.
**Impacto**: Riesgo de regresiones al hacer cambios.
**Solución**: Crear suite de tests.

```python
# backend/apps/gestion_estrategica/configuracion/tests/test_integraciones.py

class IntegracionExternaTests(APITestCase):
    def test_create_integracion(self):
        """Test crear integración con credenciales."""
        pass

    def test_credentials_are_encrypted(self):
        """Test que las credenciales se encriptan."""
        pass

    def test_credentials_masked_in_response(self):
        """Test que las credenciales se enmascaran en la API."""
        pass

    def test_test_connection_endpoint(self):
        """Test endpoint de prueba de conexión."""
        pass
```

**Archivos a crear**:
- `backend/apps/gestion_estrategica/configuracion/tests/test_integraciones.py`
- `frontend/src/features/gestion-estrategica/__tests__/IntegracionesSection.test.tsx`

**Esfuerzo estimado**: 8-12 horas

---

#### [BAJA] MI-004: Dashboard de Monitoreo de Integraciones
**Problema**: No hay vista consolidada del estado de todas las integraciones.
**Impacto**: Dificultad para monitorear salud del sistema.
**Solución**: Crear dashboard con métricas agregadas.

```typescript
// Componente IntegracionesDashboard (futuro)
<div className="grid grid-cols-4 gap-4">
  <StatCard title="Total" value={stats.total} />
  <StatCard title="Activas" value={stats.active} variant="success" />
  <StatCard title="Con Errores" value={stats.errors} variant="danger" />
  <StatCard title="Última Verificación" value={stats.lastCheck} />
</div>
```

**Nota**: Esta mejora es nice-to-have. Evaluar prioridad según necesidades operativas.

**Esfuerzo estimado**: 4-6 horas

---

## 4. BRANDING

### 4.1 Estado Actual

- **Frontend**: BrandingFormModal.tsx con 578 líneas
  - Gestión de logos (principal, oscuro, reducido)
  - Colores corporativos (primario, secundario, acento)
  - Slogan y configuración visual
- **Backend**: BrandingConfig (patrón Singleton)
  - Campos para logos, colores, slogan
  - `section_code = 'branding'` para RBAC
- **PWA**: manifest.json ESTÁTICO (generado en build time)
- **Favicon**: Dinámico vía hook `useDynamicTheme`

### 4.2 Hallazgos de Auditoría

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| TypeScript | ✅ Correcto | Interfaces tipadas |
| Design System | ✅ 90% | Card, Button, Input, ColorPicker |
| React Query | ✅ Correcto | Mutaciones con FormData |
| RBAC Frontend | ⚠️ Incompleto | Solo valida `edit`, falta `view` |
| RBAC Backend | ✅ Correcto | `section_code = 'branding'` |
| PWA | ❌ Estático | manifest.json hardcodeado en build |
| Favicon | ✅ Dinámico | Actualiza en runtime |
| Procesamiento Imágenes | ⚠️ No implementado | Pillow instalado pero no usado |

### 4.3 Mejoras Identificadas

#### [ALTA] MB-001: Implementar Manifest.json Dinámico para PWA

**Problema**: El archivo `manifest.json` de PWA se genera en tiempo de build con valores hardcodeados.

```typescript
// vite.config.ts - ACTUAL (ESTÁTICO)
VitePWA({
  manifest: {
    name: 'StrateKaz - Sistema de Gestión Integral', // HARDCODED
    short_name: 'StrateKaz',                          // HARDCODED
    theme_color: '#ec268f',                           // HARDCODED
    icons: [{ src: '/android-chrome-192x192.png', ... }] // ESTÁTICO
  }
})
```

**Caso de Uso Real**:
> Una empresa llamada "Carbones del Norte" instala la PWA en sus celulares.
> Actualmente en el home screen aparece "StrateKaz" con el logo genérico.
> **Esperado**: Debería aparecer "Carbones del Norte" con su logo corporativo.

**Impacto UX Crítico**:
- ❌ Usuarios ven "StrateKaz" en lugar del nombre de su empresa
- ❌ Logo genérico en home screen y splash screen
- ❌ Colores corporativos no reflejados en la barra del navegador móvil
- ❌ Confusión de identidad de marca para el usuario final

**Solución**: Endpoint dinámico para manifest.json.

```python
# backend/apps/gestion_estrategica/configuracion/views.py

from django.http import JsonResponse

def pwa_manifest(request):
    """Genera manifest.json dinámico basado en BrandingConfig."""
    from .models import BrandingConfig
    branding = BrandingConfig.objects.first()
    empresa = request.tenant  # o EmpresaConfig.objects.first()

    manifest = {
        "name": empresa.nombre if empresa else "Sistema de Gestión",
        "short_name": empresa.nombre_corto if empresa else "SIG",
        "description": branding.slogan if branding else "",
        "theme_color": branding.color_primario if branding else "#ec268f",
        "background_color": "#ffffff",
        "display": "standalone",
        "start_url": "/",
        "icons": []
    }

    # Agregar iconos si existen
    if branding and branding.logo_pwa_192:
        manifest["icons"].append({
            "src": branding.logo_pwa_192.url,
            "sizes": "192x192",
            "type": "image/png"
        })
    if branding and branding.logo_pwa_512:
        manifest["icons"].append({
            "src": branding.logo_pwa_512.url,
            "sizes": "512x512",
            "type": "image/png"
        })

    return JsonResponse(manifest)
```

```typescript
// frontend/index.html - Cambiar de estático a dinámico
<link rel="manifest" href="/api/pwa/manifest.json">
```

**Archivos a crear/modificar**:
- `backend/apps/gestion_estrategica/configuracion/views.py` (agregar endpoint)
- `backend/apps/gestion_estrategica/configuracion/models.py` (agregar campos logo_pwa_*)
- `backend/config/urls.py` (agregar ruta)
- `frontend/index.html` (cambiar href del manifest)
- `frontend/vite.config.ts` (remover manifest estático de VitePWA)

**Esfuerzo estimado**: 8-12 horas

---

#### [ALTA] MB-002: Agregar Validación de Permiso `view` en Frontend

**Problema**: El componente BrandingSection solo valida el permiso `edit`, pero no verifica `view`.
```typescript
// ACTUAL - Solo valida edit
const { canDo } = usePermissions();
const canEdit = canDo(Modules.GESTION_ESTRATEGICA, Sections.BRANDING, 'edit');

// Si no tiene permiso view, igual puede ver el contenido
```

**Impacto**: Usuarios sin permiso de ver branding pueden acceder a la sección.

**Solución**: Agregar validación completa de permisos.

```typescript
// PROPUESTO
const { canDo } = usePermissions();
const canView = canDo(Modules.GESTION_ESTRATEGICA, Sections.BRANDING, 'view');
const canEdit = canDo(Modules.GESTION_ESTRATEGICA, Sections.BRANDING, 'edit');

// Si no puede ver, mostrar mensaje o redirigir
if (!canView) {
  return <PermissionDenied section="Branding" />;
}

// El botón de editar solo aparece si puede editar
{canEdit && <Button onClick={openModal}>Editar Branding</Button>}
```

**Archivos a modificar**:
- `frontend/src/features/gestion-estrategica/components/BrandingSection.tsx`

**Esfuerzo estimado**: 1-2 horas

---

#### [MEDIA] MB-003: Procesamiento de Imágenes con Pillow

**Problema**: Pillow está instalado pero no se usa para procesar logos.
**Impacto**:
- Logos muy grandes afectan performance
- No se generan automáticamente versiones para PWA (192x192, 512x512)
- No se validan dimensiones ni formato

**Solución**: Implementar procesamiento automático de imágenes.

```python
# backend/apps/gestion_estrategica/configuracion/services/image_processor.py
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile

class LogoProcessor:
    PWA_SIZES = [(192, 192), (512, 512)]

    @staticmethod
    def process_logo(uploaded_file, max_size=(400, 400)):
        """Redimensiona y optimiza logo."""
        img = Image.open(uploaded_file)

        # Convertir a RGB si es necesario
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')

        # Redimensionar manteniendo aspect ratio
        img.thumbnail(max_size, Image.Resampling.LANCZOS)

        # Guardar optimizado
        buffer = BytesIO()
        img.save(buffer, format='PNG', optimize=True)
        return ContentFile(buffer.getvalue())

    @staticmethod
    def generate_pwa_icons(logo_file):
        """Genera iconos PWA en tamaños estándar."""
        icons = {}
        img = Image.open(logo_file)

        for size in LogoProcessor.PWA_SIZES:
            resized = img.copy()
            resized.thumbnail(size, Image.Resampling.LANCZOS)

            # Crear canvas cuadrado con fondo transparente
            canvas = Image.new('RGBA', size, (255, 255, 255, 0))
            offset = ((size[0] - resized.width) // 2,
                     (size[1] - resized.height) // 2)
            canvas.paste(resized, offset)

            buffer = BytesIO()
            canvas.save(buffer, format='PNG')
            icons[f'{size[0]}x{size[1]}'] = ContentFile(buffer.getvalue())

        return icons
```

**Archivos a crear**:
- `backend/apps/gestion_estrategica/configuracion/services/image_processor.py`

**Archivos a modificar**:
- `backend/apps/gestion_estrategica/configuracion/serializers.py` (usar procesador)

**Esfuerzo estimado**: 4-6 horas

---

#### [MEDIA] MB-004: Campos Adicionales para PWA en BrandingConfig

**Problema**: El modelo BrandingConfig no tiene campos específicos para PWA.
**Impacto**: No se pueden configurar iconos PWA personalizados.

**Solución**: Agregar campos para iconos PWA.

```python
# backend/apps/gestion_estrategica/configuracion/models.py

class BrandingConfig(models.Model):
    # ... campos existentes ...

    # Nuevos campos para PWA
    logo_pwa_192 = models.ImageField(
        upload_to='branding/pwa/',
        blank=True,
        null=True,
        help_text='Icono PWA 192x192 px (se genera automáticamente si no se proporciona)'
    )
    logo_pwa_512 = models.ImageField(
        upload_to='branding/pwa/',
        blank=True,
        null=True,
        help_text='Icono PWA 512x512 px (se genera automáticamente si no se proporciona)'
    )
    pwa_background_color = models.CharField(
        max_length=7,
        default='#ffffff',
        help_text='Color de fondo para splash screen PWA'
    )
```

**Archivos a modificar**:
- `backend/apps/gestion_estrategica/configuracion/models.py`
- `frontend/src/features/gestion-estrategica/components/BrandingFormModal.tsx` (agregar campos UI)

**Esfuerzo estimado**: 3-4 horas

---

## 5. MÓDULOS Y FEATURES

### 5.1 Estado Actual

- **Frontend**:
  - `useModules.ts`: 502 líneas - hooks de React Query
  - `FeatureToggleCard.tsx`: 265 líneas - componente de toggle
  - `ModulosAndFeaturesSection.tsx`: UI de gestión
- **Backend**:
  - `models_system_modules.py`: 522 líneas
  - `viewsets_config.py`: 604 líneas
- **Arquitectura**: Sistema de 3 niveles jerárquico
  ```
  SystemModule → ModuleTab → TabSection
  (Módulo)       (Pestaña)   (Sección)
  ```

### 5.2 Hallazgos de Auditoría

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| TypeScript | ✅ Excelente | 100% tipado, interfaces completas |
| Design System | ✅ 95% | FeatureToggleCard con dual layout |
| React Query | ✅ Optimizado | Cache 5 min, invalidación en cascada |
| RBAC Frontend | ✅ Correcto | Filtrado por `CargoSectionAccess` |
| RBAC Backend | ✅ Integrado | Endpoints `/tree/` y `/sidebar/` filtrados |
| Dependencias | ✅ Robusto | `can_disable()` y `enable()` en cascada |
| Seeding | ❌ Manual | No hay comando automatizado |
| Mapping | ⚠️ Hardcoded | `SECTION_COMPONENTS` requiere registro manual |

### 5.3 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│ NIVEL 1: MÓDULO (SystemModule)                          │
│ ├─ code: "gestion_estrategica" (unique)                 │
│ ├─ category: ESTRATEGICO | MOTOR | INTEGRAL            │
│ ├─ is_enabled: true/false                               │
│ ├─ is_core: true/false (protegido)                     │
│ └─ dependencies: ManyToMany                             │
│                                                         │
│   NIVEL 2: TAB (ModuleTab)                              │
│   ├─ code: "configuracion", "organizacion"              │
│   ├─ is_enabled: true/false                             │
│   └─ module: FK → SystemModule                          │
│                                                         │
│     NIVEL 3: SECCIÓN (TabSection)                       │
│     ├─ code: "empresa", "sedes", "branding"             │
│     ├─ is_enabled: true/false                           │
│     ├─ supported_actions: ["view", "create", "edit"]    │
│     └─ tab: FK → ModuleTab                              │
└─────────────────────────────────────────────────────────┘
```

**Integración RBAC**:
```
Usuario → Cargo → CargoSectionAccess → TabSection
                  (permisos granulares)  (sección)
```

### 5.4 Flujo de Activación/Desactivación

```
1. Usuario click Switch en FeatureToggleCard
   ↓
2. toggleModule.mutate({ id, enabled })
   ↓
3. PATCH /api/core/system-modules/{id}/toggle/
   ↓
4. Backend verifica:
   ├─ Si desactivar: can_disable() valida dependencias
   └─ Si activar: enable() activa dependencias primero
   ↓
5. Response 200 OK
   ↓
6. invalidateQueries(['modules', 'tree', 'sidebar'])
   ↓
7. Sidebar y navegación se actualizan automáticamente
```

### 5.5 Cómo se Agregan Nuevos Módulos (Proceso Actual)

**Paso 1**: Crear registros en BD (Django Admin o migración)
```python
# Via Django Admin o shell
module = SystemModule.objects.create(
    code='nuevo_modulo',
    name='Nuevo Módulo',
    category='MOTOR',
    is_enabled=True
)
tab = ModuleTab.objects.create(
    module=module,
    code='configuracion',
    name='Configuración'
)
section = TabSection.objects.create(
    tab=tab,
    code='mi_seccion',
    name='Mi Sección',
    supported_actions=['view', 'create', 'edit', 'delete']
)
```

**Paso 2**: Registrar componente en frontend (MANUAL)
```typescript
// ConfiguracionTab.tsx línea 619
const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  empresa: EmpresaSection,
  sedes: SedesSection,
  branding: BrandingSection,
  modulos: ModulosAndFeaturesSection,
  mi_seccion: MiSeccionComponent,  // ← AGREGAR MANUALMENTE
};
```

**Paso 3**: Crear el componente
```typescript
// features/mi-modulo/components/MiSeccionComponent.tsx
export function MiSeccionComponent() {
  const { canDo } = usePermissions();
  const canView = canDo(Modules.MI_MODULO, Sections.MI_SECCION, 'view');
  // ...
}
```

### 5.6 Mejoras Identificadas

#### [ALTA] MM-001: Comando de Seeding Automatizado

**Problema**: Crear módulos, tabs y secciones es manual y propenso a errores.
**Impacto**:
- Inconsistencias entre dev/staging/prod
- Deploys requieren pasos manuales
- Onboarding lento de nuevos desarrolladores

**Solución**: Management command declarativo.

```python
# backend/apps/core/management/commands/seed_modules.py

MODULES_STRUCTURE = {
    'gestion_estrategica': {
        'name': 'Gestión Estratégica',
        'category': 'ESTRATEGICO',
        'is_core': True,
        'icon': 'strategy',
        'tabs': {
            'configuracion': {
                'name': 'Configuración',
                'order': 1,
                'sections': {
                    'empresa': {'name': 'Datos de Empresa', 'actions': ['view', 'edit']},
                    'sedes': {'name': 'Sedes', 'actions': ['view', 'create', 'edit', 'delete']},
                    'branding': {'name': 'Branding', 'actions': ['view', 'edit']},
                    'modulos': {'name': 'Módulos y Features', 'actions': ['view', 'edit']},
                }
            }
        }
    },
    # ... más módulos
}

class Command(BaseCommand):
    def handle(self, *args, **options):
        for module_code, module_data in MODULES_STRUCTURE.items():
            module, created = SystemModule.objects.update_or_create(
                code=module_code,
                defaults={
                    'name': module_data['name'],
                    'category': module_data['category'],
                    'is_core': module_data.get('is_core', False),
                }
            )
            # ... crear tabs y sections
```

**Uso**:
```bash
python manage.py seed_modules --verbosity=2
```

**Archivos a crear**:
- `backend/apps/core/management/commands/seed_modules.py`
- `backend/apps/core/fixtures/modules_structure.py` (estructura declarativa)

**Esfuerzo estimado**: 8-12 horas

---

#### [MEDIA] MM-002: Componente GenericSectionRenderer como Fallback

**Problema**: Si una sección no está en `SECTION_COMPONENTS`, no se renderiza nada.
```typescript
// ACTUAL - Falla silenciosamente
const Component = SECTION_COMPONENTS[section.code];
if (!Component) return null; // ← Sección desaparece sin aviso
```

**Impacto**: Nuevas secciones creadas en BD no aparecen hasta agregar código.

**Solución**: Componente fallback informativo.

```typescript
// components/common/GenericSectionRenderer.tsx
interface Props {
  section: TabSection;
}

export function GenericSectionRenderer({ section }: Props) {
  return (
    <Card className="p-6">
      <div className="text-center text-gray-500">
        <Icon name="construction" className="w-12 h-12 mx-auto mb-4" />
        <h3 className="font-medium">Sección: {section.name}</h3>
        <p className="text-sm mt-2">
          Esta sección está habilitada pero aún no tiene componente UI.
        </p>
        <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
          section_code: {section.code}
        </code>
      </div>
    </Card>
  );
}

// ConfiguracionTab.tsx - Uso
const Component = SECTION_COMPONENTS[section.code] || GenericSectionRenderer;
```

**Archivos a crear/modificar**:
- `frontend/src/components/common/GenericSectionRenderer.tsx` (crear)
- `frontend/src/features/gestion-estrategica/components/ConfiguracionTab.tsx` (modificar)

**Esfuerzo estimado**: 2-3 horas

---

#### [MEDIA] MM-003: Feedback Visual de Dependencias al Desactivar

**Problema**: Al desactivar un módulo, no se muestra qué módulos dependientes se afectarán.
**Impacto**: Usuario puede desactivar accidentalmente funcionalidad crítica.

**Solución**: Modal de confirmación con lista de impacto.

```typescript
// components/modals/DisableModuleConfirmModal.tsx
interface Props {
  module: SystemModule;
  dependents: SystemModule[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function DisableModuleConfirmModal({ module, dependents, onConfirm, onCancel }: Props) {
  return (
    <BaseModal isOpen onClose={onCancel} title="Confirmar Desactivación">
      <div className="space-y-4">
        <p>¿Desactivar el módulo <strong>{module.name}</strong>?</p>

        {dependents.length > 0 && (
          <Alert variant="warning">
            <p className="font-medium">Esto también desactivará:</p>
            <ul className="list-disc list-inside mt-2">
              {dependents.map(dep => (
                <li key={dep.id}>{dep.name}</li>
              ))}
            </ul>
          </Alert>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button variant="danger" onClick={onConfirm}>
            Desactivar {dependents.length > 0 ? `(${dependents.length + 1} módulos)` : ''}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
```

**Backend**: Agregar endpoint para obtener dependientes.
```python
# GET /api/core/system-modules/{id}/dependents/
@action(detail=True, methods=['get'])
def dependents(self, request, pk=None):
    module = self.get_object()
    dependents = SystemModule.objects.filter(dependencies=module, is_enabled=True)
    return Response(SystemModuleSerializer(dependents, many=True).data)
```

**Archivos a crear/modificar**:
- `frontend/src/components/modals/DisableModuleConfirmModal.tsx` (crear)
- `backend/apps/core/viewsets_config.py` (agregar action)
- `frontend/src/features/gestion-estrategica/hooks/useModules.ts` (query dependents)

**Esfuerzo estimado**: 4-6 horas

---

## 6. CATÁLOGOS BASE (Sin UI Frontend)

> **Nota**: Los siguientes catálogos existen en backend pero no tienen interfaz de administración
> en el frontend. Actualmente se gestionan vía Django Admin o comandos de seed.

### 4.1 Unidades de Medida

**Ubicación Backend**: `gestion_estrategica.configuracion.models_unidades.UnidadMedida`

**Consumido por**:
- `SedeEmpresa.unidad_capacidad` → Capacidad de almacenamiento
- Supply Chain (Almacenamiento, Compras) → Inventarios
- Production Ops → Lotes de producción
- HSEQ → Mediciones de higiene industrial

**Administración actual**:
```bash
python manage.py cargar_unidades_sistema
```

#### [MEDIA] MC-001: UI para Gestión de Unidades de Medida

**Problema**: Las unidades de medida solo se pueden administrar desde Django Admin.
**Impacto**: Usuarios no técnicos no pueden agregar unidades específicas de su industria.
**Solución**: Crear sección "Unidades de Medida" en Configuración.

```typescript
// Estructura propuesta
const SECTION_COMPONENTS = {
  empresa: EmpresaSection,
  sedes: SedesSection,
  integraciones: IntegracionesSection,
  branding: BrandingSection,
  modulos: ModulosAndFeaturesSection,
  unidades_medida: UnidadesMedidaSection, // NUEVO
};
```

**Funcionalidades requeridas**:
- CRUD de unidades de medida personalizadas
- Visualización de unidades del sistema (solo lectura)
- Filtro por categoría (MASA, VOLUMEN, LONGITUD, etc.)
- Conversiones entre unidades de la misma categoría

**Archivos a crear**:
- `frontend/src/features/gestion-estrategica/components/UnidadesMedidaSection.tsx`
- `frontend/src/features/gestion-estrategica/components/modals/UnidadMedidaFormModal.tsx`
- `frontend/src/features/gestion-estrategica/hooks/useUnidadesMedida.ts`

**Esfuerzo estimado**: 12-16 horas

---

### 4.2 Consecutivos (Sistema de Numeración)

**Ubicación Backend**: `gestion_estrategica.organizacion` (tabla: `organizacion_consecutivo_config`)

**Consumido por** (15+ modelos):
- `SolicitudCompra` → REQ-2026-00001
- `OrdenCompra` → OC-2026-00001
- `MovimientoInventario` → MOV-00001
- `PQRS` → PQR-2026-00001
- `OrdenTrabajo` → OT-00001
- `LoteProduccion` → LOT-00001
- Y muchos más...

**Administración actual**: Solo Django Admin

#### [MEDIA] MC-002: UI para Gestión de Consecutivos

**Problema**: Los consecutivos solo se pueden configurar desde Django Admin.
**Impacto**: Usuarios no pueden personalizar formatos de numeración.
**Solución**: Crear sección "Consecutivos" en Organización (donde ya está el modelo).

```typescript
// frontend/src/features/gestion-estrategica/components/OrganizacionTab.tsx
const SECTION_COMPONENTS = {
  areas: AreasTab,
  cargos: CargosTab,
  organigrama: OrganigramaView,
  colaboradores: ColaboradoresSection,
  consecutivos: ConsecutivosSection, // NUEVO
};
```

**Funcionalidades requeridas**:
- Listado de tipos de documento con su consecutivo actual
- Configuración de formato (prefijo, sufijo, padding, separador)
- Opciones de reinicio (anual, mensual)
- Vista previa del formato resultante
- Historial de cambios de consecutivo

**Archivos a crear**:
- `frontend/src/features/gestion-estrategica/components/ConsecutivosSection.tsx`
- `frontend/src/features/gestion-estrategica/components/modals/ConsecutivoFormModal.tsx`
- `frontend/src/features/gestion-estrategica/hooks/useConsecutivos.ts`
- Backend: ViewSet y Serializer para ConsecutivoConfig

**Esfuerzo estimado**: 16-20 horas

---

## 5. MEJORAS TRANSVERSALES (UI/UX)

### [COMPLETADO] MT-001: Header Tabs - Sección Activa Siempre Visible
- **Estado**: ✅ Implementado
- **Archivo**: `frontend/src/components/common/HeaderTabs.tsx`

### [COMPLETADO] MT-002: PageHeader con Título y Descripción
- **Estado**: ✅ Implementado
- **Archivo**: `frontend/src/features/gestion-estrategica/pages/ConfiguracionPage.tsx`

### [COMPLETADO] MT-003: Truncado de Nombre de Empresa en Header
- **Estado**: ✅ Implementado
- **Archivo**: `frontend/src/layouts/Header.tsx`

### [COMPLETADO] MT-004: Reset Header en Páginas de Perfil
- **Estado**: ✅ Implementado
- **Archivos**: `PerfilPage.tsx`, `SeguridadPage.tsx`, `PreferenciasPage.tsx`

---

## 5. PRIORIZACIÓN RECOMENDADA

### Sprint Actual (Alta Prioridad)

| ID | Mejora | Esfuerzo | Impacto |
|----|--------|----------|---------|
| MS-001 | Tamaño modal Sedes | 1-2h | Alto |
| ME-001 | Validación NIT frontend | 2-3h | Alto |
| MI-002 | ENCRYPTION_KEY producción | 1-2h | Alto (Seguridad) |
| MI-001 | Test conexión real | 6-8h | Alto |
| MB-002 | Validación permiso `view` Branding | 1-2h | Alto (Seguridad) |
| MM-001 | Comando seed_modules automatizado | 8-12h | Alto (DevEx) |

### Próximo Sprint (Media Prioridad)

| ID | Mejora | Esfuerzo | Impacto |
|----|--------|----------|---------|
| MS-002 | Indicadores scroll modal | 2-3h | Medio |
| MS-003 | Responsive mobile modal | 2h | Medio |
| ME-002 | Autocompletado ciudad | 3-4h | Medio |
| ME-003 | Preview logo | 2h | Medio |
| MI-003 | Tests integraciones | 8-12h | Medio |
| MB-003 | Procesamiento imágenes Pillow | 4-6h | Medio |
| MB-004 | Campos PWA en BrandingConfig | 3-4h | Medio |
| MM-002 | GenericSectionRenderer fallback | 2-3h | Medio |
| MM-003 | Feedback dependencias al desactivar | 4-6h | Medio |

### Sprint Futuro (PWA Dinámico)

| ID | Mejora | Esfuerzo | Impacto |
|----|--------|----------|---------|
| MB-001 | Manifest.json dinámico PWA | 8-12h | Alto (Personalización) |

### Backlog (Baja Prioridad)

| ID | Mejora | Esfuerzo | Impacto |
|----|--------|----------|---------|
| MS-004 | Mapa interactivo GPS | 8-12h | Bajo |
| MI-004 | Dashboard monitoreo | 4-6h | Bajo |
| MC-001 | UI Unidades de Medida | 12-16h | Medio |
| MC-002 | UI Consecutivos | 16-20h | Medio |

---

## 6. MÉTRICAS DE ÉXITO

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Task Completion Rate (formularios) | ~90% | >95% |
| Errores de validación NIT | N/A | <1% |
| Tiempo promedio crear sede | N/A | <2 min |
| Satisfacción UX modales | N/A | >4.5/5 |

---

## ANEXO: Código de Referencia

### A1. Sistema de Tamaños de Modal Recomendado

```typescript
// frontend/src/components/modals/BaseModal.tsx

export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

const sizeClasses: Record<ModalSize, string> = {
  xs: 'max-w-[360px]',   // Confirmaciones
  sm: 'max-w-[480px]',   // Formularios simples
  md: 'max-w-[600px]',   // Formularios estándar (DEFAULT)
  lg: 'max-w-[800px]',   // Formularios complejos (Sedes)
  xl: 'max-w-[960px]',   // Tablas embebidas
  '2xl': 'max-w-[1120px]', // Dashboards
  full: 'max-w-[95vw]'   // Editores especiales
};

// Uso recomendado por tipo de contenido:
// - Confirmación eliminación: xs
// - Crear categoría/tag: sm
// - Editar usuario: md
// - Crear/editar Sede: lg
// - Selección múltiple con tabla: xl
```

### A2. Hook de Scroll Lock Mejorado

```typescript
// frontend/src/hooks/useModalScrollLock.ts

export function useModalScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const scrollY = window.scrollY;
    const body = document.body;

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.paddingRight = `${scrollbarWidth}px`; // Previene layout shift

    return () => {
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.paddingRight = '';
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);
}
```

---

*Documento actualizado: 2026-01-18*
*Estado: ✅ FASE 1 CONFIGURACIÓN - AUDITORÍA COMPLETA*
