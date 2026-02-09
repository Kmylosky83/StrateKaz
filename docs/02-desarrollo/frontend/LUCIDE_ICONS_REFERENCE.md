# Referencia de Iconos Lucide React para HSEQ

## 🎨 Iconos Utilizados en HSEQ Management

| Módulo/Tab | Icono Actual | Alternativas Sugeridas |
|------------|--------------|------------------------|
| **HSEQ Management** | `ShieldCheck` | `Shield`, `ShieldAlert`, `Activity` |
| Sistema Documental | `FolderTree` | `FileText`, `Folders`, `Archive` |
| Planificación | `Calendar` | `CalendarCheck`, `Target`, `TrendingUp` |
| Calidad | `Award` | `Star`, `Medal`, `CheckCircle2` |
| Medicina Laboral | `Stethoscope` | `Heart`, `Cross`, `Pill` |
| Seguridad Industrial | `HardHat` | `Shield`, `AlertTriangle`, `Construction` |
| Higiene Industrial | `Droplet` | `Wind`, `Beaker`, `TestTube2` |
| Comités HSEQ | `Users` | `UsersRound`, `Users2`, `MessageSquare` |
| Accidentalidad | `AlertTriangle` | `AlertOctagon`, `AlertCircle`, `XCircle` |
| Emergencias | `Siren` | `Ambulance`, `Phone`, `Bell` |
| Gestión Ambiental | `Leaf` | `Trees`, `Recycle`, `Sprout` |
| Mejora Continua | `TrendingUp` | `RefreshCw`, `ArrowUpCircle`, `BarChart3` |

## 📚 Iconos por Categoría

### Seguridad y Protección
```typescript
ShieldCheck, Shield, ShieldAlert, ShieldX, ShieldQuestion,
HardHat, Lock, LockKeyhole, Key, Eye, EyeOff
```

### Alertas y Emergencias
```typescript
AlertTriangle, AlertCircle, AlertOctagon, Siren, Ambulance,
Bell, BellRing, Phone, PhoneCall, Radio
```

### Salud y Medicina
```typescript
Stethoscope, Heart, HeartPulse, Pill, Cross, Activity,
Syringe, Thermometer, Bandaid
```

### Documentos y Archivos
```typescript
FileText, File, Files, Folder, FolderTree, Folders,
Archive, Inbox, FileSearch, FilePlus, FileCheck
```

### Calendario y Planificación
```typescript
Calendar, CalendarCheck, CalendarClock, CalendarDays,
Clock, Timer, Hourglass, Target, Milestone
```

### Calidad y Certificación
```typescript
Award, Medal, Star, Badge, CheckCircle, CheckCircle2,
Verified, BadgeCheck, Stamp
```

### Medio Ambiente
```typescript
Leaf, Trees, Sprout, Recycle, Wind, Droplet, Droplets,
Cloud, CloudRain, Sun, Globe
```

### Usuarios y Equipos
```typescript
Users, UsersRound, Users2, User, UserCheck, UserPlus,
MessageSquare, MessageCircle, Users, Group
```

### Análisis y Métricas
```typescript
TrendingUp, TrendingDown, BarChart, BarChart3, PieChart,
LineChart, Activity, Gauge, Percent
```

### Procesos y Flujos
```typescript
RefreshCw, RotateCw, ArrowUpCircle, ArrowDownCircle,
GitBranch, Workflow, Repeat, Shuffle
```

### Herramientas y Operaciones
```typescript
Wrench, Hammer, Tool, Settings, Sliders, Cog,
Construction, Factory, Building, Building2
```

### Inspección y Verificación
```typescript
Eye, EyeOff, Search, SearchCheck, Scan, ScanLine,
CheckSquare, ClipboardCheck, ListChecks
```

## 🔧 Cómo Cambiar un Icono

### Método 1: Management Command
```bash
python manage.py update_hseq_icon <tab_code> <nuevo_icono>

# Ejemplos:
python manage.py update_hseq_icon emergencias Ambulance
python manage.py update_hseq_icon calidad Star
python manage.py update_hseq_icon medicina_laboral Heart
```

### Método 2: Directamente en Base de Datos
```sql
UPDATE core_module_tab
SET icon = 'NuevoIcono'
WHERE code = 'codigo_tab'
AND module_id = (SELECT id FROM core_system_module WHERE code = 'hseq_management');
```

### Método 3: Django Shell
```python
python manage.py shell

from apps.core.models import ModuleTab

tab = ModuleTab.objects.get(code='emergencias', module__code='hseq_management')
tab.icon = 'Ambulance'
tab.save()
```

## ✅ Verificar Iconos Disponibles

