# Sistema de Iconos Dinamicos - StrateKaz ERP

Fecha: 2026-01-07
Estado: Completado
Version: 1.0

## Resumen Ejecutivo

El sistema de iconos dinamicos elimina completamente el hardcoding de iconos en el frontend, permitiendo que todos los iconos del sistema se gestionen desde la base de datos. Esta arquitectura proporciona flexibilidad total para agregar, modificar y categorizar iconos sin tocar codigo.

## Principio Fundamental

Los iconos son DATOS, no CODIGO. Cualquier componente que necesite mostrar un icono debe:
1. Recibir el nombre del icono como string desde la API
2. Usar el componente DynamicIcon para renderizarlo
3. Usar IconPicker para permitir seleccion de iconos

## Arquitectura del Sistema

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                    BASE DE DATOS                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ IconRegistry (Modelo Django)                             │   │
│  │ - id, name, label, category                              │   │
│  │ - description, keywords                                  │   │
│  │ - orden, es_sistema                                      │   │
│  │                                                          │   │
│  │ Categorias:                                              │   │
│  │ - VALORES: 18 iconos (Heart, Shield, Star...)           │   │
│  │ - NORMAS: 6 iconos (Award, FileCheck, Car...)           │   │
│  │ - ESTADOS: 6 iconos (CircleDot, CheckCircle2...)        │   │
│  │ - RIESGOS: 5 iconos (AlertTriangle, ShieldAlert...)     │   │
│  │ - PERSONAS: 5 iconos (User, Users, UserCheck...)        │   │
│  │ - DOCUMENTOS: 6 iconos (File, FileText, Folder...)      │   │
│  │ - GENERAL: 10 iconos (Settings, Search, Plus...)        │   │
│  │                                                          │   │
│  │ TOTAL: 56 iconos del sistema precargados                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND API (Django REST)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ IconRegistryViewSet                                      │   │
│  │                                                          │   │
│  │ Endpoints:                                               │   │
│  │ - GET /api/configuracion/icons/                          │   │
│  │   Lista todos los iconos activos                         │   │
│  │                                                          │   │
│  │ - GET /api/configuracion/icons/categories/               │   │
│  │   Lista categorias con conteo                            │   │
│  │   Response: [{code, name, icon_count}, ...]              │   │
│  │                                                          │   │
│  │ - GET /api/configuracion/icons/by_category/              │   │
│  │   ?category=VALORES                                      │   │
│  │   Filtra iconos por categoria                            │   │
│  │                                                          │   │
│  │ - GET /api/configuracion/icons/search/                   │   │
│  │   ?q=corazon                                             │   │
│  │   Busca en name, label, keywords                         │   │
│  │                                                          │   │
│  │ - POST /api/configuracion/icons/load_system_icons/       │   │
│  │   Carga/actualiza iconos del sistema (admin only)        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + TypeScript)                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Hook: useIcons                                           │   │
│  │ - Consume API con React Query                            │   │
│  │ - Cache de 5-10 minutos                                  │   │
│  │ - Filtrado y busqueda en cliente                         │   │
│  │                                                          │   │
│  │ Funciones:                                               │   │
│  │ - getIconsByCategory(cat)                                │   │
│  │ - searchIcons(query)                                     │   │
│  │ - getIconByName(name)                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Componente: DynamicIcon                                  │   │
│  │ - Recibe: name (string)                                  │   │
│  │ - Renderiza: Componente Lucide correspondiente           │   │
│  │ - Fallback: Icono Circle si no existe                    │   │
│  │ - Memoizado para performance                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Componente: IconPicker                                   │   │
│  │ - Grid responsive con preview                            │   │
│  │ - Busqueda en tiempo real                                │   │
│  │ - Filtro por categoria                                   │   │
│  │ - Vista previa del icono seleccionado                    │   │
│  │ - Dark mode completo                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Componentes del Sistema

### 1. Backend - Modelo IconRegistry

Archivo: `backend/apps/gestion_estrategica/configuracion/models.py`