### Online
Visita: https://lucide.dev/icons/

### En el Proyecto
```bash
cd frontend
cat node_modules/lucide-react/dynamicIconImports.js | grep '"[a-z-]*":' | wc -l
# Output: ~1400+ iconos disponibles
```

### Buscar Icono Específico
```bash
cat node_modules/lucide-react/dynamicIconImports.js | grep -i "término_buscar"

# Ejemplos:
cat node_modules/lucide-react/dynamicIconImports.js | grep -i "shield"
cat node_modules/lucide-react/dynamicIconImports.js | grep -i "heart"
cat node_modules/lucide-react/dynamicIconImports.js | grep -i "alert"
```

## 🎨 Mejores Prácticas

### 1. Consistencia Visual
- Usar iconos de la misma familia (solid/outline)
- Mantener un estilo visual coherente
- Evitar mezclar iconos muy detallados con muy simples

### 2. Significado Claro
- El icono debe ser intuitivo
- Debe reflejar la función del módulo
- Considerar contexto cultural y profesional

### 3. Convenciones de Naming
- **Lucide React**: PascalCase (`AlertTriangle`, `ShieldCheck`)
- **Base de datos**: Mismo formato que Lucide (`AlertTriangle`)
- **No usar**: snake_case, kebab-case

### 4. Testing Visual
Antes de confirmar un cambio:
1. Verificar en https://lucide.dev/icons/
2. Ver preview del icono
3. Confirmar que existe en la versión instalada
4. Probar en diferentes tamaños

## 🔍 Ejemplos de Iconos Temáticos

### Para SST (Seguridad y Salud en el Trabajo)
```typescript
// General SST
ShieldCheck, Shield, HardHat, AlertTriangle

// Medicina ocupacional
Stethoscope, Heart, Activity, Cross

// EPP (Equipos de Protección Personal)
HardHat, Glasses, Shirt, Boot

// Riesgos
AlertTriangle, AlertCircle, Flame, Zap

// Inspecciones
Eye, Search, ClipboardCheck, ListChecks
```

### Para Calidad (ISO 9001)
```typescript
// Certificación
Award, Medal, Badge, Star, Verified

// Procesos
GitBranch, Workflow, RefreshCw, ArrowUpCircle

// Auditorías
Search, Eye, ClipboardCheck, FileSearch

// Mejora continua
TrendingUp, RefreshCw, Target, BarChart3
```

### Para Medio Ambiente (ISO 14001)
```typescript
// Naturaleza
Leaf, Trees, Sprout, Globe

// Recursos
Droplet, Wind, Sun, Cloud

// Reciclaje
Recycle, RotateCw, RefreshCw

// Impactos
AlertTriangle, TrendingDown, Wind
```

### Para Emergencias
```typescript
// Alertas
Siren, Bell, BellRing, AlertOctagon

// Respuesta
Ambulance, Phone, PhoneCall, Radio

// Evacuación
DoorOpen, ArrowRight, Navigation

// Primeros auxilios
Cross, Heart, Activity, Pill
```

## 🚀 Quick Reference Commands

```bash
# Listar todos los tabs HSEQ
python manage.py shell -c "
from apps.core.models import ModuleTab
tabs = ModuleTab.objects.filter(module__code='hseq_management')
for t in tabs:
    print(f'{t.code:25s} {t.icon:20s} {t.name}')
"

# Cambiar icono
python manage.py update_hseq_icon emergencias Ambulance

# Verificar cambio
python manage.py verify_hseq_modules

# Ver estructura en API
curl http://localhost:8000/api/core/system-modules/sidebar/ | jq '.[] | select(.code == "hseq_management")'
```

## 📖 Referencias

- **Lucide Icons**: https://lucide.dev/icons/
- **Lucide React Docs**: https://lucide.dev/guide/packages/lucide-react
- **Icon Search**: https://lucide.dev/icons (con buscador)
- **GitHub**: https://github.com/lucide-icons/lucide
- **NPM Package**: https://www.npmjs.com/package/lucide-react

## 🎯 Recomendaciones Finales

1. **Antes de cambiar**: Verificar que el icono existe en Lucide
2. **Naming exacto**: Respetar PascalCase (`AlertTriangle`, no `alert-triangle`)
3. **Preview**: Siempre ver el icono en https://lucide.dev antes de usarlo
4. **Consistencia**: Mantener coherencia visual en todo el módulo
5. **Feedback**: Probar con usuarios finales antes de confirmar

---

**Versión de Lucide React en el proyecto**: `0.294.0` (verificado)
**Total de iconos disponibles**: ~1400+
**Iconos HSEQ actualmente en uso**: 12 únicos