```python
class IconRegistry(TimestampedModel, SoftDeleteModel):
    """
    Registro de Iconos Disponibles - 100% dinamico.

    Define los iconos de Lucide disponibles en el sistema,
    categorizados para facilitar la seleccion en formularios.
    """
    name = models.CharField(max_length=50)           # Nombre exacto en Lucide: "Heart"
    label = models.CharField(max_length=100)         # Nombre amigable: "Corazon"
    category = models.CharField(max_length=30)       # Categoria: "VALORES"
    description = models.CharField(max_length=200)   # Descripcion de uso
    keywords = models.CharField(max_length=200)      # "amor,pasion,compromiso"
    orden = models.PositiveIntegerField(default=0)   # Orden en el selector
    es_sistema = models.BooleanField(default=False)  # No eliminable

    class Meta:
        db_table = 'configuracion_icon_registry'
        ordering = ['category', 'orden', 'label']
        constraints = [
            UniqueConstraint(fields=['name', 'category'], name='unique_icon_per_category')
        ]
```

### Categorias Disponibles

| Codigo | Nombre | Iconos | Uso |
|--------|--------|--------|-----|
| VALORES | Valores Corporativos | 18 | Mision, vision, valores empresariales |
| NORMAS | Normas y Sistemas | 6 | ISO, certificaciones, sistemas de gestion |
| ESTADOS | Estados y Status | 6 | Estados de procesos, workflows |
| RIESGOS | Riesgos y Alertas | 5 | Peligros, riesgos, emergencias |
| PERSONAS | Personas y Equipos | 5 | Usuarios, equipos, colaboradores |
| DOCUMENTOS | Documentos | 6 | Archivos, carpetas, documentacion |
| GENERAL | Uso General | 10 | Acciones comunes, botones, navegacion |

### Metodos del Modelo

```python
# Cargar iconos del sistema (56 iconos precargados)
IconRegistry.cargar_iconos_sistema()

# Obtener iconos por categoria
iconos_valores = IconRegistry.obtener_por_categoria('VALORES')

# Buscar iconos
resultados = IconRegistry.buscar('corazon')
```

### 2. Backend - API Endpoints

Archivo: `backend/apps/gestion_estrategica/configuracion/views.py`

```python
class IconRegistryViewSet(viewsets.ModelViewSet):
    queryset = IconRegistry.objects.filter(is_active=True, deleted_at__isnull=True)
    serializer_class = IconRegistrySerializer
    permission_classes = [IsAuthenticated]
```

#### Endpoints Disponibles

##### Lista de Iconos

```http
GET /api/configuracion/icons/
```

Response:
```json
[
  {
    "id": 1,
    "name": "Heart",
    "label": "Corazon",
    "category": "VALORES",
    "category_display": "Valores Corporativos",
    "description": null,
    "keywords": "amor,pasion,compromiso",
    "orden": 1,
    "es_sistema": true,
    "is_active": true
  }
]
```

##### Categorias con Conteo

```http
GET /api/configuracion/icons/categories/
```

Response:
```json
[
  {
    "code": "VALORES",
    "name": "Valores Corporativos",
    "icon_count": 18
  },
  {
    "code": "NORMAS",
    "name": "Normas y Sistemas",
    "icon_count": 6
  }
]
```

##### Filtrar por Categoria

```http
GET /api/configuracion/icons/by_category/?category=VALORES
```

Response: Array de iconos de la categoria especificada

##### Buscar Iconos

```http
GET /api/configuracion/icons/search/?q=corazon
```

Busca en:
- name (nombre del icono)
- label (etiqueta amigable)
- keywords (palabras clave)

##### Cargar Iconos del Sistema

```http
POST /api/configuracion/icons/load_system_icons/
```

Solo para administradores. Carga/actualiza los 56 iconos base del sistema.

Response:
```json
{
  "message": "Iconos del sistema cargados exitosamente.",
  "icons_created": 56,
  "total_icons": 56
}
```

### 3. Frontend - Hook useIcons

Archivo: `frontend/src/hooks/useIcons.ts`

```typescript
import { useQuery } from '@tanstack/react-query';

interface IconRegistryItem {
  id: number;
  name: string;
  label: string;
  category: string;
  category_display?: string;
  description?: string;
  keywords?: string;
  orden?: number;
  es_sistema?: boolean;
  is_active?: boolean;
}

export function useIcons(options?: UseIconsOptions): UseIconsReturn {
  const { data: icons = [], isLoading } = useQuery({
    queryKey: ['icons', category],
    queryFn: () => fetchIcons(category),
    staleTime: 5 * 60 * 1000,  // 5 minutos
    gcTime: 30 * 60 * 1000,     // 30 minutos en cache
  });

  return {
    icons,
    categories,
    isLoading,
    getIconsByCategory,
    searchIcons,
    getIconByName,
    refetch,
  };
}
```

#### Uso del Hook

```typescript
// Obtener todos los iconos
const { icons, categories, isLoading } = useIcons();

// Filtrar por categoria
const valoresIcons = getIconsByCategory('VALORES');

// Buscar iconos
const results = searchIcons('corazon');

// Obtener icono especifico
const heartIcon = getIconByName('Heart');
```

#### Hooks Especializados

```typescript
// Hook para una categoria especifica
const { icons, isLoading } = useIconsByCategory('VALORES');

// Hook para busqueda con debounce
const { results, isLoading } = useIconSearch(query, 300);
```

### 4. Frontend - Componente DynamicIcon

Archivo: `frontend/src/components/common/DynamicIcon.tsx`

Renderiza iconos de Lucide dinamicamente por nombre string.

```typescript
interface DynamicIconProps {
  name: string | null | undefined;
  size?: number;
  className?: string;
  strokeWidth?: number;
  fallback?: React.ReactNode;
  color?: string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({
  name,
  size = 20,
  className,
  strokeWidth = 2,
  fallback,
  color,
}) => {
  // Renderiza el icono correspondiente de Lucide
  // Fallback a Circle si no existe
};
```

#### Uso del Componente

```typescript
// Basico
<DynamicIcon name="Heart" />

// Con tamano y estilo
<DynamicIcon
  name="Shield"
  size={24}
  className="text-purple-600"
/>

// Con fallback personalizado
<DynamicIcon
  name={valor.icono_nombre}
  fallback={<span>?</span>}
/>
```

#### Funciones Utilitarias

```typescript
// Verificar si un icono existe
isValidIconName('Heart')  // true

// Obtener lista de iconos disponibles
const allIcons = getAvailableIconNames()  // ['Heart', 'Shield', ...]

// Obtener componente de icono
const IconComponent = getIconComponent('Heart')
```

### 5. Frontend - Componente IconPicker

Archivo: `frontend/src/components/common/IconPicker.tsx`

Selector visual de iconos con busqueda y filtros.

```typescript
interface IconPickerProps {
  value?: string | null;
  onChange: (iconName: string) => void;
  category?: string;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
  columns?: number;
  iconSize?: number;
}

export function IconPicker({
  value,
  onChange,
  category,
  label,
  error,
  ...props
}: IconPickerProps) {
  // Renderiza grid de iconos con busqueda
}
```

#### Uso del Componente

```typescript
// Selector basico
<IconPicker
  value={selectedIcon}
  onChange={setSelectedIcon}
/>

// Filtrado por categoria
<IconPicker
  value={valor.icono_nombre}
  onChange={(name) => setValue('icono_nombre', name)}
  category="VALORES"
  label="Icono del Valor"
/>

// Con validacion
<IconPicker
  value={form.icon}
  onChange={(name) => form.setValue('icon', name)}
  error={form.errors.icon?.message}
  helperText="Selecciona un icono representativo"
/>

// Grid personalizado
<IconPicker
  value={icon}
  onChange={setIcon}
  columns={8}
  iconSize={24}
/>
```

#### Caracteristicas del IconPicker

- Grid responsive (default 5 columnas)
- Busqueda en tiempo real
- Filtro por categoria
- Agrupacion visual por categoria
- Preview del icono seleccionado
- Estados vacios elegantes
- Dark mode completo
- Accesibilidad (labels, ARIA)

## Ejemplo de Uso Completo: Valores Corporativos

### Antes (Hardcoded)

```typescript
// PROHIBIDO - Iconos hardcodeados
import { Heart, Shield, Star, Users, Zap, Target, Award } from 'lucide-react';

const ICONOS_DISPONIBLES = [
  { value: 'heart', label: 'Corazon', Icon: Heart },
  { value: 'shield', label: 'Escudo', Icon: Shield },
  { value: 'star', label: 'Estrella', Icon: Star },
  // ... hardcoding de todos los iconos
];

// Selector manual
<select>
  {ICONOS_DISPONIBLES.map(icon => (
    <option value={icon.value}>{icon.label}</option>
  ))}
</select>

// Renderizado manual
{valor.icono === 'heart' && <Heart className="w-6 h-6" />}
{valor.icono === 'shield' && <Shield className="w-6 h-6" />}
```

### Despues (Sistema Dinamico)

```typescript
// CORRECTO - Sistema 100% dinamico
import { DynamicIcon, IconPicker } from '@/components/common';
import { useIcons } from '@/hooks/useIcons';

function ValorCorporativoForm() {
  const { register, setValue, watch } = useForm();
  const iconoSeleccionado = watch('icono_nombre');

  return (
    <form>
      <Input
        label="Nombre del Valor"
        {...register('nombre')}
      />

      {/* Selector de icono desde BD */}
      <IconPicker
        label="Icono Representativo"
        value={iconoSeleccionado}
        onChange={(name) => setValue('icono_nombre', name)}
        category="VALORES"
      />

      <Button type="submit">Guardar</Button>
    </form>
  );
}

function ValorCard({ valor }: { valor: ValorCorporativo }) {
  return (
    <Card>
      {/* Renderizado dinamico desde BD */}
      <DynamicIcon
        name={valor.icono_nombre}
        size={32}
        className="text-purple-600"
      />
      <h3>{valor.nombre}</h3>
      <p>{valor.descripcion}</p>
    </Card>
  );
}
```

## Refactorizacion Realizada

### Modulo: Valores Corporativos

Archivo: `frontend/src/features/gestion-estrategica/components/ValoresDragDrop.tsx`

#### Antes

```typescript
// 15+ imports de iconos hardcodeados
import {
  Heart,
  Shield,
  Star,
  Users,
  Zap,
  Target,
  Award,
  Lightbulb,
  HeartHandshake,
  Scale,
  Leaf,
  Globe,
  Clock,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';

// Mapeo manual
const ICON_MAP: Record<string, LucideIcon> = {
  Heart,
  Shield,
  Star,
  // ... 15 mapeos manuales
};

// Selector hardcodeado
<Select>
  <option value="Heart">Corazon</option>
  <option value="Shield">Escudo</option>
  {/* ... opciones hardcodeadas */}
</Select>

// Renderizado condicional
{ICON_MAP[valor.icono] &&
  React.createElement(ICON_MAP[valor.icono], { className: 'w-8 h-8' })
}
```

#### Despues

```typescript
// Solo 2 imports necesarios
import { DynamicIcon, IconPicker } from '@/components/common';

// Selector dinamico desde BD
<IconPicker
  value={valor.icono_nombre}
  onChange={(name) => updateValor(valor.id, { icono_nombre: name })}
  category="VALORES"
  columns={5}
/>

// Renderizado dinamico
<DynamicIcon
  name={valor.icono_nombre}
  className="w-8 h-8 text-purple-600"
/>
```

#### Resultados

- Eliminados: 15+ imports de iconos
- Eliminado: Objeto ICON_MAP con mapeo manual
- Eliminado: Selector hardcodeado de iconos
- Agregado: IconPicker conectado a la BD
- Agregado: DynamicIcon para renderizado
- Beneficio: Ahora los usuarios pueden agregar nuevos iconos sin codigo

## Migracion de Componentes Existentes

### Checklist de Migracion

Para migrar un componente que usa iconos hardcodeados:

1. Identificar imports de iconos Lucide
2. Reemplazar con DynamicIcon
3. Actualizar modelo del backend para almacenar icon_name
4. Agregar campo en API/serializer
5. Reemplazar selectores manuales con IconPicker
6. Probar renderizado dinamico
7. Eliminar imports y mapeos manuales

### Patron de Migracion

```typescript
// ANTES: Hardcoded
import { Heart, Shield } from 'lucide-react';

const iconMap = { heart: Heart, shield: Shield };

<select value={item.icon} onChange={handleChange}>
  <option value="heart">Corazon</option>
  <option value="shield">Escudo</option>
</select>

{iconMap[item.icon] && createElement(iconMap[item.icon], props)}

// DESPUES: Dinamico
import { DynamicIcon, IconPicker } from '@/components/common';

<IconPicker
  value={item.icon_name}
  onChange={(name) => updateItem({ icon_name: name })}
  category="VALORES"
/>

<DynamicIcon name={item.icon_name} {...props} />
```

### Modelos que Deben Usar Iconos Dinamicos

Cualquier modelo que almacene iconos debe usar el campo icon_name:

```python
class MiModelo(models.Model):
    # CORRECTO - Campo dinamico
    icon_name = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Icono',
        help_text='Nombre del icono de Lucide'
    )

    # PROHIBIDO - Enum o choices hardcodeados
    # icon = models.CharField(
    #     choices=[('heart', 'Corazon'), ('shield', 'Escudo')]
    # )
```

## Performance y Optimizacion

### Caching en el Frontend

```typescript
// React Query cache configuration
useQuery({
  queryKey: ['icons', category],
  queryFn: fetchIcons,
  staleTime: 5 * 60 * 1000,   // 5 minutos - datos frescos
  gcTime: 30 * 60 * 1000,      // 30 minutos - garbage collection
});
```

Estrategia:
- Primera carga: Request HTTP
- Siguientes 5 minutos: Datos en cache
- Hasta 30 minutos: Datos disponibles sin revalidar
- Despues de 30 minutos: Garbage collection

### Memoizacion de Iconos

```typescript
// DynamicIcon esta memoizado
export const DynamicIcon = memo(function DynamicIcon(props) {
  const IconComponent = useMemo(() => {
    if (!name) return null;
    return iconMap[name] || null;
  }, [name]);

  // Solo re-renderiza si cambia el nombre
});
```

### Lazy Loading

Los iconos de Lucide ya estan tree-shakeados por Vite. Solo se incluyen en el bundle los iconos que realmente se usan.

## Testing

### Backend Tests

```python
# tests/test_icon_registry.py

def test_cargar_iconos_sistema():
    count = IconRegistry.cargar_iconos_sistema()
    assert count == 56

def test_buscar_iconos():
    IconRegistry.cargar_iconos_sistema()
    results = IconRegistry.buscar('corazon')
    assert results.count() > 0
    assert 'Heart' in [icon.name for icon in results]

def test_obtener_por_categoria():
    IconRegistry.cargar_iconos_sistema()
    valores = IconRegistry.obtener_por_categoria('VALORES')
    assert valores.count() == 18
```

### Frontend Tests

```typescript
// __tests__/DynamicIcon.test.tsx

test('renders icon by name', () => {
  render(<DynamicIcon name="Heart" />);
  expect(screen.getByRole('img')).toBeInTheDocument();
});

test('shows fallback for invalid icon', () => {
  render(<DynamicIcon name="InvalidIcon" fallback={<span>?</span>} />);
  expect(screen.getByText('?')).toBeInTheDocument();
});
```

## Documentos Relacionados

- [ARQUITECTURA-DINAMICA.md](./ARQUITECTURA-DINAMICA.md) - Principios del sistema dinamico
- [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) - Design System completo
- [COMPONENTES-DESIGN-SYSTEM.md](./COMPONENTES-DESIGN-SYSTEM.md) - Catalogo de componentes
- [GUIA-ACTUALIZACION-DOCS.md](../GUIA-ACTUALIZACION-DOCS.md) - Como actualizar documentacion

## Roadmap

### Completado

- Modelo IconRegistry en backend
- API REST completa con 5 endpoints
- Hook useIcons con React Query
- Componente DynamicIcon memoizado
- Componente IconPicker con busqueda
- 56 iconos del sistema precargados
- 7 categorias definidas
- Refactorizacion de ValoresDragDrop

### Pendiente

- [ ] Agregar mas categorias segun necesidad
- [ ] Interfaz admin para gestionar iconos
- [ ] Exportacion/importacion de iconos
- [ ] Sincronizacion automatica con actualizaciones de Lucide
- [ ] Sugerencias inteligentes de iconos (IA)
- [ ] Preview 3D de iconos en el picker
- [ ] Animaciones para iconos

## Contacto y Soporte

Para preguntas sobre el sistema de iconos dinamicos:
- Ver documentacion de Lucide: https://lucide.dev
- Revisar codigo de ejemplo en ValoresDragDrop.tsx
- Consultar el Design System del proyecto

Ultima actualizacion: 2026-01-07
